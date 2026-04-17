<script setup lang="ts">
// 快捷入口转发页：后端 quickActions 指向 /forms/overtime；
// 加班申报表单实际位于考勤页的「加班申报」Tab，所以转发到 /attendance?tab=overtime
// 目的：修复 /forms/overtime 死链（原先 Nuxt 无此路由会 404）
onMounted(() => {
  navigateTo('/attendance?tab=overtime', { replace: true })
})
</script>
<template><div /></template>
