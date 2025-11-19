<template>
  <div class="p-6 max-w-xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex gap-4 items-center">
        <Button type="submit" size="icon" variant="outline" @click="router.back()">
          <ChevronLeft />
        </Button>
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar' : 'Crear' }} producto</h1>
      </div>

      <Button
        type="button"
        @click="saveProduct"
        :disabled="isSubmitting"
      >
        {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
      </Button>
    </div>

    <form @submit.prevent="saveProduct" class="space-y-6 mb-6">

      <!-- Product Name Section -->
      <div>
        <div class="flex flex-col gap-2">
          <Label for="name" class="text-base font-semibold">Nombre del Producto<span class="text-red-400">*</span></Label>
          <Input
            id="name"
            v-model="form.name"
            placeholder="Ej: Medialunas, Pan..."
            class="text-lg py-2"
          />
          <span v-if="emptyName" class="text-sm text-red-400">El nombre es obligatorio</span>
        </div>
      </div>

      <!-- Base Price Section -->
      <div>
        <div class="flex flex-col gap-2">
          <Label for="basePrice" class="text-base font-semibold">Precio Base<span class="text-red-400">*</span></Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500 font-medium">$</span>
            <Input
              id="basePrice"
              v-model="form.price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="pl-8 text-lg py-2"
            />
          </div>
          <span v-if="emptyPrice" class="text-sm text-red-400">El precio base es obligatorio</span>
        </div>
      </div>

      <!-- Special Prices Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Precios Especiales</h2>
            <p class="text-sm text-stone-600 dark:text-stone-400">Por categoría o cliente</p>
          </div>
          <Button
            type="button"
            @click="openModal"
            size="sm"
            class="whitespace-nowrap"
          >
            + Agregar
          </Button>
        </div>

        <!-- Special Prices List -->
        <div v-if="specialPrices.length === 0" class="bg-stone-50 dark:bg-stone-800 p-6 rounded-lg border border-stone-200 dark:border-stone-700 text-center">
          <p class="text-sm text-stone-500 dark:text-stone-400">Sin precios especiales. Usa el precio base para todos.</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(item, index) in specialPrices"
            :key="index"
            class="flex items-center gap-3 bg-white dark:bg-stone-800 p-4 rounded-lg border border-stone-200 dark:border-stone-700"
          >
            <!-- Icon for type -->
            <div class="flex-shrink-0">
              <MapPin v-if="item.type === 'tag'" class="size-5 text-blue-600 dark:text-blue-400" />
              <User v-else class="size-5 text-purple-600 dark:text-purple-400" />
            </div>

            <!-- Name and type -->
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-stone-900 dark:text-white truncate">{{ item.name }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">{{ item.type === 'tag' ? 'Categoría' : 'Cliente' }}</p>
            </div>

            <!-- Price input and remove button -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="relative w-28">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500 font-medium">$</span>
                <Input
                  v-model="item.price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="pl-7 text-lg py-2 text-right"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-9 w-9 flex-shrink-0"
                @click="removeSpecialPrice(index)"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      </div>

    </form>

    <!-- Special Price Modal -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar Precio Especial</DialogTitle>
          <DialogDescription>
            Selecciona una categoría o cliente para asignar un precio especial.
          </DialogDescription>
        </DialogHeader>

        <!-- Tabs -->
        <Tabs v-model="modalTab" class="w-full flex flex-col flex-1">
          <TabsList class="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="tags">Categorías</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <!-- Tags Tab -->
          <TabsContent value="tags" class="flex-1 min-h-0 flex flex-col space-y-3">
            <div class="relative items-center flex-shrink-0">
              <Input v-model="tagSearchQuery" placeholder="Buscar..." class="pl-9" id="tagSearch" />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Search class="size-5 text-muted-foreground" />
              </span>
            </div>
            <div class="flex-1 min-h-0 overflow-y-auto space-y-2">
              <div v-if="filteredTags.length === 0" class="text-center text-muted-foreground py-8">
                <p>No hay categorías disponibles.</p>
              </div>
              <div
                v-for="tag in filteredTags"
                v-show="!isTagAlreadySelected(tag.id)"
                :key="`tag-${tag.id}`"
                class="p-3 rounded-md cursor-pointer hover:bg-muted"
                @click="selectItem(tag, 'tag')"
              >
                <p class="font-semibold">{{ tag.name }}</p>
              </div>
            </div>
          </TabsContent>

          <!-- Clients Tab -->
          <TabsContent value="clients" class="flex-1 min-h-0 flex flex-col space-y-3">
            <div class="relative items-center flex-shrink-0">
              <Input v-model="clientSearchQuery" placeholder="Buscar..." class="pl-9" id="clientSearch" />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Search class="size-5 text-muted-foreground" />
              </span>
            </div>
            <div class="flex-1 min-h-0">
              <AlphabetScroll :items="filteredClients" label-key="name" id-key="id" :scrollAreaClass="'h-full max-h-80'">
                <template #item="{ item }">
                  <div
                    v-show="!isClientAlreadySelected(item.id)"
                    class="p-3 rounded-md cursor-pointer hover:bg-muted"
                    @click="selectItem(item, 'client')"
                  >
                    <p class="font-semibold">{{ item.name }}</p>
                  </div>
                </template>
                <template #empty>
                  <div class="text-center text-muted-foreground py-8">
                    <p>No hay clientes disponibles.</p>
                  </div>
                </template>
              </AlphabetScroll>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter class="flex-shrink-0">
          <Button type="button" variant="outline" @click="isModalOpen = false">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { useProductsStore } from '@/stores/products'
import { useTagsStore } from '@/stores/tags'
import { useClientsStore } from '@/stores/clients'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Search, MapPin, User } from 'lucide-vue-next'
import AlphabetScroll from '@/components/AlphabetScroll.vue'

const store = useProductsStore()
const tagsStore = useTagsStore()
const clientsStore = useClientsStore()
const router = useRouter()
const route = useRoute()

const form = ref({ name: '', price: '' })
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const modalTab = ref('tags')
const tagSearchQuery = ref('')
const clientSearchQuery = ref('')

const isEditing = computed(() => route.name === 'Editar producto')
const editingId = computed(() => route.params.id)
const emptyName = ref(false)
const emptyPrice = ref(false)

// Get tags and clients from stores
const tags = computed(() => {
  return (tagsStore.tags || [])
    .filter(t => t && t.name)
    .sort((a, b) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()))
})

const clients = computed(() => {
  return (clientsStore.clients || [])
    .filter(c => c && c.name)
    .sort((a, b) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()))
})

// Filtered tags and clients for search
const filteredTags = computed(() => {
  const query = tagSearchQuery.value.toLowerCase().trim()
  const filtered = !query
    ? tags.value
    : tags.value.filter(tag =>
      tag.name.toLowerCase().includes(query)
    )
  return filtered.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

const filteredClients = computed(() => {
  const query = clientSearchQuery.value.toLowerCase().trim()
  const filtered = !query
    ? clients.value
    : clients.value.filter(client =>
      client.name.toLowerCase().includes(query)
    )
  return filtered.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

// Special prices list
const specialPrices = ref([])

// Check if tag/client already selected
const isTagAlreadySelected = (tagId) => {
  return specialPrices.value.some(sp => sp.type === 'tag' && sp.id === tagId)
}

const isClientAlreadySelected = (clientId) => {
  return specialPrices.value.some(sp => sp.type === 'client' && sp.id === clientId)
}

// Modal methods
const openModal = () => {
  isModalOpen.value = true
}

const selectItem = (item, type) => {
  specialPrices.value.push({
    id: item.id,
    name: item.name,
    type: type,
    price: ''
  })
  isModalOpen.value = false
  modalTab.value = 'tags'
}

const removeSpecialPrice = (index) => {
  specialPrices.value.splice(index, 1)
}

// Save product
const saveProduct = () => {
  if (form.value.name.trim() === '') {
    emptyName.value = true
    return
  }

  // Check if base price is defined and valid
  if (form.value.price === '' || form.value.price < 0 || form.value.price === null) {
    emptyPrice.value = true
    return
  }

  isSubmitting.value = true

  try {
    const productData = {
      name: form.value.name.trim(),
      basePrice: Number(form.value.price),
      pricesByTags: {},
      specialClientPrices: {}
    }

    // Build tag-specific prices
    for (const sp of specialPrices.value) {
      if (sp.type === 'tag' && sp.price !== '' && sp.price !== null && sp.price >= 0) {
        productData.pricesByTags[sp.id] = Number(sp.price)
      }
    }

    // Build client-specific prices
    for (const sp of specialPrices.value) {
      if (sp.type === 'client' && sp.price !== '' && sp.price !== null && sp.price >= 0) {
        productData.specialClientPrices[sp.id] = Number(sp.price)
      }
    }

    if (isEditing.value) {
      // ensure numeric id when updating (route params are strings)
      store.updateProduct({ id: Number(editingId.value), ...productData })
    } else {
      store.addProduct(productData)
    }

    form.value.name = ''
    form.value.price = ''
    specialPrices.value = []
    emptyName.value = false
    emptyPrice.value = false

    router.push('/foods')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  // Load data first
  await tagsStore.loadTags()
  await clientsStore.loadClients()

  if (editingId.value) {
    const productFromDb = await store.getProductById(Number(editingId.value))
    if (productFromDb) {
      form.value.name = productFromDb.name || ''
      form.value.price = productFromDb.basePrice || ''

      // Load tag-specific prices
      if (productFromDb.pricesByTags) {
        for (const [tagId, price] of Object.entries(productFromDb.pricesByTags)) {
          const tag = tags.value.find(t => t.id === Number(tagId))
          if (tag) {
            specialPrices.value.push({
              id: Number(tagId),
              name: tag.name,
              type: 'tag',
              price: price
            })
          }
        }
      }

      // Load client-specific prices
      if (productFromDb.specialClientPrices) {
        for (const [clientId, price] of Object.entries(productFromDb.specialClientPrices)) {
          const client = clients.value.find(c => c.id === Number(clientId))
          if (client) {
            specialPrices.value.push({
              id: Number(clientId),
              name: client.name,
              type: 'client',
              price: price
            })
          }
        }
      }
    }
  }
})

</script>
