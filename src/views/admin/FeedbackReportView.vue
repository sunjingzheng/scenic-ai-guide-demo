<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, onMounted } from 'vue'
import EChart from '../../components/EChart.vue'
import { useGuideStore } from '../../stores/useGuideStore'

const store = useGuideStore()

onMounted(() => store.loadDashboard())

const sentimentOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      roseType: 'area',
      radius: [25, 100],
      data: store.dashboard?.sentiment ?? [],
      label: { color: '#d8f4ff' }
    }
  ]
}))

const costOption = computed<EChartsOption>(() => ({
  grid: { left: 42, right: 18, top: 28, bottom: 42 },
  tooltip: {},
  xAxis: { type: 'category', data: store.dashboard?.costBreakdown.map((item) => item.name) ?? [] },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: store.dashboard?.costBreakdown.map((item) => item.value) ?? [],
      itemStyle: { color: '#f4c95d', borderRadius: [8, 8, 0, 0] }
    }
  ]
}))
</script>

<template>
  <div class="admin-page">
    <header class="admin-heading">
      <div>
        <span class="eyebrow">VISITOR INSIGHT</span>
        <h1>游客感受度报告</h1>
      </div>
      <p>分析交互记录、关注点和满意度变化，为景区服务优化提供建议。</p>
    </header>

    <section v-if="store.dashboard" class="dashboard-grid">
      <article class="admin-card">
        <h2>情感趋势</h2>
        <EChart :option="sentimentOption" />
      </article>
      <article class="admin-card">
        <h2>消费结构</h2>
        <EChart :option="costOption" />
      </article>
      <article class="admin-card wide">
        <h2>服务建议</h2>
        <div class="suggestion-list">
          <article v-for="item in store.dashboard.suggestions" :key="item">
            {{ item }}
          </article>
        </div>
      </article>
    </section>
  </div>
</template>
