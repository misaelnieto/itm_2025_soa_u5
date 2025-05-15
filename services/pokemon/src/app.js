const express = require("express");
const cors = require("cors");
const pokemonRoutes = require("./routes/pokemonRoutes");
const matchRoutes = require("./routes/matchRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api', pokemonRoutes);
app.use('/api', matchRoutes);

app.get("/", (req, res) => {
  res.send("Servidor backend del juego Pokémon por turnos");
});

module.exports = app;
