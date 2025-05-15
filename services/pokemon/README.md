# Servicio de Pokémon

Este microservicio proporciona una API y WebSockets para un juego de Pokémon por turnos.

## Características

- Batalla de Pokémon por turnos en tiempo real utilizando WebSockets
- Selección de Pokémon
- Sistema de matchmaking para conectar jugadores
- Cálculo de daño basado en tipos y estadísticas
- Registro de partidas y movimientos en MongoDB
- Sistema de leaderboard para seguir las estadísticas de los jugadores

## Estructura del proyecto

```
services/pokemon/
├── src/
│   ├── models/          # Modelos de datos (MongoDB/Mongoose)
│   │   ├── Match.js     # Modelo para las partidas
│   │   └── Pokemon.js   # Modelo para los pokémon
│   ├── routes/          # Rutas API REST
│   │   ├── matchRoutes.js  # Rutas relacionadas con partidas
│   │   └── pokemonRoutes.js # Rutas relacionadas con pokémon
│   ├── utils/           # Utilidades
│   │   └── initData.js  # Inicialización de datos
│   ├── websocket/       # Lógica de WebSockets
│   │   └── gameSocket.js # Implementación del servidor WebSocket
│   ├── app.js           # Configuración Express
│   └── server.js        # Punto de entrada
├── Dockerfile           # Configuración Docker
├── .env                 # Variables de entorno (local)
└── package.json         # Dependencias y scripts
```

## API REST

### Endpoints de Pokémon

- `GET /api/pokemons` - Obtener todos los pokémon disponibles
- `GET /api/pokemons/:id` - Obtener un pokémon específico por ID

### Endpoints de Partidas

- `GET /api/matches` - Obtener todas las partidas
- `GET /api/matches/user/:username` - Obtener partidas de un usuario específico
- `GET /api/matches/:id` - Obtener una partida por ID
- `GET /api/matches/room/:roomId` - Obtener una partida por roomId
- `GET /api/stats/leaderboard` - Obtener estadísticas de jugadores (leaderboard)

## Protocolo WebSocket

### Eventos del Cliente

- `join`: Unirse al matchmaking
  ```json
  { "type": "join", "username": "player1", "pokemonId": "60d21b4667d0d8992e610c85" }
  ```

- `selectPokemon`: Seleccionar un Pokémon
  ```json
  { "type": "selectPokemon", "pokemonId": "60d21b4667d0d8992e610c85" }
  ```

- `move`: Realizar un movimiento
  ```json
  { "type": "move", "move": "Thunderbolt" }
  ```

### Eventos del Servidor

- `waiting`: Esperando a otro jugador
  ```json
  { "type": "waiting", "message": "Esperando otro jugador..." }
  ```

- `start`: Inicio de partida
  ```json
  {
    "type": "start",
    "message": "¡Combate iniciado!",
    "roomId": "1234567890",
    "players": [
      { "username": "player1", "pokemon": { ... } },
      { "username": "player2", "pokemon": { ... } }
    ],
    "yourTurn": true
  }
  ```

- `moveResult`: Resultado de un movimiento realizado
  ```json
  {
    "type": "moveResult",
    "move": "Thunderbolt",
    "result": {
      "success": true,
      "damage": 45,
      "message": "Pikachu usó Thunderbolt. ¡Es súper efectivo!",
      "effectiveness": "super effective",
      "battleEnded": false
    },
    "yourTurn": false
  }
  ```

- `opponentMove`: Movimiento realizado por el oponente
  ```json
  {
    "type": "opponentMove",
    "move": "Flamethrower",
    "result": { ... },
    "yourTurn": true
  }
  ```

- `battleEnd`: Fin de la batalla
  ```json
  {
    "type": "battleEnd",
    "winner": "Pikachu",
    "message": "¡Pikachu ha ganado la batalla!"
  }
  ```

- `error`: Error en el proceso
  ```json
  { "type": "error", "message": "Error al procesar el movimiento" }
  ```

## Ejecutar el servicio

### Localmente

```bash
npm install
npm run dev
```

### Con Docker Compose

```bash
docker-compose up pokemon
```

## Base de datos

El servicio utiliza MongoDB para almacenar:

- Colección de Pokémon: Datos de los Pokémon disponibles (nombre, tipo, stats, movimientos)
- Colección de Partidas: Registro de partidas (jugadores, movimientos, ganador)
