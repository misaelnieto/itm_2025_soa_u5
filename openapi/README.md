# Repoositorio de APIs de microservicios

Este carpeta contiene las definiciones de las APIs de los microservicios del
proyecto en formato OpenAPI. Estas definiciones son utilizadas para generar
automáticamente el codigo para el cliente de API del frontend
(`services/frontend`) en typescipt. Hay un cliente para cada microservicio, y
cada cliente se genera a partir de la definición de la API correspondiente
usando el comando `npm run generate-client`.

Cuando actualices el API de tu microservicio, asegúrate de actualizar también el
archivo correspondiente. Este archivo es utilizado por la documentación generada
automáticamente y por los clientes que consumen tu API.

Cuando agregues un nuevo microservicio, asegúrate de agregar la definición de la
API en formato OpenAPI/json a esta carpeta y modifica el archivo
`services/frontend/open-ts.config.json` para que se incluya el nuevo archivo. El
cliente se generará automáticamente al ejecutar el comando 
`npm run generate-clients`.

## Generación de la API del microservicio de usuarios

A continuación se describen los pasos para generar la definición de la API del

```powershell
docker compose run --rm usuarios-cli dump-openapi | Out-File -Encoding UTF8 openapi/usuarios.json
```

Luego genera el cliente de la API de usuarios en el frontend. Para esto, usa los siguientes comandos:

```powershell
cd services/frontend
npm install
npm run generate-clients
```

