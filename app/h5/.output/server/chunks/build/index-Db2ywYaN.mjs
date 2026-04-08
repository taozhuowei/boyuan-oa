import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, createVNode, toDisplayString, openBlock, createBlock, Fragment, withModifiers, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { message } from 'ant-design-vue';
import { _ as _export_sfc } from './server.mjs';
import { B as Button, E as Empty } from '../_/collapseMotion.mjs';
import { S as Spin, C as Card, T as Tree } from '../_/index.mjs';
import { T as Tag } from '../_/index9.mjs';
import { P as Popconfirm, I as InputNumber } from '../_/index10.mjs';
import { M as Modal } from '../_/index11.mjs';
import { F as Form, a as FormItem } from '../_/index7.mjs';
import { I as Input } from '../_/index5.mjs';
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
import '../_/index12.mjs';
import '../_/ExclamationCircleFilled.mjs';
import '../_/InfoCircleFilled.mjs';
import '../_/index13.mjs';
import 'lodash-es/cloneDeep';
import '../_/useFlexGapSupport.mjs';
import 'async-validator';
import 'lodash-es/find';
import 'compute-scroll-into-view';
import 'lodash-es/intersection';
import 'lodash-es/omit';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const isCeo = computed(() => {
      var _a;
      return ((_a = userStore.userInfo) == null ? void 0 : _a.role) === "ceo";
    });
    const loading = ref(false);
    const departments = ref([]);
    function toTreeNodes(nodes) {
      return nodes.map((n) => {
        var _a;
        return {
          key: n.id,
          title: n.name,
          dataRef: n,
          children: toTreeNodes((_a = n.children) != null ? _a : [])
        };
      });
    }
    const treeData = computed(() => toTreeNodes(departments.value));
    async function loadDepartments() {
      loading.value = true;
      try {
        const res = await request({ url: "/departments", method: "GET" });
        departments.value = res;
      } catch {
        message.error("\u52A0\u8F7D\u90E8\u95E8\u6570\u636E\u5931\u8D25");
      } finally {
        loading.value = false;
      }
    }
    function flattenDepts(nodes) {
      return nodes.flatMap((n) => {
        var _a;
        return [n, ...flattenDepts((_a = n.children) != null ? _a : [])];
      });
    }
    function getParentName(id) {
      var _a;
      if (!id) return "";
      const found = flattenDepts(departments.value).find((d) => d.id === id);
      return (_a = found == null ? void 0 : found.name) != null ? _a : String(id);
    }
    const showDeptModal = ref(false);
    const deptLoading = ref(false);
    const editingDept = ref(null);
    const parentId = ref(null);
    const deptForm = ref({ name: "", sort: 0 });
    function openCreateModal(pid) {
      editingDept.value = null;
      parentId.value = pid;
      deptForm.value = { name: "", sort: 0 };
      showDeptModal.value = true;
    }
    function openEditModal(dept) {
      editingDept.value = dept;
      parentId.value = dept.parentId;
      deptForm.value = { name: dept.name, sort: dept.sort };
      showDeptModal.value = true;
    }
    function resetDeptForm() {
      editingDept.value = null;
      parentId.value = null;
      deptForm.value = { name: "", sort: 0 };
    }
    async function doSaveDept() {
      if (!deptForm.value.name.trim()) {
        message.warning("\u90E8\u95E8\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      deptLoading.value = true;
      try {
        const body = {
          name: deptForm.value.name,
          sort: deptForm.value.sort
        };
        if (parentId.value) body.parentId = parentId.value;
        if (editingDept.value) {
          await request({ url: `/departments/${editingDept.value.id}`, method: "PUT", body });
          message.success("\u5DF2\u66F4\u65B0");
        } else {
          await request({ url: "/departments", method: "POST", body });
          message.success("\u90E8\u95E8\u5DF2\u521B\u5EFA");
        }
        showDeptModal.value = false;
        resetDeptForm();
        await loadDepartments();
      } catch {
        message.error("\u64CD\u4F5C\u5931\u8D25");
      } finally {
        deptLoading.value = false;
      }
    }
    async function doDeleteDept(id) {
      try {
        await request({ url: `/departments/${id}`, method: "DELETE" });
        message.success("\u5DF2\u5220\u9664");
        await loadDepartments();
      } catch {
        message.error("\u5220\u9664\u5931\u8D25\uFF08\u53EF\u80FD\u5B58\u5728\u5458\u5DE5\u6216\u5B50\u90E8\u95E8\uFF09");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_button = Button;
      const _component_a_spin = Spin;
      const _component_a_card = Card;
      const _component_a_empty = Empty;
      const _component_a_tree = Tree;
      const _component_a_tag = Tag;
      const _component_a_popconfirm = Popconfirm;
      const _component_a_modal = Modal;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_input = Input;
      const _component_a_input_number = InputNumber;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "org-page" }, _attrs))} data-v-b1b2f9bb><div class="page-header" style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "16px" })}" data-v-b1b2f9bb><h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}" data-v-b1b2f9bb>\u7EC4\u7EC7\u67B6\u6784</h2>`);
      if (isCeo.value) {
        _push(ssrRenderComponent(_component_a_button, {
          type: "primary",
          onClick: ($event) => openCreateModal(null)
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`+ \u65B0\u5EFA\u90E8\u95E8`);
            } else {
              return [
                createTextVNode("+ \u65B0\u5EFA\u90E8\u95E8")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_a_spin, { spinning: loading.value }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (departments.value.length === 0 && !loading.value) {
              _push2(ssrRenderComponent(_component_a_card, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_empty, { description: "\u6682\u65E0\u90E8\u95E8\u6570\u636E" }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_empty, { description: "\u6682\u65E0\u90E8\u95E8\u6570\u636E" })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(ssrRenderComponent(_component_a_card, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_tree, {
                      "tree-data": treeData.value,
                      "default-expand-all": true,
                      selectable: false
                    }, {
                      title: withCtx(({ dataRef }, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`<div style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "gap": "8px", "padding": "2px 0" })}" data-v-b1b2f9bb${_scopeId3}><span style="${ssrRenderStyle({ "font-weight": "500" })}" data-v-b1b2f9bb${_scopeId3}>${ssrInterpolate(dataRef.name)}</span>`);
                          _push4(ssrRenderComponent(_component_a_tag, {
                            color: "blue",
                            style: { "margin": "0" }
                          }, {
                            default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`${ssrInterpolate(dataRef.employeeCount)} \u4EBA`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(dataRef.employeeCount) + " \u4EBA", 1)
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
                              style: { "padding": "0 4px" },
                              onClick: ($event) => openCreateModal(dataRef.id)
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(` + \u5B50\u90E8\u95E8 `);
                                } else {
                                  return [
                                    createTextVNode(" + \u5B50\u90E8\u95E8 ")
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_button, {
                              type: "link",
                              size: "small",
                              style: { "padding": "0 4px" },
                              onClick: ($event) => openEditModal(dataRef)
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(` \u7F16\u8F91 `);
                                } else {
                                  return [
                                    createTextVNode(" \u7F16\u8F91 ")
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_popconfirm, {
                              title: "\u786E\u8BA4\u5220\u9664\u8BE5\u90E8\u95E8\uFF1F\uFF08\u9700\u65E0\u5458\u5DE5\u4E14\u65E0\u5B50\u90E8\u95E8\uFF09",
                              onConfirm: ($event) => doDeleteDept(dataRef.id),
                              onClick: () => {
                              }
                            }, {
                              default: withCtx((_3, _push5, _parent5, _scopeId4) => {
                                if (_push5) {
                                  _push5(ssrRenderComponent(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: "",
                                    style: { "padding": "0 4px" }
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
                                      danger: "",
                                      style: { "padding": "0 4px" }
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
                          _push4(`</div>`);
                        } else {
                          return [
                            createVNode("div", { style: { "display": "flex", "align-items": "center", "gap": "8px", "padding": "2px 0" } }, [
                              createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(dataRef.name), 1),
                              createVNode(_component_a_tag, {
                                color: "blue",
                                style: { "margin": "0" }
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(dataRef.employeeCount) + " \u4EBA", 1)
                                ]),
                                _: 2
                              }, 1024),
                              isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  style: { "padding": "0 4px" },
                                  onClick: withModifiers(($event) => openCreateModal(dataRef.id), ["stop"])
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" + \u5B50\u90E8\u95E8 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                createVNode(_component_a_button, {
                                  type: "link",
                                  size: "small",
                                  style: { "padding": "0 4px" },
                                  onClick: withModifiers(($event) => openEditModal(dataRef), ["stop"])
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" \u7F16\u8F91 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                createVNode(_component_a_popconfirm, {
                                  title: "\u786E\u8BA4\u5220\u9664\u8BE5\u90E8\u95E8\uFF1F\uFF08\u9700\u65E0\u5458\u5DE5\u4E14\u65E0\u5B50\u90E8\u95E8\uFF09",
                                  onConfirm: ($event) => doDeleteDept(dataRef.id),
                                  onClick: withModifiers(() => {
                                  }, ["stop"])
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "link",
                                      size: "small",
                                      danger: "",
                                      style: { "padding": "0 4px" }
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode("\u5220\u9664")
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                }, 8, ["onConfirm", "onClick"])
                              ], 64)) : createCommentVNode("", true)
                            ])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_tree, {
                        "tree-data": treeData.value,
                        "default-expand-all": true,
                        selectable: false
                      }, {
                        title: withCtx(({ dataRef }) => [
                          createVNode("div", { style: { "display": "flex", "align-items": "center", "gap": "8px", "padding": "2px 0" } }, [
                            createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(dataRef.name), 1),
                            createVNode(_component_a_tag, {
                              color: "blue",
                              style: { "margin": "0" }
                            }, {
                              default: withCtx(() => [
                                createTextVNode(toDisplayString(dataRef.employeeCount) + " \u4EBA", 1)
                              ]),
                              _: 2
                            }, 1024),
                            isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                style: { "padding": "0 4px" },
                                onClick: withModifiers(($event) => openCreateModal(dataRef.id), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" + \u5B50\u90E8\u95E8 ")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                style: { "padding": "0 4px" },
                                onClick: withModifiers(($event) => openEditModal(dataRef), ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" \u7F16\u8F91 ")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_a_popconfirm, {
                                title: "\u786E\u8BA4\u5220\u9664\u8BE5\u90E8\u95E8\uFF1F\uFF08\u9700\u65E0\u5458\u5DE5\u4E14\u65E0\u5B50\u90E8\u95E8\uFF09",
                                onConfirm: ($event) => doDeleteDept(dataRef.id),
                                onClick: withModifiers(() => {
                                }, ["stop"])
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: "",
                                    style: { "padding": "0 4px" }
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("\u5220\u9664")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              }, 8, ["onConfirm", "onClick"])
                            ], 64)) : createCommentVNode("", true)
                          ])
                        ]),
                        _: 1
                      }, 8, ["tree-data"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            }
          } else {
            return [
              departments.value.length === 0 && !loading.value ? (openBlock(), createBlock(_component_a_card, { key: 0 }, {
                default: withCtx(() => [
                  createVNode(_component_a_empty, { description: "\u6682\u65E0\u90E8\u95E8\u6570\u636E" })
                ]),
                _: 1
              })) : (openBlock(), createBlock(_component_a_card, { key: 1 }, {
                default: withCtx(() => [
                  createVNode(_component_a_tree, {
                    "tree-data": treeData.value,
                    "default-expand-all": true,
                    selectable: false
                  }, {
                    title: withCtx(({ dataRef }) => [
                      createVNode("div", { style: { "display": "flex", "align-items": "center", "gap": "8px", "padding": "2px 0" } }, [
                        createVNode("span", { style: { "font-weight": "500" } }, toDisplayString(dataRef.name), 1),
                        createVNode(_component_a_tag, {
                          color: "blue",
                          style: { "margin": "0" }
                        }, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString(dataRef.employeeCount) + " \u4EBA", 1)
                          ]),
                          _: 2
                        }, 1024),
                        isCeo.value ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          createVNode(_component_a_button, {
                            type: "link",
                            size: "small",
                            style: { "padding": "0 4px" },
                            onClick: withModifiers(($event) => openCreateModal(dataRef.id), ["stop"])
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" + \u5B50\u90E8\u95E8 ")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          createVNode(_component_a_button, {
                            type: "link",
                            size: "small",
                            style: { "padding": "0 4px" },
                            onClick: withModifiers(($event) => openEditModal(dataRef), ["stop"])
                          }, {
                            default: withCtx(() => [
                              createTextVNode(" \u7F16\u8F91 ")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          createVNode(_component_a_popconfirm, {
                            title: "\u786E\u8BA4\u5220\u9664\u8BE5\u90E8\u95E8\uFF1F\uFF08\u9700\u65E0\u5458\u5DE5\u4E14\u65E0\u5B50\u90E8\u95E8\uFF09",
                            onConfirm: ($event) => doDeleteDept(dataRef.id),
                            onClick: withModifiers(() => {
                            }, ["stop"])
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: "",
                                style: { "padding": "0 4px" }
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("\u5220\u9664")
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["onConfirm", "onClick"])
                        ], 64)) : createCommentVNode("", true)
                      ])
                    ]),
                    _: 1
                  }, 8, ["tree-data"])
                ]),
                _: 1
              }))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_modal, {
        open: showDeptModal.value,
        "onUpdate:open": ($event) => showDeptModal.value = $event,
        title: editingDept.value ? "\u7F16\u8F91\u90E8\u95E8" : parentId.value ? "\u65B0\u5EFA\u5B50\u90E8\u95E8" : "\u65B0\u5EFA\u90E8\u95E8",
        onOk: doSaveDept,
        "confirm-loading": deptLoading.value,
        onCancel: resetDeptForm
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form, {
              model: deptForm.value,
              layout: "vertical"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_form_item, {
                    label: "\u90E8\u95E8\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: deptForm.value.name,
                          "onUpdate:value": ($event) => deptForm.value.name = $event,
                          placeholder: "\u8BF7\u8F93\u5165\u90E8\u95E8\u540D\u79F0"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: deptForm.value.name,
                            "onUpdate:value": ($event) => deptForm.value.name = $event,
                            placeholder: "\u8BF7\u8F93\u5165\u90E8\u95E8\u540D\u79F0"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input_number, {
                          value: deptForm.value.sort,
                          "onUpdate:value": ($event) => deptForm.value.sort = $event,
                          min: 0,
                          style: { "width": "100%" }
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input_number, {
                            value: deptForm.value.sort,
                            "onUpdate:value": ($event) => deptForm.value.sort = $event,
                            min: 0,
                            style: { "width": "100%" }
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  if (parentId.value) {
                    _push3(ssrRenderComponent(_component_a_form_item, { label: "\u4E0A\u7EA7\u90E8\u95E8" }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(ssrRenderComponent(_component_a_input, {
                            value: getParentName(parentId.value),
                            disabled: ""
                          }, null, _parent4, _scopeId3));
                        } else {
                          return [
                            createVNode(_component_a_input, {
                              value: getParentName(parentId.value),
                              disabled: ""
                            }, null, 8, ["value"])
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
                    createVNode(_component_a_form_item, {
                      label: "\u90E8\u95E8\u540D\u79F0",
                      required: ""
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: deptForm.value.name,
                          "onUpdate:value": ($event) => deptForm.value.name = $event,
                          placeholder: "\u8BF7\u8F93\u5165\u90E8\u95E8\u540D\u79F0"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input_number, {
                          value: deptForm.value.sort,
                          "onUpdate:value": ($event) => deptForm.value.sort = $event,
                          min: 0,
                          style: { "width": "100%" }
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    parentId.value ? (openBlock(), createBlock(_component_a_form_item, {
                      key: 0,
                      label: "\u4E0A\u7EA7\u90E8\u95E8"
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: getParentName(parentId.value),
                          disabled: ""
                        }, null, 8, ["value"])
                      ]),
                      _: 1
                    })) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_form, {
                model: deptForm.value,
                layout: "vertical"
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_form_item, {
                    label: "\u90E8\u95E8\u540D\u79F0",
                    required: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: deptForm.value.name,
                        "onUpdate:value": ($event) => deptForm.value.name = $event,
                        placeholder: "\u8BF7\u8F93\u5165\u90E8\u95E8\u540D\u79F0"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "\u6392\u5E8F" }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input_number, {
                        value: deptForm.value.sort,
                        "onUpdate:value": ($event) => deptForm.value.sort = $event,
                        min: 0,
                        style: { "width": "100%" }
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  parentId.value ? (openBlock(), createBlock(_component_a_form_item, {
                    key: 0,
                    label: "\u4E0A\u7EA7\u90E8\u95E8"
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: getParentName(parentId.value),
                        disabled: ""
                      }, null, 8, ["value"])
                    ]),
                    _: 1
                  })) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/org/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b1b2f9bb"]]);

export { index as default };
//# sourceMappingURL=index-Db2ywYaN.mjs.map
