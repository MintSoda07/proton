// src/editor/ui/JsonModal.tsx
import React from "react";


export const JsonModal: React.FC<{
    mode: "import" | "export" | null;
    text: string;
    onChange: (s: string) => void;
    onClose: () => void;
    onConfirmImport: () => void;
}> = ({ mode, text, onChange, onClose, onConfirmImport }) => {
    if (!mode) return null;
    return (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
            <div className="w-[min(800px,90vw)] bg-[#0f141a] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">{mode === "export" ? "Export JSON" : "Import JSON"}</div>
                    <button className="px-2 py-1 rounded hover:bg-white/10" onClick={onClose}>닫기</button>
                </div>
                <textarea value={text} onChange={e => onChange(e.target.value)} className="w-full h-[40vh] p-2 rounded bg-black/40 border border-white/10 outline-none" placeholder={mode === "import" ? "여기에 JSON 붙여넣기" : ""} />
                <div className="mt-2 flex gap-2 justify-end">
                    {mode === "export" ? (
                        <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/15" onClick={() => navigator.clipboard?.writeText(text)}>클립보드로 복사</button>
                    ) : (
                        <button className="px-3 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30" onClick={onConfirmImport}>Import 적용</button>
                    )}
                </div>
            </div>
        </div>
    );
};