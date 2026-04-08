import { n as navigateTo } from "../server.mjs";
import { defineComponent, computed, ref, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from "vue";
import { Button, Tag, Spin, Card, Tabs, TabPane, Descriptions, DescriptionsItem, Divider, Form, FormItem, InputNumber, Space, Select, SelectOption, Table, Popconfirm, Modal, Input, DatePicker, Textarea, Timeline, TimelineItem, Empty, Row, Col, Statistic, Progress, List, ListItem } from "ant-design-vue/es/index.js";
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
import { useRoute } from "vue-router";
import { r as request } from "./http-Dv09dGXg.js";
import { u as useUserStore } from "./user-CsP34Oqk.js";
import { message } from "ant-design-vue";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/hookable/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/unctx/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/h3/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/defu/dist/defu.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ufo/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/cookie-es/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/destr/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ohash/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/klona/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const projectId = computed(() => Number(route.params.id));
    const userStore = useUserStore();
    const role = computed(() => userStore.userInfo?.role ?? "");
    const isCeo = computed(() => role.value === "ceo");
    const isPmOrCeo = computed(() => ["project_manager", "ceo"].includes(role.value));
    const activeTab = ref("info");
    const loadingProject = ref(false);
    const project = ref(null);
    const members = ref([]);
    async function loadProject() {
      loadingProject.value = true;
      try {
        const res = await request({ url: `/projects/${projectId.value}`, method: "GET" });
        project.value = res;
        members.value = res.members ?? [];
        configForm.value.logCycleDays = res.logCycleDays ?? 1;
        configForm.value.logReportCycleDays = res.logReportCycleDays ?? 1;
      } catch {
        message.error("加载项目详情失败");
      } finally {
        loadingProject.value = false;
      }
    }
    const memberColumns = [
      { title: "员工ID", dataIndex: "employeeId", key: "employeeId", width: 80 },
      { title: "工号", dataIndex: "employeeNo", key: "employeeNo", width: 100 },
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "角色", dataIndex: "role", key: "role", width: 80 },
      ...isCeo.value ? [{ title: "操作", key: "action", width: 80 }] : []
    ];
    const addMemberForm = ref({ employeeId: null, role: "MEMBER" });
    const addMemberLoading = ref(false);
    async function doAddMember() {
      if (!addMemberForm.value.employeeId) {
        message.warning("请输入员工ID");
        return;
      }
      addMemberLoading.value = true;
      try {
        await request({
          url: `/projects/${projectId.value}/members`,
          method: "POST",
          body: { employeeId: addMemberForm.value.employeeId, role: addMemberForm.value.role }
        });
        message.success("成员已添加");
        addMemberForm.value = { employeeId: null, role: "MEMBER" };
        await loadProject();
      } catch {
        message.error("添加失败");
      } finally {
        addMemberLoading.value = false;
      }
    }
    async function doRemoveMember(employeeId) {
      try {
        await request({ url: `/projects/${projectId.value}/members/${employeeId}`, method: "DELETE" });
        message.success("已移除");
        await loadProject();
      } catch {
        message.error("移除失败");
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
        message.success("配置已更新");
        await loadProject();
      } catch {
        message.error("更新失败");
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
      { title: "排序", dataIndex: "sort", key: "sort", width: 60 },
      { title: "里程碑名称", dataIndex: "name", key: "name" },
      { title: "状态", key: "actualCompletionDate", width: 180 },
      { title: "操作", key: "action", width: 180 }
    ];
    async function loadMilestones() {
      loadingMilestones.value = true;
      try {
        const res = await request({ url: `/projects/${projectId.value}/milestones`, method: "GET" });
        milestones.value = res;
      } catch {
        message.error("加载里程碑失败");
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
      if (!milestoneForm.value.name.trim()) {
        message.warning("名称不能为空");
        return;
      }
      milestoneLoading.value = true;
      try {
        const body = {
          name: milestoneForm.value.name,
          sort: milestoneForm.value.sort,
          actualCompletionDate: milestoneForm.value.actualCompletionDate ?? null
        };
        if (editingMilestone.value) {
          await request({ url: `/projects/${projectId.value}/milestones/${editingMilestone.value.id}`, method: "PUT", body });
          message.success("已更新");
        } else {
          await request({ url: `/projects/${projectId.value}/milestones`, method: "POST", body });
          message.success("里程碑已创建");
        }
        showMilestoneModal.value = false;
        resetMilestoneForm();
        await loadMilestones();
      } catch {
        message.error("保存失败");
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
        message.success("已标记完成");
        await loadMilestones();
      } catch {
        message.error("操作失败");
      }
    }
    async function doDeleteMilestone(id) {
      try {
        await request({ url: `/projects/${projectId.value}/milestones/${id}`, method: "DELETE" });
        message.success("已删除");
        await loadMilestones();
      } catch {
        message.error("删除失败");
      }
    }
    const progressLogs = ref([]);
    const progressForm = ref({ milestoneId: null, note: "" });
    const progressLoading = ref(false);
    async function doRecordProgress() {
      if (!progressForm.value.note.trim()) {
        message.warning("进度说明不能为空");
        return;
      }
      progressLoading.value = true;
      try {
        const body = { note: progressForm.value.note };
        if (progressForm.value.milestoneId) body.milestoneId = progressForm.value.milestoneId;
        await request({ url: `/projects/${projectId.value}/progress`, method: "POST", body });
        message.success("进度已记录");
        progressForm.value = { milestoneId: null, note: "" };
        await loadDashboard();
      } catch {
        message.error("记录失败");
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
        message.error("加载 Dashboard 失败");
      } finally {
        loadingDashboard.value = false;
      }
    }
    const summaryForm = ref({ periodStart: null, periodEnd: null, pmNote: "" });
    const summaryLoading = ref(false);
    const summaryColumns = [
      { title: "ID", dataIndex: "id", key: "id", width: 60 },
      { title: "统计区间", key: "period", width: 200 },
      { title: "CEO 通知", key: "notified", width: 100 },
      { title: "PM 备注", dataIndex: "pmNote", key: "pmNote" },
      { title: "生成时间", dataIndex: "createdAt", key: "createdAt", width: 180 }
    ];
    async function doCreateSummary() {
      if (!summaryForm.value.periodStart || !summaryForm.value.periodEnd) {
        message.warning("请选择统计区间");
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
        message.success("汇总报告已生成，CEO 已收到通知");
        summaryForm.value = { periodStart: null, periodEnd: null, pmNote: "" };
        await loadDashboard();
      } catch {
        message.error("生成失败");
      } finally {
        summaryLoading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
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
            _push2(`← 返回列表`);
          } else {
            return [
              createTextVNode("← 返回列表")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}">${ssrInterpolate(project.value?.name ?? "加载中…")} `);
      if (project.value) {
        _push(ssrRenderComponent(_component_a_tag, {
          color: project.value.status === "ACTIVE" ? "green" : "default",
          style: { "margin-left": "8px", "vertical-align": "middle" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(project.value.status === "ACTIVE" ? "进行中" : "已关闭")}`);
            } else {
              return [
                createTextVNode(toDisplayString(project.value.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
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
                          tab: "基本信息"
                        }, null, _parent4, _scopeId3));
                        if (isPmOrCeo.value) {
                          _push4(ssrRenderComponent(_component_a_tab_pane, {
                            key: "milestones",
                            tab: "里程碑"
                          }, null, _parent4, _scopeId3));
                        } else {
                          _push4(`<!---->`);
                        }
                        if (isPmOrCeo.value) {
                          _push4(ssrRenderComponent(_component_a_tab_pane, {
                            key: "progress",
                            tab: "进度记录"
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
                            tab: "汇总报告"
                          }, null, _parent4, _scopeId3));
                        } else {
                          _push4(`<!---->`);
                        }
                      } else {
                        return [
                          createVNode(_component_a_tab_pane, {
                            key: "info",
                            tab: "基本信息"
                          }),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "milestones",
                            tab: "里程碑"
                          })) : createCommentVNode("", true),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "progress",
                            tab: "进度记录"
                          })) : createCommentVNode("", true),
                          createVNode(_component_a_tab_pane, {
                            key: "dashboard",
                            tab: "Dashboard"
                          }),
                          isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                            key: "summary",
                            tab: "汇总报告"
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
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "项目名称" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.name)}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.name), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "状态" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.status === "ACTIVE" ? "进行中" : "已关闭")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "开始日期" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.startDate ?? "—")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.startDate ?? "—"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "实际完工日期" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.actualEndDate ?? "—")}`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.actualEndDate ?? "—"), 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "日志申报周期" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.logCycleDays ?? 1)} 天`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.logCycleDays ?? 1) + " 天", 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_descriptions_item, { label: "汇报周期" }, {
                            default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(project.value?.logReportCycleDays ?? 1)} 天`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(project.value?.logReportCycleDays ?? 1) + " 天", 1)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_descriptions_item, { label: "项目名称" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.name), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "状态" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "开始日期" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.startDate ?? "—"), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "实际完工日期" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.actualEndDate ?? "—"), 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "日志申报周期" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.logCycleDays ?? 1) + " 天", 1)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_descriptions_item, { label: "汇报周期" }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(project.value?.logReportCycleDays ?? 1) + " 天", 1)
                              ]),
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
                            _push4(`项目配置`);
                          } else {
                            return [
                              createTextVNode("项目配置")
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
                            _push4(ssrRenderComponent(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                            _push4(ssrRenderComponent(_component_a_form_item, { label: "汇报周期（天）" }, {
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
                                        _push6(`保存配置`);
                                      } else {
                                        return [
                                          createTextVNode("保存配置")
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
                                        createTextVNode("保存配置")
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
                              createVNode(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                              createVNode(_component_a_form_item, { label: "汇报周期（天）" }, {
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
                                      createTextVNode("保存配置")
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
                          _push4(`项目成员`);
                        } else {
                          return [
                            createTextVNode("项目成员")
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
                              placeholder: "员工ID",
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
                                        _push6(`成员`);
                                      } else {
                                        return [
                                          createTextVNode("成员")
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
                                        createTextVNode("成员")
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
                                  _push5(`添加成员`);
                                } else {
                                  return [
                                    createTextVNode("添加成员")
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
                                placeholder: "员工ID",
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
                                      createTextVNode("成员")
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
                                  createTextVNode("添加成员")
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
                              title: "确认移除该成员？",
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
                                        _push6(`移除`);
                                      } else {
                                        return [
                                          createTextVNode("移除")
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
                                        createTextVNode("移除")
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
                              title: "确认移除该成员？",
                              onConfirm: ($event) => doRemoveMember(record.employeeId)
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  danger: ""
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("移除")
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
                          _push4(`+ 新建里程碑`);
                        } else {
                          return [
                            createTextVNode("+ 新建里程碑")
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
                          _push4(`刷新`);
                        } else {
                          return [
                            createTextVNode("刷新")
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
                                    _push5(` 已完成 ${ssrInterpolate(record.actualCompletionDate)}`);
                                  } else {
                                    return [
                                      createTextVNode(" 已完成 " + toDisplayString(record.actualCompletionDate), 1)
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(ssrRenderComponent(_component_a_tag, { color: "orange" }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`进行中`);
                                  } else {
                                    return [
                                      createTextVNode("进行中")
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
                                        _push6(`编辑`);
                                      } else {
                                        return [
                                          createTextVNode("编辑")
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
                                          _push6(`标记完成`);
                                        } else {
                                          return [
                                            createTextVNode("标记完成")
                                          ];
                                        }
                                      }),
                                      _: 2
                                    }, _parent5, _scopeId4));
                                  } else {
                                    _push5(`<!---->`);
                                  }
                                  _push5(ssrRenderComponent(_component_a_popconfirm, {
                                    title: "确认删除该里程碑？",
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
                                              _push7(`删除`);
                                            } else {
                                              return [
                                                createTextVNode("删除")
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
                                              createTextVNode("删除")
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
                                        createTextVNode("编辑")
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
                                        createTextVNode("标记完成")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])) : createCommentVNode("", true),
                                    createVNode(_component_a_popconfirm, {
                                      title: "确认删除该里程碑？",
                                      onConfirm: ($event) => doDeleteMilestone(record.id)
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_button, {
                                          type: "link",
                                          size: "small",
                                          danger: ""
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode("删除")
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
                                  createTextVNode(" 已完成 " + toDisplayString(record.actualCompletionDate), 1)
                                ]),
                                _: 2
                              }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                                key: 1,
                                color: "orange"
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("进行中")
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
                                    createTextVNode("编辑")
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
                                    createTextVNode("标记完成")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])) : createCommentVNode("", true),
                                createVNode(_component_a_popconfirm, {
                                  title: "确认删除该里程碑？",
                                  onConfirm: ($event) => doDeleteMilestone(record.id)
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      danger: ""
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("删除")
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
                      title: editingMilestone.value ? "编辑里程碑" : "新建里程碑",
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
                                  label: "名称",
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
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "排序" }, {
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
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "实际完成日期（可选）" }, {
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
                                    label: "名称",
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
                                  createVNode(_component_a_form_item, { label: "排序" }, {
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
                                  createVNode(_component_a_form_item, { label: "实际完成日期（可选）" }, {
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
                                  label: "名称",
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
                                createVNode(_component_a_form_item, { label: "排序" }, {
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
                                createVNode(_component_a_form_item, { label: "实际完成日期（可选）" }, {
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
                      title: "记录今日进度",
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
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "关联里程碑（可选）" }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_select, {
                                        value: progressForm.value.milestoneId,
                                        "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                        placeholder: "选择里程碑",
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
                                          placeholder: "选择里程碑",
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
                                  label: "进度说明",
                                  required: ""
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(ssrRenderComponent(_component_a_textarea, {
                                        value: progressForm.value.note,
                                        "onUpdate:value": ($event) => progressForm.value.note = $event,
                                        rows: 3,
                                        placeholder: "描述今日完成内容…"
                                      }, null, _parent6, _scopeId5));
                                    } else {
                                      return [
                                        createVNode(_component_a_textarea, {
                                          value: progressForm.value.note,
                                          "onUpdate:value": ($event) => progressForm.value.note = $event,
                                          rows: 3,
                                          placeholder: "描述今日完成内容…"
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
                                            _push7(`提交进度`);
                                          } else {
                                            return [
                                              createTextVNode("提交进度")
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
                                            createTextVNode("提交进度")
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
                                  createVNode(_component_a_form_item, { label: "关联里程碑（可选）" }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_select, {
                                        value: progressForm.value.milestoneId,
                                        "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                        placeholder: "选择里程碑",
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
                                    label: "进度说明",
                                    required: ""
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_textarea, {
                                        value: progressForm.value.note,
                                        "onUpdate:value": ($event) => progressForm.value.note = $event,
                                        rows: 3,
                                        placeholder: "描述今日完成内容…"
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
                                          createTextVNode("提交进度")
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
                                createVNode(_component_a_form_item, { label: "关联里程碑（可选）" }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_select, {
                                      value: progressForm.value.milestoneId,
                                      "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                      placeholder: "选择里程碑",
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
                                  label: "进度说明",
                                  required: ""
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_textarea, {
                                      value: progressForm.value.note,
                                      "onUpdate:value": ($event) => progressForm.value.note = $event,
                                      rows: 3,
                                      placeholder: "描述今日完成内容…"
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
                                        createTextVNode("提交进度")
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
                    _push3(ssrRenderComponent(_component_a_card, { title: "进度历史" }, {
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
                                              if (_push7) {
                                                _push7(`<div style="${ssrRenderStyle({ "font-weight": "500" })}"${_scopeId6}>${ssrInterpolate(log.createdAt?.slice(0, 10) ?? "—")}</div><div${_scopeId6}>${ssrInterpolate(log.note)}</div>`);
                                                if (log.milestoneId) {
                                                  _push7(`<div style="${ssrRenderStyle({ "color": "#888", "font-size": "12px" })}"${_scopeId6}> 里程碑 #${ssrInterpolate(log.milestoneId)}</div>`);
                                                } else {
                                                  _push7(`<!---->`);
                                                }
                                              } else {
                                                return [
                                                  createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                                  createVNode("div", null, toDisplayString(log.note), 1),
                                                  log.milestoneId ? (openBlock(), createBlock("div", {
                                                    key: 0,
                                                    style: { "color": "#888", "font-size": "12px" }
                                                  }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
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
                                              default: withCtx(() => [
                                                createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                                createVNode("div", null, toDisplayString(log.note), 1),
                                                log.milestoneId ? (openBlock(), createBlock("div", {
                                                  key: 0,
                                                  style: { "color": "#888", "font-size": "12px" }
                                                }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
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
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "暂无进度记录" }, null, _parent5, _scopeId4));
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
                                          default: withCtx(() => [
                                            createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                            createVNode("div", null, toDisplayString(log.note), 1),
                                            log.milestoneId ? (openBlock(), createBlock("div", {
                                              key: 0,
                                              style: { "color": "#888", "font-size": "12px" }
                                            }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                          ]),
                                          _: 2
                                        }, 1024);
                                      }), 128))
                                    ]),
                                    _: 1
                                  })) : (openBlock(), createBlock(_component_a_empty, {
                                    key: 1,
                                    description: "暂无进度记录"
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
                                        default: withCtx(() => [
                                          createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                          createVNode("div", null, toDisplayString(log.note), 1),
                                          log.milestoneId ? (openBlock(), createBlock("div", {
                                            key: 0,
                                            style: { "color": "#888", "font-size": "12px" }
                                          }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                        ]),
                                        _: 2
                                      }, 1024);
                                    }), 128))
                                  ]),
                                  _: 1
                                })) : (openBlock(), createBlock(_component_a_empty, {
                                  key: 1,
                                  description: "暂无进度记录"
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
                                              title: "里程碑完成数",
                                              value: dashboard.value.workItemSummary.completed,
                                              suffix: `/ ${dashboard.value.workItemSummary.total}`
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "里程碑完成数",
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
                                              title: "里程碑完成数",
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
                                              title: "进度记录总数",
                                              value: dashboard.value.timeSeriesData.length,
                                              suffix: "条"
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "进度记录总数",
                                                value: dashboard.value.timeSeriesData.length,
                                                suffix: "条"
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
                                              title: "进度记录总数",
                                              value: dashboard.value.timeSeriesData.length,
                                              suffix: "条"
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
                                              title: "汇总报告",
                                              value: dashboard.value.summaries.length,
                                              suffix: "份"
                                            }, null, _parent7, _scopeId6));
                                          } else {
                                            return [
                                              createVNode(_component_a_statistic, {
                                                title: "汇总报告",
                                                value: dashboard.value.summaries.length,
                                                suffix: "份"
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
                                              title: "汇总报告",
                                              value: dashboard.value.summaries.length,
                                              suffix: "份"
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
                                            title: "里程碑完成数",
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
                                            title: "进度记录总数",
                                            value: dashboard.value.timeSeriesData.length,
                                            suffix: "条"
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
                                            title: "汇总报告",
                                            value: dashboard.value.summaries.length,
                                            suffix: "份"
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
                            title: "里程碑完成率",
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
                                                        _push9(`${ssrInterpolate(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中")}`);
                                                      } else {
                                                        return [
                                                          createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                                        createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                                      createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                                    createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "暂无里程碑" }, null, _parent5, _scopeId4));
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
                                                  createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                    description: "暂无里程碑"
                                  })) : createCommentVNode("", true)
                                ];
                              }
                            }),
                            _: 1
                          }, _parent4, _scopeId3));
                          _push4(ssrRenderComponent(_component_a_card, { title: "进度时间轴（最近 10 条）" }, {
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
                                  _push5(ssrRenderComponent(_component_a_empty, { description: "暂无进度数据" }, null, _parent5, _scopeId4));
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
                                    description: "暂无进度数据"
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
                                          title: "里程碑完成数",
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
                                          title: "进度记录总数",
                                          value: dashboard.value.timeSeriesData.length,
                                          suffix: "条"
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
                                          title: "汇总报告",
                                          value: dashboard.value.summaries.length,
                                          suffix: "份"
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
                              title: "里程碑完成率",
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
                                                createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                                  description: "暂无里程碑"
                                })) : createCommentVNode("", true)
                              ]),
                              _: 1
                            }),
                            createVNode(_component_a_card, { title: "进度时间轴（最近 10 条）" }, {
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
                                  description: "暂无进度数据"
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
                      title: "生成汇总报告",
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
                                  label: "统计起始日期",
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
                                  label: "统计截止日期",
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
                                _push5(ssrRenderComponent(_component_a_form_item, { label: "PM 备注" }, {
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
                                            _push7(`生成并通知 CEO`);
                                          } else {
                                            return [
                                              createTextVNode("生成并通知 CEO")
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
                                            createTextVNode("生成并通知 CEO")
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
                                    label: "统计起始日期",
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
                                    label: "统计截止日期",
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
                                  createVNode(_component_a_form_item, { label: "PM 备注" }, {
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
                                          createTextVNode("生成并通知 CEO")
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
                                  label: "统计起始日期",
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
                                  label: "统计截止日期",
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
                                createVNode(_component_a_form_item, { label: "PM 备注" }, {
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
                                        createTextVNode("生成并通知 CEO")
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
                    _push3(ssrRenderComponent(_component_a_card, { title: "历史汇总报告" }, {
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
                                              _push7(`${ssrInterpolate(record.ceoNotifiedAt ? "已通知" : "未通知")}`);
                                            } else {
                                              return [
                                                createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
                                            createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
                                          createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
                                        createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
                          tab: "基本信息"
                        }),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "milestones",
                          tab: "里程碑"
                        })) : createCommentVNode("", true),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "progress",
                          tab: "进度记录"
                        })) : createCommentVNode("", true),
                        createVNode(_component_a_tab_pane, {
                          key: "dashboard",
                          tab: "Dashboard"
                        }),
                        isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                          key: "summary",
                          tab: "汇总报告"
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
                          createVNode(_component_a_descriptions_item, { label: "项目名称" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.name), 1)
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "状态" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "开始日期" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.startDate ?? "—"), 1)
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "实际完工日期" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.actualEndDate ?? "—"), 1)
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "日志申报周期" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.logCycleDays ?? 1) + " 天", 1)
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_descriptions_item, { label: "汇报周期" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(project.value?.logReportCycleDays ?? 1) + " 天", 1)
                            ]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }),
                      isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                        createVNode(_component_a_divider, null, {
                          default: withCtx(() => [
                            createTextVNode("项目配置")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_form, {
                          layout: "inline",
                          style: { "margin-bottom": "16px" }
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                            createVNode(_component_a_form_item, { label: "汇报周期（天）" }, {
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
                                    createTextVNode("保存配置")
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
                          createTextVNode("项目成员")
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
                              placeholder: "员工ID",
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
                                    createTextVNode("成员")
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
                                createTextVNode("添加成员")
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
                            title: "确认移除该成员？",
                            onConfirm: ($event) => doRemoveMember(record.employeeId)
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: ""
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("移除")
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
                            createTextVNode("+ 新建里程碑")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        createVNode(_component_a_button, {
                          style: { "margin-left": "8px" },
                          onClick: loadMilestones,
                          loading: loadingMilestones.value
                        }, {
                          default: withCtx(() => [
                            createTextVNode("刷新")
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
                                createTextVNode(" 已完成 " + toDisplayString(record.actualCompletionDate), 1)
                              ]),
                              _: 2
                            }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                              key: 1,
                              color: "orange"
                            }, {
                              default: withCtx(() => [
                                createTextVNode("进行中")
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
                                  createTextVNode("编辑")
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
                                  createTextVNode("标记完成")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_popconfirm, {
                                title: "确认删除该里程碑？",
                                onConfirm: ($event) => doDeleteMilestone(record.id)
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: ""
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("删除")
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
                        title: editingMilestone.value ? "编辑里程碑" : "新建里程碑",
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
                                label: "名称",
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
                              createVNode(_component_a_form_item, { label: "排序" }, {
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
                              createVNode(_component_a_form_item, { label: "实际完成日期（可选）" }, {
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
                        title: "记录今日进度",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form, {
                            model: progressForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_form_item, { label: "关联里程碑（可选）" }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_select, {
                                    value: progressForm.value.milestoneId,
                                    "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                    placeholder: "选择里程碑",
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
                                label: "进度说明",
                                required: ""
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_textarea, {
                                    value: progressForm.value.note,
                                    "onUpdate:value": ($event) => progressForm.value.note = $event,
                                    rows: 3,
                                    placeholder: "描述今日完成内容…"
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
                                      createTextVNode("提交进度")
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
                      createVNode(_component_a_card, { title: "进度历史" }, {
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
                                      default: withCtx(() => [
                                        createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                        createVNode("div", null, toDisplayString(log.note), 1),
                                        log.milestoneId ? (openBlock(), createBlock("div", {
                                          key: 0,
                                          style: { "color": "#888", "font-size": "12px" }
                                        }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                      ]),
                                      _: 2
                                    }, 1024);
                                  }), 128))
                                ]),
                                _: 1
                              })) : (openBlock(), createBlock(_component_a_empty, {
                                key: 1,
                                description: "暂无进度记录"
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
                                      title: "里程碑完成数",
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
                                      title: "进度记录总数",
                                      value: dashboard.value.timeSeriesData.length,
                                      suffix: "条"
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
                                      title: "汇总报告",
                                      value: dashboard.value.summaries.length,
                                      suffix: "份"
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
                          title: "里程碑完成率",
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
                                            createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                              description: "暂无里程碑"
                            })) : createCommentVNode("", true)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_card, { title: "进度时间轴（最近 10 条）" }, {
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
                              description: "暂无进度数据"
                            }))
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["spinning"])) : createCommentVNode("", true),
                    activeTab.value === "summary" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                      createVNode(_component_a_card, {
                        title: "生成汇总报告",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form, {
                            model: summaryForm.value,
                            layout: "vertical"
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_form_item, {
                                label: "统计起始日期",
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
                                label: "统计截止日期",
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
                              createVNode(_component_a_form_item, { label: "PM 备注" }, {
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
                                      createTextVNode("生成并通知 CEO")
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
                      createVNode(_component_a_card, { title: "历史汇总报告" }, {
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
                                      createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
                        tab: "基本信息"
                      }),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "milestones",
                        tab: "里程碑"
                      })) : createCommentVNode("", true),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "progress",
                        tab: "进度记录"
                      })) : createCommentVNode("", true),
                      createVNode(_component_a_tab_pane, {
                        key: "dashboard",
                        tab: "Dashboard"
                      }),
                      isPmOrCeo.value ? (openBlock(), createBlock(_component_a_tab_pane, {
                        key: "summary",
                        tab: "汇总报告"
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
                        createVNode(_component_a_descriptions_item, { label: "项目名称" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.name), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "状态" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "开始日期" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.startDate ?? "—"), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "实际完工日期" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.actualEndDate ?? "—"), 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "日志申报周期" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.logCycleDays ?? 1) + " 天", 1)
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_descriptions_item, { label: "汇报周期" }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(project.value?.logReportCycleDays ?? 1) + " 天", 1)
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }),
                    isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createVNode(_component_a_divider, null, {
                        default: withCtx(() => [
                          createTextVNode("项目配置")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_form, {
                        layout: "inline",
                        style: { "margin-bottom": "16px" }
                      }, {
                        default: withCtx(() => [
                          createVNode(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                          createVNode(_component_a_form_item, { label: "汇报周期（天）" }, {
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
                                  createTextVNode("保存配置")
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
                        createTextVNode("项目成员")
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
                            placeholder: "员工ID",
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
                                  createTextVNode("成员")
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
                              createTextVNode("添加成员")
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
                          title: "确认移除该成员？",
                          onConfirm: ($event) => doRemoveMember(record.employeeId)
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small",
                              danger: ""
                            }, {
                              default: withCtx(() => [
                                createTextVNode("移除")
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
                          createTextVNode("+ 新建里程碑")
                        ]),
                        _: 1
                      }, 8, ["onClick"]),
                      createVNode(_component_a_button, {
                        style: { "margin-left": "8px" },
                        onClick: loadMilestones,
                        loading: loadingMilestones.value
                      }, {
                        default: withCtx(() => [
                          createTextVNode("刷新")
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
                              createTextVNode(" 已完成 " + toDisplayString(record.actualCompletionDate), 1)
                            ]),
                            _: 2
                          }, 1024)) : (openBlock(), createBlock(_component_a_tag, {
                            key: 1,
                            color: "orange"
                          }, {
                            default: withCtx(() => [
                              createTextVNode("进行中")
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
                                createTextVNode("编辑")
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
                                createTextVNode("标记完成")
                              ]),
                              _: 1
                            }, 8, ["onClick"])) : createCommentVNode("", true),
                            createVNode(_component_a_popconfirm, {
                              title: "确认删除该里程碑？",
                              onConfirm: ($event) => doDeleteMilestone(record.id)
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  danger: ""
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode("删除")
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
                      title: editingMilestone.value ? "编辑里程碑" : "新建里程碑",
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
                              label: "名称",
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
                            createVNode(_component_a_form_item, { label: "排序" }, {
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
                            createVNode(_component_a_form_item, { label: "实际完成日期（可选）" }, {
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
                      title: "记录今日进度",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_form, {
                          model: progressForm.value,
                          layout: "vertical"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, { label: "关联里程碑（可选）" }, {
                              default: withCtx(() => [
                                createVNode(_component_a_select, {
                                  value: progressForm.value.milestoneId,
                                  "onUpdate:value": ($event) => progressForm.value.milestoneId = $event,
                                  placeholder: "选择里程碑",
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
                              label: "进度说明",
                              required: ""
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_textarea, {
                                  value: progressForm.value.note,
                                  "onUpdate:value": ($event) => progressForm.value.note = $event,
                                  rows: 3,
                                  placeholder: "描述今日完成内容…"
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
                                    createTextVNode("提交进度")
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
                    createVNode(_component_a_card, { title: "进度历史" }, {
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
                                    default: withCtx(() => [
                                      createVNode("div", { style: { "font-weight": "500" } }, toDisplayString(log.createdAt?.slice(0, 10) ?? "—"), 1),
                                      createVNode("div", null, toDisplayString(log.note), 1),
                                      log.milestoneId ? (openBlock(), createBlock("div", {
                                        key: 0,
                                        style: { "color": "#888", "font-size": "12px" }
                                      }, " 里程碑 #" + toDisplayString(log.milestoneId), 1)) : createCommentVNode("", true)
                                    ]),
                                    _: 2
                                  }, 1024);
                                }), 128))
                              ]),
                              _: 1
                            })) : (openBlock(), createBlock(_component_a_empty, {
                              key: 1,
                              description: "暂无进度记录"
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
                                    title: "里程碑完成数",
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
                                    title: "进度记录总数",
                                    value: dashboard.value.timeSeriesData.length,
                                    suffix: "条"
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
                                    title: "汇总报告",
                                    value: dashboard.value.summaries.length,
                                    suffix: "份"
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
                        title: "里程碑完成率",
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
                                          createTextVNode(toDisplayString(item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : "进行中"), 1)
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
                            description: "暂无里程碑"
                          })) : createCommentVNode("", true)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_card, { title: "进度时间轴（最近 10 条）" }, {
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
                            description: "暂无进度数据"
                          }))
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["spinning"])) : createCommentVNode("", true),
                  activeTab.value === "summary" ? (openBlock(), createBlock(Fragment, { key: 4 }, [
                    createVNode(_component_a_card, {
                      title: "生成汇总报告",
                      style: { "margin-bottom": "16px" }
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_form, {
                          model: summaryForm.value,
                          layout: "vertical"
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_form_item, {
                              label: "统计起始日期",
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
                              label: "统计截止日期",
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
                            createVNode(_component_a_form_item, { label: "PM 备注" }, {
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
                                    createTextVNode("生成并通知 CEO")
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
                    createVNode(_component_a_card, { title: "历史汇总报告" }, {
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
                                    createTextVNode(toDisplayString(record.ceoNotifiedAt ? "已通知" : "未通知"), 1)
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
export {
  _sfc_main as default
};
//# sourceMappingURL=_id_-BES7Dq24.js.map
