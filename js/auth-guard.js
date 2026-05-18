// js/auth-guard.js
import { auth } from "../js/firebase-config.js"; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Guardián de ruta: Verifica el estado del alumno
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Si no está firmado, es expulsado al index público de la raíz
    window.location.href = "../index.html";
  } else {
    // Si es correcto, activa la vista del body e inyecta la barra superior
    document.body.classList.add('authorized');
    inyectarNavbar();
  }
});

// Generación e inyección dinámica del Navbar Moderno en los módulos hijos
function inyectarNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  header.innerHTML = `
    <nav id="siteNav">
      <ul>
        <li><a href="introduction.html" id="nav-introduction">Introduction</a></li>
        <li><a href="study.html" id="nav-study">Study</a></li>
        <li><a href="game.html" id="nav-game">Game</a></li>
        <li><a href="practice.html" id="nav-practice">Practice</a></li>
        <li><a href="assessment.html" id="nav-assessment">Assessment</a></li>
        <li><a href="#" id="nav-logout" style="background-color: #dc3545 !important; color: white !important;">Log Out</a></li>
      </ul>
    </nav>
  `;

  // Detecta en qué archivo está parado el alumno para iluminarlo en Verde (#28AD56)
  const paginaActual = window.location.pathname.split("/").pop().replace(".html", "");
  const linkActivo = document.getElementById(`nav-${paginaActual}`);
  if (linkActivo) linkActivo.classList.add('active');

  // Evento del botón de Log Out
  document.getElementById('nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
      window.location.href = "../index.html";
    });
  });
}