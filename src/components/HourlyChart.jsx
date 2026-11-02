import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import WeatherIcon from './WeatherIcon';
import { parseLocalTime, formatClock, toTemp } from '../utils/weatherUtils';

const HOURS = 24;
const H = 210;
const PAD_X = 22;
const TOP = 58; // time + icon rows
const LINE_TOP = TOP + 26; // room for temp labels
const LINE_H = 62;
const RAIN_TOP = LINE_TOP + LINE_H + 14;
const RAIN_H = 26;

const smoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[Math.max(0, i - 1)];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
        d += ` C ${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
    }
    return d;
};

/** Is a wall-clock hour daytime? Prefer API is_day, else compare with that date's sunrise/sunset. */
const dayFlag = (hourly, daily, i, ms) => {
    if (hourly.is_day?.[i] != null) return hourly.is_day[i];
    const date = hourly.time[i].slice(0, 10);
    const d = daily?.time?.indexOf(date) ?? -1;
    if (d < 0) return 1;
    return ms >= parseLocalTime(daily.sunrise[d]) && ms < parseLocalTime(daily.sunset[d]) ? 1 : 0;
};

/**
 * 24 h temperature line (real-pixel SVG so labels stay ≥12px), with time + day/night icon
 * every 3 h and rain-chance bars under the line.
 */
const HourlyChart = ({ hourlyData, dailyData, unit, currentTime }) => {
    const wrapRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [hover, setHover] = useState(null);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const slice = useMemo(() => {
        if (!hourlyData?.time?.length) return null;
        const nowMs = parseLocalTime(currentTime);
        const idx = hourlyData.time.findIndex((t) => parseLocalTime(t) > nowMs);
        if (idx === -1) return null;
        const start = Math.max(0, idx - 1);
        return hourlyData.time.slice(start, start + HOURS).map((t, k) => {
            const i = start + k;
            const ms = parseLocalTime(t);
            return {
                ms,
                temp: toTemp(hourlyData.temperature_2m[i], unit),
                rain: hourlyData.precipitation_probability?.[i] ?? 0,
                code: hourlyData.weather_code?.[i],
                isDay: dayFlag(hourlyData, dailyData, i, ms),
            };
        });
    }, [hourlyData, dailyData, unit, currentTime]);

    if (!slice) return <p className="t-secondary" style={{ padding: '2rem 0', textAlign: 'center' }}>Hourly forecast unavailable</p>;

    const n = slice.length;
    const innerW = Math.max(1, width - PAD_X * 2);
    const xAt = (i) => PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const temps = slice.map((s) => s.temp);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const range = maxT - minT || 1;
    const yAt = (t) => LINE_TOP + LINE_H - ((t - minT) / range) * LINE_H;
    const pts = slice.map((s, i) => [xAt(i), yAt(s.temp)]);
    const line = smoothPath(pts);
    const area = pts.length ? `${line} L ${pts[n - 1][0]},${LINE_TOP + LINE_H + 6} L ${pts[0][0]},${LINE_TOP + LINE_H + 6} Z` : '';
    const every = width < 520 ? 4 : 3;
    const labelIdx = slice.map((_, i) => i).filter((i) => i % every === 0);
    const barW = Math.max(2, innerW / n - 3);

    const onMove = (e) => {
        const rect = wrapRef.current.getBoundingClientRect();
        const i = Math.round(((e.clientX - rect.left - PAD_X) / innerW) * (n - 1));
        setHover(Math.max(0, Math.min(n - 1, i)));
    };

    const timeLabel = (i) => (i === 0 ? 'Now' : formatClock(slice[i].ms, { hour: 'numeric', hour12: true }));
    const peakRain = Math.max(...slice.map((s) => s.rain));

    return (
        <div
            ref={wrapRef}
            className="hourly-chart"
            style={{ height: H }}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
        >
            {width > 0 && (
                <svg width={width} height={H} role="img" aria-label={`Next 24 hours: ${temps[0]}° now, high ${maxT}°, low ${minT}°. Highest rain chance ${peakRain}%.`}>
                    <defs>
                        <linearGradient id="hourlyArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {labelIdx.map((i) => (
                        <g key={`h${i}`}>
                            <text x={xAt(i)} y={14} textAnchor="middle" className={`chart-time ${i === 0 ? 'now' : ''}`}>{timeLabel(i)}</text>
                            <foreignObject x={xAt(i) - 10} y={24} width={20} height={20}>
                                <WeatherIcon code={slice[i].code} isDay={slice[i].isDay} size={20} strokeWidth={1.5} />
                            </foreignObject>
                        </g>
                    ))}

                    <path d={area} fill="url(#hourlyArea)" />
                    <motion.path
                        d={line}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />

                    {labelIdx.map((i) => (
                        <g key={`p${i}`}>
                            <circle cx={pts[i][0]} cy={pts[i][1]} r="3.5" fill="#ffffff" stroke="#000" strokeWidth="1.5" />
                            <text x={pts[i][0]} y={pts[i][1] - 10} textAnchor="middle" className="chart-temp">{slice[i].temp}°</text>
                        </g>
                    ))}

                    {/* Rain chance bars (per hour) */}
                    {slice.map((s, i) => {
                        const h = (s.rain / 100) * RAIN_H;
                        return (
                            <rect
                                key={`r${i}`}
                                x={xAt(i) - barW / 2}
                                y={RAIN_TOP + RAIN_H - h}
                                width={barW}
                                height={Math.max(h, 1)}
                                rx="1.5"
                                fill="#ffffff"
                                opacity={s.rain >= 30 ? 0.75 : 0.22}
                            />
                        );
                    })}
                    {labelIdx.map((i) =>
                        slice[i].rain >= 30 ? (
                            <text key={`rl${i}`} x={xAt(i)} y={RAIN_TOP + RAIN_H + 14} textAnchor="middle" className="chart-rain">{slice[i].rain}%</text>
                        ) : null,
                    )}
                    {peakRain < 30 && (
                        <text x={width / 2} y={RAIN_TOP + RAIN_H + 14} textAnchor="middle" className="chart-rain-legend">Rain chance below 30% for the next 24 h</text>
                    )}

                    {hover != null && (
                        <line x1={xAt(hover)} x2={xAt(hover)} y1={LINE_TOP - 6} y2={RAIN_TOP + RAIN_H} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
                    )}
                    {hover != null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="#ffffff" />}
                </svg>
            )}

            {hover != null && width > 0 && (
                <div className="chart-tooltip" style={{ left: Math.min(Math.max(xAt(hover), 70), width - 70), top: LINE_TOP - 14 }}>
                    <strong>{slice[hover].temp}°</strong>
                    <span className="t-secondary">{timeLabel(hover)}</span>
                    <span>Rain {slice[hover].rain}%</span>
                </div>
            )}
        </div>
    );
};

export default HourlyChart;
