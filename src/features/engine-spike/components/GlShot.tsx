import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type * as React from 'react'
import * as THREE from 'three'

import {
  HERO_CAST,
  LANDING_RECORDS,
  heroTint,
  landingPressing,
  pressingSurface,
} from '#/features/landing/content/landing.content'
import { coverArt } from '#/features/landing/cover-art.utils'

import {
  DISC,
  FLOOR_Y,
  SET,
  SLEEVE,
  cameraPosition,
  sampleShot,
  viewDepth,
} from '../craft.score'
import type { Framing, SetSleeve, ShotPose } from '../craft.score'
import { paintCover } from '../cover-canvas'
import { LensBlurEffect } from '../lens-blur'
import { STAGE_MASK } from '../stage-mask'
import { lightDirection } from '../dom-bake'
import type { ShotClock } from '../shot-clock'
import { DomShot } from './DomShot'

type Theme = 'light' | 'dark'

const readTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ||
  (!document.documentElement.classList.contains('light') &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light'

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])
  return theme
}

const pageGround = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim()

// Any CSS colour (oklch included) as a three colour, through the canvas
const cssColour = (css: string) => {
  const ctx = canvasOf(1).getContext('2d', { willReadFrequently: true })
  if (!ctx) return new THREE.Color(css)
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new THREE.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace,
  )
}

const canvasOf = (size: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

// The Cover as a texture, repainted for the theme once the face is loaded
const useCoverTexture = (slot: number, theme: Theme, fontsReady: boolean) =>
  useMemo(() => {
    const { index } = HERO_CAST[slot]
    const record = LANDING_RECORDS[index]
    const canvas = canvasOf(1024)
    paintCover(canvas, {
      seed: landingPressing(index).id,
      theme,
      artist: record.artist,
      title: record.title,
    })
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    void fontsReady
    return texture
  }, [slot, theme, fontsReady])

// The disc's face: Vinyl colour, faint groove rings, the run-out, the label
// in the Cover tint with its printed line, the centre hole
const discFace = (surface: string, tint: string, theme: Theme) => {
  const size = 1024
  const canvas = canvasOf(size)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const c = size / 2
  ctx.fillStyle = surface
  ctx.beginPath()
  ctx.arc(c, c, c, 0, Math.PI * 2)
  ctx.fill()
  // Fine grooves, and the faint gaps between tracks
  for (let r = c * 0.97; r > c * 0.36; r -= 1.6) {
    const gap = [0.8, 0.66, 0.53].some((g) => Math.abs(r / c - g) < 0.004)
    ctx.strokeStyle = gap ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = gap ? 2 : 0.8
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = tint
  ctx.beginPath()
  ctx.arc(c, c, c * 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillRect(c - c * 0.15, c - c * 0.22, c * 0.3, 5)
  ctx.fillStyle = theme === 'dark' ? '#0e0e0d' : '#f5f5f3'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.028, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

// Brushed-metal style anisotropy, brushed along the grooves: direction is
// tangential, strength off on the label
const grooveDirection = () => {
  const size = 512
  const canvas = canvasOf(size)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [dx, dy] = [(x + 0.5) / size - 0.5, 0.5 - (y + 0.5) / size]
      const r = Math.hypot(dx, dy) || 1
      const i = (y * size + x) * 4
      img.data[i] = Math.round((-dy / r) * 127.5 + 127.5)
      img.data[i + 1] = Math.round((dx / r) * 127.5 + 127.5)
      // Off on the label, easing in over the run-out
      img.data[i + 2] = Math.round(
        255 * Math.min(1, Math.max(0, (r * 2 - 0.35) / 0.04)),
      )
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

// Gloss: the vinyl is glossy, the paper label matte (roughness in green)
const discRoughness = () => {
  const size = 256
  const canvas = canvasOf(size)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const c = size / 2
  ctx.fillStyle = 'rgb(0, 77, 0)'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'rgb(0, 255, 0)'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.345, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

const HERO = (() => {
  const { index, tintHue } = HERO_CAST[SET[0].cast]
  return {
    surface: pressingSurface(landingPressing(index)).background,
    tint: heroTint(tintHue),
  }
})()

const Disc = ({ theme }: { theme: Theme }) => {
  const { top, side } = useMemo(() => {
    const map = new THREE.CanvasTexture(
      discFace(HERO.surface, HERO.tint, theme),
    )
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    const direction = new THREE.CanvasTexture(grooveDirection())
    return {
      top: new THREE.MeshPhysicalMaterial({
        map,
        roughness: 1,
        roughnessMap: new THREE.CanvasTexture(discRoughness()),
        metalness: 0,
        // Reflections stay faint; the key light draws the streak
        envMapIntensity: 0.25,
        // Glossier than plain plastic, so the grooves' streak reads on a
        // light Vinyl colour as it does on black
        ior: 2.2,
        specularColor: new THREE.Color(1.5, 1.5, 1.5),
        anisotropy: 0.9,
        anisotropyMap: direction,
        specularIntensity: 1,
      }),
      side: new THREE.MeshStandardMaterial({
        color: cssColour(HERO.surface).multiplyScalar(0.55),
        roughness: 0.5,
      }),
    }
  }, [theme])
  return (
    <mesh rotation-x={Math.PI / 2} castShadow material={[side, top, side]}>
      <cylinderGeometry
        args={[DISC.diameter / 2, DISC.diameter / 2, DISC.depth, 160, 1]}
      />
    </mesh>
  )
}

const SleeveMesh = ({
  sleeve,
  theme,
  fontsReady,
}: {
  sleeve: SetSleeve
  theme: Theme
  fontsReady: boolean
}) => {
  const cover = useCoverTexture(sleeve.cast, theme, fontsReady)
  const materials = useMemo(() => {
    const ground = cssColour(
      coverArt(landingPressing(HERO_CAST[sleeve.cast].index).id, theme).ground,
    ).multiplyScalar(0.8)
    const edge = new THREE.MeshStandardMaterial({
      color: ground,
      roughness: 0.8,
    })
    const mouth = new THREE.MeshStandardMaterial({
      color: '#111',
      roughness: 1,
    })
    const front = new THREE.MeshPhysicalMaterial({
      map: cover,
      roughness: 0.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.12,
    })
    // Box faces: +x, -x, +y, -y, +z, -z
    return [mouth, edge, edge, edge, front, edge]
  }, [cover, sleeve.cast, theme])
  return (
    <mesh castShadow receiveShadow material={materials}>
      <boxGeometry args={[SLEEVE.size, SLEEVE.size, SLEEVE.depth]} />
    </mesh>
  )
}

// `?post=0` renders without post-processing, to compare
const POST = new URLSearchParams(window.location.search).get('post') !== '0'

const deg = (d: number) => (d * Math.PI) / 180

interface RigProps {
  clock: ShotClock
  framing: Framing
  lensRef: React.RefObject<LensBlurEffect>
  exposureRef: React.RefObject<HTMLDivElement | null>
}

// Every frame: sample the score, pose the camera, the hero pair, the light
// and the lens
const Rig = ({
  clock,
  framing,
  lensRef,
  exposureRef,
  heroRef,
  discRef,
  spinRef,
}: RigProps & {
  heroRef: React.RefObject<THREE.Group | null>
  discRef: React.RefObject<THREE.Group | null>
  spinRef: React.RefObject<THREE.Group | null>
}) => {
  const light = useRef<THREE.DirectionalLight>(null)
  const frames = useRef(0)
  useFrame(({ camera, viewport }) => {
    // Time to first frame (the second tick: the first render, shaders
    // compiled, is done), read by the DevTools probe
    frames.current += 1
    if (frames.current === 1) performance.mark('shot:gl:first-tick')
    if (frames.current === 2) performance.mark('shot:gl:first-frame')
    const pose: ShotPose = sampleShot(clock.ms(), framing)
    const eye = cameraPosition(pose.camera)
    const { target, roll, fov } = pose.camera
    camera.position.set(eye.x, eye.y, eye.z)
    camera.lookAt(target.x, target.y, target.z)
    camera.rotateZ(deg(roll))
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    heroRef.current?.position.set(pose.sleeveX, 0, 0)
    discRef.current?.position.set(pose.discX, 0, pose.discZ)
    spinRef.current?.rotation.set(0, 0, -deg(pose.spin))
    const l = lightDirection(pose.light)
    light.current?.position.set(l.x * 6, l.y * 6, l.z * 6)
    if (light.current) light.current.intensity = 1.4 * pose.light.strength
    // Same lens as the DOM: focus distance and blur from the score
    const lens = lensRef.current
    lens.focus = viewDepth(pose.camera, pose.focus)
    lens.aperture = 0.42 * pose.aperture
    lens.maxBlur = 16 * viewport.dpr
    if (exposureRef.current)
      exposureRef.current.style.opacity = String(1 - pose.exposure)
  })
  return (
    <directionalLight
      ref={light}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-3}
      shadow-camera-right={3}
      shadow-camera-top={3}
      shadow-camera-bottom={-3}
      shadow-bias={-0.0004}
      shadow-radius={8}
      shadow-blurSamples={16}
    />
  )
}

// The key's strip softbox, as the reflections see it
const StripLight = ({
  clock,
  framing,
}: {
  clock: ShotClock
  framing: Framing
}) => {
  const strip = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const pose = sampleShot(clock.ms(), framing)
    const l = lightDirection({ ...pose.light, elevation: 8 })
    strip.current?.position.set(l.x * 5, l.y * 5 + 0.5, l.z * 5)
    strip.current?.lookAt(0, 0, 0)
  })
  return (
    <Lightformer ref={strip} form="rect" intensity={16} scale={[0.5, 6, 1]} />
  )
}

// Redraw once whenever the clock seeks or pauses
const Invalidate = ({ clock }: { clock: ShotClock }) => {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => clock.subscribe(() => invalidate()), [clock, invalidate])
  return null
}

const Scene = ({
  clock,
  framing,
  theme,
  exposureRef,
}: {
  clock: ShotClock
  framing: Framing
  theme: Theme
  exposureRef: React.RefObject<HTMLDivElement | null>
}) => {
  const hero = useRef<THREE.Group>(null)
  const disc = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const [lens] = useState(() => new LensBlurEffect())
  const lensRef = useRef(lens)
  const get = useThree((s) => s.get)
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    void document.fonts
      .load("700 40px 'Familjen Grotesk'")
      .then(() => setFontsReady(true))
  }, [])
  useEffect(() => {
    const { scene } = get()
    scene.background = cssColour(pageGround())
    // Reflections only: the env lights speculars, barely the diffuse
    scene.environmentIntensity = 0.35
    void theme
  }, [get, theme])

  const heroSleeve = SET[0]
  return (
    <>
      <hemisphereLight
        args={[
          theme === 'dark' ? '#cfd3dc' : '#ffffff',
          theme === 'dark' ? '#1a1816' : '#d8d4cc',
          theme === 'dark' ? 0.38 : 0.42,
        ]}
      />
      <Invalidate clock={clock} />
      <Rig
        clock={clock}
        framing={framing}
        lensRef={lensRef}
        exposureRef={exposureRef}
        heroRef={hero}
        discRef={disc}
        spinRef={spin}
      />
      {/* Studio reflections: a soft top light, fills, and the key's strip
          softbox moving with the key; re-rendered every frame (128px) */}
      <Environment resolution={128} frames={Infinity}>
        <Lightformer
          intensity={1.2}
          position={[0, 4, 1]}
          scale={[6, 2, 1]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          intensity={0.4}
          position={[-4, 1, 1]}
          scale={[2, 4, 1]}
          rotation-y={Math.PI / 2}
        />
        <StripLight clock={clock} framing={framing} />
      </Environment>
      <group
        position={[heroSleeve.x, 0, heroSleeve.z]}
        rotation-y={deg(heroSleeve.yaw)}
      >
        <group ref={disc}>
          <group ref={spin}>
            <Disc theme={theme} />
          </group>
        </group>
        <group ref={hero}>
          <SleeveMesh
            sleeve={heroSleeve}
            theme={theme}
            fontsReady={fontsReady}
          />
        </group>
      </group>
      {SET.slice(1).map((s) => (
        <group key={s.key} position={[s.x, 0, s.z]} rotation-y={deg(s.yaw)}>
          <SleeveMesh sleeve={s} theme={theme} fontsReady={fontsReady} />
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={theme === 'dark' ? 0.6 : 0.24} />
      </mesh>
      <EffectComposer multisampling={0} enabled={POST}>
        <primitive object={lens} dispose={null} />
        <Bloom
          mipmapBlur
          luminanceThreshold={1}
          luminanceSmoothing={0.2}
          intensity={0.7}
        />
      </EffectComposer>
    </>
  )
}

interface GlShotProps {
  framing: Framing
  clock: ShotClock
}

const hasWebGl = () => {
  // `?webgl=0` forces the fallback, to check it
  if (new URLSearchParams(window.location.search).get('webgl') === '0')
    return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

// Variant B: the shot in WebGL. three.js through react-three-fiber: real
// geometry, a perspective camera on the same rig, an anisotropic disc,
// shadow-mapped key light, depth of field and bloom in post.
export const GlShot = ({ framing, clock }: GlShotProps) => {
  const theme = useTheme()
  const exposure = useRef<HTMLDivElement>(null)
  const [webgl] = useState(hasWebGl)
  const playing = useSyncExternalStore(clock.subscribe, clock.playing)
  // No WebGL: the DOM film plays instead, so WebGL can't ship alone
  if (!webgl) return <DomShot framing={framing} clock={clock} />
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden bg-background"
      style={{
        aspectRatio: framing === 'wide' ? '16 / 9' : '4 / 5',
        maskImage: STAGE_MASK,
        maskComposite: 'intersect',
      }}
    >
      <Canvas
        // Paused (and the reduced-motion still): render on demand only
        frameloop={playing ? 'always' : 'demand'}
        shadows="variance"
        dpr={[1, 2]}
        camera={{ fov: 26, near: 0.1, far: 40 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <Scene
          clock={clock}
          framing={framing}
          theme={theme}
          exposureRef={exposure}
        />
      </Canvas>
      <div
        ref={exposure}
        className="pointer-events-none absolute inset-0 bg-background"
      />
    </div>
  )
}
