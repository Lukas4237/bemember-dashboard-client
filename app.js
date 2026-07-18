"use strict";

const APP_ROUTES = new Set([
  "belohnungen",
  "belohnung-editor",
  "produkte",
  "produkt-editor",
  "mitgliedschaft",
  "mitgliedschaft-editor",
  "kommunikation",
  "neuigkeit-editor",
  "nachricht-editor",
  "medien",
  "einstellungen"
]);

const ROUTE_PARENTS = {
  "bestellung-detail": "bestellungen",
  "kunde-detail": "kunden",
  "belohnung-editor": "belohnungen",
  "produkt-editor": "produkte",
  "mitgliedschaft-editor": "mitgliedschaft",
  "neuigkeit-editor": "kommunikation",
  "nachricht-editor": "kommunikation"
};

const metrics = [
  ["umsatz", "20.000,00€", "Gesamtumsatz"],
  ["codes", "165", "Codes eingelöst"],
  ["memberships", "34", "Mitgliedschaften"],
  ["referrals", "86", "Empfehlungen"],
  ["average", "56,00€", "Ø Bestellwert"],
  ["points", "20.000", "Punkte vergeben"],
  ["messages", "345", "Nachrichten gesendet"]
];

const orders = Array.from({ length: 16 }, (_, index) => ({
  key: `order-${index + 1}`,
  id: "#1556",
  date: "04.06.2026",
  customer: "Marlon Hedwig",
  items: 3,
  valid: "04.07.2026",
  total: "110,75€",
  status: "Bezahlt",
  pointsAwarded: 150,
  paymentRevision: 1,
  pointsCredited: true
}));

const customers = Array.from({ length: 16 }, () => ({
  name: "Willi Tilman Claus",
  points: "1450",
  membership: "ja",
  orders: "12",
  spent: "340,45€",
  messages: "34"
}));

const rewards = Array.from({ length: 16 }, () => ({
  title: "Title only goes so long as possible..",
  status: "Aktiv",
  period: "11.02.2026-15.02.2026",
  repeat: "Einmalig",
  product: "Mundsalbengel"
}));

const products = Array.from({ length: 12 }, () => ({
  name: "Wimpernbehandlung",
  status: "Aktiv",
  category: "Behandlung",
  points: "40"
}));

const memberships = [
  {
    key: "membership-0",
    title: "Sorana Mitgliedschaft",
    benefits: [
      "Monatliche Auswahl: 1 von 9 Behandlungen im Wert von über 129 €",
      "10 % Rabatt auf jede weitere Behandlung",
      "Zusätzliche exklusive Mitgliederbelohnungen."
    ],
    active: 40
  }
];

const mediaItems = Array.from({ length: 9 }, (_, index) => ({
  file: "59_60cf2b30-e4a8-4a41-879b-379c1eee31a0",
  type: "PNG",
  date: "01.12.2026 um 15:42 Uhr",
  size: "1,75 MB",
  reference: "1 Produkt",
  source: "./assets/treatment-card.png"
}));

const recipientCustomers = Array.from({ length: 6 }, (_, index) => ({
  key: `recipient-${index}`,
  name: "Willi Tilman Claus"
}));

const state = {
  route: "zuhause",
  metric: "umsatz",
  appNavOpen: false,
  dirty: false,
  activeRewardStatus: "Aktiv",
  rewardRecipient: "all",
  rewardRecipientCustomerKeys: new Set(["recipient-0"]),
  messageRecipient: "all",
  messageRecipientCustomerKeys: new Set(["recipient-0"]),
  selectedRewardObject: null,
  activeProductStatus: "Aktiv",
  productCategory: "Behandlung",
  productImages: [],
  productDiscountEnabled: true,
  productPointsEnabled: true,
  selectedOrderKeys: new Set(),
  selectedMediaKeys: new Set(),
  deletedMediaKeys: new Set(),
  selectedMembershipKeys: new Set(),
  deletedMembershipKeys: new Set(),
  membershipBenefits: [memberships[0].benefits[0], ""],
  packageProducts: ["Wimpernbehandlung", "Hautpflege Deluxe", "Wimpernserum 5 ml"],
  membershipProducts: Array.from({ length: 4 }, () => "Beinhaarbehandlung mit Salbe und Gurken"),
  customerPointBalances: new Map([["Marlon Hedwig", 1250]]),
  orderPointsLedger: orders.map((order) => ({
    idempotencyKey: `${order.key}:credit:${order.paymentRevision}`,
    orderKey: order.key,
    customer: order.customer,
    pointsDelta: order.pointsAwarded,
    type: "credit",
    revision: order.paymentRevision
  })),
  tags: ["Haut", "Haare", "Haare", "Haare", "Haut", "Haare", "Haare", "Haare"],
  selectedTags: ["Haut", "Haare"]
};

const mainContent = document.querySelector("#mainContent");
const sidebar = document.querySelector("#sidebar");
const sidebarScrim = document.querySelector("#sidebarScrim");
const appSubnav = document.querySelector("#appSubnav");
const appNavToggle = document.querySelector("#appNavToggle");
const modalLayer = document.querySelector("#modalLayer");
const modal = document.querySelector("#modal");
const toastRegion = document.querySelector("#toastRegion");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createIcons(root = document) {
  if (!window.lucide) return;
  window.lucide.createIcons({
    root,
    attrs: {
      "stroke-width": 1.8,
      "aria-hidden": "true"
    }
  });
}

function routeFamily(route) {
  return ROUTE_PARENTS[route] || route;
}

function routeFromHash() {
  const route = window.location.hash.replace(/^#/, "");
  const allowed = new Set([
    "zuhause",
    "bestellungen",
    "bestellung-detail",
    "kunden",
    "kunde-detail",
    ...APP_ROUTES,
    "auszahlungen"
  ]);
  return allowed.has(route) ? route : "zuhause";
}

function navigate(route) {
  if (route === "auszahlungen") state.appNavOpen = true;
  else if (!APP_ROUTES.has(route)) state.appNavOpen = false;
  window.location.hash = route;
}

function updateNavigation() {
  const family = routeFamily(state.route);
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === family);
  });
  const inApp = APP_ROUTES.has(state.route);
  appNavToggle.classList.toggle("is-open", inApp || state.appNavOpen);
  appNavToggle.setAttribute("aria-expanded", String(inApp || state.appNavOpen));
  appSubnav.hidden = !(inApp || state.appNavOpen);
}

function render() {
  const nextRoute = routeFromHash();
  if (nextRoute === "auszahlungen" && state.route !== nextRoute) {
    state.appNavOpen = true;
  }
  state.route = nextRoute;
  if (state.route !== "medien") {
    state.selectedMediaKeys.clear();
  }
  const views = {
    zuhause: renderHome,
    bestellungen: renderOrders,
    "bestellung-detail": renderOrderDetail,
    kunden: renderCustomers,
    "kunde-detail": renderCustomerDetail,
    belohnungen: renderRewards,
    "belohnung-editor": renderRewardEditor,
    produkte: renderProducts,
    "produkt-editor": renderProductEditor,
    mitgliedschaft: renderMemberships,
    "mitgliedschaft-editor": renderMembershipEditor,
    kommunikation: renderCommunications,
    "neuigkeit-editor": () => renderCommunicationEditor("Neuigkeit"),
    "nachricht-editor": () => renderCommunicationEditor("Nachricht"),
    medien: renderMedia,
    einstellungen: renderSettings,
    auszahlungen: renderPayouts
  };
  mainContent.innerHTML = (views[state.route] || renderHome)();
  updateNavigation();
  enhanceSelects(mainContent);
  bindPageEvents();
  createIcons(mainContent);

  mainContent.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function pageHeader(title, action = "") {
  return `
    <div class="page-header">
      <h1 class="page-title">${title}</h1>
      ${action}
    </div>
  `;
}

function searchField(placeholder, id = "pageSearch") {
  return `
    <label class="search-field">
      <i data-lucide="search"></i>
      <input id="${id}" type="search" placeholder="${placeholder}" autocomplete="off" />
    </label>
  `;
}

function addButton(label, route) {
  return `
    <button class="button primary compact icon-end list-add-button" type="button" data-navigate="${route}">
      ${label}<img class="button-icon" src="./assets/figma-icons/plus.svg" alt="" />
    </button>
  `;
}

function checkboxCell(attributes = "") {
  return `<td class="checkbox-cell"><input type="checkbox" aria-label="Zeile auswählen" ${attributes} /></td>`;
}

function chartSvg() {
  return `
    <div class="chart-wrap" aria-label="Umsatzentwicklung">
      <img src="./assets/home-chart.png" alt="Zeitverlauf der ausgewählten Kennzahl" />
    </div>
  `;
}

function renderHome() {
  return `
    <section class="page page-home">
      <button class="analytics-filter" type="button" id="periodButton">
        <i data-lucide="calendar-days"></i><span>Seit Start</span><i data-lucide="chevron-down"></i>
      </button>
      <div class="analytics-panel">
        <div class="metric-strip">
          ${metrics.map(([key, value, label]) => `
            <button class="metric-card ${state.metric === key ? "is-active" : ""}" type="button" data-metric="${key}">
              <strong>${value}</strong><span>${label}</span>
            </button>
          `).join("")}
        </div>
        <div id="chartTarget">${chartSvg()}</div>
      </div>
    </section>
  `;
}

function hasOrderLedgerEntry(idempotencyKey) {
  return state.orderPointsLedger.some((entry) => entry.idempotencyKey === idempotencyKey);
}

function recordOrderPointsEntry(order, type, revision, pointsDelta) {
  const idempotencyKey = `${order.key}:${type}:${revision}`;
  if (hasOrderLedgerEntry(idempotencyKey)) return false;

  state.orderPointsLedger.push({
    idempotencyKey,
    orderKey: order.key,
    customer: order.customer,
    pointsDelta,
    type,
    revision
  });

  const currentBalance = state.customerPointBalances.get(order.customer) ?? 0;
  state.customerPointBalances.set(order.customer, currentBalance + pointsDelta);
  return true;
}

function applyOrderPaymentTransition(order, nextStatus) {
  if (!order || nextStatus === order.status) return { changed: false, pointsDelta: 0 };

  if (nextStatus === "Bezahlt") {
    const revision = order.paymentRevision + 1;
    const credited = recordOrderPointsEntry(order, "credit", revision, order.pointsAwarded);
    order.paymentRevision = revision;
    order.pointsCredited = true;
    order.status = nextStatus;
    return { changed: true, pointsDelta: credited ? order.pointsAwarded : 0 };
  }

  const reversed = order.pointsCredited
    ? recordOrderPointsEntry(order, "reversal", order.paymentRevision, -order.pointsAwarded)
    : false;
  order.pointsCredited = false;
  order.status = nextStatus;
  return { changed: true, pointsDelta: reversed ? -order.pointsAwarded : 0 };
}

function renderOrders() {
  const selectedOrders = orders.filter((order) => state.selectedOrderKeys.has(order.key));
  const selectedOrder = selectedOrders.length === 1 ? selectedOrders[0] : null;

  return `
    <section class="page orders-page">
      ${pageHeader("Bestellungen")}
      <div class="page-toolbar">${searchField("Bestellung oder Name suchen")}</div>
      <div class="table-shell table-scroll">
        <table class="data-table" data-filterable>
          <colgroup>
            <col style="width:25px" /><col style="width:115px" /><col style="width:118px" />
            <col style="width:180px" /><col style="width:54px" /><col style="width:118px" />
            <col style="width:118px" /><col style="width:122px" />
          </colgroup>
          <thead><tr><th class="checkbox-cell"><input type="checkbox" id="orderSelectAll" aria-label="Alle auswählen" /></th><th class="order-payment-header">${selectedOrder ? `
            <div class="order-status-editor">
              <button class="order-status-button" id="orderStatusButton" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span>${selectedOrder.status}</span><i data-lucide="chevron-down"></i>
              </button>
              <div class="order-status-menu" id="orderStatusMenu" role="listbox" hidden>
                <button type="button" role="option" data-order-payment-value="Nicht bezahlt" aria-selected="${selectedOrder.status === "Nicht bezahlt"}">Nicht bezahlt</button>
                <button type="button" role="option" data-order-payment-value="Bezahlt" aria-selected="${selectedOrder.status === "Bezahlt"}">Bezahlt</button>
              </div>
            </div>
          ` : "Bestellung"}</th><th>Datum</th><th>Kunde</th><th>Artikel</th><th>Gültig bis</th><th>Gesamt</th><th>Zahlungsstatus</th></tr></thead>
          <tbody>
            ${orders.map((order) => `
              <tr data-row-route="bestellung-detail" data-order-key="${order.key}" class="${state.selectedOrderKeys.has(order.key) ? "is-selected" : ""}">
                ${checkboxCell(`data-order-select="${order.key}" ${state.selectedOrderKeys.has(order.key) ? "checked" : ""}`)}
                <td><strong>${order.id}</strong></td><td>${order.date}</td><td>${order.customer}</td>
                <td>${order.items}</td><td>${order.valid}</td><td>${order.total}</td><td>${order.status}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderOrderDetail() {
  return `
    <section class="page order-detail-page">
      <button class="back-button" type="button" data-navigate="bestellungen"><i data-lucide="chevron-left"></i>Zurück</button>
      <div class="editor-toolbar order-detail-toolbar">
        <div class="order-detail-heading">
          <div class="order-id-row">
            <h1 class="order-number">#1556</h1>
            <span class="order-payment-chip">Bezahlt</span>
            <span class="order-paid-at">am 05.05.2026 um 13:02 Uhr</span>
          </div>
          <div class="order-metadata">
            <p class="order-timestamp">Am 05.01.2026 um 13:02 Uhr aufgegeben</p>
            <p class="order-timestamp">Gültig bis 05.02.2026</p>
          </div>
        </div>
        <select class="select-field" id="paymentStatus" aria-label="Zahlungsstatus">
          <option>Nicht bezahlt</option><option selected>Bezahlt</option>
        </select>
      </div>
      <div class="detail-layout">
        <div>
          <section class="detail-card order-products-card">
            <div class="order-lines">
              ${[
                ["Kopfverlängerung", "40 Treuepunkte", "40,00€"],
                ["Wimpernverlängerung", "50 Treuepunkte", "40,00€"],
                ["Beinverlängerung", "35 Treuepunkte", "40,00€"]
              ].map(([name, points, price]) => `
                <div class="order-line">
                  <img src="./assets/treatment-card.png" alt="" />
                  <span>${name}</span><span>${points}</span><strong>${price}</strong>
                </div>
              `).join("")}
              <div class="summary-lines">
                <div class="summary-line"><strong>Gesamt</strong><span>125 Treuepunkte</span><strong>120,00€</strong></div>
              </div>
            </div>
          </section>
          <section class="detail-card order-summary-card">
            <div class="summary-lines">
              <div class="summary-line"><span>Zwischensumme</span><span>2 Artikel</span><strong>120,00€</strong></div>
              <div class="summary-line"><span>Rabatt</span><span>-12% Wimpernverlängerung</span><strong>6,00€</strong></div>
              <div class="summary-line"><span>Steuern</span><span>18,20 € inkl. 19 % MwSt.</span><strong>Enthalten</strong></div>
              <div class="summary-line"><strong>Gesamt</strong><span></span><strong>114,00€</strong></div>
              <div class="summary-line"><span>Bezahlt</span><span></span><strong>114,00€</strong></div>
            </div>
          </section>
          <section class="note-box order-note-box">
            <textarea id="orderNote" placeholder="Notiz hinzufügen..." aria-label="Bestellnotiz"></textarea>
            <button class="button subtle compact" id="saveNote" type="button" disabled>Speichern</button>
          </section>
        </div>
        <aside class="detail-card order-customer-card">
          <p>Name: <strong>Mark Kümmerle</strong></p>
          <p>Gesamte Bestellungen: <strong>2</strong></p>
          <p>Verfügbare Punkte: <strong>1.250 Punkte</strong></p>
          <p>Mitgliedschaft: <strong>Ja</strong></p>
          <p>E-Mail-Adresse: <strong>mark@gmail.com</strong></p>
          <p>Telefonnummer: <strong>01575 334687</strong></p>
          <p>Empfehlungen: <strong>23</strong></p>
        </aside>
      </div>
    </section>
  `;
}

function renderCustomers() {
  return `
    <section class="page customers-page">
      ${pageHeader("Kunden")}
      <div class="page-toolbar">${searchField("Name suchen")}</div>
      <div class="table-shell table-scroll">
        <div class="customer-bulk-actions" id="customerBulkActions" hidden>
          <button class="bulk-selection-clear" id="clearCustomerSelection" type="button" aria-label="Auswahl aufheben">
            <i data-lucide="minus"></i>
          </button>
          <label class="bulk-points-field">
            <input id="bulkPoints" type="number" min="1" step="1" inputmode="numeric" placeholder="Treuepunkte hinzufügen" aria-label="Treuepunkte hinzufügen" />
            <button id="applyBulkPoints" type="button" disabled aria-label="Treuepunkte anwenden"><i data-lucide="check"></i></button>
          </label>
        </div>
        <table class="data-table" data-filterable>
          <colgroup>
            <col style="width:37px" /><col style="width:174px" /><col style="width:127px" />
            <col style="width:87px" /><col style="width:118px" /><col style="width:162px" /><col style="width:148px" />
          </colgroup>
          <thead><tr><th class="checkbox-cell"><input id="customerSelectAll" type="checkbox" aria-label="Alle auswählen" /></th><th>Kundenname</th><th>Aktuelle Punkte</th><th>Mitglied</th><th>Bestellungen</th><th>Ausgegebener Betrag</th><th>Nachrichten erhalten</th></tr></thead>
          <tbody>
            ${customers.map((customer) => `
              <tr data-row-route="kunde-detail">
                ${checkboxCell("data-customer-select")}<td>${customer.name}</td><td>${customer.points}</td><td>${customer.membership}</td>
                <td>${customer.orders}</td><td>${customer.spent}</td><td>${customer.messages}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCustomerDetail() {
  return `
    <section class="page customer-detail-page">
      <button class="back-button" type="button" data-navigate="kunden"><i data-lucide="chevron-left"></i>Zurück</button>
      ${pageHeader("Willi Tilman Claus")}
      <div class="detail-layout customer-detail-layout">
        <section class="detail-card">
          <h2>Kundenspezifische Details</h2>
          <p>Beigetreten am: <strong>02.06.2025</strong></p>
          <p>Telefonnummer: <strong>01575 334687</strong></p>
          <p>E-Mail-Adresse: <strong>mark@gmail.com</strong></p>
          <p>Geburtsdatum: <strong>02.04.1995</strong></p>
          <p>Adresse:<br /><strong>Erika Mustermann<br />Hauptstraße 12<br />10117 Berlin<br />Deutschland</strong></p>
        </section>
        <section class="detail-card">
          <h2>App Details</h2>
          <p>Verfügbare Punkte: <strong>1250</strong></p>
          <p>Ausgegebener Betrag: <strong>360,40€</strong></p>
          <p>Gesamte Bestellungen: <strong>2</strong></p>
          <p>Nachrichten erhalten: <strong>34</strong></p>
          <p>Empfehlungen: <strong>23</strong></p>
          <p>Mitgliedschaft: <strong>Ja</strong><br />Mitglied seit: <strong>02.11.2025</strong><br />Mitgliedschaft verlängert sich am: <strong>02.05.2026</strong></p>
        </section>
      </div>
    </section>
  `;
}

function renderRewards() {
  return `
    <section class="page rewards-page">
      ${pageHeader("Belohnungen")}
      <div class="page-toolbar rewards-toolbar">
        ${searchField("Titel suchen")}
        ${addButton("Mehr hinzufügen", "belohnung-editor")}
      </div>
      <div class="table-shell table-scroll">
        <table class="data-table" data-filterable>
          <colgroup>
            <col style="width:37px" /><col style="width:204px" /><col style="width:75px" />
            <col style="width:184px" /><col style="width:134px" /><col style="width:219px" />
          </colgroup>
          <thead><tr><th class="checkbox-cell"><input type="checkbox" aria-label="Alle auswählen" /></th><th>Titel</th><th>Status</th><th>Einlösbar von/bis</th><th>Wiederholungsrate</th><th>Behandlung/Produkt</th></tr></thead>
          <tbody>
            ${rewards.map((reward, index) => `
              <tr data-row-route="belohnung-editor" class="${index === 0 ? "is-selected" : ""}">
                ${checkboxCell()}<td title="${reward.title}">${reward.title}</td><td>${reward.status}</td>
                <td>${reward.period}</td><td>${reward.repeat}</td><td>${reward.product}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <nav class="figma-pagination rewards-pagination" aria-label="Belohnungen Seiten">
        <button type="button" aria-label="Vorherige Seite"><i data-lucide="chevron-left"></i></button>
        <span class="is-active">1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>...</span><span>47</span>
        <button type="button" aria-label="Nächste Seite"><i data-lucide="chevron-right"></i></button>
      </nav>
    </section>
  `;
}

function renderRewardProductSelection() {
  if (!state.selectedRewardObject) {
    return `
      <button class="button subtle compact reward-object-button" type="button" data-open-object-picker>
        <span data-object-selection-label>Auswählen</span><i data-lucide="database"></i>
      </button>
    `;
  }

  return `
    <div class="reward-selected-object">
      <img src="${state.selectedRewardObject.image}" alt="" />
      <span>${escapeHtml(state.selectedRewardObject.name)}</span>
      <button type="button" data-clear-reward-object aria-label="${escapeHtml(state.selectedRewardObject.name)} entfernen"><i data-lucide="x"></i></button>
    </div>
  `;
}

function recipientCustomerKeys(scope) {
  return scope === "message"
    ? state.messageRecipientCustomerKeys
    : state.rewardRecipientCustomerKeys;
}

function renderRecipientControls(scope, mode) {
  const selectedKeys = recipientCustomerKeys(scope);
  return `
    <div class="recipient-toggle" role="group" aria-label="Empfänger auswählen">
      <button class="${mode === "all" ? "is-active" : ""}" type="button" data-recipient-mode="all" data-recipient-scope="${scope}" aria-pressed="${mode === "all"}">Alle Kunden</button>
      <button class="${mode === "selected" ? "is-active" : ""}" type="button" data-recipient-mode="selected" data-recipient-scope="${scope}" aria-pressed="${mode === "selected"}">Bestimmte Kunden</button>
    </div>
    ${mode === "selected" ? `
      <div class="recipient-customer-panel" data-recipient-panel="${scope}">
        <span class="recipient-selection-count" data-recipient-count>${selectedKeys.size} ausgewählt</span>
        <div class="recipient-customer-list">
          <div class="recipient-search-row">
            <label class="recipient-search"><i data-lucide="search"></i><input type="search" data-recipient-search="${scope}" placeholder="Kunden suchen" autocomplete="off" /></label>
          </div>
          ${recipientCustomers.map((customer) => {
            const checked = selectedKeys.has(customer.key);
            return `
              <label class="recipient-customer-row ${checked ? "is-selected" : ""}" data-recipient-row data-recipient-name="${customer.name.toLocaleLowerCase("de")}">
                <input type="checkbox" data-recipient-customer="${customer.key}" data-recipient-scope="${scope}" ${checked ? "checked" : ""} />
                <span>${escapeHtml(customer.name)}</span>
              </label>
            `;
          }).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

function editorToolbar(title, status, backRoute) {
  return `
    <button class="back-button" type="button" data-navigate="${backRoute}"><i data-lucide="chevron-left"></i>Zurück</button>
    <div class="editor-toolbar">
      <div class="editor-title-row">
        <h1 class="editor-title">${title}</h1>
        <select class="select-field editor-status" aria-label="Status">
          <option ${status === "Aktiv" ? "selected" : ""}>Aktiv</option>
          <option ${status === "Inaktiv" ? "selected" : ""}>Inaktiv</option>
        </select>
        <button class="button danger compact" type="button" data-delete-object><span>Löschen</span><i data-lucide="trash-2"></i></button>
      </div>
      <button class="button primary compact" id="editorSave" type="button" disabled>Speichern<i data-lucide="bookmark"></i></button>
    </div>
  `;
}

function renderRewardEditor() {
  return `
    <section class="page reward-editor-page">
      ${editorToolbar("Titel", state.activeRewardStatus, "belohnungen")}
      <form class="editor-grid reward-editor-grid" data-editor-form>
        <div class="editor-stack">
          <section class="editor-card reward-basic-card ${state.selectedRewardObject ? "has-selected-object" : ""}">
            <div class="reward-product-row ${state.selectedRewardObject ? "has-selected-object" : ""}">
              <span class="field-label">Behandlung/Produkt</span>
              ${renderRewardProductSelection()}
            </div>
            <div class="reward-discount-row">
              <label for="rewardDiscount">Rabatt wählen</label>
              <div class="reward-discount-input"><input id="rewardDiscount" type="number" min="0" max="100" placeholder="00" /><span>%</span></div>
            </div>
            <div class="field reward-color-field"><label for="rewardColor">Belohnung Farbe</label><div class="color-control"><input class="color-swatch" id="rewardColor" type="color" value="#009dd7" /><i data-lucide="pencil"></i><input type="text" value="#000000" aria-label="Farbwert" /></div></div>
          </section>
          <section class="editor-card reward-dates-card">
            <h2>Einlösbar von/bis</h2>
            <div class="field-grid">
              <div class="field"><label for="rewardStartDate">Startdatum</label><input id="rewardStartDate" type="date" value="2026-03-11" data-reward-start-date /></div>
              <div class="field"><label for="rewardStartTime">Startzeit</label><input id="rewardStartTime" type="time" aria-label="Startzeit" /></div>
              <div class="field"><label for="rewardEndDate">Enddatum</label><input id="rewardEndDate" type="date" value="2026-03-13" min="2026-03-11" data-reward-end-date /></div>
              <div class="field"><label for="rewardEndTime">Endzeit</label><input id="rewardEndTime" type="time" aria-label="Endzeit" /></div>
            </div>
            <div class="reward-repeat-row">
              <label for="rewardRepeat">Wiederholungsrate</label>
              <select id="rewardRepeat"><option>Einmalig</option><option>Jährlich</option><option>Monatlich</option><option>Wöchentlich</option><option>Halbjährlich</option></select>
            </div>
          </section>
          <section class="editor-card reward-recipient-card ${state.rewardRecipient === "selected" ? "is-selected" : ""}">
            <h2>Empfänger</h2>
            ${renderRecipientControls("reward", state.rewardRecipient)}
          </section>
        </div>
        <div class="editor-stack">
          <section class="editor-card reward-message-card">
            <h2>Handy-Nachricht</h2>
            <div class="field"><label>Titel</label><input type="text" placeholder="Titel hinzufügen..." /></div>
            <div class="field"><label>Beschreibung</label><textarea placeholder="Beschreibung hinzufügen..."></textarea></div>
          </section>
          <section class="editor-card reward-preview-card">
            <h2>Vorschau</h2>
            <img src="./assets/gift-preview-figma.png" alt="Belohnungsvorschau" />
          </section>
        </div>
      </form>
    </section>
  `;
}

function renderProducts() {
  return `
    <section class="page product-page">
      ${pageHeader("Behandlungen/Produkte")}
      <div class="page-toolbar product-toolbar">
        ${searchField("Behandlung/Produkt suchen")}
        ${addButton("Mehr hinzufügen", "produkt-editor")}
      </div>
      <div class="table-shell table-scroll">
        <table class="data-table" data-filterable>
          <colgroup><col style="width:37px" /><col style="width:265px" /><col style="width:98px" /><col style="width:161px" /><col style="width:292px" /></colgroup>
          <thead><tr><th class="checkbox-cell"><input type="checkbox" aria-label="Alle auswählen" /></th><th>Name</th><th>Status</th><th>Kategorie</th><th>Punkte pro Kauf</th></tr></thead>
          <tbody>
            ${products.map((product, index) => `
              <tr data-row-route="produkt-editor" class="${index === 0 ? "is-selected" : ""}">
                ${checkboxCell()}<td>${product.name}</td><td>${product.status}</td><td>${product.category}</td><td>${product.points}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProductPricingFields() {
  if (state.productCategory === "Geschenk") {
    return `
      <div class="product-pricing-section product-gift-pricing">
        <div class="field compact-value-field gift-points-field">
          <label>Benötigte Treuepunkte für dieses Geschenk</label>
          <div class="value-suffix points">
            <input type="text" inputmode="numeric" pattern="[0-9]*" value="0" data-points-input aria-label="Benötigte Treuepunkte" />
            <span>Punkte</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="product-pricing-section product-standard-pricing">
      <div class="field compact-value-field">
        <label>Regulärer Preis</label>
        <div class="value-suffix"><input type="text" inputmode="decimal" value="0" data-price-input aria-label="Regulärer Preis" /><span>€</span></div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" id="discountToggle" ${state.productDiscountEnabled ? "checked" : ""} />
        <span>Rabattierten Preis festlegen</span>
      </label>
      <div class="product-discount-fields" ${state.productDiscountEnabled ? "" : "hidden"}>
        <div class="field compact-value-field">
          <label>Rabattierter Preis</label>
          <div class="value-suffix"><input type="text" inputmode="decimal" value="0" data-price-input aria-label="Rabattierter Preis" /><span>€</span></div>
        </div>
        <div class="field-help">
          <i data-lucide="info"></i>
          <span>Der rabattierte Preis muss niedriger als der reguläre Preis sein, um im Shop automatisch als Rabatt angezeigt zu werden.</span>
        </div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" id="pointsToggle" ${state.productPointsEnabled ? "checked" : ""} />
        <span>Treuepunkte festlegen</span>
      </label>
      <div class="product-points-fields" ${state.productPointsEnabled ? "" : "hidden"}>
        <div class="field compact-value-field">
          <label>Treuepunkte</label>
          <div class="value-suffix points"><input type="text" inputmode="numeric" pattern="[0-9]*" value="0" data-points-input aria-label="Treuepunkte" /><span>Punkte</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderProductMediaPicker() {
  const mediaLimit = state.productCategory === "Paket" ? 3 : 1;
  const coverImage = state.productImages[0]?.source || "";
  const imageStyle = coverImage ? ` style="background-image:url('${escapeHtml(coverImage)}')"` : "";
  return `
    <button class="media-picker product-media-picker ${coverImage ? "has-image" : ""}" type="button" data-open-media data-media-context="product" data-media-limit="${mediaLimit}"${imageStyle}>
      <i data-lucide="image-plus"></i>
      ${state.productImages.length > 1 ? `<span class="media-picker-image-count">${state.productImages.length}</span>` : ""}
    </button>
  `;
}

function renderProductEditor() {
  return `
    <section class="page product-editor-page">
      ${editorToolbar("Wimpernbehandlung", state.activeProductStatus, "produkte")}
      <form class="editor-grid product-editor-grid" data-editor-form>
        <div class="editor-stack">
          <section class="editor-card product-category-card">
            <div class="field">
              <label for="productCategory">Kategorie</label>
              <select id="productCategory">
                ${["Behandlung", "Produkt", "Geschenk", "Paket"].map((option) => `<option ${state.productCategory === option ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </div>
          </section>
          <section class="editor-card product-content-card ${state.productCategory === "Paket" ? "has-package-fields" : ""}">
            <div class="field"><label>Titel</label><input type="text" placeholder="Titel hinzufügen..." /></div>
            <div class="field"><label>Beschreibung</label><textarea placeholder="Beschreibung hinzufügen..."></textarea></div>
            <div class="field">
              <label>Bild</label>
              ${renderProductMediaPicker()}
            </div>
            <div id="packageFields" class="package-products-field" ${state.productCategory === "Paket" ? "" : "hidden"}>
              <div class="field package-fields-label"><label>Enthaltene Behandlungen/Produkte</label></div>
              <div class="list-editor-items">
                ${state.packageProducts.map((name, index) => `
                  <div class="list-editor-item"><img src="./assets/treatment-card.png" alt="" /><span>${name}</span><button type="button" aria-label="${name} entfernen" data-remove-package-product-index="${index}"><i data-lucide="x"></i></button></div>
                `).join("")}
              </div>
              <button class="soft-action" type="button" data-open-object-picker><i data-lucide="circle-plus"></i>Weiteres Produkt hinzufügen</button>
            </div>
          </section>
          <section class="editor-card product-pricing-card">
            ${renderProductPricingFields()}
          </section>
        </div>
        <section class="editor-card product-tags-card">
          <h2>Tag-Filter ausgewählt</h2>
          <div class="tag-list" id="selectedProductTags">
            ${state.selectedTags.map((tag) => `<span class="tag selected">${tag}<button type="button" data-remove-product-tag="${tag}"><i data-lucide="x"></i></button></span>`).join("")}
          </div>
          <hr style="border:0;border-top:1px solid var(--line);margin:14px 0" />
          <div class="field-label" style="margin-bottom:9px">Tag-Filter verfügbar (In den App Einstellungen verwaltet):</div>
          <div class="tag-list">
            ${["Füße", "Hände", "Rücken", "Augenbrauen", "Hals", "Nägel"].map((tag) => `<button class="tag" type="button" data-add-product-tag="${tag}">+ ${tag}</button>`).join("")}
          </div>
        </section>
      </form>
    </section>
  `;
}

function renderMemberships() {
  const visibleMemberships = memberships.filter((membership) => !state.deletedMembershipKeys.has(membership.key));
  [...state.selectedMembershipKeys].forEach((key) => {
    if (!visibleMemberships.some((membership) => membership.key === key)) state.selectedMembershipKeys.delete(key);
  });
  const selectedCount = state.selectedMembershipKeys.size;

  return `
    <section class="page membership-page">
      ${pageHeader("Mitgliedschaft", addButton("Mehr hinzufügen", "mitgliedschaft-editor"))}
      <div class="table-shell table-scroll membership-table-shell ${selectedCount > 0 ? "is-selecting" : ""}">
        <div class="membership-selection-actions" ${selectedCount > 0 ? "" : "hidden"}>
          <button class="button danger compact membership-delete-button" type="button" data-membership-delete>
            <span>Löschen</span><i data-lucide="trash-2"></i>
          </button>
        </div>
        <table class="data-table">
          <colgroup><col style="width:37px" /><col style="width:265px" /><col style="width:332px" /><col style="width:219px" /></colgroup>
          <thead><tr><th class="checkbox-cell"><input id="membershipSelectAll" type="checkbox" aria-label="Alle auswählen" /></th><th>Titel</th><th>Enthalten</th><th>Aktive Mitglieder</th></tr></thead>
          <tbody>
            ${visibleMemberships.map((membership) => `
              <tr data-row-route="mitgliedschaft-editor" class="${state.selectedMembershipKeys.has(membership.key) ? "is-selected" : ""}">
                ${checkboxCell(`data-membership-select="${membership.key}" ${state.selectedMembershipKeys.has(membership.key) ? "checked" : ""}`)}<td>${membership.title}</td><td>${membership.benefits.join("<br />")}</td><td>${membership.active}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMembershipEditor() {
  return `
    <section class="page membership-editor-page">
      <button class="back-button" type="button" data-navigate="mitgliedschaft"><i data-lucide="chevron-left"></i>Zurück</button>
      <div class="editor-toolbar membership-editor-toolbar">
        <h1 class="editor-title">Sorana Mitgliedschaft</h1>
        <button class="button primary compact" id="editorSave" type="button" disabled>Speichern<i data-lucide="bookmark"></i></button>
      </div>
      <form class="editor-grid membership-editor-grid" data-editor-form>
        <div class="editor-stack">
          <section class="editor-card membership-main-card">
            <div class="field membership-title-field"><label>Titel</label><input type="text" placeholder="Titel hinzufügen..." /></div>
            <div class="field membership-description-field"><label>Beschreibung</label><textarea placeholder="Beschreibung hinzufügen..."></textarea></div>
            <div class="field membership-benefits-field">
              <label>Vorteilspunkte</label>
              ${state.membershipBenefits.map((benefit, index) => `
                <div class="membership-benefit-row ${benefit ? "" : "empty"}">
                  <input type="text" maxlength="80" value="${escapeHtml(benefit)}" placeholder="Eingeben..." aria-label="Vorteilspunkt ${index + 1}, maximal 80 Zeichen" data-membership-benefit-index="${index}" />
                  <button type="button" aria-label="Vorteilspunkt ${index + 1} entfernen" data-remove-benefit-index="${index}" ${state.membershipBenefits.length <= 2 ? "disabled" : ""}><i data-lucide="x"></i></button>
                </div>
              `).join("")}
              <button class="soft-action" type="button" data-add-benefit ${state.membershipBenefits.length >= 3 ? "disabled" : ""}><i data-lucide="circle-plus"></i>Vorteilspunkt hinzufügen</button>
            </div>
            <div class="field-grid three membership-price-grid">
              <div class="field"><label>Mitgliedschaft Preis</label><div class="membership-value"><input type="text" value="0" /><span>€ / Monat</span></div></div>
              <div class="field"><label>Mindestlaufzeit</label><div class="membership-value"><input type="text" value="0" /><span>Monate</span></div></div>
              <div class="field"><label>Kundenrabatt</label><div class="membership-value"><input type="text" value="0" /><span>%</span></div></div>
            </div>
            <div class="field membership-products-field">
              <label>Ausgewählte Produkte</label>
              <div class="list-editor-items">
                ${state.membershipProducts.map((name, index) => `
                  <div class="list-editor-item"><img src="./assets/treatment-card.png" alt="" /><span>${name}</span><button type="button" aria-label="${name} entfernen" data-remove-membership-product-index="${index}"><i data-lucide="x"></i></button></div>
                `).join("")}
              </div>
              <button class="soft-action" type="button" data-open-object-picker><i data-lucide="circle-plus"></i>Weiteres Produkt hinzufügen</button>
            </div>
            <div class="field membership-cta-field"><label>CTA Button</label><input type="text" placeholder="Text hinzufügen..." /></div>
          </section>
          <section class="editor-card membership-home-card">
            <h2>Home Sektion</h2>
            <div class="field"><label>Titel</label><input type="text" placeholder="Titel hinzufügen..." /></div>
            <div class="field"><label>Beschreibung</label><textarea placeholder="Beschreibung hinzufügen..."></textarea></div>
            <div class="field"><label>CTA Button</label><input type="text" placeholder="Text hinzufügen..." /></div>
          </section>
        </div>
        <div class="editor-stack">
          <section class="editor-card membership-preview-card">
            <h2>Vorschau Seite</h2>
            <div class="membership-phone-preview">
              <div class="preview-app-header">
                <strong>Mitgliedschaft</strong>
                <span class="preview-cart"><i data-lucide="shopping-cart"></i><b>4</b></span>
              </div>
              <div class="preview-membership-body">
                <h3>Mehr Ersparnis als Beitrag:<br />Das Abo, das sich selbst trägt.</h3>
                <p>Zahlt sich von alleine ab: Spare bei jeder Session und maximiere Deine Ergebnisse. Mindestens 6 Monate für besten Erfolg.</p>
                <h3>99€/ pro Monat</h3>
                <ul>
                  ${memberships[0].benefits.map((benefit) => `<li><i data-lucide="badge-check"></i><span>${benefit}</span></li>`).join("")}
                </ul>
                <h4>Monatliche Auswahl:</h4>
                <div class="phone-product-row">
                  ${Array.from({ length: 3 }, () => `<div class="phone-product"><img src="./assets/treatment-card.png" alt="" /><div><strong>Wimpernverlängerung</strong><small>Augen</small><span>129,00€</span><button type="button">Für 0 € einlösen</button></div></div>`).join("")}
                </div>
                <button class="preview-cta" type="button">Jetzt über 100 € im Jahr sparen</button>
              </div>
              <div class="preview-bottom-nav">
                <span><i data-lucide="house"></i>Home</span>
                <span><i data-lucide="shopping-bag"></i>Shop</span>
                <span><i data-lucide="gift"></i>Geschenke</span>
                <span class="active"><i data-lucide="badge"></i>Mitglied</span>
                <span><i data-lucide="shopping-bag"></i>Bestellungen</span>
              </div>
            </div>
          </section>
          <section class="editor-card membership-section-card">
            <h2>Vorschau Sektion</h2>
            <div class="membership-section-preview">
              <strong>Spare <span>100€+</span> im Jahr</strong>
              <p>Sichere dir exklusive Vorteile &amp;<br />Rabatte als Mitglied bei uns.</p>
              <a href="#mitgliedschaft">Zu den Vorteilen <b>›</b></a>
            </div>
          </section>
        </div>
      </form>
    </section>
  `;
}

function communicationTable(kind, count) {
  const isNews = kind === "news";
  const editorRoute = isNews ? "neuigkeit-editor" : "nachricht-editor";
  return `
    <div class="communication-column">
      <div class="communication-toolbar">
        <h2 class="section-title">${isNews ? "Neuigkeiten" : "Nachrichten"}</h2>
        <button class="button primary compact communication-add ${isNews ? "news-add" : "message-add"}" type="button" data-navigate="${editorRoute}">
          ${isNews ? "Neuigkeit hinzufügen" : "Nachricht hinzufügen"}<i data-lucide="circle-plus"></i>
        </button>
      </div>
      <div class="table-shell table-scroll communication-table-shell">
        <table class="data-table">
          <colgroup><col style="width:37px" /><col style="width:164px" /><col style="width:98px" /><col style="width:116px" /></colgroup>
          <thead><tr><th class="checkbox-cell"><input type="checkbox" aria-label="Alle auswählen" /></th><th>Titel</th><th>Gesendet am</th><th>Erreichte Personen</th></tr></thead>
          <tbody>
            ${Array.from({ length: count }, (_, index) => `
              <tr data-row-route="${editorRoute}" class="${index === (isNews ? 0 : 1) ? "is-selected" : ""}">
                ${checkboxCell()}<td>Text goes here</td><td>21.02.2026</td><td>43</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCommunications() {
  return `
    <section class="page communications-page">
      ${pageHeader("Neuigkeiten/Nachrichten")}
      <div class="split-communications">
        ${communicationTable("news", 7)}
        ${communicationTable("messages", 8)}
      </div>
    </section>
  `;
}

function renderCommunicationEditor(kind) {
  const isMessage = kind === "Nachricht";
  return `
    <section class="page communication-editor-page ${isMessage ? "message-editor-page" : "news-editor-page"}">
      ${pageHeader(kind)}
      <div class="communication-editor-toolbar">
        <h2 class="section-title">${kind}</h2>
        <button class="button primary compact communication-publish" id="editorSave" type="button" disabled>${kind} veröffentlichen<i data-lucide="circle-plus"></i></button>
      </div>
      <form class="editor-card communication-editor-card ${isMessage && state.messageRecipient === "selected" ? "has-selected-recipients" : ""}" data-editor-form>
        <div class="communication-field communication-title-field"><label>Titel</label><input type="text" placeholder="Titel hinzufügen..." /></div>
        <div class="communication-field communication-description-field"><label>Beschreibung</label><textarea placeholder="Beschreibung hinzufügen..."></textarea></div>
        <div class="communication-field communication-image-field"><label>Bild</label><button class="media-picker" type="button" data-open-media><i data-lucide="image-plus"></i></button></div>
        ${isMessage ? `
          <div class="communication-field communication-selection-field"><label>Behandlung/Produkt auswählen (optional)</label><button class="button subtle compact" type="button" data-open-object-picker><span data-object-selection-label>Auswählen</span><i data-lucide="database"></i></button></div>
          <div class="communication-recipient-field ${state.messageRecipient === "selected" ? "is-selected" : ""}">
            <label>Empfänger</label>
            ${renderRecipientControls("message", state.messageRecipient)}
          </div>
        ` : ""}
      </form>
    </section>
  `;
}

function renderMedia() {
  const visibleMediaItems = mediaItems
    .map((item, index) => ({ item, key: `media-${index}` }))
    .filter(({ key }) => !state.deletedMediaKeys.has(key));
  [...state.selectedMediaKeys].forEach((key) => {
    if (!visibleMediaItems.some((entry) => entry.key === key)) state.selectedMediaKeys.delete(key);
  });

  return `
    <section class="page media-page">
      ${pageHeader("Medien")}
      <div class="media-toolbar">
        ${searchField("Dateiname suchen")}
        <button class="button primary media-add" type="button" data-open-media>Mehr hinzufügen<i data-lucide="circle-plus"></i></button>
      </div>
      <div class="table-shell table-scroll media-table-shell">
        <div class="media-selection-actions" hidden>
          <button class="button danger compact media-delete-button" type="button" data-media-delete>
            <span>Löschen</span><i data-lucide="trash-2"></i>
          </button>
        </div>
        <table class="data-table" data-filterable>
          <colgroup><col style="width:37px" /><col style="width:45px" /><col style="width:250px" /><col style="width:176px" /><col style="width:134px" /><col style="width:211px" /></colgroup>
          <thead><tr><th class="checkbox-cell"><input id="mediaSelectAll" type="checkbox" aria-label="Alle auswählen" /></th><th aria-label="Bild"></th><th>Dateiname</th><th>Hinzugefügt am</th><th>Größe</th><th>Referenzen</th></tr></thead>
          <tbody>
            ${visibleMediaItems.map(({ item, key }) => `
              <tr>
                ${checkboxCell(`data-media-select="${key}" ${state.selectedMediaKeys.has(key) ? "checked" : ""}`)}
                <td class="media-thumb-cell"><img src="${item.source || "./assets/treatment-card.png"}" alt="" /></td>
                <td class="media-filename"><span>${item.file}</span><small>${item.type}</small></td>
                <td>${item.date}</td><td>${item.size}</td><td>${item.reference}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="page page-settings">
      ${pageHeader("Einstellungen", `<button class="button primary compact settings-save" id="editorSave" type="button" ${state.dirty ? "" : "disabled"}>Speichern<i data-lucide="bookmark"></i></button>`)}
      <form class="settings-form" data-editor-form>
        <div class="settings-top-grid">
          <section class="settings-card settings-branding-card">
            <div class="settings-asset-field logo-setting">
              <label>Ihr Logo</label>
              <div class="asset-preview"><img src="./assets/brand-logo@2x.png" alt="Aktuelles Logo" /><button class="asset-refresh" type="button" data-open-media data-media-target="logo" aria-label="Logo austauschen"><i data-lucide="refresh-cw"></i></button></div>
            </div>
            <div class="settings-asset-field icon-setting">
              <label>App Icon</label>
              <div class="asset-preview"><img src="./assets/app-icon@2x.png" alt="Aktuelles App Icon" /><button class="asset-refresh" type="button" data-open-media data-media-target="icon" aria-label="App Icon austauschen"><i data-lucide="refresh-cw"></i></button></div>
            </div>
            <div class="settings-brand-controls">
              <div class="settings-control-field">
                <label>Brand Farbe</label>
                <div class="color-control" style="--settings-swatch: #000000"><input class="color-swatch" id="brandColor" type="color" value="#000000" /><i data-lucide="pencil"></i><input id="brandColorText" type="text" value="#000000" /></div>
              </div>
              <div class="settings-control-field">
                <label>Schriftart</label>
                <select><option>Inter</option><option>Manrope</option></select>
              </div>
            </div>
            <div class="settings-asset-field hero-setting">
              <label>Titelbild für Startseite</label>
              <div class="asset-preview hero"><img src="./assets/start-image@2x.png" alt="Aktuelles Startbild" /><button class="asset-refresh" type="button" data-open-media data-media-target="hero" aria-label="Startbild austauschen"><i data-lucide="refresh-cw"></i></button></div>
            </div>
          </section>
          <div class="settings-side-stack">
            <section class="settings-card settings-validity-card">
              <div class="settings-control-field"><label>Gültigkeitsdauer der Bestellungen</label><input type="text" value="30 Tage" readonly /></div>
              <div class="settings-control-field"><label>Nachrichten/Bestellungen automatisch löschen nach:</label><select><option>30 Monaten</option><option>24 Monaten</option><option>12 Monaten</option></select></div>
            </section>
            <section class="settings-card settings-tags-card">
              <div class="field-label">Tag-Filter festlegen:</div>
              <div class="tag-entry"><input id="newTag" type="text" placeholder="Tag-Name eingeben..." /><button class="button primary compact" id="addTag" type="button" disabled>Hinzufügen</button></div>
              <div class="settings-divider"></div>
              <div class="tag-list" id="settingsTags">
                ${state.tags.map((tag, index) => `<span class="tag selected">${tag}<button type="button" data-remove-tag-index="${index}" aria-label="${tag} entfernen"><i data-lucide="x"></i></button></span>`).join("")}
              </div>
            </section>
          </div>
        </div>
        <div class="settings-middle-grid">
          <section class="settings-card settings-points-card">
            <h2>Punktevergabe</h2>
            <div class="settings-points-grid">
              <div class="settings-control-field"><label>Pro Empfehlung</label><input type="text" value="0 Punkte" /><span class="field-help"><i data-lucide="info"></i>Punkte werden vergeben, wenn der Kunde den Link zur App versendet.</span></div>
              <div class="settings-control-field"><label>Pro Registrierung</label><input type="text" value="0 Punkte" /><span class="field-help"><i data-lucide="info"></i>Einmalige Punktegutschrift bei Registrierung in der App.</span></div>
            </div>
          </section>
          <section class="settings-card settings-contact-card">
            <div class="settings-control-field"><label>Telefonnummer</label><input type="tel" placeholder="Telefonnummer hinzufügen..." /></div>
            <div class="settings-control-field"><label>Terminkalender</label><input type="url" placeholder="Terminkalender-Link hinzufügen..." /></div>
          </section>
        </div>
        <div class="legal-grid">
          ${[
            "Impressum",
            "Datenschutzerklärung",
            "AGB",
            "Widerrufsbelehrung"
          ].map((title) => `
            <section class="settings-card legal-card"><h2>${title}</h2><div class="legal-field"><label>Inhalt</label><textarea placeholder="Inhalt hinzufügen..."></textarea></div></section>
          `).join("")}
        </div>
      </form>
    </section>
  `;
}

function renderPayouts() {
  return `
    <section class="page payouts-page">
      <div class="payout-content">
        ${pageHeader("Auszahlungen")}
        <div class="payout-panel">
          <div class="payout-summary">
            <article class="payout-card"><strong>842,50€</strong><span>Verfügbar</span></article>
            <article class="payout-card"><strong>217,00€</strong><span>Ausstehend</span></article>
            <article class="payout-card"><strong>20.07.2026</strong><span>Nächste Auszahlung</span></article>
            <article class="payout-card"><strong>12.180,00€</strong><span>Insgesamt erhalten</span></article>
          </div>
          <section class="payout-bank-card" aria-label="Bankverbindung">
            <div class="payout-bank-meta">
              <i data-lucide="landmark"></i>
              <span><strong>Sparkasse Erlangen ...4821</strong><small>Auszahlung wöchentlich, automatisch</small></span>
            </div>
            <button type="button" disabled>Bankverbindung ändern</button>
          </section>
          <div class="payout-history" aria-label="Auszahlungshistorie">
            <table>
              <colgroup><col /><col /><col /></colgroup>
              <thead><tr><th>Datum</th><th>Betrag</th><th>Status</th></tr></thead>
              <tbody>
                ${[
                  ["23.07.2026", "702,00€", "Unterwegs"],
                  ["16.07.2026", "702,00€", "Unterwegs"],
                  ["09.07.2026", "702,00€", "Bezahlt"],
                  ["03.07.2026", "702,00€", "Bezahlt"],
                  ["16.06.2026", "702,00€", "Bezahlt"]
                ].map(([date, amount, status]) => `
                  <tr><td>${date}</td><td>${amount}</td><td><span>${status}</span><button type="button">Details</button></td></tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function openModal(content, narrow = false) {
  modalLayer.classList.remove("profile-layer", "date-range-layer", "media-library-layer", "object-picker-layer", "media-delete-layer");
  modal.innerHTML = content;
  modal.removeAttribute("style");
  modal.className = "modal" + (narrow ? " narrow" : "");
  modalLayer.hidden = false;
  createIcons(modal);
  const closeButton = modal.querySelector("[data-close-modal]");
  if (closeButton) closeButton.addEventListener("click", closeModal);
}

function closeModal() {
  modalLayer.hidden = true;
  modalLayer.classList.remove("profile-layer", "date-range-layer", "media-library-layer", "object-picker-layer", "media-delete-layer");
  modal.innerHTML = "";
}

function openProfileModal() {
  openModal(`
    <h2 id="modalTitle" class="visually-hidden">Profil</h2>
    <button class="profile-drawer-close" type="button" data-close-modal aria-label="Schließen"><i data-lucide="x"></i></button>
    <article class="profile-drawer-card">
      <span class="profile-drawer-avatar"><i data-lucide="user-round"></i></span>
      <h3>Marie Pommes</h3>
      <p class="profile-drawer-email"><strong>E-Mail:</strong> marie.pommes@gmx.net</p>
      <p class="profile-drawer-support">Passwort vergessen oder Fragen?<br /><a href="mailto:support@bemember.app">support@bemember.app</a></p>
      <button class="profile-logout" type="button" data-profile-logout>
        <i data-lucide="log-out"></i><span>Ausloggen</span>
      </button>
    </article>
  `);
  modal.className = "modal profile-drawer";
  modalLayer.classList.add("profile-layer");
  modal.querySelector("[data-profile-logout]").addEventListener("click", () => {
    closeModal();
    showToast("Abgemeldet");
  });
}

const dateRangeState = {
  start: new Date(2026, 0, 1),
  end: new Date(2026, 6, 9),
  visibleMonth: new Date(2026, 5, 1),
  selectingEnd: false,
  label: "Seit Start"
};

const germanMonths = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatGermanDate(date) {
  return `${date.getDate()}. ${germanMonths[date.getMonth()]} ${date.getFullYear()}`;
}

function calendarMonthMarkup(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => '<span class="calendar-day is-empty"></span>');
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const isStart = dateRangeState.start && key === dateKey(dateRangeState.start);
    const isEnd = dateRangeState.end && key === dateKey(dateRangeState.end);
    const isInRange = dateRangeState.start && dateRangeState.end && date > dateRangeState.start && date < dateRangeState.end;
    const isFuture = date > new Date(2026, 6, 9);
    const classes = [
      "calendar-day",
      isStart || isEnd ? "is-selected" : "",
      isInRange ? "is-in-range" : "",
      isFuture ? "is-future" : ""
    ].filter(Boolean).join(" ");
    cells.push(`<button class="${classes}" type="button" data-calendar-date="${key}">${day}</button>`);
  }
  return `
    <section class="calendar-month">
      <h3>${germanMonths[month]} ${year}</h3>
      <div class="calendar-weekdays">${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="calendar-days">${cells.join("")}</div>
    </section>
  `;
}

function renderDateRangeCalendars() {
  const months = modal.querySelector("[data-calendar-months]");
  if (!months) return;
  const nextMonth = new Date(dateRangeState.visibleMonth.getFullYear(), dateRangeState.visibleMonth.getMonth() + 1, 1);
  months.innerHTML = calendarMonthMarkup(dateRangeState.visibleMonth) + calendarMonthMarkup(nextMonth);
  const startInput = modal.querySelector("[data-range-start]");
  const endInput = modal.querySelector("[data-range-end]");
  startInput.value = dateRangeState.start ? formatGermanDate(dateRangeState.start) : "";
  endInput.value = dateRangeState.end ? formatGermanDate(dateRangeState.end) : "";
  modal.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const [year, month, day] = button.dataset.calendarDate.split("-").map(Number);
      const selected = new Date(year, month - 1, day);
      if (!dateRangeState.selectingEnd) {
        dateRangeState.start = selected;
        dateRangeState.end = null;
        dateRangeState.selectingEnd = true;
      } else {
        if (selected < dateRangeState.start) {
          dateRangeState.end = dateRangeState.start;
          dateRangeState.start = selected;
        } else {
          dateRangeState.end = selected;
        }
        dateRangeState.selectingEnd = false;
        dateRangeState.label = "Benutzerdefiniert";
      }
      renderDateRangeCalendars();
    });
  });
}

function applyDatePreset(preset) {
  const today = new Date(2026, 6, 9);
  const startOfYear = new Date(2026, 0, 1);
  const presets = {
    "Heute": [today, today],
    "Gestern": [new Date(2026, 6, 8), new Date(2026, 6, 8)],
    "Zeitraum bis heute": [startOfYear, today],
    "Black Friday Cyber Monday": [new Date(2026, 10, 27), new Date(2026, 10, 30)],
    "Quartale": [new Date(2026, 3, 1), new Date(2026, 5, 30)]
  };
  if (!presets[preset]) return;
  [dateRangeState.start, dateRangeState.end] = presets[preset];
  dateRangeState.visibleMonth = new Date(dateRangeState.end.getFullYear(), dateRangeState.end.getMonth() - 1, 1);
  dateRangeState.selectingEnd = false;
  dateRangeState.label = preset === "Zeitraum bis heute" ? "Seit Start" : preset;
  modal.querySelectorAll("[data-date-preset]").forEach((button) => button.classList.toggle("is-active", button.dataset.datePreset === preset));
  renderDateRangeCalendars();
}

function openDateRangePicker(periodButton) {
  openModal(`
    <h2 id="modalTitle" class="visually-hidden">Zeitraum auswählen</h2>
    <div class="date-range-picker">
      <aside class="date-range-presets">
        <button type="button" data-date-preset="Heute">Heute</button>
        <button type="button" data-date-preset="Gestern">Gestern</button>
        <span>Letzte</span>
        <button class="is-active" type="button" data-date-preset="Zeitraum bis heute">Zeitraum bis heute</button>
        <button type="button" data-date-preset="Black Friday Cyber Monday">Black Friday Cyber Monday</button>
        <button type="button" data-date-preset="Quartale">Quartale</button>
        <button type="button" data-custom-range>Benutzerdefinierter<br />Zeitraum</button>
      </aside>
      <div class="date-range-main">
        <div class="date-range-inputs">
          <input type="text" readonly data-range-start aria-label="Startdatum" />
          <i data-lucide="arrow-right"></i>
          <input type="text" readonly data-range-end aria-label="Enddatum" />
          <button type="button" aria-label="Datum auswählen"><i data-lucide="clock-3"></i></button>
        </div>
        <div class="calendar-navigation">
          <button type="button" data-calendar-previous aria-label="Vorheriger Monat"><i data-lucide="arrow-left"></i></button>
          <button type="button" data-calendar-next aria-label="Nächster Monat"><i data-lucide="arrow-right"></i></button>
        </div>
        <div class="calendar-months" data-calendar-months></div>
        <div class="date-range-actions">
          <button class="button secondary compact" type="button" data-close-modal>Abbrechen</button>
          <button class="button primary compact" type="button" data-apply-range>Anwenden</button>
        </div>
      </div>
    </div>
  `);
  modal.className = "modal date-range-modal";
  modalLayer.classList.add("date-range-layer");
  renderDateRangeCalendars();
  modal.querySelectorAll("[data-date-preset]").forEach((button) => button.addEventListener("click", () => applyDatePreset(button.dataset.datePreset)));
  modal.querySelector("[data-custom-range]").addEventListener("click", () => {
    dateRangeState.selectingEnd = false;
    dateRangeState.label = "Benutzerdefiniert";
    modal.querySelectorAll("[data-date-preset]").forEach((button) => button.classList.remove("is-active"));
  });
  modal.querySelector("[data-calendar-previous]").addEventListener("click", () => {
    dateRangeState.visibleMonth = new Date(dateRangeState.visibleMonth.getFullYear(), dateRangeState.visibleMonth.getMonth() - 1, 1);
    renderDateRangeCalendars();
  });
  modal.querySelector("[data-calendar-next]").addEventListener("click", () => {
    dateRangeState.visibleMonth = new Date(dateRangeState.visibleMonth.getFullYear(), dateRangeState.visibleMonth.getMonth() + 1, 1);
    renderDateRangeCalendars();
  });
  modal.querySelector("[data-apply-range]").addEventListener("click", () => {
    periodButton.querySelector("span").textContent = dateRangeState.label;
    closeModal();
  });
}

function openConfirmDelete() {
  openModal(`
    <div class="modal-header"><h2 id="modalTitle">Objekt löschen</h2><button class="icon-button" type="button" data-close-modal aria-label="Schließen"><i data-lucide="x"></i></button></div>
    <div class="modal-body"><p style="margin:0">Möchten Sie dieses Objekt wirklich löschen?</p></div>
    <div class="modal-actions"><button class="button secondary" type="button" data-close-modal>Nein</button><button class="button danger" type="button" data-confirm-delete>Ja, löschen</button></div>
  `, true);
  modal.querySelector("[data-confirm-delete]").addEventListener("click", () => {
    closeModal();
    showToast("Objekt wurde gelöscht");
    navigate(routeFamily(state.route));
  });
}

function openMediaDeleteConfirmation(trigger) {
  const selectedMediaKeys = [...document.querySelectorAll("[data-media-select]:checked")]
    .map((checkbox) => checkbox.dataset.mediaSelect);
  if (selectedMediaKeys.length === 0) return;
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(window.innerWidth - 235, Math.max(20, rect.left + 99));
  const top = Math.max(20, rect.top - 122);

  openModal(`
    <div class="media-delete-dialog">
      <p>Möchten Sie diese Medien wirklich löschen?</p>
      <div class="media-delete-actions">
        <button type="button" data-confirm-media-delete>Ja</button>
        <button type="button" data-close-modal>Nein</button>
      </div>
    </div>
  `);
  modal.className = "modal media-delete-confirm";
  modal.style.setProperty("--media-delete-left", `${Math.round(left)}px`);
  modal.style.setProperty("--media-delete-top", `${Math.round(top)}px`);
  modalLayer.classList.add("media-delete-layer");
  modal.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  modal.querySelector("[data-confirm-media-delete]").addEventListener("click", () => {
    selectedMediaKeys.forEach((key) => state.deletedMediaKeys.add(key));
    state.selectedMediaKeys.clear();
    closeModal();
    render();
    showToast("Medien gelöscht");
  });
}

function openMembershipDeleteConfirmation(trigger) {
  const selectedMembershipKeys = [...state.selectedMembershipKeys];
  if (selectedMembershipKeys.length === 0) return;
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(window.innerWidth - 235, Math.max(20, rect.left + 99));
  const top = Math.max(20, rect.top - 122);

  openModal(`
    <div class="media-delete-dialog">
      <p>Möchten Sie diese Mitgliedschaft wirklich löschen?</p>
      <div class="media-delete-actions">
        <button type="button" data-confirm-membership-delete>Ja</button>
        <button type="button" data-close-modal>Nein</button>
      </div>
    </div>
  `);
  modal.className = "modal media-delete-confirm";
  modal.style.setProperty("--media-delete-left", `${Math.round(left)}px`);
  modal.style.setProperty("--media-delete-top", `${Math.round(top)}px`);
  modalLayer.classList.add("media-delete-layer");
  modal.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  modal.querySelector("[data-confirm-membership-delete]").addEventListener("click", () => {
    selectedMembershipKeys.forEach((key) => state.deletedMembershipKeys.add(key));
    state.selectedMembershipKeys.clear();
    closeModal();
    render();
    showToast("Mitgliedschaft gelöscht");
  });
}

function openOrderPaymentConfirmation(order, nextStatus) {
  const markingPaid = nextStatus === "Bezahlt";
  openModal(`
    <div class="modal-header">
      <h2 id="modalTitle">${markingPaid ? "Bestellung als bezahlt markieren" : "Zahlung zurücksetzen"}</h2>
    </div>
    <div class="modal-body">
      <p style="margin:0">${markingPaid
        ? `Möchten Sie ${order.id} als bezahlt markieren und ${order.pointsAwarded} Treuepunkte gutschreiben?`
        : `Möchten Sie ${order.id} als nicht bezahlt markieren und ${order.pointsAwarded} Treuepunkte wieder abziehen?`}</p>
    </div>
    <div class="modal-actions">
      <button class="button secondary" type="button" data-cancel-payment>Abbrechen</button>
      <button class="button ${markingPaid ? "primary" : "danger"}" type="button" data-confirm-payment>
        ${markingPaid ? "Als bezahlt markieren" : "Als nicht bezahlt markieren"}
      </button>
    </div>
  `, true);

  modal.querySelector("[data-cancel-payment]").addEventListener("click", () => {
    closeModal();
    render();
  });

  modal.querySelector("[data-confirm-payment]").addEventListener("click", () => {
    const result = applyOrderPaymentTransition(order, nextStatus);
    state.selectedOrderKeys.clear();
    closeModal();
    render();

    if (!result.changed) return;
    showToast(markingPaid
      ? `${order.pointsAwarded} Treuepunkte gutgeschrieben`
      : `${order.pointsAwarded} Treuepunkte abgezogen`);
  });
}

function closeCustomSelects(except = null) {
  document.querySelectorAll(".custom-select.is-open").forEach((select) => {
    if (select === except) return;
    select.classList.remove("is-open");
    select.querySelector(".custom-select__button")?.setAttribute("aria-expanded", "false");
  });
}

function enhanceSelects(root = document) {
  root.querySelectorAll("select:not([multiple]):not([data-custom-select-ready])").forEach((select) => {
    const originalClasses = [...select.classList];
    const computed = window.getComputedStyle(select);
    const rect = select.getBoundingClientRect();
    const width = Math.max(rect.width, Number.parseFloat(computed.width) || 0, 44);
    const height = Math.max(rect.height, Number.parseFloat(computed.height) || 0, 20);
    const selectedOption = select.options[select.selectedIndex] || select.options[0];
    const shell = document.createElement("div");
    const button = document.createElement("button");
    const menu = document.createElement("div");
    const label = document.createElement("span");

    select.dataset.customSelectReady = "true";
    select.classList.add("native-select-control");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    shell.className = ["custom-select", ...originalClasses].join(" ");
    shell.style.setProperty("--custom-select-width", `${width}px`);
    shell.style.setProperty("--custom-select-height", `${height}px`);
    button.className = "custom-select__button";
    button.type = "button";
    button.disabled = select.disabled;
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", select.getAttribute("aria-label") || select.labels?.[0]?.textContent?.trim() || "Auswahl");
    label.className = "custom-select__label";
    label.textContent = selectedOption?.textContent || "";
    button.append(label);
    button.insertAdjacentHTML("beforeend", '<i data-lucide="chevron-down"></i>');

    menu.className = "custom-select__menu";
    menu.setAttribute("role", "listbox");
    [...select.options].forEach((option, index) => {
      const optionButton = document.createElement("button");
      optionButton.className = "custom-select__option";
      optionButton.type = "button";
      optionButton.dataset.value = option.value;
      optionButton.dataset.index = String(index);
      optionButton.setAttribute("role", "option");
      optionButton.setAttribute("aria-selected", String(option.selected));
      optionButton.textContent = option.textContent;
      optionButton.disabled = option.disabled;
      optionButton.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        closeCustomSelects();
        button.focus();
      });
      menu.append(optionButton);
    });

    select.parentNode.insertBefore(shell, select);
    shell.append(select, button, menu);

    const syncSelection = () => {
      const option = select.options[select.selectedIndex] || select.options[0];
      label.textContent = option?.textContent || "";
      menu.querySelectorAll(".custom-select__option").forEach((item) => {
        item.setAttribute("aria-selected", String(item.dataset.value === select.value));
      });
    };

    const openSelect = () => {
      if (button.disabled) return;
      const willOpen = !shell.classList.contains("is-open");
      closeCustomSelects(willOpen ? shell : null);
      shell.classList.toggle("is-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        const selected = menu.querySelector('[aria-selected="true"]');
        window.requestAnimationFrame(() => selected?.focus());
      }
    };

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openSelect();
    });
    button.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openSelect();
      }
    });
    menu.addEventListener("keydown", (event) => {
      const options = [...menu.querySelectorAll(".custom-select__option:not(:disabled)")];
      const current = options.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeCustomSelects();
        button.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        options[(current + direction + options.length) % options.length]?.focus();
      }
    });
    select.addEventListener("change", syncSelection);
  });

  if (!document.documentElement.dataset.customSelectOutsideBound) {
    document.documentElement.dataset.customSelectOutsideBound = "true";
    document.addEventListener("click", () => closeCustomSelects());
  }
}

function openMediaPicker(trigger = null) {
  const recentMedia = Array.from({ length: 16 }, (_, index) => ({
    id: index,
    name: `59_60cf2b30-e${String(index + 1).padStart(2, "0")}`,
    type: "PNG",
    source: "./assets/treatment-card@2x.png"
  }));
  const requestedMediaLimit = Number.parseInt(trigger?.dataset.mediaLimit || "3", 10);
  const maxSelectedMedia = Number.isInteger(requestedMediaLimit) && requestedMediaLimit > 0 ? requestedMediaLimit : 3;
  const isProductMediaPicker = trigger?.dataset.mediaContext === "product";
  let selectedMedia = isProductMediaPicker
    ? state.productImages.slice(0, maxSelectedMedia).map((item) => ({ ...item }))
    : [];
  const mediaNoun = maxSelectedMedia === 1 ? "Bild" : "Bilder";

  openModal(`
    <div class="media-library-dialog">
      <div class="media-library-heading">
        <h2 id="modalTitle">Bild</h2>
        <button class="media-library-close" type="button" data-close-modal aria-label="Schließen"><i data-lucide="x"></i></button>
      </div>
      <div class="media-library-toolbar">
        <div class="media-library-search"><i data-lucide="search"></i><input type="search" data-media-search placeholder="Dateiname suchen" autocomplete="off" aria-label="Dateiname suchen" /></div>
        <div class="media-library-actions"><span class="media-library-count" data-media-count hidden>0/${maxSelectedMedia} ${mediaNoun}</span><button class="media-library-add" type="button" data-media-confirm disabled>Hinzufügen<i data-lucide="plus-square"></i></button></div>
      </div>
      <div class="media-upload-zone" data-media-drop-zone>
        <input class="visually-hidden" id="mediaLibraryUpload" type="file" accept="image/*" ${maxSelectedMedia > 1 ? "multiple" : ""} />
        <div class="media-upload-empty" data-media-empty>
          <label class="media-upload-button" for="mediaLibraryUpload">Bild hinzufügen<i data-lucide="plus-square"></i></label>
          <span>Oder Bilder per Drag &amp; Drop ablegen</span>
        </div>
        <div class="media-upload-selection" data-media-selection hidden></div>
      </div>
      <h3 class="media-library-subtitle">Zuletzt verwendet:</h3>
      <div class="media-library-grid" data-media-grid>
        ${recentMedia.map((item) => `
          <button class="media-library-item" type="button" data-media-id="${item.id}" data-media-name="${item.name}" data-media-source="${item.source}">
            <img src="${item.source}" alt="" />
            <span title="${item.name}">${item.name}...</span>
            <small>${item.type}</small>
          </button>
        `).join("")}
      </div>
    </div>
  `);
  modal.className = "modal media-library-modal";
  modalLayer.classList.add("media-library-layer");

  const confirm = modal.querySelector("[data-media-confirm]");
  const upload = modal.querySelector("#mediaLibraryUpload");
  const dropZone = modal.querySelector("[data-media-drop-zone]");
  const mediaSearch = modal.querySelector("[data-media-search]");
  const count = modal.querySelector("[data-media-count]");
  const emptyState = modal.querySelector("[data-media-empty]");
  const selectionState = modal.querySelector("[data-media-selection]");

  const renderSelection = () => {
    const hasSelection = selectedMedia.length > 0;
    modal.classList.toggle("has-media-selection", hasSelection);
    dropZone.classList.toggle("has-selection", hasSelection);
    confirm.disabled = !hasSelection;
    count.hidden = !hasSelection;
    count.textContent = `${selectedMedia.length}/${maxSelectedMedia} ${mediaNoun}`;
    emptyState.hidden = hasSelection;
    selectionState.hidden = !hasSelection;
    selectionState.innerHTML = selectedMedia.map((item, index) => `
      <figure class="media-upload-thumbnail">
        <img src="${item.source}" alt="${item.name || `Ausgewähltes Bild ${index + 1}`}" />
        <button type="button" data-remove-media-index="${index}" aria-label="Bild entfernen"><i data-lucide="x"></i></button>
      </figure>
    `).join("");
    selectionState.querySelectorAll("[data-remove-media-index]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedMedia.splice(Number(button.dataset.removeMediaIndex), 1);
        renderSelection();
      });
    });
    modal.querySelectorAll(".media-library-item").forEach((item) => {
      item.classList.toggle("is-selected", selectedMedia.some((media) => media.id === item.dataset.mediaId));
    });
    createIcons(selectionState);
  };

  const chooseSource = (item) => {
    const existingIndex = selectedMedia.findIndex((media) => media.id === String(item.id));
    if (existingIndex >= 0) {
      selectedMedia.splice(existingIndex, 1);
    } else if (selectedMedia.length < maxSelectedMedia) {
      selectedMedia.push({ ...item, id: String(item.id) });
    }
    renderSelection();
  };

  const chooseFile = (file) => {
    if (!file?.type?.startsWith("image/")) return;
    if (selectedMedia.length >= maxSelectedMedia) return;
    chooseSource({
      id: `upload-${file.name}-${file.lastModified}`,
      name: file.name,
      type: file.type,
      source: URL.createObjectURL(file)
    });
  };

  modal.querySelectorAll(".media-library-item").forEach((button) => {
    button.addEventListener("click", () => chooseSource({
      id: button.dataset.mediaId,
      name: button.dataset.mediaName,
      type: "PNG",
      source: button.dataset.mediaSource
    }));
  });
  const filterMedia = (query) => {
    modal.querySelectorAll(".media-library-item").forEach((item) => {
      item.hidden = query.length > 0 && !item.dataset.mediaName.toLocaleLowerCase("de").includes(query);
    });
  };
  mediaSearch.addEventListener("input", (event) => {
    const query = event.currentTarget.value.trim().toLocaleLowerCase("de");
    filterMedia(query);
  });
  upload.addEventListener("change", () => {
    [...(upload.files || [])].slice(0, maxSelectedMedia - selectedMedia.length).forEach(chooseFile);
  });
  ["dragenter", "dragover"].forEach((type) => dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((type) => dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  }));
  dropZone.addEventListener("drop", (event) => {
    [...(event.dataTransfer?.files || [])].slice(0, maxSelectedMedia - selectedMedia.length).forEach(chooseFile);
  });
  confirm.addEventListener("click", () => {
    if (!selectedMedia.length) return;
    const selectedSource = selectedMedia[0].source;
    if (isProductMediaPicker) {
      state.productImages = selectedMedia.slice(0, maxSelectedMedia).map((item) => ({ ...item }));
      markDirty();
      closeModal();
      render();
      showToast(selectedMedia.length === 1 ? "Bild ausgewählt" : `${selectedMedia.length} Bilder ausgewählt`);
      return;
    }
    if (trigger?.classList.contains("media-add")) {
      const now = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date()).replace(",", " um");
      selectedMedia.slice().reverse().forEach((item) => {
        const rawName = item.name || `Bild-${Date.now()}`;
        const extension = rawName.includes(".") ? rawName.split(".").pop().toUpperCase() : "PNG";
        const file = rawName.replace(/\.[^.]+$/, "");
        mediaItems.unshift({
          file,
          type: extension,
          date: `${now} Uhr`,
          size: "1,75 MB",
          reference: "Noch nicht verwendet",
          source: item.source
        });
      });
      closeModal();
      render();
      showToast(selectedMedia.length === 1 ? "Bild hinzugefügt" : `${selectedMedia.length} Bilder hinzugefügt`);
      return;
    }
    if (trigger?.classList.contains("media-picker")) {
      trigger.classList.add("has-image");
      trigger.style.backgroundImage = `url("${selectedSource}")`;
    }
    if (trigger?.dataset.mediaTarget) {
      const previewImage = trigger.closest(".asset-preview")?.querySelector("img");
      if (previewImage) previewImage.src = selectedSource;
    }
    markDirty();
    closeModal();
    showToast(selectedMedia.length === 1 ? "Bild ausgewählt" : `${selectedMedia.length} Bilder ausgewählt`);
  });

  renderSelection();
}

function openObjectPicker(trigger = null) {
  const objects = [
    ["Wimpernverlängerung", "Augen", "treatment"],
    ["Hautpflege Deluxe", "Haut", "treatment"],
    ["Augenbrauen-Styling", "Augen", "treatment"],
    ["Glow Gesichtsbehandlung", "Haut", "treatment"],
    ["Fußpflege Classic", "Füße", "treatment"],
    ["Augen-Glow Set", "Paket", "package"],
    ["Wimpernserum 5 ml", "Augen", "product"],
    ["Maniküre Deluxe", "Hände", "treatment"]
  ];
  const isProductListSelection = Boolean(trigger?.closest(".membership-products-field, .package-products-field"));
  const visibleObjects = isProductListSelection
    ? objects.filter(([, , type]) => type === "treatment" || type === "product")
    : objects;

  openModal(`
    <div class="object-picker-dialog">
      <label class="object-picker-search"><i data-lucide="search"></i><input type="search" data-object-search placeholder="Behandlung/Produkt auswählen" autocomplete="off" /></label>
      <div class="object-picker-list">
        ${visibleObjects.map(([name, category]) => `
          <button class="object-picker-item" type="button" data-object-name="${name}">
            <img src="./assets/treatment-card@2x.png" alt="" />
            <span><strong>${name}</strong><small>${category}</small></span>
          </button>
        `).join("")}
      </div>
    </div>
  `, true);
  modal.className = "modal object-picker-modal";
  modalLayer.classList.add("object-picker-layer");

  modal.querySelector("[data-object-search]").addEventListener("input", (event) => {
    const query = event.currentTarget.value.trim().toLocaleLowerCase("de");
    modal.querySelectorAll(".object-picker-item").forEach((item) => {
      item.hidden = query.length > 0 && !item.dataset.objectName.toLocaleLowerCase("de").includes(query);
    });
  });
  modal.querySelectorAll(".object-picker-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (trigger) {
        const isRewardProductSelection = Boolean(trigger.closest(".reward-product-row"));
        if (isRewardProductSelection) {
          state.selectedRewardObject = {
            name: item.dataset.objectName,
            image: "./assets/treatment-card@2x.png"
          };
          markDirty();
          closeModal();
          render();
          showToast(`${item.dataset.objectName} ausgewählt`);
          return;
        }

        const selectedName = item.dataset.objectName;
        if (trigger.closest(".package-products-field")) {
          state.packageProducts.push(selectedName);
          markDirty();
          closeModal();
          render();
          showToast(`${selectedName} hinzugefügt`);
          return;
        }
        if (trigger.closest(".membership-products-field")) {
          state.membershipProducts.push(selectedName);
          markDirty();
          closeModal();
          render();
          showToast(`${selectedName} hinzugefügt`);
          return;
        }

        trigger.dataset.selectedObject = selectedName;
        const label = trigger.querySelector("[data-object-selection-label]");
        if (label) {
          label.textContent = selectedName;
          trigger.classList.add("has-selection");
        }
      }
      markDirty();
      closeModal();
      showToast(`${item.dataset.objectName} ausgewählt`);
    });
  });
  window.requestAnimationFrame(() => modal.querySelector("[data-object-search]")?.focus());
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i data-lucide="circle-check"></i><span>${escapeHtml(message)}</span>`;
  toastRegion.appendChild(toast);
  createIcons(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function markDirty() {
  state.dirty = true;
  const save = document.querySelector("#editorSave");
  if (save) {
    save.disabled = false;
    save.classList.remove("subtle");
  }
}

function bindSearch() {
  const search = document.querySelector("#pageSearch");
  const table = document.querySelector("[data-filterable]");
  if (!search || !table) return;
  search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("de");
    table.querySelectorAll("tbody tr").forEach((row) => {
      row.hidden = query.length > 0 && !row.textContent.toLocaleLowerCase("de").includes(query);
    });
  });
}

function bindPageEvents() {
  document.querySelectorAll("[data-navigate]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.navigate));
  });
  document.querySelectorAll("[data-row-route]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("input,button,a,select,.custom-select")) return;
      navigate(row.dataset.rowRoute);
    });
  });
  document.querySelectorAll("table input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => event.stopPropagation());
  });
  bindSearch();

  const orderSelectionInputs = [...document.querySelectorAll("[data-order-select]")];
  const orderSelectAll = document.querySelector("#orderSelectAll");
  if (orderSelectionInputs.length && orderSelectAll) {
    const selectedCount = state.selectedOrderKeys.size;
    orderSelectAll.checked = selectedCount === orders.length;
    orderSelectAll.indeterminate = selectedCount > 0 && selectedCount < orders.length;

    orderSelectionInputs.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          state.selectedOrderKeys.add(checkbox.dataset.orderSelect);
        } else {
          state.selectedOrderKeys.delete(checkbox.dataset.orderSelect);
        }
        render();
      });
    });

    orderSelectAll.addEventListener("change", () => {
      state.selectedOrderKeys = orderSelectAll.checked
        ? new Set(orders.map((order) => order.key))
        : new Set();
      render();
    });
  }

  const membershipSelectionInputs = [...document.querySelectorAll("[data-membership-select]")];
  const membershipSelectAll = document.querySelector("#membershipSelectAll");
  const membershipTableShell = document.querySelector(".membership-table-shell");
  const membershipSelectionActions = document.querySelector(".membership-selection-actions");
  const membershipDeleteButton = document.querySelector("[data-membership-delete]");
  if (membershipSelectionInputs.length && membershipSelectAll && membershipTableShell && membershipSelectionActions) {
    const updateMembershipSelection = () => {
      const selectedCount = membershipSelectionInputs.filter((checkbox) => checkbox.checked).length;
      state.selectedMembershipKeys.clear();
      membershipSelectionInputs.forEach((checkbox) => {
        if (checkbox.checked) state.selectedMembershipKeys.add(checkbox.dataset.membershipSelect);
        checkbox.closest("tr")?.classList.toggle("is-selected", checkbox.checked);
      });
      membershipSelectionActions.hidden = selectedCount === 0;
      membershipTableShell.classList.toggle("is-selecting", selectedCount > 0);
      membershipSelectAll.checked = selectedCount === membershipSelectionInputs.length;
      membershipSelectAll.indeterminate = selectedCount > 0 && selectedCount < membershipSelectionInputs.length;
    };

    membershipSelectionInputs.forEach((checkbox) => checkbox.addEventListener("change", updateMembershipSelection));
    membershipSelectAll.addEventListener("change", () => {
      membershipSelectionInputs.forEach((checkbox) => {
        checkbox.checked = membershipSelectAll.checked;
      });
      updateMembershipSelection();
    });
    updateMembershipSelection();
  }
  membershipDeleteButton?.addEventListener("click", () => openMembershipDeleteConfirmation(membershipDeleteButton));

  const orderStatusButton = document.querySelector("#orderStatusButton");
  const orderStatusMenu = document.querySelector("#orderStatusMenu");
  if (orderStatusButton && orderStatusMenu) {
    const closeOrderStatusMenu = () => {
      orderStatusMenu.hidden = true;
      orderStatusButton.setAttribute("aria-expanded", "false");
      orderStatusButton.closest(".order-status-editor")?.classList.remove("is-open");
    };

    orderStatusButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = orderStatusMenu.hidden;
      orderStatusMenu.hidden = !willOpen;
      orderStatusButton.setAttribute("aria-expanded", String(willOpen));
      orderStatusButton.closest(".order-status-editor")?.classList.toggle("is-open", willOpen);
      if (willOpen) {
        document.addEventListener("click", closeOrderStatusMenu, { once: true });
      }
    });

    orderStatusMenu.querySelectorAll("[data-order-payment-value]").forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        const selectedOrders = orders.filter((order) => state.selectedOrderKeys.has(order.key));
        const selectedOrder = selectedOrders.length === 1 ? selectedOrders[0] : null;
        const nextStatus = option.dataset.orderPaymentValue;
        closeOrderStatusMenu();
        if (!selectedOrder || nextStatus === selectedOrder.status) return;
        openOrderPaymentConfirmation(selectedOrder, nextStatus);
      });
    });
  }

  document.querySelectorAll("[data-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      state.metric = button.dataset.metric;
      document.querySelectorAll("[data-metric]").forEach((item) => item.classList.toggle("is-active", item === button));
      const target = document.querySelector("#chartTarget");
      target.innerHTML = chartSvg();
    });
  });

  const periodButton = document.querySelector("#periodButton");
  if (periodButton) {
    periodButton.addEventListener("click", () => openDateRangePicker(periodButton));
  }

  const note = document.querySelector("#orderNote");
  const saveNote = document.querySelector("#saveNote");
  if (note && saveNote) {
    const noteBox = note.closest(".order-note-box");
    note.addEventListener("input", () => {
      const hasText = note.value.trim().length > 0;
      saveNote.disabled = !hasText;
      noteBox.classList.toggle("is-dirty", hasText);
      noteBox.classList.remove("is-saved");
    });
    saveNote.addEventListener("click", () => {
      saveNote.disabled = true;
      noteBox.classList.remove("is-dirty");
      noteBox.classList.add("is-saved");
      showToast("Bestellnotiz gespeichert");
    });
  }

  const customerRows = [...document.querySelectorAll("[data-customer-select]")];
  const customerSelectAll = document.querySelector("#customerSelectAll");
  const customerBulkActions = document.querySelector("#customerBulkActions");
  const clearCustomerSelection = document.querySelector("#clearCustomerSelection");
  const bulkPoints = document.querySelector("#bulkPoints");
  const applyBulkPoints = document.querySelector("#applyBulkPoints");
  if (customerRows.length && customerSelectAll && customerBulkActions && bulkPoints && applyBulkPoints) {
    const updateCustomerSelection = () => {
      const selectedCount = customerRows.filter((checkbox) => checkbox.checked).length;
      customerBulkActions.hidden = selectedCount === 0;
      customerSelectAll.checked = selectedCount === customerRows.length;
      customerSelectAll.indeterminate = selectedCount > 0 && selectedCount < customerRows.length;
      if (selectedCount === 0) {
        bulkPoints.value = "";
        applyBulkPoints.disabled = true;
      }
    };
    customerRows.forEach((checkbox) => checkbox.addEventListener("change", updateCustomerSelection));
    customerSelectAll.addEventListener("change", () => {
      customerRows.forEach((checkbox) => {
        checkbox.checked = customerSelectAll.checked;
      });
      updateCustomerSelection();
    });
    bulkPoints.addEventListener("input", () => {
      applyBulkPoints.disabled = !(Number.isInteger(Number(bulkPoints.value)) && Number(bulkPoints.value) > 0);
    });
    clearCustomerSelection?.addEventListener("click", () => {
      customerRows.forEach((checkbox) => {
        checkbox.checked = false;
      });
      updateCustomerSelection();
    });
    applyBulkPoints.addEventListener("click", () => {
      const selectedCount = customerRows.filter((checkbox) => checkbox.checked).length;
      showToast(`${bulkPoints.value} Treuepunkte für ${selectedCount} Kunden hinzugefügt`);
      customerRows.forEach((checkbox) => {
        checkbox.checked = false;
      });
      updateCustomerSelection();
    });
  }

  const mediaSelectionInputs = [...document.querySelectorAll("[data-media-select]")];
  const mediaSelectAll = document.querySelector("#mediaSelectAll");
  const mediaTableShell = document.querySelector(".media-table-shell");
  const mediaSelectionActions = document.querySelector(".media-selection-actions");
  const mediaDeleteButton = document.querySelector("[data-media-delete]");
  if (mediaSelectionInputs.length && mediaSelectAll && mediaTableShell && mediaSelectionActions) {
    const updateMediaSelection = () => {
      const selectedCount = mediaSelectionInputs.filter((checkbox) => checkbox.checked).length;
      state.selectedMediaKeys.clear();
      mediaSelectionInputs.forEach((checkbox) => {
        if (checkbox.checked) state.selectedMediaKeys.add(checkbox.dataset.mediaSelect);
      });
      mediaSelectionActions.hidden = selectedCount === 0;
      mediaTableShell.classList.toggle("is-selecting", selectedCount > 0);
      mediaSelectAll.checked = selectedCount === mediaSelectionInputs.length;
      mediaSelectAll.indeterminate = selectedCount > 0 && selectedCount < mediaSelectionInputs.length;
      mediaSelectionInputs.forEach((checkbox) => {
        checkbox.closest("tr")?.classList.toggle("is-selected", checkbox.checked);
      });
    };

    mediaSelectionInputs.forEach((checkbox) => {
      checkbox.addEventListener("change", updateMediaSelection);
    });

    mediaSelectAll.addEventListener("change", () => {
      mediaSelectionInputs.forEach((checkbox) => {
        checkbox.checked = mediaSelectAll.checked;
      });
      updateMediaSelection();
    });

    updateMediaSelection();
  }

  mediaDeleteButton?.addEventListener("click", () => openMediaDeleteConfirmation(mediaDeleteButton));

  const editorForm = document.querySelector("[data-editor-form]");
  if (editorForm) {
    editorForm.addEventListener("input", markDirty);
    editorForm.addEventListener("change", markDirty);
  }

  document.querySelectorAll("[data-recipient-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const scope = button.dataset.recipientScope;
      const mode = button.dataset.recipientMode;
      if (scope === "message") state.messageRecipient = mode;
      else state.rewardRecipient = mode;
      const selectedKeys = recipientCustomerKeys(scope);
      if (mode === "selected" && selectedKeys.size === 0) selectedKeys.add(recipientCustomers[0].key);
      markDirty();
      render();
    });
  });

  document.querySelectorAll("[data-recipient-customer]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const scope = checkbox.dataset.recipientScope;
      const selectedKeys = recipientCustomerKeys(scope);
      if (checkbox.checked) selectedKeys.add(checkbox.dataset.recipientCustomer);
      else selectedKeys.delete(checkbox.dataset.recipientCustomer);
      checkbox.closest("[data-recipient-row]")?.classList.toggle("is-selected", checkbox.checked);
      const panel = checkbox.closest("[data-recipient-panel]");
      const count = panel?.querySelector("[data-recipient-count]");
      if (count) count.textContent = `${selectedKeys.size} ausgewählt`;
      markDirty();
    });
  });

  document.querySelectorAll("[data-recipient-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const query = input.value.trim().toLocaleLowerCase("de");
      input.closest("[data-recipient-panel]")?.querySelectorAll("[data-recipient-row]").forEach((row) => {
        row.hidden = query.length > 0 && !row.dataset.recipientName.includes(query);
      });
    });
  });

  const rewardStartDate = document.querySelector("[data-reward-start-date]");
  const rewardEndDate = document.querySelector("[data-reward-end-date]");
  if (rewardStartDate && rewardEndDate) {
    rewardStartDate.addEventListener("change", () => {
      rewardEndDate.min = rewardStartDate.value;
      if (rewardEndDate.value && rewardEndDate.value < rewardStartDate.value) {
        rewardEndDate.value = rewardStartDate.value;
      }
    });
  }

  const editorSave = document.querySelector("#editorSave");
  if (editorSave) {
    editorSave.addEventListener("click", (event) => {
      event.preventDefault();
      editorSave.disabled = true;
      state.dirty = false;
      showToast("Änderungen gespeichert");
    });
  }

  document.querySelectorAll("[data-delete-object]").forEach((button) => button.addEventListener("click", openConfirmDelete));
  document.querySelectorAll("[data-open-media]").forEach((button) => {
    button.addEventListener("click", () => openMediaPicker(button));
  });
  document.querySelectorAll("[data-open-object-picker]").forEach((button) => {
    button.addEventListener("click", () => openObjectPicker(button));
  });
  document.querySelectorAll("[data-clear-reward-object]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRewardObject = null;
      markDirty();
      render();
    });
  });
  document.querySelectorAll(".list-editor-item > button:not([data-remove-package-product-index]):not([data-remove-membership-product-index])").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".list-editor-item")?.remove();
      markDirty();
    });
  });
  document.querySelectorAll("[data-remove-package-product-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.packageProducts.splice(Number(button.dataset.removePackageProductIndex), 1);
      markDirty();
      render();
    });
  });
  document.querySelectorAll("[data-remove-membership-product-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.membershipProducts.splice(Number(button.dataset.removeMembershipProductIndex), 1);
      markDirty();
      render();
    });
  });

  const editorStatus = document.querySelector("select.editor-status");
  if (editorStatus) {
    editorStatus.addEventListener("change", () => {
      if (state.route === "belohnung-editor") state.activeRewardStatus = editorStatus.value;
      if (state.route === "produkt-editor") state.activeProductStatus = editorStatus.value;
    });
  }

  const productCategory = document.querySelector("#productCategory");
  if (productCategory) {
    productCategory.addEventListener("change", () => {
      state.productCategory = productCategory.value;
      const reducedToSingleImage = state.productCategory !== "Paket" && state.productImages.length > 1;
      if (reducedToSingleImage) state.productImages = state.productImages.slice(0, 1);
      markDirty();
      render();
      if (reducedToSingleImage) showToast("Für diese Kategorie ist nur ein Bild möglich");
    });
  }

  const discountToggle = document.querySelector("#discountToggle");
  if (discountToggle) {
    discountToggle.addEventListener("change", () => {
      state.productDiscountEnabled = discountToggle.checked;
      markDirty();
      render();
    });
  }

  const pointsToggle = document.querySelector("#pointsToggle");
  if (pointsToggle) {
    pointsToggle.addEventListener("change", () => {
      state.productPointsEnabled = pointsToggle.checked;
      markDirty();
      render();
    });
  }

  document.querySelectorAll("[data-add-product-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.addProductTag;
      if (!state.selectedTags.includes(tag)) state.selectedTags.push(tag);
      state.dirty = true;
      render();
    });
  });
  document.querySelectorAll("[data-remove-product-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTags = state.selectedTags.filter((tag) => tag !== button.dataset.removeProductTag);
      state.dirty = true;
      render();
    });
  });

  const addBenefit = document.querySelector("[data-add-benefit]");
  if (addBenefit) {
    addBenefit.addEventListener("click", () => {
      if (state.membershipBenefits.length >= 3) return;
      state.membershipBenefits.push("");
      markDirty();
      render();
      document.querySelector(`[data-membership-benefit-index="${state.membershipBenefits.length - 1}"]`)?.focus();
    });
  }
  document.querySelectorAll("[data-membership-benefit-index]").forEach((input) => {
    input.addEventListener("input", () => {
      state.membershipBenefits[Number(input.dataset.membershipBenefitIndex)] = input.value;
      input.closest(".membership-benefit-row")?.classList.toggle("empty", input.value.length === 0);
      markDirty();
    });
  });
  document.querySelectorAll("[data-remove-benefit-index]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.membershipBenefits.length <= 2) return;
      state.membershipBenefits.splice(Number(button.dataset.removeBenefitIndex), 1);
      markDirty();
      render();
    });
  });

  const addTag = document.querySelector("#addTag");
  const newTag = document.querySelector("#newTag");
  if (addTag && newTag) {
    newTag.addEventListener("input", () => {
      addTag.disabled = newTag.value.trim().length === 0;
    });
    addTag.addEventListener("click", () => {
      const value = newTag.value.trim();
      if (value && !state.tags.includes(value)) {
        state.tags.push(value);
        state.dirty = true;
        render();
        showToast("Tag hinzugefügt");
      }
    });
  }
  document.querySelectorAll("[data-remove-tag-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tags.splice(Number(button.dataset.removeTagIndex), 1);
      state.dirty = true;
      render();
    });
  });

  document.querySelectorAll("[data-points-input]").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
      if (!input.value) input.value = "0";
    });
  });

  const brandColor = document.querySelector("#brandColor");
  const brandColorText = document.querySelector("#brandColorText");
  if (brandColor && brandColorText) {
    const colorControl = brandColor.closest(".color-control");
    brandColor.addEventListener("input", () => {
      brandColorText.value = brandColor.value.toUpperCase();
      colorControl?.style.setProperty("--settings-swatch", brandColor.value);
      document.documentElement.style.setProperty("--blue", brandColor.value);
      markDirty();
    });
    brandColorText.addEventListener("change", () => {
      if (/^#[0-9a-f]{6}$/i.test(brandColorText.value)) {
        brandColor.value = brandColorText.value;
        colorControl?.style.setProperty("--settings-swatch", brandColorText.value);
        document.documentElement.style.setProperty("--blue", brandColorText.value);
      }
    });
  }

}

function bindShellEvents() {
  document.querySelectorAll(".nav-item[data-route], .subnav [data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.route);
      closeMobileSidebar();
    });
  });
  appNavToggle.addEventListener("click", () => {
    state.appNavOpen = !state.appNavOpen;
    updateNavigation();
  });
  document.querySelector("#profileButton").addEventListener("click", openProfileModal);
  document.querySelector("#modalBackdrop").addEventListener("click", closeModal);
  document.querySelector("#mobileMenu").addEventListener("click", () => {
    sidebar.classList.add("is-open");
    sidebarScrim.hidden = false;
  });
  sidebarScrim.addEventListener("click", closeMobileSidebar);

  const globalSearch = document.querySelector("#globalSearch");
  globalSearch.addEventListener("input", () => {
    const local = document.querySelector("#pageSearch");
    if (local) {
      local.value = globalSearch.value;
      local.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeMobileSidebar();
    }
  });
}

function closeMobileSidebar() {
  sidebar.classList.remove("is-open");
  sidebarScrim.hidden = true;
}

window.addEventListener("hashchange", () => {
  state.dirty = false;
  render();
});
bindShellEvents();
createIcons();
render();
