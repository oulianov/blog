import * as THREE from 'three'
import type { ShapeName } from '../../site.config.ts'
import { buildModel, type Model, type PhotoSpot } from './models.ts'

export interface SceneOptions {
  /** The models; with several, a click swaps to the next one. */
  shapes: ShapeName[]
  /** Clicks and drags move the model. Off, it only follows the pointer. */
  interactive: boolean
  /** Hops when the pointer comes in (for tiles that are links). */
  hopOnHover: boolean
  /** Called when a click swaps the model. */
  onSwap?: (index: number) => void
  /** A photo to show on each model's photo spots (see models.ts). */
  photo?: string
}

// ── One WebGL context for every model on the page ──
// Browsers keep only a handful of WebGL contexts alive (about 16 on desktop,
// fewer on phones) and drop the oldest past that: with one per model, the
// home header lost its own once the tiles below had theirs. So all models
// draw with this one renderer, off screen, and each copies its picture onto
// a plain 2D canvas of its own.
let shared: { renderer: THREE.WebGLRenderer; users: number } | undefined

function acquireRenderer() {
  if (!shared) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    // Sizes below are in device pixels.
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x000000, 0)
    renderer.setScissorTest(true)
    shared = { renderer, users: 0 }
  }
  shared.users += 1
  return shared.renderer
}

function releaseRenderer() {
  if (!shared || --shared.users > 0) return
  shared.renderer.dispose()
  // dispose() alone keeps the context until garbage collection.
  shared.renderer.forceContextLoss()
  shared = undefined
}

/**
 * Draws a black model on a flat color, swaying like a dancer. It leans toward the pointer; a drag turns it, and a click makes it
 * hop and spin. Returns a cleanup function.
 */
export function mountScene(container: HTMLElement, options: SceneOptions) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = acquireRenderer()
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  container.appendChild(canvas)
  let pixelWidth = 0
  let pixelHeight = 0

  const scene = new THREE.Scene()
  // A narrow field of view keeps the shapes flat, like cut-outs.
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 60)
  camera.position.set(0, 0, 12)

  const black = new THREE.MeshBasicMaterial({ color: 0x0b0b0b })
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff })

  // The photo, on every photo spot of the model.
  let photo: THREE.Texture | undefined
  let photoAspect = 1
  const photoMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  // Spots that wrap the photo around get their own copy of it, repeated.
  const wrapMaterials: THREE.MeshBasicMaterial[] = []
  if (options.photo) {
    new THREE.TextureLoader().load(options.photo, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const image = texture.image as { width: number; height: number }
      photoAspect = image.width / image.height
      photo = texture
      photoMaterial.map = texture
      photoMaterial.needsUpdate = true
      applyPhoto()
      if (!running) render()
    })
  }
  const applyPhoto = () => {
    if (!photo || !model) return
    model.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.name !== 'photo') return
      const spot = object.userData.spot as PhotoSpot
      if (spot.box) {
        // Fit inside, like `object-fit: contain`.
        const height = Math.min(spot.box.height, spot.box.width / photoAspect)
        object.scale.set(height * photoAspect, height, 1)
      }
      if (spot.wrap) {
        const texture = photo!.clone()
        texture.wrapS = THREE.RepeatWrapping
        texture.repeat.set(spot.wrap, 1)
        // Centered on the front of the shape.
        texture.offset.set(0.5, 0)
        texture.needsUpdate = true
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        wrapMaterials.push(material)
        object.material = material
      } else {
        object.material = photoMaterial
      }
      object.visible = true
    })
  }

  // holder: position, hop and squash. turner: the turn and the lean.
  const holder = new THREE.Group()
  const turner = new THREE.Group()
  holder.add(turner)
  scene.add(holder)

  let modelIndex = 0
  let model: Model
  let height = 1
  let reach = 1
  let scale = 1
  let baseY = 0
  let halfWidth = 2
  let halfHeight = 2

  const setModel = (index: number) => {
    if (model) {
      turner.remove(model.group)
      model.group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      for (const material of wrapMaterials.splice(0)) {
        material.map?.dispose()
        material.dispose()
      }
    }
    modelIndex = index
    model = buildModel(options.shapes[index], black, white)
    // Measured on its own, before it takes the current turn, hop and scale.
    const box = new THREE.Box3().setFromObject(model.group)
    turner.add(model.group)
    applyPhoto()
    height = box.max.y - box.min.y
    reach = Math.max(Math.hypot(box.max.x, box.max.z), Math.hypot(box.min.x, box.min.z), Math.hypot(box.max.x, box.min.z), Math.hypot(box.min.x, box.max.z))
    frame()
  }

  // The whole model shows, a little below the middle, with room to hop.
  const frame = () => {
    if (!model) return
    scale = Math.min((2 * halfHeight * 0.7) / height, (halfWidth * 0.86) / reach)
    baseY = -halfHeight * 0.08 - (height * scale) / 2
    holder.scale.setScalar(scale)
  }

  const resize = () => {
    const width = container.clientWidth
    const heightPx = container.clientHeight
    if (!width || !heightPx) return
    const ratio = Math.min(window.devicePixelRatio, 2)
    pixelWidth = Math.round(width * ratio)
    pixelHeight = Math.round(heightPx * ratio)
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    camera.aspect = width / heightPx
    camera.updateProjectionMatrix()
    halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
    halfWidth = halfHeight * camera.aspect
    frame()
  }

  // ── Motion ──
  // At rest, the model sways around its front, like a dancer; spins from
  // clicks and drags spring back to the nearest front.
  const swingAmplitude = reducedMotion ? 0 : 0.7
  let yaw = 0
  let yawSpeed = 0
  let tilt = 0
  let dragTilt = 0
  const lean = new THREE.Vector2()
  const leanTarget = new THREE.Vector2()
  let hop = 0
  let hopVelocity = 0
  let squash = 1
  let squashVelocity = 0
  let swapPending = false
  let time = Math.random() * 10

  const kick = (direction: number, strength: number) => {
    yawSpeed += direction * strength
    hopVelocity = Math.max(hopVelocity, 1.4 + strength * 0.08)
    squashVelocity = -4
  }

  // ── Pointer ──
  const area = container.closest<HTMLElement>('[data-silhouette-area]') ?? container
  let dragging = false
  let dragDistance = 0
  let lastX = 0
  let lastY = 0
  let lastMove = 0

  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect()
    leanTarget.set(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
    leanTarget.clampScalar(-1.5, 1.5)
    if (!dragging) return
    const now = performance.now()
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    const dt = Math.max((now - lastMove) / 1000, 1 / 120)
    dragDistance += Math.hypot(dx, dy)
    yawSpeed = THREE.MathUtils.clamp((dx * 0.012) / dt, -20, 20)
    dragTilt = THREE.MathUtils.clamp(dragTilt + dy * 0.004, -0.45, 0.45)
    lastX = event.clientX
    lastY = event.clientY
    lastMove = now
  }
  const onPointerLeave = () => leanTarget.set(0, 0)
  const onPointerEnter = (event: PointerEvent) => {
    if (reducedMotion || event.pointerType === 'touch') return
    kick(Math.random() < 0.5 ? -1 : 1, 5)
  }
  const onPointerDown = (event: PointerEvent) => {
    dragging = true
    dragDistance = 0
    lastX = event.clientX
    lastY = event.clientY
    lastMove = performance.now()
    canvas.setPointerCapture(event.pointerId)
    canvas.classList.add('grabbing')
  }
  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    canvas.classList.remove('grabbing')
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    if (dragDistance > 6) return
    // A click: hop and spin away from where it was clicked.
    const rect = container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    kick(x >= 0 ? -1 : 1, 9)
    hopVelocity = 2.3
    if (options.shapes.length > 1) swapPending = true
  }

  area.addEventListener('pointermove', onPointerMove)
  area.addEventListener('pointerleave', onPointerLeave)
  if (options.hopOnHover) area.addEventListener('pointerenter', onPointerEnter)
  if (options.interactive) {
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  } else {
    canvas.style.pointerEvents = 'none'
  }

  // ── Loop, paused while off screen ──
  let frameId = 0
  let running = false
  let last = 0

  const render = () => {
    const bob = reducedMotion ? 0 : Math.sin(time * 1.3) * 0.04
    turner.rotation.set(tilt, yaw + model.yaw + lean.x * 0.35, reducedMotion ? 0 : Math.sin(time * 1.7) * 0.045)
    holder.position.set(lean.x * halfWidth * 0.04, baseY + (hop + bob) * scale, 0)
    holder.scale.set(scale / Math.sqrt(squash), scale * squash, scale / Math.sqrt(squash))
    if (!pixelWidth || !pixelHeight) return

    // The shared canvas only grows; this model draws in its bottom-left corner.
    const size = renderer.getSize(new THREE.Vector2())
    if (size.x < pixelWidth || size.y < pixelHeight) {
      renderer.setSize(Math.max(size.x, pixelWidth), Math.max(size.y, pixelHeight), false)
      size.set(Math.max(size.x, pixelWidth), Math.max(size.y, pixelHeight))
    }
    renderer.setViewport(0, 0, pixelWidth, pixelHeight)
    renderer.setScissor(0, 0, pixelWidth, pixelHeight)
    renderer.render(scene, camera)
    // Copied in the same task as the render, while the picture is still there.
    context.clearRect(0, 0, pixelWidth, pixelHeight)
    context.drawImage(renderer.domElement, 0, size.y - pixelHeight, pixelWidth, pixelHeight, 0, 0, pixelWidth, pixelHeight)
  }

  const tick = (now: number) => {
    frameId = requestAnimationFrame(tick)
    const dt = Math.min((now - last) / 1000, 1 / 30)
    last = now
    time += dt

    if (!dragging) {
      const target = Math.sin(time * 0.75) * swingAmplitude
      const offset = THREE.MathUtils.euclideanModulo(target - yaw + Math.PI, Math.PI * 2) - Math.PI
      yawSpeed += (offset * 5 - yawSpeed * 2.4) * dt
      dragTilt *= Math.exp(-dt * 3)
    }
    yaw += yawSpeed * dt
    lean.lerp(leanTarget, 1 - Math.exp(-dt * 4))
    tilt = dragTilt + lean.y * 0.12

    const wasRising = hopVelocity > 0
    hopVelocity -= 9 * dt
    hop += hopVelocity * dt
    if (wasRising && hopVelocity <= 0 && swapPending) {
      // Swap at the top of the hop.
      swapPending = false
      const next = (modelIndex + 1) % options.shapes.length
      setModel(next)
      squashVelocity = 6
      options.onSwap?.(next)
    }
    if (hop < 0) {
      if (hopVelocity < -0.8) squashVelocity -= Math.abs(hopVelocity) * 1.4
      hop = 0
      hopVelocity = 0
    }
    squashVelocity += ((1 - squash) * 170 - squashVelocity * 11) * dt
    squash += squashVelocity * dt

    render()
  }

  const start = () => {
    if (running) return
    running = true
    last = performance.now()
    frameId = requestAnimationFrame(tick)
  }
  const stop = () => {
    running = false
    cancelAnimationFrame(frameId)
  }

  setModel(0)
  const resizeObserver = new ResizeObserver(() => {
    resize()
    if (!running) render()
  })
  resizeObserver.observe(container)
  const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
  visibility.observe(container)
  resize()
  render()

  return () => {
    stop()
    resizeObserver.disconnect()
    visibility.disconnect()
    area.removeEventListener('pointermove', onPointerMove)
    area.removeEventListener('pointerleave', onPointerLeave)
    area.removeEventListener('pointerenter', onPointerEnter)
    canvas.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    model.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose()
    })
    black.dispose()
    white.dispose()
    photo?.dispose()
    photoMaterial.dispose()
    for (const material of wrapMaterials) {
      material.map?.dispose()
      material.dispose()
    }
    releaseRenderer()
    canvas.remove()
  }
}
