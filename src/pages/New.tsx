import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopbarProton';
import { isAuthed } from '../lib/auth';

// 프로젝트 템플릿 타입 정의
type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  tags: string[];
  resolution?: string;
  features: string[];
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

const CubeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v8l9 5 9-5V8" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

const SparkIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
    <path d="M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
  </svg>
);

const BoneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M7 7c0-1.7-1.3-3-3-3S1 5.3 1 7s1.3 3 3 3c.2 0 .4 0 .6-.1l6.5 6.5c0 .2-.1.4-.1.6 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.6-1.3-3-3-3-.2 0-.4 0-.6.1L7.1 7.6C7 7.4 7 7.2 7 7Z" />
  </svg>
);

// 프로젝트 템플릿 데이터
const templates: ProjectTemplate[] = [
  {
    id: 'sketch',
    name: '스케치',
    description: '자유로운 아이디어 스케치와 컨셉 아트',
    category: '2D',
    icon: <BrushIcon className="w-8 h-8" />,
    tags: ['2D', '드로잉', '스케치'],
    resolution: '4K',
    features: ['무한 캔버스', '다양한 브러쉬', '레이어 지원'],
  },
  {
    id: 'drawing',
    name: '드로잉',
    description: '레이어 기반의 정밀한 일러스트레이션',
    category: '2D',
    icon: <BrushIcon className="w-8 h-8" />,
    tags: ['2D', '일러스트', '레이어'],
    resolution: '8K',
    features: ['고급 레이어', '벡터 지원', '색상 관리'],
  },
  {
    id: 'sculpt',
    name: '스컬핑',
    description: '하이폴리곤 3D 스컬핑 작업',
    category: '3D',
    icon: <CubeIcon className="w-8 h-8" />,
    tags: ['3D', '스컬핑', '하이폴리'],
    features: ['다이나믹 메쉬', '멀티레즈', '브러쉬 시스템'],
  },
  {
    id: 'modeling',
    name: '모델링',
    description: '정밀한 3D 모델링과 하드서페이스',
    category: '3D',
    icon: <CubeIcon className="w-8 h-8" />,
    tags: ['3D', '모델링', '하드서페이스'],
    features: ['파라메트릭', '불린 연산', '모디파이어'],
  },
  {
    id: 'texture',
    name: '텍스처',
    description: 'PBR 기반 텍스처 페인팅',
    category: '텍스처',
    icon: <GridIcon className="w-8 h-8" />,
    tags: ['텍스처', 'PBR', '머터리얼'],
    resolution: '4K',
    features: ['PBR 워크플로우', '스마트 머터리얼', '프로시저럴'],
  },
  {
    id: 'material',
    name: '머터리얼',
    description: '노드 기반 머터리얼 그래프',
    category: '머터리얼',
    icon: <SparkIcon className="w-8 h-8" />,
    tags: ['머터리얼', '노드', '셰이더'],
    features: ['노드 에디터', '실시간 프리뷰', '라이브러리'],
  },
  {
    id: 'uv',
    name: 'UV 매핑',
    description: 'UV 펼치기와 패킹 최적화',
    category: 'UV',
    icon: <GridIcon className="w-8 h-8" />,
    tags: ['UV', '언랩', '패킹'],
    features: ['자동 언랩', '최적화 패킹', '시접 편집'],
  },
  {
    id: 'retopo',
    name: '리토폴로지',
    description: '게임용 로우폴리 재구성',
    category: '3D',
    icon: <CubeIcon className="w-8 h-8" />,
    tags: ['3D', '리토폴', '로우폴리'],
    features: ['쿼드 기반', '자동 리토폴', '토폴로지 가이드'],
  },
  {
    id: 'rig',
    name: '리깅',
    description: '본 구조와 웨이트 페인팅',
    category: '애니메이션',
    icon: <BoneIcon className="w-8 h-8" />,
    tags: ['리깅', '본', '애니메이션'],
    features: ['IK/FK', '컨스트레인트', '웨이트 페인팅'],
  },
];

export default function New() {
  const [sp] = useSearchParams();
  const initialType = sp.get('type') ?? '';
  const nav = useNavigate();

  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialType);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  // 카테고리 목록
  const categories = [
    'all',
    '2D',
    '3D',
    '텍스처',
    '머터리얼',
    'UV',
    '애니메이션',
  ];

  // 필터링된 템플릿
  const filteredTemplates = templates.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  // 프로젝트 생성 핸들러
  const handleCreateProject = async () => {
    if (!selectedTemplate || !projectName.trim()) return;

    setIsCreating(true);

    // 실제로는 API 호출이 있을 것
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const projectId = Math.floor(1000 + Math.random() * 9000);
    const url = `/project/${projectId}?type=${selectedTemplate}&name=${encodeURIComponent(projectName)}`;

    nav(url);
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-base text-white">
      <TopBar />

      <div className="container-proton py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">새 프로젝트 만들기</h1>
          <p className="text-white/70">
            템플릿을 선택하고 새로운 창작을 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 템플릿 선택 */}
          <div className="lg:col-span-2">
            {/* 카테고리 필터 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-white/30 bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-white/80">{template.icon}</div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <div className="text-xs text-white/60">
                        {template.category}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-white/70 mb-3">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 프로젝트 설정 */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">프로젝트 설정</h2>

              {/* 프로젝트 이름 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="새 프로젝트"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/40"
                />
              </div>

              {/* 선택된 템플릿 정보 */}
              {selectedTemplateData && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-white/80">
                      {selectedTemplateData.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedTemplateData.name}
                      </h3>
                      <div className="text-sm text-white/60">
                        {selectedTemplateData.category}
                      </div>
                    </div>
                  </div>

                  {selectedTemplateData.resolution && (
                    <div className="text-sm text-white/70 mb-2">
                      해상도: {selectedTemplateData.resolution}
                    </div>
                  )}

                  <div className="text-sm text-white/70">
                    <strong>주요 기능:</strong>
                    <ul className="mt-1 ml-4">
                      {selectedTemplateData.features.map((feature) => (
                        <li key={feature} className="list-disc">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 생성 버튼 */}
              <button
                onClick={handleCreateProject}
                disabled={
                  !selectedTemplate || !projectName.trim() || isCreating
                }
                className="w-full btn btn-primary pressable disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '생성 중...' : '프로젝트 생성'}
              </button>
            </div>

            {/* 빠른 도움말 */}
            <div className="card p-4">
              <h3 className="font-semibold mb-2">💡 팁</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• 키보드 단축키로 빠르게 생성 가능</li>
                <li>• 언제든지 다른 도구로 전환 가능</li>
                <li>• 프로젝트는 자동으로 저장됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
