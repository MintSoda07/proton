import { useTranslation } from 'react-i18next'

export default function LocaleSwitcher() {
    const { i18n, t } = useTranslation()
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lng = e.target.value
        i18n.changeLanguage(lng)
        localStorage.setItem('proton:lang', lng)
    }
    return (
        <label className="inline-flex items-center gap-2">
            <span className="sr-only">{t('nav.language')}</span>
            <select
                aria-label={t('nav.language')}
                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm"
                value={i18n.resolvedLanguage}
                onChange={onChange}
            >
                <option value="ko">한국어</option>
                <option value="en">English</option>
            </select>
        </label>
    )
}
