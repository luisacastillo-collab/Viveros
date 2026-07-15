import admin from "firebase-admin";

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
