import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Función auxiliar para gestionar y renderizar el estado de los botones de nivel
export function updateLevelButtons() {
    const maxUnlocked = parseInt(localStorage.getItem("invadersMaxLevel") || "1");
    
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`btn-lvl-${i}`);
        if (!btn) continue;

        if (i <= maxUnlocked) {
            btn.removeAttribute("disabled");
            btn.innerText = `Nivel ${i}`;
            // Destacar con el color de acento el nivel activo/disponible
            btn.style.backgroundColor = i === 1 ? "#18529D" : i === 2 ? "#28AD56" : "#ff9f43";
        } else {
            btn.setAttribute("disabled", "true");
            btn.innerText = `🔒 Nivel ${i}`;
            btn.style.backgroundColor = "#6c757d";
        }
    }
}

export function startInvadersGame(currentUser, scoresCollection, selectedLevel = 1) {
    const canvas = document.getElementById("invadersCanvas");
    const ctx = canvas.getContext("2d");

    // --- CONFIGURACIÓN DE DIFICULTAD REDUCIDA Y PROGRESIVA ---
    const levelConfigs = {
        1: { enemySpeedMin: 0.6, enemySpeedMax: 1.0, spawnInterval: 140, label: "Nivel 1: Cadete" },
        2: { enemySpeedMin: 0.9, enemySpeedMax: 1.4, spawnInterval: 110, label: "Nivel 2: Piloto" },
        3: { enemySpeedMin: 1.3, enemySpeedMax: 1.9, spawnInterval: 80,  label: "Nivel 3: Experto" }
    };

    const config = levelConfigs[selectedLevel] || levelConfigs[1];

    // Banco de palabras equilibrado
    const wordPool = [
        { text: "WENT", isCorrect: true }, { text: "GOED", isCorrect: false },
        { text: "EATEN", isCorrect: true }, { text: "ATED", isCorrect: false },
        { text: "BROKEN", isCorrect: true }, { text: "BROKED", isCorrect: false },
        { text: "WRITTEN", isCorrect: true }, { text: "WRITED", isCorrect: false },
        { text: "FLEW", isCorrect: true }, { text: "FLIED", isCorrect: false },
        { text: "BOUGHT", isCorrect: true }, { text: "BUYED", isCorrect: false },
        { text: "SPOKE", isCorrect: true }, { text: "SPEAKED", isCorrect: false }
    ];

    let score = 0;
    let lives = 3;
    let gameActive = true;
    let animationId = null;
    let spawnTimer = 0;

    const player = {
        x: canvas.width / 2 - 20,
        y: canvas.height - 40,
        width: 40,
        height: 25,
        speed: 5, // Velocidad de movimiento sutilmente suavizada
        movingLeft: false,
        movingRight: false
    };

    let lasers = [];
    let enemies = [];

    // Estilos visuales de los botones para reflejar cuál está seleccionado
    for(let i=1; i<=3; i++) {
        const b = document.getElementById(`btn-lvl-${i}`);
        if(b) b.style.outline = (i === selectedLevel) ? "3px solid #00ff66" : "none";
    }

    // --- CONTROLES ---
    function handleKeyDown(e) {
        if (e.key === "ArrowLeft" || e.key === "a") player.movingLeft = true;
        if (e.key === "ArrowRight" || e.key === "d") player.movingRight = true;
        if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            shootLaser();
        }
    }

    function handleKeyUp(e) {
        if (e.key === "ArrowLeft" || e.key === "a") player.movingLeft = false;
        if (e.key === "ArrowRight" || e.key === "d") player.movingRight = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function shootLaser() {
        if (!gameActive) return;
        lasers.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 12,
            speed: 6.5
        });
    }

    function spawnEnemy() {
        const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        enemies.push({
            text: randomWord.text,
            isCorrect: randomWord.isCorrect,
            x: Math.random() * (canvas.width - 110) + 20,
            y: -20,
            speed: config.enemySpeedMin + Math.random() * (config.enemySpeedMax - config.enemySpeedMin),
            width: ctx.measureText(randomWord.text).width + 20,
            height: 20
        });
    }

    // --- BUCLE PRINCIPAL ---
    function update() {
        if (!gameActive) return;

        if (player.movingLeft && player.x > 0) player.x -= player.speed;
        if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;

        lasers.forEach((laser, index) => {
            laser.y -= laser.speed;
            if (laser.y < 0) lasers.splice(index, 1);
        });

        spawnTimer++;
        if (spawnTimer >= config.spawnInterval) {
            spawnEnemy();
            spawnTimer = 0;
        }

        enemies.forEach((enemy, eIndex) => {
            enemy.y += enemy.speed;

            if (enemy.y > canvas.height) {
                enemies.splice(eIndex, 1);
                if (!enemy.isCorrect) {
                    lives--;
                    checkGameOver();
                } else {
                    score += 5;
                }
            }

            lasers.forEach((laser, lIndex) => {
                if (
                    laser.x < enemy.x + enemy.width &&
                    laser.x + laser.width > enemy.x &&
                    laser.y < enemy.y &&
                    laser.y + laser.height > enemy.y - 15
                ) {
                    lasers.splice(lIndex, 1);
                    enemies.splice(eIndex, 1);

                    if (!enemy.isCorrect) {
                        score += 10;
                    } else {
                        lives--;
                        checkGameOver();
                    }
                }
            });
        });
    }

    function draw() {
        ctx.fillStyle = "#050510";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estrellas de fondo
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        for (let i = 0; i < 25; i++) {
            let x = (i * 83) % canvas.width;
            let y = (i * 127) % canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }

        // Nave
        ctx.fillStyle = "#00ff66";
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();

        // Láseres
        ctx.fillStyle = "#ff3333";
        lasers.forEach(laser => ctx.fillRect(laser.x, laser.y, laser.width, laser.height));

        // Palabras enemigas
        ctx.font = "bold 15px Arial";
        ctx.textBaseline = "top";
        enemies.forEach(enemy => {
            ctx.fillStyle = "rgba(0, 162, 255, 0.12)";
            ctx.fillRect(enemy.x - 5, enemy.y - 4, ctx.measureText(enemy.text).width + 10, 24);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(enemy.text, enemy.x, enemy.y);
        });

        // HUD Textos
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px monospace";
        ctx.fillText(`SCORE: ${score}`, 15, 15);
        ctx.fillText(`MODO: ${config.label}`, 15, 35);
        
        let hearts = "";
        for(let i=0; i<lives; i++) hearts += "♥";
        ctx.fillStyle = "#ff3366";
        ctx.fillText(`LIVES: ${hearts || "GAME OVER"}`, canvas.width - 130, 15);

        if (!gameActive) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = lives <= 0 ? "#ff3355" : "#28AD56";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            
            if (lives <= 0) {
                ctx.fillText("¡JUEGO TERMINADO!", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "#ffffff";
                ctx.font = "15px Arial";
                ctx.fillText(`Conseguiste ${score} pts. ¡Sigue practicando para desbloquear más niveles!`, canvas.width / 2, canvas.height / 2 + 20);
            } else {
                ctx.fillText("¡NIVEL COMPLETADO! 🎉", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "#ffffff";
                ctx.font = "15px Arial";
                ctx.fillText("¡Has desbloqueado el siguiente reto! Selecciónalo arriba.", canvas.width / 2, canvas.height / 2 + 20);
            }
            ctx.textAlign = "left";
        }
    }

    function loop() {
        update();
        draw();
        
        // CONDICIÓN DE VICTORIA DEL NIVEL: Llegar a 50 puntos
        if (score >= 50 && selectedLevel < 3 && gameActive) {
            triggerLevelWin();
            return;
        }

        if (gameActive) {
            animationId = requestAnimationFrame(loop);
        }
    }

    function triggerLevelWin() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        
        const currentMax = parseInt(localStorage.getItem("invadersMaxLevel") || "1");
        if (selectedLevel === currentMax && currentMax < 3) {
            localStorage.setItem("invadersMaxLevel", (currentMax + 1).toString());
        }
        
        updateLevelButtons();
        draw();
        saveToFirestore();
    }

    async function checkGameOver() {
        if (lives <= 0) {
            gameActive = false;
            cancelAnimationFrame(animationId);
            draw();
            saveToFirestore();
        }
    }

    // guardar el puntaje por nivel en Firestore, pero solo si es mejor que el récord previo del alumno para ese nivel específico
async function saveToFirestore() {
    if (currentUser && score > 0) {
        const db = getFirestore();
        const gameId = `verb-invaders-lvl${selectedLevel}`;
        const docId = `${currentUser.uid}_${gameId}`;
        const docRef = doc(db, "scoreboard", docId);

        try {
            // Consultamos si ya existe un récord previo de este alumno en este nivel específico
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const prevData = docSnap.data();
                // Si la puntuación actual es menor o igual al récord guardado, no hacemos nada
                if (score <= prevData.score) {
                    console.log("Puntaje actual menor o igual al récord previo. No se sobrescribe.");
                    return;
                }
            }

            // Si es nuevo o superó su récord, guardamos
            await setDoc(docRef, {
                name: currentUser.displayName || currentUser.email.split('@')[0],
                score: score,
                email: currentUser.email,
                date: new Date().toISOString(),
                gameType: gameId
            }, { merge: true });
            
            console.log("¡Nuevo récord personal guardado con éxito!");
        } catch (error) {
            console.error("Error al registrar récord en Space Invaders:", error);
        }
    }
}

    loop();

    return {
        stop: () => {
            gameActive = false;
            cancelAnimationFrame(animationId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
    };
}