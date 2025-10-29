import { createRouter, createWebHistory } from 'vue-router'
import BodyMap from '../views/BodyMapDemo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'body-map',
      component: BodyMap
    }
  ]
})

export default router

