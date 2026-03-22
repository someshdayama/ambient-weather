import React from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

const HourlyChart = ({ hourlyData, unit, currentTime }) => {
    // We only want the next 6-8 hours for this specific graph style
    // Compare directly against the Open-Meteo current time string to avoid timezone parsing mismatch
    const currentHourIndex = hourlyData.time.findIndex(timeStr => timeStr >= currentTime);

    // Fallback if index not found
    const startIndex = currentHourIndex > 0 ? currentHourIndex : 0;
    const hoursToShow = 7;

    const times = hourlyData.time.slice(startIndex, startIndex + hoursToShow).map(t => new Date(t).getHours() + ':00');
    const baseTemps = hourlyData.temperature_2m.slice(startIndex, startIndex + hoursToShow);
    const temps = baseTemps.map(t => unit === 'F' ? Math.round((t * 9 / 5) + 32) : Math.round(t));
    const codes = hourlyData.weather_code.slice(startIndex, startIndex + hoursToShow);
    const precip = hourlyData.precipitation_probability.slice(startIndex, startIndex + hoursToShow);

    // SVG Drawing Logic dimensions
    const width = 800; // Intrinsic SVG width
    const height = 150;
    const padding = 40;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const tempRange = maxTemp - minTemp || 1; // Avoid divide by zero

    // Generate points
    const points = temps.map((temp, i) => {
        const x = padding + (i * ((width - padding * 2) / (hoursToShow - 1)));
        // Invert Y so higher temps are higher up visually
        const normalizedY = 1 - ((temp - minTemp) / tempRange);
        // Leave room for text above/below
        const y = padding + (normalizedY * (height - padding * 2));
        return { x, y, temp, precip: precip[i], time: times[i], code: codes[i] };
    });

    // Create the SVG path strings
    const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    // Area closes the path at the bottom
    const areaPath = `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    const getIcon = (code) => {
        if (code < 3) return <Sun size={20} color="#ffca28" />;
        if (code < 50) return <Cloud size={20} color="#a4b0be" />;
        return <CloudRain size={20} color="#4c8ae6" />;
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
            <div style={{ minWidth: '600px' }}>
                {/* Labels Header Container */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginBottom: '10px' }}>
                    {points.map((p, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <span style={{ fontSize: '0.85rem', color: '#717375', marginBottom: '8px' }}>{i === 0 ? 'Now' : p.time}</span>
                            {getIcon(p.code)}
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '8px' }}>{p.temp}°</span>
                        </div>
                    ))}
                </div>

                {/* The SVG Area Chart */}
                <svg width="100%" height="120" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible', marginTop: '10px' }}>
                    {/* Background Grid Lines Optional */}
                    {points.map((p, i) => (
                        <line key={`grid-${i}`} x1={p.x} y1="0" x2={p.x} y2={height} stroke="#f1f3f5" strokeWidth="2" />
                    ))}

                    <path d={areaPath} fill="rgba(76, 138, 230, 0.15)" />
                    <path d={linePath} fill="none" stroke="#4c8ae6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Points */}
                    {points.map((p, i) => (
                        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#4c8ae6" strokeWidth="2" />
                    ))}
                </svg>

                {/* Bottom Precipitation Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginTop: '8px' }}>
                    {points.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                            <span style={{ fontSize: '0.85rem', color: '#717375', fontWeight: 500 }}>{p.precip}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HourlyChart;
