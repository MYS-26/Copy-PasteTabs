//Extensions Behaviour
chrome.storage.sync.get(['allWindows']).then(
    data => {
                if(data.allWindows == true)
                document.getElementById('allWindows').checked = true;  
            }
     );

chrome.storage.sync.get(['ignorePinned']).then(
    data => {
                if(data.ignorePinned == true)
                document.getElementById('pinned').checked = true;  
            }
     );

chrome.storage.sync.get(['selectedTabs']).then(
    data => {
                if(data.selectedTabs == true)
                document.getElementById('selected').checked = true;  
            }
    );


document.addEventListener('DOMContentLoaded', function() {
    let allWindows = document.getElementById('allWindows');
    let Pinned = document.getElementById('pinned');
    let Selected = document.getElementById('selected');

    allWindows.addEventListener('change', function(){
        if(allWindows.checked == true)
            chrome.storage.sync.set({copyFromAllWindows: true})
        else chrome.storage.sync.set({copyFromAllWindows: false})
    });
    
    Pinned.addEventListener('change', function(){
        if(Pinned.checked == true)
            chrome.storage.sync.set({ignorePinned: true})
        else chrome.storage.sync.set({ignorePinned: false})
    });

    Selected.addEventListener('change', function(){
        if(Selected.checked == true)
            chrome.storage.sync.set({selectedTabs: true})
        else chrome.storage.sync.set({selectedTabs: false})
    });

});
//-------------------------------------------------------------------------

//Paste Mode

let ModesRadio = document.PasteModeForm.PasteModeForm_Radios;

chrome.storage.sync.get(['PasteMode']).then(
    data => {   
                if(data.PasteMode == null || data.PasteMode == "Smart") 
                    ModesRadio[0].checked = true;
                else ModesRadio[1].checked = true;

            }
     );


ModesRadio[0].addEventListener('change', function(){
    chrome.storage.sync.set({PasteMode: "Smart"})
    
    chrome.storage.sync.get(['PasteMode']).then(data => console.log(data.PasteMode ))
});

ModesRadio[1].addEventListener('change', function(){
    chrome.storage.sync.set({PasteMode: "Simple"})
    
    chrome.storage.sync.get(['PasteMode']).then(data => console.log(data.PasteMode ))
});


//Copy Format
let FormatRadio = document.copyFormatForm.Copy_Format_Radios;

chrome.storage.sync.get(['CopyFormat']).then(
    data => {   
                if(data.CopyFormat == null || data.CopyFormat == "URLs") 
                    FormatRadio[0].checked = true;
                else if(data.CopyFormat == "URLs_Titles") FormatRadio[1].checked = true;
                else if(data.CopyFormat == "HTML_URL") FormatRadio[2].checked = true;
                else if(data.CopyFormat == "HTML_Title") FormatRadio[3].checked = true;
                else if(data.CopyFormat == "JSON") FormatRadio[4].checked = true;
            }
     );


FormatRadio[0].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "URLs"})
});

FormatRadio[1].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "URLs_Titles"})
});

FormatRadio[2].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "HTML_URL"})
});

FormatRadio[3].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "HTML_Title"})
});

FormatRadio[4].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "JSON"})
});
//-------------------------------------------------------------------------