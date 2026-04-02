<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-deco bg-deco--tl"></view>
    <view class="bg-deco bg-deco--br"></view>

    <view class="login-container">
      <!-- Logo -->
      <view class="logo-section">
        <view class="logo-mark"></view>
        <text class="logo-title">众维 OA 工作台</text>
        <text class="logo-subtitle">建筑工程企业内部协同管理系统</text>
      </view>

      <!-- 登录卡片 -->
      <view class="login-card">
        <text class="card-title">账号登录</text>

        <!-- 用户名 -->
        <view class="field">
          <text class="field-label">账号</text>
          <input
            class="field-input"
            v-model="form.username"
            placeholder="请输入用户名"
            placeholder-class="field-placeholder"
            :disabled="loading"
          />
        </view>

        <!-- 密码 -->
        <view class="field">
          <text class="field-label">密码</text>
          <input
            class="field-input"
            v-model="form.password"
            password
            placeholder="请输入密码"
            placeholder-class="field-placeholder"
            :disabled="loading"
            @confirm="handleLogin"
          />
        </view>

        <!-- 错误提示 -->
        <view v-if="errorMsg" class="error-bar">
          <text class="error-text">{{ errorMsg }}</text>
        </view>

        <!-- 登录按钮 -->
        <view
          class="login-btn"
          :class="{ 'login-btn--loading': loading }"
          @click="handleLogin"
        >
          <text class="login-btn-text">{{ loading ? '登录中…' : '登 录' }}</text>
        </view>

        <!-- 测试账号提示 -->
        <view class="hint">
          <text class="hint-text">演示账号：ceo.demo / 123456</text>
        </view>
      </view>

      <text class="copyright">© 2024 众维建筑工程有限公司</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 登录页 (pages/login/index.vue)
 *
 * 职责：账号密码登录，Mock 优先，后端可用时自动切换真实认证。
 * 登录成功 → 写入 userStore → 跳转角色选择页。
 *
 * 注意：本页不使用适配器层 (useComponent)，直接使用 uni-app 原生元素，
 * 保证登录表单立即可见，无异步加载延迟。
 */
import { ref } from 'vue'
import { useUserStore } from '../../stores'
import { loginWithAccount } from '../../utils/access'

const userStore = useUserStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''

  if (!form.value.username.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!form.value.password.trim()) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    const result = await loginWithAccount({
      username: form.value.username.trim(),
      password: form.value.password.trim()
    })

    userStore.setSession(result.token, result.user)

    uni.redirectTo({ url: '/pages/role/index' })
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, var(--oa-primary) 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

/* 背景装饰圆 */
.bg-deco {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--tl {
    width: 480px;
    height: 480px;
    top: -200px;
    left: -180px;
    background: rgba(255, 255, 255, 0.05);
  }

  &--br {
    width: 360px;
    height: 360px;
    bottom: -120px;
    right: -120px;
    background: rgba(255, 255, 255, 0.04);
  }
}

.login-container {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-mark {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 18px;
  margin: 0 auto 16px;
}

.logo-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.logo-subtitle {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

/* 登录卡片 */
.login-card {
  background: #fff;
  border-radius: var(--oa-radius-xl, 16px);
  padding: 32px 28px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.card-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--oa-text-primary);
  margin-bottom: 24px;
}

/* 表单字段 */
.field {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--oa-text-secondary);
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--oa-border);
  border-radius: var(--oa-radius-md);
  font-size: 14px;
  color: var(--oa-text-primary);
  background: #fff;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: var(--oa-primary);
    outline: none;
  }
}

.field-placeholder {
  color: var(--oa-text-tertiary);
}

/* 错误提示 */
.error-bar {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: var(--oa-radius-sm);
  padding: 8px 12px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 13px;
  color: var(--oa-error);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 46px;
  background: var(--oa-primary);
  border-radius: var(--oa-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.2s;

  &--loading {
    opacity: 0.7;
    pointer-events: none;
  }

  &:active {
    opacity: 0.85;
  }
}

.login-btn-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2px;
}

/* 演示提示 */
.hint {
  margin-top: 16px;
  text-align: center;
}

.hint-text {
  font-size: 12px;
  color: var(--oa-text-tertiary);
}

/* 版权 */
.copyright {
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
