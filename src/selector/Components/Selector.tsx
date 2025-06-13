import './Selector.css';
import {useRef, useEffect, useState} from "react";
import EmojiCard from "./EmojiCard";
import {Emoji} from "../../emoji/emoji";
import React from 'react';

export default function Selector({position,
                                     displayAbove,
                                     positionMode,
                                     shape,
                                     searchResults,
                                     selectedEmojiIndex,
                                     debugText,
                                     onEmojiSelected
                                 }:
                                     {position: {x: number, y: number},
                                        displayAbove: boolean,
                                         positionMode: string,
                                         shape: { w: number, h: number },
                                         searchResults: Emoji[],
                                         selectedEmojiIndex: number,
                                         debugText: string,
                                         onEmojiSelected: (emoji: Emoji) => void
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
                <EmojiCard emoji={emoji} selected={true} onClick={() => {
                    dispatchEmojiClick(emoji);
                }} cardStyle={"full"} key={emoji.unicode}/>
            )
            else return (
                <EmojiCard emoji={emoji} selected={false} onClick={() => {
                    dispatchEmojiClick(emoji);
                }} cardStyle={"full"} key={emoji.unicode}/>
            )
        })
    }

    const getStyle = () => {
        let style = {left: position.x}
        let vPos = displayAbove ? {bottom: position.y} : {top: position.y};
        let mode = {position: positionMode}
        style = {...style, ...vPos, ...mode};
        return style;
    }

    return (
        <div ref={selectorRef} className={"popup"} style={getStyle()} >
            {<p className={"searchText"}>{debugText}</p>}
            <div className={"emoji-list"}>
                {emojiList}
            </div>
        </div>
    )
}