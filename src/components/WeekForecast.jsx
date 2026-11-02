import { Droplet } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { formatDay, getShortCondition, getWeekSummary, toTemp } from '../utils/weatherUtils';

const RAIN_MIN = 30;

/** 7-day forecast as seven equal columns (day, icon, condition, high, low, rain). */
const WeekForecast = ({ daily, unit }) => {
    if (!daily?.time?.length) return null;

    const days = daily.time.slice(0, 7).map((date, i) => ({
        date,
        label: i === 0 ? 'Today' : formatDay(date),
        low: toTemp(daily.temperature_2m_min[i], unit),
        high: toTemp(daily.temperature_2m_max[i], unit),
        rain: daily.precipitation_probability_max?.[i] ?? 0,
        code: daily.weather_code[i],
    }));

    return (
        <section className="glass-panel card week" aria-labelledby="week-title">
            <div className="card-head">
                <h3 id="week-title" className="card-title">7-day forecast</h3>
            </div>
            <p className="week-summary">{getWeekSummary(days)}</p>

            <ol className="week-cols">
                {days.map((d, i) => {
                    const condition = getShortCondition(d.code);
                    const showRain = d.rain >= RAIN_MIN;
                    return (
                        <li
                            key={d.date}
                            className={`week-col ${i === 0 ? 'today' : ''}`}
                            aria-label={`${d.label}: ${condition}, high ${d.high}°, low ${d.low}°${showRain ? `, ${d.rain}% chance of rain` : ''}`}
                        >
                            <span className="week-col-day">{d.label}</span>
                            <WeatherIcon code={d.code} isDay={1} size={26} strokeWidth={1.5} className="week-col-icon" />
                            <span className="week-col-cond">{condition}</span>
                            <span className="week-col-high">{d.high}°</span>
                            <span className="week-col-low">{d.low}°</span>
                            <span className="week-col-rain">
                                {showRain ? (
                                    <>
                                        <Droplet size={12} aria-hidden="true" />
                                        {d.rain}%
                                    </>
                                ) : (
                                    '\u00a0'
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

export default WeekForecast;
