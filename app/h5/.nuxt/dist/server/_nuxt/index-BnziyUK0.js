import { Card, Tabs, TabPane, Table, Tag, Button, Form, FormItem, Select, SelectOption, DatePicker, Textarea, TimePicker, Space, Modal, Descriptions, DescriptionsItem } from "ant-design-vue/es/index.js";
import { defineComponent, computed, ref, mergeProps, withCtx, createVNode, openBlock, createBlock, createCommentVNode, createTextVNode, toDisplayString, Fragment, renderList, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
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
    const isPmOrCeo = computed(() => {
      const role = userStore.userInfo?.role ?? "";
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
      { title: "日期", key: "submitTime", width: 100 },
      { title: "类型", dataIndex: "formTypeName", key: "formTypeName", width: 90 },
      { title: "摘要", key: "summary" },
      { title: "状态", key: "status", width: 90 },
      { title: "操作", key: "action", width: 80 }
    ];
    const detailVisible = ref(false);
    const selectedRecord = ref(null);
    const loadingNotifs = ref(false);
    const notifications = ref([]);
    const rejectModalVisible = ref(false);
    const rejectReason = ref("");
    const pendingRejectId = ref(null);
    const notifColumns = [
      { title: "加班日期", key: "date", width: 110 },
      { title: "类型", key: "type", width: 100 },
      { title: "说明", key: "content" },
      { title: "状态", key: "status", width: 90 },
      { title: "操作", key: "action", width: 130 }
    ];
    const loadingInitiated = ref(false);
    const initiatedNotifs = ref([]);
    const initiatedColumns = [
      { title: "加班日期", key: "date", width: 110 },
      { title: "类型", key: "type", width: 100 },
      { title: "通知内容", key: "content" },
      { title: "状态", key: "status", width: 90 },
      { title: "响应", key: "responseCount", width: 90 }
    ];
    const responseDetailColumns = [
      { title: "员工ID", dataIndex: "employeeId", key: "employeeId", width: 90 },
      { title: "响应", key: "accepted", width: 80 },
      { title: "拒绝原因", key: "rejectReason" }
    ];
    function overtimeTypeLabel(t) {
      const map = { WEEKDAY: "工作日加班", WEEKEND: "周末加班", HOLIDAY: "节假日加班" };
      return map[t] ?? t;
    }
    function notifStatusColor(s) {
      if (s === "ARCHIVED") return "default";
      if (s === "NOTIFIED") return "processing";
      return "default";
    }
    function notifStatusLabel(s) {
      const map = { NOTIFIED: "待响应", ARCHIVED: "已归档" };
      return map[s] ?? s;
    }
    function onTabChange(key) {
      if (key === "notifications") loadNotifications();
      if (key === "notify-initiated") loadInitiatedNotifs();
    }
    async function loadNotifications() {
      loadingNotifs.value = true;
      try {
        const list = await request({ url: "/overtime-notifications" });
        notifications.value = list ?? [];
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
        initiatedNotifs.value = list ?? [];
      } catch {
        initiatedNotifs.value = [];
      } finally {
        loadingInitiated.value = false;
      }
    }
    async function respondNotif(id, accepted, reason) {
      try {
        await request({
          url: `/overtime-notifications/${id}/respond`,
          method: "POST",
          body: { accepted, rejectReason: reason }
        });
        await loadNotifications();
      } catch (e) {
        alert(e.message ?? "操作失败");
      }
    }
    function openRejectModal(id) {
      pendingRejectId.value = id;
      rejectReason.value = "";
      rejectModalVisible.value = true;
    }
    async function confirmReject() {
      if (!pendingRejectId.value || !rejectReason.value.trim()) {
        alert("请填写拒绝原因");
        return;
      }
      await respondNotif(pendingRejectId.value, false, rejectReason.value);
      rejectModalVisible.value = false;
    }
    function formatDate(t) {
      if (!t) return "—";
      return t.replace("T", " ").slice(0, 10);
    }
    function getSummary(record) {
      const d = record.formData ?? {};
      if (record.formType === "LEAVE") {
        return `${d.leaveType ?? ""} ${d.days ?? ""}天`;
      }
      if (record.formType === "OVERTIME") {
        return `${d.overtimeType ?? ""} ${d.startTime ?? ""}~${d.endTime ?? ""}`;
      }
      return record.formTypeName ?? "";
    }
    function statusColor(status) {
      if (status === "APPROVED") return "success";
      if (status === "REJECTED") return "error";
      if (status === "PENDING" || status === "APPROVING") return "processing";
      return "default";
    }
    function statusLabel(status) {
      const map = {
        PENDING: "审批中",
        APPROVING: "审批中",
        APPROVED: "已通过",
        REJECTED: "已驳回",
        ARCHIVED: "已归档",
        RECALLED: "已撤回"
      };
      return map[status] ?? status;
    }
    function viewRecord(record) {
      selectedRecord.value = record;
      detailVisible.value = true;
    }
    async function loadRecords() {
      loadingRecords.value = true;
      try {
        const list = await request({ url: "/attendance/records" });
        records.value = list ?? [];
      } catch {
        records.value = [];
      } finally {
        loadingRecords.value = false;
      }
    }
    async function submitLeave() {
      submittingLeave.value = true;
      try {
        await request({
          url: "/attendance/leave",
          method: "POST",
          body: {
            formType: "LEAVE",
            formData: {
              leaveType: leaveForm.value.leaveType,
              startDate: leaveForm.value.startDate?.format("YYYY-MM-DD"),
              endDate: leaveForm.value.endDate?.format("YYYY-MM-DD"),
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
        const msg = e.message ?? "提交失败";
        alert(msg);
      } finally {
        submittingLeave.value = false;
      }
    }
    async function submitOvertime() {
      submittingOvertime.value = true;
      try {
        await request({
          url: "/attendance/overtime",
          method: "POST",
          body: {
            formType: "OVERTIME",
            formData: {
              date: overtimeForm.value.date?.format("YYYY-MM-DD"),
              startTime: overtimeForm.value.startTime?.format("HH:mm"),
              endTime: overtimeForm.value.endTime?.format("HH:mm"),
              overtimeType: overtimeForm.value.overtimeType
            },
            remark: overtimeForm.value.reason
          }
        });
        overtimeForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: "" };
        activeTab.value = "records";
        await loadRecords();
      } catch (e) {
        const msg = e.message ?? "提交失败";
        alert(msg);
      } finally {
        submittingOvertime.value = false;
      }
    }
    async function submitSelfReport() {
      submittingSelfReport.value = true;
      try {
        await request({
          url: "/attendance/overtime-self-report",
          method: "POST",
          body: {
            formType: "OVERTIME",
            formData: {
              date: selfReportForm.value.date?.format("YYYY-MM-DD"),
              startTime: selfReportForm.value.startTime?.format("HH:mm"),
              endTime: selfReportForm.value.endTime?.format("HH:mm"),
              overtimeType: selfReportForm.value.overtimeType
            },
            remark: selfReportForm.value.reason
          }
        });
        selfReportForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: "" };
        activeTab.value = "records";
        await loadRecords();
      } catch (e) {
        const msg = e.message ?? "提交失败";
        alert(msg);
      } finally {
        submittingSelfReport.value = false;
      }
    }
    async function submitNotification() {
      submittingNotification.value = true;
      try {
        await request({
          url: "/overtime-notifications",
          method: "POST",
          body: {
            overtimeDate: notifyForm.value.overtimeDate?.format("YYYY-MM-DD"),
            overtimeType: notifyForm.value.overtimeType,
            content: notifyForm.value.content
          }
        });
        notifyForm.value = { overtimeDate: null, overtimeType: null, content: "" };
        activeTab.value = "notify-initiated";
        await loadInitiatedNotifs();
      } catch (e) {
        const msg = e.message ?? "发送失败";
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
      const _component_a_time_picker = TimePicker;
      const _component_a_space = Space;
      const _component_a_modal = Modal;
      const _component_a_descriptions = Descriptions;
      const _component_a_descriptions_item = DescriptionsItem;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "attendance-page" }, _attrs))} data-v-b41651d7><h2 class="page-title" data-v-b41651d7>考勤管理</h2>`);
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
                    tab: "我的记录"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "leave",
                    tab: "请假申请"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "overtime",
                    tab: "加班申报"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "self-report",
                    tab: "自补加班"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "notifications",
                    tab: "加班通知"
                  }, null, _parent3, _scopeId2));
                  if (isPmOrCeo.value) {
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "notify-create",
                      tab: "发起通知"
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  if (isPmOrCeo.value) {
                    _push3(ssrRenderComponent(_component_a_tab_pane, {
                      key: "notify-initiated",
                      tab: "已发起"
                    }, null, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    createVNode(_component_a_tab_pane, {
                      key: "records",
                      tab: "我的记录"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "leave",
                      tab: "请假申请"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "overtime",
                      tab: "加班申报"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "self-report",
                      tab: "自补加班"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "notifications",
                      tab: "加班通知"
                    }),
                    isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                      key: "notify-create",
                      tab: "发起通知"
                    })) : createCommentVNode("", true),
                    isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                      key: "notify-initiated",
                      tab: "已发起"
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
                pagination: { pageSize: 20, showTotal: (t) => `共 ${t} 条` },
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
                            _push4(`查看`);
                          } else {
                            return [
                              createTextVNode("查看")
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
                          createTextVNode("查看")
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
                      label: "假种",
                      name: "leaveType",
                      rules: [{ required: true, message: "请选择假种" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: leaveForm.value.leaveType,
                            "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "事假" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`事假`);
                                    } else {
                                      return [
                                        createTextVNode("事假")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "病假" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`病假`);
                                    } else {
                                      return [
                                        createTextVNode("病假")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "年假" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`年假`);
                                    } else {
                                      return [
                                        createTextVNode("年假")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "事假" }, {
                                    default: withCtx(() => [
                                      createTextVNode("事假")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "病假" }, {
                                    default: withCtx(() => [
                                      createTextVNode("病假")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "年假" }, {
                                    default: withCtx(() => [
                                      createTextVNode("年假")
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
                              placeholder: "请选择"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "事假" }, {
                                  default: withCtx(() => [
                                    createTextVNode("事假")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "病假" }, {
                                  default: withCtx(() => [
                                    createTextVNode("病假")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "年假" }, {
                                  default: withCtx(() => [
                                    createTextVNode("年假")
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
                      label: "开始日期",
                      name: "startDate",
                      rules: [{ required: true, message: "请选择开始日期" }]
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
                      label: "结束日期",
                      name: "endDate",
                      rules: [{ required: true, message: "请选择结束日期" }]
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
                      label: "请假原因",
                      name: "reason",
                      rules: [{ required: true, message: "请填写原因" }]
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
                                _push5(` 提交申请 `);
                              } else {
                                return [
                                  createTextVNode(" 提交申请 ")
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
                                createTextVNode(" 提交申请 ")
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
                        label: "假种",
                        name: "leaveType",
                        rules: [{ required: true, message: "请选择假种" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: leaveForm.value.leaveType,
                            "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "事假" }, {
                                default: withCtx(() => [
                                  createTextVNode("事假")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "病假" }, {
                                default: withCtx(() => [
                                  createTextVNode("病假")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "年假" }, {
                                default: withCtx(() => [
                                  createTextVNode("年假")
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
                        label: "开始日期",
                        name: "startDate",
                        rules: [{ required: true, message: "请选择开始日期" }]
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
                        label: "结束日期",
                        name: "endDate",
                        rules: [{ required: true, message: "请选择结束日期" }]
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
                        label: "请假原因",
                        name: "reason",
                        rules: [{ required: true, message: "请填写原因" }]
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
                              createTextVNode(" 提交申请 ")
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
                      label: "加班日期",
                      name: "date",
                      rules: [{ required: true, message: "请选择日期" }]
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
                      label: "开始时间",
                      name: "startTime",
                      rules: [{ required: true, message: "请选择开始时间" }]
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
                      label: "结束时间",
                      name: "endTime",
                      rules: [{ required: true, message: "请选择结束时间" }]
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
                      label: "加班类型",
                      name: "overtimeType"
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: overtimeForm.value.overtimeType,
                            "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "周末加班" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`周末加班`);
                                    } else {
                                      return [
                                        createTextVNode("周末加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "节假日加班" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`节假日加班`);
                                    } else {
                                      return [
                                        createTextVNode("节假日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "工作日加班" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`工作日加班`);
                                    } else {
                                      return [
                                        createTextVNode("工作日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "周末加班" }, {
                                    default: withCtx(() => [
                                      createTextVNode("周末加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "节假日加班" }, {
                                    default: withCtx(() => [
                                      createTextVNode("节假日加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "工作日加班" }, {
                                    default: withCtx(() => [
                                      createTextVNode("工作日加班")
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
                              placeholder: "请选择"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "周末加班" }, {
                                  default: withCtx(() => [
                                    createTextVNode("周末加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "节假日加班" }, {
                                  default: withCtx(() => [
                                    createTextVNode("节假日加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "工作日加班" }, {
                                  default: withCtx(() => [
                                    createTextVNode("工作日加班")
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
                      label: "说明",
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
                                _push5(` 提交申报 `);
                              } else {
                                return [
                                  createTextVNode(" 提交申报 ")
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
                                createTextVNode(" 提交申报 ")
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
                        label: "加班日期",
                        name: "date",
                        rules: [{ required: true, message: "请选择日期" }]
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
                        label: "开始时间",
                        name: "startTime",
                        rules: [{ required: true, message: "请选择开始时间" }]
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
                        label: "结束时间",
                        name: "endTime",
                        rules: [{ required: true, message: "请选择结束时间" }]
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
                        label: "加班类型",
                        name: "overtimeType"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: overtimeForm.value.overtimeType,
                            "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "周末加班" }, {
                                default: withCtx(() => [
                                  createTextVNode("周末加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "节假日加班" }, {
                                default: withCtx(() => [
                                  createTextVNode("节假日加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "工作日加班" }, {
                                default: withCtx(() => [
                                  createTextVNode("工作日加班")
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
                        label: "说明",
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
                              createTextVNode(" 提交申报 ")
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
                      label: "加班日期",
                      name: "date",
                      rules: [{ required: true, message: "请选择日期" }]
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
                      label: "开始时间",
                      name: "startTime",
                      rules: [{ required: true, message: "请选择开始时间" }]
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
                      label: "结束时间",
                      name: "endTime",
                      rules: [{ required: true, message: "请选择结束时间" }]
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
                      label: "加班类型",
                      name: "overtimeType",
                      rules: [{ required: true, message: "请选择类型" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: selfReportForm.value.overtimeType,
                            "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`工作日加班`);
                                    } else {
                                      return [
                                        createTextVNode("工作日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`周末加班`);
                                    } else {
                                      return [
                                        createTextVNode("周末加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`节假日加班`);
                                    } else {
                                      return [
                                        createTextVNode("节假日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("工作日加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                    default: withCtx(() => [
                                      createTextVNode("周末加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("节假日加班")
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
                              placeholder: "请选择"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("工作日加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx(() => [
                                    createTextVNode("周末加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("节假日加班")
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
                      label: "补申报原因",
                      name: "reason",
                      rules: [{ required: true, message: "请填写原因" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: selfReportForm.value.reason,
                            "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                            rows: 3,
                            placeholder: "请说明未能及时申报的原因"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: selfReportForm.value.reason,
                              "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                              rows: 3,
                              placeholder: "请说明未能及时申报的原因"
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
                                _push5(` 提交申请 `);
                              } else {
                                return [
                                  createTextVNode(" 提交申请 ")
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
                                createTextVNode(" 提交申请 ")
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
                        label: "加班日期",
                        name: "date",
                        rules: [{ required: true, message: "请选择日期" }]
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
                        label: "开始时间",
                        name: "startTime",
                        rules: [{ required: true, message: "请选择开始时间" }]
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
                        label: "结束时间",
                        name: "endTime",
                        rules: [{ required: true, message: "请选择结束时间" }]
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
                        label: "加班类型",
                        name: "overtimeType",
                        rules: [{ required: true, message: "请选择类型" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: selfReportForm.value.overtimeType,
                            "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("工作日加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                default: withCtx(() => [
                                  createTextVNode("周末加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("节假日加班")
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
                        label: "补申报原因",
                        name: "reason",
                        rules: [{ required: true, message: "请填写原因" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: selfReportForm.value.reason,
                            "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                            rows: 3,
                            placeholder: "请说明未能及时申报的原因"
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
                              createTextVNode(" 提交申请 ")
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
                              _push4(`${ssrInterpolate(record.myResponse.accepted ? "已确认" : "已拒绝")}`);
                            } else {
                              return [
                                createTextVNode(toDisplayString(record.myResponse.accepted ? "已确认" : "已拒绝"), 1)
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(ssrRenderComponent(_component_a_tag, { color: "processing" }, {
                          default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                            if (_push4) {
                              _push4(`待响应`);
                            } else {
                              return [
                                createTextVNode("待响应")
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
                                    _push5(`确认`);
                                  } else {
                                    return [
                                      createTextVNode("确认")
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
                                    _push5(`拒绝`);
                                  } else {
                                    return [
                                      createTextVNode("拒绝")
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
                                    createTextVNode("确认")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                createVNode(_component_a_button, {
                                  size: "small",
                                  danger: "",
                                  onClick: ($event) => openRejectModal(record.notification.id)
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("拒绝")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])
                              ];
                            }
                          }),
                          _: 2
                        }, _parent3, _scopeId2));
                      } else {
                        _push3(`<span class="text-muted" data-v-b41651d7${_scopeId2}>—</span>`);
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
                            createTextVNode(toDisplayString(record.myResponse.accepted ? "已确认" : "已拒绝"), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])) : (openBlock(), createBlock(_component_a_tag, {
                          key: 1,
                          color: "processing"
                        }, {
                          default: withCtx(() => [
                            createTextVNode("待响应")
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
                                createTextVNode("确认")
                              ]),
                              _: 1
                            }, 8, ["onClick"]),
                            createVNode(_component_a_button, {
                              size: "small",
                              danger: "",
                              onClick: ($event) => openRejectModal(record.notification.id)
                            }, {
                              default: withCtx(() => [
                                createTextVNode("拒绝")
                              ]),
                              _: 1
                            }, 8, ["onClick"])
                          ]),
                          _: 2
                        }, 1024)) : (openBlock(), createBlock("span", {
                          key: 1,
                          class: "text-muted"
                        }, "—"))
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
                      label: "加班日期",
                      name: "overtimeDate",
                      rules: [{ required: true, message: "请选择日期" }]
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
                      label: "加班类型",
                      name: "overtimeType",
                      rules: [{ required: true, message: "请选择类型" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_select, {
                            value: notifyForm.value.overtimeType,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`工作日加班`);
                                    } else {
                                      return [
                                        createTextVNode("工作日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`周末加班`);
                                    } else {
                                      return [
                                        createTextVNode("周末加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(`节假日加班`);
                                    } else {
                                      return [
                                        createTextVNode("节假日加班")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("工作日加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                    default: withCtx(() => [
                                      createTextVNode("周末加班")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                    default: withCtx(() => [
                                      createTextVNode("节假日加班")
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
                              placeholder: "请选择"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("工作日加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                  default: withCtx(() => [
                                    createTextVNode("周末加班")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                  default: withCtx(() => [
                                    createTextVNode("节假日加班")
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
                      label: "通知内容",
                      name: "content",
                      rules: [{ required: true, message: "请填写通知内容" }]
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_textarea, {
                            value: notifyForm.value.content,
                            "onUpdate:value": ($event) => notifyForm.value.content = $event,
                            rows: 3,
                            placeholder: "说明加班安排、要求等"
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_textarea, {
                              value: notifyForm.value.content,
                              "onUpdate:value": ($event) => notifyForm.value.content = $event,
                              rows: 3,
                              placeholder: "说明加班安排、要求等"
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
                                _push5(` 发送通知 `);
                              } else {
                                return [
                                  createTextVNode(" 发送通知 ")
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
                                createTextVNode(" 发送通知 ")
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
                        label: "加班日期",
                        name: "overtimeDate",
                        rules: [{ required: true, message: "请选择日期" }]
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
                        label: "加班类型",
                        name: "overtimeType",
                        rules: [{ required: true, message: "请选择类型" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select, {
                            value: notifyForm.value.overtimeType,
                            "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                            placeholder: "请选择"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("工作日加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                                default: withCtx(() => [
                                  createTextVNode("周末加班")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                                default: withCtx(() => [
                                  createTextVNode("节假日加班")
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
                        label: "通知内容",
                        name: "content",
                        rules: [{ required: true, message: "请填写通知内容" }]
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_textarea, {
                            value: notifyForm.value.content,
                            "onUpdate:value": ($event) => notifyForm.value.content = $event,
                            rows: 3,
                            placeholder: "说明加班安排、要求等"
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
                              createTextVNode(" 发送通知 ")
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
                      _push3(`<!--[-->${ssrInterpolate(record.responses.length)} 人响应 <!--]-->`);
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
                        createTextVNode(toDisplayString(record.responses.length) + " 人响应 ", 1)
                      ], 64)) : createCommentVNode("", true)
                    ];
                  }
                }),
                expandedRowRender: withCtx(({ record }, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (record.responses.length === 0) {
                      _push3(`<div class="no-response-tip" data-v-b41651d7${_scopeId2}>暂无响应</div>`);
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
                                    _push5(`${ssrInterpolate(resp.accepted ? "已确认" : "已拒绝")}`);
                                  } else {
                                    return [
                                      createTextVNode(toDisplayString(resp.accepted ? "已确认" : "已拒绝"), 1)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                            if (col.key === "rejectReason") {
                              _push4(`<!--[-->${ssrInterpolate(resp.rejectReason || "—")}<!--]-->`);
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
                                  createTextVNode(toDisplayString(resp.accepted ? "已确认" : "已拒绝"), 1)
                                ]),
                                _: 2
                              }, 1032, ["color"])) : createCommentVNode("", true),
                              col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                                createTextVNode(toDisplayString(resp.rejectReason || "—"), 1)
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
                      }, "暂无响应")) : (openBlock(), createBlock(_component_a_table, {
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
                              createTextVNode(toDisplayString(resp.accepted ? "已确认" : "已拒绝"), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"])) : createCommentVNode("", true),
                          col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                            createTextVNode(toDisplayString(resp.rejectReason || "—"), 1)
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
                    tab: "我的记录"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "leave",
                    tab: "请假申请"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "overtime",
                    tab: "加班申报"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "self-report",
                    tab: "自补加班"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "notifications",
                    tab: "加班通知"
                  }),
                  isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                    key: "notify-create",
                    tab: "发起通知"
                  })) : createCommentVNode("", true),
                  isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                    key: "notify-initiated",
                    tab: "已发起"
                  })) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["activeKey", "onUpdate:activeKey"]),
              activeTab.value === "records" ? (openBlock(), createBlock(_component_a_table, {
                key: 0,
                columns: recordColumns,
                "data-source": records.value,
                loading: loadingRecords.value,
                pagination: { pageSize: 20, showTotal: (t) => `共 ${t} 条` },
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
                      createTextVNode("查看")
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
                    label: "假种",
                    name: "leaveType",
                    rules: [{ required: true, message: "请选择假种" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: leaveForm.value.leaveType,
                        "onUpdate:value": ($event) => leaveForm.value.leaveType = $event,
                        placeholder: "请选择"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "事假" }, {
                            default: withCtx(() => [
                              createTextVNode("事假")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "病假" }, {
                            default: withCtx(() => [
                              createTextVNode("病假")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "年假" }, {
                            default: withCtx(() => [
                              createTextVNode("年假")
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
                    label: "开始日期",
                    name: "startDate",
                    rules: [{ required: true, message: "请选择开始日期" }]
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
                    label: "结束日期",
                    name: "endDate",
                    rules: [{ required: true, message: "请选择结束日期" }]
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
                    label: "请假原因",
                    name: "reason",
                    rules: [{ required: true, message: "请填写原因" }]
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
                          createTextVNode(" 提交申请 ")
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
                    label: "加班日期",
                    name: "date",
                    rules: [{ required: true, message: "请选择日期" }]
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
                    label: "开始时间",
                    name: "startTime",
                    rules: [{ required: true, message: "请选择开始时间" }]
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
                    label: "结束时间",
                    name: "endTime",
                    rules: [{ required: true, message: "请选择结束时间" }]
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
                    label: "加班类型",
                    name: "overtimeType"
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: overtimeForm.value.overtimeType,
                        "onUpdate:value": ($event) => overtimeForm.value.overtimeType = $event,
                        placeholder: "请选择"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "周末加班" }, {
                            default: withCtx(() => [
                              createTextVNode("周末加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "节假日加班" }, {
                            default: withCtx(() => [
                              createTextVNode("节假日加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "工作日加班" }, {
                            default: withCtx(() => [
                              createTextVNode("工作日加班")
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
                    label: "说明",
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
                          createTextVNode(" 提交申报 ")
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
                    label: "加班日期",
                    name: "date",
                    rules: [{ required: true, message: "请选择日期" }]
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
                    label: "开始时间",
                    name: "startTime",
                    rules: [{ required: true, message: "请选择开始时间" }]
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
                    label: "结束时间",
                    name: "endTime",
                    rules: [{ required: true, message: "请选择结束时间" }]
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
                    label: "加班类型",
                    name: "overtimeType",
                    rules: [{ required: true, message: "请选择类型" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: selfReportForm.value.overtimeType,
                        "onUpdate:value": ($event) => selfReportForm.value.overtimeType = $event,
                        placeholder: "请选择"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("工作日加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                            default: withCtx(() => [
                              createTextVNode("周末加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("节假日加班")
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
                    label: "补申报原因",
                    name: "reason",
                    rules: [{ required: true, message: "请填写原因" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: selfReportForm.value.reason,
                        "onUpdate:value": ($event) => selfReportForm.value.reason = $event,
                        rows: 3,
                        placeholder: "请说明未能及时申报的原因"
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
                          createTextVNode(" 提交申请 ")
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
                        createTextVNode(toDisplayString(record.myResponse.accepted ? "已确认" : "已拒绝"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: "processing"
                    }, {
                      default: withCtx(() => [
                        createTextVNode("待响应")
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
                            createTextVNode("确认")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_a_button, {
                          size: "small",
                          danger: "",
                          onClick: ($event) => openRejectModal(record.notification.id)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("拒绝")
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ]),
                      _: 2
                    }, 1024)) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "text-muted"
                    }, "—"))
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
                    label: "加班日期",
                    name: "overtimeDate",
                    rules: [{ required: true, message: "请选择日期" }]
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
                    label: "加班类型",
                    name: "overtimeType",
                    rules: [{ required: true, message: "请选择类型" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select, {
                        value: notifyForm.value.overtimeType,
                        "onUpdate:value": ($event) => notifyForm.value.overtimeType = $event,
                        placeholder: "请选择"
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_select_option, { value: "WEEKDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("工作日加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "WEEKEND" }, {
                            default: withCtx(() => [
                              createTextVNode("周末加班")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "HOLIDAY" }, {
                            default: withCtx(() => [
                              createTextVNode("节假日加班")
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
                    label: "通知内容",
                    name: "content",
                    rules: [{ required: true, message: "请填写通知内容" }]
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_textarea, {
                        value: notifyForm.value.content,
                        "onUpdate:value": ($event) => notifyForm.value.content = $event,
                        rows: 3,
                        placeholder: "说明加班安排、要求等"
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
                          createTextVNode(" 发送通知 ")
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
                    createTextVNode(toDisplayString(record.responses.length) + " 人响应 ", 1)
                  ], 64)) : createCommentVNode("", true)
                ]),
                expandedRowRender: withCtx(({ record }) => [
                  record.responses.length === 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "no-response-tip"
                  }, "暂无响应")) : (openBlock(), createBlock(_component_a_table, {
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
                          createTextVNode(toDisplayString(resp.accepted ? "已确认" : "已拒绝"), 1)
                        ]),
                        _: 2
                      }, 1032, ["color"])) : createCommentVNode("", true),
                      col.key === "rejectReason" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                        createTextVNode(toDisplayString(resp.rejectReason || "—"), 1)
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
        title: "拒绝原因",
        onOk: confirmReject,
        "ok-text": "确认拒绝",
        "cancel-text": "取消"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_textarea, {
              value: rejectReason.value,
              "onUpdate:value": ($event) => rejectReason.value = $event,
              placeholder: "请填写拒绝原因（必填）",
              rows: 3
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_textarea, {
                value: rejectReason.value,
                "onUpdate:value": ($event) => rejectReason.value = $event,
                placeholder: "请填写拒绝原因（必填）",
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
        title: selectedRecord.value ? `${selectedRecord.value.formTypeName} · 详情` : "详情",
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "类型" }, {
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "状态" }, {
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
                      label: "提交时间",
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
                            _push4(`${ssrInterpolate(String(val ?? "—"))}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(String(val ?? "—")), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                    });
                    _push3(`<!--]-->`);
                    if (selectedRecord.value.remark) {
                      _push3(ssrRenderComponent(_component_a_descriptions_item, {
                        label: "备注",
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
                      createVNode(_component_a_descriptions_item, { label: "类型" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "状态" }, {
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
                        label: "提交时间",
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
                            createTextVNode(toDisplayString(String(val ?? "—")), 1)
                          ]),
                          _: 2
                        }, 1032, ["label"]);
                      }), 128)),
                      selectedRecord.value.remark ? (openBlock(), createBlock(_component_a_descriptions_item, {
                        key: 0,
                        label: "备注",
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
                    createVNode(_component_a_descriptions_item, { label: "类型" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "状态" }, {
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
                      label: "提交时间",
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
                          createTextVNode(toDisplayString(String(val ?? "—")), 1)
                        ]),
                        _: 2
                      }, 1032, ["label"]);
                    }), 128)),
                    selectedRecord.value.remark ? (openBlock(), createBlock(_component_a_descriptions_item, {
                      key: 0,
                      label: "备注",
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
export {
  index as default
};
//# sourceMappingURL=index-BnziyUK0.js.map
