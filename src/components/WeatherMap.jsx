import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { motion } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in leaflet with bundlers
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

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }, [center, map]);
    return null;
};

const MapEvents = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng, null);
            }
        }
    });
    return null;
};

const WeatherMap = ({ lat, lon, theme, onLocationSelect }) => {
    const center = [lat, lon];
    
    // Use CartoDB Light/Dark depending on theme for premium look
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const handleLocate = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (onLocationSelect) {
                        onLocationSelect(pos.coords.latitude, pos.coords.longitude, null);
                    }
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    alert('Unable to retrieve your location. Please check browser permissions.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
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
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url={tileUrl}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Marker position={center} />
                <MapUpdater center={center} />
                <MapEvents onLocationSelect={onLocationSelect} />
            </MapContainer>
            
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
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    outline: 'none'
                }}
            >
                <LocateFixed size={20} />
            </motion.button>
        </motion.div>
    );
};

export default WeatherMap;
