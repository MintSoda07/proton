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
                        <motion.article
                            key={i}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                            }}
                            className="card hoverable hover-glow p-5 transition-transform will-change-transform"
                        >
                            <div
                                className="w-10 h-10 rounded-lg mb-4 hover-lift"
                                style={{ backgroundImage: 'linear-gradient(135deg, var(--accent), var(--violet))' }}
                                aria-hidden
                            />
                            <h3 className="font-semibold">{f.title}</h3>
                            <p className="mt-2 text-sm text-white/70 leading-relaxed">{f.desc}</p>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
