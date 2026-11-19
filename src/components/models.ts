// The black models of the page headers, built from simple shapes. Each one
// has a single white detail: a screen, cushions, buttons, eyes…

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ShapeName } from '../../site.config.ts'

export interface Model {
  group: THREE.Group
  /** The turn it starts at, so its white detail shows. */
  yaw: number
}

type Vec = [number, number, number]

class Builder {
  readonly group = new THREE.Group()
  constructor(
    private black: THREE.Material,
    private white: THREE.Material,
  ) {}

  add(geometry: THREE.BufferGeometry, color: 'black' | 'white', position: Vec = [0, 0, 0], rotation: Vec = [0, 0, 0], parent: THREE.Object3D = this.group) {
    const mesh = new THREE.Mesh(geometry, color === 'black' ? this.black : this.white)
    mesh.position.set(...position)
    mesh.rotation.set(...rotation)
    parent.add(mesh)
    return mesh
  }
}

const roundedBox = (width: number, height: number, depth: number, radius: number) =>
  new RoundedBoxGeometry(width, height, depth, 5, radius)

function laptop(b: Builder): Omit<Model, 'group'> {
  b.add(roundedBox(2.3, 0.1, 1.5, 0.045), 'black', [0, 0.05, 0])
  const lid = new THREE.Group()
  lid.position.set(0, 0.1, -0.72)
  lid.rotation.x = -0.26
  b.group.add(lid)
  b.add(roundedBox(2.3, 1.5, 0.08, 0.04), 'black', [0, 0.75, 0], [0, 0, 0], lid)
  // The screen is white. A picture can show on it (SceneOptions.screenImage),
  // fitted inside, with white bars on the sides.
  b.add(new THREE.PlaneGeometry(2.04, 1.28), 'white', [0, 0.77, 0.042], [0, 0, 0], lid)
  const picture = b.add(new THREE.PlaneGeometry(1, 1), 'white', [0, 0.77, 0.043], [0, 0, 0], lid)
  picture.name = 'screen'
  picture.userData.box = { width: 2.04, height: 1.28 }
  picture.visible = false
  return { yaw: -0.35 }
}

function headphones(b: Builder): Omit<Model, 'group'> {
  b.add(new THREE.TorusGeometry(0.9, 0.09, 20, 90, Math.PI), 'black', [0, 0.5, 0])
  for (const side of [-1, 1]) {
    b.add(roundedBox(0.12, 0.42, 0.16, 0.05), 'black', [side * 0.9, 0.36, 0])
    b.add(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 56), 'black', [side * 0.98, -0.02, 0], [0, 0, Math.PI / 2])
    // The cushion, on the inner side of the cup.
    b.add(new THREE.TorusGeometry(0.31, 0.11, 20, 56), 'white', [side * 0.76, -0.02, 0], [0, Math.PI / 2, 0])
  }
  return { yaw: 0.75 }
}

function gamepad(b: Builder): Omit<Model, 'group'> {
  // One smooth outline, shoulders and grips, drawn on the right half and
  // mirrored: each segment is a cubic curve [control 1, control 2, end].
  type Point = [number, number]
  const top: Point = [0, 0.48]
  const right: Array<[Point, Point, Point]> = [
    [[0.25, 0.46], [0.55, 0.5], [0.78, 0.54]],
    [[1.0, 0.57], [1.16, 0.4], [1.19, 0.14]],
    [[1.23, -0.2], [1.3, -0.66], [1.06, -0.79]],
    [[0.86, -0.9], [0.68, -0.8], [0.6, -0.6]],
    [[0.53, -0.42], [0.45, -0.22], [0.3, -0.2]],
    [[0.2, -0.19], [0.1, -0.18], [0, -0.18]],
  ]
  const outline = new THREE.Shape()
  outline.moveTo(...top)
  for (const [c1, c2, end] of right) outline.bezierCurveTo(...c1, ...c2, ...end)
  // Back along the left half: the same curves, mirrored and reversed.
  for (let i = right.length - 1; i >= 0; i--) {
    const [c1, c2] = right[i]
    const start = i === 0 ? top : right[i - 1][2]
    outline.bezierCurveTo(-c2[0], c2[1], -c1[0], c1[1], -start[0], start[1])
  }
  const depth = 0.3
  const bevel = 0.12
  const body = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.1,
    bevelSegments: 8,
    curveSegments: 48,
  })
  body.translate(0, 0, -depth / 2)
  b.add(body, 'black')

  const front = depth / 2 + bevel
  // The cross, on the left.
  b.add(roundedBox(0.46, 0.15, 0.06, 0.035), 'white', [-0.62, 0.1, front])
  b.add(roundedBox(0.15, 0.46, 0.06, 0.035), 'white', [-0.62, 0.1, front])
  // Four buttons, on the right.
  const button = new THREE.CylinderGeometry(0.085, 0.085, 0.06, 32)
  for (const [x, y] of [[0, 0.165], [0, -0.165], [0.165, 0], [-0.165, 0]]) {
    b.add(button, 'white', [0.62 + x, 0.1 + y, front], [Math.PI / 2, 0, 0])
  }
  return { yaw: -0.25 }
}

function sync(b: Builder): Omit<Model, 'group'> {
  // Two arrows chasing each other clockwise around a circle, with white heads.
  const radius = 0.9
  const tube = 0.13
  const bodyArc = THREE.MathUtils.degToRad(120)
  const headLength = 0.55
  for (const turn of [0, Math.PI]) {
    const head = THREE.MathUtils.degToRad(62) + turn
    b.add(new THREE.TorusGeometry(radius, tube, 24, 96, bodyArc), 'black', [0, 0, 0], [0, 0, head])
    const tail = head + bodyArc
    b.add(new THREE.SphereGeometry(tube, 24, 16), 'black', [Math.cos(tail) * radius, Math.sin(tail) * radius, 0])
    // Clockwise, the arrow points along (sin, -cos) of its angle.
    const tip = new THREE.Vector2(Math.sin(head), -Math.cos(head))
    b.add(
      new THREE.ConeGeometry(0.32, headLength, 48),
      'white',
      [Math.cos(head) * radius + tip.x * (headLength / 2), Math.sin(head) * radius + tip.y * (headLength / 2), 0],
      [0, 0, head + Math.PI],
    )
  }
  return { yaw: -0.3 }
}

function robot(b: Builder): Omit<Model, 'group'> {
  b.add(roundedBox(1.6, 1.3, 1.25, 0.3), 'black', [0, 0, 0])
  for (const side of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 36), 'black', [side * 0.88, 0.05, 0], [0, 0, Math.PI / 2])
    // The eyes.
    b.add(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 40), 'white', [side * 0.34, 0.12, 0.6], [Math.PI / 2, 0, 0])
  }
  b.add(roundedBox(0.56, 0.1, 0.08, 0.04), 'white', [0, -0.3, 0.61])
  b.add(new THREE.CylinderGeometry(0.045, 0.045, 0.46, 16), 'black', [0, 0.86, 0])
  b.add(new THREE.SphereGeometry(0.14, 24, 16), 'black', [0, 1.12, 0])
  b.add(new THREE.CylinderGeometry(0.32, 0.4, 0.6, 36), 'black', [0, -0.9, 0])
  return { yaw: -0.4 }
}

function arcade(b: Builder): Omit<Model, 'group'> {
  // The side of the cabinet, as seen from the left: x is toward the front.
  const side: Array<[number, number]> = [
    [-0.55, 0],
    [0.45, 0],
    [0.45, 0.95],
    [0.7, 1.05],
    [0.68, 1.2],
    [0.28, 1.3],
    [0.16, 1.95],
    [0.44, 2.02],
    [0.44, 2.34],
    [-0.55, 2.34],
  ]
  const outline = new THREE.Shape(side.map(([x, y]) => new THREE.Vector2(x, y)))
  const width = 1.1
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: width,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2,
  })
  body.translate(0, 0, -width / 2).rotateY(-Math.PI / 2)
  b.add(body, 'black')
  // The screen, leaning back between the control panel and the marquee.
  const tilt = Math.atan2(0.12, 0.65)
  b.add(new THREE.BoxGeometry(0.84, 0.6, 0.02), 'white', [0, 1.627, 0.235], [-tilt, 0, 0])
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 12), 'black', [-0.22, 1.32, 0.5])
  b.add(new THREE.SphereGeometry(0.08, 20, 12), 'black', [-0.22, 1.44, 0.5])
  return { yaw: 0.55 }
}

function pin(b: Builder): Omit<Model, 'group'> {
  const radius = 0.62
  const neck = 0.535
  const headY = 1.25
  const baseY = headY - Math.sqrt(radius ** 2 - neck ** 2)
  b.add(new THREE.SphereGeometry(radius, 56, 40), 'black', [0, headY, 0])
  b.add(new THREE.ConeGeometry(neck, baseY, 56), 'black', [0, baseY / 2, 0], [Math.PI, 0, 0])
  // The dot, showing on both sides.
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 1.16, 48), 'white', [0, headY, 0], [Math.PI / 2, 0, 0])
  return { yaw: -0.2 }
}

function book(b: Builder): Omit<Model, 'group'> {
  // A stack of three closed books, their white pages toward you.
  const books: Array<{ width: number; thickness: number; depth: number; y: number; turn: number }> = [
    { width: 2.0, thickness: 0.42, depth: 1.3, y: 0, turn: 0.04 },
    { width: 1.8, thickness: 0.34, depth: 1.2, y: 0.42, turn: -0.12 },
    { width: 1.9, thickness: 0.38, depth: 1.25, y: 0.76, turn: 0.1 },
  ]
  const cover = 0.05
  for (const { width, thickness, depth, y, turn } of books) {
    const one = new THREE.Group()
    one.position.y = y + thickness / 2
    one.rotation.y = turn
    b.group.add(one)
    b.add(roundedBox(width, cover, depth, 0.02), 'black', [0, thickness / 2 - cover / 2, 0], [0, 0, 0], one)
    b.add(roundedBox(width, cover, depth, 0.02), 'black', [0, -thickness / 2 + cover / 2, 0], [0, 0, 0], one)
    b.add(roundedBox(width, thickness, cover * 1.6, 0.025), 'black', [0, 0, -depth / 2 + cover * 0.8], [0, 0, 0], one)
    b.add(new THREE.BoxGeometry(width - 0.1, thickness - cover * 2, depth - 0.12), 'white', [0, 0, 0.02], [0, 0, 0], one)
  }
  return { yaw: -0.3 }
}

function microphone(b: Builder): Omit<Model, 'group'> {
  b.add(new THREE.CapsuleGeometry(0.42, 0.78, 14, 40), 'black', [0, 1.46, 0])
  // The ring between the grille and the body.
  b.add(new THREE.CylinderGeometry(0.44, 0.44, 0.13, 48), 'white', [0, 1.36, 0])
  b.add(new THREE.TorusGeometry(0.6, 0.055, 14, 56, Math.PI), 'black', [0, 1.2, 0], [0, 0, Math.PI])
  for (const side of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), 'black', [side * 0.6, 1.2, 0])
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 20), 'black', [side * 0.5, 1.26, 0], [0, 0, Math.PI / 2])
  }
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16), 'black', [0, 0.36, 0])
  b.add(new THREE.CylinderGeometry(0.5, 0.56, 0.12, 48), 'black', [0, 0.06, 0])
  return { yaw: 0 }
}

const builders: Record<ShapeName, (b: Builder) => Omit<Model, 'group'>> = {
  laptop,
  headphones,
  gamepad,
  sync,
  robot,
  arcade,
  pin,
  book,
  microphone,
}

/** Builds a model, centered on the vertical axis, standing on y = 0. */
export function buildModel(shape: ShapeName, black: THREE.Material, white: THREE.Material): Model {
  const builder = new Builder(black, white)
  const { yaw } = (builders[shape] ?? pin)(builder)
  const group = builder.group
  const box = new THREE.Box3().setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  for (const child of group.children) {
    child.position.x -= center.x
    child.position.z -= center.z
    child.position.y -= box.min.y
  }
  return { group, yaw }
}
