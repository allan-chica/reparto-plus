<template>
  <div class="rounded-full p-2 flex items-center justify-center" :class="{
    'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300': !props.sale.isPaid, // No pagado
    'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300': isPaidStatus('debt'), // Transferencia
    'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300': isPaidStatus('cash'), // Efectivo
    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300': isPaidStatus('mix'), // Mixto
  }">
    <CircleOff v-if="!props.sale.isPaid" size="16" />
    <Wallet v-else-if="isPaidStatus('debt')" size="16" />
    <Banknote v-else-if="isPaidStatus('cash')" size="16" />
    <Split v-else-if="isPaidStatus('mix')" size="16" />
  </div>
</template>

<script setup>
import { CircleOff, Wallet, Banknote, Split } from 'lucide-vue-next'

const props = defineProps({
  sale: {
    type: Object,
    required: true
  }
})

const allocatePayments = (payments = [], saleTotal = 0) => {
  const allocated = []
  let remaining = Number(saleTotal || 0)
  const sorted = [...payments].sort((a, b) => (a.date || 0) - (b.date || 0))

  let paidSale = 0
  let paidDebt = 0

  sorted.forEach(p => {
    const amount = Number(p.amount || 0)
    const toSale = Math.max(0, Math.min(remaining, amount))
    const toDebt = Math.max(0, amount - toSale)
    remaining = Math.max(0, remaining - toSale)
    paidSale += toSale
    paidDebt += toDebt
    allocated.push({ ...p, toSale, toDebt })
  })

  return { allocated, paidSale, paidDebt }
}

const isPaidStatus = status => {
  if (!props.sale) return false
  const payments = props.sale.payments || []
  if (!payments.length) return false

  const productsTotal = Number(props.sale.total || 0) - (props.sale.debt && props.sale.debt.included ? Number(props.sale.debt.amount || 0) : 0)
  const { allocated, paidSale } = allocatePayments(payments, productsTotal)
  if (paidSale < productsTotal) return false

  const types = new Set(allocated.filter(a => a.toSale > 0).map(a => a.type))
  if (types.size === 1) return Array.from(types)[0] === status
  return status === 'mix'
}
</script>
