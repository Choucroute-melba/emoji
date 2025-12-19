import EmojiSelector from "../src/selector/emojiselector";
import {Emoji, searchEmoji} from "../src/emoji/emoji";
import {createRoot} from "react-dom/client";
import React from "react";
import EmojiCard from "../src/selector/Components/EmojiCard";
import Star from "../src/selector/Components/Star";

console.log('test');

const es = new EmojiSelector();
es.addToDom()
es.display = true;
es.onClose = () => console.log("closed")
es.onEmojiSelected = (emoji) => console.log(emoji)
es.onBlur = () => console.log("blurred")
es.onResize = () => console.log("resized")

console.log(es)

const input = document.getElementById("emojiSelectorTest") as HTMLInputElement;
input.focus();
const inputRect = input.getBoundingClientRect();
es.geometry = {
    position: {
        x: inputRect.x,
        y: inputRect.y + inputRect.height + 5,
    },
    placement: "down",
    positionMode: "absolute",
};
input.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    const results = searchEmoji(value, [], 40)
    es.searchResults = results;
    renderPreviews(false);
})
input.addEventListener('keydown', (e) => {
    if(e.key === "Enter") {
    }
    if(e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        es.focusDown()
        renderPreviews(false);
    }
    if(e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        es.focusUp()
        renderPreviews(false);
    }
})

es.searchResults = searchEmoji(input.value, [], 40)

const previewSquare = document.getElementById("previewSquare") as HTMLDivElement;
const previewFull = document.getElementById("previewFull") as HTMLDivElement;
const previewSquareSelected = document.getElementById("previewSquareSelected") as HTMLDivElement;
const previewFullSelected = document.getElementById("previewFullSelected") as HTMLDivElement;
const starPreview = document.getElementById("star") as HTMLDivElement;
const filledStarPreview = document.getElementById("filledStar") as HTMLDivElement;
const rootSquare = createRoot(previewSquare);
const rootFull = createRoot(previewFull);
const rootSquareSelected = createRoot(previewSquareSelected);
const rootFullSelected = createRoot(previewFullSelected);
const rootStar = createRoot(starPreview);
const rootFilledStar = createRoot(filledStarPreview);

const renderPreviews = (focused: boolean) => {
    rootSquare.render(React.createElement(EmojiCard, {
        emoji: es.getFocusedEmoji(),
        cardStyle: "square",
        selected: false,
        isFavorite: true,
        onClick: () => console.log("clicked"),
        onFavoriteToggle: (emoji: Emoji) => {console.log("favorite toggled for ", emoji.unicode)}
    }))

    rootFull.render(React.createElement(EmojiCard, {
        emoji: es.getFocusedEmoji(),
        cardStyle: "full",
        selected: false,
        isFavorite: true,
        onClick: () => console.log("clicked"),
        onFavoriteToggle: (emoji: Emoji) => {console.log("favorite toggled for ", emoji.unicode)}
    }))

    rootFullSelected.render(React.createElement(EmojiCard, {
        emoji: es.getFocusedEmoji(),
        cardStyle: "full",
        selected: true,
        isFavorite: false,
        onClick: () => console.log("clicked"),
        onFavoriteToggle: (emoji: Emoji) => {console.log("favorite toggled for ", emoji.unicode)}
    }))

    rootSquareSelected.render(React.createElement(EmojiCard, {
        emoji: es.getFocusedEmoji(),
        cardStyle: "square",
        selected: true,
        isFavorite: false,
        onClick: () => console.log("clicked"),
        onFavoriteToggle: (emoji: Emoji) => {console.log("favorite toggled for ", emoji.unicode)}
    }))

    rootStar.render(React.createElement(Star, {filled: false, width:60, height:60}))
    rootFilledStar.render(React.createElement(Star, {filled: true, width:60, height:60}))
}

renderPreviews(false)

previewSquare.addEventListener('mouseenter', () => renderPreviews(true))
previewSquare.addEventListener('mouseleave', () => renderPreviews(false))