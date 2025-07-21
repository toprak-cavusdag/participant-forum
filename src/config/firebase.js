// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtNSCDu7RWFChH6KMFFFlXC4cNoA_duZo",
  authDomain: "global-zero-waste-forum.firebaseapp.com",
  projectId: "global-zero-waste-forum",
  storageBucket: "global-zero-waste-forum.firebasestorage.app",
  messagingSenderId: "719673367171",
  appId: "1:719673367171:web:fbec96432425bcdc2599b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);