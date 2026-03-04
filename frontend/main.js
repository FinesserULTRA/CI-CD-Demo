import { fetchHealth, getApiUrl } from './api.js';

const root = document.getElementById('root');
root.innerHTML = '<h1>Life Dashboard</h1><p id="api-status">Checking API…</p>';

getApiUrl() &&
  fetchHealth()
    .then((data) => {
      document.getElementById('api-status').textContent = `API: ${data.status} (${getApiUrl()})`;
    })
    .catch((err) => {
      document.getElementById('api-status').textContent = `API: offline (${err.message})`;
    });
