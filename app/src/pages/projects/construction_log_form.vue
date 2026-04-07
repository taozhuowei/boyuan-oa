<template>
  <AppShell title="填写施工日志">
    <view class="page-content">
      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <!-- #ifdef H5 -->
          <ArrowLeftOutlined class="back-icon" @click="goBack" />
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <text class="back-icon" @click="goBack">←</text>
          <!-- #endif -->
          <text class="page-title">填写施工日志</text>
        </view>
      </view>

      <!-- 表单内容 -->
      <view class="form-content">
        <!-- 项目选择 -->
        <view class="form-item">
          <label>所属项目 <text class="required">*</text></label>
          <component
            :is="Select"
            v-if="Select"
            v-model="form.projectId"
            :options="projectOptions"
            placeholder="请选择项目"
            style="width: 100%"
          />
          <view v-else class="fallback-select">
            <picker mode="selector" :range="projectPickerRange" :value="projectPickerIndex" @change="onProjectChange">
              <view class="picker-value">{{ selectedProjectName || '请选择项目' }}</view>
            </picker>
          </view>
        </view>

        <!-- 日志日期 -->
        <view class="form-item">
          <label>日志日期 <text class="required">*</text></label>
          <component
            :is="DatePicker"
            v-if="DatePicker"
            v-model="form.logDate"
            placeholder="请选择日期"
            style="width: 100%"
          />
          <view v-else class="fallback-date-picker">
            <picker mode="date" :value="form.logDate" @change="onDateChange">
              <view class="picker-value">{{ form.logDate || '请选择日期' }}</view>
            </picker>
          </view>
        </view>

        <!-- 工作事项 -->
        <view class="form-item work-items-section">
          <label>工作事项 <text class="required">*</text></label>

          <!-- TOP: 单项输入表单 -->
          <view class="work-item-input-form">
            <view class="work-item-input-row">
              <view class="work-input-field">
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="workItemForm.workTarget"
                  placeholder="工作对象"
                />
                <input
                  v-else
                  v-model="workItemForm.workTarget"
                  class="fallback-input"
                  placeholder="工作对象"
                />
              </view>
              <view class="work-input-field narrow">
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="workItemForm.quantity"
                  type="number"
                  placeholder="数量"
                />
                <input
                  v-else
                  v-model="workItemForm.quantity"
                  type="number"
                  class="fallback-input"
                  placeholder="数量"
                />
              </view>
              <view class="work-input-field narrow">
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="workItemForm.unit"
                  placeholder="单位"
                />
                <input
                  v-else
                  v-model="workItemForm.unit"
                  class="fallback-input"
                  placeholder="单位"
                />
              </view>
              <component
                :is="Button"
                v-if="Button"
                type="primary"
                size="small"
                @click="saveWorkItem"
              >
                {{ editingIndex !== null ? '保存' : '添加' }}
              </component>
              <view v-else class="add-btn" @click="saveWorkItem">
                {{ editingIndex !== null ? '保存' : '添加' }}
              </view>
            </view>
          </view>

          <!-- BOTTOM: 只读预览列表 -->
          <view class="work-items-preview">
            <view v-if="form.workItems.length === 0" class="work-items-empty">
              暂未添加工作项
            </view>
            <view
              v-for="(item, index) in form.workItems"
              :key="index"
              class="work-item-row"
              :class="{ editing: editingIndex === index }"
            >
              <view class="work-item-content">
                <text class="work-item-text">{{ item.workTarget }} + {{ item.quantity }}{{ item.unit }}</text>
              </view>
              <view class="work-item-actions">
                <component
                  :is="Button"
                  v-if="Button"
                  type="link"
                  size="small"
                  @click="editWorkItem(index)"
                >
                  编辑
                </component>
                <text
                  v-else
                  class="action-link"
                  @click="editWorkItem(index)"
                >
                  编辑
                </text>
                <component
                  :is="Button"
                  v-if="Button"
                  type="link"
                  danger
                  size="small"
                  @click="removeWorkItem(index)"
                >
                  删除
                </component>
                <text
                  v-else
                  class="action-link delete"
                  @click="removeWorkItem(index)"
                >
                  删除
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 工作内容说明 -->
        <view class="form-item">
          <label>工作内容说明</label>
          <component
            :is="Input"
            v-if="Input"
            v-model="form.workContent"
            type="textarea"
            :rows="4"
            :maxlength="1000"
            placeholder="请描述今日工作的详细内容（选填，最多1000字）"
          />
          <textarea
            v-else
            v-model="form.workContent"
            class="fallback-textarea"
            rows="4"
            maxlength="1000"
            placeholder="请描述今日工作的详细内容（选填，最多1000字）"
          />
          <text class="char-count">{{ form.workContent.length }}/1000</text>
        </view>

        <!-- 现场照片 -->
        <view class="form-item">
          <label>现场照片（最多5张）</label>
          <view class="photo-upload">
            <view
              v-for="(photo, index) in photoList"
              :key="index"
              class="photo-item"
            >
              <image :src="photo.url" class="photo-image" mode="aspectFill" />
              <view class="photo-delete" @click="removePhoto(index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view v-if="photoList.length < 5" class="photo-add" @click="choosePhoto">
              <text class="add-icon">+</text>
              <text class="add-text">添加照片</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部提交按钮 -->
      <view class="form-footer">
        <component
          :is="Button"
          v-if="Button"
          type="primary"
          size="large"
          block
          :loading="submitting"
          @click="submitForm"
        >
          提交日志
        </component>
        <view v-else class="submit-btn" :class="{ disabled: submitting }" @click="submitForm">
          {{ submitting ? '提交中...' : '提交日志' }}
        </view>
      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { http } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

/* #ifdef H5 */
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
/* #endif */

// 异步加载平台适配组件
const { Button, Input, Select, DatePicker } = useComponent(['Button', 'Input', 'Select', 'DatePicker'])

// 项目列表
const projectList = ref<Array<{ id: number; name: string }>>([])
const projectOptions = computed(() => {
  return projectList.value.map(p => ({ label: p.name, value: p.id }))
})

// 小程序端picker数据
const projectPickerRange = computed(() => {
  return projectList.value.map(p => p.name)
})
const projectPickerIndex = computed(() => {
  const index = projectList.value.findIndex(p => p.id === form.value.projectId)
  return index >= 0 ? index : 0
})
const selectedProjectName = computed(() => {
  const project = projectList.value.find(p => p.id === form.value.projectId)
  return project?.name || ''
})

// 表单数据
const form = ref({
  projectId: undefined as number | undefined,
  logDate: getTodayString(),
  workItems: [] as Array<{ workTarget: string; quantity: string; unit: string }>,
  workContent: ''
})

// 工作项输入表单
const workItemForm = ref({
  workTarget: '',
  quantity: '',
  unit: ''
})

// 正在编辑的索引
const editingIndex = ref<number | null>(null)

// 照片列表
const photoList = ref<Array<{ url: string; fileId?: string }>>([])

// 提交状态
const submitting = ref(false)

// 获取今日日期字符串
function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 小程序端项目选择
function onProjectChange(e: any) {
  const index = e.detail.value
  if (projectList.value[index]) {
    form.value.projectId = projectList.value[index].id
  }
}

// 小程序端日期选择
function onDateChange(e: any) {
  form.value.logDate = e.detail.value
}

// 保存工作项（新增或更新）
function saveWorkItem() {
  // 表单验证
  if (!workItemForm.value.workTarget.trim()) {
    uni.showToast({ title: '请填写工作对象', icon: 'none' })
    return
  }
  if (!workItemForm.value.quantity || Number(workItemForm.value.quantity) <= 0) {
    uni.showToast({ title: '请填写有效的数量', icon: 'none' })
    return
  }
  if (!workItemForm.value.unit.trim()) {
    uni.showToast({ title: '请填写单位', icon: 'none' })
    return
  }

  if (editingIndex.value !== null) {
    // 更新现有项
    form.value.workItems[editingIndex.value] = { ...workItemForm.value }
    editingIndex.value = null
  } else {
    // 添加新项
    form.value.workItems.push({ ...workItemForm.value })
  }

  // 清空输入表单
  workItemForm.value = { workTarget: '', quantity: '', unit: '' }
}

// 编辑工作项
function editWorkItem(index: number) {
  editingIndex.value = index
  const item = form.value.workItems[index]
  workItemForm.value = { ...item }
}

// 删除工作项
function removeWorkItem(index: number) {
  if (form.value.workItems.length === 1) {
    uni.showToast({ title: '至少需要保留一项工作', icon: 'none' })
    return
  }
  form.value.workItems.splice(index, 1)
  // 如果删除的是正在编辑的项，清空编辑状态
  if (editingIndex.value === index) {
    editingIndex.value = null
    workItemForm.value = { workTarget: '', quantity: '', unit: '' }
  } else if (editingIndex.value !== null && editingIndex.value > index) {
    // 如果删除的在编辑项之前，编辑索引需要减1
    editingIndex.value--
  }
}

// 选择照片
function choosePhoto() {
  uni.chooseImage({
    count: 5 - photoList.value.length,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res: any) => {
      const tempFiles = res.tempFilePaths as string[]
      tempFiles.forEach(path => {
        if (photoList.value.length < 5) {
          // 先显示本地预览，实际项目中这里需要上传文件到服务器
          photoList.value.push({ url: path })
        }
      })
      // 实际项目中需要调用上传API获取fileId
      // uploadPhotos(tempFiles)
    }
  })
}

// 删除照片
function removePhoto(index: number) {
  photoList.value.splice(index, 1)
}

// 获取项目列表
async function fetchProjects() {
  try {
    const res: any = await http.request({
      url: '/projects?status=ACTIVE',
      method: 'GET'
    })
    // 假设返回的是项目数组或包含content的分页对象
    const projects = Array.isArray(res) ? res : (res.content || [])
    projectList.value = projects.map((p: any) => ({ id: p.id, name: p.name }))
  } catch (err) {
    uni.showToast({ title: '获取项目列表失败', icon: 'none' })
  }
}

// 表单验证
function validateForm(): boolean {
  if (!form.value.projectId) {
    uni.showToast({ title: '请选择所属项目', icon: 'none' })
    return false
  }
  if (!form.value.logDate) {
    uni.showToast({ title: '请选择日志日期', icon: 'none' })
    return false
  }
  if (form.value.workItems.length === 0) {
    uni.showToast({ title: '请至少添加一项工作', icon: 'none' })
    return false
  }
  for (const item of form.value.workItems) {
    if (!item.workTarget.trim()) {
      uni.showToast({ title: '请填写工作对象', icon: 'none' })
      return false
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      uni.showToast({ title: '请填写有效的数量', icon: 'none' })
      return false
    }
    if (!item.unit.trim()) {
      uni.showToast({ title: '请填写单位', icon: 'none' })
      return false
    }
  }
  return true
}

// 提交表单
async function submitForm() {
  if (submitting.value) return
  if (!validateForm()) return

  submitting.value = true
  try {
    const data = {
      projectId: form.value.projectId,
      logDate: form.value.logDate,
      workItems: form.value.workItems.map(item => ({
        workTarget: item.workTarget.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim()
      })),
      workContent: form.value.workContent.trim(),
      photoIds: photoList.value.filter(p => p.fileId).map(p => p.fileId)
    }

    await http.request({
      url: '/construction-logs',
      method: 'POST',
      data
    })

    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err: any) {
    uni.showToast({ title: err.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 80px; // 为底部按钮留出空间
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;

  .back-icon {
    font-size: 20px;
    color: var(--on-surface-variant);
    margin-right: 12px;
    cursor: pointer;
    padding: 4px;

    &:hover {
      color: var(--primary);
    }
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }
}

.form-content {
  flex: 1;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--on-surface);

    .required {
      color: var(--error);
      margin-left: 4px;
    }
  }

  .char-count {
    display: block;
    text-align: right;
    font-size: 12px;
    color: var(--on-surface-variant);
    margin-top: 4px;
  }
}

// 工作事项区域
.work-items-section {
  label {
    display: block;
    margin-bottom: 12px;
  }
}

// 预览列表
.work-items-preview {
  margin-bottom: 16px;
}

.work-items-empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--on-surface-variant);
  background: var(--surface-low);
  border: 1px dashed var(--surface-high);
  border-radius: var(--radius-md);
}

.work-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-low);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &.editing {
    border-color: var(--primary);
    background: var(--primary-container);
  }
}

.work-item-content {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}

.work-item-text {
  font-size: 14px;
  color: var(--on-surface);
  word-break: break-all;
}

.work-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .action-link {
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;

    &.delete {
      color: var(--error);
    }
  }
}

// 输入表单
.work-item-input-form {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  padding: 12px;
}

.work-item-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.work-input-field {
  flex: 1;
  min-width: 0;

  &.narrow {
    flex: 0 0 80px;
    width: 80px;
  }
}

.add-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

// 照片上传
.photo-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.photo-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;

  .photo-image {
    width: 100%;
    height: 100%;
  }

  .photo-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .delete-icon {
      color: #fff;
      font-size: 14px;
      line-height: 1;
    }
  }
}

.photo-add {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--surface-high);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .add-icon {
    font-size: 28px;
    color: var(--on-surface-variant);
    line-height: 1;
  }

  .add-text {
    font-size: 12px;
    color: var(--on-surface-variant);
    margin-top: 4px;
  }
}

// 底部提交按钮
.form-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: var(--surface-lowest);
  border-top: 1px solid var(--surface-high);
  z-index: 100;

  .submit-btn {
    width: 100%;
    padding: 12px 24px;
    background: var(--primary);
    color: #fff;
    text-align: center;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// Fallback 样式
.fallback-select,
.fallback-date-picker {
  .picker-value {
    padding: 10px 12px;
    border: 1px solid var(--surface-high);
    border-radius: var(--radius-sm);
    font-size: 14px;
    color: var(--on-surface);
    background: var(--surface-lowest);
  }
}

.fallback-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--on-surface);
  background: var(--surface-lowest);
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

.fallback-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--on-surface);
  background: var(--surface-lowest);
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

// KPI卡片可点击样式
:global(.kpi-clickable) {
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(0, 52, 102, 0.1);
  }
}
</style>
