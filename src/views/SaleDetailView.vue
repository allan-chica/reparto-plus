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
    <div class="border-b mb-5">
      <!-- Info -->
      <div class="flex gap-3 items-center justify-between mb-3">
        <!-- Status and name -->
        <div class="flex gap-3 items-center">
          <p class="text-xl font-semibold">{{ sale.client?.name || 'Cliente desconocido' }}</p>
        </div>

        <!-- Date and time -->
        <p class="text-muted-foreground">{{ date }}</p>
      </div>
    </div>

    <!-- Payments list -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">Pagos</h3>
          <StatusIcon class="w-fit" :sale="sale" />
        </div>
        <Button size="sm" @click="addPaymentDialog = true">Agregar pago</Button>
      </div>
        <div class="space-y-2">
          <div class="mt-2">
            <div class="flex items-center justify-between text-sm text-muted-foreground">
              <div>Pagado: ${{ formatPrice(totalPaid) }}</div>
              <div>Falta: ${{ formatPrice(remainingTotal) }}</div>
            </div>
            <div class="w-full bg-stone-100 dark:bg-stone-900 h-2 rounded mt-2 overflow-hidden">
              <div class="bg-green-500 h-2" :style="{ width: percentPaid + '%' }"></div>
            </div>
          </div>
          <div v-if="!sale.payments || sale.payments.length === 0" class="text-sm text-muted-foreground">No hay pagos registrados.</div>
          <div v-for="(p, idx) in sale.payments" :key="idx" class="flex justify-between items-center p-2 border rounded-md">
            <div class="flex items-center gap-3" style="flex:1;" @click="openEditPayment(idx)">
              <div>
                <p class="font-medium">{{ p.type === 'cash' ? 'Efectivo' : 'Transferencia' }}</p>
                <p class="text-xs text-muted-foreground">{{ new Date(p.date).toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="font-semibold">${{ formatPrice(p.amount) }}</div>
              <Button size="icon" variant="ghost" @click.stop="requestDeletePayment(idx)">
                <Trash2 class="size-4" />
              </Button>
            </div>
          </div>
        </div>
    </div>

    <!-- Products list -->
    <div class="flex-1 min-h-0 flex flex-col">
      <h3 class="text-lg font-semibold">Productos</h3>
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

          <!-- Debt row (if present on sale) -->
          <div v-if="sale.debt && Number(sale.debt.amount) > 0 && sale.debt.included" class="p-3 flex justify-between items-center border-b rounded-md">
            <div class="flex flex-col">
              <p class="font-semibold text-lg">Deuda anterior</p>
            </div>
            <div>
              <p class="text-green-600 dark:text-green-500 font-semibold text-lg text-right">${{ formatPrice(sale.debt.amount) }}</p>
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
          <p class="text-red-700 dark:text-red-300">-${{ formatPrice(totalPrice - saleProductsTotalFromSale) }}</p>
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

    <!-- Add Payment Dialog -->
    <Dialog v-model:open="addPaymentDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar pago</DialogTitle>
        </DialogHeader>

        <div class="mt-2 space-y-3">
          <div class="flex flex-col gap-2">
            <Label for="payAmount">Monto</Label>
                <div class="flex items-center gap-2">
                  <Input id="payAmount" v-model="newPaymentAmount" type="number" placeholder="0.00" class="flex-1" />
                  <Button size="sm" variant="outline" @click="newPaymentAmount = remainingAmount">Completar</Button>
                </div>
          </div>

              <div class="flex flex-col gap-2">
                <Label for="payType">Tipo</Label>
                <Tabs v-model="newPaymentType">
                  <TabsList class="w-full">
                    <TabsTrigger value="cash">Efectivo</TabsTrigger>
                    <TabsTrigger value="debt">Transferencia</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="addPaymentDialog = false">Cancelar</Button>
          <Button @click="addPayment">Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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

    <!-- Delete single payment confirmation -->
    <AlertDialog v-model:open="deletePaymentDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar pago</AlertDialogTitle>
          <AlertDialogDescription>¿Estás seguro que querés eliminar este pago? Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deletePaymentDialog = false">Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="confirmDeletePayment">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <ReceiptDialog :sale="sale" :is-open="isReceiptOpen" @update:isOpen="isReceiptOpen = false" />
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { ChevronLeft, Pencil, Trash2, Printer } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useProductsStore } from '@/stores/products'
import StatusIcon from '@/components/StatusIcon.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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

const viewDeleteDialog = ref(false)
const addPaymentDialog = ref(false)
const newPaymentAmount = ref('')
const newPaymentType = ref('cash')
const editingPaymentIndex = ref(null)
const deletePaymentIndex = ref(null)
const deletePaymentDialog = ref(false)

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

const paymentTotals = computed(() => {
  const payments = sale.value.payments || []
  const cash = payments.filter(p => p.type === 'cash').reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const debt = payments.filter(p => p.type === 'debt').reduce((s, p) => s + (Number(p.amount) || 0), 0)
  return { cash, debt }
})

// Totals and progress for payments
const totalPaid = computed(() => {
  return (sale.value?.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
})

const remainingTotal = computed(() => {
  return Math.max(Number(sale.value?.total || 0) - totalPaid.value, 0)
})

const percentPaid = computed(() => {
  const total = Number(sale.value?.total || 0)
  if (!total) return 0
  return Math.min(100, Math.round((totalPaid.value / total) * 100))
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

// Debt info from sale
const debtAmount = computed(() => Number(sale.value?.debt?.amount) || 0)
const debtIncluded = computed(() => Boolean(sale.value?.debt?.included))

// Derive the products total stored in the sale (sale.total minus included debt)
const saleProductsTotalFromSale = computed(() => {
  return Number(sale.value?.total || 0) - (debtIncluded.value ? debtAmount.value : 0)
})

// Remaining amount to be paid for this sale (total - sum(payments))
const remainingAmount = computed(() => {
  const total = Number(sale.value?.total || 0)
  const paid = (sale.value?.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  return Math.max(total - paid, 0)
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

      // Ensure payments array exists (migrate legacy single payment -> payments)
      if (!Array.isArray(sale.value.payments)) {
        sale.value.payments = []
        // If there is a legacy sale.payment with details, try to populate payments
        if (sale.value.payment && sale.value.payment.type) {
          if (sale.value.payment.type === 'mix' && sale.value.payment.details) {
            const d = sale.value.payment.details
            if (d.cash) sale.value.payments.push({ amount: Number(d.cash) || 0, type: 'cash', date: Date.now() })
            if (d.debt) sale.value.payments.push({ amount: Number(d.debt) || 0, type: 'debt', date: Date.now() })
          } else if (sale.value.payment.type === 'cash' || sale.value.payment.type === 'debt') {
            // Unknown amount - assume full total
            sale.value.payments.push({ amount: Number(sale.value.total) || 0, type: sale.value.payment.type, date: Date.now() })
          }
        }
      }

    isPaid.value = sale.value.isPaid
    // derive mixed inputs from payments
    mixedCash.value = paymentTotals.value.cash || ''
    mixedDebt.value = paymentTotals.value.debt || ''
    discount.value = sale.value.client.discount

  } else {
    router.push('/sales')
  }
})

const addPayment = async () => {
  const amt = Number(newPaymentAmount.value)
  if (!sale.value || !amt || amt <= 0) return

  sale.value.payments = sale.value.payments || []
  if (editingPaymentIndex.value !== null && sale.value.payments[editingPaymentIndex.value]) {
    // update existing
    sale.value.payments[editingPaymentIndex.value].amount = amt
    sale.value.payments[editingPaymentIndex.value].type = newPaymentType.value
    sale.value.payments[editingPaymentIndex.value].date = Date.now()
  } else {
    sale.value.payments.push({ amount: amt, type: newPaymentType.value, date: Date.now() })
  }

  // Recompute summary payment fields
  const totalPaid = sale.value.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  sale.value.isPaid = totalPaid >= Number(sale.value.total || 0)

  await saleStore.updateSale(JSON.parse(JSON.stringify(sale.value)))
  newPaymentAmount.value = ''
  newPaymentType.value = 'cash'
  editingPaymentIndex.value = null
  addPaymentDialog.value = false
}

const openEditPayment = (idx) => {
  if (!sale.value || !sale.value.payments || !sale.value.payments[idx]) return
  const p = sale.value.payments[idx]
  editingPaymentIndex.value = idx
  newPaymentAmount.value = p.amount
  newPaymentType.value = p.type || 'cash'
  addPaymentDialog.value = true
}

const requestDeletePayment = (idx) => {
  deletePaymentIndex.value = idx
  deletePaymentDialog.value = true
}

const confirmDeletePayment = async () => {
  const idx = deletePaymentIndex.value
  if (idx === null || !sale.value || !sale.value.payments || !sale.value.payments[idx]) return
  sale.value.payments.splice(idx, 1)

  // recompute payment summary
  const totalPaid = sale.value.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  sale.value.isPaid = totalPaid >= Number(sale.value.total || 0)

  if (sale.value.payments.length === 0) {
    // no legacy `payment` field - everything is kept in `payments` array
  }

  await saleStore.updateSale(JSON.parse(JSON.stringify(sale.value)))
  deletePaymentIndex.value = null
  deletePaymentDialog.value = false
}
</script>
