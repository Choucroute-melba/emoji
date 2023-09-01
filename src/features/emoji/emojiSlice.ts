import {createSlice} from "@reduxjs/toolkit";
import {Emoji, emojis, searchEmoji} from "./utils/emoji";
import {getAbsoluteCaretPosition, getVerticalPosition} from "./utils/selector";

export interface EmojiState {
    display: boolean;
    position: {
        x: number;
        y: number;
    }
    shape: {
        w: number;
        h: number;
    },
    displayAbove: boolean,
    dispositionMethod: "box" | "cursor",
    textFields: NodeListOf<Element>
    focusedTextField: HTMLInputElement | HTMLTextAreaElement | null,
    searching: boolean,
    searchStartOffset: number | undefined,
    searchEndOffset: number | undefined,
    emojiSearchValue: string,
    searchResults: Emoji[] | null,
    selectedEmoji: Emoji | null,
    selectedEmojiIndex: number | null
}

const initialState: EmojiState = {
    display: false,
    position: {
        x: 0,
        y: 0
    },
    shape: {
        w: 0,
        h: 0
    },
    displayAbove: false,
    dispositionMethod: "box",
    textFields: document.querySelectorAll("input[type=text], textarea"),
    focusedTextField: null,
    searching: false,
    searchStartOffset: undefined,
    searchEndOffset: undefined,
    emojiSearchValue: "",
    searchResults: null,
    selectedEmoji: null,
    selectedEmojiIndex: null
}

export const emojiSlice = createSlice({
    name: "emoji",
    initialState,
    reducers: {

        __init__: (state, action) => {

        },
        toggleDisplay: (state, action: {payload: boolean | undefined}) => {
            if(action.payload !== undefined)
                state.display = action.payload;
            else
                state.display = !state.display;
        },
        setFocusedTextField: (state, action: {payload: Element | null, type: string}) => {
            const f = action.payload;
            // @ts-ignore
            state.focusedTextField = f;
            if(f === null) {
                state.display = false;
                return
            }

        },
        /**
         * Update the position of the emoji selector if the disposition method is "cursor"
         * @param state
         */
        updatePosition: (state) => {
            if(state.focusedTextField === null)
                return;

            const f = state.focusedTextField
            const rect = f.getBoundingClientRect();
            if(f.tagName === "TEXTAREA" && rect.height > window.innerHeight / 4)
                state.dispositionMethod = "cursor";
            else
                state.dispositionMethod = "box";

            if(state.dispositionMethod === "cursor") {
                const pos = getAbsoluteCaretPosition(state.focusedTextField as HTMLTextAreaElement);
                state.displayAbove = pos.y - window.scrollY > window.innerHeight / 2;
                if(state.displayAbove === false)
                    state.position = {
                        x: pos.x,
                        y: pos.y + pos.lineH
                    }
                else
                    state.position = {
                        x: pos.x,
                        y: pos.y
                    }
            }
            else if(state.dispositionMethod === "box") {
                const fPos = getVerticalPosition(f as any);
                state.displayAbove = fPos !== "up";

                if(state.displayAbove) {
                    state.position.x = rect.x + window.scrollX;
                    state.position.y = rect.y + window.scrollY;
                    state.shape.w = rect.width;
                } else {
                    state.position.x = rect.x + window.scrollX;
                    state.position.y = rect.y + rect.height + window.scrollY;
                    state.shape.w = rect.width;
                }
            }
            if(state.dispositionMethod === "cursor" && state.focusedTextField !== null) {

            }
        },
        toggleSearching: (state, action: {payload: boolean | undefined}) => {
            if(action.payload === undefined)
                state.searching = !state.searching;
            else
                state.searching = action.payload;

            if(state.searching === false) {
                state.searchStartOffset = undefined;
                state.searchEndOffset = undefined;
                state.searchResults = null;
                state.selectedEmoji = null;
                state.selectedEmojiIndex = null;
                state.display = false;
            } else {
                state.display = true;
                if(state.searchResults != null && state.searchResults.length > 0) {
                    state.selectedEmoji = state.searchResults[0];
                    state.selectedEmojiIndex = 0;
                }
            }
        },
        /**
         * Set the search offsets following the given params.
         * @param state
         * @param action
         * @param action.start The start offset of the search. if undefined, the focusedTextField.selectionStart will be used
         * @param action.end The end offset of the search. if undefined, the focusedTextField.selectionStart will be used
         */
        setSearchOffsets: (state, action: {payload: {start: number | undefined, end: number | undefined} | undefined, type: string}) => {
            state.searchStartOffset = action.payload?.start ?? state.focusedTextField?.selectionStart ?? undefined;
            state.searchEndOffset = action.payload?.end ?? state.focusedTextField?.selectionStart ?? undefined;
        },
        searchEmojis: (state, action: {payload: string, type: string}) => {
            state.searchResults = searchEmoji(action.payload);
        },
        setEmojiSearchValue: (state, action: {payload: string, type: string}) => {
            state.emojiSearchValue = action.payload;
        },
        /**
         * update the search value using search offsets then update the search results
         * @param state
         */
        updateEmojiSearch: (state) => {
            if(state.focusedTextField === null || state.searchStartOffset === undefined || state.searchEndOffset === undefined) {
                state.emojiSearchValue = "";
                state.searchResults = null;
                return;
            }
            state.emojiSearchValue = state.focusedTextField.value.substring(state.searchStartOffset, state.searchEndOffset);
            state.searchResults = searchEmoji(state.emojiSearchValue.replaceAll(":", ""));
            if(state.searchResults != null && state.searchResults.length > 0) {
                state.selectedEmoji = state.searchResults[0];
                state.selectedEmojiIndex = 0;
            } else {
                state.selectedEmoji = null;
                state.selectedEmojiIndex = null;
            }
        },
        /**
         * Select an emoji in the search results
         * @param state
         * @param action payload : An emoji object that is present in the search results
         */
        selectEmoji: (state, action: {payload: Emoji, type: string}) => {
            if(state.searchResults === null)
                return;
            let index = state.searchResults.findIndex((e: Emoji) => e.unicode === action.payload.unicode);
            if(index === -1)
                return;
            state.selectedEmoji = action.payload;
            state.selectedEmojiIndex = index;
        },
        selectUp: (state) => {
            if(state.searchResults === null)
                return;
            if(state.selectedEmojiIndex === null)
                return;
            if(state.selectedEmojiIndex === 0)
                return;
            state.selectedEmojiIndex--;
            state.selectedEmoji = state.searchResults[state.selectedEmojiIndex];
        },
        selectDown: (state) => {
            if(state.searchResults === null)
                return;
            if(state.selectedEmojiIndex === null)
                return;
            if(state.selectedEmojiIndex === state.searchResults.length - 1)
                return;
            if(state.selectedEmojiIndex === 10)
                return;
            state.selectedEmojiIndex++;
            state.selectedEmoji = state.searchResults[state.selectedEmojiIndex];
        },
        /**
         * Insert the selected emoji in the focused text field
         * @param state
         * @param action
         * @param action.payload (default : "selection") The type of the insertion. Can be "selection" to insert the selected emoji or "shortcode" to insert the emoji corresponding to the shortcode searched.
         */
        insertEmoji: (state, action: {payload: "selection" | "shortcode" | undefined, type: string}) => {
            let strategy = action.payload ?? "selection";
            if(state.focusedTextField === null || state.selectedEmoji === null)
                return;
            if(state.searchStartOffset === undefined || state.searchEndOffset === undefined)
                return;
            if(strategy === "selection")
                state.focusedTextField?.setRangeText(state.selectedEmoji?.unicode ?? "", state.searchStartOffset, state.searchEndOffset, "end");
            else if(strategy === "shortcode") {
                const index = emojis.findIndex((e: Emoji) => {
                    let match = false;
                    e.shortcodes.forEach((sc: string) => {
                        if(sc === state.emojiSearchValue.replaceAll(":", ""))
                            match = true;
                    });
                    return match;
                });
                if(index === -1)
                    return;
                else {
                    const emoji = emojis[index];
                    state.focusedTextField?.setRangeText(emoji.unicode, state.searchStartOffset, state.searchEndOffset, "end");
                }
            }
        }
    }
});

export const {
    toggleDisplay,
    setFocusedTextField,
    updatePosition,
    toggleSearching,
    searchEmojis,
    selectEmoji,
    selectUp,
    selectDown,
    setEmojiSearchValue,
    setSearchOffsets,
    updateEmojiSearch,
    insertEmoji
} = emojiSlice.actions;
export default emojiSlice.reducer;

export function onKeydown(key: KeyboardEvent) {
    return async (dispatch: Function, getState: Function) => {
        const state = getState().emoji;

        switch (key.key) {
            case "ArrowUp":
                if(state.searching === true) {
                    dispatch(selectUp());
                    key.preventDefault();
                }
                break;

            case "ArrowDown":
                if(state.searching === true) {
                    dispatch(selectDown());
                    key.preventDefault();
                }
                break;

            case "Enter":
                if(state.searching === true) {
                    dispatch(insertEmoji());
                    dispatch(toggleSearching(false));
                    key.preventDefault();
                }
                break;

            case "Escape":
                dispatch(toggleSearching(false));
                key.preventDefault();
                break;
        }
    }
}

export function onKeyup(key: KeyboardEvent) {
    return async (dispatch: Function, getState: Function) => {
        let state = getState().emoji;

        switch (key.key) {
            case ":":
                if(state.searching === false) {
                    dispatch(toggleSearching(true));
                    dispatch(updatePosition())
                    dispatch(setSearchOffsets({start: state.focusedTextField!.selectionStart - 1, end: undefined}));
                    dispatch(updateEmojiSearch());
                }
                if(state.searching === true) {
                    dispatch(setSearchOffsets({start: state.searchStartOffset, end: undefined}));
                    dispatch(insertEmoji("shortcode"));
                    dispatch(toggleSearching(false));
                    return;
                }
                break;

            case " ":
                dispatch(toggleSearching(false));
                break;

            case "ArrowUp":
                break;
            case "ArrowDown":
                break;
            case "Enter":
                break;

            default:
                if(state.searching === true) {
                    dispatch(setSearchOffsets({start: state.searchStartOffset, end: undefined}));
                    state = getState().emoji;
                    if(state.searchStartOffset >= state.searchEndOffset) {
                        dispatch(toggleSearching(false));
                        return;
                    }
                    dispatch(updatePosition());
                    dispatch(updateEmojiSearch());
                }
        }
    }
}