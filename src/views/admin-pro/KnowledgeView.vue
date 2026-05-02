<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGuideStore } from '../../stores/useGuideStore'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'

const store = useGuideStore()
const searchQuery = ref('')
const selectedArea = ref('all')

const scenicAreas = [
  { value: 'all', label: '全部景区' },
  { value: '灵山大佛景区', label: '灵山大佛景区' },
  { value: '九龙灌浴景区', label: '九龙灌浴景区' },
  { value: '拈花湾景区', label: '拈花湾景区' }
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
      spot.id.toLowerCase().includes(query) ||
      spot.detail?.toLowerCase().includes(query)
    )
  }

  return spots
})

onMounted(() => {
  store.loadBaseData()
})

function addSpot() {
  console.log('Add new spot')
}

function editSpot(spotId: string) {
  console.log('Edit spot:', spotId)
}

function deleteSpot(spotId: string) {
  console.log('Delete spot:', spotId)
}
</script>

<template>
  <div class="knowledge-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>知识库管理</h1>
        <p>管理景区景点信息和导览内容</p>
      </div>
      <button class="btn btn-primary" @click="addSpot">
        <PlusOutlined />
        添加景点
      </button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <div class="search-box">
        <SearchOutlined class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="input"
          placeholder="搜索景点名称、编号或描述..."
        />
      </div>

      <select v-model="selectedArea" class="select">
        <option v-for="area in scenicAreas" :key="area.value" :value="area.value">
          {{ area.label }}
        </option>
      </select>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总景点数</span>
        <span class="stat-value">{{ store.spots.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">筛选结果</span>
        <span class="stat-value">{{ filteredSpots.length }}</span>
      </div>
    </div>

    <!-- 景点列表 -->
    <div class="spots-table">
      <div class="table-header">
        <div class="col-id">编号</div>
        <div class="col-name">景点名称</div>
        <div class="col-area">所属景区</div>
        <div class="col-detail">详细信息</div>
        <div class="col-actions">操作</div>
      </div>

      <div class="table-body">
        <div
          v-for="spot in filteredSpots"
          :key="spot.id"
          class="table-row"
        >
          <div class="col-id">
            <span class="badge">{{ spot.id }}</span>
          </div>
          <div class="col-name">
            <FileTextOutlined class="row-icon" />
            <strong>{{ spot.name }}</strong>
          </div>
          <div class="col-area">
            <span class="area-tag">{{ spot.scenicArea }}</span>
          </div>
          <div class="col-detail">
            <p>{{ spot.highlights || spot.detail }}</p>
          </div>
          <div class="col-actions">
            <button class="action-btn edit" @click="editSpot(spot.id)">
              <EditOutlined />
            </button>
            <button class="action-btn delete" @click="deleteSpot(spot.id)">
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredSpots.length === 0" class="empty-state">
      <FileTextOutlined style="font-size: 4rem; color: var(--gray-300);" />
      <h3>未找到相关景点</h3>
      <p>尝试调整搜索条件或添加新景点</p>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  gap: var(--spacing-md);
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 1rem;
}

.search-box .input {
  padding-left: 2.5rem;
}

.select {
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: var(--spacing-xl);
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-600);
}

/* 表格 */
.spots-table {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 120px 200px 150px 1fr 120px;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  align-items: center;
}

.table-header {
  background: var(--gray-50);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
}

.table-row {
  border-bottom: 1px solid var(--border-light);
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--gray-50);
}

.table-row:last-child {
  border-bottom: none;
}

.col-id .badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.col-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.row-icon {
  color: var(--primary-600);
  font-size: 1rem;
}

.col-name strong {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.area-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--gray-100);
  color: var(--gray-700);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

.col-detail p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.col-actions {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  font-size: 1rem;
}

.action-btn.edit {
  background: var(--primary-50);
  color: var(--primary-600);
}

.action-btn.edit:hover {
  background: var(--primary-100);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: var(--spacing-md) 0 var(--spacing-xs);
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 100px 150px 120px 1fr 100px;
  }
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
</style>
