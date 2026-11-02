const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const RADAR_URL = 'https://api.rainviewer.com/public/weather-maps.json';

const isAbort = (err) => err?.name === 'AbortError';

export const searchCity = async (query, { signal } = {}) => {
    if (!query || query.trim().length <= 2) return [];
    try {
        const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`, { signal });
        if (!res.ok) throw new Error(`Geocoding ${res.status}`);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        if (isAbort(err)) throw err;
        throw new Error('City lookup failed. Check your connection.');
    }
};

/** Never throws (except on abort): a missing place name is not worth failing the whole load. */
export const fetchReverseGeocode = async (lat, lon, { signal } = {}) => {
    try {
        const res = await fetch(`${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { signal });
        if (!res.ok) throw new Error(`Reverse geocode ${res.status}`);
        const d = await res.json();
        const name = d.city || d.locality || d.principalSubdivision;
        return name ? (d.principalSubdivision && d.principalSubdivision !== name ? `${name}, ${d.principalSubdivision}` : name) : null;
    } catch (err) {
        if (isAbort(err)) throw err;
        return null;
    }
};

/**
 * Forecast + air quality in parallel. Throws on forecast failure; AQI is optional.
 * Returns the raw Open-Meteo forecast object plus `aqi` (current US AQI) and `aqiHourly`.
 */
export const fetchWeatherByCoords = async (lat, lon, { signal } = {}) => {
    const forecastParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day,uv_index,surface_pressure,visibility,cloud_cover,dew_point_2m,wind_gusts_10m',
        hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
        minutely_15: 'precipitation',
        forecast_minutely_15: '12',
        timezone: 'auto',
        forecast_days: '7',
    });
    const airParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'us_aqi',
        hourly: 'us_aqi',
        timezone: 'auto',
        forecast_days: '2',
    });

    let weatherRes, aqiRes;
    try {
        [weatherRes, aqiRes] = await Promise.all([
            fetch(`${FORECAST_URL}?${forecastParams}`, { signal }),
            fetch(`${AIR_URL}?${airParams}`, { signal }).catch((err) => {
                if (isAbort(err)) throw err;
                return null;
            }),
        ]);
    } catch (err) {
        if (isAbort(err)) throw err;
        throw new Error('Weather service unreachable. Check your connection.');
    }

    if (!weatherRes.ok) throw new Error(`Weather service error (${weatherRes.status}).`);
    const weatherData = await weatherRes.json();

    let aqi = null;
    let aqiHourly = null;
    if (aqiRes?.ok) {
        try {
            const a = await aqiRes.json();
            aqi = a.current?.us_aqi ?? null;
            aqiHourly = a.hourly?.time ? { time: a.hourly.time, us_aqi: a.hourly.us_aqi } : null;
        } catch {
            /* AQI is optional */
        }
    }

    return { ...weatherData, aqi, aqiHourly };
};

/** Latest RainViewer radar frame → Leaflet tile URL template, or null. */
export const fetchRadarTileUrl = async ({ signal } = {}) => {
    try {
        const res = await fetch(RADAR_URL, { signal });
        if (!res.ok) return null;
        const d = await res.json();
        const frames = d?.radar?.past;
        const last = frames?.[frames.length - 1];
        if (!d.host || !last?.path) return null;
        // 256px tiles, colour scheme 2 (Universal Blue), smoothing on, snow on
        return { url: `${d.host}${last.path}/256/{z}/{x}/{y}/2/1_1.png`, time: last.time };
    } catch {
        return null;
    }
};
