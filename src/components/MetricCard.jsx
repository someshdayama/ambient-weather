import React, { useState } from 'react';

// Reusable wrapper for identical styling with hover highlight
const MetricCard = ({ title, icon: Icon, children }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'var(--card-bg)',
                padding: '1.5rem',
                borderRadius: '24px',
                boxShadow: hovered
                    ? '0 8px 30px rgba(76, 138, 230, 0.18), 0 0 0 2px rgba(76, 138, 230, 0.15)'
                    : '0 4px 15px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                cursor: 'default'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: hovered ? '#3a7bd5' : '#4c8ae6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    transition: 'background 0.25s ease'
                }}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
            </div>

            <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

export default MetricCard;
