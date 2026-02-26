import { useState, useEffect, useCallback } from 'react';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, Wind, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

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

// Nominatim (OpenStreetMap) — handles zip codes and city names reliably
async function geocode(zip, city, state) {
  let url;
  if (zip && zip.trim()) {
    url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip.trim())}&countrycodes=us&format=json&limit=1`;
  } else {
    const q = [city, state].filter(Boolean).join(', ');
    if (!q.trim()) throw new Error('No location provided');
    url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  }

  const res = await fetch(url, { headers: { 'Accept-Language': 'en-US,en' } });
  const results = await res.json();
  if (!results.length) throw new Error('Location not found. Try a different zip or city.');

  const { lat, lon, display_name } = results[0];
  // Trim display_name to first two segments (city, state)
  const parts = display_name.split(', ');
  const locationName = parts.slice(0, 2).join(', ');
  return { latitude: parseFloat(lat), longitude: parseFloat(lon), locationName };
}

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
  );
  const data = await res.json();
  // Support both old and new field name
  if (data.daily && !data.daily.weather_code && data.daily.weathercode) {
    data.daily.weather_code = data.daily.weathercode;
  }
  if (!data.daily?.weather_code) throw new Error('Unexpected forecast response.');
  return data;
}

export function WeatherWidget({ zip, city, state }) {
  const hasLocation = !!(zip?.trim() || city?.trim());

  const [data, setData] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(hasLocation);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const load = useCallback(async (overrideInput) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const useZip = overrideInput ?? zip;
      const useCity = overrideInput ? undefined : city;
      const useState_ = overrideInput ? undefined : state;
      const { latitude, longitude, locationName: name } = await geocode(useZip, useCity, useState_);
      const forecast = await fetchForecast(latitude, longitude);
      setData(forecast);
      setLocationName(name);
    } catch (e) {
      setError(e.message || 'Unable to load forecast.');
    } finally {
      setLoading(false);
    }
  }, [zip, city, state]);

  useEffect(() => {
    if (hasLocation) load();
  }, [zip, city, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) load(inputValue.trim());
  };

  const SearchForm = ({ compact = false }) => (
    <form onSubmit={handleSearch} className={`flex gap-2 ${compact ? '' : 'mt-1'}`}>
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder={compact ? 'Change zip or city…' : 'Enter zip code or city, e.g. 30301 or Atlanta, GA'}
        className={compact ? 'h-7 text-xs w-44' : 'h-8 text-sm'}
      />
      <Button type="submit" size="sm" variant={compact ? 'ghost' : 'outline'} className={compact ? 'h-7 px-2' : 'h-8 px-3'}>
        <Search className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </Button>
    </form>
  );

  if (!hasLocation && !data) {
    return (
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold mb-3">7-Day Forecast</h2>
        <p className="text-xs text-muted-foreground mb-2">No location set for this project. Enter a zip or city:</p>
        <SearchForm />
      </div>
    );
  }

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
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="text-sm font-semibold">7-Day Forecast</h2>
        <p className="text-sm text-destructive">{error}</p>
        <SearchForm />
      </div>
    );
  }

  if (!data?.daily) return null;

  const { daily } = data;

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold">7-Day Forecast</h2>
        <div className="flex items-center gap-3">
          {locationName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {locationName}
            </span>
          )}
          <SearchForm compact />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {daily.time.map((dateStr, i) => {
          const { Icon, label } = getWmo(daily.weather_code[i]);
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
