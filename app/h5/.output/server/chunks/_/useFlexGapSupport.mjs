import { shallowRef, onMounted } from 'vue';
import { q as detectFlexGapSupported } from './index5.mjs';

const useFlexGapSupport = (() => {
  const flexible = shallowRef(false);
  onMounted(() => {
    flexible.value = detectFlexGapSupported();
  });
  return flexible;
});

export { useFlexGapSupport as u };
//# sourceMappingURL=useFlexGapSupport.mjs.map
