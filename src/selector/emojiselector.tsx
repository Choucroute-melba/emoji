import React from 'react';
import './Components/Selector.css';
import {createRoot, Root} from 'react-dom/client';
import Selector from "./Components/Selector";
import {Emoji, searchEmoji} from "../emoji/emoji";
import {calculateXYFromElt, getRelativeVerticalPositioning} from "./selector";

/** @class EmojiSelector
 * This class is responsible for managing the emoji selector component
 * it offers a simple API to control the selector's interface and properties
 * @property {function} onEmojiSelected - a callback function that will be executed when an emoji is selected (for example when the user click on the interface)
 */
export default class EmojiSelector {
    private root: HTMLElement;
    private reactRoot: Root;
    private _searchResults: Emoji[] = [];
    private _display = false;
    private _focusedEmojiIndex = 0; // The index of the currently focused emoji in selector
    private _position = {x: 0, y: 0}; // the absolute position of the selector on the page
    private _positioning: "up" | "down" = "down";
    private _debugText: string = ""

    public onEmojiSelected: (emoji: Emoji) => void = () => {};

    constructor() {
        this.root = document.createElement('div');
        this.root.id = 'emoji-selector';
        this.root.classList.add('emoji-selector');
        this.root.style.display = 'none';

        document.body.appendChild(this.root);

        this.reactRoot = createRoot(this.root);
        this.reactRoot.render(this.component());
    }

    focusUp() {
        if(this._focusedEmojiIndex > 0) {
            this._focusedEmojiIndex--;
        }
        else
            this._focusedEmojiIndex = this._searchResults.length - 1;
        this.reactRoot.render(this.component());
    }
    focusDown() {
        if(this._focusedEmojiIndex < this._searchResults.length - 1) {
            this._focusedEmojiIndex++;
        }
        else
            this._focusedEmojiIndex = 0;
        this.reactRoot.render(this.component());
    }

    getFocusedEmoji() {
        return this._searchResults[this._focusedEmojiIndex];
    }

    /**
     * Calculate and update the selector's position using given text input
     */
    setPositionFromElement(elt: HTMLInputElement | HTMLTextAreaElement) {
        this._positioning = getRelativeVerticalPositioning(elt);
        this._position = calculateXYFromElt(elt, this._positioning);
        this.reactRoot.render(this.component());
    }

    private component() {
        return (
            <Selector position={this._position} displayAbove={this._positioning == "up"} shape={{w: 250, h: 400}} searchResults={this._searchResults} selectedEmojiIndex={this._focusedEmojiIndex} debugText={this._debugText} onEmojiSelected={() => {}}/>
        );
    }

    set searchResults(value: Emoji[]) {
        this._searchResults = value;
        this.reactRoot.render(this.component());
    }
    get searchResults() {return this._searchResults;}

    set display(value: boolean) {
        this._display = value;
        this.root.style.display = this._display ? 'block' : 'none';
        this.reactRoot.render(this.component());
    }
    get display() {return this._display;}

    /** set the absolute position of the selector on the page */
    set position(value: {x: number, y: number}) {
        this._position = value;
        this.reactRoot.render(this.component());
    }

    /** set a text that will be shown in the selector for debugging purposes */
    set debugText(value: string) {
        this._debugText = value;
        this.reactRoot.render(this.component());
    }

}