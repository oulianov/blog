// Makes a .webp copy of every JPEG and PNG in public/assets, next to it,
// at most 1600 px wide, and for wider pictures a small one for phones,
// 800 px wide (name-800w.webp). A copy that isn't at least 10% smaller is dropped,
// and GIFs stay GIFs (as WebP, the animated one came out bigger).
// The build serves the .webp in place of the original when it exists
// (plugins/content.ts). Link preview images (og.*, og-default.*) stay as
// they are.
//
//   pnpm webp

import { readdirSync, rmSync, statSync, type Stats } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const assets = path.resolve(import.meta.dirname, '..', 'public', 'assets')
const maxWidth = 1600
const smallWidth = 800

function* pictures(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* pictures(file)
    else if (/\.(jpe?g|png)$/i.test(entry.name) && !/^og(-default)?\./i.test(entry.name)) yield file
  }
}

let before = 0
let after = 0
for (const file of pictures(assets)) {
  const target = file.replace(/\.\w+$/, '.webp')
  const source = statSync(file)
  let existing: Stats | undefined
  try {
    existing = statSync(target)
  } catch {}
  // A newer copy is up to date; none, or an older one, gets (re)made.
  if (!existing || existing.mtimeMs < source.mtimeMs) {
    const isPhoto = /\.jpe?g$/i.test(file)
    await sharp(file)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: isPhoto ? 80 : 88, effort: 6 })
      .toFile(target)
    existing = statSync(target)
    const kept = existing.size < source.size * 0.9
    console.log(
      `${path.relative(assets, target)}: ${Math.round(source.size / 1024)} → ${Math.round(existing.size / 1024)} KB` +
        (kept ? '' : ' (not smaller enough, dropped)'),
    )
    if (!kept) {
      rmSync(target)
      existing = undefined
    }
  }
  before += source.size
  after += existing?.size ?? source.size

  // The small copy, for pictures wider than it.
  const small = file.replace(/\.\w+$/, `-${smallWidth}w.webp`)
  const { width = 0 } = await sharp(file).metadata()
  let smallExisting: Stats | undefined
  try {
    smallExisting = statSync(small)
  } catch {}
  if (existing && width > smallWidth && (!smallExisting || smallExisting.mtimeMs < source.mtimeMs)) {
    await sharp(file)
      .resize({ width: smallWidth })
      .webp({ quality: /\.jpe?g$/i.test(file) ? 80 : 88, effort: 6 })
      .toFile(small)
    console.log(`${path.relative(assets, small)}: ${Math.round(statSync(small).size / 1024)} KB`)
  }
}
console.log(`total: ${Math.round(before / 1024)} → ${Math.round(after / 1024)} KB`)
