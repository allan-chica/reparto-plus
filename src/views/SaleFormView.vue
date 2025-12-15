<template>
  <div class="relative px-6 pt-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex flex-col h-full transition-all duration-300 ease-in-out"
      :class="{ 'scale-95 brightness-75': viewSummary }">
      <div class="flex gap-4 items-center mb-4">
        <Button type="submit" size="icon" variant="outline" @click="router.back()">
          <ChevronLeft />
        </Button>
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar' : 'Nueva' }} venta</h1>
      </div>
      <Dialog v-model:open="clientDialogOpen">
          <DialogTrigger as-child>
          <div
            class="flex justify-between items-center gap-2 mb-4 cursor-pointer w-full border rounded-lg p-3 font-semibold"
            :class="{ 'text-red-400 border-dashed': !selectedClient }">
            <div class="flex items-center gap-3">
              <div class="flex flex-col text-left">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold leading-none">{{ selectedClient ? selectedClient.name : 'Seleccionar cliente' }}</span>
                  <span v-if="selectedClient && selectedClient.discount > 0" class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30">-{{ selectedClient.discount }}%</span>
                </div>
                <span v-if="selectedClient && clientTagName(selectedClient)" class="text-xs text-muted-foreground mt-0.5">{{ clientTagName(selectedClient) }}</span>
              </div>
            </div>
            <ChevronRight />
          </div>
        </DialogTrigger>
        <DialogContent class="max-w-2xl max-h-[80vh] flex flex-col">
          <!-- Header -->
          <DialogHeader>
            <DialogTitle>Seleccionar cliente</DialogTitle>
            <DialogDescription>
              Selecciona un cliente para continuar con la venta.
            </DialogDescription>
          </DialogHeader>
          <!-- Search input -->
          <div class="relative items-center">
            <Input v-model="clientSearchQuery" placeholder="Buscar..." class="pl-9" id="search" />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
              <Search class="size-5 text-muted-foreground" />
            </span>
          </div>
          <div class="flex-1 min-h-0">
            <AlphabetScroll :items="filteredClients" label-key="name" id-key="id" :scrollAreaClass="'h-full max-h-96'">
              <template #item="{ item }">
                <div class="p-3 rounded-md cursor-pointer hover:bg-muted flex items-center justify-between" @click="selectClient(item)">
                  <div class="flex items-center gap-3">
                    <div>
                      <p class="font-semibold">{{ item.name }}</p>
                      <p v-if="clientTagName(item)" class="text-xs text-muted-foreground">{{ clientTagName(item) }}</p>
                    </div>
                  </div>
                  <div class="text-muted-foreground text-sm">Seleccionar</div>
                </div>
              </template>
              <template #empty>
                <div class="text-center text-muted-foreground py-8">
                  <p>No hay clientes registrados.</p>
                  <p class="text-sm mt-1">Agrega algunos clientes para empezar.</p>
                </div>
              </template>
            </AlphabetScroll>
          </div>
        </DialogContent>
      </Dialog>
      <div class="relative mb-4 items-center">
        <Input v-model="productSearchQuery" placeholder="Buscar..." class="pl-9" id="search" />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
          <Search class="size-5 text-muted-foreground" />
        </span>
      </div>
      <!-- Products list -->
      <div class="flex-1 min-h-0">
        <AlphabetScroll :items="filteredProducts" label-key="name" id-key="id" scroll-area-class="h-full"
          letter-header-class="bg-background/95 backdrop-blur-sm py-2 px-3">
          <template #item="{ item }">
            <div class="p-3 flex justify-between items-center border mb-3" :class="{
                    'border-transparent': !getProductQuantity(item),
                    'bg-stone-100 dark:bg-stone-900/50 border-muted rounded-md': getProductQuantity(item)
                  }">
              <div class="flex flex-col text-lg">
                <div class="flex items-baseline gap-3">
                  <p class="font-semibold text-base">{{ item.name }}</p>
                  <template v-if="selectedClient">
                    <template v-if="resolvePriceForClient(item, selectedClient).type === 'client'">
                      <span class="text-xs px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 font-medium text-purple-700 dark:text-purple-300">Cliente</span>
                    </template>
                    <template v-else-if="resolvePriceForClient(item, selectedClient).type === 'tag'">
                      <span class="text-xs px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700/50 font-medium text-sky-700 dark:text-sky-300">Etiqueta</span>
                    </template>
                  </template>
                </div>

                <!-- Prices: show special (if any) and base price -->
                <div class="flex items-center gap-3 mt-1">
                  <template v-if="selectedClient">
                    <div>
                      <p class="text-lg md:text-xl text-green-600 dark:text-green-500 font-bold leading-none">
                        ${{ formatPrice(resolvePriceForClient(item, selectedClient).price) }}
                      </p>
                      <p v-if="resolvePriceForClient(item, selectedClient).type !== 'base'" class="text-sm md:text-base text-stone-500 line-through mt-0.5">${{ formatPrice(item.basePrice ?? item.price) }}</p>
                    </div>
                  </template>
                  <template v-else>
                    <p class="text-lg md:text-xl text-green-600 dark:text-green-500 font-bold">${{ formatPrice(item.basePrice ?? item.price) }}</p>
                  </template>
                </div>
              </div>
              <div class="flex items-center mt-2">
                <div class="inline-flex items-center rounded-full border overflow-hidden">
                  <Button size="icon" variant="ghost" class="px-3 py-2" :disabled="!getProductQuantity(item)" @click="removeProduct(item)">
                    <Minus />
                  </Button>
                  <div class="px-4 py-2 text-sm font-semibold text-center border-l border-r" :class="{ 'text-green-700 dark:text-green-400': getProductQuantity(item) }">{{ getProductQuantity(item) }}</div>
                  <Button size="icon" variant="ghost" class="px-3 py-2" @click="addProduct(item)">
                    <Plus />
                  </Button>
                </div>
              </div>
            </div>
          </template>
          <template #empty>
            <div class="text-center text-muted-foreground py-8">
              <p>No hay productos.</p>
              <p class="text-sm mt-1">Agrega productos para empezar a vender.</p>
            </div>
          </template>
        </AlphabetScroll>
      </div>

      <Transition enter-active-class="transition-all duration-300 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0" enter-to-class="max-h-[100px] opacity-100"
        leave-active-class="transition-all duration-300 ease-in overflow-hidden"
        leave-from-class="max-h-[100px] opacity-100" leave-to-class="max-h-0 opacity-0">
        <div class="bg-background border-t shadow-lg" v-if="selectedProducts.length > 0">
          <div class="flex justify-between items-center p-4 max-w-xl mx-auto">
            <div>
              <p>{{ selectedProducts.length }} productos</p>
              <p class="text-lg font-bold" :class="{ 'line-through': hasDiscount }">${{ formatPrice(totalPrice) }}</p>
              <p class="text-lg font-bold" v-if="hasDiscount">${{ formatPrice(totalPriceWithDiscount) }}</p>
            </div>
            <Button :disabled="!selectedClient" @click="viewSummary = true">Ver resumen</Button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Sale summary -->
    <Transition enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-100" enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in" leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-100">
      <div v-if="viewSummary"
        class="absolute top-0 left-0 h-full w-full bg-background rounded-lg px-6 pt-6 flex flex-col">

        <!-- Header -->
        <div class="flex gap-4 items-center mb-4">
          <Button type="submit" size="icon" variant="outline" @click="viewSummary = false">
            <ChevronLeft />
          </Button>
          <h1 class="text-2xl font-semibold truncate">
            Venta a <span class="underline">{{ selectedClient.name }}</span>
          </h1>
        </div>

        <!-- Products list -->
        <div class="flex-1 overflow-y-auto space-y-3">
          <ScrollArea class="h-full">
            <div v-for="product in sortedSelectedProducts" :key="product.id"
              class="p-3 flex justify-between items-center border-b rounded-md">
              <!-- Product info -->
              <div class="flex flex-col">
                <div class="flex items-center gap-3">
                  <p class="font-semibold text-lg">{{ product.name }}</p>
                  <template v-if="getSelectedLineInfo(product).type === 'client'">
                    <span class="text-xs px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 font-medium text-purple-700 dark:text-purple-300">Cliente</span>
                  </template>
                  <template v-else-if="getSelectedLineInfo(product).type === 'tag'">
                    <span class="text-xs px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700/50 font-medium text-sky-700 dark:text-sky-300">Etiqueta</span>
                  </template>
                  <template v-else-if="getSelectedLineInfo(product).type === 'special'">
                    <span class="text-xs px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 font-medium text-amber-700 dark:text-amber-300">Especial</span>
                  </template>
                </div>
                <p class="text-muted-foreground">1x ${{ formatPrice(product.price) }}</p>
                <p class="text-green-600 dark:text-green-500 font-semibold">
                  ${{ formatPrice(product.price * product.quantity) }}
                </p>
                <p class="text-sm text-stone-500 mt-1">Precio base: ${{ formatPrice(getSelectedLineInfo(product).base ?? product.price) }}</p>
              </div>

              <!-- Quantity controls -->
              <div class="flex items-center space-x-2">
                <Button size="icon" variant="outline" @click="removeProduct(product)">
                  <Trash v-if="product.quantity == 1" />
                  <Minus v-else />
                </Button>

                <span class="font-semibold border-b p-2 border-green-600 dark:border-green-500">
                  {{ product.quantity }}
                </span>

                <Button size="icon" variant="outline" @click="addProduct(product)">
                  <Plus />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- Footer -->
        <div class="border-t pt-4 pb-6">
          <div v-if="hasDiscount">
            <div class="flex justify-end gap-3 items-center">
              <p>Subtotal</p>
              <p>${{ formatPrice(totalPrice) }}</p>
            </div>
            <div class="flex justify-end gap-3 items-center">
              <p>Descuento ({{ discount }}%)</p>
              <p class="text-red-700 dark:text-red-300">-${{ formatPrice(totalPrice - totalPriceWithDiscount) }}</p>
            </div>
            <div class="flex justify-end gap-3 items-center mb-4 text-lg font-semibold">
              <p>Total</p>
              <p>${{ formatPrice(totalPriceWithDiscount) }}</p>
            </div>
          </div>
          <div v-else class="flex justify-end gap-3 items-center mb-4 text-lg font-semibold">
            <p>Total</p>
            <p>${{ formatPrice(totalPriceWithDiscount) }}</p>
          </div>
          <Button class="w-full mt-2" size="lg" @click="confirmSale">Confirmar venta</Button>

          <!-- Receipt dialog -->
          <ReceiptDialog :isOpen="isReceiptOpen" :sale="lastSale" @update:isOpen="onReceiptClose" />
        </div>

      </div>
    </Transition>

    <!-- Sale completion dialog -->
    <AlertDialog v-model:open="completedDialogOpen">
      <AlertDialogContent class="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-lg font-semibold">Venta completada</AlertDialogTitle>
          <AlertDialogDescription>La venta se guardó correctamente.</AlertDialogDescription>
        </AlertDialogHeader>
        <div class="flex mt-4 gap-3">
          <Button class="flex-1" size="lg" variant="outline" @click="goToList">Volver a la
            lista</Button>
          <Button class="flex-1" size="lg" @click="viewReceipt">Ver recibo</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>

  </div>

</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { ChevronLeft, ChevronRight, Search, Plus, Minus, Trash } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import AlphabetScroll from '@/components/AlphabetScroll.vue'
import ReceiptDialog from '@/components/ReceiptDialog.vue'
import { useClientsStore } from '@/stores/clients'
import { useTagsStore } from '@/stores/tags'
import { useProductsStore } from '@/stores/products'
import { useSalesStore } from '@/stores/sales'

const router = useRouter()
const clientStore = useClientsStore()
const productStore = useProductsStore()
const saleStore = useSalesStore()

const clients = computed(() => clientStore.clients)
const tagsStore = useTagsStore()

const tagsById = computed(() => {
  const map = new Map()
  for (const t of (tagsStore.tags || [])) {
    if (t && t.id !== undefined) map.set(String(t.id), t.name)
  }
  return map
})

const clientTagName = (client) => {
  if (!client || client.tagId === undefined || client.tagId === null) return ''
  return tagsById.value.get(String(client.tagId)) || ''
}
const clientSearchQuery = ref('')
const selectedClient = ref(null)
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
const clientDialogOpen = ref(false)

const products = computed(() => productStore.products)
const productSearchQuery = ref('')
const filteredProducts = computed(() => {
  const query = productSearchQuery.value.toLowerCase().trim()
  const filtered = !query
    ? products.value
    : products.value.filter(product =>
      product.name.toLowerCase().includes(query)
    )

  return filtered.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

const isEditing = ref(false)
const selectedProducts = ref([])
const viewSummary = ref(false)
const sortedSelectedProducts = computed(() => {
  return [...selectedProducts.value].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
})

const isReceiptOpen = ref(false)
const lastSale = ref({})
const saleId = ref(null)

// quick lookup for products in store
const productsById = computed(() => {
  const m = new Map()
  for (const p of (productStore.products || [])) {
    if (p && p.id !== undefined) m.set(String(p.id), p)
  }
  return m
})

const getStoreProduct = (id) => productsById.value.get(String(id)) || null

const getSelectedLineInfo = (line) => {
  // line has id, name, price, quantity
  const rec = getStoreProduct(line.id)
  const base = rec ? Number(rec.basePrice ?? rec.price ?? 0) : undefined
  const client = selectedClient.value
  if (client && rec) {
    const clientId = client.id
    const tagId = client.tagId
    if (rec.specialClientPrices && Object.prototype.hasOwnProperty.call(rec.specialClientPrices, String(clientId))) {
      const cp = Number(rec.specialClientPrices[String(clientId)])
      if (Number(line.price) === cp) return { type: 'client', base }
    }
    if (tagId !== undefined && tagId !== null && rec.pricesByTags && Object.prototype.hasOwnProperty.call(rec.pricesByTags, String(tagId))) {
      const tp = Number(rec.pricesByTags[String(tagId)])
      if (Number(line.price) === tp) return { type: 'tag', base }
    }
  }
  if (base !== undefined && Number(line.price) !== Number(base)) return { type: 'special', base }
  return { type: 'base', base }
}

const totalPrice = computed(() => {
  return selectedProducts.value.reduce((total, product) => {
    return total + (product.price * product.quantity)
  }, 0)
})

const totalPriceWithDiscount = computed(() => totalPrice.value - (totalPrice.value * (discount.value / 100)))

const completedDialogOpen = ref(false)

const discount = computed(() => selectedClient.value?.discount)
const hasDiscount = computed(() => {
  if (!discount.value) return
  return discount.value > 0
})

// Methods
const selectClient = client => {
  selectedClient.value = client
  clientDialogOpen.value = false
}

// Reprice selectedProducts according to the provided client (or null)
const repriceSelectedProducts = (client) => {
  if (!selectedProducts.value || selectedProducts.value.length === 0) return
  const grouped = new Map()

  for (const line of selectedProducts.value) {
    const storeRec = getStoreProduct(line.id)
    const resolved = resolvePriceForClient(storeRec || { basePrice: line.price, price: line.price }, client)
    const price = Number(resolved.price)
    const key = `${line.id}::${price}`
    if (grouped.has(key)) {
      grouped.get(key).quantity += line.quantity || 0
    } else {
      grouped.set(key, {
        id: line.id,
        name: line.name,
        price,
        quantity: line.quantity || 0
      })
    }
  }

  selectedProducts.value = Array.from(grouped.values())
}

// Resolve price for a product given a client
const resolvePriceForClient = (product, client) => {
  const base = Number(product.basePrice ?? product.price ?? 0)
  if (!client) return { price: base, type: 'base' }
  const clientId = client.id
  const tagId = client.tagId

  // Special client price wins
  if (product.specialClientPrices && Object.prototype.hasOwnProperty.call(product.specialClientPrices, String(clientId))) {
    return { price: Number(product.specialClientPrices[String(clientId)]), type: 'client' }
  }

  // Then per-tag price
  if (tagId !== undefined && tagId !== null && product.pricesByTags && Object.prototype.hasOwnProperty.call(product.pricesByTags, String(tagId))) {
    return { price: Number(product.pricesByTags[String(tagId)]), type: 'tag' }
  }

  return { price: base, type: 'base' }
}

const addProduct = (product) => {
  // product can be either a store product (no quantity) or a selectedProducts entry (has quantity)
  if (product && Object.prototype.hasOwnProperty.call(product, 'quantity')) {
    // selected line -> increase by reference
    const idx = selectedProducts.value.findIndex(p => p.id === product.id && Number(p.price) === Number(product.price))
    if (idx !== -1) selectedProducts.value[idx].quantity++
    return
  }

  const client = selectedClient.value
  const resolved = resolvePriceForClient(product, client)
  const price = resolved.price

  // Group by product id + price so different-priced lines are separate
  const existingProduct = selectedProducts.value.find(p => p.id === product.id && Number(p.price) === Number(price))
  if (existingProduct) {
    existingProduct.quantity++
  } else {
    selectedProducts.value.push({
      id: product.id,
      name: product.name,
      price,
      quantity: 1
    })
  }
}

const removeProduct = (product) => {
  // product can be selectedProducts entry or store product
  if (product && Object.prototype.hasOwnProperty.call(product, 'quantity')) {
    // selected line -> decrease or remove
    const idx = selectedProducts.value.findIndex(p => p.id === product.id && Number(p.price) === Number(product.price))
    if (idx !== -1) {
      if (selectedProducts.value[idx].quantity > 1) selectedProducts.value[idx].quantity--
      else selectedProducts.value.splice(idx, 1)
    }
    return
  }

  const client = selectedClient.value
  const resolved = resolvePriceForClient(product, client)
  const price = resolved.price

  // find matching line (id + price)
  const existingIndex = selectedProducts.value.findIndex(p => p.id === product.id && Number(p.price) === Number(price))
  if (existingIndex !== -1) {
    const existingProduct = selectedProducts.value[existingIndex]
    if (existingProduct.quantity > 1) existingProduct.quantity--
    else selectedProducts.value.splice(existingIndex, 1)
  }
}

const getProductQuantity = (product) => {
  // Sum quantities for product id and price that applies for current selected client
  if (!product) return 0
  const client = selectedClient.value
  const resolved = resolvePriceForClient(product, client)
  const price = resolved.price

  return selectedProducts.value.reduce((sum, p) => {
    if (p.id === product.id && Number(p.price) === Number(price)) return sum + (p.quantity || 0)
    return sum
  }, 0)
}

const formatPrice = price => {
  return new Intl.NumberFormat('es-AR').format(price)
}

const confirmSale = async () => {
  const client = JSON.parse(JSON.stringify(selectedClient.value))
  const products = JSON.parse(JSON.stringify(selectedProducts.value))
  const total = hasDiscount.value ? totalPriceWithDiscount.value : totalPrice.value
  const date = Date.now()

  lastSale.value = { client, products, total, date }
  const id = await saleStore.addSale({
    client,
    products,
    total,
    date,
    isPaid: false,
    payment: {
      type: null,
      details: null
    }
  })

  completedDialogOpen.value = true
  saleId.value = id
}

const viewReceipt = () => {
  completedDialogOpen.value = false
  isReceiptOpen.value = true
}

const onReceiptClose = () => {
  isReceiptOpen.value = false
  router.push(`/sale/${saleId.value}`)
}

const goToList = () => {
  router.push('/sales')
  viewSummary.value = false
}

const handlePopState = () => {
  if (viewSummary.value) {
    viewSummary.value = false
    // Prevent going back further
    history.pushState(null, '')
  }
}

// Lifecycle hooks
watch(viewSummary, newVal => {
  if (newVal) {
    // Add a fake history entry
    history.pushState({ summaryOpen: true }, '')
  }
})

onMounted(() => {
  clientStore.loadClients()
  productStore.loadProducts()
  tagsStore.loadTags()

  window.addEventListener('popstate', handlePopState)
})

// Reprice cart whenever the selected client changes
watch(selectedClient, (newClient, oldClient) => {
  // avoid unnecessary work when unchanged
  if (newClient === oldClient) return
  repriceSelectedProducts(newClient)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>
