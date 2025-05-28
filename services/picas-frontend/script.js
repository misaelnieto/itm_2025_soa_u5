function setupDigitInputs(containerSelector) {
  const group = document.querySelector(containerSelector);
  const inputs = group.querySelectorAll('.digit-input');

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 1) value = value.charAt(0);
      e.target.value = value;

      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      }

      // Verifica duplicados solo dentro del grupo
      let repeated = false;
      inputs.forEach((otherInput, i) => {
        if (i !== index && otherInput.value === value && value !== '') {
          repeated = true;
        }
      });

      if (repeated) {
        e.target.value = '';
        return;
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].select();
      } else if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].select();
      } else if (e.key === 'Delete' && e.target.value === '' && index < inputs.length - 1) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      }
    });
  });
}

setupDigitInputs('#numero-inputs');
setupDigitInputs('#adivina-inputs');

const numeroInputs = document.querySelectorAll('#numero-inputs .digit-input'); // Solo los inputs para guardar
const guessArea = document.querySelector('.adivinar');
const lockBtn = document.querySelector('.lock-in');
const msj = document.querySelector('.msj');

lockBtn.addEventListener('click', async () => {
  let allFilled = true;
  const numeros = [];

  numeroInputs.forEach(input => {
    if (input.value === '') {
      allFilled = false;
    }
    numeros.push(input.value);
  });

  if (!allFilled) {
    msj.textContent = 'Se tienen que llenar todos los inputs';
    msj.style.color = 'red';
    return;
  } else {
    msj.textContent = '';
  }

  if (!miRol) {
    msj.textContent = 'No se ha asignado tu rol. Espera la conexión.';
    msj.style.color = 'red';
    return;
  }
  try {
    // Solo si el POST fue exitoso, deshabilita inputs y envía ready
    await enviarNumeroSecreto(numeros.join(''), miRol);
    numeroInputs.forEach(input => {
      input.disabled = true;
      input.style.backgroundColor = '#a1ff95';
      input.style.color = '#1bab08';
      input.style.borderColor = '#45e92f';
    });
    msj.textContent = 'Número secreto guardado correctamente';
    msj.style.color = 'green';
    // Enviar ready por WebSocket SOLO si el POST fue exitoso
    socket.send(JSON.stringify({
      type: "ready",
      secret: numeros.join(''),
      jugador: miRol
    }));
  } catch (error) {
    msj.textContent = error.message;
    msj.style.color = 'red';
  }
});

//agregar evento al enter dependiendo de donde esté el cursor
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const activeElement = document.activeElement;

    // Si el cursor está en un input dentro de #adivina-inputs
    if (document.querySelector('#adivina-inputs')?.contains(activeElement)) {
      guessBtn.click();
    }

    // Si el cursor está en un input dentro de #numero-inputs
    else if (document.querySelector('#numero-inputs')?.contains(activeElement)) {
      lockBtn.click();
    }
  }
});


// Agregar evento de clic al botón de adivinar y verificar los inputs
//agregar filas al intentar adivinar
//despues de agregar la fila, limpiar los inputs
const guessNums = document.querySelectorAll('#adivina-inputs .digit-input');
const guessBtn = document.querySelector('.guess-btn');
const tablaBody = document.querySelector('.trys-table tbody');
let intentos = [];

async function enviarIntento(jugador, intento) {
  const response = await fetch("http://localhost:8096/intentar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id_partida: "partida-unica",
      jugador: miRol,
      intento: intento
    })
  });
  console.log(`Enviando intento: ${intento} para el jugador: ${miRol}`);
  if (!response.ok) {
    let errorMsg = "Error al intentar adivinar";
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {}
    throw new Error(errorMsg);
  }
  return await response.json();
}

async function actualizarEstadoPartida(id_partida, finalizada, ganador, puntuacion) {
  const response = await fetch("http://localhost:8096/actualizar-estado", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id_partida,
      finalizada,
      ganador,
      puntuacion
    })
  });
  if (!response.ok) {
    let errorMsg = "Error al actualizar el estado";
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {}
    throw new Error(errorMsg);
  }
  return await response.json();
}

async function obtenerEstadoPartida() {
  const response = await fetch("http://localhost:8096/estado");
  if (!response.ok) throw new Error("No se pudo obtener el estado de la partida");
  return await response.json();
}

guessBtn.addEventListener('click', async () => {
  const numeros = [];
  let firstEmptyIndex = -1;

  guessNums.forEach((input, index) => {
    if (input.value === '' && firstEmptyIndex === -1) {
      firstEmptyIndex = index;
    }
    numeros.push(input.value);
  });

  if (firstEmptyIndex !== -1) {
    guessNums[firstEmptyIndex].focus();
    return;
  }

  const numero = numeros.join('');

    try {
    const estado = await obtenerEstadoPartida();
    if (estado.finalizada) {
      msj.textContent = `¡Juego terminado! Ganador: ${estado.ganador} con ${estado.puntuacion} puntos`;
      msj.style.color = 'blue';
      numeroInputs.forEach(input => input.disabled = true);
      guessNums.forEach(input => input.disabled = true);
      lockBtn.disabled = true;
      guessBtn.disabled = true;
      return;
    }

  } catch (e) {
    msj.textContent = "No se pudo verificar el estado de la partida";
    msj.style.color = 'red';
    return;
  }

  if (!miRol) {
    msj.textContent = 'No se ha asignado tu rol. Espera la conexión.';
    msj.style.color = 'red';
    return;
  }
  try {
    const response = await enviarIntento(miRol, numero);
    // Manejar la respuesta del backend
    const { intento, picas, fijas, intentos: nIntentos } = response;
    intentos.unshift({
      intento: numero,
      picas: picas,
      fijas: fijas,
      intentos: nIntentos
    });

    await actualizarEstadoPartida(
    "partida-unica",
    response.finalizada,
    response.finalizada ? miRol : null,
    response.finalizada ? response.puntuacion : null
    );

    // Limpiar la tabla
    tablaBody.innerHTML = '';
    // Renderizar los intentos en orden descendente
    intentos.forEach((item, idx) => {
      const fila = document.createElement('tr');
      const celdaIntento = document.createElement('td');
      celdaIntento.textContent = intentos.length - idx; // Descendente
      const celdaNumero = document.createElement('td');
      celdaNumero.textContent = item.intento;
      const celdaPicas = document.createElement('td');
      celdaPicas.textContent = item.picas;
      const celdaFijas = document.createElement('td');
      celdaFijas.textContent = item.fijas;
      fila.appendChild(celdaIntento);
      fila.appendChild(celdaNumero);
      fila.appendChild(celdaPicas);
      fila.appendChild(celdaFijas);
      tablaBody.appendChild(fila);
    });
    // Limpiar los inputs después de enviar
    guessNums.forEach(input => {
      input.value = '';
    });
    guessNums[0].focus();
    guessBtn.style.visibility = 'hidden';
  
  if (fijas === 5) {
     

    const puntaje = Math.max(0, 5000 - (nIntentos * 18));

    const test = JSON.stringify({
          jugador: name_user,
          puntuacion: puntaje
        });
    console.log(test);
      

          await fetch("http://localhost:8096/insert_leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jugador: name_user,
          puntuacion: puntaje
        })
      });


      msj.textContent = `¡Juego terminado! Ganador: ${miRol} con ${response.puntuacion || '???'} puntos`;
      msj.style.color = 'blue';
      numeroInputs.forEach(input => input.disabled = true);
      guessNums.forEach(input => input.disabled = true);
      lockBtn.disabled = true;
      guessBtn.disabled = true;
      if (historialInterval) {
        clearInterval(historialInterval);
        historialInterval = null;
      }
      // El backend ya se actualiza solo
      return;
    }
  }
  catch (error) {
    msj.textContent = error.message;
    msj.style.color = 'red';
    console.error("Error al enviar el intento:", error);
  }
});

let nombre_usuario = document.querySelector('.nombre-jugador');
let name_user = "";
// Función para obtener y mostrar el nombre de usuario autenticado en .msj o en un elemento específico
function mostrarNombreUsuario() {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  fetch('http://itm-soa.io/api/usuarios/test-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(data => {
      // Si existe el elemento con id player-name, úsalo; si no, usa .msj
      const playerNameElem = document.getElementById("player-name");
      if (playerNameElem) {
        playerNameElem.textContent = data.user_id;
      } else if (msj) {
        nombre_usuario.textContent = data.user_id;
        name_user= data.user_id;
      }
    })
    .catch(error => console.error('Error:', error));
}


// Limpiar los inputs al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  mostrarNombreUsuario();
  const allInputs = document.querySelectorAll('.digit-input');
  allInputs.forEach(input => {
    input.value = '';
    input.disabled = false;
    input.style.backgroundColor = '';
    input.style.color = '';
    input.style.borderColor = '';
  });
  cargarLeaderboard(); ////// Ejecuta automaticamen al cargar la página
});


// Función que se ejecuta cada vez que se escribe en un input
// Asegúrate de mostrar el botón cuando los inputs estén llenos
function verificarInputsLlenos() {
  const todosLlenos = Array.from(guessNums).every(input => input.value !== '');
  guessBtn.style.visibility = todosLlenos ? 'visible' : 'hidden';
  guessBtn.disabled = !todosLlenos;
}

// Agrega un event listener a cada input del grupo de adivinar
guessNums.forEach(input => {
  input.addEventListener('input', verificarInputsLlenos);
});

const status_contrincante = document.querySelector('.status');
const socket = new WebSocket("ws://localhost:8096/juegos/picas-backend/ws");
const waitOverlay = document.querySelector('.wait-background');
let historialInterval = null;

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "status") {
    if (data.status === "ready") {
      status_contrincante.textContent = "¡Contrincante listo!";
      status_contrincante.style.color = '#ccff33';
    } else if (data.status === "waiting") {
      status_contrincante.textContent = "Esperando al contrincante...";
      status_contrincante.style.color = '#cc0000';
    }
  }

  if (data.type === "both_connected") {
    document.getElementById("adivina-inputs").style.display = "block";
    // Oculta la pantalla de espera
    waitOverlay.classList.add('hidden');
    setTimeout(() => {waitOverlay.remove();}, 500);
  }

  if (data.type === "start") {
    // Muestra el área de adivinar
    guessArea.style.visibility = 'visible';
    verificarInputsLlenos();

    const vsContainer = document.querySelector('.vs-container');
    vsContainer.style.visibility = 'visible';
    // Iniciar polling SOLO al recibir 'start'
    if (!historialInterval) {
      historialInterval = setInterval(() => {
        if (typeof cargarYRenderizarHistorial === 'function') {
          cargarYRenderizarHistorial();
        }
      }, 1000);
    }
  }

  if (data.type === "opponent_left") {
    // Limpiar el intervalo si el oponente se va
    if (historialInterval) {
      clearInterval(historialInterval);
      historialInterval = null;
    }
    // Si el oponente se desconecta, recarga la página para reiniciar el estado
    window.location.reload();
  }
 
  if (data.type === "game_over"){
    //Mostrar mensaje de ganador
    msj.textContent = `¡Juego terminado! Ganador: ${data.ganador} con ${data.puntuacion} puntos`;
    msj.style.color = 'blue';

    /// Deshabilitar inputs y botoenes para evitar mas jugadas
    numeroInputs.forEach(input => input.disabled = true);
    guessNums.forEach(input => input.disabled = true);
    lockBtn.disabled = true;
    guessBtn.disabled = true;

    //// Detener cualquier intervalo que este corriendo datos
    if (historialInterval) {
      clearInterval(historialInterval);
      historialInterval = null;
    } 

    // mostrar
  }

});


async function enviarNumeroSecreto(numero, jugador) {
  // 1. Registrar el número secreto vía HTTP
  const response = await fetch("http://localhost:8096/registrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id_partida: "partida-unica",
      jugador: miRol,
      secreto: numero
    })
  });
  console.log(`Enviando número secreto: ${numero} para el jugador: ${miRol}`);
  if (!response.ok) {
    let errorMsg = "Error al registrar el número";
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
    } catch {}
    throw new Error(errorMsg);
  }
  // Ya no enviar ready aquí, solo devolver la respuesta
  return await response.json();
}


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

let miRol = null;

// Conectar al WebSocket y asignar el rol del jugador
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "role") {
    miRol = data.role;  // guardar si eres jugador1 o jugador2
  }
};


// Función para cargar y renderizar SOLO la tabla del contrincante
async function cargarYRenderizarHistorial() {
  if (!miRol) return;
  try {
    const contrincante = miRol === 'jugador1' ? 'jugador2' : 'jugador1';
    const respVs = await fetch(`http://localhost:8096/historial/${contrincante}`);
    const dataVs = await respVs.json();
    const vsTableBody = document.querySelector('.vs-table tbody');
    if (vsTableBody) {
      vsTableBody.innerHTML = '';
      // Ordenar historial de forma descendente (último intento primero)
      const historialDesc = [...dataVs.historial].reverse();
      historialDesc.forEach((item, idx) => {
        const fila = document.createElement('tr');
        const celdaIntento = document.createElement('td');
        celdaIntento.textContent = historialDesc.length - idx; // Descendente
        const celdaNumero = document.createElement('td');
        celdaNumero.textContent = item.intento;
        const celdaPicas = document.createElement('td');
        celdaPicas.textContent = item.picas;
        const celdaFijas = document.createElement('td');
        celdaFijas.textContent = item.fijas;
        fila.appendChild(celdaIntento);
        fila.appendChild(celdaNumero);
        fila.appendChild(celdaPicas);
        fila.appendChild(celdaFijas);
        vsTableBody.appendChild(fila);
      });
    }
  } catch (e) {
    // Silenciar errores de fetch
  }
}

