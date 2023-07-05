import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../components/ChatBox.vue'),
        }, {
          path: 'home/singal',
          name: 'singal',
          component: () => import('../components/SingalBox.vue'),
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Login.vue')
    }
  ]
})

export default router
