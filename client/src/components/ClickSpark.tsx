
import { useEffect, useRef } from "react"

interface Spark {
  x: number
  y: number
  angle: number
  start: number
}

interface Props {
  color?: string
  size?: number
  radius?: number
  count?: number
  duration?: number
}

// Radial sparks on every click, drawn on a fixed full-screen canvas.
export function ClickSpark({
  color = "#AFFF00",
  size = 12,
  radius = 20,
  count = 8,
  duration = 400,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let sparks: Spark[] = []
    let raf = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      sparks = sparks.filter((spark) => t - spark.start < duration)

      for (const spark of sparks) {
        const progress = (t - spark.start) / duration
        const eased = progress * (2 - progress)
        const distance = eased * radius
        const length = size * (1 - eased)

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        ctx.moveTo(
          spark.x + distance * Math.cos(spark.angle),
          spark.y + distance * Math.sin(spark.angle),
        )

        ctx.lineTo(
          spark.x + (distance + length) * Math.cos(spark.angle),
          spark.y + (distance + length) * Math.sin(spark.angle),
        )

        ctx.stroke()
      }

      raf = sparks.length ? requestAnimationFrame(draw) : 0
    }

    const onClick = (event: MouseEvent) => {
      const now = performance.now()

      for (let i = 0; i < count; i++) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * i) / count,
          start: now,
        })
      }

      if (!raf) {
        raf = requestAnimationFrame(draw)
      }
    }

    window.addEventListener("click", onClick)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("click", onClick)
      cancelAnimationFrame(raf)
    }
  }, [color, size, radius, count, duration])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  )
}
