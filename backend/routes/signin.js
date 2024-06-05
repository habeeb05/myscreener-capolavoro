const express = require("express");
const router = express.Router();
const User = require("../modules/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Route per la login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cerca l'utente nel database per email
    const user = await User.findOne({ email });

    // Se l'utente non esiste o la password non corrisponde, restituisci un errore
    if (!user || !(await user.isValidPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Genera un token JWT con payload contenente l'ID dell'utente
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Invia il token JWT come risposta
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
