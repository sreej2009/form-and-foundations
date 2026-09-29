import { hideOnError } from '../lib/images.js'

// A photograph from the image config: intrinsic size set (no layout shift),
// lazy by default, hidden quietly if it ever fails to load.
export default function Photo({ image, className, parallax, loading = 'lazy', decorative = false }) {
  return (
    <img
      className={className}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={decorative ? '' : image.alt}
      loading={loading}
      decoding="async"
      data-parallax={parallax}
      onError={hideOnError}
    />
  )
}
