<template>
  <div class="px-6 pt-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Clientes</h1>
      <Button type="submit" @click="router.push('/clients/new')">Nuevo Cliente</Button>
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
            <button type="button" @click="toggleTag(tag)" :class="['inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition select-none', selectedTags.some(t => t.id === tag.id) ? 'bg-primary text-background' : 'bg-secondary/10 text-foreground']">{{ tag.name }}</button>
          </template>

          <button type="button" @click="tagDialogOpen = true" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-stone-600 text-primary">
            <Plus class="size-4" />
            Agregar
          </button>
        </div>
      </div>
    </div>

    <div class="relative mb-4 items-center">
      <Input v-model="searchQuery" placeholder="Buscar..." class="pl-9" id="search" />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
        <Search class="size-5 text-muted-foreground" />
      </span>
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

            <div class="flex items-center gap-2">
              <Button size="icon" variant="outline" @click="router.push(`/clients/edit/${item.id}`)">
                <Pencil class="size-4" />
              </Button>
              <Button size="icon" variant="destructive" @click="dialogDelete(item)">
                <Trash2 class="size-4" />
              </Button>
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

// tags + filtering
const tagsStore = useTagsStore()
const tags = computed(() => (tagsStore.tags || []).slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'')))
const selectedTags = ref([])
const tagDialogOpen = ref(false)
const newTagName = ref('')

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

const selectAllTags = () => { selectedTags.value = [] }
const toggleTag = (tag) => {
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

// Mounted
onMounted(() => {
  store.loadClients()
  tagsStore.loadTags()
})
</script>
