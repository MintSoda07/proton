import { useParams, useSearchParams } from "react-router-dom";

export default function Project() {
    const { id } = useParams();
    const [sp] = useSearchParams();
    return (
        <div className="container-proton py-10">
            <h1 className="text-2xl font-semibold mb-2">프로젝트 #{id}</h1>
            <div className="text-white/70">type: {sp.get("type") ?? "—"}</div>
            <div className="mt-6 card p-4">여기에 실제 프로젝트 뷰를 붙이세요.</div>
        </div>
    );
}
