import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { defineComponent, computed, createVNode, cloneVNode } from 'vue';
import { u as useConfigInject, e as initDefaultProps, P as PropTypes, t as tuple, f as booleanType, g as genComponentStyleHook, m as merge, r as resetComponent, k as filterEmpty, L as LoadingOutlined, c as classNames } from './collapseMotion.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';

const timelineItemProps = () => ({
  prefixCls: String,
  color: String,
  dot: PropTypes.any,
  pending: booleanType(),
  position: PropTypes.oneOf(tuple('left', 'right', '')).def(''),
  label: PropTypes.any
});
const TimelineItem = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATimelineItem',
  props: initDefaultProps(timelineItemProps(), {
    color: 'blue',
    pending: false
  }),
  slots: Object,
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('timeline', props);
    const itemClassName = computed(() => ({
      [`${prefixCls.value}-item`]: true,
      [`${prefixCls.value}-item-pending`]: props.pending
    }));
    const customColor = computed(() => /blue|red|green|gray/.test(props.color || '') ? undefined : props.color || 'blue');
    const dotClassName = computed(() => ({
      [`${prefixCls.value}-item-head`]: true,
      [`${prefixCls.value}-item-head-${props.color || 'blue'}`]: !customColor.value
    }));
    return () => {
      var _a, _b, _c;
      const {
        label = (_a = slots.label) === null || _a === void 0 ? void 0 : _a.call(slots),
        dot = (_b = slots.dot) === null || _b === void 0 ? void 0 : _b.call(slots)
      } = props;
      return createVNode("li", {
        "class": itemClassName.value
      }, [label && createVNode("div", {
        "class": `${prefixCls.value}-item-label`
      }, [label]), createVNode("div", {
        "class": `${prefixCls.value}-item-tail`
      }, null), createVNode("div", {
        "class": [dotClassName.value, !!dot && `${prefixCls.value}-item-head-custom`],
        "style": {
          borderColor: customColor.value,
          color: customColor.value
        }
      }, [dot]), createVNode("div", {
        "class": `${prefixCls.value}-item-content`
      }, [(_c = slots.default) === null || _c === void 0 ? void 0 : _c.call(slots)])]);
    };
  }
});

const genTimelineStyle = token => {
  const {
    componentCls
  } = token;
  return {
    [componentCls]: _extends(_extends({}, resetComponent(token)), {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      [`${componentCls}-item`]: {
        position: 'relative',
        margin: 0,
        paddingBottom: token.timeLineItemPaddingBottom,
        fontSize: token.fontSize,
        listStyle: 'none',
        '&-tail': {
          position: 'absolute',
          insetBlockStart: token.timeLineItemHeadSize,
          insetInlineStart: (token.timeLineItemHeadSize - token.timeLineItemTailWidth) / 2,
          height: `calc(100% - ${token.timeLineItemHeadSize}px)`,
          borderInlineStart: `${token.timeLineItemTailWidth}px ${token.lineType} ${token.colorSplit}`
        },
        '&-pending': {
          [`${componentCls}-item-head`]: {
            fontSize: token.fontSizeSM,
            backgroundColor: 'transparent'
          },
          [`${componentCls}-item-tail`]: {
            display: 'none'
          }
        },
        '&-head': {
          position: 'absolute',
          width: token.timeLineItemHeadSize,
          height: token.timeLineItemHeadSize,
          backgroundColor: token.colorBgContainer,
          border: `${token.timeLineHeadBorderWidth}px ${token.lineType} transparent`,
          borderRadius: '50%',
          '&-blue': {
            color: token.colorPrimary,
            borderColor: token.colorPrimary
          },
          '&-red': {
            color: token.colorError,
            borderColor: token.colorError
          },
          '&-green': {
            color: token.colorSuccess,
            borderColor: token.colorSuccess
          },
          '&-gray': {
            color: token.colorTextDisabled,
            borderColor: token.colorTextDisabled
          }
        },
        '&-head-custom': {
          position: 'absolute',
          insetBlockStart: token.timeLineItemHeadSize / 2,
          insetInlineStart: token.timeLineItemHeadSize / 2,
          width: 'auto',
          height: 'auto',
          marginBlockStart: 0,
          paddingBlock: token.timeLineItemCustomHeadPaddingVertical,
          lineHeight: 1,
          textAlign: 'center',
          border: 0,
          borderRadius: 0,
          transform: `translate(-50%, -50%)`
        },
        '&-content': {
          position: 'relative',
          insetBlockStart: -(token.fontSize * token.lineHeight - token.fontSize) + token.lineWidth,
          marginInlineStart: token.margin + token.timeLineItemHeadSize,
          marginInlineEnd: 0,
          marginBlockStart: 0,
          marginBlockEnd: 0,
          wordBreak: 'break-word'
        },
        '&-last': {
          [`> ${componentCls}-item-tail`]: {
            display: 'none'
          },
          [`> ${componentCls}-item-content`]: {
            minHeight: token.controlHeightLG * 1.2
          }
        }
      },
      [`&${componentCls}-alternate,
        &${componentCls}-right,
        &${componentCls}-label`]: {
        [`${componentCls}-item`]: {
          '&-tail, &-head, &-head-custom': {
            insetInlineStart: '50%'
          },
          '&-head': {
            marginInlineStart: `-${token.marginXXS}px`,
            '&-custom': {
              marginInlineStart: token.timeLineItemTailWidth / 2
            }
          },
          '&-left': {
            [`${componentCls}-item-content`]: {
              insetInlineStart: `calc(50% - ${token.marginXXS}px)`,
              width: `calc(50% - ${token.marginSM}px)`,
              textAlign: 'start'
            }
          },
          '&-right': {
            [`${componentCls}-item-content`]: {
              width: `calc(50% - ${token.marginSM}px)`,
              margin: 0,
              textAlign: 'end'
            }
          }
        }
      },
      [`&${componentCls}-right`]: {
        [`${componentCls}-item-right`]: {
          [`${componentCls}-item-tail,
            ${componentCls}-item-head,
            ${componentCls}-item-head-custom`]: {
            insetInlineStart: `calc(100% - ${(token.timeLineItemHeadSize + token.timeLineItemTailWidth) / 2}px)`
          },
          [`${componentCls}-item-content`]: {
            width: `calc(100% - ${token.timeLineItemHeadSize + token.marginXS}px)`
          }
        }
      },
      [`&${componentCls}-pending
        ${componentCls}-item-last
        ${componentCls}-item-tail`]: {
        display: 'block',
        height: `calc(100% - ${token.margin}px)`,
        borderInlineStart: `${token.timeLineItemTailWidth}px dotted ${token.colorSplit}`
      },
      [`&${componentCls}-reverse
        ${componentCls}-item-last
        ${componentCls}-item-tail`]: {
        display: 'none'
      },
      [`&${componentCls}-reverse ${componentCls}-item-pending`]: {
        [`${componentCls}-item-tail`]: {
          insetBlockStart: token.margin,
          display: 'block',
          height: `calc(100% - ${token.margin}px)`,
          borderInlineStart: `${token.timeLineItemTailWidth}px dotted ${token.colorSplit}`
        },
        [`${componentCls}-item-content`]: {
          minHeight: token.controlHeightLG * 1.2
        }
      },
      [`&${componentCls}-label`]: {
        [`${componentCls}-item-label`]: {
          position: 'absolute',
          insetBlockStart: -(token.fontSize * token.lineHeight - token.fontSize) + token.timeLineItemTailWidth,
          width: `calc(50% - ${token.marginSM}px)`,
          textAlign: 'end'
        },
        [`${componentCls}-item-right`]: {
          [`${componentCls}-item-label`]: {
            insetInlineStart: `calc(50% + ${token.marginSM}px)`,
            width: `calc(50% - ${token.marginSM}px)`,
            textAlign: 'start'
          }
        }
      },
      // ====================== RTL =======================
      '&-rtl': {
        direction: 'rtl',
        [`${componentCls}-item-head-custom`]: {
          transform: `translate(50%, -50%)`
        }
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Timeline', token => {
  const timeLineToken = merge(token, {
    timeLineItemPaddingBottom: token.padding * 1.25,
    timeLineItemHeadSize: 10,
    timeLineItemCustomHeadPaddingVertical: token.paddingXXS,
    timeLinePaddingInlineEnd: 2,
    timeLineItemTailWidth: token.lineWidthBold,
    timeLineHeadBorderWidth: token.wireframe ? token.lineWidthBold : token.lineWidth * 3
  });
  return [genTimelineStyle(timeLineToken)];
});

const timelineProps = () => ({
  prefixCls: String,
  /** 指定最后一个幽灵节点是否存在或内容 */
  pending: PropTypes.any,
  pendingDot: PropTypes.any,
  reverse: booleanType(),
  mode: PropTypes.oneOf(tuple('left', 'alternate', 'right', ''))
});
const Timeline = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ATimeline',
  inheritAttrs: false,
  props: initDefaultProps(timelineProps(), {
    reverse: false,
    mode: ''
  }),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      prefixCls,
      direction
    } = useConfigInject('timeline', props);
    // style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const getPositionCls = (ele, idx) => {
      const eleProps = ele.props || {};
      if (props.mode === 'alternate') {
        if (eleProps.position === 'right') return `${prefixCls.value}-item-right`;
        if (eleProps.position === 'left') return `${prefixCls.value}-item-left`;
        return idx % 2 === 0 ? `${prefixCls.value}-item-left` : `${prefixCls.value}-item-right`;
      }
      if (props.mode === 'left') return `${prefixCls.value}-item-left`;
      if (props.mode === 'right') return `${prefixCls.value}-item-right`;
      if (eleProps.position === 'right') return `${prefixCls.value}-item-right`;
      return '';
    };
    return () => {
      var _a, _b, _c;
      const {
        pending = (_a = slots.pending) === null || _a === void 0 ? void 0 : _a.call(slots),
        pendingDot = (_b = slots.pendingDot) === null || _b === void 0 ? void 0 : _b.call(slots),
        reverse,
        mode
      } = props;
      const pendingNode = typeof pending === 'boolean' ? null : pending;
      const children = filterEmpty((_c = slots.default) === null || _c === void 0 ? void 0 : _c.call(slots));
      const pendingItem = pending ? createVNode(TimelineItem, {
        "pending": !!pending,
        "dot": pendingDot || createVNode(LoadingOutlined, null, null)
      }, {
        default: () => [pendingNode]
      }) : null;
      if (pendingItem) {
        children.push(pendingItem);
      }
      const timeLineItems = reverse ? children.reverse() : children;
      const itemsCount = timeLineItems.length;
      const lastCls = `${prefixCls.value}-item-last`;
      const items = timeLineItems.map((ele, idx) => {
        const pendingClass = idx === itemsCount - 2 ? lastCls : '';
        const readyClass = idx === itemsCount - 1 ? lastCls : '';
        return cloneVNode(ele, {
          class: classNames([!reverse && !!pending ? pendingClass : readyClass, getPositionCls(ele, idx)])
        });
      });
      const hasLabelItem = timeLineItems.some(item => {
        var _a, _b;
        return !!(((_a = item.props) === null || _a === void 0 ? void 0 : _a.label) || ((_b = item.children) === null || _b === void 0 ? void 0 : _b.label));
      });
      const classString = classNames(prefixCls.value, {
        [`${prefixCls.value}-pending`]: !!pending,
        [`${prefixCls.value}-reverse`]: !!reverse,
        [`${prefixCls.value}-${mode}`]: !!mode && !hasLabelItem,
        [`${prefixCls.value}-label`]: hasLabelItem,
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl'
      }, attrs.class, hashId.value);
      return wrapSSR(createVNode("ul", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": classString
      }), [items]));
    };
  }
});

Timeline.Item = TimelineItem;
/* istanbul ignore next */
Timeline.install = function (app) {
  app.component(Timeline.name, Timeline);
  app.component(TimelineItem.name, TimelineItem);
  return app;
};

export { Timeline as T, TimelineItem as a };
//# sourceMappingURL=index17.mjs.map
