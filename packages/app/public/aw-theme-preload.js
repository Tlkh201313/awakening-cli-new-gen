;(function () {
  var key = "awakened-theme-id"
  var themeId = localStorage.getItem(key) || "aw-2"

  if (themeId === "aw-1") {
    themeId = "aw-2"
    localStorage.setItem(key, themeId)
    localStorage.removeItem("awakened-theme-css-light")
    localStorage.removeItem("awakened-theme-css-dark")
  }

  var scheme = localStorage.getItem("awakened-color-scheme") || "system"
  var isDark = scheme === "dark" || (scheme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  var mode = isDark ? "dark" : "light"

  document.documentElement.dataset.theme = themeId
  document.documentElement.dataset.colorScheme = mode

  // Update theme-color meta tag to match app color scheme
  var metas = document.querySelectorAll("meta[name='theme-color']")
  if (metas.length > 0) metas[0].setAttribute("content", isDark ? "#131010" : "#F8F7F7")

  if (themeId === "aw-2") return

  var css = localStorage.getItem("awakened-theme-css-" + mode)
  if (css) {
    var style = document.createElement("style")
    style.id = "aw-theme-preload"
    style.textContent =
      ":root{color-scheme:" +
      mode +
      ";--text-mix-blend-mode:" +
      (isDark ? "plus-lighter" : "multiply") +
      ";" +
      css +
      "}"
    document.head.appendChild(style)
  }
})()
