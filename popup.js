function CopyURLtoClipboard(OptionsArray){
  let queryOptions = {};

  let copyFromAllWindows = OptionsArray[0].copyFromAllWindows; console.log(copyFromAllWindows);
  let ignorePinned = OptionsArray[1].ignorePinned;
  let Selected = OptionsArray[2].selectedTabs;
  let CopyFormat = OptionsArray[3].CopyFormat;
  if(copyFromAllWindows == false || copyFromAllWindows == null) queryOptions["lastFocusedWindow"] = true;
  if(ignorePinned == true) queryOptions["pinned"] = false;
  if(Selected == true) {queryOptions["highlighted"] = true; queryOptions["lastFocusedWindow"] = true;}

  let popup = document.getElementById("CopyPopup");

  chrome.tabs.query(queryOptions).then(data =>{ 
    if (!Array.isArray(data) || !data.length) {
      popup.innerHTML = "0 URLs Copied"
      popup.classList.toggle("show");
      return;
    }
    let tempURL = "";
    if(CopyFormat == 'URLs' || CopyFormat == null)
      for (let i = 0; i < data.length; i++)
        tempURL = tempURL + data[i].url + "\n";
    else if(CopyFormat == 'URLs_Titles')
      for (let i = 0; i < data.length; i++)
        tempURL = tempURL + data[i].title + "\n" + data[i].url + "\n\n";
    else if(CopyFormat == 'HTML_URL')
      for (let i = 0; i < data.length; i++)
        tempURL = tempURL + `<a href="${[data[i].url]}">${[data[i].url]}</a>` + "\n";
    else if(CopyFormat == 'HTML_Title')
      for (let i = 0; i < data.length; i++)
        tempURL = tempURL + `<a href="${[data[i].url]}">${[data[i].title]}</a>` + "\n";
    else if(CopyFormat == 'JSON'){
      tempURL = "["
      for (let i = 0; i < data.length-1; i++)
        tempURL = tempURL + `{"url":"${[data[i].url]}","title":"${[data[i].title]}"}` + ",\n";
      tempURL = tempURL + `{"url":"${[data[data.length-1].url]}","title":"${[data[data.length-1].title]}"}]` + "\n";
    }

    
    if(data.length == 1)
      popup.innerHTML = "1 URL Copied"
    else
      popup.innerHTML = data.length + " URLs Copied"
    popup.classList.toggle("show");

    navigator.clipboard.writeText(tempURL);
    
  }) 

}

async function GetCopyOptions(){
  return await Promise.all([chrome.storage.sync.get(['copyFromAllWindows']), 
                            chrome.storage.sync.get(['ignorePinned']), 
                            chrome.storage.sync.get(['selectedTabs']), 
                            chrome.storage.sync.get(['CopyFormat'])]);
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
        GetCopyOptions().then(data => CopyURLtoClipboard(data))
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

