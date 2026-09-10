const db = new Dexie('InventarioMedDB');

db.version(1).stores({
  medications: '++id, name, activeIngredient, presentation, category',
  batches: '++id, medicationId, batchNumber, expirationDate, entryDate, quantity',
  transactions: '++id, batchId, type, quantity, transactionDate, reason'
});

async function seedDatabase() {
  const count = await db.medications.count();
  if (count > 0) return;

  const today = new Date().toISOString().split('T')[0];
  const inOneYear = offsetDate(365);
  const inTenDays = offsetDate(10);
  const inSixMonths = offsetDate(180);

  const medIds = await db.medications.bulkAdd([
    { name: 'Paracetamol', activeIngredient: 'Paracetamol', presentation: 'Caja 20 comp', category: 'Analgésico' },
    { name: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', presentation: 'Caja 40 comp', category: 'Antiinflamatorio' },
    { name: 'Amoxicilina', activeIngredient: 'Amoxicilina', presentation: 'Caja 30 comp', category: 'Antibiótico' }
  ], { allKeys: true });

  await db.batches.bulkAdd([
    { medicationId: medIds[0], batchNumber: 'L-100', expirationDate: inOneYear, entryDate: today, quantity: 50 },
    { medicationId: medIds[1], batchNumber: 'L-200', expirationDate: inTenDays, entryDate: today, quantity: 20 },
    { medicationId: medIds[2], batchNumber: 'L-300', expirationDate: inSixMonths, entryDate: today, quantity: 4 }
  ]);
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
