import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFeelsLikeComparison } from '../utils/weatherUtils';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

/** Map icon name → CSS animation class for the icon wrapper */
const iconAnimClass = {
    Sun:           'icon-sun',
    Moon:          '',
    CloudSun:      'icon-cloud',
    Cloud:         'icon-cloud',
    CloudFog:      'icon-cloud',
    CloudDrizzle:  'icon-rain',
    CloudRain:     'icon-rain',
    CloudSnow:     'icon-snow',
    CloudLightning:'icon-storm',
};

const CurrentWeather = ({ current, daily, locationName, weatherDetails, time, timezone, unit, theme }) => {
    const IconComponent = Icons[weatherDetails.icon] || Icons.Sun;
    const animClass = iconAnimClass[weatherDetails.icon] || '';
    const isLight = theme === 'light';

    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
    const displayTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });

    const toUnit = (c) => unit === 'F' ? Math.round((c * 9 / 5) + 32) : Math.round(c);
    const tempDisplay   = toUnit(current.temperature_2m);
    const feelsDisplay  = toUnit(current.apparent_temperature);
    const maxDisplay    = daily ? toUnit(daily.temperature_2m_max[0]) : null;
    const minDisplay    = daily ? toUnit(daily.temperature_2m_min[0]) : null;
    const comparisonText = getFeelsLikeComparison(current.temperature_2m, current.apparent_temperature);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: 'auto', marginBottom: '7.5rem', zIndex: 10 }}
        >
            {/* Location + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9 }}>
                <MapPin size={17} strokeWidth={2} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '0.3px' }}>{locationName}</h2>
            </div>
            <p style={{ opacity: 0.6, fontSize: '0.9rem', marginLeft: '23px' }}>
                {formattedDate} &bull; {displayTime}
            </p>

            {/* Big temp + animated icon */}
            <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1.5rem 0 0.5rem' }}
            >
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.35)', filter: 'blur(20px)', borderRadius: '50%' }} />
                    <div className={animClass} style={{ position: 'relative', zIndex: 2, display: 'inline-block' }}>
                        <IconComponent size={68} strokeWidth={1.4} />
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '5.5rem', fontWeight: 700, letterSpacing: '-4px', lineHeight: 1 }}>
                        {tempDisplay}°
                    </div>
                    {/* High / Low */}
                    {maxDisplay !== null && (
                        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '4px', letterSpacing: '0.5px', display: 'flex', gap: '10px' }}>
                            <span>↑ {maxDisplay}°</span>
                            <span>↓ {minDisplay}°</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Condition label */}
            <div style={{ fontSize: '1.3rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.8 }} />
                {weatherDetails.text}
            </div>
 
            {/* Micro stats row */}
            <div className="current-micro-stats">
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.55, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Feels Like</div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{feelsDisplay}°</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px', maxWidth: '80px' }}>{comparisonText}</div>
                </div>
                <div className="current-micro-divider" />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.55, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Humidity</div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{current.relative_humidity_2m}%</div>
                </div>
                <div className="current-micro-divider" />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ opacity: 0.55, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Wind</div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{Math.round(current.wind_speed_10m)} <span style={{ fontSize: '0.75rem' }}>km/h</span></div>
                </div>
            </div>
        </motion.div>
    );
};

export default CurrentWeather;
