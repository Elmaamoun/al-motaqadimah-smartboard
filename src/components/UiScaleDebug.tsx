import { useEffect, useState } from "react";

export default function UiScaleDebug() {
    const [info, setInfo] = useState<any>({});

    useEffect(() => {
        const tick = () => {
            const html = document.documentElement;
            const cs = getComputedStyle(html);
            const base = cs.fontSize;

            // device / dpi hints
            const dpr = window.devicePixelRatio;

            // viewport
            const w = window.innerWidth;
            const h = window.innerHeight;

            // measure 1rem in px
            const remPx = parseFloat(base);

            // measure a 100px box to see real layout scaling
            const test = document.getElementById("__px_test__");
            const rect = test?.getBoundingClientRect();

            setInfo({
                viewport: `${w}x${h}`,
                devicePixelRatio: dpr,
                htmlFontSize: base,
                remPx,
                px100Width: rect ? rect.width : null,
                px100Height: rect ? rect.height : null,
            });
        };

        tick();
        window.addEventListener("resize", tick);
        const id = window.setInterval(tick, 500);
        return () => {
            window.removeEventListener("resize", tick);
            window.clearInterval(id);
        };
    }, []);

    return (
        <>
            <div
                id="__px_test__"
                style={{
                    position: "fixed",
                    left: -9999,
                    top: -9999,
                    width: 100,
                    height: 100,
                }}
            />
            <div
                style={{
                    position: "fixed",
                    bottom: 10,
                    left: 10,
                    zIndex: 999999,
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    lineHeight: 1.4,
                    direction: "ltr",
                    maxWidth: 320,
                    fontFamily: "monospace",
                }}
            >
                <div><b>UI DEBUG</b></div>
                <div>viewport: {info.viewport}</div>
                <div>dpr: {info.devicePixelRatio}</div>
                <div>html font-size: {info.htmlFontSize}</div>
                <div>1rem px: {info.remPx}</div>
                <div>100px test: {info.px100Width} x {info.px100Height}</div>
            </div>
        </>
    );
}
