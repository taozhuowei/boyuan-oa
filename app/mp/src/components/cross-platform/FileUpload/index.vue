<template>
  <view class="file-upload">
    <view
      v-for="(url, index) in modelValue"
      :key="url + index"
      class="file-item"
    >
      <image
        :src="url"
        class="file-thumb"
        mode="aspectFill"
      />
      <view
        class="delete-btn"
        @click.stop="handleDelete(index)"
      >
        ×
      </view>
    </view>

    <view
      v-if="!disabled && modelValue.length < maxCount"
      class="add-btn"
      @click="handleAdd"
    >
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string[];
  maxCount?: number;
  accept?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
  accept: 'image/*',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', newList: string[]): void;
}>();

const handleAdd = () => {
  const remain = props.maxCount - props.modelValue.length;
  if (remain <= 0) return;

  uni.chooseImage({
    count: remain,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const paths = res.tempFilePaths as string[];
      emit('update:modelValue', [...props.modelValue, ...paths]);
    },
  });
};

const handleDelete = (index: number) => {
  const newList = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newList);
};
</script>

<style lang="scss" scoped>
.file-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.file-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.add-btn {
  width: 80px;
  height: 80px;
  border: 1.5px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24px;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
