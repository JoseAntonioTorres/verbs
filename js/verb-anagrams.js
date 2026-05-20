import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "./vocabulary.js"; // Importación unificada del repositorio real

let currentVerb = null;
let scrambledWord = "";
let score = 0;
let gameActive = true;

let currentUserRef = null;
let scoresCollectionRef = null;

// Función para mezclar las letras de la palabra (Anagrama)
function scramble(word) {
    let arr = word.split('');
    // Mezcla de Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    let scrambled = arr.join('');
    // Si por azar queda igual a la original, intentamos re-mezclar una vez
    if (scrambled === word && word.length > 1) {
        return scramble(word);
    }
    return scrambled;
}

// Inicializar o pasar a una nueva palabra en el juego
export function initAnagramsGame() {
    if (!gameActive) return;

    // Seleccionamos un verbo al azar del vocabulary.js de forma dinámica
    currentVerb = verbPool[Math.floor(Math.random() * verbPool.length)];
    
    // Determinamos de forma aleatoria si jugamos con el Pasado o el Participio
    const usePast = Math.random() > 0.5;
    const targetWord = usePast ? currentVerb.past.toUpperCase() : currentVerb.participle.toUpperCase();
    const modeText = usePast ? "PAST SIMPLE" : "PAST PARTICIPLE";

    scrambledWord = scramble(targetWord);

    // Actualizar elementos visuales del DOM de forma segura
    document.getElementById("anagramMode").innerText = `Modo: ${modeText} de "${currentVerb.infinitive.toUpperCase()}"`;
    document.getElementById("scrambledWord").innerText = scrambledWord;
    
    const inputField = document.getElementById("playerGuess");
    if (inputField) {
        inputField.value = "";
        inputField.focus();
    }
    
    document.getElementById("anagramFeedback").innerText = "";
    document.getElementById("anagramFeedback").className = "feedback";
}

// Verificar la respuesta del alumno
export function verifyAnswer() {
    if (!gameActive || !currentVerb) return;

    const playerGuess = document.getElementById("playerGuess").value.trim().toUpperCase();
    const modeText = document.getElementById("anagramMode").innerText;
    
    // Validamos contra la propiedad correcta basándonos en el modo activo de la ronda
    const isPastMode = modeText.includes("PAST SIMPLE");
    const correctAnswer = isPastMode ? currentVerb.past.toUpperCase() : currentVerb.participle.toUpperCase();

    const feedbackEl = document.getElementById("anagramFeedback");

    if (playerGuess === correctAnswer) {
        feedbackEl.innerText = "¡Excelente! Palabra correcta. 🎉";
        feedbackEl.className = "feedback success";
        score += 100;
        document.getElementById("anagramScore").innerText = score;
        
        // Pequeña pausa antes de cargar la siguiente palabra para que asimilen el éxito
        setTimeout(() => {
            initAnagramsGame();
        }, 1200);
    } else {
        feedbackEl.innerText = "Respuesta incorrecta. ¡Sigue intentando! ❌";
        feedbackEl.className = "feedback error";
        score = Math.max(0, score - 25); // Penalización ligera
        document.getElementById("anagramScore").innerText = score;
    }
}

// Función principal exportable para arrancar el ecosistema desde game.html
export function startAnagramsGame(currentUser, scoresCollection) {
    currentUserRef = currentUser;
    scoresCollectionRef = scoresCollection;
    
    // Resetear estados iniciales de sesión de juego
    score = 0;
    gameActive = true;
    document.getElementById("anagramScore").innerText = score;

    // Arrancar la primera palabra
    initAnagramsGame();

    // Retornamos el objeto destructor por si el usuario cambia de panel
    return {
        stop: async () => {
            gameActive = false;
            
            // Guardar récord en la nube al salir o cerrar el panel
            if (currentUserRef && score > 0) {
                const db = getFirestore();
                const docId = `${currentUserRef.uid}_anagrams`;
                const docRef = doc(db, "scoreboard", docId);

                try {
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && score <= docSnap.data().score) {
                        console.log("Puntaje menor o igual al récord de anagramas guardado.");
                        return;
                    }

                    await setDoc(docRef, {
                        name: currentUserRef.displayName || currentUserRef.email.split('@')[0],
                        score: score,
                        email: currentUserRef.email,
                        date: new Date().toISOString(),
                        gameType: "anagrams"
                    }, { merge: true });

                    console.log("¡Nuevo récord de Anagramas actualizado en Firestore!");
                } catch (e) {
                    console.error("Error al guardar récord de anagramas:", e);
                }
            }
        }
    };
}