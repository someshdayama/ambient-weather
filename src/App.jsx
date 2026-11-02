import React, { useEffect, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import { motion, MotionConfig } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WeatherParticles from './components/WeatherParticles';
import Toast from './components/Toast';
import { useWeather } from './hooks/useWeather';
import { getWeatherDetails } from './utils/weatherUtils';
import { KEYS, readJSON, readString, writeJSON, writeString } from './utils/storage';

function App() {
    const weather = useWeather();
    const { weatherData, location, loading, error } = weather;

    const [unit, setUnit] = useState(() => (readString(KEYS.unit, 'C') === 'F' ? 'F' : 'C'));
    const [favorites, setFavorites] = useState(() => {
        const f = readJSON(KEYS.favorites, []);
        return Array.isArray(f) ? f : [];
    });

    useEffect(() => writeString(KEYS.unit, unit), [unit]);
    useEffect(() => writeJSON(KEYS.favorites, favorites), [favorites]);

    const weatherDetails = weatherData
        ? getWeatherDetails(weatherData.current.weather_code, weatherData.current.is_day)
        : { theme: 'clear-night' };

    useEffect(() => {
        document.documentElement.setAttribute('data-weather', weatherDetails.theme);
    }, [weatherDetails.theme]);

    // First run with no cached data and the request failed: full-screen error.
    if (error && !weatherData && !loading) {
        return (
            <div className="error-container" role="alert">
                <div className="glass-panel error-panel">
                    <MapPinOff size={48} aria-hidden="true" />
                    <h2>Couldn&apos;t reach the weather service</h2>
                    <p>{error.message}</p>
                    <button type="button" className="btn-primary" onClick={() => (error.retry ? error.retry() : weather.refresh())}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="app-wrapper"
            >
                <WeatherParticles weatherTheme={weatherDetails.theme} />

                <Sidebar
                    weather={weather}
                    unit={unit}
                    setUnit={setUnit}
                    favorites={favorites}
                    setFavorites={setFavorites}
                />
                <Dashboard
                    weatherData={weatherData}
                    unit={unit}
                    onLocationSelect={weather.selectLocation}
                    onGpsRequest={weather.requestGps}
                    gpsState={weather.gpsState}
                    loading={loading && !weatherData}
                    favorites={favorites}
                    location={location}
                />

                {error && weatherData && (
                    <Toast
                        message={error.message}
                        onRetry={error.retry}
                        onDismiss={weather.dismissError}
                    />
                )}
            </motion.div>
        </MotionConfig>
    );
}

export default App;
