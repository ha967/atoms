const STORAGE_SHIM = `<script>(function () {
  var available = false;
  try {
    window.localStorage.getItem('__atoms_probe__');
    available = true;
  } catch (error) {
    available = false;
  }
  if (available) {
    return;
  }
  var store = {};
  var api = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
    key: function (index) {
      var keys = Object.keys(store);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
  try {
    Object.defineProperty(window, 'localStorage', { value: api, configurable: true });
  } catch (error) {}
  try {
    Object.defineProperty(window, 'sessionStorage', { value: api, configurable: true });
  } catch (error) {}
})();</script>`;

/**
 * 预览用的 iframe 没有 allow-same-origin，属于不透明源，浏览器会禁止访问 localStorage。
 * 生成的应用（以及内置示例）普遍依赖 localStorage，因此注入一个内存级 shim：
 * 预览里的交互照常工作，导出为独立 HTML 后用原生 localStorage 持久化。
 */
export function preparePreviewHtml(html: string): string {
  if (!html) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${STORAGE_SHIM}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${STORAGE_SHIM}</head>`);
  }

  return STORAGE_SHIM + html;
}
