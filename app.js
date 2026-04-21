'use strict';

const COLORS = [
  { bg: '#e6f1fb', text: '#185FA5', letter: 'A' },
  { bg: '#e1f5ee', text: '#0F6E56', letter: 'B' },
  { bg: '#faeeda', text: '#854F0B', letter: 'C' },
  { bg: '#fbeaf0', text: '#993556', letter: 'D' },
  { bg: '#eeedfe', text: '#3C3489', letter: 'E' },
  { bg: '#faece7', text: '#993C1D', letter: 'F' },
];

const PLACEHOLDERS = [
  'Ex : Nantes, 44000',
  'Ex : Rennes, 35000',
  'Ex : Le Mans, 72000',
  'Ex : Angers, 49000',
  'Ex : Laval, 53000',
  'Ex : Saint-Nazaire, 44600',
];

const DEV_MODE_KEY = 'covoipoint_dev_mode';
const API_BASE_URL = (() => {
  const normalize = (url) => String(url || '').trim().replace(/\/+$/, '');

  // Optional manual override (useful for testing against remote/staging API).
  try {
    const override = normalize(localStorage.getItem('covoipoint_api_base_url'));
    if (override) return override;
  } catch {}

  const { protocol, hostname, origin, port } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Typical local setup: front on :3000, backend on :3001.
  if (isLocal && port !== '3001') {
    return `${protocol}//${hostname}:3001`;
  }

  // Default: same-origin API (works behind reverse proxy / single host deploys).
  return origin;
})();

let count = 0;

function updateCounter() {
  const n = document.querySelectorAll('.departure-item').length;
  document.getElementById('counter').textContent =
    n + ' participant' + (n > 1 ? 's' : '');
}

function addDeparture(placeholder) {
  const list = document.getElementById('departure-list');
  const idx = count % COLORS.length;
  const c = COLORS[idx];
  const ph = placeholder || PLACEHOLDERS[idx] || 'Adresse de départ';
  const id = 'dep-' + count;
  count++;

  const div = document.createElement('div');
  div.className = 'departure-item';
  div.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.style.background = c.bg;
  avatar.style.color = c.text;
  avatar.textContent = c.letter;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = ph;
  input.autocomplete = 'off';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.title = 'Retirer';
  removeBtn.textContent = 'x';
  removeBtn.addEventListener('click', () => removeItem(id));

  div.appendChild(avatar);
  div.appendChild(input);
  div.appendChild(removeBtn);
  list.appendChild(div);

  updateCounter();
  input.focus();
}

function removeItem(id) {
  const items = document.querySelectorAll('.departure-item');
  if (items.length <= 1) return;
  document.getElementById(id)?.remove();
  updateCounter();
}

function selectMode(el) {
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// Loading overlay
function showLoading() {
  document.getElementById('loading-overlay').classList.add('active');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}

// Error banner
function showError(msg) {
  const banner = document.getElementById('error-banner');
  document.getElementById('error-msg').textContent = msg;
  banner.classList.add('active');
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideError() {
  document.getElementById('error-banner').classList.remove('active');
}

function buildResultPageUrl(devModeEnabled) {
  const targetFile = devModeEnabled ? 'testBox/resultTest.html' : 'result.html';

  // Resolve from the current document URL.
  // This supports both http(s) hosting and local file:// launches.
  return new URL(targetFile, window.location.href).href;
}

// Submit - appel API backend avant redirection vers la page resultat
async function handleSubmit() {
  hideError();

  const inputs = [...document.querySelectorAll('.departure-item input')]
    .map(i => i.value.trim())
    .filter(Boolean);
  const dest = document.getElementById('dest-input').value.trim();
  const mode = document.querySelector('.mode-card.active')?.dataset.mode;
  const placeType = document.getElementById('place-type-select')?.value || 'optimal';
  const devModeEnabled = !!document.getElementById('dev-mode-toggle')?.checked;

  if (inputs.length < 2 || !dest) {
    showError('Veuillez renseigner au moins deux points de depart et une destination.');
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/api/calculate-meeting-point`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startAddresses: inputs,
        destination: dest,
        mode,
        placeType,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || `Erreur API (${response.status})`);
    }

    sessionStorage.setItem('covoipoint_result', JSON.stringify(data));
    window.location.href = buildResultPageUrl(devModeEnabled);
  } catch (err) {
    hideLoading();
    showError(err.message || 'Une erreur inattendue est survenue.');
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  addDeparture(PLACEHOLDERS[0]);
  addDeparture(PLACEHOLDERS[1]);

  document.getElementById('add-btn').addEventListener('click', () => addDeparture());

  const devToggle = document.getElementById('dev-mode-toggle');
  if (devToggle) {
    devToggle.checked = localStorage.getItem(DEV_MODE_KEY) === '1';
    devToggle.addEventListener('change', () => {
      localStorage.setItem(DEV_MODE_KEY, devToggle.checked ? '1' : '0');
    });
  }

  window.selectMode = selectMode;
  window.handleSubmit = handleSubmit;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  }
});
