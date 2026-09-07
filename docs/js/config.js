/* Firebase web config. Filled in once the Firebase project exists.
   While apiKey is empty the site runs in Preview mode: everything works,
   but changes stay on this device only. */
export const firebaseConfig = {
  apiKey: "AIzaSyDn7DI9cOHw6dvMw_aQ0KapRKH-YAeixqw",
  authDomain: "ally-and-alex.firebaseapp.com",
  projectId: "ally-and-alex",
  storageBucket: "ally-and-alex.firebasestorage.app",
  messagingSenderId: "1012793659889",
  appId: "1:1012793659889:web:aedfb7d69a13d14fc5b450",
};

/* SHA-256 of "ally-alex:" + the passcode (lowercased). The site refuses any other
   passcode, so a typo can't silently create a second empty planner.
   Regenerate with scripts/passcode.py if the passcode changes. */
export const SPACE_HASH = "f3eaf668ab18cb92cc5cbc44f3b9e209a7c0d18d8f358dc54b7e5e3b2c59c92e";
