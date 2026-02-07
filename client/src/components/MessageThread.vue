<template>
  <div class="bg-hover-bg rounded p-3 border border-border-color">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-bold text-primary">{{ title }}</h3>
      <span class="text-xs text-text-secondary">{{ messages.length }} {{ countLabel }}</span>
    </div>
    <div class="max-h-40 overflow-y-auto space-y-3">
      <div
        v-for="msg in messages"
        :key="msg._id"
        class="pb-2 border-b border-border-color/50 last:border-b-0"
      >
        <p class="text-xs text-text-secondary mb-1">
          {{ fromLabel }} {{ msg.senderId?.firstName }} {{ msg.senderId?.lastName || '' }}
        </p>
        <p class="text-sm text-text-primary">{{ msg.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  messages: { type: Array, default: () => [] },
  countLabel: { type: String, default: 'messages' },
  fromLabel: { type: String, default: 'From' }
});
</script>
