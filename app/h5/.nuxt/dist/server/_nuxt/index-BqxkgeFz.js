import { Divider, Timeline, TimelineItem, Tag, Empty as Empty$1, Card, Tabs, TabPane, Table, Button, Modal, Descriptions, DescriptionsItem, Space, Input } from "ant-design-vue/es/index.js";
import { defineComponent, mergeProps, withCtx, createTextVNode, toDisplayString, createVNode, openBlock, createBlock, createCommentVNode, Fragment, renderList, unref, useSSRContext, ref, computed } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from "vue/server-renderer";
import { Empty } from "ant-design-vue";
import { _ as _export_sfc } from "../server.mjs";
import { r as request } from "./http-Dv09dGXg.js";
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
import "./user-CsP34Oqk.js";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ApprovalTimeline",
  __ssrInlineRender: true,
  props: {
    steps: {}
  },
  setup(__props) {
    const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
    function getColor(action) {
      if (action === "通过") return "green";
      if (action === "驳回") return "red";
      if (action === "提交" || action === "修改") return "blue";
      return "gray";
    }
    function getTagColor(action) {
      if (action === "通过") return "success";
      if (action === "驳回") return "error";
      if (action === "修改") return "warning";
      return "processing";
    }
    function formatTime(t) {
      if (!t) return "—";
      return t.replace("T", " ").slice(0, 16);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_divider = Divider;
      const _component_a_timeline = Timeline;
      const _component_a_timeline_item = TimelineItem;
      const _component_a_tag = Tag;
      const _component_a_empty = Empty$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "approval-timeline" }, _attrs))} data-v-62582405><div class="timeline-header" data-v-62582405>审批历史</div>`);
      _push(ssrRenderComponent(_component_a_divider, { style: { "margin": "8px 0" } }, null, _parent));
      if (__props.steps.length > 0) {
        _push(ssrRenderComponent(_component_a_timeline, null, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<!--[-->`);
              ssrRenderList(__props.steps, (step, index2) => {
                _push2(ssrRenderComponent(_component_a_timeline_item, {
                  key: index2,
                  color: getColor(step.action)
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<div class="step-content" data-v-62582405${_scopeId2}><span class="step-time" data-v-62582405${_scopeId2}>${ssrInterpolate(formatTime(step.time))}</span><span class="step-operator" data-v-62582405${_scopeId2}>${ssrInterpolate(step.operator)}</span>`);
                      _push3(ssrRenderComponent(_component_a_tag, {
                        color: getTagColor(step.action),
                        class: "step-action"
                      }, {
                        default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                          if (_push4) {
                            _push4(`${ssrInterpolate(step.action)}`);
                          } else {
                            return [
                              createTextVNode(toDisplayString(step.action), 1)
                            ];
                          }
                        }),
                        _: 2
                      }, _parent3, _scopeId2));
                      if (step.comment) {
                        _push3(`<span class="step-comment" data-v-62582405${_scopeId2}>${ssrInterpolate(step.comment)}</span>`);
                      } else {
                        _push3(`<!---->`);
                      }
                      _push3(`</div>`);
                    } else {
                      return [
                        createVNode("div", { class: "step-content" }, [
                          createVNode("span", { class: "step-time" }, toDisplayString(formatTime(step.time)), 1),
                          createVNode("span", { class: "step-operator" }, toDisplayString(step.operator), 1),
                          createVNode(_component_a_tag, {
                            color: getTagColor(step.action),
                            class: "step-action"
                          }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString(step.action), 1)
                            ]),
                            _: 2
                          }, 1032, ["color"]),
                          step.comment ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "step-comment"
                          }, toDisplayString(step.comment), 1)) : createCommentVNode("", true)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              return [
                (openBlock(true), createBlock(Fragment, null, renderList(__props.steps, (step, index2) => {
                  return openBlock(), createBlock(_component_a_timeline_item, {
                    key: index2,
                    color: getColor(step.action)
                  }, {
                    default: withCtx(() => [
                      createVNode("div", { class: "step-content" }, [
                        createVNode("span", { class: "step-time" }, toDisplayString(formatTime(step.time)), 1),
                        createVNode("span", { class: "step-operator" }, toDisplayString(step.operator), 1),
                        createVNode(_component_a_tag, {
                          color: getTagColor(step.action),
                          class: "step-action"
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(step.action), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"]),
                        step.comment ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "step-comment"
                        }, toDisplayString(step.comment), 1)) : createCommentVNode("", true)
                      ])
                    ]),
                    _: 2
                  }, 1032, ["color"]);
                }), 128))
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(ssrRenderComponent(_component_a_empty, {
          description: "暂无审批记录",
          image: unref(simpleImage)
        }, null, _parent));
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/customized/ApprovalTimeline.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-62582405"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const todoList = ref([]);
    const activeTab = ref("all");
    const modalVisible = ref(false);
    const selectedRecord = ref(null);
    const approvalComment = ref("");
    const approvalHistory = ref([]);
    const columns = [
      { title: "类型", dataIndex: "formTypeName", key: "formTypeName", width: 100 },
      { title: "申请人", dataIndex: "submitter", key: "submitter", width: 100 },
      { title: "摘要", key: "summary" },
      { title: "提交时间", key: "submitTime", width: 160 },
      { title: "操作", key: "action", width: 100 }
    ];
    const ATTENDANCE_TYPES = ["LEAVE", "OVERTIME", "INJURY"];
    const EXPENSE_TYPES = ["EXPENSE"];
    const filteredList = computed(() => {
      if (activeTab.value === "attendance") {
        return todoList.value.filter((r) => ATTENDANCE_TYPES.includes(r.formType));
      }
      if (activeTab.value === "expense") {
        return todoList.value.filter((r) => EXPENSE_TYPES.includes(r.formType));
      }
      return todoList.value;
    });
    function formatTime(t) {
      if (!t) return "—";
      return t.replace("T", " ").slice(0, 16);
    }
    function getSummary(record) {
      const d = record.formData ?? {};
      if (record.formType === "LEAVE") {
        return `${d.leaveType ?? ""} ${d.days ?? ""}天`;
      }
      if (record.formType === "OVERTIME") {
        return `${d.overtimeType ?? ""} ${d.hours ?? ""}小时`;
      }
      return record.formTypeName;
    }
    function onTabChange(key) {
      activeTab.value = key;
    }
    async function viewApproval(record) {
      selectedRecord.value = record;
      approvalComment.value = "";
      approvalHistory.value = [];
      modalVisible.value = true;
      try {
        const history = await request({ url: `/attendance/${record.id}/history` });
        approvalHistory.value = history ?? [];
      } catch {
        approvalHistory.value = [];
      }
    }
    async function handleApprove() {
      if (!selectedRecord.value) return;
      try {
        await request({
          url: `/attendance/${selectedRecord.value.id}/approve`,
          method: "POST",
          body: { action: "APPROVE", comment: approvalComment.value }
        });
        modalVisible.value = false;
        await loadTodo();
      } catch (e) {
        const msg = e.message ?? "操作失败";
        alert(msg);
      }
    }
    async function handleReject() {
      if (!selectedRecord.value) return;
      try {
        await request({
          url: `/attendance/${selectedRecord.value.id}/reject`,
          method: "POST",
          body: { action: "REJECT", comment: approvalComment.value }
        });
        modalVisible.value = false;
        await loadTodo();
      } catch (e) {
        const msg = e.message ?? "操作失败";
        alert(msg);
      }
    }
    async function loadTodo() {
      loading.value = true;
      try {
        const list = await request({ url: "/attendance/todo" });
        todoList.value = list ?? [];
      } catch {
        todoList.value = [];
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_tabs = Tabs;
      const _component_a_tab_pane = TabPane;
      const _component_a_table = Table;
      const _component_a_button = Button;
      const _component_a_modal = Modal;
      const _component_a_descriptions = Descriptions;
      const _component_a_descriptions_item = DescriptionsItem;
      const _component_CustomizedApprovalTimeline = __nuxt_component_0;
      const _component_a_space = Space;
      const _component_a_input = Input;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "todo-page" }, _attrs))} data-v-c87f59f1><h2 class="page-title" data-v-c87f59f1>待办中心</h2>`);
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
                    key: "all",
                    tab: "全部"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "attendance",
                    tab: "考勤审批"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "expense",
                    tab: "报销审批"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_tab_pane, {
                      key: "all",
                      tab: "全部"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "attendance",
                      tab: "考勤审批"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "expense",
                      tab: "报销审批"
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_table, {
              columns,
              "data-source": filteredList.value,
              loading: loading.value,
              pagination: { pageSize: 20, showTotal: (t) => `共 ${t} 条` },
              "row-key": "id",
              size: "small"
            }, {
              bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (column.key === "submitTime") {
                    _push3(`<!--[-->${ssrInterpolate(formatTime(record.submitTime))}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "summary") {
                    _push3(`<!--[-->${ssrInterpolate(getSummary(record))}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "action") {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "link",
                      size: "small",
                      onClick: ($event) => viewApproval(record)
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`查看审批`);
                        } else {
                          return [
                            createTextVNode("查看审批")
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
                      createTextVNode(toDisplayString(formatTime(record.submitTime)), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "summary" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                      createTextVNode(toDisplayString(getSummary(record)), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                      key: 2,
                      type: "link",
                      size: "small",
                      onClick: ($event) => viewApproval(record)
                    }, {
                      default: withCtx(() => [
                        createTextVNode("查看审批")
                      ]),
                      _: 1
                    }, 8, ["onClick"])) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_tabs, {
                activeKey: activeTab.value,
                "onUpdate:activeKey": ($event) => activeTab.value = $event,
                onChange: onTabChange
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_tab_pane, {
                    key: "all",
                    tab: "全部"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "attendance",
                    tab: "考勤审批"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "expense",
                    tab: "报销审批"
                  })
                ]),
                _: 1
              }, 8, ["activeKey", "onUpdate:activeKey"]),
              createVNode(_component_a_table, {
                columns,
                "data-source": filteredList.value,
                loading: loading.value,
                pagination: { pageSize: 20, showTotal: (t) => `共 ${t} 条` },
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "submitTime" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(formatTime(record.submitTime)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "summary" ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                    createTextVNode(toDisplayString(getSummary(record)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                    key: 2,
                    type: "link",
                    size: "small",
                    onClick: ($event) => viewApproval(record)
                  }, {
                    default: withCtx(() => [
                      createTextVNode("查看审批")
                    ]),
                    _: 1
                  }, 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["data-source", "loading", "pagination"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: modalVisible.value,
        "onUpdate:open": ($event) => modalVisible.value = $event,
        title: selectedRecord.value ? `审批 · ${selectedRecord.value.submitter} ${selectedRecord.value.formTypeName}` : "审批",
        width: "600px",
        footer: null
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (selectedRecord.value) {
              _push2(`<div class="approval-detail" data-v-c87f59f1${_scopeId}>`);
              _push2(ssrRenderComponent(_component_a_descriptions, {
                column: 2,
                size: "small",
                bordered: ""
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "申请人" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(selectedRecord.value.submitter)}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(selectedRecord.value.submitter), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "提交时间" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(formatTime(selectedRecord.value.submitTime))}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(formatTime(selectedRecord.value.submitTime)), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "状态" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(selectedRecord.value.status)}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(selectedRecord.value.status), 1)
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_descriptions_item, { label: "申请人" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.submitter), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "类型" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "提交时间" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(formatTime(selectedRecord.value.submitTime)), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "状态" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.status), 1)
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_CustomizedApprovalTimeline, { steps: approvalHistory.value }, null, _parent2, _scopeId));
              _push2(`<div class="modal-actions" data-v-c87f59f1${_scopeId}>`);
              _push2(ssrRenderComponent(_component_a_space, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_input, {
                      value: approvalComment.value,
                      "onUpdate:value": ($event) => approvalComment.value = $event,
                      placeholder: "审批意见（选填）",
                      style: { "width": "280px" }
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_button, {
                      danger: "",
                      onClick: handleReject
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`驳回`);
                        } else {
                          return [
                            createTextVNode("驳回")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "primary",
                      onClick: handleApprove
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`通过`);
                        } else {
                          return [
                            createTextVNode("通过")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_input, {
                        value: approvalComment.value,
                        "onUpdate:value": ($event) => approvalComment.value = $event,
                        placeholder: "审批意见（选填）",
                        style: { "width": "280px" }
                      }, null, 8, ["value", "onUpdate:value"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        onClick: handleReject
                      }, {
                        default: withCtx(() => [
                          createTextVNode("驳回")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_button, {
                        type: "primary",
                        onClick: handleApprove
                      }, {
                        default: withCtx(() => [
                          createTextVNode("通过")
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              selectedRecord.value ? (openBlock(), createBlock("div", {
                key: 0,
                class: "approval-detail"
              }, [
                createVNode(_component_a_descriptions, {
                  column: 2,
                  size: "small",
                  bordered: ""
                }, {
                  default: withCtx(() => [
                    createVNode(_component_a_descriptions_item, { label: "申请人" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.submitter), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "类型" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "提交时间" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(formatTime(selectedRecord.value.submitTime)), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "状态" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.status), 1)
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                }),
                createVNode(_component_CustomizedApprovalTimeline, { steps: approvalHistory.value }, null, 8, ["steps"]),
                createVNode("div", { class: "modal-actions" }, [
                  createVNode(_component_a_space, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: approvalComment.value,
                        "onUpdate:value": ($event) => approvalComment.value = $event,
                        placeholder: "审批意见（选填）",
                        style: { "width": "280px" }
                      }, null, 8, ["value", "onUpdate:value"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        onClick: handleReject
                      }, {
                        default: withCtx(() => [
                          createTextVNode("驳回")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_button, {
                        type: "primary",
                        onClick: handleApprove
                      }, {
                        default: withCtx(() => [
                          createTextVNode("通过")
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/todo/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c87f59f1"]]);
export {
  index as default
};
//# sourceMappingURL=index-BqxkgeFz.js.map
