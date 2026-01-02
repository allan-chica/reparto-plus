<template>
  <div class="p-6 max-w-xl mx-auto flex flex-col h-full">

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Ventas</h1>
      <Button type="submit" @click="router.push('/sales/new')">Nueva Venta</Button>
    </div>

    <div class="mb-4">
      <WeeklyEarnings />
    </div>

    <div class="flex-1 min-h-0">
      <ScrollArea class="h-full">
        <div v-for="group in groupedSalesArray" :key="group.day">

          <!-- Sticky date header -->
          <div class="sticky top-0 bg-background/95 backdrop-blur-sm py-2 px-3 border-b">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {{ group.day }}
            </h3>
          </div>

          <div v-for="sale in group.sales" :key="sale.id" @click="router.push(`/sale/${sale.id}`)"
            class="p-3 hover:bg-muted rounded-md cursor-pointer mb-2 flex justify-between items-center" :class="{
              'border-l-3 border-red-700 dark:border-red-300': !sale.isPaid, // No pagado
              'border-l-3 border-sky-700 dark:border-sky-300': isPaidStatus(sale, 'debt'), // Transferencia
              'border-l-3 border-green-700 dark:border-green-300': isPaidStatus(sale, 'cash'), // Efectivo
              'border-l-3 border-orange-700 dark:border-orange-300': isPaidStatus(sale, 'mix') // Mixto
            }">
            <div class="flex-1 flex gap-3 items-center">
              <StatusIcon :sale="sale" />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <div class="min-w-0">
                    <p class="text-lg font-semibold truncate">{{ sale.client.name }}<span v-if="hasPaidToDebt(sale)" class="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">Pago a deuda</span></p>
                    <p class="text-muted-foreground text-xs mt-0.5">{{ getSaleTime(sale) }}</p>
                    <div class="mt-2 flex items-center gap-4 text-sm">
                      <div class="flex items-baseline gap-1 truncate"><span class="text-muted-foreground">Pagado</span><span class="font-medium">${{ formatPrice(totalPaid(sale)) }}</span></div>
                      <div class="flex items-baseline gap-1 truncate"><span class="text-muted-foreground">Falta</span><span class="font-medium">${{ formatPrice(remainingAmount(sale)) }}</span></div>
                    </div>
                  </div>
                </div>

                <div class="w-full bg-stone-100 dark:bg-stone-900 h-2 rounded mt-3 overflow-hidden">
                  <div class="bg-green-500 h-2" :style="{ width: paidPercent(sale) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="bg-stone-100 dark:bg-stone-900 p-2 rounded-md text-right">
              <div class="font-semibold">${{ formatPrice(productsTotal(sale)) }}</div>
              <div v-if="sale.debt && sale.debt.included" class="text-xs text-muted-foreground">Incluye deuda: ${{ formatPrice(Number(sale.debt.amount || 0)) }}</div>
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>

  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSalesStore } from '@/stores/sales'
import { computed, onMounted } from 'vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WeeklyEarnings from '@/components/WeeklyEarnings.vue'

const router = useRouter()
const saleStore = useSalesStore()

const sales = computed(() => saleStore.sales)

const groupedSalesArray = computed(() => {
  // Sort newest first
  const sorted = [...sales.value].sort((a, b) => b.date - a.date)

  // Group by day
  const groups = sorted.reduce((acc, sale) => {
    const date = new Date(sale.date)
    const day = date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(sale)
    return acc
  }, {})

  return Object.entries(groups).map(([day, sales]) => ({
    day,
    sales
  }))
})

// Methods
const getSaleTime = sale => {
  const date = new Date(sale.date)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const formatPrice = price => {
  return new Intl.NumberFormat('es-AR').format(price)
}

const productsTotal = sale => {
  return Number(sale.total || 0) - ((sale.debt && sale.debt.included) ? Number(sale.debt.amount || 0) : 0)
}

const allocatePayments = (payments = [], saleProductsTotal = 0) => {
  let remaining = Number(saleProductsTotal || 0)
  let paidSale = 0
  let paidDebt = 0
  const sorted = [...(payments || [])].sort((a, b) => (a.date || 0) - (b.date || 0))
  const allocated = []
  for (const p of sorted) {
    const amt = Number(p.amount || 0)
    const toSale = Math.max(0, Math.min(remaining, amt))
    const toDebt = Math.max(0, amt - toSale)
    remaining = Math.max(0, remaining - toSale)
    paidSale += toSale
    paidDebt += toDebt
    allocated.push({ ...p, toSale, toDebt })
  }
  return { allocated, paidSale, paidDebt }
}

const paidAmount = sale => {
  const payments = sale?.payments || []
  const pt = productsTotal(sale)
  return allocatePayments(payments, pt).paidSale
}

const paidToDebt = sale => {
  const payments = sale?.payments || []
  const pt = productsTotal(sale)
  return allocatePayments(payments, pt).paidDebt
}

const remainingAmount = sale => {
  const pt = productsTotal(sale)
  const paid = paidAmount(sale)
  return Math.max(pt - paid, 0)
}

const paidPercent = sale => {
  const pt = productsTotal(sale)
  if (!pt) return 0
  const paid = paidAmount(sale)
  return Math.min(100, Math.round((paid / pt) * 100))
}

const hasPaidToDebt = sale => paidToDebt(sale) > 0

const totalPaid = sale => {
  const payments = sale?.payments || []
  return payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

const isPaidStatus = (sale, status) => {
  const payments = sale.payments || []
  if (payments && payments.length > 0) {
    const pt = productsTotal(sale)
    const { allocated, paidSale } = allocatePayments(payments, pt)
    if (paidSale < pt) return false
    const types = new Set(allocated.filter(a => a.toSale > 0).map(a => a.type))
    if (types.size === 1) return Array.from(types)[0] === status
    return status === 'mix'
  }
  return false
}

onMounted(() => {
  saleStore.loadSales()
})
</script>
