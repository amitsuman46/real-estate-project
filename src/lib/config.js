export function isFirebaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

export function getOwnerEmail() {
  return (process.env.NEXT_PUBLIC_OWNER_EMAIL || 'harsh@realstate.com').toLowerCase();
}
