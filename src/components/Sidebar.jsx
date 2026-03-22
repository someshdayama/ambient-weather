import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Sun, Moon, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherDetails } from '../utils/weatherUtils';
import { searchCity } from '../api/weatherApi';
import SkylineVector from './vectors/SkylineVector';
import CurrentWeather from './CurrentWeather';

const Sidebar = ({ current, daily, locationName, timezone, unit, setUnit, theme, setTheme, onLocationSelect }) => {
    const [time, setTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length > 2) {
            setIsSearching(true);
            try {
                const results = await searchCity(query);
                setSearchResults(results);
            } catch (err) {
                console.error(err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectCity = (city) => {
        onLocationSelect(city.latitude, city.longitude, `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`);
        setSearchQuery('');
        setSearchResults([]);
    };

    const details = getWeatherDetails(current.weather_code, current.is_day);
    const isDay = current.is_day === 1;

    const localTimeStr = time.toLocaleString('en-US', { timeZone: timezone });
    const localMs = new Date(localTimeStr).getTime();
    const parseLocalStr = (str) => new Date(str.replace('T', ' ')).getTime();
    
    // Sun times calculations with fallback logic
    const todaySunriseMs = daily?.sunrise?.[0] ? parseLocalStr(daily.sunrise[0]) : localMs - 12 * 3600000;
    const todaySunsetMs = daily?.sunset?.[0] ? parseLocalStr(daily.sunset[0]) : localMs + 12 * 3600000;

    const formatSunTime = (ms) => {
        return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    let isDaytime = true;
    let progress = 0;
    let topLabel = '';
    let bottomLabel = '';
    let topTime = '';
    let bottomTime = '';
    
    if (localMs >= todaySunriseMs && localMs < todaySunsetMs) {
        isDaytime = true;
        progress = (localMs - todaySunriseMs) / (todaySunsetMs - todaySunriseMs);
        topLabel = 'Sunrise';
        bottomLabel = 'Sunset';
        topTime = formatSunTime(todaySunriseMs);
        bottomTime = formatSunTime(todaySunsetMs);
    } else {
        isDaytime = false;
        topLabel = 'Sunset';
        bottomLabel = 'Sunrise';
        
        if (localMs < todaySunriseMs) {
            const yesterdaySunsetMs = todaySunsetMs - 24 * 60 * 60 * 1000;
            progress = (localMs - yesterdaySunsetMs) / (todaySunriseMs - yesterdaySunsetMs);
            topTime = formatSunTime(yesterdaySunsetMs);
            bottomTime = formatSunTime(todaySunriseMs);
        } else {
            const tomorrowSunriseMs = daily?.sunrise?.[1] ? parseLocalStr(daily.sunrise[1]) : todaySunriseMs + 24 * 60 * 60 * 1000;
            progress = (localMs - todaySunsetMs) / (tomorrowSunriseMs - todaySunsetMs);
            topTime = formatSunTime(todaySunsetMs);
            bottomTime = formatSunTime(tomorrowSunriseMs);
        }
    }
    progress = Math.max(0, Math.min(1, progress));
    const showNightBg = theme === 'dark' || !isDay;

    // Horizontal Arc positioning math (width 200, height 100 bounding box)
    // Left endpoint = 20, 90. Right endpoint = 180, 90. 
    // Arc radius = 80.
    const angle = Math.PI - (progress * Math.PI);
    const sunX = 100 + 80 * Math.cos(angle);
    const sunY = 90 - 80 * Math.sin(angle);

    return (
        <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="sidebar"
            style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 50,
                background: showNightBg ? 'linear-gradient(180deg, rgba(8,13,22,0.85), rgba(2,6,15,0.98))' : 'linear-gradient(180deg, rgba(77,164,249,0.8), rgba(56,132,255,0.95))',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.1)',
                color: 'white',
                padding: '2.5rem',
                overflow: 'hidden'
            }}
        >
            {/* Header: Logo and Toggles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', zIndex: 60, position: 'relative' }}>
                <motion.h1 
                    whileHover={{ scale: 1.05 }}
                    style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <Cloud size={24} fill="white" /> Ambient Weather
                </motion.h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%', color: 'white' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={theme}
                                initial={{ y: -10, opacity: 0, rotate: -90 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 10, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === 'dark' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} fill="currentColor" />}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* Smart Search Bar */}
            <div ref={searchRef} style={{ position: 'relative', marginBottom: '3rem', zIndex: 60 }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', 
                    background: 'rgba(255,255,255,0.15)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '12px 16px', 
                    borderRadius: '16px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.3s'
                }}>
                    <Search size={18} style={{ marginRight: '10px', opacity: 0.8 }} />
                    <input
                        type="text"
                        placeholder="Search another city..."
                        value={searchQuery}
                        onChange={handleSearch}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            outline: 'none',
                            width: '100%',
                            fontSize: '15px',
                            fontWeight: 400
                        }}
                    />
                </div>
                
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#1e293b', 
                                borderRadius: '16px',
                                marginTop: '12px', 
                                overflow: 'hidden', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                maxHeight: '250px', 
                                overflowY: 'auto',
                                zIndex: 100
                            }}
                        >
                            {searchResults.map((city) => (
                                <motion.div
                                    whileHover={{ background: 'rgba(59, 130, 246, 0.1)', paddingLeft: '24px' }}
                                    key={city.id}
                                    onClick={() => handleSelectCity(city)}
                                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '14px', fontWeight: 500, transition: 'padding 0.2s' }}
                                >
                                    {city.name}{city.admin1 ? `, ${city.admin1}` : ''}, <span style={{opacity: 0.5}}>{city.country_code}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CurrentWeather 
                current={current} 
                locationName={locationName} 
                weatherDetails={details} 
                time={time} 
                timezone={timezone}
            />

            {/* Horizontal Sun/Moon Arc at Bottom */}
            <div className="sun-arc-horizontal" style={{
                width: '100%', height: '140px', position: 'relative', marginTop: 'auto', marginBottom: '20px', zIndex: 15
            }}>
                {/* SVG Horizontal Arc */}
                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px' }}>
                    <svg width="200" height="100" viewBox="0 0 200 100" style={{ opacity: 0.5 }}>
                        <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#horizGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 8" />
                        <defs>
                            <linearGradient id="horizGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                                <stop offset="50%" stopColor="rgba(255,255,255,1)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    
                    {/* Traveling Icon on Horizontal Arc */}
                    <div style={{
                        position: 'absolute', left: `${sunX - 16}px`, top: `${sunY - 16}px`,
                        width: '32px', height: '32px', background: isDaytime ? '#fbbf24' : '#e2e8f0',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDaytime ? '0 0 20px rgba(251,191,36,0.8)' : '0 0 20px rgba(226,232,240,0.5)',
                        transition: 'all 1s ease-out'
                    }}>
                        {isDaytime ? <Sun size={18} color="#92400e" fill="#92400e" /> : <Moon size={18} color="#334155" fill="#334155" />}
                    </div>
                </div>

                {/* Left Label (Sunrise/Sunset) */}
                <div style={{ position: 'absolute', bottom: '0', left: '20px', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, color: 'white' }}>{topLabel}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'white' }}>{topTime}</div>
                </div>

                {/* Right Label */}
                <div style={{ position: 'absolute', bottom: '0', right: '20px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, color: 'white' }}>{bottomLabel}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, color: 'white' }}>{bottomTime}</div>
                </div>
            </div>

            <SkylineVector showNightBg={showNightBg} />
        </motion.div>
    );
};

export default Sidebar;
