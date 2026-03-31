<!--
 * 企业 OA 登录页面
 * 用途：提供统一身份认证入口，员工使用账号密码登录系统
 * 交互入口：账号密码输入后调用 loginWithAccount，登录成功后跳转工作台
-->

<template>
  <view class="login-page oa-page">
    <view class="login-shell">
      <view class="login-brand oa-surface-hero">
        <view class="brand-copy">
          <text class="eyebrow">众维</text>
          <text class="title">OA</text>
        </view>
      </view>

      <view class="login-card oa-panel">
        <view class="card-top">
          <text class="card-title">账号登录</text>
        </view>

        <view class="form-list">
          <view class="field-block">
            <text class="field-label">账号</text>
            <input
              v-model="form.username"
              class="field-input"
              type="text"
              placeholder="例如 employee.demo"
            />
          </view>
          <view class="field-block">
            <text class="field-label">密码</text>
            <input
              v-model="form.password"
              class="field-input"
              password
              type="text"
              placeholder="请输入登录密码"
            />
          </view>
        </view>

        <button class="login-btn" @click="handleLogin">进入工作台</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '../../stores'
import { loginWithAccount } from '../../utils/access'

// 用户状态管理store，用于保存登录后的会话信息（token、用户信息）
const userStore = useUserStore()

/**
 * 登录表单状态
 * 职责：绑定并收集用户输入的账号和密码
 */
const form = reactive({
  username: '',
  password: ''
})

/**
 * 登录提交处理函数
 * 职责：调用认证接口验证账号密码，登录成功后保存会话并跳转工作台
 */
const handleLogin = async () => {
  try {
    const result = await loginWithAccount({
      username: form.username,
      password: form.password
    })

    userStore.setSession(result.token, result.user)

    if (typeof uni !== 'undefined') {
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  } catch (error) {
    if (typeof uni !== 'undefined') {
      uni.showToast({
        title: error instanceof Error ? error.message : '登录失败',
        icon: 'none'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  padding: clamp(18px, 3vw, 28px);
}

.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(340px, 460px);
  gap: 18px;
  align-items: stretch;
}

.login-brand,
.login-card {
  min-height: 100%;
}

.login-brand {
  display: grid;
  align-content: center;
  gap: 26px;
  padding: clamp(22px, 4vw, 36px);
}

.brand-copy,
.form-list {
  display: grid;
  gap: 14px;
}

.eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 247, 238, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.16);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.76);
}

.title {
  display: block;
  max-width: none;
  font-family: var(--oa-font-display);
  font-size: clamp(54px, 7vw, 84px);
  line-height: 1.02;
  color: var(--oa-text-inverse);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-title {
  display: block;
  font-family: var(--oa-font-display);
  font-size: 24px;
  color: var(--oa-text-primary);
}

.field-block {
  display: grid;
  gap: 10px;
}

.field-label {
  font-size: 13px;
  color: var(--oa-text-secondary);
}

.field-input {
  height: 50px;
  padding: 0 16px;
  border-radius: var(--oa-radius-md);
  background: rgba(255, 248, 243, 0.88);
  border: 1px solid var(--oa-border-strong);
  color: var(--oa-text-primary);
  font-size: 14px;
}

.login-btn {
  margin-top: 4px;
  height: 50px;
  line-height: 50px;
  border-radius: 999px;
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  font-size: 15px;
  box-shadow: var(--oa-shadow-accent);
}

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .login-page {
    padding: 16px;
  }

  .title {
    max-width: none;
  }

  .card-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
