import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
    en: {
        translation: {
            nav: {
                design: "Design",
                products: "Products",
                pricing: "Pricing",
                business: "Business",
                education: "Education",
                help: "Help",
                login: "Log in",
                signup: "Sign up",
                language: "Language"
            },
            hero: {
                title: "Design anything. Collaborate anywhere.",
                subtitle: "Proton helps your team create stunning visuals with a minimal, fast web modeling toolkit.",
                ctaPrimary: "Start for free",
                ctaSecondary: "Explore products",
                leftTitle: "Product overview",
                leftDesc: "Import, edit, and export 3D assets in your browser. Real-time lighting, transform tools, and versioned projects.",
                placeholderAlt: "Product preview image"
            },
            feat: {
                title: "What you can do with Proton",
                f1t: "Drag & Drop 3D",
                f1d: "Import GLTF/GLB and start editing instantly.",
                f2t: "Transform Controls",
                f2d: "Translate, rotate, scale with precise snapping.",
                f3t: "Team Collaboration",
                f3d: "Share projects, comment, and iterate fast.",
                f4t: "Export Anywhere",
                f4d: "Export GLTF/GLB optimized for engines."
            }
        }
    },
    ko: {
        translation: {
            nav: {
                design: "디자인",
                products: "제품",
                pricing: "요금제",
                business: "비즈니스",
                education: "교육용",
                help: "도움말",
                login: "로그인",
                signup: "가입",
                language: "언어"
            },
            hero: {
                title: "무엇이든 디자인하세요. 어디서든 협업하세요.",
                subtitle: "Proton은 빠르고 미니멀한 웹 모델링 툴로 팀의 멋진 비주얼 제작을 돕습니다.",
                ctaPrimary: "무료로 시작",
                ctaSecondary: "제품 살펴보기",
                leftTitle: "제품 소개",
                leftDesc: "브라우저에서 3D 에셋을 불러와 즉시 편집하고 내보내세요. 실시간 라이팅, 트랜스폼, 버전 관리 지원.",
                placeholderAlt: "제품 미리보기 이미지"
            },
            feat: {
                title: "Proton으로 할 수 있는 일",
                f1t: "3D 드래그&드롭",
                f1d: "GLTF/GLB를 불러와 바로 편집 시작.",
                f2t: "트랜스폼 컨트롤",
                f2d: "이동·회전·스케일, 스냅으로 정밀 작업.",
                f3t: "팀 협업",
                f3d: "프로젝트 공유, 댓글, 빠른 반복.",
                f4t: "손쉬운 내보내기",
                f4d: "엔진 최적화 GLTF/GLB 익스포트."
            }
        }
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('proton:lang') || 'ko',
        fallbackLng: 'en',
        interpolation: { escapeValue: false }
    })

export default i18n
