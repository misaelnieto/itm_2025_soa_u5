# Memorama - Juego de Memoria

Este microservicio implementa un juego de memorama (juego de memoria) para 2 jugadores que pueden jugar en tiempo real desde diferentes ventanas.

## Características

- Juego de memorama para 2 jugadores
- Comunicación en tiempo real mediante WebSockets
- Frontend desarrollado con React y JSX
- Backend desarrollado con FastAPI

## Requisitos

- Python 3.10 o superior
- Node.js 14 o superior
- npm o yarn

## Estructura del Proyecto

```
services/
  memorama-backend/
    app/
    pyproject.toml
    ...
  memorama-frontend/
    src/
    package.json
    ...
```

## Instalación

### Backend

```bash
cd services/memorama-backend
pip install -e .
```

### Frontend

```bash
cd services/memorama-frontend
npm install
```

## Ejecución en Desarrollo

### Backend

```bash
cd services/memorama-backend
uvicorn app.main:app --reload --port 8083
```

### Frontend

```bash
cd services/memorama-frontend
npm run dev
```

> Por defecto, el frontend se sirve en `http://localhost:3001` (o el puerto configurado en tu proyecto).

## Cómo jugar

1. El primer jugador crea un juego y recibe un ID de juego.
2. El segundo jugador se une al juego usando ese ID.
3. Cuando ambos jugadores están conectados, cualquiera puede iniciar el juego.
4. Los jugadores se turnan para voltear cartas.
5. Si un jugador encuentra un par, gana puntos y continúa su turno.
6. Si no encuentra un par, el turno pasa al otro jugador.
7. El juego termina cuando se han encontrado todos los pares.
8. El jugador con más puntos gana.

## Despliegue con Docker

Este servicio puede ser desplegado como parte de la arquitectura de microservicios utilizando Docker y Traefik.

```bash
cd itm_2025_soa_u5
docker compose build
docker compose up -d
```

- El **backend** y el **frontend** de memorama se levantan como servicios separados.
- El acceso al frontend de memorama será a través de la ruta pública configurada en Traefik, por ejemplo:  
  `http://localhost:8080/memorama`
- El backend expone su API en `/api/memorama`.

> **Nota:** Asegúrate de que las rutas y puertos en el archivo `docker-compose.yml` y las etiquetas de Traefik estén correctamente configuradas para que el enrutamiento funcione.
