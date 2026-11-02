import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchReverseGeocode, fetchWeatherByCoords } from '../api/weatherApi';
import { KEYS, readJSON, writeJSON } from '../utils/storage';

export const FALLBACK_LOCATION = { lat: 19.076, lon: 72.8777, name: 'Mumbai' };
const REFRESH_MS = 15 * 60 * 1000;
const STALE_MS = 30 * 60 * 1000;

/** Where to open: last viewed location → first favourite → Mumbai (first run only). */
const initialLocation = (cached, favorites) => {
    if (cached?.location) return cached.location;
    const fav = favorites?.[0];
    if (fav && Number.isFinite(fav.lat) && Number.isFinite(fav.lon)) return { lat: fav.lat, lon: fav.lon, name: fav.name };
    return FALLBACK_LOCATION;
};

/**
 * Owns all weather state:
 * - instant start from the last saved forecast, then silent refresh
 * - latest request wins (older in-flight requests are aborted)
 * - forecast + reverse geocode in parallel; name/location only change on success
 * - errors never wipe good data; they surface as a toast with Retry
 */
export function useWeather() {
    const cachedRef = useRef(readJSON(KEYS.last, null));
    const cached = cachedRef.current?.data?.current ? cachedRef.current : null;

    const [weatherData, setWeatherData] = useState(cached?.data ?? null);
    const [location, setLocation] = useState(() => initialLocation(cached, readJSON(KEYS.favorites, [])));
    const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt ?? null);
    const [loading, setLoading] = useState(!cached);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null); // { message, retry }
    const [gpsState, setGpsState] = useState('idle'); // idle | locating

    const controllerRef = useRef(null);
    const reqIdRef = useRef(0);
    const locationRef = useRef(location);
    locationRef.current = location;

    const load = useCallback(async (lat, lon, name = null) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const reqId = ++reqIdRef.current;
        const { signal } = controller;

        setRefreshing(true);
        try {
            const [data, geoName] = await Promise.all([
                fetchWeatherByCoords(lat, lon, { signal }),
                name ? Promise.resolve(name) : fetchReverseGeocode(lat, lon, { signal }),
            ]);
            if (reqId !== reqIdRef.current) return; // a newer request superseded us

            const loc = { lat, lon, name: geoName || `${lat.toFixed(2)}, ${lon.toFixed(2)}` };
            const now = Date.now();
            setWeatherData(data);
            setLocation(loc);
            setFetchedAt(now);
            setError(null);
            writeJSON(KEYS.last, { location: loc, data, fetchedAt: now });
        } catch (err) {
            if (err?.name === 'AbortError' || reqId !== reqIdRef.current) return;
            setError({ message: err?.message || 'Could not load weather.', retry: () => load(lat, lon, name) });
        } finally {
            if (reqId === reqIdRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    const refresh = useCallback(() => {
        const { lat, lon, name } = locationRef.current;
        return load(lat, lon, name);
    }, [load]);

    const requestGps = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setError({ message: 'Location is not available in this browser.' });
            return;
        }
        setGpsState('locating');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setGpsState('idle');
                load(coords.latitude, coords.longitude, null);
            },
            (err) => {
                setGpsState('idle');
                const message =
                    err.code === 1
                        ? 'Location permission denied. Allow it in your browser settings.'
                        : err.code === 3
                            ? 'Finding your location timed out.'
                            : 'Could not determine your location.';
                setError({ message, retry: err.code === 1 ? null : requestGps });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
        );
    }, [load]);

    // Boot: show cached data instantly (if any) and refresh in the background.
    useEffect(() => {
        const { lat, lon, name } = locationRef.current;
        load(lat, lon, name);
        return () => controllerRef.current?.abort();
    }, [load]);

    // Silent refresh every 15 min, and when the tab comes back after being stale.
    useEffect(() => {
        const id = setInterval(refresh, REFRESH_MS);
        const onVisible = () => {
            if (document.visibilityState === 'visible' && fetchedAt && Date.now() - fetchedAt > REFRESH_MS) refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refresh, fetchedAt]);

    const isStale = fetchedAt != null && Date.now() - fetchedAt > STALE_MS;

    return {
        weatherData,
        location,
        fetchedAt,
        isStale,
        loading,
        refreshing,
        error,
        dismissError: () => setError(null),
        selectLocation: load,
        refresh,
        requestGps,
        gpsState,
    };
}
