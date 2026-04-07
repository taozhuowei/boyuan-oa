<template>
  <view class="signature-canvas">
    <canvas
      canvas-id="signature-canvas"
      :id="canvasId"
      :style="{ width: props.width + 'px', height: props.height + 'px' }"
      class="signature-canvas__canvas"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    />
    <view class="signature-canvas__actions">
      <button class="signature-canvas__btn signature-canvas__btn--clear" @click="clear">
        Clear
      </button>
      <button class="signature-canvas__btn signature-canvas__btn--confirm" @click="onConfirm">
        Confirm
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * SignatureCanvas — 手写签名画布（小程序专用）
 * 用途：调用 uni.createCanvasContext 在小程序 canvas 上绘制签名，支持导出图片
 * 数据流：触摸事件 → mpCtx 绘制 → uni.canvasToTempFilePath → base64 emit
 */
import { ref, onMounted, getCurrentInstance } from 'vue'

interface Props {
  width?: number
  height?: number
  strokeColor?: string
  strokeWidth?: number
  bgColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 150,
  strokeColor: '#003466',
  strokeWidth: 2,
  bgColor: '#ffffff',
})

const emit = defineEmits<{
  change: [base64: string]
  confirm: [base64: string]
}>()

const canvasId = 'signature-canvas'
const isDrawing = ref(false)
const lastPoint = ref<{ x: number; y: number } | null>(null)

let mpCtx: UniApp.CanvasContext | null = null

onMounted(() => {
  initCanvas()
})

function initCanvas() {
  mpCtx = uni.createCanvasContext(canvasId, getCurrentInstance()?.proxy)
  if (mpCtx) {
    mpCtx.setLineCap('round')
    mpCtx.setLineJoin('round')
    clear()
  }
}

function getEventPosition(event: TouchEvent): { x: number; y: number } {
  if ('touches' in event && event.touches.length > 0) {
    return {
      x: (event.touches[0] as any).x,
      y: (event.touches[0] as any).y,
    }
  }
  return { x: 0, y: 0 }
}

function onTouchStart(event: TouchEvent) {
  isDrawing.value = true
  lastPoint.value = getEventPosition(event)
}

function onTouchMove(event: TouchEvent) {
  if (!isDrawing.value || !mpCtx || !lastPoint.value) return
  event.preventDefault()
  const pos = getEventPosition(event)
  drawLine(lastPoint.value, pos)
  lastPoint.value = pos
}

function onTouchEnd() {
  isDrawing.value = false
  lastPoint.value = null
  emitChange()
}

function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
  if (!mpCtx) return
  mpCtx.beginPath()
  mpCtx.moveTo(from.x, from.y)
  mpCtx.lineTo(to.x, to.y)
  mpCtx.setStrokeStyle(props.strokeColor)
  mpCtx.setLineWidth(props.strokeWidth)
  mpCtx.stroke()
  mpCtx.draw(true)
}

function clear() {
  if (!mpCtx) return
  mpCtx.setFillStyle(props.bgColor)
  mpCtx.fillRect(0, 0, props.width, props.height)
  mpCtx.draw()
}

function getImage(): Promise<string> {
  return new Promise((resolve) => {
    uni.canvasToTempFilePath({
      canvasId,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(''),
    })
  })
}

async function emitChange() {
  const base64 = await getImage()
  emit('change', base64)
}

async function onConfirm() {
  const base64 = await getImage()
  emit('confirm', base64)
}

defineExpose({ clear, getImage })
</script>

<style lang="scss" scoped>
.signature-canvas {
  display: inline-block;

  &__canvas {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    display: block;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &__btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;

    &:active {
      opacity: 0.8;
    }

    &--clear {
      background-color: transparent;
      border: 1px solid #d9d9d9;
      color: #666;
    }

    &--confirm {
      background-color: var(--primary, #007aff);
      color: #fff;
    }
  }
}
</style>
