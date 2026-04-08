import _extends from '@babel/runtime/helpers/esm/extends';
import _objectSpread$5 from '@babel/runtime/helpers/esm/objectSpread2';
import { defineComponent, computed, ref, createVNode, isVNode, cloneVNode, inject, shallowRef, watchEffect, onMounted, watch, createTextVNode, Fragment, onBeforeUnmount, provide, isRef, reactive, toRefs, toRaw, nextTick, toRef, Text, onUnmounted, getCurrentInstance, onActivated, onUpdated } from 'vue';
import { A as wrapperRaf, P as PropTypes, a1 as Trigger, c as classNames, b as cloneElement, i as isValidElement, e as initDefaultProps, o as omit, l as flattenChildren, a3 as useState, C as CloseCircleFilled, L as LoadingOutlined, a as CloseOutlined, r as resetComponent, Z as textEllipsis, m as merge, G as resetIcon, g as genComponentStyleHook, F as genCompactItemStyle, u as useConfigInject, H as useCompactItemContext, J as useInjectDisabled, O as getTransitionName, aj as getTransitionDirection, ak as DefaultRenderEmpty, j as functionType, D as stringType, f as booleanType, s as someType, a9 as Keyframe, al as genFocusOutline, y as arrayType, K as warning, I as Icon, am as BaseMixin, an as splitAttrs, ao as hasProp, ap as getComponent, aq as firstNotUndefined, ae as genFocusStyle, M as useLocaleReceiver, ar as enUS, w as withInstall, ag as findDOMNode, as as addClass, at as removeClass, au as customRenderSlot, k as filterEmpty, V as devWarning, av as supportsPassive, aw as addEventListenerWrap, ax as ResizeObserver, ay as toPx, a0 as isVisible, az as camelize, aA as Tooltip, x as objectType, a2 as warningOnce, B as Button$1, E as Empty, af as clearFix, U as localeValues } from './collapseMotion.mjs';
import { B as BaseInput, S as SearchOutlined, u as useInjectFormItemContext, F as FormItemInputContext, j as getMergedStatus, k as getStatusClassNames, i as initInputToken, g as genBasicInputStyle, l as genInputSmallStyle, m as isStyleSupport, n as getOffset, I as Input$1 } from './index5.mjs';
import { O as Overflow, K as KeyCode, b as slideDownOut, a as slideUpOut, d as slideDownIn, c as slideUpIn, i as initSlideMotion, e as eagerComputed, M as Menu } from './index4.mjs';
import fromPairs from 'lodash-es/fromPairs';
import { p as pickAttrs, d as createRef, i as isMobile, L as List, u as useMergedState, D as DownOutlined, e as useStyle$3, f as convertDataToEntities, g as useMaxLevel, h as conductCheck, j as arrDel, k as arrAdd, T as Tree, S as Spin } from './index.mjs';
import { i as initMoveMotion, R as RightOutlined, L as LeftOutlined, D as Dropdown } from './index6.mjs';
import { C as CheckOutlined } from './CheckOutlined.mjs';
import { u as useBreakpoint } from './useBreakpoint.mjs';
import { TinyColor } from '@ctrl/tinycolor';

// eslint-disable-next-line import/prefer-default-export
const operationUnit = token => ({
  // FIXME: This use link but is a operation unit. Seems should be a colorPrimary.
  // And Typography use this to generate link style which should not do this.
  color: token.colorLink,
  textDecoration: 'none',
  outline: 'none',
  cursor: 'pointer',
  transition: `color ${token.motionDurationSlow}`,
  '&:focus, &:hover': {
    color: token.colorLinkHover
  },
  '&:active': {
    color: token.colorLinkActive
  }
});

function easeInOutCubic(t, b, c, d) {
  const cc = c - b;
  t /= d / 2;
  if (t < 1) {
    return cc / 2 * t * t * t + b;
  }
  return cc / 2 * ((t -= 2) * t * t + 2) + b;
}

function isWindow(obj) {
  return obj !== null && obj !== undefined && obj === obj.window;
}
function getScroll(target, top) {
  {
    return 0;
  }
}

function scrollTo(y) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    getContainer = () => window,
    callback,
    duration = 450
  } = options;
  const container = getContainer();
  const scrollTop = getScroll();
  const startTime = Date.now();
  const frameFunc = () => {
    const timestamp = Date.now();
    const time = timestamp - startTime;
    const nextScrollTop = easeInOutCubic(time > duration ? duration : time, scrollTop, y, duration);
    if (isWindow(container)) {
      container.scrollTo(window.scrollX, nextScrollTop);
    } else if (container instanceof Document) {
      container.documentElement.scrollTop = nextScrollTop;
    } else {
      container.scrollTop = nextScrollTop;
    }
    if (time < duration) {
      wrapperRaf(frameFunc);
    } else if (typeof callback === 'function') {
      callback();
    }
  };
  wrapperRaf(frameFunc);
}

function getKey(data, index) {
  const {
    key
  } = data;
  let value;
  if ('value' in data) {
    ({
      value
    } = data);
  }
  if (key !== null && key !== undefined) {
    return key;
  }
  if (value !== undefined) {
    return value;
  }
  return `rc-index-key-${index}`;
}
function fillFieldNames(fieldNames, childrenAsData) {
  const {
    label,
    value,
    options
  } = fieldNames || {};
  return {
    label: label || (childrenAsData ? 'children' : 'label'),
    value: value || 'value',
    options: options || 'options'
  };
}
/**
 * Flat options into flatten list.
 * We use `optionOnly` here is aim to avoid user use nested option group.
 * Here is simply set `key` to the index if not provided.
 */
function flattenOptions(options) {
  let {
    fieldNames,
    childrenAsData
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const flattenList = [];
  const {
    label: fieldLabel,
    value: fieldValue,
    options: fieldOptions
  } = fillFieldNames(fieldNames, false);
  function dig(list, isGroupOption) {
    list.forEach(data => {
      const label = data[fieldLabel];
      if (isGroupOption || !(fieldOptions in data)) {
        const value = data[fieldValue];
        // Option
        flattenList.push({
          key: getKey(data, flattenList.length),
          groupOption: isGroupOption,
          data,
          label,
          value
        });
      } else {
        let grpLabel = label;
        if (grpLabel === undefined && childrenAsData) {
          grpLabel = data.label;
        }
        // Option Group
        flattenList.push({
          key: getKey(data, flattenList.length),
          group: true,
          data,
          label: grpLabel
        });
        dig(data[fieldOptions], true);
      }
    });
  }
  dig(options, false);
  return flattenList;
}
/**
 * Inject `props` into `option` for legacy usage
 */
function injectPropsWithOption(option) {
  const newOption = _extends({}, option);
  if (!('props' in newOption)) {
    Object.defineProperty(newOption, 'props', {
      get() {
        return newOption;
      }
    });
  }
  return newOption;
}
function getSeparatedContent(text, tokens) {
  if (!tokens || !tokens.length) {
    return null;
  }
  let match = false;
  function separate(str, _ref) {
    let [token, ...restTokens] = _ref;
    if (!token) {
      return [str];
    }
    const list = str.split(token);
    match = match || list.length > 1;
    return list.reduce((prevList, unitStr) => [...prevList, ...separate(unitStr, restTokens)], []).filter(unit => unit);
  }
  const list = separate(text, tokens);
  return match ? list : null;
}

/* eslint-disable no-param-reassign */
let cached;
function getScrollBarSize(fresh) {
  if (typeof document === 'undefined') {
    return 0;
  }
  if (cached === undefined) {
    const inner = document.createElement('div');
    inner.style.width = '100%';
    inner.style.height = '200px';
    const outer = document.createElement('div');
    const outerStyle = outer.style;
    outerStyle.position = 'absolute';
    outerStyle.top = '0';
    outerStyle.left = '0';
    outerStyle.pointerEvents = 'none';
    outerStyle.visibility = 'hidden';
    outerStyle.width = '200px';
    outerStyle.height = '150px';
    outerStyle.overflow = 'hidden';
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const widthContained = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    let widthScroll = inner.offsetWidth;
    if (widthContained === widthScroll) {
      widthScroll = outer.clientWidth;
    }
    document.body.removeChild(outer);
    cached = widthContained - widthScroll;
  }
  return cached;
}
function ensureSize(str) {
  const match = str.match(/^(.*)px$/);
  const value = Number(match === null || match === void 0 ? void 0 : match[1]);
  return Number.isNaN(value) ? getScrollBarSize() : value;
}
function getTargetScrollBarSize(target) {
  if (typeof document === 'undefined' || !target || !(target instanceof Element)) {
    return {
      width: 0,
      height: 0
    };
  }
  const {
    width,
    height
  } = getComputedStyle(target, '::-webkit-scrollbar');
  return {
    width: ensureSize(width),
    height: ensureSize(height)
  };
}

var __rest$c = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const getBuiltInPlacements = dropdownMatchSelectWidth => {
  // Enable horizontal overflow auto-adjustment when a custom dropdown width is provided
  const adjustX = dropdownMatchSelectWidth === true ? 0 : 1;
  return {
    bottomLeft: {
      points: ['tl', 'bl'],
      offset: [0, 4],
      overflow: {
        adjustX,
        adjustY: 1
      }
    },
    bottomRight: {
      points: ['tr', 'br'],
      offset: [0, 4],
      overflow: {
        adjustX,
        adjustY: 1
      }
    },
    topLeft: {
      points: ['bl', 'tl'],
      offset: [0, -4],
      overflow: {
        adjustX,
        adjustY: 1
      }
    },
    topRight: {
      points: ['br', 'tr'],
      offset: [0, -4],
      overflow: {
        adjustX,
        adjustY: 1
      }
    }
  };
};
const SelectTrigger = defineComponent({
  name: 'SelectTrigger',
  inheritAttrs: false,
  props: {
    dropdownAlign: Object,
    visible: {
      type: Boolean,
      default: undefined
    },
    disabled: {
      type: Boolean,
      default: undefined
    },
    dropdownClassName: String,
    dropdownStyle: PropTypes.object,
    placement: String,
    empty: {
      type: Boolean,
      default: undefined
    },
    prefixCls: String,
    popupClassName: String,
    animation: String,
    transitionName: String,
    getPopupContainer: Function,
    dropdownRender: Function,
    containerWidth: Number,
    dropdownMatchSelectWidth: PropTypes.oneOfType([Number, Boolean]).def(true),
    popupElement: PropTypes.any,
    direction: String,
    getTriggerDOMNode: Function,
    onPopupVisibleChange: Function,
    onPopupMouseEnter: Function,
    onPopupFocusin: Function,
    onPopupFocusout: Function
  },
  setup(props, _ref) {
    let {
      slots,
      attrs,
      expose
    } = _ref;
    const builtInPlacements = computed(() => {
      const {
        dropdownMatchSelectWidth
      } = props;
      return getBuiltInPlacements(dropdownMatchSelectWidth);
    });
    const popupRef = ref();
    expose({
      getPopupElement: () => {
        return popupRef.value;
      }
    });
    return () => {
      const _a = _extends(_extends({}, props), attrs),
        {
          empty = false
        } = _a,
        restProps = __rest$c(_a, ["empty"]);
      const {
        visible,
        dropdownAlign,
        prefixCls,
        popupElement,
        dropdownClassName,
        dropdownStyle,
        direction = 'ltr',
        placement,
        dropdownMatchSelectWidth,
        containerWidth,
        dropdownRender,
        animation,
        transitionName,
        getPopupContainer,
        getTriggerDOMNode,
        onPopupVisibleChange,
        onPopupMouseEnter,
        onPopupFocusin,
        onPopupFocusout
      } = restProps;
      const dropdownPrefixCls = `${prefixCls}-dropdown`;
      let popupNode = popupElement;
      if (dropdownRender) {
        popupNode = dropdownRender({
          menuNode: popupElement,
          props
        });
      }
      const mergedTransitionName = animation ? `${dropdownPrefixCls}-${animation}` : transitionName;
      const popupStyle = _extends({
        minWidth: `${containerWidth}px`
      }, dropdownStyle);
      if (typeof dropdownMatchSelectWidth === 'number') {
        popupStyle.width = `${dropdownMatchSelectWidth}px`;
      } else if (dropdownMatchSelectWidth) {
        popupStyle.width = `${containerWidth}px`;
      }
      return createVNode(Trigger, _objectSpread$5(_objectSpread$5({}, props), {}, {
        "showAction": onPopupVisibleChange ? ['click'] : [],
        "hideAction": onPopupVisibleChange ? ['click'] : [],
        "popupPlacement": placement || (direction === 'rtl' ? 'bottomRight' : 'bottomLeft'),
        "builtinPlacements": builtInPlacements.value,
        "prefixCls": dropdownPrefixCls,
        "popupTransitionName": mergedTransitionName,
        "popupAlign": dropdownAlign,
        "popupVisible": visible,
        "getPopupContainer": getPopupContainer,
        "popupClassName": classNames(dropdownClassName, {
          [`${dropdownPrefixCls}-empty`]: empty
        }),
        "popupStyle": popupStyle,
        "getTriggerDOMNode": getTriggerDOMNode,
        "onPopupVisibleChange": onPopupVisibleChange
      }), {
        default: slots.default,
        popup: () => createVNode("div", {
          "ref": popupRef,
          "onMouseenter": onPopupMouseEnter,
          "onFocusin": onPopupFocusin,
          "onFocusout": onPopupFocusout
        }, [popupNode])
      });
    };
  }
});

const TransBtn = (props, _ref) => {
  let {
    slots
  } = _ref;
  var _a;
  const {
    class: className,
    customizeIcon,
    customizeIconProps,
    onMousedown,
    onClick
  } = props;
  let icon;
  if (typeof customizeIcon === 'function') {
    icon = customizeIcon(customizeIconProps);
  } else {
    icon = isVNode(customizeIcon) ? cloneVNode(customizeIcon) : customizeIcon;
  }
  return createVNode("span", {
    "class": className,
    "onMousedown": event => {
      event.preventDefault();
      if (onMousedown) {
        onMousedown(event);
      }
    },
    "style": {
      userSelect: 'none',
      WebkitUserSelect: 'none'
    },
    "unselectable": "on",
    "onClick": onClick,
    "aria-hidden": true
  }, [icon !== undefined ? icon : createVNode("span", {
    "class": className.split(/\s+/).map(cls => `${cls}-icon`)
  }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)])]);
};
TransBtn.inheritAttrs = false;
TransBtn.displayName = 'TransBtn';
TransBtn.props = {
  class: String,
  customizeIcon: PropTypes.any,
  customizeIconProps: PropTypes.any,
  onMousedown: Function,
  onClick: Function
};

const inputProps = {
  inputRef: PropTypes.any,
  prefixCls: String,
  id: String,
  inputElement: PropTypes.VueNode,
  disabled: {
    type: Boolean,
    default: undefined
  },
  autofocus: {
    type: Boolean,
    default: undefined
  },
  autocomplete: String,
  editable: {
    type: Boolean,
    default: undefined
  },
  activeDescendantId: String,
  value: String,
  open: {
    type: Boolean,
    default: undefined
  },
  tabindex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Pass accessibility props to input */
  attrs: PropTypes.object,
  onKeydown: {
    type: Function
  },
  onMousedown: {
    type: Function
  },
  onChange: {
    type: Function
  },
  onPaste: {
    type: Function
  },
  onCompositionstart: {
    type: Function
  },
  onCompositionend: {
    type: Function
  },
  onFocus: {
    type: Function
  },
  onBlur: {
    type: Function
  }
};
const Input = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'SelectInput',
  inheritAttrs: false,
  props: inputProps,
  setup(props) {
    let blurTimeout = null;
    const VCSelectContainerEvent = inject('VCSelectContainerEvent');
    return () => {
      var _a;
      const {
        prefixCls,
        id,
        inputElement,
        disabled,
        tabindex,
        autofocus,
        autocomplete,
        editable,
        activeDescendantId,
        value,
        onKeydown,
        onMousedown,
        onChange,
        onPaste,
        onCompositionstart,
        onCompositionend,
        onFocus,
        onBlur,
        open,
        inputRef,
        attrs
      } = props;
      let inputNode = inputElement || createVNode(BaseInput, null, null);
      const inputProps = inputNode.props || {};
      const {
        onKeydown: onOriginKeyDown,
        onInput: onOriginInput,
        onFocus: onOriginFocus,
        onBlur: onOriginBlur,
        onMousedown: onOriginMouseDown,
        onCompositionstart: onOriginCompositionStart,
        onCompositionend: onOriginCompositionEnd,
        style
      } = inputProps;
      inputNode = cloneElement(inputNode, _extends(_extends(_extends(_extends(_extends({
        type: 'search'
      }, inputProps), {
        id,
        ref: inputRef,
        disabled,
        tabindex,
        lazy: false,
        autocomplete: autocomplete || 'off',
        autofocus,
        class: classNames(`${prefixCls}-selection-search-input`, (_a = inputNode === null || inputNode === void 0 ? void 0 : inputNode.props) === null || _a === void 0 ? void 0 : _a.class),
        role: 'combobox',
        'aria-expanded': open,
        'aria-haspopup': 'listbox',
        'aria-owns': `${id}_list`,
        'aria-autocomplete': 'list',
        'aria-controls': `${id}_list`,
        'aria-activedescendant': activeDescendantId
      }), attrs), {
        value: editable ? value : '',
        readonly: !editable,
        unselectable: !editable ? 'on' : null,
        style: _extends(_extends({}, style), {
          opacity: editable ? null : 0
        }),
        onKeydown: event => {
          onKeydown(event);
          if (onOriginKeyDown) {
            onOriginKeyDown(event);
          }
        },
        onMousedown: event => {
          onMousedown(event);
          if (onOriginMouseDown) {
            onOriginMouseDown(event);
          }
        },
        onInput: event => {
          onChange(event);
          if (onOriginInput) {
            onOriginInput(event);
          }
        },
        onCompositionstart(event) {
          onCompositionstart(event);
          if (onOriginCompositionStart) {
            onOriginCompositionStart(event);
          }
        },
        onCompositionend(event) {
          onCompositionend(event);
          if (onOriginCompositionEnd) {
            onOriginCompositionEnd(event);
          }
        },
        onPaste,
        onFocus: function () {
          clearTimeout(blurTimeout);
          onOriginFocus && onOriginFocus(arguments.length <= 0 ? undefined : arguments[0]);
          onFocus && onFocus(arguments.length <= 0 ? undefined : arguments[0]);
          VCSelectContainerEvent === null || VCSelectContainerEvent === void 0 ? void 0 : VCSelectContainerEvent.focus(arguments.length <= 0 ? undefined : arguments[0]);
        },
        onBlur: function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          blurTimeout = setTimeout(() => {
            onOriginBlur && onOriginBlur(args[0]);
            onBlur && onBlur(args[0]);
            VCSelectContainerEvent === null || VCSelectContainerEvent === void 0 ? void 0 : VCSelectContainerEvent.blur(args[0]);
          }, 100);
        }
      }), inputNode.type === 'textarea' ? {} : {
        type: 'search'
      }), true, true);
      return inputNode;
    };
  }
});

/**
 * BaseSelect provide some parsed data into context.
 * You can use this hooks to get them.
 */
const TreeSelectLegacyContextPropsKey = Symbol('TreeSelectLegacyContextPropsKey');
function useInjectLegacySelectContext() {
  return inject(TreeSelectLegacyContextPropsKey, {});
}

const props$1 = {
  id: String,
  prefixCls: String,
  values: PropTypes.array,
  open: {
    type: Boolean,
    default: undefined
  },
  searchValue: String,
  inputRef: PropTypes.any,
  placeholder: PropTypes.any,
  disabled: {
    type: Boolean,
    default: undefined
  },
  mode: String,
  showSearch: {
    type: Boolean,
    default: undefined
  },
  autofocus: {
    type: Boolean,
    default: undefined
  },
  autocomplete: String,
  activeDescendantId: String,
  tabindex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  compositionStatus: Boolean,
  removeIcon: PropTypes.any,
  choiceTransitionName: String,
  maxTagCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxTagTextLength: Number,
  maxTagPlaceholder: PropTypes.any.def(() => omittedValues => `+ ${omittedValues.length} ...`),
  tagRender: Function,
  onToggleOpen: {
    type: Function
  },
  onRemove: Function,
  onInputChange: Function,
  onInputPaste: Function,
  onInputKeyDown: Function,
  onInputMouseDown: Function,
  onInputCompositionStart: Function,
  onInputCompositionEnd: Function
};
const onPreventMouseDown = event => {
  event.preventDefault();
  event.stopPropagation();
};
const SelectSelector = defineComponent({
  name: 'MultipleSelectSelector',
  inheritAttrs: false,
  props: props$1,
  setup(props) {
    const measureRef = shallowRef();
    const inputWidth = shallowRef(0);
    const focused = shallowRef(false);
    const legacyTreeSelectContext = useInjectLegacySelectContext();
    const selectionPrefixCls = computed(() => `${props.prefixCls}-selection`);
    // ===================== Search ======================
    const inputValue = computed(() => props.open || props.mode === 'tags' ? props.searchValue : '');
    const inputEditable = computed(() => props.mode === 'tags' || props.showSearch && (props.open || focused.value));
    const targetValue = ref('');
    watchEffect(() => {
      targetValue.value = inputValue.value;
    });
    // We measure width and set to the input immediately
    onMounted(() => {
      watch(targetValue, () => {
        inputWidth.value = measureRef.value.scrollWidth;
      }, {
        flush: 'post',
        immediate: true
      });
    });
    // ===================== Render ======================
    // >>> Render Selector Node. Includes Item & Rest
    function defaultRenderSelector(title, content, itemDisabled, closable, onClose) {
      return createVNode("span", {
        "class": classNames(`${selectionPrefixCls.value}-item`, {
          [`${selectionPrefixCls.value}-item-disabled`]: itemDisabled
        }),
        "title": typeof title === 'string' || typeof title === 'number' ? title.toString() : undefined
      }, [createVNode("span", {
        "class": `${selectionPrefixCls.value}-item-content`
      }, [content]), closable && createVNode(TransBtn, {
        "class": `${selectionPrefixCls.value}-item-remove`,
        "onMousedown": onPreventMouseDown,
        "onClick": onClose,
        "customizeIcon": props.removeIcon
      }, {
        default: () => [createTextVNode("\xD7")]
      })]);
    }
    function customizeRenderSelector(value, content, itemDisabled, closable, onClose, option) {
      var _a;
      const onMouseDown = e => {
        onPreventMouseDown(e);
        props.onToggleOpen(!open);
      };
      let originData = option;
      // For TreeSelect
      if (legacyTreeSelectContext.keyEntities) {
        originData = ((_a = legacyTreeSelectContext.keyEntities[value]) === null || _a === void 0 ? void 0 : _a.node) || {};
      }
      return createVNode("span", {
        "key": value,
        "onMousedown": onMouseDown
      }, [props.tagRender({
        label: content,
        value,
        disabled: itemDisabled,
        closable,
        onClose,
        option: originData
      })]);
    }
    function renderItem(valueItem) {
      const {
        disabled: itemDisabled,
        label,
        value,
        option
      } = valueItem;
      const closable = !props.disabled && !itemDisabled;
      let displayLabel = label;
      if (typeof props.maxTagTextLength === 'number') {
        if (typeof label === 'string' || typeof label === 'number') {
          const strLabel = String(displayLabel);
          if (strLabel.length > props.maxTagTextLength) {
            displayLabel = `${strLabel.slice(0, props.maxTagTextLength)}...`;
          }
        }
      }
      const onClose = event => {
        var _a;
        if (event) event.stopPropagation();
        (_a = props.onRemove) === null || _a === void 0 ? void 0 : _a.call(props, valueItem);
      };
      return typeof props.tagRender === 'function' ? customizeRenderSelector(value, displayLabel, itemDisabled, closable, onClose, option) : defaultRenderSelector(label, displayLabel, itemDisabled, closable, onClose);
    }
    function renderRest(omittedValues) {
      const {
        maxTagPlaceholder = omittedValues => `+ ${omittedValues.length} ...`
      } = props;
      const content = typeof maxTagPlaceholder === 'function' ? maxTagPlaceholder(omittedValues) : maxTagPlaceholder;
      return defaultRenderSelector(content, content, false);
    }
    const handleInput = e => {
      const composing = e.target.composing;
      targetValue.value = e.target.value;
      if (!composing) {
        props.onInputChange(e);
      }
    };
    return () => {
      const {
        id,
        prefixCls,
        values,
        open,
        inputRef,
        placeholder,
        disabled,
        autofocus,
        autocomplete,
        activeDescendantId,
        tabindex,
        compositionStatus,
        onInputPaste,
        onInputKeyDown,
        onInputMouseDown,
        onInputCompositionStart,
        onInputCompositionEnd
      } = props;
      // >>> Input Node
      const inputNode = createVNode("div", {
        "class": `${selectionPrefixCls.value}-search`,
        "style": {
          width: inputWidth.value + 'px'
        },
        "key": "input"
      }, [createVNode(Input, {
        "inputRef": inputRef,
        "open": open,
        "prefixCls": prefixCls,
        "id": id,
        "inputElement": null,
        "disabled": disabled,
        "autofocus": autofocus,
        "autocomplete": autocomplete,
        "editable": inputEditable.value,
        "activeDescendantId": activeDescendantId,
        "value": targetValue.value,
        "onKeydown": onInputKeyDown,
        "onMousedown": onInputMouseDown,
        "onChange": handleInput,
        "onPaste": onInputPaste,
        "onCompositionstart": onInputCompositionStart,
        "onCompositionend": onInputCompositionEnd,
        "tabindex": tabindex,
        "attrs": pickAttrs(props, true),
        "onFocus": () => focused.value = true,
        "onBlur": () => focused.value = false
      }, null), createVNode("span", {
        "ref": measureRef,
        "class": `${selectionPrefixCls.value}-search-mirror`,
        "aria-hidden": true
      }, [targetValue.value, createTextVNode("\xA0")])]);
      // >>> Selections
      const selectionNode = createVNode(Overflow, {
        "prefixCls": `${selectionPrefixCls.value}-overflow`,
        "data": values,
        "renderItem": renderItem,
        "renderRest": renderRest,
        "suffix": inputNode,
        "itemKey": "key",
        "maxCount": props.maxTagCount,
        "key": "overflow"
      }, null);
      return createVNode(Fragment, null, [selectionNode, !values.length && !inputValue.value && !compositionStatus && createVNode("span", {
        "class": `${selectionPrefixCls.value}-placeholder`
      }, [placeholder])]);
    };
  }
});

const props = {
  inputElement: PropTypes.any,
  id: String,
  prefixCls: String,
  values: PropTypes.array,
  open: {
    type: Boolean,
    default: undefined
  },
  searchValue: String,
  inputRef: PropTypes.any,
  placeholder: PropTypes.any,
  compositionStatus: {
    type: Boolean,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: undefined
  },
  mode: String,
  showSearch: {
    type: Boolean,
    default: undefined
  },
  autofocus: {
    type: Boolean,
    default: undefined
  },
  autocomplete: String,
  activeDescendantId: String,
  tabindex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  activeValue: String,
  backfill: {
    type: Boolean,
    default: undefined
  },
  optionLabelRender: Function,
  onInputChange: Function,
  onInputPaste: Function,
  onInputKeyDown: Function,
  onInputMouseDown: Function,
  onInputCompositionStart: Function,
  onInputCompositionEnd: Function
};
const SingleSelector = defineComponent({
  name: 'SingleSelector',
  setup(props) {
    const inputChanged = shallowRef(false);
    const combobox = computed(() => props.mode === 'combobox');
    const inputEditable = computed(() => combobox.value || props.showSearch);
    const inputValue = computed(() => {
      let inputValue = props.searchValue || '';
      if (combobox.value && props.activeValue && !inputChanged.value) {
        inputValue = props.activeValue;
      }
      return inputValue;
    });
    const legacyTreeSelectContext = useInjectLegacySelectContext();
    watch([combobox, () => props.activeValue], () => {
      if (combobox.value) {
        inputChanged.value = false;
      }
    }, {
      immediate: true
    });
    // Not show text when closed expect combobox mode
    const hasTextInput = computed(() => props.mode !== 'combobox' && !props.open && !props.showSearch ? false : !!inputValue.value || props.compositionStatus);
    const title = computed(() => {
      const item = props.values[0];
      return item && (typeof item.label === 'string' || typeof item.label === 'number') ? item.label.toString() : undefined;
    });
    const renderPlaceholder = () => {
      if (props.values[0]) {
        return null;
      }
      const hiddenStyle = hasTextInput.value ? {
        visibility: 'hidden'
      } : undefined;
      return createVNode("span", {
        "class": `${props.prefixCls}-selection-placeholder`,
        "style": hiddenStyle
      }, [props.placeholder]);
    };
    const handleInput = e => {
      const composing = e.target.composing;
      if (!composing) {
        inputChanged.value = true;
        props.onInputChange(e);
      }
    };
    return () => {
      var _a, _b, _c, _d;
      const {
        inputElement,
        prefixCls,
        id,
        values,
        inputRef,
        disabled,
        autofocus,
        autocomplete,
        activeDescendantId,
        open,
        tabindex,
        optionLabelRender,
        onInputKeyDown,
        onInputMouseDown,
        onInputPaste,
        onInputCompositionStart,
        onInputCompositionEnd
      } = props;
      const item = values[0];
      let titleNode = null;
      // custom tree-select title by slot
      // For TreeSelect
      if (item && legacyTreeSelectContext.customSlots) {
        const key = (_a = item.key) !== null && _a !== void 0 ? _a : item.value;
        const originData = ((_b = legacyTreeSelectContext.keyEntities[key]) === null || _b === void 0 ? void 0 : _b.node) || {};
        titleNode = legacyTreeSelectContext.customSlots[(_c = originData.slots) === null || _c === void 0 ? void 0 : _c.title] || legacyTreeSelectContext.customSlots.title || item.label;
        if (typeof titleNode === 'function') {
          titleNode = titleNode(originData);
        }
        //  else if (treeSelectContext.value.slots.titleRender) {
        //   // 因历史 title 是覆盖逻辑，新增 titleRender，所有的 title 都走一遍 titleRender
        //   titleNode = treeSelectContext.value.slots.titleRender(item.option?.data || {});
        // }
      } else {
        titleNode = optionLabelRender && item ? optionLabelRender(item.option) : item === null || item === void 0 ? void 0 : item.label;
      }
      return createVNode(Fragment, null, [createVNode("span", {
        "class": `${prefixCls}-selection-search`
      }, [createVNode(Input, {
        "inputRef": inputRef,
        "prefixCls": prefixCls,
        "id": id,
        "open": open,
        "inputElement": inputElement,
        "disabled": disabled,
        "autofocus": autofocus,
        "autocomplete": autocomplete,
        "editable": inputEditable.value,
        "activeDescendantId": activeDescendantId,
        "value": inputValue.value,
        "onKeydown": onInputKeyDown,
        "onMousedown": onInputMouseDown,
        "onChange": handleInput,
        "onPaste": onInputPaste,
        "onCompositionstart": onInputCompositionStart,
        "onCompositionend": onInputCompositionEnd,
        "tabindex": tabindex,
        "attrs": pickAttrs(props, true)
      }, null)]), !combobox.value && item && !hasTextInput.value && createVNode("span", {
        "class": `${prefixCls}-selection-item`,
        "title": title.value
      }, [createVNode(Fragment, {
        "key": (_d = item.key) !== null && _d !== void 0 ? _d : item.value
      }, [titleNode])]), renderPlaceholder()]);
    };
  }
});
SingleSelector.props = props;
SingleSelector.inheritAttrs = false;

/** keyCode Judgment function */
function isValidateOpenKey(currentKeyCode) {
  return ![
  // System function button
  KeyCode.ESC, KeyCode.SHIFT, KeyCode.BACKSPACE, KeyCode.TAB, KeyCode.WIN_KEY, KeyCode.ALT, KeyCode.META, KeyCode.WIN_KEY_RIGHT, KeyCode.CTRL, KeyCode.SEMICOLON, KeyCode.EQUALS, KeyCode.CAPS_LOCK, KeyCode.CONTEXT_MENU,
  // F1-F12
  KeyCode.F1, KeyCode.F2, KeyCode.F3, KeyCode.F4, KeyCode.F5, KeyCode.F6, KeyCode.F7, KeyCode.F8, KeyCode.F9, KeyCode.F10, KeyCode.F11, KeyCode.F12].includes(currentKeyCode);
}

/**
 * Locker return cached mark.
 * If set to `true`, will return `true` in a short time even if set `false`.
 * If set to `false` and then set to `true`, will change to `true`.
 * And after time duration, it will back to `null` automatically.
 */
function useLock() {
  let duration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 250;
  let lock = null;
  let timeout;
  onBeforeUnmount(() => {
    clearTimeout(timeout);
  });
  function doLock(locked) {
    if (locked || lock === null) {
      lock = locked;
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      lock = null;
    }, duration);
  }
  return [() => lock, doLock];
}

const Selector = defineComponent({
  name: 'Selector',
  inheritAttrs: false,
  props: {
    id: String,
    prefixCls: String,
    showSearch: {
      type: Boolean,
      default: undefined
    },
    open: {
      type: Boolean,
      default: undefined
    },
    /** Display in the Selector value, it's not same as `value` prop */
    values: PropTypes.array,
    multiple: {
      type: Boolean,
      default: undefined
    },
    mode: String,
    searchValue: String,
    activeValue: String,
    inputElement: PropTypes.any,
    autofocus: {
      type: Boolean,
      default: undefined
    },
    activeDescendantId: String,
    tabindex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    disabled: {
      type: Boolean,
      default: undefined
    },
    placeholder: PropTypes.any,
    removeIcon: PropTypes.any,
    // Tags
    maxTagCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxTagTextLength: Number,
    maxTagPlaceholder: PropTypes.any,
    tagRender: Function,
    optionLabelRender: Function,
    /** Check if `tokenSeparators` contains `\n` or `\r\n` */
    tokenWithEnter: {
      type: Boolean,
      default: undefined
    },
    // Motion
    choiceTransitionName: String,
    onToggleOpen: {
      type: Function
    },
    /** `onSearch` returns go next step boolean to check if need do toggle open */
    onSearch: Function,
    onSearchSubmit: Function,
    onRemove: Function,
    onInputKeyDown: {
      type: Function
    },
    /**
     * @private get real dom for trigger align.
     * This may be removed after React provides replacement of `findDOMNode`
     */
    domRef: Function
  },
  setup(props, _ref) {
    let {
      expose
    } = _ref;
    const inputRef = createRef();
    const compositionStatus = ref(false);
    // ====================== Input ======================
    const [getInputMouseDown, setInputMouseDown] = useLock(0);
    const onInternalInputKeyDown = event => {
      const {
        which
      } = event;
      if (which === KeyCode.UP || which === KeyCode.DOWN) {
        event.preventDefault();
      }
      if (props.onInputKeyDown) {
        props.onInputKeyDown(event);
      }
      if (which === KeyCode.ENTER && props.mode === 'tags' && !compositionStatus.value && !props.open) {
        // When menu isn't open, OptionList won't trigger a value change
        // So when enter is pressed, the tag's input value should be emitted here to let selector know
        props.onSearchSubmit(event.target.value);
      }
      if (isValidateOpenKey(which)) {
        props.onToggleOpen(true);
      }
    };
    /**
     * We can not use `findDOMNode` sine it will get warning,
     * have to use timer to check if is input element.
     */
    const onInternalInputMouseDown = () => {
      setInputMouseDown(true);
    };
    // When paste come, ignore next onChange
    let pastedText = null;
    const triggerOnSearch = value => {
      if (props.onSearch(value, true, compositionStatus.value) !== false) {
        props.onToggleOpen(true);
      }
    };
    const onInputCompositionStart = () => {
      compositionStatus.value = true;
    };
    const onInputCompositionEnd = e => {
      compositionStatus.value = false;
      // Trigger search again to support `tokenSeparators` with typewriting
      if (props.mode !== 'combobox') {
        triggerOnSearch(e.target.value);
      }
    };
    const onInputChange = event => {
      let {
        target: {
          value
        }
      } = event;
      // Pasted text should replace back to origin content
      if (props.tokenWithEnter && pastedText && /[\r\n]/.test(pastedText)) {
        // CRLF will be treated as a single space for input element
        const replacedText = pastedText.replace(/[\r\n]+$/, '').replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
        value = value.replace(replacedText, pastedText);
      }
      pastedText = null;
      triggerOnSearch(value);
    };
    const onInputPaste = e => {
      const {
        clipboardData
      } = e;
      const value = clipboardData.getData('text');
      pastedText = value;
    };
    const onClick = _ref2 => {
      let {
        target
      } = _ref2;
      if (target !== inputRef.current) {
        // Should focus input if click the selector
        const isIE = document.body.style.msTouchAction !== undefined;
        if (isIE) {
          setTimeout(() => {
            inputRef.current.focus();
          });
        } else {
          inputRef.current.focus();
        }
      }
    };
    const onMousedown = event => {
      const inputMouseDown = getInputMouseDown();
      if (event.target !== inputRef.current && !inputMouseDown) {
        event.preventDefault();
      }
      if (props.mode !== 'combobox' && (!props.showSearch || !inputMouseDown) || !props.open) {
        if (props.open) {
          props.onSearch('', true, false);
        }
        props.onToggleOpen();
      }
    };
    expose({
      focus: () => {
        inputRef.current.focus();
      },
      blur: () => {
        inputRef.current.blur();
      }
    });
    return () => {
      const {
        prefixCls,
        domRef,
        mode
      } = props;
      const sharedProps = {
        inputRef,
        onInputKeyDown: onInternalInputKeyDown,
        onInputMouseDown: onInternalInputMouseDown,
        onInputChange,
        onInputPaste,
        compositionStatus: compositionStatus.value,
        onInputCompositionStart,
        onInputCompositionEnd
      };
      const selectNode = mode === 'multiple' || mode === 'tags' ? createVNode(SelectSelector, _objectSpread$5(_objectSpread$5({}, props), sharedProps), null) : createVNode(SingleSelector, _objectSpread$5(_objectSpread$5({}, props), sharedProps), null);
      return createVNode("div", {
        "ref": domRef,
        "class": `${prefixCls}-selector`,
        "onClick": onClick,
        "onMousedown": onMousedown
      }, [selectNode]);
    };
  }
});

function useSelectTriggerControl(refs, open, triggerOpen) {
  function onGlobalMouseDown(event) {
    var _a, _b, _c;
    let target = event.target;
    if (target.shadowRoot && event.composed) {
      target = event.composedPath()[0] || target;
    }
    const elements = [(_a = refs[0]) === null || _a === void 0 ? void 0 : _a.value, (_c = (_b = refs[1]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.getPopupElement()];
    if (open.value && elements.every(element => element && !element.contains(target) && element !== target)) {
      // Should trigger close
      triggerOpen(false);
    }
  }
  onMounted(() => {
    window.addEventListener('mousedown', onGlobalMouseDown);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', onGlobalMouseDown);
  });
}

/**
 * Similar with `useLock`, but this hook will always execute last value.
 * When set to `true`, it will keep `true` for a short time even if `false` is set.
 */
function useDelayReset() {
  let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
  const bool = shallowRef(false);
  let delay;
  const cancelLatest = () => {
    clearTimeout(delay);
  };
  onMounted(() => {
    cancelLatest();
  });
  const delaySetBool = (value, callback) => {
    cancelLatest();
    delay = setTimeout(() => {
      bool.value = value;
      if (callback) {
        callback();
      }
    }, timeout);
  };
  return [bool, delaySetBool, cancelLatest];
}

/**
 * BaseSelect provide some parsed data into context.
 * You can use this hooks to get them.
 */
const BaseSelectContextKey = Symbol('BaseSelectContextKey');
function useProvideBaseSelectProps(props) {
  return provide(BaseSelectContextKey, props);
}
function useBaseProps() {
  return inject(BaseSelectContextKey, {});
}

/**
 * Converts ref to reactive.
 *
 * @see https://vueuse.org/toReactive
 * @param objectRef A ref of object
 */
function toReactive(objectRef) {
  if (!isRef(objectRef)) return reactive(objectRef);
  const proxy = new Proxy({}, {
    get(_, p, receiver) {
      return Reflect.get(objectRef.value, p, receiver);
    },
    set(_, p, value) {
      objectRef.value[p] = value;
      return true;
    },
    deleteProperty(_, p) {
      return Reflect.deleteProperty(objectRef.value, p);
    },
    has(_, p) {
      return Reflect.has(objectRef.value, p);
    },
    ownKeys() {
      return Object.keys(objectRef.value);
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true
      };
    }
  });
  return reactive(proxy);
}

var __rest$b = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const DEFAULT_OMIT_PROPS = ['value', 'onChange', 'removeIcon', 'placeholder', 'autofocus', 'maxTagCount', 'maxTagTextLength', 'maxTagPlaceholder', 'choiceTransitionName', 'onInputKeyDown', 'onPopupScroll', 'tabindex', 'OptionList', 'notFoundContent'];
const baseSelectPrivateProps = () => {
  return {
    prefixCls: String,
    id: String,
    omitDomProps: Array,
    // >>> Value
    displayValues: Array,
    onDisplayValuesChange: Function,
    // >>> Active
    /** Current dropdown list active item string value */
    activeValue: String,
    /** Link search input with target element */
    activeDescendantId: String,
    onActiveValueChange: Function,
    // >>> Search
    searchValue: String,
    /** Trigger onSearch, return false to prevent trigger open event */
    onSearch: Function,
    /** Trigger when search text match the `tokenSeparators`. Will provide split content */
    onSearchSplit: Function,
    maxLength: Number,
    OptionList: PropTypes.any,
    /** Tell if provided `options` is empty */
    emptyOptions: Boolean
  };
};
const baseSelectPropsWithoutPrivate = () => {
  return {
    showSearch: {
      type: Boolean,
      default: undefined
    },
    tagRender: {
      type: Function
    },
    optionLabelRender: {
      type: Function
    },
    direction: {
      type: String
    },
    // MISC
    tabindex: Number,
    autofocus: Boolean,
    notFoundContent: PropTypes.any,
    placeholder: PropTypes.any,
    onClear: Function,
    choiceTransitionName: String,
    // >>> Mode
    mode: String,
    // >>> Status
    disabled: {
      type: Boolean,
      default: undefined
    },
    loading: {
      type: Boolean,
      default: undefined
    },
    // >>> Open
    open: {
      type: Boolean,
      default: undefined
    },
    defaultOpen: {
      type: Boolean,
      default: undefined
    },
    onDropdownVisibleChange: {
      type: Function
    },
    // >>> Customize Input
    /** @private Internal usage. Do not use in your production. */
    getInputElement: {
      type: Function
    },
    /** @private Internal usage. Do not use in your production. */
    getRawInputElement: {
      type: Function
    },
    // >>> Selector
    maxTagTextLength: Number,
    maxTagCount: {
      type: [String, Number]
    },
    maxTagPlaceholder: PropTypes.any,
    // >>> Search
    tokenSeparators: {
      type: Array
    },
    // >>> Icons
    allowClear: {
      type: Boolean,
      default: undefined
    },
    showArrow: {
      type: Boolean,
      default: undefined
    },
    inputIcon: PropTypes.any,
    /** Clear all icon */
    clearIcon: PropTypes.any,
    /** Selector remove icon */
    removeIcon: PropTypes.any,
    // >>> Dropdown
    animation: String,
    transitionName: String,
    dropdownStyle: {
      type: Object
    },
    dropdownClassName: String,
    dropdownMatchSelectWidth: {
      type: [Boolean, Number],
      default: undefined
    },
    dropdownRender: {
      type: Function
    },
    dropdownAlign: Object,
    placement: {
      type: String
    },
    getPopupContainer: {
      type: Function
    },
    // >>> Focus
    showAction: {
      type: Array
    },
    onBlur: {
      type: Function
    },
    onFocus: {
      type: Function
    },
    // >>> Rest Events
    onKeyup: Function,
    onKeydown: Function,
    onMousedown: Function,
    onPopupScroll: Function,
    onInputKeyDown: Function,
    onMouseenter: Function,
    onMouseleave: Function,
    onClick: Function
  };
};
const baseSelectProps = () => {
  return _extends(_extends({}, baseSelectPrivateProps()), baseSelectPropsWithoutPrivate());
};
function isMultiple(mode) {
  return mode === 'tags' || mode === 'multiple';
}
const BaseSelect = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'BaseSelect',
  inheritAttrs: false,
  props: initDefaultProps(baseSelectProps(), {
    showAction: [],
    notFoundContent: 'Not Found'
  }),
  setup(props, _ref) {
    let {
      attrs,
      expose,
      slots
    } = _ref;
    const multiple = computed(() => isMultiple(props.mode));
    const mergedShowSearch = computed(() => props.showSearch !== undefined ? props.showSearch : multiple.value || props.mode === 'combobox');
    const mobile = shallowRef(false);
    onMounted(() => {
      mobile.value = isMobile();
    });
    const legacyTreeSelectContext = useInjectLegacySelectContext();
    // ============================== Refs ==============================
    const containerRef = shallowRef(null);
    const selectorDomRef = createRef();
    const triggerRef = shallowRef(null);
    const selectorRef = shallowRef(null);
    const listRef = shallowRef(null);
    const blurRef = ref(false);
    /** Used for component focused management */
    const [mockFocused, setMockFocused, cancelSetMockFocused] = useDelayReset();
    const focus = () => {
      var _a;
      (_a = selectorRef.value) === null || _a === void 0 ? void 0 : _a.focus();
    };
    const blur = () => {
      var _a;
      (_a = selectorRef.value) === null || _a === void 0 ? void 0 : _a.blur();
    };
    expose({
      focus,
      blur,
      scrollTo: arg => {
        var _a;
        return (_a = listRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo(arg);
      }
    });
    const mergedSearchValue = computed(() => {
      var _a;
      if (props.mode !== 'combobox') {
        return props.searchValue;
      }
      const val = (_a = props.displayValues[0]) === null || _a === void 0 ? void 0 : _a.value;
      return typeof val === 'string' || typeof val === 'number' ? String(val) : '';
    });
    // ============================== Open ==============================
    const initOpen = props.open !== undefined ? props.open : props.defaultOpen;
    const innerOpen = shallowRef(initOpen);
    const mergedOpen = shallowRef(initOpen);
    const setInnerOpen = val => {
      innerOpen.value = props.open !== undefined ? props.open : val;
      mergedOpen.value = innerOpen.value;
    };
    watch(() => props.open, () => {
      setInnerOpen(props.open);
    });
    // Not trigger `open` in `combobox` when `notFoundContent` is empty
    const emptyListContent = computed(() => !props.notFoundContent && props.emptyOptions);
    watchEffect(() => {
      mergedOpen.value = innerOpen.value;
      if (props.disabled || emptyListContent.value && mergedOpen.value && props.mode === 'combobox') {
        mergedOpen.value = false;
      }
    });
    const triggerOpen = computed(() => emptyListContent.value ? false : mergedOpen.value);
    const onToggleOpen = newOpen => {
      const nextOpen = newOpen !== undefined ? newOpen : !mergedOpen.value;
      if (mergedOpen.value !== nextOpen && !props.disabled) {
        setInnerOpen(nextOpen);
        props.onDropdownVisibleChange && props.onDropdownVisibleChange(nextOpen);
        if (!nextOpen && popupFocused.value) {
          popupFocused.value = false;
          setMockFocused(false, () => {
            focusRef.value = false;
            blurRef.value = false;
          });
        }
      }
    };
    const tokenWithEnter = computed(() => (props.tokenSeparators || []).some(tokenSeparator => ['\n', '\r\n'].includes(tokenSeparator)));
    const onInternalSearch = (searchText, fromTyping, isCompositing) => {
      var _a, _b;
      let ret = true;
      let newSearchText = searchText;
      (_a = props.onActiveValueChange) === null || _a === void 0 ? void 0 : _a.call(props, null);
      // Check if match the `tokenSeparators`
      const patchLabels = isCompositing ? null : getSeparatedContent(searchText, props.tokenSeparators);
      // Ignore combobox since it's not split-able
      if (props.mode !== 'combobox' && patchLabels) {
        newSearchText = '';
        (_b = props.onSearchSplit) === null || _b === void 0 ? void 0 : _b.call(props, patchLabels);
        // Should close when paste finish
        onToggleOpen(false);
        // Tell Selector that break next actions
        ret = false;
      }
      if (props.onSearch && mergedSearchValue.value !== newSearchText) {
        props.onSearch(newSearchText, {
          source: fromTyping ? 'typing' : 'effect'
        });
      }
      return ret;
    };
    // Only triggered when menu is closed & mode is tags
    // If menu is open, OptionList will take charge
    // If mode isn't tags, press enter is not meaningful when you can't see any option
    const onInternalSearchSubmit = searchText => {
      var _a;
      // prevent empty tags from appearing when you click the Enter button
      if (!searchText || !searchText.trim()) {
        return;
      }
      (_a = props.onSearch) === null || _a === void 0 ? void 0 : _a.call(props, searchText, {
        source: 'submit'
      });
    };
    // Close will clean up single mode search text
    watch(mergedOpen, () => {
      if (!mergedOpen.value && !multiple.value && props.mode !== 'combobox') {
        onInternalSearch('', false, false);
      }
    }, {
      immediate: true,
      flush: 'post'
    });
    // ============================ Disabled ============================
    // Close dropdown & remove focus state when disabled change
    watch(() => props.disabled, () => {
      if (innerOpen.value && !!props.disabled) {
        setInnerOpen(false);
      }
      if (props.disabled && !blurRef.value) {
        setMockFocused(false);
      }
    }, {
      immediate: true
    });
    // ============================ Keyboard ============================
    /**
     * We record input value here to check if can press to clean up by backspace
     * - null: Key is not down, this is reset by key up
     * - true: Search text is empty when first time backspace down
     * - false: Search text is not empty when first time backspace down
     */
    const [getClearLock, setClearLock] = useLock();
    // KeyDown
    const onInternalKeyDown = function (event) {
      var _a;
      const clearLock = getClearLock();
      const {
        which
      } = event;
      if (which === KeyCode.ENTER) {
        // Do not submit form when type in the input
        if (props.mode !== 'combobox') {
          event.preventDefault();
        }
        // We only manage open state here, close logic should handle by list component
        if (!mergedOpen.value) {
          onToggleOpen(true);
        }
      }
      setClearLock(!!mergedSearchValue.value);
      // Remove value by `backspace`
      if (which === KeyCode.BACKSPACE && !clearLock && multiple.value && !mergedSearchValue.value && props.displayValues.length) {
        const cloneDisplayValues = [...props.displayValues];
        let removedDisplayValue = null;
        for (let i = cloneDisplayValues.length - 1; i >= 0; i -= 1) {
          const current = cloneDisplayValues[i];
          if (!current.disabled) {
            cloneDisplayValues.splice(i, 1);
            removedDisplayValue = current;
            break;
          }
        }
        if (removedDisplayValue) {
          props.onDisplayValuesChange(cloneDisplayValues, {
            type: 'remove',
            values: [removedDisplayValue]
          });
        }
      }
      for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
      }
      if (mergedOpen.value && listRef.value) {
        listRef.value.onKeydown(event, ...rest);
      }
      (_a = props.onKeydown) === null || _a === void 0 ? void 0 : _a.call(props, event, ...rest);
    };
    // KeyUp
    const onInternalKeyUp = function (event) {
      for (var _len2 = arguments.length, rest = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        rest[_key2 - 1] = arguments[_key2];
      }
      if (mergedOpen.value && listRef.value) {
        listRef.value.onKeyup(event, ...rest);
      }
      if (props.onKeyup) {
        props.onKeyup(event, ...rest);
      }
    };
    // ============================ Selector ============================
    const onSelectorRemove = val => {
      const newValues = props.displayValues.filter(i => i !== val);
      props.onDisplayValuesChange(newValues, {
        type: 'remove',
        values: [val]
      });
    };
    // ========================== Focus / Blur ==========================
    /** Record real focus status */
    const focusRef = shallowRef(false);
    const onContainerFocus = function () {
      setMockFocused(true);
      if (!props.disabled) {
        if (props.onFocus && !focusRef.value) {
          props.onFocus(...arguments);
        }
        // `showAction` should handle `focus` if set
        if (props.showAction && props.showAction.includes('focus')) {
          onToggleOpen(true);
        }
      }
      focusRef.value = true;
    };
    const popupFocused = ref(false);
    const onContainerBlur = function () {
      if (popupFocused.value) {
        return;
      }
      blurRef.value = true;
      setMockFocused(false, () => {
        focusRef.value = false;
        blurRef.value = false;
        onToggleOpen(false);
      });
      if (props.disabled) {
        return;
      }
      const searchVal = mergedSearchValue.value;
      if (searchVal) {
        // `tags` mode should move `searchValue` into values
        if (props.mode === 'tags') {
          props.onSearch(searchVal, {
            source: 'submit'
          });
        } else if (props.mode === 'multiple') {
          // `multiple` mode only clean the search value but not trigger event
          props.onSearch('', {
            source: 'blur'
          });
        }
      }
      if (props.onBlur) {
        props.onBlur(...arguments);
      }
    };
    const onPopupFocusin = () => {
      popupFocused.value = true;
    };
    const onPopupFocusout = () => {
      popupFocused.value = false;
    };
    provide('VCSelectContainerEvent', {
      focus: onContainerFocus,
      blur: onContainerBlur
    });
    // Give focus back of Select
    const activeTimeoutIds = [];
    onMounted(() => {
      activeTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      activeTimeoutIds.splice(0, activeTimeoutIds.length);
    });
    onBeforeUnmount(() => {
      activeTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      activeTimeoutIds.splice(0, activeTimeoutIds.length);
    });
    const onInternalMouseDown = function (event) {
      var _a, _b;
      const {
        target
      } = event;
      const popupElement = (_a = triggerRef.value) === null || _a === void 0 ? void 0 : _a.getPopupElement();
      // We should give focus back to selector if clicked item is not focusable
      if (popupElement && popupElement.contains(target)) {
        const timeoutId = setTimeout(() => {
          var _a;
          const index = activeTimeoutIds.indexOf(timeoutId);
          if (index !== -1) {
            activeTimeoutIds.splice(index, 1);
          }
          cancelSetMockFocused();
          if (!mobile.value && !popupElement.contains(document.activeElement)) {
            (_a = selectorRef.value) === null || _a === void 0 ? void 0 : _a.focus();
          }
        });
        activeTimeoutIds.push(timeoutId);
      }
      for (var _len3 = arguments.length, restArgs = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        restArgs[_key3 - 1] = arguments[_key3];
      }
      (_b = props.onMousedown) === null || _b === void 0 ? void 0 : _b.call(props, event, ...restArgs);
    };
    // ============================= Dropdown ==============================
    const containerWidth = shallowRef(null);
    // const instance = getCurrentInstance();
    const onPopupMouseEnter = () => {
      // We need force update here since popup dom is render async
      // instance.update();
    };
    onMounted(() => {
      watch(triggerOpen, () => {
        var _a;
        if (triggerOpen.value) {
          const newWidth = Math.ceil((_a = containerRef.value) === null || _a === void 0 ? void 0 : _a.offsetWidth);
          if (containerWidth.value !== newWidth && !Number.isNaN(newWidth)) {
            containerWidth.value = newWidth;
          }
        }
      }, {
        immediate: true,
        flush: 'post'
      });
    });
    // Close when click on non-select element
    useSelectTriggerControl([containerRef, triggerRef], triggerOpen, onToggleOpen);
    useProvideBaseSelectProps(toReactive(_extends(_extends({}, toRefs(props)), {
      open: mergedOpen,
      triggerOpen,
      showSearch: mergedShowSearch,
      multiple,
      toggleOpen: onToggleOpen
    })));
    return () => {
      const _a = _extends(_extends({}, props), attrs),
        {
          prefixCls,
          id,
          open,
          defaultOpen,
          mode,
          // Search related
          showSearch,
          searchValue,
          onSearch,
          // Icons
          allowClear,
          clearIcon,
          showArrow,
          inputIcon,
          // Others
          disabled,
          loading,
          getInputElement,
          getPopupContainer,
          placement,
          // Dropdown
          animation,
          transitionName,
          dropdownStyle,
          dropdownClassName,
          dropdownMatchSelectWidth,
          dropdownRender,
          dropdownAlign,
          showAction,
          direction,
          // Tags
          tokenSeparators,
          tagRender,
          optionLabelRender,
          // Events
          onPopupScroll,
          onDropdownVisibleChange,
          onFocus,
          onBlur,
          onKeyup,
          onKeydown,
          onMousedown,
          onClear,
          omitDomProps,
          getRawInputElement,
          displayValues,
          onDisplayValuesChange,
          emptyOptions,
          activeDescendantId,
          activeValue,
          OptionList
        } = _a,
        restProps = __rest$b(_a, ["prefixCls", "id", "open", "defaultOpen", "mode", "showSearch", "searchValue", "onSearch", "allowClear", "clearIcon", "showArrow", "inputIcon", "disabled", "loading", "getInputElement", "getPopupContainer", "placement", "animation", "transitionName", "dropdownStyle", "dropdownClassName", "dropdownMatchSelectWidth", "dropdownRender", "dropdownAlign", "showAction", "direction", "tokenSeparators", "tagRender", "optionLabelRender", "onPopupScroll", "onDropdownVisibleChange", "onFocus", "onBlur", "onKeyup", "onKeydown", "onMousedown", "onClear", "omitDomProps", "getRawInputElement", "displayValues", "onDisplayValuesChange", "emptyOptions", "activeDescendantId", "activeValue", "OptionList"]);
      // ============================= Input ==============================
      // Only works in `combobox`
      const customizeInputElement = mode === 'combobox' && getInputElement && getInputElement() || null;
      // Used for customize replacement for `vc-cascader`
      const customizeRawInputElement = typeof getRawInputElement === 'function' && getRawInputElement();
      const domProps = _extends({}, restProps);
      // Used for raw custom input trigger
      let onTriggerVisibleChange;
      if (customizeRawInputElement) {
        onTriggerVisibleChange = newOpen => {
          onToggleOpen(newOpen);
        };
      }
      DEFAULT_OMIT_PROPS.forEach(propName => {
        delete domProps[propName];
      });
      omitDomProps === null || omitDomProps === void 0 ? void 0 : omitDomProps.forEach(propName => {
        delete domProps[propName];
      });
      // ============================= Arrow ==============================
      const mergedShowArrow = showArrow !== undefined ? showArrow : loading || !multiple.value && mode !== 'combobox';
      let arrowNode;
      if (mergedShowArrow) {
        arrowNode = createVNode(TransBtn, {
          "class": classNames(`${prefixCls}-arrow`, {
            [`${prefixCls}-arrow-loading`]: loading
          }),
          "customizeIcon": inputIcon,
          "customizeIconProps": {
            loading,
            searchValue: mergedSearchValue.value,
            open: mergedOpen.value,
            focused: mockFocused.value,
            showSearch: mergedShowSearch.value
          }
        }, null);
      }
      // ============================= Clear ==============================
      let clearNode;
      const onClearMouseDown = () => {
        onClear === null || onClear === void 0 ? void 0 : onClear();
        onDisplayValuesChange([], {
          type: 'clear',
          values: displayValues
        });
        onInternalSearch('', false, false);
      };
      if (!disabled && allowClear && (displayValues.length || mergedSearchValue.value)) {
        clearNode = createVNode(TransBtn, {
          "class": `${prefixCls}-clear`,
          "onMousedown": onClearMouseDown,
          "customizeIcon": clearIcon
        }, {
          default: () => [createTextVNode("\xD7")]
        });
      }
      // =========================== OptionList ===========================
      const optionList = createVNode(OptionList, {
        "ref": listRef
      }, _extends(_extends({}, legacyTreeSelectContext.customSlots), {
        option: slots.option
      }));
      // ============================= Select =============================
      const mergedClassName = classNames(prefixCls, attrs.class, {
        [`${prefixCls}-focused`]: mockFocused.value,
        [`${prefixCls}-multiple`]: multiple.value,
        [`${prefixCls}-single`]: !multiple.value,
        [`${prefixCls}-allow-clear`]: allowClear,
        [`${prefixCls}-show-arrow`]: mergedShowArrow,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-loading`]: loading,
        [`${prefixCls}-open`]: mergedOpen.value,
        [`${prefixCls}-customize-input`]: customizeInputElement,
        [`${prefixCls}-show-search`]: mergedShowSearch.value
      });
      // >>> Selector
      const selectorNode = createVNode(SelectTrigger, {
        "ref": triggerRef,
        "disabled": disabled,
        "prefixCls": prefixCls,
        "visible": triggerOpen.value,
        "popupElement": optionList,
        "containerWidth": containerWidth.value,
        "animation": animation,
        "transitionName": transitionName,
        "dropdownStyle": dropdownStyle,
        "dropdownClassName": dropdownClassName,
        "direction": direction,
        "dropdownMatchSelectWidth": dropdownMatchSelectWidth,
        "dropdownRender": dropdownRender,
        "dropdownAlign": dropdownAlign,
        "placement": placement,
        "getPopupContainer": getPopupContainer,
        "empty": emptyOptions,
        "getTriggerDOMNode": () => selectorDomRef.current,
        "onPopupVisibleChange": onTriggerVisibleChange,
        "onPopupMouseEnter": onPopupMouseEnter,
        "onPopupFocusin": onPopupFocusin,
        "onPopupFocusout": onPopupFocusout
      }, {
        default: () => {
          return customizeRawInputElement ? isValidElement(customizeRawInputElement) && cloneElement(customizeRawInputElement, {
            ref: selectorDomRef
          }, false, true) : createVNode(Selector, _objectSpread$5(_objectSpread$5({}, props), {}, {
            "domRef": selectorDomRef,
            "prefixCls": prefixCls,
            "inputElement": customizeInputElement,
            "ref": selectorRef,
            "id": id,
            "showSearch": mergedShowSearch.value,
            "mode": mode,
            "activeDescendantId": activeDescendantId,
            "tagRender": tagRender,
            "optionLabelRender": optionLabelRender,
            "values": displayValues,
            "open": mergedOpen.value,
            "onToggleOpen": onToggleOpen,
            "activeValue": activeValue,
            "searchValue": mergedSearchValue.value,
            "onSearch": onInternalSearch,
            "onSearchSubmit": onInternalSearchSubmit,
            "onRemove": onSelectorRemove,
            "tokenWithEnter": tokenWithEnter.value
          }), null);
        }
      });
      // >>> Render
      let renderNode;
      // Render raw
      if (customizeRawInputElement) {
        renderNode = selectorNode;
      } else {
        renderNode = createVNode("div", _objectSpread$5(_objectSpread$5({}, domProps), {}, {
          "class": mergedClassName,
          "ref": containerRef,
          "onMousedown": onInternalMouseDown,
          "onKeydown": onInternalKeyDown,
          "onKeyup": onInternalKeyUp
        }), [mockFocused.value && !mergedOpen.value && createVNode("span", {
          "style": {
            width: 0,
            height: 0,
            position: 'absolute',
            overflow: 'hidden',
            opacity: 0
          },
          "aria-live": "polite"
        }, [`${displayValues.map(_ref2 => {
          let {
            label,
            value
          } = _ref2;
          return ['number', 'string'].includes(typeof label) ? label : value;
        }).join(', ')}`]), selectorNode, arrowNode, clearNode]);
      }
      return renderNode;
    };
  }
});

function useMemo(getValue, condition, shouldUpdate) {
  const cacheRef = ref(getValue());
  watch(condition, (next, pre) => {
    if (shouldUpdate) {
      if (shouldUpdate(next, pre)) {
        cacheRef.value = getValue();
      }
    } else {
      cacheRef.value = getValue();
    }
  });
  return cacheRef;
}

/* istanbul ignore file */
function isPlatformMac() {
  return /(mac\sos|macintosh)/i.test(navigator.appVersion);
}

/**
 * BaseSelect provide some parsed data into context.
 * You can use this hooks to get them.
 */
const SelectContextKey = Symbol('SelectContextKey');
function useProvideSelectProps(props) {
  return provide(SelectContextKey, props);
}
function useSelectProps() {
  return inject(SelectContextKey, {});
}

var __rest$a = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function isTitleType(content) {
  return typeof content === 'string' || typeof content === 'number';
}
/**
 * Using virtual list of option display.
 * Will fallback to dom if use customize render.
 */
const OptionList = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'OptionList',
  inheritAttrs: false,
  setup(_, _ref) {
    let {
      expose,
      slots
    } = _ref;
    const baseProps = useBaseProps();
    const props = useSelectProps();
    const itemPrefixCls = computed(() => `${baseProps.prefixCls}-item`);
    const memoFlattenOptions = useMemo(() => props.flattenOptions, [() => baseProps.open, () => props.flattenOptions], next => next[0]);
    // =========================== List ===========================
    const listRef = createRef();
    const onListMouseDown = event => {
      event.preventDefault();
    };
    const scrollIntoView = args => {
      if (listRef.current) {
        listRef.current.scrollTo(typeof args === 'number' ? {
          index: args
        } : args);
      }
    };
    // ========================== Active ==========================
    const getEnabledActiveIndex = function (index) {
      let offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      const len = memoFlattenOptions.value.length;
      for (let i = 0; i < len; i += 1) {
        const current = (index + i * offset + len) % len;
        const {
          group,
          data
        } = memoFlattenOptions.value[current];
        if (!group && !data.disabled) {
          return current;
        }
      }
      return -1;
    };
    const state = reactive({
      activeIndex: getEnabledActiveIndex(0)
    });
    const setActive = function (index) {
      let fromKeyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      state.activeIndex = index;
      const info = {
        source: fromKeyboard ? 'keyboard' : 'mouse'
      };
      // Trigger active event
      const flattenItem = memoFlattenOptions.value[index];
      if (!flattenItem) {
        props.onActiveValue(null, -1, info);
        return;
      }
      props.onActiveValue(flattenItem.value, index, info);
    };
    // Auto active first item when list length or searchValue changed
    watch([() => memoFlattenOptions.value.length, () => baseProps.searchValue], () => {
      setActive(props.defaultActiveFirstOption !== false ? getEnabledActiveIndex(0) : -1);
    }, {
      immediate: true
    });
    // https://github.com/ant-design/ant-design/issues/34975
    const isSelected = value => props.rawValues.has(value) && baseProps.mode !== 'combobox';
    // Auto scroll to item position in single mode
    watch([() => baseProps.open, () => baseProps.searchValue], () => {
      if (!baseProps.multiple && baseProps.open && props.rawValues.size === 1) {
        const value = Array.from(props.rawValues)[0];
        const index = toRaw(memoFlattenOptions.value).findIndex(_ref2 => {
          let {
            data
          } = _ref2;
          return data[props.fieldNames.value] === value;
        });
        if (index !== -1) {
          setActive(index);
          nextTick(() => {
            scrollIntoView(index);
          });
        }
      }
      // Force trigger scrollbar visible when open
      if (baseProps.open) {
        nextTick(() => {
          var _a;
          (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo(undefined);
        });
      }
    }, {
      immediate: true,
      flush: 'post'
    });
    // ========================== Values ==========================
    const onSelectValue = value => {
      if (value !== undefined) {
        props.onSelect(value, {
          selected: !props.rawValues.has(value)
        });
      }
      // Single mode should always close by select
      if (!baseProps.multiple) {
        baseProps.toggleOpen(false);
      }
    };
    const getLabel = item => typeof item.label === 'function' ? item.label() : item.label;
    function renderItem(index) {
      const item = memoFlattenOptions.value[index];
      if (!item) return null;
      const itemData = item.data || {};
      const {
        value
      } = itemData;
      const {
        group
      } = item;
      const attrs = pickAttrs(itemData, true);
      const mergedLabel = getLabel(item);
      return item ? createVNode("div", _objectSpread$5(_objectSpread$5({
        "aria-label": typeof mergedLabel === 'string' && !group ? mergedLabel : null
      }, attrs), {}, {
        "key": index,
        "role": group ? 'presentation' : 'option',
        "id": `${baseProps.id}_list_${index}`,
        "aria-selected": isSelected(value)
      }), [value]) : null;
    }
    const onKeydown = event => {
      const {
        which,
        ctrlKey
      } = event;
      switch (which) {
        // >>> Arrow keys & ctrl + n/p on Mac
        case KeyCode.N:
        case KeyCode.P:
        case KeyCode.UP:
        case KeyCode.DOWN:
          {
            let offset = 0;
            if (which === KeyCode.UP) {
              offset = -1;
            } else if (which === KeyCode.DOWN) {
              offset = 1;
            } else if (isPlatformMac() && ctrlKey) {
              if (which === KeyCode.N) {
                offset = 1;
              } else if (which === KeyCode.P) {
                offset = -1;
              }
            }
            if (offset !== 0) {
              const nextActiveIndex = getEnabledActiveIndex(state.activeIndex + offset, offset);
              scrollIntoView(nextActiveIndex);
              setActive(nextActiveIndex, true);
            }
            break;
          }
        // >>> Select
        case KeyCode.ENTER:
          {
            // value
            const item = memoFlattenOptions.value[state.activeIndex];
            if (item && !item.data.disabled) {
              onSelectValue(item.value);
            } else {
              onSelectValue(undefined);
            }
            if (baseProps.open) {
              event.preventDefault();
            }
            break;
          }
        // >>> Close
        case KeyCode.ESC:
          {
            baseProps.toggleOpen(false);
            if (baseProps.open) {
              event.stopPropagation();
            }
          }
      }
    };
    const onKeyup = () => {};
    const scrollTo = index => {
      scrollIntoView(index);
    };
    expose({
      onKeydown,
      onKeyup,
      scrollTo
    });
    return () => {
      // const {
      //   renderItem,
      //   listRef,
      //   onListMouseDown,
      //   itemPrefixCls,
      //   setActive,
      //   onSelectValue,
      //   memoFlattenOptions,
      //   $slots,
      // } = this as any;
      const {
        id,
        notFoundContent,
        onPopupScroll
      } = baseProps;
      const {
        menuItemSelectedIcon,
        fieldNames,
        virtual,
        listHeight,
        listItemHeight
      } = props;
      const renderOption = slots.option;
      const {
        activeIndex
      } = state;
      const omitFieldNameList = Object.keys(fieldNames).map(key => fieldNames[key]);
      // ========================== Render ==========================
      if (memoFlattenOptions.value.length === 0) {
        return createVNode("div", {
          "role": "listbox",
          "id": `${id}_list`,
          "class": `${itemPrefixCls.value}-empty`,
          "onMousedown": onListMouseDown
        }, [notFoundContent]);
      }
      return createVNode(Fragment, null, [createVNode("div", {
        "role": "listbox",
        "id": `${id}_list`,
        "style": {
          height: 0,
          width: 0,
          overflow: 'hidden'
        }
      }, [renderItem(activeIndex - 1), renderItem(activeIndex), renderItem(activeIndex + 1)]), createVNode(List, {
        "itemKey": "key",
        "ref": listRef,
        "data": memoFlattenOptions.value,
        "height": listHeight,
        "itemHeight": listItemHeight,
        "fullHeight": false,
        "onMousedown": onListMouseDown,
        "onScroll": onPopupScroll,
        "virtual": virtual
      }, {
        default: (item, itemIndex) => {
          var _a;
          const {
            group,
            groupOption,
            data,
            value
          } = item;
          const {
            key
          } = data;
          const label = typeof item.label === 'function' ? item.label() : item.label;
          // Group
          if (group) {
            const groupTitle = (_a = data.title) !== null && _a !== void 0 ? _a : isTitleType(label) && label;
            return createVNode("div", {
              "class": classNames(itemPrefixCls.value, `${itemPrefixCls.value}-group`),
              "title": groupTitle
            }, [renderOption ? renderOption(data) : label !== undefined ? label : key]);
          }
          const {
              disabled,
              title,
              children,
              style,
              class: cls,
              className
            } = data,
            otherProps = __rest$a(data, ["disabled", "title", "children", "style", "class", "className"]);
          const passedProps = omit(otherProps, omitFieldNameList);
          // Option
          const selected = isSelected(value);
          const optionPrefixCls = `${itemPrefixCls.value}-option`;
          const optionClassName = classNames(itemPrefixCls.value, optionPrefixCls, cls, className, {
            [`${optionPrefixCls}-grouped`]: groupOption,
            [`${optionPrefixCls}-active`]: activeIndex === itemIndex && !disabled,
            [`${optionPrefixCls}-disabled`]: disabled,
            [`${optionPrefixCls}-selected`]: selected
          });
          const mergedLabel = getLabel(item);
          const iconVisible = !menuItemSelectedIcon || typeof menuItemSelectedIcon === 'function' || selected;
          // https://github.com/ant-design/ant-design/issues/34145
          const content = typeof mergedLabel === 'number' ? mergedLabel : mergedLabel || value;
          // https://github.com/ant-design/ant-design/issues/26717
          let optionTitle = isTitleType(content) ? content.toString() : undefined;
          if (title !== undefined) {
            optionTitle = title;
          }
          return createVNode("div", _objectSpread$5(_objectSpread$5({}, passedProps), {}, {
            "aria-selected": selected,
            "class": optionClassName,
            "title": optionTitle,
            "onMousemove": e => {
              if (otherProps.onMousemove) {
                otherProps.onMousemove(e);
              }
              if (activeIndex === itemIndex || disabled) {
                return;
              }
              setActive(itemIndex);
            },
            "onClick": e => {
              if (!disabled) {
                onSelectValue(value);
              }
              if (otherProps.onClick) {
                otherProps.onClick(e);
              }
            },
            "style": style
          }), [createVNode("div", {
            "class": `${optionPrefixCls}-content`
          }, [renderOption ? renderOption(data) : content]), isValidElement(menuItemSelectedIcon) || selected, iconVisible && createVNode(TransBtn, {
            "class": `${itemPrefixCls.value}-option-state`,
            "customizeIcon": menuItemSelectedIcon,
            "customizeIconProps": {
              isSelected: selected
            }
          }, {
            default: () => [selected ? '✓' : null]
          })]);
        }
      })]);
    };
  }
});

var __rest$9 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function convertNodeToOption(node) {
  const _a = node,
    {
      key,
      children
    } = _a,
    _b = _a.props,
    {
      value,
      disabled
    } = _b,
    restProps = __rest$9(_b, ["value", "disabled"]);
  const child = children === null || children === void 0 ? void 0 : children.default;
  return _extends({
    key,
    value: value !== undefined ? value : key,
    children: child,
    disabled: disabled || disabled === ''
  }, restProps);
}
function convertChildrenToData(nodes) {
  let optionOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const dd = flattenChildren(nodes).map((node, index) => {
    var _a;
    if (!isValidElement(node) || !node.type) {
      return null;
    }
    const {
      type: {
        isSelectOptGroup
      },
      key,
      children,
      props
    } = node;
    if (optionOnly || !isSelectOptGroup) {
      return convertNodeToOption(node);
    }
    const child = children && children.default ? children.default() : undefined;
    const label = (props === null || props === void 0 ? void 0 : props.label) || ((_a = children.label) === null || _a === void 0 ? void 0 : _a.call(children)) || key;
    return _extends(_extends({
      key: `__RC_SELECT_GRP__${key === null ? index : String(key)}__`
    }, props), {
      label,
      options: convertChildrenToData(child || [])
    });
  }).filter(data => data);
  return dd;
}

/**
 * Parse `children` to `options` if `options` is not provided.
 * Then flatten the `options`.
 */
function useOptions(options, children, fieldNames) {
  const mergedOptions = shallowRef();
  const valueOptions = shallowRef();
  const labelOptions = shallowRef();
  const tempMergedOptions = shallowRef([]);
  watch([options, children], () => {
    if (options.value) {
      tempMergedOptions.value = toRaw(options.value).slice();
    } else {
      tempMergedOptions.value = convertChildrenToData(children.value);
    }
  }, {
    immediate: true,
    deep: true
  });
  watchEffect(() => {
    const newOptions = tempMergedOptions.value;
    const newValueOptions = new Map();
    const newLabelOptions = new Map();
    const fieldNamesValue = fieldNames.value;
    function dig(optionList) {
      let isChildren = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // for loop to speed up collection speed
      for (let i = 0; i < optionList.length; i += 1) {
        const option = optionList[i];
        if (!option[fieldNamesValue.options] || isChildren) {
          newValueOptions.set(option[fieldNamesValue.value], option);
          newLabelOptions.set(option[fieldNamesValue.label], option);
        } else {
          dig(option[fieldNamesValue.options], true);
        }
      }
    }
    dig(newOptions);
    mergedOptions.value = newOptions;
    valueOptions.value = newValueOptions;
    labelOptions.value = newLabelOptions;
  });
  return {
    options: mergedOptions,
    valueOptions,
    labelOptions
  };
}

/** Get unique id for accessibility usage */
function getUUID() {
  let retId;
  // Test never reach
  /* istanbul ignore if */
  {
    retId = 'TEST_OR_SSR';
  }
  return retId;
}
function useId() {
  let id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ref('');
  // Inner id for accessibility usage. Only work in client side
  const innerId = `rc_select_${getUUID()}`;
  return id.value || innerId;
}

function toArray$1(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value !== undefined ? [value] : [];
}

function includes(test, search) {
  return toArray$1(test).join('').toUpperCase().includes(search);
}
const useFilterOptions = ((options, fieldNames, searchValue, filterOption, optionFilterProp) => computed(() => {
  const searchValueVal = searchValue.value;
  const optionFilterPropValue = optionFilterProp === null || optionFilterProp === void 0 ? void 0 : optionFilterProp.value;
  const filterOptionValue = filterOption === null || filterOption === void 0 ? void 0 : filterOption.value;
  if (!searchValueVal || filterOptionValue === false) {
    return options.value;
  }
  const {
    options: fieldOptions,
    label: fieldLabel,
    value: fieldValue
  } = fieldNames.value;
  const filteredOptions = [];
  const customizeFilter = typeof filterOptionValue === 'function';
  const upperSearch = searchValueVal.toUpperCase();
  const filterFunc = customizeFilter ? filterOptionValue : (_, option) => {
    // Use provided `optionFilterProp`
    if (optionFilterPropValue) {
      return includes(option[optionFilterPropValue], upperSearch);
    }
    // Auto select `label` or `value` by option type
    if (option[fieldOptions]) {
      // hack `fieldLabel` since `OptionGroup` children is not `label`
      return includes(option[fieldLabel !== 'children' ? fieldLabel : 'label'], upperSearch);
    }
    return includes(option[fieldValue], upperSearch);
  };
  const wrapOption = customizeFilter ? opt => injectPropsWithOption(opt) : opt => opt;
  options.value.forEach(item => {
    // Group should check child options
    if (item[fieldOptions]) {
      // Check group first
      const matchGroup = filterFunc(searchValueVal, wrapOption(item));
      if (matchGroup) {
        filteredOptions.push(item);
      } else {
        // Check option
        const subOptions = item[fieldOptions].filter(subItem => filterFunc(searchValueVal, wrapOption(subItem)));
        if (subOptions.length) {
          filteredOptions.push(_extends(_extends({}, item), {
            [fieldOptions]: subOptions
          }));
        }
      }
      return;
    }
    if (filterFunc(searchValueVal, wrapOption(item))) {
      filteredOptions.push(item);
    }
  });
  return filteredOptions;
}));

/**
 * Cache `value` related LabeledValue & options.
 */
const useCache = ((labeledValues, valueOptions) => {
  const cacheRef = shallowRef({
    values: new Map(),
    options: new Map()
  });
  const filledLabeledValues = computed(() => {
    const {
      values: prevValueCache,
      options: prevOptionCache
    } = cacheRef.value;
    // Fill label by cache
    const patchedValues = labeledValues.value.map(item => {
      var _a;
      if (item.label === undefined) {
        return _extends(_extends({}, item), {
          label: (_a = prevValueCache.get(item.value)) === null || _a === void 0 ? void 0 : _a.label
        });
      }
      return item;
    });
    // Refresh cache
    const valueCache = new Map();
    const optionCache = new Map();
    patchedValues.forEach(item => {
      valueCache.set(item.value, item);
      optionCache.set(item.value, valueOptions.value.get(item.value) || prevOptionCache.get(item.value));
    });
    cacheRef.value.values = valueCache;
    cacheRef.value.options = optionCache;
    return patchedValues;
  });
  const getOption = val => valueOptions.value.get(val) || cacheRef.value.options.get(val);
  return [filledLabeledValues, getOption];
});

const OMIT_DOM_PROPS = ['inputValue'];
function selectProps$1() {
  return _extends(_extends({}, baseSelectPropsWithoutPrivate()), {
    prefixCls: String,
    id: String,
    backfill: {
      type: Boolean,
      default: undefined
    },
    // >>> Field Names
    fieldNames: Object,
    // >>> Search
    /** @deprecated Use `searchValue` instead */
    inputValue: String,
    searchValue: String,
    onSearch: Function,
    autoClearSearchValue: {
      type: Boolean,
      default: undefined
    },
    // >>> Select
    onSelect: Function,
    onDeselect: Function,
    // >>> Options
    /**
     * In Select, `false` means do nothing.
     * In TreeSelect, `false` will highlight match item.
     * It's by design.
     */
    filterOption: {
      type: [Boolean, Function],
      default: undefined
    },
    filterSort: Function,
    optionFilterProp: String,
    optionLabelProp: String,
    options: Array,
    defaultActiveFirstOption: {
      type: Boolean,
      default: undefined
    },
    virtual: {
      type: Boolean,
      default: undefined
    },
    listHeight: Number,
    listItemHeight: Number,
    // >>> Icon
    menuItemSelectedIcon: PropTypes.any,
    mode: String,
    labelInValue: {
      type: Boolean,
      default: undefined
    },
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    onChange: Function,
    children: Array
  });
}
function isRawValue(value) {
  return !value || typeof value !== 'object';
}
const Select$1 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'VcSelect',
  inheritAttrs: false,
  props: initDefaultProps(selectProps$1(), {
    prefixCls: 'vc-select',
    autoClearSearchValue: true,
    listHeight: 200,
    listItemHeight: 20,
    dropdownMatchSelectWidth: true
  }),
  setup(props, _ref) {
    let {
      expose,
      attrs,
      slots
    } = _ref;
    const mergedId = useId(toRef(props, 'id'));
    const multiple = computed(() => isMultiple(props.mode));
    const childrenAsData = computed(() => !!(!props.options && props.children));
    const mergedFilterOption = computed(() => {
      if (props.filterOption === undefined && props.mode === 'combobox') {
        return false;
      }
      return props.filterOption;
    });
    // ========================= FieldNames =========================
    const mergedFieldNames = computed(() => fillFieldNames(props.fieldNames, childrenAsData.value));
    // =========================== Search ===========================
    const [mergedSearchValue, setSearchValue] = useMergedState('', {
      value: computed(() => props.searchValue !== undefined ? props.searchValue : props.inputValue),
      postState: search => search || ''
    });
    // =========================== Option ===========================
    const parsedOptions = useOptions(toRef(props, 'options'), toRef(props, 'children'), mergedFieldNames);
    const {
      valueOptions,
      labelOptions,
      options: mergedOptions
    } = parsedOptions;
    // ========================= Wrap Value =========================
    const convert2LabelValues = draftValues => {
      // Convert to array
      const valueList = toArray$1(draftValues);
      // Convert to labelInValue type
      return valueList.map(val => {
        var _a, _b;
        let rawValue;
        let rawLabel;
        let rawKey;
        let rawDisabled;
        // Fill label & value
        if (isRawValue(val)) {
          rawValue = val;
        } else {
          rawKey = val.key;
          rawLabel = val.label;
          rawValue = (_a = val.value) !== null && _a !== void 0 ? _a : rawKey;
        }
        const option = valueOptions.value.get(rawValue);
        if (option) {
          // Fill missing props
          if (rawLabel === undefined) rawLabel = option === null || option === void 0 ? void 0 : option[props.optionLabelProp || mergedFieldNames.value.label];
          if (rawKey === undefined) rawKey = (_b = option === null || option === void 0 ? void 0 : option.key) !== null && _b !== void 0 ? _b : rawValue;
          rawDisabled = option === null || option === void 0 ? void 0 : option.disabled;
          // Warning if label not same as provided
          // if ("production" !== 'production' && !isRawValue(val)) {
          //   const optionLabel = option?.[mergedFieldNames.value.label];
          //   if (optionLabel !== undefined && optionLabel !== rawLabel) {
          //     warning(false, '`label` of `value` is not same as `label` in Select options.');
          //   }
          // }
        }
        return {
          label: rawLabel,
          value: rawValue,
          key: rawKey,
          disabled: rawDisabled,
          option
        };
      });
    };
    // =========================== Values ===========================
    const [internalValue, setInternalValue] = useMergedState(props.defaultValue, {
      value: toRef(props, 'value')
    });
    // Merged value with LabelValueType
    const rawLabeledValues = computed(() => {
      var _a;
      const values = convert2LabelValues(internalValue.value);
      // combobox no need save value when it's empty
      if (props.mode === 'combobox' && !((_a = values[0]) === null || _a === void 0 ? void 0 : _a.value)) {
        return [];
      }
      return values;
    });
    // Fill label with cache to avoid option remove
    const [mergedValues, getMixedOption] = useCache(rawLabeledValues, valueOptions);
    const displayValues = computed(() => {
      // `null` need show as placeholder instead
      // https://github.com/ant-design/ant-design/issues/25057
      if (!props.mode && mergedValues.value.length === 1) {
        const firstValue = mergedValues.value[0];
        if (firstValue.value === null && (firstValue.label === null || firstValue.label === undefined)) {
          return [];
        }
      }
      return mergedValues.value.map(item => {
        var _a;
        return _extends(_extends({}, item), {
          label: (_a = typeof item.label === 'function' ? item.label() : item.label) !== null && _a !== void 0 ? _a : item.value
        });
      });
    });
    /** Convert `displayValues` to raw value type set */
    const rawValues = computed(() => new Set(mergedValues.value.map(val => val.value)));
    watchEffect(() => {
      var _a;
      if (props.mode === 'combobox') {
        const strValue = (_a = mergedValues.value[0]) === null || _a === void 0 ? void 0 : _a.value;
        if (strValue !== undefined && strValue !== null) {
          setSearchValue(String(strValue));
        }
      }
    }, {
      flush: 'post'
    });
    // ======================= Display Option =======================
    // Create a placeholder item if not exist in `options`
    const createTagOption = (val, label) => {
      const mergedLabel = label !== null && label !== void 0 ? label : val;
      return {
        [mergedFieldNames.value.value]: val,
        [mergedFieldNames.value.label]: mergedLabel
      };
    };
    // Fill tag as option if mode is `tags`
    const filledTagOptions = shallowRef();
    watchEffect(() => {
      if (props.mode !== 'tags') {
        filledTagOptions.value = mergedOptions.value;
        return;
      }
      // >>> Tag mode
      const cloneOptions = mergedOptions.value.slice();
      // Check if value exist in options (include new patch item)
      const existOptions = val => valueOptions.value.has(val);
      // Fill current value as option
      [...mergedValues.value].sort((a, b) => a.value < b.value ? -1 : 1).forEach(item => {
        const val = item.value;
        if (!existOptions(val)) {
          cloneOptions.push(createTagOption(val, item.label));
        }
      });
      filledTagOptions.value = cloneOptions;
    });
    const filteredOptions = useFilterOptions(filledTagOptions, mergedFieldNames, mergedSearchValue, mergedFilterOption, toRef(props, 'optionFilterProp'));
    // Fill options with search value if needed
    const filledSearchOptions = computed(() => {
      if (props.mode !== 'tags' || !mergedSearchValue.value || filteredOptions.value.some(item => item[props.optionFilterProp || 'value'] === mergedSearchValue.value)) {
        return filteredOptions.value;
      }
      // Fill search value as option
      return [createTagOption(mergedSearchValue.value), ...filteredOptions.value];
    });
    const orderedFilteredOptions = computed(() => {
      if (!props.filterSort) {
        return filledSearchOptions.value;
      }
      return [...filledSearchOptions.value].sort((a, b) => props.filterSort(a, b));
    });
    const displayOptions = computed(() => flattenOptions(orderedFilteredOptions.value, {
      fieldNames: mergedFieldNames.value,
      childrenAsData: childrenAsData.value
    }));
    // =========================== Change ===========================
    const triggerChange = values => {
      const labeledValues = convert2LabelValues(values);
      setInternalValue(labeledValues);
      if (props.onChange && (
      // Trigger event only when value changed
      labeledValues.length !== mergedValues.value.length || labeledValues.some((newVal, index) => {
        var _a;
        return ((_a = mergedValues.value[index]) === null || _a === void 0 ? void 0 : _a.value) !== (newVal === null || newVal === void 0 ? void 0 : newVal.value);
      }))) {
        const returnValues = props.labelInValue ? labeledValues.map(v => {
          return _extends(_extends({}, v), {
            originLabel: v.label,
            label: typeof v.label === 'function' ? v.label() : v.label
          });
        }) : labeledValues.map(v => v.value);
        const returnOptions = labeledValues.map(v => injectPropsWithOption(getMixedOption(v.value)));
        props.onChange(
        // Value
        multiple.value ? returnValues : returnValues[0],
        // Option
        multiple.value ? returnOptions : returnOptions[0]);
      }
    };
    // ======================= Accessibility ========================
    const [activeValue, setActiveValue] = useState(null);
    const [accessibilityIndex, setAccessibilityIndex] = useState(0);
    const mergedDefaultActiveFirstOption = computed(() => props.defaultActiveFirstOption !== undefined ? props.defaultActiveFirstOption : props.mode !== 'combobox');
    const onActiveValue = function (active, index) {
      let {
        source = 'keyboard'
      } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      setAccessibilityIndex(index);
      if (props.backfill && props.mode === 'combobox' && active !== null && source === 'keyboard') {
        setActiveValue(String(active));
      }
    };
    // ========================= OptionList =========================
    const triggerSelect = (val, selected) => {
      const getSelectEnt = () => {
        var _a;
        const option = getMixedOption(val);
        const originLabel = option === null || option === void 0 ? void 0 : option[mergedFieldNames.value.label];
        return [props.labelInValue ? {
          label: typeof originLabel === 'function' ? originLabel() : originLabel,
          originLabel,
          value: val,
          key: (_a = option === null || option === void 0 ? void 0 : option.key) !== null && _a !== void 0 ? _a : val
        } : val, injectPropsWithOption(option)];
      };
      if (selected && props.onSelect) {
        const [wrappedValue, option] = getSelectEnt();
        props.onSelect(wrappedValue, option);
      } else if (!selected && props.onDeselect) {
        const [wrappedValue, option] = getSelectEnt();
        props.onDeselect(wrappedValue, option);
      }
    };
    // Used for OptionList selection
    const onInternalSelect = (val, info) => {
      let cloneValues;
      // Single mode always trigger select only with option list
      const mergedSelect = multiple.value ? info.selected : true;
      if (mergedSelect) {
        cloneValues = multiple.value ? [...mergedValues.value, val] : [val];
      } else {
        cloneValues = mergedValues.value.filter(v => v.value !== val);
      }
      triggerChange(cloneValues);
      triggerSelect(val, mergedSelect);
      // Clean search value if single or configured
      if (props.mode === 'combobox') {
        // setSearchValue(String(val));
        setActiveValue('');
      } else if (!multiple.value || props.autoClearSearchValue) {
        setSearchValue('');
        setActiveValue('');
      }
    };
    // ======================= Display Change =======================
    // BaseSelect display values change
    const onDisplayValuesChange = (nextValues, info) => {
      triggerChange(nextValues);
      if (info.type === 'remove' || info.type === 'clear') {
        info.values.forEach(item => {
          triggerSelect(item.value, false);
        });
      }
    };
    // =========================== Search ===========================
    const onInternalSearch = (searchText, info) => {
      var _a;
      setSearchValue(searchText);
      setActiveValue(null);
      // [Submit] Tag mode should flush input
      if (info.source === 'submit') {
        const formatted = (searchText || '').trim();
        // prevent empty tags from appearing when you click the Enter button
        if (formatted) {
          const newRawValues = Array.from(new Set([...rawValues.value, formatted]));
          triggerChange(newRawValues);
          triggerSelect(formatted, true);
          setSearchValue('');
        }
        return;
      }
      if (info.source !== 'blur') {
        if (props.mode === 'combobox') {
          triggerChange(searchText);
        }
        (_a = props.onSearch) === null || _a === void 0 ? void 0 : _a.call(props, searchText);
      }
    };
    const onInternalSearchSplit = words => {
      let patchValues = words;
      if (props.mode !== 'tags') {
        patchValues = words.map(word => {
          const opt = labelOptions.value.get(word);
          return opt === null || opt === void 0 ? void 0 : opt.value;
        }).filter(val => val !== undefined);
      }
      const newRawValues = Array.from(new Set([...rawValues.value, ...patchValues]));
      triggerChange(newRawValues);
      newRawValues.forEach(newRawValue => {
        triggerSelect(newRawValue, true);
      });
    };
    const realVirtual = computed(() => props.virtual !== false && props.dropdownMatchSelectWidth !== false);
    useProvideSelectProps(toReactive(_extends(_extends({}, parsedOptions), {
      flattenOptions: displayOptions,
      onActiveValue,
      defaultActiveFirstOption: mergedDefaultActiveFirstOption,
      onSelect: onInternalSelect,
      menuItemSelectedIcon: toRef(props, 'menuItemSelectedIcon'),
      rawValues,
      fieldNames: mergedFieldNames,
      virtual: realVirtual,
      listHeight: toRef(props, 'listHeight'),
      listItemHeight: toRef(props, 'listItemHeight'),
      childrenAsData
    })));
    const selectRef = ref();
    expose({
      focus() {
        var _a;
        (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.focus();
      },
      blur() {
        var _a;
        (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.blur();
      },
      scrollTo(arg) {
        var _a;
        (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo(arg);
      }
    });
    const pickProps = computed(() => {
      return omit(props, ['id', 'mode', 'prefixCls', 'backfill', 'fieldNames',
      // Search
      'inputValue', 'searchValue', 'onSearch', 'autoClearSearchValue',
      // Select
      'onSelect', 'onDeselect', 'dropdownMatchSelectWidth',
      // Options
      'filterOption', 'filterSort', 'optionFilterProp', 'optionLabelProp', 'options', 'children', 'defaultActiveFirstOption', 'menuItemSelectedIcon', 'virtual', 'listHeight', 'listItemHeight',
      // Value
      'value', 'defaultValue', 'labelInValue', 'onChange']);
    });
    return () => {
      return createVNode(BaseSelect, _objectSpread$5(_objectSpread$5(_objectSpread$5({}, pickProps.value), attrs), {}, {
        "id": mergedId,
        "prefixCls": props.prefixCls,
        "ref": selectRef,
        "omitDomProps": OMIT_DOM_PROPS,
        "mode": props.mode,
        "displayValues": displayValues.value,
        "onDisplayValuesChange": onDisplayValuesChange,
        "searchValue": mergedSearchValue.value,
        "onSearch": onInternalSearch,
        "onSearchSplit": onInternalSearchSplit,
        "dropdownMatchSelectWidth": props.dropdownMatchSelectWidth,
        "OptionList": OptionList,
        "emptyOptions": !displayOptions.value.length,
        "activeValue": activeValue.value,
        "activeDescendantId": `${mergedId}_list_${accessibilityIndex.value}`
      }), slots);
    };
  }
});

const Option = () => null;
Option.isSelectOption = true;
Option.displayName = 'ASelectOption';

const OptGroup = () => null;
OptGroup.isSelectOptGroup = true;
OptGroup.displayName = 'ASelectOptGroup';

function getIcons(props) {
  let slots = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    loading,
    multiple,
    prefixCls,
    hasFeedback,
    feedbackIcon,
    showArrow
  } = props;
  const suffixIcon = props.suffixIcon || slots.suffixIcon && slots.suffixIcon();
  const clearIcon = props.clearIcon || slots.clearIcon && slots.clearIcon();
  const menuItemSelectedIcon = props.menuItemSelectedIcon || slots.menuItemSelectedIcon && slots.menuItemSelectedIcon();
  const removeIcon = props.removeIcon || slots.removeIcon && slots.removeIcon();
  // Clear Icon
  const mergedClearIcon = clearIcon !== null && clearIcon !== void 0 ? clearIcon : createVNode(CloseCircleFilled, null, null);
  // Validation Feedback Icon
  const getSuffixIconNode = arrowIcon => createVNode(Fragment, null, [showArrow !== false && arrowIcon, hasFeedback && feedbackIcon]);
  // Arrow item icon
  let mergedSuffixIcon = null;
  if (suffixIcon !== undefined) {
    mergedSuffixIcon = getSuffixIconNode(suffixIcon);
  } else if (loading) {
    mergedSuffixIcon = getSuffixIconNode(createVNode(LoadingOutlined, {
      "spin": true
    }, null));
  } else {
    const iconCls = `${prefixCls}-suffix`;
    mergedSuffixIcon = _ref => {
      let {
        open,
        showSearch
      } = _ref;
      if (open && showSearch) {
        return getSuffixIconNode(createVNode(SearchOutlined, {
          "class": iconCls
        }, null));
      }
      return getSuffixIconNode(createVNode(DownOutlined, {
        "class": iconCls
      }, null));
    };
  }
  // Checked item icon
  let mergedItemIcon = null;
  if (menuItemSelectedIcon !== undefined) {
    mergedItemIcon = menuItemSelectedIcon;
  } else if (multiple) {
    mergedItemIcon = createVNode(CheckOutlined, null, null);
  } else {
    mergedItemIcon = null;
  }
  let mergedRemoveIcon = null;
  if (removeIcon !== undefined) {
    mergedRemoveIcon = removeIcon;
  } else {
    mergedRemoveIcon = createVNode(CloseOutlined, null, null);
  }
  return {
    clearIcon: mergedClearIcon,
    suffixIcon: mergedSuffixIcon,
    itemIcon: mergedItemIcon,
    removeIcon: mergedRemoveIcon
  };
}

const genItemStyle = token => {
  const {
    controlPaddingHorizontal
  } = token;
  return {
    position: 'relative',
    display: 'block',
    minHeight: token.controlHeight,
    padding: `${(token.controlHeight - token.fontSize * token.lineHeight) / 2}px ${controlPaddingHorizontal}px`,
    color: token.colorText,
    fontWeight: 'normal',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    boxSizing: 'border-box'
  };
};
const genSingleStyle$1 = token => {
  const {
    antCls,
    componentCls
  } = token;
  const selectItemCls = `${componentCls}-item`;
  return [{
    [`${componentCls}-dropdown`]: _extends(_extends({}, resetComponent(token)), {
      position: 'absolute',
      top: -9999,
      zIndex: token.zIndexPopup,
      boxSizing: 'border-box',
      padding: token.paddingXXS,
      overflow: 'hidden',
      fontSize: token.fontSize,
      // Fix select render lag of long text in chrome
      // https://github.com/ant-design/ant-design/issues/11456
      // https://github.com/ant-design/ant-design/issues/11843
      fontVariant: 'initial',
      backgroundColor: token.colorBgElevated,
      borderRadius: token.borderRadiusLG,
      outline: 'none',
      boxShadow: token.boxShadowSecondary,
      [`
            &${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-bottomLeft,
            &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-bottomLeft
          `]: {
        animationName: slideUpIn
      },
      [`
            &${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-topLeft,
            &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-topLeft
          `]: {
        animationName: slideDownIn
      },
      [`&${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-bottomLeft`]: {
        animationName: slideUpOut
      },
      [`&${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-topLeft`]: {
        animationName: slideDownOut
      },
      '&-hidden': {
        display: 'none'
      },
      '&-empty': {
        color: token.colorTextDisabled
      },
      // ========================= Options =========================
      [`${selectItemCls}-empty`]: _extends(_extends({}, genItemStyle(token)), {
        color: token.colorTextDisabled
      }),
      [`${selectItemCls}`]: _extends(_extends({}, genItemStyle(token)), {
        cursor: 'pointer',
        transition: `background ${token.motionDurationSlow} ease`,
        borderRadius: token.borderRadiusSM,
        // =========== Group ============
        '&-group': {
          color: token.colorTextDescription,
          fontSize: token.fontSizeSM,
          cursor: 'default'
        },
        // =========== Option ===========
        '&-option': {
          display: 'flex',
          '&-content': _extends({
            flex: 'auto'
          }, textEllipsis),
          '&-state': {
            flex: 'none'
          },
          [`&-active:not(${selectItemCls}-option-disabled)`]: {
            backgroundColor: token.controlItemBgHover
          },
          [`&-selected:not(${selectItemCls}-option-disabled)`]: {
            color: token.colorText,
            fontWeight: token.fontWeightStrong,
            backgroundColor: token.controlItemBgActive,
            [`${selectItemCls}-option-state`]: {
              color: token.colorPrimary
            }
          },
          '&-disabled': {
            [`&${selectItemCls}-option-selected`]: {
              backgroundColor: token.colorBgContainerDisabled
            },
            color: token.colorTextDisabled,
            cursor: 'not-allowed'
          },
          '&-grouped': {
            paddingInlineStart: token.controlPaddingHorizontal * 2
          }
        }
      }),
      // =========================== RTL ===========================
      '&-rtl': {
        direction: 'rtl'
      }
    })
  },
  // Follow code may reuse in other components
  initSlideMotion(token, 'slide-up'), initSlideMotion(token, 'slide-down'), initMoveMotion(token, 'move-up'), initMoveMotion(token, 'move-down')];
};

const FIXED_ITEM_MARGIN = 2;
function getSelectItemStyle(_ref) {
  let {
    controlHeightSM,
    controlHeight,
    lineWidth: borderWidth
  } = _ref;
  const selectItemDist = (controlHeight - controlHeightSM) / 2 - borderWidth;
  const selectItemMargin = Math.ceil(selectItemDist / 2);
  return [selectItemDist, selectItemMargin];
}
function genSizeStyle$2(token, suffix) {
  const {
    componentCls,
    iconCls
  } = token;
  const selectOverflowPrefixCls = `${componentCls}-selection-overflow`;
  const selectItemHeight = token.controlHeightSM;
  const [selectItemDist] = getSelectItemStyle(token);
  const suffixCls = suffix ? `${componentCls}-${suffix}` : '';
  return {
    [`${componentCls}-multiple${suffixCls}`]: {
      fontSize: token.fontSize,
      /**
       * Do not merge `height` & `line-height` under style with `selection` & `search`, since chrome
       * may update to redesign with its align logic.
       */
      // =========================== Overflow ===========================
      [selectOverflowPrefixCls]: {
        position: 'relative',
        display: 'flex',
        flex: 'auto',
        flexWrap: 'wrap',
        maxWidth: '100%',
        '&-item': {
          flex: 'none',
          alignSelf: 'center',
          maxWidth: '100%',
          display: 'inline-flex'
        }
      },
      // ========================= Selector =========================
      [`${componentCls}-selector`]: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        // Multiple is little different that horizontal is follow the vertical
        padding: `${selectItemDist - FIXED_ITEM_MARGIN}px ${FIXED_ITEM_MARGIN * 2}px`,
        borderRadius: token.borderRadius,
        [`${componentCls}-show-search&`]: {
          cursor: 'text'
        },
        [`${componentCls}-disabled&`]: {
          background: token.colorBgContainerDisabled,
          cursor: 'not-allowed'
        },
        '&:after': {
          display: 'inline-block',
          width: 0,
          margin: `${FIXED_ITEM_MARGIN}px 0`,
          lineHeight: `${selectItemHeight}px`,
          content: '"\\a0"'
        }
      },
      [`
        &${componentCls}-show-arrow ${componentCls}-selector,
        &${componentCls}-allow-clear ${componentCls}-selector
      `]: {
        paddingInlineEnd: token.fontSizeIcon + token.controlPaddingHorizontal
      },
      // ======================== Selections ========================
      [`${componentCls}-selection-item`]: {
        position: 'relative',
        display: 'flex',
        flex: 'none',
        boxSizing: 'border-box',
        maxWidth: '100%',
        height: selectItemHeight,
        marginTop: FIXED_ITEM_MARGIN,
        marginBottom: FIXED_ITEM_MARGIN,
        lineHeight: `${selectItemHeight - token.lineWidth * 2}px`,
        background: token.colorFillSecondary,
        border: `${token.lineWidth}px solid ${token.colorSplit}`,
        borderRadius: token.borderRadiusSM,
        cursor: 'default',
        transition: `font-size ${token.motionDurationSlow}, line-height ${token.motionDurationSlow}, height ${token.motionDurationSlow}`,
        userSelect: 'none',
        marginInlineEnd: FIXED_ITEM_MARGIN * 2,
        paddingInlineStart: token.paddingXS,
        paddingInlineEnd: token.paddingXS / 2,
        [`${componentCls}-disabled&`]: {
          color: token.colorTextDisabled,
          borderColor: token.colorBorder,
          cursor: 'not-allowed'
        },
        // It's ok not to do this, but 24px makes bottom narrow in view should adjust
        '&-content': {
          display: 'inline-block',
          marginInlineEnd: token.paddingXS / 2,
          overflow: 'hidden',
          whiteSpace: 'pre',
          textOverflow: 'ellipsis'
        },
        '&-remove': _extends(_extends({}, resetIcon()), {
          display: 'inline-block',
          color: token.colorIcon,
          fontWeight: 'bold',
          fontSize: 10,
          lineHeight: 'inherit',
          cursor: 'pointer',
          [`> ${iconCls}`]: {
            verticalAlign: '-0.2em'
          },
          '&:hover': {
            color: token.colorIconHover
          }
        })
      },
      // ========================== Input ==========================
      [`${selectOverflowPrefixCls}-item + ${selectOverflowPrefixCls}-item`]: {
        [`${componentCls}-selection-search`]: {
          marginInlineStart: 0
        }
      },
      [`${componentCls}-selection-search`]: {
        display: 'inline-flex',
        position: 'relative',
        maxWidth: '100%',
        marginInlineStart: token.inputPaddingHorizontalBase - selectItemDist,
        [`
          &-input,
          &-mirror
        `]: {
          height: selectItemHeight,
          fontFamily: token.fontFamily,
          lineHeight: `${selectItemHeight}px`,
          transition: `all ${token.motionDurationSlow}`
        },
        '&-input': {
          width: '100%',
          minWidth: 4.1 // fix search cursor missing
        },
        '&-mirror': {
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 'auto',
          zIndex: 999,
          whiteSpace: 'pre',
          visibility: 'hidden'
        }
      },
      // ======================= Placeholder =======================
      [`${componentCls}-selection-placeholder `]: {
        position: 'absolute',
        top: '50%',
        insetInlineStart: token.inputPaddingHorizontalBase,
        insetInlineEnd: token.inputPaddingHorizontalBase,
        transform: 'translateY(-50%)',
        transition: `all ${token.motionDurationSlow}`
      }
    }
  };
}
function genMultipleStyle(token) {
  const {
    componentCls
  } = token;
  const smallToken = merge(token, {
    controlHeight: token.controlHeightSM,
    controlHeightSM: token.controlHeightXS,
    borderRadius: token.borderRadiusSM,
    borderRadiusSM: token.borderRadiusXS
  });
  const [, smSelectItemMargin] = getSelectItemStyle(token);
  return [genSizeStyle$2(token),
  // ======================== Small ========================
  // Shared
  genSizeStyle$2(smallToken, 'sm'),
  // Padding
  {
    [`${componentCls}-multiple${componentCls}-sm`]: {
      [`${componentCls}-selection-placeholder`]: {
        insetInlineStart: token.controlPaddingHorizontalSM - token.lineWidth,
        insetInlineEnd: 'auto'
      },
      // https://github.com/ant-design/ant-design/issues/29559
      [`${componentCls}-selection-search`]: {
        marginInlineStart: smSelectItemMargin
      }
    }
  },
  // ======================== Large ========================
  // Shared
  genSizeStyle$2(merge(token, {
    fontSize: token.fontSizeLG,
    controlHeight: token.controlHeightLG,
    controlHeightSM: token.controlHeight,
    borderRadius: token.borderRadiusLG,
    borderRadiusSM: token.borderRadius
  }), 'lg')];
}

function genSizeStyle$1(token, suffix) {
  const {
    componentCls,
    inputPaddingHorizontalBase,
    borderRadius
  } = token;
  const selectHeightWithoutBorder = token.controlHeight - token.lineWidth * 2;
  const selectionItemPadding = Math.ceil(token.fontSize * 1.25);
  const suffixCls = suffix ? `${componentCls}-${suffix}` : '';
  return {
    [`${componentCls}-single${suffixCls}`]: {
      fontSize: token.fontSize,
      // ========================= Selector =========================
      [`${componentCls}-selector`]: _extends(_extends({}, resetComponent(token)), {
        display: 'flex',
        borderRadius,
        [`${componentCls}-selection-search`]: {
          position: 'absolute',
          top: 0,
          insetInlineStart: inputPaddingHorizontalBase,
          insetInlineEnd: inputPaddingHorizontalBase,
          bottom: 0,
          '&-input': {
            width: '100%'
          }
        },
        [`
          ${componentCls}-selection-item,
          ${componentCls}-selection-placeholder
        `]: {
          padding: 0,
          lineHeight: `${selectHeightWithoutBorder}px`,
          transition: `all ${token.motionDurationSlow}`,
          // Firefox inline-block position calculation is not same as Chrome & Safari. Patch this:
          '@supports (-moz-appearance: meterbar)': {
            lineHeight: `${selectHeightWithoutBorder}px`
          }
        },
        [`${componentCls}-selection-item`]: {
          position: 'relative',
          userSelect: 'none'
        },
        [`${componentCls}-selection-placeholder`]: {
          transition: 'none',
          pointerEvents: 'none'
        },
        // For common baseline align
        [['&:after', /* For '' value baseline align */
        `${componentCls}-selection-item:after`, /* For undefined value baseline align */
        `${componentCls}-selection-placeholder:after`].join(',')]: {
          display: 'inline-block',
          width: 0,
          visibility: 'hidden',
          content: '"\\a0"'
        }
      }),
      [`
        &${componentCls}-show-arrow ${componentCls}-selection-item,
        &${componentCls}-show-arrow ${componentCls}-selection-placeholder
      `]: {
        paddingInlineEnd: selectionItemPadding
      },
      // Opacity selection if open
      [`&${componentCls}-open ${componentCls}-selection-item`]: {
        color: token.colorTextPlaceholder
      },
      // ========================== Input ==========================
      // We only change the style of non-customize input which is only support by `combobox` mode.
      // Not customize
      [`&:not(${componentCls}-customize-input)`]: {
        [`${componentCls}-selector`]: {
          width: '100%',
          height: token.controlHeight,
          padding: `0 ${inputPaddingHorizontalBase}px`,
          [`${componentCls}-selection-search-input`]: {
            height: selectHeightWithoutBorder
          },
          '&:after': {
            lineHeight: `${selectHeightWithoutBorder}px`
          }
        }
      },
      [`&${componentCls}-customize-input`]: {
        [`${componentCls}-selector`]: {
          '&:after': {
            display: 'none'
          },
          [`${componentCls}-selection-search`]: {
            position: 'static',
            width: '100%'
          },
          [`${componentCls}-selection-placeholder`]: {
            position: 'absolute',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            padding: `0 ${inputPaddingHorizontalBase}px`,
            '&:after': {
              display: 'none'
            }
          }
        }
      }
    }
  };
}
function genSingleStyle(token) {
  const {
    componentCls
  } = token;
  const inputPaddingHorizontalSM = token.controlPaddingHorizontalSM - token.lineWidth;
  return [genSizeStyle$1(token),
  // ======================== Small ========================
  // Shared
  genSizeStyle$1(merge(token, {
    controlHeight: token.controlHeightSM,
    borderRadius: token.borderRadiusSM
  }), 'sm'),
  // padding
  {
    [`${componentCls}-single${componentCls}-sm`]: {
      [`&:not(${componentCls}-customize-input)`]: {
        [`${componentCls}-selection-search`]: {
          insetInlineStart: inputPaddingHorizontalSM,
          insetInlineEnd: inputPaddingHorizontalSM
        },
        [`${componentCls}-selector`]: {
          padding: `0 ${inputPaddingHorizontalSM}px`
        },
        // With arrow should provides `padding-right` to show the arrow
        [`&${componentCls}-show-arrow ${componentCls}-selection-search`]: {
          insetInlineEnd: inputPaddingHorizontalSM + token.fontSize * 1.5
        },
        [`
            &${componentCls}-show-arrow ${componentCls}-selection-item,
            &${componentCls}-show-arrow ${componentCls}-selection-placeholder
          `]: {
          paddingInlineEnd: token.fontSize * 1.5
        }
      }
    }
  },
  // ======================== Large ========================
  // Shared
  genSizeStyle$1(merge(token, {
    controlHeight: token.controlHeightLG,
    fontSize: token.fontSizeLG,
    borderRadius: token.borderRadiusLG
  }), 'lg')];
}

// ============================= Selector =============================
const genSelectorStyle = token => {
  const {
    componentCls
  } = token;
  return {
    position: 'relative',
    backgroundColor: token.colorBgContainer,
    border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
    transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
    input: {
      cursor: 'pointer'
    },
    [`${componentCls}-show-search&`]: {
      cursor: 'text',
      input: {
        cursor: 'auto',
        color: 'inherit'
      }
    },
    [`${componentCls}-disabled&`]: {
      color: token.colorTextDisabled,
      background: token.colorBgContainerDisabled,
      cursor: 'not-allowed',
      [`${componentCls}-multiple&`]: {
        background: token.colorBgContainerDisabled
      },
      input: {
        cursor: 'not-allowed'
      }
    }
  };
};
// ============================== Status ==============================
const genStatusStyle = function (rootSelectCls, token) {
  let overwriteDefaultBorder = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const {
    componentCls,
    borderHoverColor,
    outlineColor,
    antCls
  } = token;
  const overwriteStyle = overwriteDefaultBorder ? {
    [`${componentCls}-selector`]: {
      borderColor: borderHoverColor
    }
  } : {};
  return {
    [rootSelectCls]: {
      [`&:not(${componentCls}-disabled):not(${componentCls}-customize-input):not(${antCls}-pagination-size-changer)`]: _extends(_extends({}, overwriteStyle), {
        [`${componentCls}-focused& ${componentCls}-selector`]: {
          borderColor: borderHoverColor,
          boxShadow: `0 0 0 ${token.controlOutlineWidth}px ${outlineColor}`,
          borderInlineEndWidth: `${token.controlLineWidth}px !important`,
          outline: 0
        },
        [`&:hover ${componentCls}-selector`]: {
          borderColor: borderHoverColor,
          borderInlineEndWidth: `${token.controlLineWidth}px !important`
        }
      })
    }
  };
};
// ============================== Styles ==============================
// /* Reset search input style */
const getSearchInputWithoutBorderStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-selection-search-input`]: {
      margin: 0,
      padding: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      appearance: 'none',
      '&::-webkit-search-cancel-button': {
        display: 'none',
        '-webkit-appearance': 'none'
      }
    }
  };
};
// =============================== Base ===============================
const genBaseStyle = token => {
  const {
    componentCls,
    inputPaddingHorizontalBase,
    iconCls
  } = token;
  return {
    [componentCls]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      display: 'inline-block',
      cursor: 'pointer',
      [`&:not(${componentCls}-customize-input) ${componentCls}-selector`]: _extends(_extends({}, genSelectorStyle(token)), getSearchInputWithoutBorderStyle(token)),
      // [`&:not(&-disabled):hover ${selectCls}-selector`]: {
      //   ...genHoverStyle(token),
      // },
      // ======================== Selection ========================
      [`${componentCls}-selection-item`]: _extends({
        flex: 1,
        fontWeight: 'normal'
      }, textEllipsis),
      // ======================= Placeholder =======================
      [`${componentCls}-selection-placeholder`]: _extends(_extends({}, textEllipsis), {
        flex: 1,
        color: token.colorTextPlaceholder,
        pointerEvents: 'none'
      }),
      // ========================== Arrow ==========================
      [`${componentCls}-arrow`]: _extends(_extends({}, resetIcon()), {
        position: 'absolute',
        top: '50%',
        insetInlineStart: 'auto',
        insetInlineEnd: inputPaddingHorizontalBase,
        height: token.fontSizeIcon,
        marginTop: -token.fontSizeIcon / 2,
        color: token.colorTextQuaternary,
        fontSize: token.fontSizeIcon,
        lineHeight: 1,
        textAlign: 'center',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        [iconCls]: {
          verticalAlign: 'top',
          transition: `transform ${token.motionDurationSlow}`,
          '> svg': {
            verticalAlign: 'top'
          },
          [`&:not(${componentCls}-suffix)`]: {
            pointerEvents: 'auto'
          }
        },
        [`${componentCls}-disabled &`]: {
          cursor: 'not-allowed'
        },
        '> *:not(:last-child)': {
          marginInlineEnd: 8 // FIXME: magic
        }
      }),
      // ========================== Clear ==========================
      [`${componentCls}-clear`]: {
        position: 'absolute',
        top: '50%',
        insetInlineStart: 'auto',
        insetInlineEnd: inputPaddingHorizontalBase,
        zIndex: 1,
        display: 'inline-block',
        width: token.fontSizeIcon,
        height: token.fontSizeIcon,
        marginTop: -token.fontSizeIcon / 2,
        color: token.colorTextQuaternary,
        fontSize: token.fontSizeIcon,
        fontStyle: 'normal',
        lineHeight: 1,
        textAlign: 'center',
        textTransform: 'none',
        background: token.colorBgContainer,
        cursor: 'pointer',
        opacity: 0,
        transition: `color ${token.motionDurationMid} ease, opacity ${token.motionDurationSlow} ease`,
        textRendering: 'auto',
        '&:before': {
          display: 'block'
        },
        '&:hover': {
          color: token.colorTextTertiary
        }
      },
      '&:hover': {
        [`${componentCls}-clear`]: {
          opacity: 1
        }
      }
    }),
    // ========================= Feedback ==========================
    [`${componentCls}-has-feedback`]: {
      [`${componentCls}-clear`]: {
        insetInlineEnd: inputPaddingHorizontalBase + token.fontSize + token.paddingXXS
      }
    }
  };
};
// ============================== Styles ==============================
const genSelectStyle = token => {
  const {
    componentCls
  } = token;
  return [{
    [componentCls]: {
      // ==================== BorderLess ====================
      [`&-borderless ${componentCls}-selector`]: {
        backgroundColor: `transparent !important`,
        borderColor: `transparent !important`,
        boxShadow: `none !important`
      },
      // ==================== In Form ====================
      [`&${componentCls}-in-form-item`]: {
        width: '100%'
      }
    }
  },
  // =====================================================
  // ==                       LTR                       ==
  // =====================================================
  // Base
  genBaseStyle(token),
  // Single
  genSingleStyle(token),
  // Multiple
  genMultipleStyle(token),
  // Dropdown
  genSingleStyle$1(token),
  // =====================================================
  // ==                       RTL                       ==
  // =====================================================
  {
    [`${componentCls}-rtl`]: {
      direction: 'rtl'
    }
  },
  // =====================================================
  // ==                     Status                      ==
  // =====================================================
  genStatusStyle(componentCls, merge(token, {
    borderHoverColor: token.colorPrimaryHover,
    outlineColor: token.controlOutline
  })), genStatusStyle(`${componentCls}-status-error`, merge(token, {
    borderHoverColor: token.colorErrorHover,
    outlineColor: token.colorErrorOutline
  }), true), genStatusStyle(`${componentCls}-status-warning`, merge(token, {
    borderHoverColor: token.colorWarningHover,
    outlineColor: token.colorWarningOutline
  }), true),
  // =====================================================
  // ==             Space Compact                       ==
  // =====================================================
  genCompactItemStyle(token, {
    borderElCls: `${componentCls}-selector`,
    focusElCls: `${componentCls}-focused`
  })];
};
// ============================== Export ==============================
const useSelectStyle = genComponentStyleHook('Select', (token, _ref) => {
  let {
    rootPrefixCls
  } = _ref;
  const selectToken = merge(token, {
    rootPrefixCls,
    inputPaddingHorizontalBase: token.paddingSM - 1
  });
  return [genSelectStyle(selectToken)];
}, token => ({
  zIndexPopup: token.zIndexPopupBase + 50
}));

const selectProps = () => _extends(_extends({}, omit(selectProps$1(), ['inputIcon', 'mode', 'getInputElement', 'getRawInputElement', 'backfill'])), {
  value: someType([Array, Object, String, Number]),
  defaultValue: someType([Array, Object, String, Number]),
  notFoundContent: PropTypes.any,
  suffixIcon: PropTypes.any,
  itemIcon: PropTypes.any,
  size: stringType(),
  mode: stringType(),
  bordered: booleanType(true),
  transitionName: String,
  choiceTransitionName: stringType(''),
  popupClassName: String,
  /** @deprecated Please use `popupClassName` instead */
  dropdownClassName: String,
  placement: stringType(),
  status: stringType(),
  'onUpdate:value': functionType()
});
const SECRET_COMBOBOX_MODE_DO_NOT_USE = 'SECRET_COMBOBOX_MODE_DO_NOT_USE';
const Select = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ASelect',
  Option,
  OptGroup,
  inheritAttrs: false,
  props: initDefaultProps(selectProps(), {
    listHeight: 256,
    listItemHeight: 24
  }),
  SECRET_COMBOBOX_MODE_DO_NOT_USE,
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots,
      expose
    } = _ref;
    const selectRef = ref();
    const formItemContext = useInjectFormItemContext();
    const formItemInputContext = FormItemInputContext.useInject();
    const mergedStatus = computed(() => getMergedStatus(formItemInputContext.status, props.status));
    const focus = () => {
      var _a;
      (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.focus();
    };
    const blur = () => {
      var _a;
      (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.blur();
    };
    const scrollTo = arg => {
      var _a;
      (_a = selectRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo(arg);
    };
    const mode = computed(() => {
      const {
        mode
      } = props;
      if (mode === 'combobox') {
        return undefined;
      }
      if (mode === SECRET_COMBOBOX_MODE_DO_NOT_USE) {
        return 'combobox';
      }
      return mode;
    });
    const {
      prefixCls,
      direction,
      renderEmpty,
      size: contextSize,
      getPrefixCls,
      getPopupContainer,
      disabled,
      select
    } = useConfigInject('select', props);
    const {
      compactSize,
      compactItemClassnames
    } = useCompactItemContext(prefixCls, direction);
    const mergedSize = computed(() => compactSize.value || contextSize.value);
    const contextDisabled = useInjectDisabled();
    const mergedDisabled = computed(() => {
      var _a;
      return (_a = disabled.value) !== null && _a !== void 0 ? _a : contextDisabled.value;
    });
    // style
    const [wrapSSR, hashId] = useSelectStyle(prefixCls);
    const rootPrefixCls = computed(() => getPrefixCls());
    // ===================== Placement =====================
    const placement = computed(() => {
      if (props.placement !== undefined) {
        return props.placement;
      }
      return direction.value === 'rtl' ? 'bottomRight' : 'bottomLeft';
    });
    const transitionName = computed(() => getTransitionName(rootPrefixCls.value, getTransitionDirection(placement.value), props.transitionName));
    const mergedClassName = computed(() => classNames({
      [`${prefixCls.value}-lg`]: mergedSize.value === 'large',
      [`${prefixCls.value}-sm`]: mergedSize.value === 'small',
      [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
      [`${prefixCls.value}-borderless`]: !props.bordered,
      [`${prefixCls.value}-in-form-item`]: formItemInputContext.isFormItemInput
    }, getStatusClassNames(prefixCls.value, mergedStatus.value, formItemInputContext.hasFeedback), compactItemClassnames.value, hashId.value));
    const triggerChange = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      emit('update:value', args[0]);
      emit('change', ...args);
      formItemContext.onFieldChange();
    };
    const handleBlur = e => {
      emit('blur', e);
      formItemContext.onFieldBlur();
    };
    expose({
      blur,
      focus,
      scrollTo
    });
    const isMultiple = computed(() => mode.value === 'multiple' || mode.value === 'tags');
    const mergedShowArrow = computed(() => props.showArrow !== undefined ? props.showArrow : props.loading || !(isMultiple.value || mode.value === 'combobox'));
    return () => {
      var _a, _b, _c, _d;
      const {
        notFoundContent,
        listHeight = 256,
        listItemHeight = 24,
        popupClassName,
        dropdownClassName,
        virtual,
        dropdownMatchSelectWidth,
        id = formItemContext.id.value,
        placeholder = (_a = slots.placeholder) === null || _a === void 0 ? void 0 : _a.call(slots),
        showArrow
      } = props;
      const {
        hasFeedback,
        feedbackIcon
      } = formItemInputContext;
      // ===================== Empty =====================
      let mergedNotFound;
      if (notFoundContent !== undefined) {
        mergedNotFound = notFoundContent;
      } else if (slots.notFoundContent) {
        mergedNotFound = slots.notFoundContent();
      } else if (mode.value === 'combobox') {
        mergedNotFound = null;
      } else {
        mergedNotFound = (renderEmpty === null || renderEmpty === void 0 ? void 0 : renderEmpty('Select')) || createVNode(DefaultRenderEmpty, {
          "componentName": "Select"
        }, null);
      }
      // ===================== Icons =====================
      const {
        suffixIcon,
        itemIcon,
        removeIcon,
        clearIcon
      } = getIcons(_extends(_extends({}, props), {
        multiple: isMultiple.value,
        prefixCls: prefixCls.value,
        hasFeedback,
        feedbackIcon,
        showArrow: mergedShowArrow.value
      }), slots);
      const selectProps = omit(props, ['prefixCls', 'suffixIcon', 'itemIcon', 'removeIcon', 'clearIcon', 'size', 'bordered', 'status']);
      const rcSelectRtlDropdownClassName = classNames(popupClassName || dropdownClassName, {
        [`${prefixCls.value}-dropdown-${direction.value}`]: direction.value === 'rtl'
      }, hashId.value);
      return wrapSSR(createVNode(Select$1, _objectSpread$5(_objectSpread$5(_objectSpread$5({
        "ref": selectRef,
        "virtual": virtual,
        "dropdownMatchSelectWidth": dropdownMatchSelectWidth
      }, selectProps), attrs), {}, {
        "showSearch": (_b = props.showSearch) !== null && _b !== void 0 ? _b : (_c = select === null || select === void 0 ? void 0 : select.value) === null || _c === void 0 ? void 0 : _c.showSearch,
        "placeholder": placeholder,
        "listHeight": listHeight,
        "listItemHeight": listItemHeight,
        "mode": mode.value,
        "prefixCls": prefixCls.value,
        "direction": direction.value,
        "inputIcon": suffixIcon,
        "menuItemSelectedIcon": itemIcon,
        "removeIcon": removeIcon,
        "clearIcon": clearIcon,
        "notFoundContent": mergedNotFound,
        "class": [mergedClassName.value, attrs.class],
        "getPopupContainer": getPopupContainer === null || getPopupContainer === void 0 ? void 0 : getPopupContainer.value,
        "dropdownClassName": rcSelectRtlDropdownClassName,
        "onChange": triggerChange,
        "onBlur": handleBlur,
        "id": id,
        "dropdownRender": selectProps.dropdownRender || slots.dropdownRender,
        "transitionName": transitionName.value,
        "children": (_d = slots.default) === null || _d === void 0 ? void 0 : _d.call(slots),
        "tagRender": props.tagRender || slots.tagRender,
        "optionLabelRender": slots.optionLabel,
        "maxTagPlaceholder": props.maxTagPlaceholder || slots.maxTagPlaceholder,
        "showArrow": hasFeedback || showArrow,
        "disabled": mergedDisabled.value
      }), {
        option: slots.option
      }));
    };
  }
});
/* istanbul ignore next */
Select.install = function (app) {
  app.component(Select.name, Select);
  app.component(Select.Option.displayName, Select.Option);
  app.component(Select.OptGroup.displayName, Select.OptGroup);
  return app;
};
const SelectOption = Select.Option;
Select.OptGroup;

var __rest$8 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const checkboxProps$1 = {
  prefixCls: String,
  name: String,
  id: String,
  type: String,
  defaultChecked: {
    type: [Boolean, Number],
    default: undefined
  },
  checked: {
    type: [Boolean, Number],
    default: undefined
  },
  disabled: Boolean,
  tabindex: {
    type: [Number, String]
  },
  readonly: Boolean,
  autofocus: Boolean,
  value: PropTypes.any,
  required: Boolean
};
const VcCheckbox = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'Checkbox',
  inheritAttrs: false,
  props: initDefaultProps(checkboxProps$1, {
    prefixCls: 'rc-checkbox',
    type: 'checkbox',
    defaultChecked: false
  }),
  emits: ['click', 'change'],
  setup(props, _ref) {
    let {
      attrs,
      emit,
      expose
    } = _ref;
    const checked = ref(props.checked === undefined ? props.defaultChecked : props.checked);
    const inputRef = ref();
    watch(() => props.checked, () => {
      checked.value = props.checked;
    });
    expose({
      focus() {
        var _a;
        (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
      },
      blur() {
        var _a;
        (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.blur();
      }
    });
    const eventShiftKey = ref();
    const handleChange = e => {
      if (props.disabled) {
        return;
      }
      if (props.checked === undefined) {
        checked.value = e.target.checked;
      }
      e.shiftKey = eventShiftKey.value;
      const eventObj = {
        target: _extends(_extends({}, props), {
          checked: e.target.checked
        }),
        stopPropagation() {
          e.stopPropagation();
        },
        preventDefault() {
          e.preventDefault();
        },
        nativeEvent: e
      };
      // fix https://github.com/vueComponent/ant-design-vue/issues/3047
      // 受控模式下维持现有状态
      if (props.checked !== undefined) {
        inputRef.value.checked = !!props.checked;
      }
      emit('change', eventObj);
      eventShiftKey.value = false;
    };
    const onClick = e => {
      emit('click', e);
      // onChange没能获取到shiftKey，使用onClick hack
      eventShiftKey.value = e.shiftKey;
    };
    return () => {
      const {
          prefixCls,
          name,
          id,
          type,
          disabled,
          readonly,
          tabindex,
          autofocus,
          value,
          required
        } = props,
        others = __rest$8(props, ["prefixCls", "name", "id", "type", "disabled", "readonly", "tabindex", "autofocus", "value", "required"]);
      const {
        class: className,
        onFocus,
        onBlur,
        onKeydown,
        onKeypress,
        onKeyup
      } = attrs;
      const othersAndAttrs = _extends(_extends({}, others), attrs);
      const globalProps = Object.keys(othersAndAttrs).reduce((prev, key) => {
        if (key.startsWith('data-') || key.startsWith('aria-') || key === 'role') {
          prev[key] = othersAndAttrs[key];
        }
        return prev;
      }, {});
      const classString = classNames(prefixCls, className, {
        [`${prefixCls}-checked`]: checked.value,
        [`${prefixCls}-disabled`]: disabled
      });
      const inputProps = _extends(_extends({
        name,
        id,
        type,
        readonly,
        disabled,
        tabindex,
        class: `${prefixCls}-input`,
        checked: !!checked.value,
        autofocus,
        value
      }, globalProps), {
        onChange: handleChange,
        onClick,
        onFocus,
        onBlur,
        onKeydown,
        onKeypress,
        onKeyup,
        required
      });
      return createVNode("span", {
        "class": classString
      }, [createVNode("input", _objectSpread$5({
        "ref": inputRef
      }, inputProps), null), createVNode("span", {
        "class": `${prefixCls}-inner`
      }, null)]);
    };
  }
});

const radioGroupContextKey = Symbol('radioGroupContextKey');
const useProvideRadioGroupContext = props => {
  provide(radioGroupContextKey, props);
};
const useInjectRadioGroupContext = () => {
  return inject(radioGroupContextKey, undefined);
};
const radioOptionTypeContextKey = Symbol('radioOptionTypeContextKey');
const useProvideRadioOptionTypeContext = props => {
  provide(radioOptionTypeContextKey, props);
};
const useInjectRadioOptionTypeContext = () => {
  return inject(radioOptionTypeContextKey, undefined);
};

// ============================== Styles ==============================
const antRadioEffect = new Keyframe('antRadioEffect', {
  '0%': {
    transform: 'scale(1)',
    opacity: 0.5
  },
  '100%': {
    transform: 'scale(1.6)',
    opacity: 0
  }
});
// styles from RadioGroup only
const getGroupRadioStyle = token => {
  const {
    componentCls,
    antCls
  } = token;
  const groupPrefixCls = `${componentCls}-group`;
  return {
    [groupPrefixCls]: _extends(_extends({}, resetComponent(token)), {
      display: 'inline-block',
      fontSize: 0,
      // RTL
      [`&${groupPrefixCls}-rtl`]: {
        direction: 'rtl'
      },
      [`${antCls}-badge ${antCls}-badge-count`]: {
        zIndex: 1
      },
      [`> ${antCls}-badge:not(:first-child) > ${antCls}-button-wrapper`]: {
        borderInlineStart: 'none'
      }
    })
  };
};
// Styles from radio-wrapper
const getRadioBasicStyle = token => {
  const {
    componentCls,
    radioWrapperMarginRight,
    radioCheckedColor,
    radioSize,
    motionDurationSlow,
    motionDurationMid,
    motionEaseInOut,
    motionEaseInOutCirc,
    radioButtonBg,
    colorBorder,
    lineWidth,
    radioDotSize,
    colorBgContainerDisabled,
    colorTextDisabled,
    paddingXS,
    radioDotDisabledColor,
    lineType,
    radioDotDisabledSize,
    wireframe,
    colorWhite
  } = token;
  const radioInnerPrefixCls = `${componentCls}-inner`;
  return {
    [`${componentCls}-wrapper`]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'baseline',
      marginInlineStart: 0,
      marginInlineEnd: radioWrapperMarginRight,
      cursor: 'pointer',
      // RTL
      [`&${componentCls}-wrapper-rtl`]: {
        direction: 'rtl'
      },
      '&-disabled': {
        cursor: 'not-allowed',
        color: token.colorTextDisabled
      },
      '&::after': {
        display: 'inline-block',
        width: 0,
        overflow: 'hidden',
        content: '"\\a0"'
      },
      // hashId 在 wrapper 上，只能铺平
      [`${componentCls}-checked::after`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineStart: 0,
        width: '100%',
        height: '100%',
        border: `${lineWidth}px ${lineType} ${radioCheckedColor}`,
        borderRadius: '50%',
        visibility: 'hidden',
        animationName: antRadioEffect,
        animationDuration: motionDurationSlow,
        animationTimingFunction: motionEaseInOut,
        animationFillMode: 'both',
        content: '""'
      },
      [componentCls]: _extends(_extends({}, resetComponent(token)), {
        position: 'relative',
        display: 'inline-block',
        outline: 'none',
        cursor: 'pointer',
        alignSelf: 'center'
      }),
      [`${componentCls}-wrapper:hover &,
        &:hover ${radioInnerPrefixCls}`]: {
        borderColor: radioCheckedColor
      },
      [`${componentCls}-input:focus-visible + ${radioInnerPrefixCls}`]: _extends({}, genFocusOutline(token)),
      [`${componentCls}:hover::after, ${componentCls}-wrapper:hover &::after`]: {
        visibility: 'visible'
      },
      [`${componentCls}-inner`]: {
        '&::after': {
          boxSizing: 'border-box',
          position: 'absolute',
          insetBlockStart: '50%',
          insetInlineStart: '50%',
          display: 'block',
          width: radioSize,
          height: radioSize,
          marginBlockStart: radioSize / -2,
          marginInlineStart: radioSize / -2,
          backgroundColor: wireframe ? radioCheckedColor : colorWhite,
          borderBlockStart: 0,
          borderInlineStart: 0,
          borderRadius: radioSize,
          transform: 'scale(0)',
          opacity: 0,
          transition: `all ${motionDurationSlow} ${motionEaseInOutCirc}`,
          content: '""'
        },
        boxSizing: 'border-box',
        position: 'relative',
        insetBlockStart: 0,
        insetInlineStart: 0,
        display: 'block',
        width: radioSize,
        height: radioSize,
        backgroundColor: radioButtonBg,
        borderColor: colorBorder,
        borderStyle: 'solid',
        borderWidth: lineWidth,
        borderRadius: '50%',
        transition: `all ${motionDurationMid}`
      },
      [`${componentCls}-input`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineEnd: 0,
        insetBlockEnd: 0,
        insetInlineStart: 0,
        zIndex: 1,
        cursor: 'pointer',
        opacity: 0
      },
      // 选中状态
      [`${componentCls}-checked`]: {
        [radioInnerPrefixCls]: {
          borderColor: radioCheckedColor,
          backgroundColor: wireframe ? radioButtonBg : radioCheckedColor,
          '&::after': {
            transform: `scale(${radioDotSize / radioSize})`,
            opacity: 1,
            transition: `all ${motionDurationSlow} ${motionEaseInOutCirc}`
          }
        }
      },
      [`${componentCls}-disabled`]: {
        cursor: 'not-allowed',
        [radioInnerPrefixCls]: {
          backgroundColor: colorBgContainerDisabled,
          borderColor: colorBorder,
          cursor: 'not-allowed',
          '&::after': {
            backgroundColor: radioDotDisabledColor
          }
        },
        [`${componentCls}-input`]: {
          cursor: 'not-allowed'
        },
        [`${componentCls}-disabled + span`]: {
          color: colorTextDisabled,
          cursor: 'not-allowed'
        },
        [`&${componentCls}-checked`]: {
          [radioInnerPrefixCls]: {
            '&::after': {
              transform: `scale(${radioDotDisabledSize / radioSize})`
            }
          }
        }
      },
      [`span${componentCls} + *`]: {
        paddingInlineStart: paddingXS,
        paddingInlineEnd: paddingXS
      }
    })
  };
};
// Styles from radio-button
const getRadioButtonStyle = token => {
  const {
    radioButtonColor,
    controlHeight,
    componentCls,
    lineWidth,
    lineType,
    colorBorder,
    motionDurationSlow,
    motionDurationMid,
    radioButtonPaddingHorizontal,
    fontSize,
    radioButtonBg,
    fontSizeLG,
    controlHeightLG,
    controlHeightSM,
    paddingXS,
    borderRadius,
    borderRadiusSM,
    borderRadiusLG,
    radioCheckedColor,
    radioButtonCheckedBg,
    radioButtonHoverColor,
    radioButtonActiveColor,
    radioSolidCheckedColor,
    colorTextDisabled,
    colorBgContainerDisabled,
    radioDisabledButtonCheckedColor,
    radioDisabledButtonCheckedBg
  } = token;
  return {
    [`${componentCls}-button-wrapper`]: {
      position: 'relative',
      display: 'inline-block',
      height: controlHeight,
      margin: 0,
      paddingInline: radioButtonPaddingHorizontal,
      paddingBlock: 0,
      color: radioButtonColor,
      fontSize,
      lineHeight: `${controlHeight - lineWidth * 2}px`,
      background: radioButtonBg,
      border: `${lineWidth}px ${lineType} ${colorBorder}`,
      // strange align fix for chrome but works
      // https://gw.alipayobjects.com/zos/rmsportal/VFTfKXJuogBAXcvfAUWJ.gif
      borderBlockStartWidth: lineWidth + 0.02,
      borderInlineStartWidth: 0,
      borderInlineEndWidth: lineWidth,
      cursor: 'pointer',
      transition: [`color ${motionDurationMid}`, `background ${motionDurationMid}`, `border-color ${motionDurationMid}`, `box-shadow ${motionDurationMid}`].join(','),
      a: {
        color: radioButtonColor
      },
      [`> ${componentCls}-button`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineStart: 0,
        zIndex: -1,
        width: '100%',
        height: '100%'
      },
      '&:not(:first-child)': {
        '&::before': {
          position: 'absolute',
          insetBlockStart: -lineWidth,
          insetInlineStart: -lineWidth,
          display: 'block',
          boxSizing: 'content-box',
          width: 1,
          height: '100%',
          paddingBlock: lineWidth,
          paddingInline: 0,
          backgroundColor: colorBorder,
          transition: `background-color ${motionDurationSlow}`,
          content: '""'
        }
      },
      '&:first-child': {
        borderInlineStart: `${lineWidth}px ${lineType} ${colorBorder}`,
        borderStartStartRadius: borderRadius,
        borderEndStartRadius: borderRadius
      },
      '&:last-child': {
        borderStartEndRadius: borderRadius,
        borderEndEndRadius: borderRadius
      },
      '&:first-child:last-child': {
        borderRadius
      },
      [`${componentCls}-group-large &`]: {
        height: controlHeightLG,
        fontSize: fontSizeLG,
        lineHeight: `${controlHeightLG - lineWidth * 2}px`,
        '&:first-child': {
          borderStartStartRadius: borderRadiusLG,
          borderEndStartRadius: borderRadiusLG
        },
        '&:last-child': {
          borderStartEndRadius: borderRadiusLG,
          borderEndEndRadius: borderRadiusLG
        }
      },
      [`${componentCls}-group-small &`]: {
        height: controlHeightSM,
        paddingInline: paddingXS - lineWidth,
        paddingBlock: 0,
        lineHeight: `${controlHeightSM - lineWidth * 2}px`,
        '&:first-child': {
          borderStartStartRadius: borderRadiusSM,
          borderEndStartRadius: borderRadiusSM
        },
        '&:last-child': {
          borderStartEndRadius: borderRadiusSM,
          borderEndEndRadius: borderRadiusSM
        }
      },
      '&:hover': {
        position: 'relative',
        color: radioCheckedColor
      },
      '&:has(:focus-visible)': _extends({}, genFocusOutline(token)),
      [`${componentCls}-inner, input[type='checkbox'], input[type='radio']`]: {
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: 'none'
      },
      [`&-checked:not(${componentCls}-button-wrapper-disabled)`]: {
        zIndex: 1,
        color: radioCheckedColor,
        background: radioButtonCheckedBg,
        borderColor: radioCheckedColor,
        '&::before': {
          backgroundColor: radioCheckedColor
        },
        '&:first-child': {
          borderColor: radioCheckedColor
        },
        '&:hover': {
          color: radioButtonHoverColor,
          borderColor: radioButtonHoverColor,
          '&::before': {
            backgroundColor: radioButtonHoverColor
          }
        },
        '&:active': {
          color: radioButtonActiveColor,
          borderColor: radioButtonActiveColor,
          '&::before': {
            backgroundColor: radioButtonActiveColor
          }
        }
      },
      [`${componentCls}-group-solid &-checked:not(${componentCls}-button-wrapper-disabled)`]: {
        color: radioSolidCheckedColor,
        background: radioCheckedColor,
        borderColor: radioCheckedColor,
        '&:hover': {
          color: radioSolidCheckedColor,
          background: radioButtonHoverColor,
          borderColor: radioButtonHoverColor
        },
        '&:active': {
          color: radioSolidCheckedColor,
          background: radioButtonActiveColor,
          borderColor: radioButtonActiveColor
        }
      },
      '&-disabled': {
        color: colorTextDisabled,
        backgroundColor: colorBgContainerDisabled,
        borderColor: colorBorder,
        cursor: 'not-allowed',
        '&:first-child, &:hover': {
          color: colorTextDisabled,
          backgroundColor: colorBgContainerDisabled,
          borderColor: colorBorder
        }
      },
      [`&-disabled${componentCls}-button-wrapper-checked`]: {
        color: radioDisabledButtonCheckedColor,
        backgroundColor: radioDisabledButtonCheckedBg,
        borderColor: colorBorder,
        boxShadow: 'none'
      }
    }
  };
};
// ============================== Export ==============================
const useStyle$2 = genComponentStyleHook('Radio', token => {
  const {
    padding,
    lineWidth,
    controlItemBgActiveDisabled,
    colorTextDisabled,
    colorBgContainer,
    fontSizeLG,
    controlOutline,
    colorPrimaryHover,
    colorPrimaryActive,
    colorText,
    colorPrimary,
    marginXS,
    controlOutlineWidth,
    colorTextLightSolid,
    wireframe
  } = token;
  // Radio
  const radioFocusShadow = `0 0 0 ${controlOutlineWidth}px ${controlOutline}`;
  const radioButtonFocusShadow = radioFocusShadow;
  const radioSize = fontSizeLG;
  const dotPadding = 4; // Fixed value
  const radioDotDisabledSize = radioSize - dotPadding * 2;
  const radioDotSize = wireframe ? radioDotDisabledSize : radioSize - (dotPadding + lineWidth) * 2;
  const radioCheckedColor = colorPrimary;
  // Radio buttons
  const radioButtonColor = colorText;
  const radioButtonHoverColor = colorPrimaryHover;
  const radioButtonActiveColor = colorPrimaryActive;
  const radioButtonPaddingHorizontal = padding - lineWidth;
  const radioDisabledButtonCheckedColor = colorTextDisabled;
  const radioWrapperMarginRight = marginXS;
  const radioToken = merge(token, {
    radioFocusShadow,
    radioButtonFocusShadow,
    radioSize,
    radioDotSize,
    radioDotDisabledSize,
    radioCheckedColor,
    radioDotDisabledColor: colorTextDisabled,
    radioSolidCheckedColor: colorTextLightSolid,
    radioButtonBg: colorBgContainer,
    radioButtonCheckedBg: colorBgContainer,
    radioButtonColor,
    radioButtonHoverColor,
    radioButtonActiveColor,
    radioButtonPaddingHorizontal,
    radioDisabledButtonCheckedBg: controlItemBgActiveDisabled,
    radioDisabledButtonCheckedColor,
    radioWrapperMarginRight
  });
  return [getGroupRadioStyle(radioToken), getRadioBasicStyle(radioToken), getRadioButtonStyle(radioToken)];
});

var __rest$7 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const radioProps = () => ({
  prefixCls: String,
  checked: booleanType(),
  disabled: booleanType(),
  isGroup: booleanType(),
  value: PropTypes.any,
  name: String,
  id: String,
  autofocus: booleanType(),
  onChange: functionType(),
  onFocus: functionType(),
  onBlur: functionType(),
  onClick: functionType(),
  'onUpdate:checked': functionType(),
  'onUpdate:value': functionType()
});
const Radio = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ARadio',
  inheritAttrs: false,
  props: radioProps(),
  setup(props, _ref) {
    let {
      emit,
      expose,
      slots,
      attrs
    } = _ref;
    const formItemContext = useInjectFormItemContext();
    const formItemInputContext = FormItemInputContext.useInject();
    const radioOptionTypeContext = useInjectRadioOptionTypeContext();
    const radioGroupContext = useInjectRadioGroupContext();
    const disabledContext = useInjectDisabled();
    const mergedDisabled = computed(() => {
      var _a;
      return (_a = disabled.value) !== null && _a !== void 0 ? _a : disabledContext.value;
    });
    const vcCheckbox = ref();
    const {
      prefixCls: radioPrefixCls,
      direction,
      disabled
    } = useConfigInject('radio', props);
    const prefixCls = computed(() => (radioGroupContext === null || radioGroupContext === void 0 ? void 0 : radioGroupContext.optionType.value) === 'button' || radioOptionTypeContext === 'button' ? `${radioPrefixCls.value}-button` : radioPrefixCls.value);
    const contextDisabled = useInjectDisabled();
    // Style
    const [wrapSSR, hashId] = useStyle$2(radioPrefixCls);
    const focus = () => {
      vcCheckbox.value.focus();
    };
    const blur = () => {
      vcCheckbox.value.blur();
    };
    expose({
      focus,
      blur
    });
    const handleChange = event => {
      const targetChecked = event.target.checked;
      emit('update:checked', targetChecked);
      emit('update:value', targetChecked);
      emit('change', event);
      formItemContext.onFieldChange();
    };
    const onChange = e => {
      emit('change', e);
      if (radioGroupContext && radioGroupContext.onChange) {
        radioGroupContext.onChange(e);
      }
    };
    return () => {
      var _a;
      const radioGroup = radioGroupContext;
      const {
          prefixCls: customizePrefixCls,
          id = formItemContext.id.value
        } = props,
        restProps = __rest$7(props, ["prefixCls", "id"]);
      const rProps = _extends(_extends({
        prefixCls: prefixCls.value,
        id
      }, omit(restProps, ['onUpdate:checked', 'onUpdate:value'])), {
        disabled: (_a = disabled.value) !== null && _a !== void 0 ? _a : contextDisabled.value
      });
      if (radioGroup) {
        rProps.name = radioGroup.name.value;
        rProps.onChange = onChange;
        rProps.checked = props.value === radioGroup.value.value;
        rProps.disabled = mergedDisabled.value || radioGroup.disabled.value;
      } else {
        rProps.onChange = handleChange;
      }
      const wrapperClassString = classNames({
        [`${prefixCls.value}-wrapper`]: true,
        [`${prefixCls.value}-wrapper-checked`]: rProps.checked,
        [`${prefixCls.value}-wrapper-disabled`]: rProps.disabled,
        [`${prefixCls.value}-wrapper-rtl`]: direction.value === 'rtl',
        [`${prefixCls.value}-wrapper-in-form-item`]: formItemInputContext.isFormItemInput
      }, attrs.class, hashId.value);
      return wrapSSR(createVNode("label", _objectSpread$5(_objectSpread$5({}, attrs), {}, {
        "class": wrapperClassString
      }), [createVNode(VcCheckbox, _objectSpread$5(_objectSpread$5({}, rProps), {}, {
        "type": "radio",
        "ref": vcCheckbox
      }), null), slots.default && createVNode("span", null, [slots.default()])]));
    };
  }
});

const radioGroupProps = () => ({
  prefixCls: String,
  value: PropTypes.any,
  size: stringType(),
  options: arrayType(),
  disabled: booleanType(),
  name: String,
  buttonStyle: stringType('outline'),
  id: String,
  optionType: stringType('default'),
  onChange: functionType(),
  'onUpdate:value': functionType()
});
const Group = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ARadioGroup',
  inheritAttrs: false,
  props: radioGroupProps(),
  // emits: ['update:value', 'change'],
  setup(props, _ref) {
    let {
      slots,
      emit,
      attrs
    } = _ref;
    const formItemContext = useInjectFormItemContext();
    const {
      prefixCls,
      direction,
      size
    } = useConfigInject('radio', props);
    // Style
    const [wrapSSR, hashId] = useStyle$2(prefixCls);
    const stateValue = ref(props.value);
    const updatingValue = ref(false);
    watch(() => props.value, val => {
      stateValue.value = val;
      updatingValue.value = false;
    });
    const onRadioChange = ev => {
      const lastValue = stateValue.value;
      const {
        value
      } = ev.target;
      if (!('value' in props)) {
        stateValue.value = value;
      }
      // nextTick for https://github.com/vueComponent/ant-design-vue/issues/1280
      if (!updatingValue.value && value !== lastValue) {
        updatingValue.value = true;
        emit('update:value', value);
        emit('change', ev);
        formItemContext.onFieldChange();
      }
      nextTick(() => {
        updatingValue.value = false;
      });
    };
    useProvideRadioGroupContext({
      onChange: onRadioChange,
      value: stateValue,
      disabled: computed(() => props.disabled),
      name: computed(() => props.name),
      optionType: computed(() => props.optionType)
    });
    return () => {
      var _a;
      const {
        options,
        buttonStyle,
        id = formItemContext.id.value
      } = props;
      const groupPrefixCls = `${prefixCls.value}-group`;
      const classString = classNames(groupPrefixCls, `${groupPrefixCls}-${buttonStyle}`, {
        [`${groupPrefixCls}-${size.value}`]: size.value,
        [`${groupPrefixCls}-rtl`]: direction.value === 'rtl'
      }, attrs.class, hashId.value);
      let children = null;
      if (options && options.length > 0) {
        children = options.map(option => {
          if (typeof option === 'string' || typeof option === 'number') {
            return createVNode(Radio, {
              "key": option,
              "prefixCls": prefixCls.value,
              "disabled": props.disabled,
              "value": option,
              "checked": stateValue.value === option
            }, {
              default: () => [option]
            });
          }
          const {
            value,
            disabled,
            label
          } = option;
          return createVNode(Radio, {
            "key": `radio-group-value-options-${value}`,
            "prefixCls": prefixCls.value,
            "disabled": disabled || props.disabled,
            "value": value,
            "checked": stateValue.value === value
          }, {
            default: () => [label]
          });
        });
      } else {
        children = (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
      }
      return wrapSSR(createVNode("div", _objectSpread$5(_objectSpread$5({}, attrs), {}, {
        "class": classString,
        "id": id
      }), [children]));
    };
  }
});

const Button = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ARadioButton',
  inheritAttrs: false,
  props: radioProps(),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('radio', props);
    useProvideRadioOptionTypeContext('button');
    return () => {
      var _a;
      return createVNode(Radio, _objectSpread$5(_objectSpread$5(_objectSpread$5({}, attrs), props), {}, {
        "prefixCls": prefixCls.value
      }), {
        default: () => [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]
      });
    };
  }
});

Radio.Group = Group;
Radio.Button = Button;
/* istanbul ignore next */
Radio.install = function (app) {
  app.component(Radio.name, Radio);
  app.component(Radio.Group.name, Radio.Group);
  app.component(Radio.Button.name, Radio.Button);
  return app;
};

const abstractCheckboxGroupProps = () => {
  return {
    name: String,
    prefixCls: String,
    options: arrayType([]),
    disabled: Boolean,
    id: String
  };
};
const checkboxGroupProps = () => {
  return _extends(_extends({}, abstractCheckboxGroupProps()), {
    defaultValue: arrayType(),
    value: arrayType(),
    onChange: functionType(),
    'onUpdate:value': functionType()
  });
};
const abstractCheckboxProps = () => {
  return {
    prefixCls: String,
    defaultChecked: booleanType(),
    checked: booleanType(),
    disabled: booleanType(),
    isGroup: booleanType(),
    value: PropTypes.any,
    name: String,
    id: String,
    indeterminate: booleanType(),
    type: stringType('checkbox'),
    autofocus: booleanType(),
    onChange: functionType(),
    'onUpdate:checked': functionType(),
    onClick: functionType(),
    skipGroup: booleanType(false)
  };
};
const checkboxProps = () => {
  return _extends(_extends({}, abstractCheckboxProps()), {
    indeterminate: booleanType(false)
  });
};
const CheckboxGroupContextKey = Symbol('CheckboxGroupContext');

var __rest$6 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const Checkbox = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ACheckbox',
  inheritAttrs: false,
  __ANT_CHECKBOX: true,
  props: checkboxProps(),
  // emits: ['change', 'update:checked'],
  setup(props, _ref) {
    let {
      emit,
      attrs,
      slots,
      expose
    } = _ref;
    const formItemContext = useInjectFormItemContext();
    const formItemInputContext = FormItemInputContext.useInject();
    const {
      prefixCls,
      direction,
      disabled
    } = useConfigInject('checkbox', props);
    const contextDisabled = useInjectDisabled();
    // style
    const [wrapSSR, hashId] = useStyle$3(prefixCls);
    const checkboxGroup = inject(CheckboxGroupContextKey, undefined);
    const uniId = Symbol('checkboxUniId');
    const mergedDisabled = computed(() => {
      return (checkboxGroup === null || checkboxGroup === void 0 ? void 0 : checkboxGroup.disabled.value) || disabled.value;
    });
    watchEffect(() => {
      if (!props.skipGroup && checkboxGroup) {
        checkboxGroup.registerValue(uniId, props.value);
      }
    });
    onBeforeUnmount(() => {
      if (checkboxGroup) {
        checkboxGroup.cancelValue(uniId);
      }
    });
    onMounted(() => {
      warning(!!(props.checked !== undefined || checkboxGroup || props.value === undefined));
    });
    const handleChange = event => {
      const targetChecked = event.target.checked;
      emit('update:checked', targetChecked);
      emit('change', event);
      formItemContext.onFieldChange();
    };
    const checkboxRef = ref();
    const focus = () => {
      var _a;
      (_a = checkboxRef.value) === null || _a === void 0 ? void 0 : _a.focus();
    };
    const blur = () => {
      var _a;
      (_a = checkboxRef.value) === null || _a === void 0 ? void 0 : _a.blur();
    };
    expose({
      focus,
      blur
    });
    return () => {
      var _a;
      const children = flattenChildren((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots));
      const {
          indeterminate,
          skipGroup,
          id = formItemContext.id.value
        } = props,
        restProps = __rest$6(props, ["indeterminate", "skipGroup", "id"]);
      const {
          onMouseenter,
          onMouseleave,
          onInput,
          class: className,
          style
        } = attrs,
        restAttrs = __rest$6(attrs, ["onMouseenter", "onMouseleave", "onInput", "class", "style"]);
      const checkboxProps = _extends(_extends(_extends(_extends({}, restProps), {
        id,
        prefixCls: prefixCls.value
      }), restAttrs), {
        disabled: mergedDisabled.value
      });
      if (checkboxGroup && !skipGroup) {
        checkboxProps.onChange = function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          emit('change', ...args);
          checkboxGroup.toggleOption({
            label: children,
            value: props.value
          });
        };
        checkboxProps.name = checkboxGroup.name.value;
        checkboxProps.checked = checkboxGroup.mergedValue.value.includes(props.value);
        checkboxProps.disabled = mergedDisabled.value || contextDisabled.value;
        checkboxProps.indeterminate = indeterminate;
      } else {
        checkboxProps.onChange = handleChange;
      }
      const classString = classNames({
        [`${prefixCls.value}-wrapper`]: true,
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
        [`${prefixCls.value}-wrapper-checked`]: checkboxProps.checked,
        [`${prefixCls.value}-wrapper-disabled`]: checkboxProps.disabled,
        [`${prefixCls.value}-wrapper-in-form-item`]: formItemInputContext.isFormItemInput
      }, className, hashId.value);
      const checkboxClass = classNames({
        [`${prefixCls.value}-indeterminate`]: indeterminate
      }, hashId.value);
      const ariaChecked = indeterminate ? 'mixed' : undefined;
      return wrapSSR(createVNode("label", {
        "class": classString,
        "style": style,
        "onMouseenter": onMouseenter,
        "onMouseleave": onMouseleave
      }, [createVNode(VcCheckbox, _objectSpread$5(_objectSpread$5({
        "aria-checked": ariaChecked
      }, checkboxProps), {}, {
        "class": checkboxClass,
        "ref": checkboxRef
      }), null), children.length ? createVNode("span", null, [children]) : null]));
    };
  }
});

const CheckboxGroup = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ACheckboxGroup',
  inheritAttrs: false,
  props: checkboxGroupProps(),
  // emits: ['change', 'update:value'],
  setup(props, _ref) {
    let {
      slots,
      attrs,
      emit,
      expose
    } = _ref;
    const formItemContext = useInjectFormItemContext();
    const {
      prefixCls,
      direction
    } = useConfigInject('checkbox', props);
    const groupPrefixCls = computed(() => `${prefixCls.value}-group`);
    // style
    const [wrapSSR, hashId] = useStyle$3(groupPrefixCls);
    const mergedValue = ref((props.value === undefined ? props.defaultValue : props.value) || []);
    watch(() => props.value, () => {
      mergedValue.value = props.value || [];
    });
    const options = computed(() => {
      return props.options.map(option => {
        if (typeof option === 'string' || typeof option === 'number') {
          return {
            label: option,
            value: option
          };
        }
        return option;
      });
    });
    const triggerUpdate = ref(Symbol());
    const registeredValuesMap = ref(new Map());
    const cancelValue = id => {
      registeredValuesMap.value.delete(id);
      triggerUpdate.value = Symbol();
    };
    const registerValue = (id, value) => {
      registeredValuesMap.value.set(id, value);
      triggerUpdate.value = Symbol();
    };
    const registeredValues = ref(new Map());
    watch(triggerUpdate, () => {
      const valuseMap = new Map();
      for (const value of registeredValuesMap.value.values()) {
        valuseMap.set(value, true);
      }
      registeredValues.value = valuseMap;
    });
    const toggleOption = option => {
      const optionIndex = mergedValue.value.indexOf(option.value);
      const value = [...mergedValue.value];
      if (optionIndex === -1) {
        value.push(option.value);
      } else {
        value.splice(optionIndex, 1);
      }
      if (props.value === undefined) {
        mergedValue.value = value;
      }
      const val = value.filter(val => registeredValues.value.has(val)).sort((a, b) => {
        const indexA = options.value.findIndex(opt => opt.value === a);
        const indexB = options.value.findIndex(opt => opt.value === b);
        return indexA - indexB;
      });
      emit('update:value', val);
      emit('change', val);
      formItemContext.onFieldChange();
    };
    provide(CheckboxGroupContextKey, {
      cancelValue,
      registerValue,
      toggleOption,
      mergedValue,
      name: computed(() => props.name),
      disabled: computed(() => props.disabled)
    });
    expose({
      mergedValue
    });
    return () => {
      var _a;
      const {
        id = formItemContext.id.value
      } = props;
      let children = null;
      if (options.value && options.value.length > 0) {
        children = options.value.map(option => {
          var _a;
          return createVNode(Checkbox, {
            "prefixCls": prefixCls.value,
            "key": option.value.toString(),
            "disabled": 'disabled' in option ? option.disabled : props.disabled,
            "indeterminate": option.indeterminate,
            "value": option.value,
            "checked": mergedValue.value.indexOf(option.value) !== -1,
            "onChange": option.onChange,
            "class": `${groupPrefixCls.value}-item`
          }, {
            default: () => [slots.label !== undefined ? (_a = slots.label) === null || _a === void 0 ? void 0 : _a.call(slots, option) : option.label]
          });
        });
      }
      return wrapSSR(createVNode("div", _objectSpread$5(_objectSpread$5({}, attrs), {}, {
        "class": [groupPrefixCls.value, {
          [`${groupPrefixCls.value}-rtl`]: direction.value === 'rtl'
        }, attrs.class, hashId.value],
        "id": id
      }), [children || ((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots))]));
    };
  }
});

Checkbox.Group = CheckboxGroup;
/* istanbul ignore next */
Checkbox.install = function (app) {
  app.component(Checkbox.name, Checkbox);
  app.component(CheckboxGroup.name, CheckboxGroup);
  return app;
};

// This icon file is generated automatically.
var DoubleLeftOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z" } }] }, "name": "double-left", "theme": "outlined" };

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$4(target, key, source[key]); }); } return target; }

function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DoubleLeftOutlined = function DoubleLeftOutlined(props, context) {
  var p = _objectSpread$4({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$4({}, p, {
    "icon": DoubleLeftOutlined$1
  }), null);
};

DoubleLeftOutlined.displayName = 'DoubleLeftOutlined';
DoubleLeftOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var DoubleRightOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 00188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 00492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z" } }] }, "name": "double-right", "theme": "outlined" };

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }

function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DoubleRightOutlined = function DoubleRightOutlined(props, context) {
  var p = _objectSpread$3({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$3({}, p, {
    "icon": DoubleRightOutlined$1
  }), null);
};

DoubleRightOutlined.displayName = 'DoubleRightOutlined';
DoubleRightOutlined.inheritAttrs = false;

const MiniSelect = defineComponent({
  name: 'MiniSelect',
  compatConfig: {
    MODE: 3
  },
  inheritAttrs: false,
  props: selectProps(),
  Option: Select.Option,
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    return () => {
      const selelctProps = _extends(_extends(_extends({}, props), {
        size: 'small'
      }), attrs);
      return createVNode(Select, selelctProps, slots);
    };
  }
});
const MiddleSelect = defineComponent({
  name: 'MiddleSelect',
  inheritAttrs: false,
  props: selectProps(),
  Option: Select.Option,
  setup(props, _ref2) {
    let {
      attrs,
      slots
    } = _ref2;
    return () => {
      const selelctProps = _extends(_extends(_extends({}, props), {
        size: 'middle'
      }), attrs);
      return createVNode(Select, selelctProps, slots);
    };
  }
});

const Pager = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'Pager',
  inheritAttrs: false,
  props: {
    rootPrefixCls: String,
    page: Number,
    active: {
      type: Boolean,
      default: undefined
    },
    last: {
      type: Boolean,
      default: undefined
    },
    locale: PropTypes.object,
    showTitle: {
      type: Boolean,
      default: undefined
    },
    itemRender: {
      type: Function,
      default: () => {}
    },
    onClick: {
      type: Function
    },
    onKeypress: {
      type: Function
    }
  },
  eimt: ['click', 'keypress'],
  setup(props, _ref) {
    let {
      emit,
      attrs
    } = _ref;
    const handleClick = () => {
      emit('click', props.page);
    };
    const handleKeyPress = event => {
      emit('keypress', event, handleClick, props.page);
    };
    return () => {
      const {
        showTitle,
        page,
        itemRender
      } = props;
      const {
        class: _cls,
        style
      } = attrs;
      const prefixCls = `${props.rootPrefixCls}-item`;
      const cls = classNames(prefixCls, `${prefixCls}-${props.page}`, {
        [`${prefixCls}-active`]: props.active,
        [`${prefixCls}-disabled`]: !props.page
      }, _cls);
      return createVNode("li", {
        "onClick": handleClick,
        "onKeypress": handleKeyPress,
        "title": showTitle ? String(page) : null,
        "tabindex": "0",
        "class": cls,
        "style": style
      }, [itemRender({
        page,
        type: 'page',
        originalElement: createVNode("a", {
          "rel": "nofollow"
        }, [page])
      })]);
    };
  }
});

const KEYCODE = {
  ENTER: 13,
  ARROW_UP: 38,
  ARROW_DOWN: 40
};

const Options = defineComponent({
  compatConfig: {
    MODE: 3
  },
  props: {
    disabled: {
      type: Boolean,
      default: undefined
    },
    changeSize: Function,
    quickGo: Function,
    selectComponentClass: PropTypes.any,
    current: Number,
    pageSizeOptions: PropTypes.array.def(['10', '20', '50', '100']),
    pageSize: Number,
    buildOptionText: Function,
    locale: PropTypes.object,
    rootPrefixCls: String,
    selectPrefixCls: String,
    goButton: PropTypes.any
  },
  setup(props) {
    const goInputText = ref('');
    const validValue = computed(() => {
      return !goInputText.value || isNaN(goInputText.value) ? undefined : Number(goInputText.value);
    });
    const defaultBuildOptionText = opt => {
      return `${opt.value} ${props.locale.items_per_page}`;
    };
    const handleChange = e => {
      const {
        value
      } = e.target;
      if (goInputText.value === value) return;
      goInputText.value = value;
    };
    const handleBlur = e => {
      const {
        goButton,
        quickGo,
        rootPrefixCls
      } = props;
      if (goButton || goInputText.value === '') {
        return;
      }
      if (e.relatedTarget && (e.relatedTarget.className.indexOf(`${rootPrefixCls}-item-link`) >= 0 || e.relatedTarget.className.indexOf(`${rootPrefixCls}-item`) >= 0)) {
        goInputText.value = '';
        return;
      } else {
        quickGo(validValue.value);
        goInputText.value = '';
      }
    };
    const go = e => {
      if (goInputText.value === '') {
        return;
      }
      if (e.keyCode === KEYCODE.ENTER || e.type === 'click') {
        // https://github.com/vueComponent/ant-design-vue/issues/1316
        props.quickGo(validValue.value);
        goInputText.value = '';
      }
    };
    const pageSizeOptions = computed(() => {
      const {
        pageSize,
        pageSizeOptions
      } = props;
      if (pageSizeOptions.some(option => option.toString() === pageSize.toString())) {
        return pageSizeOptions;
      }
      return pageSizeOptions.concat([pageSize.toString()]).sort((a, b) => {
        // eslint-disable-next-line no-restricted-globals
        const numberA = isNaN(Number(a)) ? 0 : Number(a);
        // eslint-disable-next-line no-restricted-globals
        const numberB = isNaN(Number(b)) ? 0 : Number(b);
        return numberA - numberB;
      });
    });
    return () => {
      const {
        rootPrefixCls,
        locale,
        changeSize,
        quickGo,
        goButton,
        selectComponentClass: Select,
        selectPrefixCls,
        pageSize,
        disabled
      } = props;
      const prefixCls = `${rootPrefixCls}-options`;
      let changeSelect = null;
      let goInput = null;
      let gotoButton = null;
      if (!changeSize && !quickGo) {
        return null;
      }
      if (changeSize && Select) {
        const buildOptionText = props.buildOptionText || defaultBuildOptionText;
        const options = pageSizeOptions.value.map((opt, i) => createVNode(Select.Option, {
          "key": i,
          "value": opt
        }, {
          default: () => [buildOptionText({
            value: opt
          })]
        }));
        changeSelect = createVNode(Select, {
          "disabled": disabled,
          "prefixCls": selectPrefixCls,
          "showSearch": false,
          "class": `${prefixCls}-size-changer`,
          "optionLabelProp": "children",
          "value": (pageSize || pageSizeOptions.value[0]).toString(),
          "onChange": value => changeSize(Number(value)),
          "getPopupContainer": triggerNode => triggerNode.parentNode
        }, {
          default: () => [options]
        });
      }
      if (quickGo) {
        if (goButton) {
          gotoButton = typeof goButton === 'boolean' ? createVNode("button", {
            "type": "button",
            "onClick": go,
            "onKeyup": go,
            "disabled": disabled,
            "class": `${prefixCls}-quick-jumper-button`
          }, [locale.jump_to_confirm]) : createVNode("span", {
            "onClick": go,
            "onKeyup": go
          }, [goButton]);
        }
        goInput = createVNode("div", {
          "class": `${prefixCls}-quick-jumper`
        }, [locale.jump_to, createVNode(BaseInput, {
          "disabled": disabled,
          "type": "text",
          "value": goInputText.value,
          "onInput": handleChange,
          "onChange": handleChange,
          "onKeyup": go,
          "onBlur": handleBlur
        }, null), locale.page, gotoButton]);
      }
      return createVNode("li", {
        "class": `${prefixCls}`
      }, [changeSelect, goInput]);
    };
  }
});

const LOCALE = {
  // Options.jsx
  items_per_page: '条/页',
  jump_to: '跳至',
  jump_to_confirm: '确定',
  page: '页',
  // Pagination.jsx
  prev_page: '上一页',
  next_page: '下一页',
  prev_5: '向前 5 页',
  next_5: '向后 5 页',
  prev_3: '向前 3 页',
  next_3: '向后 3 页'
};

var __rest$5 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
// 是否是正整数
function isInteger(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}
function defaultItemRender(_ref) {
  let {
    originalElement
  } = _ref;
  return originalElement;
}
function calculatePage(p, state, props) {
  const pageSize = typeof p === 'undefined' ? state.statePageSize : p;
  return Math.floor((props.total - 1) / pageSize) + 1;
}
const VcPagination = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'Pagination',
  mixins: [BaseMixin],
  inheritAttrs: false,
  props: {
    disabled: {
      type: Boolean,
      default: undefined
    },
    prefixCls: PropTypes.string.def('rc-pagination'),
    selectPrefixCls: PropTypes.string.def('rc-select'),
    current: Number,
    defaultCurrent: PropTypes.number.def(1),
    total: PropTypes.number.def(0),
    pageSize: Number,
    defaultPageSize: PropTypes.number.def(10),
    hideOnSinglePage: {
      type: Boolean,
      default: false
    },
    showSizeChanger: {
      type: Boolean,
      default: undefined
    },
    showLessItems: {
      type: Boolean,
      default: false
    },
    // showSizeChange: PropTypes.func.def(noop),
    selectComponentClass: PropTypes.any,
    showPrevNextJumpers: {
      type: Boolean,
      default: true
    },
    showQuickJumper: PropTypes.oneOfType([PropTypes.looseBool, PropTypes.object]).def(false),
    showTitle: {
      type: Boolean,
      default: true
    },
    pageSizeOptions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    buildOptionText: Function,
    showTotal: Function,
    simple: {
      type: Boolean,
      default: undefined
    },
    locale: PropTypes.object.def(LOCALE),
    itemRender: PropTypes.func.def(defaultItemRender),
    prevIcon: PropTypes.any,
    nextIcon: PropTypes.any,
    jumpPrevIcon: PropTypes.any,
    jumpNextIcon: PropTypes.any,
    totalBoundaryShowSizeChanger: PropTypes.number.def(50)
  },
  data() {
    const props = this.$props;
    let current = firstNotUndefined([this.current, this.defaultCurrent]);
    const pageSize = firstNotUndefined([this.pageSize, this.defaultPageSize]);
    current = Math.min(current, calculatePage(pageSize, undefined, props));
    return {
      stateCurrent: current,
      stateCurrentInputValue: current,
      statePageSize: pageSize
    };
  },
  watch: {
    current(val) {
      this.setState({
        stateCurrent: val,
        stateCurrentInputValue: val
      });
    },
    pageSize(val) {
      const newState = {};
      let current = this.stateCurrent;
      const newCurrent = calculatePage(val, this.$data, this.$props);
      current = current > newCurrent ? newCurrent : current;
      if (!hasProp(this, 'current')) {
        newState.stateCurrent = current;
        newState.stateCurrentInputValue = current;
      }
      newState.statePageSize = val;
      this.setState(newState);
    },
    stateCurrent(_val, oldValue) {
      // When current page change, fix focused style of prev item
      // A hacky solution of https://github.com/ant-design/ant-design/issues/8948
      this.$nextTick(() => {
        if (this.$refs.paginationNode) {
          const lastCurrentNode = this.$refs.paginationNode.querySelector(`.${this.prefixCls}-item-${oldValue}`);
          if (lastCurrentNode && document.activeElement === lastCurrentNode) {
            lastCurrentNode.blur();
          }
        }
      });
    },
    total() {
      const newState = {};
      const newCurrent = calculatePage(this.pageSize, this.$data, this.$props);
      if (hasProp(this, 'current')) {
        const current = Math.min(this.current, newCurrent);
        newState.stateCurrent = current;
        newState.stateCurrentInputValue = current;
      } else {
        let current = this.stateCurrent;
        if (current === 0 && newCurrent > 0) {
          current = 1;
        } else {
          current = Math.min(this.stateCurrent, newCurrent);
        }
        newState.stateCurrent = current;
      }
      this.setState(newState);
    }
  },
  methods: {
    getJumpPrevPage() {
      return Math.max(1, this.stateCurrent - (this.showLessItems ? 3 : 5));
    },
    getJumpNextPage() {
      return Math.min(calculatePage(undefined, this.$data, this.$props), this.stateCurrent + (this.showLessItems ? 3 : 5));
    },
    getItemIcon(icon, label) {
      const {
        prefixCls
      } = this.$props;
      const iconNode = getComponent(this, icon, this.$props) || createVNode("button", {
        "type": "button",
        "aria-label": label,
        "class": `${prefixCls}-item-link`
      }, null);
      return iconNode;
    },
    getValidValue(e) {
      const inputValue = e.target.value;
      const allPages = calculatePage(undefined, this.$data, this.$props);
      const {
        stateCurrentInputValue
      } = this.$data;
      let value;
      if (inputValue === '') {
        value = inputValue;
      } else if (isNaN(Number(inputValue))) {
        value = stateCurrentInputValue;
      } else if (inputValue >= allPages) {
        value = allPages;
      } else {
        value = Number(inputValue);
      }
      return value;
    },
    isValid(page) {
      return isInteger(page) && page !== this.stateCurrent;
    },
    shouldDisplayQuickJumper() {
      const {
        showQuickJumper,
        pageSize,
        total
      } = this.$props;
      if (total <= pageSize) {
        return false;
      }
      return showQuickJumper;
    },
    // calculatePage (p) {
    //   let pageSize = p
    //   if (typeof pageSize === 'undefined') {
    //     pageSize = this.statePageSize
    //   }
    //   return Math.floor((this.total - 1) / pageSize) + 1
    // },
    handleKeyDown(event) {
      if (event.keyCode === KEYCODE.ARROW_UP || event.keyCode === KEYCODE.ARROW_DOWN) {
        event.preventDefault();
      }
    },
    handleKeyUp(e) {
      const value = this.getValidValue(e);
      const stateCurrentInputValue = this.stateCurrentInputValue;
      if (value !== stateCurrentInputValue) {
        this.setState({
          stateCurrentInputValue: value
        });
      }
      if (e.keyCode === KEYCODE.ENTER) {
        this.handleChange(value);
      } else if (e.keyCode === KEYCODE.ARROW_UP) {
        this.handleChange(value - 1);
      } else if (e.keyCode === KEYCODE.ARROW_DOWN) {
        this.handleChange(value + 1);
      }
    },
    changePageSize(size) {
      let current = this.stateCurrent;
      const preCurrent = current;
      const newCurrent = calculatePage(size, this.$data, this.$props);
      current = current > newCurrent ? newCurrent : current;
      // fix the issue:
      // Once 'total' is 0, 'current' in 'onShowSizeChange' is 0, which is not correct.
      if (newCurrent === 0) {
        current = this.stateCurrent;
      }
      if (typeof size === 'number') {
        if (!hasProp(this, 'pageSize')) {
          this.setState({
            statePageSize: size
          });
        }
        if (!hasProp(this, 'current')) {
          this.setState({
            stateCurrent: current,
            stateCurrentInputValue: current
          });
        }
      }
      this.__emit('update:pageSize', size);
      if (current !== preCurrent) {
        this.__emit('update:current', current);
      }
      this.__emit('showSizeChange', current, size);
      this.__emit('change', current, size);
    },
    handleChange(p) {
      const {
        disabled
      } = this.$props;
      let page = p;
      if (this.isValid(page) && !disabled) {
        const currentPage = calculatePage(undefined, this.$data, this.$props);
        if (page > currentPage) {
          page = currentPage;
        } else if (page < 1) {
          page = 1;
        }
        if (!hasProp(this, 'current')) {
          this.setState({
            stateCurrent: page,
            stateCurrentInputValue: page
          });
        }
        // this.__emit('input', page)
        this.__emit('update:current', page);
        this.__emit('change', page, this.statePageSize);
        return page;
      }
      return this.stateCurrent;
    },
    prev() {
      if (this.hasPrev()) {
        this.handleChange(this.stateCurrent - 1);
      }
    },
    next() {
      if (this.hasNext()) {
        this.handleChange(this.stateCurrent + 1);
      }
    },
    jumpPrev() {
      this.handleChange(this.getJumpPrevPage());
    },
    jumpNext() {
      this.handleChange(this.getJumpNextPage());
    },
    hasPrev() {
      return this.stateCurrent > 1;
    },
    hasNext() {
      return this.stateCurrent < calculatePage(undefined, this.$data, this.$props);
    },
    getShowSizeChanger() {
      const {
        showSizeChanger,
        total,
        totalBoundaryShowSizeChanger
      } = this.$props;
      if (typeof showSizeChanger !== 'undefined') {
        return showSizeChanger;
      }
      return total > totalBoundaryShowSizeChanger;
    },
    runIfEnter(event, callback) {
      if (event.key === 'Enter' || event.charCode === 13) {
        event.preventDefault();
        for (var _len = arguments.length, restParams = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          restParams[_key - 2] = arguments[_key];
        }
        callback(...restParams);
      }
    },
    runIfEnterPrev(event) {
      this.runIfEnter(event, this.prev);
    },
    runIfEnterNext(event) {
      this.runIfEnter(event, this.next);
    },
    runIfEnterJumpPrev(event) {
      this.runIfEnter(event, this.jumpPrev);
    },
    runIfEnterJumpNext(event) {
      this.runIfEnter(event, this.jumpNext);
    },
    handleGoTO(event) {
      if (event.keyCode === KEYCODE.ENTER || event.type === 'click') {
        this.handleChange(this.stateCurrentInputValue);
      }
    },
    renderPrev(prevPage) {
      const {
        itemRender
      } = this.$props;
      const prevButton = itemRender({
        page: prevPage,
        type: 'prev',
        originalElement: this.getItemIcon('prevIcon', 'prev page')
      });
      const disabled = !this.hasPrev();
      return isValidElement(prevButton) ? cloneElement(prevButton, disabled ? {
        disabled
      } : {}) : prevButton;
    },
    renderNext(nextPage) {
      const {
        itemRender
      } = this.$props;
      const nextButton = itemRender({
        page: nextPage,
        type: 'next',
        originalElement: this.getItemIcon('nextIcon', 'next page')
      });
      const disabled = !this.hasNext();
      return isValidElement(nextButton) ? cloneElement(nextButton, disabled ? {
        disabled
      } : {}) : nextButton;
    }
  },
  render() {
    const {
      prefixCls,
      disabled,
      hideOnSinglePage,
      total,
      locale,
      showQuickJumper,
      showLessItems,
      showTitle,
      showTotal,
      simple,
      itemRender,
      showPrevNextJumpers,
      jumpPrevIcon,
      jumpNextIcon,
      selectComponentClass,
      selectPrefixCls,
      pageSizeOptions
    } = this.$props;
    const {
      stateCurrent,
      statePageSize
    } = this;
    const _a = splitAttrs(this.$attrs).extraAttrs,
      {
        class: className
      } = _a,
      restAttrs = __rest$5(_a, ["class"]);
    // When hideOnSinglePage is true and there is only 1 page, hide the pager
    if (hideOnSinglePage === true && this.total <= statePageSize) {
      return null;
    }
    const allPages = calculatePage(undefined, this.$data, this.$props);
    const pagerList = [];
    let jumpPrev = null;
    let jumpNext = null;
    let firstPager = null;
    let lastPager = null;
    let gotoButton = null;
    const goButton = showQuickJumper && showQuickJumper.goButton;
    const pageBufferSize = showLessItems ? 1 : 2;
    const prevPage = stateCurrent - 1 > 0 ? stateCurrent - 1 : 0;
    const nextPage = stateCurrent + 1 < allPages ? stateCurrent + 1 : allPages;
    const hasPrev = this.hasPrev();
    const hasNext = this.hasNext();
    if (simple) {
      if (goButton) {
        if (typeof goButton === 'boolean') {
          gotoButton = createVNode("button", {
            "type": "button",
            "onClick": this.handleGoTO,
            "onKeyup": this.handleGoTO
          }, [locale.jump_to_confirm]);
        } else {
          gotoButton = createVNode("span", {
            "onClick": this.handleGoTO,
            "onKeyup": this.handleGoTO
          }, [goButton]);
        }
        gotoButton = createVNode("li", {
          "title": showTitle ? `${locale.jump_to}${stateCurrent}/${allPages}` : null,
          "class": `${prefixCls}-simple-pager`
        }, [gotoButton]);
      }
      return createVNode("ul", _objectSpread$5({
        "class": classNames(`${prefixCls} ${prefixCls}-simple`, {
          [`${prefixCls}-disabled`]: disabled
        }, className)
      }, restAttrs), [createVNode("li", {
        "title": showTitle ? locale.prev_page : null,
        "onClick": this.prev,
        "tabindex": hasPrev ? 0 : null,
        "onKeypress": this.runIfEnterPrev,
        "class": classNames(`${prefixCls}-prev`, {
          [`${prefixCls}-disabled`]: !hasPrev
        }),
        "aria-disabled": !hasPrev
      }, [this.renderPrev(prevPage)]), createVNode("li", {
        "title": showTitle ? `${stateCurrent}/${allPages}` : null,
        "class": `${prefixCls}-simple-pager`
      }, [createVNode(BaseInput, {
        "type": "text",
        "value": this.stateCurrentInputValue,
        "disabled": disabled,
        "onKeydown": this.handleKeyDown,
        "onKeyup": this.handleKeyUp,
        "onInput": this.handleKeyUp,
        "onChange": this.handleKeyUp,
        "size": "3"
      }, null), createVNode("span", {
        "class": `${prefixCls}-slash`
      }, [createTextVNode("\uFF0F")]), allPages]), createVNode("li", {
        "title": showTitle ? locale.next_page : null,
        "onClick": this.next,
        "tabindex": hasNext ? 0 : null,
        "onKeypress": this.runIfEnterNext,
        "class": classNames(`${prefixCls}-next`, {
          [`${prefixCls}-disabled`]: !hasNext
        }),
        "aria-disabled": !hasNext
      }, [this.renderNext(nextPage)]), gotoButton]);
    }
    if (allPages <= 3 + pageBufferSize * 2) {
      const pagerProps = {
        locale,
        rootPrefixCls: prefixCls,
        showTitle,
        itemRender,
        onClick: this.handleChange,
        onKeypress: this.runIfEnter
      };
      if (!allPages) {
        pagerList.push(createVNode(Pager, _objectSpread$5(_objectSpread$5({}, pagerProps), {}, {
          "key": "noPager",
          "page": 1,
          "class": `${prefixCls}-item-disabled`
        }), null));
      }
      for (let i = 1; i <= allPages; i += 1) {
        const active = stateCurrent === i;
        pagerList.push(createVNode(Pager, _objectSpread$5(_objectSpread$5({}, pagerProps), {}, {
          "key": i,
          "page": i,
          "active": active
        }), null));
      }
    } else {
      const prevItemTitle = showLessItems ? locale.prev_3 : locale.prev_5;
      const nextItemTitle = showLessItems ? locale.next_3 : locale.next_5;
      if (showPrevNextJumpers) {
        jumpPrev = createVNode("li", {
          "title": this.showTitle ? prevItemTitle : null,
          "key": "prev",
          "onClick": this.jumpPrev,
          "tabindex": "0",
          "onKeypress": this.runIfEnterJumpPrev,
          "class": classNames(`${prefixCls}-jump-prev`, {
            [`${prefixCls}-jump-prev-custom-icon`]: !!jumpPrevIcon
          })
        }, [itemRender({
          page: this.getJumpPrevPage(),
          type: 'jump-prev',
          originalElement: this.getItemIcon('jumpPrevIcon', 'prev page')
        })]);
        jumpNext = createVNode("li", {
          "title": this.showTitle ? nextItemTitle : null,
          "key": "next",
          "tabindex": "0",
          "onClick": this.jumpNext,
          "onKeypress": this.runIfEnterJumpNext,
          "class": classNames(`${prefixCls}-jump-next`, {
            [`${prefixCls}-jump-next-custom-icon`]: !!jumpNextIcon
          })
        }, [itemRender({
          page: this.getJumpNextPage(),
          type: 'jump-next',
          originalElement: this.getItemIcon('jumpNextIcon', 'next page')
        })]);
      }
      lastPager = createVNode(Pager, {
        "locale": locale,
        "last": true,
        "rootPrefixCls": prefixCls,
        "onClick": this.handleChange,
        "onKeypress": this.runIfEnter,
        "key": allPages,
        "page": allPages,
        "active": false,
        "showTitle": showTitle,
        "itemRender": itemRender
      }, null);
      firstPager = createVNode(Pager, {
        "locale": locale,
        "rootPrefixCls": prefixCls,
        "onClick": this.handleChange,
        "onKeypress": this.runIfEnter,
        "key": 1,
        "page": 1,
        "active": false,
        "showTitle": showTitle,
        "itemRender": itemRender
      }, null);
      let left = Math.max(1, stateCurrent - pageBufferSize);
      let right = Math.min(stateCurrent + pageBufferSize, allPages);
      if (stateCurrent - 1 <= pageBufferSize) {
        right = 1 + pageBufferSize * 2;
      }
      if (allPages - stateCurrent <= pageBufferSize) {
        left = allPages - pageBufferSize * 2;
      }
      for (let i = left; i <= right; i += 1) {
        const active = stateCurrent === i;
        pagerList.push(createVNode(Pager, {
          "locale": locale,
          "rootPrefixCls": prefixCls,
          "onClick": this.handleChange,
          "onKeypress": this.runIfEnter,
          "key": i,
          "page": i,
          "active": active,
          "showTitle": showTitle,
          "itemRender": itemRender
        }, null));
      }
      if (stateCurrent - 1 >= pageBufferSize * 2 && stateCurrent !== 1 + 2) {
        pagerList[0] = createVNode(Pager, {
          "locale": locale,
          "rootPrefixCls": prefixCls,
          "onClick": this.handleChange,
          "onKeypress": this.runIfEnter,
          "key": left,
          "page": left,
          "class": `${prefixCls}-item-after-jump-prev`,
          "active": false,
          "showTitle": this.showTitle,
          "itemRender": itemRender
        }, null);
        pagerList.unshift(jumpPrev);
      }
      if (allPages - stateCurrent >= pageBufferSize * 2 && stateCurrent !== allPages - 2) {
        pagerList[pagerList.length - 1] = createVNode(Pager, {
          "locale": locale,
          "rootPrefixCls": prefixCls,
          "onClick": this.handleChange,
          "onKeypress": this.runIfEnter,
          "key": right,
          "page": right,
          "class": `${prefixCls}-item-before-jump-next`,
          "active": false,
          "showTitle": this.showTitle,
          "itemRender": itemRender
        }, null);
        pagerList.push(jumpNext);
      }
      if (left !== 1) {
        pagerList.unshift(firstPager);
      }
      if (right !== allPages) {
        pagerList.push(lastPager);
      }
    }
    let totalText = null;
    if (showTotal) {
      totalText = createVNode("li", {
        "class": `${prefixCls}-total-text`
      }, [showTotal(total, [total === 0 ? 0 : (stateCurrent - 1) * statePageSize + 1, stateCurrent * statePageSize > total ? total : stateCurrent * statePageSize])]);
    }
    const prevDisabled = !hasPrev || !allPages;
    const nextDisabled = !hasNext || !allPages;
    const buildOptionText = this.buildOptionText || this.$slots.buildOptionText;
    return createVNode("ul", _objectSpread$5(_objectSpread$5({
      "unselectable": "on",
      "ref": "paginationNode"
    }, restAttrs), {}, {
      "class": classNames({
        [`${prefixCls}`]: true,
        [`${prefixCls}-disabled`]: disabled
      }, className)
    }), [totalText, createVNode("li", {
      "title": showTitle ? locale.prev_page : null,
      "onClick": this.prev,
      "tabindex": prevDisabled ? null : 0,
      "onKeypress": this.runIfEnterPrev,
      "class": classNames(`${prefixCls}-prev`, {
        [`${prefixCls}-disabled`]: prevDisabled
      }),
      "aria-disabled": prevDisabled
    }, [this.renderPrev(prevPage)]), pagerList, createVNode("li", {
      "title": showTitle ? locale.next_page : null,
      "onClick": this.next,
      "tabindex": nextDisabled ? null : 0,
      "onKeypress": this.runIfEnterNext,
      "class": classNames(`${prefixCls}-next`, {
        [`${prefixCls}-disabled`]: nextDisabled
      }),
      "aria-disabled": nextDisabled
    }, [this.renderNext(nextPage)]), createVNode(Options, {
      "disabled": disabled,
      "locale": locale,
      "rootPrefixCls": prefixCls,
      "selectComponentClass": selectComponentClass,
      "selectPrefixCls": selectPrefixCls,
      "changeSize": this.getShowSizeChanger() ? this.changePageSize : null,
      "current": stateCurrent,
      "pageSize": statePageSize,
      "pageSizeOptions": pageSizeOptions,
      "buildOptionText": buildOptionText || null,
      "quickGo": this.shouldDisplayQuickJumper() ? this.handleChange : null,
      "goButton": goButton
    }, null)]);
  }
});

const genPaginationDisabledStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-disabled`]: {
      '&, &:hover': {
        cursor: 'not-allowed',
        [`${componentCls}-item-link`]: {
          color: token.colorTextDisabled,
          cursor: 'not-allowed'
        }
      },
      '&:focus-visible': {
        cursor: 'not-allowed',
        [`${componentCls}-item-link`]: {
          color: token.colorTextDisabled,
          cursor: 'not-allowed'
        }
      }
    },
    [`&${componentCls}-disabled`]: {
      cursor: 'not-allowed',
      [`&${componentCls}-mini`]: {
        [`
          &:hover ${componentCls}-item:not(${componentCls}-item-active),
          &:active ${componentCls}-item:not(${componentCls}-item-active),
          &:hover ${componentCls}-item-link,
          &:active ${componentCls}-item-link
        `]: {
          backgroundColor: 'transparent'
        }
      },
      [`${componentCls}-item`]: {
        cursor: 'not-allowed',
        '&:hover, &:active': {
          backgroundColor: 'transparent'
        },
        a: {
          color: token.colorTextDisabled,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'not-allowed'
        },
        '&-active': {
          borderColor: token.colorBorder,
          backgroundColor: token.paginationItemDisabledBgActive,
          '&:hover, &:active': {
            backgroundColor: token.paginationItemDisabledBgActive
          },
          a: {
            color: token.paginationItemDisabledColorActive
          }
        }
      },
      [`${componentCls}-item-link`]: {
        color: token.colorTextDisabled,
        cursor: 'not-allowed',
        '&:hover, &:active': {
          backgroundColor: 'transparent'
        },
        [`${componentCls}-simple&`]: {
          backgroundColor: 'transparent',
          '&:hover, &:active': {
            backgroundColor: 'transparent'
          }
        }
      },
      [`${componentCls}-simple-pager`]: {
        color: token.colorTextDisabled
      },
      [`${componentCls}-jump-prev, ${componentCls}-jump-next`]: {
        [`${componentCls}-item-link-icon`]: {
          opacity: 0
        },
        [`${componentCls}-item-ellipsis`]: {
          opacity: 1
        }
      }
    },
    [`&${componentCls}-simple`]: {
      [`${componentCls}-prev, ${componentCls}-next`]: {
        [`&${componentCls}-disabled ${componentCls}-item-link`]: {
          '&:hover, &:active': {
            backgroundColor: 'transparent'
          }
        }
      }
    }
  };
};
const genPaginationMiniStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`&${componentCls}-mini ${componentCls}-total-text, &${componentCls}-mini ${componentCls}-simple-pager`]: {
      height: token.paginationItemSizeSM,
      lineHeight: `${token.paginationItemSizeSM}px`
    },
    [`&${componentCls}-mini ${componentCls}-item`]: {
      minWidth: token.paginationItemSizeSM,
      height: token.paginationItemSizeSM,
      margin: 0,
      lineHeight: `${token.paginationItemSizeSM - 2}px`
    },
    [`&${componentCls}-mini ${componentCls}-item:not(${componentCls}-item-active)`]: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      '&:hover': {
        backgroundColor: token.colorBgTextHover
      },
      '&:active': {
        backgroundColor: token.colorBgTextActive
      }
    },
    [`&${componentCls}-mini ${componentCls}-prev, &${componentCls}-mini ${componentCls}-next`]: {
      minWidth: token.paginationItemSizeSM,
      height: token.paginationItemSizeSM,
      margin: 0,
      lineHeight: `${token.paginationItemSizeSM}px`,
      [`&:hover ${componentCls}-item-link`]: {
        backgroundColor: token.colorBgTextHover
      },
      [`&:active ${componentCls}-item-link`]: {
        backgroundColor: token.colorBgTextActive
      },
      [`&${componentCls}-disabled:hover ${componentCls}-item-link`]: {
        backgroundColor: 'transparent'
      }
    },
    [`
    &${componentCls}-mini ${componentCls}-prev ${componentCls}-item-link,
    &${componentCls}-mini ${componentCls}-next ${componentCls}-item-link
    `]: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      '&::after': {
        height: token.paginationItemSizeSM,
        lineHeight: `${token.paginationItemSizeSM}px`
      }
    },
    [`&${componentCls}-mini ${componentCls}-jump-prev, &${componentCls}-mini ${componentCls}-jump-next`]: {
      height: token.paginationItemSizeSM,
      marginInlineEnd: 0,
      lineHeight: `${token.paginationItemSizeSM}px`
    },
    [`&${componentCls}-mini ${componentCls}-options`]: {
      marginInlineStart: token.paginationMiniOptionsMarginInlineStart,
      [`&-size-changer`]: {
        top: token.paginationMiniOptionsSizeChangerTop
      },
      [`&-quick-jumper`]: {
        height: token.paginationItemSizeSM,
        lineHeight: `${token.paginationItemSizeSM}px`,
        input: _extends(_extends({}, genInputSmallStyle(token)), {
          width: token.paginationMiniQuickJumperInputWidth,
          height: token.controlHeightSM
        })
      }
    }
  };
};
const genPaginationSimpleStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`
    &${componentCls}-simple ${componentCls}-prev,
    &${componentCls}-simple ${componentCls}-next
    `]: {
      height: token.paginationItemSizeSM,
      lineHeight: `${token.paginationItemSizeSM}px`,
      verticalAlign: 'top',
      [`${componentCls}-item-link`]: {
        height: token.paginationItemSizeSM,
        backgroundColor: 'transparent',
        border: 0,
        '&:hover': {
          backgroundColor: token.colorBgTextHover
        },
        '&:active': {
          backgroundColor: token.colorBgTextActive
        },
        '&::after': {
          height: token.paginationItemSizeSM,
          lineHeight: `${token.paginationItemSizeSM}px`
        }
      }
    },
    [`&${componentCls}-simple ${componentCls}-simple-pager`]: {
      display: 'inline-block',
      height: token.paginationItemSizeSM,
      marginInlineEnd: token.marginXS,
      input: {
        boxSizing: 'border-box',
        height: '100%',
        marginInlineEnd: token.marginXS,
        padding: `0 ${token.paginationItemPaddingInline}px`,
        textAlign: 'center',
        backgroundColor: token.paginationItemInputBg,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        outline: 'none',
        transition: `border-color ${token.motionDurationMid}`,
        color: 'inherit',
        '&:hover': {
          borderColor: token.colorPrimary
        },
        '&:focus': {
          borderColor: token.colorPrimaryHover,
          boxShadow: `${token.inputOutlineOffset}px 0 ${token.controlOutlineWidth}px ${token.controlOutline}`
        },
        '&[disabled]': {
          color: token.colorTextDisabled,
          backgroundColor: token.colorBgContainerDisabled,
          borderColor: token.colorBorder,
          cursor: 'not-allowed'
        }
      }
    }
  };
};
const genPaginationJumpStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-jump-prev, ${componentCls}-jump-next`]: {
      outline: 0,
      [`${componentCls}-item-container`]: {
        position: 'relative',
        [`${componentCls}-item-link-icon`]: {
          color: token.colorPrimary,
          fontSize: token.fontSizeSM,
          opacity: 0,
          transition: `all ${token.motionDurationMid}`,
          '&-svg': {
            top: 0,
            insetInlineEnd: 0,
            bottom: 0,
            insetInlineStart: 0,
            margin: 'auto'
          }
        },
        [`${componentCls}-item-ellipsis`]: {
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          bottom: 0,
          insetInlineStart: 0,
          display: 'block',
          margin: 'auto',
          color: token.colorTextDisabled,
          fontFamily: 'Arial, Helvetica, sans-serif',
          letterSpacing: token.paginationEllipsisLetterSpacing,
          textAlign: 'center',
          textIndent: token.paginationEllipsisTextIndent,
          opacity: 1,
          transition: `all ${token.motionDurationMid}`
        }
      },
      '&:hover': {
        [`${componentCls}-item-link-icon`]: {
          opacity: 1
        },
        [`${componentCls}-item-ellipsis`]: {
          opacity: 0
        }
      },
      '&:focus-visible': _extends({
        [`${componentCls}-item-link-icon`]: {
          opacity: 1
        },
        [`${componentCls}-item-ellipsis`]: {
          opacity: 0
        }
      }, genFocusOutline(token))
    },
    [`
    ${componentCls}-prev,
    ${componentCls}-jump-prev,
    ${componentCls}-jump-next
    `]: {
      marginInlineEnd: token.marginXS
    },
    [`
    ${componentCls}-prev,
    ${componentCls}-next,
    ${componentCls}-jump-prev,
    ${componentCls}-jump-next
    `]: {
      display: 'inline-block',
      minWidth: token.paginationItemSize,
      height: token.paginationItemSize,
      color: token.colorText,
      fontFamily: token.paginationFontFamily,
      lineHeight: `${token.paginationItemSize}px`,
      textAlign: 'center',
      verticalAlign: 'middle',
      listStyle: 'none',
      borderRadius: token.borderRadius,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid}`
    },
    [`${componentCls}-prev, ${componentCls}-next`]: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      outline: 0,
      button: {
        color: token.colorText,
        cursor: 'pointer',
        userSelect: 'none'
      },
      [`${componentCls}-item-link`]: {
        display: 'block',
        width: '100%',
        height: '100%',
        padding: 0,
        fontSize: token.fontSizeSM,
        textAlign: 'center',
        backgroundColor: 'transparent',
        border: `${token.lineWidth}px ${token.lineType} transparent`,
        borderRadius: token.borderRadius,
        outline: 'none',
        transition: `all ${token.motionDurationMid}`
      },
      [`&:focus-visible ${componentCls}-item-link`]: _extends({}, genFocusOutline(token)),
      [`&:hover ${componentCls}-item-link`]: {
        backgroundColor: token.colorBgTextHover
      },
      [`&:active ${componentCls}-item-link`]: {
        backgroundColor: token.colorBgTextActive
      },
      [`&${componentCls}-disabled:hover`]: {
        [`${componentCls}-item-link`]: {
          backgroundColor: 'transparent'
        }
      }
    },
    [`${componentCls}-slash`]: {
      marginInlineEnd: token.paginationSlashMarginInlineEnd,
      marginInlineStart: token.paginationSlashMarginInlineStart
    },
    [`${componentCls}-options`]: {
      display: 'inline-block',
      marginInlineStart: token.margin,
      verticalAlign: 'middle',
      '&-size-changer.-select': {
        display: 'inline-block',
        width: 'auto'
      },
      '&-quick-jumper': {
        display: 'inline-block',
        height: token.controlHeight,
        marginInlineStart: token.marginXS,
        lineHeight: `${token.controlHeight}px`,
        verticalAlign: 'top',
        input: _extends(_extends({}, genBasicInputStyle(token)), {
          width: token.controlHeightLG * 1.25,
          height: token.controlHeight,
          boxSizing: 'border-box',
          margin: 0,
          marginInlineStart: token.marginXS,
          marginInlineEnd: token.marginXS
        })
      }
    }
  };
};
const genPaginationItemStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-item`]: _extends(_extends({
      display: 'inline-block',
      minWidth: token.paginationItemSize,
      height: token.paginationItemSize,
      marginInlineEnd: token.marginXS,
      fontFamily: token.paginationFontFamily,
      lineHeight: `${token.paginationItemSize - 2}px`,
      textAlign: 'center',
      verticalAlign: 'middle',
      listStyle: 'none',
      backgroundColor: 'transparent',
      border: `${token.lineWidth}px ${token.lineType} transparent`,
      borderRadius: token.borderRadius,
      outline: 0,
      cursor: 'pointer',
      userSelect: 'none',
      a: {
        display: 'block',
        padding: `0 ${token.paginationItemPaddingInline}px`,
        color: token.colorText,
        transition: 'none',
        '&:hover': {
          textDecoration: 'none'
        }
      },
      [`&:not(${componentCls}-item-active)`]: {
        '&:hover': {
          transition: `all ${token.motionDurationMid}`,
          backgroundColor: token.colorBgTextHover
        },
        '&:active': {
          backgroundColor: token.colorBgTextActive
        }
      }
    }, genFocusStyle(token)), {
      '&-active': {
        fontWeight: token.paginationFontWeightActive,
        backgroundColor: token.paginationItemBgActive,
        borderColor: token.colorPrimary,
        a: {
          color: token.colorPrimary
        },
        '&:hover': {
          borderColor: token.colorPrimaryHover
        },
        '&:hover a': {
          color: token.colorPrimaryHover
        }
      }
    })
  };
};
const genPaginationStyle$1 = token => {
  const {
    componentCls
  } = token;
  return {
    [componentCls]: _extends(_extends(_extends(_extends(_extends(_extends(_extends(_extends({}, resetComponent(token)), {
      'ul, ol': {
        margin: 0,
        padding: 0,
        listStyle: 'none'
      },
      '&::after': {
        display: 'block',
        clear: 'both',
        height: 0,
        overflow: 'hidden',
        visibility: 'hidden',
        content: '""'
      },
      [`${componentCls}-total-text`]: {
        display: 'inline-block',
        height: token.paginationItemSize,
        marginInlineEnd: token.marginXS,
        lineHeight: `${token.paginationItemSize - 2}px`,
        verticalAlign: 'middle'
      }
    }), genPaginationItemStyle(token)), genPaginationJumpStyle(token)), genPaginationSimpleStyle(token)), genPaginationMiniStyle(token)), genPaginationDisabledStyle(token)), {
      // media query style
      [`@media only screen and (max-width: ${token.screenLG}px)`]: {
        [`${componentCls}-item`]: {
          '&-after-jump-prev, &-before-jump-next': {
            display: 'none'
          }
        }
      },
      [`@media only screen and (max-width: ${token.screenSM}px)`]: {
        [`${componentCls}-options`]: {
          display: 'none'
        }
      }
    }),
    // rtl style
    [`&${token.componentCls}-rtl`]: {
      direction: 'rtl'
    }
  };
};
const genBorderedStyle$1 = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}${componentCls}-disabled`]: {
      '&, &:hover': {
        [`${componentCls}-item-link`]: {
          borderColor: token.colorBorder
        }
      },
      '&:focus-visible': {
        [`${componentCls}-item-link`]: {
          borderColor: token.colorBorder
        }
      },
      [`${componentCls}-item, ${componentCls}-item-link`]: {
        backgroundColor: token.colorBgContainerDisabled,
        borderColor: token.colorBorder,
        [`&:hover:not(${componentCls}-item-active)`]: {
          backgroundColor: token.colorBgContainerDisabled,
          borderColor: token.colorBorder,
          a: {
            color: token.colorTextDisabled
          }
        },
        [`&${componentCls}-item-active`]: {
          backgroundColor: token.paginationItemDisabledBgActive
        }
      },
      [`${componentCls}-prev, ${componentCls}-next`]: {
        '&:hover button': {
          backgroundColor: token.colorBgContainerDisabled,
          borderColor: token.colorBorder,
          color: token.colorTextDisabled
        },
        [`${componentCls}-item-link`]: {
          backgroundColor: token.colorBgContainerDisabled,
          borderColor: token.colorBorder
        }
      }
    },
    [componentCls]: {
      [`${componentCls}-prev, ${componentCls}-next`]: {
        '&:hover button': {
          borderColor: token.colorPrimaryHover,
          backgroundColor: token.paginationItemBg
        },
        [`${componentCls}-item-link`]: {
          backgroundColor: token.paginationItemLinkBg,
          borderColor: token.colorBorder
        },
        [`&:hover ${componentCls}-item-link`]: {
          borderColor: token.colorPrimary,
          backgroundColor: token.paginationItemBg,
          color: token.colorPrimary
        },
        [`&${componentCls}-disabled`]: {
          [`${componentCls}-item-link`]: {
            borderColor: token.colorBorder,
            color: token.colorTextDisabled
          }
        }
      },
      [`${componentCls}-item`]: {
        backgroundColor: token.paginationItemBg,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
        [`&:hover:not(${componentCls}-item-active)`]: {
          borderColor: token.colorPrimary,
          backgroundColor: token.paginationItemBg,
          a: {
            color: token.colorPrimary
          }
        },
        '&-active': {
          borderColor: token.colorPrimary
        }
      }
    }
  };
};
// ============================== Export ==============================
const useStyle$1 = genComponentStyleHook('Pagination', token => {
  const paginationToken = merge(token, {
    paginationItemSize: token.controlHeight,
    paginationFontFamily: token.fontFamily,
    paginationItemBg: token.colorBgContainer,
    paginationItemBgActive: token.colorBgContainer,
    paginationFontWeightActive: token.fontWeightStrong,
    paginationItemSizeSM: token.controlHeightSM,
    paginationItemInputBg: token.colorBgContainer,
    paginationMiniOptionsSizeChangerTop: 0,
    paginationItemDisabledBgActive: token.controlItemBgActiveDisabled,
    paginationItemDisabledColorActive: token.colorTextDisabled,
    paginationItemLinkBg: token.colorBgContainer,
    inputOutlineOffset: '0 0',
    paginationMiniOptionsMarginInlineStart: token.marginXXS / 2,
    paginationMiniQuickJumperInputWidth: token.controlHeightLG * 1.1,
    paginationItemPaddingInline: token.marginXXS * 1.5,
    paginationEllipsisLetterSpacing: token.marginXXS / 2,
    paginationSlashMarginInlineStart: token.marginXXS,
    paginationSlashMarginInlineEnd: token.marginSM,
    paginationEllipsisTextIndent: '0.13em' // magic for ui experience
  }, initInputToken(token));
  return [genPaginationStyle$1(paginationToken), token.wireframe && genBorderedStyle$1(paginationToken)];
});

var __rest$4 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const paginationProps = () => ({
  total: Number,
  defaultCurrent: Number,
  disabled: booleanType(),
  current: Number,
  defaultPageSize: Number,
  pageSize: Number,
  hideOnSinglePage: booleanType(),
  showSizeChanger: booleanType(),
  pageSizeOptions: arrayType(),
  buildOptionText: functionType(),
  showQuickJumper: someType([Boolean, Object]),
  showTotal: functionType(),
  size: stringType(),
  simple: booleanType(),
  locale: Object,
  prefixCls: String,
  selectPrefixCls: String,
  totalBoundaryShowSizeChanger: Number,
  selectComponentClass: String,
  itemRender: functionType(),
  role: String,
  responsive: Boolean,
  showLessItems: booleanType(),
  onChange: functionType(),
  onShowSizeChange: functionType(),
  'onUpdate:current': functionType(),
  'onUpdate:pageSize': functionType()
});
const Pagination$1 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'APagination',
  inheritAttrs: false,
  props: paginationProps(),
  // emits: ['change', 'showSizeChange', 'update:current', 'update:pageSize'],
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls,
      configProvider,
      direction,
      size
    } = useConfigInject('pagination', props);
    // style
    const [wrapSSR, hashId] = useStyle$1(prefixCls);
    const selectPrefixCls = computed(() => configProvider.getPrefixCls('select', props.selectPrefixCls));
    const breakpoint = useBreakpoint();
    const [locale] = useLocaleReceiver('Pagination', enUS, toRef(props, 'locale'));
    const getIconsProps = pre => {
      const ellipsis = createVNode("span", {
        "class": `${pre}-item-ellipsis`
      }, [createTextVNode("\u2022\u2022\u2022")]);
      const prevIcon = createVNode("button", {
        "class": `${pre}-item-link`,
        "type": "button",
        "tabindex": -1
      }, [direction.value === 'rtl' ? createVNode(RightOutlined, null, null) : createVNode(LeftOutlined, null, null)]);
      const nextIcon = createVNode("button", {
        "class": `${pre}-item-link`,
        "type": "button",
        "tabindex": -1
      }, [direction.value === 'rtl' ? createVNode(LeftOutlined, null, null) : createVNode(RightOutlined, null, null)]);
      const jumpPrevIcon = createVNode("a", {
        "rel": "nofollow",
        "class": `${pre}-item-link`
      }, [createVNode("div", {
        "class": `${pre}-item-container`
      }, [direction.value === 'rtl' ? createVNode(DoubleRightOutlined, {
        "class": `${pre}-item-link-icon`
      }, null) : createVNode(DoubleLeftOutlined, {
        "class": `${pre}-item-link-icon`
      }, null), ellipsis])]);
      const jumpNextIcon = createVNode("a", {
        "rel": "nofollow",
        "class": `${pre}-item-link`
      }, [createVNode("div", {
        "class": `${pre}-item-container`
      }, [direction.value === 'rtl' ? createVNode(DoubleLeftOutlined, {
        "class": `${pre}-item-link-icon`
      }, null) : createVNode(DoubleRightOutlined, {
        "class": `${pre}-item-link-icon`
      }, null), ellipsis])]);
      return {
        prevIcon,
        nextIcon,
        jumpPrevIcon,
        jumpNextIcon
      };
    };
    return () => {
      var _a;
      const {
          itemRender = slots.itemRender,
          buildOptionText = slots.buildOptionText,
          selectComponentClass,
          responsive
        } = props,
        restProps = __rest$4(props, ["itemRender", "buildOptionText", "selectComponentClass", "responsive"]);
      const isSmall = size.value === 'small' || !!(((_a = breakpoint.value) === null || _a === void 0 ? void 0 : _a.xs) && !size.value && responsive);
      const paginationProps = _extends(_extends(_extends(_extends(_extends({}, restProps), getIconsProps(prefixCls.value)), {
        prefixCls: prefixCls.value,
        selectPrefixCls: selectPrefixCls.value,
        selectComponentClass: selectComponentClass || (isSmall ? MiniSelect : MiddleSelect),
        locale: locale.value,
        buildOptionText
      }), attrs), {
        class: classNames({
          [`${prefixCls.value}-mini`]: isSmall,
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl'
        }, attrs.class, hashId.value),
        itemRender
      });
      return wrapSSR(createVNode(VcPagination, paginationProps, null));
    };
  }
});

const Pagination = withInstall(Pagination$1);

const TableContextKey = Symbol('TableContextProps');
const useProvideTable = props => {
  provide(TableContextKey, props);
};
const useInjectTable = () => {
  return inject(TableContextKey, {});
};

const INTERNAL_KEY_PREFIX = 'RC_TABLE_KEY';
function toArray(arr) {
  if (arr === undefined || arr === null) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
}
function getPathValue(record, path) {
  // Skip if path is empty
  if (!path && typeof path !== 'number') {
    return record;
  }
  const pathList = toArray(path);
  let current = record;
  for (let i = 0; i < pathList.length; i += 1) {
    if (!current) {
      return null;
    }
    const prop = pathList[i];
    current = current[prop];
  }
  return current;
}
function getColumnsKey(columns) {
  const columnKeys = [];
  const keys = {};
  columns.forEach(column => {
    const {
      key,
      dataIndex
    } = column || {};
    let mergedKey = key || toArray(dataIndex).join('-') || INTERNAL_KEY_PREFIX;
    while (keys[mergedKey]) {
      mergedKey = `${mergedKey}_next`;
    }
    keys[mergedKey] = true;
    columnKeys.push(mergedKey);
  });
  return columnKeys;
}
function mergeObject() {
  const merged = {};
  /* eslint-disable no-param-reassign */
  function fillProps(obj, clone) {
    if (clone) {
      Object.keys(clone).forEach(key => {
        const value = clone[key];
        if (value && typeof value === 'object') {
          obj[key] = obj[key] || {};
          fillProps(obj[key], value);
        } else {
          obj[key] = value;
        }
      });
    }
  }
  /* eslint-enable */
  for (var _len = arguments.length, objects = new Array(_len), _key = 0; _key < _len; _key++) {
    objects[_key] = arguments[_key];
  }
  objects.forEach(clone => {
    fillProps(merged, clone);
  });
  return merged;
}
function validateValue(val) {
  return val !== null && val !== undefined;
}

const SlotsContextKey = Symbol('SlotsContextProps');
const useProvideSlots = props => {
  provide(SlotsContextKey, props);
};
const useInjectSlots = () => {
  return inject(SlotsContextKey, computed(() => ({})));
};
const ContextKey = Symbol('ContextProps');
const useProvideTableContext = props => {
  provide(ContextKey, props);
};
const useInjectTableContext = () => {
  return inject(ContextKey, {
    onResizeColumn: () => {}
  });
};

undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const INTERNAL_COL_DEFINE = 'RC_TABLE_INTERNAL_COL_DEFINE';

const HoverContextKey = Symbol('HoverContextProps');
const useProvideHover = props => {
  provide(HoverContextKey, props);
};
const useInjectHover = () => {
  return inject(HoverContextKey, {
    startRow: shallowRef(-1),
    endRow: shallowRef(-1),
    onHover() {}
  });
};

const supportSticky = shallowRef(false);
const useProvideSticky = () => {
  onMounted(() => {
    supportSticky.value = supportSticky.value || isStyleSupport('position', 'sticky');
  });
};
const useInjectSticky = () => {
  return supportSticky;
};

var __rest$3 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
/** Check if cell is in hover range */
function inHoverRange(cellStartRow, cellRowSpan, startRow, endRow) {
  const cellEndRow = cellStartRow + cellRowSpan - 1;
  return cellStartRow <= endRow && cellEndRow >= startRow;
}
function isRenderCell(data) {
  return data && typeof data === 'object' && !Array.isArray(data) && !isVNode(data);
}
const Cell = defineComponent({
  name: 'Cell',
  props: ['prefixCls', 'record', 'index', 'renderIndex', 'dataIndex', 'customRender', 'component', 'colSpan', 'rowSpan', 'fixLeft', 'fixRight', 'firstFixLeft', 'lastFixLeft', 'firstFixRight', 'lastFixRight', 'appendNode', 'additionalProps', 'ellipsis', 'align', 'rowType', 'isSticky', 'column', 'cellType', 'transformCellText'],
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const contextSlots = useInjectSlots();
    const {
      onHover,
      startRow,
      endRow
    } = useInjectHover();
    const colSpan = computed(() => {
      var _a, _b, _c, _d;
      return (_c = (_a = props.colSpan) !== null && _a !== void 0 ? _a : (_b = props.additionalProps) === null || _b === void 0 ? void 0 : _b.colSpan) !== null && _c !== void 0 ? _c : (_d = props.additionalProps) === null || _d === void 0 ? void 0 : _d.colspan;
    });
    const rowSpan = computed(() => {
      var _a, _b, _c, _d;
      return (_c = (_a = props.rowSpan) !== null && _a !== void 0 ? _a : (_b = props.additionalProps) === null || _b === void 0 ? void 0 : _b.rowSpan) !== null && _c !== void 0 ? _c : (_d = props.additionalProps) === null || _d === void 0 ? void 0 : _d.rowspan;
    });
    const hovering = eagerComputed(() => {
      const {
        index
      } = props;
      return inHoverRange(index, rowSpan.value || 1, startRow.value, endRow.value);
    });
    const supportSticky = useInjectSticky();
    // ====================== Hover =======================
    const onMouseenter = (event, mergedRowSpan) => {
      var _a;
      const {
        record,
        index,
        additionalProps
      } = props;
      if (record) {
        onHover(index, index + mergedRowSpan - 1);
      }
      (_a = additionalProps === null || additionalProps === void 0 ? void 0 : additionalProps.onMouseenter) === null || _a === void 0 ? void 0 : _a.call(additionalProps, event);
    };
    const onMouseleave = event => {
      var _a;
      const {
        record,
        additionalProps
      } = props;
      if (record) {
        onHover(-1, -1);
      }
      (_a = additionalProps === null || additionalProps === void 0 ? void 0 : additionalProps.onMouseleave) === null || _a === void 0 ? void 0 : _a.call(additionalProps, event);
    };
    const getTitle = vnodes => {
      const vnode = filterEmpty(vnodes)[0];
      if (isVNode(vnode)) {
        if (vnode.type === Text) {
          return vnode.children;
        } else {
          return Array.isArray(vnode.children) ? getTitle(vnode.children) : undefined;
        }
      } else {
        return vnode;
      }
    };
    const hoverRef = shallowRef(null);
    watch([hovering, () => props.prefixCls, hoverRef], () => {
      const cellDom = findDOMNode(hoverRef.value);
      if (!cellDom) return;
      if (hovering.value) {
        addClass(cellDom, `${props.prefixCls}-cell-row-hover`);
      } else {
        removeClass(cellDom, `${props.prefixCls}-cell-row-hover`);
      }
    });
    return () => {
      var _a, _b, _c, _d, _e, _f;
      const {
        prefixCls,
        record,
        index,
        renderIndex,
        dataIndex,
        customRender,
        component: Component = 'td',
        fixLeft,
        fixRight,
        firstFixLeft,
        lastFixLeft,
        firstFixRight,
        lastFixRight,
        appendNode = (_a = slots.appendNode) === null || _a === void 0 ? void 0 : _a.call(slots),
        additionalProps = {},
        ellipsis,
        align,
        rowType,
        isSticky,
        column = {},
        cellType
      } = props;
      const cellPrefixCls = `${prefixCls}-cell`;
      // ==================== Child Node ====================
      let cellProps;
      let childNode;
      const children = (_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots);
      if (validateValue(children) || cellType === 'header') {
        childNode = children;
      } else {
        const value = getPathValue(record, dataIndex);
        // Customize render node
        childNode = value;
        if (customRender) {
          const renderData = customRender({
            text: value,
            value,
            record,
            index,
            renderIndex,
            column: column.__originColumn__
          });
          if (isRenderCell(renderData)) {
            childNode = renderData.children;
            cellProps = renderData.props;
          } else {
            childNode = renderData;
          }
        }
        if (!(INTERNAL_COL_DEFINE in column) && cellType === 'body' && contextSlots.value.bodyCell && !((_c = column.slots) === null || _c === void 0 ? void 0 : _c.customRender)) {
          const child = customRenderSlot(contextSlots.value, 'bodyCell', {
            text: value,
            value,
            record,
            index,
            column: column.__originColumn__
          }, () => {
            const fallback = childNode === undefined ? value : childNode;
            return [typeof fallback === 'object' && isValidElement(fallback) || typeof fallback !== 'object' ? fallback : null];
          });
          childNode = flattenChildren(child);
        }
        /** maybe we should @deprecated */
        if (props.transformCellText) {
          childNode = props.transformCellText({
            text: childNode,
            record,
            index,
            column: column.__originColumn__
          });
        }
      }
      // Not crash if final `childNode` is not validate VueNode
      if (typeof childNode === 'object' && !Array.isArray(childNode) && !isVNode(childNode)) {
        childNode = null;
      }
      if (ellipsis && (lastFixLeft || firstFixRight)) {
        childNode = createVNode("span", {
          "class": `${cellPrefixCls}-content`
        }, [childNode]);
      }
      if (Array.isArray(childNode) && childNode.length === 1) {
        childNode = childNode[0];
      }
      const _g = cellProps || {},
        {
          colSpan: cellColSpan,
          rowSpan: cellRowSpan,
          style: cellStyle,
          class: cellClassName
        } = _g,
        restCellProps = __rest$3(_g, ["colSpan", "rowSpan", "style", "class"]);
      const mergedColSpan = (_d = cellColSpan !== undefined ? cellColSpan : colSpan.value) !== null && _d !== void 0 ? _d : 1;
      const mergedRowSpan = (_e = cellRowSpan !== undefined ? cellRowSpan : rowSpan.value) !== null && _e !== void 0 ? _e : 1;
      if (mergedColSpan === 0 || mergedRowSpan === 0) {
        return null;
      }
      // ====================== Fixed =======================
      const fixedStyle = {};
      const isFixLeft = typeof fixLeft === 'number' && supportSticky.value;
      const isFixRight = typeof fixRight === 'number' && supportSticky.value;
      if (isFixLeft) {
        fixedStyle.position = 'sticky';
        fixedStyle.left = `${fixLeft}px`;
      }
      if (isFixRight) {
        fixedStyle.position = 'sticky';
        fixedStyle.right = `${fixRight}px`;
      }
      // ====================== Align =======================
      const alignStyle = {};
      if (align) {
        alignStyle.textAlign = align;
      }
      // ====================== Render ======================
      let title;
      const ellipsisConfig = ellipsis === true ? {
        showTitle: true
      } : ellipsis;
      if (ellipsisConfig && (ellipsisConfig.showTitle || rowType === 'header')) {
        if (typeof childNode === 'string' || typeof childNode === 'number') {
          title = childNode.toString();
        } else if (isVNode(childNode)) {
          title = getTitle([childNode]);
        }
      }
      const componentProps = _extends(_extends(_extends({
        title
      }, restCellProps), additionalProps), {
        colSpan: mergedColSpan !== 1 ? mergedColSpan : null,
        rowSpan: mergedRowSpan !== 1 ? mergedRowSpan : null,
        class: classNames(cellPrefixCls, {
          [`${cellPrefixCls}-fix-left`]: isFixLeft && supportSticky.value,
          [`${cellPrefixCls}-fix-left-first`]: firstFixLeft && supportSticky.value,
          [`${cellPrefixCls}-fix-left-last`]: lastFixLeft && supportSticky.value,
          [`${cellPrefixCls}-fix-right`]: isFixRight && supportSticky.value,
          [`${cellPrefixCls}-fix-right-first`]: firstFixRight && supportSticky.value,
          [`${cellPrefixCls}-fix-right-last`]: lastFixRight && supportSticky.value,
          [`${cellPrefixCls}-ellipsis`]: ellipsis,
          [`${cellPrefixCls}-with-append`]: appendNode,
          [`${cellPrefixCls}-fix-sticky`]: (isFixLeft || isFixRight) && isSticky && supportSticky.value
        }, additionalProps.class, cellClassName),
        onMouseenter: e => {
          onMouseenter(e, mergedRowSpan);
        },
        onMouseleave,
        style: [additionalProps.style, alignStyle, fixedStyle, cellStyle]
      });
      return createVNode(Component, _objectSpread$5(_objectSpread$5({}, componentProps), {}, {
        "ref": hoverRef
      }), {
        default: () => [appendNode, childNode, (_f = slots.dragHandle) === null || _f === void 0 ? void 0 : _f.call(slots)]
      });
    };
  }
});

function getCellFixedInfo(colStart, colEnd, columns, stickyOffsets, direction) {
  const startColumn = columns[colStart] || {};
  const endColumn = columns[colEnd] || {};
  let fixLeft;
  let fixRight;
  if (startColumn.fixed === 'left') {
    fixLeft = stickyOffsets.left[colStart];
  } else if (endColumn.fixed === 'right') {
    fixRight = stickyOffsets.right[colEnd];
  }
  let lastFixLeft = false;
  let firstFixRight = false;
  let lastFixRight = false;
  let firstFixLeft = false;
  const nextColumn = columns[colEnd + 1];
  const prevColumn = columns[colStart - 1];
  if (direction === 'rtl') {
    if (fixLeft !== undefined) {
      const prevFixLeft = prevColumn && prevColumn.fixed === 'left';
      firstFixLeft = !prevFixLeft;
    } else if (fixRight !== undefined) {
      const nextFixRight = nextColumn && nextColumn.fixed === 'right';
      lastFixRight = !nextFixRight;
    }
  } else if (fixLeft !== undefined) {
    const nextFixLeft = nextColumn && nextColumn.fixed === 'left';
    lastFixLeft = !nextFixLeft;
  } else if (fixRight !== undefined) {
    const prevFixRight = prevColumn && prevColumn.fixed === 'right';
    firstFixRight = !prevFixRight;
  }
  return {
    fixLeft,
    fixRight,
    lastFixLeft,
    firstFixRight,
    lastFixRight,
    firstFixLeft,
    isSticky: stickyOffsets.isSticky
  };
}

const events = {
  mouse: {
    move: 'mousemove',
    stop: 'mouseup'
  },
  touch: {
    move: 'touchmove',
    stop: 'touchend'
  }
};
const defaultMinWidth = 50;
const DragHandleVue = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'DragHandle',
  props: {
    prefixCls: String,
    width: {
      type: Number,
      required: true
    },
    minWidth: {
      type: Number,
      default: defaultMinWidth
    },
    maxWidth: {
      type: Number,
      default: Infinity
    },
    column: {
      type: Object,
      default: undefined
    }
  },
  setup(props) {
    let startX = 0;
    let moveEvent = {
      remove: () => {}
    };
    let stopEvent = {
      remove: () => {}
    };
    const removeEvents = () => {
      moveEvent.remove();
      stopEvent.remove();
    };
    onUnmounted(() => {
      removeEvents();
    });
    watchEffect(() => {
      devWarning(!isNaN(props.width), 'Table', 'width must be a number when use resizable');
    });
    const {
      onResizeColumn
    } = useInjectTableContext();
    const minWidth = computed(() => {
      return typeof props.minWidth === 'number' && !isNaN(props.minWidth) ? props.minWidth : defaultMinWidth;
    });
    const maxWidth = computed(() => {
      return typeof props.maxWidth === 'number' && !isNaN(props.maxWidth) ? props.maxWidth : Infinity;
    });
    const instance = getCurrentInstance();
    let baseWidth = 0;
    const dragging = shallowRef(false);
    let rafId;
    const updateWidth = e => {
      let pageX = 0;
      if (e.touches) {
        if (e.touches.length) {
          // touchmove
          pageX = e.touches[0].pageX;
        } else {
          // touchend
          pageX = e.changedTouches[0].pageX;
        }
      } else {
        pageX = e.pageX;
      }
      const tmpDeltaX = startX - pageX;
      let w = Math.max(baseWidth - tmpDeltaX, minWidth.value);
      w = Math.min(w, maxWidth.value);
      wrapperRaf.cancel(rafId);
      rafId = wrapperRaf(() => {
        onResizeColumn(w, props.column.__originColumn__);
      });
    };
    const handleMove = e => {
      updateWidth(e);
    };
    const handleStop = e => {
      dragging.value = false;
      updateWidth(e);
      removeEvents();
    };
    const handleStart = (e, eventsFor) => {
      dragging.value = true;
      removeEvents();
      baseWidth = instance.vnode.el.parentNode.getBoundingClientRect().width;
      if (e instanceof MouseEvent && e.which !== 1) {
        return;
      }
      if (e.stopPropagation) e.stopPropagation();
      startX = e.touches ? e.touches[0].pageX : e.pageX;
      moveEvent = addEventListenerWrap(document.documentElement, eventsFor.move, handleMove);
      stopEvent = addEventListenerWrap(document.documentElement, eventsFor.stop, handleStop);
    };
    const handleDown = e => {
      e.stopPropagation();
      e.preventDefault();
      handleStart(e, events.mouse);
    };
    const handleTouchDown = e => {
      e.stopPropagation();
      e.preventDefault();
      handleStart(e, events.touch);
    };
    const handleClick = e => {
      e.stopPropagation();
      e.preventDefault();
    };
    return () => {
      const {
        prefixCls
      } = props;
      const touchEvents = {
        [supportsPassive ? 'onTouchstartPassive' : 'onTouchstart']: e => handleTouchDown(e)
      };
      return createVNode("div", _objectSpread$5(_objectSpread$5({
        "class": `${prefixCls}-resize-handle ${dragging.value ? 'dragging' : ''}`,
        "onMousedown": handleDown
      }, touchEvents), {}, {
        "onClick": handleClick
      }), [createVNode("div", {
        "class": `${prefixCls}-resize-handle-line`
      }, null)]);
    };
  }
});

const HeaderRow = defineComponent({
  name: 'HeaderRow',
  props: ['cells', 'stickyOffsets', 'flattenColumns', 'rowComponent', 'cellComponent', 'index', 'customHeaderRow'],
  setup(props) {
    const tableContext = useInjectTable();
    return () => {
      const {
        prefixCls,
        direction
      } = tableContext;
      const {
        cells,
        stickyOffsets,
        flattenColumns,
        rowComponent: RowComponent,
        cellComponent: CellComponent,
        customHeaderRow,
        index
      } = props;
      let rowProps;
      if (customHeaderRow) {
        rowProps = customHeaderRow(cells.map(cell => cell.column), index);
      }
      const columnsKey = getColumnsKey(cells.map(cell => cell.column));
      return createVNode(RowComponent, rowProps, {
        default: () => [cells.map((cell, cellIndex) => {
          const {
            column
          } = cell;
          const fixedInfo = getCellFixedInfo(cell.colStart, cell.colEnd, flattenColumns, stickyOffsets, direction);
          let additionalProps;
          if (column && column.customHeaderCell) {
            additionalProps = cell.column.customHeaderCell(column);
          }
          const col = column;
          return createVNode(Cell, _objectSpread$5(_objectSpread$5(_objectSpread$5({}, cell), {}, {
            "cellType": "header",
            "ellipsis": column.ellipsis,
            "align": column.align,
            "component": CellComponent,
            "prefixCls": prefixCls,
            "key": columnsKey[cellIndex]
          }, fixedInfo), {}, {
            "additionalProps": additionalProps,
            "rowType": "header",
            "column": column
          }), {
            default: () => column.title,
            dragHandle: () => col.resizable ? createVNode(DragHandleVue, {
              "prefixCls": prefixCls,
              "width": col.width,
              "minWidth": col.minWidth,
              "maxWidth": col.maxWidth,
              "column": col
            }, null) : null
          });
        })]
      });
    };
  }
});

function parseHeaderRows(rootColumns) {
  const rows = [];
  function fillRowCells(columns, colIndex) {
    let rowIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    // Init rows
    rows[rowIndex] = rows[rowIndex] || [];
    let currentColIndex = colIndex;
    const colSpans = columns.filter(Boolean).map(column => {
      const cell = {
        key: column.key,
        class: classNames(column.className, column.class),
        // children: column.title,
        column,
        colStart: currentColIndex
      };
      let colSpan = 1;
      const subColumns = column.children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(subColumns, currentColIndex, rowIndex + 1).reduce((total, count) => total + count, 0);
        cell.hasSubColumns = true;
      }
      if ('colSpan' in column) {
        ({
          colSpan
        } = column);
      }
      if ('rowSpan' in column) {
        cell.rowSpan = column.rowSpan;
      }
      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart + colSpan - 1;
      rows[rowIndex].push(cell);
      currentColIndex += colSpan;
      return colSpan;
    });
    return colSpans;
  }
  // Generate `rows` cell data
  fillRowCells(rootColumns, 0);
  // Handle `rowSpan`
  const rowCount = rows.length;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows[rowIndex].forEach(cell => {
      if (!('rowSpan' in cell) && !cell.hasSubColumns) {
        // eslint-disable-next-line no-param-reassign
        cell.rowSpan = rowCount - rowIndex;
      }
    });
  }
  return rows;
}
const Header = defineComponent({
  name: 'TableHeader',
  inheritAttrs: false,
  props: ['columns', 'flattenColumns', 'stickyOffsets', 'customHeaderRow'],
  setup(props) {
    const tableContext = useInjectTable();
    const rows = computed(() => parseHeaderRows(props.columns));
    return () => {
      const {
        prefixCls,
        getComponent
      } = tableContext;
      const {
        stickyOffsets,
        flattenColumns,
        customHeaderRow
      } = props;
      const WrapperComponent = getComponent(['header', 'wrapper'], 'thead');
      const trComponent = getComponent(['header', 'row'], 'tr');
      const thComponent = getComponent(['header', 'cell'], 'th');
      return createVNode(WrapperComponent, {
        "class": `${prefixCls}-thead`
      }, {
        default: () => [rows.value.map((row, rowIndex) => {
          const rowNode = createVNode(HeaderRow, {
            "key": rowIndex,
            "flattenColumns": flattenColumns,
            "cells": row,
            "stickyOffsets": stickyOffsets,
            "rowComponent": trComponent,
            "cellComponent": thComponent,
            "customHeaderRow": customHeaderRow,
            "index": rowIndex
          }, null);
          return rowNode;
        })]
      });
    };
  }
});

const ExpandedRowContextKey = Symbol('ExpandedRowProps');
const useProvideExpandedRow = props => {
  provide(ExpandedRowContextKey, props);
};
const useInjectExpandedRow = () => {
  return inject(ExpandedRowContextKey, {});
};

const ExpandedRow = defineComponent({
  name: 'ExpandedRow',
  inheritAttrs: false,
  props: ['prefixCls', 'component', 'cellComponent', 'expanded', 'colSpan', 'isEmpty'],
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const tableContext = useInjectTable();
    const expandedRowContext = useInjectExpandedRow();
    const {
      fixHeader,
      fixColumn,
      componentWidth,
      horizonScroll
    } = expandedRowContext;
    return () => {
      const {
        prefixCls,
        component: Component,
        cellComponent,
        expanded,
        colSpan,
        isEmpty
      } = props;
      return createVNode(Component, {
        "class": attrs.class,
        "style": {
          display: expanded ? null : 'none'
        }
      }, {
        default: () => [createVNode(Cell, {
          "component": cellComponent,
          "prefixCls": prefixCls,
          "colSpan": colSpan
        }, {
          default: () => {
            var _a;
            let contentNode = (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
            if (isEmpty ? horizonScroll.value : fixColumn.value) {
              contentNode = createVNode("div", {
                "style": {
                  width: `${componentWidth.value - (fixHeader.value ? tableContext.scrollbarSize : 0)}px`,
                  position: 'sticky',
                  left: 0,
                  overflow: 'hidden'
                },
                "class": `${prefixCls}-expanded-row-fixed`
              }, [contentNode]);
            }
            return contentNode;
          }
        })]
      });
    };
  }
});

const MeasureCell = defineComponent({
  name: 'MeasureCell',
  props: ['columnKey'],
  setup(props, _ref) {
    let {
      emit
    } = _ref;
    const tdRef = ref();
    onMounted(() => {
      if (tdRef.value) {
        emit('columnResize', props.columnKey, tdRef.value.offsetWidth);
      }
    });
    return () => {
      return createVNode(ResizeObserver, {
        "onResize": _ref2 => {
          let {
            offsetWidth
          } = _ref2;
          emit('columnResize', props.columnKey, offsetWidth);
        }
      }, {
        default: () => [createVNode("td", {
          "ref": tdRef,
          "style": {
            padding: 0,
            border: 0,
            height: 0
          }
        }, [createVNode("div", {
          "style": {
            height: 0,
            overflow: 'hidden'
          }
        }, [createTextVNode("\xA0")])])]
      });
    };
  }
});

const BodyContextKey = Symbol('BodyContextProps');
const useProvideBody = props => {
  provide(BodyContextKey, props);
};
const useInjectBody = () => {
  return inject(BodyContextKey, {});
};

const BodyRow = defineComponent({
  name: 'BodyRow',
  inheritAttrs: false,
  props: ['record', 'index', 'renderIndex', 'recordKey', 'expandedKeys', 'rowComponent', 'cellComponent', 'customRow', 'rowExpandable', 'indent', 'rowKey', 'getRowKey', 'childrenColumnName'],
  setup(props, _ref) {
    let {
      attrs
    } = _ref;
    const tableContext = useInjectTable();
    const bodyContext = useInjectBody();
    const expandRended = shallowRef(false);
    const expanded = computed(() => props.expandedKeys && props.expandedKeys.has(props.recordKey));
    watchEffect(() => {
      if (expanded.value) {
        expandRended.value = true;
      }
    });
    const rowSupportExpand = computed(() => bodyContext.expandableType === 'row' && (!props.rowExpandable || props.rowExpandable(props.record)));
    // Only when row is not expandable and `children` exist in record
    const nestExpandable = computed(() => bodyContext.expandableType === 'nest');
    const hasNestChildren = computed(() => props.childrenColumnName && props.record && props.record[props.childrenColumnName]);
    const mergedExpandable = computed(() => rowSupportExpand.value || nestExpandable.value);
    const onInternalTriggerExpand = (record, event) => {
      bodyContext.onTriggerExpand(record, event);
    };
    // =========================== onRow ===========================
    const additionalProps = computed(() => {
      var _a;
      return ((_a = props.customRow) === null || _a === void 0 ? void 0 : _a.call(props, props.record, props.index)) || {};
    });
    const onClick = function (event) {
      var _a, _b;
      if (bodyContext.expandRowByClick && mergedExpandable.value) {
        onInternalTriggerExpand(props.record, event);
      }
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      (_b = (_a = additionalProps.value) === null || _a === void 0 ? void 0 : _a.onClick) === null || _b === void 0 ? void 0 : _b.call(_a, event, ...args);
    };
    const computeRowClassName = computed(() => {
      const {
        record,
        index,
        indent
      } = props;
      const {
        rowClassName
      } = bodyContext;
      if (typeof rowClassName === 'string') {
        return rowClassName;
      } else if (typeof rowClassName === 'function') {
        return rowClassName(record, index, indent);
      }
      return '';
    });
    const columnsKey = computed(() => getColumnsKey(bodyContext.flattenColumns));
    return () => {
      const {
        class: className,
        style
      } = attrs;
      const {
        record,
        index,
        rowKey,
        indent = 0,
        rowComponent: RowComponent,
        cellComponent
      } = props;
      const {
        prefixCls,
        fixedInfoList,
        transformCellText
      } = tableContext;
      const {
        flattenColumns,
        expandedRowClassName,
        indentSize,
        expandIcon,
        expandedRowRender,
        expandIconColumnIndex
      } = bodyContext;
      const baseRowNode = createVNode(RowComponent, _objectSpread$5(_objectSpread$5({}, additionalProps.value), {}, {
        "data-row-key": rowKey,
        "class": classNames(className, `${prefixCls}-row`, `${prefixCls}-row-level-${indent}`, computeRowClassName.value, additionalProps.value.class),
        "style": [style, additionalProps.value.style],
        "onClick": onClick
      }), {
        default: () => [flattenColumns.map((column, colIndex) => {
          const {
            customRender,
            dataIndex,
            className: columnClassName
          } = column;
          const key = columnsKey[colIndex];
          const fixedInfo = fixedInfoList[colIndex];
          let additionalCellProps;
          if (column.customCell) {
            additionalCellProps = column.customCell(record, index, column);
          }
          // not use slot to fix https://github.com/vueComponent/ant-design-vue/issues/5295
          const appendNode = colIndex === (expandIconColumnIndex || 0) && nestExpandable.value ? createVNode(Fragment, null, [createVNode("span", {
            "style": {
              paddingLeft: `${indentSize * indent}px`
            },
            "class": `${prefixCls}-row-indent indent-level-${indent}`
          }, null), expandIcon({
            prefixCls,
            expanded: expanded.value,
            expandable: hasNestChildren.value,
            record,
            onExpand: onInternalTriggerExpand
          })]) : null;
          return createVNode(Cell, _objectSpread$5(_objectSpread$5({
            "cellType": "body",
            "class": columnClassName,
            "ellipsis": column.ellipsis,
            "align": column.align,
            "component": cellComponent,
            "prefixCls": prefixCls,
            "key": key,
            "record": record,
            "index": index,
            "renderIndex": props.renderIndex,
            "dataIndex": dataIndex,
            "customRender": customRender
          }, fixedInfo), {}, {
            "additionalProps": additionalCellProps,
            "column": column,
            "transformCellText": transformCellText,
            "appendNode": appendNode
          }), null);
        })]
      });
      // ======================== Expand Row =========================
      let expandRowNode;
      if (rowSupportExpand.value && (expandRended.value || expanded.value)) {
        const expandContent = expandedRowRender({
          record,
          index,
          indent: indent + 1,
          expanded: expanded.value
        });
        const computedExpandedRowClassName = expandedRowClassName && expandedRowClassName(record, index, indent);
        expandRowNode = createVNode(ExpandedRow, {
          "expanded": expanded.value,
          "class": classNames(`${prefixCls}-expanded-row`, `${prefixCls}-expanded-row-level-${indent + 1}`, computedExpandedRowClassName),
          "prefixCls": prefixCls,
          "component": RowComponent,
          "cellComponent": cellComponent,
          "colSpan": flattenColumns.length,
          "isEmpty": false
        }, {
          default: () => [expandContent]
        });
      }
      return createVNode(Fragment, null, [baseRowNode, expandRowNode]);
    };
  }
});

// recursion (flat tree structure)
function flatRecord(record, indent, childrenColumnName, expandedKeys, getRowKey, index) {
  const arr = [];
  arr.push({
    record,
    indent,
    index
  });
  const key = getRowKey(record);
  const expanded = expandedKeys === null || expandedKeys === void 0 ? void 0 : expandedKeys.has(key);
  if (record && Array.isArray(record[childrenColumnName]) && expanded) {
    // expanded state, flat record
    for (let i = 0; i < record[childrenColumnName].length; i += 1) {
      const tempArr = flatRecord(record[childrenColumnName][i], indent + 1, childrenColumnName, expandedKeys, getRowKey, i);
      arr.push(...tempArr);
    }
  }
  return arr;
}
/**
 * flat tree data on expanded state
 *
 * @export
 * @template T
 * @param {*} data : table data
 * @param {string} childrenColumnName : 指定树形结构的列名
 * @param {Set<Key>} expandedKeys : 展开的行对应的keys
 * @param {GetRowKey<T>} getRowKey  : 获取当前rowKey的方法
 * @returns flattened data
 */
function useFlattenRecords(dataRef, childrenColumnNameRef, expandedKeysRef, getRowKey) {
  const arr = computed(() => {
    const childrenColumnName = childrenColumnNameRef.value;
    const expandedKeys = expandedKeysRef.value;
    const data = dataRef.value;
    if (expandedKeys === null || expandedKeys === void 0 ? void 0 : expandedKeys.size) {
      const temp = [];
      // collect flattened record
      for (let i = 0; i < (data === null || data === void 0 ? void 0 : data.length); i += 1) {
        const record = data[i];
        temp.push(...flatRecord(record, 0, childrenColumnName, expandedKeys, getRowKey.value, i));
      }
      return temp;
    }
    return data === null || data === void 0 ? void 0 : data.map((item, index) => {
      return {
        record: item,
        indent: 0,
        index
      };
    });
  });
  return arr;
}

const ResizeContextKey = Symbol('ResizeContextProps');
const useProvideResize = props => {
  provide(ResizeContextKey, props);
};
const useInjectResize = () => {
  return inject(ResizeContextKey, {
    onColumnResize: () => {}
  });
};

const Body = defineComponent({
  name: 'TableBody',
  props: ['data', 'getRowKey', 'measureColumnWidth', 'expandedKeys', 'customRow', 'rowExpandable', 'childrenColumnName'],
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const resizeContext = useInjectResize();
    const tableContext = useInjectTable();
    const bodyContext = useInjectBody();
    const flattenData = useFlattenRecords(toRef(props, 'data'), toRef(props, 'childrenColumnName'), toRef(props, 'expandedKeys'), toRef(props, 'getRowKey'));
    const startRow = shallowRef(-1);
    const endRow = shallowRef(-1);
    let timeoutId;
    useProvideHover({
      startRow,
      endRow,
      onHover: (start, end) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          startRow.value = start;
          endRow.value = end;
        }, 100);
      }
    });
    return () => {
      var _a;
      const {
        data,
        getRowKey,
        measureColumnWidth,
        expandedKeys,
        customRow,
        rowExpandable,
        childrenColumnName
      } = props;
      const {
        onColumnResize
      } = resizeContext;
      const {
        prefixCls,
        getComponent
      } = tableContext;
      const {
        flattenColumns
      } = bodyContext;
      const WrapperComponent = getComponent(['body', 'wrapper'], 'tbody');
      const trComponent = getComponent(['body', 'row'], 'tr');
      const tdComponent = getComponent(['body', 'cell'], 'td');
      let rows;
      if (data.length) {
        rows = flattenData.value.map((item, idx) => {
          const {
            record,
            indent,
            index: renderIndex
          } = item;
          const key = getRowKey(record, idx);
          return createVNode(BodyRow, {
            "key": key,
            "rowKey": key,
            "record": record,
            "recordKey": key,
            "index": idx,
            "renderIndex": renderIndex,
            "rowComponent": trComponent,
            "cellComponent": tdComponent,
            "expandedKeys": expandedKeys,
            "customRow": customRow,
            "getRowKey": getRowKey,
            "rowExpandable": rowExpandable,
            "childrenColumnName": childrenColumnName,
            "indent": indent
          }, null);
        });
      } else {
        rows = createVNode(ExpandedRow, {
          "expanded": true,
          "class": `${prefixCls}-placeholder`,
          "prefixCls": prefixCls,
          "component": trComponent,
          "cellComponent": tdComponent,
          "colSpan": flattenColumns.length,
          "isEmpty": true
        }, {
          default: () => [(_a = slots.emptyNode) === null || _a === void 0 ? void 0 : _a.call(slots)]
        });
      }
      const columnsKey = getColumnsKey(flattenColumns);
      return createVNode(WrapperComponent, {
        "class": `${prefixCls}-tbody`
      }, {
        default: () => [measureColumnWidth && createVNode("tr", {
          "aria-hidden": "true",
          "class": `${prefixCls}-measure-row`,
          "style": {
            height: 0,
            fontSize: 0
          }
        }, [columnsKey.map(columnKey => createVNode(MeasureCell, {
          "key": columnKey,
          "columnKey": columnKey,
          "onColumnResize": onColumnResize
        }, null))]), rows]
      });
    };
  }
});

const EXPAND_COLUMN = {};

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function flatColumns(columns) {
  return columns.reduce((list, column) => {
    const {
      fixed
    } = column;
    // Convert `fixed='true'` to `fixed='left'` instead
    const parsedFixed = fixed === true ? 'left' : fixed;
    const subColumns = column.children;
    if (subColumns && subColumns.length > 0) {
      return [...list, ...flatColumns(subColumns).map(subColum => _extends({
        fixed: parsedFixed
      }, subColum))];
    }
    return [...list, _extends(_extends({}, column), {
      fixed: parsedFixed
    })];
  }, []);
}
function revertForRtl(columns) {
  return columns.map(column => {
    const {
        fixed
      } = column,
      restProps = __rest$2(column, ["fixed"]);
    // Convert `fixed='left'` to `fixed='right'` instead
    let parsedFixed = fixed;
    if (fixed === 'left') {
      parsedFixed = 'right';
    } else if (fixed === 'right') {
      parsedFixed = 'left';
    }
    return _extends({
      fixed: parsedFixed
    }, restProps);
  });
}
/**
 * Parse `columns` & `children` into `columns`.
 */
function useColumns$1(_ref, transformColumns) {
  let {
    prefixCls,
    columns: baseColumns,
    // children,
    expandable,
    expandedKeys,
    getRowKey,
    onTriggerExpand,
    expandIcon,
    rowExpandable,
    expandIconColumnIndex,
    direction,
    expandRowByClick,
    expandColumnWidth,
    expandFixed
  } = _ref;
  const contextSlots = useInjectSlots();
  // Add expand column
  const withExpandColumns = computed(() => {
    if (expandable.value) {
      let cloneColumns = baseColumns.value.slice();
      // >>> Insert expand column if not exist
      if (!cloneColumns.includes(EXPAND_COLUMN)) {
        const expandColIndex = expandIconColumnIndex.value || 0;
        if (expandColIndex >= 0) {
          cloneColumns.splice(expandColIndex, 0, EXPAND_COLUMN);
        }
      }
      const expandColumnIndex = cloneColumns.indexOf(EXPAND_COLUMN);
      cloneColumns = cloneColumns.filter((column, index) => column !== EXPAND_COLUMN || index === expandColumnIndex);
      // >>> Check if expand column need to fixed
      const prevColumn = baseColumns.value[expandColumnIndex];
      let fixedColumn;
      if ((expandFixed.value === 'left' || expandFixed.value) && !expandIconColumnIndex.value) {
        fixedColumn = 'left';
      } else if ((expandFixed.value === 'right' || expandFixed.value) && expandIconColumnIndex.value === baseColumns.value.length) {
        fixedColumn = 'right';
      } else {
        fixedColumn = prevColumn ? prevColumn.fixed : null;
      }
      const expandedKeysValue = expandedKeys.value;
      const rowExpandableValue = rowExpandable.value;
      const expandIconValue = expandIcon.value;
      const prefixClsValue = prefixCls.value;
      const expandRowByClickValue = expandRowByClick.value;
      // >>> Create expandable column
      const expandColumn = {
        [INTERNAL_COL_DEFINE]: {
          class: `${prefixCls.value}-expand-icon-col`,
          columnType: 'EXPAND_COLUMN'
        },
        title: customRenderSlot(contextSlots.value, 'expandColumnTitle', {}, () => ['']),
        fixed: fixedColumn,
        class: `${prefixCls.value}-row-expand-icon-cell`,
        width: expandColumnWidth.value,
        customRender: _ref2 => {
          let {
            record,
            index
          } = _ref2;
          const rowKey = getRowKey.value(record, index);
          const expanded = expandedKeysValue.has(rowKey);
          const recordExpandable = rowExpandableValue ? rowExpandableValue(record) : true;
          const icon = expandIconValue({
            prefixCls: prefixClsValue,
            expanded,
            expandable: recordExpandable,
            record,
            onExpand: onTriggerExpand
          });
          if (expandRowByClickValue) {
            return createVNode("span", {
              "onClick": e => e.stopPropagation()
            }, [icon]);
          }
          return icon;
        }
      };
      return cloneColumns.map(col => col === EXPAND_COLUMN ? expandColumn : col);
    }
    return baseColumns.value.filter(col => col !== EXPAND_COLUMN);
  });
  const mergedColumns = computed(() => {
    let finalColumns = withExpandColumns.value;
    if (transformColumns.value) {
      finalColumns = transformColumns.value(finalColumns);
    }
    // Always provides at least one column for table display
    if (!finalColumns.length) {
      finalColumns = [{
        customRender: () => null
      }];
    }
    return finalColumns;
  });
  const flattenColumns = computed(() => {
    if (direction.value === 'rtl') {
      return revertForRtl(flatColumns(mergedColumns.value));
    }
    return flatColumns(mergedColumns.value);
  });
  return [mergedColumns, flattenColumns];
}

function useLayoutState(defaultState) {
  const stateRef = shallowRef(defaultState);
  let rafId;
  const updateBatchRef = shallowRef([]);
  function setFrameState(updater) {
    updateBatchRef.value.push(updater);
    wrapperRaf.cancel(rafId);
    rafId = wrapperRaf(() => {
      const prevBatch = updateBatchRef.value;
      // const prevState = stateRef.value;
      updateBatchRef.value = [];
      prevBatch.forEach(batchUpdater => {
        stateRef.value = batchUpdater(stateRef.value);
      });
    });
  }
  onBeforeUnmount(() => {
    wrapperRaf.cancel(rafId);
  });
  return [stateRef, setFrameState];
}
/** Lock frame, when frame pass reset the lock. */
function useTimeoutLock(defaultState) {
  const frameRef = ref(null);
  const timeoutRef = ref();
  function cleanUp() {
    clearTimeout(timeoutRef.value);
  }
  function setState(newState) {
    frameRef.value = newState;
    cleanUp();
    timeoutRef.value = setTimeout(() => {
      frameRef.value = null;
      timeoutRef.value = undefined;
    }, 100);
  }
  function getState() {
    return frameRef.value;
  }
  onBeforeUnmount(() => {
    cleanUp();
  });
  return [setState, getState];
}

/**
 * Get sticky column offset width
 */
function useStickyOffsets(colWidthsRef, columnCountRef, directionRef) {
  const stickyOffsets = computed(() => {
    const leftOffsets = [];
    const rightOffsets = [];
    let left = 0;
    let right = 0;
    const colWidths = colWidthsRef.value;
    const columnCount = columnCountRef.value;
    const direction = directionRef.value;
    for (let start = 0; start < columnCount; start += 1) {
      if (direction === 'rtl') {
        // Left offset
        rightOffsets[start] = right;
        right += colWidths[start] || 0;
        // Right offset
        const end = columnCount - start - 1;
        leftOffsets[end] = left;
        left += colWidths[end] || 0;
      } else {
        // Left offset
        leftOffsets[start] = left;
        left += colWidths[start] || 0;
        // Right offset
        const end = columnCount - start - 1;
        rightOffsets[end] = right;
        right += colWidths[end] || 0;
      }
    }
    return {
      left: leftOffsets,
      right: rightOffsets
    };
  });
  return stickyOffsets;
}

var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function ColGroup(_ref) {
  let {
    colWidths,
    columns,
    columCount
  } = _ref;
  const cols = [];
  const len = columCount || columns.length;
  // Only insert col with width & additional props
  // Skip if rest col do not have any useful info
  let mustInsert = false;
  for (let i = len - 1; i >= 0; i -= 1) {
    const width = colWidths[i];
    const column = columns && columns[i];
    const additionalProps = column && column[INTERNAL_COL_DEFINE];
    if (width || additionalProps || mustInsert) {
      const _a = additionalProps || {},
        {
          columnType
        } = _a,
        restAdditionalProps = __rest$1(_a, ["columnType"]);
      cols.unshift(createVNode("col", _objectSpread$5({
        "key": i,
        "style": {
          width: typeof width === 'number' ? `${width}px` : width
        }
      }, restAdditionalProps), null));
      mustInsert = true;
    }
  }
  return createVNode("colgroup", null, [cols]);
}

function Panel(_, _ref) {
  let {
    slots
  } = _ref;
  var _a;
  return createVNode("div", null, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
}
Panel.displayName = 'Panel';

let indexGuid = 0;
const Summary = defineComponent({
  name: 'TableSummary',
  props: ['fixed'],
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const tableContext = useInjectTable();
    const uniKey = `table-summary-uni-key-${++indexGuid}`;
    const fixed = computed(() => props.fixed === '' || props.fixed);
    watchEffect(() => {
      tableContext.summaryCollect(uniKey, fixed.value);
    });
    onBeforeUnmount(() => {
      tableContext.summaryCollect(uniKey, false);
    });
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});

const SummaryRow = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATableSummaryRow',
  setup(_props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      var _a;
      return createVNode("tr", null, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
    };
  }
});

const SummaryContextKey = Symbol('SummaryContextProps');
const useProvideSummary = props => {
  provide(SummaryContextKey, props);
};
const useInjectSummary = () => {
  return inject(SummaryContextKey, {});
};

const SummaryCell = defineComponent({
  name: 'ATableSummaryCell',
  props: ['index', 'colSpan', 'rowSpan', 'align'],
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const tableContext = useInjectTable();
    const summaryContext = useInjectSummary();
    return () => {
      const {
        index,
        colSpan = 1,
        rowSpan,
        align
      } = props;
      const {
        prefixCls,
        direction
      } = tableContext;
      const {
        scrollColumnIndex,
        stickyOffsets,
        flattenColumns
      } = summaryContext;
      const lastIndex = index + colSpan - 1;
      const mergedColSpan = lastIndex + 1 === scrollColumnIndex ? colSpan + 1 : colSpan;
      const fixedInfo = getCellFixedInfo(index, index + mergedColSpan - 1, flattenColumns, stickyOffsets, direction);
      return createVNode(Cell, _objectSpread$5({
        "class": attrs.class,
        "index": index,
        "component": "td",
        "prefixCls": prefixCls,
        "record": null,
        "dataIndex": null,
        "align": align,
        "colSpan": mergedColSpan,
        "rowSpan": rowSpan,
        "customRender": () => {
          var _a;
          return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
        }
      }, fixedInfo), null);
    };
  }
});

const Footer = defineComponent({
  name: 'TableFooter',
  inheritAttrs: false,
  props: ['stickyOffsets', 'flattenColumns'],
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const tableContext = useInjectTable();
    useProvideSummary(reactive({
      stickyOffsets: toRef(props, 'stickyOffsets'),
      flattenColumns: toRef(props, 'flattenColumns'),
      scrollColumnIndex: computed(() => {
        const lastColumnIndex = props.flattenColumns.length - 1;
        const scrollColumn = props.flattenColumns[lastColumnIndex];
        return (scrollColumn === null || scrollColumn === void 0 ? void 0 : scrollColumn.scrollbar) ? lastColumnIndex : null;
      })
    }));
    return () => {
      var _a;
      const {
        prefixCls
      } = tableContext;
      return createVNode("tfoot", {
        "class": `${prefixCls}-summary`
      }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
    };
  }
});
const FooterComponents = Summary;

function renderExpandIcon$1(_ref) {
  let {
    prefixCls,
    record,
    onExpand,
    expanded,
    expandable
  } = _ref;
  const expandClassName = `${prefixCls}-row-expand-icon`;
  if (!expandable) {
    return createVNode("span", {
      "class": [expandClassName, `${prefixCls}-row-spaced`]
    }, null);
  }
  const onClick = event => {
    onExpand(record, event);
    event.stopPropagation();
  };
  return createVNode("span", {
    "class": {
      [expandClassName]: true,
      [`${prefixCls}-row-expanded`]: expanded,
      [`${prefixCls}-row-collapsed`]: !expanded
    },
    "onClick": onClick
  }, null);
}
function findAllChildrenKeys(data, getRowKey, childrenColumnName) {
  const keys = [];
  function dig(list) {
    (list || []).forEach((item, index) => {
      keys.push(getRowKey(item, index));
      dig(item[childrenColumnName]);
    });
  }
  dig(data);
  return keys;
}

const StickyScrollBar = defineComponent({
  name: 'StickyScrollBar',
  inheritAttrs: false,
  props: ['offsetScroll', 'container', 'scrollBodyRef', 'scrollBodySizeInfo'],
  emits: ['scroll'],
  setup(props, _ref) {
    let {
      emit,
      expose
    } = _ref;
    const tableContext = useInjectTable();
    const bodyScrollWidth = shallowRef(0);
    const bodyWidth = shallowRef(0);
    const scrollBarWidth = shallowRef(0);
    watchEffect(() => {
      bodyScrollWidth.value = props.scrollBodySizeInfo.scrollWidth || 0;
      bodyWidth.value = props.scrollBodySizeInfo.clientWidth || 0;
      scrollBarWidth.value = bodyScrollWidth.value && bodyWidth.value * (bodyWidth.value / bodyScrollWidth.value);
    }, {
      flush: 'post'
    });
    const scrollBarRef = shallowRef();
    const [scrollState, setScrollState] = useLayoutState({
      scrollLeft: 0,
      isHiddenScrollBar: true
    });
    const refState = ref({
      delta: 0,
      x: 0
    });
    const isActive = shallowRef(false);
    const onMouseUp = () => {
      isActive.value = false;
    };
    const onMouseDown = event => {
      refState.value = {
        delta: event.pageX - scrollState.value.scrollLeft,
        x: 0
      };
      isActive.value = true;
      event.preventDefault();
    };
    const onMouseMove = event => {
      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
      const {
        buttons
      } = event || (window === null || window === void 0 ? void 0 : window.event);
      if (!isActive.value || buttons === 0) {
        // If out body mouse up, we can set isActive false when mouse move
        if (isActive.value) {
          isActive.value = false;
        }
        return;
      }
      let left = refState.value.x + event.pageX - refState.value.x - refState.value.delta;
      if (left <= 0) {
        left = 0;
      }
      if (left + scrollBarWidth.value >= bodyWidth.value) {
        left = bodyWidth.value - scrollBarWidth.value;
      }
      emit('scroll', {
        scrollLeft: left / bodyWidth.value * (bodyScrollWidth.value + 2)
      });
      refState.value.x = event.pageX;
    };
    const onContainerScroll = () => {
      if (!props.scrollBodyRef.value) {
        return;
      }
      const tableOffsetTop = getOffset(props.scrollBodyRef.value).top;
      const tableBottomOffset = tableOffsetTop + props.scrollBodyRef.value.offsetHeight;
      const currentClientOffset = props.container === window ? document.documentElement.scrollTop + window.innerHeight : getOffset(props.container).top + props.container.clientHeight;
      if (tableBottomOffset - getScrollBarSize() <= currentClientOffset || tableOffsetTop >= currentClientOffset - props.offsetScroll) {
        setScrollState(state => _extends(_extends({}, state), {
          isHiddenScrollBar: true
        }));
      } else {
        setScrollState(state => _extends(_extends({}, state), {
          isHiddenScrollBar: false
        }));
      }
    };
    const setScrollLeft = left => {
      setScrollState(state => {
        return _extends(_extends({}, state), {
          scrollLeft: left / bodyScrollWidth.value * bodyWidth.value || 0
        });
      });
    };
    expose({
      setScrollLeft
    });
    let onMouseUpListener = null;
    let onMouseMoveListener = null;
    let onResizeListener = null;
    let onScrollListener = null;
    onMounted(() => {
      onMouseUpListener = addEventListenerWrap(document.body, 'mouseup', onMouseUp, false);
      onMouseMoveListener = addEventListenerWrap(document.body, 'mousemove', onMouseMove, false);
      onResizeListener = addEventListenerWrap(window, 'resize', onContainerScroll, false);
    });
    onActivated(() => {
      nextTick(() => {
        onContainerScroll();
      });
    });
    onMounted(() => {
      setTimeout(() => {
        watch([scrollBarWidth, isActive], () => {
          onContainerScroll();
        }, {
          immediate: true,
          flush: 'post'
        });
      });
    });
    watch(() => props.container, () => {
      onScrollListener === null || onScrollListener === void 0 ? void 0 : onScrollListener.remove();
      onScrollListener = addEventListenerWrap(props.container, 'scroll', onContainerScroll, false);
    }, {
      immediate: true,
      flush: 'post'
    });
    onBeforeUnmount(() => {
      onMouseUpListener === null || onMouseUpListener === void 0 ? void 0 : onMouseUpListener.remove();
      onMouseMoveListener === null || onMouseMoveListener === void 0 ? void 0 : onMouseMoveListener.remove();
      onScrollListener === null || onScrollListener === void 0 ? void 0 : onScrollListener.remove();
      onResizeListener === null || onResizeListener === void 0 ? void 0 : onResizeListener.remove();
    });
    watch(() => _extends({}, scrollState.value), (newState, preState) => {
      if (newState.isHiddenScrollBar !== (preState === null || preState === void 0 ? void 0 : preState.isHiddenScrollBar) && !newState.isHiddenScrollBar) {
        setScrollState(state => {
          const bodyNode = props.scrollBodyRef.value;
          if (!bodyNode) {
            return state;
          }
          return _extends(_extends({}, state), {
            scrollLeft: bodyNode.scrollLeft / bodyNode.scrollWidth * bodyNode.clientWidth
          });
        });
      }
    }, {
      immediate: true
    });
    const scrollbarSize = getScrollBarSize();
    return () => {
      if (bodyScrollWidth.value <= bodyWidth.value || !scrollBarWidth.value || scrollState.value.isHiddenScrollBar) {
        return null;
      }
      const {
        prefixCls
      } = tableContext;
      return createVNode("div", {
        "style": {
          height: `${scrollbarSize}px`,
          width: `${bodyWidth.value}px`,
          bottom: `${props.offsetScroll}px`
        },
        "class": `${prefixCls}-sticky-scroll`
      }, [createVNode("div", {
        "onMousedown": onMouseDown,
        "ref": scrollBarRef,
        "class": classNames(`${prefixCls}-sticky-scroll-bar`, {
          [`${prefixCls}-sticky-scroll-bar-active`]: isActive.value
        }),
        "style": {
          width: `${scrollBarWidth.value}px`,
          transform: `translate3d(${scrollState.value.scrollLeft}px, 0, 0)`
        }
      }, null)]);
    };
  }
});

// fix ssr render
const defaultContainer = null;
/** Sticky header hooks */
function useSticky(stickyRef, prefixClsRef) {
  return computed(() => {
    const {
      offsetHeader = 0,
      offsetSummary = 0,
      offsetScroll = 0,
      getContainer = () => defaultContainer
    } = typeof stickyRef.value === 'object' ? stickyRef.value : {};
    const container = getContainer() || defaultContainer;
    const isSticky = !!stickyRef.value;
    return {
      isSticky,
      stickyClassName: isSticky ? `${prefixClsRef.value}-sticky-holder` : '',
      offsetHeader,
      offsetSummary,
      offsetScroll,
      container
    };
  });
}

function useColumnWidth(colWidthsRef, columCountRef) {
  return computed(() => {
    const cloneColumns = [];
    const colWidths = colWidthsRef.value;
    const columCount = columCountRef.value;
    for (let i = 0; i < columCount; i += 1) {
      const val = colWidths[i];
      if (val !== undefined) {
        cloneColumns[i] = val;
      } else {
        return null;
      }
    }
    return cloneColumns;
  });
}
const FixedHolder = defineComponent({
  name: 'FixedHolder',
  inheritAttrs: false,
  props: ['columns', 'flattenColumns', 'stickyOffsets', 'customHeaderRow', 'noData', 'maxContentScroll', 'colWidths', 'columCount', 'direction', 'fixHeader', 'stickyTopOffset', 'stickyBottomOffset', 'stickyClassName'],
  emits: ['scroll'],
  setup(props, _ref) {
    let {
      attrs,
      slots,
      emit
    } = _ref;
    const tableContext = useInjectTable();
    const combinationScrollBarSize = computed(() => tableContext.isSticky && !props.fixHeader ? 0 : tableContext.scrollbarSize);
    const scrollRef = ref();
    const onWheel = e => {
      const {
        currentTarget,
        deltaX
      } = e;
      if (deltaX) {
        emit('scroll', {
          currentTarget,
          scrollLeft: currentTarget.scrollLeft + deltaX
        });
        e.preventDefault();
      }
    };
    const wheelEvent = ref();
    onMounted(() => {
      nextTick(() => {
        wheelEvent.value = addEventListenerWrap(scrollRef.value, 'wheel', onWheel);
      });
    });
    onBeforeUnmount(() => {
      var _a;
      (_a = wheelEvent.value) === null || _a === void 0 ? void 0 : _a.remove();
    });
    // Check if all flattenColumns has width
    const allFlattenColumnsWithWidth = computed(() => props.flattenColumns.every(column => column.width && column.width !== 0 && column.width !== '0px'));
    const columnsWithScrollbar = ref([]);
    const flattenColumnsWithScrollbar = ref([]);
    watchEffect(() => {
      // Add scrollbar column
      const lastColumn = props.flattenColumns[props.flattenColumns.length - 1];
      const ScrollBarColumn = {
        fixed: lastColumn ? lastColumn.fixed : null,
        scrollbar: true,
        customHeaderCell: () => ({
          class: `${tableContext.prefixCls}-cell-scrollbar`
        })
      };
      columnsWithScrollbar.value = combinationScrollBarSize.value ? [...props.columns, ScrollBarColumn] : props.columns;
      flattenColumnsWithScrollbar.value = combinationScrollBarSize.value ? [...props.flattenColumns, ScrollBarColumn] : props.flattenColumns;
    });
    // Calculate the sticky offsets
    const headerStickyOffsets = computed(() => {
      const {
        stickyOffsets,
        direction
      } = props;
      const {
        right,
        left
      } = stickyOffsets;
      return _extends(_extends({}, stickyOffsets), {
        left: direction === 'rtl' ? [...left.map(width => width + combinationScrollBarSize.value), 0] : left,
        right: direction === 'rtl' ? right : [...right.map(width => width + combinationScrollBarSize.value), 0],
        isSticky: tableContext.isSticky
      });
    });
    const mergedColumnWidth = useColumnWidth(toRef(props, 'colWidths'), toRef(props, 'columCount'));
    return () => {
      var _a;
      const {
        noData,
        columCount,
        stickyTopOffset,
        stickyBottomOffset,
        stickyClassName,
        maxContentScroll
      } = props;
      const {
        isSticky
      } = tableContext;
      return createVNode("div", {
        "style": _extends({
          overflow: 'hidden'
        }, isSticky ? {
          top: `${stickyTopOffset}px`,
          bottom: `${stickyBottomOffset}px`
        } : {}),
        "ref": scrollRef,
        "class": classNames(attrs.class, {
          [stickyClassName]: !!stickyClassName
        })
      }, [createVNode("table", {
        "style": {
          tableLayout: 'fixed',
          visibility: noData || mergedColumnWidth.value ? null : 'hidden'
        }
      }, [(!noData || !maxContentScroll || allFlattenColumnsWithWidth.value) && createVNode(ColGroup, {
        "colWidths": mergedColumnWidth.value ? [...mergedColumnWidth.value, combinationScrollBarSize.value] : [],
        "columCount": columCount + 1,
        "columns": flattenColumnsWithScrollbar.value
      }, null), (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots, _extends(_extends({}, props), {
        stickyOffsets: headerStickyOffsets.value,
        columns: columnsWithScrollbar.value,
        flattenColumns: flattenColumnsWithScrollbar.value
      }))])]);
    };
  }
});

/**
 * Reactively pick fields from a reactive object
 *
 * @see https://vueuse.js.org/reactivePick
 */
function reactivePick(obj) {
  for (var _len = arguments.length, keys = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }
  return reactive(fromPairs(keys.map(k => [k, toRef(obj, k)])));
}

// Used for conditions cache
const EMPTY_DATA = [];
// Used for customize scroll
const EMPTY_SCROLL_TARGET = {};
const INTERNAL_HOOKS = 'rc-table-internal-hook';
const Table$2 = defineComponent({
  name: 'VcTable',
  inheritAttrs: false,
  props: ['prefixCls', 'data', 'columns', 'rowKey', 'tableLayout', 'scroll', 'rowClassName', 'title', 'footer', 'id', 'showHeader', 'components', 'customRow', 'customHeaderRow', 'direction', 'expandFixed', 'expandColumnWidth', 'expandedRowKeys', 'defaultExpandedRowKeys', 'expandedRowRender', 'expandRowByClick', 'expandIcon', 'onExpand', 'onExpandedRowsChange', 'onUpdate:expandedRowKeys', 'defaultExpandAllRows', 'indentSize', 'expandIconColumnIndex', 'expandedRowClassName', 'childrenColumnName', 'rowExpandable', 'sticky', 'transformColumns', 'internalHooks', 'internalRefs', 'canExpandable', 'onUpdateInternalRefs', 'transformCellText'],
  emits: ['expand', 'expandedRowsChange', 'updateInternalRefs', 'update:expandedRowKeys'],
  setup(props, _ref) {
    let {
      attrs,
      slots,
      emit
    } = _ref;
    const mergedData = computed(() => props.data || EMPTY_DATA);
    const hasData = computed(() => !!mergedData.value.length);
    // ==================== Customize =====================
    const mergedComponents = computed(() => mergeObject(props.components, {}));
    const getComponent = (path, defaultComponent) => getPathValue(mergedComponents.value, path) || defaultComponent;
    const getRowKey = computed(() => {
      const rowKey = props.rowKey;
      if (typeof rowKey === 'function') {
        return rowKey;
      }
      return record => {
        const key = record && record[rowKey];
        return key;
      };
    });
    // ====================== Expand ======================
    const mergedExpandIcon = computed(() => props.expandIcon || renderExpandIcon$1);
    const mergedChildrenColumnName = computed(() => props.childrenColumnName || 'children');
    const expandableType = computed(() => {
      if (props.expandedRowRender) {
        return 'row';
      }
      /* eslint-disable no-underscore-dangle */
      /**
       * Fix https://github.com/ant-design/ant-design/issues/21154
       * This is a workaround to not to break current behavior.
       * We can remove follow code after final release.
       *
       * To other developer:
       *  Do not use `__PARENT_RENDER_ICON__` in prod since we will remove this when refactor
       */
      if (props.canExpandable || mergedData.value.some(record => record && typeof record === 'object' && record[mergedChildrenColumnName.value])) {
        return 'nest';
      }
      /* eslint-enable */
      return false;
    });
    const innerExpandedKeys = shallowRef([]);
    const stop = watchEffect(() => {
      if (props.defaultExpandedRowKeys) {
        innerExpandedKeys.value = props.defaultExpandedRowKeys;
      }
      if (props.defaultExpandAllRows) {
        innerExpandedKeys.value = findAllChildrenKeys(mergedData.value, getRowKey.value, mergedChildrenColumnName.value);
      }
    });
    // defalutXxxx 仅仅第一次生效
    stop();
    const mergedExpandedKeys = computed(() => new Set(props.expandedRowKeys || innerExpandedKeys.value || []));
    const onTriggerExpand = record => {
      const key = getRowKey.value(record, mergedData.value.indexOf(record));
      let newExpandedKeys;
      const hasKey = mergedExpandedKeys.value.has(key);
      if (hasKey) {
        mergedExpandedKeys.value.delete(key);
        newExpandedKeys = [...mergedExpandedKeys.value];
      } else {
        newExpandedKeys = [...mergedExpandedKeys.value, key];
      }
      innerExpandedKeys.value = newExpandedKeys;
      emit('expand', !hasKey, record);
      emit('update:expandedRowKeys', newExpandedKeys);
      emit('expandedRowsChange', newExpandedKeys);
    };
    const componentWidth = ref(0);
    const [columns, flattenColumns] = useColumns$1(_extends(_extends({}, toRefs(props)), {
      // children,
      expandable: computed(() => !!props.expandedRowRender),
      expandedKeys: mergedExpandedKeys,
      getRowKey,
      onTriggerExpand,
      expandIcon: mergedExpandIcon
    }), computed(() => props.internalHooks === INTERNAL_HOOKS ? props.transformColumns : null));
    const columnContext = computed(() => ({
      columns: columns.value,
      flattenColumns: flattenColumns.value
    }));
    // ====================== Scroll ======================
    const fullTableRef = ref();
    const scrollHeaderRef = ref();
    const scrollBodyRef = ref();
    const scrollBodySizeInfo = ref({
      scrollWidth: 0,
      clientWidth: 0
    });
    const scrollSummaryRef = ref();
    const [pingedLeft, setPingedLeft] = useState(false);
    const [pingedRight, setPingedRight] = useState(false);
    const [colsWidths, updateColsWidths] = useLayoutState(new Map());
    // Convert map to number width
    const colsKeys = computed(() => getColumnsKey(flattenColumns.value));
    const colWidths = computed(() => colsKeys.value.map(columnKey => colsWidths.value.get(columnKey)));
    const columnCount = computed(() => flattenColumns.value.length);
    const stickyOffsets = useStickyOffsets(colWidths, columnCount, toRef(props, 'direction'));
    const fixHeader = computed(() => props.scroll && validateValue(props.scroll.y));
    const horizonScroll = computed(() => props.scroll && validateValue(props.scroll.x) || Boolean(props.expandFixed));
    const fixColumn = computed(() => horizonScroll.value && flattenColumns.value.some(_ref2 => {
      let {
        fixed
      } = _ref2;
      return fixed;
    }));
    // Sticky
    const stickyRef = ref();
    const stickyState = useSticky(toRef(props, 'sticky'), toRef(props, 'prefixCls'));
    const summaryFixedInfos = reactive({});
    const fixFooter = computed(() => {
      const info = Object.values(summaryFixedInfos)[0];
      return (fixHeader.value || stickyState.value.isSticky) && info;
    });
    const summaryCollect = (uniKey, fixed) => {
      if (fixed) {
        summaryFixedInfos[uniKey] = fixed;
      } else {
        delete summaryFixedInfos[uniKey];
      }
    };
    // Scroll
    const scrollXStyle = ref({});
    const scrollYStyle = ref({});
    const scrollTableStyle = ref({});
    watchEffect(() => {
      if (fixHeader.value) {
        scrollYStyle.value = {
          overflowY: 'scroll',
          maxHeight: toPx(props.scroll.y)
        };
      }
      if (horizonScroll.value) {
        scrollXStyle.value = {
          overflowX: 'auto'
        };
        // When no vertical scrollbar, should hide it
        // https://github.com/ant-design/ant-design/pull/20705
        // https://github.com/ant-design/ant-design/issues/21879
        if (!fixHeader.value) {
          scrollYStyle.value = {
            overflowY: 'hidden'
          };
        }
        scrollTableStyle.value = {
          width: props.scroll.x === true ? 'auto' : toPx(props.scroll.x),
          minWidth: '100%'
        };
      }
    });
    const onColumnResize = (columnKey, width) => {
      if (isVisible(fullTableRef.value)) {
        updateColsWidths(widths => {
          if (widths.get(columnKey) !== width) {
            const newWidths = new Map(widths);
            newWidths.set(columnKey, width);
            return newWidths;
          }
          return widths;
        });
      }
    };
    const [setScrollTarget, getScrollTarget] = useTimeoutLock();
    function forceScroll(scrollLeft, target) {
      if (!target) {
        return;
      }
      if (typeof target === 'function') {
        target(scrollLeft);
        return;
      }
      const domTarget = target.$el || target;
      if (domTarget.scrollLeft !== scrollLeft) {
        // eslint-disable-next-line no-param-reassign
        domTarget.scrollLeft = scrollLeft;
      }
    }
    const onScroll = _ref3 => {
      let {
        currentTarget,
        scrollLeft
      } = _ref3;
      var _a;
      const isRTL = props.direction === 'rtl';
      const mergedScrollLeft = typeof scrollLeft === 'number' ? scrollLeft : currentTarget.scrollLeft;
      const compareTarget = currentTarget || EMPTY_SCROLL_TARGET;
      if (!getScrollTarget() || getScrollTarget() === compareTarget) {
        setScrollTarget(compareTarget);
        forceScroll(mergedScrollLeft, scrollHeaderRef.value);
        forceScroll(mergedScrollLeft, scrollBodyRef.value);
        forceScroll(mergedScrollLeft, scrollSummaryRef.value);
        forceScroll(mergedScrollLeft, (_a = stickyRef.value) === null || _a === void 0 ? void 0 : _a.setScrollLeft);
      }
      if (currentTarget) {
        const {
          scrollWidth,
          clientWidth
        } = currentTarget;
        if (isRTL) {
          setPingedLeft(-mergedScrollLeft < scrollWidth - clientWidth);
          setPingedRight(-mergedScrollLeft > 0);
        } else {
          setPingedLeft(mergedScrollLeft > 0);
          setPingedRight(mergedScrollLeft < scrollWidth - clientWidth);
        }
      }
    };
    const triggerOnScroll = () => {
      if (horizonScroll.value && scrollBodyRef.value) {
        onScroll({
          currentTarget: scrollBodyRef.value
        });
      } else {
        setPingedLeft(false);
        setPingedRight(false);
      }
    };
    let timtout;
    const updateWidth = width => {
      if (width !== componentWidth.value) {
        triggerOnScroll();
        componentWidth.value = fullTableRef.value ? fullTableRef.value.offsetWidth : width;
      }
    };
    const onFullTableResize = _ref4 => {
      let {
        width
      } = _ref4;
      clearTimeout(timtout);
      if (componentWidth.value === 0) {
        updateWidth(width);
        return;
      }
      timtout = setTimeout(() => {
        updateWidth(width);
      }, 100);
    };
    watch([horizonScroll, () => props.data, () => props.columns], () => {
      if (horizonScroll.value) {
        triggerOnScroll();
      }
    }, {
      flush: 'post'
    });
    const [scrollbarSize, setScrollbarSize] = useState(0);
    useProvideSticky();
    onMounted(() => {
      nextTick(() => {
        var _a, _b;
        triggerOnScroll();
        setScrollbarSize(getTargetScrollBarSize(scrollBodyRef.value).width);
        scrollBodySizeInfo.value = {
          scrollWidth: ((_a = scrollBodyRef.value) === null || _a === void 0 ? void 0 : _a.scrollWidth) || 0,
          clientWidth: ((_b = scrollBodyRef.value) === null || _b === void 0 ? void 0 : _b.clientWidth) || 0
        };
      });
    });
    onUpdated(() => {
      nextTick(() => {
        var _a, _b;
        const scrollWidth = ((_a = scrollBodyRef.value) === null || _a === void 0 ? void 0 : _a.scrollWidth) || 0;
        const clientWidth = ((_b = scrollBodyRef.value) === null || _b === void 0 ? void 0 : _b.clientWidth) || 0;
        if (scrollBodySizeInfo.value.scrollWidth !== scrollWidth || scrollBodySizeInfo.value.clientWidth !== clientWidth) {
          scrollBodySizeInfo.value = {
            scrollWidth,
            clientWidth
          };
        }
      });
    });
    watchEffect(() => {
      if (props.internalHooks === INTERNAL_HOOKS && props.internalRefs) {
        props.onUpdateInternalRefs({
          body: scrollBodyRef.value ? scrollBodyRef.value.$el || scrollBodyRef.value : null
        });
      }
    }, {
      flush: 'post'
    });
    // Table layout
    const mergedTableLayout = computed(() => {
      if (props.tableLayout) {
        return props.tableLayout;
      }
      // https://github.com/ant-design/ant-design/issues/25227
      // When scroll.x is max-content, no need to fix table layout
      // it's width should stretch out to fit content
      if (fixColumn.value) {
        return props.scroll.x === 'max-content' ? 'auto' : 'fixed';
      }
      if (fixHeader.value || stickyState.value.isSticky || flattenColumns.value.some(_ref5 => {
        let {
          ellipsis
        } = _ref5;
        return ellipsis;
      })) {
        return 'fixed';
      }
      return 'auto';
    });
    const emptyNode = () => {
      var _a;
      return hasData.value ? null : ((_a = slots.emptyText) === null || _a === void 0 ? void 0 : _a.call(slots)) || 'No Data';
    };
    useProvideTable(reactive(_extends(_extends({}, toRefs(reactivePick(props, 'prefixCls', 'direction', 'transformCellText'))), {
      getComponent,
      scrollbarSize,
      fixedInfoList: computed(() => flattenColumns.value.map((_, colIndex) => getCellFixedInfo(colIndex, colIndex, flattenColumns.value, stickyOffsets.value, props.direction))),
      isSticky: computed(() => stickyState.value.isSticky),
      summaryCollect
    })));
    useProvideBody(reactive(_extends(_extends({}, toRefs(reactivePick(props, 'rowClassName', 'expandedRowClassName', 'expandRowByClick', 'expandedRowRender', 'expandIconColumnIndex', 'indentSize'))), {
      columns,
      flattenColumns,
      tableLayout: mergedTableLayout,
      expandIcon: mergedExpandIcon,
      expandableType,
      onTriggerExpand
    })));
    useProvideResize({
      onColumnResize
    });
    useProvideExpandedRow({
      componentWidth,
      fixHeader,
      fixColumn,
      horizonScroll
    });
    // Body
    const bodyTable = () => createVNode(Body, {
      "data": mergedData.value,
      "measureColumnWidth": fixHeader.value || horizonScroll.value || stickyState.value.isSticky,
      "expandedKeys": mergedExpandedKeys.value,
      "rowExpandable": props.rowExpandable,
      "getRowKey": getRowKey.value,
      "customRow": props.customRow,
      "childrenColumnName": mergedChildrenColumnName.value
    }, {
      emptyNode
    });
    const bodyColGroup = () => createVNode(ColGroup, {
      "colWidths": flattenColumns.value.map(_ref6 => {
        let {
          width
        } = _ref6;
        return width;
      }),
      "columns": flattenColumns.value
    }, null);
    return () => {
      var _a;
      const {
        prefixCls,
        scroll,
        tableLayout,
        direction,
        // Additional Part
        title = slots.title,
        footer = slots.footer,
        // Customize
        id,
        showHeader,
        customHeaderRow
      } = props;
      const {
        isSticky,
        offsetHeader,
        offsetSummary,
        offsetScroll,
        stickyClassName,
        container
      } = stickyState.value;
      const TableComponent = getComponent(['table'], 'table');
      const customizeScrollBody = getComponent(['body']);
      const summaryNode = (_a = slots.summary) === null || _a === void 0 ? void 0 : _a.call(slots, {
        pageData: mergedData.value
      });
      let groupTableNode = () => null;
      // Header props
      const headerProps = {
        colWidths: colWidths.value,
        columCount: flattenColumns.value.length,
        stickyOffsets: stickyOffsets.value,
        customHeaderRow,
        fixHeader: fixHeader.value,
        scroll
      };
      if (fixHeader.value || isSticky) {
        // >>>>>> Fixed Header
        let bodyContent = () => null;
        if (typeof customizeScrollBody === 'function') {
          bodyContent = () => customizeScrollBody(mergedData.value, {
            scrollbarSize: scrollbarSize.value,
            ref: scrollBodyRef,
            onScroll
          });
          headerProps.colWidths = flattenColumns.value.map((_ref7, index) => {
            let {
              width
            } = _ref7;
            const colWidth = index === columns.value.length - 1 ? width - scrollbarSize.value : width;
            if (typeof colWidth === 'number' && !Number.isNaN(colWidth)) {
              return colWidth;
            }
            return 0;
          });
        } else {
          bodyContent = () => createVNode("div", {
            "style": _extends(_extends({}, scrollXStyle.value), scrollYStyle.value),
            "onScroll": onScroll,
            "ref": scrollBodyRef,
            "class": classNames(`${prefixCls}-body`)
          }, [createVNode(TableComponent, {
            "style": _extends(_extends({}, scrollTableStyle.value), {
              tableLayout: mergedTableLayout.value
            })
          }, {
            default: () => [bodyColGroup(), bodyTable(), !fixFooter.value && summaryNode && createVNode(Footer, {
              "stickyOffsets": stickyOffsets.value,
              "flattenColumns": flattenColumns.value
            }, {
              default: () => [summaryNode]
            })]
          })]);
        }
        // Fixed holder share the props
        const fixedHolderProps = _extends(_extends(_extends({
          noData: !mergedData.value.length,
          maxContentScroll: horizonScroll.value && scroll.x === 'max-content'
        }, headerProps), columnContext.value), {
          direction,
          stickyClassName,
          onScroll
        });
        groupTableNode = () => createVNode(Fragment, null, [showHeader !== false && createVNode(FixedHolder, _objectSpread$5(_objectSpread$5({}, fixedHolderProps), {}, {
          "stickyTopOffset": offsetHeader,
          "class": `${prefixCls}-header`,
          "ref": scrollHeaderRef
        }), {
          default: fixedHolderPassProps => createVNode(Fragment, null, [createVNode(Header, fixedHolderPassProps, null), fixFooter.value === 'top' && createVNode(Footer, fixedHolderPassProps, {
            default: () => [summaryNode]
          })])
        }), bodyContent(), fixFooter.value && fixFooter.value !== 'top' && createVNode(FixedHolder, _objectSpread$5(_objectSpread$5({}, fixedHolderProps), {}, {
          "stickyBottomOffset": offsetSummary,
          "class": `${prefixCls}-summary`,
          "ref": scrollSummaryRef
        }), {
          default: fixedHolderPassProps => createVNode(Footer, fixedHolderPassProps, {
            default: () => [summaryNode]
          })
        }), isSticky && scrollBodyRef.value && createVNode(StickyScrollBar, {
          "ref": stickyRef,
          "offsetScroll": offsetScroll,
          "scrollBodyRef": scrollBodyRef,
          "onScroll": onScroll,
          "container": container,
          "scrollBodySizeInfo": scrollBodySizeInfo.value
        }, null)]);
      } else {
        // >>>>>> Unique table
        groupTableNode = () => createVNode("div", {
          "style": _extends(_extends({}, scrollXStyle.value), scrollYStyle.value),
          "class": classNames(`${prefixCls}-content`),
          "onScroll": onScroll,
          "ref": scrollBodyRef
        }, [createVNode(TableComponent, {
          "style": _extends(_extends({}, scrollTableStyle.value), {
            tableLayout: mergedTableLayout.value
          })
        }, {
          default: () => [bodyColGroup(), showHeader !== false && createVNode(Header, _objectSpread$5(_objectSpread$5({}, headerProps), columnContext.value), null), bodyTable(), summaryNode && createVNode(Footer, {
            "stickyOffsets": stickyOffsets.value,
            "flattenColumns": flattenColumns.value
          }, {
            default: () => [summaryNode]
          })]
        })]);
      }
      const ariaProps = pickAttrs(attrs, {
        aria: true,
        data: true
      });
      const fullTable = () => createVNode("div", _objectSpread$5(_objectSpread$5({}, ariaProps), {}, {
        "class": classNames(prefixCls, {
          [`${prefixCls}-rtl`]: direction === 'rtl',
          [`${prefixCls}-ping-left`]: pingedLeft.value,
          [`${prefixCls}-ping-right`]: pingedRight.value,
          [`${prefixCls}-layout-fixed`]: tableLayout === 'fixed',
          [`${prefixCls}-fixed-header`]: fixHeader.value,
          /** No used but for compatible */
          [`${prefixCls}-fixed-column`]: fixColumn.value,
          [`${prefixCls}-scroll-horizontal`]: horizonScroll.value,
          [`${prefixCls}-has-fix-left`]: flattenColumns.value[0] && flattenColumns.value[0].fixed,
          [`${prefixCls}-has-fix-right`]: flattenColumns.value[columnCount.value - 1] && flattenColumns.value[columnCount.value - 1].fixed === 'right',
          [attrs.class]: attrs.class
        }),
        "style": attrs.style,
        "id": id,
        "ref": fullTableRef
      }), [title && createVNode(Panel, {
        "class": `${prefixCls}-title`
      }, {
        default: () => [title(mergedData.value)]
      }), createVNode("div", {
        "class": `${prefixCls}-container`
      }, [groupTableNode()]), footer && createVNode(Panel, {
        "class": `${prefixCls}-footer`
      }, {
        default: () => [footer(mergedData.value)]
      })]);
      if (horizonScroll.value) {
        return createVNode(ResizeObserver, {
          "onResize": onFullTableResize
        }, {
          default: fullTable
        });
      }
      return fullTable();
    };
  }
});

function extendsObject() {
  const result = _extends({}, arguments.length <= 0 ? undefined : arguments[0]);
  for (let i = 1; i < arguments.length; i++) {
    const obj = i < 0 || arguments.length <= i ? undefined : arguments[i];
    if (obj) {
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val !== undefined) {
          result[key] = val;
        }
      });
    }
  }
  return result;
}

const DEFAULT_PAGE_SIZE = 10;
function getPaginationParam(mergedPagination, pagination) {
  const param = {
    current: mergedPagination.current,
    pageSize: mergedPagination.pageSize
  };
  const paginationObj = pagination && typeof pagination === 'object' ? pagination : {};
  Object.keys(paginationObj).forEach(pageProp => {
    const value = mergedPagination[pageProp];
    if (typeof value !== 'function') {
      param[pageProp] = value;
    }
  });
  return param;
}
function usePagination(totalRef, paginationRef, onChange) {
  const pagination = computed(() => paginationRef.value && typeof paginationRef.value === 'object' ? paginationRef.value : {});
  const paginationTotal = computed(() => pagination.value.total || 0);
  const [innerPagination, setInnerPagination] = useState(() => ({
    current: 'defaultCurrent' in pagination.value ? pagination.value.defaultCurrent : 1,
    pageSize: 'defaultPageSize' in pagination.value ? pagination.value.defaultPageSize : DEFAULT_PAGE_SIZE
  }));
  // ============ Basic Pagination Config ============
  const mergedPagination = computed(() => {
    const mP = extendsObject(innerPagination.value, pagination.value, {
      total: paginationTotal.value > 0 ? paginationTotal.value : totalRef.value
    });
    // Reset `current` if data length or pageSize changed
    const maxPage = Math.ceil((paginationTotal.value || totalRef.value) / mP.pageSize);
    if (mP.current > maxPage) {
      // Prevent a maximum page count of 0
      mP.current = maxPage || 1;
    }
    return mP;
  });
  const refreshPagination = (current, pageSize) => {
    if (paginationRef.value === false) return;
    setInnerPagination({
      current: current !== null && current !== void 0 ? current : 1,
      pageSize: pageSize || mergedPagination.value.pageSize
    });
  };
  const onInternalChange = (current, pageSize) => {
    var _a, _b;
    if (paginationRef.value) {
      (_b = (_a = pagination.value).onChange) === null || _b === void 0 ? void 0 : _b.call(_a, current, pageSize);
    }
    refreshPagination(current, pageSize);
    onChange(current, pageSize || mergedPagination.value.pageSize);
  };
  return [computed(() => {
    return paginationRef.value === false ? {} : _extends(_extends({}, mergedPagination.value), {
      onChange: onInternalChange
    });
  }), refreshPagination];
}

function useLazyKVMap(dataRef, childrenColumnNameRef, getRowKeyRef) {
  const mapCacheRef = shallowRef({});
  watch([dataRef, childrenColumnNameRef, getRowKeyRef], () => {
    const kvMap = new Map();
    const getRowKey = getRowKeyRef.value;
    const childrenColumnName = childrenColumnNameRef.value;
    /* eslint-disable no-inner-declarations */
    function dig(records) {
      records.forEach((record, index) => {
        const rowKey = getRowKey(record, index);
        kvMap.set(rowKey, record);
        if (record && typeof record === 'object' && childrenColumnName in record) {
          dig(record[childrenColumnName] || []);
        }
      });
    }
    /* eslint-enable */
    dig(dataRef.value);
    mapCacheRef.value = {
      kvMap
    };
  }, {
    deep: true,
    immediate: true
  });
  function getRecordByKey(key) {
    return mapCacheRef.value.kvMap.get(key);
  }
  return [getRecordByKey];
}

// TODO: warning if use ajax!!!
const SELECTION_COLUMN = {};
const SELECTION_ALL = 'SELECT_ALL';
const SELECTION_INVERT = 'SELECT_INVERT';
const SELECTION_NONE = 'SELECT_NONE';
const EMPTY_LIST$1 = [];
function flattenData(childrenColumnName, data) {
  let list = [];
  (data || []).forEach(record => {
    list.push(record);
    if (record && typeof record === 'object' && childrenColumnName in record) {
      list = [...list, ...flattenData(childrenColumnName, record[childrenColumnName])];
    }
  });
  return list;
}
function useSelection(rowSelectionRef, configRef) {
  const mergedRowSelection = computed(() => {
    const temp = rowSelectionRef.value || {};
    const {
      checkStrictly = true
    } = temp;
    return _extends(_extends({}, temp), {
      checkStrictly
    });
  });
  // ========================= Keys =========================
  const [mergedSelectedKeys, setMergedSelectedKeys] = useMergedState(mergedRowSelection.value.selectedRowKeys || mergedRowSelection.value.defaultSelectedRowKeys || EMPTY_LIST$1, {
    value: computed(() => mergedRowSelection.value.selectedRowKeys)
  });
  // ======================== Caches ========================
  const preserveRecordsRef = shallowRef(new Map());
  const updatePreserveRecordsCache = keys => {
    if (mergedRowSelection.value.preserveSelectedRowKeys) {
      const newCache = new Map();
      // Keep key if mark as preserveSelectedRowKeys
      keys.forEach(key => {
        let record = configRef.getRecordByKey(key);
        if (!record && preserveRecordsRef.value.has(key)) {
          record = preserveRecordsRef.value.get(key);
        }
        newCache.set(key, record);
      });
      // Refresh to new cache
      preserveRecordsRef.value = newCache;
    }
  };
  watchEffect(() => {
    updatePreserveRecordsCache(mergedSelectedKeys.value);
  });
  const keyEntities = computed(() => mergedRowSelection.value.checkStrictly ? null : convertDataToEntities(configRef.data.value, {
    externalGetKey: configRef.getRowKey.value,
    childrenPropName: configRef.childrenColumnName.value
  }).keyEntities);
  // Get flatten data
  const flattedData = computed(() => flattenData(configRef.childrenColumnName.value, configRef.pageData.value));
  // Get all checkbox props
  const checkboxPropsMap = computed(() => {
    const map = new Map();
    const getRowKey = configRef.getRowKey.value;
    const getCheckboxProps = mergedRowSelection.value.getCheckboxProps;
    flattedData.value.forEach((record, index) => {
      const key = getRowKey(record, index);
      const checkboxProps = (getCheckboxProps ? getCheckboxProps(record) : null) || {};
      map.set(key, checkboxProps);
    });
    return map;
  });
  const {
    maxLevel,
    levelEntities
  } = useMaxLevel(keyEntities);
  const isCheckboxDisabled = r => {
    var _a;
    return !!((_a = checkboxPropsMap.value.get(configRef.getRowKey.value(r))) === null || _a === void 0 ? void 0 : _a.disabled);
  };
  const selectKeysState = computed(() => {
    if (mergedRowSelection.value.checkStrictly) {
      return [mergedSelectedKeys.value || [], []];
    }
    const {
      checkedKeys,
      halfCheckedKeys
    } = conductCheck(mergedSelectedKeys.value, true, keyEntities.value, maxLevel.value, levelEntities.value, isCheckboxDisabled);
    return [checkedKeys || [], halfCheckedKeys];
  });
  const derivedSelectedKeys = computed(() => selectKeysState.value[0]);
  const derivedHalfSelectedKeys = computed(() => selectKeysState.value[1]);
  const derivedSelectedKeySet = computed(() => {
    const keys = mergedRowSelection.value.type === 'radio' ? derivedSelectedKeys.value.slice(0, 1) : derivedSelectedKeys.value;
    return new Set(keys);
  });
  const derivedHalfSelectedKeySet = computed(() => mergedRowSelection.value.type === 'radio' ? new Set() : new Set(derivedHalfSelectedKeys.value));
  // Save last selected key to enable range selection
  const [lastSelectedKey, setLastSelectedKey] = useState(null);
  // // Reset if rowSelection reset
  // we use computed to reset, donot need setMergedSelectedKeys again like react
  // https://github.com/vueComponent/ant-design-vue/issues/4885
  // watchEffect(() => {
  //   if (!rowSelectionRef.value) {
  //     setMergedSelectedKeys([]);
  //   }
  // });
  const setSelectedKeys = keys => {
    let availableKeys;
    let records;
    updatePreserveRecordsCache(keys);
    const {
      preserveSelectedRowKeys,
      onChange: onSelectionChange
    } = mergedRowSelection.value;
    const {
      getRecordByKey
    } = configRef;
    if (preserveSelectedRowKeys) {
      availableKeys = keys;
      records = keys.map(key => preserveRecordsRef.value.get(key));
    } else {
      // Filter key which not exist in the `dataSource`
      availableKeys = [];
      records = [];
      keys.forEach(key => {
        const record = getRecordByKey(key);
        if (record !== undefined) {
          availableKeys.push(key);
          records.push(record);
        }
      });
    }
    setMergedSelectedKeys(availableKeys);
    onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(availableKeys, records);
  };
  // ====================== Selections ======================
  // Trigger single `onSelect` event
  const triggerSingleSelection = (key, selected, keys, event) => {
    const {
      onSelect
    } = mergedRowSelection.value;
    const {
      getRecordByKey
    } = configRef || {};
    if (onSelect) {
      const rows = keys.map(k => getRecordByKey(k));
      onSelect(getRecordByKey(key), selected, rows, event);
    }
    setSelectedKeys(keys);
  };
  const mergedSelections = computed(() => {
    const {
      onSelectInvert,
      onSelectNone,
      selections,
      hideSelectAll
    } = mergedRowSelection.value;
    const {
      data,
      pageData,
      getRowKey,
      locale: tableLocale
    } = configRef;
    if (!selections || hideSelectAll) {
      return null;
    }
    const selectionList = selections === true ? [SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE] : selections;
    return selectionList.map(selection => {
      if (selection === SELECTION_ALL) {
        return {
          key: 'all',
          text: tableLocale.value.selectionAll,
          onSelect() {
            setSelectedKeys(data.value.map((record, index) => getRowKey.value(record, index)).filter(key => {
              const checkProps = checkboxPropsMap.value.get(key);
              return !(checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled) || derivedSelectedKeySet.value.has(key);
            }));
          }
        };
      }
      if (selection === SELECTION_INVERT) {
        return {
          key: 'invert',
          text: tableLocale.value.selectInvert,
          onSelect() {
            const keySet = new Set(derivedSelectedKeySet.value);
            pageData.value.forEach((record, index) => {
              const key = getRowKey.value(record, index);
              const checkProps = checkboxPropsMap.value.get(key);
              if (!(checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled)) {
                if (keySet.has(key)) {
                  keySet.delete(key);
                } else {
                  keySet.add(key);
                }
              }
            });
            const keys = Array.from(keySet);
            if (onSelectInvert) {
              devWarning(false, 'Table', '`onSelectInvert` will be removed in future. Please use `onChange` instead.');
              onSelectInvert(keys);
            }
            setSelectedKeys(keys);
          }
        };
      }
      if (selection === SELECTION_NONE) {
        return {
          key: 'none',
          text: tableLocale.value.selectNone,
          onSelect() {
            onSelectNone === null || onSelectNone === void 0 ? void 0 : onSelectNone();
            setSelectedKeys(Array.from(derivedSelectedKeySet.value).filter(key => {
              const checkProps = checkboxPropsMap.value.get(key);
              return checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled;
            }));
          }
        };
      }
      return selection;
    });
  });
  const flattedDataLength = computed(() => flattedData.value.length);
  // ======================= Columns ========================
  const transformColumns = columns => {
    var _a;
    const {
      onSelectAll,
      onSelectMultiple,
      columnWidth: selectionColWidth,
      type: selectionType,
      fixed,
      renderCell: customizeRenderCell,
      hideSelectAll,
      checkStrictly
    } = mergedRowSelection.value;
    const {
      prefixCls,
      getRecordByKey,
      getRowKey,
      expandType,
      getPopupContainer
    } = configRef;
    if (!rowSelectionRef.value) {
      return columns.filter(col => col !== SELECTION_COLUMN);
    }
    // Support selection
    let cloneColumns = columns.slice();
    const keySet = new Set(derivedSelectedKeySet.value);
    // Record key only need check with enabled
    const recordKeys = flattedData.value.map(getRowKey.value).filter(key => !checkboxPropsMap.value.get(key).disabled);
    const checkedCurrentAll = recordKeys.every(key => keySet.has(key));
    const checkedCurrentSome = recordKeys.some(key => keySet.has(key));
    const onSelectAllChange = () => {
      const changeKeys = [];
      if (checkedCurrentAll) {
        recordKeys.forEach(key => {
          keySet.delete(key);
          changeKeys.push(key);
        });
      } else {
        recordKeys.forEach(key => {
          if (!keySet.has(key)) {
            keySet.add(key);
            changeKeys.push(key);
          }
        });
      }
      const keys = Array.from(keySet);
      onSelectAll === null || onSelectAll === void 0 ? void 0 : onSelectAll(!checkedCurrentAll, keys.map(k => getRecordByKey(k)), changeKeys.map(k => getRecordByKey(k)));
      setSelectedKeys(keys);
    };
    // ===================== Render =====================
    // Title Cell
    let title;
    if (selectionType !== 'radio') {
      let customizeSelections;
      if (mergedSelections.value) {
        const menu = createVNode(Menu, {
          "getPopupContainer": getPopupContainer.value
        }, {
          default: () => [mergedSelections.value.map((selection, index) => {
            const {
              key,
              text,
              onSelect: onSelectionClick
            } = selection;
            return createVNode(Menu.Item, {
              "key": key || index,
              "onClick": () => {
                onSelectionClick === null || onSelectionClick === void 0 ? void 0 : onSelectionClick(recordKeys);
              }
            }, {
              default: () => [text]
            });
          })]
        });
        customizeSelections = createVNode("div", {
          "class": `${prefixCls.value}-selection-extra`
        }, [createVNode(Dropdown, {
          "overlay": menu,
          "getPopupContainer": getPopupContainer.value
        }, {
          default: () => [createVNode("span", null, [createVNode(DownOutlined, null, null)])]
        })]);
      }
      const allDisabledData = flattedData.value.map((record, index) => {
        const key = getRowKey.value(record, index);
        const checkboxProps = checkboxPropsMap.value.get(key) || {};
        return _extends({
          checked: keySet.has(key)
        }, checkboxProps);
      }).filter(_ref => {
        let {
          disabled
        } = _ref;
        return disabled;
      });
      const allDisabled = !!allDisabledData.length && allDisabledData.length === flattedDataLength.value;
      const allDisabledAndChecked = allDisabled && allDisabledData.every(_ref2 => {
        let {
          checked
        } = _ref2;
        return checked;
      });
      const allDisabledSomeChecked = allDisabled && allDisabledData.some(_ref3 => {
        let {
          checked
        } = _ref3;
        return checked;
      });
      title = !hideSelectAll && createVNode("div", {
        "class": `${prefixCls.value}-selection`
      }, [createVNode(Checkbox, {
        "checked": !allDisabled ? !!flattedDataLength.value && checkedCurrentAll : allDisabledAndChecked,
        "indeterminate": !allDisabled ? !checkedCurrentAll && checkedCurrentSome : !allDisabledAndChecked && allDisabledSomeChecked,
        "onChange": onSelectAllChange,
        "disabled": flattedDataLength.value === 0 || allDisabled,
        "aria-label": customizeSelections ? 'Custom selection' : 'Select all',
        "skipGroup": true
      }, null), customizeSelections]);
    }
    // Body Cell
    let renderCell;
    if (selectionType === 'radio') {
      renderCell = _ref4 => {
        let {
          record,
          index
        } = _ref4;
        const key = getRowKey.value(record, index);
        const checked = keySet.has(key);
        return {
          node: createVNode(Radio, _objectSpread$5(_objectSpread$5({}, checkboxPropsMap.value.get(key)), {}, {
            "checked": checked,
            "onClick": e => e.stopPropagation(),
            "onChange": event => {
              if (!keySet.has(key)) {
                triggerSingleSelection(key, true, [key], event.nativeEvent);
              }
            }
          }), null),
          checked
        };
      };
    } else {
      renderCell = _ref5 => {
        let {
          record,
          index
        } = _ref5;
        var _a;
        const key = getRowKey.value(record, index);
        const checked = keySet.has(key);
        const indeterminate = derivedHalfSelectedKeySet.value.has(key);
        const checkboxProps = checkboxPropsMap.value.get(key);
        let mergedIndeterminate;
        if (expandType.value === 'nest') {
          mergedIndeterminate = indeterminate;
          devWarning(typeof (checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.indeterminate) !== 'boolean', 'Table', 'set `indeterminate` using `rowSelection.getCheckboxProps` is not allowed with tree structured dataSource.');
        } else {
          mergedIndeterminate = (_a = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.indeterminate) !== null && _a !== void 0 ? _a : indeterminate;
        }
        // Record checked
        return {
          node: createVNode(Checkbox, _objectSpread$5(_objectSpread$5({}, checkboxProps), {}, {
            "indeterminate": mergedIndeterminate,
            "checked": checked,
            "skipGroup": true,
            "onClick": e => e.stopPropagation(),
            "onChange": _ref6 => {
              let {
                nativeEvent
              } = _ref6;
              const {
                shiftKey
              } = nativeEvent;
              let startIndex = -1;
              let endIndex = -1;
              // Get range of this
              if (shiftKey && checkStrictly) {
                const pointKeys = new Set([lastSelectedKey.value, key]);
                recordKeys.some((recordKey, recordIndex) => {
                  if (pointKeys.has(recordKey)) {
                    if (startIndex === -1) {
                      startIndex = recordIndex;
                    } else {
                      endIndex = recordIndex;
                      return true;
                    }
                  }
                  return false;
                });
              }
              if (endIndex !== -1 && startIndex !== endIndex && checkStrictly) {
                // Batch update selections
                const rangeKeys = recordKeys.slice(startIndex, endIndex + 1);
                const changedKeys = [];
                if (checked) {
                  rangeKeys.forEach(recordKey => {
                    if (keySet.has(recordKey)) {
                      changedKeys.push(recordKey);
                      keySet.delete(recordKey);
                    }
                  });
                } else {
                  rangeKeys.forEach(recordKey => {
                    if (!keySet.has(recordKey)) {
                      changedKeys.push(recordKey);
                      keySet.add(recordKey);
                    }
                  });
                }
                const keys = Array.from(keySet);
                onSelectMultiple === null || onSelectMultiple === void 0 ? void 0 : onSelectMultiple(!checked, keys.map(recordKey => getRecordByKey(recordKey)), changedKeys.map(recordKey => getRecordByKey(recordKey)));
                setSelectedKeys(keys);
              } else {
                // Single record selected
                const originCheckedKeys = derivedSelectedKeys.value;
                if (checkStrictly) {
                  const checkedKeys = checked ? arrDel(originCheckedKeys, key) : arrAdd(originCheckedKeys, key);
                  triggerSingleSelection(key, !checked, checkedKeys, nativeEvent);
                } else {
                  // Always fill first
                  const result = conductCheck([...originCheckedKeys, key], true, keyEntities.value, maxLevel.value, levelEntities.value, isCheckboxDisabled);
                  const {
                    checkedKeys,
                    halfCheckedKeys
                  } = result;
                  let nextCheckedKeys = checkedKeys;
                  // If remove, we do it again to correction
                  if (checked) {
                    const tempKeySet = new Set(checkedKeys);
                    tempKeySet.delete(key);
                    nextCheckedKeys = conductCheck(Array.from(tempKeySet), {
                      halfCheckedKeys
                    }, keyEntities.value, maxLevel.value, levelEntities.value, isCheckboxDisabled).checkedKeys;
                  }
                  triggerSingleSelection(key, !checked, nextCheckedKeys, nativeEvent);
                }
              }
              setLastSelectedKey(key);
            }
          }), null),
          checked
        };
      };
    }
    const renderSelectionCell = _ref7 => {
      let {
        record,
        index
      } = _ref7;
      const {
        node,
        checked
      } = renderCell({
        record,
        index
      });
      if (customizeRenderCell) {
        return customizeRenderCell(checked, record, index, node);
      }
      return node;
    };
    // Insert selection column if not exist
    if (!cloneColumns.includes(SELECTION_COLUMN)) {
      // Always after expand icon
      if (cloneColumns.findIndex(col => {
        var _a;
        return ((_a = col[INTERNAL_COL_DEFINE]) === null || _a === void 0 ? void 0 : _a.columnType) === 'EXPAND_COLUMN';
      }) === 0) {
        const [expandColumn, ...restColumns] = cloneColumns;
        cloneColumns = [expandColumn, SELECTION_COLUMN, ...restColumns];
      } else {
        // Normal insert at first column
        cloneColumns = [SELECTION_COLUMN, ...cloneColumns];
      }
    }
    // Deduplicate selection column
    const selectionColumnIndex = cloneColumns.indexOf(SELECTION_COLUMN);
    cloneColumns = cloneColumns.filter((column, index) => column !== SELECTION_COLUMN || index === selectionColumnIndex);
    // Fixed column logic
    const prevCol = cloneColumns[selectionColumnIndex - 1];
    const nextCol = cloneColumns[selectionColumnIndex + 1];
    let mergedFixed = fixed;
    if (mergedFixed === undefined) {
      if ((nextCol === null || nextCol === void 0 ? void 0 : nextCol.fixed) !== undefined) {
        mergedFixed = nextCol.fixed;
      } else if ((prevCol === null || prevCol === void 0 ? void 0 : prevCol.fixed) !== undefined) {
        mergedFixed = prevCol.fixed;
      }
    }
    if (mergedFixed && prevCol && ((_a = prevCol[INTERNAL_COL_DEFINE]) === null || _a === void 0 ? void 0 : _a.columnType) === 'EXPAND_COLUMN' && prevCol.fixed === undefined) {
      prevCol.fixed = mergedFixed;
    }
    // Replace with real selection column
    const selectionColumn = {
      fixed: mergedFixed,
      width: selectionColWidth,
      className: `${prefixCls.value}-selection-column`,
      title: mergedRowSelection.value.columnTitle || title,
      customRender: renderSelectionCell,
      [INTERNAL_COL_DEFINE]: {
        class: `${prefixCls.value}-selection-col`
      }
    };
    return cloneColumns.map(col => col === SELECTION_COLUMN ? selectionColumn : col);
  };
  return [transformColumns, derivedSelectedKeySet];
}

// This icon file is generated automatically.
var CaretDownOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" } }] }, "name": "caret-down", "theme": "outlined" };

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CaretDownOutlined = function CaretDownOutlined(props, context) {
  var p = _objectSpread$2({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$2({}, p, {
    "icon": CaretDownOutlined$1
  }), null);
};

CaretDownOutlined.displayName = 'CaretDownOutlined';
CaretDownOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var CaretUpOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z" } }] }, "name": "caret-up", "theme": "outlined" };

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CaretUpOutlined = function CaretUpOutlined(props, context) {
  var p = _objectSpread$1({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$1({}, p, {
    "icon": CaretUpOutlined$1
  }), null);
};

CaretUpOutlined.displayName = 'CaretUpOutlined';
CaretUpOutlined.inheritAttrs = false;

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function getColumnKey(column, defaultKey) {
  if ('key' in column && column.key !== undefined && column.key !== null) {
    return column.key;
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : column.dataIndex;
  }
  return defaultKey;
}
function getColumnPos(index, pos) {
  return pos ? `${pos}-${index}` : `${index}`;
}
function renderColumnTitle(title, props) {
  if (typeof title === 'function') {
    return title(props);
  }
  return title;
}
function convertChildrenToColumns() {
  let elements = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  const flattenElements = flattenChildren(elements);
  const columns = [];
  flattenElements.forEach(element => {
    var _a, _b, _c, _d;
    if (!element) {
      return;
    }
    const key = element.key;
    const style = ((_a = element.props) === null || _a === void 0 ? void 0 : _a.style) || {};
    const cls = ((_b = element.props) === null || _b === void 0 ? void 0 : _b.class) || '';
    const props = element.props || {};
    for (const [k, v] of Object.entries(props)) {
      props[camelize(k)] = v;
    }
    const _e = element.children || {},
      {
        default: children
      } = _e,
      restSlots = __rest(_e, ["default"]);
    const column = _extends(_extends(_extends({}, restSlots), props), {
      style,
      class: cls
    });
    if (key) {
      column.key = key;
    }
    if ((_c = element.type) === null || _c === void 0 ? void 0 : _c.__ANT_TABLE_COLUMN_GROUP) {
      column.children = convertChildrenToColumns(typeof children === 'function' ? children() : children);
    } else {
      const customRender = (_d = element.children) === null || _d === void 0 ? void 0 : _d.default;
      column.customRender = column.customRender || customRender;
    }
    columns.push(column);
  });
  return columns;
}

const ASCEND = 'ascend';
const DESCEND = 'descend';
function getMultiplePriority(column) {
  if (typeof column.sorter === 'object' && typeof column.sorter.multiple === 'number') {
    return column.sorter.multiple;
  }
  return false;
}
function getSortFunction(sorter) {
  if (typeof sorter === 'function') {
    return sorter;
  }
  if (sorter && typeof sorter === 'object' && sorter.compare) {
    return sorter.compare;
  }
  return false;
}
function nextSortDirection(sortDirections, current) {
  if (!current) {
    return sortDirections[0];
  }
  return sortDirections[sortDirections.indexOf(current) + 1];
}
function collectSortStates(columns, init, pos) {
  let sortStates = [];
  function pushState(column, columnPos) {
    sortStates.push({
      column,
      key: getColumnKey(column, columnPos),
      multiplePriority: getMultiplePriority(column),
      sortOrder: column.sortOrder
    });
  }
  (columns || []).forEach((column, index) => {
    const columnPos = getColumnPos(index, pos);
    if (column.children) {
      if ('sortOrder' in column) {
        // Controlled
        pushState(column, columnPos);
      }
      sortStates = [...sortStates, ...collectSortStates(column.children, init, columnPos)];
    } else if (column.sorter) {
      if ('sortOrder' in column) {
        // Controlled
        pushState(column, columnPos);
      } else if (init && column.defaultSortOrder) {
        // Default sorter
        sortStates.push({
          column,
          key: getColumnKey(column, columnPos),
          multiplePriority: getMultiplePriority(column),
          sortOrder: column.defaultSortOrder
        });
      }
    }
  });
  return sortStates;
}
function injectSorter(prefixCls, columns, sorterStates, triggerSorter, defaultSortDirections, tableLocale, tableShowSorterTooltip, pos) {
  return (columns || []).map((column, index) => {
    const columnPos = getColumnPos(index, pos);
    let newColumn = column;
    if (newColumn.sorter) {
      const sortDirections = newColumn.sortDirections || defaultSortDirections;
      const showSorterTooltip = newColumn.showSorterTooltip === undefined ? tableShowSorterTooltip : newColumn.showSorterTooltip;
      const columnKey = getColumnKey(newColumn, columnPos);
      const sorterState = sorterStates.find(_ref => {
        let {
          key
        } = _ref;
        return key === columnKey;
      });
      const sorterOrder = sorterState ? sorterState.sortOrder : null;
      const nextSortOrder = nextSortDirection(sortDirections, sorterOrder);
      const upNode = sortDirections.includes(ASCEND) && createVNode(CaretUpOutlined, {
        "class": classNames(`${prefixCls}-column-sorter-up`, {
          active: sorterOrder === ASCEND
        }),
        "role": "presentation"
      }, null);
      const downNode = sortDirections.includes(DESCEND) && createVNode(CaretDownOutlined, {
        "role": "presentation",
        "class": classNames(`${prefixCls}-column-sorter-down`, {
          active: sorterOrder === DESCEND
        })
      }, null);
      const {
        cancelSort,
        triggerAsc,
        triggerDesc
      } = tableLocale || {};
      let sortTip = cancelSort;
      if (nextSortOrder === DESCEND) {
        sortTip = triggerDesc;
      } else if (nextSortOrder === ASCEND) {
        sortTip = triggerAsc;
      }
      const tooltipProps = typeof showSorterTooltip === 'object' ? showSorterTooltip : {
        title: sortTip
      };
      newColumn = _extends(_extends({}, newColumn), {
        className: classNames(newColumn.className, {
          [`${prefixCls}-column-sort`]: sorterOrder
        }),
        title: renderProps => {
          const renderSortTitle = createVNode("div", {
            "class": `${prefixCls}-column-sorters`
          }, [createVNode("span", {
            "class": `${prefixCls}-column-title`
          }, [renderColumnTitle(column.title, renderProps)]), createVNode("span", {
            "class": classNames(`${prefixCls}-column-sorter`, {
              [`${prefixCls}-column-sorter-full`]: !!(upNode && downNode)
            })
          }, [createVNode("span", {
            "class": `${prefixCls}-column-sorter-inner`
          }, [upNode, downNode])])]);
          return showSorterTooltip ? createVNode(Tooltip, tooltipProps, {
            default: () => [renderSortTitle]
          }) : renderSortTitle;
        },
        customHeaderCell: col => {
          const cell = column.customHeaderCell && column.customHeaderCell(col) || {};
          const originOnClick = cell.onClick;
          const originOKeyDown = cell.onKeydown;
          cell.onClick = event => {
            triggerSorter({
              column,
              key: columnKey,
              sortOrder: nextSortOrder,
              multiplePriority: getMultiplePriority(column)
            });
            if (originOnClick) {
              originOnClick(event);
            }
          };
          cell.onKeydown = event => {
            if (event.keyCode === KeyCode.ENTER) {
              triggerSorter({
                column,
                key: columnKey,
                sortOrder: nextSortOrder,
                multiplePriority: getMultiplePriority(column)
              });
              originOKeyDown === null || originOKeyDown === void 0 ? void 0 : originOKeyDown(event);
            }
          };
          // Inform the screen-reader so it can tell the visually impaired user which column is sorted
          if (sorterOrder) {
            cell['aria-sort'] = sorterOrder === 'ascend' ? 'ascending' : 'descending';
          }
          cell.class = classNames(cell.class, `${prefixCls}-column-has-sorters`);
          cell.tabindex = 0;
          return cell;
        }
      });
    }
    if ('children' in newColumn) {
      newColumn = _extends(_extends({}, newColumn), {
        children: injectSorter(prefixCls, newColumn.children, sorterStates, triggerSorter, defaultSortDirections, tableLocale, tableShowSorterTooltip, columnPos)
      });
    }
    return newColumn;
  });
}
function stateToInfo(sorterStates) {
  const {
    column,
    sortOrder
  } = sorterStates;
  return {
    column,
    order: sortOrder,
    field: column.dataIndex,
    columnKey: column.key
  };
}
function generateSorterInfo(sorterStates) {
  const list = sorterStates.filter(_ref2 => {
    let {
      sortOrder
    } = _ref2;
    return sortOrder;
  }).map(stateToInfo);
  // =========== Legacy compatible support ===========
  // https://github.com/ant-design/ant-design/pull/19226
  if (list.length === 0 && sorterStates.length) {
    return _extends(_extends({}, stateToInfo(sorterStates[sorterStates.length - 1])), {
      column: undefined
    });
  }
  if (list.length <= 1) {
    return list[0] || {};
  }
  return list;
}
function getSortData(data, sortStates, childrenColumnName) {
  const innerSorterStates = sortStates.slice().sort((a, b) => b.multiplePriority - a.multiplePriority);
  const cloneData = data.slice();
  const runningSorters = innerSorterStates.filter(_ref3 => {
    let {
      column: {
        sorter
      },
      sortOrder
    } = _ref3;
    return getSortFunction(sorter) && sortOrder;
  });
  // Skip if no sorter needed
  if (!runningSorters.length) {
    return cloneData;
  }
  return cloneData.sort((record1, record2) => {
    for (let i = 0; i < runningSorters.length; i += 1) {
      const sorterState = runningSorters[i];
      const {
        column: {
          sorter
        },
        sortOrder
      } = sorterState;
      const compareFn = getSortFunction(sorter);
      if (compareFn && sortOrder) {
        const compareResult = compareFn(record1, record2, sortOrder);
        if (compareResult !== 0) {
          return sortOrder === ASCEND ? compareResult : -compareResult;
        }
      }
    }
    return 0;
  }).map(record => {
    const subRecords = record[childrenColumnName];
    if (subRecords) {
      return _extends(_extends({}, record), {
        [childrenColumnName]: getSortData(subRecords, sortStates, childrenColumnName)
      });
    }
    return record;
  });
}
function useFilterSorter(_ref4) {
  let {
    prefixCls,
    mergedColumns,
    onSorterChange,
    sortDirections,
    tableLocale,
    showSorterTooltip
  } = _ref4;
  const [sortStates, setSortStates] = useState(collectSortStates(mergedColumns.value, true));
  const mergedSorterStates = computed(() => {
    let validate = true;
    const collectedStates = collectSortStates(mergedColumns.value, false);
    // Return if not controlled
    if (!collectedStates.length) {
      return sortStates.value;
    }
    const validateStates = [];
    function patchStates(state) {
      if (validate) {
        validateStates.push(state);
      } else {
        validateStates.push(_extends(_extends({}, state), {
          sortOrder: null
        }));
      }
    }
    let multipleMode = null;
    collectedStates.forEach(state => {
      if (multipleMode === null) {
        patchStates(state);
        if (state.sortOrder) {
          if (state.multiplePriority === false) {
            validate = false;
          } else {
            multipleMode = true;
          }
        }
      } else if (multipleMode && state.multiplePriority !== false) {
        patchStates(state);
      } else {
        validate = false;
        patchStates(state);
      }
    });
    return validateStates;
  });
  // Get render columns title required props
  const columnTitleSorterProps = computed(() => {
    const sortColumns = mergedSorterStates.value.map(_ref5 => {
      let {
        column,
        sortOrder
      } = _ref5;
      return {
        column,
        order: sortOrder
      };
    });
    return {
      sortColumns,
      // Legacy
      sortColumn: sortColumns[0] && sortColumns[0].column,
      sortOrder: sortColumns[0] && sortColumns[0].order
    };
  });
  function triggerSorter(sortState) {
    let newSorterStates;
    if (sortState.multiplePriority === false || !mergedSorterStates.value.length || mergedSorterStates.value[0].multiplePriority === false) {
      newSorterStates = [sortState];
    } else {
      newSorterStates = [...mergedSorterStates.value.filter(_ref6 => {
        let {
          key
        } = _ref6;
        return key !== sortState.key;
      }), sortState];
    }
    setSortStates(newSorterStates);
    onSorterChange(generateSorterInfo(newSorterStates), newSorterStates);
  }
  const transformColumns = innerColumns => injectSorter(prefixCls.value, innerColumns, mergedSorterStates.value, triggerSorter, sortDirections.value, tableLocale.value, showSorterTooltip.value);
  const sorters = computed(() => generateSorterInfo(mergedSorterStates.value));
  return [transformColumns, mergedSorterStates, columnTitleSorterProps, sorters];
}

// This icon file is generated automatically.
var FilterFilled$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M349 838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V642H349v196zm531.1-684H143.9c-24.5 0-39.8 26.7-27.5 48l221.3 376h348.8l221.3-376c12.1-21.3-3.2-48-27.7-48z" } }] }, "name": "filter", "theme": "filled" };

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var FilterFilled = function FilterFilled(props, context) {
  var p = _objectSpread({}, props, context.attrs);

  return createVNode(Icon, _objectSpread({}, p, {
    "icon": FilterFilled$1
  }), null);
};

FilterFilled.displayName = 'FilterFilled';
FilterFilled.inheritAttrs = false;

const onKeyDown = event => {
  const {
    keyCode
  } = event;
  if (keyCode === KeyCode.ENTER) {
    event.stopPropagation();
  }
};
const FilterDropdownMenuWrapper = (_props, _ref) => {
  let {
    slots
  } = _ref;
  var _a;
  return createVNode("div", {
    "onClick": e => e.stopPropagation(),
    "onKeydown": onKeyDown
  }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
};

const FilterSearch = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'FilterSearch',
  inheritAttrs: false,
  props: {
    value: stringType(),
    onChange: functionType(),
    filterSearch: someType([Boolean, Function]),
    tablePrefixCls: stringType(),
    locale: objectType()
  },
  setup(props) {
    return () => {
      const {
        value,
        onChange,
        filterSearch,
        tablePrefixCls,
        locale
      } = props;
      if (!filterSearch) {
        return null;
      }
      return createVNode("div", {
        "class": `${tablePrefixCls}-filter-dropdown-search`
      }, [createVNode(Input$1, {
        "placeholder": locale.filterSearchPlaceholder,
        "onChange": onChange,
        "value": value,
        "htmlSize": 1,
        "class": `${tablePrefixCls}-filter-dropdown-search-input`
      }, {
        prefix: () => createVNode(SearchOutlined, null, null)
      })]);
    };
  }
});

/**
 * Deeply compares two object literals.
 * @param obj1 object 1
 * @param obj2 object 2
 * @param shallow shallow compare
 * @returns
 */
function isEqual(obj1, obj2) {
  let shallow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  // https://github.com/mapbox/mapbox-gl-js/pull/5979/files#diff-fde7145050c47cc3a306856efd5f9c3016e86e859de9afbd02c879be5067e58f
  const refSet = new Set();
  function deepEqual(a, b) {
    let level = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    const circular = refSet.has(a);
    warningOnce(!circular, 'Warning: There may be circular references');
    if (circular) {
      return false;
    }
    if (a === b) {
      return true;
    }
    if (shallow && level > 1) {
      return false;
    }
    refSet.add(a);
    const newLevel = level + 1;
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i], newLevel)) {
          return false;
        }
      }
      return true;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const keys = Object.keys(a);
      if (keys.length !== Object.keys(b).length) {
        return false;
      }
      return keys.every(key => deepEqual(a[key], b[key], newLevel));
    }
    // other
    return false;
  }
  return deepEqual(obj1, obj2);
}

const {
  SubMenu,
  Item: MenuItem
} = Menu;
function hasSubMenu(filters) {
  return filters.some(_ref => {
    let {
      children
    } = _ref;
    return children && children.length > 0;
  });
}
function searchValueMatched(searchValue, text) {
  if (typeof text === 'string' || typeof text === 'number') {
    return text === null || text === void 0 ? void 0 : text.toString().toLowerCase().includes(searchValue.trim().toLowerCase());
  }
  return false;
}
function renderFilterItems(_ref2) {
  let {
    filters,
    prefixCls,
    filteredKeys,
    filterMultiple,
    searchValue,
    filterSearch
  } = _ref2;
  return filters.map((filter, index) => {
    const key = String(filter.value);
    if (filter.children) {
      return createVNode(SubMenu, {
        "key": key || index,
        "title": filter.text,
        "popupClassName": `${prefixCls}-dropdown-submenu`
      }, {
        default: () => [renderFilterItems({
          filters: filter.children,
          prefixCls,
          filteredKeys,
          filterMultiple,
          searchValue,
          filterSearch
        })]
      });
    }
    const Component = filterMultiple ? Checkbox : Radio;
    const item = createVNode(MenuItem, {
      "key": filter.value !== undefined ? key : index
    }, {
      default: () => [createVNode(Component, {
        "checked": filteredKeys.includes(key)
      }, null), createVNode("span", null, [filter.text])]
    });
    if (searchValue.trim()) {
      if (typeof filterSearch === 'function') {
        return filterSearch(searchValue, filter) ? item : undefined;
      }
      return searchValueMatched(searchValue, filter.text) ? item : undefined;
    }
    return item;
  });
}
const FilterDropdown = defineComponent({
  name: 'FilterDropdown',
  props: ['tablePrefixCls', 'prefixCls', 'dropdownPrefixCls', 'column', 'filterState', 'filterMultiple', 'filterMode', 'filterSearch', 'columnKey', 'triggerFilter', 'locale', 'getPopupContainer'],
  setup(props, _ref3) {
    let {
      slots
    } = _ref3;
    const contextSlots = useInjectSlots();
    const filterMode = computed(() => {
      var _a;
      return (_a = props.filterMode) !== null && _a !== void 0 ? _a : 'menu';
    });
    const filterSearch = computed(() => {
      var _a;
      return (_a = props.filterSearch) !== null && _a !== void 0 ? _a : false;
    });
    const filterDropdownOpen = computed(() => props.column.filterDropdownOpen || props.column.filterDropdownVisible);
    const onFilterDropdownOpenChange = computed(() => props.column.onFilterDropdownOpenChange || props.column.onFilterDropdownVisibleChange);
    const visible = shallowRef(false);
    const filtered = computed(() => {
      var _a;
      return !!(props.filterState && (((_a = props.filterState.filteredKeys) === null || _a === void 0 ? void 0 : _a.length) || props.filterState.forceFiltered));
    });
    const filterFlattenKeys = computed(() => {
      var _a;
      return flattenKeys((_a = props.column) === null || _a === void 0 ? void 0 : _a.filters);
    });
    const filterDropdownRef = computed(() => {
      const {
        filterDropdown,
        slots = {},
        customFilterDropdown
      } = props.column;
      return filterDropdown || slots.filterDropdown && contextSlots.value[slots.filterDropdown] || customFilterDropdown && contextSlots.value.customFilterDropdown;
    });
    const filterIconRef = computed(() => {
      const {
        filterIcon,
        slots = {}
      } = props.column;
      return filterIcon || slots.filterIcon && contextSlots.value[slots.filterIcon] || contextSlots.value.customFilterIcon;
    });
    const triggerVisible = newVisible => {
      var _a;
      visible.value = newVisible;
      (_a = onFilterDropdownOpenChange.value) === null || _a === void 0 ? void 0 : _a.call(onFilterDropdownOpenChange, newVisible);
    };
    const mergedVisible = computed(() => typeof filterDropdownOpen.value === 'boolean' ? filterDropdownOpen.value : visible.value);
    const propFilteredKeys = computed(() => {
      var _a;
      return (_a = props.filterState) === null || _a === void 0 ? void 0 : _a.filteredKeys;
    });
    const filteredKeys = shallowRef([]);
    const onSelectKeys = _ref5 => {
      let {
        selectedKeys
      } = _ref5;
      filteredKeys.value = selectedKeys;
    };
    const onCheck = (keys, _ref6) => {
      let {
        node,
        checked
      } = _ref6;
      if (!props.filterMultiple) {
        onSelectKeys({
          selectedKeys: checked && node.key ? [node.key] : []
        });
      } else {
        onSelectKeys({
          selectedKeys: keys
        });
      }
    };
    watch(propFilteredKeys, () => {
      if (!visible.value) {
        return;
      }
      onSelectKeys({
        selectedKeys: propFilteredKeys.value || []
      });
    }, {
      immediate: true
    });
    // const expandKeys = shallowRef(filterFlattenKeys.value.slice());
    // const onExpandChange = keys => (expandKeys.value = keys);
    const openKeys = shallowRef([]);
    const openRef = shallowRef();
    const onOpenChange = keys => {
      openRef.value = setTimeout(() => {
        openKeys.value = keys;
      });
    };
    const onMenuClick = () => {
      clearTimeout(openRef.value);
    };
    onBeforeUnmount(() => {
      clearTimeout(openRef.value);
    });
    const searchValue = shallowRef('');
    const onSearch = e => {
      const {
        value
      } = e.target;
      searchValue.value = value;
    };
    // clear search value after close filter dropdown
    watch(visible, () => {
      if (!visible.value) {
        searchValue.value = '';
      }
    });
    // ======================= Submit ========================
    const internalTriggerFilter = keys => {
      const {
        column,
        columnKey,
        filterState
      } = props;
      const mergedKeys = keys && keys.length ? keys : null;
      if (mergedKeys === null && (!filterState || !filterState.filteredKeys)) {
        return null;
      }
      if (isEqual(mergedKeys, filterState === null || filterState === void 0 ? void 0 : filterState.filteredKeys, true)) {
        return null;
      }
      props.triggerFilter({
        column,
        key: columnKey,
        filteredKeys: mergedKeys
      });
    };
    const onConfirm = () => {
      triggerVisible(false);
      internalTriggerFilter(filteredKeys.value);
    };
    const onReset = function () {
      let {
        confirm,
        closeDropdown
      } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        confirm: false,
        closeDropdown: false
      };
      if (confirm) {
        internalTriggerFilter([]);
      }
      if (closeDropdown) {
        triggerVisible(false);
      }
      searchValue.value = '';
      if (props.column.filterResetToDefaultFilteredValue) {
        filteredKeys.value = (props.column.defaultFilteredValue || []).map(key => String(key));
      } else {
        filteredKeys.value = [];
      }
    };
    const doFilter = function () {
      let {
        closeDropdown
      } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        closeDropdown: true
      };
      if (closeDropdown) {
        triggerVisible(false);
      }
      internalTriggerFilter(filteredKeys.value);
    };
    const onVisibleChange = newVisible => {
      if (newVisible && propFilteredKeys.value !== undefined) {
        // Sync filteredKeys on appear in controlled mode (propFilteredKeys.value !== undefiend)
        filteredKeys.value = propFilteredKeys.value || [];
      }
      triggerVisible(newVisible);
      // Default will filter when closed
      if (!newVisible && !filterDropdownRef.value) {
        onConfirm();
      }
    };
    const {
      direction
    } = useConfigInject('', props);
    const onCheckAll = e => {
      if (e.target.checked) {
        const allFilterKeys = filterFlattenKeys.value;
        filteredKeys.value = allFilterKeys;
      } else {
        filteredKeys.value = [];
      }
    };
    const getTreeData = _ref7 => {
      let {
        filters
      } = _ref7;
      return (filters || []).map((filter, index) => {
        const key = String(filter.value);
        const item = {
          title: filter.text,
          key: filter.value !== undefined ? key : index
        };
        if (filter.children) {
          item.children = getTreeData({
            filters: filter.children
          });
        }
        return item;
      });
    };
    const getFilterData = node => {
      var _a;
      return _extends(_extends({}, node), {
        text: node.title,
        value: node.key,
        children: ((_a = node.children) === null || _a === void 0 ? void 0 : _a.map(item => getFilterData(item))) || []
      });
    };
    const treeData = computed(() => getTreeData({
      filters: props.column.filters
    }));
    // ======================== Style ========================
    const dropdownMenuClass = computed(() => classNames({
      [`${props.dropdownPrefixCls}-menu-without-submenu`]: !hasSubMenu(props.column.filters || [])
    }));
    const getFilterComponent = () => {
      const selectedKeys = filteredKeys.value;
      const {
        column,
        locale,
        tablePrefixCls,
        filterMultiple,
        dropdownPrefixCls,
        getPopupContainer,
        prefixCls
      } = props;
      if ((column.filters || []).length === 0) {
        return createVNode(Empty, {
          "image": Empty.PRESENTED_IMAGE_SIMPLE,
          "description": locale.filterEmptyText,
          "imageStyle": {
            height: 24
          },
          "style": {
            margin: 0,
            padding: '16px 0'
          }
        }, null);
      }
      if (filterMode.value === 'tree') {
        return createVNode(Fragment, null, [createVNode(FilterSearch, {
          "filterSearch": filterSearch.value,
          "value": searchValue.value,
          "onChange": onSearch,
          "tablePrefixCls": tablePrefixCls,
          "locale": locale
        }, null), createVNode("div", {
          "class": `${tablePrefixCls}-filter-dropdown-tree`
        }, [filterMultiple ? createVNode(Checkbox, {
          "class": `${tablePrefixCls}-filter-dropdown-checkall`,
          "onChange": onCheckAll,
          "checked": selectedKeys.length === filterFlattenKeys.value.length,
          "indeterminate": selectedKeys.length > 0 && selectedKeys.length < filterFlattenKeys.value.length
        }, {
          default: () => [locale.filterCheckall]
        }) : null, createVNode(Tree, {
          "checkable": true,
          "selectable": false,
          "blockNode": true,
          "multiple": filterMultiple,
          "checkStrictly": !filterMultiple,
          "class": `${dropdownPrefixCls}-menu`,
          "onCheck": onCheck,
          "checkedKeys": selectedKeys,
          "selectedKeys": selectedKeys,
          "showIcon": false,
          "treeData": treeData.value,
          "autoExpandParent": true,
          "defaultExpandAll": true,
          "filterTreeNode": searchValue.value.trim() ? node => {
            if (typeof filterSearch.value === 'function') {
              return filterSearch.value(searchValue.value, getFilterData(node));
            }
            return searchValueMatched(searchValue.value, node.title);
          } : undefined
        }, null)])]);
      }
      return createVNode(Fragment, null, [createVNode(FilterSearch, {
        "filterSearch": filterSearch.value,
        "value": searchValue.value,
        "onChange": onSearch,
        "tablePrefixCls": tablePrefixCls,
        "locale": locale
      }, null), createVNode(Menu, {
        "multiple": filterMultiple,
        "prefixCls": `${dropdownPrefixCls}-menu`,
        "class": dropdownMenuClass.value,
        "onClick": onMenuClick,
        "onSelect": onSelectKeys,
        "onDeselect": onSelectKeys,
        "selectedKeys": selectedKeys,
        "getPopupContainer": getPopupContainer,
        "openKeys": openKeys.value,
        "onOpenChange": onOpenChange
      }, {
        default: () => renderFilterItems({
          filters: column.filters || [],
          filterSearch: filterSearch.value,
          prefixCls,
          filteredKeys: filteredKeys.value,
          filterMultiple,
          searchValue: searchValue.value
        })
      })]);
    };
    const resetDisabled = computed(() => {
      const selectedKeys = filteredKeys.value;
      if (props.column.filterResetToDefaultFilteredValue) {
        return isEqual((props.column.defaultFilteredValue || []).map(key => String(key)), selectedKeys, true);
      }
      return selectedKeys.length === 0;
    });
    return () => {
      var _a;
      const {
        tablePrefixCls,
        prefixCls,
        column,
        dropdownPrefixCls,
        locale,
        getPopupContainer
      } = props;
      let dropdownContent;
      if (typeof filterDropdownRef.value === 'function') {
        dropdownContent = filterDropdownRef.value({
          prefixCls: `${dropdownPrefixCls}-custom`,
          setSelectedKeys: selectedKeys => onSelectKeys({
            selectedKeys
          }),
          selectedKeys: filteredKeys.value,
          confirm: doFilter,
          clearFilters: onReset,
          filters: column.filters,
          visible: mergedVisible.value,
          column: column.__originColumn__,
          close: () => {
            triggerVisible(false);
          }
        });
      } else if (filterDropdownRef.value) {
        dropdownContent = filterDropdownRef.value;
      } else {
        dropdownContent = createVNode(Fragment, null, [getFilterComponent(), createVNode("div", {
          "class": `${prefixCls}-dropdown-btns`
        }, [createVNode(Button$1, {
          "type": "link",
          "size": "small",
          "disabled": resetDisabled.value,
          "onClick": () => onReset()
        }, {
          default: () => [locale.filterReset]
        }), createVNode(Button$1, {
          "type": "primary",
          "size": "small",
          "onClick": onConfirm
        }, {
          default: () => [locale.filterConfirm]
        })])]);
      }
      const menu = createVNode(FilterDropdownMenuWrapper, {
        "class": `${prefixCls}-dropdown`
      }, {
        default: () => [dropdownContent]
      });
      let filterIcon;
      if (typeof filterIconRef.value === 'function') {
        filterIcon = filterIconRef.value({
          filtered: filtered.value,
          column: column.__originColumn__
        });
      } else if (filterIconRef.value) {
        filterIcon = filterIconRef.value;
      } else {
        filterIcon = createVNode(FilterFilled, null, null);
      }
      return createVNode("div", {
        "class": `${prefixCls}-column`
      }, [createVNode("span", {
        "class": `${tablePrefixCls}-column-title`
      }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]), createVNode(Dropdown, {
        "overlay": menu,
        "trigger": ['click'],
        "open": mergedVisible.value,
        "onOpenChange": onVisibleChange,
        "getPopupContainer": getPopupContainer,
        "placement": direction.value === 'rtl' ? 'bottomLeft' : 'bottomRight'
      }, {
        default: () => [createVNode("span", {
          "role": "button",
          "tabindex": -1,
          "class": classNames(`${prefixCls}-trigger`, {
            active: filtered.value
          }),
          "onClick": e => {
            e.stopPropagation();
          }
        }, [filterIcon])]
      })]);
    };
  }
});

function collectFilterStates(columns, init, pos) {
  let filterStates = [];
  (columns || []).forEach((column, index) => {
    var _a, _b;
    const columnPos = getColumnPos(index, pos);
    const hasFilterDropdown = column.filterDropdown || ((_a = column === null || column === void 0 ? void 0 : column.slots) === null || _a === void 0 ? void 0 : _a.filterDropdown) || column.customFilterDropdown;
    if (column.filters || hasFilterDropdown || 'onFilter' in column) {
      if ('filteredValue' in column) {
        // Controlled
        let filteredValues = column.filteredValue;
        if (!hasFilterDropdown) {
          filteredValues = (_b = filteredValues === null || filteredValues === void 0 ? void 0 : filteredValues.map(String)) !== null && _b !== void 0 ? _b : filteredValues;
        }
        filterStates.push({
          column,
          key: getColumnKey(column, columnPos),
          filteredKeys: filteredValues,
          forceFiltered: column.filtered
        });
      } else {
        // Uncontrolled
        filterStates.push({
          column,
          key: getColumnKey(column, columnPos),
          filteredKeys: init && column.defaultFilteredValue ? column.defaultFilteredValue : undefined,
          forceFiltered: column.filtered
        });
      }
    }
    if ('children' in column) {
      filterStates = [...filterStates, ...collectFilterStates(column.children, init, columnPos)];
    }
  });
  return filterStates;
}
function injectFilter(prefixCls, dropdownPrefixCls, columns, filterStates, locale, triggerFilter, getPopupContainer, pos) {
  return columns.map((column, index) => {
    var _a;
    const columnPos = getColumnPos(index, pos);
    const {
      filterMultiple = true,
      filterMode,
      filterSearch
    } = column;
    let newColumn = column;
    const hasFilterDropdown = column.filterDropdown || ((_a = column === null || column === void 0 ? void 0 : column.slots) === null || _a === void 0 ? void 0 : _a.filterDropdown) || column.customFilterDropdown;
    if (newColumn.filters || hasFilterDropdown) {
      const columnKey = getColumnKey(newColumn, columnPos);
      const filterState = filterStates.find(_ref => {
        let {
          key
        } = _ref;
        return columnKey === key;
      });
      newColumn = _extends(_extends({}, newColumn), {
        title: renderProps => createVNode(FilterDropdown, {
          "tablePrefixCls": prefixCls,
          "prefixCls": `${prefixCls}-filter`,
          "dropdownPrefixCls": dropdownPrefixCls,
          "column": newColumn,
          "columnKey": columnKey,
          "filterState": filterState,
          "filterMultiple": filterMultiple,
          "filterMode": filterMode,
          "filterSearch": filterSearch,
          "triggerFilter": triggerFilter,
          "locale": locale,
          "getPopupContainer": getPopupContainer
        }, {
          default: () => [renderColumnTitle(column.title, renderProps)]
        })
      });
    }
    if ('children' in newColumn) {
      newColumn = _extends(_extends({}, newColumn), {
        children: injectFilter(prefixCls, dropdownPrefixCls, newColumn.children, filterStates, locale, triggerFilter, getPopupContainer, columnPos)
      });
    }
    return newColumn;
  });
}
function flattenKeys(filters) {
  let keys = [];
  (filters || []).forEach(_ref2 => {
    let {
      value,
      children
    } = _ref2;
    keys.push(value);
    if (children) {
      keys = [...keys, ...flattenKeys(children)];
    }
  });
  return keys;
}
function generateFilterInfo(filterStates) {
  const currentFilters = {};
  filterStates.forEach(_ref3 => {
    let {
      key,
      filteredKeys,
      column
    } = _ref3;
    var _a;
    const hasFilterDropdown = column.filterDropdown || ((_a = column === null || column === void 0 ? void 0 : column.slots) === null || _a === void 0 ? void 0 : _a.filterDropdown) || column.customFilterDropdown;
    const {
      filters
    } = column;
    if (hasFilterDropdown) {
      currentFilters[key] = filteredKeys || null;
    } else if (Array.isArray(filteredKeys)) {
      const keys = flattenKeys(filters);
      currentFilters[key] = keys.filter(originKey => filteredKeys.includes(String(originKey)));
    } else {
      currentFilters[key] = null;
    }
  });
  return currentFilters;
}
function getFilterData(data, filterStates) {
  return filterStates.reduce((currentData, filterState) => {
    const {
      column: {
        onFilter,
        filters
      },
      filteredKeys
    } = filterState;
    if (onFilter && filteredKeys && filteredKeys.length) {
      return currentData.filter(record => filteredKeys.some(key => {
        const keys = flattenKeys(filters);
        const keyIndex = keys.findIndex(k => String(k) === String(key));
        const realKey = keyIndex !== -1 ? keys[keyIndex] : key;
        return onFilter(realKey, record);
      }));
    }
    return currentData;
  }, data);
}
function getMergedColumns(rawMergedColumns) {
  return rawMergedColumns.flatMap(column => {
    if ('children' in column) {
      return [column, ...getMergedColumns(column.children || [])];
    }
    return [column];
  });
}
function useFilter(_ref4) {
  let {
    prefixCls,
    dropdownPrefixCls,
    mergedColumns: rawMergedColumns,
    locale,
    onFilterChange,
    getPopupContainer
  } = _ref4;
  const mergedColumns = computed(() => getMergedColumns(rawMergedColumns.value));
  const [filterStates, setFilterStates] = useState(collectFilterStates(mergedColumns.value, true));
  const mergedFilterStates = computed(() => {
    const collectedStates = collectFilterStates(mergedColumns.value, false);
    if (collectedStates.length === 0) {
      return collectedStates;
    }
    let filteredKeysIsAllNotControlled = true;
    let filteredKeysIsAllControlled = true;
    collectedStates.forEach(_ref5 => {
      let {
        filteredKeys
      } = _ref5;
      if (filteredKeys !== undefined) {
        filteredKeysIsAllNotControlled = false;
      } else {
        filteredKeysIsAllControlled = false;
      }
    });
    // Return if not controlled
    if (filteredKeysIsAllNotControlled) {
      // Filter column may have been removed
      const keyList = (mergedColumns.value || []).map((column, index) => getColumnKey(column, getColumnPos(index)));
      return filterStates.value.filter(_ref6 => {
        let {
          key
        } = _ref6;
        return keyList.includes(key);
      }).map(item => {
        const col = mergedColumns.value[keyList.findIndex(key => key === item.key)];
        return _extends(_extends({}, item), {
          column: _extends(_extends({}, item.column), col),
          forceFiltered: col.filtered
        });
      });
    }
    devWarning(filteredKeysIsAllControlled, 'Table', 'Columns should all contain `filteredValue` or not contain `filteredValue`.');
    return collectedStates;
  });
  const filters = computed(() => generateFilterInfo(mergedFilterStates.value));
  const triggerFilter = filterState => {
    const newFilterStates = mergedFilterStates.value.filter(_ref7 => {
      let {
        key
      } = _ref7;
      return key !== filterState.key;
    });
    newFilterStates.push(filterState);
    setFilterStates(newFilterStates);
    onFilterChange(generateFilterInfo(newFilterStates), newFilterStates);
  };
  const transformColumns = innerColumns => {
    return injectFilter(prefixCls.value, dropdownPrefixCls.value, innerColumns, mergedFilterStates.value, locale.value, triggerFilter, getPopupContainer.value);
  };
  return [transformColumns, mergedFilterStates, filters];
}

function fillTitle(columns, columnTitleProps) {
  return columns.map(column => {
    const cloneColumn = _extends({}, column);
    cloneColumn.title = renderColumnTitle(cloneColumn.title, columnTitleProps);
    if ('children' in cloneColumn) {
      cloneColumn.children = fillTitle(cloneColumn.children, columnTitleProps);
    }
    return cloneColumn;
  });
}
function useTitleColumns(columnTitleProps) {
  const filledColumns = columns => fillTitle(columns, columnTitleProps.value);
  return [filledColumns];
}

function renderExpandIcon(locale) {
  return function expandIcon(_ref) {
    let {
      prefixCls,
      onExpand,
      record,
      expanded,
      expandable
    } = _ref;
    const iconPrefix = `${prefixCls}-row-expand-icon`;
    return createVNode("button", {
      "type": "button",
      "onClick": e => {
        onExpand(record, e);
        e.stopPropagation();
      },
      "class": classNames(iconPrefix, {
        [`${iconPrefix}-spaced`]: !expandable,
        [`${iconPrefix}-expanded`]: expandable && expanded,
        [`${iconPrefix}-collapsed`]: expandable && !expanded
      }),
      "aria-label": expanded ? locale.collapse : locale.expand,
      "aria-expanded": expanded
    }, null);
  };
}

function fillSlots(columns, contextSlots) {
  const $slots = contextSlots.value;
  return columns.map(column => {
    var _a;
    if (column === SELECTION_COLUMN || column === EXPAND_COLUMN) return column;
    const cloneColumn = _extends({}, column);
    const {
      slots = {}
    } = cloneColumn;
    cloneColumn.__originColumn__ = column;
    devWarning(!('slots' in cloneColumn), 'Table', '`column.slots` is deprecated. Please use `v-slot:headerCell` `v-slot:bodyCell` instead.');
    Object.keys(slots).forEach(key => {
      const name = slots[key];
      if (cloneColumn[key] === undefined && $slots[name]) {
        cloneColumn[key] = $slots[name];
      }
    });
    if (contextSlots.value.headerCell && !((_a = column.slots) === null || _a === void 0 ? void 0 : _a.title)) {
      cloneColumn.title = customRenderSlot(contextSlots.value, 'headerCell', {
        title: column.title,
        column
      }, () => [column.title]);
    }
    if ('children' in cloneColumn && Array.isArray(cloneColumn.children)) {
      cloneColumn.children = fillSlots(cloneColumn.children, contextSlots);
    }
    return cloneColumn;
  });
}
function useColumns(contextSlots) {
  const filledColumns = columns => fillSlots(columns, contextSlots);
  return [filledColumns];
}

const genBorderedStyle = token => {
  const {
    componentCls
  } = token;
  const tableBorder = `${token.lineWidth}px ${token.lineType} ${token.tableBorderColor}`;
  const getSizeBorderStyle = (size, paddingVertical, paddingHorizontal) => ({
    [`&${componentCls}-${size}`]: {
      [`> ${componentCls}-container`]: {
        [`> ${componentCls}-content, > ${componentCls}-body`]: {
          '> table > tbody > tr > td': {
            [`> ${componentCls}-expanded-row-fixed`]: {
              margin: `-${paddingVertical}px -${paddingHorizontal + token.lineWidth}px`
            }
          }
        }
      }
    }
  });
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}${componentCls}-bordered`]: _extends(_extends(_extends({
        // ============================ Title =============================
        [`> ${componentCls}-title`]: {
          border: tableBorder,
          borderBottom: 0
        },
        // ============================ Content ============================
        [`> ${componentCls}-container`]: {
          borderInlineStart: tableBorder,
          [`
            > ${componentCls}-content,
            > ${componentCls}-header,
            > ${componentCls}-body,
            > ${componentCls}-summary
          `]: {
            '> table': {
              // ============================= Cell =============================
              [`
                > thead > tr > th,
                > tbody > tr > td,
                > tfoot > tr > th,
                > tfoot > tr > td
              `]: {
                borderInlineEnd: tableBorder
              },
              // ============================ Header ============================
              '> thead': {
                '> tr:not(:last-child) > th': {
                  borderBottom: tableBorder
                },
                '> tr > th::before': {
                  backgroundColor: 'transparent !important'
                }
              },
              // Fixed right should provides additional border
              [`
                > thead > tr,
                > tbody > tr,
                > tfoot > tr
              `]: {
                [`> ${componentCls}-cell-fix-right-first::after`]: {
                  borderInlineEnd: tableBorder
                }
              },
              // ========================== Expandable ==========================
              '> tbody > tr > td': {
                [`> ${componentCls}-expanded-row-fixed`]: {
                  margin: `-${token.tablePaddingVertical}px -${token.tablePaddingHorizontal + token.lineWidth}px`,
                  '&::after': {
                    position: 'absolute',
                    top: 0,
                    insetInlineEnd: token.lineWidth,
                    bottom: 0,
                    borderInlineEnd: tableBorder,
                    content: '""'
                  }
                }
              }
            }
          },
          [`
            > ${componentCls}-content,
            > ${componentCls}-header
          `]: {
            '> table': {
              borderTop: tableBorder
            }
          }
        },
        // ============================ Scroll ============================
        [`&${componentCls}-scroll-horizontal`]: {
          [`> ${componentCls}-container > ${componentCls}-body`]: {
            '> table > tbody': {
              [`
                > tr${componentCls}-expanded-row,
                > tr${componentCls}-placeholder
              `]: {
                '> td': {
                  borderInlineEnd: 0
                }
              }
            }
          }
        }
      }, getSizeBorderStyle('middle', token.tablePaddingVerticalMiddle, token.tablePaddingHorizontalMiddle)), getSizeBorderStyle('small', token.tablePaddingVerticalSmall, token.tablePaddingHorizontalSmall)), {
        // ============================ Footer ============================
        [`> ${componentCls}-footer`]: {
          border: tableBorder,
          borderTop: 0
        }
      }),
      // ============================ Nested ============================
      [`${componentCls}-cell`]: {
        [`${componentCls}-container:first-child`]: {
          // :first-child to avoid the case when bordered and title is set
          borderTop: 0
        },
        // https://github.com/ant-design/ant-design/issues/35577
        '&-scrollbar:not([rowspan])': {
          boxShadow: `0 ${token.lineWidth}px 0 ${token.lineWidth}px ${token.tableHeaderBg}`
        }
      }
    }
  };
};

const genEllipsisStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-cell-ellipsis`]: _extends(_extends({}, textEllipsis), {
        wordBreak: 'keep-all',
        // Fixed first or last should special process
        [`
          &${componentCls}-cell-fix-left-last,
          &${componentCls}-cell-fix-right-first
        `]: {
          overflow: 'visible',
          [`${componentCls}-cell-content`]: {
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        },
        [`${componentCls}-column-title`]: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          wordBreak: 'keep-all'
        }
      })
    }
  };
};

// ========================= Placeholder ==========================
const genEmptyStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-tbody > tr${componentCls}-placeholder`]: {
        textAlign: 'center',
        color: token.colorTextDisabled,
        '&:hover > td': {
          background: token.colorBgContainer
        }
      }
    }
  };
};

const genExpandStyle = token => {
  const {
    componentCls,
    antCls,
    controlInteractiveSize: checkboxSize,
    motionDurationSlow,
    lineWidth,
    paddingXS,
    lineType,
    tableBorderColor,
    tableExpandIconBg,
    tableExpandColumnWidth,
    borderRadius,
    fontSize,
    fontSizeSM,
    lineHeight,
    tablePaddingVertical,
    tablePaddingHorizontal,
    tableExpandedRowBg,
    paddingXXS
  } = token;
  const halfInnerSize = checkboxSize / 2 - lineWidth;
  // must be odd number, unless it cannot align center
  const expandIconSize = halfInnerSize * 2 + lineWidth * 3;
  const tableBorder = `${lineWidth}px ${lineType} ${tableBorderColor}`;
  const expandIconLineOffset = paddingXXS - lineWidth;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-expand-icon-col`]: {
        width: tableExpandColumnWidth
      },
      [`${componentCls}-row-expand-icon-cell`]: {
        textAlign: 'center',
        [`${componentCls}-row-expand-icon`]: {
          display: 'inline-flex',
          float: 'none',
          verticalAlign: 'sub'
        }
      },
      [`${componentCls}-row-indent`]: {
        height: 1,
        float: 'left'
      },
      [`${componentCls}-row-expand-icon`]: _extends(_extends({}, operationUnit(token)), {
        position: 'relative',
        float: 'left',
        boxSizing: 'border-box',
        width: expandIconSize,
        height: expandIconSize,
        padding: 0,
        color: 'inherit',
        lineHeight: `${expandIconSize}px`,
        background: tableExpandIconBg,
        border: tableBorder,
        borderRadius,
        transform: `scale(${checkboxSize / expandIconSize})`,
        transition: `all ${motionDurationSlow}`,
        userSelect: 'none',
        [`&:focus, &:hover, &:active`]: {
          borderColor: 'currentcolor'
        },
        [`&::before, &::after`]: {
          position: 'absolute',
          background: 'currentcolor',
          transition: `transform ${motionDurationSlow} ease-out`,
          content: '""'
        },
        '&::before': {
          top: halfInnerSize,
          insetInlineEnd: expandIconLineOffset,
          insetInlineStart: expandIconLineOffset,
          height: lineWidth
        },
        '&::after': {
          top: expandIconLineOffset,
          bottom: expandIconLineOffset,
          insetInlineStart: halfInnerSize,
          width: lineWidth,
          transform: 'rotate(90deg)'
        },
        // Motion effect
        '&-collapsed::before': {
          transform: 'rotate(-180deg)'
        },
        '&-collapsed::after': {
          transform: 'rotate(0deg)'
        },
        '&-spaced': {
          '&::before, &::after': {
            display: 'none',
            content: 'none'
          },
          background: 'transparent',
          border: 0,
          visibility: 'hidden'
        }
      }),
      [`${componentCls}-row-indent + ${componentCls}-row-expand-icon`]: {
        marginTop: (fontSize * lineHeight - lineWidth * 3) / 2 - Math.ceil((fontSizeSM * 1.4 - lineWidth * 3) / 2),
        marginInlineEnd: paddingXS
      },
      [`tr${componentCls}-expanded-row`]: {
        '&, &:hover': {
          '> td': {
            background: tableExpandedRowBg
          }
        },
        // https://github.com/ant-design/ant-design/issues/25573
        [`${antCls}-descriptions-view`]: {
          display: 'flex',
          table: {
            flex: 'auto',
            width: 'auto'
          }
        }
      },
      // With fixed
      [`${componentCls}-expanded-row-fixed`]: {
        position: 'relative',
        margin: `-${tablePaddingVertical}px -${tablePaddingHorizontal}px`,
        padding: `${tablePaddingVertical}px ${tablePaddingHorizontal}px`
      }
    }
  };
};

const genFilterStyle = token => {
  const {
    componentCls,
    antCls,
    iconCls,
    tableFilterDropdownWidth,
    tableFilterDropdownSearchWidth,
    paddingXXS,
    paddingXS,
    colorText,
    lineWidth,
    lineType,
    tableBorderColor,
    tableHeaderIconColor,
    fontSizeSM,
    tablePaddingHorizontal,
    borderRadius,
    motionDurationSlow,
    colorTextDescription,
    colorPrimary,
    tableHeaderFilterActiveBg,
    colorTextDisabled,
    tableFilterDropdownBg,
    tableFilterDropdownHeight,
    controlItemBgHover,
    controlItemBgActive,
    boxShadowSecondary
  } = token;
  const dropdownPrefixCls = `${antCls}-dropdown`;
  const tableFilterDropdownPrefixCls = `${componentCls}-filter-dropdown`;
  const treePrefixCls = `${antCls}-tree`;
  const tableBorder = `${lineWidth}px ${lineType} ${tableBorderColor}`;
  return [{
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-filter-column`]: {
        display: 'flex',
        justifyContent: 'space-between'
      },
      [`${componentCls}-filter-trigger`]: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        marginBlock: -paddingXXS,
        marginInline: `${paddingXXS}px ${-tablePaddingHorizontal / 2}px`,
        padding: `0 ${paddingXXS}px`,
        color: tableHeaderIconColor,
        fontSize: fontSizeSM,
        borderRadius,
        cursor: 'pointer',
        transition: `all ${motionDurationSlow}`,
        '&:hover': {
          color: colorTextDescription,
          background: tableHeaderFilterActiveBg
        },
        '&.active': {
          color: colorPrimary
        }
      }
    }
  }, {
    // Dropdown
    [`${antCls}-dropdown`]: {
      [tableFilterDropdownPrefixCls]: _extends(_extends({}, resetComponent(token)), {
        minWidth: tableFilterDropdownWidth,
        backgroundColor: tableFilterDropdownBg,
        borderRadius,
        boxShadow: boxShadowSecondary,
        // Reset menu
        [`${dropdownPrefixCls}-menu`]: {
          // https://github.com/ant-design/ant-design/issues/4916
          // https://github.com/ant-design/ant-design/issues/19542
          maxHeight: tableFilterDropdownHeight,
          overflowX: 'hidden',
          border: 0,
          boxShadow: 'none',
          '&:empty::after': {
            display: 'block',
            padding: `${paddingXS}px 0`,
            color: colorTextDisabled,
            fontSize: fontSizeSM,
            textAlign: 'center',
            content: '"Not Found"'
          }
        },
        [`${tableFilterDropdownPrefixCls}-tree`]: {
          paddingBlock: `${paddingXS}px 0`,
          paddingInline: paddingXS,
          [treePrefixCls]: {
            padding: 0
          },
          [`${treePrefixCls}-treenode ${treePrefixCls}-node-content-wrapper:hover`]: {
            backgroundColor: controlItemBgHover
          },
          [`${treePrefixCls}-treenode-checkbox-checked ${treePrefixCls}-node-content-wrapper`]: {
            '&, &:hover': {
              backgroundColor: controlItemBgActive
            }
          }
        },
        [`${tableFilterDropdownPrefixCls}-search`]: {
          padding: paddingXS,
          borderBottom: tableBorder,
          '&-input': {
            input: {
              minWidth: tableFilterDropdownSearchWidth
            },
            [iconCls]: {
              color: colorTextDisabled
            }
          }
        },
        [`${tableFilterDropdownPrefixCls}-checkall`]: {
          width: '100%',
          marginBottom: paddingXXS,
          marginInlineStart: paddingXXS
        },
        // Operation
        [`${tableFilterDropdownPrefixCls}-btns`]: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: `${paddingXS - lineWidth}px ${paddingXS}px`,
          overflow: 'hidden',
          backgroundColor: 'inherit',
          borderTop: tableBorder
        }
      })
    }
  },
  // Dropdown Menu & SubMenu
  {
    // submenu of table filter dropdown
    [`${antCls}-dropdown ${tableFilterDropdownPrefixCls}, ${tableFilterDropdownPrefixCls}-submenu`]: {
      // Checkbox
      [`${antCls}-checkbox-wrapper + span`]: {
        paddingInlineStart: paddingXS,
        color: colorText
      },
      [`> ul`]: {
        maxHeight: 'calc(100vh - 130px)',
        overflowX: 'hidden',
        overflowY: 'auto'
      }
    }
  }];
};

const genFixedStyle = token => {
  const {
    componentCls,
    lineWidth,
    colorSplit,
    motionDurationSlow,
    zIndexTableFixed,
    tableBg,
    zIndexTableSticky
  } = token;
  const shadowColor = colorSplit;
  // Follow style is magic of shadow which should not follow token:
  return {
    [`${componentCls}-wrapper`]: {
      [`
        ${componentCls}-cell-fix-left,
        ${componentCls}-cell-fix-right
      `]: {
        position: 'sticky !important',
        zIndex: zIndexTableFixed,
        background: tableBg
      },
      [`
        ${componentCls}-cell-fix-left-first::after,
        ${componentCls}-cell-fix-left-last::after
      `]: {
        position: 'absolute',
        top: 0,
        right: {
          _skip_check_: true,
          value: 0
        },
        bottom: -lineWidth,
        width: 30,
        transform: 'translateX(100%)',
        transition: `box-shadow ${motionDurationSlow}`,
        content: '""',
        pointerEvents: 'none'
      },
      [`${componentCls}-cell-fix-left-all::after`]: {
        display: 'none'
      },
      [`
        ${componentCls}-cell-fix-right-first::after,
        ${componentCls}-cell-fix-right-last::after
      `]: {
        position: 'absolute',
        top: 0,
        bottom: -lineWidth,
        left: {
          _skip_check_: true,
          value: 0
        },
        width: 30,
        transform: 'translateX(-100%)',
        transition: `box-shadow ${motionDurationSlow}`,
        content: '""',
        pointerEvents: 'none'
      },
      [`${componentCls}-container`]: {
        '&::before, &::after': {
          position: 'absolute',
          top: 0,
          bottom: 0,
          zIndex: zIndexTableSticky + 1,
          width: 30,
          transition: `box-shadow ${motionDurationSlow}`,
          content: '""',
          pointerEvents: 'none'
        },
        '&::before': {
          insetInlineStart: 0
        },
        '&::after': {
          insetInlineEnd: 0
        }
      },
      [`${componentCls}-ping-left`]: {
        [`&:not(${componentCls}-has-fix-left) ${componentCls}-container`]: {
          position: 'relative',
          '&::before': {
            boxShadow: `inset 10px 0 8px -8px ${shadowColor}`
          }
        },
        [`
          ${componentCls}-cell-fix-left-first::after,
          ${componentCls}-cell-fix-left-last::after
        `]: {
          boxShadow: `inset 10px 0 8px -8px ${shadowColor}`
        },
        [`${componentCls}-cell-fix-left-last::before`]: {
          backgroundColor: 'transparent !important'
        }
      },
      [`${componentCls}-ping-right`]: {
        [`&:not(${componentCls}-has-fix-right) ${componentCls}-container`]: {
          position: 'relative',
          '&::after': {
            boxShadow: `inset -10px 0 8px -8px ${shadowColor}`
          }
        },
        [`
          ${componentCls}-cell-fix-right-first::after,
          ${componentCls}-cell-fix-right-last::after
        `]: {
          boxShadow: `inset -10px 0 8px -8px ${shadowColor}`
        }
      }
    }
  };
};

const genPaginationStyle = token => {
  const {
    componentCls,
    antCls
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      // ========================== Pagination ==========================
      [`${componentCls}-pagination${antCls}-pagination`]: {
        margin: `${token.margin}px 0`
      },
      [`${componentCls}-pagination`]: {
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: token.paddingXS,
        '> *': {
          flex: 'none'
        },
        '&-left': {
          justifyContent: 'flex-start'
        },
        '&-center': {
          justifyContent: 'center'
        },
        '&-right': {
          justifyContent: 'flex-end'
        }
      }
    }
  };
};

const genRadiusStyle = token => {
  const {
    componentCls,
    tableRadius
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [componentCls]: {
        // https://github.com/ant-design/ant-design/issues/39115#issuecomment-1362314574
        [`${componentCls}-title, ${componentCls}-header`]: {
          borderRadius: `${tableRadius}px ${tableRadius}px 0 0`
        },
        [`${componentCls}-title + ${componentCls}-container`]: {
          borderStartStartRadius: 0,
          borderStartEndRadius: 0,
          table: {
            borderRadius: 0,
            '> thead > tr:first-child': {
              'th:first-child': {
                borderRadius: 0
              },
              'th:last-child': {
                borderRadius: 0
              }
            }
          }
        },
        '&-container': {
          borderStartStartRadius: tableRadius,
          borderStartEndRadius: tableRadius,
          'table > thead > tr:first-child': {
            '> *:first-child': {
              borderStartStartRadius: tableRadius
            },
            '> *:last-child': {
              borderStartEndRadius: tableRadius
            }
          }
        },
        '&-footer': {
          borderRadius: `0 0 ${tableRadius}px ${tableRadius}px`
        }
      }
    }
  };
};

const genStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper-rtl`]: {
      direction: 'rtl',
      table: {
        direction: 'rtl'
      },
      [`${componentCls}-pagination-left`]: {
        justifyContent: 'flex-end'
      },
      [`${componentCls}-pagination-right`]: {
        justifyContent: 'flex-start'
      },
      [`${componentCls}-row-expand-icon`]: {
        '&::after': {
          transform: 'rotate(-90deg)'
        },
        '&-collapsed::before': {
          transform: 'rotate(180deg)'
        },
        '&-collapsed::after': {
          transform: 'rotate(0deg)'
        }
      }
    }
  };
};

const genSelectionStyle = token => {
  const {
    componentCls,
    antCls,
    iconCls,
    fontSizeIcon,
    paddingXS,
    tableHeaderIconColor,
    tableHeaderIconColorHover
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      // ========================== Selections ==========================
      [`${componentCls}-selection-col`]: {
        width: token.tableSelectionColumnWidth
      },
      [`${componentCls}-bordered ${componentCls}-selection-col`]: {
        width: token.tableSelectionColumnWidth + paddingXS * 2
      },
      [`
        table tr th${componentCls}-selection-column,
        table tr td${componentCls}-selection-column
      `]: {
        paddingInlineEnd: token.paddingXS,
        paddingInlineStart: token.paddingXS,
        textAlign: 'center',
        [`${antCls}-radio-wrapper`]: {
          marginInlineEnd: 0
        }
      },
      [`table tr th${componentCls}-selection-column${componentCls}-cell-fix-left`]: {
        zIndex: token.zIndexTableFixed + 1
      },
      [`table tr th${componentCls}-selection-column::after`]: {
        backgroundColor: 'transparent !important'
      },
      [`${componentCls}-selection`]: {
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column'
      },
      [`${componentCls}-selection-extra`]: {
        position: 'absolute',
        top: 0,
        zIndex: 1,
        cursor: 'pointer',
        transition: `all ${token.motionDurationSlow}`,
        marginInlineStart: '100%',
        paddingInlineStart: `${token.tablePaddingHorizontal / 4}px`,
        [iconCls]: {
          color: tableHeaderIconColor,
          fontSize: fontSizeIcon,
          verticalAlign: 'baseline',
          '&:hover': {
            color: tableHeaderIconColorHover
          }
        }
      }
    }
  };
};

const genSizeStyle = token => {
  const {
    componentCls
  } = token;
  const getSizeStyle = (size, paddingVertical, paddingHorizontal, fontSize) => ({
    [`${componentCls}${componentCls}-${size}`]: {
      fontSize,
      [`
        ${componentCls}-title,
        ${componentCls}-footer,
        ${componentCls}-thead > tr > th,
        ${componentCls}-tbody > tr > td,
        tfoot > tr > th,
        tfoot > tr > td
      `]: {
        padding: `${paddingVertical}px ${paddingHorizontal}px`
      },
      [`${componentCls}-filter-trigger`]: {
        marginInlineEnd: `-${paddingHorizontal / 2}px`
      },
      [`${componentCls}-expanded-row-fixed`]: {
        margin: `-${paddingVertical}px -${paddingHorizontal}px`
      },
      [`${componentCls}-tbody`]: {
        // ========================= Nest Table ===========================
        [`${componentCls}-wrapper:only-child ${componentCls}`]: {
          marginBlock: `-${paddingVertical}px`,
          marginInline: `${token.tableExpandColumnWidth - paddingHorizontal}px -${paddingHorizontal}px`
        }
      },
      // https://github.com/ant-design/ant-design/issues/35167
      [`${componentCls}-selection-column`]: {
        paddingInlineStart: `${paddingHorizontal / 4}px`
      }
    }
  });
  return {
    [`${componentCls}-wrapper`]: _extends(_extends({}, getSizeStyle('middle', token.tablePaddingVerticalMiddle, token.tablePaddingHorizontalMiddle, token.tableFontSizeMiddle)), getSizeStyle('small', token.tablePaddingVerticalSmall, token.tablePaddingHorizontalSmall, token.tableFontSizeSmall))
  };
};

const genResizeStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper ${componentCls}-resize-handle`]: {
      position: 'absolute',
      top: 0,
      height: '100% !important',
      bottom: 0,
      left: ' auto !important',
      right: ' -8px',
      cursor: 'col-resize',
      touchAction: 'none',
      userSelect: 'auto',
      width: '16px',
      zIndex: 1,
      [`&-line`]: {
        display: 'block',
        width: '1px',
        marginLeft: '7px',
        height: '100% !important',
        backgroundColor: token.colorPrimary,
        opacity: 0
      },
      [`&:hover &-line`]: {
        opacity: 1
      }
    },
    [`${componentCls}-wrapper  ${componentCls}-resize-handle.dragging`]: {
      overflow: 'hidden',
      [`${componentCls}-resize-handle-line`]: {
        opacity: 1
      },
      [`&:before`]: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        content: '" "',
        width: '200vw',
        transform: 'translateX(-50%)',
        opacity: 0
      }
    }
  };
};

const genSorterStyle = token => {
  const {
    componentCls,
    marginXXS,
    fontSizeIcon,
    tableHeaderIconColor,
    tableHeaderIconColorHover
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-thead th${componentCls}-column-has-sorters`]: {
        outline: 'none',
        cursor: 'pointer',
        transition: `all ${token.motionDurationSlow}`,
        '&:hover': {
          background: token.tableHeaderSortHoverBg,
          '&::before': {
            backgroundColor: 'transparent !important'
          }
        },
        '&:focus-visible': {
          color: token.colorPrimary
        },
        // https://github.com/ant-design/ant-design/issues/30969
        [`
          &${componentCls}-cell-fix-left:hover,
          &${componentCls}-cell-fix-right:hover
        `]: {
          background: token.tableFixedHeaderSortActiveBg
        }
      },
      [`${componentCls}-thead th${componentCls}-column-sort`]: {
        background: token.tableHeaderSortBg,
        '&::before': {
          backgroundColor: 'transparent !important'
        }
      },
      [`td${componentCls}-column-sort`]: {
        background: token.tableBodySortBg
      },
      [`${componentCls}-column-title`]: {
        position: 'relative',
        zIndex: 1,
        flex: 1
      },
      [`${componentCls}-column-sorters`]: {
        display: 'flex',
        flex: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        '&::after': {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          content: '""'
        }
      },
      [`${componentCls}-column-sorter`]: {
        marginInlineStart: marginXXS,
        color: tableHeaderIconColor,
        fontSize: 0,
        transition: `color ${token.motionDurationSlow}`,
        '&-inner': {
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center'
        },
        '&-up, &-down': {
          fontSize: fontSizeIcon,
          '&.active': {
            color: token.colorPrimary
          }
        },
        [`${componentCls}-column-sorter-up + ${componentCls}-column-sorter-down`]: {
          marginTop: '-0.3em'
        }
      },
      [`${componentCls}-column-sorters:hover ${componentCls}-column-sorter`]: {
        color: tableHeaderIconColorHover
      }
    }
  };
};

const genStickyStyle = token => {
  const {
    componentCls,
    opacityLoading,
    tableScrollThumbBg,
    tableScrollThumbBgHover,
    tableScrollThumbSize,
    tableScrollBg,
    zIndexTableSticky
  } = token;
  const tableBorder = `${token.lineWidth}px ${token.lineType} ${token.tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-sticky`]: {
        '&-holder': {
          position: 'sticky',
          zIndex: zIndexTableSticky,
          background: token.colorBgContainer
        },
        '&-scroll': {
          position: 'sticky',
          bottom: 0,
          height: `${tableScrollThumbSize}px !important`,
          zIndex: zIndexTableSticky,
          display: 'flex',
          alignItems: 'center',
          background: tableScrollBg,
          borderTop: tableBorder,
          opacity: opacityLoading,
          '&:hover': {
            transformOrigin: 'center bottom'
          },
          // fake scrollbar style of sticky
          '&-bar': {
            height: tableScrollThumbSize,
            backgroundColor: tableScrollThumbBg,
            borderRadius: 100,
            transition: `all ${token.motionDurationSlow}, transform none`,
            position: 'absolute',
            bottom: 0,
            '&:hover, &-active': {
              backgroundColor: tableScrollThumbBgHover
            }
          }
        }
      }
    }
  };
};

const genSummaryStyle = token => {
  const {
    componentCls,
    lineWidth,
    tableBorderColor
  } = token;
  const tableBorder = `${lineWidth}px ${token.lineType} ${tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-summary`]: {
        position: 'relative',
        zIndex: token.zIndexTableFixed,
        background: token.tableBg,
        '> tr': {
          '> th, > td': {
            borderBottom: tableBorder
          }
        }
      },
      [`div${componentCls}-summary`]: {
        boxShadow: `0 -${lineWidth}px 0 ${tableBorderColor}`
      }
    }
  };
};

const genTableStyle = token => {
  const {
    componentCls,
    fontWeightStrong,
    tablePaddingVertical,
    tablePaddingHorizontal,
    lineWidth,
    lineType,
    tableBorderColor,
    tableFontSize,
    tableBg,
    tableRadius,
    tableHeaderTextColor,
    motionDurationMid,
    tableHeaderBg,
    tableHeaderCellSplitColor,
    tableRowHoverBg,
    tableSelectedRowBg,
    tableSelectedRowHoverBg,
    tableFooterTextColor,
    tableFooterBg,
    paddingContentVerticalLG
  } = token;
  const tableBorder = `${lineWidth}px ${lineType} ${tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: _extends(_extends({
      clear: 'both',
      maxWidth: '100%'
    }, clearFix()), {
      [componentCls]: _extends(_extends({}, resetComponent(token)), {
        fontSize: tableFontSize,
        background: tableBg,
        borderRadius: `${tableRadius}px ${tableRadius}px 0 0`
      }),
      // https://github.com/ant-design/ant-design/issues/17611
      table: {
        width: '100%',
        textAlign: 'start',
        borderRadius: `${tableRadius}px ${tableRadius}px 0 0`,
        borderCollapse: 'separate',
        borderSpacing: 0
      },
      // ============================= Cell =============================
      [`
          ${componentCls}-thead > tr > th,
          ${componentCls}-tbody > tr > td,
          tfoot > tr > th,
          tfoot > tr > td
        `]: {
        position: 'relative',
        padding: `${paddingContentVerticalLG}px ${tablePaddingHorizontal}px`,
        overflowWrap: 'break-word'
      },
      // ============================ Title =============================
      [`${componentCls}-title`]: {
        padding: `${tablePaddingVertical}px ${tablePaddingHorizontal}px`
      },
      // ============================ Header ============================
      [`${componentCls}-thead`]: {
        [`
          > tr > th,
          > tr > td
        `]: {
          position: 'relative',
          color: tableHeaderTextColor,
          fontWeight: fontWeightStrong,
          textAlign: 'start',
          background: tableHeaderBg,
          borderBottom: tableBorder,
          transition: `background ${motionDurationMid} ease`,
          "&[colspan]:not([colspan='1'])": {
            textAlign: 'center'
          },
          [`&:not(:last-child):not(${componentCls}-selection-column):not(${componentCls}-row-expand-icon-cell):not([colspan])::before`]: {
            position: 'absolute',
            top: '50%',
            insetInlineEnd: 0,
            width: 1,
            height: '1.6em',
            backgroundColor: tableHeaderCellSplitColor,
            transform: 'translateY(-50%)',
            transition: `background-color ${motionDurationMid}`,
            content: '""'
          }
        },
        '> tr:not(:last-child) > th[colspan]': {
          borderBottom: 0
        }
      },
      // ============================ Body ============================
      // Borderless Table has unique hover style, which would be implemented with `borderTop`.
      [`${componentCls}:not(${componentCls}-bordered)`]: {
        [`${componentCls}-tbody`]: {
          '> tr': {
            '> td': {
              borderTop: tableBorder,
              borderBottom: 'transparent'
            },
            '&:last-child > td': {
              borderBottom: tableBorder
            },
            [`&:first-child > td,
              &${componentCls}-measure-row + tr > td`]: {
              borderTop: 'none',
              borderTopColor: 'transparent'
            }
          }
        }
      },
      // Bordered Table remains simple `borderBottom`.
      // Ref issue: https://github.com/ant-design/ant-design/issues/38724
      [`${componentCls}${componentCls}-bordered`]: {
        [`${componentCls}-tbody`]: {
          '> tr': {
            '> td': {
              borderBottom: tableBorder
            }
          }
        }
      },
      [`${componentCls}-tbody`]: {
        '> tr': {
          '> td': {
            transition: `background ${motionDurationMid}, border-color ${motionDurationMid}`,
            // ========================= Nest Table ===========================
            [`
              > ${componentCls}-wrapper:only-child,
              > ${componentCls}-expanded-row-fixed > ${componentCls}-wrapper:only-child
            `]: {
              [componentCls]: {
                marginBlock: `-${tablePaddingVertical}px`,
                marginInline: `${token.tableExpandColumnWidth - tablePaddingHorizontal}px -${tablePaddingHorizontal}px`,
                [`${componentCls}-tbody > tr:last-child > td`]: {
                  borderBottom: 0,
                  '&:first-child, &:last-child': {
                    borderRadius: 0
                  }
                }
              }
            }
          },
          [`
            &${componentCls}-row:hover > td,
            > td${componentCls}-cell-row-hover
          `]: {
            background: tableRowHoverBg
          },
          [`&${componentCls}-row-selected`]: {
            '> td': {
              background: tableSelectedRowBg
            },
            '&:hover > td': {
              background: tableSelectedRowHoverBg
            }
          }
        }
      },
      // ============================ Footer ============================
      [`${componentCls}-footer`]: {
        padding: `${tablePaddingVertical}px ${tablePaddingHorizontal}px`,
        color: tableFooterTextColor,
        background: tableFooterBg
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Table', token => {
  const {
    controlItemBgActive,
    controlItemBgActiveHover,
    colorTextPlaceholder,
    colorTextHeading,
    colorSplit,
    colorBorderSecondary,
    fontSize,
    padding,
    paddingXS,
    paddingSM,
    controlHeight,
    colorFillAlter,
    colorIcon,
    colorIconHover,
    opacityLoading,
    colorBgContainer,
    borderRadiusLG,
    colorFillContent,
    colorFillSecondary,
    controlInteractiveSize: checkboxSize
  } = token;
  const baseColorAction = new TinyColor(colorIcon);
  const baseColorActionHover = new TinyColor(colorIconHover);
  const tableSelectedRowBg = controlItemBgActive;
  const zIndexTableFixed = 2;
  const colorFillSecondarySolid = new TinyColor(colorFillSecondary).onBackground(colorBgContainer).toHexString();
  const colorFillContentSolid = new TinyColor(colorFillContent).onBackground(colorBgContainer).toHexString();
  const colorFillAlterSolid = new TinyColor(colorFillAlter).onBackground(colorBgContainer).toHexString();
  const tableToken = merge(token, {
    tableFontSize: fontSize,
    tableBg: colorBgContainer,
    tableRadius: borderRadiusLG,
    tablePaddingVertical: padding,
    tablePaddingHorizontal: padding,
    tablePaddingVerticalMiddle: paddingSM,
    tablePaddingHorizontalMiddle: paddingXS,
    tablePaddingVerticalSmall: paddingXS,
    tablePaddingHorizontalSmall: paddingXS,
    tableBorderColor: colorBorderSecondary,
    tableHeaderTextColor: colorTextHeading,
    tableHeaderBg: colorFillAlterSolid,
    tableFooterTextColor: colorTextHeading,
    tableFooterBg: colorFillAlterSolid,
    tableHeaderCellSplitColor: colorBorderSecondary,
    tableHeaderSortBg: colorFillSecondarySolid,
    tableHeaderSortHoverBg: colorFillContentSolid,
    tableHeaderIconColor: baseColorAction.clone().setAlpha(baseColorAction.getAlpha() * opacityLoading).toRgbString(),
    tableHeaderIconColorHover: baseColorActionHover.clone().setAlpha(baseColorActionHover.getAlpha() * opacityLoading).toRgbString(),
    tableBodySortBg: colorFillAlterSolid,
    tableFixedHeaderSortActiveBg: colorFillSecondarySolid,
    tableHeaderFilterActiveBg: colorFillContent,
    tableFilterDropdownBg: colorBgContainer,
    tableRowHoverBg: colorFillAlterSolid,
    tableSelectedRowBg,
    tableSelectedRowHoverBg: controlItemBgActiveHover,
    zIndexTableFixed,
    zIndexTableSticky: zIndexTableFixed + 1,
    tableFontSizeMiddle: fontSize,
    tableFontSizeSmall: fontSize,
    tableSelectionColumnWidth: controlHeight,
    tableExpandIconBg: colorBgContainer,
    tableExpandColumnWidth: checkboxSize + 2 * token.padding,
    tableExpandedRowBg: colorFillAlter,
    // Dropdown
    tableFilterDropdownWidth: 120,
    tableFilterDropdownHeight: 264,
    tableFilterDropdownSearchWidth: 140,
    // Virtual Scroll Bar
    tableScrollThumbSize: 8,
    tableScrollThumbBg: colorTextPlaceholder,
    tableScrollThumbBgHover: colorTextHeading,
    tableScrollBg: colorSplit
  });
  return [genTableStyle(tableToken), genPaginationStyle(tableToken), genSummaryStyle(tableToken), genSorterStyle(tableToken), genFilterStyle(tableToken), genBorderedStyle(tableToken), genRadiusStyle(tableToken), genExpandStyle(tableToken), genSummaryStyle(tableToken), genEmptyStyle(tableToken), genSelectionStyle(tableToken), genFixedStyle(tableToken), genStickyStyle(tableToken), genEllipsisStyle(tableToken), genSizeStyle(tableToken), genResizeStyle(tableToken), genStyle(tableToken)];
});

const EMPTY_LIST = [];
const tableProps = () => {
  return {
    prefixCls: stringType(),
    columns: arrayType(),
    rowKey: someType([String, Function]),
    tableLayout: stringType(),
    rowClassName: someType([String, Function]),
    title: functionType(),
    footer: functionType(),
    id: stringType(),
    showHeader: booleanType(),
    components: objectType(),
    customRow: functionType(),
    customHeaderRow: functionType(),
    direction: stringType(),
    expandFixed: someType([Boolean, String]),
    expandColumnWidth: Number,
    expandedRowKeys: arrayType(),
    defaultExpandedRowKeys: arrayType(),
    expandedRowRender: functionType(),
    expandRowByClick: booleanType(),
    expandIcon: functionType(),
    onExpand: functionType(),
    onExpandedRowsChange: functionType(),
    'onUpdate:expandedRowKeys': functionType(),
    defaultExpandAllRows: booleanType(),
    indentSize: Number,
    /** @deprecated Please use `EXPAND_COLUMN` in `columns` directly */
    expandIconColumnIndex: Number,
    showExpandColumn: booleanType(),
    expandedRowClassName: functionType(),
    childrenColumnName: stringType(),
    rowExpandable: functionType(),
    sticky: someType([Boolean, Object]),
    dropdownPrefixCls: String,
    dataSource: arrayType(),
    pagination: someType([Boolean, Object]),
    loading: someType([Boolean, Object]),
    size: stringType(),
    bordered: booleanType(),
    locale: objectType(),
    onChange: functionType(),
    onResizeColumn: functionType(),
    rowSelection: objectType(),
    getPopupContainer: functionType(),
    scroll: objectType(),
    sortDirections: arrayType(),
    showSorterTooltip: someType([Boolean, Object], true),
    transformCellText: functionType()
  };
};
const InternalTable = defineComponent({
  name: 'InternalTable',
  inheritAttrs: false,
  props: initDefaultProps(_extends(_extends({}, tableProps()), {
    contextSlots: objectType()
  }), {
    rowKey: 'key'
  }),
  setup(props, _ref) {
    let {
      attrs,
      slots,
      expose,
      emit
    } = _ref;
    devWarning(!(typeof props.rowKey === 'function' && props.rowKey.length > 1), 'Table', '`index` parameter of `rowKey` function is deprecated. There is no guarantee that it will work as expected.');
    useProvideSlots(computed(() => props.contextSlots));
    useProvideTableContext({
      onResizeColumn: (w, col) => {
        emit('resizeColumn', w, col);
      }
    });
    const screens = useBreakpoint();
    const mergedColumns = computed(() => {
      const matched = new Set(Object.keys(screens.value).filter(m => screens.value[m]));
      return props.columns.filter(c => !c.responsive || c.responsive.some(r => matched.has(r)));
    });
    const {
      size: mergedSize,
      renderEmpty,
      direction,
      prefixCls,
      configProvider
    } = useConfigInject('table', props);
    // Style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const transformCellText = computed(() => {
      var _a;
      return props.transformCellText || ((_a = configProvider.transformCellText) === null || _a === void 0 ? void 0 : _a.value);
    });
    const [tableLocale] = useLocaleReceiver('Table', localeValues.Table, toRef(props, 'locale'));
    const rawData = computed(() => props.dataSource || EMPTY_LIST);
    const dropdownPrefixCls = computed(() => configProvider.getPrefixCls('dropdown', props.dropdownPrefixCls));
    const childrenColumnName = computed(() => props.childrenColumnName || 'children');
    const expandType = computed(() => {
      if (rawData.value.some(item => item === null || item === void 0 ? void 0 : item[childrenColumnName.value])) {
        return 'nest';
      }
      if (props.expandedRowRender) {
        return 'row';
      }
      return null;
    });
    const internalRefs = reactive({
      body: null
    });
    const updateInternalRefs = refs => {
      _extends(internalRefs, refs);
    };
    // ============================ RowKey ============================
    const getRowKey = computed(() => {
      if (typeof props.rowKey === 'function') {
        return props.rowKey;
      }
      return record => record === null || record === void 0 ? void 0 : record[props.rowKey];
    });
    const [getRecordByKey] = useLazyKVMap(rawData, childrenColumnName, getRowKey);
    // ============================ Events =============================
    const changeEventInfo = {};
    const triggerOnChange = function (info, action) {
      let reset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const {
        pagination,
        scroll,
        onChange
      } = props;
      const changeInfo = _extends(_extends({}, changeEventInfo), info);
      if (reset) {
        changeEventInfo.resetPagination();
        // Reset event param
        if (changeInfo.pagination.current) {
          changeInfo.pagination.current = 1;
        }
        // Trigger pagination events
        if (pagination && pagination.onChange) {
          pagination.onChange(1, changeInfo.pagination.pageSize);
        }
      }
      if (scroll && scroll.scrollToFirstRowOnChange !== false && internalRefs.body) {
        scrollTo(0, {
          getContainer: () => internalRefs.body
        });
      }
      onChange === null || onChange === void 0 ? void 0 : onChange(changeInfo.pagination, changeInfo.filters, changeInfo.sorter, {
        currentDataSource: getFilterData(getSortData(rawData.value, changeInfo.sorterStates, childrenColumnName.value), changeInfo.filterStates),
        action
      });
    };
    /**
     * Controlled state in `columns` is not a good idea that makes too many code (1000+ line?) to read
     * state out and then put it back to title render. Move these code into `hooks` but still too
     * complex. We should provides Table props like `sorter` & `filter` to handle control in next big version.
     */
    // ============================ Sorter =============================
    const onSorterChange = (sorter, sorterStates) => {
      triggerOnChange({
        sorter,
        sorterStates
      }, 'sort', false);
    };
    const [transformSorterColumns, sortStates, sorterTitleProps, sorters] = useFilterSorter({
      prefixCls,
      mergedColumns,
      onSorterChange,
      sortDirections: computed(() => props.sortDirections || ['ascend', 'descend']),
      tableLocale,
      showSorterTooltip: toRef(props, 'showSorterTooltip')
    });
    const sortedData = computed(() => getSortData(rawData.value, sortStates.value, childrenColumnName.value));
    // ============================ Filter ============================
    const onFilterChange = (filters, filterStates) => {
      triggerOnChange({
        filters,
        filterStates
      }, 'filter', true);
    };
    const [transformFilterColumns, filterStates, filters] = useFilter({
      prefixCls,
      locale: tableLocale,
      dropdownPrefixCls,
      mergedColumns,
      onFilterChange,
      getPopupContainer: toRef(props, 'getPopupContainer')
    });
    const mergedData = computed(() => getFilterData(sortedData.value, filterStates.value));
    // ============================ Column ============================
    const [transformBasicColumns] = useColumns(toRef(props, 'contextSlots'));
    const columnTitleProps = computed(() => {
      const mergedFilters = {};
      const filtersValue = filters.value;
      Object.keys(filtersValue).forEach(filterKey => {
        if (filtersValue[filterKey] !== null) {
          mergedFilters[filterKey] = filtersValue[filterKey];
        }
      });
      return _extends(_extends({}, sorterTitleProps.value), {
        filters: mergedFilters
      });
    });
    const [transformTitleColumns] = useTitleColumns(columnTitleProps);
    // ========================== Pagination ==========================
    const onPaginationChange = (current, pageSize) => {
      triggerOnChange({
        pagination: _extends(_extends({}, changeEventInfo.pagination), {
          current,
          pageSize
        })
      }, 'paginate');
    };
    const [mergedPagination, resetPagination] = usePagination(computed(() => mergedData.value.length), toRef(props, 'pagination'), onPaginationChange);
    watchEffect(() => {
      changeEventInfo.sorter = sorters.value;
      changeEventInfo.sorterStates = sortStates.value;
      changeEventInfo.filters = filters.value;
      changeEventInfo.filterStates = filterStates.value;
      changeEventInfo.pagination = props.pagination === false ? {} : getPaginationParam(mergedPagination.value, props.pagination);
      changeEventInfo.resetPagination = resetPagination;
    });
    // ============================= Data =============================
    const pageData = computed(() => {
      if (props.pagination === false || !mergedPagination.value.pageSize) {
        return mergedData.value;
      }
      const {
        current = 1,
        total,
        pageSize = DEFAULT_PAGE_SIZE
      } = mergedPagination.value;
      devWarning(current > 0, 'Table', '`current` should be positive number.');
      // Dynamic table data
      if (mergedData.value.length < total) {
        if (mergedData.value.length > pageSize) {
          return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
        }
        return mergedData.value;
      }
      return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
    });
    watchEffect(() => {
      nextTick(() => {
        const {
          total,
          pageSize = DEFAULT_PAGE_SIZE
        } = mergedPagination.value;
        // Dynamic table data
        if (mergedData.value.length < total) {
          if (mergedData.value.length > pageSize) {
            devWarning(false, 'Table', '`dataSource` length is less than `pagination.total` but large than `pagination.pageSize`. Please make sure your config correct data with async mode.');
          }
        }
      });
    }, {
      flush: 'post'
    });
    const expandIconColumnIndex = computed(() => {
      if (props.showExpandColumn === false) return -1;
      // Adjust expand icon index, no overwrite expandIconColumnIndex if set.
      if (expandType.value === 'nest' && props.expandIconColumnIndex === undefined) {
        return props.rowSelection ? 1 : 0;
      } else if (props.expandIconColumnIndex > 0 && props.rowSelection) {
        return props.expandIconColumnIndex - 1;
      }
      return props.expandIconColumnIndex;
    });
    const rowSelection = ref();
    watch(() => props.rowSelection, () => {
      rowSelection.value = props.rowSelection ? _extends({}, props.rowSelection) : props.rowSelection;
    }, {
      deep: true,
      immediate: true
    });
    // ========================== Selections ==========================
    const [transformSelectionColumns, selectedKeySet] = useSelection(rowSelection, {
      prefixCls,
      data: mergedData,
      pageData,
      getRowKey,
      getRecordByKey,
      expandType,
      childrenColumnName,
      locale: tableLocale,
      getPopupContainer: computed(() => props.getPopupContainer)
    });
    const internalRowClassName = (record, index, indent) => {
      let mergedRowClassName;
      const {
        rowClassName
      } = props;
      if (typeof rowClassName === 'function') {
        mergedRowClassName = classNames(rowClassName(record, index, indent));
      } else {
        mergedRowClassName = classNames(rowClassName);
      }
      return classNames({
        [`${prefixCls.value}-row-selected`]: selectedKeySet.value.has(getRowKey.value(record, index))
      }, mergedRowClassName);
    };
    expose({
      selectedKeySet
    });
    const indentSize = computed(() => {
      // Indent size
      return typeof props.indentSize === 'number' ? props.indentSize : 15;
    });
    const transformColumns = innerColumns => {
      const res = transformTitleColumns(transformSelectionColumns(transformFilterColumns(transformSorterColumns(transformBasicColumns(innerColumns)))));
      return res;
    };
    return () => {
      var _a;
      const {
        expandIcon = slots.expandIcon || renderExpandIcon(tableLocale.value),
        pagination,
        loading,
        bordered
      } = props;
      let topPaginationNode;
      let bottomPaginationNode;
      if (pagination !== false && ((_a = mergedPagination.value) === null || _a === void 0 ? void 0 : _a.total)) {
        let paginationSize;
        if (mergedPagination.value.size) {
          paginationSize = mergedPagination.value.size;
        } else {
          paginationSize = mergedSize.value === 'small' || mergedSize.value === 'middle' ? 'small' : undefined;
        }
        const renderPagination = position => createVNode(Pagination, _objectSpread$5(_objectSpread$5({}, mergedPagination.value), {}, {
          "class": [`${prefixCls.value}-pagination ${prefixCls.value}-pagination-${position}`, mergedPagination.value.class],
          "size": paginationSize
        }), null);
        const defaultPosition = direction.value === 'rtl' ? 'left' : 'right';
        const {
          position
        } = mergedPagination.value;
        if (position !== null && Array.isArray(position)) {
          const topPos = position.find(p => p.includes('top'));
          const bottomPos = position.find(p => p.includes('bottom'));
          const isDisable = position.every(p => `${p}` === 'none');
          if (!topPos && !bottomPos && !isDisable) {
            bottomPaginationNode = renderPagination(defaultPosition);
          }
          if (topPos) {
            topPaginationNode = renderPagination(topPos.toLowerCase().replace('top', ''));
          }
          if (bottomPos) {
            bottomPaginationNode = renderPagination(bottomPos.toLowerCase().replace('bottom', ''));
          }
        } else {
          bottomPaginationNode = renderPagination(defaultPosition);
        }
      }
      // >>>>>>>>> Spinning
      let spinProps;
      if (typeof loading === 'boolean') {
        spinProps = {
          spinning: loading
        };
      } else if (typeof loading === 'object') {
        spinProps = _extends({
          spinning: true
        }, loading);
      }
      const wrapperClassNames = classNames(`${prefixCls.value}-wrapper`, {
        [`${prefixCls.value}-wrapper-rtl`]: direction.value === 'rtl'
      }, attrs.class, hashId.value);
      const tableProps = omit(props, ['columns']);
      return wrapSSR(createVNode("div", {
        "class": wrapperClassNames,
        "style": attrs.style
      }, [createVNode(Spin, _objectSpread$5({
        "spinning": false
      }, spinProps), {
        default: () => [topPaginationNode, createVNode(Table$2, _objectSpread$5(_objectSpread$5(_objectSpread$5({}, attrs), tableProps), {}, {
          "expandedRowKeys": props.expandedRowKeys,
          "defaultExpandedRowKeys": props.defaultExpandedRowKeys,
          "expandIconColumnIndex": expandIconColumnIndex.value,
          "indentSize": indentSize.value,
          "expandIcon": expandIcon,
          "columns": mergedColumns.value,
          "direction": direction.value,
          "prefixCls": prefixCls.value,
          "class": classNames({
            [`${prefixCls.value}-middle`]: mergedSize.value === 'middle',
            [`${prefixCls.value}-small`]: mergedSize.value === 'small',
            [`${prefixCls.value}-bordered`]: bordered,
            [`${prefixCls.value}-empty`]: rawData.value.length === 0
          }),
          "data": pageData.value,
          "rowKey": getRowKey.value,
          "rowClassName": internalRowClassName,
          "internalHooks": INTERNAL_HOOKS,
          "internalRefs": internalRefs,
          "onUpdateInternalRefs": updateInternalRefs,
          "transformColumns": transformColumns,
          "transformCellText": transformCellText.value
        }), _extends(_extends({}, slots), {
          emptyText: () => {
            var _a, _b;
            return ((_a = slots.emptyText) === null || _a === void 0 ? void 0 : _a.call(slots)) || ((_b = props.locale) === null || _b === void 0 ? void 0 : _b.emptyText) || renderEmpty('Table');
          }
        })), bottomPaginationNode]
      })]));
    };
  }
});
const Table$1 = defineComponent({
  name: 'ATable',
  inheritAttrs: false,
  props: initDefaultProps(tableProps(), {
    rowKey: 'key'
  }),
  slots: Object,
  setup(props, _ref2) {
    let {
      attrs,
      slots,
      expose
    } = _ref2;
    const table = ref();
    expose({
      table
    });
    return () => {
      var _a;
      const columns = props.columns || convertChildrenToColumns((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots));
      return createVNode(InternalTable, _objectSpread$5(_objectSpread$5(_objectSpread$5({
        "ref": table
      }, attrs), props), {}, {
        "columns": columns || [],
        "expandedRowRender": slots.expandedRowRender || props.expandedRowRender,
        "contextSlots": _extends({}, slots)
      }), slots);
    };
  }
});

const Column = defineComponent({
  name: 'ATableColumn',
  slots: Object,
  render() {
    return null;
  }
});

const ColumnGroup = defineComponent({
  name: 'ATableColumnGroup',
  slots: Object,
  __ANT_TABLE_COLUMN_GROUP: true,
  render() {
    return null;
  }
});

const TableSummaryRow = SummaryRow;
const TableSummaryCell = SummaryCell;
const TableSummary = _extends(FooterComponents, {
  Cell: TableSummaryCell,
  Row: TableSummaryRow,
  name: 'ATableSummary'
});
const Table = _extends(Table$1, {
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  SELECTION_COLUMN,
  EXPAND_COLUMN,
  Column,
  ColumnGroup,
  Summary: TableSummary,
  install: app => {
    app.component(TableSummary.name, TableSummary);
    app.component(TableSummaryCell.name, TableSummaryCell);
    app.component(TableSummaryRow.name, TableSummaryRow);
    app.component(Table$1.name, Table$1);
    app.component(Column.name, Column);
    app.component(ColumnGroup.name, ColumnGroup);
    return app;
  }
});

export { Pagination as P, Select as S, Table as T, SelectOption as a, useMemo as u };
//# sourceMappingURL=index3.mjs.map
