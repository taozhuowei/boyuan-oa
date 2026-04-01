<template>
  <view class="login-page">
    <view class="login-container">
      <!-- Logo -->
      <view class="logo-section">
        <view class="logo">
          <component :is="Icon" v-if="Icon" name="domain" :size="48" color="#1890ff" />
        </view>
        <text class="logo-title">企业 OA 系统</text>
        <text class="logo-subtitle">统一办公管理平台</text>
      </view>

      <!-- 登录表单 -->
      <component :is="Card" v-if="Card" class="login-card">
        <view class="login-tabs">
          <view
            class="tab-item"
            :class="{ active: loginType === 'password' }"
            @click="loginType = 'password'"
          >
            密码登录
          </view>
          <view
            class="tab-item"
            :class="{ active: loginType === 'sms' }"
            @click="loginType = 'sms'"
          >
            验证码登录
          </view>
        </view>

        <view class="form-content">
          <view class="form-item">
            <component
              :is="Input"
              v-if="Input"
              v-model="loginForm.username"
              placeholder="请输入用户名/手机号"
              :prefix="'person-outline'"
            />
          </view>

          <view v-if="loginType === 'password'" class="form-item">
            <component
              :is="Input"
              v-if="Input"
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix="'lock-outline'"
            />
          </view>

          <view v-else class="form-item">
            <component :is="Row" v-if="Row" :gutter="8">
              <component :is="Col" v-if="Col" :span="16">
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="loginForm.code"
                  placeholder="请输入验证码"
                  :prefix="'verified-outline'"
                />
              </component>
              <component :is="Col" v-if="Col" :span="8">
                <component
                  :is="Button"
                  v-if="Button"
                  block
                  :disabled="countdown > 0"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </component>
              </component>
            </component>
          </view>

          <view class="form-options">
            <component :is="Checkbox" v-if="Checkbox" v-model="rememberMe">记住我</component>
            <component :is="Button" v-if="Button" type="link" size="small">忘记密码?</component>
          </view>

          <component
            :is="Button"
            v-if="Button"
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </component>
        </view>

        <view class="divider">
          <text>其他登录方式</text>
        </view>

        <view class="social-login">
          <view class="social-btn wechat" @click="wechatLogin">
            <component :is="Icon" v-if="Icon" name="wechat" :size="24" />
            <text>微信登录</text>
          </view>
          <view class="social-btn dingtalk" @click="dingtalkLogin">
            <component :is="Icon" v-if="Icon" name="dingding" :size="24" />
            <text>钉钉登录</text>
          </view>
        </view>
      </component>

      <!-- 版权信息 -->
      <text class="copyright">© 2024 企业OA系统 版权所有</text>
    </view>

    <!-- 背景装饰 -->
    <view class="bg-decoration left"></view>
    <view class="bg-decoration right"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Component } from 'vue'
import { getComponent } from '../../adapters'
import { useUserStore } from '../../stores'

// 异步获取组件
const Icon = ref<Component | null>(null)
const Card = ref<Component | null>(null)
const Input = ref<Component | null>(null)
const Button = ref<Component | null>(null)
const Checkbox = ref<Component | null>(null)
const Row = ref<Component | null>(null)
const Col = ref<Component | null>(null)

onMounted(async () => {
  Icon.value = await getComponent('Icon')
  Card.value = await getComponent('Card')
  Input.value = await getComponent('Input')
  Button.value = await getComponent('Button')
  Checkbox.value = await getComponent('Checkbox')
  Row.value = await getComponent('Row')
  Col.value = await getComponent('Col')
})

const userStore = useUserStore()

const loginType = ref('password')
const loading = ref(false)
const rememberMe = ref(false)
const countdown = ref(0)

const loginForm = ref({
  username: '',
  password: '',
  code: ''
})

const sendCode = () => {
  if (!loginForm.value.username) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }

  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)

  uni.showToast({ title: '验证码已发送', icon: 'success' })
}

const handleLogin = async () => {
  if (!loginForm.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }

  if (loginType.value === 'password' && !loginForm.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  if (loginType.value === 'sms' && !loginForm.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }

  loading.value = true

  try {
    // Mock 登录
    await new Promise(resolve => setTimeout(resolve, 1000))

    userStore.setSession(
      'mock_token_' + Date.now(),
      {
        username: loginForm.value.username,
        displayName: loginForm.value.username,
        role: '', // 角色选择页面再确定
        roleName: '',
        department: '未分配部门',
        employeeType: '普通员工',
        status: '在线'
      }
    )

    uni.showToast({ title: '登录成功', icon: 'success' })

    // 跳转到角色选择页面
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/role/index' })
    }, 500)
  } finally {
    loading.value = false
  }
}

const wechatLogin = () => {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    success: (res) => {
      console.log('微信登录', res)
      uni.showToast({ title: '微信登录成功', icon: 'success' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
  // #endif
}

const dingtalkLogin = () => {
  uni.showToast({ title: '钉钉登录开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e9f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  position: relative;
  z-index: 1;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;

  .logo {
    width: 80px;
    height: 80px;
    background: #fff;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .logo-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--oa-text);
    display: block;
    margin-bottom: 8px;
  }

  .logo-subtitle {
    font-size: 14px;
    color: var(--oa-text-secondary);
  }
}

.login-card {
  :deep(.oa-card-body) {
    padding: 32px;
  }
}

.login-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--oa-border);

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 14px;
    color: var(--oa-text-secondary);
    cursor: pointer;
    position: relative;
    transition: all 0.3s;

    &.active {
      color: var(--oa-primary);
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 2px;
        background: var(--oa-primary);
      }
    }
  }
}

.form-content {
  padding: 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--oa-border);
  }

  text {
    position: relative;
    background: #fff;
    padding: 0 16px;
    font-size: 12px;
    color: var(--oa-text-secondary);
  }
}

.social-login {
  display: flex;
  gap: 16px;

  .social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border-radius: var(--oa-radius-md);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;

    &.wechat {
      background: #f6ffed;
      color: #52c41a;
      border: 1px solid #b7eb8f;

      &:hover {
        background: #d9f7be;
      }
    }

    &.dingtalk {
      background: #e6f7ff;
      color: #1890ff;
      border: 1px solid #91d5ff;

      &:hover {
        background: #bae7ff;
      }
    }
  }
}

.copyright {
  display: block;
  text-align: center;
  margin-top: 32px;
  font-size: 12px;
  color: var(--oa-text-tertiary);
}

.bg-decoration {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.02) 100%);

  &.left {
    top: -200px;
    left: -200px;
  }

  &.right {
    bottom: -200px;
    right: -200px;
    background: linear-gradient(135deg, rgba(0, 52, 102, 0.06) 0%, rgba(0, 52, 102, 0.02) 100%);
  }
}

// 响应式
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    :deep(.oa-card-body) {
      padding: 24px;
    }
  }

  .social-login {
    flex-direction: column;
  }
}
</style>
