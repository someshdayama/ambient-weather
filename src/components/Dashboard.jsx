import React, { Suspense, lazy, useMemo } from 'react';
import { Droplet, Sun, Thermometer, Umbrella, Activity, Gauge, Eye, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from './MetricCard';
import ForecastParallaxCard from './ForecastParallaxCard';
import {
    AQI_BANDS,
    getAqiInfo,
    getWindDirection,
    getPressureInfo,
    getVisibilityLabel,
    getUvAdvice,
    parseLocalTime,
    locationNowMs,
    formatClock,
    toTemp,
    toWind,
    windUnitLabel,
} from '../utils/weatherUtils';

// Leaflet + tiles are ~40% of the JS: load the map only when the dashboard renders it.
const WeatherMap = lazy(() => import('./WeatherMap'));

const TRACK = 'rgba(255,255,255,0.08)';

const Bar = ({ value, color = '#ffffff', glow = false }) => (
    <div className="bar-track" style={{ background: TRACK }}>
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="bar-fill"
            style={{ background: color, boxShadow: glow ? `0 0 8px ${color}` : 'none' }}
        />
    </div>
);

const Scale = ({ labels }) => (
    <div className="scale-labels" aria-hidden="true">
        {labels.map((l) => <span key={l}>{l}</span>)}
    </div>
);

const Pill = ({ color, children }) => (
    <div className="pill" style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>{children}</div>
);

// ── AQI 24h trend ────────────────────────────────────────────────────────────
const AqiTrend = ({ hourly, nowMs }) => {
    const slice = useMemo(() => {
        if (!hourly?.time?.length) return [];
        const times = hourly.time.map(parseLocalTime);
        let start = times.findIndex((t) => t > nowMs) - 1;
        if (start < 0) start = 0;
        return times.slice(start, start + 24).map((t, i) => ({ t, v: hourly.us_aqi[start + i] })).filter((p) => p.v != null);
    }, [hourly, nowMs]);

    if (slice.length < 2) return null;
    const max = Math.max(100, ...slice.map((p) => p.v));
    const peak = slice.reduce((a, b) => (b.v > a.v ? b : a));
    const peakInfo = getAqiInfo(peak.v);

    return (
        <div className="aqi-trend">
            <div className="aqi-trend-head">
                <span>Next 24 h</span>
                <span>
                    Peak <strong style={{ color: peakInfo.color }}>{Math.round(peak.v)}</strong> at {formatClock(peak.t, { hour: 'numeric', hour12: true })}
                </span>
            </div>
            <div className="aqi-trend-bars" role="img" aria-label={`Air quality next 24 hours, peaking at ${Math.round(peak.v)} (${peakInfo.label})`}>
                {slice.map((p) => (
                    <div
                        key={p.t}
                        className="aqi-trend-bar"
                        style={{ height: `${Math.max(6, (p.v / max) * 100)}%`, background: getAqiInfo(p.v).color, opacity: 0.85 }}
                        title={`${formatClock(p.t, { hour: 'numeric', hour12: true })}: ${Math.round(p.v)}`}
                    />
                ))}
            </div>
        </div>
    );
};

// ── Wind Compass ─────────────────────────────────────────────────────────────
const WindCompass = ({ speed, direction, unit }) => {
    const dir = direction ?? 0;
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    return (
        <div className="wind-compass">
            <div style={{ position: 'relative', width: '90px', height: '90px' }} aria-hidden="true">
                <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <circle cx="45" cy="45" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                        const rad = (deg - 90) * (Math.PI / 180);
                        return (
                            <line
                                key={deg}
                                x1={45 + 38 * Math.cos(rad)} y1={45 + 38 * Math.sin(rad)}
                                x2={45 + 32 * Math.cos(rad)} y2={45 + 32 * Math.sin(rad)}
                                stroke="rgba(255,255,255,0.25)" strokeWidth={i % 2 === 0 ? 1.5 : 0.8} strokeLinecap="round"
                            />
                        );
                    })}
                    <motion.g
                        initial={{ rotate: 0 }}
                        animate={{ rotate: dir }}
                        transition={{ type: 'spring', stiffness: 40, damping: 14 }}
                        style={{ transformOrigin: '45px 45px' }}
                    >
                        <polygon points="45,12 48,45 45,40 42,45" fill="#ffffff" />
                        <polygon points="45,78 48,45 45,50 42,45" fill="rgba(255,255,255,0.3)" />
                    </motion.g>
                    <circle cx="45" cy="45" r="4" fill="white" />
                </svg>

                {cardinals.map((c, i) => {
                    const rad = (i * 45 - 90) * (Math.PI / 180);
                    return (
                        <div
                            key={c}
                            className="compass-label"
                            style={{
                                left: `${45 + 50 * Math.cos(rad) - 5}px`,
                                top: `${45 + 50 * Math.sin(rad) + 4}px`,
                                color: c === 'N' ? '#ffffff' : 'rgba(255,255,255,0.45)',
                            }}
                        >
                            {c}
                        </div>
                    );
                })}
            </div>

            <div style={{ textAlign: 'center' }}>
                <div className="metric-value-md">
                    {toWind(speed, unit)} <span className="metric-unit">{windUnitLabel(unit)}</span>
                </div>
                <div className="metric-sub">from {getWindDirection(dir)}</div>
            </div>
        </div>
    );
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="glass-panel skeleton-card" aria-hidden="true">
        <div className="skeleton" style={{ height: '16px', width: '40%' }} />
        <div className="skeleton" style={{ height: '50px', width: '60%', marginTop: '8px' }} />
        <div className="skeleton" style={{ height: '8px', width: '100%', marginTop: 'auto' }} />
    </div>
);

const MapFallback = () => <div className="map-shell skeleton" aria-label="Loading map" />;

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ weatherData, unit, onLocationSelect, onGpsRequest, gpsState, loading, favorites = [], location }) => {
    if (loading || !weatherData) {
        return (
            <main className="dashboard-container" aria-busy="true">
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="skeleton" style={{ height: '20px', width: '200px', marginBottom: '1.5rem' }} />
                    <div className="skeleton" style={{ height: '160px', width: '100%' }} />
                </div>
                <div className="metric-grid">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </main>
        );
    }

    const { current, hourly, daily, aqi, aqiHourly, utc_offset_seconds: utcOffset } = weatherData;
    const nowMs = locationNowMs(utcOffset ?? 0);
    const aqiInfo = getAqiInfo(aqi);
    const uvInfo = getUvAdvice(current.uv_index || 0);

    const pressureHpa = current.surface_pressure;
    const pressureInfo = getPressureInfo(pressureHpa);
    const pressureProgress = pressureHpa ? (pressureHpa - 950) / 100 : 0;

    const visibilityM = current.visibility;
    const visibilityKm = visibilityM != null ? (visibilityM / 1000).toFixed(1) : null;
    const visLabel = getVisibilityLabel(visibilityM);

    const feelsLikeDisplay = toTemp(current.apparent_temperature, unit);
    const feelsLikeProgress = current.apparent_temperature / 50;
    const feelsHot = current.apparent_temperature >= 40;

    const rainToday = daily.precipitation_probability_max[0] ?? 0;

    // Use the location we asked for (stable) rather than Open-Meteo's snapped grid point.
    const mapLat = location?.lat ?? weatherData.latitude;
    const mapLon = location?.lon ?? weatherData.longitude;

    return (
        <main className="dashboard-container">
            <div className="ambient-glow" aria-hidden="true" />

            <ForecastParallaxCard hourlyData={hourly} dailyData={daily} unit={unit} currentTime={current.time} />

            <section style={{ position: 'relative', zIndex: 10 }} aria-labelledby="conditions-title">
                <h3 id="conditions-title" className="section-title">Current Conditions</h3>

                <div className="metric-grid">
                    <MetricCard title="Air Quality" icon={Activity} delay={0.05}>
                        <div className="metric-row">
                            <div className="metric-value-lg">{aqi != null ? Math.round(aqi) : '—'}</div>
                            <Pill color={aqiInfo.color}>{aqiInfo.short}</Pill>
                        </div>
                        <div className="metric-sub">US AQI{aqiInfo.index >= 2 ? ` · ${aqiInfo.label}` : ''}</div>
                        <AqiTrend hourly={aqiHourly} nowMs={nowMs} />
                        <div style={{ marginTop: 'auto', paddingTop: '0.9rem' }}>
                            <div className="aqi-scale" aria-hidden="true">
                                {AQI_BANDS.map((r, i) => (
                                    <div
                                        key={r.label}
                                        style={{
                                            flex: r.max - r.min,
                                            background: i <= aqiInfo.index ? r.color : TRACK,
                                            boxShadow: i === aqiInfo.index ? `0 0 8px ${r.color}` : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                            <Scale labels={['0', '50', '100', '150', '200', '300', '500']} />
                        </div>
                    </MetricCard>

                    <MetricCard title="Wind" icon={Compass} delay={0.1}>
                        <WindCompass speed={current.wind_speed_10m} direction={current.wind_direction_10m} unit={unit} />
                    </MetricCard>

                    <MetricCard title="Humidity" icon={Droplet} delay={0.15}>
                        <div className="metric-body">
                            <div className="metric-value-lg">
                                {current.relative_humidity_2m}<span className="metric-unit-lg">%</span>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Bar value={current.relative_humidity_2m / 100} />
                                <Scale labels={['Dry', 'Comfortable', 'Humid']} />
                            </div>
                        </div>
                    </MetricCard>

                    <MetricCard title="UV Index" icon={Sun} delay={0.2}>
                        <div className="metric-body">
                            <div className="metric-row">
                                <div className="metric-value-lg">{Math.round(current.uv_index || 0)}</div>
                                <Pill color={uvInfo.color}>{uvInfo.label}</Pill>
                            </div>
                            <div className="metric-sub">{uvInfo.advice}</div>
                            <div className="uv-steps" aria-hidden="true">
                                {[-1, 2, 5, 7, 10].map((threshold, i) => {
                                    const active = (current.uv_index || 0) > threshold;
                                    const color = i >= 4 ? '#ef4444' : i >= 2 ? '#f59e0b' : '#ffffff';
                                    return <div key={threshold} style={{ background: active ? color : TRACK }} />;
                                })}
                            </div>
                            <Scale labels={['Low', 'Mod', 'High', 'V.High', 'Ext']} />
                        </div>
                    </MetricCard>

                    <MetricCard title="Feels Like" icon={Thermometer} delay={0.25}>
                        <div className="metric-body">
                            <div className="metric-value-lg" style={{ color: feelsHot ? '#f59e0b' : undefined }}>{feelsLikeDisplay}°</div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Bar value={feelsLikeProgress} color={feelsHot ? '#f59e0b' : '#ffffff'} />
                                <Scale labels={unit === 'F' ? ['32°F', '122°F'] : ['0°C', '50°C']} />
                            </div>
                        </div>
                    </MetricCard>

                    <MetricCard title="Rain Chance" icon={Umbrella} delay={0.3}>
                        <div className="metric-body">
                            <div className="metric-value-lg">
                                {rainToday}<span className="metric-unit-lg">%</span>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Bar value={rainToday / 100} />
                                <Scale labels={['0%', '50%', '100%']} />
                            </div>
                        </div>
                    </MetricCard>

                    {pressureHpa != null && (
                        <MetricCard title="Pressure" icon={Gauge} delay={0.35}>
                            <div className="metric-body">
                                <div className="metric-row">
                                    <div className="metric-value-md">{Math.round(pressureHpa)}</div>
                                    <div className="metric-unit">hPa</div>
                                    <div style={{ marginLeft: 'auto' }}><Pill color={pressureInfo.color}>{pressureInfo.label}</Pill></div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <Bar value={pressureProgress} color={pressureInfo.color} />
                                    <Scale labels={['950', '1000', '1050']} />
                                </div>
                            </div>
                        </MetricCard>
                    )}

                    {visibilityKm != null && (
                        <MetricCard title="Visibility" icon={Eye} delay={0.4}>
                            <div className="metric-body">
                                <div className="metric-row">
                                    <div className="metric-value-md">{visibilityKm}</div>
                                    <div className="metric-unit">km</div>
                                    <div style={{ marginLeft: 'auto' }}><Pill color="#ffffff">{visLabel}</Pill></div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <Bar value={visibilityM / 10000} />
                                    <Scale labels={['0 km', '5 km', '10+ km']} />
                                </div>
                            </div>
                        </MetricCard>
                    )}
                </div>
            </section>

            <section style={{ position: 'relative', zIndex: 10, marginBottom: '1rem' }} aria-labelledby="map-title">
                <h3 id="map-title" className="section-title">Map &amp; Radar</h3>
                <Suspense fallback={<MapFallback />}>
                    <WeatherMap
                        lat={mapLat}
                        lon={mapLon}
                        onLocationSelect={onLocationSelect}
                        onGpsRequest={onGpsRequest}
                        gpsState={gpsState}
                        favorites={favorites}
                    />
                </Suspense>
            </section>
        </main>
    );
};

export default Dashboard;
