import { n as navigateTo, _ as _export_sfc } from "../server.mjs";
import { defineComponent, ref, mergeProps, withCtx, createVNode, createTextVNode, unref, useSSRContext } from "vue";
import { Steps, Step, Form, FormItem, Input, Button, InputPassword, Result } from "ant-design-vue/es/index.js";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle } from "vue/server-renderer";
import { message } from "ant-design-vue";
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
import "D:/Taozhuowei/Project/BOYUAN OA/node_modules/klona/dist/index.mjs";
const API_BASE = "http://localhost:8080/api";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "forgot_password",
  __ssrInlineRender: true,
  setup(__props) {
    const step = ref(0);
    const loading = ref(false);
    const phone = ref("");
    const code = ref("");
    const resetToken = ref("");
    const newPassword = ref("");
    const confirmPassword = ref("");
    async function doSendCode() {
      if (!phone.value.trim()) {
        message.warning("请输入手机号");
        return;
      }
      loading.value = true;
      try {
        await $fetch(`${API_BASE}/auth/send-reset-code`, {
          method: "POST",
          body: { phone: phone.value.trim() }
        });
        message.success("验证码已发送");
        step.value = 1;
      } catch {
        message.error("发送失败，请检查手机号");
      } finally {
        loading.value = false;
      }
    }
    async function doVerifyCode() {
      if (!code.value.trim()) {
        message.warning("请输入验证码");
        return;
      }
      loading.value = true;
      try {
        const res = await $fetch(`${API_BASE}/auth/verify-reset-code`, {
          method: "POST",
          body: { phone: phone.value.trim(), code: code.value.trim() }
        });
        resetToken.value = res.resetToken;
        message.success("验证通过");
        step.value = 2;
      } catch {
        message.error("验证码不正确或已过期");
      } finally {
        loading.value = false;
      }
    }
    async function doResetPassword() {
      if (!newPassword.value) {
        message.warning("请输入新密码");
        return;
      }
      if (newPassword.value.length < 6) {
        message.warning("密码至少 6 位");
        return;
      }
      if (newPassword.value !== confirmPassword.value) {
        message.warning("两次密码不一致");
        return;
      }
      loading.value = true;
      try {
        await $fetch(`${API_BASE}/auth/reset-password`, {
          method: "POST",
          body: { resetToken: resetToken.value, newPassword: newPassword.value }
        });
        step.value = 3;
      } catch {
        message.error("重置失败，请重新操作");
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_a_steps = Steps;
      const _component_a_step = Step;
      const _component_a_form = Form;
      const _component_a_form_item = FormItem;
      const _component_a_input = Input;
      const _component_a_button = Button;
      const _component_a_input_password = InputPassword;
      const _component_a_result = Result;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "forgot-page" }, _attrs))} data-v-60cb6232><div class="forgot-card" data-v-60cb6232><h2 class="forgot-title" data-v-60cb6232>重置密码</h2>`);
      _push(ssrRenderComponent(_component_a_steps, {
        current: step.value,
        size: "small",
        style: { "margin-bottom": "32px" }
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_a_step, { title: "手机号" }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_step, { title: "验证码" }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_step, { title: "新密码" }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_a_step, { title: "完成" }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_a_step, { title: "手机号" }),
              createVNode(_component_a_step, { title: "验证码" }),
              createVNode(_component_a_step, { title: "新密码" }),
              createVNode(_component_a_step, { title: "完成" })
            ];
          }
        }),
        _: 1
      }, _parent));
      if (step.value === 0) {
        _push(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_a_form_item, { label: "注册手机号" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_input, {
                      value: phone.value,
                      "onUpdate:value": ($event) => phone.value = $event,
                      placeholder: "请输入账号绑定的手机号",
                      size: "large",
                      maxlength: 11
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_input, {
                        value: phone.value,
                        "onUpdate:value": ($event) => phone.value = $event,
                        placeholder: "请输入账号绑定的手机号",
                        size: "large",
                        maxlength: 11
                      }, null, 8, ["value", "onUpdate:value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_form_item, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doSendCode
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` 发送验证码 `);
                        } else {
                          return [
                            createTextVNode(" 发送验证码 ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_button, {
                        type: "primary",
                        block: "",
                        size: "large",
                        loading: loading.value,
                        onClick: doSendCode
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" 发送验证码 ")
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
                createVNode(_component_a_form_item, { label: "注册手机号" }, {
                  default: withCtx(() => [
                    createVNode(_component_a_input, {
                      value: phone.value,
                      "onUpdate:value": ($event) => phone.value = $event,
                      placeholder: "请输入账号绑定的手机号",
                      size: "large",
                      maxlength: 11
                    }, null, 8, ["value", "onUpdate:value"])
                  ]),
                  _: 1
                }),
                createVNode(_component_a_form_item, null, {
                  default: withCtx(() => [
                    createVNode(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doSendCode
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" 发送验证码 ")
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
      } else {
        _push(`<!---->`);
      }
      if (step.value === 1) {
        _push(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_a_form_item, {
                label: `已向 ${phone.value} 发送验证码`
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_input, {
                      value: code.value,
                      "onUpdate:value": ($event) => code.value = $event,
                      placeholder: "请输入 6 位验证码",
                      size: "large",
                      maxlength: 6
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_input, {
                        value: code.value,
                        "onUpdate:value": ($event) => code.value = $event,
                        placeholder: "请输入 6 位验证码",
                        size: "large",
                        maxlength: 6
                      }, null, 8, ["value", "onUpdate:value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_form_item, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doVerifyCode
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` 验证 `);
                        } else {
                          return [
                            createTextVNode(" 验证 ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_button, {
                        type: "primary",
                        block: "",
                        size: "large",
                        loading: loading.value,
                        onClick: doVerifyCode
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" 验证 ")
                        ]),
                        _: 1
                      }, 8, ["loading"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_form_item, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "link",
                      block: "",
                      onClick: ($event) => step.value = 0
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(`重新输入手机号`);
                        } else {
                          return [
                            createTextVNode("重新输入手机号")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_button, {
                        type: "link",
                        block: "",
                        onClick: ($event) => step.value = 0
                      }, {
                        default: withCtx(() => [
                          createTextVNode("重新输入手机号")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_a_form_item, {
                  label: `已向 ${phone.value} 发送验证码`
                }, {
                  default: withCtx(() => [
                    createVNode(_component_a_input, {
                      value: code.value,
                      "onUpdate:value": ($event) => code.value = $event,
                      placeholder: "请输入 6 位验证码",
                      size: "large",
                      maxlength: 6
                    }, null, 8, ["value", "onUpdate:value"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                createVNode(_component_a_form_item, null, {
                  default: withCtx(() => [
                    createVNode(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doVerifyCode
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" 验证 ")
                      ]),
                      _: 1
                    }, 8, ["loading"])
                  ]),
                  _: 1
                }),
                createVNode(_component_a_form_item, null, {
                  default: withCtx(() => [
                    createVNode(_component_a_button, {
                      type: "link",
                      block: "",
                      onClick: ($event) => step.value = 0
                    }, {
                      default: withCtx(() => [
                        createTextVNode("重新输入手机号")
                      ]),
                      _: 1
                    }, 8, ["onClick"])
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (step.value === 2) {
        _push(ssrRenderComponent(_component_a_form, { layout: "vertical" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_a_form_item, { label: "新密码" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_input_password, {
                      value: newPassword.value,
                      "onUpdate:value": ($event) => newPassword.value = $event,
                      placeholder: "请输入新密码（至少6位）",
                      size: "large"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_input_password, {
                        value: newPassword.value,
                        "onUpdate:value": ($event) => newPassword.value = $event,
                        placeholder: "请输入新密码（至少6位）",
                        size: "large"
                      }, null, 8, ["value", "onUpdate:value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_form_item, { label: "确认新密码" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_input_password, {
                      value: confirmPassword.value,
                      "onUpdate:value": ($event) => confirmPassword.value = $event,
                      placeholder: "再次输入新密码",
                      size: "large"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_input_password, {
                        value: confirmPassword.value,
                        "onUpdate:value": ($event) => confirmPassword.value = $event,
                        placeholder: "再次输入新密码",
                        size: "large"
                      }, null, 8, ["value", "onUpdate:value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_a_form_item, null, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doResetPassword
                    }, {
                      default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(` 重置密码 `);
                        } else {
                          return [
                            createTextVNode(" 重置密码 ")
                          ];
                        }
                      }),
                      _: 1
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_a_button, {
                        type: "primary",
                        block: "",
                        size: "large",
                        loading: loading.value,
                        onClick: doResetPassword
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" 重置密码 ")
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
                createVNode(_component_a_form_item, { label: "新密码" }, {
                  default: withCtx(() => [
                    createVNode(_component_a_input_password, {
                      value: newPassword.value,
                      "onUpdate:value": ($event) => newPassword.value = $event,
                      placeholder: "请输入新密码（至少6位）",
                      size: "large"
                    }, null, 8, ["value", "onUpdate:value"])
                  ]),
                  _: 1
                }),
                createVNode(_component_a_form_item, { label: "确认新密码" }, {
                  default: withCtx(() => [
                    createVNode(_component_a_input_password, {
                      value: confirmPassword.value,
                      "onUpdate:value": ($event) => confirmPassword.value = $event,
                      placeholder: "再次输入新密码",
                      size: "large"
                    }, null, 8, ["value", "onUpdate:value"])
                  ]),
                  _: 1
                }),
                createVNode(_component_a_form_item, null, {
                  default: withCtx(() => [
                    createVNode(_component_a_button, {
                      type: "primary",
                      block: "",
                      size: "large",
                      loading: loading.value,
                      onClick: doResetPassword
                    }, {
                      default: withCtx(() => [
                        createTextVNode(" 重置密码 ")
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
      } else {
        _push(`<!---->`);
      }
      if (step.value === 3) {
        _push(`<div style="${ssrRenderStyle({ "text-align": "center", "padding": "24px 0" })}" data-v-60cb6232>`);
        _push(ssrRenderComponent(_component_a_result, {
          status: "success",
          title: "密码重置成功",
          "sub-title": "请使用新密码登录"
        }, {
          extra: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_a_button, {
                type: "primary",
                onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/login")
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`立即登录`);
                  } else {
                    return [
                      createTextVNode("立即登录")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_a_button, {
                  type: "primary",
                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/login")
                }, {
                  default: withCtx(() => [
                    createTextVNode("立即登录")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (step.value < 3) {
        _push(`<div style="${ssrRenderStyle({ "text-align": "center", "margin-top": "8px" })}" data-v-60cb6232>`);
        _push(ssrRenderComponent(_component_a_button, {
          type: "link",
          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/login")
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`返回登录`);
            } else {
              return [
                createTextVNode("返回登录")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/forgot_password.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const forgot_password = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-60cb6232"]]);
export {
  forgot_password as default
};
//# sourceMappingURL=forgot_password-B5k66WxW.js.map
