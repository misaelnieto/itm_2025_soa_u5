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

lockBtn.addEventListener('click', () => {
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

  // Deshabilita y cambia color solo los inputs de guardar
  numeroInputs.forEach(input => {
    input.disabled = true;
    input.style.backgroundColor = '#a1ff95';
    input.style.color = '#1bab08';
    input.style.borderColor = '#45e92f';
  });

  guessArea.style.visibility = 'visible'; // Muestra el área de adivinar
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
let intentoActual = 1;

guessBtn.addEventListener('click', () => {
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

  const fila = document.createElement('tr');

  const celdaIntento = document.createElement('td');
  celdaIntento.textContent = intentoActual++;

  const celdaNumero = document.createElement('td');
  celdaNumero.textContent = numero;

  const celdaPicas = document.createElement('td');
  celdaPicas.textContent = 'n';

  const celdaFijas = document.createElement('td');
  celdaFijas.textContent = 'n';

  fila.appendChild(celdaIntento);
  fila.appendChild(celdaNumero);
  fila.appendChild(celdaPicas);
  fila.appendChild(celdaFijas);

  tablaBody.appendChild(fila);

  guessNums.forEach(input => {
    input.value = '';
  });

  guessNums[0].focus();
  guessBtn.style.visibility = 'hidden'; // Oculta el botón de adivinar
});


const status_contrincante = document.querySelector('.status');

//status cuando el contrincante no está listo #cc0000
status_contrincante.style.color='#cc0000';
status_contrincante.textContent = 'Esperando al contrincante...';

//status cuando el contrincante ya está listo #ccff33
status_contrincante.style.color='#ccff33';
status_contrincante.textContent = '¡Contrincante listo!';


// Limpiar los inputs al cargar la página
window.addEventListener('DOMContentLoaded', () => { 
    const allInputs = document.querySelectorAll('.digit-input');
  
    allInputs.forEach(input => {
    input.value = '';  input.value = '';
    input.disabled = false;
    input.style.backgroundColor = '';
    input.style.color = '';
    input.style.borderColor = '';
  });
});


// Función que se ejecuta cada vez que se escribe en un input
function verificarInputsLlenos() {
  const todosLlenos = Array.from(guessNums).every(input => input.value !== '');
  guessBtn.style.visibility = todosLlenos ? 'visible' : 'hidden';
}

// Agrega un event listener a cada input del grupo de adivinar
guessNums.forEach(input => {
  input.addEventListener('input', verificarInputsLlenos);
});

const socket = new WebSocket("ws://localhost:8096/juegos/picas-backend/ws");
let role = null;

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "role") {
    role = data.role;
    console.log("Tu rol:", role);
  }

  if (data.type === "status") {
    console.log(data.message);
    document.getElementById("contrincante-status").textContent = data.message;
  }

  if (data.type === "start") {
    console.log("¡Ambos jugadores listos!");
    document.getElementById("contrincante-status").textContent = "¡Contrincante listo!";
    document.getElementById("adivina-inputs").style.display = "block";
  }
});

function enviarNumeroSecreto(numero) {
  socket.send(JSON.stringify({
    type: "ready",
    secret: numero
  }));
}