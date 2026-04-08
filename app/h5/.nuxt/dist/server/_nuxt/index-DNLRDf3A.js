import { Card, Tabs, TabPane, Button, Table, Tag, Form, FormItem, Select, Space, Divider, Alert, List, ListItem, ListItemMeta, Modal, Input, Descriptions, DescriptionsItem, Textarea, Spin } from "ant-design-vue/es/index.js";
import { defineComponent, computed, ref, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
import { message } from "ant-design-vue";
import { r as request } from "./http-Dv09dGXg.js";
import { u as useUserStore } from "./user-CsP34Oqk.js";
import { _ as _export_sfc } from "../server.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/hookable/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/unctx/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/h3/dist/index.mjs";
import "vue-router";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/defu/dist/defu.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ufo/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/cookie-es/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/destr/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ohash/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/klona/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const role = computed(() => userStore.userInfo?.role ?? "");
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
      { title: "周期", dataIndex: "period", key: "period" },
      { title: "状态", dataIndex: "status", key: "status" },
      { title: "申报窗口截止", dataIndex: "windowEndDate", key: "windowEndDate" },
      { title: "发薪日", dataIndex: "payDate", key: "payDate" },
      { title: "操作", key: "action" }
    ];
    const financeSlipColumns = [
      { title: "工资条 ID", dataIndex: "id", key: "id" },
      { title: "员工 ID", dataIndex: "employeeId", key: "employeeId" },
      { title: "状态", dataIndex: "status", key: "status" },
      { title: "实发", dataIndex: "netPay", key: "netPay" },
      { title: "操作", key: "action" }
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
        message.error("加载周期列表失败");
      } finally {
        loadingCycles.value = false;
      }
    }
    async function doCreateCycle() {
      const period = createCycleForm.value.period.trim();
      if (!period) {
        message.warning("请填写周期，格式：YYYY-MM");
        return;
      }
      creatingCycle.value = true;
      try {
        await request({ url: "/payroll/cycles", method: "POST", body: { period } });
        message.success("周期创建成功");
        showCreateCycleModal.value = false;
        createCycleForm.value.period = "";
        await loadCycles();
      } catch (e) {
        const err = e;
        message.error(err.data?.message ?? "创建失败");
      } finally {
        creatingCycle.value = false;
      }
    }
    async function doOpenWindow(cycleId) {
      try {
        await request({ url: `/payroll/cycles/${cycleId}/open-window`, method: "POST" });
        message.success("申报窗口已开放");
        await loadCycles();
      } catch (e) {
        const err = e;
        message.error(err.data?.message ?? "操作失败");
      }
    }
    function selectCycleForSettle(cycle) {
      selectedCycleId.value = cycle.id;
      activeTab.value = "settle";
      precheckResult.value = null;
    }
    async function doPrecheck() {
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
        message.error(err.data?.message ?? "预检请求失败");
      } finally {
        precheckLoading.value = false;
      }
    }
    async function doSettle() {
      if (!selectedCycleId.value || !precheckPassed.value) return;
      settleLoading.value = true;
      try {
        await request({ url: `/payroll/cycles/${selectedCycleId.value}/settle`, method: "POST" });
        message.success("结算完成");
        precheckResult.value = null;
        selectedCycleId.value = null;
        await loadCycles();
        activeTab.value = "cycles";
      } catch (e) {
        const err = e;
        message.error(err.data?.message ?? "结算失败");
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
        message.error("加载工资条失败");
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
        message.error("加载工资条失败");
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
        message.error("加载工资条详情失败");
        showSlipDetail.value = false;
      } finally {
        loadingSlipDetail.value = false;
      }
    }
    async function doConfirm() {
      if (!slipDetail.value) return;
      confirmingSlip.value = true;
      try {
        const res = await request({
          url: `/payroll/slips/${slipDetail.value.slip.id}/confirm`,
          method: "POST"
        });
        slipDetail.value.slip.status = res.slip.status;
        message.success("工资条已确认");
        await loadMySlips();
      } catch (e) {
        const err = e;
        message.error(err.data?.message ?? "确认失败");
      } finally {
        confirmingSlip.value = false;
      }
    }
    async function doDispute() {
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
        message.success("异议已提交");
        await loadMySlips();
      } catch (e) {
        const err = e;
        message.error(err.data?.message ?? "提交异议失败");
      } finally {
        disputingSlip.value = false;
      }
    }
    const cycleOptions = computed(
      () => cycles.value.map((c) => ({ label: c.period, value: c.id }))
    );
    const settleableCycles = computed(
      () => cycles.value.filter((c) => ["OPEN", "WINDOW_OPEN", "WINDOW_CLOSED"].includes(c.status)).map((c) => ({ label: `${c.period}（${cycleStatusLabel(c.status)}）`, value: c.id }))
    );
    function formatAmount(val) {
      const n = Number(val ?? 0);
      return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function cycleStatusLabel(status) {
      return {
        OPEN: "待处理",
        WINDOW_OPEN: "申报中",
        WINDOW_CLOSED: "窗口已关闭",
        SETTLED: "已结算",
        LOCKED: "已锁定"
      }[status] ?? status;
    }
    function cycleStatusColor(status) {
      return {
        OPEN: "default",
        WINDOW_OPEN: "blue",
        WINDOW_CLOSED: "orange",
        SETTLED: "green",
        LOCKED: "purple"
      }[status] ?? "default";
    }
    function slipStatusLabel(status) {
      return {
        DRAFT: "草稿",
        PUBLISHED: "待确认",
        CONFIRMED: "已确认",
        DISPUTED: "异议中",
        SUPERSEDED: "已更正"
      }[status] ?? status;
    }
    function slipStatusColor(status) {
      return {
        DRAFT: "default",
        PUBLISHED: "blue",
        CONFIRMED: "green",
        DISPUTED: "red",
        SUPERSEDED: "default"
      }[status] ?? "default";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "payroll-page" }, _attrs))} data-v-774cc202><h2 class="page-title" data-v-774cc202>薪资管理</h2>`);
      if (isFinanceOrCeo.value) {
        _push(ssrRenderComponent(_component_a_card, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
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
                      tab: "周期管理"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "settle",
                      tab: "结算操作"
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "slips",
                      tab: "工资条查看"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_tab_pane, {
                        key: "cycles",
                        tab: "周期管理"
                      }),
                      createVNode(_component_a_tab_pane, {
                        key: "settle",
                        tab: "结算操作"
                      }),
                      createVNode(_component_a_tab_pane, {
                        key: "slips",
                        tab: "工资条查看"
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
                      _push3(`+ 创建周期`);
                    } else {
                      return [
                        createTextVNode("+ 创建周期")
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
                      _push3(`刷新`);
                    } else {
                      return [
                        createTextVNode("刷新")
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
                                _push4(`开放申报窗口`);
                              } else {
                                return [
                                  createTextVNode("开放申报窗口")
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
                                _push4(`结算`);
                              } else {
                                return [
                                  createTextVNode("结算")
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
                              createTextVNode("开放申报窗口")
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
                              createTextVNode("结算")
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
                      _push3(ssrRenderComponent(_component_a_form_item, { label: "选择周期" }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(ssrRenderComponent(_component_a_select, {
                              value: selectedCycleId.value ?? void 0,
                              placeholder: "请选择工资周期",
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
                                value: selectedCycleId.value ?? void 0,
                                placeholder: "请选择工资周期",
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
                        createVNode(_component_a_form_item, { label: "选择周期" }, {
                          default: withCtx(() => [
                            createVNode(_component_a_select, {
                              value: selectedCycleId.value ?? void 0,
                              placeholder: "请选择工资周期",
                              options: settleableCycles.value,
                              loading: loadingCycles.value,
                              onChange: (v) => {
                                selectedCycleId.value = v;
                                precheckResult.value = null;
                              }
                            }, null, 8, ["value", "options", "loading", "onChange"])
                          ]),
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
                            _push4(`预结算检查`);
                          } else {
                            return [
                              createTextVNode("预结算检查")
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
                            _push4(`正式结算`);
                          } else {
                            return [
                              createTextVNode("正式结算")
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
                            createTextVNode("预结算检查")
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
                            createTextVNode("正式结算")
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
                    message: precheckPassed.value ? "所有检查项通过，可执行结算" : "存在未通过检查项",
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
                                    _push5(`<span style="${ssrRenderStyle({ color: item.pass ? "#52c41a" : "#ff4d4f" })}" data-v-774cc202${_scopeId4}>${ssrInterpolate(item.pass ? "✓" : "✗")}</span><span data-v-774cc202${_scopeId4}>${ssrInterpolate(item.label)}</span>`);
                                    if (!item.pass) {
                                      _push5(`<span style="${ssrRenderStyle({ "color": "#ff4d4f", "font-size": "12px" })}" data-v-774cc202${_scopeId4}>${ssrInterpolate(item.message)}</span>`);
                                    } else {
                                      _push5(`<!---->`);
                                    }
                                  } else {
                                    return [
                                      createVNode("span", {
                                        style: { color: item.pass ? "#52c41a" : "#ff4d4f" }
                                      }, toDisplayString(item.pass ? "✓" : "✗"), 5),
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
                                    }, toDisplayString(item.pass ? "✓" : "✗"), 5),
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
                                  }, toDisplayString(item.pass ? "✓" : "✗"), 5),
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
                  value: selectedCycleIdForSlips.value ?? void 0,
                  placeholder: "请选择工资周期",
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
                      _push3(`查询`);
                    } else {
                      return [
                        createTextVNode("查询")
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
                        _push3(`<!--[--> ¥${ssrInterpolate(formatAmount(record.netPay))}<!--]-->`);
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
                              _push4(`详情`);
                            } else {
                              return [
                                createTextVNode("详情")
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
                          createTextVNode(" ¥" + toDisplayString(formatAmount(record.netPay)), 1)
                        ], 64)) : createCommentVNode("", true),
                        column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                          key: 2,
                          type: "link",
                          size: "small",
                          onClick: ($event) => openSlipDetail(record)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("详情")
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
                      tab: "周期管理"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "settle",
                      tab: "结算操作"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "slips",
                      tab: "工资条查看"
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
                        createTextVNode("+ 创建周期")
                      ]),
                      _: 1
                    }, 8, ["onClick"]),
                    createVNode(_component_a_button, {
                      style: { "margin-left": "8px" },
                      onClick: loadCycles,
                      loading: loadingCycles.value
                    }, {
                      default: withCtx(() => [
                        createTextVNode("刷新")
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
                            createTextVNode("开放申报窗口")
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
                            createTextVNode("结算")
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
                      createVNode(_component_a_form_item, { label: "选择周期" }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: selectedCycleId.value ?? void 0,
                            placeholder: "请选择工资周期",
                            options: settleableCycles.value,
                            loading: loadingCycles.value,
                            onChange: (v) => {
                              selectedCycleId.value = v;
                              precheckResult.value = null;
                            }
                          }, null, 8, ["value", "options", "loading", "onChange"])
                        ]),
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
                          createTextVNode("预结算检查")
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
                          createTextVNode("正式结算")
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
                      message: precheckPassed.value ? "所有检查项通过，可执行结算" : "存在未通过检查项",
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
                                }, toDisplayString(item.pass ? "✓" : "✗"), 5),
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
                      value: selectedCycleIdForSlips.value ?? void 0,
                      placeholder: "请选择工资周期",
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
                        createTextVNode("查询")
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
                        createTextVNode(" ¥" + toDisplayString(formatAmount(record.netPay)), 1)
                      ], 64)) : createCommentVNode("", true),
                      column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                        key: 2,
                        type: "link",
                        size: "small",
                        onClick: ($event) => openSlipDetail(record)
                      }, {
                        default: withCtx(() => [
                          createTextVNode("详情")
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
              _push2(`<div style="${ssrRenderStyle({ "margin-bottom": "12px" })}" data-v-774cc202${_scopeId}><span style="${ssrRenderStyle({ "margin-right": "8px", "font-weight": "500" })}" data-v-774cc202${_scopeId}>工资条</span>`);
              _push2(ssrRenderComponent(_component_a_button, {
                size: "small",
                loading: loadingSlips.value,
                onClick: loadMySlips
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`刷新`);
                  } else {
                    return [
                      createTextVNode("刷新")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
              _push2(ssrRenderComponent(_component_a_list, {
                "data-source": slips.value,
                loading: loadingSlips.value,
                locale: { emptyText: "暂无工资条" }
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
                                _push5(`查看详情`);
                              } else {
                                return [
                                  createTextVNode("查看详情")
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
                                createTextVNode("查看详情")
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
                              if (_push5) {
                                _push5(`<span data-v-774cc202${_scopeId4}>${ssrInterpolate(item.period ?? "工资条")}</span>`);
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
                                  createVNode("span", null, toDisplayString(item.period ?? "工资条"), 1),
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
                                _push5(` 实发 ¥${ssrInterpolate(formatAmount(item.netPay))}`);
                              } else {
                                return [
                                  createTextVNode(" 实发 ¥" + toDisplayString(formatAmount(item.netPay)), 1)
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_list_item_meta, null, {
                              title: withCtx(() => [
                                createVNode("span", null, toDisplayString(item.period ?? "工资条"), 1),
                                createVNode(_component_a_tag, {
                                  color: slipStatusColor(item.status),
                                  style: { "margin-left": "8px" }
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["color"])
                              ]),
                              description: withCtx(() => [
                                createTextVNode(" 实发 ¥" + toDisplayString(formatAmount(item.netPay)), 1)
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
                              createTextVNode("查看详情")
                            ]),
                            _: 1
                          })
                        ]),
                        default: withCtx(() => [
                          createVNode(_component_a_list_item_meta, null, {
                            title: withCtx(() => [
                              createVNode("span", null, toDisplayString(item.period ?? "工资条"), 1),
                              createVNode(_component_a_tag, {
                                color: slipStatusColor(item.status),
                                style: { "margin-left": "8px" }
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                                ]),
                                _: 2
                              }, 1032, ["color"])
                            ]),
                            description: withCtx(() => [
                              createTextVNode(" 实发 ¥" + toDisplayString(formatAmount(item.netPay)), 1)
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
                  createVNode("span", { style: { "margin-right": "8px", "font-weight": "500" } }, "工资条"),
                  createVNode(_component_a_button, {
                    size: "small",
                    loading: loadingSlips.value,
                    onClick: loadMySlips
                  }, {
                    default: withCtx(() => [
                      createTextVNode("刷新")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ]),
                createVNode(_component_a_list, {
                  "data-source": slips.value,
                  loading: loadingSlips.value,
                  locale: { emptyText: "暂无工资条" }
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
                            createTextVNode("查看详情")
                          ]),
                          _: 1
                        })
                      ]),
                      default: withCtx(() => [
                        createVNode(_component_a_list_item_meta, null, {
                          title: withCtx(() => [
                            createVNode("span", null, toDisplayString(item.period ?? "工资条"), 1),
                            createVNode(_component_a_tag, {
                              color: slipStatusColor(item.status),
                              style: { "margin-left": "8px" }
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(slipStatusLabel(item.status)), 1)
                              ]),
                              _: 2
                            }, 1032, ["color"])
                          ]),
                          description: withCtx(() => [
                            createTextVNode(" 实发 ¥" + toDisplayString(formatAmount(item.netPay)), 1)
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
        title: "创建工资周期",
        "confirm-loading": creatingCycle.value,
        onOk: doCreateCycle,
        onCancel: ($event) => createCycleForm.value.period = ""
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "周期（格式：YYYY-MM）" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: createCycleForm.value.period,
                          "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                          placeholder: "例：2026-04"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: createCycleForm.value.period,
                            "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                            placeholder: "例：2026-04"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_form_item, { label: "周期（格式：YYYY-MM）" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: createCycleForm.value.period,
                          "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                          placeholder: "例：2026-04"
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
                  createVNode(_component_a_form_item, { label: "周期（格式：YYYY-MM）" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: createCycleForm.value.period,
                        "onUpdate:value": ($event) => createCycleForm.value.period = $event,
                        placeholder: "例：2026-04"
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
        title: `工资条详情`,
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "周期" }, {
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "状态" }, {
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "实发合计" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<strong data-v-774cc202${_scopeId3}>¥${ssrInterpolate(formatAmount(slipDetail.value.slip.netPay))}</strong>`);
                        } else {
                          return [
                            createVNode("strong", null, "¥" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_descriptions_item, { label: "周期" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(slipDetail.value.slip.cycleId), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "状态" }, {
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
                      createVNode(_component_a_descriptions_item, { label: "实发合计" }, {
                        default: withCtx(() => [
                          createVNode("strong", null, "¥" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
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
                _push2(`<div class="slip-item-row" data-v-774cc202${_scopeId}><span class="slip-item-name" data-v-774cc202${_scopeId}>${ssrInterpolate(item.name)}</span><span class="slip-item-amount" style="${ssrRenderStyle({ color: Number(item.amount) < 0 ? "#ff4d4f" : "#333" })}" data-v-774cc202${_scopeId}>${ssrInterpolate(Number(item.amount) > 0 ? "+" : "")}¥${ssrInterpolate(formatAmount(item.amount))}</span></div>`);
              });
              _push2(`<!--]-->`);
              _push2(ssrRenderComponent(_component_a_divider, { style: { "margin": "8px 0" } }, null, _parent2, _scopeId));
              _push2(`<div class="slip-item-row slip-total" data-v-774cc202${_scopeId}><span data-v-774cc202${_scopeId}>实发合计</span><strong data-v-774cc202${_scopeId}>¥${ssrInterpolate(formatAmount(slipDetail.value.slip.netPay))}</strong></div>`);
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
                            _push4(`确认收到`);
                          } else {
                            return [
                              createTextVNode("确认收到")
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
                            _push4(`提出异议`);
                          } else {
                            return [
                              createTextVNode("提出异议")
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
                            createTextVNode("确认收到")
                          ]),
                          _: 1
                        }, 8, ["loading"]),
                        createVNode(_component_a_button, {
                          danger: "",
                          loading: disputingSlip.value,
                          onClick: ($event) => showDisputeInput.value = !showDisputeInput.value
                        }, {
                          default: withCtx(() => [
                            createTextVNode("提出异议")
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
                    placeholder: "请说明异议原因",
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
                        _push3(`提交异议`);
                      } else {
                        return [
                          createTextVNode("提交异议")
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
                tip: "加载中..."
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
                    createVNode(_component_a_descriptions_item, { label: "周期" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(slipDetail.value.slip.cycleId), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "状态" }, {
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
                    createVNode(_component_a_descriptions_item, { label: "实发合计" }, {
                      default: withCtx(() => [
                        createVNode("strong", null, "¥" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
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
                    }, toDisplayString(Number(item.amount) > 0 ? "+" : "") + "¥" + toDisplayString(formatAmount(item.amount)), 5)
                  ]);
                }), 128)),
                createVNode(_component_a_divider, { style: { "margin": "8px 0" } }),
                createVNode("div", { class: "slip-item-row slip-total" }, [
                  createVNode("span", null, "实发合计"),
                  createVNode("strong", null, "¥" + toDisplayString(formatAmount(slipDetail.value.slip.netPay)), 1)
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
                          createTextVNode("确认收到")
                        ]),
                        _: 1
                      }, 8, ["loading"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        loading: disputingSlip.value,
                        onClick: ($event) => showDisputeInput.value = !showDisputeInput.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode("提出异议")
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
                      placeholder: "请说明异议原因",
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
                        createTextVNode("提交异议")
                      ]),
                      _: 1
                    }, 8, ["disabled", "loading"])
                  ], 64)) : createCommentVNode("", true)
                ], 64)) : createCommentVNode("", true)
              ], 64)) : (openBlock(), createBlock(_component_a_spin, {
                key: 1,
                spinning: loadingSlipDetail.value,
                tip: "加载中..."
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
export {
  index as default
};
//# sourceMappingURL=index-DNLRDf3A.js.map
