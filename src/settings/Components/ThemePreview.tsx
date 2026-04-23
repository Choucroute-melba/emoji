import React from "react"
import './ThemePreview.css'
import {getCssTheme, getRecommendedThemeMode} from "@theme/theme-utils";

export default function ThemePreview(
    {selected, mode, onClick} : {
        selected: boolean,
        mode: "system" | "light" | "dark" | "color",
        onClick: () => void,
    }) {
    const [themeVariables, setThemeVariables] = React.useState("")
    const [appliedMode, setAppliedMode] = React.useState("light dark");
    if(mode === "color") {
        getCssTheme(".themePreviewStyleContainer"+mode).then(theme => {
            setThemeVariables(theme);
        })
        getRecommendedThemeMode().then(recommendedMode => {
            setAppliedMode(recommendedMode);
        });
    }
    return (
        <div className={"themePreviewStyleContainer"+mode}>
            <style>{themeVariables}</style>
        <div className={"themePreview" + (selected ? " selected" : "")}
             style={{
                 colorScheme: (mode === "system") ? "light dark" : ((mode === "color") ? appliedMode : mode),
             }}
             onClick={onClick}
             tabIndex={0}
        >
            <div className={"row one"}>
                <svg>
                    <circle cx="8" cy="8" r="8" fill="#ffdc5d" />
                </svg>
                <div className={"middle"}>
                    <div className={"line one"}></div>
                    <div className={"line two"}></div>
                </div>
            </div>
            <div className={"row two"}>
                <svg>
                    <circle cx="8" cy="8" r="8" fill="#ffdc5d" />
                </svg>
                <div className={"middle"}>
                    <div className={"line one"}></div>
                    <div className={"line two"}></div>
                </div>
            </div>
            <div className={"row three"}>
                <svg>
                    <circle cx="8" cy="8" r="8" fill="#ffdc5d" />
                </svg>
                <div className={"middle"}>
                    <div className={"line one"}></div>
                    <div className={"line two"}></div>
                </div>
            </div>
            <div className={"themeName"}>
                {(mode == "system") && <p style={{fontSize: 20}}>Follow<br/>System</p>}
                {(mode == "dark") && <p style={{fontSize: 40}}>Dark</p>}
                {(mode == "light") && <p style={{fontSize: 40}}>Light</p>}
                {(mode == "color") && <p style={{fontSize: 20}}>Firefox<br/>Colors</p>}


            </div>
        </div>
        </div>
    )
}