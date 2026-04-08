import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import _extends from '@babel/runtime/helpers/esm/extends';
import { createVNode, defineComponent, ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import { g as genComponentStyleHook, m as merge, r as resetComponent, u as useConfigInject, e as initDefaultProps, f as booleanType, v as vNodeType, h as anyType, j as functionType, s as someType, o as omit } from './collapseMotion.mjs';
import { c as Skeleton } from './index.mjs';

const StatisticNumber = props => {
  const {
    value,
    formatter,
    precision,
    decimalSeparator,
    groupSeparator = '',
    prefixCls
  } = props;
  let valueNode;
  if (typeof formatter === 'function') {
    // Customize formatter
    valueNode = formatter({
      value
    });
  } else {
    // Internal formatter
    const val = String(value);
    const cells = val.match(/^(-?)(\d*)(\.(\d+))?$/);
    // Process if illegal number
    if (!cells) {
      valueNode = val;
    } else {
      const negative = cells[1];
      let int = cells[2] || '0';
      let decimal = cells[4] || '';
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
      if (typeof precision === 'number') {
        decimal = decimal.padEnd(precision, '0').slice(0, precision > 0 ? precision : 0);
      }
      if (decimal) {
        decimal = `${decimalSeparator}${decimal}`;
      }
      valueNode = [createVNode("span", {
        "key": "int",
        "class": `${prefixCls}-content-value-int`
      }, [negative, int]), decimal && createVNode("span", {
        "key": "decimal",
        "class": `${prefixCls}-content-value-decimal`
      }, [decimal])];
    }
  }
  return createVNode("span", {
    "class": `${prefixCls}-content-value`
  }, [valueNode]);
};
StatisticNumber.displayName = 'StatisticNumber';

const genStatisticStyle = token => {
  const {
    componentCls,
    marginXXS,
    padding,
    colorTextDescription,
    statisticTitleFontSize,
    colorTextHeading,
    statisticContentFontSize,
    statisticFontFamily
  } = token;
  return {
    [`${componentCls}`]: _extends(_extends({}, resetComponent(token)), {
      [`${componentCls}-title`]: {
        marginBottom: marginXXS,
        color: colorTextDescription,
        fontSize: statisticTitleFontSize
      },
      [`${componentCls}-skeleton`]: {
        paddingTop: padding
      },
      [`${componentCls}-content`]: {
        color: colorTextHeading,
        fontSize: statisticContentFontSize,
        fontFamily: statisticFontFamily,
        [`${componentCls}-content-value`]: {
          display: 'inline-block',
          direction: 'ltr'
        },
        [`${componentCls}-content-prefix, ${componentCls}-content-suffix`]: {
          display: 'inline-block'
        },
        [`${componentCls}-content-prefix`]: {
          marginInlineEnd: marginXXS
        },
        [`${componentCls}-content-suffix`]: {
          marginInlineStart: marginXXS
        }
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('Statistic', token => {
  const {
    fontSizeHeading3,
    fontSize,
    fontFamily
  } = token;
  const statisticToken = merge(token, {
    statisticTitleFontSize: fontSize,
    statisticContentFontSize: fontSizeHeading3,
    statisticFontFamily: fontFamily
  });
  return [genStatisticStyle(statisticToken)];
});

const statisticProps = () => ({
  prefixCls: String,
  decimalSeparator: String,
  groupSeparator: String,
  format: String,
  value: someType([Number, String, Object]),
  valueStyle: {
    type: Object,
    default: undefined
  },
  valueRender: functionType(),
  formatter: anyType(),
  precision: Number,
  prefix: vNodeType(),
  suffix: vNodeType(),
  title: vNodeType(),
  loading: booleanType()
});
const Statistic = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AStatistic',
  inheritAttrs: false,
  props: initDefaultProps(statisticProps(), {
    decimalSeparator: '.',
    groupSeparator: ',',
    loading: false
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
    } = useConfigInject('statistic', props);
    // Style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    return () => {
      var _a, _b, _c, _d, _e, _f, _g;
      const {
        value = 0,
        valueStyle,
        valueRender
      } = props;
      const pre = prefixCls.value;
      const title = (_a = props.title) !== null && _a !== void 0 ? _a : (_b = slots.title) === null || _b === void 0 ? void 0 : _b.call(slots);
      const prefix = (_c = props.prefix) !== null && _c !== void 0 ? _c : (_d = slots.prefix) === null || _d === void 0 ? void 0 : _d.call(slots);
      const suffix = (_e = props.suffix) !== null && _e !== void 0 ? _e : (_f = slots.suffix) === null || _f === void 0 ? void 0 : _f.call(slots);
      const formatter = (_g = props.formatter) !== null && _g !== void 0 ? _g : slots.formatter;
      // data-for-update just for update component
      // https://github.com/vueComponent/ant-design-vue/pull/3170
      let valueNode = createVNode(StatisticNumber, _objectSpread({
        "data-for-update": Date.now()
      }, _extends(_extends({}, props), {
        prefixCls: pre,
        value,
        formatter
      })), null);
      if (valueRender) {
        valueNode = valueRender(valueNode);
      }
      return wrapSSR(createVNode("div", _objectSpread(_objectSpread({}, attrs), {}, {
        "class": [pre, {
          [`${pre}-rtl`]: direction.value === 'rtl'
        }, attrs.class, hashId.value]
      }), [title && createVNode("div", {
        "class": `${pre}-title`
      }, [title]), createVNode(Skeleton, {
        "paragraph": false,
        "loading": props.loading
      }, {
        default: () => [createVNode("div", {
          "style": valueStyle,
          "class": `${pre}-content`
        }, [prefix && createVNode("span", {
          "class": `${pre}-content-prefix`
        }, [prefix]), valueNode, suffix && createVNode("span", {
          "class": `${pre}-content-suffix`
        }, [suffix])])]
      })]));
    };
  }
});

// Countdown
const timeUnits = [['Y', 1000 * 60 * 60 * 24 * 365], ['M', 1000 * 60 * 60 * 24 * 30], ['D', 1000 * 60 * 60 * 24], ['H', 1000 * 60 * 60], ['m', 1000 * 60], ['s', 1000], ['S', 1] // million seconds
];
function formatTimeStr(duration, format) {
  let leftDuration = duration;
  const escapeRegex = /\[[^\]]*]/g;
  const keepList = (format.match(escapeRegex) || []).map(str => str.slice(1, -1));
  const templateText = format.replace(escapeRegex, '[]');
  const replacedText = timeUnits.reduce((current, _ref) => {
    let [name, unit] = _ref;
    if (current.includes(name)) {
      const value = Math.floor(leftDuration / unit);
      leftDuration -= value * unit;
      return current.replace(new RegExp(`${name}+`, 'g'), match => {
        const len = match.length;
        return value.toString().padStart(len, '0');
      });
    }
    return current;
  }, templateText);
  let index = 0;
  return replacedText.replace(escapeRegex, () => {
    const match = keepList[index];
    index += 1;
    return match;
  });
}
function formatCountdown(value, config) {
  const {
    format = ''
  } = config;
  const target = new Date(value).getTime();
  const current = Date.now();
  const diff = Math.max(target - current, 0);
  return formatTimeStr(diff, format);
}

const REFRESH_INTERVAL = 1000 / 30;
function getTime(value) {
  return new Date(value).getTime();
}
const countdownProps = () => {
  return _extends(_extends({}, statisticProps()), {
    value: someType([Number, String, Object]),
    format: String,
    onFinish: Function,
    onChange: Function
  });
};
const Countdown = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AStatisticCountdown',
  props: initDefaultProps(countdownProps(), {
    format: 'HH:mm:ss'
  }),
  // emits: ['finish', 'change'],
  setup(props, _ref) {
    let {
      emit,
      slots
    } = _ref;
    const countdownId = ref();
    const statistic = ref();
    const syncTimer = () => {
      const {
        value
      } = props;
      const timestamp = getTime(value);
      if (timestamp >= Date.now()) {
        startTimer();
      } else {
        stopTimer();
      }
    };
    const startTimer = () => {
      if (countdownId.value) return;
      const timestamp = getTime(props.value);
      countdownId.value = setInterval(() => {
        statistic.value.$forceUpdate();
        if (timestamp > Date.now()) {
          emit('change', timestamp - Date.now());
        }
        syncTimer();
      }, REFRESH_INTERVAL);
    };
    const stopTimer = () => {
      const {
        value
      } = props;
      if (countdownId.value) {
        clearInterval(countdownId.value);
        countdownId.value = undefined;
        const timestamp = getTime(value);
        if (timestamp < Date.now()) {
          emit('finish');
        }
      }
    };
    const formatCountdown$1 = _ref2 => {
      let {
        value,
        config
      } = _ref2;
      const {
        format
      } = props;
      return formatCountdown(value, _extends(_extends({}, config), {
        format
      }));
    };
    const valueRenderHtml = node => node;
    onMounted(() => {
      syncTimer();
    });
    onUpdated(() => {
      syncTimer();
    });
    onBeforeUnmount(() => {
      stopTimer();
    });
    return () => {
      const value = props.value;
      return createVNode(Statistic, _objectSpread({
        "ref": statistic
      }, _extends(_extends({}, omit(props, ['onFinish', 'onChange'])), {
        value,
        valueRender: valueRenderHtml,
        formatter: formatCountdown$1
      })), slots);
    };
  }
});

Statistic.Countdown = Countdown;
/* istanbul ignore next */
Statistic.install = function (app) {
  app.component(Statistic.name, Statistic);
  app.component(Statistic.Countdown.name, Statistic.Countdown);
  return app;
};
Statistic.Countdown;

export { Statistic as S };
//# sourceMappingURL=index2.mjs.map
