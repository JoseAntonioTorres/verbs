import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export function startPinballGame(currentUser, scoresCollection) {
    const canvas = document.getElementById("pinballCanvas");
    const ctx = canvas.getContext("2d");

    // --- BANCO DE VERBOS ---
    const verbPool = ["WENT", "BEGAN", "BROKEN", "BROUGHT", "EATEN", "FLEW", "WRITTEN", "SPOKE", "TAKEN"];
    let currentWord = "";
    let guessedLetters = [];
    let lives = 6; // Intentos clásicos del ahorcado
    let score = 0;
    let gameActive = true;
    let animationId = null;

    // --- FÍSICA Y ENTIDADES ---
    const gravity = 0.15;
    const ball = { x: 425, y: 550, vx: 0, vy: 0, radius: 10, inLauncher: true };
    const spring = { charge: 0, maxCharge: 15 };

    // Bumpers circulares con letras mutables
    let bumpers = [
        { x: 120, y: 220, radius: 35, letter: "A" },
        { x: 230, y: 160, radius: 35, letter: "E" },
        { x: 340, y: 220, radius: 35, letter: "O" },
        { x: 160, y: 340, radius: 35, letter: "T" },
        { x: 290, y: 340, radius: 35, letter: "N" }
    ];

    // Paletas (Flippers)
    const leftFlipper = { x: 130, y: 530, length: 70, angle: 0.3, targetAngle: 0.3, isLeft: true };
    const rightFlipper = { x: 300, y: 530, length: 70, angle: Math.PI - 0.3, targetAngle: Math.PI - 0.3, isLeft: false };

    // --- TECLADO ---
    const keys = { ArrowLeft: false, ArrowRight: false, ArrowDown: false };

    function keyDown(e) {
        if (e.key in keys) {
            e.preventDefault();
            keys[e.key] = true;
        }
    }
    function keyUp(e) {
        if (e.key in keys) {
            e.preventDefault();
            keys[e.key] = false;
        }
    }
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    // --- LÓGICA DEL JUEGO ---
    function initWord() {
        currentWord = verbPool[Math.floor(Math.random() * verbPool.length)];
        guessedLetters = [];
        rotateBumperLetters();
    }

    // Cambia las letras de los bumpers para obligar al alumno a calcular el tiro
    function rotateBumperLetters() {
        if (!gameActive) return;
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        // Asegurar que al menos un par de bumpers tengan letras de la palabra útil
        bumpers.forEach(bumper => {
            if (Math.random() > 0.4) {
                bumper.letter = currentWord[Math.floor(Math.random() * currentWord.length)];
            } else {
                bumper.letter = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        });
    }
    const letterInterval = setInterval(rotateBumperLetters, 4000);

    function checkLetter(letter) {
        if (guessedLetters.includes(letter)) return; // Ya evaluada
        guessedLetters.push(letter);

        if (currentWord.includes(letter)) {
            score += 15;
            // Comprobar si ya ganó la palabra completa
            const won = currentWord.split("").every(l => guessedLetters.includes(l));
            if (won) {
                score += 50; // Bonus por palabra resuelta
                initWord();
            }
        } else {
            lives--;
            score = Math.max(0, score - 5);
            if (lives <= 0) endGame();
        }
    }

    // --- ACTUALIZACIÓN DE FÍSICA ---
    function update() {
        if (!gameActive) return;

        // 1. Mecánica del Lanzador de Resorte
        if (ball.inLauncher) {
            ball.x = 425;
            if (keys.ArrowDown) {
                spring.charge = Math.min(spring.charge + 0.5, spring.maxCharge);
            } else if (spring.charge > 0) {
                // Disparo fulminante hacia arriba
                ball.vy = -spring.charge;
                ball.vx = -1 - Math.random() * 2; // Desviación ligera a la izquierda
                ball.inLauncher = false;
                spring.charge = 0;
            }
            ball.y = 550 + spring.charge;
        } else {
            // Aplicar gravedad ordinaria
            ball.vy += gravity;
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Fricción ambiental menor
            ball.vx *= 0.995;
            ball.vy *= 0.995;
        }

        // 2. Límites y Colisiones con Paredes
        if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -0.7; }
        if (ball.x + ball.radius > canvas.width && !ball.inLauncher) { ball.x = canvas.width - ball.radius; ball.vx *= -0.7; }
        if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= -0.7; }

        // Si cae al sumidero de abajo
        if (ball.y > canvas.height) {
            ball.inLauncher = true;
            ball.vx = 0; ball.vy = 0;
        }

        // 3. Control de Ángulo de los Flippers
        leftFlipper.targetAngle = keys.ArrowLeft ? -0.4 : 0.3;
        rightFlipper.targetAngle = keys.ArrowRight ? Math.PI + 0.4 : Math.PI - 0.3;

        leftFlipper.angle += (leftFlipper.targetAngle - leftFlipper.angle) * 0.3;
        rightFlipper.angle += (rightFlipper.targetAngle - rightFlipper.angle) * 0.3;

        // 4. Colisiones con Bumpers Círculo-Círculo
        bumpers.forEach(bumper => {
            let dx = ball.x - bumper.x;
            let dy = ball.y - bumper.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + bumper.radius) {
                // Calcular vector normal de rebote elástico con fuerza añadida
                let nx = dx / distance;
                let ny = dy / distance;

                // Reposicionar bola fuera del bumper
                ball.x = bumper.x + nx * (ball.radius + bumper.radius);

                // Reflejar velocidad vectorial
                let dot = ball.vx * nx + ball.vy * ny;
                ball.vx = (ball.vx - 2 * dot * nx) * 1.3;
                ball.vy = (ball.vy - 2 * dot * ny) * 1.3;

                // Ejecutar validación académica de la letra golpeada
                checkLetter(bumper.letter);
            }
        });

        // 5. Colisión simplificada con Flippers (Segmentos de Línea)
        const checkFlipperCollision = (f) => {
            let tipX = f.x + Math.cos(f.angle) * f.length;
            let tipY = f.y + Math.sin(f.angle) * f.length;

            // Distancia del punto (bola) al segmento
            let l2 = f.length * f.length;
            let t = ((ball.x - f.x) * (tipX - f.x) + (ball.y - f.y) * (tipY - f.y)) / l2;
            t = Math.max(0, Math.min(1, t));

            let projX = f.x + t * (tipX - f.x);
            let projY = f.y + t * (tipY - f.y);

            let dist = Math.sqrt((ball.x - projX) ** 2 + (ball.y - projY) ** 2);
            if (dist < ball.radius + 5) {
                ball.vy = -5;
                ball.vx += f.isLeft ? (keys.ArrowLeft ? -4 : 1) : (keys.ArrowRight ? 4 : -1);
            }
        };
        checkFlipperCollision(leftFlipper);
        checkFlipperCollision(rightFlipper);
    }

    // --- DISEÑO INTERFAZ Y RENDER ---
    function draw() {
        // Fondo Retro de Pinball Electrónico
        ctx.fillStyle = "#110b29";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pared divisoria del carril de lanzamiento derecho
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(405, 120); ctx.lineTo(405, 600); ctx.stroke();

        // RENDER DE LA PALABRA OCULTA (Estilo Ahorcado)
        ctx.fillStyle = "#00ffcc";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";

        let displayWord = currentWord.split("").map(l => guessedLetters.includes(l) ? l : "_").join(" ");
        ctx.fillText(displayWord, canvas.width / 2 - 20, 50);

        // Dibujar los Bumpers de letras
        bumpers.forEach(bumper => {
            let color = currentWord.includes(bumper.letter) ? "rgba(0, 255, 150, 0.2)" : "rgba(255, 0, 100, 0.15)";
            let strokeColor = currentWord.includes(bumper.letter) ? "#00ff96" : "#ff0064";

            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.stroke();

            // Texto de la Letra interna
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Arial";
            ctx.textBaseline = "middle";
            ctx.fillText(bumper.letter, bumper.x, bumper.y);
        });
        ctx.textBaseline = "normal"; // Reset

        // Dibujar los Flippers
        ctx.strokeStyle = "#ff9f43";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";

        // Flipper Izquierdo
        ctx.beginPath(); ctx.moveTo(leftFlipper.x, leftFlipper.y);
        ctx.lineTo(leftFlipper.x + Math.cos(leftFlipper.angle) * leftFlipper.length, leftFlipper.y + Math.sin(leftFlipper.angle) * leftFlipper.length);
        ctx.stroke();

        // Flipper Derecho
        ctx.beginPath(); ctx.moveTo(rightFlipper.x, rightFlipper.y);
        ctx.lineTo(rightFlipper.x + Math.cos(rightFlipper.angle) * rightFlipper.length, rightFlipper.y + Math.sin(rightFlipper.angle) * rightFlipper.length);
        ctx.stroke();

        // Dibujar la Bola de Acero
        ctx.fillStyle = "#e6e6fa";
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
        // Brillo metálico en la bola
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(ball.x - 3, ball.y - 3, 3, 0, Math.PI * 2); ctx.fill();

        // HUD Superior Informativo
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Puntos: ${score}`, 20, 100);
        ctx.fillText(`Intentos: ${"❤️".repeat(lives) || "❌"}`, 20, 120);

        // Pantalla de Game Over
        if (!gameActive) {
            ctx.fillStyle = "rgba(10, 5, 25, 0.9)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ff3366";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            ctx.fillText("FIN DE LA PARTIDA", canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillStyle = "#ffffff";
            ctx.font = "16px Arial";
            ctx.fillText(`Sincronizados: ${score} pts en el Scoreboard`, canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    function loop() {
        update();
        draw();
        if (gameActive) animationId = requestAnimationFrame(loop);
    }

    async function endGame() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        clearInterval(letterInterval);
        draw();

        if (currentUser && score > 0) {
            const db = getFirestore();
            const docId = `${currentUser.uid}_pinball-hangman`;
            const docRef = doc(db, "scoreboard", docId);

            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const prevData = docSnap.data();
                    if (score <= prevData.score) {
                        console.log("No supera el récord de Pinball anterior.");
                        return;
                    }
                }

                await setDoc(docRef, {
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    score: score,
                    email: currentUser.email,
                    date: new Date().toISOString(),
                    gameType: "pinball-hangman"
                }, { merge: true });

                console.log("Récord de Pinball actualizado.");
            } catch (e) {
                console.error("Error guardando score de pinball:", e);
            }
        }
    }

    // Arrancar ciclo
    initWord();
    loop();

    return {
        stop: () => {
            gameActive = false;
            cancelAnimationFrame(animationId);
            clearInterval(letterInterval);
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);
        }
    };
}