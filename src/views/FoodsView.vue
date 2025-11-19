<template>
  <div class="p-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Productos</h1>
      <Button type="submit" @click="router.push('/foods/new')">Nuevo Producto</Button>
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
              :class="[
                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition',
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
            @click="router.push('/tags/new')"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-stone-600 text-primary"
          >
            <Plus class="size-4" />
            Agregar
          </button>
        </div>
      </div>
    </div>

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

            <!-- Show special prices per area (tags) -->
            <div v-if="item.pricesByTags && Object.keys(item.pricesByTags).length > 0">
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Precios especiales:</p>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <template v-for="entry in Object.entries(item.pricesByTags)" :key="`price-${item.id}-${entry[0]}`">
                  <div class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs whitespace-nowrap flex-shrink-0">
                    <span class="font-medium text-stone-700 dark:text-stone-300">{{ tagName(entry[0]) }}</span>
                    <span class="text-green-600 dark:text-green-400 font-semibold">${{ formatPrice(entry[1]) }}</span>
                  </div>
                </template>
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
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useProductsStore } from '@/stores/products'
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

const toggleTag = tag => {
  const i = selectedTags.value.findIndex(t => t.id === tag.id)
  if (i === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(i, 1)
}

const selectAllTags = () => {
  selectedTags.value = []
}

// Mounted
onMounted(() => {
  store.loadProducts()
  // Load tags from tags store when available
  tagsStore.loadTags()
})
</script>
