const mongoose = require("mongoose");

const CryptoSchema = new mongoose.Schema({
  chainId: {
    type: String,
    required: true,
  },
  dexId: {
    type: String,
    required: true,
  },
  // url: {
  //   type: String,
  //   required: true,
  // },
  pairAddress: {
    type: String,
    required: true,
    unique: true,
  },
  baseToken: {
    address: {
      type: String,
    },
    name: {
      type: String,
    },
    symbol: {
      type: String,
    },
  },
  quoteToken: {
    address: {
      type: String,
    },
    name: {
      type: String,
    },
    symbol: {
      type: String,
    },
  },
  priceNative: {
    type: String,
    required: true,
  },
  priceUsd: {
    type: String,
    required: true,
  },
  txns: {
    m5: {
      buys: {
        type: Number,
      },
      sells: {
        type: Number,
      },
    },
    h1: {
      buys: {
        type: Number,
      },
      sells: {
        type: Number,
      },
    },
    h6: {
      buys: {
        type: Number,
      },
      sells: {
        type: Number,
      },
    },
    h24: {
      buys: {
        type: Number,
      },
      sells: {
        type: Number,
      },
    },
  },
  volume: {
    h24: {
      type: Number,
    },
    h6: {
      type: Number,
    },
    h1: {
      type: Number,
    },
    m5: {
      type: Number,
    },
  },
  priceChange: {
    m5: {
      type: Number,
    },
    h1: {
      type: Number,
    },
    h6: {
      type: Number,
    },
    h24: {
      type: Number,
    },
  },
  liquidity: {
    usd: {
      type: Number,
    },
    base: {
      type: Number,
    },
    quote: {
      type: Number,
    },
  },
  fdv: {
    type: Number,
  },
  pairCreatedAt: {
    type: Date,
    required: true,
  },
});

const Crypto = mongoose.model("Crypto", CryptoSchema);

module.exports = Crypto;
