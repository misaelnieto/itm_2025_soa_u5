# Conecta 4

Este proyecto es una implementación del juego Conecta 4, que permite a múltiples jugadores competir en tiempo real a través de WebSocket. El juego está diseñado para ser jugado en un navegador web y se conecta a un servidor que maneja la lógica del juego y la base de datos.

## Estructura del Proyecto

- `src/client/`: Contiene los archivos del lado del cliente, incluyendo HTML, CSS y JavaScript.
- `src/server/`: Contiene los archivos del lado del servidor, incluyendo la configuración del servidor, la lógica del juego y la gestión de WebSocket.
- `src/models/`: Contiene los modelos de datos para el juego, los jugadores y las salas.
- `src/config/`: Contiene la configuración de la base de datos.

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL del repositorio>
   ```
2. Navega al directorio del proyecto:
   ```
   cd connect4-game
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

## Ejecución

Para iniciar el servidor, ejecuta el siguiente comando:
```
node src/server/server.js
```
El servidor escuchará en el puerto 8090.

## Reglas del Juego

- Los jugadores se turnan para colocar sus fichas en un tablero de 7 columnas y 6 filas.
- El primer jugador que logre alinear 4 fichas en línea (horizontal, vertical o diagonal) gana el juego.
- Si el tablero se llena sin que haya un ganador, el juego termina en empate.

¡Diviértete jugando Conecta 4!