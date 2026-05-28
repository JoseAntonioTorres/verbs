import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "./verbs.js"; 

let currentVerb = null;
let scrambledWord = "";
let score = 0;
let lives = 3;
let combo = 0;
let gameActive = true;

// Mecánica de Tiempo Adaptativo (Time Attack Evolutivo)
let timerInterval = null;
let baseTime = 25; // Empezamos con 25 segundos para dar confianza al alumno
let timeLeft = 25;

let currentUserRef = null;
let scoresCollectionRef = null;

// Mezcla Fisher-Yates garantizando cambio de orden
function scramble(word) {
    let arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    let scrambled = arr.join('');
    if (scrambled === word && word.length > 1) {
        return scramble(word);
    }
    return scrambled;
}

// Inicia el contador regresivo visual
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = Math.max(7, Math.round(baseTime)); // Nunca baja de un mínimo estricto de 7 segundos
    
    const timerDisplay = document.getElementById("timerDisplay");
    if (timerDisplay) {
        timerDisplay.innerText = `${timeLeft}s`;
        timerDisplay.style.color = "var(--accent-color)";
    }

    timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        if (timerDisplay) {
            timerDisplay.innerText = `${timeLeft}s`;
            if (timeLeft <= 4) {
                timerDisplay.style.color = "var(--danger-color)";
            }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    combo = 0; 
    lives--;
    updateHUD();
    
    alert(`⏳ ¡TIEMPO AGOTADO!\nLa respuesta correcta era: ${getCorrectAnswer()}`);

    if (lives <= 0) {
        endGame();
    } else {
        initAnagramsGame();
    }
}

function getCorrectAnswer() {
    if (!currentVerb) return "";
    return currentVerb._isPastMode ? currentVerb.past.toUpperCase() : currentVerb.participle.toUpperCase();
}

function updateHUD() {
    document.getElementById("currentScore").innerText = score;
    
    let hearts = "";
    for (let i = 0; i < lives; i++) hearts += "♥";
    const livesDisplay = document.getElementById("livesDisplay");
    if (livesDisplay) livesDisplay.innerText = hearts || "GAME OVER";
}

// Dibuja las letras como fichas interactuables
function renderLetterTiles(scrambled) {
    const container = document.getElementById("scrambledTilesContainer");
    if (!container) return;
    container.innerHTML = ""; 

    scrambled.split("").forEach((letter, index) => {
        const tile = document.createElement("span");
        tile.innerText = letter;
        tile.classList.add("retro-tile");
        tile.setAttribute("data-index", index);
        tile.setAttribute("data-letter", letter);
        
        tile.addEventListener("click", () => {
            handleTileClick(tile, letter);
        });

        container.appendChild(tile);
    });
}

function handleTileClick(tile, letter) {
    const inputField = document.getElementById("playerGuess");
    if (!inputField || !gameActive) return;

    let currentText = inputField.value.toUpperCase();

    if (!tile.classList.contains("tile-used")) {
        inputField.value = currentText + letter;
        tile.classList.add("tile-used");
    } else {
        const indexInInput = currentText.lastIndexOf(letter);
        if (indexInInput !== -1) {
            inputField.value = currentText.slice(0, indexInInput) + currentText.slice(indexInInput + 1);
        }
        tile.classList.remove("tile-used");
    }
    
    syncTilesWithInput(inputField.value);
}

function syncTilesWithInput(text) {
    const tiles = document.querySelectorAll(".retro-tile");
    const lettersUsed = text.toUpperCase().split("");

    tiles.forEach(tile => tile.classList.remove("tile-used"));

    lettersUsed.forEach(letter => {
        for (let tile of tiles) {
            if (!tile.classList.contains("tile-used") && tile.getAttribute("data-letter") === letter) {
                tile.classList.add("tile-used");
                break;
            }
        }
    });
}

// Selección y filtrado inteligente basado en la progresión de la racha del alumno
export function initAnagramsGame() {
    if (!gameActive || lives <= 0) return;

    // --- MECÁNICA DE PROGRESIÓN DE DIFICULTAD (SEGÚN RANGO DE COMBOS) ---
    // Filtramos dinámicamente el pool de verbos para entregar palabras cortas al principio y largas después
    let filteredPool = [];
    
    if (combo < 3) {
        // Nivel Inicial: Palabras súper cortas para arrancar el motor (3 a 4 letras)
        filteredPool = verbPool.filter(v => v.past.length <= 4 || v.participle.length <= 4);
    } else if (combo >= 3 && combo < 7) {
        // Nivel Intermedio: Verbos medianos estándar (5 a 6 letras)
        filteredPool = verbPool.filter(v => (v.past.length >= 5 && v.past.length <= 6) || (v.participle.length >= 5 && v.participle.length <= 6));
    } else {
        // Nivel Boss/Hardcore: Verbos largos y complejos (7 o más letras como 'thought', 'brought')
        filteredPool = verbPool.filter(v => v.past.length >= 7 || v.participle.length >= 7);
    }

    // Por si el pool real es pequeño en alguna categoría, respaldamos con el pool completo
    if (filteredPool.length === 0) filteredPool = verbPool;

    // Seleccionar verbo al azar del subconjunto filtrado
    currentVerb = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    
    const usePast = Math.random() > 0.5;
    currentVerb._isPastMode = usePast;
    
    const targetWord = usePast ? currentVerb.past.toUpperCase() : currentVerb.participle.toUpperCase();
    const modeText = usePast ? "PAST SIMPLE" : "PAST PARTICIPLE";

    scrambledWord = scramble(targetWord);

    // Actualizar datos del HUD potenciando visualmente el infinitivo central
    document.getElementById("anagramMode").innerText = modeText;
    
    // Inyección limpia: El infinitivo destaca y se remueve el label estático de traducción
    const verbInfinitiveEl = document.getElementById("verbInfinitive");
    verbInfinitiveEl.innerText = currentVerb.infinitive.toUpperCase();
    
    // Dejamos únicamente el significado limpio entre paréntesis como pista sutil secundaria
    document.getElementById("clueMeaning").innerText = `(${currentVerb.meaning || ''})`;

    // Dibujar las fichas interactivas
    renderLetterTiles(scrambledWord);
    
    const inputField = document.getElementById("playerGuess");
    if (inputField) {
        inputField.value = "";
        if (window.innerWidth > 768) {
            inputField.focus();
        }
    }
    
    updateHUD();
    startTimer();
}

export function verifyAnswer() {
    if (!gameActive || !currentVerb || lives <= 0) return;

    const playerGuess = document.getElementById("playerGuess").value.trim().toUpperCase();
    const correctAnswer = getCorrectAnswer();

    if (playerGuess === correctAnswer) {
        clearInterval(timerInterval);
        combo++;
        
        const comboBonus = (combo > 1) ? (combo * 10) : 0;
        score += 100 + comboBonus;
        
        // Reducimos progresivamente el tiempo base en 1.5 segundos con cada acierto exitoso
        baseTime = Math.max(7, baseTime - 1.5);
        
        document.querySelectorAll(".retro-tile").forEach(tile => {
            tile.style.backgroundColor = "var(--accent-color)";
            tile.style.color = "#000";
            tile.style.boxShadow = "0 0 15px var(--accent-color)";
        });

        setTimeout(() => {
            initAnagramsGame();
        }, 1100);

    } else {
        combo = 0; 
        lives--;
        // Si fallan, restauramos un poco el tiempo base para no asfixiar al alumno
        baseTime = Math.min(25, baseTime + 2.5);
        updateHUD();

        const container = document.getElementById("scrambledTilesContainer");
        container.style.transform = "translateX(10px)";
        setTimeout(() => container.style.transform = "translateX(-10px)", 50);
        setTimeout(() => container.style.transform = "translateX(0)", 100);

        alert(`❌ INCORRECTO\nLa respuesta correcta era: ${correctAnswer}`);

        if (lives <= 0) {
            clearInterval(timerInterval);
            endGame();
        } else {
            initAnagramsGame();
        }
    }
}

async function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("gameOverArea").style.display = "block";
    
    if (currentUserRef && score > 0) {
        const db = getFirestore();
        const docId = `${currentUserRef.uid}_anagrams`;
        const docRef = doc(db, "scoreboard", docId);

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && score <= docSnap.data().score) return;

            await setDoc(docRef, {
                name: currentUserRef.displayName || currentUserRef.email.split('@')[0],
                score: score,
                email: currentUserRef.email,
                date: new Date().toISOString(),
                gameType: "anagrams"
            }, { merge: true });

            console.log("🏆 ¡HI-SCORE guardado exitosamente!");
        } catch (e) {
            console.error("Error al procesar salvado:", e);
        }
    }
}

export function startAnagramsGame(currentUser, scoresCollection) {
    currentUserRef = currentUser;
    scoresCollectionRef = scoresCollection;
    
    score = 0;
    lives = 3;
    combo = 0;
    baseTime = 25; // Reiniciar velocidad original de la consola
    gameActive = true;

    document.getElementById("gameArea").style.display = "block";
    document.getElementById("gameOverArea").style.display = "none";

    initAnagramsGame();

    const inputField = document.getElementById("playerGuess");
    if (inputField) {
        inputField.addEventListener("input", (e) => {
            syncTilesWithInput(e.target.value);
        });
    }

    return {
        stop: () => {
            gameActive = false;
            clearInterval(timerInterval);
        }
    };
}