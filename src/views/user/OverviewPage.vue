<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGuideStore } from '../../stores/useGuideStore'
import { MapPin, Clock, Star, Navigation, Search } from 'lucide-vue-next'

const store = useGuideStore()
const selectedArea = ref<string>('all')
const searchQuery = ref('')

const scenicAreas = [
  { id: 'all', name: '全部景区', color: 'emerald' },
  { id: '灵山大佛景区', name: '大佛景区', color: 'green' },
  { id: '九龙灌浴景区', name: '九龙灌浴景区', color: 'teal' },
  { id: '拈花湾景区', name: '拈花湾景区', color: 'lime' }
]

const filteredSpots = computed(() => {
  let spots = store.spots

  if (selectedArea.value !== 'all') {
    spots = spots.filter(spot => spot.scenicArea === selectedArea.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    spots = spots.filter(spot =>
      spot.name.toLowerCase().includes(query) ||
      spot.detail?.toLowerCase().includes(query) ||
      spot.highlights?.toLowerCase().includes(query)
    )
  }

  return spots
})

onMounted(() => {
  store.loadBaseData()
})

function viewSpotDetail(spotId: string) {
  console.log('View spot:', spotId)
}

const areaGradients: Record<string, string> = {
  '灵山大佛景区': 'linear-gradient(135deg, #d4edda, #c3e6cb)',
  '九龙灌浴景区': 'linear-gradient(135deg, #d1ecf1, #bee5eb)',
  '拈花湾景区': 'linear-gradient(135deg, #fff3cd, #ffeaa7)'
}

const scenicImages = [
  { match: /大佛|祥符|降魔|阿育王|五智门/, src: '/images/scenic/lingshan-buddha.jpg' },
  { match: /九龙|灌浴|莲花/, src: '/images/scenic/jiulong-bath.jpg' },
  { match: /梵宫|坛城|曼陀罗/, src: '/images/scenic/fan-gong.jpg' },
  { match: /拈花|香月|妙音|鹿鸣/, src: '/images/scenic/nianhua-bay.jpg' },
  { match: /太湖|观景|自然|山水/, src: '/images/scenic/taihu-view.jpg' }
]

function spotImage(spot: { name: string; scenicArea: string; highlights?: string; detail?: string }) {
  const text = `${spot.name}${spot.scenicArea}${spot.highlights || ''}${spot.detail || ''}`
  return scenicImages.find((item) => item.match.test(text))?.src || '/images/scenic/taihu-view.jpg'
}
</script>

<template>
  <div class="overview-page">
    <!-- 顶部搜索和筛选 -->
    <section class="search-section glass-card">
      <div class="search-header">
        <h1>园区总览</h1>
        <p>探索灵山胜境的每一处美景</p>
      </div>

      <div class="search-controls">
        <div class="search-wrapper">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="input search-input"
            placeholder="搜索景点名称、特色..."
          />
        </div>

        <div class="area-filters">
          <button
            v-for="area in scenicAreas"
            :key="area.id"
            class="filter-btn"
            :class="{ active: selectedArea === area.id, [`btn-${area.color}`]: selectedArea === area.id }"
            @click="selectedArea = area.id"
          >
            {{ area.name }}
          </button>
        </div>
      </div>
    </section>

    <!-- 景点网格 -->
    <section class="spots-grid">
      <div
        v-for="(spot, idx) in filteredSpots"
        :key="spot.id"
        class="spot-card glass-card"
        :style="{ animationDelay: `${idx * 0.06}s` }"
        @click="viewSpotDetail(spot.id)"
      >
        <div class="spot-header">
          <div class="spot-badge">{{ spot.scenicArea }}</div>
          <div class="spot-rating">
            <Star :size="14" fill="currentColor" />
            <span>4.8</span>
          </div>
        </div>

        <div class="spot-image" :style="{ background: areaGradients[spot.scenicArea] || 'linear-gradient(135deg, var(--primary-100), var(--primary-200))' }">
          <img :src="spotImage(spot)" :alt="spot.name" />
        </div>

        <div class="spot-content">
          <h3>{{ spot.name }}</h3>
          <p class="spot-id">{{ spot.id }}</p>
          <p class="spot-description">{{ spot.highlights || spot.detail }}</p>

          <div class="spot-meta">
            <div class="meta-item">
              <Clock :size="14" />
              <span>建议游览 30-60分钟</span>
            </div>
            <div class="meta-item">
              <Navigation :size="14" />
              <span>查看路线</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 空状态 -->
    <div v-if="filteredSpots.length === 0" class="empty-state">
      <div class="empty-icon-wrapper">
        <MapPin :size="48" />
      </div>
      <h3>未找到相关景点</h3>
      <p>尝试调整搜索条件或筛选项</p>
    </div>
  </div>
</template>

<style scoped>
.overview-page {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* 搜索区域 */
.search-section {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.search-header {
  margin-bottom: var(--spacing-lg);
}

.search-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.search-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.search-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  font-size: 0.95rem;
  padding: 12px 14px 12px 44px;
  width: 100%;
  max-width: 420px;
}

.area-filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
  color: var(--primary-600);
}

.filter-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-color: transparent;
}

.btn-emerald.active {
  background: linear-gradient(135deg, #10b981, #059669);
}

.btn-teal.active {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
}

.btn-lime.active {
  background: linear-gradient(135deg, #84cc16, #65a30d);
}

/* 景点网格 */
.spots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.spot-card {
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  animation: spot-entrance 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes spot-entrance {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spot-badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-full);
  font-weight: 500;
}

.spot-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 500;
}

.spot-image {
  width: 100%;
  height: 180px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-base);
  overflow: hidden;
}

.spot-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.spot-card:hover .spot-image {
  transform: scale(1.02);
}

.spot-icon-svg {
  color: var(--primary-500);
  opacity: 0.6;
}

.spot-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.spot-content h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.spot-id {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.spot-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spot-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.meta-item svg {
  color: var(--primary-500);
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-2xl);
}

.empty-icon-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto var(--spacing-lg);
  border-radius: 50%;
  background: var(--primary-50);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-300);
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .overview-page {
    padding: var(--spacing-md);
  }

  .spots-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    max-width: 100%;
  }
}
</style>
