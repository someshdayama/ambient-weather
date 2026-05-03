import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
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

const WeatherMap = ({ lat, lon, theme }) => {
    const center = [lat, lon];
    
    // Use CartoDB Light/Dark depending on theme for premium look
    const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

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
            </MapContainer>
        </motion.div>
    );
};

export default WeatherMap;
