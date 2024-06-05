const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());

mongoose.connect(process.env.DB);
const db = mongoose.connection;
db.on("error", (error) => console.error("error: ", error));
db.once("open", () => console.log("Connected to Database"));

app.use(express.json());

const signupRouter = require("./routes/signup");
const loginRouter = require("./routes/signin");
const {
  activateWebSocket,
  deactivateWebSocket,
  getCryptoDataAndUpdateDB,
} = require("./routes/getToken");

app.use("/signup", signupRouter);
app.use("/login", loginRouter);
app.get("/activate-websocket", (req, res) => {
  const message = activateWebSocket();
  res.send(message);
});
app.get("/deactivate-websocket", (req, res) => {
  const message = deactivateWebSocket();
  res.send(message);
});

app.get("/update-crypto-data", async (req, res) => {
  try {
    const cryptoData = await getCryptoDataAndUpdateDB();
    console.log("\n\n\n\n\n\n\n\n\n");
    // console.log("Crypto data updated.", cryptoData);
    res.send(cryptoData);
  } catch (error) {
    console.error("Server: Error updating crypto data:", error);
    res.status(500).send("Server: Error updating crypto data.");
  }
});

app.listen(3000, () => {
  console.log("Server started - running on port 3000");
});
