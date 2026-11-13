/**
 * コーラ飛ばし ランキングAPI（Google Apps Script）
 *
 * 使い方は README.md の「ランキングの設定」を参照。
 *   GET ?action=top&limit=50
 *   GET ?action=submit&name=xxx&score=12.3&angle=45&power=80&wind=1.2
 */
const SHEET_NAME = 'scores';
const MAX_SCORE = 400;     // これ以上の距離は不正とみなす
const NAME_MAX = 12;
const MIN_INTERVAL_MS = 4000; // 同じ名前からの連投制限

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['id', 'name', 'score', 'angle', 'power', 'wind', 'date']);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readAll_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 7).getValues().map(function (r) {
    return { id: String(r[0]), name: String(r[1]), score: Number(r[2]), date: r[6] };
  });
}

function top_(rows, limit) {
  // 名前ごとのベストだけを残してランキング化
  const best = {};
  rows.forEach(function (r) {
    if (!best[r.name] || r.score > best[r.name].score) best[r.name] = r;
  });
  return Object.keys(best).map(function (k) { return best[k]; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, limit)
    .map(function (r) { return { id: r.id, name: r.name, score: r.score }; });
}

function cleanName_(s) {
  s = String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim();
  return s.slice(0, NAME_MAX);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'top') {
      const limit = Math.min(100, Math.max(1, parseInt(p.limit, 10) || 50));
      return json_({ ok: true, items: top_(readAll_(sheet_()), limit) });
    }
    if (p.action === 'submit') {
      const name = cleanName_(p.name);
      const score = Math.round(Number(p.score) * 10) / 10;
      if (!name) return json_({ ok: false, error: 'name required' });
      if (!isFinite(score) || score <= 0 || score > MAX_SCORE) return json_({ ok: false, error: 'invalid score' });

      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const cache = CacheService.getScriptCache();
        const key = 'last_' + Utilities.base64EncodeWebSafe(name);
        if (cache.get(key)) return json_({ ok: false, error: 'too fast' });
        cache.put(key, '1', Math.ceil(MIN_INTERVAL_MS / 1000));

        const sh = sheet_();
        const id = Utilities.getUuid().slice(0, 8);
        sh.appendRow([id, name, score, Number(p.angle) || 0, Number(p.power) || 0, Number(p.wind) || 0, new Date()]);
        const rows = readAll_(sh);
        const items = top_(rows, 100);
        let rank = 0;
        for (let i = 0; i < items.length; i++) {
          if (items[i].name === name) { rank = i + 1; break; }
        }
        // 自分のベストが今回でない場合でも、今回のidを返す
        return json_({ ok: true, id: id, rank: rank, items: items.slice(0, 10) });
      } finally {
        lock.releaseLock();
      }
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
