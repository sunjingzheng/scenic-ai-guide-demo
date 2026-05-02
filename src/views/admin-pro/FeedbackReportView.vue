<script setup lang="ts">
import { ref } from 'vue'
import {
  StarOutlined,
  MessageOutlined,
  FilterOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'

const selectedRating = ref('all')
const selectedType = ref('all')

type FeedbackStatus = 'pending' | 'in_progress' | 'resolved'

interface FeedbackItem {
  id: number
  user: string
  rating: number
  type: string
  content: string
  date: string
  status: FeedbackStatus
}

const feedbackList = ref<FeedbackItem[]>([
  {
    id: 1,
    user: '游客A',
    rating: 5,
    type: 'service',
    content: '数字人导览非常专业，讲解详细，语音清晰，体验很好！',
    date: '2024-04-28 14:30',
    status: 'resolved'
  },
  {
    id: 2,
    user: '游客B',
    rating: 4,
    type: 'feature',
    content: '希望能增加更多的路线推荐，特别是针对老年人的慢节奏路线。',
    date: '2024-04-28 12:15',
    status: 'pending'
  },
  {
    id: 3,
    user: '游客C',
    rating: 5,
    type: 'service',
    content: '语音识别很准确，回答问题也很及时，非常满意！',
    date: '2024-04-27 16:45',
    status: 'resolved'
  },
  {
    id: 4,
    user: '游客D',
    rating: 3,
    type: 'bug',
    content: '在使用过程中偶尔会出现卡顿，希望能优化一下性能。',
    date: '2024-04-27 10:20',
    status: 'in_progress'
  },
  {
    id: 5,
    user: '游客E',
    rating: 5,
    type: 'service',
    content: '数字人形象很亲切，讲解内容丰富，对景点了解更深入了。',
    date: '2024-04-26 15:30',
    status: 'resolved'
  }
])

const ratingOptions = [
  { value: 'all', label: '全部评分' },
  { value: '5', label: '⭐⭐⭐⭐⭐' },
  { value: '4', label: '⭐⭐⭐⭐' },
  { value: '3', label: '⭐⭐⭐' },
  { value: '2', label: '⭐⭐' },
  { value: '1', label: '⭐' }
]

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'service', label: '服务体验' },
  { value: 'feature', label: '功能建议' },
  { value: 'bug', label: '问题反馈' }
]

const statusMap = {
  pending: { label: '待处理', color: 'orange' },
  in_progress: { label: '处理中', color: 'blue' },
  resolved: { label: '已解决', color: 'green' }
} as const

function exportReport() {
  console.log('Export report')
}

function getStars(rating: number) {
  return '⭐'.repeat(rating)
}
</script>

<template>
  <div class="feedback-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>反馈报告</h1>
        <p>查看和管理用户反馈信息</p>
      </div>
      <button class="btn btn-secondary" @click="exportReport">
        <DownloadOutlined />
        导出报告
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon bg-green">
          <StarOutlined />
        </div>
        <div class="stat-content">
          <div class="stat-label">平均评分</div>
          <div class="stat-value">4.6</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-blue">
          <MessageOutlined />
        </div>
        <div class="stat-content">
          <div class="stat-label">总反馈数</div>
          <div class="stat-value">{{ feedbackList.length }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-orange">
          <FilterOutlined />
        </div>
        <div class="stat-content">
          <div class="stat-label">待处理</div>
          <div class="stat-value">{{ feedbackList.filter(f => f.status === 'pending').length }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <select v-model="selectedRating" class="select">
        <option v-for="option in ratingOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <select v-model="selectedType" class="select">
        <option v-for="option in typeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- 反馈列表 -->
    <div class="feedback-list">
      <div
        v-for="feedback in feedbackList"
        :key="feedback.id"
        class="feedback-card"
      >
        <div class="feedback-header">
          <div class="user-info">
            <div class="user-avatar">{{ feedback.user.charAt(feedback.user.length - 1) }}</div>
            <div>
              <strong>{{ feedback.user }}</strong>
              <span class="feedback-date">{{ feedback.date }}</span>
            </div>
          </div>

          <div class="feedback-meta">
            <div class="rating">{{ getStars(feedback.rating) }}</div>
            <span class="status-badge" :class="statusMap[feedback.status].color">
              {{ statusMap[feedback.status].label }}
            </span>
          </div>
        </div>

        <div class="feedback-content">
          <div class="type-tag">
            {{ typeOptions.find(t => t.value === feedback.type)?.label }}
          </div>
          <p>{{ feedback.content }}</p>
        </div>

        <div class="feedback-actions">
          <button class="btn btn-ghost">查看详情</button>
          <button v-if="feedback.status === 'pending'" class="btn btn-primary">
            处理反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
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

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-orange { background: linear-gradient(135deg, #f59e0b, #d97706); }

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* 筛选器 */
.filter-section {
  display: flex;
  gap: var(--spacing-md);
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
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

/* 反馈列表 */
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.feedback-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.feedback-card:hover {
  box-shadow: var(--shadow-md);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-info strong {
  display: block;
  font-size: 0.875rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.feedback-date {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.rating {
  font-size: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.orange {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.status-badge.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.status-badge.green {
  background: var(--primary-100);
  color: var(--primary-700);
}

.feedback-content {
  margin-bottom: var(--spacing-md);
}

.type-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--gray-100);
  color: var(--gray-700);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  margin-bottom: var(--spacing-sm);
}

.feedback-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.feedback-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .feedback-actions {
    flex-direction: column;
    width: 100%;
  }

  .feedback-actions button {
    width: 100%;
  }
}
</style>
