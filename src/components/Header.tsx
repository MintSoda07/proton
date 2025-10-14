import { useTranslation } from 'react-i18next'
import LocaleSwitcher from './LocaleSwitcher'

export default function Header() {
    const { t } = useTranslation()
    return (
        <header className="w-full bg-base/80 backdrop-blur sticky top-0 z-40 border-b border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
                {/* 로고 */}
                <div className="flex-1 min-w-0">
                    <a href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-violet" />
                        <span className="font-semibold tracking-wide">Proton</span>
                    </a>
                </div>

                {/* 네비게이션 */}
                <nav className="hidden md:flex items-center gap-5 text-sm text-white/90">
                    <a className="hover:text-white" href="#design">{t('nav.design')}</a>
                    <a className="hover:text-white" href="#products">{t('nav.products')}</a>
                    <a className="hover:text-white" href="#pricing">{t('nav.pricing')}</a>
                    <a className="hover:text-white" href="#business">{t('nav.business')}</a>
                    <a className="hover:text-white" href="#education">{t('nav.education')}</a>
                    <a className="hover:text-white" href="#help">{t('nav.help')}</a>
                </nav>

                {/* 언어 선택 */}
                <div className="hidden md:block">
                    <LocaleSwitcher />
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-2">
                    <button className="text-sm px-3 py-1.5 rounded-md hover:bg-white/5">{t('nav.login')}</button>
                    <button className="text-sm px-3 py-1.5 rounded-md bg-gradient-to-r from-accent to-violet text-black font-medium">
                        {t('nav.signup')}
                    </button>
                </div>
            </div>
        </header>
    )
}
