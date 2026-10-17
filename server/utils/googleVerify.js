const { OAuth2Client } = require('google-auth-library');

let cached = null;
const getClient = (clientId) => {
  if (!cached || cached.clientId !== clientId) cached = { clientId, client: new OAuth2Client(clientId) };
  return cached.client;
};


exports.verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { ok: false, status: 503, message: 'Google sign-in is not configured.' };

  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 4096) {
    return { ok: false, status: 400, message: 'Missing Google credential.' };
  }

  let payload;
  try {
    const ticket = await getClient(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    return { ok: false, status: 401, message: 'Google sign-in failed. Please try again.' };
  }

  if (!payload || !payload.sub || !payload.email) {
    return { ok: false, status: 401, message: 'Google sign-in failed. Please try again.' };
  }
  if (payload.email_verified !== true) {
    return { ok: false, status: 401, message: 'Your Google email address is not verified.' };
  }
  return { ok: true, payload };
};
