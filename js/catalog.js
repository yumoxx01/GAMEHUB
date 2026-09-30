/**
 * catalog.js
 * Game Hub — Homepage Catalog & Hero Poster Controller
 *
 * Implements:
 * - Random featured hero poster rotation on page load/refresh
 * - Real-time catalog grid with onSnapshot
 * - Cursor pagination with startAfter() ("Показать еще")
 * - Live search with debounced range query (titleLower >= term && titleLower <= term + '\uf8ff')
 * - Platform filtering (synced with header pills)
 * - Genre filtering (on-page genre selector)
 * - Sort dropdown (price asc/desc, avgRating desc, releaseDate desc)
 * - Informative empty state with filter loosening advice
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase-config.js';
import { COLLECTIONS, GENRES, gamesConverter } from './firestore-schema.js';
import { resolveMediaUrl } from './storage-helper.js';

const PAGE_SIZE = 12;

// Catalog state
let currentPlatform = '';
let currentGenre = '';
let currentSort = 'rating'; // 'rating' | 'price-asc' | 'price-desc' | 'date-desc'
let currentSearch = '';
let unsubscribeCatalog = null;
let lastVisibleDoc = null;
let hasMore = false;
let isLoadingMore = false;
let displayedGameIds = new Set();
let isFallbackMode = false;
let fallbackAllDocs = [];
let fallbackFilteredDocs = [];
let fallbackLimit = PAGE_SIZE;

// DOM References
const heroPosterEl = document.getElementById('hero-poster');
const gamesGridEl = document.getElementById('games-grid');
const emptyStateEl = document.getElementById('catalog-empty-state');
const emptyMessageEl = document.getElementById('empty-state-message');
const btnResetFilters = document.getElementById('btn-reset-filters');
const btnShowMore = document.getElementById('btn-show-more');
const genrePillsContainer = document.getElementById('genre-pills-container');
const sortSelect = document.getElementById('catalog-sort-select');
const catalogCountEl = document.getElementById('catalog-count');
const activeFiltersBar = document.getElementById('active-filters-bar');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Featured Poster Rotation
// ─────────────────────────────────────────────────────────────────────────────
async function loadFeaturedPoster() {
  if (!heroPosterEl) return;

  try {
    const q = query(
      collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter),
      where('featured', '==', true)
    );

    const snapshot = await getDocs(q);
    const featuredGames = [];
    snapshot.forEach((docSnap) => {
      featuredGames.push(docSnap.data());
    });

    if (featuredGames.length === 0) {
      // Fallback: try querying any games if none flagged as featured
      const fallbackSnap = await getDocs(query(collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter), limit(4)));
      fallbackSnap.forEach(d => featuredGames.push(d.data()));
    }

    if (featuredGames.length === 0) {
      heroPosterEl.style.display = 'none';
      return;
    }

    // Pick one at random from the results (Math.random())
    const randomIndex = Math.floor(Math.random() * featuredGames.length);
    const selected = featuredGames[randomIndex];

    // Resolve cover media
    const coverUrl = await resolveMediaUrl(
      selected.coverImage,
      selected.title,
      selected.platforms?.join(' · ') || 'Game Hub'
    );

    const platformPills = (selected.platforms || [])
      .map(p => `<span class="hero-pill">${escapeHtml(p)}</span>`)
      .join('');

    const genresText = (selected.genres || []).join(' / ');

    heroPosterEl.href = `game.html?id=${encodeURIComponent(selected.id)}`;
    heroPosterEl.innerHTML = `
      <img src="${coverUrl}" alt="${escapeHtml(selected.title)}" class="hero-bg-img" />
      <div class="hero-scrim">
        <div class="hero-content">
          <div class="hero-badge-row">
            <span class="hero-featured-tag">В центре внимания</span>
            ${platformPills}
            ${genresText ? `<span class="hero-pill">${escapeHtml(genresText)}</span>` : ''}
          </div>
          <h1 class="hero-title">${escapeHtml(selected.title)}</h1>
          <p class="hero-tagline">${escapeHtml(selected.description || '')}</p>
          <div class="hero-footer-row">
            <span class="hero-price">${selected.price ? `${selected.price.toLocaleString('ru-RU')} ₸` : 'Бесплатно'}</span>
            <span class="btn btn-primary" style="pointer-events: none;">Подробнее</span>
          </div>
        </div>
      </div>
    `;
    heroPosterEl.style.display = 'block';

  } catch (err) {
    console.warn('[catalog] Error loading featured poster:', err);
    if (heroPosterEl) heroPosterEl.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Query Construction
// ─────────────────────────────────────────────────────────────────────────────
function buildBaseQuery(customLimit = PAGE_SIZE, startCursor = null) {
  const constraints = [];
  const colRef = collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter);

  const term = currentSearch.trim().toLowerCase();

  if (term) {
    // Range query search by titleLower
    constraints.push(where('titleLower', '>=', term));
    constraints.push(where('titleLower', '<=', term + '\uf8ff'));
    constraints.push(orderBy('titleLower', 'asc'));
  } else {
    // Filter by platform if active
    if (currentPlatform) {
      constraints.push(where('platforms', 'array-contains', currentPlatform));
    } else if (currentGenre) {
      // If no platform filter, can filter genre directly via Firestore
      constraints.push(where('genres', 'array-contains', currentGenre));
    }

    // Apply sorting
    switch (currentSort) {
      case 'price-asc':
        constraints.push(orderBy('price', 'asc'));
        break;
      case 'price-desc':
        constraints.push(orderBy('price', 'desc'));
        break;
      case 'date-desc':
        constraints.push(orderBy('releaseDate', 'desc'));
        break;
      case 'rating':
      default:
        constraints.push(orderBy('avgRating', 'desc'));
        break;
    }
  }

  // Cursor for pagination
  if (startCursor) {
    constraints.push(startAfter(startCursor));
  }

  constraints.push(limit(customLimit));

  return query(colRef, ...constraints);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Card Template Generation
// ─────────────────────────────────────────────────────────────────────────────
async function createGameCardHtml(game) {
  const platformsStr = (game.platforms || []).join(', ') || 'Все платформы';
  const priceStr = game.price ? `${game.price.toLocaleString('ru-RU')} ₸` : 'Бесплатно';
  const genresStr = (game.genres || []).slice(0, 2).join(' · ');

  const coverUrl = await resolveMediaUrl(
    game.coverImage,
    game.title,
    (game.platforms || [])[0] || 'Game'
  );

  const ratingBadge = game.avgRating > 0
    ? `<span class="card-rating-badge">★ ${game.avgRating.toFixed(1)}</span>`
    : '';

  return `
    <a href="game.html?id=${encodeURIComponent(game.id)}" class="game-card" data-game-id="${escapeHtml(game.id)}">
      <div class="card-media">
        <img src="${coverUrl}" alt="${escapeHtml(game.title)}" class="card-img" loading="lazy" />
        ${ratingBadge}
      </div>
      <div class="card-content">
        <div class="card-title-line">
          <h3 class="card-title">${escapeHtml(game.title)}</h3>
          <span class="card-platform-text">${escapeHtml(platformsStr)}</span>
        </div>
        <div class="card-footer">
          <span class="card-price">${priceStr}</span>
          <span class="card-genres-preview">${escapeHtml(genresStr)}</span>
        </div>
      </div>
    </a>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Real-time Catalog Listener (onSnapshot)
// ─────────────────────────────────────────────────────────────────────────────
function initCatalogListener() {
  if (unsubscribeCatalog) {
    unsubscribeCatalog();
    unsubscribeCatalog = null;
  }

  displayedGameIds.clear();
  lastVisibleDoc = null;
  hasMore = false;

  updateActiveFiltersUI();

  // Show skeleton/loading state
  if (gamesGridEl) {
    gamesGridEl.innerHTML = `
      <div class="game-card" style="height: 280px; background: var(--surface-1); border: 1px solid var(--border);"><div class="skeleton" style="height: 100%;"></div></div>
      <div class="game-card" style="height: 280px; background: var(--surface-1); border: 1px solid var(--border);"><div class="skeleton" style="height: 100%;"></div></div>
      <div class="game-card" style="height: 280px; background: var(--surface-1); border: 1px solid var(--border);"><div class="skeleton" style="height: 100%;"></div></div>
    `;
  }

  const q = buildBaseQuery(PAGE_SIZE);

  unsubscribeCatalog = onSnapshot(q, async (snapshot) => {
    isFallbackMode = false;
    let docs = snapshot.docs;

    // In-memory genre filter if both platform AND genre are selected
    if (currentPlatform && currentGenre) {
      docs = docs.filter(d => {
        const data = d.data();
        return Array.isArray(data.genres) && data.genres.includes(currentGenre);
      });
    }

    if (docs.length === 0) {
      if (gamesGridEl) gamesGridEl.innerHTML = '';
      showEmptyState();
      updateCatalogCount(0);
      toggleShowMore(false);
      return;
    }

    hideEmptyState();
    updateCatalogCount(docs.length);

    // Save cursor for pagination
    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    hasMore = snapshot.docs.length === PAGE_SIZE;
    toggleShowMore(hasMore);

    displayedGameIds.clear();
    const cardsHtmlArray = await Promise.all(docs.map(async (docSnap) => {
      displayedGameIds.add(docSnap.id);
      return createGameCardHtml(docSnap.data());
    }));

    if (gamesGridEl) {
      gamesGridEl.innerHTML = cardsHtmlArray.join('');
    }
  }, (err) => {
    console.error('[catalog] onSnapshot query error:', err);
    if (err.message && (err.message.includes('indexes') || err.message.includes('index') || err.code === 'failed-precondition')) {
      console.warn('[catalog] Composite index needed. Follow the link printed above.');
      console.warn('[catalog] Activating client-side fallback filter so UI works seamlessly...');
      startFallbackCatalogListener();
      return;
    }
    showEmptyState(err.message);
  });
}

function parseDocDateMs(val) {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  return new Date(val).getTime() || 0;
}

function startFallbackCatalogListener() {
  if (unsubscribeCatalog) {
    unsubscribeCatalog();
    unsubscribeCatalog = null;
  }
  isFallbackMode = true;
  fallbackLimit = PAGE_SIZE;

  // Listen to all games without combining conflicting where/orderBy
  const colRef = collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter);
  unsubscribeCatalog = onSnapshot(colRef, async (snapshot) => {
    fallbackAllDocs = snapshot.docs;
    await renderFallbackCatalog();
  }, (fallbackErr) => {
    console.error('[catalog] Fallback listener error:', fallbackErr);
    showEmptyState(fallbackErr.message);
  });
}

async function renderFallbackCatalog() {
  displayedGameIds.clear();
  let docs = [...fallbackAllDocs];

  // 1. Text Search (substring matching)
  const term = currentSearch.trim().toLowerCase();
  if (term) {
    docs = docs.filter(d => {
      const data = d.data();
      const t = (data.titleLower || data.title || '').toLowerCase();
      return t.includes(term);
    });
  }

  // 2. Platform filter
  if (currentPlatform) {
    docs = docs.filter(d => {
      const data = d.data();
      return Array.isArray(data.platforms) && data.platforms.includes(currentPlatform);
    });
  }

  // 3. Genre filter
  if (currentGenre) {
    docs = docs.filter(d => {
      const data = d.data();
      return Array.isArray(data.genres) && data.genres.includes(currentGenre);
    });
  }

  // 4. Sorting
  docs.sort((a, b) => {
    const da = a.data();
    const db = b.data();
    switch (currentSort) {
      case 'price-asc':
        return (Number(da.price) || 0) - (Number(db.price) || 0);
      case 'price-desc':
        return (Number(db.price) || 0) - (Number(da.price) || 0);
      case 'date-desc':
        return parseDocDateMs(db.releaseDate) - parseDocDateMs(da.releaseDate);
      case 'rating':
      default:
        return (Number(db.avgRating) || 0) - (Number(da.avgRating) || 0);
    }
  });

  fallbackFilteredDocs = docs;

  if (docs.length === 0) {
    if (gamesGridEl) gamesGridEl.innerHTML = '';
    showEmptyState();
    updateCatalogCount(0);
    toggleShowMore(false);
    return;
  }

  hideEmptyState();
  updateCatalogCount(docs.length);

  const visibleDocs = docs.slice(0, fallbackLimit);
  hasMore = docs.length > fallbackLimit;
  toggleShowMore(hasMore);

  const cardsHtmlArray = await Promise.all(visibleDocs.map(async (docSnap) => {
    displayedGameIds.add(docSnap.id);
    return createGameCardHtml(docSnap.data());
  }));

  if (gamesGridEl) {
    gamesGridEl.innerHTML = cardsHtmlArray.join('');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Cursor Pagination ("Показать еще")
// ─────────────────────────────────────────────────────────────────────────────
async function loadMoreGames() {
  if (isLoadingMore || !hasMore) return;

  if (isFallbackMode) {
    isLoadingMore = true;
    if (btnShowMore) {
      btnShowMore.disabled = true;
      btnShowMore.textContent = 'Загрузка...';
    }

    try {
      const nextLimit = fallbackLimit + PAGE_SIZE;
      const nextDocs = fallbackFilteredDocs.slice(fallbackLimit, nextLimit);
      fallbackLimit = nextLimit;
      hasMore = fallbackFilteredDocs.length > fallbackLimit;
      toggleShowMore(hasMore);

      const newCards = [];
      for (const docSnap of nextDocs) {
        if (!displayedGameIds.has(docSnap.id)) {
          displayedGameIds.add(docSnap.id);
          const cardHtml = await createGameCardHtml(docSnap.data());
          newCards.push(cardHtml);
        }
      }

      if (gamesGridEl && newCards.length > 0) {
        gamesGridEl.insertAdjacentHTML('beforeend', newCards.join(''));
      }
      updateCatalogCount(displayedGameIds.size);
    } catch (err) {
      console.error('[catalog] Fallback loadMore error:', err);
    } finally {
      isLoadingMore = false;
      if (btnShowMore) {
        btnShowMore.disabled = false;
        btnShowMore.textContent = 'Показать еще';
      }
    }
    return;
  }

  if (!lastVisibleDoc) return;

  isLoadingMore = true;
  if (btnShowMore) {
    btnShowMore.disabled = true;
    btnShowMore.textContent = 'Загрузка...';
  }

  try {
    const q = buildBaseQuery(PAGE_SIZE, lastVisibleDoc);
    const snapshot = await getDocs(q);

    let docs = snapshot.docs;
    if (currentPlatform && currentGenre) {
      docs = docs.filter(d => {
        const data = d.data();
        return Array.isArray(data.genres) && data.genres.includes(currentGenre);
      });
    }

    if (docs.length === 0) {
      hasMore = false;
      toggleShowMore(false);
      return;
    }

    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    hasMore = snapshot.docs.length === PAGE_SIZE;
    toggleShowMore(hasMore);

    const newCards = [];
    for (const docSnap of docs) {
      if (!displayedGameIds.has(docSnap.id)) {
        displayedGameIds.add(docSnap.id);
        const cardHtml = await createGameCardHtml(docSnap.data());
        newCards.push(cardHtml);
      }
    }

    if (gamesGridEl && newCards.length > 0) {
      gamesGridEl.insertAdjacentHTML('beforeend', newCards.join(''));
    }

    updateCatalogCount(displayedGameIds.size);

  } catch (err) {
    console.error('[catalog] loadMore error:', err);
    if (err.message && (err.message.includes('indexes') || err.message.includes('index') || err.code === 'failed-precondition')) {
      console.warn('[catalog] Switching loadMore to fallback mode...');
      startFallbackCatalogListener();
    }
  } finally {
    isLoadingMore = false;
    if (btnShowMore) {
      btnShowMore.disabled = false;
      btnShowMore.textContent = 'Показать еще';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Filter & UI Helpers
// ─────────────────────────────────────────────────────────────────────────────
function renderGenrePills() {
  if (!genrePillsContainer) return;

  const allGenres = ['Все жанры', ...GENRES];
  genrePillsContainer.innerHTML = allGenres.map((g) => {
    const value = g === 'Все жанры' ? '' : g;
    const isActive = currentGenre === value ? 'active' : '';
    return `<button type="button" class="genre-pill ${isActive}" data-genre="${value}">${escapeHtml(g)}</button>`;
  }).join('');

  genrePillsContainer.querySelectorAll('.genre-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-genre');
      if (currentGenre === selected) return;
      currentGenre = selected;
      genrePillsContainer.querySelectorAll('.genre-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initCatalogListener();
    });
  });
}

function updateActiveFiltersUI() {
  if (!activeFiltersBar) return;

  const chips = [];
  if (currentPlatform) chips.push(`Платформа: ${currentPlatform}`);
  if (currentGenre) chips.push(`Жанр: ${currentGenre}`);
  if (currentSearch) chips.push(`Поиск: "${currentSearch}"`);

  if (chips.length > 0) {
    activeFiltersBar.innerHTML = `
      <span>Активные фильтры:</span>
      ${chips.map(c => `<span class="filter-chip">${escapeHtml(c)}</span>`).join('')}
      <button type="button" class="btn-reset-filters" id="btn-inline-reset">Сбросить</button>
    `;
    activeFiltersBar.style.display = 'flex';
    document.getElementById('btn-inline-reset')?.addEventListener('click', resetAllFilters);
  } else {
    activeFiltersBar.style.display = 'none';
  }
}

function showEmptyState(customMsg = null) {
  if (!emptyStateEl) return;

  if (customMsg) {
    if (emptyMessageEl) emptyMessageEl.textContent = customMsg;
  } else {
    // Tailored message based on what is active
    let advice = 'По выбранным критериям ничего не найдено.';
    if (currentPlatform && currentGenre) {
      advice = `В жанре «${currentGenre}» на платформе «${currentPlatform}» пока нет игр. Попробуйте сбросить один из фильтров.`;
    } else if (currentPlatform) {
      advice = `Для платформы «${currentPlatform}» пока нет доступных игр. Попробуйте выбрать другую платформу.`;
    } else if (currentGenre) {
      advice = `В категории «${currentGenre}» игр не найдено. Попробуйте выбрать другой жанр.`;
    } else if (currentSearch) {
      advice = `По запросу «${currentSearch}» совпадений не найдено. Проверьте правильность написания или используйте часть названия.`;
    }
    if (emptyMessageEl) emptyMessageEl.textContent = advice;
  }

  emptyStateEl.style.display = 'block';
}

function hideEmptyState() {
  if (emptyStateEl) emptyStateEl.style.display = 'none';
}

function toggleShowMore(show) {
  if (btnShowMore) {
    btnShowMore.style.display = show ? 'inline-block' : 'none';
  }
}

function updateCatalogCount(count) {
  if (catalogCountEl) {
    catalogCountEl.textContent = `${count} ${pluralize(count, 'игра', 'игры', 'игр')}`;
  }
}

function resetAllFilters() {
  currentPlatform = '';
  currentGenre = '';
  currentSearch = '';

  // Reset header pills
  document.querySelectorAll('.platform-pill').forEach(p => p.classList.remove('active'));

  // Reset genre pills
  document.querySelectorAll('.genre-pill').forEach((p, idx) => {
    if (idx === 0) p.classList.add('active');
    else p.classList.remove('active');
  });

  // Reset search input
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) searchInput.value = '';

  // Clean URL query
  const newUrl = new URL(window.location.href);
  newUrl.search = '';
  window.history.pushState({}, '', newUrl);

  initCatalogListener();
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Event Wiring & Initialisation
// ─────────────────────────────────────────────────────────────────────────────
function initCatalog() {
  // Read query params from URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('platform')) {
    currentPlatform = urlParams.get('platform');
  }
  if (urlParams.has('genre')) {
    currentGenre = urlParams.get('genre');
  }
  if (urlParams.has('q')) {
    currentSearch = urlParams.get('q');
  }

  // Render on-page genre selector
  renderGenrePills();

  // Listen for platform filter events dispatched from header.js
  window.addEventListener('filter:platform', (e) => {
    currentPlatform = e.detail?.platform || '';
    initCatalogListener();
  });

  // Sort dropdown change handler
  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    initCatalogListener();
  });

  // Search input with debounce (~300ms)
  const headerSearchInput = document.getElementById('header-search-input');
  let debounceTimeout = null;

  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        initCatalogListener();
      }, 300);
    });

    const headerSearchForm = document.getElementById('header-search-form');
    headerSearchForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(debounceTimeout);
      currentSearch = headerSearchInput.value.trim();
      initCatalogListener();
    });
  }

  // "Показать еще" pagination button
  btnShowMore?.addEventListener('click', loadMoreGames);

  // Reset filters button
  btnResetFilters?.addEventListener('click', resetAllFilters);

  // Load featured poster & initial catalog snapshot
  loadFeaturedPoster();
  initCatalogListener();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pluralize(n, one, two, five) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCatalog);
} else {
  initCatalog();
}
