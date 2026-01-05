# Version 4.3.2
*05/01/2026*

- avoid conflicts between emojeezer styling and other website styles

# Version 4.3.1
*21/12/2025*

- Fixed a styling issue that caused glitches in websites

# Version 4.3.0
*21/12/2025*

This version brings the favorite emojis features and styling improvements.

# Version 4.2.1
*14/12/2025*

- Added a survey to fill when the addon is uninstalled

# Version 4.2.0
*14/12/2025*

Emoji suggestions are here ─ Now when you open a selector, you'll see a list of suggested emojis based on your recent usage.
This feature can be disabled in the extension's settings.

- Allow changing the shortcut for the selector
- Added a new setting to disable emoji suggestions
- Allow deleting usage history
- Show most used emojis first in the selector
- Lots of internal code improvements
- bug fixes

# Version 4.1.1
*30/11/2025*

- Fixed a bug that prevented the extension from working on some sites
- fixed a display bug in the action popup

# Version 4.1.0
*30/11/2025*

A new setting page allows you to control the extension's behavior and see sites where you've disabled the extension.
Accessible from the extension's icon or in your browser's settings.

- Allow disabling either the autocomplete or the selector
- Added a settings page
- Improved the control panel
- Implemented a new data management system
- Fixed multiple bugs
- Improved build and release process

# Version 4.0.0
*07/11/2025*

You can now disable autocomplete, totally or on specific websites. To do this, you just have to click on 
the Emojeezer icon in your browser's toolbar (please check if it isn't in the overflow menu, aka the puzzle piece icon).

- Implemented basic settings
- Added a control panel in browser's toolbar
- Added links to GitHub and Review

# Version 3.2.1
*24/09/2025*

- Improved compatibility with iframes

# Version 3.2.0
*22/09/2025*

- Improved the positioning of the selector in some cases
- Improved the pop-up selector styling
- Stability improvements for mailbox editors

# Version 3.1.0
*18/09/2025*

- Added support for mailbox editors
- Improved the on-demand pop-up selector
- Stability improvements

# Version 3.0.0
*13/06/2025*

Version 3 is here, with a core update on how features are loaded. This will allow easily 
creating handlers for specific use cases.

- Added a new on-demand selector that you can trigger by pressing `Ctrl + ,`
- Fix #4, the slash no longer triggers the emoji selector
- Now the emoji selection by click actually works
- [dev] You can now start developing your own extension for specific cases
- [dev] Added extensions to the release process and build system
- [dev] Improved the control of selector's positioning

# Version 2.2.8
*24/04/2025*

- Emoji picker now only appears when you type at least one character after the colon
- Fixed some bugs and cleaned up the logs

# Version 2.2.7
*13/12/2024*

- Fixed behavior on Twitter's AriaDivElement
- Fixed the bug when extension was not reacting to the backspace key

# Version 2.2.6
*02/11/2024*

- [dev] Changed the dev and build process to use web-ext
- [dev] fixed the release workflow

# Version 2.2.1
*31/10/2024*

- Fixed the bug when an emoji turn back to it's :code: version after being inserted
- Better event detection

# Version 2.2.0
*05/10/2024*

- Added support for Aria textboxes. The extension should now work on many other inputs
- Fixed various bugs and UI problems
- Updated doc in readme

# Version 2.1.0
*06/09/2024*

- completed documentation
- completed the emoji insertion with shortcode feature
- changed selector's style
- code architecture improvements
- fixed various bugs