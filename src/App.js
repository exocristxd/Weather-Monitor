import { useState, useEffect, } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

// Fix default marker icon broken in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_KEY = "8f17701036a9bf09d459ff3bc0afb58b";

function getAlertMessage(data) {
  const temp = data.main.temp;
  const weather = data.weather[0].main.toLowerCase();
  const wind = data.wind.speed;

  if (temp >= 40) return "🔥 Extreme Heat Warning — Stay hydrated and indoors.";
  if (temp <= 0) return "🧊 Freezing Conditions — Risk of ice and frostbite.";
  if (weather.includes("thunderstorm")) return "⛈️ Thunderstorm Alert — Avoid outdoor activities.";
  if (weather.includes("tornado")) return "🌪️ Tornado Warning — Seek shelter immediately!";
  if (weather.includes("snow")) return "❄️ Snowstorm Alert — Roads may be hazardous.";
  if (wind > 20) return "💨 High Wind Advisory — Secure loose objects outdoors.";
  return null;
}
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [city, setCity] = useState("Kokrajhar");
  const [input, setInput] = useState("");
  const [coords, setCoords] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedWeather, setClickedWeather] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [clickLoading, setClickLoading] = useState(false);

  const fetchWeather = async (targetCity) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${targetCity}&appid=${API_KEY}&units=metric`
      );
      setWeather(res.data);
      setCoords({
        lat: res.data.coord.lat,
        lon: res.data.coord.lon,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`City "${targetCity}" not found. Please try another name.`);
      } else {
        setError("Failed to fetch weather data. Check your API key or connection.");
      }
      setWeather(null);
      setCoords(null);
    } finally {
      setLoading(false);
    }
  };
  const fetchWeatherByCoords = async (lat, lon) => {
  setClickLoading(true);
  setClickedCoords({ lat, lon });
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    setClickedWeather(res.data);
  } catch (err) {
    setClickedWeather(null);
  } finally {
    setClickLoading(false);
  }
};

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleSearch = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setCity(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const alert = weather ? getAlertMessage(weather) : null;

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1>⚡ Disaster Alert Dashboard</h1>
        <p>Real-time weather monitoring and disaster alerts</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search city (e.g. Mumbai, London...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Error */}
      {error && <div className="error-msg">⚠️ {error}</div>}

      {/* Loading */}
      {loading && <div className="loading">⏳ Fetching weather data...</div>}

      {/* Weather Display */}
      {!loading && weather && (
        <>
          {/* Alert Banner */}
          {alert && <div className="alert-banner">🚨 {alert}</div>}

          {/* Hero Card */}
          <div className="weather-hero">
            <div className="location">
              <h2>{weather.name}, {weather.sys.country}</h2>
              <p>{new Date().toLocaleDateString("en-IN", {
                weekday: "long", year: "numeric", month: "long", day: "numeric"
              })}</p>
            </div>

            <div className="temp">{Math.round(weather.main.temp)}°C</div>

            <div className="condition">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
              />
              <p>{weather.weather[0].description}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="label">Feels Like</span>
              <span className="value">{Math.round(weather.main.feels_like)}°C</span>
            </div>
            <div className="stat-card">
              <span className="label">Humidity</span>
              <span className="value">{weather.main.humidity}%</span>
            </div>
            <div className="stat-card">
              <span className="label">Wind Speed</span>
              <span className="value">{weather.wind.speed} m/s</span>
              <span className="sub">Direction: {weather.wind.deg}°</span>
            </div>
            <div className="stat-card">
              <span className="label">Visibility</span>
              <span className="value">{(weather.visibility / 1000).toFixed(1)} km</span>
            </div>
            <div className="stat-card">
              <span className="label">Pressure</span>
              <span className="value">{weather.main.pressure} hPa</span>
            </div>
            <div className="stat-card">
              <span className="label">Cloud Cover</span>
              <span className="value">{weather.clouds.all}%</span>
            </div>
          </div>

          {coords && (
            <div className="map-section">
              <h3>📍 Location Map</h3>
              <div className={`map-wrapper ${isFullscreen ? "fullscreen" : ""}`}>
                <button
                  className="fullscreen-btn"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}
                </button>
                <MapContainer
  key={`${coords.lat}-${coords.lon}-${isFullscreen}`}
  center={[coords.lat, coords.lon]}
  zoom={10}
  style={{ height: "100%", width: "100%" }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  <Marker position={[coords.lat, coords.lon]}>
    <Popup>
      {weather.name}, {weather.sys.country} <br />
      {Math.round(weather.main.temp)}°C — {weather.weather[0].description}
    </Popup>
  </Marker>

  <MapClickHandler onMapClick={fetchWeatherByCoords} />

  {clickedCoords && (
    <Marker position={[clickedCoords.lat, clickedCoords.lon]}>
      <Popup>
        {clickLoading && "Loading weather..."}
        {!clickLoading && clickedWeather && (
          <>
            {clickedWeather.name ? `${clickedWeather.name}, ${clickedWeather.sys.country}` : "Selected location"} <br />
            {Math.round(clickedWeather.main.temp)}°C — {clickedWeather.weather[0].description} <br />
            Humidity: {clickedWeather.main.humidity}%
          </>
        )}
        {!clickLoading && !clickedWeather && "No data available for this location."}
      </Popup>
    </Marker>
  )}
</MapContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
          