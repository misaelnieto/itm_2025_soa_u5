require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { initGameSocket } = require("./websocket/gameSocket");
const { initializePokemonDatabase } = require("./utils/initData");

const server = http.createServer(app);
initGameSocket(server);

const PORT = process.env.PORT || 8083; // docker
// const PORT = 8084; // local
const MONGO_URI = process.env.MONGO_URI || "mongodb://root:example@172.19.0.2:27017/pokemon?authSource=admin&readPreference=primary&directConnection=true&ssl=false"; // docker
// const MONGO_URI = "mongodb://root:example@localhost:27017/pokemon?authSource=admin&readPreference=primary&directConnection=true&ssl=false"; // local


const connectWithRetry = () => {
  console.log(`MongoDB connection attempt with URI: ${MONGO_URI}...`);
  
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log("Successfully connected to MongoDB");
      
      await initializePokemonDatabase();
      
      server.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      console.log("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

// Start connection process
connectWithRetry();
