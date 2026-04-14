<template>
  <div class="directory-tree">
    <div class="toolbar">
      <n-input
        v-model:value="keyword"
        size="small"
        placeholder="输入目录名或文件名"
        @keydown.enter="search"
      />
      <n-button size="small" @click="search">搜索</n-button>
      <n-button type="primary" size="small" :disabled="!selectedDirectoryPath" @click="confirmSelection">
        确认选择
      </n-button>
    </div>

    <div class="project-tip">
      <span>{{ selectedDirectoryPath || '请选择项目目录' }}</span>
    </div>

    <n-scrollbar class="tree-scroll">
      <n-tree
        v-if="treeData.length"
        :data="treeData"
        block-line
        expand-on-click
        selectable
        key-field="key"
        label-field="label"
        children-field="children"
        :selected-keys="selectedKeys"
        :on-load="handleLoad"
        @update:selected-keys="handleSelect"
      />
      <div v-else class="empty">目录树加载中</div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NInput, NScrollbar, NTree, useMessage } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import type { TreeNode } from '../../runner/types'
import { useRunnerStore } from '../stores/runner'

interface DirectoryTreeOption extends TreeOption {
  key: string
  label: string
  nodeType: 'file' | 'dir'
  path: string
  isLeaf?: boolean
  children?: DirectoryTreeOption[]
}

const runnerStore = useRunnerStore()
const message = useMessage()
const keyword = ref('')
const treeData = ref<DirectoryTreeOption[]>([])
const selectedKeys = ref<string[]>([])

const selectedDirectoryPath = computed(() => selectedKeys.value[0] || '')

function mapTree(nodes: TreeNode[]): DirectoryTreeOption[] {
  return nodes.map((node) => ({
    key: node.path,
    label: node.name,
    nodeType: node.type,
    path: node.path,
    isLeaf: node.type === 'file' || !node.has_children,
    children: node.children ? mapTree(node.children) : undefined,
  }))
}

async function loadRoot(): Promise<void> {
  const result = await window.electronAPI.scanDir('/')
  if (result.success) {
    treeData.value = mapTree(result.tree)
  }
}

async function handleLoad(option: TreeOption): Promise<void> {
  const tree_option = option as DirectoryTreeOption
  if (tree_option.nodeType !== 'dir') {
    return
  }

  const result = await window.electronAPI.scanDir(tree_option.path)
  if (result.success) {
    tree_option.children = mapTree(result.tree)
  }
}

async function search(): Promise<void> {
  if (!keyword.value.trim()) {
    await loadRoot()
    return
  }

  const result = await window.electronAPI.searchFileSystem(keyword.value.trim())
  if (result.success) {
    treeData.value = mapTree(result.tree)
  }
}

function handleSelect(keys: Array<string | number>, options: Array<TreeOption | null>): void {
  selectedKeys.value = keys.map(String)
  const selected = options[0] as DirectoryTreeOption | null
  if (selected?.nodeType === 'file') {
    selectedKeys.value = []
    message.warning('请选择目录，不要选择文件')
  }
}

async function confirmSelection(): Promise<void> {
  if (!selectedDirectoryPath.value) {
    return
  }

  const success = await runnerStore.selectProject(selectedDirectoryPath.value)
  if (success) {
    message.success('项目已加载并启动预览')
  } else {
    message.error('项目加载失败，请查看右侧日志')
  }
}

onMounted(() => {
  void loadRoot()
})
</script>

<style scoped>
.directory-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(21, 24, 29, 0.94);
  border-right: 1px solid var(--line);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--line);
}

.project-tip {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--text-2);
  font-size: 12px;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  word-break: break-all;
}

.tree-scroll {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.empty {
  padding: 18px;
  color: var(--text-3);
  text-align: center;
}
</style>
