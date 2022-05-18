import { Application } from "pixi.js"
import { BASE_RESOLUTION } from "../config"

export function useAppScaler(app: Application) {
  function resizeApplication() {
    const scale = Math.min(window.innerWidth / BASE_RESOLUTION.x, window.innerHeight / BASE_RESOLUTION.y)
    app.renderer.resize(scale * BASE_RESOLUTION.x, scale * BASE_RESOLUTION.y)
    app.stage.scale.x = scale
    app.stage.scale.y = scale
  }

  let windowResizeTimeout: NodeJS.Timeout | undefined = undefined;

  const onResizeWindow = () => {
    if (windowResizeTimeout !== undefined)
      clearTimeout(windowResizeTimeout)

    windowResizeTimeout = setTimeout(resizeApplication, 200)
  }
  window.addEventListener('resize', onResizeWindow)

  resizeApplication()
  return {
    removeAppScaler: () => window.removeEventListener('resize', onResizeWindow)
  }
}

