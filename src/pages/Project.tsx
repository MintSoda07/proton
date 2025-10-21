// Project.tsx
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ModelingView from "../project_pages/ModelingView";
import FullscreenProjectView from "../project_pages/FullscreenProjectView";
<<<<<<< HEAD
import { useState } from 'react';

// 프로젝트 정보 타입
type ProjectInfo = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastModified: string;
  size: string;
  status: 'active' | 'saved' | 'syncing';
};

// 도구 패널 아이템 타입
type ToolItem = {
  id: string;
  name: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: string;
};

// 아이콘 컴포넌트들
const BrushIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M11 19a4 4 0 0 1-7 0c0-1.5 1-2 2.5-2H11Z" />
    <path d="M20.7 7.3 13 15h-4l7.7-7.7a2.1 2.1 0 0 1 3 0v0a2.1 2.1 0 0 1 0 3Z" />
  </svg>
);

const MoveIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <polyline points="5,9 2,12 5,15" />
    <polyline points="9,5 12,2 15,5" />
    <polyline points="15,19 12,22 9,19" />
    <polyline points="19,9 22,12 19,15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

const ZoomIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <polygon points="12,2 2,7 12,12 22,7 12,2" />
    <polyline points="2,17 12,22 22,17" />
    <polyline points="2,12 12,17 22,12" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UndoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M3 7v6h6" />
    <path d="m21 17a9 9 0 1 1-9-9c2.239 0 4.49.58 6.5 1.69L21 7" />
  </svg>
);

const RedoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9c2.239 0 4.49.58 6.5 1.69L21 7" />
  </svg>
);

const SaveIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);
=======
>>>>>>> 999a4350694f87c7ec5b339ae04ed804b9dea3ed

export default function Project() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const type = (sp.get('type') ?? 'sketch').toLowerCase();
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

  const [selectedTool, setSelectedTool] = useState('brush');
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

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
