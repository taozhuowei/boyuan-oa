<template>
  <view class="directory-page oa-page">
    <view class="directory-hero oa-surface-hero">
      <view class="hero-copy">
        <text class="hero-kicker">通讯录导入</text>
        <text class="hero-title">先做预览校验，再决定导入范围，让财务和行政能稳住名册更新节奏</text>
        <text class="hero-subtitle">
          支持粘贴 CSV 风格数据：姓名,手机号,部门,岗位,邮箱。预览阶段会先校验手机号格式和重复记录。
        </text>
      </view>

      <view class="hero-metrics">
        <view class="hero-metric">
          <text class="metric-label">预览总数</text>
          <text class="metric-value">{{ previewResult?.totalCount ?? 0 }}</text>
          <text class="metric-note">先看质量，再决定实际导入</text>
        </view>
        <view class="hero-metric">
          <text class="metric-label">可导入</text>
          <text class="metric-value">{{ previewResult?.validCount ?? 0 }}</text>
          <text class="metric-note">仅有效记录可加入勾选名单</text>
        </view>
      </view>
    </view>

    <view class="directory-shell">
      <view class="oa-panel input-panel">
        <view class="section-head">
          <view>
            <text class="section-title">导入原始数据</text>
            <text class="section-note">
              {{ canApply ? '当前账号可执行导入' : '当前账号仅演示预览流程，正式导入需财务账号' }}
            </text>
          </view>
          <button class="ghost-button" @click="goBack">返回工作台</button>
        </view>

        <view class="tips-card">
          <text class="tips-title">示例格式</text>
          <text class="tips-text">张三,13800138001,综合管理部,行政专员,zhangsan@oa.com</text>
          <text class="tips-text">李四,13800138002,施工一部,班组长,lisi@oa.com</text>
        </view>

        <textarea
          v-model="rawContent"
          class="raw-textarea"
          placeholder="每行一条记录，字段以英文逗号分隔"
        />

        <view class="action-row">
          <button class="ghost-button" @click="fillExample">填充示例</button>
          <button class="primary-button" @click="handlePreview">生成预览</button>
        </view>
      </view>

      <view class="detail-column">
        <view class="oa-panel result-panel">
          <view class="section-head">
            <view>
              <text class="section-title">预览结果</text>
              <text class="section-note">点击有效记录可加入或移出导入名单</text>
            </view>
          </view>

          <view v-if="previewResult" class="summary-grid">
            <view class="summary-card">
              <text class="summary-label">有效</text>
              <text class="summary-value">{{ previewResult.validCount }}</text>
            </view>
            <view class="summary-card">
              <text class="summary-label">重复</text>
              <text class="summary-value">{{ previewResult.duplicateCount }}</text>
            </view>
            <view class="summary-card">
              <text class="summary-label">无效</text>
              <text class="summary-value">{{ previewResult.invalidCount }}</text>
            </view>
          </view>

          <view v-if="previewResult?.items.length" class="preview-list">
            <view
              v-for="item in previewResult.items"
              :key="`${item.rowIndex}-${item.phone}`"
              class="preview-card"
              :class="[
                `status-${item.status.toLowerCase()}`,
                { selected: selectedIndices.includes(item.rowIndex), disabled: item.status !== 'VALID' }
              ]"
              @click="toggleSelection(item.rowIndex, item.status)"
            >
              <view>
                <text class="preview-name">{{ item.name || `第 ${item.rowIndex + 1} 行` }}</text>
                <text class="preview-meta">{{ item.department || '未分配部门' }} · {{ item.phone || '缺少手机号' }}</text>
              </view>
              <view class="preview-side">
                <text class="preview-tag">{{ item.status }}</text>
                <text class="preview-message">{{ item.message }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-block">预览结果会显示在这里。</view>
        </view>

        <view class="oa-panel apply-panel">
          <view class="section-head">
            <view>
              <text class="section-title">导入动作</text>
              <text class="section-note">已选 {{ selectedIndices.length }} 条有效记录</text>
            </view>
          </view>

          <view class="apply-card">
            <text class="apply-text">
              {{ canApply ? '确认后将把选中记录提交到后端导入接口。' : '当前账号无法正式导入，可先完成预览与勾选。' }}
            </text>
            <button class="primary-button full" :disabled="!selectedIndices.length" @click="handleApply">
              提交导入
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '../../stores'
import {
  applyDirectoryImport,
  previewDirectoryImport,
  type DirectoryImportPreviewResult,
  type DirectoryImportRecord
} from '../../utils/org'

const exampleContent = [
  '张三,13800138001,综合管理部,行政专员,zhangsan@oa.com',
  '李四,13800138002,施工一部,班组长,lisi@oa.com',
  '李四,13800138002,施工一部,班组长,lisi.repeat@oa.com',
  '王五,12345,财务管理部,会计,wangwu@oa.com'
].join('\n')

const userStore = useUserStore()

const rawContent = ref('')
const previewResult = ref<DirectoryImportPreviewResult | null>(null)
const selectedIndices = ref<number[]>([])

const canApply = computed(() => userStore.userInfo?.role === 'finance')

function showToast(title: string, icon: 'success' | 'none' = 'none') {
  if (typeof uni === 'undefined') {
    return
  }

  uni.showToast({
    title,
    icon
  })
}

function parseRecords(): DirectoryImportRecord[] {
  return rawContent.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', phone = '', department = '', position = '', email = ''] = line
        .split(',')
        .map((item) => item.trim())

      return {
        name,
        phone,
        department,
        position,
        email
      }
    })
}

function fillExample() {
  rawContent.value = exampleContent
}

async function handlePreview() {
  const records = parseRecords()

  if (!records.length) {
    showToast('请先粘贴导入内容')
    return
  }

  try {
    const result = await previewDirectoryImport(records, userStore.token)
    previewResult.value = result
    selectedIndices.value = result.items
      .filter((item) => item.status === 'VALID')
      .map((item) => item.rowIndex)
  } catch {
    showToast('导入预览失败')
  }
}

function toggleSelection(index: number, status: string) {
  if (status !== 'VALID') {
    return
  }

  if (selectedIndices.value.includes(index)) {
    selectedIndices.value = selectedIndices.value.filter((item) => item !== index)
    return
  }

  selectedIndices.value = [...selectedIndices.value, index]
}

async function handleApply() {
  if (!selectedIndices.value.length) {
    showToast('请先选择有效记录')
    return
  }

  if (!canApply.value) {
    showToast('当前账号没有导入权限')
    return
  }

  try {
    const message = await applyDirectoryImport(selectedIndices.value, userStore.token)
    showToast(message, 'success')
  } catch {
    showToast('导入失败')
  }
}

function goBack() {
  if (typeof uni === 'undefined') {
    return
  }

  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.directory-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
}

.directory-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.7fr);
  gap: 20px;
  margin-bottom: 18px;
  padding: clamp(22px, 3vw, 30px);
}

.hero-copy,
.hero-metrics,
.detail-column,
.preview-list,
.summary-grid {
  display: grid;
  gap: 14px;
}

.hero-kicker,
.metric-label {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.74);
}

.hero-title {
  display: block;
  max-width: 18ch;
  font-family: var(--oa-font-display);
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.08;
  color: var(--oa-text-inverse);
}

.hero-subtitle,
.metric-note,
.section-note,
.tips-text,
.preview-meta,
.preview-message,
.apply-text {
  display: block;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 250, 243, 0.86);
}

.hero-metric {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 240, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.18);
}

.metric-value {
  display: block;
  margin: 10px 0 8px;
  font-family: var(--oa-font-display);
  font-size: 34px;
  color: var(--oa-text-inverse);
}

.directory-shell {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
}

.input-panel,
.result-panel,
.apply-panel {
  display: grid;
  gap: 16px;
}

.section-head,
.action-row,
.preview-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.section-title,
.tips-title,
.preview-name {
  font-family: var(--oa-font-display);
  color: var(--oa-text-primary);
}

.section-title {
  font-size: 18px;
}

.tips-card,
.summary-card,
.preview-card,
.apply-card {
  padding: 16px;
  border-radius: var(--oa-radius-lg);
  border: 1px solid var(--oa-border-strong);
  background: rgba(255, 248, 243, 0.82);
}

.tips-title {
  font-size: 14px;
  margin-bottom: 8px;
}

.tips-text {
  color: var(--oa-text-secondary);
}

.raw-textarea {
  width: 100%;
  min-height: 220px;
  padding: 16px;
  border-radius: var(--oa-radius-lg);
  border: 1px solid var(--oa-border-strong);
  background: rgba(255, 250, 246, 0.82);
  color: var(--oa-text-primary);
  font-size: 14px;
}

.ghost-button,
.primary-button {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
}

.ghost-button {
  background: rgba(255, 247, 240, 0.72);
  border: 1px solid rgba(151, 167, 186, 0.24);
  color: var(--oa-text-primary);
}

.primary-button {
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  box-shadow: var(--oa-shadow-accent);
}

.primary-button[disabled] {
  opacity: 0.45;
  box-shadow: none;
}

.primary-button.full {
  width: 100%;
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.summary-value {
  display: block;
  margin-top: 10px;
  font-family: var(--oa-font-display);
  font-size: 28px;
  color: var(--oa-text-primary);
}

.preview-card {
  align-items: center;
}

.preview-card.selected {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
}

.preview-card.disabled {
  opacity: 0.78;
}

.preview-name {
  display: block;
  font-size: 15px;
}

.preview-side {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.preview-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(93, 77, 68, 0.08);
  color: var(--oa-text-secondary);
}

.status-valid .preview-tag {
  background: rgba(96, 139, 104, 0.14);
  color: #4b6c52;
}

.status-duplicate .preview-tag {
  background: rgba(196, 152, 83, 0.16);
  color: #8d642c;
}

.status-invalid .preview-tag {
  background: rgba(185, 93, 83, 0.16);
  color: #954740;
}

.apply-text {
  color: var(--oa-text-secondary);
}

.empty-block {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 250, 246, 0.76);
  border: 1px dashed rgba(162, 177, 196, 0.36);
  color: var(--oa-text-secondary);
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .directory-hero,
  .directory-shell,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .directory-page {
    padding: 16px;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .action-row,
  .preview-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-side {
    justify-items: start;
  }
}
</style>
