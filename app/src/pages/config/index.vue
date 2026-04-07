<template>
  <AppShell title="系统配置">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">系统配置</text>
          <text class="page-desc">全局参数配置与管理</text>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component :is="Button" v-if="Button" type="primary" @click="saveConfig">保存配置</component>
          <component :is="Button" v-if="Button" @click="resetConfig">重置</component>
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="content-card">
        <view class="card-header">
          <text class="card-title">系统参数设置</text>
        </view>
        <view class="card-body scrollable">
          <!-- 考勤配置 -->
          <view class="config-section">
            <view class="section-title">
              <component :is="iconAttendance" v-if="iconAttendance" class="section-icon" />
              <text>考勤配置</text>
            </view>
            <view class="config-grid">
              <view class="config-item">
                <label>考勤计量单位</label>
                <view class="config-control">
                  <component
                    :is="RadioGroup"
                    v-if="RadioGroup"
                    v-model="config.attendanceUnit"
                  >
                    <component :is="Radio" v-if="Radio" value="day">天</component>
                    <component :is="Radio" v-if="Radio" value="hour">小时</component>
                  </component>
                </view>
              </view>
              <view class="config-item">
                <label>加班倍率</label>
                <view class="config-control overtime-rates">
                  <view class="rate-item">
                    <text class="rate-label">工作日</text>
                    <component :is="InputNumber" v-if="InputNumber" v-model="config.overtimeRateWeekday" :min="1" :max="5" :step="0.5" style="width:80px" />
                    <text class="unit">倍</text>
                  </view>
                  <view class="rate-item">
                    <text class="rate-label">周末</text>
                    <component :is="InputNumber" v-if="InputNumber" v-model="config.overtimeRateWeekend" :min="1" :max="5" :step="0.5" style="width:80px" />
                    <text class="unit">倍</text>
                  </view>
                  <view class="rate-item">
                    <text class="rate-label">节假日</text>
                    <component :is="InputNumber" v-if="InputNumber" v-model="config.overtimeRateHoliday" :min="1" :max="5" :step="0.5" style="width:80px" />
                    <text class="unit">倍</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 薪资配置 -->
          <view class="config-section">
            <view class="section-title">
              <component :is="iconPayroll" v-if="iconPayroll" class="section-icon" />
              <text>薪资配置</text>
            </view>
            <view class="config-grid">
              <view class="config-item">
                <label>发薪日</label>
                <view class="config-control">
                  <component
                    :is="InputNumber"
                    v-if="InputNumber"
                    v-model="config.payDay"
                    :min="1"
                    :max="31"
                    style="width: 120px"
                  />
                  <text class="unit">日</text>
                </view>
              </view>
              <view class="config-item">
                <label>窗口期</label>
                <view class="config-control">
                  <component
                    :is="InputNumber"
                    v-if="InputNumber"
                    v-model="config.windowDays"
                    :min="1"
                    :max="30"
                    style="width: 120px"
                  />
                  <text class="unit">天</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 数据保留 -->
          <view class="config-section">
            <view class="section-title">
              <component :is="iconData" v-if="iconData" class="section-icon" />
              <text>数据保留</text>
            </view>
            <view class="config-grid">
              <view class="config-item">
                <label>全局数据保留期限</label>
                <view class="config-value">
                  <text>1 年（到期前 30 天提醒备份）</text>
                </view>
                <text class="config-hint">延长保留期为后续付费功能，当前版本不开放配置</text>
              </view>
            </view>
          </view>

          <!-- 系统设置 -->
          <view class="config-section">
            <view class="section-title">
              <component :is="iconSystem" v-if="iconSystem" class="section-icon" />
              <text>系统设置</text>
            </view>
            <view class="config-list">
              <view class="config-row">
                <view class="config-info">
                  <text class="config-name">启用邮件通知</text>
                  <text class="config-desc">系统将通过邮件发送重要通知给相关人员</text>
                </view>
                <component
                  :is="Switch"
                  v-if="Switch"
                  v-model="config.emailNotification"
                />
              </view>
              <view class="config-row">
                <view class="config-info">
                  <text class="config-name">启用短信通知</text>
                  <text class="config-desc">系统将通过短信发送紧急通知给相关人员</text>
                </view>
                <component
                  :is="Switch"
                  v-if="Switch"
                  v-model="config.smsNotification"
                />
              </view>
              <view class="config-row">
                <view class="config-info">
                  <text class="config-name">调试模式</text>
                  <text class="config-desc">开启后将显示详细的错误信息</text>
                </view>
                <component
                  :is="Switch"
                  v-if="Switch"
                  v-model="config.debugMode"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { useComponent } from '../../composables/useComponent'
import AppShell from '../../layouts/AppShell.vue'
/* #ifdef H5 */
import { CalendarOutlined, DollarOutlined, DatabaseOutlined, SettingOutlined } from '@ant-design/icons-vue'
const iconAttendance = markRaw(CalendarOutlined)
const iconPayroll    = markRaw(DollarOutlined)
const iconData       = markRaw(DatabaseOutlined)
const iconSystem     = markRaw(SettingOutlined)
/* #endif */

const { Card, Button, Tag, Tabs, Tab, Row, Col, Table, Select, Input, InputNumber, Radio, RadioGroup, Switch } = useComponent(['Card', 'Button', 'Tag', 'Tabs', 'Tab', 'Row', 'Col', 'Table', 'Select', 'Input', 'InputNumber', 'Radio', 'RadioGroup', 'Switch'])

// 配置数据
const config = ref({
  attendanceUnit: 'day',
  payDay: 15,
  windowDays: 7,
  emailNotification: true,
  smsNotification: false,
  debugMode: false,
  overtimeRateWeekday: 1.5,
  overtimeRateWeekend: 2,
  overtimeRateHoliday: 3,
})

const saveConfig = () => {
  uni.showToast({ title: '保存成功', icon: 'success' })
}

const resetConfig = () => {
  uni.showModal({
    title: '确认重置',
    content: '确定要重置所有配置吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已重置', icon: 'success' })
      }
    }
  })
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
      padding: 24px;
    }
  }
}

// 配置区块
.config-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--surface);

    .section-icon {
      font-size: 16px;
      color: var(--secondary);
    }
  }
}

// 配置网格
.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  .config-item {
    label {
      display: block;
      font-size: 12px;
      color: var(--on-surface-variant);
      margin-bottom: 8px;
    }

    .config-control {
      display: flex;
      align-items: center;
      gap: 8px;

      .unit {
        font-size: 13px;
        color: var(--on-surface-variant);
      }
    }

    .overtime-rates {
      flex-wrap: wrap;
      gap: 16px;

      .rate-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .rate-label {
          font-size: 12px;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
      }
    }

    .config-value {
      font-size: 13px;
      color: var(--on-surface);
      padding: 8px 12px;
      background: var(--surface);
      border-radius: var(--radius-sm);
    }

    .config-hint {
      display: block;
      font-size: 11px;
      color: var(--on-surface-variant);
      margin-top: 4px;
      opacity: 0.7;
    }
  }
}

// 配置列表
.config-list {
  .config-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child {
      border-bottom: none;
    }

    .config-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .config-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--on-surface);
      }

      .config-desc {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}
</style>
