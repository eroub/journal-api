// PolyLogs.controller.js
const fs = require("fs");
const path = require("path");

// Read last N minutes of selected production logs.
// NOTE: Keep this allowlist tight (no arbitrary file read).
const LOG_ALLOWLIST = {
  live_executor: "/root/corpus/giovanni/poly/logs/live_executor.log",
  paper_zoo_daemon: "/root/corpus/giovanni/poly/logs/paper_zoo_daemon.out",
  ingest: "/root/corpus/giovanni/poly/logs/poly_ingest.log",
};

function toMs(x, def) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

exports.tail = async (req, res) => {
  try {
    const name = String(req.query.name || "live_executor");
    const filePath = LOG_ALLOWLIST[name];
    if (!filePath) return res.status(400).json({ error: `unknown log name: ${name}` });

    const minutes = Math.max(1, Math.min(60, toMs(req.query.minutes, 15))); // cap 60m
    const maxLines = Math.max(50, Math.min(5000, toMs(req.query.maxLines, 1200)));

    // If file is missing, return empty (don't 500).
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ name, filePath, minutes, lines: [] });
    }

    const stat = fs.statSync(filePath);
    const cutoffMs = Date.now() - minutes * 60 * 1000;

    // Read last ~512KB for speed; if extremely verbose, user can refresh.
    const chunk = Math.min(512 * 1024, stat.size);
    const start = Math.max(0, stat.size - chunk);
    const buf = Buffer.alloc(chunk);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, chunk, start);
    fs.closeSync(fd);

    const text = buf.toString("utf8");
    const rawLines = text.split(/\r?\n/).filter(Boolean);

    // Attempt to parse timestamp prefix: [YYYY-mm-dd HH:MM:SS] ...
    // If no parse, keep the line.
    const lines = [];
    for (const line of rawLines) {
      const m = line.match(/^\[(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\]/);
      if (m) {
        const ts = Date.parse(`${m[1]}T${m[2]}Z`);
        if (!Number.isNaN(ts) && ts < cutoffMs) continue;
      }
      lines.push(line);
    }

    const trimmed = lines.slice(-maxLines);
    return res.status(200).json({ name, filePath, minutes, lines: trimmed });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
