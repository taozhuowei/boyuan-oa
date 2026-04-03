<template>
  <AppShell title="组织架构">
    <view class="page-content">
      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">组织架构</text>
          <text class="page-desc">查看和管理公司人员汇报关系</text>
        </view>
      </view>

      <!-- 组织架构树 -->
      <view class="org-tree-container content-card">
        <view class="card-header">
          <text class="card-title">汇报关系图</text>
        </view>
        <view class="card-body scrollable">
          <view v-if="orgTree.length" class="org-tree">
            <org-node
              v-for="node in orgTree"
              :key="node.id"
              :node="node"
              :level="0"
              @select="handleNodeSelect"
            />
          </view>
          <view v-else class="empty-state">
            <text>暂无组织架构数据</text>
          </view>
        </view>
      </view>

      <!-- 修改上级 Modal -->
      <component
        :is="Modal"
        v-if="Modal"
        :open="supervisorModalVisible"
        title="修改直系领导"
        :footer="null"
        @cancel="closeSupervisorModal"
      >
        <view class="modal-form">
          <view class="form-item">
            <label>当前员工</label>
            <text class="selected-employee">{{ selectedEmployee?.name }} ({{ selectedEmployee?.roleName }})</text>
          </view>
          <view class="form-item">
            <label>新直系领导</label>
            <component
              :is="Select"
              v-if="Select"
              v-model:value="newSupervisorId"
              :options="supervisorOptions"
              placeholder="请选择新上级（留空表示无上级）"
              allow-clear
            />
            <view v-else class="fallback-select">
              <select v-model="newSupervisorId" class="native-select">
                <option value="">无上级</option>
                <option v-for="emp in allEmployees" :key="emp.id" :value="emp.id">
                  {{ emp.name }} - {{ emp.departmentName || '无部门' }}
                </option>
              </select>
            </view>
          </view>
          <view class="modal-actions">
            <component :is="Button" v-if="Button" @click="closeSupervisorModal">取消</component>
            <component :is="Button" v-if="Button" type="primary" @click="saveSupervisor">保存</component>
          </view>
        </view>
      </component>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { request } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

const { Button, Modal, Select } = useComponent(['Button', 'Modal', 'Select'])

// Mock 数据
const mockOrgTree = [
  {
    id: 4, name: '陈明远', roleCode: 'ceo', roleName: 'CEO', departmentName: '运营管理部', positionName: 'CEO',
    children: [
      { id: 2, name: '李静', roleCode: 'finance', roleName: '财务', departmentName: '财务管理部', positionName: '财务专员', children: [] },
      { id: 3, name: '王建国', roleCode: 'project_manager', roleName: '项目经理', departmentName: '项目一部', positionName: '项目工程师', children: [
        { id: 5, name: '赵铁柱', roleCode: 'worker', roleName: '工人', departmentName: '施工一部', positionName: '焊接工', children: [] }
      ]},
      { id: 1, name: '张晓宁', roleCode: 'employee', roleName: '员工', departmentName: '综合管理部', positionName: '行政专员', children: [] }
    ]
  }
]

// 组织架构树
const orgTree = ref<any[]>([])
const allEmployees = ref<any[]>([])

// Modal 状态
const supervisorModalVisible = ref(false)
const selectedEmployee = ref<any>(null)
const newSupervisorId = ref<string | undefined>(undefined)

// 上级选项
const supervisorOptions = computed(() => {
  return allEmployees.value
    .filter((e: any) => e.id !== selectedEmployee.value?.id)
    .map((e: any) => ({
      label: `${e.name} - ${e.departmentName || '无部门'}`,
      value: String(e.id)
    }))
})

// 加载组织架构树
const loadOrgTree = async () => {
  try {
    const res = await request<any[]>({ url: '/org/tree', method: 'GET' })
    orgTree.value = res || []
    // 同时收集所有员工用于选择上级
    collectEmployees(orgTree.value)
  } catch (e) {
    console.log('API 失败，使用 mock 数据')
    orgTree.value = mockOrgTree
    collectEmployees(orgTree.value)
  }
}

// 收集所有员工节点
const collectEmployees = (nodes: any[]) => {
  for (const node of nodes) {
    allEmployees.value.push(node)
    if (node.children?.length) {
      collectEmployees(node.children)
    }
  }
}

// 选择节点
const handleNodeSelect = (node: any) => {
  selectedEmployee.value = node
  newSupervisorId.value = node.directSupervisorId ? String(node.directSupervisorId) : undefined
  supervisorModalVisible.value = true
}

// 关闭 Modal
const closeSupervisorModal = () => {
  supervisorModalVisible.value = false
  selectedEmployee.value = null
  newSupervisorId.value = undefined
}

// 保存上级
const saveSupervisor = async () => {
  if (!selectedEmployee.value) return
  
  const supervisorId = newSupervisorId.value ? Number(newSupervisorId.value) : null
  
  try {
    await request({
      url: `/org/supervisor/${selectedEmployee.value.id}`,
      method: 'PATCH',
      data: { supervisorId }
    })
    uni.showToast({ title: '修改成功', icon: 'success' })
    closeSupervisorModal()
    allEmployees.value = []
    await loadOrgTree()
  } catch (e) {
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

// 递归组件：组织节点
const OrgNode = {
  name: 'OrgNode',
  props: ['node', 'level'],
  emits: ['select'],
  setup(props: any, { emit }: any) {
    const expanded = ref(true)
    const hasChildren = computed(() => props.node.children?.length > 0)
    
    const toggleExpand = () => {
      expanded.value = !expanded.value
    }
    
    const handleClick = () => {
      emit('select', props.node)
    }
    
    return { expanded, hasChildren, toggleExpand, handleClick }
  },
  render() {
    const { node, level } = this
    const indentStyle = { paddingLeft: `${level * 24}px` }
    
    return h('view', { class: 'org-node' }, [
      h('view', { 
        class: 'node-card',
        style: indentStyle,
        onClick: this.handleClick
      }, [
        h('view', { class: 'node-main' }, [
          this.hasChildren && h('text', { 
            class: 'expand-icon',
            onClick: (e: Event) => { e.stopPropagation(); this.toggleExpand() }
          }, this.expanded ? '▼' : '▶'),
          h('view', { class: 'node-info' }, [
            h('text', { class: 'node-name' }, node.name),
            h('view', { class: 'node-tags' }, [
              h('text', { class: 'role-tag' }, node.roleName || node.roleCode),
              node.departmentName && h('text', { class: 'dept-tag' }, node.departmentName)
            ])
          ])
        ]),
        h('text', { class: 'edit-hint' }, '点击修改')
      ]),
      this.expanded && this.hasChildren && h('view', { class: 'node-children' },
        node.children.map((child: any) => 
          h(OrgNode, { 
            key: child.id, 
            node: child, 
            level: level + 1,
            onSelect: (n: any) => this.$emit('select', n)
          })
        )
      )
    ])
  }
}

onMounted(() => {
  loadOrgTree()
})
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  flex-shrink: 0;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }

  .page-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-top: 2px;
    display: block;
  }
}

.org-tree-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-card {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-high);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-surface);
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;
    padding: 20px;

    &.scrollable {
      overflow-y: auto;
    }
  }
}

// 组织树样式
.org-tree {
  .org-node {
    .node-card {
      background: var(--surface);
      border: 1px solid var(--surface-high);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--surface-low);
        border-color: var(--primary);
      }

      .node-main {
        display: flex;
        align-items: center;
        gap: 12px;

        .expand-icon {
          font-size: 10px;
          color: var(--on-surface-variant);
          width: 16px;
          text-align: center;
          cursor: pointer;

          &:hover {
            color: var(--primary);
          }
        }

        .node-info {
          .node-name {
            font-weight: 600;
            font-size: 14px;
            color: var(--on-surface);
            display: block;
            margin-bottom: 4px;
          }

          .node-tags {
            display: flex;
            gap: 8px;

            .role-tag {
              font-size: 11px;
              padding: 2px 8px;
              background: rgba(0, 52, 102, 0.08);
              color: var(--primary);
              border-radius: 4px;
            }

            .dept-tag {
              font-size: 11px;
              padding: 2px 8px;
              background: var(--surface-high);
              color: var(--on-surface-variant);
              border-radius: 4px;
            }
          }
        }
      }

      .edit-hint {
        font-size: 11px;
        color: var(--primary);
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .edit-hint {
        opacity: 1;
      }
    }

    .node-children {
      margin-top: 4px;
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--on-surface-variant);
  font-size: 13px;
}

// Modal 表单
.modal-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      font-size: 13px;
      color: var(--on-surface);
      margin-bottom: 6px;
    }

    .selected-employee {
      font-weight: 600;
      color: var(--primary);
    }
  }

  .fallback-select {
    .native-select {
      width: 100%;
      height: 36px;
      padding: 0 12px;
      border: 1px solid var(--surface-high);
      border-radius: var(--radius-sm);
      background: var(--surface-lowest);
      font-size: 13px;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--surface);
  }
}
</style>
