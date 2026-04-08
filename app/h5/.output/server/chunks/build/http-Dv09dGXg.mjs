import { d as useCookie, n as navigateTo } from './server.mjs';
import { u as useUserStore } from './user-CsP34Oqk.mjs';

const API_BASE = "http://localhost:8080/api";
async function request(options) {
  var _a;
  const tokenCookie = useCookie("oa-token");
  const headers = { "X-Client-Type": "web" };
  if (tokenCookie.value) {
    headers["Authorization"] = "Bearer " + tokenCookie.value;
  }
  try {
    return await $fetch(API_BASE + options.url, {
      method: (_a = options.method) != null ? _a : "GET",
      body: options.body,
      headers
    });
  } catch (err) {
    const status = err.statusCode;
    if (status === 401 && !options.skipAuthRedirect) {
      const store = useUserStore();
      store.logout();
      await navigateTo("/login");
    }
    throw err;
  }
}

export { request as r };
//# sourceMappingURL=http-Dv09dGXg.mjs.map
