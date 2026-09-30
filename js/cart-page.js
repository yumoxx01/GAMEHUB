/**
 * cart-page.js
 * Game Hub — Cart Management Page Controller (cart.html)
 *
 * Implements:
 * - Route guard (redirects to login.html if logged out)
 * - Real-time subscription to user's cart
 * - Quantity adjustment (+/-) and item removal
 * - Live total calculation
 * - Atomic batch checkout (creates orders doc and clears cart in one batch)
 * - Post-checkout success confirmation
 */

import { subscribeToAuth } from './auth.js';
import {
  subscribeToUserCart,
  updateCartItemQuantity,
  removeCartItem,
  checkoutCartBatch,
} from './cart-helper.js';
import { resolveMediaUrl } from './storage-helper.js';

let currentUser = null;
let currentCartItems = [];

// DOM References
const cartLayoutEl = document.getElementById('cart-layout');
const emptyCartEl = document.getElementById('cart-empty-state');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountSummary = document.getElementById('summary-items-count');
const cartSubtotalEl = document.getElementById('summary-subtotal');
const cartTotalEl = document.getElementById('summary-total');
const btnCheckout = document.getElementById('btn-checkout');
const checkoutSuccessEl = document.getElementById('checkout-success-container');

/**
 * Calculates running total of current cart items
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
}

/**
 * Renders cart item rows
 */
async function renderCartItems(items) {
  currentCartItems = items;

  if (!items || items.length === 0) {
    if (cartLayoutEl) cartLayoutEl.style.display = 'none';
    if (emptyCartEl) emptyCartEl.style.display = 'block';
    return;
  }

  if (emptyCartEl) emptyCartEl.style.display = 'none';
  if (cartLayoutEl) cartLayoutEl.style.display = 'grid';

  const rowsHtml = await Promise.all(items.map(async (item) => {
    const coverUrl = await resolveMediaUrl(item.gameCover, item.gameTitle);
    const unitPrice = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const lineTotal = unitPrice * qty;

    return `
      <div class="cart-item-row" data-game-id="${escapeHtml(item.gameId)}">
        <div class="cart-thumb-wrap">
          <img src="${coverUrl}" alt="${escapeHtml(item.gameTitle)}" class="cart-thumb-img" />
        </div>
        <div class="cart-item-info">
          <a href="game.html?id=${encodeURIComponent(item.gameId)}" class="cart-item-title">
            ${escapeHtml(item.gameTitle)}
          </a>
          <span class="cart-item-unit-price">${Number(unitPrice).toLocaleString('ru-RU')} ₸ / шт.</span>
        </div>
        <div class="qty-controls" aria-label="Изменить количество">
          <button type="button" class="btn-qty btn-minus" data-game-id="${escapeHtml(item.gameId)}" data-qty="${qty}" aria-label="Уменьшить">-</button>
          <span class="qty-display">${qty}</span>
          <button type="button" class="btn-qty btn-plus" data-game-id="${escapeHtml(item.gameId)}" data-qty="${qty}" aria-label="Увеличить">+</button>
        </div>
        <div class="cart-line-total">
          ${Number(lineTotal).toLocaleString('ru-RU')} ₸
        </div>
        <button type="button" class="btn-remove-item" data-game-id="${escapeHtml(item.gameId)}" title="Удалить из корзины" aria-label="Удалить ${escapeHtml(item.gameTitle)}">
          ✕
        </button>
      </div>
    `;
  }));

  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = rowsHtml.join('');
  }

  // Update order summary
  const total = calculateTotal(items);
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

  if (cartCountSummary) cartCountSummary.textContent = `${totalQty} шт.`;
  if (cartSubtotalEl) cartSubtotalEl.textContent = `${total.toLocaleString('ru-RU')} ₸`;
  if (cartTotalEl) cartTotalEl.textContent = `${total.toLocaleString('ru-RU')} ₸`;

  attachItemActionListeners();
}

/**
 * Attaches click handlers to quantity buttons and remove buttons
 */
function attachItemActionListeners() {
  if (!cartItemsContainer || !currentUser) return;

  // Plus button
  cartItemsContainer.querySelectorAll('.btn-plus').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const gameId = btn.getAttribute('data-game-id');
      const currentQty = parseInt(btn.getAttribute('data-qty'), 10) || 1;
      btn.disabled = true;
      try {
        await updateCartItemQuantity(currentUser.uid, gameId, currentQty + 1);
      } catch (err) {
        console.error('[cart-page] Error incrementing:', err);
      }
    });
  });

  // Minus button
  cartItemsContainer.querySelectorAll('.btn-minus').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const gameId = btn.getAttribute('data-game-id');
      const currentQty = parseInt(btn.getAttribute('data-qty'), 10) || 1;
      btn.disabled = true;
      try {
        await updateCartItemQuantity(currentUser.uid, gameId, currentQty - 1);
      } catch (err) {
        console.error('[cart-page] Error decrementing:', err);
      }
    });
  });

  // Remove button
  cartItemsContainer.querySelectorAll('.btn-remove-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const gameId = btn.getAttribute('data-game-id');
      btn.disabled = true;
      try {
        await removeCartItem(currentUser.uid, gameId);
      } catch (err) {
        console.error('[cart-page] Error removing:', err);
      }
    });
  });
}

/**
 * Handles Checkout process (atomic batch write order + delete cart items)
 */
async function handleCheckout() {
  if (!currentUser || currentCartItems.length === 0) return;

  if (btnCheckout) {
    btnCheckout.disabled = true;
    btnCheckout.textContent = 'Оформление заказа...';
  }

  try {
    const result = await checkoutCartBatch(currentUser.uid, currentCartItems);

    // Hide cart layout, display success confirmation
    if (cartLayoutEl) cartLayoutEl.style.display = 'none';
    if (emptyCartEl) emptyCartEl.style.display = 'none';

    if (checkoutSuccessEl) {
      checkoutSuccessEl.innerHTML = `
        <div class="checkout-success-card">
          <span class="success-badge">Заказ оформлен</span>
          <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--space-2);">Спасибо за покупку!</h2>
          <p class="text-secondary text-sm" style="margin-bottom: var(--space-4);">
            Ваш заказ <strong>#${escapeHtml(result.orderId)}</strong> на сумму <strong>${Number(result.total).toLocaleString('ru-RU')} ₸</strong> успешно создан.
          </p>
          <div class="divider" style="margin-block: var(--space-4);"></div>
          <div class="flex gap-4">
            <a href="dashboard.html" class="btn btn-primary">Мои заказы</a>
            <a href="index.html" class="btn btn-ghost">В каталог</a>
          </div>
        </div>
      `;
      checkoutSuccessEl.style.display = 'block';
    }

  } catch (err) {
    console.error('[cart-page] Checkout error:', err);
    alert('Не удалось оформить заказ: ' + (err.message || 'Ошибка сети'));
    if (btnCheckout) {
      btnCheckout.disabled = false;
      btnCheckout.textContent = 'Оформить заказ';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation & Auth Route Guard
// ─────────────────────────────────────────────────────────────────────────────
let unsubscribeCartListener = null;

subscribeToAuth(({ user }) => {
  if (!user) {
    // Route guard: redirect to login with return parameter
    window.location.replace('login.html?redirect=cart.html');
    return;
  }

  currentUser = user;

  if (unsubscribeCartListener) {
    unsubscribeCartListener();
  }

  unsubscribeCartListener = subscribeToUserCart(user.uid, (items) => {
    renderCartItems(items);
  });
});

btnCheckout?.addEventListener('click', handleCheckout);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
