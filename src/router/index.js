import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'
import ClientsView from '@/views/ClientsView.vue'
import ClientFormView from '@/views/ClientFormView.vue'
import FoodsView from '@/views/FoodsView.vue'
import FoodFormView from '@/views/FoodFormView.vue'
import TagFormView from '@/views/TagFormView.vue'
import SalesView from '@/views/SalesView.vue'
import SaleFormView from '@/views/SaleFormView.vue'
import SaleDetailView from '@/views/SaleDetailView.vue'
// import SaleEditView from '@/views/SaleEditView.vue'

const routes = [
  {
    path: '/',
    // redirect: '/sales'
    component: MainLayout,
    children: [
      {
        path: '/',
        redirect: '/sales'
      },

      // Clients
      {
        path: 'clients',
        component: ClientsView,
        name: 'Clientes'
      },
      {
        path: '/clients/new',
        component: ClientFormView,
        name: 'Nuevo cliente'
      },
      {
        path: '/clients/edit/:id',
        component: ClientFormView,
        name: 'Editar cliente',
        props: true
      },

      // Foods
      {
        path: '/foods',
        component: FoodsView,
        name: 'Productos'
      },
      {
        path: '/foods/new',
        component: FoodFormView,
        name: 'Nuevo producto'
      },
      {
        path: '/foods/edit/:id',
        component: FoodFormView,
        name: 'Editar producto',
        props: true
      },

      // Tags
      {
        path: '/tags/new',
        component: TagFormView,
        name: 'Nueva etiqueta'
      },
      {
        path: '/tags/edit/:id',
        component: TagFormView,
        name: 'Editar etiqueta',
        props: true
      },

      // Sales
      {
        path: '/sales',
        component: SalesView,
        name: 'Ventas'
      },
    ]
  },

  {
    path: '/sales/new',
    component: SaleFormView,
    name: 'Nueva venta'
  },

  {
    path: '/sale/:id',
    component: SaleDetailView,
    name: 'Detalle venta',
    props: true
  },

  // {
  //   path: '/sale/edit/:id',
  //   component: SaleEditView,
  //   name: 'Editar venta',
  //   props: true
  // },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
