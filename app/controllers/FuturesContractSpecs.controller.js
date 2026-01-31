const db = require("../models");
const FuturesContractSpecs = db.FuturesContractSpecs;

exports.getAll = async (req, res) => {
  try {
    const specs = await FuturesContractSpecs.findAll();
    res.json(specs);
  } catch (error) {
    console.error("Error fetching futures contract specs:", error);
    res.status(500).send("Error fetching futures contract specs");
  }
};
