// solana liquidity pool schema
const mongoose = require("mongoose");
const Joi = require("joi");

const liquidityPoolSchema = new mongoose.Schema({
  tokenA: {
    type: String,
    required: true,
    unique: true,
  },
  tokenB: {
    type: String,
    required: true,
  },
  pairAddress: {
    type: String,
    required: true,
    unique: true,
  },
});

const LiquidityPool = mongoose.model("LiquidityPool", liquidityPoolSchema);

const validate = (data) => {
  const schema = Joi.object({
    tokenA: Joi.string().min(32).max(44).required().label("Token A"),
    tokenB: Joi.string().min(32).max(44).required().label("Token B"),
    pairAddress: Joi.string().min(32).max(44).required().label("Pair Address"),
  });
  return schema.validate(data);
};

module.exports = { LiquidityPool, validate };
