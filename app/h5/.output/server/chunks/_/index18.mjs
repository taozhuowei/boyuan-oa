import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import _extends from '@babel/runtime/helpers/esm/extends';
import { defineComponent, createVNode, inject, ref, provide, toRef, computed, watch } from 'vue';
import { u as useConfigInject, P as PropTypes, l as flattenChildren, c as classNames, b as cloneElement, n as isStringElement, p as isEmptyElement, g as genComponentStyleHook, m as merge, r as resetComponent, q as responsiveArray, e as initDefaultProps, x as objectType, v as vNodeType, f as booleanType, j as functionType, s as someType, y as arrayType } from './collapseMotion.mjs';
import { S as Spin } from './index.mjs';
import { P as Pagination } from './index3.mjs';
import { C as Col, A as ARow } from './index7.mjs';
import { u as useBreakpoint } from './useBreakpoint.mjs';
import { e as eagerComputed } from './index4.mjs';

const listItemMetaProps = () => ({
  avatar: PropTypes.any,
  description: PropTypes.any,
  prefixCls: String,
  title: PropTypes.any
});
const ListItemMeta = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AListItemMeta',
  props: listItemMetaProps(),
  displayName: 'AListItemMeta',
  __ANT_LIST_ITEM_META: true,
  slots: Object,
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      prefixCls
    } = useConfigInject('list', props);
    return () => {
      var _a, _b, _c, _d, _e, _f;
      const classString = `${prefixCls.value}-item-meta`;
      const title = (_a = props.title) !== null && _a !== void 0 ? _a : (_b = slots.title) === null || _b === void 0 ? void 0 : _b.call(slots);
      const description = (_c = props.description) !== null && _c !== void 0 ? _c : (_d = slots.description) === null || _d === void 0 ? void 0 : _d.call(slots);
      const avatar = (_e = props.avatar) !== null && _e !== void 0 ? _e : (_f = slots.avatar) === null || _f === void 0 ? void 0 : _f.call(slots);
      const content = createVNode("div", {
        "class": `${prefixCls.value}-item-meta-content`
      }, [title && createVNode("h4", {
        "class": `${prefixCls.value}-item-meta-title`
      }, [title]), description && createVNode("div", {
        "class": `${prefixCls.value}-item-meta-description`
      }, [description])]);
      return createVNode("div", {
        "class": classString
      }, [avatar && createVNode("div", {
        "class": `${prefixCls.value}-item-meta-avatar`
      }, [avatar]), (title || description) && content]);
    };
  }
});

const ListContextKey = Symbol('ListContextKey');

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const listItemProps = () => ({
  prefixCls: String,
  extra: PropTypes.any,
  actions: PropTypes.array,
  grid: Object,
  colStyle: {
    type: Object,
    default: undefined
  }
});
const ListItem = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AListItem',
  inheritAttrs: false,
  Meta: ListItemMeta,
  props: listItemProps(),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      itemLayout,
      grid
    } = inject(ListContextKey, {
      grid: ref(),
      itemLayout: ref()
    });
    const {
      prefixCls
    } = useConfigInject('list', props);
    const isItemContainsTextNodeAndNotSingular = () => {
      var _a;
      const children = ((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)) || [];
      let result;
      children.forEach(element => {
        if (isStringElement(element) && !isEmptyElement(element)) {
          result = true;
        }
      });
      return result && children.length > 1;
    };
    const isFlexMode = () => {
      var _a, _b;
      const extra = (_a = props.extra) !== null && _a !== void 0 ? _a : (_b = slots.extra) === null || _b === void 0 ? void 0 : _b.call(slots);
      if (itemLayout.value === 'vertical') {
        return !!extra;
      }
      return !isItemContainsTextNodeAndNotSingular();
    };
    return () => {
      var _a, _b, _c, _d, _e;
      const {
          class: className
        } = attrs,
        restAttrs = __rest(attrs, ["class"]);
      const pre = prefixCls.value;
      const extra = (_a = props.extra) !== null && _a !== void 0 ? _a : (_b = slots.extra) === null || _b === void 0 ? void 0 : _b.call(slots);
      const children = (_c = slots.default) === null || _c === void 0 ? void 0 : _c.call(slots);
      let actions = (_d = props.actions) !== null && _d !== void 0 ? _d : flattenChildren((_e = slots.actions) === null || _e === void 0 ? void 0 : _e.call(slots));
      actions = actions && !Array.isArray(actions) ? [actions] : actions;
      const actionsContent = actions && actions.length > 0 && createVNode("ul", {
        "class": `${pre}-item-action`,
        "key": "actions"
      }, [actions.map((action, i) => createVNode("li", {
        "key": `${pre}-item-action-${i}`
      }, [action, i !== actions.length - 1 && createVNode("em", {
        "class": `${pre}-item-action-split`
      }, null)]))]);
      const Element = grid.value ? 'div' : 'li';
      const itemChildren = createVNode(Element, _objectSpread(_objectSpread({}, restAttrs), {}, {
        "class": classNames(`${pre}-item`, {
          [`${pre}-item-no-flex`]: !isFlexMode()
        }, className)
      }), {
        default: () => [itemLayout.value === 'vertical' && extra ? [createVNode("div", {
          "class": `${pre}-item-main`,
          "key": "content"
        }, [children, actionsContent]), createVNode("div", {
          "class": `${pre}-item-extra`,
          "key": "extra"
        }, [extra])] : [children, actionsContent, cloneElement(extra, {
          key: 'extra'
        })]]
      });
      return grid.value ? createVNode(Col, {
        "flex": 1,
        "style": props.colStyle
      }, {
        default: () => [itemChildren]
      }) : itemChildren;
    };
  }
});

const genBorderedStyle = token => {
  const {
    listBorderedCls,
    componentCls,
    paddingLG,
    margin,
    padding,
    listItemPaddingSM,
    marginLG,
    borderRadiusLG
  } = token;
  return {
    [`${listBorderedCls}`]: {
      border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
      borderRadius: borderRadiusLG,
      [`${componentCls}-header,${componentCls}-footer,${componentCls}-item`]: {
        paddingInline: paddingLG
      },
      [`${componentCls}-pagination`]: {
        margin: `${margin}px ${marginLG}px`
      }
    },
    [`${listBorderedCls}${componentCls}-sm`]: {
      [`${componentCls}-item,${componentCls}-header,${componentCls}-footer`]: {
        padding: listItemPaddingSM
      }
    },
    [`${listBorderedCls}${componentCls}-lg`]: {
      [`${componentCls}-item,${componentCls}-header,${componentCls}-footer`]: {
        padding: `${padding}px ${paddingLG}px`
      }
    }
  };
};
const genResponsiveStyle = token => {
  const {
    componentCls,
    screenSM,
    screenMD,
    marginLG,
    marginSM,
    margin
  } = token;
  return {
    [`@media screen and (max-width:${screenMD})`]: {
      [`${componentCls}`]: {
        [`${componentCls}-item`]: {
          [`${componentCls}-item-action`]: {
            marginInlineStart: marginLG
          }
        }
      },
      [`${componentCls}-vertical`]: {
        [`${componentCls}-item`]: {
          [`${componentCls}-item-extra`]: {
            marginInlineStart: marginLG
          }
        }
      }
    },
    [`@media screen and (max-width: ${screenSM})`]: {
      [`${componentCls}`]: {
        [`${componentCls}-item`]: {
          flexWrap: 'wrap',
          [`${componentCls}-action`]: {
            marginInlineStart: marginSM
          }
        }
      },
      [`${componentCls}-vertical`]: {
        [`${componentCls}-item`]: {
          flexWrap: 'wrap-reverse',
          [`${componentCls}-item-main`]: {
            minWidth: token.contentWidth
          },
          [`${componentCls}-item-extra`]: {
            margin: `auto auto ${margin}px`
          }
        }
      }
    }
  };
};
// =============================== Base ===============================
const genBaseStyle = token => {
  const {
    componentCls,
    antCls,
    controlHeight,
    minHeight,
    paddingSM,
    marginLG,
    padding,
    listItemPadding,
    colorPrimary,
    listItemPaddingSM,
    listItemPaddingLG,
    paddingXS,
    margin,
    colorText,
    colorTextDescription,
    motionDurationSlow,
    lineWidth
  } = token;
  return {
    [`${componentCls}`]: _extends(_extends({}, resetComponent(token)), {
      position: 'relative',
      '*': {
        outline: 'none'
      },
      [`${componentCls}-header, ${componentCls}-footer`]: {
        background: 'transparent',
        paddingBlock: paddingSM
      },
      [`${componentCls}-pagination`]: {
        marginBlockStart: marginLG,
        textAlign: 'end',
        // https://github.com/ant-design/ant-design/issues/20037
        [`${antCls}-pagination-options`]: {
          textAlign: 'start'
        }
      },
      [`${componentCls}-spin`]: {
        minHeight,
        textAlign: 'center'
      },
      [`${componentCls}-items`]: {
        margin: 0,
        padding: 0,
        listStyle: 'none'
      },
      [`${componentCls}-item`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: listItemPadding,
        color: colorText,
        [`${componentCls}-item-meta`]: {
          display: 'flex',
          flex: 1,
          alignItems: 'flex-start',
          maxWidth: '100%',
          [`${componentCls}-item-meta-avatar`]: {
            marginInlineEnd: padding
          },
          [`${componentCls}-item-meta-content`]: {
            flex: '1 0',
            width: 0,
            color: colorText
          },
          [`${componentCls}-item-meta-title`]: {
            marginBottom: token.marginXXS,
            color: colorText,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight,
            '> a': {
              color: colorText,
              transition: `all ${motionDurationSlow}`,
              [`&:hover`]: {
                color: colorPrimary
              }
            }
          },
          [`${componentCls}-item-meta-description`]: {
            color: colorTextDescription,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight
          }
        },
        [`${componentCls}-item-action`]: {
          flex: '0 0 auto',
          marginInlineStart: token.marginXXL,
          padding: 0,
          fontSize: 0,
          listStyle: 'none',
          [`& > li`]: {
            position: 'relative',
            display: 'inline-block',
            padding: `0 ${paddingXS}px`,
            color: colorTextDescription,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight,
            textAlign: 'center',
            [`&:first-child`]: {
              paddingInlineStart: 0
            }
          },
          [`${componentCls}-item-action-split`]: {
            position: 'absolute',
            insetBlockStart: '50%',
            insetInlineEnd: 0,
            width: lineWidth,
            height: Math.ceil(token.fontSize * token.lineHeight) - token.marginXXS * 2,
            transform: 'translateY(-50%)',
            backgroundColor: token.colorSplit
          }
        }
      },
      [`${componentCls}-empty`]: {
        padding: `${padding}px 0`,
        color: colorTextDescription,
        fontSize: token.fontSizeSM,
        textAlign: 'center'
      },
      [`${componentCls}-empty-text`]: {
        padding,
        color: token.colorTextDisabled,
        fontSize: token.fontSize,
        textAlign: 'center'
      },
      // ============================ without flex ============================
      [`${componentCls}-item-no-flex`]: {
        display: 'block'
      }
    }),
    [`${componentCls}-grid ${antCls}-col > ${componentCls}-item`]: {
      display: 'block',
      maxWidth: '100%',
      marginBlockEnd: margin,
      paddingBlock: 0,
      borderBlockEnd: 'none'
    },
    [`${componentCls}-vertical ${componentCls}-item`]: {
      alignItems: 'initial',
      [`${componentCls}-item-main`]: {
        display: 'block',
        flex: 1
      },
      [`${componentCls}-item-extra`]: {
        marginInlineStart: marginLG
      },
      [`${componentCls}-item-meta`]: {
        marginBlockEnd: padding,
        [`${componentCls}-item-meta-title`]: {
          marginBlockEnd: paddingSM,
          color: colorText,
          fontSize: token.fontSizeLG,
          lineHeight: token.lineHeightLG
        }
      },
      [`${componentCls}-item-action`]: {
        marginBlockStart: padding,
        marginInlineStart: 'auto',
        '> li': {
          padding: `0 ${padding}px`,
          [`&:first-child`]: {
            paddingInlineStart: 0
          }
        }
      }
    },
    [`${componentCls}-split ${componentCls}-item`]: {
      borderBlockEnd: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
      [`&:last-child`]: {
        borderBlockEnd: 'none'
      }
    },
    [`${componentCls}-split ${componentCls}-header`]: {
      borderBlockEnd: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-split${componentCls}-empty ${componentCls}-footer`]: {
      borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-loading ${componentCls}-spin-nested-loading`]: {
      minHeight: controlHeight
    },
    [`${componentCls}-split${componentCls}-something-after-last-item ${antCls}-spin-container > ${componentCls}-items > ${componentCls}-item:last-child`]: {
      borderBlockEnd: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-lg ${componentCls}-item`]: {
      padding: listItemPaddingLG
    },
    [`${componentCls}-sm ${componentCls}-item`]: {
      padding: listItemPaddingSM
    },
    // Horizontal
    [`${componentCls}:not(${componentCls}-vertical)`]: {
      [`${componentCls}-item-no-flex`]: {
        [`${componentCls}-item-action`]: {
          float: 'right'
        }
      }
    }
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('List', token => {
  const listToken = merge(token, {
    listBorderedCls: `${token.componentCls}-bordered`,
    minHeight: token.controlHeightLG,
    listItemPadding: `${token.paddingContentVertical}px ${token.paddingContentHorizontalLG}px`,
    listItemPaddingSM: `${token.paddingContentVerticalSM}px ${token.paddingContentHorizontal}px`,
    listItemPaddingLG: `${token.paddingContentVerticalLG}px ${token.paddingContentHorizontalLG}px`
  });
  return [genBaseStyle(listToken), genBorderedStyle(listToken), genResponsiveStyle(listToken)];
}, {
  contentWidth: 220
});

const listProps = () => ({
  bordered: booleanType(),
  dataSource: arrayType(),
  extra: vNodeType(),
  grid: objectType(),
  itemLayout: String,
  loading: someType([Boolean, Object]),
  loadMore: vNodeType(),
  pagination: someType([Boolean, Object]),
  prefixCls: String,
  rowKey: someType([String, Number, Function]),
  renderItem: functionType(),
  size: String,
  split: booleanType(),
  header: vNodeType(),
  footer: vNodeType(),
  locale: objectType()
});
const List = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AList',
  inheritAttrs: false,
  Item: ListItem,
  props: initDefaultProps(listProps(), {
    dataSource: [],
    bordered: false,
    split: true,
    loading: false,
    pagination: false
  }),
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    var _a, _b;
    provide(ListContextKey, {
      grid: toRef(props, 'grid'),
      itemLayout: toRef(props, 'itemLayout')
    });
    const defaultPaginationProps = {
      current: 1,
      total: 0
    };
    const {
      prefixCls,
      direction,
      renderEmpty
    } = useConfigInject('list', props);
    // Style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const paginationObj = computed(() => props.pagination && typeof props.pagination === 'object' ? props.pagination : {});
    const paginationCurrent = ref((_a = paginationObj.value.defaultCurrent) !== null && _a !== void 0 ? _a : 1);
    const paginationSize = ref((_b = paginationObj.value.defaultPageSize) !== null && _b !== void 0 ? _b : 10);
    watch(paginationObj, () => {
      if ('current' in paginationObj.value) {
        paginationCurrent.value = paginationObj.value.current;
      }
      if ('pageSize' in paginationObj.value) {
        paginationSize.value = paginationObj.value.pageSize;
      }
    });
    const listItemsKeys = [];
    const triggerPaginationEvent = eventName => (page, pageSize) => {
      paginationCurrent.value = page;
      paginationSize.value = pageSize;
      if (paginationObj.value[eventName]) {
        paginationObj.value[eventName](page, pageSize);
      }
    };
    const onPaginationChange = triggerPaginationEvent('onChange');
    const onPaginationShowSizeChange = triggerPaginationEvent('onShowSizeChange');
    const loadingProp = computed(() => {
      if (typeof props.loading === 'boolean') {
        return {
          spinning: props.loading
        };
      } else {
        return props.loading;
      }
    });
    const isLoading = computed(() => loadingProp.value && loadingProp.value.spinning);
    const sizeCls = computed(() => {
      let size = '';
      switch (props.size) {
        case 'large':
          size = 'lg';
          break;
        case 'small':
          size = 'sm';
          break;
      }
      return size;
    });
    const classObj = computed(() => ({
      [`${prefixCls.value}`]: true,
      [`${prefixCls.value}-vertical`]: props.itemLayout === 'vertical',
      [`${prefixCls.value}-${sizeCls.value}`]: sizeCls.value,
      [`${prefixCls.value}-split`]: props.split,
      [`${prefixCls.value}-bordered`]: props.bordered,
      [`${prefixCls.value}-loading`]: isLoading.value,
      [`${prefixCls.value}-grid`]: !!props.grid,
      [`${prefixCls.value}-rtl`]: direction.value === 'rtl'
    }));
    const paginationProps = computed(() => {
      const pp = _extends(_extends(_extends({}, defaultPaginationProps), {
        total: props.dataSource.length,
        current: paginationCurrent.value,
        pageSize: paginationSize.value
      }), props.pagination || {});
      const largestPage = Math.ceil(pp.total / pp.pageSize);
      if (pp.current > largestPage) {
        pp.current = largestPage;
      }
      return pp;
    });
    const splitDataSource = computed(() => {
      let dd = [...props.dataSource];
      if (props.pagination) {
        if (props.dataSource.length > (paginationProps.value.current - 1) * paginationProps.value.pageSize) {
          dd = [...props.dataSource].splice((paginationProps.value.current - 1) * paginationProps.value.pageSize, paginationProps.value.pageSize);
        }
      }
      return dd;
    });
    const screens = useBreakpoint();
    const currentBreakpoint = eagerComputed(() => {
      for (let i = 0; i < responsiveArray.length; i += 1) {
        const breakpoint = responsiveArray[i];
        if (screens.value[breakpoint]) {
          return breakpoint;
        }
      }
      return undefined;
    });
    const colStyle = computed(() => {
      if (!props.grid) {
        return undefined;
      }
      const columnCount = currentBreakpoint.value && props.grid[currentBreakpoint.value] ? props.grid[currentBreakpoint.value] : props.grid.column;
      if (columnCount) {
        return {
          width: `${100 / columnCount}%`,
          maxWidth: `${100 / columnCount}%`
        };
      }
      return undefined;
    });
    const renderInnerItem = (item, index) => {
      var _a;
      const renderItem = (_a = props.renderItem) !== null && _a !== void 0 ? _a : slots.renderItem;
      if (!renderItem) return null;
      let key;
      const rowKeyType = typeof props.rowKey;
      if (rowKeyType === 'function') {
        key = props.rowKey(item);
      } else if (rowKeyType === 'string' || rowKeyType === 'number') {
        key = item[props.rowKey];
      } else {
        key = item.key;
      }
      if (!key) {
        key = `list-item-${index}`;
      }
      listItemsKeys[index] = key;
      return renderItem({
        item,
        index
      });
    };
    return () => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const loadMore = (_a = props.loadMore) !== null && _a !== void 0 ? _a : (_b = slots.loadMore) === null || _b === void 0 ? void 0 : _b.call(slots);
      const footer = (_c = props.footer) !== null && _c !== void 0 ? _c : (_d = slots.footer) === null || _d === void 0 ? void 0 : _d.call(slots);
      const header = (_e = props.header) !== null && _e !== void 0 ? _e : (_f = slots.header) === null || _f === void 0 ? void 0 : _f.call(slots);
      const children = flattenChildren((_g = slots.default) === null || _g === void 0 ? void 0 : _g.call(slots));
      const isSomethingAfterLastItem = !!(loadMore || props.pagination || footer);
      const classString = classNames(_extends(_extends({}, classObj.value), {
        [`${prefixCls.value}-something-after-last-item`]: isSomethingAfterLastItem
      }), attrs.class, hashId.value);
      const paginationContent = props.pagination ? createVNode("div", {
        "class": `${prefixCls.value}-pagination`
      }, [createVNode(Pagination, _objectSpread(_objectSpread({}, paginationProps.value), {}, {
        "onChange": onPaginationChange,
        "onShowSizeChange": onPaginationShowSizeChange
      }), null)]) : null;
      let childrenContent = isLoading.value && createVNode("div", {
        "style": {
          minHeight: '53px'
        }
      }, null);
      if (splitDataSource.value.length > 0) {
        listItemsKeys.length = 0;
        const items = splitDataSource.value.map((item, index) => renderInnerItem(item, index));
        const childrenList = items.map((child, index) => createVNode("div", {
          "key": listItemsKeys[index],
          "style": colStyle.value
        }, [child]));
        childrenContent = props.grid ? createVNode(ARow, {
          "gutter": props.grid.gutter
        }, {
          default: () => [childrenList]
        }) : createVNode("ul", {
          "class": `${prefixCls.value}-items`
        }, [items]);
      } else if (!children.length && !isLoading.value) {
        childrenContent = createVNode("div", {
          "class": `${prefixCls.value}-empty-text`
        }, [((_h = props.locale) === null || _h === void 0 ? void 0 : _h.emptyText) || renderEmpty('List')]);
      }
      const paginationPosition = paginationProps.value.position || 'bottom';
      return wrapSSR(createVNode("div", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": classString
      }), [(paginationPosition === 'top' || paginationPosition === 'both') && paginationContent, header && createVNode("div", {
        "class": `${prefixCls.value}-header`
      }, [header]), createVNode(Spin, loadingProp.value, {
        default: () => [childrenContent, children]
      }), footer && createVNode("div", {
        "class": `${prefixCls.value}-footer`
      }, [footer]), loadMore || (paginationPosition === 'bottom' || paginationPosition === 'both') && paginationContent]));
    };
  }
});
/* istanbul ignore next */
List.install = function (app) {
  app.component(List.name, List);
  app.component(List.Item.name, List.Item);
  app.component(List.Item.Meta.name, List.Item.Meta);
  return app;
};

export { List as L, ListItem as a, ListItemMeta as b };
//# sourceMappingURL=index18.mjs.map
