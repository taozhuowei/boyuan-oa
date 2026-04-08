import { defineComponent, ref, createVNode, computed, mergeProps, withCtx, openBlock, createBlock, createCommentVNode, createTextVNode, toDisplayString, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { _ as _export_sfc } from './server.mjs';
import { C as Card, a as Tabs, b as TabPane } from '../_/index.mjs';
import { T as Table, S as Select, a as SelectOption } from '../_/index3.mjs';
import { T as Tag } from '../_/index9.mjs';
import { V as devWarning, o as omit, D as stringType, f as booleanType, B as Button } from '../_/collapseMotion.mjs';
import { F as Form, a as FormItem } from '../_/index7.mjs';
import { g as generatePicker, c as commonProps, d as datePickerProps, r as rangePickerProps, a as generateConfig, D as DatePicker } from '../_/dayjs.mjs';
import { u as useInjectFormItemContext, T as Textarea } from '../_/index5.mjs';
import _extends from '@babel/runtime/helpers/esm/extends';
import _objectSpread from '@babel/runtime/helpers/esm/objectSpread2';
import { S as Space } from '../_/index15.mjs';
import { M as Modal } from '../_/index11.mjs';
import { D as Descriptions, a as DescriptionsItem } from '../_/index14.mjs';
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
import '../_/index4.mjs';
import 'lodash-es/uniq';
import '@ctrl/tinycolor';
import '../_/useRefs.mjs';
import 'lodash-es/pick';
import 'lodash-es/isPlainObject';
import 'throttle-debounce';
import 'lodash-es/debounce';
import 'lodash-es/fromPairs';
import '../_/index6.mjs';
import '../_/CheckOutlined.mjs';
import '../_/useBreakpoint.mjs';
import 'resize-observer-polyfill';
import 'dom-align';
import 'lodash-es/isEqual';
import '@ant-design/colors';
import 'stylis';
import 'vue-types';
import 'lodash-es';
import '../_/ExclamationCircleFilled.mjs';
import 'lodash-es/cloneDeep';
import '../_/useFlexGapSupport.mjs';
import 'async-validator';
import 'lodash-es/find';
import 'compute-scroll-into-view';
import 'lodash-es/intersection';
import 'lodash-es/omit';
import 'dayjs';
import 'dayjs/plugin/weekday';
import 'dayjs/plugin/localeData';
import 'dayjs/plugin/weekOfYear';
import 'dayjs/plugin/weekYear';
import 'dayjs/plugin/quarterOfYear';
import 'dayjs/plugin/advancedFormat';
import 'dayjs/plugin/customParseFormat';
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';

const timePickerProps = () => ({
  format: String,
  showNow: booleanType(),
  showHour: booleanType(),
  showMinute: booleanType(),
  showSecond: booleanType(),
  use12Hours: booleanType(),
  hourStep: Number,
  minuteStep: Number,
  secondStep: Number,
  hideDisabledOptions: booleanType(),
  popupClassName: String,
  status: stringType()
});
function createTimePicker(generateConfig) {
  const DatePicker = generatePicker(generateConfig, _extends(_extends({}, timePickerProps()), {
    order: {
      type: Boolean,
      default: true
    }
  }));
  const {
    TimePicker: InternalTimePicker,
    RangePicker: InternalRangePicker
  } = DatePicker;
  const TimePicker = defineComponent({
    name: 'ATimePicker',
    inheritAttrs: false,
    props: _extends(_extends(_extends(_extends({}, commonProps()), datePickerProps()), timePickerProps()), {
      addon: {
        type: Function
      }
    }),
    slots: Object,
    setup(p, _ref) {
      let {
        slots,
        expose,
        emit,
        attrs
      } = _ref;
      const props = p;
      const formItemContext = useInjectFormItemContext();
      devWarning(!(slots.addon || props.addon), 'TimePicker', '`addon` is deprecated. Please use `v-slot:renderExtraFooter` instead.');
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
      const onChange = (value, dateString) => {
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
      const onOk = value => {
        emit('ok', value);
      };
      return () => {
        const {
          id = formItemContext.id.value
        } = props;
        //restProps.addon
        return createVNode(InternalTimePicker, _objectSpread(_objectSpread(_objectSpread({}, attrs), omit(props, ['onUpdate:value', 'onUpdate:open'])), {}, {
          "id": id,
          "dropdownClassName": props.popupClassName,
          "mode": undefined,
          "ref": pickerRef,
          "renderExtraFooter": props.addon || slots.addon || props.renderExtraFooter || slots.renderExtraFooter,
          "onChange": onChange,
          "onOpenChange": onOpenChange,
          "onFocus": onFocus,
          "onBlur": onBlur,
          "onOk": onOk
        }), slots);
      };
    }
  });
  const TimeRangePicker = defineComponent({
    name: 'ATimeRangePicker',
    inheritAttrs: false,
    props: _extends(_extends(_extends(_extends({}, commonProps()), rangePickerProps()), timePickerProps()), {
      order: {
        type: Boolean,
        default: true
      }
    }),
    slots: Object,
    setup(p, _ref2) {
      let {
        slots,
        expose,
        emit,
        attrs
      } = _ref2;
      const props = p;
      const pickerRef = ref();
      const formItemContext = useInjectFormItemContext();
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
      const onChange = (values, dateStrings) => {
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
      const onPanelChange = (values, modes) => {
        emit('panelChange', values, modes);
      };
      const onOk = values => {
        emit('ok', values);
      };
      const onCalendarChange = (values, dateStrings, info) => {
        emit('calendarChange', values, dateStrings, info);
      };
      return () => {
        const {
          id = formItemContext.id.value
        } = props;
        return createVNode(InternalRangePicker, _objectSpread(_objectSpread(_objectSpread({}, attrs), omit(props, ['onUpdate:open', 'onUpdate:value'])), {}, {
          "id": id,
          "dropdownClassName": props.popupClassName,
          "picker": "time",
          "mode": undefined,
          "ref": pickerRef,
          "onChange": onChange,
          "onOpenChange": onOpenChange,
          "onFocus": onFocus,
          "onBlur": onBlur,
          "onPanelChange": onPanelChange,
          "onOk": onOk,
          "onCalendarChange": onCalendarChange
        }), slots);
      };
    }
  });
  return {
    TimePicker,
    TimeRangePicker
  };
}

const {
  TimePicker,
  TimeRangePicker
} = createTimePicker(generateConfig);
const TimePicker$1 = _extends(TimePicker, {
  TimePicker,
  TimeRangePicker,
  install: app => {
    app.component(TimePicker.name, TimePicker);
    app.component(TimeRangePicker.name, TimeRangePicker);
    return app;
  }
});

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const isPmOrCeo = computed(() => {
      var _a, _b;
      const role = (_b = (_a = userStore.userInfo) == null ? void 0 : _a.role) != null ? _b : "";
      return role === "project_manager" || role === "ceo";
    });
    const activeTab = ref("records");
    const loadingRecords = ref(false);
    const records = ref([]);
    const submittingLeave = ref(false);
    const submittingOvertime = ref(false);
    const submittingSelfReport = ref(false);
    const submittingNotification = ref(false);
    const leaveForm = ref({ leaveType: null, startDate: null, endDate: null, reason: "" });
    const overtimeForm = ref({ date: null, startTime: null, endTime: null, overtimeType: null, reason: "" });
    const selfReportForm = ref({ date: null, startTime: null, endTime: null, overtimeType: null, reason: "" });
    const notifyForm = ref({ overtimeDate: null, overtimeType: null, content: "" });
    const recordColumns = [
      { title: "\u65E5\u671F", key: "submitTime", width: 100 },
      { title: "\u7C7B\u578B", dataIndex: "formTypeName", key: "formTypeName", width: 90 },
      { title: "\u6458\u8981", key: "summary" },
      { title: "\u72B6\u6001", key: "status", width: 90 },
      { title: "\u64CD\u4F5C", key: "action", width: 80 }
    ];
    const detailVisible = ref(false);
    const selectedRecord = ref(null);
    const loadingNotifs = ref(false);
    const notifications = ref([]);
    const rejectModalVisible = ref(false);
    const rejectReason = ref("");
    const pendingRejectId = ref(null);
    const notifColumns = [
      { title: "\u52A0\u73ED\u65E5\u671F", key: "date", width: 110 },
      { title: "\u7C7B\u578B", key: "type", width: 100 },
      { title: "\u8BF4\u660E", key: "content" },
      { title: "\u72B6\u6001", key: "status", width: 90 },
      { title: "\u64CD\u4F5C", key: "action", width: 130 }
    ];
    const loadingInitiated = ref(false);
    const initiatedNotifs = ref([]);
    const initiatedColumns = [
      { title: "\u52A0\u73ED\u65E5\u671F", key: "date", width: 110 },
      { title: "\u7C7B\u578B", key: "type", width: 100 },
      { title: "\u901A\u77E5\u5185\u5BB9", key: "content" },
      { title: "\u72B6\u6001", key: "status", width: 90 },
      { title: "\u54CD\u5E94", key: "responseCount", width: 90 }
    ];
    const responseDetailColumns = [
      { title: "\u5458\u5DE5ID", dataIndex: "employeeId", key: "employeeId", width: 90 },
      { title: "\u54CD\u5E94", key: "accepted", width: 80 },
      { title: "\u62D2\u7EDD\u539F\u56E0", key: "rejectReason" }
    ];
    function overtimeTypeLabel(t) {
      var _a;
      const map = { WEEKDAY: "\u5DE5\u4F5C\u65E5\u52A0\u73ED", WEEKEND: "\u5468\u672B\u52A0\u73ED", HOLIDAY: "\u8282\u5047\u65E5\u52A0\u73ED" };
      return (_a = map[t]) != null ? _a : t;
    }
    function notifStatusColor(s) {
      if (s === "ARCHIVED") return "default";
      if (s === "NOTIFIED") return "processing";
      return "default";
    }
    function notifStatusLabel(s) {
      var _a;
      const map = { NOTIFIED: "\u5F85\u54CD\u5E94", ARCHIVED: "\u5DF2\u5F52\u6863" };
      return (_a = map[s]) != null ? _a : s;
    }
    function onTabChange(key) {
      if (key === "notifications") loadNotifications();
      if (key === "notify-initiated") loadInitiatedNotifs();
    }
    async function loadNotifications() {
      loadingNotifs.value = true;
      try {
        const list = await request({ url: "/overtime-notifications" });
        notifications.value = list != null ? list : [];
      } catch {
        notifications.value = [];
      } finally {
        loadingNotifs.value = false;
      }
    }
    async function loadInitiatedNotifs() {
      loadingInitiated.value = true;
      try {
        const list = await request({ url: "/overtime-notifications/initiated" });
        initiatedNotifs.value = list != null ? list : [];
      } catch {
        initiatedNotifs.value = [];
      } finally {
        loadingInitiated.value = false;
      }
    }
    async function respondNotif(id, accepted, reason) {
      var _a;
      try {
        await request({
          url: `/overtime-notifications/${id}/respond`,
          method: "POST",
          body: { accepted, rejectReason: reason }
        });
        await loadNotifications();
      } catch (e) {
        alert((_a = e.message) != null ? _a : "\u64CD\u4F5C\u5931\u8D25");
      }
    }
    function openRejectModal(id) {
      pendingRejectId.value = id;
      rejectReason.value = "";
      rejectModalVisible.value = true;
    }
    async function confirmReject() {
      if (!pendingRejectId.value || !rejectReason.value.trim()) {
        alert("\u8BF7\u586B\u5199\u62D2\u7EDD\u539F\u56E0");
        return;
      }
      await respondNotif(pendingRejectId.value, false, rejectReason.value);
      rejectModalVisible.value = false;
    }
    function formatDate(t) {
      if (!t) return "\u2014";
      return t.replace("T", " ").slice(0, 10);
    }
    function getSummary(record) {
      var _a, _b, _c, _d, _e, _f, _g;
      const d = (_a = record.formData) != null ? _a : {};
      if (record.formType === "LEAVE") {
        return `${(_b = d.leaveType) != null ? _b : ""} ${(_c = d.days) != null ? _c : ""}\u5929`;
      }
      if (record.formType === "OVERTIME") {
        return `${(_d = d.overtimeType) != null ? _d : ""} ${(_e = d.startTime) != null ? _e : ""}~${(_f = d.endTime) != null ? _f : ""}`;
      }
      return (_g = record.formTypeName) != null ? _g : "";
    }
    function statusColor(status) {
      if (status === "APPROVED") return "success";
      if (status === "REJECTED") return "error";
      if (status === "PENDING" || status === "APPROVING") return "processing";
      return "default";
    }
    function statusLabel(status) {
      var _a;
      const map = {
        PENDING: "\u5BA1\u6279\u4E2D",
        APPROVING: "\u5BA1\u6279\u4E2D",
        APPROVED: "\u5DF2\u901A\u8FC7",
        REJECTED: "\u5DF2\u9A73\u56DE",
        ARCHIVED: "\u5DF2\u5F52\u6863",
        RECALLED: "\u5DF2\u64A4\u56DE"
      };
      return (_a = map[status]) != null ? _a : status;
    }
    function viewRecord(record) {
      selectedRecord.value = record;
      detailVisible.value = true;
    }
    async function loadRecords() {
      loadingRecords.value = true;
      try {
        const list = await request({ url: "/attendance/records" });
        records.value = list != null ? list : [];
      } catch {
        records.value = [];
      } finally {
        loadingRecords.value = false;
      }
    }
    async function submitLeave() {
      var _a, _b, _c;
      submittingLeave.value = true;
      try {
        await request({
          url: "/attendance/leave",
          method: "POST",
          body: {
            formType: "LEAVE",
            formData: {
              leaveType: leaveForm.value.leaveType,
              startDate: (_a = leaveForm.value.startDate) == null ? void 0 : _a.format("YYYY-MM-DD"),
              endDate: (_b = leaveForm.value.endDate) == null ? void 0 : _b.format("YYYY-MM-DD"),
              days: (() => {
                const s = leaveForm.value.startDate;
                const e = leaveForm.value.endDate;
                if (s && e) return e.diff(s, "day") + 1;
                return 1;
              })()
            },
            remark: leaveForm.value.reason
          }
        });
        leaveForm.value = { leaveType: null, startDate: null, endDate: null, reason: "" };
        activeTab.value = "records";
        await loadRecords();
      } catch (e) {
        const msg = (_c = e.message) != null ? _c : "\u63D0\u4EA4\u5931\u8D25";
        alert(msg);
      } finally {
        submittingLeave.value = false;
      }
    }
    async function submitOvertime() {
      var _a, _b, _c, _d;
      submittingOvertime.value = true;
      try {
        await request({
          url: "/attendance/overtime",
          method: "POST",
          body: {
            formType: "OVERTIME",
            formData: {
              date: (_a = overtimeForm.value.date) == null ? void 0 : _a.format("YYYY-MM-DD"),
              startTime: (_b = overtimeForm.value.startTime) == null ? void 0 : _b.format("HH:mm"),
              endTime: (_c = overtimeForm.value.endTime) == null ? void 0 : _c.format("HH:mm"),
              overtimeType: overtimeForm.value.overtimeType
            },
            remark: overtimeForm.value.reason
          }
        });
        overtimeForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: "" };
        activeTab.value = "records";
        await loadRecords();
      } catch (e) {
        const msg = (_d = e.message) != null ? _d : "\u63D0\u4EA4\u5931\u8D25";
        alert(msg);
      } finally {
        submittingOvertime.value = false;
      }
    }
    async function submitSelfReport() {
      var _a, _b, _c, _d;
      submittingSelfReport.value = true;
      try {
        await request({
          url: "/attendance/overtime-self-report",
          method: "POST",
          body: {
            formType: "OVERTIME",
            formData: {
              date: (_a = selfReportForm.value.date) == null ? void 0 : _a.format("YYYY-MM-DD"),
              startTime: (_b = selfReportForm.value.startTime) == null ? void 0 : _b.format("HH:mm"),
              endTime: (_c = selfReportForm.value.endTime) == null ? void 0 : _c.format("HH:mm"),
              overtimeType: selfReportForm.value.overtimeType
            },
            remark: selfReportForm.value.reason
          }
        });
        selfReportForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: "" };
        activeTab.value = "records";
        await loadRecords();
      } catch (e) {
        const msg = (_d = e.message) != null ? _d : "\u63D0\u4EA4\u5931\u8D25";
        alert(msg);
      } finally {
        submittingSelfReport.value = false;
      }
    }
    async function submitNotification() {
      var _a, _b;
      submittingNotification.value = true;
      try {
        await request({
          url: "/overtime-notifications",
          method: "POST",
          body: {
            overtimeDate: (_a = notifyForm.value.overtimeDate) == null ? void 0 : _a.format("YYYY-MM-DD"),
            overtimeType: notifyForm.value.overtimeType,
            content: notifyForm.value.content
          }
        });
        notifyForm.value = { overtimeDate: null, overtimeType: null, content: "" };
        activeTab.value = "notify-initiated";
        await loadInitiatedNotifs();
      } catch (e) {
        const msg = (_b = e.message) != null ? _b : "\u53D1\u9001\u5931\u8D25";
        alert(msg);
      } finally {
        submittingNotification.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_tabs = Tabs;
      const _component_a_tab_pane = TabPane;
      const _component_a_table = Table;
      const _component_a_tag = Tag;
      const _component_a_button = Button;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_select = Select;
      const _component_a_select_option = SelectOption;
      const _component_a_date_picker = DatePicker;
      const _component_a_textarea = Textarea;
      const _component_a_time_picker = TimePicker$1;
      const _component_a_space = Space;
      const _component_a_modal = Modal;
      const _component_a_descriptions = Descriptions;
      const _component_a_descriptions_item = DescriptionsItem;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "attendance-page" }, _attrs))} data-v-b41651d7><h2 class="page-title" data-v-b41651d7>\u8003\u52E4\u7BA1\u7406</h2>`);
      _push(ssrRenderComponent(_component_a_card, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_tabs, {
              activeKey: activeTab.value,
              "onUpdate:activeKey": ($event) => activeTab.value = $event,
              onChange: onTabChange
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "records",
                    tab: "\u6211\u7684\u8BB0\u5F55"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "leave",
                    tab: "\u8BF7\u5047\u7533\u8BF7"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "overtime",
                    tab: "\u52A0\u73ED\u7533\u62A5"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "self-report",
                    tab: "\u81EA\u8865\u52A0\u73ED"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "notifications",
                    tab: "\u52A0\u73ED\u901A\u77E5"
                  }, null, _parent3, _scopeId2));
                  if (isPmOrCeo.value) {
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "notify-create",
                      tab: "\u53D1\u8D77\u901A\u77E5"
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  if (isPmOrCeo.value) {
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "notify-initiated",
                      tab: "\u5DF2\u53D1\u8D77"
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    createVNode(_component_a_tab_pane, {
                      key: "records",
                      tab: "\u6211\u7684\u8BB0\u5F55"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "leave",
                      tab: "\u8BF7\u5047\u7533\u8BF7"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "overtime",
                      tab: "\u52A0\u73ED\u7533\u62A5"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "self-report",
                      tab: "\u81EA\u8865\u52A0\u73ED"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "notifications",
                      tab: "\u52A0\u73ED\u901A\u77E5"
                    }),
                    isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                      key: "notify-create",
                      tab: "\u53D1\u8D77\u901A\u77E5"
                    })) : createCommentVNode("", true),
                    isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                      key: "notify-initiated",
                      tab: "\u5DF2\u53D1\u8D77"
                    })) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (activeTab.value === "records") {
              _push2(ssrRenderComponent(_component_a_table, {
                columns: recordColumns,
                "data-source": records.value,
                loading: loadingRecords.value,
                pagination: { pageSize: 20, showTotal: (t) => `\u5171 ${t} \u6761` },
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (column.key === "submitTime") {
                      _push3(`<!--[-->${ssrInterpolate(formatDate(record.submitTime))}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "summary") {
                      _push3(`<!--[-->${ssrInterpolate(getSummary(record))}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "status") {
                      _push3(ssrRenderComponent(_component_a_tag, {
                        color: statusColor(record.status)
                      }, {
                        default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(statusLabel(record.status))}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(statusLabel(record.status)), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "action") {
                      _push3(ssrRenderComponent(_component_a_button, {
                        type: "link",
                        size: "small",
                        onClick: ($event) => viewRecord(record)
                      }, {
                        default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u67E5\u770B`);
                          } else {
                            return [
                              createTextVNode("\u67E5\u770B")
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                  } else {
                    return [
                      column.key === "submitTime" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createTextVNode(toDisplayString(formatDate(record.submitTime)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "summary" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(toDisplayString(getSummary(record)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                        key: 2,
                        color: statusColor(record.status)
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(statusLabel(record.status)), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                        key: 3,
                        type: "link",
                        size: "small",
                        onClick: ($event) => viewRecord(record)
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u67E5\u770B")
                        ]),
                        _: 1
                      }, 8, ["onClick"])) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "leave") {
              _push2(ssrRenderComponent(_component_a_form, {
                model: leaveForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitLeave
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u5047\u79CD",
                      name: "leaveType",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5047\u79CD" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: leaveForm.value.leaveType,
                            "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u4E8B\u5047" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u4E8B\u5047`);
                                    } else {
                                      return [
                                        createTextVNode("\u4E8B\u5047")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u75C5\u5047" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u75C5\u5047`);
                                    } else {
                                      return [
                                        createTextVNode("\u75C5\u5047")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u5E74\u5047" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5E74\u5047`);
                                    } else {
                                      return [
                                        createTextVNode("\u5E74\u5047")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "\u4E8B\u5047" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u4E8B\u5047")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "\u75C5\u5047" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u75C5\u5047")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "\u5E74\u5047" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5E74\u5047")
                                    ]),
                                    _: 1
                                  })
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_select, {
                              value: leaveForm.value.leaveType,
                              "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                              placeholder: "\u8BF7\u9009\u62E9"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "\u4E8B\u5047" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u4E8B\u5047")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "\u75C5\u5047" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u75C5\u5047")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "\u5E74\u5047" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5E74\u5047")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u5F00\u59CB\u65E5\u671F",
                      name: "startDate",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65E5\u671F" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_date_picker, {
                            value: leaveForm.value.startDate,
                            "onUpdate:value": ($event) => leaveForm.value.startDate = $event,
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_date_picker, {
                              value: leaveForm.value.startDate,
                              "onUpdate:value": ($event) => leaveForm.value.startDate = $event,
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u7ED3\u675F\u65E5\u671F",
                      name: "endDate",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65E5\u671F" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_date_picker, {
                            value: leaveForm.value.endDate,
                            "onUpdate:value": ($event) => leaveForm.value.endDate = $event,
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_date_picker, {
                              value: leaveForm.value.endDate,
                              "onUpdate:value": ($event) => leaveForm.value.endDate = $event,
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u8BF7\u5047\u539F\u56E0",
                      name: "reason",
                      rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: leaveForm.value.reason,
                            "onUpdate:value": ($event) => leaveForm.value.reason = $event,
                            rows: 3
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: leaveForm.value.reason,
                              "onUpdate:value": ($event) => leaveForm.value.reason = $event,
                              rows: 3
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingLeave.value
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` \u63D0\u4EA4\u7533\u8BF7 `);
                              } else {
                                return [
                                  createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "primary",
                              "html-type": "submit",
                              loading: submittingLeave.value
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                              ]),
                              _: 1
                            }, 8, ["loading"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_form_item, {
                        label: "\u5047\u79CD",
                        name: "leaveType",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5047\u79CD" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: leaveForm.value.leaveType,
                            "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "\u4E8B\u5047" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u4E8B\u5047")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "\u75C5\u5047" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u75C5\u5047")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "\u5E74\u5047" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5E74\u5047")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u5F00\u59CB\u65E5\u671F",
                        name: "startDate",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65E5\u671F" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_date_picker, {
                            value: leaveForm.value.startDate,
                            "onUpdate:value": ($event) => leaveForm.value.startDate = $event,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u7ED3\u675F\u65E5\u671F",
                        name: "endDate",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65E5\u671F" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_date_picker, {
                            value: leaveForm.value.endDate,
                            "onUpdate:value": ($event) => leaveForm.value.endDate = $event,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u8BF7\u5047\u539F\u56E0",
                        name: "reason",
                        rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: leaveForm.value.reason,
                            "onUpdate:value": ($event) => leaveForm.value.reason = $event,
                            rows: 3
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, null, {
                        default: withCtx(() => [
                          createVNode(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingLeave.value
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "overtime") {
              _push2(ssrRenderComponent(_component_a_form, {
                model: overtimeForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitOvertime
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u65E5\u671F",
                      name: "date",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_date_picker, {
                            value: overtimeForm.value.date,
                            "onUpdate:value": ($event) => overtimeForm.value.date = $event,
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_date_picker, {
                              value: overtimeForm.value.date,
                              "onUpdate:value": ($event) => overtimeForm.value.date = $event,
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u5F00\u59CB\u65F6\u95F4",
                      name: "startTime",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_time_picker, {
                            value: overtimeForm.value.startTime,
                            "onUpdate:value": ($event) => overtimeForm.value.startTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_time_picker, {
                              value: overtimeForm.value.startTime,
                              "onUpdate:value": ($event) => overtimeForm.value.startTime = $event,
                              format: "HH:mm",
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u7ED3\u675F\u65F6\u95F4",
                      name: "endTime",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_time_picker, {
                            value: overtimeForm.value.endTime,
                            "onUpdate:value": ($event) => overtimeForm.value.endTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_time_picker, {
                              value: overtimeForm.value.endTime,
                              "onUpdate:value": ($event) => overtimeForm.value.endTime = $event,
                              format: "HH:mm",
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u7C7B\u578B",
                      name: "overtimeType"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: overtimeForm.value.overtimeType,
                            "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u5468\u672B\u52A0\u73ED" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5468\u672B\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5468\u672B\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u8282\u5047\u65E5\u52A0\u73ED" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u8282\u5047\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "\u5DE5\u4F5C\u65E5\u52A0\u73ED" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5DE5\u4F5C\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "\u5468\u672B\u52A0\u73ED" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5468\u672B\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "\u8282\u5047\u65E5\u52A0\u73ED" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "\u5DE5\u4F5C\u65E5\u52A0\u73ED" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  })
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_select, {
                              value: overtimeForm.value.overtimeType,
                              "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                              placeholder: "\u8BF7\u9009\u62E9"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "\u5468\u672B\u52A0\u73ED" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5468\u672B\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "\u8282\u5047\u65E5\u52A0\u73ED" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "\u5DE5\u4F5C\u65E5\u52A0\u73ED" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u8BF4\u660E",
                      name: "reason"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: overtimeForm.value.reason,
                            "onUpdate:value": ($event) => overtimeForm.value.reason = $event,
                            rows: 3
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: overtimeForm.value.reason,
                              "onUpdate:value": ($event) => overtimeForm.value.reason = $event,
                              rows: 3
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingOvertime.value
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` \u63D0\u4EA4\u7533\u62A5 `);
                              } else {
                                return [
                                  createTextVNode(" \u63D0\u4EA4\u7533\u62A5 ")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "primary",
                              "html-type": "submit",
                              loading: submittingOvertime.value
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" \u63D0\u4EA4\u7533\u62A5 ")
                              ]),
                              _: 1
                            }, 8, ["loading"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u65E5\u671F",
                        name: "date",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_date_picker, {
                            value: overtimeForm.value.date,
                            "onUpdate:value": ($event) => overtimeForm.value.date = $event,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u5F00\u59CB\u65F6\u95F4",
                        name: "startTime",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_time_picker, {
                            value: overtimeForm.value.startTime,
                            "onUpdate:value": ($event) => overtimeForm.value.startTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u7ED3\u675F\u65F6\u95F4",
                        name: "endTime",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_time_picker, {
                            value: overtimeForm.value.endTime,
                            "onUpdate:value": ($event) => overtimeForm.value.endTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u7C7B\u578B",
                        name: "overtimeType"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: overtimeForm.value.overtimeType,
                            "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "\u5468\u672B\u52A0\u73ED" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5468\u672B\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "\u8282\u5047\u65E5\u52A0\u73ED" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "\u5DE5\u4F5C\u65E5\u52A0\u73ED" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u8BF4\u660E",
                        name: "reason"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: overtimeForm.value.reason,
                            "onUpdate:value": ($event) => overtimeForm.value.reason = $event,
                            rows: 3
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, null, {
                        default: withCtx(() => [
                          createVNode(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingOvertime.value
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u63D0\u4EA4\u7533\u62A5 ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "self-report") {
              _push2(ssrRenderComponent(_component_a_form, {
                model: selfReportForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitSelfReport
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u65E5\u671F",
                      name: "date",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_date_picker, {
                            value: selfReportForm.value.date,
                            "onUpdate:value": ($event) => selfReportForm.value.date = $event,
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_date_picker, {
                              value: selfReportForm.value.date,
                              "onUpdate:value": ($event) => selfReportForm.value.date = $event,
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u5F00\u59CB\u65F6\u95F4",
                      name: "startTime",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_time_picker, {
                            value: selfReportForm.value.startTime,
                            "onUpdate:value": ($event) => selfReportForm.value.startTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_time_picker, {
                              value: selfReportForm.value.startTime,
                              "onUpdate:value": ($event) => selfReportForm.value.startTime = $event,
                              format: "HH:mm",
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u7ED3\u675F\u65F6\u95F4",
                      name: "endTime",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_time_picker, {
                            value: selfReportForm.value.endTime,
                            "onUpdate:value": ($event) => selfReportForm.value.endTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_time_picker, {
                              value: selfReportForm.value.endTime,
                              "onUpdate:value": ($event) => selfReportForm.value.endTime = $event,
                              format: "HH:mm",
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u7C7B\u578B",
                      name: "overtimeType",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: selfReportForm.value.overtimeType,
                            "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5DE5\u4F5C\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5468\u672B\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5468\u672B\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u8282\u5047\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5468\u672B\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  })
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_select, {
                              value: selfReportForm.value.overtimeType,
                              "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                              placeholder: "\u8BF7\u9009\u62E9"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5468\u672B\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u8865\u7533\u62A5\u539F\u56E0",
                      name: "reason",
                      rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: selfReportForm.value.reason,
                            "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                            rows: 3,
                            placeholder: "\u8BF7\u8BF4\u660E\u672A\u80FD\u53CA\u65F6\u7533\u62A5\u7684\u539F\u56E0"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: selfReportForm.value.reason,
                              "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                              rows: 3,
                              placeholder: "\u8BF7\u8BF4\u660E\u672A\u80FD\u53CA\u65F6\u7533\u62A5\u7684\u539F\u56E0"
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingSelfReport.value
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` \u63D0\u4EA4\u7533\u8BF7 `);
                              } else {
                                return [
                                  createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "primary",
                              "html-type": "submit",
                              loading: submittingSelfReport.value
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                              ]),
                              _: 1
                            }, 8, ["loading"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u65E5\u671F",
                        name: "date",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_date_picker, {
                            value: selfReportForm.value.date,
                            "onUpdate:value": ($event) => selfReportForm.value.date = $event,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u5F00\u59CB\u65F6\u95F4",
                        name: "startTime",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_time_picker, {
                            value: selfReportForm.value.startTime,
                            "onUpdate:value": ($event) => selfReportForm.value.startTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u7ED3\u675F\u65F6\u95F4",
                        name: "endTime",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_time_picker, {
                            value: selfReportForm.value.endTime,
                            "onUpdate:value": ($event) => selfReportForm.value.endTime = $event,
                            format: "HH:mm",
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u7C7B\u578B",
                        name: "overtimeType",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: selfReportForm.value.overtimeType,
                            "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5468\u672B\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u8865\u7533\u62A5\u539F\u56E0",
                        name: "reason",
                        rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: selfReportForm.value.reason,
                            "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                            rows: 3,
                            placeholder: "\u8BF7\u8BF4\u660E\u672A\u80FD\u53CA\u65F6\u7533\u62A5\u7684\u539F\u56E0"
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, null, {
                        default: withCtx(() => [
                          createVNode(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingSelfReport.value
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "notifications") {
              _push2(ssrRenderComponent(_component_a_table, {
                columns: notifColumns,
                "data-source": notifications.value,
                loading: loadingNotifs.value,
                pagination: { pageSize: 20 },
                "row-key": "notification.id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (column.key === "date") {
                      _push3(`<!--[-->${ssrInterpolate(record.notification.overtimeDate)}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "type") {
                      _push3(`<!--[-->${ssrInterpolate(overtimeTypeLabel(record.notification.overtimeType))}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "content") {
                      _push3(`<!--[-->${ssrInterpolate(record.notification.content)}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "status") {
                      _push3(`<!--[-->`);
                      if (record.myResponse) {
                        _push3(ssrRenderComponent(_component_a_tag, {
                          color: record.myResponse.accepted ? "success" : "error"
                        }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`${ssrInterpolate(record.myResponse.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD")}`);
                            } else {
                              return [
                                createTextVNode(toDisplayString(record.myResponse.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(ssrRenderComponent(_component_a_tag, { color: "processing" }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`\u5F85\u54CD\u5E94`);
                            } else {
                              return [
                                createTextVNode("\u5F85\u54CD\u5E94")
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      }
                      _push3(`<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "action") {
                      _push3(`<!--[-->`);
                      if (!record.myResponse && record.notification.status !== "ARCHIVED") {
                        _push3(ssrRenderComponent(_component_a_space, null, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(ssrRenderComponent(_component_a_button, {
                                size: "small",
                                type: "primary",
                                onClick: ($event) => respondNotif(record.notification.id, true, "")
                              }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`\u786E\u8BA4`);
                                  } else {
                                    return [
                                      createTextVNode("\u786E\u8BA4")
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                              _push4(ssrRenderComponent(_component_a_button, {
                                size: "small",
                                danger: "",
                                onClick: ($event) => openRejectModal(record.notification.id)
                              }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`\u62D2\u7EDD`);
                                  } else {
                                    return [
                                      createTextVNode("\u62D2\u7EDD")
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              return [
                                createVNode(_component_a_button, {
                                  size: "small",
                                  type: "primary",
                                  onClick: ($event) => respondNotif(record.notification.id, true, "")
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u786E\u8BA4")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                createVNode(_component_a_button, {
                                  size: "small",
                                  danger: "",
                                  onClick: ($event) => openRejectModal(record.notification.id)
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u62D2\u7EDD")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(`<span class="text-muted" data-v-b41651d7${_scopeId2}>\u2014</span>`);
                      }
                      _push3(`<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                  } else {
                    return [
                      column.key === "date" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createTextVNode(toDisplayString(record.notification.overtimeDate), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "type" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(toDisplayString(overtimeTypeLabel(record.notification.overtimeType)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "content" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                        createTextVNode(toDisplayString(record.notification.content), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "status" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                        record.myResponse ? (openBlock(), createBlock(_component_a_tag, {
                          key: 0,
                          color: record.myResponse.accepted ? "success" : "error"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(record.myResponse.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])) : (openBlock(), createBlock(_component_a_tag, {
                          key: 1,
                          color: "processing"
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u5F85\u54CD\u5E94")
                          ]),
                          _: 1
                        }))
                      ], 64)) : createCommentVNode("", true),
                      column.key === "action" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                        !record.myResponse && record.notification.status !== "ARCHIVED" ? (openBlock(), createBlock(_component_a_space, { key: 0 }, {
                          default: withCtx(() => [
                            createVNode(_component_a_button, {
                              size: "small",
                              type: "primary",
                              onClick: ($event) => respondNotif(record.notification.id, true, "")
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u786E\u8BA4")
                              ]),
                              _: 1
                            }, 8, ["onClick"]),
                            createVNode(_component_a_button, {
                              size: "small",
                              danger: "",
                              onClick: ($event) => openRejectModal(record.notification.id)
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u62D2\u7EDD")
                              ]),
                              _: 1
                            }, 8, ["onClick"])
                          ]),
                          _: 2
                        }, 1024)) : (openBlock(), createBlock("span", {
                          key: 1,
                          class: "text-muted"
                        }, "\u2014"))
                      ], 64)) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "notify-create") {
              _push2(ssrRenderComponent(_component_a_form, {
                model: notifyForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitNotification
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u65E5\u671F",
                      name: "overtimeDate",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_date_picker, {
                            value: notifyForm.value.overtimeDate,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeDate = $event,
                            style: { "width": "100%" }
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_date_picker, {
                              value: notifyForm.value.overtimeDate,
                              "onUpdate:value": ($event) => notifyForm.value.overtimeDate = $event,
                              style: { "width": "100%" }
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u52A0\u73ED\u7C7B\u578B",
                      name: "overtimeType",
                      rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: notifyForm.value.overtimeType,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5DE5\u4F5C\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u5468\u672B\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u5468\u672B\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`\u8282\u5047\u65E5\u52A0\u73ED`);
                                    } else {
                                      return [
                                        createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5468\u672B\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                    ]),
                                    _: 1
                                  })
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_select, {
                              value: notifyForm.value.overtimeType,
                              "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                              placeholder: "\u8BF7\u9009\u62E9"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5468\u672B\u52A0\u73ED")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, {
                      label: "\u901A\u77E5\u5185\u5BB9",
                      name: "content",
                      rules: [{ required: true, message: "\u8BF7\u586B\u5199\u901A\u77E5\u5185\u5BB9" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: notifyForm.value.content,
                            "onUpdate:value": ($event) => notifyForm.value.content = $event,
                            rows: 3,
                            placeholder: "\u8BF4\u660E\u52A0\u73ED\u5B89\u6392\u3001\u8981\u6C42\u7B49"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: notifyForm.value.content,
                              "onUpdate:value": ($event) => notifyForm.value.content = $event,
                              rows: 3,
                              placeholder: "\u8BF4\u660E\u52A0\u73ED\u5B89\u6392\u3001\u8981\u6C42\u7B49"
                            }, null, 8, ["value", "onUpdate:value"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_form_item, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingNotification.value
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` \u53D1\u9001\u901A\u77E5 `);
                              } else {
                                return [
                                  createTextVNode(" \u53D1\u9001\u901A\u77E5 ")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "primary",
                              "html-type": "submit",
                              loading: submittingNotification.value
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" \u53D1\u9001\u901A\u77E5 ")
                              ]),
                              _: 1
                            }, 8, ["loading"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u65E5\u671F",
                        name: "overtimeDate",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_date_picker, {
                            value: notifyForm.value.overtimeDate,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeDate = $event,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u52A0\u73ED\u7C7B\u578B",
                        name: "overtimeType",
                        rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: notifyForm.value.overtimeType,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                            placeholder: "\u8BF7\u9009\u62E9"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5468\u672B\u52A0\u73ED")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, {
                        label: "\u901A\u77E5\u5185\u5BB9",
                        name: "content",
                        rules: [{ required: true, message: "\u8BF7\u586B\u5199\u901A\u77E5\u5185\u5BB9" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: notifyForm.value.content,
                            "onUpdate:value": ($event) => notifyForm.value.content = $event,
                            rows: 3,
                            placeholder: "\u8BF4\u660E\u52A0\u73ED\u5B89\u6392\u3001\u8981\u6C42\u7B49"
                          }, null, 8, ["value", "onUpdate:value"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form_item, null, {
                        default: withCtx(() => [
                          createVNode(_component_a_button, {
                            type: "primary",
                            "html-type": "submit",
                            loading: submittingNotification.value
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u53D1\u9001\u901A\u77E5 ")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (activeTab.value === "notify-initiated") {
              _push2(ssrRenderComponent(_component_a_table, {
                columns: initiatedColumns,
                "data-source": initiatedNotifs.value,
                loading: loadingInitiated.value,
                pagination: { pageSize: 20 },
                "row-key": "notification.id",
                size: "small",
                "expand-row-by-click": true
              }, {
                bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (column.key === "date") {
                      _push3(`<!--[-->${ssrInterpolate(record.notification.overtimeDate)}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "type") {
                      _push3(`<!--[-->${ssrInterpolate(overtimeTypeLabel(record.notification.overtimeType))}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "content") {
                      _push3(`<!--[-->${ssrInterpolate(record.notification.content)}<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "status") {
                      _push3(ssrRenderComponent(_component_a_tag, {
                        color: notifStatusColor(record.notification.status)
                      }, {
                        default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(notifStatusLabel(record.notification.status))}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(notifStatusLabel(record.notification.status)), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                    if (column.key === "responseCount") {
                      _push3(`<!--[-->${ssrInterpolate(record.responses.length)} \u4EBA\u54CD\u5E94 <!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                  } else {
                    return [
                      column.key === "date" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createTextVNode(toDisplayString(record.notification.overtimeDate), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "type" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(toDisplayString(overtimeTypeLabel(record.notification.overtimeType)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "content" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                        createTextVNode(toDisplayString(record.notification.content), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                        key: 3,
                        color: notifStatusColor(record.notification.status)
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(notifStatusLabel(record.notification.status)), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      column.key === "responseCount" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                        createTextVNode(toDisplayString(record.responses.length) + " \u4EBA\u54CD\u5E94 ", 1)
                      ], 64)) : createCommentVNode("", true)
                    ];
                  }
                }),
                expandedRowRender: withCtx(({ record }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (record.responses.length === 0) {
                      _push3(`<div class="no-response-tip" data-v-b41651d7${_scopeId2}>\u6682\u65E0\u54CD\u5E94</div>`);
                    } else {
                      _push3(ssrRenderComponent(_component_a_table, {
                        columns: responseDetailColumns,
                        "data-source": record.responses,
                        pagination: false,
                        "row-key": "id",
                        size: "small"
                      }, {
                        bodyCell: withCtx(({ column: col, record: resp }, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            if (col.key === "accepted") {
                              _push4(ssrRenderComponent(_component_a_tag, {
                                color: resp.accepted ? "success" : "error"
                              }, {
                                default: withCtx((_2, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`${ssrInterpolate(resp.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD")}`);
                                  } else {
                                    return [
                                      createTextVNode(toDisplayString(resp.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                            if (col.key === "rejectReason") {
                              _push4(`<!--[-->${ssrInterpolate(resp.rejectReason || "\u2014")}<!--]-->`);
                            } else {
                              _push4(`<!---->`);
                            }
                          } else {
                            return [
                              col.key === "accepted" ? (openBlock(), createBlock(_component_a_tag, {
                                key: 0,
                                color: resp.accepted ? "success" : "error"
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(resp.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                                ]),
                                _: 2
                              }, 1032, ["color"])) : createCommentVNode("", true),
                              col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                                createTextVNode(toDisplayString(resp.rejectReason || "\u2014"), 1)
                              ], 64)) : createCommentVNode("", true)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    }
                  } else {
                    return [
                      record.responses.length === 0 ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "no-response-tip"
                      }, "\u6682\u65E0\u54CD\u5E94")) : (openBlock(), createBlock(_component_a_table, {
                        key: 1,
                        columns: responseDetailColumns,
                        "data-source": record.responses,
                        pagination: false,
                        "row-key": "id",
                        size: "small"
                      }, {
                        bodyCell: withCtx(({ column: col, record: resp }) => [
                          col.key === "accepted" ? (openBlock(), createBlock(_component_a_tag, {
                            key: 0,
                            color: resp.accepted ? "success" : "error"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(resp.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"])) : createCommentVNode("", true),
                          col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                            createTextVNode(toDisplayString(resp.rejectReason || "\u2014"), 1)
                          ], 64)) : createCommentVNode("", true)
                        ]),
                        _: 1
                      }, 8, ["data-source"]))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode(_component_a_tabs, {
                activeKey: activeTab.value,
                "onUpdate:activeKey": ($event) => activeTab.value = $event,
                onChange: onTabChange
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_tab_pane, {
                    key: "records",
                    tab: "\u6211\u7684\u8BB0\u5F55"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "leave",
                    tab: "\u8BF7\u5047\u7533\u8BF7"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "overtime",
                    tab: "\u52A0\u73ED\u7533\u62A5"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "self-report",
                    tab: "\u81EA\u8865\u52A0\u73ED"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "notifications",
                    tab: "\u52A0\u73ED\u901A\u77E5"
                  }),
                  isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                    key: "notify-create",
                    tab: "\u53D1\u8D77\u901A\u77E5"
                  })) : createCommentVNode("", true),
                  isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                    key: "notify-initiated",
                    tab: "\u5DF2\u53D1\u8D77"
                  })) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["activeKey", "onUpdate:activeKey"]),
              activeTab.value === "records" ? (openBlock(), createBlock(_component_a_table, {
                key: 0,
                columns: recordColumns,
                "data-source": records.value,
                loading: loadingRecords.value,
                pagination: { pageSize: 20, showTotal: (t) => `\u5171 ${t} \u6761` },
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "submitTime" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(formatDate(record.submitTime)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "summary" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                    createTextVNode(toDisplayString(getSummary(record)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                    key: 2,
                    color: statusColor(record.status)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(statusLabel(record.status)), 1)
                    ]),
                    _: 2
                  }, 1032, ["color"])) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                    key: 3,
                    type: "link",
                    size: "small",
                    onClick: ($event) => viewRecord(record)
                  }, {
                    default: withCtx(() => [
                      createTextVNode("\u67E5\u770B")
                    ]),
                    _: 1
                  }, 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["data-source", "loading", "pagination"])) : createCommentVNode("", true),
              activeTab.value === "leave" ? (openBlock(), createBlock(_component_a_form, {
                key: 1,
                model: leaveForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitLeave
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u5047\u79CD",
                    name: "leaveType",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5047\u79CD" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: leaveForm.value.leaveType,
                        "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                        placeholder: "\u8BF7\u9009\u62E9"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "\u4E8B\u5047" }, {
                            default: withCtx(() => [
                              createTextVNode("\u4E8B\u5047")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "\u75C5\u5047" }, {
                            default: withCtx(() => [
                              createTextVNode("\u75C5\u5047")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "\u5E74\u5047" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5E74\u5047")
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u5F00\u59CB\u65E5\u671F",
                    name: "startDate",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65E5\u671F" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: leaveForm.value.startDate,
                        "onUpdate:value": ($event) => leaveForm.value.startDate = $event,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u7ED3\u675F\u65E5\u671F",
                    name: "endDate",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65E5\u671F" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: leaveForm.value.endDate,
                        "onUpdate:value": ($event) => leaveForm.value.endDate = $event,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u8BF7\u5047\u539F\u56E0",
                    name: "reason",
                    rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: leaveForm.value.reason,
                        "onUpdate:value": ($event) => leaveForm.value.reason = $event,
                        rows: 3
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "primary",
                        "html-type": "submit",
                        loading: submittingLeave.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])) : createCommentVNode("", true),
              activeTab.value === "overtime" ? (openBlock(), createBlock(_component_a_form, {
                key: 2,
                model: overtimeForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitOvertime
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u65E5\u671F",
                    name: "date",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: overtimeForm.value.date,
                        "onUpdate:value": ($event) => overtimeForm.value.date = $event,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u5F00\u59CB\u65F6\u95F4",
                    name: "startTime",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_time_picker, {
                        value: overtimeForm.value.startTime,
                        "onUpdate:value": ($event) => overtimeForm.value.startTime = $event,
                        format: "HH:mm",
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u7ED3\u675F\u65F6\u95F4",
                    name: "endTime",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_time_picker, {
                        value: overtimeForm.value.endTime,
                        "onUpdate:value": ($event) => overtimeForm.value.endTime = $event,
                        format: "HH:mm",
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u7C7B\u578B",
                    name: "overtimeType"
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: overtimeForm.value.overtimeType,
                        "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                        placeholder: "\u8BF7\u9009\u62E9"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "\u5468\u672B\u52A0\u73ED" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5468\u672B\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "\u8282\u5047\u65E5\u52A0\u73ED" }, {
                            default: withCtx(() => [
                              createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "\u5DE5\u4F5C\u65E5\u52A0\u73ED" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u8BF4\u660E",
                    name: "reason"
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: overtimeForm.value.reason,
                        "onUpdate:value": ($event) => overtimeForm.value.reason = $event,
                        rows: 3
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "primary",
                        "html-type": "submit",
                        loading: submittingOvertime.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" \u63D0\u4EA4\u7533\u62A5 ")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])) : createCommentVNode("", true),
              activeTab.value === "self-report" ? (openBlock(), createBlock(_component_a_form, {
                key: 3,
                model: selfReportForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitSelfReport
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u65E5\u671F",
                    name: "date",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: selfReportForm.value.date,
                        "onUpdate:value": ($event) => selfReportForm.value.date = $event,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u5F00\u59CB\u65F6\u95F4",
                    name: "startTime",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u5F00\u59CB\u65F6\u95F4" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_time_picker, {
                        value: selfReportForm.value.startTime,
                        "onUpdate:value": ($event) => selfReportForm.value.startTime = $event,
                        format: "HH:mm",
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u7ED3\u675F\u65F6\u95F4",
                    name: "endTime",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7ED3\u675F\u65F6\u95F4" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_time_picker, {
                        value: selfReportForm.value.endTime,
                        "onUpdate:value": ($event) => selfReportForm.value.endTime = $event,
                        format: "HH:mm",
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u7C7B\u578B",
                    name: "overtimeType",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: selfReportForm.value.overtimeType,
                        "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                        placeholder: "\u8BF7\u9009\u62E9"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5468\u672B\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u8865\u7533\u62A5\u539F\u56E0",
                    name: "reason",
                    rules: [{ required: true, message: "\u8BF7\u586B\u5199\u539F\u56E0" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: selfReportForm.value.reason,
                        "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                        rows: 3,
                        placeholder: "\u8BF7\u8BF4\u660E\u672A\u80FD\u53CA\u65F6\u7533\u62A5\u7684\u539F\u56E0"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "primary",
                        "html-type": "submit",
                        loading: submittingSelfReport.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" \u63D0\u4EA4\u7533\u8BF7 ")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])) : createCommentVNode("", true),
              activeTab.value === "notifications" ? (openBlock(), createBlock(_component_a_table, {
                key: 4,
                columns: notifColumns,
                "data-source": notifications.value,
                loading: loadingNotifs.value,
                pagination: { pageSize: 20 },
                "row-key": "notification.id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "date" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(record.notification.overtimeDate), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "type" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                    createTextVNode(toDisplayString(overtimeTypeLabel(record.notification.overtimeType)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "content" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                    createTextVNode(toDisplayString(record.notification.content), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "status" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                    record.myResponse ? (openBlock(), createBlock(_component_a_tag, {
                      key: 0,
                      color: record.myResponse.accepted ? "success" : "error"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.myResponse.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: "processing"
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u5F85\u54CD\u5E94")
                      ]),
                      _: 1
                    }))
                  ], 64)) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                    !record.myResponse && record.notification.status !== "ARCHIVED" ? (openBlock(), createBlock(_component_a_space, { key: 0 }, {
                      default: withCtx(() => [
                        createVNode(_component_a_button, {
                          size: "small",
                          type: "primary",
                          onClick: ($event) => respondNotif(record.notification.id, true, "")
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u786E\u8BA4")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_a_button, {
                          size: "small",
                          danger: "",
                          onClick: ($event) => openRejectModal(record.notification.id)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u62D2\u7EDD")
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ]),
                      _: 2
                    }, 1024)) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "text-muted"
                    }, "\u2014"))
                  ], 64)) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["data-source", "loading"])) : createCommentVNode("", true),
              activeTab.value === "notify-create" ? (openBlock(), createBlock(_component_a_form, {
                key: 5,
                model: notifyForm.value,
                layout: "vertical",
                style: { "max-width": "480px" },
                onFinish: submitNotification
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u65E5\u671F",
                    name: "overtimeDate",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u65E5\u671F" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: notifyForm.value.overtimeDate,
                        "onUpdate:value": ($event) => notifyForm.value.overtimeDate = $event,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u52A0\u73ED\u7C7B\u578B",
                    name: "overtimeType",
                    rules: [{ required: true, message: "\u8BF7\u9009\u62E9\u7C7B\u578B" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: notifyForm.value.overtimeType,
                        "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                        placeholder: "\u8BF7\u9009\u62E9"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5DE5\u4F5C\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5468\u672B\u52A0\u73ED")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("\u8282\u5047\u65E5\u52A0\u73ED")
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, {
                    label: "\u901A\u77E5\u5185\u5BB9",
                    name: "content",
                    rules: [{ required: true, message: "\u8BF7\u586B\u5199\u901A\u77E5\u5185\u5BB9" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: notifyForm.value.content,
                        "onUpdate:value": ($event) => notifyForm.value.content = $event,
                        rows: 3,
                        placeholder: "\u8BF4\u660E\u52A0\u73ED\u5B89\u6392\u3001\u8981\u6C42\u7B49"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "primary",
                        "html-type": "submit",
                        loading: submittingNotification.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" \u53D1\u9001\u901A\u77E5 ")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])) : createCommentVNode("", true),
              activeTab.value === "notify-initiated" ? (openBlock(), createBlock(_component_a_table, {
                key: 6,
                columns: initiatedColumns,
                "data-source": initiatedNotifs.value,
                loading: loadingInitiated.value,
                pagination: { pageSize: 20 },
                "row-key": "notification.id",
                size: "small",
                "expand-row-by-click": true
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "date" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(record.notification.overtimeDate), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "type" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                    createTextVNode(toDisplayString(overtimeTypeLabel(record.notification.overtimeType)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "content" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                    createTextVNode(toDisplayString(record.notification.content), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                    key: 3,
                    color: notifStatusColor(record.notification.status)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(notifStatusLabel(record.notification.status)), 1)
                    ]),
                    _: 2
                  }, 1032, ["color"])) : createCommentVNode("", true),
                  column.key === "responseCount" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                    createTextVNode(toDisplayString(record.responses.length) + " \u4EBA\u54CD\u5E94 ", 1)
                  ], 64)) : createCommentVNode("", true)
                ]),
                expandedRowRender: withCtx(({ record }) => [
                  record.responses.length === 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "no-response-tip"
                  }, "\u6682\u65E0\u54CD\u5E94")) : (openBlock(), createBlock(_component_a_table, {
                    key: 1,
                    columns: responseDetailColumns,
                    "data-source": record.responses,
                    pagination: false,
                    "row-key": "id",
                    size: "small"
                  }, {
                    bodyCell: withCtx(({ column: col, record: resp }) => [
                      col.key === "accepted" ? (openBlock(), createBlock(_component_a_tag, {
                        key: 0,
                        color: resp.accepted ? "success" : "error"
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(resp.accepted ? "\u5DF2\u786E\u8BA4" : "\u5DF2\u62D2\u7EDD"), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(toDisplayString(resp.rejectReason || "\u2014"), 1)
                      ], 64)) : createCommentVNode("", true)
                    ]),
                    _: 1
                  }, 8, ["data-source"]))
                ]),
                _: 1
              }, 8, ["data-source", "loading"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: rejectModalVisible.value,
        "onUpdate:open": ($event) => rejectModalVisible.value = $event,
        title: "\u62D2\u7EDD\u539F\u56E0",
        onOk: confirmReject,
        "ok-text": "\u786E\u8BA4\u62D2\u7EDD",
        "cancel-text": "\u53D6\u6D88"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_textarea, {
              value: rejectReason.value,
              "onUpdate:value": ($event) => rejectReason.value = $event,
              placeholder: "\u8BF7\u586B\u5199\u62D2\u7EDD\u539F\u56E0\uFF08\u5FC5\u586B\uFF09",
              rows: 3
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_textarea, {
                value: rejectReason.value,
                "onUpdate:value": ($event) => rejectReason.value = $event,
                placeholder: "\u8BF7\u586B\u5199\u62D2\u7EDD\u539F\u56E0\uFF08\u5FC5\u586B\uFF09",
                rows: 3
              }, null, 8, ["value", "onUpdate:value"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: detailVisible.value,
        "onUpdate:open": ($event) => detailVisible.value = $event,
        title: selectedRecord.value ? `${selectedRecord.value.formTypeName} \xB7 \u8BE6\u60C5` : "\u8BE6\u60C5",
        width: "500px",
        footer: null
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (selectedRecord.value) {
              _push2(`<div class="record-detail" data-v-b41651d7${_scopeId}>`);
              _push2(ssrRenderComponent(_component_a_descriptions, {
                column: 2,
                size: "small",
                bordered: ""
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u7C7B\u578B" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(selectedRecord.value.formTypeName)}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_tag, {
                            color: statusColor(selectedRecord.value.status)
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(statusLabel(selectedRecord.value.status))}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(statusLabel(selectedRecord.value.status)), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_tag, {
                              color: statusColor(selectedRecord.value.status)
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(statusLabel(selectedRecord.value.status)), 1)
                              ]),
                              _: 1
                            }, 8, ["color"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_descriptions_item, {
                      label: "\u63D0\u4EA4\u65F6\u95F4",
                      span: 2
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(formatDate(selectedRecord.value.submitTime))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(formatDate(selectedRecord.value.submitTime)), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<!--[-->`);
                    ssrRenderList(selectedRecord.value.formData, (val, key) => {
                      _push3(ssrRenderComponent(_component_a_descriptions_item, {
                        label: String(key),
                        span: 2
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(String(val != null ? val : "\u2014"))}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(String(val != null ? val : "\u2014")), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    });
                    _push3(`<!--]-->`);
                    if (selectedRecord.value.remark) {
                      _push3(ssrRenderComponent(_component_a_descriptions_item, {
                        label: "\u5907\u6CE8",
                        span: 2
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(selectedRecord.value.remark)}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(selectedRecord.value.remark), 1)
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                    } else {
                      _push3(`<!---->`);
                    }
                  } else {
                    return [
                      createVNode(_component_a_descriptions_item, { label: "\u7C7B\u578B" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                        default: withCtx(() => [
                          createVNode(_component_a_tag, {
                            color: statusColor(selectedRecord.value.status)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(statusLabel(selectedRecord.value.status)), 1)
                            ]),
                            _: 1
                          }, 8, ["color"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, {
                        label: "\u63D0\u4EA4\u65F6\u95F4",
                        span: 2
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(formatDate(selectedRecord.value.submitTime)), 1)
                        ]),
                        _: 1
                      }),
                      (openBlock(true), createBlock(Fragment, null, renderList(selectedRecord.value.formData, (val, key) => {
                        return openBlock(), createBlock(_component_a_descriptions_item, {
                          key,
                          label: String(key),
                          span: 2
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(String(val != null ? val : "\u2014")), 1)
                          ]),
                          _: 2
                        }, 1032, ["label"]);
                      }), 128)),
                      selectedRecord.value.remark ? (openBlock(), createBlock(_component_a_descriptions_item, {
                        key: 0,
                        label: "\u5907\u6CE8",
                        span: 2
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.remark), 1)
                        ]),
                        _: 1
                      })) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              selectedRecord.value ? (openBlock(), createBlock("div", {
                key: 0,
                class: "record-detail"
              }, [
                createVNode(_component_a_descriptions, {
                  column: 2,
                  size: "small",
                  bordered: ""
                }, {
                  default: withCtx(() => [
                    createVNode(_component_a_descriptions_item, { label: "\u7C7B\u578B" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_tag, {
                          color: statusColor(selectedRecord.value.status)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(statusLabel(selectedRecord.value.status)), 1)
                          ]),
                          _: 1
                        }, 8, ["color"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, {
                      label: "\u63D0\u4EA4\u65F6\u95F4",
                      span: 2
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(formatDate(selectedRecord.value.submitTime)), 1)
                      ]),
                      _: 1
                    }),
                    (openBlock(true), createBlock(Fragment, null, renderList(selectedRecord.value.formData, (val, key) => {
                      return openBlock(), createBlock(_component_a_descriptions_item, {
                        key,
                        label: String(key),
                        span: 2
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(String(val != null ? val : "\u2014")), 1)
                        ]),
                        _: 2
                      }, 1032, ["label"]);
                    }), 128)),
                    selectedRecord.value.remark ? (openBlock(), createBlock(_component_a_descriptions_item, {
                      key: 0,
                      label: "\u5907\u6CE8",
                      span: 2
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.remark), 1)
                      ]),
                      _: 1
                    })) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/attendance/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b41651d7"]]);

export { index as default };
//# sourceMappingURL=index-BnziyUK0.mjs.map
