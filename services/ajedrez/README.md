# Microservicio de Ajedrez

## Requerimientos de alto nivel

Crear un API RESTful para:


- Crear partidas de ajedrez
- Unirse a partidas de ajedrez
- Jugar partidas de ajedrez
- Mantener un registro de partidas de ajedrez, jugadores y ganadores de cada partida (leaderboard)

Crear una CLI para administrar el microservicio de ajedrez, que permita:

- Inicializar la base de datos
- Crear una nueva partida
- Listar partidas
- Inspeccionar el estado de una partida
- Exportar la definicion de la API en formato OpenAPI (JSON) para que el frontend pueda generar el cliente de la API de ajedrez.


## Ejecucion del microservicio de usuario

### Directamente en el anfitrión

- Abre una terminal
- Cambiate a `services/ajedrez`
- Ejecuta `cargo run --bin ajedrez-server` para arrancar el microservicio de ajedrez.
- Ejecuta `cargo run --bin ajedrez-cli` para iniciar la CLI de administración de ajedrez.


### Usando Docker

- Abre una terminal
- Ejecuta `docker compose watch ajedrez` para arrancar el microservicio de ajedrez en un contenedor Docker.
- Ejecuta `docker compose run --interactive --rm ajedrez-cli` para arrancar la CLI de administración de ajedrez en un contenedor Docker.
- Ejecuta `docker compose run --interactive --rm ajedrez-cli dump-openapi | Out-File -Encoding UTF8 openapi/ajedrez.json` para generar la documentación de la API en formato OpenAPI y guardarla en archivo `openapi/ajedrez.json`. Esto sera útil para regenerar el cliente de la API de ajedrez en el frontend. (Nota: si usas mac o Linux, usa el comando de redireccionamiento `>` en lugar de `| Out-File -Encoding UTF8`).
- 


