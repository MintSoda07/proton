import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useMemo } from 'react'

type Props = {
    /** "plain"이면 배경/테두리 제거 */
    variant?: 'plain' | 'glass'
    className?: string
}

export default function LocaleSwitcher({ variant = 'plain', className = '' }: Props) {
    const { i18n, t } = useTranslation()

    // en-US, ko-KR 같은 값도 안전하게 'en' / 'ko'로 매핑
    const currentLang = useMemo(() => {
        const v = i18n.resolvedLanguage || i18n.language || 'en'
        return v.split('-')[0]
    }, [i18n.resolvedLanguage, i18n.language])

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lng = e.target.value
        i18n.changeLanguage(lng)
        try {
            localStorage.setItem('proton:lang', lng)
        } catch { console.log("Well, An Error!") }
        // 언어 변경 시 타이틀 동기화
        const title = i18n.getResource(lng, 'translation', 'meta.title') as string | undefined
        if (title && typeof document !== 'undefined') document.title = title
    }

    const base =
        variant === 'plain'
            ? 'select-plain text-sm'
            : 'glass rounded-md px-2 py-1.5 text-sm'

    return (
        <label className={`inline-flex items-center gap-2 ${className}`}>
            <Globe className="w-4 h-4 text-white/80" strokeWidth={1.5} />
            <span className="sr-only">{t('nav.language')}</span>
            <select
                aria-label={t('nav.language')}
                className={`select-proton ${base}`}
                value={currentLang}
                onChange={onChange}
            >
                <option value="ko">한국어</option>
                <option value="en">English</option>
            </select>
        </label>
    )
}
