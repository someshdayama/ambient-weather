import { Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { getIconName } from '../utils/weatherUtils';

const ICONS = { Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

/** Weather-code icon, day/night aware. Decorative unless `label` is given. */
const WeatherIcon = ({ code, isDay = 1, size = 20, strokeWidth = 1.6, label, className }) => {
    const Icon = ICONS[getIconName(code, isDay)] || Sun;
    return (
        <Icon
            size={size}
            strokeWidth={strokeWidth}
            className={className}
            aria-hidden={label ? undefined : 'true'}
            aria-label={label}
            role={label ? 'img' : undefined}
        />
    );
};

export default WeatherIcon;
