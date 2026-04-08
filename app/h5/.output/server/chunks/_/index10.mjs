import _objectSpread$1 from '@babel/runtime/helpers/esm/objectSpread2';
import _extends from '@babel/runtime/helpers/esm/extends';
import { createVNode, defineComponent, ref, onBeforeUnmount, shallowRef, computed, watch, toRef } from 'vue';
import { I as Icon, c as classNames, j as functionType, z as warning, A as wrapperRaf, f as booleanType, s as someType, D as stringType, g as genComponentStyleHook, F as genCompactItemStyle, r as resetComponent, G as resetIcon, u as useConfigInject, H as useCompactItemContext, J as useInjectDisabled, o as omit, N as NoCompactStyle, b as cloneElement, P as PropTypes, w as withInstall, K as warning$1, M as useLocaleReceiver, O as getTransitionName, Q as cloneVNodes, e as initDefaultProps, R as tooltipDefaultProps, S as convertLegacyProps, B as Button, T as abstractTooltipProps, x as objectType, h as anyType, U as localeValues } from './collapseMotion.mjs';
import { i as isMobile, D as DownOutlined, u as useMergedState } from './index.mjs';
import { K as KeyCode } from './index4.mjs';
import { i as initInputToken, g as genBasicInputStyle, b as genStatusStyle, c as genPlaceholderStyle, d as genInputGroupStyle, e as genDisabledStyle, f as genActiveStyle, h as genHoverStyle, u as useInjectFormItemContext, F as FormItemInputContext, j as getMergedStatus, k as getStatusClassNames, N as NoFormStatus } from './index5.mjs';
import { P as Popover } from './index12.mjs';
import { E as ExclamationCircleFilled } from './ExclamationCircleFilled.mjs';
import { A as ActionButton } from './index11.mjs';

// This icon file is generated automatically.
var UpOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z" } }] }, "name": "up", "theme": "outlined" };

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var UpOutlined = function UpOutlined(props, context) {
  var p = _objectSpread({}, props, context.attrs);

  return createVNode(Icon, _objectSpread({}, p, {
    "icon": UpOutlined$1
  }), null);
};

UpOutlined.displayName = 'UpOutlined';
UpOutlined.inheritAttrs = false;

function supportBigInt() {
  return typeof BigInt === 'function';
}

/**
 * Format string number to readable number
 */
function trimNumber(numStr) {
  let str = numStr.trim();
  let negative = str.startsWith('-');
  if (negative) {
    str = str.slice(1);
  }
  str = str
  // Remove decimal 0. `1.000` => `1.`, `1.100` => `1.1`
  .replace(/(\.\d*[^0])0*$/, '$1')
  // Remove useless decimal. `1.` => `1`
  .replace(/\.0*$/, '')
  // Remove integer 0. `0001` => `1`, 000.1' => `.1`
  .replace(/^0+/, '');
  if (str.startsWith('.')) {
    str = `0${str}`;
  }
  const trimStr = str || '0';
  const splitNumber = trimStr.split('.');
  const integerStr = splitNumber[0] || '0';
  const decimalStr = splitNumber[1] || '0';
  if (integerStr === '0' && decimalStr === '0') {
    negative = false;
  }
  const negativeStr = negative ? '-' : '';
  return {
    negative,
    negativeStr,
    trimStr,
    integerStr,
    decimalStr,
    fullStr: `${negativeStr}${trimStr}`
  };
}
function isE(number) {
  const str = String(number);
  return !Number.isNaN(Number(str)) && str.includes('e');
}
/**
 * [Legacy] Convert 1e-9 to 0.000000001.
 * This may lose some precision if user really want 1e-9.
 */
function getNumberPrecision(number) {
  const numStr = String(number);
  if (isE(number)) {
    let precision = Number(numStr.slice(numStr.indexOf('e-') + 2));
    const decimalMatch = numStr.match(/\.(\d+)/);
    if (decimalMatch === null || decimalMatch === void 0 ? void 0 : decimalMatch[1]) {
      precision += decimalMatch[1].length;
    }
    return precision;
  }
  return numStr.includes('.') && validateNumber(numStr) ? numStr.length - numStr.indexOf('.') - 1 : 0;
}
/**
 * Convert number (includes scientific notation) to -xxx.yyy format
 */
function num2str(number) {
  let numStr = String(number);
  if (isE(number)) {
    if (number > Number.MAX_SAFE_INTEGER) {
      return String(supportBigInt() ? BigInt(number).toString() : Number.MAX_SAFE_INTEGER);
    }
    if (number < Number.MIN_SAFE_INTEGER) {
      return String(supportBigInt() ? BigInt(number).toString() : Number.MIN_SAFE_INTEGER);
    }
    numStr = number.toFixed(getNumberPrecision(numStr));
  }
  return trimNumber(numStr).fullStr;
}
function validateNumber(num) {
  if (typeof num === 'number') {
    return !Number.isNaN(num);
  }
  // Empty
  if (!num) {
    return false;
  }
  return (
    // Normal type: 11.28
    /^\s*-?\d+(\.\d+)?\s*$/.test(num) ||
    // Pre-number: 1.
    /^\s*-?\d+\.\s*$/.test(num) ||
    // Post-number: .1
    /^\s*-?\.\d+\s*$/.test(num)
  );
}

/* eslint-disable max-classes-per-file */
function isEmpty(value) {
  return !value && value !== 0 && !Number.isNaN(value) || !String(value).trim();
}
/**
 * We can remove this when IE not support anymore
 */
class NumberDecimal {
  constructor(value) {
    this.origin = '';
    if (isEmpty(value)) {
      this.empty = true;
      return;
    }
    this.origin = String(value);
    this.number = Number(value);
  }
  negate() {
    return new NumberDecimal(-this.toNumber());
  }
  add(value) {
    if (this.isInvalidate()) {
      return new NumberDecimal(value);
    }
    const target = Number(value);
    if (Number.isNaN(target)) {
      return this;
    }
    const number = this.number + target;
    // [Legacy] Back to safe integer
    if (number > Number.MAX_SAFE_INTEGER) {
      return new NumberDecimal(Number.MAX_SAFE_INTEGER);
    }
    if (number < Number.MIN_SAFE_INTEGER) {
      return new NumberDecimal(Number.MIN_SAFE_INTEGER);
    }
    const maxPrecision = Math.max(getNumberPrecision(this.number), getNumberPrecision(target));
    return new NumberDecimal(number.toFixed(maxPrecision));
  }
  isEmpty() {
    return this.empty;
  }
  isNaN() {
    return Number.isNaN(this.number);
  }
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }
  equals(target) {
    return this.toNumber() === (target === null || target === void 0 ? void 0 : target.toNumber());
  }
  lessEquals(target) {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }
  toNumber() {
    return this.number;
  }
  toString() {
    let safe = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }
    return num2str(this.number);
  }
}
class BigIntDecimal {
  constructor(value) {
    this.origin = '';
    if (isEmpty(value)) {
      this.empty = true;
      return;
    }
    this.origin = String(value);
    // Act like Number convert
    if (value === '-' || Number.isNaN(value)) {
      this.nan = true;
      return;
    }
    let mergedValue = value;
    // We need convert back to Number since it require `toFixed` to handle this
    if (isE(mergedValue)) {
      mergedValue = Number(mergedValue);
    }
    mergedValue = typeof mergedValue === 'string' ? mergedValue : num2str(mergedValue);
    if (validateNumber(mergedValue)) {
      const trimRet = trimNumber(mergedValue);
      this.negative = trimRet.negative;
      const numbers = trimRet.trimStr.split('.');
      this.integer = BigInt(numbers[0]);
      const decimalStr = numbers[1] || '0';
      this.decimal = BigInt(decimalStr);
      this.decimalLen = decimalStr.length;
    } else {
      this.nan = true;
    }
  }
  getMark() {
    return this.negative ? '-' : '';
  }
  getIntegerStr() {
    return this.integer.toString();
  }
  getDecimalStr() {
    return this.decimal.toString().padStart(this.decimalLen, '0');
  }
  /**
   * Align BigIntDecimal with same decimal length. e.g. 12.3 + 5 = 1230000
   * This is used for add function only.
   */
  alignDecimal(decimalLength) {
    const str = `${this.getMark()}${this.getIntegerStr()}${this.getDecimalStr().padEnd(decimalLength, '0')}`;
    return BigInt(str);
  }
  negate() {
    const clone = new BigIntDecimal(this.toString());
    clone.negative = !clone.negative;
    return clone;
  }
  add(value) {
    if (this.isInvalidate()) {
      return new BigIntDecimal(value);
    }
    const offset = new BigIntDecimal(value);
    if (offset.isInvalidate()) {
      return this;
    }
    const maxDecimalLength = Math.max(this.getDecimalStr().length, offset.getDecimalStr().length);
    const myAlignedDecimal = this.alignDecimal(maxDecimalLength);
    const offsetAlignedDecimal = offset.alignDecimal(maxDecimalLength);
    const valueStr = (myAlignedDecimal + offsetAlignedDecimal).toString();
    // We need fill string length back to `maxDecimalLength` to avoid parser failed
    const {
      negativeStr,
      trimStr
    } = trimNumber(valueStr);
    const hydrateValueStr = `${negativeStr}${trimStr.padStart(maxDecimalLength + 1, '0')}`;
    return new BigIntDecimal(`${hydrateValueStr.slice(0, -maxDecimalLength)}.${hydrateValueStr.slice(-maxDecimalLength)}`);
  }
  isEmpty() {
    return this.empty;
  }
  isNaN() {
    return this.nan;
  }
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }
  equals(target) {
    return this.toString() === (target === null || target === void 0 ? void 0 : target.toString());
  }
  lessEquals(target) {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }
  toNumber() {
    if (this.isNaN()) {
      return NaN;
    }
    return Number(this.toString());
  }
  toString() {
    let safe = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }
    return trimNumber(`${this.getMark()}${this.getIntegerStr()}.${this.getDecimalStr()}`).fullStr;
  }
}
function getMiniDecimal(value) {
  // We use BigInt here.
  // Will fallback to Number if not support.
  if (supportBigInt()) {
    return new BigIntDecimal(value);
  }
  return new NumberDecimal(value);
}
/**
 * Align the logic of toFixed to around like 1.5 => 2.
 * If set `cutOnly`, will just remove the over decimal part.
 */
function toFixed(numStr, separatorStr, precision) {
  let cutOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (numStr === '') {
    return '';
  }
  const {
    negativeStr,
    integerStr,
    decimalStr
  } = trimNumber(numStr);
  const precisionDecimalStr = `${separatorStr}${decimalStr}`;
  const numberWithoutDecimal = `${negativeStr}${integerStr}`;
  if (precision >= 0) {
    // We will get last + 1 number to check if need advanced number
    const advancedNum = Number(decimalStr[precision]);
    if (advancedNum >= 5 && !cutOnly) {
      const advancedDecimal = getMiniDecimal(numStr).add(`${negativeStr}0.${'0'.repeat(precision)}${10 - advancedNum}`);
      return toFixed(advancedDecimal.toString(), separatorStr, precision, cutOnly);
    }
    if (precision === 0) {
      return numberWithoutDecimal;
    }
    return `${numberWithoutDecimal}${separatorStr}${decimalStr.padEnd(precision, '0').slice(0, precision)}`;
  }
  if (precisionDecimalStr === '.0') {
    return numberWithoutDecimal;
  }
  return `${numberWithoutDecimal}${precisionDecimalStr}`;
}

/**
 * When click and hold on a button - the speed of auto changing the value.
 */
const STEP_INTERVAL = 200;
/**
 * When click and hold on a button - the delay before auto changing the value.
 */
const STEP_DELAY = 600;
const StepHandler = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'StepHandler',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    upDisabled: Boolean,
    downDisabled: Boolean,
    onStep: functionType()
  },
  slots: Object,
  setup(props, _ref) {
    let {
      slots,
      emit
    } = _ref;
    const stepTimeoutRef = ref();
    // We will interval update step when hold mouse down
    const onStepMouseDown = (e, up) => {
      e.preventDefault();
      emit('step', up);
      // Loop step for interval
      function loopStep() {
        emit('step', up);
        stepTimeoutRef.value = setTimeout(loopStep, STEP_INTERVAL);
      }
      // First time press will wait some time to trigger loop step update
      stepTimeoutRef.value = setTimeout(loopStep, STEP_DELAY);
    };
    const onStopStep = () => {
      clearTimeout(stepTimeoutRef.value);
    };
    onBeforeUnmount(() => {
      onStopStep();
    });
    return () => {
      if (isMobile()) {
        return null;
      }
      const {
        prefixCls,
        upDisabled,
        downDisabled
      } = props;
      const handlerClassName = `${prefixCls}-handler`;
      const upClassName = classNames(handlerClassName, `${handlerClassName}-up`, {
        [`${handlerClassName}-up-disabled`]: upDisabled
      });
      const downClassName = classNames(handlerClassName, `${handlerClassName}-down`, {
        [`${handlerClassName}-down-disabled`]: downDisabled
      });
      const sharedHandlerProps = {
        unselectable: 'on',
        role: 'button',
        onMouseup: onStopStep,
        onMouseleave: onStopStep
      };
      const {
        upNode,
        downNode
      } = slots;
      return createVNode("div", {
        "class": `${handlerClassName}-wrap`
      }, [createVNode("span", _objectSpread$1(_objectSpread$1({}, sharedHandlerProps), {}, {
        "onMousedown": e => {
          onStepMouseDown(e, true);
        },
        "aria-label": "Increase Value",
        "aria-disabled": upDisabled,
        "class": upClassName
      }), [(upNode === null || upNode === void 0 ? void 0 : upNode()) || createVNode("span", {
        "unselectable": "on",
        "class": `${prefixCls}-handler-up-inner`
      }, null)]), createVNode("span", _objectSpread$1(_objectSpread$1({}, sharedHandlerProps), {}, {
        "onMousedown": e => {
          onStepMouseDown(e, false);
        },
        "aria-label": "Decrease Value",
        "aria-disabled": downDisabled,
        "class": downClassName
      }), [(downNode === null || downNode === void 0 ? void 0 : downNode()) || createVNode("span", {
        "unselectable": "on",
        "class": `${prefixCls}-handler-down-inner`
      }, null)])]);
    };
  }
});

/**
 * Keep input cursor in the correct position if possible.
 * Is this necessary since we have `formatter` which may mass the content?
 */
function useCursor(inputRef, focused) {
  const selectionRef = ref(null);
  function recordCursor() {
    // Record position
    try {
      const {
        selectionStart: start,
        selectionEnd: end,
        value
      } = inputRef.value;
      const beforeTxt = value.substring(0, start);
      const afterTxt = value.substring(end);
      selectionRef.value = {
        start,
        end,
        value,
        beforeTxt,
        afterTxt
      };
    } catch (e) {
      // Fix error in Chrome:
      // Failed to read the 'selectionStart' property from 'HTMLInputElement'
      // http://stackoverflow.com/q/21177489/3040605
    }
  }
  /**
   * Restore logic:
   *  1. back string same
   *  2. start string same
   */
  function restoreCursor() {
    if (inputRef.value && selectionRef.value && focused.value) {
      try {
        const {
          value
        } = inputRef.value;
        const {
          beforeTxt,
          afterTxt,
          start
        } = selectionRef.value;
        let startPos = value.length;
        if (value.endsWith(afterTxt)) {
          startPos = value.length - selectionRef.value.afterTxt.length;
        } else if (value.startsWith(beforeTxt)) {
          startPos = beforeTxt.length;
        } else {
          const beforeLastChar = beforeTxt[start - 1];
          const newIndex = value.indexOf(beforeLastChar, start - 1);
          if (newIndex !== -1) {
            startPos = newIndex + 1;
          }
        }
        inputRef.value.setSelectionRange(startPos, startPos);
      } catch (e) {
        warning(false, `Something warning of cursor restore. Please fire issue about this: ${e.message}`);
      }
    }
  }
  return [recordCursor, restoreCursor];
}

/**
 * Always trigger latest once when call multiple time
 */
const useFrame = (() => {
  const idRef = shallowRef(0);
  const cleanUp = () => {
    wrapperRaf.cancel(idRef.value);
  };
  onBeforeUnmount(() => {
    cleanUp();
  });
  return callback => {
    cleanUp();
    idRef.value = wrapperRaf(() => {
      callback();
    });
  };
});

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
/**
 * We support `stringMode` which need handle correct type when user call in onChange
 * format max or min value
 * 1. if isInvalid return null
 * 2. if precision is undefined, return decimal
 * 3. format with precision
 *    I. if max > 0, round down with precision. Example: max= 3.5, precision=0  afterFormat: 3
 *    II. if max < 0, round up with precision. Example: max= -3.5, precision=0  afterFormat: -4
 *    III. if min > 0, round up with precision. Example: min= 3.5, precision=0  afterFormat: 4
 *    IV. if min < 0, round down with precision. Example: max= -3.5, precision=0  afterFormat: -3
 */
const getDecimalValue = (stringMode, decimalValue) => {
  if (stringMode || decimalValue.isEmpty()) {
    return decimalValue.toString();
  }
  return decimalValue.toNumber();
};
const getDecimalIfValidate = value => {
  const decimal = getMiniDecimal(value);
  return decimal.isInvalidate() ? null : decimal;
};
const inputNumberProps$1 = () => ({
  /** value will show as string */
  stringMode: booleanType(),
  defaultValue: someType([String, Number]),
  value: someType([String, Number]),
  prefixCls: stringType(),
  min: someType([String, Number]),
  max: someType([String, Number]),
  step: someType([String, Number], 1),
  tabindex: Number,
  controls: booleanType(true),
  readonly: booleanType(),
  disabled: booleanType(),
  autofocus: booleanType(),
  keyboard: booleanType(true),
  /** Parse display value to validate number */
  parser: functionType(),
  /** Transform `value` to display value show in input */
  formatter: functionType(),
  /** Syntactic sugar of `formatter`. Config precision of display. */
  precision: Number,
  /** Syntactic sugar of `formatter`. Config decimal separator of display. */
  decimalSeparator: String,
  onInput: functionType(),
  onChange: functionType(),
  onPressEnter: functionType(),
  onStep: functionType(),
  onBlur: functionType(),
  onFocus: functionType()
});
const VcInputNumber = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'InnerInputNumber',
  inheritAttrs: false,
  props: _extends(_extends({}, inputNumberProps$1()), {
    lazy: Boolean
  }),
  slots: Object,
  setup(props, _ref) {
    let {
      attrs,
      slots,
      emit,
      expose
    } = _ref;
    const inputRef = shallowRef();
    const focus = shallowRef(false);
    const userTypingRef = shallowRef(false);
    const compositionRef = shallowRef(false);
    const decimalValue = shallowRef(getMiniDecimal(props.value));
    function setUncontrolledDecimalValue(newDecimal) {
      if (props.value === undefined) {
        decimalValue.value = newDecimal;
      }
    }
    // ====================== Parser & Formatter ======================
    /**
     * `precision` is used for formatter & onChange.
     * It will auto generate by `value` & `step`.
     * But it will not block user typing.
     *
     * Note: Auto generate `precision` is used for legacy logic.
     * We should remove this since we already support high precision with BigInt.
     *
     * @param number  Provide which number should calculate precision
     * @param userTyping  Change by user typing
     */
    const getPrecision = (numStr, userTyping) => {
      if (userTyping) {
        return undefined;
      }
      if (props.precision >= 0) {
        return props.precision;
      }
      return Math.max(getNumberPrecision(numStr), getNumberPrecision(props.step));
    };
    // >>> Parser
    const mergedParser = num => {
      const numStr = String(num);
      if (props.parser) {
        return props.parser(numStr);
      }
      let parsedStr = numStr;
      if (props.decimalSeparator) {
        parsedStr = parsedStr.replace(props.decimalSeparator, '.');
      }
      // [Legacy] We still support auto convert `$ 123,456` to `123456`
      return parsedStr.replace(/[^\w.-]+/g, '');
    };
    // >>> Formatter
    const inputValue = shallowRef('');
    const mergedFormatter = (number, userTyping) => {
      if (props.formatter) {
        return props.formatter(number, {
          userTyping,
          input: String(inputValue.value)
        });
      }
      let str = typeof number === 'number' ? num2str(number) : number;
      // User typing will not auto format with precision directly
      if (!userTyping) {
        const mergedPrecision = getPrecision(str, userTyping);
        if (validateNumber(str) && (props.decimalSeparator || mergedPrecision >= 0)) {
          // Separator
          const separatorStr = props.decimalSeparator || '.';
          str = toFixed(str, separatorStr, mergedPrecision);
        }
      }
      return str;
    };
    // ========================== InputValue ==========================
    /**
     * Input text value control
     *
     * User can not update input content directly. It update with follow rules by priority:
     *  1. controlled `value` changed
     *    * [SPECIAL] Typing like `1.` should not immediately convert to `1`
     *  2. User typing with format (not precision)
     *  3. Blur or Enter trigger revalidate
     */
    const initValue = (() => {
      const initValue = props.value;
      if (decimalValue.value.isInvalidate() && ['string', 'number'].includes(typeof initValue)) {
        return Number.isNaN(initValue) ? '' : initValue;
      }
      return mergedFormatter(decimalValue.value.toString(), false);
    })();
    inputValue.value = initValue;
    // Should always be string
    function setInputValue(newValue, userTyping) {
      inputValue.value = mergedFormatter(
      // Invalidate number is sometime passed by external control, we should let it go
      // Otherwise is controlled by internal interactive logic which check by userTyping
      // You can ref 'show limited value when input is not focused' test for more info.
      newValue.isInvalidate() ? newValue.toString(false) : newValue.toString(!userTyping), userTyping);
    }
    // >>> Max & Min limit
    const maxDecimal = computed(() => getDecimalIfValidate(props.max));
    const minDecimal = computed(() => getDecimalIfValidate(props.min));
    const upDisabled = computed(() => {
      if (!maxDecimal.value || !decimalValue.value || decimalValue.value.isInvalidate()) {
        return false;
      }
      return maxDecimal.value.lessEquals(decimalValue.value);
    });
    const downDisabled = computed(() => {
      if (!minDecimal.value || !decimalValue.value || decimalValue.value.isInvalidate()) {
        return false;
      }
      return decimalValue.value.lessEquals(minDecimal.value);
    });
    // Cursor controller
    const [recordCursor, restoreCursor] = useCursor(inputRef, focus);
    // ============================= Data =============================
    /**
     * Find target value closet within range.
     * e.g. [11, 28]:
     *    3  => 11
     *    23 => 23
     *    99 => 28
     */
    const getRangeValue = target => {
      // target > max
      if (maxDecimal.value && !target.lessEquals(maxDecimal.value)) {
        return maxDecimal.value;
      }
      // target < min
      if (minDecimal.value && !minDecimal.value.lessEquals(target)) {
        return minDecimal.value;
      }
      return null;
    };
    /**
     * Check value is in [min, max] range
     */
    const isInRange = target => !getRangeValue(target);
    /**
     * Trigger `onChange` if value validated and not equals of origin.
     * Return the value that re-align in range.
     */
    const triggerValueUpdate = (newValue, userTyping) => {
      var _a;
      let updateValue = newValue;
      let isRangeValidate = isInRange(updateValue) || updateValue.isEmpty();
      // Skip align value when trigger value is empty.
      // We just trigger onChange(null)
      // This should not block user typing
      if (!updateValue.isEmpty() && !userTyping) {
        // Revert value in range if needed
        updateValue = getRangeValue(updateValue) || updateValue;
        isRangeValidate = true;
      }
      if (!props.readonly && !props.disabled && isRangeValidate) {
        const numStr = updateValue.toString();
        const mergedPrecision = getPrecision(numStr, userTyping);
        if (mergedPrecision >= 0) {
          updateValue = getMiniDecimal(toFixed(numStr, '.', mergedPrecision));
        }
        // Trigger event
        if (!updateValue.equals(decimalValue.value)) {
          setUncontrolledDecimalValue(updateValue);
          (_a = props.onChange) === null || _a === void 0 ? void 0 : _a.call(props, updateValue.isEmpty() ? null : getDecimalValue(props.stringMode, updateValue));
          // Reformat input if value is not controlled
          if (props.value === undefined) {
            setInputValue(updateValue, userTyping);
          }
        }
        return updateValue;
      }
      return decimalValue.value;
    };
    // ========================== User Input ==========================
    const onNextPromise = useFrame();
    // >>> Collect input value
    const collectInputValue = inputStr => {
      var _a;
      recordCursor();
      // Update inputValue incase input can not parse as number
      inputValue.value = inputStr;
      // Parse number
      if (!compositionRef.value) {
        const finalValue = mergedParser(inputStr);
        const finalDecimal = getMiniDecimal(finalValue);
        if (!finalDecimal.isNaN()) {
          triggerValueUpdate(finalDecimal, true);
        }
      }
      // Trigger onInput later to let user customize value if they want do handle something after onChange
      (_a = props.onInput) === null || _a === void 0 ? void 0 : _a.call(props, inputStr);
      // optimize for chinese input experience
      // https://github.com/ant-design/ant-design/issues/8196
      onNextPromise(() => {
        let nextInputStr = inputStr;
        if (!props.parser) {
          nextInputStr = inputStr.replace(/。/g, '.');
        }
        if (nextInputStr !== inputStr) {
          collectInputValue(nextInputStr);
        }
      });
    };
    // >>> Composition
    const onCompositionStart = () => {
      compositionRef.value = true;
    };
    const onCompositionEnd = () => {
      compositionRef.value = false;
      collectInputValue(inputRef.value.value);
    };
    // >>> Input
    const onInternalInput = e => {
      collectInputValue(e.target.value);
    };
    // ============================= Step =============================
    const onInternalStep = up => {
      var _a, _b;
      // Ignore step since out of range
      if (up && upDisabled.value || !up && downDisabled.value) {
        return;
      }
      // Clear typing status since it may caused by up & down key.
      // We should sync with input value.
      userTypingRef.value = false;
      let stepDecimal = getMiniDecimal(props.step);
      if (!up) {
        stepDecimal = stepDecimal.negate();
      }
      const target = (decimalValue.value || getMiniDecimal(0)).add(stepDecimal.toString());
      const updatedValue = triggerValueUpdate(target, false);
      (_a = props.onStep) === null || _a === void 0 ? void 0 : _a.call(props, getDecimalValue(props.stringMode, updatedValue), {
        offset: props.step,
        type: up ? 'up' : 'down'
      });
      (_b = inputRef.value) === null || _b === void 0 ? void 0 : _b.focus();
    };
    // ============================ Flush =============================
    /**
     * Flush current input content to trigger value change & re-formatter input if needed
     */
    const flushInputValue = userTyping => {
      const parsedValue = getMiniDecimal(mergedParser(inputValue.value));
      let formatValue = parsedValue;
      if (!parsedValue.isNaN()) {
        // Only validate value or empty value can be re-fill to inputValue
        // Reassign the formatValue within ranged of trigger control
        formatValue = triggerValueUpdate(parsedValue, userTyping);
      } else {
        formatValue = decimalValue.value;
      }
      if (props.value !== undefined) {
        // Reset back with controlled value first
        setInputValue(decimalValue.value, false);
      } else if (!formatValue.isNaN()) {
        // Reset input back since no validate value
        setInputValue(formatValue, false);
      }
    };
    // Solve the issue of the event triggering sequence when entering numbers in chinese input (Safari)
    const onBeforeInput = () => {
      userTypingRef.value = true;
    };
    const onKeyDown = event => {
      var _a;
      const {
        which
      } = event;
      userTypingRef.value = true;
      if (which === KeyCode.ENTER) {
        if (!compositionRef.value) {
          userTypingRef.value = false;
        }
        flushInputValue(false);
        (_a = props.onPressEnter) === null || _a === void 0 ? void 0 : _a.call(props, event);
      }
      if (props.keyboard === false) {
        return;
      }
      // Do step
      if (!compositionRef.value && [KeyCode.UP, KeyCode.DOWN].includes(which)) {
        onInternalStep(KeyCode.UP === which);
        event.preventDefault();
      }
    };
    const onKeyUp = () => {
      userTypingRef.value = false;
    };
    // >>> Focus & Blur
    const onBlur = e => {
      flushInputValue(false);
      focus.value = false;
      userTypingRef.value = false;
      emit('blur', e);
    };
    // ========================== Controlled ==========================
    // Input by precision
    watch(() => props.precision, () => {
      if (!decimalValue.value.isInvalidate()) {
        setInputValue(decimalValue.value, false);
      }
    }, {
      flush: 'post'
    });
    // Input by value
    watch(() => props.value, () => {
      const newValue = getMiniDecimal(props.value);
      decimalValue.value = newValue;
      const currentParsedValue = getMiniDecimal(mergedParser(inputValue.value));
      // When user typing from `1.2` to `1.`, we should not convert to `1` immediately.
      // But let it go if user set `formatter`
      if (!newValue.equals(currentParsedValue) || !userTypingRef.value || props.formatter) {
        // Update value as effect
        setInputValue(newValue, userTypingRef.value);
      }
    }, {
      flush: 'post'
    });
    // ============================ Cursor ============================
    watch(inputValue, () => {
      if (props.formatter) {
        restoreCursor();
      }
    }, {
      flush: 'post'
    });
    watch(() => props.disabled, val => {
      if (val) {
        focus.value = false;
      }
    });
    expose({
      focus: () => {
        var _a;
        (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
      },
      blur: () => {
        var _a;
        (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.blur();
      }
    });
    return () => {
      const _a = _extends(_extends({}, attrs), props),
        {
          prefixCls = 'rc-input-number',
          min,
          max,
          step = 1,
          defaultValue,
          value,
          disabled,
          readonly,
          keyboard,
          controls = true,
          autofocus,
          stringMode,
          parser,
          formatter,
          precision,
          decimalSeparator,
          onChange,
          onInput,
          onPressEnter,
          onStep,
          lazy,
          class: className,
          style
        } = _a,
        inputProps = __rest$2(_a, ["prefixCls", "min", "max", "step", "defaultValue", "value", "disabled", "readonly", "keyboard", "controls", "autofocus", "stringMode", "parser", "formatter", "precision", "decimalSeparator", "onChange", "onInput", "onPressEnter", "onStep", "lazy", "class", "style"]);
      const {
        upHandler,
        downHandler
      } = slots;
      const inputClassName = `${prefixCls}-input`;
      const eventProps = {};
      if (lazy) {
        eventProps.onChange = onInternalInput;
      } else {
        eventProps.onInput = onInternalInput;
      }
      return createVNode("div", {
        "class": classNames(prefixCls, className, {
          [`${prefixCls}-focused`]: focus.value,
          [`${prefixCls}-disabled`]: disabled,
          [`${prefixCls}-readonly`]: readonly,
          [`${prefixCls}-not-a-number`]: decimalValue.value.isNaN(),
          [`${prefixCls}-out-of-range`]: !decimalValue.value.isInvalidate() && !isInRange(decimalValue.value)
        }),
        "style": style,
        "onKeydown": onKeyDown,
        "onKeyup": onKeyUp
      }, [controls && createVNode(StepHandler, {
        "prefixCls": prefixCls,
        "upDisabled": upDisabled.value,
        "downDisabled": downDisabled.value,
        "onStep": onInternalStep
      }, {
        upNode: upHandler,
        downNode: downHandler
      }), createVNode("div", {
        "class": `${inputClassName}-wrap`
      }, [createVNode("input", _objectSpread$1(_objectSpread$1(_objectSpread$1({
        "autofocus": autofocus,
        "autocomplete": "off",
        "role": "spinbutton",
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": decimalValue.value.isInvalidate() ? null : decimalValue.value.toString(),
        "step": step
      }, inputProps), {}, {
        "ref": inputRef,
        "class": inputClassName,
        "value": inputValue.value,
        "disabled": disabled,
        "readonly": readonly,
        "onFocus": e => {
          focus.value = true;
          emit('focus', e);
        }
      }, eventProps), {}, {
        "onBlur": onBlur,
        "onCompositionstart": onCompositionStart,
        "onCompositionend": onCompositionEnd,
        "onBeforeinput": onBeforeInput
      }), null)])]);
    };
  }
});

function isValidValue (val) {
  return val !== undefined && val !== null;
}

const genInputNumberStyles = token => {
  const {
    componentCls,
    lineWidth,
    lineType,
    colorBorder,
    borderRadius,
    fontSizeLG,
    controlHeightLG,
    controlHeightSM,
    colorError,
    inputPaddingHorizontalSM,
    colorTextDescription,
    motionDurationMid,
    colorPrimary,
    controlHeight,
    inputPaddingHorizontal,
    colorBgContainer,
    colorTextDisabled,
    borderRadiusSM,
    borderRadiusLG,
    controlWidth,
    handleVisible
  } = token;
  return [{
    [componentCls]: _extends(_extends(_extends(_extends({}, resetComponent(token)), genBasicInputStyle(token)), genStatusStyle(token, componentCls)), {
      display: 'inline-block',
      width: controlWidth,
      margin: 0,
      padding: 0,
      border: `${lineWidth}px ${lineType} ${colorBorder}`,
      borderRadius,
      '&-rtl': {
        direction: 'rtl',
        [`${componentCls}-input`]: {
          direction: 'rtl'
        }
      },
      '&-lg': {
        padding: 0,
        fontSize: fontSizeLG,
        borderRadius: borderRadiusLG,
        [`input${componentCls}-input`]: {
          height: controlHeightLG - 2 * lineWidth
        }
      },
      '&-sm': {
        padding: 0,
        borderRadius: borderRadiusSM,
        [`input${componentCls}-input`]: {
          height: controlHeightSM - 2 * lineWidth,
          padding: `0 ${inputPaddingHorizontalSM}px`
        }
      },
      '&:hover': _extends({}, genHoverStyle(token)),
      '&-focused': _extends({}, genActiveStyle(token)),
      '&-disabled': _extends(_extends({}, genDisabledStyle(token)), {
        [`${componentCls}-input`]: {
          cursor: 'not-allowed'
        }
      }),
      // ===================== Out Of Range =====================
      '&-out-of-range': {
        input: {
          color: colorError
        }
      },
      // Style for input-group: input with label, with button or dropdown...
      '&-group': _extends(_extends(_extends({}, resetComponent(token)), genInputGroupStyle(token)), {
        '&-wrapper': {
          display: 'inline-block',
          textAlign: 'start',
          verticalAlign: 'top',
          [`${componentCls}-affix-wrapper`]: {
            width: '100%'
          },
          // Size
          '&-lg': {
            [`${componentCls}-group-addon`]: {
              borderRadius: borderRadiusLG
            }
          },
          '&-sm': {
            [`${componentCls}-group-addon`]: {
              borderRadius: borderRadiusSM
            }
          }
        }
      }),
      [componentCls]: {
        '&-input': _extends(_extends({
          width: '100%',
          height: controlHeight - 2 * lineWidth,
          padding: `0 ${inputPaddingHorizontal}px`,
          textAlign: 'start',
          backgroundColor: 'transparent',
          border: 0,
          borderRadius,
          outline: 0,
          transition: `all ${motionDurationMid} linear`,
          appearance: 'textfield',
          color: token.colorText,
          fontSize: 'inherit',
          verticalAlign: 'top'
        }, genPlaceholderStyle(token.colorTextPlaceholder)), {
          '&[type="number"]::-webkit-inner-spin-button, &[type="number"]::-webkit-outer-spin-button': {
            margin: 0,
            /* stylelint-disable-next-line property-no-vendor-prefix */
            webkitAppearance: 'none',
            appearance: 'none'
          }
        })
      }
    })
  },
  // Handler
  {
    [componentCls]: {
      [`&:hover ${componentCls}-handler-wrap, &-focused ${componentCls}-handler-wrap`]: {
        opacity: 1
      },
      [`${componentCls}-handler-wrap`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineEnd: 0,
        width: token.handleWidth,
        height: '100%',
        background: colorBgContainer,
        borderStartStartRadius: 0,
        borderStartEndRadius: borderRadius,
        borderEndEndRadius: borderRadius,
        borderEndStartRadius: 0,
        opacity: handleVisible === true ? 1 : 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        transition: `opacity ${motionDurationMid} linear ${motionDurationMid}`,
        // Fix input number inside Menu makes icon too large
        // We arise the selector priority by nest selector here
        // https://github.com/ant-design/ant-design/issues/14367
        [`${componentCls}-handler`]: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'auto',
          height: '40%',
          [`
              ${componentCls}-handler-up-inner,
              ${componentCls}-handler-down-inner
            `]: {
            marginInlineEnd: 0,
            fontSize: token.handleFontSize
          }
        }
      },
      [`${componentCls}-handler`]: {
        height: '50%',
        overflow: 'hidden',
        color: colorTextDescription,
        fontWeight: 'bold',
        lineHeight: 0,
        textAlign: 'center',
        cursor: 'pointer',
        borderInlineStart: `${lineWidth}px ${lineType} ${colorBorder}`,
        transition: `all ${motionDurationMid} linear`,
        '&:active': {
          background: token.colorFillAlter
        },
        // Hover
        '&:hover': {
          height: `60%`,
          [`
              ${componentCls}-handler-up-inner,
              ${componentCls}-handler-down-inner
            `]: {
            color: colorPrimary
          }
        },
        '&-up-inner, &-down-inner': _extends(_extends({}, resetIcon()), {
          color: colorTextDescription,
          transition: `all ${motionDurationMid} linear`,
          userSelect: 'none'
        })
      },
      [`${componentCls}-handler-up`]: {
        borderStartEndRadius: borderRadius
      },
      [`${componentCls}-handler-down`]: {
        borderBlockStart: `${lineWidth}px ${lineType} ${colorBorder}`,
        borderEndEndRadius: borderRadius
      },
      // Disabled
      '&-disabled, &-readonly': {
        [`${componentCls}-handler-wrap`]: {
          display: 'none'
        },
        [`${componentCls}-input`]: {
          color: 'inherit'
        }
      },
      [`
          ${componentCls}-handler-up-disabled,
          ${componentCls}-handler-down-disabled
        `]: {
        cursor: 'not-allowed'
      },
      [`
          ${componentCls}-handler-up-disabled:hover &-handler-up-inner,
          ${componentCls}-handler-down-disabled:hover &-handler-down-inner
        `]: {
        color: colorTextDisabled
      }
    }
  },
  // Border-less
  {
    [`${componentCls}-borderless`]: {
      borderColor: 'transparent',
      boxShadow: 'none',
      [`${componentCls}-handler-down`]: {
        borderBlockStartWidth: 0
      }
    }
  }];
};
const genAffixWrapperStyles = token => {
  const {
    componentCls,
    inputPaddingHorizontal,
    inputAffixPadding,
    controlWidth,
    borderRadiusLG,
    borderRadiusSM
  } = token;
  return {
    [`${componentCls}-affix-wrapper`]: _extends(_extends(_extends({}, genBasicInputStyle(token)), genStatusStyle(token, `${componentCls}-affix-wrapper`)), {
      // or number handler will cover form status
      position: 'relative',
      display: 'inline-flex',
      width: controlWidth,
      padding: 0,
      paddingInlineStart: inputPaddingHorizontal,
      '&-lg': {
        borderRadius: borderRadiusLG
      },
      '&-sm': {
        borderRadius: borderRadiusSM
      },
      [`&:not(${componentCls}-affix-wrapper-disabled):hover`]: _extends(_extends({}, genHoverStyle(token)), {
        zIndex: 1
      }),
      '&-focused, &:focus': {
        zIndex: 1
      },
      '&-disabled': {
        [`${componentCls}[disabled]`]: {
          background: 'transparent'
        }
      },
      [`> div${componentCls}`]: {
        width: '100%',
        border: 'none',
        outline: 'none',
        [`&${componentCls}-focused`]: {
          boxShadow: 'none !important'
        }
      },
      [`input${componentCls}-input`]: {
        padding: 0
      },
      '&::before': {
        width: 0,
        visibility: 'hidden',
        content: '"\\a0"'
      },
      [`${componentCls}-handler-wrap`]: {
        zIndex: 2
      },
      [componentCls]: {
        '&-prefix, &-suffix': {
          display: 'flex',
          flex: 'none',
          alignItems: 'center',
          pointerEvents: 'none'
        },
        '&-prefix': {
          marginInlineEnd: inputAffixPadding
        },
        '&-suffix': {
          position: 'absolute',
          insetBlockStart: 0,
          insetInlineEnd: 0,
          zIndex: 1,
          height: '100%',
          marginInlineEnd: inputPaddingHorizontal,
          marginInlineStart: inputAffixPadding
        }
      }
    })
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('InputNumber', token => {
  const inputNumberToken = initInputToken(token);
  return [genInputNumberStyles(inputNumberToken), genAffixWrapperStyles(inputNumberToken),
  // =====================================================
  // ==             Space Compact                       ==
  // =====================================================
  genCompactItemStyle(inputNumberToken)];
}, token => ({
  controlWidth: 90,
  handleWidth: token.controlHeightSM - token.lineWidth * 2,
  handleFontSize: token.fontSize / 2,
  handleVisible: 'auto'
}));

var __rest$1 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const baseProps = inputNumberProps$1();
const inputNumberProps = () => _extends(_extends({}, baseProps), {
  size: stringType(),
  bordered: booleanType(true),
  placeholder: String,
  name: String,
  id: String,
  type: String,
  addonBefore: PropTypes.any,
  addonAfter: PropTypes.any,
  prefix: PropTypes.any,
  'onUpdate:value': baseProps.onChange,
  valueModifiers: Object,
  status: stringType()
});
const InputNumber = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'AInputNumber',
  inheritAttrs: false,
  props: inputNumberProps(),
  // emits: ['focus', 'blur', 'change', 'input', 'update:value'],
  slots: Object,
  setup(props, _ref) {
    let {
      emit,
      expose,
      attrs,
      slots
    } = _ref;
    var _a;
    const formItemContext = useInjectFormItemContext();
    const formItemInputContext = FormItemInputContext.useInject();
    const mergedStatus = computed(() => getMergedStatus(formItemInputContext.status, props.status));
    const {
      prefixCls,
      size,
      direction,
      disabled
    } = useConfigInject('input-number', props);
    const {
      compactSize,
      compactItemClassnames
    } = useCompactItemContext(prefixCls, direction);
    const disabledContext = useInjectDisabled();
    const mergedDisabled = computed(() => {
      var _a;
      return (_a = disabled.value) !== null && _a !== void 0 ? _a : disabledContext.value;
    });
    // Style
    const [wrapSSR, hashId] = useStyle(prefixCls);
    const mergedSize = computed(() => compactSize.value || size.value);
    const mergedValue = shallowRef((_a = props.value) !== null && _a !== void 0 ? _a : props.defaultValue);
    const focused = shallowRef(false);
    watch(() => props.value, () => {
      mergedValue.value = props.value;
    });
    const inputNumberRef = shallowRef(null);
    const focus = () => {
      var _a;
      (_a = inputNumberRef.value) === null || _a === void 0 ? void 0 : _a.focus();
    };
    const blur = () => {
      var _a;
      (_a = inputNumberRef.value) === null || _a === void 0 ? void 0 : _a.blur();
    };
    expose({
      focus,
      blur
    });
    const handleChange = val => {
      if (props.value === undefined) {
        mergedValue.value = val;
      }
      emit('update:value', val);
      emit('change', val);
      formItemContext.onFieldChange();
    };
    const handleBlur = e => {
      focused.value = false;
      emit('blur', e);
      formItemContext.onFieldBlur();
    };
    const handleFocus = e => {
      focused.value = true;
      emit('focus', e);
    };
    return () => {
      var _a, _b, _c, _d;
      const {
        hasFeedback,
        isFormItemInput,
        feedbackIcon
      } = formItemInputContext;
      const id = (_a = props.id) !== null && _a !== void 0 ? _a : formItemContext.id.value;
      const _e = _extends(_extends(_extends({}, attrs), props), {
          id,
          disabled: mergedDisabled.value
        }),
        {
          class: className,
          bordered,
          readonly,
          style,
          addonBefore = (_b = slots.addonBefore) === null || _b === void 0 ? void 0 : _b.call(slots),
          addonAfter = (_c = slots.addonAfter) === null || _c === void 0 ? void 0 : _c.call(slots),
          prefix = (_d = slots.prefix) === null || _d === void 0 ? void 0 : _d.call(slots),
          valueModifiers = {}
        } = _e,
        others = __rest$1(_e, ["class", "bordered", "readonly", "style", "addonBefore", "addonAfter", "prefix", "valueModifiers"]);
      const preCls = prefixCls.value;
      const inputNumberClass = classNames({
        [`${preCls}-lg`]: mergedSize.value === 'large',
        [`${preCls}-sm`]: mergedSize.value === 'small',
        [`${preCls}-rtl`]: direction.value === 'rtl',
        [`${preCls}-readonly`]: readonly,
        [`${preCls}-borderless`]: !bordered,
        [`${preCls}-in-form-item`]: isFormItemInput
      }, getStatusClassNames(preCls, mergedStatus.value), className, compactItemClassnames.value, hashId.value);
      let element = createVNode(VcInputNumber, _objectSpread$1(_objectSpread$1({}, omit(others, ['size', 'defaultValue'])), {}, {
        "ref": inputNumberRef,
        "lazy": !!valueModifiers.lazy,
        "value": mergedValue.value,
        "class": inputNumberClass,
        "prefixCls": preCls,
        "readonly": readonly,
        "onChange": handleChange,
        "onBlur": handleBlur,
        "onFocus": handleFocus
      }), {
        upHandler: slots.upIcon ? () => createVNode("span", {
          "class": `${preCls}-handler-up-inner`
        }, [slots.upIcon()]) : () => createVNode(UpOutlined, {
          "class": `${preCls}-handler-up-inner`
        }, null),
        downHandler: slots.downIcon ? () => createVNode("span", {
          "class": `${preCls}-handler-down-inner`
        }, [slots.downIcon()]) : () => createVNode(DownOutlined, {
          "class": `${preCls}-handler-down-inner`
        }, null)
      });
      const hasAddon = isValidValue(addonBefore) || isValidValue(addonAfter);
      const hasPrefix = isValidValue(prefix);
      if (hasPrefix || hasFeedback) {
        const affixWrapperCls = classNames(`${preCls}-affix-wrapper`, getStatusClassNames(`${preCls}-affix-wrapper`, mergedStatus.value, hasFeedback), {
          [`${preCls}-affix-wrapper-focused`]: focused.value,
          [`${preCls}-affix-wrapper-disabled`]: mergedDisabled.value,
          [`${preCls}-affix-wrapper-sm`]: mergedSize.value === 'small',
          [`${preCls}-affix-wrapper-lg`]: mergedSize.value === 'large',
          [`${preCls}-affix-wrapper-rtl`]: direction.value === 'rtl',
          [`${preCls}-affix-wrapper-readonly`]: readonly,
          [`${preCls}-affix-wrapper-borderless`]: !bordered,
          // className will go to addon wrapper
          [`${className}`]: !hasAddon && className
        }, hashId.value);
        element = createVNode("div", {
          "class": affixWrapperCls,
          "style": style,
          "onClick": focus
        }, [hasPrefix && createVNode("span", {
          "class": `${preCls}-prefix`
        }, [prefix]), element, hasFeedback && createVNode("span", {
          "class": `${preCls}-suffix`
        }, [feedbackIcon])]);
      }
      if (hasAddon) {
        const wrapperClassName = `${preCls}-group`;
        const addonClassName = `${wrapperClassName}-addon`;
        const addonBeforeNode = addonBefore ? createVNode("div", {
          "class": addonClassName
        }, [addonBefore]) : null;
        const addonAfterNode = addonAfter ? createVNode("div", {
          "class": addonClassName
        }, [addonAfter]) : null;
        const mergedWrapperClassName = classNames(`${preCls}-wrapper`, wrapperClassName, {
          [`${wrapperClassName}-rtl`]: direction.value === 'rtl'
        }, hashId.value);
        const mergedGroupClassName = classNames(`${preCls}-group-wrapper`, {
          [`${preCls}-group-wrapper-sm`]: mergedSize.value === 'small',
          [`${preCls}-group-wrapper-lg`]: mergedSize.value === 'large',
          [`${preCls}-group-wrapper-rtl`]: direction.value === 'rtl'
        }, getStatusClassNames(`${prefixCls}-group-wrapper`, mergedStatus.value, hasFeedback), className, hashId.value);
        element = createVNode("div", {
          "class": mergedGroupClassName,
          "style": style
        }, [createVNode("div", {
          "class": mergedWrapperClassName
        }, [addonBeforeNode && createVNode(NoCompactStyle, null, {
          default: () => [createVNode(NoFormStatus, null, {
            default: () => [addonBeforeNode]
          })]
        }), element, addonAfterNode && createVNode(NoCompactStyle, null, {
          default: () => [createVNode(NoFormStatus, null, {
            default: () => [addonAfterNode]
          })]
        })])]);
      }
      return wrapSSR(cloneElement(element, {
        style
      }));
    };
  }
});
const InputNumber$1 = _extends(InputNumber, {
  install: app => {
    app.component(InputNumber.name, InputNumber);
    return app;
  }
});

// =============================== Base ===============================
const genBaseStyle = token => {
  const {
    componentCls,
    iconCls,
    zIndexPopup,
    colorText,
    colorWarning,
    marginXS,
    fontSize,
    fontWeightStrong,
    lineHeight
  } = token;
  return {
    [componentCls]: {
      zIndex: zIndexPopup,
      [`${componentCls}-inner-content`]: {
        color: colorText
      },
      [`${componentCls}-message`]: {
        position: 'relative',
        marginBottom: marginXS,
        color: colorText,
        fontSize,
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'start',
        [`> ${componentCls}-message-icon ${iconCls}`]: {
          color: colorWarning,
          fontSize,
          flex: 'none',
          lineHeight: 1,
          paddingTop: (Math.round(fontSize * lineHeight) - fontSize) / 2
        },
        '&-title': {
          flex: 'auto',
          marginInlineStart: marginXS
        },
        '&-title-only': {
          fontWeight: fontWeightStrong
        }
      },
      [`${componentCls}-description`]: {
        position: 'relative',
        marginInlineStart: fontSize + marginXS,
        marginBottom: marginXS,
        color: colorText,
        fontSize
      },
      [`${componentCls}-buttons`]: {
        textAlign: 'end',
        button: {
          marginInlineStart: marginXS
        }
      }
    }
  };
};
// ============================== Export ==============================
const usePopconfirmStyle = genComponentStyleHook('Popconfirm', token => genBaseStyle(token), token => {
  const {
    zIndexPopupBase
  } = token;
  return {
    zIndexPopup: zIndexPopupBase + 60
  };
});

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const popconfirmProps = () => _extends(_extends({}, abstractTooltipProps()), {
  prefixCls: String,
  content: anyType(),
  title: anyType(),
  description: anyType(),
  okType: stringType('primary'),
  disabled: {
    type: Boolean,
    default: false
  },
  okText: anyType(),
  cancelText: anyType(),
  icon: anyType(),
  okButtonProps: objectType(),
  cancelButtonProps: objectType(),
  showCancel: {
    type: Boolean,
    default: true
  },
  onConfirm: Function,
  onCancel: Function
});
const Popconfirm = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'APopconfirm',
  inheritAttrs: false,
  props: initDefaultProps(popconfirmProps(), _extends(_extends({}, tooltipDefaultProps()), {
    trigger: 'click',
    placement: 'top',
    mouseEnterDelay: 0.1,
    mouseLeaveDelay: 0.1,
    arrowPointAtCenter: false,
    autoAdjustOverflow: true,
    okType: 'primary',
    disabled: false
  })),
  slots: Object,
  // emits: ['update:open', 'visibleChange'],
  setup(props, _ref) {
    let {
      slots,
      emit,
      expose,
      attrs
    } = _ref;
    const rootRef = ref();
    warning$1(props.visible === undefined);
    expose({
      getPopupDomNode: () => {
        var _a, _b;
        return (_b = (_a = rootRef.value) === null || _a === void 0 ? void 0 : _a.getPopupDomNode) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
    });
    const [open, setOpen] = useMergedState(false, {
      value: toRef(props, 'open')
    });
    const settingOpen = (value, e) => {
      if (props.open === undefined) {
        setOpen(value);
      }
      emit('update:open', value);
      emit('openChange', value, e);
    };
    const close = e => {
      settingOpen(false, e);
    };
    const onConfirm = e => {
      var _a;
      return (_a = props.onConfirm) === null || _a === void 0 ? void 0 : _a.call(props, e);
    };
    const onCancel = e => {
      var _a;
      settingOpen(false, e);
      (_a = props.onCancel) === null || _a === void 0 ? void 0 : _a.call(props, e);
    };
    const onKeyDown = e => {
      if (e.keyCode === KeyCode.ESC && open) {
        settingOpen(false, e);
      }
    };
    const onOpenChange = value => {
      const {
        disabled
      } = props;
      if (disabled) {
        return;
      }
      settingOpen(value);
    };
    const {
      prefixCls: prefixClsConfirm,
      getPrefixCls
    } = useConfigInject('popconfirm', props);
    const rootPrefixCls = computed(() => getPrefixCls());
    const btnPrefixCls = computed(() => getPrefixCls('btn'));
    const [wrapSSR] = usePopconfirmStyle(prefixClsConfirm);
    const [popconfirmLocale] = useLocaleReceiver('Popconfirm', localeValues.Popconfirm);
    const renderOverlay = () => {
      var _a, _b, _c, _d, _e;
      const {
        okButtonProps,
        cancelButtonProps,
        title = (_a = slots.title) === null || _a === void 0 ? void 0 : _a.call(slots),
        description = (_b = slots.description) === null || _b === void 0 ? void 0 : _b.call(slots),
        cancelText = (_c = slots.cancel) === null || _c === void 0 ? void 0 : _c.call(slots),
        okText = (_d = slots.okText) === null || _d === void 0 ? void 0 : _d.call(slots),
        okType,
        icon = ((_e = slots.icon) === null || _e === void 0 ? void 0 : _e.call(slots)) || createVNode(ExclamationCircleFilled, null, null),
        showCancel = true
      } = props;
      const {
        cancelButton,
        okButton
      } = slots;
      const cancelProps = _extends({
        onClick: onCancel,
        size: 'small'
      }, cancelButtonProps);
      const okProps = _extends(_extends(_extends({
        onClick: onConfirm
      }, convertLegacyProps(okType)), {
        size: 'small'
      }), okButtonProps);
      return createVNode("div", {
        "class": `${prefixClsConfirm.value}-inner-content`
      }, [createVNode("div", {
        "class": `${prefixClsConfirm.value}-message`
      }, [icon && createVNode("span", {
        "class": `${prefixClsConfirm.value}-message-icon`
      }, [icon]), createVNode("div", {
        "class": [`${prefixClsConfirm.value}-message-title`, {
          [`${prefixClsConfirm.value}-message-title-only`]: !!description
        }]
      }, [title])]), description && createVNode("div", {
        "class": `${prefixClsConfirm.value}-description`
      }, [description]), createVNode("div", {
        "class": `${prefixClsConfirm.value}-buttons`
      }, [showCancel ? cancelButton ? cancelButton(cancelProps) : createVNode(Button, cancelProps, {
        default: () => [cancelText || popconfirmLocale.value.cancelText]
      }) : null, okButton ? okButton(okProps) : createVNode(ActionButton, {
        "buttonProps": _extends(_extends({
          size: 'small'
        }, convertLegacyProps(okType)), okButtonProps),
        "actionFn": onConfirm,
        "close": close,
        "prefixCls": btnPrefixCls.value,
        "quitOnNullishReturnValue": true,
        "emitEvent": true
      }, {
        default: () => [okText || popconfirmLocale.value.okText]
      })])]);
    };
    return () => {
      var _a;
      const {
          placement,
          overlayClassName,
          trigger = 'click'
        } = props,
        restProps = __rest(props, ["placement", "overlayClassName", "trigger"]);
      const otherProps = omit(restProps, ['title', 'content', 'cancelText', 'okText', 'onUpdate:open', 'onConfirm', 'onCancel', 'prefixCls']);
      const overlayClassNames = classNames(prefixClsConfirm.value, overlayClassName);
      return wrapSSR(createVNode(Popover, _objectSpread$1(_objectSpread$1(_objectSpread$1({}, otherProps), attrs), {}, {
        "trigger": trigger,
        "placement": placement,
        "onOpenChange": onOpenChange,
        "open": open.value,
        "overlayClassName": overlayClassNames,
        "transitionName": getTransitionName(rootPrefixCls.value, 'zoom-big', props.transitionName),
        "ref": rootRef,
        "data-popover-inject": true
      }), {
        default: () => [cloneVNodes(((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)) || [], {
          onKeydown: e => {
            onKeyDown(e);
          }
        }, false)],
        content: renderOverlay
      }));
    };
  }
});
const Popconfirm$1 = withInstall(Popconfirm);

export { InputNumber$1 as I, Popconfirm$1 as P };
//# sourceMappingURL=index10.mjs.map
