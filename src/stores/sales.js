import { defineStore } from 'pinia'
import { db } from '@/lib/db'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    sales: [],
  }),

  actions: {
    async loadSales() {
      const all = await db.getAll('sales')
      this.sales = (all || []).map(s => {
        const out = { ...s }
        if (!Array.isArray(out.payments)) {
          out.payments = []
          if (out.payment && out.payment.type) {
            if (out.payment.type === 'mix' && out.payment.details) {
              const d = out.payment.details
              if (d.cash) out.payments.push({ amount: Number(d.cash) || 0, type: 'cash', date: Date.now() })
              if (d.debt) out.payments.push({ amount: Number(d.debt) || 0, type: 'debt', date: Date.now() })
            } else if (out.payment.type === 'cash' || out.payment.type === 'debt') {
              out.payments.push({ amount: Number(out.total) || 0, type: out.payment.type, date: Date.now() })
            }
          }
        }
        return out
      })
    },

    async addSale(sale) {
      const id = await db.add('sales', sale)
      this.sales.push({ ...sale, id })
      return id
    },

    async updateSale(updatedSale) {
      await db.put('sales', updatedSale)
      const index = this.sales.findIndex(p => p.id === updatedSale.id)
      if (index !== -1) this.sales[index] = updatedSale
    },

    async deleteSale(id) {
      await db.delete('sales', id)
      this.sales = this.sales.filter(c => c.id !== id)
    },

    async getSaleById(id) {
      return await db.get('sales', id)
    },

    async markSalePaid(id, paymentsOrType, details = null) {
      const sale = await this.getSaleById(id)
      if (!sale) throw new Error('Sale not found')

      // Support passing an array of payments or legacy payment type + details
      sale.payments = sale.payments || []
      if (Array.isArray(paymentsOrType)) {
        sale.payments = paymentsOrType
      } else if (typeof paymentsOrType === 'string') {
        const paymentType = paymentsOrType
        if (paymentType === 'mix' && details) {
          if (details.cash) sale.payments.push({ amount: details.cash, type: 'cash', date: Date.now() })
          if (details.debt) sale.payments.push({ amount: details.debt, type: 'debt', date: Date.now() })
        } else {
          // assume full amount paid by single type
          sale.payments.push({ amount: sale.total || 0, type: paymentType, date: Date.now() })
        }
      }

      const paid = sale.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
      sale.isPaid = paid >= Number(sale.total || 0)
      await this.updateSale(sale)
    },

    async markSaleUnpaid(id) {
      const sale = await this.getSaleById(id)
      if (!sale) throw new Error('Sale not found')

      sale.isPaid = false
      sale.payments = []
      await this.updateSale(sale)
    },
  },
})
