import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPinOff } from 'lucide-react';
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
                // Fetch reverse geocoding from API service
                locName = await fetchReverseGeocode(lat, lon);
            }
            setLocationName(locName);

            // Fetch Open-Meteo data from API service
            const data = await fetchWeatherByCoords(lat, lon);
            setWeatherData(data);

        } catch (err) {
            setError(err.message || 'Failed to fetch weather data.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Auto-refresh interval (15 minutes)
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (currentLocation.current) {
                const { lat, lon, name } = currentLocation.current;
                fetchWeatherData(lat, lon, name, true); // silent refresh
            }
        }, 15 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        // Load Mumbai by default as requested
        fetchWeatherData(19.0760, 72.8777, 'Mumbai');
    }, []);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: 500 }}>Connecting to atmosphere...</p>
                <style>{'@keyframes spin { 100% { transform: rotate(360deg); } }'}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <MapPinOff size={56} />
                <p style={{ textAlign: 'center', maxWidth: '300px', fontWeight: 500 }}>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#4c8ae6', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!weatherData) return null;

    if (!weatherData) return null;

    const handleLocationSelect = (lat, lon, name) => {
        fetchWeatherData(lat, lon, name);
    };

    return (
        <>
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
        </>
    );
}

export default App;
