import { shallowRef, onMounted, onUnmounted } from 'vue';
import { _ as useResponsiveObserver } from './collapseMotion.mjs';

function useBreakpoint() {
  const screens = shallowRef({});
  let token = null;
  const responsiveObserve = useResponsiveObserver();
  onMounted(() => {
    token = responsiveObserve.value.subscribe(supportScreens => {
      screens.value = supportScreens;
    });
  });
  onUnmounted(() => {
    responsiveObserve.value.unsubscribe(token);
  });
  return screens;
}

export { useBreakpoint as u };
//# sourceMappingURL=useBreakpoint.mjs.map
