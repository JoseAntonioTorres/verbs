// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// REEMPLAZA ESTOS VALORES CON LOS DE TU CONSOLA DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDHKdijIfKanuRnq7X-S1UlhqM5OzJYHfY",
  authDomain: "mastering-irregular-verbs.firebaseapp.com",
  projectId: "mastering-irregular-verbs",
  storageBucket: "mastering-irregular-verbs.firebasestorage.app",
  messagingSenderId: "732781732974",
  appId: "1:732781732974:web:b275bfb760d05f0d72327f",
  measurementId: "G-VRKJ50XKTT"
};

const app = initializeApp(firebaseConfig);

// Exportamos 'auth' ya inicializado para consumirlo en los demás archivos
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;