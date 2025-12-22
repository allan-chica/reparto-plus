<template>
  <div class="p-6 max-w-xl mx-auto">
    <div class="flex gap-4 items-center mb-4">
      <Button type="submit" size="icon" variant="outline" @click="router.back()">
        <ChevronLeft />
      </Button>
      <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar' : 'Crear' }} cliente</h1>
    </div>

    <form @submit.prevent="saveClient" class="space-y-3 mb-6">
      <div class="flex flex-col gap-2">
        <Label for="name">Nombre<span class="text-red-400">*</span></Label>
        <Input id="name" v-model="form.name" />
        <span v-if="emptyName" class="text-sm text-red-400">El nombre es obligatorio</span>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="phone">Telefono</Label>
        <Input id="phone" v-model="form.phone" type="number" />
      </div>
      <div class="flex flex-col gap-2">
        <Label for="debt">Deuda</Label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-stone-600">$</span>
          <Input id="debt" v-model="form.debt" type="number" step="0.01" class="w-36" placeholder="0.00" />
        </div>
        <p class="text-xs text-stone-500">Ingresa la deuda actual del cliente (ej. 120.50)</p>
      </div>
      <div class="flex flex-col gap-2">
        <Label>Etiqueta</Label>
        <div class="overflow-x-auto w-full" style="scrollbar-width: none;">
          <div class="flex gap-2 items-center py-2 px-1 whitespace-nowrap">
            <button type="button" @click="form.tagId = null" :class="['inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition', !form.tagId ? 'bg-primary text-background' : 'bg-secondary/10 text-foreground']">Sin etiqueta</button>
            <template v-for="tag in tags" :key="tag.id">
              <button type="button" @click="selectTag(tag)" :class="['inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition select-none', form.tagId === tag.id ? 'bg-primary text-background' : 'bg-secondary/10 text-foreground']">{{ tag.name }}</button>
            </template>
            <!-- Add tag button -->
            <button type="button" @click="tagDialogOpen = true" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-stone-600 text-primary">
              <Plus class="size-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <!-- <Switch class="my-3" id="has-discount" v-model:model-value="hasDiscount" />
        <Label for="has-discount">Tiene descuento</Label>
        <div class="flex gap-1 items-center ml-3" v-if="hasDiscount">
          <Input id="discount" v-model="form.discount" type="number" class="w-20" />
          <Percent />
        </div> -->
      </div>
      <Button type="submit">{{ isEditing ? 'Editar' : 'Crear' }} Cliente</Button>
    </form>
    <!-- Create Tag Dialog -->
    <Dialog v-model:open="tagDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitleSimple>Crear etiqueta</DialogTitleSimple>
          <div class="mt-2">
            <Input v-model="newTagName" placeholder="Nombre de la etiqueta" />
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" @click="tagDialogOpen = false">Cancelar</Button>
          <Button @click="createTag" class="ml-2">Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { useClientsStore } from '@/stores/clients'
import { useTagsStore } from '@/stores/tags'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleSimple,
  DialogFooter,
} from '@/components/ui/dialog'
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Plus } from 'lucide-vue-next'
// import { Percent } from 'lucide-vue-next'
// import { Switch } from '@/components/ui/switch'

const store = useClientsStore()
const tagsStore = useTagsStore()
const tags = computed(() => (tagsStore.tags || []).slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'')))

// Tag creation dialog state
const tagDialogOpen = ref(false)
const newTagName = ref('')

const createTag = async () => {
  const name = String(newTagName.value ?? '').trim()
  if (!name) return
  await tagsStore.addTag({ name })
  newTagName.value = ''
  tagDialogOpen.value = false
}

const selectTag = (tag) => {
  form.value.tagId = tag.id
}
const router = useRouter()
const route = useRoute()

const form = ref({ name: '', phone: '', discount: 0, debt: 0 })

const isEditing = computed(() => route.name === 'Editar cliente')
const editingId = computed(() => route.params.id)
const emptyName = ref(false)

const hasDiscount = ref(false)

// Methods
const saveClient = () => {
  if (!form.value.name) {
    emptyName.value = true
    return
  }

  // Ensure numeric fields are numbers
  const payload = { ...form.value, debt: Number(form.value.debt) || 0, discount: Number(form.value.discount) || 0 }

  if (isEditing.value) {
    store.updateClient({ id: editingId.value, ...payload })
  } else {
    store.addClient(payload)
  }

  form.value.name = ''
  form.value.phone = ''
  emptyName.value = false

  router.push('/clients')
}

onMounted(async () => {
  if (editingId.value) {
    const clientFromDb = await store.getClientById(Number(editingId.value))
    if (clientFromDb) {
      Object.assign(form.value, clientFromDb)
      if (form.value.discount > 0) {
        hasDiscount.value = true
      }
    }
  }
  tagsStore.loadTags()
})


</script>
