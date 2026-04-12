<script setup lang="ts">
// /payroll/slips is an API path — redirect to the payroll page which shows slips inline
definePageMeta({ middleware: [] })
navigateTo('/payroll', { replace: true })
</script>
