import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { verbPool } from "./vocabulary.js";

export function startMemoryGame(currentUser, scoresCollection) {
    const canvas = document.getElementById("memoryCanvas"); // Reutiliza el contenedor canvas existente
    const ctx = canvas.getContext("2d");

    let cards = [];
    let selectedCards = [];
    let score = 0;
    let pairsFound = 0;
    let comboMultiplier = 1;
    let gameActive = true;
    let animationId = null;

    // Ajustar dimensiones del Canvas para una cuadrícula cómoda de Memoria (4x4)
    canvas.width = 600;
    canvas.height = 600;

    const gridRows = 4;
    const gridCols = 4;
    const cardWidth = 120;
    const cardHeight = 120;
    const padding = 20;
    const startX = (canvas.width - (gridCols * (cardWidth + padding) - padding)) / 2;
    const startY = (canvas.height - (gridRows * (cardHeight + padding) - padding)) / 2;

    // --- CLASE CARTA ---
    class Card {
        constructor(text, type, matchId, x, y) {
            this.text = text;
            this.type = type; // 'infinitive' o 'conjugation'
            this.matchId = matchId; // ID para verificar pareja
            this.x = x;
            this.y = y;
            this.isFlipped = false;
            this.isMatched = false;
            this.flipAnimProgress = 0; // Para efectos visuales fluidos
        }

        draw() {
            ctx.save();
            ctx.translate(this.x + cardWidth / 2, this.y + cardHeight / 2);

            // Efecto de rotación 3D simulado al voltear
            let scaleX = Math.cos(this.flipAnimProgress * Math.PI / 2);
            ctx.scale(scaleX, 1);

            if (!this.isFlipped && !this.isMatched && this.flipAnimProgress === 0) {
                // Reverso de la carta
                ctx.fillStyle = "#18529D";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 3;
                this.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
                ctx.fill();
                ctx.stroke();

                // Detalle decorativo del reverso
                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.font = "bold 40px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("?", 0, 0);
            } else {
                // Anverso de la carta (Destapada)
                ctx.fillStyle = this.isMatched ? "#28AD56" : "#ffffff";
                ctx.strokeStyle = this.isMatched ? "#ffffff" : "#18529D";
                ctx.lineWidth = 3;
                this.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
                ctx.fill();
                ctx.stroke();

                // Texto del Verbo
                ctx.fillStyle = this.isMatched ? "#ffffff" : "#333333";
                ctx.font = "bold 15px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                // Ajuste de texto largo
                this.wrapText(this.text, 0, -5, cardWidth - 15, 18);
                
                // Tipo de conjugación en pequeño abajo
                ctx.fillStyle = this.isMatched ? "rgba(255,255,255,0.7)" : "#666666";
                ctx.font = "italic 11px Arial";
                ctx.fillText(this.type === "infinitive" ? "Infinitive" : "Target", 0, cardHeight / 2 - 15);
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
        // Mezclamos el repositorio y tomamos 8 verbos para rellenar una matriz de 16 cartas (8 parejas)
        let shuffledPool = [...verbPool].sort(() => Math.random() - 0.5);
        let selectedVerbs = shuffledPool.slice(0, 8);

        let setupCards = [];
        selectedVerbs.forEach((verb, index) => {
            // Evaluamos si usamos el pasado o participio del repositorio como contraparte
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
            // ¡Pareja Correcta!
            setTimeout(() => {
                card1.isMatched = true;
                card2.isMatched = true;
                selectedCards = [];
                pairsFound++;
                score += 20 * comboMultiplier;
                comboMultiplier++; // Incrementa racha de combo

                if (pairsFound === 8) {
                    endGame();
                }
            }, 500);
        } else {
            // Error de emparejamiento
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                selectedCards = [];
                comboMultiplier = 1; // Resetea combo
                score = Math.max(0, score - 5);
            }, 1200);
        }
    }

    // --- CICLO PRINCIPAL (RENDER) ---
    function update() {
        // Animaciones suaves de las cartas al voltearse
        cards.forEach(card => {
            if (card.isFlipped && card.flipAnimProgress < 1) {
                card.flipAnimProgress = Math.min(1, card.flipAnimProgress + 0.1);
            } else if (!card.isFlipped && card.flipAnimProgress > 0) {
                card.flipAnimProgress = Math.max(0, card.flipAnimProgress - 0.1);
            }
        });
    }

    function draw() {
        ctx.fillStyle = "#f4f6f9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar el set completo de cartas
        cards.forEach(card => card.draw());

        // Panel HUD Superior Integrado en Canvas
        ctx.fillStyle = "#333333";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Puntos: ${score}`, startX, 30);
        
        ctx.textAlign = "right";
        ctx.fillText(comboMultiplier > 1 ? `Combo: x${comboMultiplier} 🔥` : "", canvas.width - startX, 30);

        if (!gameActive) {
            ctx.fillStyle = "rgba(24, 82, 157, 0.95)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("¡Felicidades! Tablero Resuelto", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "18px Arial";
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
        cancelAnimationFrame(animationId);
        draw();

        if (currentUser && score > 0) {
            const db = getFirestore();
            const docId = `${currentUser.uid}_memory-game`;
            const docRef = doc(db, "scoreboard", docId);

            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && score <= docSnap.data().score) {
                    console.log("No superaste tu récord anterior.");
                    return;
                }

                await setDoc(docRef, {
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    score: score,
                    email: currentUser.email,
                    date: new Date().toISOString(),
                    gameType: "memory-game"
                }, { merge: true });

                console.log("Récord de Memoria actualizado en la nube.");
            } catch (e) {
                console.error("Error al guardar puntuación de Memoria:", e);
            }
        }
    }

    // Inicialización del ecosistema del juego
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