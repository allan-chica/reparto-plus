<template>

  <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
    <DialogContent class="max-w-lg">
      <!-- Header -->
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold">Recibo</DialogTitle>
        <DialogDescription>Acá podes descargar y compartir el recibo</DialogDescription>
      </DialogHeader>

      <!-- HTML Preview -->
      <ScrollArea class="border rounded-lg overflow-hidden max-h-[32rem]">
        <div class="p-4 receipt bg-white text-black">
          <!-- Title -->
          <div class="text-right font-bold text-stone-700 -mb-3">REMITO</div>
          <!-- Header -->
          <div class="flex justify-between items-end">
            <div>
              <img src="/src/img/logo.jpg" alt="" class="w-32">
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold">Tel: 2665009704</p>
              <p class="text-xs font-semibold">Ruta 20 y Concaran, Juana Koslay</p>
            </div>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between mb-2">
            <p><strong>Sr.:</strong> {{ sale.client?.name }}</p>
            <p>{{ date }}</p>
          </div>
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-sm border px-1.5 py-1 text-center" style="width: 1px">Cant.</th>
                <th class="text-sm border px-1.5 py-1 text-left">Detalle</th>
                <th class="text-sm border px-1.5 py-1 text-right" style="width: 1px">Precio Unit.</th>
                <th class="text-sm border px-1.5 py-1 text-right" style="width: 1px">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in sortedProducts" :key="product.id">
                <td class="border px-1.5 py-1 text-center whitespace-nowrap">{{ product.quantity }}</td>
                <td class="border px-1.5 py-1">{{ product.name }}</td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap">
                  ${{ formatPrice(product.price) }}
                </td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap">
                  ${{ formatPrice(product.price * product.quantity) }}
                </td>
              </tr>
              <tr v-if="debtIncluded && debtAmount > 0">
                <td class="border px-1.5 py-1 text-center whitespace-nowrap"></td>
                <td class="border px-1.5 py-1">Deuda</td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap"></td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap font-bold">${{ formatPrice(debtAmount) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="hasDiscount" class="mt-3">
            <div class="flex justify-between items-center">
              <p class="ml-auto text-right text-base">Subtotal: ${{ formatPrice(totalPrice) }}</p>
            </div>
            <div class="flex justify-between items-center">
              <p class="ml-auto text-right text-base">Descuento: -${{ formatPrice(totalPrice - saleProductsTotalFromSale) }}</p>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-xs">Documento NO válido como factura</p>
              <p class="ml-auto text-right font-bold text-lg">Total: ${{ formatPrice(sale.total) }}</p>
            </div>
          </div>
          <div v-else class="flex justify-between items-center mt-3">
            <p class="text-xs">Documento NO válido como factura</p>
            <p class="text-right font-bold text-lg">Total: ${{ formatPrice(sale.total) }}</p>
          </div>
        </div>
      </ScrollArea>

      <!-- Receipt to print -->
      <div ref="receipt-ref" class="absolute top-[-9999px] left-[-9999px] w-lg">
        <div class="p-4 receipt bg-white text-black">
          <!-- Title -->
          <div class="text-right font-bold text-stone-700 -mb-1">REMITO</div>
          <!-- Header -->
          <div class="flex justify-between items-end">
            <div>
              <img src="/src/img/logo.jpg" alt="" class="w-32">
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold">Tel: 2665009704</p>
              <p class="text-xs font-semibold">Ruta 20 y Concaran, Juana Koslay</p>
            </div>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between mb-2">
            <p><strong>Sr.:</strong> {{ sale.client?.name }}</p>
            <p>{{ date }}</p>
          </div>
          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="text-sm border px-1.5 py-1 text-center" style="width: 1px">Cant.</th>
                <th class="text-sm border px-1.5 py-1 text-left">Detalle</th>
                <th class="text-sm border px-1.5 py-1 text-right text-nowrap" style="width: 1px">Precio Unit.</th>
                <th class="text-sm border px-1.5 py-1 text-right" style="width: 1px">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in sortedProducts" :key="product.id">
                <td class="border px-1.5 py-1 text-center whitespace-nowrap">{{ product.quantity }}</td>
                <td class="border px-1.5 py-1">{{ product.name }}</td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap">
                  ${{ formatPrice(product.price) }}
                </td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap">
                  ${{ formatPrice(product.price * product.quantity) }}
                </td>
              </tr>
              <tr v-if="debtIncluded && debtAmount > 0">
                <td class="border px-1.5 py-1 text-center whitespace-nowrap"></td>
                <td class="border px-1.5 py-1">Deuda</td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap"></td>
                <td class="border px-1.5 py-1 text-right whitespace-nowrap font-bold">${{ formatPrice(debtAmount) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="hasDiscount" class="mt-3">
            <div class="flex justify-between items-center">
              <p class="ml-auto text-right text-base">Subtotal: ${{ formatPrice(totalPrice) }}</p>
            </div>
            <div class="flex justify-between items-center">
              <p class="ml-auto text-right text-base">Descuento: -${{ formatPrice(totalPrice - saleProductsTotalFromSale) }}</p>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-xs">Documento NO válido como factura</p>
              <p class="ml-auto text-right font-bold text-lg">Total: ${{ formatPrice(sale.total) }}</p>
            </div>
          </div>
          <div v-else class="flex justify-between items-center mt-3">
            <p class="text-xs">Documento NO válido como factura</p>
            <p class="text-right font-bold text-lg">Total: ${{ formatPrice(sale.total) }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <Button class="flex-1" size="lg" variant="outline" :disabled="loadingAction" @click="downloadReceipt">
          <span v-if="loadingAction === 'download'">Generando...</span>
          <span v-else class="flex items-center gap-2">
            <Download /> Descargar
          </span>
        </Button>

        <Button class="flex-1" size="lg" variant="default" :disabled="loadingAction" @click="shareReceipt">
          <span v-if="loadingAction === 'share'">Generando...</span>
          <span v-else class="flex items-center gap-2">
            <Share2 /> Compartir
          </span>
        </Button>
      </div>

    </DialogContent>
  </Dialog>

</template>

<script setup>
import { ref, computed, useTemplateRef } from 'vue'
import html2canvas from 'html2canvas-pro'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Download, Share2 } from 'lucide-vue-next'

// Props
const props = defineProps({
  isOpen: Boolean,
  sale: {
    type: Object,
    default: () => ({ client: {}, products: [], total: 0 })
  }
})

const receiptRef = useTemplateRef('receipt-ref')
const loadingAction = ref(null)

const sortedProducts = computed(() => {
  return [...props.sale.products].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()
    ))
})

const totalPrice = computed(() => {
  return props.sale.products.reduce((total, product) => {
    return total + (product.price * product.quantity)
  }, 0)
})

const discount = computed(() => props.sale.client.discount)
const hasDiscount = computed(() => {
  if (!discount.value) return
  return discount.value > 0
})

const debtAmount = computed(() => Number(props.sale.debt?.amount) || 0)
const debtIncluded = computed(() => Boolean(props.sale.debt?.included))

// Derive the products total stored in the sale (sale.total minus included debt)
const saleProductsTotalFromSale = computed(() => {
  return Number(props.sale.total || 0) - (debtIncluded.value ? debtAmount.value : 0)
})

const formatPrice = price => new Intl.NumberFormat('es-AR').format(price)

const date = computed(() => {
  const dateObj = new Date(props.sale.date)
  return dateObj.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
})

const generateReceiptImage = async () => {
  if (!receiptRef.value) return null
  const canvas = await html2canvas(receiptRef.value, { scale: 2 })
  return canvas.toDataURL('image/jpeg', 0.95)
}

const getFileName = () => {
  const clientString = props.sale.client?.name
    ? props.sale.client.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'cliente'
  const dateString = new Date(props.sale.date).toISOString().split('T')[0].split('-').reverse().join('-')
  return `recibo.${clientString}.${dateString}.jpg`
}

const downloadReceipt = async () => {
  loadingAction.value = 'download'
  try {
    const image = await generateReceiptImage()
    if (!image) return

    const link = document.createElement('a')
    link.href = image
    link.download = getFileName()
    link.click()
  } finally {
    loadingAction.value = null
  }
}

const shareReceipt = async () => {
  loadingAction.value = 'share'
  try {
    const image = await generateReceiptImage()
    if (!image) return
    const response = await fetch(image)
    const blob = await response.blob()
    const file = new File([blob], getFileName(), { type: 'image/jpeg' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Recibo de Venta',
        text: `Recibo de venta para ${props.sale.client?.name || 'Cliente'}`,
        files: [file]
      })
    }

  } catch (err) {
    console.error('Error sharing', err)
  } finally {
    loadingAction.value = null
  }
}
</script>
