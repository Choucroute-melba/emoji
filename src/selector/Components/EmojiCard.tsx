import './EmojiCard.css';
import {Emoji} from "../../emoji/emoji";
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
    const [displayTooltip, setDisplayTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0});
    const [displayStar, setDisplayStar] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if(card) {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
            setTooltipPosition({x, y})
        }
    }, []);

    return (
        <div ref={cardRef} className={(props.cardStyle === "square" ? "emoji-card-square" : "emoji-card") + (props.selected ? ("_focus") : (""))}
             onClick={(e) => {
                 props.onClick(props.emoji)
             }}
             onMouseEnter={() => {setDisplayTooltip(true); setDisplayStar(true)}}
             onMouseLeave={() => {setDisplayTooltip(false); setDisplayStar(false)}}
             onMouseDown={(e) => {
                 e.preventDefault()
             }}
        >
            <div className={"emoji-card_left"}>
                <p className={"emoji-card__p"}>{props.emoji.unicode} {props.cardStyle === "full" && props.emoji.name}</p>
                {(props.selected && props.cardStyle === "full") && <p className={"shortcode"}>{props.emoji.shortcodes.join(", ")}</p>}
            </div>
            <div className={"emoji-card_right"} style={{display: displayStar || (props.selected || props.isFavorite) ? "flex" : "none"}}
                 onClick={(e) => {
                     e.stopPropagation()
                     props.onFavoriteToggle(props.emoji);
                 }}
            >
                <Star filled={props.isFavorite} height={props.cardStyle === "full" ? 24 : 12} width={props.cardStyle === "full" ? 24 : 12}/>
            </div>
            {displayTooltip && <EmojiTooltip emoji={props.emoji} position={tooltipPosition}/>}
        </div>
    )
}

export function EmojiTooltip(props: {emoji: Emoji, position: {x: number, y: number}}) {
    return (
        <div className={"emoji-tooltip"} style={{top: props.position.y + "px", left: props.position.x + "px"}}>
            <p className={"emoji-tooltip__p"}>{props.emoji.shortcodes.join(", ")}</p>
        </div>
    )
}