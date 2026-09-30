/**
 * seed-admin-orders.mjs
 * Seeds realistic orders for the admin user (admin@gamehub.kz)
 * so that Order History in Dashboard & Admin Panel has complete, beautiful data.
 */

const PROJECT_ID = 'game-hub-c9caa';
const API_KEY = 'AIzaSyC1-wdRIA0QsCL86hsAzc_FFwI-dvfz--8';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const ADMIN_UID = 'BWS9ngjvDAPPCJrNqDUwZuSCC322';

const sampleOrders = [
  {
    orderId: 'gh-ord-1001',
    userId: ADMIN_UID,
    status: 'completed',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    items: [
      {
        gameId: 'seed-game-cyberpunk-2077',
        gameTitle: 'Cyberpunk 2077: Phantom Liberty',
        gameCover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        price: 14990,
        quantity: 1,
      },
      {
        gameId: 'seed-game-witcher-3',
        gameTitle: 'Ведьмак 3: Дикая Охота — Полное издание',
        gameCover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
        price: 9990,
        quantity: 1,
      }
    ],
    total: 24980,
  },
  {
    orderId: 'gh-ord-1002',
    userId: ADMIN_UID,
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    items: [
      {
        gameId: 'seed-game-baldurs-gate-3',
        gameTitle: "Baldur's Gate 3",
        gameCover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
        price: 23990,
        quantity: 1,
      }
    ],
    total: 23990,
  }
];

async function seedOrders() {
  console.log(' Seeding sample orders for admin user...');

  for (const ord of sampleOrders) {
    const url = `${BASE_URL}/orders/${ord.orderId}?key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          userId: { stringValue: ord.userId },
          status: { stringValue: ord.status },
          total: { integerValue: String(ord.total) },
          createdAt: { timestampValue: ord.createdAt },
          items: {
            arrayValue: {
              values: ord.items.map(item => ({
                mapValue: {
                  fields: {
                    gameId: { stringValue: item.gameId },
                    gameTitle: { stringValue: item.gameTitle },
                    gameCover: { stringValue: item.gameCover },
                    price: { integerValue: String(item.price) },
                    quantity: { integerValue: String(item.quantity) },
                  }
                }
              }))
            }
          }
        }
      })
    });

    const json = await res.json();
    if (!res.ok) {
      console.error(`❌ Failed order ${ord.orderId}:`, json.error);
    } else {
      console.log(`✓ Seeded order: ${ord.orderId} (${ord.status}, ${ord.total} ₸)`);
    }
  }

  console.log('🎉 Orders seeding completed.');
}

seedOrders();
