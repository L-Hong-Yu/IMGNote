<template>
  <Teleport to="body">
    <div v-if="visible" class="pwd-mask" role="dialog" aria-modal="true">
      <div class="pwd-card" @click.stop>
        <h3 class="pwd-title">{{ title }}</h3>
        <p v-if="message" class="pwd-message">{{ message }}</p>
        <div class="pwd-input-wrap">
          <input
            ref="inputRef"
            v-model="pwd"
            :type="show ? 'text' : 'password'"
            class="pwd-input"
            placeholder="请输入密码"
            @keydown.enter.prevent="onConfirm"
          />
          <button
            type="button"
            class="pwd-toggle"
            :aria-label="show ? '隐藏密码' : '显示密码'"
            @click="show = !show"
          >
            {{ show ? '🙈' : '👁️' }}
          </button>
        </div>
        <div v-if="displayError" class="pwd-error">{{ displayError }}</div>
        <div class="pwd-actions">
          <button type="button" class="btn btn-ghost" @click="onCancel">{{ cancelText }}</button>
          <button type="button" class="btn btn-primary" @click="onConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '请输入密码' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  error: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])
const pwd = ref('')
const inputRef = ref(null)
const show = ref(false)
const localError = ref('')

const displayError = computed(() => props.error || localError.value)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      pwd.value = ''
      localError.value = ''
      nextTick(() => inputRef.value?.focus?.())
    }
  }
)

function close() {
  emit('update:visible', false)
}

function onCancel() {
  close()
  emit('cancel')
}

function onConfirm() {
  const p = pwd.value || ''
  if (/[ \t\r\n]/.test(p) || /[\u0000-\u001F]/.test(p) || /[\uD800-\uDBFF]/.test(p)) {
    localError.value = '密码存在特殊字符（空格、Tab、表情等），请重新设置'
    return
  }
  localError.value = ''
  emit('confirm', pwd.value || '')
}

function onMaskClick(e) {
  if (e.target === e.currentTarget) onCancel()
}
</script>

<style scoped>
.pwd-mask {
  user-select: none;
  position: fixed;
  inset: 0;
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
}

.pwd-card {
  width: min(420px, 92vw);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 22px 18px;
  box-shadow: var(--shadow-dialog);
}

.pwd-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.pwd-message {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

.pwd-input-wrap {
  position: relative;
}

.pwd-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-page);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.pwd-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.pwd-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.pwd-error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--danger);
}

.pwd-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  user-select: none;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
