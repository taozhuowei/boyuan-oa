import { createVNode, cloneVNode, defineComponent, reactive, ref, watch, onUnmounted, onMounted, onBeforeUnmount, computed, shallowRef, toRaw, nextTick, onUpdated, watchEffect, unref, provide, inject, toRefs, isVNode, getCurrentInstance, Transition, withDirectives, vShow, Fragment } from 'vue';
import { ax as ResizeObserver, c as classNames, l as flattenChildren, A as wrapperRaf, av as supportsPassive, P as PropTypes, I as Icon, a3 as useState, j as functionType, ay as toPx, x as objectType, b as cloneElement, g as genComponentStyleHook, m as merge, r as resetComponent, Z as textEllipsis, ae as genFocusStyle, o as omit, e as initDefaultProps, i as isValidElement, az as camelize, V as devWarning, u as useConfigInject, a as CloseOutlined, y as arrayType, D as stringType, f as booleanType, s as someType, af as clearFix, a9 as Keyframe, aH as filterEmptyWithUndefined, au as customRenderSlot, p as isEmptyElement, aI as getPropsSlot, v as vNodeType, z as warning, k as filterEmpty, al as genFocusOutline, aJ as collapseMotion, L as LoadingOutlined, aK as genCollapseMotion } from './collapseMotion.mjs';
import _objectSpread$8 from '@babel/runtime/helpers/esm/objectSpread2';
import _extends from '@babel/runtime/helpers/esm/extends';
import { K as KeyCode, u as useProvideOverride, E as EllipsisOutlined, D as Dropdown, M as Menu, f as MenuItem, i as initSlideMotion, e as eagerComputed } from './index4.mjs';
import { u as useRefs } from './useRefs.mjs';
import pick from 'lodash-es/pick';
import isPlainObject from 'lodash-es/isPlainObject';
import { debounce } from 'throttle-debounce';
import debounce$1 from 'lodash-es/debounce';

const attributes = `accept acceptcharset accesskey action allowfullscreen allowtransparency
alt async autocomplete autofocus autoplay capture cellpadding cellspacing challenge
charset checked classid classname colspan cols content contenteditable contextmenu
controls coords crossorigin data datetime default defer dir disabled download draggable
enctype form formaction formenctype formmethod formnovalidate formtarget frameborder
headers height hidden high href hreflang htmlfor for httpequiv icon id inputmode integrity
is keyparams keytype kind label lang list loop low manifest marginheight marginwidth max maxlength media
mediagroup method min minlength multiple muted name novalidate nonce open
optimum pattern placeholder poster preload radiogroup readonly rel required
reversed role rowspan rows sandbox scope scoped scrolling seamless selected
shape size sizes span spellcheck src srcdoc srclang srcset start step style
summary tabindex target title type usemap value width wmode wrap`;
const eventsName = `onCopy onCut onPaste onCompositionend onCompositionstart onCompositionupdate onKeydown
    onKeypress onKeyup onFocus onBlur onChange onInput onSubmit onClick onContextmenu onDoubleclick onDblclick
    onDrag onDragend onDragenter onDragexit onDragleave onDragover onDragstart onDrop onMousedown
    onMouseenter onMouseleave onMousemove onMouseout onMouseover onMouseup onSelect onTouchcancel
    onTouchend onTouchmove onTouchstart onTouchstartPassive onTouchmovePassive onScroll onWheel onAbort onCanplay onCanplaythrough
    onDurationchange onEmptied onEncrypted onEnded onError onLoadeddata onLoadedmetadata
    onLoadstart onPause onPlay onPlaying onProgress onRatechange onSeeked onSeeking onStalled onSuspend onTimeupdate onVolumechange onWaiting onLoad onError`;
const propList = `${attributes} ${eventsName}`.split(/[\s\n]+/);
/* eslint-enable max-len */
const ariaPrefix = 'aria-';
const dataPrefix = 'data-';
function match(key, prefix) {
  return key.indexOf(prefix) === 0;
}
/**
 * Picker props from exist props with filter
 * @param props Passed props
 * @param ariaOnly boolean | { aria?: boolean; data?: boolean; attr?: boolean; } filter config
 */
function pickAttrs(props) {
  let ariaOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  let mergedConfig;
  if (ariaOnly === false) {
    mergedConfig = {
      aria: true,
      data: true,
      attr: true
    };
  } else if (ariaOnly === true) {
    mergedConfig = {
      aria: true
    };
  } else {
    mergedConfig = _extends({}, ariaOnly);
  }
  const attrs = {};
  Object.keys(props).forEach(key => {
    if (
    // Aria
    mergedConfig.aria && (key === 'role' || match(key, ariaPrefix)) ||
    // Data
    mergedConfig.data && match(key, dataPrefix) ||
    // Attr
    mergedConfig.attr && (propList.includes(key) || propList.includes(key.toLowerCase()))) {
      attrs[key] = props[key];
    }
  });
  return attrs;
}

function createRef() {
  const func = node => {
    func.current = node;
  };
  return func;
}

const isMobile = (() => {
  {
    return false;
  }
});

const Filter = (_ref, _ref2) => {
  let {
    height,
    offset,
    prefixCls,
    onInnerResize
  } = _ref;
  let {
    slots
  } = _ref2;
  var _a;
  let outerStyle = {};
  let innerStyle = {
    display: 'flex',
    flexDirection: 'column'
  };
  if (offset !== undefined) {
    outerStyle = {
      height: `${height}px`,
      position: 'relative',
      overflow: 'hidden'
    };
    innerStyle = _extends(_extends({}, innerStyle), {
      transform: `translateY(${offset}px)`,
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0
    });
  }
  return createVNode("div", {
    "style": outerStyle
  }, [createVNode(ResizeObserver, {
    "onResize": _ref3 => {
      let {
        offsetHeight
      } = _ref3;
      if (offsetHeight && onInnerResize) {
        onInnerResize();
      }
    }
  }, {
    default: () => [createVNode("div", {
      "style": innerStyle,
      "class": classNames({
        [`${prefixCls}-holder-inner`]: prefixCls
      })
    }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)])]
  })]);
};
Filter.displayName = 'Filter';
Filter.inheritAttrs = false;
Filter.props = {
  prefixCls: String,
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: Number,
  /** Set offset of visible items. Should be the top of start item position */
  offset: Number,
  onInnerResize: Function
};

const Item = (_ref, _ref2) => {
  let {
    setRef
  } = _ref;
  let {
    slots
  } = _ref2;
  var _a;
  const children = flattenChildren((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots));
  return children && children.length ? cloneVNode(children[0], {
    ref: setRef
  }) : children;
};
Item.props = {
  setRef: {
    type: Function,
    default: () => {}
  }
};

const MIN_SIZE = 20;
function getPageY(e) {
  return 'touches' in e ? e.touches[0].pageY : e.pageY;
}
const ScrollBar = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ScrollBar',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    scrollTop: Number,
    scrollHeight: Number,
    height: Number,
    count: Number,
    onScroll: {
      type: Function
    },
    onStartMove: {
      type: Function
    },
    onStopMove: {
      type: Function
    }
  },
  setup() {
    return {
      moveRaf: null,
      scrollbarRef: createRef(),
      thumbRef: createRef(),
      visibleTimeout: null,
      state: reactive({
        dragging: false,
        pageY: null,
        startTop: null,
        visible: false
      })
    };
  },
  watch: {
    scrollTop: {
      handler() {
        this.delayHidden();
      },
      flush: 'post'
    }
  },
  mounted() {
    var _a, _b;
    (_a = this.scrollbarRef.current) === null || _a === void 0 ? void 0 : _a.addEventListener('touchstart', this.onScrollbarTouchStart, supportsPassive ? {
      passive: false
    } : false);
    (_b = this.thumbRef.current) === null || _b === void 0 ? void 0 : _b.addEventListener('touchstart', this.onMouseDown, supportsPassive ? {
      passive: false
    } : false);
  },
  beforeUnmount() {
    this.removeEvents();
    clearTimeout(this.visibleTimeout);
  },
  methods: {
    delayHidden() {
      clearTimeout(this.visibleTimeout);
      this.state.visible = true;
      this.visibleTimeout = setTimeout(() => {
        this.state.visible = false;
      }, 2000);
    },
    onScrollbarTouchStart(e) {
      e.preventDefault();
    },
    onContainerMouseDown(e) {
      e.stopPropagation();
      e.preventDefault();
    },
    // ======================= Clean =======================
    patchEvents() {
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      this.thumbRef.current.addEventListener('touchmove', this.onMouseMove, supportsPassive ? {
        passive: false
      } : false);
      this.thumbRef.current.addEventListener('touchend', this.onMouseUp);
    },
    removeEvents() {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
      this.scrollbarRef.current.removeEventListener('touchstart', this.onScrollbarTouchStart, supportsPassive ? {
        passive: false
      } : false);
      if (this.thumbRef.current) {
        this.thumbRef.current.removeEventListener('touchstart', this.onMouseDown, supportsPassive ? {
          passive: false
        } : false);
        this.thumbRef.current.removeEventListener('touchmove', this.onMouseMove, supportsPassive ? {
          passive: false
        } : false);
        this.thumbRef.current.removeEventListener('touchend', this.onMouseUp);
      }
      wrapperRaf.cancel(this.moveRaf);
    },
    // ======================= Thumb =======================
    onMouseDown(e) {
      const {
        onStartMove
      } = this.$props;
      _extends(this.state, {
        dragging: true,
        pageY: getPageY(e),
        startTop: this.getTop()
      });
      onStartMove();
      this.patchEvents();
      e.stopPropagation();
      e.preventDefault();
    },
    onMouseMove(e) {
      const {
        dragging,
        pageY,
        startTop
      } = this.state;
      const {
        onScroll
      } = this.$props;
      wrapperRaf.cancel(this.moveRaf);
      if (dragging) {
        const offsetY = getPageY(e) - pageY;
        const newTop = startTop + offsetY;
        const enableScrollRange = this.getEnableScrollRange();
        const enableHeightRange = this.getEnableHeightRange();
        const ptg = enableHeightRange ? newTop / enableHeightRange : 0;
        const newScrollTop = Math.ceil(ptg * enableScrollRange);
        this.moveRaf = wrapperRaf(() => {
          onScroll(newScrollTop);
        });
      }
    },
    onMouseUp() {
      const {
        onStopMove
      } = this.$props;
      this.state.dragging = false;
      onStopMove();
      this.removeEvents();
    },
    // ===================== Calculate =====================
    getSpinHeight() {
      const {
        height,
        scrollHeight
      } = this.$props;
      let baseHeight = height / scrollHeight * 100;
      baseHeight = Math.max(baseHeight, MIN_SIZE);
      baseHeight = Math.min(baseHeight, height / 2);
      return Math.floor(baseHeight);
    },
    getEnableScrollRange() {
      const {
        scrollHeight,
        height
      } = this.$props;
      return scrollHeight - height || 0;
    },
    getEnableHeightRange() {
      const {
        height
      } = this.$props;
      const spinHeight = this.getSpinHeight();
      return height - spinHeight || 0;
    },
    getTop() {
      const {
        scrollTop
      } = this.$props;
      const enableScrollRange = this.getEnableScrollRange();
      const enableHeightRange = this.getEnableHeightRange();
      if (scrollTop === 0 || enableScrollRange === 0) {
        return 0;
      }
      const ptg = scrollTop / enableScrollRange;
      return ptg * enableHeightRange;
    },
    // Not show scrollbar when height is large than scrollHeight
    showScroll() {
      const {
        height,
        scrollHeight
      } = this.$props;
      return scrollHeight > height;
    }
  },
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      dragging,
      visible
    } = this.state;
    const {
      prefixCls
    } = this.$props;
    const spinHeight = this.getSpinHeight() + 'px';
    const top = this.getTop() + 'px';
    const canScroll = this.showScroll();
    const mergedVisible = canScroll && visible;
    return createVNode("div", {
      "ref": this.scrollbarRef,
      "class": classNames(`${prefixCls}-scrollbar`, {
        [`${prefixCls}-scrollbar-show`]: canScroll
      }),
      "style": {
        width: '8px',
        top: 0,
        bottom: 0,
        right: 0,
        position: 'absolute',
        display: mergedVisible ? undefined : 'none'
      },
      "onMousedown": this.onContainerMouseDown,
      "onMousemove": this.delayHidden
    }, [createVNode("div", {
      "ref": this.thumbRef,
      "class": classNames(`${prefixCls}-scrollbar-thumb`, {
        [`${prefixCls}-scrollbar-thumb-moving`]: dragging
      }),
      "style": {
        width: '100%',
        height: spinHeight,
        top,
        left: 0,
        position: 'absolute',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '99px',
        cursor: 'pointer',
        userSelect: 'none'
      },
      "onMousedown": this.onMouseDown
    }, null)]);
  }
});

function useHeights(mergedData, getKey, onItemAdd, onItemRemove) {
  const instance = new Map();
  const heights = new Map();
  const updatedMark = ref(Symbol('update'));
  watch(mergedData, () => {
    updatedMark.value = Symbol('update');
  });
  let collectRaf = undefined;
  function cancelRaf() {
    wrapperRaf.cancel(collectRaf);
  }
  function collectHeight() {
    cancelRaf();
    collectRaf = wrapperRaf(() => {
      instance.forEach((element, key) => {
        if (element && element.offsetParent) {
          const {
            offsetHeight
          } = element;
          if (heights.get(key) !== offsetHeight) {
            //changed = true;
            updatedMark.value = Symbol('update');
            heights.set(key, element.offsetHeight);
          }
        }
      });
    });
  }
  function setInstance(item, ins) {
    const key = getKey(item);
    instance.get(key);
    if (ins) {
      instance.set(key, ins.$el || ins);
      collectHeight();
    } else {
      instance.delete(key);
    }
  }
  onUnmounted(() => {
    cancelRaf();
  });
  return [setInstance, collectHeight, heights, updatedMark];
}

function useScrollTo(containerRef, mergedData, heights, props, getKey, collectHeight, syncScrollTop, triggerFlash) {
  let scroll;
  return arg => {
    // When not argument provided, we think dev may want to show the scrollbar
    if (arg === null || arg === undefined) {
      triggerFlash();
      return;
    }
    // Normal scroll logic
    wrapperRaf.cancel(scroll);
    const data = mergedData.value;
    const itemHeight = props.itemHeight;
    if (typeof arg === 'number') {
      syncScrollTop(arg);
    } else if (arg && typeof arg === 'object') {
      let index;
      const {
        align
      } = arg;
      if ('index' in arg) {
        ({
          index
        } = arg);
      } else {
        index = data.findIndex(item => getKey(item) === arg.key);
      }
      const {
        offset = 0
      } = arg;
      // We will retry 3 times in case dynamic height shaking
      const syncScroll = (times, targetAlign) => {
        if (times < 0 || !containerRef.value) return;
        const height = containerRef.value.clientHeight;
        let needCollectHeight = false;
        let newTargetAlign = targetAlign;
        // Go to next frame if height not exist
        if (height) {
          const mergedAlign = targetAlign || align;
          // Get top & bottom
          let stackTop = 0;
          let itemTop = 0;
          let itemBottom = 0;
          const maxLen = Math.min(data.length, index);
          for (let i = 0; i <= maxLen; i += 1) {
            const key = getKey(data[i]);
            itemTop = stackTop;
            const cacheHeight = heights.get(key);
            itemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);
            stackTop = itemBottom;
            if (i === index && cacheHeight === undefined) {
              needCollectHeight = true;
            }
          }
          const scrollTop = containerRef.value.scrollTop;
          // Scroll to
          let targetTop = null;
          switch (mergedAlign) {
            case 'top':
              targetTop = itemTop - offset;
              break;
            case 'bottom':
              targetTop = itemBottom - height + offset;
              break;
            default:
              {
                const scrollBottom = scrollTop + height;
                if (itemTop < scrollTop) {
                  newTargetAlign = 'top';
                } else if (itemBottom > scrollBottom) {
                  newTargetAlign = 'bottom';
                }
              }
          }
          if (targetTop !== null && targetTop !== scrollTop) {
            syncScrollTop(targetTop);
          }
        }
        // We will retry since element may not sync height as it described
        scroll = wrapperRaf(() => {
          if (needCollectHeight) {
            collectHeight();
          }
          syncScroll(times - 1, newTargetAlign);
        }, 2);
      };
      syncScroll(5);
    }
  };
}

const isFF = typeof navigator === 'object' && /Firefox/i.test(navigator.userAgent);

const useOriginScroll = ((isScrollAtTop, isScrollAtBottom) => {
  // Do lock for a wheel when scrolling
  let lock = false;
  let lockTimeout = null;
  function lockScroll() {
    clearTimeout(lockTimeout);
    lock = true;
    lockTimeout = setTimeout(() => {
      lock = false;
    }, 50);
  }
  return function (deltaY) {
    let smoothOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const originScroll =
    // Pass origin wheel when on the top
    deltaY < 0 && isScrollAtTop.value ||
    // Pass origin wheel when on the bottom
    deltaY > 0 && isScrollAtBottom.value;
    if (smoothOffset && originScroll) {
      // No need lock anymore when it's smooth offset from touchMove interval
      clearTimeout(lockTimeout);
      lock = false;
    } else if (!originScroll || lock) {
      lockScroll();
    }
    return !lock && originScroll;
  };
});

function useFrameWheel(inVirtual, isScrollAtTop, isScrollAtBottom, onWheelDelta) {
  let offsetRef = 0;
  let nextFrame = null;
  // Firefox patch
  let wheelValue = null;
  let isMouseScroll = false;
  // Scroll status sync
  const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom);
  function onWheel(event) {
    if (!inVirtual.value) return;
    wrapperRaf.cancel(nextFrame);
    const {
      deltaY
    } = event;
    offsetRef += deltaY;
    wheelValue = deltaY;
    // Do nothing when scroll at the edge, Skip check when is in scroll
    if (originScroll(deltaY)) return;
    // Proxy of scroll events
    if (!isFF) {
      event.preventDefault();
    }
    nextFrame = wrapperRaf(() => {
      // Patch a multiple for Firefox to fix wheel number too small
      // ref: https://github.com/ant-design/ant-design/issues/26372#issuecomment-679460266
      const patchMultiple = isMouseScroll ? 10 : 1;
      onWheelDelta(offsetRef * patchMultiple);
      offsetRef = 0;
    });
  }
  // A patch for firefox
  function onFireFoxScroll(event) {
    if (!inVirtual.value) return;
    isMouseScroll = event.detail === wheelValue;
  }
  return [onWheel, onFireFoxScroll];
}

const SMOOTH_PTG = 14 / 15;
function useMobileTouchMove(inVirtual, listRef, callback) {
  let touched = false;
  let touchY = 0;
  let element = null;
  // Smooth scroll
  let interval = null;
  const cleanUpEvents = () => {
    if (element) {
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    }
  };
  const onTouchMove = e => {
    if (touched) {
      const currentY = Math.ceil(e.touches[0].pageY);
      let offsetY = touchY - currentY;
      touchY = currentY;
      if (callback(offsetY)) {
        e.preventDefault();
      }
      // Smooth interval
      clearInterval(interval);
      interval = setInterval(() => {
        offsetY *= SMOOTH_PTG;
        if (!callback(offsetY, true) || Math.abs(offsetY) <= 0.1) {
          clearInterval(interval);
        }
      }, 16);
    }
  };
  const onTouchEnd = () => {
    touched = false;
    cleanUpEvents();
  };
  const onTouchStart = e => {
    cleanUpEvents();
    if (e.touches.length === 1 && !touched) {
      touched = true;
      touchY = Math.ceil(e.touches[0].pageY);
      element = e.target;
      element.addEventListener('touchmove', onTouchMove, {
        passive: false
      });
      element.addEventListener('touchend', onTouchEnd);
    }
  };
  const noop = () => {};
  onMounted(() => {
    document.addEventListener('touchmove', noop, {
      passive: false
    });
    watch(inVirtual, val => {
      listRef.value.removeEventListener('touchstart', onTouchStart);
      cleanUpEvents();
      clearInterval(interval);
      if (val) {
        listRef.value.addEventListener('touchstart', onTouchStart, {
          passive: false
        });
      }
    }, {
      immediate: true
    });
  });
  onBeforeUnmount(() => {
    document.removeEventListener('touchmove', noop);
  });
}

var __rest$6 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const EMPTY_DATA = [];
const ScrollStyle = {
  overflowY: 'auto',
  overflowAnchor: 'none'
};
function renderChildren(list, startIndex, endIndex, setNodeRef, renderFunc, _ref) {
  let {
    getKey
  } = _ref;
  return list.slice(startIndex, endIndex + 1).map((item, index) => {
    const eleIndex = startIndex + index;
    const node = renderFunc(item, eleIndex, {
      // style: status === 'MEASURE_START' ? { visibility: 'hidden' } : {},
    });
    const key = getKey(item);
    return createVNode(Item, {
      "key": key,
      "setRef": ele => setNodeRef(item, ele)
    }, {
      default: () => [node]
    });
  });
}
const List = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'List',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    data: PropTypes.array,
    height: Number,
    itemHeight: Number,
    /** If not match virtual scroll condition, Set List still use height of container. */
    fullHeight: {
      type: Boolean,
      default: undefined
    },
    itemKey: {
      type: [String, Number, Function],
      required: true
    },
    component: {
      type: [String, Object]
    },
    /** Set `false` will always use real scroll instead of virtual one */
    virtual: {
      type: Boolean,
      default: undefined
    },
    children: Function,
    onScroll: Function,
    onMousedown: Function,
    onMouseenter: Function,
    onVisibleChange: Function
  },
  setup(props, _ref2) {
    let {
      expose
    } = _ref2;
    // ================================= MISC =================================
    const useVirtual = computed(() => {
      const {
        height,
        itemHeight,
        virtual
      } = props;
      return !!(virtual !== false && height && itemHeight);
    });
    const inVirtual = computed(() => {
      const {
        height,
        itemHeight,
        data
      } = props;
      return useVirtual.value && data && itemHeight * data.length > height;
    });
    const state = reactive({
      scrollTop: 0,
      scrollMoving: false
    });
    const data = computed(() => {
      return props.data || EMPTY_DATA;
    });
    const mergedData = shallowRef([]);
    watch(data, () => {
      mergedData.value = toRaw(data.value).slice();
    }, {
      immediate: true
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const itemKey = shallowRef(_item => undefined);
    watch(() => props.itemKey, val => {
      if (typeof val === 'function') {
        itemKey.value = val;
      } else {
        itemKey.value = item => item === null || item === void 0 ? void 0 : item[val];
      }
    }, {
      immediate: true
    });
    const componentRef = shallowRef();
    const fillerInnerRef = shallowRef();
    const scrollBarRef = shallowRef(); // Hack on scrollbar to enable flash call
    // =============================== Item Key ===============================
    const getKey = item => {
      return itemKey.value(item);
    };
    const sharedConfig = {
      getKey
    };
    // ================================ Scroll ================================
    function syncScrollTop(newTop) {
      let value;
      if (typeof newTop === 'function') {
        value = newTop(state.scrollTop);
      } else {
        value = newTop;
      }
      const alignedTop = keepInRange(value);
      if (componentRef.value) {
        componentRef.value.scrollTop = alignedTop;
      }
      state.scrollTop = alignedTop;
    }
    // ================================ Height ================================
    const [setInstance, collectHeight, heights, updatedMark] = useHeights(mergedData, getKey);
    const calRes = reactive({
      scrollHeight: undefined,
      start: 0,
      end: 0,
      offset: undefined
    });
    const offsetHeight = shallowRef(0);
    onMounted(() => {
      nextTick(() => {
        var _a;
        offsetHeight.value = ((_a = fillerInnerRef.value) === null || _a === void 0 ? void 0 : _a.offsetHeight) || 0;
      });
    });
    onUpdated(() => {
      nextTick(() => {
        var _a;
        offsetHeight.value = ((_a = fillerInnerRef.value) === null || _a === void 0 ? void 0 : _a.offsetHeight) || 0;
      });
    });
    watch([useVirtual, mergedData], () => {
      if (!useVirtual.value) {
        _extends(calRes, {
          scrollHeight: undefined,
          start: 0,
          end: mergedData.value.length - 1,
          offset: undefined
        });
      }
    }, {
      immediate: true
    });
    watch([useVirtual, mergedData, offsetHeight, inVirtual], () => {
      // Always use virtual scroll bar in avoid shaking
      if (useVirtual.value && !inVirtual.value) {
        _extends(calRes, {
          scrollHeight: offsetHeight.value,
          start: 0,
          end: mergedData.value.length - 1,
          offset: undefined
        });
      }
      if (componentRef.value) {
        state.scrollTop = componentRef.value.scrollTop;
      }
    }, {
      immediate: true
    });
    watch([inVirtual, useVirtual, () => state.scrollTop, mergedData, updatedMark, () => props.height, offsetHeight], () => {
      if (!useVirtual.value || !inVirtual.value) {
        return;
      }
      let itemTop = 0;
      let startIndex;
      let startOffset;
      let endIndex;
      const dataLen = mergedData.value.length;
      const data = mergedData.value;
      const scrollTop = state.scrollTop;
      const {
        itemHeight,
        height
      } = props;
      const scrollTopHeight = scrollTop + height;
      for (let i = 0; i < dataLen; i += 1) {
        const item = data[i];
        const key = getKey(item);
        let cacheHeight = heights.get(key);
        if (cacheHeight === undefined) {
          cacheHeight = itemHeight;
        }
        const currentItemBottom = itemTop + cacheHeight;
        if (startIndex === undefined && currentItemBottom >= scrollTop) {
          startIndex = i;
          startOffset = itemTop;
        }
        // Check item bottom in the range. We will render additional one item for motion usage
        if (endIndex === undefined && currentItemBottom > scrollTopHeight) {
          endIndex = i;
        }
        itemTop = currentItemBottom;
      }
      // When scrollTop at the end but data cut to small count will reach this
      if (startIndex === undefined) {
        startIndex = 0;
        startOffset = 0;
        endIndex = Math.ceil(height / itemHeight);
      }
      if (endIndex === undefined) {
        endIndex = dataLen - 1;
      }
      // Give cache to improve scroll experience
      endIndex = Math.min(endIndex + 1, dataLen);
      _extends(calRes, {
        scrollHeight: itemTop,
        start: startIndex,
        end: endIndex,
        offset: startOffset
      });
    }, {
      immediate: true
    });
    // =============================== In Range ===============================
    const maxScrollHeight = computed(() => calRes.scrollHeight - props.height);
    function keepInRange(newScrollTop) {
      let newTop = newScrollTop;
      if (!Number.isNaN(maxScrollHeight.value)) {
        newTop = Math.min(newTop, maxScrollHeight.value);
      }
      newTop = Math.max(newTop, 0);
      return newTop;
    }
    const isScrollAtTop = computed(() => state.scrollTop <= 0);
    const isScrollAtBottom = computed(() => state.scrollTop >= maxScrollHeight.value);
    const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom);
    // ================================ Scroll ================================
    function onScrollBar(newScrollTop) {
      const newTop = newScrollTop;
      syncScrollTop(newTop);
    }
    // When data size reduce. It may trigger native scroll event back to fit scroll position
    function onFallbackScroll(e) {
      var _a;
      const {
        scrollTop: newScrollTop
      } = e.currentTarget;
      if (newScrollTop !== state.scrollTop) {
        syncScrollTop(newScrollTop);
      }
      // Trigger origin onScroll
      (_a = props.onScroll) === null || _a === void 0 ? void 0 : _a.call(props, e);
    }
    // Since this added in global,should use ref to keep update
    const [onRawWheel, onFireFoxScroll] = useFrameWheel(useVirtual, isScrollAtTop, isScrollAtBottom, offsetY => {
      syncScrollTop(top => {
        const newTop = top + offsetY;
        return newTop;
      });
    });
    // Mobile touch move
    useMobileTouchMove(useVirtual, componentRef, (deltaY, smoothOffset) => {
      if (originScroll(deltaY, smoothOffset)) {
        return false;
      }
      onRawWheel({
        preventDefault() {},
        deltaY
      });
      return true;
    });
    // Firefox only
    function onMozMousePixelScroll(e) {
      if (useVirtual.value) {
        e.preventDefault();
      }
    }
    const removeEventListener = () => {
      if (componentRef.value) {
        componentRef.value.removeEventListener('wheel', onRawWheel, supportsPassive ? {
          passive: false
        } : false);
        componentRef.value.removeEventListener('DOMMouseScroll', onFireFoxScroll);
        componentRef.value.removeEventListener('MozMousePixelScroll', onMozMousePixelScroll);
      }
    };
    watchEffect(() => {
      nextTick(() => {
        if (componentRef.value) {
          removeEventListener();
          componentRef.value.addEventListener('wheel', onRawWheel, supportsPassive ? {
            passive: false
          } : false);
          componentRef.value.addEventListener('DOMMouseScroll', onFireFoxScroll);
          componentRef.value.addEventListener('MozMousePixelScroll', onMozMousePixelScroll);
        }
      });
    });
    onBeforeUnmount(() => {
      removeEventListener();
    });
    // ================================= Ref ==================================
    const scrollTo = useScrollTo(componentRef, mergedData, heights, props, getKey, collectHeight, syncScrollTop, () => {
      var _a;
      (_a = scrollBarRef.value) === null || _a === void 0 ? void 0 : _a.delayHidden();
    });
    expose({
      scrollTo
    });
    const componentStyle = computed(() => {
      let cs = null;
      if (props.height) {
        cs = _extends({
          [props.fullHeight ? 'height' : 'maxHeight']: props.height + 'px'
        }, ScrollStyle);
        if (useVirtual.value) {
          cs.overflowY = 'hidden';
          if (state.scrollMoving) {
            cs.pointerEvents = 'none';
          }
        }
      }
      return cs;
    });
    // ================================ Effect ================================
    /** We need told outside that some list not rendered */
    watch([() => calRes.start, () => calRes.end, mergedData], () => {
      if (props.onVisibleChange) {
        const renderList = mergedData.value.slice(calRes.start, calRes.end + 1);
        props.onVisibleChange(renderList, mergedData.value);
      }
    }, {
      flush: 'post'
    });
    const delayHideScrollBar = () => {
      var _a;
      (_a = scrollBarRef.value) === null || _a === void 0 ? void 0 : _a.delayHidden();
    };
    return {
      state,
      mergedData,
      componentStyle,
      onFallbackScroll,
      onScrollBar,
      componentRef,
      useVirtual,
      calRes,
      collectHeight,
      setInstance,
      sharedConfig,
      scrollBarRef,
      fillerInnerRef,
      delayHideScrollBar
    };
  },
  render() {
    const _a = _extends(_extends({}, this.$props), this.$attrs),
      {
        prefixCls = 'rc-virtual-list',
        height,
        itemHeight,
        // eslint-disable-next-line no-unused-vars
        fullHeight,
        data,
        itemKey,
        virtual,
        component: Component = 'div',
        onScroll,
        children = this.$slots.default,
        style,
        class: className
      } = _a,
      restProps = __rest$6(_a, ["prefixCls", "height", "itemHeight", "fullHeight", "data", "itemKey", "virtual", "component", "onScroll", "children", "style", "class"]);
    const mergedClassName = classNames(prefixCls, className);
    const {
      scrollTop
    } = this.state;
    const {
      scrollHeight,
      offset,
      start,
      end
    } = this.calRes;
    const {
      componentStyle,
      onFallbackScroll,
      onScrollBar,
      useVirtual,
      collectHeight,
      sharedConfig,
      setInstance,
      mergedData,
      delayHideScrollBar
    } = this;
    return createVNode("div", _objectSpread$8({
      "style": _extends(_extends({}, style), {
        position: 'relative'
      }),
      "class": mergedClassName
    }, restProps), [createVNode(Component, {
      "class": `${prefixCls}-holder`,
      "style": componentStyle,
      "ref": "componentRef",
      "onScroll": onFallbackScroll,
      "onMouseenter": delayHideScrollBar
    }, {
      default: () => [createVNode(Filter, {
        "prefixCls": prefixCls,
        "height": scrollHeight,
        "offset": offset,
        "onInnerResize": collectHeight,
        "ref": "fillerInnerRef"
      }, {
        default: () => renderChildren(mergedData, start, end, setInstance, children, sharedConfig)
      })]
    }), useVirtual && createVNode(ScrollBar, {
      "ref": "scrollBarRef",
      "prefixCls": prefixCls,
      "scrollTop": scrollTop,
      "height": height,
      "scrollHeight": scrollHeight,
      "count": mergedData.length,
      "onScroll": onScrollBar,
      "onStartMove": () => {
        this.state.scrollMoving = true;
      },
      "onStopMove": () => {
        this.state.scrollMoving = false;
      }
    }, null)]);
  }
});

function useMergedState(defaultStateValue, option) {
  const {
    defaultValue,
    value = ref()
  } = option || {};
  let initValue = typeof defaultStateValue === 'function' ? defaultStateValue() : defaultStateValue;
  if (value.value !== undefined) {
    initValue = unref(value);
  }
  if (defaultValue !== undefined) {
    initValue = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }
  const innerValue = ref(initValue);
  const mergedValue = ref(initValue);
  watchEffect(() => {
    let val = value.value !== undefined ? value.value : innerValue.value;
    if (option.postState) {
      val = option.postState(val);
    }
    mergedValue.value = val;
  });
  function triggerChange(newValue) {
    const preVal = mergedValue.value;
    innerValue.value = newValue;
    if (toRaw(mergedValue.value) !== newValue && option.onChange) {
      option.onChange(newValue, preVal);
    }
  }
  // Effect of reset value to `undefined`
  watch(value, () => {
    innerValue.value = value.value;
  });
  return [mergedValue, triggerChange];
}

// This icon file is generated automatically.
var DownOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z" } }] }, "name": "down", "theme": "outlined" };

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$7(target, key, source[key]); }); } return target; }

function _defineProperty$7(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DownOutlined = function DownOutlined(props, context) {
  var p = _objectSpread$7({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$7({}, p, {
    "icon": DownOutlined$1
  }), null);
};

DownOutlined.displayName = 'DownOutlined';
DownOutlined.inheritAttrs = false;

function useRaf(callback) {
  const rafRef = shallowRef();
  const removedRef = shallowRef(false);
  function trigger() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    if (!removedRef.value) {
      wrapperRaf.cancel(rafRef.value);
      rafRef.value = wrapperRaf(() => {
        callback(...args);
      });
    }
  }
  onBeforeUnmount(() => {
    removedRef.value = true;
    wrapperRaf.cancel(rafRef.value);
  });
  return trigger;
}
function useRafState(defaultState) {
  const batchRef = shallowRef([]);
  const state = shallowRef(typeof defaultState === 'function' ? defaultState() : defaultState);
  const flushUpdate = useRaf(() => {
    let value = state.value;
    batchRef.value.forEach(callback => {
      value = callback(value);
    });
    batchRef.value = [];
    state.value = value;
  });
  function updater(callback) {
    batchRef.value.push(callback);
    flushUpdate();
  }
  return [state, updater];
}

const TabNode = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TabNode',
  props: {
    id: {
      type: String
    },
    prefixCls: {
      type: String
    },
    tab: {
      type: Object
    },
    active: {
      type: Boolean
    },
    closable: {
      type: Boolean
    },
    editable: {
      type: Object
    },
    onClick: {
      type: Function
    },
    onResize: {
      type: Function
    },
    renderWrapper: {
      type: Function
    },
    removeAriaLabel: {
      type: String
    },
    // onRemove: { type: Function as PropType<() => void> },
    onFocus: {
      type: Function
    }
  },
  emits: ['click', 'resize', 'remove', 'focus'],
  setup(props, _ref) {
    let {
      expose,
      attrs
    } = _ref;
    const domRef = ref();
    function onInternalClick(e) {
      var _a;
      if ((_a = props.tab) === null || _a === void 0 ? void 0 : _a.disabled) {
        return;
      }
      props.onClick(e);
    }
    expose({
      domRef
    });
    // onBeforeUnmount(() => {
    //   props.onRemove();
    // });
    function onRemoveTab(event) {
      var _a;
      event.preventDefault();
      event.stopPropagation();
      props.editable.onEdit('remove', {
        key: (_a = props.tab) === null || _a === void 0 ? void 0 : _a.key,
        event
      });
    }
    const removable = computed(() => {
      var _a;
      return props.editable && props.closable !== false && !((_a = props.tab) === null || _a === void 0 ? void 0 : _a.disabled);
    });
    return () => {
      var _a;
      const {
        prefixCls,
        id,
        active,
        tab: {
          key,
          tab,
          disabled,
          closeIcon
        },
        renderWrapper,
        removeAriaLabel,
        editable,
        onFocus
      } = props;
      const tabPrefix = `${prefixCls}-tab`;
      const node = createVNode("div", {
        "key": key,
        "ref": domRef,
        "class": classNames(tabPrefix, {
          [`${tabPrefix}-with-remove`]: removable.value,
          [`${tabPrefix}-active`]: active,
          [`${tabPrefix}-disabled`]: disabled
        }),
        "style": attrs.style,
        "onClick": onInternalClick
      }, [createVNode("div", {
        "role": "tab",
        "aria-selected": active,
        "id": id && `${id}-tab-${key}`,
        "class": `${tabPrefix}-btn`,
        "aria-controls": id && `${id}-panel-${key}`,
        "aria-disabled": disabled,
        "tabindex": disabled ? null : 0,
        "onClick": e => {
          e.stopPropagation();
          onInternalClick(e);
        },
        "onKeydown": e => {
          if ([KeyCode.SPACE, KeyCode.ENTER].includes(e.which)) {
            e.preventDefault();
            onInternalClick(e);
          }
        },
        "onFocus": onFocus
      }, [typeof tab === 'function' ? tab() : tab]), removable.value && createVNode("button", {
        "type": "button",
        "aria-label": removeAriaLabel || 'remove',
        "tabindex": 0,
        "class": `${tabPrefix}-remove`,
        "onClick": e => {
          e.stopPropagation();
          onRemoveTab(e);
        }
      }, [(closeIcon === null || closeIcon === void 0 ? void 0 : closeIcon()) || ((_a = editable.removeIcon) === null || _a === void 0 ? void 0 : _a.call(editable)) || '×'])]);
      return renderWrapper ? renderWrapper(node) : node;
    };
  }
});

const DEFAULT_SIZE$1 = {
  width: 0,
  height: 0,
  left: 0,
  top: 0
};
function useOffsets(tabs, tabSizes) {
  const offsetMap = ref(new Map());
  watchEffect(() => {
    var _a, _b;
    const map = new Map();
    const tabsValue = tabs.value;
    const lastOffset = tabSizes.value.get((_a = tabsValue[0]) === null || _a === void 0 ? void 0 : _a.key) || DEFAULT_SIZE$1;
    const rightOffset = lastOffset.left + lastOffset.width;
    for (let i = 0; i < tabsValue.length; i += 1) {
      const {
        key
      } = tabsValue[i];
      let data = tabSizes.value.get(key);
      // Reuse last one when not exist yet
      if (!data) {
        data = tabSizes.value.get((_b = tabsValue[i - 1]) === null || _b === void 0 ? void 0 : _b.key) || DEFAULT_SIZE$1;
      }
      const entity = map.get(key) || _extends({}, data);
      // Right
      entity.right = rightOffset - entity.left - entity.width;
      // Update entity
      map.set(key, entity);
    }
    offsetMap.value = new Map(map);
  });
  return offsetMap;
}

const AddButton = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AddButton',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    editable: {
      type: Object
    },
    locale: {
      type: Object,
      default: undefined
    }
  },
  setup(props, _ref) {
    let {
      expose,
      attrs
    } = _ref;
    const domRef = ref();
    expose({
      domRef
    });
    return () => {
      const {
        prefixCls,
        editable,
        locale
      } = props;
      if (!editable || editable.showAdd === false) {
        return null;
      }
      return createVNode("button", {
        "ref": domRef,
        "type": "button",
        "class": `${prefixCls}-nav-add`,
        "style": attrs.style,
        "aria-label": (locale === null || locale === void 0 ? void 0 : locale.addAriaLabel) || 'Add tab',
        "onClick": event => {
          editable.onEdit('add', {
            event
          });
        }
      }, [editable.addIcon ? editable.addIcon() : '+']);
    };
  }
});

const operationNodeProps = {
  prefixCls: {
    type: String
  },
  id: {
    type: String
  },
  tabs: {
    type: Object
  },
  rtl: {
    type: Boolean
  },
  tabBarGutter: {
    type: Number
  },
  activeKey: {
    type: [String, Number]
  },
  mobile: {
    type: Boolean
  },
  moreIcon: PropTypes.any,
  moreTransitionName: {
    type: String
  },
  editable: {
    type: Object
  },
  locale: {
    type: Object,
    default: undefined
  },
  removeAriaLabel: String,
  onTabClick: {
    type: Function
  },
  popupClassName: String,
  getPopupContainer: functionType()
};
const OperationNode = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'OperationNode',
  inheritAttrs: false,
  props: operationNodeProps,
  emits: ['tabClick'],
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    // ======================== Dropdown ========================
    const [open, setOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const selectOffset = offset => {
      const enabledTabs = props.tabs.filter(tab => !tab.disabled);
      let selectedIndex = enabledTabs.findIndex(tab => tab.key === selectedKey.value) || 0;
      const len = enabledTabs.length;
      for (let i = 0; i < len; i += 1) {
        selectedIndex = (selectedIndex + offset + len) % len;
        const tab = enabledTabs[selectedIndex];
        if (!tab.disabled) {
          setSelectedKey(tab.key);
          return;
        }
      }
    };
    const onKeyDown = e => {
      const {
        which
      } = e;
      if (!open.value) {
        if ([KeyCode.DOWN, KeyCode.SPACE, KeyCode.ENTER].includes(which)) {
          setOpen(true);
          e.preventDefault();
        }
        return;
      }
      switch (which) {
        case KeyCode.UP:
          selectOffset(-1);
          e.preventDefault();
          break;
        case KeyCode.DOWN:
          selectOffset(1);
          e.preventDefault();
          break;
        case KeyCode.ESC:
          setOpen(false);
          break;
        case KeyCode.SPACE:
        case KeyCode.ENTER:
          if (selectedKey.value !== null) props.onTabClick(selectedKey.value, e);
          break;
      }
    };
    const popupId = computed(() => `${props.id}-more-popup`);
    const selectedItemId = computed(() => selectedKey.value !== null ? `${popupId.value}-${selectedKey.value}` : null);
    const onRemoveTab = (event, key) => {
      event.preventDefault();
      event.stopPropagation();
      props.editable.onEdit('remove', {
        key,
        event
      });
    };
    onMounted(() => {
      watch(selectedKey, () => {
        const ele = document.getElementById(selectedItemId.value);
        if (ele && ele.scrollIntoView) {
          ele.scrollIntoView(false);
        }
      }, {
        flush: 'post',
        immediate: true
      });
    });
    watch(open, () => {
      if (!open.value) {
        setSelectedKey(null);
      }
    });
    useProvideOverride({});
    return () => {
      var _a;
      const {
        prefixCls,
        id,
        tabs,
        locale,
        mobile,
        moreIcon = ((_a = slots.moreIcon) === null || _a === void 0 ? void 0 : _a.call(slots)) || createVNode(EllipsisOutlined, null, null),
        moreTransitionName,
        editable,
        tabBarGutter,
        rtl,
        onTabClick,
        popupClassName
      } = props;
      if (!tabs.length) return null;
      const dropdownPrefix = `${prefixCls}-dropdown`;
      const dropdownAriaLabel = locale === null || locale === void 0 ? void 0 : locale.dropdownAriaLabel;
      // ========================= Render =========================
      const moreStyle = {
        [rtl ? 'marginRight' : 'marginLeft']: tabBarGutter
      };
      if (!tabs.length) {
        moreStyle.visibility = 'hidden';
        moreStyle.order = 1;
      }
      const overlayClassName = classNames({
        [`${dropdownPrefix}-rtl`]: rtl,
        [`${popupClassName}`]: true
      });
      const moreNode = mobile ? null : createVNode(Dropdown, {
        "prefixCls": dropdownPrefix,
        "trigger": ['hover'],
        "visible": open.value,
        "transitionName": moreTransitionName,
        "onVisibleChange": setOpen,
        "overlayClassName": overlayClassName,
        "mouseEnterDelay": 0.1,
        "mouseLeaveDelay": 0.1,
        "getPopupContainer": props.getPopupContainer
      }, {
        overlay: () => createVNode(Menu, {
          "onClick": _ref2 => {
            let {
              key,
              domEvent
            } = _ref2;
            onTabClick(key, domEvent);
            setOpen(false);
          },
          "id": popupId.value,
          "tabindex": -1,
          "role": "listbox",
          "aria-activedescendant": selectedItemId.value,
          "selectedKeys": [selectedKey.value],
          "aria-label": dropdownAriaLabel !== undefined ? dropdownAriaLabel : 'expanded dropdown'
        }, {
          default: () => [tabs.map(tab => {
            var _a, _b;
            const removable = editable && tab.closable !== false && !tab.disabled;
            return createVNode(MenuItem, {
              "key": tab.key,
              "id": `${popupId.value}-${tab.key}`,
              "role": "option",
              "aria-controls": id && `${id}-panel-${tab.key}`,
              "disabled": tab.disabled
            }, {
              default: () => [createVNode("span", null, [typeof tab.tab === 'function' ? tab.tab() : tab.tab]), removable && createVNode("button", {
                "type": "button",
                "aria-label": props.removeAriaLabel || 'remove',
                "tabindex": 0,
                "class": `${dropdownPrefix}-menu-item-remove`,
                "onClick": e => {
                  e.stopPropagation();
                  onRemoveTab(e, tab.key);
                }
              }, [((_a = tab.closeIcon) === null || _a === void 0 ? void 0 : _a.call(tab)) || ((_b = editable.removeIcon) === null || _b === void 0 ? void 0 : _b.call(editable)) || '×'])]
            });
          })]
        }),
        default: () => createVNode("button", {
          "type": "button",
          "class": `${prefixCls}-nav-more`,
          "style": moreStyle,
          "tabindex": -1,
          "aria-hidden": "true",
          "aria-haspopup": "listbox",
          "aria-controls": popupId.value,
          "id": `${id}-more`,
          "aria-expanded": open.value,
          "onKeydown": onKeyDown
        }, [moreIcon])
      });
      return createVNode("div", {
        "class": classNames(`${prefixCls}-nav-operations`, attrs.class),
        "style": attrs.style
      }, [moreNode, createVNode(AddButton, {
        "prefixCls": prefixCls,
        "locale": locale,
        "editable": editable
      }, null)]);
    };
  }
});

const TabsContextKey = Symbol('tabsContextKey');
const useProvideTabs = props => {
  provide(TabsContextKey, props);
};
const useInjectTabs = () => {
  return inject(TabsContextKey, {
    tabs: ref([]),
    prefixCls: ref()
  });
};
defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TabsContextProvider',
  inheritAttrs: false,
  props: {
    tabs: {
      type: Object,
      default: undefined
    },
    prefixCls: {
      type: String,
      default: undefined
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    useProvideTabs(toRefs(props));
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});

const MIN_SWIPE_DISTANCE = 0.1;
const STOP_SWIPE_DISTANCE = 0.01;
const REFRESH_INTERVAL = 20;
const SPEED_OFF_MULTIPLE = Math.pow(0.995, REFRESH_INTERVAL);
// ================================= Hook =================================
function useTouchMove(domRef, onOffset) {
  const [touchPosition, setTouchPosition] = useState();
  const [lastTimestamp, setLastTimestamp] = useState(0);
  const [lastTimeDiff, setLastTimeDiff] = useState(0);
  const [lastOffset, setLastOffset] = useState();
  const motionInterval = ref();
  // ========================= Events =========================
  // >>> Touch events
  function onTouchStart(e) {
    const {
      screenX,
      screenY
    } = e.touches[0];
    setTouchPosition({
      x: screenX,
      y: screenY
    });
    clearInterval(motionInterval.value);
  }
  function onTouchMove(e) {
    if (!touchPosition.value) return;
    e.preventDefault();
    const {
      screenX,
      screenY
    } = e.touches[0];
    const offsetX = screenX - touchPosition.value.x;
    const offsetY = screenY - touchPosition.value.y;
    onOffset(offsetX, offsetY);
    setTouchPosition({
      x: screenX,
      y: screenY
    });
    const now = Date.now();
    setLastTimeDiff(now - lastTimestamp.value);
    setLastTimestamp(now);
    setLastOffset({
      x: offsetX,
      y: offsetY
    });
  }
  function onTouchEnd() {
    if (!touchPosition.value) return;
    const lastOffsetValue = lastOffset.value;
    setTouchPosition(null);
    setLastOffset(null);
    // Swipe if needed
    if (lastOffsetValue) {
      const distanceX = lastOffsetValue.x / lastTimeDiff.value;
      const distanceY = lastOffsetValue.y / lastTimeDiff.value;
      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);
      // Skip swipe if low distance
      if (Math.max(absX, absY) < MIN_SWIPE_DISTANCE) return;
      let currentX = distanceX;
      let currentY = distanceY;
      motionInterval.value = setInterval(() => {
        if (Math.abs(currentX) < STOP_SWIPE_DISTANCE && Math.abs(currentY) < STOP_SWIPE_DISTANCE) {
          clearInterval(motionInterval.value);
          return;
        }
        currentX *= SPEED_OFF_MULTIPLE;
        currentY *= SPEED_OFF_MULTIPLE;
        onOffset(currentX * REFRESH_INTERVAL, currentY * REFRESH_INTERVAL);
      }, REFRESH_INTERVAL);
    }
  }
  // >>> Wheel event
  const lastWheelDirectionRef = ref();
  function onWheel(e) {
    const {
      deltaX,
      deltaY
    } = e;
    // Convert both to x & y since wheel only happened on PC
    let mixed = 0;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX === absY) {
      mixed = lastWheelDirectionRef.value === 'x' ? deltaX : deltaY;
    } else if (absX > absY) {
      mixed = deltaX;
      lastWheelDirectionRef.value = 'x';
    } else {
      mixed = deltaY;
      lastWheelDirectionRef.value = 'y';
    }
    if (onOffset(-mixed, -mixed)) {
      e.preventDefault();
    }
  }
  // ========================= Effect =========================
  const touchEventsRef = ref({
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onWheel
  });
  function onProxyTouchStart(e) {
    touchEventsRef.value.onTouchStart(e);
  }
  function onProxyTouchMove(e) {
    touchEventsRef.value.onTouchMove(e);
  }
  function onProxyTouchEnd(e) {
    touchEventsRef.value.onTouchEnd(e);
  }
  function onProxyWheel(e) {
    touchEventsRef.value.onWheel(e);
  }
  onMounted(() => {
    var _a, _b;
    document.addEventListener('touchmove', onProxyTouchMove, {
      passive: false
    });
    document.addEventListener('touchend', onProxyTouchEnd, {
      passive: false
    });
    // No need to clean up since element removed
    (_a = domRef.value) === null || _a === void 0 ? void 0 : _a.addEventListener('touchstart', onProxyTouchStart, {
      passive: false
    });
    (_b = domRef.value) === null || _b === void 0 ? void 0 : _b.addEventListener('wheel', onProxyWheel, {
      passive: false
    });
  });
  onBeforeUnmount(() => {
    document.removeEventListener('touchmove', onProxyTouchMove);
    document.removeEventListener('touchend', onProxyTouchEnd);
  });
}

function useSyncState(defaultState, onChange) {
  const stateRef = ref(defaultState);
  function setState(updater) {
    const newValue = typeof updater === 'function' ? updater(stateRef.value) : updater;
    if (newValue !== stateRef.value) {
      onChange(newValue, stateRef.value);
    }
    stateRef.value = newValue;
  }
  return [stateRef, setState];
}

const DEFAULT_SIZE = {
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  right: 0
};
const tabNavListProps = () => {
  return {
    id: {
      type: String
    },
    tabPosition: {
      type: String
    },
    activeKey: {
      type: [String, Number]
    },
    rtl: {
      type: Boolean
    },
    animated: objectType(),
    editable: objectType(),
    moreIcon: PropTypes.any,
    moreTransitionName: {
      type: String
    },
    mobile: {
      type: Boolean
    },
    tabBarGutter: {
      type: Number
    },
    renderTabBar: {
      type: Function
    },
    locale: objectType(),
    popupClassName: String,
    getPopupContainer: functionType(),
    onTabClick: {
      type: Function
    },
    onTabScroll: {
      type: Function
    }
  };
};
const getTabSize = (tab, containerRect) => {
  // tabListRef
  const {
    offsetWidth,
    offsetHeight,
    offsetTop,
    offsetLeft
  } = tab;
  const {
    width,
    height,
    x,
    y
  } = tab.getBoundingClientRect();
  // Use getBoundingClientRect to avoid decimal inaccuracy
  if (Math.abs(width - offsetWidth) < 1) {
    return [width, height, x - containerRect.x, y - containerRect.y];
  }
  return [offsetWidth, offsetHeight, offsetLeft, offsetTop];
};
// const getSize = (refObj: ShallowRef<HTMLElement>) => {
//   const { offsetWidth = 0, offsetHeight = 0 } = refObj.value || {};
//   // Use getBoundingClientRect to avoid decimal inaccuracy
//   if (refObj.value) {
//     const { width, height } = refObj.value.getBoundingClientRect();
//     if (Math.abs(width - offsetWidth) < 1) {
//       return [width, height];
//     }
//   }
//   return [offsetWidth, offsetHeight];
// };
const TabNavList = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TabNavList',
  inheritAttrs: false,
  props: tabNavListProps(),
  slots: Object,
  emits: ['tabClick', 'tabScroll'],
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      tabs,
      prefixCls
    } = useInjectTabs();
    const tabsWrapperRef = shallowRef();
    const tabListRef = shallowRef();
    const operationsRef = shallowRef();
    const innerAddButtonRef = shallowRef();
    const [setRef, btnRefs] = useRefs();
    const tabPositionTopOrBottom = computed(() => props.tabPosition === 'top' || props.tabPosition === 'bottom');
    const [transformLeft, setTransformLeft] = useSyncState(0, (next, prev) => {
      if (tabPositionTopOrBottom.value && props.onTabScroll) {
        props.onTabScroll({
          direction: next > prev ? 'left' : 'right'
        });
      }
    });
    const [transformTop, setTransformTop] = useSyncState(0, (next, prev) => {
      if (!tabPositionTopOrBottom.value && props.onTabScroll) {
        props.onTabScroll({
          direction: next > prev ? 'top' : 'bottom'
        });
      }
    });
    const [wrapperScrollWidth, setWrapperScrollWidth] = useState(0);
    const [wrapperScrollHeight, setWrapperScrollHeight] = useState(0);
    const [wrapperWidth, setWrapperWidth] = useState(null);
    const [wrapperHeight, setWrapperHeight] = useState(null);
    const [addWidth, setAddWidth] = useState(0);
    const [addHeight, setAddHeight] = useState(0);
    const [tabSizes, setTabSizes] = useRafState(new Map());
    const tabOffsets = useOffsets(tabs, tabSizes);
    // ========================== Util =========================
    const operationsHiddenClassName = computed(() => `${prefixCls.value}-nav-operations-hidden`);
    const transformMin = shallowRef(0);
    const transformMax = shallowRef(0);
    watchEffect(() => {
      if (!tabPositionTopOrBottom.value) {
        transformMin.value = Math.min(0, wrapperHeight.value - wrapperScrollHeight.value);
        transformMax.value = 0;
      } else if (props.rtl) {
        transformMin.value = 0;
        transformMax.value = Math.max(0, wrapperScrollWidth.value - wrapperWidth.value);
      } else {
        transformMin.value = Math.min(0, wrapperWidth.value - wrapperScrollWidth.value);
        transformMax.value = 0;
      }
    });
    const alignInRange = value => {
      if (value < transformMin.value) {
        return transformMin.value;
      }
      if (value > transformMax.value) {
        return transformMax.value;
      }
      return value;
    };
    // ========================= Mobile ========================
    const touchMovingRef = shallowRef();
    const [lockAnimation, setLockAnimation] = useState();
    const doLockAnimation = () => {
      setLockAnimation(Date.now());
    };
    const clearTouchMoving = () => {
      clearTimeout(touchMovingRef.value);
    };
    const doMove = (setState, offset) => {
      setState(value => {
        const newValue = alignInRange(value + offset);
        return newValue;
      });
    };
    useTouchMove(tabsWrapperRef, (offsetX, offsetY) => {
      if (tabPositionTopOrBottom.value) {
        // Skip scroll if place is enough
        if (wrapperWidth.value >= wrapperScrollWidth.value) {
          return false;
        }
        doMove(setTransformLeft, offsetX);
      } else {
        if (wrapperHeight.value >= wrapperScrollHeight.value) {
          return false;
        }
        doMove(setTransformTop, offsetY);
      }
      clearTouchMoving();
      doLockAnimation();
      return true;
    });
    watch(lockAnimation, () => {
      clearTouchMoving();
      if (lockAnimation.value) {
        touchMovingRef.value = setTimeout(() => {
          setLockAnimation(0);
        }, 100);
      }
    });
    // ========================= Scroll ========================
    const scrollToTab = function () {
      let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : props.activeKey;
      const tabOffset = tabOffsets.value.get(key) || {
        width: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0
      };
      if (tabPositionTopOrBottom.value) {
        // ============ Align with top & bottom ============
        let newTransform = transformLeft.value;
        // RTL
        if (props.rtl) {
          if (tabOffset.right < transformLeft.value) {
            newTransform = tabOffset.right;
          } else if (tabOffset.right + tabOffset.width > transformLeft.value + wrapperWidth.value) {
            newTransform = tabOffset.right + tabOffset.width - wrapperWidth.value;
          }
        }
        // LTR
        else if (tabOffset.left < -transformLeft.value) {
          newTransform = -tabOffset.left;
        } else if (tabOffset.left + tabOffset.width > -transformLeft.value + wrapperWidth.value) {
          newTransform = -(tabOffset.left + tabOffset.width - wrapperWidth.value);
        }
        setTransformTop(0);
        setTransformLeft(alignInRange(newTransform));
      } else {
        // ============ Align with left & right ============
        let newTransform = transformTop.value;
        if (tabOffset.top < -transformTop.value) {
          newTransform = -tabOffset.top;
        } else if (tabOffset.top + tabOffset.height > -transformTop.value + wrapperHeight.value) {
          newTransform = -(tabOffset.top + tabOffset.height - wrapperHeight.value);
        }
        setTransformLeft(0);
        setTransformTop(alignInRange(newTransform));
      }
    };
    const visibleStart = shallowRef(0);
    const visibleEnd = shallowRef(0);
    watchEffect(() => {
      let unit;
      let position;
      let transformSize;
      let basicSize;
      let tabContentSize;
      let addSize;
      const tabOffsetsValue = tabOffsets.value;
      if (['top', 'bottom'].includes(props.tabPosition)) {
        unit = 'width';
        basicSize = wrapperWidth.value;
        tabContentSize = wrapperScrollWidth.value;
        addSize = addWidth.value;
        position = props.rtl ? 'right' : 'left';
        transformSize = Math.abs(transformLeft.value);
      } else {
        unit = 'height';
        basicSize = wrapperHeight.value;
        tabContentSize = wrapperScrollWidth.value;
        addSize = addHeight.value;
        position = 'top';
        transformSize = -transformTop.value;
      }
      let mergedBasicSize = basicSize;
      if (tabContentSize + addSize > basicSize && tabContentSize < basicSize) {
        mergedBasicSize = basicSize - addSize;
      }
      const tabsVal = tabs.value;
      if (!tabsVal.length) {
        return [visibleStart.value, visibleEnd.value] = [0, 0];
      }
      const len = tabsVal.length;
      let endIndex = len;
      for (let i = 0; i < len; i += 1) {
        const offset = tabOffsetsValue.get(tabsVal[i].key) || DEFAULT_SIZE;
        if (offset[position] + offset[unit] > transformSize + mergedBasicSize) {
          endIndex = i - 1;
          break;
        }
      }
      let startIndex = 0;
      for (let i = len - 1; i >= 0; i -= 1) {
        const offset = tabOffsetsValue.get(tabsVal[i].key) || DEFAULT_SIZE;
        if (offset[position] < transformSize) {
          startIndex = i + 1;
          break;
        }
      }
      return [visibleStart.value, visibleEnd.value] = [startIndex, endIndex];
    });
    const updateTabSizes = () => {
      setTabSizes(() => {
        var _a;
        const newSizes = new Map();
        const listRect = (_a = tabListRef.value) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        tabs.value.forEach(_ref2 => {
          let {
            key
          } = _ref2;
          const btnRef = btnRefs.value.get(key);
          const btnNode = (btnRef === null || btnRef === void 0 ? void 0 : btnRef.$el) || btnRef;
          if (btnNode) {
            const [width, height, left, top] = getTabSize(btnNode, listRect);
            newSizes.set(key, {
              width,
              height,
              left,
              top
            });
          }
        });
        return newSizes;
      });
    };
    watch(() => tabs.value.map(tab => tab.key).join('%%'), () => {
      updateTabSizes();
    }, {
      flush: 'post'
    });
    const onListHolderResize = () => {
      var _a, _b, _c, _d, _e;
      // Update wrapper records
      const offsetWidth = ((_a = tabsWrapperRef.value) === null || _a === void 0 ? void 0 : _a.offsetWidth) || 0;
      const offsetHeight = ((_b = tabsWrapperRef.value) === null || _b === void 0 ? void 0 : _b.offsetHeight) || 0;
      const addDom = ((_c = innerAddButtonRef.value) === null || _c === void 0 ? void 0 : _c.$el) || {};
      const newAddWidth = addDom.offsetWidth || 0;
      const newAddHeight = addDom.offsetHeight || 0;
      setWrapperWidth(offsetWidth);
      setWrapperHeight(offsetHeight);
      setAddWidth(newAddWidth);
      setAddHeight(newAddHeight);
      const newWrapperScrollWidth = (((_d = tabListRef.value) === null || _d === void 0 ? void 0 : _d.offsetWidth) || 0) - newAddWidth;
      const newWrapperScrollHeight = (((_e = tabListRef.value) === null || _e === void 0 ? void 0 : _e.offsetHeight) || 0) - newAddHeight;
      setWrapperScrollWidth(newWrapperScrollWidth);
      setWrapperScrollHeight(newWrapperScrollHeight);
      // Update buttons records
      updateTabSizes();
    };
    // ======================== Dropdown =======================
    const hiddenTabs = computed(() => [...tabs.value.slice(0, visibleStart.value), ...tabs.value.slice(visibleEnd.value + 1)]);
    // =================== Link & Operations ===================
    const [inkStyle, setInkStyle] = useState();
    const activeTabOffset = computed(() => tabOffsets.value.get(props.activeKey));
    // Delay set ink style to avoid remove tab blink
    const inkBarRafRef = shallowRef();
    const cleanInkBarRaf = () => {
      wrapperRaf.cancel(inkBarRafRef.value);
    };
    watch([activeTabOffset, tabPositionTopOrBottom, () => props.rtl], () => {
      const newInkStyle = {};
      if (activeTabOffset.value) {
        if (tabPositionTopOrBottom.value) {
          if (props.rtl) {
            newInkStyle.right = toPx(activeTabOffset.value.right);
          } else {
            newInkStyle.left = toPx(activeTabOffset.value.left);
          }
          newInkStyle.width = toPx(activeTabOffset.value.width);
        } else {
          newInkStyle.top = toPx(activeTabOffset.value.top);
          newInkStyle.height = toPx(activeTabOffset.value.height);
        }
      }
      cleanInkBarRaf();
      inkBarRafRef.value = wrapperRaf(() => {
        setInkStyle(newInkStyle);
      });
    });
    watch([() => props.activeKey, activeTabOffset, tabOffsets, tabPositionTopOrBottom], () => {
      scrollToTab();
    }, {
      flush: 'post'
    });
    watch([() => props.rtl, () => props.tabBarGutter, () => props.activeKey, () => tabs.value], () => {
      onListHolderResize();
    }, {
      flush: 'post'
    });
    const ExtraContent = _ref3 => {
      let {
        position,
        prefixCls,
        extra
      } = _ref3;
      if (!extra) return null;
      const content = extra === null || extra === void 0 ? void 0 : extra({
        position
      });
      return content ? createVNode("div", {
        "class": `${prefixCls}-extra-content`
      }, [content]) : null;
    };
    onBeforeUnmount(() => {
      clearTouchMoving();
      cleanInkBarRaf();
    });
    return () => {
      const {
        id,
        animated,
        activeKey,
        rtl,
        editable,
        locale,
        tabPosition,
        tabBarGutter,
        onTabClick
      } = props;
      const {
        class: className,
        style
      } = attrs;
      const pre = prefixCls.value;
      // ========================= Render ========================
      const hasDropdown = !!hiddenTabs.value.length;
      const wrapPrefix = `${pre}-nav-wrap`;
      let pingLeft;
      let pingRight;
      let pingTop;
      let pingBottom;
      if (tabPositionTopOrBottom.value) {
        if (rtl) {
          pingRight = transformLeft.value > 0;
          pingLeft = transformLeft.value + wrapperWidth.value < wrapperScrollWidth.value;
        } else {
          pingLeft = transformLeft.value < 0;
          pingRight = -transformLeft.value + wrapperWidth.value < wrapperScrollWidth.value;
        }
      } else {
        pingTop = transformTop.value < 0;
        pingBottom = -transformTop.value + wrapperHeight.value < wrapperScrollHeight.value;
      }
      const tabNodeStyle = {};
      if (tabPosition === 'top' || tabPosition === 'bottom') {
        tabNodeStyle[rtl ? 'marginRight' : 'marginLeft'] = typeof tabBarGutter === 'number' ? `${tabBarGutter}px` : tabBarGutter;
      } else {
        tabNodeStyle.marginTop = typeof tabBarGutter === 'number' ? `${tabBarGutter}px` : tabBarGutter;
      }
      const tabNodes = tabs.value.map((tab, i) => {
        const {
          key
        } = tab;
        return createVNode(TabNode, {
          "id": id,
          "prefixCls": pre,
          "key": key,
          "tab": tab,
          "style": i === 0 ? undefined : tabNodeStyle,
          "closable": tab.closable,
          "editable": editable,
          "active": key === activeKey,
          "removeAriaLabel": locale === null || locale === void 0 ? void 0 : locale.removeAriaLabel,
          "ref": setRef(key),
          "onClick": e => {
            onTabClick(key, e);
          },
          "onFocus": () => {
            scrollToTab(key);
            doLockAnimation();
            if (!tabsWrapperRef.value) {
              return;
            }
            // Focus element will make scrollLeft change which we should reset back
            if (!rtl) {
              tabsWrapperRef.value.scrollLeft = 0;
            }
            tabsWrapperRef.value.scrollTop = 0;
          }
        }, slots);
      });
      return createVNode("div", {
        "role": "tablist",
        "class": classNames(`${pre}-nav`, className),
        "style": style,
        "onKeydown": () => {
          // No need animation when use keyboard
          doLockAnimation();
        }
      }, [createVNode(ExtraContent, {
        "position": "left",
        "prefixCls": pre,
        "extra": slots.leftExtra
      }, null), createVNode(ResizeObserver, {
        "onResize": onListHolderResize
      }, {
        default: () => [createVNode("div", {
          "class": classNames(wrapPrefix, {
            [`${wrapPrefix}-ping-left`]: pingLeft,
            [`${wrapPrefix}-ping-right`]: pingRight,
            [`${wrapPrefix}-ping-top`]: pingTop,
            [`${wrapPrefix}-ping-bottom`]: pingBottom
          }),
          "ref": tabsWrapperRef
        }, [createVNode(ResizeObserver, {
          "onResize": onListHolderResize
        }, {
          default: () => [createVNode("div", {
            "ref": tabListRef,
            "class": `${pre}-nav-list`,
            "style": {
              transform: `translate(${transformLeft.value}px, ${transformTop.value}px)`,
              transition: lockAnimation.value ? 'none' : undefined
            }
          }, [tabNodes, createVNode(AddButton, {
            "ref": innerAddButtonRef,
            "prefixCls": pre,
            "locale": locale,
            "editable": editable,
            "style": _extends(_extends({}, tabNodes.length === 0 ? undefined : tabNodeStyle), {
              visibility: hasDropdown ? 'hidden' : null
            })
          }, null), createVNode("div", {
            "class": classNames(`${pre}-ink-bar`, {
              [`${pre}-ink-bar-animated`]: animated.inkBar
            }),
            "style": inkStyle.value
          }, null)])]
        })])]
      }), createVNode(OperationNode, _objectSpread$8(_objectSpread$8({}, props), {}, {
        "removeAriaLabel": locale === null || locale === void 0 ? void 0 : locale.removeAriaLabel,
        "ref": operationsRef,
        "prefixCls": pre,
        "tabs": hiddenTabs.value,
        "class": !hasDropdown && operationsHiddenClassName.value
      }), pick(slots, ['moreIcon'])), createVNode(ExtraContent, {
        "position": "right",
        "prefixCls": pre,
        "extra": slots.rightExtra
      }, null), createVNode(ExtraContent, {
        "position": "right",
        "prefixCls": pre,
        "extra": slots.tabBarExtraContent
      }, null)]);
    };
  }
});

const TabPanelList = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TabPanelList',
  inheritAttrs: false,
  props: {
    activeKey: {
      type: [String, Number]
    },
    id: {
      type: String
    },
    rtl: {
      type: Boolean
    },
    animated: {
      type: Object,
      default: undefined
    },
    tabPosition: {
      type: String
    },
    destroyInactiveTabPane: {
      type: Boolean
    }
  },
  setup(props) {
    const {
      tabs,
      prefixCls
    } = useInjectTabs();
    return () => {
      const {
        id,
        activeKey,
        animated,
        tabPosition,
        rtl,
        destroyInactiveTabPane
      } = props;
      const tabPaneAnimated = animated.tabPane;
      const pre = prefixCls.value;
      const activeIndex = tabs.value.findIndex(tab => tab.key === activeKey);
      return createVNode("div", {
        "class": `${pre}-content-holder`
      }, [createVNode("div", {
        "class": [`${pre}-content`, `${pre}-content-${tabPosition}`, {
          [`${pre}-content-animated`]: tabPaneAnimated
        }],
        "style": activeIndex && tabPaneAnimated ? {
          [rtl ? 'marginRight' : 'marginLeft']: `-${activeIndex}00%`
        } : null
      }, [tabs.value.map(tab => {
        return cloneElement(tab.node, {
          key: tab.key,
          prefixCls: pre,
          tabKey: tab.key,
          id,
          animated: tabPaneAnimated,
          active: tab.key === activeKey,
          destroyInactiveTabPane
        });
      })])]);
    };
  }
});

// This icon file is generated automatically.
var PlusOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z" } }, { "tag": "path", "attrs": { "d": "M192 474h672q8 0 8 8v60q0 8-8 8H160q-8 0-8-8v-60q0-8 8-8z" } }] }, "name": "plus", "theme": "outlined" };

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$6(target, key, source[key]); }); } return target; }

function _defineProperty$6(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var PlusOutlined = function PlusOutlined(props, context) {
  var p = _objectSpread$6({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$6({}, p, {
    "icon": PlusOutlined$1
  }), null);
};

PlusOutlined.displayName = 'PlusOutlined';
PlusOutlined.inheritAttrs = false;

const genMotionStyle = token => {
  const {
    componentCls,
    motionDurationSlow
  } = token;
  return [{
    [componentCls]: {
      [`${componentCls}-switch`]: {
        '&-appear, &-enter': {
          transition: 'none',
          '&-start': {
            opacity: 0
          },
          '&-active': {
            opacity: 1,
            transition: `opacity ${motionDurationSlow}`
          }
        },
        '&-leave': {
          position: 'absolute',
          transition: 'none',
          inset: 0,
          '&-start': {
            opacity: 1
          },
          '&-active': {
            opacity: 0,
            transition: `opacity ${motionDurationSlow}`
          }
        }
      }
    }
  },
  // Follow code may reuse in other components
  [initSlideMotion(token, 'slide-up'), initSlideMotion(token, 'slide-down')]];
};

const genCardStyle$1 = token => {
  const {
    componentCls,
    tabsCardHorizontalPadding,
    tabsCardHeadBackground,
    tabsCardGutter,
    colorSplit
  } = token;
  return {
    [`${componentCls}-card`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        [`${componentCls}-tab`]: {
          margin: 0,
          padding: tabsCardHorizontalPadding,
          background: tabsCardHeadBackground,
          border: `${token.lineWidth}px ${token.lineType} ${colorSplit}`,
          transition: `all ${token.motionDurationSlow} ${token.motionEaseInOut}`
        },
        [`${componentCls}-tab-active`]: {
          color: token.colorPrimary,
          background: token.colorBgContainer
        },
        [`${componentCls}-ink-bar`]: {
          visibility: 'hidden'
        }
      },
      // ========================== Top & Bottom ==========================
      [`&${componentCls}-top, &${componentCls}-bottom`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab + ${componentCls}-tab`]: {
            marginLeft: {
              _skip_check_: true,
              value: `${tabsCardGutter}px`
            }
          }
        }
      },
      [`&${componentCls}-top`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`
          },
          [`${componentCls}-tab-active`]: {
            borderBottomColor: token.colorBgContainer
          }
        }
      },
      [`&${componentCls}-bottom`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px`
          },
          [`${componentCls}-tab-active`]: {
            borderTopColor: token.colorBgContainer
          }
        }
      },
      // ========================== Left & Right ==========================
      [`&${componentCls}-left, &${componentCls}-right`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab + ${componentCls}-tab`]: {
            marginTop: `${tabsCardGutter}px`
          }
        }
      },
      [`&${componentCls}-left`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            borderRadius: {
              _skip_check_: true,
              value: `${token.borderRadiusLG}px 0 0 ${token.borderRadiusLG}px`
            }
          },
          [`${componentCls}-tab-active`]: {
            borderRightColor: {
              _skip_check_: true,
              value: token.colorBgContainer
            }
          }
        }
      },
      [`&${componentCls}-right`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            borderRadius: {
              _skip_check_: true,
              value: `0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px 0`
            }
          },
          [`${componentCls}-tab-active`]: {
            borderLeftColor: {
              _skip_check_: true,
              value: token.colorBgContainer
            }
          }
        }
      }
    }
  };
};
const genDropdownStyle = token => {
  const {
    componentCls,
    tabsHoverColor,
    dropdownEdgeChildVerticalPadding
  } = token;
  return {
    [`${componentCls}-dropdown`]: _extends(_extends({}, resetComponent(token)), {
      position: 'absolute',
      top: -9999,
      left: {
        _skip_check_: true,
        value: -9999
      },
      zIndex: token.zIndexPopup,
      display: 'block',
      '&-hidden': {
        display: 'none'
      },
      [`${componentCls}-dropdown-menu`]: {
        maxHeight: token.tabsDropdownHeight,
        margin: 0,
        padding: `${dropdownEdgeChildVerticalPadding}px 0`,
        overflowX: 'hidden',
        overflowY: 'auto',
        textAlign: {
          _skip_check_: true,
          value: 'left'
        },
        listStyleType: 'none',
        backgroundColor: token.colorBgContainer,
        backgroundClip: 'padding-box',
        borderRadius: token.borderRadiusLG,
        outline: 'none',
        boxShadow: token.boxShadowSecondary,
        '&-item': _extends(_extends({}, textEllipsis), {
          display: 'flex',
          alignItems: 'center',
          minWidth: token.tabsDropdownWidth,
          margin: 0,
          padding: `${token.paddingXXS}px ${token.paddingSM}px`,
          color: token.colorText,
          fontWeight: 'normal',
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          cursor: 'pointer',
          transition: `all ${token.motionDurationSlow}`,
          '> span': {
            flex: 1,
            whiteSpace: 'nowrap'
          },
          '&-remove': {
            flex: 'none',
            marginLeft: {
              _skip_check_: true,
              value: token.marginSM
            },
            color: token.colorTextDescription,
            fontSize: token.fontSizeSM,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            '&:hover': {
              color: tabsHoverColor
            }
          },
          '&:hover': {
            background: token.controlItemBgHover
          },
          '&-disabled': {
            '&, &:hover': {
              color: token.colorTextDisabled,
              background: 'transparent',
              cursor: 'not-allowed'
            }
          }
        })
      }
    })
  };
};
const genPositionStyle = token => {
  const {
    componentCls,
    margin,
    colorSplit
  } = token;
  return {
    // ========================== Top & Bottom ==========================
    [`${componentCls}-top, ${componentCls}-bottom`]: {
      flexDirection: 'column',
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        margin: `0 0 ${margin}px 0`,
        '&::before': {
          position: 'absolute',
          right: {
            _skip_check_: true,
            value: 0
          },
          left: {
            _skip_check_: true,
            value: 0
          },
          borderBottom: `${token.lineWidth}px ${token.lineType} ${colorSplit}`,
          content: "''"
        },
        [`${componentCls}-ink-bar`]: {
          height: token.lineWidthBold,
          '&-animated': {
            transition: `width ${token.motionDurationSlow}, left ${token.motionDurationSlow},
            right ${token.motionDurationSlow}`
          }
        },
        [`${componentCls}-nav-wrap`]: {
          '&::before, &::after': {
            top: 0,
            bottom: 0,
            width: token.controlHeight
          },
          '&::before': {
            left: {
              _skip_check_: true,
              value: 0
            },
            boxShadow: token.boxShadowTabsOverflowLeft
          },
          '&::after': {
            right: {
              _skip_check_: true,
              value: 0
            },
            boxShadow: token.boxShadowTabsOverflowRight
          },
          [`&${componentCls}-nav-wrap-ping-left::before`]: {
            opacity: 1
          },
          [`&${componentCls}-nav-wrap-ping-right::after`]: {
            opacity: 1
          }
        }
      }
    },
    [`${componentCls}-top`]: {
      [`> ${componentCls}-nav,
        > div > ${componentCls}-nav`]: {
        '&::before': {
          bottom: 0
        },
        [`${componentCls}-ink-bar`]: {
          bottom: 0
        }
      }
    },
    [`${componentCls}-bottom`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        order: 1,
        marginTop: `${margin}px`,
        marginBottom: 0,
        '&::before': {
          top: 0
        },
        [`${componentCls}-ink-bar`]: {
          top: 0
        }
      },
      [`> ${componentCls}-content-holder, > div > ${componentCls}-content-holder`]: {
        order: 0
      }
    },
    // ========================== Left & Right ==========================
    [`${componentCls}-left, ${componentCls}-right`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        flexDirection: 'column',
        minWidth: token.controlHeight * 1.25,
        // >>>>>>>>>>> Tab
        [`${componentCls}-tab`]: {
          padding: `${token.paddingXS}px ${token.paddingLG}px`,
          textAlign: 'center'
        },
        [`${componentCls}-tab + ${componentCls}-tab`]: {
          margin: `${token.margin}px 0 0 0`
        },
        // >>>>>>>>>>> Nav
        [`${componentCls}-nav-wrap`]: {
          flexDirection: 'column',
          '&::before, &::after': {
            right: {
              _skip_check_: true,
              value: 0
            },
            left: {
              _skip_check_: true,
              value: 0
            },
            height: token.controlHeight
          },
          '&::before': {
            top: 0,
            boxShadow: token.boxShadowTabsOverflowTop
          },
          '&::after': {
            bottom: 0,
            boxShadow: token.boxShadowTabsOverflowBottom
          },
          [`&${componentCls}-nav-wrap-ping-top::before`]: {
            opacity: 1
          },
          [`&${componentCls}-nav-wrap-ping-bottom::after`]: {
            opacity: 1
          }
        },
        // >>>>>>>>>>> Ink Bar
        [`${componentCls}-ink-bar`]: {
          width: token.lineWidthBold,
          '&-animated': {
            transition: `height ${token.motionDurationSlow}, top ${token.motionDurationSlow}`
          }
        },
        [`${componentCls}-nav-list, ${componentCls}-nav-operations`]: {
          flex: '1 0 auto',
          flexDirection: 'column'
        }
      }
    },
    [`${componentCls}-left`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        [`${componentCls}-ink-bar`]: {
          right: {
            _skip_check_: true,
            value: 0
          }
        }
      },
      [`> ${componentCls}-content-holder, > div > ${componentCls}-content-holder`]: {
        marginLeft: {
          _skip_check_: true,
          value: `-${token.lineWidth}px`
        },
        borderLeft: {
          _skip_check_: true,
          value: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`
        },
        [`> ${componentCls}-content > ${componentCls}-tabpane`]: {
          paddingLeft: {
            _skip_check_: true,
            value: token.paddingLG
          }
        }
      }
    },
    [`${componentCls}-right`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        order: 1,
        [`${componentCls}-ink-bar`]: {
          left: {
            _skip_check_: true,
            value: 0
          }
        }
      },
      [`> ${componentCls}-content-holder, > div > ${componentCls}-content-holder`]: {
        order: 0,
        marginRight: {
          _skip_check_: true,
          value: -token.lineWidth
        },
        borderRight: {
          _skip_check_: true,
          value: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`
        },
        [`> ${componentCls}-content > ${componentCls}-tabpane`]: {
          paddingRight: {
            _skip_check_: true,
            value: token.paddingLG
          }
        }
      }
    }
  };
};
const genSizeStyle = token => {
  const {
    componentCls,
    padding
  } = token;
  return {
    [componentCls]: {
      '&-small': {
        [`> ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            padding: `${token.paddingXS}px 0`,
            fontSize: token.fontSize
          }
        }
      },
      '&-large': {
        [`> ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            padding: `${padding}px 0`,
            fontSize: token.fontSizeLG
          }
        }
      }
    },
    [`${componentCls}-card`]: {
      [`&${componentCls}-small`]: {
        [`> ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            padding: `${token.paddingXXS * 1.5}px ${padding}px`
          }
        },
        [`&${componentCls}-bottom`]: {
          [`> ${componentCls}-nav ${componentCls}-tab`]: {
            borderRadius: `0 0 ${token.borderRadius}px ${token.borderRadius}px`
          }
        },
        [`&${componentCls}-top`]: {
          [`> ${componentCls}-nav ${componentCls}-tab`]: {
            borderRadius: `${token.borderRadius}px ${token.borderRadius}px 0 0`
          }
        },
        [`&${componentCls}-right`]: {
          [`> ${componentCls}-nav ${componentCls}-tab`]: {
            borderRadius: {
              _skip_check_: true,
              value: `0 ${token.borderRadius}px ${token.borderRadius}px 0`
            }
          }
        },
        [`&${componentCls}-left`]: {
          [`> ${componentCls}-nav ${componentCls}-tab`]: {
            borderRadius: {
              _skip_check_: true,
              value: `${token.borderRadius}px 0 0 ${token.borderRadius}px`
            }
          }
        }
      },
      [`&${componentCls}-large`]: {
        [`> ${componentCls}-nav`]: {
          [`${componentCls}-tab`]: {
            padding: `${token.paddingXS}px ${padding}px ${token.paddingXXS * 1.5}px`
          }
        }
      }
    }
  };
};
const genTabStyle = token => {
  const {
    componentCls,
    tabsActiveColor,
    tabsHoverColor,
    iconCls,
    tabsHorizontalGutter
  } = token;
  const tabCls = `${componentCls}-tab`;
  return {
    [tabCls]: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      padding: `${token.paddingSM}px 0`,
      fontSize: `${token.fontSize}px`,
      background: 'transparent',
      border: 0,
      outline: 'none',
      cursor: 'pointer',
      '&-btn, &-remove': _extends({
        '&:focus:not(:focus-visible), &:active': {
          color: tabsActiveColor
        }
      }, genFocusStyle(token)),
      '&-btn': {
        outline: 'none',
        transition: 'all 0.3s'
      },
      '&-remove': {
        flex: 'none',
        marginRight: {
          _skip_check_: true,
          value: -token.marginXXS
        },
        marginLeft: {
          _skip_check_: true,
          value: token.marginXS
        },
        color: token.colorTextDescription,
        fontSize: token.fontSizeSM,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        transition: `all ${token.motionDurationSlow}`,
        '&:hover': {
          color: token.colorTextHeading
        }
      },
      '&:hover': {
        color: tabsHoverColor
      },
      [`&${tabCls}-active ${tabCls}-btn`]: {
        color: token.colorPrimary,
        textShadow: token.tabsActiveTextShadow
      },
      [`&${tabCls}-disabled`]: {
        color: token.colorTextDisabled,
        cursor: 'not-allowed'
      },
      [`&${tabCls}-disabled ${tabCls}-btn, &${tabCls}-disabled ${componentCls}-remove`]: {
        '&:focus, &:active': {
          color: token.colorTextDisabled
        }
      },
      [`& ${tabCls}-remove ${iconCls}`]: {
        margin: 0
      },
      [iconCls]: {
        marginRight: {
          _skip_check_: true,
          value: token.marginSM
        }
      }
    },
    [`${tabCls} + ${tabCls}`]: {
      margin: {
        _skip_check_: true,
        value: `0 0 0 ${tabsHorizontalGutter}px`
      }
    }
  };
};
const genRtlStyle = token => {
  const {
    componentCls,
    tabsHorizontalGutter,
    iconCls,
    tabsCardGutter
  } = token;
  const rtlCls = `${componentCls}-rtl`;
  return {
    [rtlCls]: {
      direction: 'rtl',
      [`${componentCls}-nav`]: {
        [`${componentCls}-tab`]: {
          margin: {
            _skip_check_: true,
            value: `0 0 0 ${tabsHorizontalGutter}px`
          },
          [`${componentCls}-tab:last-of-type`]: {
            marginLeft: {
              _skip_check_: true,
              value: 0
            }
          },
          [iconCls]: {
            marginRight: {
              _skip_check_: true,
              value: 0
            },
            marginLeft: {
              _skip_check_: true,
              value: `${token.marginSM}px`
            }
          },
          [`${componentCls}-tab-remove`]: {
            marginRight: {
              _skip_check_: true,
              value: `${token.marginXS}px`
            },
            marginLeft: {
              _skip_check_: true,
              value: `-${token.marginXXS}px`
            },
            [iconCls]: {
              margin: 0
            }
          }
        }
      },
      [`&${componentCls}-left`]: {
        [`> ${componentCls}-nav`]: {
          order: 1
        },
        [`> ${componentCls}-content-holder`]: {
          order: 0
        }
      },
      [`&${componentCls}-right`]: {
        [`> ${componentCls}-nav`]: {
          order: 0
        },
        [`> ${componentCls}-content-holder`]: {
          order: 1
        }
      },
      // ====================== Card ======================
      [`&${componentCls}-card${componentCls}-top, &${componentCls}-card${componentCls}-bottom`]: {
        [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
          [`${componentCls}-tab + ${componentCls}-tab`]: {
            marginRight: {
              _skip_check_: true,
              value: `${tabsCardGutter}px`
            },
            marginLeft: {
              _skip_check_: true,
              value: 0
            }
          }
        }
      }
    },
    [`${componentCls}-dropdown-rtl`]: {
      direction: 'rtl'
    },
    [`${componentCls}-menu-item`]: {
      [`${componentCls}-dropdown-rtl`]: {
        textAlign: {
          _skip_check_: true,
          value: 'right'
        }
      }
    }
  };
};
const genTabsStyle = token => {
  const {
    componentCls,
    tabsCardHorizontalPadding,
    tabsCardHeight,
    tabsCardGutter,
    tabsHoverColor,
    tabsActiveColor,
    colorSplit
  } = token;
  return {
    [componentCls]: _extends(_extends(_extends(_extends({}, resetComponent(token)), {
      display: 'flex',
      // ========================== Navigation ==========================
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        position: 'relative',
        display: 'flex',
        flex: 'none',
        alignItems: 'center',
        [`${componentCls}-nav-wrap`]: {
          position: 'relative',
          display: 'flex',
          flex: 'auto',
          alignSelf: 'stretch',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transform: 'translate(0)',
          // >>>>> Ping shadow
          '&::before, &::after': {
            position: 'absolute',
            zIndex: 1,
            opacity: 0,
            transition: `opacity ${token.motionDurationSlow}`,
            content: "''",
            pointerEvents: 'none'
          }
        },
        [`${componentCls}-nav-list`]: {
          position: 'relative',
          display: 'flex',
          transition: `opacity ${token.motionDurationSlow}`
        },
        // >>>>>>>> Operations
        [`${componentCls}-nav-operations`]: {
          display: 'flex',
          alignSelf: 'stretch'
        },
        [`${componentCls}-nav-operations-hidden`]: {
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none'
        },
        [`${componentCls}-nav-more`]: {
          position: 'relative',
          padding: tabsCardHorizontalPadding,
          background: 'transparent',
          border: 0,
          '&::after': {
            position: 'absolute',
            right: {
              _skip_check_: true,
              value: 0
            },
            bottom: 0,
            left: {
              _skip_check_: true,
              value: 0
            },
            height: token.controlHeightLG / 8,
            transform: 'translateY(100%)',
            content: "''"
          }
        },
        [`${componentCls}-nav-add`]: _extends({
          minWidth: `${tabsCardHeight}px`,
          marginLeft: {
            _skip_check_: true,
            value: `${tabsCardGutter}px`
          },
          padding: `0 ${token.paddingXS}px`,
          background: 'transparent',
          border: `${token.lineWidth}px ${token.lineType} ${colorSplit}`,
          borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`,
          outline: 'none',
          cursor: 'pointer',
          color: token.colorText,
          transition: `all ${token.motionDurationSlow} ${token.motionEaseInOut}`,
          '&:hover': {
            color: tabsHoverColor
          },
          '&:active, &:focus:not(:focus-visible)': {
            color: tabsActiveColor
          }
        }, genFocusStyle(token))
      },
      [`${componentCls}-extra-content`]: {
        flex: 'none'
      },
      // ============================ InkBar ============================
      [`${componentCls}-ink-bar`]: {
        position: 'absolute',
        background: token.colorPrimary,
        pointerEvents: 'none'
      }
    }), genTabStyle(token)), {
      // =========================== TabPanes ===========================
      [`${componentCls}-content`]: {
        position: 'relative',
        display: 'flex',
        width: '100%',
        ['&-animated']: {
          transition: 'margin 0.3s'
        }
      },
      [`${componentCls}-content-holder`]: {
        flex: 'auto',
        minWidth: 0,
        minHeight: 0
      },
      [`${componentCls}-tabpane`]: {
        outline: 'none',
        flex: 'none',
        width: '100%'
      }
    }),
    [`${componentCls}-centered`]: {
      [`> ${componentCls}-nav, > div > ${componentCls}-nav`]: {
        [`${componentCls}-nav-wrap`]: {
          [`&:not([class*='${componentCls}-nav-wrap-ping'])`]: {
            justifyContent: 'center'
          }
        }
      }
    }
  };
};
// ============================== Export ==============================
const useStyle$5 = genComponentStyleHook('Tabs', token => {
  const tabsCardHeight = token.controlHeightLG;
  const tabsToken = merge(token, {
    tabsHoverColor: token.colorPrimaryHover,
    tabsActiveColor: token.colorPrimaryActive,
    tabsCardHorizontalPadding: `${(tabsCardHeight - Math.round(token.fontSize * token.lineHeight)) / 2 - token.lineWidth}px ${token.padding}px`,
    tabsCardHeight,
    tabsCardGutter: token.marginXXS / 2,
    tabsHorizontalGutter: 32,
    tabsCardHeadBackground: token.colorFillAlter,
    dropdownEdgeChildVerticalPadding: token.paddingXXS,
    tabsActiveTextShadow: '0 0 0.25px currentcolor',
    tabsDropdownHeight: 200,
    tabsDropdownWidth: 120
  });
  return [genSizeStyle(tabsToken), genRtlStyle(tabsToken), genPositionStyle(tabsToken), genDropdownStyle(tabsToken), genCardStyle$1(tabsToken), genTabsStyle(tabsToken), genMotionStyle(tabsToken)];
}, token => ({
  zIndexPopup: token.zIndexPopupBase + 50
}));

// Used for accessibility
let uuid = 0;
const tabsProps = () => {
  return {
    prefixCls: {
      type: String
    },
    id: {
      type: String
    },
    popupClassName: String,
    getPopupContainer: functionType(),
    activeKey: {
      type: [String, Number]
    },
    defaultActiveKey: {
      type: [String, Number]
    },
    direction: stringType(),
    animated: someType([Boolean, Object]),
    renderTabBar: functionType(),
    tabBarGutter: {
      type: Number
    },
    tabBarStyle: objectType(),
    tabPosition: stringType(),
    destroyInactiveTabPane: booleanType(),
    hideAdd: Boolean,
    type: stringType(),
    size: stringType(),
    centered: Boolean,
    onEdit: functionType(),
    onChange: functionType(),
    onTabClick: functionType(),
    onTabScroll: functionType(),
    'onUpdate:activeKey': functionType(),
    // Accessibility
    locale: objectType(),
    onPrevClick: functionType(),
    onNextClick: functionType(),
    tabBarExtraContent: PropTypes.any
  };
};
function parseTabList(children) {
  return children.map(node => {
    if (isValidElement(node)) {
      const props = _extends({}, node.props || {});
      for (const [k, v] of Object.entries(props)) {
        delete props[k];
        props[camelize(k)] = v;
      }
      const slots = node.children || {};
      const key = node.key !== undefined ? node.key : undefined;
      const {
        tab = slots.tab,
        disabled,
        forceRender,
        closable,
        animated,
        active,
        destroyInactiveTabPane
      } = props;
      return _extends(_extends({
        key
      }, props), {
        node,
        closeIcon: slots.closeIcon,
        tab,
        disabled: disabled === '' || disabled,
        forceRender: forceRender === '' || forceRender,
        closable: closable === '' || closable,
        animated: animated === '' || animated,
        active: active === '' || active,
        destroyInactiveTabPane: destroyInactiveTabPane === '' || destroyInactiveTabPane
      });
    }
    return null;
  }).filter(tab => tab);
}
const InternalTabs = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'InternalTabs',
  inheritAttrs: false,
  props: _extends(_extends({}, initDefaultProps(tabsProps(), {
    tabPosition: 'top',
    animated: {
      inkBar: true,
      tabPane: false
    }
  })), {
    tabs: arrayType()
  }),
  slots: Object,
  // emits: ['tabClick', 'tabScroll', 'change', 'update:activeKey'],
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    devWarning(!(props.onPrevClick !== undefined) && !(props.onNextClick !== undefined), 'Tabs', '`onPrevClick / @prevClick` and `onNextClick / @nextClick` has been removed. Please use `onTabScroll / @tabScroll` instead.');
    devWarning(!(props.tabBarExtraContent !== undefined), 'Tabs', '`tabBarExtraContent` prop has been removed. Please use `rightExtra` slot instead.');
    devWarning(!(slots.tabBarExtraContent !== undefined), 'Tabs', '`tabBarExtraContent` slot is deprecated. Please use `rightExtra` slot instead.');
    const {
      prefixCls,
      direction,
      size,
      rootPrefixCls,
      getPopupContainer
    } = useConfigInject('tabs', props);
    const [wrapSSR, hashId] = useStyle$5(prefixCls);
    const rtl = computed(() => direction.value === 'rtl');
    const mergedAnimated = computed(() => {
      const {
        animated,
        tabPosition
      } = props;
      if (animated === false || ['left', 'right'].includes(tabPosition)) {
        return {
          inkBar: false,
          tabPane: false
        };
      } else if (animated === true) {
        return {
          inkBar: true,
          tabPane: true
        };
      } else {
        return _extends({
          inkBar: true,
          tabPane: false
        }, typeof animated === 'object' ? animated : {});
      }
    });
    // ======================== Mobile ========================
    const [mobile, setMobile] = useState(false);
    onMounted(() => {
      // Only update on the client side
      setMobile(isMobile());
    });
    // ====================== Active Key ======================
    const [mergedActiveKey, setMergedActiveKey] = useMergedState(() => {
      var _a;
      return (_a = props.tabs[0]) === null || _a === void 0 ? void 0 : _a.key;
    }, {
      value: computed(() => props.activeKey),
      defaultValue: props.defaultActiveKey
    });
    const [activeIndex, setActiveIndex] = useState(() => props.tabs.findIndex(tab => tab.key === mergedActiveKey.value));
    watchEffect(() => {
      var _a;
      let newActiveIndex = props.tabs.findIndex(tab => tab.key === mergedActiveKey.value);
      if (newActiveIndex === -1) {
        newActiveIndex = Math.max(0, Math.min(activeIndex.value, props.tabs.length - 1));
        setMergedActiveKey((_a = props.tabs[newActiveIndex]) === null || _a === void 0 ? void 0 : _a.key);
      }
      setActiveIndex(newActiveIndex);
    });
    // ===================== Accessibility ====================
    const [mergedId, setMergedId] = useMergedState(null, {
      value: computed(() => props.id)
    });
    const mergedTabPosition = computed(() => {
      if (mobile.value && !['left', 'right'].includes(props.tabPosition)) {
        return 'top';
      } else {
        return props.tabPosition;
      }
    });
    onMounted(() => {
      if (!props.id) {
        setMergedId(`rc-tabs-${uuid}`);
        uuid += 1;
      }
    });
    // ======================== Events ========================
    const onInternalTabClick = (key, e) => {
      var _a, _b;
      (_a = props.onTabClick) === null || _a === void 0 ? void 0 : _a.call(props, key, e);
      const isActiveChanged = key !== mergedActiveKey.value;
      setMergedActiveKey(key);
      if (isActiveChanged) {
        (_b = props.onChange) === null || _b === void 0 ? void 0 : _b.call(props, key);
      }
    };
    useProvideTabs({
      tabs: computed(() => props.tabs),
      prefixCls
    });
    return () => {
      const {
        id,
        type,
        tabBarGutter,
        tabBarStyle,
        locale,
        destroyInactiveTabPane,
        renderTabBar = slots.renderTabBar,
        onTabScroll,
        hideAdd,
        centered
      } = props;
      // ======================== Render ========================
      const sharedProps = {
        id: mergedId.value,
        activeKey: mergedActiveKey.value,
        animated: mergedAnimated.value,
        tabPosition: mergedTabPosition.value,
        rtl: rtl.value,
        mobile: mobile.value
      };
      let editable;
      if (type === 'editable-card') {
        editable = {
          onEdit: (editType, _ref2) => {
            let {
              key,
              event
            } = _ref2;
            var _a;
            (_a = props.onEdit) === null || _a === void 0 ? void 0 : _a.call(props, editType === 'add' ? event : key, editType);
          },
          removeIcon: () => createVNode(CloseOutlined, null, null),
          addIcon: slots.addIcon ? slots.addIcon : () => createVNode(PlusOutlined, null, null),
          showAdd: hideAdd !== true
        };
      }
      let tabNavBar;
      const tabNavBarProps = _extends(_extends({}, sharedProps), {
        moreTransitionName: `${rootPrefixCls.value}-slide-up`,
        editable,
        locale,
        tabBarGutter,
        onTabClick: onInternalTabClick,
        onTabScroll,
        style: tabBarStyle,
        getPopupContainer: getPopupContainer.value,
        popupClassName: classNames(props.popupClassName, hashId.value)
      });
      if (renderTabBar) {
        tabNavBar = renderTabBar(_extends(_extends({}, tabNavBarProps), {
          DefaultTabBar: TabNavList
        }));
      } else {
        tabNavBar = createVNode(TabNavList, tabNavBarProps, pick(slots, ['moreIcon', 'leftExtra', 'rightExtra', 'tabBarExtraContent']));
      }
      const pre = prefixCls.value;
      return wrapSSR(createVNode("div", _objectSpread$8(_objectSpread$8({}, attrs), {}, {
        "id": id,
        "class": classNames(pre, `${pre}-${mergedTabPosition.value}`, {
          [hashId.value]: true,
          [`${pre}-${size.value}`]: size.value,
          [`${pre}-card`]: ['card', 'editable-card'].includes(type),
          [`${pre}-editable-card`]: type === 'editable-card',
          [`${pre}-centered`]: centered,
          [`${pre}-mobile`]: mobile.value,
          [`${pre}-editable`]: type === 'editable-card',
          [`${pre}-rtl`]: rtl.value
        }, attrs.class)
      }), [tabNavBar, createVNode(TabPanelList, _objectSpread$8(_objectSpread$8({
        "destroyInactiveTabPane": destroyInactiveTabPane
      }, sharedProps), {}, {
        "animated": mergedAnimated.value
      }), null)]));
    };
  }
});
const Tabs = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATabs',
  inheritAttrs: false,
  props: initDefaultProps(tabsProps(), {
    tabPosition: 'top',
    animated: {
      inkBar: true,
      tabPane: false
    }
  }),
  slots: Object,
  // emits: ['tabClick', 'tabScroll', 'change', 'update:activeKey'],
  setup(props, _ref3) {
    let {
      attrs,
      slots,
      emit
    } = _ref3;
    const handleChange = key => {
      emit('update:activeKey', key);
      emit('change', key);
    };
    return () => {
      var _a;
      const tabs = parseTabList(flattenChildren((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)));
      return createVNode(InternalTabs, _objectSpread$8(_objectSpread$8(_objectSpread$8({}, omit(props, ['onUpdate:activeKey'])), attrs), {}, {
        "onChange": handleChange,
        "tabs": tabs
      }), slots);
    };
  }
});

const tabPaneProps = () => ({
  tab: PropTypes.any,
  disabled: {
    type: Boolean
  },
  forceRender: {
    type: Boolean
  },
  closable: {
    type: Boolean
  },
  animated: {
    type: Boolean
  },
  active: {
    type: Boolean
  },
  destroyInactiveTabPane: {
    type: Boolean
  },
  // Pass by TabPaneList
  prefixCls: {
    type: String
  },
  tabKey: {
    type: [String, Number]
  },
  id: {
    type: String
  }
  // closeIcon: PropTypes.any,
});
const TabPane$1 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATabPane',
  inheritAttrs: false,
  __ANT_TAB_PANE: true,
  props: tabPaneProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const visited = ref(props.forceRender);
    watch([() => props.active, () => props.destroyInactiveTabPane], () => {
      if (props.active) {
        visited.value = true;
      } else if (props.destroyInactiveTabPane) {
        visited.value = false;
      }
    }, {
      immediate: true
    });
    const mergedStyle = computed(() => {
      if (!props.active) {
        if (props.animated) {
          return {
            visibility: 'hidden',
            height: 0,
            overflowY: 'hidden'
          };
        } else {
          return {
            display: 'none'
          };
        }
      }
      return {};
    });
    return () => {
      var _a;
      const {
        prefixCls,
        forceRender,
        id,
        active,
        tabKey
      } = props;
      return createVNode("div", {
        "id": id && `${id}-panel-${tabKey}`,
        "role": "tabpanel",
        "tabindex": active ? 0 : -1,
        "aria-labelledby": id && `${id}-tab-${tabKey}`,
        "aria-hidden": !active,
        "style": [mergedStyle.value, attrs.style],
        "class": [`${prefixCls}-tabpane`, active && `${prefixCls}-tabpane-active`, attrs.class]
      }, [(active || visited.value || forceRender) && ((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots))]);
    };
  }
});

Tabs.TabPane = TabPane$1;
/* istanbul ignore next */
Tabs.install = function (app) {
  app.component(Tabs.name, Tabs);
  app.component(TabPane$1.name, TabPane$1);
  return app;
};

// ============================== Styles ==============================
// ============================== Head ==============================
const genCardHeadStyle = token => {
  const {
    antCls,
    componentCls,
    cardHeadHeight,
    cardPaddingBase,
    cardHeadTabsMarginBottom
  } = token;
  return _extends(_extends({
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    minHeight: cardHeadHeight,
    marginBottom: -1,
    padding: `0 ${cardPaddingBase}px`,
    color: token.colorTextHeading,
    fontWeight: token.fontWeightStrong,
    fontSize: token.fontSizeLG,
    background: 'transparent',
    borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`
  }, clearFix()), {
    '&-wrapper': {
      width: '100%',
      display: 'flex',
      alignItems: 'center'
    },
    '&-title': _extends(_extends({
      display: 'inline-block',
      flex: 1
    }, textEllipsis), {
      [`
          > ${componentCls}-typography,
          > ${componentCls}-typography-edit-content
        `]: {
        insetInlineStart: 0,
        marginTop: 0,
        marginBottom: 0
      }
    }),
    [`${antCls}-tabs-top`]: {
      clear: 'both',
      marginBottom: cardHeadTabsMarginBottom,
      color: token.colorText,
      fontWeight: 'normal',
      fontSize: token.fontSize,
      '&-bar': {
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`
      }
    }
  });
};
// ============================== Grid ==============================
const genCardGridStyle = token => {
  const {
    cardPaddingBase,
    colorBorderSecondary,
    cardShadow,
    lineWidth
  } = token;
  return {
    width: '33.33%',
    padding: cardPaddingBase,
    border: 0,
    borderRadius: 0,
    boxShadow: `
      ${lineWidth}px 0 0 0 ${colorBorderSecondary},
      0 ${lineWidth}px 0 0 ${colorBorderSecondary},
      ${lineWidth}px ${lineWidth}px 0 0 ${colorBorderSecondary},
      ${lineWidth}px 0 0 0 ${colorBorderSecondary} inset,
      0 ${lineWidth}px 0 0 ${colorBorderSecondary} inset;
    `,
    transition: `all ${token.motionDurationMid}`,
    '&-hoverable:hover': {
      position: 'relative',
      zIndex: 1,
      boxShadow: cardShadow
    }
  };
};
// ============================== Actions ==============================
const genCardActionsStyle = token => {
  const {
    componentCls,
    iconCls,
    cardActionsLiMargin,
    cardActionsIconSize,
    colorBorderSecondary
  } = token;
  return _extends(_extends({
    margin: 0,
    padding: 0,
    listStyle: 'none',
    background: token.colorBgContainer,
    borderTop: `${token.lineWidth}px ${token.lineType} ${colorBorderSecondary}`,
    display: 'flex',
    borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px `
  }, clearFix()), {
    '& > li': {
      margin: cardActionsLiMargin,
      color: token.colorTextDescription,
      textAlign: 'center',
      '> span': {
        position: 'relative',
        display: 'block',
        minWidth: token.cardActionsIconSize * 2,
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        cursor: 'pointer',
        '&:hover': {
          color: token.colorPrimary,
          transition: `color ${token.motionDurationMid}`
        },
        [`a:not(${componentCls}-btn), > ${iconCls}`]: {
          display: 'inline-block',
          width: '100%',
          color: token.colorTextDescription,
          lineHeight: `${token.fontSize * token.lineHeight}px`,
          transition: `color ${token.motionDurationMid}`,
          '&:hover': {
            color: token.colorPrimary
          }
        },
        [`> ${iconCls}`]: {
          fontSize: cardActionsIconSize,
          lineHeight: `${cardActionsIconSize * token.lineHeight}px`
        }
      },
      '&:not(:last-child)': {
        borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${colorBorderSecondary}`
      }
    }
  });
};
// ============================== Meta ==============================
const genCardMetaStyle = token => _extends(_extends({
  margin: `-${token.marginXXS}px 0`,
  display: 'flex'
}, clearFix()), {
  '&-avatar': {
    paddingInlineEnd: token.padding
  },
  '&-detail': {
    overflow: 'hidden',
    flex: 1,
    '> div:not(:last-child)': {
      marginBottom: token.marginXS
    }
  },
  '&-title': _extends({
    color: token.colorTextHeading,
    fontWeight: token.fontWeightStrong,
    fontSize: token.fontSizeLG
  }, textEllipsis),
  '&-description': {
    color: token.colorTextDescription
  }
});
// ============================== Inner ==============================
const genCardTypeInnerStyle = token => {
  const {
    componentCls,
    cardPaddingBase,
    colorFillAlter
  } = token;
  return {
    [`${componentCls}-head`]: {
      padding: `0 ${cardPaddingBase}px`,
      background: colorFillAlter,
      '&-title': {
        fontSize: token.fontSize
      }
    },
    [`${componentCls}-body`]: {
      padding: `${token.padding}px ${cardPaddingBase}px`
    }
  };
};
// ============================== Loading ==============================
const genCardLoadingStyle = token => {
  const {
    componentCls
  } = token;
  return {
    overflow: 'hidden',
    [`${componentCls}-body`]: {
      userSelect: 'none'
    }
  };
};
// ============================== Basic ==============================
const genCardStyle = token => {
  const {
    componentCls,
    cardShadow,
    cardHeadPadding,
    colorBorderSecondary,
    boxShadow,
    cardPaddingBase
  } = token;
  return {
    [componentCls]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      [`&:not(${componentCls}-bordered)`]: {
        boxShadow
      },
      [`${componentCls}-head`]: genCardHeadStyle(token),
      [`${componentCls}-extra`]: {
        // https://stackoverflow.com/a/22429853/3040605
        marginInlineStart: 'auto',
        color: '',
        fontWeight: 'normal',
        fontSize: token.fontSize
      },
      [`${componentCls}-body`]: _extends({
        padding: cardPaddingBase,
        borderRadius: ` 0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px`
      }, clearFix()),
      [`${componentCls}-grid`]: genCardGridStyle(token),
      [`${componentCls}-cover`]: {
        '> *': {
          display: 'block',
          width: '100%'
        },
        img: {
          borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`
        }
      },
      [`${componentCls}-actions`]: genCardActionsStyle(token),
      [`${componentCls}-meta`]: genCardMetaStyle(token)
    }),
    [`${componentCls}-bordered`]: {
      border: `${token.lineWidth}px ${token.lineType} ${colorBorderSecondary}`,
      [`${componentCls}-cover`]: {
        marginTop: -1,
        marginInlineStart: -1,
        marginInlineEnd: -1
      }
    },
    [`${componentCls}-hoverable`]: {
      cursor: 'pointer',
      transition: `box-shadow ${token.motionDurationMid}, border-color ${token.motionDurationMid}`,
      '&:hover': {
        borderColor: 'transparent',
        boxShadow: cardShadow
      }
    },
    [`${componentCls}-contain-grid`]: {
      [`${componentCls}-body`]: {
        display: 'flex',
        flexWrap: 'wrap'
      },
      [`&:not(${componentCls}-loading) ${componentCls}-body`]: {
        marginBlockStart: -token.lineWidth,
        marginInlineStart: -token.lineWidth,
        padding: 0
      }
    },
    [`${componentCls}-contain-tabs`]: {
      [`> ${componentCls}-head`]: {
        [`${componentCls}-head-title, ${componentCls}-extra`]: {
          paddingTop: cardHeadPadding
        }
      }
    },
    [`${componentCls}-type-inner`]: genCardTypeInnerStyle(token),
    [`${componentCls}-loading`]: genCardLoadingStyle(token),
    [`${componentCls}-rtl`]: {
      direction: 'rtl'
    }
  };
};
// ============================== Size ==============================
const genCardSizeStyle = token => {
  const {
    componentCls,
    cardPaddingSM,
    cardHeadHeightSM
  } = token;
  return {
    [`${componentCls}-small`]: {
      [`> ${componentCls}-head`]: {
        minHeight: cardHeadHeightSM,
        padding: `0 ${cardPaddingSM}px`,
        fontSize: token.fontSize,
        [`> ${componentCls}-head-wrapper`]: {
          [`> ${componentCls}-extra`]: {
            fontSize: token.fontSize
          }
        }
      },
      [`> ${componentCls}-body`]: {
        padding: cardPaddingSM
      }
    },
    [`${componentCls}-small${componentCls}-contain-tabs`]: {
      [`> ${componentCls}-head`]: {
        [`${componentCls}-head-title, ${componentCls}-extra`]: {
          minHeight: cardHeadHeightSM,
          paddingTop: 0,
          display: 'flex',
          alignItems: 'center'
        }
      }
    }
  };
};
// ============================== Export ==============================
const useStyle$4 = genComponentStyleHook('Card', token => {
  const cardToken = merge(token, {
    cardShadow: token.boxShadowCard,
    cardHeadHeight: token.fontSizeLG * token.lineHeightLG + token.padding * 2,
    cardHeadHeightSM: token.fontSize * token.lineHeight + token.paddingXS * 2,
    cardHeadPadding: token.padding,
    cardPaddingBase: token.paddingLG,
    cardHeadTabsMarginBottom: -token.padding - token.lineWidth,
    cardActionsLiMargin: `${token.paddingSM}px 0`,
    cardActionsIconSize: token.fontSize,
    cardPaddingSM: 12 // Fixed padding.
  });
  return [
  // Style
  genCardStyle(cardToken),
  // Size
  genCardSizeStyle(cardToken)];
});

const skeletonTitleProps = () => ({
  prefixCls: String,
  width: {
    type: [Number, String]
  }
});
const SkeletonTitle = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'SkeletonTitle',
  props: skeletonTitleProps(),
  setup(props) {
    return () => {
      const {
        prefixCls,
        width
      } = props;
      const zWidth = typeof width === 'number' ? `${width}px` : width;
      return createVNode("h3", {
        "class": prefixCls,
        "style": {
          width: zWidth
        }
      }, null);
    };
  }
});

const skeletonParagraphProps = () => ({
  prefixCls: String,
  width: {
    type: [Number, String, Array]
  },
  rows: Number
});
const SkeletonParagraph = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'SkeletonParagraph',
  props: skeletonParagraphProps(),
  setup(props) {
    const getWidth = index => {
      const {
        width,
        rows = 2
      } = props;
      if (Array.isArray(width)) {
        return width[index];
      }
      // last paragraph
      if (rows - 1 === index) {
        return width;
      }
      return undefined;
    };
    return () => {
      const {
        prefixCls,
        rows
      } = props;
      const rowList = [...Array(rows)].map((_, index) => {
        const width = getWidth(index);
        return createVNode("li", {
          "key": index,
          "style": {
            width: typeof width === 'number' ? `${width}px` : width
          }
        }, null);
      });
      return createVNode("ul", {
        "class": prefixCls
      }, [rowList]);
    };
  }
});

const skeletonElementProps = () => ({
  prefixCls: String,
  size: [String, Number],
  shape: String,
  active: {
    type: Boolean,
    default: undefined
  }
});
const Element = props => {
  const {
    prefixCls,
    size,
    shape
  } = props;
  const sizeCls = classNames({
    [`${prefixCls}-lg`]: size === 'large',
    [`${prefixCls}-sm`]: size === 'small'
  });
  const shapeCls = classNames({
    [`${prefixCls}-circle`]: shape === 'circle',
    [`${prefixCls}-square`]: shape === 'square',
    [`${prefixCls}-round`]: shape === 'round'
  });
  const sizeStyle = typeof size === 'number' ? {
    width: `${size}px`,
    height: `${size}px`,
    lineHeight: `${size}px`
  } : {};
  return createVNode("span", {
    "class": classNames(prefixCls, sizeCls, shapeCls),
    "style": sizeStyle
  }, null);
};
Element.displayName = 'SkeletonElement';

const skeletonClsLoading = new Keyframe(`ant-skeleton-loading`, {
  '0%': {
    transform: 'translateX(-37.5%)'
  },
  '100%': {
    transform: 'translateX(37.5%)'
  }
});
const genSkeletonElementCommonSize = size => ({
  height: size,
  lineHeight: `${size}px`
});
const genSkeletonElementAvatarSize = size => _extends({
  width: size
}, genSkeletonElementCommonSize(size));
const genSkeletonColor = token => ({
  position: 'relative',
  // fix https://github.com/ant-design/ant-design/issues/36444
  // https://monshin.github.io/202109/css/safari-border-radius-overflow-hidden/
  /* stylelint-disable-next-line property-no-vendor-prefix,value-no-vendor-prefix */
  zIndex: 0,
  overflow: 'hidden',
  background: 'transparent',
  '&::after': {
    position: 'absolute',
    top: 0,
    insetInlineEnd: '-150%',
    bottom: 0,
    insetInlineStart: '-150%',
    background: token.skeletonLoadingBackground,
    animationName: skeletonClsLoading,
    animationDuration: token.skeletonLoadingMotionDuration,
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
    content: '""'
  }
});
const genSkeletonElementInputSize = size => _extends({
  width: size * 5,
  minWidth: size * 5
}, genSkeletonElementCommonSize(size));
const genSkeletonElementAvatar = token => {
  const {
    skeletonAvatarCls,
    color,
    controlHeight,
    controlHeightLG,
    controlHeightSM
  } = token;
  return {
    [`${skeletonAvatarCls}`]: _extends({
      display: 'inline-block',
      verticalAlign: 'top',
      background: color
    }, genSkeletonElementAvatarSize(controlHeight)),
    [`${skeletonAvatarCls}${skeletonAvatarCls}-circle`]: {
      borderRadius: '50%'
    },
    [`${skeletonAvatarCls}${skeletonAvatarCls}-lg`]: _extends({}, genSkeletonElementAvatarSize(controlHeightLG)),
    [`${skeletonAvatarCls}${skeletonAvatarCls}-sm`]: _extends({}, genSkeletonElementAvatarSize(controlHeightSM))
  };
};
const genSkeletonElementInput = token => {
  const {
    controlHeight,
    borderRadiusSM,
    skeletonInputCls,
    controlHeightLG,
    controlHeightSM,
    color
  } = token;
  return {
    [`${skeletonInputCls}`]: _extends({
      display: 'inline-block',
      verticalAlign: 'top',
      background: color,
      borderRadius: borderRadiusSM
    }, genSkeletonElementInputSize(controlHeight)),
    [`${skeletonInputCls}-lg`]: _extends({}, genSkeletonElementInputSize(controlHeightLG)),
    [`${skeletonInputCls}-sm`]: _extends({}, genSkeletonElementInputSize(controlHeightSM))
  };
};
const genSkeletonElementImageSize = size => _extends({
  width: size
}, genSkeletonElementCommonSize(size));
const genSkeletonElementImage = token => {
  const {
    skeletonImageCls,
    imageSizeBase,
    color,
    borderRadiusSM
  } = token;
  return {
    [`${skeletonImageCls}`]: _extends(_extends({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      verticalAlign: 'top',
      background: color,
      borderRadius: borderRadiusSM
    }, genSkeletonElementImageSize(imageSizeBase * 2)), {
      [`${skeletonImageCls}-path`]: {
        fill: '#bfbfbf'
      },
      [`${skeletonImageCls}-svg`]: _extends(_extends({}, genSkeletonElementImageSize(imageSizeBase)), {
        maxWidth: imageSizeBase * 4,
        maxHeight: imageSizeBase * 4
      }),
      [`${skeletonImageCls}-svg${skeletonImageCls}-svg-circle`]: {
        borderRadius: '50%'
      }
    }),
    [`${skeletonImageCls}${skeletonImageCls}-circle`]: {
      borderRadius: '50%'
    }
  };
};
const genSkeletonElementButtonShape = (token, size, buttonCls) => {
  const {
    skeletonButtonCls
  } = token;
  return {
    [`${buttonCls}${skeletonButtonCls}-circle`]: {
      width: size,
      minWidth: size,
      borderRadius: '50%'
    },
    [`${buttonCls}${skeletonButtonCls}-round`]: {
      borderRadius: size
    }
  };
};
const genSkeletonElementButtonSize = size => _extends({
  width: size * 2,
  minWidth: size * 2
}, genSkeletonElementCommonSize(size));
const genSkeletonElementButton = token => {
  const {
    borderRadiusSM,
    skeletonButtonCls,
    controlHeight,
    controlHeightLG,
    controlHeightSM,
    color
  } = token;
  return _extends(_extends(_extends(_extends(_extends({
    [`${skeletonButtonCls}`]: _extends({
      display: 'inline-block',
      verticalAlign: 'top',
      background: color,
      borderRadius: borderRadiusSM,
      width: controlHeight * 2,
      minWidth: controlHeight * 2
    }, genSkeletonElementButtonSize(controlHeight))
  }, genSkeletonElementButtonShape(token, controlHeight, skeletonButtonCls)), {
    [`${skeletonButtonCls}-lg`]: _extends({}, genSkeletonElementButtonSize(controlHeightLG))
  }), genSkeletonElementButtonShape(token, controlHeightLG, `${skeletonButtonCls}-lg`)), {
    [`${skeletonButtonCls}-sm`]: _extends({}, genSkeletonElementButtonSize(controlHeightSM))
  }), genSkeletonElementButtonShape(token, controlHeightSM, `${skeletonButtonCls}-sm`));
};
// =============================== Base ===============================
const genBaseStyle$1 = token => {
  const {
    componentCls,
    skeletonAvatarCls,
    skeletonTitleCls,
    skeletonParagraphCls,
    skeletonButtonCls,
    skeletonInputCls,
    skeletonImageCls,
    controlHeight,
    controlHeightLG,
    controlHeightSM,
    color,
    padding,
    marginSM,
    borderRadius,
    skeletonTitleHeight,
    skeletonBlockRadius,
    skeletonParagraphLineHeight,
    controlHeightXS,
    skeletonParagraphMarginTop
  } = token;
  return {
    [`${componentCls}`]: {
      display: 'table',
      width: '100%',
      [`${componentCls}-header`]: {
        display: 'table-cell',
        paddingInlineEnd: padding,
        verticalAlign: 'top',
        // Avatar
        [`${skeletonAvatarCls}`]: _extends({
          display: 'inline-block',
          verticalAlign: 'top',
          background: color
        }, genSkeletonElementAvatarSize(controlHeight)),
        [`${skeletonAvatarCls}-circle`]: {
          borderRadius: '50%'
        },
        [`${skeletonAvatarCls}-lg`]: _extends({}, genSkeletonElementAvatarSize(controlHeightLG)),
        [`${skeletonAvatarCls}-sm`]: _extends({}, genSkeletonElementAvatarSize(controlHeightSM))
      },
      [`${componentCls}-content`]: {
        display: 'table-cell',
        width: '100%',
        verticalAlign: 'top',
        // Title
        [`${skeletonTitleCls}`]: {
          width: '100%',
          height: skeletonTitleHeight,
          background: color,
          borderRadius: skeletonBlockRadius,
          [`+ ${skeletonParagraphCls}`]: {
            marginBlockStart: controlHeightSM
          }
        },
        // paragraph
        [`${skeletonParagraphCls}`]: {
          padding: 0,
          '> li': {
            width: '100%',
            height: skeletonParagraphLineHeight,
            listStyle: 'none',
            background: color,
            borderRadius: skeletonBlockRadius,
            '+ li': {
              marginBlockStart: controlHeightXS
            }
          }
        },
        [`${skeletonParagraphCls}> li:last-child:not(:first-child):not(:nth-child(2))`]: {
          width: '61%'
        }
      },
      [`&-round ${componentCls}-content`]: {
        [`${skeletonTitleCls}, ${skeletonParagraphCls} > li`]: {
          borderRadius
        }
      }
    },
    [`${componentCls}-with-avatar ${componentCls}-content`]: {
      // Title
      [`${skeletonTitleCls}`]: {
        marginBlockStart: marginSM,
        [`+ ${skeletonParagraphCls}`]: {
          marginBlockStart: skeletonParagraphMarginTop
        }
      }
    },
    // Skeleton element
    [`${componentCls}${componentCls}-element`]: _extends(_extends(_extends(_extends({
      display: 'inline-block',
      width: 'auto'
    }, genSkeletonElementButton(token)), genSkeletonElementAvatar(token)), genSkeletonElementInput(token)), genSkeletonElementImage(token)),
    // Skeleton Block Button, Input
    [`${componentCls}${componentCls}-block`]: {
      width: '100%',
      [`${skeletonButtonCls}`]: {
        width: '100%'
      },
      [`${skeletonInputCls}`]: {
        width: '100%'
      }
    },
    // With active animation
    [`${componentCls}${componentCls}-active`]: {
      [`
        ${skeletonTitleCls},
        ${skeletonParagraphCls} > li,
        ${skeletonAvatarCls},
        ${skeletonButtonCls},
        ${skeletonInputCls},
        ${skeletonImageCls}
      `]: _extends({}, genSkeletonColor(token))
    }
  };
};
// ============================== Export ==============================
const useStyle$3 = genComponentStyleHook('Skeleton', token => {
  const {
    componentCls
  } = token;
  const skeletonToken = merge(token, {
    skeletonAvatarCls: `${componentCls}-avatar`,
    skeletonTitleCls: `${componentCls}-title`,
    skeletonParagraphCls: `${componentCls}-paragraph`,
    skeletonButtonCls: `${componentCls}-button`,
    skeletonInputCls: `${componentCls}-input`,
    skeletonImageCls: `${componentCls}-image`,
    imageSizeBase: token.controlHeight * 1.5,
    skeletonTitleHeight: token.controlHeight / 2,
    skeletonBlockRadius: token.borderRadiusSM,
    skeletonParagraphLineHeight: token.controlHeight / 2,
    skeletonParagraphMarginTop: token.marginLG + token.marginXXS,
    borderRadius: 100,
    skeletonLoadingBackground: `linear-gradient(90deg, ${token.color} 25%, ${token.colorGradientEnd} 37%, ${token.color} 63%)`,
    skeletonLoadingMotionDuration: '1.4s'
  });
  return [genBaseStyle$1(skeletonToken)];
}, token => {
  const {
    colorFillContent,
    colorFill
  } = token;
  return {
    color: colorFillContent,
    colorGradientEnd: colorFill
  };
});

const skeletonProps = () => ({
  active: {
    type: Boolean,
    default: undefined
  },
  loading: {
    type: Boolean,
    default: undefined
  },
  prefixCls: String,
  avatar: {
    type: [Boolean, Object],
    default: undefined
  },
  title: {
    type: [Boolean, Object],
    default: undefined
  },
  paragraph: {
    type: [Boolean, Object],
    default: undefined
  },
  round: {
    type: Boolean,
    default: undefined
  }
});
function getComponentProps(prop) {
  if (prop && typeof prop === 'object') {
    return prop;
  }
  return {};
}
function getAvatarBasicProps(hasTitle, hasParagraph) {
  if (hasTitle && !hasParagraph) {
    // Square avatar
    return {
      size: 'large',
      shape: 'square'
    };
  }
  return {
    size: 'large',
    shape: 'circle'
  };
}
function getTitleBasicProps(hasAvatar, hasParagraph) {
  if (!hasAvatar && hasParagraph) {
    return {
      width: '38%'
    };
  }
  if (hasAvatar && hasParagraph) {
    return {
      width: '50%'
    };
  }
  return {};
}
function getParagraphBasicProps(hasAvatar, hasTitle) {
  const basicProps = {};
  // Width
  if (!hasAvatar || !hasTitle) {
    basicProps.width = '61%';
  }
  // Rows
  if (!hasAvatar && hasTitle) {
    basicProps.rows = 3;
  } else {
    basicProps.rows = 2;
  }
  return basicProps;
}
const Skeleton = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASkeleton',
  props: initDefaultProps(skeletonProps(), {
    avatar: false,
    title: true,
    paragraph: true
  }),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('skeleton', props);
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    return () => {
      var _a;
      const {
        loading,
        avatar,
        title,
        paragraph,
        active,
        round
      } = props;
      const pre = prefixCls.value;
      if (loading || props.loading === undefined) {
        const hasAvatar = !!avatar || avatar === '';
        const hasTitle = !!title || title === '';
        const hasParagraph = !!paragraph || paragraph === '';
        // Avatar
        let avatarNode;
        if (hasAvatar) {
          const avatarProps = _extends(_extends({
            prefixCls: `${pre}-avatar`
          }, getAvatarBasicProps(hasTitle, hasParagraph)), getComponentProps(avatar));
          avatarNode = createVNode("div", {
            "class": `${pre}-header`
          }, [createVNode(Element, avatarProps, null)]);
        }
        let contentNode;
        if (hasTitle || hasParagraph) {
          // Title
          let $title;
          if (hasTitle) {
            const titleProps = _extends(_extends({
              prefixCls: `${pre}-title`
            }, getTitleBasicProps(hasAvatar, hasParagraph)), getComponentProps(title));
            $title = createVNode(SkeletonTitle, titleProps, null);
          }
          // Paragraph
          let paragraphNode;
          if (hasParagraph) {
            const paragraphProps = _extends(_extends({
              prefixCls: `${pre}-paragraph`
            }, getParagraphBasicProps(hasAvatar, hasTitle)), getComponentProps(paragraph));
            paragraphNode = createVNode(SkeletonParagraph, paragraphProps, null);
          }
          contentNode = createVNode("div", {
            "class": `${pre}-content`
          }, [$title, paragraphNode]);
        }
        const cls = classNames(pre, {
          [`${pre}-with-avatar`]: hasAvatar,
          [`${pre}-active`]: active,
          [`${pre}-rtl`]: direction.value === 'rtl',
          [`${pre}-round`]: round,
          [hashId.value]: true
        });
        return wrapSSR(createVNode("div", {
          "class": cls
        }, [avatarNode, contentNode]));
      }
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});

const skeletonButtonProps = () => {
  return _extends(_extends({}, skeletonElementProps()), {
    size: String,
    block: Boolean
  });
};
const SkeletonButton = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASkeletonButton',
  props: initDefaultProps(skeletonButtonProps(), {
    size: 'default'
  }),
  setup(props) {
    const {
      prefixCls
    } = useConfigInject('skeleton', props);
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    const cls = computed(() => classNames(prefixCls.value, `${prefixCls.value}-element`, {
      [`${prefixCls.value}-active`]: props.active,
      [`${prefixCls.value}-block`]: props.block
    }, hashId.value));
    return () => {
      return wrapSSR(createVNode("div", {
        "class": cls.value
      }, [createVNode(Element, _objectSpread$8(_objectSpread$8({}, props), {}, {
        "prefixCls": `${prefixCls.value}-button`
      }), null)]));
    };
  }
});

const SkeletonInput = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASkeletonInput',
  props: _extends(_extends({}, omit(skeletonElementProps(), ['shape'])), {
    size: String,
    block: Boolean
  }),
  setup(props) {
    const {
      prefixCls
    } = useConfigInject('skeleton', props);
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    const cls = computed(() => classNames(prefixCls.value, `${prefixCls.value}-element`, {
      [`${prefixCls.value}-active`]: props.active,
      [`${prefixCls.value}-block`]: props.block
    }, hashId.value));
    return () => {
      return wrapSSR(createVNode("div", {
        "class": cls.value
      }, [createVNode(Element, _objectSpread$8(_objectSpread$8({}, props), {}, {
        "prefixCls": `${prefixCls.value}-input`
      }), null)]));
    };
  }
});

const path = 'M365.714286 329.142857q0 45.714286-32.036571 77.677714t-77.677714 32.036571-77.677714-32.036571-32.036571-77.677714 32.036571-77.677714 77.677714-32.036571 77.677714 32.036571 32.036571 77.677714zM950.857143 548.571429l0 256-804.571429 0 0-109.714286 182.857143-182.857143 91.428571 91.428571 292.571429-292.571429zM1005.714286 146.285714l-914.285714 0q-7.460571 0-12.873143 5.412571t-5.412571 12.873143l0 694.857143q0 7.460571 5.412571 12.873143t12.873143 5.412571l914.285714 0q7.460571 0 12.873143-5.412571t5.412571-12.873143l0-694.857143q0-7.460571-5.412571-12.873143t-12.873143-5.412571zM1097.142857 164.571429l0 694.857143q0 37.741714-26.843429 64.585143t-64.585143 26.843429l-914.285714 0q-37.741714 0-64.585143-26.843429t-26.843429-64.585143l0-694.857143q0-37.741714 26.843429-64.585143t64.585143-26.843429l914.285714 0q37.741714 0 64.585143 26.843429t26.843429 64.585143z';
const SkeletonImage = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASkeletonImage',
  props: omit(skeletonElementProps(), ['size', 'shape', 'active']),
  setup(props) {
    const {
      prefixCls
    } = useConfigInject('skeleton', props);
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    const cls = computed(() => classNames(prefixCls.value, `${prefixCls.value}-element`, hashId.value));
    return () => {
      return wrapSSR(createVNode("div", {
        "class": cls.value
      }, [createVNode("div", {
        "class": `${prefixCls.value}-image`
      }, [createVNode("svg", {
        "viewBox": "0 0 1098 1024",
        "xmlns": "http://www.w3.org/2000/svg",
        "class": `${prefixCls.value}-image-svg`
      }, [createVNode("path", {
        "d": path,
        "class": `${prefixCls.value}-image-path`
      }, null)])])]));
    };
  }
});

const avatarProps = () => {
  return _extends(_extends({}, skeletonElementProps()), {
    shape: String
  });
};
const SkeletonAvatar = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASkeletonAvatar',
  props: initDefaultProps(avatarProps(), {
    size: 'default',
    shape: 'circle'
  }),
  setup(props) {
    const {
      prefixCls
    } = useConfigInject('skeleton', props);
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    const cls = computed(() => classNames(prefixCls.value, `${prefixCls.value}-element`, {
      [`${prefixCls.value}-active`]: props.active
    }, hashId.value));
    return () => {
      return wrapSSR(createVNode("div", {
        "class": cls.value
      }, [createVNode(Element, _objectSpread$8(_objectSpread$8({}, props), {}, {
        "prefixCls": `${prefixCls.value}-avatar`
      }), null)]));
    };
  }
});

Skeleton.Button = SkeletonButton;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Input = SkeletonInput;
Skeleton.Image = SkeletonImage;
Skeleton.Title = SkeletonTitle;
/* istanbul ignore next */
Skeleton.install = function (app) {
  app.component(Skeleton.name, Skeleton);
  app.component(Skeleton.Button.name, SkeletonButton);
  app.component(Skeleton.Avatar.name, SkeletonAvatar);
  app.component(Skeleton.Input.name, SkeletonInput);
  app.component(Skeleton.Image.name, SkeletonImage);
  app.component(Skeleton.Title.name, SkeletonTitle);
  return app;
};

const {
  TabPane
} = Tabs;
const cardProps = () => ({
  prefixCls: String,
  title: PropTypes.any,
  extra: PropTypes.any,
  bordered: {
    type: Boolean,
    default: true
  },
  bodyStyle: {
    type: Object,
    default: undefined
  },
  headStyle: {
    type: Object,
    default: undefined
  },
  loading: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  type: {
    type: String
  },
  size: {
    type: String
  },
  actions: PropTypes.any,
  tabList: {
    type: Array
  },
  tabBarExtraContent: PropTypes.any,
  activeTabKey: String,
  defaultActiveTabKey: String,
  cover: PropTypes.any,
  onTabChange: {
    type: Function
  }
});
const Card = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ACard',
  inheritAttrs: false,
  props: cardProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls,
      direction,
      size
    } = useConfigInject('card', props);
    const [wrapSSR, hashId] = useStyle$4(prefixCls);
    const getAction = actions => {
      const actionList = actions.map((action, index) => isVNode(action) && !isEmptyElement(action) || !isVNode(action) ? createVNode("li", {
        "style": {
          width: `${100 / actions.length}%`
        },
        "key": `action-${index}`
      }, [createVNode("span", null, [action])]) : null);
      return actionList;
    };
    const triggerTabChange = key => {
      var _a;
      (_a = props.onTabChange) === null || _a === void 0 ? void 0 : _a.call(props, key);
    };
    const isContainGrid = function () {
      let obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      let containGrid;
      obj.forEach(element => {
        if (element && isPlainObject(element.type) && element.type.__ANT_CARD_GRID) {
          containGrid = true;
        }
      });
      return containGrid;
    };
    return () => {
      var _a, _b, _c, _d, _e, _f;
      const {
        headStyle = {},
        bodyStyle = {},
        loading,
        bordered = true,
        type,
        tabList,
        hoverable,
        activeTabKey,
        defaultActiveTabKey,
        tabBarExtraContent = filterEmptyWithUndefined((_a = slots.tabBarExtraContent) === null || _a === void 0 ? void 0 : _a.call(slots)),
        title = filterEmptyWithUndefined((_b = slots.title) === null || _b === void 0 ? void 0 : _b.call(slots)),
        extra = filterEmptyWithUndefined((_c = slots.extra) === null || _c === void 0 ? void 0 : _c.call(slots)),
        actions = filterEmptyWithUndefined((_d = slots.actions) === null || _d === void 0 ? void 0 : _d.call(slots)),
        cover = filterEmptyWithUndefined((_e = slots.cover) === null || _e === void 0 ? void 0 : _e.call(slots))
      } = props;
      const children = flattenChildren((_f = slots.default) === null || _f === void 0 ? void 0 : _f.call(slots));
      const pre = prefixCls.value;
      const classString = {
        [`${pre}`]: true,
        [hashId.value]: true,
        [`${pre}-loading`]: loading,
        [`${pre}-bordered`]: bordered,
        [`${pre}-hoverable`]: !!hoverable,
        [`${pre}-contain-grid`]: isContainGrid(children),
        [`${pre}-contain-tabs`]: tabList && tabList.length,
        [`${pre}-${size.value}`]: size.value,
        [`${pre}-type-${type}`]: !!type,
        [`${pre}-rtl`]: direction.value === 'rtl'
      };
      const loadingBlock = createVNode(Skeleton, {
        "loading": true,
        "active": true,
        "paragraph": {
          rows: 4
        },
        "title": false
      }, {
        default: () => [children]
      });
      const hasActiveTabKey = activeTabKey !== undefined;
      const tabsProps = {
        size: 'large',
        [hasActiveTabKey ? 'activeKey' : 'defaultActiveKey']: hasActiveTabKey ? activeTabKey : defaultActiveTabKey,
        onChange: triggerTabChange,
        class: `${pre}-head-tabs`
      };
      let head;
      const tabs = tabList && tabList.length ? createVNode(Tabs, tabsProps, {
        default: () => [tabList.map(item => {
          const {
            tab: temp,
            slots: itemSlots
          } = item;
          const name = itemSlots === null || itemSlots === void 0 ? void 0 : itemSlots.tab;
          devWarning(!itemSlots, 'Card', `tabList slots is deprecated, Please use \`customTab\` instead.`);
          let tab = temp !== undefined ? temp : slots[name] ? slots[name](item) : null;
          tab = customRenderSlot(slots, 'customTab', item, () => [tab]);
          return createVNode(TabPane, {
            "tab": tab,
            "key": item.key,
            "disabled": item.disabled
          }, null);
        })],
        rightExtra: tabBarExtraContent ? () => tabBarExtraContent : null
      }) : null;
      if (title || extra || tabs) {
        head = createVNode("div", {
          "class": `${pre}-head`,
          "style": headStyle
        }, [createVNode("div", {
          "class": `${pre}-head-wrapper`
        }, [title && createVNode("div", {
          "class": `${pre}-head-title`
        }, [title]), extra && createVNode("div", {
          "class": `${pre}-extra`
        }, [extra])]), tabs]);
      }
      const coverDom = cover ? createVNode("div", {
        "class": `${pre}-cover`
      }, [cover]) : null;
      const body = createVNode("div", {
        "class": `${pre}-body`,
        "style": bodyStyle
      }, [loading ? loadingBlock : children]);
      const actionDom = actions && actions.length ? createVNode("ul", {
        "class": `${pre}-actions`
      }, [getAction(actions)]) : null;
      return wrapSSR(createVNode("div", _objectSpread$8(_objectSpread$8({
        "ref": "cardContainerRef"
      }, attrs), {}, {
        "class": [classString, attrs.class]
      }), [head, coverDom, children && children.length ? body : null, actionDom]));
    };
  }
});

const cardMetaProps = () => ({
  prefixCls: String,
  title: vNodeType(),
  description: vNodeType(),
  avatar: vNodeType()
});
const Meta = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ACardMeta',
  props: cardMetaProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('card', props);
    return () => {
      const classString = {
        [`${prefixCls.value}-meta`]: true
      };
      const avatar = getPropsSlot(slots, props, 'avatar');
      const title = getPropsSlot(slots, props, 'title');
      const description = getPropsSlot(slots, props, 'description');
      const avatarDom = avatar ? createVNode("div", {
        "class": `${prefixCls.value}-meta-avatar`
      }, [avatar]) : null;
      const titleDom = title ? createVNode("div", {
        "class": `${prefixCls.value}-meta-title`
      }, [title]) : null;
      const descriptionDom = description ? createVNode("div", {
        "class": `${prefixCls.value}-meta-description`
      }, [description]) : null;
      const MetaDetail = titleDom || descriptionDom ? createVNode("div", {
        "class": `${prefixCls.value}-meta-detail`
      }, [titleDom, descriptionDom]) : null;
      return createVNode("div", {
        "class": classString
      }, [avatarDom, MetaDetail]);
    };
  }
});

const cardGridProps = () => ({
  prefixCls: String,
  hoverable: {
    type: Boolean,
    default: true
  }
});
const Grid = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ACardGrid',
  __ANT_CARD_GRID: true,
  props: cardGridProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('card', props);
    const classNames = computed(() => {
      return {
        [`${prefixCls.value}-grid`]: true,
        [`${prefixCls.value}-grid-hoverable`]: props.hoverable
      };
    });
    return () => {
      var _a;
      return createVNode("div", {
        "class": classNames.value
      }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
    };
  }
});

Card.Meta = Meta;
Card.Grid = Grid;
/* istanbul ignore next */
Card.install = function (app) {
  app.component(Card.name, Card);
  app.component(Meta.name, Meta);
  app.component(Grid.name, Grid);
  return app;
};

/**
 * Webpack has bug for import loop, which is not the same behavior as ES module.
 * When util.js imports the TreeNode for tree generate will cause treeContextTypes be empty.
 */
const TreeContextKey = Symbol('TreeContextKey');
const TreeContext = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TreeContext',
  props: {
    value: {
      type: Object
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    provide(TreeContextKey, computed(() => props.value));
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});
const useInjectTreeContext = () => {
  return inject(TreeContextKey, computed(() => ({})));
};
const KeysStateKey = Symbol('KeysStateKey');
const useProvideKeysState = state => {
  provide(KeysStateKey, state);
};
const useInjectKeysState = () => {
  return inject(KeysStateKey, {
    expandedKeys: shallowRef([]),
    selectedKeys: shallowRef([]),
    loadedKeys: shallowRef([]),
    loadingKeys: shallowRef([]),
    checkedKeys: shallowRef([]),
    halfCheckedKeys: shallowRef([]),
    expandedKeysSet: computed(() => new Set()),
    selectedKeysSet: computed(() => new Set()),
    loadedKeysSet: computed(() => new Set()),
    loadingKeysSet: computed(() => new Set()),
    checkedKeysSet: computed(() => new Set()),
    halfCheckedKeysSet: computed(() => new Set()),
    flattenNodes: shallowRef([])
  });
};

const Indent = _ref => {
  let {
    prefixCls,
    level,
    isStart,
    isEnd
  } = _ref;
  const baseClassName = `${prefixCls}-indent-unit`;
  const list = [];
  for (let i = 0; i < level; i += 1) {
    list.push(createVNode("span", {
      "key": i,
      "class": {
        [baseClassName]: true,
        [`${baseClassName}-start`]: isStart[i],
        [`${baseClassName}-end`]: isEnd[i]
      }
    }, null));
  }
  return createVNode("span", {
    "aria-hidden": "true",
    "class": `${prefixCls}-indent`
  }, [list]);
};

const treeNodeProps = {
  eventKey: [String, Number],
  prefixCls: String,
  // By parent
  // expanded: { type: Boolean, default: undefined },
  // selected: { type: Boolean, default: undefined },
  // checked: { type: Boolean, default: undefined },
  // loaded: { type: Boolean, default: undefined },
  // loading: { type: Boolean, default: undefined },
  // halfChecked: { type: Boolean, default: undefined },
  // dragOver: { type: Boolean, default: undefined },
  // dragOverGapTop: { type: Boolean, default: undefined },
  // dragOverGapBottom: { type: Boolean, default: undefined },
  // pos: String,
  title: PropTypes.any,
  /** New added in Tree for easy data access */
  data: {
    type: Object,
    default: undefined
  },
  parent: {
    type: Object,
    default: undefined
  },
  isStart: {
    type: Array
  },
  isEnd: {
    type: Array
  },
  active: {
    type: Boolean,
    default: undefined
  },
  onMousemove: {
    type: Function
  },
  // By user
  isLeaf: {
    type: Boolean,
    default: undefined
  },
  checkable: {
    type: Boolean,
    default: undefined
  },
  selectable: {
    type: Boolean,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: undefined
  },
  disableCheckbox: {
    type: Boolean,
    default: undefined
  },
  icon: PropTypes.any,
  switcherIcon: PropTypes.any,
  domRef: {
    type: Function
  }
};
const nodeListProps = {
  prefixCls: {
    type: String
  },
  // data: { type: Array as PropType<FlattenNode[]> },
  motion: {
    type: Object
  },
  focusable: {
    type: Boolean
  },
  activeItem: {
    type: Object
  },
  focused: {
    type: Boolean
  },
  tabindex: {
    type: Number
  },
  checkable: {
    type: Boolean
  },
  selectable: {
    type: Boolean
  },
  disabled: {
    type: Boolean
  },
  // expandedKeys: { type: Array as PropType<Key[]> },
  // selectedKeys: { type: Array as PropType<Key[]> },
  // checkedKeys: { type: Array as PropType<Key[]> },
  // loadedKeys: { type: Array as PropType<Key[]> },
  // loadingKeys: { type: Array as PropType<Key[]> },
  // halfCheckedKeys: { type: Array as PropType<Key[]> },
  // keyEntities: { type: Object as PropType<Record<Key, DataEntity<DataNode>>> },
  // dragging: { type: Boolean as PropType<boolean> },
  // dragOverNodeKey: { type: [String, Number] as PropType<Key> },
  // dropPosition: { type: Number as PropType<number> },
  // Virtual list
  height: {
    type: Number
  },
  itemHeight: {
    type: Number
  },
  virtual: {
    type: Boolean
  },
  onScroll: {
    type: Function
  },
  onKeydown: {
    type: Function
  },
  onFocus: {
    type: Function
  },
  onBlur: {
    type: Function
  },
  onActiveChange: {
    type: Function
  },
  onContextmenu: {
    type: Function
  },
  onListChangeStart: {
    type: Function
  },
  onListChangeEnd: {
    type: Function
  }
};
const treeProps$1 = () => ({
  prefixCls: String,
  focusable: {
    type: Boolean,
    default: undefined
  },
  activeKey: [Number, String],
  tabindex: Number,
  children: PropTypes.any,
  treeData: {
    type: Array
  },
  fieldNames: {
    type: Object
  },
  showLine: {
    type: [Boolean, Object],
    default: undefined
  },
  showIcon: {
    type: Boolean,
    default: undefined
  },
  icon: PropTypes.any,
  selectable: {
    type: Boolean,
    default: undefined
  },
  expandAction: [String, Boolean],
  disabled: {
    type: Boolean,
    default: undefined
  },
  multiple: {
    type: Boolean,
    default: undefined
  },
  checkable: {
    type: Boolean,
    default: undefined
  },
  checkStrictly: {
    type: Boolean,
    default: undefined
  },
  draggable: {
    type: [Function, Boolean]
  },
  defaultExpandParent: {
    type: Boolean,
    default: undefined
  },
  autoExpandParent: {
    type: Boolean,
    default: undefined
  },
  defaultExpandAll: {
    type: Boolean,
    default: undefined
  },
  defaultExpandedKeys: {
    type: Array
  },
  expandedKeys: {
    type: Array
  },
  defaultCheckedKeys: {
    type: Array
  },
  checkedKeys: {
    type: [Object, Array]
  },
  defaultSelectedKeys: {
    type: Array
  },
  selectedKeys: {
    type: Array
  },
  allowDrop: {
    type: Function
  },
  dropIndicatorRender: {
    type: Function
  },
  onFocus: {
    type: Function
  },
  onBlur: {
    type: Function
  },
  onKeydown: {
    type: Function
  },
  onContextmenu: {
    type: Function
  },
  onClick: {
    type: Function
  },
  onDblclick: {
    type: Function
  },
  onScroll: {
    type: Function
  },
  onExpand: {
    type: Function
  },
  onCheck: {
    type: Function
  },
  onSelect: {
    type: Function
  },
  onLoad: {
    type: Function
  },
  loadData: {
    type: Function
  },
  loadedKeys: {
    type: Array
  },
  onMouseenter: {
    type: Function
  },
  onMouseleave: {
    type: Function
  },
  onRightClick: {
    type: Function
  },
  onDragstart: {
    type: Function
  },
  onDragenter: {
    type: Function
  },
  onDragover: {
    type: Function
  },
  onDragleave: {
    type: Function
  },
  onDragend: {
    type: Function
  },
  onDrop: {
    type: Function
  },
  /**
   * Used for `rc-tree-select` only.
   * Do not use in your production code directly since this will be refactor.
   */
  onActiveChange: {
    type: Function
  },
  filterTreeNode: {
    type: Function
  },
  motion: PropTypes.any,
  switcherIcon: PropTypes.any,
  // Virtual List
  height: Number,
  itemHeight: Number,
  virtual: {
    type: Boolean,
    default: undefined
  },
  // direction for drag logic
  direction: {
    type: String
  },
  rootClassName: String,
  rootStyle: Object
});

var __rest$5 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const ICON_OPEN = 'open';
const ICON_CLOSE = 'close';
const defaultTitle = '---';
const VcTreeNode = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATreeNode',
  inheritAttrs: false,
  props: treeNodeProps,
  isTreeNode: 1,
  setup(props, _ref) {
    let {
      attrs,
      slots,
      expose
    } = _ref;
    warning(!('slots' in props.data), `treeData slots is deprecated, please use ${Object.keys(props.data.slots || {}).map(key => '`v-slot:' + key + '` ')}instead`);
    const dragNodeHighlight = shallowRef(false);
    const context = useInjectTreeContext();
    const {
      expandedKeysSet,
      selectedKeysSet,
      loadedKeysSet,
      loadingKeysSet,
      checkedKeysSet,
      halfCheckedKeysSet
    } = useInjectKeysState();
    const {
      dragOverNodeKey,
      dropPosition,
      keyEntities
    } = context.value;
    const mergedTreeNodeProps = computed(() => {
      return getTreeNodeProps(props.eventKey, {
        expandedKeysSet: expandedKeysSet.value,
        selectedKeysSet: selectedKeysSet.value,
        loadedKeysSet: loadedKeysSet.value,
        loadingKeysSet: loadingKeysSet.value,
        checkedKeysSet: checkedKeysSet.value,
        halfCheckedKeysSet: halfCheckedKeysSet.value,
        dragOverNodeKey,
        dropPosition,
        keyEntities
      });
    });
    const expanded = eagerComputed(() => mergedTreeNodeProps.value.expanded);
    const selected = eagerComputed(() => mergedTreeNodeProps.value.selected);
    const checked = eagerComputed(() => mergedTreeNodeProps.value.checked);
    const loaded = eagerComputed(() => mergedTreeNodeProps.value.loaded);
    const loading = eagerComputed(() => mergedTreeNodeProps.value.loading);
    const halfChecked = eagerComputed(() => mergedTreeNodeProps.value.halfChecked);
    const dragOver = eagerComputed(() => mergedTreeNodeProps.value.dragOver);
    const dragOverGapTop = eagerComputed(() => mergedTreeNodeProps.value.dragOverGapTop);
    const dragOverGapBottom = eagerComputed(() => mergedTreeNodeProps.value.dragOverGapBottom);
    const pos = eagerComputed(() => mergedTreeNodeProps.value.pos);
    const selectHandle = shallowRef();
    const hasChildren = computed(() => {
      const {
        eventKey
      } = props;
      const {
        keyEntities
      } = context.value;
      const {
        children
      } = keyEntities[eventKey] || {};
      return !!(children || []).length;
    });
    const isLeaf = computed(() => {
      const {
        isLeaf
      } = props;
      const {
        loadData
      } = context.value;
      const has = hasChildren.value;
      if (isLeaf === false) {
        return false;
      }
      return isLeaf || !loadData && !has || loadData && loaded.value && !has;
    });
    const nodeState = computed(() => {
      if (isLeaf.value) {
        return null;
      }
      return expanded.value ? ICON_OPEN : ICON_CLOSE;
    });
    const isDisabled = computed(() => {
      const {
        disabled
      } = props;
      const {
        disabled: treeDisabled
      } = context.value;
      return !!(treeDisabled || disabled);
    });
    const isCheckable = computed(() => {
      const {
        checkable
      } = props;
      const {
        checkable: treeCheckable
      } = context.value;
      // Return false if tree or treeNode is not checkable
      if (!treeCheckable || checkable === false) return false;
      return treeCheckable;
    });
    const isSelectable = computed(() => {
      const {
        selectable
      } = props;
      const {
        selectable: treeSelectable
      } = context.value;
      // Ignore when selectable is undefined or null
      if (typeof selectable === 'boolean') {
        return selectable;
      }
      return treeSelectable;
    });
    const renderArgsData = computed(() => {
      const {
        data,
        active,
        checkable,
        disableCheckbox,
        disabled,
        selectable
      } = props;
      return _extends(_extends({
        active,
        checkable,
        disableCheckbox,
        disabled,
        selectable
      }, data), {
        dataRef: data,
        data,
        isLeaf: isLeaf.value,
        checked: checked.value,
        expanded: expanded.value,
        loading: loading.value,
        selected: selected.value,
        halfChecked: halfChecked.value
      });
    });
    const instance = getCurrentInstance();
    const eventData = computed(() => {
      const {
        eventKey
      } = props;
      const {
        keyEntities
      } = context.value;
      const {
        parent
      } = keyEntities[eventKey] || {};
      return _extends(_extends({}, convertNodePropsToEventData(_extends({}, props, mergedTreeNodeProps.value))), {
        parent
      });
    });
    const dragNodeEvent = reactive({
      eventData,
      eventKey: computed(() => props.eventKey),
      selectHandle,
      pos,
      key: instance.vnode.key
    });
    expose(dragNodeEvent);
    const onSelectorDoubleClick = e => {
      const {
        onNodeDoubleClick
      } = context.value;
      onNodeDoubleClick(e, eventData.value);
    };
    const onSelect = e => {
      if (isDisabled.value) return;
      const {
        onNodeSelect
      } = context.value;
      e.preventDefault();
      onNodeSelect(e, eventData.value);
    };
    const onCheck = e => {
      if (isDisabled.value) return;
      const {
        disableCheckbox
      } = props;
      const {
        onNodeCheck
      } = context.value;
      if (!isCheckable.value || disableCheckbox) return;
      e.preventDefault();
      const targetChecked = !checked.value;
      onNodeCheck(e, eventData.value, targetChecked);
    };
    const onSelectorClick = e => {
      // Click trigger before select/check operation
      const {
        onNodeClick
      } = context.value;
      onNodeClick(e, eventData.value);
      if (isSelectable.value) {
        onSelect(e);
      } else {
        onCheck(e);
      }
    };
    const onMouseEnter = e => {
      const {
        onNodeMouseEnter
      } = context.value;
      onNodeMouseEnter(e, eventData.value);
    };
    const onMouseLeave = e => {
      const {
        onNodeMouseLeave
      } = context.value;
      onNodeMouseLeave(e, eventData.value);
    };
    const onContextmenu = e => {
      const {
        onNodeContextMenu
      } = context.value;
      onNodeContextMenu(e, eventData.value);
    };
    const onDragStart = e => {
      const {
        onNodeDragStart
      } = context.value;
      e.stopPropagation();
      dragNodeHighlight.value = true;
      onNodeDragStart(e, dragNodeEvent);
      try {
        // ie throw error
        // firefox-need-it
        e.dataTransfer.setData('text/plain', '');
      } catch (error) {
        // empty
      }
    };
    const onDragEnter = e => {
      const {
        onNodeDragEnter
      } = context.value;
      e.preventDefault();
      e.stopPropagation();
      onNodeDragEnter(e, dragNodeEvent);
    };
    const onDragOver = e => {
      const {
        onNodeDragOver
      } = context.value;
      e.preventDefault();
      e.stopPropagation();
      onNodeDragOver(e, dragNodeEvent);
    };
    const onDragLeave = e => {
      const {
        onNodeDragLeave
      } = context.value;
      e.stopPropagation();
      onNodeDragLeave(e, dragNodeEvent);
    };
    const onDragEnd = e => {
      const {
        onNodeDragEnd
      } = context.value;
      e.stopPropagation();
      dragNodeHighlight.value = false;
      onNodeDragEnd(e, dragNodeEvent);
    };
    const onDrop = e => {
      const {
        onNodeDrop
      } = context.value;
      e.preventDefault();
      e.stopPropagation();
      dragNodeHighlight.value = false;
      onNodeDrop(e, dragNodeEvent);
    };
    // Disabled item still can be switch
    const onExpand = e => {
      const {
        onNodeExpand
      } = context.value;
      if (loading.value) return;
      onNodeExpand(e, eventData.value);
    };
    const isDraggable = () => {
      const {
        data
      } = props;
      const {
        draggable
      } = context.value;
      return !!(draggable && (!draggable.nodeDraggable || draggable.nodeDraggable(data)));
    };
    // ==================== Render: Drag Handler ====================
    const renderDragHandler = () => {
      const {
        draggable,
        prefixCls
      } = context.value;
      return draggable && (draggable === null || draggable === void 0 ? void 0 : draggable.icon) ? createVNode("span", {
        "class": `${prefixCls}-draggable-icon`
      }, [draggable.icon]) : null;
    };
    const renderSwitcherIconDom = () => {
      var _a, _b, _c;
      const {
        switcherIcon: switcherIconFromProps = slots.switcherIcon || ((_a = context.value.slots) === null || _a === void 0 ? void 0 : _a[(_c = (_b = props.data) === null || _b === void 0 ? void 0 : _b.slots) === null || _c === void 0 ? void 0 : _c.switcherIcon])
      } = props;
      const {
        switcherIcon: switcherIconFromCtx
      } = context.value;
      const switcherIcon = switcherIconFromProps || switcherIconFromCtx;
      // if switcherIconDom is null, no render switcher span
      if (typeof switcherIcon === 'function') {
        return switcherIcon(renderArgsData.value);
      }
      return switcherIcon;
    };
    // Load data to avoid default expanded tree without data
    const syncLoadData = () => {
      //const { expanded, loading, loaded } = props;
      const {
        loadData,
        onNodeLoad
      } = context.value;
      if (loading.value) {
        return;
      }
      // read from state to avoid loadData at same time
      if (loadData && expanded.value && !isLeaf.value) {
        // We needn't reload data when has children in sync logic
        // It's only needed in node expanded
        if (!hasChildren.value && !loaded.value) {
          onNodeLoad(eventData.value);
        }
      }
    };
    onMounted(() => {
      syncLoadData();
    });
    onUpdated(() => {
      // https://github.com/vueComponent/ant-design-vue/issues/4835
      syncLoadData();
    });
    // Switcher
    const renderSwitcher = () => {
      const {
        prefixCls
      } = context.value;
      // if switcherIconDom is null, no render switcher span
      const switcherIconDom = renderSwitcherIconDom();
      if (isLeaf.value) {
        return switcherIconDom !== false ? createVNode("span", {
          "class": classNames(`${prefixCls}-switcher`, `${prefixCls}-switcher-noop`)
        }, [switcherIconDom]) : null;
      }
      const switcherCls = classNames(`${prefixCls}-switcher`, `${prefixCls}-switcher_${expanded.value ? ICON_OPEN : ICON_CLOSE}`);
      return switcherIconDom !== false ? createVNode("span", {
        "onClick": onExpand,
        "class": switcherCls
      }, [switcherIconDom]) : null;
    };
    // Checkbox
    const renderCheckbox = () => {
      var _a, _b;
      const {
        disableCheckbox
      } = props;
      const {
        prefixCls
      } = context.value;
      const disabled = isDisabled.value;
      const checkable = isCheckable.value;
      if (!checkable) return null;
      return createVNode("span", {
        "class": classNames(`${prefixCls}-checkbox`, checked.value && `${prefixCls}-checkbox-checked`, !checked.value && halfChecked.value && `${prefixCls}-checkbox-indeterminate`, (disabled || disableCheckbox) && `${prefixCls}-checkbox-disabled`),
        "onClick": onCheck
      }, [(_b = (_a = context.value).customCheckable) === null || _b === void 0 ? void 0 : _b.call(_a)]);
    };
    const renderIcon = () => {
      const {
        prefixCls
      } = context.value;
      return createVNode("span", {
        "class": classNames(`${prefixCls}-iconEle`, `${prefixCls}-icon__${nodeState.value || 'docu'}`, loading.value && `${prefixCls}-icon_loading`)
      }, null);
    };
    const renderDropIndicator = () => {
      const {
        disabled,
        eventKey
      } = props;
      const {
        draggable,
        dropLevelOffset,
        dropPosition,
        prefixCls,
        indent,
        dropIndicatorRender,
        dragOverNodeKey,
        direction
      } = context.value;
      const rootDraggable = draggable !== false;
      // allowDrop is calculated in Tree.tsx, there is no need for calc it here
      const showIndicator = !disabled && rootDraggable && dragOverNodeKey === eventKey;
      return showIndicator ? dropIndicatorRender({
        dropPosition,
        dropLevelOffset,
        indent,
        prefixCls,
        direction
      }) : null;
    };
    // Icon + Title
    const renderSelector = () => {
      var _a, _b, _c, _d, _e, _f;
      const {
        // title = slots.title ||
        //   context.value.slots?.[props.data?.slots?.title] ||
        //   context.value.slots?.title,
        // selected,
        icon = slots.icon,
        // loading,
        data
      } = props;
      const title = slots.title || ((_a = context.value.slots) === null || _a === void 0 ? void 0 : _a[(_c = (_b = props.data) === null || _b === void 0 ? void 0 : _b.slots) === null || _c === void 0 ? void 0 : _c.title]) || ((_d = context.value.slots) === null || _d === void 0 ? void 0 : _d.title) || props.title;
      const {
        prefixCls,
        showIcon,
        icon: treeIcon,
        loadData
        // slots: contextSlots,
      } = context.value;
      const disabled = isDisabled.value;
      const wrapClass = `${prefixCls}-node-content-wrapper`;
      // Icon - Still show loading icon when loading without showIcon
      let $icon;
      if (showIcon) {
        const currentIcon = icon || ((_e = context.value.slots) === null || _e === void 0 ? void 0 : _e[(_f = data === null || data === void 0 ? void 0 : data.slots) === null || _f === void 0 ? void 0 : _f.icon]) || treeIcon;
        $icon = currentIcon ? createVNode("span", {
          "class": classNames(`${prefixCls}-iconEle`, `${prefixCls}-icon__customize`)
        }, [typeof currentIcon === 'function' ? currentIcon(renderArgsData.value) : currentIcon]) : renderIcon();
      } else if (loadData && loading.value) {
        $icon = renderIcon();
      }
      // Title
      let titleNode;
      if (typeof title === 'function') {
        titleNode = title(renderArgsData.value);
        // } else if (contextSlots.titleRender) {
        //   titleNode = contextSlots.titleRender(renderArgsData.value);
      } else {
        titleNode = title;
      }
      titleNode = titleNode === undefined ? defaultTitle : titleNode;
      const $title = createVNode("span", {
        "class": `${prefixCls}-title`
      }, [titleNode]);
      return createVNode("span", {
        "ref": selectHandle,
        "title": typeof title === 'string' ? title : '',
        "class": classNames(`${wrapClass}`, `${wrapClass}-${nodeState.value || 'normal'}`, !disabled && (selected.value || dragNodeHighlight.value) && `${prefixCls}-node-selected`),
        "onMouseenter": onMouseEnter,
        "onMouseleave": onMouseLeave,
        "onContextmenu": onContextmenu,
        "onClick": onSelectorClick,
        "onDblclick": onSelectorDoubleClick
      }, [$icon, $title, renderDropIndicator()]);
    };
    return () => {
      const _a = _extends(_extends({}, props), attrs),
        {
          eventKey,
          isLeaf,
          isStart,
          isEnd,
          domRef,
          active,
          data,
          onMousemove,
          selectable
        } = _a,
        otherProps = __rest$5(_a, ["eventKey", "isLeaf", "isStart", "isEnd", "domRef", "active", "data", "onMousemove", "selectable"]);
      const {
        prefixCls,
        filterTreeNode,
        keyEntities,
        dropContainerKey,
        dropTargetKey,
        draggingNodeKey
      } = context.value;
      const disabled = isDisabled.value;
      const dataOrAriaAttributeProps = pickAttrs(otherProps, {
        aria: true,
        data: true
      });
      const {
        level
      } = keyEntities[eventKey] || {};
      const isEndNode = isEnd[isEnd.length - 1];
      const mergedDraggable = isDraggable();
      const draggableWithoutDisabled = !disabled && mergedDraggable;
      const dragging = draggingNodeKey === eventKey;
      const ariaSelected = selectable !== undefined ? {
        'aria-selected': !!selectable
      } : undefined;
      // console.log(1);
      return createVNode("div", _objectSpread$8(_objectSpread$8({
        "ref": domRef,
        "class": classNames(attrs.class, `${prefixCls}-treenode`, {
          [`${prefixCls}-treenode-disabled`]: disabled,
          [`${prefixCls}-treenode-switcher-${expanded.value ? 'open' : 'close'}`]: !isLeaf,
          [`${prefixCls}-treenode-checkbox-checked`]: checked.value,
          [`${prefixCls}-treenode-checkbox-indeterminate`]: halfChecked.value,
          [`${prefixCls}-treenode-selected`]: selected.value,
          [`${prefixCls}-treenode-loading`]: loading.value,
          [`${prefixCls}-treenode-active`]: active,
          [`${prefixCls}-treenode-leaf-last`]: isEndNode,
          [`${prefixCls}-treenode-draggable`]: draggableWithoutDisabled,
          dragging,
          'drop-target': dropTargetKey === eventKey,
          'drop-container': dropContainerKey === eventKey,
          'drag-over': !disabled && dragOver.value,
          'drag-over-gap-top': !disabled && dragOverGapTop.value,
          'drag-over-gap-bottom': !disabled && dragOverGapBottom.value,
          'filter-node': filterTreeNode && filterTreeNode(eventData.value)
        }),
        "style": attrs.style,
        "draggable": draggableWithoutDisabled,
        "aria-grabbed": dragging,
        "onDragstart": draggableWithoutDisabled ? onDragStart : undefined,
        "onDragenter": mergedDraggable ? onDragEnter : undefined,
        "onDragover": mergedDraggable ? onDragOver : undefined,
        "onDragleave": mergedDraggable ? onDragLeave : undefined,
        "onDrop": mergedDraggable ? onDrop : undefined,
        "onDragend": mergedDraggable ? onDragEnd : undefined,
        "onMousemove": onMousemove
      }, ariaSelected), dataOrAriaAttributeProps), [createVNode(Indent, {
        "prefixCls": prefixCls,
        "level": level,
        "isStart": isStart,
        "isEnd": isEnd
      }, null), renderDragHandler(), renderSwitcher(), renderCheckbox(), renderSelector()]);
    };
  }
});

/* eslint-disable no-lonely-if */
/**
 * Legacy code. Should avoid to use if you are new to import these code.
 */
undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function arrDel(list, value) {
  if (!list) return [];
  const clone = list.slice();
  const index = clone.indexOf(value);
  if (index >= 0) {
    clone.splice(index, 1);
  }
  return clone;
}
function arrAdd(list, value) {
  const clone = (list || []).slice();
  if (clone.indexOf(value) === -1) {
    clone.push(value);
  }
  return clone;
}
function posToArr(pos) {
  return pos.split('-');
}
function getPosition(level, index) {
  return `${level}-${index}`;
}
function isTreeNode(node) {
  return node && node.type && node.type.isTreeNode;
}
function getDragChildrenKeys(dragNodeKey, keyEntities) {
  // not contains self
  // self for left or right drag
  const dragChildrenKeys = [];
  const entity = keyEntities[dragNodeKey];
  function dig() {
    let list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    list.forEach(_ref => {
      let {
        key,
        children
      } = _ref;
      dragChildrenKeys.push(key);
      dig(children);
    });
  }
  dig(entity.children);
  return dragChildrenKeys;
}
function isLastChild(treeNodeEntity) {
  if (treeNodeEntity.parent) {
    const posArr = posToArr(treeNodeEntity.pos);
    return Number(posArr[posArr.length - 1]) === treeNodeEntity.parent.children.length - 1;
  }
  return false;
}
function isFirstChild(treeNodeEntity) {
  const posArr = posToArr(treeNodeEntity.pos);
  return Number(posArr[posArr.length - 1]) === 0;
}
// Only used when drag, not affect SSR.
function calcDropPosition(event, dragNode, targetNode, indent, startMousePosition, allowDrop, flattenedNodes, keyEntities, expandKeysSet, direction) {
  var _a;
  const {
    clientX,
    clientY
  } = event;
  const {
    top,
    height
  } = event.target.getBoundingClientRect();
  // optional chain for testing
  const horizontalMouseOffset = (direction === 'rtl' ? -1 : 1) * (((startMousePosition === null || startMousePosition === void 0 ? void 0 : startMousePosition.x) || 0) - clientX);
  const rawDropLevelOffset = (horizontalMouseOffset - 12) / indent;
  // find abstract drop node by horizontal offset
  let abstractDropNodeEntity = keyEntities[targetNode.eventKey];
  if (clientY < top + height / 2) {
    // first half, set abstract drop node to previous node
    const nodeIndex = flattenedNodes.findIndex(flattenedNode => flattenedNode.key === abstractDropNodeEntity.key);
    const prevNodeIndex = nodeIndex <= 0 ? 0 : nodeIndex - 1;
    const prevNodeKey = flattenedNodes[prevNodeIndex].key;
    abstractDropNodeEntity = keyEntities[prevNodeKey];
  }
  const initialAbstractDropNodeKey = abstractDropNodeEntity.key;
  const abstractDragOverEntity = abstractDropNodeEntity;
  const dragOverNodeKey = abstractDropNodeEntity.key;
  let dropPosition = 0;
  let dropLevelOffset = 0;
  // Only allow cross level drop when dragging on a non-expanded node
  if (!expandKeysSet.has(initialAbstractDropNodeKey)) {
    for (let i = 0; i < rawDropLevelOffset; i += 1) {
      if (isLastChild(abstractDropNodeEntity)) {
        abstractDropNodeEntity = abstractDropNodeEntity.parent;
        dropLevelOffset += 1;
      } else {
        break;
      }
    }
  }
  const abstractDragDataNode = dragNode.eventData;
  const abstractDropDataNode = abstractDropNodeEntity.node;
  let dropAllowed = true;
  if (isFirstChild(abstractDropNodeEntity) && abstractDropNodeEntity.level === 0 && clientY < top + height / 2 && allowDrop({
    dragNode: abstractDragDataNode,
    dropNode: abstractDropDataNode,
    dropPosition: -1
  }) && abstractDropNodeEntity.key === targetNode.eventKey) {
    // first half of first node in first level
    dropPosition = -1;
  } else if ((abstractDragOverEntity.children || []).length && expandKeysSet.has(dragOverNodeKey)) {
    // drop on expanded node
    // only allow drop inside
    if (allowDrop({
      dragNode: abstractDragDataNode,
      dropNode: abstractDropDataNode,
      dropPosition: 0
    })) {
      dropPosition = 0;
    } else {
      dropAllowed = false;
    }
  } else if (dropLevelOffset === 0) {
    if (rawDropLevelOffset > -1.5) {
      // | Node     | <- abstractDropNode
      // | -^-===== | <- mousePosition
      // 1. try drop after
      // 2. do not allow drop
      if (allowDrop({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 1
      })) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    } else {
      // | Node     | <- abstractDropNode
      // | ---==^== | <- mousePosition
      // whether it has children or doesn't has children
      // always
      // 1. try drop inside
      // 2. try drop after
      // 3. do not allow drop
      if (allowDrop({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 0
      })) {
        dropPosition = 0;
      } else if (allowDrop({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 1
      })) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    }
  } else {
    // | Node1 | <- abstractDropNode
    //      |  Node2  |
    // --^--|----=====| <- mousePosition
    // 1. try insert after Node1
    // 2. do not allow drop
    if (allowDrop({
      dragNode: abstractDragDataNode,
      dropNode: abstractDropDataNode,
      dropPosition: 1
    })) {
      dropPosition = 1;
    } else {
      dropAllowed = false;
    }
  }
  return {
    dropPosition,
    dropLevelOffset,
    dropTargetKey: abstractDropNodeEntity.key,
    dropTargetPos: abstractDropNodeEntity.pos,
    dragOverNodeKey,
    dropContainerKey: dropPosition === 0 ? null : ((_a = abstractDropNodeEntity.parent) === null || _a === void 0 ? void 0 : _a.key) || null,
    dropAllowed
  };
}
/**
 * Return selectedKeys according with multiple prop
 * @param selectedKeys
 * @param props
 * @returns [string]
 */
function calcSelectedKeys(selectedKeys, props) {
  if (!selectedKeys) return undefined;
  const {
    multiple
  } = props;
  if (multiple) {
    return selectedKeys.slice();
  }
  if (selectedKeys.length) {
    return [selectedKeys[0]];
  }
  return selectedKeys;
}
/**
 * Parse `checkedKeys` to { checkedKeys, halfCheckedKeys } style
 */
function parseCheckedKeys(keys) {
  if (!keys) {
    return null;
  }
  // Convert keys to object format
  let keyProps;
  if (Array.isArray(keys)) {
    // [Legacy] Follow the api doc
    keyProps = {
      checkedKeys: keys,
      halfCheckedKeys: undefined
    };
  } else if (typeof keys === 'object') {
    keyProps = {
      checkedKeys: keys.checked || undefined,
      halfCheckedKeys: keys.halfChecked || undefined
    };
  } else {
    return null;
  }
  return keyProps;
}
/**
 * If user use `autoExpandParent` we should get the list of parent node
 * @param keyList
 * @param keyEntities
 */
function conductExpandParent(keyList, keyEntities) {
  const expandedKeys = new Set();
  function conductUp(key) {
    if (expandedKeys.has(key)) return;
    const entity = keyEntities[key];
    if (!entity) return;
    expandedKeys.add(key);
    const {
      parent,
      node
    } = entity;
    if (node.disabled) return;
    if (parent) {
      conductUp(parent.key);
    }
  }
  (keyList || []).forEach(key => {
    conductUp(key);
  });
  return [...expandedKeys];
}

var __rest$4 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function getKey(key, pos) {
  if (key !== null && key !== undefined) {
    return key;
  }
  return pos;
}
function fillFieldNames(fieldNames) {
  const {
    title,
    _title,
    key,
    children
  } = fieldNames || {};
  const mergedTitle = title || 'title';
  return {
    title: mergedTitle,
    _title: _title || [mergedTitle],
    key: key || 'key',
    children: children || 'children'
  };
}
/**
 * Convert `children` of Tree into `treeData` structure.
 */
function convertTreeToData(rootNodes) {
  function dig() {
    let node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    const treeNodes = filterEmpty(node);
    return treeNodes.map(treeNode => {
      var _a, _b, _c, _d;
      // Filter invalidate node
      if (!isTreeNode(treeNode)) {
        return null;
      }
      const slots = treeNode.children || {};
      const key = treeNode.key;
      const props = {};
      for (const [k, v] of Object.entries(treeNode.props)) {
        props[camelize(k)] = v;
      }
      const {
        isLeaf,
        checkable,
        selectable,
        disabled,
        disableCheckbox
      } = props;
      // 默认值为 undefined
      const newProps = {
        isLeaf: isLeaf || isLeaf === '' || undefined,
        checkable: checkable || checkable === '' || undefined,
        selectable: selectable || selectable === '' || undefined,
        disabled: disabled || disabled === '' || undefined,
        disableCheckbox: disableCheckbox || disableCheckbox === '' || undefined
      };
      const slotsProps = _extends(_extends({}, props), newProps);
      const {
          title = (_a = slots.title) === null || _a === void 0 ? void 0 : _a.call(slots, slotsProps),
          icon = (_b = slots.icon) === null || _b === void 0 ? void 0 : _b.call(slots, slotsProps),
          switcherIcon = (_c = slots.switcherIcon) === null || _c === void 0 ? void 0 : _c.call(slots, slotsProps)
        } = props,
        rest = __rest$4(props, ["title", "icon", "switcherIcon"]);
      const children = (_d = slots.default) === null || _d === void 0 ? void 0 : _d.call(slots);
      const dataNode = _extends(_extends(_extends({}, rest), {
        title,
        icon,
        switcherIcon,
        key,
        isLeaf
      }), newProps);
      const parsedChildren = dig(children);
      if (parsedChildren.length) {
        dataNode.children = parsedChildren;
      }
      return dataNode;
    });
  }
  return dig(rootNodes);
}
/**
 * Flat nest tree data into flatten list. This is used for virtual list render.
 * @param treeNodeList Origin data node list
 * @param expandedKeys
 * need expanded keys, provides `true` means all expanded (used in `rc-tree-select`).
 */
function flattenTreeData(treeNodeList, expandedKeys, fieldNames) {
  const {
    _title: fieldTitles,
    key: fieldKey,
    children: fieldChildren
  } = fillFieldNames(fieldNames);
  const expandedKeySet = new Set(expandedKeys === true ? [] : expandedKeys);
  const flattenList = [];
  function dig(list) {
    let parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return list.map((treeNode, index) => {
      const pos = getPosition(parent ? parent.pos : '0', index);
      const mergedKey = getKey(treeNode[fieldKey], pos);
      // Pick matched title in field title list
      let mergedTitle;
      for (let i = 0; i < fieldTitles.length; i += 1) {
        const fieldTitle = fieldTitles[i];
        if (treeNode[fieldTitle] !== undefined) {
          mergedTitle = treeNode[fieldTitle];
          break;
        }
      }
      // Add FlattenDataNode into list
      const flattenNode = _extends(_extends({}, omit(treeNode, [...fieldTitles, fieldKey, fieldChildren])), {
        title: mergedTitle,
        key: mergedKey,
        parent,
        pos,
        children: null,
        data: treeNode,
        isStart: [...(parent ? parent.isStart : []), index === 0],
        isEnd: [...(parent ? parent.isEnd : []), index === list.length - 1]
      });
      flattenList.push(flattenNode);
      // Loop treeNode children
      if (expandedKeys === true || expandedKeySet.has(mergedKey)) {
        flattenNode.children = dig(treeNode[fieldChildren] || [], flattenNode);
      } else {
        flattenNode.children = [];
      }
      return flattenNode;
    });
  }
  dig(treeNodeList);
  return flattenList;
}
/**
 * Traverse all the data by `treeData`.
 * Please not use it out of the `rc-tree` since we may refactor this code.
 */
function traverseDataNodes(dataNodes, callback,
// To avoid too many params, let use config instead of origin param
config) {
  let mergedConfig = {};
  if (typeof config === 'object') {
    mergedConfig = config;
  } else {
    mergedConfig = {
      externalGetKey: config
    };
  }
  mergedConfig = mergedConfig || {};
  // Init config
  const {
    childrenPropName,
    externalGetKey,
    fieldNames
  } = mergedConfig;
  const {
    key: fieldKey,
    children: fieldChildren
  } = fillFieldNames(fieldNames);
  const mergeChildrenPropName = childrenPropName || fieldChildren;
  // Get keys
  let syntheticGetKey;
  if (externalGetKey) {
    if (typeof externalGetKey === 'string') {
      syntheticGetKey = node => node[externalGetKey];
    } else if (typeof externalGetKey === 'function') {
      syntheticGetKey = node => externalGetKey(node);
    }
  } else {
    syntheticGetKey = (node, pos) => getKey(node[fieldKey], pos);
  }
  // Process
  function processNode(node, index, parent, pathNodes) {
    const children = node ? node[mergeChildrenPropName] : dataNodes;
    const pos = node ? getPosition(parent.pos, index) : '0';
    const connectNodes = node ? [...pathNodes, node] : [];
    // Process node if is not root
    if (node) {
      const key = syntheticGetKey(node, pos);
      const data = {
        node,
        index,
        pos,
        key,
        parentPos: parent.node ? parent.pos : null,
        level: parent.level + 1,
        nodes: connectNodes
      };
      callback(data);
    }
    // Process children node
    if (children) {
      children.forEach((subNode, subIndex) => {
        processNode(subNode, subIndex, {
          node,
          pos,
          level: parent ? parent.level + 1 : -1
        }, connectNodes);
      });
    }
  }
  processNode(null);
}
/**
 * Convert `treeData` into entity records.
 */
function convertDataToEntities(dataNodes) {
  let {
    initWrapper,
    processEntity,
    onProcessFinished,
    externalGetKey,
    childrenPropName,
    fieldNames
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let /** @deprecated Use `config.externalGetKey` instead */
  legacyExternalGetKey = arguments.length > 2 ? arguments[2] : undefined;
  // Init config
  const mergedExternalGetKey = externalGetKey || legacyExternalGetKey;
  const posEntities = {};
  const keyEntities = {};
  let wrapper = {
    posEntities,
    keyEntities
  };
  if (initWrapper) {
    wrapper = initWrapper(wrapper) || wrapper;
  }
  traverseDataNodes(dataNodes, item => {
    const {
      node,
      index,
      pos,
      key,
      parentPos,
      level,
      nodes
    } = item;
    const entity = {
      node,
      nodes,
      index,
      key,
      pos,
      level
    };
    const mergedKey = getKey(key, pos);
    posEntities[pos] = entity;
    keyEntities[mergedKey] = entity;
    // Fill children
    entity.parent = posEntities[parentPos];
    if (entity.parent) {
      entity.parent.children = entity.parent.children || [];
      entity.parent.children.push(entity);
    }
    if (processEntity) {
      processEntity(entity, wrapper);
    }
  }, {
    externalGetKey: mergedExternalGetKey,
    childrenPropName,
    fieldNames
  });
  if (onProcessFinished) {
    onProcessFinished(wrapper);
  }
  return wrapper;
}
/**
 * Get TreeNode props with Tree props.
 */
function getTreeNodeProps(key, _ref) {
  let {
    expandedKeysSet,
    selectedKeysSet,
    loadedKeysSet,
    loadingKeysSet,
    checkedKeysSet,
    halfCheckedKeysSet,
    dragOverNodeKey,
    dropPosition,
    keyEntities
  } = _ref;
  const entity = keyEntities[key];
  const treeNodeProps = {
    eventKey: key,
    expanded: expandedKeysSet.has(key),
    selected: selectedKeysSet.has(key),
    loaded: loadedKeysSet.has(key),
    loading: loadingKeysSet.has(key),
    checked: checkedKeysSet.has(key),
    halfChecked: halfCheckedKeysSet.has(key),
    pos: String(entity ? entity.pos : ''),
    parent: entity.parent,
    // [Legacy] Drag props
    // Since the interaction of drag is changed, the semantic of the props are
    // not accuracy, I think it should be finally removed
    dragOver: dragOverNodeKey === key && dropPosition === 0,
    dragOverGapTop: dragOverNodeKey === key && dropPosition === -1,
    dragOverGapBottom: dragOverNodeKey === key && dropPosition === 1
  };
  return treeNodeProps;
}
function convertNodePropsToEventData(props) {
  const {
    data,
    expanded,
    selected,
    checked,
    loaded,
    loading,
    halfChecked,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    pos,
    active,
    eventKey
  } = props;
  const eventData = _extends(_extends({
    dataRef: data
  }, data), {
    expanded,
    selected,
    checked,
    loaded,
    loading,
    halfChecked,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    pos,
    active,
    eventKey,
    key: eventKey
  });
  if (!('props' in eventData)) {
    Object.defineProperty(eventData, 'props', {
      get() {
        return props;
      }
    });
  }
  return eventData;
}

function removeFromCheckedKeys(halfCheckedKeys, checkedKeys) {
  const filteredKeys = new Set();
  halfCheckedKeys.forEach(key => {
    if (!checkedKeys.has(key)) {
      filteredKeys.add(key);
    }
  });
  return filteredKeys;
}
function isCheckDisabled(node) {
  const {
    disabled,
    disableCheckbox,
    checkable
  } = node || {};
  return !!(disabled || disableCheckbox) || checkable === false;
}
// Fill miss keys
function fillConductCheck(keys, levelEntities, maxLevel, syntheticGetCheckDisabled) {
  const checkedKeys = new Set(keys);
  const halfCheckedKeys = new Set();
  // Add checked keys top to bottom
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set();
    entities.forEach(entity => {
      const {
        key,
        node,
        children = []
      } = entity;
      if (checkedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children.filter(childEntity => !syntheticGetCheckDisabled(childEntity.node)).forEach(childEntity => {
          checkedKeys.add(childEntity.key);
        });
      }
    });
  }
  // Add checked keys from bottom to top
  const visitedKeys = new Set();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set();
    entities.forEach(entity => {
      const {
        parent,
        node
      } = entity;
      // Skip if no need to check
      if (syntheticGetCheckDisabled(node) || !entity.parent || visitedKeys.has(entity.parent.key)) {
        return;
      }
      // Skip if parent is disabled
      if (syntheticGetCheckDisabled(entity.parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || []).filter(childEntity => !syntheticGetCheckDisabled(childEntity.node)).forEach(_ref => {
        let {
          key
        } = _ref;
        const checked = checkedKeys.has(key);
        if (allChecked && !checked) {
          allChecked = false;
        }
        if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
          partialChecked = true;
        }
      });
      if (allChecked) {
        checkedKeys.add(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys))
  };
}
// Remove useless key
function cleanConductCheck(keys, halfKeys, levelEntities, maxLevel, syntheticGetCheckDisabled) {
  const checkedKeys = new Set(keys);
  let halfCheckedKeys = new Set(halfKeys);
  // Remove checked keys from top to bottom
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set();
    entities.forEach(entity => {
      const {
        key,
        node,
        children = []
      } = entity;
      if (!checkedKeys.has(key) && !halfCheckedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children.filter(childEntity => !syntheticGetCheckDisabled(childEntity.node)).forEach(childEntity => {
          checkedKeys.delete(childEntity.key);
        });
      }
    });
  }
  // Remove checked keys form bottom to top
  halfCheckedKeys = new Set();
  const visitedKeys = new Set();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set();
    entities.forEach(entity => {
      const {
        parent,
        node
      } = entity;
      // Skip if no need to check
      if (syntheticGetCheckDisabled(node) || !entity.parent || visitedKeys.has(entity.parent.key)) {
        return;
      }
      // Skip if parent is disabled
      if (syntheticGetCheckDisabled(entity.parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || []).filter(childEntity => !syntheticGetCheckDisabled(childEntity.node)).forEach(_ref2 => {
        let {
          key
        } = _ref2;
        const checked = checkedKeys.has(key);
        if (allChecked && !checked) {
          allChecked = false;
        }
        if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
          partialChecked = true;
        }
      });
      if (!allChecked) {
        checkedKeys.delete(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys))
  };
}
/**
 * Conduct with keys.
 * @param keyList current key list
 * @param keyEntities key - dataEntity map
 * @param mode `fill` to fill missing key, `clean` to remove useless key
 */
function conductCheck(keyList, checked, keyEntities, maxLevel, levelEntities, getCheckDisabled) {
  let syntheticGetCheckDisabled;
  if (getCheckDisabled) {
    syntheticGetCheckDisabled = getCheckDisabled;
  } else {
    syntheticGetCheckDisabled = isCheckDisabled;
  }
  // We only handle exist keys
  const keys = new Set(keyList.filter(key => {
    const hasEntity = !!keyEntities[key];
    return hasEntity;
  }));
  let result;
  if (checked === true) {
    result = fillConductCheck(keys, levelEntities, maxLevel, syntheticGetCheckDisabled);
  } else {
    result = cleanConductCheck(keys, checked.halfCheckedKeys, levelEntities, maxLevel, syntheticGetCheckDisabled);
  }
  return result;
}

function useMaxLevel(keyEntities) {
  const maxLevel = ref(0);
  const levelEntities = shallowRef();
  watchEffect(() => {
    const newLevelEntities = new Map();
    let newMaxLevel = 0;
    const keyEntitiesValue = keyEntities.value || {};
    // Convert entities by level for calculation
    for (const key in keyEntitiesValue) {
      if (Object.prototype.hasOwnProperty.call(keyEntitiesValue, key)) {
        const entity = keyEntitiesValue[key];
        const {
          level
        } = entity;
        let levelSet = newLevelEntities.get(level);
        if (!levelSet) {
          levelSet = new Set();
          newLevelEntities.set(level, levelSet);
        }
        levelSet.add(entity);
        newMaxLevel = Math.max(newMaxLevel, level);
      }
    }
    maxLevel.value = newMaxLevel;
    levelEntities.value = newLevelEntities;
  });
  return {
    maxLevel,
    levelEntities
  };
}

// ============================== Motion ==============================
const antCheckboxEffect = new Keyframe('antCheckboxEffect', {
  '0%': {
    transform: 'scale(1)',
    opacity: 0.5
  },
  '100%': {
    transform: 'scale(1.6)',
    opacity: 0
  }
});
// ============================== Styles ==============================
const genCheckboxStyle = token => {
  const {
    checkboxCls
  } = token;
  const wrapperCls = `${checkboxCls}-wrapper`;
  return [
  // ===================== Basic =====================
  {
    // Group
    [`${checkboxCls}-group`]: _extends(_extends({}, resetComponent(token)), {
      display: 'inline-flex',
      flexWrap: 'wrap',
      columnGap: token.marginXS,
      // Group > Grid
      [`> ${token.antCls}-row`]: {
        flex: 1
      }
    }),
    // Wrapper
    [wrapperCls]: _extends(_extends({}, resetComponent(token)), {
      display: 'inline-flex',
      alignItems: 'baseline',
      cursor: 'pointer',
      // Fix checkbox & radio in flex align #30260
      '&:after': {
        display: 'inline-block',
        width: 0,
        overflow: 'hidden',
        content: "'\\a0'"
      },
      // Checkbox near checkbox
      [`& + ${wrapperCls}`]: {
        marginInlineStart: 0
      },
      [`&${wrapperCls}-in-form-item`]: {
        'input[type="checkbox"]': {
          width: 14,
          height: 14 // FIXME: magic
        }
      }
    }),
    // Wrapper > Checkbox
    [checkboxCls]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      cursor: 'pointer',
      // To make alignment right when `controlHeight` is changed
      // Ref: https://github.com/ant-design/ant-design/issues/41564
      alignSelf: 'center',
      // Wrapper > Checkbox > input
      [`${checkboxCls}-input`]: {
        position: 'absolute',
        // Since baseline align will get additional space offset,
        // we need to move input to top to make it align with text.
        // Ref: https://github.com/ant-design/ant-design/issues/38926#issuecomment-1486137799
        inset: 0,
        zIndex: 1,
        cursor: 'pointer',
        opacity: 0,
        margin: 0,
        [`&:focus-visible + ${checkboxCls}-inner`]: _extends({}, genFocusOutline(token))
      },
      // Wrapper > Checkbox > inner
      [`${checkboxCls}-inner`]: {
        boxSizing: 'border-box',
        position: 'relative',
        top: 0,
        insetInlineStart: 0,
        display: 'block',
        width: token.checkboxSize,
        height: token.checkboxSize,
        direction: 'ltr',
        backgroundColor: token.colorBgContainer,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
        borderRadius: token.borderRadiusSM,
        borderCollapse: 'separate',
        transition: `all ${token.motionDurationSlow}`,
        '&:after': {
          boxSizing: 'border-box',
          position: 'absolute',
          top: '50%',
          insetInlineStart: '21.5%',
          display: 'table',
          width: token.checkboxSize / 14 * 5,
          height: token.checkboxSize / 14 * 8,
          border: `${token.lineWidthBold}px solid ${token.colorWhite}`,
          borderTop: 0,
          borderInlineStart: 0,
          transform: 'rotate(45deg) scale(0) translate(-50%,-50%)',
          opacity: 0,
          content: '""',
          transition: `all ${token.motionDurationFast} ${token.motionEaseInBack}, opacity ${token.motionDurationFast}`
        }
      },
      // Wrapper > Checkbox + Text
      '& + span': {
        paddingInlineStart: token.paddingXS,
        paddingInlineEnd: token.paddingXS
      }
    })
  },
  // ================= Indeterminate =================
  {
    [checkboxCls]: {
      '&-indeterminate': {
        // Wrapper > Checkbox > inner
        [`${checkboxCls}-inner`]: {
          '&:after': {
            top: '50%',
            insetInlineStart: '50%',
            width: token.fontSizeLG / 2,
            height: token.fontSizeLG / 2,
            backgroundColor: token.colorPrimary,
            border: 0,
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: 1,
            content: '""'
          }
        }
      }
    }
  },
  // ===================== Hover =====================
  {
    // Wrapper
    [`${wrapperCls}:hover ${checkboxCls}:after`]: {
      visibility: 'visible'
    },
    // Wrapper & Wrapper > Checkbox
    [`
        ${wrapperCls}:not(${wrapperCls}-disabled),
        ${checkboxCls}:not(${checkboxCls}-disabled)
      `]: {
      [`&:hover ${checkboxCls}-inner`]: {
        borderColor: token.colorPrimary
      }
    },
    [`${wrapperCls}:not(${wrapperCls}-disabled)`]: {
      [`&:hover ${checkboxCls}-checked:not(${checkboxCls}-disabled) ${checkboxCls}-inner`]: {
        backgroundColor: token.colorPrimaryHover,
        borderColor: 'transparent'
      },
      [`&:hover ${checkboxCls}-checked:not(${checkboxCls}-disabled):after`]: {
        borderColor: token.colorPrimaryHover
      }
    }
  },
  // ==================== Checked ====================
  {
    // Wrapper > Checkbox
    [`${checkboxCls}-checked`]: {
      [`${checkboxCls}-inner`]: {
        backgroundColor: token.colorPrimary,
        borderColor: token.colorPrimary,
        '&:after': {
          opacity: 1,
          transform: 'rotate(45deg) scale(1) translate(-50%,-50%)',
          transition: `all ${token.motionDurationMid} ${token.motionEaseOutBack} ${token.motionDurationFast}`
        }
      },
      // Checked Effect
      '&:after': {
        position: 'absolute',
        top: 0,
        insetInlineStart: 0,
        width: '100%',
        height: '100%',
        borderRadius: token.borderRadiusSM,
        visibility: 'hidden',
        border: `${token.lineWidthBold}px solid ${token.colorPrimary}`,
        animationName: antCheckboxEffect,
        animationDuration: token.motionDurationSlow,
        animationTimingFunction: 'ease-in-out',
        animationFillMode: 'backwards',
        content: '""',
        transition: `all ${token.motionDurationSlow}`
      }
    },
    [`
        ${wrapperCls}-checked:not(${wrapperCls}-disabled),
        ${checkboxCls}-checked:not(${checkboxCls}-disabled)
      `]: {
      [`&:hover ${checkboxCls}-inner`]: {
        backgroundColor: token.colorPrimaryHover,
        borderColor: 'transparent'
      },
      [`&:hover ${checkboxCls}:after`]: {
        borderColor: token.colorPrimaryHover
      }
    }
  },
  // ==================== Disable ====================
  {
    // Wrapper
    [`${wrapperCls}-disabled`]: {
      cursor: 'not-allowed'
    },
    // Wrapper > Checkbox
    [`${checkboxCls}-disabled`]: {
      // Wrapper > Checkbox > input
      [`&, ${checkboxCls}-input`]: {
        cursor: 'not-allowed',
        // Disabled for native input to enable Tooltip event handler
        // ref: https://github.com/ant-design/ant-design/issues/39822#issuecomment-1365075901
        pointerEvents: 'none'
      },
      // Wrapper > Checkbox > inner
      [`${checkboxCls}-inner`]: {
        background: token.colorBgContainerDisabled,
        borderColor: token.colorBorder,
        '&:after': {
          borderColor: token.colorTextDisabled
        }
      },
      '&:after': {
        display: 'none'
      },
      '& + span': {
        color: token.colorTextDisabled
      },
      [`&${checkboxCls}-indeterminate ${checkboxCls}-inner::after`]: {
        background: token.colorTextDisabled
      }
    }
  }];
};
// ============================== Export ==============================
function getStyle(prefixCls, token) {
  const checkboxToken = merge(token, {
    checkboxCls: `.${prefixCls}`,
    checkboxSize: token.controlInteractiveSize
  });
  return [genCheckboxStyle(checkboxToken)];
}
const useStyle$2 = genComponentStyleHook('Checkbox', (token, _ref) => {
  let {
    prefixCls
  } = _ref;
  return [getStyle(prefixCls, token)];
});

const antSpinMove = new Keyframe('antSpinMove', {
  to: {
    opacity: 1
  }
});
const antRotate = new Keyframe('antRotate', {
  to: {
    transform: 'rotate(405deg)'
  }
});
const genSpinStyle = token => ({
  [`${token.componentCls}`]: _extends(_extends({}, resetComponent(token)), {
    position: 'absolute',
    display: 'none',
    color: token.colorPrimary,
    textAlign: 'center',
    verticalAlign: 'middle',
    opacity: 0,
    transition: `transform ${token.motionDurationSlow} ${token.motionEaseInOutCirc}`,
    '&-spinning': {
      position: 'static',
      display: 'inline-block',
      opacity: 1
    },
    '&-nested-loading': {
      position: 'relative',
      [`> div > ${token.componentCls}`]: {
        position: 'absolute',
        top: 0,
        insetInlineStart: 0,
        zIndex: 4,
        display: 'block',
        width: '100%',
        height: '100%',
        maxHeight: token.contentHeight,
        [`${token.componentCls}-dot`]: {
          position: 'absolute',
          top: '50%',
          insetInlineStart: '50%',
          margin: -token.spinDotSize / 2
        },
        [`${token.componentCls}-text`]: {
          position: 'absolute',
          top: '50%',
          width: '100%',
          paddingTop: (token.spinDotSize - token.fontSize) / 2 + 2,
          textShadow: `0 1px 2px ${token.colorBgContainer}` // FIXME: shadow
        },
        [`&${token.componentCls}-show-text ${token.componentCls}-dot`]: {
          marginTop: -(token.spinDotSize / 2) - 10
        },
        '&-sm': {
          [`${token.componentCls}-dot`]: {
            margin: -token.spinDotSizeSM / 2
          },
          [`${token.componentCls}-text`]: {
            paddingTop: (token.spinDotSizeSM - token.fontSize) / 2 + 2
          },
          [`&${token.componentCls}-show-text ${token.componentCls}-dot`]: {
            marginTop: -(token.spinDotSizeSM / 2) - 10
          }
        },
        '&-lg': {
          [`${token.componentCls}-dot`]: {
            margin: -(token.spinDotSizeLG / 2)
          },
          [`${token.componentCls}-text`]: {
            paddingTop: (token.spinDotSizeLG - token.fontSize) / 2 + 2
          },
          [`&${token.componentCls}-show-text ${token.componentCls}-dot`]: {
            marginTop: -(token.spinDotSizeLG / 2) - 10
          }
        }
      },
      [`${token.componentCls}-container`]: {
        position: 'relative',
        transition: `opacity ${token.motionDurationSlow}`,
        '&::after': {
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          bottom: 0,
          insetInlineStart: 0,
          zIndex: 10,
          width: '100%',
          height: '100%',
          background: token.colorBgContainer,
          opacity: 0,
          transition: `all ${token.motionDurationSlow}`,
          content: '""',
          pointerEvents: 'none'
        }
      },
      [`${token.componentCls}-blur`]: {
        clear: 'both',
        opacity: 0.5,
        userSelect: 'none',
        pointerEvents: 'none',
        [`&::after`]: {
          opacity: 0.4,
          pointerEvents: 'auto'
        }
      }
    },
    // tip
    // ------------------------------
    [`&-tip`]: {
      color: token.spinDotDefault
    },
    // dots
    // ------------------------------
    [`${token.componentCls}-dot`]: {
      position: 'relative',
      display: 'inline-block',
      fontSize: token.spinDotSize,
      width: '1em',
      height: '1em',
      '&-item': {
        position: 'absolute',
        display: 'block',
        width: (token.spinDotSize - token.marginXXS / 2) / 2,
        height: (token.spinDotSize - token.marginXXS / 2) / 2,
        backgroundColor: token.colorPrimary,
        borderRadius: '100%',
        transform: 'scale(0.75)',
        transformOrigin: '50% 50%',
        opacity: 0.3,
        animationName: antSpinMove,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
        animationDirection: 'alternate',
        '&:nth-child(1)': {
          top: 0,
          insetInlineStart: 0
        },
        '&:nth-child(2)': {
          top: 0,
          insetInlineEnd: 0,
          animationDelay: '0.4s'
        },
        '&:nth-child(3)': {
          insetInlineEnd: 0,
          bottom: 0,
          animationDelay: '0.8s'
        },
        '&:nth-child(4)': {
          bottom: 0,
          insetInlineStart: 0,
          animationDelay: '1.2s'
        }
      },
      '&-spin': {
        transform: 'rotate(45deg)',
        animationName: antRotate,
        animationDuration: '1.2s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear'
      }
    },
    // Sizes
    // ------------------------------
    // small
    [`&-sm ${token.componentCls}-dot`]: {
      fontSize: token.spinDotSizeSM,
      i: {
        width: (token.spinDotSizeSM - token.marginXXS / 2) / 2,
        height: (token.spinDotSizeSM - token.marginXXS / 2) / 2
      }
    },
    // large
    [`&-lg ${token.componentCls}-dot`]: {
      fontSize: token.spinDotSizeLG,
      i: {
        width: (token.spinDotSizeLG - token.marginXXS) / 2,
        height: (token.spinDotSizeLG - token.marginXXS) / 2
      }
    },
    [`&${token.componentCls}-show-text ${token.componentCls}-text`]: {
      display: 'block'
    }
  })
});
// ============================== Export ==============================
const useStyle$1 = genComponentStyleHook('Spin', token => {
  const spinToken = merge(token, {
    spinDotDefault: token.colorTextDescription,
    spinDotSize: token.controlHeightLG / 2,
    spinDotSizeSM: token.controlHeightLG * 0.35,
    spinDotSizeLG: token.controlHeight
  });
  return [genSpinStyle(spinToken)];
}, {
  contentHeight: 400
});

var __rest$3 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const spinProps = () => ({
  prefixCls: String,
  spinning: {
    type: Boolean,
    default: undefined
  },
  size: String,
  wrapperClassName: String,
  tip: PropTypes.any,
  delay: Number,
  indicator: PropTypes.any
});
// Render indicator
let defaultIndicator = null;
function shouldDelay(spinning, delay) {
  return !!spinning && !!delay && !isNaN(Number(delay));
}
function setDefaultIndicator(Content) {
  const Indicator = Content.indicator;
  defaultIndicator = typeof Indicator === 'function' ? Indicator : () => createVNode(Indicator, null, null);
}
const Spin = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASpin',
  inheritAttrs: false,
  props: initDefaultProps(spinProps(), {
    size: 'default',
    spinning: true,
    wrapperClassName: ''
  }),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      prefixCls,
      size,
      direction
    } = useConfigInject('spin', props);
    const [wrapSSR, hashId] = useStyle$1(prefixCls);
    const sSpinning = shallowRef(props.spinning && !shouldDelay(props.spinning, props.delay));
    let updateSpinning;
    watch([() => props.spinning, () => props.delay], () => {
      updateSpinning === null || updateSpinning === void 0 ? void 0 : updateSpinning.cancel();
      updateSpinning = debounce(props.delay, () => {
        sSpinning.value = props.spinning;
      });
      updateSpinning === null || updateSpinning === void 0 ? void 0 : updateSpinning();
    }, {
      immediate: true,
      flush: 'post'
    });
    onBeforeUnmount(() => {
      updateSpinning === null || updateSpinning === void 0 ? void 0 : updateSpinning.cancel();
    });
    return () => {
      var _a, _b;
      const {
          class: cls
        } = attrs,
        divProps = __rest$3(attrs, ["class"]);
      const {
        tip = (_a = slots.tip) === null || _a === void 0 ? void 0 : _a.call(slots)
      } = props;
      const children = (_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots);
      const spinClassName = {
        [hashId.value]: true,
        [prefixCls.value]: true,
        [`${prefixCls.value}-sm`]: size.value === 'small',
        [`${prefixCls.value}-lg`]: size.value === 'large',
        [`${prefixCls.value}-spinning`]: sSpinning.value,
        [`${prefixCls.value}-show-text`]: !!tip,
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
        [cls]: !!cls
      };
      function renderIndicator(prefixCls) {
        const dotClassName = `${prefixCls}-dot`;
        let indicator = getPropsSlot(slots, props, 'indicator');
        // should not be render default indicator when indicator value is null
        if (indicator === null) {
          return null;
        }
        if (Array.isArray(indicator)) {
          indicator = indicator.length === 1 ? indicator[0] : indicator;
        }
        if (isVNode(indicator)) {
          return cloneVNode(indicator, {
            class: dotClassName
          });
        }
        if (defaultIndicator && isVNode(defaultIndicator())) {
          return cloneVNode(defaultIndicator(), {
            class: dotClassName
          });
        }
        return createVNode("span", {
          "class": `${dotClassName} ${prefixCls}-dot-spin`
        }, [createVNode("i", {
          "class": `${prefixCls}-dot-item`
        }, null), createVNode("i", {
          "class": `${prefixCls}-dot-item`
        }, null), createVNode("i", {
          "class": `${prefixCls}-dot-item`
        }, null), createVNode("i", {
          "class": `${prefixCls}-dot-item`
        }, null)]);
      }
      const spinElement = createVNode("div", _objectSpread$8(_objectSpread$8({}, divProps), {}, {
        "class": spinClassName,
        "aria-live": "polite",
        "aria-busy": sSpinning.value
      }), [renderIndicator(prefixCls.value), tip ? createVNode("div", {
        "class": `${prefixCls.value}-text`
      }, [tip]) : null]);
      if (children && filterEmpty(children).length) {
        const containerClassName = {
          [`${prefixCls.value}-container`]: true,
          [`${prefixCls.value}-blur`]: sSpinning.value
        };
        return wrapSSR(createVNode("div", {
          "class": [`${prefixCls.value}-nested-loading`, props.wrapperClassName, hashId.value]
        }, [sSpinning.value && createVNode("div", {
          "key": "loading"
        }, [spinElement]), createVNode("div", {
          "class": containerClassName,
          "key": "container"
        }, [children])]));
      }
      return wrapSSR(spinElement);
    };
  }
});

Spin.setDefaultIndicator = setDefaultIndicator;
/* istanbul ignore next */
Spin.install = function (app) {
  app.component(Spin.name, Spin);
  return app;
};

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const MotionTreeNode = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'MotionTreeNode',
  inheritAttrs: false,
  props: _extends(_extends({}, treeNodeProps), {
    active: Boolean,
    motion: Object,
    motionNodes: {
      type: Array
    },
    onMotionStart: Function,
    onMotionEnd: Function,
    motionType: String
  }),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const visible = shallowRef(true);
    const context = useInjectTreeContext();
    const motionedRef = shallowRef(false);
    const transitionProps = computed(() => {
      if (props.motion) {
        return props.motion;
      } else {
        return collapseMotion();
      }
    });
    const onMotionEnd = (node, type) => {
      var _a, _b, _c, _d;
      if (type === 'appear') {
        (_b = (_a = transitionProps.value) === null || _a === void 0 ? void 0 : _a.onAfterEnter) === null || _b === void 0 ? void 0 : _b.call(_a, node);
      } else if (type === 'leave') {
        (_d = (_c = transitionProps.value) === null || _c === void 0 ? void 0 : _c.onAfterLeave) === null || _d === void 0 ? void 0 : _d.call(_c, node);
      }
      if (!motionedRef.value) {
        props.onMotionEnd();
      }
      motionedRef.value = true;
    };
    watch(() => props.motionNodes, () => {
      if (props.motionNodes && props.motionType === 'hide' && visible.value) {
        nextTick(() => {
          visible.value = false;
        });
      }
    }, {
      immediate: true,
      flush: 'post'
    });
    onMounted(() => {
      props.motionNodes && props.onMotionStart();
    });
    onBeforeUnmount(() => {
      props.motionNodes && onMotionEnd();
    });
    return () => {
      const {
          motion,
          motionNodes,
          motionType,
          active,
          eventKey
        } = props,
        otherProps = __rest$2(props, ["motion", "motionNodes", "motionType", "active", "eventKey"]);
      if (motionNodes) {
        return createVNode(Transition, _objectSpread$8(_objectSpread$8({}, transitionProps.value), {}, {
          "appear": motionType === 'show',
          "onAfterAppear": node => onMotionEnd(node, 'appear'),
          "onAfterLeave": node => onMotionEnd(node, 'leave')
        }), {
          default: () => [withDirectives(createVNode("div", {
            "class": `${context.value.prefixCls}-treenode-motion`
          }, [motionNodes.map(treeNode => {
            const restProps = __rest$2(treeNode.data, []),
              {
                title,
                key,
                isStart,
                isEnd
              } = treeNode;
            delete restProps.children;
            return createVNode(VcTreeNode, _objectSpread$8(_objectSpread$8({}, restProps), {}, {
              "title": title,
              "active": active,
              "data": treeNode.data,
              "key": key,
              "eventKey": key,
              "isStart": isStart,
              "isEnd": isEnd
            }), slots);
          })]), [[vShow, visible.value]])]
        });
      }
      return createVNode(VcTreeNode, _objectSpread$8(_objectSpread$8({
        "class": attrs.class,
        "style": attrs.style
      }, otherProps), {}, {
        "active": active,
        "eventKey": eventKey
      }), slots);
    };
  }
});

function findExpandedKeys() {
  let prev = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  let next = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  const prevLen = prev.length;
  const nextLen = next.length;
  if (Math.abs(prevLen - nextLen) !== 1) {
    return {
      add: false,
      key: null
    };
  }
  function find(shorter, longer) {
    const cache = new Map();
    shorter.forEach(key => {
      cache.set(key, true);
    });
    const keys = longer.filter(key => !cache.has(key));
    return keys.length === 1 ? keys[0] : null;
  }
  if (prevLen < nextLen) {
    return {
      add: true,
      key: find(prev, next)
    };
  }
  return {
    add: false,
    key: find(next, prev)
  };
}
function getExpandRange(shorter, longer, key) {
  const shorterStartIndex = shorter.findIndex(item => item.key === key);
  const shorterEndNode = shorter[shorterStartIndex + 1];
  const longerStartIndex = longer.findIndex(item => item.key === key);
  if (shorterEndNode) {
    const longerEndIndex = longer.findIndex(item => item.key === shorterEndNode.key);
    return longer.slice(longerStartIndex + 1, longerEndIndex);
  }
  return longer.slice(longerStartIndex + 1);
}

/**
 * Handle virtual list of the TreeNodes.
 */
var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const HIDDEN_STYLE = {
  width: 0,
  height: 0,
  display: 'flex',
  overflow: 'hidden',
  opacity: 0,
  border: 0,
  padding: 0,
  margin: 0
};
const noop = () => {};
const MOTION_KEY = `RC_TREE_MOTION_${Math.random()}`;
const MotionNode = {
  key: MOTION_KEY
};
const MotionEntity = {
  key: MOTION_KEY,
  level: 0,
  index: 0,
  pos: '0',
  node: MotionNode,
  nodes: [MotionNode]
};
const MotionFlattenData = {
  parent: null,
  children: [],
  pos: MotionEntity.pos,
  data: MotionNode,
  title: null,
  key: MOTION_KEY,
  /** Hold empty list here since we do not use it */
  isStart: [],
  isEnd: []
};
/**
 * We only need get visible content items to play the animation.
 */
function getMinimumRangeTransitionRange(list, virtual, height, itemHeight) {
  if (virtual === false || !height) {
    return list;
  }
  return list.slice(0, Math.ceil(height / itemHeight) + 1);
}
function itemKey(item) {
  const {
    key,
    pos
  } = item;
  return getKey(key, pos);
}
function getAccessibilityPath(item) {
  let path = String(item.key);
  let current = item;
  while (current.parent) {
    current = current.parent;
    path = `${current.key} > ${path}`;
  }
  return path;
}
const NodeList = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'NodeList',
  inheritAttrs: false,
  props: nodeListProps,
  setup(props, _ref) {
    let {
      expose,
      attrs
    } = _ref;
    // =============================== Ref ================================
    const listRef = ref();
    const indentMeasurerRef = ref();
    const {
      expandedKeys,
      flattenNodes
    } = useInjectKeysState();
    expose({
      scrollTo: scroll => {
        listRef.value.scrollTo(scroll);
      },
      getIndentWidth: () => indentMeasurerRef.value.offsetWidth
    });
    // ============================== Motion ==============================
    const transitionData = shallowRef(flattenNodes.value);
    const transitionRange = shallowRef([]);
    const motionType = ref(null);
    function onMotionEnd() {
      transitionData.value = flattenNodes.value;
      transitionRange.value = [];
      motionType.value = null;
      props.onListChangeEnd();
    }
    const context = useInjectTreeContext();
    watch([() => expandedKeys.value.slice(), flattenNodes], (_ref2, _ref3) => {
      let [expandedKeys, data] = _ref2;
      let [prevExpandedKeys, prevData] = _ref3;
      const diffExpanded = findExpandedKeys(prevExpandedKeys, expandedKeys);
      if (diffExpanded.key !== null) {
        const {
          virtual,
          height,
          itemHeight
        } = props;
        if (diffExpanded.add) {
          const keyIndex = prevData.findIndex(_ref4 => {
            let {
              key
            } = _ref4;
            return key === diffExpanded.key;
          });
          const rangeNodes = getMinimumRangeTransitionRange(getExpandRange(prevData, data, diffExpanded.key), virtual, height, itemHeight);
          const newTransitionData = prevData.slice();
          newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
          transitionData.value = newTransitionData;
          transitionRange.value = rangeNodes;
          motionType.value = 'show';
        } else {
          const keyIndex = data.findIndex(_ref5 => {
            let {
              key
            } = _ref5;
            return key === diffExpanded.key;
          });
          const rangeNodes = getMinimumRangeTransitionRange(getExpandRange(data, prevData, diffExpanded.key), virtual, height, itemHeight);
          const newTransitionData = data.slice();
          newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
          transitionData.value = newTransitionData;
          transitionRange.value = rangeNodes;
          motionType.value = 'hide';
        }
      } else if (prevData !== data) {
        transitionData.value = data;
      }
    });
    // We should clean up motion if is changed by dragging
    watch(() => context.value.dragging, dragging => {
      if (!dragging) {
        onMotionEnd();
      }
    });
    const mergedData = computed(() => props.motion === undefined ? transitionData.value : flattenNodes.value);
    const onActiveChange = () => {
      props.onActiveChange(null);
    };
    return () => {
      const _a = _extends(_extends({}, props), attrs),
        {
          prefixCls,
          selectable,
          checkable,
          disabled,
          motion,
          height,
          itemHeight,
          virtual,
          focusable,
          activeItem,
          focused,
          tabindex,
          onKeydown,
          onFocus,
          onBlur,
          onListChangeStart,
          onListChangeEnd
        } = _a,
        domProps = __rest$1(_a, ["prefixCls", "selectable", "checkable", "disabled", "motion", "height", "itemHeight", "virtual", "focusable", "activeItem", "focused", "tabindex", "onKeydown", "onFocus", "onBlur", "onListChangeStart", "onListChangeEnd"]);
      return createVNode(Fragment, null, [focused && activeItem && createVNode("span", {
        "style": HIDDEN_STYLE,
        "aria-live": "assertive"
      }, [getAccessibilityPath(activeItem)]), createVNode("div", null, [createVNode("input", {
        "style": HIDDEN_STYLE,
        "disabled": focusable === false || disabled,
        "tabindex": focusable !== false ? tabindex : null,
        "onKeydown": onKeydown,
        "onFocus": onFocus,
        "onBlur": onBlur,
        "value": "",
        "onChange": noop,
        "aria-label": "for screen reader"
      }, null)]), createVNode("div", {
        "class": `${prefixCls}-treenode`,
        "aria-hidden": true,
        "style": {
          position: 'absolute',
          pointerEvents: 'none',
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden'
        }
      }, [createVNode("div", {
        "class": `${prefixCls}-indent`
      }, [createVNode("div", {
        "ref": indentMeasurerRef,
        "class": `${prefixCls}-indent-unit`
      }, null)])]), createVNode(List, _objectSpread$8(_objectSpread$8({}, omit(domProps, ['onActiveChange'])), {}, {
        "data": mergedData.value,
        "itemKey": itemKey,
        "height": height,
        "fullHeight": false,
        "virtual": virtual,
        "itemHeight": itemHeight,
        "prefixCls": `${prefixCls}-list`,
        "ref": listRef,
        "onVisibleChange": (originList, fullList) => {
          const originSet = new Set(originList);
          const restList = fullList.filter(item => !originSet.has(item));
          // Motion node is not render. Skip motion
          if (restList.some(item => itemKey(item) === MOTION_KEY)) {
            onMotionEnd();
          }
        }
      }), {
        default: treeNode => {
          const {
              pos
            } = treeNode,
            restProps = __rest$1(treeNode.data, []),
            {
              title,
              key,
              isStart,
              isEnd
            } = treeNode;
          const mergedKey = getKey(key, pos);
          delete restProps.key;
          delete restProps.children;
          return createVNode(MotionTreeNode, _objectSpread$8(_objectSpread$8({}, restProps), {}, {
            "eventKey": mergedKey,
            "title": title,
            "active": !!activeItem && key === activeItem.key,
            "data": treeNode.data,
            "isStart": isStart,
            "isEnd": isEnd,
            "motion": motion,
            "motionNodes": key === MOTION_KEY ? transitionRange.value : null,
            "motionType": motionType.value,
            "onMotionStart": onListChangeStart,
            "onMotionEnd": onMotionEnd,
            "onMousemove": onActiveChange
          }), null);
        }
      })]);
    };
  }
});

function DropIndicator(_ref) {
  let {
    dropPosition,
    dropLevelOffset,
    indent
  } = _ref;
  const style = {
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    backgroundColor: 'red',
    height: `${2}px`
  };
  switch (dropPosition) {
    case -1:
      style.top = 0;
      style.left = `${-dropLevelOffset * indent}px`;
      break;
    case 1:
      style.bottom = 0;
      style.left = `${-dropLevelOffset * indent}px`;
      break;
    case 0:
      style.bottom = 0;
      style.left = `${indent}`;
      break;
  }
  return createVNode("div", {
    "style": style
  }, null);
}

const MAX_RETRY_TIMES = 10;
const Tree$2 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'Tree',
  inheritAttrs: false,
  props: initDefaultProps(treeProps$1(), {
    prefixCls: 'vc-tree',
    showLine: false,
    showIcon: true,
    selectable: true,
    multiple: false,
    checkable: false,
    disabled: false,
    checkStrictly: false,
    draggable: false,
    expandAction: false,
    defaultExpandParent: true,
    autoExpandParent: false,
    defaultExpandAll: false,
    defaultExpandedKeys: [],
    defaultCheckedKeys: [],
    defaultSelectedKeys: [],
    dropIndicatorRender: DropIndicator,
    allowDrop: () => true
  }),
  setup(props, _ref) {
    let {
      attrs,
      slots,
      expose
    } = _ref;
    const destroyed = shallowRef(false);
    let delayedDragEnterLogic = {};
    const indent = shallowRef();
    const selectedKeys = shallowRef([]);
    const checkedKeys = shallowRef([]);
    const halfCheckedKeys = shallowRef([]);
    const loadedKeys = shallowRef([]);
    const loadingKeys = shallowRef([]);
    const expandedKeys = shallowRef([]);
    const loadingRetryTimes = {};
    const dragState = reactive({
      draggingNodeKey: null,
      dragChildrenKeys: [],
      // dropTargetKey is the key of abstract-drop-node
      // the abstract-drop-node is the real drop node when drag and drop
      // not the DOM drag over node
      dropTargetKey: null,
      dropPosition: null,
      dropContainerKey: null,
      dropLevelOffset: null,
      dropTargetPos: null,
      dropAllowed: true,
      // the abstract-drag-over-node
      // if mouse is on the bottom of top dom node or no the top of the bottom dom node
      // abstract-drag-over-node is the top node
      dragOverNodeKey: null
    });
    const treeData = shallowRef([]);
    watch([() => props.treeData, () => props.children], () => {
      treeData.value = props.treeData !== undefined ? props.treeData.slice() : convertTreeToData(toRaw(props.children));
    }, {
      immediate: true,
      deep: true
    });
    const keyEntities = shallowRef({});
    const focused = shallowRef(false);
    const activeKey = shallowRef(null);
    const listChanging = shallowRef(false);
    const fieldNames = computed(() => fillFieldNames(props.fieldNames));
    const listRef = shallowRef();
    let dragStartMousePosition = null;
    let dragNode = null;
    let currentMouseOverDroppableNodeKey = null;
    const treeNodeRequiredProps = computed(() => {
      return {
        expandedKeysSet: expandedKeysSet.value,
        selectedKeysSet: selectedKeysSet.value,
        loadedKeysSet: loadedKeysSet.value,
        loadingKeysSet: loadingKeysSet.value,
        checkedKeysSet: checkedKeysSet.value,
        halfCheckedKeysSet: halfCheckedKeysSet.value,
        dragOverNodeKey: dragState.dragOverNodeKey,
        dropPosition: dragState.dropPosition,
        keyEntities: keyEntities.value
      };
    });
    const expandedKeysSet = computed(() => {
      return new Set(expandedKeys.value);
    });
    const selectedKeysSet = computed(() => {
      return new Set(selectedKeys.value);
    });
    const loadedKeysSet = computed(() => {
      return new Set(loadedKeys.value);
    });
    const loadingKeysSet = computed(() => {
      return new Set(loadingKeys.value);
    });
    const checkedKeysSet = computed(() => {
      return new Set(checkedKeys.value);
    });
    const halfCheckedKeysSet = computed(() => {
      return new Set(halfCheckedKeys.value);
    });
    watchEffect(() => {
      if (treeData.value) {
        const entitiesMap = convertDataToEntities(treeData.value, {
          fieldNames: fieldNames.value
        });
        keyEntities.value = _extends({
          [MOTION_KEY]: MotionEntity
        }, entitiesMap.keyEntities);
      }
    });
    let init = false; // 处理 defaultXxxx api, 仅仅首次有效
    watch([() => props.expandedKeys, () => props.autoExpandParent, keyEntities],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_ref2, _ref3) => {
      let [_newKeys, newAutoExpandParent] = _ref2;
      let [_oldKeys, oldAutoExpandParent] = _ref3;
      let keys = expandedKeys.value;
      // ================ expandedKeys =================
      if (props.expandedKeys !== undefined || init && newAutoExpandParent !== oldAutoExpandParent) {
        keys = props.autoExpandParent || !init && props.defaultExpandParent ? conductExpandParent(props.expandedKeys, keyEntities.value) : props.expandedKeys;
      } else if (!init && props.defaultExpandAll) {
        const cloneKeyEntities = _extends({}, keyEntities.value);
        delete cloneKeyEntities[MOTION_KEY];
        keys = Object.keys(cloneKeyEntities).map(key => cloneKeyEntities[key].key);
      } else if (!init && props.defaultExpandedKeys) {
        keys = props.autoExpandParent || props.defaultExpandParent ? conductExpandParent(props.defaultExpandedKeys, keyEntities.value) : props.defaultExpandedKeys;
      }
      if (keys) {
        expandedKeys.value = keys;
      }
      init = true;
    }, {
      immediate: true
    });
    // ================ flattenNodes =================
    const flattenNodes = shallowRef([]);
    watchEffect(() => {
      flattenNodes.value = flattenTreeData(treeData.value, expandedKeys.value, fieldNames.value);
    });
    // ================ selectedKeys =================
    watchEffect(() => {
      if (props.selectable) {
        if (props.selectedKeys !== undefined) {
          selectedKeys.value = calcSelectedKeys(props.selectedKeys, props);
        } else if (!init && props.defaultSelectedKeys) {
          selectedKeys.value = calcSelectedKeys(props.defaultSelectedKeys, props);
        }
      }
    });
    const {
      maxLevel,
      levelEntities
    } = useMaxLevel(keyEntities);
    // ================= checkedKeys =================
    watchEffect(() => {
      if (props.checkable) {
        let checkedKeyEntity;
        if (props.checkedKeys !== undefined) {
          checkedKeyEntity = parseCheckedKeys(props.checkedKeys) || {};
        } else if (!init && props.defaultCheckedKeys) {
          checkedKeyEntity = parseCheckedKeys(props.defaultCheckedKeys) || {};
        } else if (treeData.value) {
          // If `treeData` changed, we also need check it
          checkedKeyEntity = parseCheckedKeys(props.checkedKeys) || {
            checkedKeys: checkedKeys.value,
            halfCheckedKeys: halfCheckedKeys.value
          };
        }
        if (checkedKeyEntity) {
          let {
            checkedKeys: newCheckedKeys = [],
            halfCheckedKeys: newHalfCheckedKeys = []
          } = checkedKeyEntity;
          if (!props.checkStrictly) {
            const conductKeys = conductCheck(newCheckedKeys, true, keyEntities.value, maxLevel.value, levelEntities.value);
            ({
              checkedKeys: newCheckedKeys,
              halfCheckedKeys: newHalfCheckedKeys
            } = conductKeys);
          }
          checkedKeys.value = newCheckedKeys;
          halfCheckedKeys.value = newHalfCheckedKeys;
        }
      }
    });
    // ================= loadedKeys ==================
    watchEffect(() => {
      if (props.loadedKeys) {
        loadedKeys.value = props.loadedKeys;
      }
    });
    const resetDragState = () => {
      _extends(dragState, {
        dragOverNodeKey: null,
        dropPosition: null,
        dropLevelOffset: null,
        dropTargetKey: null,
        dropContainerKey: null,
        dropTargetPos: null,
        dropAllowed: false
      });
    };
    const scrollTo = scroll => {
      listRef.value.scrollTo(scroll);
    };
    watch(() => props.activeKey, () => {
      if (props.activeKey !== undefined) {
        activeKey.value = props.activeKey;
      }
    }, {
      immediate: true
    });
    watch(activeKey, val => {
      nextTick(() => {
        if (val !== null) {
          scrollTo({
            key: val
          });
        }
      });
    }, {
      immediate: true,
      flush: 'post'
    });
    // =========================== Expanded ===========================
    /** Set uncontrolled `expandedKeys`. This will also auto update `flattenNodes`. */
    const setExpandedKeys = keys => {
      if (props.expandedKeys === undefined) {
        expandedKeys.value = keys;
      }
    };
    const cleanDragState = () => {
      if (dragState.draggingNodeKey !== null) {
        _extends(dragState, {
          draggingNodeKey: null,
          dropPosition: null,
          dropContainerKey: null,
          dropTargetKey: null,
          dropLevelOffset: null,
          dropAllowed: true,
          dragOverNodeKey: null
        });
      }
      dragStartMousePosition = null;
      currentMouseOverDroppableNodeKey = null;
    };
    // if onNodeDragEnd is called, onWindowDragEnd won't be called since stopPropagation() is called
    const onNodeDragEnd = (event, node) => {
      const {
        onDragend
      } = props;
      dragState.dragOverNodeKey = null;
      cleanDragState();
      onDragend === null || onDragend === void 0 ? void 0 : onDragend({
        event,
        node: node.eventData
      });
      dragNode = null;
    };
    // since stopPropagation() is called in treeNode
    // if onWindowDrag is called, whice means state is keeped, drag state should be cleared
    const onWindowDragEnd = event => {
      onNodeDragEnd(event, null);
      window.removeEventListener('dragend', onWindowDragEnd);
    };
    const onNodeDragStart = (event, node) => {
      const {
        onDragstart
      } = props;
      const {
        eventKey,
        eventData
      } = node;
      dragNode = node;
      dragStartMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      const newExpandedKeys = arrDel(expandedKeys.value, eventKey);
      dragState.draggingNodeKey = eventKey;
      dragState.dragChildrenKeys = getDragChildrenKeys(eventKey, keyEntities.value);
      indent.value = listRef.value.getIndentWidth();
      setExpandedKeys(newExpandedKeys);
      window.addEventListener('dragend', onWindowDragEnd);
      if (onDragstart) {
        onDragstart({
          event,
          node: eventData
        });
      }
    };
    /**
     * [Legacy] Select handler is smaller than node,
     * so that this will trigger when drag enter node or select handler.
     * This is a little tricky if customize css without padding.
     * Better for use mouse move event to refresh drag state.
     * But let's just keep it to avoid event trigger logic change.
     */
    const onNodeDragEnter = (event, node) => {
      const {
        onDragenter,
        onExpand,
        allowDrop,
        direction
      } = props;
      const {
        pos,
        eventKey
      } = node;
      // record the key of node which is latest entered, used in dragleave event.
      if (currentMouseOverDroppableNodeKey !== eventKey) {
        currentMouseOverDroppableNodeKey = eventKey;
      }
      if (!dragNode) {
        resetDragState();
        return;
      }
      const {
        dropPosition,
        dropLevelOffset,
        dropTargetKey,
        dropContainerKey,
        dropTargetPos,
        dropAllowed,
        dragOverNodeKey
      } = calcDropPosition(event, dragNode, node, indent.value, dragStartMousePosition, allowDrop, flattenNodes.value, keyEntities.value, expandedKeysSet.value, direction);
      if (
      // don't allow drop inside its children
      dragState.dragChildrenKeys.indexOf(dropTargetKey) !== -1 ||
      // don't allow drop when drop is not allowed caculated by calcDropPosition
      !dropAllowed) {
        resetDragState();
        return;
      }
      // Side effect for delay drag
      if (!delayedDragEnterLogic) {
        delayedDragEnterLogic = {};
      }
      Object.keys(delayedDragEnterLogic).forEach(key => {
        clearTimeout(delayedDragEnterLogic[key]);
      });
      if (dragNode.eventKey !== node.eventKey) {
        // hoist expand logic here
        // since if logic is on the bottom
        // it will be blocked by abstract dragover node check
        //   => if you dragenter from top, you mouse will still be consider as in the top node
        delayedDragEnterLogic[pos] = window.setTimeout(() => {
          if (dragState.draggingNodeKey === null) return;
          let newExpandedKeys = expandedKeys.value.slice();
          const entity = keyEntities.value[node.eventKey];
          if (entity && (entity.children || []).length) {
            newExpandedKeys = arrAdd(expandedKeys.value, node.eventKey);
          }
          setExpandedKeys(newExpandedKeys);
          if (onExpand) {
            onExpand(newExpandedKeys, {
              node: node.eventData,
              expanded: true,
              nativeEvent: event
            });
          }
        }, 800);
      }
      // Skip if drag node is self
      if (dragNode.eventKey === dropTargetKey && dropLevelOffset === 0) {
        resetDragState();
        return;
      }
      // Update drag over node and drag state
      _extends(dragState, {
        dragOverNodeKey,
        dropPosition,
        dropLevelOffset,
        dropTargetKey,
        dropContainerKey,
        dropTargetPos,
        dropAllowed
      });
      if (onDragenter) {
        onDragenter({
          event,
          node: node.eventData,
          expandedKeys: expandedKeys.value
        });
      }
    };
    const onNodeDragOver = (event, node) => {
      const {
        onDragover,
        allowDrop,
        direction
      } = props;
      if (!dragNode) {
        return;
      }
      const {
        dropPosition,
        dropLevelOffset,
        dropTargetKey,
        dropContainerKey,
        dropAllowed,
        dropTargetPos,
        dragOverNodeKey
      } = calcDropPosition(event, dragNode, node, indent.value, dragStartMousePosition, allowDrop, flattenNodes.value, keyEntities.value, expandedKeysSet.value, direction);
      if (dragState.dragChildrenKeys.indexOf(dropTargetKey) !== -1 || !dropAllowed) {
        // don't allow drop inside its children
        // don't allow drop when drop is not allowed caculated by calcDropPosition
        return;
      }
      // Update drag position
      if (dragNode.eventKey === dropTargetKey && dropLevelOffset === 0) {
        if (!(dragState.dropPosition === null && dragState.dropLevelOffset === null && dragState.dropTargetKey === null && dragState.dropContainerKey === null && dragState.dropTargetPos === null && dragState.dropAllowed === false && dragState.dragOverNodeKey === null)) {
          resetDragState();
        }
      } else if (!(dropPosition === dragState.dropPosition && dropLevelOffset === dragState.dropLevelOffset && dropTargetKey === dragState.dropTargetKey && dropContainerKey === dragState.dropContainerKey && dropTargetPos === dragState.dropTargetPos && dropAllowed === dragState.dropAllowed && dragOverNodeKey === dragState.dragOverNodeKey)) {
        _extends(dragState, {
          dropPosition,
          dropLevelOffset,
          dropTargetKey,
          dropContainerKey,
          dropTargetPos,
          dropAllowed,
          dragOverNodeKey
        });
      }
      if (onDragover) {
        onDragover({
          event,
          node: node.eventData
        });
      }
    };
    const onNodeDragLeave = (event, node) => {
      // if it is outside the droppable area
      // currentMouseOverDroppableNodeKey will be updated in dragenter event when into another droppable receiver.
      if (currentMouseOverDroppableNodeKey === node.eventKey && !event.currentTarget.contains(event.relatedTarget)) {
        resetDragState();
        currentMouseOverDroppableNodeKey = null;
      }
      const {
        onDragleave
      } = props;
      if (onDragleave) {
        onDragleave({
          event,
          node: node.eventData
        });
      }
    };
    const onNodeDrop = function (event, _node) {
      let outsideTree = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var _a;
      const {
        dragChildrenKeys,
        dropPosition,
        dropTargetKey,
        dropTargetPos,
        dropAllowed
      } = dragState;
      if (!dropAllowed) return;
      const {
        onDrop
      } = props;
      dragState.dragOverNodeKey = null;
      cleanDragState();
      if (dropTargetKey === null) return;
      const abstractDropNodeProps = _extends(_extends({}, getTreeNodeProps(dropTargetKey, toRaw(treeNodeRequiredProps.value))), {
        active: ((_a = activeItem.value) === null || _a === void 0 ? void 0 : _a.key) === dropTargetKey,
        data: keyEntities.value[dropTargetKey].node
      });
      dragChildrenKeys.indexOf(dropTargetKey) !== -1;
      const posArr = posToArr(dropTargetPos);
      const dropResult = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps),
        dragNode: dragNode ? dragNode.eventData : null,
        dragNodesKeys: [dragNode.eventKey].concat(dragChildrenKeys),
        dropToGap: dropPosition !== 0,
        dropPosition: dropPosition + Number(posArr[posArr.length - 1])
      };
      if (!outsideTree) {
        onDrop === null || onDrop === void 0 ? void 0 : onDrop(dropResult);
      }
      dragNode = null;
    };
    const triggerExpandActionExpand = (e, treeNode) => {
      const {
        expanded,
        key
      } = treeNode;
      const node = flattenNodes.value.filter(nodeItem => nodeItem.key === key)[0];
      const eventNode = convertNodePropsToEventData(_extends(_extends({}, getTreeNodeProps(key, treeNodeRequiredProps.value)), {
        data: node.data
      }));
      setExpandedKeys(expanded ? arrDel(expandedKeys.value, key) : arrAdd(expandedKeys.value, key));
      onNodeExpand(e, eventNode);
    };
    const onNodeClick = (e, treeNode) => {
      const {
        onClick,
        expandAction
      } = props;
      if (expandAction === 'click') {
        triggerExpandActionExpand(e, treeNode);
      }
      if (onClick) {
        onClick(e, treeNode);
      }
    };
    const onNodeDoubleClick = (e, treeNode) => {
      const {
        onDblclick,
        expandAction
      } = props;
      if (expandAction === 'doubleclick' || expandAction === 'dblclick') {
        triggerExpandActionExpand(e, treeNode);
      }
      if (onDblclick) {
        onDblclick(e, treeNode);
      }
    };
    const onNodeSelect = (e, treeNode) => {
      let newSelectedKeys = selectedKeys.value;
      const {
        onSelect,
        multiple
      } = props;
      const {
        selected
      } = treeNode;
      const key = treeNode[fieldNames.value.key];
      const targetSelected = !selected;
      // Update selected keys
      if (!targetSelected) {
        newSelectedKeys = arrDel(newSelectedKeys, key);
      } else if (!multiple) {
        newSelectedKeys = [key];
      } else {
        newSelectedKeys = arrAdd(newSelectedKeys, key);
      }
      // [Legacy] Not found related usage in doc or upper libs
      const keyEntitiesValue = keyEntities.value;
      const selectedNodes = newSelectedKeys.map(selectedKey => {
        const entity = keyEntitiesValue[selectedKey];
        if (!entity) return null;
        return entity.node;
      }).filter(node => node);
      if (props.selectedKeys === undefined) {
        selectedKeys.value = newSelectedKeys;
      }
      if (onSelect) {
        onSelect(newSelectedKeys, {
          event: 'select',
          selected: targetSelected,
          node: treeNode,
          selectedNodes,
          nativeEvent: e
        });
      }
    };
    const onNodeCheck = (e, treeNode, checked) => {
      const {
        checkStrictly,
        onCheck
      } = props;
      const key = treeNode[fieldNames.value.key];
      // Prepare trigger arguments
      let checkedObj;
      const eventObj = {
        event: 'check',
        node: treeNode,
        checked,
        nativeEvent: e
      };
      const keyEntitiesValue = keyEntities.value;
      if (checkStrictly) {
        const newCheckedKeys = checked ? arrAdd(checkedKeys.value, key) : arrDel(checkedKeys.value, key);
        const newHalfCheckedKeys = arrDel(halfCheckedKeys.value, key);
        checkedObj = {
          checked: newCheckedKeys,
          halfChecked: newHalfCheckedKeys
        };
        eventObj.checkedNodes = newCheckedKeys.map(checkedKey => keyEntitiesValue[checkedKey]).filter(entity => entity).map(entity => entity.node);
        if (props.checkedKeys === undefined) {
          checkedKeys.value = newCheckedKeys;
        }
      } else {
        // Always fill first
        let {
          checkedKeys: newCheckedKeys,
          halfCheckedKeys: newHalfCheckedKeys
        } = conductCheck([...checkedKeys.value, key], true, keyEntitiesValue, maxLevel.value, levelEntities.value);
        // If remove, we do it again to correction
        if (!checked) {
          const keySet = new Set(newCheckedKeys);
          keySet.delete(key);
          ({
            checkedKeys: newCheckedKeys,
            halfCheckedKeys: newHalfCheckedKeys
          } = conductCheck(Array.from(keySet), {
            halfCheckedKeys: newHalfCheckedKeys
          }, keyEntitiesValue, maxLevel.value, levelEntities.value));
        }
        checkedObj = newCheckedKeys;
        // [Legacy] This is used for vc-tree-select`
        eventObj.checkedNodes = [];
        eventObj.checkedNodesPositions = [];
        eventObj.halfCheckedKeys = newHalfCheckedKeys;
        newCheckedKeys.forEach(checkedKey => {
          const entity = keyEntitiesValue[checkedKey];
          if (!entity) return;
          const {
            node,
            pos
          } = entity;
          eventObj.checkedNodes.push(node);
          eventObj.checkedNodesPositions.push({
            node,
            pos
          });
        });
        if (props.checkedKeys === undefined) {
          checkedKeys.value = newCheckedKeys;
          halfCheckedKeys.value = newHalfCheckedKeys;
        }
      }
      if (onCheck) {
        onCheck(checkedObj, eventObj);
      }
    };
    const onNodeLoad = treeNode => {
      const key = treeNode[fieldNames.value.key];
      const loadPromise = new Promise((resolve, reject) => {
        // We need to get the latest state of loading/loaded keys
        const {
          loadData,
          onLoad
        } = props;
        if (!loadData || loadedKeysSet.value.has(key) || loadingKeysSet.value.has(key)) {
          return null;
        }
        // Process load data
        const promise = loadData(treeNode);
        promise.then(() => {
          const newLoadedKeys = arrAdd(loadedKeys.value, key);
          const newLoadingKeys = arrDel(loadingKeys.value, key);
          // onLoad should trigger before internal setState to avoid `loadData` trigger twice.
          // https://github.com/ant-design/ant-design/issues/12464
          if (onLoad) {
            onLoad(newLoadedKeys, {
              event: 'load',
              node: treeNode
            });
          }
          if (props.loadedKeys === undefined) {
            loadedKeys.value = newLoadedKeys;
          }
          loadingKeys.value = newLoadingKeys;
          resolve();
        }).catch(e => {
          const newLoadingKeys = arrDel(loadingKeys.value, key);
          loadingKeys.value = newLoadingKeys;
          // If exceed max retry times, we give up retry
          loadingRetryTimes[key] = (loadingRetryTimes[key] || 0) + 1;
          if (loadingRetryTimes[key] >= MAX_RETRY_TIMES) {
            const newLoadedKeys = arrAdd(loadedKeys.value, key);
            if (props.loadedKeys === undefined) {
              loadedKeys.value = newLoadedKeys;
            }
            resolve();
          }
          reject(e);
        });
        loadingKeys.value = arrAdd(loadingKeys.value, key);
      });
      // Not care warning if we ignore this
      loadPromise.catch(() => {});
      return loadPromise;
    };
    const onNodeMouseEnter = (event, node) => {
      const {
        onMouseenter
      } = props;
      if (onMouseenter) {
        onMouseenter({
          event,
          node
        });
      }
    };
    const onNodeMouseLeave = (event, node) => {
      const {
        onMouseleave
      } = props;
      if (onMouseleave) {
        onMouseleave({
          event,
          node
        });
      }
    };
    const onNodeContextMenu = (event, node) => {
      const {
        onRightClick
      } = props;
      if (onRightClick) {
        event.preventDefault();
        onRightClick({
          event,
          node
        });
      }
    };
    const onFocus = e => {
      const {
        onFocus
      } = props;
      focused.value = true;
      if (onFocus) {
        onFocus(e);
      }
    };
    const onBlur = e => {
      const {
        onBlur
      } = props;
      focused.value = false;
      onActiveChange(null);
      if (onBlur) {
        onBlur(e);
      }
    };
    const onNodeExpand = (e, treeNode) => {
      let newExpandedKeys = expandedKeys.value;
      const {
        onExpand,
        loadData
      } = props;
      const {
        expanded
      } = treeNode;
      const key = treeNode[fieldNames.value.key];
      // Do nothing when motion is in progress
      if (listChanging.value) {
        return;
      }
      // Update selected keys
      newExpandedKeys.indexOf(key);
      const targetExpanded = !expanded;
      if (targetExpanded) {
        newExpandedKeys = arrAdd(newExpandedKeys, key);
      } else {
        newExpandedKeys = arrDel(newExpandedKeys, key);
      }
      setExpandedKeys(newExpandedKeys);
      if (onExpand) {
        onExpand(newExpandedKeys, {
          node: treeNode,
          expanded: targetExpanded,
          nativeEvent: e
        });
      }
      // Async Load data
      if (targetExpanded && loadData) {
        const loadPromise = onNodeLoad(treeNode);
        if (loadPromise) {
          loadPromise.then(() => {
            // [Legacy] Refresh logic
            // const newFlattenTreeData = flattenTreeData(
            //   treeData.value,
            //   newExpandedKeys,
            //   fieldNames.value,
            // );
            // flattenNodes.value = newFlattenTreeData;
          }).catch(e => {
            const expandedKeysToRestore = arrDel(expandedKeys.value, key);
            setExpandedKeys(expandedKeysToRestore);
            Promise.reject(e);
          });
        }
      }
    };
    const onListChangeStart = () => {
      listChanging.value = true;
    };
    const onListChangeEnd = () => {
      setTimeout(() => {
        listChanging.value = false;
      });
    };
    // =========================== Keyboard ===========================
    const onActiveChange = newActiveKey => {
      const {
        onActiveChange
      } = props;
      if (activeKey.value === newActiveKey) {
        return;
      }
      if (props.activeKey !== undefined) {
        activeKey.value = newActiveKey;
      }
      if (newActiveKey !== null) {
        scrollTo({
          key: newActiveKey
        });
      }
      if (onActiveChange) {
        onActiveChange(newActiveKey);
      }
    };
    const activeItem = computed(() => {
      if (activeKey.value === null) {
        return null;
      }
      return flattenNodes.value.find(_ref4 => {
        let {
          key
        } = _ref4;
        return key === activeKey.value;
      }) || null;
    });
    const offsetActiveKey = offset => {
      let index = flattenNodes.value.findIndex(_ref5 => {
        let {
          key
        } = _ref5;
        return key === activeKey.value;
      });
      // Align with index
      if (index === -1 && offset < 0) {
        index = flattenNodes.value.length;
      }
      index = (index + offset + flattenNodes.value.length) % flattenNodes.value.length;
      const item = flattenNodes.value[index];
      if (item) {
        const {
          key
        } = item;
        onActiveChange(key);
      } else {
        onActiveChange(null);
      }
    };
    const activeItemEventNode = computed(() => {
      return convertNodePropsToEventData(_extends(_extends({}, getTreeNodeProps(activeKey.value, treeNodeRequiredProps.value)), {
        data: activeItem.value.data,
        active: true
      }));
    });
    const onKeydown = event => {
      const {
        onKeydown,
        checkable,
        selectable
      } = props;
      // >>>>>>>>>> Direction
      switch (event.which) {
        case KeyCode.UP:
          {
            offsetActiveKey(-1);
            event.preventDefault();
            break;
          }
        case KeyCode.DOWN:
          {
            offsetActiveKey(1);
            event.preventDefault();
            break;
          }
      }
      // >>>>>>>>>> Expand & Selection
      const item = activeItem.value;
      if (item && item.data) {
        const expandable = item.data.isLeaf === false || !!(item.data.children || []).length;
        const eventNode = activeItemEventNode.value;
        switch (event.which) {
          // >>> Expand
          case KeyCode.LEFT:
            {
              // Collapse if possible
              if (expandable && expandedKeysSet.value.has(activeKey.value)) {
                onNodeExpand({}, eventNode);
              } else if (item.parent) {
                onActiveChange(item.parent.key);
              }
              event.preventDefault();
              break;
            }
          case KeyCode.RIGHT:
            {
              // Expand if possible
              if (expandable && !expandedKeysSet.value.has(activeKey.value)) {
                onNodeExpand({}, eventNode);
              } else if (item.children && item.children.length) {
                onActiveChange(item.children[0].key);
              }
              event.preventDefault();
              break;
            }
          // Selection
          case KeyCode.ENTER:
          case KeyCode.SPACE:
            {
              if (checkable && !eventNode.disabled && eventNode.checkable !== false && !eventNode.disableCheckbox) {
                onNodeCheck({}, eventNode, !checkedKeysSet.value.has(activeKey.value));
              } else if (!checkable && selectable && !eventNode.disabled && eventNode.selectable !== false) {
                onNodeSelect({}, eventNode);
              }
              break;
            }
        }
      }
      if (onKeydown) {
        onKeydown(event);
      }
    };
    expose({
      onNodeExpand,
      scrollTo,
      onKeydown,
      selectedKeys: computed(() => selectedKeys.value),
      checkedKeys: computed(() => checkedKeys.value),
      halfCheckedKeys: computed(() => halfCheckedKeys.value),
      loadedKeys: computed(() => loadedKeys.value),
      loadingKeys: computed(() => loadingKeys.value),
      expandedKeys: computed(() => expandedKeys.value)
    });
    onUnmounted(() => {
      window.removeEventListener('dragend', onWindowDragEnd);
      destroyed.value = true;
    });
    useProvideKeysState({
      expandedKeys,
      selectedKeys,
      loadedKeys,
      loadingKeys,
      checkedKeys,
      halfCheckedKeys,
      expandedKeysSet,
      selectedKeysSet,
      loadedKeysSet,
      loadingKeysSet,
      checkedKeysSet,
      halfCheckedKeysSet,
      flattenNodes
    });
    return () => {
      const {
        // focused,
        // flattenNodes,
        // keyEntities,
        draggingNodeKey,
        // activeKey,
        dropLevelOffset,
        dropContainerKey,
        dropTargetKey,
        dropPosition,
        dragOverNodeKey
        // indent,
      } = dragState;
      const {
        prefixCls,
        showLine,
        focusable,
        tabindex = 0,
        selectable,
        showIcon,
        icon = slots.icon,
        switcherIcon,
        draggable,
        checkable,
        checkStrictly,
        disabled,
        motion,
        loadData,
        filterTreeNode,
        height,
        itemHeight,
        virtual,
        dropIndicatorRender,
        onContextmenu,
        onScroll,
        direction,
        rootClassName,
        rootStyle
      } = props;
      const {
        class: className,
        style
      } = attrs;
      const domProps = pickAttrs(_extends(_extends({}, props), attrs), {
        aria: true,
        data: true
      });
      // It's better move to hooks but we just simply keep here
      let draggableConfig;
      if (draggable) {
        if (typeof draggable === 'object') {
          draggableConfig = draggable;
        } else if (typeof draggable === 'function') {
          draggableConfig = {
            nodeDraggable: draggable
          };
        } else {
          draggableConfig = {};
        }
      } else {
        draggableConfig = false;
      }
      return createVNode(TreeContext, {
        "value": {
          prefixCls,
          selectable,
          showIcon,
          icon,
          switcherIcon,
          draggable: draggableConfig,
          draggingNodeKey,
          checkable,
          customCheckable: slots.checkable,
          checkStrictly,
          disabled,
          keyEntities: keyEntities.value,
          dropLevelOffset,
          dropContainerKey,
          dropTargetKey,
          dropPosition,
          dragOverNodeKey,
          dragging: draggingNodeKey !== null,
          indent: indent.value,
          direction,
          dropIndicatorRender,
          loadData,
          filterTreeNode,
          onNodeClick,
          onNodeDoubleClick,
          onNodeExpand,
          onNodeSelect,
          onNodeCheck,
          onNodeLoad,
          onNodeMouseEnter,
          onNodeMouseLeave,
          onNodeContextMenu,
          onNodeDragStart,
          onNodeDragEnter,
          onNodeDragOver,
          onNodeDragLeave,
          onNodeDragEnd,
          onNodeDrop,
          slots
        }
      }, {
        default: () => [createVNode("div", {
          "role": "tree",
          "class": classNames(prefixCls, className, rootClassName, {
            [`${prefixCls}-show-line`]: showLine,
            [`${prefixCls}-focused`]: focused.value,
            [`${prefixCls}-active-focused`]: activeKey.value !== null
          }),
          "style": rootStyle
        }, [createVNode(NodeList, _objectSpread$8({
          "ref": listRef,
          "prefixCls": prefixCls,
          "style": style,
          "disabled": disabled,
          "selectable": selectable,
          "checkable": !!checkable,
          "motion": motion,
          "height": height,
          "itemHeight": itemHeight,
          "virtual": virtual,
          "focusable": focusable,
          "focused": focused.value,
          "tabindex": tabindex,
          "activeItem": activeItem.value,
          "onFocus": onFocus,
          "onBlur": onBlur,
          "onKeydown": onKeydown,
          "onActiveChange": onActiveChange,
          "onListChangeStart": onListChangeStart,
          "onListChangeEnd": onListChangeEnd,
          "onContextmenu": onContextmenu,
          "onScroll": onScroll
        }, domProps), null)])]
      });
    };
  }
});

// This icon file is generated automatically.
var FileOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z" } }] }, "name": "file", "theme": "outlined" };

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$5(target, key, source[key]); }); } return target; }

function _defineProperty$5(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var FileOutlined = function FileOutlined(props, context) {
  var p = _objectSpread$5({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$5({}, p, {
    "icon": FileOutlined$1
  }), null);
};

FileOutlined.displayName = 'FileOutlined';
FileOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var MinusSquareOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M328 544h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" } }, { "tag": "path", "attrs": { "d": "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" } }] }, "name": "minus-square", "theme": "outlined" };

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$4(target, key, source[key]); }); } return target; }

function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var MinusSquareOutlined = function MinusSquareOutlined(props, context) {
  var p = _objectSpread$4({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$4({}, p, {
    "icon": MinusSquareOutlined$1
  }), null);
};

MinusSquareOutlined.displayName = 'MinusSquareOutlined';
MinusSquareOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var PlusSquareOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M328 544h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" } }, { "tag": "path", "attrs": { "d": "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" } }] }, "name": "plus-square", "theme": "outlined" };

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }

function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var PlusSquareOutlined = function PlusSquareOutlined(props, context) {
  var p = _objectSpread$3({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$3({}, p, {
    "icon": PlusSquareOutlined$1
  }), null);
};

PlusSquareOutlined.displayName = 'PlusSquareOutlined';
PlusSquareOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var CaretDownFilled$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" } }] }, "name": "caret-down", "theme": "filled" };

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CaretDownFilled = function CaretDownFilled(props, context) {
  var p = _objectSpread$2({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$2({}, p, {
    "icon": CaretDownFilled$1
  }), null);
};

CaretDownFilled.displayName = 'CaretDownFilled';
CaretDownFilled.inheritAttrs = false;

function renderSwitcherIcon(prefixCls, switcherIcon, props, leafIcon, showLine) {
  const {
    isLeaf,
    expanded,
    loading
  } = props;
  let icon = switcherIcon;
  if (loading) {
    return createVNode(LoadingOutlined, {
      "class": `${prefixCls}-switcher-loading-icon`
    }, null);
  }
  let showLeafIcon;
  if (showLine && typeof showLine === 'object') {
    showLeafIcon = showLine.showLeafIcon;
  }
  let defaultIcon = null;
  const switcherCls = `${prefixCls}-switcher-icon`;
  if (isLeaf) {
    if (!showLine) {
      return null;
    }
    if (showLeafIcon && leafIcon) {
      return leafIcon(props);
    }
    if (typeof showLine === 'object' && !showLeafIcon) {
      defaultIcon = createVNode("span", {
        "class": `${prefixCls}-switcher-leaf-line`
      }, null);
    } else {
      defaultIcon = createVNode(FileOutlined, {
        "class": `${prefixCls}-switcher-line-icon`
      }, null);
    }
    return defaultIcon;
  } else {
    defaultIcon = createVNode(CaretDownFilled, {
      "class": switcherCls
    }, null);
    if (showLine) {
      defaultIcon = expanded ? createVNode(MinusSquareOutlined, {
        "class": `${prefixCls}-switcher-line-icon`
      }, null) : createVNode(PlusSquareOutlined, {
        "class": `${prefixCls}-switcher-line-icon`
      }, null);
    }
  }
  if (typeof switcherIcon === 'function') {
    icon = switcherIcon(_extends(_extends({}, props), {
      defaultIcon,
      switcherCls
    }));
  } else if (isValidElement(icon)) {
    icon = cloneVNode(icon, {
      class: switcherCls
    });
  }
  return icon || defaultIcon;
}

const offset = 4;
function dropIndicatorRender(props) {
  const {
    dropPosition,
    dropLevelOffset,
    prefixCls,
    indent,
    direction = 'ltr'
  } = props;
  const startPosition = direction === 'ltr' ? 'left' : 'right';
  const endPosition = direction === 'ltr' ? 'right' : 'left';
  const style = {
    [startPosition]: `${-dropLevelOffset * indent + offset}px`,
    [endPosition]: 0
  };
  switch (dropPosition) {
    case -1:
      style.top = `${ -3}px`;
      break;
    case 1:
      style.bottom = `${ -3}px`;
      break;
    default:
      // dropPosition === 0
      style.bottom = `${ -3}px`;
      style[startPosition] = `${indent + offset}px`;
      break;
  }
  return createVNode("div", {
    "style": style,
    "class": `${prefixCls}-drop-indicator`
  }, null);
}

// ============================ Keyframes =============================
const treeNodeFX = new Keyframe('ant-tree-node-fx-do-not-use', {
  '0%': {
    opacity: 0
  },
  '100%': {
    opacity: 1
  }
});
// ============================== Switch ==============================
const getSwitchStyle = (prefixCls, token) => ({
  [`.${prefixCls}-switcher-icon`]: {
    display: 'inline-block',
    fontSize: 10,
    verticalAlign: 'baseline',
    svg: {
      transition: `transform ${token.motionDurationSlow}`
    }
  }
});
// =============================== Drop ===============================
const getDropIndicatorStyle = (prefixCls, token) => ({
  [`.${prefixCls}-drop-indicator`]: {
    position: 'absolute',
    // it should displayed over the following node
    zIndex: 1,
    height: 2,
    backgroundColor: token.colorPrimary,
    borderRadius: 1,
    pointerEvents: 'none',
    '&:after': {
      position: 'absolute',
      top: -3,
      insetInlineStart: -6,
      width: 8,
      height: 8,
      backgroundColor: 'transparent',
      border: `${token.lineWidthBold}px solid ${token.colorPrimary}`,
      borderRadius: '50%',
      content: '""'
    }
  }
});
const genBaseStyle = (prefixCls, token) => {
  const {
    treeCls,
    treeNodeCls,
    treeNodePadding,
    treeTitleHeight
  } = token;
  const treeCheckBoxMarginVertical = (treeTitleHeight - token.fontSizeLG) / 2;
  const treeCheckBoxMarginHorizontal = token.paddingXS;
  return {
    [treeCls]: _extends(_extends({}, resetComponent(token)), {
      background: token.colorBgContainer,
      borderRadius: token.borderRadius,
      transition: `background-color ${token.motionDurationSlow}`,
      [`&${treeCls}-rtl`]: {
        // >>> Switcher
        [`${treeCls}-switcher`]: {
          '&_close': {
            [`${treeCls}-switcher-icon`]: {
              svg: {
                transform: 'rotate(90deg)'
              }
            }
          }
        }
      },
      [`&-focused:not(:hover):not(${treeCls}-active-focused)`]: _extends({}, genFocusOutline(token)),
      // =================== Virtual List ===================
      [`${treeCls}-list-holder-inner`]: {
        alignItems: 'flex-start'
      },
      [`&${treeCls}-block-node`]: {
        [`${treeCls}-list-holder-inner`]: {
          alignItems: 'stretch',
          // >>> Title
          [`${treeCls}-node-content-wrapper`]: {
            flex: 'auto'
          },
          // >>> Drag
          [`${treeNodeCls}.dragging`]: {
            position: 'relative',
            '&:after': {
              position: 'absolute',
              top: 0,
              insetInlineEnd: 0,
              bottom: treeNodePadding,
              insetInlineStart: 0,
              border: `1px solid ${token.colorPrimary}`,
              opacity: 0,
              animationName: treeNodeFX,
              animationDuration: token.motionDurationSlow,
              animationPlayState: 'running',
              animationFillMode: 'forwards',
              content: '""',
              pointerEvents: 'none'
            }
          }
        }
      },
      // ===================== TreeNode =====================
      [`${treeNodeCls}`]: {
        display: 'flex',
        alignItems: 'flex-start',
        padding: `0 0 ${treeNodePadding}px 0`,
        outline: 'none',
        '&-rtl': {
          direction: 'rtl'
        },
        // Disabled
        '&-disabled': {
          // >>> Title
          [`${treeCls}-node-content-wrapper`]: {
            color: token.colorTextDisabled,
            cursor: 'not-allowed',
            '&:hover': {
              background: 'transparent'
            }
          }
        },
        [`&-active ${treeCls}-node-content-wrapper`]: _extends({}, genFocusOutline(token)),
        [`&:not(${treeNodeCls}-disabled).filter-node ${treeCls}-title`]: {
          color: 'inherit',
          fontWeight: 500
        },
        '&-draggable': {
          [`${treeCls}-draggable-icon`]: {
            width: treeTitleHeight,
            lineHeight: `${treeTitleHeight}px`,
            textAlign: 'center',
            visibility: 'visible',
            opacity: 0.2,
            transition: `opacity ${token.motionDurationSlow}`,
            [`${treeNodeCls}:hover &`]: {
              opacity: 0.45
            }
          },
          [`&${treeNodeCls}-disabled`]: {
            [`${treeCls}-draggable-icon`]: {
              visibility: 'hidden'
            }
          }
        }
      },
      // >>> Indent
      [`${treeCls}-indent`]: {
        alignSelf: 'stretch',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        '&-unit': {
          display: 'inline-block',
          width: treeTitleHeight
        }
      },
      // >>> Drag Handler
      [`${treeCls}-draggable-icon`]: {
        visibility: 'hidden'
      },
      // >>> Switcher
      [`${treeCls}-switcher`]: _extends(_extends({}, getSwitchStyle(prefixCls, token)), {
        position: 'relative',
        flex: 'none',
        alignSelf: 'stretch',
        width: treeTitleHeight,
        margin: 0,
        lineHeight: `${treeTitleHeight}px`,
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        '&-noop': {
          cursor: 'default'
        },
        '&_close': {
          [`${treeCls}-switcher-icon`]: {
            svg: {
              transform: 'rotate(-90deg)'
            }
          }
        },
        '&-loading-icon': {
          color: token.colorPrimary
        },
        '&-leaf-line': {
          position: 'relative',
          zIndex: 1,
          display: 'inline-block',
          width: '100%',
          height: '100%',
          // https://github.com/ant-design/ant-design/issues/31884
          '&:before': {
            position: 'absolute',
            top: 0,
            insetInlineEnd: treeTitleHeight / 2,
            bottom: -treeNodePadding,
            marginInlineStart: -1,
            borderInlineEnd: `1px solid ${token.colorBorder}`,
            content: '""'
          },
          '&:after': {
            position: 'absolute',
            width: treeTitleHeight / 2 * 0.8,
            height: treeTitleHeight / 2,
            borderBottom: `1px solid ${token.colorBorder}`,
            content: '""'
          }
        }
      }),
      // >>> Checkbox
      [`${treeCls}-checkbox`]: {
        top: 'initial',
        marginInlineEnd: treeCheckBoxMarginHorizontal,
        marginBlockStart: treeCheckBoxMarginVertical
      },
      // >>> Title
      // add `${treeCls}-checkbox + span` to cover checkbox `${checkboxCls} + span`
      [`${treeCls}-node-content-wrapper, ${treeCls}-checkbox + span`]: {
        position: 'relative',
        zIndex: 'auto',
        minHeight: treeTitleHeight,
        margin: 0,
        padding: `0 ${token.paddingXS / 2}px`,
        color: 'inherit',
        lineHeight: `${treeTitleHeight}px`,
        background: 'transparent',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        transition: `all ${token.motionDurationMid}, border 0s, line-height 0s, box-shadow 0s`,
        '&:hover': {
          backgroundColor: token.controlItemBgHover
        },
        [`&${treeCls}-node-selected`]: {
          backgroundColor: token.controlItemBgActive
        },
        // Icon
        [`${treeCls}-iconEle`]: {
          display: 'inline-block',
          width: treeTitleHeight,
          height: treeTitleHeight,
          lineHeight: `${treeTitleHeight}px`,
          textAlign: 'center',
          verticalAlign: 'top',
          '&:empty': {
            display: 'none'
          }
        }
      },
      // https://github.com/ant-design/ant-design/issues/28217
      [`${treeCls}-unselectable ${treeCls}-node-content-wrapper:hover`]: {
        backgroundColor: 'transparent'
      },
      // ==================== Draggable =====================
      [`${treeCls}-node-content-wrapper`]: _extends({
        lineHeight: `${treeTitleHeight}px`,
        userSelect: 'none'
      }, getDropIndicatorStyle(prefixCls, token)),
      [`${treeNodeCls}.drop-container`]: {
        '> [draggable]': {
          boxShadow: `0 0 0 2px ${token.colorPrimary}`
        }
      },
      // ==================== Show Line =====================
      '&-show-line': {
        // ================ Indent lines ================
        [`${treeCls}-indent`]: {
          '&-unit': {
            position: 'relative',
            height: '100%',
            '&:before': {
              position: 'absolute',
              top: 0,
              insetInlineEnd: treeTitleHeight / 2,
              bottom: -treeNodePadding,
              borderInlineEnd: `1px solid ${token.colorBorder}`,
              content: '""'
            },
            '&-end': {
              '&:before': {
                display: 'none'
              }
            }
          }
        },
        // ============== Cover Background ==============
        [`${treeCls}-switcher`]: {
          background: 'transparent',
          '&-line-icon': {
            // https://github.com/ant-design/ant-design/issues/32813
            verticalAlign: '-0.15em'
          }
        }
      },
      [`${treeNodeCls}-leaf-last`]: {
        [`${treeCls}-switcher`]: {
          '&-leaf-line': {
            '&:before': {
              top: 'auto !important',
              bottom: 'auto !important',
              height: `${treeTitleHeight / 2}px !important`
            }
          }
        }
      }
    })
  };
};
// ============================ Directory =============================
const genDirectoryStyle = token => {
  const {
    treeCls,
    treeNodeCls,
    treeNodePadding
  } = token;
  return {
    [`${treeCls}${treeCls}-directory`]: {
      // ================== TreeNode ==================
      [treeNodeCls]: {
        position: 'relative',
        // Hover color
        '&:before': {
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          bottom: treeNodePadding,
          insetInlineStart: 0,
          transition: `background-color ${token.motionDurationMid}`,
          content: '""',
          pointerEvents: 'none'
        },
        '&:hover': {
          '&:before': {
            background: token.controlItemBgHover
          }
        },
        // Elements
        '> *': {
          zIndex: 1
        },
        // >>> Switcher
        [`${treeCls}-switcher`]: {
          transition: `color ${token.motionDurationMid}`
        },
        // >>> Title
        [`${treeCls}-node-content-wrapper`]: {
          borderRadius: 0,
          userSelect: 'none',
          '&:hover': {
            background: 'transparent'
          },
          [`&${treeCls}-node-selected`]: {
            color: token.colorTextLightSolid,
            background: 'transparent'
          }
        },
        // ============= Selected =============
        '&-selected': {
          [`
            &:hover::before,
            &::before
          `]: {
            background: token.colorPrimary
          },
          // >>> Switcher
          [`${treeCls}-switcher`]: {
            color: token.colorTextLightSolid
          },
          // >>> Title
          [`${treeCls}-node-content-wrapper`]: {
            color: token.colorTextLightSolid,
            background: 'transparent'
          }
        }
      }
    }
  };
};
// ============================== Merged ==============================
const genTreeStyle = (prefixCls, token) => {
  const treeCls = `.${prefixCls}`;
  const treeNodeCls = `${treeCls}-treenode`;
  const treeNodePadding = token.paddingXS / 2;
  const treeTitleHeight = token.controlHeightSM;
  const treeToken = merge(token, {
    treeCls,
    treeNodeCls,
    treeNodePadding,
    treeTitleHeight
  });
  return [
  // Basic
  genBaseStyle(prefixCls, treeToken),
  // Directory
  genDirectoryStyle(treeToken)];
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Tree', (token, _ref) => {
  let {
    prefixCls
  } = _ref;
  return [{
    [token.componentCls]: getStyle(`${prefixCls}-checkbox`, token)
  }, genTreeStyle(prefixCls, token), genCollapseMotion(token)];
});

const treeProps = () => {
  const baseTreeProps = treeProps$1();
  return _extends(_extends({}, baseTreeProps), {
    showLine: someType([Boolean, Object]),
    /** 是否支持多选 */
    multiple: booleanType(),
    /** 是否自动展开父节点 */
    autoExpandParent: booleanType(),
    /** checkable状态下节点选择完全受控（父子节点选中状态不再关联）*/
    checkStrictly: booleanType(),
    /** 是否支持选中 */
    checkable: booleanType(),
    /** 是否禁用树 */
    disabled: booleanType(),
    /** 默认展开所有树节点 */
    defaultExpandAll: booleanType(),
    /** 默认展开对应树节点 */
    defaultExpandParent: booleanType(),
    /** 默认展开指定的树节点 */
    defaultExpandedKeys: arrayType(),
    /** （受控）展开指定的树节点 */
    expandedKeys: arrayType(),
    /** （受控）选中复选框的树节点 */
    checkedKeys: someType([Array, Object]),
    /** 默认选中复选框的树节点 */
    defaultCheckedKeys: arrayType(),
    /** （受控）设置选中的树节点 */
    selectedKeys: arrayType(),
    /** 默认选中的树节点 */
    defaultSelectedKeys: arrayType(),
    selectable: booleanType(),
    loadedKeys: arrayType(),
    draggable: booleanType(),
    showIcon: booleanType(),
    icon: functionType(),
    switcherIcon: PropTypes.any,
    prefixCls: String,
    /**
     * @default{title,key,children}
     * deprecated, please use `fieldNames` instead
     * 替换treeNode中 title,key,children字段为treeData中对应的字段
     */
    replaceFields: objectType(),
    blockNode: booleanType(),
    openAnimation: PropTypes.any,
    onDoubleclick: baseTreeProps.onDblclick,
    'onUpdate:selectedKeys': functionType(),
    'onUpdate:checkedKeys': functionType(),
    'onUpdate:expandedKeys': functionType()
  });
};
const Tree$1 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATree',
  inheritAttrs: false,
  props: initDefaultProps(treeProps(), {
    checkable: false,
    selectable: true,
    showIcon: false,
    blockNode: false
  }),
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      expose,
      emit,
      slots
    } = _ref;
    warning(!(props.treeData === undefined && slots.default));
    const {
      prefixCls,
      direction,
      virtual
    } = useConfigInject('tree', props);
    // style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const treeRef = ref();
    const scrollTo = scroll => {
      var _a;
      (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo(scroll);
    };
    expose({
      treeRef,
      onNodeExpand: function () {
        var _a;
        (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.onNodeExpand(...arguments);
      },
      scrollTo,
      selectedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.selectedKeys;
      }),
      checkedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.checkedKeys;
      }),
      halfCheckedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.halfCheckedKeys;
      }),
      loadedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.loadedKeys;
      }),
      loadingKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.loadingKeys;
      }),
      expandedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.expandedKeys;
      })
    });
    watchEffect(() => {
      devWarning(props.replaceFields === undefined, 'Tree', '`replaceFields` is deprecated, please use fieldNames instead');
    });
    const handleCheck = (checkedObjOrKeys, eventObj) => {
      emit('update:checkedKeys', checkedObjOrKeys);
      emit('check', checkedObjOrKeys, eventObj);
    };
    const handleExpand = (expandedKeys, eventObj) => {
      emit('update:expandedKeys', expandedKeys);
      emit('expand', expandedKeys, eventObj);
    };
    const handleSelect = (selectedKeys, eventObj) => {
      emit('update:selectedKeys', selectedKeys);
      emit('select', selectedKeys, eventObj);
    };
    return () => {
      const {
        showIcon,
        showLine,
        switcherIcon = slots.switcherIcon,
        icon = slots.icon,
        blockNode,
        checkable,
        selectable,
        fieldNames = props.replaceFields,
        motion = props.openAnimation,
        itemHeight = 28,
        onDoubleclick,
        onDblclick
      } = props;
      const newProps = _extends(_extends(_extends({}, attrs), omit(props, ['onUpdate:checkedKeys', 'onUpdate:expandedKeys', 'onUpdate:selectedKeys', 'onDoubleclick'])), {
        showLine: Boolean(showLine),
        dropIndicatorRender,
        fieldNames,
        icon,
        itemHeight
      });
      const children = slots.default ? filterEmpty(slots.default()) : undefined;
      return wrapSSR(createVNode(Tree$2, _objectSpread$8(_objectSpread$8({}, newProps), {}, {
        "virtual": virtual.value,
        "motion": motion,
        "ref": treeRef,
        "prefixCls": prefixCls.value,
        "class": classNames({
          [`${prefixCls.value}-icon-hide`]: !showIcon,
          [`${prefixCls.value}-block-node`]: blockNode,
          [`${prefixCls.value}-unselectable`]: !selectable,
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl'
        }, attrs.class, hashId.value),
        "direction": direction.value,
        "checkable": checkable,
        "selectable": selectable,
        "switcherIcon": nodeProps => renderSwitcherIcon(prefixCls.value, switcherIcon, nodeProps, slots.leafIcon, showLine),
        "onCheck": handleCheck,
        "onExpand": handleExpand,
        "onSelect": handleSelect,
        "onDblclick": onDblclick || onDoubleclick,
        "children": children
      }), _extends(_extends({}, slots), {
        checkable: () => createVNode("span", {
          "class": `${prefixCls.value}-checkbox-inner`
        }, null)
      })));
    };
  }
});

// This icon file is generated automatically.
var FolderOpenOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 00-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z" } }] }, "name": "folder-open", "theme": "outlined" };

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var FolderOpenOutlined = function FolderOpenOutlined(props, context) {
  var p = _objectSpread$1({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$1({}, p, {
    "icon": FolderOpenOutlined$1
  }), null);
};

FolderOpenOutlined.displayName = 'FolderOpenOutlined';
FolderOpenOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var FolderOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M880 298.4H521L403.7 186.2a8.15 8.15 0 00-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z" } }] }, "name": "folder", "theme": "outlined" };

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var FolderOutlined = function FolderOutlined(props, context) {
  var p = _objectSpread({}, props, context.attrs);

  return createVNode(Icon, _objectSpread({}, p, {
    "icon": FolderOutlined$1
  }), null);
};

FolderOutlined.displayName = 'FolderOutlined';
FolderOutlined.inheritAttrs = false;

var Record;
(function (Record) {
  Record[Record["None"] = 0] = "None";
  Record[Record["Start"] = 1] = "Start";
  Record[Record["End"] = 2] = "End";
})(Record || (Record = {}));
function traverseNodesKey(treeData, fieldNames, callback) {
  function processNode(dataNode) {
    const key = dataNode[fieldNames.key];
    const children = dataNode[fieldNames.children];
    if (callback(key, dataNode) !== false) {
      traverseNodesKey(children || [], fieldNames, callback);
    }
  }
  treeData.forEach(processNode);
}
/** 计算选中范围，只考虑expanded情况以优化性能 */
function calcRangeKeys(_ref) {
  let {
    treeData,
    expandedKeys,
    startKey,
    endKey,
    fieldNames = {
      title: 'title',
      key: 'key',
      children: 'children'
    }
  } = _ref;
  const keys = [];
  let record = Record.None;
  if (startKey && startKey === endKey) {
    return [startKey];
  }
  if (!startKey || !endKey) {
    return [];
  }
  function matchKey(key) {
    return key === startKey || key === endKey;
  }
  traverseNodesKey(treeData, fieldNames, key => {
    if (record === Record.End) {
      return false;
    }
    if (matchKey(key)) {
      // Match test
      keys.push(key);
      if (record === Record.None) {
        record = Record.Start;
      } else if (record === Record.Start) {
        record = Record.End;
        return false;
      }
    } else if (record === Record.Start) {
      // Append selection
      keys.push(key);
    }
    return expandedKeys.includes(key);
  });
  return keys;
}
function convertDirectoryKeysToNodes(treeData, keys, fieldNames) {
  const restKeys = [...keys];
  const nodes = [];
  traverseNodesKey(treeData, fieldNames, (key, node) => {
    const index = restKeys.indexOf(key);
    if (index !== -1) {
      nodes.push(node);
      restKeys.splice(index, 1);
    }
    return !!restKeys.length;
  });
  return nodes;
}

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const directoryTreeProps = () => _extends(_extends({}, treeProps()), {
  expandAction: someType([Boolean, String])
});
function getIcon(props) {
  const {
    isLeaf,
    expanded
  } = props;
  if (isLeaf) {
    return createVNode(FileOutlined, null, null);
  }
  return expanded ? createVNode(FolderOpenOutlined, null, null) : createVNode(FolderOutlined, null, null);
}
const DirectoryTree = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ADirectoryTree',
  inheritAttrs: false,
  props: initDefaultProps(directoryTreeProps(), {
    showIcon: true,
    expandAction: 'click'
  }),
  slots: Object,
  // emits: [
  //   'update:selectedKeys',
  //   'update:checkedKeys',
  //   'update:expandedKeys',
  //   'expand',
  //   'select',
  //   'check',
  //   'doubleclick',
  //   'dblclick',
  //   'click',
  // ],
  setup(props, _ref) {
    let {
      attrs,
      slots,
      emit,
      expose
    } = _ref;
    var _a;
    // convertTreeToData 兼容 a-tree-node 历史写法，未来a-tree-node移除后，删除相关代码，不要再render中调用 treeData，否则死循环
    const treeData = ref(props.treeData || convertTreeToData(filterEmpty((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots))));
    watch(() => props.treeData, () => {
      treeData.value = props.treeData;
    });
    onUpdated(() => {
      nextTick(() => {
        var _a;
        if (props.treeData === undefined && slots.default) {
          treeData.value = convertTreeToData(filterEmpty((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)));
        }
      });
    });
    // Shift click usage
    const lastSelectedKey = ref();
    const cachedSelectedKeys = ref();
    const fieldNames = computed(() => fillFieldNames(props.fieldNames));
    const treeRef = ref();
    const scrollTo = scroll => {
      var _a;
      (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo(scroll);
    };
    expose({
      scrollTo,
      selectedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.selectedKeys;
      }),
      checkedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.checkedKeys;
      }),
      halfCheckedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.halfCheckedKeys;
      }),
      loadedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.loadedKeys;
      }),
      loadingKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.loadingKeys;
      }),
      expandedKeys: computed(() => {
        var _a;
        return (_a = treeRef.value) === null || _a === void 0 ? void 0 : _a.expandedKeys;
      })
    });
    const getInitExpandedKeys = () => {
      const {
        keyEntities
      } = convertDataToEntities(treeData.value, {
        fieldNames: fieldNames.value
      });
      let initExpandedKeys;
      // Expanded keys
      if (props.defaultExpandAll) {
        initExpandedKeys = Object.keys(keyEntities);
      } else if (props.defaultExpandParent) {
        initExpandedKeys = conductExpandParent(props.expandedKeys || props.defaultExpandedKeys || [], keyEntities);
      } else {
        initExpandedKeys = props.expandedKeys || props.defaultExpandedKeys;
      }
      return initExpandedKeys;
    };
    const selectedKeys = ref(props.selectedKeys || props.defaultSelectedKeys || []);
    const expandedKeys = ref(getInitExpandedKeys());
    watch(() => props.selectedKeys, () => {
      if (props.selectedKeys !== undefined) {
        selectedKeys.value = props.selectedKeys;
      }
    }, {
      immediate: true
    });
    watch(() => props.expandedKeys, () => {
      if (props.expandedKeys !== undefined) {
        expandedKeys.value = props.expandedKeys;
      }
    }, {
      immediate: true
    });
    const expandFolderNode = (event, node) => {
      const {
        isLeaf
      } = node;
      if (isLeaf || event.shiftKey || event.metaKey || event.ctrlKey) {
        return;
      }
      // Call internal rc-tree expand function
      // https://github.com/ant-design/ant-design/issues/12567
      treeRef.value.onNodeExpand(event, node);
    };
    const onDebounceExpand = debounce$1(expandFolderNode, 200, {
      leading: true
    });
    const onExpand = (keys, info) => {
      if (props.expandedKeys === undefined) {
        expandedKeys.value = keys;
      }
      // Call origin function
      emit('update:expandedKeys', keys);
      emit('expand', keys, info);
    };
    const onClick = (event, node) => {
      const {
        expandAction
      } = props;
      // Expand the tree
      if (expandAction === 'click') {
        onDebounceExpand(event, node);
      }
      emit('click', event, node);
    };
    const onDoubleClick = (event, node) => {
      const {
        expandAction
      } = props;
      // Expand the tree
      if (expandAction === 'dblclick' || expandAction === 'doubleclick') {
        onDebounceExpand(event, node);
      }
      emit('doubleclick', event, node);
      emit('dblclick', event, node);
    };
    const onSelect = (keys, event) => {
      const {
        multiple
      } = props;
      const {
        node,
        nativeEvent
      } = event;
      const key = node[fieldNames.value.key];
      // const newState: DirectoryTreeState = {};
      // We need wrap this event since some value is not same
      const newEvent = _extends(_extends({}, event), {
        selected: true
      });
      // Windows / Mac single pick
      const ctrlPick = (nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.ctrlKey) || (nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.metaKey);
      const shiftPick = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.shiftKey;
      // Generate new selected keys
      let newSelectedKeys;
      if (multiple && ctrlPick) {
        // Control click
        newSelectedKeys = keys;
        lastSelectedKey.value = key;
        cachedSelectedKeys.value = newSelectedKeys;
        newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData.value, newSelectedKeys, fieldNames.value);
      } else if (multiple && shiftPick) {
        // Shift click
        newSelectedKeys = Array.from(new Set([...(cachedSelectedKeys.value || []), ...calcRangeKeys({
          treeData: treeData.value,
          expandedKeys: expandedKeys.value,
          startKey: key,
          endKey: lastSelectedKey.value,
          fieldNames: fieldNames.value
        })]));
        newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData.value, newSelectedKeys, fieldNames.value);
      } else {
        // Single click
        newSelectedKeys = [key];
        lastSelectedKey.value = key;
        cachedSelectedKeys.value = newSelectedKeys;
        newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData.value, newSelectedKeys, fieldNames.value);
      }
      emit('update:selectedKeys', newSelectedKeys);
      emit('select', newSelectedKeys, newEvent);
      if (props.selectedKeys === undefined) {
        selectedKeys.value = newSelectedKeys;
      }
    };
    const onCheck = (checkedObjOrKeys, eventObj) => {
      emit('update:checkedKeys', checkedObjOrKeys);
      emit('check', checkedObjOrKeys, eventObj);
    };
    const {
      prefixCls,
      direction
    } = useConfigInject('tree', props);
    return () => {
      const connectClassName = classNames(`${prefixCls.value}-directory`, {
        [`${prefixCls.value}-directory-rtl`]: direction.value === 'rtl'
      }, attrs.class);
      const {
          icon = slots.icon,
          blockNode = true
        } = props,
        otherProps = __rest(props, ["icon", "blockNode"]);
      return createVNode(Tree$1, _objectSpread$8(_objectSpread$8(_objectSpread$8({}, attrs), {}, {
        "icon": icon || getIcon,
        "ref": treeRef,
        "blockNode": blockNode
      }, otherProps), {}, {
        "prefixCls": prefixCls.value,
        "class": connectClassName,
        "expandedKeys": expandedKeys.value,
        "selectedKeys": selectedKeys.value,
        "onSelect": onSelect,
        "onClick": onClick,
        "onDblclick": onDoubleClick,
        "onExpand": onExpand,
        "onCheck": onCheck
      }), slots);
    };
  }
});

/* istanbul ignore next */
const TreeNode = VcTreeNode;
const Tree = _extends(Tree$1, {
  DirectoryTree,
  TreeNode,
  install: app => {
    app.component(Tree$1.name, Tree$1);
    app.component(TreeNode.name, TreeNode);
    app.component(DirectoryTree.name, DirectoryTree);
    return app;
  }
});

export { Card as C, DownOutlined as D, List as L, Spin as S, Tree as T, Tabs as a, TabPane$1 as b, Skeleton as c, createRef as d, useStyle$2 as e, convertDataToEntities as f, useMaxLevel as g, conductCheck as h, isMobile as i, arrDel as j, arrAdd as k, pickAttrs as p, useMergedState as u };
//# sourceMappingURL=index.mjs.map
