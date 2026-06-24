import React, { useMemo } from 'react';

/**
 * Pure CSS-driven weather particles.
 * Only `transform` and `opacity` are animated → compositor thread only, zero layout cost.
 */
const WeatherParticles = ({ weatherTheme }) => {
    const particles = useMemo(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const multiplier = isMobile ? 0.3 : 1; // Reduce particles by 70% on mobile

        if (weatherTheme === 'rain' || weatherTheme === 'storm') {
            return Array.from({ length: Math.floor(28 * multiplier) }, (_, i) => ({
                type: 'rain',
                id: i,
                left: `${Math.random() * 100}%`,
                height: `${60 + Math.random() * 60}px`,
                duration: `${0.6 + Math.random() * 0.5}s`,
                delay: `${Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4,
            }));
        }
        if (weatherTheme === 'snow') {
            return Array.from({ length: Math.floor(22 * multiplier) }, (_, i) => ({
                type: 'snow',
                id: i,
                left: `${Math.random() * 100}%`,
                size: `${4 + Math.random() * 6}px`,
                duration: `${5 + Math.random() * 6}s`,
                delay: `${Math.random() * 8}s`,
                opacity: 0.6 + Math.random() * 0.4,
            }));
        }
        if (weatherTheme === 'clear-night') {
            return Array.from({ length: Math.floor(55 * multiplier) }, (_, i) => ({
                type: 'star',
                id: i,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 70}%`,
                size: `${Math.random() * 2 + 1}px`,
                duration: `${2 + Math.random() * 4}s`,
                delay: `${Math.random() * 5}s`,
            }));
        }
        return [];
    }, [weatherTheme]);

    if (!particles.length) return null;

    return (
        <div className="particles-container">
            {weatherTheme === 'storm' && <div className="particle-lightning" />}

            {particles.map(p => {
                if (p.type === 'rain') return (
                    <div
                        key={p.id}
                        className="particle-rain"
                        style={{
                            left: p.left,
                            height: p.height,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                            opacity: p.opacity,
                        }}
                    />
                );
                if (p.type === 'snow') return (
                    <div
                        key={p.id}
                        className="particle-snow"
                        style={{
                            left: p.left,
                            width: p.size,
                            height: p.size,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                            opacity: p.opacity,
                        }}
                    />
                );
                if (p.type === 'star') return (
                    <div
                        key={p.id}
                        className="particle-star"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: p.size,
                            height: p.size,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                        }}
                    />
                );
                return null;
            })}
        </div>
    );
};

export default WeatherParticles;
