// main.js (überarbeitet: Einsatzanzeige mit interaktiven Helferfeldern)

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
        .then(res => res.json())
        .then(json => {
            globaleDaten = json.data;
            globaleSollPunkte = json.sollPunkte;
            zeigeEinsaetze(globaleDaten);
            zeigeElternUebersicht(globaleDaten);
        })
        .catch(err => console.error('Fehler beim Laden:', err));
}

function zeigeEinsaetze(daten) {
    const bereich = document.getElementById('alleEinsaetze');
    if (!bereich) return;
    bereich.innerHTML = '';

    daten.forEach((e, einsatzIndex) => {
        const div = document.createElement('div');
        div.className = 'einsatz-box';

        const helferHTML = [];
        for (let i = 1; i <= 10; i++) {
            const feldName = 'Helfer' + i;
            const name = e[feldName]?.trim() || '';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = name;
            input.placeholder = 'Name eintragen...';
            input.className = name ? 'helfer-input filled' : 'helfer-input';
            input.dataset.einsatzId = e.ID;
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
            helferHTML.push(input);
        }

        div.innerHTML = `
            <div><strong>${e.Arbeitseinsatz}</strong></div>
            <div>${e.Datum || '-'} – ${e.Einsatzzeit || '-'}</div>
            <div>Verantwortlich: ${e.Verantwortliche || '-'}</div>
            <div>Kategorie: ${e.Einsatzkategorie || '-'}</div>
            <div>Punkte: ${e.Punkte || 0} | Helfer: ${e['Benötigte Helfer'] || 0}</div>
        `;
        helferHTML.forEach(el => div.appendChild(el));

        bereich.appendChild(div);
    });
}

function zeigeElternUebersicht(daten) {
    const eltern = {};

    daten.forEach(e => {
        for (let key in e) {
            if (key.startsWith('Helfer') && e[key]) {
                const name = e[key].trim();
                if (name) {
                    eltern[name] = (eltern[name] || 0) + Number(e.Punkte || 0);
                }
            }
        }
    });

    const bereich = document.getElementById('parentOverview');
    bereich.innerHTML = '';
    Object.entries(eltern).forEach(([name, ist]) => {
        const diff = ist - globaleSollPunkte;
        const el = document.createElement('div');
        el.className = 'einsatz-box';
        el.innerHTML = `
            <strong>${name}</strong><br>
            <div class="punkte">
                <span>IST: ${ist}</span>
                <span>SOLL: ${globaleSollPunkte}</span>
                <span class="diff">Differenz: ${diff > 0 ? '+' : ''}${diff}</span>
            </div>
        `;
        bereich.appendChild(el);
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
        div.className = 'einsatz-box';
        div.innerHTML = `
            <strong>${e.Arbeitseinsatz}</strong><br>
            ${e.Datum || '-'} um ${e.Einsatzzeit || '-'}<br>
            ${e.Verantwortliche || '-'} – ${e.Punkte || 0} Std.
        `;
        bereich.appendChild(div);
    });

    const summary = document.createElement('div');
    summary.innerHTML = `<strong>Gesammelte Punkte: ${punkte}/${globaleSollPunkte} (Differenz: ${punkte - globaleSollPunkte})</strong>`;
    bereich.prepend(summary);
}

document.addEventListener('DOMContentLoaded', ladeEinsaetze);
