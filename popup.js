/**
 * Copies active tabs URLs based on user-selected filters,
 * apply the chosen formatting,
 * then write the results to the clipboard.
 */
async function CopyURLtoClipboard(){
  //Retrieve stored user preferences.
  const Options = await chrome.storage.sync.get(['copyFromAllWindows', 'ignorePinned', 'selectedTabs', 'decodeUnicode', 'copyAsMIMEtype', 'CopyFormat', 'CustomTemplate']);

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
 * Splits clipboard content by whitespace (including newlines),
 * then opens each resulting string as a new tab without validating if they are valid URLs.
 */
async function OpenUrlsInClipboard(){
  const clipboardContent = await navigator.clipboard.readText();
  const UrlsArray = clipboardContent.split(/[\r\n]+/).filter(url => url.trim() !== '');
  for(let i = 0; i < UrlsArray.length; i++)
    chrome.tabs.create({ url:UrlsArray[i] });
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
 * - Validate URLs using `URL.canParse()`, then open valid ones in new tabs.
 * - If no URLs are found, show the paste popup for user feedback.
 */
async function SmartOpenUrlsInClipboard_Improved(){
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


  if(urls.length > 0){
    urls.forEach(url => {
      chrome.tabs.create({ url:url }).catch(err => console.error("Opening URL failed:", err));
    });
  }
  else{
    let popup = document.getElementById("PastePopup");
    popup.classList.toggle("show");
  }
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

  
document.addEventListener('DOMContentLoaded', function() {
    let Copy = document.getElementById('CopyURL');
    let Paste = document.getElementById('PasteURL');
    
    //Copy button code
    Copy.addEventListener('click', function(){
        CopyURLtoClipboard();
        setTimeout(function(){window.close();}, 3000); //set a timeout to close the current popup window after 3000 milliseconds (3 seconds).
    });

    //Paste button code
    Paste.addEventListener('click', function() {
        chrome.storage.sync.get(['PasteMode']).then(
          data => {
            if(data.PasteMode === "Simple") OpenUrlsInClipboard();
            else SmartOpenUrlsInClipboard_Improved();
            setTimeout(function(){window.close();}, 5000); //set a timeout to close the current popup window after 3000 milliseconds (3 seconds).
        })
    });
});




/**
 * Retrieves the current clipboard content as a string.
 * 
 * This function creates a temporary textarea element to facilitate clipboard pasting
 * using `document.execCommand("Paste")`. 
 * This function not needed asnymore beacuse the Clipboard API (`navigator.clipboard.readText()`) exist.
 * and document.execCommand() is deprecated.
 * 
 * @returns {string} The clipboard contents as a string.
 
function GetClipboardContent(){
  //Create a temporary textarea element to access clipboard content
  let tempTextArea = document.createElement("textarea");
  //Position the textarea off-screen
  tempTextArea.style = "position: absolute; left: -1000px; top: -1000px";
  //Append the textarea to the document body
  document.body.appendChild(tempTextArea);
  tempTextArea.contentEditable = true;
  //Focus the textarea to enable clipboard pasting
  tempTextArea.focus(); 
  //Execute the paste command to retrieve clipboard contents
  document.execCommand("Paste");

  //Extract the pasted text from the textarea
  let clipboardContents = tempTextArea.value;
  //Remove the temporary textarea from the DOM
  document.body.removeChild(tempTextArea);
  //Return the retrieved clipboard content
  return clipboardContents;
}
*/


/**
 * Applies the selected formatting option to an array of tab objects.
 *
 * @param {Array<chrome.tabs.Tab>} tabs - An array of Chrome tab objects.
 * @param {string} CopyFormat - The selected formatting option ('URLs', 'URLs_Titles', etc.).
 * @param {string} customTemplate - The custom formatting template (if 'Custom' format is selected).
 * @returns {string} The formatted string of URLs and/or titles.
 
function formatURLsOLD(tabs, CopyFormat, customTemplate){
  //TODO: Refactor to a switch statement for better readability.
  if(CopyFormat == 'URLs' || CopyFormat == null)
    return tabs.map(tab => tab.url).join("\n");
  else if(CopyFormat == 'URLs_Titles')
    return tabs.map(tab => `${tab.title}\n${tab.url}\n`).join("\n");
  else if(CopyFormat == 'HTML_URL')
    return tabs.map(tab => `<a href="${tab.url}">${tab.url}</a>`).join("\n");
  else if(CopyFormat == 'HTML_Title')
    return tabs.map(tab => `<a href="${tab.url}">${tab.title}</a>`).join("\n");
  else if(CopyFormat == 'JSON')
    return JSON.stringify(tabs.map(tab => ({ url: tab.url, title: tab.title })), null, 2);  
  else if(CopyFormat == 'Custom'){
    if(customTemplate)
      return tabs.map(tab => 
                        customTemplate.replaceAll("$title", tab.title).replaceAll("$url", tab.url).replaceAll("<br/>", "\n")).join("");
    else return "Error: Custom format template is empty. Please check the options page to configure it.";
  }

}
*/

/*
async function SmartOpenUrlsInClipboard_Improved(){
  const clipboardContent = await navigator.clipboard.readText();
  let urls = [];
  // Regex pattern to match URLs from clipboard text.
  const URL_RegEx = /(\b(https?|ftp|file|chrome|ssh|mailto):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;'()]*[\-A-Z0-9+&@#\/%=~_|)])/ig;

  clipboardContent.split(/\s+/).map(trimExtraPunctuation).forEach(potentialUrl => {
    // First attempt: Directly validate URL using built-in parsing.
    if(URL.canParse(potentialUrl)) urls.push(potentialUrl);
    else{ 
      // If direct parsing fails, apply regex extraction.
      const regexMatches = potentialUrl.match(URL_RegEx);
      if(regexMatches)
        regexMatches.forEach(match =>{
          if(URL.canParse(match)) urls.push(match); // Validate regex-captured matches before storing.
      })
    }
  });

  if(urls.length > 0){
    urls.forEach(url => {
      chrome.tabs.create({ url:url });
    });
  }
  else{
    let popup = document.getElementById("PastePopup");
    popup.classList.toggle("show");
  }
}
*/