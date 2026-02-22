<template>
  <Teleport to="body">
    <div v-if="visible" class="enc-mask" role="dialog" aria-modal="true" @click="onMaskClick">
      <div class="enc-card" @click.stop>
        <div class="enc-head">
          <h3 class="enc-title">{{ title }}</h3>
          <button type="button" class="enc-close" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="enc-body">
          <p class="enc-desc">忘记密码将无法打开该笔记本</p>

          <div v-if="encrypted" class="enc-field">
            <label>原密码</label>
            <input
              ref="inputRef"
              v-model="currentPwd"
              type="password"
              class="enc-input"
              placeholder="请输入原密码"
            />
          </div>
          <div v-else class="enc-field">
            <label>设置密码</label>
            <input
              ref="inputRef"
              v-model="newPwd"
              type="password"
              class="enc-input"
              placeholder="请输入密码"
            />
          </div>

          <div v-if="encrypted" class="enc-field">
            <label>新密码</label>
            <input v-model="newPwd" type="password" class="enc-input" placeholder="请输入新密码" />
          </div>
          <div class="enc-field">
            <label>{{ encrypted ? '确认新密码' : '确认密码' }}</label>
            <input v-model="newPwd2" type="password" class="enc-input" placeholder="再次输入密码" />
          </div>

          <div v-if="error" class="enc-error">{{ error }}</div>
        </div>

        <div class="enc-actions">
          <button type="button" class="btn btn-ghost" @click="close">取消</button>
          <template v-if="!encrypted">
            <button type="button" class="btn btn-primary" @click="enableWeak">启用加密</button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-primary" @click="changePassword">修改密码</button>
            <button type="button" class="btn btn-danger" @click="disableEncryption">
              取消加密
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  encrypted: { type: Boolean, default: false },
  presetCurrentPassword: { type: String, default: '' },
  error: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'update:error', 'enable', 'change', 'disable'])

const currentPwd = ref('')
const newPwd = ref('')
const newPwd2 = ref('')
const inputRef = ref(null)

function hasSpecialPasswordChar(pwd) {
  const p = pwd || ''
  if (!p) return false
  if (/[ \t\r\n]/.test(p)) return true
  if (/[\u0000-\u001F]/.test(p)) return true
  if (/[\uD800-\uDBFF]/.test(p)) return true
  return false
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    emit('update:error', '')
    currentPwd.value = props.presetCurrentPassword || ''
    newPwd.value = ''
    newPwd2.value = ''
    nextTick(() => inputRef.value?.focus?.())
  }
)

const title = computed(() => (props.encrypted ? '加密设置' : '为笔记本启用加密'))

function close() {
  emit('update:visible', false)
  emit('update:error', '')
}

function onMaskClick(e) {
  if (e.target === e.currentTarget) close()
}

function validateNewPassword() {
  const p1 = (newPwd.value || '').trim()
  const p2 = (newPwd2.value || '').trim()
  if (!p1) return '请输入新密码'
  if (p1.length < 2) return '密码太短'
  if (hasSpecialPasswordChar(p1)) return '密码存在特殊字符（空格、Tab、表情等），请重新设置'
  if (p1 !== p2) return '两次输入的密码不一致'
  return ''
}

function enableWeak() {
  const msg = validateNewPassword()
  if (msg) {
    emit('update:error', msg)
    return
  }
  emit('update:error', '')
  emit('enable', (newPwd.value || '').trim())
}

function changePassword() {
  const cur = (currentPwd.value || '').trim()
  if (!cur) {
    emit('update:error', '请输入原密码')
    return
  }
  if (hasSpecialPasswordChar(cur)) {
    emit('update:error', '原密码存在特殊字符，请重新输入')
    return
  }
  const msg = validateNewPassword()
  if (msg) {
    emit('update:error', msg)
    return
  }
  emit('update:error', '')
  emit('change', { currentPassword: cur, newPassword: (newPwd.value || '').trim() })
}

function disableEncryption() {
  const cur = (currentPwd.value || '').trim()
  if (!cur) {
    emit('update:error', '请输入原密码')
    return
  }
  if (hasSpecialPasswordChar(cur)) {
    emit('update:error', '当前密码存在特殊字符，请重新输入')
    return
  }
  emit('update:error', '')
  emit('disable', { currentPassword: cur })
}
</script>

<style scoped>
.enc-mask {
  position: fixed;
  inset: 0;
  background: var(--overlay-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
}

.enc-card {
  width: min(520px, 92vw);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-dialog);
}

.enc-head {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.enc-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.enc-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
}

.enc-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.enc-body {
  user-select: none;
  padding: 16px 18px 4px;
}

.enc-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

.enc-field {
  margin-bottom: 12px;
}

.enc-field label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.enc-input {
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

.enc-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.enc-error {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--danger-hover-bg);
  color: var(--danger);
  font-size: 12px;
}

.enc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px 18px;
}

.btn {
  user-select: none;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
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

.btn-danger {
  background: var(--danger-hover-bg);
  color: var(--danger);
}

.btn-danger:hover {
  background: var(--danger-hover-bg);
}
</style>
