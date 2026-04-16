<template>
  <!-- Route-transition progress bar at the top of the viewport -->
  <NuxtLoadingIndicator color="#003466" :height="2" />
  <a-config-provider :locale="antdLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </a-config-provider>
  <!-- Dev-only floating toolbar: tree-shaken in production build -->
  <CustomizedDevToolbar />
</template>

<script setup lang="ts">
/**
 * 根组件
 * 使用 ConfigProvider 包裹应用，提供 Ant Design Vue 的中文国际化配置
 * 动态设置页面 title：未初始化或未设置企业名时为「博渊OA管理系统」，初始化后为「{企业名}OA管理系统」
 */
import { ref, computed, onMounted } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置 dayjs 为中文（模块级同步调用，确保首次渲染前生效）
dayjs.locale('zh-cn')

// Ant Design Vue 中文配置
const antdLocale = zhCN

// 企业名：从 /api/setup/status 获取；未设置时回退到「博渊」
const companyName = ref<string | null>(null)
const appTitle = computed(() =>
  companyName.value ? `${companyName.value}OA管理系统` : '博渊OA管理系统'
)

useHead({ title: appTitle })

onMounted(async () => {
  try {
    const data = await $fetch<{ companyName?: string | null }>('/api/setup/status')
    if (data.companyName) companyName.value = data.companyName
  } catch {
    // ignore — fallback title remains
  }
})
</script>
