const state = {
  year: 2026,
  days: [],
  currentMonthPageIndex: 0,
  showWeekdayChip: true,
  trainingFilter: {
    mode: "all",
    intervalStartDay: null,
    intervalN: 2,
    weeklyDays: [1, 3, 5],
  },
  bodyParts: [
    { name: "肩", exercises: ["侧举", "平举"] },
    { name: "胸", exercises: ["卧推", "上斜推举"] },
    { name: "背", exercises: ["高位下拉", "划船"] },
  ],
  selectedPartIndex: 0,
  records: {},
  activePlotSeries: [],
  chartStyle: {
    fontSize: 18,
    chartWidth: 1100,
    chartHeight: 350,
    lineWidth: 3,
    dash: "solid",
    pointStyle: "circle",
    pointSize: 5,
    opacity: 1,
  },
  plotPicker: {
    partIndex: null,
    selectedExercises: [],
  },
  legendFontCustomized: false,
  colorMaps: {
    vidvid: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#17becf"],
    set3: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462"],
    twilight: ["#e2d9e2", "#b2abd2", "#8073ac", "#5e3c99", "#2f1e5f", "#1c1135"],
    paired: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"],
  },
  selectedColorMap: "set3",
  legendPosition: { top: 14, right: 14 },
  legendFontSize: 16,
};

let chart = null;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function resolveFontFamilyUI() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const latin = (cs.getPropertyValue('--font-latin') || '').trim();
    const cjk = (cs.getPropertyValue('--font-cjk') || '').trim();
    // If variables are declared using var() tokens, fall back to a safe default
    if (!latin && !cjk) {
      return '"Avenir Next", "Helvetica Neue", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    }
    const combined = [latin, cjk].filter(Boolean).join(', ');
    return combined;
  } catch (e) {
    return '"Avenir Next", "Helvetica Neue", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  }
}

let FONT_FAMILY_UI = resolveFontFamilyUI();

const PLOT_COLORS = ["#c84f2f", "#176b87", "#6ea749", "#8d5da8", "#e08b2d", "#4775bf"];
const STORAGE_KEY = "fitness-tracker-state-v2";
const ALLOWED_COLORMAP_IDS = ["vidvid", "set3", "twilight", "paired"];

const els = {
  yearInput: document.getElementById("yearInput"),
  importCalendarBtn: document.getElementById("importCalendarBtn"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  monthPageLabel: document.getElementById("monthPageLabel"),
  trainingModeSelect: document.getElementById("trainingModeSelect"),
  intervalTrainingControls: document.getElementById("intervalTrainingControls"),
  intervalStartDaySelect: document.getElementById("intervalStartDaySelect"),
  intervalNInput: document.getElementById("intervalNInput"),
  weeklyTrainingControls: document.getElementById("weeklyTrainingControls"),
  weeklyDayChecks: document.querySelectorAll(".weekly-day-checkbox"),
  newPartInput: document.getElementById("newPartInput"),
  addPartBtn: document.getElementById("addPartBtn"),
  partList: document.getElementById("partList"),
  exerciseHint: document.getElementById("exerciseHint"),
  newExerciseInput: document.getElementById("newExerciseInput"),
  addExerciseBtn: document.getElementById("addExerciseBtn"),
  exerciseList: document.getElementById("exerciseList"),
  tableContainer: document.getElementById("tableContainer"),
  chartMeta: document.getElementById("chartMeta"),
  plotPartSelect: document.getElementById("plotPartSelect"),
  plotExerciseSelector: document.getElementById("plotExerciseSelector"),
  plotSelectedBtn: document.getElementById("plotSelectedBtn"),
  trendChart: document.getElementById("trendChart"),
  lineWidthInput: document.getElementById("lineWidthInput"),
  lineDashInput: document.getElementById("lineDashInput"),
  pointStyleInput: document.getElementById("pointStyleInput"),
  pointSizeInput: document.getElementById("pointSizeInput"),
  opacityInput: document.getElementById("opacityInput"),
  globalFontSizeInput: document.getElementById("globalFontSizeInput"),
  chartWidthInput: document.getElementById("chartWidthInput"),
  chartHeightInput: document.getElementById("chartHeightInput"),
  colormapSelect: document.getElementById("colormapSelect"),
  customColormapBlock: document.getElementById("customColormapBlock"),
  customColorInputs: document.getElementById("customColorInputs"),
  addColorBoxBtn: document.getElementById("addColorBoxBtn"),
  removeColorBoxBtn: document.getElementById("removeColorBoxBtn"),
  saveColormapBtn: document.getElementById("saveColormapBtn"),
  exportFormatSelect: document.getElementById("exportFormatSelect"),
  exportChartBtn: document.getElementById("exportChartBtn"),
  clearAllChartBtn: document.getElementById("clearAllChartBtn"),
  chartLegendOverlay: document.getElementById("chartLegendOverlay"),
  chartWrap: document.querySelector(".chart-wrap"),
  legendSizePopup: document.getElementById("legendSizePopup"),
  legendSizeInput: document.getElementById("legendSizeInput"),
  legendAutoBtn: document.getElementById("legendAutoBtn"),
  legendSizeApplyBtn: document.getElementById("legendSizeApplyBtn"),
};

state.legendAuto = true;

function ensureColormapOption(id) {
  if (!els.colormapSelect || !id) return;
  if (!ALLOWED_COLORMAP_IDS.includes(id)) return;
  const exists = Array.from(els.colormapSelect.options).some((opt) => opt.value === id);
  if (exists) return;
  const option = document.createElement("option");
  option.value = id;
  option.textContent = id;
  els.colormapSelect.appendChild(option);
}

function updateCustomColormapVisibility() {
  if (!els.customColormapBlock || !els.colormapSelect) return;
  els.customColormapBlock.hidden = els.colormapSelect.value !== "custom";
}

function snapshotState() {
  return {
    year: state.year,
    currentMonthPageIndex: state.currentMonthPageIndex,
    trainingFilter: state.trainingFilter,
    bodyParts: state.bodyParts,
    selectedPartIndex: state.selectedPartIndex,
    records: state.records,
    activePlotSeries: state.activePlotSeries.map((s) => ({ part: s.part, exercise: s.exercise, color: s.color })),
    chartStyle: state.chartStyle,
    colorMaps: state.colorMaps,
    selectedColorMap: state.selectedColorMap,
    legendPosition: state.legendPosition,
    legendFontSize: state.legendFontSize,
    legendFontCustomized: state.legendFontCustomized,
    legendAuto: state.legendAuto,
    plotPicker: state.plotPicker,
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshotState()));
  } catch (_err) {
    // Ignore storage failures (private mode/full quota).
  }
}

function restoreActivePlotSeries(items) {
  if (!Array.isArray(items)) {
    state.activePlotSeries = [];
    return;
  }
  const restored = [];
  items.forEach((item, idx) => {
    if (!item || !item.part || !item.exercise) return;
    const seed = item.color || PLOT_COLORS[idx % PLOT_COLORS.length];
    const series = getSeries(item.part, item.exercise, seed);
    if (!series) return;
    series.color = seed;
    restored.push(series);
  });
  state.activePlotSeries = restored;
}

function applyLoadedState(data) {
  if (!data || typeof data !== "object") return false;

  if (Number.isFinite(Number(data.year))) state.year = Number(data.year);
  const legacyStartMonth = Number.isFinite(Number(data.startMonth))
    ? Math.max(1, Math.min(12, Number(data.startMonth)))
    : null;
  const legacyDayOffset = legacyStartMonth
    ? Math.floor((new Date(state.year, legacyStartMonth - 1, 1) - new Date(state.year, 0, 1)) / 86400000)
    : 0;

  if (Number.isFinite(Number(data.currentMonthPageIndex))) {
    const rawIndex = Math.max(0, Number(data.currentMonthPageIndex));
    state.currentMonthPageIndex = legacyStartMonth ? rawIndex + (legacyStartMonth - 1) : rawIndex;
  }

  if (data.trainingFilter && typeof data.trainingFilter === "object") {
    state.trainingFilter.mode = ["all", "interval", "weekly"].includes(data.trainingFilter.mode)
      ? data.trainingFilter.mode
      : "all";
    state.trainingFilter.intervalStartDay = Number.isFinite(Number(data.trainingFilter.intervalStartDay))
      ? Number(data.trainingFilter.intervalStartDay)
      : null;
    state.trainingFilter.intervalN = Math.max(1, Math.min(14, Number(data.trainingFilter.intervalN) || 2));
    state.trainingFilter.weeklyDays = Array.isArray(data.trainingFilter.weeklyDays)
      ? data.trainingFilter.weeklyDays.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v >= 0 && v <= 6)
      : [1, 3, 5];
  }

  if (Array.isArray(data.bodyParts) && data.bodyParts.length > 0) {
    const parts = data.bodyParts
      .map((part) => {
        const name = String(part?.name || "").trim();
        const rawExercises = Array.isArray(part?.exercises) ? part.exercises : [];
        const exercises = rawExercises.map((e) => String(e || "").trim()).filter(Boolean);
        if (!name) return null;
        return { name, exercises: exercises.length ? exercises : ["新动作"] };
      })
      .filter(Boolean);
    if (parts.length > 0) state.bodyParts = parts;
  }

  if (Number.isFinite(Number(data.selectedPartIndex))) {
    state.selectedPartIndex = Math.max(0, Math.min(state.bodyParts.length - 1, Number(data.selectedPartIndex)));
  }

  if (data.records && typeof data.records === "object") {
    const cleaned = {};
    Object.entries(data.records).forEach(([k, v]) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;

      if (legacyStartMonth && legacyDayOffset > 0) {
        const lastSep = k.lastIndexOf("|");
        const secondLastSep = k.lastIndexOf("|", lastSep - 1);
        if (lastSep > -1 && secondLastSep > -1) {
          const part = k.slice(0, secondLastSep);
          const exercise = k.slice(secondLastSep + 1, lastSep);
          const dayIndex = Number(k.slice(lastSep + 1));
          if (Number.isInteger(dayIndex)) {
            const shifted = dayIndex + legacyDayOffset;
            if (shifted >= 0) {
              cleaned[keyForRecord(part, exercise, shifted)] = n;
              return;
            }
          }
        }
      }

      cleaned[k] = n;
    });
    state.records = cleaned;
  }

  if (data.chartStyle && typeof data.chartStyle === "object") {
    state.chartStyle = {
      ...state.chartStyle,
      ...data.chartStyle,
    };
  }

  if (data.colorMaps && typeof data.colorMaps === "object") {
    const mapPaletteKey = {
      vivid: "vidvid",
      vidvid: "vidvid",
      cool: "set3",
      set3: "set3",
      warm: "twilight",
      twilight: "twilight",
      pastel: "paired",
      paired: "paired",
    };
    Object.entries(data.colorMaps).forEach(([k, v]) => {
      const key = String(k);
      const mappedKey = mapPaletteKey[key] || (key.startsWith("custom-") ? key : null);
      if (!mappedKey) return;
      if (!Array.isArray(v) || v.length === 0) return;
      const valid = v.filter((c) => /^#([0-9a-fA-F]{6})$/.test(String(c)));
      if (valid.length) state.colorMaps[mappedKey] = valid;
    });
  }

  if (typeof data.selectedColorMap === "string") {
    const legacyMap = {
      vivid: "vidvid",
      vidvid: "vidvid",
      cool: "set3",
      warm: "twilight",
      twilight: "twilight",
      pastel: "paired",
      paired: "paired",
    };
    const selected = legacyMap[data.selectedColorMap] || data.selectedColorMap;
    if (state.colorMaps[selected]) state.selectedColorMap = selected;
  }

  if (data.legendPosition && Number.isFinite(Number(data.legendPosition.top)) && Number.isFinite(Number(data.legendPosition.right))) {
    state.legendPosition = {
      top: Math.max(0, Number(data.legendPosition.top)),
      right: Math.max(0, Number(data.legendPosition.right)),
    };
  }

  if (Number.isFinite(Number(data.legendFontSize))) {
    state.legendFontSize = Math.max(10, Math.min(40, Number(data.legendFontSize)));
  }
  state.legendFontCustomized = Boolean(data.legendFontCustomized);
  state.legendAuto = data.legendAuto !== false;

  if (data.plotPicker && typeof data.plotPicker === "object") {
    const rawPart = data.plotPicker.partIndex;
    const rawPartIndex = rawPart === null || rawPart === undefined || rawPart === "" ? NaN : Number(rawPart);
    state.plotPicker.partIndex = Number.isInteger(rawPartIndex) ? rawPartIndex : null;
    state.plotPicker.selectedExercises = Array.isArray(data.plotPicker.selectedExercises)
      ? data.plotPicker.selectedExercises.map((x) => String(x || "")).filter(Boolean)
      : [];
  }

  state.days = buildDays(state.year);

  // Heuristic migration: early versions stored March records in January indexes.
  // If January has records but March is empty, shift Jan day indexes to March counterparts.
  const marchOffset = Math.floor((new Date(state.year, 2, 1) - new Date(state.year, 0, 1)) / 86400000);
  if (marchOffset > 0) {
    const janKeys = [];
    let marchCount = 0;
    Object.keys(state.records).forEach((k) => {
      const lastSep = k.lastIndexOf("|");
      if (lastSep < 0) return;
      const idx = Number(k.slice(lastSep + 1));
      if (!Number.isInteger(idx) || idx < 0 || idx >= state.days.length) return;
      const month = state.days[idx].month;
      if (month === 1) janKeys.push(k);
      if (month === 3) marchCount += 1;
    });

    if (janKeys.length > 0 && marchCount === 0) {
      const moved = {};
      janKeys.forEach((k) => {
        const val = state.records[k];
        const lastSep = k.lastIndexOf("|");
        const secondLastSep = k.lastIndexOf("|", lastSep - 1);
        if (lastSep < 0 || secondLastSep < 0) return;
        const part = k.slice(0, secondLastSep);
        const exercise = k.slice(secondLastSep + 1, lastSep);
        const idx = Number(k.slice(lastSep + 1));
        const shifted = idx + marchOffset;
        if (!Number.isInteger(shifted) || shifted < 0 || shifted >= state.days.length) return;
        if (state.days[shifted].month !== 3) return;
        moved[keyForRecord(part, exercise, shifted)] = val;
        delete state.records[k];
      });
      Object.assign(state.records, moved);
    }
  }

  restoreActivePlotSeries(data.activePlotSeries || []);
  return true;
}

function setPlotPickerPart(index, resetSelection) {
  if (!Number.isInteger(index) || index < 0 || index >= state.bodyParts.length) {
    state.plotPicker.partIndex = null;
    state.plotPicker.selectedExercises = [];
    return;
  }
  state.plotPicker.partIndex = index;
  const part = state.bodyParts[index];
  const exercises = part?.exercises || [];

  if (resetSelection) {
    state.plotPicker.selectedExercises = [...exercises];
    return;
  }

  const validSet = new Set(exercises);
  const kept = state.plotPicker.selectedExercises.filter((name) => validSet.has(name));
  state.plotPicker.selectedExercises = kept;
}

function renderPlotPicker() {
  if (!els.plotPartSelect || !els.plotExerciseSelector || !els.plotSelectedBtn) return;

  const select = els.plotPartSelect;
  const list = els.plotExerciseSelector;
  const btn = els.plotSelectedBtn;

  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "请选择部位";
  select.appendChild(placeholder);

  state.bodyParts.forEach((part, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = part.name;
    select.appendChild(opt);
  });

  if (!Number.isInteger(state.plotPicker.partIndex) || state.plotPicker.partIndex < 0 || state.plotPicker.partIndex >= state.bodyParts.length) {
    state.plotPicker.partIndex = null;
    state.plotPicker.selectedExercises = [];
  }

  select.value = state.plotPicker.partIndex === null ? "" : String(state.plotPicker.partIndex);

  list.innerHTML = "";
  if (state.plotPicker.partIndex === null) {
    const empty = document.createElement("span");
    empty.className = "plot-empty";
    empty.textContent = "请先选择一个训练部位";
    list.appendChild(empty);
    btn.disabled = true;
    return;
  }

  setPlotPickerPart(state.plotPicker.partIndex, false);
  const current = state.bodyParts[state.plotPicker.partIndex];
  const selectedSet = new Set(state.plotPicker.selectedExercises);

  current.exercises.forEach((exercise) => {
    const item = document.createElement("label");
    item.className = "plot-exercise-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selectedSet.has(exercise);
    cb.addEventListener("change", () => {
      const nowSet = new Set(state.plotPicker.selectedExercises);
      if (cb.checked) nowSet.add(exercise);
      else nowSet.delete(exercise);
      state.plotPicker.selectedExercises = current.exercises.filter((name) => nowSet.has(name));
      btn.disabled = state.plotPicker.selectedExercises.length === 0;
      saveState();
    });
    const text = document.createElement("span");
    text.textContent = exercise;
    item.appendChild(cb);
    item.appendChild(text);
    list.appendChild(item);
  });

  btn.disabled = state.plotPicker.selectedExercises.length === 0;
}

function drawSelectedPartExercises() {
  if (!Number.isInteger(state.plotPicker.partIndex)) return;
  const part = state.bodyParts[state.plotPicker.partIndex];
  if (!part) return;

  const selected = state.plotPicker.selectedExercises;
  if (!selected.length) return;

  const nextSeries = [];
  selected.forEach((exercise, idx) => {
    const series = getSeries(part.name, exercise, PLOT_COLORS[idx % PLOT_COLORS.length]);
    if (series) nextSeries.push(series);
  });

  if (nextSeries.length === 0) {
    state.activePlotSeries = [];
    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (els.chartLegendOverlay) els.chartLegendOverlay.innerHTML = "";
    hideLegendSizePopup();
    els.chartMeta.textContent = `${part.name} 所选动作暂无记录。`;
    saveState();
    return;
  }

  state.activePlotSeries = nextSeries;
  recolorActiveSeries();
  renderChart();
  saveState();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const ok = applyLoadedState(parsed);
    if (!ok) return false;

    if (!Array.isArray(state.days) || state.days.length === 0) {
      state.days = buildDays(state.year);
    }
    if (!Array.isArray(state.bodyParts) || state.bodyParts.length === 0) {
      state.bodyParts = [{ name: "新部位", exercises: ["新动作"] }];
      state.selectedPartIndex = 0;
    }
    return true;
  } catch (_err) {
    return false;
  }
}

function syncControlsFromState() {
  if (els.yearInput) els.yearInput.value = String(state.year);
  if (els.trainingModeSelect) els.trainingModeSelect.value = state.trainingFilter.mode;
  if (els.intervalNInput) els.intervalNInput.value = String(state.trainingFilter.intervalN);
  if (els.weeklyDayChecks) {
    const set = new Set(state.trainingFilter.weeklyDays);
    els.weeklyDayChecks.forEach((el) => {
      el.checked = set.has(Number(el.value));
    });
  }
  if (els.globalFontSizeInput) els.globalFontSizeInput.value = String(state.chartStyle.fontSize);
  if (els.chartWidthInput) els.chartWidthInput.value = String(state.chartStyle.chartWidth);
  if (els.chartHeightInput) els.chartHeightInput.value = String(state.chartStyle.chartHeight);
  if (els.lineWidthInput) els.lineWidthInput.value = String(state.chartStyle.lineWidth);
  if (els.lineDashInput) els.lineDashInput.value = state.chartStyle.dash;
  if (els.pointStyleInput) els.pointStyleInput.value = state.chartStyle.pointStyle;
  if (els.pointSizeInput) els.pointSizeInput.value = String(state.chartStyle.pointSize);
  if (els.opacityInput) els.opacityInput.value = String(state.chartStyle.opacity);

  Object.keys(state.colorMaps).forEach((id) => ensureColormapOption(id));
  if (els.colormapSelect) {
    if (!state.colorMaps[state.selectedColorMap]) {
      state.selectedColorMap = "set3";
    }
    els.colormapSelect.value = state.selectedColorMap.startsWith("custom-")
      ? "custom"
      : ALLOWED_COLORMAP_IDS.includes(state.selectedColorMap)
        ? state.selectedColorMap
        : "set3";
    updateCustomColormapVisibility();
  }
}

function getLegendBounds(box, wrap) {
  const w = box.offsetWidth || 120;
  const h = box.offsetHeight || 36;
  const margin = 8;
  const topTextGuard = 28;
  const area = chart?.chartArea || null;

  let leftMin = margin;
  let leftMax = Math.max(leftMin, wrap.clientWidth - w - margin);
  let topMin = margin;
  let topMax = Math.max(topMin, wrap.clientHeight - h - margin);

  if (area) {
    leftMin = Math.max(0, Math.floor(area.left + margin));
    leftMax = Math.max(leftMin, Math.floor(area.right - w - margin));
    topMin = Math.max(0, Math.floor(area.top + margin + topTextGuard));
    topMax = Math.max(topMin, Math.floor(area.bottom - h - margin));
  }

  const rightMin = Math.max(0, wrap.clientWidth - (leftMax + w));
  const rightMax = Math.max(rightMin, wrap.clientWidth - (leftMin + w));

  return { w, h, leftMin, leftMax, topMin, topMax, rightMin, rightMax, area };
}

function setLegendPositionFromLeftTop(left, top, bounds, box) {
  const clampedLeft = Math.max(bounds.leftMin, Math.min(bounds.leftMax, left));
  const clampedTop = Math.max(bounds.topMin, Math.min(bounds.topMax, top));
  state.legendPosition.top = clampedTop;
  state.legendPosition.right = Math.max(bounds.rightMin, Math.min(bounds.rightMax, els.chartWrap.clientWidth - (clampedLeft + bounds.w)));
  box.style.top = `${state.legendPosition.top}px`;
  box.style.right = `${state.legendPosition.right}px`;
}

function clampLegendIntoPlotArea() {
  if (!els.chartLegendOverlay || !els.chartWrap) return;
  const bounds = getLegendBounds(els.chartLegendOverlay, els.chartWrap);
  const left = els.chartWrap.clientWidth - state.legendPosition.right - bounds.w;
  setLegendPositionFromLeftTop(left, state.legendPosition.top, bounds, els.chartLegendOverlay);
}

function autoPlaceLegend() {
  if (!chart || !els.chartLegendOverlay || !els.chartWrap || state.activePlotSeries.length === 0) return;

  const box = els.chartLegendOverlay;
  const wrap = els.chartWrap;
  const bounds = getLegendBounds(box, wrap);

  const points = [];
  chart.data.datasets.forEach((_, idx) => {
    const meta = chart.getDatasetMeta(idx);
    meta.data.forEach((el) => {
      if (Number.isFinite(el.x) && Number.isFinite(el.y)) points.push({ x: el.x, y: el.y });
    });
  });

  const candidates = [];
  const stepX = Math.max(18, Math.floor(bounds.w * 0.45));
  const stepY = Math.max(16, Math.floor(bounds.h * 0.45));

  for (let left = bounds.leftMin; left <= bounds.leftMax; left += stepX) {
    for (let top = bounds.topMin; top <= bounds.topMax; top += stepY) {
      candidates.push({ left, top });
    }
  }

  candidates.push(
    { left: bounds.leftMin, top: bounds.topMin },
    { left: bounds.leftMax, top: bounds.topMin },
    { left: bounds.leftMin, top: bounds.topMax },
    { left: bounds.leftMax, top: bounds.topMax },
  );

  let best = null;

  candidates.forEach((p) => {
    let score = 0;
    const rectLeft = p.left;
    const rectRight = p.left + bounds.w;
    const rectTop = p.top;
    const rectBottom = p.top + bounds.h;

    points.forEach((pt) => {
      const inHitBox = pt.x >= rectLeft - 10
        && pt.x <= rectRight + 10
        && pt.y >= rectTop - 10
        && pt.y <= rectBottom + 10;
      if (inHitBox) score += 14;

      const dx = Math.max(rectLeft - pt.x, 0, pt.x - rectRight);
      const dy = Math.max(rectTop - pt.y, 0, pt.y - rectBottom);
      const dist = Math.hypot(dx, dy);
      if (dist < 22) score += (22 - dist) * 0.6;
    });

    // Prefer lower overlap with week labels near top of plotting area.
    if (bounds.area && rectTop < bounds.area.top + 30) score += 24;

    if (best === null || score < best.score) best = { score, ...p };
  });

  if (!best) {
    clampLegendIntoPlotArea();
    return;
  }

  setLegendPositionFromLeftTop(best.left, best.top, bounds, box);
}

function hexToRgba(hex, alpha) {
  const raw = String(hex).replace("#", "");
  if (raw.length !== 6) return `rgba(31,117,145,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function dashPattern(key) {
  if (key === "dashed") return [8, 5];
  if (key === "dotted") return [2, 4];
  return [];
}

function shuffledColors(colors) {
  const arr = [...colors];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function recolorActiveSeries() {
  const base = state.colorMaps[state.selectedColorMap] || state.colorMaps.set3;
  const palette = shuffledColors(base);
  if (!palette.length) return;
  state.activePlotSeries.forEach((series, i) => {
    series.color = palette[i % palette.length];
  });
}

function createCustomColorInput(initial = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "custom-color-input";
  input.placeholder = "eg. #aaaaaa";
  input.value = initial;
  return input;
}

function refreshCustomColorInputPlaceholders() {
  const inputs = Array.from(els.customColorInputs.querySelectorAll(".custom-color-input"));
  inputs.forEach((input, idx) => {
    if (idx === 0) {
      input.placeholder = "16进制色码";
    } else {
      input.placeholder = "eg. #aaaaaa";
    }
  });
}

function addCustomColorBox(initial = "") {
  els.customColorInputs.appendChild(createCustomColorInput(initial));
  refreshCustomColorInputPlaceholders();
}

function removeCustomColorBox() {
  const items = els.customColorInputs.querySelectorAll(".custom-color-input");
  if (items.length <= 1) return;
  items[items.length - 1].remove();
  refreshCustomColorInputPlaceholders();
}

function getCustomColorValues() {
  return Array.from(els.customColorInputs.querySelectorAll(".custom-color-input"))
    .map((el) => el.value.trim())
    .filter((v) => /^#([0-9a-fA-F]{6})$/.test(v));
}

function renderLegendOverlay() {
  if (!els.chartLegendOverlay) return;
  els.chartLegendOverlay.innerHTML = "";
  els.chartLegendOverlay.style.top = `${state.legendPosition.top}px`;
  els.chartLegendOverlay.style.right = `${state.legendPosition.right}px`;

  state.activePlotSeries.forEach((s) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.style.fontSize = `${state.legendFontSize}px`;
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    const sw = Math.max(16, Math.round(state.legendFontSize * 2.0));
    const sh = Math.max(8, Math.round(state.legendFontSize * 0.85));
    swatch.style.width = `${sw}px`;
    swatch.style.height = `${sh}px`;
    swatch.style.background = hexToRgba(s.color, state.chartStyle.opacity);
    const text = document.createElement("span");
    text.textContent = `${s.part}-${s.exercise}`;
    item.appendChild(swatch);
    item.appendChild(text);
    els.chartLegendOverlay.appendChild(item);
  });
}

function hideLegendSizePopup() {
  if (!els.legendSizePopup) return;
  els.legendSizePopup.hidden = true;
}

function showLegendSizePopup() {
  if (!els.legendSizePopup || !els.legendSizeInput || !els.chartLegendOverlay || !els.chartWrap) return;
  if (state.activePlotSeries.length === 0) return;

  els.legendSizeInput.value = String(state.legendFontSize);

  const popup = els.legendSizePopup;
  const box = els.chartLegendOverlay;
  const wrap = els.chartWrap;
  popup.hidden = false;

  const desiredLeft = Math.min(box.offsetLeft, Math.max(0, wrap.clientWidth - popup.offsetWidth - 8));
  const desiredTop = Math.min(
    box.offsetTop + box.offsetHeight + 8,
    Math.max(0, wrap.clientHeight - popup.offsetHeight - 8),
  );

  popup.style.left = `${desiredLeft}px`;
  popup.style.top = `${desiredTop}px`;
  els.legendSizeInput.focus();
  els.legendSizeInput.select();
}

function applyLegendFontSize() {
  if (!els.legendSizeInput) return;
  const nextSize = Math.min(40, Math.max(10, Number(els.legendSizeInput.value) || state.legendFontSize));
  state.legendFontSize = nextSize;
  state.legendFontCustomized = true;
  renderLegendOverlay();
  if (state.legendAuto) autoPlaceLegend();
  saveState();
  hideLegendSizePopup();
}

function setLegendAutoPosition() {
  state.legendAuto = true;
  renderLegendOverlay();
  autoPlaceLegend();
  saveState();
  hideLegendSizePopup();
}

function bindLegendDrag() {
  const box = els.chartLegendOverlay;
  const wrap = els.chartWrap;
  if (!box || !wrap) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startTop = 0;
  let startRight = 0;
  let moved = false;

  box.addEventListener("mousedown", (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startTop = state.legendPosition.top;
    startRight = state.legendPosition.right;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
    const bounds = getLegendBounds(box, wrap);
    state.legendPosition.top = Math.max(bounds.topMin, Math.min(bounds.topMax, startTop + dy));
    state.legendPosition.right = Math.max(bounds.rightMin, Math.min(bounds.rightMax, startRight - dx));
    box.style.top = `${state.legendPosition.top}px`;
    box.style.right = `${state.legendPosition.right}px`;
  });

  window.addEventListener("mouseup", () => {
    if (dragging && moved) {
      state.legendAuto = false;
      saveState();
    }
    dragging = false;
  });

  box.addEventListener("click", (e) => {
    if (moved) return;
    e.stopPropagation();
    showLegendSizePopup();
  });
}

function applyChartWrapSize() {
  const width = state.chartStyle.chartWidth;
  const height = state.chartStyle.chartHeight;
  els.chartWrap.style.width = width > 0 ? `${width}px` : "100%";
  els.chartWrap.style.height = `${height}px`;
}

function buildDays(year) {
  const days = [];
  const jan1 = new Date(year, 0, 1, 12, 0, 0, 0);
  const jan1Weekday = jan1.getDay();
  const mondayOffset = jan1Weekday === 0 ? 6 : jan1Weekday - 1;
  let dayOfYear = 0;
  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      dayOfYear += 1;
      const date = new Date(year, month, day);
      const weekIndex = Math.floor((mondayOffset + dayOfYear - 1) / 7) + 1;
      // Use local noon to avoid any timezone edge around midnight.
      const weekday = new Date(year, month, day, 12, 0, 0, 0).getDay();
      days.push({
        date,
        day,
        month: month + 1,
        weekday,
        week: weekIndex,
      });
    }
  }
  return days;
}

function getCurrentMonthEntriesRaw() {
  const pages = getMonthPages();
  if (pages.length === 0) return [];
  state.currentMonthPageIndex = Math.max(0, Math.min(state.currentMonthPageIndex, pages.length - 1));
  const targetMonth = pages[state.currentMonthPageIndex].month;
  const entries = [];
  state.days.forEach((d, idx) => {
    if (d.month === targetMonth) entries.push({ day: d, dayIndex: idx });
  });
  return entries;
}

function syncTrainingFilterUi(rawEntries) {
  if (!els.trainingModeSelect || !els.intervalTrainingControls || !els.weeklyTrainingControls) return;
  const mode = ["all", "interval", "weekly"].includes(state.trainingFilter.mode)
    ? state.trainingFilter.mode
    : "all";
  state.trainingFilter.mode = mode;
  els.trainingModeSelect.value = mode;
  const showInterval = mode === "interval";
  const showWeekly = mode === "weekly";
  els.intervalTrainingControls.hidden = !showInterval;
  els.weeklyTrainingControls.hidden = !showWeekly;

  if (els.intervalNInput) {
    els.intervalNInput.value = String(state.trainingFilter.intervalN);
  }

  if (els.intervalStartDaySelect) {
    els.intervalStartDaySelect.innerHTML = "";
    rawEntries.forEach((entry) => {
      const opt = document.createElement("option");
      opt.value = String(entry.day.day);
      opt.textContent = `${entry.day.day} (${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][entry.day.weekday]})`;
      els.intervalStartDaySelect.appendChild(opt);
    });

    const validDays = new Set(rawEntries.map((e) => e.day.day));
    if (!validDays.has(state.trainingFilter.intervalStartDay)) {
      state.trainingFilter.intervalStartDay = rawEntries.length ? rawEntries[0].day.day : null;
    }

    if (state.trainingFilter.intervalStartDay !== null) {
      els.intervalStartDaySelect.value = String(state.trainingFilter.intervalStartDay);
    }
  }

  if (els.weeklyDayChecks) {
    const selected = new Set(state.trainingFilter.weeklyDays);
    els.weeklyDayChecks.forEach((cb) => {
      cb.checked = selected.has(Number(cb.value));
    });
  }
}

function applyTrainingFilter(entries) {
  const mode = state.trainingFilter.mode;
  if (mode === "all") return entries;

  if (mode === "interval") {
    const n = Math.max(1, Number(state.trainingFilter.intervalN) || 2);
    const start = Number(state.trainingFilter.intervalStartDay);
    if (!Number.isFinite(start)) return entries;
    return entries.filter((entry) => entry.day.day >= start && ((entry.day.day - start) % n === 0));
  }

  if (mode === "weekly") {
    const set = new Set(state.trainingFilter.weeklyDays);
    if (set.size === 0) return [];
    return entries.filter((entry) => set.has(entry.day.weekday));
  }

  return entries;
}

function keyForRecord(part, exercise, dayIndex) {
  return `${part}|${exercise}|${dayIndex}`;
}

function renderPartList() {
  els.partList.innerHTML = "";

  state.bodyParts.forEach((part, index) => {
    const li = document.createElement("li");
    li.dataset.index = String(index);
    li.classList.add("drag-item");

    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "↕";
    dragHandle.draggable = true;
    dragHandle.title = "拖动重排";

    dragHandle.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });

    dragHandle.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const from = Number(e.dataTransfer.getData("text/plain"));
      const to = index;
      if (!Number.isInteger(from) || from === to) return;
      const [moved] = state.bodyParts.splice(from, 1);
      state.bodyParts.splice(to, 0, moved);

      if (state.selectedPartIndex === from) {
        state.selectedPartIndex = to;
      } else if (from < state.selectedPartIndex && to >= state.selectedPartIndex) {
        state.selectedPartIndex -= 1;
      } else if (from > state.selectedPartIndex && to <= state.selectedPartIndex) {
        state.selectedPartIndex += 1;
      }

      renderPartList();
      renderExerciseList();
      renderPlotPicker();
      renderTable();
    });

    if (index === state.selectedPartIndex) li.classList.add("active");

    const input = document.createElement("input");
    input.type = "text";
    input.value = part.name;
    input.addEventListener("focus", () => {
      state.selectedPartIndex = index;
      renderPartList();
      renderExerciseList();
    });
    input.addEventListener("click", () => {
      state.selectedPartIndex = index;
      renderPartList();
      renderExerciseList();
    });
    input.addEventListener("change", () => {
      const v = input.value.trim();
      part.name = v || part.name;
      renderExerciseList();
      renderPlotPicker();
      renderTable();
      saveState();
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "删";
    delBtn.addEventListener("click", () => {
      state.bodyParts.splice(index, 1);
      if (state.bodyParts.length === 0) {
        state.bodyParts.push({ name: "新部位", exercises: ["新动作"] });
      }
      state.selectedPartIndex = Math.min(state.selectedPartIndex, state.bodyParts.length - 1);
      renderPartList();
      renderExerciseList();
      renderPlotPicker();
      renderTable();
      saveState();
    });

    li.appendChild(dragHandle);
    li.appendChild(input);
    li.appendChild(delBtn);
    els.partList.appendChild(li);
  });
}

function renderExerciseList() {
  const selectedPart = state.bodyParts[state.selectedPartIndex];
  els.exerciseList.innerHTML = "";

  if (!selectedPart) {
    els.exerciseHint.textContent = "请先新增并选中一个部位";
    return;
  }

  els.exerciseHint.textContent = `当前部位：${selectedPart.name}`;

  selectedPart.exercises.forEach((exercise, idx) => {
    const li = document.createElement("li");
    li.dataset.index = String(idx);
    li.classList.add("drag-item");

    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "↕";
    dragHandle.draggable = true;
    dragHandle.title = "拖动重排";

    dragHandle.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(idx));
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });

    dragHandle.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const from = Number(e.dataTransfer.getData("text/plain"));
      const to = idx;
      if (!Number.isInteger(from) || from === to) return;
      const [moved] = selectedPart.exercises.splice(from, 1);
      selectedPart.exercises.splice(to, 0, moved);
      renderExerciseList();
      renderPlotPicker();
      renderTable();
      saveState();
    });

    const input = document.createElement("input");
    input.type = "text";
    input.value = exercise;
    input.addEventListener("change", () => {
      const v = input.value.trim();
      selectedPart.exercises[idx] = v || exercise;
      renderPlotPicker();
      renderTable();
      saveState();
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "删";
    delBtn.addEventListener("click", () => {
      selectedPart.exercises.splice(idx, 1);
      if (selectedPart.exercises.length === 0) selectedPart.exercises.push("新动作");
      renderExerciseList();
      renderPlotPicker();
      renderTable();
      saveState();
    });

    li.appendChild(dragHandle);
    li.appendChild(input);
    li.appendChild(delBtn);
    els.exerciseList.appendChild(li);
  });
}

function buildSpanMap(values) {
  const spans = [];
  let start = 0;
  for (let i = 1; i <= values.length; i += 1) {
    if (i === values.length || values[i] !== values[start]) {
      spans.push({ value: values[start], span: i - start, startIndex: start, endIndex: i - 1 });
      start = i;
    }
  }
  return spans;
}

function computeExerciseColumnWidth() {
  const names = [];
  state.bodyParts.forEach((part) => {
    part.exercises.forEach((ex) => names.push(String(ex || "")));
  });
  const longest = names.reduce((acc, name) => (name.length > acc.length ? name : acc), "动作");

  // Rough width estimate that works for mixed CJK/Latin text.
  const cjkCount = (longest.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinCount = Math.max(0, longest.length - cjkCount);
  const px = cjkCount * 16 + latinCount * 9 + 28;
  return Math.max(96, Math.min(240, px));
}

function getMonthPages() {
  const pages = [];
  const seen = new Set();
  state.days.forEach((d) => {
    if (!seen.has(d.month)) {
      seen.add(d.month);
      pages.push({ month: d.month });
    }
  });
  return pages;
}

function getVisibleDayEntries() {
  const raw = getCurrentMonthEntriesRaw();
  syncTrainingFilterUi(raw);
  return applyTrainingFilter(raw);
}

function tdClassForDay(dayEntries, i) {
  if (dayEntries.length === 0) return "";
  const current = dayEntries[i].day;
  const prev = i > 0 ? dayEntries[i - 1].day : null;
  const next = i < dayEntries.length - 1 ? dayEntries[i + 1].day : null;
  const classes = [];
  if (!prev || current.week !== prev.week) classes.push("start-week");
  if (!prev || current.month !== prev.month) classes.push("start-month");
  if (!next || current.month !== next.month) classes.push("end-month");
  return classes.join(" ");
}

function renderMonthPager() {
  const pages = getMonthPages();
  if (pages.length === 0) {
    els.monthPageLabel.textContent = "-";
    els.prevMonthBtn.disabled = true;
    els.nextMonthBtn.disabled = true;
    return;
  }
  state.currentMonthPageIndex = Math.max(0, Math.min(state.currentMonthPageIndex, pages.length - 1));
  const currentMonth = pages[state.currentMonthPageIndex].month;
  els.monthPageLabel.textContent = MONTH_NAMES[currentMonth - 1];
  els.prevMonthBtn.disabled = state.currentMonthPageIndex === 0;
  els.nextMonthBtn.disabled = state.currentMonthPageIndex === pages.length - 1;
}

function renderTable() {
  const dayEntries = getVisibleDayEntries();
  const localDays = dayEntries.map((e) => e.day);
  const monthSpans = buildSpanMap(localDays.map((d) => d.month));
  const weekSpans = buildSpanMap(localDays.map((d) => d.week));

  renderMonthPager();

  const table = document.createElement("table");
  const exerciseWidth = computeExerciseColumnWidth();
  table.style.setProperty("--col-exercise-w", `${exerciseWidth}px`);
  table.style.setProperty("--col-part-w", "82px");

  const head = document.createElement("thead");
  const rowMonth = document.createElement("tr");
  const rowWeek = document.createElement("tr");
  const rowDay = document.createElement("tr");

  const thPart = document.createElement("th");
  thPart.textContent = "部位";
  thPart.className = "sticky col-part";
  thPart.rowSpan = 3;
  rowMonth.appendChild(thPart);

  const thExercise = document.createElement("th");
  thExercise.textContent = "动作";
  thExercise.className = "sticky-2 col-exercise";
  thExercise.rowSpan = 3;
  rowMonth.appendChild(thExercise);

  monthSpans.forEach((seg) => {
    const th = document.createElement("th");
    th.colSpan = seg.span;
    th.textContent = MONTH_NAMES[seg.value - 1];
    const classes = [];
    if (seg.startIndex === 0 || localDays[seg.startIndex].month !== localDays[seg.startIndex - 1]?.month) {
      classes.push("start-month");
    }
    if (seg.endIndex === localDays.length - 1 || localDays[seg.endIndex].month !== localDays[seg.endIndex + 1]?.month) {
      classes.push("end-month");
    }
    th.className = classes.join(" ");
    rowMonth.appendChild(th);
  });

  weekSpans.forEach((seg) => {
    const th = document.createElement("th");
    th.colSpan = seg.span;
    th.textContent = `W${seg.value}`;
    const classes = [];
    if (seg.startIndex === 0 || localDays[seg.startIndex].week !== localDays[seg.startIndex - 1]?.week) {
      classes.push("start-week");
    }
    if (seg.startIndex === 0 || localDays[seg.startIndex].month !== localDays[seg.startIndex - 1]?.month) {
      classes.push("start-month");
    }
    if (seg.endIndex === localDays.length - 1 || localDays[seg.endIndex].month !== localDays[seg.endIndex + 1]?.month) {
      classes.push("end-month");
    }
    th.className = classes.join(" ");
    rowWeek.appendChild(th);
  });

  dayEntries.forEach((entry, i) => {
    const d = entry.day;
    const th = document.createElement("th");
    th.className = `${tdClassForDay(dayEntries, i)} day-col`;
    const headDiv = document.createElement("div");
    headDiv.className = "day-head";

    const dayText = document.createElement("span");
    dayText.textContent = String(d.day);
    headDiv.appendChild(dayText);

    const chip = document.createElement("span");
    chip.className = `weekday-chip wd-${d.weekday}`;
    chip.title = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.weekday];
    headDiv.appendChild(chip);

    th.appendChild(headDiv);
    rowDay.appendChild(th);
  });

  head.appendChild(rowMonth);
  head.appendChild(rowWeek);
  head.appendChild(rowDay);
  table.appendChild(head);

  const body = document.createElement("tbody");

  state.bodyParts.forEach((part, partIndex) => {
    part.exercises.forEach((exercise, exerciseIndex) => {
      const tr = document.createElement("tr");
      if (partIndex > 0 && exerciseIndex === 0) {
        tr.classList.add("part-separator-row");
      }

      if (exerciseIndex === 0) {
        const tdPart = document.createElement("td");
        tdPart.className = "sticky col-part";
        tdPart.rowSpan = part.exercises.length;
        tdPart.textContent = part.name;
        tr.appendChild(tdPart);
      }

      const tdExercise = document.createElement("td");
      tdExercise.className = "sticky-2 col-exercise";
      tdExercise.textContent = exercise;
      tr.appendChild(tdExercise);

      dayEntries.forEach((entry, localDayIndex) => {
        const td = document.createElement("td");
        td.className = `${tdClassForDay(dayEntries, localDayIndex)} day-col`;

        const input = document.createElement("input");
        input.className = "weight";
        input.type = "number";
        input.min = "0";
        input.step = "0.5";

        const key = keyForRecord(part.name, exercise, entry.dayIndex);
        if (state.records[key] !== undefined) input.value = state.records[key];

        input.addEventListener("change", () => {
          const value = input.value.trim();
          if (value === "") {
            delete state.records[key];
          } else {
            state.records[key] = Number(value);
          }
          saveState();
        });

        td.appendChild(input);
        tr.appendChild(td);
      });

      body.appendChild(tr);
    });
  });

  table.appendChild(body);
  els.tableContainer.innerHTML = "";
  els.tableContainer.appendChild(table);
}

function buildChartSections(days, minRawX, maxRawX) {
  const visible = days.slice(minRawX - 1, maxRawX);
  const weekSections = [];
  const monthSections = [];

  if (visible.length === 0) {
    return { weekSections, monthSections };
  }

  let weekCount = 1;
  let weekStart = 0;
  let monthStart = 0;

  for (let i = 1; i < visible.length; i += 1) {
    if (visible[i].week !== visible[i - 1].week) {
      weekSections.push({ label: `W${weekCount}`, startX: weekStart, endX: i - 1 });
      weekCount += 1;
      weekStart = i;
    }

    if (visible[i].month !== visible[i - 1].month) {
      monthSections.push({
        label: MONTH_NAMES[visible[i - 1].month - 1],
        startX: monthStart,
        endX: i - 1,
      });
      monthStart = i;
    }
  }

  const latestOffset = maxRawX - minRawX;
  weekSections.push({ label: `W${weekCount}`, startX: weekStart, endX: latestOffset });
  monthSections.push({
    label: MONTH_NAMES[visible[visible.length - 1].month - 1],
    startX: monthStart,
    endX: latestOffset,
  });

  return { weekSections, monthSections };
}

function getSeries(part, exercise, color) {
  const points = [];

  state.days.forEach((_, i) => {
    const key = keyForRecord(part, exercise, i);
    const y = state.records[key];
    if (y !== undefined && Number.isFinite(y)) {
      points.push({ x: i + 1, y });
    }
  });

  if (points.length === 0) return null;

  return {
    key: `${part}-${exercise}`,
    part,
    exercise,
    data: points,
    color,
  };
}

function renderChart() {
  const allPoints = state.activePlotSeries.flatMap((s) => s.data);

  if (allPoints.length === 0) {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (els.chartLegendOverlay) {
      els.chartLegendOverlay.innerHTML = "";
    }
    hideLegendSizePopup();
    return;
  }

  const minRawX = Math.min(...allPoints.map((p) => p.x));
  const maxRawX = Math.max(...allPoints.map((p) => p.x));
  const latestDay = maxRawX - minRawX;
  const maxVal = Math.max(...allPoints.map((p) => p.y));
  const roundedYMax = Math.max(10, Math.ceil(maxVal / 10) * 10);
  const yMax = Number.isInteger(maxVal / 10) ? roundedYMax + 10 : roundedYMax;
  const xMax = (Math.floor(latestDay / 10) + 1) * 10;

  const startDate = state.days[minRawX - 1];
  const latestDate = state.days[maxRawX - 1];

  els.chartMeta.textContent = `已绘制 ${state.activePlotSeries.length} 条曲线`;

  const guideMaxRawX = Math.min(state.days.length, minRawX + xMax);
  const sections = buildChartSections(state.days, minRawX, guideMaxRawX);
  const rawCurrentMarkers = state.activePlotSeries
    .map((series) => {
      const lastPoint = series.data.reduce((acc, p) => (p.x > acc.x ? p : acc), series.data[0]);
      return {
        offsetX: lastPoint.x - minRawX,
        y: lastPoint.y,
        color: series.color,
      };
    })
    .filter((m) => Number.isFinite(m.offsetX) && Number.isFinite(m.y));

  const markerBucket = new Map();
  rawCurrentMarkers.forEach((m) => {
    const list = markerBucket.get(m.offsetX) || [];
    list.push(m);
    markerBucket.set(m.offsetX, list);
  });

  const labelMarkers = Array.from(markerBucket.entries()).map(([, list]) => {
    const pick = Math.floor(Math.random() * list.length);
    return list[pick];
  });

  // Draw lower-ending lines first, higher-ending lines later (top layer).
  const lineMarkers = [...rawCurrentMarkers].sort((a, b) => a.y - b.y);

  const currentXSet = new Set(labelMarkers.map((m) => m.offsetX));

  const guidePlugin = {
    id: "guidePlugin",
    afterDraw(chartRef) {
      const { ctx, scales } = chartRef;
      const xScale = scales.x;
      const yScale = scales.y;
      const tickFontSize = state.chartStyle.fontSize;
      const tickLabelFont = `700 ${tickFontSize}px ${FONT_FAMILY_UI}`;
      const axisY = yScale.getPixelForValue(0);
      const xTickTop = axisY + 10;

      ctx.save();

      sections.weekSections.forEach((seg) => {
        const x = xScale.getPixelForValue(seg.startX);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(80, 120, 150, 0.35)";
        ctx.beginPath();
        ctx.moveTo(x, yScale.top);
        ctx.lineTo(x, yScale.bottom);
        ctx.stroke();

        const centerX = xScale.getPixelForValue((seg.startX + seg.endX) / 2);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(76, 92, 103, 0.62)";
        ctx.font = `600 13px ${FONT_FAMILY_UI}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(seg.label, centerX, yScale.top + 6);
      });

      sections.monthSections.forEach((seg) => {
        const x = xScale.getPixelForValue(seg.startX);
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(30, 50, 70, 0.7)";
        ctx.beginPath();
        ctx.moveTo(x, yScale.top);
        ctx.lineTo(x, yScale.bottom);
        ctx.stroke();

        const centerX = xScale.getPixelForValue((seg.startX + seg.endX) / 2);
        ctx.fillStyle = "#283848";
        ctx.font = `700 16px ${FONT_FAMILY_UI}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(seg.label, centerX, yScale.top - 18);
      });

      lineMarkers.forEach((marker) => {
        const markerX = xScale.getPixelForValue(marker.offsetX);
        const markerY = yScale.getPixelForValue(marker.y);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = marker.color;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(markerX, markerY);
        ctx.lineTo(markerX, axisY);
        ctx.stroke();

      });

      labelMarkers.forEach((marker) => {
        const markerX = xScale.getPixelForValue(marker.offsetX);
        ctx.fillStyle = marker.color;
        ctx.font = tickLabelFont;
        ctx.fillText(String(marker.offsetX), markerX, xTickTop);
      });

      const baselineY = xTickTop + 36;

      // Draw short outward tick markers on both axes for clear value boundaries.
      ctx.setLineDash([]);
      ctx.strokeStyle = "#6b7a88";
      ctx.lineWidth = 2;
      for (let v = 0; v <= xMax; v += 10) {
        const px = xScale.getPixelForValue(v);
        ctx.beginPath();
        ctx.moveTo(px, axisY);
        ctx.lineTo(px, axisY - 8);
        ctx.stroke();
      }

      yScale.ticks.forEach((tick) => {
        const val = Number(tick.value);
        if (!Number.isFinite(val)) return;
        const py = yScale.getPixelForValue(val);
        ctx.beginPath();
        ctx.moveTo(yScale.right, py);
        ctx.lineTo(yScale.right + 8, py);
        ctx.stroke();
      });

      // Draw x tick numbers manually to align custom current-day label at identical height.
      ctx.fillStyle = "#5f6770";
      ctx.font = tickLabelFont;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      for (let v = 0; v <= xMax; v += 10) {
        if (v === latestDay) continue;
        if (currentXSet.has(v)) continue;
        const px = xScale.getPixelForValue(v);
        if (v === xMax) {
          ctx.textAlign = "right";
          ctx.fillText(String(v), Math.max(xScale.left + 8, px - 2), xTickTop);
        } else if (v === 0) {
          ctx.textAlign = "left";
          ctx.fillText(String(v), Math.min(xScale.right - 8, px + 2), xTickTop);
        } else {
          ctx.textAlign = "center";
          ctx.fillText(String(v), px, xTickTop);
        }
      }

      const leftDate = `${startDate.day}/${MONTH_NAMES[startDate.month - 1]}`;
      const rightDate = `${latestDate.day}/${MONTH_NAMES[latestDate.month - 1]}`;

      ctx.fillStyle = "#606d79";
      ctx.font = `700 ${tickFontSize}px ${FONT_FAMILY_UI}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText("Days", xScale.getPixelForValue(xMax / 2), baselineY);

      ctx.fillStyle = "#111111";
      ctx.fillText(leftDate, xScale.getPixelForValue(0), baselineY);
      ctx.fillText(rightDate, xScale.getPixelForValue(latestDay), baselineY);

      ctx.restore();
    },
  };

  if (chart) chart.destroy();

  const datasets = state.activePlotSeries.map((s) => ({
    label: `${s.part}-${s.exercise}`,
    data: s.data.map((p) => ({ x: p.x - minRawX, y: p.y })),
    borderColor: hexToRgba(s.color, state.chartStyle.opacity),
    backgroundColor: hexToRgba(s.color, state.chartStyle.opacity),
    pointRadius: state.chartStyle.pointSize,
    pointStyle: state.chartStyle.pointStyle,
    borderWidth: state.chartStyle.lineWidth,
    borderDash: dashPattern(state.chartStyle.dash),
    tension: 0.2,
    parsing: false,
  }));

  chart = new Chart(els.trendChart, {
    type: "line",
    data: {
      datasets,
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      font: {
        family: FONT_FAMILY_UI,
        size: state.chartStyle.fontSize,
      },
      layout: {
        padding: {
          top: 26,
          right: 16,
          bottom: 64,
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: xMax,
          grid: { display: false },
          border: {
            display: true,
            color: "#6b7a88",
            width: 2,
          },
          title: {
            display: false,
            text: "Days",
            font: {
              size: state.chartStyle.fontSize,
              weight: "700",
            },
          },
          ticks: {
            stepSize: 10,
            precision: 0,
            color: "#5f6770",
            padding: 10,
            display: false,
            font: {
              size: state.chartStyle.fontSize,
              weight: "700",
            },
            callback(value) {
              return Number(value) % 10 === 0 ? String(value) : "";
            },
          },
        },
        y: {
          min: 0,
          max: yMax,
          grid: { display: false },
          border: {
            display: true,
            color: "#6b7a88",
            width: 2,
          },
          ticks: {
            stepSize: 10,
            color: "#5f6770",
            font: {
              size: state.chartStyle.fontSize,
              weight: "700",
            },
          },
          title: {
            display: true,
            text: "kg",
            font: {
              size: state.chartStyle.fontSize,
              weight: "700",
            },
          },
        },
      },
    },
    plugins: [guidePlugin],
  });

  renderLegendOverlay();
  if (state.legendAuto) autoPlaceLegend();
  else clampLegendIntoPlotArea();
}

function updateGlobalChartStyle() {
  state.chartStyle.fontSize = Math.max(10, Number(els.globalFontSizeInput.value) || 18);
  state.chartStyle.chartWidth = Math.max(0, Number(els.chartWidthInput.value) || 1100);
  state.chartStyle.chartHeight = Math.max(220, Number(els.chartHeightInput.value) || 350);
  state.chartStyle.lineWidth = Math.max(1, Number(els.lineWidthInput.value) || 3);
  state.chartStyle.dash = els.lineDashInput.value || "solid";
  state.chartStyle.pointStyle = els.pointStyleInput.value || "circle";
  state.chartStyle.pointSize = Math.max(1, Number(els.pointSizeInput.value) || 5);
  state.chartStyle.opacity = Math.min(1, Math.max(0.1, Number(els.opacityInput.value) || 1));

  // Keep legend default at global font size - 2 until user customizes legend size.
  if (!state.legendFontCustomized) {
    state.legendFontSize = Math.max(10, state.chartStyle.fontSize - 2);
  }

  applyChartWrapSize();
  if (state.activePlotSeries.length > 0) renderChart();
  saveState();
}

function addCustomColormapFromInput() {
  const colors = getCustomColorValues();
  if (colors.length < 2) return;
  const id = `custom-${Date.now()}`;
  state.colorMaps[id] = colors;
  state.selectedColorMap = id;
  if (els.colormapSelect) {
    els.colormapSelect.value = "custom";
    updateCustomColormapVisibility();
  }
  recolorActiveSeries();
  if (state.activePlotSeries.length > 0) renderChart();
  els.customColorInputs.querySelectorAll(".custom-color-input").forEach((el) => {
    el.value = "";
  });
  refreshCustomColorInputPlaceholders();
  saveState();
}

function exportChartImage() {
  if (!chart) return;
  const format = els.exportFormatSelect.value || "png";
  const img = chart.toBase64Image("image/png", 1);
  const fileBase = `fitness-chart-${new Date().toISOString().slice(0, 10)}`;

  if (format === "png") {
    const link = document.createElement("a");
    link.href = img;
    link.download = `${fileBase}.png`;
    link.click();
    return;
  }

  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const drawW = pageW - margin * 2;
    const drawH = pageH - margin * 2;
    pdf.addImage(img, "PNG", margin, margin, drawW, drawH);
    pdf.save(`${fileBase}.pdf`);
  }
}

function clearAllChartSeries() {
  if (state.activePlotSeries.length === 0) return;
  const confirmed = window.confirm("确认清空当前绘图中的所有曲线吗？");
  if (!confirmed) return;

  state.activePlotSeries = [];
  hideLegendSizePopup();
  if (chart) {
    chart.destroy();
    chart = null;
  }
  if (els.chartLegendOverlay) {
    els.chartLegendOverlay.innerHTML = "";
  }
  if (els.chartMeta) {
    els.chartMeta.textContent = "先选择训练部位和动作，再点击“绘图”。";
  }
  saveState();
}

function drawTrend(part, exercise, appendMode) {
  const color = PLOT_COLORS[state.activePlotSeries.length % PLOT_COLORS.length];
  const next = getSeries(part, exercise, color);

  if (!next) {
    els.chartMeta.textContent = `${part} - ${exercise} 暂无记录。`;
    return;
  }

  if (!appendMode) {
    state.activePlotSeries = [next];
    recolorActiveSeries();
  } else {
    const idx = state.activePlotSeries.findIndex((s) => s.key === next.key);
    if (idx === -1) {
      state.activePlotSeries.push(next);
      recolorActiveSeries();
    } else {
      // Refresh the plotted series with the latest edited values.
      const keepColor = state.activePlotSeries[idx].color;
      state.activePlotSeries[idx] = { ...next, color: keepColor };
    }
  }

  renderChart();
  saveState();
}

function bindEvents() {
  els.importCalendarBtn.addEventListener("click", () => {
    const nextYear = Number(els.yearInput.value) || 2026;
    state.year = nextYear;
    state.days = buildDays(state.year);
    state.currentMonthPageIndex = 0;
    state.trainingFilter.intervalStartDay = null;
    state.activePlotSeries = [];
    if (chart) {
      chart.destroy();
      chart = null;
    }
    renderTable();
    saveState();
  });

  if (els.trainingModeSelect) {
    els.trainingModeSelect.addEventListener("change", () => {
      state.trainingFilter.mode = els.trainingModeSelect.value;
      renderTable();
      saveState();
    });
  }

  if (els.intervalStartDaySelect) {
    els.intervalStartDaySelect.addEventListener("change", () => {
      state.trainingFilter.intervalStartDay = Number(els.intervalStartDaySelect.value);
      renderTable();
      saveState();
    });
  }

  if (els.intervalNInput) {
    els.intervalNInput.addEventListener("change", () => {
      state.trainingFilter.intervalN = Math.max(1, Math.min(14, Number(els.intervalNInput.value) || 2));
      renderTable();
      saveState();
    });
  }

  if (els.weeklyDayChecks) {
    els.weeklyDayChecks.forEach((cb) => {
      cb.addEventListener("change", () => {
        const selected = Array.from(els.weeklyDayChecks)
          .filter((el) => el.checked)
          .map((el) => Number(el.value));
        if (selected.length === 0) {
          cb.checked = true;
          return;
        }
        state.trainingFilter.weeklyDays = selected;
        renderTable();
        saveState();
      });
    });
  }

  els.addPartBtn.addEventListener("click", () => {
    const name = els.newPartInput.value.trim();
    if (!name) return;
    state.bodyParts.push({ name, exercises: ["新动作"] });
    state.selectedPartIndex = state.bodyParts.length - 1;
    els.newPartInput.value = "";
    renderPartList();
    renderExerciseList();
    renderPlotPicker();
    renderTable();
    saveState();
  });

  els.addExerciseBtn.addEventListener("click", () => {
    const selectedPart = state.bodyParts[state.selectedPartIndex];
    const name = els.newExerciseInput.value.trim();
    if (!selectedPart || !name) return;
    selectedPart.exercises.push(name);
    els.newExerciseInput.value = "";
    renderExerciseList();
    renderPlotPicker();
    renderTable();
    saveState();
  });

  els.prevMonthBtn.addEventListener("click", () => {
    state.currentMonthPageIndex = Math.max(0, state.currentMonthPageIndex - 1);
    renderTable();
    saveState();
  });

  els.nextMonthBtn.addEventListener("click", () => {
    const maxIndex = Math.max(0, getMonthPages().length - 1);
    state.currentMonthPageIndex = Math.min(maxIndex, state.currentMonthPageIndex + 1);
    renderTable();
    saveState();
  });

  const chartInputs = [
    els.globalFontSizeInput,
    els.chartWidthInput,
    els.chartHeightInput,
    els.lineWidthInput,
    els.lineDashInput,
    els.pointStyleInput,
    els.pointSizeInput,
    els.opacityInput,
  ];

  chartInputs.forEach((input) => {
    input.addEventListener("change", updateGlobalChartStyle);
  });

  els.colormapSelect.addEventListener("change", () => {
    const selected = els.colormapSelect.value;
    updateCustomColormapVisibility();
    if (selected === "custom") {
      saveState();
      return;
    }
    state.selectedColorMap = selected;
    recolorActiveSeries();
    if (state.activePlotSeries.length > 0) renderChart();
    saveState();
  });

  els.saveColormapBtn.addEventListener("click", addCustomColormapFromInput);
  els.addColorBoxBtn.addEventListener("click", () => addCustomColorBox(""));
  els.removeColorBoxBtn.addEventListener("click", removeCustomColorBox);
  els.exportChartBtn.addEventListener("click", exportChartImage);
  if (els.clearAllChartBtn) {
    els.clearAllChartBtn.addEventListener("click", clearAllChartSeries);
  }

  if (els.plotPartSelect) {
    els.plotPartSelect.addEventListener("change", () => {
      const raw = els.plotPartSelect.value;
      if (raw === "") {
        setPlotPickerPart(null, false);
      } else {
        setPlotPickerPart(Number(raw), true);
      }
      renderPlotPicker();
      saveState();
    });
  }

  if (els.plotSelectedBtn) {
    els.plotSelectedBtn.addEventListener("click", drawSelectedPartExercises);
  }

  if (els.legendSizeApplyBtn) {
    els.legendSizeApplyBtn.addEventListener("click", applyLegendFontSize);
  }

  if (els.legendAutoBtn) {
    els.legendAutoBtn.addEventListener("click", setLegendAutoPosition);
  }

  if (els.legendSizeInput) {
    els.legendSizeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyLegendFontSize();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hideLegendSizePopup();
      }
    });
  }

  if (els.legendSizePopup) {
    els.legendSizePopup.addEventListener("click", (e) => e.stopPropagation());
  }

  document.addEventListener("click", () => hideLegendSizePopup());
}

function init() {
  const loaded = loadState();
  if (loaded) {
    if (state.chartStyle.chartWidth === 0) state.chartStyle.chartWidth = 1100;
    if (state.chartStyle.chartHeight === 320) state.chartStyle.chartHeight = 350;
  }
  if (!loaded) {
    state.legendFontSize = Math.max(10, state.chartStyle.fontSize - 2);
    state.days = buildDays(state.year);
  }
  addCustomColorBox("");
  addCustomColorBox("");
  refreshCustomColorInputPlaceholders();
  syncControlsFromState();
  bindLegendDrag();
  applyChartWrapSize();
  bindEvents();
  renderPartList();
  renderExerciseList();
  renderPlotPicker();
  renderTable();
  if (state.activePlotSeries.length > 0) renderChart();
  saveState();
}

init();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    // Re-resolve font-family (in case CSS variables were unresolved at load)
    FONT_FAMILY_UI = resolveFontFamilyUI();
    if (state.activePlotSeries.length > 0) renderChart();
  });
}
