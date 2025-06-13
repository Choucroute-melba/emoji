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