<template>
  <div class="help">
    <header class="help-header">
      <button type="button" class="back-btn" aria-label="返回" @click="router.push('/')">
        <span class="back-arrow">←</span>
      </button>
      <h1 class="help-title">帮助</h1>
    </header>
    <main class="help-main">
      <div class="help-content">
        <section class="help-hero">
          <div class="hero-icon" aria-hidden="true">
            <AppLogo />
          </div>
          <h2 class="hero-title">IMGNote</h2>
          <p class="hero-tagline">将文字刻进像素的笔记本</p>
        </section>

        <section class="help-section">
          <h3 class="section-head">
            <span class="section-dot"></span>
            应用介绍
          </h3>
          <p class="section-text">
            IMGNote
            将<strong>文字信息刻进图像的像素</strong>中：通过修改图像像素的显示数据来承载信息内容，人眼无法分辨，在本应用中则可还原为可编辑文字。每一张图片即一本独立笔记本，适合把笔记与配图合一保存。
          </p>
        </section>

        <section class="help-section write-principle">
          <h3 class="section-head">
            <span class="section-dot"></span>
            写入原理
          </h3>
          <p class="section-text principle-desc">
            通过像素点颜色的细微变化，将信息编码后写入图片的像素中。
          </p>
          <div class="principle-anim" aria-hidden="true">
            <div class="principle-flow">
              <span class="principle-label principle-label--write">“像素笔记”</span>
              <div class="principle-stream principle-stream--write" aria-hidden="true">
                <span v-for="d in 5" :key="'w' + d" class="stream-dot" :style="{ '--d': d - 1 }" />
              </div>
              <div class="principle-pixels" aria-hidden="true">
                <span v-for="n in 25" :key="n" class="pixel" :style="{ '--i': n - 1 }" />
              </div>
              <div class="principle-stream principle-stream--read" aria-hidden="true">
                <span v-for="d in 5" :key="'r' + d" class="stream-dot" :style="{ '--d': d - 1 }" />
              </div>
              <span class="principle-label principle-label--read">“像素笔记”</span>
            </div>
          </div>
        </section>

        <section class="help-section highlight">
          <h3 class="section-head">
            <span class="section-dot"></span>
            容量与性能
          </h3>
          <p class="section-text">
            <strong>图片尺寸越大，能存储的信息越多</strong
            >；但像素越多，<strong>读取与保存时的解析速度会越慢</strong>。建议根据笔记长度选择合适的图片尺寸，不必一味追求大图。
          </p>
        </section>

        <section class="help-section caution">
          <h3 class="section-head">
            <span class="section-dot caution-dot"></span>
            注意事项
          </h3>
          <ul class="notice-list">
            <li>
              <strong>数据信息被存储在图像像素中</strong
              >，请保留原始图像文件，勿删除或替换数据目录里的图片。
            </li>
            <li>
              <strong>请勿对笔记本图片裁剪、缩放、压缩或重新保存</strong
              >（如用其他软件另存、导出为其他格式等），否则写入的数据可能<strong>无法恢复</strong>。
            </li>
            <li>建议定期使用「导出笔记」或「数据备份」备份为 .IMGNote 文件，并妥善保留该文件。</li>
          </ul>
        </section>

        <section class="help-section faq">
          <h3 class="section-head">
            <span class="section-dot"></span>
            常见问题
          </h3>
          <dl class="faq-list">
            <div class="faq-item">
              <dt class="faq-q">为什么打开/保存时有点慢？</dt>
              <dd class="faq-a">
                信息需要从像素中解析或写回，图片越大、内容越多，耗时越长。属正常现象。
              </dd>
            </div>
            <div class="faq-item">
              <dt class="faq-q">可以用手机拍的照片当笔记本吗？</dt>
              <dd class="faq-a">
                可以。但高分辨率照片会带来较大文件与较慢解析，若只记少量文字，可先用电脑将图片缩小后再导入。
              </dd>
            </div>
            <div class="faq-item">
              <dt class="faq-q">图片分享给别人后，对方能看到笔记吗？</dt>
              <dd class="faq-a">
                对方看到的是普通图片；只有分享原图（未被压缩、裁剪、转换等）并且在本应用中打开才能还原文字。
              </dd>
            </div>
            <div class="faq-item">
              <dt class="faq-q">导出的图片包含笔记本的全部信息吗？</dt>
              <dd class="faq-a">
                导出的图片只包含笔记本内部的文字信息，不包含笔记本的名称、分类信息。只有「导出笔记」或「数据备份」导出的
                .IMGNote 文件才包含笔记本的全部信息。
              </dd>
            </div>
            <div class="faq-item">
              <dt class="faq-q">误删了分类或笔记本怎么办？</dt>
              <dd class="faq-a">
                应用内删除不可恢复。若有「导出笔记」导出的 .IMGNote
                备份文件，可通过「导入笔记」找回对应图片与数据。
              </dd>
            </div>
            <div class="faq-item">
              <dt class="faq-q">加密后图片其他人也需要密码吗？</dt>
              <dd class="faq-a">
                需要，密码信息会写入图片的像素中，图片分享给其他人后打开也需要密码解锁。
              </dd>
            </div>
          </dl>
        </section>

        <section class="help-section">
          <h3 class="section-head">
            <span class="section-dot"></span>
            使用建议
          </h3>
          <p class="section-text">
            导入时可给笔记本命名，用分类管理多本笔记。编辑后请及时点击「保存」，数据会写回对应图片的像素中。
          </p>
        </section>

        <footer class="help-footer">
          <p class="footer-text">感谢使用 IMGNote</p>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'

const router = useRouter()
</script>

<style scoped>
.help {
  user-select: none;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  min-height: 0;
}
.help-header {
  user-select: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: clamp(10px, 2vw, 14px) clamp(16px, 4vw, 24px);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}
.back-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.back-arrow {
  font-size: 18px;
}
.help-title {
  font-size: clamp(16px, 2.5vw, 18px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.help-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px) clamp(24px, 5vw, 56px);
}
.help-content {
  max-width: 560px;
  margin: 0 auto;
}
.help-hero {
  user-select: none;
  text-align: center;
  padding: clamp(24px, 5vw, 40px) 0 clamp(28px, 5vw, 44px);
  margin-bottom: clamp(20px, 4vw, 32px);
  border-bottom: 1px solid var(--border);
}
.hero-icon {
  font-size: clamp(36px, 8vw, 48px);
  color: var(--accent);
  opacity: 0.92;
  margin-bottom: 12px;
  line-height: 1;
}
.hero-title {
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.hero-tagline {
  font-size: clamp(14px, 2vw, 16px);
  color: var(--text-tertiary);
  margin: 0;
  letter-spacing: 0.02em;
}
.help-section {
  margin-bottom: clamp(22px, 4vw, 32px);
}
/* 写入原理 — 隐写过程动画 */
.write-principle {
  padding-bottom: clamp(20px, 4vw, 28px);
}
.principle-desc {
  margin-bottom: clamp(16px, 3vw, 22px);
}
.principle-anim {
  user-select: none;
  padding: clamp(24px, 5vw, 36px);
  background: linear-gradient(160deg, var(--bg-page) 0%, var(--bg-muted) 100%);
  border-radius: 16px;
}
.principle-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: clamp(12px, 2.5vw, 18px);
}
.principle-label {
  font-size: clamp(15px, 2.2vw, 17px);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 4em;
  text-align: center;
  opacity: 0;
  pointer-events: none;
}
.principle-label--write {
  animation: principle-write-label 7s ease-in-out infinite;
}
.principle-label--read {
  animation: principle-read-label 7s ease-in-out infinite;
}
/* 数据流：文字 → 像素（写入） */
.principle-stream {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 32px;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
}
.principle-stream--write {
  animation: principle-stream-write 7s ease-in-out infinite;
}
.principle-stream--read {
  animation: principle-stream-read 7s ease-in-out infinite;
}
.stream-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  animation: principle-dot-write 7s ease-in-out infinite;
  animation-delay: calc(var(--d) * 0.08s);
}
.principle-stream--read .stream-dot {
  animation-name: principle-dot-read;
}
/* 像素块：承载隐写数据的“图片” */
.principle-pixels {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  width: clamp(76px, 14vw, 100px);
  height: clamp(76px, 14vw, 100px);
  border-radius: 8px;
  overflow: hidden;
}
.pixel {
  border-radius: 3px;
  background: var(--bg-muted);
  opacity: 0.5;
  animation: principle-pixel 7s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.03s);
  transition:
    opacity 0.35s ease,
    background 0.35s ease;
}
/* 写入：先显示左侧文字 → 小圆点从左向右移动 → 移动完后文字消失 */
@keyframes principle-write-label {
  0%,
  18% {
    opacity: 1;
  }
  28%,
  88% {
    opacity: 0;
  }
  94%,
  100% {
    opacity: 1;
  }
}
@keyframes principle-stream-write {
  0%,
  12% {
    opacity: 0;
  }
  16%,
  32% {
    opacity: 1;
  }
  36%,
  100% {
    opacity: 0;
  }
}
@keyframes principle-dot-write {
  0%,
  14% {
    opacity: 0;
    transform: translateX(-10px);
  }
  20% {
    opacity: 0.9;
    transform: translateX(0);
  }
  28% {
    opacity: 0;
    transform: translateX(10px);
  }
  32%,
  100% {
    opacity: 0;
    transform: translateX(10px);
  }
}
/* 读出：小圆点从左向右移动 → 移动完后右侧文字才出现 */
@keyframes principle-read-label {
  0%,
  72% {
    opacity: 0;
  }
  78%,
  88% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes principle-stream-read {
  0%,
  54% {
    opacity: 0;
  }
  58%,
  74% {
    opacity: 1;
  }
  78%,
  100% {
    opacity: 0;
  }
}
@keyframes principle-dot-read {
  0%,
  56% {
    opacity: 0;
    transform: translateX(-10px);
  }
  62% {
    opacity: 0.9;
    transform: translateX(0);
  }
  70% {
    opacity: 0;
    transform: translateX(10px);
  }
  74%,
  100% {
    opacity: 0;
    transform: translateX(10px);
  }
}
/* 像素：先像普通图，再被“写入”数据，再保持，再“读出”后恢复 */
@keyframes principle-pixel {
  0%,
  8% {
    opacity: 0.5;
    background: var(--bg-muted);
  }
  20% {
    opacity: 1;
    background: var(--accent-subtle);
  }
  45%,
  55% {
    opacity: 1;
    background: var(--accent-subtle);
  }
  68% {
    opacity: 0.5;
    background: var(--bg-muted);
  }
  100% {
    opacity: 0.5;
    background: var(--bg-muted);
  }
}

.help-section.highlight {
  padding: clamp(16px, 3vw, 22px);
  background: linear-gradient(135deg, var(--accent-subtle) 0%, transparent 60%);
  border-radius: 12px;
  border: 1px solid var(--border);
}
.help-section.caution {
  padding: clamp(16px, 3vw, 22px);
  background: var(--bg-muted);
  border-radius: 12px;
  border: 1px solid var(--border);
}
.help-section.faq .section-head {
  margin-bottom: 14px;
}
.section-head {
  user-select: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: clamp(14px, 2vw, 15px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}
.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}
.section-dot.caution-dot {
  background: var(--warning);
}
.section-text {
  font-size: clamp(13px, 1.8vw, 14px);
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}
.section-text strong {
  color: var(--text-primary);
  font-weight: 600;
}
.notice-list {
  margin: 0;
  padding-left: 20px;
  font-size: clamp(13px, 1.8vw, 14px);
  color: var(--text-secondary);
  line-height: 1.75;
}
.notice-list li {
  margin-bottom: 10px;
}
.notice-list li:last-child {
  margin-bottom: 0;
}
.notice-list strong {
  color: var(--text-primary);
  font-weight: 600;
}
.faq-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.faq-item {
  margin-bottom: clamp(14px, 3vw, 20px);
  padding-bottom: clamp(14px, 3vw, 20px);
  border-bottom: 1px solid var(--border);
}
.faq-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.faq-q {
  font-size: clamp(13px, 1.8vw, 14px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}
.faq-a {
  font-size: clamp(13px, 1.8vw, 14px);
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
  padding-left: 0;
}
.help-footer {
  user-select: none;
  margin-top: clamp(32px, 6vw, 48px);
  padding-top: clamp(20px, 4vw, 28px);
  border-top: 1px solid var(--border);
  text-align: center;
}
.footer-text {
  font-size: clamp(12px, 1.5vw, 13px);
  color: var(--text-tertiary);
  margin: 0;
}
</style>
