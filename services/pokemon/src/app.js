const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const pokemonRoutes = require("./routes/pokemonRoutes");
const matchRoutes = require("./routes/matchRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas API
app.use('/api/pokemon-service',pokemonRoutes);
app.use('/api/pokemon-service',matchRoutes);

app.get("/", (req, res) => {
  res.send("Servidor backend del juego Pokémon por turnos");
});

module.exports = app;
