import { motion } from 'framer-motion';
import { Umbrella } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { getNowcast, toTemp } from '../utils/weatherUtils';

/** The hero: place, huge thin temperature, condition right under it, high/low, nowcast. */
const CurrentWeather = ({ current, daily, minutely, nowMs, locationName, weatherDetails, time, timezone, unit }) => {
    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
    const displayTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });

    const temp = toTemp(current.temperature_2m, unit);
    const high = daily ? toTemp(daily.temperature_2m_max[0], unit) : null;
    const low = daily ? toTemp(daily.temperature_2m_min[0], unit) : null;
    const nowcast = getNowcast(minutely, nowMs);

    return (
        <section className="hero" aria-label={`Current weather in ${locationName}`}>
            <h2 className="hero-place">{locationName}</h2>
            <p className="hero-date t-secondary">{formattedDate} · {displayTime}</p>

            <motion.div
                key={`${locationName}-${unit}`}
                className="hero-temp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                aria-label={`${temp} degrees ${unit === 'F' ? 'Fahrenheit' : 'Celsius'}`}
            >
                {temp}°
            </motion.div>

            <div className="hero-condition">
                <WeatherIcon code={current.weather_code} isDay={current.is_day} size={24} strokeWidth={1.5} />
                <span>{weatherDetails.text}</span>
            </div>

            {high !== null && (
                <p className="hero-hilo">
                    <span className="t-secondary">High</span> {high}° <span className="hero-sep" aria-hidden="true">·</span>{' '}
                    <span className="t-secondary">Low</span> {low}°
                </p>
            )}

            {nowcast.text && (
                <div className={`nowcast nowcast-${nowcast.state}`} role="status">
                    <Umbrella size={16} aria-hidden="true" />
                    {nowcast.text}
                </div>
            )}
        </section>
    );
};

export default CurrentWeather;
