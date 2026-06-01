import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ug: { DEFAULT: '#002855', light: '#003d7a', dark: '#001a36' },
        fii: { DEFAULT: '#0085CA', light: '#0ea5e9', dark: '#0066a0' },
      }
    },
  },
  plugins: [],
}

export default config
