const PROJECT_ID = 'game-hub-c9caa';
const API_KEY = 'AIzaSyC1-wdRIA0QsCL86hsAzc_FFwI-dvfz--8';
const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders?key=${API_KEY}`;

async function checkOrders() {
  const r = await fetch(url);
  const d = await r.json();
  console.log('Orders found:', d.documents ? d.documents.length : 0);
  if (d.documents) {
    console.log(JSON.stringify(d.documents, null, 2));
  }
  if (d.error) {
    console.error('Error:', d.error);
  }
}
checkOrders();
