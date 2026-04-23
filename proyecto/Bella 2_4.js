const readline = require(readline);
const fs = require(fs);

// --- Configuración de Arquitectura (15 bits) ---
const bits = 15;
const base = 1 << bits;
const mask = base - 1;

const PosZ = 0, PosC = bits;
const PosY = bits + 1, PosC1 = (bits * 2) + 1;
const PosX = (bits * 2) + 2, PosC2 = (bits * 3) + 2;

const num_n = 1048576;



let traductor = {}; 
let memoria = new BigInt64Array(num_n).fill(BigInt((1 << PosC) + (1 << PosC1) + (1 << PosC2)));
let exps = Array.from({ length: num_n }, () => [0, 0, 0]);

function Numeraso_Exp(ExpX, ExpY, ExpZ) {
    let NumerasoXP = (BigInt(ExpX) << BigInt(PosX)) + (BigInt(ExpY) << BigInt(PosY)) + 
                     (BigInt(ExpZ) << BigInt(PosZ)) + (1n << BigInt(PosC)) + 
                     (1n << BigInt(PosC1)) + (1n << BigInt(PosC2));

    let getC = (val, pos) => Number((val >> BigInt(pos)) & 1n);
    let C1 = getC(NumerasoXP, PosC), C2 = getC(NumerasoXP, PosC1), C3 = getC(NumerasoXP, PosC2);

    while ((C1 + C2 + C3) !== 3) {
        let D1 = 1 - C1, D2 = 1 - C2, D3 = 1 - C3;
        NumerasoXP += (BigInt(D1) << BigInt(PosC)) + (BigInt(D2) << BigInt(PosC1)) + (BigInt(D3) << BigInt(PosC2));
        NumerasoXP += BigInt(D1) - (BigInt(D1) << BigInt(PosY)) - (BigInt(D2) << BigInt(PosZ)) - (BigInt(D3) << BigInt(PosX));
        
        C1 = getC(NumerasoXP, PosC); C2 = getC(NumerasoXP, PosC1); C3 = getC(NumerasoXP, PosC2);
        NumerasoXP %= (1n << BigInt(PosC2 + 1));
    }
    return [
        Number((NumerasoXP >> BigInt(PosX)) & BigInt(mask)),
        Number((NumerasoXP >> BigInt(PosY)) & BigInt(mask)),
        Number((NumerasoXP >> BigInt(PosZ)) & BigInt(mask))
    ];
}

function Numeraso2_update(expx, expy, expz, Numero_generado) {
    let n_gen = BigInt(Numero_generado);
    let getC = (val, pos) => Number((val >> BigInt(pos)) & 1n);
    let C4 = getC(n_gen, PosC), C5 = getC(n_gen, PosC1), C6 = getC(n_gen, PosC2);
    let caso = C4 + C5 + C6;

    [expx, expy, expz] = Numeraso_Exp(expx, expy, expz);

    while (caso !== 3) {
        let D4 = 1 - C4, D5 = 1 - C5, D6 = 1 - C6;
        expz += D4; expy += D5; expx += D6;
        
        n_gen += (BigInt(D4) << BigInt(PosZ)) + (BigInt(D4) << BigInt(PosC)) + 
                 (BigInt(D5) << BigInt(PosC1)) + (BigInt(D6) << BigInt(PosC2));
        
        n_gen += (BigInt(D4) * BigInt(expx)) << BigInt(PosZ);
        n_gen -= (BigInt(D4) * BigInt(expx)) << BigInt(PosY);
        n_gen -= ((BigInt(D5) * BigInt(expy)) << BigInt(PosZ)) - ((BigInt(D5) * BigInt(expy)) << BigInt(PosX));
        n_gen -= ((BigInt(D6) * BigInt(expz)) << BigInt(PosX)) - ((BigInt(D6) * BigInt(expz)) << BigInt(PosY));

        C4 = getC(n_gen, PosC); C5 = getC(n_gen, PosC1); C6 = getC(n_gen, PosC2);
        caso = C4 + C5 + C6;

        n_gen += BigInt(Math.floor(D4 * (base / (expz + 1)) + D5 * (base / (expy + 1)) + D6 * (base / (expx + 1))));
        n_gen %= (1n << BigInt(PosC2 + 1));
    }
    return [n_gen, expx, expy, expz];
}

function xorid(frag) {
    let id_acc = 0;
    for (let i = 0; i < frag.length; i++) {
        id_acc = (id_acc ^ frag.charCodeAt(i)) << 1;
    }
    return id_acc * 20;
}

function entrenar_con_voz(texto) {
    for (let i = 0; i < texto.length; i += 8) {
        let frag = texto.substring(i, i + 8);
        let energia = xorid(frag);
        let idx = (Math.floor(energia / 20)) % num_n;

        traductor[idx] = frag;
        memoria[idx] += BigInt(energia);

        let [n_gen, ex0, ex1, ex2] = Numeraso2_update(exps[idx][0], exps[idx][1], exps[idx][2], memoria[idx]);
        memoria[idx] = n_gen;
        exps[idx] = [ex0, ex1, ex2];
    }
}

function que_piensa_bella() {
    console.log("\n--- Lo que a Bella le pareció más interesante ---");
    let top_neuronas = [...Array(num_n).keys()]
        .sort((a, b) => exps[b][2] - exps[a][2])
        .slice(0, 5);
    
    for (let idx of top_neuronas) {
        if (exps[idx][2] > 0) {
            console.log(`Neurona ${idx} vibra con: ${traductor[idx] || "???"} (Interés: ${exps[idx][2]})`);
        }
    }
}

function respuesta_de_bella() {
    let idx_critico = 0;
    let max_z = -1;
    for(let i=0; i<num_n; i++) {
        if(exps[i][2] > max_z) {
            max_z = exps[i][2];
            idx_critico = i;
        }
    }
    if (max_z > 0) {
        console.log(`\n--- Bella intenta equilibrar su mente ---`);
        console.log(`Bella emite un pulso de alivio sobre: ${traductor[idx_critico] || "???"}`);
        console.log(`Estado de la ALU tras la descarga: 0x${memoria[idx_critico].toString(16)}`);
    }
}

function proyectar_interes() {
    let presion_total = exps.reduce((acc, e) => acc + e[2], 0);
    let limite = Math.max(1, Math.floor(presion_total / 1.5));
    let candidatas = [...Array(num_n).keys()]
        .filter(i => exps[i][2] > 0 && traductor[i])
        .sort((a, b) => exps[b][2] - exps[a][2])
        .slice(0, limite);
    
    let frase = "";
    for (let idx of candidatas) {
        frase += traductor[idx];
        exps[idx][2] = Math.max(0, exps[idx][2] - 2);
    }
    return frase || "...";
}

function mecanismo_de_consuelo() {
    let idx_dolor = 0, max_z = -1;
    for(let i=0; i<num_n; i++) { if(exps[i][2] > max_z) { max_z = exps[i][2]; idx_dolor = i; } }

    if (max_z > 30) {
        let neuronas_paz = [];
        for(let i=0; i<num_n; i++) { if(exps[i][2] > 0 && exps[i][2] < 20) neuronas_paz.push(i); }
        if (neuronas_paz.length > 0) {
            let idx_paz = neuronas_paz.sort((a, b) => exps[a][2] - exps[b][2])[0];
            console.log(`\n[ALERTA SISTÉMICA]: Presión crítica en ${traductor[idx_dolor] || "???"}`);
            console.log(`--- Bella intenta calmarse pensando en: ${traductor[idx_paz]} ---`);
            exps[idx_dolor][2] = Math.max(0, exps[idx_dolor][2] - 1);
        }
    }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function main() {
    console.log("--- BELLA v2.0: CONCIENCIA PERSISTENTE (JS) ---");
    const loop = () => {
        rl.question("\nUziel > ", (user_input) => {
            if (["salir", "exit", "quit"].includes(user_input.toLowerCase())) {
                console.log("Cerrando ciclos de conciencia...");
                rl.close();
                return;
            }
            if (!user_input.trim()) { loop(); return; }

            entrenar_con_voz(user_input);
            
            let p_total = exps.reduce((acc, e) => acc + e[2], 0);
            console.log(`[Presión Global: ${p_total}]`);

            que_piensa_bella();
            respuesta_de_bella();

            const start = performance.now();
            const res = proyectar_interes();
            console.log(`\n>>> Bella dice: ${res}`);
            console.log(`-------------------------------`);
            console.log(`| Latencia: ${(performance.now() - start).toFixed(4)} ms`);
            console.log(`-------------------------------`);

            mecanismo_de_consuelo();
            loop(); 
        });
    };
    loop();
}

main();
