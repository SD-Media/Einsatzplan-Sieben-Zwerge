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
        adminPassword: ADMIN_PASSWORT,
        name: document.getElementById('einsatzTitel').value,
        datum: document.getElementById('einsatzDatum').value,
        uhrzeit: document.getElementById('einsatzUhrzeit').value,
        verantwortlich: document.getElementById('einsatzVerantwortlich').value,
        kategorie: document.getElementById('einsatzKategorie').value,
        punkte: parseInt(document.getElementById('einsatzStunden').value),
        helferanzahl: parseInt(document.getElementById('einsatzHelferanzahl').value)
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
                daten = parsed.data || [];
                if (!Array.isArray(daten)) throw new Error("Erwartetes Array nicht gefunden");
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
        const helfer = getHelferListe(e).length;
        const div = document.createElement('div');
        div.className = 'einsatz-box';
        div.innerHTML = `
            <strong>${e["Arbeitseinsatz"] || e["Titel"] || "Unbenannt"}</strong><br>
            ${e["Datum"] || ''} um ${e["Einsatzzeit"] || ''}<br>
            ${e["Verantwortlicher"] || ''} – ${e["Punkte"] || 0} Punkte – ${helfer}/${e["Benötigte Helfer"] || 0} Helfer
        `;
        bereich.appendChild(div);
    });
}

function zeigeEltern(daten) {
    const eltern = {};
    daten.forEach(e => {
        const punkte = Number(e["Punkte"] || 0);
        getHelferListe(e).forEach(name => {
            if (!eltern[name]) eltern[name] = 0;
            eltern[name] += punkte;
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

    fetch(SCRIPT_URL)
        .then(res => res.text())
        .then(text => {
            let daten;
            try {
                const parsed = JSON.parse(text);
                daten = parsed.data || [];
                if (!Array.isArray(daten)) throw new Error("Erwartetes Array nicht gefunden");
            } catch (e) {
                console.error("Fehler bei Eigeneinsätzen:", e);
                return;
            }

            const eigene = daten.filter(e =>
                getHelferListe(e).includes(name)
            );

            const bereich = document.getElementById('eigeneEinsaetze');
            bereich.innerHTML = '';
            eigene.forEach(e => {
                const div = document.createElement('div');
                div.className = 'einsatz-box';
                div.innerHTML = `
                    <strong>${e["Arbeitseinsatz"] || e["Titel"] || "Unbenannt"}</strong><br>
                    ${e["Datum"] || ''} um ${e["Einsatzzeit"] || ''}<br>
                    ${e["Verantwortlicher"] || ''} – ${e["Punkte"] || 0} Punkte
                `;
                bereich.appendChild(div);
            });
        });
}

function getHelferListe(e) {
    const helfer = [];
    for (let i = 1; i <= 10; i++) {
        const feld = e[`Helfer${i}`];
        if (feld && feld.trim()) helfer.push(feld.trim());
    }
    return helfer;
}

document.addEventListener('DOMContentLoaded', () => {
    ladeEinsaetze();
    document.getElementById("adminPasswort").addEventListener("keypress", function (e) {
        if (e.key === "Enter") loginAdmin();
    });
});
