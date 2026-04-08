import { defineComponent, computed, ref, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { message } from 'ant-design-vue';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { _ as _export_sfc } from './server.mjs';
import { C as Card, a as Tabs, b as TabPane, S as Spin } from '../_/index.mjs';
import { B as Button } from '../_/collapseMotion.mjs';
import { T as Table, S as Select } from '../_/index3.mjs';
import { T as Tag } from '../_/index9.mjs';
import { F as Form, a as FormItem } from '../_/index7.mjs';
import { S as Space } from '../_/index15.mjs';
import { D as Divider } from '../_/index16.mjs';
import { A as Alert } from '../_/index8.mjs';
import { L as List, a as ListItem, b as ListItemMeta } from '../_/index18.mjs';
import { M as Modal } from '../_/index11.mjs';
import { I as Input, T as Textarea } from '../_/index5.mjs';
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
import '@babel/runtime/helpers/esm/objectSpread2';
import '@babel/runtime/helpers/esm/extends';
import '../_/index4.mjs';
import 'lodash-es/uniq';
import '@ctrl/tinycolor';
import '../_/useRefs.mjs';
import 'lodash-es/pick';
import 'lodash-es/isPlainObject';
import 'throttle-debounce';
import 'lodash-es/debounce';
import 'resize-observer-polyfill';
import 'dom-align';
import 'lodash-es/isEqual';
import '@ant-design/colors';
import 'stylis';
import 'vue-types';
import 'lodash-es';
import 'lodash-es/fromPairs';
import '../_/index6.mjs';
import '../_/CheckOutlined.mjs';
import '../_/useBreakpoint.mjs';
import '../_/ExclamationCircleFilled.mjs';
import 'lodash-es/cloneDeep';
import '../_/useFlexGapSupport.mjs';
import 'async-validator';
import 'lodash-es/find';
import 'compute-scroll-into-view';
import 'lodash-es/intersection';
import 'lodash-es/omit';
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const role = computed(() => {
      var _a, _b;
      return (_b = (_a = userStore.userInfo) == null ? void 0 : _a.role) != null ? _b : "";
    });
    const isFinanceOrCeo = computed(() => ["finance", "ceo"].includes(role.value));
    const activeTab = ref("cycles");
    const cycles = ref([]);
    const loadingCycles = ref(false);
    const showCreateCycleModal = ref(false);
    const creatingCycle = ref(false);
    const createCycleForm = ref({ period: "" });
    const selectedCycleId = ref(null);
    const precheckLoading = ref(false);
    const settleLoading = ref(false);
    const precheckResult = ref(null);
    const precheckPassed = computed(
      () => precheckResult.value !== null && precheckResult.value.every((i) => i.pass)
    );
    const slips = ref([]);
    const loadingSlips = ref(false);
    const selectedCycleIdForSlips = ref(null);
    const showSlipDetail = ref(false);
    const slipDetail = ref(null);
    const loadingSlipDetail = ref(false);
    const confirmingSlip = ref(false);
    const disputingSlip = ref(false);
    const showDisputeInput = ref(false);
    const disputeReason = ref("");
    const cycleColumns = [
      { title: "\u5468\u671F", dataIndex: "period", key: "period" },
      { title: "\u72B6\u6001", dataIndex: "status", key: "status" },
      { title: "\u7533\u62A5\u7A97\u53E3\u622A\u6B62", dataIndex: "windowEndDate", key: "windowEndDate" },
      { title: "\u53D1\u85AA\u65E5", dataIndex: "payDate", key: "payDate" },
      { title: "\u64CD\u4F5C", key: "action" }
    ];
    const financeSlipColumns = [
      { title: "\u5DE5\u8D44\u6761 ID", dataIndex: "id", key: "id" },
      { title: "\u5458\u5DE5 ID", dataIndex: "employeeId", key: "employeeId" },
      { title: "\u72B6\u6001", dataIndex: "status", key: "status" },
      { title: "\u5B9E\u53D1", dataIndex: "netPay", key: "netPay" },
      { title: "\u64CD\u4F5C", key: "action" }
    ];
    function onTabChange(key) {
      activeTab.value = key;
      if (key === "cycles" && cycles.value.length === 0) loadCycles();
      if (key === "slips" && cycles.value.length === 0) loadCycles();
    }
    async function loadCycles() {
      loadingCycles.value = true;
      try {
        const data = await request({ url: "/payroll/cycles" });
        cycles.value = data;
      } catch {
        message.error("\u52A0\u8F7D\u5468\u671F\u5217\u8868\u5931\u8D25");
      } finally {
        loadingCycles.value = false;
      }
    }
    async function doCreateCycle() {
      var _a, _b;
      const period = createCycleForm.value.period.trim();
      if (!period) {
        message.warning("\u8BF7\u586B\u5199\u5468\u671F\uFF0C\u683C\u5F0F\uFF1AYYYY-MM");
        return;
      }
      creatingCycle.value = true;
      try {
        await request({ url: "/payroll/cycles", method: "POST", body: { period } });
        message.success("\u5468\u671F\u521B\u5EFA\u6210\u529F");
        showCreateCycleModal.value = false;
        createCycleForm.value.period = "";
        await loadCycles();
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u521B\u5EFA\u5931\u8D25");
      } finally {
        creatingCycle.value = false;
      }
    }
    async function doOpenWindow(cycleId) {
      var _a, _b;
      try {
        await request({ url: `/payroll/cycles/${cycleId}/open-window`, method: "POST" });
        message.success("\u7533\u62A5\u7A97\u53E3\u5DF2\u5F00\u653E");
        await loadCycles();
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u64CD\u4F5C\u5931\u8D25");
      }
    }
    function selectCycleForSettle(cycle) {
      selectedCycleId.value = cycle.id;
      activeTab.value = "settle";
      precheckResult.value = null;
    }
    async function doPrecheck() {
      var _a, _b;
      if (!selectedCycleId.value) return;
      precheckLoading.value = true;
      precheckResult.value = null;
      try {
        const res = await request({
          url: `/payroll/cycles/${selectedCycleId.value}/precheck`,
          method: "POST"
        });
        precheckResult.value = res.items;
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u9884\u68C0\u8BF7\u6C42\u5931\u8D25");
      } finally {
        precheckLoading.value = false;
      }
    }
    async function doSettle() {
      var _a, _b;
      if (!selectedCycleId.value || !precheckPassed.value) return;
      settleLoading.value = true;
      try {
        await request({ url: `/payroll/cycles/${selectedCycleId.value}/settle`, method: "POST" });
        message.success("\u7ED3\u7B97\u5B8C\u6210");
        precheckResult.value = null;
        selectedCycleId.value = null;
        await loadCycles();
        activeTab.value = "cycles";
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u7ED3\u7B97\u5931\u8D25");
      } finally {
        settleLoading.value = false;
      }
    }
    async function loadSlipsByCycle() {
      if (!selectedCycleIdForSlips.value) return;
      loadingSlips.value = true;
      try {
        const data = await request({
          url: `/payroll/slips?cycleId=${selectedCycleIdForSlips.value}`
        });
        slips.value = data;
      } catch {
        message.error("\u52A0\u8F7D\u5DE5\u8D44\u6761\u5931\u8D25");
      } finally {
        loadingSlips.value = false;
      }
    }
    async function loadMySlips() {
      loadingSlips.value = true;
      try {
        const data = await request({ url: "/payroll/slips" });
        slips.value = data;
      } catch {
        message.error("\u52A0\u8F7D\u5DE5\u8D44\u6761\u5931\u8D25");
      } finally {
        loadingSlips.value = false;
      }
    }
    async function openSlipDetail(slip) {
      showSlipDetail.value = true;
      slipDetail.value = null;
      showDisputeInput.value = false;
      disputeReason.value = "";
      loadingSlipDetail.value = true;
      try {
        const detail = await request({ url: `/payroll/slips/${slip.id}` });
        slipDetail.value = detail;
      } catch {
        message.error("\u52A0\u8F7D\u5DE5\u8D44\u6761\u8BE6\u60C5\u5931\u8D25");
        showSlipDetail.value = false;
      } finally {
        loadingSlipDetail.value = false;
      }
    }
    async function doConfirm() {
      var _a, _b;
      if (!slipDetail.value) return;
      confirmingSlip.value = true;
      try {
        const res = await request({
          url: `/payroll/slips/${slipDetail.value.slip.id}/confirm`,
          method: "POST"
        });
        slipDetail.value.slip.status = res.slip.status;
        message.success("\u5DE5\u8D44\u6761\u5DF2\u786E\u8BA4");
        await loadMySlips();
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u786E\u8BA4\u5931\u8D25");
      } finally {
        confirmingSlip.value = false;
      }
    }
    async function doDispute() {
      var _a, _b;
      if (!slipDetail.value || !disputeReason.value.trim()) return;
      disputingSlip.value = true;
      try {
        const res = await request({
          url: `/payroll/slips/${slipDetail.value.slip.id}/dispute`,
          method: "POST",
          body: { reason: disputeReason.value.trim() }
        });
        slipDetail.value.slip.status = res.slip.status;
        showDisputeInput.value = false;
        disputeReason.value = "";
        message.success("\u5F02\u8BAE\u5DF2\u63D0\u4EA4");
        await loadMySlips();
      } catch (e) {
        const err = e;
        message.error((_b = (_a = err.data) == null ? void 0 : _a.message) != null ? _b : "\u63D0\u4EA4\u5F02\u8BAE\u5931\u8D25");
      } finally {
        disputingSlip.value = false;
      }
    }
    const cycleOptions = computed(
      () => cycles.value.map((c) => ({ label: c.period, value: c.id }))
    );
    const settleableCycles = computed(
      () => cycles.value.filter((c) => ["OPEN", "WINDOW_OPEN", "WINDOW_CLOSED"].includes(c.status)).map((c) => ({ label: `${c.period}\uFF08${cycleStatusLabel(c.status)}\uFF09`, value: c.id }))
    );
    function formatAmount(val) {
      const n = Number(val != null ? val : 0);
      return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function cycleStatusLabel(status) {
      var _a;
      return (_a = {
        OPEN: "\u5F85\u5904\u7406",
        WINDOW_OPEN: "\u7533\u62A5\u4E2D",
        WINDOW_CLOSED: "\u7A97\u53E3\u5DF2\u5173\u95ED",
        SETTLED: "\u5DF2\u7ED3\u7B97",
        LOCKED: "\u5DF2\u9501\u5B9A"
      }[status]) != null ? _a : status;
    }
    function cycleStatusColor(status) {
      var _a;
      return (_a = {
        OPEN: "default",
        WINDOW_OPEN: "blue",
        WINDOW_CLOSED: "orange",
        SETTLED: "green",
        LOCKED: "purple"
      }[status]) != null ? _a : "default";
    }
    function slipStatusLabel(status) {
      var _a;
      return (_a = {
        DRAFT: "\u8349\u7A3F",
        PUBLISHED: "\u5F85\u786E\u8BA4",
        CONFIRMED: "\u5DF2\u786E\u8BA4",
        DISPUTED: "\u5F02\u8BAE\u4E2D",
        SUPERSEDED: "\u5DF2\u66F4\u6B63"
      }[status]) != null ? _a : status;
    }
    function slipStatusColor(status) {
      var _a;
      return (_a = {
        DRAFT: "default",
        PUBLISHED: "blue",
        CONFIRMED: "green",
        DISPUTED: "red",
        SUPERSEDED: "default"
      }[status]) != null ? _a : "default";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_tabs = Tabs;
      const _component_a_tab_pane = TabPane;
      const _component_a_button = Button;
      const _component_a_table = Table;
      const _component_a_tag = Tag;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_select = Select;
      const _component_a_space = Space;
      const _component_a_divider = Divider;
      const _component_a_alert = Alert;
      const _component_a_list = List;
      const _component_a_list_item = ListItem;
      const _component_a_list_item_meta = ListItemMeta;
      const _component_a_modal = Modal;
      const _component_a_input = Input;
      const _component_a_descriptions = Descriptions;
      const _component_a_descriptions_item = DescriptionsItem;
      const _component_a_textarea = Textarea;
      const _component_a_spin = Spin;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "payroll-page" }, _attrs))} data-v-774cc202><h2 class="page-title" data-v-774cc202>\u85AA\u8D44\u7BA1\u7406</h2>`);
      if (isFinanceOrCeo.value) {
        _push(ssrRenderComponent(_component_a_card, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            var _a, _b;
            if (_push2) {
              _push2(ssrRenderComponent(_component_a_tabs, {
                activeKey: activeTab.value,
                "onUpdate:activeKey": ($event) => activeTab.value = $event,
                onChange: (key) => onTabChange(String(key))
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "cycles",
                      tab: "\u5468\u671F\u7BA1\u7406"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "settle",
                      tab: "\u7ED3\u7B97\u64CD\u4F5C"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "slips",
                      tab: "\u5DE5\u8D44\u6761\u67E5\u770B"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_tab_pane, {
                        key: "cycles",
                        tab: "\u5468\u671F\u7BA1\u7406"
                      }),
                      createVNode(_component_a_tab_pane, {
                        key: "settle",
                        tab: "\u7ED3\u7B97\u64CD\u4F5C"
                      }),
                      createVNode(_component_a_tab_pane, {
                        key: "slips",
                        tab: "\u5DE5\u8D44\u6761\u67E5\u770B"
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              if (activeTab.value === "cycles") {
                _push2(`<!--[--><div class="tab-actions" style="${ssrRenderStyle({ "margin-bottom": "12px" })}" data-v-774cc202${_scopeId}>`);
                _push2(ssrRenderComponent(_component_a_button, {
                  type: "primary",
                  onClick: ($event) => showCreateCycleModal.value = true
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`+ \u521B\u5EFA\u5468\u671F`);
                    } else {
                      return [
                        createTextVNode("+ \u521B\u5EFA\u5468\u671F")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_a_button, {
                  style: { "margin-left": "8px" },
                  onClick: loadCycles,
                  loading: loadingCycles.value
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`\u5237\u65B0`);
                    } else {
                      return [
                        createTextVNode("\u5237\u65B0")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div>`);
                _push2(ssrRenderComponent(_component_a_table, {
                  columns: cycleColumns,
                  "data-source": cycles.value,
                  loading: loadingCycles.value,
                  "row-key": "id",
                  size: "small",
                  pagination: { pageSize: 10 }
                }, {
                  bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      if (column.key === "status") {
                        _push3(ssrRenderComponent(_component_a_tag, {
                          color: cycleStatusColor(record.status)
                        }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`${ssrInterpolate(cycleStatusLabel(record.status))}`);
                            } else {
                              return [
                                createTextVNode(toDisplayString(cycleStatusLabel(record.status)), 1)
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(`<!---->`);
                      }
                      if (column.key === "action") {
                        _push3(`<!--[-->`);
                        if (record.status === "OPEN") {
                          _push3(ssrRenderComponent(_component_a_button, {
                            type: "link",
                            size: "small",
                            onClick: ($event) => doOpenWindow(record.id)
                          }, {
                            default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                              if (_push4) {
                                _push4(`\u5F00\u653E\u7533\u62A5\u7A97\u53E3`);
                              } else {
                                return [
                                  createTextVNode("\u5F00\u653E\u7533\u62A5\u7A97\u53E3")
                                ];
                              }
                            }),
                            _: 2
                          }, _parent3, _scopeId2));
                        } else {
                          _push3(`<!---->`);
                        }
                        if (["OPEN", "WINDOW_OPEN", "WINDOW_CLOSED"].includes(record.status)) {
                          _push3(ssrRenderComponent(_component_a_button, {
                            type: "link",
                            size: "small",
                            onClick: ($event) => selectCycleForSettle(record)
                          }, {
                            default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                              if (_push4) {
                                _push4(`\u7ED3\u7B97`);
                              } else {
                                return [
                                  createTextVNode("\u7ED3\u7B97")
                                ];
                              }
                            }),
                            _: 2
                          }, _parent3, _scopeId2));
                        } else {
                          _push3(`<!---->`);
                        }
                        _push3(`<!--]-->`);
                      } else {
                        _push3(`<!---->`);
                      }
                    } else {
                      return [
                        column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                          key: 0,
                          color: cycleStatusColor(record.status)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(cycleStatusLabel(record.status)), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])) : createCommentVNode("", true),
                        column.key === "action" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                          record.status === "OPEN" ? (openBlock(), createBlock(_component_a_button, {
                            key: 0,
                            type: "link",
                            size: "small",
                            onClick: ($event) => doOpenWindow(record.id)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u5F00\u653E\u7533\u62A5\u7A97\u53E3")
                            ]),
                            _: 1
                          }, 8, ["onClick"])) : createCommentVNode("", true),
                          ["OPEN", "WINDOW_OPEN", "WINDOW_CLOSED"].includes(record.status) ? (openBlock(), createBlock(_component_a_button, {
                            key: 1,
                            type: "link",
                            size: "small",
                            onClick: ($event) => selectCycleForSettle(record)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u7ED3\u7B97")
                            ]),
                            _: 1
                          }, 8, ["onClick"])) : createCommentVNode("", true)
                        ], 64)) : createCommentVNode("", true)
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              if (activeTab.value === "settle") {
                _push2(`<div style="${ssrRenderStyle({ "max-width": "480px", "margin-top": "8px" })}" data-v-774cc202${_scopeId}>`);
                _push2(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_a_form_item, { label: "\u9009\u62E9\u5468\u671F" }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          var _a2, _b2;
                          if (_push4) {
                            _push4(ssrRenderComponent(_component_a_select, {
                              value: (_a2 = selectedCycleId.value) != null ? _a2 : void 0,
                              placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                              options: settleableCycles.value,
                              loading: loadingCycles.value,
                              onChange: (v) => {
                                selectedCycleId.value = v;
                                precheckResult.value = null;
                              }
                            }, null, _parent4, _scopeId3));
                          } else {
                            return [
                              createVNode(_component_a_select, {
                                value: (_b2 = selectedCycleId.value) != null ? _b2 : void 0,
                                placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                                options: settleableCycles.value,
                                loading: loadingCycles.value,
                                onChange: (v) => {
                                  selectedCycleId.value = v;
                                  precheckResult.value = null;
                                }
                              }, null, 8, ["value", "options", "loading", "onChange"])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                    } else {
                      return [
                        createVNode(_component_a_form_item, { label: "\u9009\u62E9\u5468\u671F" }, {
                          default: withCtx(() => {
                            var _a2;
                            return [
                              createVNode(_component_a_select, {
                                value: (_a2 = selectedCycleId.value) != null ? _a2 : void 0,
                                placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                                options: settleableCycles.value,
                                loading: loadingCycles.value,
                                onChange: (v) => {
                                  selectedCycleId.value = v;
                                  precheckResult.value = null;
                                }
                              }, null, 8, ["value", "options", "loading", "onChange"])
                            ];
                          }),
                          _: 1
                        })
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_a_space, null, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_a_button, {
                        disabled: !selectedCycleId.value,
                        loading: precheckLoading.value,
                        onClick: doPrecheck
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u9884\u7ED3\u7B97\u68C0\u67E5`);
                          } else {
                            return [
                              createTextVNode("\u9884\u7ED3\u7B97\u68C0\u67E5")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_a_button, {
                        type: "primary",
                        disabled: !selectedCycleId.value || !precheckPassed.value,
                        loading: settleLoading.value,
                        onClick: doSettle
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u6B63\u5F0F\u7ED3\u7B97`);
                          } else {
                            return [
                              createTextVNode("\u6B63\u5F0F\u7ED3\u7B97")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                    } else {
                      return [
                        createVNode(_component_a_button, {
                          disabled: !selectedCycleId.value,
                          loading: precheckLoading.value,
                          onClick: doPrecheck
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u9884\u7ED3\u7B97\u68C0\u67E5")
                          ]),
                          _: 1
                        }, 8, ["disabled", "loading"]),
                        createVNode(_component_a_button, {
                          type: "primary",
                          disabled: !selectedCycleId.value || !precheckPassed.value,
                          loading: settleLoading.value,
                          onClick: doSettle
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u6B63\u5F0F\u7ED3\u7B97")
                          ]),
                          _: 1
                        }, 8, ["disabled", "loading"])
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                if (precheckResult.value !== null) {
                  _push2(`<!--[-->`);
                  _push2(ssrRenderComponent(_component_a_divider, null, null, _parent2, _scopeId));
                  _push2(ssrRenderComponent(_component_a_alert, {
                    type: precheckPassed.value ? "success" : "warning",
                    message: precheckPassed.value ? "\u6240\u6709\u68C0\u67E5\u9879\u901A\u8FC7\uFF0C\u53EF\u6267\u884C\u7ED3\u7B97" : "\u5B58\u5728\u672A\u901A\u8FC7\u68C0\u67E5\u9879",
                    "show-icon": "",
                    style: { "margin-bottom": "12px" }
                  }, null, _parent2, _scopeId));
                  _push2(ssrRenderComponent(_component_a_list, {
                    size: "small",
                    "data-source": precheckResult.value
                  }, {
                    renderItem: withCtx(({ item }, _push3, _parent3, _scopeId2) => {
                      if (_push3) {
                        _push3(ssrRenderComponent(_component_a_list_item, null, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(ssrRenderComponent(_component_a_space, null, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`<span style="${ssrRenderStyle({ color: item.pass ? "#52c41a" : "#ff4d4f" })}" data-v-774cc202${_scopeId4}>${ssrInterpolate(item.pass ? "\u2713" : "\u2717")}</span><span data-v-774cc202${_scopeId4}>${ssrInterpolate(item.label)}</span>`);
                                    if (!item.pass) {
                                      _push5(`<span style="${ssrRenderStyle({ "color": "#ff4d4f", "font-size": "12px" })}" data-v-774cc202${_scopeId4}>${ssrInterpolate(item.message)}</span>`);
                                    } else {
                                      _push5(`<!---->`);
                                    }
                                  } else {
                                    return [
                                      createVNode("span", {
                                        style: { color: item.pass ? "#52c41a" : "#ff4d4f" }
                                      }, toDisplayString(item.pass ? "\u2713" : "\u2717"), 5),
                                      createVNode("span", null, toDisplayString(item.label), 1),
                                      !item.pass ? (openBlock(), createBlock("span", {
                                        key: 0,
                                        style: { "color": "#ff4d4f", "font-size": "12px" }
                                      }, toDisplayString(item.message), 1)) : createCommentVNode("", true)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              return [
                                createVNode(_component_a_space, null, {
                                  default: withCtx(() => [
                                    createVNode("span", {
                                      style: { color: item.pass ? "#52c41a" : "#ff4d4f" }
                                    }, toDisplayString(item.pass ? "\u2713" : "\u2717"), 5),
                                    createVNode("span", null, toDisplayString(item.label), 1),
                                    !item.pass ? (openBlock(), createBlock("span", {
                                      key: 0,
                                      style: { "color": "#ff4d4f", "font-size": "12px" }
                                    }, toDisplayString(item.message), 1)) : createCommentVNode("", true)
                                  ]),
                                  _: 2
                                }, 1024)
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        return [
                          createVNode(_component_a_list_item, null, {
                            default: withCtx(() => [
                              createVNode(_component_a_space, null, {
                                default: withCtx(() => [
                                  createVNode("span", {
                                    style: { color: item.pass ? "#52c41a" : "#ff4d4f" }
                                  }, toDisplayString(item.pass ? "\u2713" : "\u2717"), 5),
                                  createVNode("span", null, toDisplayString(item.label), 1),
                                  !item.pass ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    style: { "color": "#ff4d4f", "font-size": "12px" }
                                  }, toDisplayString(item.message), 1)) : createCommentVNode("", true)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1024)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent2, _scopeId));
                  _push2(`<!--]-->`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (activeTab.value === "slips") {
                _push2(`<!--[--><div style="${ssrRenderStyle({ "margin-bottom": "12px" })}" data-v-774cc202${_scopeId}>`);
                _push2(ssrRenderComponent(_component_a_select, {
                  value: (_a = selectedCycleIdForSlips.value) != null ? _a : void 0,
                  placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                  options: cycleOptions.value,
                  loading: loadingCycles.value,
                  style: { "width": "200px", "margin-right": "8px" },
                  onChange: (v) => {
                    selectedCycleIdForSlips.value = v;
                    loadSlipsByCycle();
                  }
                }, null, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_a_button, {
                  loading: loadingSlips.value,
                  onClick: loadSlipsByCycle,
                  disabled: !selectedCycleIdForSlips.value
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`\u67E5\u8BE2`);
                    } else {
                      return [
                        createTextVNode("\u67E5\u8BE2")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</div>`);
                _push2(ssrRenderComponent(_component_a_table, {
                  columns: financeSlipColumns,
                  "data-source": slips.value,
                  loading: loadingSlips.value,
                  "row-key": "id",
                  size: "small"
                }, {
                  bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      if (column.key === "status") {
                        _push3(ssrRenderComponent(_component_a_tag, {
                          color: slipStatusColor(record.status)
                        }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`${ssrInterpolate(slipStatusLabel(record.status))}`);
                            } else {
                              return [
                                createTextVNode(toDisplayString(slipStatusLabel(record.status)), 1)
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(`<!---->`);
                      }
                      if (column.key === "netPay") {
                        _push3(`<!--[--> \xA5${ssrInterpolate(formatAmount(record.netPay))}<!--]-->`);
                      } else {
                        _push3(`<!---->`);
                      }
                      if (column.key === "action") {
                        _push3(ssrRenderComponent(_component_a_button, {
                          type: "link",
                          size: "small",
                          onClick: ($event) => openSlipDetail(record)
                        }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`\u8BE6\u60C5`);
                            } else {
                              return [
                                createTextVNode("\u8BE6\u60C5")
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
                        column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                          key: 0,
                          color: slipStatusColor(record.status)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(slipStatusLabel(record.status)), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])) : createCommentVNode("", true),
                        column.key === "netPay" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                          createTextVNode(" \xA5" + toDisplayString(formatAmount(record.netPay)), 1)
                        ], 64)) : createCommentVNode("", true),
                        column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                          key: 2,
                          type: "link",
                          size: "small",
                          onClick: ($event) => openSlipDetail(record)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u8BE6\u60C5")
                          ]),
                          _: 1
                        }, 8, ["onClick"])) : createCommentVNode("", true)
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                createVNode(_component_a_tabs, {
                  activeKey: activeTab.value,
                  "onUpdate:activeKey": ($event) => activeTab.value = $event,
                  onChange: (key) => onTabChange(String(key))
                }, {
                  default: withCtx(() => [
                    createVNode(_component_a_tab_pane, {
                      key: "cycles",
                      tab: "\u5468\u671F\u7BA1\u7406"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "settle",
                      tab: "\u7ED3\u7B97\u64CD\u4F5C"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "slips",
                      tab: "\u5DE5\u8D44\u6761\u67E5\u770B"
                    })
                  ]),
                  _: 1
                }, 8, ["activeKey", "onUpdate:activeKey", "onChange"]),
                activeTab.value === "cycles" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                  createVNode("div", {
                    class: "tab-actions",
                    style: { "margin-bottom": "12px" }
                  }, [
                    createVNode(_component_a_button, {
                      type: "primary",
                      onClick: ($event) => showCreateCycleModal.value = true
                    }, {
                      default: withCtx(() => [
                        createTextVNode("+ \u521B\u5EFA\u5468\u671F")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_a_button, {
                      style: { "margin-left": "8px" },
                      onClick: loadCycles,
                      loading: loadingCycles.value
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u5237\u65B0")
                      ]),
                      _: 1
                    }, 8, ["loading"])
                  ]),
                  createVNode(_component_a_table, {
                    columns: cycleColumns,
                    "data-source": cycles.value,
                    loading: loadingCycles.value,
                    "row-key": "id",
                    size: "small",
                    pagination: { pageSize: 10 }
                  }, {
                    bodyCell: withCtx(({ column, record }) => [
                      column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                        key: 0,
                        color: cycleStatusColor(record.status)
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(cycleStatusLabel(record.status)), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      column.key === "action" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        record.status === "OPEN" ? (openBlock(), createBlock(_component_a_button, {
                          key: 0,
                          type: "link",
                          size: "small",
                          onClick: ($event) => doOpenWindow(record.id)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u5F00\u653E\u7533\u62A5\u7A97\u53E3")
                          ]),
                          _: 1
                        }, 8, ["onClick"])) : createCommentVNode("", true),
                        ["OPEN", "WINDOW_OPEN", "WINDOW_CLOSED"].includes(record.status) ? (openBlock(), createBlock(_component_a_button, {
                          key: 1,
                          type: "link",
                          size: "small",
                          onClick: ($event) => selectCycleForSettle(record)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u7ED3\u7B97")
                          ]),
                          _: 1
                        }, 8, ["onClick"])) : createCommentVNode("", true)
                      ], 64)) : createCommentVNode("", true)
                    ]),
                    _: 1
                  }, 8, ["data-source", "loading"])
                ], 64)) : createCommentVNode("", true),
                activeTab.value === "settle" ? (openBlock(), createBlock("div", {
                  key: 1,
                  style: { "max-width": "480px", "margin-top": "8px" }
                }, [
                  createVNode(_component_a_form, { layout: "vertical" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_form_item, { label: "\u9009\u62E9\u5468\u671F" }, {
                        default: withCtx(() => {
                          var _a2;
                          return [
                            createVNode(_component_a_select, {
                              value: (_a2 = selectedCycleId.value) != null ? _a2 : void 0,
                              placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                              options: settleableCycles.value,
                              loading: loadingCycles.value,
                              onChange: (v) => {
                                selectedCycleId.value = v;
                                precheckResult.value = null;
                              }
                            }, null, 8, ["value", "options", "loading", "onChange"])
                          ];
                        }),
                        _: 1
                      })
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_space, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        disabled: !selectedCycleId.value,
                        loading: precheckLoading.value,
                        onClick: doPrecheck
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u9884\u7ED3\u7B97\u68C0\u67E5")
                        ]),
                        _: 1
                      }, 8, ["disabled", "loading"]),
                      createVNode(_component_a_button, {
                        type: "primary",
                        disabled: !selectedCycleId.value || !precheckPassed.value,
                        loading: settleLoading.value,
                        onClick: doSettle
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u6B63\u5F0F\u7ED3\u7B97")
                        ]),
                        _: 1
                      }, 8, ["disabled", "loading"])
                    ]),
                    _: 1
                  }),
                  precheckResult.value !== null ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createVNode(_component_a_divider),
                    createVNode(_component_a_alert, {
                      type: precheckPassed.value ? "success" : "warning",
                      message: precheckPassed.value ? "\u6240\u6709\u68C0\u67E5\u9879\u901A\u8FC7\uFF0C\u53EF\u6267\u884C\u7ED3\u7B97" : "\u5B58\u5728\u672A\u901A\u8FC7\u68C0\u67E5\u9879",
                      "show-icon": "",
                      style: { "margin-bottom": "12px" }
                    }, null, 8, ["type", "message"]),
                    createVNode(_component_a_list, {
                      size: "small",
                      "data-source": precheckResult.value
                    }, {
                      renderItem: withCtx(({ item }) => [
                        createVNode(_component_a_list_item, null, {
                          default: withCtx(() => [
                            createVNode(_component_a_space, null, {
                              default: withCtx(() => [
                                createVNode("span", {
                                  style: { color: item.pass ? "#52c41a" : "#ff4d4f" }
                                }, toDisplayString(item.pass ? "\u2713" : "\u2717"), 5),
                                createVNode("span", null, toDisplayString(item.label), 1),
                                !item.pass ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  style: { "color": "#ff4d4f", "font-size": "12px" }
                                }, toDisplayString(item.message), 1)) : createCommentVNode("", true)
                              ]),
                              _: 2
                            }, 1024)
                          ]),
                          _: 2
                        }, 1024)
                      ]),
                      _: 1
                    }, 8, ["data-source"])
                  ], 64)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                activeTab.value === "slips" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                  createVNode("div", { style: { "margin-bottom": "12px" } }, [
                    createVNode(_component_a_select, {
                      value: (_b = selectedCycleIdForSlips.value) != null ? _b : void 0,
                      placeholder: "\u8BF7\u9009\u62E9\u5DE5\u8D44\u5468\u671F",
                      options: cycleOptions.value,
                      loading: loadingCycles.value,
                      style: { "width": "200px", "margin-right": "8px" },
                      onChange: (v) => {
                        selectedCycleIdForSlips.value = v;
                        loadSlipsByCycle();
                      }
                    }, null, 8, ["value", "options", "loading", "onChange"]),
                    createVNode(_component_a_button, {
                      loading: loadingSlips.value,
                      onClick: loadSlipsByCycle,
                      disabled: !selectedCycleIdForSlips.value
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u67E5\u8BE2")
                      ]),
                      _: 1
                    }, 8, ["loading", "disabled"])
                  ]),
                  createVNode(_component_a_table, {
                    columns: financeSlipColumns,
                    "data-source": slips.value,
                    loading: loadingSlips.value,
                    "row-key": "id",
                    size: "small"
                  }, {
                    bodyCell: withCtx(({ column, record }) => [
                      column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                        key: 0,
                        color: slipStatusColor(record.status)
                      }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(slipStatusLabel(record.status)), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      column.key === "netPay" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(" \xA5" + toDisplayString(formatAmount(record.netPay)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                        key: 2,
                        type: "link",
                        size: "small",
                        onClick: ($event) => openSlipDetail(record)
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u8BE6\u60C5")
                        ]),
                        _: 1
                      }, 8, ["onClick"])) : createCommentVNode("", true)
                    ]),
                    _: 1
                  }, 8, ["data-source", "loading"])
                ], 64)) : createCommentVNode("", true)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(ssrRenderComponent(_component_a_card, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div style="${ssrRenderStyle({ "margin-bottom": "12px" })}" data-v-774cc202${_scopeId}><span style="${ssrRenderStyle({ "margin-right": "8px", "font-weight": "500" })}" data-v-774cc202${_scopeId}>\u5DE5\u8D44\u6761</span>`);
              _push2(ssrRenderComponent(_component_a_button, {
                size: "small",
                loading: loadingSlips.value,
                onClick: loadMySlips
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`\u5237\u65B0`);
                  } else {
                    return [
                      createTextVNode("\u5237\u65B0")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
              _push2(ssrRenderComponent(_component_a_list, {
                "data-source": slips.value,
                loading: loadingSlips.value,
                locale: { emptyText: "\u6682\u65E0\u5DE5\u8D44\u6761" }
              }, {
                renderItem: withCtx(({ item }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_list_item, {
                      style: { "cursor": "pointer" },
                      onClick: ($event) => openSlipDetail(item)
                    }, {
                      extra: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "link",
                            size: "small"
                          }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`\u67E5\u770B\u8BE6\u60C5`);
                              } else {
                                return [
                                  createTextVNode("\u67E5\u770B\u8BE6\u60C5")
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small"
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u67E5\u770B\u8BE6\u60C5")
                              ]),
                              _: 1
                            })
                          ];
                        }
                      }),
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_list_item_meta, null, {
                            title: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              var _a, _b;
                              if (_push5) {
                                _push5(`<span data-v-774cc202${_scopeId4}>${ssrInterpolate((_a = item.period) != null ? _a : "\u5DE5\u8D44\u6761")}</span>`);
                                _push5(ssrRenderComponent(_component_a_tag, {
                                  color: slipStatusColor(item.status),
                                  style: { "margin-left": "8px" }
                                }, {
                                  default: withCtx((_4, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`${ssrInterpolate(slipStatusLabel(item.status))}`);
                                    } else {
                                      return [
                                        createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                      ];
                                    }
                                  }),
                                  _: 2
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode("span", null, toDisplayString((_b = item.period) != null ? _b : "\u5DE5\u8D44\u6761"), 1),
                                  createVNode(_component_a_tag, {
                                    color: slipStatusColor(item.status),
                                    style: { "margin-left": "8px" }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["color"])
                                ];
                              }
                            }),
                            description: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(` \u5B9E\u53D1 \xA5${ssrInterpolate(formatAmount(item.netPay))}`);
                              } else {
                                return [
                                  createTextVNode(" \u5B9E\u53D1 \xA5" + toDisplayString(formatAmount(item.netPay)), 1)
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_list_item_meta, null, {
                              title: withCtx(() => {
                                var _a;
                                return [
                                  createVNode("span", null, toDisplayString((_a = item.period) != null ? _a : "\u5DE5\u8D44\u6761"), 1),
                                  createVNode(_component_a_tag, {
                                    color: slipStatusColor(item.status),
                                    style: { "margin-left": "8px" }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["color"])
                                ];
                              }),
                              description: withCtx(() => [
                                createTextVNode(" \u5B9E\u53D1 \xA5" + toDisplayString(formatAmount(item.netPay)), 1)
                              ]),
                              _: 2
                            }, 1024)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_list_item, {
                        style: { "cursor": "pointer" },
                        onClick: ($event) => openSlipDetail(item)
                      }, {
                        extra: withCtx(() => [
                          createVNode(_component_a_button, {
                            type: "link",
                            size: "small"
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u67E5\u770B\u8BE6\u60C5")
                            ]),
                            _: 1
                          })
                        ]),
                        default: withCtx(() => [
                          createVNode(_component_a_list_item_meta, null, {
                            title: withCtx(() => {
                              var _a;
                              return [
                                createVNode("span", null, toDisplayString((_a = item.period) != null ? _a : "\u5DE5\u8D44\u6761"), 1),
                                createVNode(_component_a_tag, {
                                  color: slipStatusColor(item.status),
                                  style: { "margin-left": "8px" }
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["color"])
                              ];
                            }),
                            description: withCtx(() => [
                              createTextVNode(" \u5B9E\u53D1 \xA5" + toDisplayString(formatAmount(item.netPay)), 1)
                            ]),
                            _: 2
                          }, 1024)
                        ]),
                        _: 2
                      }, 1032, ["onClick"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode("div", { style: { "margin-bottom": "12px" } }, [
                  createVNode("span", { style: { "margin-right": "8px", "font-weight": "500" } }, "\u5DE5\u8D44\u6761"),
                  createVNode(_component_a_button, {
                    size: "small",
                    loading: loadingSlips.value,
                    onClick: loadMySlips
                  }, {
                    default: withCtx(() => [
                      createTextVNode("\u5237\u65B0")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ]),
                createVNode(_component_a_list, {
                  "data-source": slips.value,
                  loading: loadingSlips.value,
                  locale: { emptyText: "\u6682\u65E0\u5DE5\u8D44\u6761" }
                }, {
                  renderItem: withCtx(({ item }) => [
                    createVNode(_component_a_list_item, {
                      style: { "cursor": "pointer" },
                      onClick: ($event) => openSlipDetail(item)
                    }, {
                      extra: withCtx(() => [
                        createVNode(_component_a_button, {
                          type: "link",
                          size: "small"
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u67E5\u770B\u8BE6\u60C5")
                          ]),
                          _: 1
                        })
                      ]),
                      default: withCtx(() => [
                        createVNode(_component_a_list_item_meta, null, {
                          title: withCtx(() => {
                            var _a;
                            return [
                              createVNode("span", null, toDisplayString((_a = item.period) != null ? _a : "\u5DE5\u8D44\u6761"), 1),
                              createVNode(_component_a_tag, {
                                color: slipStatusColor(item.status),
                                style: { "margin-left": "8px" }
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                ]),
                                _: 2
                              }, 1032, ["color"])
                            ];
                          }),
                          description: withCtx(() => [
                            createTextVNode(" \u5B9E\u53D1 \xA5" + toDisplayString(formatAmount(item.netPay)), 1)
                          ]),
                          _: 2
                        }, 1024)
                      ]),
                      _: 2
                    }, 1032, ["onClick"])
                  ]),
                  _: 1
                }, 8, ["data-source", "loading"])
              ];
            }
          }),
          _: 1
        }, _parent));
      }
      _push(ssrRenderComponent(_component_a_modal, {
        open: showCreateCycleModal.value,
        "onUpdate:open": ($event) => showCreateCycleModal.value = $event,
        title: "\u521B\u5EFA\u5DE5\u8D44\u5468\u671F",
        "confirm-loading": creatingCycle.value,
        onOk: doCreateCycle,
        onCancel: ($event) => createCycleForm.value.period = ""
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "\u5468\u671F\uFF08\u683C\u5F0F\uFF1AYYYY-MM\uFF09" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: createCycleForm.value.period,
                          "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                          placeholder: "\u4F8B\uFF1A2026-04"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: createCycleForm.value.period,
                            "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                            placeholder: "\u4F8B\uFF1A2026-04"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_form_item, { label: "\u5468\u671F\uFF08\u683C\u5F0F\uFF1AYYYY-MM\uFF09" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: createCycleForm.value.period,
                          "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                          placeholder: "\u4F8B\uFF1A2026-04"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_form, { layout: "vertical" }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, { label: "\u5468\u671F\uFF08\u683C\u5F0F\uFF1AYYYY-MM\uFF09" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: createCycleForm.value.period,
                        "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                        placeholder: "\u4F8B\uFF1A2026-04"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: showSlipDetail.value,
        "onUpdate:open": ($event) => showSlipDetail.value = $event,
        title: `\u5DE5\u8D44\u6761\u8BE6\u60C5`,
        footer: null,
        width: "560px"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (slipDetail.value) {
              _push2(`<!--[-->`);
              _push2(ssrRenderComponent(_component_a_descriptions, {
                bordered: "",
                size: "small",
                column: 1,
                style: { "margin-bottom": "12px" }
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u5468\u671F" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(slipDetail.value.slip.cycleId)}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(slipDetail.value.slip.cycleId), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_tag, {
                            color: slipStatusColor(slipDetail.value.slip.status)
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(slipStatusLabel(slipDetail.value.slip.status))}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(slipStatusLabel(slipDetail.value.slip.status)), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_tag, {
                              color: slipStatusColor(slipDetail.value.slip.status)
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(slipStatusLabel(slipDetail.value.slip.status)), 1)
                              ]),
                              _: 1
                            }, 8, ["color"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u5B9E\u53D1\u5408\u8BA1" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<strong data-v-774cc202${_scopeId3}>\xA5${ssrInterpolate(formatAmount(slipDetail.value.slip.netPay))}</strong>`);
                        } else {
                          return [
                            createVNode("strong", null, "\xA5" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_descriptions_item, { label: "\u5468\u671F" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(slipDetail.value.slip.cycleId), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                        default: withCtx(() => [
                          createVNode(_component_a_tag, {
                            color: slipStatusColor(slipDetail.value.slip.status)
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(slipStatusLabel(slipDetail.value.slip.status)), 1)
                            ]),
                            _: 1
                          }, 8, ["color"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u5B9E\u53D1\u5408\u8BA1" }, {
                        default: withCtx(() => [
                          createVNode("strong", null, "\xA5" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_divider, { style: { "margin": "8px 0" } }, null, _parent2, _scopeId));
              _push2(`<!--[-->`);
              ssrRenderList(slipDetail.value.items, (item) => {
                _push2(`<div class="slip-item-row" data-v-774cc202${_scopeId}><span class="slip-item-name" data-v-774cc202${_scopeId}>${ssrInterpolate(item.name)}</span><span class="slip-item-amount" style="${ssrRenderStyle({ color: Number(item.amount) < 0 ? "#ff4d4f" : "#333" })}" data-v-774cc202${_scopeId}>${ssrInterpolate(Number(item.amount) > 0 ? "+" : "")}\xA5${ssrInterpolate(formatAmount(item.amount))}</span></div>`);
              });
              _push2(`<!--]-->`);
              _push2(ssrRenderComponent(_component_a_divider, { style: { "margin": "8px 0" } }, null, _parent2, _scopeId));
              _push2(`<div class="slip-item-row slip-total" data-v-774cc202${_scopeId}><span data-v-774cc202${_scopeId}>\u5B9E\u53D1\u5408\u8BA1</span><strong data-v-774cc202${_scopeId}>\xA5${ssrInterpolate(formatAmount(slipDetail.value.slip.netPay))}</strong></div>`);
              if (!isFinanceOrCeo.value && slipDetail.value.slip.status === "PUBLISHED") {
                _push2(`<!--[-->`);
                _push2(ssrRenderComponent(_component_a_divider, { style: { "margin": "12px 0" } }, null, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_a_space, { style: { "width": "100%", "justify-content": "center" } }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_a_button, {
                        type: "primary",
                        loading: confirmingSlip.value,
                        onClick: doConfirm
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u786E\u8BA4\u6536\u5230`);
                          } else {
                            return [
                              createTextVNode("\u786E\u8BA4\u6536\u5230")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_a_button, {
                        danger: "",
                        loading: disputingSlip.value,
                        onClick: ($event) => showDisputeInput.value = !showDisputeInput.value
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u63D0\u51FA\u5F02\u8BAE`);
                          } else {
                            return [
                              createTextVNode("\u63D0\u51FA\u5F02\u8BAE")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                    } else {
                      return [
                        createVNode(_component_a_button, {
                          type: "primary",
                          loading: confirmingSlip.value,
                          onClick: doConfirm
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u786E\u8BA4\u6536\u5230")
                          ]),
                          _: 1
                        }, 8, ["loading"]),
                        createVNode(_component_a_button, {
                          danger: "",
                          loading: disputingSlip.value,
                          onClick: ($event) => showDisputeInput.value = !showDisputeInput.value
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u63D0\u51FA\u5F02\u8BAE")
                          ]),
                          _: 1
                        }, 8, ["loading", "onClick"])
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                if (showDisputeInput.value) {
                  _push2(`<!--[-->`);
                  _push2(ssrRenderComponent(_component_a_textarea, {
                    value: disputeReason.value,
                    "onUpdate:value": ($event) => disputeReason.value = $event,
                    placeholder: "\u8BF7\u8BF4\u660E\u5F02\u8BAE\u539F\u56E0",
                    rows: 3,
                    style: { "margin-top": "8px" }
                  }, null, _parent2, _scopeId));
                  _push2(ssrRenderComponent(_component_a_button, {
                    type: "primary",
                    danger: "",
                    block: "",
                    style: { "margin-top": "8px" },
                    disabled: !disputeReason.value.trim(),
                    loading: disputingSlip.value,
                    onClick: doDispute
                  }, {
                    default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                      if (_push3) {
                        _push3(`\u63D0\u4EA4\u5F02\u8BAE`);
                      } else {
                        return [
                          createTextVNode("\u63D0\u4EA4\u5F02\u8BAE")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent2, _scopeId));
                  _push2(`<!--]-->`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--]-->`);
            } else {
              _push2(ssrRenderComponent(_component_a_spin, {
                spinning: loadingSlipDetail.value,
                tip: "\u52A0\u8F7D\u4E2D..."
              }, null, _parent2, _scopeId));
            }
          } else {
            return [
              slipDetail.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                createVNode(_component_a_descriptions, {
                  bordered: "",
                  size: "small",
                  column: 1,
                  style: { "margin-bottom": "12px" }
                }, {
                  default: withCtx(() => [
                    createVNode(_component_a_descriptions_item, { label: "\u5468\u671F" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(slipDetail.value.slip.cycleId), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_tag, {
                          color: slipStatusColor(slipDetail.value.slip.status)
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(slipStatusLabel(slipDetail.value.slip.status)), 1)
                          ]),
                          _: 1
                        }, 8, ["color"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u5B9E\u53D1\u5408\u8BA1" }, {
                      default: withCtx(() => [
                        createVNode("strong", null, "\xA5" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                createVNode(_component_a_divider, { style: { "margin": "8px 0" } }),
                (openBlock(true), createBlock(Fragment, null, renderList(slipDetail.value.items, (item) => {
                  return openBlock(), createBlock("div", {
                    key: item.id,
                    class: "slip-item-row"
                  }, [
                    createVNode("span", { class: "slip-item-name" }, toDisplayString(item.name), 1),
                    createVNode("span", {
                      class: "slip-item-amount",
                      style: { color: Number(item.amount) < 0 ? "#ff4d4f" : "#333" }
                    }, toDisplayString(Number(item.amount) > 0 ? "+" : "") + "\xA5" + toDisplayString(formatAmount(item.amount)), 5)
                  ]);
                }), 128)),
                createVNode(_component_a_divider, { style: { "margin": "8px 0" } }),
                createVNode("div", { class: "slip-item-row slip-total" }, [
                  createVNode("span", null, "\u5B9E\u53D1\u5408\u8BA1"),
                  createVNode("strong", null, "\xA5" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
                ]),
                !isFinanceOrCeo.value && slipDetail.value.slip.status === "PUBLISHED" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                  createVNode(_component_a_divider, { style: { "margin": "12px 0" } }),
                  createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "center" } }, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "primary",
                        loading: confirmingSlip.value,
                        onClick: doConfirm
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u786E\u8BA4\u6536\u5230")
                        ]),
                        _: 1
                      }, 8, ["loading"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        loading: disputingSlip.value,
                        onClick: ($event) => showDisputeInput.value = !showDisputeInput.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u63D0\u51FA\u5F02\u8BAE")
                        ]),
                        _: 1
                      }, 8, ["loading", "onClick"])
                    ]),
                    _: 1
                  }),
                  showDisputeInput.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createVNode(_component_a_textarea, {
                      value: disputeReason.value,
                      "onUpdate:value": ($event) => disputeReason.value = $event,
                      placeholder: "\u8BF7\u8BF4\u660E\u5F02\u8BAE\u539F\u56E0",
                      rows: 3,
                      style: { "margin-top": "8px" }
                    }, null, 8, ["value", "onUpdate:value"]),
                    createVNode(_component_a_button, {
                      type: "primary",
                      danger: "",
                      block: "",
                      style: { "margin-top": "8px" },
                      disabled: !disputeReason.value.trim(),
                      loading: disputingSlip.value,
                      onClick: doDispute
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u63D0\u4EA4\u5F02\u8BAE")
                      ]),
                      _: 1
                    }, 8, ["disabled", "loading"])
                  ], 64)) : createCommentVNode("", true)
                ], 64)) : createCommentVNode("", true)
              ], 64)) : (openBlock(), createBlock(_component_a_spin, {
                key: 1,
                spinning: loadingSlipDetail.value,
                tip: "\u52A0\u8F7D\u4E2D..."
              }, null, 8, ["spinning"]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/payroll/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-774cc202"]]);

export { index as default };
//# sourceMappingURL=index-DNLRDf3A.mjs.map
