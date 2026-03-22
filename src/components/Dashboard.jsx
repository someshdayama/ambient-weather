import React, { useState } from 'react';
import { Droplet, Wind, Sun, Thermometer, Umbrella, Activity } from 'lucide-react';
import HourlyChart from './HourlyChart';
import MetricCard from './MetricCard';

const aqiRanges = [
    { min: 0, max: 50, label: 'Very Good', color: '#4caf50' },
    { min: 50, max: 100, label: 'Good', color: '#8bc34a' },
    { min: 100, max: 150, label: 'Bearable', color: '#ffc107' },
    { min: 150, max: 200, label: 'Bad', color: '#ff5722' },
    { min: 200, max: 300, label: 'Very Bad', color: '#b71c1c' },
    { min: 300, max: 500, label: 'Hazardous', color: '#4a0072' },
];

const getAqiData = (aqi) => {
    if (aqi === null || aqi === undefined) return { label: 'Unknown', color: '#e0e0e0', rangeIndex: -1 };
    for (let i = 0; i < aqiRanges.length; i++) {
        if (aqi <= aqiRanges[i].max) return { label: aqiRanges[i].label, color: aqiRanges[i].color, rangeIndex: i };
    }
    return { label: 'Hazardous', color: '#4a0072', rangeIndex: aqiRanges.length - 1 };
};

const Dashboard = ({ weatherData, unit }) => {
    const [hourlyHovered, setHourlyHovered] = useState(false);

    const aqiInfo = getAqiData(weatherData.aqi);

    // Wind Gauge Math
    const windSpeed = weatherData.current.wind_speed_10m;
    const windProgress = Math.min(windSpeed / 100, 1); // Cap at 100 km/h for gauge visual max
    const windAngle = Math.PI - (windProgress * Math.PI);
    const needleX = 50 + 35 * Math.cos(windAngle);
    const needleY = 50 - 35 * Math.sin(windAngle);

    // Feels Like Math (Scale 0C to 50C)
    const feelsLikeC = weatherData.current.apparent_temperature;
    const feelsLikeProgress = Math.max(0, Math.min(feelsLikeC / 50 * 100, 100)); // clamp 0-100%

    // UV Index Math (Scale 0-11+)
    const uvIndex = weatherData.current.uv_index || 0;
    const getUvSegmentColor = (segmentIndex) => {
        // Segments map to roughly: 0-2 (Low), 3-5 (Mod), 6-7 (High), 8-10 (V.High), 11+ (Extreme)
        const thresholds = [2, 5, 7, 10, 11];
        if (uvIndex > (segmentIndex === 0 ? -1 : thresholds[segmentIndex - 1])) {
            return '#4c8ae6'; // Active segments
        }
        return '#e0e0e0'; // Inactive segments
    };

    return (
        <div className="dashboard-container" style={{ background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Cleaned Header Area */}

            {/* Upcoming Hours Graph */}
            <div
                onMouseEnter={() => setHourlyHovered(true)}
                onMouseLeave={() => setHourlyHovered(false)}
                style={{
                    background: 'var(--card-bg)', borderRadius: '24px', padding: '1.5rem 2rem',
                    boxShadow: hourlyHovered
                        ? '0 8px 30px rgba(76, 138, 230, 0.18), 0 0 0 2px rgba(76, 138, 230, 0.15)'
                        : '0 4px 15px rgba(0,0,0,0.02)',
                    transform: hourlyHovered ? 'translateY(-4px) scale(1.005)' : 'translateY(0) scale(1)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    cursor: 'default'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Upcoming hours</h3>
                </div>
                <HourlyChart hourlyData={weatherData.hourly} unit={unit} currentTime={weatherData.current.time} />
            </div>

            {/* Details Grid */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>More details of today's weather</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>

                    {/* Humidity */}
                    <MetricCard title="Humidity" icon={Droplet}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>
                                {weatherData.current.relative_humidity_2m}%
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', fontSize: '0.8rem', marginTop: '12px', opacity: 0.6 }}>
                                <span>0%</span><span>50%</span><span>100%</span>
                            </div>
                            <div style={{ width: '80%', height: '8px', background: '#e0e0e0', borderRadius: '4px', marginTop: '4px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${weatherData.current.relative_humidity_2m}%`, background: '#4c8ae6', borderRadius: '4px', transition: 'width 1s ease' }}></div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Wind */}
                    <MetricCard title="Wind" icon={Wind}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px' }}>
                                {/* Simple Gauge CSS */}
                                <svg width="100" height="50" viewBox="0 0 100 50">
                                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e0e0e0" strokeWidth="8" strokeLinecap="round" />
                                    <path d="M 10 50 A 40 40 0 0 1 50 10" fill="none" stroke="#4c8ae6" strokeWidth="8" strokeLinecap="round" />
                                    {/* Needle */}
                                    <line x1="50" y1="50" x2={needleX} y2={needleY} stroke="#4c8ae6" strokeWidth="4" strokeLinecap="round" style={{ transition: 'all 1s ease' }} />
                                    <circle cx="50" cy="50" r="4" fill="var(--text-primary)" />
                                </svg>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, marginTop: '60px' }}>
                                {Math.round(weatherData.current.wind_speed_10m)} km/h
                            </div>
                        </div>
                    </MetricCard>

                    {/* Air Quality */}
                    <MetricCard title="Air Quality" icon={Activity}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>
                                {weatherData.aqi != null ? Math.round(weatherData.aqi) : '--'}
                            </div>
                            <div style={{
                                fontSize: '0.95rem', fontWeight: 600, color: aqiInfo.color, marginTop: '4px',
                                padding: '2px 12px', borderRadius: '12px',
                                background: `${aqiInfo.color}18`
                            }}>
                                {aqiInfo.label}
                            </div>
                            {/* Multi-segment AQI color band */}
                            <div style={{ width: '90%', marginTop: '16px', position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '3px', width: '100%' }}>
                                    {aqiRanges.map((range, i) => (
                                        <div key={i} style={{
                                            flex: range.max - range.min,
                                            height: '8px',
                                            background: i <= aqiInfo.rangeIndex ? range.color : '#e0e0e0',
                                            borderRadius: i === 0 ? '4px 0 0 4px' : i === aqiRanges.length - 1 ? '0 4px 4px 0' : '0',
                                            opacity: i <= aqiInfo.rangeIndex ? 1 : 0.4,
                                            transition: 'opacity 0.8s ease, background 0.8s ease'
                                        }} />
                                    ))}
                                    {/* Position marker */}
                                    {weatherData.aqi != null && (
                                        <div style={{
                                            position: 'absolute',
                                            left: `${Math.min((weatherData.aqi / 500) * 100, 100)}%`,
                                            top: '-3px',
                                            width: '4px', height: '14px',
                                            background: aqiInfo.color,
                                            borderRadius: '2px',
                                            boxShadow: `0 0 6px ${aqiInfo.color}80`,
                                            transition: 'left 1s ease'
                                        }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '4px', opacity: 0.5 }}>
                                    <span>0</span><span>100</span><span>200</span><span>300</span><span>500</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* UV Index */}
                    <MetricCard title="UV index" icon={Sun}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>
                                {Math.round(uvIndex)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>{uvIndex > 5 ? 'high' : 'medium'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '16px' }}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{ height: '8px', width: '20%', background: getUvSegmentColor(i), borderRadius: '4px', transition: 'background-color 1s ease' }}></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', marginTop: '4px', opacity: 0.6 }}>
                                <span>0-2</span><span>3-5</span><span>6-7</span><span>8-10</span><span>11+</span>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Feels Like */}
                    <MetricCard title="Feels like" icon={Thermometer}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>
                                {unit === 'F' ? Math.round((weatherData.current.apparent_temperature * 9 / 5) + 32) : Math.round(weatherData.current.apparent_temperature)}°
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', fontSize: '0.8rem', marginTop: '12px', opacity: 0.6 }}>
                                <span>{unit === 'F' ? '32°' : '0°'}</span><span>{unit === 'F' ? '77°' : '25°'}</span><span>{unit === 'F' ? '122°' : '50°'}</span>
                            </div>
                            <div style={{ width: '80%', height: '8px', background: '#e0e0e0', borderRadius: '4px', marginTop: '4px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${feelsLikeProgress}%`, background: '#4c8ae6', borderRadius: '4px', transition: 'width 1s ease' }}></div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Chance of Rain */}
                    <MetricCard title="Chance of rain" icon={Umbrella}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>
                                {weatherData.daily.precipitation_probability_max[0]}%
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', fontSize: '0.8rem', marginTop: '12px', opacity: 0.6 }}>
                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                            </div>
                            <div style={{ width: '80%', height: '8px', background: '#e0e0e0', borderRadius: '4px', marginTop: '4px', position: 'relative' }}>
                                {/* Map the probability array max to the bar width directly */}
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${weatherData.daily.precipitation_probability_max[0]}%`, background: '#4c8ae6', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </MetricCard>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
