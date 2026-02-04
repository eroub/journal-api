// Poly.controller.js
const db = require("../models/index");

// Public: lightweight summary for dashboards
exports.summary = async (req, res) => {
  try {
    const mode = req.query.mode; // optional: paper|live
    const modeWhere = mode ? "WHERE pt.mode = ?" : "";
    const replacements = mode ? [mode] : [];

    const [strategies] = await db.sequelize.query(
      `SELECT COUNT(*) AS n_strategies FROM poly_strategies;`
    );
    const [runs] = await db.sequelize.query(
      `SELECT COUNT(*) AS n_runs FROM poly_runs;`
    );
    const [trades] = await db.sequelize.query(
      `SELECT COUNT(*) AS n_trades FROM poly_trades ${mode ? "WHERE mode = ?" : ""};`,
      { replacements }
    );

    // For live trades, result/pnl_usd won't be known until settlement.
    // We still expose implied_pnl_usd (max payout - cost) for context.
    const [recentTrades] = await db.sequelize.query(
      `SELECT pt.mode, pt.ts_open, pt.window_ts, pt.asset, pt.direction,
              ps.name AS strategy, pt.entry_price, pt.exit_price, pt.result,
              pt.pnl_usd, pt.implied_pnl_usd,
              pt.settled_pnl_usd, pt.settled_result
         FROM poly_trades pt
         JOIN poly_strategies ps ON ps.id = pt.strategy_id
         ${modeWhere}
        ORDER BY pt.ts_open DESC
        LIMIT 50;`,
      { replacements }
    );

    return res.status(200).json({
      counts: {
        strategies: strategies?.[0]?.n_strategies ?? 0,
        runs: runs?.[0]?.n_runs ?? 0,
        trades: trades?.[0]?.n_trades ?? 0,
      },
      recentTrades,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Public: simple performance by strategy (paper+live)
exports.performanceByStrategy = async (req, res) => {
  try {
    const mode = req.query.mode; // optional: paper|live
    const modeWhere = mode ? "WHERE pt.mode = ?" : "";
    const replacements = mode ? [mode] : [];

    const [rows] = await db.sequelize.query(
      `SELECT ps.name AS strategy,
              pt.mode,
              COUNT(*) AS n,
              SUM(CASE WHEN pt.result = 'win' THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN pt.result = 'loss' THEN 1 ELSE 0 END) AS losses,
              ROUND(AVG(pt.entry_price), 4) AS avg_entry,
              ROUND(SUM(COALESCE(pt.pnl_usd, 0)), 4) AS pnl_usd,
              ROUND(SUM(COALESCE(pt.implied_pnl_usd, 0)), 4) AS implied_pnl_usd
         FROM poly_trades pt
         JOIN poly_strategies ps ON ps.id = pt.strategy_id
         ${modeWhere}
        GROUP BY ps.name, pt.mode
        ORDER BY pnl_usd DESC;`,
      { replacements }
    );

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Public: PnL by regime label (from poly_runs.regime_json)
exports.pnlByRegime = async (req, res) => {
  try {
    const mode = req.query.mode; // optional: paper|live
    // Important: this query already has a FROM + LEFT JOIN. Use AND, not WHERE.
    const modeWhere = mode ? "AND pt.mode = ?" : "";
    const replacements = mode ? [mode] : [];

    // We join trades to the last paper_zoo run for that window_ts and use BTC label as a proxy.
    const [rows] = await db.sequelize.query(
      `SELECT
          JSON_UNQUOTE(JSON_EXTRACT(pr.regime_json, '$.BTC.label')) AS btc_regime,
          pt.mode,
          COUNT(*) AS n,
          SUM(CASE WHEN pt.result = 'win' THEN 1 ELSE 0 END) AS wins,
          ROUND(SUM(COALESCE(pt.pnl_usd, 0)), 4) AS pnl_usd
       FROM poly_trades pt
       LEFT JOIN (
         SELECT window_ts, MAX(id) AS max_id
           FROM poly_runs
          WHERE source='paper_zoo'
          GROUP BY window_ts
       ) last_run ON last_run.window_ts = pt.window_ts
       LEFT JOIN poly_runs pr ON pr.id = last_run.max_id
       WHERE 1=1
       ${modeWhere}
       GROUP BY btc_regime, pt.mode
       ORDER BY pnl_usd DESC;`,
      { replacements }
    );

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
