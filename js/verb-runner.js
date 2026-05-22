// js/verb-runner.js
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "./vocabulary.js";

export function startRunnerGame(currentUser, scoresCollection) {
    const canvas = document.getElementById("runnerCanvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");

    let gameActive = true;
    let animationId = null;
    
    // --- ESTADO DEL JUEGO PROGRESIVO ---
    let score = 0;
    let lives = 3;
    let hasShield = false;
    let baseSpeed = 1.8; // SOLICITUD: Velocidad reducida significativamente para dar más tiempo de lectura
    let currentLevel = 1;
    let distanceTraveled = 0;

    // --- CONFIGURACIÓN DE CARRILES VERTICALES ---
    const numCarriles = 4;
    const carrilWidth = canvas.width / numCarriles; // 500 / 4 = 125px cada uno

    // --- JUGADOR (DIBUJO DE CORREDOR) ---
    const player = {
        carril: 1, 
        x: 0,      
        y: canvas.height - 95, 
        width: 40,
        height: 65,
        color: "#18529D"
    };

    // Para la animación del braceo/zancada del dibujo del corredor
    let animationFrameCounter = 0;

    let fallingElements = [];
    let spawnTimer = 0;

    function generarDistractor(verboCorrecto) {
        if (verboCorrecto.endsWith("t")) return verboCorrecto + "ed";
        if (verboCorrecto.endsWith("e")) return verboCorrecto + "d";
        return verboCorrecto + "ed";
    }

    function spawnElements() {
        const esPowerUp = Math.random() < 0.15; 

        if (esPowerUp) {
            const tipoItem = Math.random() > 0.5 ? "shield" : "life";
            const carrilAleatorio = Math.floor(Math.random() * numCarriles);
            fallingElements.push({
                type: "powerup",
                itemType: tipoItem,
                carril: carrilAleatorio,
                y: -50,
                width: 40,
                height: 40,
                text: tipoItem === "shield" ? "🛡️" : "❤️",
                passed: false
            });
        } else {
            const randomVerb = verbPool[Math.floor(Math.random() * verbPool.length)];
            const usarPasado = Math.random() > 0.5;
            const respuestaCorrecta = usarPasado ? randomVerb.past : randomVerb.participle;
            const distractor = generarDistractor(respuestaCorrecta);

            const pistaClue = `Form: ${usarPasado ? 'Past' : 'Participle'} of '${randomVerb.infinitive.toUpperCase()}'`;
            
            const carrilCorrecto = Math.floor(Math.random() * numCarriles);
            let carrilIncorrecto = Math.floor(Math.random() * numCarriles);
            while (carrilIncorrecto === carrilCorrecto) {
                carrilIncorrecto = Math.floor(Math.random() * numCarriles);
            }

            // Elemento de texto correcto
            fallingElements.push({
                type: "verb",
                isCorrect: true,
                clue: pistaClue,
                text: respuestaCorrecta,
                carril: carrilCorrecto,
                y: -60,
                width: carrilWidth - 10,
                height: 40,
                passed: false
            });

            // Elemento de texto incorrecto
            fallingElements.push({
                type: "verb",
                isCorrect: false,
                clue: pistaClue,
                text: distractor,
                carril: carrilIncorrecto,
                y: -60,
                width: carrilWidth - 10,
                height: 40,
                passed: false
            });
        }
    }

    // --- CONTROLES DE ENTRADA ---
    function handleKeyDown(e) {
        if (!gameActive) return;
        if (e.key === "ArrowLeft" && player.carril > 0) {
            player.carril--;
        } else if (e.key === "ArrowRight" && player.carril < numCarriles - 1) {
            player.carril++;
        }
    }

    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
        if (!gameActive) return;
        const touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;

        if (Math.abs(diffX) > 35) {
            if (diffX > 0 && player.carril < numCarriles - 1) {
                player.carril++; 
            } else if (diffX < 0 && player.carril > 0) {
                player.carril--; 
            }
        }
    }

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    // --- FÍSICA Y ACTUALIZACIÓN ---
    function update() {
        if (!gameActive) return;

        animationFrameCounter++;

        // Transición lateral suavizada del corredor
        const targetX = (player.carril * carrilWidth) + (carrilWidth / 2) - (player.width / 2);
        player.x += (targetX - player.x) * 0.22;

        // Progresión de dificultad atenuada por distancia
        distanceTraveled++;
        if (distanceTraveled % 600 === 0) {
            currentLevel++;
            baseSpeed += 0.5; // Incrementos más pequeños para mantener la velocidad amigable
        }

        spawnTimer++;
        const spawnInterval = Math.max(80, 180 - (currentLevel * 8)); 
        if (spawnTimer > spawnInterval) {
            spawnElements();
            spawnTimer = 0;
        }

        for (let i = fallingElements.length - 1; i >= 0; i--) {
            const el = fallingElements[i];
            el.y += baseSpeed; 

            const elX = (el.carril * carrilWidth) + (carrilWidth / 2) - (el.width / 2);

            // Caja de colisión
            if (!el.passed && 
                el.y + el.height >= player.y && 
                el.y <= player.y + player.height && 
                elX + el.width >= player.x && 
                elX <= player.x + player.width) {
                
                el.passed = true;

                if (el.type === "powerup") {
                    if (el.itemType === "shield") hasShield = true;
                    else if (el.itemType === "life") lives++;
                    fallingElements.splice(i, 1);
                    continue;
                }

                if (el.type === "verb") {
                    if (el.isCorrect) {
                        score += 10 * currentLevel;
                    } else {
                        if (hasShield) {
                            hasShield = false; 
                        } else {
                            lives--;
                            if (lives <= 0) {
                                gameOver();
                                return;
                            }
                        }
                    }
                    fallingElements = fallingElements.filter(item => item.clue !== el.clue);
                    break;
                }
            }

            if (el.y > canvas.height) {
                fallingElements.splice(i, 1);
            }
        }
    }

    // --- FUNCIÓN DE VECTOR: DIBUJAR CORREDOR EN LÍNEA ---
    function dibujarCorredor(x, y, w, h) {
        ctx.save();
        ctx.strokeStyle = hasShield ? "#00a8ff" : "#18529D";
        ctx.fillStyle = hasShield ? "#00a8ff" : "#18529D";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Parámetro oscilante basado en frames para simular el braceo y zancada
        const oscilacion = Math.sin(animationFrameCounter * 0.15);

        // Centro relativo del dibujo
        const cx = x + w / 2;
        
        // 1. Cabeza
        ctx.beginPath();
        ctx.arc(cx, y + 10, 6, 0, Math.PI * 2);
        ctx.fill();

        // 2. Torso (Inclinado hacia adelante para denotar velocidad)
        ctx.beginPath();
        ctx.moveTo(cx, y + 16);
        ctx.lineTo(cx - 4, y + 38);
        ctx.stroke();

        // 3. Brazos
        // Brazo Delantero
        ctx.beginPath();
        ctx.moveTo(cx - 2, y + 20);
        ctx.lineTo(cx + 8 + (oscilacion * 4), y + 26);
        ctx.lineTo(cx + 4, y + 36 + (oscilacion * 2));
        ctx.stroke();

        // Brazo Trasero
        ctx.beginPath();
        ctx.moveTo(cx - 2, y + 20);
        ctx.lineTo(cx - 10 - (oscilacion * 4), y + 28);
        ctx.lineTo(cx - 6, y + 38 - (oscilacion * 2));
        ctx.stroke();

        // 4. Piernas (Efecto tijera alternado)
        // Pierna Izquierda
        ctx.beginPath();
        ctx.moveTo(cx - 4, y + 38);
        ctx.lineTo(cx + 8 * oscilacion, y + 50);
        ctx.lineTo(cx + 12 * oscilacion + 4, y + h);
        ctx.stroke();

        // Pierna Derecha
        ctx.beginPath();
        ctx.moveTo(cx - 4, y + 38);
        ctx.lineTo(cx - 8 * oscilacion, y + 50);
        ctx.lineTo(cx - 12 * oscilacion - 4, y + h);
        ctx.stroke();

        ctx.restore();
    }

    // --- RENDERIZADO EN PANTALLA ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Líneas divisorias de carriles (Líneas de carretera)
        ctx.strokeStyle = "#eef2f5";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 15]); 
        for (let i = 1; i < numCarriles; i++) {
            ctx.beginPath();
            ctx.moveTo(i * carrilWidth, 0);
            ctx.lineTo(i * carrilWidth, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]); 

        // 2. Dibujar elementos cayendo
        fallingElements.forEach(el => {
            const elX = (el.carril * carrilWidth) + (carrilWidth / 2);

            if (el.type === "powerup") {
                // El power-up conserva un pequeño círculo contenedor
                ctx.fillStyle = el.itemType === "shield" ? "#00a8ff" : "#ff4757";
                ctx.beginPath();
                ctx.arc(elX, el.y + el.height/2, el.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "#FFF";
                ctx.font = "20px Segoe UI";
                ctx.textAlign = "center";
                ctx.fillText(el.text, elX, el.y + el.height/2 + 7);
            } else {
                // SOLICITUD: Palabras sin cuadros de color. Texto puro y estilizado para lectura fácil.
                ctx.fillStyle = el.isCorrect ? "#28AD56" : "#dc3545"; // Verde para el correcto, Rojo para el distractor
                ctx.font = "bold 21px 'Segoe UI', sans-serif"; // Fuente nítida y grande
                ctx.textAlign = "center";
                
                // Agregamos un leve borde blanco de respaldo para asegurar legibilidad en cualquier pantalla
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 4;
                ctx.strokeText(el.text, elX, el.y + el.height/2 + 5);
                ctx.fillText(el.text, elX, el.y + el.height/2 + 5);

                // Pista unificada en la parte superior del Canvas
                if (el.y > 0 && el.y < canvas.height - 250) {
                    ctx.fillStyle = "#333";
                    ctx.font = "bold 15px 'Segoe UI'";
                    ctx.fillText(el.clue, canvas.width / 2, 35);
                }
            }
        });

        // 3. SOLICITUD: Dibujar el vector del dibujo animado del corredor
        dibujarCorredor(player.x, player.y, player.width, player.height);

        // Aura de escudo decorativa si se tiene activo
        if (hasShield) {
            ctx.strokeStyle = "rgba(0, 168, 255, 0.4)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, player.height/2 + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 4. HUD Superior
        ctx.textAlign = "left";
        ctx.fillStyle = "#333";
        ctx.font = "bold 15px Segoe UI";
        ctx.fillText(`✨ Score: ${score}`, 15, 25);
        ctx.fillText(`📈 Lvl: ${currentLevel}`, 15, 45);

        let heartString = "";
        for (let i = 0; i < lives; i++) heartString += "❤️";
        ctx.fillText(`Vidas: ${heartString}`, canvas.width - 130, 25);
        if (hasShield) {
            ctx.fillStyle = "#00a8ff";
            ctx.fillText("🛡️ Shield Active", canvas.width - 130, 45);
        }
    }

    function loop() {
        update();
        draw();
        if (gameActive) {
            animationId = requestAnimationFrame(loop);
        }
    }

    async function gameOver() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        alert(`💥 ¡Carrera Terminada!\nAlcanzaste el Nivel ${currentLevel}\nPuntuación Final: ${score} pts`);

        if (currentUser && score > 0) {
            const db = getFirestore();
            const docId = `${currentUser.uid}_runner`;
            const docRef = doc(db, "scoreboard", docId);

            try {
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists() || score > docSnap.data().score) {
                    await setDoc(docRef, {
                        name: currentUser.displayName || currentUser.email.split('@')[0],
                        score: score,
                        email: currentUser.email,
                        date: new Date().toISOString(),
                        gameType: "verb-runner"
                    }, { merge: true });
                    console.log("¡Nuevo récord registrado!");
                }
            } catch (err) {
                console.error("Error al registrar récord:", err);
            }
        }
    }

    loop();

    return {
        stop: () => {
            gameActive = false;
            cancelAnimationFrame(animationId);
            window.removeEventListener("keydown", handleKeyDown);
            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchend", handleTouchEnd);
        }
    };
}