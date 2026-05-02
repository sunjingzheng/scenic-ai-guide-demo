<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  trend: string
  icon: Component
}>()
</script>

<template>
  <article class="metric-card">
    <component :is="icon" :size="22" />
    <div>
      <span>{{ label }}</span>
      <strong>{{ value }}</strong>
      <small>{{ trend }}</small>
    </div>
  </article>
</template>
