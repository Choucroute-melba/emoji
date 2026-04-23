import '@src/base.css'
import './SettingsPage.css'
import '@src/selector/Components/EmojiCard.css'
import '@src/selector/Components/Selector.css'
import React from 'react'
import {useState} from 'react';
import {GlobalSettings} from "../background/types";
import {Emoji, Locale} from "emojibase";
import browser from "webextension-polyfill";
import BehaviourPage from "@src/settings/Components/BehaviourPage";
import ThemingPage from "@src/settings/Components/ThemingPage";
import AboutPage from "@src/settings/Components/AboutPage";

export default function SettingsPage({settings, usageData, favoriteEmojis,
    toggleKeepFreeSelectorEnabled,
    toggleGloballyEnabled,
    toggleFreeSelectorGloballyEnabled,
    toggleSiteEnabled,
    toggleAllowEmojiSuggestions,
    deleteUsageData,
    toggleFavoriteEmoji,
    setEmojiLocale,
    toggleAutoHide,
    setThemeMode,
    toggleUseTransparentBg,
} : {
    settings: GlobalSettings
    usageData: Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>,
    favoriteEmojis: Emoji[]
    toggleKeepFreeSelectorEnabled: (enable: boolean) => void,
    toggleGloballyEnabled: (enable: boolean) => void,
    toggleFreeSelectorGloballyEnabled: (enable: boolean) => void,
    toggleSiteEnabled: (url: string, enable: boolean) => void,
    toggleAllowEmojiSuggestions: (enable: boolean) => void
    deleteUsageData: () => void,
    toggleFavoriteEmoji: (emoji: Emoji | string) => void,
    setEmojiLocale: (locale: Locale) => Promise<true>,
    toggleAutoHide: () => void,
    setThemeMode: (mode: "light" | "dark" | "system" | "color") => void,
    toggleUseTransparentBg: () => void,
}) {

    const [selectedTab, setSelectedTab] = useState<"behaviour" | "theming" | "about">("behaviour");

    return (
        <div className={"settingsPage"}>
            <div className={"leftSpacer"}></div>
            <nav>
                <h1>Emojeezer Settings</h1>
                <button className={"navButton " + (selectedTab === "behaviour" ? " selected" : "")}
                        onClick={() => {setSelectedTab("behaviour")}}>
                    <span className={"icon"}
                          style={{mask: `url(${browser.runtime.getURL("assets/category-general.svg")}) center no-repeat`}}
                    />
                    Behaviour and Data
                </button>
                <button className={"navButton " +( selectedTab === "theming" ? " selected" : "")}
                        onClick={() => {setSelectedTab("theming")}}>
                    <span className={"icon"}
                          style={{mask: `url(${browser.runtime.getURL("assets/sparkles.svg")}) center no-repeat`}}
                    />
                    Theming
                </button>
                <button className={"navButton " + (selectedTab === "about" ? " selected" : "")}
                        onClick={() => {setSelectedTab("about")}}>
                    <span className={"icon"}
                          style={{mask: `url(${browser.runtime.getURL("assets/help.svg")}) center no-repeat`}}
                    />
                    About
                </button>
            </nav>
            <div className={"settingsContent"}>
                {
                    selectedTab === "behaviour" && <BehaviourPage
                        settings={settings}
                        usageData={usageData}
                        favoriteEmojis={favoriteEmojis}
                        toggleKeepFreeSelectorEnabled={toggleKeepFreeSelectorEnabled}
                        toggleGloballyEnabled={toggleGloballyEnabled}
                        toggleFreeSelectorGloballyEnabled={toggleFreeSelectorGloballyEnabled}
                        toggleSiteEnabled={toggleSiteEnabled}
                        toggleAllowEmojiSuggestions={toggleAllowEmojiSuggestions}
                        deleteUsageData={deleteUsageData}
                        toggleFavoriteEmoji={toggleFavoriteEmoji}
                        setEmojiLocale={setEmojiLocale}
                        toggleAutoHide={toggleAutoHide}
                    />
                }
                {
                    selectedTab === "theming" && <ThemingPage setThemeMode={setThemeMode} settings = {settings} toggleUseTransparentBg={toggleUseTransparentBg}/>
                }
                {
                    selectedTab === "about" && <AboutPage />
                }
            </div>
            <div className={"rightSpacer"}></div>
        </div>
    )
}