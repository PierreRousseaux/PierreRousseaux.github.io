/* Trade Dependencies — shared interactivity
   Generic widgets (tabs, accordion, funnel) + Chart.js builders + product explorer.
   No build step: plain ES6, loaded directly by each trade-*.html page. */

(function () {
  "use strict";

  var PALETTE = {
    ec: "#9aa7b5",
    absorption: "#a4303f",
    mr: "#0b5394",
    accent: "#0b5394",
    accent2: "#2e7d46"
  };

  /* ---------------------------------------------------------- tabs ---- */
  function initTabs(root) {
    root.querySelectorAll(".tabs").forEach(function (tabs) {
      var group = tabs.getAttribute("data-group");
      var panels = root.querySelectorAll('.tab-panel[data-group="' + group + '"]');
      tabs.querySelectorAll(".tab-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          tabs.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          var target = btn.getAttribute("data-tab");
          panels.forEach(function (p) {
            p.classList.toggle("active", p.getAttribute("data-tab") === target);
          });
        });
      });
    });
  }

  /* ----------------------------------------------------- accordion ---- */
  function initAccordion(root) {
    root.querySelectorAll(".accordion-head").forEach(function (head) {
      head.addEventListener("click", function () {
        head.parentElement.classList.toggle("open");
      });
    });
  }

  /* --------------------------------------------------------- funnel --- */
  function initFunnel(root) {
    root.querySelectorAll(".funnel").forEach(function (funnel) {
      var detailBox = funnel.parentElement.querySelector(".funnel-detail");
      var steps = funnel.querySelectorAll(".funnel-step");
      steps.forEach(function (step, i) {
        step.addEventListener("click", function () {
          steps.forEach(function (s) { s.classList.remove("active"); });
          step.classList.add("active");
          if (detailBox) {
            var txt = step.getAttribute("data-detail");
            if (txt) detailBox.innerHTML = txt;
          }
        });
      });
      if (steps.length && detailBox) steps[0].click();
    });
  }

  /* ------------------------------------------------ period toggle ----- */
  // Generic pill toggle; calls cb(value) on change. Returns a setter to sync other
  // toggles on the same page (e.g. the explorer's own period chips) without looping.
  function initPeriodToggle(container, cb) {
    var btns = container.querySelectorAll(".period-btn");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        cb(b.getAttribute("data-period"));
      });
    });
    return {
      set: function (period) {
        btns.forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-period") === period); });
      }
    };
  }

  /* ------------------------------------------------- chip toggles ----- */
  // Generic single-select chip group; calls cb(value) on change.
  function initChipGroup(container, cb) {
    var chips = container.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        cb(chip.getAttribute("data-value"));
      });
    });
  }

  /* --------------------------------------------------- chart utils ---- */
  function lineChart(ctx, labels, datasets, opts) {
    return new Chart(ctx, {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } },
          tooltip: { backgroundColor: "#12233d", padding: 10, titleFont: { size: 12 }, bodyFont: { size: 12 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: "#eef1f4" }, ticks: { font: { size: 11 } } }
        }
      }, opts || {})
    });
  }

  function barChart(ctx, labels, datasets, opts) {
    return new Chart(ctx, {
      type: "bar",
      data: { labels: labels, datasets: datasets },
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } },
          tooltip: { backgroundColor: "#12233d", padding: 10 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10.5 }, autoSkip: false, maxRotation: 40, minRotation: 0 } },
          y: { beginAtZero: true, grid: { color: "#eef1f4" }, ticks: { font: { size: 11 } } }
        }
      }, opts || {})
    });
  }

  /* ---------------------------------------------------- density chart - */
  // buckets: {labels:[...], EC:[%...], Absorption:[%...], MR:[%...]} — % of each
  // tier's own product list falling in that bucket, so shapes are comparable.
  function densityChart(ctx, buckets, xTitle) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: buckets.labels,
        datasets: [
          { label: "EC (3 criteria)", data: buckets.EC, borderColor: PALETTE.mr, backgroundColor: PALETTE.mr + "22", fill: true, tension: .35, pointRadius: 2 },
          { label: "+ Absorption", data: buckets.Absorption, borderColor: PALETTE.absorption, backgroundColor: PALETTE.absorption + "22", fill: true, tension: .35, pointRadius: 2 },
          { label: "Full 5-criteria (MR)", data: buckets.MR, borderColor: PALETTE.accent2, backgroundColor: PALETTE.accent2 + "33", fill: true, tension: .35, pointRadius: 2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } },
          tooltip: {
            backgroundColor: "#12233d", padding: 10,
            callbacks: { label: function (item) { return item.dataset.label + ": " + item.formattedValue + "% of that list"; } }
          }
        },
        scales: {
          x: { title: { display: true, text: xTitle }, grid: { display: false }, ticks: { font: { size: 10.5 } } },
          y: { title: { display: true, text: "% of products in that list" }, beginAtZero: true, grid: { color: "#eef1f4" }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  /* ------------------------------------------ upstream x HHI scatter -- */
  // points: [{x:upstreamness, y:hhi, tier:1|2|3, code, desc, top, share_est}]
  // Colour convention (as requested): tier 1 (EC only) = blue, tier 2 (+Absorption,
  // not MR) = red, tier 3 (full 5-criteria / MR) = green.
  function hhiScatterChart(ctx, points) {
    var tierColor = { 1: PALETTE.mr, 2: PALETTE.absorption, 3: PALETTE.accent2 };
    var tierLabel = { 1: "EC only (blue)", 2: "+ Absorption, not MR (red)", 3: "Full 5-criteria / MR (green)" };
    var byTier = { 1: [], 2: [], 3: [] };
    points.forEach(function (p) {
      if (p.x === null || p.x === undefined) return;
      byTier[p.tier].push(p);
    });
    var datasets = [1, 2, 3].map(function (t) {
      return {
        label: tierLabel[t],
        data: byTier[t],
        backgroundColor: tierColor[t],
        borderColor: tierColor[t],
        pointRadius: t === 3 ? 5 : 3.5,
        pointHoverRadius: t === 3 ? 7 : 5.5
      };
    });
    return new Chart(ctx, {
      type: "scatter",
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11.5 } } },
          tooltip: {
            backgroundColor: "#12233d",
            padding: 10,
            titleFont: { size: 12.5 },
            bodyFont: { size: 12 },
            callbacks: {
              title: function (items) {
                var p = items[0].raw;
                return p.code + " — " + p.desc;
              },
              label: function (item) {
                var p = item.raw;
                return [
                  "HHI (concentration): " + p.y.toFixed(2),
                  "Upstreamness: " + p.x.toFixed(2),
                  "Top supplier: " + p.top,
                  "Top supplier share: ≤ " + p.share_est.toFixed(0) + "% (estimated upper bound from HHI, not an exact figure)"
                ];
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Upstreamness (distance from final demand)" }, grid: { color: "#eef1f4" }, ticks: { font: { size: 11 } } },
          y: { title: { display: true, text: "HHI (import concentration)" }, min: 0, max: 1, grid: { color: "#eef1f4" }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  /* ------------------------------------------------ product explorer -- */
  // products: [{x:upstream, y:hhi, tier, code, desc, top, share_est}]
  // Returns a controller with setData(newProducts) so a period toggle can refresh
  // the table in place without rebinding search/sort/filter listeners twice.
  function initExplorer(rootId, products, opts) {
    var root = document.getElementById(rootId);
    if (!root) return null;
    var limit = (opts && opts.limit) || 20;
    var searchInput = root.querySelector('input[type="search"]');
    var tierChips = root.querySelectorAll(".explorer-controls .chip");
    var tbody = root.querySelector("tbody");
    var countEl = root.querySelector(".prod-count");
    var data = products;
    var state = { q: "", tier: "0", sortKey: "y", sortDir: -1 };

    function tierLabel(t) {
      return t === 3 ? '<span class="tier-badge t3">MR · full 5</span>'
           : t === 2 ? '<span class="tier-badge t2">+ absorption</span>'
           : '<span class="tier-badge t1">EC only</span>';
    }

    function render() {
      var rows = data.filter(function (d) {
        if (state.tier !== "0" && String(d.tier) !== state.tier) return false;
        if (state.q && d.desc.toLowerCase().indexOf(state.q) === -1 && d.code.indexOf(state.q) === -1 && (d.top || "").toLowerCase().indexOf(state.q) === -1) return false;
        return true;
      });
      rows.sort(function (a, b) {
        var av = a[state.sortKey], bv = b[state.sortKey];
        if (av === null || av === undefined) av = -Infinity;
        if (bv === null || bv === undefined) bv = -Infinity;
        if (av < bv) return -1 * state.sortDir;
        if (av > bv) return 1 * state.sortDir;
        return 0;
      });
      tbody.innerHTML = rows.slice(0, limit).map(function (d) {
        return "<tr>" +
          "<td>" + d.code + "</td>" +
          '<td class="prod-desc">' + d.desc + "</td>" +
          "<td>" + tierLabel(d.tier) + "</td>" +
          "<td>" + (d.y !== null ? d.y.toFixed(2) : "—") + "</td>" +
          "<td>" + (d.x !== null ? d.x.toFixed(2) : "—") + "</td>" +
          "<td>" + (d.top || "—") + "</td>" +
          "</tr>";
      }).join("");
      countEl.textContent = "Showing " + Math.min(rows.length, limit) + " of " + rows.length + " matching products (" + data.length + " total for this period). Need the full list? Email pierre.rousseaux@ensae.fr.";
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.q = searchInput.value.trim().toLowerCase();
        render();
      });
    }
    tierChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        tierChips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        state.tier = chip.getAttribute("data-value");
        render();
      });
    });
    root.querySelectorAll("table.prod-table th[data-key]").forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.getAttribute("data-key");
        if (state.sortKey === key) { state.sortDir *= -1; } else { state.sortKey = key; state.sortDir = -1; }
        render();
      });
    });
    render();

    return {
      setData: function (newProducts) {
        data = newProducts;
        render();
      }
    };
  }

  window.TradeSite = {
    PALETTE: PALETTE,
    initTabs: initTabs,
    initAccordion: initAccordion,
    initFunnel: initFunnel,
    initChipGroup: initChipGroup,
    lineChart: lineChart,
    barChart: barChart,
    densityChart: densityChart,
    hhiScatterChart: hhiScatterChart,
    initPeriodToggle: initPeriodToggle,
    initExplorer: initExplorer
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTabs(document);
    initAccordion(document);
    initFunnel(document);
  });
})();
