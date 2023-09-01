# Emoji on the go
A firefox extension to quickly insert emoji into text fields, using the :emoji_name: syntax.

## Wanted behaviour
1. When the user types `:` in a text field, a list of suggested emoji appears above or below the text field.
2. the emoji list is filtered according to what the user types after the `:`
3. the user can select an emoji from the list using the arrow keys and press `enter` or click on it to replace the `:emoji_name:` with the emoji in the text field
4. the user can press `esc` to close the emoji list
5. if the user type a char other than a letter or `_` in the emoji name, the emoji list closes
6. if the user types a second `:`, the emoji list closes and if an emoji matching the name is found, it is inserted in the text field
7. the use of the navigation keys (`up`, `down`, `enter`, `esc`) must not trigger any default behaviour from the website (for example, the `enter` key should not submit a form or send a message)
8. the emoji list is closed when the text field loses focus

## Implementation ideas
1. `state.displaysEmojiList: boolean` and `state.searching: boolean`. `state.displayAbove: boolean` say where to display the emoji list
2. update `state.searchResults: Array<Emoji>` as the user types
3. `state.selectedEmoji: Emoji` and `state.selectedEmojiIndex: number`. Use the search offsets to know what to replace
4. `state.searching = false`
5. update `state.searching = false`
6. Keep track of the search offset in the text field and if a second `:` is typed, find a match in the emoji list.
7. `event.preventDefault()` on `keydown` events (only for those keys and if `state.searching = true`)
8. `state.searching = false`