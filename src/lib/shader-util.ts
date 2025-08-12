// Adapted from https://github.com/shuding/liquid-glass

export interface Vec2 {
  x: number
  y: number
}

export interface ShaderOptions {
  width: number
  height: number
  effect: FragmentShaderType
  mousePosition?: Vec2
  time?: number
}

export type FragmentShaderType = keyof typeof fragmentShaders

export const fragmentShaders = {
  liquidGlass: 'liquidGlass',
  liquidGlass2: 'liquidGlass2',
  flowingLiquid: 'flowingLiquid',
  transparentIce: 'transparentIce',
  unevenGlass: 'unevenGlass',
  mosaicGlass: 'mosaicGlass',
} as const

export class ShaderDisplacementGenerator {
  private worker: Worker | null = null
  private startTime = Date.now()

  constructor(private options: ShaderOptions) {
    // 只在客户端环境初始化Worker
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./workers/shader-worker.ts', import.meta.url), {
        type: 'module',
      })
    }
  }

  updateShader(mousePosition?: Vec2): Promise<string> {
    // 如果不在客户端环境或Worker不可用，返回空的data URL
    if (!this.worker || typeof window === 'undefined') {
      return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    }

    const currentTime = (Date.now() - this.startTime) / 1000 // Time in seconds

    return new Promise((resolve) => {
      this.worker!.onmessage = (e) => {
        const { imageData } = e.data
        const canvas = document.createElement('canvas')
        canvas.width = this.options.width
        canvas.height = this.options.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.putImageData(imageData, 0, 0)
          resolve(canvas.toDataURL())
        }
      }

      this.worker!.postMessage({
        width: this.options.width,
        height: this.options.height,
        effect: this.options.effect,
        mousePosition,
        time: currentTime,
      })
    })
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
    }
  }

  getCurrentTime(): number {
    return (Date.now() - this.startTime) / 1000
  }
}

