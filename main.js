const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

let globaleDaten = [];
let globaleSollPunkte = 10;
let editEinsatzId = null;

function showTab(id, event) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}

function togglePassword() {
    const feld = document.getElementById('adminPasswort');
    feld.type = feld.type === 'password' ? 'text' : 'password';
}

function loginAdmin() {
    const eingabe = document.getElementById('adminPasswort').value;
    if (eingabe === ADMIN_PASSWORT) {
        document.getElementById('adminArea').style.display = 'block';
    } else {
        alert('Falsches Passwort');
    }
}

function ladeEinsaetze() {
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(json => {
            globaleDaten = json.data;
            globaleSollPunkte = json.sollPunkte;
            zeigeEinsaetze();
            zeigeElternUebersicht();
            zeigeAdminEinsaetze();
        });
}

function zeigeEinsaetze() {
    const container = document.getElementById('einsatzUebersicht');
    container.innerHTML = '';

    globaleDaten.forEach(e => {
        const box = document.createElement('div');
        box.className = `einsatz-box ${e.kategorie.toLowerCase()}`;
        box.innerHTML = `
            <b>${e.name}</b><br>
            ${e.datum} – ${e.uhrzeit}<br>
            Verantwortlich: ${e.verantwortlich}<br>
            Kategorie: ${e.kategorie}<br>
            Helfer: ${e.helferanzahl}<br>
        `;

        for (let i = 0; i < e.helferanzahl; i++) {
            const input = document.createElement('input');
            input.className = 'helfer-eintrag';
            input.value = e.helfer[i] || '';
            input.dataset.id = e.id;
            input.dataset.index = i;
            input.style.marginRight = '10px';
            if (input.value.trim()) input.classList.add('besetzt');
            else input.classList.add('frei');
            input.addEventListener('change', helferSpeichern);
            box.appendChild(input);
        }

        container.appendChild(box);
    });
}

function helferSpeichern(event) {
    const input = event.target;
    const id = input.dataset.id;
    const index = parseInt(input.dataset.index);
    const name = input.value.trim();

    input.classList.toggle('besetzt', name !== '');
    input.classList.toggle('frei', name === '');

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'setHelfer',
            id: id,
            index: index,
            name: name,
            adminPassword: ADMIN_PASSWORT
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(() => ladeEinsaetze());
}

function zeigeElternUebersicht() {
    const eltern = {};
    globaleDaten.forEach(e => {
        e.helfer.forEach(name => {
            if (!name.trim()) return;
            eltern[name] = (eltern[name] || 0) + e.punkte;
        });
    });

    const table = document.getElementById('parentOverview');
    table.innerHTML = Object.entries(eltern)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, ist]) => {
            const soll = globaleSollPunkte;
            const diff = ist - soll;
            return `
                <tr>
                    <td>${name}</td>
                    <td>${ist}</td>
                    <td>${soll}</td>
                    <td class="${diff >= 0 ? 'differenz-positiv' : 'differenz-negativ'}">${diff}</td>
                </tr>
            `;
        }).join('');
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('suchName').value.trim();
    if (!name) return;

    const eigene = globaleDaten.filter(e => e.helfer.includes(name));
    const punkte = eigene.reduce((sum, e) => sum + e.punkte, 0);

    document.getElementById('eigenePunkteInfo').innerText =
        `Gesammelte Punkte: ${punkte} / ${globaleSollPunkte} (Differenz: ${punkte - globaleSollPunkte})`;

    const container = document.getElementById('eigeneEinsaetze');
    container.innerHTML = eigene.map(e => `
        <div class="einsatz-box ${e.kategorie.toLowerCase()}">
            <b>${e.name}</b><br>
            ${e.datum} – ${e.uhrzeit}<br>
            Verantwortlich: ${e.verantwortlich}<br>
            Kategorie: ${e.kategorie}
        </div>
    `).join('');
}

function druckeEinsaetze() {
    const inhalt = document.getElementById('eigeneEinsaetze').innerHTML;
    const stil = `<style>
        body { font-family: sans-serif; padding: 20px; }
        .einsatz-box { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
    </style>`;
    const w = window.open('', '', 'width=800,height=600');
    w.document.write(`<html><head>${stil}</head><body>${inhalt}</body></html>`);
    w.document.close();
    w.print();
}

function addEinsatz() {
    const action = editEinsatzId ? 'updateEinsatz' : 'addEinsatz';
    const daten = {
        action: action,
        adminPassword: ADMIN_PASSWORT,
        id: editEinsatzId,
        name: document.getElementById('einsatzTitel').value,
        datum: document.getElementById('einsatzDatum').value,
        uhrzeit: document.getElementById('einsatzUhrzeit').value,
        verantwortlich: document.getElementById('einsatzVerantwortlich').value,
        kategorie: document.getElementById('einsatzKategorie').value,
        punkte: Number(document.getElementById('einsatzStunden').value),
        helferanzahl: Number(document.getElementById('einsatzHelferanzahl').value)
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(daten),
        headers: { 'Content-Type': 'application/json' }
    }).then(() => {
        ladeEinsaetze();
        editEinsatzId = null;
        document.getElementById('einsatzTitel').value = '';
        document.getElementById('einsatzDatum').value = '';
        document.getElementById('einsatzUhrzeit').value = '';
        document.getElementById('einsatzVerantwortlich').value = '';
        document.getElementById('einsatzKategorie').value = '';
        document.getElementById('einsatzStunden').value = '';
        document.getElementById('einsatzHelferanzahl').value = '';
    });
}

function deleteEinsatz(id) {
    if (!confirm("Diesen Einsatz wirklich löschen?")) return;

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deleteEinsatz',
            id: id,
            adminPassword: ADMIN_PASSWORT
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(() => ladeEinsaetze());
}

function zeigeAdminEinsaetze() {
    const container = document.getElementById('alleEinsaetze');
    container.innerHTML = globaleDaten.map(e => `
        <div class="einsatz-box ${e.kategorie.toLowerCase()}">
            <b>${e.name}</b><br>
            ${e.datum} – ${e.uhrzeit}<br>
            Kategorie: ${e.kategorie}<br>
            Punkte: ${e.punkte} | Helfer: ${e.helferanzahl}<br>
            <button onclick="bearbeitenEinsatz('${e.id}')">Bearbeiten</button>
            <button onclick="deleteEinsatz('${e.id}')">Löschen</button>
        </div>
    `).join('');
}

function bearbeitenEinsatz(id) {
    const e = globaleDaten.find(e => e.id === id);
    if (!e) return;

    editEinsatzId = e.id;
    document.getElementById('einsatzTitel').value = e.name;
    document.getElementById('einsatzDatum').value = e.datum;
    document.getElementById('einsatzUhrzeit').value = e.uhrzeit;
    document.getElementById('einsatzVerantwortlich').value = e.verantwortlich;
    document.getElementById('einsatzKategorie').value = e.kategorie;
    document.getElementById('einsatzStunden').value = e.punkte;
    document.getElementById('einsatzHelferanzahl').value = e.helferanzahl;
}

window.addEventListener('DOMContentLoaded', ladeEinsaetze);
