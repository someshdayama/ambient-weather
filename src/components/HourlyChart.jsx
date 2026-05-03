import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const HourlyChart = ({ hourlyData, unit, currentTime }) => {
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const parseTime = (dateStr) => {
        const parts = dateStr.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
        if (parts) return new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5]).getTime();
        return new Date(dateStr).getTime();
    };

    const currentMs = parseTime(currentTime);
    const currentIndex = hourlyData.time.findIndex(t => parseTime(t) > currentMs);
    const startIndex = Math.max(0, currentIndex - 1);
    
    if (currentIndex === -1 || !hourlyData.time || hourlyData.time.length === 0) {
        return <div style={{ opacity: 0.5, padding: '2rem', textAlign: 'center' }}>Forecast data unavailable</div>;
    }

    const displayData = {
        time: hourlyData.time.slice(startIndex, startIndex + 24),
        temp: hourlyData.temperature_2m.slice(startIndex, startIndex + 24),
        precip: hourlyData.precipitation_probability.slice(startIndex, startIndex + 24)
    };

    const convertTemp = (t) => unit === 'F' ? Math.round((t * 9 / 5) + 32) : Math.round(t);
    const temps = displayData.temp.map(convertTemp);

    if (temps.length === 0) return null;

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };
    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const walk = (e.pageX - scrollContainerRef.current.offsetLeft - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '220px', display: 'block' }}>
            <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '220px',
                    height: '100%',
                    gap: '12px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    padding: '10px 0 20px 0',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
                className="hide-scrollbar"
            >
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                
                {displayData.time.map((timeStr, i) => {
                    const temp = temps[i];
                    const precip = displayData.precip[i];
                    const date = new Date(parseTime(timeStr));
                    const label = i === 0 ? 'Now' : date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                    
                    // Height percentage for the bar (min 20%, max 100%)
                    const heightPct = 20 + ((temp - minTemp) / tempRange) * 80;

                    return (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, type: 'spring' }}
                            style={{ 
                                minWidth: '70px',
                                height: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: i === 0 ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%)' : 'var(--glass-bg)',
                                border: i === 0 ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid var(--glass-border)',
                                borderRadius: '40px',
                                padding: '16px 8px',
                                userSelect: 'none',
                                boxShadow: i === 0 ? '0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none'
                            }}
                        >
                            <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                                {temp}°
                            </div>

                            {/* Internal Bar Visualization */}
                            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', margin: '12px 0' }}>
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + (i * 0.05) }}
                                    style={{
                                        width: '6px',
                                        background: i === 0 ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        boxShadow: i === 0 ? '0 0 10px var(--accent-glow)' : 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {precip > 0 && i !== 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '4px' }}>
                                        {precip}%
                                    </div>
                                )}
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: i === 0 ? 1 : 0.7 }}>
                                    {label}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default HourlyChart;
