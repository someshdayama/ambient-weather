import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Wind, Droplets } from 'lucide-react';

const LOADING_PHRASES = [
    'Connecting to atmosphere',
    'Reading the wind',
    'Sampling the clouds',
    'Checking the skies',
];

const LoadingScreen = () => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [charIndex, setCharIndex] = useState(0);

    // Typewriter effect
    useEffect(() => {
        const phrase = LOADING_PHRASES[phraseIndex];
        if (charIndex < phrase.length) {
            const t = setTimeout(() => {
                setDisplayed(phrase.slice(0, charIndex + 1));
                setCharIndex(c => c + 1);
            }, 45);
            return () => clearTimeout(t);
        } else {
            // Pause then move to next phrase
            const t = setTimeout(() => {
                setPhraseIndex(i => (i + 1) % LOADING_PHRASES.length);
                setCharIndex(0);
                setDisplayed('');
            }, 1600);
            return () => clearTimeout(t);
        }
    }, [charIndex, phraseIndex]);

    // Stars data — stable, computed once
    const stars = React.useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
    })), []);

    // Sun arc position — animate along the arc
    const [sunProgress, setSunProgress] = useState(0);
    useEffect(() => {
        let start = null;
        const duration = 2000;
        const raf = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            // ease-out cubic
            setSunProgress(1 - Math.pow(1 - p, 3));
            if (p < 1) requestAnimationFrame(raf);
        };
        const id = requestAnimationFrame(raf);
        return () => cancelAnimationFrame(id);
    }, []);

    // Arc math — bounding box 0..200, height 100
    const angle = Math.PI - (sunProgress * Math.PI);
    const sunX = 100 + 80 * Math.cos(angle);
    const sunY = 100 - 80 * Math.sin(angle);

    return (
        <div className="loader-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #020617 0%, #0f172a 45%, #1e1b4b 100%)' }}>
            {/* Animated background shift */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.12) 0%, transparent 60%)',
                animation: 'ambient-drift 6s ease infinite',
                backgroundSize: '200% 200%',
            }} />

            {/* Stars */}
            {stars.map(s => (
                <div
                    key={s.id}
                    className="loading-star"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        animationDuration: `${s.duration}s`,
                        animationDelay: `${s.delay}s`,
                    }}
                />
            ))}

            {/* Horizon glow */}
            <div style={{
                position: 'absolute',
                bottom: '28%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '400px',
                height: '120px',
                background: 'radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, transparent 70%)',
                filter: 'blur(20px)',
                opacity: sunProgress,
                transition: 'opacity 0.5s ease',
            }} />

            {/* Sun Arc SVG */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                <svg width="220" height="120" viewBox="0 0 200 110" style={{ display: 'block', margin: '0 auto' }}>
                    {/* Arc track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2"
                        strokeDasharray="5 10"
                        strokeLinecap="round"
                    />
                    {/* Sun glow ring */}
                    <circle
                        cx={sunX}
                        cy={sunY}
                        r="22"
                        fill="rgba(251,191,36,0.12)"
                        className="sun-glow-ring"
                    />
                    {/* Sun body */}
                    <circle
                        cx={sunX}
                        cy={sunY}
                        r="12"
                        fill="#fbbf24"
                        style={{
                            filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.9))',
                            opacity: Math.max(0, sunProgress),
                        }}
                    />
                </svg>
            </div>

            {/* Brand + phrase */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ zIndex: 10, textAlign: 'center', marginTop: '2rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Cloud size={28} fill="rgba(255,255,255,0.9)" color="white" strokeWidth={1.5} />
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, color: 'white', letterSpacing: '-0.5px' }}>
                        Ambient Weather
                    </span>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', minHeight: '1.5em' }}>
                    <span className="typewriter">{displayed}</span>
                </div>
            </motion.div>

            {/* Floating icons */}
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '15%', left: '12%', opacity: 0.15 }}
            >
                <Wind size={32} color="white" />
            </motion.div>
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                style={{ position: 'absolute', top: '20%', right: '14%', opacity: 0.12 }}
            >
                <Droplets size={28} color="white" />
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
