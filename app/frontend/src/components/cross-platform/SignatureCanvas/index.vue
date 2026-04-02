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
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
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
import { ref, onMounted, getCurrentInstance } from 'vue';

interface Props {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  height: 150,
  strokeColor: '#003466',
  strokeWidth: 2,
  bgColor: '#ffffff',
});

const emit = defineEmits<{
  change: [base64: string];
  confirm: [base64: string];
}>();

const canvasId = 'signature-canvas';
const isDrawing = ref(false);
const lastPoint = ref<{ x: number; y: number } | null>(null);

// #ifdef H5
let canvasEl: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
// #endif

// #ifdef MP-WEIXIN
let mpCtx: UniApp.CanvasContext | null = null;
// #endif

onMounted(() => {
  initCanvas();
});

function initCanvas() {
  // #ifdef H5
  canvasEl = document.getElementById(canvasId) as HTMLCanvasElement;
  if (canvasEl) {
    canvasEl.width = props.width;
    canvasEl.height = props.height;
    ctx = canvasEl.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    // Fill background
    clear();
  }
  // #endif

  // #ifdef MP-WEIXIN
  mpCtx = uni.createCanvasContext(canvasId, getCurrentInstance()?.proxy);
  if (mpCtx) {
    mpCtx.setLineCap('round');
    mpCtx.setLineJoin('round');
    clear();
  }
  // #endif
}

function getEventPosition(event: TouchEvent | MouseEvent): { x: number; y: number } {
  // #ifdef H5
  if ('touches' in event && event.touches.length > 0) {
    const rect = canvasEl!.getBoundingClientRect();
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top,
    };
  } else if ('clientX' in event) {
    const rect = canvasEl!.getBoundingClientRect();
    return {
      x: (event as MouseEvent).clientX - rect.left,
      y: (event as MouseEvent).clientY - rect.top,
    };
  }
  // #endif

  // #ifdef MP-WEIXIN
  if ('touches' in event && event.touches.length > 0) {
    return {
      x: (event.touches[0] as any).x,
      y: (event.touches[0] as any).y,
    };
  }
  // #endif

  return { x: 0, y: 0 };
}

function onTouchStart(event: TouchEvent) {
  // #ifdef MP-WEIXIN
  isDrawing.value = true;
  const pos = getEventPosition(event);
  lastPoint.value = pos;
  // #endif
}

function onTouchMove(event: TouchEvent) {
  // #ifdef MP-WEIXIN
  if (!isDrawing.value || !mpCtx || !lastPoint.value) return;
  event.preventDefault();
  const pos = getEventPosition(event);
  drawLine(lastPoint.value, pos);
  lastPoint.value = pos;
  // #endif
}

function onTouchEnd() {
  // #ifdef MP-WEIXIN
  isDrawing.value = false;
  lastPoint.value = null;
  emitChange();
  // #endif
}

function onMouseDown(event: MouseEvent) {
  // #ifdef H5
  isDrawing.value = true;
  const pos = getEventPosition(event);
  lastPoint.value = pos;
  // #endif
}

function onMouseMove(event: MouseEvent) {
  // #ifdef H5
  if (!isDrawing.value || !ctx || !lastPoint.value) return;
  const pos = getEventPosition(event);
  drawLine(lastPoint.value, pos);
  lastPoint.value = pos;
  // #endif
}

function onMouseUp() {
  // #ifdef H5
  isDrawing.value = false;
  lastPoint.value = null;
  emitChange();
  // #endif
}

function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
  // #ifdef H5
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = props.strokeColor;
  ctx.lineWidth = props.strokeWidth;
  ctx.stroke();
  // #endif

  // #ifdef MP-WEIXIN
  if (!mpCtx) return;
  mpCtx.beginPath();
  mpCtx.moveTo(from.x, from.y);
  mpCtx.lineTo(to.x, to.y);
  mpCtx.setStrokeStyle(props.strokeColor);
  mpCtx.setLineWidth(props.strokeWidth);
  mpCtx.stroke();
  mpCtx.draw(true);
  // #endif
}

function clear() {
  // #ifdef H5
  if (!ctx || !canvasEl) return;
  ctx.fillStyle = props.bgColor;
  ctx.fillRect(0, 0, props.width, props.height);
  // #endif

  // #ifdef MP-WEIXIN
  if (!mpCtx) return;
  mpCtx.setFillStyle(props.bgColor);
  mpCtx.fillRect(0, 0, props.width, props.height);
  mpCtx.draw();
  // #endif
}

function getImage(): Promise<string> {
  return new Promise((resolve) => {
    // #ifdef H5
    if (!canvasEl) {
      resolve('');
      return;
    }
    resolve(canvasEl.toDataURL('image/png'));
    // #endif

    // #ifdef MP-WEIXIN
    uni.canvasToTempFilePath({
      canvasId: canvasId,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: () => {
        resolve('');
      },
    });
    // #endif
  });
}

async function emitChange() {
  const base64 = await getImage();
  emit('change', base64);
}

async function onConfirm() {
  const base64 = await getImage();
  emit('confirm', base64);
}

defineExpose({
  clear,
  getImage,
});
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
