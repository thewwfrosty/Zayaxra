/* =========================================================
   ZAYAXRA
   COMPLETE SCRIPT
========================================================= */

"use strict";


/* =========================================================
   DATA
========================================================= */

const PET_DATA_URL =
  "https://raw.githubusercontent.com/ironbabatekkral/adoptme-values/main/adoptme_values.json";

const PET_IMAGE_BASE =
  "https://raw.githubusercontent.com/ironbabatekkral/adoptme-values/main";


const CUSTOM_VALUE_OVERRIDES = {

  "Shadow Dragon": 125,
  "Bat Dragon": 110,
  "Giraffe": 70,
  "Frost Dragon": 58,
  "Owl": 42,
  "Parrot": 38,
  "Evil Unicorn": 32,
  "Crow": 28,
  "Turtle": 12,
  "Cracked Egg": 0.1

};


const FALLBACK_ITEMS = [

  {
    id: "shadow_dragon",
    name: "Shadow Dragon",
    type: "pet",
    rarity: "legendary",
    value: 125,
    image: "https://cdn.playadopt.me/items/shadow_dragon.png"
  },

  {
    id: "bat_dragon",
    name: "Bat Dragon",
    type: "pet",
    rarity: "legendary",
    value: 110,
    image: "https://cdn.playadopt.me/items/bat_dragon.png"
  },

  {
    id: "giraffe",
    name: "Giraffe",
    type: "pet",
    rarity: "legendary",
    value: 70,
    image: "https://cdn.playadopt.me/items/giraffe.png"
  },

  {
    id: "frost_dragon",
    name: "Frost Dragon",
    type: "pet",
    rarity: "legendary",
    value: 58,
    image: "https://cdn.playadopt.me/items/frost_dragon.png"
  },

  {
    id: "owl",
    name: "Owl",
    type: "pet",
    rarity: "legendary",
    value: 42,
    image: "https://cdn.playadopt.me/items/owl.png"
  },

  {
    id: "parrot",
    name: "Parrot",
    type: "pet",
    rarity: "legendary",
    value: 38,
    image: "https://cdn.playadopt.me/items/parrot.png"
  },

  {
    id: "evil_unicorn",
    name: "Evil Unicorn",
    type: "pet",
    rarity: "legendary",
    value: 32,
    image: "https://cdn.playadopt.me/items/evil_unicorn.png"
  },

  {
    id: "crow",
    name: "Crow",
    type: "pet",
    rarity: "legendary",
    value: 28,
    image: "https://cdn.playadopt.me/items/crow.png"
  },

  {
    id: "turtle",
    name: "Turtle",
    type: "pet",
    rarity: "legendary",
    value: 12,
    image: "https://cdn.playadopt.me/items/turtle.png"
  },

  {
    id: "cracked_egg",
    name: "Cracked Egg",
    type: "egg",
    rarity: "common",
    value: .1,
    image: "https://cdn.playadopt.me/items/cracked_egg.png"
  }

];


let allItems = [];
let filteredValues = [];

let valueCategory = "all";
let pickerCategory = "all";

let visibleValueCount = 60;

let youTrade = [];
let themTrade = [];

let pickerSide = null;
let selectedItem = null;

let selectedForm = "normal";
let selectedPotion = {
  fly: false,
  ride: false
};

let currentAvatar = "🐉";

let tradeSessionRecorded = false;


/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatValue(value) {

  const number = Number(value) || 0;

  if (number < 1) {
    return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  if (number >= 1000) {
    return number.toLocaleString("en-US", {
      maximumFractionDigits: 2
    });
  }

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

}


function rarityName(rarity) {

  const r = String(rarity || "").toLowerCase();

  const names = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    "ultra-rare": "Ultra Rare",
    ultra_rare: "Ultra Rare",
    legendary: "Legendary"
  };

  return names[r] || rarity || "Other";

}


function normalizeType(type) {

  const t = String(type || "")
    .toLowerCase()
    .trim();

  if (t.includes("pet wear") || t.includes("petwear")) {
    return "pet wear";
  }

  if (t.includes("vehicle") || t.includes("car")) {
    return "vehicle";
  }

  if (t.includes("stroller")) {
    return "stroller";
  }

  if (t.includes("toy")) {
    return "toy";
  }

  if (t.includes("food")) {
    return "food";
  }

  if (t.includes("gift")) {
    return "gift";
  }

  if (t.includes("sticker")) {
    return "sticker";
  }

  if (t.includes("egg")) {
    return "egg";
  }

  if (t.includes("pet")) {
    return "pet";
  }

  return "other";

}


function isPet(item) {
  return normalizeType(item?.type) === "pet";
}


function normalizeImage(image, name = "") {

  if (!image && name) {

    const file = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return `${PET_IMAGE_BASE}/images/${file}.png`;
  }

  if (!image) {
    return "";
  }

  const img = String(image);

  if (/^https?:\/\//i.test(img)) {
    return img;
  }

  if (img.startsWith("//")) {
    return "https:" + img;
  }

  if (img.startsWith("/")) {
    return PET_IMAGE_BASE + img;
  }

  return `${PET_IMAGE_BASE}/${img.replace(/^\/+/, "")}`;

}


function getBaseValue(item) {

  if (!item) return 0;

  const override = CUSTOM_VALUE_OVERRIDES[item.name];

  if (override !== undefined) {
    return Number(override);
  }

  if (item.value !== undefined) {
    return Number(item.value) || 0;
  }

  if (item.regular?.value !== undefined) {
    return Number(item.regular.value) || 0;
  }

  return 0;

}


/* =========================================================
   DATA NORMALIZATION
========================================================= */

function normalizeItem(raw, index = 0) {

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const name =
    raw.name ||
    raw.title ||
    raw.itemName ||
    `Item ${index + 1}`;

  let type =
    raw.type ||
    raw.category ||
    raw.item_type ||
    "other";

  type = normalizeType(type);

  let value = getBaseValue(raw);

  const custom =
    CUSTOM_VALUE_OVERRIDES[name];

  if (custom !== undefined) {
    value = Number(custom);
  }

  const image =
    normalizeImage(
      raw.image ||
      raw.img ||
      raw.icon ||
      raw.thumbnail,
      name
    );

  const item = {

    id:
      raw.id ||
      raw.slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_"),

    name,
    type,
    rarity: String(raw.rarity || "other").toLowerCase(),
    value,
    image,

    regular: raw.regular || null,
    neon: raw.neon || null,
    mega: raw.mega || null

  };

  return item;

}


function extractArray(data) {

  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const possibleKeys = [
    "items",
    "pets",
    "data",
    "values",
    "adoptme",
    "adoptMe"
  ];

  for (const key of possibleKeys) {

    if (Array.isArray(data[key])) {
      return data[key];
    }

  }

  const values = Object.values(data);

  if (
    values.length &&
    values.every(
      item =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
  ) {
    return values;
  }

  return [];

}


async function loadDatabase() {

  try {

    const response = await fetch(
      PET_DATA_URL,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error("Database response failed");
    }

    const json = await response.json();

    const rawItems = extractArray(json);

    const normalized = rawItems
      .map(normalizeItem)
      .filter(Boolean)
      .filter(item => item.name);

    const map = new Map();

    for (const item of normalized) {

      const key = item.name
        .toLowerCase()
        .trim();

      if (!map.has(key)) {
        map.set(key, item);
      }

    }

    allItems = Array.from(map.values());

    mergeFallbackItems();

  } catch (error) {

    console.warn(
      "ZAYAXRA database yüklenemedi:",
      error
    );

    allItems = FALLBACK_ITEMS.map(normalizeItem);

  }

  if (!allItems.length) {
    allItems = FALLBACK_ITEMS.map(normalizeItem);
  }

  applyValueFilters();
  renderPicker();

  updateCounters();

}


function mergeFallbackItems() {

  const existing = new Set(
    allItems.map(
      item => item.name.toLowerCase()
    )
  );

  for (const fallback of FALLBACK_ITEMS) {

    const normalized =
      normalizeItem(fallback);

    if (!normalized) continue;

    if (!existing.has(
      normalized.name.toLowerCase()
    )) {

      allItems.push(normalized);

    }

  }

}


/* =========================================================
   MODIFIED PET VALUE
========================================================= */

function getVariantValue(item, form) {

  if (!item) return 0;

  const override =
    CUSTOM_VALUE_OVERRIDES[item.name];

  if (
    form === "normal" &&
    override !== undefined
  ) {
    return Number(override);
  }

  const variant =
    item[form];

  if (
    variant &&
    typeof variant === "object"
  ) {

    if (variant.value !== undefined) {
      return Number(variant.value) || 0;
    }

    if (variant.no_potion !== undefined) {
      return Number(variant.no_potion) || 0;
    }

  }

  if (
    form === "neon" &&
    item.regular?.value
  ) {
    return Number(item.regular.value) * 4;
  }

  if (
    form === "mega" &&
    item.regular?.value
  ) {
    return Number(item.regular.value) * 16;
  }

  const base = getBaseValue(item);

  if (form === "neon") {
    return base * 4;
  }

  if (form === "mega") {
    return base * 16;
  }

  return base;

}


function getModifiedValue(item, form = selectedForm, potion = selectedPotion) {

  if (!item) return 0;

  if (!isPet(item)) {
    return getBaseValue(item);
  }

  const variant =
    item[form];

  let value = 0;

  if (
    variant &&
    typeof variant === "object"
  ) {

    if (
      potion.fly &&
      potion.ride &&
      variant.fly_ride !== undefined
    ) {

      value = Number(variant.fly_ride) || 0;

    } else if (
      potion.fly &&
      variant.fly !== undefined
    ) {

      value = Number(variant.fly) || 0;

    } else if (
      potion.ride &&
      variant.ride !== undefined
    ) {

      value = Number(variant.ride) || 0;

    } else if (
      variant.no_potion !== undefined
    ) {

      value = Number(variant.no_potion) || 0;

    } else if (
      variant.value !== undefined
    ) {

      value = Number(variant.value) || 0;

    }

  }

  if (!value) {
    value = getVariantValue(item, form);
  }

  if (
    form === "normal" &&
    CUSTOM_VALUE_OVERRIDES[item.name] !== undefined
  ) {

    const custom =
      Number(CUSTOM_VALUE_OVERRIDES[item.name]);

    if (
      !variant ||
      (
        variant.no_potion === undefined &&
        variant.value === undefined
      )
    ) {
      value = custom;
    }

  }

  return value;

}


/* =========================================================
   VALUES PAGE
========================================================= */

function applyValueFilters() {

  const search =
    ($("search")?.value || "")
      .trim()
      .toLowerCase();

  const rarity =
    $("rarityFilter")?.value || "all";

  filteredValues =
    allItems.filter(item => {

      const matchesSearch =
        !search ||
        item.name
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        valueCategory === "all" ||
        normalizeType(item.type) === valueCategory;

      const matchesRarity =
        rarity === "all" ||
        item.rarity === rarity;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRarity
      );

    });


  const sort =
    $("sortSelect")?.value ||
    "value-desc";


  filteredValues.sort((a, b) => {

    if (sort === "value-asc") {
      return getBaseValue(a) - getBaseValue(b);
    }

    if (sort === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "name-desc") {
      return b.name.localeCompare(a.name);
    }

    return getBaseValue(b) - getBaseValue(a);

  });


  visibleValueCount = 60;

  renderValues();

}


function renderValues() {

  const grid = $("valueGrid");

  if (!grid) return;

  const visible =
    filteredValues.slice(
      0,
      visibleValueCount
    );

  if (!visible.length) {

    grid.innerHTML = `
      <div class="empty-trade" style="grid-column:1/-1;min-height:250px;">
        <div class="empty-icon">🔎</div>
        <strong>Item bulunamadı</strong>
        <span>Arama veya filtrelerini değiştirmeyi dene.</span>
      </div>
    `;

  } else {

    grid.innerHTML =
      visible
        .map(valueCardHTML)
        .join("");

  }


  const count = $("itemCount");

  if (count) {
    count.textContent =
      filteredValues.length.toLocaleString();
  }


  const more =
    $("loadMoreWrapper");

  if (more) {

    more.style.display =
      visibleValueCount <
      filteredValues.length
        ? "flex"
        : "none";

  }

}


function valueCardHTML(item) {

  const value =
    getBaseValue(item);

  const image =
    escapeHTML(item.image);

  return `
    <article class="value-card">

      <img
        class="value-card-image"
        src="${image}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
        onerror="this.style.opacity='.2'"
      >

      <div class="value-card-info">

        <span class="value-card-name">
          ${escapeHTML(item.name)}
        </span>

        <span class="value-card-rarity">
          ${escapeHTML(rarityName(item.rarity))}
        </span>

        <strong class="value-card-value">
          ${formatValue(value)}
        </strong>

        <small class="value-card-category">
          ${escapeHTML(item.type)}
        </small>

      </div>

    </article>
  `;

}


function setValueCategory(category) {

  valueCategory = category || "all";

  document
    .querySelectorAll("#categoryBar button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === valueCategory
      );

    });

  applyValueFilters();

}


function loadMoreItems() {

  visibleValueCount += 60;

  renderValues();

}


function clearSearchInput() {

  const search = $("search");

  if (search) {
    search.value = "";
  }

  applyValueFilters();

}


function updateCounters() {

  const home =
    $("homeItemCount");

  if (home) {

    home.textContent =
      allItems.length.toLocaleString() + "+";

  }

}


/* =========================================================
   PICKER
========================================================= */

function openPetPicker(side) {

  pickerSide = side;

  selectedItem = null;

  selectedForm = "normal";

  selectedPotion = {
    fly: false,
    ride: false
  };

  pickerCategory = "all";

  const modal =
    $("petPickerModal");

  if (!modal) return;

  modal.classList.add("open");

  document.body.style.overflow = "hidden";

  const title =
    $("petPickerTitle");

  if (title) {

    title.textContent =
      side === "you"
        ? "Senin Item'in"
        : "Karşı Tarafın Item'i";

  }

  const search =
    $("pickerSearch");

  if (search) {
    search.value = "";
  }

  updatePickerCategories();
  renderPicker();
  resetPickerPreview();

}


function closePetPicker() {

  const modal =
    $("petPickerModal");

  if (modal) {
    modal.classList.remove("open");
  }

  document.body.style.overflow = "";

}


function setPickerCategory(category) {

  pickerCategory = category || "all";

  updatePickerCategories();
  renderPicker();

}


function updatePickerCategories() {

  document
    .querySelectorAll(
      "#pickerCategoryBar button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === pickerCategory
      );

    });

}


function renderPicker() {

  const container =
    $("pickerPetList");

  if (!container) return;

  const search =
    ($("pickerSearch")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    allItems.filter(item => {

      const matchesSearch =
        !search ||
        item.name
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        pickerCategory === "all" ||
        normalizeType(item.type) === pickerCategory;

      return (
        matchesSearch &&
        matchesCategory
      );

    });


  container.innerHTML =
    list
      .map(pickerItemHTML)
      .join("");


  if (!list.length) {

    container.innerHTML = `
      <div class="empty-trade"
           style="grid-column:1/-1;min-height:260px;">
        <div class="empty-icon">🔎</div>
        <strong>Item bulunamadı</strong>
        <span>Başka bir isim veya kategori dene.</span>
      </div>
    `;

  }

}


function pickerItemHTML(item) {

  const selected =
    selectedItem?.id === item.id
      ? "selected"
      : "";

  return `
    <button
      class="pet-choice ${selected}"
      onclick="selectPickerPet('${escapeHTML(item.id)}')"
      type="button"
    >

      <img
        src="${escapeHTML(item.image)}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
        onerror="this.style.opacity='.2'"
      >

      <span class="pet-choice-name">
        ${escapeHTML(item.name)}
      </span>

      <span class="pet-choice-value">
        ${formatValue(getBaseValue(item))}
      </span>

      <span class="rarity-tag">
        ${escapeHTML(rarityName(item.rarity))}
      </span>

    </button>
  `;

}


function selectPickerPet(id) {

  selectedItem =
    allItems.find(
      item => String(item.id) === String(id)
    );

  if (!selectedItem) return;

  selectedForm = "normal";

  selectedPotion = {
    fly: false,
    ride: false
  };

  renderPicker();
  renderPickerPreview();
  updatePickerButtons();

}


function resetPickerPreview() {

  const image =
    $("pickerPreview");

  if (image) {
    image.src = "";
    image.alt = "";
  }

  if ($("pickerSelectedName")) {
    $("pickerSelectedName")
      .textContent = "Item seç";
  }

  if ($("pickerSelectedRarity")) {
    $("pickerSelectedRarity")
      .textContent = "—";
  }

  if ($("pickerValue")) {
    $("pickerValue")
      .textContent = "0";
  }

  updatePickerButtons();

}


function renderPickerPreview() {

  if (!selectedItem) {
    resetPickerPreview();
    return;
  }

  const image =
    $("pickerPreview");

  if (image) {

    image.src =
      selectedItem.image;

    image.alt =
      selectedItem.name;

  }

  if ($("pickerSelectedName")) {

    $("pickerSelectedName")
      .textContent =
      selectedItem.name;

  }

  if ($("pickerSelectedRarity")) {

    $("pickerSelectedRarity")
      .textContent =
      rarityName(selectedItem.rarity);

  }

  updatePickerValue();
  updatePickerButtons();

}


function toggleForm(form) {

  if (!selectedItem || !isPet(selectedItem)) {
    return;
  }

  selectedForm = form;

  updatePickerButtons();
  updatePickerValue();

}


function togglePotion(type) {

  if (!selectedItem || !isPet(selectedItem)) {
    return;
  }

  if (type === "fly") {
    selectedPotion.fly =
      !selectedPotion.fly;
  }

  if (type === "ride") {
    selectedPotion.ride =
      !selectedPotion.ride;
  }

  updatePickerButtons();
  updatePickerValue();

}


function updatePickerButtons() {

  const formOptions =
    $("formOptions");

  const potionOptions =
    $("potionOptions");

  const isPetSelected =
    selectedItem &&
    isPet(selectedItem);


  if (formOptions) {

    formOptions.style.display =
      isPetSelected
        ? "block"
        : "none";

  }


  if (potionOptions) {

    potionOptions.style.display =
      isPetSelected
        ? "block"
        : "none";

  }


  document
    .querySelectorAll(
      "#formOptions .option-button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.form === selectedForm
      );

    });


  document
    .querySelectorAll(
      "#potionOptions .option-button"
    )
    .forEach(button => {

      const potion =
        button.dataset.potion;

      const active =
        potion === "fly"
          ? selectedPotion.fly
          : selectedPotion.ride;

      button.classList.toggle(
        "active",
        active
      );

    });

}


function updatePickerValue() {

  if (!$("pickerValue")) return;

  if (!selectedItem) {

    $("pickerValue")
      .textContent = "0";

    return;

  }

  const value =
    getModifiedValue(
      selectedItem,
      selectedForm,
      selectedPotion
    );

  $("pickerValue")
    .textContent =
    formatValue(value);

}


/* =========================================================
   ADD TO TRADE
========================================================= */

function confirmAddPet() {

  if (!selectedItem) {

    showToast(
      "⚠️",
      "Önce bir item seç."
    );

    return;

  }

  const item = {

    ...selectedItem,

    tradeId:
      Date.now() +
      Math.random(),

    form:
      isPet(selectedItem)
        ? selectedForm
        : "normal",

    fly:
      isPet(selectedItem)
        ? selectedPotion.fly
        : false,

    ride:
      isPet(selectedItem)
        ? selectedPotion.ride
        : false

  };


  if (pickerSide === "you") {

    youTrade.push(item);

  } else {

    themTrade.push(item);

  }


  updateTradeUI();
  closePetPicker();

  showToast(
    "✓",
    `${selectedItem.name} trade'e eklendi.`
  );

}


function removeTradeItem(side, tradeId) {

  if (side === "you") {

    youTrade =
      youTrade.filter(
        item => item.tradeId !== tradeId
      );

  } else {

    themTrade =
      themTrade.filter(
        item => item.tradeId !== tradeId
      );

  }

  updateTradeUI();

}


function clearTrade(side) {

  if (side === "you") {

    youTrade = [];

  } else if (side === "them") {

    themTrade = [];

  } else {

    youTrade = [];
    themTrade = [];

  }

  if (
    youTrade.length === 0 &&
    themTrade.length === 0
  ) {

    tradeSessionRecorded = false;

  }

  updateTradeUI();

}


/* =========================================================
   TRADE HTML
========================================================= */

function tradeItemHTML(item, side) {

  const value =
    getModifiedValue(
      item,
      item.form,
      {
        fly: item.fly,
        ride: item.ride
      }
    );


  const badges = [];

  if (item.fly) {
    badges.push("F");
  }

  if (item.ride) {
    badges.push("R");
  }

  if (item.form === "neon") {
    badges.push("N");
  }

  if (item.form === "mega") {
    badges.push("M");
  }


  return `
    <article class="trade-item">

      <button
        class="remove-item-btn"
        onclick="removeTradeItem('${side}', ${item.tradeId})"
        type="button"
        title="Kaldır"
      >
        ×
      </button>

      <img
        class="trade-item-image"
        src="${escapeHTML(item.image)}"
        alt="${escapeHTML(item.name)}"
        onerror="this.style.opacity='.2'"
      >

      <div class="trade-item-info">

        <span class="trade-item-name">
          ${escapeHTML(item.name)}
        </span>

        <strong class="trade-item-value">
          ${formatValue(value)}
        </strong>

        ${
          badges.length
            ? `
              <small style="
                color:#a78bfa;
                font-size:7px;
                font-weight:900;
              ">
                ${badges.join(" • ")}
              </small>
            `
            : ""
        }

      </div>

    </article>
  `;

}


function calculateTotal(trade) {

  return trade.reduce(
    (total, item) => {

      return total +
        getModifiedValue(
          item,
          item.form,
          {
            fly: item.fly,
            ride: item.ride
          }
        );

    },
    0
  );

}


function renderTradeSide(side) {

  const trade =
    side === "you"
      ? youTrade
      : themTrade;

  const container =
    side === "you"
      ? $("youItems")
      : $("themItems");

  if (!container) return;


  if (!trade.length) {

    container.innerHTML = `
      <div class="empty-trade">

        <div class="empty-icon">＋</div>

        <strong>
          Item ekle
        </strong>

        <span>
          ${
            side === "you"
              ? "Teklifini oluşturmak için pet veya eşya seç."
              : "Karşı tarafın teklifini oluştur."
          }
        </span>

      </div>
    `;

    return;

  }


  container.innerHTML =
    trade
      .map(item =>
        tradeItemHTML(
          item,
          side
        )
      )
      .join("");

}


function updateTradeUI() {

  renderTradeSide("you");
  renderTradeSide("them");


  const youTotal =
    calculateTotal(youTrade);

  const themTotal =
    calculateTotal(themTrade);


  if ($("youTotal")) {

    $("youTotal")
      .textContent =
      formatValue(youTotal);

  }

  if ($("themTotal")) {

    $("themTotal")
      .textContent =
      formatValue(themTotal);

  }


  updateResult(
    youTotal,
    themTotal
  );


  renderProfile();

}


/* =========================================================
   W / F / L
========================================================= */

function updateResult(you, them) {

  const card =
    $("resultCard");

  const title =
    $("resultTitle");

  const text =
    $("resultText");

  const difference =
    $("resultDifference");

  const icon =
    $("resultIcon");


  if (
    !card ||
    !title ||
    !text ||
    !difference
  ) {
    return;
  }


  card.classList.remove(
    "fair",
    "small-win",
    "big-win",
    "small-lose",
    "big-lose"
  );


  if (you === 0 && them === 0) {

    title.textContent =
      "Pet ekleyerek başla";

    text.textContent =
      "İki tarafa da item eklediğinde trade sonucu burada görünecek.";

    difference.textContent = "—";

    if (icon) {
      icon.textContent = "⚖️";
    }

    return;

  }


  if (you === 0 || them === 0) {

    title.textContent =
      "Teklif eksik";

    text.textContent =
      "Sağlıklı bir W/F/L sonucu için iki tarafa da item ekle.";

    difference.textContent =
      "—";

    if (icon) {
      icon.textContent = "➕";
    }

    return;

  }


  const diff =
    you - them;

  const max =
    Math.max(
      you,
      them
    );

  const percentage =
    Math.abs(diff) / max;


  if (percentage <= .05) {

    card.classList.add("fair");

    title.textContent =
      "FAIR";

    text.textContent =
      "İki tarafın teklif değeri birbirine çok yakın.";

    difference.textContent =
      `Fark: ${formatValue(Math.abs(diff))}`;

    if (icon) {
      icon.textContent = "⚖️";
    }

    recordTradeResult("fair");

    return;

  }


  if (you > them) {

    const status =
      percentage <= .15
        ? "small-win"
        : "big-win";

    card.classList.add(status);

    title.textContent =
      percentage <= .15
        ? "SMALL WIN"
        : "BIG WIN";

    text.textContent =
      "Senin verdiğin teklif daha yüksek değere sahip.";

    difference.textContent =
      `+${formatValue(diff)} değer`;

    if (icon) {
      icon.textContent = "📈";
    }

    recordTradeResult("win");

  } else {

    const status =
      percentage <= .15
        ? "small-lose"
        : "big-lose";

    card.classList.add(status);

    title.textContent =
      percentage <= .15
        ? "SMALL LOSE"
        : "BIG LOSE";

    text.textContent =
      "Karşı tarafın verdiği teklif daha yüksek değere sahip.";

    difference.textContent =
      `-${formatValue(Math.abs(diff))} değer`;

    if (icon) {
      icon.textContent = "📉";
    }

    recordTradeResult("lose");

  }

}


/* =========================================================
   PROFILE
========================================================= */

const DEFAULT_PROFILE = {

  name: "ZAYAXRA Kullanıcısı",
  username: "@kullanici",
  avatar: "🐉",

  trades: 0,
  wins: 0,
  fair: 0,
  losses: 0

};


let profile = loadProfile();


function loadProfile() {

  try {

    const saved =
      localStorage.getItem(
        "zayaxra_profile"
      );

    if (saved) {

      return {
        ...DEFAULT_PROFILE,
        ...JSON.parse(saved)
      };

    }


    const old =
      localStorage.getItem(
        "zayagg_profile"
      );

    if (old) {

      const migrated =
        {
          ...DEFAULT_PROFILE,
          ...JSON.parse(old)
        };

      localStorage.setItem(
        "zayaxra_profile",
        JSON.stringify(migrated)
      );

      return migrated;

    }

  } catch (error) {

    console.warn(
      "Profil okunamadı:",
      error
    );

  }

  return {
    ...DEFAULT_PROFILE
  };

}


function saveProfile() {

  localStorage.setItem(
    "zayaxra_profile",
    JSON.stringify(profile)
  );

}


function renderProfile() {

  if ($("profileAvatar")) {

    $("profileAvatar")
      .textContent =
      profile.avatar;

  }

  if ($("navAvatar")) {

    $("navAvatar")
      .textContent =
      profile.avatar;

  }

  if ($("profileName")) {

    $("profileName")
      .textContent =
      profile.name;

  }

  if ($("profileUsername")) {

    $("profileUsername")
      .textContent =
      profile.username;

  }

  if ($("profileTrades")) {

    $("profileTrades")
      .textContent =
      profile.trades;

  }

  if ($("profileWins")) {

    $("profileWins")
      .textContent =
      profile.wins;

  }

  if ($("profileFair")) {

    $("profileFair")
      .textContent =
      profile.fair;

  }

  if ($("profileLosses")) {

    $("profileLosses")
      .textContent =
      profile.losses;

  }


  if ($("youTradeAvatar")) {

    $("youTradeAvatar")
      .textContent =
      profile.avatar;

  }

  if ($("youTradeName")) {

    $("youTradeName")
      .textContent =
      profile.name;

  }

}


function openProfile() {

  const modal =
    $("profileModal");

  if (!modal) return;

  renderProfile();

  $("profileView").style.display =
    "block";

  $("editProfile").style.display =
    "none";

  modal.classList.add("open");

  document.body.style.overflow =
    "hidden";

}


function closeProfile() {

  const modal =
    $("profileModal");

  if (modal) {
    modal.classList.remove("open");
  }

  document.body.style.overflow =
    "";

}


function openEditProfile() {

  if (!$("editProfile")) return;

  $("profileView").style.display =
    "none";

  $("editProfile").style.display =
    "block";


  if ($("editProfileName")) {

    $("editProfileName").value =
      profile.name;

  }

  if ($("editProfileUsername")) {

    $("editProfileUsername").value =
      profile.username;

  }


  currentAvatar =
    profile.avatar;

  updateAvatarButtons();

}


function closeEditProfile() {

  if ($("editProfile")) {

    $("editProfile").style.display =
      "none";

  }

  if ($("profileView")) {

    $("profileView").style.display =
      "block";

  }

}


function selectAvatar(avatar) {

  currentAvatar = avatar;

  updateAvatarButtons();

}


function updateAvatarButtons() {

  document
    .querySelectorAll(
      "#avatarPicker button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.textContent.trim() ===
        currentAvatar
      );

    });

}


function saveEditedProfile() {

  const name =
    $("editProfileName")?.value
      .trim();

  let username =
    $("editProfileUsername")?.value
      .trim();


  if (!name) {

    showToast(
      "⚠️",
      "İsim boş bırakılamaz."
    );

    return;

  }


  if (!username) {
    username = "@kullanici";
  }

  if (!username.startsWith("@")) {
    username = "@" + username;
  }


  profile.name =
    name.substring(0, 30);

  profile.username =
    username.substring(0, 26);

  profile.avatar =
    currentAvatar;


  saveProfile();
  renderProfile();
  closeEditProfile();

  showToast(
    "✓",
    "Profil güncellendi."
  );

}


/* =========================================================
   TRADE STATS
========================================================= */

function recordTradeResult(status) {

  if (
    tradeSessionRecorded ||
    !youTrade.length ||
    !themTrade.length
  ) {
    return;
  }

  tradeSessionRecorded = true;

  profile.trades++;

  if (status === "win") {
    profile.wins++;
  }

  if (status === "fair") {
    profile.fair++;
  }

  if (status === "lose") {
    profile.losses++;
  }

  saveProfile();
  renderProfile();

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showSection(sectionId) {

  document
    .querySelectorAll(".page-section")
    .forEach(section => {

      section.classList.toggle(
        "active",
        section.id === sectionId
      );

    });


  document
    .querySelectorAll(".nav-links a")
    .forEach(link => {

      link.classList.toggle(
        "active",
        link.dataset.section === sectionId
      );

    });


  const menu =
    $("mobileMenu");

  if (menu) {
    menu.classList.remove("open");
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function toggleMenu() {

  const menu =
    $("mobileMenu");

  if (!menu) return;

  menu.classList.toggle("open");

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(icon, text) {

  const toast =
    $("toast");

  if (!toast) return;

  $("toastIcon").textContent =
    icon;

  $("toastText").textContent =
    text;

  toast.classList.add("show");


  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2200);

}


/* =========================================================
   EVENTS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderProfile();

    showSection("home");

    loadDatabase();


    const search =
      $("search");

    if (search) {

      search.addEventListener(
        "input",
        applyValueFilters
      );

    }


    const sort =
      $("sortSelect");

    if (sort) {

      sort.addEventListener(
        "change",
        applyValueFilters
      );

    }


    const rarity =
      $("rarityFilter");

    if (rarity) {

      rarity.addEventListener(
        "change",
        applyValueFilters
      );

    }


    const pickerSearch =
      $("pickerSearch");

    if (pickerSearch) {

      pickerSearch.addEventListener(
        "input",
        renderPicker
      );

    }


    const pickerModal =
      $("petPickerModal");

    if (pickerModal) {

      pickerModal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            pickerModal
          ) {

            closePetPicker();

          }

        }
      );

    }


    const profileModal =
      $("profileModal");

    if (profileModal) {

      profileModal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            profileModal
          ) {

            closeProfile();

          }

        }
      );

    }


    document.addEventListener(
      "keydown",
      event => {

        if (event.key !== "Escape") {
          return;
        }

        closePetPicker();
        closeProfile();

      }
    );

  }
);
