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

function togglePasswort() {
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

function resetAlleHelfer() {
    if (!confirm("Alle Helfereinträge wirklich löschen?")) return;

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'removeAllHelfer',
            adminPassword: ADMIN_PASSWORT
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(() => ladeEinsaetze());
}

function ladeEinsaetze() {
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(json => {
            globaleDaten = json.data;
            globaleSollPunkte = json.sollPunkte;
            zeigeElternUebersicht(globaleDaten);
            zeigeAlleEinsaetze(globaleDaten);
            zeigeAdminEinsaetze(globaleDaten);
        });
}

function zeigeElternUebersicht(daten) {
    const eltern = {};
    daten.forEach(einsatz => {
        einsatz.helfer.forEach(name => {
            if (!name.trim()) return;
            if (!eltern[name]) eltern[name] = 0;
            eltern[name] += einsatz.punkte;
        });
    });

    const sortedNamen = Object.keys(eltern).sort();
    const table = document.getElementById('elternTabelle');
    table.innerHTML = sortedNamen.map(name => {
        const ist = eltern[name];
        const soll = globaleSollPunkte;
        const diff = ist - soll;
        return `
        <tr>
            <td>${name}</td>
            <td>${ist}</td>
            <td>${soll}</td>
            <td style="color: ${diff >= 0 ? 'green' : 'red'}">${diff}</td>
        </tr>`;
    }).join('');
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('suchName').value.trim();
    if (!name) return;

    const eigene = globaleDaten.filter(e => e.helfer.includes(name));
    const punkte = eigene.reduce((sum, e) => sum + e.punkte, 0);

    const gesamt = `Gesammelte Punkte: ${punkte} / ${globaleSollPunkte} (Differenz: ${punkte - globaleSollPunkte})`;
    document.getElementById('eigenePunkteInfo').innerText = gesamt;

    const container = document.getElementById('eigeneEinsaetze');
    container.innerHTML = eigene.map(e => `
        <div class="einsatz-box" style="border-left: 6px solid ${getKategorieFarbe(e.kategorie)}">
            <b>${e.name}</b><br>
            ${e.datum} – ${e.uhrzeit}<br>
            Verantwortlich: ${e.verantwortlich || '-'}<br>
            Kategorie: ${e.kategorie}
        </div>
    `).join('');
}

function zeigeAlleEinsaetze(daten = globaleDaten) {
    const bereich = document.getElementById('einsatzBereich');
    bereich.innerHTML = daten.map(e => {
        const felder = Array(e.helferanzahl).fill('').map((_, i) => {
            const name = e.helfer[i] || '';
            const style = name ? 'background-color: #d4edda;' : '';
            return `<input class="helfer-eintrag" data-id="${e.id}" data-index="${i}" value="${name}" style="${style}" />`;
        }).join('');

        return `
        <div class="einsatz-box" style="border-left: 6px solid ${getKategorieFarbe(e.kategorie)}">
            <b>${e.name}</b><br>
            ${e.datum} – ${e.uhrzeit}<br>
            Verantwortlich: ${e.verantwortlich || '-'}<br>
            Kategorie: ${e.kategorie}<br>
            Punkte: ${e.punkte} | Helfer: ${e.helferanzahl}<br>
            ${felder}
        </div>`;
    }).join('');

    // Event-Handler hinzufügen
    document.querySelectorAll('.helfer-eintrag').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            const index = parseInt(input.dataset.index);
            const name = input.value.trim();
            if (name) input.style.backgroundColor = '#d4edda';
            else input.style.backgroundColor = '';

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
        });
    });
}

function zeigeAdminEinsaetze(daten = globaleDaten) {
    const container = document.getElementById('adminEinsaetze');
    container.innerHTML = daten.map(e => `
        <div class="einsatz-box" style="border-left: 6px solid ${getKategorieFarbe(e.kategorie)}">
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

function getKategorieFarbe(kategorie) {
    switch (kategorie) {
        case 'Gartenarbeit': return '#4CAF50';
        case 'Verkaufsaktion': return '#FF9800';
        case 'Feste': return '#9C27B0';
        case 'Kindergartenpflege': return '#2196F3';
        case 'Sonstiges': return '#607D8B';
        default: return '#000';
    }
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
