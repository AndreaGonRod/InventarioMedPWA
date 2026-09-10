const ICONS = {
  pill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="M8.5 8.5 15.5 15.5"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>`,
  pkg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M7.5 4.27 16.5 9.42"/></svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>`,
  xCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
};

const ui = {
  state: {
    activeTab: 'alerts',
    isEntry: true,
    selectedBatchId: null
  },

  async renderAlerts() {
    const container = document.getElementById('alerts-list');
    const alerts = await inventory.getAllAlerts();

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          ${ICONS.check}
          <p>Sin alertas activas</p>
          <p class="sub">Todos los lotes están en orden</p>
        </div>`;
      return;
    }

    container.innerHTML = alerts.map(batch => {
      const isCritical = inventory.isCriticalAlert(batch);
      const alertClass = isCritical ? 'critical' : 'warning';
      const reason = inventory.getAlertReason(batch);

      return `
        <div class="alert-card ${alertClass}" data-batch-id="${batch.id}" data-medication-name="${this.escapeHtml(batch.medicationName)}" data-active-ingredient="${this.escapeHtml(batch.activeIngredient)}" data-presentation="${this.escapeHtml(batch.presentation)}" data-category="${this.escapeHtml(batch.category)}" data-expiration="${batch.expirationDate}" data-is-expiring="${batch.expirationDate <= offsetDate(EXPIRY_ALERT_DAYS)}">
          <div class="alert-card-name">${this.escapeHtml(batch.medicationName)}<span class="alert-card-presentation">${this.escapeHtml(batch.presentation || '')}</span></div>
          <div class="alert-card-meta">
            <span>Lote ${this.escapeHtml(batch.batchNumber)}</span>
            <span class="stock">Stock ${batch.quantity}</span>
            <span>Cad. ${formatDate(batch.expirationDate)}</span>
          </div>
          <div class="alert-card-badge">${this.escapeHtml(reason)}</div>
        </div>`;
    }).join('');

    container.querySelectorAll('.alert-card').forEach(card => {
      card.addEventListener('click', () => this.handleAlertClick(card));
    });
  },

  async handleAlertClick(card) {
    const isExpiring = card.dataset.isExpiring === 'true';

    if (isExpiring) {
      this.state.isEntry = false;
      this.state.selectedBatchId = parseInt(card.dataset.batchId);
      openMovementModal(true);
      await this.renderForm();

      const qtyInput = document.getElementById('input-quantity');
      const reasonInput = document.getElementById('input-reason');
      if (qtyInput) qtyInput.value = '';
      if (reasonInput) reasonInput.value = 'Retirada por caducidad';
    } else {
      this.state.isEntry = true;
      this.state.selectedBatchId = null;
      openMovementModal(true);
      await this.renderForm();

      document.getElementById('input-name').value = card.dataset.medicationName || '';
      document.getElementById('input-active-ingredient').value = card.dataset.activeIngredient || '';
      document.getElementById('input-presentation').value = card.dataset.presentation || '';
      document.getElementById('input-category').value = card.dataset.category || '';
      const reasonInput = document.getElementById('input-reason');
      if (reasonInput) reasonInput.value = 'Reposición de stock';
    }
  },

  async renderForm() {
    const formContainer = document.getElementById('form-container');
    const entryBtn = document.getElementById('toggle-entry');
    const exitBtn = document.getElementById('toggle-exit');

    if (!formContainer) return;

    entryBtn.classList.toggle('active-entry', this.state.isEntry);
    exitBtn.classList.toggle('active-exit', !this.state.isEntry);

    if (this.state.isEntry) {
      formContainer.innerHTML = this.renderEntryForm();
    } else {
      formContainer.innerHTML = '';
      await this.renderExitForm(formContainer);
    }
  },

  renderEntryForm() {
    const defaultDate = offsetDate(180);
    return `
      <div class="form-group">
        <label class="form-label" for="input-name">Medicamento <span class="required">*</span></label>
        <input class="form-input" id="input-name" type="text" placeholder="Ej. Paracetamol" autocomplete="off" />
      </div>
      <div class="form-group">
        <label class="form-label" for="input-active-ingredient">Principio Activo</label>
        <input class="form-input" id="input-active-ingredient" type="text" placeholder="Ej. Paracetamol 500mg" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="input-presentation">Presentación</label>
          <input class="form-input" id="input-presentation" type="text" placeholder="Ej. Caja 20 comp" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-category">Categoría</label>
          <input class="form-input" id="input-category" type="text" placeholder="Ej. Analgésico" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="input-batch-number">Núm. Lote <span class="required">*</span></label>
          <input class="form-input" id="input-batch-number" type="text" placeholder="Ej. L-400" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-quantity">Cantidad <span class="required">*</span></label>
          <input class="form-input" id="input-quantity" type="number" inputmode="numeric" placeholder="10" min="1" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="input-expiration">Caducidad <span class="required">*</span></label>
        <input class="form-input" id="input-expiration" type="date" value="${defaultDate}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="input-reason">Motivo (opcional)</label>
        <input class="form-input" id="input-reason" type="text" placeholder="Ej. Reposición..." />
      </div>`;
  },

  async renderExitForm(container) {
    const batches = await inventory.getAllBatches();
    const filteredBatches = batches.filter(b => b.quantity > 0);

    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Lote a retirar <span class="required">*</span></label>
        <input class="form-input" id="exit-search" type="text" placeholder="Buscar por nombre o lote..." />
        <div class="batch-select-list" id="batch-list"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="input-quantity">Cantidad <span class="required">*</span></label>
        <input class="form-input" id="input-quantity" type="number" inputmode="numeric" placeholder="10" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label" for="input-reason">Motivo (opcional)</label>
        <input class="form-input" id="input-reason" type="text" placeholder="..." />
      </div>`;

    const listEl = document.getElementById('batch-list');
    const searchEl = document.getElementById('exit-search');

    const renderBatchList = (list) => {
      listEl.innerHTML = list.map(b => `
        <div class="batch-option ${b.id === this.state.selectedBatchId ? 'selected' : ''}" data-id="${b.id}">
          <div class="batch-option-name">${this.escapeHtml(b.medicationName)}</div>
          <div class="batch-option-info">
            <span>Lote: ${this.escapeHtml(b.batchNumber)}</span>
            <span class="stock">Stock: ${b.quantity}</span>
            <span>Cad: ${formatDate(b.expirationDate)}</span>
          </div>
        </div>`).join('');

      listEl.querySelectorAll('.batch-option').forEach(opt => {
        opt.addEventListener('click', () => {
          this.state.selectedBatchId = parseInt(opt.dataset.id);
          listEl.querySelectorAll('.batch-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
    };

    renderBatchList(filteredBatches);

    searchEl.addEventListener('input', () => {
      const term = searchEl.value.trim().toLowerCase();
      if (!term) {
        renderBatchList(filteredBatches);
        return;
      }
      const matched = filteredBatches.filter(b =>
        b.medicationName.toLowerCase().includes(term) ||
        b.batchNumber.toLowerCase().includes(term) ||
        (b.category && b.category.toLowerCase().includes(term))
      );
      renderBatchList(matched);
    });

    if (this.state.selectedBatchId) {
      const selected = listEl.querySelector(`.batch-option[data-id="${this.state.selectedBatchId}"]`);
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  },

  async renderInventory() {
    const container = document.getElementById('inventory-content');
    const batches = await inventory.getAllBatches();
    const searchText = document.getElementById('inventory-search')?.value?.trim().toLowerCase() || '';

    const filtered = searchText
      ? batches.filter(b =>
          b.medicationName.toLowerCase().includes(searchText) ||
          (b.activeIngredient && b.activeIngredient.toLowerCase().includes(searchText)) ||
          b.batchNumber.toLowerCase().includes(searchText) ||
          (b.category && b.category.toLowerCase().includes(searchText)) ||
          (b.presentation && b.presentation.toLowerCase().includes(searchText))
        )
      : batches;

    const countEl = document.getElementById('inventory-count');
    if (countEl) countEl.textContent = `${filtered.length} lotes`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          ${ICONS.empty}
          <p>Sin resultados</p>
          <p class="sub">${searchText ? 'No hay lotes que coincidan con la búsqueda' : 'El inventario está vacío'}</p>
        </div>`;
      return;
    }

    const tableHtml = `
      <div class="inventory-table-wrapper">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>P. Activo</th>
              <th>Presentación</th>
              <th>Categoría</th>
              <th>Lote</th>
              <th class="cell-center">Entrada</th>
              <th class="cell-center">Caducidad</th>
              <th class="cell-center">Cant.</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(b => {
              const isExp = inventory.isExpired(b.expirationDate);
              const isLow = b.quantity <= LOW_STOCK_THRESHOLD;
              return `<tr>
                <td><strong>${this.escapeHtml(b.medicationName)}</strong></td>
                <td>${this.escapeHtml(b.activeIngredient || '-')}</td>
                <td>${this.escapeHtml(b.presentation || '-')}</td>
                <td>${this.escapeHtml(b.category || '-')}</td>
                <td>${this.escapeHtml(b.batchNumber)}</td>
                <td class="cell-center">${formatDate(b.entryDate)}</td>
                <td class="cell-center ${isExp ? 'cell-expired' : ''}">${formatDate(b.expirationDate)}</td>
                <td class="cell-center ${isLow ? 'cell-low' : ''}">${b.quantity}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="inventory-cards">
        ${filtered.map(b => {
          const isExp = inventory.isExpired(b.expirationDate);
          const isLow = b.quantity <= LOW_STOCK_THRESHOLD;
          return `<div class="inv-card">
            <div class="inv-card-name">${this.escapeHtml(b.medicationName)}</div>
            <dl class="inv-card-details">
              <dt>Lote</dt><dd>${this.escapeHtml(b.batchNumber)}</dd>
              <dt>Stock</dt><dd class="${isLow ? 'cell-low' : ''}">${b.quantity}</dd>
              <dt>Caducidad</dt><dd class="${isExp ? 'cell-expired' : ''}">${formatDate(b.expirationDate)}</dd>
              <dt>Categoría</dt><dd>${this.escapeHtml(b.category || '-')}</dd>
            </dl>
          </div>`;
        }).join('')}
      </div>`;

    container.innerHTML = tableHtml;
  },

  showToast(message, isSuccess) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${isSuccess ? 'success' : 'error'}`;
    toast.innerHTML = `${isSuccess ? ICONS.check : ICONS.xCircle}<span>${this.escapeHtml(message)}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
