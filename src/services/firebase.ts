import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBK9Uv0sQnRJr23_o2JYKPv2SWxlT5cFOw",
  authDomain: "financeflow-2f2f5.firebaseapp.com",
  projectId: "financeflow-2f2f5",
  storageBucket: "financeflow-2f2f5.firebasestorage.app",
  messagingSenderId: "342761107376",
  appId: "1:342761107376:web:d82b6205b957774ae7f075"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);