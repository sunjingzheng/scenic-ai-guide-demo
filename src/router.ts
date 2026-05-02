import { createRouter, createWebHistory } from 'vue-router'

// 用户端页面
import UserLayout from './views/user/UserLayout.vue'
import HomePage from './views/user/HomePage.vue'
import OverviewPage from './views/user/OverviewPage.vue'
import GuidePage from './views/user/GuidePage.vue'
import RoutesPage from './views/user/RoutesPage.vue'
import ProfilePage from './views/user/ProfilePage.vue'

// 管理端页面
import AdminLayout from './views/admin-pro/AdminLayout.vue'
import DashboardView from './views/admin-pro/DashboardView.vue'
import KnowledgeView from './views/admin-pro/KnowledgeView.vue'
import AvatarConfigView from './views/admin-pro/AvatarConfigView.vue'
import FeedbackReportView from './views/admin-pro/FeedbackReportView.vue'

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
        { path: 'spots', name: 'spots', component: OverviewPage }, // 复用园区总览
        { path: 'guide', name: 'guide', component: GuidePage },
        { path: 'routes', name: 'routes', component: RoutesPage },
        { path: 'profile', name: 'profile', component: ProfilePage }
      ]
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: DashboardView },
        { path: 'knowledge', name: 'admin-knowledge', component: KnowledgeView },
        { path: 'avatar', name: 'admin-avatar', component: AvatarConfigView },
        { path: 'feedback', name: 'admin-feedback', component: FeedbackReportView }
      ]
    }
  ]
})
