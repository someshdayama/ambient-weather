import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Custom favorite star icon for Leaflet markers
const favMarkerIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }, [center, map]);
    return null;
};

const MapEvents = ({ onClick }) => {
    useMapEvents({
        click(e) {
            if (onClick) {
                onClick(e.latlng.lat, e.latlng.lng);
            }
        }
    });
    return null;
};

const WeatherMap = ({ lat, lon, theme, onLocationSelect, favorites = [] }) => {
    const isLight = theme === 'light';
    
    // Manage active coords locally for instant flyTo feedback on map clicks
    const [activeCoords, setActiveCoords] = useState([lat, lon]);

    // Keep activeCoords in sync when parent coordinate changes (e.g. from GPS or search)
    useEffect(() => {
        setActiveCoords([lat, lon]);
    }, [lat, lon]);

    // Map style state
    const [mapStyle, setMapStyle] = useState(theme === 'dark' ? 'dark' : 'light');
    
    // Sync style with main theme
    useEffect(() => {
        setMapStyle(theme === 'dark' ? 'dark' : 'light');
    }, [theme]);

    const mapStyleUrls = {
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    const handleMapClick = (clickLat, clickLon) => {
        setActiveCoords([clickLat, clickLon]);
        if (onLocationSelect) {
            onLocationSelect(clickLat, clickLon, null);
        }
    };

    const handleLocate = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setActiveCoords([latitude, longitude]);
                    if (onLocationSelect) {
                        onLocationSelect(latitude, longitude, null);
                    }
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    alert('Unable to retrieve your location. Please check browser permissions.');
                }
            );
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
                width: '100%', 
                height: '350px', 
                borderRadius: '24px', 
                overflow: 'hidden',
                position: 'relative',
                zIndex: 10,
                marginTop: '1.5rem',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)'
            }}
        >
            <MapContainer center={activeCoords} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url={mapStyleUrls[mapStyle]}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Current Active Location Marker */}
                <Marker position={activeCoords}>
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent>
                        <span style={{ fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>📍 Active Location</span>
                    </Tooltip>
                </Marker>

                {/* Favorite Cities Markers */}
                {favorites.map((fav, i) => {
                    const isCurrent = Math.abs(fav.lat - lat) < 0.01 && Math.abs(fav.lon - lon) < 0.01;
                    if (isCurrent) return null;
                    return (
                        <Marker 
                            key={`fav-${i}`} 
                            position={[fav.lat, fav.lon]}
                            icon={favMarkerIcon}
                            eventHandlers={{
                                click: () => {
                                    if (onLocationSelect) onLocationSelect(fav.lat, fav.lon, fav.name);
                                }
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                                <span style={{ fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>🌟 {fav.name.split(',')[0]}</span>
                            </Tooltip>
                        </Marker>
                    );
                })}

                <MapUpdater center={activeCoords} />
                <MapEvents onClick={handleMapClick} />
            </MapContainer>

            {/* Float Style Selector (Top-Left) */}
            <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                zIndex: 1000,
                display: 'flex',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '3px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                {['light', 'dark', 'satellite'].map((style) => (
                    <button
                        key={style}
                        onClick={() => setMapStyle(style)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: mapStyle === style 
                                ? (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)') 
                                : 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontFamily: 'Outfit, sans-serif'
                        }}
                    >
                        {style}
                    </button>
                ))}
            </div>

            {/* Locate button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLocate}
                title="Use Current Location"
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    outline: 'none'
                }}
            >
                <LocateFixed size={18} />
            </motion.button>
        </motion.div>
    );
};

export default WeatherMap;
