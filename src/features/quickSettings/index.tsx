import {createRoot} from "react-dom/client";
import QSPanel from "./QSPanel";

export default function quickSettings() {
    console.log("loading emoji quick settings...", "qs-root");

    console.info("Creating qs")
    const container = document.getElementById("qs-root")!;
    const root = createRoot(container);

    root.render(
        <QSPanel />
    );
}