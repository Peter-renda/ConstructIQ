import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, Wind, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const WMO_MAP = {
  0:  { Icon: Sun,            label: 'Clear' },
  1:  { Icon: Sun,            label: 'Mostly Clear' },
  2:  { Icon: CloudSun,       label: 'Partly Cloudy' },
  3:  { Icon: Cloud,          label: 'Overcast' },
  45: { Icon: Wind,           label: 'Fog' },
  48: { Icon: Wind,           label: 'Icy Fog' },
  51: { Icon: CloudRain,      label: 'Light Drizzle' },
  53: { Icon: CloudRain,      label: 'Drizzle' },
  55: { Icon: CloudRain,      label: 'Heavy Drizzle' },
  61: { Icon: CloudRain,      label: 'Light Rain' },
  63: { Icon: CloudRain,      label: 'Rain' },
  65: { Icon: CloudRain,      label: 'Heavy Rain' },
  71: { Icon: CloudSnow,      label: 'Light Snow' },
  73: { Icon: CloudSnow,      label: 'Snow' },
  75: { Icon: CloudSnow,      label: 'Heavy Snow' },
  77: { Icon: CloudSnow,      label: 'Snow Grains' },
  80: { Icon: CloudRain,      label: 'Showers' },
  81: { Icon: CloudRain,      label: 'Showers' },
  82: { Icon: CloudRain,      label: 'Heavy Showers' },
  85: { Icon: CloudSnow,      label: 'Snow Showers' },
  86: { Icon: CloudSnow,      label: 'Snow Showers' },
  95: { Icon: CloudLightning, label: 'Thunderstorm' },
  96: { Icon: CloudLightning, label: 'Thunderstorm' },
  99: { Icon: CloudLightning, label: 'Thunderstorm' },
};

function getWmo(code) {
  return WMO_MAP[code] ?? { Icon: Cloud, label: 'Unknown' };
}

async function geolocate() {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
  );
}

async function geocodeCity(city, state) {
  const q = [city, state].filter(Boolean).join(', ');
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error('City not found');
  const { latitude, longitude, name, admin1 } = data.results[0];
  return { latitude, longitude, locationName: [name, admin1].filter(Boolean).join(', ') };
}

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
  );
  return res.json();
}

export function WeatherWidget({ city, state }) {
  const [data, setData] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let lat, lon, name;

        if (city) {
          const result = await geocodeCity(city, state);
          lat = result.latitude;
          lon = result.longitude;
          name = result.locationName;
        } else {
          const pos = await geolocate();
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          name = 'Current Location';
        }

        const forecast = await fetchForecast(lat, lon);
        if (!cancelled) {
          setData(forecast);
          setLocationName(name);
        }
      } catch {
        if (!cancelled) setError('Unable to load weather forecast.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [city, state]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-5">
        <div className="h-4 w-36 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-5 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  const { daily } = data;

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">7-Day Forecast</h2>
        {locationName && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {locationName}
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {daily.time.map((dateStr, i) => {
          const { Icon, label } = getWmo(daily.weathercode[i]);
          const isToday = i === 0;
          const dayLabel = isToday ? 'Today' : format(new Date(dateStr + 'T12:00:00'), 'EEE');
          const hi = Math.round(daily.temperature_2m_max[i]);
          const lo = Math.round(daily.temperature_2m_min[i]);
          return (
            <div
              key={dateStr}
              className={`flex flex-col items-center gap-1.5 px-1 py-3 rounded-lg text-center transition-colors ${
                isToday ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-slate-50'
              }`}
            >
              <span className={`text-[11px] font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {dayLabel}
              </span>
              <Icon className={`h-5 w-5 flex-shrink-0 ${isToday ? 'text-primary' : 'text-slate-400'}`} />
              <span className="text-[10px] text-muted-foreground leading-tight min-h-[2rem] flex items-center justify-center">
                {label}
              </span>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-xs font-bold">{hi}°</span>
                <span className="text-[10px] text-muted-foreground">{lo}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
