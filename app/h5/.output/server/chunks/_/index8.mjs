import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { defineComponent, shallowRef, computed, createVNode, Transition, withDirectives, vShow } from 'vue';
import { g as genComponentStyleHook, m as merge, r as resetComponent, w as withInstall, u as useConfigInject, C as CloseCircleFilled, c as classNames, a as CloseOutlined, i as isValidElement, b as cloneElement, d as getTransitionProps, P as PropTypes, t as tuple } from './collapseMotion.mjs';
import { E as ExclamationCircleOutlined, C as CloseCircleOutlined, I as InfoCircleOutlined, a as CheckCircleOutlined, b as InfoCircleFilled } from './InfoCircleFilled.mjs';
import { E as ExclamationCircleFilled, C as CheckCircleFilled } from './ExclamationCircleFilled.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';

const genAlertTypeStyle = (bgColor, borderColor, iconColor, token, alertCls) => ({
  backgroundColor: bgColor,
  border: `${token.lineWidth}px ${token.lineType} ${borderColor}`,
  [`${alertCls}-icon`]: {
    color: iconColor
  }
});
const genBaseStyle = token => {
  const {
    componentCls,
    motionDurationSlow: duration,
    marginXS,
    marginSM,
    fontSize,
    fontSizeLG,
    lineHeight,
    borderRadiusLG: borderRadius,
    motionEaseInOutCirc,
    alertIconSizeLG,
    colorText,
    paddingContentVerticalSM,
    alertPaddingHorizontal,
    paddingMD,
    paddingContentHorizontalLG
  } = token;
  return {
    [componentCls]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      padding: `${paddingContentVerticalSM}px ${alertPaddingHorizontal}px`,
      wordWrap: 'break-word',
      borderRadius,
      [`&${componentCls}-rtl`]: {
        direction: 'rtl'
      },
      [`${componentCls}-content`]: {
        flex: 1,
        minWidth: 0
      },
      [`${componentCls}-icon`]: {
        marginInlineEnd: marginXS,
        lineHeight: 0
      },
      [`&-description`]: {
        display: 'none',
        fontSize,
        lineHeight
      },
      '&-message': {
        color: colorText
      },
      [`&${componentCls}-motion-leave`]: {
        overflow: 'hidden',
        opacity: 1,
        transition: `max-height ${duration} ${motionEaseInOutCirc}, opacity ${duration} ${motionEaseInOutCirc},
        padding-top ${duration} ${motionEaseInOutCirc}, padding-bottom ${duration} ${motionEaseInOutCirc},
        margin-bottom ${duration} ${motionEaseInOutCirc}`
      },
      [`&${componentCls}-motion-leave-active`]: {
        maxHeight: 0,
        marginBottom: '0 !important',
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0
      }
    }),
    [`${componentCls}-with-description`]: {
      alignItems: 'flex-start',
      paddingInline: paddingContentHorizontalLG,
      paddingBlock: paddingMD,
      [`${componentCls}-icon`]: {
        marginInlineEnd: marginSM,
        fontSize: alertIconSizeLG,
        lineHeight: 0
      },
      [`${componentCls}-message`]: {
        display: 'block',
        marginBottom: marginXS,
        color: colorText,
        fontSize: fontSizeLG
      },
      [`${componentCls}-description`]: {
        display: 'block'
      }
    },
    [`${componentCls}-banner`]: {
      marginBottom: 0,
      border: '0 !important',
      borderRadius: 0
    }
  };
};
const genTypeStyle = token => {
  const {
    componentCls,
    colorSuccess,
    colorSuccessBorder,
    colorSuccessBg,
    colorWarning,
    colorWarningBorder,
    colorWarningBg,
    colorError,
    colorErrorBorder,
    colorErrorBg,
    colorInfo,
    colorInfoBorder,
    colorInfoBg
  } = token;
  return {
    [componentCls]: {
      '&-success': genAlertTypeStyle(colorSuccessBg, colorSuccessBorder, colorSuccess, token, componentCls),
      '&-info': genAlertTypeStyle(colorInfoBg, colorInfoBorder, colorInfo, token, componentCls),
      '&-warning': genAlertTypeStyle(colorWarningBg, colorWarningBorder, colorWarning, token, componentCls),
      '&-error': _extends(_extends({}, genAlertTypeStyle(colorErrorBg, colorErrorBorder, colorError, token, componentCls)), {
        [`${componentCls}-description > pre`]: {
          margin: 0,
          padding: 0
        }
      })
    }
  };
};
const genActionStyle = token => {
  const {
    componentCls,
    iconCls,
    motionDurationMid,
    marginXS,
    fontSizeIcon,
    colorIcon,
    colorIconHover
  } = token;
  return {
    [componentCls]: {
      [`&-action`]: {
        marginInlineStart: marginXS
      },
      [`${componentCls}-close-icon`]: {
        marginInlineStart: marginXS,
        padding: 0,
        overflow: 'hidden',
        fontSize: fontSizeIcon,
        lineHeight: `${fontSizeIcon}px`,
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        [`${iconCls}-close`]: {
          color: colorIcon,
          transition: `color ${motionDurationMid}`,
          '&:hover': {
            color: colorIconHover
          }
        }
      },
      '&-close-text': {
        color: colorIcon,
        transition: `color ${motionDurationMid}`,
        '&:hover': {
          color: colorIconHover
        }
      }
    }
  };
};
const genAlertStyle = token => [genBaseStyle(token), genTypeStyle(token), genActionStyle(token)];
const useStyle = genComponentStyleHook('Alert', token => {
  const {
    fontSizeHeading3
  } = token;
  const alertToken = merge(token, {
    alertIconSizeLG: fontSizeHeading3,
    alertPaddingHorizontal: 12 // Fixed value here.
  });
  return [genAlertStyle(alertToken)];
});

const iconMapFilled = {
  success: CheckCircleFilled,
  info: InfoCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled
};
const iconMapOutlined = {
  success: CheckCircleOutlined,
  info: InfoCircleOutlined,
  error: CloseCircleOutlined,
  warning: ExclamationCircleOutlined
};
const AlertTypes = tuple('success', 'info', 'warning', 'error');
const alertProps = () => ({
  /**
   * Type of Alert styles, options: `success`, `info`, `warning`, `error`
   */
  type: PropTypes.oneOf(AlertTypes),
  /** Whether Alert can be closed */
  closable: {
    type: Boolean,
    default: undefined
  },
  /** Close text to show */
  closeText: PropTypes.any,
  /** Content of Alert */
  message: PropTypes.any,
  /** Additional content of Alert */
  description: PropTypes.any,
  /** Trigger when animation ending of Alert */
  afterClose: Function,
  /** Whether to show icon */
  showIcon: {
    type: Boolean,
    default: undefined
  },
  prefixCls: String,
  banner: {
    type: Boolean,
    default: undefined
  },
  icon: PropTypes.any,
  closeIcon: PropTypes.any,
  onClose: Function
});
const Alert = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AAlert',
  inheritAttrs: false,
  props: alertProps(),
  setup(props, _ref) {
    let {
      slots,
      emit,
      attrs,
      expose
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('alert', props);
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const closing = shallowRef(false);
    const closed = shallowRef(false);
    const alertNode = shallowRef();
    const handleClose = e => {
      e.preventDefault();
      const dom = alertNode.value;
      dom.style.height = `${dom.offsetHeight}px`;
      // Magic code
      // 重复一次后才能正确设置 height
      dom.style.height = `${dom.offsetHeight}px`;
      closing.value = true;
      emit('close', e);
    };
    const animationEnd = () => {
      var _a;
      closing.value = false;
      closed.value = true;
      (_a = props.afterClose) === null || _a === void 0 ? void 0 : _a.call(props);
    };
    const mergedType = computed(() => {
      const {
        type
      } = props;
      if (type !== undefined) {
        return type;
      }
      // banner 模式默认为警告
      return props.banner ? 'warning' : 'info';
    });
    expose({
      animationEnd
    });
    const motionStyle = shallowRef({});
    return () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const {
        banner,
        closeIcon: customCloseIcon = (_a = slots.closeIcon) === null || _a === void 0 ? void 0 : _a.call(slots)
      } = props;
      let {
        closable,
        showIcon
      } = props;
      const closeText = (_b = props.closeText) !== null && _b !== void 0 ? _b : (_c = slots.closeText) === null || _c === void 0 ? void 0 : _c.call(slots);
      const description = (_d = props.description) !== null && _d !== void 0 ? _d : (_e = slots.description) === null || _e === void 0 ? void 0 : _e.call(slots);
      const message = (_f = props.message) !== null && _f !== void 0 ? _f : (_g = slots.message) === null || _g === void 0 ? void 0 : _g.call(slots);
      const icon = (_h = props.icon) !== null && _h !== void 0 ? _h : (_j = slots.icon) === null || _j === void 0 ? void 0 : _j.call(slots);
      const action = (_k = slots.action) === null || _k === void 0 ? void 0 : _k.call(slots);
      // banner模式默认有 Icon
      showIcon = banner && showIcon === undefined ? true : showIcon;
      const IconType = (description ? iconMapOutlined : iconMapFilled)[mergedType.value] || null;
      // closeable when closeText is assigned
      if (closeText) {
        closable = true;
      }
      const prefixClsValue = prefixCls.value;
      const alertCls = classNames(prefixClsValue, {
        [`${prefixClsValue}-${mergedType.value}`]: true,
        [`${prefixClsValue}-closing`]: closing.value,
        [`${prefixClsValue}-with-description`]: !!description,
        [`${prefixClsValue}-no-icon`]: !showIcon,
        [`${prefixClsValue}-banner`]: !!banner,
        [`${prefixClsValue}-closable`]: closable,
        [`${prefixClsValue}-rtl`]: direction.value === 'rtl',
        [hashId.value]: true
      });
      const closeIcon = closable ? createVNode("button", {
        "type": "button",
        "onClick": handleClose,
        "class": `${prefixClsValue}-close-icon`,
        "tabindex": 0
      }, [closeText ? createVNode("span", {
        "class": `${prefixClsValue}-close-text`
      }, [closeText]) : customCloseIcon === undefined ? createVNode(CloseOutlined, null, null) : customCloseIcon]) : null;
      const iconNode = icon && (isValidElement(icon) ? cloneElement(icon, {
        class: `${prefixClsValue}-icon`
      }) : createVNode("span", {
        "class": `${prefixClsValue}-icon`
      }, [icon])) || createVNode(IconType, {
        "class": `${prefixClsValue}-icon`
      }, null);
      const transitionProps = getTransitionProps(`${prefixClsValue}-motion`, {
        appear: false,
        css: true,
        onAfterLeave: animationEnd,
        onBeforeLeave: node => {
          node.style.maxHeight = `${node.offsetHeight}px`;
        },
        onLeave: node => {
          node.style.maxHeight = '0px';
        }
      });
      return wrapSSR(closed.value ? null : createVNode(Transition, transitionProps, {
        default: () => [withDirectives(createVNode("div", _objectSpread(_objectSpread({
          "role": "alert"
        }, attrs), {}, {
          "style": [attrs.style, motionStyle.value],
          "class": [attrs.class, alertCls],
          "data-show": !closing.value,
          "ref": alertNode
        }), [showIcon ? iconNode : null, createVNode("div", {
          "class": `${prefixClsValue}-content`
        }, [message ? createVNode("div", {
          "class": `${prefixClsValue}-message`
        }, [message]) : null, description ? createVNode("div", {
          "class": `${prefixClsValue}-description`
        }, [description]) : null]), action ? createVNode("div", {
          "class": `${prefixClsValue}-action`
        }, [action]) : null, closeIcon]), [[vShow, !closing.value]])]
      }));
    };
  }
});
const Alert$1 = withInstall(Alert);

export { Alert$1 as A };
//# sourceMappingURL=index8.mjs.map
