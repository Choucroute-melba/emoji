import React from "react";
import ThemePreview from "@src/settings/Components/ThemePreview";
import {GlobalSettings} from "@src/background/types";

export default function ThemingPage({
    setThemeMode,
    settings,
    toggleUseTransparentBg,
                                    }: {
    setThemeMode: (mode: "system" | "light" | "dark" | "color") => void,
    settings: GlobalSettings,
    toggleUseTransparentBg: () => void,
}) {
    //const [theme, setTheme] = React.useState<"system" | "dark" | "light" | "color">("system");
    const theme = settings.themeMode

    return (
        <>
            <h1>Theme and Customisation</h1>
            <h2>Select your theme</h2>
            <div className={"horizontalSection"}>
                <ThemePreview selected={theme === "system"} mode={"system"} onClick={ () => {
                    //setTheme("system");
                    setThemeMode("system");
                }} />
                <ThemePreview selected={theme === "light"} mode={"light"} onClick={ () => {
                    //setTheme("light");
                    setThemeMode("light");
                }}/>
                <ThemePreview selected={theme === "dark"} mode={"dark"} onClick={ () => {
                    //setTheme("dark");
                    setThemeMode("dark");
                }}/>
                <ThemePreview selected={theme === "color"} mode={"color"} onClick={ () => {
                    //setTheme("color");
                    setThemeMode("color");
                }}/>
            </div>
            <label style={{
                display: "block",
                marginTop: 20
            }}>
                <input type={"checkbox"} onChange={() => {toggleUseTransparentBg()}} checked={settings.transparentBackground}/>
                Use a blurred background effect
            </label>
        </>
    )
}