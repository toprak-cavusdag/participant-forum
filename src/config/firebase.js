// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBb9GgrLLCdrow-nU4P7a69PoRS7lP9yEk",
  authDomain: "zero-waste-test-submit.firebaseapp.com",
  projectId: "zero-waste-test-submit",
  storageBucket: "zero-waste-test-submit.firebasestorage.app",
  messagingSenderId: "836158770612",
  appId: "1:836158770612:web:388dd02c9ef8d82811f6e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);