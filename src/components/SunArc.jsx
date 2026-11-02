import { Sun, Moon } from 'lucide-react';
import { parseLocalTime, formatClock, getDaylightInfo } from '../utils/weatherUtils';

const W = 220;
const H = 70;
const R_X = 95;
const R_Y = 52;
const CX = W / 2;
const BASE = 62;

/** Compact sunrise → sunset arc with day length / daylight left. Placeholder until data exists. */
const SunArc = ({ daily, nowMs, className = '' }) => {
    const sunrise = parseLocalTime(daily?.sunrise?.[0]);
    const sunset = parseLocalTime(daily?.sunset?.[0]);
    const nextSunrise = parseLocalTime(daily?.sunrise?.[1]);
    const info = getDaylightInfo(sunrise, sunset, nowMs, nextSunrise);

    if (!info) {
        return (
            <div className={`sun-arc ${className}`} aria-hidden="true">
                <div className="skeleton" style={{ width: W, height: H, borderRadius: 16 }} />
                <div className="skeleton" style={{ width: 160, height: 14, marginTop: 12 }} />
            </div>
        );
    }

    let progress;
    if (info.isDay) progress = (nowMs - sunrise) / (sunset - sunrise);
    else {
        const prevSunset = nowMs < sunrise ? sunset - 86400000 : sunset;
        const next = nowMs < sunrise ? sunrise : Number.isFinite(nextSunrise) ? nextSunrise : sunrise + 86400000;
        progress = (nowMs - prevSunset) / (next - prevSunset);
    }
    progress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
    const angle = Math.PI - progress * Math.PI;
    const x = CX + R_X * Math.cos(angle);
    const y = BASE - R_Y * Math.sin(angle);

    const left = info.isDay ? { label: 'Sunrise', time: formatClock(sunrise) } : { label: 'Sunset', time: formatClock(nowMs < sunrise ? sunset - 86400000 : sunset) };
    const right = info.isDay ? { label: 'Sunset', time: formatClock(sunset) } : { label: 'Sunrise', time: formatClock(nowMs < sunrise ? sunrise : nextSunrise) };

    return (
        <div className={`sun-arc ${className}`} role="img" aria-label={`${left.label} ${left.time}, ${right.label} ${right.time}. ${info.text}. Day length ${info.dayLength}.`}>
            <div className="sun-arc-graphic" style={{ width: W, height: H }} aria-hidden="true">
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                    <path
                        d={`M ${CX - R_X} ${BASE} A ${R_X} ${R_Y} 0 0 1 ${CX + R_X} ${BASE}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                        strokeDasharray="3 5"
                        strokeLinecap="round"
                    />
                    <line x1="8" y1={BASE} x2={W - 8} y2={BASE} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                </svg>
                <div className={`sun-orb ${info.isDay ? 'day' : 'night'}`} style={{ left: x - 11, top: y - 11 }}>
                    {info.isDay ? <Sun size={12} color="#000" fill="#000" /> : <Moon size={12} color="#000" fill="#000" />}
                </div>
            </div>
            <div className="sun-arc-times" style={{ width: W }}>
                <span><span className="t-secondary">{left.label}</span> {left.time}</span>
                <span><span className="t-secondary">{right.label}</span> {right.time}</span>
            </div>
            <div className="sun-arc-info">
                {info.text} · <span className="t-secondary">Day length {info.dayLength}</span>
            </div>
        </div>
    );
};

export default SunArc;
