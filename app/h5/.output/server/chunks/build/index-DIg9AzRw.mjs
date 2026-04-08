import { _ as _export_sfc, n as navigateTo } from './server.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, toDisplayString, unref, openBlock, createBlock, Fragment, createCommentVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { r as request } from './http-Dv09dGXg.mjs';
import { C as Card } from '../_/index.mjs';
import { I as Input } from '../_/index5.mjs';
import { B as Button } from '../_/collapseMotion.mjs';
import { T as Table } from '../_/index3.mjs';
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
import 'resize-observer-polyfill';
import 'dom-align';
import 'lodash-es/isEqual';
import '@ant-design/colors';
import 'stylis';
import 'vue-types';
import 'lodash-es';
import 'lodash-es/fromPairs';
import '../_/index6.mjs';
import '../_/CheckOutlined.mjs';
import '../_/useBreakpoint.mjs';

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
      { title: "\u59D3\u540D", dataIndex: "name", key: "name" },
      { title: "\u90E8\u95E8", dataIndex: "departmentName", key: "departmentName" },
      { title: "\u89D2\u8272", dataIndex: "roleName", key: "roleName" },
      { title: "\u5165\u804C\u65E5\u671F", key: "entryDate" },
      { title: "\u72B6\u6001", key: "accountStatus", width: 80 },
      { title: "\u64CD\u4F5C", key: "action", width: 80 }
    ];
    async function loadEmployees() {
      var _a, _b;
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
        employees.value = (_a = data.content) != null ? _a : [];
        totalElements.value = (_b = data.totalElements) != null ? _b : 0;
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "employees-page" }, _attrs))} data-v-f7a7b43c><h2 class="page-title" data-v-f7a7b43c>\u5458\u5DE5\u7BA1\u7406</h2>`);
      _push(ssrRenderComponent(_component_a_card, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="search-bar" data-v-f7a7b43c${_scopeId}>`);
            _push2(ssrRenderComponent(_component_a_input, {
              value: keyword.value,
              "onUpdate:value": ($event) => keyword.value = $event,
              placeholder: "\u641C\u7D22\u59D3\u540D/\u90E8\u95E8/\u5C97\u4F4D",
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
                  _push3(`\u641C\u7D22`);
                } else {
                  return [
                    createTextVNode("\u641C\u7D22")
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
                showTotal: (t) => `\u5171 ${t} \u4EBA`,
                onChange: onPageChange
              },
              "row-key": "id",
              size: "small"
            }, {
              bodyCell: withCtx(({ column, record }, _push3, _parent3, _scopeId2) => {
                var _a, _b;
                if (_push3) {
                  if (column.key === "entryDate") {
                    _push3(`<!--[-->${ssrInterpolate((_a = record.entryDate) != null ? _a : "\u2014")}<!--]-->`);
                  } else {
                    _push3(`<!---->`);
                  }
                  if (column.key === "accountStatus") {
                    _push3(ssrRenderComponent(_component_a_tag, {
                      color: record.accountStatus === "ACTIVE" ? "success" : "default"
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`${ssrInterpolate(record.accountStatus === "ACTIVE" ? "\u5728\u804C" : "\u505C\u7528")}`);
                        } else {
                          return [
                            createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "\u5728\u804C" : "\u505C\u7528"), 1)
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
                          _push4(`\u8BE6\u60C5`);
                        } else {
                          return [
                            createTextVNode("\u8BE6\u60C5")
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
                      createTextVNode(toDisplayString((_b = record.entryDate) != null ? _b : "\u2014"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "accountStatus" ? (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: record.accountStatus === "ACTIVE" ? "success" : "default"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "\u5728\u804C" : "\u505C\u7528"), 1)
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
                        createTextVNode("\u8BE6\u60C5")
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
                  placeholder: "\u641C\u7D22\u59D3\u540D/\u90E8\u95E8/\u5C97\u4F4D",
                  style: { "width": "280px" },
                  "allow-clear": "",
                  onPressEnter: onSearch
                }, null, 8, ["value", "onUpdate:value"]),
                createVNode(_component_a_button, {
                  type: "primary",
                  onClick: onSearch
                }, {
                  default: withCtx(() => [
                    createTextVNode("\u641C\u7D22")
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
                  showTotal: (t) => `\u5171 ${t} \u4EBA`,
                  onChange: onPageChange
                },
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => {
                  var _a;
                  return [
                    column.key === "entryDate" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                      createTextVNode(toDisplayString((_a = record.entryDate) != null ? _a : "\u2014"), 1)
                    ], 64)) : createCommentVNode("", true),
                    column.key === "accountStatus" ? (openBlock(), createBlock(_component_a_tag, {
                      key: 1,
                      color: record.accountStatus === "ACTIVE" ? "success" : "default"
                    }, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(record.accountStatus === "ACTIVE" ? "\u5728\u804C" : "\u505C\u7528"), 1)
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
                        createTextVNode("\u8BE6\u60C5")
                      ]),
                      _: 1
                    }, 8, ["onClick"])) : createCommentVNode("", true)
                  ];
                }),
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

export { index as default };
//# sourceMappingURL=index-DIg9AzRw.mjs.map
