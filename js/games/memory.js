import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "../verbs.js";

export function startMemoryGame(currentUser, scoresCollection) {
    const canvas = document.getElementById("memoryCanvas");
    const ctx = canvas.getContext("2d");

    let cards = [];
    let selectedCards = [];
    let score = 0;
    let pairsFound = 0;
    let comboMultiplier = 1;
    let gameActive = true;
    let animationId = null;

    // Dimensiones óptimas para el canvas (4x4)
    canvas.width = 600;
    canvas.height = 600;

    const gridRows = 4;
    const gridCols = 4;
    const cardWidth = 115;  // Ajustado sutilmente para balancear márgenes
    const cardHeight = 115;
    const padding = 20;
    const startX = (canvas.width - (gridCols * (cardWidth + padding) - padding)) / 2;
    const startY = (canvas.height - (gridRows * (cardHeight + padding) - padding)) / 2;

    // --- CLASE CARTA ---
    class Card {
        constructor(text, type, matchId, x, y) {
            this.text = text;
            this.type = type; // 'infinitive' o 'conjugation'
            this.matchId = matchId;
            this.x = x;
            this.y = y;
            this.isFlipped = false;
            this.isMatched = false;
            this.flipAnimProgress = 0; // 0 = Cerrada (Reverso), 1 = Abierta (Anverso)
        }

        draw() {
            // OPTIMIZACIÓN CRÍTICA: Si la carta ya está emparejada y abierta, 
            // no necesita animarse ni calcular transformaciones pesadas.
            if (this.isMatched && this.flipAnimProgress === 1) {
                ctx.save();
                ctx.fillStyle = "#28AD56";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                this.roundRect(this.x, this.y, cardWidth, cardHeight, 12);
                ctx.fill();
                ctx.stroke();

                // Renderizado plano de texto estático (sin translate/scale)
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 13px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Pintamos el texto directamente en su posición final relativa al canvas
                this.wrapText(this.text, this.x + cardWidth / 2, this.y + cardHeight / 2 - 8, cardWidth - 12, 16);

                ctx.fillStyle = "rgba(255,255,255,0.75)";
                ctx.font = "italic 10px Arial";
                ctx.fillText(this.type === "infinitive" ? "Infinitive" : "Conjugation", this.x + cardWidth / 2, this.y + cardHeight - 15);
                ctx.restore();
                return;
            }

            // --- RENDERIZADO CON ANIMACIÓN (Para giros activos) ---
            ctx.save();
            ctx.translate(this.x + cardWidth / 2, this.y + cardHeight / 2);

            let scaleX = Math.cos(this.flipAnimProgress * Math.PI);
            let absScaleX = Math.abs(scaleX);

            if (absScaleX < 0.05) {
                ctx.restore();
                return;
            }

            ctx.scale(absScaleX, 1);

            // OPTIMIZACIÓN: Sombra ligera nativa (Reducida drásticamente de 8 a 3 para dispositivos móviles)
            ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
            ctx.shadowBlur = 3;
            ctx.shadowOffsetY = 2;

            if (this.flipAnimProgress < 0.5) {
                // REVERSO
                ctx.fillStyle = "#18529D";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                this.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
                ctx.fill();
                ctx.shadowColor = "transparent"; // Limpieza inmediata de sombra
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
                ctx.font = "bold 44px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("?", 0, 0);
            } else {
                // ANVERSO
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#18529D";
                ctx.lineWidth = 3;
                this.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
                ctx.fill();
                ctx.shadowColor = "transparent";
                ctx.stroke();

                ctx.fillStyle = "#222222";
                ctx.font = "bold 13px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                this.wrapText(this.text, 0, -8, cardWidth - 12, 16);

                ctx.fillStyle = "#666666";
                ctx.font = "italic 10px Arial";
                ctx.fillText(this.type === "infinitive" ? "Infinitive" : "Conjugation", 0, cardHeight / 2 - 15);
            }
            ctx.restore();
        }

        roundRect(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        wrapText(text, x, y, maxWidth, lineHeight) {
            let words = text.split(' ');
            let line = '';
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, y);
        }

        isClicked(mx, my) {
            return mx >= this.x && mx <= this.x + cardWidth && my >= this.y && my <= this.y + cardHeight;
        }
    }

    // --- PREPARACIÓN DEL TABLERO ---
    function initBoard() {
        let shuffledPool = [...verbPool].sort(() => Math.random() - 0.5);
        let selectedVerbs = shuffledPool.slice(0, 8);

        let setupCards = [];
        selectedVerbs.forEach((verb, index) => {
            let targetConjugation = (verb.past === verb.participle) ? verb.past : `${verb.past} / ${verb.participle}`;

            setupCards.push({ text: verb.infinitive.toUpperCase(), type: "infinitive", matchId: index });
            setupCards.push({ text: targetConjugation.toUpperCase(), type: "conjugation", matchId: index });
        });

        setupCards.sort(() => Math.random() - 0.5);

        let cardIndex = 0;
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                let x = startX + col * (cardWidth + padding);
                let y = startY + row * (cardHeight + padding);
                cards.push(new Card(setupCards[cardIndex].text, setupCards[cardIndex].type, setupCards[cardIndex].matchId, x, y));
                cardIndex++;
            }
        }
    }

    // --- CONTROL DE CLICKS ---
    function handleCanvasClick(e) {
        if (!gameActive || selectedCards.length >= 2) return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);

        for (let card of cards) {
            if (card.isClicked(mx, my) && !card.isFlipped && !card.isMatched) {
                card.isFlipped = true;
                selectedCards.push(card);

                if (selectedCards.length === 2) {
                    checkMatch();
                }
                break;
            }
        }
    }
    canvas.addEventListener("click", handleCanvasClick);

    function checkMatch() {
        let [card1, card2] = selectedCards;

        if (card1.matchId === card2.matchId) {
            // Pareja Correcta
            setTimeout(() => {
                card1.isMatched = true;
                card2.isMatched = true;
                selectedCards = [];
                pairsFound++;
                score += 20 * comboMultiplier;
                comboMultiplier++;

                if (pairsFound === 8) {
                    endGame();
                }
            }, 500);
        } else {
            // Error de emparejamiento (Espera prudente para memorizar)
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                selectedCards = [];
                comboMultiplier = 1;
                score = Math.max(0, score - 5);
            }, 1200);
        }
    }

    // --- CICLO DE ACTUALIZACIÓN INTEGRADO ---
    function update() {
        // Subir de 0.08 a 0.12 hace que la animación requiera menos frames totales, 
        // acelerando el giro de forma óptima en pantallas móviles.
        cards.forEach(card => {
            if (card.isFlipped && card.flipAnimProgress < 1) {
                card.flipAnimProgress = Math.min(1, card.flipAnimProgress + 0.12);
            } else if (!card.isFlipped && card.flipAnimProgress > 0) {
                card.flipAnimProgress = Math.max(0, card.flipAnimProgress - 0.12);
            }
        });
    }

    function draw() {
        ctx.fillStyle = "#f4f6f9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Renderizar cartas
        cards.forEach(card => card.draw());

        // HUD Superior
        ctx.fillStyle = "#333333";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Puntos: ${score}`, startX, 35);

        ctx.textAlign = "right";
        ctx.fillText(comboMultiplier > 1 ? `Combo: x${comboMultiplier} 🔥` : "", canvas.width - startX, 35);

        // Pantalla de Victoria Interna
        if (!gameActive) {
            ctx.fillStyle = "rgba(24, 82, 157, 0.96)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("¡Felicidades! Tablero Resuelto", canvas.width / 2, canvas.height / 2 - 20);

            ctx.font = "16px Arial";
            ctx.fillText(`Puntuación final: ${score} pts guardados`, canvas.width / 2, canvas.height / 2 + 20);
        }
    }

    function loop() {
        update();
        draw();
        if (gameActive) animationId = requestAnimationFrame(loop);
    }

    async function endGame() {
        gameActive = false;
        if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(animationId);
        draw();

        if (currentUser && score > 0) {
            const db = getFirestore();

            // 1. ESTRUCTURA ACTUAL: Guardar en la tabla general de posiciones (Scoreboard)
            const docIdScoreboard = `${currentUser.uid}_memory-game`;
            const scoreboardRef = doc(db, "scoreboard", docIdScoreboard);

            try {
                const docSnap = await getDoc(scoreboardRef);
                let esNuevoRecord = true;

                if (docSnap.exists() && score <= docSnap.data().score) {
                    console.log("No superaste tu récord anterior en el marcador global.");
                    esNuevoRecord = false;
                }

                if (esNuevoRecord) {
                    await setDoc(scoreboardRef, {
                        name: currentUser.displayName || currentUser.email.split('@')[0],
                        score: score,
                        email: currentUser.email,
                        date: new Date().toISOString(),
                        gameType: "memory-game"
                    }, { merge: true });
                    console.log("Récord de Memoria actualizado en la nube (Scoreboard).");
                }

                // ======================================================================
                // NUEVO AGREGADO: Sincronizar el puntaje con el expediente del Facilitador
                // ======================================================================
                // Aquí usamos directamente el UID del usuario como ID único del documento
                const progressRef = doc(db, "student_progress", currentUser.uid);

                // Leemos el progreso actual para no pisar un puntaje más alto guardado previamente
                const progressSnap = await getDoc(progressRef);
                let mapeoProgreso = {};

                // Verificamos si ya existía un récord de este juego en su perfil de alumno
                if (progressSnap.exists() && progressSnap.data().gameMemory) {
                    // Si el puntaje actual es mayor al que tenía registrado en su perfil, lo actualizamos
                    if (score > progressSnap.data().gameMemory) {
                        mapeoProgreso.gameMemory = score;
                    }
                } else {
                    // Si nunca había jugado, registramos su primer puntaje
                    mapeoProgreso.gameMemory = score;
                }

                // Si hay un dato nuevo que actualizar, hacemos un setDoc con merge seguro
                if (Object.keys(mapeoProgreso).length > 0 || !progressSnap.exists()) {
                    await setDoc(progressRef, {
                        studentName: currentUser.displayName || currentUser.email.split('@')[0],
                        studentEmail: currentUser.email,
                        gameMemory: score, // Campo directo que leerá el panel del Facilitador
                        lastActive: new Date().toISOString()
                    }, { merge: true });
                    console.log("Puntaje sincronizado con el Panel de Facilitadores.");
                }

            } catch (e) {
                console.error("Error al procesar las puntuaciones de Memoria:", e);
            }
        }
    }

    // Inicializar el motor del tablero
    initBoard();
    loop();

    return {
        stop: () => {
            gameActive = false;
            cancelAnimationFrame(animationId);
            canvas.removeEventListener("click", handleCanvasClick);
        }
    };
}