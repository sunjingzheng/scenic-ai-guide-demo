<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import { MessageSquare, Star, X, Send } from "lucide-vue-next";
import { useGuideStore } from "../stores/useGuideStore";

const store = useGuideStore();
const visible = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const form = reactive({
  rating: 5,
  category: "suggestion" as
    | "service"
    | "route"
    | "knowledge"
    | "bug"
    | "suggestion",
  content: "",
});

const categories = [
  { value: "suggestion" as const, label: "💡 建议" },
  { value: "service" as const, label: "🎧 服务" },
  { value: "route" as const, label: "🗺️ 路线" },
  { value: "knowledge" as const, label: "📚 知识" },
  { value: "bug" as const, label: "🐛 问题" },
];

const ratingLabels: Record<number, string> = {
  1: "非常不满意",
  2: "不满意",
  3: "一般",
  4: "满意",
  5: "非常满意",
};

function toggle() {
  visible.value = !visible.value;
  if (visible.value) {
    submitted.value = false;
    form.content = "";
    form.rating = 5;
    form.category = "suggestion";
  }
}

async function handleSubmit() {
  if (!form.content.trim()) {
    message.warning("请输入您的意见或建议");
    return;
  }
  submitting.value = true;
  try {
    const res = await fetch("http://localhost:8000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: store.sessionId,
        rating: form.rating,
        category: form.category,
        content: form.content.trim(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    submitted.value = true;
    message.success("感谢您的反馈！");
  } catch (e: any) {
    console.error("[Feedback] 提交失败:", e);
    message.error(`提交失败：${e.message || "请重试"}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="feedback-widget">
    <!-- 浮动按钮 -->
    <button
      v-if="!visible"
      class="feedback-fab"
      title="意见反馈"
      @click="toggle"
    >
      <MessageSquare :size="20" />
      <span>反馈</span>
    </button>

    <!-- 反馈面板 -->
    <Transition name="slide-up">
      <div v-if="visible" class="feedback-panel glass-card">
        <div class="panel-header">
          <h3>
            <MessageSquare :size="18" />
            意见反馈
          </h3>
          <button class="close-btn" @click="toggle">
            <X :size="18" />
          </button>
        </div>

        <div v-if="submitted" class="submitted-state">
          <div class="check-icon">✅</div>
          <p>感谢您的反馈！</p>
          <span>我们会认真对待每一条建议</span>
          <a-button type="primary" size="small" @click="toggle">关闭</a-button>
        </div>

        <div v-else class="panel-body">
          <!-- 评分 -->
          <div class="form-group">
            <label>满意度评分</label>
            <div class="rating-stars">
              <button
                v-for="n in 5"
                :key="n"
                class="star-btn"
                :class="{ active: n <= form.rating }"
                @click="form.rating = n"
              >
                <Star
                  :size="24"
                  :fill="n <= form.rating ? '#faad14' : 'none'"
                />
              </button>
              <span class="rating-label">{{ ratingLabels[form.rating] }}</span>
            </div>
          </div>

          <!-- 分类 -->
          <div class="form-group">
            <label>反馈类型</label>
            <div class="category-chips">
              <button
                v-for="cat in categories"
                :key="cat.value"
                class="chip"
                :class="{ active: form.category === cat.value }"
                @click="form.category = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <!-- 内容 -->
          <div class="form-group">
            <label>您的意见或建议</label>
            <a-textarea
              v-model:value="form.content"
              placeholder="请告诉我们您的想法，帮助我们改进体验..."
              :rows="3"
              :maxlength="500"
              show-count
            />
          </div>

          <!-- 提交 -->
          <a-button
            type="primary"
            block
            :loading="submitting"
            @click="handleSubmit"
          >
            <template #icon><Send :size="16" /></template>
            提交反馈
          </a-button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.feedback-widget {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 500;
}

.feedback-fab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border: none;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: #fff;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(50, 143, 98, 0.35);
  transition: all var(--transition-fast);
}

.feedback-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(50, 143, 98, 0.45);
}

.feedback-panel {
  width: 360px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.panel-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.panel-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-btn {
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  color: #d9d9d9;
  cursor: pointer;
  padding: 0;
  transition: transform var(--transition-fast);
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn.active {
  color: #faad14;
}

.rating-label {
  margin-left: 8px;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 4px 12px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 50px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip:hover {
  border-color: var(--primary-300);
}

.chip.active {
  background: var(--primary-50);
  border-color: var(--primary-500);
  color: var(--primary-600);
  font-weight: 500;
}

.submitted-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  gap: 8px;
}

.submitted-state .check-icon {
  font-size: 3rem;
}

.submitted-state p {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.submitted-state span {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

/* 滑入动画 */
.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 480px) {
  .feedback-widget {
    left: 12px;
    bottom: 80px;
  }

  .feedback-panel {
    width: calc(100vw - 24px);
    max-width: 360px;
  }
}
</style>
