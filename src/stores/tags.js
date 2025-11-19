import { defineStore } from 'pinia'
import { db } from '@/lib/db'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [],
  }),

  actions: {
    async loadTags() {
      this.tags = await db.getAll('tags')
    },

    async addTag(tag) {
      const id = await db.add('tags', tag)
      this.tags.push({ ...tag, id })
    },

    async updateTag(updatedTag) {
      await db.put('tags', updatedTag)
      const index = this.tags.findIndex(t => t.id === updatedTag.id)
      if (index !== -1) this.tags[index] = updatedTag
    },

    async deleteTag(id) {
      await db.delete('tags', id)
      this.tags = this.tags.filter(t => t.id !== id)
    },

    async getTagById(id) {
      return await db.get('tags', id)
    }
  },
})
