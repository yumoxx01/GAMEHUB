/**
 * cart-helper.js
 * Game Hub — Cart Data Management & Atomic Order Checkout
 *
 * Implements:
 * - Adding games to cart (composite doc ID cart/{userId}_{gameId})
 * - Incrementing / decrementing quantity
 * - Removing individual cart item
 * - Subscribing to user's cart in real-time
 * - Atomic batch checkout: writes order to orders/{orderId} & deletes all user's cart docs
 * - Real-time cart item count listener for the site header
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { auth, db } from './firebase-config.js';
import { COLLECTIONS, cartDocId, cartConverter, ordersConverter } from './firestore-schema.js';

/**
 * Adds a game to the current user's cart.
 * @param {string} gameId
 * @param {Object} gameData
 * @returns {Promise<{success: boolean, requireAuth?: boolean, quantity?: number, message?: string}>}
 */
export async function addToCart(gameId, gameData) {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      requireAuth: true,
      message: 'Для добавления игры в корзину необходимо войти в аккаунт.',
    };
  }

  const cDocId = cartDocId(user.uid, gameId);
  const cartRef = doc(db, COLLECTIONS.CART, cDocId).withConverter(cartConverter);

  try {
    const snap = await getDoc(cartRef);

    if (snap.exists()) {
      const existingData = snap.data();
      const newQty = (existingData.quantity || 1) + 1;
      await updateDoc(doc(db, COLLECTIONS.CART, cDocId), {
        quantity: newQty,
      });
      return {
        success: true,
        quantity: newQty,
        message: `Количество игры "${gameData.title}" увеличено до ${newQty}`,
      };
    } else {
      const newItem = {
        userId: user.uid,
        gameId,
        gameTitle: gameData.title || 'Игра',
        gameCover: gameData.coverImage || '',
        price: Number(gameData.price) || 0,
        quantity: 1,
        addedAt: Timestamp.now(),
      };
      await setDoc(cartRef, newItem);
      return {
        success: true,
        quantity: 1,
        message: `Игра "${gameData.title}" добавлена в корзину!`,
      };
    }
  } catch (err) {
    console.error('[cart-helper] Error adding to cart:', err);
    throw err;
  }
}

/**
 * Updates an item's quantity in the cart.
 * If new quantity is <= 0, the item is removed.
 *
 * @param {string} userId
 * @param {string} gameId
 * @param {number} newQuantity
 * @returns {Promise<void>}
 */
export async function updateCartItemQuantity(userId, gameId, newQuantity) {
  if (!userId || !gameId) return;
  const cDocId = cartDocId(userId, gameId);
  const ref = doc(db, COLLECTIONS.CART, cDocId);

  if (newQuantity <= 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { quantity: Number(newQuantity) });
  }
}

/**
 * Removes an item from the cart completely.
 * @param {string} userId
 * @param {string} gameId
 * @returns {Promise<void>}
 */
export async function removeCartItem(userId, gameId) {
  if (!userId || !gameId) return;
  const cDocId = cartDocId(userId, gameId);
  await deleteDoc(doc(db, COLLECTIONS.CART, cDocId));
}

/**
 * Subscribes to real-time cart items for a given user.
 * @param {string} userId
 * @param {function(Array<Object>): void} onItemsChange
 * @returns {import('firebase/firestore').Unsubscribe}
 */
export function subscribeToUserCart(userId, onItemsChange) {
  if (!userId) return () => {};

  const q = query(
    collection(db, COLLECTIONS.CART).withConverter(cartConverter),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach(d => items.push(d.data()));
    onItemsChange(items);
  }, (err) => {
    console.error('[cart-helper] Cart items snapshot error:', err);
  });
}

/**
 * Subscribes to real-time cart item count for a given user and updates header badge.
 * @param {string} userId
 * @param {function(number): void} [onChange]
 * @returns {import('firebase/firestore').Unsubscribe}
 */
export function subscribeToUserCartCount(userId, onChange) {
  if (!userId) return () => {};

  const q = query(
    collection(db, COLLECTIONS.CART),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    let totalItems = 0;
    snapshot.forEach((d) => {
      const item = d.data();
      totalItems += item.quantity || 1;
    });

    const badge = document.getElementById('header-cart-count');
    if (badge) {
      if (totalItems > 0) {
        badge.textContent = totalItems > 99 ? '99+' : String(totalItems);
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (typeof onChange === 'function') {
      onChange(totalItems);
    }
  }, (err) => {
    console.warn('[cart-helper] Cart count snapshot error:', err);
  });
}

/**
 * Performs atomic checkout using writeBatch():
 * 1. Creates a new order document in orders/{orderId} with item snapshot & total.
 * 2. Deletes all user's cart documents in the same batch.
 *
 * @param {string} userId
 * @param {Array<Object>} cartItems
 * @returns {Promise<{orderId: string, total: number, itemsCount: number}>}
 */
export async function checkoutCartBatch(userId, cartItems) {
  if (!userId) throw new Error('Пользователь не авторизован');
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Корзина пуста');
  }

  const batch = writeBatch(db);

  // 1. Create order document reference
  const orderRef = doc(collection(db, COLLECTIONS.ORDERS));

  // Compute snapshot of items and total
  const itemsSnapshot = cartItems.map(item => ({
    gameId: item.gameId,
    gameTitle: item.gameTitle || 'Игра',
    gameCover: item.gameCover || '',
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
  }));

  const total = itemsSnapshot.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const orderData = {
    userId,
    items: itemsSnapshot,
    total,
    status: 'pending',
    createdAt: Timestamp.now(),
  };

  batch.set(orderRef, orderData);

  // 2. Delete all cart items in the same batch
  for (const item of cartItems) {
    const cDocId = cartDocId(userId, item.gameId);
    const cRef = doc(db, COLLECTIONS.CART, cDocId);
    batch.delete(cRef);
  }

  // 3. Commit atomic batch
  await batch.commit();

  return {
    orderId: orderRef.id,
    total,
    itemsCount: itemsSnapshot.length,
  };
}
