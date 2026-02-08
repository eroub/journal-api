// PolyCopytradeCompare.controller.js
// Joined "Leader -> Did we copy? -> Our fill/skip reason" view.
//
// Accuracy notes:
// - data-api /activity timestamps are not reliable for latency.
// - Use leader onchain fill ledger (copytrade_leader_fills.jsonl) for leader_ts.
// - Use mirror attempt log ts for detection latency (leader_seen -> attempt_ts).
// - Use our matched fill ts for execution latency (leader_ts -> our_fill_ts).

const fs = require('fs');

const LEADER = '/root/corpus/giovanni/poly/logs/copytrade_leader_fills.jsonl';
const MATCHED = '/root/corpus/giovanni/poly/logs/copytrade_matched_fills.jsonl';
const ORDERS = '/root/corpus/giovanni/poly/logs/copytrade_live_orders.jsonl';

function safeJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readJsonlTail(path, maxBytes) {
  if (!fs.existsSync(path)) return [];
  const stat = fs.statSync(path);
  const chunk = Math.min(maxBytes, stat.size);
  const start = Math.max(0, stat.size - chunk);
  const fd = fs.openSync(path, 'r');
  const buf = Buffer.alloc(chunk);
  fs.readSync(fd, buf, 0, chunk, start);
  fs.closeSync(fd);

  const text = buf.toString('utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (start > 0 && lines.length) lines.shift();

  const out = [];
  for (const ln of lines) {
    const o = safeJson(ln);
    if (o) out.push(o);
  }
  return out;
}

function parseTsMs(x) {
  if (!x) return null;
  if (typeof x === 'number') return x;
  const t = Date.parse(x);
  return Number.isFinite(t) ? t : null;
}

function buildIndexes({ cutoffMs }) {
  const leader = readJsonlTail(LEADER, 12 * 1024 * 1024);
  const matched = readJsonlTail(MATCHED, 8 * 1024 * 1024);
  const orders = readJsonlTail(ORDERS, 8 * 1024 * 1024);

  const leaderIdx = [];
  for (const o of leader) {
    const t = parseTsMs(o.ingested_at || o.ts);
    if (!t || (cutoffMs != null && t < cutoffMs)) continue;
    const fill = o.fill || {};
    leaderIdx.push({
      t,
      tx: o.tx,
      block: o.block,
      side: fill.side,
      token_id: String(fill.token_id ?? ''),
      price: fill.price,
      usdc: fill.usdc,
      tokens: fill.tokens,
    });
  }

  const matchedIdx = [];
  for (const m of matched) {
    if (m.kind !== 'copytrade_matched_fill') continue;
    const t = parseTsMs(m.ts);
    if (!t || (cutoffMs != null && t < cutoffMs)) continue;
    matchedIdx.push({
      t,
      instrument_key: m.instrument_key,
      side: m.side,
      token_id: String(m.token_id ?? ''),
      price: m.price,
      usd: m.usd,
      tx: m.tx,
      order_id: m.order_id,
      dedupe_key: m.dedupe_key,
    });
  }

  const attemptIdx = [];
  const skipIdx = [];
  // Rich attempt detail by leader tx (latest attempt)
  const attemptDetailByLeaderTx = new Map();

  for (const d of orders) {
    const t = parseTsMs(d.ts);
    if (!t || (cutoffMs != null && t < cutoffMs)) continue;
    if (!String(d.kind || '').startsWith('copytrade_')) continue;

    if (d.kind === 'copytrade_mirror_attempt') {
      attemptIdx.push({
        t,
        dedupe_key: d.dedupe_key,
        leader_tx: d.leader && d.leader.tx,
        token_id: d.leader ? String(d.leader.token_id ?? '') : null,
        side: d.leader ? d.leader.side : null,
        status_code: d.status_code,
      });

      // Keep the latest rich attempt record per leader tx for UI drilldown.
      try {
        const ltx = d.leader && d.leader.tx ? String(d.leader.tx).toLowerCase() : null;
        if (ltx) {
          const prev = attemptDetailByLeaderTx.get(ltx);
          const prevT = prev && prev.ts ? parseTsMs(prev.ts) : null;
          if (!prev || (prevT != null && t > prevT) || prevT == null) {
            attemptDetailByLeaderTx.set(ltx, {
              ts: d.ts,
              outcome: d.outcome || null,
              status_code: d.status_code,
              resp: d.resp || null,
              err: d.err || null,
              mirror: d.mirror || null,
              dedupe_key: d.dedupe_key || null,
            });
          }
        }
      } catch {}
    }

    if (String(d.kind).includes('skip')) {
      const window = d.details && (d.details.window_key || d.details.instrument_key || d.details.windowKey);
      skipIdx.push({
        t,
        kind: d.kind,
        reason: d.reason || null,
        window_key: window || null,
        dedupe_key: d.dedupe_key || null,
        leader_tx: d.leader && d.leader.tx,
        token_id: d.leader ? String(d.leader.token_id ?? '') : null,
        side: d.leader ? d.leader.side : null,
      });
    }
  }

  // Fast map: leader tx -> leader fill (ingested)
  const leaderByTx = new Map();
  for (const l of leaderIdx) {
    if (l.tx) leaderByTx.set(String(l.tx).toLowerCase(), l);
  }

  // For fallbacks: token_id+side nearest time
  function findLeaderByTokenSide(tokenId, side, tMs, windowMs) {
    let best = null;
    let bestDt = windowMs + 1;
    for (const l of leaderIdx) {
      if (tokenId && l.token_id !== tokenId) continue;
      if (side && l.side !== side) continue;
      const dt = Math.abs(l.t - tMs);
      if (dt <= windowMs && dt < bestDt) {
        bestDt = dt;
        best = l;
      }
    }
    return best;
  }

  return { leaderIdx, leaderByTx, matchedIdx, attemptIdx, skipIdx, attemptDetailByLeaderTx, findLeaderByTokenSide };
}

function makeSummary({ minutes }) {
  return {
    minutes,
    total: 0,
    copied: 0,
    skipped: 0,
    unknown: 0,
    reasons: {},
    dpx: { n: 0, sum: 0, abs_sum: 0 },
    lag_det: { n: 0, sum: 0, abs_sum: 0 },
    lag_fill: { n: 0, sum: 0, abs_sum: 0 },
  };
}

function finalizeSummary(summary) {
  function avg(x) {
    return x.n ? x.sum / x.n : null;
  }
  function absAvg(x) {
    return x.n ? x.abs_sum / x.n : null;
  }
  return {
    total: summary.total,
    copied: summary.copied,
    skipped: summary.skipped,
    unknown: summary.unknown,
    copy_rate: summary.total ? summary.copied / summary.total : null,
    reasons: summary.reasons,
    dpx_avg: avg(summary.dpx),
    dpx_abs_avg: absAvg(summary.dpx),
    detect_lag_ms_avg: avg(summary.lag_det),
    fill_lag_ms_avg: avg(summary.lag_fill),
  };
}

exports.copied = async (req, res) => {
  try {
    const limit = Math.max(10, Math.min(500, Number(req.query.limit || 50)));

    const { leaderByTx, matchedIdx, attemptIdx, findLeaderByTokenSide } = buildIndexes({ cutoffMs: null });

    matchedIdx.sort((a, b) => b.t - a.t);
    const picks = matchedIdx.slice(0, limit);

    // Build attempt map by dedupe_key (nearest in time to fill)
    const attemptsByKey = new Map();
    for (const a of attemptIdx) {
      if (!a.dedupe_key) continue;
      const k = a.dedupe_key;
      const arr = attemptsByKey.get(k) || [];
      arr.push(a);
      attemptsByKey.set(k, arr);
    }

    function nearestAttempt(dedupeKey, tMs) {
      const arr = attemptsByKey.get(dedupeKey) || [];
      let best = null;
      let bestDt = 10 * 60 * 1000;
      for (const a of arr) {
        const dt = Math.abs(a.t - tMs);
        if (dt < bestDt) {
          bestDt = dt;
          best = a;
        }
      }
      return best;
    }

    const summary = makeSummary({ minutes: null });
    const rows = picks.map((m) => {
      const slug = (m.instrument_key || '').split(':').slice(-1)[0] || null;
      const market_url = slug ? `https://polymarket.com/market/${slug}` : null;

      const att = m.dedupe_key ? nearestAttempt(m.dedupe_key, m.t) : null;
      const leaderFill = att && att.leader_tx ? leaderByTx.get(String(att.leader_tx).toLowerCase()) : null;

      // Fallback if no leader tx mapping: use token_id+side near attempt time
      const leaderFallback = !leaderFill && att ? findLeaderByTokenSide(att.token_id, att.side, att.t, 5 * 60 * 1000) : null;
      const leader = leaderFill || leaderFallback;

      const leaderObj = leader
        ? {
            ts_ms: leader.t,
            side: leader.side,
            price: leader.price,
            usd: leader.usdc,
            tx: leader.tx,
          }
        : null;

      const ourObj = { ts_ms: m.t, price: m.price, usd: m.usd, tx: m.tx, order_id: m.order_id };

      let dpx = null;
      if (leader && leader.price != null && m.price != null) {
        dpx = Number(m.price) - Number(leader.price);
        summary.dpx.n += 1;
        summary.dpx.sum += dpx;
        summary.dpx.abs_sum += Math.abs(dpx);
      }

      // Detection lag: attempt time - leader fill time (debugging)
      let detect_lag_ms = null;
      if (leader && att) {
        detect_lag_ms = att.t - leader.t;
        summary.lag_det.n += 1;
        summary.lag_det.sum += detect_lag_ms;
        summary.lag_det.abs_sum += Math.abs(detect_lag_ms);
      }

      // Fill lag: our fill time - leader fill time (what user wants as the primary lag)
      let fill_lag_ms = null;
      if (leader) {
        fill_lag_ms = m.t - leader.t;
        summary.lag_fill.n += 1;
        summary.lag_fill.sum += fill_lag_ms;
        summary.lag_fill.abs_sum += Math.abs(fill_lag_ms);
      }

      summary.total += 1;
      summary.copied += 1;

      return {
        ts: new Date(m.t).toISOString(),
        slug,
        title: slug,
        market_url,
        leader: leaderObj,
        status: 'COPIED',
        reason: null,
        our: ourObj,
        dpx,
        detect_lag_ms,
        submit_lag_ms: null,
        fill_lag_ms,
      };
    });

    return res.status(200).json({ mode: 'copied', limit, summary: finalizeSummary(summary), rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.compare = async (req, res) => {
  try {
    const minutes = Math.max(1, Math.min(24 * 60, Number(req.query.minutes || 60)));
    const limit = Math.max(10, Math.min(1000, Number(req.query.limit || 300)));
    const cutoffMs = Date.now() - minutes * 60 * 1000;

    const { leaderIdx, matchedIdx, attemptIdx, skipIdx, attemptDetailByLeaderTx, leaderByTx, findLeaderByTokenSide } = buildIndexes({ cutoffMs: cutoffMs - 10 * 60 * 1000 });

    // token_id -> meta (slug/title/outcome)
    let tokenMeta = {};
    try {
      const p = '/root/corpus/giovanni/poly/logs/copytrade_token_map.json';
      if (fs.existsSync(p)) {
        const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
        tokenMeta = (payload && payload.map) ? payload.map : {};
      }
    } catch {
      tokenMeta = {};
    }

    // Index matched fills by dedupe_key
    const matchedByKey = new Map();
    for (const m of matchedIdx) {
      if (!m.dedupe_key) continue;
      const arr = matchedByKey.get(m.dedupe_key) || [];
      arr.push(m);
      matchedByKey.set(m.dedupe_key, arr);
    }

    // Index attempts by leader_tx (first attempt)
    const firstAttemptByLeaderTx = new Map();
    for (const a of attemptIdx) {
      const ltx = a.leader_tx ? String(a.leader_tx).toLowerCase() : null;
      if (!ltx) continue;
      const prev = firstAttemptByLeaderTx.get(ltx);
      if (!prev || a.t < prev.t) firstAttemptByLeaderTx.set(ltx, a);
    }

    // Index skips by leader_tx (latest)
    const latestSkipByLeaderTx = new Map();
    for (const s of skipIdx) {
      const ltx = s.leader_tx ? String(s.leader_tx).toLowerCase() : null;
      if (!ltx) continue;
      const prev = latestSkipByLeaderTx.get(ltx);
      if (!prev || s.t > prev.t) latestSkipByLeaderTx.set(ltx, s);
    }

    // Build rows from leader fills (authoritative universe)
    leaderIdx.sort((a, b) => b.t - a.t);
    const leaders = leaderIdx.filter((l) => l.t >= cutoffMs).slice(0, limit);

    const summary = makeSummary({ minutes });

    const rows = leaders.map((l) => {
      const tokenIdStr = l.token_id != null ? String(l.token_id) : '';
      const meta = tokenIdStr ? tokenMeta[tokenIdStr] : null;
      const slug = meta && meta.slug ? meta.slug : tokenIdStr ? `token:${tokenIdStr}` : null;

      // If we have no meta, call it out explicitly (helps debug token_map coverage).
      const missingMeta = !!(tokenIdStr && !meta);


      // Find first attempt by tx
      const att = l.tx ? firstAttemptByLeaderTx.get(String(l.tx).toLowerCase()) : null;
      // Find matched fill: prefer dedupe_key from attempt
      let our = null;
      let status = 'SKIPPED';
      let reason = null;

      if (att && att.dedupe_key && matchedByKey.has(att.dedupe_key)) {
        const fills = matchedByKey.get(att.dedupe_key) || [];
        fills.sort((a, b) => a.t - b.t);
        const f = fills[0];
        our = { ts_ms: f.t, price: f.price, usd: f.usd, tx: f.tx, order_id: f.order_id };
        status = 'COPIED';
      } else if (att) {
        status = 'UNKNOWN';
        // Make attempt failures human-readable when possible.
        if (att.status_code != null) {
          if (att.status_code === 400) reason = 'clob_400';
          else if (att.status_code === 403) reason = 'cloudflare_403_IMPOSSIBLE_CHECK_PROXY';
          else if (att.status_code === 407) reason = 'proxy_auth_407';
          else if (att.status_code === 429) reason = 'rate_limit_429';
          else if (att.status_code >= 500) reason = `server_${att.status_code}`;
          else reason = `attempt_${att.status_code}`;
        } else {
          reason = 'attempt';
        }
      } else {
        // No attempt logged. Try to attribute via skip logs.
        let sk = null;
        if (l.tx && latestSkipByLeaderTx.has(String(l.tx).toLowerCase())) {
          sk = latestSkipByLeaderTx.get(String(l.tx).toLowerCase());
        }
        if (!sk) {
          // fallback: token_id+side nearest skip in time
          const tokenId = String(l.token_id || '');
          const side = l.side;
          let best = null;
          let bestDt = 5 * 60 * 1000;
          for (const s of skipIdx) {
            if (tokenId && s.token_id && String(s.token_id) !== tokenId) continue;
            if (side && s.side && String(s.side) !== String(side)) continue;
            const dt = Math.abs(s.t - l.t);
            if (dt <= bestDt) {
              bestDt = dt;
              best = s;
            }
          }
          sk = best;
        }

        status = 'SKIPPED';
        reason = sk ? (sk.reason || sk.kind) : 'no_attempt_logged';
        // If meta is missing, surface it. (Only if it is truly missing.)
        if (missingMeta) reason = 'missing_token_map';
        else if (reason === 'missing_token_map') reason = 'no_attempt_logged';
      }

      // leader object
      const leaderObj = {
        ts_ms: l.t,
        side: l.side,
        price: l.price,
        usd: l.usdc,
        tx: l.tx,
        token_id: l.token_id,
      };

      // lags
      const detect_lag_ms = att ? att.t - l.t : null;
      const submit_lag_ms = att ? att.t - (att.leader_ingested_at_ms || l.t) : null;
      const fill_lag_ms = our ? our.ts_ms - l.t : null;

      // dpx
      let dpx = null;
      if (our && our.price != null && l.price != null) {
        dpx = Number(our.price) - Number(l.price);
      }

      // summary counters
      summary.total += 1;
      if (status === 'COPIED') summary.copied += 1;
      else if (status === 'SKIPPED') {
        summary.skipped += 1;
        const k = reason || 'skip';
        summary.reasons[k] = (summary.reasons[k] || 0) + 1;
      } else summary.unknown += 1;

      if (dpx != null) {
        summary.dpx.n += 1;
        summary.dpx.sum += dpx;
        summary.dpx.abs_sum += Math.abs(dpx);
      }
      if (detect_lag_ms != null) {
        summary.lag_det.n += 1;
        summary.lag_det.sum += detect_lag_ms;
        summary.lag_det.abs_sum += Math.abs(detect_lag_ms);
      }
      if (fill_lag_ms != null) {
        summary.lag_fill.n += 1;
        summary.lag_fill.sum += fill_lag_ms;
        summary.lag_fill.abs_sum += Math.abs(fill_lag_ms);
      }

      const market_url = meta && meta.slug ? `https://polymarket.com/market/${meta.slug}` : null;
      const title = meta && meta.title ? meta.title : slug;
      const outcome = meta && meta.outcome ? meta.outcome : null;

      const ltxLower = l.tx ? String(l.tx).toLowerCase() : null;
      const richAttempt = ltxLower ? attemptDetailByLeaderTx.get(ltxLower) : null;

      const attDetail = att
        ? {
            ts_ms: att.t,
            dedupe_key: att.dedupe_key || null,
            status_code: att.status_code,
            leader_ingested_at_ms: att.leader_ingested_at_ms || null,
          }
        : null;

      // Human-readable drilldown for reasons like clob_400.
      let reason_detail = null;
      if (richAttempt && richAttempt.resp) {
        try {
          if (typeof richAttempt.resp === 'string') reason_detail = richAttempt.resp;
          else reason_detail = JSON.stringify(richAttempt.resp);
        } catch {
          reason_detail = String(richAttempt.resp);
        }
      }

      // Prefer concrete CLOB outcome over generic status mapping.
      // Example: outcome=no_liquidity_fak is MUCH more informative than clob_400.
      const reason_best = (richAttempt && richAttempt.outcome) ? String(richAttempt.outcome) : reason;

      return {
        ts: new Date(l.t).toISOString(),
        slug,
        title: outcome ? `${title} (${outcome})` : title,
        market_url,
        leader: leaderObj,
        attempt: attDetail,
        attempt_rich: richAttempt || null,
        status,
        reason: reason_best,
        reason_detail,
        our,
        dpx,
        detect_lag_ms,
        submit_lag_ms,
        fill_lag_ms,
      };
    });

    return res.status(200).json({ mode: 'leader', minutes, limit, summary: finalizeSummary(summary), rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
