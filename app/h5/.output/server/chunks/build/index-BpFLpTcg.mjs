import { n as navigateTo } from './server.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, createVNode, toDisplayString, unref, openBlock, createBlock, Fragment, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { message } from 'ant-design-vue';
import { B as Button } from '../_/collapseMotion.mjs';
import { C as Card } from '../_/index.mjs';
import { S as Space } from '../_/index15.mjs';
import { S as Select, a as SelectOption, T as Table } from '../_/index3.mjs';
import { T as Tag } from '../_/index9.mjs';
import { P as Popconfirm, I as InputNumber } from '../_/index10.mjs';
import { M as Modal } from '../_/index11.mjs';
import { F as Form, a as FormItem } from '../_/index7.mjs';
import { I as Input } from '../_/index5.mjs';
import { D as DatePicker } from '../_/dayjs.mjs';
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
import '../_/useFlexGapSupport.mjs';
import 'lodash-es/fromPairs';
import '../_/index6.mjs';
import '../_/CheckOutlined.mjs';
import '../_/useBreakpoint.mjs';
import '../_/index12.mjs';
import '../_/ExclamationCircleFilled.mjs';
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';
import 'lodash-es/cloneDeep';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const role = computed(() => {
      var _a, _b;
      return (_b = (_a = userStore.userInfo) == null ? void 0 : _a.role) != null ? _b : "";
    });
    const isCeo = computed(() => role.value === "ceo");
    const loading = ref(false);
    const projects = ref([]);
    const statusFilter = ref(void 0);
    const showCreateModal = ref(false);
    const createLoading = ref(false);
    const createForm = ref({ name: "", startDateStr: null, logCycleDays: 1 });
    const showEditModal = ref(false);
    const editLoading = ref(false);
    const editForm = ref({ id: 0, name: "", startDateStr: null });
    const columns = [
      { title: "ID", dataIndex: "id", key: "id", width: 60 },
      { title: "\u9879\u76EE\u540D\u79F0", dataIndex: "name", key: "name" },
      { title: "\u72B6\u6001", dataIndex: "status", key: "status", width: 100 },
      { title: "\u5F00\u59CB\u65E5\u671F", dataIndex: "startDate", key: "startDate", width: 120 },
      { title: "\u6210\u5458\u6570", dataIndex: "memberCount", key: "memberCount", width: 80 },
      { title: "\u64CD\u4F5C", key: "action", width: 180 }
    ];
    async function loadProjects() {
      var _a;
      loading.value = true;
      try {
        const params = { page: "1", size: "100" };
        if (statusFilter.value) params.status = statusFilter.value;
        const query = new URLSearchParams(params).toString();
        const res = await request({ url: `/projects?${query}`, method: "GET" });
        projects.value = (_a = res.records) != null ? _a : [];
      } catch {
        message.error("\u52A0\u8F7D\u9879\u76EE\u5217\u8868\u5931\u8D25");
      } finally {
        loading.value = false;
      }
    }
    function resetCreateForm() {
      createForm.value = { name: "", startDateStr: null, logCycleDays: 1 };
    }
    async function doCreateProject() {
      if (!createForm.value.name.trim()) {
        message.warning("\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      createLoading.value = true;
      try {
        const body = { name: createForm.value.name };
        if (createForm.value.startDateStr) body.startDate = createForm.value.startDateStr;
        if (createForm.value.logCycleDays) body.logCycleDays = createForm.value.logCycleDays;
        await request({ url: "/projects", method: "POST", body });
        message.success("\u9879\u76EE\u521B\u5EFA\u6210\u529F");
        showCreateModal.value = false;
        resetCreateForm();
        await loadProjects();
      } catch {
        message.error("\u521B\u5EFA\u5931\u8D25");
      } finally {
        createLoading.value = false;
      }
    }
    function openEditModal(project) {
      editForm.value = { id: project.id, name: project.name, startDateStr: project.startDate };
      showEditModal.value = true;
    }
    async function doUpdateProject() {
      if (!editForm.value.name.trim()) {
        message.warning("\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      editLoading.value = true;
      try {
        const body = { name: editForm.value.name };
        if (editForm.value.startDateStr) body.startDate = editForm.value.startDateStr;
        await request({ url: `/projects/${editForm.value.id}`, method: "PUT", body });
        message.success("\u5DF2\u66F4\u65B0");
        showEditModal.value = false;
        await loadProjects();
      } catch {
        message.error("\u66F4\u65B0\u5931\u8D25");
      } finally {
        editLoading.value = false;
      }
    }
    async function doCloseProject(id) {
      try {
        await request({ url: `/projects/${id}/status`, method: "PATCH", body: { status: "CLOSED" } });
        message.success("\u9879\u76EE\u5DF2\u5173\u95ED");
        await loadProjects();
      } catch {
        message.error("\u64CD\u4F5C\u5931\u8D25");
      }
    }
    async function doReopenProject(id) {
      try {
        await request({ url: `/projects/${id}/status`, method: "PATCH", body: { status: "ACTIVE" } });
        message.success("\u9879\u76EE\u5DF2\u91CD\u5F00");
        await loadProjects();
      } catch {
        message.error("\u64CD\u4F5C\u5931\u8D25");
      }
    }
    async function doDeleteProject(id) {
      try {
        await request({ url: `/projects/${id}`, method: "DELETE" });
        message.success("\u5DF2\u5220\u9664");
        await loadProjects();
      } catch {
        message.error("\u5220\u9664\u5931\u8D25");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_button = Button;
      const _component_a_card = Card;
      const _component_a_space = Space;
      const _component_a_select = Select;
      const _component_a_select_option = SelectOption;
      const _component_a_table = Table;
      const _component_a_tag = Tag;
      const _component_a_popconfirm = Popconfirm;
      const _component_a_modal = Modal;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_input = Input;
      const _component_a_date_picker = DatePicker;
      const _component_a_input_number = InputNumber;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "projects-page" }, _attrs))}><div class="page-header" style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "16px" })}"><h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}">\u9879\u76EE\u7BA1\u7406</h2>`);
      if (isCeo.value) {
        _push(ssrRenderComponent(_component_a_button, {
          type: "primary",
          onClick: ($event) => showCreateModal.value = true
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`+ \u65B0\u5EFA\u9879\u76EE`);
            } else {
              return [
                createTextVNode("+ \u65B0\u5EFA\u9879\u76EE")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_a_card, { style: { "margin-bottom": "12px" } }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_space, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_select, {
                    value: statusFilter.value,
                    "onUpdate:value": ($event) => statusFilter.value = $event,
                    style: { "width": "140px" },
                    placeholder: "\u5168\u90E8\u72B6\u6001",
                    "allow-clear": "",
                    onChange: loadProjects
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_select_option, { value: "ACTIVE" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`\u8FDB\u884C\u4E2D`);
                            } else {
                              return [
                                createTextVNode("\u8FDB\u884C\u4E2D")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_a_select_option, { value: "CLOSED" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`\u5DF2\u5173\u95ED`);
                            } else {
                              return [
                                createTextVNode("\u5DF2\u5173\u95ED")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                            default: withCtx(() => [
                              createTextVNode("\u8FDB\u884C\u4E2D")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "CLOSED" }, {
                            default: withCtx(() => [
                              createTextVNode("\u5DF2\u5173\u95ED")
                            ]),
                            _: 1
                          })
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_button, {
                    onClick: loadProjects,
                    loading: loading.value
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
                } else {
                  return [
                    createVNode(_component_a_select, {
                      value: statusFilter.value,
                      "onUpdate:value": ($event) => statusFilter.value = $event,
                      style: { "width": "140px" },
                      placeholder: "\u5168\u90E8\u72B6\u6001",
                      "allow-clear": "",
                      onChange: loadProjects
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                          default: withCtx(() => [
                            createTextVNode("\u8FDB\u884C\u4E2D")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_select_option, { value: "CLOSED" }, {
                          default: withCtx(() => [
                            createTextVNode("\u5DF2\u5173\u95ED")
                          ]),
                          _: 1
                        })
                      ]),
                      _: 1
                    }, 8, ["value", "onUpdate:value"]),
                    createVNode(_component_a_button, {
                      onClick: loadProjects,
                      loading: loading.value
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u5237\u65B0")
                      ]),
                      _: 1
                    }, 8, ["loading"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_space, null, {
                default: withCtx(() => [
                  createVNode(_component_a_select, {
                    value: statusFilter.value,
                    "onUpdate:value": ($event) => statusFilter.value = $event,
                    style: { "width": "140px" },
                    placeholder: "\u5168\u90E8\u72B6\u6001",
                    "allow-clear": "",
                    onChange: loadProjects
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                        default: withCtx(() => [
                          createTextVNode("\u8FDB\u884C\u4E2D")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_select_option, { value: "CLOSED" }, {
                        default: withCtx(() => [
                          createTextVNode("\u5DF2\u5173\u95ED")
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["value", "onUpdate:value"]),
                  createVNode(_component_a_button, {
                    onClick: loadProjects,
                    loading: loading.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode("\u5237\u65B0")
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
      }, _parent));
      _push(ssrRenderComponent(_component_a_card, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_table, {
              columns,
              "data-source": projects.value,
              loading: loading.value,
              "row-key": "id",
              size: "small",
              pagination: { pageSize: 10, showSizeChanger: false }
            }, {
              bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                var _a, _b;
                if (_push3) {
                  if (column.key === "name") {
                    _push3(`<a${_scopeId2}>${ssrInterpolate(record.name)}</a>`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "status") {
                    _push3(ssrRenderComponent(_component_a_tag, {
                      color: record.status === "ACTIVE" ? "green" : "default"
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(record.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(record.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "startDate") {
                    _push3(`<!--[-->${ssrInterpolate((_a = record.startDate) != null ? _a : "\u2014")}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "memberCount") {
                    _push3(`<!--[-->${ssrInterpolate(record.memberCount)} \u4EBA <!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "action") {
                    _push3(ssrRenderComponent(_component_a_space, null, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_button, {
                            type: "link",
                            size: "small",
                            onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                          }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`\u8BE6\u60C5`);
                              } else {
                                return [
                                  createTextVNode("\u8BE6\u60C5")
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                          if (isCeo.value) {
                            _push4(`<!--[-->`);
                            _push4(ssrRenderComponent(_component_a_button, {
                              type: "link",
                              size: "small",
                              onClick: ($event) => openEditModal(record)
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(`\u7F16\u8F91`);
                                } else {
                                  return [
                                    createTextVNode("\u7F16\u8F91")
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            if (record.status === "ACTIVE") {
                              _push4(ssrRenderComponent(_component_a_popconfirm, {
                                title: "\u786E\u8BA4\u5173\u95ED\u8BE5\u9879\u76EE\uFF1F",
                                onConfirm: ($event) => doCloseProject(record.id)
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
                                          _push6(`\u5173\u95ED`);
                                        } else {
                                          return [
                                            createTextVNode("\u5173\u95ED")
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
                                          createTextVNode("\u5173\u95ED")
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
                            if (record.status === "CLOSED") {
                              _push4(ssrRenderComponent(_component_a_button, {
                                type: "link",
                                size: "small",
                                onClick: ($event) => doReopenProject(record.id)
                              }, {
                                default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                  if (_push5) {
                                    _push5(`\u91CD\u5F00`);
                                  } else {
                                    return [
                                      createTextVNode("\u91CD\u5F00")
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                            _push4(ssrRenderComponent(_component_a_popconfirm, {
                              title: "\u786E\u8BA4\u5220\u9664\u8BE5\u9879\u76EE\uFF1F",
                              onConfirm: ($event) => doDeleteProject(record.id)
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
                                        _push6(`\u5220\u9664`);
                                      } else {
                                        return [
                                          createTextVNode("\u5220\u9664")
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
                                        createTextVNode("\u5220\u9664")
                                      ]),
                                      _: 1
                                    })
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            _push4(`<!--]-->`);
                          } else {
                            _push4(`<!---->`);
                          }
                        } else {
                          return [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small",
                              onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                            }, {
                              default: withCtx(() => [
                                createTextVNode("\u8BE6\u60C5")
                              ]),
                              _: 1
                            }, 8, ["onClick"]),
                            isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                onClick: ($event) => openEditModal(record)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u7F16\u8F91")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                                key: 0,
                                title: "\u786E\u8BA4\u5173\u95ED\u8BE5\u9879\u76EE\uFF1F",
                                onConfirm: ($event) => doCloseProject(record.id)
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: ""
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5173\u95ED")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }, 8, ["onConfirm"])) : createCommentVNode("", true),
                              record.status === "CLOSED" ? (openBlock(), createBlock(_component_a_button, {
                                key: 1,
                                type: "link",
                                size: "small",
                                onClick: ($event) => doReopenProject(record.id)
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u91CD\u5F00")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_popconfirm, {
                                title: "\u786E\u8BA4\u5220\u9664\u8BE5\u9879\u76EE\uFF1F",
                                onConfirm: ($event) => doDeleteProject(record.id)
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
                            ], 64)) : createCommentVNode("", true)
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
                    column.key === "name" ? (openBlock(), createBlock("a", {
                      key: 0,
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                    }, toDisplayString(record.name), 9, ["onClick"])) : createCommentVNode("", true),
                    column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: record.status === "ACTIVE" ? "green" : "default"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : createCommentVNode("", true),
                    column.key === "startDate" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                      createTextVNode(toDisplayString((_b = record.startDate) != null ? _b : "\u2014"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "memberCount" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                      createTextVNode(toDisplayString(record.memberCount) + " \u4EBA ", 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 4 }, {
                      default: withCtx(() => [
                        createVNode(_component_a_button, {
                          type: "link",
                          size: "small",
                          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u8BE6\u60C5")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          createVNode(_component_a_button, {
                            type: "link",
                            size: "small",
                            onClick: ($event) => openEditModal(record)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u7F16\u8F91")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                            key: 0,
                            title: "\u786E\u8BA4\u5173\u95ED\u8BE5\u9879\u76EE\uFF1F",
                            onConfirm: ($event) => doCloseProject(record.id)
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: ""
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5173\u95ED")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["onConfirm"])) : createCommentVNode("", true),
                          record.status === "CLOSED" ? (openBlock(), createBlock(_component_a_button, {
                            key: 1,
                            type: "link",
                            size: "small",
                            onClick: ($event) => doReopenProject(record.id)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u91CD\u5F00")
                            ]),
                            _: 1
                          }, 8, ["onClick"])) : createCommentVNode("", true),
                          createVNode(_component_a_popconfirm, {
                            title: "\u786E\u8BA4\u5220\u9664\u8BE5\u9879\u76EE\uFF1F",
                            onConfirm: ($event) => doDeleteProject(record.id)
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
                        ], 64)) : createCommentVNode("", true)
                      ]),
                      _: 2
                    }, 1024)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_table, {
                columns,
                "data-source": projects.value,
                loading: loading.value,
                "row-key": "id",
                size: "small",
                pagination: { pageSize: 10, showSizeChanger: false }
              }, {
                bodyCell: withCtx(({ column, record }) => {
                  var _a;
                  return [
                    column.key === "name" ? (openBlock(), createBlock("a", {
                      key: 0,
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                    }, toDisplayString(record.name), 9, ["onClick"])) : createCommentVNode("", true),
                    column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: record.status === "ACTIVE" ? "green" : "default"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.status === "ACTIVE" ? "\u8FDB\u884C\u4E2D" : "\u5DF2\u5173\u95ED"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : createCommentVNode("", true),
                    column.key === "startDate" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                      createTextVNode(toDisplayString((_a = record.startDate) != null ? _a : "\u2014"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "memberCount" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                      createTextVNode(toDisplayString(record.memberCount) + " \u4EBA ", 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 4 }, {
                      default: withCtx(() => [
                        createVNode(_component_a_button, {
                          type: "link",
                          size: "small",
                          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("\u8BE6\u60C5")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          createVNode(_component_a_button, {
                            type: "link",
                            size: "small",
                            onClick: ($event) => openEditModal(record)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u7F16\u8F91")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                            key: 0,
                            title: "\u786E\u8BA4\u5173\u95ED\u8BE5\u9879\u76EE\uFF1F",
                            onConfirm: ($event) => doCloseProject(record.id)
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: ""
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5173\u95ED")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["onConfirm"])) : createCommentVNode("", true),
                          record.status === "CLOSED" ? (openBlock(), createBlock(_component_a_button, {
                            key: 1,
                            type: "link",
                            size: "small",
                            onClick: ($event) => doReopenProject(record.id)
                          }, {
                            default: withCtx(() => [
                              createTextVNode("\u91CD\u5F00")
                            ]),
                            _: 1
                          }, 8, ["onClick"])) : createCommentVNode("", true),
                          createVNode(_component_a_popconfirm, {
                            title: "\u786E\u8BA4\u5220\u9664\u8BE5\u9879\u76EE\uFF1F",
                            onConfirm: ($event) => doDeleteProject(record.id)
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
                        ], 64)) : createCommentVNode("", true)
                      ]),
                      _: 2
                    }, 1024)) : createCommentVNode("", true)
                  ];
                }),
                _: 1
              }, 8, ["data-source", "loading"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: showCreateModal.value,
        "onUpdate:open": ($event) => showCreateModal.value = $event,
        title: "\u65B0\u5EFA\u9879\u76EE",
        onOk: doCreateProject,
        "confirm-loading": createLoading.value,
        onCancel: resetCreateForm
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form, {
              model: createForm.value,
              layout: "vertical"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_form_item, {
                    label: "\u9879\u76EE\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: createForm.value.name,
                          "onUpdate:value": ($event) => createForm.value.name = $event,
                          placeholder: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: createForm.value.name,
                            "onUpdate:value": ($event) => createForm.value.name = $event,
                            placeholder: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_date_picker, {
                          value: createForm.value.startDateStr,
                          "onUpdate:value": ($event) => createForm.value.startDateStr = $event,
                          style: { "width": "100%" },
                          "value-format": "YYYY-MM-DD"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_date_picker, {
                            value: createForm.value.startDateStr,
                            "onUpdate:value": ($event) => createForm.value.startDateStr = $event,
                            style: { "width": "100%" },
                            "value-format": "YYYY-MM-DD"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input_number, {
                          value: createForm.value.logCycleDays,
                          "onUpdate:value": ($event) => createForm.value.logCycleDays = $event,
                          min: 1,
                          max: 30,
                          style: { "width": "100%" }
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input_number, {
                            value: createForm.value.logCycleDays,
                            "onUpdate:value": ($event) => createForm.value.logCycleDays = $event,
                            min: 1,
                            max: 30,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_form_item, {
                      label: "\u9879\u76EE\u540D\u79F0",
                      required: ""
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: createForm.value.name,
                          "onUpdate:value": ($event) => createForm.value.name = $event,
                          placeholder: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_date_picker, {
                          value: createForm.value.startDateStr,
                          "onUpdate:value": ($event) => createForm.value.startDateStr = $event,
                          style: { "width": "100%" },
                          "value-format": "YYYY-MM-DD"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input_number, {
                          value: createForm.value.logCycleDays,
                          "onUpdate:value": ($event) => createForm.value.logCycleDays = $event,
                          min: 1,
                          max: 30,
                          style: { "width": "100%" }
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
              createVNode(_component_a_form, {
                model: createForm.value,
                layout: "vertical"
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u9879\u76EE\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: createForm.value.name,
                        "onUpdate:value": ($event) => createForm.value.name = $event,
                        placeholder: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: createForm.value.startDateStr,
                        "onUpdate:value": ($event) => createForm.value.startDateStr = $event,
                        style: { "width": "100%" },
                        "value-format": "YYYY-MM-DD"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "\u65E5\u5FD7\u7533\u62A5\u5468\u671F\uFF08\u5929\uFF09" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input_number, {
                        value: createForm.value.logCycleDays,
                        "onUpdate:value": ($event) => createForm.value.logCycleDays = $event,
                        min: 1,
                        max: 30,
                        style: { "width": "100%" }
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
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: showEditModal.value,
        "onUpdate:open": ($event) => showEditModal.value = $event,
        title: "\u7F16\u8F91\u9879\u76EE",
        onOk: doUpdateProject,
        "confirm-loading": editLoading.value
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form, {
              model: editForm.value,
              layout: "vertical"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_form_item, {
                    label: "\u9879\u76EE\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: editForm.value.name,
                          "onUpdate:value": ($event) => editForm.value.name = $event
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: editForm.value.name,
                            "onUpdate:value": ($event) => editForm.value.name = $event
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_date_picker, {
                          value: editForm.value.startDateStr,
                          "onUpdate:value": ($event) => editForm.value.startDateStr = $event,
                          style: { "width": "100%" },
                          "value-format": "YYYY-MM-DD"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_date_picker, {
                            value: editForm.value.startDateStr,
                            "onUpdate:value": ($event) => editForm.value.startDateStr = $event,
                            style: { "width": "100%" },
                            "value-format": "YYYY-MM-DD"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_form_item, {
                      label: "\u9879\u76EE\u540D\u79F0",
                      required: ""
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: editForm.value.name,
                          "onUpdate:value": ($event) => editForm.value.name = $event
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_date_picker, {
                          value: editForm.value.startDateStr,
                          "onUpdate:value": ($event) => editForm.value.startDateStr = $event,
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
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_form, {
                model: editForm.value,
                layout: "vertical"
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u9879\u76EE\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: editForm.value.name,
                        "onUpdate:value": ($event) => editForm.value.name = $event
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "\u5F00\u59CB\u65E5\u671F" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_date_picker, {
                        value: editForm.value.startDateStr,
                        "onUpdate:value": ($event) => editForm.value.startDateStr = $event,
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
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BpFLpTcg.mjs.map
