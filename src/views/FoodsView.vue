<template>
  <div class="p-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Productos</h1>
      <div class="flex items-center gap-2">
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileImport" />
        <Button variant="ghost" @click="fileInput && fileInput.click()">Importar</Button>
        <Button type="submit" @click="router.push('/foods/new')">Nuevo Producto</Button>
      </div>
    </div>

    <div class="relative mb-4 items-center">
      <Input v-model="searchQuery" placeholder="Buscar..." class="pl-9" id="search" />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
        <Search class="size-5 text-muted-foreground" />
      </span>
    </div>

    <div class="relative mb-4 items-center">
      <!-- Tags horizontal scroll -->
      <div class="overflow-x-auto w-full" style="scrollbar-width: none;">
        <div class="flex gap-2 items-center py-2 px-1 whitespace-nowrap">
          <!-- 'Todos' - reset / show all -->
          <button
            type="button"
            @click="selectAllTags"
            :class="[
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition',
              selectedTags.length === 0
                ? 'bg-primary text-background' /* selected when none selected */
                : 'bg-secondary/10 text-foreground'
            ]"
          >
            Todos
          </button>

          <template v-for="tag in tags" :key="tag.id">
            <button
              type="button"
              @click="toggleTag(tag)"
              @pointerdown="startPress(tag, $event)"
              @pointerup="endPress()"
              @pointermove="onPointerMove($event)"
              @pointercancel="endPress()"
              @pointerleave="endPress()"
              :class="[
                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition select-none',
                selectedTags.some(t => t.id === tag.id)
                  ? 'bg-primary text-background' /* selected */
                  : selectedTags.length > 0
                    ? 'bg-muted text-muted-foreground' /* greyed when others selected */
                    : 'bg-secondary/10 text-foreground' /* default */
              ]"
            >
              {{ tag.name }}
            </button>
          </template>

          <!-- Add tag button (last special tag) -->
          <button
            type="button"
            @click="tagDialogOpen = true"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-stone-600 text-primary"
          >
            <Plus class="size-4" />
            Agregar
          </button>
        </div>
      </div>
    </div>

    <div v-if="importMessage" class="mb-4 text-sm text-stone-500">{{ importMessage }}</div>

    <div class="flex-1 min-h-0">
      <AlphabetScroll :items="filteredProducts" label-key="name" id-key="id" scrollAreaClass="h-full"
        letter-header-class="bg-background/95 backdrop-blur-sm py-2 px-3">

        <template #item="{ item }">
          <div class="border rounded-lg p-4 space-y-3 bg-white dark:bg-stone-900">
            <!-- Product name and base price -->
            <div>
              <p class="font-semibold text-base leading-tight">{{ item.name }}</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">${{ formatPrice(item.basePrice || item.price) }}</p>
            </div>

            <!-- Show special prices per area (tags and clients) -->
            <div v-if="(item.pricesByTags && Object.keys(item.pricesByTags).length > 0) || (item.specialClientPrices && Object.keys(item.specialClientPrices).length > 0)">
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Precios especiales:</p>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <!-- Tag-specific prices -->
                <template v-for="entry in Object.entries(item.pricesByTags || {})" :key="`price-${item.id}-${entry[0]}`">
                  <div class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs whitespace-nowrap flex-shrink-0">
                    <span class="font-medium text-stone-700 dark:text-stone-300">{{ tagName(entry[0]) }}</span>
                    <span class="text-green-600 dark:text-green-400 font-semibold">${{ formatPrice(entry[1]) }}</span>
                  </div>
                </template>
                <!-- Client-specific prices count -->
                <div v-if="item.specialClientPrices && Object.keys(item.specialClientPrices).length > 0" class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-xs whitespace-nowrap flex-shrink-0">
                  <span class="font-medium text-purple-700 dark:text-purple-300">{{ Object.keys(item.specialClientPrices).length }} cliente{{ Object.keys(item.specialClientPrices).length !== 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 pt-2">
              <Button class="flex-1" variant="outline" size="sm" @click="router.push(`/foods/edit/${item.id}`)">
                <Pencil class="size-4 mr-2" />
                Editar
              </Button>
              <Button class="" variant="destructive" size="sm" @click="dialogDelete(item)">
                <Trash2 class="size-4" />
              </Button>
            </div>
          </div>
        </template>

        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="text-muted-foreground">
              No hay productos registrados.
            </div>
          </div>
        </template>

      </AlphabetScroll>
    </div>

  </div>

  <AlertDialog v-model:open="openDialog">

    <AlertDialogTrigger as-child>
    </AlertDialogTrigger>

    <AlertDialogContent>

      <!-- Dialog header -->
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estas seguro que querés eliminar el producto <b>{{ productToDelete.name }}</b>? Esto no se podrá recuperar.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- Dialog footer -->
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="deleteProduct(productToDelete.id)">
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>

    </AlertDialogContent>

  </AlertDialog>

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

  <!-- Delete Tag Confirmation -->
  <AlertDialog v-model:open="deleteTagDialogOpen">
    <AlertDialogTrigger as-child></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Eliminar etiqueta</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estás seguro que querés eliminar la etiqueta <b>{{ tagToDelete?.name }}</b>? Esto no se podrá recuperar.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="confirmDeleteTag">Eliminar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import { useProductsStore } from '@/stores/products'
import { useClientsStore } from '@/stores/clients'
import { useTagsStore } from '@/stores/tags'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleSimple,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search, Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AlphabetScroll from '@/components/AlphabetScroll.vue'

// Helper map for tag lookups by id
const tagsById = computed(() => {
  const map = new Map()
  for (const t of tags.value) {
    if (t && (t.id !== undefined)) map.set(String(t.id), t.name)
  }
  return map
})

const tagName = (id) => {
  if (id === undefined || id === null) return ''
  return tagsById.value.get(String(id)) || String(id)
}

const store = useProductsStore()
const clientsStore = useClientsStore()
const router = useRouter()
const searchQuery = ref('')

const products = computed(() => store.products)
const tagsStore = useTagsStore()
const selectedTags = ref([])

const tags = computed(() => {
  // Prefer tags from the tags store (each tag expected like { id, name })
  if (tagsStore.tags && tagsStore.tags.length > 0) {
    return tagsStore.tags
      .filter(t => t && t.name)
      .sort((a, b) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()))
  }

  // Fallback: derive tags from products (backwards compatibility)
  const set = new Set()
  for (const p of products.value) {
    if (!p) continue
    if (Array.isArray(p.tags)) {
      for (const t of p.tags) if (t) set.add(String(t))
    } else if (p.tag) {
      set.add(String(p.tag))
    }
  }
  return Array.from(set)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((name, idx) => ({ id: idx, name })) // Fallback: create synthetic objects
})

const openDialog = ref(false)
const productToDelete = ref(null)

// Import helpers
const fileInput = ref(null)
const importing = ref(false)
const importMessage = ref('')

// Tag dialog state
const tagDialogOpen = ref(false)
const newTagName = ref('')
const deleteTagDialogOpen = ref(false)
const tagToDelete = ref(null)

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  let filtered = !query
    ? products.value
    : products.value.filter(product =>
      product.name.toLowerCase().includes(query)
    )

  // If tags are selected, filter products that have ALL of the selected tags (AND mode)
  if (selectedTags.value.length > 0) {
    filtered = filtered.filter(product => {
      if (!product) return false
      // Collect product tag identifiers (support legacy `tags`/`tag` and new `pricesByTags`)
      const pTagsSet = new Set()

      if (Array.isArray(product.tags)) {
        for (const t of product.tags) if (t) pTagsSet.add(String(t).toLowerCase())
      } else if (product.tag) {
        pTagsSet.add(String(product.tag).toLowerCase())
      }

      if (product.pricesByTags && typeof product.pricesByTags === 'object') {
        for (const k of Object.keys(product.pricesByTags)) {
          if (k !== undefined && k !== null) pTagsSet.add(String(k).toLowerCase())
        }
      }

      // Match ALL selected tags against product tags (AND mode)
      return selectedTags.value.every(selectedTag => {
        const selId = String(selectedTag.id)
        const selName = String(selectedTag.name ?? '').toLowerCase()
        return pTagsSet.has(selId) || pTagsSet.has(selName)
      })
    })
  }

  return filtered.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

const dialogDelete = product => {
  productToDelete.value = product
  openDialog.value = true
}

const deleteProduct = id => {
  store.deleteProduct(id)
}

const formatPrice = price => {
  return new Intl.NumberFormat('es-AR').format(price)
}

function origToggleTag(tag) {
  const i = selectedTags.value.findIndex(t => t.id === tag.id)
  if (i === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(i, 1)
}

// Long-press handling (use pointer events so scrolling isn't blocked)
const longPressed = ref(false)
let pressTimer = null
let startX = 0
let startY = 0
const MOVE_THRESHOLD = 8 // pixels

const startPress = (tag, ev) => {
  // Reset
  if (pressTimer) clearTimeout(pressTimer)
  longPressed.value = false
  startX = ev.clientX || 0
  startY = ev.clientY || 0
  // Start timer (do NOT call preventDefault) so native scrolling still works
  pressTimer = setTimeout(() => {
    longPressed.value = true
    // open custom delete confirmation dialog
    tagToDelete.value = tag
    deleteTagDialogOpen.value = true
  }, 700)
}

const endPress = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  // small delay to avoid immediate click after long-press
  if (longPressed.value) {
    setTimeout(() => { longPressed.value = false }, 50)
  }
}

const onPointerMove = (ev) => {
  if (!pressTimer) return
  const dx = Math.abs((ev.clientX || 0) - startX)
  const dy = Math.abs((ev.clientY || 0) - startY)
  if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

// Update toggle to respect long-press (ignore click after long-press)
const toggleTag = (tag) => {
  if (longPressed.value) return
  origToggleTag(tag)
}

const selectAllTags = () => {
  selectedTags.value = []
}

const createTag = async () => {
  const name = String(newTagName.value ?? '').trim()
  if (!name) return
  await tagsStore.addTag({ name })
  newTagName.value = ''
  tagDialogOpen.value = false
}

const confirmDeleteTag = async () => {
  if (!tagToDelete.value) return
  const deleted = { ...tagToDelete.value }
  const tagId = deleted.id

  // collect affected products and clients
  const affectedProducts = store.products.filter(p => p && p.pricesByTags && Object.prototype.hasOwnProperty.call(p.pricesByTags, String(tagId))).map(p => ({ ...p }))
  const affectedClients = clientsStore.clients.filter(c => c && (c.tagId === tagId || String(c.tagId) === String(tagId))).map(c => ({ ...c }))

  try {
    // delete tag record
    await tagsStore.deleteTag(tagId)

    // remove tag references from products
    for (const p of affectedProducts) {
      if (p.pricesByTags && Object.prototype.hasOwnProperty.call(p.pricesByTags, String(tagId))) {
        const updated = { ...p }
        // delete the key
        const key = String(tagId)
        const copyPrices = { ...(updated.pricesByTags || {}) }
        delete copyPrices[key]
        updated.pricesByTags = copyPrices
        await store.updateProduct(updated)
      }
    }

    // remove tag association from clients
    for (const c of affectedClients) {
      const updated = { ...c }
      if (String(updated.tagId) === String(tagId)) updated.tagId = null
      await clientsStore.updateClient(updated)
    }

    // remove from selectedTags if present
    const idx = selectedTags.value.findIndex(t => t.id === tagId)
    if (idx !== -1) selectedTags.value.splice(idx, 1)

  } catch (e) {
    console.error('confirmDeleteTag', e)
  }

  tagToDelete.value = null
  deleteTagDialogOpen.value = false
}

// Helper to parse price strings like "4:2200; 2:1900" into {4: 2200, 2: 1900}
const parsePriceMap = (str) => {
  if (!str || typeof str !== 'string') return {}
  const map = {}
  const entries = str.split(';').map(s => s.trim()).filter(s => s)
  for (const entry of entries) {
    const [idStr, priceStr] = entry.split(':').map(s => s.trim())
    if (idStr && priceStr) {
      const id = isNaN(Number(idStr)) ? idStr : Number(idStr)
      const price = Number(priceStr) || 0
      map[id] = price
    }
  }
  return map
}

const handleFileImport = async (ev) => {
  const f = ev?.target?.files?.[0]
  if (!f) return
  importing.value = true
  importMessage.value = ''

  try {
    const buffer = await f.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const first = wb.SheetNames[0]
    const ws = wb.Sheets[first]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null })

    let added = 0
    let updated = 0
    let failed = 0

    for (const r of rows) {
      try {
        const norm = {}
        for (const k of Object.keys(r || {})) {
          norm[String(k).trim().toLowerCase()] = r[k]
        }

        const rawId = norm['id'] ?? norm['i.d'] ?? norm['identificador']
        const id = (rawId !== null && rawId !== undefined && rawId !== '') ? (isNaN(Number(rawId)) ? rawId : Number(rawId)) : undefined
        const name = (norm['name'] ?? norm['nombre'] ?? '') || ''
        const basePrice = Number(norm['base price'] ?? norm['precio base'] ?? norm['precio'] ?? 0) || 0
        const pricesByTagsStr = norm['prices by tags'] ?? norm['precios por etiquetas'] ?? ''
        const specialClientPricesStr = norm['special client prices'] ?? norm['precios especiales clientes'] ?? ''

        const pricesByTags = parsePriceMap(pricesByTagsStr)
        const specialClientPrices = parsePriceMap(specialClientPricesStr)

        const productObj = {
          name: String(name).trim(),
          basePrice,
          pricesByTags,
          specialClientPrices
        }
        if (id !== undefined) productObj.id = id

        if (id !== undefined) {
          await store.updateProduct(productObj)
          updated++
        } else {
          await store.addProduct(productObj)
          added++
        }
      } catch (errRow) {
        console.error('Import row failed', errRow)
        failed++
      }
    }

    importMessage.value = `Import complete: ${added} added, ${updated} updated, ${failed} failed.`
    // reload products
    await store.loadProducts()
  } catch (err) {
    console.error('Import failed', err)
    importMessage.value = 'Import failed. See console.'
  } finally {
    importing.value = false
    // reset file input
    // eslint-disable-next-line no-unused-vars, no-empty
    try { if (fileInput.value) fileInput.value.value = '' } catch (e) {}
  }
}

// Mounted
onMounted(() => {
  store.loadProducts()
  // Load tags from tags store when available
  tagsStore.loadTags()
})
</script>
