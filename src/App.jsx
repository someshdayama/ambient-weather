import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPinOff, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { fetchReverseGeocode, fetchWeatherByCoords } from './api/weatherApi';
import './index.css';

function App() {
    const [weatherData, setWeatherData] = useState(null);
    const [locationName, setLocationName] = useState('Locating...');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useState('C');
    const [theme, setTheme] = useState('dark');
    const currentLocation = useRef(null);

    const fetchWeatherData = async (lat, lon, name = null, silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);
            currentLocation.current = { lat, lon, name: name || locationName };
            let locName = name;

            if (!locName) {
                locName = await fetchReverseGeocode(lat, lon);
            }
            setLocationName(locName);

            const data = await fetchWeatherByCoords(lat, lon);
            setWeatherData(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch weather data.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (currentLocation.current) {
                const { lat, lon, name } = currentLocation.current;
                fetchWeatherData(lat, lon, name, true);
            }
        }, 15 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        fetchWeatherData(19.0760, 72.8777, 'Mumbai');
    }, []);

    // Loader Animation
    if (loading) {
        return (
            <div className="loader-container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex-col flex-center"
                    style={{ gap: '1.5rem' }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        style={{ display: 'inline-block' }}
                    >
                        <Cloud size={64} style={{ fill: 'var(--accent-glow)' }} color="var(--accent-color)" strokeWidth={1.5} />
                    </motion.div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '2px', opacity: 0.8 }}>
                        Connecting to atmosphere...
                    </h2>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', margin: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                >
                    <MapPinOff size={56} style={{ color: '#ef4444' }} />
                    <h2 style={{ fontWeight: 600 }}>Location Error</h2>
                    <p style={{ opacity: 0.8, fontSize: '1rem' }}>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.8rem 2rem', background: 'var(--accent-color)', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.3s' }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!weatherData) return null;

    const handleLocationSelect = (lat, lon, name) => {
        fetchWeatherData(lat, lon, name);
    };

    return (
        <AnimatePresence>
            <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{ display: 'flex', width: '100%', height: '100%' }}
            >
                <Sidebar
                    current={weatherData.current}
                    daily={weatherData.daily}
                    locationName={locationName}
                    timezone={weatherData.timezone}
                    unit={unit}
                    setUnit={setUnit}
                    theme={theme}
                    setTheme={setTheme}
                    onLocationSelect={handleLocationSelect}
                />
                <Dashboard
                    weatherData={weatherData}
                    unit={unit}
                    theme={theme}
                />
            </motion.div>
        </AnimatePresence>
    );
}

export default App;
