// src/components/Hero.tsx
import React from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Framer Motion: use cubic-bezier array for type-safe easing
const easeOutBezier = [0.16, 1, 0.3, 1] as const

const fadeUp = (delay = 0): MotionProps => ({
    initial: { opacity: 0, y: 12, scale: 0.99 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: easeOutBezier, delay },
    },
})

export default function Hero() {
    const { t } = useTranslation()

    return (
        <section className="bg-base relative">
            {/* subtle background grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.2) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />
            {/* accent glow ring */}
            <div
                className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl"
                style={{ background: 'radial-gradient(closest-side, #00E0FF33, transparent)' }}
            />

            <div className="container-proton py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
                {/* Left */}
                <div>
                    <motion.h1
                        {...fadeUp(0)}
                        className="text-4xl md:text-5xl font-extrabold leading-tight"
                    >
                        {t('hero.title')}
                    </motion.h1>

                    <motion.p {...fadeUp(0.1)} className="mt-4 text-white/70">
                        {t('hero.subtitle')}
                    </motion.p>

                    <motion.div {...fadeUp(0.18)} className="mt-6 flex flex-wrap gap-3">
                        <a href="#get-started" className="btn btn-primary focus-ring">
                            {t('hero.ctaPrimary')}
                        </a>
                        <a href="#products" className="btn btn-ghost focus-ring">
                            {t('hero.ctaSecondary')}
                        </a>
                    </motion.div>

                    <motion.div {...fadeUp(0.24)} className="mt-10 glass rounded-xl p-5">
                        <h3 className="text-lg font-semibold">{t('hero.leftTitle')}</h3>
                        <p className="mt-2 text-white/70">{t('hero.leftDesc')}</p>
                    </motion.div>
                </div>

                {/* Right: product image placeholder */}
                <motion.div {...fadeUp(0.12)} className="relative">
                    <div
                        role="img"
                        aria-label={t('hero.placeholderAlt')}
                        className="aspect-video w-full rounded-2xl card grid place-items-center overflow-hidden relative"
                    >
                        <div className="text-white/60">Product Image Placeholder</div>

                        {/* sheen */}
                        <div
                            className="absolute inset-0 -skew-x-12"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent 30%, rgba(255,255,255,.18), transparent 70%)',
                                transform: 'translateX(-60%)',
                                animation: 'sheen 3s ease-in-out 1.2s infinite',
                            }}
                        />
                        <style>{`
              @keyframes sheen {
                0%   { transform: translateX(-60%) skewX(-12deg); }
                60%  { transform: translateX(120%) skewX(-12deg); }
                100% { transform: translateX(120%) skewX(-12deg); }
              }
            `}</style>
                    </div>

                    {/* glow ring */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                    <div
                        className="pointer-events-none absolute inset-0 rounded-2xl"
                        style={{ boxShadow: '0 0 60px 8px #00E0FF22' }}
                    />
                </motion.div>
            </div>
        </section>
    )
}
