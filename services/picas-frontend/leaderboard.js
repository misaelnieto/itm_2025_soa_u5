 

window.addEventListener('DOMContentLoaded', () => {
  cargarLeaderboard(); ////// Ejecuta automaticamen al cargar la página
});



/////// Funcion para cargar Leaderboard
async function cargarLeaderboard() {
  try {
    const response = await fetch("http://localhost:8096/leaderboard"); //puerto backend
    if (!response.ok) {
      throw new Error("Error al cargar el leaderboard");
    }
    const data = await response.json();
    const leaderboardBody = document.querySelector(".leaderboard tbody");

    leaderboardBody.innerHTML = ""; // Limpiar el contenido existente para evitar duplicados

    data.top.forEach((entry, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.jugador}</td>
      <td>${entry.puntuacion}</td>
      `;
      leaderboardBody.appendChild(fila);
    });
  }
  catch (error) {
    console.error("Error al cargar el leaderboard:", error);
  }
}
