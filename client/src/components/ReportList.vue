<template>
  <div>
    <div v-if="reports.length" class="space-y-2">
      <div v-for="report in reports" :key="report._id" class="border border-border-color rounded p-3 bg-hover-bg">
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-primary">{{ report.title || untitledText }}</span>
          <span class="text-xs text-text-secondary">{{ formatDate(report.createdAt) }}</span>
        </div>
        <p class="text-sm text-text-secondary mb-2">{{ report.description || noDescriptionText }}</p>
        <a v-if="report.filePath" :href="report.filePath" target="_blank" class="text-sm text-light-green hover:underline">
          {{ downloadText }}
        </a>
      </div>
    </div>
    <div v-else class="text-sm text-text-secondary">{{ emptyText }}</div>
  </div>
</template>

<script setup>
defineProps({
  reports: { type: Array, default: () => [] },
  formatDate: { type: Function, required: true },
  emptyText: { type: String, default: 'No reports yet.' },
  untitledText: { type: String, default: 'Untitled' },
  noDescriptionText: { type: String, default: 'No description' },
  downloadText: { type: String, default: 'Download' }
});
</script>
