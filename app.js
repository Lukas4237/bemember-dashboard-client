var routeTitles = {
  zuhause: "Hallo Anna!",
  kunden: "Kundenprofile",
  bestellungen: "Bestellungen & Aufträge",
  mitgliedschaften: "Mitgliedschaften",
  app: "App Einstellungen",
  auszahlungen: "Auszahlungen"
};
var icons = {
  home: '<span class="figma-icon icon-home"></span>',
  user: '<span class="figma-icon icon-user"></span>',
  "user-plus": '<span class="figma-icon icon-user-plus"></span>',
  bag: '<span class="figma-icon icon-bag"></span>',
  sync: '<span class="figma-icon icon-sync"></span>',
  edit: '<span class="figma-icon icon-edit"></span>',
  "edit-filled": '<span class="figma-icon icon-edit-filled"></span>',
  bank: '<span class="figma-icon icon-bank"></span>',
  support: '<span class="figma-icon icon-support"></span>',
  star: '<span class="figma-icon icon-star"></span>',
  chevron: '<span class="figma-icon icon-chevron"></span>',
  trash: '<span class="figma-icon icon-close"></span>',
  receipt: '<span class="figma-icon icon-receipt"></span>',
  logout: '<span class="figma-icon icon-chevron logout-chevron"></span>',
  pin: '<span class="figma-icon icon-user-plus"></span>'
};
var activities = [
  ["Neuer Nutzer", "12.03.2026"],
  ["Neues Mitglied", "12.03.2026"],
  ["Neuer Bestellung", "12.03.2026"]
];
var customerRows = Array.from({ length: 8 }, () => ["Markus Johann", "-", "-", "-", "-", "-"]);
var transactions = Array.from({ length: 4 }, (_, index) => ["Markus Johann", "-", "-", index === 0 ? "Kauf" : "-", "-", "-"]);
var failedPayments = Array.from({ length: 4 }, (_, index) => ["Markus Johann", "-", "-", index === 0 ? "05.12.2026" : "-", "-"]);
var offerSets = {
  single: [
    {
      title: "10tes Firmenjubiläum",
      meta: "Aktiv vom 10.03.26 bis 12.03.26",
      previewTitle: "Wir werden 10 Jahre alt!",
      previewBody: "Wir feiern unser Jubiläum – und das dank dir! Als Dankeschön wartet eine kleine Überraschung in der App auf dich."
    },
    {
      title: "Neues Teammitglied",
      meta: "Aktiv vom 23.03.26 bis 27.03.26",
      previewTitle: "Neues Teammitglied",
      previewBody: "Lerne unser neues Teammitglied kennen und sichere dir dein Angebot direkt in der App."
    }
  ],
  automated: [
    {
      title: "Silvester",
      meta: "Aktiv immer am 31. Dezember",
      previewTitle: "Ein glanzvolles neues Jahr!",
      previewBody: "Danke für deine Treue in diesem Jahr. Wir wünschen dir einen guten Rutsch und freuen uns darauf, dich auch 2027 bei uns begrüßen zu dürfen."
    },
    {
      title: "Halloween",
      meta: "Aktiv immer am 31. Oktober",
      previewTitle: "Halloween",
      previewBody: "Sichere dir dein saisonales Angebot direkt in der App."
    }
  ]
};
var products = Array.from({ length: 6 }, () => ({
  title: "Wimpernverlängerung",
  desc: "Genieße einen ausdrucksstarken Augenaufschlag mit unseren hochwertigen Einzelwimpern. Wir setzen...",
  tag: "Augen",
  price: "85,00€"
}));
var memberships = [
  ["Glow & Care Essential", "59 €/monatlich"],
  ["Lash & Brow Perfection", "89 €/monatlich"],
  ["Pure Body Wellness", "129 €/monatlich"]
];
var rewards = Array.from({ length: 4 }, () => ({
  title: "Intensive Gesichts-Ausreinigung",
  points: "1300 Punkte",
  desc: "Tauschbar gegen einen 25-€-Gutschein"
}));
var points = [
  ["Empfehlungen", "50 Punkte", "user-plus"],
  ["Google Bewertungen", "80 Punkte", "star"],
  ["Salon Besuch", "100 Punkte", "star"]
];
var news = Array.from({ length: 6 }, () => ({
  title: "Wir haben unsere Membership-Optionen erweitert!",
  desc: "Ab sofort kannst du deinen Kunden noch attraktivere Pakete anbieten. Entdecke neue, flexible Laufzeiten...",
  date: "21.03.26"
}));
function syncDashboardScale() {
  const baseWidth = 956;
  const baseHeight = 577;
  const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
  const stageWidth = Math.max(baseWidth, window.innerWidth / scale);
  const extraWidth = stageWidth - baseWidth;
  document.documentElement.style.setProperty("--dashboard-scale", String(Math.max(scale, 0.1)));
  document.documentElement.style.setProperty("--dashboard-stage-width", `${stageWidth}px`);
  document.documentElement.style.setProperty("--dashboard-main-shift", `${extraWidth / 2}px`);
}
function injectIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((element) => {
    const icon = icons[element.dataset.icon];
    if (icon)
      element.innerHTML = icon;
  });
}
function renderActivity() {
  const target = document.querySelector("#activityList");
  target.innerHTML = activities.map(([title, date]) => `<div class="activity-item"><strong>${title}</strong><span>${date}</span></div>`).join("");
}
function renderRows(targetId, rows) {
  document.querySelector(targetId).innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
}
function renderOffers(mode = "single") {
  const offers = offerSets[mode];
  const list = document.querySelector("#offerList");
  list.innerHTML = offers.map((offer, index) => `
        <button class="offer-item ${index === 0 ? "is-active" : ""}" type="button" data-offer-index="${index}">
          <span><strong>${offer.title}</strong><span>${offer.meta}</span></span>
          <span class="row-actions">
            <span class="round-action">${icons["edit-filled"]}</span>
            ${mode === "automated" ? `<span class="round-action delete">${icons.trash}</span>` : ""}
          </span>
        </button>
      `).join("");
  document.querySelector("#offerPreviewTitle").textContent = offers[0].previewTitle;
  document.querySelector("#offerPreviewBody").textContent = offers[0].previewBody;
  const giftTag = document.querySelector("#giftTagText");
  giftTag.textContent = mode === "automated" ? "Frohes Neues!" : "10tes Firmenjubiläum";
  giftTag.setAttribute("textLength", mode === "automated" ? "56" : "70");
  list.querySelectorAll("[data-offer-index]").forEach((button) => {
    button.addEventListener("click", () => {
      list.querySelectorAll(".offer-item").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const offer = offers[Number(button.dataset.offerIndex)];
      document.querySelector("#offerPreviewTitle").textContent = offer.previewTitle;
      document.querySelector("#offerPreviewBody").textContent = offer.previewBody;
    });
  });
}
function renderProducts() {
  document.querySelector("#productGrid").innerHTML = products.map((product) => `
        <article class="product-card">
          <img src="./assets/treatment-card@2x.png" alt="" />
          <button class="round-action" type="button" aria-label="Behandlung bearbeiten">${icons["edit-filled"]}</button>
          <span class="tag product-type">Behandlung</span>
          <div class="product-body">
            <h3>${product.title}</h3>
            <p>${product.desc}</p>
            <span class="tag product-category">${product.tag}</span>
            <span class="product-price">${product.price}</span>
          </div>
        </article>
      `).join("");
}
function renderMemberships() {
  document.querySelector("#membershipList").innerHTML = memberships.map(([title, price], index) => `
        <button class="membership-item ${index === 0 ? "is-active" : ""}" type="button">
          <span><strong>${title}</strong><span>${price}</span></span>
          <span class="row-actions">
            <span class="round-action">${icons["edit-filled"]}</span>
          </span>
        </button>
      `).join("");
}
function renderRewards() {
  document.querySelector("#rewardGrid").innerHTML = rewards.map((reward) => `
        <article class="reward-card">
          <img src="./assets/reward-card@2x.png" alt="" />
          <span class="points-badge">${reward.points}</span>
          <h3>${reward.title}</h3>
          <p>${reward.desc}</p>
        </article>
      `).join("");
  document.querySelector("#pointsList").innerHTML = points.map(([title, value, icon]) => `
        <div class="point-item">
          <span class="metric-icon" data-icon="${icon}"></span>
          <strong>${title}</strong>
          <span class="point-pill">${value}</span>
        </div>
      `).join("");
  injectIcons(document.querySelector("#pointsList"));
}
function renderNews() {
  document.querySelector("#newsGrid").innerHTML = news.map((item) => `
        <article class="news-card">
          <img src="./assets/news-card@2x.png" alt="" />
          <button class="round-action" type="button" aria-label="Neuigkeit bearbeiten">${icons["edit-filled"]}</button>
          <span class="date-badge">${item.date}</span>
          <div class="news-body">
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
          </div>
        </article>
      `).join("");
}
function setRoute(route) {
  document.documentElement.dataset.route = route;
  document.querySelector("#pageTitle").textContent = routeTitles[route];
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-visible", view.dataset.view === route);
  });
}
function setSettingsTab(tab) {
  document.querySelectorAll(".settings-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.settingsTab === tab);
  });
  document.querySelectorAll(".settings-view").forEach((view) => {
    view.classList.toggle("is-visible", view.id === `settings-${tab}`);
  });
}
function openDrawer() {
  document.querySelector("#drawerBackdrop").hidden = false;
  const drawer = document.querySelector("#accountDrawer");
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  document.querySelector("#drawerBackdrop").hidden = true;
  const drawer = document.querySelector("#accountDrawer");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
}
function openModal() {
  document.querySelector("#modalBackdrop").hidden = false;
  const modal = document.querySelector("#redeemModal");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  document.querySelector("#modalBackdrop").hidden = true;
  const modal = document.querySelector("#redeemModal");
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}
function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.dataset.route;
      history.replaceState(null, "", `#${route}`);
      setRoute(route);
    });
  });
  document.querySelectorAll(".settings-tab").forEach((button) => {
    button.addEventListener("click", () => setSettingsTab(button.dataset.settingsTab));
  });
  document.querySelectorAll("[data-offer-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-offer-mode]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderOffers(button.dataset.offerMode);
    });
  });
  document.querySelector("#profileButton").addEventListener("click", openDrawer);
  document.querySelector("#closeDrawer").addEventListener("click", closeDrawer);
  document.querySelector("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.querySelector("#redeemButton").addEventListener("click", openModal);
  document.querySelector("#closeModal").addEventListener("click", closeModal);
  document.querySelector("#modalBackdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
      closeModal();
    }
  });
  window.addEventListener("hashchange", () => setRoute(getInitialRoute()));
  window.addEventListener("resize", syncDashboardScale);
}
function getInitialRoute() {
  const route = window.location.hash.replace("#", "");
  return routeTitles[route] ? route : "zuhause";
}
function getInitialSettingsTab() {
  const tab = new URLSearchParams(window.location.search).get("settings");
  return ["angebote", "produkte", "mitgliedschaft", "belohnungen", "neuigkeiten", "einstellungen"].includes(tab) ? tab : "angebote";
}
syncDashboardScale();
injectIcons();
renderActivity();
renderRows("#customerRows", customerRows);
renderRows("#transactionRows", transactions);
renderRows("#failedPaymentRows", failedPayments);
renderOffers("single");
renderProducts();
renderMemberships();
renderRewards();
renderNews();
setRoute(getInitialRoute());
setSettingsTab(getInitialSettingsTab());
bindEvents();
