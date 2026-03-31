<script lang="ts">
export default {}
</script>

<style lang="scss">
:root,
page {
  --oa-font-display: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --oa-font-body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  --oa-bg: #f6efe7;
  --oa-bg-alt: #efe5db;
  --oa-surface: rgba(255, 251, 247, 0.9);
  --oa-surface-strong: rgba(255, 248, 240, 0.96);
  --oa-surface-soft: rgba(253, 248, 243, 0.96);
  --oa-border: rgba(134, 110, 91, 0.12);
  --oa-border-strong: rgba(122, 99, 82, 0.16);

  --oa-text-primary: #2e231d;
  --oa-text-secondary: #5d4d44;
  --oa-text-muted: #7f7268;
  --oa-text-inverse: #fff9f3;

  --oa-accent: #a45b38;
  --oa-accent-strong: #7d3d23;
  --oa-accent-deep: #6e3019;
  --oa-accent-soft: rgba(190, 118, 82, 0.12);
  --oa-success-soft: rgba(96, 139, 104, 0.14);
  --oa-warning-soft: rgba(196, 152, 83, 0.16);
  --oa-danger-soft: rgba(185, 93, 83, 0.16);

  --oa-gradient-page: linear-gradient(180deg, #f8f2eb 0%, #efe3d7 48%, #f8f2eb 100%);
  --oa-gradient-hero: linear-gradient(135deg, #7d3d23 0%, #a45b38 38%, #c7885f 100%);
  --oa-gradient-action: linear-gradient(135deg, #8d4727 0%, #b76b44 100%);

  --oa-radius-xl: 28px;
  --oa-radius-lg: 22px;
  --oa-radius-md: 16px;
  --oa-radius-sm: 12px;

  --oa-shadow-panel: 0 18px 46px rgba(73, 47, 32, 0.08);
  --oa-shadow-accent: 0 14px 26px rgba(125, 61, 35, 0.18);
}

page {
  font-family: var(--oa-font-body);
  font-size: 14px;
  color: var(--oa-text-primary);
  background: var(--oa-gradient-page);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

view,
text,
button,
input,
textarea {
  font-family: var(--oa-font-body);
}

button {
  margin: 0;
  border: none;
  background: transparent;
}

.oa-page {
  background:
    radial-gradient(circle at top left, rgba(255, 248, 238, 0.9) 0, rgba(255, 248, 238, 0) 32%),
    radial-gradient(circle at top right, rgba(190, 118, 82, 0.08) 0, rgba(190, 118, 82, 0) 28%),
    var(--oa-gradient-page);
}

.oa-panel {
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
  padding: clamp(18px, 2vw, 24px);
  backdrop-filter: blur(16px);
}

.oa-surface-hero {
  border-radius: var(--oa-radius-xl);
  background: var(--oa-gradient-hero);
  box-shadow: var(--oa-shadow-accent);
}
</style>
