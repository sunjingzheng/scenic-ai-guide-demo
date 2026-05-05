<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import {
  DashboardOutlined,
  DatabaseOutlined,
  UserOutlined,
  MessageOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = computed(() => {
  const active = menuItems.find((item) => route.path === item.path)
  return active ? [active.key] : ['dashboard']
})

const menuItems = [
  { key: 'dashboard', path: '/admin/dashboard', icon: DashboardOutlined, label: '数据概览' },
  { key: 'knowledge', path: '/admin/knowledge', icon: DatabaseOutlined, label: '知识库管理' },
  { key: 'avatar', path: '/admin/avatar', icon: UserOutlined, label: '数字人配置' },
  { key: 'feedback', path: '/admin/feedback', icon: MessageOutlined, label: '反馈报告' }
]

function openMenu({ key }: { key: string }) {
  const target = menuItems.find((item) => item.key === key)
  if (target) void router.push(target.path)
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function logout() {
  router.push('/')
}
</script>

<template>
  <a-layout class="admin-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      class="admin-sider"
      :width="248"
      :collapsed-width="84"
      :trigger="null"
    >
      <div class="brand">
        <div class="brand-icon">
          <UserOutlined />
        </div>
        <div v-if="!collapsed" class="brand-copy">
          <strong>灵山管理后台</strong>
          <span>Scenic AI Console</span>
        </div>
      </div>

      <a-menu
        class="admin-menu"
        mode="inline"
        :selected-keys="selectedKeys"
        @click="openMenu"
      >
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <template #icon>
            <component :is="item.icon" />
          </template>
          <span>{{ item.label }}</span>
        </a-menu-item>
      </a-menu>

      <div class="sider-footer">
        <a-button block class="neo-button" @click="logout">
          <template #icon><LogoutOutlined /></template>
          <span v-if="!collapsed">退出登录</span>
        </a-button>
      </div>
    </a-layout-sider>

    <a-layout class="main-wrapper">
      <a-layout-header class="top-header">
        <a-button class="icon-button" @click="toggleCollapse">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </a-button>

        <a-space :size="16">
          <a-button class="icon-button">
            <SettingOutlined />
          </a-button>
          <div class="admin-user">
            <span>管理员</span>
            <a-avatar class="user-avatar">
              <template #icon><UserOutlined /></template>
            </a-avatar>
          </div>
        </a-space>
      </a-layout-header>

      <a-layout-content class="content-area">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--surface);
}

.admin-sider {
  background: var(--surface-raised) !important;
  border-right: 1px solid var(--glass-border);
  box-shadow: 10px 0 28px rgba(151, 169, 158, 0.24);
  position: fixed !important;
  inset: 0 auto 0 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.brand {
  min-height: 84px;
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  color: var(--text-inverse);
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  box-shadow: var(--shadow-sm);
  flex: 0 0 auto;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy strong {
  font-size: 1rem;
  color: var(--text-primary);
  white-space: nowrap;
}

.brand-copy span {
  margin-top: 2px;
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

:deep(.admin-menu) {
  background: transparent;
  border-inline-end: 0 !important;
  padding: 0 var(--spacing-md);
}

:deep(.admin-menu .ant-menu-item) {
  height: 46px;
  line-height: 46px;
  margin: 0 0 var(--spacing-xs);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast);
}

:deep(.admin-menu .ant-menu-item:hover) {
  color: var(--primary-700) !important;
  background: var(--surface-raised) !important;
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

:deep(.admin-menu .ant-menu-item-selected) {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--text-inverse) !important;
  box-shadow: 8px 8px 18px rgba(107, 140, 119, 0.45), -8px -8px 18px rgba(255, 255, 255, 0.82);
}

:deep(.admin-menu .ant-menu-item-selected::after) {
  display: none;
}

.sider-footer {
  margin-top: auto;
  padding: var(--spacing-md);
}

.main-wrapper {
  min-height: 100vh;
  margin-left: 248px;
  background: transparent;
  transition: margin-left var(--transition-base);
}

.admin-sider.ant-layout-sider-collapsed + .main-wrapper {
  margin-left: 84px;
}

.top-header {
  height: 72px;
  padding: 0 var(--spacing-xl);
  background: rgba(246, 250, 247, 0.78);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 90;
}

.icon-button,
.neo-button {
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
}

.icon-button {
  width: 42px;
  height: 42px;
}

.icon-button:hover,
.neo-button:hover {
  color: var(--primary-700);
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.admin-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs) var(--spacing-md);
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-inset-sm);
}

.admin-user span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.user-avatar {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
}

.content-area {
  padding: var(--spacing-xl);
  min-height: calc(100vh - 72px);
  background: transparent;
}

@media (max-width: 768px) {
  .admin-sider {
    width: 84px !important;
    min-width: 84px !important;
    max-width: 84px !important;
  }

  .main-wrapper {
    margin-left: 84px;
  }

  .brand-copy,
  .neo-button span {
    display: none;
  }
}
</style>
