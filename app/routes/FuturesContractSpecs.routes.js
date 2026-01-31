module.exports = app => {
  const router = require("express").Router();
  const futuresSpecs = require("../controllers/FuturesContractSpecs.controller");

  // Get all futures contract specs (public endpoint)
  router.get("/", futuresSpecs.getAll);

  app.use('/api/futures-contract-specs', router);
};
