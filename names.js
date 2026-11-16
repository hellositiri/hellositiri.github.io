/* Sitiri: finding names that carry no title, organizations behind email addresses,
   unusual capitalized words, and the house list. Everything here runs on this computer. */
(function () {
  'use strict';
  var WORDS = null;
  function dict() {
    if (!WORDS) WORDS = new Set(String(window.SITIRI_WORDS || '').split('|'));
    return WORDS;
  }
  var ALLOW = new Set(('january february march april may june july august september october november december ' +
    'jan feb mar apr jun jul aug sep sept oct nov dec monday tuesday wednesday thursday friday saturday sunday ' +
    'mon tue tues wed thu thur thurs fri sat sun fyi re fw fwd cc bcc po gpo am pm usd kes ksh kshs shs vat ltd llp plc ' +
    'id no nos tel fax email pin lr cap mr mrs ms dr prof ceo hr it ai pdf ii iii iv vi vii viii ix xi xii ' +
    'ok okay etc eg ie vs na tbc tbd asap pp encl ref refs attn inbox unsubscribe capex opex eco english phd majeure cadastral llb llm cbs ebs ogw mbs hsc').split(' '));
  var STOP = /^(?:dear|hi|hello|hey|hallo|regards|kind|best|warm|thanks|thank|sincerely|yours|faithfully|cheers|sir|madam|sirs|team|all|director|directors|from|to|subject|date|sent|on|the|and|please|propose|proposal|proposing|clause|schedule|paragraph|mr|mrs|ms|dr|prof)$/i;
  var NOTNAME = /^(?:sir|madam|sirs|team|all|director|directors|colleagues|everyone|both|there|client|customer|counsel|me|undisclosed recipients)$/i;

  function known(w) {
    var k = w.toLowerCase().replace(/['’]s$/, '').replace(/['’]/g, '');
    if (k.length < 2 || ALLOW.has(k)) return true;
    var D = dict();
    if (D.has(k)) return true;
    if (k.indexOf('-') >= 0) return k.split('-').every(function (p) { return !p || D.has(p) || ALLOW.has(p); });
    return false;
  }
  function tidy(s) {
    return canon(String(s).replace(/[*_"“”<>]/g, ' ')).replace(/^[\s,.;:'\-|]+|[\s,.;:'\-|]+$/g, '');
  }
  function nameLike(s) {
    if (!s || /\d|@/.test(s) || NOTNAME.test(s)) return false;
    var w = s.split(' ');
    if (w.length > 4) return false;
    if (!w.some(function (x) { return /^[A-Z]/.test(x); })) return false;
    return w.every(function (x) { return /^[A-Za-z][A-Za-z'’.\-]*$/.test(x) && x.length <= 20; });
  }

  /* ---------- names that the layout of an email gives away ---------- */
  var PUBLIC = /^(?:gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|mac|aol|proton|protonmail|pm|zoho|gmx|mail|yandex)$/;
  var SUFFIX = /^(?:co|com|ac|or|go|ne|org|net|edu|gov|sc|me|info|mobi)$/;
  var SIGNOFF = /^(?:(?:kind|best|warm|warmest|with)\s+)?(?:regards|wishes)|^(?:yours\s+)?(?:sincerely|faithfully|truly)|^(?:many\s+)?thanks|^thank\s+you|^cheers/i;
  function strong(lines) {
    var out = [], roles = [];
    function person(s) {
      s = tidy(s).replace(/^(?:mr|mrs|ms|miss|dr|prof|eng|hon)\.?\s+/i, '');
      if (!nameLike(s)) return;
      out.push({ cat: 'Person', term: s });
      var w = s.split(' ');
      if (w.length > 1) w.forEach(function (x) {
        x = x.replace(/\.$/, '');
        if (x.length >= 3 && !known(x) && !GENERIC.test(x)) out.push({ cat: 'Person', term: x });
      });
    }
    var afterSign = 0;
    lines.forEach(function (raw) {
      var l = String(raw).replace(/^[\s>]+/, ''), m, re;
      var bare = l.replace(/[*_]/g, '').trim();
      // "Amani Wanjiku <legal@example.com>"
      re = /((?:[A-Za-z][A-Za-z'’.\-]*[ \t]+){0,3}[A-Za-z][A-Za-z'’.\-]*)["”*]?[ \t]*<(?:mailto:)?[^<>\s@]+@[^<>\s]+>/g;
      while ((m = re.exec(l))) {
        var words = m[1].split(/[ \t]+/);
        while (words.length && !/^[A-Z]/.test(words[0])) words.shift();
        while (words.length && /^(?:from|to|cc|bcc|wrote|by|am|pm)$/i.test(words[0].replace(/:$/, ''))) words.shift();
        if (words.length) person(words.join(' '));
      }
      // "From: Juma Otieno", "To: MS Wairimu, Baraka Njoroge"
      m = /^(?:From|To|Cc|Bcc|Sent\s+by|Reply-To)\s*:\s*(.+)$/i.exec(bare);
      if (m) m[1].split(/[,;]/).forEach(function (part) { person(part.replace(/<[^>]*>/g, ' ').replace(/\S+@\S+/g, ' ')); });
      // "Dear Juma," "Hi Amani"
      m = /^(?:Dear|Hi|Hello|Hey|Hallo|Good\s+(?:morning|afternoon|evening))[ \t]+((?:[A-Z][A-Za-z'’.\-]*[ \t]*){1,4})[,:;.!]?\s*$/.exec(bare);
      if (m) person(m[1]);
      // the line under "Kind regards,"
      if (afterSign > 0 && bare) {
        afterSign = 0;
        var first = bare.split('|')[0];
        if (!SIGNOFF.test(first)) person(first);
      } else if (afterSign > 0) afterSign--;
      if (SIGNOFF.test(bare) && bare.length < 40) afterSign = 3;
      // "Baraka Njoroge | Operations Manager |"
      m = /^((?:[A-Z][A-Za-z'’.\-]*[ \t]+){1,3}[A-Z][A-Za-z'’.\-]*)[ \t]*\|[ \t]*([A-Za-z][A-Za-z &\-\/]{3,40}?)[ \t]*(?:\||$)/.exec(bare);
      if (m) { person(m[1]); var role = tidy(m[2]); if (role.split(' ').length >= 2) roles.push({ cat: 'Role', term: role, on: false }); }
    });
    return out.concat(roles);
  }

  /* ---------- organizations and websites behind email addresses ---------- */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function domains(lines) {
    var out = [], seen = {}, re = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g, D = dict();
    lines.forEach(function (l) {
      var m; re.lastIndex = 0;
      while ((m = re.exec(l))) {
        var dom = m[1].toLowerCase().replace(/[.\-]+$/, '');
        if (seen[dom]) continue; seen[dom] = 1;
        var parts = dom.split('.'); parts.pop();
        if (parts.length > 1 && SUFFIX.test(parts[parts.length - 1])) parts.pop();
        var label = parts[parts.length - 1] || '';
        if (label.length < 3 || PUBLIC.test(label)) continue;
        out.push({ cat: 'Website', term: dom });
        if (!D.has(label)) out.push({ cat: 'Company', term: cap(label) });
        for (var i = 3; i <= label.length - 4; i++) {
          var a = label.slice(0, i), b = label.slice(i);
          if (D.has(b)) {
            out.push({ cat: 'Company', term: cap(a) + ' ' + cap(b) });
            if (!D.has(a)) out.push({ cat: 'Company', term: cap(a) });
            break;
          }
        }
      }
    });
    return out;
  }

  /* ---------- capitalized words that are not ordinary English ---------- */
  function unusual(lines) {
    var counts = new Map();
    function add(term) {
      term = tidy(term); if (term.length < 3) return;
      var k = term.toLowerCase(), e = counts.get(k);
      if (!e) counts.set(k, { term: term, n: 1 });
      else { e.n++; if (e.term === e.term.toUpperCase() && term !== term.toUpperCase()) e.term = term; }
    }
    lines.forEach(function (line) {
      line = String(line);
      var toks = [], m, re = /[A-Za-z][A-Za-z'’\-]*/g;
      while ((m = re.exec(line))) {
        var w = m[0].replace(/['’]s$/, '').replace(/['’\-]+$/, '');
        var kind = /^[A-Z]{2,}$/.test(w) ? 'caps' : /^[A-Z][A-Za-z'’\-]*[a-z][A-Za-z'’\-]*$/.test(w) ? 'title' : 'low';
        toks.push({ w: w, i: m.index, end: m.index + w.length, kind: kind, known: known(w) });
      }
      var i = 0;
      while (i < toks.length) {
        var t = toks[i];
        if (t.kind === 'low') { i++; continue; }
        var run = [t], j = i + 1;
        while (j < toks.length && run.length < 5) {
          var gap = line.slice(toks[j - 1].end, toks[j].i);
          if (toks[j].kind === t.kind && /^(?:['’]s)?[ \t]{1,2}$/.test(gap)) { run.push(toks[j]); j++; continue; }
          if (t.kind === 'title' && j + 1 < toks.length && /^(?:of|ole|wa|bin|de|van)$/.test(toks[j].w) && toks[j + 1].kind === 'title' &&
              /^[ \t]$/.test(gap) && /^[ \t]$/.test(line.slice(toks[j].end, toks[j + 1].i))) { run.push(toks[j], toks[j + 1]); j += 2; continue; }
          break;
        }
        i = j;
        if (!run.some(function (x) { return x.kind !== 'low' && !x.known; })) continue;
        if (t.kind === 'caps') {
          while (run.length && run[0].known) run.shift();
          while (run.length && run[run.length - 1].known) run.pop();
        } else {
          var before = line.slice(0, run[0].i).replace(/\s+$/, '');
          var startOfSentence = !before || /[.!?:;>*•\-–|)(\]\["“]$/.test(before);
          while (run.length > 1 && run[0].known && (STOP.test(run[0].w) || startOfSentence)) { run.shift(); startOfSentence = false; }
          while (run.length > 1 && STOP.test(run[run.length - 1].w)) run.pop();
        }
        if (!run.length || (run.length === 1 && (run[0].known || STOP.test(run[0].w)))) continue;
        add(line.slice(run[0].i, run[run.length - 1].end));
      }
    });
    return Array.from(counts.values()).sort(function (a, b) { return b.n - a.n; })
      .map(function (e) { return { cat: 'Name', term: e.term, on: false }; });
  }

  /* ---------- the house list: names saved on this computer and hidden every time ---------- */
  var KEY = 'sitiri.house';
  function loadHouse() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(function (x) { return x && x.term; }) : []; }
    catch (e) { return []; }
  }
  function saveHouse(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function occurs(term, lines) {
    try { var eng = makeEngine([{ term: term, ph: 'x' }], 'redact'); return lines.some(function (l) { return eng.find(l).length > 0; }); }
    catch (e) { return false; }
  }

  /* ---------- everything together, strongest first ---------- */
  window.findAll = function (lines) {
    var seen = new Map(), out = [];
    var LEAD = /^(?:should|would|could|may|might|will|shall|must|can|the|a|an|and|or|but|if|that|this|whereas|please|kindly|dear|hi|hello|between|with|from|to|by|for|of|our|your|their|its|we|i|has|have|had|is|are|was|were|does|did|let|also|then|so|as|at|in|on)\s+/i;
    function push(d) {
      var term = canon(d.term).replace(/[.,;:]+$/, '');
      if (/^(?:Company|Person)$/.test(d.cat)) { var t0; do { t0 = term; term = term.replace(LEAD, ''); } while (term !== t0 && term.split(' ').length > 1); }
      if (term.length < 3) return;
      var k = term.toLowerCase(), e = seen.get(k);
      if (e) { if (d.on !== false) e.on = true; return; }
      e = { cat: d.cat, term: term, on: d.on !== false }; seen.set(k, e); out.push(e);
    }
    loadHouse().forEach(function (h) { if (occurs(h.term, lines)) push({ cat: h.cat || 'Term', term: h.term }); });
    detect(lines).forEach(push);
    strong(lines).forEach(function (d) { if (occurs(d.term, lines)) push(d); });
    domains(lines).forEach(function (d) { if (occurs(d.term, lines)) push(d); });
    if (window.SITIRI_WORDS) unusual(lines).forEach(push);
    // a "maybe" that only repeats part of a ticked row adds nothing
    var sure = out.filter(function (d) { return d.on; });
    var sureText = sure.map(function (d) { return ' ' + d.term.toLowerCase() + ' '; });
    var single = {}, inPhrases = {};
    out.forEach(function (d) {
      var k = d.term.toLowerCase();
      if (k.indexOf(' ') < 0) single[k] = 1;
      else if (d.cat === 'Name') k.split(' ').forEach(function (x) { inPhrases[x] = (inPhrases[x] || 0) + 1; });
    });
    var maybe = out.filter(function (d) {
      if (d.on) return false;
      var k = d.term.toLowerCase();
      if (sureText.some(function (t) { return t.indexOf(' ' + k + ' ') >= 0 || t.indexOf(' ' + k) === 0 && t.indexOf(k) === 1; })) return false;
      var w = k.split(' ');
      if (d.cat === 'Name' && w.length > 1) {
        var odd = w.filter(function (x) { return !known(x); });
        if (odd.length && odd.every(function (x) { return single[x] && inPhrases[x] > 1; })) return false;
      }
      return true;
    });
    return sure.concat(maybe);
  };

  /* ---------- house list controls ---------- */
  function renderHouse() {
    var box = $('h-box'); if (!box) return;
    var list = loadHouse();
    $('h-count').textContent = list.length;
    var ul = $('h-list'); ul.innerHTML = '';
    list.forEach(function (h, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.i = i; b.title = 'Remove from my house list';
      b.textContent = h.term + ' ×';
      ul.appendChild(b);
    });
    $('h-empty').classList.toggle('hide', list.length > 0);
    $('h-clear').classList.toggle('hide', list.length === 0);
  }
  function setup() {
    var wrap = $('r-table') && $('r-table').closest('.tablewrap'); if (!wrap || $('h-box')) return;
    var box = document.createElement('details'); box.id = 'h-box'; box.className = 'house';
    box.innerHTML = '<summary>My house list (<span id="h-count">0</span>)</summary>' +
      '<p>Names you always hide, such as your own organization and colleagues. They are saved in this browser on this computer only, and are ticked for you whenever they appear in a document.</p>' +
      '<p id="h-empty" class="fileinfo">Nothing saved yet. Tick the rows you always want hidden, then click "Save ticked rows to my house list".</p>' +
      '<div id="h-list"></div>' +
      '<div class="row"><button class="btn alt" id="h-clear" type="button">Clear my house list</button></div>';
    wrap.parentNode.insertBefore(box, wrap.nextSibling);
    $('h-list').addEventListener('click', function (e) {
      var i = e.target.dataset.i; if (i == null) return;
      var list = loadHouse(); list.splice(+i, 1); saveHouse(list); renderHouse();
    });
    $('h-clear').addEventListener('click', function () { saveHouse([]); renderHouse(); });
    var btn = $('h-save');
    if (btn) btn.addEventListener('click', function () {
      var list = loadHouse(), have = {}, n = 0;
      list.forEach(function (h) { have[canon(h.term).toLowerCase()] = 1; });
      state.rows.forEach(function (r) {
        var t = canon(r.term), k = t.toLowerCase();
        if (!r.on || t.length < 3 || have[k]) return;
        have[k] = 1; list.push({ term: t, cat: r.cat || 'Term' }); n++;
      });
      if (!saveHouse(list)) { note($('r-msg'), 'bad', 'This browser would not save the list. Private windows often block saving.'); return; }
      renderHouse(); box.open = true;
      note($('r-msg'), n ? 'ok' : 'warn', n ? ('Saved ' + n + ' name(s) to your house list. Remove any that were only for this document.') : 'Every ticked row is already in your house list.');
    });
    renderHouse();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();

  /* ---------- more formats ---------- */
  if (window.DETECT) {
    window.DETECT.push({ cat: 'Phone', re: /\(\d{3}\)[ \t]?\d{3}[ \t]?\d{3}(?!\d)/g });
    window.DETECT.push({ cat: 'Phone', re: /(?<![\dA-Za-z\/.,+])0[17]\d{2}[ \t\-]?\d{3}[ \t\-]?\d{3}(?!\d)/g });
    window.DETECT.push({ cat: 'Coordinates', re: /(?<![\dA-Za-z.])-?\d{1,3}\.\d{5,}(?![\d.]*[A-Za-z])/g });
    window.DETECT.push({ cat: 'Phone', re: /\+254(?:%20|\d){9,}/g });
    window.DETECT.push({ cat: 'Address', re: /\b(?:GPO|G\.P\.O\.?)[ \t]*\d{5}\b/g });
    window.DETECT.push({ cat: 'Website', re: /\bhttps?:\/\/[^\s<>()\[\]"'”]+[^\s<>()\[\]"'”.,;:!?]/g });
  }
})();

/* ---------- one label per person, and frequent "maybe" words first (version 1.7) ---------- */
(function () {
  'use strict';
  if (!window.findAll || !window.state) return;
  var LINKS = {}, COUNTS = {};
  function words(s) { return canon(s).toLowerCase().replace(/[.,]/g, '').split(' ').filter(Boolean); }
  function countIn(term, lines) {
    try { var eng = makeEngine([{ term: term, ph: 'x' }], 'redact'), n = 0; lines.forEach(function (l) { n += eng.find(l).length; }); return n; }
    catch (e) { return 0; }
  }
  // Which longer name, if exactly one, does this short form belong to?
  function linkFor(short, fulls) {
    var s = words(short); if (!s.length) return null;
    var hits = [];
    fulls.forEach(function (f) {
      var w = words(f.term); if (w.length <= s.length) return;
      var role = null;
      for (var i = 0; i + s.length <= w.length; i++) {
        if (s.every(function (x, j) { return w[i + j] === x; })) { role = s.length === 1 ? (i === 0 ? 'first' : i === w.length - 1 ? 'last' : 'part') : 'part'; break; }
      }
      if (!role && s.length === 1 && s[0].length >= 4 && w[0].length > s[0].length && w[0].indexOf(s[0]) === 0) role = 'nick';
      if (role) hits.push({ full: f.term, role: role, cat: f.cat });
    });
    return hits.length === 1 ? hits[0] : null;
  }
  var base = window.findAll;
  window.findAll = function (lines) {
    var out = base(lines);
    LINKS = {}; COUNTS = {};
    var FULLCATS = /^(Person|Company|Name)$/;
    var fulls = out.filter(function (d) { return FULLCATS.test(d.cat) && words(d.term).length >= 2; });
    // names already in the table count as possible "full names" too
    state.rows.forEach(function (r) { if (r.term && FULLCATS.test(r.cat) && words(r.term).length >= 2) fulls.push({ term: r.term, cat: r.cat }); });
    out.forEach(function (d) {
      var k = canon(d.term).toLowerCase();
      if (FULLCATS.test(d.cat)) { var l = linkFor(d.term, fulls); if (l) LINKS[k] = l; }
      if (!d.on) COUNTS[k] = countIn(d.term, lines);
    });
    return out;
  };
  function label(parent, role, cat) {
    var m = /^\[(.*)\]$/.exec(canon(parent.ph)), core = m ? m[1] : canon(parent.ph);
    var word = role === 'first' ? (/^Person$/i.test(cat) ? 'first name' : 'short') : role === 'last' ? (/^Person$/i.test(cat) ? 'surname' : 'short') : 'short';
    var ph = '[' + core + ', ' + word + ']', n = 1;
    while (state.rows.some(function (r) { return canon(r.ph).toLowerCase() === ph.toLowerCase(); })) { n++; ph = '[' + core + ', ' + word + ' ' + n + ']'; }
    return ph;
  }
  function byTerm(t) { var k = canon(t).toLowerCase(); return state.rows.find(function (r) { return canon(r.term).toLowerCase() === k; }); }

  // Remember where the list ended before "Find likely identifiers" ran, so only new rows are rearranged.
  var before = 0;
  document.addEventListener('click', function (e) { if (e.target && e.target.id === 'r-suggest') before = state.rows.length; }, true);
  $('r-suggest').addEventListener('click', function () {
    var fresh = state.rows.slice(before); if (!fresh.length) return;
    // people who made tracked changes or comments are always hidden, even if they were first offered as a "maybe"
    if (state.src && state.src.info && document.querySelector('input[name=rmode]:checked').value === 'file') {
      Object.keys(state.src.info.authors).forEach(function (a) {
        var r = byTerm(a); if (r && !r.on) { r.on = true; if (r.cat === 'Name') { r.cat = 'Person'; r.ph = '[Person 999]'; } }
      });
    }
    var old = state.rows.slice(0, before), linked = 0;
    // link short forms to their full name, keeping them under it
    fresh.forEach(function (r) {
      var l = LINKS[canon(r.term).toLowerCase()]; if (!l) return;
      var p = byTerm(l.full); if (!p || p === r) return;
      r.parent = p; r.role = l.role; r.ph = label(p, l.role, p.cat); linked++;
    });
    // close the gaps left in the numbering by the short forms, so the numbers still count people
    var maxOld = {};
    old.forEach(function (r) { var m = /^\[(.+) (\d+)\]$/.exec(canon(r.ph)); if (m) maxOld[m[1].toLowerCase()] = Math.max(maxOld[m[1].toLowerCase()] || 0, +m[2]); });
    var next = {};
    fresh.forEach(function (r) {
      if (r.parent) return;
      var m = /^\[(.+) (\d+)\]$/.exec(canon(r.ph)); if (!m) return;
      var c = m[1].toLowerCase(); next[c] = (next[c] || maxOld[c] || 0) + 1; r.ph = '[' + m[1] + ' ' + next[c] + ']';
    });
    fresh.forEach(function (r) { if (r.parent) { r.ph = ''; r.ph = label(r.parent, r.role, r.parent.cat); } });
    fresh.forEach(function (r) { r.freq = (!r.on && COUNTS[canon(r.term).toLowerCase()]) || 0; });
    var top = fresh.filter(function (r) { return !r.on && !r.parent && r.freq >= 3; }).sort(function (a, b) { return b.freq - a.freq; });
    var rest = fresh.filter(function (r) { return top.indexOf(r) < 0 && !r.parent; });
    var ordered = old.concat(top), placed = {};
    function place(r) {
      ordered.push(r);
      fresh.forEach(function (c) { if (c.parent === r && !placed[fresh.indexOf(c)]) { placed[fresh.indexOf(c)] = 1; ordered.push(c); } });
    }
    top.forEach(function (r) { fresh.forEach(function (c) { if (c.parent === r) { placed[fresh.indexOf(c)] = 1; ordered.splice(ordered.indexOf(r) + 1, 0, c); } }); });
    rest.forEach(place);
    old.forEach(function (r) { fresh.forEach(function (c) { if (c.parent === r && !placed[fresh.indexOf(c)]) { placed[fresh.indexOf(c)] = 1; ordered.splice(ordered.indexOf(r) + 1, 0, c); } }); });
    fresh.forEach(function (c, i) { if (!placed[i] && ordered.indexOf(c) < 0) ordered.push(c); });
    state.rows.length = 0; ordered.forEach(function (r) { state.rows.push(r); });
    renderRows();
    var msg = $('r-msg'), n = fresh.length, maybe = fresh.filter(function (r) { return !r.on; }).length;
    var parts = ['Added ' + n + ' row(s). Untick any you do not need, and add anything that is missing.'];
    if (top.length) parts.push('The ' + top.length + ' row(s) at the top are unticked but appear several times. Check them first: they are often the other side of a deal, a place or a project name.');
    if (maybe) parts.push(maybe + ' row(s) in all are unticked: capitalized words that may be names or places. Tick the ones that need hiding.');
    if (linked) parts.push(linked + ' short form(s), such as a first name, share the number of the full name they belong to, so a reader can tell it is the same person. Click "Separate" on a row if Sitiri linked it wrongly.');
    note(msg, 'ok', parts.join(' '));
  });

  // the table: show links and how often a "maybe" appears
  var baseRender = window.renderRows;
  window.renderRows = function () {
    baseRender();
    var trs = $('r-table').querySelectorAll('tbody tr');
    state.rows.forEach(function (r, i) {
      var tr = trs[i]; if (!tr) return;
      if (r.parent && state.rows.indexOf(r.parent) >= 0) {
        var cell = tr.children[2], d = document.createElement('div'); d.className = 'linkline';
        d.appendChild(document.createTextNode('Same as ' + canon(r.parent.term) + ' '));
        var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.dataset.i = i; b.dataset.f = 'unlink'; b.textContent = 'Separate';
        d.appendChild(b); cell.appendChild(d);
      } else if (r.parent) { delete r.parent; delete r.role; r.ph = nextPh(r.cat); tr.children[2].querySelector('input').value = r.ph; }
      if (!r.on && r.freq >= 3) { tr.classList.add('freq'); var n = tr.children[3]; n.textContent = 'appears ' + r.freq + ' times'; }
    });
  };
  $('r-table').addEventListener('click', function (e) {
    var t = e.target; if (t.dataset.f !== 'unlink') return;
    var r = state.rows[+t.dataset.i]; if (!r) return;
    delete r.parent; delete r.role; r.ph = nextPh(r.cat); renderRows();
  });
  $('r-table').addEventListener('change', function (e) {
    var t = e.target; if (t.dataset.f !== 'ph') return;
    var p = state.rows[+t.dataset.i]; if (!p) return;
    var touched = false;
    state.rows.forEach(function (c) { if (c.parent === p) { c.ph = ''; c.ph = label(p, c.role, p.cat); touched = true; } });
    if (touched) renderRows();
  });
  // deleting a row removes its links
  $('r-table').addEventListener('click', function (e) {
    if (e.target.dataset.f !== 'del') return;
    state.rows.forEach(function (c) { if (c.parent && state.rows.indexOf(c.parent) < 0) { delete c.parent; delete c.role; c.ph = nextPh(c.cat); } });
    renderRows();
  });
})();
