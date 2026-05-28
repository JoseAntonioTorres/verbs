/**
 * Repository of Verbs and Vocabulary (Categorized)
 * Centralized data source for gamified activities.
 */

// 1. VERBOS IRREGULARES CLASIFICADOS POR PATRONES
export const irregularCategories = {
    // Patrón AAA: Las tres formas son exactamente iguales
    "AAA Pattern (No Change)": [
        { infinitive: "cost", past: "cost", participle: "cost", clue: "Costar / Tres formas iguales", sentence: "The hosting server licenses ______ a lot more than we originally expected." },
        { infinitive: "cut", past: "cut", participle: "cut", clue: "Cortar / Tres formas iguales", sentence: "The designer carefully ______ the paper models for the educational prototype." },
        { infinitive: "put", past: "put", participle: "put", clue: "Poner / Tres formas iguales", sentence: "The administrator ______ the new database configurations directly into production." }
    ],
    // Patrón ABB: El pasado y el participio son iguales
    "ABB Pattern (Past = Participle)": [
        { infinitive: "bring", past: "brought", participle: "brought", clue: "Traer / Pasado de 'Bring'", sentence: "Our new coordinator ______ some excellent educational materials to the workshop." },
        { infinitive: "build", past: "built", participle: "built", clue: "Construir / Pasado de 'Build'", sentence: "The local community ______ a sustainable greenhouse project two years ago." },
        { infinitive: "buy", past: "bought", participle: "bought", clue: "Comprar / Pasado de 'Buy'", sentence: "The institution ______ thirty brand new microcontrollers for the digital lab." },
        { infinitive: "catch", past: "caught", participle: "caught", clue: "Atrapar / Pasado de 'Catch'", sentence: "The security software immediately ______ the malware before it infected the system." },
        { infinitive: "feel", past: "felt", participle: "felt", clue: "Sentir / Pasado de 'Feel'", sentence: "The students ______ highly motivated when they received their digital badges." },
        { infinitive: "find", past: "found", participle: "found", clue: "Encontrar / Pasado de 'Find'", sentence: "The engineering team ______ a major logical bug inside the source script." },
        { infinitive: "get", past: "got", participle: "got", clue: "Obtener / Pasado de 'Get'", sentence: "The platform administrator ______ the final authorization to launch the update." },
        { infinitive: "have", past: "had", participle: "had", clue: "Tener / Pasado de 'Have'", sentence: "Last semester, we ______ an amazing experience working with custom APIs." },
        { infinitive: "hear", past: "heard", participle: "heard", clue: "Escuchar / Pasado de 'Hear'", sentence: "Everyone in the studio ______ the strange high-pitched noise during playback." },
        { infinitive: "hold", past: "held", participle: "held", clue: "Sostener / Pasado de 'Hold'", sentence: "The coordinators ______ a critical strategy meeting early yesterday morning." },
        { infinitive: "keep", past: "kept", participle: "kept", clue: "Mantener / Pasado de 'Keep'", sentence: "The software engineer ______ an accurate backup log of the user data." },
        { infinitive: "leave", past: "left", participle: "left", clue: "Dejar o salir / Pasado de 'Leave'", sentence: "The design team ______ the workshop late because they were refining the CSS." },
        { infinitive: "lose", past: "lost", participle: "lost", clue: "Perder / Pasado de 'Lose'", sentence: "The local team unfortunately ______ their match despite a great final effort." },
        { infinitive: "make", past: "made", participle: "made", clue: "Hacer o fabricar / Pasado de 'Make'", sentence: "The pedagogical experts ______ some excellent updates to the study criteria." },
        { infinitive: "meet", past: "met", participle: "met", clue: "Conocer personas o reunirse", sentence: "The development team ______ with the university principal last Thursday." },
        { infinitive: "pay", past: "paid", participle: "paid", clue: "Pagar / Pasado de 'Pay'", sentence: "The department ______ for the online repository upgrades earlier today." },
        { infinitive: "say", past: "said", participle: "said", clue: "Decir / Pasado de 'Say'", sentence: "The lead facilitator ______ that our new virtual object looked incredible." },
        { infinitive: "sell", past: "sold", participle: "sold", clue: "Vender / Pasado de 'Sell'", sentence: "The platform developers ______ their first custom gaming package this week." },
        { infinitive: "send", past: "sent", participle: "sent", clue: "Enviar / Pasado de 'Send'", sentence: "The platform automatically ______ a verification message to all students." },
        { infinitive: "sit", past: "sat", participle: "sat", clue: "Sentarse / Pasado de 'Sit'", sentence: "Everyone ______ quietly in the auditorium waiting for the demonstration." },
        { infinitive: "sleep", past: "slept", participle: "slept", clue: "Dormir / Pasado de 'Sleep'", sentence: "The tired researchers finally ______ for a couple of hours after the release." },
        { infinitive: "spend", past: "spent", participle: "spent", clue: "Gastar o pasar tiempo", sentence: "The UX designers ______ three whole days structuring the navigation system." },
        { infinitive: "stand", past: "stood", participle: "stood", clue: "Estar de pie / Pasado de 'Stand'", sentence: "The whole class ______ up to greet the visiting presentation speakers." },
        { infinitive: "teach", past: "taught", participle: "taught", clue: "Enseñar / Pasado de 'Teach'", sentence: "The professional instructor ______ us how to connect Firebase properly." },
        { infinitive: "think", past: "thought", participle: "thought", clue: "Pensar / Pasado de 'Think'", sentence: "The students ______ the exercise was challenging but highly rewarding." }
    ],
    // Patrón ABC: Las tres formas cambian completamente
    "ABC Pattern (All Different)": [
        { infinitive: "be", past: "was", participle: "been", clue: "Ser o estar / Pasado: was-were", sentence: "The weather ______ surprisingly warm during our field trip last weekend." },
        { infinitive: "begin", past: "began", participle: "begun", clue: "Comenzar / Cambio i-a-u", sentence: "The dynamic evaluation ______ exactly at eight o'clock this morning." },
        { infinitive: "break", past: "broke", participle: "broken", clue: "Romper / Pasado de 'Break'", sentence: "The technician accidentally ______ the main server adapter yesterday afternoon." },
        { infinitive: "choose", past: "chose", participle: "chosen", clue: "Elegir / Pasado de 'Choose'", sentence: "After looking at the options, the student ______ the gamified module." },
        { infinitive: "do", past: "did", participle: "done", clue: "Hacer / Pasado de 'Do'", sentence: "The group ______ an outstanding job gathering feedback from the participants." },
        { infinitive: "draw", past: "drew", participle: "drawn", clue: "Dibujar / Pasado de 'Draw'", sentence: "The children ______ colorful maps to explain their neighborhood projects." },
        { infinitive: "drink", past: "drank", participle: "drunk", clue: "Beber / Cambio i-a-u", sentence: "We all ______ fresh coffee while discussing the project requirements." },
        { infinitive: "drive", past: "drove", participle: "driven", clue: "Conducir / Pasado de 'Drive'", sentence: "The researcher ______ across the region to visit the participating schools." },
        { infinitive: "eat", past: "ate", participle: "eaten", clue: "Comer / Pasado de 'Eat'", sentence: "The team ______ lunch quickly so they could resume the development phase." },
        { infinitive: "fall", past: "fell", participle: "fallen", clue: "Caer / Pasado de 'Fall'", sentence: "The connection speeds ______ dramatically during the heavy storm last night." },
        { infinitive: "fly", past: "flew", participle: "flown", clue: "Volar / Pasado de 'Fly'", sentence: "The educational consultants ______ to the technology conference last month." },
        { infinitive: "forget", past: "forgot", participle: "forgotten", clue: "Olvidar / Pasado de 'Forget'", sentence: "I completely ______ to save the latest revisions of the style guide." },
        { infinitive: "give", past: "gave", participle: "given", clue: "Dar / Pasado de 'Give'", sentence: "The presentation ______ us a clear overview of the gamification process." },
        { infinitive: "go", past: "went", participle: "gone", clue: "Ir / Pasado de 'Go'", sentence: "Yesterday, the whole class ______ to the lab to run some database test scripts." },
        { infinitive: "grow", past: "grew", participle: "grown", clue: "Crecer / Pasado de 'Grow'", sentence: "The number of active platform users ______ significantly over the winter." },
        { infinitive: "know", past: "knew", participle: "known", clue: "Saber o conocer / Pasado de 'Know'", sentence: "The group already ______ the correct answers before the review started." },
        { infinitive: "read", past: "read", participle: "read", clue: "Leer / Cambia pronunciación corta", sentence: "The developer carefully ______ the API documentation before writing code." },
        { infinitive: "see", past: "saw", participle: "seen", clue: "Ver / Pasado de 'See'", sentence: "We clearly ______ the performance charts improve after the code cleanup." },
        { infinitive: "sing", past: "sang", participle: "sung", clue: "Cantar / Cambio i-a-u", sentence: "The language class ______ a traditional melody during their practice test." },
        { infinitive: "speak", past: "spoke", participle: "spoken", clue: "Hablar / Pasado de 'Speak'", sentence: "The consultant ______ to the students about the benefits of educational tech." },
        { infinitive: "take", past: "took", participle: "taken", clue: "Tomar o llevar / Pasado de 'Take'", sentence: "The evaluation group ______ notes about the behavior of the application." },
        { infinitive: "write", past: "wrote", participle: "written", clue: "Escribir / Pasado de 'Write'", sentence: "The author ______ an excellent instruction manual for the interactive app." }
    ],
    // Patrón ABA: El infinitivo y el participio son iguales
    "ABA Pattern (Infinitive = Participle)": [
        { infinitive: "come", past: "came", participle: "come", clue: "Venir / Infinitivo igual a participio", sentence: "Several expert facilitators ______ to help us design the virtual objects." },
        { infinitive: "run", past: "ran", participle: "run", clue: "Correr / Infinitivo igual a participio", sentence: "The automated tests ______ smoothly without throwing single tracking errors." }
    ]
};

// 2. VERBOS REGULARES CLASIFICADOS POR REGLAS DE PRONUNCIACIÓN DE "-ED"
export const regularCategories = {
    // Sonido /ɪd/: Verbos que terminan en sonido T o D
    "Regular - Sound /ɪd/": [
        { infinitive: "accept", past: "accepted", participle: "accepted", clue: "Aceptar / Sonido final /ɪd/", sentence: "The platform finally ______ our custom JavaScript components." },
        { infinitive: "count", past: "counted", participle: "counted", clue: "Contar / Sonido final /ɪd/", sentence: "The system automatically ______ the correct clicks on the map simulator." },
        { infinitive: "decide", past: "decided", participle: "decided", clue: "Decidir / Sonido final /ɪd/", sentence: "The academy ______ to update the entire user experience guide." },
        { infinitive: "expect", past: "expected", participle: "expected", clue: "Esperar (probabilidad) / Sonido /ɪd/", sentence: "None of us ______ such a high engagement level during the game phase." },
        { infinitive: "need", past: "needed", participle: "needed", clue: "Necesitar / Sonido final /ɪd/", sentence: "The developer ______ an additional API endpoint to fetch the records." },
        { infinitive: "start", past: "started", participle: "started", clue: "Iniciar / Sonido final /ɪd/", sentence: "The irregular verbs escape room ______ with a mysterious locked door." },
        { infinitive: "visit", past: "visited", participle: "visited", clue: "Visitar / Sonido final /ɪd/", sentence: "The school principal ______ our digital lab to see the gamified objects." },
        { infinitive: "want", past: "wanted", participle: "wanted", clue: "Querer / Sonido final /ɪd/", sentence: "The students ______ to repeat the vocabulary run to improve their positions." }
    ],
    // Sonido /t/: Verbos que terminan en sonidos sordos (P, K, SH, CH, GH, TH, SS, C, X)
    "Regular - Sound /t/": [
        { infinitive: "ask", past: "asked", participle: "asked", clue: "Preguntar / Sonido sordo /t/", sentence: "The coordinator ______ for the active minute logs of the translation project." },
        { infinitive: "cook", past: "cooked", participle: "cooked", clue: "Cocinar / Sonido sordo /t/", sentence: "The culinary students ______ a traditional Veracruz dish during the cultural fair." },
        { infinitive: "develop", past: "developed", participle: "developed", clue: "Desarrollar / Sonido sordo /t/", sentence: "Our group ______ an interactive simulator with embedded audio clips." },
        { infinitive: "finish", past: "finished", participle: "finished", clue: "Terminar / Sonido sordo /t/", sentence: "They finally ______ the CSS refactoring just before midnight." },
        { infinitive: "help", past: "helped", participle: "helped", clue: "Ayudar / Sonido sordo /t/", sentence: "The new framework updates ______ optimize the response times significantly." },
        { infinitive: "look", past: "looked", participle: "looked", clue: "Mirar / Sonido sordo /t/", sentence: "The UI design team ______ at the analytics layout for over an hour." },
        { infinitive: "practice", past: "practiced", participle: "practiced", clue: "Practicar / Sonido sordo /t/", sentence: "The secondary pupils ______ irregular structures using the flashcard view." },
        { infinitive: "watch", past: "watched", participle: "watched", clue: "Observar / Sonido sordo /t/", sentence: "The facilitator ______ how the girls navigated through the app modules." },
        { infinitive: "work", past: "worked", participle: "worked", clue: "Trabajar / Sonido sordo /t/", sentence: "The team ______ around the clock to finish the production environment setup." }
    ],
    // Sonido /d/: Verbos que terminan en sonidos sonoros (L, M, N, R, G, V, S, Z, B, J y vocales)
    "Regular - Sound /d/": [
        { infinitive: "call", past: "called", participle: "called", clue: "Llamar / Sonido sonoro /d/", sentence: "The automated system ______ the script function whenever a user authenticated." },
        { infinitive: "change", past: "changed", participle: "changed", clue: "Cambiar / Sonido sonoro /d/", sentence: "The script ______ the active node colors dynamically from gray to green." },
        { infinitive: "clean", past: "cleaned", participle: "cleaned", clue: "Limpiar / Sonido sonoro /d/", sentence: "The web developer ______ the local variables cache to run a sterile test." },
        { infinitive: "explain", past: "explained", participle: "explained", clue: "Explicar / Sonido sonoro /d/", sentence: "The instructions panel ______ the scoring rules for the anagram board." },
        { infinitive: "listen", past: "listened", participle: "listened", clue: "Escuchar / Sonido sonoro /d/", sentence: "The users ______ to the high-quality native pronunciations inside the view." },
        { infinitive: "live", past: "lived", participle: "lived", clue: "Vivir / Sonido sonoro /d/", sentence: "The ancestors ______ in the mountain towns of Veracruz for many generations." },
        { infinitive: "open", past: "opened", participle: "opened", clue: "Abrir / Sonido sonoro /d/", sentence: "The application instantly ______ a modal layout showing the achieved medals." },
        { infinitive: "play", past: "played", participle: "played", clue: "Jugar o reproducir / Sonido /d/", sentence: "The children ______ the memory card activity four times in a row." },
        { infinitive: "save", past: "saved", participle: "saved", clue: "Guardar / Sonido sonoro /d/", sentence: "The platform safely ______ the updated scoreboard data back to Firestore." },
        { infinitive: "study", past: "studied", participle: "studied", clue: "Estudiar / Sonido sonoro /d/", sentence: "The class ______ the contextual clues before picking their definitive options." },
        { infinitive: "use", past: "used", participle: "used", clue: "Usar / Sonido sonoro /d/", sentence: "The team ______ a responsive grid structure to fit mobile phone screens." }
    ]
};

// 3. GENERACIÓN DINÁMICA DE LA CONSTANTE UNIFICADA 'verbPool' (Mantiene compatibilidad)
// Esta lógica extrae todos los verbos de las categorías superiores y crea un único arreglo plano.
export const verbPool = [
    ...Object.values(irregularCategories).flat(),
    ...Object.values(regularCategories).flat()
];