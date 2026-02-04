const poly = require("../controllers/Poly.controller");

module.exports = app => {
  var router = require("express").Router();

  // Keep these public for now (same as GET /api/trades)
  router.get("/summary", poly.summary);
  router.get("/performance/strategies", poly.performanceByStrategy);
  router.get("/performance/regime", poly.pnlByRegime);

  app.use("/api/poly", router);
};
