//auth-guard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// Importamos las funciones operativas directamente de la CDN oficial de Firestore
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

      // Extraemos el nombre del archivo de forma segura quitando parámetros o extensiones
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

function inyectarNavbar(usuario) {
  const header = document.querySelector('header');
  if (!header) return;

  const rolEtiqueta = usuario.userRole === "facilitator" ? "Facilitator" : "Student";
  const classEtiqueta = usuario.userRole === "facilitator" ? "badge-facilitator" : "badge-student";

  header.innerHTML = `
    <nav id="siteNav" class="navbar-container">
      
      <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul class="nav-menu" id="navMenu">
        <li><a href="introduction.html" id="nav-introduction" class="nav-link-custom">Introduction</a></li>
        <li><a href="study.html" id="nav-study" class="nav-link-custom">Study</a></li>
        <li><a href="game.html" id="nav-game" class="nav-link-custom">Game</a></li>
        <li><a href="practice.html" id="nav-practice" class="nav-link-custom">Practice</a></li>
        <li><a href="assessment.html" id="nav-assessment" class="nav-link-custom">Assessment</a></li>
        ${usuario.userRole === 'facilitator' ? '<li><a href="facilitator.html" id="nav-facilitator" class="nav-link-custom">Dashboard</a></li>' : ''}
      </ul>

      <div class="user-actions">
        
        <a href="profile.html" class="profile-trigger" title="Editar Perfil">
          <div class="user-info">
            <span class="user-name">${usuario.displayName}</span>
            <span class="user-role ${classEtiqueta}">${rolEtiqueta}</span>
          </div>
          
          <img src="${usuario.photoURL}" alt="Profile" class="user-avatar" 
            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.displayName)}&background=28AD56&color=fff'">
        </a>
        
        <a href="#" id="nav-logout" class="btn-logout">Log Out</a>
      </div>
    </nav>

    <style>
      /* --- Estilos Base y Desktop (Corregidos) --- */
      .navbar-container {
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px 40px; 
        background-color: #ffffff; 
        border-bottom: 2px solid #e9ecef;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .nav-menu {
        display: flex; 
        list-style: none; 
        margin: 0; 
        padding: 0; 
        gap: 8px; 
        align-items: center;
      }

      .nav-link-custom {
        color: rgba(255, 255, 255, 0.75) !important; /* Blanco suave translúcido para excelente contraste */
        text-decoration: none !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        padding: 8px 14px !important;
        border-radius: 20px !important;
        display: inline-block !important;
        transition: all 0.2s ease;
      }

      .nav-link-custom:hover {
        background-color: rgba(255, 255, 255, 0.15) !important; /* Brillo sutil de fondo al pasar el mouse */
        color: #ffffff !important; /* Blanco brillante al hacer hover */
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3) !important; /* Sombra luminosa al hacer hover */}

      .nav-link-custom.active {
        background-color: #28AD56 !important; /* Verde institucional para la pestaña activa */
        color: white !important;
        box-shadow: 0 2px 8px rgba(40, 173, 86, 0.4) !important;
      }

      .user-name {
        font-weight: 600; 
        font-size: 13px; 
        color: #ffffff; 
        margin: 0; 
        line-height: 1.2;
      }

      .menu-toggle span {
        width: 100%;
        height: 2px;
        background-color: #ffffff; /* Las líneas del menú hamburguesa en móvil ahora son blancas */
        transition: all 0.3s ease;
      }

      /* Acciones de Usuario */
      .user-actions {
        display: flex; 
        align-items: center; 
        gap: 15px; 
        border-left: 1px solid #dee2e6; 
        padding-left: 20px;
      }

      /* Disparador de Perfil (Avatar + Texto) */
      .profile-trigger {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none !important;
        color: inherit;
        padding: 6px 12px;
        border-radius: 25px;
        transition: background-color 0.2s ease, transform 0.1s ease;
      }

      .profile-trigger:hover {
        background-color: #727272;
        box-shadow: 0 2px 8px rgba(241, 234, 234, 0.89);
      }

      .user-info {
        text-align: right; 
        display: flex; 
        flex-direction: column; 
        justify-content: center;
      }


      .user-role {
        font-size: 9px; 
        font-weight: 700; 
        text-transform: uppercase; 
        margin-top: 2px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .badge-student {
        background-color: #e6fffa;
        color: #00a389;
      }

      .badge-facilitator {
        background-color: #ebf8ff;
        color: #2b6cb0;
      }

      .user-avatar {
        width: 38px; 
        height: 38px; 
        border-radius: 50%; 
        object-fit: cover; 
        border: 2px solid #28AD56;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: border-color 0.2s;
      }

      .profile-trigger:hover .user-avatar {
        border-color: #1e8741;
      }

      .btn-logout {
        background-color: #dc3545 !important; 
        color: white !important; 
        padding: 6px 12px; 
        border-radius: 20px; 
        text-decoration: none; 
        font-size: 12px; 
        font-weight: 600;
        transition: background-color 0.2s;
      }

      .btn-logout:hover {
        background-color: #bd2130 !important;
      }

      /* Botón de Menú Móvil (Hamburguesa) */
      .menu-toggle {
        display: none;
        flex-direction: column;
        justify-content: space-between;
        width: 22px;
        height: 16px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        z-index: 1001;
      }

      .menu-toggle span {
        width: 100%;
        height: 2px;
        background-color: #f5f5f5;
        transition: all 0.3s ease;
      }

      /* Animación del botón Hamburguesa transformándose en 'X' */
      .menu-toggle.open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      .menu-toggle.open span:nth-child(2) {
        opacity: 0;
      }
      .menu-toggle.open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }

      /* --- RESPONSIVO (MÓVILES Y TABLETS) --- */
      @media (max-width: 868px) {
        .nav-menu {
        position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background-color: #1a202c;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          border-bottom: 2px solid #e9ecef;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-in-out;
      }
      

        .menu-toggle {
          display: flex;
        }

              /* Clase activa para desplegar menú */
        .nav-menu.open {
          max-height: 300px;
        }

        .nav-menu li {
          width: 100%;
        }

        .nav-link-custom {
          display: block !important;
          width: 100%;
          border-radius: 0 !important;
          padding: 12px 25px !important;
          border-bottom: 1px solid #f7fafc;
        }

        .nav-link-custom.active {
          box-shadow: none !important;
        }

        /* Ajustes para compactar la sección de usuario en móviles */
        .user-actions {
          border-left: none;
          padding-left: 0;
          gap: 10px;
        }

        .user-info {
          display: none;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
        }

        .btn-logout {
          padding: 5px 10px;
          font-size: 11px;
        }
      }
    </style>
  `;

  // --- Inyección del Footer ---
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
                <a href="mailto:zS23002154@estudiantes.uv.mx" style="color: #28AD56; text-decoration: none; font-weight: bold;">✉️ zS23002154@estudiantes.uv.mx</a>
                <span style="color: #ccc;">|</span>
                <a href="https://github.com/JoseAntonioTorres" target="_blank" style="color: #28AD56; text-decoration: none; font-weight: bold;">💻 GitHub Pages</a>
            </div>
        </div>
    </footer>
  `;
  if (!document.querySelector('footer')) {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  // Activar link de la página actual
  const paginaActual = window.location.pathname.split("/").pop().replace(".html", "");
  const linkActivo = document.getElementById(`nav-${paginaActual}`);
  if (linkActivo) linkActivo.classList.add('active');

  // --- LÓGICA DEL MENÚ HAMBURGUESA (MÓVIL) ---
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Cerrar el menú si se hace click fuera de él
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
      }
    });
  }

  // Listener para Logout
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
// RASTREADOR DE TIEMPO DE USO (Optimizado con Dot Notation)
// ==========================================
let startTime = Date.now();
function guardarTiempoFailsafe() {
  if (!auth.currentUser) return;
  const endTime = Date.now();
  const secondsSpent = Math.floor((endTime - startTime) / 1000);
  if (secondsSpent >= 2) {
    const userRef = doc(db, "users", auth.currentUser.uid);

    // CORRECCIÓN: Usamos llaves con cadenas de ruta para actualizar exclusivamente el mapa de analíticas sin tocar lo demás
    setDoc(userRef, {
      "analytics.totalTimeSpent": increment(secondsSpent),
      "analytics.lastActive": new Date().toISOString()
    }, { merge: true }).catch((err) => console.error(err));

    startTime = Date.now();
  }
}
window.addEventListener("beforeunload", guardarTiempoFailsafe);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") guardarTiempoFailsafe(); });