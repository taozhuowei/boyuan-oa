import { ref, onBeforeUpdate } from 'vue';

const useRefs = () => {
  const refs = ref(new Map());
  const setRef = key => el => {
    refs.value.set(key, el);
  };
  onBeforeUpdate(() => {
    refs.value = new Map();
  });
  return [setRef, refs];
};

export { useRefs as u };
//# sourceMappingURL=useRefs.mjs.map
