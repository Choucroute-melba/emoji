import './Selector.css';
import {useRef, useEffect, useState} from "react";
import EmojiCard from "./EmojiCard";
import {Emoji} from "emojibase";
import React from 'react';
import {EmojiSelectorGeometry} from "../emojiselector";

export default function Selector({
    position,
    displayAbove,
    positionMode,
    shape,
    searchResults,
    favorites,
    selectedEmojiIndex,
    children,
    onEmojiSelected,
    onResize,
    onToggleEmojiFavorite,
 }: {
    position: {x: number, y: number},
    displayAbove: boolean,
    positionMode: string,
    shape: { w: number, h: number },
    searchResults: Emoji[],
    favorites: string[]
    selectedEmojiIndex: number,
    children: React.ReactNode,
    onEmojiSelected: (emoji: Emoji) => void,
    onResize: (geometry: EmojiSelectorGeometry) => void,
    onToggleEmojiFavorite: (emoji: Emoji) => void,
 }) {

    const selectorRef = useRef<HTMLDivElement>(null);

    const  [computedPosition, setComputedPosition] = useState({x: 0, y: 0});

    useEffect(() => {
        if(selectorRef.current && displayAbove) {
            const rect = selectorRef.current.getBoundingClientRect();
            setComputedPosition({x: position.x, y: position.y - rect.height - 10});
        }
        else if(selectorRef.current)
            setComputedPosition(position);
    }, [selectorRef.current?.getBoundingClientRect().height, searchResults]);

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
        console.log("dispatchEmojiClick");
        onEmojiSelected(emoji);
    }

    let emojiList;
    if(searchResults === null || searchResults.length === 0) {
        emojiList = (
                <p>Start typing to see suggestions</p>
        )
    } else {
        let i = -1;
        emojiList = searchResults.map((emoji: Emoji) => {
            i++;
            if (i > 10) return null;
            if (i === selectedEmojiIndex) return (
                <EmojiCard
                    emoji={emoji}
                    selected={true}
                    isFavorite={favorites.includes(emoji.emoji)}
                    onClick={() => {
                        dispatchEmojiClick(emoji);
                    }} cardStyle={"full"} key={emoji.emoji}
                    onFavoriteToggle={onToggleEmojiFavorite}
                />
            )
            else return (
                <EmojiCard
                    emoji={emoji}
                    selected={false}
                    isFavorite={favorites.includes(emoji.emoji)}
                    onClick={() => {
                        dispatchEmojiClick(emoji);
                    }} cardStyle={"full"} key={emoji.emoji}
                    onFavoriteToggle={onToggleEmojiFavorite}
                />
            )
        })
    }

    const getStyle = () => {
        let style = {left: position.x, width: shape.w || undefined, height: shape.h || undefined};
        let vPos = displayAbove ? {bottom: position.y} : {top: position.y};
        let mode = {position: positionMode}
        style = {...style, ...vPos, ...mode};
        return style;
    }

    return (
        <div ref={selectorRef} className={"emojeezer " + (positionMode!=="static" ? "popup" : "")} style={getStyle()}>
            {children}
            <div className={"emoji-list"}>
                {emojiList}
            </div>
        </div>
    )
}