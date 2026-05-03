import React from 'react';
import { Droplet, Wind, Sun, Thermometer, Umbrella, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import HourlyChart from './HourlyChart';
import MetricCard from './MetricCard';
import WeatherMap from './WeatherMap';

const aqiRanges = [
    { min: 0, max: 50, label: 'Very Good', color: '#10b981' }, // Emerald 500
    { min: 50, max: 100, label: 'Good', color: '#84cc16' }, // Lime 500
    { min: 100, max: 150, label: 'Bearable', color: '#f59e0b' }, // Amber 500
    { min: 150, max: 200, label: 'Bad', color: '#f97316' }, // Orange 500
    { min: 200, max: 300, label: 'Very Bad', color: '#ef4444' }, // Red 500
    { min: 300, max: 500, label: 'Hazardous', color: '#7c3aed' }, // Violet 600
];

const getAqiData = (aqi) => {
    if (aqi === null || aqi === undefined) return { label: 'Unknown', color: '#94a3b8', rangeIndex: -1 };
    for (let i = 0; i < aqiRanges.length; i++) {
        if (aqi <= aqiRanges[i].max) return { label: aqiRanges[i].label, color: aqiRanges[i].color, rangeIndex: i };
    }
    return { label: 'Hazardous', color: '#7c3aed', rangeIndex: aqiRanges.length - 1 };
};

const Dashboard = ({ weatherData, unit, theme, onLocationSelect }) => {
    const aqiInfo = getAqiData(weatherData.aqi);

    // Wind Gauge Math
    const windSpeed = weatherData.current.wind_speed_10m;
    const windProgress = Math.min(windSpeed / 100, 1);
    const windAngle = Math.PI - (windProgress * Math.PI);
    const needleX = 50 + 35 * Math.cos(windAngle);
    const needleY = 50 - 35 * Math.sin(windAngle);

    // Feels Like Math
    const feelsLikeC = weatherData.current.apparent_temperature;
    const feelsLikeProgress = Math.max(0, Math.min(feelsLikeC / 50 * 100, 100));

    // UV Index Math
    const uvIndex = weatherData.current.uv_index || 0;
    const getUvSegmentColor = (segmentIndex) => {
        const thresholds = [2, 5, 7, 10, 11];
        if (uvIndex > (segmentIndex === 0 ? -1 : thresholds[segmentIndex - 1])) {
            return 'var(--accent-color)';
        }
        return 'rgba(255,255,255,0.1)';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="dashboard-container">
            {/* Ambient Background Gradient Glows */}
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '20%', width: '600px', height: '600px', background: 'rgba(167, 139, 250, 0.15)', borderRadius: '50%', filter: 'blur(150px)', zIndex: 0, pointerEvents: 'none' }} />

            {/* Upcoming Hours Graph */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    zIndex: 10,
                    flexShrink: 0
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexShrink: 0 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.5px' }}>Today's Forecast</h3>
                </div>
                <HourlyChart hourlyData={weatherData.hourly} unit={unit} currentTime={weatherData.current.time} />
            </motion.div>

            {/* Details Grid (Bento style) */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2rem', letterSpacing: '0.5px' }}>Current Conditions</h3>
                
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
                        gap: '1.5rem' 
                    }}
                >
                    {/* Air Quality (Featured large item) */}
                    <MetricCard title="Air Quality" icon={Activity} delay={0.1}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                    {weatherData.aqi != null ? Math.round(weatherData.aqi) : '--'}
                                </div>
                                <div style={{
                                    fontSize: '1rem', fontWeight: 600, color: aqiInfo.color,
                                    padding: '4px 16px', borderRadius: '20px',
                                    background: `${aqiInfo.color}20`,
                                    border: `1px solid ${aqiInfo.color}40`,
                                    boxShadow: `0 0 20px ${aqiInfo.color}15`
                                }}>
                                    {aqiInfo.label}
                                </div>
                            </div>
                            
                            <div style={{ width: '100%', marginTop: 'auto', position: 'relative', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                                    {aqiRanges.map((range, i) => (
                                        <div key={i} style={{
                                            flex: range.max - range.min,
                                            height: '6px',
                                            background: i <= aqiInfo.rangeIndex ? range.color : 'rgba(255,255,255,0.1)',
                                            borderRadius: '3px',
                                            opacity: i <= aqiInfo.rangeIndex ? 1 : 0.5,
                                            boxShadow: i === aqiInfo.rangeIndex ? `0 0 10px ${range.color}` : 'none',
                                            transition: 'all 0.8s ease'
                                        }} />
                                    ))}
                                    {weatherData.aqi != null && (
                                        <motion.div 
                                            initial={{ left: 0 }}
                                            animate={{ left: `${Math.min((weatherData.aqi / 500) * 100, 100)}%` }}
                                            transition={{ type: 'spring', stiffness: 50, delay: 0.5 }}
                                            style={{
                                                position: 'absolute',
                                                top: '1.2rem',
                                                width: '6px', height: '16px',
                                                background: '#fff',
                                                borderRadius: '3px',
                                                boxShadow: `0 0 10px ${aqiInfo.color}, 0 0 20px rgba(255,255,255,0.8)`
                                            }} 
                                        />
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.5, fontWeight: 500 }}>
                                    <span>0</span><span>100</span><span>200</span><span>300</span><span>500</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Wind */}
                    <MetricCard title="Wind" icon={Wind} delay={0.2}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, justifyContent: 'center' }}>
                            <div style={{ position: 'relative', width: '100px', height: '60px' }}>
                                <svg width="100%" height="100%" viewBox="0 0 100 50" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                                    <motion.path 
                                        initial={{ pathLength: 0 }} animate={{ pathLength: windProgress }} transition={{ duration: 1.5, ease: 'easeOut' }}
                                        d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--accent-color)" strokeWidth="10" strokeLinecap="round" 
                                        style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
                                    />
                                    <motion.line 
                                        initial={{ x2: 10, y2: 50 }} animate={{ x2: needleX, y2: needleY }} transition={{ duration: 1.5, type: 'spring' }}
                                        x1="50" y1="50" stroke="white" strokeWidth="4" strokeLinecap="round" 
                                    />
                                    <circle cx="50" cy="50" r="5" fill="white" />
                                </svg>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 600, marginTop: '0.5rem' }}>
                                {Math.round(weatherData.current.wind_speed_10m)} <span style={{fontSize: '1rem', opacity: 0.7, fontWeight: 500}}>km/h</span>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Humidity */}
                    <MetricCard title="Humidity" icon={Droplet} delay={0.3}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {weatherData.current.relative_humidity_2m}<span style={{fontSize: '1.2rem', opacity: 0.7}}>%</span>
                            </div>
                            
                            <div style={{ width: '100%', position: 'relative', marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weatherData.current.relative_humidity_2m}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-color), #60a5fa)', borderRadius: '4px', boxShadow: '0 0 10px var(--accent-glow)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.5, fontWeight: 500 }}>
                                    <span>0%</span><span>50%</span><span>100%</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* UV Index */}
                    <MetricCard title="UV Index" icon={Sun} delay={0.4}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: 'auto' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{Math.round(uvIndex)}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                                    {uvIndex > 7 ? 'Very High' : uvIndex > 5 ? 'High' : uvIndex > 2 ? 'Moderate' : 'Low'}
                                </div>
                            </div>
                            
                            <div style={{ width: '100%', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} style={{ 
                                            height: '8px', flex: 1, 
                                            background: getUvSegmentColor(i), 
                                            borderRadius: '4px',
                                            boxShadow: uvIndex > (i === 0 ? -1 : [2, 5, 7, 10, 11][i - 1]) ? '0 0 8px var(--accent-glow)' : 'none',
                                            transition: 'background-color 0.5s ease' 
                                        }} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.5, fontWeight: 500 }}>
                                    <span>0-2</span><span>3-5</span><span>6-7</span><span>8-10</span><span>11+</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Feels Like */}
                    <MetricCard title="Feels Like" icon={Thermometer} delay={0.5}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {unit === 'F' ? Math.round((weatherData.current.apparent_temperature * 9 / 5) + 32) : Math.round(weatherData.current.apparent_temperature)}°
                            </div>
                            
                            <div style={{ width: '100%', position: 'relative', marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${feelsLikeProgress}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ef4444)', borderRadius: '4px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.5, fontWeight: 500 }}>
                                    <span>{unit === 'F' ? '32°' : '0°'}</span><span>{unit === 'F' ? '77°' : '25°'}</span><span>{unit === 'F' ? '122°' : '50°'}</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Chance of Rain */}
                    <MetricCard title="Chance of Rain" icon={Umbrella} delay={0.6}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: 'auto' }}>
                                {weatherData.daily.precipitation_probability_max[0]}<span style={{fontSize: '1.2rem', opacity: 0.7}}>%</span>
                            </div>
                            
                            <div style={{ width: '100%', position: 'relative', marginTop: '1.5rem' }}>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weatherData.daily.precipitation_probability_max[0]}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #818cf8)', borderRadius: '4px', boxShadow: '0 0 10px rgba(96, 165, 250, 0.5)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.5, fontWeight: 500 }}>
                                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                </motion.div>

                {/* Weather Map */}
                <motion.div variants={itemVariants} style={{ width: '100%', marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.5px' }}>Location Map</h3>
                    <WeatherMap lat={weatherData.latitude} lon={weatherData.longitude} theme={theme} onLocationSelect={onLocationSelect} />
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
