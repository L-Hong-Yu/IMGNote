<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="confirm-mask"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      @click="onMaskClick"
    >
      <div class="confirm-dialog" @click.stop>
        <h3 id="confirm-title" class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-ghost" @click="onCancel">
            {{ cancelText }}
          </button>
          <button
            type="button"
            :class="['btn', confirmDanger ? 'btn-danger' : 'btn-primary']"
            @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmDanger: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

function onConfirm() {
  emit('update:visible', false)
  emit('confirm')
}

function onCancel() {
  emit('update:visible', false)
  emit('cancel')
}

function onMaskClick(e) {
  if (e.target === e.currentTarget) onCancel()
}
</script>

<style scoped>
.confirm-mask {
  user-select: none;
  position: fixed;
  inset: 0;
  background: var(--overlay-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  transition: background 0.25s ease;
}

.confirm-dialog {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 24px 28px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: var(--shadow-dialog);
  border: 1px solid var(--border);
  transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-danger {
  background: var(--danger, #c53030);
  color: #fff;
}

.btn-danger:hover {
  background: var(--danger-hover, #9b2c2c);
}
</style>
