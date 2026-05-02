<script setup lang="ts">
import { BookOpen, Plus, Search } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useGuideStore } from '../../stores/useGuideStore'

const store = useGuideStore()
const keyword = ref('')
const selectedTag = ref('全部')
const localDraft = ref({
  name: '',
  culture: '',
  highlights: ''
})

onMounted(() => store.loadBaseData())

const tags = computed(() => ['全部', ...new Set(store.spots.flatMap((spot) => spot.tags))])
const filtered = computed(() => {
  const text = keyword.value.trim()
  return store.spots.filter((spot) => {
    const hitText = !text || [spot.name, spot.detail, spot.culture, spot.highlights].join('').includes(text)
    const hitTag = selectedTag.value === '全部' || spot.tags.includes(selectedTag.value)
    return hitText && hitTag
  })
})

function addLocalKnowledge() {
  if (!localDraft.value.name.trim()) return
  store.spots.unshift({
    id: `LOCAL-${Date.now().toString().slice(-5)}`,
    scenicArea: '灵山胜境',
    name: localDraft.value.name,
    position: '后台临时维护',
    parameters: '',
    coreFunction: '管理员补充知识',
    culture: localDraft.value.culture,
    detail: localDraft.value.culture,
    highlights: localDraft.value.highlights,
    opening: '以景区当天公告为准',
    notes: '前端演示态新增，刷新后恢复资料包数据。',
    tags: ['管理员维护']
  })
  localDraft.value = { name: '', culture: '', highlights: '' }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-heading">
      <div>
        <span class="eyebrow">KNOWLEDGE BASE</span>
        <h1>景区知识库管理</h1>
      </div>
      <p>维护讲解词、文史资料、景点特色和常见问题引用来源。</p>
    </header>

    <section class="knowledge-tools">
      <label>
        <Search :size="18" />
        <input v-model="keyword" placeholder="搜索景点、文化内涵或讲解重点" />
      </label>
      <div class="tag-row">
        <button v-for="tag in tags" :key="tag" :class="{ active: selectedTag === tag }" @click="selectedTag = tag">
          {{ tag }}
        </button>
      </div>
    </section>

    <section class="knowledge-layout">
      <article class="admin-card editor-card">
        <h2><Plus :size="18" /> 新增知识条目</h2>
        <input v-model="localDraft.name" placeholder="景点或主题名称" />
        <textarea v-model="localDraft.culture" placeholder="文化内涵 / 背景说明"></textarea>
        <textarea v-model="localDraft.highlights" placeholder="游玩亮点 / 讲解重点"></textarea>
        <button class="primary-button" @click="addLocalKnowledge">加入本地演示知识库</button>
      </article>

      <div class="knowledge-list">
        <article v-for="spot in filtered" :key="spot.id" class="admin-card knowledge-item">
          <div>
            <BookOpen :size="20" />
            <strong>{{ spot.name }}</strong>
            <span>{{ spot.id }}</span>
          </div>
          <p>{{ spot.detail }}</p>
          <small>{{ spot.highlights }}</small>
          <footer>
            <span v-for="tag in spot.tags" :key="tag">{{ tag }}</span>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>
