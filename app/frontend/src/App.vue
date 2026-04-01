<script lang="ts">
export default {}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;600;700;800&display=swap');

// ============================================
// 全局样式变量 (OA Design System)
// ============================================
@import './styles/variables.scss';

// H5 端：Ant Design 样式
/* #ifdef H5 */
@import 'ant-design-vue/dist/reset.css';
/* #endif */

// 小程序端：Vant 样式
/* #ifdef MP-WEIXIN || APP-PLUS */
@import 'vant/lib/index.css';
/* #endif */

:root,
page {
  --font-display: 'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-body: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  --surface: #f9f9fe;
  --surface-low: #f3f3f9;
  --surface-lowest: #ffffff;
  --surface-high: #e8e8ed;
  --surface-highest: #e2e2e7;

  --primary: #003466;
  --primary-container: #1a4b84;
  --on-primary: #ffffff;
  --on-surface: #1a1c20;
  --on-surface-variant: #424750;
  --outline: #737781;

  --secondary: #115cb9;
  --secondary-container: #659dfe;

  --error: #ba1a1a;
  --error-container: #ffdad6;
  --success: #2e7d32;
  --warning: #ed6c02;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
}

page {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--on-surface);
  background: var(--surface-low);
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
  font-family: var(--font-body);
}

button {
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

input,
textarea {
  outline: none;
}

.page {
  min-height: 100vh;
  background: var(--surface-low);
}

/* 卡片基础 */
.card {
  background: var(--surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

/* Hero 区域 */
.hero {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: var(--on-primary);
}

/* 标题 */
.headline {
  font-family: var(--font-display);
  font-weight: 700;
}

/* 工具类 */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.text-sm { font-size: 13px; }
.text-muted { color: var(--on-surface-variant); }
</style>
