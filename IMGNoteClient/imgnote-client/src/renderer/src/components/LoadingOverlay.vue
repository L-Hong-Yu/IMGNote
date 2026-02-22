<template>
  <Teleport to="body">
    <Transition name="loading-fade">
      <div v-if="visible" class="loading-overlay" aria-hidden="true">
        <div class="loading-content">
          <div class="loading-spinner">
            <svg
              class="spinner-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <circle class="spinner-circle" cx="12" cy="12" r="10" />
            </svg>
          </div>
          <p class="loading-text">{{ text }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style scoped>
.loading-overlay {
  user-select: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: var(--accent);
}

.spinner-svg {
  width: 100%;
  height: 100%;
  animation: spinner-rotate 1s linear infinite;
}

.spinner-circle {
  stroke-dasharray: 62.83;
  stroke-dashoffset: 31.42;
  animation: spinner-dash 1.5s ease-in-out infinite;
  stroke-linecap: round;
}

.loading-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

.loading-fade-enter-active .loading-content,
.loading-fade-leave-active .loading-content {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.loading-fade-enter-from .loading-content,
.loading-fade-leave-to .loading-content {
  opacity: 0;
  transform: scale(0.95);
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -125;
  }
}
</style>
