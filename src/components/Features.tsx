import { useTranslation } from 'react-i18next'

const items = (t: (k: string) => string) => ([
    { title: t('feat.f1t'), desc: t('feat.f1d') },
    { title: t('feat.f2t'), desc: t('feat.f2d') },
    { title: t('feat.f3t'), desc: t('feat.f3d') },
    { title: t('feat.f4t'), desc: t('feat.f4d') },
])

export default function Features() {
    const { t } = useTranslation()
    return (
        <section className="bg-base" aria-labelledby="features">
            <div className="mx-auto max-w-7xl px-4 py-14">
                <h2 id="features" className="text-2xl md:text-3xl font-bold">
                    {t('feat.title')}
                </h2>
                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items(t).map((f, i) => (
                        <article key={i} className="rounded-xl border border-white/10 p-5 bg-white/5">
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-accent to-violet mb-4" />
                            <h3 className="font-semibold">{f.title}</h3>
                            <p className="mt-2 text-sm text-white/70">{f.desc}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
