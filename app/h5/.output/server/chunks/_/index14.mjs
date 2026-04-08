import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { createVNode, inject, ref, Fragment, defineComponent, onBeforeMount, onBeforeUnmount, provide, toRef, computed } from 'vue';
import { W as getSlot, X as getClass, Y as getStyle, g as genComponentStyleHook, m as merge, r as resetComponent, Z as textEllipsis, u as useConfigInject, _ as useResponsiveObserver, q as responsiveArray, l as flattenChildren, P as PropTypes, b as cloneElement } from './collapseMotion.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';

function notEmpty(val) {
  return val !== undefined && val !== null;
}
const Cell = props => {
  const {
    itemPrefixCls,
    component,
    span,
    labelStyle,
    contentStyle,
    bordered,
    label,
    content,
    colon
  } = props;
  const Component = component;
  if (bordered) {
    return createVNode(Component, {
      "class": [{
        [`${itemPrefixCls}-item-label`]: notEmpty(label),
        [`${itemPrefixCls}-item-content`]: notEmpty(content)
      }],
      "colSpan": span
    }, {
      default: () => [notEmpty(label) && createVNode("span", {
        "style": labelStyle
      }, [label]), notEmpty(content) && createVNode("span", {
        "style": contentStyle
      }, [content])]
    });
  }
  return createVNode(Component, {
    "class": [`${itemPrefixCls}-item`],
    "colSpan": span
  }, {
    default: () => [createVNode("div", {
      "class": `${itemPrefixCls}-item-container`
    }, [(label || label === 0) && createVNode("span", {
      "class": [`${itemPrefixCls}-item-label`, {
        [`${itemPrefixCls}-item-no-colon`]: !colon
      }],
      "style": labelStyle
    }, [label]), (content || content === 0) && createVNode("span", {
      "class": `${itemPrefixCls}-item-content`,
      "style": contentStyle
    }, [content])])]
  });
};

const Row = props => {
  const renderCells = (items, _ref, _ref2) => {
    let {
      colon,
      prefixCls,
      bordered
    } = _ref;
    let {
      component,
      type,
      showLabel,
      showContent,
      labelStyle: rootLabelStyle,
      contentStyle: rootContentStyle
    } = _ref2;
    return items.map((item, index) => {
      var _a, _b;
      const itemProps = item.props || {};
      const {
        prefixCls: itemPrefixCls = prefixCls,
        span = 1,
        labelStyle = itemProps['label-style'],
        contentStyle = itemProps['content-style'],
        label = (_b = (_a = item.children) === null || _a === void 0 ? void 0 : _a.label) === null || _b === void 0 ? void 0 : _b.call(_a)
      } = itemProps;
      const children = getSlot(item);
      const className = getClass(item);
      const style = getStyle(item);
      const {
        key
      } = item;
      if (typeof component === 'string') {
        return createVNode(Cell, {
          "key": `${type}-${String(key) || index}`,
          "class": className,
          "style": style,
          "labelStyle": _extends(_extends({}, rootLabelStyle), labelStyle),
          "contentStyle": _extends(_extends({}, rootContentStyle), contentStyle),
          "span": span,
          "colon": colon,
          "component": component,
          "itemPrefixCls": itemPrefixCls,
          "bordered": bordered,
          "label": showLabel ? label : null,
          "content": showContent ? children : null
        }, null);
      }
      return [createVNode(Cell, {
        "key": `label-${String(key) || index}`,
        "class": className,
        "style": _extends(_extends(_extends({}, rootLabelStyle), style), labelStyle),
        "span": 1,
        "colon": colon,
        "component": component[0],
        "itemPrefixCls": itemPrefixCls,
        "bordered": bordered,
        "label": label
      }, null), createVNode(Cell, {
        "key": `content-${String(key) || index}`,
        "class": className,
        "style": _extends(_extends(_extends({}, rootContentStyle), style), contentStyle),
        "span": span * 2 - 1,
        "component": component[1],
        "itemPrefixCls": itemPrefixCls,
        "bordered": bordered,
        "content": children
      }, null)];
    });
  };
  const {
    prefixCls,
    vertical,
    row,
    index,
    bordered
  } = props;
  const {
    labelStyle,
    contentStyle
  } = inject(descriptionsContext, {
    labelStyle: ref({}),
    contentStyle: ref({})
  });
  if (vertical) {
    return createVNode(Fragment, null, [createVNode("tr", {
      "key": `label-${index}`,
      "class": `${prefixCls}-row`
    }, [renderCells(row, props, {
      component: 'th',
      type: 'label',
      showLabel: true,
      labelStyle: labelStyle.value,
      contentStyle: contentStyle.value
    })]), createVNode("tr", {
      "key": `content-${index}`,
      "class": `${prefixCls}-row`
    }, [renderCells(row, props, {
      component: 'td',
      type: 'content',
      showContent: true,
      labelStyle: labelStyle.value,
      contentStyle: contentStyle.value
    })])]);
  }
  return createVNode("tr", {
    "key": index,
    "class": `${prefixCls}-row`
  }, [renderCells(row, props, {
    component: bordered ? ['th', 'td'] : 'td',
    type: 'item',
    showLabel: true,
    showContent: true,
    labelStyle: labelStyle.value,
    contentStyle: contentStyle.value
  })]);
};

const genBorderedStyle = token => {
  const {
    componentCls,
    descriptionsSmallPadding,
    descriptionsDefaultPadding,
    descriptionsMiddlePadding,
    descriptionsBg
  } = token;
  return {
    [`&${componentCls}-bordered`]: {
      [`${componentCls}-view`]: {
        border: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        '> table': {
          tableLayout: 'auto',
          borderCollapse: 'collapse'
        }
      },
      [`${componentCls}-item-label, ${componentCls}-item-content`]: {
        padding: descriptionsDefaultPadding,
        borderInlineEnd: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        '&:last-child': {
          borderInlineEnd: 'none'
        }
      },
      [`${componentCls}-item-label`]: {
        backgroundColor: descriptionsBg,
        '&::after': {
          display: 'none'
        }
      },
      [`${componentCls}-row`]: {
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        '&:last-child': {
          borderBottom: 'none'
        }
      },
      [`&${componentCls}-middle`]: {
        [`${componentCls}-item-label, ${componentCls}-item-content`]: {
          padding: descriptionsMiddlePadding
        }
      },
      [`&${componentCls}-small`]: {
        [`${componentCls}-item-label, ${componentCls}-item-content`]: {
          padding: descriptionsSmallPadding
        }
      }
    }
  };
};
const genDescriptionStyles = token => {
  const {
    componentCls,
    descriptionsExtraColor,
    descriptionItemPaddingBottom,
    descriptionsItemLabelColonMarginRight,
    descriptionsItemLabelColonMarginLeft,
    descriptionsTitleMarginBottom
  } = token;
  return {
    [componentCls]: _extends(_extends(_extends({}, resetComponent(token)), genBorderedStyle(token)), {
      [`&-rtl`]: {
        direction: 'rtl'
      },
      [`${componentCls}-header`]: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: descriptionsTitleMarginBottom
      },
      [`${componentCls}-title`]: _extends(_extends({}, textEllipsis), {
        flex: 'auto',
        color: token.colorText,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG
      }),
      [`${componentCls}-extra`]: {
        marginInlineStart: 'auto',
        color: descriptionsExtraColor,
        fontSize: token.fontSize
      },
      [`${componentCls}-view`]: {
        width: '100%',
        borderRadius: token.borderRadiusLG,
        table: {
          width: '100%',
          tableLayout: 'fixed'
        }
      },
      [`${componentCls}-row`]: {
        '> th, > td': {
          paddingBottom: descriptionItemPaddingBottom
        },
        '&:last-child': {
          borderBottom: 'none'
        }
      },
      [`${componentCls}-item-label`]: {
        color: token.colorText,
        fontWeight: 'normal',
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        textAlign: `start`,
        '&::after': {
          content: '":"',
          position: 'relative',
          top: -0.5,
          marginInline: `${descriptionsItemLabelColonMarginLeft}px ${descriptionsItemLabelColonMarginRight}px`
        },
        [`&${componentCls}-item-no-colon::after`]: {
          content: '""'
        }
      },
      [`${componentCls}-item-no-label`]: {
        '&::after': {
          margin: 0,
          content: '""'
        }
      },
      [`${componentCls}-item-content`]: {
        display: 'table-cell',
        flex: 1,
        color: token.colorText,
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      },
      [`${componentCls}-item`]: {
        paddingBottom: 0,
        verticalAlign: 'top',
        '&-container': {
          display: 'flex',
          [`${componentCls}-item-label`]: {
            display: 'inline-flex',
            alignItems: 'baseline'
          },
          [`${componentCls}-item-content`]: {
            display: 'inline-flex',
            alignItems: 'baseline'
          }
        }
      },
      '&-middle': {
        [`${componentCls}-row`]: {
          '> th, > td': {
            paddingBottom: token.paddingSM
          }
        }
      },
      '&-small': {
        [`${componentCls}-row`]: {
          '> th, > td': {
            paddingBottom: token.paddingXS
          }
        }
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Descriptions', token => {
  const descriptionsBg = token.colorFillAlter;
  const descriptionsTitleMarginBottom = token.fontSizeSM * token.lineHeightSM;
  const descriptionsExtraColor = token.colorText;
  const descriptionsSmallPadding = `${token.paddingXS}px ${token.padding}px`;
  const descriptionsDefaultPadding = `${token.padding}px ${token.paddingLG}px`;
  const descriptionsMiddlePadding = `${token.paddingSM}px ${token.paddingLG}px`;
  const descriptionItemPaddingBottom = token.padding;
  const descriptionsItemLabelColonMarginRight = token.marginXS;
  const descriptionsItemLabelColonMarginLeft = token.marginXXS / 2;
  const descriptionToken = merge(token, {
    descriptionsBg,
    descriptionsTitleMarginBottom,
    descriptionsExtraColor,
    descriptionItemPaddingBottom,
    descriptionsSmallPadding,
    descriptionsDefaultPadding,
    descriptionsMiddlePadding,
    descriptionsItemLabelColonMarginRight,
    descriptionsItemLabelColonMarginLeft
  });
  return [genDescriptionStyles(descriptionToken)];
});

({
  label: PropTypes.any});
const descriptionsItemProp = () => ({
  prefixCls: String,
  label: PropTypes.any,
  labelStyle: {
    type: Object,
    default: undefined
  },
  contentStyle: {
    type: Object,
    default: undefined
  },
  span: {
    type: Number,
    default: 1
  }
});
const DescriptionsItem = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ADescriptionsItem',
  props: descriptionsItemProp(),
  setup(_, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});
const DEFAULT_COLUMN_MAP = {
  xxxl: 3,
  xxl: 3,
  xl: 3,
  lg: 3,
  md: 3,
  sm: 2,
  xs: 1
};
function getColumn(column, screens) {
  if (typeof column === 'number') {
    return column;
  }
  if (typeof column === 'object') {
    for (let i = 0; i < responsiveArray.length; i++) {
      const breakpoint = responsiveArray[i];
      if (screens[breakpoint] && column[breakpoint] !== undefined) {
        return column[breakpoint] || DEFAULT_COLUMN_MAP[breakpoint];
      }
    }
  }
  return 3;
}
function getFilledItem(node, rowRestCol, span) {
  let clone = node;
  if (span === undefined || span > rowRestCol) {
    clone = cloneElement(node, {
      span: rowRestCol
    });
  }
  return clone;
}
function getRows(children, column) {
  const childNodes = flattenChildren(children);
  const rows = [];
  let tmpRow = [];
  let rowRestCol = column;
  childNodes.forEach((node, index) => {
    var _a;
    const span = (_a = node.props) === null || _a === void 0 ? void 0 : _a.span;
    const mergedSpan = span || 1;
    // Additional handle last one
    if (index === childNodes.length - 1) {
      tmpRow.push(getFilledItem(node, rowRestCol, span));
      rows.push(tmpRow);
      return;
    }
    if (mergedSpan < rowRestCol) {
      rowRestCol -= mergedSpan;
      tmpRow.push(node);
    } else {
      tmpRow.push(getFilledItem(node, rowRestCol, mergedSpan));
      rows.push(tmpRow);
      rowRestCol = column;
      tmpRow = [];
    }
  });
  return rows;
}
const descriptionsProps = () => ({
  prefixCls: String,
  bordered: {
    type: Boolean,
    default: undefined
  },
  size: {
    type: String,
    default: 'default'
  },
  title: PropTypes.any,
  extra: PropTypes.any,
  column: {
    type: [Number, Object],
    default: () => DEFAULT_COLUMN_MAP
  },
  layout: String,
  colon: {
    type: Boolean,
    default: undefined
  },
  labelStyle: {
    type: Object,
    default: undefined
  },
  contentStyle: {
    type: Object,
    default: undefined
  }
});
const descriptionsContext = Symbol('descriptionsContext');
const Descriptions = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ADescriptions',
  inheritAttrs: false,
  props: descriptionsProps(),
  slots: Object,
  Item: DescriptionsItem,
  setup(props, _ref2) {
    let {
      slots,
      attrs
    } = _ref2;
    const {
      prefixCls,
      direction
    } = useConfigInject('descriptions', props);
    let token;
    const screens = ref({});
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const responsiveObserve = useResponsiveObserver();
    onBeforeMount(() => {
      token = responsiveObserve.value.subscribe(screen => {
        if (typeof props.column !== 'object') {
          return;
        }
        screens.value = screen;
      });
    });
    onBeforeUnmount(() => {
      responsiveObserve.value.unsubscribe(token);
    });
    provide(descriptionsContext, {
      labelStyle: toRef(props, 'labelStyle'),
      contentStyle: toRef(props, 'contentStyle')
    });
    const mergeColumn = computed(() => getColumn(props.column, screens.value));
    return () => {
      var _a, _b, _c;
      const {
        size,
        bordered = false,
        layout = 'horizontal',
        colon = true,
        title = (_a = slots.title) === null || _a === void 0 ? void 0 : _a.call(slots),
        extra = (_b = slots.extra) === null || _b === void 0 ? void 0 : _b.call(slots)
      } = props;
      const children = (_c = slots.default) === null || _c === void 0 ? void 0 : _c.call(slots);
      const rows = getRows(children, mergeColumn.value);
      return wrapSSR(createVNode("div", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": [prefixCls.value, {
          [`${prefixCls.value}-${size}`]: size !== 'default',
          [`${prefixCls.value}-bordered`]: !!bordered,
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl'
        }, attrs.class, hashId.value]
      }), [(title || extra) && createVNode("div", {
        "class": `${prefixCls.value}-header`
      }, [title && createVNode("div", {
        "class": `${prefixCls.value}-title`
      }, [title]), extra && createVNode("div", {
        "class": `${prefixCls.value}-extra`
      }, [extra])]), createVNode("div", {
        "class": `${prefixCls.value}-view`
      }, [createVNode("table", null, [createVNode("tbody", null, [rows.map((row, index) => createVNode(Row, {
        "key": index,
        "index": index,
        "colon": colon,
        "prefixCls": prefixCls.value,
        "vertical": layout === 'vertical',
        "bordered": bordered,
        "row": row
      }, null))])])])]));
    };
  }
});
Descriptions.install = function (app) {
  app.component(Descriptions.name, Descriptions);
  app.component(Descriptions.Item.name, Descriptions.Item);
  return app;
};

export { Descriptions as D, DescriptionsItem as a };
//# sourceMappingURL=index14.mjs.map
