<script setup lang="ts">
import { Activity, Clock3, MessageCircle, Star } from 'lucide-vue-next'
import type { EChartsOption } from 'echarts'
import { computed, onMounted } from 'vue'
import EChart from '../../components/EChart.vue'
import MetricCard from '../../components/MetricCard.vue'
import { useGuideStore } from '../../stores/useGuideStore'

const store = useGuideStore()
const icons = [Activity, MessageCircle, Star, Clock3]

onMounted(() => store.loadDashboard())

const satisfactionOption = computed<EChartsOption>(() => ({
  grid: { left: 40, right: 18, top: 28, bottom: 34 },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: store.dashboard?.satisfactionTrend.map((item) => item.month) ?? [] },
  yAxis: { type: 'value', min: 0, max: 5 },
  series: [
    {
      name: '满意度',
      type: 'line',
      smooth: true,
      data: store.dashboard?.satisfactionTrend.map((item) => item.satisfaction) ?? [],
      areaStyle: { color: 'rgba(46, 204, 113, 0.16)' },
      lineStyle: { width: 3, color: '#2ecc71' },
      itemStyle: { color: '#2ecc71' }
    }
  ]
}))

const hotSpotOption = computed<EChartsOption>(() => ({
  grid: { left: 86, right: 18, top: 20, bottom: 24 },
  tooltip: {},
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: store.dashboard?.hotSpots.map((item) => item.name).reverse() ?? [] },
  series: [
    {
      type: 'bar',
      data: store.dashboard?.hotSpots.map((item) => item.count).reverse() ?? [],
      itemStyle: { color: '#50b4ff', borderRadius: [0, 8, 8, 0] }
    }
  ]
}))

const focusOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['42%', '72%'],
      data: store.dashboard?.focusPoints ?? [],
      label: { color: '#d8f4ff' }
    }
  ]
}))
</script>

<template>
  <div class="admin-page">
    <header class="admin-heading">
      <div>
        <span class="eyebrow">OPERATION CENTER</span>
        <h1>景区导览服务数据大屏</h1>
      </div>
      <p>基于游客行为数据、问答记录和满意度趋势生成运营洞察。</p>
    </header>

    <section v-if="store.dashboard" class="metrics-grid">
      <MetricCard
        v-for="(metric, index) in store.dashboard.metrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :trend="metric.trend"
        :icon="icons[index] ?? Activity"
      />
    </section>

    <section v-if="store.dashboard" class="dashboard-grid">
      <article class="admin-card wide">
        <h2>满意度趋势</h2>
        <EChart :option="satisfactionOption" />
      </article>
      <article class="admin-card">
        <h2>游客关注点</h2>
        <EChart :option="focusOption" />
      </article>
      <article class="admin-card">
        <h2>热门景点</h2>
        <EChart :option="hotSpotOption" />
      </article>
      <article class="admin-card">
        <h2>热门问答</h2>
        <ol class="rank-list">
          <li v-for="item in store.dashboard.hotQuestions" :key="item.question">
            <span>{{ item.question }}</span>
            <strong>{{ item.count }}</strong>
          </li>
        </ol>
      </article>
    </section>
  </div>
</template>
