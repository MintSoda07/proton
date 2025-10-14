import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const items = (t: (k: string) => string) => ([
    { title: t('feat.f1t'), desc: t('feat.f1d') },
    { title: t('feat.f2t'), desc: t('feat.f2d') },
    { title: t('feat.f3t'), desc: t('feat.f3d') },
    { title: t('feat.f4t'), desc: t('feat.f4d') },
])

export default function Features() {
    const { t } = useTranslation()
    const list = items(t)
    return (
        <section className="bg-base relative" aria-labelledby="features">
            {/* faint divider */}
            <div className="h-px w-full bg-white/10" />
            <div className="container-proton py-14">
                <h2 id="features" className="text-2xl md:text-3xl font-bold">
                    {t('feat.title')}
                </h2>

                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                    className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {list.map((f, i) => (
                        <motion.article key={i}
                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: .45 } } }}
                            className="card p-5 transition-transform will-change-transform hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-violet mb-4" />
                            <h3 className="font-semibold">{f.title}</h3>
                            <p className="mt-2 text-sm text-white/70 leading-relaxed">{f.desc}</p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
