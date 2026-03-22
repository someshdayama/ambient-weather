import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

const CurrentWeather = ({ current, locationName, weatherDetails, time, timezone }) => {
    const IconComponent = Icons[weatherDetails.icon] || Icons.Sun;
    
    // Format current date cleanly
    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
    const displayTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="current-weather" 
            style={{ 
                display: 'flex', flexDirection: 'column', gap: '1rem',
                marginTop: 'auto', marginBottom: '8rem', zIndex: 10
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9 }}>
                <MapPin size={18} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 500, letterSpacing: '0.5px' }}>{locationName}</h2>
            </div>
            
            <p style={{ opacity: 0.7, fontSize: '1rem', marginTop: '-8px', marginLeft: '24px' }}>
                {formattedDate} • {displayTime}
            </p>

            <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}
            >
                {/* Glow effect around the icon */}
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', filter: 'blur(20px)', borderRadius: '50%' }} />
                    <IconComponent size={72} strokeWidth={1.5} style={{ position: 'relative', zIndex: 2 }} />
                </div>
                
                <div style={{ fontSize: '5.5rem', fontWeight: 700, letterSpacing: '-3px', lineHeight: 1 }}>
                    {Math.round(current.temperature_2m)}°
                </div>
            </motion.div>

            <div style={{ fontSize: '1.4rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'white', opacity: 0.8 }}></span>
                {weatherDetails.text}
            </div>

            {/* Micro Details */}
            <div style={{ 
                display: 'flex', width: '100%', justifyContent: 'space-between', 
                marginTop: '1.5rem', padding: '1rem',
                background: 'rgba(0,0,0,0.1)', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Feels Like</div>
                    <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>{Math.round(current.apparent_temperature)}°</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Humidity</div>
                    <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>{current.relative_humidity_2m}%</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Wind</div>
                    <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>{Math.round(current.wind_speed_10m)} <span style={{fontSize:'0.8rem'}}>km/h</span></div>
                </div>
            </div>
        </motion.div>
    );
};

export default CurrentWeather;
