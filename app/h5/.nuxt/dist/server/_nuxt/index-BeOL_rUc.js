import { n as navigateTo, _ as _export_sfc } from "../server.mjs";
import { defineComponent, ref, mergeProps, withCtx, createVNode, unref, createTextVNode, openBlock, createBlock, Fragment, toDisplayString, createCommentVNode, useSSRContext } from "vue";
import { Card, Statistic, Table, Button } from "ant-design-vue/es/index.js";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/klona/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/hookable/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/unctx/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/h3/dist/index.mjs";
import "vue-router";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/defu/dist/defu.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ufo/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/cookie-es/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/destr/dist/index.mjs";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/ohash/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const todoList = ref([]);
    const todoColumns = [
      { title: "类型", dataIndex: "formTypeName", key: "formTypeName" },
      { title: "申请人", dataIndex: "submitter", key: "submitter" },
      { title: "提交时间", key: "submitTime" },
      { title: "操作", key: "action", width: 80 }
    ];
    function formatTime(t) {
      if (!t) return "—";
      return t.replace("T", " ").slice(0, 16);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_card = Card;
      const _component_a_statistic = Statistic;
      const _component_a_table = Table;
      const _component_a_button = Button;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "workbench-page" }, _attrs))} data-v-c29db3b9><h2 class="page-title" data-v-c29db3b9>工作台</h2><div class="stat-cards" data-v-c29db3b9>`);
      _push(ssrRenderComponent(_component_a_card, { class: "stat-card" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_statistic, {
              title: "待审批事项",
              value: todoList.value.length,
              suffix: "项"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_statistic, {
                title: "待审批事项",
                value: todoList.value.length,
                suffix: "项"
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
              title: "通知",
              value: 0,
              suffix: "条未读"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_statistic, {
                title: "通知",
                value: 0,
                suffix: "条未读"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_a_card, {
        title: "待办事项",
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
                          _push4(`查看`);
                        } else {
                          return [
                            createTextVNode("查看")
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
                        createTextVNode("查看")
                      ]),
                      _: 1
                    }, 8, ["onClick"])) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (!loading.value && todoList.value.length === 0) {
              _push2(`<div class="empty-tip" data-v-c29db3b9${_scopeId}> 暂无待办事项 </div>`);
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
                      createTextVNode("查看")
                    ]),
                    _: 1
                  }, 8, ["onClick"])) : createCommentVNode("", true)
                ]),
                _: 1
              }, 8, ["data-source", "loading"]),
              !loading.value && todoList.value.length === 0 ? (openBlock(), createBlock("div", {
                key: 0,
                class: "empty-tip"
              }, " 暂无待办事项 ")) : createCommentVNode("", true)
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
export {
  index as default
};
//# sourceMappingURL=index-BeOL_rUc.js.map
