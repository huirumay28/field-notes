/* Cave Daily — vanilla news shell. No eval. No live fetch. */
(function () {
  "use strict";

  var TOPICS = ["all", "finance", "tech", "politics", "literature"];
  var TOPIC_LABEL = {
    all: "All",
    finance: "Finance",
    tech: "Tech",
    politics: "Politics",
    literature: "Literature"
  };

  var KNOWN_VOCAB = {
    "立法院": "Taiwan's parliament. People there write and vote on laws.",
    "立法委員": "A lawmaker in Taiwan's parliament. People call them 立委.",
    "立委": "Short for 立法委員. A person who sits in parliament and votes on laws.",
    "行政院": "The cabinet. The part of government that runs daily work.",
    "總統": "The president. Top elected boss of the country.",
    "在野黨": "The party not in power. They poke holes in the ruling party's plans.",
    "執政黨": "The party in power right now.",
    "民進黨": "DPP. Taiwan's ruling party in many recent years. Green camp.",
    "國民黨": "KMT. Big opposition party. Blue camp.",
    "公投": "A vote where the public says yes or no on one question.",
    "央行": "The central bank. They set interest rates and watch the money.",
    "通膨": "Prices go up. Same money buys less cabbage.",
    "GDP": "A big number for how much a country makes and spends in a year.",
    "Fed": "The US central bank. When they move rates, money around the world feels it.",
    "AI": "Software that guesses and writes. Sometimes useful. Sometimes loud."
  };

  var SAMPLE_TAIWAN = {
    stories: [{
      id: "sample-tw-1",
      section: "taiwan",
      headline: "〔樣本〕山洞日報測試稿：菜攤上的算盤",
      dek: "這不是真新聞。只是用來試版面。",
      caveman: "人要吃飯。菜有時貴，有時便宜。攤販用算盤算錢。這篇是假的，給你看卡片長怎樣。",
      why_it_matters: "沒有真的事情。只是讓詞彙點擊和版面有東西可看。",
      camps: "沒有陣營。這是樣本。",
      source_name: "Cave Daily sample",
      source_url: "https://example.com/sample-taiwan",
      published: "2026-08-16",
      category: "經濟",
      terms: [
        { term: "算盤", aliases: ["算盤"], explain: "Old tool for counting money. Beads on rods. Hands move, numbers appear." },
        { term: "樣本", aliases: ["測試稿"], explain: "A fake piece, only for testing the page. Not real news." }
      ]
    }],
    glossary: [
      { term: "菜攤", aliases: ["攤販"], explain: "A stall that sells vegetables. Morning market energy." }
    ],
    fetched_at: null,
    notes: "Built-in sample. Live file was missing."
  };

  var SAMPLE_WORLD = {
    stories: [{
      id: "sample-wd-1",
      section: "world",
      headline: "[Sample] A lamp in a made-up library",
      dek: "This is not real news. It is a layout test.",
      caveman: "Room was dark. People put a lamp. Book easier to see. This story is fake. Only here so the page has a World card.",
      why_it_matters: "Nothing happened. The lamp is imaginary. Use it to try tapping an underlined word.",
      camps: "No camps. Sample only.",
      source_name: "Cave Daily sample",
      source_url: "https://example.com/sample-world",
      published: "2026-08-16",
      category: "literature",
      terms: [
        { term: "lamp", aliases: ["light"], explain: "A thing that makes light so eyes can read." },
        { term: "library", aliases: ["book place"], explain: "A quiet room full of books. People borrow, read, return." }
      ]
    }],
    glossary: [
      { term: "sample", aliases: ["layout test"], explain: "A fake piece, only for testing the page. Not real news." }
    ],
    fetched_at: null,
    notes: "Built-in sample. Live file was missing."
  };

  var state = {
    section: "taiwan",
    topic: "all",
    stories: [],
    glossary: [],
    termIndex: new Map(),
    usingSample: { taiwan: false, world: false },
    fetchedAt: [],
    notes: [],
    activeKey: null,
    ignoreSelect: false
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function initEls() {
    els.list = $("story-list");
    els.status = $("status-line");
    els.updated = $("updated-line");
    els.date = $("paper-date");
    els.explain = $("explain-panel");
    els.explainBody = $("explain-body");
    els.explainClose = $("explain-close");
    els.backdrop = $("sheet-backdrop");
    els.tabTaiwan = $("tab-taiwan");
    els.tabWorld = $("tab-world");
    els.topics = $("topic-filters");
  }

  /* —— dates —— */

  function formatPaperDate(d) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Taipei"
      }).format(d);
    } catch (e) {
      return "Sunday, 16 Aug 2026";
    }
  }

  function formatStamp(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Taipei"
      }).format(d) + " Taipei";
    } catch (e) {
      return iso;
    }
  }

  function formatDay(iso) {
    if (!iso) return "";
    var d = new Date(iso + (iso.length <= 10 ? "T12:00:00+08:00" : ""));
    if (isNaN(d.getTime())) return iso;
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Taipei"
      }).format(d);
    } catch (e) {
      return iso;
    }
  }

  /* —— topics —— */

  function mapTopic(category) {
    var raw = (category == null ? "" : String(category)).trim();
    var c = raw.toLowerCase();
    if (/文學|文化|書評|小說/.test(raw) || /\bliterature\b|\bbooks?\b|\bculture\b|\bfiction\b|\bpoetry\b|\bessay\b/.test(c)) {
      return "literature";
    }
    if (/科技|技術|半導體/.test(raw) || /\btech\b|\bai\b|\bsoftware\b|\bchips?\b|semicon|\bgadget\b/.test(c)) {
      return "tech";
    }
    if (/經濟|金融|財經|股市|財政|貿易/.test(raw) || /econom|financ|\bmarkets?\b|\bstocks?\b|\bbanks?\b|\btrade\b|inflation/.test(c)) {
      return "finance";
    }
    if (/政治|選舉|外交|國會/.test(raw) || /politic|\bwar\b|election|legislat|diplom|geopolit/.test(c)) {
      return "politics";
    }
    return "other";
  }

  /* —— load —— */

  function loadFile(url, fallback, section) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("bad status " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.stories)) throw new Error("bad shape");
        return { data: data, sample: false, section: section };
      })
      .catch(function () {
        return { data: fallback, sample: true, section: section };
      });
  }

  function normalizeStory(raw, section, isSample) {
    var story = {
      id: raw.id || (section + "-" + Math.random().toString(36).slice(2, 8)),
      section: raw.section === "world" ? "world" : (raw.section === "taiwan" ? "taiwan" : section),
      headline: String(raw.headline || ""),
      dek: String(raw.dek || ""),
      caveman: String(raw.caveman || ""),
      why_it_matters: String(raw.why_it_matters || ""),
      camps: String(raw.camps || ""),
      source_name: String(raw.source_name || ""),
      source_url: raw.source_url || "",
      published: raw.published || "",
      category: String(raw.category || ""),
      terms: Array.isArray(raw.terms) ? raw.terms : [],
      sample: !!isSample
    };
    story.topic = mapTopic(story.category);
    return story;
  }

  function mergeGlossary(fileGloss, stories) {
    var list = [];
    if (Array.isArray(fileGloss)) {
      fileGloss.forEach(function (g) { if (g && g.term) list.push(g); });
    }
    stories.forEach(function (s) {
      (s.terms || []).forEach(function (g) { if (g && g.term) list.push(g); });
    });
    return list;
  }

  function normKey(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function foldKey(s) {
    return normKey(s).toLowerCase();
  }

  function buildTermIndex(entries) {
    var map = new Map();
    entries.forEach(function (entry) {
      if (!entry || !entry.term) return;
      var canonical = normKey(entry.term);
      var rec = {
        term: canonical,
        explain: String(entry.explain || ""),
        aliases: Array.isArray(entry.aliases) ? entry.aliases.map(normKey).filter(Boolean) : []
      };
      var keys = [canonical].concat(rec.aliases);
      keys.forEach(function (k) {
        var fk = foldKey(k);
        if (!fk) return;
        if (!map.has(fk) || map.get(fk).term.length < rec.term.length) {
          map.set(fk, rec);
        }
      });
    });
    return map;
  }

  function allNeedles(index) {
    var seen = new Map();
    index.forEach(function (rec, key) {
      var variants = [rec.term].concat(rec.aliases);
      variants.forEach(function (v) {
        var n = normKey(v);
        if (n && !seen.has(foldKey(n))) seen.set(foldKey(n), n);
      });
    });
    return Array.from(seen.values()).sort(function (a, b) { return b.length - a.length; });
  }

  /* —— highlight —— */

  function isLatin(term) {
    return /[A-Za-z]/.test(term) && !/[\u4e00-\u9fff]/.test(term);
  }

  function collectRanges(text, needles) {
    var ranges = [];
    var taken = [];
    function overlaps(a, b) {
      return a.start < b.end && b.start < a.end;
    }
    needles.forEach(function (needle) {
      if (!needle) return;
      var hay = isLatin(needle) ? text.toLowerCase() : text;
      var pin = isLatin(needle) ? needle.toLowerCase() : needle;
      var from = 0;
      while (from < hay.length) {
        var i = hay.indexOf(pin, from);
        if (i === -1) break;
        var range = { start: i, end: i + needle.length, needle: needle };
        var hit = taken.some(function (t) { return overlaps(t, range); });
        if (!hit) {
          ranges.push(range);
          taken.push(range);
        }
        from = i + Math.max(needle.length, 1);
      }
    });
    ranges.sort(function (a, b) { return a.start - b.start; });
    return ranges;
  }

  function fillHighlighted(el, text, needles) {
    el.textContent = "";
    if (!text) return;
    var ranges = collectRanges(text, needles);
    var cursor = 0;
    ranges.forEach(function (r) {
      if (r.start > cursor) {
        el.appendChild(document.createTextNode(text.slice(cursor, r.start)));
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "term";
      btn.textContent = text.slice(r.start, r.end);
      var rec = lookupTerm(text.slice(r.start, r.end));
      btn.dataset.term = rec ? rec.term : text.slice(r.start, r.end);
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        state.ignoreSelect = true;
        openExplain(btn.dataset.term, btn);
        setTimeout(function () { state.ignoreSelect = false; }, 50);
      });
      el.appendChild(btn);
      cursor = r.end;
    });
    if (cursor < text.length) {
      el.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  /* —— lookup —— */

  function lookupTerm(raw) {
    var q = normKey(raw);
    if (!q) return null;
    var fk = foldKey(q);
    if (state.termIndex.has(fk)) return state.termIndex.get(fk);

    var best = null;
    var bestScore = 0;
    state.termIndex.forEach(function (rec) {
      var names = [rec.term].concat(rec.aliases);
      names.forEach(function (name) {
        var n = foldKey(name);
        if (!n) return;
        var score = 0;
        if (n === fk) score = 100 + n.length;
        else if (n.indexOf(fk) !== -1) score = 70 + fk.length;
        else if (fk.indexOf(n) !== -1 && n.length >= 2) score = 55 + n.length;
        if (score > bestScore) {
          bestScore = score;
          best = rec;
        }
      });
    });
    return best;
  }

  function looksLikeName(q) {
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+)+$/.test(q)) return true;
    if (/^[A-Z][a-z]{2,}$/.test(q)) return true;
    if (/^[\u4e00-\u9fff]{2,4}$/.test(q) && !KNOWN_VOCAB[q]) return true;
    return false;
  }

  function heuristic(q) {
    if (KNOWN_VOCAB[q]) return KNOWN_VOCAB[q];
    var folded = foldKey(q);
    var knownHit = Object.keys(KNOWN_VOCAB).find(function (k) {
      return foldKey(k) === folded;
    });
    if (knownHit) return KNOWN_VOCAB[knownHit];
    if (looksLikeName(q)) {
      return "Looks like a name. Maybe a person or a place. The glossary does not have it.";
    }
    return "No entry for this. Ask News And Context in chat if you want it explained.";
  }

  function storiesWithTerm(rec, query) {
    var needles = rec
      ? [rec.term].concat(rec.aliases)
      : [query];
    needles = needles.map(foldKey).filter(Boolean);
    return state.stories.filter(function (s) {
      var blob = foldKey([s.headline, s.dek, s.caveman, s.why_it_matters, s.camps].join(" "));
      return needles.some(function (n) { return n.length >= 1 && blob.indexOf(n) !== -1; });
    });
  }

  /* —— explain panel —— */

  function emptyExplainCopy() {
    return "Select any words, or tap a dotted term.";
  }

  function clearExplain() {
    state.activeKey = null;
    document.querySelectorAll(".term.is-active").forEach(function (n) {
      n.classList.remove("is-active");
    });
    els.explain.classList.remove("is-open");
    if (els.backdrop) els.backdrop.hidden = true;
    els.explainBody.textContent = "";
    var p = document.createElement("p");
    p.className = "explain-empty";
    p.textContent = emptyExplainCopy();
    els.explainBody.appendChild(p);
    var sel = window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
  }

  function openExplain(query, sourceBtn) {
    var q = normKey(query);
    if (!q) return;
    var rec = lookupTerm(q);
    state.activeKey = rec ? rec.term : q;

    document.querySelectorAll(".term.is-active").forEach(function (n) {
      n.classList.remove("is-active");
    });
    if (sourceBtn) sourceBtn.classList.add("is-active");
    else {
      document.querySelectorAll(".term").forEach(function (n) {
        if (foldKey(n.dataset.term || n.textContent) === foldKey(state.activeKey)) {
          n.classList.add("is-active");
        }
      });
    }

    els.explainBody.textContent = "";
    var title = document.createElement("h3");
    title.className = "explain-term";
    title.textContent = rec ? rec.term : q;
    els.explainBody.appendChild(title);

    if (rec && rec.explain) {
      var body = document.createElement("p");
      body.className = "explain-text";
      body.textContent = rec.explain;
      els.explainBody.appendChild(body);
    } else {
      var label = document.createElement("p");
      label.className = "explain-rough";
      label.textContent = "Not in the glossary. Rough take:";
      var body2 = document.createElement("p");
      body2.className = "explain-text";
      body2.textContent = heuristic(q);
      els.explainBody.appendChild(label);
      els.explainBody.appendChild(body2);
    }

    var hits = storiesWithTerm(rec, q);
    if (hits.length) {
      var box = document.createElement("div");
      box.className = "appears";
      var strong = document.createElement("strong");
      strong.textContent = "Appears in";
      box.appendChild(strong);
      var ul = document.createElement("ul");
      hits.slice(0, 5).forEach(function (s) {
        var li = document.createElement("li");
        li.textContent = s.headline;
        ul.appendChild(li);
      });
      box.appendChild(ul);
      els.explainBody.appendChild(box);
    }

    els.explain.classList.add("is-open");
    if (window.matchMedia("(max-width: 860px)").matches && els.backdrop) {
      els.backdrop.hidden = false;
    }
  }

  /* —— render —— */

  function safeUrl(url) {
    if (!url) return null;
    try {
      var u = new URL(url, window.location.href);
      if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch (e) { /* ignore */ }
    return null;
  }

  function visibleStories() {
    return state.stories.filter(function (s) {
      if (s.section !== state.section) return false;
      if (state.topic === "all") return true;
      return s.topic === state.topic;
    });
  }

  function renderStatus() {
    var bits = [];
    if (state.usingSample.taiwan && state.usingSample.world) {
      bits.push("Could not load the news files. Showing two marked sample stories so you can try the page.");
    } else if (state.usingSample.taiwan) {
      bits.push("Taiwan file missing. One sample Taiwan story is shown.");
    } else if (state.usingSample.world) {
      bits.push("World file missing. One sample World story is shown.");
    }
    if (bits.length) {
      els.status.hidden = false;
      els.status.textContent = bits.join(" ");
    } else {
      els.status.hidden = true;
      els.status.textContent = "";
    }

    var stamps = state.fetchedAt.filter(Boolean).map(formatStamp).filter(Boolean);
    if (stamps.length) {
      els.updated.hidden = false;
      els.updated.textContent = "Updated " + stamps[0];
    } else {
      els.updated.hidden = true;
    }
  }

  function renderList() {
    els.list.textContent = "";
    if (state.section === "taiwan" && state.topic === "literature") {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      var t = document.createElement("strong");
      t.textContent = "Literature is US-only.";
      var p = document.createElement("p");
      p.textContent = "Switch to World, or pick another topic.";
      empty.appendChild(t);
      empty.appendChild(p);
      els.list.appendChild(empty);
      return;
    }

    var items = visibleStories();
    if (!items.length) {
      var empty2 = document.createElement("div");
      empty2.className = "empty-state";
      var t2 = document.createElement("strong");
      t2.textContent = "No " + (state.topic === "all" ? "" : TOPIC_LABEL[state.topic] + " ") +
        "stories in this section yet.";
      var p2 = document.createElement("p");
      p2.textContent = "The JSON files may still be on their way.";
      empty2.appendChild(t2);
      empty2.appendChild(p2);
      els.list.appendChild(empty2);
      return;
    }

    var needles = allNeedles(state.termIndex);
    items.forEach(function (story) {
      els.list.appendChild(renderCard(story, needles));
    });
  }

  function renderCard(story, needles) {
    var card = document.createElement("article");
    card.className = "card is-open";
    card.dataset.id = story.id;

    var top = document.createElement("div");
    top.className = "card-top";
    var pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = TOPIC_LABEL[story.topic] || story.category || "Story";
    top.appendChild(pill);
    var topRight = document.createElement("div");
    topRight.className = "card-top-right";
    if (story.sample) {
      var flag = document.createElement("span");
      flag.className = "sample-flag";
      flag.textContent = "Sample";
      topRight.appendChild(flag);
    }
    var fold = document.createElement("button");
    fold.type = "button";
    fold.className = "fold-btn";
    fold.setAttribute("aria-expanded", "true");
    fold.textContent = "Fold";
    topRight.appendChild(fold);
    top.appendChild(topRight);
    card.appendChild(top);

    var h = document.createElement("h3");
    fillHighlighted(h, story.headline, needles);
    card.appendChild(h);

    if (story.dek) {
      var dek = document.createElement("p");
      dek.className = "dek";
      fillHighlighted(dek, story.dek, needles);
      card.appendChild(dek);
    }

    var body = document.createElement("div");
    body.className = "card-body";

    if (story.caveman) {
      var cave = document.createElement("p");
      cave.className = "caveman";
      fillHighlighted(cave, story.caveman, needles);
      body.appendChild(cave);
    }

    if (story.why_it_matters) {
      body.appendChild(quietBlock("Why it matters", story.why_it_matters, needles));
    }
    if (story.camps) {
      body.appendChild(quietBlock("Who thinks what", story.camps, needles));
    }

    var foot = document.createElement("div");
    foot.className = "card-foot";
    var href = safeUrl(story.source_url);
    if (href) {
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = story.source_name || "Source";
      foot.appendChild(a);
    } else if (story.source_name) {
      var span = document.createElement("span");
      span.textContent = story.source_name;
      foot.appendChild(span);
    }
    if (story.published) {
      var time = document.createElement("time");
      time.dateTime = story.published;
      time.textContent = formatDay(story.published);
      foot.appendChild(time);
    }
    body.appendChild(foot);
    card.appendChild(body);

    fold.addEventListener("click", function () {
      var willOpen = body.hidden;
      body.hidden = !willOpen;
      card.classList.toggle("is-open", willOpen);
      fold.setAttribute("aria-expanded", willOpen ? "true" : "false");
      fold.textContent = willOpen ? "Fold" : "Open";
    });

    return card;
  }

  function quietBlock(label, text, needles) {
    var box = document.createElement("div");
    box.className = "quiet-block";
    var h = document.createElement("h4");
    h.textContent = label;
    var p = document.createElement("p");
    fillHighlighted(p, text, needles);
    box.appendChild(h);
    box.appendChild(p);
    return box;
  }

  /* —— selection —— */

  function selectionInsideArticle(sel) {
    if (!sel || sel.rangeCount === 0) return false;
    try {
      var node = sel.getRangeAt(0).commonAncestorContainer;
      var el = node.nodeType === 1 ? node : node.parentElement;
      return !!(el && el.closest && el.closest("#story-list .card"));
    } catch (e) {
      return false;
    }
  }

  function onSelect() {
    if (state.ignoreSelect) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    if (!selectionInsideArticle(sel)) return;
    var text = normKey(sel.toString());
    if (text.length < 1 || text.length > 40) return;
    openExplain(text, null);
  }

  /* —— chrome —— */

  function setSection(section) {
    state.section = section;
    els.tabTaiwan.setAttribute("aria-pressed", section === "taiwan" ? "true" : "false");
    els.tabWorld.setAttribute("aria-pressed", section === "world" ? "true" : "false");
    renderList();
  }

  function setTopic(topic) {
    if (TOPICS.indexOf(topic) === -1) topic = "all";
    state.topic = topic;
    els.topics.querySelectorAll(".topic").forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-topic") === topic);
    });
    renderList();
  }

  function bindChrome() {
    els.tabTaiwan.addEventListener("click", function () { setSection("taiwan"); });
    els.tabWorld.addEventListener("click", function () { setSection("world"); });
    els.topics.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-topic]");
      if (btn) setTopic(btn.getAttribute("data-topic"));
    });
    els.explainClose.addEventListener("click", clearExplain);
    if (els.backdrop) els.backdrop.addEventListener("click", clearExplain);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") clearExplain();
    });
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("touchend", function () {
      setTimeout(onSelect, 0);
    });
    document.addEventListener("keyup", function (ev) {
      if (ev.key === "Shift" || ev.shiftKey) onSelect();
    });
  }

  /* —— install + worker —— */

  function isStandalone() {
    var standalone = false;
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        standalone = true;
      }
    } catch (e) { /* ignore */ }
    if (window.navigator.standalone === true) standalone = true;
    if (standalone) document.documentElement.classList.add("is-standalone");
    return standalone;
  }

  function bindInstallHint() {
    var hint = $("install-hint");
    var dismiss = $("install-hint-dismiss");
    if (!hint) return;
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem("cave-daily-install-hint") === "1") return;
    } catch (e) { /* ignore */ }
    hint.hidden = false;
    hint.classList.add("is-shown");
    if (!dismiss) return;
    dismiss.addEventListener("click", function () {
      hint.hidden = true;
      hint.classList.remove("is-shown");
      try {
        window.localStorage.setItem("cave-daily-install-hint", "1");
      } catch (e) { /* ignore */ }
    });
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    var https = window.location.protocol === "https:";
    var host = window.location.hostname;
    var local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (!https && !local) return;
    navigator.serviceWorker.register("./sw.js").catch(function () {});
  }

  /* —— boot —— */

  function applyPack(pack) {
    var stories = (pack.data.stories || []).map(function (s) {
      return normalizeStory(s, pack.section, pack.sample);
    });
    if (pack.sample) state.usingSample[pack.section] = true;
    if (pack.data.fetched_at) state.fetchedAt.push(pack.data.fetched_at);
    if (pack.data.notes) state.notes.push(pack.data.notes);
    state.stories = state.stories.concat(stories);
    var gloss = mergeGlossary(pack.data.glossary, stories);
    state.glossary = state.glossary.concat(gloss);
  }

  function boot() {
    initEls();
    els.date.textContent = formatPaperDate(new Date());
    try {
      els.date.dateTime = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
    } catch (e) {
      els.date.dateTime = "2026-08-16";
    }
    bindChrome();
    bindInstallHint();
    registerSW();

    Promise.all([
      loadFile("./taiwan-news.json", SAMPLE_TAIWAN, "taiwan"),
      loadFile("./world-news.json", SAMPLE_WORLD, "world")
    ]).then(function (packs) {
      packs.forEach(applyPack);
      state.termIndex = buildTermIndex(state.glossary);
      renderStatus();
      renderList();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
