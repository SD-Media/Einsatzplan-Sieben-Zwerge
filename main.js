// --- EINSTELLUNGEN UND VARIABLEN ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

let globaleDaten = [];
let globaleSollPunkte = 10;

// --- SEITENNAVIGATION ---
function showTab(id, event) {
  document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
  event.target.classList.add('active');
}

// --- PASSWORTFELD UMSCHALTEN UND ENTER-LOGIN ---
function togglePasswort() {
  const input = document.getElementById('adminPasswort');
  input.type = input.type === 'password' ? 'text' : 'password';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('adminPasswort').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginAdmin();
  });
  ladeEinsaetze();
});

function loginAdmin() {
  const eingabe = document.getElementById('adminPasswort').value;
  if (eingabe === ADMIN_PASSWORT) {
    document.getElementById('adminArea').style.display = 'block';
  } else {
    alert('Falsches Passwort');
  }
}

// --- EINTRAG HINZUFÜGEN ---
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
  }).then(() => {
    alert('Einsatz erfolgreich gespeichert.');
    ladeEinsaetze();
  });
}

// --- ALLE HELFER ZURÜCKSETZEN ---
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

// --- EINTRÄGE LADEN ---
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

// --- ELTERNÜBERSICHT ---
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

// --- EIGENE EINTRÄGE ZEIGEN ---
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
    const farbe = e.Einsatzkategorie?.toLowerCase().replace(/\s+/g, '');
    const div = document.createElement('div');
    div.className = `einsatz-box einsatz-${farbe}`;
    div.innerHTML = `
      <strong>${e.Arbeitseinsatz}</strong><br>
      ${e.Datum || '-'} – ${e.Einsatzzeit || '-'}<br>
      Verantwortlich: ${e.Verantwortliche || '-'}<br>
      Kategorie: ${e.Einsatzkategorie || '-'}
    `;
    bereich.appendChild(div);
  });

  const summary = document.createElement('div');
  summary.innerHTML = `<strong>Gesammelte Punkte: ${punkte} / ${globaleSollPunkte} (Differenz: ${punkte - globaleSollPunkte})</strong>`;
  bereich.prepend(summary);

  const druckBtn = document.createElement('button');
  druckBtn.textContent = 'Diese Ansicht drucken';
  druckBtn.className = 'btn btn-print';
  druckBtn.onclick = () => window.print();
  bereich.appendChild(druckBtn);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', ladeEinsaetze);
