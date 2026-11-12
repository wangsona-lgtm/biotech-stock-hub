/**
 * BIO·PULSE 台美日生技股票分析與金主聯盟終端主程式
 */
(function () {
  const WATCHLIST_KEY = "bio_pulse_watchlist_v1";
  const COMPARE_PALETTE = ["#38bdf8", "#ff4d5a", "#fbbf24", "#00d084", "#a78bfa", "#fb7185"];

  const state = {
    data: null,
    stocksById: new Map(),
    seriesCache: new Map(),
    activeTab: "terminal",
    selectedId: "6472",
    sidebarSegment: "all",
    tableSegment: "all",
    peerSegment: "all",
    scatterMode: "pb",
    searchQuery: "",
    watchlist: new Set(),
    chartOpts: {
      mode: "candle",
      range: "3M",
      subType: "volume",
      showMa5: true,
      showMa20: true,
      showMa60: true,
      showMa200: true,
      showBB: false,
    },
    tableSort: { key: "backer_pct", dir: "desc" },
    peerSort: { key: "gm", dir: "desc" },
    compareIds: ["6472", "6446", "6589", "4726", "6838"],
    compareRange: "3M",
  };

  function loadWatchlist() {
    try {
      const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "null");
      if (Array.isArray(saved) && saved.length) {
        state.watchlist = new Set(saved);
        return;
      }
    } catch (_) {}
    state.watchlist = new Set(["6472", "6589", "4726", "6446", "6838", "4123"]);
  }

  function saveWatchlist() {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(state.watchlist)));
    } catch (_) {}
  }

  function toggleWatchlist(id, e) {
    if (e) e.stopPropagation();
    if (state.watchlist.has(id)) state.watchlist.delete(id);
    else state.watchlist.add(id);
    saveWatchlist();
    renderAll();
  }

  function fmtPrice(v, stock) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const num = Number(v);
    if (stock && stock.currency === "JPY") {
      return Math.round(num).toLocaleString("en-US");
    }
    if (stock && stock.currency === "TWD") {
      return num >= 1000 ? num.toLocaleString("en-US", { maximumFractionDigits: 2 }) : num.toFixed(nDecimals(num));
    }
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function nDecimals(num) {
    return num % 1 === 0 ? 1 : 2;
  }

  function fmtPct(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const n = Number(v);
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  function chgClass(v) {
    if (v === null || v === undefined) return "flat";
    if (v > 0) return "up";
    if (v < 0) return "down";
    return "flat";
  }

  function badgeClass(v) {
    if (v === null || v === undefined) return "badge-flat";
    if (v > 0) return "badge-up";
    if (v < 0) return "badge-down";
    return "badge-flat";
  }

  function fmtVol(v, stock) {
    if (!v) return "—";
    if (stock && stock.market === "TW") {
      const lots = Math.round(v / 1000);
      return lots.toLocaleString("en-US") + " 張";
    }
    if (v >= 1e8) return (v / 1e8).toFixed(2) + "億";
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return String(v);
  }

  function fmtMcap(v, stock) {
    if (!v) return "—";
    if (stock && stock.currency === "USD") {
      if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
      return "$" + (v / 1e9).toFixed(1) + "B";
    }
    if (stock && stock.currency === "JPY") {
      return "¥" + (v / 1e12).toFixed(2) + "兆";
    }
    if (v >= 1e12) return (v / 1e12).toFixed(2) + "兆";
    return (v / 1e8).toFixed(0) + "億";
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtExchLabel(s) {
    if (!s) return "";
    if (s.exchange === "TWSE") return "TWSE 上市";
    if (s.exchange === "TPEx") return "TPEx 上櫃";
    if (s.exchange === "ESB") return "ESB 興櫃";
    return s.exchange || "";
  }

  function getSeries(stock) {
    if (!state.seriesCache.has(stock.id)) {
      state.seriesCache.set(stock.id, window.BioIndicators.computeSeries(stock.history || []));
    }
    return state.seriesCache.get(stock.id);
  }

  function getPrimaryBackerPct(stock) {
    const cb = stock.capital_backers || {};
    if (!cb.has_listed_backer || !Array.isArray(cb.investors)) return null;
    const nums = cb.investors.map((inv) => inv.pct).filter((p) => typeof p === "number");
    return nums.length ? Math.max(...nums) : 0;
  }

  function getBackerShortText(stock) {
    const cb = stock.capital_backers || {};
    if (cb.has_listed_backer && Array.isArray(cb.investors) && cb.investors.length) {
      return cb.investors
        .map((inv) => {
          const shortN = inv.name.split(" (")[0].split(" /")[0];
          const pctStr = typeof inv.pct === "number" ? `${inv.pct.toFixed(1)}%` : (inv.pct_label || "策略入股");
          return `${shortN} (${pctStr})`;
        })
        .slice(0, 2)
        .join("、");
    }
    if (cb.is_parent_investor && Array.isArray(cb.investees) && cb.investees.length) {
      const top = cb.investees.slice(0, 2).map((c) => `${c.name} ${c.pct}%`).join("、");
      return `金主母艦 → ${top}`;
    }
    if (Array.isArray(cb.investors) && cb.investors.length) {
      const inv = cb.investors[0];
      return `${inv.name.split(" /")[0]} (${typeof inv.pct === "number" ? inv.pct.toFixed(1) + "%" : "—"})`;
    }
    return "—";
  }

  function getCountryShortText(stock, countryCode) {
    const coop = stock.intl_coop || {};
    const list = (coop.partners || []).filter((p) => p.country === countryCode);
    if (!list.length) {
      const flag = countryCode === "JP" ? coop.has_jp : coop.has_us;
      return flag ? "業務覆蓋" : "—";
    }
    const p = list[0];
    return `${p.partner.split(" /")[0]} (${p.coop_type.split(" +")[0]})`;
  }

  async function loadData() {
    let payload = null;
    try {
      const resp = await fetch("./data/stocks.json?t=" + Date.now(), { cache: "no-store" });
      if (resp.ok) payload = await resp.json();
    } catch (_) {}

    if (!payload && window.__BIO_STOCKS_DATA__) {
      payload = window.__BIO_STOCKS_DATA__;
    }
    if (!payload || !Array.isArray(payload.stocks) || !payload.stocks.length) {
      throw new Error("找不到生技股票行情資料 (data/stocks.json)");
    }

    state.data = payload;
    state.stocksById = new Map(payload.stocks.map((s) => [s.id, s]));
    if (!state.stocksById.has(state.selectedId)) {
      state.selectedId = payload.stocks[0].id;
    }
  }

  function selectStock(id, switchToTerminal = false) {
    if (!state.stocksById.has(id)) return;
    state.selectedId = id;
    if (switchToTerminal) {
      switchTab("terminal");
    } else {
      renderTickerStrip();
      renderSidebar();
      renderTerminal();
    }
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === "tab-" + tabId);
    });

    if (tabId === "terminal") renderTerminal();
    if (tabId === "supply") renderSupplyTab();
    if (tabId === "financials") renderFinancialsTab();
    if (tabId === "compare") renderCompareTab();
    if (tabId === "pipeline") renderPipelineTab();
  }

  function renderHeaderMeta() {
    const el = document.getElementById("dataDateLabel");
    if (!el || !state.data) return;
    const twD = state.data.data_date_tw || "—";
    const usD = state.data.data_date_us || "—";
    const jpD = state.data.data_date_jp || "";
    let genTime = "";
    if (state.data.generated_at) {
      const m = String(state.data.generated_at).match(/T(\d{2}:\d{2})/);
      if (m) genTime = ` ｜ 更新 ${m[1]}`;
    }
    el.textContent = `台 ${twD} ｜ 美 ${usD}${jpD ? ` ｜ 日 ${jpD}` : ""}${genTime}`;
  }

  function renderTickerStrip() {
    const el = document.getElementById("tickerStrip");
    if (!el) return;
    const featuredIds = ["^NBI", "6472", "6446", "6589", "4726", "6838", "4123", "1795", "4743", "6541", "1789", "LLY", "HROW", "4568.T"];
    const items = featuredIds.map((id) => state.stocksById.get(id)).filter(Boolean);
    el.innerHTML = items
      .map((s) => {
        const active = s.id === state.selectedId ? "active" : "";
        const pct = s.latest.change_pct;
        return `
          <div class="ticker-chip ${active}" data-id="${s.id}">
            <div>
              <div class="ticker-chip-name">${s.name.split(" ")[0]}</div>
              <div class="ticker-chip-id mono">${s.id}</div>
            </div>
            <div class="ticker-chip-price mono">${fmtPrice(s.latest.close, s)}</div>
            <div class="ticker-chip-pct mono ${badgeClass(pct)}">${fmtPct(pct)}</div>
          </div>
        `;
      })
      .join("");

    el.querySelectorAll(".ticker-chip").forEach((chip) => {
      chip.addEventListener("click", () => selectStock(chip.dataset.id, true));
    });
  }

  function renderKpis() {
    const el = document.getElementById("kpiGrid");
    if (!el || !state.data) return;
    const stocks = state.data.stocks.filter((s) => !s.is_index);
    const twStocks = stocks.filter((s) => s.market === "TW");
    const nbi = state.stocksById.get("^NBI");
    const bora = state.stocksById.get("6472");

    const upCount = stocks.filter((s) => s.latest.change_pct > 0).length;
    const bullMaCount = stocks.filter((s) => s.metrics.ma20 && s.latest.close >= s.metrics.ma20).length;

    const twBackerCount = twStocks.filter((s) => s.capital_backers && s.capital_backers.has_listed_backer).length;
    const twTwseCount = twStocks.filter((s) => s.exchange === "TWSE").length;
    const twTpexCount = twStocks.filter((s) => s.exchange === "TPEx").length;
    const twEsbCount = twStocks.filter((s) => s.exchange === "ESB").length;
    const twJpCount = twStocks.filter((s) => s.intl_coop && s.intl_coop.has_jp).length;
    const twUsCount = twStocks.filter((s) => s.intl_coop && s.intl_coop.has_us).length;
    const twMouCount = twStocks.filter((s) => s.intl_coop && s.intl_coop.has_mou).length;

    el.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>保瑞 (6472) CDMO 領航</span><span class="mono">TWSE</span></div>
        <div class="kpi-value mono ${bora ? chgClass(bora.latest.change_pct) : ""}">
          ${bora ? fmtPrice(bora.latest.close, bora) + " TWD" : "—"}
        </div>
        <div class="kpi-sub">單日 <span class="mono ${bora ? chgClass(bora.latest.change_pct) : ""}">${bora ? fmtPct(bora.latest.change_pct) : "—"}</span> ｜ P/B <span class="mono">${bora?.fundamentals.pb ?? "—"}x</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><span>那斯達克生技指數 (^NBI)</span><span class="mono">US INDEX</span></div>
        <div class="kpi-value mono ${nbi ? chgClass(nbi.latest.change_pct) : ""}">
          ${nbi ? fmtPrice(nbi.latest.close, nbi) : "—"}
        </div>
        <div class="kpi-sub">單日 <span class="mono ${nbi ? chgClass(nbi.latest.change_pct) : ""}">${nbi ? fmtPct(nbi.latest.change_pct) : "—"}</span> ｜ 20日 <span class="mono ${nbi ? chgClass(nbi.metrics.ret_20d) : ""}">${nbi ? fmtPct(nbi.metrics.ret_20d) : "—"}</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><span>生技族群多空溫度計</span><span class="mono">${stocks.length} 檔個股</span></div>
        <div class="kpi-value mono">${upCount} 漲 / ${stocks.length - upCount} 跌</div>
        <div class="kpi-sub">上市 ${twTwseCount} · 上櫃 ${twTpexCount} · 興櫃 ${twEsbCount} ｜ 站MA20 <span class="mono" style="color:var(--cyan)">${bullMaCount}</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><span>台股金主轉投資與美日聯盟</span><span class="mono">${twStocks.length} 檔台股</span></div>
        <div class="kpi-value mono" style="font-size:1.15rem;color:#fde047">${twBackerCount} 檔金主入股 · ${twMouCount} 檔 MOU/合資</div>
        <div class="kpi-sub">🇯🇵 日本合作 <span class="mono" style="color:#f9a8d4">${twJpCount} 檔</span> ｜ 🇺🇸 美國合作 <span class="mono" style="color:var(--cyan)">${twUsCount} 檔</span></div>
      </div>
    `;
  }

  function renderSidebarFilters() {
    const el = document.getElementById("sidebarFilters");
    if (!el || !state.data) return;
    const pills = [
      { id: "all", label: "全部" },
      { id: "watchlist", label: "★ 自選" },
      { id: "is_twse", label: "🏛️ 上市" },
      { id: "is_tpex", label: "📈 上櫃" },
      { id: "is_esb", label: "🌱 興櫃" },
      { id: "insti_buy5", label: "🔥 法人5日買超" },
      { id: "big_holder", label: "🐋 千張大戶>=45%" },
      { id: "has_backer", label: "🏦 有金主" },
      { id: "has_jp", label: "🇯🇵 日本合作" },
      { id: "has_us", label: "🇺🇸 美國合作" },
      { id: "has_mou", label: "📝 有MOU/JV" },
      ...state.data.segments.map((s) => ({ id: s.id, label: s.label })),
    ];
    el.innerHTML = pills
      .map(
        (p) =>
          `<button class="seg-pill ${state.sidebarSegment === p.id ? "active" : ""}" data-seg="${p.id}">${p.label}</button>`
      )
      .join("");
    el.querySelectorAll(".seg-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sidebarSegment = btn.dataset.seg;
        renderSidebarFilters();
        renderSidebar();
      });
    });
  }

  function matchesFilterPill(stock, pillId) {
    if (pillId === "all") return true;
    if (pillId === "watchlist") return state.watchlist.has(stock.id);
    if (pillId === "is_twse") return stock.exchange === "TWSE";
    if (pillId === "is_tpex") return stock.exchange === "TPEx";
    if (pillId === "is_esb") return stock.exchange === "ESB";
    if (pillId === "insti_buy5") return Boolean(stock.chips && stock.chips.insti_5d && stock.chips.insti_5d.total > 0);
    if (pillId === "big_holder") return Boolean(stock.chips && stock.chips.tdcc && stock.chips.tdcc.big1000_pct >= 45);
    if (pillId === "has_backer") return Boolean(stock.capital_backers && stock.capital_backers.has_listed_backer);
    if (pillId === "has_jp") return Boolean(stock.intl_coop && stock.intl_coop.has_jp);
    if (pillId === "has_us") return Boolean(stock.intl_coop && stock.intl_coop.has_us);
    if (pillId === "has_mou") return Boolean(stock.intl_coop && stock.intl_coop.has_mou);
    return stock.segment === pillId;
  }

  function matchesSearch(stock) {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q) return true;
    const cb = stock.capital_backers || {};
    const coop = stock.intl_coop || {};
    const backerText = [
      cb.summary || "",
      ...(cb.investors || []).map((i) => `${i.name} ${i.ticker} ${i.note || ""}`),
      ...(cb.investees || []).map((i) => `${i.name} ${i.ticker} ${i.note || ""}`),
    ].join(" ");
    const coopText = [
      coop.summary || "",
      ...(coop.partners || []).map((p) => `${p.country} ${p.partner} ${p.coop_type} ${p.detail || ""}`),
    ].join(" ");

    return (
      stock.id.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q) ||
      stock.en_name.toLowerCase().includes(q) ||
      stock.segment_label.toLowerCase().includes(q) ||
      backerText.toLowerCase().includes(q) ||
      coopText.toLowerCase().includes(q)
    );
  }

  function renderSidebar() {
    const el = document.getElementById("stockSidebarList");
    if (!el || !state.data) return;

    const filtered = state.data.stocks.filter((s) => {
      if (!matchesSearch(s)) return false;
      return matchesFilterPill(s, state.sidebarSegment);
    });

    if (!filtered.length) {
      el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:0.82rem;">查無符合條件的生技標的</div>`;
      return;
    }

    const groups = new Map();
    state.data.segments.forEach((seg) => groups.set(seg.id, { label: seg.label, items: [] }));
    filtered.forEach((s) => {
      if (groups.has(s.segment)) groups.get(s.segment).items.push(s);
    });

    let html = "";
    groups.forEach((grp) => {
      if (!grp.items.length) return;
      html += `<div class="sidebar-group-title"><span>${grp.label}</span><span>${grp.items.length}</span></div>`;
      grp.items.forEach((s) => {
        const active = s.id === state.selectedId ? "active" : "";
        const starred = state.watchlist.has(s.id) ? "starred" : "";
        const chgCls = chgClass(s.latest.change_pct);
        const cb = s.capital_backers || {};
        const coop = s.intl_coop || {};
        const miniTags = [
          cb.has_listed_backer ? "🏦" : "",
          coop.has_jp ? "🇯🇵" : "",
          coop.has_us ? "🇺🇸" : "",
          coop.has_mou ? "📝" : "",
        ].filter(Boolean).join("");
        html += `
          <div class="stock-list-item ${active}" data-id="${s.id}">
            <div class="stock-item-left">
              <button class="star-btn ${starred}" data-star="${s.id}" title="加入/移除自選">★</button>
              <div style="min-width:0">
                <div class="stock-item-name">${s.name} <span style="font-size:0.72rem">${miniTags}</span></div>
                <div class="stock-item-sub mono">${s.id} · ${fmtExchLabel(s)}</div>
              </div>
            </div>
            <div class="stock-item-right">
              <div class="stock-item-price mono">${fmtPrice(s.latest.close, s)}</div>
              <div class="stock-item-chg mono ${chgCls}">${fmtPct(s.latest.change_pct)}</div>
            </div>
          </div>
        `;
      });
    });

    el.innerHTML = html;
    el.querySelectorAll(".stock-list-item").forEach((row) => {
      row.addEventListener("click", () => selectStock(row.dataset.id, false));
    });
    el.querySelectorAll("[data-star]").forEach((btn) => {
      btn.addEventListener("click", (e) => toggleWatchlist(btn.dataset.star, e));
    });
  }

  function renderCapitalBackers(stock, containerEl, badgeEl) {
    if (!containerEl) return;
    const cb = stock.capital_backers || {};
    if (badgeEl) {
      const badges = [];
      if (cb.has_listed_backer) badges.push(`<span class="bio-badge is-backer">🏦 上市櫃金主轉投資</span>`);
      if (cb.is_parent_investor) badges.push(`<span class="bio-badge is-parent">🏛️ 生技金主母艦</span>`);
      if (!cb.has_listed_backer && !cb.is_parent_investor) badges.push(`<span class="bio-badge">機構/創辦團隊持股</span>`);
      badgeEl.innerHTML = badges.join(" ");
    }

    let html = cb.summary ? `<div class="backer-summary">${escHtml(cb.summary)}</div>` : "";

    const investors = cb.investors || [];
    if (investors.length) {
      html += `<div class="backer-list">` + investors.map((inv) => {
        const pctNum = typeof inv.pct === "number" ? Math.min(100, Math.max(0, inv.pct)) : 0;
        const pctDisplay = inv.pct_label || (typeof inv.pct === "number" ? `${inv.pct}%` : "—");
        const linkedTicker = String(inv.ticker || "").split(" ")[0];
        const canJump = state.stocksById.has(linkedTicker);
        return `
          <div class="backer-item">
            <div class="backer-top">
              <div class="backer-name">
                ${escHtml(inv.name)}
                ${canJump ? `<button class="seg-pill" data-jump-id="${linkedTicker}" style="margin-left:6px;padding:1px 7px;font-size:0.68rem">跳轉 ${linkedTicker} →</button>` : ""}
              </div>
              <div class="backer-pct mono">${escHtml(pctDisplay)}</div>
            </div>
            <div class="backer-meta">
              <span class="tag-chip" style="padding:1px 7px;font-size:0.68rem">${escHtml(inv.listed_status || "")}</span>
              <span>${escHtml(inv.role || "")}</span>
              ${inv.ticker ? `<span class="mono" style="color:var(--cyan)">${escHtml(inv.ticker)}</span>` : ""}
            </div>
            ${typeof inv.pct === "number" ? `<div class="backer-bar-track"><div class="backer-bar-fill" style="width:${pctNum}%"></div></div>` : ""}
            ${inv.note ? `<div class="backer-note">${escHtml(inv.note)}</div>` : ""}
          </div>
        `;
      }).join("") + `</div>`;
    } else {
      html += `<div style="color:var(--text-dim);font-size:0.8rem">無單一上市櫃集團控制性轉投資（一般機構與市場自由流通股為主）。</div>`;
    }

    const investees = cb.investees || [];
    if (investees.length) {
      html += `
        <div style="margin-top:12px;font-size:0.78rem;font-weight:700;color:#c7d2fe">🏛️ 旗下轉投資生技子公司與持股比例：</div>
        <div class="investee-grid">
          ${investees.map((sub) => {
            const subJump = state.stocksById.has(sub.ticker);
            return `
              <button class="investee-chip" ${subJump ? `data-jump-id="${sub.ticker}"` : ""}>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:3px">
                  <strong style="font-size:0.82rem">${escHtml(sub.name)} <span class="mono" style="color:var(--cyan);font-size:0.74rem">${escHtml(sub.ticker)}</span></strong>
                  <span class="mono" style="color:#fde047;font-weight:800;font-size:0.82rem">${sub.pct}%</span>
                </div>
                <div style="font-size:0.71rem;color:var(--text-muted);line-height:1.4">${escHtml(sub.note || "")}</div>
              </button>
            `;
          }).join("")}
        </div>
      `;
    }

    containerEl.innerHTML = html;
    containerEl.querySelectorAll("[data-jump-id]").forEach((el) => {
      el.addEventListener("click", () => selectStock(el.dataset.jumpId, false));
    });
  }

  function renderIntlCoop(stock, containerEl, badgeEl) {
    if (!containerEl) return;
    const coop = stock.intl_coop || {};
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="bio-badge ${coop.has_mou ? "is-mou" : "is-none"}">${coop.has_mou ? "📝 有簽 MOU / JV" : "授權/臨床/設廠為主"}</span>`;
    }

    const statusPills = `
      <div class="coop-badges-row">
        <span class="bio-badge ${coop.has_jp ? "is-jp" : "is-none"}">🇯🇵 日本合作：${coop.has_jp ? "有" : "無重大揭露"}</span>
        <span class="bio-badge ${coop.has_us ? "is-us" : "is-none"}">🇺🇸 美國合作：${coop.has_us ? "有" : "無重大揭露"}</span>
        <span class="bio-badge ${coop.has_mou ? "is-mou" : "is-none"}">📄 備忘錄 / 合資：${coop.has_mou ? "有" : "一般商業合約"}</span>
      </div>
    `;

    const summaryHtml = coop.summary ? `<div class="backer-summary">${escHtml(coop.summary)}</div>` : "";

    const partners = coop.partners || [];
    const listHtml = partners.length
      ? `<div class="coop-list">` + partners.map((p) => {
          const isJp = p.country === "JP";
          const flag = isJp ? "🇯🇵 日本" : "🇺🇸 美國";
          return `
            <div class="coop-item ${isJp ? "jp" : "us"}">
              <div class="coop-head">
                <div class="coop-partner">${flag}｜${escHtml(p.partner)}</div>
                <span class="bio-badge ${isJp ? "is-jp" : "is-us"}" style="font-size:0.68rem">${escHtml(p.status || "")}</span>
              </div>
              <div class="coop-type">合作型態：${escHtml(p.coop_type)}</div>
              <div class="coop-detail">${escHtml(p.detail)}</div>
            </div>
          `;
        }).join("") + `</div>`
      : `<div style="color:var(--text-dim);font-size:0.8rem">此為市場基準指標或尚無特定公開美日夥伴專案。</div>`;

    containerEl.innerHTML = statusPills + summaryHtml + listHtml;
  }

  function renderTerminal() {
    const s = state.stocksById.get(state.selectedId);
    if (!s) return;

    const series = getSeries(s);
    const chg = s.latest.change;
    const pct = s.latest.change_pct;
    const cls = chgClass(pct);
    const sign = chg > 0 ? "+" : "";
    const starred = state.watchlist.has(s.id);

    const lowRange = s.metrics.low_52w ?? s.metrics.low_6m ?? s.latest.low;
    const highRange = s.metrics.high_52w ?? s.metrics.high_6m ?? s.latest.high;
    const rangeTitle = s.metrics.high_52w ? "52 週" : "近 6 月";
    const posPct = highRange > lowRange ? Math.max(2, Math.min(98, ((s.latest.close - lowRange) / (highRange - lowRange)) * 100)) : 50;
    const dist52 = s.metrics.dist_52w_high !== null && s.metrics.dist_52w_high !== undefined ? ` ｜ 距高點 ${s.metrics.dist_52w_high.toFixed(1)}%` : "";

    document.getElementById("stockHeroWrap").innerHTML = `
      <div class="stock-hero">
        <div>
          <div class="stock-hero-title">
            <h2>${s.name} <span class="mono" style="color:var(--cyan);font-size:1.2rem">${s.id}</span></h2>
            <span class="tag-chip">${s.segment_label}</span>
            <span class="tag-chip tag-exchange mono">${s.exchange} · ${s.currency}</span>
            ${s.fundamentals.earnings_date ? `<span class="tag-chip" style="background:rgba(251,191,36,0.12);border-color:rgba(251,191,36,0.3);color:#fde047">📅 財報 ${s.fundamentals.earnings_date}</span>` : ""}
            <button class="btn" id="heroStarBtn" style="padding:4px 10px;font-size:0.76rem">
              <span style="color:${starred ? "var(--amber)" : "var(--text-dim)"}">★</span> ${starred ? "已加自選" : "加入自選"}
            </button>
          </div>
          <div class="stock-tagline">${s.en_name} — ${s.tagline}</div>
        </div>
        <div class="stock-price-block">
          <div class="big-price mono ${cls}">${fmtPrice(s.latest.close, s)}</div>
          <div class="big-change mono ${cls}">
            ${chg > 0 ? "▲" : chg < 0 ? "▼" : "—"} ${sign}${fmtPrice(chg, s)} (${fmtPct(pct)})
          </div>
          <div class="price-date mono">最新交易日：${s.latest.date}</div>
        </div>
      </div>

      <div class="quote-metrics-row">
        <div class="mini-stat">
          <div class="mini-stat-label">開盤 / 昨收</div>
          <div class="mini-stat-val mono">${fmtPrice(s.latest.open, s)} / ${fmtPrice(s.latest.prev_close, s)}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">當日高低</div>
          <div class="mini-stat-val mono"><span class="up">${fmtPrice(s.latest.high, s)}</span> / <span class="down">${fmtPrice(s.latest.low, s)}</span></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">成交量</div>
          <div class="mini-stat-val mono">${fmtVol(s.latest.volume, s)}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">淨值比 P/B · 本益比 P/E</div>
          <div class="mini-stat-val mono">${s.fundamentals.pb ? s.fundamentals.pb + "x" : "—"} · ${s.fundamentals.pe ? s.fundamentals.pe + "x" : "—"}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">毛利率 / 營益率</div>
          <div class="mini-stat-val mono">${s.fundamentals.gross_margin !== null && s.fundamentals.gross_margin !== undefined ? s.fundamentals.gross_margin.toFixed(1) + "%" : "—"} / ${s.fundamentals.operating_margin !== null && s.fundamentals.operating_margin !== undefined ? s.fundamentals.operating_margin.toFixed(1) + "%" : "—"}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">殖利率 / 市值</div>
          <div class="mini-stat-val mono">${s.fundamentals.dividend_yield !== null && s.fundamentals.dividend_yield !== undefined ? s.fundamentals.dividend_yield + "%" : "—"} · ${fmtMcap(s.fundamentals.market_cap, s)}</div>
        </div>
      </div>

      <div class="range-bar-wrap">
        <span class="mono" style="font-size:0.75rem;color:var(--text-muted)">${rangeTitle}低點 <strong class="down">${fmtPrice(lowRange, s)}</strong></span>
        <div class="range-track" title="目前股價位於${rangeTitle}區間 ${posPct.toFixed(0)}% 位置">
          <div class="range-thumb" style="left:${posPct.toFixed(1)}%"></div>
        </div>
        <span class="mono" style="font-size:0.75rem;color:var(--text-muted)">${rangeTitle}高點 <strong class="up">${fmtPrice(highRange, s)}</strong>（區間 ${posPct.toFixed(0)}%${dist52}）</span>
      </div>
    `;

    document.getElementById("heroStarBtn").addEventListener("click", (e) => toggleWatchlist(s.id, e));

    // 金主轉投資 & 美日合作 MOU 雙核心卡片
    renderCapitalBackers(
      s,
      document.getElementById("capitalBackersCard"),
      document.getElementById("backerBadgeArea")
    );
    renderIntlCoop(
      s,
      document.getElementById("intlCoopCard"),
      document.getElementById("intlBadgeArea")
    );

    // 主圖與副圖渲染
    window.BioCharts.renderTerminalChart(
      document.getElementById("terminalCanvas"),
      document.getElementById("terminalHud"),
      s,
      series,
      state.chartOpts
    );

    // 技術面自動診斷
    const diagnostics = window.BioIndicators.generateDiagnostics(s, series);
    document.getElementById("signalList").innerHTML = diagnostics
      .map((sig) => {
        const icon = sig.type === "bull" ? "▲" : sig.type === "bear" ? "▼" : sig.type === "warn" ? "⚡" : "●";
        return `<div class="signal-item signal-${sig.type}"><span>${icon}</span><span>${sig.label}</span></div>`;
      })
      .join("");

    // 報酬率與風險指標卡
    const m = s.metrics;
    const fmtPp = (v) => (v !== null && v !== undefined ? `${v > 0 ? "+" : ""}${v.toFixed(1)} pp` : "—");
    const retItems = [
      { label: "近 5 日 / 20 日報酬", val: `${fmtPct(m.ret_5d)} / ${fmtPct(m.ret_20d)}`, cls: chgClass(m.ret_20d) },
      { label: "近 60 日 / YTD 報酬", val: `${fmtPct(m.ret_60d)} / ${fmtPct(m.ret_ytd)}`, cls: chgClass(m.ret_ytd) },
      { label: "2025 至今報酬", val: fmtPct(m.ret_from_2025), cls: chgClass(m.ret_from_2025) },
      { label: "相對 NBI (1M / 3M)", val: `${fmtPp(m.vs_nbi_1m)} / ${fmtPp(m.vs_nbi_3m)}`, cls: chgClass(m.vs_nbi_3m) },
      { label: "月線乖離 (MA20)", val: fmtPct(m.bias_ma20), cls: chgClass(m.bias_ma20) },
      { label: "季線乖離 (MA60)", val: fmtPct(m.bias_ma60), cls: chgClass(m.bias_ma60) },
      { label: "年線乖離 (MA200)", val: fmtPct(m.bias_ma200), cls: chgClass(m.bias_ma200) },
      { label: "20日波動率 / 6月回撤", val: `${m.volatility_20d !== null ? m.volatility_20d.toFixed(1) + "%" : "—"} / ${m.max_drawdown_6m !== null ? m.max_drawdown_6m.toFixed(1) + "%" : "—"}`, cls: "down" },
    ];
    document.getElementById("returnStatsGrid").innerHTML = retItems
      .map(
        (it) => `
        <div class="ret-box">
          <div class="ret-box-label">${it.label}</div>
          <div class="ret-box-val mono ${it.cls}">${it.val}</div>
        </div>
      `
      )
      .join("");

    renderChipsSection(s);
    renderRevenueMix(s, document.getElementById("revenueMixCard"), document.getElementById("revMixBasis"));
    renderStockNews(s, document.getElementById("stockNewsCard"));
  }

  function renderChipsSection(stock) {
    const summaryEl = document.getElementById("chipsSummaryCard");
    const badgeEl = document.getElementById("chipsBadgeArea");
    const ch = stock.chips || {};
    const fmtLots = (v) => {
      if (v === null || v === undefined || Number.isNaN(v)) return "—";
      const s = v > 0 ? "+" : "";
      return `${s}${Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 })} 張`;
    };

    if (badgeEl) {
      const tags = ch.chips_tags || [];
      badgeEl.innerHTML = tags
        .map((t) => {
          const isBull = t.includes("買") || t.includes("高集中") || t.includes("吸籌");
          const isBear = t.includes("賣") || t.includes("調節");
          const cls = isBull ? "is-backer" : isBear ? "is-jp" : "is-none";
          return `<span class="bio-badge ${cls}">${escHtml(t)}</span>`;
        })
        .join(" ");
    }

    if (summaryEl) {
      const i1 = ch.insti_1d;
      const i5 = ch.insti_5d;
      const streak = ch.insti_streak || 0;
      const streakTxt = streak > 1 ? `連買 ${streak} 日` : streak < -1 ? `連賣 ${Math.abs(streak)} 日` : "近期震盪";
      const instiMain = i5 ? fmtLots(i5.total) : "無上市櫃日報";
      const instiCls = i5 ? chgClass(i5.total) : "flat";
      const instiSub = i5
        ? `最近一日 ${i1 ? `${i1.d.slice(5)} ${fmtLots(i1.total)}` : "—"}<br>5日拆分：外 <span class="${chgClass(i5.foreign)}">${fmtLots(i5.foreign)}</span> · 投 <span class="${chgClass(i5.trust)}">${fmtLots(i5.trust)}</span>`
        : "興櫃／海外標的依集保大戶與機構持股觀察";

      const td = ch.tdcc;
      const whalePct = td && td.big1000_pct !== undefined ? td.big1000_pct : null;
      const mid400Pct = td && td.big400_pct !== undefined ? Math.max(0, +(td.big400_pct - td.big1000_pct).toFixed(2)) : 0;
      const retailPct = td && td.retail_pct !== undefined ? td.retail_pct : null;
      const otherPct = whalePct !== null && retailPct !== null ? Math.max(0, +(100 - whalePct - mid400Pct - retailPct).toFixed(2)) : 0;

      const tdccHtml = td
        ? `
          <div class="chip-box-main mono" style="color:#fde047">${whalePct.toFixed(2)}% <span style="font-size:0.74rem;color:var(--text-dim)">(千張大戶 ${td.big1000_holders} 人)</span></div>
          <div class="chip-bar-track" title="黃:千張大戶 / 藍:400~1000張 / 粉:5張以下散戶">
            <div class="chip-bar-whale" style="width:${whalePct}%"></div>
            <div class="chip-bar-mid" style="width:${mid400Pct}%"></div>
            <div style="width:${otherPct}%;background:rgba(148,163,184,0.22)"></div>
            <div class="chip-bar-retail" style="width:${retailPct}%"></div>
          </div>
          <div class="chip-box-sub">>=400張大戶 <strong class="mono">${td.big400_pct.toFixed(1)}%</strong> · 散戶(&lt;=5張) <strong class="mono">${retailPct.toFixed(1)}%</strong> · 總股東 <strong class="mono">${td.total_holders.toLocaleString()}</strong> 人 (${td.date})</div>
        `
        : `<div class="chip-box-main mono" style="color:var(--text-muted)">${ch.inst_hold_pct !== null && ch.inst_hold_pct !== undefined ? ch.inst_hold_pct.toFixed(1) + "%" : "—"}</div>
           <div class="chip-box-sub">機構持股比：${ch.inst_hold_pct !== null && ch.inst_hold_pct !== undefined ? ch.inst_hold_pct.toFixed(1) + "%" : "—"} ｜ 內部人持股：${ch.insiders_pct !== null && ch.insiders_pct !== undefined ? ch.insiders_pct.toFixed(1) + "%" : "—"}</div>`;

      const mg = ch.margin;
      const marginHtml = mg
        ? `
          <div class="chip-box-main mono">${mg.margin_bal.toLocaleString()} <span style="font-size:0.75rem" class="${chgClass(mg.margin_chg)}">(${mg.margin_chg > 0 ? "+" : ""}${mg.margin_chg} 張)</span></div>
          <div class="chip-box-sub">融券餘額 <strong class="mono">${mg.short_bal.toLocaleString()}</strong> 張 (${mg.short_chg > 0 ? "+" : ""}${mg.short_chg}) · 券資比 <strong class="mono">${mg.short_ratio.toFixed(2)}%</strong> (${mg.date})</div>
        `
        : `<div class="chip-box-main mono" style="color:var(--text-dim)">—</div>
           <div class="chip-box-sub">${stock.exchange === "ESB" ? "興櫃不開放融資融券，改以千張大戶與量價買盤追蹤" : "非台灣信用交易或暫無融資券餘額"}</div>`;

      const instHoldDisplay = ch.inst_hold_pct !== null && ch.inst_hold_pct !== undefined ? `${ch.inst_hold_pct.toFixed(2)}%` : "—";
      const upVolDisplay = ch.up_vol_ratio_20d !== null && ch.up_vol_ratio_20d !== undefined ? `${ch.up_vol_ratio_20d.toFixed(1)}%` : "—";

      summaryEl.innerHTML = `
        <div class="chips-kpi-grid">
          <div class="chip-box">
            <div class="chip-box-title"><span>三大法人近5日累計</span><span class="mono" style="color:var(--cyan)">${streakTxt}</span></div>
            <div class="chip-box-main mono ${instiCls}">${instiMain}</div>
            <div class="chip-box-sub">${instiSub}</div>
          </div>
          <div class="chip-box">
            <div class="chip-box-title"><span>集保主力千張大戶比</span><span class="mono">TDCC 週報</span></div>
            ${tdccHtml}
          </div>
          <div class="chip-box">
            <div class="chip-box-title"><span>融資餘額與增減</span><span class="mono">信用籌碼</span></div>
            ${marginHtml}
          </div>
          <div class="chip-box">
            <div class="chip-box-title"><span>外資/機構持股 · 買盤動能</span><span class="mono">20日量價</span></div>
            <div class="chip-box-main mono" style="color:var(--cyan)">${instHoldDisplay} <span style="font-size:0.74rem;color:var(--text-dim)">外資/機構</span></div>
            <div class="chip-box-sub">近20日上漲日量能佔比：<strong class="mono ${ch.up_vol_ratio_20d >= 55 ? "up" : ""}">${upVolDisplay}</strong>${ch.insiders_pct !== null && ch.insiders_pct !== undefined ? ` ｜ 內部人 ${ch.insiders_pct.toFixed(1)}%` : ""}</div>
          </div>
        </div>
      `;
    }

    if (window.BioCharts && window.BioCharts.renderInstiChart) {
      window.BioCharts.renderInstiChart(
        document.getElementById("instiCanvas"),
        document.getElementById("instiHud"),
        stock
      );
    }
  }

  function renderRevenueMix(stock, containerEl, basisEl) {
    if (!containerEl) return;
    const mix = stock.revenue_mix;
    if (basisEl) basisEl.textContent = mix && mix.basis ? mix.basis : "";
    if (!mix || !Array.isArray(mix.items) || !mix.items.length) {
      containerEl.innerHTML = `<div style="color:var(--text-dim);font-size:0.82rem;padding:10px">暫無營收結構資料</div>`;
      return;
    }

    const palette = ["#38bdf8", "#818cf8", "#fbbf24", "#f472b6", "#00d084"];
    const hasPct = mix.items.some((it) => typeof it.pct === "number");
    let barHtml = "";
    if (hasPct) {
      barHtml = `<div class="mix-bar">${mix.items
        .filter((it) => typeof it.pct === "number" && it.pct > 0)
        .map((it, idx) => `<div class="mix-seg" style="width:${it.pct}%;background:${palette[idx % palette.length]}" title="${escHtml(it.name)}: ${it.pct}%"></div>`)
        .join("")}</div>`;
    }

    const listHtml = `<div class="mix-list">${mix.items
      .map((it, idx) => {
        const color = palette[idx % palette.length];
        const rightVal = typeof it.pct === "number" ? `${it.pct}%` : (it.tag || "核心業務");
        return `
          <div class="mix-item">
            <div class="mix-item-left">
              <span class="mix-dot" style="background:${color}"></span>
              <div>
                <div class="mix-name">${escHtml(it.name)}</div>
                <div class="mix-desc">${escHtml(it.desc)}</div>
              </div>
            </div>
            <div class="mix-pct mono">${escHtml(rightVal)}</div>
          </div>
        `;
      })
      .join("")}</div>`;

    const noteHtml = mix.note ? `<div class="mix-note">📌 ${escHtml(mix.note)}</div>` : "";
    containerEl.innerHTML = barHtml + listHtml + noteHtml;
  }

  function renderStockNews(stock, containerEl) {
    if (!containerEl) return;
    const list = stock.news || [];
    if (!list.length) {
      containerEl.innerHTML = `<div style="color:var(--text-dim);font-size:0.82rem;padding:10px">目前無近期焦點新聞（待下次排程更新）</div>`;
      return;
    }
    containerEl.innerHTML = list
      .map(
        (n) => `
        <a class="news-item" href="${escHtml(n.url)}" target="_blank" rel="noopener noreferrer">
          <div class="news-title">${escHtml(n.title)}</div>
          <div class="news-meta">
            <span class="news-pub">${escHtml(n.publisher)}</span>
            <span class="mono">${escHtml(n.date || "")}</span>
          </div>
        </a>
      `
      )
      .join("");
  }

  function renderSupplyTab() {
    if (!state.data) return;

    if (window.BioAllianceGraph) {
      window.BioAllianceGraph.render(
        document.getElementById("supplyGraphWrap"),
        document.getElementById("supplyGraphInspector"),
        state.stocksById,
        (id) => selectStock(id, true)
      );
    }

    // 篩選列：含金主與美日聯盟快篩
    const filterEl = document.getElementById("tableSegmentFilters");
    const pills = [
      { id: "all", label: "全部標的" },
      { id: "is_twse", label: "🏛️ 上市 (TWSE)" },
      { id: "is_tpex", label: "📈 上櫃 (TPEx)" },
      { id: "is_esb", label: "🌱 興櫃 (ESB)" },
      { id: "insti_buy5", label: "🔥 法人5日買超" },
      { id: "big_holder", label: "🐋 千張大戶>=45%" },
      { id: "has_backer", label: "🏦 有上市櫃金主" },
      { id: "has_jp", label: "🇯🇵 有日本合作" },
      { id: "has_us", label: "🇺🇸 有美國合作" },
      { id: "has_mou", label: "📝 有MOU/JV" },
      ...state.data.segments.map((s) => ({ id: s.id, label: s.label })),
    ];
    filterEl.innerHTML = pills
      .map(
        (p) =>
          `<button class="seg-pill ${state.tableSegment === p.id ? "active" : ""}" data-tseg="${p.id}">${p.label}</button>`
      )
      .join("");
    filterEl.querySelectorAll(".seg-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tableSegment = btn.dataset.tseg;
        renderSupplyTab();
      });
    });

    renderFundamentalsTable();

    // 分類進度卡片
    const flowEl = document.getElementById("pipelineFlow");
    flowEl.innerHTML = state.data.segments
      .map((seg) => {
        const members = state.data.stocks.filter((s) => s.segment === seg.id);
        const nonIdx = members.filter((s) => !s.is_index);
        const avg1d = nonIdx.length
          ? nonIdx.reduce((a, s) => a + (s.latest.change_pct || 0), 0) / nonIdx.length
          : 0;
        const validPb = nonIdx.filter((s) => s.fundamentals.pb && s.fundamentals.pb < 30);
        const avgPb = validPb.length
          ? (validPb.reduce((a, s) => a + s.fundamentals.pb, 0) / validPb.length).toFixed(2) + "x"
          : "—";

        return `
          <div class="stage-card">
            <div class="stage-step">STAGE 0${seg.order} · ${seg.en_label}</div>
            <div class="stage-title">${seg.label}</div>
            <div class="stage-desc">${seg.description}</div>
            <div class="stage-stats">
              <span>族群均漲跌：<strong class="mono ${chgClass(avg1d)}">${fmtPct(avg1d)}</strong></span>
              <span>均 P/B：<strong class="mono">${avgPb}</strong></span>
            </div>
            <div class="stage-chips">
              ${members
                .map(
                  (s) => `
                  <button class="stage-stock-btn" data-id="${s.id}">
                    <span><strong>${s.name.split(" ")[0]}</strong> <span class="mono" style="color:var(--text-dim);font-size:0.72rem">${s.id}</span></span>
                    <span class="mono ${chgClass(s.latest.change_pct)}" style="font-weight:700">${fmtPct(s.latest.change_pct)}</span>
                  </button>
                `
                )
                .join("")}
            </div>
          </div>
        `;
      })
      .join("");

    flowEl.querySelectorAll(".stage-stock-btn").forEach((btn) => {
      btn.addEventListener("click", () => selectStock(btn.dataset.id, true));
    });

    // 估值散點圖
    window.BioCharts.renderScatterChart(
      document.getElementById("scatterCanvas"),
      document.getElementById("scatterInfo"),
      state.data.stocks,
      (id) => selectStock(id, true),
      state.scatterMode
    );
  }

  function renderFundamentalsTable() {
    const tbody = document.getElementById("fundamentalsTbody");
    if (!tbody || !state.data) return;

    const rows = state.data.stocks.filter((s) => {
      if (!matchesSearch(s)) return false;
      return matchesFilterPill(s, state.tableSegment);
    });

    const getVal = (s, key) => {
      switch (key) {
        case "id": return s.id;
        case "close": return s.latest.close;
        case "ret_1d": return s.latest.change_pct;
        case "ret_20d": return s.metrics.ret_20d;
        case "backer_pct": {
          const p = getPrimaryBackerPct(s);
          if (p !== null) return p;
          if (s.capital_backers && s.capital_backers.is_parent_investor) return 0.5;
          return -1;
        }
        case "has_jp": return (s.intl_coop && s.intl_coop.has_jp ? 2 : 0) + (s.intl_coop && s.intl_coop.has_mou ? 1 : 0);
        case "has_us": return (s.intl_coop && s.intl_coop.has_us ? 2 : 0) + (s.intl_coop && s.intl_coop.has_mou ? 1 : 0);
        case "insti_5d": return s.chips?.insti_5d?.total ?? null;
        case "big1000_pct": return s.chips?.tdcc?.big1000_pct ?? null;
        case "pb": return s.fundamentals.pb;
        case "pe": return s.fundamentals.pe;
        case "rsi14": return s.metrics.rsi14;
        default: return s.metrics.ret_20d;
      }
    };

    const { key, dir } = state.tableSort;
    rows.sort((a, b) => {
      const va = getVal(a, key);
      const vb = getVal(b, key);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string") return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return dir === "asc" ? va - vb : vb - va;
    });

    tbody.innerHTML = rows
      .map((s) => {
        const backerTxt = getBackerShortText(s);
        const jpTxt = getCountryShortText(s, "JP");
        const usTxt = getCountryShortText(s, "US");
        const hasMou = s.intl_coop && s.intl_coop.has_mou;
        const mouTag = hasMou ? ` <span class="bio-badge is-mou" style="padding:1px 5px;font-size:0.64rem">MOU</span>` : "";
        const i5v = s.chips?.insti_5d?.total;
        const i5Txt = i5v !== null && i5v !== undefined ? `${i5v > 0 ? "+" : ""}${i5v.toLocaleString("en-US", { maximumFractionDigits: 1 })}` : "—";
        const b1000 = s.chips?.tdcc?.big1000_pct;
        const b1000Txt = b1000 !== null && b1000 !== undefined ? `${b1000.toFixed(1)}%` : "—";

        return `
        <tr data-id="${s.id}">
          <td>
            <div style="font-weight:700">${s.name}</div>
            <div class="mono" style="font-size:0.72rem;color:var(--text-dim)">${s.id} · ${fmtExchLabel(s)}</div>
          </td>
          <td><span class="tag-chip">${s.segment_label}</span></td>
          <td class="mono" style="font-weight:700">${fmtPrice(s.latest.close, s)} <span style="font-size:0.7rem;color:var(--text-dim)">${s.currency}</span></td>
          <td class="mono ${chgClass(s.latest.change_pct)}" style="font-weight:700">${fmtPct(s.latest.change_pct)}</td>
          <td class="mono ${chgClass(s.metrics.ret_20d)}">${fmtPct(s.metrics.ret_20d)}</td>
          <td style="text-align:left;max-width:260px;white-space:normal;line-height:1.35;color:${s.capital_backers?.has_listed_backer ? "#fde047" : "var(--text-muted)"}">${escHtml(backerTxt)}</td>
          <td style="text-align:left;max-width:220px;white-space:normal;line-height:1.35;color:${s.intl_coop?.has_jp ? "#f9a8d4" : "var(--text-dim)"}">${escHtml(jpTxt)}${s.intl_coop?.has_jp ? mouTag : ""}</td>
          <td style="text-align:left;max-width:220px;white-space:normal;line-height:1.35;color:${s.intl_coop?.has_us ? "#7dd3fc" : "var(--text-dim)"}">${escHtml(usTxt)}${s.intl_coop?.has_us && !s.intl_coop?.has_jp ? mouTag : ""}</td>
          <td class="mono ${chgClass(i5v)}" style="font-weight:700">${i5Txt}</td>
          <td class="mono" style="color:${b1000 >= 45 ? "#fde047" : "var(--text-main)"}">${b1000Txt}</td>
          <td class="mono">${s.fundamentals.pb ? s.fundamentals.pb.toFixed(2) + "x" : "—"}</td>
          <td class="mono">${s.fundamentals.pe ? s.fundamentals.pe.toFixed(1) + "x" : "—"}</td>
          <td class="mono">${s.metrics.rsi14 !== null ? s.metrics.rsi14.toFixed(1) : "—"}</td>
        </tr>
      `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener("click", () => selectStock(tr.dataset.id, true));
    });
  }

  function fmtFinMoney(val, finCurrency) {
    if (val === null || val === undefined || Number.isNaN(val)) return "—";
    const sign = val < 0 ? "-" : "";
    const abs = Math.abs(val);
    if (finCurrency === "USD" || finCurrency === "EUR") {
      const sym = finCurrency === "EUR" ? "€" : "$";
      if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
      if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
      return `${sign}${sym}${abs.toFixed(0)}`;
    }
    const sym = finCurrency === "JPY" ? "¥" : "NT$";
    if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}兆`;
    if (abs >= 1e8) return `${sign}${sym}${(abs / 1e8).toFixed(1)}億`;
    if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
    return `${sign}${sym}${abs.toFixed(0)}`;
  }

  function renderFinancialsTab() {
    if (!state.data) return;

    const companies = state.data.stocks.filter((s) => !s.is_index);
    if (!companies.length) return;

    let active = state.stocksById.get(state.selectedId);
    if (!active || active.is_index) {
      active = companies[0];
      state.selectedId = active.id;
    }

    const selEl = document.getElementById("finStockSelector");
    if (selEl) {
      selEl.innerHTML = companies
        .map((s) => {
          const isAct = s.id === active.id ? "active" : "";
          return `<button class="compare-chip ${isAct}" data-fin-id="${s.id}"><span class="mono" style="color:var(--cyan)">${s.id}</span> ${s.name.split(" ")[0]}</button>`;
        })
        .join("");

      selEl.querySelectorAll("[data-fin-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.selectedId = btn.dataset.finId;
          renderTickerStrip();
          renderSidebar();
          renderFinancialsTab();
        });
      });
    }

    const fin = active.financials || { currency: active.currency, quarters: [] };
    const quarters = fin.quarters || [];
    const finCur = fin.currency || active.currency;
    const latestQ = quarters.length ? quarters[quarters.length - 1] : null;
    const prevQ = quarters.length >= 2 ? quarters[quarters.length - 2] : null;

    const heroEl = document.getElementById("finHeroWrap");
    if (heroEl) {
      const gmTrend = latestQ && prevQ && latestQ.gm_pct !== null && prevQ.gm_pct !== null
        ? (latestQ.gm_pct - prevQ.gm_pct)
        : null;
      const gmTrendTxt = gmTrend !== null
        ? `<span class="${gmTrend >= 0 ? "up" : "down"}" style="font-size:0.74rem">(${gmTrend >= 0 ? "+" : ""}${gmTrend.toFixed(1)} ppt vs 上季)</span>`
        : "";
      const revYoy = active.fundamentals.revenue_growth;

      heroEl.innerHTML = `
        <div class="fin-kpi-row">
          <div class="mini-stat">
            <div class="mini-stat-label">${active.name} · 最新財報季度</div>
            <div class="mini-stat-val mono" style="color:var(--cyan)">${latestQ ? `${latestQ.label} (${latestQ.d})` : "—"}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">單季營收 (${finCur})</div>
            <div class="mini-stat-val mono">${latestQ ? fmtFinMoney(latestQ.rev, finCur) : "—"} ${revYoy !== null && revYoy !== undefined ? `<span class="${chgClass(revYoy)}" style="font-size:0.74rem">(${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}% YoY)</span>` : ""}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">毛利率 (Gross Margin)</div>
            <div class="mini-stat-val mono">${latestQ && latestQ.gm_pct != null ? latestQ.gm_pct.toFixed(1) + "%" : (active.fundamentals.gross_margin != null ? active.fundamentals.gross_margin.toFixed(1) + "%" : "—")} ${gmTrendTxt}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">營業利益率 / 淨利率</div>
            <div class="mini-stat-val mono">${latestQ && latestQ.om_pct != null ? latestQ.om_pct.toFixed(1) + "%" : "—"} / ${latestQ && latestQ.nm_pct != null ? latestQ.nm_pct.toFixed(1) + "%" : "—"}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">資本支出 / 自由現金流</div>
            <div class="mini-stat-val mono">${latestQ ? fmtFinMoney(latestQ.capex, finCur) : "—"} / <span class="${latestQ && latestQ.fcf < 0 ? "up" : "down"}">${latestQ ? fmtFinMoney(latestQ.fcf, finCur) : "—"}</span></div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">金主背景 / 下次財報</div>
            <div class="mini-stat-val mono" style="font-size:0.78rem">${escHtml(getBackerShortText(active))} · ${active.fundamentals.earnings_date || "—"}</div>
          </div>
        </div>
      `;
    }

    const finMixBox = document.getElementById("finRevenueMixBox");
    if (finMixBox) {
      renderRevenueMix(active, finMixBox, null);
    }

    window.BioCharts.renderFinRevenueChart(
      document.getElementById("finRevCanvas"),
      document.getElementById("finRevHud"),
      quarters,
      finCur
    );
    window.BioCharts.renderFinMarginChart(
      document.getElementById("finMarginCanvas"),
      document.getElementById("finMarginHud"),
      quarters
    );
    window.BioCharts.renderFinCashflowChart(
      document.getElementById("finCfCanvas"),
      document.getElementById("finCfHud"),
      quarters,
      finCur
    );

    const titleEl = document.getElementById("finTableTitle");
    if (titleEl) titleEl.textContent = `📋 ${active.name} (${active.id}) 2025 至今季度財報明細`;
    const noteEl = document.getElementById("finCurrencyNote");
    if (noteEl) noteEl.textContent = `財報幣別：${finCur}（隨 GitHub Actions 定期更新並自動保留歷史季度）`;

    const qTbody = document.getElementById("finQuartersTbody");
    if (qTbody) {
      if (!quarters.length) {
        qTbody.innerHTML = `<tr><td colspan="13" style="text-align:center;color:var(--text-dim);padding:20px">尚無可用季度財報數據</td></tr>`;
      } else {
        qTbody.innerHTML = [...quarters]
          .reverse()
          .map((q) => {
            const qoqCls = chgClass(q.qoq_rev_pct);
            const fcfCls = q.fcf !== null && q.fcf !== undefined ? (q.fcf >= 0 ? "down" : "up") : "";
            return `
              <tr>
                <td class="mono" style="font-weight:700;color:var(--cyan)">${q.label}</td>
                <td class="mono">${q.d}</td>
                <td class="mono" style="font-weight:700">${fmtFinMoney(q.rev, finCur)}</td>
                <td class="mono ${qoqCls}">${fmtPct(q.qoq_rev_pct)}</td>
                <td class="mono">${fmtFinMoney(q.gp, finCur)}</td>
                <td class="mono" style="color:#fbbf24;font-weight:700">${q.gm_pct !== null && q.gm_pct !== undefined ? q.gm_pct.toFixed(1) + "%" : "—"}</td>
                <td class="mono">${fmtFinMoney(q.op, finCur)}</td>
                <td class="mono">${q.om_pct !== null && q.om_pct !== undefined ? q.om_pct.toFixed(1) + "%" : "—"}</td>
                <td class="mono">${fmtFinMoney(q.ni, finCur)}</td>
                <td class="mono">${q.eps !== null && q.eps !== undefined ? q.eps.toFixed(2) : "—"}</td>
                <td class="mono">${fmtFinMoney(q.capex, finCur)}</td>
                <td class="mono ${fcfCls}" style="font-weight:700">${fmtFinMoney(q.fcf, finCur)}</td>
                <td class="mono">${q.capex_pct !== null && q.capex_pct !== undefined ? q.capex_pct.toFixed(1) + "%" : "—"}</td>
              </tr>
            `;
          })
          .join("");
      }
    }

    const pFiltEl = document.getElementById("peerSegmentFilters");
    if (pFiltEl) {
      const pills = [{ id: "all", label: "全部市場" }, ...state.data.segments.map((s) => ({ id: s.id, label: s.label }))];
      pFiltEl.innerHTML = pills
        .map((p) => `<button class="seg-pill ${state.peerSegment === p.id ? "active" : ""}" data-pseg="${p.id}">${p.label}</button>`)
        .join("");
      pFiltEl.querySelectorAll("[data-pseg]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.peerSegment = btn.dataset.pseg;
          renderFinancialsTab();
        });
      });
    }

    renderPeerMatrixTable();
  }

  function renderPeerMatrixTable() {
    const tbody = document.getElementById("peerMatrixTbody");
    if (!tbody || !state.data) return;

    const rows = state.data.stocks.filter((s) => {
      if (s.is_index) return false;
      if (!matchesSearch(s)) return false;
      if (state.peerSegment !== "all" && s.segment !== state.peerSegment) return false;
      return true;
    });

    const getVal = (s, k) => {
      switch (k) {
        case "id": return s.id;
        case "mcap": return s.fundamentals.market_cap;
        case "pb": return s.fundamentals.pb;
        case "pe": return s.fundamentals.pe;
        case "fpe": return s.fundamentals.forward_pe;
        case "ps": return s.fundamentals.ps;
        case "gm": return s.fundamentals.gross_margin;
        case "om": return s.fundamentals.operating_margin;
        case "rev_g": return s.fundamentals.revenue_growth;
        case "vs_nbi_3m": return s.metrics.vs_nbi_3m;
        case "earnings_date": return s.fundamentals.earnings_date;
        default: return s.fundamentals.gross_margin;
      }
    };

    const { key, dir } = state.peerSort;
    rows.sort((a, b) => {
      const va = getVal(a, key);
      const vb = getVal(b, key);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string") return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return dir === "asc" ? va - vb : vb - va;
    });

    tbody.innerHTML = rows
      .map((s) => {
        const f = s.fundamentals;
        const m = s.metrics;
        const vs3 = m.vs_nbi_3m;
        const isSel = s.id === state.selectedId ? 'style="background:rgba(56,189,248,0.12)"' : "";
        return `
          <tr data-peer-id="${s.id}" ${isSel}>
            <td>
              <div style="font-weight:700">${s.name}</div>
              <div class="mono" style="font-size:0.72rem;color:var(--text-dim)">${s.id} · ${s.market}</div>
            </td>
            <td class="mono">${fmtMcap(f.market_cap, s)}</td>
            <td class="mono">${f.pb ? f.pb.toFixed(2) + "x" : "—"}</td>
            <td class="mono">${f.pe ? f.pe.toFixed(1) + "x" : "—"}</td>
            <td class="mono" style="color:var(--cyan);font-weight:700">${f.forward_pe ? f.forward_pe.toFixed(1) + "x" : "—"}</td>
            <td class="mono">${f.ps ? f.ps.toFixed(2) + "x" : "—"}</td>
            <td class="mono" style="color:#fbbf24;font-weight:700">${f.gross_margin !== null && f.gross_margin !== undefined ? f.gross_margin.toFixed(1) + "%" : "—"}</td>
            <td class="mono">${f.operating_margin !== null && f.operating_margin !== undefined ? f.operating_margin.toFixed(1) + "%" : "—"}</td>
            <td class="mono ${chgClass(f.revenue_growth)}">${f.revenue_growth !== null && f.revenue_growth !== undefined ? fmtPct(f.revenue_growth) : "—"}</td>
            <td class="mono ${chgClass(vs3)}">${vs3 !== null && vs3 !== undefined ? `${vs3 >= 0 ? "+" : ""}${vs3.toFixed(1)} pp` : "—"}</td>
            <td class="mono" style="color:#fde047">${f.earnings_date || "—"}</td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener("click", () => {
        state.selectedId = tr.dataset.peerId;
        renderTickerStrip();
        renderSidebar();
        renderFinancialsTab();
        document.getElementById("tab-financials").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderCompareTab() {
    if (!state.data) return;

    const chipsEl = document.getElementById("compareChips");
    chipsEl.innerHTML = state.data.stocks
      .map((s) => {
        const idx = state.compareIds.indexOf(s.id);
        const active = idx !== -1;
        const dotColor = active ? COMPARE_PALETTE[idx % COMPARE_PALETTE.length] : "#475569";
        return `
          <button class="compare-chip ${active ? "active" : ""}" data-cid="${s.id}">
            <span class="swatch" style="background:${dotColor}"></span>
            <span>${s.id} ${s.name.split(" ")[0]}</span>
          </button>
        `;
      })
      .join("");

    chipsEl.querySelectorAll(".compare-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.cid;
        const pos = state.compareIds.indexOf(id);
        if (pos !== -1) {
          state.compareIds.splice(pos, 1);
        } else {
          if (state.compareIds.length >= 6) state.compareIds.shift();
          state.compareIds.push(id);
        }
        renderCompareTab();
      });
    });

    const selectedStocks = state.compareIds.map((id) => state.stocksById.get(id)).filter(Boolean);
    window.BioCharts.renderCompareChart(
      document.getElementById("compareCanvas"),
      document.getElementById("compareHud"),
      selectedStocks,
      state.compareRange,
      COMPARE_PALETTE
    );

    const lbEl = document.getElementById("leaderboardGrid");
    const stocks = state.data.stocks.filter((s) => !s.is_index);
    const periods = [
      { title: "單日強弱排行 (1D)", fn: (s) => s.latest.change_pct },
      { title: "近一週排行 (5D)", fn: (s) => s.metrics.ret_5d },
      { title: "近一月排行 (20D)", fn: (s) => s.metrics.ret_20d },
      { title: "近一季排行 (60D)", fn: (s) => s.metrics.ret_60d },
    ];

    lbEl.innerHTML = periods
      .map((p) => {
        const sorted = [...stocks]
          .filter((s) => p.fn(s) !== null && p.fn(s) !== undefined)
          .sort((a, b) => p.fn(b) - p.fn(a));
        const top = sorted.slice(0, 5);
        return `
          <div class="card" style="padding:14px">
            <div style="font-size:0.86rem;font-weight:700;margin-bottom:10px;color:var(--cyan)">${p.title}</div>
            ${top
              .map((s, idx) => {
                const v = p.fn(s);
                return `
                  <div class="lb-row" data-id="${s.id}">
                    <span><strong class="mono" style="color:var(--text-dim)">#${idx + 1}</strong> ${s.name.split(" ")[0]} <span class="mono" style="color:var(--text-dim);font-size:0.72rem">${s.id}</span></span>
                    <span class="mono ${chgClass(v)}" style="font-weight:700">${fmtPct(v)}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      })
      .join("");

    lbEl.querySelectorAll(".lb-row").forEach((row) => {
      row.addEventListener("click", () => selectStock(row.dataset.id, true));
    });
  }

  function renderPipelineTab() {
    if (!state.data) return;
    const wlEl = document.getElementById("watchlistCards");
    const starredStocks = state.data.stocks.filter((s) => state.watchlist.has(s.id));

    if (!starredStocks.length) {
      wlEl.innerHTML = `<div style="color:var(--text-dim);font-size:0.85rem">尚未加入任何自選股，可在左側標的列表點擊 ★ 收藏。</div>`;
    } else {
      wlEl.innerHTML = starredStocks
        .map(
          (s) => `
          <div class="lb-row" data-id="${s.id}" style="padding:10px 12px">
            <div>
              <strong>${s.name}</strong> <span class="mono" style="color:var(--cyan);font-size:0.76rem">${s.id}</span>
              <div style="font-size:0.72rem;color:var(--text-dim)">${s.segment_label} ｜ 金主：${escHtml(getBackerShortText(s))}</div>
            </div>
            <div style="text-align:right">
              <div class="mono" style="font-weight:700">${fmtPrice(s.latest.close, s)} ${s.currency}</div>
              <div class="mono ${chgClass(s.latest.change_pct)}" style="font-size:0.76rem;font-weight:700">${fmtPct(s.latest.change_pct)}</div>
            </div>
          </div>
        `
        )
        .join("");

      wlEl.querySelectorAll(".lb-row").forEach((row) => {
        row.addEventListener("click", () => selectStock(row.dataset.id, true));
      });
    }

    const statusEl = document.getElementById("updateStatusBox");
    if (statusEl) {
      const genText = state.data.generated_at ? state.data.generated_at.replace("T", " ").slice(0, 19) : "—";
      statusEl.innerHTML = `
        <div><strong>上次排程產生時間：</strong><span class="mono" style="color:var(--cyan)">${genText} (UTC+8)</span></div>
        <div style="margin-top:4px;color:var(--text-muted)">
          台股：<span class="mono">${state.data.data_date_tw || "—"}</span> ｜ 美股：<span class="mono">${state.data.data_date_us || "—"}</span> ｜ 日股：<span class="mono">${state.data.data_date_jp || "—"}</span> ｜ 追蹤標的：<span class="mono">${state.data.stocks.length} 檔</span>
        </div>
      `;
    }

    const cfgEl = document.getElementById("configPreview");
    const summaryList = state.data.stocks
      .map((s) => {
        const flags = [
          s.capital_backers?.has_listed_backer ? "[金主]" : "",
          s.intl_coop?.has_jp ? "[日]" : "",
          s.intl_coop?.has_us ? "[美]" : "",
          s.intl_coop?.has_mou ? "[MOU]" : "",
        ].filter(Boolean).join("");
        return `${s.id.padEnd(7, " ")} | ${s.name.padEnd(8, " ")} | ${flags.padEnd(16, " ")} | ${getBackerShortText(s)}`;
      })
      .join("\n");
    cfgEl.textContent = summaryList;
  }

  function exportCsv() {
    if (!state.data) return;
    const headers = [
      "代號", "名稱", "英文名", "市場", "交易所", "產業定位", "幣別",
      "上市櫃金主轉投資與比例", "日本合作(MOU)", "美國合作(MOU)", "是否有簽MOU/合資",
      "最新日期", "收盤價", "單日漲跌幅(%)", "20日報酬(%)", "60日報酬(%)", "2025至今(%)",
      "淨值比(PB)", "本益比(PE)", "殖利率(%)", "毛利率(%)", "營益率(%)",
      "MA20", "MA60", "MA200", "RSI(14)", "相對NBI 3M(pp)",
      "三大法人1日(張)", "三大法人5日(張)", "外資或機構持股(%)", "千張大戶(%)", "400張大戶(%)", "融資餘額(張)", "融券餘額(張)", "下次財報日"
    ];
    const esc = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = state.data.stocks.map((s) => [
      s.id, s.name, s.en_name, s.market, s.exchange, s.segment_label, s.currency,
      getBackerShortText(s),
      getCountryShortText(s, "JP"),
      getCountryShortText(s, "US"),
      s.intl_coop?.has_mou ? "是" : "否",
      s.latest.date, s.latest.close, s.latest.change_pct,
      s.metrics.ret_20d, s.metrics.ret_60d, s.metrics.ret_from_2025,
      s.fundamentals.pb, s.fundamentals.pe, s.fundamentals.dividend_yield,
      s.fundamentals.gross_margin, s.fundamentals.operating_margin,
      s.metrics.ma20, s.metrics.ma60, s.metrics.ma200, s.metrics.rsi14, s.metrics.vs_nbi_3m,
      s.chips?.insti_1d?.total, s.chips?.insti_5d?.total, s.chips?.inst_hold_pct,
      s.chips?.tdcc?.big1000_pct, s.chips?.tdcc?.big400_pct,
      s.chips?.margin?.margin_bal, s.chips?.margin?.short_bal,
      s.fundamentals.earnings_date
    ].map(esc).join(","));

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biotech_stocks_alliance_${state.data.data_date_tw || "latest"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    const searchInput = document.getElementById("globalSearch");
    searchInput.addEventListener("input", () => {
      state.searchQuery = searchInput.value;
      renderSidebar();
      if (state.activeTab === "supply") renderFundamentalsTable();
      if (state.activeTab === "financials") renderPeerMatrixTable();
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && state.data) {
        const hit = state.data.stocks.find((s) => matchesSearch(s));
        if (hit) selectStock(hit.id, true);
      }
    });

    document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);

    const handleRefresh = async (btn) => {
      if (!btn) return;
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "更新中...";
      try {
        state.seriesCache.clear();
        await loadData();
        renderAll();
        btn.textContent = "✓ 已同步最新";
      } catch (_) {
        btn.textContent = "載入失敗";
      } finally {
        setTimeout(() => {
          btn.textContent = origText;
          btn.disabled = false;
        }, 1600);
      }
    };
    const refreshBtn = document.getElementById("refreshDataBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", () => handleRefresh(refreshBtn));
    const pipeRefreshBtn = document.getElementById("pipelineRefreshBtn");
    if (pipeRefreshBtn) pipeRefreshBtn.addEventListener("click", () => handleRefresh(pipeRefreshBtn));

    document.querySelectorAll(".chart-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chartOpts.mode = btn.dataset.mode;
        document.querySelectorAll(".chart-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderTerminal();
      });
    });

    document.querySelectorAll(".chart-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chartOpts.range = btn.dataset.range;
        document.querySelectorAll(".chart-range-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderTerminal();
      });
    });

    document.querySelectorAll(".sub-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chartOpts.subType = btn.dataset.sub;
        document.querySelectorAll(".sub-type-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderTerminal();
      });
    });

    document.querySelectorAll(".scatter-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.scatterMode = btn.dataset.smode;
        document.querySelectorAll(".scatter-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
        window.BioCharts.renderScatterChart(
          document.getElementById("scatterCanvas"),
          document.getElementById("scatterInfo"),
          state.data.stocks,
          (id) => selectStock(id, true),
          state.scatterMode
        );
      });
    });

    const bindChk = (id, prop) => {
      const el = document.getElementById(id);
      el.checked = state.chartOpts[prop];
      el.parentElement.classList.toggle("checked", el.checked);
      el.addEventListener("change", () => {
        state.chartOpts[prop] = el.checked;
        el.parentElement.classList.toggle("checked", el.checked);
        renderTerminal();
      });
    };
    bindChk("chkMa5", "showMa5");
    bindChk("chkMa20", "showMa20");
    bindChk("chkMa60", "showMa60");
    bindChk("chkMa200", "showMa200");
    bindChk("chkBB", "showBB");

    document.querySelectorAll("#peerMatrixTable th[data-psort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.psort;
        if (state.peerSort.key === k) {
          state.peerSort.dir = state.peerSort.dir === "desc" ? "asc" : "desc";
        } else {
          state.peerSort.key = k;
          state.peerSort.dir = k === "id" || k === "earnings_date" ? "asc" : "desc";
        }
        renderPeerMatrixTable();
      });
    });

    document.querySelectorAll("#fundamentalsTable th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (state.tableSort.key === k) {
          state.tableSort.dir = state.tableSort.dir === "desc" ? "asc" : "desc";
        } else {
          state.tableSort.key = k;
          state.tableSort.dir = k === "id" ? "asc" : "desc";
        }
        renderFundamentalsTable();
      });
    });

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const map = {
          cdmo_all: ["6472", "6589", "4726", "6541", "4746", "4142"],
          tpex_all: ["4726", "4123", "4116", "4129", "4120", "6469"],
          esb_all: ["6696", "7729", "7754", "6634", "6572", "6876"],
          backers: ["4123", "4746", "4105", "4128", "6901"],
          new_drug: ["6446", "6838", "4162", "4743", "6535", "1795"],
          jp_alliance: ["4726", "6589", "6733", "6499", "1760", "4162"],
          us_alliance: ["6472", "6446", "6838", "6598", "1795", "4142"],
          global_bio: ["^NBI", "LLY", "REGN", "HROW", "4568.T", "4502.T"],
        };
        state.compareIds = (map[btn.dataset.preset] || ["6472", "6446"]).filter((id) => state.stocksById.has(id));
        renderCompareTab();
      });
    });

    document.querySelectorAll(".cmp-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.compareRange = btn.dataset.range;
        document.querySelectorAll(".cmp-range-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderCompareTab();
      });
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.activeTab === "terminal") renderTerminal();
        if (state.activeTab === "supply") renderSupplyTab();
        if (state.activeTab === "financials") renderFinancialsTab();
        if (state.activeTab === "compare") renderCompareTab();
      }, 140);
    });
  }

  function renderAll() {
    renderHeaderMeta();
    renderTickerStrip();
    renderKpis();
    renderSidebarFilters();
    renderSidebar();
    if (state.activeTab === "terminal") renderTerminal();
    if (state.activeTab === "supply") renderSupplyTab();
    if (state.activeTab === "financials") renderFinancialsTab();
    if (state.activeTab === "compare") renderCompareTab();
    if (state.activeTab === "pipeline") renderPipelineTab();
  }

  async function init() {
    loadWatchlist();
    bindEvents();
    try {
      await loadData();
      const hashTab = window.location.hash.replace("#", "").trim();
      if (["terminal", "supply", "financials", "compare", "pipeline"].includes(hashTab)) {
        switchTab(hashTab);
      }
      renderAll();
    } catch (err) {
      document.getElementById("stockHeroWrap").innerHTML = `
        <div style="padding:24px;color:var(--up);font-weight:700">
          資料載入失敗：${err.message}
        </div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
