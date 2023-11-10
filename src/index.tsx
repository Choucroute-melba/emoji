import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import {
    onTextFieldFocused
} from "./features/emoji/emojiSlice";
import quickSettings from "./features/quickSettings";

let currentView: "emoji" | "quickSettings" | "none" = getCurrentView();

console.groupCollapsed("loading emoji app...", "emoji-root-peekaboo");

if(currentView === "emoji") {
    try {
        console.info("Creating app")
        const container = document.getElementById("emoji-root-peekaboo")!;
        const root = createRoot(container);

        console.info("Registering shortcuts")
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "e":
                    // store.dispatch({type: "emoji/toggleDisplay"});
                    break;
                /*case "Escape":
                    if(store.getState().emoji.searching) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
                case "Enter":
                    if(store.getState().emoji.searching) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
                case "ArrowUp":
                    if(store.getState().emoji.searching) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
                case "ArrowDown":
                    if(store.getState().emoji.searching) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;*/
            }
        })

        console.info("Preparing text fields")
        document.addEventListener("focusin", (e) => {
            console.log((e.target as Element).tagName)
            if ((e.target as Element).tagName === "TEXTAREA" || (e.target as Element).tagName === "INPUT") {
                const f = e.target as HTMLInputElement | HTMLTextAreaElement;
                if (f.tagName === "input" && (f.type === "button" || f.type === "submit" || f.type === "reset" || f.type === "image" || f.type === "file" || f.type === "password" || f.type === "checkbox" || f.type === "radio" || f.type === "range" || f.type === "color" || f.type === "date" || f.type === "datetime-local" || f.type === "email" || f.type === "month" || f.type === "number" || f.type === "tel" || f.type === "time" || f.type === "url" || f.type === "week"))
                    return;
                store.dispatch(onTextFieldFocused(f));
            }
        });


        /* store.dispatch(updateTextFields());
        store.dispatch(configureTextFields());

        if(store.getState().emoji.textFields.length === 0) {
            const checkInterval = setInterval(() => {
                store.dispatch(updateTextFields());
                if(store.getState().emoji.detectionTryCount > 3) {
                    clearInterval(checkInterval);
                    console.info("%cNo text fields found", "color: red; font-weight: bold;");
                }
                if(store.getState().emoji.textFields.length > 0) {
                    store.dispatch(configureTextFields());
                    clearInterval(checkInterval);
                    console.info("Text fields found: ", store.getState().emoji.textFields);
                }
                else
                    console.warn("No text fields found, trying again in 5s");
            }, 5000)
        } */

        /*console.info("Preparing observer")
        const muCallback = (mutations: MutationRecord[], observer: MutationObserver) => {
            console.log("Mutation detected", mutations);
            mutations.forEach(mutation => {
                if(mutation.type === "childList") {
                    mutation.addedNodes.forEach(node => {
                        if(node instanceof HTMLElement) {
                            if(node.tagName === "TEXTAREA" || node.tagName === "INPUT") {
                                store.dispatch(updateTextFields());
                                store.dispatch(onTextFieldFocused());
                            }
                            else if (node.querySelectorAll("textarea, input").length > 0) {
                                store.dispatch(updateTextFields());
                                store.dispatch(onTextFieldFocused());
                            }
                        }
                    })
                }
            });
        }
        const muConfig = {subtree: true, childList: true}
        const mu = new MutationObserver(muCallback);*/
        // mu.observe(document.body, muConfig);


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
}
else if (currentView === "quickSettings") {
    console.info("loading emoji quick settings...", "qs-root");
    quickSettings();
    console.groupEnd();
}

function getCurrentView(): "emoji" | "quickSettings" | "none" {
    if(document.getElementById("emoji-root-peekaboo") !== null)
        return "emoji";
    else if(document.getElementById("qs-root") !== null)
        return "quickSettings";
    else
        return "none";
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
