import React from 'react';
import { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, MapPin, Umbrella } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFeelsLikeComparison, getNowcast, toTemp, toWind, windUnitLabel } from '../utils/weatherUtils';

const Icons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

/** Map icon name → CSS animation class for the icon wrapper */
const iconAnimClass = {
    Sun: 'icon-sun',
    Moon: '',
    CloudSun: 'icon-cloud',
    Cloud: 'icon-cloud',
    CloudFog: 'icon-cloud',
    CloudDrizzle: 'icon-rain',
    CloudRain: 'icon-rain',
    CloudSnow: 'icon-snow',
    CloudLightning: 'icon-storm',
};

const CurrentWeather = ({ current, daily, minutely, nowMs, locationName, weatherDetails, time, timezone, unit }) => {
    const IconComponent = Icons[weatherDetails.icon] || Icons.Sun;
    const animClass = iconAnimClass[weatherDetails.icon] || '';

    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
    const displayTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });

    const tempDisplay = toTemp(current.temperature_2m, unit);
    const feelsDisplay = toTemp(current.apparent_temperature, unit);
    const maxDisplay = daily ? toTemp(daily.temperature_2m_max[0], unit) : null;
    const minDisplay = daily ? toTemp(daily.temperature_2m_min[0], unit) : null;
    const comparisonText = getFeelsLikeComparison(tempDisplay, feelsDisplay);
    const nowcast = getNowcast(minutely, nowMs);

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
            className="current-weather"
            aria-label={`Current weather in ${locationName}`}
        >
            <div className="cw-location">
                <MapPin size={17} strokeWidth={2} aria-hidden="true" />
                <h2>{locationName}</h2>
            </div>
            <p className="cw-date">
                {formattedDate} &bull; {displayTime}
            </p>

            <div className="cw-main">
                <div className="cw-icon-wrap" aria-hidden="true">
                    <div className="cw-icon-glow" />
                    <div className={animClass} style={{ position: 'relative', zIndex: 2, display: 'inline-block' }}>
                        <IconComponent size={68} strokeWidth={1.4} />
                    </div>
                </div>
                <div>
                    <div className="cw-temp" aria-label={`${tempDisplay} degrees ${unit === 'F' ? 'Fahrenheit' : 'Celsius'}`}>
                        {tempDisplay}°
                    </div>
                    {maxDisplay !== null && (
                        <div className="cw-hilo">
                            <span aria-label={`High ${maxDisplay}`}>↑ {maxDisplay}°</span>
                            <span aria-label={`Low ${minDisplay}`}>↓ {minDisplay}°</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="cw-condition">
                <span className="cw-dot" aria-hidden="true" />
                {weatherDetails.text}
            </div>

            {nowcast.text && (
                <div className={`nowcast nowcast-${nowcast.state}`} role="status">
                    <Umbrella size={14} aria-hidden="true" />
                    {nowcast.text}
                </div>
            )}

            <div className="current-micro-stats">
                <div className="micro-stat">
                    <div className="micro-label">Feels Like</div>
                    <div className="micro-value">{feelsDisplay}°</div>
                    <div className="micro-sub">{comparisonText}</div>
                </div>
                <div className="current-micro-divider" />
                <div className="micro-stat">
                    <div className="micro-label">Humidity</div>
                    <div className="micro-value">{current.relative_humidity_2m}%</div>
                </div>
                <div className="current-micro-divider" />
                <div className="micro-stat">
                    <div className="micro-label">Wind</div>
                    <div className="micro-value">
                        {toWind(current.wind_speed_10m, unit)} <span className="micro-unit">{windUnitLabel(unit)}</span>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default CurrentWeather;
