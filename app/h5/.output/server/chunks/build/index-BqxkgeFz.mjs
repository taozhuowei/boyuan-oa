import { defineComponent, ref, computed, mergeProps, withCtx, createVNode, createTextVNode, openBlock, createBlock, Fragment, toDisplayString, createCommentVNode, renderList, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { Empty } from 'ant-design-vue';
import { _ as _export_sfc } from './server.mjs';
import { r as request } from './http-Dv09dGXg.mjs';
import { C as Card, a as Tabs, b as TabPane } from '../_/index.mjs';
import { T as Table } from '../_/index3.mjs';
import { B as Button, E as Empty$1 } from '../_/collapseMotion.mjs';
import { M as Modal } from '../_/index11.mjs';
import { D as Descriptions, a as DescriptionsItem } from '../_/index14.mjs';
import { S as Space } from '../_/index15.mjs';
import { I as Input } from '../_/index5.mjs';
import { D as Divider } from '../_/index16.mjs';
import { T as Timeline, a as TimelineItem } from '../_/index17.mjs';
import { T as Tag } from '../_/index9.mjs';
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
import './user-CsP34Oqk.mjs';
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
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';
import '../_/useFlexGapSupport.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ApprovalTimeline",
  __ssrInlineRender: true,
  props: {
    steps: {}
  },
  setup(__props) {
    const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
    function getColor(action) {
      if (action === "\u901A\u8FC7") return "green";
      if (action === "\u9A73\u56DE") return "red";
      if (action === "\u63D0\u4EA4" || action === "\u4FEE\u6539") return "blue";
      return "gray";
    }
    function getTagColor(action) {
      if (action === "\u901A\u8FC7") return "success";
      if (action === "\u9A73\u56DE") return "error";
      if (action === "\u4FEE\u6539") return "warning";
      return "processing";
    }
    function formatTime(t) {
      if (!t) return "\u2014";
      return t.replace("T", " ").slice(0, 16);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_divider = Divider;
      const _component_a_timeline = Timeline;
      const _component_a_timeline_item = TimelineItem;
      const _component_a_tag = Tag;
      const _component_a_empty = Empty$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "approval-timeline" }, _attrs))} data-v-62582405><div class="timeline-header" data-v-62582405>\u5BA1\u6279\u5386\u53F2</div>`);
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
          description: "\u6682\u65E0\u5BA1\u6279\u8BB0\u5F55",
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
      { title: "\u7C7B\u578B", dataIndex: "formTypeName", key: "formTypeName", width: 100 },
      { title: "\u7533\u8BF7\u4EBA", dataIndex: "submitter", key: "submitter", width: 100 },
      { title: "\u6458\u8981", key: "summary" },
      { title: "\u63D0\u4EA4\u65F6\u95F4", key: "submitTime", width: 160 },
      { title: "\u64CD\u4F5C", key: "action", width: 100 }
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
      if (!t) return "\u2014";
      return t.replace("T", " ").slice(0, 16);
    }
    function getSummary(record) {
      var _a, _b, _c, _d, _e;
      const d = (_a = record.formData) != null ? _a : {};
      if (record.formType === "LEAVE") {
        return `${(_b = d.leaveType) != null ? _b : ""} ${(_c = d.days) != null ? _c : ""}\u5929`;
      }
      if (record.formType === "OVERTIME") {
        return `${(_d = d.overtimeType) != null ? _d : ""} ${(_e = d.hours) != null ? _e : ""}\u5C0F\u65F6`;
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
        approvalHistory.value = history != null ? history : [];
      } catch {
        approvalHistory.value = [];
      }
    }
    async function handleApprove() {
      var _a;
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
        const msg = (_a = e.message) != null ? _a : "\u64CD\u4F5C\u5931\u8D25";
        alert(msg);
      }
    }
    async function handleReject() {
      var _a;
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
        const msg = (_a = e.message) != null ? _a : "\u64CD\u4F5C\u5931\u8D25";
        alert(msg);
      }
    }
    async function loadTodo() {
      loading.value = true;
      try {
        const list = await request({ url: "/attendance/todo" });
        todoList.value = list != null ? list : [];
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "todo-page" }, _attrs))} data-v-c87f59f1><h2 class="page-title" data-v-c87f59f1>\u5F85\u529E\u4E2D\u5FC3</h2>`);
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
                    tab: "\u5168\u90E8"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "attendance",
                    tab: "\u8003\u52E4\u5BA1\u6279"
                  }, null, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_tab_pane, {
                    key: "expense",
                    tab: "\u62A5\u9500\u5BA1\u6279"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_tab_pane, {
                      key: "all",
                      tab: "\u5168\u90E8"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "attendance",
                      tab: "\u8003\u52E4\u5BA1\u6279"
                    }),
                    createVNode(_component_a_tab_pane, {
                      key: "expense",
                      tab: "\u62A5\u9500\u5BA1\u6279"
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
              pagination: { pageSize: 20, showTotal: (t) => `\u5171 ${t} \u6761` },
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
                          _push4(`\u67E5\u770B\u5BA1\u6279`);
                        } else {
                          return [
                            createTextVNode("\u67E5\u770B\u5BA1\u6279")
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
                        createTextVNode("\u67E5\u770B\u5BA1\u6279")
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
                    tab: "\u5168\u90E8"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "attendance",
                    tab: "\u8003\u52E4\u5BA1\u6279"
                  }),
                  createVNode(_component_a_tab_pane, {
                    key: "expense",
                    tab: "\u62A5\u9500\u5BA1\u6279"
                  })
                ]),
                _: 1
              }, 8, ["activeKey", "onUpdate:activeKey"]),
              createVNode(_component_a_table, {
                columns,
                "data-source": filteredList.value,
                loading: loading.value,
                pagination: { pageSize: 20, showTotal: (t) => `\u5171 ${t} \u6761` },
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
                      createTextVNode("\u67E5\u770B\u5BA1\u6279")
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
        title: selectedRecord.value ? `\u5BA1\u6279 \xB7 ${selectedRecord.value.submitter} ${selectedRecord.value.formTypeName}` : "\u5BA1\u6279",
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u7533\u8BF7\u4EBA" }, {
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u63D0\u4EA4\u65F6\u95F4" }, {
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
                    _push3(ssrRenderComponent(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
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
                      createVNode(_component_a_descriptions_item, { label: "\u7533\u8BF7\u4EBA" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.submitter), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u7C7B\u578B" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u63D0\u4EA4\u65F6\u95F4" }, {
                        default: withCtx(() => [
                          createTextVNode(toDisplayString(formatTime(selectedRecord.value.submitTime)), 1)
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
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
                      placeholder: "\u5BA1\u6279\u610F\u89C1\uFF08\u9009\u586B\uFF09",
                      style: { "width": "280px" }
                    }, null, _parent3, _scopeId2));
                    _push3(ssrRenderComponent(_component_a_button, {
                      danger: "",
                      onClick: handleReject
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`\u9A73\u56DE`);
                        } else {
                          return [
                            createTextVNode("\u9A73\u56DE")
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
                          _push4(`\u901A\u8FC7`);
                        } else {
                          return [
                            createTextVNode("\u901A\u8FC7")
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
                        placeholder: "\u5BA1\u6279\u610F\u89C1\uFF08\u9009\u586B\uFF09",
                        style: { "width": "280px" }
                      }, null, 8, ["value", "onUpdate:value"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        onClick: handleReject
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u9A73\u56DE")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_button, {
                        type: "primary",
                        onClick: handleApprove
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u901A\u8FC7")
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
                    createVNode(_component_a_descriptions_item, { label: "\u7533\u8BF7\u4EBA" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.submitter), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u7C7B\u578B" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(selectedRecord.value.formTypeName), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u63D0\u4EA4\u65F6\u95F4" }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(formatTime(selectedRecord.value.submitTime)), 1)
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_descriptions_item, { label: "\u72B6\u6001" }, {
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
                        placeholder: "\u5BA1\u6279\u610F\u89C1\uFF08\u9009\u586B\uFF09",
                        style: { "width": "280px" }
                      }, null, 8, ["value", "onUpdate:value"]),
                      createVNode(_component_a_button, {
                        danger: "",
                        onClick: handleReject
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u9A73\u56DE")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_button, {
                        type: "primary",
                        onClick: handleApprove
                      }, {
                        default: withCtx(() => [
                          createTextVNode("\u901A\u8FC7")
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

export { index as default };
//# sourceMappingURL=index-BqxkgeFz.mjs.map
