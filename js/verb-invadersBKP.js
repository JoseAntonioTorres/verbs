import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "./vocabulary.js";

// Función auxiliar para gestionar y renderizar el estado de los botones de nivel
export function updateLevelButtons() {
    const maxUnlocked = parseInt(localStorage.getItem("invadersMaxLevel") || "1");
    
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`btn-lvl-${i}`);
        if (!btn) continue;

        if (i <= maxUnlocked) {
            btn.removeAttribute("disabled");
            btn.innerText = `Nivel ${i}`;
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

    // --- CONFIGURACIÓN DE DIFICULTAD ---
    const levelConfigs = {
        1: { enemySpeed: 0.6, fireRate: 0.004, rows: 2, cols: 4, name: "Present Perfect" },
        2: { enemySpeed: 0.9, fireRate: 0.007, rows: 3, cols: 5, name: "Past Simple" },
        3: { enemySpeed: 1.3, fireRate: 0.012, rows: 3, cols: 5, name: "Master Mix" }
    };

    const config = levelConfigs[selectedLevel] || levelConfigs[1];

    // Forzar proporciones estables en cualquier pantalla
    canvas.width = 800;
    canvas.height = 600;

    // --- VARIABLES DE CONTROL TEMPORAL (DELTA TIME) ---
    let lastTime = performance.now();

    // --- ESTADOS DEL JUEGO ---
    let player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 30,
        speed: 400, // Velocidad en píxeles por segundo (independiente de FPS)
        lives: 3
    };

    let keys = { ArrowLeft: false, ArrowRight: false, Space: false };
    // Soporte táctil móvil
    let touchX = null; 
    let isTouching = false;

    let bullets = [];
    let enemyBullets = [];
    let enemies = [];
    let particles = [];
    
    let score = 0;
    let gameActive = true;
    let targetVerb = null;
    let animationId = null;

    // Temporizador de disparo automatizado para móviles para balancear la experiencia
    let lastPlayerShot = 0;
    const playerShotDelay = 350; // ms entre disparos de la nave

       // --- INICIALIZACIÓN ---
    function initRound() {
        bullets = [];
        enemyBullets = [];
        enemies = [];
        
        // Seleccionar el verbo objetivo de la ronda
        const randomVerb = verbPool[Math.floor(Math.random() * verbPool.length)];
        
        if (selectedLevel === 1) {
            targetVerb = { question: `Dispara al Participio de: "${randomVerb.infinitive.toUpperCase()}"`, answer: randomVerb.participle.toUpperCase() };
        } else if (selectedLevel === 2) {
            targetVerb = { question: `Dispara al Pasado de: "${randomVerb.infinitive.toUpperCase()}"`, answer: randomVerb.past.toUpperCase() };
        } else {
            const usePart = Math.random() > 0.5;
            targetVerb = usePart 
                ? { question: `[MIX] Participio de: "${randomVerb.infinitive.toUpperCase()}"`, answer: randomVerb.participle.toUpperCase() }
                : { question: `[MIX] Pasado de: "${randomVerb.infinitive.toUpperCase()}"`, answer: randomVerb.past.toUpperCase() };
        }

        // Crear grilla de naves enemigas alienígenas
        const startX = 100;
        const startY = 80;
        const spacingX = 140;
        const spacingY = 50;

        // Asegurar que al menos un enemigo tenga la respuesta correcta
        let poolAnswers = [targetVerb.answer];
        while (poolAnswers.length < (config.rows * config.cols)) {
            const randomWrong = verbPool[Math.floor(Math.random() * verbPool.length)];
            const wrongWord = Math.random() > 0.5 ? randomWrong.past.toUpperCase() : randomWrong.participle.toUpperCase();
            if (wrongWord !== targetVerb.answer && !poolAnswers.includes(wrongWord)) {
                poolAnswers.push(wrongWord);
            }
        }
        // Mezclar respuestas
        poolAnswers.sort(() => Math.random() - 0.5);

        let answerIndex = 0;
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                enemies.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    width: 90,
                    height: 35,
                    word: poolAnswers[answerIndex] || "VERB",
                    isTarget: poolAnswers[answerIndex] === targetVerb.answer,
                    dir: 1
                });
                answerIndex++;
            }
        }
    }

    // --- GESTIÓN DE EVENTOS (TECLADO) ---
    function handleKeyDown(e) {
        if (e.code === "ArrowLeft") keys.ArrowLeft = true;
        if (e.code === "ArrowRight") keys.ArrowRight = true;
        if (e.code === "Space") keys.Space = true;
    }
    function handleKeyUp(e) {
        if (e.code === "ArrowLeft") keys.ArrowLeft = false;
        if (e.code === "ArrowRight") keys.ArrowRight = false;
        if (e.code === "Space") keys.Space = false;
    }

    // --- GESTIÓN DE EVENTOS (TÁCTIL MÓVIL) ---
    function handleTouchStart(e) {
        isTouching = true;
        updateTouchPos(e);
    }
    function handleTouchMove(e) {
        updateTouchPos(e);
    }
    function handleTouchEnd() {
        isTouching = false;
        touchX = null;
    }
    function updateTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        // Traducir coordenadas de pantalla a la resolución interna del canvas (800x600)
        touchX = (t.clientX - rect.left) * (canvas.width / rect.width);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    // --- MOTOR DE EFECTOS MÓVIL (LIGERO) ---
    function createExplosion(x, y, color) {
        // Reducido a 5 partículas para evitar sobrecargar la CPU del móvil
        for (let i = 0; i < 5; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                radius: Math.random() * 3 + 1,
                alpha: 1,
                color: color
            });
        }
    }

    // --- ACTUALIZACIÓN DE LÓGICA (CON DELTA TIME) ---
    function update(dt) {
        // Mover Nave (Teclado)
        if (keys.ArrowLeft) player.x -= player.speed * dt;
        if (keys.ArrowRight) player.x += player.speed * dt;

        // Mover Nave (Soporte Táctil Móvil)
        if (isTouching && touchX !== null) {
            const playerCenterX = player.x + player.width / 2;
            const diff = touchX - playerCenterX;
            // Zona muerta de 10px para evitar vibraciones en el dedo
            if (Math.abs(diff) > 10) {
                if (diff < 0) player.x -= player.speed * dt;
                else player.x += player.speed * dt;
            }
        }

        // Límites del escenario
        if (player.x < 0) player.x = 0;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

        // Gestión de Disparos Automática/Manual balanceada para móviles
        const now = performance.now();
        if (keys.Space || isTouching) {
            if (now - lastPlayerShot > playerShotDelay) {
                bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, vy: -500 });
                lastPlayerShot = now;
            }
        }

        // Actualizar Balas Aliadas
        bullets.forEach((b, index) => {
            b.y += b.vy * dt;
            if (b.y < 0) bullets.splice(index, 1);
        });

        // Actualizar Partículas
        particles.forEach((p, index) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= 1.5 * dt;
            if (p.alpha <= 0) particles.splice(index, 1);
        });

        // Actualizar Invasores
        let changeDir = false;
        enemies.forEach(e => {
            e.x += e.dir * config.enemySpeed * 100 * dt;
            if (e.x <= 10 || e.x + e.width >= canvas.width - 10) {
                changeDir = true;
            }
            // Disparo enemigo fortuito
            if (Math.random() < config.fireRate) {
                enemyBullets.push({ x: e.x + e.width / 2, y: e.y + e.height, vy: 250 });
            }
        });

        if (changeDir) {
            enemies.forEach(e => {
                e.dir *= -1;
                e.y += 20; // Bajan de nivel de cuadrícula
                if (e.y + e.height >= player.y) {
                    player.lives = 0; // Invasión total = Fin del juego
                }
            });
        }

        // Actualizar Balas Enemigas
        enemyBullets.forEach((eb, index) => {
            eb.y += eb.vy * dt;
            // Colisión con la Nave Jugador
            if (eb.x > player.x && eb.x < player.x + player.width &&
                eb.y > player.y && eb.y < player.y + player.height) {
                enemyBullets.splice(index, 1);
                player.lives--;
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#dc3545");
                if (player.lives <= 0) endGame();
            }
            if (eb.y > canvas.height) enemyBullets.splice(index, 1);
        });

        // Procesar Colisiones Bala-Invasor
        for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = bullets[bIdx];
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = enemies[eIdx];
                if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
                    bullets.splice(bIdx, 1);
                    
                    if (e.isTarget) {
                        // ¡Enemigo Correcto!
                        createExplosion(e.x + e.width / 2, e.y + e.height / 2, "#28AD56");
                        score += 100;
                        enemies.splice(eIdx, 1);
                        // Avanza la ronda de inmediato
                        initRound();
                    } else {
                        // Respuesta Errónea
                        createExplosion(e.x + e.width / 2, e.y + e.height / 2, "#dc3545");
                        score = Math.max(0, score - 25);
                        enemies.splice(eIdx, 1);
                        
                        // Si destruye el último clon y no queda el objetivo válido, rearmar ronda
                        if (enemies.length === 0 || !enemies.some(inv => inv.isTarget)) {
                            initRound();
                        }
                    }
                    break;
                }
            }
        }
    }

    // --- MOTOR DE RENDIMIENTO DE RENDER (DISEÑO PLANO LIGERO) ---
    function draw() {
        // Limpieza de Canvas rápida sin arrastrar capas pesadas
        ctx.fillStyle = "#0b132b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Renderizar Partículas de explosión
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Dibujar Nave Jugador (Vectorizado limpio sin texturas pesadas)
        ctx.fillStyle = "#00b4d8";
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.fill();

        // Alerones estéticos
        ctx.fillStyle = "#0077b6";
        ctx.fillRect(player.x, player.y + player.height - 8, 8, 8);
        ctx.fillRect(player.x + player.width - 8, player.y + player.height - 8, 8, 8);

        // Dibujar Balas Aliadas
        ctx.fillStyle = "#fffb00";
        bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));

        // Dibujar Balas Enemigas
        ctx.fillStyle = "#ff4757";
        enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, 4, 10));

        // Dibujar Invasores (Diseño plano optimizado)
        enemies.forEach(e => {
            ctx.fillStyle = "#1c2541";
            ctx.strokeStyle = "#5bc0be";
            ctx.lineWidth = 2;
            
            // Caja del Alien
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.strokeRect(e.x, e.y, e.width, e.height);

            // Texto tipográfico incorporado de forma segura y simplificada
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(e.word, e.x + e.width / 2, e.y + e.height / 2);
        });

        // --- INTERFAZ HUD SUPERIOR (ESTÁTICA) ---
        ctx.fillStyle = "rgba(28, 37, 65, 0.85)";
        ctx.fillRect(0, 0, canvas.width, 50);

        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Nivel ${selectedLevel}: ${config.name}`, 20, 28);
        ctx.fillText(`Puntos: ${score}`, 240, 28);

        // Mostrar Vidas en formato de barras limpias
        ctx.fillText("Vidas: ", canvas.width - 120, 28);
        ctx.fillStyle = "#00b4d8";
        for (let i = 0; i < player.lives; i++) {
            ctx.fillRect(canvas.width - 70 + (i * 15), 18, 10, 12);
        }

        // Banner Instruccional Central Destacado
        if (targetVerb) {
            ctx.fillStyle = "#fffb00";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.fillText(targetVerb.question, canvas.width / 2, 28);
        }

        // Pantalla de Game Over Interna
        if (!gameActive && player.lives <= 0) {
            ctx.fillStyle = "rgba(11, 19, 43, 0.95)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff4757";
            ctx.font = "bold 36px Arial";
            ctx.textAlign = "center";
            ctx.fillText("FIN DEL JUEGO", canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillStyle = "#ffffff";
            ctx.font = "18px Arial";
            ctx.fillText(`Puntuación obtenida: ${score} pts`, canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    // --- BUCLE PRINCIPAL REGULADO ---
    function loop() {
        const now = performance.now();
        // Calculamos el multiplicador Delta Time en fracciones de segundo
        let dt = (now - lastTime) / 1000;
        lastTime = now;

        // Evitar saltos físicos gigantescos si el juego cambia de pestaña
        if (dt > 0.1) dt = 0.1;

        update(dt);
        draw();
        
        if (gameActive) {
            animationId = requestAnimationFrame(loop);
        }
    }

    async function endGame() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        draw();

        const gameId = `verb-invaders-lvl${selectedLevel}`;

        if (currentUser && score > 0) {
            const db = getFirestore();
            const docId = `${currentUser.uid}_${gameId}`;
            const docRef = doc(db, "scoreboard", docId);

            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && score <= docSnap.data().score) {
                    console.log("Puntaje actual menor o igual al récord previo.");
                    return;
                }

                // Guardar nuevo récord
                await setDoc(docRef, {
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    score: score,
                    email: currentUser.email,
                    date: new Date().toISOString(),
                    gameType: gameId
                }, { merge: true });

                console.log("¡Nuevo récord personal guardado con éxito!");

                // Sistema de progresión automática
                const currentMax = parseInt(localStorage.getItem("invadersMaxLevel") || "1");
                if (selectedLevel === currentMax && currentMax < 3) {
                    localStorage.setItem("invadersMaxLevel", (currentMax + 1).toString());
                    updateLevelButtons(); // Sincroniza interfaz del HTML si está expuesta
                }
            } catch (error) {
                console.error("Error al registrar récord en Space Invaders:", error);
            }
        }
    }

    // --- EJECUCIÓN INICIAL ---
    initRound();
    loop();

    return {
        stop: () => {
            gameActive = false;
            cancelAnimationFrame(animationId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchmove", handleTouchMove);
            canvas.removeEventListener("touchend", handleTouchEnd);
        }
    };
}