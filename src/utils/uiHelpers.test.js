import { describe, expect, it } from 'vitest';
import {
    getIconName,
    getShortCondition,
    getWeekRange,
    scalePct,
    rangeBar,
    getRainSummary,
    getFeelsLikeReason,
    getDewPointComfort,
    getAqiAdvice,
    getWindDescription,
    formatDuration,
    getDaylightInfo,
    getWeekSummary,
    parseLocalTime,
} from './weatherUtils';

describe('week range scaling', () => {
    it('finds the min/max across lows and highs, ignoring nulls', () => {
        expect(getWeekRange([24, null, 22], [31, 33, null])).toEqual({ min: 22, max: 33 });
        expect(getWeekRange([], [])).toEqual({ min: 0, max: 0 });
    });

    it('scales a value to 0–100 and clamps', () => {
        expect(scalePct(22, 22, 32)).toBe(0);
        expect(scalePct(27, 22, 32)).toBe(50);
        expect(scalePct(32, 22, 32)).toBe(100);
        expect(scalePct(40, 22, 32)).toBe(100);
        expect(scalePct(10, 22, 32)).toBe(0);
        expect(scalePct(25, 25, 25)).toBe(50);
    });

    it('builds a bar with left/width as % of the week scale (not of the bar itself)', () => {
        expect(rangeBar(24, 30, 20, 40)).toEqual({ left: 20, width: 30 });
        const flat = rangeBar(39, 39, 20, 40);
        expect(flat.width).toBe(4);
        expect(flat.left + flat.width).toBeLessThanOrEqual(100);
    });
});

describe('getRainSummary', () => {
    const day = '2026-11-02';
    const hourly = {
        time: Array.from({ length: 24 }, (_, h) => `${day}T${String(h).padStart(2, '0')}:00`),
        precipitation_probability: Array.from({ length: 24 }, (_, h) => (h >= 18 ? 70 : 10)),
    };

    it('says when rain is most likely later today', () => {
        const now = parseLocalTime(`${day}T10:20`);
        expect(getRainSummary(hourly, now)).toEqual({ chance: 70, text: 'Chance of rain today, mostly after 6 PM' });
    });

    it('says rain is likely from now when it already is', () => {
        const now = parseLocalTime(`${day}T19:05`);
        expect(getRainSummary(hourly, now).text).toBe('Chance of rain from now for the rest of today');
        const shower = { ...hourly, precipitation_probability: hourly.time.map((_, h) => (h >= 14 && h <= 16 ? 50 : 5)) };
        expect(getRainSummary(shower, parseLocalTime(`${day}T14:30`)).text).toBe('Chance of rain from now until about 5 PM');
    });

    it('ignores hours that have passed', () => {
        const dry = { ...hourly, precipitation_probability: hourly.time.map((_, h) => (h < 9 ? 90 : 5)) };
        const now = parseLocalTime(`${day}T12:00`);
        expect(getRainSummary(dry, now)).toEqual({ chance: 5, text: 'Rain unlikely for the rest of today' });
    });

    it('falls back to the daily max without hourly data', () => {
        expect(getRainSummary(null, Date.now(), 40)).toEqual({ chance: 40, text: 'Chance of rain today' });
    });
});

describe('getFeelsLikeReason', () => {
    it('explains humid heat', () => {
        expect(getFeelsLikeReason(30, 36, 75, 10)).toBe('Feels 6° hotter because of humidity');
    });
    it('explains still air', () => {
        expect(getFeelsLikeReason(30, 33, 30, 2)).toBe('Feels 3° hotter because there is little wind');
    });
    it('explains wind chill', () => {
        expect(getFeelsLikeReason(5, 1, 60, 25)).toBe('Feels 4° cooler because of the wind');
    });
    it('explains dry air', () => {
        expect(getFeelsLikeReason(20, 17, 20, 5)).toBe('Feels 3° cooler because the air is dry');
    });
    it('says when it is about the same', () => {
        expect(getFeelsLikeReason(25, 25.8, 50, 5)).toBe('Feels about the same as the actual temperature');
        expect(getFeelsLikeReason(null, 25, 50, 5)).toBe('');
    });
});

describe('plain-language helpers', () => {
    it('rates dew point comfort', () => {
        expect(getDewPointComfort(8).label).toBe('Dry');
        expect(getDewPointComfort(14).label).toBe('Comfortable');
        expect(getDewPointComfort(18).label).toBe('A bit humid');
        expect(getDewPointComfort(22).label).toBe('Muggy');
        expect(getDewPointComfort(26)).toMatchObject({ label: 'Oppressive', warn: true });
    });

    it('gives AQI advice per band', () => {
        expect(getAqiAdvice(0)).toMatch(/clean/);
        expect(getAqiAdvice(2)).toMatch(/asthma/);
        expect(getAqiAdvice(99)).toBe('Air quality data unavailable.');
    });

    it('describes wind', () => {
        expect(getWindDescription(1)).toBe('Calm');
        expect(getWindDescription(10)).toBe('Light breeze');
        expect(getWindDescription(70)).toBe('Gale');
    });

    it('formats durations', () => {
        expect(formatDuration((11 * 60 + 25) * 60000)).toBe('11 h 25 m');
        expect(formatDuration(40 * 60000)).toBe('40 m');
        expect(formatDuration(-1)).toBe('—');
    });

    it('uses night icons after sunset', () => {
        expect(getIconName(0, 1)).toBe('Sun');
        expect(getIconName(0, 0)).toBe('Moon');
        expect(getIconName(2, 0)).toBe('CloudMoon');
        expect(getShortCondition(63)).toBe('Rain');
    });
});

describe('getDaylightInfo', () => {
    const rise = parseLocalTime('2026-11-02T06:40');
    const set = parseLocalTime('2026-11-02T18:05');

    it('reports daylight left during the day', () => {
        const info = getDaylightInfo(rise, set, parseLocalTime('2026-11-02T15:05'));
        expect(info).toEqual({ isDay: true, dayLength: '11 h 25 m', text: '3 h 0 m of daylight left' });
    });

    it('counts down to sunrise before dawn and after dusk', () => {
        expect(getDaylightInfo(rise, set, parseLocalTime('2026-11-02T05:40')).text).toBe('Sunrise in 1 h 0 m');
        const next = parseLocalTime('2026-11-03T06:41');
        expect(getDaylightInfo(rise, set, parseLocalTime('2026-11-02T22:41'), next).text).toBe('Sunrise in 8 h 0 m');
    });

    it('returns null without data', () => {
        expect(getDaylightInfo(null, set, Date.now())).toBeNull();
    });
});

describe('getWeekSummary', () => {
    it('summarises highs, lows and rainy days', () => {
        const days = [
            { label: 'Mon', high: 31, low: 24, rain: 10 },
            { label: 'Tue', high: 33, low: 25, rain: 60 },
            { label: 'Wed', high: 30, low: 23, rain: 40 },
        ];
        expect(getWeekSummary(days)).toBe('Highs 30–33°, lows 23–25°. Rain likely on Tue, Wed.');
    });
    it('says "today" naturally', () => {
        expect(getWeekSummary([{ label: 'Today', high: 33, low: 27, rain: 51 }, { label: 'Tue', high: 35, low: 26, rain: 20 }])).toBe('Highs 33–35°, lows 26–27°. Rain likely today.');
        expect(getWeekSummary([{ label: 'Today', high: 33, low: 27, rain: 51 }, { label: 'Tue', high: 35, low: 26, rain: 60 }])).toBe('Highs 33–35°, lows 26–27°. Rain likely today and on Tue.');
    });
    it('says mostly dry', () => {
        expect(getWeekSummary([{ label: 'Mon', high: 20, low: 10, rain: 0 }])).toBe('Highs 20°, lows 10°. Mostly dry.');
    });
});
