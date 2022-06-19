//Extensions Behaviour
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
    let Pinned = document.getElementById('pinned');
    let Selected = document.getElementById('selected');
    
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
                else FormatRadio[1].checked = true;
            }
     );


FormatRadio[0].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "URLs"})
});

FormatRadio[1].addEventListener('change', function(){
    chrome.storage.sync.set({CopyFormat: "URLs_Titles"})
});
//-------------------------------------------------------------------------