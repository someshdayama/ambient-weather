import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, icon: Icon, children, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -5, scale: 1.02, boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px var(--accent-glow)' }}
            className="glass-panel metric-card"
            style={{ 
                padding: '1.5rem', 
                minHeight: '180px',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                cursor: 'default'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.8, marginBottom: '1rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>{title}</span>
                <div style={{ 
                    background: 'var(--accent-glow)', 
                    padding: '8px', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px var(--accent-glow)'
                }}>
                    <Icon size={18} color="var(--accent-color)" />
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {children}
            </div>
        </motion.div>
    );
};

export default MetricCard;
