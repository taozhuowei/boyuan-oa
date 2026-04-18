<template>
  <div class="expense-apply-page">
    <h2 class="page-title">费用报销申请</h2>

    <a-card>
      <a-form
        :model="formState"
        layout="vertical"
        style="max-width: 600px"
        @finish="submitExpense"
      >
        <!-- 基本信息 -->
        <a-divider orientation="left">基本信息</a-divider>

        <a-form-item label="报销类型" name="expenseType" :rules="[{ required: true, message: '请选择报销类型' }]">
          <a-select v-model:value="formState.expenseType" placeholder="请选择报销类型">
            <a-select-option v-for="t in expenseTypes" :key="t.code" :value="t.code">
              {{ t.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 出差信息（可选） -->
        <a-form-item label="出差开始日期" name="tripStartDate">
          <a-date-picker v-model:value="formState.tripStartDate" style="width: 100%" placeholder="请选择出差开始日期" />
        </a-form-item>

        <a-form-item label="出差结束日期" name="tripEndDate">
          <a-date-picker v-model:value="formState.tripEndDate" style="width: 100%" placeholder="请选择出差结束日期" />
        </a-form-item>

        <a-form-item label="出差目的地" name="tripDestination">
          <a-input v-model:value="formState.tripDestination" placeholder="请输入出差目的地" />
        </a-form-item>

        <a-form-item label="出差事由" name="tripPurpose">
          <a-textarea v-model:value="formState.tripPurpose" :rows="2" placeholder="请输入出差事由" />
        </a-form-item>

        <a-form-item label="关联项目（可选）" name="projectId">
          <a-select
            v-model:value="formState.projectId"
            placeholder="选择关联项目（报销核销后计入项目成本）"
            allow-clear
            :options="projects.map(p => ({ label: p.name, value: p.id }))"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>

        <!-- 报销明细 -->
        <a-divider orientation="left">报销明细</a-divider>

        <div v-for="(item, index) in formState.items" :key="index" class="expense-item">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-form-item :name="['items', index, 'itemType']" :rules="[{ required: true, message: '请选择类型' }]">
                <a-select v-model:value="item.itemType" placeholder="费用类型">
                  <a-select-option value="MEAL">餐饮费</a-select-option>
                  <a-select-option value="TRANSPORT">交通费</a-select-option>
                  <a-select-option value="ACCOMMODATION">住宿费</a-select-option>
                  <a-select-option value="OFFICE">办公用品</a-select-option>
                  <a-select-option value="OTHER">其他</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item :name="['items', index, 'expenseDate']" :rules="[{ required: true, message: '请选择日期' }]">
                <a-date-picker v-model:value="item.expenseDate" style="width: 100%" placeholder="日期" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item
                :name="['items', index, 'amount']"
                :rules="[
                  { required: true, message: '请输入金额' },
                  { validator: validateItemAmount, trigger: 'blur' }
                ]"
              >
                <a-input-number v-model:value="item.amount" style="width: 100%" :min="0.01" :precision="2" placeholder="金额" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item :name="['items', index, 'invoiceNo']">
                <a-input v-model:value="item.invoiceNo" placeholder="发票号可选" />
              </a-form-item>
            </a-col>
            <a-col :span="2">
              <a-button danger type="link" @click="removeItem(index)">删除</a-button>
            </a-col>
          </a-row>
          <a-form-item :name="['items', index, 'description']">
            <a-textarea v-model:value="item.description" :rows="1" placeholder="费用说明（可选）" />
          </a-form-item>
          <a-form-item :name="['items', index, 'attachmentId']" label="明细附件（可选）">
            <customized-file-upload
              business-type="EXPENSE_ITEM"
              :max-count="1"
              accept="image/*,.pdf"
              hint="可上传该笔明细的票据，最多 1 个"
              @change="(files: { attachmentId: number }[]) => { item.attachmentId = files[0]?.attachmentId }"
            />
          </a-form-item>
        </div>

        <a-button type="dashed" block @click="addItem" style="margin-bottom: 24px">
          + 添加明细
        </a-button>

        <!-- 合计金额 -->
        <a-form-item label="报销总金额" name="totalAmount" :rules="[{ required: true, message: '请输入总金额' }]">
          <a-input-number v-model:value="formState.totalAmount" style="width: 100%" :min="0" :precision="2" :disabled="true" placeholder="自动计算（明细金额之和）" />
        </a-form-item>

        <a-form-item label="备注说明" name="remark">
          <a-textarea v-model:value="formState.remark" :rows="3" placeholder="请输入备注说明（可选）" />
        </a-form-item>

        <a-form-item
          label="发票附件"
          name="invoiceAttachmentIds"
          :rules="[{ validator: validateInvoiceAttachments, trigger: 'change' }]"
        >
          <customized-file-upload
            ref="invoiceFileRef"
            business-type="EXPENSE"
            :max-count="5"
            accept="image/*,.pdf"
            hint="请上传发票图片或 PDF，最多 5 个（必填）"
            @change="files => formState.invoiceAttachmentIds = files.map(f => f.attachmentId)"
          />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              提交申请
            </a-button>
            <a-button @click="resetForm">重置</a-button>
            <a-button type="link" @click="goToRecords">查看我的报销记录</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

interface ExpenseItem {
  itemType: string | undefined
  expenseDate: Dayjs | undefined
  amount: number | undefined
  invoiceNo: string
  description: string
  attachmentId: number | undefined
}

interface ExpenseType {
  id: number
  code: string
  name: string
  description: string
  requireInvoice: boolean
  dailyLimit: number
}

const formState = reactive({
  expenseType: undefined as string | undefined,
  tripStartDate: undefined as Dayjs | undefined,
  tripEndDate: undefined as Dayjs | undefined,
  tripDestination: '',
  tripPurpose: '',
  projectId: undefined as number | undefined,
  totalAmount: undefined as number | undefined,
  remark: '',
  invoiceAttachmentIds: [] as number[],
  items: [] as ExpenseItem[]
})

const expenseTypes = ref<ExpenseType[]>([])
const submitting = ref(false)
const invoiceFileRef = ref<{ clear: () => void } | undefined>(undefined)
const projects = ref<{ id: number; name: string }[]>([])

// 计算总金额
const calculatedTotal = computed(() => {
  return formState.items.reduce((sum, item) => {
    return sum + (item.amount || 0)
  }, 0)
})

// 监听明细变化，自动更新总金额
watch(calculatedTotal, (newVal) => {
  formState.totalAmount = newVal > 0 ? newVal : undefined
})

// 报销明细金额校验：必须大于0（防止输入负数或零）
function validateItemAmount(_rule: unknown, val: number | undefined): Promise<void> {
  if (val != null && val > 0) return Promise.resolve()
  return Promise.reject(new Error('金额必须大于0'))
}

function addItem() {
  formState.items.push({
    itemType: undefined,
    expenseDate: undefined,
    amount: undefined,
    invoiceNo: '',
    description: '',
    attachmentId: undefined
  })
}

function removeItem(index: number) {
  formState.items.splice(index, 1)
}

function resetForm() {
  formState.expenseType = undefined
  formState.tripStartDate = undefined
  formState.tripEndDate = undefined
  formState.tripDestination = ''
  formState.tripPurpose = ''
  formState.projectId = undefined
  formState.totalAmount = undefined
  formState.remark = ''
  formState.invoiceAttachmentIds = []
  formState.items = []
  invoiceFileRef.value?.clear()
}

function goToRecords() {
  navigateTo('/expense/records')
}

async function submitExpense() {
  if (formState.items.length === 0) {
    alert('请至少添加一条报销明细')
    return
  }

  submitting.value = true
  try {
    const body = {
      expenseType: formState.expenseType,
      tripStartDate: formState.tripStartDate?.format('YYYY-MM-DD'),
      tripEndDate: formState.tripEndDate?.format('YYYY-MM-DD'),
      tripDestination: formState.tripDestination || null,
      tripPurpose: formState.tripPurpose || null,
      projectId: formState.projectId,
      totalAmount: formState.totalAmount,
      remark: formState.remark || null,
      invoiceAttachmentIds: formState.invoiceAttachmentIds,
      items: formState.items.map(item => ({
        itemType: item.itemType,
        expenseDate: item.expenseDate?.format('YYYY-MM-DD'),
        amount: item.amount,
        invoiceNo: item.invoiceNo || null,
        description: item.description || null,
        attachmentId: item.attachmentId
      }))
    }

    await request({
      url: '/expense',
      method: 'POST',
      body
    })

    alert('报销申请提交成功')
    resetForm()
    goToRecords()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '提交失败'
    alert(msg)
  } finally {
    submitting.value = false
  }
}

function validateInvoiceAttachments(): Promise<void> {
  if (formState.invoiceAttachmentIds.length > 0) return Promise.resolve()
  return Promise.reject(new Error('请上传至少一张发票'))
}

async function loadProjects() {
  try {
    const res = await request<{ records: { id: number; name: string }[] }>({ url: '/projects?page=1&size=100' })
    projects.value = res?.records ?? []
  } catch {
    projects.value = []
  }
}

async function loadExpenseTypes() {
  try {
    const types = await request<ExpenseType[]>({ url: '/expense/types' })
    expenseTypes.value = types ?? []
  } catch {
    // 默认类型
    expenseTypes.value = [
      { id: 1, code: 'TRAVEL', name: '差旅费', description: '', requireInvoice: true, dailyLimit: 0 },
      { id: 2, code: 'MEAL', name: '餐饮费', description: '', requireInvoice: true, dailyLimit: 0 },
      { id: 3, code: 'ACCOMMODATION', name: '住宿费', description: '', requireInvoice: true, dailyLimit: 0 },
      { id: 4, code: 'TRANSPORT', name: '交通费', description: '', requireInvoice: true, dailyLimit: 0 },
      { id: 5, code: 'OFFICE', name: '办公用品', description: '', requireInvoice: true, dailyLimit: 0 },
      { id: 6, code: 'OTHER', name: '其他', description: '', requireInvoice: false, dailyLimit: 0 }
    ]
  }
}

onMounted(() => {
  loadExpenseTypes()
  loadProjects()
  addItem() // 默认添加一条明细
})
</script>

<style scoped>
.expense-apply-page {
  /* Page container */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.expense-item {
  background: #f5f5f5;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
}
</style>
