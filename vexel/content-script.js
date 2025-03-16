(function() {
    // Create a script element
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('/vexel/fetch-inject.js'); // Load the script from the extension
    script.onload = function() {
        this.remove(); // Remove after execution to keep DOM clean
    };

    // Append script to the webpage so it runs in the page context
    (document.head || document.documentElement).appendChild(script);

    try {
        window.addEventListener("message", (event) => {
            if (event.source !== window || !event.data || event.data.source !== "fetch-inject") return;
    
            try {
                // Forward message to background.js
                chrome.runtime.sendMessage({ action: "fetch-inject", data: event.data.data });
            } catch(error) {
                console.log('error:- ', error);
            }
        });
    } catch(error) {
        console.log('error occurred while adding event listener:- ', error);
    }

    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "message-to-inject") {
                try {
                    // Send the message to inject.js using window.postMessage
                    window.postMessage({ source: "content-script", data: message.data }, "*");
                } catch(error) {
                    console.log('error occurred while posting message to injected script:- ', error);
                }
            }
        });
    } catch(error) {
        console.log('error occurred while adding event listener and posting message:- ', error);
    }
})();