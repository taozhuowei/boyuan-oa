<template>
  <view class="login-page">
    <view class="login-container">
      <!-- 企业名称区域 -->
      <view class="company-section">
        <text class="company-name">众维建筑工程有限公司</text>
        <text class="company-subtitle">企业协同管理系统</text>
      </view>

      <!-- 登录卡片 -->
      <view class="login-card">
        <!-- 工号/手机号输入 -->
        <view class="field">
          <text class="field-label">工号 / 手机号</text>
          <input
            class="field-input"
            v-model="form.identifier"
            type="text"
            placeholder="请输入工号或手机号"
            placeholder-class="field-placeholder"
            :disabled="loading"
          />
        </view>

        <!-- 登录密码输入 -->
        <view class="field">
          <text class="field-label">登录密码</text>
          <view class="password-wrapper">
            <input
              class="field-input password-input"
              v-model="form.password"
              :password="!showPassword"
              placeholder="请输入密码"
              placeholder-class="field-placeholder"
              :disabled="loading"
              @confirm="handleLogin"
            />
            <text class="eye-btn" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁' }}
            </text>
          </view>
        </view>

        <!-- 快速选择账号（演示用） -->
        <view class="quick-accounts">
          <text class="quick-title">快速选择账号：</text>
          <view class="quick-list">
            <text
              v-for="acc in quickAccounts"
              :key="acc.username"
              class="quick-item"
              @click="selectAccount(acc)"
            >
              {{ acc.displayName }}({{ acc.roleName }})
            </text>
          </view>
        </view>

        <!-- 错误提示（仅 H5） -->
        <!-- #ifdef H5 -->
        <view v-if="errorMsg" class="error-bar">
          <text class="error-text">{{ errorMsg }}</text>
        </view>
        <!-- #endif -->

        <!-- 登录按钮 -->
        <view
          class="login-btn"
          :class="{ 'login-btn--loading': loading }"
          @click="handleLogin"
        >
          <text class="login-btn-text">{{ loading ? '登录中…' : '登 录' }}</text>
        </view>

        <!-- 忘记密码 -->
        <view class="forgot-link" @click="handleForgotPassword">
          <text>忘记密码？</text>
        </view>
      </view>
    </view>

    <!-- Powered by -->
    <text class="powered-by">Powered by 博渊</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores'
import { loginWithAccount, defaultTestAccounts } from '../../utils/access'

const userStore = useUserStore()
const form = ref({ identifier: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

// 快速选择账号列表
const quickAccounts = defaultTestAccounts.slice(0, 5)

// 选择账号快速填充
const selectAccount = (acc: typeof defaultTestAccounts[0]) => {
  form.value.identifier = acc.username
  form.value.password = acc.password
}

// 显示错误：H5端行内+3秒自动消失，MP端showToast
function showError(msg: string) {
  // #ifdef H5
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = '' }, 3000)
  // #endif
  // #ifndef H5
  uni.showToast({ icon: 'none', title: msg })
  // #endif
}

const handleForgotPassword = () => {
  uni.navigateTo({ url: '/pages/auth/forgot_password/index' })
}

const handleLogin = async () => {
  if (loading.value) return
  if (!form.value.identifier.trim()) { showError('请输入工号或手机号'); return }
  if (!form.value.password.trim()) { showError('请输入密码'); return }

  loading.value = true
  try {
    const result = await loginWithAccount({
      identifier: form.value.identifier.trim(),
      password: form.value.password.trim()
    })
    
    // 保存到 userStore
    userStore.setSession(result.token, result.user)
    
    // sysadmin 跳初始化向导，其他跳工作台
    if (result.user.role === 'sysadmin') {
      uni.redirectTo({ url: '/pages/setup/index' })
    } else {
      uni.switchTab({ url: '/pages/index/index' })
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #003466 0%, #1a4b84 45%, #f0f2f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

/* 企业名称区域 */
.company-section {
  text-align: center;
  margin-bottom: 28px;
}

.company-name {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}

.company-subtitle {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

/* 登录卡片 */
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

/* 表单字段 */
.field {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.field-placeholder {
  color: #999;
}

/* 密码容器 */
.password-wrapper {
  position: relative;
}

.password-input {
  padding-right: 44px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  cursor: pointer;
}

/* 快速选择账号 */
.quick-accounts {
  margin-bottom: 16px;
}

.quick-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  display: block;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-item {
  font-size: 12px;
  color: #003466;
  background: rgba(0, 52, 102, 0.08);
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

/* 错误提示（H5专用） */
.error-bar {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.error-text {
  font-size: 13px;
  color: #ff4d4f;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 46px;
  background: #003466;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  cursor: pointer;
}

.login-btn--loading {
  opacity: 0.7;
  pointer-events: none;
}

.login-btn-text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 忘记密码 */
.forgot-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #003466;
  cursor: pointer;
}

/* Powered by */
.powered-by {
  position: fixed;
  bottom: 20px;
  right: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
