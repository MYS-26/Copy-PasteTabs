async function CopyURLtoClipboard(){
  const Options = await chrome.storage.sync.get(['copyFromAllWindows', 'ignorePinned', 'selectedTabs', 'CopyFormat']);
  let queryOptions = {};

  if(Options.copyFromAllWindows == false || Options.copyFromAllWindows == null) queryOptions["lastFocusedWindow"] = true;
  if(Options.ignorePinned == true) queryOptions["pinned"] = false;
  if(Options.selectedTabs == true) {queryOptions["highlighted"] = true; queryOptions["lastFocusedWindow"] = true;}
        
  let popup = document.getElementById("CopyPopup");
        
  const tabsQueryResult = await chrome.tabs.query(queryOptions);
  if (!Array.isArray(tabsQueryResult) || !tabsQueryResult.length) {
      popup.innerHTML = "0 URLs Copied"
      popup.classList.toggle("show");
      return;
  }
  
  let tempURL = ""; //Need changing into Switch Statement instead of else if
  if(Options.CopyFormat == 'URLs' || Options.CopyFormat == null)
    for (let i = 0; i < tabsQueryResult.length; i++)
      tempURL = tempURL + tabsQueryResult[i].url + "\n";
  else if(Options.CopyFormat == 'URLs_Titles')
    for (let i = 0; i < tabsQueryResult.length; i++)
        tempURL = tempURL + tabsQueryResult[i].title + "\n" + tabsQueryResult[i].url + "\n\n";
  else if(Options.CopyFormat == 'HTML_URL')
    for (let i = 0; i < tabsQueryResult.length; i++)
      tempURL = tempURL + `<a href="${[tabsQueryResult[i].url]}">${[tabsQueryResult[i].url]}</a>` + "\n";
  else if(Options.CopyFormat == 'HTML_Title')
    for (let i = 0; i < tabsQueryResult.length; i++)
      tempURL = tempURL + `<a href="${[tabsQueryResult[i].url]}">${[tabsQueryResult[i].title]}</a>` + "\n";
  else if(Options.CopyFormat == 'JSON'){
        tempURL = "["
        for (let i = 0; i < tabsQueryResult.length-1; i++)
          tempURL = tempURL + `{"url":"${[tabsQueryResult[i].url]}","title":"${[tabsQueryResult[i].title]}"}` + ",\n";
          tempURL = tempURL + `{"url":"${[tabsQueryResult[tabsQueryResult.length-1].url]}","title":"${[tabsQueryResult[tabsQueryResult.length-1].title]}"}]` + "\n";
        }
  else if(Options.CopyFormat == 'Custom'){
    const formatTemplate = await chrome.storage.sync.get(['CustomTemplate']);
    if(formatTemplate.CustomTemplate)
    for (let i = 0; i < tabsQueryResult.length; i++)
      tempURL = tempURL + formatTemplate.CustomTemplate.replaceAll("$title", tabsQueryResult[i].title).replaceAll("$url", tabsQueryResult[i].url).replaceAll("<br/>", "\n");
    else tempURL = "Error: Custom format template is empty. Please check the options page to configure it.";
  }
        
            
  if(tabsQueryResult.length == 1)
    popup.innerHTML = "1 URL Copied"
  else
    popup.innerHTML = tabsQueryResult.length + " URLs Copied"
    popup.classList.toggle("show");
        
  navigator.clipboard.writeText(tempURL); 
        
}

function GetClipboardContent(){
    let tempTextArea = document.createElement("textarea");
    tempTextArea.style = "position: absolute; left: -1000px; top: -1000px";
    document.body.appendChild(tempTextArea);
    tempTextArea.contentEditable = true;

    tempTextArea.focus(); 
    document.execCommand("Paste");

    let clipboardContents = tempTextArea.value;
    document.body.removeChild(tempTextArea);
    return clipboardContents;
  }

  function OpenUrlsInClipboard(){
    //let UrlsArray = GetClipboardContent().split(/\s+/)
    let UrlsArray = GetClipboardContent().split(/[\r\n]+/)
    //UrlsArray = UrlsArray.filter(value=> value!='')
    for(let i = 0; i < UrlsArray.length; i++)
      chrome.tabs.create({ url:UrlsArray[i] });
  }

  function SmartOpenUrlsInClipboard(){
    //Function to get URLs using Regex
    var ytre = /(\b(https?|ftp|file|chrome|ssh|mailto):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig; //Regex To match URLs
    var UrlsArray = GetClipboardContent().match(ytre);
    if(UrlsArray == null) {
      var popup = document.getElementById("PastePopup");
      popup.classList.toggle("show");
      return;
    }
    for(var i = 0; i < UrlsArray.length; i++)
    chrome.tabs.create({ url:UrlsArray[i] });
  } 

  

  
document.addEventListener('DOMContentLoaded', function() {
    let Copy = document.getElementById('CopyURL');
    let Paste = document.getElementById('PasteURL');
    
    Copy.addEventListener('click', function(){
        CopyURLtoClipboard();
        setTimeout(function(){window.close();}, 3000);

    });

    Paste.addEventListener('click', function() {
        //OpenUrlsInClipboard()
        chrome.storage.sync.get(['PasteMode']).then(
          data => {
            if(data.PasteMode == "Simple") OpenUrlsInClipboard();
            else SmartOpenUrlsInClipboard()
        })
    });
});


/* This function does not work for some reason. If found, a solution will replace the current GetClipboardContent()
function readClipboard(){
    navigator.clipboard.readText().then(clipText =>
        document.getElementById("output").innerText = clipText);     
} */

