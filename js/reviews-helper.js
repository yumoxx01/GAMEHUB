/**
 * reviews-helper.js
 * Game Hub — Review Management & Atomic Firestore Transactions
 *
 * Implements:
 * - Create review with atomic recomputation of game avgRating & reviewCount
 * - Update existing review with atomic recalculation
 * - Delete review with atomic decrement (handles last review -> 0/0 without divide-by-zero)
 * - User review lookups (one review per game per user)
 */

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  runTransaction,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase-config.js';
import { COLLECTIONS, reviewsConverter } from './firestore-schema.js';

/**
 * Calculates rounded 1-decimal average rating
 * @param {number} total
 * @param {number} count
 * @returns {number}
 */
function roundRating(val) {
  if (isNaN(val) || !isFinite(val) || val <= 0) return 0;
  return Math.round(val * 10) / 10;
}

/**
 * Checks if the user has already reviewed a specific game.
 * @param {string} gameId
 * @param {string} userId
 * @returns {Promise<{id: string, [key: string]: any}|null>}
 */
export async function getUserReviewForGame(gameId, userId) {
  if (!gameId || !userId) return null;

  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('gameId', '==', gameId),
    where('userId', '==', userId)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Fetches all reviews authored by a specific user across all games.
 * @param {string} userId
 * @returns {Promise<Array<{id: string, [key: string]: any}>>}
 */
export async function getUserAllReviews(userId) {
  if (!userId) return [];

  const reviews = [];
  try {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    snap.forEach(d => reviews.push({ id: d.id, ...d.data() }));
  } catch (indexErr) {
    console.warn('[reviews-helper] getUserAllReviews index fallback:', indexErr.message);
    try {
      const qFallback = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('userId', '==', userId)
      );
      const snap = await getDocs(qFallback);
      snap.forEach(d => reviews.push({ id: d.id, ...d.data() }));
      reviews.sort((a, b) => {
        const da = a.createdAt?.toDate?.() ?? (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt ?? 0));
        const db = b.createdAt?.toDate?.() ?? (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt ?? 0));
        return db - da;
      });
    } catch (fallbackErr) {
      console.error('[reviews-helper] getUserAllReviews fallback error:', fallbackErr);
    }
  }
  return reviews;
}

/**
 * Creates or updates a review in an atomic transaction with the target game document.
 *
 * Math for create:
 *   newCount = oldCount + 1
 *   newAvg = ((oldAvg * oldCount) + newRating) / newCount
 *
 * Math for edit:
 *   newCount = oldCount
 *   newAvg = ((oldAvg * oldCount) - oldRating + newRating) / newCount
 *
 * @param {Object} params
 * @param {string} params.gameId
 * @param {string} params.userId
 * @param {string} params.userName
 * @param {number} params.rating - 1 to 5
 * @param {string} params.text
 * @param {string} [params.existingReviewId] - If editing an existing review
 * @returns {Promise<{reviewId: string, newAvgRating: number, newReviewCount: number}>}
 */
export async function saveReviewTransaction({
  gameId,
  userId,
  userName,
  rating,
  text,
  existingReviewId = null,
}) {
  if (!gameId || !userId) throw new Error('gameId and userId are required');
  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const cleanText = (text || '').trim();
  const cleanName = (userName || 'Пользователь').trim();

  const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
  const reviewRef = existingReviewId
    ? doc(db, COLLECTIONS.REVIEWS, existingReviewId)
    : doc(collection(db, COLLECTIONS.REVIEWS));

  let finalAvg = 0;
  let finalCount = 0;

  await runTransaction(db, async (transaction) => {
    // 1. Read game document
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) {
      throw new Error('Игра не найдена в базе данных');
    }
    const gameData = gameSnap.data();
    const oldAvg = Number(gameData.avgRating) || 0;
    const oldCount = Number(gameData.reviewCount) || 0;

    if (existingReviewId) {
      // Edit existing review
      const revSnap = await transaction.get(reviewRef);
      if (!revSnap.exists()) {
        throw new Error('Редактируемый отзыв не найден');
      }
      const oldReviewData = revSnap.data();
      const oldRating = Number(oldReviewData.rating) || oldAvg;

      finalCount = oldCount > 0 ? oldCount : 1;
      const totalPoints = (oldAvg * oldCount) - oldRating + numRating;
      finalAvg = roundRating(totalPoints / finalCount);

      // Write updated review
      transaction.update(reviewRef, {
        rating: numRating,
        text: cleanText,
        userName: cleanName,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new review
      finalCount = oldCount + 1;
      const totalPoints = (oldAvg * oldCount) + numRating;
      finalAvg = roundRating(totalPoints / finalCount);

      // Write new review
      transaction.set(reviewRef, {
        gameId,
        userId,
        userName: cleanName,
        rating: numRating,
        text: cleanText,
        createdAt: Timestamp.now(),
      });
    }

    // Update game denormalized rating & count in the same transaction
    transaction.update(gameRef, {
      avgRating: finalAvg,
      reviewCount: finalCount,
    });
  });

  return {
    reviewId: reviewRef.id,
    newAvgRating: finalAvg,
    newReviewCount: finalCount,
  };
}

/**
 * Deletes a review in an atomic transaction, recalculating game avgRating & reviewCount.
 * Handles the "last review deleted" case by resetting to avgRating: 0, reviewCount: 0
 * without divide-by-zero.
 *
 * @param {string} reviewId
 * @param {string} gameId
 * @returns {Promise<{newAvgRating: number, newReviewCount: number}>}
 */
export async function deleteReviewTransaction(reviewId, gameId) {
  if (!reviewId || !gameId) throw new Error('reviewId and gameId are required');

  const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
  const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);

  let finalAvg = 0;
  let finalCount = 0;

  await runTransaction(db, async (transaction) => {
    // 1. Read review
    const revSnap = await transaction.get(reviewRef);
    if (!revSnap.exists()) {
      return; // Already deleted
    }
    const revData = revSnap.data();
    const deletedRating = Number(revData.rating) || 0;

    // 2. Read game
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists()) {
      transaction.delete(reviewRef);
      return;
    }
    const gameData = gameSnap.data();
    const oldAvg = Number(gameData.avgRating) || 0;
    const oldCount = Number(gameData.reviewCount) || 0;

    // Calculate new count
    finalCount = Math.max(0, oldCount - 1);

    if (finalCount === 0) {
      // Last review deleted: reset both to 0
      finalAvg = 0;
    } else {
      const remainingPoints = (oldAvg * oldCount) - deletedRating;
      finalAvg = roundRating(remainingPoints / finalCount);
    }

    // Delete review doc
    transaction.delete(reviewRef);

    // Update game doc in the same transaction
    transaction.update(gameRef, {
      avgRating: finalAvg,
      reviewCount: finalCount,
    });
  });

  return {
    newAvgRating: finalAvg,
    newReviewCount: finalCount,
  };
}
