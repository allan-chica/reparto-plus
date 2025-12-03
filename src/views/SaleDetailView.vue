<template>
  <div class="p-6 max-w-xl mx-auto flex flex-col h-full">

    <!-- Actions -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-4 items-center">
        <Button type="submit" size="icon" variant="outline" @click="router.push('/sales')">
          <ChevronLeft />
        </Button>
        <h1 class="text-2xl font-semibold truncate">Detalles</h1>
      </div>

      <div class="flex gap-2">
        <Button size="icon" variant="outline" @click="router.push(`/sale/edit/${sale.id}`)">
          <Pencil />
        </Button>
        <Button size="icon" variant="destructive" @click="viewDeleteDialog = true">
          <Trash2 />
        </Button>
      </div>
    </div>

    <!-- Header -->
    <div>
      <!-- Info -->
      <div class="flex gap-3 items-center justify-between mb-3">
        <!-- Status and name -->
        <div class="flex gap-3 items-center">
          <p class="text-xl font-semibold">{{ sale.client?.name || 'Cliente desconocido' }}</p>
        </div>

        <!-- Date and time -->
        <p class="text-muted-foreground">{{ date }}</p>
      </div>

      <!-- Payment management -->
      <div @click="viewPaymentDialog = true"
        class="flex justify-between items-center gap-2 mb-4 cursor-pointer w-full border rounded-lg p-4 font-semibold"
        :class="{ 'text-red-400 border-dashed': !sale.isPaid }">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <StatusIcon class="w-fit" :sale="sale" />
            <span>{{ paymentText }}</span>
          </div>
          <div v-if="sale.payment?.type == 'mix'" class="mt-2">
            <p class="text-sm font-normal text-muted-foreground">${{ formatPrice(sale.payment.details.cash) }} en
              efectivo</p>
            <p class="text-sm font-normal text-muted-foreground">${{ formatPrice(sale.payment.details.debt) }} por
              transferencia</p>
          </div>
        </div>
        <ChevronRight />
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 min-h-0 flex flex-col">
      <h3 class="text-lg font-semibold">Productos:</h3>
      <div class="flex-1 min-h-0">
        <ScrollArea class="h-full">
          <div v-for="product in sale.products" :key="product.id"
            class="p-3 flex justify-between items-center border-b rounded-md">
            <div class="flex flex-col">
              <p class="font-semibold text-lg">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-muted-foreground">{{ product.quantity }}x ${{ formatPrice(product.price) }}</p>
                <template v-if="saleLinePriceInfo(product).type === 'client'">
                  <span class="text-xs px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 font-medium text-purple-700 dark:text-purple-300">Cliente</span>
                </template>
                <template v-else-if="saleLinePriceInfo(product).type === 'tag'">
                  <span class="text-xs px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700/50 font-medium text-sky-700 dark:text-sky-300">Etiqueta</span>
                </template>
                <template v-else-if="saleLinePriceInfo(product).type === 'special'">
                  <span class="text-xs px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 font-medium text-amber-700 dark:text-amber-300">Especial</span>
                </template>
              </div>
              <p class="text-sm text-stone-500 mt-1">Precio base: ${{ formatPrice(saleLinePriceInfo(product).base ?? product.price) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">{{ product.quantity }}x ${{ formatPrice(product.price) }}</p>
              <p class="text-green-600 dark:text-green-500 font-semibold text-lg text-right">
                ${{ formatPrice(product.price * product.quantity) }}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t pt-4 flex items-center justify-between">
      <Button size="lg" variant="outline" @click="isReceiptOpen = true">
        <Printer /> Ver recibo
      </Button>
      <div v-if="hasDiscount">
        <div class="flex justify-between items-center gap-2">
          <p>Subtotal:</p>
          <p>${{ formatPrice(totalPrice) }}</p>
        </div>
        <div class="flex justify-between items-center gap-2">
          <p>Descuento ({{ discount }}%):</p>
          <p class="text-red-700 dark:text-red-300">-${{ formatPrice(totalPrice - sale.total) }}</p>
        </div>
        <div class="flex justify-between items-center text-lg font-semibold gap-2">
          <p>Total:</p>
          <p>${{ formatPrice(sale.total) }}</p>
        </div>
      </div>
      <div v-else class="flex justify-between items-center text-lg font-semibold gap-1.5">
        <p>Total:</p>
        <p>${{ formatPrice(sale.total) }}</p>
      </div>
    </div>

    <AlertDialog v-model:open="viewPaymentDialog">
      <AlertDialogContent class="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-lg font-semibold">Estado de pago</AlertDialogTitle>
        </AlertDialogHeader>

        <div>
          <!-- Paid switch -->
          <div class="flex items-center gap-3 justify-center">
            <Switch v-model="isPaid" />
            <span>Pagado</span>
          </div>

          <!-- Tabs for payment type -->
          <div v-if="isPaid" class="w-full mt-6">
            <Tabs v-model="paymentType" class="w-full">
              <TabsList class="w-full">
                <TabsTrigger value="cash">
                  <Banknote /> Efectivo
                </TabsTrigger>
                <TabsTrigger value="debt">
                  <Wallet /> Transferencia
                </TabsTrigger>
                <TabsTrigger value="mix">
                  <Split /> Mixto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cash" class="flex justify-center items-center gap-3 mt-4">
                <StatusIcon :sale="{ isPaid: true, payment: { type: 'cash' } }" />
                <p>El pago fue realizado completamente en
                  efectivo.
                </p>
              </TabsContent>

              <TabsContent value="debt" class="flex justify-center items-center gap-3 mt-4">
                <StatusIcon :sale="{ isPaid: true, payment: { type: 'debt' } }" />
                <p>El pago fue realizado completamente por
                  transferencia.</p>
              </TabsContent>

              <TabsContent value="mix" class="flex gap-3 w-full">
                <div class="flex-1 flex gap-3 mt-4">
                  <div class="flex-1 flex flex-col gap-2">
                    <Label class="text-sm font-medium" for="mixedCash">Efectivo</Label>
                    <Input id="mixedCash" type="number" v-model="mixedCash" placeholder="Monto"
                      class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div class="flex-1 flex flex-col gap-2">
                    <Label class="text-sm font-medium" for="mixedDebt">Transferencia</Label>
                    <Input id="mixedDebt" type="number" v-model="mixedDebt" placeholder="Monto"
                      class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div class="flex mt-4 gap-3">
          <Button class="flex-1" size="lg" variant="outline" @click="viewPaymentDialog = false">Cancelar</Button>
          <Button class="flex-1" size="lg" @click="savePayment">Guardar</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="viewDeleteDialog">

      <AlertDialogContent>

        <!-- Dialog header -->
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estas seguro que querés eliminar ésta venta? Esto no se podrá recuperar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <!-- Dialog footer -->
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="deletePayment">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>

      </AlertDialogContent>

    </AlertDialog>

    <ReceiptDialog :sale="sale" :is-open="isReceiptOpen" @update:isOpen="isReceiptOpen = false" />
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, Pencil, Trash2, Printer, ChevronRight } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useProductsStore } from '@/stores/products'
import StatusIcon from '@/components/StatusIcon.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TabsContent from '@/components/ui/tabs/TabsContent.vue'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Wallet, Banknote, Split } from 'lucide-vue-next'
import ReceiptDialog from '@/components/ReceiptDialog.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import AlertDialogFooter from '@/components/ui/alert-dialog/AlertDialogFooter.vue'
import AlertDialogCancel from '@/components/ui/alert-dialog/AlertDialogCancel.vue'
import AlertDialogAction from '@/components/ui/alert-dialog/AlertDialogAction.vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const router = useRouter()
const route = useRoute()
const saleStore = useSalesStore()

const saleId = computed(() => route.params.id)
const sale = ref({})
const productStore = useProductsStore()

// helper: map current products by id
const productsById = computed(() => {
  const m = new Map()
  for (const p of (productStore.products || [])) {
    if (p && p.id !== undefined) m.set(String(p.id), p)
  }
  return m
})

const getProductRecord = (productId) => {
  return productsById.value.get(String(productId)) || null
}

// Determine price source for a sale line using current product record and sale.client
const saleLinePriceInfo = (line) => {
  // line: { id, name, price, quantity }
  const rec = getProductRecord(line.id)
  const client = sale.value.client
  const base = rec ? Number(rec.basePrice ?? rec.price ?? 0) : undefined

  // If we can inspect current product, try to infer where price came from
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

  // fallback: if we know base and it differs, show base
  if (base !== undefined && Number(line.price) !== Number(base)) return { type: 'special', base }
  return { type: 'base', base }
}
const isReceiptOpen = ref(false)

const viewPaymentDialog = ref(false)
const viewDeleteDialog = ref(false)

// Local state for tabs
const isPaid = ref(false)
const paymentType = ref('cash') // 'cash' | 'debt' | 'mix'
const mixedCash = ref('')
const mixedDebt = ref('')

const date = computed(() => {
  return new Date(sale.value.date).toLocaleString('es-ES', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const paymentText = computed(() => {
  if (sale.value.isPaid) {
    if (sale.value.payment.type == 'debt') {
      return 'Pagado con transferencia'
    } else if (sale.value.payment.type == 'cash') {
      return 'Pagado con efectivo'
    } else {
      return 'Pagado con efectivo y transferencia'
    }
  } else {
    return 'Sin pagar'
  }
})

// Discount
const totalPrice = computed(() => {
  return sale.value?.products.reduce((total, product) => {
    return total + (product.price * product.quantity)
  }, 0)
})

const discount = ref(0)

const hasDiscount = computed(() => {
  if (!discount.value) return
  return discount.value > 0
})

// Sync inputs in mixed mode
watch(mixedCash, newVal => {
  if (paymentType.value == 'mix') {
    const total = sale.value.total || 0
    mixedDebt.value = Math.max(total - Number(newVal || 0), 0)
  }
})

watch(mixedDebt, newVal => {
  if (paymentType.value == 'mix') {
    const total = sale.value.total || 0
    mixedCash.value = Math.max(total - Number(newVal || 0), 0)
  }
})

// Methods
const savePayment = async () => {
  sale.value.isPaid = isPaid.value

  if (!isPaid.value) { // Not paid
    sale.value.payment = { type: null, details: null }
  } else {
    const details = paymentType.value === 'mix'
      ? { cash: Number(mixedCash.value), debt: Number(mixedDebt.value) }
      : null
    sale.value.payment = { type: paymentType.value, details }
  }

  await saleStore.updateSale(JSON.parse(JSON.stringify(sale.value)))

  // Close dialog
  viewPaymentDialog.value = false
}

const deletePayment = async () => {
  await saleStore.deleteSale(sale.value.id)
  router.push('/sales')
}

const formatPrice = price => {
  return new Intl.NumberFormat('es-AR').format(price)
}

onMounted(async () => {
  // ensure local products cache is populated so we can show base prices and tag/client mappings
  await productStore.loadProducts()

  const dbSale = await saleStore.getSaleById(Number(saleId.value))

  if (dbSale) {
    Object.assign(sale.value, dbSale)

    isPaid.value = sale.value.isPaid
    if (sale.value.payment?.type) paymentType.value = sale.value.payment.type
    if (sale.value.payment?.details) {
      mixedCash.value = sale.value.payment.details.cash || ''
      mixedDebt.value = sale.value.payment.details.debt || ''
    }
    discount.value = sale.value.client.discount

  } else {
    router.push('/sales')
  }
})
</script>
