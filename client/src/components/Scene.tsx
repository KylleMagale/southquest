
import { useId } from "react"
import type { SceneKind } from "../data/content"

interface SceneProps {
  kind: SceneKind
  className?: string
}

export function Scene({ kind, className = "" }: SceneProps) {
  const uid = useId().replace(/:/g, "")
  const sky = `sky-${uid}`
  const glow = `glow-${uid}`
  const fall = `fall-${uid}`

  const skyColors: Record<SceneKind, [string, string]> = {
    camp: ["#0b1208", "#1d2a0f"],
    mountain: ["#101a0a", "#26381a"],
    beach: ["#0c1a22", "#16414f"],
    waterfall: ["#0d1a12", "#1d3a2a"],
    forest: ["#0b140c", "#1a2f1c"],
  }

  const [top, bottom] = skyColors[kind]

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${kind} illustration`}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>

        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#AFFF00" stopOpacity="0.55" />
          <stop offset="1" stopColor="#AFFF00" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={fall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#bfefff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="400" height="500" fill={`url(#${sky})`} />

      {/* Stars */}
      {[
        [60, 60],
        [120, 110],
        [320, 70],
        [260, 130],
        [350, 150],
        [40, 160],
        [200, 50],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 2 ? 1.5 : 1}
          fill="#fff"
          opacity={0.7}
        />
      ))}

      {/* Sun or moon glow */}
      <circle
        cx={kind === "beach" ? 290 : 280}
        cy={kind === "beach" ? 250 : 150}
        r="110"
        fill={`url(#${glow})`}
      />

      <circle
        cx={kind === "beach" ? 290 : 280}
        cy={kind === "beach" ? 250 : 150}
        r="34"
        fill="#AFFF00"
        opacity="0.9"
      />

      {/* Mountain landscape */}
      {kind === "mountain" && (
        <>
          <polygon
            points="-20,360 110,190 230,330 300,250 430,380 430,500 -20,500"
            fill="#1d2d12"
          />
          <polygon
            points="-20,420 80,300 180,400 280,310 430,430 430,500 -20,500"
            fill="#162309"
          />
          <polygon
            points="-20,470 120,390 240,460 360,400 430,450 430,500 -20,500"
            fill="#0e1806"
          />
        </>
      )}

      {/* Campsite with tent and campfire */}
      {kind === "camp" && (
        <>
          <polygon
            points="-20,380 100,230 210,360 300,280 430,400 430,500 -20,500"
            fill="#182510"
          />

          <polygon
            points="-20,440 430,440 430,500 -20,500"
            fill="#0e1806"
          />

          <polygon
            points="130,440 200,340 270,440"
            fill="#AFFF00"
          />

          <polygon
            points="200,340 200,440 270,440"
            fill="#84cc16"
          />

          <polygon
            points="188,440 200,400 212,440"
            fill="#0e1806"
          />

          <circle
            cx="310"
            cy="436"
            r="34"
            fill="#ff6b35"
            opacity="0.25"
          />

          <polygon
            points="302,448 310,420 318,448"
            fill="#ff6b35"
          />
        </>
      )}

      {/* Beach, ocean and glamping tent */}
      {kind === "beach" && (
        <>
          <rect y="300" width="400" height="130" fill="#0f3a47" />

          <path
            d="M0 330 Q50 316 100 330 T200 330 T300 330 T400 330 V360 H0Z"
            fill="#14506a"
            opacity="0.8"
          />

          <path
            d="M0 370 Q50 356 100 370 T200 370 T300 370 T400 370 V400 H0Z"
            fill="#1a6a88"
            opacity="0.7"
          />

          <path
            d="M0 430 Q120 400 240 425 T400 420 V500 H0Z"
            fill="#d9c58a"
          />

          <path
            d="M0 470 Q140 450 260 470 T400 465 V500 H0Z"
            fill="#c4ae70"
          />

          <polygon
            points="70,448 120,385 170,448"
            fill="#f5f2e6"
          />

          <polygon
            points="120,385 120,448 170,448"
            fill="#dcd6bd"
          />

          <polygon
            points="108,448 120,420 132,448"
            fill="#14506a"
          />
        </>
      )}

      {/* Waterfall and pool */}
      {kind === "waterfall" && (
        <>
          <polygon
            points="-20,320 120,260 170,290 230,250 430,330 430,500 -20,500"
            fill="#142a1c"
          />

          <rect
            x="160"
            y="270"
            width="64"
            height="170"
            fill={`url(#${fall})`}
          />

          <rect
            x="172"
            y="270"
            width="8"
            height="170"
            fill="#fff"
            opacity="0.5"
          />

          <ellipse
            cx="192"
            cy="448"
            rx="90"
            ry="20"
            fill="#2a6f86"
            opacity="0.8"
          />

          <ellipse
            cx="192"
            cy="444"
            rx="60"
            ry="10"
            fill="#bfefff"
            opacity="0.5"
          />

          {[40, 80, 330, 365].map((x, i) => (
            <polygon
              key={i}
              points={`${x - 22},470 ${x},${400 - (i % 2) * 20} ${x + 22},470`}
              fill="#0e1806"
            />
          ))}

          <polygon
            points="-20,490 430,490 430,500 -20,500"
            fill="#0a1304"
          />
        </>
      )}

      {/* Forest landscape */}
      {kind === "forest" && (
        <>
          {[40, 110, 190, 270, 350].map((x, i) => (
            <g key={i}>
              <polygon
                points={`${x - 40},470 ${x},${280 + (i % 2) * 40} ${x + 40},470`}
                fill="#13230f"
              />

              <polygon
                points={`${x - 30},430 ${x},${250 + (i % 2) * 40} ${x + 30},430`}
                fill="#1b3315"
              />
            </g>
          ))}

          <rect y="470" width="400" height="30" fill="#0a1304" />
        </>
      )}
    </svg>
  )
}
