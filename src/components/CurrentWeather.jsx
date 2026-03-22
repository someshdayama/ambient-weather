import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

const CurrentWeather = ({ current, locationName, weatherDetails }) => {
    const IconComponent = Icons[weatherDetails.icon] || Icons.Sun;

    return (
        <div className="glass-panel current-weather animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '0.5px' }}>{locationName}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
                <IconComponent size={64} strokeWidth={1.5} />
                <div style={{ fontSize: '4rem', fontWeight: 700, letterSpacing: '-2px' }}>
                    {Math.round(current.temperature_2m)}°
                </div>
            </div>

            <p style={{ fontSize: '1.2rem', fontWeight: 400, opacity: 0.9 }}>{weatherDetails.text}</p>

            <div className="sub-panel" style={{ display: 'flex', width: '100%', justifyContent: 'space-around', marginTop: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Feels Like</div>
                    <div style={{ fontWeight: 600, marginTop: '4px' }}>{Math.round(current.apparent_temperature)}°</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Humidity</div>
                    <div style={{ fontWeight: 600, marginTop: '4px' }}>{current.relative_humidity_2m}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Wind</div>
                    <div style={{ fontWeight: 600, marginTop: '4px' }}>{Math.round(current.wind_speed_10m)} km/h</div>
                </div>
            </div>
        </div>
    );
};

export default CurrentWeather;
