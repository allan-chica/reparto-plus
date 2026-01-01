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

const isPaidStatus = status => {
  if (!props.sale || !props.sale.payments || (props.sale.payments.length === 0)) return false

  const total = Number(props.sale.total || 0)
  const paid = props.sale.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  if (paid < total) return false

  // determine payment type
  const types = new Set((props.sale.payments || []).map(p => p.type))
  if (types.size === 1) {
    return Array.from(types)[0] === status
  }
  // multiple types => mix
  return status === 'mix'
}
</script>
