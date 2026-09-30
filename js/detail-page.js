/**
 * detail-page.js
 * Game Hub — Game Detail Page Controller (game.html)
 *
 * Implements:
 * - Reads gameId from URL query (?id=...)
 * - Fetches game document from Firestore
 * - Resolves cover image, screenshots, and video URL via Storage getDownloadURL()
 * - Renders full metadata, hardware requirements table (min and rec)
 * - Renders screenshots gallery with interactive preview
 * - Renders embedded video player (HTML5 video or fallback)
 * - "Add to Cart" button: redirects to login if logged out, creates/increments cart/{uid}_{gameId} doc if logged in
 * - "Related games": queries 3-4 other games sharing at least one genre, excluding current game
 * - Reviews section: read-only list of existing reviews with stars, text, reviewer name, and date
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db, auth } from './firebase-config.js';
import { COLLECTIONS, gamesConverter, reviewsConverter } from './firestore-schema.js';
import { resolveMediaUrl, resolveMediaList } from './storage-helper.js';
import { addToCart } from './cart-helper.js';
import { subscribeToAuth } from './auth.js';
import {
  saveReviewTransaction,
  deleteReviewTransaction,
  getUserReviewForGame,
} from './reviews-helper.js';

// Global state
let currentGame = null;
let currentGameId = null;

// DOM references
const detailContainer = document.getElementById('detail-container');
const errorContainer = document.getElementById('detail-error');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');

/**
 * Parses query params to get current gameId
 */
function getGameId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Renders stars HTML for numeric rating (1-5)
 */
function renderStars(rating = 5) {
  const full = Math.min(5, Math.max(1, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function formatDate(timestamp) {
  if (!timestamp) return 'Не указана';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return 'Не указана';
  }
}

/**
 * Loads related games sharing at least one genre, excluding current game.
 * @param {string[]} genres
 * @param {string} currentId
 */
async function loadRelatedGames(genres, currentId) {
  const relatedGrid = document.getElementById('related-games-grid');
  if (!relatedGrid || !genres || genres.length === 0) return;

  try {
    const primaryGenre = genres[0];
    const q = query(
      collection(db, COLLECTIONS.GAMES).withConverter(gamesConverter),
      where('genres', 'array-contains', primaryGenre),
      limit(5)
    );

    const snap = await getDocs(q);
    const related = [];

    snap.forEach((d) => {
      if (d.id !== currentId && related.length < 3) {
        related.push(d.data());
      }
    });

    if (related.length === 0) {
      document.getElementById('related-section')?.remove();
      return;
    }

    const cardsHtml = await Promise.all(related.map(async (g) => {
      const cover = await resolveMediaUrl(g.coverImage, g.title, (g.platforms || [])[0]);
      const platforms = (g.platforms || []).join(', ');
      const price = g.price ? `${g.price.toLocaleString('ru-RU')} ₸` : 'Бесплатно';

      return `
        <a href="game.html?id=${encodeURIComponent(g.id)}" class="game-card">
          <div class="card-media">
            <img src="${cover}" alt="${escapeHtml(g.title)}" class="card-img" loading="lazy" />
          </div>
          <div class="card-content">
            <div class="card-title-line">
              <h4 class="card-title">${escapeHtml(g.title)}</h4>
              <span class="card-platform-text">${escapeHtml(platforms)}</span>
            </div>
            <div class="card-footer">
              <span class="card-price">${price}</span>
            </div>
          </div>
        </a>
      `;
    }));

    relatedGrid.innerHTML = cardsHtml.join('');

  } catch (err) {
    console.warn('[detail-page] Error loading related games:', err);
    document.getElementById('related-section')?.remove();
  }
}

/**
 * Loads read-only reviews for this game.
 * @param {string} gameId
 */
/**
 * Loads reviews for this game and renders the review CRUD form for authenticated users.
 * @param {string} gameId
 */
async function loadReviews(gameId) {
  const reviewsContainer = document.getElementById('reviews-list-container');
  const formContainer = document.getElementById('review-form-container');
  if (!reviewsContainer) return;

  try {
    let reviews = [];
    try {
      const q = query(
        collection(db, COLLECTIONS.REVIEWS).withConverter(reviewsConverter),
        where('gameId', '==', gameId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(d => reviews.push(d.data()));
    } catch (indexErr) {
      console.warn('[detail-page] Reviews index fallback:', indexErr.message);
      try {
        const qFallback = query(
          collection(db, COLLECTIONS.REVIEWS).withConverter(reviewsConverter),
          where('gameId', '==', gameId)
        );
        const snapshot = await getDocs(qFallback);
        snapshot.forEach(d => reviews.push(d.data()));
        reviews.sort((a, b) => {
          const da = a.createdAt?.toDate?.() ?? (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt ?? 0));
          const db2 = b.createdAt?.toDate?.() ?? (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt ?? 0));
          return db2 - da;
        });
      } catch (fallbackErr) {
        console.error('[detail-page] Error loading reviews (fallback):', fallbackErr);
      }
    }

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div class="placeholder-section">
          <p class="font-medium">Отзывов пока нет</p>
          <p class="placeholder-text">Будьте первым, кто поделится своим мнением об этой игре!</p>
        </div>
      `;
    } else {
      reviewsContainer.innerHTML = reviews.map(r => `
        <article class="review-card">
          <div class="review-header">
            <span class="review-author">${escapeHtml(r.userName || 'Пользователь')}</span>
            <span class="review-rating-stars" aria-label="Оценка ${r.rating} из 5">${renderStars(r.rating)}</span>
          </div>
          <p class="review-text">${escapeHtml(r.text || '')}</p>
          <div class="review-date">${formatDate(r.createdAt)} ${r.updatedAt ? '(изменен)' : ''}</div>
        </article>
      `).join('');
    }

    // Now render review form or login prompt
    if (!formContainer) return;

    const user = auth.currentUser;
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      formContainer.innerHTML = `
        <div class="review-login-prompt">
          <p class="font-medium" style="margin-bottom: var(--space-2);">Хотите оставить отзыв?</p>
          <p class="text-secondary text-sm" style="margin-bottom: var(--space-4);">
            Только авторизованные пользователи могут оценивать игры и делиться впечатлениями.
          </p>
          <a href="login.html?redirect=${returnUrl}" class="btn btn-primary">
            Войти и написать отзыв
          </a>
        </div>
      `;
      return;
    }

    // User is logged in: check if they already have an existing review
    const existingReview = await getUserReviewForGame(gameId, user.uid);
    let selectedRating = existingReview ? Number(existingReview.rating) : 5;

    const formTitle = existingReview ? 'Редактировать ваш отзыв' : 'Оставить отзыв об игре';
    const submitBtnText = existingReview ? 'Обновить отзыв' : 'Опубликовать отзыв';
    const deleteBtnHtml = existingReview
      ? `<button type="button" class="btn btn-danger" id="btn-delete-review">Удалить отзыв</button>`
      : '';

    formContainer.innerHTML = `
      <div class="review-form-card">
        <div class="review-form-title">
          <span>${formTitle}</span>
          ${existingReview ? `<span class="text-xs text-secondary">Вы уже оценили эту игру</span>` : ''}
        </div>

        <form id="game-review-form">
          <div class="form-group">
            <label class="form-label">Ваша оценка (1-5)</label>
            <div class="star-rating-picker" id="star-picker" role="radiogroup" aria-label="Выбор оценки">
              ${[1, 2, 3, 4, 5].map(star => `
                <button
                  type="button"
                  class="star-picker-btn ${star <= selectedRating ? 'selected' : ''}"
                  data-rating="${star}"
                  aria-label="${star} звезд${star === 1 ? 'а' : (star < 5 ? 'ы' : '')}"
                >★</button>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label for="review-text-input" class="form-label">Текст отзыва</label>
            <textarea
              id="review-text-input"
              class="form-input form-textarea"
              placeholder="Расскажите о геймплее, сюжете, оптимизации и графике..."
              rows="4"
              required
            >${escapeHtml(existingReview ? existingReview.text : '')}</textarea>
          </div>

          <div id="review-feedback" class="feedback-banner" role="status"></div>

          <div class="flex items-center gap-4" style="margin-top: var(--space-4);">
            <button type="submit" class="btn btn-primary" id="btn-submit-review">
              ${submitBtnText}
            </button>
            ${deleteBtnHtml}
          </div>
        </form>
      </div>
    `;

    // Star picker click listeners
    const starButtons = formContainer.querySelectorAll('.star-picker-btn');
    starButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.getAttribute('data-rating'), 10) || 5;
        starButtons.forEach(b => {
          const r = parseInt(b.getAttribute('data-rating'), 10);
          b.classList.toggle('selected', r <= selectedRating);
        });
      });
    });

    // Form submit listener (create / edit in atomic transaction)
    const reviewForm = document.getElementById('game-review-form');
    const feedbackBanner = document.getElementById('review-feedback');
    const submitBtn = document.getElementById('btn-submit-review');

    reviewForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textVal = document.getElementById('review-text-input')?.value.trim();

      if (!textVal) {
        if (feedbackBanner) {
          feedbackBanner.textContent = 'Пожалуйста, напишите текст отзыва.';
          feedbackBanner.className = 'feedback-banner show error';
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Сохранение...';

      try {
        const userName = user.displayName || user.email?.split('@')[0] || 'Пользователь';
        const res = await saveReviewTransaction({
          gameId,
          userId: user.uid,
          userName,
          rating: selectedRating,
          text: textVal,
          existingReviewId: existingReview ? existingReview.id : null,
        });

        if (feedbackBanner) {
          feedbackBanner.textContent = existingReview
            ? '✓ Отзыв успешно обновлен!'
            : '✓ Отзыв успешно опубликован!';
          feedbackBanner.className = 'feedback-banner show success';
        }

        // Update rating indicator on the page
        updatePageRatingUI(res.newAvgRating, res.newReviewCount);

        // Reload reviews after short delay
        setTimeout(() => loadReviews(gameId), 600);

      } catch (err) {
        console.error('[detail-page] Save review error:', err);
        if (feedbackBanner) {
          feedbackBanner.textContent = 'Ошибка сохранения отзыва: ' + (err.message || 'Ошибка сети');
          feedbackBanner.className = 'feedback-banner show error';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnText;
      }
    });

    // Delete review listener
    const deleteBtn = document.getElementById('btn-delete-review');
    deleteBtn?.addEventListener('click', async () => {
      if (!existingReview) return;
      if (!confirm('Вы уверены, что хотите удалить свой отзыв?')) return;

      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Удаление...';

      try {
        const res = await deleteReviewTransaction(existingReview.id, gameId);
        updatePageRatingUI(res.newAvgRating, res.newReviewCount);
        loadReviews(gameId);
      } catch (err) {
        console.error('[detail-page] Delete review error:', err);
        alert('Не удалось удалить отзыв: ' + (err.message || 'Ошибка сети'));
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Удалить отзыв';
      }
    });

  } 
  catch (err) {
    console.warn('[detail-page] Error loading reviews:', err);
  }
}

/**
 * Updates the rating badges in the header and sidebar after a review transaction
 */
function updatePageRatingUI(avgRating, reviewCount) {
  const ratingPill = document.getElementById('detail-rating-pill');
  if (ratingPill) {
    ratingPill.textContent = avgRating > 0
      ? `★ ${avgRating.toFixed(1)} (${reviewCount} ${pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')})`
      : 'Пока нет оценок';
  }
}

/**
 * Main function: loads game data and renders full page.
 */
async function loadGameDetails() {
  currentGameId = getGameId();

  if (!currentGameId) {
    showErrorState('Идентификатор игры не указан в строке запроса.');
    return;
  }

  try {
    const gameRef = doc(db, COLLECTIONS.GAMES, currentGameId).withConverter(gamesConverter);
    const snap = await getDoc(gameRef);

    if (!snap.exists()) {
      showErrorState(`Игра с идентификатором «${currentGameId}» не найдена в каталоге.`);
      return;
    }

    currentGame = snap.data();
    renderPageContent(currentGame);

  } catch (err) {
    console.error('[detail-page] Error loading game:', err);
    showErrorState('Не удалось загрузить данные игры. Проверьте подключение к сети или базу данных.');
  }
}

/**
 * Renders the detail page markup.
 * @param {Object} game
 */
async function renderPageContent(game) {
  document.title = `${game.title} — Game Hub`;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = game.title;

  // Resolve cover media
  const coverUrl = await resolveMediaUrl(
    game.coverImage,
    game.title,
    (game.platforms || []).join(' · ')
  );

  // Resolve screenshots
  const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
  const resolvedScreenshots = await resolveMediaList(screenshots, game.title);

  // Resolve video URL
  let resolvedVideoUrl = '';
  if (game.videoURL) {
    resolvedVideoUrl = await resolveMediaUrl(game.videoURL, 'Trailer');
  }

  const platformPills = (game.platforms || [])
    .map(p => `<span class="meta-pill accent">${escapeHtml(p)}</span>`)
    .join('');

  const genrePills = (game.genres || [])
    .map(g => `<span class="meta-pill">${escapeHtml(g)}</span>`)
    .join('');

  const ratingStr = game.avgRating > 0
    ? `★ ${game.avgRating.toFixed(1)} (${game.reviewCount || 0} ${pluralize(game.reviewCount || 0, 'отзыв', 'отзыва', 'отзывов')})`
    : 'Пока нет оценок';

  const priceFormatted = game.price ? `${game.price.toLocaleString('ru-RU')} ₸` : 'Бесплатно';

  // Hardware requirements (min and rec)
  const reqMin = game.hardwareRequirements?.min || {};
  const reqRec = game.hardwareRequirements?.rec || {};

  // Screenshots gallery markup
  let galleryHtml = '';
  if (resolvedScreenshots.length > 0) {
    galleryHtml = `
      <section class="detail-section" aria-labelledby="gallery-heading">
        <h2 class="detail-section-title" id="gallery-heading">Скриншоты (${resolvedScreenshots.length})</h2>
        <div class="gallery-grid" id="gallery-grid">
          ${resolvedScreenshots.map((src, i) => `
            <div class="gallery-item" data-index="${i}">
              <img src="${src}" alt="Скриншот ${i + 1}" class="gallery-thumb" loading="lazy" />
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Video markup
  let videoHtml = '';
  if (resolvedVideoUrl && resolvedVideoUrl.trim() !== '') {
    videoHtml = `
      <section class="detail-section" aria-labelledby="video-heading">
        <h2 class="detail-section-title" id="video-heading">Трейлер / Геймплей</h2>
        <div class="video-wrap">
          <video src="${resolvedVideoUrl}" controls class="video-element" preload="metadata" poster="${coverUrl}">
            Ваш браузер не поддерживает воспроизведение встроенного видео.
          </video>
        </div>
      </section>
    `;
  }

  const detailHtml = `
    <!-- Top Heading -->
    <div class="detail-heading-block">
      <h1 class="detail-title">${escapeHtml(game.title)}</h1>
      <div class="detail-meta-pills">
        ${platformPills}
        ${genrePills}
        <span class="meta-pill" id="detail-rating-pill" style="font-weight: 700;">${escapeHtml(ratingStr)}</span>
      </div>
    </div>

    <!-- Main 2-Column Layout -->
    <div class="detail-layout">
      <!-- Left: Media, Description, Specs, Reviews -->
      <div class="detail-main">
        <!-- Main Cover / Hero Media -->
        <div class="detail-hero-media" id="detail-main-media">
          <img src="${coverUrl}" alt="${escapeHtml(game.title)}" class="detail-cover-img" id="detail-hero-img" />
        </div>

        <!-- Screenshots Gallery -->
        ${galleryHtml}

        <!-- Video Player -->
        ${videoHtml}

        <!-- Description -->
        <section class="detail-section" aria-labelledby="desc-heading">
          <h2 class="detail-section-title" id="desc-heading">Об игре</h2>
          <div class="text-base" style="line-height: var(--line-height-relaxed); white-space: pre-line;">
            ${escapeHtml(game.description || 'Описание отсутствует.')}
          </div>
        </section>

        <!-- Hardware Requirements Table -->
        <section class="detail-section" aria-labelledby="hw-heading">
          <h2 class="detail-section-title" id="hw-heading">Системные требования</h2>
          <div class="req-table-grid">
            <!-- Minimum -->
            <div class="req-col">
              <div class="req-col-title">Минимальные</div>
              <div class="req-row">
                <span class="req-label">Процессор (CPU):</span>
                <span class="req-value">${escapeHtml(reqMin.cpu || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Видеокарта (GPU):</span>
                <span class="req-value">${escapeHtml(reqMin.gpu || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Оперативная память (RAM):</span>
                <span class="req-value">${escapeHtml(reqMin.ram || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Место на накопителе:</span>
                <span class="req-value">${escapeHtml(reqMin.storage || '—')}</span>
              </div>
            </div>

            <!-- Recommended -->
            <div class="req-col">
              <div class="req-col-title">Рекомендованные</div>
              <div class="req-row">
                <span class="req-label">Процессор (CPU):</span>
                <span class="req-value">${escapeHtml(reqRec.cpu || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Видеокарта (GPU):</span>
                <span class="req-value">${escapeHtml(reqRec.gpu || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Оперативная память (RAM):</span>
                <span class="req-value">${escapeHtml(reqRec.ram || '—')}</span>
              </div>
              <div class="req-row">
                <span class="req-label">Место на накопителе:</span>
                <span class="req-value">${escapeHtml(reqRec.storage || '—')}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Reviews Section with Form (Stage 4) -->
        <section class="detail-section" aria-labelledby="reviews-section-heading">
          <h2 class="detail-section-title" id="reviews-section-heading">
            Отзывы игроков
          </h2>
          <div class="reviews-list" id="reviews-list-container">
            <div class="skeleton" style="height: 60px;"></div>
          </div>
          <div id="review-form-container"></div>
        </section>
      </div>

      <!-- Right: Sticky Purchase Box & Metadata -->
      <aside class="detail-sidebar" role="complementary">
        <div class="buy-card">
          <div class="buy-price-row">
            <span class="buy-price-label">Цена</span>
            <span class="buy-price">${priceFormatted}</span>
          </div>

          <button type="button" class="btn btn-add-cart" id="btn-add-to-cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>В корзину</span>
          </button>

          <div id="cart-feedback-banner" class="feedback-banner" role="status"></div>

          <!-- Metadata Specs -->
          <div class="game-specs-list">
            <div class="spec-item">
              <span class="spec-key">Разработчик:</span>
              <span class="spec-val">${escapeHtml(game.developer || '—')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-key">Издатель:</span>
              <span class="spec-val">${escapeHtml(game.publisher || '—')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-key">Дата выхода:</span>
              <span class="spec-val">${formatDate(game.releaseDate)}</span>
            </div>
            <div class="spec-item">
              <span class="spec-key">Платформы:</span>
              <span class="spec-val">${escapeHtml((game.platforms || []).join(', '))}</span>
            </div>
            <div class="spec-item">
              <span class="spec-key">Жанры:</span>
              <span class="spec-val">${escapeHtml((game.genres || []).join(', '))}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Related Games -->
    <section class="related-section" id="related-section" aria-labelledby="related-heading">
      <h2 class="detail-section-title" id="related-heading">Похожие игры</h2>
      <div class="games-grid" id="related-games-grid">
        <div class="skeleton" style="height: 240px;"></div>
        <div class="skeleton" style="height: 240px;"></div>
        <div class="skeleton" style="height: 240px;"></div>
      </div>
    </section>
  `;

  if (detailContainer) {
    detailContainer.innerHTML = detailHtml;
    detailContainer.style.display = 'block';
  }

  // Gallery click: preview in hero area
  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const heroImg = document.getElementById('detail-hero-img');
      if (img && heroImg) {
        heroImg.src = img.src;
        heroImg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Attach "Add to Cart" listener
  const btnAddToCart = document.getElementById('btn-add-to-cart');
  const cartFeedback = document.getElementById('cart-feedback-banner');

  btnAddToCart?.addEventListener('click', async () => {
    // Check if logged in
    if (!auth.currentUser) {
      // Redirect to login with return URL
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    btnAddToCart.disabled = true;
    btnAddToCart.textContent = 'Добавление...';

    try {
      const result = await addToCart(currentGameId, game);
      if (cartFeedback) {
        cartFeedback.textContent = result.message || 'Игра добавлена в корзину!';
        cartFeedback.className = 'feedback-banner show success';
        setTimeout(() => {
          cartFeedback.className = 'feedback-banner';
        }, 4000);
      }
    } catch (err) {
      console.error('[detail-page] Error adding to cart:', err);
      if (cartFeedback) {
        cartFeedback.textContent = 'Ошибка добавления в корзину: ' + (err.message || 'Ошибка сети');
        cartFeedback.className = 'feedback-banner show error';
      }
    } finally {
      btnAddToCart.disabled = false;
      btnAddToCart.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span>В корзину</span>
      `;
    }
  });

  // Load reviews and related games in background
  loadReviews(currentGameId);
  loadRelatedGames(game.genres, currentGameId);
}

function showErrorState(message) {
  if (detailContainer) detailContainer.style.display = 'none';
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div class="catalog-empty" style="margin-top: var(--space-8);">
        <h2 class="catalog-empty-title">Игра не найдена</h2>
        <p class="catalog-empty-text">${escapeHtml(message)}</p>
        <a href="index.html" class="btn btn-primary">Вернуться в каталог</a>
      </div>
    `;
    errorContainer.style.display = 'block';
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

function pluralize(n, one, two, five) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

// Re-render reviews when auth state is resolved or changed
subscribeToAuth(() => {
  if (currentGameId) {
    loadReviews(currentGameId);
  }
});

// Auto-run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGameDetails);
} else {
  loadGameDetails();
}
