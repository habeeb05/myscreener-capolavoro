// const { Connection, PublicKey } = require("@solana/web3.js");
// require("dotenv").config();

// const RAYDIUM_PUBLIC_KEY = process.env.RAYDIUM_AMM_KEY;
// const SESSION_HASH = "JWT" + Math.ceil(Math.random() * 1e9);
// const QN_HTTPS = process.env.QN_HTTPS;
// const QN_WSS = process.env.QN_WSS;

// const raydium = new PublicKey(RAYDIUM_PUBLIC_KEY);
// const connection = new Connection(QN_HTTPS, {
//   wsEndpoint: QN_WSS,
//   httpHeaders: { "x-session-hash": SESSION_HASH },
// });

// // Monitor logs
// async function main(connection, programAddress) {
//   console.log("Monitoring logs for program:", programAddress.toString());
//   connection.onLogs(
//     programAddress,
//     ({ logs, err, signature }) => {
//       if (err) return;

//       if (logs && logs.some((log) => log.includes("initialize2"))) {
//         console.log("Signature for 'initialize2':", signature);
//         fetchRaydiumAccounts(signature, connection);
//       }
//     },
//     "finalized"
//   );
// }

// // Parse transaction and filter tx
// async function fetchRaydiumAccounts(txId, connection) {
//   const tx = await connection.getParsedTransaction(txId, {
//     maxSupportedTransactionVersion: 0,
//     commitment: "confirmed",
//   });

//   // from tx I need the name of the token,supply, liquidity, token address, pair address, token ticker and the pair ticker

//   const accounts = tx?.transaction.message.instructions.find(
//     (ix) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY
//   ).accounts;

//   if (!accounts) {
//     console.log("No accounts found in the transaction.");
//     return;
//   }
//   // else {
//   //   console.log("tx: " + JSON.stringify(tx));
//   // }

//   // SECURITY
//   let mintRevoke = false;

//   //most probably wrapped sol
//   const tokenAIndex = 8;

//   // token address
//   const tokenBIndex = 9;

//   // pair address
//   const tokenCIndex = 4;

//   const tokenAAccount = accounts[tokenAIndex];
//   const tokenBAccount = accounts[tokenBIndex];
//   const tokenPair = accounts[tokenCIndex];

//   const displayData = [];

//   displayData.push({
//     tokenA: tokenAAccount.toBase58(),
//     tokenB: tokenBAccount.toBase58(),
//     pair: tokenPair.toBase58(),
//   });

//   console.log("New LP Found");
//   console.log(generateExplorerUrl(txId));
//   console.table(displayData);
// }

// function generateExplorerUrl(txId) {
//   return `https://solscan.io/tx/${txId}`;
// }

// main(connection, raydium).catch(console.error);

const { Connection, PublicKey } = require("@solana/web3.js");
require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

const RAYDIUM_PUBLIC_KEY = process.env.RAYDIUM_AMM_KEY;
const SESSION_HASH = "JWT" + Math.ceil(Math.random() * 1e9);
const QN_HTTPS = process.env.QN_HTTPS;
const QN_WSS = process.env.QN_WSS;

const { LiquidityPool } = require("../modules/liquidityPool");
const Crypto = require("../modules/crypto");

const cryptos = [];
let raydium = null;
let connection = null;

mongoose.connect(process.env.DB);
const db = mongoose.connection;
db.on("error", (error) => console.error("error: ", error));
db.once("open", () => console.log("Connected to MongoDB"));

function activateWebSocket() {
  if (!connection) {
    raydium = new PublicKey(RAYDIUM_PUBLIC_KEY);
    connection = new Connection(QN_HTTPS, {
      wsEndpoint: QN_WSS,
      httpHeaders: { "x-session-hash": SESSION_HASH },
    });
    main(connection, raydium).catch(console.error);
  }
  return `WebSocket activated with RAYDIUM_PUBLIC_KEY: ${RAYDIUM_PUBLIC_KEY}`;
}

function deactivateWebSocket() {
  if (connection) {
    connection = null;
  }
  return "WebSocket deactivated";
}

async function main(connection, programAddress) {
  console.log("Monitoring logs for program:", programAddress.toString());
  connection.onLogs(
    programAddress,
    async ({ logs, err, signature }) => {
      if (err) return;

      if (logs && logs.some((log) => log.includes("initialize2"))) {
        console.log("Signature for 'initialize2':", signature);
        await fetchRaydiumAccounts(signature, connection);
      }
    },
    "finalized"
  );
}

async function saveLiquidityPoolToDatabase(data) {
  try {
    const newLiquidityPool = new LiquidityPool(data);
    await newLiquidityPool.save();
    console.log("Liquidity pool saved to database:", data);
    await getCryptoDataAndUpdateDB();
  } catch (error) {
    console.error("Error saving liquidity pool to database:", error);
  }
}

async function fetchRaydiumAccounts(txId, connection) {
  try {
    const tx = await connection.getParsedTransaction(txId, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    // Aggiungi un controllo nullish per verificare se tx è definito
    if (!tx) {
      console.log("No transaction data found for transaction ID:", txId);
      return;
    }

    const accounts = tx?.transaction.message.instructions.find(
      (ix) => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY
    )?.accounts;

    // console.log("\n tasdx:\n", JSON.stringify(accounts));

    // Aggiungi un controllo nullish per verificare se accounts è definito
    if (!accounts) {
      console.log("No accounts found in the transaction.");
      return;
    }

    // console.log("tx jasbdasd: " + JSON.stringify(tx));

    const tokenAIndex = 8;
    const tokenBIndex = 9;
    const tokenCIndex = 4;

    // const tokenAAccount = accounts.accounts[tokenAIndex];
    // const tokenBAccount = accounts.accounts[tokenBIndex];
    // const tokenPair = accounts.accounts[tokenCIndex];
    const tokenAAccount = accounts[tokenAIndex];
    const tokenBAccount = accounts[tokenBIndex];
    const tokenPair = accounts[tokenCIndex];

    const liquidityPoolData = {
      tokenA: tokenAAccount.toBase58(),
      tokenB: tokenBAccount.toBase58(),
      pairAddress: tokenPair.toBase58(),
    };

    await saveLiquidityPoolToDatabase(liquidityPoolData);
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      console.error("Duplicate key error:", error.message);
      deactivateWebSocket();
    } else {
      console.error("Error fetching or saving liquidity pool:", error);
    }
  }
}

async function getCryptoDataAndUpdateDB() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("Error: MongoDB connection not established.");
      return;
    }
    const liquidityPools = await LiquidityPool.find();

    if (liquidityPools && liquidityPools.length > 0) {
      for (const pool of liquidityPools) {
        const { tokenA } = pool;

        try {
          const response = await axios.get(
            `https://api.dexscreener.com/latest/dex/tokens/${tokenA}`
          );

          // console.log("Response data:", response?.data);
          // console.log("Response data:", response?.data?.pairs[0]);
          // mappato[k]=true;

          // console.log("Response data:", response.data);
          const cryptoData = response?.data?.pairs[0];

          const baseToken = cryptoData.baseToken.address;
          let existingCrypto = await Crypto.findOne({
            "baseToken.address": baseToken,
          });

          if (existingCrypto) {
            existingCrypto.set({
              chainId: cryptoData.chainId,
              dexId: cryptoData.dexId,
              // url: cryptoData.url,
              pairAddress: cryptoData.pairAddress,
              baseToken: cryptoData.baseToken,
              quoteToken: cryptoData.quoteToken,
              priceNative: cryptoData.priceNative,
              priceUsd: cryptoData.priceUsd,
              txns: cryptoData.txns,
              volume: cryptoData.volume,
              priceChange: cryptoData.priceChange,
              liquidity: cryptoData.liquidity,
              fdv: cryptoData.fdv,
              pairCreatedAt: cryptoData.pairCreatedAt,
            });

            existingCrypto = await existingCrypto.save();
            cryptos.push(existingCrypto);
            console.log(
              "Existing crypto updated in the database:",
              existingCrypto.baseToken.address
            );
          } else {
            try {
              const newCrypto = new Crypto({
                chainId: cryptoData.chainId,
                dexId: cryptoData.dexId,
                // url: cryptoData.url,
                pairAddress: cryptoData.pairAddress,
                baseToken: cryptoData.baseToken,
                quoteToken: cryptoData.quoteToken,
                priceNative: cryptoData.priceNative,
                priceUsd: cryptoData.priceUsd,
                txns: cryptoData.txns,
                volume: cryptoData.volume,
                priceChange: cryptoData.priceChange,
                liquidity: cryptoData.liquidity,
                fdv: cryptoData.fdv,
                pairCreatedAt: cryptoData.pairCreatedAt,
              });

              await newCrypto.save();
              cryptos.push(newCrypto);
              console.log(
                "New crypto saved to database:",
                newCrypto.baseToken.address
              );
            } catch (error) {
              console.error("getToken: Error creating new crypto:", error);
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
      console.log("All crypto data updated in the database.");
      return cryptos;
    }
  } catch (error) {
    console.error("getToken: Error updating crypto data:", error);
  }
}

module.exports = {
  activateWebSocket,
  deactivateWebSocket,
  getCryptoDataAndUpdateDB,
};
