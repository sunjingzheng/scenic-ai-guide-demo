<script setup lang="ts">
import { ref } from 'vue'
import { User, Mail, Phone, MapPin, Calendar, Heart, Clock, Award } from 'lucide-vue-next'

const userInfo = ref({
  name: '游客',
  avatar: '👤',
  email: 'visitor@example.com',
  phone: '138****8888',
  memberLevel: '普通会员',
  joinDate: '2024-01-15',
  visitCount: 3,
  favoriteSpots: ['灵山大佛', '九龙灌浴', '拈花湾'],
  recentVisits: [
    { date: '2024-03-20', spots: ['灵山大佛', '灵山梵宫'], duration: '4小时' },
    { date: '2024-02-10', spots: ['拈花湾', '香月花街'], duration: '3小时' },
    { date: '2024-01-15', spots: ['九龙灌浴', '五智门'], duration: '2小时' }
  ]
})

const stats = [
  { icon: MapPin, label: '游览景点', value: '12', color: 'emerald' },
  { icon: Clock, label: '游览时长', value: '24h', color: 'teal' },
  { icon: Heart, label: '收藏景点', value: '3', color: 'green' },
  { icon: Award, label: '获得徽章', value: '5', color: 'lime' }
]

function editProfile() {
  console.log('Edit profile')
}

function logout() {
  console.log('Logout')
}
</script>

<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <section class="profile-card glass-card">
      <div class="profile-header">
        <div class="avatar-section">
          <div class="avatar-circle">{{ userInfo.avatar }}</div>
          <div class="user-info">
            <h2>{{ userInfo.name }}</h2>
            <span class="member-badge">{{ userInfo.memberLevel }}</span>
          </div>
        </div>
        <button class="btn btn-secondary" @click="editProfile">编辑资料</button>
      </div>

      <div class="profile-details">
        <div class="detail-item">
          <Mail :size="18" />
          <span>{{ userInfo.email }}</span>
        </div>
        <div class="detail-item">
          <Phone :size="18" />
          <span>{{ userInfo.phone }}</span>
        </div>
        <div class="detail-item">
          <Calendar :size="18" />
          <span>加入时间：{{ userInfo.joinDate }}</span>
        </div>
      </div>
    </section>

    <!-- 统计数据 -->
    <section class="stats-section">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card glass-card"
      >
        <div class="stat-icon" :class="`bg-${stat.color}`">
          <component :is="stat.icon" :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- 收藏景点 -->
    <section class="favorites-section glass-card">
      <div class="section-header">
        <h3>
          <Heart :size="20" />
          我的收藏
        </h3>
      </div>
      <div class="favorites-list">
        <div
          v-for="spot in userInfo.favoriteSpots"
          :key="spot"
          class="favorite-item"
        >
          <span class="spot-icon">📍</span>
          <span>{{ spot }}</span>
        </div>
      </div>
    </section>

    <!-- 游览历史 -->
    <section class="history-section glass-card">
      <div class="section-header">
        <h3>
          <Clock :size="20" />
          游览历史
        </h3>
      </div>
      <div class="history-list">
        <div
          v-for="visit in userInfo.recentVisits"
          :key="visit.date"
          class="history-item"
        >
          <div class="history-date">
            <Calendar :size="16" />
            <span>{{ visit.date }}</span>
          </div>
          <div class="history-spots">
            <span v-for="spot in visit.spots" :key="spot" class="spot-tag">
              {{ spot }}
            </span>
          </div>
          <div class="history-duration">
            <Clock :size="14" />
            <span>{{ visit.duration }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 退出登录 -->
    <section class="actions-section">
      <button class="btn btn-ghost logout-btn" @click="logout">
        退出登录
      </button>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  padding: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 用户信息卡片 */
.profile-card {
  padding: var(--spacing-xl);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  box-shadow: var(--shadow-green);
}

.user-info h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.member-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-item svg {
  color: var(--primary-600);
}

/* 统计数据 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
.bg-teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
.bg-lime { background: linear-gradient(135deg, #84cc16, #65a30d); }

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 收藏景点 */
.favorites-section,
.history-section {
  padding: var(--spacing-xl);
}

.section-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-header svg {
  color: var(--primary-600);
}

.favorites-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.spot-icon {
  font-size: 1.25rem;
}

/* 游览历史 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-item {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.history-spots {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.spot-tag {
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

.history-duration {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

/* 操作区域 */
.actions-section {
  display: flex;
  justify-content: center;
}

.logout-btn {
  color: var(--error);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
