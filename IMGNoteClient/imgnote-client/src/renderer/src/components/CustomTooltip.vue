<template>
  <div ref="wrapRef" class="custom-tooltip-wrap" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="show && content"
          class="custom-tooltip-bubble"
          role="tooltip"
          :style="bubbleStyle"
        >
          {{ content }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
  delay: { type: Number, default: 400 },
  placement: { type: String, default: 'top' }
})

const show = ref(false)
const wrapRef = ref(null)
const bubbleStyle = ref({})
let delayTimer = null

function clearTimer() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
}

function updatePosition() {
  const wrap = wrapRef.value
  if (!wrap || !show.value) return
  const rect = wrap.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const gap = 6
  if (props.placement === 'bottom') {
    bubbleStyle.value = {
      position: 'fixed',
      left: `${centerX}px`,
      top: `${rect.bottom + gap}px`,
      transform: 'translate(-50%, 0)'
    }
  } else {
    bubbleStyle.value = {
      position: 'fixed',
      left: `${centerX}px`,
      top: `${rect.top - gap}px`,
      transform: 'translate(-50%, -100%)'
    }
  }
}

function onEnter() {
  if (!props.content) return
  clearTimer()
  delayTimer = setTimeout(() => {
    delayTimer = null
    show.value = true
  }, props.delay)
}

function onLeave() {
  clearTimer()
  show.value = false
}

watch(show, (v) => {
  if (v) updatePosition()
})
</script>

<style scoped>
.custom-tooltip-wrap {
  position: relative;
  display: inline-block;
  -webkit-app-region: no-drag;
}

.custom-tooltip-bubble {
  padding: 6px 12px;
  background: var(--bg-card);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 12px;
  white-space: nowrap;
  box-shadow: var(--shadow-dialog);
  border: 1px solid var(--border);
  pointer-events: none;
  z-index: 10000;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.12s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
