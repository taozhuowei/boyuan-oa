<template>
  <view class="page todo-page">
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <text class="hero-title">待办中心</text>
          <component :is="Button" v-if="Button" type="default" @click="goBack">返回工作台</component>
        </view>
        <text class="hero-subtitle">
          当前共有 <text class="count">{{ filteredList.length }}</text> 项待处理
        </text>
      </view>
    </view>

    <view class="todo-container">
      <component :is="Row" v-if="Row" :gutter="16">
        <component :is="Col" v-if="Col" :span="8">
          <component :is="Card" v-if="Card" title="待办列表" :bordered="true">
            <view v-if="filteredList.length" class="todo-list">
              <view
                v-for="item in filteredList"
                :key="item.id"
                class="todo-item"
                :class="{ active: selectedItem?.id === item.id }"
                @click="selectItem(item)"
              >
                <view class="todo-info">
                  <view class="todo-line">
                    <text class="todo-title">{{ item.submitter }}</text>
                    <component :is="Tag" v-if="Tag" :color="typeColorMap[item.type]">{{ item.type }}</component>
                  </view>
                  <text class="todo-meta">{{ item.date }} · {{ item.dept }}</text>
                </view>
                <component
                  :is="Badge"
                  v-if="Badge"
                  :status="priorityStatusMap[item.priority]"
                  :text="item.priority === 'high' ? '高' : item.priority === 'mid' ? '中' : '低'"
                />
              </view>
            </view>
            <component :is="Empty" v-else-if="Empty" description="暂无待办事项" />
          </component>
        </component>

        <component :is="Col" v-if="Col" :span="16">
          <component :is="Card" v-if="Card && selectedItem" title="待办详情">
            <view class="detail-content">
              <view class="detail-row">
                <text class="label">标题</text>
                <text class="value">{{ selectedItem.title }}</text>
              </view>
              <view class="detail-row">
                <text class="label">类型</text>
                <text class="value">{{ selectedItem.type }}</text>
              </view>
              <view class="detail-row">
                <text class="label">申请人</text>
                <text class="value">{{ selectedItem.submitter }}</text>
              </view>
              <view class="detail-row">
                <text class="label">部门</text>
                <text class="value">{{ selectedItem.dept }}</text>
              </view>
              <view class="detail-row">
                <text class="label">日期</text>
                <text class="value">{{ selectedItem.date }}</text>
              </view>
              <view class="detail-row">
                <text class="label">时长</text>
                <text class="value">{{ selectedItem.duration }}</text>
              </view>
              <view class="detail-row">
                <text class="label">优先级</text>
                <text class="value">{{ selectedItem.priority === 'high' ? '高' : selectedItem.priority === 'mid' ? '中' : '低' }}</text>
              </view>
              <view v-if="isCEO || isPM" class="detail-actions">
                <component :is="Button" v-if="Button" type="default" @click="rejectItem">驳回</component>
                <component :is="Button" v-if="Button" type="primary" @click="approveItem">通过</component>
              </view>
            </view>
          </component>

          <component :is="Card" v-else-if="Card" title="待办详情">
            <view class="empty-detail">
              <text>请选择待办事项</text>
            </view>
          </component>
        </component>
      </component>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'

const { Row, Col, Card, Badge, Button, Tag, Empty, Tabs, Tab } = useComponent(['Row', 'Col', 'Card', 'Badge', 'Button', 'Tag', 'Empty', 'Tabs', 'Tab'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isPM = computed(() => userRole.value === 'project_manager')

const currentUserName = computed(() => userStore.userInfo?.displayName || userStore.userInfo?.username || '')

const pendingList = ref([
  { id: 1, title: '李静 请假申请', type: '请假', submitter: '李静', dept: '财务管理部', date: '2025-01-15', duration: '2天', status: 'PENDING', priority: 'high' },
  { id: 2, title: '赵铁柱 加班申请', type: '加班', submitter: '赵铁柱', dept: '施工一部', date: '2025-01-14', duration: '4小时', status: 'PENDING', priority: 'mid' },
  { id: 3, title: '王建国 请假申请', type: '请假', submitter: '王建国', dept: '项目一部', date: '2025-01-13', duration: '1天', status: 'PENDING', priority: 'low' },
  { id: 4, title: '张晓宁 工伤补偿', type: '工伤', submitter: '张晓宁', dept: '综合管理部', date: '2025-01-12', duration: '-', status: 'PENDING', priority: 'high' },
  { id: 5, title: '赵铁柱 施工日志', type: '日志', submitter: '赵铁柱', dept: '施工一部', date: '2025-01-11', duration: '-', status: 'PENDING', priority: 'mid' }
])

const filteredList = computed(() => {
  if (isCEO.value || isPM.value) {
    return pendingList.value
  }
  return pendingList.value.filter(item => item.submitter === currentUserName.value)
})

const selectedItem = ref<any>(null)

const typeColorMap: Record<string, string> = {
  '请假': 'blue',
  '加班': 'orange',
  '工伤': 'red',
  '日志': 'green'
}

const priorityStatusMap: Record<string, string> = {
  high: 'error',
  mid: 'warning',
  low: 'success'
}

const selectItem = (item: any) => {
  selectedItem.value = item
}

const approveItem = () => {
  console.log('approve', selectedItem.value)
  uni.showToast({ title: '已通过', icon: 'success' })
}

const rejectItem = () => {
  console.log('reject', selectedItem.value)
  uni.showToast({ title: '已驳回', icon: 'none' })
}

const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.todo-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-radius-lg);
}

.hero-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.count {
  font-weight: 700;
}

.todo-container {
  :deep(.oa-card) {
    margin-bottom: 0;
  }
}

.todo-list {
  .todo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--oa-border-split);
    cursor: pointer;
    transition: all 0.2s;

    &:hover, &.active {
      background: var(--oa-bg);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .todo-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .todo-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .todo-title {
    font-weight: 500;
    font-size: 14px;
  }

  .todo-meta {
    font-size: 12px;
    color: var(--oa-text-tertiary);
  }
}

.detail-content {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: var(--oa-text-secondary);
    }

    .value {
      font-weight: 500;
    }
  }
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.empty-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--oa-text-tertiary);
}
</style>
