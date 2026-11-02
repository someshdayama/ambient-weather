import { useState, useEffect, useRef } from 'react';
import { Search, Cloud, Star, X, RotateCw, Navigation } from 'lucide-react';
import { getWeatherDetails, locationNowMs, formatAgo } from '../utils/weatherUtils';
import { searchCity } from '../api/weatherApi';
import CurrentWeather from './CurrentWeather';
import SunArc from './SunArc';

const MAX_FAVORITES = 5;
const cityLabel = (city) => `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}`;

const Sidebar = ({ weather, unit, setUnit, favorites = [], setFavorites }) => {
    const { weatherData, location, fetchedAt, isStale, loading, refreshing, gpsState, requestGps, selectLocation, refresh } = weather;
    const current = weatherData?.current;
    const daily = weatherData?.daily;
    const timezone = weatherData?.timezone || 'Asia/Kolkata';
    const utcOffset = weatherData?.utc_offset_seconds ?? 19800;

    const [time, setTime] = useState(() => new Date());
    const [searchOpen, setSearchOpen] = useState(false); // phone only; desktop always shows the field
    const [focused, setFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
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
        const onDown = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setFocused(false);
                setSearchResults([]);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, []);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    const closeSearch = () => {
        setSearchResults([]);
        setActiveIndex(-1);
        setFocused(false);
        setSearchQuery('');
        setSearchError(null);
        setSearchOpen(false);
        inputRef.current?.blur();
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
            setSearchResults([]);
            setActiveIndex(-1);
        }
    };

    // Options list: "Use my location" first, then matching places.
    const options = [{ type: 'gps' }, ...searchResults.map((city) => ({ type: 'city', city }))];
    const showOptions = focused || searchResults.length > 0;

    const choose = (opt) => {
        if (opt.type === 'gps') requestGps();
        else selectLocation(opt.city.latitude, opt.city.longitude, cityLabel(opt.city));
        closeSearch();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeSearch();
            return;
        }
        if (!showOptions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % options.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const pick = activeIndex >= 0 ? options[activeIndex] : options[1] || options[0];
            if (pick) choose(pick);
        }
    };

    const isFavorite = (name) => favorites.some((f) => f.name === name);
    const toggleFavorite = (city) => {
        const name = cityLabel(city);
        if (isFavorite(name)) setFavorites(favorites.filter((f) => f.name !== name));
        else setFavorites([{ name, lat: city.latitude, lon: city.longitude }, ...favorites].slice(0, MAX_FAVORITES));
    };
    const removeFavorite = (name) => setFavorites(favorites.filter((f) => f.name !== name));

    const details = current ? getWeatherDetails(current.weather_code, current.is_day) : null;
    const nowMs = locationNowMs(utcOffset, time.getTime());
    const locating = gpsState === 'locating';
    const listId = 'city-search-results';

    return (
        <aside className="sidebar" aria-label="Current weather and location">
            <div className="sidebar-header">
                <h1 className="brand">
                    <Cloud size={20} fill="currentColor" strokeWidth={0} aria-hidden="true" /> Ambient
                </h1>

                <div className="sidebar-actions">
                    <button
                        type="button"
                        className="icon-btn search-toggle"
                        onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                        aria-label={searchOpen ? 'Close search' : 'Search places'}
                        aria-expanded={searchOpen}
                    >
                        {searchOpen ? <X size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
                    </button>

                    <div className="unit-toggle" role="group" aria-label="Units">
                        <div className="unit-toggle-slider" style={{ transform: unit === 'F' ? 'translateX(100%)' : 'none' }} aria-hidden="true" />
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

            <div ref={searchRef} className={`search-wrap ${searchOpen ? 'open' : ''}`}>
                <div className="sidebar-search-container">
                    <Search size={18} className="search-icon" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="search"
                        placeholder="Search city"
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        className="sidebar-search-input"
                        aria-label="Search city"
                        role="combobox"
                        aria-expanded={showOptions}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `search-opt-${activeIndex}` : undefined}
                        autoComplete="off"
                        enterKeyHint="search"
                    />
                    {isSearching && <span className="spinner" aria-label="Searching" />}
                </div>

                {showOptions && (
                    <ul className="search-results-panel" id={listId} role="listbox" aria-label="Places">
                        {options.map((opt, i) => {
                            if (opt.type === 'gps') {
                                return (
                                    <li key="gps" id={`search-opt-${i}`} role="option" aria-selected={i === activeIndex} className={`search-result-item ${i === activeIndex ? 'active' : ''}`}>
                                        <button type="button" className="search-result-main" onClick={() => choose(opt)} onMouseDown={(e) => e.preventDefault()}>
                                            <Navigation size={16} aria-hidden="true" fill={locating ? 'currentColor' : 'none'} />
                                            {locating ? 'Finding your location…' : 'Use my location'}
                                        </button>
                                    </li>
                                );
                            }
                            const name = cityLabel(opt.city);
                            const fav = isFavorite(name);
                            return (
                                <li key={opt.city.id} id={`search-opt-${i}`} role="option" aria-selected={i === activeIndex} className={`search-result-item ${i === activeIndex ? 'active' : ''}`}>
                                    <button type="button" className="search-result-main" onClick={() => choose(opt)} onMouseDown={(e) => e.preventDefault()}>
                                        <span>{name} <span className="t-secondary">{opt.city.country_code}</span></span>
                                    </button>
                                    <button
                                        type="button"
                                        className="icon-btn-plain"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => toggleFavorite(opt.city)}
                                        aria-label={fav ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
                                        aria-pressed={fav}
                                    >
                                        <Star size={16} fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
                                    </button>
                                </li>
                            );
                        })}
                        {searchError && !isSearching && searchQuery.trim().length > 2 && !searchResults.length && (
                            <li className="search-hint" role="status">{searchError}</li>
                        )}
                    </ul>
                )}
            </div>

            {favorites.length > 0 && (
                <ul className="fav-list" aria-label="Favourite places">
                    {favorites.map((fav) => (
                        <li key={fav.name} className={`fav-chip ${location?.name === fav.name ? 'active' : ''}`}>
                            <button type="button" className="fav-chip-main" onClick={() => selectLocation(fav.lat, fav.lon, fav.name)}>
                                <Star size={12} fill="currentColor" aria-hidden="true" />
                                {fav.name.split(',')[0]}
                            </button>
                            <button type="button" className="fav-chip-remove" onClick={() => removeFavorite(fav.name)} aria-label={`Remove ${fav.name} from favourites`}>
                                <X size={14} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {loading && !current ? (
                <div className="hero" aria-hidden="true">
                    <div className="skeleton" style={{ height: 22, width: '45%' }} />
                    <div className="skeleton" style={{ height: 14, width: '60%', marginTop: 10 }} />
                    <div className="skeleton" style={{ height: 110, width: '55%', marginTop: 16 }} />
                    <div className="skeleton" style={{ height: 22, width: '40%', marginTop: 12 }} />
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

            {fetchedAt && (
                <div className={`freshness ${isStale ? 'stale' : ''}`}>
                    <span>{refreshing ? 'Updating…' : `Updated ${formatAgo(fetchedAt, time.getTime())}`}</span>
                    <button type="button" className="icon-btn-plain" onClick={refresh} aria-label="Refresh weather" disabled={refreshing}>
                        <RotateCw size={16} className={refreshing ? 'spin' : ''} aria-hidden="true" />
                    </button>
                </div>
            )}

            <SunArc daily={daily} nowMs={nowMs} className="sun-desktop" />
        </aside>
    );
};

export default Sidebar;
