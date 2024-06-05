const express = require("express");
const router = express.Router();
const User = require("../modules/user");
const bcrypt = require("bcrypt");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users); // Restituisce tutti gli utenti come JSON
  } catch (error) {
    res.status(500).json({ message: error.message }); // Gestisce gli errori interni del server
  }
});

// Get one single user
router.get("/:id", getUser, (req, res) => {
  res.send(res.user); // Restituisce l'utente trovato come JSON
});

// create a user
router.post("/", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" }); // Gestisce il caso in cui l'utente esiste già
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10); // Crea una password hash

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });

    const newUser = await user.save(); // Salva il nuovo utente nel database
    res.status(201).json(newUser); // Restituisce il nuovo utente creato come JSON
  } catch (err) {
    res.status(400).json({ message: err.message }); // Gestisce gli errori di validazione
  }
});

// update a user
router.patch("/:id", getUser, async (req, res) => {
  // Aggiorna le informazioni dell'utente in base alla richiesta PATCH
  if (req.body.firstName != null) {
    res.user.firstName = req.body.firstName;
  }
  if (req.body.lastName != null) {
    res.user.lastName = req.body.lastName;
  }
  if (req.body.password != null) {
    res.user.password = req.body.password;
  }
  try {
    const updatedUser = await res.user.save(); // Salva le modifiche dell'utente nel database
    res.json(updatedUser); // Restituisce l'utente aggiornato come JSON
  } catch (error) {
    res.status(400).json({ message: error.message }); // Gestisce gli errori di validazione
  }
});

// delete a user
router.delete("/:id", getUser, async (req, res) => {
  try {
    await res.user.deleteOne(); // Elimina l'utente dal database
    res.json({ message: "User deleted" }); // Restituisce un messaggio di conferma
  } catch (error) {
    res.status(500).json({ message: error.message }); // Gestisce gli errori interni del server
  }
});

// Middleware per controllare il formato dell'ID e trovare l'utente corrispondente
async function getUser(req, res, next) {
  // Controllo del formato dell'ID
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ message: "Invalid ID format" }); // Restituisce un errore se l'ID non ha il formato corretto
  }

  let user;
  try {
    user = await User.findById(req.params.id); // Cerca l'utente nel database per ID

    if (!user) {
      return res.status(404).json({ message: "User not found" }); // Restituisce un errore se l'utente non viene trovato
    }
  } catch (error) {
    return res.status(500).json({ message: error.message }); // Gestisce gli errori interni del server
  }

  res.user = user; // Memorizza l'utente trovato nella risposta
  next(); // Passa alla prossima funzione middleware
}

// Gestione delle richieste errate
router.use((req, res) => {
  res.status(400).json({ message: "Wrong Request" }); // Restituisce un errore per richieste non gestite
});

module.exports = router; // Esporta il router per l'utilizzo in altre parti dell'applicazione
