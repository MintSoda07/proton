import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function Hero() {
    const { t } = useTranslation()
    return (
        <section className="bg-base">
            <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
                {/* 왼쪽: 제품 소개 */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-extrabold leading-tight"
                    >
                        {t('hero.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        className="mt-4 text-white/70"
                    >
                        {t('hero.subtitle')}
                    </motion.p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <a
                            href="#get-started"
                            className="px-5 py-3 rounded-lg bg-gradient-to-r from-accent to-violet text-black font-semibold"
                        >
                            {t('hero.ctaPrimary')}
                        </a>
                        <a
                            href="#products"
                            className="px-5 py-3 rounded-lg border border-white/15 hover:bg-white/5"
                        >
                            {t('hero.ctaSecondary')}
                        </a>
                    </div>

                    <div className="mt-10">
                        <h3 className="text-lg font-semibold">{t('hero.leftTitle')}</h3>
                        <p className="mt-2 text-white/70">{t('hero.leftDesc')}</p>
                    </div>
                </div>

                {/* 오른쪽: 제품 이미지 플레이스홀더 */}
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="relative"
                >
                    <div
                        role="img"
                        aria-label={t('hero.placeholderAlt')}
                        className="aspect-video w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 grid place-items-center"
                    >
                        <div className="text-white/60">Product Image Placeholder</div>
                    </div>

                    {/* 빛나는 테두리 효과 */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-accent/20" />
                </motion.div>
            </div>
        </section>
    )
}
