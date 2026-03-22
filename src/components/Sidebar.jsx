import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, ChevronRight, Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Search } from 'lucide-react';
import { getWeatherDetails } from '../utils/weatherUtils';
import { searchCity } from '../api/weatherApi';
import SkylineVector from './vectors/SkylineVector';

const WeatherIcons = { Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

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
    const Icon = WeatherIcons[details.icon] || WeatherIcons.Sun;

    const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
    const displayTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });
    const isDay = current.is_day === 1;

    const displayTemp = unit === 'F' ? Math.round((current.temperature_2m * 9 / 5) + 32) : Math.round(current.temperature_2m);

    const localTimeStr = time.toLocaleString('en-US', { timeZone: timezone });
    const localMs = new Date(localTimeStr).getTime();

    const parseLocalStr = (str) => new Date(str.replace('T', ' ')).getTime();
    const todaySunriseMs = daily?.sunrise?.[0] ? parseLocalStr(daily.sunrise[0]) : localMs - 12 * 3600000;
    const todaySunsetMs = daily?.sunset?.[0] ? parseLocalStr(daily.sunset[0]) : localMs + 12 * 3600000;

    let isDaytime = true;
    let progress = 0;
    let topLabel = '';
    let bottomLabel = '';
    let topTime = '';
    let bottomTime = '';

    const formatSunTime = (ms) => {
        return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

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

    const angleRange = 0.9273; // asin(120/150)
    const currentAngle = Math.PI + angleRange - progress * (2 * angleRange);
    const sunX = 180 + 150 * Math.cos(currentAngle);
    const sunY = 150 + 150 * Math.sin(currentAngle);

    // Theme logic for the sidebar background based on light/dark mode and time of day
    // Dark mode forces the night theme gradient, light mode uses day/night based on time
    const showNightBg = theme === 'dark' || !isDay;
    const sidebarStyle = {
        background: showNightBg ? 'linear-gradient(180deg, #1b263b, #0d1b2a)' : 'linear-gradient(180deg, #4da4f9, #3884ff)',
        color: '#ffffff',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible', // Changed from hidden so dropdown can show
        transition: 'background 1s ease'
    };

    return (
        <div className="sidebar" style={sidebarStyle}>
            {/* App Branding */}
            <div style={{ marginBottom: '1.5rem', zIndex: 50, position: 'relative' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.5px', color: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cloud bg="transparent" fill="currentColor" size={24} /> Ambient Weather
                </h1>
            </div>

            {/* Search and Controls */}
            <div className="sidebar-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative', zIndex: 50 }}>
                {/* Search Bar */}
                <div ref={searchRef} style={{ position: 'relative', flex: 1, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px' }}>
                        <Search size={16} style={{ marginRight: '8px', opacity: 0.8 }} />
                        <input
                            type="text"
                            placeholder="Search city..."
                            value={searchQuery}
                            onChange={handleSearch}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                outline: 'none',
                                width: '100%',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: 'white', color: '#333', borderRadius: '12px',
                            marginTop: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            maxHeight: '200px', overflowY: 'auto'
                        }}>
                            {searchResults.map((city) => (
                                <div
                                    key={city.id}
                                    onClick={() => handleSelectCity(city)}
                                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px' }}
                                    onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
                                    onMouseOut={(e) => e.target.style.background = 'white'}
                                >
                                    {city.name}{city.admin1 ? `, ${city.admin1}` : ''}, {city.country_code}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme & Unit Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Theme Toggle */}
                    <div
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', width: '30px', height: '30px', borderRadius: '50%' }}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <Moon size={16} fill="white" /> : <Sun size={16} fill="white" />}
                    </div>

                    {/* Unit Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                        <span style={{ opacity: unit === 'C' ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setUnit('C')}>°C</span>
                        <div
                            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                            style={{ width: '30px', height: '16px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}
                        >
                            <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'absolute', left: unit === 'C' ? '2px' : '16px', top: '2px', transition: 'left 0.2s ease' }}></div>
                        </div>
                        <span style={{ opacity: unit === 'F' ? 1 : 0.5, cursor: 'pointer' }} onClick={() => setUnit('F')}>°F</span>
                    </div>
                </div>
            </div>

            {/* Location & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem', zIndex: 10 }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={20} /> {locationName}
                    </h2>
                    <p style={{ opacity: 0.8, fontSize: '1rem', marginTop: '8px' }}>{formattedDate} • {displayTime}</p>
                </div>
            </div>

            {/* Main Temperature */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', zIndex: 10 }}>
                <h1 style={{ fontSize: '7rem', fontWeight: 600, letterSpacing: '-4px', lineHeight: 1 }}>
                    {displayTemp}°
                </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 500, zIndex: 10 }}>
                <Icon size={28} /> {details.text}
            </div>

            {/* Sun/Moon Arc */}
            <div className="sun-arc" style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                width: '100px', height: '300px', zIndex: 15, pointerEvents: 'none'
            }}>
                <svg width="100" height="300" viewBox="0 0 100 300" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <path d="M 90 30 A 150 150 0 0 0 90 270" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />
                </svg>

                {/* Labels */}
                <div className="sun-label-top" style={{ position: 'absolute', right: '15px', top: '0px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, color: 'white' }}>{topLabel}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, color: 'white' }}>{topTime}</div>
                </div>

                <div className="sun-label-bottom" style={{ position: 'absolute', right: '15px', bottom: '0px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, color: 'white' }}>{bottomLabel}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, color: 'white' }}>{bottomTime}</div>
                </div>

                {/* Traveling Icon */}
                <div style={{
                    position: 'absolute', left: `${sunX - 16}px`, top: `${sunY - 16}px`,
                    width: '32px', height: '32px', background: isDaytime ? '#ffca28' : '#e0e0e0',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isDaytime ? '0 0 15px rgba(255,202,40,0.6)' : '0 0 15px rgba(224,224,224,0.4)',
                    transition: 'all 1s ease-out'
                }}>
                    {isDaytime ? <Sun size={20} color="#c79100" fill="#c79100" /> : <Moon size={20} color="#424242" fill="#424242" />}
                </div>
            </div>

            {/* Cityscape Graphic Isolated Component */}
            <SkylineVector showNightBg={showNightBg} />
        </div>
    );
};

export default Sidebar;
