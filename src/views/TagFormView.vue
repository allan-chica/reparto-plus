<template>
  <div class="p-6 max-w-xl mx-auto">
    <div class="flex gap-4 items-center mb-4">
      <Button type="submit" size="icon" variant="outline" @click="router.back()">
        <ChevronLeft />
      </Button>
      <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar' : 'Crear' }} categoría</h1>
    </div>

    <form @submit.prevent="saveTag" class="space-y-3 mb-6">
      <div class="flex flex-col gap-2">
        <Label for="name">Nombre<span class="text-red-400">*</span></Label>
        <Input id="name" v-model="form.name" />
        <span v-if="emptyName" class="text-sm text-red-400">El nombre es obligatorio</span>
      </div>
      <Button type="submit">{{ isEditing ? 'Editar' : 'Crear' }} Categoría</Button>
    </form>
  </div>
</template>

<script setup>
import { useTagsStore } from '@/stores/tags'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

const store = useTagsStore()
const router = useRouter()
const route = useRoute()

const form = ref({ name: '' })

const isEditing = computed(() => route.name === 'Editar etiqueta')
const editingId = computed(() => route.params.id)
const emptyName = ref(false)

// Methods
const saveTag = () => {
  if (form.value.name.trim() === '') {
    emptyName.value = true
    return
  }

  if (isEditing.value) {
    store.updateTag({ id: editingId.value, ...form.value })
  } else {
    store.addTag({ ...form.value })
  }

  form.value.name = ''
  emptyName.value = false

  router.push('/foods')
}

onMounted(async () => {
  if (editingId.value) {
    const tagFromDb = await store.getTagById(Number(editingId.value))
    if (tagFromDb) {
      Object.assign(form.value, tagFromDb)
    }
  }
})

</script>
