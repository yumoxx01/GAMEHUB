/**
 * storage-helper.js
 * Game Hub — Firebase Storage & Media URL Resolver
 *
 * Handles:
 * - Resolving Firebase Storage paths to public download URLs via getDownloadURL()
 * - Supporting external direct URLs (https://...)
 * - Providing clean Swiss-style typographic SVG placeholders when media is not yet uploaded
 */

import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { storage } from './firebase-config.js';

// Cache resolved download URLs to avoid repetitive Storage requests
const urlCache = new Map();

/**
 * Creates a minimalist SVG placeholder data URI in Swiss Style
 * @param {string} title - Label to display in the placeholder
 * @param {string} [subtitle] - Optional category or platform
 * @returns {string} Data URI
 */
export function createSvgPlaceholder(title = 'GAME HUB', subtitle = '') {
  const safeTitle = (title || 'GAME HUB')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeSub = (subtitle || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="#1a1e26"/>
  <rect x="20" y="20" width="760" height="410" fill="none" stroke="#2a303c" stroke-width="1"/>
  <text x="40" y="240" font-family="'IBM Plex Sans', sans-serif" font-size="28" font-weight="600" fill="#f2f5f9" letter-spacing="-0.5">${safeTitle}</text>
  <text x="40" y="275" font-family="'IBM Plex Sans', sans-serif" font-size="14" font-weight="500" fill="#5ba4d9" letter-spacing="1" text-transform="uppercase">${safeSub}</text>
  <rect x="40" y="40" width="32" height="32" fill="#232833" stroke="#3a4252" stroke-width="1"/>
  <text x="49" y="62" font-family="'IBM Plex Sans', sans-serif" font-size="14" font-weight="600" fill="#5ba4d9">GH</text>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves a cover, screenshot, or video path.
 * If it's already an http(s) URL or data URI, returns it directly.
 * If it's a Storage path (e.g. "games/123/cover.jpg"), fetches getDownloadURL.
 * If empty or fails, returns the Swiss SVG placeholder.
 *
 * @param {string} pathOrUrl
 * @param {string} [fallbackTitle]
 * @param {string} [fallbackSubtitle]
 * @returns {Promise<string>}
 */
export async function resolveMediaUrl(pathOrUrl, fallbackTitle = 'Game Hub', fallbackSubtitle = '') {
  if (!pathOrUrl || typeof pathOrUrl !== 'string' || pathOrUrl.trim() === '') {
    return createSvgPlaceholder(fallbackTitle, fallbackSubtitle);
  }

  const trimmed = pathOrUrl.trim();

  // Already a web URL or data URI
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Check in-memory cache
  if (urlCache.has(trimmed)) {
    return urlCache.get(trimmed);
  }

  // Firebase Storage reference lookup
  try {
    const storageRef = ref(storage, trimmed);
    const downloadUrl = await getDownloadURL(storageRef);
    urlCache.set(trimmed, downloadUrl);
    return downloadUrl;
  } catch (err) {
    console.warn(`[storage-helper] Could not resolve path "${trimmed}":`, err.message || err);
    return createSvgPlaceholder(fallbackTitle, fallbackSubtitle);
  }
}

/**
 * Resolves an array of media paths in parallel.
 * @param {string[]} paths
 * @param {string} fallbackTitle
 * @returns {Promise<string[]>}
 */
export async function resolveMediaList(paths, fallbackTitle = 'Screenshot') {
  if (!Array.isArray(paths) || paths.length === 0) {
    return [];
  }
  return Promise.all(paths.map((p, idx) => resolveMediaUrl(p, `${fallbackTitle} #${idx + 1}`)));
}
