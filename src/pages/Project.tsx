// Project.tsx
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ModelingView from "../project_pages/ModelingView";
import FullscreenProjectView from "../project_pages/FullscreenProjectView";

export default function Project() {
    const { id } = useParams();
    const [sp] = useSearchParams();
    const type = (sp.get("type") ?? "—").toLowerCase();
    const nav = useNavigate();

    // modeling은 "상위 css 무시 + 전체 화면"
    if (type === "modeling") {
        return (
            <FullscreenProjectView
                title={`프로젝트 #${id}`}
                type={type}
                onClose={() => nav(-1)}   // 닫기 동작 원치 않으면 제거 가능
                // rightArea에 원하는 글로벌 버튼들 배치(예: 저장/불러오기)
                rightArea={
                    <div className="flex items-center gap-2">
                        {/* 예시 버튼들 - 나중에 wiring */}
                        <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
                            저장
                        </button>
                        <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
                            불러오기
                        </button>
                        <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
                            Export glTF
                        </button>
                    </div>
                }
            >
                {/* 실제 모델링 에디터 */}
                <ModelingView />
            </FullscreenProjectView>
        );
    }

    // 그 외 타입은 기존 레이아웃 유지
    return (
        <div className="container-proton py-10">
            <h1 className="text-2xl font-semibold mb-2">프로젝트 #{id}</h1>
            <div className="text-white/70">type: {type}</div>

            <div className="mt-6 card p-0 relative overflow-hidden" style={{ minHeight: 520 }}>
                <div className="p-4">여기에 실제 프로젝트 뷰를 붙이세요.</div>
            </div>
        </div>
    );
}
