<script lang="ts" setup>
import { ref, watchEffect, computed, type CSSProperties } from 'vue';
import type { LiquidGlassProps } from '../type';
import { GlassMode } from '../type';
import GlassContainer from './GlassContainer.vue'
import { autoPx } from '../utils';

// 节流函数
function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;

  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

const props = withDefaults(defineProps<LiquidGlassProps>(), {
  displacementScale: 70,
  blurAmount: 0.0625,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0.15,
  cornerRadius: 999,
  className: '',
  padding: "24px 32px",
  overLight: false,
  mode: GlassMode.standard
})

const glassRef = ref<InstanceType<typeof GlassContainer>>()
const isHovered = ref(false)
const isActive = ref(false)
const glassSize = ref({ width: 270, height: 69 })
const internalGlobalMousePos = ref({ x: 0, y: 0 })
const internalMouseOffset = ref({ x: 0, y: 0 })

// 检测是否为触摸设备
const isTouchDevice = ref(false)

// 检测设备类型
const detectTouchDevice = () => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 在组件挂载时检测设备类型
watchEffect(() => {
  detectTouchDevice()
})


// Use external mouse position if provided, otherwise use internal
const globalMousePos = computed(() => props.globalMousePos || internalGlobalMousePos.value)
const mouseOffset = computed(() => props.mouseOffset || internalMouseOffset.value)

// 统一的位置更新函数
const updateMousePosition = (clientX: number, clientY: number) => {
  if (!glassRef.value?.$el) return

  const rect = glassRef.value.$el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  Object.assign(internalMouseOffset.value, {
    x: (clientX - centerX) / (rect.width / 2),  // 标准化到 -1 到 1 范围
    y: (clientY - centerY) / (rect.height / 2), // 标准化到 -1 到 1 范围
  })

  Object.assign(internalGlobalMousePos.value, {
    x: clientX,
    y: clientY,
  })
}

// 鼠标移动处理函数
const handleMouseMove = (e: Event) => {
  const mouseEvent = e as MouseEvent
  updateMousePosition(mouseEvent.clientX, mouseEvent.clientY)
}

// 触摸移动处理函数
const handleTouchMove = (e: Event) => {
  const touchEvent = e as TouchEvent
  const touch = touchEvent.touches[0]
  if (touch) {
    updateMousePosition(touch.clientX, touch.clientY)

    // 只在触摸点在组件区域内时才阻止默认行为
    if (glassRef.value?.$el) {
      const rect = glassRef.value.$el.getBoundingClientRect()
      const isInside = touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom

      if (isInside && touchEvent.cancelable) {
        touchEvent.preventDefault()
      }
    }
  }
}

// 触摸开始处理函数
const handleTouchStart = (e: Event) => {
  const touchEvent = e as TouchEvent
  const touch = touchEvent.touches[0]
  if (touch) {
    updateMousePosition(touch.clientX, touch.clientY)

    // 检查触摸点是否在界面区域内，如果是则设置激活状态
    if (glassRef.value?.$el && props.onClick) {
      const rect = glassRef.value.$el.getBoundingClientRect()
      const isInside = touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom

      if (isInside) {
        isActive.value = true
      }
    }
  }
}

// 触摸结束处理函数 - 重置位置以避免效果卡住
const handleTouchEnd = () => {
  if (!isTouchDevice.value) return

  // 重置激活状态
  isActive.value = false

  // 延迟重置，让用户看到最后的效果
  setTimeout(() => {
    Object.assign(internalMouseOffset.value, { x: 0, y: 0 })
    Object.assign(internalGlobalMousePos.value, { x: 0, y: 0 })
  }, 300)
}

// 节流的事件处理函数
const throttledHandleMouseMove = throttle(handleMouseMove, 16) // ~60fps
const throttledHandleTouchMove = throttle(handleTouchMove, 16) // ~60fps

// Set up mouse and touch tracking if no external mouse position is provided
watchEffect(() => {
  if (props.globalMousePos && props.mouseOffset) {
    // External mouse tracking is provided, don't set up internal tracking
    return
  }

  const container = props.mouseContainer || document
  if (!container) {
    return
  }

  // 添加鼠标事件监听器
  container.addEventListener("mousemove", throttledHandleMouseMove)

  // 添加触摸事件监听器
  container.addEventListener("touchmove", throttledHandleTouchMove, { passive: false })
  container.addEventListener("touchstart", handleTouchStart, { passive: true })
  container.addEventListener("touchend", handleTouchEnd, { passive: true })
  container.addEventListener("touchcancel", handleTouchEnd, { passive: true })

  return () => {
    // 清理鼠标事件监听器
    container.removeEventListener("mousemove", throttledHandleMouseMove)

    // 清理触摸事件监听器
    container.removeEventListener("touchmove", throttledHandleTouchMove)
    container.removeEventListener("touchstart", handleTouchStart)
    container.removeEventListener("touchend", handleTouchEnd)
    container.removeEventListener("touchcancel", handleTouchEnd)
  }
})

// 缓存基础计算结果
const baseCalculations = computed(() => {
  if (!globalMousePos.value.x || !globalMousePos.value.y || !glassRef.value) {
    return null
  }

  const rect = glassRef.value?.$el.getBoundingClientRect()
  if (!rect) return null

  const pillCenterX = rect.left + rect.width / 2
  const pillCenterY = rect.top + rect.height / 2
  const pillWidth = rect.width  // 使用实际的DOM尺寸
  const pillHeight = rect.height // 使用实际的DOM尺寸

  const deltaX = globalMousePos.value.x - pillCenterX
  const deltaY = globalMousePos.value.y - pillCenterY

  // Calculate distance from mouse to pill edges (not center)
  const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2)
  const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2)
  const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY)

  // Activation zone: 200px from edges
  const activationZone = 200
  const fadeInFactor = edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone

  const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  return {
    deltaX,
    deltaY,
    edgeDistance,
    fadeInFactor,
    centerDistance,
    pillCenterX,
    pillCenterY,
    isActive: edgeDistance <= activationZone
  }
})

const calculateDirectionalScale = computed(() => {
  const calc = baseCalculations.value
  if (!calc || !calc.isActive) {
    return "scale(1)"
  }

  const { deltaX, deltaY, centerDistance, fadeInFactor } = calc

  if (centerDistance === 0) {
    return "scale(1)"
  }

  const normalizedX = deltaX / centerDistance
  const normalizedY = deltaY / centerDistance

  // Calculate stretch factors with fade-in - 为触摸设备调整强度
  const elasticityMultiplier = isTouchDevice.value ? 1.5 : 1 // 触摸设备增强效果
  const stretchIntensity = Math.min(centerDistance / 300, 1) * props.elasticity * fadeInFactor * elasticityMultiplier

  // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
  const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15

  // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
  const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15

  return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`
})


// Helper function to calculate elastic translation
const calculateElasticTranslation = computed(() => {
  const calc = baseCalculations.value
  if (!calc) {
    return { x: 0, y: 0 }
  }

  const { deltaX, deltaY, fadeInFactor } = calc

  // 为触摸设备调整平移强度
  const translationMultiplier = isTouchDevice.value ? 1.3 : 1

  return {
    x: deltaX * props.elasticity * 0.1 * fadeInFactor * translationMultiplier,
    y: deltaY * props.elasticity * 0.1 * fadeInFactor * translationMultiplier,
  }
})

// 节流的尺寸更新函数
const throttledUpdateGlassSize = throttle(() => {
  if (glassRef.value) {
    const rect = glassRef.value?.$el.getBoundingClientRect()
    Object.assign(glassSize.value, { width: rect.width, height: rect.height })
  }
}, 100)

// Update glass size whenever component mounts or window resizes
watchEffect(() => {
  throttledUpdateGlassSize()
  window.addEventListener("resize", throttledUpdateGlassSize)
  return () => window.removeEventListener("resize", throttledUpdateGlassSize)
})

// 缓存常用的样式值
const sharedStyleValues = computed(() => {
  const hasCustomPosition = props.style?.position && props.style.position !== 'relative'
  const translation = calculateElasticTranslation.value

  const baseTransform = hasCustomPosition
    ? `translate(calc(-50% + ${translation.x}px), calc(-50% + ${translation.y}px))`
    : `translate(${translation.x}px, ${translation.y}px)`

  const scaleTransform = isActive.value && Boolean(props.onClick) ? "scale(0.96)" : calculateDirectionalScale.value
  const transform = `${baseTransform} ${scaleTransform}`
  const transition = "all ease-out 0.2s"

  return {
    transform,
    transition,
    hasCustomPosition,
    height: autoPx(glassSize.value.height),
    width: autoPx(glassSize.value.width),
    borderRadius: `${props.cornerRadius}px`
  }
})


const baseStyle = computed(() => {
  const shared = sharedStyleValues.value

  return {
    ...props.style,
    transform: shared.transform,
    transition: shared.transition,
    position: props.style?.position || "relative",
    ...(shared.hasCustomPosition && {
      top: props.style?.top || "50%",
      left: props.style?.left || "50%",
    })
  }
})


// 为相对定位模式创建容器样式
const containerStyle = computed<Partial<CSSProperties>>(() => {
  const hasCustomPosition = props.style?.position && props.style.position !== 'relative'

  if (hasCustomPosition) {
    return {}
  }

  return {
    position: "relative" as const,
    display: "inline-block" as const,
    width: "fit-content" as const
  }
})

// 为相对定位模式的层级元素创建样式
const layerStyle = computed<Partial<CSSProperties>>(() => {
  const shared = sharedStyleValues.value

  if (shared.hasCustomPosition) {
    return {
      position: baseStyle.value.position,
      top: baseStyle.value.top,
      left: baseStyle.value.left,
    }
  }

  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
  }
})

// 创建共享的层级样式对象
const sharedLayerStyle = computed(() => {
  const shared = sharedStyleValues.value

  return {
    ...layerStyle.value,
    height: shared.height,
    width: shared.width,
    borderRadius: shared.borderRadius,
    transform: shared.transform,
    transition: shared.transition,
  }
})

// 边框层的共享样式
const borderLayerBaseStyle = computed(() => ({
  ...sharedLayerStyle.value,
  pointerEvents: 'none' as const,
  padding: '1.5px',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  maskComposite: 'exclude',
  boxShadow: '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
}))

// 悬停效果的共享样式
const hoverLayerBaseStyle = computed(() => {
  const shared = sharedStyleValues.value

  return {
    ...layerStyle.value,
    height: shared.height,
    width: autoPx(glassSize.value.width + 1),
    borderRadius: shared.borderRadius,
    transform: shared.transform,
    pointerEvents: 'none' as const,
    transition: 'all 0.2s ease-out',
    mixBlendMode: 'overlay' as const
  }
})
</script>

<template>
  <div :style="containerStyle">
    <!-- Over light effect -->
    <div
      :class="`bg-black transition-all duration-150 ease-in-out pointer-events-none ${props.overLight ? 'opacity-20' : 'opacity-0'}`"
      :style="sharedLayerStyle"></div>
    <div
      :class="`bg-black transition-all duration-150 ease-in-out pointer-events-none mix-blend-overlay ${props.overLight ? 'opacity-100' : 'opacity-0'}`"
      :style="sharedLayerStyle"></div>

    <GlassContainer ref="glassRef" v-bind="$attrs" :effect="props.effect" :style="baseStyle"
      :cornerRadius="props.cornerRadius"
      :displacementScale="props.overLight ? props.displacementScale * 0.5 : props.displacementScale"
      :blurAmount="props.blurAmount" :saturation="props.saturation" :aberrationIntensity="props.aberrationIntensity"
      :glassSize="glassSize" :padding="props.padding" :mouseOffset="mouseOffset" :onMouseEnter="() => isHovered = true"
      :onMouseLeave="() => isHovered = false" :onMouseDown="() => isActive = true" :onMouseUp="() => isActive = false"
      :active="isActive" :overLight="props.overLight" :onClick="props.onClick" :mode="props.mode">
      <slot />
    </GlassContainer>

    <!-- Border layer 1 - extracted from glass container -->
    <span :style="{
      ...borderLayerBaseStyle,
      mixBlendMode: 'screen',
      opacity: 0.2,
      background: `linear-gradient( ${135 + mouseOffset.x * 12}deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255,${0.12 + Math.abs(mouseOffset.x) * 0.08}) ${Math.max(10, 33 + mouseOffset.y * 3)}%, rgba(255, 255, 255, ${0.4 + Math.abs(mouseOffset.x) * 0.12}) ${Math.min(90, 66 + mouseOffset.y * 4)}%, rgba(255, 255, 255, 0.0) 100% )`
    }"></span>

    <!-- Border layer 2 - duplicate with mix-blend-overlay -->
    <span :style="{
      ...borderLayerBaseStyle,
      mixBlendMode: 'overlay',
      background: `linear-gradient( ${135 + mouseOffset.x * 12}deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, ${0.32 + Math.abs(mouseOffset.x) * 0.08}) ${Math.max(10, 33 + mouseOffset.y * 3)}%, rgba(255, 255, 255, ${0.6 + Math.abs(mouseOffset.x) * 0.12}) ${Math.min(90, 66 + mouseOffset.y * 4)}%, rgba(255, 255, 255, 0.0) 100% )`
    }"></span>

    <template v-if="Boolean(props.onClick)">
      <!-- Hover effects -->
      <div :style="{
        ...hoverLayerBaseStyle,
        opacity: isHovered || isActive ? 0.5 : 0,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
      }"></div>
      <div :style="{
        ...hoverLayerBaseStyle,
        opacity: isActive ? 0.5 : 0,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)',
      }"></div>
      <div :style="{
        ...hoverLayerBaseStyle,
        opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
      }"></div>
    </template>
  </div>
</template>
