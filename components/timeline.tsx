'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

interface TimelineProps {
  dates: string[]
}

export function Timeline({ dates }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const dotY = useTransform(smoothProgress, [0, 1], ['0%', '100%'])

  const [currentDateIndex, setCurrentDateIndex] = useState(0)

  useEffect(() => {
    return smoothProgress.on("change", v => {
      const index = Math.min(Math.floor(v * dates.length), dates.length - 1)
      setCurrentDateIndex(index)
    })
  }, [smoothProgress, dates])

  return (
    <div ref={containerRef} className="relative h-full">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      <motion.div
        className="absolute left-0 w-3 h-3 -ml-[5px] rounded-full bg-foreground"
        style={{ top: dotY }}
      />
      <motion.div
        className="absolute left-6 text-sm text-muted-foreground"
        style={{ 
          top: dotY,
          transform: 'translateY(-50%)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {dates[currentDateIndex]}
      </motion.div>
    </div>
  )
}

