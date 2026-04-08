import { f as useRoute, n as navigateTo, _ as _export_sfc } from "../server.mjs";
import { defineComponent, ref, computed, watch, mergeProps, withCtx, createTextVNode, toDisplayString, openBlock, createBlock, Fragment, renderList, createVNode, unref, createCommentVNode, renderSlot, useSSRContext } from "vue";
import { ConfigProvider, Layout, LayoutSider, Menu, SubMenu, MenuItem, LayoutHeader, Button, Badge, Dropdown, Avatar, MenuDivider, LayoutContent } from "ant-design-vue/es/index.js";
import { ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot } from "vue/server-renderer";
import { u as useUserStore } from "./user-CsP34Oqk.js";
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
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const ROLE_MENUS = {
      ceo: [
        { key: "/", label: "工作台", path: "/" },
        { key: "/approval", label: "审批中心", path: "/approval" },
        { key: "/employees", label: "员工管理", path: "/employees" },
        { key: "/projects", label: "项目管理", path: "/projects" },
        { key: "/payroll", label: "薪资管理", path: "/payroll" },
        { key: "/retention", label: "数据保留", path: "/retention" },
        { key: "/settings", label: "系统设置", path: "/settings" }
      ],
      finance: [
        { key: "/", label: "工作台", path: "/" },
        { key: "/approval", label: "审批中心", path: "/approval" },
        { key: "/employees", label: "员工管理", path: "/employees" },
        { key: "/payroll", label: "薪资管理", path: "/payroll" },
        { key: "/directory", label: "通讯录导入", path: "/directory" }
      ],
      project_manager: [
        { key: "/", label: "工作台", path: "/" },
        { key: "/approval", label: "审批中心", path: "/approval" },
        { key: "/projects", label: "项目管理", path: "/projects" },
        { key: "/forms", label: "表单中心", path: "/forms" }
      ],
      worker: [
        { key: "/", label: "工作台", path: "/" },
        { key: "/forms", label: "表单中心", path: "/forms" },
        { key: "/payroll", label: "工资条", path: "/payroll/slips" }
      ],
      employee: [
        { key: "/", label: "工作台", path: "/" },
        { key: "/forms", label: "表单中心", path: "/forms" },
        { key: "/payroll", label: "工资条", path: "/payroll/slips" }
      ]
    };
    const DEFAULT_MENUS = [
      { key: "/", label: "工作台", path: "/" }
    ];
    const userStore = useUserStore();
    const route = useRoute();
    const collapsed = ref(false);
    const selectedKeys = ref([route.path]);
    const notificationCount = ref(0);
    const todoCount = ref(0);
    const apiMenus = ref(null);
    const menuItems = computed(() => {
      if (apiMenus.value) return apiMenus.value;
      const role = userStore.userInfo?.role ?? "employee";
      return ROLE_MENUS[role] ?? DEFAULT_MENUS;
    });
    watch(() => route.path, (path) => {
      selectedKeys.value = [path];
    });
    function onMenuClick({ key }) {
      navigateTo(key);
    }
    async function onAvatarMenuClick({ key }) {
      if (key === "logout") {
        userStore.logout();
        await navigateTo("/login");
      } else if (key === "profile") {
        await navigateTo("/me");
      } else if (key === "password") {
        await navigateTo("/me/password");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_config_provider = ConfigProvider;
      const _component_a_layout = Layout;
      const _component_a_layout_sider = LayoutSider;
      const _component_a_menu = Menu;
      const _component_a_sub_menu = SubMenu;
      const _component_a_menu_item = MenuItem;
      const _component_a_layout_header = LayoutHeader;
      const _component_a_button = Button;
      const _component_a_badge = Badge;
      const _component_a_dropdown = Dropdown;
      const _component_a_avatar = Avatar;
      const _component_a_menu_divider = MenuDivider;
      const _component_a_layout_content = LayoutContent;
      _push(ssrRenderComponent(_component_a_config_provider, mergeProps({ "auto-insert-space-in-button": false }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_layout, { class: "app-shell" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_layout_sider, {
                    collapsed: collapsed.value,
                    "onUpdate:collapsed": ($event) => collapsed.value = $event,
                    collapsible: "",
                    width: "220",
                    theme: "dark"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<div class="logo" data-v-a7cf49d1${_scopeId3}>`);
                        if (!collapsed.value) {
                          _push4(`<span class="logo-text" data-v-a7cf49d1${_scopeId3}>众维OA工作台</span>`);
                        } else {
                          _push4(`<span class="logo-icon" data-v-a7cf49d1${_scopeId3}>OA</span>`);
                        }
                        _push4(`</div>`);
                        _push4(ssrRenderComponent(_component_a_menu, {
                          selectedKeys: selectedKeys.value,
                          "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                          theme: "dark",
                          mode: "inline",
                          onClick: onMenuClick
                        }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`<!--[-->`);
                              ssrRenderList(menuItems.value, (item) => {
                                _push5(`<!--[-->`);
                                if (item.children?.length) {
                                  _push5(ssrRenderComponent(_component_a_sub_menu, {
                                    key: item.key
                                  }, {
                                    title: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`${ssrInterpolate(item.label)}`);
                                      } else {
                                        return [
                                          createTextVNode(toDisplayString(item.label), 1)
                                        ];
                                      }
                                    }),
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`<!--[-->`);
                                        ssrRenderList(item.children, (child) => {
                                          _push6(ssrRenderComponent(_component_a_menu_item, {
                                            key: child.path
                                          }, {
                                            default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                              if (_push7) {
                                                _push7(`${ssrInterpolate(child.label)}`);
                                              } else {
                                                return [
                                                  createTextVNode(toDisplayString(child.label), 1)
                                                ];
                                              }
                                            }),
                                            _: 2
                                          }, _parent6, _scopeId5));
                                        });
                                        _push6(`<!--]-->`);
                                      } else {
                                        return [
                                          (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                            return openBlock(), createBlock(_component_a_menu_item, {
                                              key: child.path
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(child.label), 1)
                                              ]),
                                              _: 2
                                            }, 1024);
                                          }), 128))
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                } else {
                                  _push5(ssrRenderComponent(_component_a_menu_item, {
                                    key: item.path
                                  }, {
                                    default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                      if (_push6) {
                                        _push6(`${ssrInterpolate(item.label)}`);
                                      } else {
                                        return [
                                          createTextVNode(toDisplayString(item.label), 1)
                                        ];
                                      }
                                    }),
                                    _: 2
                                  }, _parent5, _scopeId4));
                                }
                                _push5(`<!--]-->`);
                              });
                              _push5(`<!--]-->`);
                            } else {
                              return [
                                (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                                  return openBlock(), createBlock(Fragment, {
                                    key: item.key
                                  }, [
                                    item.children?.length ? (openBlock(), createBlock(_component_a_sub_menu, {
                                      key: item.key
                                    }, {
                                      title: withCtx(() => [
                                        createTextVNode(toDisplayString(item.label), 1)
                                      ]),
                                      default: withCtx(() => [
                                        (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                          return openBlock(), createBlock(_component_a_menu_item, {
                                            key: child.path
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode(toDisplayString(child.label), 1)
                                            ]),
                                            _: 2
                                          }, 1024);
                                        }), 128))
                                      ]),
                                      _: 2
                                    }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                      key: item.path
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(item.label), 1)
                                      ]),
                                      _: 2
                                    }, 1024))
                                  ], 64);
                                }), 128))
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode("div", { class: "logo" }, [
                            !collapsed.value ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "logo-text"
                            }, "众维OA工作台")) : (openBlock(), createBlock("span", {
                              key: 1,
                              class: "logo-icon"
                            }, "OA"))
                          ]),
                          createVNode(_component_a_menu, {
                            selectedKeys: selectedKeys.value,
                            "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                            theme: "dark",
                            mode: "inline",
                            onClick: onMenuClick
                          }, {
                            default: withCtx(() => [
                              (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                                return openBlock(), createBlock(Fragment, {
                                  key: item.key
                                }, [
                                  item.children?.length ? (openBlock(), createBlock(_component_a_sub_menu, {
                                    key: item.key
                                  }, {
                                    title: withCtx(() => [
                                      createTextVNode(toDisplayString(item.label), 1)
                                    ]),
                                    default: withCtx(() => [
                                      (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                        return openBlock(), createBlock(_component_a_menu_item, {
                                          key: child.path
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(child.label), 1)
                                          ]),
                                          _: 2
                                        }, 1024);
                                      }), 128))
                                    ]),
                                    _: 2
                                  }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                    key: item.path
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(toDisplayString(item.label), 1)
                                    ]),
                                    _: 2
                                  }, 1024))
                                ], 64);
                              }), 128))
                            ]),
                            _: 1
                          }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_a_layout, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(ssrRenderComponent(_component_a_layout_header, { class: "app-header" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              _push5(`<div class="header-brand" data-v-a7cf49d1${_scopeId4}> 博渊 OA `);
                              if (unref(userStore).userInfo) {
                                _push5(`<span class="header-user-label" data-v-a7cf49d1${_scopeId4}> · ${ssrInterpolate(unref(userStore).userInfo.roleName ?? unref(userStore).userInfo.role)} ${ssrInterpolate(unref(userStore).userInfo.displayName)}</span>`);
                              } else {
                                _push5(`<!---->`);
                              }
                              _push5(`</div><div class="header-actions" data-v-a7cf49d1${_scopeId4}>`);
                              if (unref(userStore).userInfo?.role === "ceo") {
                                _push5(ssrRenderComponent(_component_a_button, {
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                }, {
                                  default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                    if (_push6) {
                                      _push6(` ⚙ 系统 `);
                                    } else {
                                      return [
                                        createTextVNode(" ⚙ 系统 ")
                                      ];
                                    }
                                  }),
                                  _: 1
                                }, _parent5, _scopeId4));
                              } else {
                                _push5(`<!---->`);
                              }
                              _push5(ssrRenderComponent(_component_a_badge, {
                                count: notificationCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(` 🔔 通知 `);
                                        } else {
                                          return [
                                            createTextVNode(" 🔔 通知 ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" 🔔 通知 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(ssrRenderComponent(_component_a_badge, {
                                count: todoCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(` 📋 待办 `);
                                        } else {
                                          return [
                                            createTextVNode(" 📋 待办 ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" 📋 待办 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(ssrRenderComponent(_component_a_dropdown, { placement: "bottomRight" }, {
                                overlay: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`个人信息`);
                                              } else {
                                                return [
                                                  createTextVNode("个人信息")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`修改密码`);
                                              } else {
                                                return [
                                                  createTextVNode("修改密码")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_divider, null, null, _parent7, _scopeId6));
                                          _push7(ssrRenderComponent(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`退出登录`);
                                              } else {
                                                return [
                                                  createTextVNode("退出登录")
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                        } else {
                                          return [
                                            createVNode(_component_a_menu_item, { key: "profile" }, {
                                              default: withCtx(() => [
                                                createTextVNode("个人信息")
                                              ]),
                                              _: 1
                                            }),
                                            createVNode(_component_a_menu_item, { key: "password" }, {
                                              default: withCtx(() => [
                                                createTextVNode("修改密码")
                                              ]),
                                              _: 1
                                            }),
                                            createVNode(_component_a_menu_divider),
                                            createVNode(_component_a_menu_item, { key: "logout" }, {
                                              default: withCtx(() => [
                                                createTextVNode("退出登录")
                                              ]),
                                              _: 1
                                            })
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx(() => [
                                              createTextVNode("个人信息")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx(() => [
                                              createTextVNode("修改密码")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_divider),
                                          createVNode(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx(() => [
                                              createTextVNode("退出登录")
                                            ]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      })
                                    ];
                                  }
                                }),
                                default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                                  if (_push6) {
                                    _push6(ssrRenderComponent(_component_a_button, {
                                      type: "text",
                                      class: "avatar-btn"
                                    }, {
                                      default: withCtx((_6, _push7, _parent7, _scopeId6) => {
                                        if (_push7) {
                                          _push7(ssrRenderComponent(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx((_7, _push8, _parent8, _scopeId7) => {
                                              if (_push8) {
                                                _push8(`${ssrInterpolate(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?")}`);
                                              } else {
                                                return [
                                                  createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                                ];
                                              }
                                            }),
                                            _: 1
                                          }, _parent7, _scopeId6));
                                          _push7(` ▼ `);
                                        } else {
                                          return [
                                            createVNode(_component_a_avatar, {
                                              size: "small",
                                              style: { backgroundColor: "#003466" }
                                            }, {
                                              default: withCtx(() => [
                                                createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                              ]),
                                              _: 1
                                            }),
                                            createTextVNode(" ▼ ")
                                          ];
                                        }
                                      }),
                                      _: 1
                                    }, _parent6, _scopeId5));
                                  } else {
                                    return [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "avatar-btn"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                            ]),
                                            _: 1
                                          }),
                                          createTextVNode(" ▼ ")
                                        ]),
                                        _: 1
                                      })
                                    ];
                                  }
                                }),
                                _: 1
                              }, _parent5, _scopeId4));
                              _push5(`</div>`);
                            } else {
                              return [
                                createVNode("div", { class: "header-brand" }, [
                                  createTextVNode(" 博渊 OA "),
                                  unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "header-user-label"
                                  }, " · " + toDisplayString(unref(userStore).userInfo.roleName ?? unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                                ]),
                                createVNode("div", { class: "header-actions" }, [
                                  unref(userStore).userInfo?.role === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                    key: 0,
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" ⚙ 系统 ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])) : createCommentVNode("", true),
                                  createVNode(_component_a_badge, {
                                    count: notificationCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" 🔔 通知 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_badge, {
                                    count: todoCount.value,
                                    "overflow-count": 99,
                                    class: "action-badge"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "action-btn",
                                        onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(" 📋 待办 ")
                                        ]),
                                        _: 1
                                      }, 8, ["onClick"])
                                    ]),
                                    _: 1
                                  }, 8, ["count"]),
                                  createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                    overlay: withCtx(() => [
                                      createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_menu_item, { key: "profile" }, {
                                            default: withCtx(() => [
                                              createTextVNode("个人信息")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_item, { key: "password" }, {
                                            default: withCtx(() => [
                                              createTextVNode("修改密码")
                                            ]),
                                            _: 1
                                          }),
                                          createVNode(_component_a_menu_divider),
                                          createVNode(_component_a_menu_item, { key: "logout" }, {
                                            default: withCtx(() => [
                                              createTextVNode("退出登录")
                                            ]),
                                            _: 1
                                          })
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    default: withCtx(() => [
                                      createVNode(_component_a_button, {
                                        type: "text",
                                        class: "avatar-btn"
                                      }, {
                                        default: withCtx(() => [
                                          createVNode(_component_a_avatar, {
                                            size: "small",
                                            style: { backgroundColor: "#003466" }
                                          }, {
                                            default: withCtx(() => [
                                              createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                            ]),
                                            _: 1
                                          }),
                                          createTextVNode(" ▼ ")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ])
                              ];
                            }
                          }),
                          _: 1
                        }, _parent4, _scopeId3));
                        _push4(ssrRenderComponent(_component_a_layout_content, { class: "app-content" }, {
                          default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                            if (_push5) {
                              ssrRenderSlot(_ctx.$slots, "default", {}, null, _push5, _parent5, _scopeId4);
                            } else {
                              return [
                                renderSlot(_ctx.$slots, "default", {}, void 0, true)
                              ];
                            }
                          }),
                          _: 3
                        }, _parent4, _scopeId3));
                      } else {
                        return [
                          createVNode(_component_a_layout_header, { class: "app-header" }, {
                            default: withCtx(() => [
                              createVNode("div", { class: "header-brand" }, [
                                createTextVNode(" 博渊 OA "),
                                unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: "header-user-label"
                                }, " · " + toDisplayString(unref(userStore).userInfo.roleName ?? unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                              ]),
                              createVNode("div", { class: "header-actions" }, [
                                unref(userStore).userInfo?.role === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                  key: 0,
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" ⚙ 系统 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])) : createCommentVNode("", true),
                                createVNode(_component_a_badge, {
                                  count: notificationCount.value,
                                  "overflow-count": 99,
                                  class: "action-badge"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(" 🔔 通知 ")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])
                                  ]),
                                  _: 1
                                }, 8, ["count"]),
                                createVNode(_component_a_badge, {
                                  count: todoCount.value,
                                  "overflow-count": 99,
                                  class: "action-badge"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "action-btn",
                                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(" 📋 待办 ")
                                      ]),
                                      _: 1
                                    }, 8, ["onClick"])
                                  ]),
                                  _: 1
                                }, 8, ["count"]),
                                createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                  overlay: withCtx(() => [
                                    createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_menu_item, { key: "profile" }, {
                                          default: withCtx(() => [
                                            createTextVNode("个人信息")
                                          ]),
                                          _: 1
                                        }),
                                        createVNode(_component_a_menu_item, { key: "password" }, {
                                          default: withCtx(() => [
                                            createTextVNode("修改密码")
                                          ]),
                                          _: 1
                                        }),
                                        createVNode(_component_a_menu_divider),
                                        createVNode(_component_a_menu_item, { key: "logout" }, {
                                          default: withCtx(() => [
                                            createTextVNode("退出登录")
                                          ]),
                                          _: 1
                                        })
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  default: withCtx(() => [
                                    createVNode(_component_a_button, {
                                      type: "text",
                                      class: "avatar-btn"
                                    }, {
                                      default: withCtx(() => [
                                        createVNode(_component_a_avatar, {
                                          size: "small",
                                          style: { backgroundColor: "#003466" }
                                        }, {
                                          default: withCtx(() => [
                                            createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                          ]),
                                          _: 1
                                        }),
                                        createTextVNode(" ▼ ")
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                })
                              ])
                            ]),
                            _: 1
                          }),
                          createVNode(_component_a_layout_content, { class: "app-content" }, {
                            default: withCtx(() => [
                              renderSlot(_ctx.$slots, "default", {}, void 0, true)
                            ]),
                            _: 3
                          })
                        ];
                      }
                    }),
                    _: 3
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_layout_sider, {
                      collapsed: collapsed.value,
                      "onUpdate:collapsed": ($event) => collapsed.value = $event,
                      collapsible: "",
                      width: "220",
                      theme: "dark"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", { class: "logo" }, [
                          !collapsed.value ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "logo-text"
                          }, "众维OA工作台")) : (openBlock(), createBlock("span", {
                            key: 1,
                            class: "logo-icon"
                          }, "OA"))
                        ]),
                        createVNode(_component_a_menu, {
                          selectedKeys: selectedKeys.value,
                          "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                          theme: "dark",
                          mode: "inline",
                          onClick: onMenuClick
                        }, {
                          default: withCtx(() => [
                            (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                              return openBlock(), createBlock(Fragment, {
                                key: item.key
                              }, [
                                item.children?.length ? (openBlock(), createBlock(_component_a_sub_menu, {
                                  key: item.key
                                }, {
                                  title: withCtx(() => [
                                    createTextVNode(toDisplayString(item.label), 1)
                                  ]),
                                  default: withCtx(() => [
                                    (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                      return openBlock(), createBlock(_component_a_menu_item, {
                                        key: child.path
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(child.label), 1)
                                        ]),
                                        _: 2
                                      }, 1024);
                                    }), 128))
                                  ]),
                                  _: 2
                                }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                  key: item.path
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(toDisplayString(item.label), 1)
                                  ]),
                                  _: 2
                                }, 1024))
                              ], 64);
                            }), 128))
                          ]),
                          _: 1
                        }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                      ]),
                      _: 1
                    }, 8, ["collapsed", "onUpdate:collapsed"]),
                    createVNode(_component_a_layout, null, {
                      default: withCtx(() => [
                        createVNode(_component_a_layout_header, { class: "app-header" }, {
                          default: withCtx(() => [
                            createVNode("div", { class: "header-brand" }, [
                              createTextVNode(" 博渊 OA "),
                              unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "header-user-label"
                              }, " · " + toDisplayString(unref(userStore).userInfo.roleName ?? unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                            ]),
                            createVNode("div", { class: "header-actions" }, [
                              unref(userStore).userInfo?.role === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                                key: 0,
                                type: "text",
                                class: "action-btn",
                                onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(" ⚙ 系统 ")
                                ]),
                                _: 1
                              }, 8, ["onClick"])) : createCommentVNode("", true),
                              createVNode(_component_a_badge, {
                                count: notificationCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" 🔔 通知 ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])
                                ]),
                                _: 1
                              }, 8, ["count"]),
                              createVNode(_component_a_badge, {
                                count: todoCount.value,
                                "overflow-count": 99,
                                class: "action-badge"
                              }, {
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "action-btn",
                                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                  }, {
                                    default: withCtx(() => [
                                      createTextVNode(" 📋 待办 ")
                                    ]),
                                    _: 1
                                  }, 8, ["onClick"])
                                ]),
                                _: 1
                              }, 8, ["count"]),
                              createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                                overlay: withCtx(() => [
                                  createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_menu_item, { key: "profile" }, {
                                        default: withCtx(() => [
                                          createTextVNode("个人信息")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_a_menu_item, { key: "password" }, {
                                        default: withCtx(() => [
                                          createTextVNode("修改密码")
                                        ]),
                                        _: 1
                                      }),
                                      createVNode(_component_a_menu_divider),
                                      createVNode(_component_a_menu_item, { key: "logout" }, {
                                        default: withCtx(() => [
                                          createTextVNode("退出登录")
                                        ]),
                                        _: 1
                                      })
                                    ]),
                                    _: 1
                                  })
                                ]),
                                default: withCtx(() => [
                                  createVNode(_component_a_button, {
                                    type: "text",
                                    class: "avatar-btn"
                                  }, {
                                    default: withCtx(() => [
                                      createVNode(_component_a_avatar, {
                                        size: "small",
                                        style: { backgroundColor: "#003466" }
                                      }, {
                                        default: withCtx(() => [
                                          createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                        ]),
                                        _: 1
                                      }),
                                      createTextVNode(" ▼ ")
                                    ]),
                                    _: 1
                                  })
                                ]),
                                _: 1
                              })
                            ])
                          ]),
                          _: 1
                        }),
                        createVNode(_component_a_layout_content, { class: "app-content" }, {
                          default: withCtx(() => [
                            renderSlot(_ctx.$slots, "default", {}, void 0, true)
                          ]),
                          _: 3
                        })
                      ]),
                      _: 3
                    })
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_layout, { class: "app-shell" }, {
                default: withCtx(() => [
                  createVNode(_component_a_layout_sider, {
                    collapsed: collapsed.value,
                    "onUpdate:collapsed": ($event) => collapsed.value = $event,
                    collapsible: "",
                    width: "220",
                    theme: "dark"
                  }, {
                    default: withCtx(() => [
                      createVNode("div", { class: "logo" }, [
                        !collapsed.value ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "logo-text"
                        }, "众维OA工作台")) : (openBlock(), createBlock("span", {
                          key: 1,
                          class: "logo-icon"
                        }, "OA"))
                      ]),
                      createVNode(_component_a_menu, {
                        selectedKeys: selectedKeys.value,
                        "onUpdate:selectedKeys": ($event) => selectedKeys.value = $event,
                        theme: "dark",
                        mode: "inline",
                        onClick: onMenuClick
                      }, {
                        default: withCtx(() => [
                          (openBlock(true), createBlock(Fragment, null, renderList(menuItems.value, (item) => {
                            return openBlock(), createBlock(Fragment, {
                              key: item.key
                            }, [
                              item.children?.length ? (openBlock(), createBlock(_component_a_sub_menu, {
                                key: item.key
                              }, {
                                title: withCtx(() => [
                                  createTextVNode(toDisplayString(item.label), 1)
                                ]),
                                default: withCtx(() => [
                                  (openBlock(true), createBlock(Fragment, null, renderList(item.children, (child) => {
                                    return openBlock(), createBlock(_component_a_menu_item, {
                                      key: child.path
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(child.label), 1)
                                      ]),
                                      _: 2
                                    }, 1024);
                                  }), 128))
                                ]),
                                _: 2
                              }, 1024)) : (openBlock(), createBlock(_component_a_menu_item, {
                                key: item.path
                              }, {
                                default: withCtx(() => [
                                  createTextVNode(toDisplayString(item.label), 1)
                                ]),
                                _: 2
                              }, 1024))
                            ], 64);
                          }), 128))
                        ]),
                        _: 1
                      }, 8, ["selectedKeys", "onUpdate:selectedKeys"])
                    ]),
                    _: 1
                  }, 8, ["collapsed", "onUpdate:collapsed"]),
                  createVNode(_component_a_layout, null, {
                    default: withCtx(() => [
                      createVNode(_component_a_layout_header, { class: "app-header" }, {
                        default: withCtx(() => [
                          createVNode("div", { class: "header-brand" }, [
                            createTextVNode(" 博渊 OA "),
                            unref(userStore).userInfo ? (openBlock(), createBlock("span", {
                              key: 0,
                              class: "header-user-label"
                            }, " · " + toDisplayString(unref(userStore).userInfo.roleName ?? unref(userStore).userInfo.role) + " " + toDisplayString(unref(userStore).userInfo.displayName), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("div", { class: "header-actions" }, [
                            unref(userStore).userInfo?.role === "ceo" ? (openBlock(), createBlock(_component_a_button, {
                              key: 0,
                              type: "text",
                              class: "action-btn",
                              onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/config")
                            }, {
                              default: withCtx(() => [
                                createTextVNode(" ⚙ 系统 ")
                              ]),
                              _: 1
                            }, 8, ["onClick"])) : createCommentVNode("", true),
                            createVNode(_component_a_badge, {
                              count: notificationCount.value,
                              "overflow-count": 99,
                              class: "action-badge"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/notifications")
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" 🔔 通知 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])
                              ]),
                              _: 1
                            }, 8, ["count"]),
                            createVNode(_component_a_badge, {
                              count: todoCount.value,
                              "overflow-count": 99,
                              class: "action-badge"
                            }, {
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "text",
                                  class: "action-btn",
                                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                                }, {
                                  default: withCtx(() => [
                                    createTextVNode(" 📋 待办 ")
                                  ]),
                                  _: 1
                                }, 8, ["onClick"])
                              ]),
                              _: 1
                            }, 8, ["count"]),
                            createVNode(_component_a_dropdown, { placement: "bottomRight" }, {
                              overlay: withCtx(() => [
                                createVNode(_component_a_menu, { onClick: onAvatarMenuClick }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_menu_item, { key: "profile" }, {
                                      default: withCtx(() => [
                                        createTextVNode("个人信息")
                                      ]),
                                      _: 1
                                    }),
                                    createVNode(_component_a_menu_item, { key: "password" }, {
                                      default: withCtx(() => [
                                        createTextVNode("修改密码")
                                      ]),
                                      _: 1
                                    }),
                                    createVNode(_component_a_menu_divider),
                                    createVNode(_component_a_menu_item, { key: "logout" }, {
                                      default: withCtx(() => [
                                        createTextVNode("退出登录")
                                      ]),
                                      _: 1
                                    })
                                  ]),
                                  _: 1
                                })
                              ]),
                              default: withCtx(() => [
                                createVNode(_component_a_button, {
                                  type: "text",
                                  class: "avatar-btn"
                                }, {
                                  default: withCtx(() => [
                                    createVNode(_component_a_avatar, {
                                      size: "small",
                                      style: { backgroundColor: "#003466" }
                                    }, {
                                      default: withCtx(() => [
                                        createTextVNode(toDisplayString(unref(userStore).userInfo?.displayName?.slice(0, 1) ?? "?"), 1)
                                      ]),
                                      _: 1
                                    }),
                                    createTextVNode(" ▼ ")
                                  ]),
                                  _: 1
                                })
                              ]),
                              _: 1
                            })
                          ])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_a_layout_content, { class: "app-content" }, {
                        default: withCtx(() => [
                          renderSlot(_ctx.$slots, "default", {}, void 0, true)
                        ]),
                        _: 3
                      })
                    ]),
                    _: 3
                  })
                ]),
                _: 3
              })
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a7cf49d1"]]);
export {
  _default as default
};
//# sourceMappingURL=default-B_t7vXlR.js.map
