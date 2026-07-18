# Changelog
## [2.6.0]
### Added
- Paste button tooltip that previews the number of URLs or a list of URLs in the clipboard.
- Ctrl shortcut to toggle the "Copy only selected tabs" setting.

## [2.5.1]
### Fixed
- a bug in the helper function decodeIfNeeded inside the function formatURLs() where URLs that have non-UTF-8 characters will throw a URIError: malformed URI error and halt the program.

## [2.5.0]
-Refactored code.
-added comments.
### Added
-Unicode decoding.
-Copying as MIME type.

## [2.1.0]
### Added
- Custom format.

## [2.0.1]
### Fixed 
-  fixed a issue where the 'Copy from all windows' checkbox always appeared unselected, despite its actual state.

## [2.0.0]
### Added
- HTML and JSON formats.
- option to 'Copy from all windows'.

## [1.0.1]
### Fixed
- Corrected a minor bug in `popup.js` where `CopyURLtoClipboard(OptionsArray)` defaulted to 'URLs and Titles' instead of 'URLs only' when options were uninitialized after the first installation.

