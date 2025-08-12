# Liquid Glass Vue

Apple 液体玻璃效果的 Vue 3 实现。

> **📝 注意：** 这个 Vue 实现基于原始的 [liquid-glass-react](https://github.com/rdev/liquid-glass-react) 库。所有核心效果和算法都已从 React 版本适配到 Vue 3 的组合式 API。
> **[English](./README.md)**

|                                  卡片示例                                  |                                   按钮示例                                   |
| :------------------------------------------------------------------------: | :--------------------------------------------------------------------------: |
| ![](https://github.com/rdev/liquid-glass-react/raw/master/assets/card.png) | ![](https://github.com/rdev/liquid-glass-react/raw/master/assets/button.png) |

## 🎬 演示

[点击这里](https://liquid-glass-vue.netlify.app/) 查看在线演示！

![项目液体动图](./assets/project-liquid.gif)

## ✨ 特性

- 准确的边缘弯曲和折射效果
- 多种折射模式
- 可配置的磨砂程度
- 支持任意子元素
- 可配置内边距
- 正确的悬停和点击效果
- 边缘和高光像 Apple 的效果一样采用底层光线
- 可配置色差
- 可配置弹性，模拟 Apple 的"液体"感觉
- 完整的 Vue 3 支持和组合式 API
- TypeScript 支持

> **⚠️ 注意：** Safari 和 Firefox 仅部分支持该效果（位移效果不可见）

## 🚀 使用方法

### 安装

```bash
npm install @chencu/liquid-glass-vue
```

### 全局使用

```ts
import LiquidGlass from '@chencu/liquid-glass-vue'
import { createApp } from 'vue'

const app = createApp()

app.use(LiquidGlass)
```

```vue
<script setup lang="ts"></script>

<template>
  <LiquidGlass>
    <div class="p-6">
      <h2>全局使用</h2>
      <p>这将拥有液体玻璃效果</p>
    </div>
  </LiquidGlass>
</template>
```

### 基础使用

```vue
<script setup lang="ts">
  import LiquidGlass from '@chencu/liquid-glass-vue'
</script>

<template>
  <LiquidGlass>
    <div class="p-6">
      <h2>您的内容在这里</h2>
      <p>这将拥有液体玻璃效果</p>
    </div>
  </LiquidGlass>
</template>
```

### 按钮示例

```vue
<script setup lang="ts">
  import LiquidGlass from '@chencu/liquid-glass-vue'

  const handleClick = () => {
    console.log('按钮被点击！')
  }
</script>

<template>
  <LiquidGlass
    :displacement-scale="64"
    :blur-amount="0.1"
    :saturation="130"
    :aberration-intensity="2"
    :elasticity="0.35"
    :corner-radius="100"
    padding="8px 16px"
    @click="handleClick"
    :effect="mosaicGlass"
    :mode="'shader'"
  >
    <span class="text-white font-medium">点击我</span>
  </LiquidGlass>
</template>
```

### 鼠标容器示例

当您希望玻璃效果响应更大区域（如父容器）的鼠标移动时，使用 `mouseContainer` 属性：

```vue
<script setup lang="ts">
  import { ref } from 'vue'
  import LiquidGlass from '@chencu/liquid-glass-vue'

  const containerRef = ref<HTMLDivElement>()
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-screen bg-image"
  >
    <LiquidGlass
      :mouse-container="containerRef"
      :elasticity="0.3"
      :style="{ position: 'fixed', top: '50%', left: '50%' }"
    >
      <div class="p-6">
        <h2>玻璃响应容器中任何位置的鼠标</h2>
      </div>
    </LiquidGlass>
  </div>
</template>
```

## 属性

| 属性                  | 类型                                                                                     | 默认值          | 描述                                                        |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `displacementScale`   | `number`                                                                                 | `70`            | 控制位移效果的强度                                          |
| `blurAmount`          | `number`                                                                                 | `0.0625`        | 控制模糊/磨砂程度                                           |
| `saturation`          | `number`                                                                                 | `140`           | 控制玻璃效果的颜色饱和度                                    |
| `aberrationIntensity` | `number`                                                                                 | `2`             | 控制色差强度                                                |
| `elasticity`          | `number`                                                                                 | `0.15`          | 控制"液体"弹性感觉（0 = 刚性，值越高 = 弹性越强）           |
| `cornerRadius`        | `number`                                                                                 | `999`           | 边框圆角，单位像素                                          |
| `class`               | `string`                                                                                 | `""`            | 额外的 CSS 类                                               |
| `padding`             | `string`                                                                                 | `"24px 32px"`   | CSS 内边距值                                                |
| `style`               | `CSSProperties`                                                                          | -               | 额外的内联样式                                              |
| `overLight`           | `boolean`                                                                                | `false`         | 玻璃是否在浅色背景上                                        |
| `mouseContainer`      | `Ref<HTMLElement>`                                                                       | `null`          | 要跟踪鼠标移动的容器元素（默认为玻璃组件本身）              |
| `mode`                | `"standard" \| "polar" \| "prominent" \| "shader"`                                       | `"standard"`    | 不同视觉效果的折射模式。`shader` 是最准确的但不是最稳定的。 |
| `globalMousePos`      | `{ x: number; y: number }`                                                               | -               | 用于手动控制的全局鼠标位置坐标                              |
| `mouseOffset`         | `{ x: number; y: number }`                                                               | -               | 用于微调定位的鼠标位置偏移                                  |
| `effect`              | `"flowingLiquid" \| "liquidGlass" \| "transparentIce" \| "unevenGlass" \| "mosaicGlass"` | `"liquidGlass"` | 着色器效果类型，仅在模式为 "shader" 时有效                  |

## 事件

| 事件     | 类型         | 描述                   |
| -------- | ------------ | ---------------------- |
| `@click` | `() => void` | 当玻璃组件被点击时触发 |

## 指令 vs 组件

### 使用指令的情况：

- 您想要对现有元素应用液体玻璃效果
- 您需要对 DOM 结构有更多控制
- 您正在处理可能干扰组件的复杂布局
- 您想要对第三方组件应用效果

### 使用组件的情况：

- 您想要一个完整的玻璃容器解决方案
- 您更喜欢基于组件的方法
- 您需要最小设置的完整功能集
- 您正在从头构建新的 UI 元素

## 开发

这个 Vue 实现在利用 Vue 3 的响应式系统和组合式 API 实现最佳性能的同时，保持了与原始 React 版本相同的视觉效果和行为。

### 致谢

- 原始 React 实现：[liquid-glass-react](https://github.com/rdev/liquid-glass-react) 由 [rdev](https://github.com/rdev) 开发
- 原始 Vue 实现：[liquid-glass-vue](https://github.com/WXperia/liquid-glass-vue) 由 [WXperia](https://github.com/WXperia) 开发
- Vue 适配：使用组合式 API 转换为 Vue 3
