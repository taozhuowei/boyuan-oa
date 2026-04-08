import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { defineComponent, computed, createVNode, Fragment, ref, onUpdated } from 'vue';
import { D as stringType, s as someType, x as objectType, h as anyType, f as booleanType, j as functionType, V as devWarning, e as initDefaultProps, aA as Tooltip, g as genComponentStyleHook, m as merge, r as resetComponent, a9 as Keyframe, u as useConfigInject, C as CloseCircleFilled, a as CloseOutlined, w as withInstall } from './collapseMotion.mjs';
import { C as CheckOutlined } from './CheckOutlined.mjs';
import { C as CheckCircleFilled } from './ExclamationCircleFilled.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';
import { presetPrimaryColors } from '@ant-design/colors';
import { u as useRefs } from './useRefs.mjs';

const progressStatuses = ['normal', 'exception', 'active', 'success'];
const progressProps = () => ({
  prefixCls: String,
  type: stringType(),
  percent: Number,
  format: functionType(),
  status: stringType(),
  showInfo: booleanType(),
  strokeWidth: Number,
  strokeLinecap: stringType(),
  strokeColor: anyType(),
  trailColor: String,
  /** @deprecated Use `size` instead */
  width: Number,
  success: objectType(),
  gapDegree: Number,
  gapPosition: stringType(),
  size: someType([String, Number, Array]),
  steps: Number,
  /** @deprecated Use `success` instead */
  successPercent: Number,
  title: String,
  progressStatus: stringType()
});

function validProgress(progress) {
  if (!progress || progress < 0) {
    return 0;
  }
  if (progress > 100) {
    return 100;
  }
  return progress;
}
function getSuccessPercent(_ref) {
  let {
    success,
    successPercent
  } = _ref;
  let percent = successPercent;
  /** @deprecated Use `percent` instead */
  if (success && 'progress' in success) {
    devWarning(false, 'Progress', '`success.progress` is deprecated. Please use `success.percent` instead.');
    percent = success.progress;
  }
  if (success && 'percent' in success) {
    percent = success.percent;
  }
  return percent;
}
function getPercentage(_ref2) {
  let {
    percent,
    success,
    successPercent
  } = _ref2;
  const realSuccessPercent = validProgress(getSuccessPercent({
    success,
    successPercent
  }));
  return [realSuccessPercent, validProgress(validProgress(percent) - realSuccessPercent)];
}
function getStrokeColor(_ref3) {
  let {
    success = {},
    strokeColor
  } = _ref3;
  const {
    strokeColor: successColor
  } = success;
  return [successColor || presetPrimaryColors.green, strokeColor || null];
}
const getSize = (size, type, extra) => {
  var _a, _b, _c, _d;
  let width = -1;
  let height = -1;
  if (type === 'step') {
    const steps = extra.steps;
    const strokeWidth = extra.strokeWidth;
    if (typeof size === 'string' || typeof size === 'undefined') {
      width = size === 'small' ? 2 : 14;
      height = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 8;
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else {
      [width = 14, height = 8] = size;
    }
    width *= steps;
  } else if (type === 'line') {
    const strokeWidth = extra === null || extra === void 0 ? void 0 : extra.strokeWidth;
    if (typeof size === 'string' || typeof size === 'undefined') {
      height = strokeWidth || (size === 'small' ? 6 : 8);
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else {
      [width = -1, height = 8] = size;
    }
  } else if (type === 'circle' || type === 'dashboard') {
    if (typeof size === 'string' || typeof size === 'undefined') {
      [width, height] = size === 'small' ? [60, 60] : [120, 120];
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else {
      width = (_b = (_a = size[0]) !== null && _a !== void 0 ? _a : size[1]) !== null && _b !== void 0 ? _b : 120;
      height = (_d = (_c = size[0]) !== null && _c !== void 0 ? _c : size[1]) !== null && _d !== void 0 ? _d : 120;
    }
  }
  return {
    width,
    height
  };
};

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const lineProps = () => _extends(_extends({}, progressProps()), {
  strokeColor: anyType(),
  direction: stringType()
});
/**
 * {
 *   '0%': '#afc163',
 *   '75%': '#009900',
 *   '50%': 'green',     ====>     '#afc163 0%, #66FF00 25%, #00CC00 50%, #009900 75%, #ffffff 100%'
 *   '25%': '#66FF00',
 *   '100%': '#ffffff'
 * }
 */
const sortGradient = gradients => {
  let tempArr = [];
  Object.keys(gradients).forEach(key => {
    const formattedKey = parseFloat(key.replace(/%/g, ''));
    if (!isNaN(formattedKey)) {
      tempArr.push({
        key: formattedKey,
        value: gradients[key]
      });
    }
  });
  tempArr = tempArr.sort((a, b) => a.key - b.key);
  return tempArr.map(_ref => {
    let {
      key,
      value
    } = _ref;
    return `${value} ${key}%`;
  }).join(', ');
};
/**
 * Then this man came to realize the truth: Besides six pence, there is the moon. Besides bread and
 * butter, there is the bug. And... Besides women, there is the code.
 *
 * @example
 *   {
 *     "0%": "#afc163",
 *     "25%": "#66FF00",
 *     "50%": "#00CC00", // ====>  linear-gradient(to right, #afc163 0%, #66FF00 25%,
 *     "75%": "#009900", //        #00CC00 50%, #009900 75%, #ffffff 100%)
 *     "100%": "#ffffff"
 *   }
 */
const handleGradient = (strokeColor, directionConfig) => {
  const {
      from = presetPrimaryColors.blue,
      to = presetPrimaryColors.blue,
      direction = directionConfig === 'rtl' ? 'to left' : 'to right'
    } = strokeColor,
    rest = __rest$2(strokeColor, ["from", "to", "direction"]);
  if (Object.keys(rest).length !== 0) {
    const sortedGradients = sortGradient(rest);
    return {
      backgroundImage: `linear-gradient(${direction}, ${sortedGradients})`
    };
  }
  return {
    backgroundImage: `linear-gradient(${direction}, ${from}, ${to})`
  };
};
const Line = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ProgressLine',
  inheritAttrs: false,
  props: lineProps(),
  setup(props, _ref2) {
    let {
      slots,
      attrs
    } = _ref2;
    const backgroundProps = computed(() => {
      const {
        strokeColor,
        direction
      } = props;
      return strokeColor && typeof strokeColor !== 'string' ? handleGradient(strokeColor, direction) : {
        backgroundColor: strokeColor
      };
    });
    const borderRadius = computed(() => props.strokeLinecap === 'square' || props.strokeLinecap === 'butt' ? 0 : undefined);
    const trailStyle = computed(() => props.trailColor ? {
      backgroundColor: props.trailColor
    } : undefined);
    const mergedSize = computed(() => {
      var _a;
      return (_a = props.size) !== null && _a !== void 0 ? _a : [-1, props.strokeWidth || (props.size === 'small' ? 6 : 8)];
    });
    const sizeRef = computed(() => getSize(mergedSize.value, 'line', {
      strokeWidth: props.strokeWidth
    }));
    const percentStyle = computed(() => {
      const {
        percent
      } = props;
      return _extends({
        width: `${validProgress(percent)}%`,
        height: `${sizeRef.value.height}px`,
        borderRadius: borderRadius.value
      }, backgroundProps.value);
    });
    const successPercent = computed(() => {
      return getSuccessPercent(props);
    });
    const successPercentStyle = computed(() => {
      const {
        success
      } = props;
      return {
        width: `${validProgress(successPercent.value)}%`,
        height: `${sizeRef.value.height}px`,
        borderRadius: borderRadius.value,
        backgroundColor: success === null || success === void 0 ? void 0 : success.strokeColor
      };
    });
    const outerStyle = {
      width: sizeRef.value.width < 0 ? '100%' : sizeRef.value.width,
      height: `${sizeRef.value.height}px`
    };
    return () => {
      var _a;
      return createVNode(Fragment, null, [createVNode("div", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": [`${props.prefixCls}-outer`, attrs.class],
        "style": [attrs.style, outerStyle]
      }), [createVNode("div", {
        "class": `${props.prefixCls}-inner`,
        "style": trailStyle.value
      }, [createVNode("div", {
        "class": `${props.prefixCls}-bg`,
        "style": percentStyle.value
      }, null), successPercent.value !== undefined ? createVNode("div", {
        "class": `${props.prefixCls}-success-bg`,
        "style": successPercentStyle.value
      }, null) : null])]), (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
    };
  }
});

const defaultProps = {
  percent: 0,
  prefixCls: 'vc-progress',
  strokeColor: '#2db7f5',
  strokeLinecap: 'round',
  strokeWidth: 1,
  trailColor: '#D9D9D9',
  trailWidth: 1
};
const useTransitionDuration = paths => {
  const prevTimeStamp = ref(null);
  onUpdated(() => {
    const now = Date.now();
    let updated = false;
    paths.value.forEach(val => {
      const path = (val === null || val === void 0 ? void 0 : val.$el) || val;
      if (!path) {
        return;
      }
      updated = true;
      const pathStyle = path.style;
      pathStyle.transitionDuration = '.3s, .3s, .3s, .06s';
      if (prevTimeStamp.value && now - prevTimeStamp.value < 100) {
        pathStyle.transitionDuration = '0s, 0s';
      }
    });
    if (updated) {
      prevTimeStamp.value = Date.now();
    }
  });
  return paths;
};

const propTypes = {
  gapDegree: Number,
  gapPosition: {
    type: String
  },
  percent: {
    type: [Array, Number]
  },
  prefixCls: String,
  strokeColor: {
    type: [Object, String, Array]
  },
  strokeLinecap: {
    type: String
  },
  strokeWidth: Number,
  trailColor: String,
  trailWidth: Number,
  transition: String
};

var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
let gradientSeed = 0;
function stripPercentToNumber(percent) {
  return +percent.replace('%', '');
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
function getPathStyles(offset, percent, strokeColor, strokeWidth) {
  let gapDegree = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  let gapPosition = arguments.length > 5 ? arguments[5] : undefined;
  const radius = 50 - strokeWidth / 2;
  let beginPositionX = 0;
  let beginPositionY = -radius;
  let endPositionX = 0;
  let endPositionY = -2 * radius;
  switch (gapPosition) {
    case 'left':
      beginPositionX = -radius;
      beginPositionY = 0;
      endPositionX = 2 * radius;
      endPositionY = 0;
      break;
    case 'right':
      beginPositionX = radius;
      beginPositionY = 0;
      endPositionX = -2 * radius;
      endPositionY = 0;
      break;
    case 'bottom':
      beginPositionY = radius;
      endPositionY = 2 * radius;
      break;
  }
  const pathString = `M 50,50 m ${beginPositionX},${beginPositionY}
   a ${radius},${radius} 0 1 1 ${endPositionX},${-endPositionY}
   a ${radius},${radius} 0 1 1 ${-endPositionX},${endPositionY}`;
  const len = Math.PI * 2 * radius;
  const pathStyle = {
    stroke: strokeColor,
    strokeDasharray: `${percent / 100 * (len - gapDegree)}px ${len}px`,
    strokeDashoffset: `-${gapDegree / 2 + offset / 100 * (len - gapDegree)}px`,
    transition: 'stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s, stroke-width .06s ease .3s, opacity .3s ease 0s' // eslint-disable-line
  };
  return {
    pathString,
    pathStyle
  };
}
const VCCircle = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'VCCircle',
  props: initDefaultProps(propTypes, defaultProps),
  setup(props) {
    gradientSeed += 1;
    const gradientId = ref(gradientSeed);
    const percentList = computed(() => toArray(props.percent));
    const strokeColorList = computed(() => toArray(props.strokeColor));
    const [setRef, paths] = useRefs();
    useTransitionDuration(paths);
    const getStokeList = () => {
      const {
        prefixCls,
        strokeWidth,
        strokeLinecap,
        gapDegree,
        gapPosition
      } = props;
      let stackPtg = 0;
      return percentList.value.map((ptg, index) => {
        const color = strokeColorList.value[index] || strokeColorList.value[strokeColorList.value.length - 1];
        const stroke = Object.prototype.toString.call(color) === '[object Object]' ? `url(#${prefixCls}-gradient-${gradientId.value})` : '';
        const {
          pathString,
          pathStyle
        } = getPathStyles(stackPtg, ptg, color, strokeWidth, gapDegree, gapPosition);
        stackPtg += ptg;
        const pathProps = {
          key: index,
          d: pathString,
          stroke,
          'stroke-linecap': strokeLinecap,
          'stroke-width': strokeWidth,
          opacity: ptg === 0 ? 0 : 1,
          'fill-opacity': '0',
          class: `${prefixCls}-circle-path`,
          style: pathStyle
        };
        return createVNode("path", _objectSpread({
          "ref": setRef(index)
        }, pathProps), null);
      });
    };
    return () => {
      const {
          prefixCls,
          strokeWidth,
          trailWidth,
          gapDegree,
          gapPosition,
          trailColor,
          strokeLinecap,
          strokeColor
        } = props,
        restProps = __rest$1(props, ["prefixCls", "strokeWidth", "trailWidth", "gapDegree", "gapPosition", "trailColor", "strokeLinecap", "strokeColor"]);
      const {
        pathString,
        pathStyle
      } = getPathStyles(0, 100, trailColor, strokeWidth, gapDegree, gapPosition);
      delete restProps.percent;
      const gradient = strokeColorList.value.find(color => Object.prototype.toString.call(color) === '[object Object]');
      const pathFirst = {
        d: pathString,
        stroke: trailColor,
        'stroke-linecap': strokeLinecap,
        'stroke-width': trailWidth || strokeWidth,
        'fill-opacity': '0',
        class: `${prefixCls}-circle-trail`,
        style: pathStyle
      };
      return createVNode("svg", _objectSpread({
        "class": `${prefixCls}-circle`,
        "viewBox": "0 0 100 100"
      }, restProps), [gradient && createVNode("defs", null, [createVNode("linearGradient", {
        "id": `${prefixCls}-gradient-${gradientId.value}`,
        "x1": "100%",
        "y1": "0%",
        "x2": "0%",
        "y2": "0%"
      }, [Object.keys(gradient).sort((a, b) => stripPercentToNumber(a) - stripPercentToNumber(b)).map((key, index) => createVNode("stop", {
        "key": index,
        "offset": key,
        "stop-color": gradient[key]
      }, null))])]), createVNode("path", pathFirst, null), getStokeList().reverse()]);
    };
  }
});

const circleProps = () => _extends(_extends({}, progressProps()), {
  strokeColor: anyType()
});
const CIRCLE_MIN_STROKE_WIDTH = 3;
const getMinPercent = width => CIRCLE_MIN_STROKE_WIDTH / width * 100;
const Circle = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'ProgressCircle',
  inheritAttrs: false,
  props: initDefaultProps(circleProps(), {
    trailColor: null
  }),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const originWidth = computed(() => {
      var _a;
      return (_a = props.width) !== null && _a !== void 0 ? _a : 120;
    });
    const mergedSize = computed(() => {
      var _a;
      return (_a = props.size) !== null && _a !== void 0 ? _a : [originWidth.value, originWidth.value];
    });
    const sizeRef = computed(() => getSize(mergedSize.value, 'circle'));
    const gapDeg = computed(() => {
      // Support gapDeg = 0 when type = 'dashboard'
      if (props.gapDegree || props.gapDegree === 0) {
        return props.gapDegree;
      }
      if (props.type === 'dashboard') {
        return 75;
      }
      return undefined;
    });
    const circleStyle = computed(() => {
      return {
        width: `${sizeRef.value.width}px`,
        height: `${sizeRef.value.height}px`,
        fontSize: `${sizeRef.value.width * 0.15 + 6}px`
      };
    });
    const circleWidth = computed(() => {
      var _a;
      return (_a = props.strokeWidth) !== null && _a !== void 0 ? _a : Math.max(getMinPercent(sizeRef.value.width), 6);
    });
    const gapPos = computed(() => props.gapPosition || props.type === 'dashboard' && 'bottom' || undefined);
    // using className to style stroke color
    const percent = computed(() => getPercentage(props));
    const isGradient = computed(() => Object.prototype.toString.call(props.strokeColor) === '[object Object]');
    const strokeColor = computed(() => getStrokeColor({
      success: props.success,
      strokeColor: props.strokeColor
    }));
    const wrapperClassName = computed(() => ({
      [`${props.prefixCls}-inner`]: true,
      [`${props.prefixCls}-circle-gradient`]: isGradient.value
    }));
    return () => {
      var _a;
      const circleContent = createVNode(VCCircle, {
        "percent": percent.value,
        "strokeWidth": circleWidth.value,
        "trailWidth": circleWidth.value,
        "strokeColor": strokeColor.value,
        "strokeLinecap": props.strokeLinecap,
        "trailColor": props.trailColor,
        "prefixCls": props.prefixCls,
        "gapDegree": gapDeg.value,
        "gapPosition": gapPos.value
      }, null);
      return createVNode("div", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": [wrapperClassName.value, attrs.class],
        "style": [attrs.style, circleStyle.value]
      }), [sizeRef.value.width <= 20 ? createVNode(Tooltip, null, {
        default: () => [createVNode("span", null, [circleContent])],
        title: slots.default
      }) : createVNode(Fragment, null, [circleContent, (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)])]);
    };
  }
});

const stepsProps = () => _extends(_extends({}, progressProps()), {
  steps: Number,
  strokeColor: someType(),
  trailColor: String
});
const Steps = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'Steps',
  props: stepsProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const current = computed(() => Math.round(props.steps * ((props.percent || 0) / 100)));
    const mergedSize = computed(() => {
      var _a;
      return (_a = props.size) !== null && _a !== void 0 ? _a : [props.size === 'small' ? 2 : 14, props.strokeWidth || 8];
    });
    const sizeRef = computed(() => getSize(mergedSize.value, 'step', {
      steps: props.steps,
      strokeWidth: props.strokeWidth || 8
    }));
    const styledSteps = computed(() => {
      const {
        steps,
        strokeColor,
        trailColor,
        prefixCls
      } = props;
      const temp = [];
      for (let i = 0; i < steps; i += 1) {
        const color = Array.isArray(strokeColor) ? strokeColor[i] : strokeColor;
        const cls = {
          [`${prefixCls}-steps-item`]: true,
          [`${prefixCls}-steps-item-active`]: i <= current.value - 1
        };
        temp.push(createVNode("div", {
          "key": i,
          "class": cls,
          "style": {
            backgroundColor: i <= current.value - 1 ? color : trailColor,
            width: `${sizeRef.value.width / steps}px`,
            height: `${sizeRef.value.height}px`
          }
        }, null));
      }
      return temp;
    });
    return () => {
      var _a;
      return createVNode("div", {
        "class": `${props.prefixCls}-steps-outer`
      }, [styledSteps.value, (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
    };
  }
});

const antProgressActive = new Keyframe('antProgressActive', {
  '0%': {
    transform: 'translateX(-100%) scaleX(0)',
    opacity: 0.1
  },
  '20%': {
    transform: 'translateX(-100%) scaleX(0)',
    opacity: 0.5
  },
  to: {
    transform: 'translateX(0) scaleX(1)',
    opacity: 0
  }
});
const genBaseStyle = token => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: _extends(_extends({}, resetComponent(token)), {
      display: 'inline-block',
      '&-rtl': {
        direction: 'rtl'
      },
      '&-line': {
        position: 'relative',
        width: '100%',
        fontSize: token.fontSize,
        marginInlineEnd: token.marginXS,
        marginBottom: token.marginXS
      },
      [`${progressCls}-outer`]: {
        display: 'inline-block',
        width: '100%'
      },
      [`&${progressCls}-show-info`]: {
        [`${progressCls}-outer`]: {
          marginInlineEnd: `calc(-2em - ${token.marginXS}px)`,
          paddingInlineEnd: `calc(2em + ${token.paddingXS}px)`
        }
      },
      [`${progressCls}-inner`]: {
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        overflow: 'hidden',
        verticalAlign: 'middle',
        backgroundColor: token.progressRemainingColor,
        borderRadius: token.progressLineRadius
      },
      [`${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.colorInfo
        }
      },
      [`${progressCls}-success-bg, ${progressCls}-bg`]: {
        position: 'relative',
        backgroundColor: token.colorInfo,
        borderRadius: token.progressLineRadius,
        transition: `all ${token.motionDurationSlow} ${token.motionEaseInOutCirc}`
      },
      [`${progressCls}-success-bg`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineStart: 0,
        backgroundColor: token.colorSuccess
      },
      [`${progressCls}-text`]: {
        display: 'inline-block',
        width: '2em',
        marginInlineStart: token.marginXS,
        color: token.progressInfoTextColor,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        textAlign: 'start',
        verticalAlign: 'middle',
        wordBreak: 'normal',
        [iconPrefixCls]: {
          fontSize: token.fontSize
        }
      },
      [`&${progressCls}-status-active`]: {
        [`${progressCls}-bg::before`]: {
          position: 'absolute',
          inset: 0,
          backgroundColor: token.colorBgContainer,
          borderRadius: token.progressLineRadius,
          opacity: 0,
          animationName: antProgressActive,
          animationDuration: token.progressActiveMotionDuration,
          animationTimingFunction: token.motionEaseOutQuint,
          animationIterationCount: 'infinite',
          content: '""'
        }
      },
      [`&${progressCls}-status-exception`]: {
        [`${progressCls}-bg`]: {
          backgroundColor: token.colorError
        },
        [`${progressCls}-text`]: {
          color: token.colorError
        }
      },
      [`&${progressCls}-status-exception ${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.colorError
        }
      },
      [`&${progressCls}-status-success`]: {
        [`${progressCls}-bg`]: {
          backgroundColor: token.colorSuccess
        },
        [`${progressCls}-text`]: {
          color: token.colorSuccess
        }
      },
      [`&${progressCls}-status-success ${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.colorSuccess
        }
      }
    })
  };
};
const genCircleStyle = token => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-circle-trail`]: {
        stroke: token.progressRemainingColor
      },
      [`&${progressCls}-circle ${progressCls}-inner`]: {
        position: 'relative',
        lineHeight: 1,
        backgroundColor: 'transparent'
      },
      [`&${progressCls}-circle ${progressCls}-text`]: {
        position: 'absolute',
        insetBlockStart: '50%',
        insetInlineStart: 0,
        width: '100%',
        margin: 0,
        padding: 0,
        color: token.colorText,
        lineHeight: 1,
        whiteSpace: 'normal',
        textAlign: 'center',
        transform: 'translateY(-50%)',
        [iconPrefixCls]: {
          fontSize: `${token.fontSize / token.fontSizeSM}em`
        }
      },
      [`${progressCls}-circle&-status-exception`]: {
        [`${progressCls}-text`]: {
          color: token.colorError
        }
      },
      [`${progressCls}-circle&-status-success`]: {
        [`${progressCls}-text`]: {
          color: token.colorSuccess
        }
      }
    },
    [`${progressCls}-inline-circle`]: {
      lineHeight: 1,
      [`${progressCls}-inner`]: {
        verticalAlign: 'bottom'
      }
    }
  };
};
const genStepStyle = token => {
  const {
    componentCls: progressCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-steps`]: {
        display: 'inline-block',
        '&-outer': {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        },
        '&-item': {
          flexShrink: 0,
          minWidth: token.progressStepMinWidth,
          marginInlineEnd: token.progressStepMarginInlineEnd,
          backgroundColor: token.progressRemainingColor,
          transition: `all ${token.motionDurationSlow}`,
          '&-active': {
            backgroundColor: token.colorInfo
          }
        }
      }
    }
  };
};
const genSmallLine = token => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-small&-line, ${progressCls}-small&-line ${progressCls}-text ${iconPrefixCls}`]: {
        fontSize: token.fontSizeSM
      }
    }
  };
};
const useStyle = genComponentStyleHook('Progress', token => {
  const progressStepMarginInlineEnd = token.marginXXS / 2;
  const progressToken = merge(token, {
    progressLineRadius: 100,
    progressInfoTextColor: token.colorText,
    progressDefaultColor: token.colorInfo,
    progressRemainingColor: token.colorFillSecondary,
    progressStepMarginInlineEnd,
    progressStepMinWidth: progressStepMarginInlineEnd,
    progressActiveMotionDuration: '2.4s'
  });
  return [genBaseStyle(progressToken), genCircleStyle(progressToken), genStepStyle(progressToken), genSmallLine(progressToken)];
});

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const Progress$1 = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AProgress',
  inheritAttrs: false,
  props: initDefaultProps(progressProps(), {
    type: 'line',
    percent: 0,
    showInfo: true,
    // null for different theme definition
    trailColor: null,
    size: 'default',
    strokeLinecap: 'round'
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
    } = useConfigInject('progress', props);
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const strokeColorNotArray = computed(() => Array.isArray(props.strokeColor) ? props.strokeColor[0] : props.strokeColor);
    const percentNumber = computed(() => {
      const {
        percent = 0
      } = props;
      const successPercent = getSuccessPercent(props);
      return parseInt(successPercent !== undefined ? successPercent.toString() : percent.toString(), 10);
    });
    const progressStatus = computed(() => {
      const {
        status
      } = props;
      if (!progressStatuses.includes(status) && percentNumber.value >= 100) {
        return 'success';
      }
      return status || 'normal';
    });
    const classString = computed(() => {
      const {
        type,
        showInfo,
        size
      } = props;
      const pre = prefixCls.value;
      return {
        [pre]: true,
        [`${pre}-inline-circle`]: type === 'circle' && getSize(size, 'circle').width <= 20,
        [`${pre}-${type === 'dashboard' && 'circle' || type}`]: true,
        [`${pre}-status-${progressStatus.value}`]: true,
        [`${pre}-show-info`]: showInfo,
        [`${pre}-${size}`]: size,
        [`${pre}-rtl`]: direction.value === 'rtl',
        [hashId.value]: true
      };
    });
    const strokeColorNotGradient = computed(() => typeof props.strokeColor === 'string' || Array.isArray(props.strokeColor) ? props.strokeColor : undefined);
    const renderProcessInfo = () => {
      const {
        showInfo,
        format,
        type,
        percent,
        title
      } = props;
      const successPercent = getSuccessPercent(props);
      if (!showInfo) return null;
      let text;
      const textFormatter = format || (slots === null || slots === void 0 ? void 0 : slots.format) || (val => `${val}%`);
      const isLineType = type === 'line';
      if (format || (slots === null || slots === void 0 ? void 0 : slots.format) || progressStatus.value !== 'exception' && progressStatus.value !== 'success') {
        text = textFormatter(validProgress(percent), validProgress(successPercent));
      } else if (progressStatus.value === 'exception') {
        text = isLineType ? createVNode(CloseCircleFilled, null, null) : createVNode(CloseOutlined, null, null);
      } else if (progressStatus.value === 'success') {
        text = isLineType ? createVNode(CheckCircleFilled, null, null) : createVNode(CheckOutlined, null, null);
      }
      return createVNode("span", {
        "class": `${prefixCls.value}-text`,
        "title": title === undefined && typeof text === 'string' ? text : undefined
      }, [text]);
    };
    return () => {
      const {
        type,
        steps,
        title
      } = props;
      const {
          class: cls
        } = attrs,
        restAttrs = __rest(attrs, ["class"]);
      const progressInfo = renderProcessInfo();
      let progress;
      // Render progress shape
      if (type === 'line') {
        progress = steps ? createVNode(Steps, _objectSpread(_objectSpread({}, props), {}, {
          "strokeColor": strokeColorNotGradient.value,
          "prefixCls": prefixCls.value,
          "steps": steps
        }), {
          default: () => [progressInfo]
        }) : createVNode(Line, _objectSpread(_objectSpread({}, props), {}, {
          "strokeColor": strokeColorNotArray.value,
          "prefixCls": prefixCls.value,
          "direction": direction.value
        }), {
          default: () => [progressInfo]
        });
      } else if (type === 'circle' || type === 'dashboard') {
        progress = createVNode(Circle, _objectSpread(_objectSpread({}, props), {}, {
          "prefixCls": prefixCls.value,
          "strokeColor": strokeColorNotArray.value,
          "progressStatus": progressStatus.value
        }), {
          default: () => [progressInfo]
        });
      }
      return wrapSSR(createVNode("div", _objectSpread(_objectSpread({
        "role": "progressbar"
      }, restAttrs), {}, {
        "class": [classString.value, cls],
        "title": title
      }), [progress]));
    };
  }
});

const Progress = withInstall(Progress$1);

export { Progress as P };
//# sourceMappingURL=index19.mjs.map
