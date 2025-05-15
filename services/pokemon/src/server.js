require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { initGameSocket } = require("./websocket/gameSocket");
const { initializePokemonDatabase } = require("./utils/initData");

const server = http.createServer(app);
initGameSocket(server);

const PORT = process.env.PORT || 4002;
// const MONGO_URI = process.env.MONGO_URI || "mongodb://root:example@172.19.0.2:27017/pokemon?authSource=admin&readPreference=primary&directConnection=true&ssl=false";
const MONGO_URI = "mongodb://root:example@localhost:27017/pokemon?authSource=admin&readPreference=primary&directConnection=true&ssl=false";

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 4000, // Timeout after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

const connectWithRetry = () => {
  console.log(`MongoDB connection attempt with URI: ${MONGO_URI}...`);
  
  mongoose.connect(MONGO_URI, mongooseOptions)
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
