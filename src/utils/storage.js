// Tiny localStorage helpers that never throw (Safari private mode, quota, etc.)
export const KEYS = {
    unit: 'ambient_unit',
    favorites: 'ambient_weather_favorites',
    last: 'ambient_last_forecast_v2',
};

export const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* ignore */
    }
};

export const readString = (key, fallback) => {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
};

export const writeString = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* ignore */
    }
};
