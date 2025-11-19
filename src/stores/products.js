import { defineStore } from 'pinia'
import { db } from '@/lib/db'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
  }),

  actions: {
    async loadProducts() {
      this.products = await db.getAll('products')
    },

    async addProduct(product) {
      const id = await db.add('products', product)
      this.products.push({ ...product, id })
    },

    async updateProduct(updatedProduct) {
      // Ensure id is numeric to avoid creating a new record when using string ids
      const id = Number(updatedProduct.id)
      // Merge with existing product to preserve any fields not being updated
      const existingProduct = await db.get('products', id)
      const mergedProduct = { ...existingProduct, ...updatedProduct, id }
      await db.put('products', mergedProduct)
      const index = this.products.findIndex(p => p.id === id)
      if (index !== -1) this.products[index] = mergedProduct
    },

    async deleteProduct(id) {
      await db.delete('products', id)
      this.products = this.products.filter(c => c.id !== id)
    },

    async getProductById(id) {
      return await db.get('products', id)
    }
  },
})
