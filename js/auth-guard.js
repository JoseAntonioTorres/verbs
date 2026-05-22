// js/auth-guard.js
import { auth, db } from "../js/firebase-config.js"; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// CORRECCIÓN: Importamos las funciones operativas directamente de la CDN oficial de Firestore
import { doc, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// ==========================================
// GUARDIÁN DE RUTA Y FILTRO DE ROLES
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
  } else {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      // CORRECCIÓN: Extraemos el nombre del archivo de forma segura quitando parámetros o extensiones
      const paginaActual = window.location.pathname.split("/").pop().split("?")[0];

      // Valores por defecto si no existen en Firestore o están cargando
      let userRole = "student";
      let displayName = user.displayName || "User";
      let photoURL = user.photoURL || "../assets/default-avatar.png"; 

      if (userSnap.exists()) {
        const userData = userSnap.data();
        userRole = userData.profile?.role || "student";
        
        if (userData.profile?.name) displayName = userData.profile.name;
        if (userData.profile?.avatar) photoURL = userData.profile.avatar;

        // Si intenta entrar a facilitator.html (o facilitator) sin serlo, se redirige
        if ((paginaActual === "facilitator.html" || paginaActual === "facilitator") && userRole !== "facilitator") {
          window.location.href = "../modules/introduction.html";
          return;
        }
      }

      // Activamos la vista del body
      document.body.classList.add('authorized');
      
      // Pasamos los datos recolectados a la función de la barra superior
      inyectarNavbar({ displayName, userRole, photoURL });

    } catch (err) {
      console.error("Error verificando rol unificado del usuario:", err);
      // Failsafe: Inyectamos el menú incluso si Firestore falla temporalmente para no romper la UI
      inyectarNavbar({ displayName: user.displayName || "User", userRole: "student", photoURL: user.photoURL || "" });
    }
  }
});

// ==========================================
// INYECCIÓN DINÁMICA DE NAVBAR (CON PERFIL) Y FOOTER
// ==========================================
function inyectarNavbar(usuario) {
  const header = document.querySelector('header');
  if (!header) return;

  const rolEtiqueta = usuario.userRole === "facilitator" ? "Facilitator" : "Student";
  const classEtiqueta = usuario.userRole === "facilitator" ? "badge-facilitator" : "badge-student";

  header.innerHTML = `
    <nav id="siteNav" style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        gap: 40px; 
        padding: 15px 20px; 
        background-color: #ffffff; 
        border-bottom: 2px solid #e9ecef;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    ">
      <ul style="
          display: flex; 
          list-style: none; 
          margin: 0; 
          padding: 0; 
          gap: 12px; 
          align-items: center;
      ">
        <li><a href="introduction.html" id="nav-introduction" class="nav-link-custom">Introduction</a></li>
        <li><a href="study.html" id="nav-study" class="nav-link-custom">Study</a></li>
        <li><a href="game.html" id="nav-game" class="nav-link-custom">Game</a></li>
        <li><a href="practice.html" id="nav-practice" class="nav-link-custom">Practice</a></li>
        <li><a href="assessment.html" id="nav-assessment" class="nav-link-custom">Assessment</a></li>
        ${usuario.userRole === 'facilitator' ? '<li><a href="facilitator.html" id="nav-facilitator" class="nav-link-custom">Dashboard</a></li>' : ''}
      </ul>

      <div style="display: flex; align-items: center; gap: 15px; border-left: 1px solid #dee2e6; padding-left: 20px;">
        <div class="user-info" style="text-align: right; display: flex; flex-direction: column; justify-content: center;">
          <span class="user-name" style="font-weight: 600; font-size: 14px; color: #2d3748; margin: 0; line-height: 1.2;">${usuario.displayName}</span>
          <span class="user-role ${classEtiqueta}" style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 2px;">${rolEtiqueta}</span>
        </div>
        
        <img src="${usuario.photoURL}" alt="Profile" class="user-avatar" style="
            width: 42px; 
            height: 42px; 
            border-radius: 50%; 
            object-fit: cover; 
            border: 2px solid #28AD56;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        " onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.displayName)}&background=28AD56&color=fff'">
        
        <a href="#" id="nav-logout" style="
            background-color: #dc3545 !important; 
            color: white !important; 
            padding: 8px 14px; 
            border-radius: 20px; 
            text-decoration: none; 
            font-size: 13px; 
            font-weight: 600;
            transition: background-color 0.2s;
        ">Log Out</a>
      </div>
    </nav>

    <style>
      .nav-link-custom {
        color: #4a5568 !important;
        text-decoration: none !important;
        font-weight: 600 !important;
        font-size: 15px !important;
        padding: 8px 16px !important;
        border-radius: 20px !important;
        display: inline-block !important;
        transition: all 0.2s ease;
      }
      .nav-link-custom:hover {
        background-color: #f7fafc !important;
        color: #28AD56 !important;
      }
      /* Estilo dinámico para la pestaña activa en color Verde (#28AD56) */
      .nav-link-custom.active {
        background-color: #28AD56 !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(40, 173, 86, 0.3) !important;
      }
      #nav-logout:hover {
        background-color: #bd2130 !important;
      }
    </style>
  `;

  // --- El resto del código para inyectar el footer y los listeners de Logout/Active se mantiene igual ---
  const footerHTML = `
    <footer style="background-color: #ffffff; border-top: 1px solid #e9ecef; padding: 20px 0; margin-top: 50px; text-align: center; color: #555555; font-size: 14px;">
        <div class="content-container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #28AD56;">
                © ${new Date().getFullYear()} Objeto Virtual de Aprendizaje (OVA) - Todos los derechos reservados.
            </p>
            <p style="margin: 0 0 12px 0; font-size: 15px;">
                Desarrollado por: <strong>José Antonio Torres Osorio</strong> <br>
                <span style="color: #777; font-size: 13px;">Intérprete Profesional & Analista de Tecnología Educativa</span>
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; font-size: 13px;">
                <a href="mailto:zS023002154@estudiantes.uv.mx" style="color: #28AD56; text-decoration: none; font-weight: bold;">✉️ zS023002154@estudiantes.uv.mx</a>
                <span style="color: #ccc;">|</span>
                <a href="https://github.com/JoseAntonioTorres" target="_blank" style="color: #28AD56; text-decoration: none; font-weight: bold;">💻 GitHub Pages</a>
            </div>
        </div>
    </footer>
  `;
  if (!document.querySelector('footer')) {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  const paginaActual = window.location.pathname.split("/").pop().replace(".html", "");
  const linkActivo = document.getElementById(`nav-${paginaActual}`);
  if (linkActivo) linkActivo.classList.add('active');

  const btnLogout = document.getElementById('nav-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      signOut(auth).then(() => {
        window.location.href = "../index.html";
      }).catch((err) => console.error("Error al cerrar sesión:", err));
    });
  }
}

// ==========================================
// RASTREADOR DE TIEMPO DE USO
// ==========================================
let startTime = Date.now();
function guardarTiempoFailsafe() {
  if (!auth.currentUser) return;
  const endTime = Date.now();
  const secondsSpent = Math.floor((endTime - startTime) / 1000);
  if (secondsSpent >= 2) {
    const userRef = doc(db, "users", auth.currentUser.uid);
    setDoc(userRef, {
      analytics: {
        totalTimeSpent: increment(secondsSpent),
        lastActive: new Date().toISOString()
      }
    }, { merge: true }).catch((err) => console.error(err));
    startTime = Date.now();
  }
}
window.addEventListener("beforeunload", guardarTiempoFailsafe);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") guardarTiempoFailsafe(); });