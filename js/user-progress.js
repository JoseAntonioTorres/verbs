// js/user-progress.js

import {
    doc,
    getDoc,
    setDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

import { db } from "./services/firebase-config.js";

// ======================================================
// SAVE GAME RECORD
// ======================================================

export async function saveGameRecord(user, gameType, score) {

    if (!user) return;

    try {

        const userRef = doc(db, "users", user.uid);

        const snap = await getDoc(userRef);

        let data = {};

        if (snap.exists()) {
            data = snap.data();
        }

        const currentRecords = data.games_records || {};

        const previousBest =
            currentRecords[gameType] || 0;

        const newBest =
            Math.max(previousBest, score);

        await setDoc(userRef, {

            games_records: {
                ...currentRecords,
                [gameType]: newBest
            },

            updatedAt: new Date().toISOString()

        }, { merge: true });

    } catch (err) {

        console.error(
            "Error guardando récord:",
            err
        );
    }
}