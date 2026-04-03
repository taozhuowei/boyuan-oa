<template>
  <view class="page config-page">
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <text class="hero-title">系统配置</text>
          <component :is="Button" v-if="Button" type="default" @click="goBack">返回工作台</component>
        </view>
        <text class="hero-subtitle">全局参数配置与管理</text>
      </view>
    </view>

    <view class="config-container">
      <component :is="Card" v-if="Card">
        <component :is="Tabs" v-if="Tabs" v-model:activeKey="activeTab">
          <component :is="Tab" v-if="Tab" key="attendance" tab="考勤配置">
            <view class="config-section">
              <view class="config-row">
                <text class="config-label">考勤计量单位</text>
                <text class="config-value">天</text>
              </view>
              <view class="config-row">
                <text class="config-label">加班倍率</text>
                <text class="config-value">工作日1.5倍，周末2倍，节假日3倍</text>
              </view>
              <view class="config-row">
                <text class="config-label">打卡方式</text>
                <text class="config-value">系统录入</text>
              </view>
            </view>
          </component>

          <component :is="Tab" v-if="Tab" key="payroll" tab="薪资配置">
            <view class="config-section">
              <view class="config-row">
                <text class="config-label">结算周期</text>
                <text class="config-value">月结（1日-末日）</text>
              </view>
              <view class="config-row">
                <text class="config-label">发薪日</text>
                <text class="config-value">每月15日</text>
              </view>
              <view class="config-row">
                <text class="config-label">窗口期</text>
                <text class="config-value">7天</text>
              </view>
            </view>
          </component>

          <component :is="Tab" v-if="Tab" key="retention" tab="数据保留">
            <view class="config-section">
              <component :is="Table" v-if="Table" :dataSource="retentionData" :columns="retentionColumns" :pagination="false" />
            </view>
          </component>
        </component>
      </component>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'

const { Card, Button, Tag, Tabs, Tab, Row, Col, Table } = useComponent(['Card', 'Button', 'Tag', 'Tabs', 'Tab', 'Row', 'Col', 'Table'])

const userStore = useUserStore()

const activeTab = ref('attendance')

const retentionColumns = [
  { title: '记录类型', dataIndex: 'type', key: 'type' },
  { title: '保留期限', dataIndex: 'period', key: 'period' },
  { title: '到期处理', dataIndex: 'action', key: 'action' }
]

const retentionData = [
  { key: '1', type: '请假记录', period: '1年', action: '提醒后删除' },
  { key: '2', type: '加班记录', period: '1年', action: '提醒后删除' },
  { key: '3', type: '工伤记录', period: '1年', action: '提醒后删除' },
  { key: '4', type: '薪资档案', period: '1年', action: '提醒后删除' },
  { key: '5', type: '施工日志', period: '1年', action: '提醒后删除' }
]

const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.config-page {
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

.config-container {
  :deep(.oa-card) {
    margin-bottom: 0;
  }
}

.config-section {
  padding: 16px 0;
}

.config-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--oa-border-split);

  &:last-child {
    border-bottom: none;
  }
}

.config-label {
  color: var(--oa-text-secondary);
}

.config-value {
  font-weight: 500;
}
</style>
