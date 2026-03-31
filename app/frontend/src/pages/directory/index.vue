<!-- 通讯录导入页面：CSV 数据预览校验与批量导入 -->
<template>
  <view class="page oa-page">
    <view class="header-card">
      <view class="header-left">
        <view class="header-icon-wrap">
          <text class="header-icon">◈</text>
        </view>
        <view>
          <text class="header-title">通讯录导入</text>
          <text class="header-sub">预览校验后再导入 · 已选 {{ selectedIndices.length }} 条</text>
        </view>
      </view>
      <button class="btn-ghost" @click="goBack">← 返回</button>
    </view>

    <view class="shell">
      <view class="panel input-panel">
        <view class="panel-head">
          <text class="panel-title">导入数据</text>
          <text class="panel-hint">{{ canApply ? '当前账号可执行导入' : '仅演示预览，正式导入需财务账号' }}</text>
        </view>

        <view class="tips-card">
          <view class="tips-head">
            <text class="label-dot blue" />
            <text class="tips-title">示例格式</text>
          </view>
          <text class="tips-line">张三,13800138001,综合管理部,行政专员,zhangsan@oa.com</text>
          <text class="tips-line">李四,13800138002,施工一部,班组长,lisi@oa.com</text>
        </view>

        <textarea
          v-model="rawContent"
          class="raw-textarea"
          placeholder="每行一条记录，字段以英文逗号分隔"
        />

        <view class="action-row">
          <button class="btn-ghost" @click="fillExample">填充示例</button>
          <button class="btn-primary" @click="handlePreview">生成预览</button>
        </view>
      </view>

      <view class="detail-column">
        <view class="panel result-panel">
          <view class="panel-head">
            <text class="panel-title">预览结果</text>
            <text class="panel-hint">点击有效记录可加入或移出导入名单</text>
          </view>

          <view v-if="previewResult" class="summary-grid">
            <view class="summary-card success">
              <text class="summary-num">{{ previewResult.validCount }}</text>
              <text class="summary-label">有效</text>
            </view>
            <view class="summary-card warning">
              <text class="summary-num">{{ previewResult.duplicateCount }}</text>
              <text class="summary-label">重复</text>
            </view>
            <view class="summary-card danger">
              <text class="summary-num">{{ previewResult.invalidCount }}</text>
              <text class="summary-label">无效</text>
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
              <view class="preview-main">
                <text class="preview-name">{{ item.name || `第 ${item.rowIndex + 1} 行` }}</text>
                <text class="preview-meta">{{ item.department || '未分配部门' }} · {{ item.phone || '缺少手机号' }}</text>
              </view>
              <view class="preview-side">
                <text class="preview-tag">{{ item.status }}</text>
                <text class="preview-msg">{{ item.message }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty">
            <text class="empty-icon">◈</text>
            <text class="empty-text">预览结果会显示在这里</text>
          </view>
        </view>

        <view class="panel apply-panel">
          <view class="panel-head">
            <text class="panel-title">导入动作</text>
            <text class="panel-hint">已选 {{ selectedIndices.length }} 条有效记录</text>
          </view>

          <view class="apply-card">
            <text class="apply-text">
              {{ canApply ? '确认后将把选中记录提交到后端导入接口。' : '当前账号无法正式导入，可先完成预览与勾选。' }}
            </text>
            <button class="btn-primary full" :disabled="!selectedIndices.length" @click="handleApply">
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
  uni.showToast({ title, icon })
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
      return { name, phone, department, position, email }
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
.page {
  min-height: 100vh;
  padding: clamp(16px, 2.4vw, 28px);
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: clamp(16px, 2.2vw, 24px);
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--oa-accent-soft);
}

.header-icon {
  font-size: 20px;
  color: var(--oa-accent);
}

.header-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.header-sub {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--oa-text-muted);
}

.btn-ghost {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(125, 61, 35, 0.06);
  color: var(--oa-text-secondary);
  font-size: 13px;
}

.btn-primary {
  min-height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  font-size: 13px;
  box-shadow: var(--oa-shadow-accent);
}

.btn-primary[disabled] {
  opacity: 0.45;
  box-shadow: none;
}

.btn-primary.full {
  width: 100%;
}

.shell {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
}

.panel {
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
  padding: clamp(16px, 2vw, 22px);
}

.panel-head {
  margin-bottom: 14px;
}

.panel-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.panel-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.detail-column {
  display: grid;
  gap: 18px;
}

.tips-card {
  padding: 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.tips-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tips-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.tips-line {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
  line-height: 1.8;
}

.raw-textarea {
  width: 100%;
  min-height: 200px;
  padding: 14px;
  border-radius: var(--oa-radius-md);
  border: 1px solid var(--oa-border);
  background: var(--oa-surface-soft);
  color: var(--oa-text-primary);
  font-size: 13px;
}

.action-row {
  display: flex;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card {
  padding: 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
  text-align: center;
}

.summary-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.summary-label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.summary-card.success .summary-num {
  color: #4b6c52;
}

.summary-card.warning .summary-num {
  color: #8d642c;
}

.summary-card.danger .summary-num {
  color: #954740;
}

.preview-list {
  display: grid;
  gap: 10px;
}

.preview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.preview-card.selected {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
  box-shadow: 0 8px 18px rgba(121, 58, 27, 0.08);
}

.preview-card.disabled {
  opacity: 0.78;
}

.preview-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.preview-meta {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.preview-side {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.preview-tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(93, 77, 68, 0.08);
  color: var(--oa-text-secondary);
}

.status-valid .preview-tag {
  background: var(--oa-success-soft);
  color: #4b6c52;
}

.status-duplicate .preview-tag {
  background: var(--oa-warning-soft);
  color: #8d642c;
}

.status-invalid .preview-tag {
  background: var(--oa-danger-soft);
  color: #954740;
}

.preview-msg {
  font-size: 11px;
  color: var(--oa-text-muted);
}

.apply-card {
  padding: 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.apply-text {
  display: block;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--oa-text-secondary);
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--oa-accent);
}

.label-dot.blue {
  background: #4a6fa5;
}

.empty {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 32px 18px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px dashed var(--oa-border-strong);
}

.empty-icon {
  font-size: 28px;
  color: var(--oa-text-muted);
}

.empty-text {
  font-size: 13px;
  color: var(--oa-text-muted);
}

@media (max-width: 1100px) {
  .shell,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page {
    padding: 14px;
  }

  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-side {
    justify-items: start;
    width: 100%;
  }
}
</style>
