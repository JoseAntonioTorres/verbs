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
// Inyección dinámica del Footer con tus créditos profesionales
const footerHTML = `
    <footer style="
        background-color: #ffffff; 
        border-top: 1px solid #e9ecef; 
        padding: 20px 0; 
        margin-top: 50px; 
        text-align: center; 
        color: #555555; 
        font-size: 14px;
    ">
        <div class="content-container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: var(--primary-color);">
                © ${new Date().getFullYear()} Objeto Virtual de Aprendizaje (OVA) - Todos los derechos reservados.
            </p>
            <p style="margin: 0 0 12px 0; font-size: 15px;">
                Desarrollado por: <strong>José Antonio Torres Osorio</strong> <br>
                <span style="color: #777; font-size: 13px;">Intérprete Profesional & Analista de Tecnología Educativa</span>
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; font-size: 13px;">
                <a href="mailto:zS023002154@estudiantes.uv.mx" style="color: var(--accent-color); text-decoration: none; font-weight: bold;">✉️ zS023002154@estudiantes.uv.mx</a>
                <span style="color: #ccc;">|</span>
                <a href="https://github.com/JoseAntonioTorres" target="_blank" style="color: var(--accent-color); text-decoration: none; font-weight: bold;">💻 GitHub Pages</a>
            </div>
        </div>
    </footer>
`;

// Insertamos el footer al final del cuerpo de la página
document.body.insertAdjacentHTML('beforeend', footerHTML);

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