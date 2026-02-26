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

async function geocodeCity(query) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error(`No results found for "${query}"`);
  const { latitude, longitude, name, admin1 } = data.results[0];
  return { latitude, longitude, locationName: [name, admin1].filter(Boolean).join(', ') };
}

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
  );
  const data = await res.json();
  // normalise both old and new field name
  if (data.daily && !data.daily.weather_code && data.daily.weathercode) {
    data.daily.weather_code = data.daily.weathercode;
  }
  return data;
}

export function WeatherWidget({ city, state }) {
  const initialQuery = [city, state].filter(Boolean).join(', ');

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [data, setData] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(!!initialQuery);
  const [error, setError] = useState(null);

  const load = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const { latitude, longitude, locationName: name } = await geocodeCity(q);
      const forecast = await fetchForecast(latitude, longitude);
      setData(forecast);
      setLocationName(name);
    } catch (e) {
      setError(e.message || 'Unable to load forecast. Check the city name and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load when city prop is provided
  useEffect(() => {
    if (initialQuery) load(initialQuery);
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputValue);
    load(inputValue);
  };

  const SearchBar = () => (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Enter city, e.g. Chicago, IL"
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" variant="outline" className="h-8 px-3">
        <Search className="h-3.5 w-3.5" />
      </Button>
    </form>
  );

  // No city provided — show search prompt
  if (!query.trim()) {
    return (
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">7-Day Forecast</h2>
        </div>
        <SearchBar />
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
        <SearchBar />
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
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Change city…"
              className="h-7 text-xs w-36"
            />
            <Button type="submit" size="sm" variant="ghost" className="h-7 px-2">
              <Search className="h-3 w-3" />
            </Button>
          </form>
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
