document.addEventListener('DOMContentLoaded', async () => {
  await seedDatabase();
  initTabs();
  initMovementActions();
  initRefreshButtons();
  await refreshAll();

  const searchInput = document.getElementById('inventory-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => ui.renderInventory(), 200);
    });
  }
});

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');

      ui.state.activeTab = target;

      if (target === 'inventory') {
        ui.renderInventory();
      }
    });
  });
}

function initMovementActions() {
  const modal = document.getElementById('movement-modal');

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeMovementModal();
    }
  });

  const fabScan = document.getElementById('fab-scan');
  if (fabScan) {
    fabScan.addEventListener('click', async () => {
      const code = await barcodeScanner.startScan();
      if (!code) return;

      ui.state.isEntry = true;
      ui.state.selectedBatchId = null;

      openMovementModal(true);
      await ui.renderForm();

      const batchInput = document.getElementById('input-batch-number');
      if (batchInput) batchInput.value = code;

      ui.showToast(`Código escaneado: ${code}. Buscando datos...`, true);

      const productData = await lookupBarcode(code);

      if (productData && productData.name) {
        const nameInput = document.getElementById('input-name');
        const activeInput = document.getElementById('input-active-ingredient');
        const presInput = document.getElementById('input-presentation');
        const catInput = document.getElementById('input-category');

        if (nameInput && productData.name) nameInput.value = productData.name;
        if (activeInput && productData.activeIngredient) activeInput.value = productData.activeIngredient;
        if (presInput && productData.presentation) presInput.value = productData.presentation;
        if (catInput && productData.category) catInput.value = productData.category;

        ui.showToast(`Datos encontrados: ${productData.name}`, true);
      } else {
        ui.showToast(`No se encontraron datos. Código: ${code} aplicado como lote.`, false);
      }
    });
  }
}

function openMovementModal(preserveState = false) {
  const modal = document.getElementById('movement-modal');

  modal.innerHTML = buildModalContent();

  requestAnimationFrame(() => {
    modal.classList.add('visible');
  });

  bindModalEvents(preserveState);
}

function closeMovementModal() {
  const modal = document.getElementById('movement-modal');

  modal.classList.remove('visible');

  setTimeout(() => {
    modal.innerHTML = '';
  }, 400);
}

function buildModalContent() {
  return `
    <div class="modal-panel">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <div class="modal-header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          <h2>Registrar Movimiento</h2>
        </div>
        <button class="modal-close-btn" id="modal-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="toggle-group">
          <button class="toggle-btn active-entry" id="toggle-entry">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>
            </svg>
            Entrada
          </button>
          <button class="toggle-btn" id="toggle-exit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12l7-7 7 7"/><path d="M12 19V5"/>
            </svg>
            Salida
          </button>
        </div>

        <div id="form-container"></div>

        <button class="btn-primary mt-20" id="btn-process">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Procesar
        </button>
      </div>
    </div>`;
}

function bindModalEvents(preserveState = false) {
  document.getElementById('modal-close').addEventListener('click', closeMovementModal);

  const entryBtn = document.getElementById('toggle-entry');
  const exitBtn = document.getElementById('toggle-exit');

  entryBtn.addEventListener('click', () => {
    ui.state.isEntry = true;
    ui.state.selectedBatchId = null;
    ui.renderForm();
  });

  exitBtn.addEventListener('click', () => {
    ui.state.isEntry = false;
    ui.state.selectedBatchId = null;
    ui.renderForm();
  });

  document.getElementById('btn-process').addEventListener('click', async () => {
    await processTransaction();
  });

  if (!preserveState) {
    ui.state.isEntry = true;
    ui.state.selectedBatchId = null;
  }
  ui.renderForm();
}

async function processTransaction() {
  const qtyInput = document.getElementById('input-quantity');
  const reasonInput = document.getElementById('input-reason');

  const quantity = parseInt(qtyInput?.value);
  const reason = reasonInput?.value?.trim() || null;

  if (!quantity || quantity <= 0) {
    ui.showToast('La cantidad debe ser un número positivo mayor que cero.', false);
    return;
  }

  try {
    if (ui.state.isEntry) {
      const name = document.getElementById('input-name')?.value?.trim();
      const activeIngredient = document.getElementById('input-active-ingredient')?.value?.trim() || null;
      const presentation = document.getElementById('input-presentation')?.value?.trim() || null;
      const category = document.getElementById('input-category')?.value?.trim() || null;
      const batchNumber = document.getElementById('input-batch-number')?.value?.trim();
      const expiration = document.getElementById('input-expiration')?.value;

      if (!name) {
        ui.showToast('El nombre del medicamento es obligatorio.', false);
        return;
      }
      if (!batchNumber) {
        ui.showToast('El número de lote es obligatorio.', false);
        return;
      }
      if (!expiration) {
        ui.showToast('La fecha de caducidad es obligatoria.', false);
        return;
      }

      let existingMed = await inventory.findMedicationByName(name);
      let medId;

      if (existingMed) {
        medId = existingMed.id;
      } else {
        medId = await inventory.addMedication({
          name,
          activeIngredient: activeIngredient || null,
          presentation: presentation || null,
          category: category || null
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const batchId = await inventory.addBatch({
        medicationId: medId,
        batchNumber,
        expirationDate: expiration,
        entryDate: today,
        quantity: 0
      });

      await inventory.registerEntry(batchId, quantity, reason || 'Ingreso Inicial');
      ui.showToast(`Entrada de ${quantity} uds. registrada para '${name}' (Lote: ${batchNumber}).`, true);

      closeMovementModal();

    } else {
      if (!ui.state.selectedBatchId) {
        ui.showToast('Selecciona un lote para dar salida.', false);
        return;
      }

      await inventory.registerExit(ui.state.selectedBatchId, quantity, reason);
      ui.showToast(`Salida de ${quantity} uds. registrada correctamente.`, true);

      closeMovementModal();
    }

    ui.state.selectedBatchId = null;
    await refreshAll();

  } catch (err) {
    ui.showToast(`Error: ${err.message}`, false);
  }
}

function initRefreshButtons() {
  document.querySelectorAll('.btn-refresh').forEach(btn => {
    btn.addEventListener('click', async () => {
      await refreshAll();
      ui.showToast('Datos actualizados.', true);
    });
  });
}

async function refreshAll() {
  await ui.renderAlerts();
  if (ui.state.activeTab === 'inventory') {
    await ui.renderInventory();
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
