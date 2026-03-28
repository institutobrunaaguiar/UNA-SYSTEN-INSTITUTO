"use client"

import { cn } from "@/lib/utils"
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import Link from "next/link"
import { useRef, useState } from "react"

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string; active?: boolean }[]
  desktopClassName?: string
  mobileClassName?: string
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  )
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string; active?: boolean }[]
  className?: string
}) => {
  return (
    <div className={cn("flex items-center justify-around w-full", className)}>
      {items.map((item) => (
        <Link
          href={item.href}
          key={item.title}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-colors",
            item.active
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "h-5 w-5",
            item.active && "scale-110"
          )}>
            {item.icon}
          </div>
          <span className={cn(
            "text-[9px] font-medium tracking-wide",
            item.active ? "text-primary" : "text-muted-foreground"
          )}>
            {item.title}
          </span>
        </Link>
      ))}
    </div>
  )
}

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string; active?: boolean }[]
  className?: string
}) => {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "hidden md:flex h-14 gap-3 items-end rounded-2xl bg-card/80 backdrop-blur-md border border-border px-4 pb-2.5",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          {...item}
        />
      ))}
    </motion.div>
  )
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  active,
}: {
  mouseX: MotionValue
  title: string
  icon: React.ReactNode
  href: string
  active?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(distance, [-150, 0, 150], [36, 56, 36])
  const heightTransform = useTransform(distance, [-150, 0, 150], [36, 56, 36])
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [18, 28, 18])
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [18, 28, 18])

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 })
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 })
  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 })
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 })

  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center relative",
          active
            ? "bg-primary/15 border border-primary/30"
            : "bg-secondary/80 border border-border"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-card border border-border text-foreground absolute left-1/2 -translate-x-1/2 -top-8 w-fit text-xs"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
        {active && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
        )}
      </motion.div>
    </Link>
  )
}
