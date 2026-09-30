/**
 * dashboard-page.js
 * Game Hub — Personal Account Controller
 *
 * Manages:
 * - Route guarding: redirects unauthenticated visitors to login.html
 * - Loading and rendering user profile (avatar, name, email, role, bio, createdAt)
 * - Updating displayName and bio in Firestore and Auth profile
 * - Order History (Stage 4): queries and lists user's orders with items, total, status
 * - Review Management (Stage 4): lists user's reviews with edit modal and delete actions
 *   (reuses atomic transactions from reviews-helper.js)
 * - Sign out flow
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase-config.js';
import { COLLECTIONS, ordersConverter } from './firestore-schema.js';
import {
  subscribeToAuth,
  updateUserProfile,
  getUserProfile,
  logout,
} from './auth.js';
import {
  getUserAllReviews,
  saveReviewTransaction,
  deleteReviewTransaction,
} from './reviews-helper.js';

let currentUser = null;
let currentProfile = null;

// DOM elements
const formProfile = document.getElementById('form-profile');
const inputDisplayName = document.getElementById('profile-display-name');
const inputEmail = document.getElementById('profile-email');
const inputBio = document.getElementById('profile-bio');
const profileAvatar = document.getElementById('profile-avatar');
const profileRoleBadge = document.getElementById('profile-role-badge');
const profileCreatedDate = document.getElementById('profile-created-date');
const profileGreeting = document.getElementById('profile-greeting');
const bannerFeedback = document.getElementById('dashboard-banner');
const btnDashboardLogout = document.getElementById('btn-dashboard-logout');
const btnSaveProfile = document.getElementById('btn-save-profile');

// Stage 4 DOM elements
const ordersListContainer = document.getElementById('orders-list-container');
const reviewsListContainer = document.getElementById('dashboard-reviews-container');

// Edit Review Modal elements
const modalEditReview = document.getElementById('modal-edit-review');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
const btnCancelEditReview = document.getElementById('btn-cancel-edit-review');
const formDashboardEditReview = document.getElementById('form-dashboard-edit-review');
const editReviewIdInput = document.getElementById('edit-review-id');
const editReviewGameIdInput = document.getElementById('edit-review-game-id');
const editReviewTextInput = document.getElementById('edit-review-text');
const editStarPicker = document.getElementById('edit-star-picker');
const editReviewFeedback = document.getElementById('edit-review-feedback');

let editSelectedRating = 5;

function showFeedback(message, type = 'success') {
  if (!bannerFeedback) return;
  bannerFeedback.textContent = message;
  bannerFeedback.className = `feedback-banner show ${type}`;
  setTimeout(() => {
    bannerFeedback.className = 'feedback-banner';
  }, 4000);
}

function formatDate(timestamp) {
  if (!timestamp) return 'Неизвестно';
  try {
    let date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp && timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'Неизвестно';
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return 'Неизвестно';
  }
}

function renderProfileData(user, profile) {
  currentUser = user;
  currentProfile = profile;

  const displayName = profile.displayName || user.displayName || 'Пользователь';
  const email = profile.email || user.email || '';
  const bio = profile.bio || '';
  const role = profile.role || 'user';
  const initial = displayName.charAt(0).toUpperCase();

  if (inputDisplayName) inputDisplayName.value = displayName;
  if (inputEmail) inputEmail.value = email;
  if (inputBio) inputBio.value = bio;

  if (profileGreeting) {
    profileGreeting.textContent = displayName;
  }

  if (profileAvatar) {
    if (profile.photoURL || user.photoURL) {
      profileAvatar.outerHTML = `<img id="profile-avatar" src="${profile.photoURL || user.photoURL}" alt="${displayName}" class="avatar-large" />`;
    } else {
      profileAvatar.textContent = initial;
    }
  }

  if (profileRoleBadge) {
    profileRoleBadge.textContent = role === 'admin' ? 'Администратор' : 'Пользователь';
    if (role === 'admin') {
      profileRoleBadge.style.backgroundColor = 'var(--surface-3)';
      profileRoleBadge.style.borderColor = 'var(--link)';
      profileRoleBadge.style.color = 'var(--link)';
    } else {
      profileRoleBadge.style.backgroundColor = 'var(--surface-2)';
      profileRoleBadge.style.borderColor = 'var(--border)';
      profileRoleBadge.style.color = 'var(--text-secondary)';
    }
  }

  if (profileCreatedDate) {
    profileCreatedDate.textContent = formatDate(profile.createdAt || user.metadata?.creationTime);
  }

  const btnDashboardAdmin = document.getElementById('btn-dashboard-admin');
  if (btnDashboardAdmin) {
    btnDashboardAdmin.style.display = role === 'admin' ? 'inline-flex' : 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Order History Loader (Stage 4)
// ─────────────────────────────────────────────────────────────────────────────
async function loadOrderHistory(userId) {
  if (!ordersListContainer || !userId) return;

  ordersListContainer.innerHTML = `<div class="placeholder-section"><p class="text-secondary">Загрузка заказов...</p></div>`;

  let orders = [];

  try {
    // Try with orderBy first (requires composite index)
    const q = query(
      collection(db, COLLECTIONS.ORDERS).withConverter(ordersConverter),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(d => orders.push(d.data()));
  } catch (indexErr) {
    // Fallback: query without orderBy if index doesn't exist yet
    console.warn('[dashboard] Orders index not ready, falling back:', indexErr.message);
    try {
      const qFallback = query(
        collection(db, COLLECTIONS.ORDERS).withConverter(ordersConverter),
        where('userId', '==', userId)
      );
      const snap2 = await getDocs(qFallback);
      snap2.forEach(d => orders.push(d.data()));
      // Sort client-side
      orders.sort((a, b) => {
        const da = a.createdAt?.toDate?.() ?? (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt ?? 0));
        const db2 = b.createdAt?.toDate?.() ?? (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt ?? 0));
        return db2 - da;
      });
    } catch (fallbackErr) {
      console.error('[dashboard] Error loading orders (fallback):', fallbackErr);
    }
  }

  const isAdmin = currentProfile?.role === 'admin';
  const adminNoticeHtml = isAdmin ? `
    <div class="order-admin-notice">
      <span>👑 Режим администратора: все заказы магазина доступны в Панели управления.</span>
      <a href="admin.html#panel-orders" class="order-admin-link">Перейти к заказам &rarr;</a>
    </div>
  ` : '';

  if (orders.length === 0) {
    ordersListContainer.innerHTML = `
      ${adminNoticeHtml}
      <div class="placeholder-section">
        <p class="font-medium">Заказов пока нет</p>
        <p class="placeholder-text" style="margin-bottom: var(--space-4);">
          Вы пока не приобретали игры в Game Hub. Все ваши будущие покупки будут сохранены здесь.
        </p>
        <a href="index.html" class="btn btn-primary btn-action-sm">Перейти в каталог</a>
      </div>
    `;
    return;
  }

  const ordersCardsHtml = orders.map((order) => {
    let statusClass = 'order-status-pending';
    let statusText = 'В обработке';
    if (order.status === 'completed') {
      statusClass = 'order-status-completed';
      statusText = 'Выполнен';
    } else if (order.status === 'cancelled') {
      statusClass = 'order-status-cancelled';
      statusText = 'Отменен';
    }

    const itemsHtml = (order.items || []).map((item) => {
      const title = escapeHtml(item.gameTitle || item.title || 'Игра');
      const gameLink = item.gameId ? `<a href="game.html?id=${encodeURIComponent(item.gameId)}" class="order-item-link">${title}</a>` : `<span class="order-item-link">${title}</span>`;
      const thumbHtml = item.gameCover ? `<img src="${escapeHtml(item.gameCover)}" alt="${title}" class="order-item-thumb" />` : '';

      return `
        <div class="order-item-row">
          <div class="order-item-left">
            ${thumbHtml}
            <div>
              ${gameLink}
              <div class="text-xs text-secondary">${Number(item.price || 0).toLocaleString('ru-RU')} ₸ × ${item.quantity || 1} шт.</div>
            </div>
          </div>
          <span class="font-medium">${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('ru-RU')} ₸</span>
        </div>
      `;
    }).join('');

    const orderId = order.id ? order.id.slice(0, 10) : '—';

    return `
      <article class="order-history-card">
        <div class="order-card-header">
          <div>
            <span class="text-xs text-secondary">Заказ </span>
            <span class="order-id-label">#${escapeHtml(orderId)}</span>
          </div>
          <span class="order-status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="text-xs text-secondary">
          Дата оформления: ${formatDate(order.createdAt)}
        </div>
        <div class="order-items-list">
          ${itemsHtml || '<span class="text-xs text-secondary">Товары не указаны</span>'}
        </div>
        <div class="order-card-footer">
          <span class="text-xs text-secondary">Итоговая сумма:</span>
          <span class="order-total-amount">${Number(order.total || 0).toLocaleString('ru-RU')} ₸</span>
        </div>
      </article>
    `;
  }).join('');

  ordersListContainer.innerHTML = adminNoticeHtml + ordersCardsHtml;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Reviews Management (Stage 4)
// ─────────────────────────────────────────────────────────────────────────────
// Cache for game titles by gameId
const gameTitleCache = new Map();

async function getGameTitle(gameId) {
  if (gameTitleCache.has(gameId)) return gameTitleCache.get(gameId);
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.GAMES, gameId));
    if (snap.exists()) {
      const title = snap.data().title || 'Игра';
      gameTitleCache.set(gameId, title);
      return title;
    }
  } catch (e) {
    console.warn('[dashboard] getGameTitle error:', e);
  }
  return 'Игра';
}

async function loadUserReviews(userId) {
  if (!reviewsListContainer || !userId) return;

  try {
    const reviews = await getUserAllReviews(userId);

    if (reviews.length === 0) {
      reviewsListContainer.innerHTML = `
        <div class="placeholder-section">
          <p class="font-medium">Вы еще не оставили ни одного отзыва</p>
          <p class="placeholder-text" style="margin-bottom: var(--space-4);">
            Оставляйте отзывы и делитесь оценками на страницах игр в каталоге.
          </p>
          <a href="index.html" class="btn btn-primary btn-action-sm">Перейти в каталог</a>
        </div>
      `;
      return;
    }

    const cardsHtml = await Promise.all(reviews.map(async (r) => {
      const gameTitle = await getGameTitle(r.gameId);
      const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));

      return `
        <div class="dashboard-review-card" data-review-id="${escapeHtml(r.id)}" data-game-id="${escapeHtml(r.gameId)}">
          <div class="dashboard-review-header">
            <a href="game.html?id=${encodeURIComponent(r.gameId)}" class="dashboard-review-game-title">
              ${escapeHtml(gameTitle)}
            </a>
            <span class="review-rating-stars" aria-label="Оценка ${r.rating} из 5">${stars}</span>
          </div>
          <p class="text-sm" style="line-height: var(--line-height-relaxed);">${escapeHtml(r.text || '')}</p>
          <div class="text-xs text-secondary">
            ${formatDate(r.createdAt)} ${r.updatedAt ? '(изменен)' : ''}
          </div>
          <div class="dashboard-review-actions">
            <button
              type="button"
              class="btn-action-sm btn-edit-review"
              data-review-id="${escapeHtml(r.id)}"
              data-game-id="${escapeHtml(r.gameId)}"
              data-rating="${r.rating}"
              data-text="${escapeHtml(r.text || '')}"
            >
              Редактировать
            </button>
            <button
              type="button"
              class="btn-action-sm btn-action-delete btn-delete-user-review"
              data-review-id="${escapeHtml(r.id)}"
              data-game-id="${escapeHtml(r.gameId)}"
            >
              Удалить
            </button>
          </div>
        </div>
      `;
    }));

    reviewsListContainer.innerHTML = cardsHtml.join('');
    attachReviewActionHandlers(userId);

  } catch (err) {
    console.error('[dashboard] Error loading user reviews:', err);
    reviewsListContainer.innerHTML = `
      <div class="placeholder-section">
        <p class="text-danger">Не удалось загрузить отзывы.</p>
      </div>
    `;
  }
}

function attachReviewActionHandlers(userId) {
  if (!reviewsListContainer) return;

  // Edit Review button
  reviewsListContainer.querySelectorAll('.btn-edit-review').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reviewId = btn.getAttribute('data-review-id');
      const gameId = btn.getAttribute('data-game-id');
      const rating = parseInt(btn.getAttribute('data-rating'), 10) || 5;
      const text = btn.getAttribute('data-text') || '';

      openEditReviewModal({ reviewId, gameId, rating, text });
    });
  });

  // Delete Review button (atomic transaction recalculating game stats)
  reviewsListContainer.querySelectorAll('.btn-delete-user-review').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reviewId = btn.getAttribute('data-review-id');
      const gameId = btn.getAttribute('data-game-id');

      if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

      btn.disabled = true;
      btn.textContent = 'Удаление...';

      try {
        await deleteReviewTransaction(reviewId, gameId);
        showFeedback('Отзыв успешно удален.', 'success');
        loadUserReviews(userId);
      } catch (err) {
        console.error('[dashboard] Delete review error:', err);
        alert('Не удалось удалить отзыв: ' + (err.message || 'Ошибка'));
        btn.disabled = false;
        btn.textContent = 'Удалить';
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Review Modal Logic (Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
function openEditReviewModal({ reviewId, gameId, rating, text }) {
  if (!modalEditReview) return;

  editReviewIdInput.value = reviewId;
  editReviewGameIdInput.value = gameId;
  editReviewTextInput.value = text;
  editSelectedRating = rating;

  if (editReviewFeedback) editReviewFeedback.className = 'feedback-banner';

  // Update star buttons
  editStarPicker?.querySelectorAll('.star-picker-btn').forEach((btn) => {
    const star = parseInt(btn.getAttribute('data-rating'), 10);
    btn.classList.toggle('selected', star <= editSelectedRating);
  });

  modalEditReview.classList.add('open');
}

function closeEditReviewModal() {
  if (modalEditReview) modalEditReview.classList.remove('open');
}

btnCloseEditModal?.addEventListener('click', closeEditReviewModal);
btnCancelEditReview?.addEventListener('click', closeEditReviewModal);

modalEditReview?.addEventListener('click', (e) => {
  if (e.target === modalEditReview) closeEditReviewModal();
});

editStarPicker?.querySelectorAll('.star-picker-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    editSelectedRating = parseInt(btn.getAttribute('data-rating'), 10) || 5;
    editStarPicker.querySelectorAll('.star-picker-btn').forEach((b) => {
      const star = parseInt(b.getAttribute('data-rating'), 10);
      b.classList.toggle('selected', star <= editSelectedRating);
    });
  });
});

formDashboardEditReview?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const reviewId = editReviewIdInput.value;
  const gameId = editReviewGameIdInput.value;
  const text = editReviewTextInput.value.trim();
  const btnSave = document.getElementById('btn-save-edit-review');

  if (!text) {
    if (editReviewFeedback) {
      editReviewFeedback.textContent = 'Пожалуйста, введите текст отзыва.';
      editReviewFeedback.className = 'feedback-banner show error';
    }
    return;
  }

  btnSave.disabled = true;
  btnSave.textContent = 'Сохранение...';

  try {
    const userName = currentProfile?.displayName || currentUser?.displayName || 'Пользователь';
    await saveReviewTransaction({
      gameId,
      userId: currentUser.uid,
      userName,
      rating: editSelectedRating,
      text,
      existingReviewId: reviewId,
    });

    closeEditReviewModal();
    showFeedback('Отзыв успешно обновлен!', 'success');
    loadUserReviews(currentUser.uid);

  } catch (err) {
    console.error('[dashboard] Update review error:', err);
    if (editReviewFeedback) {
      editReviewFeedback.textContent = 'Ошибка: ' + (err.message || 'Ошибка сети');
      editReviewFeedback.className = 'feedback-banner show error';
    }
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Сохранить';
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route Guard & Main Initialisation
// ─────────────────────────────────────────────────────────────────────────────
subscribeToAuth(async ({ user, profile }) => {
  if (!user) {
    window.location.replace('login.html?redirect=dashboard.html');
    return;
  }

  renderProfileData(user, profile);

  // Load orders and reviews
  loadOrderHistory(user.uid);
  loadUserReviews(user.uid);
});

// Profile Form Save Handler
formProfile?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const newDisplayName = inputDisplayName?.value.trim();
  const newBio = inputBio?.value.trim();

  if (!newDisplayName) {
    showFeedback('Имя пользователя не может быть пустым.', 'error');
    return;
  }

  if (btnSaveProfile) {
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = 'Сохранение...';
  }

  try {
    await updateUserProfile(currentUser.uid, {
      displayName: newDisplayName,
      bio: newBio,
    });

    const updated = await getUserProfile(currentUser.uid);
    if (updated) {
      currentProfile = updated;
      renderProfileData(currentUser, updated);
    }

    showFeedback('Изменения профиля успешно сохранены.', 'success');
  } catch (err) {
    console.error('[dashboard] Error updating profile:', err);
    showFeedback('Не удалось сохранить профиль: ' + (err.message || 'Ошибка сети'), 'error');
  } finally {
    if (btnSaveProfile) {
      btnSaveProfile.disabled = false;
      btnSaveProfile.textContent = 'Сохранить изменения';
    }
  }
});

// Sign out button
btnDashboardLogout?.addEventListener('click', async () => {
  try {
    await logout();
    window.location.replace('login.html');
  } catch (err) {
    console.error('[dashboard] Sign out error:', err);
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
