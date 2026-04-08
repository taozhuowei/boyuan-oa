import _extends from '@babel/runtime/helpers/esm/extends';
import { defineComponent, reactive, provide, watch, computed, onMounted, onUnmounted, createVNode, Teleport, ref, TransitionGroup, toRaw, shallowRef, render, watchEffect } from 'vue';
import { U as localeValues, w as withInstall, K as warning, c as classNames, aO as getTransitionGroupProps, aV as Portal, g as genComponentStyleHook, m as merge, a9 as Keyframe, r as resetComponent, L as LoadingOutlined, C as CloseCircleFilled, ai as useConfigContextInject, aW as wrapPromiseFn, u as useConfigInject, a as CloseOutlined, aX as getMotion$1, aY as renderHelper, aM as useToken, aZ as useStyleRegister, G as resetIcon, a_ as defaultConfig, a$ as defaultIconPrefixCls, b0 as createTheme, b1 as seedToken, b2 as useConfigContextProvider, b3 as useProvideGlobalForm, aP as useProviderSize, aQ as useProviderDisabled, b4 as LocaleReceiver, b5 as configProviderProps, b6 as DesignTokenProvider, b7 as renderEmpty } from './collapseMotion.mjs';
import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { b as InfoCircleFilled, E as ExclamationCircleOutlined, C as CloseCircleOutlined, I as InfoCircleOutlined, a as CheckCircleOutlined } from './InfoCircleFilled.mjs';
import { E as ExclamationCircleFilled, C as CheckCircleFilled } from './ExclamationCircleFilled.mjs';
import { TinyColor } from '@ctrl/tinycolor';
import { generate } from '@ant-design/colors';

let runtimeLocale = _extends({}, localeValues.Modal);
function changeConfirmLocale(newLocale) {
  if (newLocale) {
    runtimeLocale = _extends(_extends({}, runtimeLocale), newLocale);
  } else {
    runtimeLocale = _extends({}, localeValues.Modal);
  }
}
function getConfirmLocale() {
  return runtimeLocale;
}

const ANT_MARK = 'internalMark';
const LocaleProvider = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ALocaleProvider',
  props: {
    locale: {
      type: Object
    },
    ANT_MARK__: String
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    warning(props.ANT_MARK__ === ANT_MARK);
    const state = reactive({
      antLocale: _extends(_extends({}, props.locale), {
        exist: true
      }),
      ANT_MARK__: ANT_MARK
    });
    provide('localeData', state);
    watch(() => props.locale, locale => {
      changeConfirmLocale(locale && locale.Modal);
      state.antLocale = _extends(_extends({}, locale), {
        exist: true
      });
    }, {
      immediate: true
    });
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});
/* istanbul ignore next */
LocaleProvider.install = function (app) {
  app.component(LocaleProvider.name, LocaleProvider);
  return app;
};
const locale = withInstall(LocaleProvider);

const Notice = defineComponent({
  name: 'Notice',
  inheritAttrs: false,
  props: ['prefixCls', 'duration', 'updateMark', 'noticeKey', 'closeIcon', 'closable', 'props', 'onClick', 'onClose', 'holder', 'visible'],
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    let closeTimer;
    let isUnMounted = false;
    const duration = computed(() => props.duration === undefined ? 4.5 : props.duration);
    const startCloseTimer = () => {
      if (duration.value && !isUnMounted) {
        closeTimer = setTimeout(() => {
          close();
        }, duration.value * 1000);
      }
    };
    const clearCloseTimer = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    const close = e => {
      if (e) {
        e.stopPropagation();
      }
      clearCloseTimer();
      const {
        onClose,
        noticeKey
      } = props;
      if (onClose) {
        onClose(noticeKey);
      }
    };
    const restartCloseTimer = () => {
      clearCloseTimer();
      startCloseTimer();
    };
    onMounted(() => {
      startCloseTimer();
    });
    onUnmounted(() => {
      isUnMounted = true;
      clearCloseTimer();
    });
    watch([duration, () => props.updateMark, () => props.visible], (_ref2, _ref3) => {
      let [preDuration, preUpdateMark, preVisible] = _ref2;
      let [newDuration, newUpdateMark, newVisible] = _ref3;
      if (preDuration !== newDuration || preUpdateMark !== newUpdateMark || preVisible !== newVisible && newVisible) {
        restartCloseTimer();
      }
    }, {
      flush: 'post'
    });
    return () => {
      var _a, _b;
      const {
        prefixCls,
        closable,
        closeIcon = (_a = slots.closeIcon) === null || _a === void 0 ? void 0 : _a.call(slots),
        onClick,
        holder
      } = props;
      const {
        class: className,
        style
      } = attrs;
      const componentClass = `${prefixCls}-notice`;
      const dataOrAriaAttributeProps = Object.keys(attrs).reduce((acc, key) => {
        if (key.startsWith('data-') || key.startsWith('aria-') || key === 'role') {
          acc[key] = attrs[key];
        }
        return acc;
      }, {});
      const node = createVNode("div", _objectSpread({
        "class": classNames(componentClass, className, {
          [`${componentClass}-closable`]: closable
        }),
        "style": style,
        "onMouseenter": clearCloseTimer,
        "onMouseleave": startCloseTimer,
        "onClick": onClick
      }, dataOrAriaAttributeProps), [createVNode("div", {
        "class": `${componentClass}-content`
      }, [(_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots)]), closable ? createVNode("a", {
        "tabindex": 0,
        "onClick": close,
        "class": `${componentClass}-close`
      }, [closeIcon || createVNode("span", {
        "class": `${componentClass}-close-x`
      }, null)]) : null]);
      if (holder) {
        return createVNode(Teleport, {
          "to": holder
        }, {
          default: () => node
        });
      }
      return node;
    };
  }
});

var __rest$4 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
let seed$1 = 0;
const now$1 = Date.now();
function getUuid$1() {
  const id = seed$1;
  seed$1 += 1;
  return `rcNotification_${now$1}_${id}`;
}
const Notification$1 = defineComponent({
  name: 'Notification',
  inheritAttrs: false,
  props: ['prefixCls', 'transitionName', 'animation', 'maxCount', 'closeIcon', 'hashId'],
  setup(props, _ref) {
    let {
      attrs,
      expose,
      slots
    } = _ref;
    const hookRefs = new Map();
    const notices = ref([]);
    const transitionProps = computed(() => {
      const {
        prefixCls,
        animation = 'fade'
      } = props;
      let name = props.transitionName;
      if (!name && animation) {
        name = `${prefixCls}-${animation}`;
      }
      return getTransitionGroupProps(name);
    });
    const add = (originNotice, holderCallback) => {
      const key = originNotice.key || getUuid$1();
      const notice = _extends(_extends({}, originNotice), {
        key
      });
      const {
        maxCount
      } = props;
      const noticeIndex = notices.value.map(v => v.notice.key).indexOf(key);
      const updatedNotices = notices.value.concat();
      if (noticeIndex !== -1) {
        updatedNotices.splice(noticeIndex, 1, {
          notice,
          holderCallback
        });
      } else {
        if (maxCount && notices.value.length >= maxCount) {
          // XXX, use key of first item to update new added (let React to move exsiting
          // instead of remove and mount). Same key was used before for both a) external
          // manual control and b) internal react 'key' prop , which is not that good.
          // eslint-disable-next-line no-param-reassign
          // zombieJ: Not know why use `updateKey`. This makes Notice infinite loop in jest.
          // Change to `updateMark` for compare instead.
          // https://github.com/react-component/notification/commit/32299e6be396f94040bfa82517eea940db947ece
          notice.key = updatedNotices[0].notice.key;
          notice.updateMark = getUuid$1();
          // zombieJ: That's why. User may close by key directly.
          // We need record this but not re-render to avoid upper issue
          // https://github.com/react-component/notification/issues/129
          notice.userPassKey = key;
          updatedNotices.shift();
        }
        updatedNotices.push({
          notice,
          holderCallback
        });
      }
      notices.value = updatedNotices;
    };
    const remove = removeKey => {
      notices.value = toRaw(notices.value).filter(_ref2 => {
        let {
          notice: {
            key,
            userPassKey
          }
        } = _ref2;
        const mergedKey = userPassKey || key;
        return mergedKey !== removeKey;
      });
    };
    expose({
      add,
      remove,
      notices
    });
    return () => {
      var _a;
      const {
        prefixCls,
        closeIcon = (_a = slots.closeIcon) === null || _a === void 0 ? void 0 : _a.call(slots, {
          prefixCls
        })
      } = props;
      const noticeNodes = notices.value.map((_ref3, index) => {
        let {
          notice,
          holderCallback
        } = _ref3;
        const updateMark = index === notices.value.length - 1 ? notice.updateMark : undefined;
        const {
          key,
          userPassKey
        } = notice;
        const {
          content
        } = notice;
        const noticeProps = _extends(_extends(_extends({
          prefixCls,
          closeIcon: typeof closeIcon === 'function' ? closeIcon({
            prefixCls
          }) : closeIcon
        }, notice), notice.props), {
          key,
          noticeKey: userPassKey || key,
          updateMark,
          onClose: noticeKey => {
            var _a;
            remove(noticeKey);
            (_a = notice.onClose) === null || _a === void 0 ? void 0 : _a.call(notice);
          },
          onClick: notice.onClick
        });
        if (holderCallback) {
          return createVNode("div", {
            "key": key,
            "class": `${prefixCls}-hook-holder`,
            "ref": div => {
              if (typeof key === 'undefined') {
                return;
              }
              if (div) {
                hookRefs.set(key, div);
                holderCallback(div, noticeProps);
              } else {
                hookRefs.delete(key);
              }
            }
          }, null);
        }
        return createVNode(Notice, _objectSpread(_objectSpread({}, noticeProps), {}, {
          "class": classNames(noticeProps.class, props.hashId)
        }), {
          default: () => [typeof content === 'function' ? content({
            prefixCls
          }) : content]
        });
      });
      const className = {
        [prefixCls]: 1,
        [attrs.class]: !!attrs.class,
        [props.hashId]: true
      };
      return createVNode("div", {
        "class": className,
        "style": attrs.style || {
          top: '65px',
          left: '50%'
        }
      }, [createVNode(TransitionGroup, _objectSpread({
        "tag": "div"
      }, transitionProps.value), {
        default: () => [noticeNodes]
      })]);
    };
  }
});
Notification$1.newInstance = function newNotificationInstance(properties, callback) {
  const _a = properties || {},
    {
      name = 'notification',
      getContainer,
      appContext,
      prefixCls: customizePrefixCls,
      rootPrefixCls: customRootPrefixCls,
      transitionName: customTransitionName,
      hasTransitionName,
      useStyle
    } = _a,
    props = __rest$4(_a, ["name", "getContainer", "appContext", "prefixCls", "rootPrefixCls", "transitionName", "hasTransitionName", "useStyle"]);
  const div = document.createElement('div');
  if (getContainer) {
    const root = getContainer();
    root.appendChild(div);
  } else {
    document.body.appendChild(div);
  }
  const Wrapper = defineComponent({
    compatConfig: {
      MODE: 3
    },
    name: 'NotificationWrapper',
    setup(_props, _ref4) {
      let {
        attrs
      } = _ref4;
      const notiRef = shallowRef();
      const prefixCls = computed(() => globalConfigForApi.getPrefixCls(name, customizePrefixCls));
      const [, hashId] = useStyle(prefixCls);
      onMounted(() => {
        callback({
          notice(noticeProps) {
            var _a;
            (_a = notiRef.value) === null || _a === void 0 ? void 0 : _a.add(noticeProps);
          },
          removeNotice(key) {
            var _a;
            (_a = notiRef.value) === null || _a === void 0 ? void 0 : _a.remove(key);
          },
          destroy() {
            render(null, div);
            if (div.parentNode) {
              div.parentNode.removeChild(div);
            }
          },
          component: notiRef
        });
      });
      return () => {
        const global = globalConfigForApi;
        const rootPrefixCls = global.getRootPrefixCls(customRootPrefixCls, prefixCls.value);
        const transitionName = hasTransitionName ? customTransitionName : `${prefixCls.value}-${customTransitionName}`;
        return createVNode(ConfigProvider, _objectSpread(_objectSpread({}, global), {}, {
          "prefixCls": rootPrefixCls
        }), {
          default: () => [createVNode(Notification$1, _objectSpread(_objectSpread({
            "ref": notiRef
          }, attrs), {}, {
            "prefixCls": prefixCls.value,
            "transitionName": transitionName,
            "hashId": hashId.value
          }), null)]
        });
      };
    }
  });
  const vm = createVNode(Wrapper, props);
  vm.appContext = appContext || vm.appContext;
  render(vm, div);
};

let seed = 0;
const now = Date.now();
function getUuid() {
  const id = seed;
  seed += 1;
  return `rcNotification_${now}_${id}`;
}
const Notification = defineComponent({
  name: 'HookNotification',
  inheritAttrs: false,
  props: ['prefixCls', 'transitionName', 'animation', 'maxCount', 'closeIcon', 'hashId', 'remove', 'notices', 'getStyles', 'getClassName', 'onAllRemoved', 'getContainer'],
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const hookRefs = new Map();
    const notices = computed(() => props.notices);
    const transitionProps = computed(() => {
      let name = props.transitionName;
      if (!name && props.animation) {
        switch (typeof props.animation) {
          case 'string':
            name = props.animation;
            break;
          case 'function':
            name = props.animation().name;
            break;
          case 'object':
            name = props.animation.name;
            break;
          default:
            name = `${props.prefixCls}-fade`;
            break;
        }
      }
      return getTransitionGroupProps(name);
    });
    const remove = key => props.remove(key);
    const placements = ref({});
    watch(notices, () => {
      const nextPlacements = {};
      // init placements with animation
      Object.keys(placements.value).forEach(placement => {
        nextPlacements[placement] = [];
      });
      props.notices.forEach(config => {
        const {
          placement = 'topRight'
        } = config.notice;
        if (placement) {
          nextPlacements[placement] = nextPlacements[placement] || [];
          nextPlacements[placement].push(config);
        }
      });
      placements.value = nextPlacements;
    });
    const placementList = computed(() => Object.keys(placements.value));
    return () => {
      var _a;
      const {
        prefixCls,
        closeIcon = (_a = slots.closeIcon) === null || _a === void 0 ? void 0 : _a.call(slots, {
          prefixCls
        })
      } = props;
      const noticeNodes = placementList.value.map(placement => {
        var _a, _b;
        const noticesForPlacement = placements.value[placement];
        const classes = (_a = props.getClassName) === null || _a === void 0 ? void 0 : _a.call(props, placement);
        const styles = (_b = props.getStyles) === null || _b === void 0 ? void 0 : _b.call(props, placement);
        const noticeNodesForPlacement = noticesForPlacement.map((_ref2, index) => {
          let {
            notice,
            holderCallback
          } = _ref2;
          const updateMark = index === notices.value.length - 1 ? notice.updateMark : undefined;
          const {
            key,
            userPassKey
          } = notice;
          const {
            content
          } = notice;
          const noticeProps = _extends(_extends(_extends({
            prefixCls,
            closeIcon: typeof closeIcon === 'function' ? closeIcon({
              prefixCls
            }) : closeIcon
          }, notice), notice.props), {
            key,
            noticeKey: userPassKey || key,
            updateMark,
            onClose: noticeKey => {
              var _a;
              remove(noticeKey);
              (_a = notice.onClose) === null || _a === void 0 ? void 0 : _a.call(notice);
            },
            onClick: notice.onClick
          });
          if (holderCallback) {
            return createVNode("div", {
              "key": key,
              "class": `${prefixCls}-hook-holder`,
              "ref": div => {
                if (typeof key === 'undefined') {
                  return;
                }
                if (div) {
                  hookRefs.set(key, div);
                  holderCallback(div, noticeProps);
                } else {
                  hookRefs.delete(key);
                }
              }
            }, null);
          }
          return createVNode(Notice, _objectSpread(_objectSpread({}, noticeProps), {}, {
            "class": classNames(noticeProps.class, props.hashId)
          }), {
            default: () => [typeof content === 'function' ? content({
              prefixCls
            }) : content]
          });
        });
        const className = {
          [prefixCls]: 1,
          [`${prefixCls}-${placement}`]: 1,
          [attrs.class]: !!attrs.class,
          [props.hashId]: true,
          [classes]: !!classes
        };
        function onAfterLeave() {
          var _a;
          if (noticesForPlacement.length > 0) {
            return;
          }
          Reflect.deleteProperty(placements.value, placement);
          (_a = props.onAllRemoved) === null || _a === void 0 ? void 0 : _a.call(props);
        }
        return createVNode("div", {
          "key": placement,
          "class": className,
          "style": attrs.style || styles || {
            top: '65px',
            left: '50%'
          }
        }, [createVNode(TransitionGroup, _objectSpread(_objectSpread({
          "tag": "div"
        }, transitionProps.value), {}, {
          "onAfterLeave": onAfterLeave
        }), {
          default: () => [noticeNodesForPlacement]
        })]);
      });
      return createVNode(Portal, {
        "getContainer": props.getContainer
      }, {
        default: () => [noticeNodes]
      });
    };
  }
});

var __rest$3 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const defaultGetContainer$1 = () => document.body;
let uniqueKey = 0;
function mergeConfig() {
  const clone = {};
  for (var _len = arguments.length, objList = new Array(_len), _key = 0; _key < _len; _key++) {
    objList[_key] = arguments[_key];
  }
  objList.forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val !== undefined) {
          clone[key] = val;
        }
      });
    }
  });
  return clone;
}
function useNotification$1() {
  let rootConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const {
      getContainer = defaultGetContainer$1,
      motion,
      prefixCls,
      maxCount,
      getClassName,
      getStyles,
      onAllRemoved
    } = rootConfig,
    shareConfig = __rest$3(rootConfig, ["getContainer", "motion", "prefixCls", "maxCount", "getClassName", "getStyles", "onAllRemoved"]);
  const notices = shallowRef([]);
  const notificationsRef = shallowRef();
  const add = (originNotice, holderCallback) => {
    const key = originNotice.key || getUuid();
    const notice = _extends(_extends({}, originNotice), {
      key
    });
    const noticeIndex = notices.value.map(v => v.notice.key).indexOf(key);
    const updatedNotices = notices.value.concat();
    if (noticeIndex !== -1) {
      updatedNotices.splice(noticeIndex, 1, {
        notice,
        holderCallback
      });
    } else {
      if (maxCount && notices.value.length >= maxCount) {
        notice.key = updatedNotices[0].notice.key;
        notice.updateMark = getUuid();
        notice.userPassKey = key;
        updatedNotices.shift();
      }
      updatedNotices.push({
        notice,
        holderCallback
      });
    }
    notices.value = updatedNotices;
  };
  const removeNotice = removeKey => {
    notices.value = notices.value.filter(_ref => {
      let {
        notice: {
          key,
          userPassKey
        }
      } = _ref;
      const mergedKey = userPassKey || key;
      return mergedKey !== removeKey;
    });
  };
  const destroy = () => {
    notices.value = [];
  };
  const contextHolder = () => createVNode(Notification, {
    "ref": notificationsRef,
    "prefixCls": prefixCls,
    "maxCount": maxCount,
    "notices": notices.value,
    "remove": removeNotice,
    "getClassName": getClassName,
    "getStyles": getStyles,
    "animation": motion,
    "hashId": rootConfig.hashId,
    "onAllRemoved": onAllRemoved,
    "getContainer": getContainer
  }, null);
  const taskQueue = shallowRef([]);
  // ========================= Refs =========================
  const api = {
    open: config => {
      const mergedConfig = mergeConfig(shareConfig, config);
      //@ts-ignore
      if (mergedConfig.key === null || mergedConfig.key === undefined) {
        //@ts-ignore
        mergedConfig.key = `vc-notification-${uniqueKey}`;
        uniqueKey += 1;
      }
      taskQueue.value = [...taskQueue.value, {
        type: 'open',
        config: mergedConfig
      }];
    },
    close: key => {
      taskQueue.value = [...taskQueue.value, {
        type: 'close',
        key
      }];
    },
    destroy: () => {
      taskQueue.value = [...taskQueue.value, {
        type: 'destroy'
      }];
    }
  };
  // ======================== Effect ========================
  watch(taskQueue, () => {
    // Flush task when node ready
    if (taskQueue.value.length) {
      taskQueue.value.forEach(task => {
        switch (task.type) {
          case 'open':
            // @ts-ignore
            add(task.config);
            break;
          case 'close':
            removeNotice(task.key);
            break;
          case 'destroy':
            destroy();
            break;
        }
      });
      taskQueue.value = [];
    }
  });
  // ======================== Return ========================
  return [api, contextHolder];
}

const genMessageStyle = token => {
  const {
    componentCls,
    iconCls,
    boxShadowSecondary,
    colorBgElevated,
    colorSuccess,
    colorError,
    colorWarning,
    colorInfo,
    fontSizeLG,
    motionEaseInOutCirc,
    motionDurationSlow,
    marginXS,
    paddingXS,
    borderRadiusLG,
    zIndexPopup,
    // Custom token
    messageNoticeContentPadding
  } = token;
  const messageMoveIn = new Keyframe('MessageMoveIn', {
    '0%': {
      padding: 0,
      transform: 'translateY(-100%)',
      opacity: 0
    },
    '100%': {
      padding: paddingXS,
      transform: 'translateY(0)',
      opacity: 1
    }
  });
  const messageMoveOut = new Keyframe('MessageMoveOut', {
    '0%': {
      maxHeight: token.height,
      padding: paddingXS,
      opacity: 1
    },
    '100%': {
      maxHeight: 0,
      padding: 0,
      opacity: 0
    }
  });
  return [
  // ============================ Holder ============================
  {
    [componentCls]: _extends(_extends({}, resetComponent(token)), {
      position: 'fixed',
      top: marginXS,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      pointerEvents: 'none',
      zIndex: zIndexPopup,
      [`${componentCls}-move-up`]: {
        animationFillMode: 'forwards'
      },
      [`
        ${componentCls}-move-up-appear,
        ${componentCls}-move-up-enter
      `]: {
        animationName: messageMoveIn,
        animationDuration: motionDurationSlow,
        animationPlayState: 'paused',
        animationTimingFunction: motionEaseInOutCirc
      },
      [`
        ${componentCls}-move-up-appear${componentCls}-move-up-appear-active,
        ${componentCls}-move-up-enter${componentCls}-move-up-enter-active
      `]: {
        animationPlayState: 'running'
      },
      [`${componentCls}-move-up-leave`]: {
        animationName: messageMoveOut,
        animationDuration: motionDurationSlow,
        animationPlayState: 'paused',
        animationTimingFunction: motionEaseInOutCirc
      },
      [`${componentCls}-move-up-leave${componentCls}-move-up-leave-active`]: {
        animationPlayState: 'running'
      },
      '&-rtl': {
        direction: 'rtl',
        span: {
          direction: 'rtl'
        }
      }
    })
  },
  // ============================ Notice ============================
  {
    [`${componentCls}-notice`]: {
      padding: paddingXS,
      textAlign: 'center',
      [iconCls]: {
        verticalAlign: 'text-bottom',
        marginInlineEnd: marginXS,
        fontSize: fontSizeLG
      },
      [`${componentCls}-notice-content`]: {
        display: 'inline-block',
        padding: messageNoticeContentPadding,
        background: colorBgElevated,
        borderRadius: borderRadiusLG,
        boxShadow: boxShadowSecondary,
        pointerEvents: 'all'
      },
      [`${componentCls}-success ${iconCls}`]: {
        color: colorSuccess
      },
      [`${componentCls}-error ${iconCls}`]: {
        color: colorError
      },
      [`${componentCls}-warning ${iconCls}`]: {
        color: colorWarning
      },
      [`
        ${componentCls}-info ${iconCls},
        ${componentCls}-loading ${iconCls}`]: {
        color: colorInfo
      }
    }
  },
  // ============================= Pure =============================
  {
    [`${componentCls}-notice-pure-panel`]: {
      padding: 0,
      textAlign: 'start'
    }
  }];
};
// ============================== Export ==============================
const useStyle$2 = genComponentStyleHook('Message', token => {
  // Gen-style functions here
  const combinedToken = merge(token, {
    messageNoticeContentPadding: `${(token.controlHeightLG - token.fontSize * token.lineHeight) / 2}px ${token.paddingSM}px`
  });
  return [genMessageStyle(combinedToken)];
}, token => ({
  height: 150,
  zIndexPopup: token.zIndexPopupBase + 10
}));

const TypeIcon = {
  info: createVNode(InfoCircleFilled, null, null),
  success: createVNode(CheckCircleFilled, null, null),
  error: createVNode(CloseCircleFilled, null, null),
  warning: createVNode(ExclamationCircleFilled, null, null),
  loading: createVNode(LoadingOutlined, null, null)
};
const PureContent$1 = defineComponent({
  name: 'PureContent',
  inheritAttrs: false,
  props: ['prefixCls', 'type', 'icon'],
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      var _a;
      return createVNode("div", {
        "class": classNames(`${props.prefixCls}-custom-content`, `${props.prefixCls}-${props.type}`)
      }, [props.icon || TypeIcon[props.type], createVNode("span", null, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)])]);
    };
  }
});
/** @private Internal Component. Do not use in your production. */
defineComponent({
  name: 'PurePanel',
  inheritAttrs: false,
  props: ['prefixCls', 'class', 'type', 'icon', 'content'],
  setup(props, _ref2) {
    let {
      slots,
      attrs
    } = _ref2;
    var _a;
    const {
      getPrefixCls
    } = useConfigContextInject();
    const prefixCls = computed(() => props.prefixCls || getPrefixCls('message'));
    const [, hashId] = useStyle$2(prefixCls);
    return createVNode(Notice, _objectSpread(_objectSpread({}, attrs), {}, {
      "prefixCls": prefixCls.value,
      "class": classNames(hashId.value, `${prefixCls.value}-notice-pure-panel`),
      "noticeKey": "pure",
      "duration": null
    }), {
      default: () => [createVNode(PureContent$1, {
        "prefixCls": prefixCls.value,
        "type": props.type,
        "icon": props.icon
      }, {
        default: () => [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]
      })]
    });
  }
});

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const DEFAULT_OFFSET$1 = 8;
const DEFAULT_DURATION$1 = 3;
const Holder$1 = defineComponent({
  name: 'Holder',
  inheritAttrs: false,
  props: ['top', 'prefixCls', 'getContainer', 'maxCount', 'duration', 'rtl', 'transitionName', 'onAllRemoved', 'animation', 'staticGetContainer'],
  setup(props, _ref) {
    let {
      expose
    } = _ref;
    var _a, _b;
    const {
      getPrefixCls,
      getPopupContainer
    } = useConfigInject('message', props);
    const prefixCls = computed(() => getPrefixCls('message', props.prefixCls));
    const [, hashId] = useStyle$2(prefixCls);
    // =============================== Style ===============================
    const getStyles = () => {
      var _a;
      const top = (_a = props.top) !== null && _a !== void 0 ? _a : DEFAULT_OFFSET$1;
      return {
        left: '50%',
        transform: 'translateX(-50%)',
        top: typeof top === 'number' ? `${top}px` : top
      };
    };
    const getClassName = () => classNames(hashId.value, props.rtl ? `${prefixCls.value}-rtl` : '');
    // ============================== Motion ===============================
    const getNotificationMotion = () => {
      var _a;
      return getMotion$1({
        prefixCls: prefixCls.value,
        animation: (_a = props.animation) !== null && _a !== void 0 ? _a : `move-up`,
        transitionName: props.transitionName
      });
    };
    // ============================ Close Icon =============================
    const mergedCloseIcon = createVNode("span", {
      "class": `${prefixCls.value}-close-x`
    }, [createVNode(CloseOutlined, {
      "class": `${prefixCls.value}-close-icon`
    }, null)]);
    // ============================== Origin ===============================
    const [api, holder] = useNotification$1({
      //@ts-ignore
      getStyles,
      prefixCls: prefixCls.value,
      getClassName,
      motion: getNotificationMotion,
      closable: false,
      closeIcon: mergedCloseIcon,
      duration: (_a = props.duration) !== null && _a !== void 0 ? _a : DEFAULT_DURATION$1,
      getContainer: (_b = props.staticGetContainer) !== null && _b !== void 0 ? _b : getPopupContainer.value,
      maxCount: props.maxCount,
      onAllRemoved: props.onAllRemoved
    });
    // ================================ Ref ================================
    expose(_extends(_extends({}, api), {
      prefixCls,
      hashId
    }));
    return holder;
  }
});
// ==============================================================================
// ==                                   Hook                                   ==
// ==============================================================================
let keyIndex = 0;
function useInternalMessage(messageConfig) {
  const holderRef = shallowRef(null);
  const holderKey = Symbol('messageHolderKey');
  // ================================ API ================================
  // Wrap with notification content
  // >>> close
  const close = key => {
    var _a;
    (_a = holderRef.value) === null || _a === void 0 ? void 0 : _a.close(key);
  };
  // >>> Open
  const open = config => {
    if (!holderRef.value) {
      const fakeResult = () => {};
      fakeResult.then = () => {};
      return fakeResult;
    }
    const {
      open: originOpen,
      prefixCls,
      hashId
    } = holderRef.value;
    const noticePrefixCls = `${prefixCls}-notice`;
    const {
        content,
        icon,
        type,
        key,
        class: className,
        onClose
      } = config,
      restConfig = __rest$2(config, ["content", "icon", "type", "key", "class", "onClose"]);
    let mergedKey = key;
    if (mergedKey === undefined || mergedKey === null) {
      keyIndex += 1;
      mergedKey = `antd-message-${keyIndex}`;
    }
    return wrapPromiseFn(resolve => {
      originOpen(_extends(_extends({}, restConfig), {
        key: mergedKey,
        content: () => createVNode(PureContent$1, {
          "prefixCls": prefixCls,
          "type": type,
          "icon": typeof icon === 'function' ? icon() : icon
        }, {
          default: () => [typeof content === 'function' ? content() : content]
        }),
        placement: 'top',
        // @ts-ignore
        class: classNames(type && `${noticePrefixCls}-${type}`, hashId, className),
        onClose: () => {
          onClose === null || onClose === void 0 ? void 0 : onClose();
          resolve();
        }
      }));
      // Return close function
      return () => {
        close(mergedKey);
      };
    });
  };
  // >>> destroy
  const destroy = key => {
    var _a;
    if (key !== undefined) {
      close(key);
    } else {
      (_a = holderRef.value) === null || _a === void 0 ? void 0 : _a.destroy();
    }
  };
  const wrapAPI = {
    open,
    destroy
  };
  const keys = ['info', 'success', 'warning', 'error', 'loading'];
  keys.forEach(type => {
    const typeOpen = (jointContent, duration, onClose) => {
      let config;
      if (jointContent && typeof jointContent === 'object' && 'content' in jointContent) {
        config = jointContent;
      } else {
        config = {
          content: jointContent
        };
      }
      // Params
      let mergedDuration;
      let mergedOnClose;
      if (typeof duration === 'function') {
        mergedOnClose = duration;
      } else {
        mergedDuration = duration;
        mergedOnClose = onClose;
      }
      const mergedConfig = _extends(_extends({
        onClose: mergedOnClose,
        duration: mergedDuration
      }, config), {
        type
      });
      return open(mergedConfig);
    };
    wrapAPI[type] = typeOpen;
  });
  // ============================== Return ===============================
  return [wrapAPI, () => createVNode(Holder$1, _objectSpread(_objectSpread({
    "key": holderKey
  }, messageConfig), {}, {
    "ref": holderRef
  }), null)];
}
function useMessage(messageConfig) {
  return useInternalMessage(messageConfig);
}

let defaultDuration$1 = 3;
let defaultTop$1;
let messageInstance;
let key = 1;
let localPrefixCls = '';
let transitionName = 'move-up';
let hasTransitionName = false;
let getContainer = () => document.body;
let maxCount$1;
let rtl$1 = false;
function getKeyThenIncreaseKey() {
  return key++;
}
function setMessageConfig(options) {
  if (options.top !== undefined) {
    defaultTop$1 = options.top;
    messageInstance = null; // delete messageInstance for new defaultTop
  }
  if (options.duration !== undefined) {
    defaultDuration$1 = options.duration;
  }
  if (options.prefixCls !== undefined) {
    localPrefixCls = options.prefixCls;
  }
  if (options.getContainer !== undefined) {
    getContainer = options.getContainer;
    messageInstance = null; // delete messageInstance for new getContainer
  }
  if (options.transitionName !== undefined) {
    transitionName = options.transitionName;
    messageInstance = null; // delete messageInstance for new transitionName
    hasTransitionName = true;
  }
  if (options.maxCount !== undefined) {
    maxCount$1 = options.maxCount;
    messageInstance = null;
  }
  if (options.rtl !== undefined) {
    rtl$1 = options.rtl;
  }
}
function getMessageInstance(args, callback) {
  if (messageInstance) {
    callback(messageInstance);
    return;
  }
  Notification$1.newInstance({
    appContext: args.appContext,
    prefixCls: args.prefixCls || localPrefixCls,
    rootPrefixCls: args.rootPrefixCls,
    transitionName,
    hasTransitionName,
    style: {
      top: defaultTop$1
    },
    getContainer: getContainer || args.getPopupContainer,
    maxCount: maxCount$1,
    name: 'message',
    useStyle: useStyle$2
  }, instance => {
    if (messageInstance) {
      callback(messageInstance);
      return;
    }
    messageInstance = instance;
    callback(instance);
  });
}
const typeToIcon$2 = {
  info: InfoCircleFilled,
  success: CheckCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled,
  loading: LoadingOutlined
};
const typeList = Object.keys(typeToIcon$2);
function notice$1(args) {
  const duration = args.duration !== undefined ? args.duration : defaultDuration$1;
  const target = args.key || getKeyThenIncreaseKey();
  const closePromise = new Promise(resolve => {
    const callback = () => {
      if (typeof args.onClose === 'function') {
        args.onClose();
      }
      return resolve(true);
    };
    getMessageInstance(args, instance => {
      instance.notice({
        key: target,
        duration,
        style: args.style || {},
        class: args.class,
        content: _ref => {
          let {
            prefixCls
          } = _ref;
          const Icon = typeToIcon$2[args.type];
          const iconNode = Icon ? createVNode(Icon, null, null) : '';
          const messageClass = classNames(`${prefixCls}-custom-content`, {
            [`${prefixCls}-${args.type}`]: args.type,
            [`${prefixCls}-rtl`]: rtl$1 === true
          });
          return createVNode("div", {
            "class": messageClass
          }, [typeof args.icon === 'function' ? args.icon() : args.icon || iconNode, createVNode("span", null, [typeof args.content === 'function' ? args.content() : args.content])]);
        },
        onClose: callback,
        onClick: args.onClick
      });
    });
  });
  const result = () => {
    if (messageInstance) {
      messageInstance.removeNotice(target);
    }
  };
  result.then = (filled, rejected) => closePromise.then(filled, rejected);
  result.promise = closePromise;
  return result;
}
function isArgsProps(content) {
  return Object.prototype.toString.call(content) === '[object Object]' && !!content.content;
}
const api$1 = {
  open: notice$1,
  config: setMessageConfig,
  destroy(messageKey) {
    if (messageInstance) {
      if (messageKey) {
        const {
          removeNotice
        } = messageInstance;
        removeNotice(messageKey);
      } else {
        const {
          destroy
        } = messageInstance;
        destroy();
        messageInstance = null;
      }
    }
  }
};
function attachTypeApi(originalApi, type) {
  originalApi[type] = (content, duration, onClose) => {
    if (isArgsProps(content)) {
      return originalApi.open(_extends(_extends({}, content), {
        type
      }));
    }
    if (typeof duration === 'function') {
      onClose = duration;
      duration = undefined;
    }
    return originalApi.open({
      content,
      duration,
      type,
      onClose
    });
  };
}
typeList.forEach(type => attachTypeApi(api$1, type));
api$1.warn = api$1.warning;
api$1.useMessage = useMessage;

const genNotificationPlacementStyle = token => {
  const {
    componentCls,
    width,
    notificationMarginEdge
  } = token;
  const notificationTopFadeIn = new Keyframe('antNotificationTopFadeIn', {
    '0%': {
      marginTop: '-100%',
      opacity: 0
    },
    '100%': {
      marginTop: 0,
      opacity: 1
    }
  });
  const notificationBottomFadeIn = new Keyframe('antNotificationBottomFadeIn', {
    '0%': {
      marginBottom: '-100%',
      opacity: 0
    },
    '100%': {
      marginBottom: 0,
      opacity: 1
    }
  });
  const notificationLeftFadeIn = new Keyframe('antNotificationLeftFadeIn', {
    '0%': {
      right: {
        _skip_check_: true,
        value: width
      },
      opacity: 0
    },
    '100%': {
      right: {
        _skip_check_: true,
        value: 0
      },
      opacity: 1
    }
  });
  return {
    [`&${componentCls}-top, &${componentCls}-bottom`]: {
      marginInline: 0
    },
    [`&${componentCls}-top`]: {
      [`${componentCls}-fade-enter${componentCls}-fade-enter-active, ${componentCls}-fade-appear${componentCls}-fade-appear-active`]: {
        animationName: notificationTopFadeIn
      }
    },
    [`&${componentCls}-bottom`]: {
      [`${componentCls}-fade-enter${componentCls}-fade-enter-active, ${componentCls}-fade-appear${componentCls}-fade-appear-active`]: {
        animationName: notificationBottomFadeIn
      }
    },
    [`&${componentCls}-topLeft, &${componentCls}-bottomLeft`]: {
      marginInlineEnd: 0,
      marginInlineStart: notificationMarginEdge,
      [`${componentCls}-fade-enter${componentCls}-fade-enter-active, ${componentCls}-fade-appear${componentCls}-fade-appear-active`]: {
        animationName: notificationLeftFadeIn
      }
    }
  };
};

const genNotificationStyle = token => {
  const {
    iconCls,
    componentCls,
    // .ant-notification
    boxShadowSecondary,
    fontSizeLG,
    notificationMarginBottom,
    borderRadiusLG,
    colorSuccess,
    colorInfo,
    colorWarning,
    colorError,
    colorTextHeading,
    notificationBg,
    notificationPadding,
    notificationMarginEdge,
    motionDurationMid,
    motionEaseInOut,
    fontSize,
    lineHeight,
    width,
    notificationIconSize
  } = token;
  const noticeCls = `${componentCls}-notice`;
  const notificationFadeIn = new Keyframe('antNotificationFadeIn', {
    '0%': {
      left: {
        _skip_check_: true,
        value: width
      },
      opacity: 0
    },
    '100%': {
      left: {
        _skip_check_: true,
        value: 0
      },
      opacity: 1
    }
  });
  const notificationFadeOut = new Keyframe('antNotificationFadeOut', {
    '0%': {
      maxHeight: token.animationMaxHeight,
      marginBottom: notificationMarginBottom,
      opacity: 1
    },
    '100%': {
      maxHeight: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      opacity: 0
    }
  });
  return [
  // ============================ Holder ============================
  {
    [componentCls]: _extends(_extends(_extends(_extends({}, resetComponent(token)), {
      position: 'fixed',
      zIndex: token.zIndexPopup,
      marginInlineEnd: notificationMarginEdge,
      [`${componentCls}-hook-holder`]: {
        position: 'relative'
      },
      [`&${componentCls}-top, &${componentCls}-bottom`]: {
        [`${componentCls}-notice`]: {
          marginInline: 'auto auto'
        }
      },
      [`&${componentCls}-topLeft, &${componentCls}-bottomLeft`]: {
        [`${componentCls}-notice`]: {
          marginInlineEnd: 'auto',
          marginInlineStart: 0
        }
      },
      //  animation
      [`${componentCls}-fade-enter, ${componentCls}-fade-appear`]: {
        animationDuration: token.motionDurationMid,
        animationTimingFunction: motionEaseInOut,
        animationFillMode: 'both',
        opacity: 0,
        animationPlayState: 'paused'
      },
      [`${componentCls}-fade-leave`]: {
        animationTimingFunction: motionEaseInOut,
        animationFillMode: 'both',
        animationDuration: motionDurationMid,
        animationPlayState: 'paused'
      },
      [`${componentCls}-fade-enter${componentCls}-fade-enter-active, ${componentCls}-fade-appear${componentCls}-fade-appear-active`]: {
        animationName: notificationFadeIn,
        animationPlayState: 'running'
      },
      [`${componentCls}-fade-leave${componentCls}-fade-leave-active`]: {
        animationName: notificationFadeOut,
        animationPlayState: 'running'
      }
    }), genNotificationPlacementStyle(token)), {
      // RTL
      '&-rtl': {
        direction: 'rtl',
        [`${componentCls}-notice-btn`]: {
          float: 'left'
        }
      }
    })
  },
  // ============================ Notice ============================
  {
    [noticeCls]: {
      position: 'relative',
      width,
      maxWidth: `calc(100vw - ${notificationMarginEdge * 2}px)`,
      marginBottom: notificationMarginBottom,
      marginInlineStart: 'auto',
      padding: notificationPadding,
      overflow: 'hidden',
      lineHeight,
      wordWrap: 'break-word',
      background: notificationBg,
      borderRadius: borderRadiusLG,
      boxShadow: boxShadowSecondary,
      [`${componentCls}-close-icon`]: {
        fontSize,
        cursor: 'pointer'
      },
      [`${noticeCls}-message`]: {
        marginBottom: token.marginXS,
        color: colorTextHeading,
        fontSize: fontSizeLG,
        lineHeight: token.lineHeightLG
      },
      [`${noticeCls}-description`]: {
        fontSize
      },
      [`&${noticeCls}-closable ${noticeCls}-message`]: {
        paddingInlineEnd: token.paddingLG
      },
      [`${noticeCls}-with-icon ${noticeCls}-message`]: {
        marginBottom: token.marginXS,
        marginInlineStart: token.marginSM + notificationIconSize,
        fontSize: fontSizeLG
      },
      [`${noticeCls}-with-icon ${noticeCls}-description`]: {
        marginInlineStart: token.marginSM + notificationIconSize,
        fontSize
      },
      // Icon & color style in different selector level
      // https://github.com/ant-design/ant-design/issues/16503
      // https://github.com/ant-design/ant-design/issues/15512
      [`${noticeCls}-icon`]: {
        position: 'absolute',
        fontSize: notificationIconSize,
        lineHeight: 0,
        // icon-font
        [`&-success${iconCls}`]: {
          color: colorSuccess
        },
        [`&-info${iconCls}`]: {
          color: colorInfo
        },
        [`&-warning${iconCls}`]: {
          color: colorWarning
        },
        [`&-error${iconCls}`]: {
          color: colorError
        }
      },
      [`${noticeCls}-close`]: {
        position: 'absolute',
        top: token.notificationPaddingVertical,
        insetInlineEnd: token.notificationPaddingHorizontal,
        color: token.colorIcon,
        outline: 'none',
        width: token.notificationCloseButtonSize,
        height: token.notificationCloseButtonSize,
        borderRadius: token.borderRadiusSM,
        transition: `background-color ${token.motionDurationMid}, color ${token.motionDurationMid}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          color: token.colorIconHover,
          backgroundColor: token.wireframe ? 'transparent' : token.colorFillContent
        }
      },
      [`${noticeCls}-btn`]: {
        float: 'right',
        marginTop: token.marginSM
      }
    }
  },
  // ============================= Pure =============================
  {
    [`${noticeCls}-pure-panel`]: {
      margin: 0
    }
  }];
};
// ============================== Export ==============================
const useStyle$1 = genComponentStyleHook('Notification', token => {
  const notificationPaddingVertical = token.paddingMD;
  const notificationPaddingHorizontal = token.paddingLG;
  const notificationToken = merge(token, {
    // default.less variables
    notificationBg: token.colorBgElevated,
    notificationPaddingVertical,
    notificationPaddingHorizontal,
    // index.less variables
    notificationPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`,
    notificationMarginBottom: token.margin,
    notificationMarginEdge: token.marginLG,
    animationMaxHeight: 150,
    notificationIconSize: token.fontSizeLG * token.lineHeightLG,
    notificationCloseButtonSize: token.controlHeightLG * 0.55
  });
  return [genNotificationStyle(notificationToken)];
}, token => ({
  zIndexPopup: token.zIndexPopupBase + 50,
  width: 384
}));

function getCloseIcon(prefixCls, closeIcon) {
  return closeIcon || createVNode("span", {
    "class": `${prefixCls}-close-x`
  }, [createVNode(CloseOutlined, {
    "class": `${prefixCls}-close-icon`
  }, null)]);
}
({
  info: createVNode(InfoCircleFilled, null, null),
  success: createVNode(CheckCircleFilled, null, null),
  error: createVNode(CloseCircleFilled, null, null),
  warning: createVNode(ExclamationCircleFilled, null, null),
  loading: createVNode(LoadingOutlined, null, null)
});
const typeToIcon$1 = {
  success: CheckCircleFilled,
  info: InfoCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled
};
function PureContent(_ref) {
  let {
    prefixCls,
    icon,
    type,
    message,
    description,
    btn
  } = _ref;
  let iconNode = null;
  if (icon) {
    iconNode = createVNode("span", {
      "class": `${prefixCls}-icon`
    }, [renderHelper(icon)]);
  } else if (type) {
    const Icon = typeToIcon$1[type];
    iconNode = createVNode(Icon, {
      "class": `${prefixCls}-icon ${prefixCls}-icon-${type}`
    }, null);
  }
  return createVNode("div", {
    "class": classNames({
      [`${prefixCls}-with-icon`]: iconNode
    }),
    "role": "alert"
  }, [iconNode, createVNode("div", {
    "class": `${prefixCls}-message`
  }, [message]), createVNode("div", {
    "class": `${prefixCls}-description`
  }, [description]), btn && createVNode("div", {
    "class": `${prefixCls}-btn`
  }, [btn])]);
}
/** @private Internal Component. Do not use in your production. */
defineComponent({
  name: 'PurePanel',
  inheritAttrs: false,
  props: ['prefixCls', 'icon', 'type', 'message', 'description', 'btn', 'closeIcon'],
  setup(props) {
    const {
      getPrefixCls
    } = useConfigInject('notification', props);
    const prefixCls = computed(() => props.prefixCls || getPrefixCls('notification'));
    const noticePrefixCls = computed(() => `${prefixCls.value}-notice`);
    const [, hashId] = useStyle$1(prefixCls);
    return () => {
      return createVNode(Notice, _objectSpread(_objectSpread({}, props), {}, {
        "prefixCls": prefixCls.value,
        "class": classNames(hashId.value, `${noticePrefixCls.value}-pure-panel`),
        "noticeKey": "pure",
        "duration": null,
        "closable": props.closable,
        "closeIcon": getCloseIcon(prefixCls.value, props.closeIcon)
      }), {
        default: () => [createVNode(PureContent, {
          "prefixCls": noticePrefixCls.value,
          "icon": props.icon,
          "type": props.type,
          "message": props.message,
          "description": props.description,
          "btn": props.btn
        }, null)]
      });
    };
  }
});

function getPlacementStyle(placement, top, bottom) {
  let style;
  top = typeof top === 'number' ? `${top}px` : top;
  bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  switch (placement) {
    case 'top':
      style = {
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto',
        top,
        bottom: 'auto'
      };
      break;
    case 'topLeft':
      style = {
        left: 0,
        top,
        bottom: 'auto'
      };
      break;
    case 'topRight':
      style = {
        right: 0,
        top,
        bottom: 'auto'
      };
      break;
    case 'bottom':
      style = {
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto',
        top: 'auto',
        bottom
      };
      break;
    case 'bottomLeft':
      style = {
        left: 0,
        top: 'auto',
        bottom
      };
      break;
    default:
      style = {
        right: 0,
        top: 'auto',
        bottom
      };
      break;
  }
  return style;
}
function getMotion(prefixCls) {
  return {
    name: `${prefixCls}-fade`
  };
}

var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const DEFAULT_OFFSET = 24;
const DEFAULT_DURATION = 4.5;
const Holder = defineComponent({
  name: 'Holder',
  inheritAttrs: false,
  props: ['prefixCls', 'class', 'type', 'icon', 'content', 'onAllRemoved'],
  setup(props, _ref) {
    let {
      expose
    } = _ref;
    const {
      getPrefixCls,
      getPopupContainer
    } = useConfigInject('notification', props);
    const prefixCls = computed(() => props.prefixCls || getPrefixCls('notification'));
    // =============================== Style ===============================
    const getStyles = placement => {
      var _a, _b;
      return getPlacementStyle(placement, (_a = props.top) !== null && _a !== void 0 ? _a : DEFAULT_OFFSET, (_b = props.bottom) !== null && _b !== void 0 ? _b : DEFAULT_OFFSET);
    };
    // Style
    const [, hashId] = useStyle$1(prefixCls);
    const getClassName = () => classNames(hashId.value, {
      [`${prefixCls.value}-rtl`]: props.rtl
    });
    // ============================== Motion ===============================
    const getNotificationMotion = () => getMotion(prefixCls.value);
    // ============================== Origin ===============================
    const [api, holder] = useNotification$1({
      prefixCls: prefixCls.value,
      getStyles,
      getClassName,
      motion: getNotificationMotion,
      closable: true,
      closeIcon: getCloseIcon(prefixCls.value),
      duration: DEFAULT_DURATION,
      getContainer: () => {
        var _a, _b;
        return ((_a = props.getPopupContainer) === null || _a === void 0 ? void 0 : _a.call(props)) || ((_b = getPopupContainer.value) === null || _b === void 0 ? void 0 : _b.call(getPopupContainer)) || document.body;
      },
      maxCount: props.maxCount,
      hashId: hashId.value,
      onAllRemoved: props.onAllRemoved
    });
    // ================================ Ref ================================
    expose(_extends(_extends({}, api), {
      prefixCls: prefixCls.value,
      hashId
    }));
    return holder;
  }
});
// ==============================================================================
// ==                                   Hook                                   ==
// ==============================================================================
function useInternalNotification(notificationConfig) {
  const holderRef = shallowRef(null);
  const holderKey = Symbol('notificationHolderKey');
  // ================================ API ================================
  // Wrap with notification content
  // >>> Open
  const open = config => {
    if (!holderRef.value) {
      return;
    }
    const {
      open: originOpen,
      prefixCls,
      hashId
    } = holderRef.value;
    const noticePrefixCls = `${prefixCls}-notice`;
    const {
        message,
        description,
        icon,
        type,
        btn,
        class: className
      } = config,
      restConfig = __rest$1(config, ["message", "description", "icon", "type", "btn", "class"]);
    return originOpen(_extends(_extends({
      placement: 'topRight'
    }, restConfig), {
      content: () => createVNode(PureContent, {
        "prefixCls": noticePrefixCls,
        "icon": typeof icon === 'function' ? icon() : icon,
        "type": type,
        "message": typeof message === 'function' ? message() : message,
        "description": typeof description === 'function' ? description() : description,
        "btn": typeof btn === 'function' ? btn() : btn
      }, null),
      // @ts-ignore
      class: classNames(type && `${noticePrefixCls}-${type}`, hashId, className)
    }));
  };
  // >>> destroy
  const destroy = key => {
    var _a, _b;
    if (key !== undefined) {
      (_a = holderRef.value) === null || _a === void 0 ? void 0 : _a.close(key);
    } else {
      (_b = holderRef.value) === null || _b === void 0 ? void 0 : _b.destroy();
    }
  };
  const wrapAPI = {
    open,
    destroy
  };
  const keys = ['success', 'info', 'warning', 'error'];
  keys.forEach(type => {
    wrapAPI[type] = config => open(_extends(_extends({}, config), {
      type
    }));
  });
  // ============================== Return ===============================
  return [wrapAPI, () => createVNode(Holder, _objectSpread(_objectSpread({
    "key": holderKey
  }, notificationConfig), {}, {
    "ref": holderRef
  }), null)];
}
function useNotification(notificationConfig) {
  return useInternalNotification(notificationConfig);
}

undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const notificationInstance = {};
let defaultDuration = 4.5;
let defaultTop = '24px';
let defaultBottom = '24px';
let defaultPrefixCls$1 = '';
let defaultPlacement = 'topRight';
let defaultGetContainer = () => document.body;
let defaultCloseIcon = null;
let rtl = false;
let maxCount;
function setNotificationConfig(options) {
  const {
    duration,
    placement,
    bottom,
    top,
    getContainer,
    closeIcon,
    prefixCls
  } = options;
  if (prefixCls !== undefined) {
    defaultPrefixCls$1 = prefixCls;
  }
  if (duration !== undefined) {
    defaultDuration = duration;
  }
  if (placement !== undefined) {
    defaultPlacement = placement;
  }
  if (bottom !== undefined) {
    defaultBottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
  }
  if (top !== undefined) {
    defaultTop = typeof top === 'number' ? `${top}px` : top;
  }
  if (getContainer !== undefined) {
    defaultGetContainer = getContainer;
  }
  if (closeIcon !== undefined) {
    defaultCloseIcon = closeIcon;
  }
  if (options.rtl !== undefined) {
    rtl = options.rtl;
  }
  if (options.maxCount !== undefined) {
    maxCount = options.maxCount;
  }
}
function getNotificationInstance(_ref, callback) {
  let {
    prefixCls: customizePrefixCls,
    placement = defaultPlacement,
    getContainer = defaultGetContainer,
    top,
    bottom,
    closeIcon = defaultCloseIcon,
    appContext
  } = _ref;
  const {
    getPrefixCls
  } = globalConfig();
  const prefixCls = getPrefixCls('notification', customizePrefixCls || defaultPrefixCls$1);
  const cacheKey = `${prefixCls}-${placement}-${rtl}`;
  const cacheInstance = notificationInstance[cacheKey];
  if (cacheInstance) {
    Promise.resolve(cacheInstance).then(instance => {
      callback(instance);
    });
    return;
  }
  const notificationClass = classNames(`${prefixCls}-${placement}`, {
    [`${prefixCls}-rtl`]: rtl === true
  });
  Notification$1.newInstance({
    name: 'notification',
    prefixCls: customizePrefixCls || defaultPrefixCls$1,
    useStyle: useStyle$1,
    class: notificationClass,
    style: getPlacementStyle(placement, top !== null && top !== void 0 ? top : defaultTop, bottom !== null && bottom !== void 0 ? bottom : defaultBottom),
    appContext,
    getContainer,
    closeIcon: _ref2 => {
      let {
        prefixCls
      } = _ref2;
      const closeIconToRender = createVNode("span", {
        "class": `${prefixCls}-close-x`
      }, [renderHelper(closeIcon, {}, createVNode(CloseOutlined, {
        "class": `${prefixCls}-close-icon`
      }, null))]);
      return closeIconToRender;
    },
    maxCount,
    hasTransitionName: true
  }, notification => {
    notificationInstance[cacheKey] = notification;
    callback(notification);
  });
}
const typeToIcon = {
  success: CheckCircleOutlined,
  info: InfoCircleOutlined,
  error: CloseCircleOutlined,
  warning: ExclamationCircleOutlined
};
function notice(args) {
  const {
    icon,
    type,
    description,
    message,
    btn
  } = args;
  const duration = args.duration === undefined ? defaultDuration : args.duration;
  getNotificationInstance(args, notification => {
    notification.notice({
      content: _ref3 => {
        let {
          prefixCls: outerPrefixCls
        } = _ref3;
        const prefixCls = `${outerPrefixCls}-notice`;
        let iconNode = null;
        if (icon) {
          iconNode = () => createVNode("span", {
            "class": `${prefixCls}-icon`
          }, [renderHelper(icon)]);
        } else if (type) {
          const Icon = typeToIcon[type];
          iconNode = () => createVNode(Icon, {
            "class": `${prefixCls}-icon ${prefixCls}-icon-${type}`
          }, null);
        }
        return createVNode("div", {
          "class": iconNode ? `${prefixCls}-with-icon` : ''
        }, [iconNode && iconNode(), createVNode("div", {
          "class": `${prefixCls}-message`
        }, [!description && iconNode ? createVNode("span", {
          "class": `${prefixCls}-message-single-line-auto-margin`
        }, null) : null, renderHelper(message)]), createVNode("div", {
          "class": `${prefixCls}-description`
        }, [renderHelper(description)]), btn ? createVNode("span", {
          "class": `${prefixCls}-btn`
        }, [renderHelper(btn)]) : null]);
      },
      duration,
      closable: true,
      onClose: args.onClose,
      onClick: args.onClick,
      key: args.key,
      style: args.style || {},
      class: args.class
    });
  });
}
const api = {
  open: notice,
  close(key) {
    Object.keys(notificationInstance).forEach(cacheKey => Promise.resolve(notificationInstance[cacheKey]).then(instance => {
      instance.removeNotice(key);
    }));
  },
  config: setNotificationConfig,
  destroy() {
    Object.keys(notificationInstance).forEach(cacheKey => {
      Promise.resolve(notificationInstance[cacheKey]).then(instance => {
        instance.destroy();
      });
      delete notificationInstance[cacheKey]; // lgtm[js/missing-await]
    });
  }
};
const iconTypes = ['success', 'info', 'warning', 'error'];
iconTypes.forEach(type => {
  api[type] = args => api.open(_extends(_extends({}, args), {
    type
  }));
});
api.warn = api.warning;
api.useNotification = useNotification;

/* eslint-disable import/prefer-default-export, prefer-destructuring */
function getStyle(globalPrefixCls, theme) {
  const variables = {};
  const formatColor = (color, updater) => {
    let clone = color.clone();
    clone = (updater === null || updater === void 0 ? void 0 : updater(clone)) || clone;
    return clone.toRgbString();
  };
  const fillColor = (colorVal, type) => {
    const baseColor = new TinyColor(colorVal);
    const colorPalettes = generate(baseColor.toRgbString());
    variables[`${type}-color`] = formatColor(baseColor);
    variables[`${type}-color-disabled`] = colorPalettes[1];
    variables[`${type}-color-hover`] = colorPalettes[4];
    variables[`${type}-color-active`] = colorPalettes[6];
    variables[`${type}-color-outline`] = baseColor.clone().setAlpha(0.2).toRgbString();
    variables[`${type}-color-deprecated-bg`] = colorPalettes[0];
    variables[`${type}-color-deprecated-border`] = colorPalettes[2];
  };
  // ================ Primary Color ================
  if (theme.primaryColor) {
    fillColor(theme.primaryColor, 'primary');
    const primaryColor = new TinyColor(theme.primaryColor);
    const primaryColors = generate(primaryColor.toRgbString());
    // Legacy - We should use semantic naming standard
    primaryColors.forEach((color, index) => {
      variables[`primary-${index + 1}`] = color;
    });
    // Deprecated
    variables['primary-color-deprecated-l-35'] = formatColor(primaryColor, c => c.lighten(35));
    variables['primary-color-deprecated-l-20'] = formatColor(primaryColor, c => c.lighten(20));
    variables['primary-color-deprecated-t-20'] = formatColor(primaryColor, c => c.tint(20));
    variables['primary-color-deprecated-t-50'] = formatColor(primaryColor, c => c.tint(50));
    variables['primary-color-deprecated-f-12'] = formatColor(primaryColor, c => c.setAlpha(c.getAlpha() * 0.12));
    const primaryActiveColor = new TinyColor(primaryColors[0]);
    variables['primary-color-active-deprecated-f-30'] = formatColor(primaryActiveColor, c => c.setAlpha(c.getAlpha() * 0.3));
    variables['primary-color-active-deprecated-d-02'] = formatColor(primaryActiveColor, c => c.darken(2));
  }
  // ================ Success Color ================
  if (theme.successColor) {
    fillColor(theme.successColor, 'success');
  }
  // ================ Warning Color ================
  if (theme.warningColor) {
    fillColor(theme.warningColor, 'warning');
  }
  // ================= Error Color =================
  if (theme.errorColor) {
    fillColor(theme.errorColor, 'error');
  }
  // ================= Info Color ==================
  if (theme.infoColor) {
    fillColor(theme.infoColor, 'info');
  }
  // Convert to css variables
  const cssList = Object.keys(variables).map(key => `--${globalPrefixCls}-${key}: ${variables[key]};`);
  return `
  :root {
    ${cssList.join('\n')}
  }
  `.trim();
}
function registerTheme(globalPrefixCls, theme) {
  getStyle(globalPrefixCls, theme);
}

const useStyle = iconPrefixCls => {
  const [theme, token] = useToken();
  // Generate style for icons
  return useStyleRegister(computed(() => ({
    theme: theme.value,
    token: token.value,
    hashId: '',
    path: ['ant-design-icons', iconPrefixCls.value]
  })), () => [{
    [`.${iconPrefixCls.value}`]: _extends(_extends({}, resetIcon()), {
      [`.${iconPrefixCls.value} .${iconPrefixCls.value}-icon`]: {
        display: 'block'
      }
    })
  }]);
};

function useTheme(theme, parentTheme) {
  const themeConfig = computed(() => (theme === null || theme === void 0 ? void 0 : theme.value) || {});
  const parentThemeConfig = computed(() => themeConfig.value.inherit === false || !(parentTheme === null || parentTheme === void 0 ? void 0 : parentTheme.value) ? defaultConfig : parentTheme.value);
  const mergedTheme = computed(() => {
    if (!(theme === null || theme === void 0 ? void 0 : theme.value)) {
      return parentTheme === null || parentTheme === void 0 ? void 0 : parentTheme.value;
    }
    // Override
    const mergedComponents = _extends({}, parentThemeConfig.value.components);
    Object.keys(theme.value.components || {}).forEach(componentName => {
      mergedComponents[componentName] = _extends(_extends({}, mergedComponents[componentName]), theme.value.components[componentName]);
    });
    // Base token
    return _extends(_extends(_extends({}, parentThemeConfig.value), themeConfig.value), {
      token: _extends(_extends({}, parentThemeConfig.value.token), themeConfig.value.token),
      components: mergedComponents
    });
  });
  return mergedTheme;
}

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const defaultPrefixCls = 'ant';
function getGlobalPrefixCls() {
  return globalConfigForApi.prefixCls || defaultPrefixCls;
}
function getGlobalIconPrefixCls() {
  return globalConfigForApi.iconPrefixCls || defaultIconPrefixCls;
}
const globalConfigBySet = reactive({}); // 权重最大
const globalConfigForApi = reactive({});
watchEffect(() => {
  _extends(globalConfigForApi, globalConfigBySet);
  globalConfigForApi.prefixCls = getGlobalPrefixCls();
  globalConfigForApi.iconPrefixCls = getGlobalIconPrefixCls();
  globalConfigForApi.getPrefixCls = (suffixCls, customizePrefixCls) => {
    if (customizePrefixCls) return customizePrefixCls;
    return suffixCls ? `${globalConfigForApi.prefixCls}-${suffixCls}` : globalConfigForApi.prefixCls;
  };
  globalConfigForApi.getRootPrefixCls = () => {
    // If Global prefixCls provided, use this
    if (globalConfigForApi.prefixCls) {
      return globalConfigForApi.prefixCls;
    }
    // Fallback to default prefixCls
    return getGlobalPrefixCls();
  };
});
let stopWatchEffect;
const setGlobalConfig = params => {
  if (stopWatchEffect) {
    stopWatchEffect();
  }
  stopWatchEffect = watchEffect(() => {
    _extends(globalConfigBySet, reactive(params));
    _extends(globalConfigForApi, reactive(params));
  });
  if (params.theme) {
    registerTheme(getGlobalPrefixCls(), params.theme);
  }
};
const globalConfig = () => ({
  getPrefixCls: (suffixCls, customizePrefixCls) => {
    if (customizePrefixCls) return customizePrefixCls;
    return suffixCls ? `${getGlobalPrefixCls()}-${suffixCls}` : getGlobalPrefixCls();
  },
  getIconPrefixCls: getGlobalIconPrefixCls,
  getRootPrefixCls: () => {
    // If Global prefixCls provided, use this
    if (globalConfigForApi.prefixCls) {
      return globalConfigForApi.prefixCls;
    }
    // Fallback to default prefixCls
    return getGlobalPrefixCls();
  }
});
const ConfigProvider = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AConfigProvider',
  inheritAttrs: false,
  props: configProviderProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const parentContext = useConfigContextInject();
    const getPrefixCls = (suffixCls, customizePrefixCls) => {
      const {
        prefixCls = 'ant'
      } = props;
      if (customizePrefixCls) return customizePrefixCls;
      const mergedPrefixCls = prefixCls || parentContext.getPrefixCls('');
      return suffixCls ? `${mergedPrefixCls}-${suffixCls}` : mergedPrefixCls;
    };
    const iconPrefixCls = computed(() => props.iconPrefixCls || parentContext.iconPrefixCls.value || defaultIconPrefixCls);
    const shouldWrapSSR = computed(() => iconPrefixCls.value !== parentContext.iconPrefixCls.value);
    const csp = computed(() => {
      var _a;
      return props.csp || ((_a = parentContext.csp) === null || _a === void 0 ? void 0 : _a.value);
    });
    const wrapSSR = useStyle(iconPrefixCls);
    const mergedTheme = useTheme(computed(() => props.theme), computed(() => {
      var _a;
      return (_a = parentContext.theme) === null || _a === void 0 ? void 0 : _a.value;
    }));
    const renderEmptyComponent = name => {
      const renderEmpty$1 = props.renderEmpty || slots.renderEmpty || parentContext.renderEmpty || renderEmpty;
      return renderEmpty$1(name);
    };
    const autoInsertSpaceInButton = computed(() => {
      var _a, _b;
      return (_a = props.autoInsertSpaceInButton) !== null && _a !== void 0 ? _a : (_b = parentContext.autoInsertSpaceInButton) === null || _b === void 0 ? void 0 : _b.value;
    });
    const locale$1 = computed(() => {
      var _a;
      return props.locale || ((_a = parentContext.locale) === null || _a === void 0 ? void 0 : _a.value);
    });
    watch(locale$1, () => {
      globalConfigBySet.locale = locale$1.value;
    }, {
      immediate: true
    });
    const direction = computed(() => {
      var _a;
      return props.direction || ((_a = parentContext.direction) === null || _a === void 0 ? void 0 : _a.value);
    });
    const space = computed(() => {
      var _a, _b;
      return (_a = props.space) !== null && _a !== void 0 ? _a : (_b = parentContext.space) === null || _b === void 0 ? void 0 : _b.value;
    });
    const virtual = computed(() => {
      var _a, _b;
      return (_a = props.virtual) !== null && _a !== void 0 ? _a : (_b = parentContext.virtual) === null || _b === void 0 ? void 0 : _b.value;
    });
    const dropdownMatchSelectWidth = computed(() => {
      var _a, _b;
      return (_a = props.dropdownMatchSelectWidth) !== null && _a !== void 0 ? _a : (_b = parentContext.dropdownMatchSelectWidth) === null || _b === void 0 ? void 0 : _b.value;
    });
    const getTargetContainer = computed(() => {
      var _a;
      return props.getTargetContainer !== undefined ? props.getTargetContainer : (_a = parentContext.getTargetContainer) === null || _a === void 0 ? void 0 : _a.value;
    });
    const getPopupContainer = computed(() => {
      var _a;
      return props.getPopupContainer !== undefined ? props.getPopupContainer : (_a = parentContext.getPopupContainer) === null || _a === void 0 ? void 0 : _a.value;
    });
    const pageHeader = computed(() => {
      var _a;
      return props.pageHeader !== undefined ? props.pageHeader : (_a = parentContext.pageHeader) === null || _a === void 0 ? void 0 : _a.value;
    });
    const input = computed(() => {
      var _a;
      return props.input !== undefined ? props.input : (_a = parentContext.input) === null || _a === void 0 ? void 0 : _a.value;
    });
    const pagination = computed(() => {
      var _a;
      return props.pagination !== undefined ? props.pagination : (_a = parentContext.pagination) === null || _a === void 0 ? void 0 : _a.value;
    });
    const form = computed(() => {
      var _a;
      return props.form !== undefined ? props.form : (_a = parentContext.form) === null || _a === void 0 ? void 0 : _a.value;
    });
    const select = computed(() => {
      var _a;
      return props.select !== undefined ? props.select : (_a = parentContext.select) === null || _a === void 0 ? void 0 : _a.value;
    });
    const componentSize = computed(() => props.componentSize);
    const componentDisabled = computed(() => props.componentDisabled);
    const wave = computed(() => {
      var _a, _b;
      return (_a = props.wave) !== null && _a !== void 0 ? _a : (_b = parentContext.wave) === null || _b === void 0 ? void 0 : _b.value;
    });
    const configProvider = {
      csp,
      autoInsertSpaceInButton,
      locale: locale$1,
      direction,
      space,
      virtual,
      dropdownMatchSelectWidth,
      getPrefixCls,
      iconPrefixCls,
      theme: computed(() => {
        var _a, _b;
        return (_a = mergedTheme.value) !== null && _a !== void 0 ? _a : (_b = parentContext.theme) === null || _b === void 0 ? void 0 : _b.value;
      }),
      renderEmpty: renderEmptyComponent,
      getTargetContainer,
      getPopupContainer,
      pageHeader,
      input,
      pagination,
      form,
      select,
      componentSize,
      componentDisabled,
      transformCellText: computed(() => props.transformCellText),
      wave
    };
    // ================================ Dynamic theme ================================
    const memoTheme = computed(() => {
      const _a = mergedTheme.value || {},
        {
          algorithm,
          token
        } = _a,
        rest = __rest(_a, ["algorithm", "token"]);
      const themeObj = algorithm && (!Array.isArray(algorithm) || algorithm.length > 0) ? createTheme(algorithm) : undefined;
      return _extends(_extends({}, rest), {
        theme: themeObj,
        token: _extends(_extends({}, seedToken), token)
      });
    });
    const validateMessagesRef = computed(() => {
      var _a, _b;
      // Additional Form provider
      let validateMessages = {};
      if (locale$1.value) {
        validateMessages = ((_a = locale$1.value.Form) === null || _a === void 0 ? void 0 : _a.defaultValidateMessages) || ((_b = localeValues.Form) === null || _b === void 0 ? void 0 : _b.defaultValidateMessages) || {};
      }
      if (props.form && props.form.validateMessages) {
        validateMessages = _extends(_extends({}, validateMessages), props.form.validateMessages);
      }
      return validateMessages;
    });
    useConfigContextProvider(configProvider);
    useProvideGlobalForm({
      validateMessages: validateMessagesRef
    });
    useProviderSize(componentSize);
    useProviderDisabled(componentDisabled);
    const renderProvider = legacyLocale => {
      var _a, _b;
      let childNode = shouldWrapSSR.value ? wrapSSR((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)) : (_b = slots.default) === null || _b === void 0 ? void 0 : _b.call(slots);
      if (props.theme) {
        const _childNode = function () {
          return childNode;
        }();
        childNode = createVNode(DesignTokenProvider, {
          "value": memoTheme.value
        }, {
          default: () => [_childNode]
        });
      }
      return createVNode(locale, {
        "locale": locale$1.value || legacyLocale,
        "ANT_MARK__": ANT_MARK
      }, {
        default: () => [childNode]
      });
    };
    watchEffect(() => {
      if (direction.value) {
        api$1.config({
          rtl: direction.value === 'rtl'
        });
        api.config({
          rtl: direction.value === 'rtl'
        });
      }
    });
    return () => createVNode(LocaleReceiver, {
      "children": (_, __, legacyLocale) => renderProvider(legacyLocale)
    }, null);
  }
});
ConfigProvider.config = setGlobalConfig;
ConfigProvider.install = function (app) {
  app.component(ConfigProvider.name, ConfigProvider);
};

export { ConfigProvider as C, getConfirmLocale as a, globalConfigForApi as g };
//# sourceMappingURL=index13.mjs.map
