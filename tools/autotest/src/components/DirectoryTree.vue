<!-- DirectoryTree: left 260px column with scan root input, file tree, and scan button -->
<template>
  <div class="directory-tree">
    <div class="header">
      <n-input
        v-model:value="scanRoot"
        size="small"
        placeholder="输入扫描根目录"
        @keydown.enter="loadTree"
      />
    </div>
    <div class="tree-wrap">
      <n-tree
        v-if="treeData.length"
        v-model:checked-keys="checkedKeys"
        :data="treeData"
        key-field="key"
        label-field="label"
        children-field="children"
        checkable
        expand-on-click
        selectable
        :default-expand-all="false"
      />
      <div v-else class="empty">请输入目录并加载</div>
    </div>
    <div class="footer">
      <n-button type="primary" size="small" block @click="handleScan">
        扫描用例
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NTree, NInput, NButton } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { useResultsStore } from '../stores/results'

const resultsStore = useResultsStore()

const scanRoot = ref('/home/tzw/projects/boyuan-oa/test/autotest')
const treeData = ref<TreeOption[]>([])
const checkedKeys = ref<string[]>([])

function buildTreeData(nodes: any[]): TreeOption[] {
  const out: TreeOption[] = []
  for (const node of nodes) {
    if (node.type === 'dir') {
      out.push({
        key: node.path,
        label: node.name,
        children: node.children ? buildTreeData(node.children) : undefined,
      })
    } else if (node.type === 'file' && node.name.endsWith('.ts')) {
      out.push({
        key: node.path,
        label: node.name,
      })
    }
  }
  return out
}

async function loadTree() {
  if (!window.electronAPI?.scanDir) {
    return
  }
  try {
    const result = await window.electronAPI.scanDir(scanRoot.value)
    if (result?.success && Array.isArray(result.tree)) {
      treeData.value = buildTreeData(result.tree)
    } else {
      console.error('scanDir failed', result?.error)
    }
  } catch (e) {
    console.error('scanDir failed', e)
  }
}

async function handleScan() {
  if (!window.electronAPI?.scanCases) {
    return
  }
  // Collect checked keys; if none, use the current root
  const keys = checkedKeys.value.length ? checkedKeys.value : [scanRoot.value]
  try {
    const result = await window.electronAPI.scanCases(keys)
    const cases = result?.success ? result.cases : []
    const testCases = cases.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? '',
      module: c.module,
      priority: c.priority,
      roles: c.roles,
      tags: c.tags || [],
      steps: c.steps || [],
      expect: { result: 'pass' as const },
    }))
    resultsStore.setCases(testCases)
  } catch (e) {
    console.error('scanCases failed', e)
  }
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.directory-tree {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100%;
  background: var(--bg-1);
  border-right: 1px solid var(--line);
}

.header {
  padding: 8px;
  border-bottom: 1px solid var(--line);
}

.tree-wrap {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.empty {
  padding: 16px;
  text-align: center;
  color: var(--text-3);
  font-size: 12px;
}

.footer {
  padding: 8px;
  border-top: 1px solid var(--line);
}
</style>
