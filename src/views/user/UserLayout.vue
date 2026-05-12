<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Home, Map, Compass, MessageCircle, Route, User, Landmark } from 'lucide-vue-next'
import FloatingAvatar from '../../components/FloatingAvatar.vue'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/overview', icon: Map, label: '园区总览' },
  { path: '/spots', icon: Compass, label: '景点探索' },
  { path: '/guide', icon: MessageCircle, label: '数字导员' },
  { path: '/routes', icon: Route, label: '路线推荐' },
  { path: '/profile', icon: User, label: '个人中心' }
]

// For mobile: show primary nav items (limit to 5 per bottom nav guidelines)
const mobileNavItems = [
  { path: '/home', icon: Home, label: '首页' },
  { path: '/overview', icon: Map, label: '总览' },
  { path: '/guide', icon: MessageCircle, label: '导览' },
  { path: '/routes', icon: Route, label: '路线' },
  { path: '/profile', icon: User, label: '我的' }
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="user-layout">
    <!-- 顶部导航栏 -->
    <header class="top-navbar glass-card">
      <div class="navbar-brand">
        <div class="brand-icon">
          <Landmark :size="32" />
        </div>
        <div class="brand-text">
          <h1>灵山胜境</h1>
          <span>AI智能导览</span>
        </div>
      </div>

      <nav class="navbar-menu">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- 浮动数字人助手 -->
    <FloatingAvatar />

    <!-- 移动端底部导航栏 -->
    <nav class="bottom-nav">
      <button
        v-for="item in mobileNavItems"
        :key="item.path"
        class="bottom-nav-item"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- 底部信息 -->
    <footer class="footer">
      <p>&copy; 2024 灵山胜境 AI 智能导览系统 | 技术支持：AI Lab</p>
    </footer>
  </div>
</template>

<style scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.top-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  margin: var(--spacing-md);
  border-radius: var(--radius-xl);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.brand-icon {
  font-size: 2.5rem;
}

.brand-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-text span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.navbar-menu {
  display: flex;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: var(--primary-50);
  color: var(--primary-600);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  box-shadow: var(--shadow-md);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding-bottom: var(--spacing-2xl);
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端底部导航 */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: rgba(237, 243, 238, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 -4px 20px rgba(142, 160, 149, 0.15);
  padding: 6px 0;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 6px);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 0.65rem;
  cursor: pointer;
  transition: color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item.active {
  color: var(--primary-600);
}

.bottom-nav-item.active svg {
  filter: drop-shadow(0 1px 3px rgba(50, 143, 98, 0.3));
}

.bottom-nav-item span {
  font-size: 0.6rem;
  line-height: 1;
}

/* 底部信息 */
.footer {
  text-align: center;
  padding: var(--spacing-lg);
  padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0px));
  color: var(--text-tertiary);
  font-size: 0.875rem;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-light);
}

@media (max-width: 1024px) {
  .navbar-menu {
    display: none;
  }

  .top-navbar {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .top-navbar {
    padding: var(--spacing-sm) var(--spacing-md);
    margin: var(--spacing-sm);
    justify-content: space-between;
  }

  .brand-text h1 {
    font-size: 1rem;
  }

  .brand-icon svg {
    width: 28px;
    height: 28px;
  }

  .brand-icon {
    font-size: 1.75rem;
  }

  .bottom-nav {
    display: flex;
  }

  .main-content {
    padding-bottom: calc(var(--spacing-2xl) + 70px);
  }

  .footer {
    padding-bottom: calc(var(--spacing-lg) + 70px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
