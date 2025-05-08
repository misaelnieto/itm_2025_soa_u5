import { execSync } from "node:child_process"
import { createClient, defaultPlugins } from "@hey-api/openapi-ts"

const services = {
  usuarios: "../../openapi/usuarios.json",
  // ajedrez: "../../openapi/ajedrez.json",
}

for (const [serviceName, serviceDefinition] of Object.entries(services)) {
  console.log(`Generando cliente de API de ${serviceName}`)
  createClient({
    plugins: [...defaultPlugins, "@hey-api/client-fetch"],
    input: serviceDefinition,
    output: `src/client/${serviceName}`,
  })

  console.log(`Formateando el codigo generado para el API de ${serviceName}`)
  execSync(`npx biome format --write ./src/client/${serviceName}`, {
    stdio: "inherit",
  })
}
