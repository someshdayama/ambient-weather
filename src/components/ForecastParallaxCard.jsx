import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import HourlyChart from './HourlyChart';
import Forecast from './Forecast';

const ForecastParallaxCard = ({ hourlyData, dailyData, unit, currentTime, theme }) => {
    const scrollRef = useRef(null);
    
    const [scrollTop, setScrollTop] = useState(0);
    const isLight = theme === 'light';

    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop);
    };

    const activeTab = scrollTop > 100 ? '7day' : 'hourly';

    const handleToggleTab = (tab) => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return;
        
        if (tab === 'hourly') {
            scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollEl.scrollTo({ top: 190, behavior: 'smooth' });
        }
    };

    // Parallax values based on scroll
    const chartY = scrollTop * 0.45;
    const chartOpacity = Math.max(0, 1 - scrollTop / 150);
    const chartScale = Math.max(0.85, 1 - (scrollTop / 190) * 0.15);

    return (
        <div
            style={{
                position: 'relative',
                zIndex: 10
            }}
            className="glass-panel"
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.8rem 1.8rem 0',
                zIndex: 20,
                position: 'relative'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.3px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTab === 'hourly' ? (
                        <>
                            <Clock size={18} color="var(--accent-color)" /> Today's Forecast
                        </>
                    ) : (
                        <>
                            <Calendar size={18} color="var(--accent-color)" /> 7-Day Forecast
                        </>
                    )}
                </h3>

                {/* Switcher toggle */}
                <div className="tab-switcher">
                    <div
                        className="tab-switcher-slider"
                        style={{
                            transform: activeTab === '7day' ? 'translateX(80px)' : 'translateX(0px)'
                        }}
                    />
                    
                    <button
                        onClick={() => handleToggleTab('hourly')}
                        className={`tab-switcher-btn ${activeTab === 'hourly' ? 'active' : ''}`}
                    >
                        Hourly
                    </button>
                    <button
                        onClick={() => handleToggleTab('7day')}
                        className={`tab-switcher-btn ${activeTab === '7day' ? 'active' : ''}`}
                    >
                        7-Day
                    </button>
                </div>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    height: '315px',
                    overflowY: 'auto',
                    padding: '1.4rem 1.8rem 1.8rem',
                    position: 'relative',
                    zIndex: 10,
                    scrollbarWidth: 'thin'
                }}
            >
                {/* Hourly Chart – Slides and fades out with parallax */}
                <div style={{
                    transform: `translate3d(0, ${chartY}px, 0) scale(${chartScale})`,
                    opacity: chartOpacity,
                    pointerEvents: scrollTop > 130 ? 'none' : 'auto',
                    marginBottom: '2rem',
                    transition: 'opacity 0.1s ease-out'
                }}>
                    <HourlyChart hourlyData={hourlyData} unit={unit} currentTime={currentTime} theme={theme} />
                </div>

                {/* 7-Day Forecast – Scrolls normally underneath */}
                <div style={{
                    marginTop: '0.5rem',
                    position: 'relative',
                    zIndex: 5
                }}>
                    {/* Add a separator only visible when scrolling down */}
                    <div style={{
                        height: '1px',
                        background: 'var(--card-inner-border)',
                        margin: '0 0 1.2rem',
                        opacity: Math.min(scrollTop / 50, 1),
                        transition: 'opacity 0.2s ease'
                    }} />
                    
                    <Forecast daily={dailyData} unit={unit} loading={false} theme={theme} />
                </div>
            </div>
        </div>
    );
};

export default ForecastParallaxCard;
