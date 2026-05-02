<script setup lang="ts">
import { Bot, Database, LineChart, MessageSquareHeart, MonitorSmartphone } from 'lucide-vue-next'
import { RouterLink, RouterView } from 'vue-router'

const nav = [
  { to: '/admin/dashboard', label: '数据大屏', icon: LineChart },
  { to: '/admin/knowledge', label: '知识库管理', icon: Database },
  { to: '/admin/avatar', label: '数字人形象', icon: Bot },
  { to: '/admin/feedback', label: '感受度报告', icon: MessageSquareHeart }
]
</script>

<template>
  <main class="admin-shell">
    <aside class="admin-sidebar">
      <RouterLink class="brand" to="/">
        <MonitorSmartphone :size="25" />
        <span>灵山 AI 导览</span>
      </RouterLink>
      <nav>
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to">
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <section class="admin-main">
      <RouterView />
    </section>
  </main>
</template>
