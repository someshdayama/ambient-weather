import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeatherDetails, formatDay } from '../utils/weatherUtils';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

const Forecast = ({ daily, unit, loading, theme }) => {
    const toUnit = (c) => unit === 'F' ? Math.round((c * 9 / 5) + 32) : Math.round(c);

    if (loading || !daily) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '16px' }} />
                ))}
            </div>
        );
    }

    // Gather global min/max for relative bar scaling
    const allMaxes = daily.temperature_2m_max.slice(0, 7).map(toUnit);
    const allMins  = daily.temperature_2m_min.slice(0, 7).map(toUnit);
    const globalMax = Math.max(...allMaxes);
    const globalMin = Math.min(...allMins);
    const globalRange = globalMax - globalMin || 1;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 7 }).map((_, i) => {
                const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDay(daily.time[i]);
                const maxTemp  = toUnit(daily.temperature_2m_max[i]);
                const minTemp  = toUnit(daily.temperature_2m_min[i]);
                const precip   = daily.precipitation_probability_max[i];
                const code     = daily.weather_code[i];
                const details  = getWeatherDetails(code, 1);
                const IconComp = Icons[details.icon] || Icons.Sun;

                // Bar positioning: where minTemp falls relative to global range
                const barLeft  = ((minTemp - globalMin) / globalRange) * 100;
                const barWidth = ((maxTemp - minTemp) / globalRange) * 100;

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            background: i === 0 ? 'var(--card-inner-bg)' : 'transparent',
                            border: i === 0 ? '1px solid var(--card-inner-border)' : '1px solid transparent',
                            transition: 'background 0.2s ease',
                        }}
                        whileHover={{ background: 'var(--card-inner-bg)' }}
                    >
                        {/* Day label */}
                        <div style={{ width: '76px', fontSize: '0.88rem', fontWeight: i === 0 ? 700 : 500, opacity: i === 0 ? 1 : 0.75, flexShrink: 0 }}>
                            {dayLabel}
                        </div>

                        {/* Icon */}
                        <IconComp size={20} strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.85 }} />

                        {/* Rain chance */}
                        <div style={{ width: '36px', flexShrink: 0, fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, textAlign: 'right' }}>
                            {precip > 0 ? `${precip}%` : ''}
                        </div>

                        {/* Temp range bar */}
                        <div style={{ flex: 1, position: 'relative', height: '6px', background: 'var(--card-inner-border)', borderRadius: '3px' }}>
                            <motion.div
                                initial={{ width: 0, x: `${barLeft}%` }}
                                animate={{ width: `${barWidth}%`, x: `${barLeft}%` }}
                                transition={{ duration: 0.7, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    height: '100%',
                                    borderRadius: '3px',
                                    background: 'linear-gradient(90deg, #60a5fa, #f97316)',
                                    boxShadow: '0 0 6px rgba(249,115,22,0.3)',
                                    left: 0,
                                    top: 0,
                                }}
                            />
                        </div>

                        {/* Min / Max */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, fontSize: '0.88rem' }}>
                            <span style={{ opacity: 0.5, fontWeight: 500 }}>{minTemp}°</span>
                            <span style={{ fontWeight: 700 }}>{maxTemp}°</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default Forecast;
