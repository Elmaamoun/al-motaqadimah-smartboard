import { useEffect, useMemo, useState } from "react";

type Hit = {
    tag: string;
    id?: string;
    className?: string;
    path: string;
    transform?: string;
    zoom?: string;
    fontSize?: string;
};

function getPath(el: Element) {
    const parts: string[] = [];
    let cur: Element | null = el;
    for (let i = 0; cur && i < 6; i++) {
        const id = (cur as HTMLElement).id ? `#${(cur as HTMLElement).id}` : "";
        const cls = (cur as HTMLElement).className
            ? "." + String((cur as HTMLElement).className).trim().split(/\s+/).slice(0, 3).join(".")
            : "";
        parts.unshift(`${cur.tagName.toLowerCase()}${id}${cls}`);
        cur = cur.parentElement;
    }
    return parts.join(" > ");
}

export default function LayoutDiagnostics() {
    const [hits, setHits] = useState<Hit[]>([]);
    const [meta, setMeta] = useState<any>({});

    useEffect(() => {
        const scan = () => {
            const all = Array.from(document.querySelectorAll("*"));
            const found: Hit[] = [];

            for (const el of all) {
                const cs = getComputedStyle(el);
                const t = cs.transform;
                // zoom is not standardized but Chrome exposes it on computed style sometimes
                // also check inline style zoom
                const zInline = (el as HTMLElement).style?.zoom;
                const z = (cs as any).zoom || zInline;

                const isTransformed = t && t !== "none";
                const isZoomed = z && String(z) !== "1" && String(z) !== "normal" && String(z) !== "";

                // Only keep meaningful suspects
                if (isTransformed || isZoomed) {
                    found.push({
                        tag: el.tagName.toLowerCase(),
                        id: (el as HTMLElement).id || undefined,
                        className: (el as HTMLElement).className ? String((el as HTMLElement).className) : undefined,
                        path: getPath(el),
                        transform: isTransformed ? t : undefined,
                        zoom: isZoomed ? String(z) : undefined,
                    });
                }
            }

            // Meta numbers
            const html = document.documentElement;
            const htmlCs = getComputedStyle(html);
            const bodyCs = getComputedStyle(document.body);

            setMeta({
                viewport: `${window.innerWidth} x ${window.innerHeight}`,
                dpr: window.devicePixelRatio,
                htmlFontSize: htmlCs.fontSize,
                bodyFontSize: bodyCs.fontSize,
                rootTransform: getComputedStyle(document.getElementById("root") as any)?.transform,
                rootZoom: (getComputedStyle(document.getElementById("root") as any) as any)?.zoom,
            });

            // keep top 30 to avoid noise
            setHits(found.slice(0, 30));
            // log full list
            console.groupCollapsed("[LayoutDiagnostics] suspects:", found.length);
            console.table(found);
            console.log("meta:", {
                viewport: `${window.innerWidth} x ${window.innerHeight}`,
                dpr: window.devicePixelRatio,
                htmlFontSize: htmlCs.fontSize,
                bodyFontSize: bodyCs.fontSize,
                rootTransform: getComputedStyle(document.getElementById("root") as any)?.transform,
            });
            console.groupEnd();
        };

        scan();
        window.addEventListener("resize", scan);
        return () => window.removeEventListener("resize", scan);
    }, []);

    const summary = useMemo(() => {
        const tCount = hits.filter(h => h.transform).length;
        const zCount = hits.filter(h => h.zoom).length;
        return { tCount, zCount };
    }, [hits]);

    return (
        <div
            style={{
                position: "fixed",
                bottom: 12,
                right: 12,
                zIndex: 999999,
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                padding: "12px 14px",
                borderRadius: 12,
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.35,
                width: 420,
                maxHeight: 260,
                overflow: "auto",
                direction: "ltr",
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>LAYOUT DIAGNOSTICS</div>
            <div>viewport: {meta.viewport}</div>
            <div>dpr: {meta.dpr}</div>
            <div>html font-size: {meta.htmlFontSize}</div>
            <div>body font-size: {meta.bodyFontSize}</div>
            <div>root transform: {String(meta.rootTransform)}</div>
            <div style={{ marginTop: 6 }}>
                suspects: transform={summary.tCount} / zoom={summary.zCount} (showing first {hits.length})
            </div>

            {hits.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {hits.map((h, i) => (
                        <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                            <div style={{ opacity: 0.9 }}>{h.path}</div>
                            {h.transform && <div>transform: {h.transform}</div>}
                            {h.zoom && <div>zoom: {h.zoom}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
