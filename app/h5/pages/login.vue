<template>
  <a-config-provider :locale="zhCN">
    <div class="login-page">
      <div class="login-container">
        <!-- Company header — name comes from /api/setup/status, falls back to 博渊 -->
        <div class="company-section">
          <h1 class="company-name">{{ companyName || '博渊' }}</h1>
          <p class="company-subtitle">企业协同管理系统</p>
        </div>

        <!-- Login card -->
        <div class="login-card">
          <a-form :model="form" layout="vertical" @finish="handleLogin">
            <a-form-item
              label="工号 / 手机号"
              name="identifier"
              :rules="[{ required: true, message: '请输入工号或手机号' }]"
            >
              <a-input
                v-model:value="form.identifier"
                placeholder="请输入工号或手机号"
                size="large"
                :disabled="loading"
                data-catch="login-username"
              />
            </a-form-item>

            <a-form-item
              label="登录密码"
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password
                v-model:value="form.password"
                placeholder="请输入密码"
                size="large"
                :disabled="loading"
                data-catch="login-password"
              />
            </a-form-item>

            <!-- DEF-AUTH-02: 图形验证码，失败 ≥ 3 次后出现 -->
            <a-form-item
              v-if="captchaImage"
              label="图形验证码"
              name="captchaAnswer"
              :rules="[{ required: true, message: '请输入图形验证码' }]"
            >
              <div class="captcha-row">
                <a-input
                  v-model:value="form.captchaAnswer"
                  placeholder="请输入图中数字"
                  size="large"
                  :disabled="loading"
                  :maxlength="6"
                  data-catch="login-captcha-answer"
                />
                <img
                  :src="'data:image/png;base64,' + captchaImage"
                  alt="图形验证码"
                  class="captcha-image"
                  :title="'点击刷新'"
                  data-catch="login-captcha-image"
                  @click="refreshCaptcha"
                />
              </div>
            </a-form-item>

            <a-alert
              v-if="errorMsg"
              type="error"
              :message="errorMsg"
              show-icon
              style="margin-bottom: 16px"
              data-catch="login-form-error-alert"
            />

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="loading"
                data-catch="login-form-submit"
              >
                登 录
              </a-button>
            </a-form-item>
          </a-form>

          <div class="forgot-link" @click="navigateTo('/auth/forgot_password')">忘记密码？</div>
        </div>
      </div>

      <span class="powered-by">Powered by 博渊</span>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { loginWithAccount, fetchCaptcha, LoginError } from '~/utils/access'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: false })

const userStore = useUserStore()
const loading = ref(false)
const errorMsg = ref('')
const form = reactive({ identifier: '', password: '', captchaAnswer: '' })
const captchaId = ref<string | null>(null)
const captchaImage = ref<string | null>(null)

// 企业名：由 useCompanyName 统一管理；fetchIfNeeded 内部已处理「已有值则跳过」逻辑
// 未设置时模板回退到「博渊」
const { companyName, fetchIfNeeded } = useCompanyName()
onMounted(() => {
  fetchIfNeeded()
})

/** DEF-AUTH-02: 获取图形验证码并显示；用户输入后随下次登录请求一起提交 */
async function refreshCaptcha() {
  try {
    const res = await fetchCaptcha()
    captchaId.value = res.captchaId
    captchaImage.value = res.imageBase64
    form.captchaAnswer = ''
  } catch {
    errorMsg.value = '获取验证码失败，请稍后重试'
  }
}

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await loginWithAccount({
      identifier: form.identifier,
      password: form.password,
      captchaId: captchaId.value ?? undefined,
      captchaAnswer: captchaImage.value ? form.captchaAnswer : undefined,
    })
    userStore.setSession(result.token, result.user)
    await navigateTo('/')
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '登录失败，请重试'
    // 后端要求 captcha（首次出现或验证码答错）→ 自动拉取并显示
    if (err instanceof LoginError && err.info.captchaRequired) {
      await refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
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

.company-section {
  text-align: center;
  margin-bottom: 28px;
}

.company-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.company-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.forgot-link {
  text-align: center;
  font-size: 13px;
  color: #003466;
  cursor: pointer;
  margin-top: 4px;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  cursor: pointer;
  user-select: none;
}

.powered-by {
  position: fixed;
  bottom: 20px;
  right: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
