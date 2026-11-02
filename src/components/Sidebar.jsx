import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Cloud, Navigation, Star, X, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherDetails, parseLocalTime, locationNowMs, formatClock, formatAgo } from '../utils/weatherUtils';
import { searchCity } from '../api/weatherApi';
import SkylineVector from './vectors/SkylineVector';
import CurrentWeather from './CurrentWeather';

const MAX_FAVORITES = 5;
const cityLabel = (city) => `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;

const Sidebar = ({ weather, unit, setUnit, favorites = [], setFavorites }) => {
    const { weatherData, location, fetchedAt, isStale, loading, refreshing, gpsState, requestGps, selectLocation, refresh } = weather;
    const current = weatherData?.current;
    const daily = weatherData?.daily;
    const timezone = weatherData?.timezone || 'Asia/Kolkata';
    const utcOffset = weatherData?.utc_offset_seconds ?? 19800;

    const [time, setTime] = useState(() => new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const searchRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const searchAbortRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 30000);
        return () => {
            clearInterval(timer);
            clearTimeout(searchTimeoutRef.current);
            searchAbortRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    const closeResults = () => {
        setSearchResults([]);
        setActiveIndex(-1);
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSearchError(null);
        clearTimeout(searchTimeoutRef.current);

        if (query.trim().length > 2) {
            searchTimeoutRef.current = setTimeout(async () => {
                searchAbortRef.current?.abort();
                const controller = new AbortController();
                searchAbortRef.current = controller;
                setIsSearching(true);
                try {
                    const results = await searchCity(query, { signal: controller.signal });
                    setSearchResults(results);
                    setActiveIndex(-1);
                    if (!results.length) setSearchError('No matching places');
                } catch (err) {
                    if (err?.name === 'AbortError') return;
                    setSearchResults([]);
                    setSearchError(err.message);
                } finally {
                    if (searchAbortRef.current === controller) setIsSearching(false);
                }
            }, 300);
        } else {
            closeResults();
        }
    };

    const handleSelectCity = (city) => {
        selectLocation(city.latitude, city.longitude, cityLabel(city));
        setSearchQuery('');
        closeResults();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeResults();
            return;
        }
        if (!searchResults.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % searchResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? searchResults.length - 1 : i - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelectCity(searchResults[Math.max(0, activeIndex)]);
        }
    };

    const isFavorite = (name) => favorites.some((f) => f.name === name);

    const toggleFavorite = (city) => {
        const name = cityLabel(city);
        if (isFavorite(name)) {
            setFavorites(favorites.filter((f) => f.name !== name));
            return;
        }
        const fav = { name, lat: city.latitude, lon: city.longitude };
        setFavorites([fav, ...favorites].slice(0, MAX_FAVORITES));
    };

    const removeFavorite = (name) => setFavorites(favorites.filter((f) => f.name !== name));

    const details = current ? getWeatherDetails(current.weather_code, current.is_day) : { theme: 'clear-night' };
    const isDay = current?.is_day === 1;

    // ── Sun arc: everything in the location's wall-clock (see parseLocalTime) ──
    const nowMs = locationNowMs(utcOffset, time.getTime());
    const sunrise0 = parseLocalTime(daily?.sunrise?.[0]);
    const sunset0 = parseLocalTime(daily?.sunset?.[0]);
    const sunrise1 = parseLocalTime(daily?.sunrise?.[1]);
    const todaySunriseMs = Number.isFinite(sunrise0) ? sunrise0 : nowMs - 12 * 3600000;
    const todaySunsetMs = Number.isFinite(sunset0) ? sunset0 : nowMs + 12 * 3600000;

    let isDaytime = true, progress = 0, topLabel = '', bottomLabel = '', topTime = '', bottomTime = '';
    if (nowMs >= todaySunriseMs && nowMs < todaySunsetMs) {
        progress = (nowMs - todaySunriseMs) / (todaySunsetMs - todaySunriseMs);
        topLabel = 'Sunrise'; bottomLabel = 'Sunset';
        topTime = formatClock(todaySunriseMs); bottomTime = formatClock(todaySunsetMs);
    } else {
        isDaytime = false; topLabel = 'Sunset'; bottomLabel = 'Sunrise';
        if (nowMs < todaySunriseMs) {
            const ySunset = todaySunsetMs - 86400000;
            progress = (nowMs - ySunset) / (todaySunriseMs - ySunset);
            topTime = formatClock(ySunset); bottomTime = formatClock(todaySunriseMs);
        } else {
            const tSunrise = Number.isFinite(sunrise1) ? sunrise1 : todaySunriseMs + 86400000;
            progress = (nowMs - todaySunsetMs) / (tSunrise - todaySunsetMs);
            topTime = formatClock(todaySunsetMs); bottomTime = formatClock(tSunrise);
        }
    }
    progress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
    const angle = Math.PI - progress * Math.PI;
    const sunX = 140 + 120 * Math.cos(angle);
    const sunY = 80 - 60 * Math.sin(angle);

    const locating = gpsState === 'locating';
    const listId = 'city-search-results';

    return (
        <motion.aside
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
            className="sidebar"
            aria-label="Current weather and location"
        >
            {/* ── Header ── */}
            <div className="sidebar-header">
                <h1 className="brand">
                    <Cloud size={22} fill="currentColor" strokeWidth={0} aria-hidden="true" /> Ambient Weather
                </h1>

                <div className="sidebar-actions">
                    <button
                        type="button"
                        className={`icon-btn ${locating ? 'locating' : ''}`}
                        onClick={requestGps}
                        aria-label={locating ? 'Finding your location' : 'Use my location'}
                        aria-busy={locating}
                        title="Use my location"
                    >
                        <Navigation size={16} fill={locating ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>

                    <div className="unit-toggle" role="group" aria-label="Units">
                        <div className="unit-toggle-slider" style={{ transform: unit === 'F' ? 'translateX(34px)' : 'translateX(0px)' }} aria-hidden="true" />
                        {['C', 'F'].map((u) => (
                            <button
                                type="button"
                                key={u}
                                className={`unit-toggle-btn ${unit === u ? 'active' : ''}`}
                                onClick={() => setUnit(u)}
                                aria-pressed={unit === u}
                                aria-label={u === 'C' ? 'Celsius, km/h' : 'Fahrenheit, mph'}
                            >
                                °{u}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Search ── */}
            <div ref={searchRef} className="search-wrap">
                <div className="sidebar-search-container">
                    <Search size={16} className="search-icon" aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Search city…"
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        className="sidebar-search-input"
                        aria-label="Search city"
                        role="combobox"
                        aria-expanded={searchResults.length > 0}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `city-opt-${activeIndex}` : undefined}
                        autoComplete="off"
                        enterKeyHint="search"
                    />
                    {isSearching && <span className="spinner" aria-label="Searching" />}
                </div>

                {searchError && !isSearching && searchQuery.trim().length > 2 && !searchResults.length && (
                    <div className="search-hint" role="status">{searchError}</div>
                )}

                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.ul
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="search-results-panel"
                            id={listId}
                            role="listbox"
                            aria-label="Matching places"
                        >
                            {searchResults.map((city, i) => {
                                const name = cityLabel(city);
                                const fav = isFavorite(name);
                                return (
                                    <li
                                        key={city.id}
                                        id={`city-opt-${i}`}
                                        role="option"
                                        aria-selected={i === activeIndex}
                                        className={`search-result-item ${i === activeIndex ? 'active' : ''}`}
                                    >
                                        <button type="button" className="search-result-main" onClick={() => handleSelectCity(city)}>
                                            {name} <span className="muted">{city.country_code}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-btn-plain"
                                            onClick={() => toggleFavorite(city)}
                                            aria-label={fav ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
                                            aria-pressed={fav}
                                        >
                                            <Star size={15} fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
                                        </button>
                                    </li>
                                );
                            })}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Favourites ── */}
            {favorites.length > 0 && (
                <ul className="fav-list" aria-label="Favourite places">
                    {favorites.map((fav) => (
                        <li key={fav.name} className={`fav-chip ${location?.name === fav.name ? 'active' : ''}`}>
                            <button type="button" className="fav-chip-main" onClick={() => selectLocation(fav.lat, fav.lon, fav.name)}>
                                <Star size={11} fill="currentColor" aria-hidden="true" />
                                {fav.name.split(',')[0]}
                            </button>
                            <button type="button" className="fav-chip-remove" onClick={() => removeFavorite(fav.name)} aria-label={`Remove ${fav.name} from favourites`}>
                                <X size={11} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ── Current weather ── */}
            {loading && !current ? (
                <div className="current-skeleton" aria-hidden="true">
                    <div className="skeleton" style={{ height: '28px', width: '60%' }} />
                    <div className="skeleton" style={{ height: '90px', width: '80%', marginTop: '16px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '50%' }} />
                    <div className="skeleton" style={{ height: '60px', width: '100%', marginTop: '8px', borderRadius: '18px' }} />
                </div>
            ) : current ? (
                <CurrentWeather
                    current={current}
                    daily={daily}
                    minutely={weatherData?.minutely_15}
                    nowMs={nowMs}
                    locationName={location?.name}
                    weatherDetails={details}
                    time={time}
                    timezone={timezone}
                    unit={unit}
                />
            ) : null}

            {/* ── Freshness ── */}
            {fetchedAt && (
                <div className={`freshness ${isStale ? 'stale' : ''}`}>
                    <span>{refreshing ? 'Updating…' : `Updated ${formatAgo(fetchedAt, time.getTime())}`}</span>
                    <button type="button" className="icon-btn-plain" onClick={refresh} aria-label="Refresh weather" disabled={refreshing}>
                        <RotateCw size={13} className={refreshing ? 'spin' : ''} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* ── Sun/Moon arc ── */}
            <div className="sun-arc-horizontal" role="img" aria-label={`${topLabel} ${topTime}, ${bottomLabel} ${bottomTime}`}>
                <div className="sun-arc-inner">
                    <svg width="280" height="90" viewBox="0 0 280 90" className="sun-arc-svg" aria-hidden="true">
                        <path d="M 20 80 A 120 60 0 0 1 260 80" fill="none" stroke="url(#hg)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="6 4" />
                        <defs>
                            <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div
                        className={`sun-orb ${isDaytime ? 'day' : 'night'}`}
                        style={{ left: `${sunX - 14}px`, top: `${sunY - 14}px` }}
                        aria-hidden="true"
                    >
                        {isDaytime ? <Sun size={15} color="#7c2d12" fill="#7c2d12" /> : <Moon size={15} color="#000" fill="#000" />}
                    </div>
                    <div className="sun-label" style={{ left: '20px' }}>
                        <div className="sun-label-title">{topLabel}</div>
                        <div className="sun-label-time">{topTime}</div>
                    </div>
                    <div className="sun-label" style={{ left: '260px' }}>
                        <div className="sun-label-title">{bottomLabel}</div>
                        <div className="sun-label-time">{bottomTime}</div>
                    </div>
                </div>
            </div>

            <SkylineVector showNightBg={!isDay} />
        </motion.aside>
    );
};

export default Sidebar;
