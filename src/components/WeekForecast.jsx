import { Droplet } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { formatDay, getShortCondition, getWeekRange, getWeekSummary, rangeBar, scalePct, toTemp } from '../utils/weatherUtils';

const RAIN_MIN = 30;

/**
 * 7-day list. Every row shares one temperature scale (coolest low → warmest high of the week),
 * so a bar further right is a warmer day. Today carries a dot for the current temperature.
 */
const WeekForecast = ({ daily, unit, currentTemp }) => {
    if (!daily?.time?.length) return null;

    const days = daily.time.slice(0, 7).map((date, i) => ({
        date,
        label: i === 0 ? 'Today' : formatDay(date),
        low: toTemp(daily.temperature_2m_min[i], unit),
        high: toTemp(daily.temperature_2m_max[i], unit),
        rain: daily.precipitation_probability_max?.[i] ?? 0,
        code: daily.weather_code[i],
    }));
    const { min, max } = getWeekRange(days.map((d) => d.low), days.map((d) => d.high));
    const nowTemp = toTemp(currentTemp, unit);

    return (
        <section className="glass-panel card week" aria-labelledby="week-title">
            <div className="card-head">
                <h3 id="week-title" className="card-title">7-day forecast</h3>
            </div>
            <p className="week-summary">{getWeekSummary(days)}</p>

            <div className="week-legend" aria-hidden="true">
                <span />
                <span className="week-legend-rain">Rain</span>
                <span className="week-legend-temp">Low <span className="week-legend-line" /> High</span>
            </div>

            <ol className="week-list">
                {days.map((d, i) => {
                    const bar = rangeBar(d.low, d.high, min, max);
                    const condition = getShortCondition(d.code);
                    const showRain = d.rain >= RAIN_MIN;
                    return (
                        <li
                            key={d.date}
                            className={`week-row ${i === 0 ? 'today' : ''}`}
                            aria-label={`${d.label}: ${condition}, low ${d.low}°, high ${d.high}°${showRain ? `, ${d.rain}% chance of rain` : ''}`}
                        >
                            <div className="week-day">
                                <span className="week-day-name">{d.label}</span>
                                <span className="week-day-cond">{condition}</span>
                            </div>
                            <WeatherIcon code={d.code} isDay={1} size={24} strokeWidth={1.5} className="week-icon" />
                            <div className={`week-rain ${showRain ? '' : 'empty'}`}>
                                {showRain && (
                                    <>
                                        <Droplet size={14} aria-hidden="true" />
                                        {d.rain}%
                                    </>
                                )}
                            </div>
                            <div className="week-range">
                                <span className="week-low">{d.low}°</span>
                                <div className="week-track">
                                    <div className="week-bar" style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
                                    {i === 0 && Number.isFinite(nowTemp) && (
                                        <div className="week-now" style={{ left: `${scalePct(nowTemp, min, max)}%` }} title={`Now ${nowTemp}°`} />
                                    )}
                                </div>
                                <span className="week-high">{d.high}°</span>
                            </div>
                        </li>
                    );
                })}
            </ol>
            <p className="week-foot t-secondary">Bars share one scale from {min}° to {max}°. The dot on today is the temperature now.</p>
        </section>
    );
};

export default WeekForecast;
