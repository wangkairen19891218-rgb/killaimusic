/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // 主色调：深蓝色和紫色
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bbfc",
          400: "#8195f8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#1a1a2e",
          950: "#16213e",
        },
        // 辅助色：橙色用于重要按钮和警告
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#ff6b35",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        // 绿色用于成功状态
        success: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#4ecdc4",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // 背景色
        background: {
          DEFAULT: "#0a0a0f",
          secondary: "#1a1a2e",
          tertiary: "#16213e",
        },
        // 文本色
        foreground: {
          DEFAULT: "#ffffff",
          secondary: "#e2e8f0",
          muted: "#94a3b8",
        },
        // 边框色
        border: {
          DEFAULT: "#374151",
          secondary: "#4b5563",
        },
        // 卡片背景
        card: {
          DEFAULT: "#1f2937",
          secondary: "#374151",
        },
        // 次要背景
        secondary: {
          DEFAULT: "#374151",
          foreground: "#f9fafb",
        },
        // 静音文本
        muted: {
          DEFAULT: "#6b7280",
          foreground: "#9ca3af",
        },
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
