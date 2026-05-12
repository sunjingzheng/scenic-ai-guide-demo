<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, Map, MessageCircle, Route, Landmark, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const features = [
  {
    icon: Map,
    title: '园区总览',
    description: '全景展示灵山胜境各大景区',
    route: '/overview',
    color: 'emerald'
  },
  {
    icon: Compass,
    title: '景点探索',
    description: '深度了解每个景点的历史文化',
    route: '/spots',
    color: 'teal'
  },
  {
    icon: MessageCircle,
    title: '数字人导员',
    description: 'AI智能导览，随时解答疑问',
    route: '/guide',
    color: 'green'
  },
  {
    icon: Route,
    title: '路线推荐',
    description: '个性化定制您的游览路线',
    route: '/routes',
    color: 'lime'
  }
]

const stats = ref([
  { label: '景点数量', value: '50+', unit: '个' },
  { label: '游客服务', value: '10万+', unit: '人次' },
  { label: '满意度', value: '98%', unit: '' },
  { label: '在线时长', value: '7x24', unit: '小时' }
])
</script>

<template>
  <div class="home-page">
    <!-- 顶部横幅 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <Sparkles :size="14" />
          <span>AI 智能导览系统</span>
        </div>
        <h1 class="hero-title">
          <span class="gradient-text">灵山胜境</span>
          <br />
          智慧文旅新体验
        </h1>
        <p class="hero-subtitle">
          融合人工智能与文化传承，为您提供沉浸式的智慧旅游体验
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="router.push('/guide')">
            <MessageCircle :size="20" />
            开始导览
          </button>
          <button class="btn btn-secondary btn-lg" @click="router.push('/overview')">
            <Map :size="20" />
            查看地图
          </button>
        </div>
      </div>
      <div class="hero-image">
        <div class="hero-deco-circle deco-1"></div>
        <div class="hero-deco-circle deco-2"></div>
        <div class="floating-card">
          <div class="card-icon-wrapper">
            <Landmark :size="40" stroke-width="1.5" />
          </div>
          <div class="card-text">
            <strong>灵山大佛</strong>
            <span>核心景点 · 必游之地</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能卡片 -->
    <section class="features-section">
      <h2 class="section-title">探索功能</h2>
      <div class="features-grid">
        <div
          v-for="(feature, idx) in features"
          :key="feature.route"
          class="feature-card glass-card"
          :style="{ animationDelay: `${idx * 0.1}s` }"
          @click="router.push(feature.route)"
        >
          <div class="feature-icon" :class="`bg-${feature.color}`">
            <component :is="feature.icon" :size="32" />
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- 数据统计 -->
    <section class="stats-section glass-card">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  padding: var(--spacing-2xl) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* 英雄区域 */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  margin-bottom: var(--spacing-2xl);
  min-height: 500px;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--primary-700);
  width: fit-content;
}

.hero-badge svg {
  color: var(--primary-500);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-primary);
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-600), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 520px;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
}

/* Hero decoration */
.hero-image {
  position: relative;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-deco-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.deco-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(50, 143, 98, 0.08), transparent 70%);
  animation: pulse-glow 4s ease-in-out infinite;
}

.deco-2 {
  width: 200px;
  height: 200px;
  border: 1px solid rgba(50, 143, 98, 0.12);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-glow 4s ease-in-out 1s infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 1; }
}

.floating-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  animation: float 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

.card-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
  flex-shrink: 0;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-text strong {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.card-text span {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 功能区域 */
.features-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-400), var(--accent-teal));
  border-radius: 2px;
  margin: 12px auto 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  padding: var(--spacing-xl);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-md);
  animation: card-entrance 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes card-entrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: var(--spacing-sm);
  transition: transform var(--transition-base);
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(-5deg);
}

.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
.bg-teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
.bg-lime { background: linear-gradient(135deg, #84cc16, #65a30d); }

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.feature-card p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 统计区域 */
.stats-section {
  padding: var(--spacing-xl) var(--spacing-2xl);
  animation: card-entrance 0.5s 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-xl);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-600), var(--accent-teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-xs);
  line-height: 1.1;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-secondary);
}

@media (max-width: 968px) {
  .hero-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
    min-height: auto;
  }

  .hero-title {
    font-size: 2.8rem;
  }

  .hero-image {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .hero-section {
    min-height: auto;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-image {
    height: 260px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-lg {
    width: 100%;
    justify-content: center;
  }

  .deco-1 {
    width: 240px;
    height: 240px;
  }

  .deco-2 {
    width: 160px;
    height: 160px;
  }

  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
