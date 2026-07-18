(function () {
  'use strict';

  const state = {
    selectedCustomers: new Set(),
    selectedProducts: new Set(),
  };

  const norm = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const textIs = (el, value) => norm(el && el.textContent) === value;
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function elementByText(value, root = document, selector = 'h1,h2,h3,h4,label,button,span,p,div') {
    return all(selector, root).find((el) => textIs(el, value));
  }

  function closestCard(element) {
    let current = element;
    while (current && current !== document.body) {
      const style = getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (
        rect.width > 260 &&
        rect.height > 90 &&
        (parseFloat(style.borderWidth) > 0 || parseFloat(style.borderRadius) >= 6)
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return element && element.parentElement;
  }

  function commonParent(a, b) {
    if (!a || !b) return null;
    const parents = new Set();
    for (let node = a; node; node = node.parentElement) parents.add(node);
    for (let node = b; node; node = node.parentElement) {
      if (parents.has(node)) return node;
    }
    return null;
  }

  function iconTrash() {
    return '<span aria-hidden="true" style="font-size:17px">▱</span>';
  }

  function createOverlay(title, options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'bb-overlay';
    overlay.innerHTML = `
      <section class="bb-modal ${options.small ? 'bb-modal--small' : ''}" role="dialog" aria-modal="true" aria-label="${title}">
        <header class="bb-modal-header">
          <h2>${title}</h2>
          <button class="bb-modal-close" type="button" aria-label="Schließen">×</button>
        </header>
        <div class="bb-modal-body"></div>
        <footer class="bb-modal-actions"></footer>
      </section>`;
    const close = () => overlay.remove();
    overlay.querySelector('.bb-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.body.appendChild(overlay);
    return {
      overlay,
      body: overlay.querySelector('.bb-modal-body'),
      actions: overlay.querySelector('.bb-modal-actions'),
      close,
    };
  }

  function confirmation(message, confirmLabel, onConfirm) {
    const modal = createOverlay('Bestätigung', { small: true });
    modal.body.innerHTML = `<p style="font-size:18px;line-height:1.45;margin:0">${message}</p>`;
    modal.actions.innerHTML = `
      <button class="bb-secondary-button" type="button">Nein</button>
      <button class="bb-danger-button" type="button">${confirmLabel}</button>`;
    modal.actions.children[0].addEventListener('click', modal.close);
    modal.actions.children[1].addEventListener('click', () => {
      onConfirm();
      modal.close();
    });
  }

  function mediaPageRoot() {
    const heading = elementByText('Medien', document, 'h1,h2');
    return heading ? heading.closest('main') || heading.parentElement : null;
  }

  function enhanceMediaPage() {
    all('.bb-bulk-toolbar').forEach((toolbar) => toolbar.remove());
  }

  function messagePageRoot() {
    const heading = elementByText('Nachricht', document, 'h1,h2');
    return heading ? heading.closest('main') || heading.parentElement : null;
  }

  function findLabeledControl(root, labelText) {
    const label = elementByText(labelText, root, 'label,span,p,div');
    if (!label) return null;
    const container = label.parentElement;
    return container && container.querySelector('button,input,textarea,select');
  }

  function sampleCustomers() {
    return ['Willi Tilman Claus', 'Marlon Hedwig', 'Marie Pommes', 'Johann Maier', 'Anne Hosenstall'];
  }

  function sampleProducts() {
    return [
      'Beinhaarbehandlung mit Salbe und Gurken',
      'Wimpernverlängerung',
      'Glow Gesichtsbehandlung',
      'Fußpflege Classic',
      'Augen-Glow Set',
    ];
  }

  function customerPicker(onSave) {
    const modal = createOverlay('Empfänger');
    modal.body.innerHTML = `
      <div class="bb-segmented" role="tablist">
        <button type="button" aria-selected="false">Alle Kunden</button>
        <button type="button" aria-selected="true">Bestimmte Kunden</button>
      </div>
      <p class="bb-recipient-summary">${state.selectedCustomers.size} ausgewählt</p>
      <label class="bb-picker-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Kunden suchen"></label>
      <div class="bb-picker-list"></div>`;
    const list = modal.body.querySelector('.bb-picker-list');
    const summary = modal.body.querySelector('.bb-recipient-summary');
    const render = (query = '') => {
      const names = sampleCustomers().filter((name) => name.toLowerCase().includes(query.toLowerCase()));
      list.innerHTML = names.map((name) => `
        <label class="bb-picker-row">
          <input type="checkbox" value="${name}" ${state.selectedCustomers.has(name) ? 'checked' : ''}>
          <span aria-hidden="true" style="display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#eee">◯</span>
          <strong>${name}</strong>
        </label>`).join('');
    };
    render();
    modal.body.querySelector('input[type="search"]').addEventListener('input', (event) => render(event.target.value));
    list.addEventListener('change', (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      if (event.target.checked) state.selectedCustomers.add(event.target.value);
      else state.selectedCustomers.delete(event.target.value);
      summary.textContent = `${state.selectedCustomers.size} ausgewählt`;
    });
    modal.body.querySelector('.bb-segmented button:first-child').addEventListener('click', () => {
      state.selectedCustomers.clear();
      onSave('all');
      modal.close();
    });
    modal.actions.innerHTML = '<button class="bb-secondary-button" type="button">Abbrechen</button><button class="bb-primary-button" type="button">Übernehmen</button>';
    modal.actions.children[0].addEventListener('click', modal.close);
    modal.actions.children[1].addEventListener('click', () => {
      onSave('selected');
      modal.close();
    });
  }

  function productPicker(onSave) {
    const modal = createOverlay('Behandlung/Produkt auswählen');
    modal.body.innerHTML = `
      <label class="bb-picker-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Behandlung/Produkt auswählen"></label>
      <div class="bb-picker-list"></div>`;
    const list = modal.body.querySelector('.bb-picker-list');
    const render = (query = '') => {
      const products = sampleProducts().filter((name) => name.toLowerCase().includes(query.toLowerCase()));
      list.innerHTML = products.map((name) => `
        <label class="bb-picker-row">
          <input type="checkbox" value="${name}" ${state.selectedProducts.has(name) ? 'checked' : ''}>
          <span aria-hidden="true" style="display:grid;place-items:center;width:48px;height:48px;border-radius:7px;background:#e8eef2">▧</span>
          <strong>${name}</strong>
        </label>`).join('');
    };
    render();
    modal.body.querySelector('input[type="search"]').addEventListener('input', (event) => render(event.target.value));
    list.addEventListener('change', (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      if (event.target.checked) state.selectedProducts.add(event.target.value);
      else state.selectedProducts.delete(event.target.value);
    });
    modal.actions.innerHTML = '<button class="bb-secondary-button" type="button">Abbrechen</button><button class="bb-primary-button" type="button">Übernehmen</button>';
    modal.actions.children[0].addEventListener('click', modal.close);
    modal.actions.children[1].addEventListener('click', () => {
      onSave();
      modal.close();
    });
  }

  function enhanceMessagePage() {
    const root = messagePageRoot();
    if (!root || root.dataset.bbMessageReady === 'true') return;
    root.dataset.bbMessageReady = 'true';

    const productControl = findLabeledControl(root, 'Behandlung/Produkt auswählen (optional)');
    if (productControl) {
      productControl.addEventListener('click', (event) => {
        event.preventDefault();
        productPicker(() => {
          productControl.textContent = state.selectedProducts.size
            ? `${state.selectedProducts.size} ausgewählt`
            : 'Auswählen';
        });
      });
    }

    const formCard = closestCard(elementByText('Beschreibung', root, 'label,span,p,div'));
    if (!formCard) return;
    const section = document.createElement('section');
    section.className = 'bb-recipient-section';
    section.innerHTML = `
      <h3>Empfänger</h3>
      <div class="bb-segmented" role="tablist" aria-label="Empfänger auswählen">
        <button type="button" data-mode="all" aria-selected="true">Alle Kunden</button>
        <button type="button" data-mode="selected" aria-selected="false">Bestimmte Kunden</button>
      </div>
      <p class="bb-recipient-summary">Nachricht wird an alle Kunden gesendet.</p>`;
    formCard.appendChild(section);
    const buttons = all('.bb-segmented button', section);
    const summary = section.querySelector('.bb-recipient-summary');
    const setMode = (mode) => {
      buttons.forEach((button) => button.setAttribute('aria-selected', String(button.dataset.mode === mode)));
      summary.textContent = mode === 'all'
        ? 'Nachricht wird an alle Kunden gesendet.'
        : `${state.selectedCustomers.size} bestimmte Kunden ausgewählt.`;
    };
    buttons[0].addEventListener('click', () => setMode('all'));
    buttons[1].addEventListener('click', () => {
      customerPicker((mode) => setMode(mode));
    });
  }

  function enhanceRewardPercent() {
    all('input[type="number"]').forEach((input) => {
      const context = norm(input.parentElement && input.parentElement.parentElement && input.parentElement.parentElement.textContent);
      if (!context.includes('Rabatt wählen')) return;
      input.classList.add('bb-number-input');
      input.min = '0';
      input.max = '100';
      input.step = '1';
      input.style.pointerEvents = 'auto';
      input.style.position = 'relative';
      input.style.zIndex = '2';
    });
  }

  function enhanceMembershipGrid() {
    const heading = all('h1,h2').find((el) => norm(el.textContent).includes('Mitgliedschaft'));
    if (!heading) return;
    const root = heading.closest('main') || heading.parentElement;
    const pagePreview = elementByText('Vorschau Seite', root, 'h2,h3,h4,div');
    const homeSection = elementByText('Home Sektion', root, 'h2,h3,h4,div');
    const sectionPreview = elementByText('Vorschau Sektion', root, 'h2,h3,h4,div');
    if (!pagePreview || !homeSection || !sectionPreview) return;

    const previewCard = closestCard(pagePreview);
    const homeCard = closestCard(homeSection);
    const sectionPreviewCard = closestCard(sectionPreview);
    const titleInput = root.querySelector('input[placeholder*="Titel"]');
    const formCard = closestCard(titleInput);
    const topParent = commonParent(formCard, previewCard);
    const bottomParent = commonParent(homeCard, sectionPreviewCard);
    [topParent, bottomParent].forEach((parent) => {
      if (parent && parent !== root && parent !== document.body) parent.classList.add('bb-membership-equal-grid');
    });
  }

  function run() {
    enhanceMediaPage();
    enhanceMessagePage();
    enhanceRewardPercent();
    enhanceMembershipGrid();
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
})();
