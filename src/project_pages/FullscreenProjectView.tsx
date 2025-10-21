import React, { useEffect } from "react";

type Props = {
    title: string;
    type?: string;
    onClose?: () => void; // 필요 없다면 안 넘겨도 됨
    rightArea?: React.ReactNode; // 우측 툴 영역(추가 버튼, 저장 등)
    children: React.ReactNode;   // 실제 에디터(= ModelingView)
};

/**
 * 화면 전체를 덮는 고정 레이어.
 * - 상단: 툴바(제목/타입/우측 버튼)
 * - 본문: children을 절대배치로 100vw/100vh 채움
 * - body 스크롤 잠금
 */
export default function FullscreenProjectView({
    title,
    type,
    onClose,
    rightArea,
    children,
}: Props) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[999] bg-[#0b0f14] text-white"
            style={{ width: "100vw", height: "100vh" }}
        >
            {/* Top toolbar */}
            <div className="h-12 px-4 flex items-center justify-between bg-black/50 backdrop-blur border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">{title}</span>
                    {type && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/10">
                            type: {type}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* 우측 영역(저장/불러오기/Export 등 확장 버튼을 여기로) */}
                    {rightArea}

                    {/* 닫기 버튼 (선택) */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
                        >
                            닫기
                        </button>
                    )}
                </div>
            </div>

            {/* Content (모델링 뷰 전면) */}
            <div className="absolute inset-0 pt-12">
                {/* 내부 도구바가 좌측 상단에 떠 있으니, 겹치지 않도록 상단 패딩 12 (==48px) */}
                <div className="w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
