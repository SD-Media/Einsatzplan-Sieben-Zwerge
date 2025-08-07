// main.js – Fehlerbehebung: Speicherung, Admin-Ansicht, Elternübersicht, Druckfunktion
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';
const ADMIN_PASSWORT = 'SiebenZwerge';

let globaleDaten = [];
let globaleSollPunkte = 10;
let eigeneEinsaetzeGedruckt = false;

const kategorieFarbeMap = {
  Gartenarbeit: 'gartenarbeit',
  Verkaufsaktion: 'verkaufsaktion',
  Feste: 'feste',
  Kindergartenpflege: 'kindergartenpflege',
  Sonstiges: 'sonstiges'
};

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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('adminPasswort').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginAdmin();
  });
  ladeEinsaetze();
});

function loginAdmin() {
  const eingabe = document.getElementById('adminPasswort').value;
  if (eingabe === ADMIN_PASSWORT) {
    document.getElementById('adminArea').style.display = 'block';
    zeigeAdminEinsaetze(globaleDaten);
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
      zeigeElternUebersicht(globaleDaten);
      zeigeAlleEinsaetze(globaleDaten);
      if (document.getElementById('adminArea').style.display === 'block') {
        zeigeAdminEinsaetze(globaleDaten);
      }
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
  Object.entries(eltern).sort().forEach(([name, ist]) => {
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

  eigeneEinsaetzeGedruckt = true;

  const eigene = globaleDaten.filter(e =>
    Object.keys(e).some(k => k.startsWith('Helfer') && e[k]?.trim() === name)
  );

  const bereich = document.getElementById('eigeneEinsaetze');
  bereich.innerHTML = '';

  let punkte = 0;
  eigene.forEach(e => {
    punkte += Number(e.Punkte || 0);
    const farbe = kategorieFarbeMap[e.Einsatzkategorie] || 'grau';
    let helferanzahl = parseInt(e.Helferanzahl);
    if (isNaN(helferanzahl)) helferanzahl = 0;
    let belegt = 0;
    for (let i = 0; i < helferanzahl; i++) {
      if (e[`Helfer${i+1}`]) belegt++;
    }
    const div = document.createElement('div');
    div.className = `einsatz-box einsatz-${farbe}`;
    div.innerHTML = `
      <strong>${e.Arbeitseinsatz}</strong><br>
      ${e.Datum || '-'} – ${e.Einsatzzeit || '-'}<br>
      Verantwortlich: ${e.Verantwortliche || '-'}<br>
      Kategorie: ${e.Einsatzkategorie || '-'}<br>
      Punkte: ${e.Punkte || '0'}<br>
      Helfer: ${belegt} / ${helferanzahl}
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

function zeigeAlleEinsaetze(daten) {
  const container = document.getElementById('einsatzListe');
  container.innerHTML = '';

  daten.forEach(e => {
    const farbe = kategorieFarbeMap[e.Einsatzkategorie] || 'grau';
    let helferanzahl = parseInt(e.Helferanzahl);
    if (isNaN(helferanzahl)) helferanzahl = 0;
    let belegt = 0;
    for (let i = 0; i < helferanzahl; i++) {
      if (e[`Helfer${i+1}`]) belegt++;
    }
    const div = document.createElement('div');
    div.className = `einsatz-box einsatz-${farbe}`;
    div.innerHTML = `
      <strong>${e.Arbeitseinsatz}</strong><br>
      ${e.Datum || ''} – ${e.Einsatzzeit || ''}<br>
      Verantwortlich: ${e.Verantwortliche || ''}<br>
      Kategorie: ${e.Einsatzkategorie || ''}<br>
      Punkte: ${e.Punkte || '0'}<br>
      Helfer: ${belegt} / ${helferanzahl}<br>
    `;
    for (let i = 0; i < helferanzahl; i++) {
      const input = document.createElement('input');
      input.className = 'helfer-input';
      input.placeholder = 'Name eintragen...';
      input.value = e[`Helfer${i+1}`] || '';
      input.onchange = () => {
        setHelfer(e.ID, i, input.value);
      };
      if (input.value.trim()) input.classList.add('filled');
      input.addEventListener('input', () => {
        input.classList.toggle('filled', input.value.trim() !== '');
      });
      div.appendChild(input);
    }
    container.appendChild(div);
  });
}

function zeigeAdminEinsaetze(daten) {
  const bereich = document.getElementById('adminEinsaetze');
  bereich.innerHTML = '';

  daten.forEach(e => {
    const div = document.createElement('div');
    div.className = 'einsatz-box';
    div.innerHTML = `
      <strong>${e.Arbeitseinsatz}</strong><br>
      ${e.Datum || ''} – ${e.Einsatzzeit || ''}<br>
      Kategorie: ${e.Einsatzkategorie || ''}<br>
      Punkte: ${e.Punkte || '0'}<br>
      Helferanzahl: ${e.Helferanzahl || '0'}<br>
      <button onclick="bearbeiteEinsatz('${e.ID}')">Bearbeiten</button>
      <button onclick="loescheEinsatz('${e.ID}')">Löschen</button>
    `;
    bereich.appendChild(div);
  });
}

function bearbeiteEinsatz(id) {
  const e = globaleDaten.find(d => d.ID == id);
  if (!e) return;
  document.getElementById('bearbeitenID').value = e.ID;
  document.getElementById('bearbeitenTitel').value = e.Arbeitseinsatz;
  document.getElementById('bearbeitenDatum').value = e.Datum;
  document.getElementById('bearbeitenUhrzeit').value = e.Einsatzzeit;
  document.getElementById('bearbeitenVerantwortlich').value = e.Verantwortliche;
  document.getElementById('bearbeitenKategorie').value = e.Einsatzkategorie;
  document.getElementById('bearbeitenPunkte').value = e.Punkte;
  document.getElementById('bearbeitenHelferanzahl').value = e.Helferanzahl;
  document.getElementById('bearbeitenModal').style.display = 'flex';
}

function loescheEinsatz(id) {
  if (!confirm("Einsatz wirklich löschen?")) return;
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'deleteEinsatz', id, adminPassword: ADMIN_PASSWORT }),
    headers: { 'Content-Type': 'application/json' }
  }).then(() => ladeEinsaetze());
}

function setHelfer(id, index, name) {
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'setHelfer', id, index, name }),
    headers: { 'Content-Type': 'application/json' }
  }).then(() => ladeEinsaetze());
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
  }).then(() => {
    alert('Einsatz erfolgreich gespeichert.');
    ladeEinsaetze();
  });
}

function resetAlleHelfer() {
  if (!confirm("Alle Helfereinträge wirklich löschen?")) return;
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'removeAllHelfer', adminPassword: ADMIN_PASSWORT }),
    headers: { 'Content-Type': 'application/json' }
  }).then(() => ladeEinsaetze());
}

function speichereBearbeitung() {
  const daten = {
    action: 'updateEinsatz',
    adminPassword: ADMIN_PASSWORT,
    id: document.getElementById('bearbeitenID').value,
    name: document.getElementById('bearbeitenTitel').value,
    datum: document.getElementById('bearbeitenDatum').value,
    uhrzeit: document.getElementById('bearbeitenUhrzeit').value,
    verantwortlich: document.getElementById('bearbeitenVerantwortlich').value,
    kategorie: document.getElementById('bearbeitenKategorie').value,
    punkte: document.getElementById('bearbeitenPunkte').value,
    helferanzahl: document.getElementById('bearbeitenHelferanzahl').value
  };
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(daten),
    headers: { 'Content-Type': 'application/json' }
  }).then(() => {
    schliesseBearbeitenModal();
    ladeEinsaetze();
  });
}

function schliesseBearbeitenModal() {
  document.getElementById('bearbeitenModal').style.display = 'none';
}
