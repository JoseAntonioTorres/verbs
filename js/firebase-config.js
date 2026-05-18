// 1. Importar la función necesaria para inicializar la aplicación desde el CDN de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// 2. Credenciales del proyecto (Copia y reemplaza estos valores con los que te otorga la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDHKdijIfKanuRnq7X-S1UlhqM5OzJYHfY",
  authDomain: "mastering-irregular-verbs.firebaseapp.com",
  projectId: "mastering-irregular-verbs",
  storageBucket: "mastering-irregular-verbs.firebasestorage.app",
  messagingSenderId: "732781732974",
  appId: "1:732781732974:web:b275bfb760d05f0d72327f",
  measurementId: "G-VRKJ50XKTT"
};


// 3. Inicializar Firebase de manera global para el OVA
const app = initializeApp(firebaseConfig);

// 4. Inicializar el servicio de Autenticación vinculado a esta app
export const auth = getAuth(app);

// Exportamos también la app por si en el futuro deseas integrar base de datos (Firestore) o almacenamiento
export default app;