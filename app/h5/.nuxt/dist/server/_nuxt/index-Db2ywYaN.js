import { Button, Spin, Card, Empty, Tree, Tag, Popconfirm, Modal, Form, FormItem, Input, InputNumber } from "ant-design-vue/es/index.js";
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, createVNode, toDisplayString, openBlock, createBlock, Fragment, withModifiers, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { r as request } from "./http-Dv09dGXg.js";
import { u as useUserStore } from "./user-CsP34Oqk.js";
import { message } from "ant-design-vue";
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
    const isCeo = computed(() => userStore.userInfo?.role === "ceo");
    const loading = ref(false);
    const departments = ref([]);
    function toTreeNodes(nodes) {
      return nodes.map((n) => ({
        key: n.id,
        title: n.name,
        dataRef: n,
        children: toTreeNodes(n.children ?? [])
      }));
    }
    const treeData = computed(() => toTreeNodes(departments.value));
    async function loadDepartments() {
      loading.value = true;
      try {
        const res = await request({ url: "/departments", method: "GET" });
        departments.value = res;
      } catch {
        message.error("加载部门数据失败");
      } finally {
        loading.value = false;
      }
    }
    function flattenDepts(nodes) {
      return nodes.flatMap((n) => [n, ...flattenDepts(n.children ?? [])]);
    }
    function getParentName(id) {
      if (!id) return "";
      const found = flattenDepts(departments.value).find((d) => d.id === id);
      return found?.name ?? String(id);
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
        message.warning("部门名称不能为空");
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
          message.success("已更新");
        } else {
          await request({ url: "/departments", method: "POST", body });
          message.success("部门已创建");
        }
        showDeptModal.value = false;
        resetDeptForm();
        await loadDepartments();
      } catch {
        message.error("操作失败");
      } finally {
        deptLoading.value = false;
      }
    }
    async function doDeleteDept(id) {
      try {
        await request({ url: `/departments/${id}`, method: "DELETE" });
        message.success("已删除");
        await loadDepartments();
      } catch {
        message.error("删除失败（可能存在员工或子部门）");
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "org-page" }, _attrs))} data-v-b1b2f9bb><div class="page-header" style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "16px" })}" data-v-b1b2f9bb><h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}" data-v-b1b2f9bb>组织架构</h2>`);
      if (isCeo.value) {
        _push(ssrRenderComponent(_component_a_button, {
          type: "primary",
          onClick: ($event) => openCreateModal(null)
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`+ 新建部门`);
            } else {
              return [
                createTextVNode("+ 新建部门")
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
                    _push3(ssrRenderComponent(_component_a_empty, { description: "暂无部门数据" }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_empty, { description: "暂无部门数据" })
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
                                _push5(`${ssrInterpolate(dataRef.employeeCount)} 人`);
                              } else {
                                return [
                                  createTextVNode(toDisplayString(dataRef.employeeCount) + " 人", 1)
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
                                  _push5(` + 子部门 `);
                                } else {
                                  return [
                                    createTextVNode(" + 子部门 ")
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
                                  _push5(` 编辑 `);
                                } else {
                                  return [
                                    createTextVNode(" 编辑 ")
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            _push4(ssrRenderComponent(_component_a_popconfirm, {
                              title: "确认删除该部门？（需无员工且无子部门）",
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
                                        _push6(`删除`);
                                      } else {
                                        return [
                                          createTextVNode("删除")
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
                                        createTextVNode("删除")
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
                                  createTextVNode(toDisplayString(dataRef.employeeCount) + " 人", 1)
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
                                    createTextVNode(" + 子部门 ")
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
                                    createTextVNode(" 编辑 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"]),
                                createVNode(_component_a_popconfirm, {
                                  title: "确认删除该部门？（需无员工且无子部门）",
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
                                        createTextVNode("删除")
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
                                createTextVNode(toDisplayString(dataRef.employeeCount) + " 人", 1)
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
                                  createTextVNode(" + 子部门 ")
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
                                  createTextVNode(" 编辑 ")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              createVNode(_component_a_popconfirm, {
                                title: "确认删除该部门？（需无员工且无子部门）",
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
                                      createTextVNode("删除")
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
                  createVNode(_component_a_empty, { description: "暂无部门数据" })
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
                            createTextVNode(toDisplayString(dataRef.employeeCount) + " 人", 1)
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
                              createTextVNode(" + 子部门 ")
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
                              createTextVNode(" 编辑 ")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          createVNode(_component_a_popconfirm, {
                            title: "确认删除该部门？（需无员工且无子部门）",
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
                                  createTextVNode("删除")
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
        title: editingDept.value ? "编辑部门" : parentId.value ? "新建子部门" : "新建部门",
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
                    label: "部门名称",
                    required: ""
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: deptForm.value.name,
                          "onUpdate:value": ($event) => deptForm.value.name = $event,
                          placeholder: "请输入部门名称"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: deptForm.value.name,
                            "onUpdate:value": ($event) => deptForm.value.name = $event,
                            placeholder: "请输入部门名称"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "排序" }, {
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
                    _push3(ssrRenderComponent(_component_a_form_item, { label: "上级部门" }, {
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
                      label: "部门名称",
                      required: ""
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: deptForm.value.name,
                          "onUpdate:value": ($event) => deptForm.value.name = $event,
                          placeholder: "请输入部门名称"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "排序" }, {
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
                      label: "上级部门"
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
                    label: "部门名称",
                    required: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: deptForm.value.name,
                        "onUpdate:value": ($event) => deptForm.value.name = $event,
                        placeholder: "请输入部门名称"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "排序" }, {
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
                    label: "上级部门"
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
export {
  index as default
};
//# sourceMappingURL=index-Db2ywYaN.js.map
