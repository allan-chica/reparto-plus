import { defineStore } from 'pinia'
import { db } from '@/lib/db'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: []
  }),

  actions: {
    async loadClients() {
      const all = await db.getAll('clients')
      // normalize debt to a number and ensure default 0
      this.clients = (all || []).map(c => ({ ...c, debt: typeof c.debt === 'number' ? c.debt : Number(c.debt) || 0 }))
    },

    async addClient(client) {
      // ensure debt is a number and default to 0
      const normalized = { ...client, debt: typeof client.debt === 'number' ? client.debt : Number(client.debt) || 0 }
      const id = await db.add('clients', normalized)
      this.clients.push({ ...normalized, id })
    },

    async updateClient(updatedClient) {
      const normalized = { ...updatedClient, debt: typeof updatedClient.debt === 'number' ? updatedClient.debt : Number(updatedClient.debt) || 0 }
      await db.put('clients', normalized)
      const index = this.clients.findIndex(c => c.id === normalized.id)
      if (index !== -1) this.clients[index] = normalized
    },

    async deleteClient(id) {
      await db.delete('clients', id)
      this.clients = this.clients.filter(c => c.id !== id)
    },

    async getClientById(id) {
      return await db.get('clients', id)
    }
  },
})
