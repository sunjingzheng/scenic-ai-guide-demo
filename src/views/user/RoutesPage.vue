<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGuideStore } from '../../stores/useGuideStore'
import { Clock, MapPin, Heart, Navigation, Lightbulb, Landmark, Mountain, Sun, Baby, History } from 'lucide-vue-next'

const store = useGuideStore()
const selectedInterest = ref<string>('all')

const interests = [
  { id: 'all', name: '全部路线', icon: MapPin },
  { id: '历史文化', name: '历史文化', icon: History },
  { id: '祈福朝圣', name: '祈福朝圣', icon: Sun },
  { id: '自然风光', name: '自然风光', icon: Mountain },
  { id: '亲子休闲', name: '亲子休闲', icon: Baby }
]

const routeTemplates = ref([
  {
    id: 'classic-half',
    title: '经典半日游',
    duration: '4-5小时',
    difficulty: '轻松',
    interest: '历史文化',
    summary: '游览灵山大佛核心景区，体验九龙灌浴表演',
    stops: ['灵山大佛', '九龙灌浴', '灵山梵宫', '五智门'],
    highlights: ['88米灵山大佛', '九龙灌浴表演', '梵宫艺术'],
    bestTime: '上午9:00-下午2:00',
    tips: '建议提前查看九龙灌浴表演时间'
  },
  {
    id: 'full-day',
    title: '深度一日游',
    duration: '8-9小时',
    difficulty: '适中',
    interest: '历史文化',
    summary: '全面游览灵山胜境各大景区，深度体验佛教文化',
    stops: ['灵山大佛', '九龙灌浴', '灵山梵宫', '拈花湾', '五印坛城'],
    highlights: ['完整游览体验', '拈花湾禅意小镇', '五印坛城'],
    bestTime: '全天',
    tips: '建议穿舒适的鞋子，携带充足的水'
  },
  {
    id: 'prayer',
    title: '祈福朝圣之旅',
    duration: '3-4小时',
    difficulty: '轻松',
    interest: '祈福朝圣',
    summary: '专注于祈福朝圣体验，感受佛教文化氛围',
    stops: ['五智门', '灵山大佛', '灵山梵宫', '阿育王柱'],
    highlights: ['大佛祈福', '梵宫礼佛', '阿育王柱'],
    bestTime: '上午',
    tips: '建议着装得体，保持安静'
  },
  {
    id: 'nature',
    title: '自然风光游',
    duration: '5-6小时',
    difficulty: '适中',
    interest: '自然风光',
    summary: '欣赏太湖山水，体验自然与人文的完美结合',
    stops: ['拈花湾', '香月花街', '鹿鸣谷', '太湖观景台'],
    highlights: ['太湖美景', '拈花湾小镇', '自然生态'],
    bestTime: '下午-傍晚',
    tips: '傍晚时分景色最美，适合摄影'
  },
  {
    id: 'family',
    title: '亲子欢乐游',
    duration: '6-7小时',
    difficulty: '轻松',
    interest: '亲子休闲',
    summary: '适合家庭出游，寓教于乐的文化体验',
    stops: ['九龙灌浴', '拈花湾', '鹿鸣谷', '香月花街'],
    highlights: ['互动表演', '小镇探索', '亲子活动'],
    bestTime: '全天',
    tips: '带好儿童用品，注意安全'
  },
  {
    id: 'evening',
    title: '拈花湾夜游',
    duration: '2-3小时',
    difficulty: '轻松',
    interest: '自然风光',
    summary: '体验拈花湾夜景，感受禅意灯光秀',
    stops: ['拈花湾', '香月花街', '拈花塔', '妙音台'],
    highlights: ['夜景灯光', '禅意表演', '夜市小吃'],
    bestTime: '傍晚6:00后',
    tips: '夜晚温度较低，注意保暖'
  }
])

const filteredRoutes = computed(() => {
  if (selectedInterest.value === 'all') {
    return routeTemplates.value
  }
  return routeTemplates.value.filter(route => route.interest === selectedInterest.value)
})

onMounted(() => {
  store.loadBaseData().then(async () => {
    await store.loadAllRoutes()
    routeTemplates.value = store.routes.map((route) => ({
      id: route.id,
      title: route.title,
      duration: route.duration,
      difficulty: route.difficulty || '轻松',
      interest: route.interest,
      summary: route.summary,
      stops: route.stops,
      highlights: route.focus?.length ? route.focus : ['智能讲解', '知识库推荐'],
      bestTime: route.bestTime || '全天',
      tips: route.tips || '可在数字人导览页继续提问该路线的细节'
    }))
  })
})

function selectRoute(routeId: string) {
  console.log('Selected route:', routeId)
}
</script>

<template>
  <div class="routes-page">
    <!-- 页面头部 -->
    <section class="page-header glass-card">
      <div class="header-content">
        <h1>旅游路线推荐</h1>
        <p>根据您的兴趣，为您定制专属游览路线</p>
      </div>

      <!-- 兴趣筛选 -->
      <div class="interest-filters">
        <button
          v-for="interest in interests"
          :key="interest.id"
          class="interest-btn"
          :class="{ active: selectedInterest === interest.id }"
          @click="selectedInterest = interest.id"
        >
          <component :is="interest.icon" :size="16" />
          <span>{{ interest.name }}</span>
        </button>
      </div>
    </section>

    <!-- 路线列表 -->
    <section class="routes-list">
      <div
        v-for="(route, idx) in filteredRoutes"
        :key="route.id"
        class="route-card glass-card"
        :style="{ animationDelay: `${idx * 0.08}s` }"
        @click="selectRoute(route.id)"
      >
        <div class="route-header">
          <div>
            <h3>{{ route.title }}</h3>
            <div class="route-badges">
              <span class="badge badge-primary">{{ route.interest }}</span>
              <span class="badge badge-secondary">{{ route.difficulty }}</span>
            </div>
          </div>
          <button class="btn btn-primary">
            <Navigation :size="18" />
            开始导航
          </button>
        </div>

        <p class="route-summary">{{ route.summary }}</p>

        <div class="route-meta">
          <div class="meta-item">
            <Clock :size="16" />
            <span>{{ route.duration }}</span>
          </div>
          <div class="meta-item">
            <MapPin :size="16" />
            <span>{{ route.stops.length }} 个景点</span>
          </div>
          <div class="meta-item">
            <History :size="16" />
            <span>{{ route.bestTime }}</span>
          </div>
        </div>

        <div class="route-stops">
          <div class="stops-label">游览路线</div>
          <div class="stops-flow">
            <span v-for="(stop, index) in route.stops" :key="stop">
              {{ stop }}
              <span v-if="index < route.stops.length - 1" class="arrow">→</span>
            </span>
          </div>
        </div>

        <div class="route-highlights">
          <div class="highlights-label">
            <Heart :size="14" />
            <span>亮点推荐</span>
          </div>
          <div class="highlights-tags">
            <span v-for="highlight in route.highlights" :key="highlight" class="tag">
              {{ highlight }}
            </span>
          </div>
        </div>

        <div class="route-tips">
          <Lightbulb :size="16" class="tips-svg" />
          <span>{{ route.tips }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.routes-page {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.header-content {
  margin-bottom: var(--spacing-lg);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.header-content p {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* 兴趣筛选 */
.interest-filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.interest-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.interest-btn:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
  color: var(--primary-600);
}

.interest-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-color: transparent;
}

/* 路线列表 */
.routes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.route-card {
  padding: var(--spacing-xl);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  animation: route-entrance 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes route-entrance {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.route-header h3 {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.route-badges {
  display: flex;
  gap: var(--spacing-xs);
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.badge-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.route-summary {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.route-meta {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--primary-50);
  border-radius: var(--radius-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.meta-item svg {
  color: var(--primary-600);
  flex-shrink: 0;
}

/* 路线站点 */
.route-stops {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.stops-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.stops-flow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stops-flow .arrow {
  color: var(--primary-500);
  margin: 0 var(--spacing-xs);
  font-weight: 600;
}

/* 亮点推荐 */
.route-highlights {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.highlights-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.highlights-label svg {
  color: var(--error);
}

.highlights-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag {
  padding: 0.375rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

/* 提示信息 */
.route-tips {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.tips-svg {
  color: var(--warning);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .routes-page {
    padding: var(--spacing-md);
  }

  .route-header {
    flex-direction: column;
  }

  .route-meta {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
