import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc, query, where, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYWcvm19Usd44o2Dqv2eSKY9HwufDpuzM",
  authDomain: "aniwalks-2e9ec.firebaseapp.com",
  projectId: "aniwalks-2e9ec",
  storageBucket: "aniwalks-2e9ec.firebasestorage.app",
  messagingSenderId: "695717396484",
  appId: "1:695717396484:web:76e2cf1aebb73e8344f551"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth, db, googleProvider,
  signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile,
  collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc, query, where, updateDoc, increment
};