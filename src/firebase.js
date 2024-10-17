import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBIXEa1506o1ggIs7rNz5ZaTb7P0ZQWSWw",
  authDomain: "points-io.firebaseapp.com",
  projectId: "points-io",
  storageBucket: "points-io.appspot.com",
  messagingSenderId: "639700741828",
  appId: "1:639700741828:web:0202e8f2c130c5a6bda391",
  measurementId: "G-9T3C2JMD7L"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);