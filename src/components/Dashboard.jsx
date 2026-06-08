import React from 'react';
import { Droplet, Wind, Sun, Thermometer, Umbrella, Activity, Gauge, Eye, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import HourlyChart from './HourlyChart';
import MetricCard from './MetricCard';
import WeatherMap from './WeatherMap';
import Forecast from './Forecast';
import ForecastParallaxCard from './ForecastParallaxCard';
import { getWindDirection, getPressureInfo, getVisibilityLabel, getUvAdvice } from '../utils/weatherUtils';

// ── AQI ──────────────────────────────────────────────────────────────────────
const aqiRanges = [
    { min: 0,   max: 50,  label: 'Very Good',  color: '#10b981' },
    { min: 50,  max: 100, label: 'Good',        color: '#84cc16' },
    { min: 100, max: 150, label: 'Bearable',    color: '#f59e0b' },
    { min: 150, max: 200, label: 'Bad',         color: '#f97316' },
    { min: 200, max: 300, label: 'Very Bad',    color: '#ef4444' },
    { min: 300, max: 500, label: 'Hazardous',   color: '#7c3aed' },
];

const getAqiData = (aqi) => {
    if (aqi == null) return { label: 'Unknown', color: '#94a3b8', rangeIndex: -1 };
    for (let i = 0; i < aqiRanges.length; i++) {
        if (aqi <= aqiRanges[i].max) return { label: aqiRanges[i].label, color: aqiRanges[i].color, rangeIndex: i };
    }
    return { label: 'Hazardous', color: '#7c3aed', rangeIndex: aqiRanges.length - 1 };
};

// ── Wind Compass ─────────────────────────────────────────────────────────────
const WindCompass = ({ speed, direction }) => {
    const dir = direction ?? 0;
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                {/* Compass ring */}
                <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                    <circle cx="45" cy="45" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    {/* Cardinal tick marks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                         const rad = (deg - 90) * (Math.PI / 180);
                         const x1 = 45 + 38 * Math.cos(rad);
                         const y1 = 45 + 38 * Math.sin(rad);
                         const x2 = 45 + 32 * Math.cos(rad);
                         const y2 = 45 + 32 * Math.sin(rad);
                         return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth={i % 2 === 0 ? 1.5 : 0.8} strokeLinecap="round" />;
                    })}
                    {/* Direction needle */}
                    <motion.g
                        initial={{ rotate: 0 }}
                        animate={{ rotate: dir }}
                        transition={{ type: 'spring', stiffness: 40, damping: 14 }}
                        style={{ transformOrigin: '45px 45px' }}
                    >
                        {/* North tip (accent colored needle) */}
                        <polygon points="45,12 48,45 45,40 42,45" fill="var(--accent-color)" opacity="0.95" style={{ filter: 'drop-shadow(0 0 4px var(--accent-color))' }} />
                        {/* South tip */}
                        <polygon points="45,78 48,45 45,50 42,45" fill="rgba(255,255,255,0.3)" />
                    </motion.g>
                    <circle cx="45" cy="45" r="4" fill="white" opacity="0.9" />
                </svg>

                {/* Cardinal labels */}
                {cardinals.map((c, i) => {
                    const deg = i * 45;
                    const rad = (deg - 90) * (Math.PI / 180);
                    const x = 45 + 50 * Math.cos(rad) - 5;
                    const y = 45 + 50 * Math.sin(rad) + 4;
                    return (
                        <div key={c} style={{
                            position: 'absolute',
                            left: `${x}px`,
                            top: `${y}px`,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            color: c === 'N' ? 'var(--accent-color)' : 'rgba(255,255,255,0.45)',
                            transform: 'translate(-50%, -50%)',
                            lineHeight: 1,
                        }}>{c}</div>
                    );
                })}
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
                    {Math.round(speed)} <span style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 500 }}>km/h</span>
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.55, marginTop: '4px' }}>{getWindDirection(dir)}</div>
            </div>
        </div>
    );
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="glass-panel" style={{ padding: '1.8rem', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton" style={{ height: '16px', width: '40%' }} />
        <div className="skeleton" style={{ height: '50px', width: '60%', marginTop: '8px' }} />
        <div className="skeleton" style={{ height: '8px', width: '100%', marginTop: 'auto' }} />
    </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ weatherData, unit, onLocationSelect, loading, favorites = [] }) => {
    const toUnit = (c) => unit === 'F' ? Math.round((c * 9 / 5) + 32) : Math.round(c);

    // When loading, show skeleton grid
    if (loading || !weatherData) {
        return (
            <div className="dashboard-container">
                {/* Hourly skeleton */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="skeleton" style={{ height: '20px', width: '200px', marginBottom: '1.5rem' }} />
                    <div className="skeleton" style={{ height: '160px', width: '100%' }} />
                </div>
                {/* Metric skeleton grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                {/* Forecast skeleton */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="skeleton" style={{ height: '20px', width: '160px', marginBottom: '1.5rem' }} />
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: '44px', marginBottom: '8px', borderRadius: '14px' }} />
                    ))}
                </div>
            </div>
        );
    }

    const { current, hourly, daily, aqi, latitude, longitude } = weatherData;
    const aqiInfo = getAqiData(aqi);
    const uvInfo  = getUvAdvice(current.uv_index || 0);

    // Wind gauge (half-arc) for wind speed
    const windProgress = Math.min((current.wind_speed_10m || 0) / 100, 1);

    // Pressure
    const pressureHpa = current.surface_pressure;
    const pressureInfo = getPressureInfo(pressureHpa);
    const pressureProgress = pressureHpa ? Math.min(Math.max((pressureHpa - 950) / 100, 0), 1) : 0;

    // Visibility
    const visibilityM  = current.visibility;
    const visibilityKm = visibilityM != null ? (visibilityM / 1000).toFixed(1) : null;
    const visibilityPct = visibilityM != null ? Math.min(visibilityM / 10000, 1) : 0;
    const visLabel = getVisibilityLabel(visibilityM);

    // Feels like
    const feelsLikeDisplay = toUnit(current.apparent_temperature);
    const feelsLikeProgress = Math.max(0, Math.min(current.apparent_temperature / 50, 1));

    const sectionTitle = (text) => (
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.3px', marginBottom: '1.2rem', opacity: 0.9 }}>{text}</h3>
    );

    return (
        <div className="dashboard-container">
            {/* Ambient glows — fixed position, no layout cost */}
            <div style={{ position: 'fixed', top: '-8%', right: '-4%', width: '480px', height: '480px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(110px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-8%', left: '18%', width: '560px', height: '560px', background: 'rgba(167,139,250,0.1)', borderRadius: '50%', filter: 'blur(140px)', zIndex: 0, pointerEvents: 'none' }} />

            {/* ── Combined Forecast Parallax Card ── */}
            <ForecastParallaxCard hourlyData={hourly} dailyData={daily} unit={unit} currentTime={current.time} />

            {/* ── Current Conditions Grid ── */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                {sectionTitle('Current Conditions')}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.4rem' }}>

                    {/* Air Quality */}
                    <MetricCard title="Air Quality" icon={Activity} delay={0.05}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: 'auto' }}>
                            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-2px' }}>
                                {aqi != null ? Math.round(aqi) : '—'}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: aqiInfo.color, padding: '3px 12px', borderRadius: '20px', background: `${aqiInfo.color}18`, border: `1px solid ${aqiInfo.color}35` }}>
                                {aqiInfo.label}
                            </div>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
                            <div style={{ display: 'flex', gap: '4px', width: '100%', position: 'relative' }}>
                                {aqiRanges.map((r, i) => (
                                    <div key={i} style={{ flex: r.max - r.min, height: '5px', background: i <= aqiInfo.rangeIndex ? r.color : 'rgba(255,255,255,0.08)', borderRadius: '3px', transition: 'background 0.6s ease', boxShadow: i === aqiInfo.rangeIndex ? `0 0 8px ${r.color}` : 'none' }} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                <span>0</span><span>100</span><span>200</span><span>300</span><span>500</span>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Wind Compass */}
                    <MetricCard title="Wind" icon={Compass} delay={0.1}>
                        <WindCompass speed={current.wind_speed_10m} direction={current.wind_direction_10m} />
                    </MetricCard>

                    {/* Humidity */}
                    <MetricCard title="Humidity" icon={Droplet} delay={0.15}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {current.relative_humidity_2m}<span style={{ fontSize: '1.2rem', opacity: 0.6 }}>%</span>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${current.relative_humidity_2m}%` }}
                                        transition={{ duration: 0.9, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-color), #60a5fa)', borderRadius: '4px', boxShadow: '0 0 8px var(--accent-glow)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                    <span>Dry</span><span>Comfortable</span><span>Humid</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* UV Index */}
                    <MetricCard title="UV Index" icon={Sun} delay={0.2}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: 'auto' }}>
                                <div style={{ fontSize: '2.8rem', fontWeight: 700 }}>{Math.round(current.uv_index || 0)}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: uvInfo.color, padding: '3px 10px', borderRadius: '12px', background: `${uvInfo.color}18`, border: `1px solid ${uvInfo.color}35` }}>
                                    {uvInfo.label}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '6px' }}>{uvInfo.advice}</div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '5px' }}>
                                {[0, 1, 2, 3, 4].map(i => {
                                    const thresholds = [-1, 2, 5, 7, 10];
                                    const active = (current.uv_index || 0) > thresholds[i];
                                    return <div key={i} style={{ flex: 1, height: '6px', borderRadius: '3px', background: active ? `hsl(${40 - i * 8}, 90%, 55%)` : 'rgba(255,255,255,0.08)', boxShadow: active ? `0 0 6px hsl(${40 - i * 8}, 90%, 55%)` : 'none', transition: 'all 0.5s ease' }} />;
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '5px', opacity: 0.38 }}>
                                <span>Low</span><span>Mod</span><span>High</span><span>V.High</span><span>Ext</span>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Feels Like */}
                    <MetricCard title="Feels Like" icon={Thermometer} delay={0.25}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {feelsLikeDisplay}°
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${feelsLikeProgress * 100}%` }}
                                        transition={{ duration: 0.9, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #f97316)', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                    <span>{unit === 'F' ? '32°F' : '0°C'}</span><span>{unit === 'F' ? '122°F' : '50°C'}</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Chance of Rain */}
                    <MetricCard title="Rain Chance" icon={Umbrella} delay={0.3}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {daily.precipitation_probability_max[0]}<span style={{ fontSize: '1.1rem', opacity: 0.6 }}>%</span>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${daily.precipitation_probability_max[0]}%` }}
                                        transition={{ duration: 0.9, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #818cf8)', borderRadius: '4px', boxShadow: '0 0 8px rgba(96,165,250,0.4)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                    <span>0%</span><span>50%</span><span>100%</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Pressure */}
                    {pressureHpa != null && (
                        <MetricCard title="Pressure" icon={Gauge} delay={0.35}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: 'auto' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
                                        {Math.round(pressureHpa)}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 500 }}>hPa</div>
                                    <div style={{ fontSize: '0.82rem', color: pressureInfo.color, fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: `${pressureInfo.color}18`, border: `1px solid ${pressureInfo.color}30`, marginLeft: 'auto' }}>
                                        {pressureInfo.label}
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pressureProgress * 100}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut' }}
                                            style={{ height: '100%', background: `linear-gradient(90deg, #60a5fa, ${pressureInfo.color})`, borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                        <span>950</span><span>1005</span><span>1050</span>
                                    </div>
                                </div>
                            </div>
                        </MetricCard>
                    )}

                    {/* Visibility */}
                    {visibilityKm != null && (
                        <MetricCard title="Visibility" icon={Eye} delay={0.4}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: 'auto' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
                                        {visibilityKm}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 500 }}>km</div>
                                    <div style={{ fontSize: '0.82rem', opacity: 0.7, fontWeight: 600, padding: '2px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', marginLeft: 'auto' }}>
                                        {visLabel}
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${visibilityPct * 100}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut' }}
                                            style={{ height: '100%', background: 'linear-gradient(90deg, #94a3b8, #e2e8f0)', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px', opacity: 0.4 }}>
                                        <span>0 km</span><span>5 km</span><span>10+ km</span>
                                    </div>
                                </div>
                            </div>
                        </MetricCard>
                    )}
                </div>
            </div>

            {/* ── Location Map ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                style={{ position: 'relative', zIndex: 10, marginBottom: '1rem' }}
            >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', opacity: 0.9 }}>Location Map</h3>
                <WeatherMap lat={latitude} lon={longitude} onLocationSelect={onLocationSelect} favorites={favorites} unit={unit} />
            </motion.div>
        </div>
    );
};

export default Dashboard;
