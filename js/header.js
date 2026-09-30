/**
 * header.js
 * Game Hub — Shared Header & Navigation Component
 *
 * Automatically mounts or updates the site header on any page.
 * Manages:
 * - Brand logo & link
 * - Platform filter pills (desktop)
 * - Search bar form & submission
 * - Mobile hamburger menu toggle
 * - Real-time Auth state (Login/Register link vs. Dashboard + Admin badge + Logout)
 */

import { subscribeToAuth, logout } from './auth.js';
import { subscribeToUserCartCount } from './cart-helper.js';

let unsubscribeCart = null;

/**
 * Platform definitions for the header navigation.
 */
export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo'];

/**
 * Generates the inner HTML template for the site header.
 * @param {string} [activePlatform] - Optional active platform filter.
 * @returns {string} HTML string
 */
export function getHeaderTemplate(activePlatform = '') {
  const platformPillsHtml = PLATFORMS.map((platform) => {
    const isActive = activePlatform.toLowerCase() === platform.toLowerCase() ? 'active' : '';
    return `<button type="button" class="platform-pill ${isActive}" data-platform="${platform}">${platform}</button>`;
  }).join('');

  return `
    <div class="header-inner">
      <!-- Left: Logo & Wordmark -->
      <div class="header-left">
        <a href="index.html" class="brand-logo" aria-label="Game Hub Главная">
          <span class="brand-mark">GH</span>
          <span class="brand-text">Game Hub</span>
        </a>
      </div>

      <!-- Center: Platform Filter Pills (Desktop) -->
      <nav class="header-nav" aria-label="Фильтры по платформам">
        <div class="platform-pills">
          ${platformPillsHtml}
        </div>
      </nav>

      <!-- Search Bar -->
      <div class="header-search">
        <form class="search-form" id="header-search-form" action="index.html" method="GET">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            name="q"
            id="header-search-input"
            class="search-input"
            placeholder="Поиск игр..."
            autocomplete="off"
            aria-label="Поиск по каталогу игр"
          />
        </form>
      </div>

      <!-- Right: Auth State & Cart -->
      <div class="header-right">
        <!-- Cart Icon -->
        <a href="cart.html" class="header-link cart-link" aria-label="Корзина покупок" title="Корзина">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span class="cart-count" id="header-cart-count" style="display: none;">0</span>
        </a>

        <!-- Desktop Auth Container -->
        <div class="header-auth header-auth-desktop" id="header-auth-container">
          <!-- Populated dynamically by renderAuthState() -->
          <a href="login.html" class="header-link" id="header-login-link">
            <span>Вход / Регистрация</span>
          </a>
        </div>

        <!-- Mobile Hamburger Toggle -->
        <button type="button" class="hamburger-btn" id="header-hamburger-btn" aria-label="Меню" aria-expanded="false">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Slide-down Menu -->
    <div class="mobile-menu" id="header-mobile-menu">
      <div class="mobile-platform-pills">
        ${platformPillsHtml}
      </div>
      <div class="mobile-user-links" id="header-mobile-auth-container">
        <!-- Populated dynamically by renderAuthState() -->
        <a href="login.html" class="header-link">Вход / Регистрация</a>
      </div>
    </div>
  `;
}

/**
 * Updates the auth section in both desktop and mobile header containers.
 * @param {Object} authState - { user, profile }
 */
export function renderAuthState({ user, profile }) {
  const desktopContainer = document.getElementById('header-auth-container');
  const mobileContainer = document.getElementById('header-mobile-auth-container');

  if (!desktopContainer) return;

  if (user && profile) {
    const displayName = profile.displayName || user.email?.split('@')[0] || 'Пользователь';
    const initial = displayName.charAt(0).toUpperCase();
    const isAdmin = profile.role === 'admin';

    const avatarHtml = profile.photoURL
      ? `<img src="${profile.photoURL}" alt="${displayName}" class="user-avatar" />`
      : `<span class="user-avatar">${initial}</span>`;

    const adminBadgeHtml = isAdmin
      ? `<a href="admin.html" class="admin-pill" title="Панель администратора">Админ</a>`
      : '';

    // Desktop auth markup
    desktopContainer.innerHTML = `
      <a href="dashboard.html" class="user-badge" title="Личный кабинет">
        ${avatarHtml}
        <span class="user-name">${escapeHtml(displayName)}</span>
      </a>
      ${adminBadgeHtml}
      <button type="button" class="btn-header-logout" id="btn-header-logout" title="Выйти из аккаунта">
        Выйти
      </button>
    `;

    // Mobile auth markup
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <a href="dashboard.html" class="header-link">
          ${avatarHtml}
          <span>Кабинет: ${escapeHtml(displayName)}</span>
        </a>
        ${isAdmin ? `<a href="admin.html" class="header-link"><span class="admin-pill">Панель администратора</span></a>` : ''}
        <button type="button" class="btn-header-logout" id="btn-mobile-logout" style="width: 100%; text-align: left; padding: 8px 0; border: none;">
          Выйти из аккаунта
        </button>
      `;
    }

    // Attach logout handlers
    const logoutBtn = document.getElementById('btn-header-logout');
    const mobileLogoutBtn = document.getElementById('btn-mobile-logout');

    const handleLogout = async () => {
      try {
        await logout();
        window.location.reload();
      } catch (err) {
        console.error('[header] Logout error:', err);
      }
    };

    logoutBtn?.addEventListener('click', handleLogout);
    mobileLogoutBtn?.addEventListener('click', handleLogout);

  } else {
    // Logged-out state
    desktopContainer.innerHTML = `
      <a href="login.html" class="header-link" id="header-login-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Вход / Регистрация</span>
      </a>
    `;

    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <a href="login.html" class="header-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Вход / Регистрация</span>
        </a>
      `;
    }
  }
}

/**
 * Initialize header behavior and auth observer.
 * Call this function on any page having `<header id="main-header" class="site-header">`.
 */
export function initHeader() {
  const headerEl = document.getElementById('main-header');
  if (!headerEl) return;

  // Determine current active platform from URL search params if on index page
  const urlParams = new URLSearchParams(window.location.search);
  const activePlatform = urlParams.get('platform') || '';

  // Render template
  headerEl.innerHTML = getHeaderTemplate(activePlatform);

  // Platform pills click handler
  const pills = headerEl.querySelectorAll('.platform-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const platform = pill.getAttribute('data-platform');
      // If already on index.html, update URL or filter
      const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
      if (isHome) {
        const currentActive = pill.classList.contains('active');
        pills.forEach((p) => p.classList.remove('active'));
        if (!currentActive) {
          pill.classList.add('active');
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('platform', platform);
          window.history.pushState({}, '', newUrl);
          window.dispatchEvent(new CustomEvent('filter:platform', { detail: { platform } }));
        } else {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('platform');
          window.history.pushState({}, '', newUrl);
          window.dispatchEvent(new CustomEvent('filter:platform', { detail: { platform: null } }));
        }
      } else {
        window.location.href = `index.html?platform=${encodeURIComponent(platform)}`;
      }
    });
  });

  // Mobile hamburger toggle
  const hamburgerBtn = document.getElementById('header-hamburger-btn');
  const mobileMenu = document.getElementById('header-mobile-menu');

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Search input preserved from query
  const searchInput = document.getElementById('header-search-input');
  if (searchInput && urlParams.has('q')) {
    searchInput.value = urlParams.get('q');
  }

  // Subscribe to auth state changes to keep header perfectly in sync
  subscribeToAuth((authState) => {
    renderAuthState(authState);

    if (unsubscribeCart) {
      unsubscribeCart();
      unsubscribeCart = null;
    }

    if (authState.user) {
      unsubscribeCart = subscribeToUserCartCount(authState.user.uid);
    } else {
      const badge = document.getElementById('header-cart-count');
      if (badge) badge.style.display = 'none';
    }
  });
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

// Auto-run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}
