import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    if (isAuthed()) return <>{children}</>;
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/?login=1&next=${next}`} replace />;
}
