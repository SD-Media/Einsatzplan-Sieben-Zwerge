// main.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

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
        titel: document.getElementById('einsatzTitel').value,
        datum: document.getElementById('einsatzDatum').value,
        uhrzeit: document.getElementById('einsatzUhrzeit').value,
        verantwortlich: document.getElementById('einsatzVerantwortlich').value,
        stunden: document.getElementById('einsatzStunden').value,
        helferanzahl: document.getElementById('einsatzHelferanzahl').value
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
    fetch(SCRIPT_URL + '?action=getData')
        .then(res => res.text())
        .then(text => {
            console.log("RAW Antwort:", text);
            let daten;
            try {
                daten = JSON.parse(text);
            } catch (e) {
                console.error("JSON Fehler:", e);
                document.getElementById('alleEinsaetze').innerText = 'Fehler beim Laden der Daten.';
                document.getElementById('parentOverview').innerText = 'Fehler beim Laden der Elternübersicht.';
                return;
            }
            zeigeEinsaetze(daten);
            zeigeEltern(daten);
        })
        .catch(err => {
            console.error("Fetch Fehler:", err);
            document.getElementById('alleEinsaetze').innerText = 'Verbindung zum Server fehlgeschlagen.';
        });
}

function zeigeEinsaetze(daten) {
    const bereich = document.getElementById('alleEinsaetze');
    bereich.innerHTML = '';
    daten.forEach(e => {
        const div = document.createElement('div');
        div.className = 'einsatz-box';
        div.innerHTML = `
            <strong>${e.titel}</strong><br>
            ${e.datum} um ${e.uhrzeit}<br>
            ${e.verantwortlich} – ${e.stunden} Std. – ${e.helferanzahl} Helfer
        `;
        bereich.appendChild(div);
    });
}

function zeigeEltern(daten) {
    const eltern = {};
    daten.forEach(e => {
        e.helfer?.split(',').forEach(name => {
            name = name.trim();
            if (!name) return;
            if (!eltern[name]) eltern[name] = 0;
            eltern[name] += Number(e.stunden || 0);
        });
    });

    const bereich = document.getElementById('parentOverview');
    bereich.innerHTML = '';
    Object.entries(eltern).forEach(([name, ist]) => {
        const soll = 10;
        const diff = ist - soll;
        const el = document.createElement('div');
        el.className = 'einsatz-box';
        el.innerHTML = `
            <strong>${name}</strong><br>
            <div class="punkte">
                <span>IST: ${ist}</span>
                <span>SOLL: ${soll}</span>
                <span class="diff">Differenz: ${diff}</span>
            </div>
        `;
        bereich.appendChild(el);
    });
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) return;

    fetch(SCRIPT_URL + '?action=getData')
        .then(res => res.json())
        .then(daten => {
            const eigene = daten.filter(e => e.helfer?.split(',').map(h => h.trim()).includes(name));
            const bereich = document.getElementById('eigeneEinsaetze');
            bereich.innerHTML = '';

            eigene.forEach(e => {
                const div = document.createElement('div');
                div.className = 'einsatz-box';
                div.innerHTML = `
                    <strong>${e.titel}</strong><br>
                    ${e.datum} um ${e.uhrzeit}<br>
                    ${e.verantwortlich} – ${e.stunden} Std.
                `;
                bereich.appendChild(div);
            });
        });
}

document.addEventListener('DOMContentLoaded', ladeEinsaetze);
