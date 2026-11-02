// ── Weather code → text / theme / icon ───────────────────────────────────────
export const getWeatherDetails = (code, isDay = 1) => {
    const weatherMap = {
        0: { text: 'Clear sky', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        1: { text: 'Mainly clear', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        2: { text: 'Partly cloudy', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'CloudSun' },
        3: { text: 'Overcast', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'Cloud' },
        45: { text: 'Fog', theme: 'fog', icon: 'CloudFog' },
        48: { text: 'Depositing rime fog', theme: 'fog', icon: 'CloudFog' },
        51: { text: 'Light drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        53: { text: 'Moderate drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        55: { text: 'Dense drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        61: { text: 'Slight rain', theme: 'rain', icon: 'CloudRain' },
        63: { text: 'Moderate rain', theme: 'rain', icon: 'CloudRain' },
        65: { text: 'Heavy rain', theme: 'rain', icon: 'CloudRain' },
        71: { text: 'Slight snow', theme: 'snow', icon: 'CloudSnow' },
        73: { text: 'Moderate snow', theme: 'snow', icon: 'CloudSnow' },
        75: { text: 'Heavy snow', theme: 'snow', icon: 'CloudSnow' },
        77: { text: 'Snow grains', theme: 'snow', icon: 'CloudSnow' },
        80: { text: 'Slight rain showers', theme: 'rain', icon: 'CloudRain' },
        81: { text: 'Moderate rain showers', theme: 'rain', icon: 'CloudRain' },
        82: { text: 'Violent rain showers', theme: 'storm', icon: 'CloudLightning' },
        95: { text: 'Thunderstorm', theme: 'storm', icon: 'CloudLightning' },
        96: { text: 'Thunderstorm with slight hail', theme: 'storm', icon: 'CloudLightning' },
        99: { text: 'Thunderstorm with heavy hail', theme: 'storm', icon: 'CloudLightning' },
    };

    return weatherMap[code] || { text: 'Unknown', theme: isDay ? 'clear-day' : 'clear-night', icon: 'Sun' };
};

// ── Time handling ────────────────────────────────────────────────────────────
// Open-Meteo (timezone=auto) returns wall-clock strings in the *location's* zone,
// e.g. "2026-11-02T14:15" or "2026-11-02". We never hand these to `new Date(str)`
// (implementation-defined, historically broken in Safari). Instead we parse the
// components into a "location wall-clock" timestamp expressed in UTC ms, and format
// it back with timeZone: 'UTC'. Device timezone never leaks in.

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM[:SS]" → wall-clock ms (UTC-based). NaN if invalid. */
export const parseLocalTime = (str) => {
    if (typeof str !== 'string') return NaN;
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return NaN;
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
    return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
};

/** Current wall-clock time at the location, in the same UTC-based ms space as parseLocalTime. */
export const locationNowMs = (utcOffsetSeconds = 0, now = Date.now()) => now + utcOffsetSeconds * 1000;

/** Format a wall-clock ms (from parseLocalTime / locationNowMs) as e.g. "6:42 AM". */
export const formatClock = (ms, opts = { hour: 'numeric', minute: '2-digit', hour12: true }) =>
    Number.isFinite(ms) ? new Date(ms).toLocaleTimeString('en-US', { ...opts, timeZone: 'UTC' }) : '—';

/** "2026-11-02" → "Mon" (weekday of that calendar date, independent of device timezone). */
export const formatDay = (dateStr) => {
    const ms = parseLocalTime(dateStr);
    if (!Number.isFinite(ms)) return '—';
    return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

/** "just now", "5 min ago", "2 h ago", "3 d ago" */
export const formatAgo = (thenMs, now = Date.now()) => {
    if (!Number.isFinite(thenMs)) return '';
    const mins = Math.max(0, Math.floor((now - thenMs) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h ago`;
    return `${Math.floor(hrs / 24)} d ago`;
};

// ── Units ────────────────────────────────────────────────────────────────────
export const toTemp = (c, unit) => {
    if (c == null || Number.isNaN(c)) return null;
    return unit === 'F' ? Math.round((c * 9) / 5 + 32) : Math.round(c);
};

/** Wind arrives in km/h. °F mode shows mph. */
export const toWind = (kmh, unit) => {
    if (kmh == null || Number.isNaN(kmh)) return null;
    return unit === 'F' ? Math.round(kmh * 0.621371) : Math.round(kmh);
};
export const windUnitLabel = (unit) => (unit === 'F' ? 'mph' : 'km/h');

// ── Air quality (US EPA AQI) ─────────────────────────────────────────────────
// Colours: white when fine, amber → red only as it becomes a health concern.
export const AQI_BANDS = [
    { min: 0, max: 50, label: 'Good', color: '#ffffff' },
    { min: 51, max: 100, label: 'Moderate', color: '#fcd34d' },
    { min: 101, max: 150, label: 'Unhealthy for sensitive groups', short: 'Sensitive', color: '#f59e0b' },
    { min: 151, max: 200, label: 'Unhealthy', color: '#ef4444' },
    { min: 201, max: 300, label: 'Very unhealthy', color: '#dc2626' },
    { min: 301, max: 500, label: 'Hazardous', color: '#b91c1c' },
];

export const getAqiInfo = (aqi) => {
    if (aqi == null || Number.isNaN(aqi)) return { label: 'Unknown', short: 'Unknown', color: '#ffffff', index: -1 };
    const v = Math.max(0, Math.round(aqi));
    const index = AQI_BANDS.findIndex((b) => v <= b.max);
    const i = index === -1 ? AQI_BANDS.length - 1 : index;
    const band = AQI_BANDS[i];
    return { label: band.label, short: band.short || band.label, color: band.color, index: i };
};

// ── Nowcast (Open-Meteo minutely_15 precipitation) ───────────────────────────
const RAIN_MM = 0.1; // per 15 min slot

/**
 * Returns { state: 'raining'|'soon'|'dry'|'unknown', minutes, text }.
 * `times` are location wall-clock strings, `nowMs` from locationNowMs().
 */
export const getNowcast = (minutely, nowMs) => {
    const times = minutely?.time;
    const precip = minutely?.precipitation;
    if (!times?.length || !precip?.length || !Number.isFinite(nowMs)) {
        return { state: 'unknown', minutes: null, text: '' };
    }
    const slots = times
        .map((t, i) => ({ start: parseLocalTime(t), mm: precip[i] ?? 0 }))
        .filter((s) => Number.isFinite(s.start) && s.start + 15 * 60000 > nowMs); // slot not yet over
    if (!slots.length) return { state: 'unknown', minutes: null, text: '' };

    const horizonMin = Math.round((slots[slots.length - 1].start + 15 * 60000 - nowMs) / 60000);
    const wetNow = slots[0].start <= nowMs && slots[0].mm >= RAIN_MM;

    if (wetNow) {
        const dry = slots.find((s) => s.mm < RAIN_MM);
        if (!dry) return { state: 'raining', minutes: null, text: 'Rain for the next 2 h' };
        const m = Math.max(15, Math.round((dry.start - nowMs) / 60000 / 5) * 5);
        return { state: 'raining', minutes: m, text: `Rain stopping in ~${m} min` };
    }

    const wet = slots.find((s) => s.mm >= RAIN_MM);
    if (!wet) {
        const h = Math.max(1, Math.round(horizonMin / 60));
        return { state: 'dry', minutes: null, text: `No rain in the next ${h} h` };
    }
    const m = Math.max(5, Math.round((wet.start - nowMs) / 60000 / 5) * 5);
    return { state: 'soon', minutes: m, text: `Rain in ~${m} min` };
};

// ── Misc labels ──────────────────────────────────────────────────────────────
/** Converts a wind direction in degrees to a compass label */
export const getWindDirection = (degrees) => {
    if (degrees === null || degrees === undefined) return '—';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(degrees / 22.5) % 16];
};

const WHITE = '#ffffff';
const AMBER = '#f59e0b';
const RED = '#ef4444';

/** Returns a descriptive label + color for surface pressure in hPa */
export const getPressureInfo = (hPa) => {
    if (hPa === null || hPa === undefined) return { label: 'Unknown', color: WHITE };
    if (hPa < 990) return { label: 'Very Low', color: RED };
    if (hPa < 1005) return { label: 'Low', color: AMBER };
    if (hPa < 1020) return { label: 'Normal', color: WHITE };
    if (hPa < 1035) return { label: 'High', color: WHITE };
    return { label: 'Very High', color: AMBER };
};

/** Returns a visibility label */
export const getVisibilityLabel = (meters) => {
    if (meters === null || meters === undefined) return '—';
    const km = meters / 1000;
    if (km >= 10) return 'Excellent';
    if (km >= 5) return 'Good';
    if (km >= 2) return 'Moderate';
    if (km >= 1) return 'Poor';
    return 'Very Poor';
};

/** Returns UV index advice */
export const getUvAdvice = (uv) => {
    if (uv <= 2) return { label: 'Low', advice: 'No protection needed', color: WHITE };
    if (uv <= 5) return { label: 'Moderate', advice: 'Wear sunscreen', color: WHITE };
    if (uv <= 7) return { label: 'High', advice: 'Seek shade midday', color: AMBER };
    if (uv <= 10) return { label: 'Very High', advice: 'SPF 50+ essential', color: AMBER };
    return { label: 'Extreme', advice: 'Avoid sun exposure', color: RED };
};

/** Returns feels-like comparison string */
export const getFeelsLikeComparison = (actual, feelsLike) => {
    const diff = Math.round(feelsLike - actual);
    if (Math.abs(diff) <= 1) return 'Similar to actual';
    if (diff > 0) return `Feels ${diff}° hotter`;
    return `Feels ${Math.abs(diff)}° cooler`;
};
