// Importa el objeto 'auth' compartido desde tu nuevo archivo de configuración
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
// Nota: Asegúrate de importar tu app inicializada de Firebase aquí

const auth = getAuth();

// Proteger la página
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Si no está autenticado, directo al index
    window.location.href = "../index.html";
  } else {
    // Si está autenticado, removemos una clase de carga si la hubiera
    document.body.classList.add('authorized');
    inyectarNavbar(user);
  }
});

// Función para inyectar la barra de navegación moderna dinámicamente en cada módulo
function inyectarNavbar(user) {
  const header = document.querySelector('header');
  if (!header) return;

  header.innerHTML = `
    <nav id="siteNav">
      <ul>
        <li><a href="introduction.html" id="nav-intro">Introduction</a></li>
        <li><a href="study.html" id="nav-study">Study</a></li>
        <li><a href="game.html" id="nav-game">Game</a></li>
        <li><a href="practice.html" id="nav-practice">Practice</a></li>
        <li><a href="assessment.html" id="nav-assessment">Assessment</a></li>
        <li><a href="#" id="nav-logout" style="background-color: #dc3545 !important;">Log Out</a></li>
      </ul>
    </nav>
  `;

  // Marcar la página activa en verde
  const paginaActual = window.location.pathname.split("/").pop().replace(".html", "");
  const linkActivo = document.getElementById(`nav-${paginaActual}`);
  if (linkActivo) linkActivo.classList.add('active');

  // Asignar función al botón de cerrar sesión
  document.getElementById('nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
      window.location.href = "../index.html";
    });
  });
}