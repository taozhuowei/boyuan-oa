<template>
  <!--
    AppSpin — universal page-level loading overlay.
    Wraps slot content with an Ant Design Vue a-spin overlay.

    Props:
      loading  — whether the spinner is visible (default: false)
      tip      — text shown below the spinner (default: '加载中...')

    Usage:
      <CustomizedAppSpin :loading="isLoading" tip="数据加载中...">
        <your-content />
      </CustomizedAppSpin>
  -->
  <a-spin :spinning="loading" :tip="tip" size="large">
    <slot />
  </a-spin>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean
    tip?: string
  }>(),
  {
    loading: false,
    tip: '加载中...',
  }
)
</script>
