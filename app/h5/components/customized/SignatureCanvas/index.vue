<template>
  <div class="signature-canvas">
    <canvas
      ref="canvasRef"
      :width="props.width"
      :height="props.height"
      :style="{ width: props.width + 'px', height: props.height + 'px', backgroundColor: props.bgColor }"
      class="signature-canvas__canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
    />
    <div class="signature-canvas__actions">
      <a-button class="signature-canvas__btn signature-canvas__btn--clear" @click="clear">
        清空
      </a-button>
      <a-button type="primary" class="signature-canvas__btn signature-canvas__btn--confirm" @click="onConfirm">
        确认
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SignatureCanvas — 手写签名画布（H5 浏览器版）
 * 用途：使用 HTML5 Canvas + PointerEvent 在浏览器中绘制签名，支持鼠标和触摸输入
 * 数据流：pointer 事件 → Canvas 2D Context 绘制 → canvas.toDataURL → base64 emit
 *
 * @example
 * <SignatureCanvas
 *   :width="400"
 *   :height="200"
 *   stroke-color="#003466"
 *   :stroke-width="3"
 *   bg-color="#ffffff"
 *   @change="handleChange"
 *   @confirm="handleConfirm"
 * />
 *
 * // 通过 ref 调用方法
 * const canvasRef = ref<InstanceType<typeof SignatureCanvas>>()
 * canvasRef.value?.clear()
 * const base64 = await canvasRef.value?.getImage()
 */
import { ref, onMounted } from 'vue'

/** 组件 Props 接口 */
interface Props {
  /** 画布宽度（像素） */
  width?: number
  /** 画布高度（像素） */
  height?: number
  /** 签名线条颜色 */
  strokeColor?: string
  /** 签名线条宽度 */
  strokeWidth?: number
  /** 画布背景色 */
  bgColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 150,
  strokeColor: '#003466',
  strokeWidth: 2,
  bgColor: '#ffffff',
})

/** 组件事件定义 */
const emit = defineEmits<{
  /** 签名内容变化时触发（绘制结束后） */
  (e: 'change', base64: string): void
  /** 点击确认按钮时触发 */
  (e: 'confirm', base64: string): void
}>()

/** Canvas 元素引用 */
const canvasRef = ref<HTMLCanvasElement | null>(null)
/** Canvas 2D 渲染上下文 */
let ctx: CanvasRenderingContext2D | null = null
/** 是否正在绘制 */
const isDrawing = ref(false)
/** 上一次绘制点坐标 */
const lastPoint = ref<{ x: number; y: number } | null>(null)

/**
 * 组件挂载时初始化 Canvas
 */
onMounted(() => {
  initCanvas()
})

/**
 * 初始化 Canvas 上下文和样式
 */
function initCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return

  ctx = context
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  clear()
}

/**
 * 获取指针事件在 Canvas 内的相对坐标
 * @param event - PointerEvent 对象
 * @returns 相对于 Canvas 左上角的坐标
 */
function getEventPosition(event: PointerEvent): { x: number; y: number } {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

/**
 * 处理指针按下事件（开始绘制）
 * @param event - PointerEvent 对象
 */
function onPointerDown(event: PointerEvent): void {
  event.preventDefault()
  const canvas = canvasRef.value
  if (canvas) {
    canvas.setPointerCapture(event.pointerId)
  }
  isDrawing.value = true
  lastPoint.value = getEventPosition(event)
}

/**
 * 处理指针移动事件（绘制线条）
 * @param event - PointerEvent 对象
 */
function onPointerMove(event: PointerEvent): void {
  if (!isDrawing.value || !ctx || !lastPoint.value) return
  event.preventDefault()

  const pos = getEventPosition(event)
  drawLine(lastPoint.value, pos)
  lastPoint.value = pos
}

/**
 * 处理指针抬起/取消/离开事件（结束绘制）
 */
function onPointerUp(): void {
  if (!isDrawing.value) return
  isDrawing.value = false
  lastPoint.value = null
  emitChange()
}

/**
 * 在 Canvas 上绘制线条
 * @param from - 起始点坐标
 * @param to - 终点坐标
 */
function drawLine(from: { x: number; y: number }, to: { x: number; y: number }): void {
  if (!ctx) return

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = props.strokeColor
  ctx.lineWidth = props.strokeWidth
  ctx.stroke()
}

/**
 * 清空画布（填充背景色）
 * @public 可通过组件 ref 调用
 */
function clear(): void {
  if (!ctx || !canvasRef.value) return

  ctx.fillStyle = props.bgColor
  ctx.fillRect(0, 0, props.width, props.height)
}

/**
 * 获取签名的 base64 图片数据
 * @public 可通过组件 ref 调用
 * @returns Promise<string> - PNG 格式的 base64 数据 URL
 */
function getImage(): Promise<string> {
  return new Promise((resolve) => {
    if (!canvasRef.value) {
      resolve('')
      return
    }
    resolve(canvasRef.value.toDataURL('image/png'))
  })
}

/**
 * 触发 change 事件
 */
async function emitChange(): Promise<void> {
  const base64 = await getImage()
  emit('change', base64)
}

/**
 * 处理确认按钮点击
 */
async function onConfirm(): Promise<void> {
  const base64 = await getImage()
  emit('confirm', base64)
}

/**
 * 暴露给父组件的方法
 * - clear(): 清空画布
 * - getImage(): 获取 base64 图片
 */
defineExpose({
  clear,
  getImage,
})
</script>

<style lang="scss" scoped>
.signature-canvas {
  display: inline-block;

  &__canvas {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    display: block;
    touch-action: none; /* 防止触摸时页面滚动 */
    cursor: crosshair;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &__btn {
    &--clear {
      background-color: transparent;
      border: 1px solid #d9d9d9;
      color: #666;

      &:hover {
        border-color: #40a9ff;
        color: #40a9ff;
      }
    }

    &--confirm {
      background-color: var(--primary, #1890ff);
      color: #fff;

      &:hover {
        background-color: var(--primary-hover, #40a9ff);
      }
    }
  }
}
</style>
