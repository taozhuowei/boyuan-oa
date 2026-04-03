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
          <text v-if="is_ceo" class="card-hint">CEO 可点击节点修改直系领导</text>
        </view>
        <view class="card-body scrollable">
          <view v-if="org_tree.length" class="org-tree">
            <org-node
              v-for="node in org_tree"
              :key="node.id"
              :node="node"
              :level="0"
              :is_ceo="is_ceo"
              @select="handle_node_select"
            />
          </view>
          <view v-else class="empty-state">
            <text>暂无组织架构数据</text>
          </view>
        </view>
      </view>

      <!-- 修改直系领导侧边抽屉 -->
      <component
        :is="Popup"
        v-if="Popup"
        :open="drawer_visible"
        title="修改直系领导"
        placement="right"
        :width="360"
        @close="close_drawer"
      >
        <view class="drawer-body">
          <view class="drawer-section">
            <label class="section-label">当前员工</label>
            <text class="section-value">{{ selected_employee?.name }}（{{ selected_employee?.roleName }}）</text>
            <text v-if="selected_employee?.departmentName" class="section-sub">{{ selected_employee?.departmentName }}</text>
          </view>

          <view class="drawer-section">
            <label class="section-label">新直系领导</label>
            <component
              :is="Select"
              v-if="Select"
              v-model:value="new_supervisor_id"
              :options="supervisor_options"
              placeholder="请选择新上级（留空表示无上级）"
              allow-clear
              style="width: 100%"
            />
            <view v-else class="fallback-select">
              <select v-model="new_supervisor_id" class="native-select">
                <option value="">无上级</option>
                <option v-for="emp in all_employees" :key="emp.id" :value="String(emp.id)">
                  {{ emp.name }} - {{ emp.departmentName || '无部门' }}
                </option>
              </select>
            </view>
          </view>

          <view class="drawer-actions">
            <component :is="Button" v-if="Button" @click="close_drawer">取消</component>
            <component :is="Button" v-if="Button" type="primary" @click="save_supervisor">确认</component>
            <view v-else class="fallback-actions">
              <text class="fallback-btn" @click="close_drawer">取消</text>
              <text class="fallback-btn primary" @click="save_supervisor">确认</text>
            </view>
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
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const user_store = useUserStore()

/** 判断当前用户是否为 CEO */
const is_ceo = computed(() => user_store.userInfo?.role === 'ceo')

/** 异步加载平台适配组件 */
const { Button, Popup, Select } = useComponent(['Button', 'Popup', 'Select'])

/** 本地 mock 数据：接口失败时使用 */
const mock_org_tree = [
  {
    id: 4, employeeNo: 'ceo.demo', name: '陈明远', roleCode: 'ceo', roleName: '首席经营者',
    departmentId: 4, departmentName: '运营管理部', positionId: null, positionName: '', directSupervisorId: null,
    children: [
      {
        id: 2, employeeNo: 'finance.demo', name: '李静', roleCode: 'finance', roleName: '财务',
        departmentId: 2, departmentName: '财务管理部', positionId: null, positionName: '财务专员', directSupervisorId: 4,
        children: []
      },
      {
        id: 3, employeeNo: 'pm.demo', name: '王建国', roleCode: 'project_manager', roleName: '项目经理',
        departmentId: 3, departmentName: '项目一部', positionId: null, positionName: '项目工程师', directSupervisorId: 4,
        children: [
          {
            id: 5, employeeNo: 'worker.demo', name: '赵铁柱', roleCode: 'worker', roleName: '工人',
            departmentId: 5, departmentName: '施工一部', positionId: null, positionName: '焊接工', directSupervisorId: 3,
            children: []
          }
        ]
      },
      {
        id: 1, employeeNo: 'employee.demo', name: '张晓宁', roleCode: 'employee', roleName: '员工',
        departmentId: 1, departmentName: '综合管理部', positionId: null, positionName: '行政专员', directSupervisorId: 4,
        children: []
      }
    ]
  }
]

/** 组织架构树数据 */
const org_tree = ref<any[]>([])
/** 所有员工平铺列表（用于下拉选择） */
const all_employees = ref<any[]>([])
/** 抽屉显隐状态 */
const drawer_visible = ref(false)
/** 当前选中的员工 */
const selected_employee = ref<any>(null)
/** 新选中的直系领导 ID */
const new_supervisor_id = ref<string | undefined>(undefined)

/** 下拉选项：排除当前选中员工自身 */
const supervisor_options = computed(() => {
  return all_employees.value
    .filter((e: any) => e.id !== selected_employee.value?.id)
    .map((e: any) => ({
      label: `${e.name} - ${e.departmentName || '无部门'}`,
      value: String(e.id)
    }))
})

/** 加载组织架构树 */
const load_org_tree = async () => {
  try {
    const res = await request<any[]>({ url: '/org/tree', method: 'GET' })
    org_tree.value = res || []
    all_employees.value = []
    collect_employees(org_tree.value)
  } catch (e) {
    console.log('API 失败，使用 mock 数据')
    org_tree.value = mock_org_tree
    all_employees.value = []
    collect_employees(org_tree.value)
  }
}

/** 递归收集所有员工节点 */
const collect_employees = (nodes: any[]) => {
  for (const node of nodes) {
    all_employees.value.push(node)
    if (node.children?.length) {
      collect_employees(node.children)
    }
  }
}

/** 点击节点：仅 CEO 可打开抽屉 */
const handle_node_select = (node: any) => {
  if (!is_ceo.value) return
  selected_employee.value = node
  new_supervisor_id.value = node.directSupervisorId ? String(node.directSupervisorId) : undefined
  drawer_visible.value = true
}

/** 关闭抽屉并重置状态 */
const close_drawer = () => {
  drawer_visible.value = false
  selected_employee.value = null
  new_supervisor_id.value = undefined
}

/** 保存直系领导修改 */
const save_supervisor = async () => {
  if (!selected_employee.value) return
  const supervisor_id = new_supervisor_id.value ? Number(new_supervisor_id.value) : null
  try {
    await request({
      url: `/org/supervisor/${selected_employee.value.id}`,
      method: 'PATCH',
      data: { supervisorId: supervisor_id }
    })
    uni.showToast({ title: '修改成功', icon: 'success' })
    close_drawer()
    await load_org_tree()
  } catch (e) {
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

/** 递归渲染组件：组织树节点 */
const OrgNode = {
  name: 'OrgNode',
  props: ['node', 'level', 'is_ceo'],
  emits: ['select'],
  setup(props: any, { emit }: any) {
    const expanded = ref(true)
    const has_children = computed(() => props.node.children?.length > 0)
    const toggle_expand = () => { expanded.value = !expanded.value }
    const handle_click = () => {
      if (props.is_ceo) emit('select', props.node)
    }
    return { expanded, has_children, toggle_expand, handle_click }
  },
  render() {
    const { node, level } = this
    const indent_style = { paddingLeft: `${level * 24}px` }
    return h('view', { class: 'org-node' }, [
      h('view', {
        class: ['node-card', { 'node-card--clickable': this.is_ceo }],
        style: indent_style,
        onClick: this.handle_click
      }, [
        h('view', { class: 'node-main' }, [
          this.has_children && h('text', {
            class: 'expand-icon',
            onClick: (e: Event) => { e.stopPropagation(); this.toggle_expand() }
          }, this.expanded ? '▼' : '▶'),
          h('view', { class: 'node-info' }, [
            h('text', { class: 'node-name' }, node.name),
            h('view', { class: 'node-tags' }, [
              h('text', { class: 'role-tag' }, node.roleName || node.roleCode),
              node.departmentName && h('text', { class: 'dept-tag' }, node.departmentName)
            ])
          ])
        ]),
        this.is_ceo && h('text', { class: 'edit-hint' }, '点击修改')
      ]),
      this.expanded && this.has_children && h('view', { class: 'node-children' },
        node.children.map((child: any) =>
          h(OrgNode, {
            key: child.id,
            node: child,
            level: level + 1,
            is_ceo: this.is_ceo,
            onSelect: (n: any) => this.$emit('select', n)
          })
        )
      )
    ])
  }
}

onMounted(() => {
  load_org_tree()
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

    .card-hint {
      font-size: 12px;
      color: var(--on-surface-variant);
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
      transition: all 0.2s;

      &--clickable {
        cursor: pointer;

        &:hover {
          background: var(--surface-low);
          border-color: var(--primary);
        }
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

// 抽屉表单
.drawer-body {
  padding: 20px;

  .drawer-section {
    margin-bottom: 20px;

    .section-label {
      display: block;
      font-size: 13px;
      color: var(--on-surface-variant);
      margin-bottom: 6px;
    }

    .section-value {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: var(--primary);
    }

    .section-sub {
      display: block;
      font-size: 12px;
      color: var(--on-surface-variant);
      margin-top: 4px;
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

  .drawer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--surface);

    .fallback-actions {
      display: flex;
      gap: 12px;

      .fallback-btn {
        padding: 6px 16px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        cursor: pointer;
        border: 1px solid var(--surface-high);
        color: var(--on-surface);

        &.primary {
          background: var(--primary);
          color: var(--on-primary);
          border-color: var(--primary);
        }
      }
    }
  }
}
</style>
