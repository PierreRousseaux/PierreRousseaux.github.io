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

  /* ------------------------------------------------ product explorer -- */
  function initExplorer(rootId, data) {
    var root = document.getElementById(rootId);
    if (!root) return;
    var searchInput = root.querySelector('input[type="search"]');
    var tierChips = root.querySelectorAll(".explorer-controls .chip");
    var tbody = root.querySelector("tbody");
    var countEl = root.querySelector(".prod-count");
    var state = { q: "", tier: "0", sortKey: "hhi", sortDir: -1 };

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
      tbody.innerHTML = rows.slice(0, 120).map(function (d) {
        return "<tr>" +
          "<td>" + d.code + "</td>" +
          '<td class="prod-desc">' + d.desc + "</td>" +
          "<td>" + tierLabel(d.tier) + "</td>" +
          "<td>" + (d.hhi !== null ? d.hhi.toFixed(2) : "—") + "</td>" +
          "<td>" + (d.upstream !== null ? d.upstream.toFixed(2) : "—") + "</td>" +
          "<td>" + (d.top || "—") + "</td>" +
          "</tr>";
      }).join("");
      countEl.textContent = "Showing " + Math.min(rows.length, 120) + " of " + rows.length + " matching products (of " + data.length + " total in the EC-list universe).";
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
  }

  window.TradeSite = {
    PALETTE: PALETTE,
    initTabs: initTabs,
    initAccordion: initAccordion,
    initFunnel: initFunnel,
    initChipGroup: initChipGroup,
    lineChart: lineChart,
    barChart: barChart,
    initExplorer: initExplorer
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTabs(document);
    initAccordion(document);
    initFunnel(document);
  });
})();
