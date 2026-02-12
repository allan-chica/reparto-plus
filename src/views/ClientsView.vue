<template>
  <div class="px-6 pt-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Clientes</h1>
      <div class="flex items-center gap-2">
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileImport" />
        <Button variant="ghost" @click="fileInput && fileInput.click()">Importar</Button>
        <Button type="submit" @click="router.push('/clients/new')">Nuevo Cliente</Button>
      </div>
    </div>

    <div v-if="importMessage" class="mb-4 text-sm text-stone-500">{{ importMessage }}</div>

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
          <button
            type="button"
            @click="selectAllTags"
            :class="['inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition', selectedTags.length === 0 ? 'bg-primary text-background' : 'bg-secondary/10 text-foreground']"
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
              :class="['inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition select-none', selectedTags.some(t => t.id === tag.id) ? 'bg-primary text-background' : 'bg-secondary/10 text-foreground']"
            >
              {{ tag.name }}
            </button>
          </template>

          <button type="button" @click="tagDialogOpen = true" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-stone-600 text-primary">
            <Plus class="size-4" />
            Agregar
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0">
      <AlphabetScroll :items="filteredClients" label-key="name" id-key="id" scrollAreaClass="h-full"
        letter-header-class="bg-background/95 backdrop-blur-sm py-2 px-3">

        <template #item="{ item }">
          <div class="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white dark:bg-stone-900 hover:shadow-sm transition">
            <div class="flex items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-base leading-tight">{{ item.name }}</p>
                  <template v-if="tagName(item.tagId)">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">{{ tagName(item.tagId) }}</span>
                  </template>
                </div>
                <p class="text-sm text-stone-500 mt-1">{{ item.phone || '—' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div>
                <span :class="['text-sm font-medium', (item.debt && Number(item.debt) > 0) ? 'text-red-600' : 'text-stone-600']">{{ formatCurrency(item.debt || 0) }}</span>
                <div class="text-xs text-stone-400">Deuda</div>
              </div>

              <div class="flex items-center gap-2">
                <Button size="icon" variant="outline" @click="router.push(`/clients/edit/${item.id}`)">
                  <Pencil class="size-4" />
                </Button>
                <Button size="icon" variant="destructive" @click="dialogDelete(item)">
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </template>

        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="text-muted-foreground">
              No hay clientes registrados.
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
        <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
        <AlertDialogDescription>
          ¿Estas seguro que querés eliminar el cliente <b>{{ clientToDelete.name }}</b>? Esto no se podrá recuperar.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- Dialog footer -->
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="deleteClient(clientToDelete.id)">
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>

    </AlertDialogContent>

  </AlertDialog>

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
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import * as XLSX from 'xlsx'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search, Plus } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleSimple, DialogFooter } from '@/components/ui/dialog'
import { useRouter } from 'vue-router'
import AlphabetScroll from '@/components/AlphabetScroll.vue'

const store = useClientsStore()
const router = useRouter()
const searchQuery = ref('')

const clients = computed(() => store.clients)
const openDialog = ref(false)
const clientToDelete = ref(null)

// Import helpers
const fileInput = ref(null)
const importing = ref(false)
const importMessage = ref('')

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
        const phone = (norm['phone'] ?? norm['telefono'] ?? '') || null
        const debt = Number(norm['debt'] ?? norm['saldo'] ?? norm['deuda'] ?? 0) || 0
        const discount = Number(norm['discount'] ?? 0) || 0
        const tagIdRaw = norm['tag id'] ?? norm['tagid'] ?? norm['tag'] ?? norm['etiqueta']
        const tagId = (tagIdRaw === null || tagIdRaw === undefined || tagIdRaw === '') ? null : (isNaN(Number(tagIdRaw)) ? tagIdRaw : Number(tagIdRaw))

        const clientObj = { name: String(name).trim(), phone: phone || null, debt, discount }
        if (id !== undefined) clientObj.id = id
        if (tagId !== null) clientObj.tagId = tagId

        if (id !== undefined) {
          await store.updateClient(clientObj)
          updated++
        } else {
          await store.addClient(clientObj)
          added++
        }
      } catch (errRow) {
        console.error('Import row failed', errRow)
        failed++
      }
    }

    importMessage.value = `Import complete: ${added} added, ${updated} updated, ${failed} failed.`
    // reload clients
    await store.loadClients()
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

// tags + filtering
const tagsStore = useTagsStore()
const tags = computed(() => (tagsStore.tags || []).slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'')))
const selectedTags = ref([])
const tagDialogOpen = ref(false)
const newTagName = ref('')
const deleteTagDialogOpen = ref(false)
const tagToDelete = ref(null)

// Long-press handling for tags (use pointer events so scrolling isn't blocked)
const longPressed = ref(false)
let pressTimer = null
let startX = 0
let startY = 0
const MOVE_THRESHOLD = 8 // pixels

// Map for tag lookups
const tagsById = computed(() => {
  const m = new Map()
  for (const t of tags.value) {
    if (t && t.id !== undefined) m.set(String(t.id), t.name)
  }
  return m
})

const tagName = (id) => {
  if (id === undefined || id === null) return ''
  return tagsById.value.get(String(id)) || ''
}

const formatCurrency = (value) => {
  try {
    const v = Number(value) || 0
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(v)
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return `$${Number(value || 0).toFixed(2)}`
  }
}

const selectAllTags = () => { selectedTags.value = [] }

const origToggleTag = (tag) => {
  const i = selectedTags.value.findIndex(t => t.id === tag.id)
  if (i === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(i, 1)
}

const createTag = async () => {
  const name = String(newTagName.value ?? '').trim()
  if (!name) return
  await tagsStore.addTag({ name })
  newTagName.value = ''
  tagDialogOpen.value = false
}

const filteredClients = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const filtered = !query
    ? clients.value
    : clients.value.filter(client =>
      client.name.toLowerCase().includes(query)
    )

  // If tags are selected, filter clients that match ANY selected tag (OR mode)
  if (selectedTags.value.length > 0) {
    const selIds = new Set(selectedTags.value.map(t => String(t.id)))
    return filtered.filter(c => selIds.has(String(c.tagId)))
  }

  return filtered.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

const dialogDelete = client => {
  clientToDelete.value = client
  openDialog.value = true
}

const deleteClient = id => {
  store.deleteClient(id)
}

const startPress = (tag, ev) => {
  if (pressTimer) clearTimeout(pressTimer)
  longPressed.value = false
  startX = ev.clientX || 0
  startY = ev.clientY || 0
  pressTimer = setTimeout(() => {
    longPressed.value = true
    tagToDelete.value = tag
    deleteTagDialogOpen.value = true
  }, 700)
}

const endPress = () => {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
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

const toggleTag = (tag) => {
  if (longPressed.value) return
  origToggleTag(tag)
}

const confirmDeleteTag = async () => {
  if (!tagToDelete.value) return
  const deleted = { ...tagToDelete.value }
  const tagId = deleted.id
  const affectedClients = store.clients.filter(c => c && (c.tagId === tagId || String(c.tagId) === String(tagId))).map(c => ({ ...c }))

  try {
    await tagsStore.deleteTag(tagId)
    for (const c of affectedClients) {
      const updated = { ...c }
      if (String(updated.tagId) === String(tagId)) updated.tagId = null
      await store.updateClient(updated)
    }
    const idx = selectedTags.value.findIndex(t => t.id === tagId)
    if (idx !== -1) selectedTags.value.splice(idx, 1)
  } catch (e) {
    console.error('confirmDeleteTag', e)
  }
  tagToDelete.value = null
  deleteTagDialogOpen.value = false
}

// Mounted
onMounted(() => {
  store.loadClients()
  tagsStore.loadTags()
})
</script>
