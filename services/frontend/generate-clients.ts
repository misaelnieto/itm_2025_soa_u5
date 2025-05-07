import { createClient } from '@hey-api/openapi-ts';

const services = {
  usuarios: '../../openapi/usuarios.json',
  ajedrez: '../../openapi/ajedrez.json',
};


Object.entries(services).forEach(([serviceName, serviceDefinition]) => {
  createClient({
    client: '@hey-api/client-fetch',
    input: serviceDefinition,
    output: `src/client/${serviceName}`,
  });
});
