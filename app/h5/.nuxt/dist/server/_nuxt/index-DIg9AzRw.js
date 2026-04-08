import { n as navigateTo, _ as _export_sfc } from "../server.mjs";
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, toDisplayString, unref, openBlock, createBlock, Fragment, createCommentVNode, createVNode, useSSRContext } from "vue";
import { Card, Input, Button, Table, Tag } from "ant-design-vue/es/index.js";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const employees = ref([]);
    const keyword = ref("");
    const page = ref(0);
    const pageSize = ref(20);
    const totalElements = ref(0);
    const columns = [
      { title: "姓名", dataIndex: "name", key: "name" },
      { title: "部门", dataIndex: "departmentName", key: "departmentName" },
      { title: "角色", dataIndex: "roleName", key: "roleName" },
      { title: "入职日期", key: "entryDate" },
      { title: "状态", key: "accountStatus", width: 80 },
      { title: "操作", key: "action", width: 80 }
    ];
    async function loadEmployees() {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: String(page.value),
          size: String(pageSize.value)
        });
        if (keyword.value.trim()) {
          params.set("keyword", keyword.value.trim());
        }
        const data = await request({
          url: `/employees?${params}`
        });
        employees.value = data.content ?? [];
        totalElements.value = data.totalElements ?? 0;
      } catch {
        employees.value = [];
        totalElements.value = 0;
      } finally {
        loading.value = false;
      }
    }
    function onSearch() {
      page.value = 0;
      loadEmployees();
    }
    function onPageChange(p) {
      page.value = p - 1;
      loadEmployees();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_input = Input;
      const _component_a_button = Button;
      const _component_a_table = Table;
      const _component_a_tag = Tag;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "employees-page" }, _attrs))} data-v-f7a7b43c><h2 class="page-title" data-v-f7a7b43c>员工管理</h2>`);
      _push(ssrRenderComponent(_component_a_card, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="search-bar" data-v-f7a7b43c${_scopeId}>`);
            _push2(ssrRenderComponent(_component_a_input, {
              value: keyword.value,
              "onUpdate:value": ($event) => keyword.value = $event,
              placeholder: "搜索姓名/部门/岗位",
              style: { "width": "280px" },
              "allow-clear": "",
              onPressEnter: onSearch
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_button, {
              type: "primary",
              onClick: onSearch
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`搜索`);
                } else {
                  return [
                    createTextVNode("搜索")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
            _push2(ssrRenderComponent(_component_a_table, {
              columns,
              "data-source": employees.value,
              loading: loading.value,
              pagination: {
                current: page.value + 1,
                pageSize: pageSize.value,
                total: totalElements.value,
                showTotal: (t) => `共 ${t} 人`,
                onChange: onPageChange
              },
              "row-key": "id",
              size: "small"
            }, {
              bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (column.key === "entryDate") {
                    _push3(`<!--[-->${ssrInterpolate(record.entryDate ?? "—")}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "accountStatus") {
                    _push3(ssrRenderComponent(_component_a_tag, {
                      color: record.accountStatus === "ACTIVE" ? "success" : "default"
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(record.accountStatus === "ACTIVE" ? "在职" : "停用")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "在职" : "停用"), 1)
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
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/employees/${record.id}`)
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`详情`);
                        } else {
                          return [
                            createTextVNode("详情")
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
                    column.key === "entryDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createTextVNode(toDisplayString(record.entryDate ?? "—"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "accountStatus" ? (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: record.accountStatus === "ACTIVE" ? "success" : "default"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "在职" : "停用"), 1)
                      ]),
                      _: 2
                    }, 1032, ["color"])) : createCommentVNode("", true),
                    column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                      key: 2,
                      type: "link",
                      size: "small",
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/employees/${record.id}`)
                    }, {
                      default: withCtx(() => [
                        createTextVNode("详情")
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
              createVNode("div", { class: "search-bar" }, [
                createVNode(_component_a_input, {
                  value: keyword.value,
                  "onUpdate:value": ($event) => keyword.value = $event,
                  placeholder: "搜索姓名/部门/岗位",
                  style: { "width": "280px" },
                  "allow-clear": "",
                  onPressEnter: onSearch
                }, null, 8, ["value", "onUpdate:value"]),
                createVNode(_component_a_button, {
                  type: "primary",
                  onClick: onSearch
                }, {
                  default: withCtx(() => [
                    createTextVNode("搜索")
                  ]),
                  _: 1
                })
              ]),
              createVNode(_component_a_table, {
                columns,
                "data-source": employees.value,
                loading: loading.value,
                pagination: {
                  current: page.value + 1,
                  pageSize: pageSize.value,
                  total: totalElements.value,
                  showTotal: (t) => `共 ${t} 人`,
                  onChange: onPageChange
                },
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "entryDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(record.entryDate ?? "—"), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "accountStatus" ? (openBlock(), createBlock(_component_a_tag, {
                    key: 1,
                    color: record.accountStatus === "ACTIVE" ? "success" : "default"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "在职" : "停用"), 1)
                    ]),
                    _: 2
                  }, 1032, ["color"])) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                    key: 2,
                    type: "link",
                    size: "small",
                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(`/employees/${record.id}`)
                  }, {
                    default: withCtx(() => [
                      createTextVNode("详情")
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
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/employees/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f7a7b43c"]]);
export {
  index as default
};
//# sourceMappingURL=index-DIg9AzRw.js.map
