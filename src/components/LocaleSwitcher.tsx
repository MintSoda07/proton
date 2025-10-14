import { useTranslation } from 'react-i18next'

type Props = {
    /** "plain"이면 배경/테두리 제거 */
    variant?: 'plain' | 'glass'
    className?: string
}

export default function LocaleSwitcher({ variant = 'plain', className = '' }: Props) {
    const { i18n, t } = useTranslation()

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lng = e.target.value
        i18n.changeLanguage(lng)
        localStorage.setItem('proton:lang', lng)
    }

    const base =
        variant === 'plain'
            ? // 배경/테두리 없는 버전
            'bg-transparent border-0 px-2 py-1 text-sm text-white/80 hover:text-white focus:outline-none focus:ring-0'
            : // 필요 시 글래스 버전도 사용 가능
            'glass rounded-md px-2 py-1.5 text-sm'

    return (
        <label className={`inline-flex items-center gap-2 ${className}`}>
            <span className="sr-only">{t('nav.language')}</span>
            <select
                aria-label={t('nav.language')}
                className={`${base} appearance-none`}
                value={i18n.resolvedLanguage}
                onChange={onChange}
            >
                <option value="ko">한국어</option>
                <option value="en">English</option>
            </select>
        </label>
    )
}
