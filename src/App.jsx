import React, { useState, useEffect, useRef } from 'react';
import { MapPinOff, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WeatherParticles from './components/WeatherParticles';
import { fetchReverseGeocode, fetchWeatherByCoords } from './api/weatherApi';
import { getWeatherDetails } from './utils/weatherUtils';
import './index.css';

function App() {
    const [weatherData, setWeatherData] = useState(null);
    const [locationName, setLocationName] = useState('Mumbai');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useState('C');
    const [theme, setTheme] = useState('dark');
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ambient_weather_favorites')) || []; }
        catch { return []; }
    });
    const currentLocation = useRef(null);

    const fetchWeatherData = async (lat, lon, name = null, silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);
            currentLocation.current = { lat, lon, name: name || locationName };
            let locName = name;
            if (!locName) locName = await fetchReverseGeocode(lat, lon);
            setLocationName(locName);
            const data = await fetchWeatherByCoords(lat, lon);
            setWeatherData(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch weather data.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 15 min silently (no full reload)
    useEffect(() => {
        const id = setInterval(() => {
            if (currentLocation.current) {
                const { lat, lon, name } = currentLocation.current;
                fetchWeatherData(lat, lon, name, true);
            }
        }, 15 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    // Theme attribute
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Set weather-reactive background attribute
    useEffect(() => {
        if (weatherData) {
            const details = getWeatherDetails(weatherData.current.weather_code, weatherData.current.is_day);
            document.documentElement.setAttribute('data-weather', details.theme);
            document.documentElement.setAttribute('data-time-of-day', weatherData.current.is_day === 1 ? 'day' : 'night');
        }
    }, [weatherData]);

    // Boot: load default city immediately, no blocking screen
    useEffect(() => {
        fetchWeatherData(19.0760, 72.8777, 'Mumbai');
    }, []);

    const handleLocationSelect = (lat, lon, name) => {
        fetchWeatherData(lat, lon, name, true);
    };

    const handleGpsLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => fetchWeatherData(coords.latitude, coords.longitude, null, true),
            (err) => console.warn('GPS error:', err.message)
        );
    };

    const weatherDetails = weatherData
        ? getWeatherDetails(weatherData.current.weather_code, weatherData.current.is_day)
        : { theme: theme === 'dark' ? 'clear-night' : 'clear-day' };

    // ── Error state (non-blocking) ──────────────────────────────────────────────
    if (error && !weatherData) {
        return (
            <div className="error-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                >
                    <MapPinOff size={52} style={{ color: '#ef4444' }} />
                    <h2 style={{ fontWeight: 600 }}>Couldn't reach the atmosphere</h2>
                    <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>{error}</p>
                    <button
                        onClick={() => fetchWeatherData(19.0760, 72.8777, 'Mumbai')}
                        style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: 'var(--accent-color)', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'transform 0.2s ease' }}
                        onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                    >
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="app-wrapper"
            >
                {/* Weather-reactive ambient particles */}
                <WeatherParticles weatherTheme={weatherDetails.theme} />

                <Sidebar
                    current={weatherData?.current}
                    daily={weatherData?.daily}
                    locationName={locationName}
                    timezone={weatherData?.timezone || 'Asia/Kolkata'}
                    unit={unit}
                    setUnit={setUnit}
                    theme={theme}
                    setTheme={setTheme}
                    onLocationSelect={handleLocationSelect}
                    onGpsRequest={handleGpsLocation}
                    loading={loading}
                    favorites={favorites}
                    setFavorites={setFavorites}
                />
                <Dashboard
                    weatherData={weatherData}
                    unit={unit}
                    theme={theme}
                    onLocationSelect={handleLocationSelect}
                    loading={loading}
                    favorites={favorites}
                />
            </motion.div>
        </AnimatePresence>
    );
}

export default App;
