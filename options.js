//Extensions Behaviour
chrome.storage.sync.get(['copyFromAllWindows']).then(
    data => {
                if(data.copyFromAllWindows == true)
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
const FormatRadio = document.copyFormatForm.Copy_Format_Radios;
const FormatForm = document.forms['copyFormatForm'];
const customWell = document.getElementById('customFormatWell');

chrome.storage.sync.get(['CopyFormat']).then(
    data => {   
                if(data.CopyFormat == null || data.CopyFormat == "URLs") 
                    FormatRadio[0].checked = true;
                else if(data.CopyFormat == "URLs_Titles") FormatRadio[1].checked = true;
                else if(data.CopyFormat == "HTML_URL") FormatRadio[2].checked = true;
                else if(data.CopyFormat == "HTML_Title") FormatRadio[3].checked = true;
                else if(data.CopyFormat == "JSON") FormatRadio[4].checked = true;
                else if(data.CopyFormat == "Custom") {
                    FormatRadio[5].checked = true;
                    customWell.style.display = 'block'
                }
            }
     );

chrome.storage.sync.get(['CustomTemplate']).then(
    data => { 
                if(data.CustomTemplate != null){
                    const customWellTextArea = document.getElementById('textArea');
                    customWellTextArea.value = data.CustomTemplate; 
                }         
    });

FormatForm.addEventListener('change', function(event) {
    if (event.target.name === 'Copy_Format_Radios') {
        chrome.storage.sync.set({CopyFormat: event.target.value})

        if (event.target.value === "Custom")
            customWell.style.display = 'block';
        else customWell.style.display = 'none';


    }
});

customWell.addEventListener('change', function(event) {
    chrome.storage.sync.set({CustomTemplate: event.target.value})
});

//-------------------------------------------------------------------------