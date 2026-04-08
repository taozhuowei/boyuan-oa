import { Form, FormItem, Input, InputPassword, Alert, Button } from "ant-design-vue/es/index.js";
import { defineComponent, ref, reactive, mergeProps, withCtx, createVNode, createTextVNode, openBlock, createBlock, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { r as request } from "./http-Dv09dGXg.js";
import { u as useUserStore } from "./user-CsP34Oqk.js";
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/hookable/dist/index.mjs";
import { n as navigateTo, _ as _export_sfc } from "../server.mjs";
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
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/klona/dist/index.mjs";
const roleNameMap = {
  employee: "员工",
  worker: "劳工",
  finance: "财务",
  project_manager: "项目经理",
  ceo: "首席经营者"
};
const defaultTestAccounts = [
  {
    username: "employee.demo",
    password: "123456",
    displayName: "张晓宁",
    role: "employee",
    roleName: "员工",
    department: "综合管理部",
    employeeType: "OFFICE"
  },
  {
    username: "worker.demo",
    password: "123456",
    displayName: "赵铁柱",
    role: "worker",
    roleName: "劳工",
    department: "施工一部",
    employeeType: "LABOR"
  },
  {
    username: "finance.demo",
    password: "123456",
    displayName: "李静",
    role: "finance",
    roleName: "财务",
    department: "财务管理部",
    employeeType: "OFFICE"
  },
  {
    username: "pm.demo",
    password: "123456",
    displayName: "王建国",
    role: "project_manager",
    roleName: "项目经理",
    department: "项目一部",
    employeeType: "OFFICE"
  },
  {
    username: "ceo.demo",
    password: "123456",
    displayName: "陈明远",
    role: "ceo",
    roleName: "首席经营者",
    department: "运营管理部",
    employeeType: "OFFICE"
  }
];
async function loginWithAccount(payload) {
  const identifier = payload.identifier.trim();
  const password = payload.password.trim();
  if (!identifier || !password) throw new Error("请输入账号和密码");
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
        roleName: response.roleName ?? roleNameMap[response.role] ?? response.role,
        department: response.department ?? "未分配部门",
        employeeType: response.employeeType ?? "OFFICE",
        status: "在线值守",
        userId: response.userId ?? null,
        positionId: null
      }
    };
  } catch {
    const matched = defaultTestAccounts.find(
      (a) => a.username === identifier && a.password === password
    );
    if (!matched) throw new Error("账号或密码错误");
    return {
      token: "local-" + matched.username,
      user: {
        username: matched.username,
        displayName: matched.displayName,
        role: matched.role,
        roleName: matched.roleName,
        department: matched.department,
        employeeType: matched.employeeType,
        status: "在线值守",
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
        errorMsg.value = err instanceof Error ? err.message : "登录失败，请重试";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "login-page" }, _attrs))} data-v-fc1ec368><div class="login-container" data-v-fc1ec368><div class="company-section" data-v-fc1ec368><h1 class="company-name" data-v-fc1ec368>众维建筑工程有限公司</h1><p class="company-subtitle" data-v-fc1ec368>企业协同管理系统</p></div><div class="login-card" data-v-fc1ec368>`);
      _push(ssrRenderComponent(_component_a_form, {
        model: form,
        layout: "vertical",
        onFinish: handleLogin
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_form_item, {
              label: "工号 / 手机号",
              name: "identifier",
              rules: [{ required: true, message: "请输入工号或手机号" }]
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_input, {
                    value: form.identifier,
                    "onUpdate:value": ($event) => form.identifier = $event,
                    placeholder: "请输入工号或手机号",
                    size: "large",
                    disabled: loading.value
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_input, {
                      value: form.identifier,
                      "onUpdate:value": ($event) => form.identifier = $event,
                      placeholder: "请输入工号或手机号",
                      size: "large",
                      disabled: loading.value
                    }, null, 8, ["value", "onUpdate:value", "disabled"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_form_item, {
              label: "登录密码",
              name: "password",
              rules: [{ required: true, message: "请输入密码" }]
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_a_input_password, {
                    value: form.password,
                    "onUpdate:value": ($event) => form.password = $event,
                    placeholder: "请输入密码",
                    size: "large",
                    disabled: loading.value
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_a_input_password, {
                      value: form.password,
                      "onUpdate:value": ($event) => form.password = $event,
                      placeholder: "请输入密码",
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
                        _push4(` 登 录 `);
                      } else {
                        return [
                          createTextVNode(" 登 录 ")
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
                        createTextVNode(" 登 录 ")
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
                label: "工号 / 手机号",
                name: "identifier",
                rules: [{ required: true, message: "请输入工号或手机号" }]
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_input, {
                    value: form.identifier,
                    "onUpdate:value": ($event) => form.identifier = $event,
                    placeholder: "请输入工号或手机号",
                    size: "large",
                    disabled: loading.value
                  }, null, 8, ["value", "onUpdate:value", "disabled"])
                ]),
                _: 1
              }),
              createVNode(_component_a_form_item, {
                label: "登录密码",
                name: "password",
                rules: [{ required: true, message: "请输入密码" }]
              }, {
                default: withCtx(() => [
                  createVNode(_component_a_input_password, {
                    value: form.password,
                    "onUpdate:value": ($event) => form.password = $event,
                    placeholder: "请输入密码",
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
                      createTextVNode(" 登 录 ")
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
      _push(`<div class="forgot-link" data-v-fc1ec368>忘记密码？</div></div></div><span class="powered-by" data-v-fc1ec368>Powered by 博渊</span></div>`);
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
export {
  login as default
};
//# sourceMappingURL=login-CWGkuXvR.js.map
