// invaders.js - ULTRA ARCADE VERSION
import { verbPool } from "../verbs.js";
import { saveGameRecord } from "../user-progress.js";

export function startInvadersGame(currentUser, scoresCollection) {

    const canvas = document.getElementById("invadersCanvas");
    const ctx = canvas.getContext("2d");

    // ===================================================
    // CONFIG
    // ===================================================

    const LANE_COUNT = 7;
    const LANE_WIDTH = canvas.width / LANE_COUNT;

    const PLAYER_Y = canvas.height - 70;

    const INITIAL_SPEED = 0.10;
    const SPEED_SCALE = 0.00018;

    const PLAYER_SMOOTH = 0.22;

    const SHOOT_COOLDOWN = 180;

    const MAX_INVADERS = 7;
    const MAX_SHIELD = 15;

    // ===================================================
    // SIDEBAR HUD ELEMENTS
    // ===================================================

    const hudInfinitive =
        document.getElementById("hudInfinitive");

    const hudTranslation =
        document.getElementById("hudTranslation");

    const hudScore =
        document.getElementById("hudScore");

    const hudCombo =
        document.getElementById("hudCombo");

    const hudLives =
        document.getElementById("hudLives");

    const hudNext =
        document.getElementById("hudNext");

    const hudShieldFill =
        document.getElementById("hudShieldFill");

    const hudShieldText =
        document.getElementById("hudShieldText");

    // ===================================================
    // STATE
    // ===================================================

    let score = 0;
    let lives = 3;
    let shield = MAX_SHIELD;

    let shieldFlash = 0;
    let hullFlash = 0;

    let combo = 0;
    let multiplier = 1;

    let shake = 0;

    let gameLoopId = null;

    let currentVerb = null;
    let playerAnswer = "";

    let invaders = [];
    let bullets = [];
    let enemyBullets = [];
    let particles = [];
    let stars = [];
    let powerUps = [];

    let bossMode = false;

    let lastShot = 0;

    // ===================================================
    // PLAYER
    // ===================================================

    let currentLane = 3;
    let targetLane = 3;

    let playerX =
        currentLane * LANE_WIDTH +
        LANE_WIDTH / 2 - 20;

    // ===================================================
    // CONTROLS
    // ===================================================

    const keys = {};

    function moveLeft() {
        targetLane = Math.max(0, targetLane - 1);
    }

    function moveRight() {
        targetLane = Math.min(LANE_COUNT - 1, targetLane + 1);
    }

    function handleKeyDown(e) {

        if (keys[e.key]) return;

        keys[e.key] = true;

        if (e.key === "ArrowLeft") {
            moveLeft();
        }

        if (e.key === "ArrowRight") {
            moveRight();
        }

        if (
            e.key === " " ||
            e.key === "Spacebar"
        ) {
            e.preventDefault();
            shoot();
        }
    }

    function handleKeyUp(e) {
        keys[e.key] = false;
    }

    window.addEventListener(
        "keydown",
        handleKeyDown
    );

    window.addEventListener(
        "keyup",
        handleKeyUp
    );

    // ===================================================
    // MOBILE CONTROLS
    // ===================================================

    const btnLeft =
        document.getElementById("btnLeft");

    const btnRight =
        document.getElementById("btnRight");

    const btnShoot =
        document.getElementById("btnShoot");

    btnLeft?.addEventListener(
        "touchstart",
        (e) => {
            e.preventDefault();
            moveLeft();
        },
        { passive: false }
    );

    btnRight?.addEventListener(
        "touchstart",
        (e) => {
            e.preventDefault();
            moveRight();
        },
        { passive: false }
    );

    btnShoot?.addEventListener(
        "touchstart",
        (e) => {
            e.preventDefault();
            shoot();
        },
        { passive: false }
    );

    btnLeft?.addEventListener(
        "click",
        moveLeft
    );

    btnRight?.addEventListener(
        "click",
        moveRight
    );

    btnShoot?.addEventListener(
        "click",
        shoot
    );

    // ===================================================
    // BACKGROUND STARS
    // ===================================================

    for (let i = 0; i < 120; i++) {

        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 2 + 0.3,
            size: Math.random() * 2
        });
    }

    // ===================================================
    // RANDOM VERB
    // ===================================================

    function selectRandomVerb() {

        const randomIndex =
            Math.floor(
                Math.random() * verbPool.length
            );

        currentVerb =
            verbPool[randomIndex];

        currentVerb.infinitive =
            currentVerb.infinitive.toUpperCase();

        currentVerb.target =
            (
                currentVerb.pastSimple ||
                currentVerb.past
            ).toUpperCase();
    }

    // ===================================================
    // UPDATE SIDEBAR HUD
    // ===================================================

    function updateHUD() {

        if (hudInfinitive) {
            hudInfinitive.textContent =
                currentVerb.infinitive;
        }

        if (hudTranslation) {
            hudTranslation.textContent =
                currentVerb.translation || "";
        }

        if (hudScore) {
            hudScore.textContent = score;
        }

        if (hudCombo) {
            hudCombo.textContent =
                `x${multiplier}`;
        }

        if (hudLives) {
            hudLives.textContent =
                "💗".repeat(lives);
        }

        if (hudNext) {

            const next =
                currentVerb.target[playerAnswer.length];

            hudNext.textContent =
                next || "-";
        }

        if (hudShieldFill) {

            const percent =
                (shield / MAX_SHIELD) * 100;

            hudShieldFill.style.width =
                `${percent}%`;
        }

        if (hudShieldText) {

            hudShieldText.textContent =
                `${shield} / ${MAX_SHIELD}`;
        }
    }

    // ===================================================
    // CREATE INVADER
    // ===================================================

    function createInvader(letter, guaranteed = false) {

        const lane =
            Math.floor(
                Math.random() * LANE_COUNT
            );

        const speed =
            INITIAL_SPEED +
            (score * SPEED_SCALE);

        invaders.push({

            lane,

            x:
                lane * LANE_WIDTH +
                LANE_WIDTH / 2 - 18,

            baseX:
                lane * LANE_WIDTH +
                LANE_WIDTH / 2 - 18,

            y: -40,

            width: 36,
            height: 36,

            letter,

            guaranteed,

            speed,

            wave:
                Math.random() *
                Math.PI * 2
        });
    }

    // ===================================================
    // SPAWN WAVE
    // ===================================================

    function spawnWave() {

        if (!currentVerb) return;

        const target =
            currentVerb.target;

        // CORRECT LETTERS

        for (let letter of target) {

            createInvader(
                letter,
                true
            );
        }

        // WRONG LETTERS

        const alphabet =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        function getExtraLettersCount() {

            if (score < 500) return 0;
            if (score < 1500) return 1;
            if (score < 3000) return 2;

            return 3;
        }

        const extra =
            getExtraLettersCount();

        for (let i = 0; i < extra; i++) {

            let randomLetter;

            do {

                randomLetter =
                    alphabet[
                    Math.floor(
                        Math.random() *
                        alphabet.length
                    )
                    ];

            } while (
                target.includes(randomLetter)
            );

            createInvader(randomLetter);
        }
    }

    // ===================================================
    // INIT ROUND
    // ===================================================

    function initVerbRound() {

        playerAnswer = "";

        invaders = [];
        bullets = [];
        enemyBullets = [];

        selectRandomVerb();
        spawnWave();

        updateHUD();
    }

    // ===================================================
    // SHOOT
    // ===================================================

    function shoot() {

        const now = Date.now();

        if (
            now - lastShot <
            SHOOT_COOLDOWN
        ) return;

        lastShot = now;

        bullets.push({

            x: playerX + 20,
            y: PLAYER_Y,

            speed: 10
        });
    }

    // ===================================================
    // PARTICLES
    // ===================================================

    function createExplosion(
        x,
        y,
        color = "#00ffff"
    ) {

        for (let i = 0; i < 14; i++) {

            particles.push({

                x,
                y,

                dx:
                    (Math.random() - 0.5) * 6,

                dy:
                    (Math.random() - 0.5) * 6,

                life: 30,

                color
            });
        }
    }

    // ===================================================
    // ENEMY SHOOT
    // ===================================================

    function enemyShoot(x, y) {

        enemyBullets.push({

            x,
            y,

            speed:
                4 + score * 0.0004
        });
    }

    // ===================================================
    // POWERUPS
    // ===================================================

    function maybeSpawnPowerUp(x, y) {

        if (Math.random() < 0.08) {

            const types = [
                "slow",
                "life",
                "multiplier",
                "shield"
            ];

            powerUps.push({

                x,
                y,

                type:
                    types[
                    Math.floor(
                        Math.random() *
                        types.length
                    )
                    ],

                speed: 2
            });
        }
    }

    // ===================================================
    // HIT LOGIC
    // ===================================================

    function evaluateHit(invader) {

        const nextLetter =
            currentVerb.target[
            playerAnswer.length
            ];

        // CORRECT HIT

        if (
            invader.letter ===
            nextLetter
        ) {

            playerAnswer +=
                invader.letter;

            combo++;

            multiplier =
                1 +
                Math.floor(combo / 5);

            score +=
                20 * multiplier;

            createExplosion(
                invader.x,
                invader.y
            );

            shake = 8;

            maybeSpawnPowerUp(
                invader.x,
                invader.y
            );

            // WORD COMPLETED

            if (
                playerAnswer ===
                currentVerb.target
            ) {

                score +=
                    250 * multiplier;

                combo += 5;

                if (
                    score % 1000 < 300
                ) {
                    bossMode = true;
                }

                initVerbRound();
            }

        } else {

            // WRONG HIT

            combo = 0;
            multiplier = 1;

            score =
                Math.max(
                    0,
                    score - 10
                );

            if (Math.random() < 0.45) {

                enemyShoot(
                    invader.x + 18,
                    invader.y + 36
                );
            }

            createExplosion(
                invader.x,
                invader.y,
                "#ff3355"
            );
        }

        updateHUD();
    }

    // ===================================================
    // UPDATE
    // ===================================================

    function update() {

        if (shieldFlash > 0) shieldFlash--;
        if (hullFlash > 0) hullFlash--;
        if (shake > 0) shake--;

        // SMOOTH MOVEMENT

        const desiredX =
            targetLane * LANE_WIDTH +
            LANE_WIDTH / 2 - 20;

        playerX +=
            (desiredX - playerX) *
            PLAYER_SMOOTH;

        // STARS

        stars.forEach(star => {

            star.y += star.speed;

            if (star.y > canvas.height) {

                star.y = 0;

                star.x =
                    Math.random() *
                    canvas.width;
            }
        });

        // PLAYER BULLETS

        bullets.forEach((bullet, bIndex) => {

            bullet.y -= bullet.speed;

            if (bullet.y < -20) {

                bullets.splice(
                    bIndex,
                    1
                );

                return;
            }

            invaders.forEach((invader, iIndex) => {

                if (

                    bullet.x > invader.x &&
                    bullet.x < invader.x + invader.width &&

                    bullet.y > invader.y &&
                    bullet.y < invader.y + invader.height

                ) {

                    evaluateHit(invader);

                    invaders.splice(
                        iIndex,
                        1
                    );

                    bullets.splice(
                        bIndex,
                        1
                    );
                }
            });
        });

        // ENEMY BULLETS

        enemyBullets.forEach((bullet, index) => {

            bullet.y += bullet.speed;

            if (
                bullet.y > canvas.height
            ) {

                enemyBullets.splice(
                    index,
                    1
                );

                return;
            }

            if (

                bullet.x > playerX &&
                bullet.x < playerX + 40 &&

                bullet.y > PLAYER_Y &&
                bullet.y < PLAYER_Y + 40

            ) {

                if (shield > 0) {

                    shield--;

                    shieldFlash = 8;
                    shake = 8;

                    createExplosion(
                        playerX + 20,
                        PLAYER_Y + 20,
                        "#00ccff"
                    );

                } else {

                    lives--;

                    shield = MAX_SHIELD;

                    hullFlash = 12;
                    shake = 18;

                    createExplosion(
                        playerX + 20,
                        PLAYER_Y + 20,
                        "#ff3355"
                    );
                }

                enemyBullets.splice(
                    index,
                    1
                );

                updateHUD();
            }
        });

        // PARTICLES

        particles.forEach((p, index) => {

            p.x += p.dx;
            p.y += p.dy;

            p.life--;

            if (p.life <= 0) {

                particles.splice(
                    index,
                    1
                );
            }
        });

        // POWERUPS

        powerUps.forEach((p, index) => {

            p.y += p.speed;

            if (

                p.x > playerX &&
                p.x < playerX + 40 &&

                p.y > PLAYER_Y &&
                p.y < PLAYER_Y + 40

            ) {

                if (p.type === "life") {
                    lives++;
                }

                if (p.type === "shield") {

                    shield =
                        Math.min(
                            MAX_SHIELD,
                            shield + 5
                        );
                }

                if (p.type === "slow") {

                    invaders.forEach(i => {
                        i.speed *= 0.6;
                    });
                }

                if (p.type === "multiplier") {
                    multiplier += 2;
                }

                powerUps.splice(index, 1);

                updateHUD();
            }
        });

        // INVADERS

        invaders.forEach((invader, iIndex) => {

            invader.y += invader.speed;

            invader.x =
                invader.baseX +
                Math.sin(
                    invader.y * 0.03 +
                    invader.wave
                ) * 12;

            const attackChance =
                0.0004 +
                (score * 0.00000012);

            if (
                Math.random() <
                attackChance
            ) {

                enemyShoot(
                    invader.x + 18,
                    invader.y + 18
                );
            }

            if (
                invader.y >
                canvas.height - 70
            ) {

                const nextNeeded =
                    currentVerb.target[
                    playerAnswer.length
                    ];

                if (
                    invader.letter ===
                    nextNeeded
                ) {

                    lives--;

                    shield = MAX_SHIELD;

                    hullFlash = 12;
                    shake = 18;

                    createExplosion(
                        playerX + 20,
                        PLAYER_Y + 20,
                        "#ff3355"
                    );

                    updateHUD();
                }

                invaders.splice(
                    iIndex,
                    1
                );
            }
        });

        // LOW INVADER CONTROL

        if (
            invaders.length <
            MAX_INVADERS
        ) {

            const alphabet =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            const nextNeeded =
                currentVerb.target[
                playerAnswer.length
                ];

            const neededCount =
                invaders.filter(
                    i => i.letter === nextNeeded
                ).length;

            if (neededCount < 1) {

                createInvader(
                    nextNeeded,
                    true
                );
            }

            if (Math.random() < 0.03) {

                createInvader(

                    alphabet[
                    Math.floor(
                        Math.random() *
                        alphabet.length
                    )
                    ]
                );
            }
        }

        // GAME OVER

        if (lives <= 0) {
            endGame();
        }
    }

    // ===================================================
    // DRAW SHIP
    // ===================================================

    function drawXWing(x, y) {

        if (shield > 0) {

            ctx.beginPath();

            ctx.arc(
                x + 20,
                y + 20,
                28 + Math.sin(Date.now() * 0.01) * 2,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                shieldFlash > 0
                    ? "#ffffff"
                    : "rgba(0,220,255,0.5)";

            ctx.lineWidth = 3;

            ctx.stroke();
        }

        ctx.strokeStyle =
            hullFlash > 0
                ? "#ff3355"
                : "#ffffff";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(x + 20, y);

        ctx.lineTo(x + 40, y + 40);

        ctx.lineTo(x + 20, y + 28);

        ctx.lineTo(x, y + 40);

        ctx.closePath();

        ctx.stroke();

        // Cockpit

        ctx.fillStyle =
            shieldFlash > 0
                ? "#ffffff"
                : "#00ffff";

        ctx.fillRect(
            x + 17,
            y + 10,
            6,
            12
        );

        // Engine

        ctx.fillStyle = "#ff6600";

        ctx.fillRect(
            x + 15,
            y + 36,
            10,
            6
        );
    }

    // ===================================================
    // DRAW
    // ===================================================

    function draw() {

        ctx.save();

        ctx.translate(
            (Math.random() - 0.5) * shake,
            (Math.random() - 0.5) * shake
        );

        // BACKGROUND

        ctx.fillStyle = "#050816";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // GRID

        ctx.strokeStyle =
            "rgba(0,255,255,0.08)";

        for (let i = 1; i < LANE_COUNT; i++) {

            ctx.beginPath();

            ctx.moveTo(
                i * LANE_WIDTH,
                0
            );

            ctx.lineTo(
                i * LANE_WIDTH,
                canvas.height
            );

            ctx.stroke();
        }

        // STARS

        ctx.fillStyle = "#ffffff";

        stars.forEach(star => {

            ctx.fillRect(
                star.x,
                star.y,
                star.size,
                star.size
            );
        });

        // MINI HUD

        ctx.fillStyle = "#00ffee";

        ctx.font =
            "bold 18px Courier New";

        ctx.fillText(
            `INFINITIVE: ${currentVerb.infinitive}`,
            24,
            34
        );

        // PROGRESS

        let xOffset = 24;

        ctx.font =
            "bold 26px Courier New";

        for (
            let i = 0;
            i < currentVerb.target.length;
            i++
        ) {

            const char =
                playerAnswer[i] || "_";

            if (playerAnswer[i]) {

                ctx.fillStyle = "#00ff99";

            } else if (
                i === playerAnswer.length
            ) {

                ctx.fillStyle = "#ffee00";

            } else {

                ctx.fillStyle = "#555";
            }

            ctx.fillText(
                char,
                xOffset,
                78
            );

            xOffset += 26;
        }

        ctx.fillStyle = "#ffee00";

        ctx.font =
            "bold 22px Courier New";

        ctx.fillText(
            `NEXT: ${currentVerb.target[playerAnswer.length]}`,
            24,
            112
        );

        ctx.fillStyle = "#999";

        ctx.font =
            "15px Courier New";

        ctx.fillText(
            "Shoot letters IN ORDER",
            24,
            138
        );

        // PLAYER

        drawXWing(
            playerX,
            PLAYER_Y
        );

        // PLAYER BULLETS

        ctx.fillStyle = "#00ff99";

        bullets.forEach(b => {

            ctx.fillRect(
                b.x,
                b.y,
                4,
                14
            );
        });

        // ENEMY BULLETS

        ctx.fillStyle = "#ff3355";

        enemyBullets.forEach(b => {

            ctx.fillRect(
                b.x,
                b.y,
                4,
                10
            );
        });

        // PARTICLES

        particles.forEach(p => {

            ctx.fillStyle = p.color;

            ctx.fillRect(
                p.x,
                p.y,
                3,
                3
            );
        });

        // POWERUPS

        powerUps.forEach(p => {

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                18 + Math.sin(Date.now() * 0.01) * 3,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(255,255,0,0.18)";

            ctx.fill();

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                12,
                0,
                Math.PI * 2
            );

            switch (p.type) {

                case "life":
                    ctx.fillStyle = "#ff3355";
                    break;

                case "shield":
                    ctx.fillStyle = "#00ccff";
                    break;

                case "slow":
                    ctx.fillStyle = "#aa66ff";
                    break;

                case "multiplier":
                    ctx.fillStyle = "#ffee00";
                    break;
            }

            ctx.fill();

            ctx.fillStyle = "#ffffff";

            ctx.font =
                "bold 14px Arial";

            ctx.textAlign = "center";

            ctx.textBaseline = "middle";

            let icon = "?";

            switch (p.type) {

                case "life":
                    icon = "❤";
                    break;

                case "shield":
                    icon = "🛡";
                    break;

                case "slow":
                    icon = "❄";
                    break;

                case "multiplier":
                    icon = "×";
                    break;
            }

            ctx.fillText(
                icon,
                p.x,
                p.y
            );
        });

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // INVADERS

        invaders.forEach(invader => {

            const vowels = "AEIOU";

            let fillColor = "#1d1d1d";
            let borderColor = "#666";

            if (
                vowels.includes(
                    invader.letter
                )
            ) {

                fillColor = "#2a163d";
                borderColor = "#bb66ff";

            } else {

                fillColor = "#132038";
                borderColor = "#44ccff";
            }

            ctx.fillStyle = fillColor;

            ctx.fillRect(
                invader.x,
                invader.y,
                invader.width,
                invader.height
            );

            ctx.strokeStyle =
                borderColor;

            ctx.strokeRect(
                invader.x,
                invader.y,
                invader.width,
                invader.height
            );

            ctx.fillStyle = "#ffffff";

            ctx.font =
                "bold 20px Courier New";

            ctx.fillText(
                invader.letter,
                invader.x + 10,
                invader.y + 24
            );
        });

        ctx.restore();
    }

    // ===================================================
    // LOOP
    // ===================================================

    function loop() {

        update();
        draw();

        gameLoopId =
            requestAnimationFrame(loop);
    }

    // ===================================================
    // END GAME
    // ===================================================

    async function endGame() {

        cancelAnimationFrame(
            gameLoopId
        );

        const modal =
            document.getElementById(
                "invadersGameOverModal"
            );

        const scoreText =
            document.getElementById(
                "finalScoreText"
            );

        await saveGameRecord(
            currentUser,
            "invaders",
            score
        );

        scoreText.innerHTML = `
            FINAL SCORE: ${score}<br>
            MAX COMBO: x${multiplier}
        `;

        modal.classList.remove("hidden");

        // RETRY

        document.getElementById(
            "btnRetryInvaders"
        ).onclick = () => {

            cancelAnimationFrame(
                gameLoopId
            );

            modal.classList.add(
                "hidden"
            );

            score = 0;
            lives = 3;
            shield = MAX_SHIELD;

            combo = 0;
            multiplier = 1;

            invaders = [];
            bullets = [];
            enemyBullets = [];
            particles = [];
            powerUps = [];

            initVerbRound();
            loop();
        };

        // CLOSE

        document.getElementById(
            "btnCloseInvaders"
        ).onclick = () => {

            modal.classList.add(
                "hidden"
            );

            document.getElementById(
                "btnBackToMenu"
            ).click();
        };
    }

    // ===================================================
    // START
    // ===================================================

    initVerbRound();
    updateHUD();
    loop();

    return {

        stop: () => {

            cancelAnimationFrame(
                gameLoopId
            );

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            window.removeEventListener(
                "keyup",
                handleKeyUp
            );
        }
    };
}