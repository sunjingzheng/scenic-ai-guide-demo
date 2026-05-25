import { createRouter, createWebHistory } from 'vue-router'

// 用户端页面
import UserLayout from './views/user/UserLayout.vue'
import HomePage from './views/user/HomePage.vue'
import OverviewPage from './views/user/OverviewPage.vue'
import SpotsPage from './views/user/SpotsPage.vue'
import RoutesPage from './views/user/RoutesPage.vue'
import ProfilePage from './views/user/ProfilePage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: UserLayout,
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', name: 'home', component: HomePage },
        { path: 'overview', name: 'overview', component: OverviewPage },
        { path: 'spots', name: 'spots', component: SpotsPage },
        { path: 'routes', name: 'routes', component: RoutesPage },
        { path: 'profile', name: 'profile', component: ProfilePage }
      ]
    }
  ]
})
