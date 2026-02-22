;(function () {
  try {
    const t = localStorage.getItem('imgnote-theme')
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t)
  } catch (_) {}
})()

import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
