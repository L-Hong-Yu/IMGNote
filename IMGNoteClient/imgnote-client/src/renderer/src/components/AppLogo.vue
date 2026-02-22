<template>
  <svg
    class="app-logo"
    :class="className"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="app-logo-grad"
        x1="0"
        x2="1"
        y1="0"
        y2="0"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0" stop-color="currentColor" stop-opacity="0.36" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
      <linearGradient
        id="app-logo-shadow-grad"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0" stop-color="currentColor" stop-opacity="0.18" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <!-- 右侧偏移的棱形阴影 -->
    <path
      fill="url(#app-logo-shadow-grad)"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-opacity="0.45"
      d="M14.7 3.4 L22 12 L14.7 20.6 L7.2 12 Z"
    />
    <!-- 主棱形 -->
    <path
      fill="url(#app-logo-grad)"
      stroke="currentColor"
      stroke-width="1.85"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M11.4 3.0 L19.2 12 L11.4 21.0 L3.6 12 Z"
    />
  </svg>
</template>

<script setup>
defineProps({
  /** 可选，用于外部控制尺寸或颜色 */
  className: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.app-logo {
  display: block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
