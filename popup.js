/**
 * Formats and copies URLs of active browser tabs to the clipboard based on user settings,
 * then triggers a UI popup confirming the count of copied URLs.
 * 
 * Supports on-the-fly setting overrides via keyboard modifiers on click:
 * - **Alt Key**: Toggles whether to copy tabs from all windows or just the current window.
 * - **Ctrl Key**: Toggles whether to copy only the currently selected tabs.
 * 
 * @async
 * @param {MouseEvent} clickEvent - The click event that triggered the copy, used to detect Alt/Ctrl modifier keys.
 */
async function CopyURLtoClipboard(clickEvent){
  //Retrieve stored user preferences.
  const Options = await chrome.storage.sync.get(['copyFromAllWindows', 'ignorePinned', 'selectedTabs', 'decodeUnicode', 'copyAsMIMEtype', 'CopyFormat', 'CustomTemplate']);

  // Hold Alt key to toggle copyFromAllWindows setting
  if(clickEvent.altKey === true)
    Options.copyFromAllWindows = !Options.copyFromAllWindows;

  // Hold Ctrl key to toggle selectedTabs setting
  if(clickEvent.ctrlKey === true)
    Options.selectedTabs = !Options.selectedTabs;
  

  //Create queryOptions based on stored user preferences.
  let queryOptions = {};
  if(Options.copyFromAllWindows === false || Options.copyFromAllWindows == null) queryOptions["lastFocusedWindow"] = true;
  if(Options.ignorePinned === true) queryOptions["pinned"] = false;
  if(Options.selectedTabs === true) {queryOptions["highlighted"] = true; queryOptions["lastFocusedWindow"] = true;}

  //Retrieve the popup element used to display the number of copied URLs.
  const popup = document.getElementById("CopyPopup");
  
  //Retrieve active tabs based on user-selected filters.
  const tabsQueryResult = await chrome.tabs.query(queryOptions);
  
  if (!Array.isArray(tabsQueryResult) || !tabsQueryResult.length) {
      popup.innerHTML = "0 URLs Copied"
      popup.classList.toggle("show");
      return;
  }
  
  //Apply the formatting option selected by the user to tab URLs.
  const formattedURLs = formatURLs(tabsQueryResult, Options.decodeUnicode, Options.CopyFormat, Options.CustomTemplate);
        
  //display the number of copied URLs.          
  if(tabsQueryResult.length === 1){
    popup.innerHTML = "1 URL Copied";
  }
  else{
    popup.innerHTML = tabsQueryResult.length + " URLs Copied";
  }
  popup.classList.toggle("show");
  
  //write the URLs to the clipboard. 
  //navigator.clipboard.writeText(formattedURLs).catch(err => console.error("Clipboard write failed:", err)); 

  // Write the formatted URLs to the clipboard with proper MIME type
  if(Options.copyAsMIMEtype === true && (Options.CopyFormat === 'HTML_URL' || Options.CopyFormat === 'HTML_Title' || Options.CopyFormat === 'Custom'))
    navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([formattedURLs], { type: "text/plain" }),
        "text/html": new Blob([formattedURLs.replace(/\n/g, "<br>")], { type: "text/html" })
      })
    ]).catch(err => console.error("Clipboard write failed:", err));  
  else navigator.clipboard.writeText(formattedURLs).catch(err => console.error("Clipboard write failed:", err));    
}
 

/**
 * Applies the selected formatting option to an array of tab objects.
 *
 * @param {Array<chrome.tabs.Tab>} tabs - An array of Chrome tab objects.
 * @param {boolean} [decodeUnicode=true] - Whether to decode Unicode characters in the URLs. Defaults to true if null or undefined.
 * @param {string} CopyFormat - The selected formatting option ('URLs', 'URLs_Titles', etc.). Defaults to URLs if null or undefined.
 * @param {string} customTemplate - The custom formatting template (if 'Custom' format is selected).
 * @returns {string} The formatted string of URLs and/or titles.
 */
function formatURLs(tabs, decodeUnicode, CopyFormat, customTemplate){
  //default to true if decodeUnicode null or undefined.
  const shouldDecode = decodeUnicode ?? true;
  //const decodeIfNeeded = (url) => (shouldDecode ? decodeURI(url) : url); This causes a bug where the program halts when the URL has non-UTF-8 characters.

  const decodeIfNeeded = (url) => {
    if (!shouldDecode) return url;

    try{
      return decodeURI(url)
    } catch(e){
      if(e instanceof URIError){
        return url;
      }
      throw e;
    }

  }

  if(CopyFormat === 'URLs' || CopyFormat == null)
    return tabs.map(tab => `${decodeIfNeeded(tab.url)}`).join("\n");
  else if(CopyFormat === 'URLs_Titles')
    return tabs.map(tab => `${tab.title}\n${decodeIfNeeded(tab.url)}\n`).join("\n");
  else if(CopyFormat === 'HTML_URL')
    return tabs.map(tab => `<a href="${decodeIfNeeded(tab.url)}">${decodeIfNeeded(tab.url)}</a>`).join("\n");
  else if(CopyFormat === 'HTML_Title')
    return tabs.map(tab => `<a href="${decodeIfNeeded(tab.url)}">${tab.title}</a>`).join("\n");
  else if(CopyFormat === 'JSON')
    return JSON.stringify(tabs.map(tab => ({ url: decodeIfNeeded(tab.url), title: tab.title })), null, 2);  
  else if(CopyFormat === 'Custom'){
    if(customTemplate)
      return tabs.map(tab => 
                        customTemplate.replaceAll("$title", tab.title).replaceAll("$url", decodeIfNeeded(tab.url)).replaceAll("<br/>", "\n")).join("");
    else return "Error: Custom format template is empty. Please check the options page to configure it.";
  }
  else return "Error: Invalid copy format."
}

/** 
 * Retrieves URLs from the clipboard based on the user's saved extraction mode
 * and opens them in new browser tabs. If no URLs are found, displays a feedback popup.
 * 
 * @async
 * @throws {Error} Logs an error to the console if opening a specific tab fails.
*/
async function openUrlsInClipboard(){
  const{ PasteMode = 'Smart' } = await chrome.storage.sync.get(['PasteMode']);
  let URLsArray = [];

  if(PasteMode === "Smart") URLsArray = await SmartExtractUrlsInClipboard();
  else if(PasteMode === "Simple") URLsArray = await SimpleExtractUrlsInClipboard();

  if(URLsArray.length > 0)
    URLsArray.forEach(url => {
      chrome.tabs.create({ url:url }).catch(err => console.error("Opening URL failed:", err));
  });
  else{
    let popup = document.getElementById("PastePopup");
    popup.classList.toggle("show");
  }

}

/**
 * Splits clipboard content by whitespace (including newlines),
 * then return an array of strings without validating if they are valid URLs.
 * 
 * @returns {Array<string>} An array of strings.
 */
async function SimpleExtractUrlsInClipboard(){
  const clipboardContent = await navigator.clipboard.readText();
  const UrlsArray = clipboardContent.split(/[\r\n]+/).filter(url => url.trim() !== '');

  return UrlsArray;
}

/**
 * Reads text from the clipboard, extracts potential URLs using a regular expression,
 * and then opens each found URL in a new browser tab. If no URLs are found, it displays a popup message.
 */
async function SmartOpenUrlsInClipboard(){
  //Regular expression to find URLs in text.
  const ytre = /(\b(https?|ftp|file|chrome|ssh|mailto):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
  const URL_RegEx = /(\b(https?|ftp|file|chrome|ssh|mailto):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;'()]*[\-A-Z0-9+&@#\/%=~_|)])/ig;

  const clipboardContent = await navigator.clipboard.readText();
  const UrlsArray = clipboardContent.match(URL_RegEx) || [];
  if(UrlsArray.length === 0) {
    let popup = document.getElementById("PastePopup");
    popup.classList.toggle("show");
  }
  else
    for(let i = 0; i < UrlsArray.length; i++)
      chrome.tabs.create({ url:UrlsArray[i] });
}

/**
 * Extract and validate URLs from clipboard content.
 * - First, attempt direct parsing via whitespace splitting.
 * - If direct parsing fails, apply regex-based detection.
 * - Validate URLs using `URL.canParse().
 * 
 * @returns {Array<string>} An array of URLs.
 */
async function SmartExtractUrlsInClipboard(){
  const clipboardContent = await navigator.clipboard.readText();
  // Regex pattern to match URLs from clipboard text.
  const URL_RegEx = /(\b(https?|ftp|file|chrome|ssh|mailto):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;'()]*[\-A-Z0-9+&@#\/%=~_|)])/ig;
  const potentialURLs = clipboardContent.split(/\s+/).map(trimExtraPunctuation);
  let urls = [];


  for(const potentialURL of potentialURLs){
    //First attempt: Directly validate URL using built-in parsing.
    if(URL.canParse(potentialURL)) urls.push(potentialURL);
    else{
      //If direct parsing fails, apply regex extraction.
      const regexMatches = potentialURL.match(URL_RegEx);
      if(regexMatches){
        regexMatches.forEach(match => {
          if(URL.canParse(match)) urls.push(match); // Validate regex-captured matches before storing.
        })
      }
    }
  }

  return urls;
}

/**
 * Remove extraneous punctuation from a URL string while preserving meaningful formatting.
 *
 * @param {string} url - The URL string to be processed.
 * @returns {string} The Sanitized URL with unnecessary punctuation removed.
 */
function trimExtraPunctuation(url) {
  url = url.trim();

  //Remove leading extraneous punctuation characters (e.g., .,;:'"`<>[]{}!?()).
  url = url.replace(/^[\.,;:'"`<>\[\]{}!?()]+/, '');

  //Remove trailing punctuation, excluding parentheses which require special handling.
  url = url.replace(/[\.,;:'"`<>\[\]{}!?]+$/g, '');

  //Ensure closing parentheses are balanced with their opening counterparts.
  if (url.endsWith(")")) {
    const openCount = (url.match(/\(/g) || []).length;
    const closeCount = (url.match(/\)/g) || []).length;
    //If there are more closing parentheses than opening, remove the extra closing one.
    if (closeCount > openCount) {
      url = url.slice(0, -1);
    }
  }
  
  return url;
}

/**
 * Sets the "PasteURL" button's tooltip (title attribute) to show the total number of
 * URLs currently in the clipboard, with an optional listed preview.
 * 
 * @async
 * @param {'list' | 'count'} tooltip_type - The formatting style of the tooltip. 
 * Use "list" to append a truncated preview of the URLs, or "count" to show only the total count.
 */
async function PasteButton_toolTip(tooltip_type){

  if(document.hasFocus() === false) return;

  const UrlsArray = await SmartExtractUrlsInClipboard();
  const PasteButton = document.getElementById("PasteURL");
  let tooltip_text = "";
  
  const total = UrlsArray.length;
  const maxVisibleURLs = 12;

  if(total === 0){
    PasteButton.setAttribute("title", "0 URLs in Clipboard");
    return;
  }

  tooltip_text = `${total} URLs in Clipboard`

  if(tooltip_type === "list"){
      const VisibleURLs = UrlsArray.slice(0, maxVisibleURLs).map(url => {
       return url.length > 55 ? url.substring(0, 52) + "..." : url;
      });

      let URLsListText = VisibleURLs.join("\n");
      if(total > maxVisibleURLs) URLsListText += `\n... and ${total - maxVisibleURLs} more`

      tooltip_text = `${tooltip_text}\n${URLsListText}`
  }



  PasteButton.setAttribute("title", `${tooltip_text}`)
}

document.addEventListener('DOMContentLoaded', function() {
    let Copy = document.getElementById('CopyURL');
    let Paste = document.getElementById('PasteURL');
    
    //Copy button code
    Copy.addEventListener('click', (clickEvent) => {

        CopyURLtoClipboard(clickEvent);
        setTimeout(function(){window.close();}, 3000); //set a timeout to close the current popup window after 3000 milliseconds (3 seconds).
    });

    //Paste button code
    Paste.addEventListener('click', function() {
    
        openUrlsInClipboard();
        setTimeout(function(){window.close();}, 5000); //set a timeout to close the current popup window after 5000 milliseconds (5 seconds).
    });

    //Paste button tooltip Code
    chrome.storage.sync.get(['PasteButtonTooltip']).then(data => {
      if(data.PasteButtonTooltip === "count" || data.PasteButtonTooltip === "list")
        Paste.addEventListener('mouseenter', () => PasteButton_toolTip(data.PasteButtonTooltip))
    })

});