/**
 * admin-page.js
 * Game Hub — Admin Control Panel Controller (admin.html)
 *
 * Implements:
 * - Route guard: immediately redirects non-admins to index.html without leaking data
 * - Real-time Game CRUD (live onSnapshot, add/edit/delete, Firebase Storage media uploads)
 * - User role management (toggle user <-> admin with self-demotion protection)
 * - Order status management (pending, completed, cancelled)
 * - Review moderation (admin delete with atomic transaction recalculating game avgRating & count)
 * - Platform metrics / stats overview (total games, users, orders, revenue)
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { auth, db, storage } from './firebase-config.js';
import {
  COLLECTIONS,
  GENRES,
  PLATFORMS,
  gamesConverter,
  usersConverter,
  ordersConverter,
  reviewsConverter,
} from './firestore-schema.js';
import { subscribeToAuth } from './auth.js';
import { deleteReviewTransaction } from './reviews-helper.js';
import { resolveMediaUrl } from './storage-helper.js';
import { seedSampleGames } from './seed.js';

let currentAdminUser = null;
let gamesUnsubscribe = null;
let allGamesCache = new Map();

// Top-level DOM Elements
const adminContent = document.getElementById('admin-content-container');
const tabButtons = document.querySelectorAll('.admin-tab-btn');
const tabPanels = document.querySelectorAll('.admin-panel');

// Stats DOM Elements
const statGames = document.getElementById('stat-games-count');
const statUsers = document.getElementById('stat-users-count');
const statOrders = document.getElementById('stat-orders-count');
const statRevenue = document.getElementById('stat-revenue-total');

// Games Table & Modal
const gamesTableBody = document.getElementById('games-table-body');
const btnAddGame = document.getElementById('btn-add-game');
const modalGameEditor = document.getElementById('modal-game-editor');
const btnCloseGameModal = document.getElementById('btn-close-game-modal');
const btnCancelGame = document.getElementById('btn-cancel-game');
const formGameEditor = document.getElementById('form-game-editor');
const gameModalTitle = document.getElementById('game-modal-title');
const gameEditorFeedback = document.getElementById('game-editor-feedback');

// Users Table
const usersTableBody = document.getElementById('users-table-body');

// Orders Table
const ordersTableBody = document.getElementById('orders-table-body');

// Reviews Table
const reviewsTableBody = document.getElementById('reviews-table-body');

// Seed button
const btnRunSeed = document.getElementById('btn-admin-run-seed');
const seedFeedback = document.getElementById('admin-seed-feedback');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROUTE GUARD (Client-side check; real check enforced by Firestore rules)
// ─────────────────────────────────────────────────────────────────────────────
subscribeToAuth(({ user, profile }) => {
  if (!user || !profile || profile.role !== 'admin') {
    // Non-admin or logged-out visitor: redirect silently to index.html
    window.location.replace('index.html');
    return;
  }

  currentAdminUser = user;

  // Reveal admin interface
  if (adminContent) {
    adminContent.style.display = 'block';
  }

  initAdminDashboard();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABS SWITCHING
// ─────────────────────────────────────────────────────────────────────────────
function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPanelId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Refresh data on tab activation
      if (targetPanelId === 'panel-users') loadUsers();
      if (targetPanelId === 'panel-orders') loadOrders();
      if (targetPanelId === 'panel-reviews') loadReviews();
      if (targetPanelId === 'panel-overview') loadStats();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATS OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const [gamesSnap, usersSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.GAMES)),
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.ORDERS)),
    ]);

    if (statGames) statGames.textContent = String(gamesSnap.size);
    if (statUsers) statUsers.textContent = String(usersSnap.size);
    if (statOrders) statOrders.textContent = String(ordersSnap.size);

    let revenue = 0;
    ordersSnap.forEach((d) => {
      const o = d.data();
      if (o.status === 'completed') {
        revenue += Number(o.total) || 0;
      }
    });

    if (statRevenue) statRevenue.textContent = `${revenue.toLocaleString('ru-RU')} ₸`;

  } catch (err) {
    console.warn('[admin] Error loading stats:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GAME CRUD (Live onSnapshot)
// ─────────────────────────────────────────────────────────────────────────────
function initGamesListener() {
  if (gamesUnsubscribe) gamesUnsubscribe();

  const q = query(
    collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter),
    orderBy('createdAt', 'desc')
  );

  gamesUnsubscribe = onSnapshot(q, async (snapshot) => {
    allGamesCache.clear();
    const games = [];
    snapshot.forEach((d) => {
      const g = d.data();
      allGamesCache.set(g.id, g);
      games.push(g);
    });

    renderGamesTable(games);
    if (statGames) statGames.textContent = String(games.length);
  }, (err) => {
    console.error('[admin] games onSnapshot error:', err);
  });
}

async function renderGamesTable(games) {
  if (!gamesTableBody) return;

  if (games.length === 0) {
    gamesTableBody.innerHTML = `<tr><td colspan="7" class="text-secondary" style="text-align: center; padding: var(--space-8);">Игр пока нет в базе данных. Добавьте первую игру!</td></tr>`;
    return;
  }

  const rows = await Promise.all(games.map(async (g) => {
    const coverUrl = await resolveMediaUrl(g.coverImage, g.title);
    const platforms = (g.platforms || []).join(', ') || '—';
    const priceStr = g.price ? `${Number(g.price).toLocaleString('ru-RU')} ₸` : '0 ₸';
    const ratingStr = g.avgRating > 0 ? `★ ${g.avgRating.toFixed(1)} (${g.reviewCount})` : '—';
    const featuredBadge = g.featured
      ? `<span class="hero-featured-tag" style="font-size: 10px;">Да</span>`
      : `<span class="text-secondary">Нет</span>`;

    return `
      <tr data-game-id="${escapeHtml(g.id)}">
        <td>
          <img src="${coverUrl}" alt="${escapeHtml(g.title)}" class="table-thumb" />
        </td>
        <td>
          <a href="game.html?id=${encodeURIComponent(g.id)}" target="_blank" style="font-weight: 600;">
            ${escapeHtml(g.title)}
          </a>
          <div class="text-xs text-secondary">${escapeHtml((g.genres || []).join(' · '))}</div>
        </td>
        <td>${escapeHtml(platforms)}</td>
        <td><strong>${priceStr}</strong></td>
        <td>${ratingStr}</td>
        <td>${featuredBadge}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-action-sm btn-edit-game" data-game-id="${escapeHtml(g.id)}">
              Изменить
            </button>
            <button type="button" class="btn-action-sm btn-action-delete btn-delete-game" data-game-id="${escapeHtml(g.id)}">
              Удалить
            </button>
          </div>
        </td>
      </tr>
    `;
  }));

  gamesTableBody.innerHTML = rows.join('');
  attachGameTableActions();
}

function attachGameTableActions() {
  // Edit Game
  gamesTableBody.querySelectorAll('.btn-edit-game').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gameId = btn.getAttribute('data-game-id');
      const game = allGamesCache.get(gameId);
      if (game) openGameEditor(game);
    });
  });

  // Delete Game
  gamesTableBody.querySelectorAll('.btn-delete-game').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const gameId = btn.getAttribute('data-game-id');
      const game = allGamesCache.get(gameId);
      const title = game?.title || 'эту игру';

      if (!confirm(`Вы действительно хотите удалить игру «${title}»?`)) return;

      btn.disabled = true;
      try {
        await deleteDoc(doc(db, COLLECTIONS.GAMES, gameId));
      } catch (err) {
        console.error('[admin] Delete game error:', err);
        alert('Ошибка при удалении игры: ' + (err.message || 'Проверьте права доступа'));
        btn.disabled = false;
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Modal Editor
// ─────────────────────────────────────────────────────────────────────────────
function renderCheckboxes() {
  const genreWrap = document.getElementById('game-genres-checkboxes');
  const platformWrap = document.getElementById('game-platforms-checkboxes');

  if (genreWrap) {
    genreWrap.innerHTML = GENRES.map(g => `
      <label class="checkbox-label">
        <input type="checkbox" name="genres" value="${g}" />
        <span>${g}</span>
      </label>
    `).join('');
  }

  if (platformWrap) {
    platformWrap.innerHTML = PLATFORMS.map(p => `
      <label class="checkbox-label">
        <input type="checkbox" name="platforms" value="${p}" />
        <span>${p}</span>
      </label>
    `).join('');
  }
}

function openGameEditor(game = null) {
  if (!modalGameEditor) return;

  renderCheckboxes();
  formGameEditor.reset();
  if (gameEditorFeedback) gameEditorFeedback.className = 'feedback-banner';

  const editingIdInput = document.getElementById('editing-game-id');
  editingIdInput.value = game ? game.id : '';

  if (game) {
    if (gameModalTitle) gameModalTitle.textContent = `Редактирование: ${game.title}`;

    document.getElementById('field-title').value = game.title || '';
    document.getElementById('field-description').value = game.description || '';
    document.getElementById('field-developer').value = game.developer || '';
    document.getElementById('field-publisher').value = game.publisher || '';
    document.getElementById('field-price').value = game.price || 0;
    document.getElementById('field-featured').checked = Boolean(game.featured);

    if (game.releaseDate) {
      try {
        const d = game.releaseDate.toDate ? game.releaseDate.toDate() : new Date(game.releaseDate);
        document.getElementById('field-release-date').value = d.toISOString().split('T')[0];
      } catch (e) {}
    }

    // Cover and video URLs
    document.getElementById('field-cover-url').value = game.coverImage || '';
    document.getElementById('field-video-url').value = game.videoURL || '';

    // Genres
    const genres = game.genres || [];
    document.querySelectorAll('input[name="genres"]').forEach((cb) => {
      cb.checked = genres.includes(cb.value);
    });

    // Platforms
    const platforms = game.platforms || [];
    document.querySelectorAll('input[name="platforms"]').forEach((cb) => {
      cb.checked = platforms.includes(cb.value);
    });

    // Hardware Requirements
    const min = game.hardwareRequirements?.min || {};
    const rec = game.hardwareRequirements?.rec || {};

    document.getElementById('field-req-min-cpu').value = min.cpu || '';
    document.getElementById('field-req-min-gpu').value = min.gpu || '';
    document.getElementById('field-req-min-ram').value = min.ram || '';
    document.getElementById('field-req-min-storage').value = min.storage || '';

    document.getElementById('field-req-rec-cpu').value = rec.cpu || '';
    document.getElementById('field-req-rec-gpu').value = rec.gpu || '';
    document.getElementById('field-req-rec-ram').value = rec.ram || '';
    document.getElementById('field-req-rec-storage').value = rec.storage || '';

  } else {
    if (gameModalTitle) gameModalTitle.textContent = 'Добавить новую игру';
    document.getElementById('field-release-date').value = new Date().toISOString().split('T')[0];
  }

  modalGameEditor.classList.add('open');
}

function closeGameEditor() {
  if (modalGameEditor) modalGameEditor.classList.remove('open');
}

btnAddGame?.addEventListener('click', () => openGameEditor(null));
btnCloseGameModal?.addEventListener('click', closeGameEditor);
btnCancelGame?.addEventListener('click', closeGameEditor);

// Helper to upload file to Firebase Storage
async function uploadGameMedia(file, gameFolder, subfolder = 'screenshots') {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `games/${gameFolder}/${subfolder}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// Game Form Submit Handler
formGameEditor?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-save-game');

  const gameId = document.getElementById('editing-game-id').value;
  const isEditing = Boolean(gameId);

  const title = document.getElementById('field-title').value.trim();
  const description = document.getElementById('field-description').value.trim();
  const developer = document.getElementById('field-developer').value.trim();
  const publisher = document.getElementById('field-publisher').value.trim();
  const price = Number(document.getElementById('field-price').value) || 0;
  const featured = document.getElementById('field-featured').checked;
  const releaseDateStr = document.getElementById('field-release-date').value;

  if (!title) {
    showGameFeedback('Название игры обязательно.', 'error');
    return;
  }

  // Selected genres & platforms
  const genres = Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(cb => cb.value);
  const platforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value);

  if (platforms.length === 0) {
    showGameFeedback('Выберите хотя бы одну платформу.', 'error');
    return;
  }

  // Hardware specs
  const hardwareRequirements = {
    min: {
      cpu: document.getElementById('field-req-min-cpu').value.trim(),
      gpu: document.getElementById('field-req-min-gpu').value.trim(),
      ram: document.getElementById('field-req-min-ram').value.trim(),
      storage: document.getElementById('field-req-min-storage').value.trim(),
    },
    rec: {
      cpu: document.getElementById('field-req-rec-cpu').value.trim(),
      gpu: document.getElementById('field-req-rec-gpu').value.trim(),
      ram: document.getElementById('field-req-rec-ram').value.trim(),
      storage: document.getElementById('field-req-rec-storage').value.trim(),
    },
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Сохранение & загрузка файлов...';

  try {
    const tempId = gameId || ('game_' + Date.now());

    // 1. Handle Cover Upload / URL
    let coverImage = document.getElementById('field-cover-url').value.trim();
    const coverFileInput = document.getElementById('field-cover-file');
    if (coverFileInput && coverFileInput.files[0]) {
      coverImage = await uploadGameMedia(coverFileInput.files[0], tempId, 'covers');
    }

    // 2. Handle Screenshots Upload
    const existingGame = isEditing ? allGamesCache.get(gameId) : null;
    let screenshots = existingGame?.screenshots ? [...existingGame.screenshots] : [];
    const screenshotsFileInput = document.getElementById('field-screenshots-files');
    if (screenshotsFileInput && screenshotsFileInput.files.length > 0) {
      for (const file of screenshotsFileInput.files) {
        const url = await uploadGameMedia(file, tempId, 'screenshots');
        screenshots.push(url);
      }
    }

    // 3. Handle Video Upload / URL
    let videoURL = document.getElementById('field-video-url').value.trim();
    const videoFileInput = document.getElementById('field-video-file');
    if (videoFileInput && videoFileInput.files[0]) {
      videoURL = await uploadGameMedia(videoFileInput.files[0], tempId, 'videos');
    }

    // Parse releaseDate
    const releaseTimestamp = releaseDateStr
      ? Timestamp.fromDate(new Date(releaseDateStr))
      : Timestamp.now();

    const gamePayload = {
      title,
      titleLower: title.toLowerCase(),
      description,
      developer,
      publisher,
      price,
      featured,
      coverImage,
      genres,
      platforms,
      releaseDate: releaseTimestamp,
      hardwareRequirements,
      screenshots,
      videoURL,
    };

    if (isEditing) {
      const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
      await updateDoc(gameRef, gamePayload);
    } else {
      gamePayload.avgRating = 0;
      gamePayload.reviewCount = 0;
      gamePayload.createdAt = Timestamp.now();
      gamePayload.createdBy = currentAdminUser.uid;

      await addDoc(collection(db, COLLECTIONS.GAMES), gamePayload);
    }

    closeGameEditor();
    loadStats();

  } catch (err) {
    console.error('[admin] Save game error:', err);
    showGameFeedback('Ошибка сохранения: ' + (err.message || 'Проверьте соединение'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Сохранить игру';
  }
});

function showGameFeedback(msg, type) {
  if (!gameEditorFeedback) return;
  gameEditorFeedback.textContent = msg;
  gameEditorFeedback.className = `feedback-banner show ${type}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. USER MANAGEMENT (Role toggle with self-demotion protection)
// ─────────────────────────────────────────────────────────────────────────────
async function loadUsers() {
  if (!usersTableBody) return;

  usersTableBody.innerHTML = `<tr><td colspan="5" class="text-secondary">Загрузка пользователей...</td></tr>`;

  try {
    const q = query(
      collection(db, COLLECTIONS.USERS).withConverter(usersConverter),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    const users = [];
    snap.forEach(d => users.push(d.data()));

    if (users.length === 0) {
      usersTableBody.innerHTML = `<tr><td colspan="5" class="text-secondary">Пользователи не найдены.</td></tr>`;
      return;
    }

    usersTableBody.innerHTML = users.map((u) => {
      const isMe = u.uid === currentAdminUser.uid;
      const isAdmin = u.role === 'admin';
      const roleBadge = isAdmin
        ? `<span class="role-badge-admin">Администратор</span>`
        : `<span class="role-badge-user">Пользователь</span>`;

      // Prevent self-demotion
      const toggleBtn = isMe
        ? `<button type="button" class="btn-action-sm" disabled title="Нельзя изменить собственную роль">Текущий аккаунт</button>`
        : `<button type="button" class="btn-action-sm btn-toggle-role" data-uid="${escapeHtml(u.uid)}" data-role="${u.role}">
            ${isAdmin ? 'Снять права админа' : 'Сделать админом'}
          </button>`;

      return `
        <tr data-user-id="${escapeHtml(u.uid)}">
          <td>
            <strong>${escapeHtml(u.displayName || 'Без имени')}</strong>
          </td>
          <td>${escapeHtml(u.email || '—')}</td>
          <td>${roleBadge}</td>
          <td class="text-secondary text-xs">${formatDate(u.createdAt)}</td>
          <td>${toggleBtn}</td>
        </tr>
      `;
    }).join('');

    attachUserRoleHandlers();

  } catch (err) {
    console.error('[admin] loadUsers error:', err);
    usersTableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Ошибка загрузки пользователей: ${err.message}</td></tr>`;
  }
}

function attachUserRoleHandlers() {
  usersTableBody.querySelectorAll('.btn-toggle-role').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-uid');
      const currentRole = btn.getAttribute('data-role');
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      const promptMsg = newRole === 'admin'
        ? 'Предоставить этому пользователю права администратора?'
        : 'Снять права администратора с этого пользователя?';

      if (!confirm(promptMsg)) return;

      btn.disabled = true;
      btn.textContent = 'Обновление...';

      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
          role: newRole,
        });
        loadUsers();
      } catch (err) {
        console.error('[admin] Toggle role error:', err);
        alert('Не удалось изменить роль: ' + (err.message || 'Ошибка сети'));
        btn.disabled = false;
        btn.textContent = currentRole === 'admin' ? 'Снять права админа' : 'Сделать админом';
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORDER STATUS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
async function loadOrders() {
  if (!ordersTableBody) return;

  ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Загрузка заказов...</td></tr>`;

  let orders = [];

  try {
    const q = query(
      collection(db, COLLECTIONS.ORDERS).withConverter(ordersConverter),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    snap.forEach(d => orders.push(d.data()));
  } catch (indexErr) {
    console.warn('[admin] loadOrders orderBy index fallback:', indexErr.message);
    try {
      const qFallback = collection(db, COLLECTIONS.ORDERS).withConverter(ordersConverter);
      const snap2 = await getDocs(qFallback);
      snap2.forEach(d => orders.push(d.data()));
      orders.sort((a, b) => {
        const da = a.createdAt?.toDate?.() ?? (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt ?? 0));
        const db2 = b.createdAt?.toDate?.() ?? (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt ?? 0));
        return db2 - da;
      });
    } catch (fallbackErr) {
      console.error('[admin] loadOrders error:', fallbackErr);
      ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Ошибка загрузки заказов: ${fallbackErr.message}</td></tr>`;
      return;
    }
  }

  if (orders.length === 0) {
    ordersTableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Заказов пока нет.</td></tr>`;
    return;
  }

  ordersTableBody.innerHTML = orders.map((o) => {
    const itemsText = (o.items || []).map(i => `${i.gameTitle || 'Игра'} (${i.quantity || 1}x)`).join(', ');

    return `
      <tr data-order-id="${escapeHtml(o.id)}">
        <td><code class="text-xs">#${escapeHtml(o.id.slice(0, 8))}</code></td>
        <td class="text-xs text-secondary">${escapeHtml((o.userId || '').slice(0, 10))}...</td>
        <td>${formatDate(o.createdAt)}</td>
        <td><span class="text-xs">${escapeHtml(itemsText)}</span></td>
        <td><strong>${Number(o.total || 0).toLocaleString('ru-RU')} ₸</strong></td>
        <td>
          <select class="select-input select-order-status" data-order-id="${escapeHtml(o.id)}">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>В обработке</option>
            <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Выполнен</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');

  attachOrderStatusHandlers();
}

function attachOrderStatusHandlers() {
  ordersTableBody.querySelectorAll('.select-order-status').forEach((select) => {
    select.addEventListener('change', async () => {
      const orderId = select.getAttribute('data-order-id');
      const newStatus = select.value;

      select.disabled = true;

      try {
        await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
          status: newStatus,
        });
        loadStats(); // Update revenue total if order completed
      } catch (err) {
        console.error('[admin] Update order status error:', err);
        alert('Не удалось обновить статус заказа: ' + (err.message || 'Ошибка сети'));
      } finally {
        select.disabled = false;
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REVIEW MODERATION (Atomic deletion recalculating game rating)
// ─────────────────────────────────────────────────────────────────────────────
async function loadReviews() {
  if (!reviewsTableBody) return;

  reviewsTableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Загрузка отзывов...</td></tr>`;

  try {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS).withConverter(reviewsConverter),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    const reviews = [];
    snap.forEach(d => reviews.push(d.data()));

    if (reviews.length === 0) {
      reviewsTableBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Отзывов пока нет.</td></tr>`;
      return;
    }

    const rows = await Promise.all(reviews.map(async (r) => {
      const gameSnap = await getDoc(doc(db, COLLECTIONS.GAMES, r.gameId));
      const gameTitle = gameSnap.exists() ? (gameSnap.data().title || 'Игра') : r.gameId;
      const stars = '★'.repeat(r.rating || 5);

      return `
        <tr data-review-id="${escapeHtml(r.id)}" data-game-id="${escapeHtml(r.gameId)}">
          <td>
            <a href="game.html?id=${encodeURIComponent(r.gameId)}" target="_blank" style="font-weight: 600;">
              ${escapeHtml(gameTitle)}
            </a>
          </td>
          <td>${escapeHtml(r.userName || 'Пользователь')}</td>
          <td class="review-stars-col">${stars}</td>
          <td><span class="text-sm" style="max-width: 280px; display: inline-block;">${escapeHtml(r.text || '')}</span></td>
          <td class="text-xs text-secondary">${formatDate(r.createdAt)}</td>
          <td>
            <button type="button" class="btn-action-sm btn-action-delete btn-admin-delete-review" data-review-id="${escapeHtml(r.id)}" data-game-id="${escapeHtml(r.gameId)}">
              Удалить
            </button>
          </td>
        </tr>
      `;
    }));

    reviewsTableBody.innerHTML = rows.join('');
    attachReviewModerationHandlers();

  } catch (err) {
    console.error('[admin] loadReviews error:', err);
    reviewsTableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Ошибка загрузки отзывов: ${err.message}</td></tr>`;
  }
}

function attachReviewModerationHandlers() {
  reviewsTableBody.querySelectorAll('.btn-admin-delete-review').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reviewId = btn.getAttribute('data-review-id');
      const gameId = btn.getAttribute('data-game-id');

      if (!confirm('Удалить этот отзыв? Рейтинг игры будет автоматически пересчитан.')) return;

      btn.disabled = true;
      btn.textContent = 'Удаление...';

      try {
        await deleteReviewTransaction(reviewId, gameId);
        loadReviews();
      } catch (err) {
        console.error('[admin] Admin delete review error:', err);
        alert('Ошибка при удалении отзыва: ' + (err.message || 'Ошибка сети'));
        btn.disabled = false;
        btn.textContent = 'Удалить';
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. DATABASE SEEDER (Maintenance)
// ─────────────────────────────────────────────────────────────────────────────
btnRunSeed?.addEventListener('click', async () => {
  if (!confirm('Запустить скрипт наполнения базы данных образцами игр?')) return;

  btnRunSeed.disabled = true;
  btnRunSeed.textContent = 'Запись данных...';
  if (seedFeedback) {
    seedFeedback.textContent = 'Выполняется заполнение Firestore...';
    seedFeedback.style.color = 'var(--text-strong)';
  }

  try {
    await seedSampleGames();
    if (seedFeedback) {
      seedFeedback.textContent = '✓ База данных успешно заполнена!';
      seedFeedback.style.color = 'var(--link)';
    }
    loadStats();
  } catch (err) {
    console.error('[admin] Seed error:', err);
    if (seedFeedback) {
      seedFeedback.textContent = '✗ Ошибка: ' + (err.message || 'Проверьте права доступа');
      seedFeedback.style.color = 'var(--danger)';
    }
  } finally {
    btnRunSeed.disabled = false;
    btnRunSeed.textContent = 'Заполнить базу игр (Seed)';
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────
function initAdminDashboard() {
  initTabs();
  loadStats();
  initGamesListener();
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  try {
    let d;
    if (typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (timestamp && timestamp.seconds !== undefined) {
      d = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      d = timestamp;
    } else {
      d = new Date(timestamp);
    }
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (e) {
    return '—';
  }
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
