import React from "react";
import ThemePreview from "@src/settings/Components/ThemePreview";
import {GlobalSettings} from "@src/background/types";
import ToggleButton from "@src/Components/ToggleButton";

export default function ThemingPage({
    setThemeMode,
    settings,
    toggleUseTransparentBg,
    setActionIcon,
                                    }: {
    setThemeMode: (mode: "system" | "light" | "dark" | "color") => void,
    settings: GlobalSettings,
    toggleUseTransparentBg: () => void,
    setActionIcon: (icon: string) => void,
}) {
    //const [theme, setTheme] = React.useState<"system" | "dark" | "light" | "color">("system");
    const theme = settings.themeMode

    return (
        <>
            <h1>Theme and Customisation</h1>
            <h2>Select your theme</h2>
            <div className={"settingHighlight disabled"}>
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
            </div>
            <div className={"settingHighlight disabled"}>
                <ToggleButton onChange={() => {toggleUseTransparentBg()}} checked={settings.transparentBackground}>
                Use a blurred background effect
                </ToggleButton>
            </div>
            <div className={"settingHighlight disabled"}>
                <label>
                    Select the icon that will be used in your browser's toolbar :
                    <select value={settings.useEmojiOfTheDay ? "emojiOfTheDay" : "default"}
                            onChange={(e) => {
                                setActionIcon(e.target.value)
                            }}
                    >
                        <option value={"default"}>Default</option>
                        <option value={"emojiOfTheDay"}>Emoji of the Day</option>
                    </select>
                </label>
            </div>
        </>
    )
}