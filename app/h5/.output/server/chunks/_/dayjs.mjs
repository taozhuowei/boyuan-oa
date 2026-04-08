import _extends from '@babel/runtime/helpers/esm/extends';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { $ as noteOnce, c as classNames, A as wrapperRaf, a0 as isVisible, b as cloneElement, a1 as Trigger, a2 as warningOnce, a3 as useState, g as genComponentStyleHook, m as merge, F as genCompactItemStyle, r as resetComponent, Z as textEllipsis, a4 as roundedArrow, B as Button, I as Icon, j as functionType, D as stringType, f as booleanType, x as objectType, s as someType, y as arrayType, u as useConfigInject, H as useCompactItemContext, M as useLocaleReceiver, a5 as locale, C as CloseCircleFilled, o as omit } from './collapseMotion.mjs';
import _objectSpread$3 from '@babel/runtime/helpers/esm/objectSpread2';
import { useAttrs, provide, inject, createVNode, createTextVNode, defineComponent, shallowRef, ref, watch, onBeforeUnmount, nextTick, computed, onBeforeUpdate, watchEffect, toRef, onMounted, getCurrentScope, onScopeDispose, unref, getCurrentInstance, Fragment } from 'vue';
import { T as Tag } from './index9.mjs';
import { K as KeyCode, s as shallowequal, a as slideUpOut, b as slideDownOut, c as slideUpIn, d as slideDownIn, i as initSlideMotion } from './index4.mjs';
import { u as useMergedState } from './index.mjs';
import { u as useMemo } from './index3.mjs';
import { i as initInputToken, g as genBasicInputStyle, f as genActiveStyle, h as genHoverStyle, u as useInjectFormItemContext, F as FormItemInputContext, k as getStatusClassNames, j as getMergedStatus } from './index5.mjs';
import { TinyColor } from '@ctrl/tinycolor';
import { i as initMoveMotion } from './index6.mjs';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(quarterOfYear);
dayjs.extend((_o, c) => {
  // todo support Wo (ISO week)
  const proto = c.prototype;
  const oldFormat = proto.format;
  proto.format = function f(formatStr) {
    const str = (formatStr || '').replace('Wo', 'wo');
    return oldFormat.bind(this)(str);
  };
});
const localeMap = {
  // ar_EG:
  // az_AZ:
  // bg_BG:
  bn_BD: 'bn-bd',
  by_BY: 'be',
  // ca_ES:
  // cs_CZ:
  // da_DK:
  // de_DE:
  // el_GR:
  en_GB: 'en-gb',
  en_US: 'en',
  // es_ES:
  // et_EE:
  // fa_IR:
  // fi_FI:
  fr_BE: 'fr',
  fr_CA: 'fr-ca',
  // fr_FR:
  // ga_IE:
  // gl_ES:
  // he_IL:
  // hi_IN:
  // hr_HR:
  // hu_HU:
  hy_AM: 'hy-am',
  // id_ID:
  // is_IS:
  // it_IT:
  // ja_JP:
  // ka_GE:
  // kk_KZ:
  // km_KH:
  kmr_IQ: 'ku',
  // kn_IN:
  // ko_KR:
  // ku_IQ: // previous ku in antd
  // lt_LT:
  // lv_LV:
  // mk_MK:
  // ml_IN:
  // mn_MN:
  // ms_MY:
  // nb_NO:
  // ne_NP:
  nl_BE: 'nl-be',
  // nl_NL:
  // pl_PL:
  pt_BR: 'pt-br',
  // pt_PT:
  // ro_RO:
  // ru_RU:
  // sk_SK:
  // sl_SI:
  // sr_RS:
  // sv_SE:
  // ta_IN:
  // th_TH:
  // tr_TR:
  // uk_UA:
  // ur_PK:
  // vi_VN:
  zh_CN: 'zh-cn',
  zh_HK: 'zh-hk',
  zh_TW: 'zh-tw'
};
const parseLocale = locale => {
  const mapLocale = localeMap[locale];
  return mapLocale || locale.split('_')[0];
};
const parseNoMatchNotice = () => {
  /* istanbul ignore next */
  noteOnce(false, 'Not match any format. Please help to fire a issue about this.');
};
const advancedFormatRegex = /\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|k{1,2}|S/g;
function findTargetStr(val, index, segmentation) {
  const items = [...new Set(val.split(segmentation))];
  let idx = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    idx += item.length;
    if (idx > index) {
      return item;
    }
    idx += segmentation.length;
  }
}
const toDateWithValueFormat = (val, valueFormat) => {
  if (!val) return null;
  if (dayjs.isDayjs(val)) {
    return val;
  }
  const matchs = valueFormat.matchAll(advancedFormatRegex);
  let baseDate = dayjs(val, valueFormat);
  if (matchs === null) {
    return baseDate;
  }
  for (const match of matchs) {
    const origin = match[0];
    const index = match['index'];
    if (origin === 'Q') {
      const segmentation = val.slice(index - 1, index);
      const quarterStr = findTargetStr(val, index, segmentation).match(/\d+/)[0];
      baseDate = baseDate.quarter(parseInt(quarterStr));
    }
    if (origin.toLowerCase() === 'wo') {
      const segmentation = val.slice(index - 1, index);
      const weekStr = findTargetStr(val, index, segmentation).match(/\d+/)[0];
      baseDate = baseDate.week(parseInt(weekStr));
    }
    if (origin.toLowerCase() === 'ww') {
      baseDate = baseDate.week(parseInt(val.slice(index, index + origin.length)));
    }
    if (origin.toLowerCase() === 'w') {
      baseDate = baseDate.week(parseInt(val.slice(index, index + origin.length + 1)));
    }
  }
  return baseDate;
};
const generateConfig = {
  // get
  getNow: () => dayjs(),
  getFixedDate: string => dayjs(string, ['YYYY-M-DD', 'YYYY-MM-DD']),
  getEndDate: date => date.endOf('month'),
  getWeekDay: date => {
    const clone = date.locale('en');
    return clone.weekday() + clone.localeData().firstDayOfWeek();
  },
  getYear: date => date.year(),
  getMonth: date => date.month(),
  getDate: date => date.date(),
  getHour: date => date.hour(),
  getMinute: date => date.minute(),
  getSecond: date => date.second(),
  // set
  addYear: (date, diff) => date.add(diff, 'year'),
  addMonth: (date, diff) => date.add(diff, 'month'),
  addDate: (date, diff) => date.add(diff, 'day'),
  setYear: (date, year) => date.year(year),
  setMonth: (date, month) => date.month(month),
  setDate: (date, num) => date.date(num),
  setHour: (date, hour) => date.hour(hour),
  setMinute: (date, minute) => date.minute(minute),
  setSecond: (date, second) => date.second(second),
  // Compare
  isAfter: (date1, date2) => date1.isAfter(date2),
  isValidate: date => date.isValid(),
  locale: {
    getWeekFirstDay: locale => dayjs().locale(parseLocale(locale)).localeData().firstDayOfWeek(),
    getWeekFirstDate: (locale, date) => date.locale(parseLocale(locale)).weekday(0),
    getWeek: (locale, date) => date.locale(parseLocale(locale)).week(),
    getShortWeekDays: locale => dayjs().locale(parseLocale(locale)).localeData().weekdaysMin(),
    getShortMonths: locale => dayjs().locale(parseLocale(locale)).localeData().monthsShort(),
    format: (locale, date, format) => date.locale(parseLocale(locale)).format(format),
    parse: (locale, text, formats) => {
      const localeStr = parseLocale(locale);
      for (let i = 0; i < formats.length; i += 1) {
        const format = formats[i];
        const formatText = text;
        if (format.includes('wo') || format.includes('Wo')) {
          // parse Wo
          const year = formatText.split('-')[0];
          const weekStr = formatText.split('-')[1];
          const firstWeek = dayjs(year, 'YYYY').startOf('year').locale(localeStr);
          for (let j = 0; j <= 52; j += 1) {
            const nextWeek = firstWeek.add(j, 'week');
            if (nextWeek.format('Wo') === weekStr) {
              return nextWeek;
            }
          }
          parseNoMatchNotice();
          return null;
        }
        const date = dayjs(formatText, format, true).locale(localeStr);
        if (date.isValid()) {
          return date;
        }
      }
      if (!text) {
        parseNoMatchNotice();
      }
      return null;
    }
  },
  toDate: (value, valueFormat) => {
    if (Array.isArray(value)) {
      return value.map(val => toDateWithValueFormat(val, valueFormat));
    } else {
      return toDateWithValueFormat(value, valueFormat);
    }
  },
  toString: (value, valueFormat) => {
    if (Array.isArray(value)) {
      return value.map(val => dayjs.isDayjs(val) ? val.format(valueFormat) : val);
    } else {
      return dayjs.isDayjs(value) ? value.format(valueFormat) : value;
    }
  }
};

// 仅用在函数式组件中，不用考虑响应式问题
function useMergeProps(props) {
  const attrs = useAttrs();
  return _extends(_extends({}, props), attrs);
}

const PanelContextKey = Symbol('PanelContextProps');
const useProvidePanel = props => {
  provide(PanelContextKey, props);
};
const useInjectPanel = () => {
  return inject(PanelContextKey, {});
};

const HIDDEN_STYLE = {
  visibility: 'hidden'
};
function Header(_props, _ref) {
  let {
    slots
  } = _ref;
  var _a;
  const props = useMergeProps(_props);
  const {
    prefixCls,
    prevIcon = '\u2039',
    nextIcon = '\u203A',
    superPrevIcon = '\u00AB',
    superNextIcon = '\u00BB',
    onSuperPrev,
    onSuperNext,
    onPrev,
    onNext
  } = props;
  const {
    hideNextBtn,
    hidePrevBtn
  } = useInjectPanel();
  return createVNode("div", {
    "class": prefixCls
  }, [onSuperPrev && createVNode("button", {
    "type": "button",
    "onClick": onSuperPrev,
    "tabindex": -1,
    "class": `${prefixCls}-super-prev-btn`,
    "style": hidePrevBtn.value ? HIDDEN_STYLE : {}
  }, [superPrevIcon]), onPrev && createVNode("button", {
    "type": "button",
    "onClick": onPrev,
    "tabindex": -1,
    "class": `${prefixCls}-prev-btn`,
    "style": hidePrevBtn.value ? HIDDEN_STYLE : {}
  }, [prevIcon]), createVNode("div", {
    "class": `${prefixCls}-view`
  }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]), onNext && createVNode("button", {
    "type": "button",
    "onClick": onNext,
    "tabindex": -1,
    "class": `${prefixCls}-next-btn`,
    "style": hideNextBtn.value ? HIDDEN_STYLE : {}
  }, [nextIcon]), onSuperNext && createVNode("button", {
    "type": "button",
    "onClick": onSuperNext,
    "tabindex": -1,
    "class": `${prefixCls}-super-next-btn`,
    "style": hideNextBtn.value ? HIDDEN_STYLE : {}
  }, [superNextIcon])]);
}
Header.displayName = 'Header';
Header.inheritAttrs = false;

function DecadeHeader(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    viewDate,
    onPrevDecades,
    onNextDecades
  } = props;
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader) {
    return null;
  }
  const headerPrefixCls = `${prefixCls}-header`;
  const yearNumber = generateConfig.getYear(viewDate);
  const startYear = Math.floor(yearNumber / DECADE_DISTANCE_COUNT) * DECADE_DISTANCE_COUNT;
  const endYear = startYear + DECADE_DISTANCE_COUNT - 1;
  return createVNode(Header, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": headerPrefixCls,
    "onSuperPrev": onPrevDecades,
    "onSuperNext": onNextDecades
  }), {
    default: () => [startYear, createTextVNode("-"), endYear]
  });
}
DecadeHeader.displayName = 'DecadeHeader';
DecadeHeader.inheritAttrs = false;

function setTime(generateConfig, date, hour, minute, second) {
  let nextTime = generateConfig.setHour(date, hour);
  nextTime = generateConfig.setMinute(nextTime, minute);
  nextTime = generateConfig.setSecond(nextTime, second);
  return nextTime;
}
function setDateTime(generateConfig, date, defaultDate) {
  if (!defaultDate) {
    return date;
  }
  let newDate = date;
  newDate = generateConfig.setHour(newDate, generateConfig.getHour(defaultDate));
  newDate = generateConfig.setMinute(newDate, generateConfig.getMinute(defaultDate));
  newDate = generateConfig.setSecond(newDate, generateConfig.getSecond(defaultDate));
  return newDate;
}
function getLowerBoundTime(hour, minute, second, hourStep, minuteStep, secondStep) {
  const lowerBoundHour = Math.floor(hour / hourStep) * hourStep;
  if (lowerBoundHour < hour) {
    return [lowerBoundHour, 60 - minuteStep, 60 - secondStep];
  }
  const lowerBoundMinute = Math.floor(minute / minuteStep) * minuteStep;
  if (lowerBoundMinute < minute) {
    return [lowerBoundHour, lowerBoundMinute, 60 - secondStep];
  }
  const lowerBoundSecond = Math.floor(second / secondStep) * secondStep;
  return [lowerBoundHour, lowerBoundMinute, lowerBoundSecond];
}
function getLastDay(generateConfig, date) {
  const year = generateConfig.getYear(date);
  const month = generateConfig.getMonth(date) + 1;
  const endDate = generateConfig.getEndDate(generateConfig.getFixedDate(`${year}-${month}-01`));
  const lastDay = generateConfig.getDate(endDate);
  const monthShow = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${monthShow}-${lastDay}`;
}

function PanelBody(_props) {
  const {
    prefixCls,
    disabledDate,
    onSelect,
    picker,
    rowNum,
    colNum,
    prefixColumn,
    rowClassName,
    baseDate,
    getCellClassName,
    getCellText,
    getCellNode,
    getCellDate,
    generateConfig,
    titleCell,
    headerCells
  } = useMergeProps(_props);
  const {
    onDateMouseenter,
    onDateMouseleave,
    mode
  } = useInjectPanel();
  const cellPrefixCls = `${prefixCls}-cell`;
  // =============================== Body ===============================
  const rows = [];
  for (let i = 0; i < rowNum; i += 1) {
    const row = [];
    let rowStartDate;
    for (let j = 0; j < colNum; j += 1) {
      const offset = i * colNum + j;
      const currentDate = getCellDate(baseDate, offset);
      const disabled = getCellDateDisabled({
        cellDate: currentDate,
        mode: mode.value,
        disabledDate,
        generateConfig
      });
      if (j === 0) {
        rowStartDate = currentDate;
        if (prefixColumn) {
          row.push(prefixColumn(rowStartDate));
        }
      }
      const title = titleCell && titleCell(currentDate);
      row.push(createVNode("td", {
        "key": j,
        "title": title,
        "class": classNames(cellPrefixCls, _extends({
          [`${cellPrefixCls}-disabled`]: disabled,
          [`${cellPrefixCls}-start`]: getCellText(currentDate) === 1 || picker === 'year' && Number(title) % 10 === 0,
          [`${cellPrefixCls}-end`]: title === getLastDay(generateConfig, currentDate) || picker === 'year' && Number(title) % 10 === 9
        }, getCellClassName(currentDate))),
        "onClick": e => {
          e.stopPropagation();
          if (!disabled) {
            onSelect(currentDate);
          }
        },
        "onMouseenter": () => {
          if (!disabled && onDateMouseenter) {
            onDateMouseenter(currentDate);
          }
        },
        "onMouseleave": () => {
          if (!disabled && onDateMouseleave) {
            onDateMouseleave(currentDate);
          }
        }
      }, [getCellNode ? getCellNode(currentDate) : createVNode("div", {
        "class": `${cellPrefixCls}-inner`
      }, [getCellText(currentDate)])]));
    }
    rows.push(createVNode("tr", {
      "key": i,
      "class": rowClassName && rowClassName(rowStartDate)
    }, [row]));
  }
  return createVNode("div", {
    "class": `${prefixCls}-body`
  }, [createVNode("table", {
    "class": `${prefixCls}-content`
  }, [headerCells && createVNode("thead", null, [createVNode("tr", null, [headerCells])]), createVNode("tbody", null, [rows])])]);
}
PanelBody.displayName = 'PanelBody';
PanelBody.inheritAttrs = false;

const DECADE_COL_COUNT = 3;
const DECADE_ROW_COUNT = 4;
function DecadeBody(_props) {
  const props = useMergeProps(_props);
  const DECADE_UNIT_DIFF_DES = DECADE_UNIT_DIFF - 1;
  const {
    prefixCls,
    viewDate,
    generateConfig
  } = props;
  const cellPrefixCls = `${prefixCls}-cell`;
  const yearNumber = generateConfig.getYear(viewDate);
  const decadeYearNumber = Math.floor(yearNumber / DECADE_UNIT_DIFF) * DECADE_UNIT_DIFF;
  const startDecadeYear = Math.floor(yearNumber / DECADE_DISTANCE_COUNT) * DECADE_DISTANCE_COUNT;
  const endDecadeYear = startDecadeYear + DECADE_DISTANCE_COUNT - 1;
  const baseDecadeYear = generateConfig.setYear(viewDate, startDecadeYear - Math.ceil((DECADE_COL_COUNT * DECADE_ROW_COUNT * DECADE_UNIT_DIFF - DECADE_DISTANCE_COUNT) / 2));
  const getCellClassName = date => {
    const startDecadeNumber = generateConfig.getYear(date);
    const endDecadeNumber = startDecadeNumber + DECADE_UNIT_DIFF_DES;
    return {
      [`${cellPrefixCls}-in-view`]: startDecadeYear <= startDecadeNumber && endDecadeNumber <= endDecadeYear,
      [`${cellPrefixCls}-selected`]: startDecadeNumber === decadeYearNumber
    };
  };
  return createVNode(PanelBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "rowNum": DECADE_ROW_COUNT,
    "colNum": DECADE_COL_COUNT,
    "baseDate": baseDecadeYear,
    "getCellText": date => {
      const startDecadeNumber = generateConfig.getYear(date);
      return `${startDecadeNumber}-${startDecadeNumber + DECADE_UNIT_DIFF_DES}`;
    },
    "getCellClassName": getCellClassName,
    "getCellDate": (date, offset) => generateConfig.addYear(date, offset * DECADE_UNIT_DIFF)
  }), null);
}
DecadeBody.displayName = 'DecadeBody';
DecadeBody.inheritAttrs = false;

const scrollIds = new Map();
/** Trigger when element is visible in view */
function waitElementReady(element, callback) {
  let id;
  function tryOrNextFrame() {
    if (isVisible(element)) {
      callback();
    } else {
      id = wrapperRaf(() => {
        tryOrNextFrame();
      });
    }
  }
  tryOrNextFrame();
  return () => {
    wrapperRaf.cancel(id);
  };
}
/* eslint-disable no-param-reassign */
function scrollTo(element, to, duration) {
  if (scrollIds.get(element)) {
    wrapperRaf.cancel(scrollIds.get(element));
  }
  // jump to target if duration zero
  if (duration <= 0) {
    scrollIds.set(element, wrapperRaf(() => {
      element.scrollTop = to;
    }));
    return;
  }
  const difference = to - element.scrollTop;
  const perTick = difference / duration * 10;
  scrollIds.set(element, wrapperRaf(() => {
    element.scrollTop += perTick;
    if (element.scrollTop !== to) {
      scrollTo(element, to, duration - 10);
    }
  }));
}
function createKeydownHandler(event, _ref) {
  let {
    onLeftRight,
    onCtrlLeftRight,
    onUpDown,
    onPageUpDown,
    onEnter
  } = _ref;
  const {
    which,
    ctrlKey,
    metaKey
  } = event;
  switch (which) {
    case KeyCode.LEFT:
      if (ctrlKey || metaKey) {
        if (onCtrlLeftRight) {
          onCtrlLeftRight(-1);
          return true;
        }
      } else if (onLeftRight) {
        onLeftRight(-1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.RIGHT:
      if (ctrlKey || metaKey) {
        if (onCtrlLeftRight) {
          onCtrlLeftRight(1);
          return true;
        }
      } else if (onLeftRight) {
        onLeftRight(1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.UP:
      if (onUpDown) {
        onUpDown(-1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.DOWN:
      if (onUpDown) {
        onUpDown(1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.PAGE_UP:
      if (onPageUpDown) {
        onPageUpDown(-1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.PAGE_DOWN:
      if (onPageUpDown) {
        onPageUpDown(1);
        return true;
      }
      /* istanbul ignore next */
      break;
    case KeyCode.ENTER:
      if (onEnter) {
        onEnter();
        return true;
      }
      /* istanbul ignore next */
      break;
  }
  return false;
}
// ===================== Format =====================
function getDefaultFormat(format, picker, showTime, use12Hours) {
  let mergedFormat = format;
  if (!mergedFormat) {
    switch (picker) {
      case 'time':
        mergedFormat = use12Hours ? 'hh:mm:ss a' : 'HH:mm:ss';
        break;
      case 'week':
        mergedFormat = 'gggg-wo';
        break;
      case 'month':
        mergedFormat = 'YYYY-MM';
        break;
      case 'quarter':
        mergedFormat = 'YYYY-[Q]Q';
        break;
      case 'year':
        mergedFormat = 'YYYY';
        break;
      default:
        mergedFormat = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    }
  }
  return mergedFormat;
}
function getInputSize(picker, format, generateConfig) {
  const defaultSize = picker === 'time' ? 8 : 10;
  const length = typeof format === 'function' ? format(generateConfig.getNow()).length : format.length;
  return Math.max(defaultSize, length) + 2;
}
let globalClickFunc = null;
const clickCallbacks = new Set();
function addGlobalMousedownEvent(callback) {
  if (!globalClickFunc && "undefined" !== 'undefined' && window.addEventListener) {
    globalClickFunc = e => {
      // Clone a new list to avoid repeat trigger events
      [...clickCallbacks].forEach(queueFunc => {
        queueFunc(e);
      });
    };
    window.addEventListener('mousedown', globalClickFunc);
  }
  clickCallbacks.add(callback);
  return () => {
    clickCallbacks.delete(callback);
    if (clickCallbacks.size === 0) {
      window.removeEventListener('mousedown', globalClickFunc);
      globalClickFunc = null;
    }
  };
}
function getTargetFromEvent(e) {
  var _a;
  const target = e.target;
  // get target if in shadow dom
  if (e.composed && target.shadowRoot) {
    return ((_a = e.composedPath) === null || _a === void 0 ? void 0 : _a.call(e)[0]) || target;
  }
  return target;
}
// ====================== Mode ======================
const getYearNextMode = next => {
  if (next === 'month' || next === 'date') {
    return 'year';
  }
  return next;
};
const getMonthNextMode = next => {
  if (next === 'date') {
    return 'month';
  }
  return next;
};
const getQuarterNextMode = next => {
  if (next === 'month' || next === 'date') {
    return 'quarter';
  }
  return next;
};
const getWeekNextMode = next => {
  if (next === 'date') {
    return 'week';
  }
  return next;
};
const PickerModeMap = {
  year: getYearNextMode,
  month: getMonthNextMode,
  quarter: getQuarterNextMode,
  week: getWeekNextMode,
  time: null,
  date: null
};
function elementsContains(elements, target) {
  return elements.some(ele => ele && ele.contains(target));
}

const DECADE_UNIT_DIFF = 10;
const DECADE_DISTANCE_COUNT = DECADE_UNIT_DIFF * 10;
function DecadePanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    onViewDateChange,
    generateConfig,
    viewDate,
    operationRef,
    onSelect,
    onPanelChange
  } = props;
  const panelPrefixCls = `${prefixCls}-decade-panel`;
  // ======================= Keyboard =======================
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addYear(viewDate, diff * DECADE_UNIT_DIFF), 'key');
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(viewDate, diff * DECADE_DISTANCE_COUNT), 'key');
      },
      onUpDown: diff => {
        onSelect(generateConfig.addYear(viewDate, diff * DECADE_UNIT_DIFF * DECADE_COL_COUNT), 'key');
      },
      onEnter: () => {
        onPanelChange('year', viewDate);
      }
    })
  };
  // ==================== View Operation ====================
  const onDecadesChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff * DECADE_DISTANCE_COUNT);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  const onInternalSelect = date => {
    onSelect(date, 'mouse');
    onPanelChange('year', date);
  };
  return createVNode("div", {
    "class": panelPrefixCls
  }, [createVNode(DecadeHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onPrevDecades": () => {
      onDecadesChange(-1);
    },
    "onNextDecades": () => {
      onDecadesChange(1);
    }
  }), null), createVNode(DecadeBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onSelect": onInternalSelect
  }), null)]);
}
DecadePanel.displayName = 'DecadePanel';
DecadePanel.inheritAttrs = false;

const WEEK_DAY_COUNT = 7;
function isNullEqual(value1, value2) {
  if (!value1 && !value2) {
    return true;
  }
  if (!value1 || !value2) {
    return false;
  }
  return undefined;
}
function isSameDecade(generateConfig, decade1, decade2) {
  const equal = isNullEqual(decade1, decade2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  const num1 = Math.floor(generateConfig.getYear(decade1) / 10);
  const num2 = Math.floor(generateConfig.getYear(decade2) / 10);
  return num1 === num2;
}
function isSameYear(generateConfig, year1, year2) {
  const equal = isNullEqual(year1, year2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return generateConfig.getYear(year1) === generateConfig.getYear(year2);
}
function getQuarter(generateConfig, date) {
  const quota = Math.floor(generateConfig.getMonth(date) / 3);
  return quota + 1;
}
function isSameQuarter(generateConfig, quarter1, quarter2) {
  const equal = isNullEqual(quarter1, quarter2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return isSameYear(generateConfig, quarter1, quarter2) && getQuarter(generateConfig, quarter1) === getQuarter(generateConfig, quarter2);
}
function isSameMonth(generateConfig, month1, month2) {
  const equal = isNullEqual(month1, month2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return isSameYear(generateConfig, month1, month2) && generateConfig.getMonth(month1) === generateConfig.getMonth(month2);
}
function isSameDate(generateConfig, date1, date2) {
  const equal = isNullEqual(date1, date2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return generateConfig.getYear(date1) === generateConfig.getYear(date2) && generateConfig.getMonth(date1) === generateConfig.getMonth(date2) && generateConfig.getDate(date1) === generateConfig.getDate(date2);
}
function isSameTime(generateConfig, time1, time2) {
  const equal = isNullEqual(time1, time2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return generateConfig.getHour(time1) === generateConfig.getHour(time2) && generateConfig.getMinute(time1) === generateConfig.getMinute(time2) && generateConfig.getSecond(time1) === generateConfig.getSecond(time2);
}
function isSameWeek(generateConfig, locale, date1, date2) {
  const equal = isNullEqual(date1, date2);
  if (typeof equal === 'boolean') {
    return equal;
  }
  return generateConfig.locale.getWeek(locale, date1) === generateConfig.locale.getWeek(locale, date2);
}
function isEqual(generateConfig, value1, value2) {
  return isSameDate(generateConfig, value1, value2) && isSameTime(generateConfig, value1, value2);
}
/** Between in date but not equal of date */
function isInRange(generateConfig, startDate, endDate, current) {
  if (!startDate || !endDate || !current) {
    return false;
  }
  return !isSameDate(generateConfig, startDate, current) && !isSameDate(generateConfig, endDate, current) && generateConfig.isAfter(current, startDate) && generateConfig.isAfter(endDate, current);
}
function getWeekStartDate(locale, generateConfig, value) {
  const weekFirstDay = generateConfig.locale.getWeekFirstDay(locale);
  const monthStartDate = generateConfig.setDate(value, 1);
  const startDateWeekDay = generateConfig.getWeekDay(monthStartDate);
  let alignStartDate = generateConfig.addDate(monthStartDate, weekFirstDay - startDateWeekDay);
  if (generateConfig.getMonth(alignStartDate) === generateConfig.getMonth(value) && generateConfig.getDate(alignStartDate) > 1) {
    alignStartDate = generateConfig.addDate(alignStartDate, -7);
  }
  return alignStartDate;
}
function getClosingViewDate(viewDate, picker, generateConfig) {
  let offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  switch (picker) {
    case 'year':
      return generateConfig.addYear(viewDate, offset * 10);
    case 'quarter':
    case 'month':
      return generateConfig.addYear(viewDate, offset);
    default:
      return generateConfig.addMonth(viewDate, offset);
  }
}
function formatValue(value, _ref) {
  let {
    generateConfig,
    locale,
    format
  } = _ref;
  return typeof format === 'function' ? format(value) : generateConfig.locale.format(locale.locale, value, format);
}
function parseValue(value, _ref2) {
  let {
    generateConfig,
    locale,
    formatList
  } = _ref2;
  if (!value || typeof formatList[0] === 'function') {
    return null;
  }
  return generateConfig.locale.parse(locale.locale, value, formatList);
}
// eslint-disable-next-line consistent-return
function getCellDateDisabled(_ref3) {
  let {
    cellDate,
    mode,
    disabledDate,
    generateConfig
  } = _ref3;
  if (!disabledDate) return false;
  // Whether cellDate is disabled in range
  const getDisabledFromRange = (currentMode, start, end) => {
    let current = start;
    while (current <= end) {
      let date;
      switch (currentMode) {
        case 'date':
          {
            date = generateConfig.setDate(cellDate, current);
            if (!disabledDate(date)) {
              return false;
            }
            break;
          }
        case 'month':
          {
            date = generateConfig.setMonth(cellDate, current);
            if (!getCellDateDisabled({
              cellDate: date,
              mode: 'month',
              generateConfig,
              disabledDate
            })) {
              return false;
            }
            break;
          }
        case 'year':
          {
            date = generateConfig.setYear(cellDate, current);
            if (!getCellDateDisabled({
              cellDate: date,
              mode: 'year',
              generateConfig,
              disabledDate
            })) {
              return false;
            }
            break;
          }
      }
      current += 1;
    }
    return true;
  };
  switch (mode) {
    case 'date':
    case 'week':
      {
        return disabledDate(cellDate);
      }
    case 'month':
      {
        const startDate = 1;
        const endDate = generateConfig.getDate(generateConfig.getEndDate(cellDate));
        return getDisabledFromRange('date', startDate, endDate);
      }
    case 'quarter':
      {
        const startMonth = Math.floor(generateConfig.getMonth(cellDate) / 3) * 3;
        const endMonth = startMonth + 2;
        return getDisabledFromRange('month', startMonth, endMonth);
      }
    case 'year':
      {
        return getDisabledFromRange('month', 0, 11);
      }
    case 'decade':
      {
        const year = generateConfig.getYear(cellDate);
        const startYear = Math.floor(year / DECADE_UNIT_DIFF) * DECADE_UNIT_DIFF;
        const endYear = startYear + DECADE_UNIT_DIFF - 1;
        return getDisabledFromRange('year', startYear, endYear);
      }
  }
}

function TimeHeader(_props) {
  const props = useMergeProps(_props);
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader.value) {
    return null;
  }
  const {
    prefixCls,
    generateConfig,
    locale,
    value,
    format
  } = props;
  const headerPrefixCls = `${prefixCls}-header`;
  return createVNode(Header, {
    "prefixCls": headerPrefixCls
  }, {
    default: () => [value ? formatValue(value, {
      locale,
      format,
      generateConfig
    }) : '\u00A0']
  });
}
TimeHeader.displayName = 'TimeHeader';
TimeHeader.inheritAttrs = false;

const TimeUnitColumn = defineComponent({
  name: 'TimeUnitColumn',
  props: ['prefixCls', 'units', 'onSelect', 'value', 'active', 'hideDisabledOptions'],
  setup(props) {
    const {
      open
    } = useInjectPanel();
    const ulRef = shallowRef(null);
    const liRefs = ref(new Map());
    const scrollRef = ref();
    watch(() => props.value, () => {
      const li = liRefs.value.get(props.value);
      if (li && open.value !== false) {
        scrollTo(ulRef.value, li.offsetTop, 120);
      }
    });
    onBeforeUnmount(() => {
      var _a;
      (_a = scrollRef.value) === null || _a === void 0 ? void 0 : _a.call(scrollRef);
    });
    watch(open, () => {
      var _a;
      (_a = scrollRef.value) === null || _a === void 0 ? void 0 : _a.call(scrollRef);
      nextTick(() => {
        if (open.value) {
          const li = liRefs.value.get(props.value);
          if (li) {
            scrollRef.value = waitElementReady(li, () => {
              scrollTo(ulRef.value, li.offsetTop, 0);
            });
          }
        }
      });
    }, {
      immediate: true,
      flush: 'post'
    });
    return () => {
      const {
        prefixCls,
        units,
        onSelect,
        value,
        active,
        hideDisabledOptions
      } = props;
      const cellPrefixCls = `${prefixCls}-cell`;
      return createVNode("ul", {
        "class": classNames(`${prefixCls}-column`, {
          [`${prefixCls}-column-active`]: active
        }),
        "ref": ulRef,
        "style": {
          position: 'relative'
        }
      }, [units.map(unit => {
        if (hideDisabledOptions && unit.disabled) {
          return null;
        }
        return createVNode("li", {
          "key": unit.value,
          "ref": element => {
            liRefs.value.set(unit.value, element);
          },
          "class": classNames(cellPrefixCls, {
            [`${cellPrefixCls}-disabled`]: unit.disabled,
            [`${cellPrefixCls}-selected`]: value === unit.value
          }),
          "onClick": () => {
            if (unit.disabled) {
              return;
            }
            onSelect(unit.value);
          }
        }, [createVNode("div", {
          "class": `${cellPrefixCls}-inner`
        }, [unit.label])]);
      })]);
    };
  }
});

function leftPad(str, length) {
  let fill = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '0';
  let current = String(str);
  while (current.length < length) {
    current = `${fill}${str}`;
  }
  return current;
}
const tuple = function () {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return args;
};
function toArray$1(val) {
  if (val === null || val === undefined) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}
function getDataOrAriaProps(props) {
  const retProps = {};
  Object.keys(props).forEach(key => {
    if ((key.startsWith('data-') || key.startsWith('aria-') || key === 'role' || key === 'name') && !key.startsWith('data-__')) {
      retProps[key] = props[key];
    }
  });
  return retProps;
}
function getValue(values, index) {
  return values ? values[index] : null;
}
function updateValues(values, value, index) {
  const newValues = [getValue(values, 0), getValue(values, 1)];
  newValues[index] = typeof value === 'function' ? value(newValues[index]) : value;
  if (!newValues[0] && !newValues[1]) {
    return null;
  }
  return newValues;
}

function generateUnits(start, end, step, disabledUnits) {
  const units = [];
  for (let i = start; i <= end; i += step) {
    units.push({
      label: leftPad(i, 2),
      value: i,
      disabled: (disabledUnits || []).includes(i)
    });
  }
  return units;
}
const TimeBody = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'TimeBody',
  inheritAttrs: false,
  props: ['generateConfig', 'prefixCls', 'operationRef', 'activeColumnIndex', 'value', 'showHour', 'showMinute', 'showSecond', 'use12Hours', 'hourStep', 'minuteStep', 'secondStep', 'disabledHours', 'disabledMinutes', 'disabledSeconds', 'disabledTime', 'hideDisabledOptions', 'onSelect'],
  setup(props) {
    const originHour = computed(() => props.value ? props.generateConfig.getHour(props.value) : -1);
    const isPM = computed(() => {
      if (props.use12Hours) {
        return originHour.value >= 12; // -1 means should display AM
      } else {
        return false;
      }
    });
    const hour = computed(() => {
      // Should additional logic to handle 12 hours
      if (props.use12Hours) {
        return originHour.value % 12;
      } else {
        return originHour.value;
      }
    });
    const minute = computed(() => props.value ? props.generateConfig.getMinute(props.value) : -1);
    const second = computed(() => props.value ? props.generateConfig.getSecond(props.value) : -1);
    const now = ref(props.generateConfig.getNow());
    const mergedDisabledHours = ref();
    const mergedDisabledMinutes = ref();
    const mergedDisabledSeconds = ref();
    onBeforeUpdate(() => {
      now.value = props.generateConfig.getNow();
    });
    watchEffect(() => {
      if (props.disabledTime) {
        const disabledConfig = props.disabledTime(now);
        [mergedDisabledHours.value, mergedDisabledMinutes.value, mergedDisabledSeconds.value] = [disabledConfig.disabledHours, disabledConfig.disabledMinutes, disabledConfig.disabledSeconds];
      } else {
        [mergedDisabledHours.value, mergedDisabledMinutes.value, mergedDisabledSeconds.value] = [props.disabledHours, props.disabledMinutes, props.disabledSeconds];
      }
    });
    const setTime$1 = (isNewPM, newHour, newMinute, newSecond) => {
      let newDate = props.value || props.generateConfig.getNow();
      const mergedHour = Math.max(0, newHour);
      const mergedMinute = Math.max(0, newMinute);
      const mergedSecond = Math.max(0, newSecond);
      newDate = setTime(props.generateConfig, newDate, !props.use12Hours || !isNewPM ? mergedHour : mergedHour + 12, mergedMinute, mergedSecond);
      return newDate;
    };
    // ========================= Unit =========================
    const rawHours = computed(() => {
      var _a;
      return generateUnits(0, 23, (_a = props.hourStep) !== null && _a !== void 0 ? _a : 1, mergedDisabledHours.value && mergedDisabledHours.value());
    });
    // const memorizedRawHours = useMemo(() => rawHours, rawHours, shouldUnitsUpdate);
    const AMPMDisabled = computed(() => {
      if (!props.use12Hours) {
        return [false, false];
      }
      const AMPMDisabled = [true, true];
      rawHours.value.forEach(_ref => {
        let {
          disabled,
          value: hourValue
        } = _ref;
        if (disabled) return;
        if (hourValue >= 12) {
          AMPMDisabled[1] = false;
        } else {
          AMPMDisabled[0] = false;
        }
      });
      return AMPMDisabled;
    });
    const hours = computed(() => {
      if (!props.use12Hours) return rawHours.value;
      return rawHours.value.filter(isPM.value ? hourMeta => hourMeta.value >= 12 : hourMeta => hourMeta.value < 12).map(hourMeta => {
        const hourValue = hourMeta.value % 12;
        const hourLabel = hourValue === 0 ? '12' : leftPad(hourValue, 2);
        return _extends(_extends({}, hourMeta), {
          label: hourLabel,
          value: hourValue
        });
      });
    });
    const minutes = computed(() => {
      var _a;
      return generateUnits(0, 59, (_a = props.minuteStep) !== null && _a !== void 0 ? _a : 1, mergedDisabledMinutes.value && mergedDisabledMinutes.value(originHour.value));
    });
    const seconds = computed(() => {
      var _a;
      return generateUnits(0, 59, (_a = props.secondStep) !== null && _a !== void 0 ? _a : 1, mergedDisabledSeconds.value && mergedDisabledSeconds.value(originHour.value, minute.value));
    });
    return () => {
      const {
        prefixCls,
        operationRef,
        activeColumnIndex,
        showHour,
        showMinute,
        showSecond,
        use12Hours,
        hideDisabledOptions,
        onSelect
      } = props;
      const columns = [];
      const contentPrefixCls = `${prefixCls}-content`;
      const columnPrefixCls = `${prefixCls}-time-panel`;
      // ====================== Operations ======================
      operationRef.value = {
        onUpDown: diff => {
          const column = columns[activeColumnIndex];
          if (column) {
            const valueIndex = column.units.findIndex(unit => unit.value === column.value);
            const unitLen = column.units.length;
            for (let i = 1; i < unitLen; i += 1) {
              const nextUnit = column.units[(valueIndex + diff * i + unitLen) % unitLen];
              if (nextUnit.disabled !== true) {
                column.onSelect(nextUnit.value);
                break;
              }
            }
          }
        }
      };
      // ======================== Render ========================
      function addColumnNode(condition, node, columnValue, units, onColumnSelect) {
        if (condition !== false) {
          columns.push({
            node: cloneElement(node, {
              prefixCls: columnPrefixCls,
              value: columnValue,
              active: activeColumnIndex === columns.length,
              onSelect: onColumnSelect,
              units,
              hideDisabledOptions
            }),
            onSelect: onColumnSelect,
            value: columnValue,
            units
          });
        }
      }
      // Hour
      addColumnNode(showHour, createVNode(TimeUnitColumn, {
        "key": "hour"
      }, null), hour.value, hours.value, num => {
        onSelect(setTime$1(isPM.value, num, minute.value, second.value), 'mouse');
      });
      // Minute
      addColumnNode(showMinute, createVNode(TimeUnitColumn, {
        "key": "minute"
      }, null), minute.value, minutes.value, num => {
        onSelect(setTime$1(isPM.value, hour.value, num, second.value), 'mouse');
      });
      // Second
      addColumnNode(showSecond, createVNode(TimeUnitColumn, {
        "key": "second"
      }, null), second.value, seconds.value, num => {
        onSelect(setTime$1(isPM.value, hour.value, minute.value, num), 'mouse');
      });
      // 12 Hours
      let PMIndex = -1;
      if (typeof isPM.value === 'boolean') {
        PMIndex = isPM.value ? 1 : 0;
      }
      addColumnNode(use12Hours === true, createVNode(TimeUnitColumn, {
        "key": "12hours"
      }, null), PMIndex, [{
        label: 'AM',
        value: 0,
        disabled: AMPMDisabled.value[0]
      }, {
        label: 'PM',
        value: 1,
        disabled: AMPMDisabled.value[1]
      }], num => {
        onSelect(setTime$1(!!num, hour.value, minute.value, second.value), 'mouse');
      });
      return createVNode("div", {
        "class": contentPrefixCls
      }, [columns.map(_ref2 => {
        let {
          node
        } = _ref2;
        return node;
      })]);
    };
  }
});

const countBoolean = boolList => boolList.filter(bool => bool !== false).length;
function TimePanel(_props) {
  const props = useMergeProps(_props);
  const {
    generateConfig,
    format = 'HH:mm:ss',
    prefixCls,
    active,
    operationRef,
    showHour,
    showMinute,
    showSecond,
    use12Hours = false,
    onSelect,
    value
  } = props;
  const panelPrefixCls = `${prefixCls}-time-panel`;
  const bodyOperationRef = ref();
  // ======================= Keyboard =======================
  const activeColumnIndex = ref(-1);
  const columnsCount = countBoolean([showHour, showMinute, showSecond, use12Hours]);
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        activeColumnIndex.value = (activeColumnIndex.value + diff + columnsCount) % columnsCount;
      },
      onUpDown: diff => {
        if (activeColumnIndex.value === -1) {
          activeColumnIndex.value = 0;
        } else if (bodyOperationRef.value) {
          bodyOperationRef.value.onUpDown(diff);
        }
      },
      onEnter: () => {
        onSelect(value || generateConfig.getNow(), 'key');
        activeColumnIndex.value = -1;
      }
    }),
    onBlur: () => {
      activeColumnIndex.value = -1;
    }
  };
  return createVNode("div", {
    "class": classNames(panelPrefixCls, {
      [`${panelPrefixCls}-active`]: active
    })
  }, [createVNode(TimeHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "format": format,
    "prefixCls": prefixCls
  }), null), createVNode(TimeBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "activeColumnIndex": activeColumnIndex.value,
    "operationRef": bodyOperationRef
  }), null)]);
}
TimePanel.displayName = 'TimePanel';
TimePanel.inheritAttrs = false;

function useCellClassName(_ref) {
  let {
    cellPrefixCls,
    generateConfig,
    rangedValue,
    hoverRangedValue,
    isInView,
    isSameCell,
    offsetCell,
    today,
    value
  } = _ref;
  function getClassName(currentDate) {
    const prevDate = offsetCell(currentDate, -1);
    const nextDate = offsetCell(currentDate, 1);
    const rangeStart = getValue(rangedValue, 0);
    const rangeEnd = getValue(rangedValue, 1);
    const hoverStart = getValue(hoverRangedValue, 0);
    const hoverEnd = getValue(hoverRangedValue, 1);
    const isRangeHovered = isInRange(generateConfig, hoverStart, hoverEnd, currentDate);
    function isRangeStart(date) {
      return isSameCell(rangeStart, date);
    }
    function isRangeEnd(date) {
      return isSameCell(rangeEnd, date);
    }
    const isHoverStart = isSameCell(hoverStart, currentDate);
    const isHoverEnd = isSameCell(hoverEnd, currentDate);
    const isHoverEdgeStart = (isRangeHovered || isHoverEnd) && (!isInView(prevDate) || isRangeEnd(prevDate));
    const isHoverEdgeEnd = (isRangeHovered || isHoverStart) && (!isInView(nextDate) || isRangeStart(nextDate));
    return {
      // In view
      [`${cellPrefixCls}-in-view`]: isInView(currentDate),
      // Range
      [`${cellPrefixCls}-in-range`]: isInRange(generateConfig, rangeStart, rangeEnd, currentDate),
      [`${cellPrefixCls}-range-start`]: isRangeStart(currentDate),
      [`${cellPrefixCls}-range-end`]: isRangeEnd(currentDate),
      [`${cellPrefixCls}-range-start-single`]: isRangeStart(currentDate) && !rangeEnd,
      [`${cellPrefixCls}-range-end-single`]: isRangeEnd(currentDate) && !rangeStart,
      [`${cellPrefixCls}-range-start-near-hover`]: isRangeStart(currentDate) && (isSameCell(prevDate, hoverStart) || isInRange(generateConfig, hoverStart, hoverEnd, prevDate)),
      [`${cellPrefixCls}-range-end-near-hover`]: isRangeEnd(currentDate) && (isSameCell(nextDate, hoverEnd) || isInRange(generateConfig, hoverStart, hoverEnd, nextDate)),
      // Range Hover
      [`${cellPrefixCls}-range-hover`]: isRangeHovered,
      [`${cellPrefixCls}-range-hover-start`]: isHoverStart,
      [`${cellPrefixCls}-range-hover-end`]: isHoverEnd,
      // Range Edge
      [`${cellPrefixCls}-range-hover-edge-start`]: isHoverEdgeStart,
      [`${cellPrefixCls}-range-hover-edge-end`]: isHoverEdgeEnd,
      [`${cellPrefixCls}-range-hover-edge-start-near-range`]: isHoverEdgeStart && isSameCell(prevDate, rangeEnd),
      [`${cellPrefixCls}-range-hover-edge-end-near-range`]: isHoverEdgeEnd && isSameCell(nextDate, rangeStart),
      // Others
      [`${cellPrefixCls}-today`]: isSameCell(today, currentDate),
      [`${cellPrefixCls}-selected`]: isSameCell(value, currentDate)
    };
  }
  return getClassName;
}

const RangeContextKey = Symbol('RangeContextProps');
const useProvideRange = props => {
  provide(RangeContextKey, props);
};
const useInjectRange = () => {
  return inject(RangeContextKey, {
    rangedValue: ref(),
    hoverRangedValue: ref(),
    inRange: ref(),
    panelPosition: ref()
  });
};
const RangeContextProvider = defineComponent({
  compatConfig: {
    MODE: 3
  },
  name: 'PanelContextProvider',
  inheritAttrs: false,
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const value = {
      rangedValue: ref(props.value.rangedValue),
      hoverRangedValue: ref(props.value.hoverRangedValue),
      inRange: ref(props.value.inRange),
      panelPosition: ref(props.value.panelPosition)
    };
    useProvideRange(value);
    watch(() => props.value, () => {
      Object.keys(props.value).forEach(key => {
        if (value[key]) {
          value[key].value = props.value[key];
        }
      });
    });
    return () => {
      var _a;
      return (_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots);
    };
  }
});

function DateBody(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    prefixColumn,
    locale,
    rowCount,
    viewDate,
    value,
    dateRender
  } = props;
  const {
    rangedValue,
    hoverRangedValue
  } = useInjectRange();
  const baseDate = getWeekStartDate(locale.locale, generateConfig, viewDate);
  const cellPrefixCls = `${prefixCls}-cell`;
  const weekFirstDay = generateConfig.locale.getWeekFirstDay(locale.locale);
  const today = generateConfig.getNow();
  // ============================== Header ==============================
  const headerCells = [];
  const weekDaysLocale = locale.shortWeekDays || (generateConfig.locale.getShortWeekDays ? generateConfig.locale.getShortWeekDays(locale.locale) : []);
  if (prefixColumn) {
    headerCells.push(createVNode("th", {
      "key": "empty",
      "aria-label": "empty cell"
    }, null));
  }
  for (let i = 0; i < WEEK_DAY_COUNT; i += 1) {
    headerCells.push(createVNode("th", {
      "key": i
    }, [weekDaysLocale[(i + weekFirstDay) % WEEK_DAY_COUNT]]));
  }
  // =============================== Body ===============================
  const getCellClassName = useCellClassName({
    cellPrefixCls,
    today,
    value,
    generateConfig,
    rangedValue: prefixColumn ? null : rangedValue.value,
    hoverRangedValue: prefixColumn ? null : hoverRangedValue.value,
    isSameCell: (current, target) => isSameDate(generateConfig, current, target),
    isInView: date => isSameMonth(generateConfig, date, viewDate),
    offsetCell: (date, offset) => generateConfig.addDate(date, offset)
  });
  const getCellNode = dateRender ? date => dateRender({
    current: date,
    today
  }) : undefined;
  return createVNode(PanelBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "rowNum": rowCount,
    "colNum": WEEK_DAY_COUNT,
    "baseDate": baseDate,
    "getCellNode": getCellNode,
    "getCellText": generateConfig.getDate,
    "getCellClassName": getCellClassName,
    "getCellDate": generateConfig.addDate,
    "titleCell": date => formatValue(date, {
      locale,
      format: 'YYYY-MM-DD',
      generateConfig
    }),
    "headerCells": headerCells
  }), null);
}
DateBody.displayName = 'DateBody';
DateBody.inheritAttrs = false;
DateBody.props = ['prefixCls', 'generateConfig', 'value?', 'viewDate', 'locale', 'rowCount', 'onSelect', 'dateRender?', 'disabledDate?',
// Used for week panel
'prefixColumn?', 'rowClassName?'];

function DateHeader(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    locale,
    viewDate,
    onNextMonth,
    onPrevMonth,
    onNextYear,
    onPrevYear,
    onYearClick,
    onMonthClick
  } = props;
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader.value) {
    return null;
  }
  const headerPrefixCls = `${prefixCls}-header`;
  const monthsLocale = locale.shortMonths || (generateConfig.locale.getShortMonths ? generateConfig.locale.getShortMonths(locale.locale) : []);
  const month = generateConfig.getMonth(viewDate);
  // =================== Month & Year ===================
  const yearNode = createVNode("button", {
    "type": "button",
    "key": "year",
    "onClick": onYearClick,
    "tabindex": -1,
    "class": `${prefixCls}-year-btn`
  }, [formatValue(viewDate, {
    locale,
    format: locale.yearFormat,
    generateConfig
  })]);
  const monthNode = createVNode("button", {
    "type": "button",
    "key": "month",
    "onClick": onMonthClick,
    "tabindex": -1,
    "class": `${prefixCls}-month-btn`
  }, [locale.monthFormat ? formatValue(viewDate, {
    locale,
    format: locale.monthFormat,
    generateConfig
  }) : monthsLocale[month]]);
  const monthYearNodes = locale.monthBeforeYear ? [monthNode, yearNode] : [yearNode, monthNode];
  return createVNode(Header, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": headerPrefixCls,
    "onSuperPrev": onPrevYear,
    "onPrev": onPrevMonth,
    "onNext": onNextMonth,
    "onSuperNext": onNextYear
  }), {
    default: () => [monthYearNodes]
  });
}
DateHeader.displayName = 'DateHeader';
DateHeader.inheritAttrs = false;

const DATE_ROW_COUNT = 6;
function DatePanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    panelName = 'date',
    keyboardConfig,
    active,
    operationRef,
    generateConfig,
    value,
    viewDate,
    onViewDateChange,
    onPanelChange,
    onSelect
  } = props;
  const panelPrefixCls = `${prefixCls}-${panelName}-panel`;
  // ======================= Keyboard =======================
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, _extends({
      onLeftRight: diff => {
        onSelect(generateConfig.addDate(value || viewDate, diff), 'key');
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key');
      },
      onUpDown: diff => {
        onSelect(generateConfig.addDate(value || viewDate, diff * WEEK_DAY_COUNT), 'key');
      },
      onPageUpDown: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff), 'key');
      }
    }, keyboardConfig))
  };
  // ==================== View Operation ====================
  const onYearChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  const onMonthChange = diff => {
    const newDate = generateConfig.addMonth(viewDate, diff);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  return createVNode("div", {
    "class": classNames(panelPrefixCls, {
      [`${panelPrefixCls}-active`]: active
    })
  }, [createVNode(DateHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "value": value,
    "viewDate": viewDate,
    "onPrevYear": () => {
      onYearChange(-1);
    },
    "onNextYear": () => {
      onYearChange(1);
    },
    "onPrevMonth": () => {
      onMonthChange(-1);
    },
    "onNextMonth": () => {
      onMonthChange(1);
    },
    "onMonthClick": () => {
      onPanelChange('month', viewDate);
    },
    "onYearClick": () => {
      onPanelChange('year', viewDate);
    }
  }), null), createVNode(DateBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "onSelect": date => onSelect(date, 'mouse'),
    "prefixCls": prefixCls,
    "value": value,
    "viewDate": viewDate,
    "rowCount": DATE_ROW_COUNT
  }), null)]);
}
DatePanel.displayName = 'DatePanel';
DatePanel.inheritAttrs = false;

const ACTIVE_PANEL = tuple('date', 'time');
function DatetimePanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    operationRef,
    generateConfig,
    value,
    defaultValue,
    disabledTime,
    showTime,
    onSelect
  } = props;
  const panelPrefixCls = `${prefixCls}-datetime-panel`;
  const activePanel = ref(null);
  const dateOperationRef = ref({});
  const timeOperationRef = ref({});
  const timeProps = typeof showTime === 'object' ? _extends({}, showTime) : {};
  // ======================= Keyboard =======================
  function getNextActive(offset) {
    const activeIndex = ACTIVE_PANEL.indexOf(activePanel.value) + offset;
    const nextActivePanel = ACTIVE_PANEL[activeIndex] || null;
    return nextActivePanel;
  }
  const onBlur = e => {
    if (timeOperationRef.value.onBlur) {
      timeOperationRef.value.onBlur(e);
    }
    activePanel.value = null;
  };
  operationRef.value = {
    onKeydown: event => {
      // Switch active panel
      if (event.which === KeyCode.TAB) {
        const nextActivePanel = getNextActive(event.shiftKey ? -1 : 1);
        activePanel.value = nextActivePanel;
        if (nextActivePanel) {
          event.preventDefault();
        }
        return true;
      }
      // Operate on current active panel
      if (activePanel.value) {
        const ref = activePanel.value === 'date' ? dateOperationRef : timeOperationRef;
        if (ref.value && ref.value.onKeydown) {
          ref.value.onKeydown(event);
        }
        return true;
      }
      // Switch first active panel if operate without panel
      if ([KeyCode.LEFT, KeyCode.RIGHT, KeyCode.UP, KeyCode.DOWN].includes(event.which)) {
        activePanel.value = 'date';
        return true;
      }
      return false;
    },
    onBlur,
    onClose: onBlur
  };
  // ======================== Events ========================
  const onInternalSelect = (date, source) => {
    let selectedDate = date;
    if (source === 'date' && !value && timeProps.defaultValue) {
      // Date with time defaultValue
      selectedDate = generateConfig.setHour(selectedDate, generateConfig.getHour(timeProps.defaultValue));
      selectedDate = generateConfig.setMinute(selectedDate, generateConfig.getMinute(timeProps.defaultValue));
      selectedDate = generateConfig.setSecond(selectedDate, generateConfig.getSecond(timeProps.defaultValue));
    } else if (source === 'time' && !value && defaultValue) {
      selectedDate = generateConfig.setYear(selectedDate, generateConfig.getYear(defaultValue));
      selectedDate = generateConfig.setMonth(selectedDate, generateConfig.getMonth(defaultValue));
      selectedDate = generateConfig.setDate(selectedDate, generateConfig.getDate(defaultValue));
    }
    if (onSelect) {
      onSelect(selectedDate, 'mouse');
    }
  };
  // ======================== Render ========================
  const disabledTimes = disabledTime ? disabledTime(value || null) : {};
  return createVNode("div", {
    "class": classNames(panelPrefixCls, {
      [`${panelPrefixCls}-active`]: activePanel.value
    })
  }, [createVNode(DatePanel, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "operationRef": dateOperationRef,
    "active": activePanel.value === 'date',
    "onSelect": date => {
      onInternalSelect(setDateTime(generateConfig, date, !value && typeof showTime === 'object' ? showTime.defaultValue : null), 'date');
    }
  }), null), createVNode(TimePanel, _objectSpread$3(_objectSpread$3(_objectSpread$3(_objectSpread$3({}, props), {}, {
    "format": undefined
  }, timeProps), disabledTimes), {}, {
    "disabledTime": null,
    "defaultValue": undefined,
    "operationRef": timeOperationRef,
    "active": activePanel.value === 'time',
    "onSelect": date => {
      onInternalSelect(date, 'time');
    }
  }), null)]);
}
DatetimePanel.displayName = 'DatetimePanel';
DatetimePanel.inheritAttrs = false;

function WeekPanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    locale,
    value
  } = props;
  // Render additional column
  const cellPrefixCls = `${prefixCls}-cell`;
  const prefixColumn = date => createVNode("td", {
    "key": "week",
    "class": classNames(cellPrefixCls, `${cellPrefixCls}-week`)
  }, [generateConfig.locale.getWeek(locale.locale, date)]);
  // Add row className
  const rowPrefixCls = `${prefixCls}-week-panel-row`;
  const rowClassName = date => classNames(rowPrefixCls, {
    [`${rowPrefixCls}-selected`]: isSameWeek(generateConfig, locale.locale, value, date)
  });
  return createVNode(DatePanel, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "panelName": "week",
    "prefixColumn": prefixColumn,
    "rowClassName": rowClassName,
    "keyboardConfig": {
      onLeftRight: null
    }
  }), null);
}
WeekPanel.displayName = 'WeekPanel';
WeekPanel.inheritAttrs = false;

function MonthHeader(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    locale,
    viewDate,
    onNextYear,
    onPrevYear,
    onYearClick
  } = props;
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader.value) {
    return null;
  }
  const headerPrefixCls = `${prefixCls}-header`;
  return createVNode(Header, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": headerPrefixCls,
    "onSuperPrev": onPrevYear,
    "onSuperNext": onNextYear
  }), {
    default: () => [createVNode("button", {
      "type": "button",
      "onClick": onYearClick,
      "class": `${prefixCls}-year-btn`
    }, [formatValue(viewDate, {
      locale,
      format: locale.yearFormat,
      generateConfig
    })])]
  });
}
MonthHeader.displayName = 'MonthHeader';
MonthHeader.inheritAttrs = false;

const MONTH_COL_COUNT = 3;
const MONTH_ROW_COUNT = 4;
function MonthBody(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    locale,
    value,
    viewDate,
    generateConfig,
    monthCellRender
  } = props;
  const {
    rangedValue,
    hoverRangedValue
  } = useInjectRange();
  const cellPrefixCls = `${prefixCls}-cell`;
  const getCellClassName = useCellClassName({
    cellPrefixCls,
    value,
    generateConfig,
    rangedValue: rangedValue.value,
    hoverRangedValue: hoverRangedValue.value,
    isSameCell: (current, target) => isSameMonth(generateConfig, current, target),
    isInView: () => true,
    offsetCell: (date, offset) => generateConfig.addMonth(date, offset)
  });
  const monthsLocale = locale.shortMonths || (generateConfig.locale.getShortMonths ? generateConfig.locale.getShortMonths(locale.locale) : []);
  const baseMonth = generateConfig.setMonth(viewDate, 0);
  const getCellNode = monthCellRender ? date => monthCellRender({
    current: date,
    locale
  }) : undefined;
  return createVNode(PanelBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "rowNum": MONTH_ROW_COUNT,
    "colNum": MONTH_COL_COUNT,
    "baseDate": baseMonth,
    "getCellNode": getCellNode,
    "getCellText": date => locale.monthFormat ? formatValue(date, {
      locale,
      format: locale.monthFormat,
      generateConfig
    }) : monthsLocale[generateConfig.getMonth(date)],
    "getCellClassName": getCellClassName,
    "getCellDate": generateConfig.addMonth,
    "titleCell": date => formatValue(date, {
      locale,
      format: 'YYYY-MM',
      generateConfig
    })
  }), null);
}
MonthBody.displayName = 'MonthBody';
MonthBody.inheritAttrs = false;

function MonthPanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    operationRef,
    onViewDateChange,
    generateConfig,
    value,
    viewDate,
    onPanelChange,
    onSelect
  } = props;
  const panelPrefixCls = `${prefixCls}-month-panel`;
  // ======================= Keyboard =======================
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff), 'key');
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key');
      },
      onUpDown: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff * MONTH_COL_COUNT), 'key');
      },
      onEnter: () => {
        onPanelChange('date', value || viewDate);
      }
    })
  };
  // ==================== View Operation ====================
  const onYearChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  return createVNode("div", {
    "class": panelPrefixCls
  }, [createVNode(MonthHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onPrevYear": () => {
      onYearChange(-1);
    },
    "onNextYear": () => {
      onYearChange(1);
    },
    "onYearClick": () => {
      onPanelChange('year', viewDate);
    }
  }), null), createVNode(MonthBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onSelect": date => {
      onSelect(date, 'mouse');
      onPanelChange('date', date);
    }
  }), null)]);
}
MonthPanel.displayName = 'MonthPanel';
MonthPanel.inheritAttrs = false;

function QuarterHeader(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    locale,
    viewDate,
    onNextYear,
    onPrevYear,
    onYearClick
  } = props;
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader.value) {
    return null;
  }
  const headerPrefixCls = `${prefixCls}-header`;
  return createVNode(Header, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": headerPrefixCls,
    "onSuperPrev": onPrevYear,
    "onSuperNext": onNextYear
  }), {
    default: () => [createVNode("button", {
      "type": "button",
      "onClick": onYearClick,
      "class": `${prefixCls}-year-btn`
    }, [formatValue(viewDate, {
      locale,
      format: locale.yearFormat,
      generateConfig
    })])]
  });
}
QuarterHeader.displayName = 'QuarterHeader';
QuarterHeader.inheritAttrs = false;

const QUARTER_COL_COUNT = 4;
const QUARTER_ROW_COUNT = 1;
function QuarterBody(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    locale,
    value,
    viewDate,
    generateConfig
  } = props;
  const {
    rangedValue,
    hoverRangedValue
  } = useInjectRange();
  const cellPrefixCls = `${prefixCls}-cell`;
  const getCellClassName = useCellClassName({
    cellPrefixCls,
    value,
    generateConfig,
    rangedValue: rangedValue.value,
    hoverRangedValue: hoverRangedValue.value,
    isSameCell: (current, target) => isSameQuarter(generateConfig, current, target),
    isInView: () => true,
    offsetCell: (date, offset) => generateConfig.addMonth(date, offset * 3)
  });
  const baseQuarter = generateConfig.setDate(generateConfig.setMonth(viewDate, 0), 1);
  return createVNode(PanelBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "rowNum": QUARTER_ROW_COUNT,
    "colNum": QUARTER_COL_COUNT,
    "baseDate": baseQuarter,
    "getCellText": date => formatValue(date, {
      locale,
      format: locale.quarterFormat || '[Q]Q',
      generateConfig
    }),
    "getCellClassName": getCellClassName,
    "getCellDate": (date, offset) => generateConfig.addMonth(date, offset * 3),
    "titleCell": date => formatValue(date, {
      locale,
      format: 'YYYY-[Q]Q',
      generateConfig
    })
  }), null);
}
QuarterBody.displayName = 'QuarterBody';
QuarterBody.inheritAttrs = false;

function QuarterPanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    operationRef,
    onViewDateChange,
    generateConfig,
    value,
    viewDate,
    onPanelChange,
    onSelect
  } = props;
  const panelPrefixCls = `${prefixCls}-quarter-panel`;
  // ======================= Keyboard =======================
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addMonth(value || viewDate, diff * 3), 'key');
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key');
      },
      onUpDown: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key');
      }
    })
  };
  // ==================== View Operation ====================
  const onYearChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  return createVNode("div", {
    "class": panelPrefixCls
  }, [createVNode(QuarterHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onPrevYear": () => {
      onYearChange(-1);
    },
    "onNextYear": () => {
      onYearChange(1);
    },
    "onYearClick": () => {
      onPanelChange('year', viewDate);
    }
  }), null), createVNode(QuarterBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onSelect": date => {
      onSelect(date, 'mouse');
    }
  }), null)]);
}
QuarterPanel.displayName = 'QuarterPanel';
QuarterPanel.inheritAttrs = false;

function YearHeader(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    generateConfig,
    viewDate,
    onPrevDecade,
    onNextDecade,
    onDecadeClick
  } = props;
  const {
    hideHeader
  } = useInjectPanel();
  if (hideHeader.value) {
    return null;
  }
  const headerPrefixCls = `${prefixCls}-header`;
  const yearNumber = generateConfig.getYear(viewDate);
  const startYear = Math.floor(yearNumber / YEAR_DECADE_COUNT) * YEAR_DECADE_COUNT;
  const endYear = startYear + YEAR_DECADE_COUNT - 1;
  return createVNode(Header, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": headerPrefixCls,
    "onSuperPrev": onPrevDecade,
    "onSuperNext": onNextDecade
  }), {
    default: () => [createVNode("button", {
      "type": "button",
      "onClick": onDecadeClick,
      "class": `${prefixCls}-decade-btn`
    }, [startYear, createTextVNode("-"), endYear])]
  });
}
YearHeader.displayName = 'YearHeader';
YearHeader.inheritAttrs = false;

const YEAR_COL_COUNT = 3;
const YEAR_ROW_COUNT = 4;
function YearBody(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    value,
    viewDate,
    locale,
    generateConfig
  } = props;
  const {
    rangedValue,
    hoverRangedValue
  } = useInjectRange();
  const yearPrefixCls = `${prefixCls}-cell`;
  // =============================== Year ===============================
  const yearNumber = generateConfig.getYear(viewDate);
  const startYear = Math.floor(yearNumber / YEAR_DECADE_COUNT) * YEAR_DECADE_COUNT;
  const endYear = startYear + YEAR_DECADE_COUNT - 1;
  const baseYear = generateConfig.setYear(viewDate, startYear - Math.ceil((YEAR_COL_COUNT * YEAR_ROW_COUNT - YEAR_DECADE_COUNT) / 2));
  const isInView = date => {
    const currentYearNumber = generateConfig.getYear(date);
    return startYear <= currentYearNumber && currentYearNumber <= endYear;
  };
  const getCellClassName = useCellClassName({
    cellPrefixCls: yearPrefixCls,
    value,
    generateConfig,
    rangedValue: rangedValue.value,
    hoverRangedValue: hoverRangedValue.value,
    isSameCell: (current, target) => isSameYear(generateConfig, current, target),
    isInView,
    offsetCell: (date, offset) => generateConfig.addYear(date, offset)
  });
  return createVNode(PanelBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "rowNum": YEAR_ROW_COUNT,
    "colNum": YEAR_COL_COUNT,
    "baseDate": baseYear,
    "getCellText": generateConfig.getYear,
    "getCellClassName": getCellClassName,
    "getCellDate": generateConfig.addYear,
    "titleCell": date => formatValue(date, {
      locale,
      format: 'YYYY',
      generateConfig
    })
  }), null);
}
YearBody.displayName = 'YearBody';
YearBody.inheritAttrs = false;

const YEAR_DECADE_COUNT = 10;
function YearPanel(_props) {
  const props = useMergeProps(_props);
  const {
    prefixCls,
    operationRef,
    onViewDateChange,
    generateConfig,
    value,
    viewDate,
    sourceMode,
    onSelect,
    onPanelChange
  } = props;
  const panelPrefixCls = `${prefixCls}-year-panel`;
  // ======================= Keyboard =======================
  operationRef.value = {
    onKeydown: event => createKeydownHandler(event, {
      onLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff), 'key');
      },
      onCtrlLeftRight: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff * YEAR_DECADE_COUNT), 'key');
      },
      onUpDown: diff => {
        onSelect(generateConfig.addYear(value || viewDate, diff * YEAR_COL_COUNT), 'key');
      },
      onEnter: () => {
        onPanelChange(sourceMode === 'date' ? 'date' : 'month', value || viewDate);
      }
    })
  };
  // ==================== View Operation ====================
  const onDecadeChange = diff => {
    const newDate = generateConfig.addYear(viewDate, diff * 10);
    onViewDateChange(newDate);
    onPanelChange(null, newDate);
  };
  return createVNode("div", {
    "class": panelPrefixCls
  }, [createVNode(YearHeader, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onPrevDecade": () => {
      onDecadeChange(-1);
    },
    "onNextDecade": () => {
      onDecadeChange(1);
    },
    "onDecadeClick": () => {
      onPanelChange('decade', viewDate);
    }
  }), null), createVNode(YearBody, _objectSpread$3(_objectSpread$3({}, props), {}, {
    "prefixCls": prefixCls,
    "onSelect": date => {
      onPanelChange(sourceMode === 'date' ? 'date' : 'month', date);
      onSelect(date, 'mouse');
    }
  }), null)]);
}
YearPanel.displayName = 'YearPanel';
YearPanel.inheritAttrs = false;

function getExtraFooter(prefixCls, mode, renderExtraFooter) {
  if (!renderExtraFooter) {
    return null;
  }
  return createVNode("div", {
    "class": `${prefixCls}-footer-extra`
  }, [renderExtraFooter(mode)]);
}

function getRanges(_ref) {
  let {
    prefixCls,
    components = {},
    needConfirmButton,
    onNow,
    onOk,
    okDisabled,
    showNow,
    locale
  } = _ref;
  let presetNode;
  let okNode;
  if (needConfirmButton) {
    const Button = components.button || 'button';
    if (onNow && showNow !== false) {
      presetNode = createVNode("li", {
        "class": `${prefixCls}-now`
      }, [createVNode("a", {
        "class": `${prefixCls}-now-btn`,
        "onClick": onNow
      }, [locale.now])]);
    }
    okNode = needConfirmButton && createVNode("li", {
      "class": `${prefixCls}-ok`
    }, [createVNode(Button, {
      "disabled": okDisabled,
      "onClick": e => {
        e.stopPropagation();
        onOk && onOk();
      }
    }, {
      default: () => [locale.ok]
    })]);
  }
  if (!presetNode && !okNode) {
    return null;
  }
  return createVNode("ul", {
    "class": `${prefixCls}-ranges`
  }, [presetNode, okNode]);
}

function PickerPanel() {
  return defineComponent({
    name: 'PickerPanel',
    inheritAttrs: false,
    props: {
      prefixCls: String,
      locale: Object,
      generateConfig: Object,
      value: Object,
      defaultValue: Object,
      pickerValue: Object,
      defaultPickerValue: Object,
      disabledDate: Function,
      mode: String,
      picker: {
        type: String,
        default: 'date'
      },
      tabindex: {
        type: [Number, String],
        default: 0
      },
      showNow: {
        type: Boolean,
        default: undefined
      },
      showTime: [Boolean, Object],
      showToday: Boolean,
      renderExtraFooter: Function,
      dateRender: Function,
      hideHeader: {
        type: Boolean,
        default: undefined
      },
      onSelect: Function,
      onChange: Function,
      onPanelChange: Function,
      onMousedown: Function,
      onPickerValueChange: Function,
      onOk: Function,
      components: Object,
      direction: String,
      hourStep: {
        type: Number,
        default: 1
      },
      minuteStep: {
        type: Number,
        default: 1
      },
      secondStep: {
        type: Number,
        default: 1
      }
    },
    setup(props, _ref) {
      let {
        attrs
      } = _ref;
      const needConfirmButton = computed(() => props.picker === 'date' && !!props.showTime || props.picker === 'time');
      const isHourStepValid = computed(() => 24 % props.hourStep === 0);
      const isMinuteStepValid = computed(() => 60 % props.minuteStep === 0);
      const isSecondStepValid = computed(() => 60 % props.secondStep === 0);
      const panelContext = useInjectPanel();
      const {
        operationRef,
        onSelect: onContextSelect,
        hideRanges,
        defaultOpenValue
      } = panelContext;
      const {
        inRange,
        panelPosition,
        rangedValue,
        hoverRangedValue
      } = useInjectRange();
      const panelRef = ref({});
      // Value
      const [mergedValue, setInnerValue] = useMergedState(null, {
        value: toRef(props, 'value'),
        defaultValue: props.defaultValue,
        postState: val => {
          if (!val && (defaultOpenValue === null || defaultOpenValue === void 0 ? void 0 : defaultOpenValue.value) && props.picker === 'time') {
            return defaultOpenValue.value;
          }
          return val;
        }
      });
      // View date control
      const [viewDate, setInnerViewDate] = useMergedState(null, {
        value: toRef(props, 'pickerValue'),
        defaultValue: props.defaultPickerValue || mergedValue.value,
        postState: date => {
          const {
            generateConfig,
            showTime,
            defaultValue
          } = props;
          const now = generateConfig.getNow();
          if (!date) return now;
          // When value is null and set showTime
          if (!mergedValue.value && props.showTime) {
            if (typeof showTime === 'object') {
              return setDateTime(generateConfig, Array.isArray(date) ? date[0] : date, showTime.defaultValue || now);
            }
            if (defaultValue) {
              return setDateTime(generateConfig, Array.isArray(date) ? date[0] : date, defaultValue);
            }
            return setDateTime(generateConfig, Array.isArray(date) ? date[0] : date, now);
          }
          return date;
        }
      });
      const setViewDate = date => {
        setInnerViewDate(date);
        if (props.onPickerValueChange) {
          props.onPickerValueChange(date);
        }
      };
      // Panel control
      const getInternalNextMode = nextMode => {
        const getNextMode = PickerModeMap[props.picker];
        if (getNextMode) {
          return getNextMode(nextMode);
        }
        return nextMode;
      };
      // Save panel is changed from which panel
      const [mergedMode, setInnerMode] = useMergedState(() => {
        if (props.picker === 'time') {
          return 'time';
        }
        return getInternalNextMode('date');
      }, {
        value: toRef(props, 'mode')
      });
      watch(() => props.picker, () => {
        setInnerMode(props.picker);
      });
      const sourceMode = ref(mergedMode.value);
      const setSourceMode = val => {
        sourceMode.value = val;
      };
      const onInternalPanelChange = (newMode, viewValue) => {
        const {
          onPanelChange,
          generateConfig
        } = props;
        const nextMode = getInternalNextMode(newMode || mergedMode.value);
        setSourceMode(mergedMode.value);
        setInnerMode(nextMode);
        if (onPanelChange && (mergedMode.value !== nextMode || isEqual(generateConfig, viewDate.value, viewDate.value))) {
          onPanelChange(viewValue, nextMode);
        }
      };
      const triggerSelect = function (date, type) {
        let forceTriggerSelect = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        const {
          picker,
          generateConfig,
          onSelect,
          onChange,
          disabledDate
        } = props;
        if (mergedMode.value === picker || forceTriggerSelect) {
          setInnerValue(date);
          if (onSelect) {
            onSelect(date);
          }
          if (onContextSelect) {
            onContextSelect(date, type);
          }
          if (onChange && !isEqual(generateConfig, date, mergedValue.value) && !(disabledDate === null || disabledDate === void 0 ? void 0 : disabledDate(date))) {
            onChange(date);
          }
        }
      };
      // ========================= Interactive ==========================
      const onInternalKeydown = e => {
        if (panelRef.value && panelRef.value.onKeydown) {
          if ([KeyCode.LEFT, KeyCode.RIGHT, KeyCode.UP, KeyCode.DOWN, KeyCode.PAGE_UP, KeyCode.PAGE_DOWN, KeyCode.ENTER].includes(e.which)) {
            e.preventDefault();
          }
          return panelRef.value.onKeydown(e);
        }
        /* istanbul ignore next */
        /* eslint-disable no-lone-blocks */
        {
          return false;
        }
        /* eslint-enable no-lone-blocks */
      };
      const onInternalBlur = e => {
        if (panelRef.value && panelRef.value.onBlur) {
          panelRef.value.onBlur(e);
        }
      };
      const onNow = () => {
        const {
          generateConfig,
          hourStep,
          minuteStep,
          secondStep
        } = props;
        const now = generateConfig.getNow();
        const lowerBoundTime = getLowerBoundTime(generateConfig.getHour(now), generateConfig.getMinute(now), generateConfig.getSecond(now), isHourStepValid.value ? hourStep : 1, isMinuteStepValid.value ? minuteStep : 1, isSecondStepValid.value ? secondStep : 1);
        const adjustedNow = setTime(generateConfig, now, lowerBoundTime[0],
        // hour
        lowerBoundTime[1],
        // minute
        lowerBoundTime[2]);
        triggerSelect(adjustedNow, 'submit');
      };
      const classString = computed(() => {
        const {
          prefixCls,
          direction
        } = props;
        return classNames(`${prefixCls}-panel`, {
          [`${prefixCls}-panel-has-range`]: rangedValue && rangedValue.value && rangedValue.value[0] && rangedValue.value[1],
          [`${prefixCls}-panel-has-range-hover`]: hoverRangedValue && hoverRangedValue.value && hoverRangedValue.value[0] && hoverRangedValue.value[1],
          [`${prefixCls}-panel-rtl`]: direction === 'rtl'
        });
      });
      useProvidePanel(_extends(_extends({}, panelContext), {
        mode: mergedMode,
        hideHeader: computed(() => {
          var _a;
          return props.hideHeader !== undefined ? props.hideHeader : (_a = panelContext.hideHeader) === null || _a === void 0 ? void 0 : _a.value;
        }),
        hidePrevBtn: computed(() => inRange.value && panelPosition.value === 'right'),
        hideNextBtn: computed(() => inRange.value && panelPosition.value === 'left')
      }));
      watch(() => props.value, () => {
        if (props.value) {
          setInnerViewDate(props.value);
        }
      });
      return () => {
        const {
          prefixCls = 'ant-picker',
          locale,
          generateConfig,
          disabledDate,
          picker = 'date',
          tabindex = 0,
          showNow,
          showTime,
          showToday,
          renderExtraFooter,
          onMousedown,
          onOk,
          components
        } = props;
        if (operationRef && panelPosition.value !== 'right') {
          operationRef.value = {
            onKeydown: onInternalKeydown,
            onClose: () => {
              if (panelRef.value && panelRef.value.onClose) {
                panelRef.value.onClose();
              }
            }
          };
        }
        // ============================ Panels ============================
        let panelNode;
        const pickerProps = _extends(_extends(_extends({}, attrs), props), {
          operationRef: panelRef,
          prefixCls,
          viewDate: viewDate.value,
          value: mergedValue.value,
          onViewDateChange: setViewDate,
          sourceMode: sourceMode.value,
          onPanelChange: onInternalPanelChange,
          disabledDate
        });
        delete pickerProps.onChange;
        delete pickerProps.onSelect;
        switch (mergedMode.value) {
          case 'decade':
            panelNode = createVNode(DecadePanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          case 'year':
            panelNode = createVNode(YearPanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          case 'month':
            panelNode = createVNode(MonthPanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          case 'quarter':
            panelNode = createVNode(QuarterPanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          case 'week':
            panelNode = createVNode(WeekPanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          case 'time':
            delete pickerProps.showTime;
            panelNode = createVNode(TimePanel, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, pickerProps), typeof showTime === 'object' ? showTime : null), {}, {
              "onSelect": (date, type) => {
                setViewDate(date);
                triggerSelect(date, type);
              }
            }), null);
            break;
          default:
            if (showTime) {
              panelNode = createVNode(DatetimePanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
                "onSelect": (date, type) => {
                  setViewDate(date);
                  triggerSelect(date, type);
                }
              }), null);
            } else {
              panelNode = createVNode(DatePanel, _objectSpread$3(_objectSpread$3({}, pickerProps), {}, {
                "onSelect": (date, type) => {
                  setViewDate(date);
                  triggerSelect(date, type);
                }
              }), null);
            }
        }
        // ============================ Footer ============================
        let extraFooter;
        let rangesNode;
        if (!(hideRanges === null || hideRanges === void 0 ? void 0 : hideRanges.value)) {
          extraFooter = getExtraFooter(prefixCls, mergedMode.value, renderExtraFooter);
          rangesNode = getRanges({
            prefixCls,
            components,
            needConfirmButton: needConfirmButton.value,
            okDisabled: !mergedValue.value || disabledDate && disabledDate(mergedValue.value),
            locale,
            showNow,
            onNow: needConfirmButton.value && onNow,
            onOk: () => {
              if (mergedValue.value) {
                triggerSelect(mergedValue.value, 'submit', true);
                if (onOk) {
                  onOk(mergedValue.value);
                }
              }
            }
          });
        }
        let todayNode;
        if (showToday && mergedMode.value === 'date' && picker === 'date' && !showTime) {
          const now = generateConfig.getNow();
          const todayCls = `${prefixCls}-today-btn`;
          const disabled = disabledDate && disabledDate(now);
          todayNode = createVNode("a", {
            "class": classNames(todayCls, disabled && `${todayCls}-disabled`),
            "aria-disabled": disabled,
            "onClick": () => {
              if (!disabled) {
                triggerSelect(now, 'mouse', true);
              }
            }
          }, [locale.today]);
        }
        return createVNode("div", {
          "tabindex": tabindex,
          "class": classNames(classString.value, attrs.class),
          "style": attrs.style,
          "onKeydown": onInternalKeydown,
          "onBlur": onInternalBlur,
          "onMousedown": onMousedown
        }, [panelNode, extraFooter || rangesNode || todayNode ? createVNode("div", {
          "class": `${prefixCls}-footer`
        }, [extraFooter, rangesNode, todayNode]) : null]);
      };
    }
  });
}
const InterPickerPanel = PickerPanel();
const PickerPanel$1 = (props => createVNode(InterPickerPanel, props));

const BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1
    }
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1
    }
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1
    }
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1
    }
  }
};
function PickerTrigger(props, _ref) {
  let {
    slots
  } = _ref;
  const {
    prefixCls,
    popupStyle,
    visible,
    dropdownClassName,
    dropdownAlign,
    transitionName,
    getPopupContainer,
    range,
    popupPlacement,
    direction
  } = useMergeProps(props);
  const dropdownPrefixCls = `${prefixCls}-dropdown`;
  const getPopupPlacement = () => {
    if (popupPlacement !== undefined) {
      return popupPlacement;
    }
    return direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
  };
  return createVNode(Trigger, {
    "showAction": [],
    "hideAction": [],
    "popupPlacement": getPopupPlacement(),
    "builtinPlacements": BUILT_IN_PLACEMENTS,
    "prefixCls": dropdownPrefixCls,
    "popupTransitionName": transitionName,
    "popupAlign": dropdownAlign,
    "popupVisible": visible,
    "popupClassName": classNames(dropdownClassName, {
      [`${dropdownPrefixCls}-range`]: range,
      [`${dropdownPrefixCls}-rtl`]: direction === 'rtl'
    }),
    "popupStyle": popupStyle,
    "getPopupContainer": getPopupContainer
  }, {
    default: slots.default,
    popup: slots.popupElement
  });
}

const PresetPanel = defineComponent({
  name: 'PresetPanel',
  props: {
    prefixCls: String,
    presets: {
      type: Array,
      default: () => []
    },
    onClick: Function,
    onHover: Function
  },
  setup(props) {
    return () => {
      if (!props.presets.length) {
        return null;
      }
      return createVNode("div", {
        "class": `${props.prefixCls}-presets`
      }, [createVNode("ul", null, [props.presets.map((_ref, index) => {
        let {
          label,
          value
        } = _ref;
        return createVNode("li", {
          "key": index,
          "onClick": e => {
            e.stopPropagation();
            props.onClick(value);
          },
          "onMouseenter": () => {
            var _a;
            (_a = props.onHover) === null || _a === void 0 ? void 0 : _a.call(props, value);
          },
          "onMouseleave": () => {
            var _a;
            (_a = props.onHover) === null || _a === void 0 ? void 0 : _a.call(props, null);
          }
        }, [label]);
      })])]);
    };
  }
});

function usePickerInput(_ref) {
  let {
    open,
    value,
    isClickOutside,
    triggerOpen,
    forwardKeydown,
    onKeydown,
    blurToCancel,
    onSubmit,
    onCancel,
    onFocus,
    onBlur
  } = _ref;
  const typing = shallowRef(false);
  const focused = shallowRef(false);
  /**
   * We will prevent blur to handle open event when user click outside,
   * since this will repeat trigger `onOpenChange` event.
   */
  const preventBlurRef = shallowRef(false);
  const valueChangedRef = shallowRef(false);
  const preventDefaultRef = shallowRef(false);
  const inputProps = computed(() => ({
    onMousedown: () => {
      typing.value = true;
      triggerOpen(true);
    },
    onKeydown: e => {
      const preventDefault = () => {
        preventDefaultRef.value = true;
      };
      onKeydown(e, preventDefault);
      if (preventDefaultRef.value) return;
      switch (e.which) {
        case KeyCode.ENTER:
          {
            if (!open.value) {
              triggerOpen(true);
            } else if (onSubmit() !== false) {
              typing.value = true;
            }
            e.preventDefault();
            return;
          }
        case KeyCode.TAB:
          {
            if (typing.value && open.value && !e.shiftKey) {
              typing.value = false;
              e.preventDefault();
            } else if (!typing.value && open.value) {
              if (!forwardKeydown(e) && e.shiftKey) {
                typing.value = true;
                e.preventDefault();
              }
            }
            return;
          }
        case KeyCode.ESC:
          {
            typing.value = true;
            onCancel();
            return;
          }
      }
      if (!open.value && ![KeyCode.SHIFT].includes(e.which)) {
        triggerOpen(true);
      } else if (!typing.value) {
        // Let popup panel handle keyboard
        forwardKeydown(e);
      }
    },
    onFocus: e => {
      typing.value = true;
      focused.value = true;
      if (onFocus) {
        onFocus(e);
      }
    },
    onBlur: e => {
      if (preventBlurRef.value || !isClickOutside(document.activeElement)) {
        preventBlurRef.value = false;
        return;
      }
      if (blurToCancel.value) {
        setTimeout(() => {
          let {
            activeElement
          } = document;
          while (activeElement && activeElement.shadowRoot) {
            activeElement = activeElement.shadowRoot.activeElement;
          }
          if (isClickOutside(activeElement)) {
            onCancel();
          }
        }, 0);
      } else if (open.value) {
        triggerOpen(false);
        if (valueChangedRef.value) {
          onSubmit();
        }
      }
      focused.value = false;
      if (onBlur) {
        onBlur(e);
      }
    }
  }));
  // check if value changed
  watch(open, () => {
    valueChangedRef.value = false;
  });
  watch(value, () => {
    valueChangedRef.value = true;
  });
  const globalMousedownEvent = shallowRef();
  // Global click handler
  onMounted(() => {
    globalMousedownEvent.value = addGlobalMousedownEvent(e => {
      const target = getTargetFromEvent(e);
      if (open.value) {
        const clickedOutside = isClickOutside(target);
        if (!clickedOutside) {
          preventBlurRef.value = true;
          // Always set back in case `onBlur` prevented by user
          wrapperRaf(() => {
            preventBlurRef.value = false;
          });
        } else if (!focused.value || clickedOutside) {
          triggerOpen(false);
        }
      }
    });
  });
  onBeforeUnmount(() => {
    globalMousedownEvent.value && globalMousedownEvent.value();
  });
  return [inputProps, {
    focused,
    typing
  }];
}

function useTextValueMapping(_ref) {
  let {
    valueTexts,
    onTextChange
  } = _ref;
  const text = ref('');
  function triggerTextChange(value) {
    text.value = value;
    onTextChange(value);
  }
  function resetText() {
    text.value = valueTexts.value[0];
  }
  watch(() => [...valueTexts.value], function (cur) {
    let pre = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    if (cur.join('||') !== pre.join('||') && valueTexts.value.every(valText => valText !== text.value)) {
      resetText();
    }
  }, {
    immediate: true
  });
  return [text, triggerTextChange, resetText];
}

function useValueTexts(value, _ref) {
  let {
    formatList,
    generateConfig,
    locale
  } = _ref;
  const texts = useMemo(() => {
    if (!value.value) {
      return [[''], ''];
    }
    // We will convert data format back to first format
    let firstValueText = '';
    const fullValueTexts = [];
    for (let i = 0; i < formatList.value.length; i += 1) {
      const format = formatList.value[i];
      const formatStr = formatValue(value.value, {
        generateConfig: generateConfig.value,
        locale: locale.value,
        format
      });
      fullValueTexts.push(formatStr);
      if (i === 0) {
        firstValueText = formatStr;
      }
    }
    return [fullValueTexts, firstValueText];
  }, [value, formatList], (next, prev) => prev[0] !== next[0] || !shallowequal(prev[1], next[1]));
  const fullValueTexts = computed(() => texts.value[0]);
  const firstValueText = computed(() => texts.value[1]);
  return [fullValueTexts, firstValueText];
}

function useHoverValue(valueText, _ref) {
  let {
    formatList,
    generateConfig,
    locale
  } = _ref;
  const innerValue = ref(null);
  let rafId;
  function setValue(val) {
    let immediately = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    wrapperRaf.cancel(rafId);
    if (immediately) {
      innerValue.value = val;
      return;
    }
    rafId = wrapperRaf(() => {
      innerValue.value = val;
    });
  }
  const [, firstText] = useValueTexts(innerValue, {
    formatList,
    generateConfig,
    locale
  });
  function onEnter(date) {
    setValue(date);
  }
  function onLeave() {
    let immediately = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    setValue(null, immediately);
  }
  watch(valueText, () => {
    onLeave(true);
  });
  onBeforeUnmount(() => {
    wrapperRaf.cancel(rafId);
  });
  return [firstText, onEnter, onLeave];
}

function usePresets(presets, legacyRanges) {
  return computed(() => {
    if (presets === null || presets === void 0 ? void 0 : presets.value) {
      return presets.value;
    }
    if (legacyRanges === null || legacyRanges === void 0 ? void 0 : legacyRanges.value) {
      warningOnce(false, '`ranges` is deprecated. Please use `presets` instead.');
      const rangeLabels = Object.keys(legacyRanges.value);
      return rangeLabels.map(label => {
        const range = legacyRanges.value[label];
        const newValues = typeof range === 'function' ? range() : range;
        return {
          label,
          value: newValues
        };
      });
    }
    return [];
  });
}

function Picker() {
  return defineComponent({
    name: 'Picker',
    inheritAttrs: false,
    props: ['prefixCls', 'id', 'tabindex', 'dropdownClassName', 'dropdownAlign', 'popupStyle', 'transitionName', 'generateConfig', 'locale', 'inputReadOnly', 'allowClear', 'autofocus', 'showTime', 'showNow', 'showHour', 'showMinute', 'showSecond', 'picker', 'format', 'use12Hours', 'value', 'defaultValue', 'open', 'defaultOpen', 'defaultOpenValue', 'suffixIcon', 'presets', 'clearIcon', 'disabled', 'disabledDate', 'placeholder', 'getPopupContainer', 'panelRender', 'inputRender', 'onChange', 'onOpenChange', 'onPanelChange', 'onFocus', 'onBlur', 'onMousedown', 'onMouseup', 'onMouseenter', 'onMouseleave', 'onContextmenu', 'onClick', 'onKeydown', 'onSelect', 'direction', 'autocomplete', 'showToday', 'renderExtraFooter', 'dateRender', 'minuteStep', 'hourStep', 'secondStep', 'hideDisabledOptions'],
    setup(props, _ref) {
      let {
        attrs,
        expose
      } = _ref;
      const inputRef = ref(null);
      const presets = computed(() => props.presets);
      const presetList = usePresets(presets);
      const picker = computed(() => {
        var _a;
        return (_a = props.picker) !== null && _a !== void 0 ? _a : 'date';
      });
      const needConfirmButton = computed(() => picker.value === 'date' && !!props.showTime || picker.value === 'time');
      // ============================= State =============================
      const formatList = computed(() => toArray$1(getDefaultFormat(props.format, picker.value, props.showTime, props.use12Hours)));
      // Panel ref
      const panelDivRef = ref(null);
      const inputDivRef = ref(null);
      const containerRef = ref(null);
      // Real value
      const [mergedValue, setInnerValue] = useMergedState(null, {
        value: toRef(props, 'value'),
        defaultValue: props.defaultValue
      });
      const selectedValue = ref(mergedValue.value);
      const setSelectedValue = val => {
        selectedValue.value = val;
      };
      // Operation ref
      const operationRef = ref(null);
      // Open
      const [mergedOpen, triggerInnerOpen] = useMergedState(false, {
        value: toRef(props, 'open'),
        defaultValue: props.defaultOpen,
        postState: postOpen => props.disabled ? false : postOpen,
        onChange: newOpen => {
          if (props.onOpenChange) {
            props.onOpenChange(newOpen);
          }
          if (!newOpen && operationRef.value && operationRef.value.onClose) {
            operationRef.value.onClose();
          }
        }
      });
      // ============================= Text ==============================
      const [valueTexts, firstValueText] = useValueTexts(selectedValue, {
        formatList,
        generateConfig: toRef(props, 'generateConfig'),
        locale: toRef(props, 'locale')
      });
      const [text, triggerTextChange, resetText] = useTextValueMapping({
        valueTexts,
        onTextChange: newText => {
          const inputDate = parseValue(newText, {
            locale: props.locale,
            formatList: formatList.value,
            generateConfig: props.generateConfig
          });
          if (inputDate && (!props.disabledDate || !props.disabledDate(inputDate))) {
            setSelectedValue(inputDate);
          }
        }
      });
      // ============================ Trigger ============================
      const triggerChange = newValue => {
        const {
          onChange,
          generateConfig,
          locale
        } = props;
        setSelectedValue(newValue);
        setInnerValue(newValue);
        if (onChange && !isEqual(generateConfig, mergedValue.value, newValue)) {
          onChange(newValue, newValue ? formatValue(newValue, {
            generateConfig,
            locale,
            format: formatList.value[0]
          }) : '');
        }
      };
      const triggerOpen = newOpen => {
        if (props.disabled && newOpen) {
          return;
        }
        triggerInnerOpen(newOpen);
      };
      const forwardKeydown = e => {
        if (mergedOpen.value && operationRef.value && operationRef.value.onKeydown) {
          // Let popup panel handle keyboard
          return operationRef.value.onKeydown(e);
        }
        /* istanbul ignore next */
        /* eslint-disable no-lone-blocks */
        {
          return false;
        }
      };
      const onInternalMouseup = function () {
        if (props.onMouseup) {
          props.onMouseup(...arguments);
        }
        if (inputRef.value) {
          inputRef.value.focus();
          triggerOpen(true);
        }
      };
      // ============================= Input =============================
      const [inputProps, {
        focused,
        typing
      }] = usePickerInput({
        blurToCancel: needConfirmButton,
        open: mergedOpen,
        value: text,
        triggerOpen,
        forwardKeydown,
        isClickOutside: target => !elementsContains([panelDivRef.value, inputDivRef.value, containerRef.value], target),
        onSubmit: () => {
          if (
          // When user typing disabledDate with keyboard and enter, this value will be empty
          !selectedValue.value ||
          // Normal disabled check
          props.disabledDate && props.disabledDate(selectedValue.value)) {
            return false;
          }
          triggerChange(selectedValue.value);
          triggerOpen(false);
          resetText();
          return true;
        },
        onCancel: () => {
          triggerOpen(false);
          setSelectedValue(mergedValue.value);
          resetText();
        },
        onKeydown: (e, preventDefault) => {
          var _a;
          (_a = props.onKeydown) === null || _a === void 0 ? void 0 : _a.call(props, e, preventDefault);
        },
        onFocus: e => {
          var _a;
          (_a = props.onFocus) === null || _a === void 0 ? void 0 : _a.call(props, e);
        },
        onBlur: e => {
          var _a;
          (_a = props.onBlur) === null || _a === void 0 ? void 0 : _a.call(props, e);
        }
      });
      // ============================= Sync ==============================
      // Close should sync back with text value
      watch([mergedOpen, valueTexts], () => {
        if (!mergedOpen.value) {
          setSelectedValue(mergedValue.value);
          if (!valueTexts.value.length || valueTexts.value[0] === '') {
            triggerTextChange('');
          } else if (firstValueText.value !== text.value) {
            resetText();
          }
        }
      });
      // Change picker should sync back with text value
      watch(picker, () => {
        if (!mergedOpen.value) {
          resetText();
        }
      });
      // Sync innerValue with control mode
      watch(mergedValue, () => {
        // Sync select value
        setSelectedValue(mergedValue.value);
      });
      const [hoverValue, onEnter, onLeave] = useHoverValue(text, {
        formatList,
        generateConfig: toRef(props, 'generateConfig'),
        locale: toRef(props, 'locale')
      });
      const onContextSelect = (date, type) => {
        if (type === 'submit' || type !== 'key' && !needConfirmButton.value) {
          // triggerChange will also update selected values
          triggerChange(date);
          triggerOpen(false);
        }
      };
      useProvidePanel({
        operationRef,
        hideHeader: computed(() => picker.value === 'time'),
        onSelect: onContextSelect,
        open: mergedOpen,
        defaultOpenValue: toRef(props, 'defaultOpenValue'),
        onDateMouseenter: onEnter,
        onDateMouseleave: onLeave
      });
      expose({
        focus: () => {
          if (inputRef.value) {
            inputRef.value.focus();
          }
        },
        blur: () => {
          if (inputRef.value) {
            inputRef.value.blur();
          }
        }
      });
      return () => {
        const {
          prefixCls = 'rc-picker',
          id,
          tabindex,
          dropdownClassName,
          dropdownAlign,
          popupStyle,
          transitionName,
          generateConfig,
          locale,
          inputReadOnly,
          allowClear,
          autofocus,
          picker = 'date',
          defaultOpenValue,
          suffixIcon,
          clearIcon,
          disabled,
          placeholder,
          getPopupContainer,
          panelRender,
          onMousedown,
          onMouseenter,
          onMouseleave,
          onContextmenu,
          onClick,
          onSelect,
          direction,
          autocomplete = 'off'
        } = props;
        // ============================= Panel =============================
        const panelProps = _extends(_extends(_extends({}, props), attrs), {
          class: classNames({
            [`${prefixCls}-panel-focused`]: !typing.value
          }),
          style: undefined,
          pickerValue: undefined,
          onPickerValueChange: undefined,
          onChange: null
        });
        let panelNode = createVNode("div", {
          "class": `${prefixCls}-panel-layout`
        }, [createVNode(PresetPanel, {
          "prefixCls": prefixCls,
          "presets": presetList.value,
          "onClick": nextValue => {
            triggerChange(nextValue);
            triggerOpen(false);
          }
        }, null), createVNode(PickerPanel$1, _objectSpread$3(_objectSpread$3({}, panelProps), {}, {
          "generateConfig": generateConfig,
          "value": selectedValue.value,
          "locale": locale,
          "tabindex": -1,
          "onSelect": date => {
            onSelect === null || onSelect === void 0 ? void 0 : onSelect(date);
            setSelectedValue(date);
          },
          "direction": direction,
          "onPanelChange": (viewDate, mode) => {
            const {
              onPanelChange
            } = props;
            onLeave(true);
            onPanelChange === null || onPanelChange === void 0 ? void 0 : onPanelChange(viewDate, mode);
          }
        }), null)]);
        if (panelRender) {
          panelNode = panelRender(panelNode);
        }
        const panel = createVNode("div", {
          "class": `${prefixCls}-panel-container`,
          "ref": panelDivRef,
          "onMousedown": e => {
            e.preventDefault();
          }
        }, [panelNode]);
        let suffixNode;
        if (suffixIcon) {
          suffixNode = createVNode("span", {
            "class": `${prefixCls}-suffix`
          }, [suffixIcon]);
        }
        let clearNode;
        if (allowClear && mergedValue.value && !disabled) {
          clearNode = createVNode("span", {
            "onMousedown": e => {
              e.preventDefault();
              e.stopPropagation();
            },
            "onMouseup": e => {
              e.preventDefault();
              e.stopPropagation();
              triggerChange(null);
              triggerOpen(false);
            },
            "class": `${prefixCls}-clear`,
            "role": "button"
          }, [clearIcon || createVNode("span", {
            "class": `${prefixCls}-clear-btn`
          }, null)]);
        }
        const mergedInputProps = _extends(_extends(_extends(_extends({
          id,
          tabindex,
          disabled,
          readonly: inputReadOnly || typeof formatList.value[0] === 'function' || !typing.value,
          value: hoverValue.value || text.value,
          onInput: e => {
            triggerTextChange(e.target.value);
          },
          autofocus,
          placeholder,
          ref: inputRef,
          title: text.value
        }, inputProps.value), {
          size: getInputSize(picker, formatList.value[0], generateConfig)
        }), getDataOrAriaProps(props)), {
          autocomplete
        });
        const inputNode = props.inputRender ? props.inputRender(mergedInputProps) : createVNode("input", mergedInputProps, null);
        // ============================ Return =============================
        const popupPlacement = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
        return createVNode("div", {
          "ref": containerRef,
          "class": classNames(prefixCls, attrs.class, {
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-focused`]: focused.value,
            [`${prefixCls}-rtl`]: direction === 'rtl'
          }),
          "style": attrs.style,
          "onMousedown": onMousedown,
          "onMouseup": onInternalMouseup,
          "onMouseenter": onMouseenter,
          "onMouseleave": onMouseleave,
          "onContextmenu": onContextmenu,
          "onClick": onClick
        }, [createVNode("div", {
          "class": classNames(`${prefixCls}-input`, {
            [`${prefixCls}-input-placeholder`]: !!hoverValue.value
          }),
          "ref": inputDivRef
        }, [inputNode, suffixNode, clearNode]), createVNode(PickerTrigger, {
          "visible": mergedOpen.value,
          "popupStyle": popupStyle,
          "prefixCls": prefixCls,
          "dropdownClassName": dropdownClassName,
          "dropdownAlign": dropdownAlign,
          "getPopupContainer": getPopupContainer,
          "transitionName": transitionName,
          "popupPlacement": popupPlacement,
          "direction": direction
        }, {
          default: () => [createVNode("div", {
            "style": {
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            }
          }, null)],
          popupElement: () => panel
        })]);
      };
    }
  });
}
const Picker$1 = Picker();

function useRangeDisabled(_ref, openRecordsRef) {
  let {
    picker,
    locale,
    selectedValue,
    disabledDate,
    disabled,
    generateConfig
  } = _ref;
  const startDate = computed(() => getValue(selectedValue.value, 0));
  const endDate = computed(() => getValue(selectedValue.value, 1));
  function weekFirstDate(date) {
    return generateConfig.value.locale.getWeekFirstDate(locale.value.locale, date);
  }
  function monthNumber(date) {
    const year = generateConfig.value.getYear(date);
    const month = generateConfig.value.getMonth(date);
    return year * 100 + month;
  }
  function quarterNumber(date) {
    const year = generateConfig.value.getYear(date);
    const quarter = getQuarter(generateConfig.value, date);
    return year * 10 + quarter;
  }
  const disabledStartDate = date => {
    var _a;
    if (disabledDate && ((_a = disabledDate === null || disabledDate === void 0 ? void 0 : disabledDate.value) === null || _a === void 0 ? void 0 : _a.call(disabledDate, date))) {
      return true;
    }
    // Disabled range
    if (disabled[1] && endDate) {
      return !isSameDate(generateConfig.value, date, endDate.value) && generateConfig.value.isAfter(date, endDate.value);
    }
    // Disabled part
    if (openRecordsRef.value[1] && endDate.value) {
      switch (picker.value) {
        case 'quarter':
          return quarterNumber(date) > quarterNumber(endDate.value);
        case 'month':
          return monthNumber(date) > monthNumber(endDate.value);
        case 'week':
          return weekFirstDate(date) > weekFirstDate(endDate.value);
        default:
          return !isSameDate(generateConfig.value, date, endDate.value) && generateConfig.value.isAfter(date, endDate.value);
      }
    }
    return false;
  };
  const disabledEndDate = date => {
    var _a;
    if ((_a = disabledDate.value) === null || _a === void 0 ? void 0 : _a.call(disabledDate, date)) {
      return true;
    }
    // Disabled range
    if (disabled[0] && startDate) {
      return !isSameDate(generateConfig.value, date, endDate.value) && generateConfig.value.isAfter(startDate.value, date);
    }
    // Disabled part
    if (openRecordsRef.value[0] && startDate.value) {
      switch (picker.value) {
        case 'quarter':
          return quarterNumber(date) < quarterNumber(startDate.value);
        case 'month':
          return monthNumber(date) < monthNumber(startDate.value);
        case 'week':
          return weekFirstDate(date) < weekFirstDate(startDate.value);
        default:
          return !isSameDate(generateConfig.value, date, startDate.value) && generateConfig.value.isAfter(startDate.value, date);
      }
    }
    return false;
  };
  return [disabledStartDate, disabledEndDate];
}

function getStartEndDistance(startDate, endDate, picker, generateConfig) {
  const startNext = getClosingViewDate(startDate, picker, generateConfig, 1);
  function getDistance(compareFunc) {
    if (compareFunc(startDate, endDate)) {
      return 'same';
    }
    if (compareFunc(startNext, endDate)) {
      return 'closing';
    }
    return 'far';
  }
  switch (picker) {
    case 'year':
      return getDistance((start, end) => isSameDecade(generateConfig, start, end));
    case 'quarter':
    case 'month':
      return getDistance((start, end) => isSameYear(generateConfig, start, end));
    default:
      return getDistance((start, end) => isSameMonth(generateConfig, start, end));
  }
}
function getRangeViewDate(values, index, picker, generateConfig) {
  const startDate = getValue(values, 0);
  const endDate = getValue(values, 1);
  if (index === 0) {
    return startDate;
  }
  if (startDate && endDate) {
    const distance = getStartEndDistance(startDate, endDate, picker, generateConfig);
    switch (distance) {
      case 'same':
        return startDate;
      case 'closing':
        return startDate;
      default:
        return getClosingViewDate(endDate, picker, generateConfig, -1);
    }
  }
  return startDate;
}
function useRangeViewDates(_ref) {
  let {
    values,
    picker,
    defaultDates,
    generateConfig
  } = _ref;
  const defaultViewDates = ref([getValue(defaultDates, 0), getValue(defaultDates, 1)]);
  const viewDates = ref(null);
  const startDate = computed(() => getValue(values.value, 0));
  const endDate = computed(() => getValue(values.value, 1));
  const getViewDate = index => {
    // If set default view date, use it
    if (defaultViewDates.value[index]) {
      return defaultViewDates.value[index];
    }
    return getValue(viewDates.value, index) || getRangeViewDate(values.value, index, picker.value, generateConfig.value) || startDate.value || endDate.value || generateConfig.value.getNow();
  };
  const startViewDate = ref(null);
  const endViewDate = ref(null);
  watchEffect(() => {
    startViewDate.value = getViewDate(0);
    endViewDate.value = getViewDate(1);
  });
  function setViewDate(viewDate, index) {
    if (viewDate) {
      let newViewDates = updateValues(viewDates.value, viewDate, index);
      // Set view date will clean up default one
      // Should always be an array
      defaultViewDates.value = updateValues(defaultViewDates.value, null, index) || [null, null];
      // Reset another one when not have value
      const anotherIndex = (index + 1) % 2;
      if (!getValue(values.value, anotherIndex)) {
        newViewDates = updateValues(newViewDates, viewDate, anotherIndex);
      }
      viewDates.value = newViewDates;
    } else if (startDate.value || endDate.value) {
      // Reset all when has values when `viewDate` is `null` which means from open trigger
      viewDates.value = null;
    }
  }
  return [startViewDate, endViewDate, setViewDate];
}

/**
 * Call onScopeDispose() if it's inside a effect scope lifecycle, if not, do nothing
 *
 * @param fn
 */
function tryOnScopeDispose(fn) {
  if (getCurrentScope()) {
    onScopeDispose(fn);
    return true;
  }
  return false;
}

/**
 * Get the value of value/ref/getter.
 */
function resolveUnref(r) {
  return typeof r === 'function' ? r() : unref(r);
}

/**
 * Get the dom element of a ref of element or Vue component instance
 *
 * @param elRef
 */
function unrefElement(elRef) {
  var _a;
  const plain = resolveUnref(elRef);
  return (_a = plain === null || plain === void 0 ? void 0 : plain.$el) !== null && _a !== void 0 ? _a : plain;
}

// eslint-disable-next-line no-restricted-imports
/**
 * Call onMounted() if it's inside a component lifecycle, if not, just call the function
 *
 * @param fn
 * @param sync if set to false, it will run in the nextTick() of Vue
 */
function tryOnMounted(fn) {
  let sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  if (getCurrentInstance()) onMounted(fn);else if (sync) fn();else nextTick(fn);
}

function useSupported(callback) {
  let sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const isSupported = shallowRef();
  const update = () => isSupported.value = Boolean(callback());
  update();
  tryOnMounted(update, sync);
  return isSupported;
}

const defaultWindow = undefined;

var __rest$2 = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
/**
 * Reports changes to the dimensions of an Element's content or the border-box
 *
 * @see https://vueuse.org/useResizeObserver
 * @param target
 * @param callback
 * @param options
 */
function useResizeObserver(target, callback) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
      window = defaultWindow
    } = options,
    observerOptions = __rest$2(options, ["window"]);
  let observer;
  const isSupported = useSupported(() => window && 'ResizeObserver' in window);
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }
  };
  const stopWatch = watch(() => unrefElement(target), el => {
    cleanup();
    if (isSupported.value && window && el) {
      observer = new ResizeObserver(callback);
      observer.observe(el, observerOptions);
    }
  }, {
    immediate: true,
    flush: 'post'
  });
  const stop = () => {
    cleanup();
    stopWatch();
  };
  tryOnScopeDispose(stop);
  return {
    isSupported,
    stop
  };
}

/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
function useElementSize(target) {
  let initialSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    width: 0,
    height: 0
  };
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
    box = 'content-box'
  } = options;
  const width = shallowRef(initialSize.width);
  const height = shallowRef(initialSize.height);
  useResizeObserver(target, _ref => {
    let [entry] = _ref;
    const boxSize = box === 'border-box' ? entry.borderBoxSize : box === 'content-box' ? entry.contentBoxSize : entry.devicePixelContentBoxSize;
    if (boxSize) {
      width.value = boxSize.reduce((acc, _ref2) => {
        let {
          inlineSize
        } = _ref2;
        return acc + inlineSize;
      }, 0);
      height.value = boxSize.reduce((acc, _ref3) => {
        let {
          blockSize
        } = _ref3;
        return acc + blockSize;
      }, 0);
    } else {
      // fallback
      width.value = entry.contentRect.width;
      height.value = entry.contentRect.height;
    }
  }, options);
  watch(() => unrefElement(target), ele => {
    width.value = ele ? initialSize.width : 0;
    height.value = ele ? initialSize.height : 0;
  });
  return {
    width,
    height
  };
}

function reorderValues(values, generateConfig) {
  if (values && values[0] && values[1] && generateConfig.isAfter(values[0], values[1])) {
    return [values[1], values[0]];
  }
  return values;
}
function canValueTrigger(value, index, disabled, allowEmpty) {
  if (value) {
    return true;
  }
  if (allowEmpty && allowEmpty[index]) {
    return true;
  }
  if (disabled[(index + 1) % 2]) {
    return true;
  }
  return false;
}
function RangerPicker() {
  return defineComponent({
    name: 'RangerPicker',
    inheritAttrs: false,
    props: ['prefixCls', 'id', 'popupStyle', 'dropdownClassName', 'transitionName', 'dropdownAlign', 'getPopupContainer', 'generateConfig', 'locale', 'placeholder', 'autofocus', 'disabled', 'format', 'picker', 'showTime', 'showNow', 'showHour', 'showMinute', 'showSecond', 'use12Hours', 'separator', 'value', 'defaultValue', 'defaultPickerValue', 'open', 'defaultOpen', 'disabledDate', 'disabledTime', 'dateRender', 'panelRender', 'ranges', 'allowEmpty', 'allowClear', 'suffixIcon', 'clearIcon', 'pickerRef', 'inputReadOnly', 'mode', 'renderExtraFooter', 'onChange', 'onOpenChange', 'onPanelChange', 'onCalendarChange', 'onFocus', 'onBlur', 'onMousedown', 'onMouseup', 'onMouseenter', 'onMouseleave', 'onClick', 'onOk', 'onKeydown', 'components', 'order', 'direction', 'activePickerIndex', 'autocomplete', 'minuteStep', 'hourStep', 'secondStep', 'hideDisabledOptions', 'disabledMinutes', 'presets', 'prevIcon', 'nextIcon', 'superPrevIcon', 'superNextIcon'],
    setup(props, _ref) {
      let {
        attrs,
        expose
      } = _ref;
      const needConfirmButton = computed(() => props.picker === 'date' && !!props.showTime || props.picker === 'time');
      const presets = computed(() => props.presets);
      const ranges = computed(() => props.ranges);
      const presetList = usePresets(presets, ranges);
      // We record oqqpened status here in case repeat open with picker
      const openRecordsRef = ref({});
      const containerRef = ref(null);
      const panelDivRef = ref(null);
      const startInputDivRef = ref(null);
      const endInputDivRef = ref(null);
      const separatorRef = ref(null);
      const startInputRef = ref(null);
      const endInputRef = ref(null);
      const arrowRef = ref(null);
      // ============================= Misc ==============================
      const formatList = computed(() => toArray$1(getDefaultFormat(props.format, props.picker, props.showTime, props.use12Hours)));
      // Active picker
      const [mergedActivePickerIndex, setMergedActivePickerIndex] = useMergedState(0, {
        value: toRef(props, 'activePickerIndex')
      });
      // Operation ref
      const operationRef = ref(null);
      const mergedDisabled = computed(() => {
        const {
          disabled
        } = props;
        if (Array.isArray(disabled)) {
          return disabled;
        }
        return [disabled || false, disabled || false];
      });
      // ============================= Value =============================
      const [mergedValue, setInnerValue] = useMergedState(null, {
        value: toRef(props, 'value'),
        defaultValue: props.defaultValue,
        postState: values => props.picker === 'time' && !props.order ? values : reorderValues(values, props.generateConfig)
      });
      // =========================== View Date ===========================
      // Config view panel
      const [startViewDate, endViewDate, setViewDate] = useRangeViewDates({
        values: mergedValue,
        picker: toRef(props, 'picker'),
        defaultDates: props.defaultPickerValue,
        generateConfig: toRef(props, 'generateConfig')
      });
      // ========================= Select Values =========================
      const [selectedValue, setSelectedValue] = useMergedState(mergedValue.value, {
        postState: values => {
          let postValues = values;
          if (mergedDisabled.value[0] && mergedDisabled.value[1]) {
            return postValues;
          }
          // Fill disabled unit
          for (let i = 0; i < 2; i += 1) {
            if (mergedDisabled.value[i] && !getValue(postValues, i) && !getValue(props.allowEmpty, i)) {
              postValues = updateValues(postValues, props.generateConfig.getNow(), i);
            }
          }
          return postValues;
        }
      });
      // ============================= Modes =============================
      const [mergedModes, setInnerModes] = useMergedState([props.picker, props.picker], {
        value: toRef(props, 'mode')
      });
      watch(() => props.picker, () => {
        setInnerModes([props.picker, props.picker]);
      });
      const triggerModesChange = (modes, values) => {
        var _a;
        setInnerModes(modes);
        (_a = props.onPanelChange) === null || _a === void 0 ? void 0 : _a.call(props, values, modes);
      };
      // ========================= Disable Date ==========================
      const [disabledStartDate, disabledEndDate] = useRangeDisabled({
        picker: toRef(props, 'picker'),
        selectedValue,
        locale: toRef(props, 'locale'),
        disabled: mergedDisabled,
        disabledDate: toRef(props, 'disabledDate'),
        generateConfig: toRef(props, 'generateConfig')
      }, openRecordsRef);
      // ============================= Open ==============================
      const [mergedOpen, triggerInnerOpen] = useMergedState(false, {
        value: toRef(props, 'open'),
        defaultValue: props.defaultOpen,
        postState: postOpen => mergedDisabled.value[mergedActivePickerIndex.value] ? false : postOpen,
        onChange: newOpen => {
          var _a;
          (_a = props.onOpenChange) === null || _a === void 0 ? void 0 : _a.call(props, newOpen);
          if (!newOpen && operationRef.value && operationRef.value.onClose) {
            operationRef.value.onClose();
          }
        }
      });
      const startOpen = computed(() => mergedOpen.value && mergedActivePickerIndex.value === 0);
      const endOpen = computed(() => mergedOpen.value && mergedActivePickerIndex.value === 1);
      const panelLeft = ref(0);
      const arrowLeft = ref(0);
      // ============================= Popup =============================
      // Popup min width
      const popupMinWidth = ref(0);
      const {
        width: containerWidth
      } = useElementSize(containerRef);
      watch([mergedOpen, containerWidth], () => {
        if (!mergedOpen.value && containerRef.value) {
          popupMinWidth.value = containerWidth.value;
        }
      });
      const {
        width: panelDivWidth
      } = useElementSize(panelDivRef);
      const {
        width: arrowWidth
      } = useElementSize(arrowRef);
      const {
        width: startInputDivWidth
      } = useElementSize(startInputDivRef);
      const {
        width: separatorWidth
      } = useElementSize(separatorRef);
      watch([mergedActivePickerIndex, mergedOpen, panelDivWidth, arrowWidth, startInputDivWidth, separatorWidth, () => props.direction], () => {
        arrowLeft.value = 0;
        if (mergedActivePickerIndex.value) {
          if (startInputDivRef.value && separatorRef.value) {
            arrowLeft.value = startInputDivWidth.value + separatorWidth.value;
            if (panelDivWidth.value && arrowWidth.value && arrowLeft.value > panelDivWidth.value - arrowWidth.value - (props.direction === 'rtl' || arrowRef.value.offsetLeft > arrowLeft.value ? 0 : arrowRef.value.offsetLeft)) {
              panelLeft.value = arrowLeft.value;
            }
          }
        } else if (mergedActivePickerIndex.value === 0) {
          panelLeft.value = 0;
        }
      }, {
        immediate: true
      });
      // ============================ Trigger ============================
      const triggerRef = ref();
      function triggerOpen(newOpen, index) {
        if (newOpen) {
          clearTimeout(triggerRef.value);
          openRecordsRef.value[index] = true;
          setMergedActivePickerIndex(index);
          triggerInnerOpen(newOpen);
          // Open to reset view date
          if (!mergedOpen.value) {
            setViewDate(null, index);
          }
        } else if (mergedActivePickerIndex.value === index) {
          triggerInnerOpen(newOpen);
          // Clean up async
          // This makes ref not quick refresh in case user open another input with blur trigger
          const openRecords = openRecordsRef.value;
          triggerRef.value = setTimeout(() => {
            if (openRecords === openRecordsRef.value) {
              openRecordsRef.value = {};
            }
          });
        }
      }
      function triggerOpenAndFocus(index) {
        triggerOpen(true, index);
        // Use setTimeout to make sure panel DOM exists
        setTimeout(() => {
          const inputRef = [startInputRef, endInputRef][index];
          if (inputRef.value) {
            inputRef.value.focus();
          }
        }, 0);
      }
      function triggerChange(newValue, sourceIndex) {
        let values = newValue;
        let startValue = getValue(values, 0);
        let endValue = getValue(values, 1);
        const {
          generateConfig,
          locale,
          picker,
          order,
          onCalendarChange,
          allowEmpty,
          onChange,
          showTime
        } = props;
        // >>>>> Format start & end values
        if (startValue && endValue && generateConfig.isAfter(startValue, endValue)) {
          if (
          // WeekPicker only compare week
          picker === 'week' && !isSameWeek(generateConfig, locale.locale, startValue, endValue) ||
          // QuotaPicker only compare week
          picker === 'quarter' && !isSameQuarter(generateConfig, startValue, endValue) ||
          // Other non-TimePicker compare date
          picker !== 'week' && picker !== 'quarter' && picker !== 'time' && !(showTime ? isEqual(generateConfig, startValue, endValue) : isSameDate(generateConfig, startValue, endValue))) {
            // Clean up end date when start date is after end date
            if (sourceIndex === 0) {
              values = [startValue, null];
              endValue = null;
            } else {
              startValue = null;
              values = [null, endValue];
            }
            // Clean up cache since invalidate
            openRecordsRef.value = {
              [sourceIndex]: true
            };
          } else if (picker !== 'time' || order !== false) {
            // Reorder when in same date
            values = reorderValues(values, generateConfig);
          }
        }
        setSelectedValue(values);
        const startStr = values && values[0] ? formatValue(values[0], {
          generateConfig,
          locale,
          format: formatList.value[0]
        }) : '';
        const endStr = values && values[1] ? formatValue(values[1], {
          generateConfig,
          locale,
          format: formatList.value[0]
        }) : '';
        if (onCalendarChange) {
          const info = {
            range: sourceIndex === 0 ? 'start' : 'end'
          };
          onCalendarChange(values, [startStr, endStr], info);
        }
        // >>>>> Trigger `onChange` event
        const canStartValueTrigger = canValueTrigger(startValue, 0, mergedDisabled.value, allowEmpty);
        const canEndValueTrigger = canValueTrigger(endValue, 1, mergedDisabled.value, allowEmpty);
        const canTrigger = values === null || canStartValueTrigger && canEndValueTrigger;
        if (canTrigger) {
          // Trigger onChange only when value is validate
          setInnerValue(values);
          if (onChange && (!isEqual(generateConfig, getValue(mergedValue.value, 0), startValue) || !isEqual(generateConfig, getValue(mergedValue.value, 1), endValue))) {
            onChange(values, [startStr, endStr]);
          }
        }
        // >>>>> Open picker when
        // Always open another picker if possible
        let nextOpenIndex = null;
        if (sourceIndex === 0 && !mergedDisabled.value[1]) {
          nextOpenIndex = 1;
        } else if (sourceIndex === 1 && !mergedDisabled.value[0]) {
          nextOpenIndex = 0;
        }
        if (nextOpenIndex !== null && nextOpenIndex !== mergedActivePickerIndex.value && (!openRecordsRef.value[nextOpenIndex] || !getValue(values, nextOpenIndex)) && getValue(values, sourceIndex)) {
          // Delay to focus to avoid input blur trigger expired selectedValues
          triggerOpenAndFocus(nextOpenIndex);
        } else {
          triggerOpen(false, sourceIndex);
        }
      }
      const forwardKeydown = e => {
        if (mergedOpen && operationRef.value && operationRef.value.onKeydown) {
          // Let popup panel handle keyboard
          return operationRef.value.onKeydown(e);
        }
        /* istanbul ignore next */
        /* eslint-disable no-lone-blocks */
        {
          return false;
        }
      };
      // ============================= Text ==============================
      const sharedTextHooksProps = {
        formatList,
        generateConfig: toRef(props, 'generateConfig'),
        locale: toRef(props, 'locale')
      };
      const [startValueTexts, firstStartValueText] = useValueTexts(computed(() => getValue(selectedValue.value, 0)), sharedTextHooksProps);
      const [endValueTexts, firstEndValueText] = useValueTexts(computed(() => getValue(selectedValue.value, 1)), sharedTextHooksProps);
      const onTextChange = (newText, index) => {
        const inputDate = parseValue(newText, {
          locale: props.locale,
          formatList: formatList.value,
          generateConfig: props.generateConfig
        });
        const disabledFunc = index === 0 ? disabledStartDate : disabledEndDate;
        if (inputDate && !disabledFunc(inputDate)) {
          setSelectedValue(updateValues(selectedValue.value, inputDate, index));
          setViewDate(inputDate, index);
        }
      };
      const [startText, triggerStartTextChange, resetStartText] = useTextValueMapping({
        valueTexts: startValueTexts,
        onTextChange: newText => onTextChange(newText, 0)
      });
      const [endText, triggerEndTextChange, resetEndText] = useTextValueMapping({
        valueTexts: endValueTexts,
        onTextChange: newText => onTextChange(newText, 1)
      });
      const [rangeHoverValue, setRangeHoverValue] = useState(null);
      // ========================== Hover Range ==========================
      const [hoverRangedValue, setHoverRangedValue] = useState(null);
      const [startHoverValue, onStartEnter, onStartLeave] = useHoverValue(startText, sharedTextHooksProps);
      const [endHoverValue, onEndEnter, onEndLeave] = useHoverValue(endText, sharedTextHooksProps);
      const onDateMouseenter = date => {
        setHoverRangedValue(updateValues(selectedValue.value, date, mergedActivePickerIndex.value));
        if (mergedActivePickerIndex.value === 0) {
          onStartEnter(date);
        } else {
          onEndEnter(date);
        }
      };
      const onDateMouseleave = () => {
        setHoverRangedValue(updateValues(selectedValue.value, null, mergedActivePickerIndex.value));
        if (mergedActivePickerIndex.value === 0) {
          onStartLeave();
        } else {
          onEndLeave();
        }
      };
      // ============================= Input =============================
      const getSharedInputHookProps = (index, resetText) => ({
        forwardKeydown,
        onBlur: e => {
          var _a;
          (_a = props.onBlur) === null || _a === void 0 ? void 0 : _a.call(props, e);
        },
        isClickOutside: target => !elementsContains([panelDivRef.value, startInputDivRef.value, endInputDivRef.value, containerRef.value], target),
        onFocus: e => {
          var _a;
          setMergedActivePickerIndex(index);
          (_a = props.onFocus) === null || _a === void 0 ? void 0 : _a.call(props, e);
        },
        triggerOpen: newOpen => {
          triggerOpen(newOpen, index);
        },
        onSubmit: () => {
          if (
          // When user typing disabledDate with keyboard and enter, this value will be empty
          !selectedValue.value ||
          // Normal disabled check
          props.disabledDate && props.disabledDate(selectedValue.value[index])) {
            return false;
          }
          triggerChange(selectedValue.value, index);
          resetText();
        },
        onCancel: () => {
          triggerOpen(false, index);
          setSelectedValue(mergedValue.value);
          resetText();
        }
      });
      const [startInputProps, {
        focused: startFocused,
        typing: startTyping
      }] = usePickerInput(_extends(_extends({}, getSharedInputHookProps(0, resetStartText)), {
        blurToCancel: needConfirmButton,
        open: startOpen,
        value: startText,
        onKeydown: (e, preventDefault) => {
          var _a;
          (_a = props.onKeydown) === null || _a === void 0 ? void 0 : _a.call(props, e, preventDefault);
        }
      }));
      const [endInputProps, {
        focused: endFocused,
        typing: endTyping
      }] = usePickerInput(_extends(_extends({}, getSharedInputHookProps(1, resetEndText)), {
        blurToCancel: needConfirmButton,
        open: endOpen,
        value: endText,
        onKeydown: (e, preventDefault) => {
          var _a;
          (_a = props.onKeydown) === null || _a === void 0 ? void 0 : _a.call(props, e, preventDefault);
        }
      }));
      // ========================== Click Picker ==========================
      const onPickerClick = e => {
        var _a;
        // When click inside the picker & outside the picker's input elements
        // the panel should still be opened
        (_a = props.onClick) === null || _a === void 0 ? void 0 : _a.call(props, e);
        if (!mergedOpen.value && !startInputRef.value.contains(e.target) && !endInputRef.value.contains(e.target)) {
          if (!mergedDisabled.value[0]) {
            triggerOpenAndFocus(0);
          } else if (!mergedDisabled.value[1]) {
            triggerOpenAndFocus(1);
          }
        }
      };
      const onPickerMousedown = e => {
        var _a;
        // shouldn't affect input elements if picker is active
        (_a = props.onMousedown) === null || _a === void 0 ? void 0 : _a.call(props, e);
        if (mergedOpen.value && (startFocused.value || endFocused.value) && !startInputRef.value.contains(e.target) && !endInputRef.value.contains(e.target)) {
          e.preventDefault();
        }
      };
      // ============================= Sync ==============================
      // Close should sync back with text value
      const startStr = computed(() => {
        var _a;
        return ((_a = mergedValue.value) === null || _a === void 0 ? void 0 : _a[0]) ? formatValue(mergedValue.value[0], {
          locale: props.locale,
          format: 'YYYYMMDDHHmmss',
          generateConfig: props.generateConfig
        }) : '';
      });
      const endStr = computed(() => {
        var _a;
        return ((_a = mergedValue.value) === null || _a === void 0 ? void 0 : _a[1]) ? formatValue(mergedValue.value[1], {
          locale: props.locale,
          format: 'YYYYMMDDHHmmss',
          generateConfig: props.generateConfig
        }) : '';
      });
      watch([mergedOpen, startValueTexts, endValueTexts], () => {
        if (!mergedOpen.value) {
          setSelectedValue(mergedValue.value);
          if (!startValueTexts.value.length || startValueTexts.value[0] === '') {
            triggerStartTextChange('');
          } else if (firstStartValueText.value !== startText.value) {
            resetStartText();
          }
          if (!endValueTexts.value.length || endValueTexts.value[0] === '') {
            triggerEndTextChange('');
          } else if (firstEndValueText.value !== endText.value) {
            resetEndText();
          }
        }
      });
      // Sync innerValue with control mode
      watch([startStr, endStr], () => {
        setSelectedValue(mergedValue.value);
      });
      expose({
        focus: () => {
          if (startInputRef.value) {
            startInputRef.value.focus();
          }
        },
        blur: () => {
          if (startInputRef.value) {
            startInputRef.value.blur();
          }
          if (endInputRef.value) {
            endInputRef.value.blur();
          }
        }
      });
      // ============================= Panel =============================
      const panelHoverRangedValue = computed(() => {
        if (mergedOpen.value && hoverRangedValue.value && hoverRangedValue.value[0] && hoverRangedValue.value[1] && props.generateConfig.isAfter(hoverRangedValue.value[1], hoverRangedValue.value[0])) {
          return hoverRangedValue.value;
        } else {
          return null;
        }
      });
      function renderPanel() {
        let panelPosition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        let panelProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        const {
          generateConfig,
          showTime,
          dateRender,
          direction,
          disabledTime,
          prefixCls,
          locale
        } = props;
        let panelShowTime = showTime;
        if (showTime && typeof showTime === 'object' && showTime.defaultValue) {
          const timeDefaultValues = showTime.defaultValue;
          panelShowTime = _extends(_extends({}, showTime), {
            defaultValue: getValue(timeDefaultValues, mergedActivePickerIndex.value) || undefined
          });
        }
        let panelDateRender = null;
        if (dateRender) {
          panelDateRender = _ref2 => {
            let {
              current: date,
              today
            } = _ref2;
            return dateRender({
              current: date,
              today,
              info: {
                range: mergedActivePickerIndex.value ? 'end' : 'start'
              }
            });
          };
        }
        return createVNode(RangeContextProvider, {
          "value": {
            inRange: true,
            panelPosition,
            rangedValue: rangeHoverValue.value || selectedValue.value,
            hoverRangedValue: panelHoverRangedValue.value
          }
        }, {
          default: () => [createVNode(PickerPanel$1, _objectSpread$3(_objectSpread$3(_objectSpread$3({}, props), panelProps), {}, {
            "dateRender": panelDateRender,
            "showTime": panelShowTime,
            "mode": mergedModes.value[mergedActivePickerIndex.value],
            "generateConfig": generateConfig,
            "style": undefined,
            "direction": direction,
            "disabledDate": mergedActivePickerIndex.value === 0 ? disabledStartDate : disabledEndDate,
            "disabledTime": date => {
              if (disabledTime) {
                return disabledTime(date, mergedActivePickerIndex.value === 0 ? 'start' : 'end');
              }
              return false;
            },
            "class": classNames({
              [`${prefixCls}-panel-focused`]: mergedActivePickerIndex.value === 0 ? !startTyping.value : !endTyping.value
            }),
            "value": getValue(selectedValue.value, mergedActivePickerIndex.value),
            "locale": locale,
            "tabIndex": -1,
            "onPanelChange": (date, newMode) => {
              // clear hover value when panel change
              if (mergedActivePickerIndex.value === 0) {
                onStartLeave(true);
              }
              if (mergedActivePickerIndex.value === 1) {
                onEndLeave(true);
              }
              triggerModesChange(updateValues(mergedModes.value, newMode, mergedActivePickerIndex.value), updateValues(selectedValue.value, date, mergedActivePickerIndex.value));
              let viewDate = date;
              if (panelPosition === 'right' && mergedModes.value[mergedActivePickerIndex.value] === newMode) {
                viewDate = getClosingViewDate(viewDate, newMode, generateConfig, -1);
              }
              setViewDate(viewDate, mergedActivePickerIndex.value);
            },
            "onOk": null,
            "onSelect": undefined,
            "onChange": undefined,
            "defaultValue": mergedActivePickerIndex.value === 0 ? getValue(selectedValue.value, 1) : getValue(selectedValue.value, 0)
          }), null)]
        });
      }
      const onContextSelect = (date, type) => {
        const values = updateValues(selectedValue.value, date, mergedActivePickerIndex.value);
        if (type === 'submit' || type !== 'key' && !needConfirmButton.value) {
          // triggerChange will also update selected values
          triggerChange(values, mergedActivePickerIndex.value);
          // clear hover value style
          if (mergedActivePickerIndex.value === 0) {
            onStartLeave();
          } else {
            onEndLeave();
          }
        } else {
          setSelectedValue(values);
        }
      };
      useProvidePanel({
        operationRef,
        hideHeader: computed(() => props.picker === 'time'),
        onDateMouseenter,
        onDateMouseleave,
        hideRanges: computed(() => true),
        onSelect: onContextSelect,
        open: mergedOpen
      });
      return () => {
        const {
          prefixCls = 'rc-picker',
          id,
          popupStyle,
          dropdownClassName,
          transitionName,
          dropdownAlign,
          getPopupContainer,
          generateConfig,
          locale,
          placeholder,
          autofocus,
          picker = 'date',
          showTime,
          separator = '~',
          disabledDate,
          panelRender,
          allowClear,
          suffixIcon,
          clearIcon,
          inputReadOnly,
          renderExtraFooter,
          onMouseenter,
          onMouseleave,
          onMouseup,
          onOk,
          components,
          direction,
          autocomplete = 'off'
        } = props;
        const arrowPositionStyle = direction === 'rtl' ? {
          right: `${arrowLeft.value}px`
        } : {
          left: `${arrowLeft.value}px`
        };
        function renderPanels() {
          let panels;
          const extraNode = getExtraFooter(prefixCls, mergedModes.value[mergedActivePickerIndex.value], renderExtraFooter);
          const rangesNode = getRanges({
            prefixCls,
            components,
            needConfirmButton: needConfirmButton.value,
            okDisabled: !getValue(selectedValue.value, mergedActivePickerIndex.value) || disabledDate && disabledDate(selectedValue.value[mergedActivePickerIndex.value]),
            locale,
            onOk: () => {
              if (getValue(selectedValue.value, mergedActivePickerIndex.value)) {
                // triggerChangeOld(selectedValue.value);
                triggerChange(selectedValue.value, mergedActivePickerIndex.value);
                if (onOk) {
                  onOk(selectedValue.value);
                }
              }
            }
          });
          if (picker !== 'time' && !showTime) {
            const viewDate = mergedActivePickerIndex.value === 0 ? startViewDate.value : endViewDate.value;
            const nextViewDate = getClosingViewDate(viewDate, picker, generateConfig);
            const currentMode = mergedModes.value[mergedActivePickerIndex.value];
            const showDoublePanel = currentMode === picker;
            const leftPanel = renderPanel(showDoublePanel ? 'left' : false, {
              pickerValue: viewDate,
              onPickerValueChange: newViewDate => {
                setViewDate(newViewDate, mergedActivePickerIndex.value);
              }
            });
            const rightPanel = renderPanel('right', {
              pickerValue: nextViewDate,
              onPickerValueChange: newViewDate => {
                setViewDate(getClosingViewDate(newViewDate, picker, generateConfig, -1), mergedActivePickerIndex.value);
              }
            });
            if (direction === 'rtl') {
              panels = createVNode(Fragment, null, [rightPanel, showDoublePanel && leftPanel]);
            } else {
              panels = createVNode(Fragment, null, [leftPanel, showDoublePanel && rightPanel]);
            }
          } else {
            panels = renderPanel();
          }
          let mergedNodes = createVNode("div", {
            "class": `${prefixCls}-panel-layout`
          }, [createVNode(PresetPanel, {
            "prefixCls": prefixCls,
            "presets": presetList.value,
            "onClick": nextValue => {
              triggerChange(nextValue, null);
              triggerOpen(false, mergedActivePickerIndex.value);
            },
            "onHover": hoverValue => {
              setRangeHoverValue(hoverValue);
            }
          }, null), createVNode("div", null, [createVNode("div", {
            "class": `${prefixCls}-panels`
          }, [panels]), (extraNode || rangesNode) && createVNode("div", {
            "class": `${prefixCls}-footer`
          }, [extraNode, rangesNode])])]);
          if (panelRender) {
            mergedNodes = panelRender(mergedNodes);
          }
          return createVNode("div", {
            "class": `${prefixCls}-panel-container`,
            "style": {
              marginLeft: `${panelLeft.value}px`
            },
            "ref": panelDivRef,
            "onMousedown": e => {
              e.preventDefault();
            }
          }, [mergedNodes]);
        }
        const rangePanel = createVNode("div", {
          "class": classNames(`${prefixCls}-range-wrapper`, `${prefixCls}-${picker}-range-wrapper`),
          "style": {
            minWidth: `${popupMinWidth.value}px`
          }
        }, [createVNode("div", {
          "ref": arrowRef,
          "class": `${prefixCls}-range-arrow`,
          "style": arrowPositionStyle
        }, null), renderPanels()]);
        // ============================= Icons =============================
        let suffixNode;
        if (suffixIcon) {
          suffixNode = createVNode("span", {
            "class": `${prefixCls}-suffix`
          }, [suffixIcon]);
        }
        let clearNode;
        if (allowClear && (getValue(mergedValue.value, 0) && !mergedDisabled.value[0] || getValue(mergedValue.value, 1) && !mergedDisabled.value[1])) {
          clearNode = createVNode("span", {
            "onMousedown": e => {
              e.preventDefault();
              e.stopPropagation();
            },
            "onMouseup": e => {
              e.preventDefault();
              e.stopPropagation();
              let values = mergedValue.value;
              if (!mergedDisabled.value[0]) {
                values = updateValues(values, null, 0);
              }
              if (!mergedDisabled.value[1]) {
                values = updateValues(values, null, 1);
              }
              triggerChange(values, null);
              triggerOpen(false, mergedActivePickerIndex.value);
            },
            "class": `${prefixCls}-clear`
          }, [clearIcon || createVNode("span", {
            "class": `${prefixCls}-clear-btn`
          }, null)]);
        }
        const inputSharedProps = {
          size: getInputSize(picker, formatList.value[0], generateConfig)
        };
        let activeBarLeft = 0;
        let activeBarWidth = 0;
        if (startInputDivRef.value && endInputDivRef.value && separatorRef.value) {
          if (mergedActivePickerIndex.value === 0) {
            activeBarWidth = startInputDivRef.value.offsetWidth;
          } else {
            activeBarLeft = arrowLeft.value;
            activeBarWidth = endInputDivRef.value.offsetWidth;
          }
        }
        const activeBarPositionStyle = direction === 'rtl' ? {
          right: `${activeBarLeft}px`
        } : {
          left: `${activeBarLeft}px`
        };
        // ============================ Return =============================
        return createVNode("div", _objectSpread$3({
          "ref": containerRef,
          "class": classNames(prefixCls, `${prefixCls}-range`, attrs.class, {
            [`${prefixCls}-disabled`]: mergedDisabled.value[0] && mergedDisabled.value[1],
            [`${prefixCls}-focused`]: mergedActivePickerIndex.value === 0 ? startFocused.value : endFocused.value,
            [`${prefixCls}-rtl`]: direction === 'rtl'
          }),
          "style": attrs.style,
          "onClick": onPickerClick,
          "onMouseenter": onMouseenter,
          "onMouseleave": onMouseleave,
          "onMousedown": onPickerMousedown,
          "onMouseup": onMouseup
        }, getDataOrAriaProps(props)), [createVNode("div", {
          "class": classNames(`${prefixCls}-input`, {
            [`${prefixCls}-input-active`]: mergedActivePickerIndex.value === 0,
            [`${prefixCls}-input-placeholder`]: !!startHoverValue.value
          }),
          "ref": startInputDivRef
        }, [createVNode("input", _objectSpread$3(_objectSpread$3(_objectSpread$3({
          "id": id,
          "disabled": mergedDisabled.value[0],
          "readonly": inputReadOnly || typeof formatList.value[0] === 'function' || !startTyping.value,
          "value": startHoverValue.value || startText.value,
          "onInput": e => {
            triggerStartTextChange(e.target.value);
          },
          "autofocus": autofocus,
          "placeholder": getValue(placeholder, 0) || '',
          "ref": startInputRef
        }, startInputProps.value), inputSharedProps), {}, {
          "autocomplete": autocomplete
        }), null)]), createVNode("div", {
          "class": `${prefixCls}-range-separator`,
          "ref": separatorRef
        }, [separator]), createVNode("div", {
          "class": classNames(`${prefixCls}-input`, {
            [`${prefixCls}-input-active`]: mergedActivePickerIndex.value === 1,
            [`${prefixCls}-input-placeholder`]: !!endHoverValue.value
          }),
          "ref": endInputDivRef
        }, [createVNode("input", _objectSpread$3(_objectSpread$3(_objectSpread$3({
          "disabled": mergedDisabled.value[1],
          "readonly": inputReadOnly || typeof formatList.value[0] === 'function' || !endTyping.value,
          "value": endHoverValue.value || endText.value,
          "onInput": e => {
            triggerEndTextChange(e.target.value);
          },
          "placeholder": getValue(placeholder, 1) || '',
          "ref": endInputRef
        }, endInputProps.value), inputSharedProps), {}, {
          "autocomplete": autocomplete
        }), null)]), createVNode("div", {
          "class": `${prefixCls}-active-bar`,
          "style": _extends(_extends({}, activeBarPositionStyle), {
            width: `${activeBarWidth}px`,
            position: 'absolute'
          })
        }, null), suffixNode, clearNode, createVNode(PickerTrigger, {
          "visible": mergedOpen.value,
          "popupStyle": popupStyle,
          "prefixCls": prefixCls,
          "dropdownClassName": dropdownClassName,
          "dropdownAlign": dropdownAlign,
          "getPopupContainer": getPopupContainer,
          "transitionName": transitionName,
          "range": true,
          "direction": direction
        }, {
          default: () => [createVNode("div", {
            "style": {
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            }
          }, null)],
          popupElement: () => rangePanel
        })]);
      };
    }
  });
}
const InterRangerPicker = RangerPicker();

const genPikerPadding = (token, inputHeight, fontSize, paddingHorizontal) => {
  const {
    lineHeight
  } = token;
  const fontHeight = Math.floor(fontSize * lineHeight) + 2;
  const paddingTop = Math.max((inputHeight - fontHeight) / 2, 0);
  const paddingBottom = Math.max(inputHeight - fontHeight - paddingTop, 0);
  return {
    padding: `${paddingTop}px ${paddingHorizontal}px ${paddingBottom}px`
  };
};
const genPickerCellInnerStyle = token => {
  const {
    componentCls,
    pickerCellCls,
    pickerCellInnerCls,
    pickerPanelCellHeight,
    motionDurationSlow,
    borderRadiusSM,
    motionDurationMid,
    controlItemBgHover,
    lineWidth,
    lineType,
    colorPrimary,
    controlItemBgActive,
    colorTextLightSolid,
    controlHeightSM,
    pickerDateHoverRangeBorderColor,
    pickerCellBorderGap,
    pickerBasicCellHoverWithRangeColor,
    pickerPanelCellWidth,
    colorTextDisabled,
    colorBgContainerDisabled
  } = token;
  return {
    '&::before': {
      position: 'absolute',
      top: '50%',
      insetInlineStart: 0,
      insetInlineEnd: 0,
      zIndex: 1,
      height: pickerPanelCellHeight,
      transform: 'translateY(-50%)',
      transition: `all ${motionDurationSlow}`,
      content: '""'
    },
    // >>> Default
    [pickerCellInnerCls]: {
      position: 'relative',
      zIndex: 2,
      display: 'inline-block',
      minWidth: pickerPanelCellHeight,
      height: pickerPanelCellHeight,
      lineHeight: `${pickerPanelCellHeight}px`,
      borderRadius: borderRadiusSM,
      transition: `background ${motionDurationMid}, border ${motionDurationMid}`
    },
    // >>> Hover
    [`&:hover:not(${pickerCellCls}-in-view),
    &:hover:not(${pickerCellCls}-selected):not(${pickerCellCls}-range-start):not(${pickerCellCls}-range-end):not(${pickerCellCls}-range-hover-start):not(${pickerCellCls}-range-hover-end)`]: {
      [pickerCellInnerCls]: {
        background: controlItemBgHover
      }
    },
    // >>> Today
    [`&-in-view${pickerCellCls}-today ${pickerCellInnerCls}`]: {
      '&::before': {
        position: 'absolute',
        top: 0,
        insetInlineEnd: 0,
        bottom: 0,
        insetInlineStart: 0,
        zIndex: 1,
        border: `${lineWidth}px ${lineType} ${colorPrimary}`,
        borderRadius: borderRadiusSM,
        content: '""'
      }
    },
    // >>> In Range
    [`&-in-view${pickerCellCls}-in-range`]: {
      position: 'relative',
      '&::before': {
        background: controlItemBgActive
      }
    },
    // >>> Selected
    [`&-in-view${pickerCellCls}-selected ${pickerCellInnerCls},
      &-in-view${pickerCellCls}-range-start ${pickerCellInnerCls},
      &-in-view${pickerCellCls}-range-end ${pickerCellInnerCls}`]: {
      color: colorTextLightSolid,
      background: colorPrimary
    },
    [`&-in-view${pickerCellCls}-range-start:not(${pickerCellCls}-range-start-single),
      &-in-view${pickerCellCls}-range-end:not(${pickerCellCls}-range-end-single)`]: {
      '&::before': {
        background: controlItemBgActive
      }
    },
    [`&-in-view${pickerCellCls}-range-start::before`]: {
      insetInlineStart: '50%'
    },
    [`&-in-view${pickerCellCls}-range-end::before`]: {
      insetInlineEnd: '50%'
    },
    // >>> Range Hover
    [`&-in-view${pickerCellCls}-range-hover-start:not(${pickerCellCls}-in-range):not(${pickerCellCls}-range-start):not(${pickerCellCls}-range-end),
      &-in-view${pickerCellCls}-range-hover-end:not(${pickerCellCls}-in-range):not(${pickerCellCls}-range-start):not(${pickerCellCls}-range-end),
      &-in-view${pickerCellCls}-range-hover-start${pickerCellCls}-range-start-single,
      &-in-view${pickerCellCls}-range-hover-start${pickerCellCls}-range-start${pickerCellCls}-range-end${pickerCellCls}-range-end-near-hover,
      &-in-view${pickerCellCls}-range-hover-end${pickerCellCls}-range-start${pickerCellCls}-range-end${pickerCellCls}-range-start-near-hover,
      &-in-view${pickerCellCls}-range-hover-end${pickerCellCls}-range-end-single,
      &-in-view${pickerCellCls}-range-hover:not(${pickerCellCls}-in-range)`]: {
      '&::after': {
        position: 'absolute',
        top: '50%',
        zIndex: 0,
        height: controlHeightSM,
        borderTop: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
        borderBottom: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
        transform: 'translateY(-50%)',
        transition: `all ${motionDurationSlow}`,
        content: '""'
      }
    },
    // Add space for stash
    [`&-range-hover-start::after,
      &-range-hover-end::after,
      &-range-hover::after`]: {
      insetInlineEnd: 0,
      insetInlineStart: pickerCellBorderGap
    },
    // Hover with in range
    [`&-in-view${pickerCellCls}-in-range${pickerCellCls}-range-hover::before,
      &-in-view${pickerCellCls}-range-start${pickerCellCls}-range-hover::before,
      &-in-view${pickerCellCls}-range-end${pickerCellCls}-range-hover::before,
      &-in-view${pickerCellCls}-range-start:not(${pickerCellCls}-range-start-single)${pickerCellCls}-range-hover-start::before,
      &-in-view${pickerCellCls}-range-end:not(${pickerCellCls}-range-end-single)${pickerCellCls}-range-hover-end::before,
      ${componentCls}-panel
      > :not(${componentCls}-date-panel)
      &-in-view${pickerCellCls}-in-range${pickerCellCls}-range-hover-start::before,
      ${componentCls}-panel
      > :not(${componentCls}-date-panel)
      &-in-view${pickerCellCls}-in-range${pickerCellCls}-range-hover-end::before`]: {
      background: pickerBasicCellHoverWithRangeColor
    },
    // range start border-radius
    [`&-in-view${pickerCellCls}-range-start:not(${pickerCellCls}-range-start-single):not(${pickerCellCls}-range-end) ${pickerCellInnerCls}`]: {
      borderStartStartRadius: borderRadiusSM,
      borderEndStartRadius: borderRadiusSM,
      borderStartEndRadius: 0,
      borderEndEndRadius: 0
    },
    // range end border-radius
    [`&-in-view${pickerCellCls}-range-end:not(${pickerCellCls}-range-end-single):not(${pickerCellCls}-range-start) ${pickerCellInnerCls}`]: {
      borderStartStartRadius: 0,
      borderEndStartRadius: 0,
      borderStartEndRadius: borderRadiusSM,
      borderEndEndRadius: borderRadiusSM
    },
    [`&-range-hover${pickerCellCls}-range-end::after`]: {
      insetInlineStart: '50%'
    },
    // Edge start
    [`tr > &-in-view${pickerCellCls}-range-hover:first-child::after,
      tr > &-in-view${pickerCellCls}-range-hover-end:first-child::after,
      &-in-view${pickerCellCls}-start${pickerCellCls}-range-hover-edge-start${pickerCellCls}-range-hover-edge-start-near-range::after,
      &-in-view${pickerCellCls}-range-hover-edge-start:not(${pickerCellCls}-range-hover-edge-start-near-range)::after,
      &-in-view${pickerCellCls}-range-hover-start::after`]: {
      insetInlineStart: (pickerPanelCellWidth - pickerPanelCellHeight) / 2,
      borderInlineStart: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
      borderStartStartRadius: lineWidth,
      borderEndStartRadius: lineWidth
    },
    // Edge end
    [`tr > &-in-view${pickerCellCls}-range-hover:last-child::after,
      tr > &-in-view${pickerCellCls}-range-hover-start:last-child::after,
      &-in-view${pickerCellCls}-end${pickerCellCls}-range-hover-edge-end${pickerCellCls}-range-hover-edge-end-near-range::after,
      &-in-view${pickerCellCls}-range-hover-edge-end:not(${pickerCellCls}-range-hover-edge-end-near-range)::after,
      &-in-view${pickerCellCls}-range-hover-end::after`]: {
      insetInlineEnd: (pickerPanelCellWidth - pickerPanelCellHeight) / 2,
      borderInlineEnd: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
      borderStartEndRadius: lineWidth,
      borderEndEndRadius: lineWidth
    },
    // >>> Disabled
    '&-disabled': {
      color: colorTextDisabled,
      pointerEvents: 'none',
      [pickerCellInnerCls]: {
        background: 'transparent'
      },
      '&::before': {
        background: colorBgContainerDisabled
      }
    },
    [`&-disabled${pickerCellCls}-today ${pickerCellInnerCls}::before`]: {
      borderColor: colorTextDisabled
    }
  };
};
const genPanelStyle = token => {
  const {
    componentCls,
    pickerCellInnerCls,
    pickerYearMonthCellWidth,
    pickerControlIconSize,
    pickerPanelCellWidth,
    paddingSM,
    paddingXS,
    paddingXXS,
    colorBgContainer,
    lineWidth,
    lineType,
    borderRadiusLG,
    colorPrimary,
    colorTextHeading,
    colorSplit,
    pickerControlIconBorderWidth,
    colorIcon,
    pickerTextHeight,
    motionDurationMid,
    colorIconHover,
    fontWeightStrong,
    pickerPanelCellHeight,
    pickerCellPaddingVertical,
    colorTextDisabled,
    colorText,
    fontSize,
    pickerBasicCellHoverWithRangeColor,
    motionDurationSlow,
    pickerPanelWithoutTimeCellHeight,
    pickerQuarterPanelContentHeight,
    colorLink,
    colorLinkActive,
    colorLinkHover,
    pickerDateHoverRangeBorderColor,
    borderRadiusSM,
    colorTextLightSolid,
    borderRadius,
    controlItemBgHover,
    pickerTimePanelColumnHeight,
    pickerTimePanelColumnWidth,
    pickerTimePanelCellHeight,
    controlItemBgActive,
    marginXXS
  } = token;
  const pickerPanelWidth = pickerPanelCellWidth * 7 + paddingSM * 2 + 4;
  const hoverCellFixedDistance = (pickerPanelWidth - paddingXS * 2) / 3 - pickerYearMonthCellWidth - paddingSM;
  return {
    [componentCls]: {
      '&-panel': {
        display: 'inline-flex',
        flexDirection: 'column',
        textAlign: 'center',
        background: colorBgContainer,
        border: `${lineWidth}px ${lineType} ${colorSplit}`,
        borderRadius: borderRadiusLG,
        outline: 'none',
        '&-focused': {
          borderColor: colorPrimary
        },
        '&-rtl': {
          direction: 'rtl',
          [`${componentCls}-prev-icon,
              ${componentCls}-super-prev-icon`]: {
            transform: 'rotate(45deg)'
          },
          [`${componentCls}-next-icon,
              ${componentCls}-super-next-icon`]: {
            transform: 'rotate(-135deg)'
          }
        }
      },
      // ========================================================
      // =                     Shared Panel                     =
      // ========================================================
      [`&-decade-panel,
        &-year-panel,
        &-quarter-panel,
        &-month-panel,
        &-week-panel,
        &-date-panel,
        &-time-panel`]: {
        display: 'flex',
        flexDirection: 'column',
        width: pickerPanelWidth
      },
      // ======================= Header =======================
      '&-header': {
        display: 'flex',
        padding: `0 ${paddingXS}px`,
        color: colorTextHeading,
        borderBottom: `${lineWidth}px ${lineType} ${colorSplit}`,
        '> *': {
          flex: 'none'
        },
        button: {
          padding: 0,
          color: colorIcon,
          lineHeight: `${pickerTextHeight}px`,
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          transition: `color ${motionDurationMid}`
        },
        '> button': {
          minWidth: '1.6em',
          fontSize,
          '&:hover': {
            color: colorIconHover
          }
        },
        '&-view': {
          flex: 'auto',
          fontWeight: fontWeightStrong,
          lineHeight: `${pickerTextHeight}px`,
          button: {
            color: 'inherit',
            fontWeight: 'inherit',
            verticalAlign: 'top',
            '&:not(:first-child)': {
              marginInlineStart: paddingXS
            },
            '&:hover': {
              color: colorPrimary
            }
          }
        }
      },
      // Arrow button
      [`&-prev-icon,
        &-next-icon,
        &-super-prev-icon,
        &-super-next-icon`]: {
        position: 'relative',
        display: 'inline-block',
        width: pickerControlIconSize,
        height: pickerControlIconSize,
        '&::before': {
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          display: 'inline-block',
          width: pickerControlIconSize,
          height: pickerControlIconSize,
          border: `0 solid currentcolor`,
          borderBlockStartWidth: pickerControlIconBorderWidth,
          borderBlockEndWidth: 0,
          borderInlineStartWidth: pickerControlIconBorderWidth,
          borderInlineEndWidth: 0,
          content: '""'
        }
      },
      [`&-super-prev-icon,
        &-super-next-icon`]: {
        '&::after': {
          position: 'absolute',
          top: Math.ceil(pickerControlIconSize / 2),
          insetInlineStart: Math.ceil(pickerControlIconSize / 2),
          display: 'inline-block',
          width: pickerControlIconSize,
          height: pickerControlIconSize,
          border: '0 solid currentcolor',
          borderBlockStartWidth: pickerControlIconBorderWidth,
          borderBlockEndWidth: 0,
          borderInlineStartWidth: pickerControlIconBorderWidth,
          borderInlineEndWidth: 0,
          content: '""'
        }
      },
      [`&-prev-icon,
        &-super-prev-icon`]: {
        transform: 'rotate(-45deg)'
      },
      [`&-next-icon,
        &-super-next-icon`]: {
        transform: 'rotate(135deg)'
      },
      // ======================== Body ========================
      '&-content': {
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        'th, td': {
          position: 'relative',
          minWidth: pickerPanelCellHeight,
          fontWeight: 'normal'
        },
        th: {
          height: pickerPanelCellHeight + pickerCellPaddingVertical * 2,
          color: colorText,
          verticalAlign: 'middle'
        }
      },
      '&-cell': _extends({
        padding: `${pickerCellPaddingVertical}px 0`,
        color: colorTextDisabled,
        cursor: 'pointer',
        // In view
        '&-in-view': {
          color: colorText
        }
      }, genPickerCellInnerStyle(token)),
      // DatePanel only
      [`&-date-panel ${componentCls}-cell-in-view${componentCls}-cell-in-range${componentCls}-cell-range-hover-start ${pickerCellInnerCls},
        &-date-panel ${componentCls}-cell-in-view${componentCls}-cell-in-range${componentCls}-cell-range-hover-end ${pickerCellInnerCls}`]: {
        '&::after': {
          position: 'absolute',
          top: 0,
          bottom: 0,
          zIndex: -1,
          background: pickerBasicCellHoverWithRangeColor,
          transition: `all ${motionDurationSlow}`,
          content: '""'
        }
      },
      [`&-date-panel
        ${componentCls}-cell-in-view${componentCls}-cell-in-range${componentCls}-cell-range-hover-start
        ${pickerCellInnerCls}::after`]: {
        insetInlineEnd: -(pickerPanelCellWidth - pickerPanelCellHeight) / 2,
        insetInlineStart: 0
      },
      [`&-date-panel ${componentCls}-cell-in-view${componentCls}-cell-in-range${componentCls}-cell-range-hover-end ${pickerCellInnerCls}::after`]: {
        insetInlineEnd: 0,
        insetInlineStart: -(pickerPanelCellWidth - pickerPanelCellHeight) / 2
      },
      // Hover with range start & end
      [`&-range-hover${componentCls}-range-start::after`]: {
        insetInlineEnd: '50%'
      },
      [`&-decade-panel,
        &-year-panel,
        &-quarter-panel,
        &-month-panel`]: {
        [`${componentCls}-content`]: {
          height: pickerPanelWithoutTimeCellHeight * 4
        },
        [pickerCellInnerCls]: {
          padding: `0 ${paddingXS}px`
        }
      },
      '&-quarter-panel': {
        [`${componentCls}-content`]: {
          height: pickerQuarterPanelContentHeight
        }
      },
      // ======================== Footer ========================
      [`&-panel ${componentCls}-footer`]: {
        borderTop: `${lineWidth}px ${lineType} ${colorSplit}`
      },
      '&-footer': {
        width: 'min-content',
        minWidth: '100%',
        lineHeight: `${pickerTextHeight - 2 * lineWidth}px`,
        textAlign: 'center',
        '&-extra': {
          padding: `0 ${paddingSM}`,
          lineHeight: `${pickerTextHeight - 2 * lineWidth}px`,
          textAlign: 'start',
          '&:not(:last-child)': {
            borderBottom: `${lineWidth}px ${lineType} ${colorSplit}`
          }
        }
      },
      '&-now': {
        textAlign: 'start'
      },
      '&-today-btn': {
        color: colorLink,
        '&:hover': {
          color: colorLinkHover
        },
        '&:active': {
          color: colorLinkActive
        },
        [`&${componentCls}-today-btn-disabled`]: {
          color: colorTextDisabled,
          cursor: 'not-allowed'
        }
      },
      // ========================================================
      // =                       Special                        =
      // ========================================================
      // ===================== Decade Panel =====================
      '&-decade-panel': {
        [pickerCellInnerCls]: {
          padding: `0 ${paddingXS / 2}px`
        },
        [`${componentCls}-cell::before`]: {
          display: 'none'
        }
      },
      // ============= Year & Quarter & Month Panel =============
      [`&-year-panel,
        &-quarter-panel,
        &-month-panel`]: {
        [`${componentCls}-body`]: {
          padding: `0 ${paddingXS}px`
        },
        [pickerCellInnerCls]: {
          width: pickerYearMonthCellWidth
        },
        [`${componentCls}-cell-range-hover-start::after`]: {
          insetInlineStart: hoverCellFixedDistance,
          borderInlineStart: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
          borderStartStartRadius: borderRadiusSM,
          borderBottomStartRadius: borderRadiusSM,
          borderStartEndRadius: 0,
          borderBottomEndRadius: 0,
          [`${componentCls}-panel-rtl &`]: {
            insetInlineEnd: hoverCellFixedDistance,
            borderInlineEnd: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
            borderStartStartRadius: 0,
            borderBottomStartRadius: 0,
            borderStartEndRadius: borderRadiusSM,
            borderBottomEndRadius: borderRadiusSM
          }
        },
        [`${componentCls}-cell-range-hover-end::after`]: {
          insetInlineEnd: hoverCellFixedDistance,
          borderInlineEnd: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
          borderStartStartRadius: 0,
          borderEndStartRadius: 0,
          borderStartEndRadius: borderRadius,
          borderEndEndRadius: borderRadius,
          [`${componentCls}-panel-rtl &`]: {
            insetInlineStart: hoverCellFixedDistance,
            borderInlineStart: `${lineWidth}px dashed ${pickerDateHoverRangeBorderColor}`,
            borderStartStartRadius: borderRadius,
            borderEndStartRadius: borderRadius,
            borderStartEndRadius: 0,
            borderEndEndRadius: 0
          }
        }
      },
      // ====================== Week Panel ======================
      '&-week-panel': {
        [`${componentCls}-body`]: {
          padding: `${paddingXS}px ${paddingSM}px`
        },
        // Clear cell style
        [`${componentCls}-cell`]: {
          [`&:hover ${pickerCellInnerCls},
            &-selected ${pickerCellInnerCls},
            ${pickerCellInnerCls}`]: {
            background: 'transparent !important'
          }
        },
        '&-row': {
          td: {
            transition: `background ${motionDurationMid}`,
            '&:first-child': {
              borderStartStartRadius: borderRadiusSM,
              borderEndStartRadius: borderRadiusSM
            },
            '&:last-child': {
              borderStartEndRadius: borderRadiusSM,
              borderEndEndRadius: borderRadiusSM
            }
          },
          '&:hover td': {
            background: controlItemBgHover
          },
          [`&-selected td,
            &-selected:hover td`]: {
            background: colorPrimary,
            [`&${componentCls}-cell-week`]: {
              color: new TinyColor(colorTextLightSolid).setAlpha(0.5).toHexString()
            },
            [`&${componentCls}-cell-today ${pickerCellInnerCls}::before`]: {
              borderColor: colorTextLightSolid
            },
            [pickerCellInnerCls]: {
              color: colorTextLightSolid
            }
          }
        }
      },
      // ====================== Date Panel ======================
      '&-date-panel': {
        [`${componentCls}-body`]: {
          padding: `${paddingXS}px ${paddingSM}px`
        },
        [`${componentCls}-content`]: {
          width: pickerPanelCellWidth * 7,
          th: {
            width: pickerPanelCellWidth
          }
        }
      },
      // ==================== Datetime Panel ====================
      '&-datetime-panel': {
        display: 'flex',
        [`${componentCls}-time-panel`]: {
          borderInlineStart: `${lineWidth}px ${lineType} ${colorSplit}`
        },
        [`${componentCls}-date-panel,
          ${componentCls}-time-panel`]: {
          transition: `opacity ${motionDurationSlow}`
        },
        // Keyboard
        '&-active': {
          [`${componentCls}-date-panel,
            ${componentCls}-time-panel`]: {
            opacity: 0.3,
            '&-active': {
              opacity: 1
            }
          }
        }
      },
      // ====================== Time Panel ======================
      '&-time-panel': {
        width: 'auto',
        minWidth: 'auto',
        direction: 'ltr',
        [`${componentCls}-content`]: {
          display: 'flex',
          flex: 'auto',
          height: pickerTimePanelColumnHeight
        },
        '&-column': {
          flex: '1 0 auto',
          width: pickerTimePanelColumnWidth,
          margin: `${paddingXXS}px 0`,
          padding: 0,
          overflowY: 'hidden',
          textAlign: 'start',
          listStyle: 'none',
          transition: `background ${motionDurationMid}`,
          overflowX: 'hidden',
          '&::after': {
            display: 'block',
            height: pickerTimePanelColumnHeight - pickerTimePanelCellHeight,
            content: '""'
          },
          '&:not(:first-child)': {
            borderInlineStart: `${lineWidth}px ${lineType} ${colorSplit}`
          },
          '&-active': {
            background: new TinyColor(controlItemBgActive).setAlpha(0.2).toHexString()
          },
          '&:hover': {
            overflowY: 'auto'
          },
          '> li': {
            margin: 0,
            padding: 0,
            [`&${componentCls}-time-panel-cell`]: {
              marginInline: marginXXS,
              [`${componentCls}-time-panel-cell-inner`]: {
                display: 'block',
                width: pickerTimePanelColumnWidth - 2 * marginXXS,
                height: pickerTimePanelCellHeight,
                margin: 0,
                paddingBlock: 0,
                paddingInlineEnd: 0,
                paddingInlineStart: (pickerTimePanelColumnWidth - pickerTimePanelCellHeight) / 2,
                color: colorText,
                lineHeight: `${pickerTimePanelCellHeight}px`,
                borderRadius: borderRadiusSM,
                cursor: 'pointer',
                transition: `background ${motionDurationMid}`,
                '&:hover': {
                  background: controlItemBgHover
                }
              },
              '&-selected': {
                [`${componentCls}-time-panel-cell-inner`]: {
                  background: controlItemBgActive
                }
              },
              '&-disabled': {
                [`${componentCls}-time-panel-cell-inner`]: {
                  color: colorTextDisabled,
                  background: 'transparent',
                  cursor: 'not-allowed'
                }
              }
            }
          }
        }
      },
      // https://github.com/ant-design/ant-design/issues/39227
      [`&-datetime-panel ${componentCls}-time-panel-column:after`]: {
        height: pickerTimePanelColumnHeight - pickerTimePanelCellHeight + paddingXXS * 2
      }
    }
  };
};
const genPickerStatusStyle = token => {
  const {
    componentCls,
    colorBgContainer,
    colorError,
    colorErrorOutline,
    colorWarning,
    colorWarningOutline
  } = token;
  return {
    [componentCls]: {
      [`&-status-error${componentCls}`]: {
        '&, &:not([disabled]):hover': {
          backgroundColor: colorBgContainer,
          borderColor: colorError
        },
        '&-focused, &:focus': _extends({}, genActiveStyle(merge(token, {
          inputBorderActiveColor: colorError,
          inputBorderHoverColor: colorError,
          controlOutline: colorErrorOutline
        }))),
        [`${componentCls}-active-bar`]: {
          background: colorError
        }
      },
      [`&-status-warning${componentCls}`]: {
        '&, &:not([disabled]):hover': {
          backgroundColor: colorBgContainer,
          borderColor: colorWarning
        },
        '&-focused, &:focus': _extends({}, genActiveStyle(merge(token, {
          inputBorderActiveColor: colorWarning,
          inputBorderHoverColor: colorWarning,
          controlOutline: colorWarningOutline
        }))),
        [`${componentCls}-active-bar`]: {
          background: colorWarning
        }
      }
    }
  };
};
const genPickerStyle = token => {
  const {
    componentCls,
    antCls,
    boxShadowPopoverArrow,
    controlHeight,
    fontSize,
    inputPaddingHorizontal,
    colorBgContainer,
    lineWidth,
    lineType,
    colorBorder,
    borderRadius,
    motionDurationMid,
    colorBgContainerDisabled,
    colorTextDisabled,
    colorTextPlaceholder,
    controlHeightLG,
    fontSizeLG,
    controlHeightSM,
    inputPaddingHorizontalSM,
    paddingXS,
    marginXS,
    colorTextDescription,
    lineWidthBold,
    lineHeight,
    colorPrimary,
    motionDurationSlow,
    zIndexPopup,
    paddingXXS,
    paddingSM,
    pickerTextHeight,
    controlItemBgActive,
    colorPrimaryBorder,
    sizePopupArrow,
    borderRadiusXS,
    borderRadiusOuter,
    colorBgElevated,
    borderRadiusLG,
    boxShadowSecondary,
    borderRadiusSM,
    colorSplit,
    controlItemBgHover,
    presetsWidth,
    presetsMaxWidth
  } = token;
  return [{
    [componentCls]: _extends(_extends(_extends({}, resetComponent(token)), genPikerPadding(token, controlHeight, fontSize, inputPaddingHorizontal)), {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      background: colorBgContainer,
      lineHeight: 1,
      border: `${lineWidth}px ${lineType} ${colorBorder}`,
      borderRadius,
      transition: `border ${motionDurationMid}, box-shadow ${motionDurationMid}`,
      '&:hover, &-focused': _extends({}, genHoverStyle(token)),
      '&-focused': _extends({}, genActiveStyle(token)),
      [`&${componentCls}-disabled`]: {
        background: colorBgContainerDisabled,
        borderColor: colorBorder,
        cursor: 'not-allowed',
        [`${componentCls}-suffix`]: {
          color: colorTextDisabled
        }
      },
      [`&${componentCls}-borderless`]: {
        backgroundColor: 'transparent !important',
        borderColor: 'transparent !important',
        boxShadow: 'none !important'
      },
      // ======================== Input =========================
      [`${componentCls}-input`]: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        '> input': _extends(_extends({}, genBasicInputStyle(token)), {
          flex: 'auto',
          // Fix Firefox flex not correct:
          // https://github.com/ant-design/ant-design/pull/20023#issuecomment-564389553
          minWidth: 1,
          height: 'auto',
          padding: 0,
          background: 'transparent',
          border: 0,
          '&:focus': {
            boxShadow: 'none'
          },
          '&[disabled]': {
            background: 'transparent'
          }
        }),
        '&:hover': {
          [`${componentCls}-clear`]: {
            opacity: 1
          }
        },
        '&-placeholder': {
          '> input': {
            color: colorTextPlaceholder
          }
        }
      },
      // Size
      '&-large': _extends(_extends({}, genPikerPadding(token, controlHeightLG, fontSizeLG, inputPaddingHorizontal)), {
        [`${componentCls}-input > input`]: {
          fontSize: fontSizeLG
        }
      }),
      '&-small': _extends({}, genPikerPadding(token, controlHeightSM, fontSize, inputPaddingHorizontalSM)),
      [`${componentCls}-suffix`]: {
        display: 'flex',
        flex: 'none',
        alignSelf: 'center',
        marginInlineStart: paddingXS / 2,
        color: colorTextDisabled,
        lineHeight: 1,
        pointerEvents: 'none',
        '> *': {
          verticalAlign: 'top',
          '&:not(:last-child)': {
            marginInlineEnd: marginXS
          }
        }
      },
      [`${componentCls}-clear`]: {
        position: 'absolute',
        top: '50%',
        insetInlineEnd: 0,
        color: colorTextDisabled,
        lineHeight: 1,
        background: colorBgContainer,
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        opacity: 0,
        transition: `opacity ${motionDurationMid}, color ${motionDurationMid}`,
        '> *': {
          verticalAlign: 'top'
        },
        '&:hover': {
          color: colorTextDescription
        }
      },
      [`${componentCls}-separator`]: {
        position: 'relative',
        display: 'inline-block',
        width: '1em',
        height: fontSizeLG,
        color: colorTextDisabled,
        fontSize: fontSizeLG,
        verticalAlign: 'top',
        cursor: 'default',
        [`${componentCls}-focused &`]: {
          color: colorTextDescription
        },
        [`${componentCls}-range-separator &`]: {
          [`${componentCls}-disabled &`]: {
            cursor: 'not-allowed'
          }
        }
      },
      // ======================== Range =========================
      '&-range': {
        position: 'relative',
        display: 'inline-flex',
        // Clear
        [`${componentCls}-clear`]: {
          insetInlineEnd: inputPaddingHorizontal
        },
        '&:hover': {
          [`${componentCls}-clear`]: {
            opacity: 1
          }
        },
        // Active bar
        [`${componentCls}-active-bar`]: {
          bottom: -lineWidth,
          height: lineWidthBold,
          marginInlineStart: inputPaddingHorizontal,
          background: colorPrimary,
          opacity: 0,
          transition: `all ${motionDurationSlow} ease-out`,
          pointerEvents: 'none'
        },
        [`&${componentCls}-focused`]: {
          [`${componentCls}-active-bar`]: {
            opacity: 1
          }
        },
        [`${componentCls}-range-separator`]: {
          alignItems: 'center',
          padding: `0 ${paddingXS}px`,
          lineHeight: 1
        },
        [`&${componentCls}-small`]: {
          [`${componentCls}-clear`]: {
            insetInlineEnd: inputPaddingHorizontalSM
          },
          [`${componentCls}-active-bar`]: {
            marginInlineStart: inputPaddingHorizontalSM
          }
        }
      },
      // ======================= Dropdown =======================
      '&-dropdown': _extends(_extends(_extends({}, resetComponent(token)), genPanelStyle(token)), {
        position: 'absolute',
        // Fix incorrect position of picker popup
        // https://github.com/ant-design/ant-design/issues/35590
        top: -9999,
        left: {
          _skip_check_: true,
          value: -9999
        },
        zIndex: zIndexPopup,
        [`&${componentCls}-dropdown-hidden`]: {
          display: 'none'
        },
        [`&${componentCls}-dropdown-placement-bottomLeft`]: {
          [`${componentCls}-range-arrow`]: {
            top: 0,
            display: 'block',
            transform: 'translateY(-100%)'
          }
        },
        [`&${componentCls}-dropdown-placement-topLeft`]: {
          [`${componentCls}-range-arrow`]: {
            bottom: 0,
            display: 'block',
            transform: 'translateY(100%) rotate(180deg)'
          }
        },
        [`&${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-topLeft,
          &${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-topRight,
          &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-topLeft,
          &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-topRight`]: {
          animationName: slideDownIn
        },
        [`&${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-bottomLeft,
          &${antCls}-slide-up-enter${antCls}-slide-up-enter-active${componentCls}-dropdown-placement-bottomRight,
          &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-bottomLeft,
          &${antCls}-slide-up-appear${antCls}-slide-up-appear-active${componentCls}-dropdown-placement-bottomRight`]: {
          animationName: slideUpIn
        },
        [`&${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-topLeft,
          &${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-topRight`]: {
          animationName: slideDownOut
        },
        [`&${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-bottomLeft,
          &${antCls}-slide-up-leave${antCls}-slide-up-leave-active${componentCls}-dropdown-placement-bottomRight`]: {
          animationName: slideUpOut
        },
        // Time picker with additional style
        [`${componentCls}-panel > ${componentCls}-time-panel`]: {
          paddingTop: paddingXXS
        },
        // ======================== Ranges ========================
        [`${componentCls}-ranges`]: {
          marginBottom: 0,
          padding: `${paddingXXS}px ${paddingSM}px`,
          overflow: 'hidden',
          lineHeight: `${pickerTextHeight - 2 * lineWidth - paddingXS / 2}px`,
          textAlign: 'start',
          listStyle: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          '> li': {
            display: 'inline-block'
          },
          // https://github.com/ant-design/ant-design/issues/23687
          [`${componentCls}-preset > ${antCls}-tag-blue`]: {
            color: colorPrimary,
            background: controlItemBgActive,
            borderColor: colorPrimaryBorder,
            cursor: 'pointer'
          },
          [`${componentCls}-ok`]: {
            marginInlineStart: 'auto'
          }
        },
        [`${componentCls}-range-wrapper`]: {
          display: 'flex',
          position: 'relative'
        },
        [`${componentCls}-range-arrow`]: _extends({
          position: 'absolute',
          zIndex: 1,
          display: 'none',
          marginInlineStart: inputPaddingHorizontal * 1.5,
          transition: `left ${motionDurationSlow} ease-out`
        }, roundedArrow(sizePopupArrow, borderRadiusXS, borderRadiusOuter, colorBgElevated, boxShadowPopoverArrow)),
        [`${componentCls}-panel-container`]: {
          overflow: 'hidden',
          verticalAlign: 'top',
          background: colorBgElevated,
          borderRadius: borderRadiusLG,
          boxShadow: boxShadowSecondary,
          transition: `margin ${motionDurationSlow}`,
          // ======================== Layout ========================
          [`${componentCls}-panel-layout`]: {
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch'
          },
          // ======================== Preset ========================
          [`${componentCls}-presets`]: {
            display: 'flex',
            flexDirection: 'column',
            minWidth: presetsWidth,
            maxWidth: presetsMaxWidth,
            ul: {
              height: 0,
              flex: 'auto',
              listStyle: 'none',
              overflow: 'auto',
              margin: 0,
              padding: paddingXS,
              borderInlineEnd: `${lineWidth}px ${lineType} ${colorSplit}`,
              li: _extends(_extends({}, textEllipsis), {
                borderRadius: borderRadiusSM,
                paddingInline: paddingXS,
                paddingBlock: (controlHeightSM - Math.round(fontSize * lineHeight)) / 2,
                cursor: 'pointer',
                transition: `all ${motionDurationSlow}`,
                '+ li': {
                  marginTop: marginXS
                },
                '&:hover': {
                  background: controlItemBgHover
                }
              })
            }
          },
          // ======================== Panels ========================
          [`${componentCls}-panels`]: {
            display: 'inline-flex',
            flexWrap: 'nowrap',
            direction: 'ltr',
            [`${componentCls}-panel`]: {
              borderWidth: `0 0 ${lineWidth}px`
            },
            '&:last-child': {
              [`${componentCls}-panel`]: {
                borderWidth: 0
              }
            }
          },
          [`${componentCls}-panel`]: {
            verticalAlign: 'top',
            background: 'transparent',
            borderRadius: 0,
            borderWidth: 0,
            [`${componentCls}-content,
            table`]: {
              textAlign: 'center'
            },
            '&-focused': {
              borderColor: colorBorder
            }
          }
        }
      }),
      '&-dropdown-range': {
        padding: `${sizePopupArrow * 2 / 3}px 0`,
        '&-hidden': {
          display: 'none'
        }
      },
      '&-rtl': {
        direction: 'rtl',
        [`${componentCls}-separator`]: {
          transform: 'rotate(180deg)'
        },
        [`${componentCls}-footer`]: {
          '&-extra': {
            direction: 'rtl'
          }
        }
      }
    })
  },
  // Follow code may reuse in other components
  initSlideMotion(token, 'slide-up'), initSlideMotion(token, 'slide-down'), initMoveMotion(token, 'move-up'), initMoveMotion(token, 'move-down')];
};
const initPickerPanelToken = token => {
  const pickerTimePanelCellHeight = 28;
  const {
    componentCls,
    controlHeightLG,
    controlHeightSM,
    colorPrimary,
    paddingXXS
  } = token;
  return {
    pickerCellCls: `${componentCls}-cell`,
    pickerCellInnerCls: `${componentCls}-cell-inner`,
    pickerTextHeight: controlHeightLG,
    pickerPanelCellWidth: controlHeightSM * 1.5,
    pickerPanelCellHeight: controlHeightSM,
    pickerDateHoverRangeBorderColor: new TinyColor(colorPrimary).lighten(20).toHexString(),
    pickerBasicCellHoverWithRangeColor: new TinyColor(colorPrimary).lighten(35).toHexString(),
    pickerPanelWithoutTimeCellHeight: controlHeightLG * 1.65,
    pickerYearMonthCellWidth: controlHeightLG * 1.5,
    pickerTimePanelColumnHeight: pickerTimePanelCellHeight * 8,
    pickerTimePanelColumnWidth: controlHeightLG * 1.4,
    pickerTimePanelCellHeight,
    pickerQuarterPanelContentHeight: controlHeightLG * 1.4,
    pickerCellPaddingVertical: paddingXXS,
    pickerCellBorderGap: 2,
    pickerControlIconSize: 7,
    pickerControlIconBorderWidth: 1.5
  };
};
// ============================== Export ==============================
const useStyle = genComponentStyleHook('DatePicker', token => {
  const pickerToken = merge(initInputToken(token), initPickerPanelToken(token));
  return [genPickerStyle(pickerToken), genPickerStatusStyle(pickerToken),
  // =====================================================
  // ==             Space Compact                       ==
  // =====================================================
  genCompactItemStyle(token, {
    focusElCls: `${token.componentCls}-focused`
  })];
}, token => ({
  presetsWidth: 120,
  presetsMaxWidth: 200,
  zIndexPopup: token.zIndexPopupBase + 50
}));

const PickerButton = (props, _ref) => {
  let {
    attrs,
    slots
  } = _ref;
  return createVNode(Button, _objectSpread$3(_objectSpread$3({
    "size": "small",
    "type": "primary"
  }, props), attrs), slots);
};

function PickerTag(props, _ref) {
  let {
    slots,
    attrs
  } = _ref;
  return createVNode(Tag, _objectSpread$3(_objectSpread$3({
    "color": "blue"
  }, props), attrs), slots);
}

// This icon file is generated automatically.
var CalendarOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z" } }] }, "name": "calendar", "theme": "outlined" };

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CalendarOutlined = function CalendarOutlined(props, context) {
  var p = _objectSpread$2({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$2({}, p, {
    "icon": CalendarOutlined$1
  }), null);
};

CalendarOutlined.displayName = 'CalendarOutlined';
CalendarOutlined.inheritAttrs = false;

// This icon file is generated automatically.
var ClockCircleOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" } }, { "tag": "path", "attrs": { "d": "M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z" } }] }, "name": "clock-circle", "theme": "outlined" };

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ClockCircleOutlined = function ClockCircleOutlined(props, context) {
  var p = _objectSpread$1({}, props, context.attrs);

  return createVNode(Icon, _objectSpread$1({}, p, {
    "icon": ClockCircleOutlined$1
  }), null);
};

ClockCircleOutlined.displayName = 'ClockCircleOutlined';
ClockCircleOutlined.inheritAttrs = false;

function getPlaceholder(locale, picker, customizePlaceholder) {
  if (customizePlaceholder !== undefined) {
    return customizePlaceholder;
  }
  if (picker === 'year' && locale.lang.yearPlaceholder) {
    return locale.lang.yearPlaceholder;
  }
  if (picker === 'quarter' && locale.lang.quarterPlaceholder) {
    return locale.lang.quarterPlaceholder;
  }
  if (picker === 'month' && locale.lang.monthPlaceholder) {
    return locale.lang.monthPlaceholder;
  }
  if (picker === 'week' && locale.lang.weekPlaceholder) {
    return locale.lang.weekPlaceholder;
  }
  if (picker === 'time' && locale.timePickerLocale.placeholder) {
    return locale.timePickerLocale.placeholder;
  }
  return locale.lang.placeholder;
}
function getRangePlaceholder(locale, picker, customizePlaceholder) {
  if (customizePlaceholder !== undefined) {
    return customizePlaceholder;
  }
  if (picker === 'year' && locale.lang.yearPlaceholder) {
    return locale.lang.rangeYearPlaceholder;
  }
  if (picker === 'month' && locale.lang.monthPlaceholder) {
    return locale.lang.rangeMonthPlaceholder;
  }
  if (picker === 'week' && locale.lang.weekPlaceholder) {
    return locale.lang.rangeWeekPlaceholder;
  }
  if (picker === 'time' && locale.timePickerLocale.placeholder) {
    return locale.timePickerLocale.rangePlaceholder;
  }
  return locale.lang.rangePlaceholder;
}
function transPlacement2DropdownAlign(direction, placement) {
  const overflow = {
    adjustX: 1,
    adjustY: 1
  };
  switch (placement) {
    case 'bottomLeft':
      {
        return {
          points: ['tl', 'bl'],
          offset: [0, 4],
          overflow
        };
      }
    case 'bottomRight':
      {
        return {
          points: ['tr', 'br'],
          offset: [0, 4],
          overflow
        };
      }
    case 'topLeft':
      {
        return {
          points: ['bl', 'tl'],
          offset: [0, -4],
          overflow
        };
      }
    case 'topRight':
      {
        return {
          points: ['br', 'tr'],
          offset: [0, -4],
          overflow
        };
      }
    default:
      {
        return {
          points: direction === 'rtl' ? ['tr', 'br'] : ['tl', 'bl'],
          offset: [0, 4],
          overflow
        };
      }
  }
}

function commonProps() {
  return {
    id: String,
    /**
     * @deprecated `dropdownClassName` is deprecated which will be removed in next major
     *   version.Please use `popupClassName` instead.
     */
    dropdownClassName: String,
    popupClassName: String,
    popupStyle: objectType(),
    transitionName: String,
    placeholder: String,
    allowClear: booleanType(),
    autofocus: booleanType(),
    disabled: booleanType(),
    tabindex: Number,
    open: booleanType(),
    defaultOpen: booleanType(),
    /** Make input readOnly to avoid popup keyboard in mobile */
    inputReadOnly: booleanType(),
    format: someType([String, Function, Array]),
    // Value
    // format:  string | CustomFormat<DateType> | (string | CustomFormat<DateType>)[];
    // Render
    // suffixIcon?: VueNode;
    // clearIcon?: VueNode;
    // prevIcon?: VueNode;
    // nextIcon?: VueNode;
    // superPrevIcon?: VueNode;
    // superNextIcon?: VueNode;
    getPopupContainer: functionType(),
    panelRender: functionType(),
    // // Events
    onChange: functionType(),
    'onUpdate:value': functionType(),
    onOk: functionType(),
    onOpenChange: functionType(),
    'onUpdate:open': functionType(),
    onFocus: functionType(),
    onBlur: functionType(),
    onMousedown: functionType(),
    onMouseup: functionType(),
    onMouseenter: functionType(),
    onMouseleave: functionType(),
    onClick: functionType(),
    onContextmenu: functionType(),
    onKeydown: functionType(),
    // WAI-ARIA
    role: String,
    name: String,
    autocomplete: String,
    direction: stringType(),
    showToday: booleanType(),
    showTime: someType([Boolean, Object]),
    locale: objectType(),
    size: stringType(),
    bordered: booleanType(),
    dateRender: functionType(),
    disabledDate: functionType(),
    mode: stringType(),
    picker: stringType(),
    valueFormat: String,
    placement: stringType(),
    status: stringType(),
    /** @deprecated Please use `disabledTime` instead. */
    disabledHours: functionType(),
    /** @deprecated Please use `disabledTime` instead. */
    disabledMinutes: functionType(),
    /** @deprecated Please use `disabledTime` instead. */
    disabledSeconds: functionType()
  };
}
function datePickerProps() {
  return {
    defaultPickerValue: someType([Object, String]),
    defaultValue: someType([Object, String]),
    value: someType([Object, String]),
    presets: arrayType(),
    disabledTime: functionType(),
    renderExtraFooter: functionType(),
    showNow: booleanType(),
    monthCellRender: functionType(),
    // deprecated  Please use `monthCellRender"` instead.',
    monthCellContentRender: functionType()
  };
}
function rangePickerProps() {
  return {
    allowEmpty: arrayType(),
    dateRender: functionType(),
    defaultPickerValue: arrayType(),
    defaultValue: arrayType(),
    value: arrayType(),
    presets: arrayType(),
    disabledTime: functionType(),
    disabled: someType([Boolean, Array]),
    renderExtraFooter: functionType(),
    separator: {
      type: String
    },
    showTime: someType([Boolean, Object]),
    ranges: objectType(),
    placeholder: arrayType(),
    mode: arrayType(),
    onChange: functionType(),
    'onUpdate:value': functionType(),
    onCalendarChange: functionType(),
    onPanelChange: functionType(),
    onOk: functionType()
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
function generateSinglePicker(generateConfig, extraProps) {
  function getPicker(picker, displayName) {
    const comProps = _extends(_extends(_extends({}, commonProps()), datePickerProps()), extraProps);
    return defineComponent({
      compatConfig: {
        MODE: 3
      },
      name: displayName,
      inheritAttrs: false,
      props: comProps,
      slots: Object,
      setup(_props, _ref) {
        let {
          slots,
          expose,
          attrs,
          emit
        } = _ref;
        // 兼容 vue 3.2.7
        const props = _props;
        const formItemContext = useInjectFormItemContext();
        const formItemInputContext = FormItemInputContext.useInject();
        const {
          prefixCls,
          direction,
          getPopupContainer,
          size,
          rootPrefixCls,
          disabled
        } = useConfigInject('picker', props);
        const {
          compactSize,
          compactItemClassnames
        } = useCompactItemContext(prefixCls, direction);
        const mergedSize = computed(() => compactSize.value || size.value);
        // style
        const [wrapSSR, hashId] = useStyle(prefixCls);
        const pickerRef = ref();
        expose({
          focus: () => {
            var _a;
            (_a = pickerRef.value) === null || _a === void 0 ? void 0 : _a.focus();
          },
          blur: () => {
            var _a;
            (_a = pickerRef.value) === null || _a === void 0 ? void 0 : _a.blur();
          }
        });
        const maybeToString = date => {
          return props.valueFormat ? generateConfig.toString(date, props.valueFormat) : date;
        };
        const onChange = (date, dateString) => {
          const value = maybeToString(date);
          emit('update:value', value);
          emit('change', value, dateString);
          formItemContext.onFieldChange();
        };
        const onOpenChange = open => {
          emit('update:open', open);
          emit('openChange', open);
        };
        const onFocus = e => {
          emit('focus', e);
        };
        const onBlur = e => {
          emit('blur', e);
          formItemContext.onFieldBlur();
        };
        const onPanelChange = (date, mode) => {
          const value = maybeToString(date);
          emit('panelChange', value, mode);
        };
        const onOk = date => {
          const value = maybeToString(date);
          emit('ok', value);
        };
        const [contextLocale] = useLocaleReceiver('DatePicker', locale);
        const value = computed(() => {
          if (props.value) {
            return props.valueFormat ? generateConfig.toDate(props.value, props.valueFormat) : props.value;
          }
          return props.value === '' ? undefined : props.value;
        });
        const defaultValue = computed(() => {
          if (props.defaultValue) {
            return props.valueFormat ? generateConfig.toDate(props.defaultValue, props.valueFormat) : props.defaultValue;
          }
          return props.defaultValue === '' ? undefined : props.defaultValue;
        });
        const defaultPickerValue = computed(() => {
          if (props.defaultPickerValue) {
            return props.valueFormat ? generateConfig.toDate(props.defaultPickerValue, props.valueFormat) : props.defaultPickerValue;
          }
          return props.defaultPickerValue === '' ? undefined : props.defaultPickerValue;
        });
        return () => {
          var _a, _b, _c, _d, _e, _f;
          const locale = _extends(_extends({}, contextLocale.value), props.locale);
          const p = _extends(_extends({}, props), attrs);
          const {
              bordered = true,
              placeholder,
              suffixIcon = (_a = slots.suffixIcon) === null || _a === void 0 ? void 0 : _a.call(slots),
              showToday = true,
              transitionName,
              allowClear = true,
              dateRender = slots.dateRender,
              renderExtraFooter = slots.renderExtraFooter,
              monthCellRender = slots.monthCellRender || props.monthCellContentRender || slots.monthCellContentRender,
              clearIcon = (_b = slots.clearIcon) === null || _b === void 0 ? void 0 : _b.call(slots),
              id = formItemContext.id.value
            } = p,
            restProps = __rest$1(p, ["bordered", "placeholder", "suffixIcon", "showToday", "transitionName", "allowClear", "dateRender", "renderExtraFooter", "monthCellRender", "clearIcon", "id"]);
          const showTime = p.showTime === '' ? true : p.showTime;
          const {
            format
          } = p;
          let additionalOverrideProps = {};
          if (picker) {
            additionalOverrideProps.picker = picker;
          }
          const mergedPicker = picker || p.picker || 'date';
          additionalOverrideProps = _extends(_extends(_extends({}, additionalOverrideProps), showTime ? getTimeProps(_extends({
            format,
            picker: mergedPicker
          }, typeof showTime === 'object' ? showTime : {})) : {}), mergedPicker === 'time' ? getTimeProps(_extends(_extends({
            format
          }, restProps), {
            picker: mergedPicker
          })) : {});
          const pre = prefixCls.value;
          const suffixNode = createVNode(Fragment, null, [suffixIcon || (picker === 'time' ? createVNode(ClockCircleOutlined, null, null) : createVNode(CalendarOutlined, null, null)), formItemInputContext.hasFeedback && formItemInputContext.feedbackIcon]);
          return wrapSSR(createVNode(Picker$1, _objectSpread$3(_objectSpread$3(_objectSpread$3({
            "monthCellRender": monthCellRender,
            "dateRender": dateRender,
            "renderExtraFooter": renderExtraFooter,
            "ref": pickerRef,
            "placeholder": getPlaceholder(locale, mergedPicker, placeholder),
            "suffixIcon": suffixNode,
            "dropdownAlign": transPlacement2DropdownAlign(direction.value, props.placement),
            "clearIcon": clearIcon || createVNode(CloseCircleFilled, null, null),
            "allowClear": allowClear,
            "transitionName": transitionName || `${rootPrefixCls.value}-slide-up`
          }, restProps), additionalOverrideProps), {}, {
            "id": id,
            "picker": mergedPicker,
            "value": value.value,
            "defaultValue": defaultValue.value,
            "defaultPickerValue": defaultPickerValue.value,
            "showToday": showToday,
            "locale": locale.lang,
            "class": classNames({
              [`${pre}-${mergedSize.value}`]: mergedSize.value,
              [`${pre}-borderless`]: !bordered
            }, getStatusClassNames(pre, getMergedStatus(formItemInputContext.status, props.status), formItemInputContext.hasFeedback), attrs.class, hashId.value, compactItemClassnames.value),
            "disabled": disabled.value,
            "prefixCls": pre,
            "getPopupContainer": attrs.getCalendarContainer || getPopupContainer.value,
            "generateConfig": generateConfig,
            "prevIcon": ((_c = slots.prevIcon) === null || _c === void 0 ? void 0 : _c.call(slots)) || createVNode("span", {
              "class": `${pre}-prev-icon`
            }, null),
            "nextIcon": ((_d = slots.nextIcon) === null || _d === void 0 ? void 0 : _d.call(slots)) || createVNode("span", {
              "class": `${pre}-next-icon`
            }, null),
            "superPrevIcon": ((_e = slots.superPrevIcon) === null || _e === void 0 ? void 0 : _e.call(slots)) || createVNode("span", {
              "class": `${pre}-super-prev-icon`
            }, null),
            "superNextIcon": ((_f = slots.superNextIcon) === null || _f === void 0 ? void 0 : _f.call(slots)) || createVNode("span", {
              "class": `${pre}-super-next-icon`
            }, null),
            "components": Components,
            "direction": direction.value,
            "dropdownClassName": classNames(hashId.value, props.popupClassName, props.dropdownClassName),
            "onChange": onChange,
            "onOpenChange": onOpenChange,
            "onFocus": onFocus,
            "onBlur": onBlur,
            "onPanelChange": onPanelChange,
            "onOk": onOk
          }), null));
        };
      }
    });
  }
  const DatePicker = getPicker(undefined, 'ADatePicker');
  const WeekPicker = getPicker('week', 'AWeekPicker');
  const MonthPicker = getPicker('month', 'AMonthPicker');
  const YearPicker = getPicker('year', 'AYearPicker');
  const TimePicker = getPicker('time', 'TimePicker'); // 给独立组件 TimePicker 使用，此处名称不用更改
  const QuarterPicker = getPicker('quarter', 'AQuarterPicker');
  return {
    DatePicker,
    WeekPicker,
    MonthPicker,
    YearPicker,
    TimePicker,
    QuarterPicker
  };
}

// This icon file is generated automatically.
var SwapRightOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" } }] }, "name": "swap-right", "theme": "outlined" };

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? Object(arguments[i]) : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SwapRightOutlined = function SwapRightOutlined(props, context) {
  var p = _objectSpread({}, props, context.attrs);

  return createVNode(Icon, _objectSpread({}, p, {
    "icon": SwapRightOutlined$1
  }), null);
};

SwapRightOutlined.displayName = 'SwapRightOutlined';
SwapRightOutlined.inheritAttrs = false;

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function generateRangePicker(generateConfig, extraProps) {
  const RangePicker = defineComponent({
    compatConfig: {
      MODE: 3
    },
    name: 'ARangePicker',
    inheritAttrs: false,
    props: _extends(_extends(_extends({}, commonProps()), rangePickerProps()), extraProps),
    slots: Object,
    setup(_props, _ref) {
      let {
        expose,
        slots,
        attrs,
        emit
      } = _ref;
      const props = _props;
      const formItemContext = useInjectFormItemContext();
      const formItemInputContext = FormItemInputContext.useInject();
      const {
        prefixCls,
        direction,
        getPopupContainer,
        size,
        rootPrefixCls,
        disabled
      } = useConfigInject('picker', props);
      const {
        compactSize,
        compactItemClassnames
      } = useCompactItemContext(prefixCls, direction);
      const mergedSize = computed(() => compactSize.value || size.value);
      // style
      const [wrapSSR, hashId] = useStyle(prefixCls);
      const pickerRef = ref();
      expose({
        focus: () => {
          var _a;
          (_a = pickerRef.value) === null || _a === void 0 ? void 0 : _a.focus();
        },
        blur: () => {
          var _a;
          (_a = pickerRef.value) === null || _a === void 0 ? void 0 : _a.blur();
        }
      });
      const maybeToStrings = dates => {
        return props.valueFormat ? generateConfig.toString(dates, props.valueFormat) : dates;
      };
      const onChange = (dates, dateStrings) => {
        const values = maybeToStrings(dates);
        emit('update:value', values);
        emit('change', values, dateStrings);
        formItemContext.onFieldChange();
      };
      const onOpenChange = open => {
        emit('update:open', open);
        emit('openChange', open);
      };
      const onFocus = e => {
        emit('focus', e);
      };
      const onBlur = e => {
        emit('blur', e);
        formItemContext.onFieldBlur();
      };
      const onPanelChange = (dates, modes) => {
        const values = maybeToStrings(dates);
        emit('panelChange', values, modes);
      };
      const onOk = dates => {
        const value = maybeToStrings(dates);
        emit('ok', value);
      };
      const onCalendarChange = (dates, dateStrings, info) => {
        const values = maybeToStrings(dates);
        emit('calendarChange', values, dateStrings, info);
      };
      const [contextLocale] = useLocaleReceiver('DatePicker', locale);
      const value = computed(() => {
        if (props.value) {
          return props.valueFormat ? generateConfig.toDate(props.value, props.valueFormat) : props.value;
        }
        return props.value;
      });
      const defaultValue = computed(() => {
        if (props.defaultValue) {
          return props.valueFormat ? generateConfig.toDate(props.defaultValue, props.valueFormat) : props.defaultValue;
        }
        return props.defaultValue;
      });
      const defaultPickerValue = computed(() => {
        if (props.defaultPickerValue) {
          return props.valueFormat ? generateConfig.toDate(props.defaultPickerValue, props.valueFormat) : props.defaultPickerValue;
        }
        return props.defaultPickerValue;
      });
      return () => {
        var _a, _b, _c, _d, _e, _f, _g;
        const locale = _extends(_extends({}, contextLocale.value), props.locale);
        const p = _extends(_extends({}, props), attrs);
        const {
            prefixCls: customizePrefixCls,
            bordered = true,
            placeholder,
            suffixIcon = (_a = slots.suffixIcon) === null || _a === void 0 ? void 0 : _a.call(slots),
            picker = 'date',
            transitionName,
            allowClear = true,
            dateRender = slots.dateRender,
            renderExtraFooter = slots.renderExtraFooter,
            separator = (_b = slots.separator) === null || _b === void 0 ? void 0 : _b.call(slots),
            clearIcon = (_c = slots.clearIcon) === null || _c === void 0 ? void 0 : _c.call(slots),
            id = formItemContext.id.value
          } = p,
          restProps = __rest(p, ["prefixCls", "bordered", "placeholder", "suffixIcon", "picker", "transitionName", "allowClear", "dateRender", "renderExtraFooter", "separator", "clearIcon", "id"]);
        delete restProps['onUpdate:value'];
        delete restProps['onUpdate:open'];
        const {
          format,
          showTime
        } = p;
        let additionalOverrideProps = {};
        additionalOverrideProps = _extends(_extends(_extends({}, additionalOverrideProps), showTime ? getTimeProps(_extends({
          format,
          picker
        }, showTime)) : {}), picker === 'time' ? getTimeProps(_extends(_extends({
          format
        }, omit(restProps, ['disabledTime'])), {
          picker
        })) : {});
        const pre = prefixCls.value;
        const suffixNode = createVNode(Fragment, null, [suffixIcon || (picker === 'time' ? createVNode(ClockCircleOutlined, null, null) : createVNode(CalendarOutlined, null, null)), formItemInputContext.hasFeedback && formItemInputContext.feedbackIcon]);
        return wrapSSR(createVNode(InterRangerPicker, _objectSpread$3(_objectSpread$3(_objectSpread$3({
          "dateRender": dateRender,
          "renderExtraFooter": renderExtraFooter,
          "separator": separator || createVNode("span", {
            "aria-label": "to",
            "class": `${pre}-separator`
          }, [createVNode(SwapRightOutlined, null, null)]),
          "ref": pickerRef,
          "dropdownAlign": transPlacement2DropdownAlign(direction.value, props.placement),
          "placeholder": getRangePlaceholder(locale, picker, placeholder),
          "suffixIcon": suffixNode,
          "clearIcon": clearIcon || createVNode(CloseCircleFilled, null, null),
          "allowClear": allowClear,
          "transitionName": transitionName || `${rootPrefixCls.value}-slide-up`
        }, restProps), additionalOverrideProps), {}, {
          "disabled": disabled.value,
          "id": id,
          "value": value.value,
          "defaultValue": defaultValue.value,
          "defaultPickerValue": defaultPickerValue.value,
          "picker": picker,
          "class": classNames({
            [`${pre}-${mergedSize.value}`]: mergedSize.value,
            [`${pre}-borderless`]: !bordered
          }, getStatusClassNames(pre, getMergedStatus(formItemInputContext.status, props.status), formItemInputContext.hasFeedback), attrs.class, hashId.value, compactItemClassnames.value),
          "locale": locale.lang,
          "prefixCls": pre,
          "getPopupContainer": attrs.getCalendarContainer || getPopupContainer.value,
          "generateConfig": generateConfig,
          "prevIcon": ((_d = slots.prevIcon) === null || _d === void 0 ? void 0 : _d.call(slots)) || createVNode("span", {
            "class": `${pre}-prev-icon`
          }, null),
          "nextIcon": ((_e = slots.nextIcon) === null || _e === void 0 ? void 0 : _e.call(slots)) || createVNode("span", {
            "class": `${pre}-next-icon`
          }, null),
          "superPrevIcon": ((_f = slots.superPrevIcon) === null || _f === void 0 ? void 0 : _f.call(slots)) || createVNode("span", {
            "class": `${pre}-super-prev-icon`
          }, null),
          "superNextIcon": ((_g = slots.superNextIcon) === null || _g === void 0 ? void 0 : _g.call(slots)) || createVNode("span", {
            "class": `${pre}-super-next-icon`
          }, null),
          "components": Components,
          "direction": direction.value,
          "dropdownClassName": classNames(hashId.value, props.popupClassName, props.dropdownClassName),
          "onChange": onChange,
          "onOpenChange": onOpenChange,
          "onFocus": onFocus,
          "onBlur": onBlur,
          "onPanelChange": onPanelChange,
          "onOk": onOk,
          "onCalendarChange": onCalendarChange
        }), null));
      };
    }
  });
  return RangePicker;
}

const Components = {
  button: PickerButton,
  rangeItem: PickerTag
};
function toArray(list) {
  if (!list) {
    return [];
  }
  return Array.isArray(list) ? list : [list];
}
function getTimeProps(props) {
  const {
    format,
    picker,
    showHour,
    showMinute,
    showSecond,
    use12Hours
  } = props;
  const firstFormat = toArray(format)[0];
  const showTimeObj = _extends({}, props);
  if (firstFormat && typeof firstFormat === 'string') {
    if (!firstFormat.includes('s') && showSecond === undefined) {
      showTimeObj.showSecond = false;
    }
    if (!firstFormat.includes('m') && showMinute === undefined) {
      showTimeObj.showMinute = false;
    }
    if (!firstFormat.includes('H') && !firstFormat.includes('h') && showHour === undefined) {
      showTimeObj.showHour = false;
    }
    if ((firstFormat.includes('a') || firstFormat.includes('A')) && use12Hours === undefined) {
      showTimeObj.use12Hours = true;
    }
  }
  if (picker === 'time') {
    return showTimeObj;
  }
  if (typeof firstFormat === 'function') {
    // format of showTime should use default when format is custom format function
    delete showTimeObj.format;
  }
  return {
    showTime: showTimeObj
  };
}
function generatePicker(generateConfig, extraProps) {
  // =========================== Picker ===========================
  const {
    DatePicker,
    WeekPicker,
    MonthPicker,
    YearPicker,
    TimePicker,
    QuarterPicker
  } = generateSinglePicker(generateConfig, extraProps);
  // ======================== Range Picker ========================
  const RangePicker = generateRangePicker(generateConfig, extraProps);
  return {
    DatePicker,
    WeekPicker,
    MonthPicker,
    YearPicker,
    TimePicker,
    QuarterPicker,
    RangePicker
  };
}

const {
  DatePicker,
  WeekPicker,
  MonthPicker,
  YearPicker,
  TimePicker,
  QuarterPicker,
  RangePicker
} = generatePicker(generateConfig);
const DatePicker$1 = _extends(DatePicker, {
  WeekPicker,
  MonthPicker,
  YearPicker,
  RangePicker,
  TimePicker,
  QuarterPicker,
  install: app => {
    app.component(DatePicker.name, DatePicker);
    app.component(RangePicker.name, RangePicker);
    app.component(MonthPicker.name, MonthPicker);
    app.component(WeekPicker.name, WeekPicker);
    app.component(QuarterPicker.name, QuarterPicker);
    return app;
  }
});

export { DatePicker$1 as D, generateConfig as a, commonProps as c, datePickerProps as d, generatePicker as g, rangePickerProps as r };
//# sourceMappingURL=dayjs.mjs.map
