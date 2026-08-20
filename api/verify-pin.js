const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel env vars store newlines as literal "\n" — convert them back.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

// Fixed UID for this single-user diary. Firestore & Storage rules only
// grant access to requests authenticated as this exact UID.
const OWNER_UID = 'diary-owner';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const pin = body && body.pin;
  const correctPin = process.env.DIARY_PIN;

  if (!correctPin) {
    console.error('DIARY_PIN belum di-set di environment variables.');
    res.status(500).json({ error: 'Server belum dikonfigurasi (DIARY_PIN kosong).' });
    return;
  }

  if (!pin || !timingSafeEqual(pin, correctPin)) {
    // Small delay to blunt brute-force guessing.
    await new Promise(r => setTimeout(r, 400));
    res.status(401).json({ error: 'PIN salah.' });
    return;
  }

  try {
    const customToken = await admin.auth().createCustomToken(OWNER_UID);
    res.status(200).json({ token: customToken });
  } catch (err) {
    console.error('Gagal membuat custom token:', err);
    res.status(500).json({ error: 'Gagal membuat token otentikasi.' });
  }
};
