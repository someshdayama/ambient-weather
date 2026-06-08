import React, { useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, CloudSnow, Sun, CloudSun, Cloud, CloudDrizzle, CloudLightning, Moon, CloudFog } from 'lucide-react';

const WeatherIcons = { 0: Sun, 1: Sun, 2: CloudSun, 3: Cloud, 45: CloudFog, 48: CloudFog, 51: CloudDrizzle, 53: CloudDrizzle, 55: CloudDrizzle, 61: CloudRain, 63: CloudRain, 65: CloudRain, 71: CloudSnow, 73: CloudSnow, 75: CloudSnow, 80: CloudRain, 81: CloudRain, 82: CloudLightning, 95: CloudLightning, 96: CloudLightning, 99: CloudLightning };

/** Parse timestamp to local date milliseconds */
const parseTime = (s) => {
    const m = s.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
    return m ? new Date(m[1], m[2] - 1, m[3], m[4], m[5]).getTime() : new Date(s).getTime();
};

// SVG layout constants (defined outside component to avoid recreation)
const W = 860;
const H = 130;
const PAD_X = 30;
const PAD_Y = 20;
const chartW = W - PAD_X * 2;
const chartH = H - PAD_Y * 2;

/** Smooth cubic bezier spline path from an array of [x, y] points */
const smoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[Math.max(0, i - 1)];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = x1 + (x2 - x0) / 6;
        const cp1y = y1 + (y2 - y0) / 6;
        const cp2x = x2 - (x3 - x1) / 6;
        const cp2y = y2 - (y3 - y1) / 6;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    }
    return d;
};

const HourlyChart = ({ hourlyData, unit, currentTime }) => {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    const toUnit = useCallback((c) => unit === 'F' ? Math.round((c * 9 / 5) + 32) : Math.round(c), [unit]);

    const currentMs = useMemo(() => parseTime(currentTime), [currentTime]);
    
    const currentIndex = useMemo(() => {
        if (!hourlyData?.time) return -1;
        return hourlyData.time.findIndex(t => parseTime(t) > currentMs);
    }, [hourlyData, currentMs]);

    const startIndex = useMemo(() => Math.max(0, currentIndex - 1), [currentIndex]);

    const slice = useMemo(() => {
        if (currentIndex === -1 || !hourlyData?.time?.length) return null;
        const HOURS = 24;
        return {
            time:   hourlyData.time.slice(startIndex, startIndex + HOURS),
            temp:   hourlyData.temperature_2m.slice(startIndex, startIndex + HOURS),
            precip: hourlyData.precipitation_probability.slice(startIndex, startIndex + HOURS),
            code:   hourlyData.weather_code ? hourlyData.weather_code.slice(startIndex, startIndex + HOURS) : [],
        };
    }, [hourlyData, startIndex, currentIndex]);

    const temps = useMemo(() => {
        if (!slice) return [];
        return slice.temp.map(toUnit);
    }, [slice, toUnit]);

    const bounds = useMemo(() => {
        if (!temps.length) return { minT: 0, maxT: 0, range: 1 };
        const minT = Math.min(...temps);
        const maxT = Math.max(...temps);
        const range = maxT - minT || 1;
        return { minT, maxT, range };
    }, [temps]);

    const points = useMemo(() => {
        if (!temps.length) return [];
        const { minT, range } = bounds;
        return temps.map((t, i) => [
            PAD_X + (i / (temps.length - 1)) * chartW,
            PAD_Y + chartH - ((t - minT) / range) * chartH,
        ]);
    }, [temps, bounds]);

    const linePath = useMemo(() => smoothPath(points), [points]);
    
    const areaPath = useMemo(() => {
        if (!points.length) return '';
        return linePath + ` L ${points[points.length - 1][0]},${H} L ${PAD_X},${H} Z`;
    }, [linePath, points]);

    const handleMouseMove = useCallback((e) => {
        if (!slice || !points.length) return;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const relX = e.clientX - rect.left;
        const svgX = (relX / rect.width) * W;
        const idx = Math.round(((svgX - PAD_X) / chartW) * (temps.length - 1));
        const clamped = Math.max(0, Math.min(temps.length - 1, idx));
        const date = new Date(parseTime(slice.time[clamped]));
        const label = clamped === 0 ? 'Now' : date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        setTooltip({
            x: points[clamped][0],
            y: points[clamped][1],
            temp: temps[clamped],
            precip: slice.precip[clamped],
            label,
            svgPctX: (points[clamped][0] / W) * 100,
        });
    }, [temps, points, slice]);

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    if (!slice) {
        return <div style={{ opacity: 0.5, padding: '2rem', textAlign: 'center' }}>Forecast data unavailable</div>;
    }

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Hour labels row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', paddingLeft: `${PAD_X}px`, paddingRight: `${PAD_X}px` }}>
                {slice.time.filter((_, i) => i % 4 === 0).map((t, i) => {
                    const absI = i * 4;
                    const WeatherIcon = WeatherIcons[slice.code[absI]] || Sun;
                    const date = new Date(parseTime(t));
                    const label = absI === 0 ? 'Now' : date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '40px' }}>
                            <WeatherIcon size={16} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                            <span style={{ fontSize: '0.72rem', opacity: absI === 0 ? 1 : 0.55, fontWeight: absI === 0 ? 700 : 500 }}>{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* SVG Chart */}
            <div style={{ position: 'relative', width: '100%' }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stopColor="var(--accent-color)" stopOpacity="0.6" />
                            <stop offset="50%"  stopColor="var(--accent-color)" stopOpacity="1" />
                            <stop offset="100%" stopColor="var(--chart-line-end)" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%"   stopColor="var(--accent-color)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                        </linearGradient>
                        <filter id="lineShadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--accent-color)" floodOpacity="0.5" />
                        </filter>
                    </defs>

                    {/* Area fill */}
                    <motion.path
                        d={areaPath}
                        fill="url(#areaGrad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />

                    {/* Temperature line — animated stroke-dashoffset */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#lineShadow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ pathLength: { duration: 1.2, ease: 'easeOut' }, opacity: { duration: 0.3 } }}
                    />

                    {/* Data points — show every 4th */}
                    {points.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
                        <motion.circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="var(--accent-color)"
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="1.5"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.05, type: 'spring', stiffness: 200 }}
                            style={{ filter: 'drop-shadow(0 0 4px var(--accent-color))' }}
                        />
                    ))}

                    {/* Temp labels every 4 hours */}
                    {points.filter((_, i) => i % 4 === 0).map(([x, y], i) => (
                        <motion.text
                            key={`t${i}`}
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            fill="var(--text-primary)"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="Outfit, sans-serif"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.85 }}
                            transition={{ delay: 1 + i * 0.05 }}
                        >
                            {temps[i * 4]}°
                        </motion.text>
                    ))}

                    {/* Hover vertical line */}
                    {tooltip && (
                        <line
                            x1={tooltip.x} y1={PAD_Y}
                            x2={tooltip.x} y2={H}
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    )}

                    {/* Hover dot */}
                    {tooltip && (
                        <circle
                            cx={tooltip.x}
                            cy={tooltip.y}
                            r="5"
                            fill="white"
                            stroke="var(--accent-color)"
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0 0 6px var(--accent-color))' }}
                        />
                    )}
                </svg>

                {/* Tooltip */}
                {tooltip && (
                    <div
                        className="chart-tooltip"
                        style={{
                            position: 'absolute',
                            left: `${tooltip.svgPctX}%`,
                            top: `${(tooltip.y / H) * 100}%`,
                        }}
                    >
                        <span style={{ fontWeight: 700 }}>{tooltip.temp}°</span>
                        {tooltip.precip > 0 && (
                            <span style={{ color: '#60a5fa', marginLeft: '6px' }}>💧 {tooltip.precip}%</span>
                        )}
                        <span style={{ opacity: 0.6, marginLeft: '6px', fontSize: '0.7rem' }}>{tooltip.label}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HourlyChart;
