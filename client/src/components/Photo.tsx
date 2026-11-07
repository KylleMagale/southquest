import { useState } from "react"
import type { SceneKind } from "../data/content"
import type { Photo as PhotoData } from "../lib/photos"
import { Scene } from "./Scene"

interface PhotoProps {
  photo: PhotoData | null
  alt: string
  /** Shown instead if there is no photo, or the photo fails to load. */
  scene: SceneKind
  className?: string
  eager?: boolean
}

/** A photo that fills its box. Falls back to the drawn illustration so nothing ever looks broken. */
export function Photo({ photo, alt, scene, className = "", eager = false }: PhotoProps) {
  const [failed, setFailed] = useState(false)

  if (!photo || failed) return <Scene kind={scene} className={className} />

  return (
    <img
      src={photo.src}
      alt={alt}
      style={photo.position ? { objectPosition: photo.position } : undefined}
      className={`object-cover ${className}`}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  )
}