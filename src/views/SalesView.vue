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
                <p class="text-lg font-semibold truncate">{{ sale.client.name }}</p>
                <p class="text-muted-foreground">{{ getSaleTime(sale) }}</p>

                <div class="mt-2 text-sm text-muted-foreground flex items-center gap-3">
                  <div>Pagado: ${{ formatPrice(paidAmount(sale)) }}</div>
                  <div>Falta: ${{ formatPrice(remainingAmount(sale)) }}</div>
                </div>

                <div class="w-full bg-stone-100 dark:bg-stone-900 h-1 rounded mt-2 overflow-hidden">
                  <div class="bg-green-500 h-1" :style="{ width: paidPercent(sale) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="bg-stone-100 dark:bg-stone-900 p-2 rounded-md">
              <p class="font-semibold">${{ formatPrice(sale.total) }}</p>
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

const paidAmount = sale => {
  const payments = sale?.payments || []
  return payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

const remainingAmount = sale => {
  const total = Number(sale.total || 0)
  const paid = paidAmount(sale)
  return Math.max(total - paid, 0)
}

const paidPercent = sale => {
  const total = Number(sale.total || 0)
  if (!total) return 0
  const paid = paidAmount(sale)
  return Math.min(100, Math.round((paid / total) * 100))
}

const isPaidStatus = (sale, status) => {
  // Prefer payments array
  const payments = sale.payments
  if (payments && payments.length > 0) {
    const total = Number(sale.total || 0)
    const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    if (paid < total) return false
    const types = new Set(payments.map(p => p.type))
    if (types.size === 1) return Array.from(types)[0] === status
    return status === 'mix'
  }

  return false
}

onMounted(() => {
  saleStore.loadSales()
})
</script>
