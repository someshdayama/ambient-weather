// Fails CI if the JS needed for first paint grows past the budget (gzip bytes).
// "Initial" = every JS chunk referenced from dist/index.html (entry + its static imports).
// Lazy chunks (e.g. the Leaflet map) get their own, looser budget.
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist';
const INITIAL_BUDGET_KB = Number(process.env.INITIAL_JS_BUDGET_KB ?? 130);
const LAZY_CHUNK_BUDGET_KB = Number(process.env.LAZY_CHUNK_BUDGET_KB ?? 80);

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const initial = new Set([...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]));

const gz = (file) => gzipSync(readFileSync(join(DIST, file))).length / 1024;
const jsFiles = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => `assets/${f}`);

let initialKb = 0;
let failed = false;
for (const f of jsFiles) {
    const kb = gz(f);
    const isInitial = initial.has(f);
    if (isInitial) initialKb += kb;
    else if (kb > LAZY_CHUNK_BUDGET_KB) {
        console.error(`✗ lazy chunk ${f} is ${kb.toFixed(1)} kB gzip (budget ${LAZY_CHUNK_BUDGET_KB} kB)`);
        failed = true;
    }
    console.log(`${isInitial ? 'initial' : 'lazy   '}  ${kb.toFixed(1).padStart(6)} kB  ${f}`);
}

console.log(`\nInitial JS: ${initialKb.toFixed(1)} kB gzip (budget ${INITIAL_BUDGET_KB} kB)`);
if (initialKb > INITIAL_BUDGET_KB) {
    console.error('✗ initial JS over budget');
    failed = true;
}
process.exit(failed ? 1 : 0);
