<template>
  <!-- Route-transition progress bar at the top of the viewport -->
  <NuxtLoadingIndicator color="#003466" :height="2" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Dev-only floating toolbar: tree-shaken in production build -->
  <CustomizedDevToolbar />
</template>
