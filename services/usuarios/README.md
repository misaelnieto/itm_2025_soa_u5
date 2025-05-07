# Microservicio de usuarios

## Requerimientos de alto nivel

- Implementa el API para el flujo de autenticacion de usuarios
- Implementa la administración básica de usuarios mediante una CLI.

## Requerimientos funcionales

### Flujo de autenticacion de usuarios

```mermaid
sequenceDiagram
    participant Navegador
    participant API as FastAPI App
    participant DB as SQLite DB

    Navegador->>API: POST /login/access-token
    Note right of Navegador: Form Data:<br/>username: string<br/>password: string

    API->>DB: Query User by `user_id`
    DB-->>API: User data

    alt User not found
        API-->>Navegador: 400 Bad Request<br/>"Incorrect user ID or password"
    else User inactive
        API-->>Navegador: 400 Bad Request<br/>"Inactive user"
    else Wrong password
        API-->>Navegador: 400 Bad Request<br/>"Incorrect user ID or password"
    else Success
        API->>API: Generate JWT token
        API-->>Navegador: 200 OK<br/>{<br/>  "access_token": "jwt_token",<br/>  "token_type": "bearer"<br/>}
    end
```

### Validación de Token

```mermaid
sequenceDiagram
    participant Navegador
    participant API as FastAPI App
    participant DB as SQLite DB

    Navegador->>API: POST /login/test-token
    Note right of Navegador: Authorization: Bearer jwt_token

    API->>API: Validate JWT token
    API->>DB: Check token blacklist
    DB-->>API: Blacklist status

    alt Token blacklisted
        API-->>Navegador: 401 Unauthorized<br/>"Token has been invalidated"
    else Invalid token
        API-->>Navegador: 403 Forbidden<br/>"Could not validate credentials"
    else Valid token
        API->>DB: Get user data
        DB-->>API: User data
        API-->>Navegador: 200 OK<br/>{<br/>  "user_id": "string",<br/>  "is_active": boolean,<br/>  "id": number<br/>}
    end
```

### Flujo de cierre de sesión

```mermaid
sequenceDiagram
    participant Navegador
    participant API as FastAPI App
    participant DB as SQLite DB

    Navegador->>API: POST /login/logout
    Note right of Navegador: Authorization: Bearer jwt_token

    API->>API: Validate JWT token
    API->>DB: Check token blacklist
    DB-->>API: Blacklist status

    alt Token blacklisted
        API-->>Navegador: 401 Unauthorized<br/>"Token has been invalidated"
    else Invalid token
        API-->>Navegador: 403 Forbidden<br/>"Could not validate credentials"
    else Valid token
        API->>DB: Add token to blacklist
        DB-->>API: Confirmation
        API-->>Navegador: 200 OK<br/>{<br/>  "message": "Successfully logged out"<br/>}
    end
```

### Protected Resource Access

```mermaid
sequenceDiagram
    participant Navegador
    participant API as FastAPI App
    participant DB as SQLite DB

    Navegador->>API: Request with Authorization header
    Note right of Navegador: Authorization: Bearer jwt_token

    API->>API: Validate JWT token
    API->>DB: Check token blacklist
    DB-->>API: Blacklist status

    alt Token blacklisted
        API-->>Navegador: 401 Unauthorized<br/>"Token has been invalidated"
    else Invalid token
        API-->>Navegador: 403 Forbidden<br/>"Could not validate credentials"
    else Valid token
        API-->>Navegador: 200 OK with requested data
    end
```

## Ejecucion del microservicio de usuario

### Directamente en el anfitrión

- Abre una terminal
- Cambiate a `services/usuarios`
- Ejecuta `uv run fastapi dev` para iniciar el servidor de desarrollo de FastAPI
- Ejecuta `uv run pytest` para correr las pruebas unitarias y de integración.
- Ejecuta `uv run usuarios-cli` para iniciar la CLI de administración de usuarios.


### Usando Docker

- Abre una terminal
- Ejecuta `docker compose watch usuarios` para arrancar el microservicio de usuarios en un contenedor Docker.
- Ejecuta ` docker compose run --rm usuarios-cli` para arrancar la CLI de administración de usuarios en un contenedor Docker.
- Ejecuta `docker compose run --rm usuarios-cli dump-openapi | Out-File -Encoding UTF8 openapi/usuarios.json` para generar la documentación de la API en formato OpenAPI y guardarla en archivo `openapi/usuarios.json`. Esto sera útil para regenerar el cliente de la API de usuarios en el frontend. (Nota: si usas mac o Linux, usa el comando de redireccionamiento `>` en lugar de `| Out-File -Encoding UTF8`).
- 


