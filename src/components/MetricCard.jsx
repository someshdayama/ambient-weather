import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, icon: Icon, delay = 0, children, style = {} }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 120, damping: 18 }}
            className="glass-panel metric-card"
            style={{
                padding: '1.8rem',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '200px',
                ...style,
            }}
        >
            {/* Card header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '1.2rem',
                opacity: 0.75,
            }}>
                <div style={{
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--accent-glow)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <Icon size={16} strokeWidth={2} color="var(--accent-color)" />
                </div>
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: 'var(--text-secondary)',
                }}>
                    {title}
                </span>
            </div>

            {/* Card content */}
            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </motion.div>
    );
};

export default MetricCard;
