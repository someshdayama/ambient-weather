export const getWeatherDetails = (code, isDay = 1) => {
    // WMO Weather interpretation codes (Open-Meteo)
    // Mapping to theme data attributes and descriptive text
    const weatherMap = {
        0: { text: 'Clear sky', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        1: { text: 'Mainly clear', theme: isDay ? 'clear-day' : 'clear-night', icon: isDay ? 'Sun' : 'Moon' },
        2: { text: 'Partly cloudy', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'CloudSun' },
        3: { text: 'Overcast', theme: isDay ? 'cloudy' : 'cloudy-night', icon: 'Cloud' },
        45: { text: 'Fog', theme: 'cloudy', icon: 'CloudFog' },
        48: { text: 'Depositing rime fog', theme: 'cloudy', icon: 'CloudFog' },
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
        82: { text: 'Violent rain showers', theme: 'rain', icon: 'CloudLightning' },
        95: { text: 'Thunderstorm', theme: 'rain', icon: 'CloudLightning' },
        96: { text: 'Thunderstorm with slight hail', theme: 'rain', icon: 'CloudLightning' },
        99: { text: 'Thunderstorm with heavy hail', theme: 'rain', icon: 'CloudLightning' },
    };

    return weatherMap[code] || { text: 'Unknown', theme: isDay ? 'clear-day' : 'clear-night', icon: 'Sun' };
};

export const formatDay = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};
