import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import { LocateFixed, CloudRain, Info, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchRadarTileUrl } from '../api/weatherApi';

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
const MAP_STYLES = {
    dark: {
        label: 'Map',
        credit: 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
        layers: [
            { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', className: 'tiles-base-dark' },
            { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', className: 'tiles-labels' },
        ],
    },
    satellite: {
        label: 'Satellite',
        credit: 'Tiles © Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
        layers: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', className: 'tiles-sat' }],
    },
};

const RADAR_CREDIT = 'Radar © RainViewer';
const RADAR_REFRESH_MS = 10 * 60 * 1000;
const RADAR_NATIVE_MAX = 7; // free tier: higher zooms return a "not supported" tile
const MAP_MAX_ZOOM = 12; // limits how far radar is upscaled

const WeatherMap = ({ lat, lon, onLocationSelect, onGpsRequest, gpsState, favorites = [] }) => {
    const [activeCoords, setActiveCoords] = useState([lat, lon]);
    const [mapStyle, setMapStyle] = useState('dark');
    const [radarOn, setRadarOn] = useState(true);
    const [radar, setRadar] = useState(null);
    const [creditsOpen, setCreditsOpen] = useState(false);

    useEffect(() => setActiveCoords([lat, lon]), [lat, lon]);

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

    const style = MAP_STYLES[mapStyle];
    const locating = gpsState === 'locating';
    const radarTime = radar?.time ? new Date(radar.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;

    const handleMapClick = (clickLat, clickLon) => {
        setActiveCoords([clickLat, clickLon]);
        onLocationSelect?.(clickLat, clickLon, null);
    };

    return (
        <div className="map-shell">
            <MapContainer center={activeCoords} zoom={9} maxZoom={MAP_MAX_ZOOM} minZoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                {style.layers.map((l) => (
                    <TileLayer key={`${mapStyle}-${l.className}`} url={l.url} className={l.className} maxZoom={MAP_MAX_ZOOM} />
                ))}

                {radarOn && radar && (
                    <TileLayer
                        key={radar.url}
                        url={radar.url}
                        className="tiles-radar"
                        opacity={0.75}
                        maxNativeZoom={RADAR_NATIVE_MAX}
                        maxZoom={MAP_MAX_ZOOM}
                        zIndex={5}
                    />
                )}

                <Marker position={activeCoords} icon={activeIcon} keyboard={false}>
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} className="map-tooltip">Selected location</Tooltip>
                </Marker>

                {favorites.map((fav) => {
                    const isCurrent = Math.abs(fav.lat - lat) < 0.01 && Math.abs(fav.lon - lon) < 0.01;
                    if (isCurrent) return null;
                    return (
                        <Marker key={fav.name} position={[fav.lat, fav.lon]} icon={favIcon} eventHandlers={{ click: () => onLocationSelect?.(fav.lat, fav.lon, fav.name) }}>
                            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tooltip">{fav.name.split(',')[0]}</Tooltip>
                        </Marker>
                    );
                })}

                <MapUpdater center={activeCoords} />
                <MapEvents onClick={handleMapClick} />
            </MapContainer>

            <div className="map-controls" role="group" aria-label="Map layers">
                {Object.entries(MAP_STYLES).map(([key, s]) => (
                    <button type="button" key={key} className={`map-chip ${mapStyle === key ? 'active' : ''}`} onClick={() => setMapStyle(key)} aria-pressed={mapStyle === key}>
                        {s.label}
                    </button>
                ))}
                <button type="button" className={`map-chip ${radarOn ? 'active' : ''}`} onClick={() => setRadarOn((v) => !v)} aria-pressed={radarOn} aria-label={radarOn && radarTime ? `Radar on, frame from ${radarTime}` : 'Rain radar'}>
                    <CloudRain size={14} aria-hidden="true" /> Radar{radarOn && radarTime ? ` · ${radarTime}` : ''}
                </button>
            </div>

            <button
                type="button"
                onClick={onGpsRequest}
                className={`map-locate icon-btn ${locating ? 'locating' : ''}`}
                aria-label={locating ? 'Finding your location' : 'Use my location'}
                aria-busy={locating}
            >
                <LocateFixed size={18} aria-hidden="true" />
            </button>

            <button type="button" className="map-info icon-btn" onClick={() => setCreditsOpen((v) => !v)} aria-label={creditsOpen ? 'Hide map credits' : 'Map credits'} aria-expanded={creditsOpen}>
                {creditsOpen ? <X size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
            </button>
            {creditsOpen && (
                <div className="map-credits" role="note">
                    Leaflet · {style.credit}{radarOn ? ` · ${RADAR_CREDIT}` : ''}
                </div>
            )}
        </div>
    );
};

export default WeatherMap;
