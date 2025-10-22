import { createRouter, createWebHistory } from 'vue-router'
import CurrentMap from '../views/CurrentMap.vue'
import History from '../views/History.vue'
import BodyMapDemo from '../views/BodyMapDemo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'current-map',
      component: CurrentMap
    },
    {
      path: '/history',
      name: 'history',
      component: History
    },
    {
      path: '/demo',
      name: 'body-map-demo',
      component: BodyMapDemo
    }
  ]
})

export default router

