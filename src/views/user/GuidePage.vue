<template>
  <section class="guide-page">
    <div class="guide-copy">
      <span>AI 数字导员</span>
      <h1>和 Hiyori 对话，查询景区知识与路线建议</h1>
      <p>右下角对话框已连接灵山胜境知识库，支持流式回答、语音播报和快捷问题。</p>
    </div>
  </section>
</template>

<style scoped>
.guide-page {
  min-height: calc(100vh - 180px);
  display: grid;
  align-items: center;
  padding: 56px 7vw;
}

.guide-copy {
  max-width: 520px;
}

.guide-copy span {
  display: inline-flex;
  margin-bottom: 14px;
  color: var(--primary-600);
  font-weight: 700;
}

.guide-copy h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
}

.guide-copy p {
  margin: 18px 0 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
}
</style>
