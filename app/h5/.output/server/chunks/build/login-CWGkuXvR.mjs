import { defineComponent, ref, reactive, mergeProps, withCtx, createVNode, createTextVNode, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { r as request } from './http-Dv09dGXg.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';
import { _ as _export_sfc, n as navigateTo } from './server.mjs';
import { F as Form, a as FormItem } from '../_/index7.mjs';
import { I as Input, a as InputPassword } from '../_/index5.mjs';
import { A as Alert } from '../_/index8.mjs';
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
import '../_/ExclamationCircleFilled.mjs';
import 'lodash-es/cloneDeep';
import '../_/useFlexGapSupport.mjs';
import 'async-validator';
import 'lodash-es/find';
import 'lodash-es/isEqual';
import 'compute-scroll-into-view';
import 'lodash-es/intersection';
import 'lodash-es/debounce';
import 'lodash-es/omit';
import 'lodash-es/isPlainObject';
import '../_/InfoCircleFilled.mjs';
import 'resize-observer-polyfill';
import 'dom-align';
import '@ant-design/colors';
import '@ctrl/tinycolor';
import 'stylis';
import 'vue-types';
import 'lodash-es';

const roleNameMap = {
  employee: "\u5458\u5DE5",
  worker: "\u52B3\u5DE5",
  finance: "\u8D22\u52A1",
  project_manager: "\u9879\u76EE\u7ECF\u7406",
  ceo: "\u9996\u5E2D\u7ECF\u8425\u8005"
};
const defaultTestAccounts = [
  {
    username: "employee.demo",
    password: "123456",
    displayName: "\u5F20\u6653\u5B81",
    role: "employee",
    roleName: "\u5458\u5DE5",
    department: "\u7EFC\u5408\u7BA1\u7406\u90E8",
    employeeType: "OFFICE"
  },
  {
    username: "worker.demo",
    password: "123456",
    displayName: "\u8D75\u94C1\u67F1",
    role: "worker",
    roleName: "\u52B3\u5DE5",
    department: "\u65BD\u5DE5\u4E00\u90E8",
    employeeType: "LABOR"
  },
  {
    username: "finance.demo",
    password: "123456",
    displayName: "\u674E\u9759",
    role: "finance",
    roleName: "\u8D22\u52A1",
    department: "\u8D22\u52A1\u7BA1\u7406\u90E8",
    employeeType: "OFFICE"
  },
  {
    username: "pm.demo",
    password: "123456",
    displayName: "\u738B\u5EFA\u56FD",
    role: "project_manager",
    roleName: "\u9879\u76EE\u7ECF\u7406",
    department: "\u9879\u76EE\u4E00\u90E8",
    employeeType: "OFFICE"
  },
  {
    username: "ceo.demo",
    password: "123456",
    displayName: "\u9648\u660E\u8FDC",
    role: "ceo",
    roleName: "\u9996\u5E2D\u7ECF\u8425\u8005",
    department: "\u8FD0\u8425\u7BA1\u7406\u90E8",
    employeeType: "OFFICE"
  }
];
async function loginWithAccount(payload) {
  var _a, _b, _c, _d, _e;
  const identifier = payload.identifier.trim();
  const password = payload.password.trim();
  if (!identifier || !password) throw new Error("\u8BF7\u8F93\u5165\u8D26\u53F7\u548C\u5BC6\u7801");
  try {
    const response = await request({
      url: "/auth/login",
      method: "POST",
      body: { username: identifier, password },
      skipAuthRedirect: true
    });
    return {
      token: response.token,
      user: {
        username: response.username,
        displayName: response.displayName,
        role: response.role,
        roleName: (_b = (_a = response.roleName) != null ? _a : roleNameMap[response.role]) != null ? _b : response.role,
        department: (_c = response.department) != null ? _c : "\u672A\u5206\u914D\u90E8\u95E8",
        employeeType: (_d = response.employeeType) != null ? _d : "OFFICE",
        status: "\u5728\u7EBF\u503C\u5B88",
        userId: (_e = response.userId) != null ? _e : null,
        positionId: null
      }
    };
  } catch {
    const matched = defaultTestAccounts.find(
      (a) => a.username === identifier && a.password === password
    );
    if (!matched) throw new Error("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
    return {
      token: "local-" + matched.username,
      user: {
        username: matched.username,
        displayName: matched.displayName,
        role: matched.role,
        roleName: matched.roleName,
        department: matched.department,
        employeeType: matched.employeeType,
        status: "\u5728\u7EBF\u503C\u5B88",
        userId: null,
        positionId: null
      }
    };
  }
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const loading = ref(false);
    const errorMsg = ref("");
    const form = reactive({ identifier: "", password: "" });
    async function handleLogin() {
      if (loading.value) return;
      loading.value = true;
      errorMsg.value = "";
      try {
        const result = await loginWithAccount({
          identifier: form.identifier,
          password: form.password
        });
        userStore.setSession(result.token, result.user);
        await navigateTo("/");
      } catch (err) {
        errorMsg.value = err instanceof Error ? err.message : "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5";
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_input = Input;
      const _component_a_input_password = InputPassword;
      const _component_a_alert = Alert;
      const _component_a_button = Button;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "login-page" }, _attrs))} data-v-fc1ec368><div class="login-container" data-v-fc1ec368><div class="company-section" data-v-fc1ec368><h1 class="company-name" data-v-fc1ec368>\u4F17\u7EF4\u5EFA\u7B51\u5DE5\u7A0B\u6709\u9650\u516C\u53F8</h1><p class="company-subtitle" data-v-fc1ec368>\u4F01\u4E1A\u534F\u540C\u7BA1\u7406\u7CFB\u7EDF</p></div><div class="login-card" data-v-fc1ec368>`);
      _push(ssrRenderComponent(_component_a_form, {
        model: form,
        layout: "vertical",
        onFinish: handleLogin
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form_item, {
              label: "\u5DE5\u53F7 / \u624B\u673A\u53F7",
              name: "identifier",
              rules: [{ required: true, message: "\u8BF7\u8F93\u5165\u5DE5\u53F7\u6216\u624B\u673A\u53F7" }]
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_input, {
                    value: form.identifier,
                    "onUpdate:value": ($event) => form.identifier = $event,
                    placeholder: "\u8BF7\u8F93\u5165\u5DE5\u53F7\u6216\u624B\u673A\u53F7",
                    size: "large",
                    disabled: loading.value
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_input, {
                      value: form.identifier,
                      "onUpdate:value": ($event) => form.identifier = $event,
                      placeholder: "\u8BF7\u8F93\u5165\u5DE5\u53F7\u6216\u624B\u673A\u53F7",
                      size: "large",
                      disabled: loading.value
                    }, null, 8, ["value", "onUpdate:value", "disabled"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_form_item, {
              label: "\u767B\u5F55\u5BC6\u7801",
              name: "password",
              rules: [{ required: true, message: "\u8BF7\u8F93\u5165\u5BC6\u7801" }]
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_input_password, {
                    value: form.password,
                    "onUpdate:value": ($event) => form.password = $event,
                    placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
                    size: "large",
                    disabled: loading.value
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_input_password, {
                      value: form.password,
                      "onUpdate:value": ($event) => form.password = $event,
                      placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
                      size: "large",
                      disabled: loading.value
                    }, null, 8, ["value", "onUpdate:value", "disabled"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (errorMsg.value) {
              _push2(ssrRenderComponent(_component_a_alert, {
                type: "error",
                message: errorMsg.value,
                "show-icon": "",
                style: { "margin-bottom": "16px" }
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_component_a_form_item, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_button, {
                    type: "primary",
                    "html-type": "submit",
                    size: "large",
                    block: "",
                    loading: loading.value
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(` \u767B \u5F55 `);
                      } else {
                        return [
                          createTextVNode(" \u767B \u5F55 ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_button, {
                      type: "primary",
                      "html-type": "submit",
                      size: "large",
                      block: "",
                      loading: loading.value
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" \u767B \u5F55 ")
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
              createVNode(_component_a_form_item, {
                label: "\u5DE5\u53F7 / \u624B\u673A\u53F7",
                name: "identifier",
                rules: [{ required: true, message: "\u8BF7\u8F93\u5165\u5DE5\u53F7\u6216\u624B\u673A\u53F7" }]
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_input, {
                    value: form.identifier,
                    "onUpdate:value": ($event) => form.identifier = $event,
                    placeholder: "\u8BF7\u8F93\u5165\u5DE5\u53F7\u6216\u624B\u673A\u53F7",
                    size: "large",
                    disabled: loading.value
                  }, null, 8, ["value", "onUpdate:value", "disabled"])
                ]),
                _: 1
              }),
              createVNode(_component_a_form_item, {
                label: "\u767B\u5F55\u5BC6\u7801",
                name: "password",
                rules: [{ required: true, message: "\u8BF7\u8F93\u5165\u5BC6\u7801" }]
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_input_password, {
                    value: form.password,
                    "onUpdate:value": ($event) => form.password = $event,
                    placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
                    size: "large",
                    disabled: loading.value
                  }, null, 8, ["value", "onUpdate:value", "disabled"])
                ]),
                _: 1
              }),
              errorMsg.value ? (openBlock(), createBlock(_component_a_alert, {
                key: 0,
                type: "error",
                message: errorMsg.value,
                "show-icon": "",
                style: { "margin-bottom": "16px" }
              }, null, 8, ["message"])) : createCommentVNode("", true),
              createVNode(_component_a_form_item, null, {
                default: withCtx(() => [
                  createVNode(_component_a_button, {
                    type: "primary",
                    "html-type": "submit",
                    size: "large",
                    block: "",
                    loading: loading.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" \u767B \u5F55 ")
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
      _push(`<div class="forgot-link" data-v-fc1ec368>\u5FD8\u8BB0\u5BC6\u7801\uFF1F</div></div></div><span class="powered-by" data-v-fc1ec368>Powered by \u535A\u6E0A</span></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const login = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-fc1ec368"]]);

export { login as default };
//# sourceMappingURL=login-CWGkuXvR.mjs.map
