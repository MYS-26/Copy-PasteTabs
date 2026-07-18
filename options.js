// ==== Copy Behavior ====
//Initialize copy behavior settings from storage and update the UI.
chrome.storage.sync.get(['copyFromAllWindows', 'ignorePinned', 'selectedTabs', 'decodeUnicode', 'copyAsMIMEtype']).then(
    data => {
        if(data.copyFromAllWindows)
            document.getElementById('allWindows').checked = true; 
        if(data.ignorePinned)
            document.getElementById('pinned').checked = true;  
        if(data.selectedTabs)
            document.getElementById('selected').checked = true; 
        if(data.decodeUnicode || data.decodeUnicode == null)
            document.getElementById('decodeUnicode').checked = true;
        if(data.copyAsMIMEtype)
            document.getElementById('copyAsMIMEtype').checked = true;
    }
);

//Attach event listeners to copy behavior checkboxes after the DOM is loaded.
document.addEventListener('DOMContentLoaded', function() {
    const allWindowsCheckbox = document.getElementById('allWindows');
    const pinnedCheckbox = document.getElementById('pinned');
    const selectedCheckbox = document.getElementById('selected');
    const decodeUnicodeCheckbox = document.getElementById('decodeUnicode');
    const copyAsMIMEtypeCheckbox = document.getElementById('copyAsMIMEtype');

    //store checkboxs state to storage upon change
    allWindowsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({copyFromAllWindows: allWindowsCheckbox.checked});
    });
    
    pinnedCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ignorePinned: pinnedCheckbox.checked});
    });

    selectedCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({selectedTabs: selectedCheckbox.checked})
    });

    decodeUnicodeCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({decodeUnicode: decodeUnicodeCheckbox.checked})
    });

    copyAsMIMEtypeCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({copyAsMIMEtype: copyAsMIMEtypeCheckbox.checked})
    });
});
//-------------------------------------------------------------------------

// ==== Paste Mode ====
const pasteModesRadios = document.querySelectorAll('input[name="PasteModeForm_Radios"]')

//Initialize paste mode from storage and update the UI. Defaults to "Smart".
chrome.storage.sync.get(['PasteMode']).then(
    data => { 
                //Get the stored paste mode, defaulting to "Smart" if no value is found (null or undefined).
                const pasteModeToSet = data.PasteMode || "Smart";

                if(pasteModeToSet === "Smart") 
                    pasteModesRadios[0].checked = true;
                else pasteModesRadios[1].checked = true;

            }
     );


//Store paste mode radio buttons state to storage upon change.
pasteModesRadios[0].addEventListener('change', function(){
    chrome.storage.sync.set({PasteMode: "Smart"});
});

pasteModesRadios[1].addEventListener('change', function(){
    chrome.storage.sync.set({PasteMode: "Simple"});
});

//-------------------------------------------------------------------------

// ==== Paste Button Tooltip ====

const pasteButtonTooltipRadio = document.querySelectorAll('input[name="paste-button-tooltip-radio"]');

chrome.storage.sync.get(['PasteButtonTooltip']).then(
    data => {

        const PasteButtonTooltip = data.PasteButtonTooltip || "off";

        if(PasteButtonTooltip === "off") pasteButtonTooltipRadio[0].checked = true;
        else if(PasteButtonTooltip === "count") pasteButtonTooltipRadio[1].checked = true;
        else if(PasteButtonTooltip === "list") pasteButtonTooltipRadio[2].checked = true;
    });


pasteButtonTooltipRadio[0].addEventListener('change', function(){
    chrome.storage.sync.set({PasteButtonTooltip: "off"});
});

pasteButtonTooltipRadio[1].addEventListener('change', function(){
    chrome.storage.sync.set({PasteButtonTooltip: "count"});
});

pasteButtonTooltipRadio[2].addEventListener('change', function(){
    chrome.storage.sync.set({PasteButtonTooltip: "list"});
});

//-------------------------------------------------------------------------

// ==== Copy Format ====
//Manages copy format settings
const formatRadio = document.querySelectorAll('input[name="Copy_Format_Radios"]');
const formatForm = document.querySelector('form[name="copyFormatForm"]');
const customWell = document.getElementById('customFormatWell');

//Initialize copy format from storage and update the UI. Defaults to "URLs".
chrome.storage.sync.get(['CopyFormat']).then(
    data => {
                //Get the stored copy format, defaulting to "URLs" if no value is found (null or undefined).
                const formatToSet = data.CopyFormat || "URLs"; 

                if(formatToSet === "URLs") 
                    formatRadio[0].checked = true;
                else if(formatToSet === "URLs_Titles") formatRadio[1].checked = true;
                else if(formatToSet === "HTML_URL") formatRadio[2].checked = true;
                else if(formatToSet === "HTML_Title") formatRadio[3].checked = true;
                else if(formatToSet === "JSON") formatRadio[4].checked = true;
                else if(formatToSet === "Custom") {
                    formatRadio[5].checked = true;
                    customWell.style.display = 'block'
                }
            }
     );

//Initialize custom template from storage.
chrome.storage.sync.get(['CustomTemplate']).then(
    data => { 
                if(data.CustomTemplate){
                    document.getElementById('textArea').value = data.CustomTemplate; 
                }         
    });

//store copy format radio buttons state to storage upon change.
//And show/hide customwell according to selected format.
formatForm.addEventListener('change', event => {
    if (event.target.name === 'Copy_Format_Radios') {
        chrome.storage.sync.set({CopyFormat: event.target.value});

    customWell.style.display = event.target.value === "Custom" ? 'block' : 'none';
        /*
        if (event.target.value === "Custom")
            customWell.style.display = 'block';
        else customWell.style.display = 'none';*/


    }
});

//Debounce function to limit the frequency of custom template saving.
function debounce(func, waitTime){
    let timer = null;
    return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            func(...args)
        }, waitTime)

    };
}

const saveCustomTemplate = debounce((textInput) => {
    chrome.storage.sync.set({CustomTemplate: textInput});
}, 500)

customWell.addEventListener('input', function(event) {
    saveCustomTemplate(event.target.value);
});
