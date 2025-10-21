<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Project.tsx
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ModelingView from '../project_pages/ModelingView';
import FullscreenProjectView from '../project_pages/FullscreenProjectView';
import { useState } from 'react';
=======
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TopBar } from '../components/TopbarProton';
>>>>>>> Stashed changes
=======
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TopBar } from '../components/TopbarProton';
>>>>>>> Stashed changes

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

  const projectType = sp.get('type') ?? 'sketch';
  const projectName = decodeURIComponent(sp.get('name') ?? '무제 프로젝트');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // modeling은 "상위 css 무시 + 전체 화면"
  if (type === 'modeling') {
    return (
      <FullscreenProjectView
        title={`프로젝트 #${id}`}
        type={type}
        onClose={() => navigate(-1)}
        rightArea={
          <div className="flex items-center gap-2">
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
        <ModelingView />
      </FullscreenProjectView>
    );
  }

  // 가상 프로젝트 정보
  const projectInfo: ProjectInfo = {
    id: id || '',
    name: projectName,
    type: projectType,
    createdAt: '2024-01-15 14:30',
    lastModified: '방금 전',
    size: '2.4 MB',
    status: 'active',
  };

  // 도구 목록
  const tools: ToolItem[] = [
    {
      id: 'move',
      name: '이동',
      icon: <MoveIcon className="w-5 h-5" />,
      shortcut: 'V',
      category: 'basic',
    },
    {
      id: 'brush',
      name: '브러쉬',
      icon: <BrushIcon className="w-5 h-5" />,
      shortcut: 'B',
      category: 'paint',
    },
    {
      id: 'zoom',
      name: '확대/축소',
      icon: <ZoomIcon className="w-5 h-5" />,
      shortcut: 'Z',
      category: 'basic',
    },
    {
      id: 'layers',
      name: '레이어',
      icon: <LayersIcon className="w-5 h-5" />,
      shortcut: 'L',
      category: 'organize',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      saved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      syncing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    const labels = {
      active: '작업 중',
      saved: '저장됨',
      syncing: '동기화 중',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded border ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
=======
  // 가상 프로젝트 정보
  const projectInfo: ProjectInfo = {
    id: id || '',
    name: projectName,
    type: projectType,
    createdAt: '2024-01-15 14:30',
    lastModified: '방금 전',
    size: '2.4 MB',
    status: 'active',
  };

  // 도구 목록 (프로젝트 타입에 따라 달라질 수 있음)
  const tools: ToolItem[] = [
    {
      id: 'move',
      name: '이동',
      icon: <MoveIcon className="w-5 h-5" />,
      shortcut: 'V',
      category: 'basic',
    },
    {
      id: 'brush',
      name: '브러쉬',
      icon: <BrushIcon className="w-5 h-5" />,
      shortcut: 'B',
      category: 'paint',
    },
    {
      id: 'zoom',
      name: '확대/축소',
      icon: <ZoomIcon className="w-5 h-5" />,
      shortcut: 'Z',
      category: 'basic',
    },
    {
      id: 'layers',
      name: '레이어',
      icon: <LayersIcon className="w-5 h-5" />,
      shortcut: 'L',
      category: 'organize',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      saved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      syncing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    const labels = {
      active: '작업 중',
      saved: '저장됨',
      syncing: '동기화 중',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded border ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
>>>>>>> Stashed changes
=======
  // 가상 프로젝트 정보
  const projectInfo: ProjectInfo = {
    id: id || '',
    name: projectName,
    type: projectType,
    createdAt: '2024-01-15 14:30',
    lastModified: '방금 전',
    size: '2.4 MB',
    status: 'active',
  };

  // 도구 목록 (프로젝트 타입에 따라 달라질 수 있음)
  const tools: ToolItem[] = [
    {
      id: 'move',
      name: '이동',
      icon: <MoveIcon className="w-5 h-5" />,
      shortcut: 'V',
      category: 'basic',
    },
    {
      id: 'brush',
      name: '브러쉬',
      icon: <BrushIcon className="w-5 h-5" />,
      shortcut: 'B',
      category: 'paint',
    },
    {
      id: 'zoom',
      name: '확대/축소',
      icon: <ZoomIcon className="w-5 h-5" />,
      shortcut: 'Z',
      category: 'basic',
    },
    {
      id: 'layers',
      name: '레이어',
      icon: <LayersIcon className="w-5 h-5" />,
      shortcut: 'L',
      category: 'organize',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      saved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      syncing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    const labels = {
      active: '작업 중',
      saved: '저장됨',
      syncing: '동기화 중',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded border ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
>>>>>>> Stashed changes
  };

  return (
    <div className="h-screen bg-base text-white flex flex-col overflow-hidden">
      {/* 상단 프로젝트 바 */}
      <div className="bg-black/30 border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/proton')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← 돌아가기
          </button>
          <div>
            <h1 className="font-semibold">{projectInfo.name}</h1>
            <div className="text-xs text-white/60">
              {projectInfo.type} • 프로젝트 #{projectInfo.id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(projectInfo.status)}
          <div className="text-xs text-white/60">
            마지막 저장: {projectInfo.lastModified}
          </div>
        </div>
      </div>

      {/* 메인 작업 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 도구 패널 */}
        <div className="w-16 bg-black/20 border-r border-white/10 flex flex-col">
          <div className="p-2 space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={`${tool.name} (${tool.shortcut})`}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          <div className="mt-auto p-2 space-y-2">
            <button className="w-12 h-12 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">
              <UndoIcon className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">
              <RedoIcon className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center">
              <SaveIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 중앙 캔버스 영역 */}
        <div className="flex-1 flex flex-col bg-white/5">
          {/* 캔버스 툴바 */}
          <div className="bg-black/20 border-b border-white/10 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/70">
                확대: <span className="text-white">{zoomLevel}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
                  className="px-2 py-1 bg-white/10 rounded text-sm hover:bg-white/20 transition-colors"
                >
                  -
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-1 bg-white/10 rounded text-sm hover:bg-white/20 transition-colors"
                >
                  100%
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(500, zoomLevel + 10))}
                  className="px-2 py-1 bg-white/10 rounded text-sm hover:bg-white/20 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showLayers
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                레이어
              </button>
              <button
                onClick={() => setShowProperties(!showProperties)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showProperties
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                속성
              </button>
            </div>
          </div>

          {/* 실제 캔버스 */}
          <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-white/10 m-8 rounded-lg border border-white/20 flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <div className="text-center text-white/60">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl mb-2">{projectInfo.name}</h3>
                <p className="text-sm">
                  {projectType === 'sketch' &&
                    '스케치 캔버스가 여기에 표시됩니다'}
                  {projectType === 'drawing' &&
                    '드로잉 캔버스가 여기에 표시됩니다'}
                  {projectType === 'sculpt' &&
                    '3D 스컬핑 뷰포트가 여기에 표시됩니다'}
                  {projectType === 'modeling' &&
                    '3D 모델링 뷰포트가 여기에 표시됩니다'}
                  {!['sketch', 'drawing', 'sculpt', 'modeling'].includes(
                    projectType
                  ) && '작업 캔버스가 여기에 표시됩니다'}
                </p>
                <button className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  작업 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널들 */}
        <div className="w-80 bg-black/20 border-l border-white/10 flex flex-col">
          {/* 레이어 패널 */}
          {showLayers && (
            <div className="border-b border-white/10 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <LayersIcon className="w-5 h-5" />
                레이어
              </h3>
              <div className="space-y-2">
                {['배경', '스케치', '색칠', '오버레이'].map((layer, i) => (
                  <div
                    key={layer}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      i === 1
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{layer}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-white/20 to-white/10 rounded border border-white/20" />
                        <span className="text-xs text-white/60">100%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-2 border border-dashed border-white/30 rounded-lg text-sm text-white/70 hover:text-white hover:border-white/50 transition-colors">
                + 새 레이어
              </button>
            </div>
          )}

          {/* 속성 패널 */}
          {showProperties && (
            <div className="flex-1 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                브러쉬 속성
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">크기</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    defaultValue="25"
                    className="w-full accent-white/60"
                  />
                  <div className="text-xs text-white/60 mt-1">25px</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    불투명도
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="w-full accent-white/60"
                  />
                  <div className="text-xs text-white/60 mt-1">100%</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">경도</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full accent-white/60"
                  />
                  <div className="text-xs text-white/60 mt-1">50%</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">색상</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#000000',
                      '#FFFFFF',
                      '#FF0000',
                      '#00FF00',
                      '#0000FF',
                      '#FFFF00',
                    ].map((color) => (
                      <div
                        key={color}
                        className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 프로젝트 정보 */}
          <div className="border-t border-white/10 p-4">
            <h3 className="font-semibold mb-3">프로젝트 정보</h3>
            <div className="text-sm text-white/70 space-y-1">
              <div>생성일: {projectInfo.createdAt}</div>
              <div>크기: {projectInfo.size}</div>
              <div>타입: {projectInfo.type}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
