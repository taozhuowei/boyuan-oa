<template>
  <view class="page role-page">
    <view class="role-container">
      <view class="role-header">
        <text class="role-title">选择您的身份</text>
        <text class="role-subtitle">请选择要登录的角色以进入相应的工作台</text>
      </view>

      <component :is="Row" v-if="Row" :gutter="24">
        <component :is="Col" v-if="Col" :span="12">
          <view
            class="role-card"
            :class="{ active: selectedRole === 'employee' }"
            @click="selectRole('employee')"
          >
            <view class="role-icon employee">
              <component :is="Icon" v-if="Icon" name="badge" :size="32" />
            </view>
            <view class="role-info">
              <text class="role-name">普通员工</text>
              <text class="role-desc">查看个人薪资、提交考勤申请、参与项目</text>
            </view>
            <view v-if="selectedRole === 'employee'" class="role-check">
              <component :is="Icon" v-if="Icon" name="check-circle" :size="24" />
            </view>
          </view>
        </component>

        <component :is="Col" v-if="Col" :span="12">
          <view
            class="role-card"
            :class="{ active: selectedRole === 'ceo' }"
            @click="selectRole('ceo')"
          >
            <view class="role-icon ceo">
              <component :is="Icon" v-if="Icon" name="business-center" :size="32" />
            </view>
            <view class="role-info">
              <text class="role-name">CEO / 管理员</text>
              <text class="role-desc">管理员工、审批考勤、查看全公司数据</text>
            </view>
            <view v-if="selectedRole === 'ceo'" class="role-check">
              <component :is="Icon" v-if="Icon" name="check-circle" :size="24" />
            </view>
          </view>
        </component>
      </component>

      <view class="role-actions">
        <component
          :is="Button"
          v-if="Button"
          type="primary"
          size="large"
          block
          :disabled="!selectedRole"
          :loading="loading"
          @click="confirmRole"
        >
          进入系统
        </component>
        <component :is="Button" v-if="Button" type="link" @click="goBack">
          返回登录
        </component>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'
import { getComponent } from '../../adapters'
import { useUserStore } from '../../stores'

// 异步获取组件
const Icon = ref<Component | null>(null)
const Row = ref<Component | null>(null)
const Col = ref<Component | null>(null)
const Button = ref<Component | null>(null)

onMounted(async () => {
  Icon.value = await getComponent('Icon')
  Row.value = await getComponent('Row')
  Col.value = await getComponent('Col')
  Button.value = await getComponent('Button')
})

const userStore = useUserStore()

const selectedRole = ref('')
const loading = ref(false)

const selectRole = (role: string) => {
  selectedRole.value = role
}

const confirmRole = async () => {
  if (!selectedRole.value) return

  loading.value = true

  try {
    // 更新用户角色
    userStore.setUserInfo({
      ...userStore.userInfo,
      role: selectedRole.value
    })

    // 模拟加载
    await new Promise(resolve => setTimeout(resolve, 500))

    // 跳转到首页
    uni.switchTab({ url: '/pages/index/index' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  userStore.logout()
  uni.redirectTo({ url: '/pages/login/index' })
}
</script>

<style lang="scss" scoped>
.role-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e9f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.role-container {
  width: 100%;
  max-width: 640px;
}

.role-header {
  text-align: center;
  margin-bottom: 48px;

  .role-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--oa-text);
    display: block;
    margin-bottom: 12px;
  }

  .role-subtitle {
    font-size: 14px;
    color: var(--oa-text-secondary);
  }
}

.role-card {
  background: #fff;
  border-radius: var(--oa-radius-lg);
  padding: 32px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &.active {
    border-color: var(--oa-primary);
    background: linear-gradient(135deg, #fff 0%, #f0f7ff 100%);
  }

  .role-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.employee {
      background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
      color: var(--oa-primary);
    }

    &.ceo {
      background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
      color: #fa8c16;
    }
  }

  .role-info {
    flex: 1;
  }

  .role-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--oa-text);
    display: block;
    margin-bottom: 8px;
  }

  .role-desc {
    font-size: 13px;
    color: var(--oa-text-secondary);
    line-height: 1.5;
  }

  .role-check {
    position: absolute;
    top: 16px;
    right: 16px;
    color: var(--oa-primary);
  }
}

.role-actions {
  margin-top: 48px;
  text-align: center;

  :deep(.oa-button) {
    margin-bottom: 16px;
  }
}

// 响应式
@media (max-width: 640px) {
  .role-card {
    padding: 24px;
    flex-direction: column;
    text-align: center;

    .role-icon {
      margin: 0 auto;
    }
  }
}
</style>
