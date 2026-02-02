export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        drive: {
          dark: "#0a0a0c",
          card: "#12121a",
          border: "#27272e",
          accent: "#6366f1",
          accentHover: "#818cf8",
          muted: "#71717a",
        },
      },
      perspective: {
        1000: "1000px",
        1500: "1500px",
        2000: "2000px",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      backfaceVisibility: {
        hidden: "hidden",
      },
      boxShadow: {
        "3d": "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "3d-hover":
          "0 35px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.2)",
        glow: "0 0 40px rgba(99, 102, 241, 0.25)",
        "glow-lg": "0 0 60px rgba(99, 102, 241, 0.35)",
        depth: "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)",
        "depth-lg":
          "0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite alternate",
        shimmer: "shimmer 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0) translateZ(0) rotateX(4deg)",
          },
          "50%": {
            transform: "translateY(-8px) translateZ(8px) rotateX(4deg)",
          },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.25)" },
          "100%": { boxShadow: "0 0 45px rgba(99, 102, 241, 0.45)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionDuration: {
        250: "250ms",
        400: "400ms",
      },
    },
  },
  plugins: [],
};
