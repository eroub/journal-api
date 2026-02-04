const poly = require("../controllers/Poly.controller");
const polyPositions = require("../controllers/PolyPositions.controller");
const polyExperiments = require("../controllers/PolyExperiments.controller");

module.exports = app => {
  var router = require("express").Router();

  // Keep these public for now (same as GET /api/trades)
  router.get("/summary", poly.summary);
  router.get("/performance/strategies", poly.performanceByStrategy);
  router.get("/performance/regime", poly.pnlByRegime);
  router.get("/positions", polyPositions.list);
  router.get("/experiments", polyExperiments.list);

  app.use("/api/poly", router);
};
