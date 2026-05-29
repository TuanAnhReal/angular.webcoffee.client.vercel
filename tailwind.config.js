/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container": "#eceef0",
        "tertiary-fixed-dim": "#ffb786",
        "on-background": "#191c1e",
        // ... (Copy toàn bộ các mã màu khác của bạn vào đây) ...
        "surface-container-low": "#f2f4f6"
      },
      borderRadius: {
        "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"
      },
      spacing: {
        "base-unit": "4px", "gutter": "16px", "sidebar-width": "260px", "container-padding": "24px"
      },
      fontFamily: {
        "title-sm": ["Inter"], "body-sm": ["Inter"], "display-lg": ["Inter"],
        "body-md": ["Inter"], "label-caps": ["Inter"], "headline-md": ["Inter"]
      },
      fontSize: {
        "title-sm": ["18px", {"lineHeight": "28px", "fontWeight": "600"}],
        "body-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
        "display-lg": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}