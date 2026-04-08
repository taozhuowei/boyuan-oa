import { n as navigateTo } from "../server.mjs";
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, createVNode, toDisplayString, unref, openBlock, createBlock, Fragment, createCommentVNode, useSSRContext } from "vue";
import { Button, Card, Space, Select, SelectOption, Table, Tag, Popconfirm, Modal, Form, FormItem, Input, DatePicker, InputNumber } from "ant-design-vue/es/index.js";
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { r as request } from "./http-Dv09dGXg.js";
import { u as useUserStore } from "./user-CsP34Oqk.js";
import { message } from "ant-design-vue";
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
      { title: "项目名称", dataIndex: "name", key: "name" },
      { title: "状态", dataIndex: "status", key: "status", width: 100 },
      { title: "开始日期", dataIndex: "startDate", key: "startDate", width: 120 },
      { title: "成员数", dataIndex: "memberCount", key: "memberCount", width: 80 },
      { title: "操作", key: "action", width: 180 }
    ];
    async function loadProjects() {
      loading.value = true;
      try {
        const params = { page: "1", size: "100" };
        if (statusFilter.value) params.status = statusFilter.value;
        const query = new URLSearchParams(params).toString();
        const res = await request({ url: `/projects?${query}`, method: "GET" });
        projects.value = res.records ?? [];
      } catch {
        message.error("加载项目列表失败");
      } finally {
        loading.value = false;
      }
    }
    function resetCreateForm() {
      createForm.value = { name: "", startDateStr: null, logCycleDays: 1 };
    }
    async function doCreateProject() {
      if (!createForm.value.name.trim()) {
        message.warning("项目名称不能为空");
        return;
      }
      createLoading.value = true;
      try {
        const body = { name: createForm.value.name };
        if (createForm.value.startDateStr) body.startDate = createForm.value.startDateStr;
        if (createForm.value.logCycleDays) body.logCycleDays = createForm.value.logCycleDays;
        await request({ url: "/projects", method: "POST", body });
        message.success("项目创建成功");
        showCreateModal.value = false;
        resetCreateForm();
        await loadProjects();
      } catch {
        message.error("创建失败");
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
        message.warning("项目名称不能为空");
        return;
      }
      editLoading.value = true;
      try {
        const body = { name: editForm.value.name };
        if (editForm.value.startDateStr) body.startDate = editForm.value.startDateStr;
        await request({ url: `/projects/${editForm.value.id}`, method: "PUT", body });
        message.success("已更新");
        showEditModal.value = false;
        await loadProjects();
      } catch {
        message.error("更新失败");
      } finally {
        editLoading.value = false;
      }
    }
    async function doCloseProject(id) {
      try {
        await request({ url: `/projects/${id}/status`, method: "PATCH", body: { status: "CLOSED" } });
        message.success("项目已关闭");
        await loadProjects();
      } catch {
        message.error("操作失败");
      }
    }
    async function doReopenProject(id) {
      try {
        await request({ url: `/projects/${id}/status`, method: "PATCH", body: { status: "ACTIVE" } });
        message.success("项目已重开");
        await loadProjects();
      } catch {
        message.error("操作失败");
      }
    }
    async function doDeleteProject(id) {
      try {
        await request({ url: `/projects/${id}`, method: "DELETE" });
        message.success("已删除");
        await loadProjects();
      } catch {
        message.error("删除失败");
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "projects-page" }, _attrs))}><div class="page-header" style="${ssrRenderStyle({ "display": "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "16px" })}"><h2 class="page-title" style="${ssrRenderStyle({ "margin": "0" })}">项目管理</h2>`);
      if (isCeo.value) {
        _push(ssrRenderComponent(_component_a_button, {
          type: "primary",
          onClick: ($event) => showCreateModal.value = true
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`+ 新建项目`);
            } else {
              return [
                createTextVNode("+ 新建项目")
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
                    placeholder: "全部状态",
                    "allow-clear": "",
                    onChange: loadProjects
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_select_option, { value: "ACTIVE" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`进行中`);
                            } else {
                              return [
                                createTextVNode("进行中")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_a_select_option, { value: "CLOSED" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`已关闭`);
                            } else {
                              return [
                                createTextVNode("已关闭")
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                            default: withCtx(() => [
                              createTextVNode("进行中")
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_select_option, { value: "CLOSED" }, {
                            default: withCtx(() => [
                              createTextVNode("已关闭")
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
                        _push4(`刷新`);
                      } else {
                        return [
                          createTextVNode("刷新")
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
                      placeholder: "全部状态",
                      "allow-clear": "",
                      onChange: loadProjects
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                          default: withCtx(() => [
                            createTextVNode("进行中")
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_select_option, { value: "CLOSED" }, {
                          default: withCtx(() => [
                            createTextVNode("已关闭")
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
                        createTextVNode("刷新")
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
                    placeholder: "全部状态",
                    "allow-clear": "",
                    onChange: loadProjects
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_select_option, { value: "ACTIVE" }, {
                        default: withCtx(() => [
                          createTextVNode("进行中")
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_select_option, { value: "CLOSED" }, {
                        default: withCtx(() => [
                          createTextVNode("已关闭")
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
                      createTextVNode("刷新")
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
                          _push4(`${ssrInterpolate(record.status === "ACTIVE" ? "进行中" : "已关闭")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(record.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "startDate") {
                    _push3(`<!--[-->${ssrInterpolate(record.startDate ?? "—")}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "memberCount") {
                    _push3(`<!--[-->${ssrInterpolate(record.memberCount)} 人 <!--]-->`);
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
                                _push5(`详情`);
                              } else {
                                return [
                                  createTextVNode("详情")
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
                                  _push5(`编辑`);
                                } else {
                                  return [
                                    createTextVNode("编辑")
                                  ];
                                }
                              }),
                              _: 2
                            }, _parent4, _scopeId3));
                            if (record.status === "ACTIVE") {
                              _push4(ssrRenderComponent(_component_a_popconfirm, {
                                title: "确认关闭该项目？",
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
                                          _push6(`关闭`);
                                        } else {
                                          return [
                                            createTextVNode("关闭")
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
                                          createTextVNode("关闭")
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
                                    _push5(`重开`);
                                  } else {
                                    return [
                                      createTextVNode("重开")
                                    ];
                                  }
                                }),
                                _: 2
                              }, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                            _push4(ssrRenderComponent(_component_a_popconfirm, {
                              title: "确认删除该项目？",
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
                                createTextVNode("详情")
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
                                  createTextVNode("编辑")
                                ]),
                                _: 1
                              }, 8, ["onClick"]),
                              record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                                key: 0,
                                title: "确认关闭该项目？",
                                onConfirm: ($event) => doCloseProject(record.id)
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "link",
                                    size: "small",
                                    danger: ""
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode("关闭")
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
                                  createTextVNode("重开")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_popconfirm, {
                                title: "确认删除该项目？",
                                onConfirm: ($event) => doDeleteProject(record.id)
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
                        createTextVNode(toDisplayString(record.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : createCommentVNode("", true),
                    column.key === "startDate" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                      createTextVNode(toDisplayString(record.startDate ?? "—"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "memberCount" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                      createTextVNode(toDisplayString(record.memberCount) + " 人 ", 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 4 }, {
                      default: withCtx(() => [
                        createVNode(_component_a_button, {
                          type: "link",
                          size: "small",
                          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                        }, {
                          default: withCtx(() => [
                            createTextVNode("详情")
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
                              createTextVNode("编辑")
                            ]),
                            _: 1
                          }, 8, ["onClick"]),
                          record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                            key: 0,
                            title: "确认关闭该项目？",
                            onConfirm: ($event) => doCloseProject(record.id)
                          }, {
                            default: withCtx(() => [
                              createVNode(_component_a_button, {
                                type: "link",
                                size: "small",
                                danger: ""
                              }, {
                                default: withCtx(() => [
                                  createTextVNode("关闭")
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
                              createTextVNode("重开")
                            ]),
                            _: 1
                          }, 8, ["onClick"])) : createCommentVNode("", true),
                          createVNode(_component_a_popconfirm, {
                            title: "确认删除该项目？",
                            onConfirm: ($event) => doDeleteProject(record.id)
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
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "name" ? (openBlock(), createBlock("a", {
                    key: 0,
                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                  }, toDisplayString(record.name), 9, ["onClick"])) : createCommentVNode("", true),
                  column.key === "status" ? (openBlock(), createBlock(_component_a_tag, {
                    key: 1,
                    color: record.status === "ACTIVE" ? "green" : "default"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(record.status === "ACTIVE" ? "进行中" : "已关闭"), 1)
                    ]),
                    _: 2
                  }, 1032, ["color"])) : createCommentVNode("", true),
                  column.key === "startDate" ? (openBlock(), createBlock(Fragment, { key: 2 }, [
                    createTextVNode(toDisplayString(record.startDate ?? "—"), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "memberCount" ? (openBlock(), createBlock(Fragment, { key: 3 }, [
                    createTextVNode(toDisplayString(record.memberCount) + " 人 ", 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(_component_a_space, { key: 4 }, {
                    default: withCtx(() => [
                      createVNode(_component_a_button, {
                        type: "link",
                        size: "small",
                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/projects/${record.id}`)
                      }, {
                        default: withCtx(() => [
                          createTextVNode("详情")
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
                            createTextVNode("编辑")
                          ]),
                          _: 1
                        }, 8, ["onClick"]),
                        record.status === "ACTIVE" ? (openBlock(), createBlock(_component_a_popconfirm, {
                          key: 0,
                          title: "确认关闭该项目？",
                          onConfirm: ($event) => doCloseProject(record.id)
                        }, {
                          default: withCtx(() => [
                            createVNode(_component_a_button, {
                              type: "link",
                              size: "small",
                              danger: ""
                            }, {
                              default: withCtx(() => [
                                createTextVNode("关闭")
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
                            createTextVNode("重开")
                          ]),
                          _: 1
                        }, 8, ["onClick"])) : createCommentVNode("", true),
                        createVNode(_component_a_popconfirm, {
                          title: "确认删除该项目？",
                          onConfirm: ($event) => doDeleteProject(record.id)
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
                      ], 64)) : createCommentVNode("", true)
                    ]),
                    _: 2
                  }, 1024)) : createCommentVNode("", true)
                ]),
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
        title: "新建项目",
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
                    label: "项目名称",
                    required: ""
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_input, {
                          value: createForm.value.name,
                          "onUpdate:value": ($event) => createForm.value.name = $event,
                          placeholder: "请输入项目名称"
                        }, null, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_input, {
                            value: createForm.value.name,
                            "onUpdate:value": ($event) => createForm.value.name = $event,
                            placeholder: "请输入项目名称"
                          }, null, 8, ["value", "onUpdate:value"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "开始日期" }, {
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
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                      label: "项目名称",
                      required: ""
                    }, {
                      default: withCtx(() => [
                        createVNode(_component_a_input, {
                          value: createForm.value.name,
                          "onUpdate:value": ($event) => createForm.value.name = $event,
                          placeholder: "请输入项目名称"
                        }, null, 8, ["value", "onUpdate:value"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_a_form_item, { label: "开始日期" }, {
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
                    createVNode(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
                    label: "项目名称",
                    required: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_a_input, {
                        value: createForm.value.name,
                        "onUpdate:value": ($event) => createForm.value.name = $event,
                        placeholder: "请输入项目名称"
                      }, null, 8, ["value", "onUpdate:value"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_a_form_item, { label: "开始日期" }, {
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
                  createVNode(_component_a_form_item, { label: "日志申报周期（天）" }, {
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
        title: "编辑项目",
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
                    label: "项目名称",
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
                  _push3(ssrRenderComponent(_component_a_form_item, { label: "开始日期" }, {
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
                      label: "项目名称",
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
                    createVNode(_component_a_form_item, { label: "开始日期" }, {
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
                    label: "项目名称",
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
                  createVNode(_component_a_form_item, { label: "开始日期" }, {
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
export {
  _sfc_main as default
};
//# sourceMappingURL=index-BpFLpTcg.js.map
