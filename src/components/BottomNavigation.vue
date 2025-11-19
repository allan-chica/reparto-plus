<template>
  <div class="w-full">
    <nav class="py-2 flex justify-evenly border bg-stone-100 dark:bg-stone-900 rounded-t-md max-w-xl mx-auto">
      <!-- Repartidores -->
      <!-- <router-link to="/clients" class="p-2 rounded-sm transition-colors" :class="{
        'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900':
          route.name == 'Clientes',
      }">
        <Store :size="32" />
      </router-link> -->
      <!-- Ventas -->
      <router-link to="/sales" class="p-2 rounded-sm transition-colors" :class="{
        'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900': route.name == 'Ventas',
      }">
        <ChartNoAxesCombined :size="32" />
      </router-link>
      <!-- Productos -->
      <router-link to="/foods" class="p-2 rounded-sm transition-colors" :class="{
        'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900':
          route.name == 'Productos',
      }">
        <Package :size="32" />
      </router-link>
      <!-- Clientes -->
      <router-link to="/clients" class="p-2 rounded-sm transition-colors" :class="{
        'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900':
          route.name == 'Clientes',
      }">
        <Store :size="32" />
      </router-link>
    </nav>
  </div>
</template>

<script setup>
// Icons
import { ChartNoAxesCombined, Store, Package } from 'lucide-vue-next'

import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>
