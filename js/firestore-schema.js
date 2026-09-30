/**
 * firestore-schema.js
 * Game Hub — Firestore collection helpers, constants, and data converters
 *
 * Import what you need:
 *   import { COLLECTIONS, gamesConverter, reviewsConverter, ... }
 *     from './firestore-schema.js';
 */

import {
  collection,
  doc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { db } from './firebase-config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Collection name constants — avoids magic strings across the codebase
// ─────────────────────────────────────────────────────────────────────────────
export const COLLECTIONS = Object.freeze({
  USERS:   'users',
  GAMES:   'games',
  REVIEWS: 'reviews',
  CART:    'cart',
  ORDERS:  'orders',
});

// ─────────────────────────────────────────────────────────────────────────────
// Collection references
// ─────────────────────────────────────────────────────────────────────────────
export const usersCol   = () => collection(db, COLLECTIONS.USERS);
export const gamesCol   = () => collection(db, COLLECTIONS.GAMES);
export const reviewsCol = () => collection(db, COLLECTIONS.REVIEWS);
export const cartCol    = () => collection(db, COLLECTIONS.CART);
export const ordersCol  = () => collection(db, COLLECTIONS.ORDERS);

// ─────────────────────────────────────────────────────────────────────────────
// Composite document ID helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cart document ID: "{userId}_{gameId}" */
export const cartDocId = (userId, gameId) => `${userId}_${gameId}`;

/** Cart document reference */
export const cartDocRef = (userId, gameId) =>
  doc(db, COLLECTIONS.CART, cartDocId(userId, gameId));

// ─────────────────────────────────────────────────────────────────────────────
// Firestore data converters
// Each converter pair (toFirestore / fromFirestore) ensures consistent
// shape when reading/writing typed documents.
// ─────────────────────────────────────────────────────────────────────────────

/** @typedef {Object} UserDoc */
export const usersConverter = {
  toFirestore(user) {
    return {
      displayName: user.displayName ?? '',
      email:       user.email       ?? '',
      role:        user.role        ?? 'user',
      createdAt:   user.createdAt   ?? Timestamp.now(),
      ...(user.photoURL && { photoURL: user.photoURL }),
      ...(user.bio      && { bio: user.bio }),
    };
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options);
    return {
      uid:         snapshot.id,
      displayName: d.displayName ?? '',
      email:       d.email       ?? '',
      role:        d.role        ?? 'user',
      createdAt:   d.createdAt   ?? null,
      photoURL:    d.photoURL    ?? null,
      bio:         d.bio         ?? '',
    };
  },
};

/** @typedef {Object} GameDoc */
export const gamesConverter = {
  toFirestore(game) {
    return {
      title:       game.title,
      titleLower:  game.title.toLowerCase(),
      description: game.description,
      coverImage:  game.coverImage  ?? '',
      genres:      game.genres      ?? [],
      platforms:   game.platforms   ?? [],
      releaseDate: game.releaseDate instanceof Timestamp
        ? game.releaseDate
        : Timestamp.fromDate(new Date(game.releaseDate)),
      developer:   game.developer,
      publisher:   game.publisher,
      price:       Number(game.price),
      hardwareRequirements: {
        min: {
          cpu:     game.hardwareRequirements?.min?.cpu     ?? '',
          gpu:     game.hardwareRequirements?.min?.gpu     ?? '',
          ram:     game.hardwareRequirements?.min?.ram     ?? '',
          storage: game.hardwareRequirements?.min?.storage ?? '',
        },
        rec: {
          cpu:     game.hardwareRequirements?.rec?.cpu     ?? '',
          gpu:     game.hardwareRequirements?.rec?.gpu     ?? '',
          ram:     game.hardwareRequirements?.rec?.ram     ?? '',
          storage: game.hardwareRequirements?.rec?.storage ?? '',
        },
      },
      screenshots:  game.screenshots  ?? [],
      videoURL:     game.videoURL      ?? '',
      featured:     game.featured      ?? false,
      avgRating:    game.avgRating     ?? 0,
      reviewCount:  game.reviewCount   ?? 0,
      createdAt:    game.createdAt     ?? Timestamp.now(),
      createdBy:    game.createdBy     ?? '',
    };
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options);
    return {
      id:           snapshot.id,
      title:        d.title,
      titleLower:   d.titleLower,
      description:  d.description,
      coverImage:   d.coverImage   ?? '',
      genres:       d.genres       ?? [],
      platforms:    d.platforms    ?? [],
      releaseDate:  d.releaseDate  ?? null,
      developer:    d.developer,
      publisher:    d.publisher,
      price:        d.price,
      hardwareRequirements: d.hardwareRequirements ?? { min: {}, rec: {} },
      screenshots:  d.screenshots  ?? [],
      videoURL:     d.videoURL     ?? '',
      featured:     d.featured     ?? false,
      avgRating:    d.avgRating    ?? 0,
      reviewCount:  d.reviewCount  ?? 0,
      createdAt:    d.createdAt    ?? null,
      createdBy:    d.createdBy    ?? '',
    };
  },
};

/** @typedef {Object} ReviewDoc */
export const reviewsConverter = {
  toFirestore(review) {
    return {
      gameId:    review.gameId,
      userId:    review.userId,
      userName:  review.userName  ?? 'Anonymous',
      rating:    Number(review.rating),
      text:      review.text      ?? '',
      createdAt: review.createdAt ?? Timestamp.now(),
      ...(review.updatedAt && { updatedAt: review.updatedAt }),
    };
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options);
    return {
      id:        snapshot.id,
      gameId:    d.gameId,
      userId:    d.userId,
      userName:  d.userName  ?? 'Anonymous',
      rating:    d.rating,
      text:      d.text      ?? '',
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
    };
  },
};

/** @typedef {Object} CartDoc */
export const cartConverter = {
  toFirestore(item) {
    return {
      userId:    item.userId,
      gameId:    item.gameId,
      gameTitle: item.gameTitle ?? '',
      gameCover: item.gameCover ?? '',
      price:     Number(item.price),
      quantity:  Number(item.quantity) || 1,
      addedAt:   item.addedAt ?? Timestamp.now(),
    };
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options);
    return {
      id:        snapshot.id,
      userId:    d.userId,
      gameId:    d.gameId,
      gameTitle: d.gameTitle ?? '',
      gameCover: d.gameCover ?? '',
      price:     d.price,
      quantity:  d.quantity ?? 1,
      addedAt:   d.addedAt  ?? null,
    };
  },
};

/** @typedef {Object} OrderDoc */
export const ordersConverter = {
  toFirestore(order) {
    return {
      userId:    order.userId,
      items:     order.items ?? [],
      total:     Number(order.total),
      status:    order.status   ?? 'pending',
      createdAt: order.createdAt ?? Timestamp.now(),
    };
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options);
    return {
      id:        snapshot.id,
      userId:    d.userId,
      items:     d.items     ?? [],
      total:     d.total,
      status:    d.status    ?? 'pending',
      createdAt: d.createdAt ?? null,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Typed collection references (with converter attached)
// ─────────────────────────────────────────────────────────────────────────────
export const typedGamesCol   = () => collection(db, COLLECTIONS.GAMES  ).withConverter(gamesConverter);
export const typedReviewsCol = () => collection(db, COLLECTIONS.REVIEWS).withConverter(reviewsConverter);
export const typedCartCol    = () => collection(db, COLLECTIONS.CART   ).withConverter(cartConverter);
export const typedOrdersCol  = () => collection(db, COLLECTIONS.ORDERS ).withConverter(ordersConverter);
export const typedUsersCol   = () => collection(db, COLLECTIONS.USERS  ).withConverter(usersConverter);

// ─────────────────────────────────────────────────────────────────────────────
// Platform & Genre enumerations (mirrors schema)
// ─────────────────────────────────────────────────────────────────────────────
export const PLATFORMS = Object.freeze(['PC', 'PlayStation', 'Xbox', 'Nintendo']);

export const GENRES = Object.freeze([
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
  'Sports', 'Racing', 'Horror', 'Puzzle', 'Indie', 'Fighting',
  'Shooter', 'Sandbox', 'MMO', 'Platformer',
]);

export const ORDER_STATUSES = Object.freeze(['pending', 'completed', 'cancelled']);
export const USER_ROLES     = Object.freeze(['user', 'admin']);
