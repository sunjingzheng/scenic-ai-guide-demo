<script setup lang="ts">
import { Bot, CheckCircle2, Shirt, SlidersHorizontal, Volume2 } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import AvatarGuide from '../../components/AvatarGuide.vue'
import { useGuideStore } from '../../stores/useGuideStore'

const store = useGuideStore()
const saved = ref(false)
const form = reactive({ ...store.avatarConfig })
const outfits = ['禅意青绿', '唐风礼服', '拈花素雅', '梵宫金纹']
const voices = ['温柔讲解女声', '沉稳文化男声', '亲子活力声线']
const themes = ['太湖禅境', '东方佛国', '拈花夜游', '亲子研学']

async function save() {
  await store.saveAvatar({ ...form })
  saved.value = true
  window.setTimeout(() => (saved.value = false), 1800)
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-heading">
      <div>
        <span class="eyebrow">DIGITAL HUMAN</span>
        <h1>数字人形象管理</h1>
      </div>
      <p>配置外观、服装、声音和表情强度，让数字人贴合景区文化特色。</p>
    </header>

    <section class="avatar-config-grid">
      <article class="admin-card avatar-preview-card">
        <AvatarGuide :speaking="true" emotion="smile" :outfit="form.outfit" />
      </article>

      <article class="admin-card config-form">
        <h2><Bot :size="20" /> 形象参数</h2>
        <label>
          <Shirt :size="18" />
          <span>服装主题</span>
          <select v-model="form.outfit">
            <option v-for="item in outfits" :key="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <Volume2 :size="18" />
          <span>声音风格</span>
          <select v-model="form.voice">
            <option v-for="item in voices" :key="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <SlidersHorizontal :size="18" />
          <span>文化主题</span>
          <select v-model="form.culturalTheme">
            <option v-for="item in themes" :key="item">{{ item }}</option>
          </select>
        </label>
        <label>
          <SlidersHorizontal :size="18" />
          <span>表情强度 {{ form.expressionLevel }}%</span>
          <input v-model.number="form.expressionLevel" type="range" min="20" max="100" />
        </label>
        <button class="primary-button" @click="save">
          <CheckCircle2 :size="18" />
          保存配置
        </button>
        <p v-if="saved" class="success-text">配置已写入 Mock 服务。</p>
      </article>
    </section>
  </div>
</template>
