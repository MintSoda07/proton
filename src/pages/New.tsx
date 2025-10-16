import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function New() {
    const [sp] = useSearchParams();
    const type = sp.get("type") ?? "project";
    const nav = useNavigate();

    useEffect(() => {
        const url = `/project/${Math.floor(1000 + Math.random() * 9000)}?type=${type}`;
        sessionStorage.setItem("created_url", url);
        if (!isAuthed()) {
            nav(`/login?next=${encodeURIComponent(url)}`, { replace: true });
        } else {
            nav(url, { replace: true });
        }
    }, [nav, type]);

    return null;
}
