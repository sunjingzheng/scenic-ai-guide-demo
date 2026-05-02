<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'
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

const menuItems = [
  { key: 'dashboard', path: '/admin/dashboard', icon: DashboardOutlined, label: '数据概览' },
  { key: 'knowledge', path: '/admin/knowledge', icon: DatabaseOutlined, label: '知识库管理' },
  { key: 'avatar', path: '/admin/avatar', icon: UserOutlined, label: '数字人配置' },
  { key: 'feedback', path: '/admin/feedback', icon: MessageOutlined, label: '反馈报告' }
]

function isActive(path: string) {
  return route.path === path
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function logout() {
  router.push('/')
}
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🏛️</span>
          <span v-if="!collapsed" class="logo-text">灵山管理后台</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: isActive(item.path) }"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" class="menu-icon" />
          <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="menu-item" @click="logout">
          <LogoutOutlined class="menu-icon" />
          <span v-if="!collapsed" class="menu-label">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-wrapper">
      <!-- 顶部栏 -->
      <header class="top-header">
        <button class="collapse-btn" @click="toggleCollapse">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </button>

        <div class="header-actions">
          <button class="action-btn">
            <SettingOutlined />
          </button>
          <div class="user-info">
            <span>管理员</span>
            <div class="avatar">👤</div>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content-area">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--gray-50);
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
  text-align: left;
}

.menu-item:hover {
  background: var(--primary-50);
  color: var(--primary-600);
}

.menu-item.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.menu-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.menu-label {
  white-space: nowrap;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

/* 主内容区 */
.main-wrapper {
  flex: 1;
  margin-left: 240px;
  transition: margin-left var(--transition-base);
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed ~ .main-wrapper {
  margin-left: 80px;
}

.top-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  position: sticky;
  top: 0;
  z-index: 90;
}

.collapse-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--primary-50);
  color: var(--primary-600);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
}

.user-info span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.content-area {
  flex: 1;
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }

  .main-wrapper {
    margin-left: 80px;
  }

  .logo-text,
  .menu-label {
    display: none;
  }
}
</style>
