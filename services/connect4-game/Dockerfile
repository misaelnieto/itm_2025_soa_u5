FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias y nodemon para desarrollo
RUN npm install && npm install -g nodemon

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 8090

# Comando para iniciar la aplicación
CMD ["npm", "run", "dev"]