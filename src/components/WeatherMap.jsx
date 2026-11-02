import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import { LocateFixed, CloudRain } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { fetchRadarTileUrl } from '../api/weatherApi';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Minimal white dot markers (no blue Leaflet pins).
const activeIcon = L.divIcon({ className: 'map-dot map-dot-active', iconSize: [18, 18], iconAnchor: [9, 9] });
const favIcon = L.divIcon({ className: 'map-dot map-dot-fav', iconSize: [12, 12], iconAnchor: [6, 6] });

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 1.2 });
    }, [center, map]);
    return null;
};

const MapEvents = ({ onClick }) => {
    useMapEvents({ click: (e) => onClick?.(e.latlng.lat, e.latlng.lng) });
    return null;
};

// CARTO's anonymous raster basemaps now stamp every tile with "API KEY REQUIRED".
// Esri's public canvas and imagery services work without a key.
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, and the GIS user community';

const MAP_STYLES = {
    dark: {
        label: 'Dark',
        attribution: ESRI_ATTRIBUTION,
        urls: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
    },
    satellite: {
        label: 'Satellite',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
        urls: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    },
};

const RADAR_ATTRIBUTION = 'Radar &copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a>';
const RADAR_REFRESH_MS = 10 * 60 * 1000;

const WeatherMap = ({ lat, lon, onLocationSelect, onGpsRequest, gpsState, favorites = [] }) => {
    const [activeCoords, setActiveCoords] = useState([lat, lon]);
    const [mapStyle, setMapStyle] = useState('dark');
    const [radarOn, setRadarOn] = useState(true);
    const [radar, setRadar] = useState(null);

    useEffect(() => setActiveCoords([lat, lon]), [lat, lon]);

    // Latest radar frame; refreshed every 10 min while the radar layer is on.
    useEffect(() => {
        if (!radarOn) return undefined;
        const controller = new AbortController();
        const load = () => fetchRadarTileUrl({ signal: controller.signal }).then((r) => r && setRadar(r));
        load();
        const id = setInterval(load, RADAR_REFRESH_MS);
        return () => {
            controller.abort();
            clearInterval(id);
        };
    }, [radarOn]);

    const activeMapStyle = MAP_STYLES[mapStyle];
    const locating = gpsState === 'locating';

    const handleMapClick = (clickLat, clickLon) => {
        setActiveCoords([clickLat, clickLon]);
        onLocationSelect?.(clickLat, clickLon, null);
    };

    return (
        <div className="map-shell">
            <MapContainer center={activeCoords} zoom={9} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl>
                {activeMapStyle.urls.map((url, index) => (
                    <TileLayer
                        key={`${mapStyle}-${index}`}
                        url={url}
                        {...(index === 0 ? { attribution: activeMapStyle.attribution } : {})}
                        maxZoom={19}
                    />
                ))}

                {radarOn && radar && (
                    <TileLayer
                        key={radar.url}
                        url={radar.url}
                        attribution={RADAR_ATTRIBUTION}
                        opacity={0.7}
                        maxNativeZoom={7}
                        maxZoom={19}
                        zIndex={5}
                    />
                )}

                <Marker position={activeCoords} icon={activeIcon} keyboard={false}>
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="map-tooltip">
                        Selected location
                    </Tooltip>
                </Marker>

                {favorites.map((fav) => {
                    const isCurrent = Math.abs(fav.lat - lat) < 0.01 && Math.abs(fav.lon - lon) < 0.01;
                    if (isCurrent) return null;
                    return (
                        <Marker
                            key={fav.name}
                            position={[fav.lat, fav.lon]}
                            icon={favIcon}
                            eventHandlers={{ click: () => onLocationSelect?.(fav.lat, fav.lon, fav.name) }}
                        >
                            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tooltip">
                                {fav.name.split(',')[0]}
                            </Tooltip>
                        </Marker>
                    );
                })}

                <MapUpdater center={activeCoords} />
                <MapEvents onClick={handleMapClick} />
            </MapContainer>

            <div className="map-controls" role="group" aria-label="Map layers">
                {Object.entries(MAP_STYLES).map(([key, s]) => (
                    <button
                        type="button"
                        key={key}
                        className={`map-chip ${mapStyle === key ? 'active' : ''}`}
                        onClick={() => setMapStyle(key)}
                        aria-pressed={mapStyle === key}
                    >
                        {s.label}
                    </button>
                ))}
                <button
                    type="button"
                    className={`map-chip ${radarOn ? 'active' : ''}`}
                    onClick={() => setRadarOn((v) => !v)}
                    aria-pressed={radarOn}
                    title={radar?.time ? `Radar frame ${new Date(radar.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Rain radar'}
                >
                    <CloudRain size={12} aria-hidden="true" /> Radar
                </button>
            </div>

            <button
                type="button"
                onClick={onGpsRequest}
                className={`map-locate icon-btn ${locating ? 'locating' : ''}`}
                aria-label={locating ? 'Finding your location' : 'Use my location'}
                aria-busy={locating}
                title="Use my location"
            >
                <LocateFixed size={18} aria-hidden="true" />
            </button>
        </div>
    );
};

export default WeatherMap;
