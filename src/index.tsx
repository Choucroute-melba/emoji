import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import {onKeydown, onKeyup, setFocusedTextField} from "./features/emoji/emojiSlice";

console.groupCollapsed("loading emoji app...", "emoji-root-peekaboo");

try {
    console.info("Creating app")
    const container = document.getElementById("emoji-root-peekaboo")!;
    const root = createRoot(container);

    console.info("Registering shortcuts")
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "e":
                // store.dispatch({type: "emoji/toggleDisplay"});
        }
    })

    console.info("Preparing text fields")
    store.getState().emoji.textFields.forEach((f) => {
        f.addEventListener("focusin", (e) => {
            console.log("focusin: ", f)
            store.dispatch(setFocusedTextField(f));

            const keydownListener = (e: Event) => {
                if(e instanceof KeyboardEvent) {
                    //console.log("keydown: ", e.key)
                    store.dispatch(onKeydown(e))
                }
            }

            const keyupListener = (e: Event) => {
                if(e instanceof KeyboardEvent) {
                    //console.log("keyup: ", e.key)
                    store.dispatch(onKeyup(e))
                }
            }

            const focusOutListener = () => {
                console.log("focusout: ", f)
                store.dispatch(setFocusedTextField(null));
                f.removeEventListener("focusout", focusOutListener);
                f.removeEventListener("keydown", keydownListener);
                f.removeEventListener("keyup", keyupListener);
            };

            f.addEventListener("focusout", focusOutListener);
            f.addEventListener("keydown", keydownListener);
            f.addEventListener("keyup", keyupListener);
        })
    })

    console.info("Rendering...")
    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <App/>
            </Provider>
        </React.StrictMode>
    );

    console.groupEnd()
    console.info("Emoji selector was loaded successfully on the following text fields:\n", store.getState().emoji.textFields)
} catch (e) {
    console.error("error loading emoji app", e);
    console.groupEnd();
}



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
