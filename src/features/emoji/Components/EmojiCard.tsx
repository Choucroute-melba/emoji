import s from './EmojiCard.module.css';
import {Emoji} from "../utils/emoji";
import {useState, useRef, useEffect} from "react";

export default function EmojiCard(props: {emoji: Emoji, selected: boolean, onClick: (emoji: Emoji) => void, cardStyle: "square" | "full"} ) {
    const [displayTooltip, setDisplayTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0});
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
        <div ref={cardRef} className={props.selected ? (s["emoji-card_focus"]) : (s["emoji-card"])}
             onClick={() => {props.onClick(props.emoji)}}
             onMouseEnter={() => {setDisplayTooltip(true)}}
                onMouseLeave={() => {setDisplayTooltip(false)}}
        >
            <p className={s["emoji-card__p"]}>{props.emoji.unicode}</p>
            {props.cardStyle === "full" && <div>
                <p className={s["emoji-card__p"]}>{props.emoji.name}</p>
            </div>}
            {displayTooltip && <EmojiTooltip emoji={props.emoji} position={tooltipPosition}/>}
        </div>
    )
}

export function EmojiTooltip(props: {emoji: Emoji, position: {x: number, y: number}}) {
    return (
        <div className={s["emoji-tooltip"]} style={{top: props.position.y + "px", left: props.position.x + "px"}}>
            <p className={s["emoji-tooltip__p"]}>{props.emoji.shortcodes.join(", ")}</p>
        </div>
    )
}