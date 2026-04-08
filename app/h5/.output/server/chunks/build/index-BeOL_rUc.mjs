import { _ as _export_sfc, n as navigateTo } from './server.mjs';
import { defineComponent, ref, mergeProps, withCtx, createVNode, unref, createTextVNode, openBlock, createBlock, Fragment, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { C as Card } from '../_/index.mjs';
import { S as Statistic } from '../_/index2.mjs';
import { T as Table } from '../_/index3.mjs';
import { B as Button } from '../_/collapseMotion.mjs';
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
import '../_/index5.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const todoList = ref([]);
    const todoColumns = [
      { title: "\u7C7B\u578B", dataIndex: "formTypeName", key: "formTypeName" },
      { title: "\u7533\u8BF7\u4EBA", dataIndex: "submitter", key: "submitter" },
      { title: "\u63D0\u4EA4\u65F6\u95F4", key: "submitTime" },
      { title: "\u64CD\u4F5C", key: "action", width: 80 }
    ];
    function formatTime(t) {
      if (!t) return "\u2014";
      return t.replace("T", " ").slice(0, 16);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_statistic = Statistic;
      const _component_a_table = Table;
      const _component_a_button = Button;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "workbench-page" }, _attrs))} data-v-c29db3b9><h2 class="page-title" data-v-c29db3b9>\u5DE5\u4F5C\u53F0</h2><div class="stat-cards" data-v-c29db3b9>`);
      _push(ssrRenderComponent(_component_a_card, { class: "stat-card" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_statistic, {
              title: "\u5F85\u5BA1\u6279\u4E8B\u9879",
              value: todoList.value.length,
              suffix: "\u9879"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_statistic, {
                title: "\u5F85\u5BA1\u6279\u4E8B\u9879",
                value: todoList.value.length,
                suffix: "\u9879"
              }, null, 8, ["value"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_a_card, { class: "stat-card" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_statistic, {
              title: "\u901A\u77E5",
              value: 0,
              suffix: "\u6761\u672A\u8BFB"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_statistic, {
                title: "\u901A\u77E5",
                value: 0,
                suffix: "\u6761\u672A\u8BFB"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_a_card, {
        title: "\u5F85\u529E\u4E8B\u9879",
        class: "section-card"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_table, {
              columns: todoColumns,
              "data-source": todoList.value,
              loading: loading.value,
              pagination: false,
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
                  if (column.key === "action") {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "link",
                      size: "small",
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                    }, {
                      default: withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`\u67E5\u770B`);
                        } else {
                          return [
                            createTextVNode("\u67E5\u770B")
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
                    column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                      key: 1,
                      type: "link",
                      size: "small",
                      onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                    }, {
                      default: withCtx(() => [
                        createTextVNode("\u67E5\u770B")
                      ]),
                      _: 1
                    }, 8, ["onClick"])) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (!loading.value && todoList.value.length === 0) {
              _push2(`<div class="empty-tip" data-v-c29db3b9${_scopeId}> \u6682\u65E0\u5F85\u529E\u4E8B\u9879 </div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode(_component_a_table, {
                columns: todoColumns,
                "data-source": todoList.value,
                loading: loading.value,
                pagination: false,
                "row-key": "id",
                size: "small"
              }, {
                bodyCell: withCtx(({ column, record }) => [
                  column.key === "submitTime" ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                    createTextVNode(toDisplayString(formatTime(record.submitTime)), 1)
                  ], 64)) : createCommentVNode("", true),
                  column.key === "action" ? (openBlock(), createBlock(_component_a_button, {
                    key: 1,
                    type: "link",
                    size: "small",
                    onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/todo")
                  }, {
                    default: withCtx(() => [
                      createTextVNode("\u67E5\u770B")
                    ]),
                    _: 1
                  }, 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["data-source", "loading"]),
              !loading.value && todoList.value.length === 0 ? (openBlock(), createBlock("div", {
                key: 0,
                class: "empty-tip"
              }, " \u6682\u65E0\u5F85\u529E\u4E8B\u9879 ")) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c29db3b9"]]);

export { index as default };
//# sourceMappingURL=index-BeOL_rUc.mjs.map
