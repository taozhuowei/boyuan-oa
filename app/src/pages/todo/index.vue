<template>
  <AppShell title="待办中心">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">待办中心</text>
          <text class="page-desc">待处理事项与审批任务</text>
        </view>
        <view class="header-stats">
          <view class="stat-item">
            <text class="stat-value">{{ filteredList.length }}</text>
            <text class="stat-label">待处理</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ highPriorityCount }}</text>
            <text class="stat-label">高优先级</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <view class="tab-group">
            <view 
              class="tab-item" 
              :class="{ active: activeTab === 'all' }"
              @click="activeTab = 'all'"
            >
              全部
            </view>
            <view 
              class="tab-item" 
              :class="{ active: activeTab === 'approval' }"
              @click="activeTab = 'approval'"
            >
              审批
            </view>
            <view 
              class="tab-item" 
              :class="{ active: activeTab === 'notice' }"
              @click="activeTab = 'notice'"
            >
              通知
            </view>
          </view>
          <component
            :is="Select"
            v-if="Select"
            v-model="filterPriority"
            :options="priorityOptions"
            placeholder="全部优先级"
            style="width: 120px"
          />
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="searchKeyword"
            placeholder="搜索待办事项"
            :prefix="'search'"
            style="width: 200px"
          />
        </view>
      </view>

      <!-- 主内容区：待办列表 -->
      <view class="content-card">
        <view class="card-header">
          <text class="card-title">待办列表（{{ displayList.length }}）</text>
        </view>
        <view class="card-body scrollable">
          <view v-if="displayList.length" class="todo-list">
            <view
              v-for="item in displayList"
              :key="item.id"
              class="todo-item"
            >
              <view 
                class="priority-indicator"
                :class="item.priority"
              />
              <view class="todo-content">
                <view class="todo-main">
                  <text class="todo-title">{{ item.title }}</text>
                  <view class="todo-tags">
                    <view 
                      class="type-tag"
                      :class="getTypeClass(item.type)"
                    >
                      {{ item.type }}
                    </view>
                    <view 
                      class="priority-tag"
                      :class="item.priority"
                    >
                      {{ item.priority === 'high' ? '高' : item.priority === 'mid' ? '中' : '低' }}
                    </view>
                  </view>
                </view>
                <view class="todo-meta">
                  <view class="meta-item">
                    <!-- #ifdef H5 --><UserOutlined class="meta-icon" /><!-- #endif -->
                    <!-- #ifndef H5 --><text class="meta-icon">人</text><!-- #endif -->
                    <text>{{ item.submitter }}</text>
                  </view>
                  <view class="meta-item">
                    <!-- #ifdef H5 --><BankOutlined class="meta-icon" /><!-- #endif -->
                    <!-- #ifndef H5 --><text class="meta-icon">部</text><!-- #endif -->
                    <text>{{ item.dept }}</text>
                  </view>
                  <view class="meta-item">
                    <!-- #ifdef H5 --><CalendarOutlined class="meta-icon" /><!-- #endif -->
                    <!-- #ifndef H5 --><text class="meta-icon">日</text><!-- #endif -->
                    <text>{{ item.date }}</text>
                  </view>
                </view>
              </view>
              <view class="todo-actions">
                <text class="todo-time">{{ item.time || item.date }}</text>
                <component
                  :is="Button"
                  v-if="Button && (isCEO || isPM)"
                  type="primary"
                  size="small"
                  @click="handleApprove(item)"
                >
                  审批
                </component>
                <component
                  :is="Button"
                  v-if="Button"
                  type="link"
                  size="small"
                  @click="viewDetail(item)"
                >
                  查看
                </component>
              </view>
            </view>
          </view>
          <view v-else class="empty-state">
            <text>暂无待办事项</text>
          </view>
        </view>
      </view>

    </view>

    <!-- 审批详情弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="showDetailModal"
      title="待办详情"
      width="500px"
    >
      <view v-if="selectedItem" class="detail-content">
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
          <view 
            class="priority-tag"
            :class="selectedItem.priority"
          >
            {{ selectedItem.priority === 'high' ? '高' : selectedItem.priority === 'mid' ? '中' : '低' }}
          </view>
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="showDetailModal = false">关闭</component>
        <component
          :is="Button"
          v-if="Button && (isCEO || isPM) && selectedItem"
          type="default"
          @click="rejectItem"
        >
          驳回
        </component>
        <component
          :is="Button"
          v-if="Button && (isCEO || isPM) && selectedItem"
          type="primary"
          @click="approveItem"
        >
          通过
        </component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

/* #ifdef H5 */
import { UserOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons-vue'
/* #endif */

const { Row, Col, Card, Badge, Button, Tag, Empty, Tabs, Tab, Input, Select, Modal } = useComponent(['Row', 'Col', 'Card', 'Badge', 'Button', 'Tag', 'Empty', 'Tabs', 'Tab', 'Input', 'Select', 'Modal'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isPM = computed(() => userRole.value === 'project_manager')

const currentUserName = computed(() => userStore.userInfo?.displayName || userStore.userInfo?.username || '')

// 状态
const activeTab = ref('all')
const filterPriority = ref('')
const searchKeyword = ref('')
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

// 选项
const priorityOptions = [
  { label: '全部', value: '' },
  { label: '高', value: 'high' },
  { label: '中', value: 'mid' },
  { label: '低', value: 'low' }
]

const pendingList = ref([
  { id: 1, title: '李静 请假申请', type: '请假', submitter: '李静', dept: '财务管理部', date: '2025-01-15', duration: '2天', status: 'PENDING', priority: 'high', time: '10:30' },
  { id: 2, title: '赵铁柱 加班申请', type: '加班', submitter: '赵铁柱', dept: '施工一部', date: '2025-01-14', duration: '4小时', status: 'PENDING', priority: 'mid', time: '18:00' },
  { id: 3, title: '王建国 请假申请', type: '请假', submitter: '王建国', dept: '项目一部', date: '2025-01-13', duration: '1天', status: 'PENDING', priority: 'low', time: '09:15' },
  { id: 4, title: '张晓宁 工伤补偿', type: '工伤', submitter: '张晓宁', dept: '综合管理部', date: '2025-01-12', duration: '-', status: 'PENDING', priority: 'high', time: '14:20' },
  { id: 5, title: '赵铁柱 施工日志', type: '日志', submitter: '赵铁柱', dept: '施工一部', date: '2025-01-11', duration: '-', status: 'PENDING', priority: 'mid', time: '16:45' }
])

const filteredList = computed(() => {
  if (isCEO.value || isPM.value) {
    return pendingList.value
  }
  return pendingList.value.filter(item => item.submitter === currentUserName.value)
})

const displayList = computed(() => {
  let result = filteredList.value

  // Tab 筛选
  if (activeTab.value === 'approval') {
    result = result.filter(item => ['请假', '加班', '工伤'].includes(item.type))
  } else if (activeTab.value === 'notice') {
    result = result.filter(item => ['日志', '通知'].includes(item.type))
  }

  // 优先级筛选
  if (filterPriority.value) {
    result = result.filter(item => item.priority === filterPriority.value)
  }

  // 搜索
  if (searchKeyword.value) {
    result = result.filter(item => 
      item.title.includes(searchKeyword.value) ||
      item.submitter.includes(searchKeyword.value)
    )
  }

  return result
})

const highPriorityCount = computed(() => {
  return filteredList.value.filter(item => item.priority === 'high').length
})

const getTypeClass = (type: string) => {
  const map: Record<string, string> = {
    '请假': 'primary',
    '加班': 'warning',
    '工伤': 'error',
    '日志': 'success'
  }
  return map[type] || 'default'
}

const viewDetail = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const handleApprove = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const approveItem = () => {
  uni.showToast({ title: '已通过', icon: 'success' })
  showDetailModal.value = false
}

const rejectItem = () => {
  uni.showToast({ title: '已驳回', icon: 'none' })
  showDetailModal.value = false
}
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }

  .page-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-top: 2px;
    display: block;
  }

  .header-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      text-align: right;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary);
        display: block;
        font-family: var(--font-display, 'Manrope');
      }

      .stat-label {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .tab-group {
      display: flex;
      gap: 4px;
      background: var(--surface-low);
      padding: 4px;
      border-radius: var(--radius-md);

      .tab-item {
        padding: 6px 16px;
        font-size: 13px;
        color: var(--on-surface-variant);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all 0.2s;

        &:hover {
          color: var(--on-surface);
        }

        &.active {
          background: var(--surface-lowest);
          color: var(--primary);
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.content-card {
  flex: 1;
  min-height: 0;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-high);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-surface);
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;

    &.scrollable {
      overflow-y: auto;
      padding: 0 20px;
    }
  }
}

// 待办列表
.todo-list {
  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--surface);
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--surface-low);
      margin: 0 -20px;
      padding-left: 20px;
      padding-right: 20px;
    }

    .priority-indicator {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      flex-shrink: 0;

      &.high { background: var(--error); }
      &.mid { background: var(--warning); }
      &.low { background: var(--success); }
    }

    .todo-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .todo-main {
        display: flex;
        align-items: center;
        gap: 10px;

        .todo-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--on-surface);
        }

        .todo-tags {
          display: flex;
          gap: 6px;
        }
      }

      .todo-meta {
        display: flex;
        gap: 16px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--on-surface-variant);
        }

        .meta-icon {
          font-size: 12px;
          flex-shrink: 0;
        }
      }
    }

    .todo-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;

      .todo-time {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

// 标签样式
.type-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &.primary { background: rgba(0,52,102,0.08); color: var(--primary); }
  &.warning { background: #fff7e6; color: #ed6c02; }
  &.error { background: #fff1f0; color: #ba1a1a; }
  &.success { background: #f0f9eb; color: #2e7d32; }
  &.default { background: var(--surface-low); color: var(--on-surface-variant); }
}

.priority-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &.high { background: #fff1f0; color: #ba1a1a; }
  &.mid { background: #fff7e6; color: #ed6c02; }
  &.low { background: #f0f9eb; color: #2e7d32; }
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--on-surface-variant);
  font-size: 13px;
}

// 详情弹窗
.detail-content {
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .value {
      font-size: 13px;
      font-weight: 500;
      color: var(--on-surface);
    }
  }
}
</style>
