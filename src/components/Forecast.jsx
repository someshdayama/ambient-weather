import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { getWeatherDetails, formatDay } from '../utils/weatherUtils';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

const Forecast = ({ daily }) => {
    // Take next 3 days
    const nextDays = [1, 2, 3];

    return (
        <div className="glass-panel forecast-panel animate-fade" style={{ animationDelay: '0.2s', width: '100%', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.8, marginBottom: '1.5rem' }}>3-Day Forecast</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {nextDays.map((offset) => {
                    const time = daily.time[offset];
                    const maxTemp = Math.round(daily.temperature_2m_max[offset]);
                    const minTemp = Math.round(daily.temperature_2m_min[offset]);
                    const code = daily.weather_code[offset];
                    const details = getWeatherDetails(code, 1);
                    const IconComponent = Icons[details.icon] || Icons.Sun;

                    return (
                        <div key={time} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDay(time)}</div>
                            <IconComponent size={28} strokeWidth={1.5} style={{ opacity: 0.9 }} />
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: 600 }}>{maxTemp}°</span>
                                <span style={{ opacity: 0.6 }}>{minTemp}°</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Forecast;
