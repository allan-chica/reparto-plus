import { openDB } from "idb"

const DB_NAME = 'reparto'
const DB_VERSION = 7

export const db = await openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {

    // Clients
    if (!db.objectStoreNames.contains('clients')) {
      const store = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true })
      store.createIndex('name', 'name', { unique: false })
    }

    // Products
    if (!db.objectStoreNames.contains('products')) {
      const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
      store.createIndex('name', 'name', { unique: false })
      store.createIndex('price', 'price', { unique: false })
    }

    // Sales
    if (!db.objectStoreNames.contains('sales')) {
      const store = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true })
      store.createIndex('date', 'date', { unique: false })
      store.createIndex('clientId', 'client.id', { unique: false })
    }

    // Tags
    if (!db.objectStoreNames.contains('tags')) {
      const store = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true })
      store.createIndex('name', 'name', { unique: false })
    }
  }
})

// Post-open, run idempotent migration that adds `discount: 0` to clients that miss it
async function ensureClientDiscounts() {

  const migrated = localStorage.getItem('migrated-discount-v4')
  if (migrated) return

  try {
    const clients = await db.getAll('clients')
    if (!clients || clients.length === 0) return

    // Filter only missing discount field
    const missing = clients.filter(c => !('discount' in c))

    if (missing.length === 0) return

    // Update each missing client. This uses db.put which updates the existing record.
    for (const client of missing) {
      client.discount = 0
      await db.put('clients', client)
    }

    console.log(`IndexedDB migration: added discount to ${missing.length} clients.`)
    localStorage.setItem('migrated-discount-v4', 'true')
  } catch (err) {
    console.error('Error running clients -> discount migration', err)
  }
}

// Run at startup
ensureClientDiscounts()
