import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Sun, Moon, Cloud, Navigation, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherDetails } from '../utils/weatherUtils';
import { searchCity } from '../api/weatherApi';
import SkylineVector from './vectors/SkylineVector';
import CurrentWeather from './CurrentWeather';

const FAVORITES_KEY = 'ambient_weather_favorites';

const Sidebar = ({ current, daily, locationName, timezone, unit, setUnit, onLocationSelect, onGpsRequest, loading, favorites = [], setFavorites }) => {
    const [time, setTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const searchRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 30000); // 30s interval
        return () => {
            clearInterval(timer);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim().length > 2) {
            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const results = await searchCity(query);
                    setSearchResults(results);
                } catch { setSearchResults([]); }
                finally { setIsSearching(false); }
            }, 300);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectCity = (city) => {
        const name = `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;
        onLocationSelect(city.latitude, city.longitude, name);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleGps = () => {
        setIsLocating(true);
        onGpsRequest();
        setTimeout(() => setIsLocating(false), 3000);
    };

    const saveFavorite = (e, city) => {
        e.stopPropagation();
        const name = `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;
        const fav = { name, lat: city.latitude, lon: city.longitude };
        const updated = [fav, ...favorites.filter(f => f.name !== name)].slice(0, 5);
        setFavorites(updated);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    };

    const removeFavorite = (e, name) => {
        e.stopPropagation();
        const updated = favorites.filter(f => f.name !== name);
        setFavorites(updated);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    };

    const details = current ? getWeatherDetails(current.weather_code, current.is_day) : { theme: 'clear-night' };
    const isDay = current?.is_day === 1;
    const showNightBg = !isDay;

    // Sun arc math
    const localTimeStr = time.toLocaleString('en-US', { timeZone: timezone });
    const localMs = new Date(localTimeStr).getTime();
    const parseLocalStr = (str) => new Date(str.replace('T', ' ')).getTime();
    const todaySunriseMs = daily?.sunrise?.[0] ? parseLocalStr(daily.sunrise[0]) : localMs - 12 * 3600000;
    const todaySunsetMs  = daily?.sunset?.[0]  ? parseLocalStr(daily.sunset[0])  : localMs + 12 * 3600000;
    const formatSunTime  = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    let isDaytime = true, progress = 0, topLabel = '', bottomLabel = '', topTime = '', bottomTime = '';
    if (localMs >= todaySunriseMs && localMs < todaySunsetMs) {
        isDaytime = true; progress = (localMs - todaySunriseMs) / (todaySunsetMs - todaySunriseMs);
        topLabel = 'Sunrise'; bottomLabel = 'Sunset';
        topTime = formatSunTime(todaySunriseMs); bottomTime = formatSunTime(todaySunsetMs);
    } else {
        isDaytime = false; topLabel = 'Sunset'; bottomLabel = 'Sunrise';
        if (localMs < todaySunriseMs) {
            const ySunset = todaySunsetMs - 86400000;
            progress = (localMs - ySunset) / (todaySunriseMs - ySunset);
            topTime = formatSunTime(ySunset); bottomTime = formatSunTime(todaySunriseMs);
        } else {
            const tSunrise = daily?.sunrise?.[1] ? parseLocalStr(daily.sunrise[1]) : todaySunriseMs + 86400000;
            progress = (localMs - todaySunsetMs) / (tSunrise - todaySunsetMs);
            topTime = formatSunTime(todaySunsetMs); bottomTime = formatSunTime(tSunrise);
        }
    }
    progress = Math.max(0, Math.min(1, progress));
    const angle = Math.PI - progress * Math.PI;
    const sunX = 140 + 120 * Math.cos(angle);
    const sunY = 80 - 60 * Math.sin(angle);



    return (
        <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            className="sidebar"
        >
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', zIndex: 60, position: 'relative' }}>
                <motion.h1
                    whileHover={{ scale: 1.04 }}
                    style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}
                >
                    <Cloud size={22} fill="currentColor" strokeWidth={0} /> Ambient Weather
                </motion.h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* GPS button */}
                    <button
                        className={`gps-btn ${isLocating ? 'locating' : ''}`}
                        onClick={handleGps}
                        title="Use my location"
                    >
                        <Navigation size={16} fill={isLocating ? 'currentColor' : 'none'} />
                    </button>



                    {/* Pill C/F toggle */}
                    <div className="unit-toggle">
                        <div
                            className="unit-toggle-slider"
                            style={{ transform: unit === 'F' ? 'translateX(32px)' : 'translateX(0px)' }}
                        />
                        {['C', 'F'].map(u => (
                            <button
                                key={u}
                                className={`unit-toggle-btn ${unit === u ? 'active' : ''}`}
                                onClick={() => setUnit(u)}
                            >
                                °{u}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Search bar ── */}
            <div ref={searchRef} style={{ position: 'relative', marginBottom: '1.2rem', zIndex: 60 }}>
                <div className="sidebar-search-container">
                    <Search size={16} style={{ marginRight: '10px', opacity: 0.7, flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Search city..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="sidebar-search-input"
                    />
                    {isSearching && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                            style={{
                                width: 14,
                                height: 14,
                                border: '2px solid var(--input-border)',
                                borderTopColor: 'var(--text-primary)',
                                borderRadius: '50%',
                                flexShrink: 0
                            }}
                        />
                    )}
                </div>

                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="search-results-panel"
                        >
                            {searchResults.map((city) => (
                                <div
                                    key={city.id}
                                    className="search-result-item"
                                    onClick={() => handleSelectCity(city)}
                                >
                                    <span>{city.name}{city.admin1 ? `, ${city.admin1}` : ''} <span style={{ opacity: 0.4 }}>{city.country_code}</span></span>
                                    <Star
                                        size={15}
                                        style={{ flexShrink: 0, color: '#f59e0b', cursor: 'pointer' }}
                                        onClick={(e) => saveFavorite(e, city)}
                                    />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Favorite chips ── */}
            {favorites.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.2rem', zIndex: 55 }}>
                    {favorites.map(fav => (
                        <div key={fav.name} className="fav-chip" onClick={() => onLocationSelect(fav.lat, fav.lon, fav.name)}>
                            <Star size={11} fill="currentColor" style={{ color: '#fbbf24' }} />
                            {fav.name.split(',')[0]}
                            <span
                                onClick={(e) => removeFavorite(e, fav.name)}
                                style={{ opacity: 0.5, marginLeft: '2px', lineHeight: 1, cursor: 'pointer' }}
                            >
                                <X size={10} />
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Current Weather ── */}
            {loading ? (
                <div style={{ marginTop: 'auto', marginBottom: '8rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton" style={{ height: '28px', width: '60%' }} />
                    <div className="skeleton" style={{ height: '90px', width: '80%', marginTop: '16px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '50%' }} />
                    <div className="skeleton" style={{ height: '60px', width: '100%', marginTop: '8px', borderRadius: '18px' }} />
                </div>
            ) : current ? (
                <CurrentWeather
                    current={current}
                    daily={daily}
                    locationName={locationName}
                    weatherDetails={details}
                    time={time}
                    timezone={timezone}
                    unit={unit}
                />
            ) : null}

            {/* ── Sun/Moon Arc ── */}
            <div className="sun-arc-horizontal" style={{ width: '100%', height: '115px', position: 'relative', marginTop: 'auto', marginBottom: '16px', zIndex: 15, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '280px', height: '115px', position: 'relative' }}>
                    <svg width="280" height="90" viewBox="0 0 280 90" style={{ opacity: 0.95, position: 'absolute', top: 0, left: 0 }}>
                        <path d="M 20 80 A 120 60 0 0 1 260 80" fill="none" stroke="url(#hg)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="6 4" />
                        <defs>
                            <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%"   stopColor="var(--sun-arc-stroke)" stopOpacity="0.15" />
                                <stop offset="50%"  stopColor="var(--sun-arc-stroke)" stopOpacity="1.0" />
                                <stop offset="100%" stopColor="var(--sun-arc-stroke)" stopOpacity="0.15" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Glowing orb */}
                    <div style={{
                        position: 'absolute', left: `${sunX - 14}px`, top: `${sunY - 14}px`,
                        width: '28px', height: '28px',
                        background: isDaytime ? '#fbbf24' : 'var(--text-secondary)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDaytime 
                            ? '0 0 18px rgba(251,191,36,0.9), 0 0 36px rgba(251,191,36,0.4)' 
                            : 'var(--sun-orb-shadow)',
                        transition: 'left 1s ease-out, top 1s ease-out',
                        willChange: 'transform',
                        zIndex: 10
                    }}>
                        {isDaytime ? <Sun size={15} color="#92400e" fill="#92400e" /> : <Moon size={15} color="#334155" fill="#334155" />}
                    </div>
                    {/* Sunrise Label */}
                    <div style={{ position: 'absolute', bottom: '0', left: '20px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85, color: 'var(--text-primary)' }}>{topLabel}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.55, color: 'var(--text-secondary)' }}>{topTime}</div>
                    </div>
                    {/* Sunset Label */}
                    <div style={{ position: 'absolute', bottom: '0', left: '260px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85, color: 'var(--text-primary)' }}>{bottomLabel}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.55, color: 'var(--text-secondary)' }}>{bottomTime}</div>
                    </div>
                </div>
            </div>

            <SkylineVector showNightBg={showNightBg} />
        </motion.div>
    );
};

export default Sidebar;
