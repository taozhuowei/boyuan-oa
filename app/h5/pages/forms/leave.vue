<script setup lang="ts">
// 快捷入口转发页：后端 quickActions 指向 /forms/leave；
// 请假表单实际位于考勤页的「请假申请」Tab，所以转发到 /attendance?tab=leave
// 目的：修复 /forms/leave 死链（原先 Nuxt 无此路由会 404）
onMounted(() => {
  navigateTo('/attendance?tab=leave', { replace: true })
})
</script>
<template><div /></template>
