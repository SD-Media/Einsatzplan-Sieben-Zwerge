
function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
    event.target.classList.add('active');
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('Einsatzplan geladen');
});
