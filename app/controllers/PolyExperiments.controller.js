// PolyExperiments.controller.js
const db = require("../models/index");

// Paper-only experiments = (strategy + parameter snapshot) derived from poly_decisions fields_json.
// We group by (strategy_id, params_hash) where params_hash is a stable JSON string of selected keys.
// For now, we also join paper trades by strategy_id (no params attribution yet).

const PARAM_KEYS = [
  "MIN_MOMENTUM_PCT",
  "MAX_ENTRY_PRICE",
  "ENTRY_START",
  "ENTRY_END",
  "MIN_DEPTH_MULT",
  "PAPER_TRADE_MIN_EDGE",
];

function paramsHash(fields) {
  const obj = {};
  for (const k of PARAM_KEYS) {
    if (fields && Object.prototype.hasOwnProperty.call(fields, k)) obj[k] = fields[k];
  }
  return JSON.stringify(obj);
}

exports.list = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 200), 500);

    // Pull recent decision rows to infer current param snapshots per strategy.
    // (Full historical grouping can be added later; this gives a usable Experiments page now.)
    const source = req.query.source ? String(req.query.source) : null;

    const [decisions] = await db.sequelize.query(
      `SELECT pd.strategy_id,
              ps.name AS strategy,
              pr.ts as run_ts,
              pr.source as source,
              pd.fields_json
         FROM poly_decisions pd
         JOIN poly_strategies ps ON ps.id=pd.strategy_id
         JOIN poly_runs pr ON pr.id=pd.run_id
        WHERE (:source IS NULL OR pr.source = :source)
        ORDER BY pr.ts DESC
        LIMIT 5000;`,
      { replacements: { source } }
    );

    // Build latest paramsHash per strategy (most recent seen)
    const latest = new Map();
    for (const d of decisions) {
      if (latest.has(d.strategy_id)) continue;
      const h = paramsHash(d.fields_json);
      latest.set(d.strategy_id, { strategy_id: d.strategy_id, strategy: d.strategy, run_ts: d.run_ts, params: JSON.parse(h) });
    }

    const strategyIds = [...latest.keys()];
    if (!strategyIds.length) return res.status(200).json({ rows: [] });

    const [perf] = await db.sequelize.query(
      `SELECT pt.strategy_id,
              COUNT(*) AS trades,
              SUM(CASE WHEN pt.result='win' THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN pt.result='loss' THEN 1 ELSE 0 END) AS losses,
              ROUND(SUM(COALESCE(pt.pnl_usd,0)), 4) AS pnl_usd,
              ROUND(AVG(pt.entry_price), 4) AS avg_entry
         FROM poly_trades pt
        WHERE pt.mode='paper' AND pt.strategy_id IN (:ids)
        GROUP BY pt.strategy_id;`,
      { replacements: { ids: strategyIds } }
    );

    const perfById = new Map(perf.map((p) => [p.strategy_id, p]));

    const rows = strategyIds
      .map((id) => {
        const base = latest.get(id);
        const p = perfById.get(id) || {};
        const wins = Number(p.wins || 0);
        const losses = Number(p.losses || 0);
        const n = Number(p.trades || 0);
        return {
          mode: "paper",
          source: base.source || "paper_zoo",
          experiment: `${base.strategy} ${JSON.stringify(base.params)}`,
          strategy_id: id,
          strategy: base.strategy,
          params: base.params,
          last_seen_ts: base.run_ts,
          trades: n,
          wins,
          losses,
          winrate: n ? wins / n : null,
          pnl_usd: Number(p.pnl_usd || 0),
          avg_entry: p.avg_entry ?? null,
        };
      })
      .sort((a, b) => (b.last_seen_ts || 0) - (a.last_seen_ts || 0))
      .slice(0, limit);

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
