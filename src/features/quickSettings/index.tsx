import {createRoot} from "react-dom/client";
import QSPanel from "./QSPanel";
import {store} from "../../app/store";
import {onMessage} from "../preferences/settingsSlice";
import {Provider} from "react-redux";

export default function quickSettings() {
    console.log("loading emoji quick settings...", "qs-root");

    console.info("Creating qs")
    const container = document.getElementById("qs-root")!;
    const root = createRoot(container);

    root.render(
        <Provider store={store}>
            <QSPanel />
        </Provider>
    );

    // @ts-ignore
    browser.runtime.onMessage.addListener((message) => {
        store.dispatch(onMessage(message))
    })
}