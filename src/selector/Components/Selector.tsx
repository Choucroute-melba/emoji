import {useRef, useEffect, useState} from "react";
import EmojiCard from "./EmojiCard";
import {Emoji} from "emojibase";
import React from 'react';
import {EmojiSelectorGeometry} from "../emojiselector";

export default function Selector({
                                     position,
                                     displayAbove,
                                     positionMode,
                                     themeMode,
                                     backgroundBlur,
                                     shape,
                                     searchResults,
                                     favorites,
                                     selectedEmojiIndexX,
                                     selectedEmojiIndexY,
                                     children,
                                     onEmojiSelected,
                                     onResize,
                                     onToggleEmojiFavorite,
                                     presentation,
                                     onSwitchGroup,
                                     currentGroup,
                                     groups,
                                     topComponent,
                                 }: {
    position: {x: number, y: number},
    displayAbove: boolean,
    positionMode: string,
    themeMode: "system" | "light" | "dark" | "color",
    backgroundBlur: boolean,
    shape: { w: number, h: number },
    searchResults: Emoji[] | Emoji[][],
    favorites: string[]
    selectedEmojiIndexX: number,
    selectedEmojiIndexY: number,
    children: React.ReactNode,
    onEmojiSelected: (emoji: Emoji) => void,
    onResize: (geometry: EmojiSelectorGeometry) => void,
    onToggleEmojiFavorite: (emoji: Emoji) => void,
    presentation: "results" | "browser",
    onSwitchGroup: (groupId: number) => void,
    currentGroup: number,
    groups: Record<number, string>,
    topComponent?: React.ReactNode,
}) {

    const selectorRef = useRef<HTMLDivElement>(null);
    const scrollSnapBottomEmojiRef = useRef<HTMLDivElement>(null);
    const scrollSnapTopEmojiRef = useRef<HTMLDivElement>(null);
    const prevGroupRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const  [computedPosition, setComputedPosition] = useState({x: 0, y: 0});
    const [scrollSnap, setScrollSnap] = useState(true);

    useEffect(() => {
        if(selectorRef.current && displayAbove) {
            const rect = selectorRef.current.getBoundingClientRect();
            setComputedPosition({x: position.x, y: position.y - rect.height - 10});
        }
        else if(selectorRef.current)
            setComputedPosition(position);
    }, [selectorRef.current?.getBoundingClientRect().height, searchResults]);

    useEffect(() => {
        if(scrollSnapBottomEmojiRef.current && scrollSnapTopEmojiRef.current) {
            /*            const bottomSnapRect = scrollSnapBottomEmojiRef.current.getBoundingClientRect();
                        const topSnapRect = scrollSnapTopEmojiRef.current.getBoundingClientRect();
                        const selectorRect = selectorRef.current!.getBoundingClientRect();
                        console.log("bottom snap rect", bottomSnapRect, "\ntop snap rect", topSnapRect, "\nselector rect", selectorRect);
                        console.log("bottom snap", scrollSnapBottomEmojiRef.current, "\ntop snap", scrollSnapTopEmojiRef.current);*/
            scrollSnapBottomEmojiRef.current.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
            scrollSnapTopEmojiRef.current.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
        }
        if(selectedEmojiIndexX <= 2 && selectorRef.current) {
            console.log("scrolling to top");
            selectorRef.current.scrollTo({top: 0, behavior: "smooth"});
        }

        console.log(`x: ${selectedEmojiIndexX}, y: ${selectedEmojiIndexY}, h : ${searchResults.length}, w ${(searchResults as Emoji[][])[selectedEmojiIndexY]?.length}`)
    }, [selectedEmojiIndexX, selectedEmojiIndexY, currentGroup]);

    useEffect(() => {
        if(prevGroupRef.current) {
            // @ts-ignore
            prevGroupRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "start", container: "nearest"});
            console.log("scrolling to previous group");
        }
    }, [currentGroup]);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                onResize({
                    position: computedPosition,
                    placement: displayAbove ? "up" : "down",
                    positionMode: positionMode as any,
                    shape: {w: entry.contentRect.width, h: entry.contentRect.height}
                })
            }
        });
        if (selectorRef.current) {
            observer.observe(selectorRef.current);
        }
        return () => {
            observer.disconnect();
        };
    }, []);

    const dispatchEmojiClick = (emoji: Emoji) => {
        onEmojiSelected(emoji);
    }

    const scrollRight = () => {
        if(headerRef.current) {
            headerRef.current.scrollBy({left: 70, behavior: "smooth"})
        }
    }
    const scrollLeft = () => {
        if(headerRef.current) {
            headerRef.current.scrollBy({left: -70, behavior: "smooth"})
        }
    }

    let emojiList;
    if(!searchResults || searchResults.length === 0) {
        emojiList = (
            <p>Start typing to see suggestions</p>
        )
    } else {
        let i = -1;
        emojiList = searchResults.map((emoji: Emoji | Emoji[]) => {
            i++;
            if(Array.isArray(emoji)) {
                let j = 0
                const row = emoji.map((e) => {
                    // console.log(`row : ${i}, emoji : ${e ? e.emoji : e}`);
                    if(!e) return <td/>;
                    j++;
                    return (
                        <td>
                            <EmojiCard
                                emoji={e}
                                selected={i === selectedEmojiIndexX && j - 1 === selectedEmojiIndexY}
                                ref={i === selectedEmojiIndexX + 2 ? scrollSnapBottomEmojiRef : (i === selectedEmojiIndexX - 2 ? scrollSnapTopEmojiRef : undefined)}
                                isFavorite={favorites.includes(e.emoji)}
                                onClick={() => {
                                    dispatchEmojiClick(e);
                                }} cardStyle={"square"} key={e.emoji}
                                onFavoriteToggle={onToggleEmojiFavorite}
                            />
                        </td>
                    )})
                return (
                    <tr key={i}>
                        {row}
                    </tr>
                )
            }
            else {
                return (
                    <tr key={i}>
                        <td>
                            <EmojiCard
                                emoji={emoji}
                                selected={i === selectedEmojiIndexX}
                                ref={i === selectedEmojiIndexX ? scrollSnapBottomEmojiRef : undefined}
                                isFavorite={favorites.includes(emoji.emoji)}
                                onClick={() => {
                                    dispatchEmojiClick(emoji);
                                }} cardStyle={"full"} key={emoji.emoji}
                                onFavoriteToggle={onToggleEmojiFavorite}
                            />
                        </td>
                    </tr>
                )
            }
        })
    }

    const getStyle = () => {
        let style = {left: position.x, width: shape.w || undefined, height: shape.h || undefined};
        let scroll = {overflowY: "auto", overflowX: "auto"};
        let vPos = displayAbove ? {bottom: position.y} : {top: position.y};
        let mode = {position: positionMode}
        let colorScheme = {colorScheme: (themeMode === "system" || themeMode == "color") ? "light dark" : themeMode}

        style = {...style, ...vPos, ...mode, ...colorScheme, ...scroll};
        return style;
    }

    const groupList = Object.entries(groups).map(([groupId, groupName]) => {
        return {id: parseInt(groupId), name: groupName}
    })
    const currentGroupIndex = groupList.findIndex(g => g.id === currentGroup);
    const nextGroupIndex = (currentGroupIndex + 1) % groupList.length ;
    const prevGroupIndex = (currentGroupIndex - 1 + groupList.length) % groupList.length;
    const nextGroup = groupList.length > 0 ? groupList[nextGroupIndex].id : undefined;
    const prevGroup = groupList.length > 0 ? groupList[prevGroupIndex].id : undefined;

    return (
        <div
            ref={selectorRef}
            className={"emojeezer " + (positionMode!=="static" ? "popup" : "") + (backgroundBlur ? " transparent" : "")}
            style={{...getStyle()}} tabIndex={0}
        >
            {topComponent && <div className={"top-component"}>{topComponent}</div>}
            {(searchResults.length === 0) &&
                <div className={"emoji-list"}>
                    <p>Start typing to see suggestions</p>
                </div>
            }
            {(presentation === "results" && searchResults.length > 0) &&
                <div className={"emoji-list"}>
                    <table>
                        <tbody>
                        {emojiList}
                        </tbody>
                    </table>
                </div>
            }
            {(presentation === "browser" && searchResults.length > 0) &&
                <div className={"emoji-browser"}>
                    <div className={"browser-header"}
                         ref={headerRef}
                    >
                        <button className={"browser-header__button arrowLeft outlined"} onClick={scrollLeft}>{"<"}</button>
                        {groupList.length > 1 &&
                            groupList.map(({id: groupId, name: groupName}, index: number, array: {id: number, name: string}[])  => {
                                return (
                                    <button key={groupId}
                                            className={"browser-header__button" +
                                                (groupId === currentGroup ? " selected" : "") +
                                                ((groupId === array[0].id && currentGroup === array[0].id) || groupId === prevGroup ? " snap-start" : "")
                                            }
                                            onClick={() => {
                                                onSwitchGroup(groupId);
                                            }}
                                            ref={groupId === prevGroup && (currentGroup !== array[0].id) ? prevGroupRef : ((currentGroup === array[0].id && groupId === currentGroup) ? prevGroupRef : null)}
                                    >
                                        {groupName}
                                        {(groupId === nextGroup) &&
                                            <span className={"navigation-hint"}>Tab</span>
                                        }
                                        {(groupId === prevGroup) &&
                                            <span className={"navigation-hint"}>Shift + Tab</span>
                                        }
                                    </button>
                                )
                            })}
                        <button className={"browser-header__button arrowRight outlined"} onClick={scrollRight}>{">"}</button>
                    </div>
                    <table className={"browser-content"}>
                        <tbody>
                        {emojiList}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    )
}