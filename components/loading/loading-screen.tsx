"use client"

import { useEffect, useRef, useState } from "react"

const BG_COLOR = 0x536648 // verde oliva
const BG_HEX = "#536648"

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    let cancelled = false

    async function init() {
      const THREE = await import("three")
      if (cancelled || !wrapRef.current) return

      const canvassize = Math.min(window.innerWidth - 32, window.innerHeight - 100, 500)
      const length = 30
      const radius = 5.6
      const rotatevalue = 0.035
      const pi2 = Math.PI * 2

      let acceleration = 0
      let animatestep = 0
      let toend = false

      const group = new THREE.Group()

      const camera = new THREE.PerspectiveCamera(65, 1, 1, 10000)
      camera.position.z = 150

      const scene = new THREE.Scene()
      scene.add(group)

      // Infinity curve
      class InfinityCurve extends THREE.Curve<THREE.Vector3> {
        getPoint(percent: number) {
          const x = length * Math.sin(pi2 * percent)
          const y = radius * Math.cos(pi2 * 3 * percent)
          let t = (percent % 0.25) / 0.25
          t = (percent % 0.25) - (2 * (1 - t) * t * -0.0185 + t * t * 0.25)
          if (Math.floor(percent / 0.25) === 0 || Math.floor(percent / 0.25) === 2) {
            t *= -1
          }
          const z = radius * Math.sin(pi2 * 2 * (percent - t))
          return new THREE.Vector3(x, y, z)
        }
      }

      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(new InfinityCurve(), 200, 1.1, 2, true),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      group.add(mesh)

      const ringcover = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 15, 1),
        new THREE.MeshBasicMaterial({ color: BG_COLOR, opacity: 0, transparent: true })
      )
      ringcover.position.x = length + 1
      ringcover.rotation.y = Math.PI / 2
      group.add(ringcover)

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(4.3, 5.55, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true })
      )
      ring.position.x = length + 1.1
      ring.rotation.y = Math.PI / 2
      group.add(ring)

      // Fake shadow
      for (let i = 0; i < 10; i++) {
        const plain = new THREE.Mesh(
          new THREE.PlaneGeometry(length * 2 + 1, radius * 3, 1),
          new THREE.MeshBasicMaterial({ color: BG_COLOR, transparent: true, opacity: 0.13 })
        )
        plain.position.z = -2.5 + i * 0.5
        group.add(plain)
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(canvassize, canvassize)
      renderer.setClearColor(BG_HEX)

      if (!wrapRef.current) return
      wrapRef.current.appendChild(renderer.domElement)

      function easing(t: number, b: number, c: number, d: number) {
        const t2 = t / (d / 2)
        if (t2 < 1) return (c / 2) * t2 * t2 + b
        const t3 = t2 - 2
        return (c / 2) * (t3 * t3 * t3 + 2) + b
      }

      function render() {
        animatestep = Math.max(0, Math.min(240, toend ? animatestep + 1 : animatestep - 4))
        acceleration = easing(animatestep, 0, 1, 240)

        if (acceleration > 0.35) {
          const progress = (acceleration - 0.35) / 0.65
          group.rotation.y = (-Math.PI / 2) * progress
          group.position.z = 50 * progress
          const fadeProgress = Math.max(0, (acceleration - 0.97) / 0.03)
          ;(mesh.material as THREE.MeshBasicMaterial).opacity = 1 - fadeProgress
          ;(ringcover.material as THREE.MeshBasicMaterial).opacity = fadeProgress
          ;(ring.material as THREE.MeshBasicMaterial).opacity = fadeProgress
          ring.scale.x = ring.scale.y = 0.9 + 0.1 * fadeProgress
        }

        renderer.render(scene, camera)
      }

      let animId: number
      function animate() {
        if (cancelled) return
        mesh.rotation.x += rotatevalue + acceleration
        render()
        animId = requestAnimationFrame(animate)
      }

      animate()

      // Auto-start the "end" animation after 2s
      const autoTimer = setTimeout(() => {
        toend = true
      }, 2000)

      // Also allow click/tap to trigger
      function startEnd() {
        toend = true
      }

      document.addEventListener("mousedown", startEnd)
      document.addEventListener("touchstart", startEnd)

      // Watch for animation completion — when ring is fully visible
      const checkComplete = setInterval(() => {
        if (acceleration >= 0.999) {
          clearInterval(checkComplete)
          setFading(true)
          setTimeout(() => {
            onComplete()
          }, 600)
        }
      }, 50)

      // Cleanup
      return () => {
        cancelled = true
        clearTimeout(autoTimer)
        clearInterval(checkComplete)
        cancelAnimationFrame(animId)
        document.removeEventListener("mousedown", startEnd)
        document.removeEventListener("touchstart", startEnd)
        renderer.dispose()
      }
    }

    const cleanup = init()

    return () => {
      cancelled = true
      cleanup.then((fn) => fn?.())
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: BG_HEX }}
    >
      <div
        ref={wrapRef}
        className="relative w-full max-w-[500px] aspect-square"
      />
      <p className="absolute bottom-6 text-white/40 text-[11px] tracking-[0.15em] uppercase">
        Clique para entrar
      </p>
    </div>
  )
}
