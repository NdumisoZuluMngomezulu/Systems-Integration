(function () {
  const API_BASE = window.APP_CONFIG.API_BASE;

  // Centroids for a handful of Gauteng towns/suburbs, used as a manual
  // fallback when a user can't or won't share their live location.
  const GAUTENG_AREAS = [
    { label: 'Johannesburg CBD', lat: -26.2041, lng: 28.0473 },
    { label: 'Sandton', lat: -26.1076, lng: 28.0567 },
    { label: 'Soweto', lat: -26.2485, lng: 27.8909 },
    { label: 'Pretoria CBD', lat: -25.7479, lng: 28.2293 },
    { label: 'Centurion', lat: -25.8603, lng: 28.1894 },
    { label: 'Kempton Park', lat: -26.1037, lng: 28.2315 },
    { label: 'Benoni', lat: -26.1883, lng: 28.3206 },
    { label: 'Krugersdorp', lat: -26.0931, lng: 27.7720 },
    { label: 'Vereeniging', lat: -26.6731, lng: 27.9319 }
  ];

  const els = {
    locateBtn: document.getElementById('locate-btn'),
    areaSelect: document.getElementById('area-select'),
    genderFilter: document.getElementById('gender-filter'),
    radiusFilter: document.getElementById('radius-filter'),
    statusMessage: document.getElementById('status-message'),
    resultsList: document.getElementById('results-list')
  };

  let map;
  let markersLayer;
  let currentPosition = null; // { lat, lng }

  function initMap() {
    map = L.map('map', { scrollWheelZoom: false }).setView([-26.2041, 28.0473], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }

  function populateAreaSelect() {
    GAUTENG_AREAS.forEach((area) => {
      const opt = document.createElement('option');
      opt.value = `${area.lat},${area.lng}`;
      opt.textContent = area.label;
      els.areaSelect.appendChild(opt);
    });
  }

  function setStatus(message, isError) {
    els.statusMessage.textContent = message || '';
    els.statusMessage.classList.toggle('status-error', Boolean(isError));
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setStatus('Your browser does not support location lookup. Try choosing an area instead.', true);
      return;
    }
    setStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        els.areaSelect.value = '';
        setStatus('');
        fetchNearbyShelters();
      },
      () => {
        setStatus('Could not get your location. Try choosing an area below instead.', true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onAreaChange() {
    const value = els.areaSelect.value;
    if (!value) return;
    const [lat, lng] = value.split(',').map(Number);
    currentPosition = { lat, lng };
    setStatus('');
    fetchNearbyShelters();
  }

  async function fetchNearbyShelters() {
    if (!currentPosition) return;

    setStatus('Searching for nearby shelters…');
    els.resultsList.innerHTML = '';

    const params = new URLSearchParams({
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      maxDistance: els.radiusFilter.value
    });
    if (els.genderFilter.value) params.set('gender', els.genderFilter.value);

    try {
      const res = await fetch(`${API_BASE}/shelters/nearby?${params.toString()}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      renderResults(data.shelters);
      setStatus(data.count === 0 ? 'No shelters found in that range. Try a wider radius.' : '');
    } catch (err) {
      console.error(err);
      setStatus('Could not reach the shelter database. Is the backend running?', true);
    }
  }

  function renderResults(shelters) {
    markersLayer.clearLayers();
    els.resultsList.innerHTML = '';

    if (!shelters || shelters.length === 0) {
      els.resultsList.innerHTML = '<p class="empty-state">No shelters found nearby. Try widening the search radius.</p>';
      return;
    }

    // Centre + zoom the map around the user and the results
    const bounds = [[currentPosition.lat, currentPosition.lng]];

    shelters.forEach((shelter, index) => {
      const [lng, lat] = shelter.location.coordinates;
      bounds.push([lat, lng]);

      L.marker([lat, lng])
        .addTo(markersLayer)
        .bindPopup(`<strong>${escapeHtml(shelter.name)}</strong><br>${escapeHtml(shelter.suburb || '')}`);

      els.resultsList.appendChild(buildShelterCard(shelter, index === 0));
    });

    L.marker([currentPosition.lat, currentPosition.lng], {
      icon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [20, 32]
      })
    })
      .addTo(markersLayer)
      .bindPopup('You are here');

    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }

  function buildShelterCard(shelter, isClosest) {
    const card = document.createElement('article');
    card.className = 'shelter-card' + (isClosest ? ' shelter-card--closest' : '');

    const services = (shelter.servicesOffered || [])
      .map((s) => `<span class="tag">${escapeHtml(s)}</span>`)
      .join('');

    const fundedLabel = {
      funded: 'Funded',
      unfunded: 'Unfunded',
      unknown: 'Funding unknown'
    }[shelter.fundedStatus] || 'Funding unknown';

    const phone = shelter.contact && shelter.contact.phone;
    const [lng, lat] = shelter.location.coordinates;

    card.innerHTML = `
      ${isClosest ? '<span class="closest-flag">Closest</span>' : ''}
      <div class="shelter-card__header">
        <h3>${escapeHtml(shelter.name)}</h3>
        <span class="distance-pill">${shelter.distanceKm} km</span>
      </div>
      <p class="shelter-card__meta">${escapeHtml(shelter.suburb || '')} · ${escapeHtml(shelter.municipality)}</p>
      <p class="shelter-card__meta">Serves: ${escapeHtml(shelter.servesGender || 'any')} · <span class="fund-dot fund-dot--${shelter.fundedStatus}"></span> ${fundedLabel}</p>
      <div class="tag-list">${services}</div>
      <div class="shelter-card__actions">
        ${phone ? `<a class="btn btn-accent" href="tel:${escapeHtml(phone)}">Call ${escapeHtml(phone)}</a>` : ''}
        <a class="btn btn-secondary" target="_blank" rel="noopener"
           href="https://www.openstreetmap.org/directions?from=${currentPosition.lat}%2C${currentPosition.lng}&to=${lat}%2C${lng}">
           Directions
        </a>
      </div>
    `;
    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // --- init ---
  initMap();
  populateAreaSelect();
  els.locateBtn.addEventListener('click', useMyLocation);
  els.areaSelect.addEventListener('change', onAreaChange);
  els.genderFilter.addEventListener('change', () => currentPosition && fetchNearbyShelters());
  els.radiusFilter.addEventListener('change', () => currentPosition && fetchNearbyShelters());
})();
