import { _ as _export_sfc, f as useRoute, n as navigateTo } from './server.mjs';
import { inject, provide, defineComponent, shallowRef, computed, watch, nextTick, onMounted, createVNode, watchEffect, reactive, ref, onUnmounted, Transition, withDirectives, vShow, onBeforeUnmount, mergeProps, withCtx, createTextVNode, toDisplayString, openBlock, createBlock, Fragment, renderList, unref, createCommentVNode, renderSlot, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { C as ConfigProvider } from '../_/index13.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';
import { g as genComponentStyleHook, m as merge, r as resetComponent, u as useConfigInject, q as responsiveArray, aI as getPropsSlot, ax as ResizeObserver, P as PropTypes, l as flattenChildren, b as cloneElement, c as classNames, k as filterEmpty, aB as genPresetColor, a9 as Keyframe, aD as isPresetColor, d as getTransitionProps, I as Icon, e as initDefaultProps, t as tuple, B as Button } from '../_/collapseMotion.mjs';
import { e as eagerComputed, S as SiderHookProviderKey, g as SiderCollapsedKey, M as Menu, h as SubMenu, f as MenuItem, j as MenuDivider } from '../_/index4.mjs';
import _objectSpread$1 from '@babel/runtime/helpers/esm/objectSpread2';
import { L as LeftOutlined, R as RightOutlined, D as Dropdown } from '../_/index6.mjs';
import { u as useBreakpoint } from '../_/useBreakpoint.mjs';
import { P as Popover } from '../_/index12.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';
import '../_/InfoCircleFilled.mjs';
import '../_/ExclamationCircleFilled.mjs';
import '@ctrl/tinycolor';
import '@ant-design/colors';
import 'resize-observer-polyfill';
import 'dom-align';
import 'lodash-es/isEqual';
import 'stylis';
import 'vue-types';
import 'lodash-es';
import 'lodash-es/uniq';

const genBaseStyle = token => {
  const {
    antCls,
    componentCls,
    iconCls,
    avatarBg,
    avatarColor,
    containerSize,
    containerSizeLG,
    containerSizeSM,
    textFontSize,
    textFontSizeLG,
    textFontSizeSM,
    borderRadius,
    borderRadiusLG,
    borderRadiusSM,
    lineWidth,
    lineType
  } = token;
  // Avatar size style
  const avatarSizeStyle = (size, fontSize, radius) => ({
    width: size,
    height: size,
    lineHeight: `${size - lineWidth * 2}px`,
    borderRadius: '50%',
    [`&${componentCls}-square`]: {
      borderRadius: radius
    },
    [`${componentCls}-string`]: {
      position: 'absolute',
      left: {
        _skip_check_: true,
        value: '50%'
      },
      transformOrigin: '0 center'
    },
    [`&${componentCls}-icon`]: {
      fontSize,
      [`> ${iconCls}`]: {
        margin: 0
      }
    }
  });
  return {
    [componentCls]: _extends(_extends(_extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden',
      color: avatarColor,
      whiteSpace: 'nowrap',
      textAlign: 'center',
      verticalAlign: 'middle',
      background: avatarBg,
      border: `${lineWidth}px ${lineType} transparent`,
      [`&-image`]: {
        background: 'transparent'
      },
      [`${antCls}-image-img`]: {
        display: 'block'
      }
    }), avatarSizeStyle(containerSize, textFontSize, borderRadius)), {
      [`&-lg`]: _extends({}, avatarSizeStyle(containerSizeLG, textFontSizeLG, borderRadiusLG)),
      [`&-sm`]: _extends({}, avatarSizeStyle(containerSizeSM, textFontSizeSM, borderRadiusSM)),
      '> img': {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    })
  };
};
const genGroupStyle = token => {
  const {
    componentCls,
    groupBorderColor,
    groupOverlapping,
    groupSpace
  } = token;
  return {
    [`${componentCls}-group`]: {
      display: 'inline-flex',
      [`${componentCls}`]: {
        borderColor: groupBorderColor
      },
      [`> *:not(:first-child)`]: {
        marginInlineStart: groupOverlapping
      }
    },
    [`${componentCls}-group-popover`]: {
      [`${componentCls} + ${componentCls}`]: {
        marginInlineStart: groupSpace
      }
    }
  };
};
const useStyle$2 = genComponentStyleHook('Avatar', token => {
  const {
    colorTextLightSolid,
    colorTextPlaceholder
  } = token;
  const avatarToken = merge(token, {
    avatarBg: colorTextPlaceholder,
    avatarColor: colorTextLightSolid
  });
  return [genBaseStyle(avatarToken), genGroupStyle(avatarToken)];
}, token => {
  const {
    controlHeight,
    controlHeightLG,
    controlHeightSM,
    fontSize,
    fontSizeLG,
    fontSizeXL,
    fontSizeHeading3,
    marginXS,
    marginXXS,
    colorBorderBg
  } = token;
  return {
    containerSize: controlHeight,
    containerSizeLG: controlHeightLG,
    containerSizeSM: controlHeightSM,
    textFontSize: Math.round((fontSizeLG + fontSizeXL) / 2),
    textFontSizeLG: fontSizeHeading3,
    textFontSizeSM: fontSize,
    groupSpace: marginXXS,
    groupOverlapping: -marginXS,
    groupBorderColor: colorBorderBg
  };
});

const AvatarContextKey = Symbol('AvatarContextKey');
const useAvatarInjectContext = () => {
  return inject(AvatarContextKey, {});
};
const useAvatarProviderContext = context => {
  return provide(AvatarContextKey, context);
};

const avatarProps = () => ({
  prefixCls: String,
  shape: {
    type: String,
    default: 'circle'
  },
  size: {
    type: [Number, String, Object],
    default: () => 'default'
  },
  src: String,
  /** Srcset of image avatar */
  srcset: String,
  icon: PropTypes.any,
  alt: String,
  gap: Number,
  draggable: {
    type: Boolean,
    default: undefined
  },
  crossOrigin: String,
  loadError: {
    type: Function
  }
});
const Avatar = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AAvatar',
  inheritAttrs: false,
  props: avatarProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const isImgExist = shallowRef(true);
    const isMounted = shallowRef(false);
    const scale = shallowRef(1);
    const avatarChildrenRef = shallowRef(null);
    const avatarNodeRef = shallowRef(null);
    const {
      prefixCls
    } = useConfigInject('avatar', props);
    const [wrapSSR, hashId] = useStyle$2(prefixCls);
    const avatarCtx = useAvatarInjectContext();
    const size = computed(() => {
      return props.size === 'default' ? avatarCtx.size : props.size;
    });
    const screens = useBreakpoint();
    const responsiveSize = eagerComputed(() => {
      if (typeof props.size !== 'object') {
        return undefined;
      }
      const currentBreakpoint = responsiveArray.find(screen => screens.value[screen]);
      const currentSize = props.size[currentBreakpoint];
      return currentSize;
    });
    const responsiveSizeStyle = hasIcon => {
      if (responsiveSize.value) {
        return {
          width: `${responsiveSize.value}px`,
          height: `${responsiveSize.value}px`,
          lineHeight: `${responsiveSize.value}px`,
          fontSize: `${hasIcon ? responsiveSize.value / 2 : 18}px`
        };
      }
      return {};
    };
    const setScaleParam = () => {
      if (!avatarChildrenRef.value || !avatarNodeRef.value) {
        return;
      }
      const childrenWidth = avatarChildrenRef.value.offsetWidth; // offsetWidth avoid affecting be transform scale
      const nodeWidth = avatarNodeRef.value.offsetWidth;
      // denominator is 0 is no meaning
      if (childrenWidth !== 0 && nodeWidth !== 0) {
        const {
          gap = 4
        } = props;
        if (gap * 2 < nodeWidth) {
          scale.value = nodeWidth - gap * 2 < childrenWidth ? (nodeWidth - gap * 2) / childrenWidth : 1;
        }
      }
    };
    const handleImgLoadError = () => {
      const {
        loadError
      } = props;
      const errorFlag = loadError === null || loadError === void 0 ? void 0 : loadError();
      if (errorFlag !== false) {
        isImgExist.value = false;
      }
    };
    watch(() => props.src, () => {
      nextTick(() => {
        isImgExist.value = true;
        scale.value = 1;
      });
    });
    watch(() => props.gap, () => {
      nextTick(() => {
        setScaleParam();
      });
    });
    onMounted(() => {
      nextTick(() => {
        setScaleParam();
        isMounted.value = true;
      });
    });
    return () => {
      var _a, _b;
      const {
        shape,
        src,
        alt,
        srcset,
        draggable,
        crossOrigin
      } = props;
      const mergeShape = (_a = avatarCtx.shape) !== null && _a !== void 0 ? _a : shape;
      const icon = getPropsSlot(slots, props, 'icon');
      const pre = prefixCls.value;
      const classString = {
        [`${attrs.class}`]: !!attrs.class,
        [pre]: true,
        [`${pre}-lg`]: size.value === 'large',
        [`${pre}-sm`]: size.value === 'small',
        [`${pre}-${mergeShape}`]: true,
        [`${pre}-image`]: src && isImgExist.value,
        [`${pre}-icon`]: icon,
        [hashId.value]: true
      };
      const sizeStyle = typeof size.value === 'number' ? {
        width: `${size.value}px`,
        height: `${size.value}px`,
        lineHeight: `${size.value}px`,
        fontSize: icon ? `${size.value / 2}px` : '18px'
      } : {};
      const children = (_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots);
      let childrenToRender;
      if (src && isImgExist.value) {
        childrenToRender = createVNode("img", {
          "draggable": draggable,
          "src": src,
          "srcset": srcset,
          "onError": handleImgLoadError,
          "alt": alt,
          "crossorigin": crossOrigin
        }, null);
      } else if (icon) {
        childrenToRender = icon;
      } else if (isMounted.value || scale.value !== 1) {
        const transformString = `scale(${scale.value}) translateX(-50%)`;
        const childrenStyle = {
          msTransform: transformString,
          WebkitTransform: transformString,
          transform: transformString
        };
        const sizeChildrenStyle = typeof size.value === 'number' ? {
          lineHeight: `${size.value}px`
        } : {};
        childrenToRender = createVNode(ResizeObserver, {
          "onResize": setScaleParam
        }, {
          default: () => [createVNode("span", {
            "class": `${pre}-string`,
            "ref": avatarChildrenRef,
            "style": _extends(_extends({}, sizeChildrenStyle), childrenStyle)
          }, [children])]
        });
      } else {
        childrenToRender = createVNode("span", {
          "class": `${pre}-string`,
          "ref": avatarChildrenRef,
          "style": {
            opacity: 0
          }
        }, [children]);
      }
      return wrapSSR(createVNode("span", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
        "ref": avatarNodeRef,
        "class": classString,
        "style": [sizeStyle, responsiveSizeStyle(!!icon), attrs.style]
      }), [childrenToRender]));
    };
  }
});

const groupProps = () => ({
  prefixCls: String,
  maxCount: Number,
  maxStyle: {
    type: Object,
    default: undefined
  },
  maxPopoverPlacement: {
    type: String,
    default: 'top'
  },
  maxPopoverTrigger: String,
  /*
   * Size of avatar, options: `large`, `small`, `default`
   * or a custom number size
   * */
  size: {
    type: [Number, String, Object],
    default: 'default'
  },
  shape: {
    type: String,
    default: 'circle'
  }
});
const Group = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AAvatarGroup',
  inheritAttrs: false,
  props: groupProps(),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('avatar', props);
    const groupPrefixCls = computed(() => `${prefixCls.value}-group`);
    const [wrapSSR, hashId] = useStyle$2(prefixCls);
    watchEffect(() => {
      const context = {
        size: props.size,
        shape: props.shape
      };
      useAvatarProviderContext(context);
    });
    return () => {
      const {
        maxPopoverPlacement = 'top',
        maxCount,
        maxStyle,
        maxPopoverTrigger = 'hover',
        shape
      } = props;
      const cls = {
        [groupPrefixCls.value]: true,
        [`${groupPrefixCls.value}-rtl`]: direction.value === 'rtl',
        [`${attrs.class}`]: !!attrs.class,
        [hashId.value]: true
      };
      const children = getPropsSlot(slots, props);
      const childrenWithProps = flattenChildren(children).map((child, index) => cloneElement(child, {
        key: `avatar-key-${index}`
      }));
      const numOfChildren = childrenWithProps.length;
      if (maxCount && maxCount < numOfChildren) {
        const childrenShow = childrenWithProps.slice(0, maxCount);
        const childrenHidden = childrenWithProps.slice(maxCount, numOfChildren);
        childrenShow.push(createVNode(Popover, {
          "key": "avatar-popover-key",
          "content": childrenHidden,
          "trigger": maxPopoverTrigger,
          "placement": maxPopoverPlacement,
          "overlayClassName": `${groupPrefixCls.value}-popover`
        }, {
          default: () => [createVNode(Avatar, {
            "style": maxStyle,
            "shape": shape
          }, {
            default: () => [`+${numOfChildren - maxCount}`]
          })]
        }));
        return wrapSSR(createVNode("div", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
          "class": cls,
          "style": attrs.style
        }), [childrenShow]));
      }
      return wrapSSR(createVNode("div", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
        "class": cls,
        "style": attrs.style
      }), [childrenWithProps]));
    };
  }
});

Avatar.Group = Group;
/* istanbul ignore next */
Avatar.install = function (app) {
  app.component(Avatar.name, Avatar);
  app.component(Group.name, Group);
  return app;
};

function UnitNumber(_ref) {
  let {
    prefixCls,
    value,
    current,
    offset = 0
  } = _ref;
  let style;
  if (offset) {
    style = {
      position: 'absolute',
      top: `${offset}00%`,
      left: 0
    };
  }
  return createVNode("p", {
    "style": style,
    "class": classNames(`${prefixCls}-only-unit`, {
      current
    })
  }, [value]);
}
function getOffset(start, end, unit) {
  let index = start;
  let offset = 0;
  while ((index + 10) % 10 !== end) {
    index += unit;
    offset += unit;
  }
  return offset;
}
const SingleNumber = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'SingleNumber',
  props: {
    prefixCls: String,
    value: String,
    count: Number
  },
  setup(props) {
    const originValue = computed(() => Number(props.value));
    const originCount = computed(() => Math.abs(props.count));
    const state = reactive({
      prevValue: originValue.value,
      prevCount: originCount.value
    });
    // ============================= Events =============================
    const onTransitionEnd = () => {
      state.prevValue = originValue.value;
      state.prevCount = originCount.value;
    };
    const timeout = ref();
    // Fallback if transition event not support
    watch(originValue, () => {
      clearTimeout(timeout.value);
      timeout.value = setTimeout(() => {
        onTransitionEnd();
      }, 1000);
    }, {
      flush: 'post'
    });
    onUnmounted(() => {
      clearTimeout(timeout.value);
    });
    return () => {
      let unitNodes;
      let offsetStyle = {};
      const value = originValue.value;
      if (state.prevValue === value || Number.isNaN(value) || Number.isNaN(state.prevValue)) {
        // Nothing to change
        unitNodes = [UnitNumber(_extends(_extends({}, props), {
          current: true
        }))];
        offsetStyle = {
          transition: 'none'
        };
      } else {
        unitNodes = [];
        // Fill basic number units
        const end = value + 10;
        const unitNumberList = [];
        for (let index = value; index <= end; index += 1) {
          unitNumberList.push(index);
        }
        // Fill with number unit nodes
        const prevIndex = unitNumberList.findIndex(n => n % 10 === state.prevValue);
        unitNodes = unitNumberList.map((n, index) => {
          const singleUnit = n % 10;
          return UnitNumber(_extends(_extends({}, props), {
            value: singleUnit,
            offset: index - prevIndex,
            current: index === prevIndex
          }));
        });
        // Calculate container offset value
        const unit = state.prevCount < originCount.value ? 1 : -1;
        offsetStyle = {
          transform: `translateY(${-getOffset(state.prevValue, value, unit)}00%)`
        };
      }
      return createVNode("span", {
        "class": `${props.prefixCls}-only`,
        "style": offsetStyle,
        "onTransitionend": () => onTransitionEnd()
      }, [unitNodes]);
    };
  }
});

var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const scrollNumberProps = {
  prefixCls: String,
  count: PropTypes.any,
  component: String,
  title: PropTypes.any,
  show: Boolean
};
const ScrollNumber = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ScrollNumber',
  inheritAttrs: false,
  props: scrollNumberProps,
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('scroll-number', props);
    return () => {
      var _a;
      const _b = _extends(_extends({}, props), attrs),
        {
          prefixCls: customizePrefixCls,
          count,
          title,
          show,
          component: Tag = 'sup',
          class: className,
          style
        } = _b,
        restProps = __rest$1(_b, ["prefixCls", "count", "title", "show", "component", "class", "style"]);
      // ============================ Render ============================
      const newProps = _extends(_extends({}, restProps), {
        style,
        'data-show': props.show,
        class: classNames(prefixCls.value, className),
        title: title
      });
      // Only integer need motion
      let numberNodes = count;
      if (count && Number(count) % 1 === 0) {
        const numberList = String(count).split('');
        numberNodes = numberList.map((num, i) => createVNode(SingleNumber, {
          "prefixCls": prefixCls.value,
          "count": Number(count),
          "value": num,
          "key": numberList.length - i
        }, null));
      }
      // allow specify the border
      // mock border-color by box-shadow for compatible with old usage:
      // <Badge count={4} style={{ backgroundColor: '#fff', color: '#999', borderColor: '#d9d9d9' }} />
      if (style && style.borderColor) {
        newProps.style = _extends(_extends({}, style), {
          boxShadow: `0 0 0 1px ${style.borderColor} inset`
        });
      }
      const children = filterEmpty((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots));
      if (children && children.length) {
        return cloneElement(children, {
          class: classNames(`${prefixCls.value}-custom-component`)
        }, false);
      }
      return createVNode(Tag, newProps, {
        default: () => [numberNodes]
      });
    };
  }
});

const antStatusProcessing = new Keyframe('antStatusProcessing', {
  '0%': {
    transform: 'scale(0.8)',
    opacity: 0.5
  },
  '100%': {
    transform: 'scale(2.4)',
    opacity: 0
  }
});
const antZoomBadgeIn = new Keyframe('antZoomBadgeIn', {
  '0%': {
    transform: 'scale(0) translate(50%, -50%)',
    opacity: 0
  },
  '100%': {
    transform: 'scale(1) translate(50%, -50%)'
  }
});
const antZoomBadgeOut = new Keyframe('antZoomBadgeOut', {
  '0%': {
    transform: 'scale(1) translate(50%, -50%)'
  },
  '100%': {
    transform: 'scale(0) translate(50%, -50%)',
    opacity: 0
  }
});
const antNoWrapperZoomBadgeIn = new Keyframe('antNoWrapperZoomBadgeIn', {
  '0%': {
    transform: 'scale(0)',
    opacity: 0
  },
  '100%': {
    transform: 'scale(1)'
  }
});
const antNoWrapperZoomBadgeOut = new Keyframe('antNoWrapperZoomBadgeOut', {
  '0%': {
    transform: 'scale(1)'
  },
  '100%': {
    transform: 'scale(0)',
    opacity: 0
  }
});
const antBadgeLoadingCircle = new Keyframe('antBadgeLoadingCircle', {
  '0%': {
    transformOrigin: '50%'
  },
  '100%': {
    transform: 'translate(50%, -50%) rotate(360deg)',
    transformOrigin: '50%'
  }
});
const genSharedBadgeStyle = token => {
  const {
    componentCls,
    iconCls,
    antCls,
    badgeFontHeight,
    badgeShadowSize,
    badgeHeightSm,
    motionDurationSlow,
    badgeStatusSize,
    marginXS,
    badgeRibbonOffset
  } = token;
  const numberPrefixCls = `${antCls}-scroll-number`;
  const ribbonPrefixCls = `${antCls}-ribbon`;
  const ribbonWrapperPrefixCls = `${antCls}-ribbon-wrapper`;
  const colorPreset = genPresetColor(token, (colorKey, _ref) => {
    let {
      darkColor
    } = _ref;
    return {
      [`&${componentCls} ${componentCls}-color-${colorKey}`]: {
        background: darkColor,
        [`&:not(${componentCls}-count)`]: {
          color: darkColor
        }
      }
    };
  });
  const statusRibbonPreset = genPresetColor(token, (colorKey, _ref2) => {
    let {
      darkColor
    } = _ref2;
    return {
      [`&${ribbonPrefixCls}-color-${colorKey}`]: {
        background: darkColor,
        color: darkColor
      }
    };
  });
  return {
    [componentCls]: _extends(_extends(_extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      display: 'inline-block',
      width: 'fit-content',
      lineHeight: 1,
      [`${componentCls}-count`]: {
        zIndex: token.badgeZIndex,
        minWidth: token.badgeHeight,
        height: token.badgeHeight,
        color: token.badgeTextColor,
        fontWeight: token.badgeFontWeight,
        fontSize: token.badgeFontSize,
        lineHeight: `${token.badgeHeight}px`,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        background: token.badgeColor,
        borderRadius: token.badgeHeight / 2,
        boxShadow: `0 0 0 ${badgeShadowSize}px ${token.badgeShadowColor}`,
        transition: `background ${token.motionDurationMid}`,
        a: {
          color: token.badgeTextColor
        },
        'a:hover': {
          color: token.badgeTextColor
        },
        'a:hover &': {
          background: token.badgeColorHover
        }
      },
      [`${componentCls}-count-sm`]: {
        minWidth: badgeHeightSm,
        height: badgeHeightSm,
        fontSize: token.badgeFontSizeSm,
        lineHeight: `${badgeHeightSm}px`,
        borderRadius: badgeHeightSm / 2
      },
      [`${componentCls}-multiple-words`]: {
        padding: `0 ${token.paddingXS}px`
      },
      [`${componentCls}-dot`]: {
        zIndex: token.badgeZIndex,
        width: token.badgeDotSize,
        minWidth: token.badgeDotSize,
        height: token.badgeDotSize,
        background: token.badgeColor,
        borderRadius: '100%',
        boxShadow: `0 0 0 ${badgeShadowSize}px ${token.badgeShadowColor}`
      },
      [`${componentCls}-dot${numberPrefixCls}`]: {
        transition: `background ${motionDurationSlow}`
      },
      [`${componentCls}-count, ${componentCls}-dot, ${numberPrefixCls}-custom-component`]: {
        position: 'absolute',
        top: 0,
        insetInlineEnd: 0,
        transform: 'translate(50%, -50%)',
        transformOrigin: '100% 0%',
        [`&${iconCls}-spin`]: {
          animationName: antBadgeLoadingCircle,
          animationDuration: '1s',
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear'
        }
      },
      [`&${componentCls}-status`]: {
        lineHeight: 'inherit',
        verticalAlign: 'baseline',
        [`${componentCls}-status-dot`]: {
          position: 'relative',
          top: -1,
          display: 'inline-block',
          width: badgeStatusSize,
          height: badgeStatusSize,
          verticalAlign: 'middle',
          borderRadius: '50%'
        },
        [`${componentCls}-status-success`]: {
          backgroundColor: token.colorSuccess
        },
        [`${componentCls}-status-processing`]: {
          overflow: 'visible',
          color: token.colorPrimary,
          backgroundColor: token.colorPrimary,
          '&::after': {
            position: 'absolute',
            top: 0,
            insetInlineStart: 0,
            width: '100%',
            height: '100%',
            borderWidth: badgeShadowSize,
            borderStyle: 'solid',
            borderColor: 'inherit',
            borderRadius: '50%',
            animationName: antStatusProcessing,
            animationDuration: token.badgeProcessingDuration,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            content: '""'
          }
        },
        [`${componentCls}-status-default`]: {
          backgroundColor: token.colorTextPlaceholder
        },
        [`${componentCls}-status-error`]: {
          backgroundColor: token.colorError
        },
        [`${componentCls}-status-warning`]: {
          backgroundColor: token.colorWarning
        },
        [`${componentCls}-status-text`]: {
          marginInlineStart: marginXS,
          color: token.colorText,
          fontSize: token.fontSize
        }
      }
    }), colorPreset), {
      [`${componentCls}-zoom-appear, ${componentCls}-zoom-enter`]: {
        animationName: antZoomBadgeIn,
        animationDuration: token.motionDurationSlow,
        animationTimingFunction: token.motionEaseOutBack,
        animationFillMode: 'both'
      },
      [`${componentCls}-zoom-leave`]: {
        animationName: antZoomBadgeOut,
        animationDuration: token.motionDurationSlow,
        animationTimingFunction: token.motionEaseOutBack,
        animationFillMode: 'both'
      },
      [`&${componentCls}-not-a-wrapper`]: {
        [`${componentCls}-zoom-appear, ${componentCls}-zoom-enter`]: {
          animationName: antNoWrapperZoomBadgeIn,
          animationDuration: token.motionDurationSlow,
          animationTimingFunction: token.motionEaseOutBack
        },
        [`${componentCls}-zoom-leave`]: {
          animationName: antNoWrapperZoomBadgeOut,
          animationDuration: token.motionDurationSlow,
          animationTimingFunction: token.motionEaseOutBack
        },
        [`&:not(${componentCls}-status)`]: {
          verticalAlign: 'middle'
        },
        [`${numberPrefixCls}-custom-component, ${componentCls}-count`]: {
          transform: 'none'
        },
        [`${numberPrefixCls}-custom-component, ${numberPrefixCls}`]: {
          position: 'relative',
          top: 'auto',
          display: 'block',
          transformOrigin: '50% 50%'
        }
      },
      [`${numberPrefixCls}`]: {
        overflow: 'hidden',
        [`${numberPrefixCls}-only`]: {
          position: 'relative',
          display: 'inline-block',
          height: token.badgeHeight,
          transition: `all ${token.motionDurationSlow} ${token.motionEaseOutBack}`,
          WebkitTransformStyle: 'preserve-3d',
          WebkitBackfaceVisibility: 'hidden',
          [`> p${numberPrefixCls}-only-unit`]: {
            height: token.badgeHeight,
            margin: 0,
            WebkitTransformStyle: 'preserve-3d',
            WebkitBackfaceVisibility: 'hidden'
          }
        },
        [`${numberPrefixCls}-symbol`]: {
          verticalAlign: 'top'
        }
      },
      // ====================== RTL =======================
      '&-rtl': {
        direction: 'rtl',
        [`${componentCls}-count, ${componentCls}-dot, ${numberPrefixCls}-custom-component`]: {
          transform: 'translate(-50%, -50%)'
        }
      }
    }),
    [`${ribbonWrapperPrefixCls}`]: {
      position: 'relative'
    },
    [`${ribbonPrefixCls}`]: _extends(_extends(_extends(_extends({}, resetComponent(token)), {
      position: 'absolute',
      top: marginXS,
      padding: `0 ${token.paddingXS}px`,
      color: token.colorPrimary,
      lineHeight: `${badgeFontHeight}px`,
      whiteSpace: 'nowrap',
      backgroundColor: token.colorPrimary,
      borderRadius: token.borderRadiusSM,
      [`${ribbonPrefixCls}-text`]: {
        color: token.colorTextLightSolid
      },
      [`${ribbonPrefixCls}-corner`]: {
        position: 'absolute',
        top: '100%',
        width: badgeRibbonOffset,
        height: badgeRibbonOffset,
        color: 'currentcolor',
        border: `${badgeRibbonOffset / 2}px solid`,
        transform: token.badgeRibbonCornerTransform,
        transformOrigin: 'top',
        filter: token.badgeRibbonCornerFilter
      }
    }), statusRibbonPreset), {
      [`&${ribbonPrefixCls}-placement-end`]: {
        insetInlineEnd: -badgeRibbonOffset,
        borderEndEndRadius: 0,
        [`${ribbonPrefixCls}-corner`]: {
          insetInlineEnd: 0,
          borderInlineEndColor: 'transparent',
          borderBlockEndColor: 'transparent'
        }
      },
      [`&${ribbonPrefixCls}-placement-start`]: {
        insetInlineStart: -badgeRibbonOffset,
        borderEndStartRadius: 0,
        [`${ribbonPrefixCls}-corner`]: {
          insetInlineStart: 0,
          borderBlockEndColor: 'transparent',
          borderInlineStartColor: 'transparent'
        }
      },
      // ====================== RTL =======================
      '&-rtl': {
        direction: 'rtl'
      }
    })
  };
};
// ============================== Export ==============================
const useStyle$1 = genComponentStyleHook('Badge', token => {
  const {
    fontSize,
    lineHeight,
    fontSizeSM,
    lineWidth,
    marginXS,
    colorBorderBg
  } = token;
  const badgeFontHeight = Math.round(fontSize * lineHeight);
  const badgeShadowSize = lineWidth;
  const badgeZIndex = 'auto';
  const badgeHeight = badgeFontHeight - 2 * badgeShadowSize;
  const badgeTextColor = token.colorBgContainer;
  const badgeFontWeight = 'normal';
  const badgeFontSize = fontSizeSM;
  const badgeColor = token.colorError;
  const badgeColorHover = token.colorErrorHover;
  const badgeHeightSm = fontSize;
  const badgeDotSize = fontSizeSM / 2;
  const badgeFontSizeSm = fontSizeSM;
  const badgeStatusSize = fontSizeSM / 2;
  const badgeToken = merge(token, {
    badgeFontHeight,
    badgeShadowSize,
    badgeZIndex,
    badgeHeight,
    badgeTextColor,
    badgeFontWeight,
    badgeFontSize,
    badgeColor,
    badgeColorHover,
    badgeShadowColor: colorBorderBg,
    badgeHeightSm,
    badgeDotSize,
    badgeFontSizeSm,
    badgeStatusSize,
    badgeProcessingDuration: '1.2s',
    badgeRibbonOffset: marginXS,
    // Follow token just by Design. Not related with token
    badgeRibbonCornerTransform: 'scaleY(0.75)',
    badgeRibbonCornerFilter: `brightness(75%)`
  });
  return [genSharedBadgeStyle(badgeToken)];
});

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const ribbonProps = () => ({
  prefix: String,
  color: {
    type: String
  },
  text: PropTypes.any,
  placement: {
    type: String,
    default: 'end'
  }
});
const Ribbon = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ABadgeRibbon',
  inheritAttrs: false,
  props: ribbonProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('ribbon', props);
    const [wrapSSR, hashId] = useStyle$1(prefixCls);
    const colorInPreset = computed(() => isPresetColor(props.color, false));
    const ribbonCls = computed(() => [prefixCls.value, `${prefixCls.value}-placement-${props.placement}`, {
      [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
      [`${prefixCls.value}-color-${props.color}`]: colorInPreset.value
    }]);
    return () => {
      var _a, _b;
      const {
          class: className,
          style
        } = attrs,
        restAttrs = __rest(attrs, ["class", "style"]);
      const colorStyle = {};
      const cornerColorStyle = {};
      if (props.color && !colorInPreset.value) {
        colorStyle.background = props.color;
        cornerColorStyle.color = props.color;
      }
      return wrapSSR(createVNode("div", _objectSpread$1({
        "class": `${prefixCls.value}-wrapper ${hashId.value}`
      }, restAttrs), [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots), createVNode("div", {
        "class": [ribbonCls.value, className, hashId.value],
        "style": _extends(_extends({}, colorStyle), style)
      }, [createVNode("span", {
        "class": `${prefixCls.value}-text`
      }, [props.text || ((_b = slots.text) === null || _b === void 0 ? void 0 : _b.call(slots))]), createVNode("div", {
        "class": `${prefixCls.value}-corner`,
        "style": cornerColorStyle
      }, null)])]));
    };
  }
});

const isNumeric = value => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const badgeProps = () => ({
  /** Number to show in badge */
  count: PropTypes.any.def(null),
  showZero: {
    type: Boolean,
    default: undefined
  },
  /** Max count to show */
  overflowCount: {
    type: Number,
    default: 99
  },
  /** whether to show red dot without number */
  dot: {
    type: Boolean,
    default: undefined
  },
  prefixCls: String,
  scrollNumberPrefixCls: String,
  status: {
    type: String
  },
  size: {
    type: String,
    default: 'default'
  },
  color: String,
  text: PropTypes.any,
  offset: Array,
  numberStyle: {
    type: Object,
    default: undefined
  },
  title: String
});
const Badge = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ABadge',
  Ribbon,
  inheritAttrs: false,
  props: badgeProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('badge', props);
    const [wrapSSR, hashId] = useStyle$1(prefixCls);
    // ================================ Misc ================================
    const numberedDisplayCount = computed(() => {
      return props.count > props.overflowCount ? `${props.overflowCount}+` : props.count;
    });
    const isZero = computed(() => numberedDisplayCount.value === '0' || numberedDisplayCount.value === 0);
    const ignoreCount = computed(() => props.count === null || isZero.value && !props.showZero);
    const hasStatus = computed(() => (props.status !== null && props.status !== undefined || props.color !== null && props.color !== undefined) && ignoreCount.value);
    const showAsDot = computed(() => props.dot && !isZero.value);
    const mergedCount = computed(() => showAsDot.value ? '' : numberedDisplayCount.value);
    const isHidden = computed(() => {
      const isEmpty = mergedCount.value === null || mergedCount.value === undefined || mergedCount.value === '';
      return (isEmpty || isZero.value && !props.showZero) && !showAsDot.value;
    });
    // Count should be cache in case hidden change it
    const livingCount = ref(props.count);
    // We need cache count since remove motion should not change count display
    const displayCount = ref(mergedCount.value);
    // We will cache the dot status to avoid shaking on leaved motion
    const isDotRef = ref(showAsDot.value);
    watch([() => props.count, mergedCount, showAsDot], () => {
      if (!isHidden.value) {
        livingCount.value = props.count;
        displayCount.value = mergedCount.value;
        isDotRef.value = showAsDot.value;
      }
    }, {
      immediate: true
    });
    // InternalColor
    const isInternalColor = computed(() => isPresetColor(props.color, false));
    // Shared styles
    const statusCls = computed(() => ({
      [`${prefixCls.value}-status-dot`]: hasStatus.value,
      [`${prefixCls.value}-status-${props.status}`]: !!props.status,
      [`${prefixCls.value}-color-${props.color}`]: isInternalColor.value
    }));
    const statusStyle = computed(() => {
      if (props.color && !isInternalColor.value) {
        return {
          background: props.color,
          color: props.color
        };
      } else {
        return {};
      }
    });
    const scrollNumberCls = computed(() => ({
      [`${prefixCls.value}-dot`]: isDotRef.value,
      [`${prefixCls.value}-count`]: !isDotRef.value,
      [`${prefixCls.value}-count-sm`]: props.size === 'small',
      [`${prefixCls.value}-multiple-words`]: !isDotRef.value && displayCount.value && displayCount.value.toString().length > 1,
      [`${prefixCls.value}-status-${props.status}`]: !!props.status,
      [`${prefixCls.value}-color-${props.color}`]: isInternalColor.value
    }));
    return () => {
      var _a, _b;
      const {
        offset,
        title,
        color
      } = props;
      const style = attrs.style;
      const text = getPropsSlot(slots, props, 'text');
      const pre = prefixCls.value;
      const count = livingCount.value;
      let children = flattenChildren((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots));
      children = children.length ? children : null;
      const visible = !!(!isHidden.value || slots.count);
      // =============================== Styles ===============================
      const mergedStyle = (() => {
        if (!offset) {
          return _extends({}, style);
        }
        const offsetStyle = {
          marginTop: isNumeric(offset[1]) ? `${offset[1]}px` : offset[1]
        };
        if (direction.value === 'rtl') {
          offsetStyle.left = `${parseInt(offset[0], 10)}px`;
        } else {
          offsetStyle.right = `${-parseInt(offset[0], 10)}px`;
        }
        return _extends(_extends({}, offsetStyle), style);
      })();
      // =============================== Render ===============================
      // >>> Title
      const titleNode = title !== null && title !== void 0 ? title : typeof count === 'string' || typeof count === 'number' ? count : undefined;
      // >>> Status Text
      const statusTextNode = visible || !text ? null : createVNode("span", {
        "class": `${pre}-status-text`
      }, [text]);
      // >>> Display Component
      const displayNode = typeof count === 'object' || count === undefined && slots.count ? cloneElement(count !== null && count !== void 0 ? count : (_b = slots.count) === null || _b === void 0 ? void 0 : _b.call(slots), {
        style: mergedStyle
      }, false) : null;
      const badgeClassName = classNames(pre, {
        [`${pre}-status`]: hasStatus.value,
        [`${pre}-not-a-wrapper`]: !children,
        [`${pre}-rtl`]: direction.value === 'rtl'
      }, attrs.class, hashId.value);
      // <Badge status="success" />
      if (!children && hasStatus.value) {
        const statusTextColor = mergedStyle.color;
        return wrapSSR(createVNode("span", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
          "class": badgeClassName,
          "style": mergedStyle
        }), [createVNode("span", {
          "class": statusCls.value,
          "style": statusStyle.value
        }, null), createVNode("span", {
          "style": {
            color: statusTextColor
          },
          "class": `${pre}-status-text`
        }, [text])]));
      }
      const transitionProps = getTransitionProps(children ? `${pre}-zoom` : '', {
        appear: false
      });
      let scrollNumberStyle = _extends(_extends({}, mergedStyle), props.numberStyle);
      if (color && !isInternalColor.value) {
        scrollNumberStyle = scrollNumberStyle || {};
        scrollNumberStyle.background = color;
      }
      return wrapSSR(createVNode("span", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
        "class": badgeClassName
      }), [children, createVNode(Transition, transitionProps, {
        default: () => [withDirectives(createVNode(ScrollNumber, {
          "prefixCls": props.scrollNumberPrefixCls,
          "show": visible,
          "class": scrollNumberCls.value,
          "count": displayCount.value,
          "title": titleNode,
          "style": scrollNumberStyle,
          "key": "scrollNumber"
        }, {
          default: () => [displayNode]
        }), [[vShow, visible]])]
      }), statusTextNode]));
    };
  }
});

Badge.install = function (app) {
  app.component(Badge.name, Badge);
  app.component(Ribbon.name, Ribbon);
  return app;
};

const genLayoutLightStyle = token => {
  const {
    componentCls,
    colorBgContainer,
    colorBgBody,
    colorText
  } = token;
  return {
    [`${componentCls}-sider-light`]: {
      background: colorBgContainer,
      [`${componentCls}-sider-trigger`]: {
        color: colorText,
        background: colorBgContainer
      },
      [`${componentCls}-sider-zero-width-trigger`]: {
        color: colorText,
        background: colorBgContainer,
        border: `1px solid ${colorBgBody}`,
        borderInlineStart: 0
      }
    }
  };
};

const genLayoutStyle = token => {
  const {
    antCls,
    // .ant
    componentCls,
    // .ant-layout
    colorText,
    colorTextLightSolid,
    colorBgHeader,
    colorBgBody,
    colorBgTrigger,
    layoutHeaderHeight,
    layoutHeaderPaddingInline,
    layoutHeaderColor,
    layoutFooterPadding,
    layoutTriggerHeight,
    layoutZeroTriggerSize,
    motionDurationMid,
    motionDurationSlow,
    fontSize,
    borderRadius
  } = token;
  return {
    [componentCls]: _extends(_extends({
      display: 'flex',
      flex: 'auto',
      flexDirection: 'column',
      color: colorText,
      /* fix firefox can't set height smaller than content on flex item */
      minHeight: 0,
      background: colorBgBody,
      '&, *': {
        boxSizing: 'border-box'
      },
      [`&${componentCls}-has-sider`]: {
        flexDirection: 'row',
        [`> ${componentCls}, > ${componentCls}-content`]: {
          // https://segmentfault.com/a/1190000019498300
          width: 0
        }
      },
      [`${componentCls}-header, &${componentCls}-footer`]: {
        flex: '0 0 auto'
      },
      [`${componentCls}-header`]: {
        height: layoutHeaderHeight,
        paddingInline: layoutHeaderPaddingInline,
        color: layoutHeaderColor,
        lineHeight: `${layoutHeaderHeight}px`,
        background: colorBgHeader,
        // Other components/menu/style/index.less line:686
        // Integration with header element so menu items have the same height
        [`${antCls}-menu`]: {
          lineHeight: 'inherit'
        }
      },
      [`${componentCls}-footer`]: {
        padding: layoutFooterPadding,
        color: colorText,
        fontSize,
        background: colorBgBody
      },
      [`${componentCls}-content`]: {
        flex: 'auto',
        // fix firefox can't set height smaller than content on flex item
        minHeight: 0
      },
      [`${componentCls}-sider`]: {
        position: 'relative',
        // fix firefox can't set width smaller than content on flex item
        minWidth: 0,
        background: colorBgHeader,
        transition: `all ${motionDurationMid}, background 0s`,
        '&-children': {
          height: '100%',
          // Hack for fixing margin collapse bug
          // https://github.com/ant-design/ant-design/issues/7967
          // solution from https://stackoverflow.com/a/33132624/3040605
          marginTop: -0.1,
          paddingTop: 0.1,
          [`${antCls}-menu${antCls}-menu-inline-collapsed`]: {
            width: 'auto'
          }
        },
        '&-has-trigger': {
          paddingBottom: layoutTriggerHeight
        },
        '&-right': {
          order: 1
        },
        '&-trigger': {
          position: 'fixed',
          bottom: 0,
          zIndex: 1,
          height: layoutTriggerHeight,
          color: colorTextLightSolid,
          lineHeight: `${layoutTriggerHeight}px`,
          textAlign: 'center',
          background: colorBgTrigger,
          cursor: 'pointer',
          transition: `all ${motionDurationMid}`
        },
        '&-zero-width': {
          '> *': {
            overflow: 'hidden'
          },
          '&-trigger': {
            position: 'absolute',
            top: layoutHeaderHeight,
            insetInlineEnd: -layoutZeroTriggerSize,
            zIndex: 1,
            width: layoutZeroTriggerSize,
            height: layoutZeroTriggerSize,
            color: colorTextLightSolid,
            fontSize: token.fontSizeXL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colorBgHeader,
            borderStartStartRadius: 0,
            borderStartEndRadius: borderRadius,
            borderEndEndRadius: borderRadius,
            borderEndStartRadius: 0,
            cursor: 'pointer',
            transition: `background ${motionDurationSlow} ease`,
            '&::after': {
              position: 'absolute',
              inset: 0,
              background: 'transparent',
              transition: `all ${motionDurationSlow}`,
              content: '""'
            },
            '&:hover::after': {
              // FIXME: Hardcode, but seems no need to create a token for this
              background: `rgba(255, 255, 255, 0.2)`
            },
            '&-right': {
              insetInlineStart: -layoutZeroTriggerSize,
              borderStartStartRadius: borderRadius,
              borderStartEndRadius: 0,
              borderEndEndRadius: 0,
              borderEndStartRadius: borderRadius
            }
          }
        }
      }
    }, genLayoutLightStyle(token)), {
      // RTL
      '&-rtl': {
        direction: 'rtl'
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Layout', token => {
  const {
    colorText,
    controlHeightSM,
    controlHeight,
    controlHeightLG,
    marginXXS
  } = token;
  const layoutHeaderPaddingInline = controlHeightLG * 1.25;
  const layoutToken = merge(token, {
    // Layout
    layoutHeaderHeight: controlHeight * 2,
    layoutHeaderPaddingInline,
    layoutHeaderColor: colorText,
    layoutFooterPadding: `${controlHeightSM}px ${layoutHeaderPaddingInline}px`,
    layoutTriggerHeight: controlHeightLG + marginXXS * 2,
    layoutZeroTriggerSize: controlHeightLG
  });
  return [genLayoutStyle(layoutToken)];
}, token => {
  const {
    colorBgLayout
  } = token;
  return {
    colorBgHeader: '#001529',
    colorBgBody: colorBgLayout,
    colorBgTrigger: '#002140'
  };
});

const basicProps = () => ({
  prefixCls: String,
  hasSider: {
    type: Boolean,
    default: undefined
  },
  tagName: String
});
function generator(_ref) {
  let {
    suffixCls,
    tagName,
    name
  } = _ref;
  return BasicComponent => {
    const Adapter = defineComponent({
      compatConfig: {
        MODE: 3
      },
      name,
      props: basicProps(),
      setup(props, _ref2) {
        let {
          slots
        } = _ref2;
        const {
          prefixCls
        } = useConfigInject(suffixCls, props);
        return () => {
          const basicComponentProps = _extends(_extends({}, props), {
            prefixCls: prefixCls.value,
            tagName
          });
          return createVNode(BasicComponent, basicComponentProps, slots);
        };
      }
    });
    return Adapter;
  };
}
const Basic = defineComponent({
  compatConfig: {
    MODE: 3
  },
  props: basicProps(),
  setup(props, _ref3) {
    let {
      slots
    } = _ref3;
    return () => createVNode(props.tagName, {
      class: props.prefixCls
    }, slots);
  }
});
const BasicLayout = defineComponent({
  compatConfig: {
    MODE: 3
  },
  inheritAttrs: false,
  props: basicProps(),
  setup(props, _ref4) {
    let {
      slots,
      attrs
    } = _ref4;
    const {
      prefixCls,
      direction
    } = useConfigInject('', props);
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const siders = ref([]);
    const siderHookProvider = {
      addSider: id => {
        siders.value = [...siders.value, id];
      },
      removeSider: id => {
        siders.value = siders.value.filter(currentId => currentId !== id);
      }
    };
    provide(SiderHookProviderKey, siderHookProvider);
    const divCls = computed(() => {
      const {
        prefixCls,
        hasSider
      } = props;
      return {
        [hashId.value]: true,
        [`${prefixCls}`]: true,
        [`${prefixCls}-has-sider`]: typeof hasSider === 'boolean' ? hasSider : siders.value.length > 0,
        [`${prefixCls}-rtl`]: direction.value === 'rtl'
      };
    });
    return () => {
      const {
        tagName
      } = props;
      return wrapSSR(createVNode(tagName, _extends(_extends({}, attrs), {
        class: [divCls.value, attrs.class]
      }), slots));
    };
  }
});
const Layout$1 = generator({
  suffixCls: 'layout',
  tagName: 'section',
  name: 'ALayout'
})(BasicLayout);
const Header = generator({
  suffixCls: 'layout-header',
  tagName: 'header',
  name: 'ALayoutHeader'
})(Basic);
const Footer = generator({
  suffixCls: 'layout-footer',
  tagName: 'footer',
  name: 'ALayoutFooter'
})(Basic);
const Content = generator({
  suffixCls: 'layout-content',
  tagName: 'main',
  name: 'ALayoutContent'
})(Basic);

// This icon file is generated automatically.
var BarsOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M912 192H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM104 228a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0z" } }] }, "name": "bars", "theme": "outlined" };

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var BarsOutlined = function BarsOutlined(props, context) {
  var p = _objectSpread({}, props, context.attrs);

  return createVNode(Icon, _objectSpread({}, p, {
    "icon": BarsOutlined$1
  }), null);
};

BarsOutlined.displayName = 'BarsOutlined';
BarsOutlined.inheritAttrs = false;

const siderProps = () => ({
  prefixCls: String,
  collapsible: {
    type: Boolean,
    default: undefined
  },
  collapsed: {
    type: Boolean,
    default: undefined
  },
  defaultCollapsed: {
    type: Boolean,
    default: undefined
  },
  reverseArrow: {
    type: Boolean,
    default: undefined
  },
  zeroWidthTriggerStyle: {
    type: Object,
    default: undefined
  },
  trigger: PropTypes.any,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  collapsedWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  breakpoint: PropTypes.oneOf(tuple('xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl')),
  theme: PropTypes.oneOf(tuple('light', 'dark')).def('dark'),
  onBreakpoint: Function,
  onCollapse: Function
});
const generateId = (() => {
  let i = 0;
  return function () {
    let prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    i += 1;
    return `${prefix}${i}`;
  };
})();
const Sider = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ALayoutSider',
  inheritAttrs: false,
  props: initDefaultProps(siderProps(), {
    collapsible: false,
    defaultCollapsed: false,
    reverseArrow: false,
    width: 200,
    collapsedWidth: 80
  }),
  emits: ['breakpoint', 'update:collapsed', 'collapse'],
  setup(props, _ref) {
    let {
      emit,
      attrs,
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('layout-sider', props);
    const siderHook = inject(SiderHookProviderKey, undefined);
    const collapsed = shallowRef(!!(props.collapsed !== undefined ? props.collapsed : props.defaultCollapsed));
    const below = shallowRef(false);
    watch(() => props.collapsed, () => {
      collapsed.value = !!props.collapsed;
    });
    provide(SiderCollapsedKey, collapsed);
    const handleSetCollapsed = (value, type) => {
      if (props.collapsed === undefined) {
        collapsed.value = value;
      }
      emit('update:collapsed', value);
      emit('collapse', value, type);
    };
    // ========================= Responsive =========================
    const responsiveHandlerRef = shallowRef(mql => {
      below.value = mql.matches;
      emit('breakpoint', mql.matches);
      if (collapsed.value !== mql.matches) {
        handleSetCollapsed(mql.matches, 'responsive');
      }
    });
    let mql;
    function responsiveHandler(mql) {
      return responsiveHandlerRef.value(mql);
    }
    const uniqueId = generateId('ant-sider-');
    siderHook && siderHook.addSider(uniqueId);
    onMounted(() => {
      watch(() => props.breakpoint, () => {
        try {
          mql === null || mql === void 0 ? void 0 : mql.removeEventListener('change', responsiveHandler);
        } catch (error) {
        }
      }, {
        immediate: true
      });
    });
    onBeforeUnmount(() => {
      try {
        mql === null || mql === void 0 ? void 0 : mql.removeEventListener('change', responsiveHandler);
      } catch (error) {
      }
      siderHook && siderHook.removeSider(uniqueId);
    });
    const toggle = () => {
      handleSetCollapsed(!collapsed.value, 'clickTrigger');
    };
    return () => {
      var _a, _b;
      const pre = prefixCls.value;
      const {
        collapsedWidth,
        width,
        reverseArrow,
        zeroWidthTriggerStyle,
        trigger = (_a = slots.trigger) === null || _a === void 0 ? void 0 : _a.call(slots),
        collapsible,
        theme
      } = props;
      const rawWidth = collapsed.value ? collapsedWidth : width;
      // use "px" as fallback unit for width
      const siderWidth = isNumeric(rawWidth) ? `${rawWidth}px` : String(rawWidth);
      // special trigger when collapsedWidth == 0
      const zeroWidthTrigger = parseFloat(String(collapsedWidth || 0)) === 0 ? createVNode("span", {
        "onClick": toggle,
        "class": classNames(`${pre}-zero-width-trigger`, `${pre}-zero-width-trigger-${reverseArrow ? 'right' : 'left'}`),
        "style": zeroWidthTriggerStyle
      }, [trigger || createVNode(BarsOutlined, null, null)]) : null;
      const iconObj = {
        expanded: reverseArrow ? createVNode(RightOutlined, null, null) : createVNode(LeftOutlined, null, null),
        collapsed: reverseArrow ? createVNode(LeftOutlined, null, null) : createVNode(RightOutlined, null, null)
      };
      const status = collapsed.value ? 'collapsed' : 'expanded';
      const defaultTrigger = iconObj[status];
      const triggerDom = trigger !== null ? zeroWidthTrigger || createVNode("div", {
        "class": `${pre}-trigger`,
        "onClick": toggle,
        "style": {
          width: siderWidth
        }
      }, [trigger || defaultTrigger]) : null;
      const divStyle = [attrs.style, {
        flex: `0 0 ${siderWidth}`,
        maxWidth: siderWidth,
        minWidth: siderWidth,
        width: siderWidth
      }];
      const siderCls = classNames(pre, `${pre}-${theme}`, {
        [`${pre}-collapsed`]: !!collapsed.value,
        [`${pre}-has-trigger`]: collapsible && trigger !== null && !zeroWidthTrigger,
        [`${pre}-below`]: !!below.value,
        [`${pre}-zero-width`]: parseFloat(siderWidth) === 0
      }, attrs.class);
      return createVNode("aside", _objectSpread$1(_objectSpread$1({}, attrs), {}, {
        "class": siderCls,
        "style": divStyle
      }), [createVNode("div", {
        "class": `${pre}-children`
      }, [(_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots)]), collapsible || below.value && zeroWidthTrigger ? triggerDom : null]);
    };
  }
});

/* istanbul ignore next */
const LayoutHeader = Header;
const LayoutSider = Sider;
const LayoutContent = Content;
const Layout = _extends(Layout$1, {
  Header,
  Footer,
  Content,
  Sider,
  install: app => {
    app.component(Layout$1.name, Layout$1);
    app.component(Header.name, Header);
    app.component(Footer.name, Footer);
    app.component(Sider.name, Sider);
    app.component(Content.name, Content);
    return app;
  }
});

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const ROLE_MENUS = {
      ceo: [
        { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" },
        { key: "/approval", label: "\u5BA1\u6279\u4E2D\u5FC3", path: "/approval" },
        { key: "/employees", label: "\u5458\u5DE5\u7BA1\u7406", path: "/employees" },
        { key: "/projects", label: "\u9879\u76EE\u7BA1\u7406", path: "/projects" },
        { key: "/payroll", label: "\u85AA\u8D44\u7BA1\u7406", path: "/payroll" },
        { key: "/retention", label: "\u6570\u636E\u4FDD\u7559", path: "/retention" },
        { key: "/settings", label: "\u7CFB\u7EDF\u8BBE\u7F6E", path: "/settings" }
      ],
      finance: [
        { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" },
        { key: "/approval", label: "\u5BA1\u6279\u4E2D\u5FC3", path: "/approval" },
        { key: "/employees", label: "\u5458\u5DE5\u7BA1\u7406", path: "/employees" },
        { key: "/payroll", label: "\u85AA\u8D44\u7BA1\u7406", path: "/payroll" },
        { key: "/directory", label: "\u901A\u8BAF\u5F55\u5BFC\u5165", path: "/directory" }
      ],
      project_manager: [
        { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" },
        { key: "/approval", label: "\u5BA1\u6279\u4E2D\u5FC3", path: "/approval" },
        { key: "/projects", label: "\u9879\u76EE\u7BA1\u7406", path: "/projects" },
        { key: "/forms", label: "\u8868\u5355\u4E2D\u5FC3", path: "/forms" }
      ],
      worker: [
        { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" },
        { key: "/forms", label: "\u8868\u5355\u4E2D\u5FC3", path: "/forms" },
        { key: "/payroll", label: "\u5DE5\u8D44\u6761", path: "/payroll/slips" }
      ],
      employee: [
        { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" },
        { key: "/forms", label: "\u8868\u5355\u4E2D\u5FC3", path: "/forms" },
        { key: "/payroll", label: "\u5DE5\u8D44\u6761", path: "/payroll/slips" }
      ]
    };
    const DEFAULT_MENUS = [
      { key: "/", label: "\u5DE5\u4F5C\u53F0", path: "/" }
    ];
    const userStore = useUserStore();
    const route = useRoute();
    const collapsed = ref(false);
    const selectedKeys = ref([route.path]);
    const notificationCount = ref(0);
    const todoCount = ref(0);
    const apiMenus = ref(null);
    const menuItems = computed(() => {
      var _a, _b, _c;
      if (apiMenus.value) return apiMenus.value;
      const role = (_b = (_a = userStore.userInfo) == null ? void 0 : _a.role) != null ? _b : "employee";
      return (_c = ROLE_MENUS[role]) != null ? _c : DEFAULT_MENUS;
    });
    watch(() => route.path, (path) => {
      selectedKeys.value = [path];
    });
    function onMenuClick({ key }) {
      navigateTo(key);
    }
    async function onAvatarMenuClick({ key }) {
      if (key === "logout") {
        userStore.logout();
        await navigateTo("/login");
      } else if (key === "profile") {
        await navigateTo("/me");
      } else if (key === "password") {
        await navigateTo("/me/password");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_config_provider = ConfigProvider;
      const _component_a_layout = Layout;
      const _component_a_layout_sider = LayoutSider;
      const _component_a_menu = Menu;
      const _component_a_sub_menu = SubMenu;
      const _component_a_menu_item = MenuItem;
      const _component_a_layout_header = LayoutHeader;
      const _component_a_button = Button;
      const _component_a_badge = Badge;
      const _component_a_dropdown = Dropdown;
      const _component_a_avatar = Avatar;
      const _component_a_menu_divider = MenuDivider;
      const _component_a_layout_content = LayoutContent;
      _push(ssrRenderComponent(_component_a_config_provider, mergeProps({ "auto-insert-space-in-button": false }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_layout, { class: "app-shell" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_layout_sider, {
                    collapsed: collapsed.value,
                    "onUpdate:collapsed": ($event) => collapsed.value = $event,
                    collapsible: "",
                    width: "220",
                    theme: "dark"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<div class="logo" data-v-a7cf49d1${_scopeId3}>`);
                        if (!collapsed.value) {
                          _push4(`<span class="logo-text" data-v-a7cf49d1${_scopeId3}>\u4F17\u7EF4OA\u5DE5\u4F5C\u53F0</span>`);
                        } else {
                          _push4(`<span class="logo-icon" data-v-a7cf49d1${_scopeId3}>OA</span>`);
                        }
                        _push4(`</div>`);
                        _push4(ssrRenderComponent(_component_a_menu, {
                          selectedKeys: selectedKeys.value,
                          "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                          theme: "dark",
                          mode: "inline",
                          onClick: onMenuClick
                        }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`<!--[-->`);
                              ssrRenderList(menuItems.value, (item) => {
                                var _a;
                                _push5(`<!--[-->`);
                                if ((_a = item.children) == null ? void 0 : _a.length) {
                                  _push5(ssrRenderComponent(_component_a_sub_menu, {
                                    key: item.key
                                  }, {
                                    title: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`${ssrInterpolate(item.label)}`);
                                      } else {
                                        return [
                                          createTextVNode(toDisplayString(item.label), 1)
                                        ];
                                      }
                                    }),
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`<!--[-->`);
                                        ssrRenderList(item.children, (child) => {
                                          _push6(ssrRenderComponent(_component_a_menu_item, {
                                            key: child.path
                                          }, {
                                            default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                              if (_push7) {
                                                _push7(`${ssrInterpolate(child.label)}`);
                                              } else {
                                                return [
                                                  createTextVNode(toDisplayString(child.label), 1)
                                                ];
                                              }
                                            }),
                                            _: 2
                                          }, _parent6, _scopeId5));
                                        });
                                        _push6(`<!--]-->`);
                                      } else {
                                        return [
                                          (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                            return openBlock(), createBlock(_component_a_menu_item, {
                                              key: child.path
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(child.label), 1)
                                              ]),
                                              _: 2
                                            }, 1024);
                                          }), 128))
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                } else {
                                  _push5(ssrRenderComponent(_component_a_menu_item, {
                                    key: item.path
                                  }, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`${ssrInterpolate(item.label)}`);
                                      } else {
                                        return [
                                          createTextVNode(toDisplayString(item.label), 1)
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                }
                                _push5(`<!--]-->`);
                              });
                              _push5(`<!--]-->`);
                            } else {
                              return [
                                (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                                  var _a;
                                  return openBlock(), createBlock(Fragment, {
                                    key: item.key
                                  }, [
                                    ((_a = item.children) == null ? void 0 : _a.length) ? (openBlock(), createBlock(_component_a_sub_menu, {
                                      key: item.key
                                    }, {
                                      title: withCtx(() => [
                                        createTextVNode(toDisplayString(item.label), 1)
                                      ]),
                                      default: withCtx(() => [
                                        (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                          return openBlock(), createBlock(_component_a_menu_item, {
                                            key: child.path
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode(toDisplayString(child.label), 1)
                                            ]),
                                            _: 2
                                          }, 1024);
                                        }), 128))
                                      ]),
                                      _: 2
                                    }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                      key: item.path
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(item.label), 1)
                                      ]),
                                      _: 2
                                    }, 1024))
                                  ], 64);
                                }), 128))
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode("div", { class: "logo" }, [
                            !collapsed.value ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "logo-text"
                            }, "\u4F17\u7EF4OA\u5DE5\u4F5C\u53F0")) : (openBlock(), createBlock("span", {
                              key: 1,
                              class: "logo-icon"
                            }, "OA"))
                          ]),
                          createVNode(_component_a_menu, {
                            selectedKeys: selectedKeys.value,
                            "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                            theme: "dark",
                            mode: "inline",
                            onClick: onMenuClick
                          }, {
                            default: withCtx(() => [
                              (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                                var _a;
                                return openBlock(), createBlock(Fragment, {
                                  key: item.key
                                }, [
                                  ((_a = item.children) == null ? void 0 : _a.length) ? (openBlock(), createBlock(_component_a_sub_menu, {
                                    key: item.key
                                  }, {
                                    title: withCtx(() => [
                                      createTextVNode(toDisplayString(item.label), 1)
                                    ]),
                                    default: withCtx(() => [
                                      (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                        return openBlock(), createBlock(_component_a_menu_item, {
                                          key: child.path
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(child.label), 1)
                                          ]),
                                          _: 2
                                        }, 1024);
                                      }), 128))
                                    ]),
                                    _: 2
                                  }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                    key: item.path
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(item.label), 1)
                                    ]),
                                    _: 2
                                  }, 1024))
                                ], 64);
                              }), 128))
                            ]),
                            _: 1
                          }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_layout, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_layout_header, { class: "app-header" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            var _a, _b, _c, _d;
                            if (_push5) {
                              _push5(`<div class="header-brand" data-v-a7cf49d1${_scopeId4}> \u535A\u6E0A OA `);
                              if (unref(userStore).userInfo) {
                                _push5(`<span class="header-user-label" data-v-a7cf49d1${_scopeId4}> \xB7 ${ssrInterpolate((_a = unref(userStore).userInfo.roleName) != null ? _a : unref(userStore).userInfo.role)} ${ssrInterpolate(unref(userStore).userInfo.displayName)}</span>`);
                              } else {
                                _push5(`<!---->`);
                              }
                              _push5(`</div><div class="header-actions" data-v-a7cf49d1${_scopeId4}>`);
                              if (((_b = unref(userStore).userInfo) == null ? void 0 : _b.role) === "ceo") {
                                _push5(ssrRenderComponent(_component_a_button, {
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(` \u2699 \u7CFB\u7EDF `);
                                    } else {
                                      return [
                                        createTextVNode(" \u2699 \u7CFB\u7EDF ")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                _push5(`<!---->`);
                              }
                              _push5(ssrRenderComponent(_component_a_badge, {
                                count: notificationCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(` \u{1F514} \u901A\u77E5 `);
                                        } else {
                                          return [
                                            createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(ssrRenderComponent(_component_a_badge, {
                                count: todoCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(` \u{1F4CB} \u5F85\u529E `);
                                        } else {
                                          return [
                                            createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(ssrRenderComponent(_component_a_dropdown, { placement: "bottomRight" }, {
                                overlay: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`\u4E2A\u4EBA\u4FE1\u606F`);
                                              } else {
                                                return [
                                                  createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`\u4FEE\u6539\u5BC6\u7801`);
                                              } else {
                                                return [
                                                  createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_divider, null, null, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`\u9000\u51FA\u767B\u5F55`);
                                              } else {
                                                return [
                                                  createTextVNode("\u9000\u51FA\u767B\u5F55")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                        } else {
                                          return [
                                            createVNode(_component_a_menu_item, { key: "profile" }, {
                                              default: withCtx(() => [
                                                createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                              ]),
                                              _: 1
                                            }),
                                            createVNode(_component_a_menu_item, { key: "password" }, {
                                              default: withCtx(() => [
                                                createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                              ]),
                                              _: 1
                                            }),
                                            createVNode(_component_a_menu_divider),
                                            createVNode(_component_a_menu_item, { key: "logout" }, {
                                              default: withCtx(() => [
                                                createTextVNode("\u9000\u51FA\u767B\u5F55")
                                              ]),
                                              _: 1
                                            })
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_divider),
                                          createVNode(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u9000\u51FA\u767B\u5F55")
                                            ]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      })
                                    ];
                                  }
                                }),
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "avatar-btn"
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(ssrRenderComponent(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              var _a2, _b2, _c2, _d2, _e, _f;
                                              if (_push8) {
                                                _push8(`${ssrInterpolate((_c2 = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c2 : "?")}`);
                                              } else {
                                                return [
                                                  createTextVNode(toDisplayString((_f = (_e = (_d2 = unref(userStore).userInfo) == null ? void 0 : _d2.displayName) == null ? void 0 : _e.slice(0, 1)) != null ? _f : "?"), 1)
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(` \u25BC `);
                                        } else {
                                          return [
                                            createVNode(_component_a_avatar, {
                                              size: "small",
                                              style: { backgroundColor: "#003466" }
                                            }, {
                                              default: withCtx(() => {
                                                var _a2, _b2, _c2;
                                                return [
                                                  createTextVNode(toDisplayString((_c2 = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c2 : "?"), 1)
                                                ];
                                              }),
                                              _: 1
                                            }),
                                            createTextVNode(" \u25BC ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "avatar-btn"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx(() => {
                                              var _a2, _b2, _c2;
                                              return [
                                                createTextVNode(toDisplayString((_c2 = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c2 : "?"), 1)
                                              ];
                                            }),
                                            _: 1
                                          }),
                                          createTextVNode(" \u25BC ")
                                        ]),
                                        _: 1
                                      })
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(`</div>`);
                            } else {
                              return [
                                createVNode("div", { class: "header-brand" }, [
                                  createTextVNode(" \u535A\u6E0A OA "),
                                  unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "header-user-label"
                                  }, " \xB7 " + toDisplayString((_c = unref(userStore).userInfo.roleName) != null ? _c : unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                                ]),
                                createVNode("div", { class: "header-actions" }, [
                                  ((_d = unref(userStore).userInfo) == null ? void 0 : _d.role) === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                    key: 0,
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" \u2699 \u7CFB\u7EDF ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])) : createCommentVNode("", true),
                                  createVNode(_component_a_badge, {
                                    count: notificationCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_badge, {
                                    count: todoCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                    overlay: withCtx(() => [
                                      createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_divider),
                                          createVNode(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u9000\u51FA\u767B\u5F55")
                                            ]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "avatar-btn"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx(() => {
                                              var _a2, _b2, _c2;
                                              return [
                                                createTextVNode(toDisplayString((_c2 = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c2 : "?"), 1)
                                              ];
                                            }),
                                            _: 1
                                          }),
                                          createTextVNode(" \u25BC ")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ])
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_a_layout_content, { class: "app-content" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              ssrRenderSlot(_ctx.$slots, "default", {}, null, _push5, _parent5, _scopeId4);
                            } else {
                              return [
                                renderSlot(_ctx.$slots, "default", {}, void 0, true)
                              ];
                            }
                          }),
                          _: 3
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_layout_header, { class: "app-header" }, {
                            default: withCtx(() => {
                              var _a, _b;
                              return [
                                createVNode("div", { class: "header-brand" }, [
                                  createTextVNode(" \u535A\u6E0A OA "),
                                  unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "header-user-label"
                                  }, " \xB7 " + toDisplayString((_a = unref(userStore).userInfo.roleName) != null ? _a : unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                                ]),
                                createVNode("div", { class: "header-actions" }, [
                                  ((_b = unref(userStore).userInfo) == null ? void 0 : _b.role) === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                    key: 0,
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" \u2699 \u7CFB\u7EDF ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])) : createCommentVNode("", true),
                                  createVNode(_component_a_badge, {
                                    count: notificationCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_badge, {
                                    count: todoCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                    overlay: withCtx(() => [
                                      createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_divider),
                                          createVNode(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u9000\u51FA\u767B\u5F55")
                                            ]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "avatar-btn"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx(() => {
                                              var _a2, _b2, _c;
                                              return [
                                                createTextVNode(toDisplayString((_c = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c : "?"), 1)
                                              ];
                                            }),
                                            _: 1
                                          }),
                                          createTextVNode(" \u25BC ")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ])
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_layout_content, { class: "app-content" }, {
                            default: withCtx(() => [
                              renderSlot(_ctx.$slots, "default", {}, void 0, true)
                            ]),
                            _: 3
                          })
                        ];
                      }
                    }),
                    _: 3
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_layout_sider, {
                      collapsed: collapsed.value,
                      "onUpdate:collapsed": ($event) => collapsed.value = $event,
                      collapsible: "",
                      width: "220",
                      theme: "dark"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", { class: "logo" }, [
                          !collapsed.value ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "logo-text"
                          }, "\u4F17\u7EF4OA\u5DE5\u4F5C\u53F0")) : (openBlock(), createBlock("span", {
                            key: 1,
                            class: "logo-icon"
                          }, "OA"))
                        ]),
                        createVNode(_component_a_menu, {
                          selectedKeys: selectedKeys.value,
                          "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                          theme: "dark",
                          mode: "inline",
                          onClick: onMenuClick
                        }, {
                          default: withCtx(() => [
                            (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                              var _a;
                              return openBlock(), createBlock(Fragment, {
                                key: item.key
                              }, [
                                ((_a = item.children) == null ? void 0 : _a.length) ? (openBlock(), createBlock(_component_a_sub_menu, {
                                  key: item.key
                                }, {
                                  title: withCtx(() => [
                                    createTextVNode(toDisplayString(item.label), 1)
                                  ]),
                                  default: withCtx(() => [
                                    (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                      return openBlock(), createBlock(_component_a_menu_item, {
                                        key: child.path
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(child.label), 1)
                                        ]),
                                        _: 2
                                      }, 1024);
                                    }), 128))
                                  ]),
                                  _: 2
                                }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                  key: item.path
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(item.label), 1)
                                  ]),
                                  _: 2
                                }, 1024))
                              ], 64);
                            }), 128))
                          ]),
                          _: 1
                        }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                      ]),
                      _: 1
                    }, 8, ["collapsed", "onUpdate:collapsed"]),
                    createVNode(_component_a_layout, null, {
                      default: withCtx(() => [
                        createVNode(_component_a_layout_header, { class: "app-header" }, {
                          default: withCtx(() => {
                            var _a, _b;
                            return [
                              createVNode("div", { class: "header-brand" }, [
                                createTextVNode(" \u535A\u6E0A OA "),
                                unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: "header-user-label"
                                }, " \xB7 " + toDisplayString((_a = unref(userStore).userInfo.roleName) != null ? _a : unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                              ]),
                              createVNode("div", { class: "header-actions" }, [
                                ((_b = unref(userStore).userInfo) == null ? void 0 : _b.role) === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                  key: 0,
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" \u2699 \u7CFB\u7EDF ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])) : createCommentVNode("", true),
                                createVNode(_component_a_badge, {
                                  count: notificationCount.value,
                                  "overflow-count": 99,
                                  class: "action-badge"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])
                                  ]),
                                  _: 1
                                }, 8, ["count"]),
                                createVNode(_component_a_badge, {
                                  count: todoCount.value,
                                  "overflow-count": 99,
                                  class: "action-badge"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])
                                  ]),
                                  _: 1
                                }, 8, ["count"]),
                                createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                  overlay: withCtx(() => [
                                    createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_menu_item, { key: "profile" }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                          ]),
                                          _: 1
                                        }),
                                        createVNode(_component_a_menu_item, { key: "password" }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                          ]),
                                          _: 1
                                        }),
                                        createVNode(_component_a_menu_divider),
                                        createVNode(_component_a_menu_item, { key: "logout" }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u9000\u51FA\u767B\u5F55")
                                          ]),
                                          _: 1
                                        })
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "avatar-btn"
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_avatar, {
                                          size: "small",
                                          style: { backgroundColor: "#003466" }
                                        }, {
                                          default: withCtx(() => {
                                            var _a2, _b2, _c;
                                            return [
                                              createTextVNode(toDisplayString((_c = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c : "?"), 1)
                                            ];
                                          }),
                                          _: 1
                                        }),
                                        createTextVNode(" \u25BC ")
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                })
                              ])
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_layout_content, { class: "app-content" }, {
                          default: withCtx(() => [
                            renderSlot(_ctx.$slots, "default", {}, void 0, true)
                          ]),
                          _: 3
                        })
                      ]),
                      _: 3
                    })
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_layout, { class: "app-shell" }, {
                default: withCtx(() => [
                  createVNode(_component_a_layout_sider, {
                    collapsed: collapsed.value,
                    "onUpdate:collapsed": ($event) => collapsed.value = $event,
                    collapsible: "",
                    width: "220",
                    theme: "dark"
                  }, {
                    default: withCtx(() => [
                      createVNode("div", { class: "logo" }, [
                        !collapsed.value ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "logo-text"
                        }, "\u4F17\u7EF4OA\u5DE5\u4F5C\u53F0")) : (openBlock(), createBlock("span", {
                          key: 1,
                          class: "logo-icon"
                        }, "OA"))
                      ]),
                      createVNode(_component_a_menu, {
                        selectedKeys: selectedKeys.value,
                        "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                        theme: "dark",
                        mode: "inline",
                        onClick: onMenuClick
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                            var _a;
                            return openBlock(), createBlock(Fragment, {
                              key: item.key
                            }, [
                              ((_a = item.children) == null ? void 0 : _a.length) ? (openBlock(), createBlock(_component_a_sub_menu, {
                                key: item.key
                              }, {
                                title: withCtx(() => [
                                  createTextVNode(toDisplayString(item.label), 1)
                                ]),
                                default: withCtx(() => [
                                  (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                    return openBlock(), createBlock(_component_a_menu_item, {
                                      key: child.path
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(child.label), 1)
                                      ]),
                                      _: 2
                                    }, 1024);
                                  }), 128))
                                ]),
                                _: 2
                              }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                key: item.path
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(item.label), 1)
                                ]),
                                _: 2
                              }, 1024))
                            ], 64);
                          }), 128))
                        ]),
                        _: 1
                      }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                    ]),
                    _: 1
                  }, 8, ["collapsed", "onUpdate:collapsed"]),
                  createVNode(_component_a_layout, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_layout_header, { class: "app-header" }, {
                        default: withCtx(() => {
                          var _a, _b;
                          return [
                            createVNode("div", { class: "header-brand" }, [
                              createTextVNode(" \u535A\u6E0A OA "),
                              unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "header-user-label"
                              }, " \xB7 " + toDisplayString((_a = unref(userStore).userInfo.roleName) != null ? _a : unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                            ]),
                            createVNode("div", { class: "header-actions" }, [
                              ((_b = unref(userStore).userInfo) == null ? void 0 : _b.role) === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                key: 0,
                                type: "text",
                                class: "action-btn",
                                onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" \u2699 \u7CFB\u7EDF ")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_badge, {
                                count: notificationCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" \u{1F514} \u901A\u77E5 ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])
                                ]),
                                _: 1
                              }, 8, ["count"]),
                              createVNode(_component_a_badge, {
                                count: todoCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" \u{1F4CB} \u5F85\u529E ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])
                                ]),
                                _: 1
                              }, 8, ["count"]),
                              createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                overlay: withCtx(() => [
                                  createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_menu_item, { key: "profile" }, {
                                        default: withCtx(() => [
                                          createTextVNode("\u4E2A\u4EBA\u4FE1\u606F")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_a_menu_item, { key: "password" }, {
                                        default: withCtx(() => [
                                          createTextVNode("\u4FEE\u6539\u5BC6\u7801")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_a_menu_divider),
                                      createVNode(_component_a_menu_item, { key: "logout" }, {
                                        default: withCtx(() => [
                                          createTextVNode("\u9000\u51FA\u767B\u5F55")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ]),
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "avatar-btn"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_avatar, {
                                        size: "small",
                                        style: { backgroundColor: "#003466" }
                                      }, {
                                        default: withCtx(() => {
                                          var _a2, _b2, _c;
                                          return [
                                            createTextVNode(toDisplayString((_c = (_b2 = (_a2 = unref(userStore).userInfo) == null ? void 0 : _a2.displayName) == null ? void 0 : _b2.slice(0, 1)) != null ? _c : "?"), 1)
                                          ];
                                        }),
                                        _: 1
                                      }),
                                      createTextVNode(" \u25BC ")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              })
                            ])
                          ];
                        }),
                        _: 1
                      }),
                      createVNode(_component_a_layout_content, { class: "app-content" }, {
                        default: withCtx(() => [
                          renderSlot(_ctx.$slots, "default", {}, void 0, true)
                        ]),
                        _: 3
                      })
                    ]),
                    _: 3
                  })
                ]),
                _: 3
              })
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a7cf49d1"]]);

export { _default as default };
//# sourceMappingURL=default-B_t7vXlR.mjs.map
