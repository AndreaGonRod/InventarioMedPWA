const LOW_STOCK_THRESHOLD = 5;
const EXPIRY_ALERT_DAYS = 14;

const inventory = {

  async getAllMedications() {
    return db.medications.orderBy('name').toArray();
  },

  async addMedication(med) {
    return db.medications.add(med);
  },

  async getAllBatches() {
    const batches = await db.batches.toArray();
    const meds = await db.medications.toArray();
    const medsMap = new Map(meds.map(m => [m.id, m]));

    return batches.map(b => {
      const med = medsMap.get(b.medicationId) || {};
      return {
        ...b,
        medicationName: med.name || 'Desconocido',
        activeIngredient: med.activeIngredient || '',
        presentation: med.presentation || '',
        category: med.category || ''
      };
    }).sort((a, b) => a.medicationName.localeCompare(b.medicationName) || a.expirationDate.localeCompare(b.expirationDate));
  },

  async addBatch(batch) {
    return db.batches.add(batch);
  },

  async registerEntry(batchId, quantity, reason) {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor que cero.');

    const batch = await db.batches.get(batchId);
    if (!batch) throw new Error('El lote seleccionado no existe.');

    const today = new Date().toISOString().split('T')[0];

    await db.batches.update(batchId, {
      quantity: batch.quantity + quantity,
      entryDate: today
    });

    await db.transactions.add({
      batchId,
      type: 'IN',
      quantity,
      transactionDate: new Date().toISOString(),
      reason: reason || null
    });
  },

  async registerExit(batchId, quantity, reason) {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor que cero.');

    const batch = await db.batches.get(batchId);
    if (!batch) throw new Error('El lote seleccionado no existe.');
    if (batch.quantity < quantity) throw new Error('No hay suficientes existencias en este lote.');

    await db.batches.update(batchId, {
      quantity: batch.quantity - quantity
    });

    await db.transactions.add({
      batchId,
      type: 'OUT',
      quantity,
      transactionDate: new Date().toISOString(),
      reason: reason || null
    });
  },

  async getAllAlerts() {
    const batches = await this.getAllBatches();
    const today = new Date().toISOString().split('T')[0];
    const limitDate = offsetDate(EXPIRY_ALERT_DAYS);

    return batches.filter(b =>
      b.quantity <= LOW_STOCK_THRESHOLD ||
      (b.quantity > 0 && b.expirationDate <= limitDate)
    ).sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  },

  isExpired(expirationDate) {
    const today = new Date().toISOString().split('T')[0];
    return expirationDate < today;
  },

  isCriticalAlert(batch) {
    return batch.quantity === 0 || this.isExpired(batch.expirationDate);
  },

  isWarningAlert(batch) {
    if (this.isCriticalAlert(batch)) return false;
    const limitDate = offsetDate(EXPIRY_ALERT_DAYS);
    return batch.quantity <= LOW_STOCK_THRESHOLD || batch.expirationDate <= limitDate;
  },

  getAlertReason(batch) {
    const reasons = [];
    if (batch.quantity <= LOW_STOCK_THRESHOLD) {
      reasons.push(`Stock Bajo (${batch.quantity})`);
    }
    const limitDate = offsetDate(EXPIRY_ALERT_DAYS);
    if (batch.expirationDate <= limitDate) {
      const label = this.isExpired(batch.expirationDate)
        ? `Caducado (${formatDate(batch.expirationDate)})`
        : `Caducidad Próxima (${formatDate(batch.expirationDate)})`;
      reasons.push(label);
    }
    return reasons.join(' | ');
  },

  async findMedicationByName(name) {
    const meds = await db.medications.where('name').equalsIgnoreCase(name).toArray();
    return meds.length > 0 ? meds[0] : null;
  }
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
