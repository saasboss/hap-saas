const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(
  require("node:path").join(__dirname, "../public/hap/app.js"),
  "utf8",
);
function chunk(name) {
  const start = source.indexOf("function " + name + "(");
  assert.notEqual(start, -1, "Missing " + name);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}
function prices() {
  const context = vm.createContext({
    Number,
    Array,
    Math,
    isPromoLive: (p) => p.active && !p.pausedAt,
    t: (k) => (k === "from" ? "From" : "≈"),
    currencyOf: () => ({ primary: "ALL" }),
    displayCurrencyCode: () => "EUR",
    guestRates: () => [{ code: "EUR", rate: 100 }],
    convertFromPrimary: (n, r) => n / r,
    money: (n) => n + " ALL",
    formatCurrency: (n, c) => n.toFixed(2) + " " + c,
    approxPrice: () => "",
  });
  for (const name of ["itemVariants", "itemPrice", "menuPrice", "priceColumn"])
    vm.runInContext(chunk(name), context);
  return context;
}
test("previous and effective current prices share the selected guest currency", () => {
  const c = prices(),
    item = { price: 1200, promotion: { active: true, wasPrice: 1500 } };
  const before = JSON.stringify(item),
    html = c.priceColumn(item);
  assert.match(html, /15.00 EUR/);
  assert.match(html, /12.00 EUR/);
  assert.doesNotMatch(html, /ALL/);
  assert.equal(JSON.stringify(item), before);
});
test("variant comparison is suppressed without losing its saved previous price", () => {
  const c = prices(),
    item = {
      price: 500,
      variants: [
        { name: "Small", price: 1200 },
        { name: "Large", price: 1600 },
      ],
      promotion: { active: true, wasPrice: 1800 },
    };
  const html = c.priceColumn(item);
  assert.match(html, /From/);
  assert.match(html, /12.00 EUR/);
  assert.doesNotMatch(html, /product-price-was/);
  assert.equal(item.promotion.wasPrice, 1800);
});
test("single variant uses its effective price and rejects misleading old prices", () => {
  const c = prices(),
    item = {
      price: 500,
      variants: [{ name: "Regular", price: 1200 }],
      promotion: { active: true, wasPrice: 900 },
    };
  assert.doesNotMatch(c.priceColumn(item), /product-price-was/);
  item.promotion.wasPrice = 1500;
  assert.match(c.priceColumn(item), /15.00 EUR/);
  item.promotion.pausedAt = 1;
  assert.doesNotMatch(c.priceColumn(item), /product-price-was/);
});
module.exports = { chunk, source };

test("legacy treatment and template IDs resolve directly without touching records", () => {
  const c = vm.createContext({});
  vm.runInContext(
    source.slice(
      source.indexOf("const PROMO_STYLES ="),
      source.indexOf("/* Exactly three layouts"),
    ),
    c,
  );
  vm.runInContext(
    source.slice(
      source.indexOf("const templates ="),
      source.indexOf("/* ---------------- Palettes"),
    ),
    c,
  );
  for (const [old, expected] of Object.entries({
    filled: "framed",
    editorial: "offer",
    ribbon: "ribbon",
    offer: "offer",
  }))
    assert.equal(c.itemStyleId(old), expected);
  for (const [old, expected] of Object.entries({
    stamp: "framed",
    spotlight: "band",
    marquee: "band",
    ribbon: "ribbon",
  }))
    assert.equal(c.catStyleId(old), expected);
  for (const [old, expected] of Object.entries({
    street: "modern",
    noir: "editorial",
    kiosk: "grid",
    bistro: "editorial",
    aria: "modern",
  }))
    assert.equal(c.normalizeTemplate(old), expected);
});

test("appearance persistence failure rolls back saved state", () => {
  const state = { appearance: { template: "modern" }, theme: "light" };
  const context = vm.createContext({ window: {} });
  vm.runInContext(
    fs.readFileSync(require("node:path").join(__dirname, "../public/hap/services.js"), "utf8"),
    context,
  );
  const api = context.window.HapServices.create({
    getState: () => state,
    save: () => {
      throw Error("Device full");
    },
    canAccess: () => true,
  });
  const result = api.settings.saveAppearance({ template: "grid", mode: "dark" });
  assert.equal(result.status, "error");
  assert.equal(state.appearance.template, "modern");
  assert.equal(state.theme, "light");
});
test("preview currency context stays isolated from restaurant settings", () => {
  const state = {
    restaurant: {
      currency: { primary: "ALL", rates: [{ code: "EUR", rate: 100 }], conversionsEnabled: true },
    },
  };
  const context = vm.createContext({
    state,
    CURRENCIES: { ALL: {}, EUR: {} },
    defaultCurrency: () => ({ primary: "ALL", rates: [] }),
  });
  vm.runInContext(chunk("currencyOf"), context);
  const before = JSON.stringify(state),
    result = context.currencyOf({ currencyConfig: { primary: "EUR", rates: [] } });
  assert.equal(result.primary, "EUR");
  assert.equal(JSON.stringify(state), before);
});

test("promotion save failure preserves the original record and fields", () => {
  const original = { active: true, label: "Original", terms: "Keep", from: "18:00", to: "02:00" };
  const state = {
    menus: [
      { id: "menu", categories: [{ id: "cat", items: [{ id: "item", promotion: original }] }] },
    ],
    activeMenuId: "menu",
  };
  const context = vm.createContext({ window: {} });
  vm.runInContext(
    fs.readFileSync(require("node:path").join(__dirname, "../public/hap/services.js"), "utf8"),
    context,
  );
  const api = context.window.HapServices.create({
    getState: () => state,
    save: () => {
      throw Error("Storage failure");
    },
    canAccess: () => true,
  });
  assert.equal(api.promotions.save("item", "item", { label: "Changed" }).status, "error");
  assert.equal(state.menus[0].categories[0].items[0].promotion, original);
  assert.equal(api.promotions.pause("item", "item").status, "error");
  assert.equal(original.pausedAt, undefined);
});

test("failed item move restores both categories and all original fields", () => {
  const item = {
    id: "i",
    name: "Dish",
    price: 500,
    variants: [{ name: "Large", price: 800 }],
    description: "Retained",
    i18n: { IT: { name: "Piatto" } },
  };
  const state = {
    menus: [
      {
        id: "m",
        categories: [
          { id: "a", items: [item] },
          { id: "b", items: [] },
        ],
      },
    ],
    activeMenuId: "m",
  };
  const c = vm.createContext({ window: {} });
  vm.runInContext(
    fs.readFileSync(require("node:path").join(__dirname, "../public/hap/services.js"), "utf8"),
    c,
  );
  let fail = true;
  const api = c.window.HapServices.create({
    getState: () => state,
    save: () => {
      if (fail) throw Error("full");
    },
    canAccess: () => true,
  });
  assert.equal(api.items.save({ ...item, name: "Changed" }, "b").status, "error");
  assert.equal(state.menus[0].categories[0].items[0], item);
  assert.equal(state.menus[0].categories[1].items.length, 0);
  fail = false;
  assert.equal(api.items.save({ ...item, name: "Changed" }, "b").status, "ok");
  assert.equal(state.menus[0].categories[0].items.length, 0);
  assert.equal(state.menus[0].categories[1].items[0].description, "Retained");
});

function schedules() {
  const rows = [];
  const c = vm.createContext({
    Date,
    Number,
    Array,
    Math,
    Infinity,
    allPromotions: () => rows,
    PROMO_MODES: [["now"], ["closing"], ["schedule"], ["custom"]],
    DAY_SHORT: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  });
  for (const name of [
    "endOfDay",
    "parseHM",
    "toLocalInput",
    "fromLocalInput",
    "promoWindow",
    "promoDays",
    "inRecurrence",
    "promoStatus",
    "isStrongPromo",
    "promoRowId",
    "promoRowName",
    "validatePromotionSchedule",
    "promotionIntervals",
    "schedulesOverlap",
    "promoConflict",
    "draftPromotion",
  ])
    vm.runInContext(chunk(name), c);
  c.rows = rows;
  return c;
}
test("overnight recurrence belongs to its starting weekday", () => {
  const c = schedules(),
    p = { mode: "custom", days: [5], from: "18:00", to: "02:00" };
  const at = (s) => new Date(s).getTime();
  assert.equal(c.inRecurrence(p, at("2026-09-12T01:00")), true);
  assert.equal(c.inRecurrence(p, at("2026-09-11T01:00")), false);
  assert.equal(c.inRecurrence(p, at("2026-09-12T02:00")), false);
});
test("schedules reject invalid dates, ordering, weekdays and hours", () => {
  const c = schedules(),
    now = new Date("2026-09-01T00:00").getTime(),
    p = { mode: "schedule", startAt: now + 1000, endAt: now + 2000 };
  assert.equal(c.validatePromotionSchedule(p, now), null);
  for (const patch of [{ startAt: NaN }, { endAt: NaN }, { endAt: now }, { startAt: now + 3000 }])
    assert(c.validatePromotionSchedule({ ...p, ...patch }, now));
  for (const patch of [{ days: [] }, { days: [7] }, { from: "24:00" }, { to: "18:00" }])
    assert(
      c.validatePromotionSchedule(
        { ...p, mode: "custom", days: [5], from: "18:00", to: "02:00", ...patch },
        now,
      ),
    );
  assert.equal(c.fromLocalInput("2026-02-30T12:00"), null);
});
test("future overlaps compare actual recurring windows and separate emphasis scopes", () => {
  const c = schedules(),
    at = (s) => new Date(s).getTime(),
    now = at("2026-09-01T00:00");
  const a = {
    active: true,
    mode: "custom",
    days: [5],
    from: "18:00",
    to: "02:00",
    startAt: at("2026-10-01T00:00"),
    endAt: null,
    intensity: "strong",
  };
  assert(
    c.schedulesOverlap(
      a,
      { mode: "schedule", startAt: at("2026-10-03T01:00"), endAt: at("2026-10-03T03:00") },
      now,
    ),
  );
  assert(
    !c.schedulesOverlap(
      a,
      { mode: "schedule", startAt: at("2026-10-02T01:00"), endAt: at("2026-10-02T03:00") },
      now,
    ),
  );
  assert(!c.schedulesOverlap(a, { ...a, from: "03:00", to: "04:00" }, now));
  c.rows.push({ kind: "item", item: { id: "a", name: "Friday offer" }, promotion: a });
  assert.equal(c.promoConflict("item", "b", { ...a }), "Friday offer");
  assert.equal(c.promoConflict("category", "b", { ...a }), null);
  assert.equal(c.promoConflict("item", "b", { ...a, intensity: "normal" }), null);
  c.rows[0].promotion = { ...a, pausedAt: now };
  assert.equal(c.promoConflict("item", "b", a), null);
});
test("expiry wins over pause and touching interval boundaries do not overlap", () => {
  const c = schedules(),
    now = Date.now(),
    p = {
      active: true,
      mode: "schedule",
      startAt: now - 2000,
      endAt: now - 1000,
      pausedAt: now - 1500,
    };
  assert.equal(c.promoStatus(p), "past");
  assert(
    !c.schedulesOverlap(
      { startAt: now + 1000, endAt: now + 2000 },
      { startAt: now + 2000, endAt: now + 3000 },
      now,
    ),
  );
});

test("weekly overlap agrees with calendar sampling across clipped future windows", () => {
  const c = schedules(),
    now = new Date("2026-09-01T00:00").getTime(),
    start = new Date("2027-03-01T00:00").getTime();
  let seed = 29;
  const rand = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  const hm = (h) => String(h).padStart(2, "0") + ":00";
  for (let n = 0; n < 80; n++) {
    const create = () => {
      const from = rand(24);
      let to = rand(24);
      if (from === to) to = (to + 1) % 24;
      return {
        mode: rand(3) ? "custom" : "schedule",
        days: [rand(7), rand(7)],
        from: hm(from),
        to: hm(to),
        startAt: start + rand(72) * 3600000,
        endAt: start + (72 + rand(168)) * 3600000,
      };
    };
    const a = create(),
      b = create(),
      lo = Math.max(a.startAt, b.startAt),
      hi = Math.min(a.endAt, b.endAt);
    let expected = false;
    for (let at = lo; at < hi; at += 3600000)
      if (c.inRecurrence(a, at) && c.inRecurrence(b, at)) {
        expected = true;
        break;
      }
    assert.equal(c.schedulesOverlap(a, b, now), expected, JSON.stringify({ a, b }));
  }
});
test("legacy windows resolve without mutating stored scheduling fields", () => {
  const c = schedules(),
    p = { active: true, startedAt: new Date("2026-09-11T18:00").getTime(), until: "tonight" },
    before = JSON.stringify(p);
  assert.equal(c.promoWindow(p).end, c.endOfDay(p.startedAt));
  assert.equal(JSON.stringify(p), before);
});
