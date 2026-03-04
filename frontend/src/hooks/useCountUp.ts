import { useState, useRef, useMemo, useEffect } from 'react'

export type CountUpOptions = {
  durationMs?: number
  from?: number
}

// 數字刷新動畫的 Hook
export const useCountUp = (to: number, deps: React.DependencyList, options: CountUpOptions = {}) => {
  const { durationMs = 650, from = 0 } = options
  const [value, setValue] = useState(from)

  // 依照使用者偏好設定，決定是否要執行動畫
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])
  // 用來記住 requestAnimationFrame 的 id，方便取消動畫
  const requestAnimationFrameIdRef = useRef<number | null>(null)
  // 記住動畫的開始時間
  const animationStartTimeMsRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(to)
      return
    }

    setValue(from)
    animationStartTimeMsRef.current = null
    
    // 有動畫還在跑，先取消
    if (requestAnimationFrameIdRef.current) {
      cancelAnimationFrame(requestAnimationFrameIdRef.current)
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animateFrame = (now: number) => {
      if (animationStartTimeMsRef.current === null) {
        animationStartTimeMsRef.current = now
      }

      const elapsed = now - animationStartTimeMsRef.current
      const progress = Math.min(1, elapsed / durationMs)
      const easedProgress = easeOutCubic(progress)

      const nextValue = Math.round(from + (to - from) * easedProgress)
      setValue(nextValue)

      if (progress < 1) {
        requestAnimationFrameIdRef.current = requestAnimationFrame(animateFrame)
      }
    }

    requestAnimationFrameIdRef.current = requestAnimationFrame(animateFrame)

    // 離開頁面或 dependencies 變更時，取消動畫
    return () => {
      if (requestAnimationFrameIdRef.current) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current)
      }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return value
}
