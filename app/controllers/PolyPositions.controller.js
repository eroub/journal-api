// PolyPositions.controller.js
const db = require("../models/index");

// Public: positions derived from poly_positions (authoritative accounting layer)
exports.list = async (req, res) => {
  try {
    const mode = req.query.mode; // optional: paper|live
    const limit = Math.min(Number(req.query.limit ?? 200), 2000);
    const modeWhere = mode ? "WHERE mode = ?" : "";
    const replacements = mode ? [mode] : [];

    const [rows] = await db.sequelize.query(
      `SELECT p.mode, p.market_name, p.token_name, p.window_ts, p.first_ts, p.last_ts,
              p.asset,
              'unknown' AS strategy,
              p.buy_usdc, p.buy_tokens, p.avg_entry_price, p.redeem_usdc,
              p.realized_pnl_usd, p.result, p.fills
         FROM poly_positions p
         LEFT JOIN poly_strategies ps ON ps.id = p.strategy_id
         ${modeWhere}
        ORDER BY COALESCE(last_ts, first_ts, 0) DESC
        LIMIT ${limit};`,
      { replacements }
    );

    return res.status(200).json({ rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
