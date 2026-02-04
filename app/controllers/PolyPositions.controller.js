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
      `SELECT mode, market_name, token_name, window_ts, first_ts, last_ts,
              asset,
              buy_usdc, buy_tokens, avg_entry_price, redeem_usdc,
              realized_pnl_usd, result, fills
         FROM poly_positions
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
