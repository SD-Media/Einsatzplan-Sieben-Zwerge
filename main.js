// main.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

// Spaltenzuordnung
const COL_ID = 0;
const COL_NAME = 1;
const COL_DATUM = 2;
const COL_UHRZEIT = 3;
const COL_VERANTWORTLICH = 4;
const COL_KATEGORIE = 5;
const COL_PUNKTE = 6;
const COL_ANZAHL = 7;
const COL_HELFER_START = 8;

function showTab(id, event) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}

function loginAdmin() {
    const eingabe = document.getElementById('adminPasswort').value;
    if (eingabe === ADMIN_PASSWORT) {
        document.getElementById('adminArea').style.display = 'block';
    } else {
        alert('Falsches Passwort');
    }
}

function addEinsatz() {
    const daten = {
        action: 'addEinsatz',
        adminPassword: ADMIN_PASSWORT,
        name: document.getElementById('einsatzTitel').value,
        datum: document.getElementById('einsatzDatum').value,
        uhrzeit: document.getElementById('einsatzUhrzeit').value,
        verantwortlich: document.getElementById('einsatzVerantwortlich').value,
        kategorie: document.getElementById('einsatzKategorie')?.value || '',
        punkte: Number(document.getElementById('einsatzStunden').value || 0),
        helferanzahl: Number(document.getElementById('einsatzHelferanzahl').value || 0)
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(daten),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.text())
    .then(() => {
        alert('Einsatz hinzugefügt');
        ladeEinsaetze();
    });
}

function ladeEinsaetze() {
    fetch(SCRIPT_URL)
        .then(res => res.text())
        .then(text => {
            let daten;
            try {
                const parsed = JSON.parse(text);
                daten = parsed.data;
                if (!Array.isArray(daten)) throw new Error('Ungültiges Format');
            } catch (e) {
                console.error('Fehler beim Parsen:', e);
                document.getElementById('alleEinsaetze').innerText = 'Fehler beim Laden.';
                return;
            }
            zeigeEinsaetze(daten);
            zeigeEltern(daten, parsed.sollPunkte);
        });
}

function zeigeEinsaetze(daten) {
    const bereich = document.getElementById('alleEinsaetze');
    bereich.innerHTML = '';
    for (let i = 1; i < daten.length; i++) {
        const z = daten[i];
        const div = document.createElement('div');
        div.className = 'einsatz-box';
        div.innerHTML = `
            <strong>${z[COL_NAME]}</strong><br>
            ${z[COL_DATUM]} um ${z[COL_UHRZEIT]}<br>
            ${z[COL_VERANTWORTLICH]} – ${z[COL_PUNKTE]} Std. – ${z[COL_ANZAHL]} Helfer
        `;
        bereich.appendChild(div);
    }
}

function zeigeEltern(daten, sollPunkte = 10) {
    const eltern = {};
    for (let i = 1; i < daten.length; i++) {
        const zeile = daten[i];
        for (let j = COL_HELFER_START; j < zeile.length; j++) {
            const name = zeile[j]?.trim();
            if (name) {
                eltern[name] = (eltern[name] || 0) + Number(zeile[COL_PUNKTE] || 0);
            }
        }
    }

    const bereich = document.getElementById('parentOverview');
    bereich.innerHTML = '';
    for (const [name, ist] of Object.entries(eltern)) {
        const diff = ist - sollPunkte;
        const el = document.createElement('div');
        el.className = 'einsatz-box';
        el.innerHTML = `
            <strong>${name}</strong><br>
            <div class="punkte">
                <span>IST: ${ist}</span>
                <span>SOLL: ${sollPunkte}</span>
                <span class="diff">Differenz: ${diff}</span>
            </div>
        `;
        bereich.appendChild(el);
    }
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) return;

    fetch(SCRIPT_URL)
        .then(res => res.text())
        .then(text => {
            let daten;
            try {
                const parsed = JSON.parse(text);
                daten = parsed.data;
                if (!Array.isArray(daten)) throw new Error();
            } catch (e) {
                console.error('Fehler Eigene Einsätze:', e);
                return;
            }

            const eigene = daten.filter((z, i) => i > 0 && z.slice(COL_HELFER_START).some(h => h?.trim() === name));
            const bereich = document.getElementById('eigeneEinsaetze');
            bereich.innerHTML = '';

            eigene.forEach(e => {
                const div = document.createElement('div');
                div.className = 'einsatz-box';
                div.innerHTML = `
                    <strong>${e[COL_NAME]}</strong><br>
                    ${e[COL_DATUM]} um ${e[COL_UHRZEIT]}<br>
                    ${e[COL_VERANTWORTLICH]} – ${e[COL_PUNKTE]} Std.
                `;
                bereich.appendChild(div);
            });
        });
}

document.addEventListener('DOMContentLoaded', ladeEinsaetze);
