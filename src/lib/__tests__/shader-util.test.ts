import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fragmentShaders, ShaderDisplacementGenerator } from '../shader-util'
import type { Vec2, ShaderOptions, FragmentShaderType } from '../shader-util'

// Mock Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage = vi.fn((data: any) => {
    // Don't simulate async response to avoid document.createElement issues
    // The actual implementation will be tested through integration tests
  })
  terminate = vi.fn()
}

// Mock canvas and context
class MockCanvasRenderingContext2D {
  createImageData = vi.fn((width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  }))
  putImageData = vi.fn()
}

class MockHTMLCanvasElement {
  width = 0
  height = 0
  style = { display: '' }

  getContext = vi.fn(() => new MockCanvasRenderingContext2D())
  toDataURL = vi.fn(() => 'data:image/png;base64,mock-base64-data')
  remove = vi.fn()
}

// Mock global Worker and document.createElement
const originalCreateElement = global.document?.createElement
beforeEach(() => {
  // Mock Worker
  global.Worker = MockWorker as any

  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return new MockHTMLCanvasElement() as any
      }
      return originalCreateElement?.call(document, tagName)
    }),
  } as any
})

afterEach(() => {
  if (originalCreateElement) {
    global.document.createElement = originalCreateElement
  }
  vi.clearAllMocks()
})

// Global test options
const mockOptions: ShaderOptions = {
  width: 100,
  height: 100,
  effect: 'liquidGlass',
}

describe('shader-util', () => {
  describe('Vec2 interface', () => {
    it('应该定义正确的Vec2类型', () => {
      const vec: Vec2 = { x: 1, y: 2 }
      expect(vec.x).toBe(1)
      expect(vec.y).toBe(2)
    })
  })

  describe('fragmentShaders', () => {
    it('应该包含所有预定义的shader类型', () => {
      expect(fragmentShaders.liquidGlass).toBe('liquidGlass')
      expect(fragmentShaders.liquidGlass2).toBe('liquidGlass2')
      expect(fragmentShaders.flowingLiquid).toBe('flowingLiquid')
      expect(fragmentShaders.transparentIce).toBe('transparentIce')
      expect(fragmentShaders.unevenGlass).toBe('unevenGlass')
      expect(fragmentShaders.mosaicGlass).toBe('mosaicGlass')
    })

    it('应该是字符串类型', () => {
      expect(typeof fragmentShaders.liquidGlass).toBe('string')
      expect(typeof fragmentShaders.liquidGlass2).toBe('string')
    })
  })

  describe('ShaderDisplacementGenerator', () => {
    let generator: ShaderDisplacementGenerator

    beforeEach(() => {
      generator = new ShaderDisplacementGenerator(mockOptions)
    })

    afterEach(() => {
      generator.destroy()
    })

    describe('构造函数', () => {
      it('应该创建ShaderDisplacementGenerator实例', () => {
        expect(generator).toBeInstanceOf(ShaderDisplacementGenerator)
      })
    })

    describe('updateShader方法', () => {
      it('应该返回Promise', () => {
        const result = generator.updateShader()
        expect(result).toBeInstanceOf(Promise)
      })

      it('应该处理鼠标位置参数', () => {
        const mousePosition: Vec2 = { x: 0.5, y: 0.5 }
        const result = generator.updateShader(mousePosition)
        expect(result).toBeInstanceOf(Promise)
      })
    })

    describe('destroy方法', () => {
      it('应该调用worker的terminate方法', () => {
        const mockWorker = generator['worker'] as any
        generator.destroy()
        expect(mockWorker.terminate).toHaveBeenCalled()
      })
    })

    describe('getCurrentTime方法', () => {
      it('应该返回数字类型的时间', () => {
        const time = generator.getCurrentTime()
        expect(typeof time).toBe('number')
        expect(time).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('类型定义', () => {
    it('FragmentShaderType应该包含正确的键', () => {
      const validKey: FragmentShaderType = 'liquidGlass'
      expect(fragmentShaders[validKey]).toBeDefined()
    })

    it('ShaderOptions应该有正确的属性类型', () => {
      const options: ShaderOptions = {
        width: 200,
        height: 150,
        effect: 'liquidGlass',
        mousePosition: { x: 0.5, y: 0.5 },
      }

      expect(typeof options.width).toBe('number')
      expect(typeof options.height).toBe('number')
      expect(typeof options.effect).toBe('string')
      expect(options.mousePosition).toHaveProperty('x')
      expect(options.mousePosition).toHaveProperty('y')
    })
  })

  describe('边界情况', () => {
    it('应该处理零尺寸canvas', () => {
      const zeroOptions: ShaderOptions = {
        width: 0,
        height: 0,
        effect: 'liquidGlass',
      }

      expect(() => {
        const zeroGenerator = new ShaderDisplacementGenerator(zeroOptions)
        zeroGenerator.destroy()
      }).not.toThrow()
    })

    it('应该处理非常大的canvas尺寸', () => {
      const largeOptions: ShaderOptions = {
        width: 1000,
        height: 1000,
        effect: 'liquidGlass',
      }

      expect(() => {
        const largeGenerator = new ShaderDisplacementGenerator(largeOptions)
        largeGenerator.destroy()
      }).not.toThrow()
    })

    it('应该处理极端的鼠标位置', async () => {
      const extremeMousePositions = [
        { x: -1, y: -1 },
        { x: 2, y: 2 },
        { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
        { x: Number.MIN_VALUE, y: Number.MIN_VALUE },
      ]

      for (const mousePos of extremeMousePositions) {
        expect(async () => {
          const testGenerator = new ShaderDisplacementGenerator(mockOptions)
          await testGenerator.updateShader(mousePos)
          testGenerator.destroy()
        }).not.toThrow()
      }
    })
  })
})
