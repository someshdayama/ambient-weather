export const getWeatherDetails = (code, isDay = 1) => {
    const weatherMap = {
        0: { text: 'Clear sky', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        1: { text: 'Mainly clear', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        2: { text: 'Partly cloudy', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'CloudSun' },
        3: { text: 'Overcast', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'Cloud' },
        45: { text: 'Fog', theme: 'fog', icon: 'CloudFog' },
        48: { text: 'Depositing rime fog', theme: 'fog', icon: 'CloudFog' },
        51: { text: 'Light drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        53: { text: 'Moderate drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        55: { text: 'Dense drizzle', theme: 'rain', icon: 'CloudDrizzle' },
        61: { text: 'Slight rain', theme: 'rain', icon: 'CloudRain' },
        63: { text: 'Moderate rain', theme: 'rain', icon: 'CloudRain' },
        65: { text: 'Heavy rain', theme: 'rain', icon: 'CloudRain' },
        71: { text: 'Slight snow', theme: 'snow', icon: 'CloudSnow' },
        73: { text: 'Moderate snow', theme: 'snow', icon: 'CloudSnow' },
        75: { text: 'Heavy snow', theme: 'snow', icon: 'CloudSnow' },
        77: { text: 'Snow grains', theme: 'snow', icon: 'CloudSnow' },
        80: { text: 'Slight rain showers', theme: 'rain', icon: 'CloudRain' },
        81: { text: 'Moderate rain showers', theme: 'rain', icon: 'CloudRain' },
        82: { text: 'Violent rain showers', theme: 'storm', icon: 'CloudLightning' },
        95: { text: 'Thunderstorm', theme: 'storm', icon: 'CloudLightning' },
        96: { text: 'Thunderstorm with slight hail', theme: 'storm', icon: 'CloudLightning' },
        99: { text: 'Thunderstorm with heavy hail', theme: 'storm', icon: 'CloudLightning' },
    };

    return weatherMap[code] || { text: 'Unknown', theme: isDay ? 'clear-day' : 'clear-night', icon: 'Sun' };
};

export const formatDay = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/** Converts a wind direction in degrees to a compass label */
export const getWindDirection = (degrees) => {
    if (degrees === null || degrees === undefined) return '—';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(degrees / 22.5) % 16];
};

/** Returns a descriptive label + color for surface pressure in hPa */
export const getPressureInfo = (hPa) => {
    if (hPa === null || hPa === undefined) return { label: 'Unknown', color: '#94a3b8' };
    if (hPa < 990) return { label: 'Very Low', color: '#ef4444' };
    if (hPa < 1005) return { label: 'Low', color: '#f97316' };
    if (hPa < 1020) return { label: 'Normal', color: '#10b981' };
    if (hPa < 1035) return { label: 'High', color: '#3b82f6' };
    return { label: 'Very High', color: '#8b5cf6' };
};

/** Returns a visibility label */
export const getVisibilityLabel = (meters) => {
    if (meters === null || meters === undefined) return '—';
    const km = meters / 1000;
    if (km >= 10) return 'Excellent';
    if (km >= 5) return 'Good';
    if (km >= 2) return 'Moderate';
    if (km >= 1) return 'Poor';
    return 'Very Poor';
};

/** Returns UV index advice */
export const getUvAdvice = (uv) => {
    if (uv <= 2) return { label: 'Low', advice: 'No protection needed', color: '#10b981' };
    if (uv <= 5) return { label: 'Moderate', advice: 'Wear sunscreen', color: '#84cc16' };
    if (uv <= 7) return { label: 'High', advice: 'Seek shade midday', color: '#f59e0b' };
    if (uv <= 10) return { label: 'Very High', advice: 'SPF 50+ essential', color: '#f97316' };
    return { label: 'Extreme', advice: 'Avoid sun exposure', color: '#ef4444' };
};

/** Returns feels-like comparison string */
export const getFeelsLikeComparison = (actual, feelsLike) => {
    const diff = Math.round(feelsLike - actual);
    if (Math.abs(diff) <= 1) return 'Similar to actual';
    if (diff > 0) return `Feels ${diff}° hotter`;
    return `Feels ${Math.abs(diff)}° cooler`;
};
