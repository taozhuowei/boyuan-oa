<template>
  <view class="oa-table">
    <scroll-view scroll-x class="oa-table__scroll">
      <view class="oa-table__inner">
        <!-- Header -->
        <view class="oa-table__header">
          <view
            v-for="col in columns"
            :key="col.key || col.dataIndex"
            class="oa-table__cell oa-table__cell--header"
            :style="col.width ? { width: col.width, flexShrink: 0 } : {}"
          >
            <text>{{ col.title }}</text>
          </view>
        </view>
        <!-- Loading -->
        <view v-if="loading" class="oa-table__loading">
          <text class="oa-table__loading-text">Loading...</text>
        </view>
        <!-- Empty -->
        <view v-else-if="!dataSource.length" class="oa-table__empty">
          <text class="oa-table__empty-text">{{ emptyText }}</text>
        </view>
        <!-- Body -->
        <view
          v-else
          v-for="(row, rowIndex) in dataSource"
          :key="row[rowKey] ?? rowIndex"
          class="oa-table__row"
          :class="{ 'oa-table__row--even': rowIndex % 2 === 1 }"
        >
          <view
            v-for="col in columns"
            :key="col.key || col.dataIndex"
            class="oa-table__cell"
            :style="col.width ? { width: col.width, flexShrink: 0 } : {}"
          >
            <text>{{ row[col.dataIndex] ?? '' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
export interface TableColumn {
  title: string
  dataIndex: string
  key?: string
  width?: string
}

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  dataSource: Record<string, any>[]
  rowKey?: string
  loading?: boolean
  emptyText?: string
}>(), {
  rowKey: 'id',
  loading: false,
  emptyText: 'No data'
})
// Named export for adapter compatibility
// import { Table } from './index.vue' works via the default export
</script>

<style lang="scss" scoped>
.oa-table {
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;

  &__scroll {
    width: 100%;
  }

  &__inner {
    min-width: 100%;
  }

  &__header {
    display: flex;
    background: #f5f5f5;
    border-bottom: 1px solid #f0f0f0;
  }

  &__cell {
    flex: 1;
    min-width: 80px;
    padding: 12px 16px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;

    &--header {
      font-size: 13px;
      font-weight: 600;
    }
  }

  &__row {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    background: #ffffff;

    &--even {
      background: #fafafa;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  &__loading,
  &__empty {
    padding: 32px 16px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__loading-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
  }

  &__empty-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
  }
}
</style>
