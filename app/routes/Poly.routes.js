const poly = require("../controllers/Poly.controller");
const polyPositions = require("../controllers/PolyPositions.controller");
const polyExperiments = require("../controllers/PolyExperiments.controller");
const polyLogs = require("../controllers/PolyLogs.controller");

module.exports = app => {
  var router = require("express").Router();

  // Keep these public for now (same as GET /api/trades)
  router.get("/summary", poly.summary);
  router.get("/performance/strategies", poly.performanceByStrategy);
  router.get("/performance/regime", poly.pnlByRegime);
  router.get("/positions", polyPositions.list);
  router.get("/experiments", polyExperiments.list);
  router.get("/logs/tail", polyLogs.tail);

  app.use("/api/poly", router);
};
