// main.js – aktualisiert gemäß neuen Anforderungen

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

let globaleDaten = [];
let globaleSollPunkte = 10;

function showTab(id, event) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}

function togglePasswort() {
    const input = document.getElementById('adminPasswort');
    input.type = input.type === 'password' ? 'text' : 'password';
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
        kategorie: document.getElementById('einsatzKategorie').value,
        punkte: Number(document.getElementById('einsatzStunden').value),
        helferanzahl: Number(document.getElementById('einsatzHelferanzahl').value)
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(daten),
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
    daten.forEach(e => {
        for (let key in e) {
            if (key.startsWith('Helfer') && e[key]) {
                const name = e[key].trim();
                eltern[name] = (eltern[name] || 0) + Number(e.Punkte || 0);
            }
        }
    });
    const tbody = document.getElementById('parentOverview');
    tbody.innerHTML = '';
    Object.entries(eltern)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, ist]) => {
            const diff = ist - globaleSollPunkte;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${name}</td>
                <td>${ist}</td>
                <td>${globaleSollPunkte}</td>
                <td class="${diff >= 0 ? 'diff-positive' : 'diff-negative'}">${diff}</td>
            `;
            tbody.appendChild(tr);
        });
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) return;

    const eigene = globaleDaten.filter(e =>
        Object.keys(e).some(k => k.startsWith('Helfer') && e[k]?.trim() === name)
    );

    const bereich = document.getElementById('eigeneEinsaetze');
    bereich.innerHTML = '';

    let punkte = 0;
    eigene.forEach(e => {
        punkte += Number(e.Punkte || 0);
        const div = document.createElement('div');
        div.className = `einsatz-box einsatz-${e.Einsatzkategorie?.toLowerCase()}`;
        div.innerHTML = `
            <strong>${e.Arbeitseinsatz}</strong><br>
            ${e.Datum || '-'} – ${e.Einsatzzeit || '-'}<br>
            Verantwortlich: ${e.Verantwortliche || '-'}<br>
            Kategorie: ${e.Einsatzkategorie || '-'}<br>
            Punkte: ${e.Punkte || 0}
        `;
        bereich.appendChild(div);
    });

    const summary = document.createElement('div');
    summary.innerHTML = `<strong>Gesammelte Punkte: ${punkte} / ${globaleSollPunkte} (Differenz: ${punkte - globaleSollPunkte})</strong>`;
    bereich.prepend(summary);
}

function zeigeAlleEinsaetze(daten) {
    const bereich = document.getElementById('einsatzListe');
    bereich.innerHTML = '';
    daten.forEach(e => {
        const div = document.createElement('div');
        div.className = `einsatz-box einsatz-${e.Einsatzkategorie?.toLowerCase()}`;
        div.innerHTML = `
            <strong>${e.Arbeitseinsatz}</strong><br>
            ${e.Datum || '-'} – ${e.Einsatzzeit || '-'}<br>
            Kategorie: ${e.Einsatzkategorie || '-'}<br>
            Verantwortlich: ${e.Verantwortliche || '-'}<br>
            Punkte: ${e.Punkte || 0} | Helfer: ${e['Benötigte Helfer'] || 0}
        `;

        for (let i = 1; i <= 10; i++) {
            const feld = 'Helfer' + i;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = e[feld] || '';
            input.placeholder = 'Name eintragen...';
            input.className = input.value ? 'helfer-input filled' : 'helfer-input';
            input.dataset.id = e.ID;
            input.dataset.index = i - 1;

            input.addEventListener('change', () => {
                const neuerName = input.value.trim();
                if (!neuerName) return;
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'setHelfer',
                        id: e.ID,
                        index: i - 1,
                        name: neuerName
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(() => ladeEinsaetze());
            });

            div.appendChild(input);
        }

        bereich.appendChild(div);
    });
}

function zeigeAdminEinsaetze(daten) {
    const bereich = document.getElementById('adminEinsaetze');
    bereich.innerHTML = '';
    daten.forEach(e => {
        const div = document.createElement('div');
        div.className = `einsatz-box einsatz-${e.Einsatzkategorie?.toLowerCase()}`;
        div.innerHTML = `
            <strong>${e.Arbeitseinsatz}</strong><br>
            ${e.Datum || '-'} – ${e.Einsatzzeit || '-'}<br>
            Kategorie: ${e.Einsatzkategorie || '-'}<br>
            Verantwortlich: ${e.Verantwortliche || '-'}<br>
            Punkte: ${e.Punkte || 0} | Helfer: ${e['Benötigte Helfer'] || 0}
            <br><br>
            <button class="btn btn-primary">Bearbeiten</button>
            <button class="btn btn-danger">Löschen</button>
        `;
        bereich.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', ladeEinsaetze);
