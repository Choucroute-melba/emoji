import s from './Selector.module.css';
import {useDispatch, useSelector} from "react-redux";
import {useRef, useEffect, useState} from "react";
import EmojiCard from "./Components/EmojiCard";
import {Emoji} from "./utils/emoji";
import {insertEmoji, selectEmoji, toggleSearching} from "./emojiSlice";

// noinspection JSSuspiciousNameCombination
export default function Selector() {
    const position = useSelector((state: any) => state.emoji.position);
    const displayAbove = useSelector((state: any) => state.emoji.displayAbove);
    const shape = useSelector((state: any) => state.emoji.shape);
    const searchResults = useSelector((state: any) => state.emoji.searchResults);
    const search = useSelector((state: any) => state.emoji.emojiSearchValue);
    const selectedEmojiIndex = useSelector((state: any) => state.emoji.selectedEmojiIndex);

    const selectorRef = useRef<HTMLDivElement>(null);

    const  [computedPosition, setComputedPosition] = useState({x: 0, y: 0});

    useEffect(() => {
        if(selectorRef.current && displayAbove) {
            const rect = selectorRef.current.getBoundingClientRect();
            setComputedPosition({x: position.x, y: position.y - rect.height - 10});
        }
        else if(selectorRef.current)
            setComputedPosition(position);
    }, [selectorRef.current?.getBoundingClientRect().height, search]);

    const dispatch = useDispatch();

    const dispatchEmojiClick = (emoji: Emoji) => {
        dispatch(selectEmoji(emoji));
        dispatch(insertEmoji())
        dispatch(toggleSearching(false))
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

    return (
        <div ref={selectorRef} className={s.popup} style={{top: computedPosition.y, left: computedPosition.x, minWidth: shape.w + "px"}}>
            <div className={s["emoji-list"]}>
                {emojiList}
            </div>
        </div>
    )
}