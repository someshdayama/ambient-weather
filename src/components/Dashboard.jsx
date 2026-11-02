import { Suspense, lazy, useMemo } from 'react';
import { Activity, Umbrella, Wind } from 'lucide-react';
import HourlyChart from './HourlyChart';
import WeekForecast from './WeekForecast';
import SunArc from './SunArc';
import {
    getAqiAdvice,
    getAqiInfo,
    getDewPointComfort,
    getFeelsLikeReason,
    getPressureInfo,
    getRainSummary,
    getUvAdvice,
    getVisibilityLabel,
    getWindDescription,
    getWindDirection,
    locationNowMs,
    parseLocalTime,
    formatClock,
    toTemp,
    toWind,
    windUnitLabel,
} from '../utils/weatherUtils';

// Leaflet + tiles are a big chunk: load the map only when the dashboard renders it.
const WeatherMap = lazy(() => import('./WeatherMap'));

const CardHead = ({ icon: Icon, title }) => (
    <div className="card-head">
        <h3 className="card-title">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" /> {title}
        </h3>
    </div>
);

// ── AQI card ─────────────────────────────────────────────────────────────────
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
    const tick = (i) => (i === 0 ? 'Now' : formatClock(slice[i].t, { hour: 'numeric', hour12: true }));
    const ticks = [0, 6, 12, 18].filter((i) => i < slice.length);

    return (
        <div className="aqi-trend">
            <div className="aqi-trend-head">
                <span className="t-secondary">Next 24 h</span>
                <span>
                    Worst <strong style={{ color: peakInfo.color }}>{Math.round(peak.v)}</strong> around {tick(slice.indexOf(peak))}
                </span>
            </div>
            <div className="aqi-trend-bars" role="img" aria-label={`Air quality over the next 24 hours, worst ${Math.round(peak.v)} (${peakInfo.label})`}>
                {slice.map((p) => (
                    <div key={p.t} className="aqi-trend-bar" style={{ height: `${Math.max(6, (p.v / max) * 100)}%`, background: getAqiInfo(p.v).color }} />
                ))}
            </div>
            <div className="aqi-trend-axis" aria-hidden="true">
                {ticks.map((i) => (
                    <span key={i} style={{ left: `${(i / (slice.length - 1)) * 100}%` }}>{tick(i)}</span>
                ))}
            </div>
        </div>
    );
};

const AqiCard = ({ aqi, aqiHourly, nowMs }) => {
    const info = getAqiInfo(aqi);
    return (
        <section className="glass-panel card" aria-label="Air quality">
            <CardHead icon={Activity} title="Air quality" />
            <div className="card-value-row">
                <span className="value-lg" style={{ color: info.index >= 2 ? info.color : undefined }}>{aqi != null ? Math.round(aqi) : '—'}</span>
                <span className="value-label" style={{ color: info.index >= 1 ? info.color : undefined }}>{info.label}</span>
            </div>
            <p className="card-text">{getAqiAdvice(info.index)}</p>
            <AqiTrend hourly={aqiHourly} nowMs={nowMs} />
            <p className="card-foot t-secondary">US AQI: 0–50 good, 51–100 moderate, above 100 unhealthy for some.</p>
        </section>
    );
};

// ── Rain card ────────────────────────────────────────────────────────────────
const RainCard = ({ hourly, daily, nowMs }) => {
    const rain = getRainSummary(hourly, nowMs, daily?.precipitation_probability_max?.[0]);
    const chance = rain.chance ?? 0;
    return (
        <section className="glass-panel card" aria-label="Rain">
            <CardHead icon={Umbrella} title="Rain" />
            <div className="card-value-row">
                <span className="value-lg">{chance}<span className="value-unit">%</span></span>
            </div>
            <p className="card-text">{rain.text}</p>
            <div className="meter" aria-hidden="true"><div className="meter-fill" style={{ width: `${chance}%` }} /></div>
            <p className="card-foot t-secondary">Highest chance of rain for the rest of today.</p>
        </section>
    );
};

// ── Wind card ────────────────────────────────────────────────────────────────
const WindCard = ({ speed, gusts, direction, unit }) => {
    const dir = direction ?? 0;
    return (
        <section className="glass-panel card" aria-label="Wind">
            <CardHead icon={Wind} title="Wind" />
            <div className="wind-body">
                <div className="card-value-col">
                    <span className="value-lg">{toWind(speed, unit)}<span className="value-unit"> {windUnitLabel(unit)}</span></span>
                    <span className="card-text">{getWindDescription(speed)}</span>
                    <span className="card-text t-secondary">From the {getWindDirection(dir)}</span>
                    {gusts != null && <span className="card-text t-secondary">Gusts {toWind(gusts, unit)} {windUnitLabel(unit)}</span>}
                </div>
                <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" className="compass">
                    <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    {[0, 90, 180, 270].map((deg) => {
                        const rad = (deg - 90) * (Math.PI / 180);
                        return <line key={deg} x1={44 + 40 * Math.cos(rad)} y1={44 + 40 * Math.sin(rad)} x2={44 + 34 * Math.cos(rad)} y2={44 + 34 * Math.sin(rad)} stroke="#fff" strokeWidth="1.5" />;
                    })}
                    <text x="44" y="17" textAnchor="middle" className="compass-n">N</text>
                    {/* Arrow points where the wind is blowing TO (from `dir`). */}
                    <g transform={`rotate(${dir + 180} 44 44)`}>
                        <line x1="44" y1="62" x2="44" y2="26" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="44,20 49,30 39,30" fill="#fff" />
                    </g>
                </svg>
            </div>
        </section>
    );
};

// ── Details list ─────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, text, warn }) => (
    <li className="detail-row">
        <div className="detail-main">
            <span className="detail-label">{label}</span>
            <span className="detail-value" style={{ color: warn || undefined }}>{value}</span>
        </div>
        {text && <p className="detail-text">{text}</p>}
    </li>
);

const Details = ({ current, unit }) => {
    const feels = toTemp(current.apparent_temperature, unit);
    const feelsWarn = current.apparent_temperature >= 40 ? '#f59e0b' : null;
    const dpC = current.dew_point_2m;
    const comfort = getDewPointComfort(dpC);
    const uv = getUvAdvice(current.uv_index || 0);
    const pressure = getPressureInfo(current.surface_pressure);
    const visKm = current.visibility != null ? Math.round(current.visibility / 100) / 10 : null;

    return (
        <section className="glass-panel card details" aria-labelledby="details-title">
            <div className="card-head"><h3 id="details-title" className="card-title">Details</h3></div>
            <ul className="detail-list">
                <DetailRow
                    label="Feels like"
                    value={`${feels}°`}
                    warn={feelsWarn}
                    text={getFeelsLikeReason(current.temperature_2m, current.apparent_temperature, current.relative_humidity_2m, current.wind_speed_10m)}
                />
                <DetailRow
                    label="Humidity"
                    value={`${current.relative_humidity_2m}%`}
                    warn={comfort.warn ? '#f59e0b' : null}
                    text={Number.isFinite(dpC) ? `${comfort.text}. Dew point ${toTemp(dpC, unit)}°.` : null}
                />
                <DetailRow
                    label="UV index"
                    value={`${Math.round(current.uv_index || 0)} · ${uv.label}`}
                    warn={uv.color !== '#ffffff' ? uv.color : null}
                    text={uv.advice}
                />
                {visKm != null && (
                    <DetailRow label="Visibility" value={`${visKm} km`} text={`${getVisibilityLabel(current.visibility)}. How far you can see clearly.`} />
                )}
                {current.surface_pressure != null && (
                    <DetailRow
                        label="Pressure"
                        value={`${Math.round(current.surface_pressure)} hPa`}
                        warn={pressure.color !== '#ffffff' ? pressure.color : null}
                        text={
                            pressure.label.includes('Low')
                                ? 'Low pressure often brings clouds, wind or rain.'
                                : pressure.label === 'Normal'
                                    ? 'Normal. Nothing unusual.'
                                    : 'High pressure usually means settled, dry weather.'
                        }
                    />
                )}
            </ul>
        </section>
    );
};

const SkeletonCard = ({ h = 220 }) => (
    <div className="glass-panel card" aria-hidden="true" style={{ minHeight: h }}>
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
        <div className="skeleton" style={{ height: 48, width: '55%', marginTop: 16 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginTop: 16 }} />
    </div>
);

const MapFallback = () => <div className="map-shell skeleton" aria-label="Loading map" />;

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ weatherData, unit, onLocationSelect, onGpsRequest, gpsState, loading, favorites = [], location }) => {
    if (loading || !weatherData) {
        return (
            <main className="dashboard-container" aria-busy="true">
                <SkeletonCard h={260} />
                <SkeletonCard h={420} />
                <div className="hero-cards">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </main>
        );
    }

    const { current, hourly, daily, aqi, aqiHourly, utc_offset_seconds: utcOffset } = weatherData;
    const nowMs = locationNowMs(utcOffset ?? 0);
    const mapLat = location?.lat ?? weatherData.latitude;
    const mapLon = location?.lon ?? weatherData.longitude;

    return (
        <main className="dashboard-container">
            <section className="glass-panel card hourly" aria-labelledby="hourly-title">
                <div className="card-head"><h3 id="hourly-title" className="card-title">Next 24 hours</h3></div>
                <HourlyChart hourlyData={hourly} dailyData={daily} unit={unit} currentTime={current.time} />
            </section>

            <WeekForecast daily={daily} unit={unit} currentTemp={current.temperature_2m} />

            <div className="hero-cards">
                <AqiCard aqi={aqi} aqiHourly={aqiHourly} nowMs={nowMs} />
                <RainCard hourly={hourly} daily={daily} nowMs={nowMs} />
                <WindCard speed={current.wind_speed_10m} gusts={current.wind_gusts_10m} direction={current.wind_direction_10m} unit={unit} />
            </div>

            <div className="details-row">
                <Details current={current} unit={unit} />
                <section className="glass-panel card sun-card" aria-label="Sun">
                    <div className="card-head"><h3 className="card-title">Sun</h3></div>
                    <SunArc daily={daily} nowMs={nowMs} />
                </section>
            </div>

            <section className="map-section" aria-labelledby="map-title">
                <h3 id="map-title" className="section-title">Map &amp; radar</h3>
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
