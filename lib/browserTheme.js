// 自动模式在页面加载时重新跟随浏览器，避免旧的手动主题覆盖浏览器偏好。
function initializeBrowserTheme() {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = dark ? 'dark' : 'light'
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.style.colorScheme = theme
  try {
    localStorage.setItem('theme', 'system')
  } catch (_) {
    // 浏览器禁止存储时，仍可根据浏览器偏好显示主题。
  }
}

const browserThemeScript = `(${initializeBrowserTheme.toString()})();`

module.exports = { browserThemeScript }
