import { describe, expect, it } from 'vitest';
import {
    AQI_BANDS,
    formatAgo,
    formatClock,
    formatDay,
    getAqiInfo,
    getNowcast,
    getWeatherDetails,
    getWindDirection,
    locationNowMs,
    parseLocalTime,
    toTemp,
    toWind,
    windUnitLabel,
} from './weatherUtils';

describe('parseLocalTime', () => {
    it('parses Open-Meteo wall-clock strings without using Date string parsing', () => {
        expect(parseLocalTime('2026-11-02T14:15')).toBe(Date.UTC(2026, 10, 2, 14, 15));
        expect(parseLocalTime('2026-11-02')).toBe(Date.UTC(2026, 10, 2));
        expect(parseLocalTime('2026-11-02 06:42')).toBe(Date.UTC(2026, 10, 2, 6, 42)); // space form (Safari-unsafe with new Date)
    });

    it('returns NaN for junk', () => {
        expect(parseLocalTime('11/2/2026, 1:49:00 PM')).toBeNaN();
        expect(parseLocalTime(undefined)).toBeNaN();
        expect(parseLocalTime('')).toBeNaN();
    });
});

describe('formatDay / formatClock', () => {
    it('gives the weekday of the calendar date regardless of device timezone', () => {
        // 2026-11-02 is a Monday. Old code did new Date('2026-11-02') → UTC midnight → Sunday west of UTC.
        expect(formatDay('2026-11-02')).toBe('Mon');
        expect(formatDay('2026-11-08')).toBe('Sun');
        expect(formatDay('nope')).toBe('—');
    });

    it('formats wall-clock times as-is', () => {
        expect(formatClock(parseLocalTime('2026-11-02T06:42'))).toBe('6:42 AM');
        expect(formatClock(parseLocalTime('2026-11-02T18:05'))).toBe('6:05 PM');
        expect(formatClock(NaN)).toBe('—');
    });

    it('locationNowMs shifts by the utc offset', () => {
        const utc = Date.UTC(2026, 10, 2, 8, 30); // 08:30Z = 14:00 IST
        expect(formatClock(locationNowMs(19800, utc))).toBe('2:00 PM');
    });
});

describe('formatAgo', () => {
    const now = Date.UTC(2026, 10, 2, 12, 0);
    it('humanises durations', () => {
        expect(formatAgo(now - 20 * 1000, now)).toBe('just now');
        expect(formatAgo(now - 5 * 60000, now)).toBe('5 min ago');
        expect(formatAgo(now - 3 * 3600000, now)).toBe('3 h ago');
        expect(formatAgo(now - 50 * 3600000, now)).toBe('2 d ago');
        expect(formatAgo(undefined, now)).toBe('');
    });
});

describe('US AQI bands', () => {
    it('covers 0–500 contiguously', () => {
        expect(AQI_BANDS[0].min).toBe(0);
        expect(AQI_BANDS.at(-1).max).toBe(500);
        for (let i = 1; i < AQI_BANDS.length; i++) expect(AQI_BANDS[i].min).toBe(AQI_BANDS[i - 1].max + 1);
    });

    it.each([
        [0, 'Good'],
        [50, 'Good'],
        [51, 'Moderate'],
        [100, 'Moderate'],
        [101, 'Unhealthy for sensitive groups'],
        [124, 'Unhealthy for sensitive groups'],
        [150, 'Unhealthy for sensitive groups'],
        [151, 'Unhealthy'],
        [200, 'Unhealthy'],
        [201, 'Very unhealthy'],
        [300, 'Very unhealthy'],
        [301, 'Hazardous'],
        [650, 'Hazardous'],
    ])('AQI %i → %s', (aqi, label) => {
        expect(getAqiInfo(aqi).label).toBe(label);
    });

    it('is white when good and red when unhealthy', () => {
        expect(getAqiInfo(20).color).toBe('#ffffff');
        expect(getAqiInfo(175).color).toBe('#ef4444');
    });

    it('handles missing data', () => {
        expect(getAqiInfo(null)).toMatchObject({ label: 'Unknown', index: -1 });
    });
});

describe('units', () => {
    it('converts temperature', () => {
        expect(toTemp(0, 'C')).toBe(0);
        expect(toTemp(0, 'F')).toBe(32);
        expect(toTemp(32.2, 'F')).toBe(90);
        expect(toTemp(null, 'F')).toBeNull();
    });

    it('converts wind to mph in °F mode', () => {
        expect(toWind(100, 'C')).toBe(100);
        expect(toWind(100, 'F')).toBe(62);
        expect(windUnitLabel('F')).toBe('mph');
        expect(windUnitLabel('C')).toBe('km/h');
    });
});

describe('getNowcast', () => {
    const t = ['2026-11-02T13:30', '2026-11-02T13:45', '2026-11-02T14:00', '2026-11-02T14:15', '2026-11-02T14:30', '2026-11-02T14:45', '2026-11-02T15:00', '2026-11-02T15:15'];
    const now = parseLocalTime('2026-11-02T13:50');

    it('reports dry', () => {
        expect(getNowcast({ time: t, precipitation: t.map(() => 0) }, now).state).toBe('dry');
    });

    it('reports rain arriving', () => {
        const p = [0, 0, 0, 0, 0.6, 1, 0, 0];
        const n = getNowcast({ time: t, precipitation: p }, now);
        expect(n.state).toBe('soon');
        expect(n.minutes).toBe(40);
        expect(n.text).toBe('Rain in ~40 min');
    });

    it('reports rain stopping', () => {
        const p = [0, 0.4, 0.3, 0, 0, 0, 0, 0];
        const n = getNowcast({ time: t, precipitation: p }, now);
        expect(n.state).toBe('raining');
        expect(n.text).toMatch(/stopping in ~\d+ min/);
    });

    it('is unknown without data', () => {
        expect(getNowcast(undefined, now).state).toBe('unknown');
    });
});

describe('misc', () => {
    it('maps weather codes', () => {
        expect(getWeatherDetails(95).theme).toBe('storm');
        expect(getWeatherDetails(0, 0).icon).toBe('Moon');
        expect(getWeatherDetails(1234).text).toBe('Unknown');
    });

    it('wind direction', () => {
        expect(getWindDirection(0)).toBe('N');
        expect(getWindDirection(225)).toBe('SW');
        expect(getWindDirection(359)).toBe('N');
        expect(getWindDirection(null)).toBe('—');
    });
});
