const API_URL = "/api/backend-conecta4";

async function fetchState() {
    const res = await fetch(`${API_URL}/state`);
    return await res.json();
}

async function makeMove(column) {
    const res = await fetch(`${API_URL}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column })
    });
    return await res.json();
}

async function resetGame() {
    await fetch(`${API_URL}/reset`, { method: "POST" });
    updateBoard();
}

async function updateBoard() {
    const state = await fetchState();
    console.log(state)
    const board = document.getElementById("board");
    console.log(board)
    const status = document.getElementById("status");
    console.log(status)
    board.innerHTML = "";

    state.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const div = document.createElement("div");
            div.className = "cell";
            if (cell === 1) div.classList.add("red");
            else if (cell === 2) div.classList.add("yellow");
            div.onclick = () => handleClick(colIndex);
            board.appendChild(div);
        });
    });

    if (state.winner !== null) {
        if (state.winner === 0) {
            status.innerText = "¡Empate!";
        } else {
            status.innerText = `¡${state.winner === 1 ? "Rojo" : "Amarillo"} gana!`;
        }
    } else {
        status.innerText = `Turno de: ${state.current_player === 1 ? "Rojo" : "Amarillo"}`;
    }
}

async function handleClick(col) {
    const res = await makeMove(col);
    if (!res.success) alert(res.message);
    updateBoard();
}

window.onload = updateBoard;
