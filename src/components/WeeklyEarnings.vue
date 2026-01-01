<template>
  <div class="space-y-2">

    <h3 class="text-lg font-semibold">Datos semanales:</h3>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-2">
      <div
        class="flex items-center gap-3 rounded-lg p-2.5 bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
        <ChartNoAxesCombined size="20" />
        <div>
          <div class="text-orange-700 dark:text-orange-300 text-sm -mb-1">Total</div>
          <div class="text-lg font-bold">${{ formatPrice(weeklyTotal) }}</div>
        </div>
      </div>
      <div
        class="flex items-center gap-3 rounded-lg p-2.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
        <CircleOff size="20" />
        <div>
          <div class="text-red-700 dark:text-red-300 text-sm -mb-1">Sin pagar</div>
          <div class="text-lg font-bold">${{ formatPrice(weeklyNotPaid) }}</div>
        </div>
      </div>
      <div
        class="flex items-center gap-3 rounded-lg p-2.5 bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
        <Banknote size="20" />
        <div>
          <div class="text-green-700 dark:text-green-300 text-sm -mb-1">Efectivo</div>
          <div class="text-lg font-bold">${{ formatPrice(paymentSplit.cash) }}</div>
        </div>
      </div>
      <div
        class="flex items-center gap-3 rounded-lg p-2.5 bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        <Wallet size="20" />
        <div>
          <div class="text-sky-700 dark:text-sky-300 text-sm -mb-1">Transferencia</div>
          <div class="text-lg font-bold">${{ formatPrice(paymentSplit.debt) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { Banknote, ChartNoAxesCombined, CircleOff, Wallet } from 'lucide-vue-next'

// State
const saleStore = useSalesStore()

const weeklySales = computed(() => saleStore.sales.filter(sale => sale.date && isThisWeek(sale.date)))

const weeklyTotal = computed(() => {
  // Sum of all sale totals for the week
  return weeklySales.value.reduce((sum, sale) => sum + (Number(sale.total || 0)), 0)
})

const weeklyNotPaid = computed(() => {
  // Sum unpaid portion per sale (total - paid, floored at 0)
  return weeklySales.value.reduce((sum, sale) => {
    const payments = sale.payments || []
    const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const unpaid = Math.max(Number(sale.total || 0) - paid, 0)
    return sum + unpaid
  }, 0)
})

// const earnings = computed(() => weeklyTotal.value * 0.1)

const paymentSplit = computed(() => {
  let cash = 0
  let debt = 0

  // Sum actual payment amounts per type (includes partial payments)
  weeklySales.value.forEach(sale => {
    const payments = sale.payments || []
    if (!payments.length) return
    cash += payments.filter(p => p.type === 'cash').reduce((s,p)=>s+Number(p.amount||0),0)
    debt += payments.filter(p => p.type === 'debt').reduce((s,p)=>s+Number(p.amount||0),0)
  })

  return { cash, debt }
})

// Methods
const isThisWeek = date => {
  const d = new Date(date)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday as start
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return d >= startOfWeek && d < endOfWeek
}

const formatPrice = price => {
  return new Intl.NumberFormat('es-AR').format(price)
}

// Lifecycle hooks
onMounted(async () => {
  await saleStore.loadSales()
})

</script>
