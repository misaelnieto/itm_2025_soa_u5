// src/routes/pokemonRoutes.js
const express = require('express');
const Pokemon = require('../models/Pokemon');

const router = express.Router();

// Obtener todos los pokemones
router.get('/pokemons', async (req, res) => {
  try {
    const pokemons = await Pokemon.find();
    res.json(pokemons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un pokemon por ID
router.get('/pokemons/:id', async (req, res) => {
  try {
    const pokemon = await Pokemon.findById(req.params.id);
    if (!pokemon) {
      return res.status(404).json({ message: 'Pokémon no encontrado' });
    }
    res.json(pokemon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
