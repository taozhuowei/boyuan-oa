import { g as defineStore, d as useCookie } from './server.mjs';
import { computed } from 'vue';

const useUserStore = defineStore("user", () => {
  const tokenCookie = useCookie("oa-token", { maxAge: 604800 });
  const userCookie = useCookie("oa-user", { maxAge: 604800 });
  const token = computed(() => {
    var _a;
    return (_a = tokenCookie.value) != null ? _a : "";
  });
  const userInfo = computed(() => {
    var _a;
    return (_a = userCookie.value) != null ? _a : null;
  });
  const isLoggedIn = computed(() => Boolean(token.value && userInfo.value));
  function setSession(nextToken, nextUser) {
    tokenCookie.value = nextToken;
    userCookie.value = nextUser;
  }
  function setUserInfo(partial) {
    if (userCookie.value) {
      userCookie.value = { ...userCookie.value, ...partial };
    }
  }
  function logout() {
    tokenCookie.value = null;
    userCookie.value = null;
  }
  return { token, userInfo, isLoggedIn, setSession, setUserInfo, logout };
});

export { useUserStore as u };
//# sourceMappingURL=user-CsP34Oqk.mjs.map
