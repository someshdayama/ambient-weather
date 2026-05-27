export const searchCity = async (query) => {
    if (!query || query.trim().length <= 2) return [];
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        if (!res.ok) throw new Error('Failed to search cities');
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error('API Error (Geocoding Search):', err);
        throw new Error('City lookup failed. Please check network connection.');
    }
};

export const fetchReverseGeocode = async (lat, lon) => {
    try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (!geoRes.ok) throw new Error('Geocoding blocked');
        const geoData = await geoRes.json();
        return geoData.city || geoData.locality || 'Current Location';
    } catch (err) {
        console.error('API Error (Reverse Geocode):', err);
        return 'Unknown Location'; // graceful fallback
    }
};

export const fetchWeatherByCoords = async (lat, lon) => {
    try {
        const [weatherRes, aqiRes] = await Promise.all([
            fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day,uv_index,surface_pressure,visibility,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`
            ),
            fetch(
                `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`
            )
        ]);

        if (!weatherRes.ok) throw new Error(`Weather API Error: ${weatherRes.status}`);

        const weatherData = await weatherRes.json();
        let aqiValue = null;

        if (aqiRes.ok) {
            const aqiData = await aqiRes.json();
            aqiValue = aqiData.current?.european_aqi ?? null;
        }

        return {
            ...weatherData,
            aqi: aqiValue
        };
    } catch (err) {
        console.error('API Error (Open-Meteo):', err);
        throw new Error('Weather forecast unavailable. Please try again later.');
    }
};
