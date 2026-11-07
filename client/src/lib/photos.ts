// One place that says which photo belongs to which package or destination.
// To change a photo, replace the file in client/public/images/ (or edit the path here).
// If the API ever sends an imageUrl for an item, that one wins.

export interface Photo {
  src: string
  /** CSS object-position, so wide crops keep the tent / main subject in view. */
  position?: string
}

const packagePhotos: Record<string, Photo> = {
  "peak-explorer": { src: "/images/peak-explorer.webp" },
  "coastal-breeze-glamp": { src: "/images/coastal-breeze-glamp.webp" },
  "mountain-ridge-deluxe": { src: "/images/mountain-ridge-deluxe.webp" },
  "forest-falls-sanctuary": { src: "/images/forest-and-falls-sanctuary.webp" },
}

const destinationPhotos: Record<string, Photo> = {
  highlands: { src: "/images/destinations/highlands.webp", position: "center 70%" },
  coastline: { src: "/images/destinations/coastline.webp", position: "center 65%" },
  "falls-forest": { src: "/images/destinations/falls-forest.webp", position: "center 60%" },
}

export function packagePhoto(slug: string, imageUrl?: string | null): Photo | null {
  if (imageUrl) return { src: imageUrl }
  return packagePhotos[slug] ?? null
}

export function destinationPhoto(slug: string, imageUrl?: string | null): Photo | null {
  if (imageUrl) return { src: imageUrl }
  return destinationPhotos[slug] ?? null
}