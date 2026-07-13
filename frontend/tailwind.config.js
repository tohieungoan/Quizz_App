/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-tertiary-fixed-variant": "#653e00",
        "surface-container-high": "#dee8ff",
        "surface-bright": "#f9f9ff",
        "secondary-fixed": "#6ffbbe",
        "surface-container-low": "#f0f3ff",
        "on-tertiary-fixed": "#2a1700",
        "surface-container-lowest": "#ffffff",
        "primary": "#3525cd",
        "secondary-fixed-dim": "#4edea3",
        "on-primary": "#ffffff",
        "on-background": "#111c2d",
        "background": "#f9f9ff",
        "primary-container": "#4f46e5",
        "on-error": "#ffffff",
        "inverse-on-surface": "#ecf1ff",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ffddb8",
        "on-tertiary-container": "#ffd4a4",
        "surface-container": "#e7eeff",
        "secondary": "#006c49",
        "surface-variant": "#d8e3fb",
        "error": "#ba1a1a",
        "on-primary-container": "#dad7ff",
        "secondary-container": "#6cf8bb",
        "tertiary": "#684000",
        "tertiary-container": "#885500",
        "surface-container-highest": "#d8e3fb",
        "on-surface-variant": "#464555",
        "inverse-primary": "#c3c0ff",
        "tertiary-fixed-dim": "#ffb95f",
        "primary-fixed-dim": "#c3c0ff",
        "on-secondary": "#ffffff",
        "outline-variant": "#c7c4d8",
        "on-surface": "#111c2d",
        "outline": "#777587",
        "surface-dim": "#cfdaf2",
        "primary-fixed": "#e2dfff",
        "on-secondary-fixed-variant": "#005236",
        "surface-tint": "#4d44e3",
        "on-secondary-fixed": "#002113",
        "on-primary-fixed": "#0f0069",
        "on-error-container": "#93000a",
        "on-primary-fixed-variant": "#3323cc",
        "on-secondary-container": "#00714d",
        "surface": "#f9f9ff",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#263143"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "base": "8px",
        "container-max": "1200px",
        "margin-mobile": "16px",
        "margin-desktop": "40px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Sora", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-md": ["Sora", "sans-serif"],
        "headline-lg": ["Sora", "sans-serif"],
        "headline-xl": ["Sora", "sans-serif"],
        "button": ["Sora", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-bold": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg-mobile": [
          "24px",
          {
            lineHeight: "1.2",
            fontWeight: "700"
          }
        ],
        "body-lg": [
          "18px",
          {
            lineHeight: "1.6",
            fontWeight: "400"
          }
        ],
        "headline-md": [
          "24px",
          {
            lineHeight: "1.3",
            fontWeight: "600"
          }
        ],
        "headline-lg": [
          "32px",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            fontWeight: "700"
          }
        ],
        "headline-xl": [
          "48px",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            fontWeight: "800"
          }
        ],
        "button": [
          "16px",
          {
            lineHeight: "1",
            fontWeight: "600"
          }
        ],
        "body-md": [
          "16px",
          {
            lineHeight: "1.5",
            fontWeight: "400"
          }
        ],
        "label-bold": [
          "14px",
          {
            lineHeight: "1",
            letterSpacing: "0.05em",
            fontWeight: "600"
          }
        ]
      }
    },
  },
  plugins: [],
}
