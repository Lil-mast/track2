import type { Config } from "tailwindcss";
import recoveryaiPreset from "./packages/recoveryai-ds/src/tailwind-preset";

const config: Config = {
  presets: [recoveryaiPreset as Config],
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./packages/recoveryai-ds/src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
