
function showDateTime() {
  const now = new Date(); // Get current date and time

  // Format date and time
  const date = now.toLocaleDateString();  // Example: 11/13/2025
  const time = now.toLocaleTimeString();  // Example: 5:42:30 PM

  // Display in paragraph
  document.getElementById("datetime").innerHTML = "Today," + " " + date + " " + time;
}

// Update every second
setInterval(showDateTime, 1000);

(async function () {
  const root = document.getElementById('weatherWidgetRoot');
  const controls = document.createElement('div');
  controls.className = 'controls';
  const input = document.querySelector('input[type="search"]') || document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Enter city or place name';
  input.autocomplete = 'off';
  const searchBtn = document.createElement('button');
  searchBtn.textContent = 'Search';
  controls.appendChild(input);
  controls.appendChild(searchBtn);
  

  const status = document.createElement('div');
  status.className = 'status';
  const resultWrap = document.createElement('div');
  resultWrap.id = 'weatherResult';

  root.appendChild(controls);
  root.appendChild(status);
  root.appendChild(resultWrap);
  const weatherMap = {
    0: ['☀️', 'Clear sky'],
    1: ['🌤️', 'Mainly clear'],
    2: ['⛅', 'Partly cloudy'],
    3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'],
    48: ['🌫️', 'Depositing rime fog'],
    51: ['🌦️', 'Light drizzle'],
    53: ['🌦️', 'Moderate drizzle'],
    55: ['🌧️', 'Dense drizzle'],
    56: ['🌧️', 'Light freezing drizzle'],
    57: ['🌧️', 'Dense freezing drizzle'],
    61: ['🌦️', 'Slight rain'],
    63: ['🌧️', 'Moderate rain'],
    65: ['🌧️', 'Heavy rain'],
    66: ['🌧️', 'Light freezing rain'],
    67: ['🌧️', 'Heavy freezing rain'],
    71: ['❄️', 'Slight snow fall'],
    73: ['❄️', 'Moderate snow fall'],
    75: ['❄️', 'Heavy snow fall'],
    77: ['❄️', 'Snow grains'],
    80: ['🌦️', 'Slight rain showers'],
    81: ['🌧️', 'Moderate rain showers'],
    82: ['🌧️', 'Violent rain showers'],
    85: ['❄️', 'Slight snow showers'],
    86: ['❄️', 'Heavy snow showers'],
    95: ['⛈️', 'Thunderstorm'],
    96: ['⛈️', 'Thunderstorm with slight hail'],
    99: ['⛈️', 'Thunderstorm with heavy hail']
  };

  function showStatus(msg) {
    status.textContent = msg || '';
  }

  function renderWeather(place, weather) {
    resultWrap.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    const icon = document.createElement('div');
    icon.className = 'icon';
    const [emoji, desc] = weatherMap[weather.weathercode] || ['🌈', 'Unknown'];
    icon.textContent = emoji;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const t = document.createElement('div');
    t.className = 'temp';
    t.textContent = Math.round(weather.temperature) + '°C';
    const d = document.createElement('div');
    d.className = 'desc';
    d.textContent = desc + ' — ' + place;
    const s = document.createElement('div');
    s.className = 'small';
    s.textContent = `Wind ${Math.round(weather.windspeed)} km/h • ${weather.time}`;

    meta.appendChild(t);
    meta.appendChild(d);
    meta.appendChild(s);

    card.appendChild(icon);
    card.appendChild(meta);
    resultWrap.appendChild(card);
  }

  async function geocode(query) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=1&language=en&format=json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    return (data && data.results && data.results[0]) || null;
  }

  async function fetchCurrentWeather(lat, lon, tz = 'auto') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=${encodeURIComponent(tz)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    return data.current_weather;
  }

  async function doSearch(query) {
    if (!query) { showStatus('Type a city name'); return; }
    try {
      showStatus('Searching location...');
      const place = await geocode(query);
      if (!place) { showStatus('Location not found'); return; }
      showStatus('Fetching weather...');
      const cw = await fetchCurrentWeather(place.latitude, place.longitude, place.timezone || 'auto');
      renderWeather(place.name + (place.country ? ', ' + place.country : ''), cw);
      showStatus('');
    } catch (e) {
      showStatus('Error: ' + e.message);
    }
  }

  // Event handlers
  searchBtn.addEventListener('click', () => doSearch(input.value.trim()));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(input.value.trim());
  });

  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { showStatus('Geolocation not supported'); return; }
    showStatus('Getting current location...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const revUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`;
        const revRes = await fetch(revUrl);
        const rev = await revRes.json();
        const place = (rev && rev.results && rev.results[0]) ? rev.results[0] : { name: 'Your location', country: '' };
        showStatus('Fetching weather...');
        const cw = await fetchCurrentWeather(lat, lon, place.timezone || 'auto');
        renderWeather(place.name + (place.country ? ', ' + place.country : ''), cw);
        showStatus('');
      } catch (e) {
        showStatus('Error: ' + e.message);
      }
    }, (err) => {
      showStatus('Location error: ' + err.message);
    }, { timeout: 10000 });
  });
})();
