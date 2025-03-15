const clearNetworkLogs = document.getElementById('clear');
const filter = document.getElementById('filter');
const xmlhttprequest = document.getElementById('xmlhttprequest');
const sse = document.getElementById('sse');
const ws = document.getElementById('ws');

const emptyState = document.getElementById("empty-state");

let networkLog = [];
let networkLogObjectMap = {};

// clear network log
clearNetworkLogs.addEventListener('click', function() {
    clearNetworkTab();
});

// when chrome tabs gets switched
chrome.tabs.onActivated.addListener(function(activeInfo) {
    // when ever tab activates clear the network log to make things easier unless preserve log is enabled
    clearNetworkTab();
});

// when chrome tabs gets switched
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Check if the URL has changed (often indicates a tab navigation)
    if (changeInfo.status === "complete" && changeInfo.url) { //check for complete to avoid multiple calls.
      // clear data here
      clearNetworkTab();
    }
});

function clearNetworkTab() {
    try {
        const classes = emptyState.classList;
        if(classes.contains("hide")) {
            classes.remove("hide")
        }
        networkLogObjectMap = {};
        networkLog = [];
        console.log('networkLogObjectMap:- ', networkLogObjectMap);
    } catch(error) {
        console.log('error occurred in clearNetworkTab:- ', error);
    }
}

// filter network log
filter.addEventListener('input', function(event) {
    try {
        const inputValue = event.target.value;
        const tempDiv3 = document.getElementById('temp');
        tempDiv3.textContent = inputValue;
    } catch(error) {
        console.log('error occurred in filter:- ', error);
    }
});

// xml http request
xmlhttprequest.addEventListener('click', function(event) {
    try {
        const tempDiv3 = document.getElementById('temp');
        tempDiv3.textContent = 'xml http request clicked';
    } catch(error) {
        console.log('error occurred in xmlhttprequest filter:- ', error);
    }
});

// sse request
sse.addEventListener('click', function(event) {
    try {
        const tempDiv3 = document.getElementById('temp');
        tempDiv3.textContent = 'sse request clicked';;
    } catch(error) {
        console.log('error occurred in sse filter:- ', error);
    }
});

// ws request
ws.addEventListener('click', function(event) {
    try {
        const tempDiv3 = document.getElementById('temp');
        tempDiv3.textContent = 'ws request clicked';;
    } catch(error) {
        console.log('error occurred in ws filter:- ', error);
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLog.push(details.requestId);
                    if(networkLog.length == 1) {
                        hideEmptyState();
                    }
                    networkLogObjectMap[details.requestId] = { slNumber: networkLog.length, method: details.method, url: details.url, type: details.type };
                }
            } catch(error) {
                console.log('error occurred in onBeforeRequest:- ', error);
            }
        });
        return {};
    },
    {urls: ["<all_urls>"]},
    ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLogObjectMap[details.requestId]['requestHeaders'] = details.requestHeaders;
                }
            } catch(error) {
                console.log('error occurred in onBeforeSendHeaders:- ', error);
            }
        });
      return { requestHeaders: details.requestHeaders };
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"] 
    },
    ["requestHeaders"]
);

chrome.webRequest.onSendHeaders.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLogObjectMap[details.requestId]['requestHeaders'] = details.requestHeaders;
                }
            } catch(error) {
                console.log('error occurred in onSendHeaders:- ', error);
            }
        });
      return {  };
    },
    { urls: ["<all_urls>"] }, // Or more specific URL patterns
    ["requestHeaders"]
);

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLogObjectMap[details.requestId]['responseHeaders'] = details.responseHeaders;
                }
            } catch(error) {
                console.log('error occurred in onHeadersReceived:- ', error);
            }
        });
      return { };
    },
    { urls: ["<all_urls>"] }, // Or more specific URL patterns
    ["responseHeaders"]
);


chrome.webRequest.onCompleted.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLogObjectMap[details.requestId]['statusCode'] = details.statusCode;
                }
            } catch(error) {
                console.log('error occurred in onCompleted:- ', error);
            }
        });
      return {  };
    },
    { urls: ["<all_urls>"] }, // Or more specific URL patterns
    []
);

chrome.webRequest.onErrorOccurred.addListener(
    function(details) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            try {
                if (tabs && tabs.length > 0 && details.tabId === tabs[0].id) {
                    networkLogObjectMap[details.requestId]['error'] = details.error;
                }
            } catch(error) {
                console.log('error occurred in onErrorOccurred:- ', error);
            }
        });
      return {  };
    },
    { urls: ["<all_urls>"] }, // Or more specific URL patterns
    []
);

// hide empty state
function hideEmptyState() {
    const classes = emptyState.classList;
    if(!classes.contains("hide")) {
        classes.add("hide")
    }
}