import '@src/base.css'
import React from 'react';
import './Components/Selector.css';
import {createRoot, Root} from 'react-dom/client';
import Selector from "./Components/Selector";
import {Emoji} from "../emoji/emoji";

export type EmojiSelectorPosition = {
    position: {
        x: number;
        y: number;
    };
    placement: "up" | "down";
    mode?: "absolute" | "relative" | "fixed" | "sticky";
}

export type EmojiSelectorGeometry = {
    position: { x: number, y: number };
    placement: "up" | "down";
    positionMode: "absolute" | "relative" | "fixed" | "sticky";
    shape: { w: number, h: number };
}

/** @class EmojiSelector
 * This class is responsible for managing the emoji selector component
 * it offers a simple API to control the selector's interface and properties
 * @property {function} onEmojiSelected - a callback function that will be executed when an emoji is selected (for example when the user click on the interface)
 */
export default class EmojiSelector {
    private root: HTMLElement;
    private reactRoot: Root;
    private popupBackground: HTMLDivElement;
    private _searchResults: Emoji[] = [];
    private _display = false;
    private _focusedEmojiIndex = 0; // The index of the currently focused emoji in selector
    private _position = {x: 0, y: 0}; // the absolute position of the selector on the page
    private _placement: "up" | "down" = "down";
    private _mode: "absolute" | "relative" | "fixed" | "sticky" = "absolute";
    private _debugText: string = ""
    private _shape = {w: 0, h: 0}; // the shape of the selector, used for resizing
    private _inDocument = false;

    public onEmojiSelected: (emoji: Emoji) => void = () => {};
    public onResize: (geometry: EmojiSelectorGeometry) => void = () => {};
    public onBlur: () => void = () => {};
    public onClose: () => void = () => {};

    constructor() {
        this.root = document.createElement('div');
        this.root.id = 'emoji-selector';
        this.root.classList.add('emoji-selector');
        this.root.style.display = 'none';

        this.popupBackground = document.createElement('div');
        this.popupBackground.classList.add('popupBackground');
        this.popupBackground.addEventListener('click', () => {this.onClose()});

        this.root.addEventListener('blur', () => {this.onBlur()});

        this.reactRoot = createRoot(this.root);
        this.reactRoot.render(React.createElement(this.component));
    }

    addToDom() {
        if(this._inDocument) return;
        document.body.appendChild(this.root);
        this.root.appendChild(this.popupBackground);
        this._inDocument = true;
    }

    removeFromDom() {
        if(!this._inDocument) return;
        document.body.removeChild(this.root);
        this.root.removeChild(this.popupBackground);
        this._inDocument = false;
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
    setFocusedEmoji(index: number) {
        if(index < 0 || index >= this._searchResults.length) return;
        this._focusedEmojiIndex = index;
        this.reactRoot.render(this.component());
    }

    private component() {
        return (
            <Selector
                position={this._position}
                displayAbove={this._placement == "up"}
                positionMode={this._mode}
                shape={this._shape}
                searchResults={this._searchResults}
                selectedEmojiIndex={this._focusedEmojiIndex}
                debugText={this._debugText}
                onEmojiSelected={this.onEmojiSelected}
                onResize={this.onResize}
                onToggleEmojiFavorite={() => {}}
            />
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
    set position(value: EmojiSelectorPosition) {
        this._position = value.position;
        this._placement = value.placement;
        this._mode = value.mode || "absolute";
        this.reactRoot.render(this.component());
    }
    get position() {return {
        position: this._position,
        placement: this._placement,
        mode: this._mode
    };}

    get geometry(): EmojiSelectorGeometry {
        return {
            position: this._position,
            placement: this._placement,
            positionMode: this._mode,
            shape: this._shape,
        };
    }
    set geometry(value: Partial<EmojiSelectorGeometry>) {
        if(value.position)
            this._position = value.position;
        if(value.placement)
            this._placement = value.placement;
        if(value.positionMode)
            this._mode = value.positionMode;
        if(value.shape)
            this._shape = value.shape;
        this.reactRoot.render(this.component());
    }

    /** set a text that will be shown in the selector for debugging purposes */
    set debugText(value: string) {
        this._debugText = value;
        this.reactRoot.render(this.component());
    }

    get hasFocus(): boolean {
        return this.root.contains(document.activeElement);
    }

}