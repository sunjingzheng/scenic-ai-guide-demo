<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'
import { useGuideStore } from '../../stores/useGuideStore'
import {
  UserOutlined,
  MessageOutlined,
  EyeOutlined,
  LikeOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons-vue'
import EChart from '../../components/EChart.vue'

const store = useGuideStore()

const stats = ref([
  {
    title: '今日访问量',
    value: '2,345',
    change: '+12.5%',
    trend: 'up',
    icon: EyeOutlined,
    color: 'emerald'
  },
  {
    title: '活跃用户',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: UserOutlined,
    color: 'blue'
  },
  {
    title: '咨询次数',
    value: '3,456',
    change: '+15.3%',
    trend: 'up',
    icon: MessageOutlined,
    color: 'purple'
  },
  {
    title: '满意度',
    value: '98.5%',
    change: '+2.1%',
    trend: 'up',
    icon: LikeOutlined,
    color: 'orange'
  }
])

const visitorChartOption = {
  title: { text: '访客趋势', left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '访客数',
      type: 'line',
      smooth: true,
      data: [1200, 1500, 1800, 2100, 2400, 2800, 2345],
      itemStyle: { color: '#22c55e' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
          ]
        }
      }
    }
  ]
} satisfies EChartsOption

const hotSpotsChartOption = {
  title: { text: '热门景点', left: 'center' },
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {d}%'
      },
      data: [
        { value: 1048, name: '灵山大佛', itemStyle: { color: '#22c55e' } },
        { value: 735, name: '九龙灌浴', itemStyle: { color: '#14b8a6' } },
        { value: 580, name: '拈花湾', itemStyle: { color: '#84cc16' } },
        { value: 484, name: '灵山梵宫', itemStyle: { color: '#10b981' } },
        { value: 300, name: '其他', itemStyle: { color: '#6ee7b7' } }
      ]
    }
  ]
} satisfies EChartsOption

const recentActivities = ref([
  { time: '10:30', user: '游客A', action: '咨询了灵山大佛开放时间', type: 'question' },
  { time: '10:25', user: '游客B', action: '收藏了九龙灌浴景点', type: 'favorite' },
  { time: '10:20', user: '游客C', action: '完成了半日游路线', type: 'route' },
  { time: '10:15', user: '游客D', action: '给予了5星好评', type: 'review' },
  { time: '10:10', user: '游客E', action: '咨询了拈花湾夜游信息', type: 'question' }
])

onMounted(() => {
  store.loadBaseData()
})
</script>

<template>
  <div class="dashboard-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>数据概览</h1>
      <p>实时监控系统运行状态和用户行为数据</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="stat-card"
      >
        <div class="stat-icon" :class="`bg-${stat.color}`">
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ stat.title }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-change" :class="stat.trend">
            <component :is="stat.trend === 'up' ? RiseOutlined : FallOutlined" />
            <span>{{ stat.change }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card">
        <EChart :option="visitorChartOption" height="350px" />
      </div>
      <div class="chart-card">
        <EChart :option="hotSpotsChartOption" height="350px" />
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="activity-card">
      <div class="card-header">
        <h3>最近活动</h3>
        <button class="btn btn-ghost">查看全部</button>
      </div>
      <div class="activity-list">
        <div
          v-for="(activity, index) in recentActivities"
          :key="index"
          class="activity-item"
        >
          <div class="activity-time">{{ activity.time }}</div>
          <div class="activity-dot" :class="activity.type"></div>
          <div class="activity-content">
            <strong>{{ activity.user }}</strong>
            <span>{{ activity.action }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
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
  transition: all var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
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

.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
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

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-change.up {
  color: var(--success);
}

.stat-change.down {
  color: var(--error);
}

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.chart-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* 活动列表 */
.activity-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.activity-item:hover {
  background: var(--gray-50);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  min-width: 50px;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.activity-dot.question { background: var(--primary-500); }
.activity-dot.favorite { background: var(--error); }
.activity-dot.route { background: var(--info); }
.activity-dot.review { background: var(--warning); }

.activity-content {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.activity-content strong {
  color: var(--text-primary);
  margin-right: var(--spacing-xs);
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
