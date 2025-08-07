function showTab(id, event) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Seite geladen – bereit für weitere Funktionen.");

    // Später: fetch zur Google Apps Script API, z. B.:
    // fetch(SCRIPT_URL + '?action=getData')
    //   .then(response => response.json())
    //   .then(data => renderEinsaetze(data))
    //   .catch(error => console.error('Fehler beim Laden:', error));
});
