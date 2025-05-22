import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#1c1698" },
        },
        blue: {
          50: { value: "#E8E7F5" },
          100: { value: "#D1CFEB" },
          200: { value: "#A39FE1" },
          300: { value: "#756FD7" },
          400: { value: "#473FCD" },
          500: { value: "#1c1698" },
          600: { value: "#16127A" },
          700: { value: "#110E5C" },
          800: { value: "#0B0A3E" },
          900: { value: "#060620" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})