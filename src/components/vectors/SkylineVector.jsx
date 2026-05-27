import React from 'react';

const SkylineVector = ({ showNightBg, theme }) => {
    const isLight = theme === 'light';
    const fill1 = isLight ? '#94a3b8' : (showNightBg ? '#060d14' : '#1c4a96');
    const fill2 = isLight ? '#cbd5e1' : (showNightBg ? '#000000' : '#0a2a61');
    const opacity1 = isLight ? 0.35 : (showNightBg ? 0.4 : 0.6);
    const opacity2 = isLight ? 0.22 : (showNightBg ? 0.7 : 0.4);

    return (
        <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '250px',
            pointerEvents: 'none',
            zIndex: 1
        }}>
            {/* Abstract Vector Skyline Image */}
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '220px', zIndex: 1, opacity: opacity1 }}>
                <path d="M0,300 L0,220 L20,220 L20,180 L40,180 L40,120 L55,120 L55,200 L80,200 L80,150 L100,150 L100,220 L130,220 L130,90 L160,90 L160,170 L190,170 L190,60 L200,60 L200,20 L210,20 L210,60 L220,60 L220,140 L250,140 L250,100 L280,100 L280,190 L320,190 L320,130 L350,130 L350,210 L380,210 L380,80 L420,80 L420,160 L450,160 L450,110 L480,110 L480,230 L520,230 L520,140 L550,140 L550,90 L580,90 L580,180 L610,180 L610,120 L640,120 L640,200 L670,200 L670,70 L700,70 L700,150 L730,150 L730,100 L760,100 L760,210 L800,210 L800,130 L830,130 L830,80 L860,80 L860,190 L890,190 L890,140 L920,140 L920,240 L960,240 L960,160 L1000,160 L1000,300 Z" fill={fill1} />
            </svg>

            {/* Secondary Vector Layer for depth */}
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '160px', zIndex: 2, opacity: opacity2 }}>
                <path d="M0,300 L0,180 L30,180 L30,130 L60,130 L60,210 L90,210 L90,160 L120,160 L120,230 L150,230 L150,100 L180,100 L180,180 L210,180 L210,70 L240,70 L240,150 L270,150 L270,110 L300,110 L300,200 L340,200 L340,140 L370,140 L370,220 L400,220 L400,90 L440,90 L440,170 L470,170 L470,120 L500,120 L500,240 L540,240 L540,150 L570,150 L570,100 L600,100 L600,190 L630,190 L630,130 L660,130 L660,210 L690,210 L690,80 L720,80 L720,160 L750,160 L750,110 L780,110 L780,220 L820,220 L820,140 L850,140 L850,90 L880,90 L880,200 L910,200 L910,150 L940,150 L940,250 L980,250 L980,170 L1000,170 L1000,300 Z" fill={fill2} />
            </svg>
        </div>
    );
};

export default SkylineVector;
