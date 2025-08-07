const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZ1P23tsbN5zX-BmqG8eNCg0GhxcTdBhxrogBAZYjheiTZGXPuvOo3PhVEx8SVjCAhqQ/exec';

function showTab(id, event) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}

function loginAdmin() {
    const password = document.getElementById('adminPasswort').value;
    if (password === '7ZwergeRadolfzell') {
        document.getElementById('adminArea').style.display = 'block';
    } else {
        alert('Falsches Passwort');
    }
}

function addEinsatz() {
    const data = {
        arbeitseinsatz: document.getElementById('einsatzTitel').value,
        datum: document.getElementById('einsatzDatum').value,
        uhrzeit: document.getElementById('einsatzUhrzeit').value,
        verantwortlich: document.getElementById('einsatzVerantwortlich').value,
        stunden: document.getElementById('einsatzStunden').value,
        helferanzahl: document.getElementById('einsatzHelferanzahl').value
    };

    fetch(SCRIPT_URL + '?action=addEinsatz', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.text())
    .then(msg => {
        alert('Einsatz hinzugefügt');
        location.reload();
    })
    .catch(err => console.error('Fehler beim Hinzufügen:', err));
}

function zeigeEigeneEinsaetze() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) {
        alert('Bitte Namen eingeben');
        return;
    }

    fetch(SCRIPT_URL + '?action=getData')
        .then(res => res.json())
        .then(data => {
            const eigene = data.filter(e => e.helfer.includes(name));
            const block = document.getElementById('eigeneEinsaetze');
            block.innerHTML = '<h3>Meine Einsätze</h3>' +
                eigene.map(e => `<p>${e.datum} – ${e.arbeitseinsatz}</p>`).join('');
        })
        .catch(err => console.error('Fehler beim Abrufen:', err));
}
