import './EmojiCard.css';
import {Emoji} from "emojibase"
import {useState, useRef, useEffect} from "react";
import React from 'react';
import Star from "./Star";

export default function EmojiCard(props: {
    emoji: Emoji,
    selected: boolean,
    isFavorite: boolean,
    onClick: (emoji: Emoji) => void,
    onFavoriteToggle: (emoji: Emoji) => void,
    cardStyle: "square" | "full",
} ) {

    const [displayStar, setDisplayStar] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);


    return (
        <div ref={cardRef} className={(props.cardStyle === "square" ? "emoji-card square" : "emoji-card") + (props.selected ? (" focus") : (""))}
             data-stop-propagation="true"
             onClick={(e) => {
                 e.stopPropagation();
                 props.onClick(props.emoji)
             }}
             onMouseEnter={() => {setDisplayStar(true)}}
             onMouseLeave={() => {setDisplayStar(false)}}
        >
            <div className={"left"}>
                <p className={"emojiDisplay"}>{props.emoji.emoji}</p>
            </div>
            <div className={"middle"} style={{display: props.cardStyle === "full" ? "block" : "none"}}>
                <p className={""}>{props.emoji.label}</p>
                {(props.selected) &&
                    <p className={"shortcode"}>{props.emoji.shortcodes && props.emoji.shortcodes.join(", ")}</p>
                }
            </div>
            <div className={"right"} style={{display: displayStar || ((props.selected || props.isFavorite) && props.cardStyle !== "square") ? "flex" : "none"}}
                 onClick={(e) => {
                     e.stopPropagation()
                     props.onFavoriteToggle(props.emoji);
                 }}
            >
                <Star filled={props.isFavorite} height={props.cardStyle === "full" ? 24 : 12} width={props.cardStyle === "full" ? 24 : 12}/>
            </div>
        </div>
    )
}

export function EmojiTooltip(props: {emoji: Emoji, position: {x: number, y: number}}) {
    return (
        <div className={"emoji-tooltip"} style={{top: props.position.y + "px", left: props.position.x + "px"}}>
            <p className={"emoji-tooltip__p"}>{props.emoji.shortcodes && props.emoji.shortcodes.join(", ")}</p>
        </div>
    )
}