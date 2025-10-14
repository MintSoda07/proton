// src/components/Header.tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LocaleSwitcher from './LocaleSwitcher'

export default function Header() {
    const { t } = useTranslation()
    const [atTop, setAtTop] = useState(true)
    const [open, setOpen] = useState(false)

    // 상단 섀도우 토글
    useEffect(() => {
        const onScroll = () => setAtTop(window.scrollY < 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // 모바일 드로어 열릴 때 스크롤 락
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    // 드로어에서 링크/버튼 클릭 시 자동 닫힘 (앵커/버튼 모두 대응)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const closeOnClick = <E extends HTMLElement>(_: React.MouseEvent<E>) => setOpen(false)

    return (
        <header
            className={`w-full sticky top-0 z-40 border-b border-white/10 bg-base/70 backdrop-blur ${atTop ? '' : 'shadow-[0_8px_24px_rgba(0,0,0,.25)]'
                }`}
        >
            <div className="container-proton py-3 flex items-center gap-3">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2 focus-ring">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-violet" />
                    <span className="font-semibold tracking-wide">Proton</span>
                </a>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm text-white/90 ml-6">
                    <a className="hover:text-white focus-ring" href="#design">{t('nav.design')}</a>
                    <a className="hover:text-white focus-ring" href="#products">{t('nav.products')}</a>
                    <a className="hover:text-white focus-ring" href="#pricing">{t('nav.pricing')}</a>
                    <a className="hover:text-white focus-ring" href="#business">{t('nav.business')}</a>
                    <a className="hover:text-white focus-ring" href="#education">{t('nav.education')}</a>
                    <a className="hover:text-white focus-ring" href="#help">{t('nav.help')}</a>
                </nav>

                <div className="flex-1" />

                {/* Desktop controls */}
                <div className="hidden md:flex items-center gap-3">
                    {/* 언어: 배경/테두리 없는 플레인 스타일 */}
                    <LocaleSwitcher variant="plain" />
                    <button className="btn btn-ghost focus-ring text-sm">{t('nav.login')}</button>
                    <button className="btn btn-primary focus-ring text-sm">{t('nav.signup')}</button>
                </div>

                {/* Mobile: 메뉴 버튼 — 모바일에서만 노출 */}
                <button
                    className="md:hidden inline-flex items-center gap-2 btn btn-ghost focus-ring text-sm"
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label={t('nav.menu')}
                    onClick={() => setOpen((v) => !v)}
                >
                    {/* 햄버거 아이콘 */}
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
                    </svg>
                    {t('nav.menu')}
                </button>
            </div>

            {/* Mobile drawer (데스크톱에서는 숨김) */}
            {open && (
                <div
                    id="mobile-menu"
                    className="md:hidden border-t border-white/10 bg-base/95 backdrop-blur-sm"
                >
                    <div className="container-proton py-3 flex flex-col gap-2">
                        <a className="focus-ring py-2" href="#design" onClick={closeOnClick}>
                            {t('nav.design')}
                        </a>
                        <a className="focus-ring py-2" href="#products" onClick={closeOnClick}>
                            {t('nav.products')}
                        </a>
                        <a className="focus-ring py-2" href="#pricing" onClick={closeOnClick}>
                            {t('nav.pricing')}
                        </a>
                        <a className="focus-ring py-2" href="#business" onClick={closeOnClick}>
                            {t('nav.business')}
                        </a>
                        <a className="focus-ring py-2" href="#education" onClick={closeOnClick}>
                            {t('nav.education')}
                        </a>
                        <a className="focus-ring py-2" href="#help" onClick={closeOnClick}>
                            {t('nav.help')}
                        </a>

                        {/* 하단 액션 + 언어 (플레인) */}
                        <div className="flex items-center gap-2 pt-3">
                            <LocaleSwitcher variant="plain" />
                            <button className="btn btn-ghost focus-ring text-sm" onClick={closeOnClick}>
                                {t('nav.login')}
                            </button>
                            <button className="btn btn-primary focus-ring text-sm" onClick={closeOnClick}>
                                {t('nav.signup')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
