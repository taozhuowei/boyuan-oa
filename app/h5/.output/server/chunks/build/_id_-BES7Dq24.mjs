import { n as navigateTo } from './server.mjs';
import { defineComponent, computed, ref, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { useRoute } from 'vue-router';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { message } from 'ant-design-vue';
import { w as withInstall, B as Button, E as Empty } from '../_/collapseMotion.mjs';
import { T as Tag } from '../_/index9.mjs';
import { S as Spin, C as Card, a as Tabs, b as TabPane } from '../_/index.mjs';
import { D as Descriptions, a as DescriptionsItem } from '../_/index14.mjs';
import { D as Divider } from '../_/index16.mjs';
import { C as Col$1, A as ARow, F as Form, a as FormItem } from '../_/index7.mjs';
import { I as InputNumber, P as Popconfirm } from '../_/index10.mjs';
import { S as Space } from '../_/index15.mjs';
import { S as Select, a as SelectOption, T as Table } from '../_/index3.mjs';
import { M as Modal } from '../_/index11.mjs';
import { I as Input, T as Textarea } from '../_/index5.mjs';
import { D as DatePicker } from '../_/dayjs.mjs';
import { T as Timeline, a as TimelineItem } from '../_/index17.mjs';
import { S as Statistic } from '../_/index2.mjs';
import { P as Progress } from '../_/index19.mjs';
import { L as List, a as ListItem } from '../_/index18.mjs';
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
import '@babel/runtime/helpers/esm/extends';
import 'resize-observer-polyfill';
import '@babel/runtime/helpers/esm/objectSpread2';
import 'dom-align';
import 'lodash-es/isEqual';
import '@ant-design/colors';
import '@ctrl/tinycolor';
import 'stylis';
import 'vue-types';
import 'lodash-es';
import '../_/index4.mjs';
import 'lodash-es/uniq';
import '../_/useRefs.mjs';
import 'lodash-es/pick';
import 'lodash-es/isPlainObject';
import 'throttle-debounce';
import 'lodash-es/debounce';
import '../_/ExclamationCircleFilled.mjs';
import 'lodash-es/cloneDeep';
import '../_/useFlexGapSupport.mjs';
import 'async-validator';
import 'lodash-es/find';
import 'compute-scroll-into-view';
import 'lodash-es/intersection';
import 'lodash-es/omit';
import '../_/index12.mjs';
import 'lodash-es/fromPairs';
import '../_/index6.mjs';
import '../_/CheckOutlined.mjs';
import '../_/useBreakpoint.mjs';
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';
import 'dayjs';
import 'dayjs/plugin/weekday';
import 'dayjs/plugin/localeData';
import 'dayjs/plugin/weekOfYear';
import 'dayjs/plugin/weekYear';
import 'dayjs/plugin/quarterOfYear';
import 'dayjs/plugin/advancedFormat';
import 'dayjs/plugin/customParseFormat';

const Col = withInstall(Col$1);

const Row = withInstall(ARow);

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const projectId = computed(() => Number(route.params.id));
    const userStore = useUserStore();
    const role = computed(() => {
      var _a, _b;
      return (_b = (_a = userStore.userInfo) == null ? void 0 : _a.role) != null ? _b : "";
    });
    const isCeo = computed(() => role.value === "ceo");
    const isPmOrCeo = computed(() => ["project_manager", "ceo"].includes(role.value));
    const activeTab = ref("info");
    const loadingProject = ref(false);
    const project = ref(null);
    const members = ref([]);
    async function loadProject() {
      var _a, _b, _c;
      loadingProject.value = true;
      try {
        const res = await request({ url: `/projects/${projectId.value}`, method: "GET" });
        project.value = res;
        members.value = (_a = res.members) != null ? _a : [];
        configForm.value.logCycleDays = (_b = res.logCycleDays) != null ? _b : 1;
        configForm.value.logReportCycleDays = (_c = res.logReportCycleDays) != null ? _c : 1;
      } catch {
        message.error("\u52A0\u8F7D\u9879\u76EE\u8BE6\u60C5\u5931\u8D25");
      } finally {
        loadingProject.value = false;
      }
    }
    const memberColumns = [
      { title: "\u5458\u5DE5ID", dataIndex: "employeeId", key: "employeeId", width: 80 },
      { title: "\u5DE5\u53F7", dataIndex: "employeeNo", key: "employeeNo", width: 100 },
      { title: "\u59D3\u540D", dataIndex: "name", key: "name" },
      { title: "\u89D2\u8272", dataIndex: "role", key: "role", width: 80 },
      ...isCeo.value ? [{ title: "\u64CD\u4F5C", key: "action", width: 80 }] : []
    ];
    const addMemberForm = ref({ employeeId: null, role: "MEMBER" });
    const addMemberLoading = ref(false);
    async function doAddMember() {
      if (!addMemberForm.value.employeeId) {
        message.warning("\u8BF7\u8F93\u5165\u5458\u5DE5ID");
        return;
      }
      addMemberLoading.value = true;
      try {
        await request({
          url: `/projects/${projectId.value}/members`,
          method: "POST",
          body: { employeeId: addMemberForm.value.employeeId, role: addMemberForm.value.role }
        });
        message.success("\u6210\u5458\u5DF2\u6DFB\u52A0");
        addMemberForm.value = { employeeId: null, role: "MEMBER" };
        await loadProject();
      } catch {
        message.error("\u6DFB\u52A0\u5931\u8D25");
      } finally {
        addMemberLoading.value = false;
      }
    }
    async function doRemoveMember(employeeId) {
      try {
        await request({ url: `/projects/${projectId.value}/members/${employeeId}`, method: "DELETE" });
        message.success("\u5DF2\u79FB\u9664");
        await loadProject();
      } catch {
        message.error("\u79FB\u9664\u5931\u8D25");
      }
    }
    const configForm = ref({ logCycleDays: 1, logReportCycleDays: 1 });
    const configLoading = ref(false);
    async function doUpdateConfig() {
      configLoading.value = true;
      try {
        await request({
          url: `/projects/${projectId.value}/config`,
          method: "PATCH",
          body: { logCycleDays: configForm.value.logCycleDays, logReportCycleDays: configForm.value.logReportCycleDays }
        });
        message.success("\u914D\u7F6E\u5DF2\u66F4\u65B0");
        await loadProject();
      } catch {
        message.error("\u66F4\u65B0\u5931\u8D25");
      } finally {
        configLoading.value = false;
      }
    }
    const loadingMilestones = ref(false);
    const milestones = ref([]);
    const showMilestoneModal = ref(false);
    const milestoneLoading = ref(false);
    const editingMilestone = ref(null);
    const milestoneForm = ref({ name: "", sort: 0, actualCompletionDate: null });
    const milestoneColumns = [
      { title: "\u6392\u5E8F", dataIndex: "sort", key: "sort", width: 60 },
      { title: "\u91CC\u7A0B\u7891\u540D\u79F0", dataIndex: "name", key: "name" },
      { title: "\u72B6\u6001", key: "actualCompletionDate", width: 180 },
      { title: "\u64CD\u4F5C", key: "action", width: 180 }
    ];
    async function loadMilestones() {
      loadingMilestones.value = true;
      try {
        const res = await request({ url: `/projects/${projectId.value}/milestones`, method: "GET" });
        milestones.value = res;
      } catch {
        message.error("\u52A0\u8F7D\u91CC\u7A0B\u7891\u5931\u8D25");
      } finally {
        loadingMilestones.value = false;
      }
    }
    function resetMilestoneForm() {
      editingMilestone.value = null;
      milestoneForm.value = { name: "", sort: 0, actualCompletionDate: null };
    }
    function openEditMilestone(m) {
      editingMilestone.value = m;
      milestoneForm.value = { name: m.name, sort: m.sort, actualCompletionDate: m.actualCompletionDate };
      showMilestoneModal.value = true;
    }
    async function doSaveMilestone() {
      var _a;
      if (!milestoneForm.value.name.trim()) {
        message.warning("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      milestoneLoading.value = true;
      try {
        const body = {
          name: milestoneForm.value.name,
          sort: milestoneForm.value.sort,
          actualCompletionDate: (_a = milestoneForm.value.actualCompletionDate) != null ? _a : null
        };
        if (editingMilestone.value) {
          await request({ url: `/projects/${projectId.value}/milestones/${editingMilestone.value.id}`, method: "PUT", body });
          message.success("\u5DF2\u66F4\u65B0");
        } else {
          await request({ url: `/projects/${projectId.value}/milestones`, method: "POST", body });
          message.success("\u91CC\u7A0B\u7891\u5DF2\u521B\u5EFA");
        }
        showMilestoneModal.value = false;
        resetMilestoneForm();
        await loadMilestones();
      } catch {
        message.error("\u4FDD\u5B58\u5931\u8D25");
      } finally {
        milestoneLoading.value = false;
      }
    }
    async function doMarkMilestoneComplete(m) {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      try {
        await request({
          url: `/projects/${projectId.value}/milestones/${m.id}`,
          method: "PUT",
          body: { name: m.name, sort: m.sort, actualCompletionDate: today }
        });
        message.success("\u5DF2\u6807\u8BB0\u5B8C\u6210");
        await loadMilestones();
      } catch {
        message.error("\u64CD\u4F5C\u5931\u8D25");
      }
    }
    async function doDeleteMilestone(id) {
      try {
        await request({ url: `/projects/${projectId.value}/milestones/${id}`, method: "DELETE" });
        message.success("\u5DF2\u5220\u9664");
        await loadMilestones();
      } catch {
        message.error("\u5220\u9664\u5931\u8D25");
      }
    }
    const progressLogs = ref([]);
    const progressForm = ref({ milestoneId: null, note: "" });
    const progressLoading = ref(false);
    async function doRecordProgress() {
      if (!progressForm.value.note.trim()) {
        message.warning("\u8FDB\u5EA6\u8BF4\u660E\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      progressLoading.value = true;
      try {
        const body = { note: progressForm.value.note };
        if (progressForm.value.milestoneId) body.milestoneId = progressForm.value.milestoneId;
        await request({ url: `/projects/${projectId.value}/progress`, method: "POST", body });
        message.success("\u8FDB\u5EA6\u5DF2\u8BB0\u5F55");
        progressForm.value = { milestoneId: null, note: "" };
        await loadDashboard();
      } catch {
        message.error("\u8BB0\u5F55\u5931\u8D25");
      } finally {
        progressLoading.value = false;
      }
    }
    const loadingDashboard = ref(false);
    const dashboard = ref({
      project: { id: 0, name: "", status: "" },
      milestones: [],
      workItemSummary: { total: 0, completed: 0 },
      timeSeriesData: [],
      summaries: []
    });
    const milestonesCompletionPct = computed(() => {
      const { total, completed } = dashboard.value.workItemSummary;
      if (total === 0) return 0;
      return Math.round(completed / total * 100);
    });
    const recentLogs = computed(() => dashboard.value.timeSeriesData.slice(0, 10));
    async function loadDashboard() {
      loadingDashboard.value = true;
      try {
        const res = await request({ url: `/projects/${projectId.value}/dashboard`, method: "GET" });
        dashboard.value = res;
        progressLogs.value = res.timeSeriesData.map((d, idx) => ({
          id: idx,
          projectId: projectId.value,
          milestoneId: d.milestoneId || null,
          note: d.note,
          createdAt: d.date
        }));
      } catch {
        message.error("\u52A0\u8F7D Dashboard \u5931\u8D25");
      } finally {
        loadingDashboard.value = false;
      }
    }
    const summaryForm = ref({ periodStart: null, periodEnd: null, pmNote: "" });
    const summaryLoading = ref(false);
    const summaryColumns = [
      { title: "ID", dataIndex: "id", key: "id", width: 60 },
      { title: "\u7EDF\u8BA1\u533A\u95F4", key: "period", width: 200 },
      { title: "CEO \u901A\u77E5", key: "notified", width: 100 },
      { title: "PM \u5907\u6CE8", dataIndex: "pmNote", key: "pmNote" },
      { title: "\u751F\u6210\u65F6\u95F4", dataIndex: "createdAt", key: "createdAt", width: 180 }
    ];
    async function doCreateSummary() {
      if (!summaryForm.value.periodStart || !summaryForm.value.periodEnd) {
        message.warning("\u8BF7\u9009\u62E9\u7EDF\u8BA1\u533A\u95F4");
        return;
      }
      summaryLoading.value = true;
      try {
        await request({
          url: `/projects/${projectId.value}/construction-summary`,
          method: "POST",
          body: {
            periodStart: summaryForm.value.periodStart,
            periodEnd: summaryForm.value.periodEnd,
            pmNote: summaryForm.value.pmNote || null
          }
        });
        message.success("\u6C47\u603B\u62A5\u544A\u5DF2\u751F\u6210\uFF0CCEO \u5DF2\u6536\u5230\u901A\u77E5");
        summaryForm.value = { periodStart: null, periodEnd: null, pmNote: "" };
        await loadDashboard();
      } catch {
        message.error("\u751F\u6210\u5931\u8D25");
      } finally {
        summaryLoading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_a_button = Button;
      const _component_a_tag = Tag;
      const _component_a_spin = Spin;
      const _component_a_card = Card;
      const _component_a_tabs = Tabs;
      const _component_a_tab_pane = TabPane;
      const _component_a_descriptions = Descriptions;
      const _component_a_descriptions_item = DescriptionsItem;
      const _component_a_divider = Divider;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_input_number = InputNumber;
      const _component_a_space = Space;
      const _component_a_select = Select;
      const _component_a_select_option = SelectOption;
      const _component_a_table = Table;
      const _component_a_popconfirm = Popconfirm;
      const _component_a_modal = Modal;
      const _component_a_input = Input;
      const _component_a_date_picker = DatePicker;
      const _component_a_textarea = Textarea;
      const _component_a_timeline = Timeline;
      const _component_a_timeline_item = TimelineItem;
      const _component_a_empty = Empty;
      const _component_a_row = Row;
      const _component_a_col = Col;
      const _component_a_statistic = Statistic;
      const _component_a_progress = Progress;
      const _component_a_list = List;
      const _component_a_list_item = ListItem;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "project-detail-page" }, _attrs))}><div class="page-header" style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "gap": "12px", "margin-bottom": "16px" })}">`);
      _push(ssrRenderComponent(_component_a_button, {
        type: "link",
        style: { "padding": "0" },
        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/projects")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 \u8FD4\u56DE\u5217\u8868`);
          } else {
            return [
              createTextVNode("\u2190 \u8FD4\u56DE\u5217\u8868")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}">${ssrInterpolate((_b = (_a = project.value) == null ? void 0 : _a.name) != null ? _b : "\u52A0\u8F7D\u4E2D\u2026")} `);
      if (project.value) {
        _push(ssrRenderComponent(_component_a_tag, {
          color: project.value.status === "ACTIVE" ? "green" : "default",
          style: { "margin-left": "8px", "vertical-align": "middle" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(project.value.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED")}`);
            } else {
              return [
                createTextVNode(toDisplayString(project.value.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</h2></div>`);
      _push(ssrRenderComponent(_component_a_spin, { spinning: loadingProject.value }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_card, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_tabs, {
                    activeKey: activeTab.value,
                    "onUpdate:activeKey": ($event) => activeTab.value = $event
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_tab_pane, {
                          key: "info",
                          tab: "\u57FA\u672C\u4FE1\u606F"
                        }, null, _parent4, _scopeId3));
                        if (isPmOrCeo.value) {
                          _push4(ssrRenderComponent(_component_a_tab_pane, {
                            key: "milestones",
                            tab: "\u91CC\u7A0B\u7891"
                          }, null, _parent4, _scopeId3));
                        } else {
                          _push4(`<!---->`);
                        }
                        if (isPmOrCeo.value) {
                          _push4(ssrRenderComponent(_component_a_tab_pane, {
                            key: "progress",
                            tab: "\u8FDB\u5EA6\u8BB0\u5F55"
                          }, null, _parent4, _scopeId3));
                        } else {
                          _push4(`<!---->`);
                        }
                        _push4(ssrRenderComponent(_component_a_tab_pane, {
                          key: "dashboard",
                          tab: "Dashboard"
                        }, null, _parent4, _scopeId3));
                        if (isPmOrCeo.value) {
                          _push4(ssrRenderComponent(_component_a_tab_pane, {
                            key: "summary",
                            tab: "\u6C47\u603B\u62A5\u544A"
                          }, null, _parent4, _scopeId3));
                        } else {
                          _push4(`<!---->`);
                        }
                      } else {
                        return [
                          createVNode(_component_a_tab_pane, {
                            key: "info",
                            tab: "\u57FA\u672C\u4FE1\u606F"
                          }),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "milestones",
                            tab: "\u91CC\u7A0B\u7891"
                          })) : createCommentVNode("", true),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "progress",
                            tab: "\u8FDB\u5EA6\u8BB0\u5F55"
                          })) : createCommentVNode("", true),
                          createVNode(_component_a_tab_pane, {
                            key: "dashboard",
                            tab: "Dashboard"
                          }),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "summary",
                            tab: "\u6C47\u603B\u62A5\u544A"
                          })) : createCommentVNode("", true)
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  if (activeTab.value === "info") {
                    _push3(`<!--[-->`);
                    _push3(ssrRenderComponent(_component_a_descriptions, {
                      bordered: "",
                      size: "small",
                      column: 2,
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u9879\u76EE\u540D\u79F0" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2;
                              if (_push5) {
                                _push5(`${ssrInterpolate((_a2 = project.value) == null ? void 0 : _a2.name)}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString((_b2 = project.value) == null ? void 0 : _b2.name), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2;
                              if (_push5) {
                                _push5(`${ssrInterpolate(((_a2 = project.value) == null ? void 0 : _a2.status) === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(((_b2 = project.value) == null ? void 0 : _b2.status) === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2, _c, _d;
                              if (_push5) {
                                _push5(`${ssrInterpolate((_b2 = (_a2 = project.value) == null ? void 0 : _a2.startDate) != null ? _b2 : "\u2014")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString((_d = (_c = project.value) == null ? void 0 : _c.startDate) != null ? _d : "\u2014"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u5B9E\u9645\u5B8C\u5DE5\u65E5\u671F" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2, _c, _d;
                              if (_push5) {
                                _push5(`${ssrInterpolate((_b2 = (_a2 = project.value) == null ? void 0 : _a2.actualEndDate) != null ? _b2 : "\u2014")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString((_d = (_c = project.value) == null ? void 0 : _c.actualEndDate) != null ? _d : "\u2014"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2, _c, _d;
                              if (_push5) {
                                _push5(`${ssrInterpolate((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logCycleDays) != null ? _b2 : 1)} \u5929`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString((_d = (_c = project.value) == null ? void 0 : _c.logCycleDays) != null ? _d : 1) + " \u5929", 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "\u6C47\u62A5\u5468\u671F" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              var _a2, _b2, _c, _d;
                              if (_push5) {
                                _push5(`${ssrInterpolate((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logReportCycleDays) != null ? _b2 : 1)} \u5929`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString((_d = (_c = project.value) == null ? void 0 : _c.logReportCycleDays) != null ? _d : 1) + " \u5929", 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_descriptions_item, { label: "\u9879\u76EE\u540D\u79F0" }, {
                              default: withCtx(() => {
                                var _a2;
                                return [
                                  createTextVNode(toDisplayString((_a2 = project.value) == null ? void 0 : _a2.name), 1)
                                ];
                              }),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                              default: withCtx(() => {
                                var _a2;
                                return [
                                  createTextVNode(toDisplayString(((_a2 = project.value) == null ? void 0 : _a2.status) === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                                ];
                              }),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                              default: withCtx(() => {
                                var _a2, _b2;
                                return [
                                  createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.startDate) != null ? _b2 : "\u2014"), 1)
                                ];
                              }),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "\u5B9E\u9645\u5B8C\u5DE5\u65E5\u671F" }, {
                              default: withCtx(() => {
                                var _a2, _b2;
                                return [
                                  createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.actualEndDate) != null ? _b2 : "\u2014"), 1)
                                ];
                              }),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F" }, {
                              default: withCtx(() => {
                                var _a2, _b2;
                                return [
                                  createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                                ];
                              }),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "\u6C47\u62A5\u5468\u671F" }, {
                              default: withCtx(() => {
                                var _a2, _b2;
                                return [
                                  createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logReportCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                                ];
                              }),
                              _: 1
                            })
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    if (isCeo.value) {
                      _push3(`<!--[-->`);
                      _push3(ssrRenderComponent(_component_a_divider, null, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`\u9879\u76EE\u914D\u7F6E`);
                          } else {
                            return [
                              createTextVNode("\u9879\u76EE\u914D\u7F6E")
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(ssrRenderComponent(_component_a_form, {
                        layout: "inline",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(ssrRenderComponent(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_input_number, {
                                    value: configForm.value.logCycleDays,
                                    "onUpdate:value": ($event) => configForm.value.logCycleDays = $event,
                                    min: 1,
                                    max: 30
                                  }, null, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_input_number, {
                                      value: configForm.value.logCycleDays,
                                      "onUpdate:value": ($event) => configForm.value.logCycleDays = $event,
                                      min: 1,
                                      max: 30
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ];
                                }
                              }),
                              _: 1
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_form_item, { label: "\u6C47\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_input_number, {
                                    value: configForm.value.logReportCycleDays,
                                    "onUpdate:value": ($event) => configForm.value.logReportCycleDays = $event,
                                    min: 1,
                                    max: 90
                                  }, null, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_input_number, {
                                      value: configForm.value.logReportCycleDays,
                                      "onUpdate:value": ($event) => configForm.value.logReportCycleDays = $event,
                                      min: 1,
                                      max: 90
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ];
                                }
                              }),
                              _: 1
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_form_item, null, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_button, {
                                    type: "primary",
                                    loading: configLoading.value,
                                    onClick: doUpdateConfig
                                  }, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`\u4FDD\u5B58\u914D\u7F6E`);
                                      } else {
                                        return [
                                          createTextVNode("\u4FDD\u5B58\u914D\u7F6E")
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_button, {
                                      type: "primary",
                                      loading: configLoading.value,
                                      onClick: doUpdateConfig
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u4FDD\u5B58\u914D\u7F6E")
                                      ]),
                                      _: 1
                                    }, 8, ["loading"])
                                  ];
                                }
                              }),
                              _: 1
                            }, _parent4, _scopeId3));
                          } else {
                            return [
                              createVNode(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_input_number, {
                                    value: configForm.value.logCycleDays,
                                    "onUpdate:value": ($event) => configForm.value.logCycleDays = $event,
                                    min: 1,
                                    max: 30
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, { label: "\u6C47\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_input_number, {
                                    value: configForm.value.logReportCycleDays,
                                    "onUpdate:value": ($event) => configForm.value.logReportCycleDays = $event,
                                    min: 1,
                                    max: 90
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "primary",
                                    loading: configLoading.value,
                                    onClick: doUpdateConfig
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u4FDD\u5B58\u914D\u7F6E")
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
                      }, _parent3, _scopeId2));
                      _push3(`<!--]-->`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(ssrRenderComponent(_component_a_divider, null, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`\u9879\u76EE\u6210\u5458`);
                        } else {
                          return [
                            createTextVNode("\u9879\u76EE\u6210\u5458")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    if (isCeo.value) {
                      _push3(`<div style="${ssrRenderStyle({ "margin-bottom": "12px" })}"${_scopeId2}>`);
                      _push3(ssrRenderComponent(_component_a_space, null, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(ssrRenderComponent(_component_a_input_number, {
                              value: addMemberForm.value.employeeId,
                              "onUpdate:value": ($event) => addMemberForm.value.employeeId = $event,
                              placeholder: "\u5458\u5DE5ID",
                              min: 1,
                              style: { "width": "120px" }
                            }, null, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_select, {
                              value: addMemberForm.value.role,
                              "onUpdate:value": ($event) => addMemberForm.value.role = $event,
                              style: { "width": "120px" }
                            }, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_select_option, { value: "PM" }, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`PM`);
                                      } else {
                                        return [
                                          createTextVNode("PM")
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                  _push5(ssrRenderComponent(_component_a_select_option, { value: "MEMBER" }, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`\u6210\u5458`);
                                      } else {
                                        return [
                                          createTextVNode("\u6210\u5458")
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_select_option, { value: "PM" }, {
                                      default: withCtx(() => [
                                        createTextVNode("PM")
                                      ]),
                                      _: 1
                                    }),
                                    createVNode(_component_a_select_option, { value: "MEMBER" }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u6210\u5458")
                                      ]),
                                      _: 1
                                    })
                                  ];
                                }
                              }),
                              _: 1
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_button, {
                              type: "primary",
                              loading: addMemberLoading.value,
                              onClick: doAddMember
                            }, {
                              default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`\u6DFB\u52A0\u6210\u5458`);
                                } else {
                                  return [
                                    createTextVNode("\u6DFB\u52A0\u6210\u5458")
                                  ];
                                }
                              }),
                              _: 1
                            }, _parent4, _scopeId3));
                          } else {
                            return [
                              createVNode(_component_a_input_number, {
                                value: addMemberForm.value.employeeId,
                                "onUpdate:value": ($event) => addMemberForm.value.employeeId = $event,
                                placeholder: "\u5458\u5DE5ID",
                                min: 1,
                                style: { "width": "120px" }
                              }, null, 8, ["value", "onUpdate:value"]),
                              createVNode(_component_a_select, {
                                value: addMemberForm.value.role,
                                "onUpdate:value": ($event) => addMemberForm.value.role = $event,
                                style: { "width": "120px" }
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_select_option, { value: "PM" }, {
                                    default: withCtx(() => [
                                      createTextVNode("PM")
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_select_option, { value: "MEMBER" }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u6210\u5458")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }, 8, ["value", "onUpdate:value"]),
                              createVNode(_component_a_button, {
                                type: "primary",
                                loading: addMemberLoading.value,
                                onClick: doAddMember
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u6DFB\u52A0\u6210\u5458")
                                ]),
                                _: 1
                              }, 8, ["loading"])
                            ];
                          }
                        }),
                        _: 1
                      }, _parent3, _scopeId2));
                      _push3(`</div>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(ssrRenderComponent(_component_a_table, {
                      columns: memberColumns,
                      "data-source": members.value,
                      loading: loadingProject.value,
                      "row-key": "employeeId",
                      size: "small",
                      pagination: false
                    }, {
                      bodyCell: withCtx(({ column, record }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          if (column.key === "role") {
                            _push4(ssrRenderComponent(_component_a_tag, {
                              color: record.role === "PM" ? "blue" : "default"
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`${ssrInterpolate(record.role)}`);
                                } else {
                                  return [
                                    createTextVNode(toDisplayString(record.role), 1)
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                          } else {
                            _push4(`<!---->`);
                          }
                          if (column.key === "action" && isCeo.value) {
                            _push4(ssrRenderComponent(_component_a_popconfirm, {
                              title: "\u786E\u8BA4\u79FB\u9664\u8BE5\u6210\u5458\uFF1F",
                              onConfirm: ($event) => doRemoveMember(record.employeeId)
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: ""
                                  }, {
                                    default: withCtx((_4, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`\u79FB\u9664`);
                                      } else {
                                        return [
                                          createTextVNode("\u79FB\u9664")
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      danger: ""
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u79FB\u9664")
                                      ]),
                                      _: 1
                                    })
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                          } else {
                            _push4(`<!---->`);
                          }
                        } else {
                          return [
                            column.key === "role" ? (openBlock(), createBlock(_component_a_tag, {
                              key: 0,
                              color: record.role === "PM" ? "blue" : "default"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(record.role), 1)
                              ]),
                              _: 2
                            }, 1032, ["color"])) : createCommentVNode("", true),
                            column.key === "action" && isCeo.value ? (openBlock(), createBlock(_component_a_popconfirm, {
                              key: 1,
                              title: "\u786E\u8BA4\u79FB\u9664\u8BE5\u6210\u5458\uFF1F",
                              onConfirm: ($event) => doRemoveMember(record.employeeId)
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  danger: ""
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u79FB\u9664")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["onConfirm"])) : createCommentVNode("", true)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (activeTab.value === "milestones") {
                    _push3(`<!--[--><div style="${ssrRenderStyle({ "margin-bottom": "12px" })}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "primary",
                      onClick: ($event) => showMilestoneModal.value = true
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`+ \u65B0\u5EFA\u91CC\u7A0B\u7891`);
                        } else {
                          return [
                            createTextVNode("+ \u65B0\u5EFA\u91CC\u7A0B\u7891")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_button, {
                      style: { "margin-left": "8px" },
                      onClick: loadMilestones,
                      loading: loadingMilestones.value
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`\u5237\u65B0`);
                        } else {
                          return [
                            createTextVNode("\u5237\u65B0")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`</div>`);
                    _push3(ssrRenderComponent(_component_a_table, {
                      columns: milestoneColumns,
                      "data-source": milestones.value,
                      loading: loadingMilestones.value,
                      "row-key": "id",
                      size: "small",
                      pagination: false
                    }, {
                      bodyCell: withCtx(({ column, record }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          if (column.key === "actualCompletionDate") {
                            _push4(`<!--[-->`);
                            if (record.actualCompletionDate) {
                              _push4(ssrRenderComponent(_component_a_tag, { color: "green" }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(` \u5DF2\u5B8C\u6210 ${ssrInterpolate(record.actualCompletionDate)}`);
                                  } else {
                                    return [
                                      createTextVNode(" \u5DF2\u5B8C\u6210 " + toDisplayString(record.actualCompletionDate), 1)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(ssrRenderComponent(_component_a_tag, { color: "orange" }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`\u8FDB\u884C\u4E2D`);
                                  } else {
                                    return [
                                      createTextVNode("\u8FDB\u884C\u4E2D")
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            }
                            _push4(`<!--]-->`);
                          } else {
                            _push4(`<!---->`);
                          }
                          if (column.key === "action") {
                            _push4(ssrRenderComponent(_component_a_space, null, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    onClick: ($event) => openEditMilestone(record)
                                  }, {
                                    default: withCtx((_4, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`\u7F16\u8F91`);
                                      } else {
                                        return [
                                          createTextVNode("\u7F16\u8F91")
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                  if (!record.actualCompletionDate) {
                                    _push5(ssrRenderComponent(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      onClick: ($event) => doMarkMilestoneComplete(record)
                                    }, {
                                      default: withCtx((_4, _push6, _parent6, _scopeId5) => {
                                        if (_push6) {
                                          _push6(`\u6807\u8BB0\u5B8C\u6210`);
                                        } else {
                                          return [
                                            createTextVNode("\u6807\u8BB0\u5B8C\u6210")
                                          ];
                                        }
                                      }),
                                      _: 2
                                    }, _parent5, _scopeId4));
                                  } else {
                                    _push5(`<!---->`);
                                  }
                                  _push5(ssrRenderComponent(_component_a_popconfirm, {
                                    title: "\u786E\u8BA4\u5220\u9664\u8BE5\u91CC\u7A0B\u7891\uFF1F",
                                    onConfirm: ($event) => doDeleteMilestone(record.id)
                                  }, {
                                    default: withCtx((_4, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(ssrRenderComponent(_component_a_button, {
                                          type: "link",
                                          size: "small",
                                          danger: ""
                                        }, {
                                          default: withCtx((_5, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(`\u5220\u9664`);
                                            } else {
                                              return [
                                                createTextVNode("\u5220\u9664")
                                              ];
                                            }
                                          }),
                                          _: 2
                                        }, _parent6, _scopeId5));
                                      } else {
                                        return [
                                          createVNode(_component_a_button, {
                                            type: "link",
                                            size: "small",
                                            danger: ""
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode("\u5220\u9664")
                                            ]),
                                            _: 1
                                          })
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                } else {
                                  return [
                                    createVNode(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      onClick: ($event) => openEditMilestone(record)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u7F16\u8F91")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"]),
                                    !record.actualCompletionDate ? (openBlock(), createBlock(_component_a_button, {
                                      key: 0,
                                      type: "link",
                                      size: "small",
                                      onClick: ($event) => doMarkMilestoneComplete(record)
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u6807\u8BB0\u5B8C\u6210")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])) : createCommentVNode("", true),
                                    createVNode(_component_a_popconfirm, {
                                      title: "\u786E\u8BA4\u5220\u9664\u8BE5\u91CC\u7A0B\u7891\uFF1F",
                                      onConfirm: ($event) => doDeleteMilestone(record.id)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_button, {
                                          type: "link",
                                          size: "small",
                                          danger: ""
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u5220\u9664")
                                          ]),
                                          _: 1
                                        })
                                      ]),
                                      _: 1
                                    }, 8, ["onConfirm"])
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                          } else {
                            _push4(`<!---->`);
                          }
                        } else {
                          return [
                            column.key === "actualCompletionDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                              record.actualCompletionDate ? (openBlock(), createBlock(_component_a_tag, {
                                key: 0,
                                color: "green"
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" \u5DF2\u5B8C\u6210 " + toDisplayString(record.actualCompletionDate), 1)
                                ]),
                                _: 2
                              }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                                key: 1,
                                color: "orange"
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u8FDB\u884C\u4E2D")
                                ]),
                                _: 1
                              }))
                            ], 64)) : createCommentVNode("", true),
                            column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 1 }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  onClick: ($event) => openEditMilestone(record)
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u7F16\u8F91")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                !record.actualCompletionDate ? (openBlock(), createBlock(_component_a_button, {
                                  key: 0,
                                  type: "link",
                                  size: "small",
                                  onClick: ($event) => doMarkMilestoneComplete(record)
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u6807\u8BB0\u5B8C\u6210")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])) : createCommentVNode("", true),
                                createVNode(_component_a_popconfirm, {
                                  title: "\u786E\u8BA4\u5220\u9664\u8BE5\u91CC\u7A0B\u7891\uFF1F",
                                  onConfirm: ($event) => doDeleteMilestone(record.id)
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      danger: ""
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u5220\u9664")
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["onConfirm"])
                              ]),
                              _: 2
                            }, 1024)) : createCommentVNode("", true)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_modal, {
                      open: showMilestoneModal.value,
                      "onUpdate:open": ($event) => showMilestoneModal.value = $event,
                      title: editingMilestone.value ? "\u7F16\u8F91\u91CC\u7A0B\u7891" : "\u65B0\u5EFA\u91CC\u7A0B\u7891",
                      onOk: doSaveMilestone,
                      "confirm-loading": milestoneLoading.value,
                      onCancel: resetMilestoneForm
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_form, {
                            model: milestoneForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_form_item, {
                                  label: "\u540D\u79F0",
                                  required: ""
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_input, {
                                        value: milestoneForm.value.name,
                                        "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_input, {
                                          value: milestoneForm.value.name,
                                          "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_input_number, {
                                        value: milestoneForm.value.sort,
                                        "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                        min: 0,
                                        style: { "width": "100%" }
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_input_number, {
                                          value: milestoneForm.value.sort,
                                          "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                          min: 0,
                                          style: { "width": "100%" }
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "\u5B9E\u9645\u5B8C\u6210\u65E5\u671F\uFF08\u53EF\u9009\uFF09" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_date_picker, {
                                        value: milestoneForm.value.actualCompletionDate,
                                        "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_date_picker, {
                                          value: milestoneForm.value.actualCompletionDate,
                                          "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                          style: { "width": "100%" },
                                          "value-format": "YYYY-MM-DD"
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_form_item, {
                                    label: "\u540D\u79F0",
                                    required: ""
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_input, {
                                        value: milestoneForm.value.name,
                                        "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_input_number, {
                                        value: milestoneForm.value.sort,
                                        "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                        min: 0,
                                        style: { "width": "100%" }
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, { label: "\u5B9E\u9645\u5B8C\u6210\u65E5\u671F\uFF08\u53EF\u9009\uFF09" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_date_picker, {
                                        value: milestoneForm.value.actualCompletionDate,
                                        "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, 8, ["value", "onUpdate:value"])
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
                            createVNode(_component_a_form, {
                              model: milestoneForm.value,
                              layout: "vertical"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_form_item, {
                                  label: "\u540D\u79F0",
                                  required: ""
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_input, {
                                      value: milestoneForm.value.name,
                                      "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_input_number, {
                                      value: milestoneForm.value.sort,
                                      "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                      min: 0,
                                      style: { "width": "100%" }
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, { label: "\u5B9E\u9645\u5B8C\u6210\u65E5\u671F\uFF08\u53EF\u9009\uFF09" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_date_picker, {
                                      value: milestoneForm.value.actualCompletionDate,
                                      "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                      style: { "width": "100%" },
                                      "value-format": "YYYY-MM-DD"
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["model"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (activeTab.value === "progress") {
                    _push3(`<!--[-->`);
                    _push3(ssrRenderComponent(_component_a_card, {
                      title: "\u8BB0\u5F55\u4ECA\u65E5\u8FDB\u5EA6",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_form, {
                            model: progressForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "\u5173\u8054\u91CC\u7A0B\u7891\uFF08\u53EF\u9009\uFF09" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_select, {
                                        value: progressForm.value.milestoneId,
                                        "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                        placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                        "allow-clear": "",
                                        style: { "width": "100%" }
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(`<!--[-->`);
                                            ssrRenderList(milestones.value, (m) => {
                                              _push7(ssrRenderComponent(_component_a_select_option, {
                                                key: m.id,
                                                value: m.id
                                              }, {
                                                default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                                  if (_push8) {
                                                    _push8(`${ssrInterpolate(m.name)}`);
                                                  } else {
                                                    return [
                                                      createTextVNode(toDisplayString(m.name), 1)
                                                    ];
                                                  }
                                                }),
                                                _: 2
                                              }, _parent7, _scopeId6));
                                            });
                                            _push7(`<!--]-->`);
                                          } else {
                                            return [
                                              (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                                return openBlock(), createBlock(_component_a_select_option, {
                                                  key: m.id,
                                                  value: m.id
                                                }, {
                                                  default: withCtx(() => [
                                                    createTextVNode(toDisplayString(m.name), 1)
                                                  ]),
                                                  _: 2
                                                }, 1032, ["value"]);
                                              }), 128))
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_select, {
                                          value: progressForm.value.milestoneId,
                                          "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                          placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                          "allow-clear": "",
                                          style: { "width": "100%" }
                                        }, {
                                          default: withCtx(() => [
                                            (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                              return openBlock(), createBlock(_component_a_select_option, {
                                                key: m.id,
                                                value: m.id
                                              }, {
                                                default: withCtx(() => [
                                                  createTextVNode(toDisplayString(m.name), 1)
                                                ]),
                                                _: 2
                                              }, 1032, ["value"]);
                                            }), 128))
                                          ]),
                                          _: 1
                                        }, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, {
                                  label: "\u8FDB\u5EA6\u8BF4\u660E",
                                  required: ""
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_textarea, {
                                        value: progressForm.value.note,
                                        "onUpdate:value": ($event) => progressForm.value.note = $event,
                                        rows: 3,
                                        placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_textarea, {
                                          value: progressForm.value.note,
                                          "onUpdate:value": ($event) => progressForm.value.note = $event,
                                          rows: 3,
                                          placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, null, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_button, {
                                        type: "primary",
                                        loading: progressLoading.value,
                                        onClick: doRecordProgress
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(`\u63D0\u4EA4\u8FDB\u5EA6`);
                                          } else {
                                            return [
                                              createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_button, {
                                          type: "primary",
                                          loading: progressLoading.value,
                                          onClick: doRecordProgress
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
                                          ]),
                                          _: 1
                                        }, 8, ["loading"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_form_item, { label: "\u5173\u8054\u91CC\u7A0B\u7891\uFF08\u53EF\u9009\uFF09" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_select, {
                                        value: progressForm.value.milestoneId,
                                        "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                        placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                        "allow-clear": "",
                                        style: { "width": "100%" }
                                      }, {
                                        default: withCtx(() => [
                                          (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                            return openBlock(), createBlock(_component_a_select_option, {
                                              key: m.id,
                                              value: m.id
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(m.name), 1)
                                              ]),
                                              _: 2
                                            }, 1032, ["value"]);
                                          }), 128))
                                        ]),
                                        _: 1
                                      }, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, {
                                    label: "\u8FDB\u5EA6\u8BF4\u660E",
                                    required: ""
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_textarea, {
                                        value: progressForm.value.note,
                                        "onUpdate:value": ($event) => progressForm.value.note = $event,
                                        rows: 3,
                                        placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, null, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "primary",
                                        loading: progressLoading.value,
                                        onClick: doRecordProgress
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
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
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_form, {
                              model: progressForm.value,
                              layout: "vertical"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_form_item, { label: "\u5173\u8054\u91CC\u7A0B\u7891\uFF08\u53EF\u9009\uFF09" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_select, {
                                      value: progressForm.value.milestoneId,
                                      "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                      placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                      "allow-clear": "",
                                      style: { "width": "100%" }
                                    }, {
                                      default: withCtx(() => [
                                        (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                          return openBlock(), createBlock(_component_a_select_option, {
                                            key: m.id,
                                            value: m.id
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode(toDisplayString(m.name), 1)
                                            ]),
                                            _: 2
                                          }, 1032, ["value"]);
                                        }), 128))
                                      ]),
                                      _: 1
                                    }, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, {
                                  label: "\u8FDB\u5EA6\u8BF4\u660E",
                                  required: ""
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_textarea, {
                                      value: progressForm.value.note,
                                      "onUpdate:value": ($event) => progressForm.value.note = $event,
                                      rows: 3,
                                      placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "primary",
                                      loading: progressLoading.value,
                                      onClick: doRecordProgress
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
                                      ]),
                                      _: 1
                                    }, 8, ["loading"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["model"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_card, { title: "\u8FDB\u5EA6\u5386\u53F2" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_spin, { spinning: loadingDashboard.value }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                if (progressLogs.value.length > 0) {
                                  _push5(ssrRenderComponent(_component_a_timeline, null, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`<!--[-->`);
                                        ssrRenderList(progressLogs.value, (log) => {
                                          _push6(ssrRenderComponent(_component_a_timeline_item, {
                                            key: log.id,
                                            color: "blue"
                                          }, {
                                            default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                              var _a2, _b2, _c, _d;
                                              if (_push7) {
                                                _push7(`<div style="${ssrRenderStyle({ "font-weight": "500" })}"${_scopeId6}>${ssrInterpolate((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014")}</div><div${_scopeId6}>${ssrInterpolate(log.note)}</div>`);
                                                if (log.milestoneId) {
                                                  _push7(`<div style="${ssrRenderStyle({ "color": "#888", "font-size": "12px" })}"${_scopeId6}> \u91CC\u7A0B\u7891 #${ssrInterpolate(log.milestoneId)}</div>`);
                                                } else {
                                                  _push7(`<!---->`);
                                                }
                                              } else {
                                                return [
                                                  createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_d = (_c = log.createdAt) == null ? void 0 : _c.slice(0, 10)) != null ? _d : "\u2014"), 1),
                                                  createVNode("div", null, toDisplayString(log.note), 1),
                                                  log.milestoneId ? (openBlock(), createBlock("div", {
                                                    key: 0,
                                                    style: { "color": "#888", "font-size": "12px" }
                                                  }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                                ];
                                              }
                                            }),
                                            _: 2
                                          }, _parent6, _scopeId5));
                                        });
                                        _push6(`<!--]-->`);
                                      } else {
                                        return [
                                          (openBlock(true), createBlock(Fragment, null, renderList(progressLogs.value, (log) => {
                                            return openBlock(), createBlock(_component_a_timeline_item, {
                                              key: log.id,
                                              color: "blue"
                                            }, {
                                              default: withCtx(() => {
                                                var _a2, _b2;
                                                return [
                                                  createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014"), 1),
                                                  createVNode("div", null, toDisplayString(log.note), 1),
                                                  log.milestoneId ? (openBlock(), createBlock("div", {
                                                    key: 0,
                                                    style: { "color": "#888", "font-size": "12px" }
                                                  }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                                ];
                                              }),
                                              _: 2
                                            }, 1024);
                                          }), 128))
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                } else {
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "\u6682\u65E0\u8FDB\u5EA6\u8BB0\u5F55" }, null, _parent5, _scopeId4));
                                }
                              } else {
                                return [
                                  progressLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                                    default: withCtx(() => [
                                      (openBlock(true), createBlock(Fragment, null, renderList(progressLogs.value, (log) => {
                                        return openBlock(), createBlock(_component_a_timeline_item, {
                                          key: log.id,
                                          color: "blue"
                                        }, {
                                          default: withCtx(() => {
                                            var _a2, _b2;
                                            return [
                                              createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014"), 1),
                                              createVNode("div", null, toDisplayString(log.note), 1),
                                              log.milestoneId ? (openBlock(), createBlock("div", {
                                                key: 0,
                                                style: { "color": "#888", "font-size": "12px" }
                                              }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                            ];
                                          }),
                                          _: 2
                                        }, 1024);
                                      }), 128))
                                    ]),
                                    _: 1
                                  })) : (openBlock(), createBlock(_component_a_empty, {
                                    key: 1,
                                    description: "\u6682\u65E0\u8FDB\u5EA6\u8BB0\u5F55"
                                  }))
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                              default: withCtx(() => [
                                progressLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                                  default: withCtx(() => [
                                    (openBlock(true), createBlock(Fragment, null, renderList(progressLogs.value, (log) => {
                                      return openBlock(), createBlock(_component_a_timeline_item, {
                                        key: log.id,
                                        color: "blue"
                                      }, {
                                        default: withCtx(() => {
                                          var _a2, _b2;
                                          return [
                                            createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014"), 1),
                                            createVNode("div", null, toDisplayString(log.note), 1),
                                            log.milestoneId ? (openBlock(), createBlock("div", {
                                              key: 0,
                                              style: { "color": "#888", "font-size": "12px" }
                                            }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                          ];
                                        }),
                                        _: 2
                                      }, 1024);
                                    }), 128))
                                  ]),
                                  _: 1
                                })) : (openBlock(), createBlock(_component_a_empty, {
                                  key: 1,
                                  description: "\u6682\u65E0\u8FDB\u5EA6\u8BB0\u5F55"
                                }))
                              ]),
                              _: 1
                            }, 8, ["spinning"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (activeTab.value === "dashboard") {
                    _push3(ssrRenderComponent(_component_a_spin, { spinning: loadingDashboard.value }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_row, {
                            gutter: 16,
                            style: { "margin-bottom": "16px" }
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_col, { span: 8 }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_card, null, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_a_statistic, {
                                              title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                              value: dashboard.value.workItemSummary.completed,
                                              suffix: `/ ${dashboard.value.workItemSummary.total}`
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                                value: dashboard.value.workItemSummary.completed,
                                                suffix: `/ ${dashboard.value.workItemSummary.total}`
                                              }, null, 8, ["value", "suffix"])
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_card, null, {
                                          default: withCtx(() => [
                                            createVNode(_component_a_statistic, {
                                              title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                              value: dashboard.value.workItemSummary.completed,
                                              suffix: `/ ${dashboard.value.workItemSummary.total}`
                                            }, null, 8, ["value", "suffix"])
                                          ]),
                                          _: 1
                                        })
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_col, { span: 8 }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_card, null, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_a_statistic, {
                                              title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                              value: dashboard.value.timeSeriesData.length,
                                              suffix: "\u6761"
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                                value: dashboard.value.timeSeriesData.length,
                                                suffix: "\u6761"
                                              }, null, 8, ["value"])
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_card, null, {
                                          default: withCtx(() => [
                                            createVNode(_component_a_statistic, {
                                              title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                              value: dashboard.value.timeSeriesData.length,
                                              suffix: "\u6761"
                                            }, null, 8, ["value"])
                                          ]),
                                          _: 1
                                        })
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_col, { span: 8 }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_card, null, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_a_statistic, {
                                              title: "\u6C47\u603B\u62A5\u544A",
                                              value: dashboard.value.summaries.length,
                                              suffix: "\u4EFD"
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "\u6C47\u603B\u62A5\u544A",
                                                value: dashboard.value.summaries.length,
                                                suffix: "\u4EFD"
                                              }, null, 8, ["value"])
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_card, null, {
                                          default: withCtx(() => [
                                            createVNode(_component_a_statistic, {
                                              title: "\u6C47\u603B\u62A5\u544A",
                                              value: dashboard.value.summaries.length,
                                              suffix: "\u4EFD"
                                            }, null, 8, ["value"])
                                          ]),
                                          _: 1
                                        })
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_col, { span: 8 }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_card, null, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_statistic, {
                                            title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                            value: dashboard.value.workItemSummary.completed,
                                            suffix: `/ ${dashboard.value.workItemSummary.total}`
                                          }, null, 8, ["value", "suffix"])
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_col, { span: 8 }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_card, null, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_statistic, {
                                            title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                            value: dashboard.value.timeSeriesData.length,
                                            suffix: "\u6761"
                                          }, null, 8, ["value"])
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_col, { span: 8 }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_card, null, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_statistic, {
                                            title: "\u6C47\u603B\u62A5\u544A",
                                            value: dashboard.value.summaries.length,
                                            suffix: "\u4EFD"
                                          }, null, 8, ["value"])
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
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_card, {
                            title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u7387",
                            style: { "margin-bottom": "16px" }
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_progress, {
                                  percent: milestonesCompletionPct.value,
                                  status: "active",
                                  "stroke-color": { from: "#108ee9", to: "#87d068" }
                                }, null, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_list, {
                                  size: "small",
                                  "data-source": dashboard.value.milestones,
                                  style: { "margin-top": "12px" }
                                }, {
                                  renderItem: withCtx(({ item }, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_list_item, null, {
                                        default: withCtx((_5, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(ssrRenderComponent(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                              default: withCtx((_6, _push8, _parent8, _scopeId7) => {
                                                if (_push8) {
                                                  _push8(`<span${_scopeId7}>${ssrInterpolate(item.name)}</span>`);
                                                  _push8(ssrRenderComponent(_component_a_tag, {
                                                    color: item.actualCompletionDate ? "green" : "orange"
                                                  }, {
                                                    default: withCtx((_7, _push9, _parent9, _scopeId8) => {
                                                      if (_push9) {
                                                        _push9(`${ssrInterpolate(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D")}`);
                                                      } else {
                                                        return [
                                                          createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                                        ];
                                                      }
                                                    }),
                                                    _: 2
                                                  }, _parent8, _scopeId7));
                                                } else {
                                                  return [
                                                    createVNode("span", null, toDisplayString(item.name), 1),
                                                    createVNode(_component_a_tag, {
                                                      color: item.actualCompletionDate ? "green" : "orange"
                                                    }, {
                                                      default: withCtx(() => [
                                                        createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                                      ]),
                                                      _: 2
                                                    }, 1032, ["color"])
                                                  ];
                                                }
                                              }),
                                              _: 2
                                            }, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                                default: withCtx(() => [
                                                  createVNode("span", null, toDisplayString(item.name), 1),
                                                  createVNode(_component_a_tag, {
                                                    color: item.actualCompletionDate ? "green" : "orange"
                                                  }, {
                                                    default: withCtx(() => [
                                                      createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                                    ]),
                                                    _: 2
                                                  }, 1032, ["color"])
                                                ]),
                                                _: 2
                                              }, 1024)
                                            ];
                                          }
                                        }),
                                        _: 2
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_list_item, null, {
                                          default: withCtx(() => [
                                            createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                              default: withCtx(() => [
                                                createVNode("span", null, toDisplayString(item.name), 1),
                                                createVNode(_component_a_tag, {
                                                  color: item.actualCompletionDate ? "green" : "orange"
                                                }, {
                                                  default: withCtx(() => [
                                                    createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                                  ]),
                                                  _: 2
                                                }, 1032, ["color"])
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
                                }, _parent5, _scopeId4));
                                if (dashboard.value.milestones.length === 0) {
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "\u6682\u65E0\u91CC\u7A0B\u7891" }, null, _parent5, _scopeId4));
                                } else {
                                  _push5(`<!---->`);
                                }
                              } else {
                                return [
                                  createVNode(_component_a_progress, {
                                    percent: milestonesCompletionPct.value,
                                    status: "active",
                                    "stroke-color": { from: "#108ee9", to: "#87d068" }
                                  }, null, 8, ["percent"]),
                                  createVNode(_component_a_list, {
                                    size: "small",
                                    "data-source": dashboard.value.milestones,
                                    style: { "margin-top": "12px" }
                                  }, {
                                    renderItem: withCtx(({ item }) => [
                                      createVNode(_component_a_list_item, null, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                            default: withCtx(() => [
                                              createVNode("span", null, toDisplayString(item.name), 1),
                                              createVNode(_component_a_tag, {
                                                color: item.actualCompletionDate ? "green" : "orange"
                                              }, {
                                                default: withCtx(() => [
                                                  createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                                ]),
                                                _: 2
                                              }, 1032, ["color"])
                                            ]),
                                            _: 2
                                          }, 1024)
                                        ]),
                                        _: 2
                                      }, 1024)
                                    ]),
                                    _: 1
                                  }, 8, ["data-source"]),
                                  dashboard.value.milestones.length === 0 ? (openBlock(), createBlock(_component_a_empty, {
                                    key: 0,
                                    description: "\u6682\u65E0\u91CC\u7A0B\u7891"
                                  })) : createCommentVNode("", true)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_card, { title: "\u8FDB\u5EA6\u65F6\u95F4\u8F74\uFF08\u6700\u8FD1 10 \u6761\uFF09" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                if (recentLogs.value.length > 0) {
                                  _push5(ssrRenderComponent(_component_a_timeline, null, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`<!--[-->`);
                                        ssrRenderList(recentLogs.value, (log, idx) => {
                                          _push6(ssrRenderComponent(_component_a_timeline_item, {
                                            key: idx,
                                            color: "blue"
                                          }, {
                                            default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                              if (_push7) {
                                                _push7(`<span style="${ssrRenderStyle({ "font-weight": "500" })}"${_scopeId6}>${ssrInterpolate(log.date)}</span><span style="${ssrRenderStyle({ "margin-left": "8px", "color": "#555" })}"${_scopeId6}>${ssrInterpolate(log.note)}</span>`);
                                              } else {
                                                return [
                                                  createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                                  createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                                ];
                                              }
                                            }),
                                            _: 2
                                          }, _parent6, _scopeId5));
                                        });
                                        _push6(`<!--]-->`);
                                      } else {
                                        return [
                                          (openBlock(true), createBlock(Fragment, null, renderList(recentLogs.value, (log, idx) => {
                                            return openBlock(), createBlock(_component_a_timeline_item, {
                                              key: idx,
                                              color: "blue"
                                            }, {
                                              default: withCtx(() => [
                                                createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                                createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                              ]),
                                              _: 2
                                            }, 1024);
                                          }), 128))
                                        ];
                                      }
                                    }),
                                    _: 1
                                  }, _parent5, _scopeId4));
                                } else {
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "\u6682\u65E0\u8FDB\u5EA6\u6570\u636E" }, null, _parent5, _scopeId4));
                                }
                              } else {
                                return [
                                  recentLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                                    default: withCtx(() => [
                                      (openBlock(true), createBlock(Fragment, null, renderList(recentLogs.value, (log, idx) => {
                                        return openBlock(), createBlock(_component_a_timeline_item, {
                                          key: idx,
                                          color: "blue"
                                        }, {
                                          default: withCtx(() => [
                                            createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                            createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                          ]),
                                          _: 2
                                        }, 1024);
                                      }), 128))
                                    ]),
                                    _: 1
                                  })) : (openBlock(), createBlock(_component_a_empty, {
                                    key: 1,
                                    description: "\u6682\u65E0\u8FDB\u5EA6\u6570\u636E"
                                  }))
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_row, {
                              gutter: 16,
                              style: { "margin-bottom": "16px" }
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_col, { span: 8 }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_card, null, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_statistic, {
                                          title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                          value: dashboard.value.workItemSummary.completed,
                                          suffix: `/ ${dashboard.value.workItemSummary.total}`
                                        }, null, 8, ["value", "suffix"])
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_col, { span: 8 }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_card, null, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_statistic, {
                                          title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                          value: dashboard.value.timeSeriesData.length,
                                          suffix: "\u6761"
                                        }, null, 8, ["value"])
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_col, { span: 8 }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_card, null, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_statistic, {
                                          title: "\u6C47\u603B\u62A5\u544A",
                                          value: dashboard.value.summaries.length,
                                          suffix: "\u4EFD"
                                        }, null, 8, ["value"])
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_card, {
                              title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u7387",
                              style: { "margin-bottom": "16px" }
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_progress, {
                                  percent: milestonesCompletionPct.value,
                                  status: "active",
                                  "stroke-color": { from: "#108ee9", to: "#87d068" }
                                }, null, 8, ["percent"]),
                                createVNode(_component_a_list, {
                                  size: "small",
                                  "data-source": dashboard.value.milestones,
                                  style: { "margin-top": "12px" }
                                }, {
                                  renderItem: withCtx(({ item }) => [
                                    createVNode(_component_a_list_item, null, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                          default: withCtx(() => [
                                            createVNode("span", null, toDisplayString(item.name), 1),
                                            createVNode(_component_a_tag, {
                                              color: item.actualCompletionDate ? "green" : "orange"
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                              ]),
                                              _: 2
                                            }, 1032, ["color"])
                                          ]),
                                          _: 2
                                        }, 1024)
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 1
                                }, 8, ["data-source"]),
                                dashboard.value.milestones.length === 0 ? (openBlock(), createBlock(_component_a_empty, {
                                  key: 0,
                                  description: "\u6682\u65E0\u91CC\u7A0B\u7891"
                                })) : createCommentVNode("", true)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_card, { title: "\u8FDB\u5EA6\u65F6\u95F4\u8F74\uFF08\u6700\u8FD1 10 \u6761\uFF09" }, {
                              default: withCtx(() => [
                                recentLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                                  default: withCtx(() => [
                                    (openBlock(true), createBlock(Fragment, null, renderList(recentLogs.value, (log, idx) => {
                                      return openBlock(), createBlock(_component_a_timeline_item, {
                                        key: idx,
                                        color: "blue"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                          createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                        ]),
                                        _: 2
                                      }, 1024);
                                    }), 128))
                                  ]),
                                  _: 1
                                })) : (openBlock(), createBlock(_component_a_empty, {
                                  key: 1,
                                  description: "\u6682\u65E0\u8FDB\u5EA6\u6570\u636E"
                                }))
                              ]),
                              _: 1
                            })
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  if (activeTab.value === "summary") {
                    _push3(`<!--[-->`);
                    _push3(ssrRenderComponent(_component_a_card, {
                      title: "\u751F\u6210\u6C47\u603B\u62A5\u544A",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_form, {
                            model: summaryForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_form_item, {
                                  label: "\u7EDF\u8BA1\u8D77\u59CB\u65E5\u671F",
                                  required: ""
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_date_picker, {
                                        value: summaryForm.value.periodStart,
                                        "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_date_picker, {
                                          value: summaryForm.value.periodStart,
                                          "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                          style: { "width": "100%" },
                                          "value-format": "YYYY-MM-DD"
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, {
                                  label: "\u7EDF\u8BA1\u622A\u6B62\u65E5\u671F",
                                  required: ""
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_date_picker, {
                                        value: summaryForm.value.periodEnd,
                                        "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_date_picker, {
                                          value: summaryForm.value.periodEnd,
                                          "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                          style: { "width": "100%" },
                                          "value-format": "YYYY-MM-DD"
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "PM \u5907\u6CE8" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_textarea, {
                                        value: summaryForm.value.pmNote,
                                        "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                        rows: 3
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_textarea, {
                                          value: summaryForm.value.pmNote,
                                          "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                          rows: 3
                                        }, null, 8, ["value", "onUpdate:value"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                                _push5(ssrRenderComponent(_component_a_form_item, null, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_button, {
                                        type: "primary",
                                        loading: summaryLoading.value,
                                        onClick: doCreateSummary
                                      }, {
                                        default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                          if (_push7) {
                                            _push7(`\u751F\u6210\u5E76\u901A\u77E5 CEO`);
                                          } else {
                                            return [
                                              createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
                                            ];
                                          }
                                        }),
                                        _: 1
                                      }, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_button, {
                                          type: "primary",
                                          loading: summaryLoading.value,
                                          onClick: doCreateSummary
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
                                          ]),
                                          _: 1
                                        }, 8, ["loading"])
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_form_item, {
                                    label: "\u7EDF\u8BA1\u8D77\u59CB\u65E5\u671F",
                                    required: ""
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_date_picker, {
                                        value: summaryForm.value.periodStart,
                                        "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, {
                                    label: "\u7EDF\u8BA1\u622A\u6B62\u65E5\u671F",
                                    required: ""
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_date_picker, {
                                        value: summaryForm.value.periodEnd,
                                        "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                        style: { "width": "100%" },
                                        "value-format": "YYYY-MM-DD"
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, { label: "PM \u5907\u6CE8" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_textarea, {
                                        value: summaryForm.value.pmNote,
                                        "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                        rows: 3
                                      }, null, 8, ["value", "onUpdate:value"])
                                    ]),
                                    _: 1
                                  }),
                                  createVNode(_component_a_form_item, null, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "primary",
                                        loading: summaryLoading.value,
                                        onClick: doCreateSummary
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
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
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_form, {
                              model: summaryForm.value,
                              layout: "vertical"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_form_item, {
                                  label: "\u7EDF\u8BA1\u8D77\u59CB\u65E5\u671F",
                                  required: ""
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_date_picker, {
                                      value: summaryForm.value.periodStart,
                                      "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                      style: { "width": "100%" },
                                      "value-format": "YYYY-MM-DD"
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, {
                                  label: "\u7EDF\u8BA1\u622A\u6B62\u65E5\u671F",
                                  required: ""
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_date_picker, {
                                      value: summaryForm.value.periodEnd,
                                      "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                      style: { "width": "100%" },
                                      "value-format": "YYYY-MM-DD"
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, { label: "PM \u5907\u6CE8" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_textarea, {
                                      value: summaryForm.value.pmNote,
                                      "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                      rows: 3
                                    }, null, 8, ["value", "onUpdate:value"])
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_form_item, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "primary",
                                      loading: summaryLoading.value,
                                      onClick: doCreateSummary
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
                                      ]),
                                      _: 1
                                    }, 8, ["loading"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["model"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_card, { title: "\u5386\u53F2\u6C47\u603B\u62A5\u544A" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_spin, { spinning: loadingDashboard.value }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(ssrRenderComponent(_component_a_table, {
                                  columns: summaryColumns,
                                  "data-source": dashboard.value.summaries,
                                  "row-key": "id",
                                  size: "small",
                                  pagination: { pageSize: 5 }
                                }, {
                                  bodyCell: withCtx(({ column, record }, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      if (column.key === "period") {
                                        _push6(`<!--[-->${ssrInterpolate(record.periodStart)} ~ ${ssrInterpolate(record.periodEnd)}<!--]-->`);
                                      } else {
                                        _push6(`<!---->`);
                                      }
                                      if (column.key === "notified") {
                                        _push6(ssrRenderComponent(_component_a_tag, {
                                          color: record.ceoNotifiedAt ? "green" : "orange"
                                        }, {
                                          default: withCtx((_5, _push7, _parent7, _scopeId6) => {
                                            if (_push7) {
                                              _push7(`${ssrInterpolate(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5")}`);
                                            } else {
                                              return [
                                                createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                              ];
                                            }
                                          }),
                                          _: 2
                                        }, _parent6, _scopeId5));
                                      } else {
                                        _push6(`<!---->`);
                                      }
                                    } else {
                                      return [
                                        column.key === "period" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                          createTextVNode(toDisplayString(record.periodStart) + " ~ " + toDisplayString(record.periodEnd), 1)
                                        ], 64)) : createCommentVNode("", true),
                                        column.key === "notified" ? (openBlock(), createBlock(_component_a_tag, {
                                          key: 1,
                                          color: record.ceoNotifiedAt ? "green" : "orange"
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                          ]),
                                          _: 2
                                        }, 1032, ["color"])) : createCommentVNode("", true)
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                return [
                                  createVNode(_component_a_table, {
                                    columns: summaryColumns,
                                    "data-source": dashboard.value.summaries,
                                    "row-key": "id",
                                    size: "small",
                                    pagination: { pageSize: 5 }
                                  }, {
                                    bodyCell: withCtx(({ column, record }) => [
                                      column.key === "period" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                        createTextVNode(toDisplayString(record.periodStart) + " ~ " + toDisplayString(record.periodEnd), 1)
                                      ], 64)) : createCommentVNode("", true),
                                      column.key === "notified" ? (openBlock(), createBlock(_component_a_tag, {
                                        key: 1,
                                        color: record.ceoNotifiedAt ? "green" : "orange"
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["color"])) : createCommentVNode("", true)
                                    ]),
                                    _: 1
                                  }, 8, ["data-source"])
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                              default: withCtx(() => [
                                createVNode(_component_a_table, {
                                  columns: summaryColumns,
                                  "data-source": dashboard.value.summaries,
                                  "row-key": "id",
                                  size: "small",
                                  pagination: { pageSize: 5 }
                                }, {
                                  bodyCell: withCtx(({ column, record }) => [
                                    column.key === "period" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                      createTextVNode(toDisplayString(record.periodStart) + " ~ " + toDisplayString(record.periodEnd), 1)
                                    ], 64)) : createCommentVNode("", true),
                                    column.key === "notified" ? (openBlock(), createBlock(_component_a_tag, {
                                      key: 1,
                                      color: record.ceoNotifiedAt ? "green" : "orange"
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                      ]),
                                      _: 2
                                    }, 1032, ["color"])) : createCommentVNode("", true)
                                  ]),
                                  _: 1
                                }, 8, ["data-source"])
                              ]),
                              _: 1
                            }, 8, ["spinning"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(`<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                } else {
                  return [
                    createVNode(_component_a_tabs, {
                      activeKey: activeTab.value,
                      "onUpdate:activeKey": ($event) => activeTab.value = $event
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_tab_pane, {
                          key: "info",
                          tab: "\u57FA\u672C\u4FE1\u606F"
                        }),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "milestones",
                          tab: "\u91CC\u7A0B\u7891"
                        })) : createCommentVNode("", true),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "progress",
                          tab: "\u8FDB\u5EA6\u8BB0\u5F55"
                        })) : createCommentVNode("", true),
                        createVNode(_component_a_tab_pane, {
                          key: "dashboard",
                          tab: "Dashboard"
                        }),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "summary",
                          tab: "\u6C47\u603B\u62A5\u544A"
                        })) : createCommentVNode("", true)
                      ]),
                      _: 1
                    }, 8, ["activeKey", "onUpdate:activeKey"]),
                    activeTab.value === "info" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createVNode(_component_a_descriptions, {
                        bordered: "",
                        size: "small",
                        column: 2,
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_descriptions_item, { label: "\u9879\u76EE\u540D\u79F0" }, {
                            default: withCtx(() => {
                              var _a2;
                              return [
                                createTextVNode(toDisplayString((_a2 = project.value) == null ? void 0 : _a2.name), 1)
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                            default: withCtx(() => {
                              var _a2;
                              return [
                                createTextVNode(toDisplayString(((_a2 = project.value) == null ? void 0 : _a2.status) === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                            default: withCtx(() => {
                              var _a2, _b2;
                              return [
                                createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.startDate) != null ? _b2 : "\u2014"), 1)
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "\u5B9E\u9645\u5B8C\u5DE5\u65E5\u671F" }, {
                            default: withCtx(() => {
                              var _a2, _b2;
                              return [
                                createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.actualEndDate) != null ? _b2 : "\u2014"), 1)
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F" }, {
                            default: withCtx(() => {
                              var _a2, _b2;
                              return [
                                createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                              ];
                            }),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "\u6C47\u62A5\u5468\u671F" }, {
                            default: withCtx(() => {
                              var _a2, _b2;
                              return [
                                createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logReportCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                              ];
                            }),
                            _: 1
                          })
                        ]),
                        _: 1
                      }),
                      isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createVNode(_component_a_divider, null, {
                          default: withCtx(() => [
                            createTextVNode("\u9879\u76EE\u914D\u7F6E")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_form, {
                          layout: "inline",
                          style: { "margin-bottom": "16px" }
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_input_number, {
                                  value: configForm.value.logCycleDays,
                                  "onUpdate:value": ($event) => configForm.value.logCycleDays = $event,
                                  min: 1,
                                  max: 30
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, { label: "\u6C47\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_input_number, {
                                  value: configForm.value.logReportCycleDays,
                                  "onUpdate:value": ($event) => configForm.value.logReportCycleDays = $event,
                                  min: 1,
                                  max: 90
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, null, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "primary",
                                  loading: configLoading.value,
                                  onClick: doUpdateConfig
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u4FDD\u5B58\u914D\u7F6E")
                                  ]),
                                  _: 1
                                }, 8, ["loading"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        })
                      ], 64)) : createCommentVNode("", true),
                      createVNode(_component_a_divider, null, {
                        default: withCtx(() => [
                          createTextVNode("\u9879\u76EE\u6210\u5458")
                        ]),
                        _: 1
                      }),
                      isCeo.value ? (openBlock(), createBlock("div", {
                        key: 1,
                        style: { "margin-bottom": "12px" }
                      }, [
                        createVNode(_component_a_space, null, {
                          default: withCtx(() => [
                            createVNode(_component_a_input_number, {
                              value: addMemberForm.value.employeeId,
                              "onUpdate:value": ($event) => addMemberForm.value.employeeId = $event,
                              placeholder: "\u5458\u5DE5ID",
                              min: 1,
                              style: { "width": "120px" }
                            }, null, 8, ["value", "onUpdate:value"]),
                            createVNode(_component_a_select, {
                              value: addMemberForm.value.role,
                              "onUpdate:value": ($event) => addMemberForm.value.role = $event,
                              style: { "width": "120px" }
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select_option, { value: "PM" }, {
                                  default: withCtx(() => [
                                    createTextVNode("PM")
                                  ]),
                                  _: 1
                                }),
                                createVNode(_component_a_select_option, { value: "MEMBER" }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u6210\u5458")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["value", "onUpdate:value"]),
                            createVNode(_component_a_button, {
                              type: "primary",
                              loading: addMemberLoading.value,
                              onClick: doAddMember
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u6DFB\u52A0\u6210\u5458")
                              ]),
                              _: 1
                            }, 8, ["loading"])
                          ]),
                          _: 1
                        })
                      ])) : createCommentVNode("", true),
                      createVNode(_component_a_table, {
                        columns: memberColumns,
                        "data-source": members.value,
                        loading: loadingProject.value,
                        "row-key": "employeeId",
                        size: "small",
                        pagination: false
                      }, {
                        bodyCell: withCtx(({ column, record }) => [
                          column.key === "role" ? (openBlock(), createBlock(_component_a_tag, {
                            key: 0,
                            color: record.role === "PM" ? "blue" : "default"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(record.role), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"])) : createCommentVNode("", true),
                          column.key === "action" && isCeo.value ? (openBlock(), createBlock(_component_a_popconfirm, {
                            key: 1,
                            title: "\u786E\u8BA4\u79FB\u9664\u8BE5\u6210\u5458\uFF1F",
                            onConfirm: ($event) => doRemoveMember(record.employeeId)
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: ""
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u79FB\u9664")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["onConfirm"])) : createCommentVNode("", true)
                        ]),
                        _: 1
                      }, 8, ["data-source", "loading"])
                    ], 64)) : createCommentVNode("", true),
                    activeTab.value === "milestones" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                      createVNode("div", { style: { "margin-bottom": "12px" } }, [
                        createVNode(_component_a_button, {
                          type: "primary",
                          onClick: ($event) => showMilestoneModal.value = true
                        }, {
                          default: withCtx(() => [
                            createTextVNode("+ \u65B0\u5EFA\u91CC\u7A0B\u7891")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_a_button, {
                          style: { "margin-left": "8px" },
                          onClick: loadMilestones,
                          loading: loadingMilestones.value
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u5237\u65B0")
                          ]),
                          _: 1
                        }, 8, ["loading"])
                      ]),
                      createVNode(_component_a_table, {
                        columns: milestoneColumns,
                        "data-source": milestones.value,
                        loading: loadingMilestones.value,
                        "row-key": "id",
                        size: "small",
                        pagination: false
                      }, {
                        bodyCell: withCtx(({ column, record }) => [
                          column.key === "actualCompletionDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                            record.actualCompletionDate ? (openBlock(), createBlock(_component_a_tag, {
                              key: 0,
                              color: "green"
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" \u5DF2\u5B8C\u6210 " + toDisplayString(record.actualCompletionDate), 1)
                              ]),
                              _: 2
                            }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                              key: 1,
                              color: "orange"
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u8FDB\u884C\u4E2D")
                              ]),
                              _: 1
                            }))
                          ], 64)) : createCommentVNode("", true),
                          column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 1 }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                onClick: ($event) => openEditMilestone(record)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u7F16\u8F91")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              !record.actualCompletionDate ? (openBlock(), createBlock(_component_a_button, {
                                key: 0,
                                type: "link",
                                size: "small",
                                onClick: ($event) => doMarkMilestoneComplete(record)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u6807\u8BB0\u5B8C\u6210")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_popconfirm, {
                                title: "\u786E\u8BA4\u5220\u9664\u8BE5\u91CC\u7A0B\u7891\uFF1F",
                                onConfirm: ($event) => doDeleteMilestone(record.id)
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: ""
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5220\u9664")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }, 8, ["onConfirm"])
                            ]),
                            _: 2
                          }, 1024)) : createCommentVNode("", true)
                        ]),
                        _: 1
                      }, 8, ["data-source", "loading"]),
                      createVNode(_component_a_modal, {
                        open: showMilestoneModal.value,
                        "onUpdate:open": ($event) => showMilestoneModal.value = $event,
                        title: editingMilestone.value ? "\u7F16\u8F91\u91CC\u7A0B\u7891" : "\u65B0\u5EFA\u91CC\u7A0B\u7891",
                        onOk: doSaveMilestone,
                        "confirm-loading": milestoneLoading.value,
                        onCancel: resetMilestoneForm
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form, {
                            model: milestoneForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_form_item, {
                                label: "\u540D\u79F0",
                                required: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_input, {
                                    value: milestoneForm.value.name,
                                    "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_input_number, {
                                    value: milestoneForm.value.sort,
                                    "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                    min: 0,
                                    style: { "width": "100%" }
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, { label: "\u5B9E\u9645\u5B8C\u6210\u65E5\u671F\uFF08\u53EF\u9009\uFF09" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_date_picker, {
                                    value: milestoneForm.value.actualCompletionDate,
                                    "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                    style: { "width": "100%" },
                                    "value-format": "YYYY-MM-DD"
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["model"])
                        ]),
                        _: 1
                      }, 8, ["open", "onUpdate:open", "title", "confirm-loading"])
                    ], 64)) : createCommentVNode("", true),
                    activeTab.value === "progress" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                      createVNode(_component_a_card, {
                        title: "\u8BB0\u5F55\u4ECA\u65E5\u8FDB\u5EA6",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form, {
                            model: progressForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_form_item, { label: "\u5173\u8054\u91CC\u7A0B\u7891\uFF08\u53EF\u9009\uFF09" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_select, {
                                    value: progressForm.value.milestoneId,
                                    "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                    placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                    "allow-clear": "",
                                    style: { "width": "100%" }
                                  }, {
                                    default: withCtx(() => [
                                      (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                        return openBlock(), createBlock(_component_a_select_option, {
                                          key: m.id,
                                          value: m.id
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(m.name), 1)
                                          ]),
                                          _: 2
                                        }, 1032, ["value"]);
                                      }), 128))
                                    ]),
                                    _: 1
                                  }, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, {
                                label: "\u8FDB\u5EA6\u8BF4\u660E",
                                required: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_textarea, {
                                    value: progressForm.value.note,
                                    "onUpdate:value": ($event) => progressForm.value.note = $event,
                                    rows: 3,
                                    placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "primary",
                                    loading: progressLoading.value,
                                    onClick: doRecordProgress
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
                                    ]),
                                    _: 1
                                  }, 8, ["loading"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["model"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_card, { title: "\u8FDB\u5EA6\u5386\u53F2" }, {
                        default: withCtx(() => [
                          createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                            default: withCtx(() => [
                              progressLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                                default: withCtx(() => [
                                  (openBlock(true), createBlock(Fragment, null, renderList(progressLogs.value, (log) => {
                                    return openBlock(), createBlock(_component_a_timeline_item, {
                                      key: log.id,
                                      color: "blue"
                                    }, {
                                      default: withCtx(() => {
                                        var _a2, _b2;
                                        return [
                                          createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014"), 1),
                                          createVNode("div", null, toDisplayString(log.note), 1),
                                          log.milestoneId ? (openBlock(), createBlock("div", {
                                            key: 0,
                                            style: { "color": "#888", "font-size": "12px" }
                                          }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                        ];
                                      }),
                                      _: 2
                                    }, 1024);
                                  }), 128))
                                ]),
                                _: 1
                              })) : (openBlock(), createBlock(_component_a_empty, {
                                key: 1,
                                description: "\u6682\u65E0\u8FDB\u5EA6\u8BB0\u5F55"
                              }))
                            ]),
                            _: 1
                          }, 8, ["spinning"])
                        ]),
                        _: 1
                      })
                    ], 64)) : createCommentVNode("", true),
                    activeTab.value === "dashboard" ? (openBlock(), createBlock(_component_a_spin, {
                      key: 3,
                      spinning: loadingDashboard.value
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_row, {
                          gutter: 16,
                          style: { "margin-bottom": "16px" }
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_col, { span: 8 }, {
                              default: withCtx(() => [
                                createVNode(_component_a_card, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_statistic, {
                                      title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                      value: dashboard.value.workItemSummary.completed,
                                      suffix: `/ ${dashboard.value.workItemSummary.total}`
                                    }, null, 8, ["value", "suffix"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_col, { span: 8 }, {
                              default: withCtx(() => [
                                createVNode(_component_a_card, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_statistic, {
                                      title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                      value: dashboard.value.timeSeriesData.length,
                                      suffix: "\u6761"
                                    }, null, 8, ["value"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_col, { span: 8 }, {
                              default: withCtx(() => [
                                createVNode(_component_a_card, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_statistic, {
                                      title: "\u6C47\u603B\u62A5\u544A",
                                      value: dashboard.value.summaries.length,
                                      suffix: "\u4EFD"
                                    }, null, 8, ["value"])
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_card, {
                          title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u7387",
                          style: { "margin-bottom": "16px" }
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_progress, {
                              percent: milestonesCompletionPct.value,
                              status: "active",
                              "stroke-color": { from: "#108ee9", to: "#87d068" }
                            }, null, 8, ["percent"]),
                            createVNode(_component_a_list, {
                              size: "small",
                              "data-source": dashboard.value.milestones,
                              style: { "margin-top": "12px" }
                            }, {
                              renderItem: withCtx(({ item }) => [
                                createVNode(_component_a_list_item, null, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                      default: withCtx(() => [
                                        createVNode("span", null, toDisplayString(item.name), 1),
                                        createVNode(_component_a_tag, {
                                          color: item.actualCompletionDate ? "green" : "orange"
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                          ]),
                                          _: 2
                                        }, 1032, ["color"])
                                      ]),
                                      _: 2
                                    }, 1024)
                                  ]),
                                  _: 2
                                }, 1024)
                              ]),
                              _: 1
                            }, 8, ["data-source"]),
                            dashboard.value.milestones.length === 0 ? (openBlock(), createBlock(_component_a_empty, {
                              key: 0,
                              description: "\u6682\u65E0\u91CC\u7A0B\u7891"
                            })) : createCommentVNode("", true)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_card, { title: "\u8FDB\u5EA6\u65F6\u95F4\u8F74\uFF08\u6700\u8FD1 10 \u6761\uFF09" }, {
                          default: withCtx(() => [
                            recentLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                              default: withCtx(() => [
                                (openBlock(true), createBlock(Fragment, null, renderList(recentLogs.value, (log, idx) => {
                                  return openBlock(), createBlock(_component_a_timeline_item, {
                                    key: idx,
                                    color: "blue"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                      createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                    ]),
                                    _: 2
                                  }, 1024);
                                }), 128))
                              ]),
                              _: 1
                            })) : (openBlock(), createBlock(_component_a_empty, {
                              key: 1,
                              description: "\u6682\u65E0\u8FDB\u5EA6\u6570\u636E"
                            }))
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["spinning"])) : createCommentVNode("", true),
                    activeTab.value === "summary" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                      createVNode(_component_a_card, {
                        title: "\u751F\u6210\u6C47\u603B\u62A5\u544A",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form, {
                            model: summaryForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_form_item, {
                                label: "\u7EDF\u8BA1\u8D77\u59CB\u65E5\u671F",
                                required: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_date_picker, {
                                    value: summaryForm.value.periodStart,
                                    "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                    style: { "width": "100%" },
                                    "value-format": "YYYY-MM-DD"
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, {
                                label: "\u7EDF\u8BA1\u622A\u6B62\u65E5\u671F",
                                required: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_date_picker, {
                                    value: summaryForm.value.periodEnd,
                                    "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                    style: { "width": "100%" },
                                    "value-format": "YYYY-MM-DD"
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, { label: "PM \u5907\u6CE8" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_textarea, {
                                    value: summaryForm.value.pmNote,
                                    "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                    rows: 3
                                  }, null, 8, ["value", "onUpdate:value"])
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_form_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "primary",
                                    loading: summaryLoading.value,
                                    onClick: doCreateSummary
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
                                    ]),
                                    _: 1
                                  }, 8, ["loading"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["model"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_card, { title: "\u5386\u53F2\u6C47\u603B\u62A5\u544A" }, {
                        default: withCtx(() => [
                          createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                            default: withCtx(() => [
                              createVNode(_component_a_table, {
                                columns: summaryColumns,
                                "data-source": dashboard.value.summaries,
                                "row-key": "id",
                                size: "small",
                                pagination: { pageSize: 5 }
                              }, {
                                bodyCell: withCtx(({ column, record }) => [
                                  column.key === "period" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                    createTextVNode(toDisplayString(record.periodStart) + " ~ " + toDisplayString(record.periodEnd), 1)
                                  ], 64)) : createCommentVNode("", true),
                                  column.key === "notified" ? (openBlock(), createBlock(_component_a_tag, {
                                    key: 1,
                                    color: record.ceoNotifiedAt ? "green" : "orange"
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                    ]),
                                    _: 2
                                  }, 1032, ["color"])) : createCommentVNode("", true)
                                ]),
                                _: 1
                              }, 8, ["data-source"])
                            ]),
                            _: 1
                          }, 8, ["spinning"])
                        ]),
                        _: 1
                      })
                    ], 64)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_card, null, {
                default: withCtx(() => [
                  createVNode(_component_a_tabs, {
                    activeKey: activeTab.value,
                    "onUpdate:activeKey": ($event) => activeTab.value = $event
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_tab_pane, {
                        key: "info",
                        tab: "\u57FA\u672C\u4FE1\u606F"
                      }),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "milestones",
                        tab: "\u91CC\u7A0B\u7891"
                      })) : createCommentVNode("", true),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "progress",
                        tab: "\u8FDB\u5EA6\u8BB0\u5F55"
                      })) : createCommentVNode("", true),
                      createVNode(_component_a_tab_pane, {
                        key: "dashboard",
                        tab: "Dashboard"
                      }),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "summary",
                        tab: "\u6C47\u603B\u62A5\u544A"
                      })) : createCommentVNode("", true)
                    ]),
                    _: 1
                  }, 8, ["activeKey", "onUpdate:activeKey"]),
                  activeTab.value === "info" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createVNode(_component_a_descriptions, {
                      bordered: "",
                      size: "small",
                      column: 2,
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_descriptions_item, { label: "\u9879\u76EE\u540D\u79F0" }, {
                          default: withCtx(() => {
                            var _a2;
                            return [
                              createTextVNode(toDisplayString((_a2 = project.value) == null ? void 0 : _a2.name), 1)
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
                          default: withCtx(() => {
                            var _a2;
                            return [
                              createTextVNode(toDisplayString(((_a2 = project.value) == null ? void 0 : _a2.status) === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                          default: withCtx(() => {
                            var _a2, _b2;
                            return [
                              createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.startDate) != null ? _b2 : "\u2014"), 1)
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "\u5B9E\u9645\u5B8C\u5DE5\u65E5\u671F" }, {
                          default: withCtx(() => {
                            var _a2, _b2;
                            return [
                              createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.actualEndDate) != null ? _b2 : "\u2014"), 1)
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F" }, {
                          default: withCtx(() => {
                            var _a2, _b2;
                            return [
                              createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                            ];
                          }),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "\u6C47\u62A5\u5468\u671F" }, {
                          default: withCtx(() => {
                            var _a2, _b2;
                            return [
                              createTextVNode(toDisplayString((_b2 = (_a2 = project.value) == null ? void 0 : _a2.logReportCycleDays) != null ? _b2 : 1) + " \u5929", 1)
                            ];
                          }),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createVNode(_component_a_divider, null, {
                        default: withCtx(() => [
                          createTextVNode("\u9879\u76EE\u914D\u7F6E")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form, {
                        layout: "inline",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                            default: withCtx(() => [
                              createVNode(_component_a_input_number, {
                                value: configForm.value.logCycleDays,
                                "onUpdate:value": ($event) => configForm.value.logCycleDays = $event,
                                min: 1,
                                max: 30
                              }, null, 8, ["value", "onUpdate:value"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_form_item, { label: "\u6C47\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                            default: withCtx(() => [
                              createVNode(_component_a_input_number, {
                                value: configForm.value.logReportCycleDays,
                                "onUpdate:value": ($event) => configForm.value.logReportCycleDays = $event,
                                min: 1,
                                max: 90
                              }, null, 8, ["value", "onUpdate:value"])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_form_item, null, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "primary",
                                loading: configLoading.value,
                                onClick: doUpdateConfig
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u4FDD\u5B58\u914D\u7F6E")
                                ]),
                                _: 1
                              }, 8, ["loading"])
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      })
                    ], 64)) : createCommentVNode("", true),
                    createVNode(_component_a_divider, null, {
                      default: withCtx(() => [
                        createTextVNode("\u9879\u76EE\u6210\u5458")
                      ]),
                      _: 1
                    }),
                    isCeo.value ? (openBlock(), createBlock("div", {
                      key: 1,
                      style: { "margin-bottom": "12px" }
                    }, [
                      createVNode(_component_a_space, null, {
                        default: withCtx(() => [
                          createVNode(_component_a_input_number, {
                            value: addMemberForm.value.employeeId,
                            "onUpdate:value": ($event) => addMemberForm.value.employeeId = $event,
                            placeholder: "\u5458\u5DE5ID",
                            min: 1,
                            style: { "width": "120px" }
                          }, null, 8, ["value", "onUpdate:value"]),
                          createVNode(_component_a_select, {
                            value: addMemberForm.value.role,
                            "onUpdate:value": ($event) => addMemberForm.value.role = $event,
                            style: { "width": "120px" }
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_select_option, { value: "PM" }, {
                                default: withCtx(() => [
                                  createTextVNode("PM")
                                ]),
                                _: 1
                              }),
                              createVNode(_component_a_select_option, { value: "MEMBER" }, {
                                default: withCtx(() => [
                                  createTextVNode("\u6210\u5458")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["value", "onUpdate:value"]),
                          createVNode(_component_a_button, {
                            type: "primary",
                            loading: addMemberLoading.value,
                            onClick: doAddMember
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u6DFB\u52A0\u6210\u5458")
                            ]),
                            _: 1
                          }, 8, ["loading"])
                        ]),
                        _: 1
                      })
                    ])) : createCommentVNode("", true),
                    createVNode(_component_a_table, {
                      columns: memberColumns,
                      "data-source": members.value,
                      loading: loadingProject.value,
                      "row-key": "employeeId",
                      size: "small",
                      pagination: false
                    }, {
                      bodyCell: withCtx(({ column, record }) => [
                        column.key === "role" ? (openBlock(), createBlock(_component_a_tag, {
                          key: 0,
                          color: record.role === "PM" ? "blue" : "default"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(record.role), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])) : createCommentVNode("", true),
                        column.key === "action" && isCeo.value ? (openBlock(), createBlock(_component_a_popconfirm, {
                          key: 1,
                          title: "\u786E\u8BA4\u79FB\u9664\u8BE5\u6210\u5458\uFF1F",
                          onConfirm: ($event) => doRemoveMember(record.employeeId)
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small",
                              danger: ""
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u79FB\u9664")
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }, 8, ["onConfirm"])) : createCommentVNode("", true)
                      ]),
                      _: 1
                    }, 8, ["data-source", "loading"])
                  ], 64)) : createCommentVNode("", true),
                  activeTab.value === "milestones" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                    createVNode("div", { style: { "margin-bottom": "12px" } }, [
                      createVNode(_component_a_button, {
                        type: "primary",
                        onClick: ($event) => showMilestoneModal.value = true
                      }, {
                        default: withCtx(() => [
                          createTextVNode("+ \u65B0\u5EFA\u91CC\u7A0B\u7891")
                        ]),
                        _: 1
                      }, 8, ["onClick"]),
                      createVNode(_component_a_button, {
                        style: { "margin-left": "8px" },
                        onClick: loadMilestones,
                        loading: loadingMilestones.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u5237\u65B0")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ]),
                    createVNode(_component_a_table, {
                      columns: milestoneColumns,
                      "data-source": milestones.value,
                      loading: loadingMilestones.value,
                      "row-key": "id",
                      size: "small",
                      pagination: false
                    }, {
                      bodyCell: withCtx(({ column, record }) => [
                        column.key === "actualCompletionDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          record.actualCompletionDate ? (openBlock(), createBlock(_component_a_tag, {
                            key: 0,
                            color: "green"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u5DF2\u5B8C\u6210 " + toDisplayString(record.actualCompletionDate), 1)
                            ]),
                            _: 2
                          }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                            key: 1,
                            color: "orange"
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u8FDB\u884C\u4E2D")
                            ]),
                            _: 1
                          }))
                        ], 64)) : createCommentVNode("", true),
                        column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 1 }, {
                          default: withCtx(() => [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small",
                              onClick: ($event) => openEditMilestone(record)
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u7F16\u8F91")
                              ]),
                              _: 1
                            }, 8, ["onClick"]),
                            !record.actualCompletionDate ? (openBlock(), createBlock(_component_a_button, {
                              key: 0,
                              type: "link",
                              size: "small",
                              onClick: ($event) => doMarkMilestoneComplete(record)
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u6807\u8BB0\u5B8C\u6210")
                              ]),
                              _: 1
                            }, 8, ["onClick"])) : createCommentVNode("", true),
                            createVNode(_component_a_popconfirm, {
                              title: "\u786E\u8BA4\u5220\u9664\u8BE5\u91CC\u7A0B\u7891\uFF1F",
                              onConfirm: ($event) => doDeleteMilestone(record.id)
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  danger: ""
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u5220\u9664")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            }, 8, ["onConfirm"])
                          ]),
                          _: 2
                        }, 1024)) : createCommentVNode("", true)
                      ]),
                      _: 1
                    }, 8, ["data-source", "loading"]),
                    createVNode(_component_a_modal, {
                      open: showMilestoneModal.value,
                      "onUpdate:open": ($event) => showMilestoneModal.value = $event,
                      title: editingMilestone.value ? "\u7F16\u8F91\u91CC\u7A0B\u7891" : "\u65B0\u5EFA\u91CC\u7A0B\u7891",
                      onOk: doSaveMilestone,
                      "confirm-loading": milestoneLoading.value,
                      onCancel: resetMilestoneForm
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_form, {
                          model: milestoneForm.value,
                          layout: "vertical"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, {
                              label: "\u540D\u79F0",
                              required: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_input, {
                                  value: milestoneForm.value.name,
                                  "onUpdate:value": ($event) => milestoneForm.value.name = $event
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_input_number, {
                                  value: milestoneForm.value.sort,
                                  "onUpdate:value": ($event) => milestoneForm.value.sort = $event,
                                  min: 0,
                                  style: { "width": "100%" }
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, { label: "\u5B9E\u9645\u5B8C\u6210\u65E5\u671F\uFF08\u53EF\u9009\uFF09" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_date_picker, {
                                  value: milestoneForm.value.actualCompletionDate,
                                  "onUpdate:value": ($event) => milestoneForm.value.actualCompletionDate = $event,
                                  style: { "width": "100%" },
                                  "value-format": "YYYY-MM-DD"
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }, 8, ["model"])
                      ]),
                      _: 1
                    }, 8, ["open", "onUpdate:open", "title", "confirm-loading"])
                  ], 64)) : createCommentVNode("", true),
                  activeTab.value === "progress" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                    createVNode(_component_a_card, {
                      title: "\u8BB0\u5F55\u4ECA\u65E5\u8FDB\u5EA6",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_form, {
                          model: progressForm.value,
                          layout: "vertical"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, { label: "\u5173\u8054\u91CC\u7A0B\u7891\uFF08\u53EF\u9009\uFF09" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select, {
                                  value: progressForm.value.milestoneId,
                                  "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                  placeholder: "\u9009\u62E9\u91CC\u7A0B\u7891",
                                  "allow-clear": "",
                                  style: { "width": "100%" }
                                }, {
                                  default: withCtx(() => [
                                    (openBlock(true), createBlock(Fragment, null, renderList(milestones.value, (m) => {
                                      return openBlock(), createBlock(_component_a_select_option, {
                                        key: m.id,
                                        value: m.id
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(m.name), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["value"]);
                                    }), 128))
                                  ]),
                                  _: 1
                                }, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, {
                              label: "\u8FDB\u5EA6\u8BF4\u660E",
                              required: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_textarea, {
                                  value: progressForm.value.note,
                                  "onUpdate:value": ($event) => progressForm.value.note = $event,
                                  rows: 3,
                                  placeholder: "\u63CF\u8FF0\u4ECA\u65E5\u5B8C\u6210\u5185\u5BB9\u2026"
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, null, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "primary",
                                  loading: progressLoading.value,
                                  onClick: doRecordProgress
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u63D0\u4EA4\u8FDB\u5EA6")
                                  ]),
                                  _: 1
                                }, 8, ["loading"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }, 8, ["model"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_card, { title: "\u8FDB\u5EA6\u5386\u53F2" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                          default: withCtx(() => [
                            progressLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                              default: withCtx(() => [
                                (openBlock(true), createBlock(Fragment, null, renderList(progressLogs.value, (log) => {
                                  return openBlock(), createBlock(_component_a_timeline_item, {
                                    key: log.id,
                                    color: "blue"
                                  }, {
                                    default: withCtx(() => {
                                      var _a2, _b2;
                                      return [
                                        createVNode("div", { style: { "font-weight": "500" } }, toDisplayString((_b2 = (_a2 = log.createdAt) == null ? void 0 : _a2.slice(0, 10)) != null ? _b2 : "\u2014"), 1),
                                        createVNode("div", null, toDisplayString(log.note), 1),
                                        log.milestoneId ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          style: { "color": "#888", "font-size": "12px" }
                                        }, " \u91CC\u7A0B\u7891 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                      ];
                                    }),
                                    _: 2
                                  }, 1024);
                                }), 128))
                              ]),
                              _: 1
                            })) : (openBlock(), createBlock(_component_a_empty, {
                              key: 1,
                              description: "\u6682\u65E0\u8FDB\u5EA6\u8BB0\u5F55"
                            }))
                          ]),
                          _: 1
                        }, 8, ["spinning"])
                      ]),
                      _: 1
                    })
                  ], 64)) : createCommentVNode("", true),
                  activeTab.value === "dashboard" ? (openBlock(), createBlock(_component_a_spin, {
                    key: 3,
                    spinning: loadingDashboard.value
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_row, {
                        gutter: 16,
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_col, { span: 8 }, {
                            default: withCtx(() => [
                              createVNode(_component_a_card, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_statistic, {
                                    title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u6570",
                                    value: dashboard.value.workItemSummary.completed,
                                    suffix: `/ ${dashboard.value.workItemSummary.total}`
                                  }, null, 8, ["value", "suffix"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_col, { span: 8 }, {
                            default: withCtx(() => [
                              createVNode(_component_a_card, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_statistic, {
                                    title: "\u8FDB\u5EA6\u8BB0\u5F55\u603B\u6570",
                                    value: dashboard.value.timeSeriesData.length,
                                    suffix: "\u6761"
                                  }, null, 8, ["value"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_col, { span: 8 }, {
                            default: withCtx(() => [
                              createVNode(_component_a_card, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_statistic, {
                                    title: "\u6C47\u603B\u62A5\u544A",
                                    value: dashboard.value.summaries.length,
                                    suffix: "\u4EFD"
                                  }, null, 8, ["value"])
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_card, {
                        title: "\u91CC\u7A0B\u7891\u5B8C\u6210\u7387",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_progress, {
                            percent: milestonesCompletionPct.value,
                            status: "active",
                            "stroke-color": { from: "#108ee9", to: "#87d068" }
                          }, null, 8, ["percent"]),
                          createVNode(_component_a_list, {
                            size: "small",
                            "data-source": dashboard.value.milestones,
                            style: { "margin-top": "12px" }
                          }, {
                            renderItem: withCtx(({ item }) => [
                              createVNode(_component_a_list_item, null, {
                                default: withCtx(() => [
                                  createVNode(_component_a_space, { style: { "width": "100%", "justify-content": "space-between" } }, {
                                    default: withCtx(() => [
                                      createVNode("span", null, toDisplayString(item.name), 1),
                                      createVNode(_component_a_tag, {
                                        color: item.actualCompletionDate ? "green" : "orange"
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(item.actualCompletionDate ? `\u5B8C\u6210\u4E8E ${item.actualCompletionDate}` : "\u8FDB\u884C\u4E2D"), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["color"])
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 1
                          }, 8, ["data-source"]),
                          dashboard.value.milestones.length === 0 ? (openBlock(), createBlock(_component_a_empty, {
                            key: 0,
                            description: "\u6682\u65E0\u91CC\u7A0B\u7891"
                          })) : createCommentVNode("", true)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_card, { title: "\u8FDB\u5EA6\u65F6\u95F4\u8F74\uFF08\u6700\u8FD1 10 \u6761\uFF09" }, {
                        default: withCtx(() => [
                          recentLogs.value.length > 0 ? (openBlock(), createBlock(_component_a_timeline, { key: 0 }, {
                            default: withCtx(() => [
                              (openBlock(true), createBlock(Fragment, null, renderList(recentLogs.value, (log, idx) => {
                                return openBlock(), createBlock(_component_a_timeline_item, {
                                  key: idx,
                                  color: "blue"
                                }, {
                                  default: withCtx(() => [
                                    createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(log.date), 1),
                                    createVNode("span", { style: { "margin-left": "8px", "color": "#555" } }, toDisplayString(log.note), 1)
                                  ]),
                                  _: 2
                                }, 1024);
                              }), 128))
                            ]),
                            _: 1
                          })) : (openBlock(), createBlock(_component_a_empty, {
                            key: 1,
                            description: "\u6682\u65E0\u8FDB\u5EA6\u6570\u636E"
                          }))
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["spinning"])) : createCommentVNode("", true),
                  activeTab.value === "summary" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                    createVNode(_component_a_card, {
                      title: "\u751F\u6210\u6C47\u603B\u62A5\u544A",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_form, {
                          model: summaryForm.value,
                          layout: "vertical"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, {
                              label: "\u7EDF\u8BA1\u8D77\u59CB\u65E5\u671F",
                              required: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_date_picker, {
                                  value: summaryForm.value.periodStart,
                                  "onUpdate:value": ($event) => summaryForm.value.periodStart = $event,
                                  style: { "width": "100%" },
                                  "value-format": "YYYY-MM-DD"
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, {
                              label: "\u7EDF\u8BA1\u622A\u6B62\u65E5\u671F",
                              required: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_date_picker, {
                                  value: summaryForm.value.periodEnd,
                                  "onUpdate:value": ($event) => summaryForm.value.periodEnd = $event,
                                  style: { "width": "100%" },
                                  "value-format": "YYYY-MM-DD"
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, { label: "PM \u5907\u6CE8" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_textarea, {
                                  value: summaryForm.value.pmNote,
                                  "onUpdate:value": ($event) => summaryForm.value.pmNote = $event,
                                  rows: 3
                                }, null, 8, ["value", "onUpdate:value"])
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_form_item, null, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "primary",
                                  loading: summaryLoading.value,
                                  onClick: doCreateSummary
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("\u751F\u6210\u5E76\u901A\u77E5 CEO")
                                  ]),
                                  _: 1
                                }, 8, ["loading"])
                              ]),
                              _: 1
                            })
                          ]),
                          _: 1
                        }, 8, ["model"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_card, { title: "\u5386\u53F2\u6C47\u603B\u62A5\u544A" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_spin, { spinning: loadingDashboard.value }, {
                          default: withCtx(() => [
                            createVNode(_component_a_table, {
                              columns: summaryColumns,
                              "data-source": dashboard.value.summaries,
                              "row-key": "id",
                              size: "small",
                              pagination: { pageSize: 5 }
                            }, {
                              bodyCell: withCtx(({ column, record }) => [
                                column.key === "period" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                  createTextVNode(toDisplayString(record.periodStart) + " ~ " + toDisplayString(record.periodEnd), 1)
                                ], 64)) : createCommentVNode("", true),
                                column.key === "notified" ? (openBlock(), createBlock(_component_a_tag, {
                                  key: 1,
                                  color: record.ceoNotifiedAt ? "green" : "orange"
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(record.ceoNotifiedAt ? "\u5DF2\u901A\u77E5" : "\u672A\u901A\u77E5"), 1)
                                  ]),
                                  _: 2
                                }, 1032, ["color"])) : createCommentVNode("", true)
                              ]),
                              _: 1
                            }, 8, ["data-source"])
                          ]),
                          _: 1
                        }, 8, ["spinning"])
                      ]),
                      _: 1
                    })
                  ], 64)) : createCommentVNode("", true)
                ]),
                _: 1
              })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-BES7Dq24.mjs.map
