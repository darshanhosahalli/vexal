const clearNetworkLogs = document.getElementById('clear');
const filter = document.getElementById('filter');
const buttons = document.querySelectorAll(".toggle-button"); // Fetch all buttons dynamically

const networklogs = document.getElementById("network-logs");
const emptyState = document.getElementById("empty-state");

const proxy = document.getElementById("proxy");

const payloadAttributes = document.getElementById('attributes');

const closeRequestDetails = document.getElementById('close-request-details');

const requestUrlGeneral = document.getElementById('request-url');
const requestMethod = document.getElementById('request-method');
const requestStatusCode = document.getElementById('request-status-code');
const requestHeaders = document.getElementById('request-headers');
const responseHeaders = document.getElementById('response-headers');
const requestTab = document.getElementById('tab-headers');
const payloadTab = document.getElementById('tab-payload');
const responseTab = document.getElementById('tab-response');

const headerDetailsTab = document.getElementById('Headers');
const payloadDetailsTab = document.getElementById('Payload');
const responseDetailsTab = document.getElementById('Response');

// Add event listeners to each tab
requestTab.addEventListener('click', () => toggleSelected(requestTab, headerDetailsTab));
payloadTab.addEventListener('click', () => toggleSelected(payloadTab, payloadDetailsTab));
responseTab.addEventListener('click', () => toggleSelected(responseTab, responseDetailsTab));

let networkLog = [];
let networkLogObjectMap = {};
let activeType = "";

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
        while (networklogs.firstChild) {
            networklogs.removeChild(networklogs.firstChild);
        }
        closePayloadAttributes();
    } catch(error) {
        console.log('error occurred in clearNetworkTab:- ', error);
    }
}

// filter network log
filter.addEventListener('input', function(event) {
    try {
        const inputValue = event.target.value;
        filterInput(inputValue);
    } catch(error) {
        console.log('error occurred in filter:- ', error);
    }
});

// filter network logs
function filterInput(suffix) {
    try {
        for (let requestId in networkLogObjectMap) {
            if (networkLogObjectMap.hasOwnProperty(requestId)) {
                const request = networkLogObjectMap[requestId];
    
                if (!request || !request.row || !request.url) continue; // Ensure properties exist
    
                const shouldShow = suffix === "" || request.url.endsWith(suffix);
                request.row.classList.toggle("hide", !shouldShow);
            }
        }
    } catch(error) {
        console.log('error occurred in filterInput:- ', error);
    }
}

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
                    networkLogObjectMap[details.requestId]['row'] = addNewNetworkLog(networkLogObjectMap[details.requestId]);
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
                    updatedStatusCodeInNetworkLog(networkLogObjectMap[details.requestId]['row'], details.statusCode);
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
    try {
        const classes = emptyState.classList;
        if(!classes.contains("hide")) {
            classes.add("hide")
        }
    } catch(error) {
        console.log('error occurred in hideEmptyState:- ', error);
    }
}

// append net work log
function addNewNetworkLog(networkLog) {
    try {
        let newRow = document.createElement("div");
        newRow.classList.add("table-row");

        newRow.addEventListener("click", () => {
            appendNetworkDetails(networkLog);
        });
    
        // Create a new td
        let slNumber = document.createElement("div");
        slNumber.textContent = networkLog['slNumber'];
        slNumber.classList.add("small-width", "table-row-cell");
        newRow.appendChild(slNumber);
    
        let requestUrl = document.createElement("div");
        requestUrl.textContent = networkLog['url'];
        requestUrl.classList.add("network-rule", "table-row-cell");
        newRow.appendChild(requestUrl);
    
        let method = document.createElement("div");
        method.textContent = networkLog['method'];
        method.classList.add("medium-width", "table-row-cell");
        newRow.appendChild(method);
    
        let type = document.createElement("div");
        type.textContent = networkLog['type'];
        type.classList.add("large-width", "table-row-cell");
        newRow.appendChild(type);
    
        let statusCodeCell = document.createElement("div");
        statusCodeCell.textContent = "pending";
        statusCodeCell.classList.add("italic-text", "medium-width", "table-row-cell");
        newRow.appendChild(statusCodeCell);
    
        let copyButtonColumn = document.createElement("div");
        copyButtonColumn.classList.add("border", "small-width", "table-row-cell");
        let copyButton = document.createElement("div");
        copyButton.appendChild(getCopySvg());
        copyButton.classList.add("shadow-svg");
        const payload = {
            "method": networkLog['method'], 
            "url": networkLog['url'], 
            "type": networkLog['type'],
            "requestHeaders": networkLog['requestHeaders']
        };
        const curl =  generateCurlCommand(payload.method, payload.url, '', payload.type, payload.requestHeaders);
        copyButton.addEventListener("click", (event) => copyCurl(curl, event));
        copyButtonColumn.appendChild(copyButton);
        newRow.appendChild(copyButtonColumn);
        networklogs.appendChild(newRow);
        return newRow;
    } catch(error) {
        console.log('error occurred in addNewNetworkLog:- ', error);
    }
}

// generate Curl
function generateCurlCommand(method, url, body = null, bodyType = null, headers = []) {
    try {
        let curlCommand = `curl -X ${method.toUpperCase()} "${url}"`;

        // Add headers
        for (let header of headers) {
            curlCommand += ` -H "${header.name}: ${header.value}"`;
        }
    
        // Add request body if present
        if (body) {
            if (bodyType === "json") {
                curlCommand += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`;
            } else if (bodyType === "form") {
                let formData = Object.entries(body)
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join("&");
                curlCommand += ` -H "Content-Type: application/x-www-form-urlencoded" -d "${formData}"`;
            } else {
                curlCommand += ` -d '${body}'`; // Raw body
            }
        }
    
        return curlCommand;
    } catch(error) {
        console.log('error occurred in generateCurlCommand:- ', error);
    }
}

// copy curl
function copyCurl(value, event) {
    try {
        event.stopPropagation();
        proxy.value = value;
        proxy.select();
        document.execCommand('copy'); // required as the clipboard api is not accessible to extensions yet
    } catch(error) {
        console.log('error occurred in copyCurl:- ', error);
    }
}

// copy svg
function getCopySvg() {
    try {
        const svgString = `
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path d="M20.9983 10C20.9862 7.82497 20.8897 6.64706 20.1213 5.87868C19.2426 5 17.8284 5 15 5H12C9.17157 5 7.75736 5 6.87868 5.87868C6 6.75736 6 8.17157 6 11V16C6 18.8284 6 20.2426 6.87868 21.1213C7.75736 22 9.17157 22 12 22H15C17.8284 22 19.2426 22 20.1213 21.1213C21 20.2426 21 18.8284 21 16V15" stroke="#1C274B" stroke-width="1.5" stroke-linecap="round"></path>
                <path d="M3 10V16C3 17.6569 4.34315 19 6 19M18 5C18 3.34315 16.6569 2 15 2H11C7.22876 2 5.34315 2 4.17157 3.17157C3.51839 3.82475 3.22937 4.69989 3.10149 6" stroke="#1C274B" stroke-width="1.5" stroke-linecap="round"></path>
            </g>
            </svg>
        `;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        return doc.documentElement;
    } catch(error) {
        console.log('error occurred in getCopySvg:- ', error);
    }
}

buttons.forEach((button) => {
    button.addEventListener("click", function () {
        try {
            activeType = activeType === this.id ? "" : this.id;
            updateActiveButton();
            updateNetworkLog();
        } catch(error) {
            console.log('error occurred in update button:- ', error);
        }
    });
});

function updateActiveButton() {
    try {
        buttons.forEach((btn) => btn.classList.toggle("selected", btn.id === activeType));
    } catch(error) {
        console.log('error occurred in updateActiveButton:- ', error);
    }
}

// update network log
function updateNetworkLog() {
    try {
        for (const requestId in networkLogObjectMap) {
            if (networkLogObjectMap.hasOwnProperty(requestId)) {
                const request = networkLogObjectMap[requestId];
    
                // Show all rows if no filter is selected
                if (!activeType) {
                    request['row']?.classList.remove("hide");
                    continue;
                }
    
                // Hide or show based on request type
                const shouldShow = request.type === activeType;
                request['row']?.classList.toggle("hide", !shouldShow);
            }
        }
    } catch(error) {
        console.log('error occurred in updateNetworkLog:- ', error);
    }
}

// update status code
function updatedStatusCodeInNetworkLog(newRow, statusCode) {
    try {
        let cells = newRow.children; // Get all <divs> elements in the row
        if (cells.length >= 2) { // Ensure there are at least 2 columns
            cells[cells.length - 2].textContent = statusCode; // Update second last cell
        }
    } catch(error) {
        console.log('error occurred in updatedStatusCodeInNetworkLog:- ', error);
    }
}

// attributes
closeRequestDetails.addEventListener('click', function(event) {
    closePayloadAttributes();
});

function closePayloadAttributes() {
    try {
        payloadAttributes.classList.add('hide');
    } catch(error) {
        console.log('error occurred in closePayloadAttributes:- ', error);
    }
}

function appendNetworkDetails(networkLog) {
    try {
        payloadAttributes.classList.remove('hide');
    
        requestUrlGeneral.textContent = networkLog['url'];
        requestMethod.textContent = networkLog['method'];
        requestStatusCode.textContent = networkLog['statusCode'];

        // append request headers
        appendHeader(networkLog["requestHeaders"], requestHeaders);

        // append response headers
        appendHeader(networkLog["responseHeaders"], responseHeaders);

        /*if(networkLog["body"]) {
            appendPayload(networkLog["body"]);
        }*/

        /*if(responseByUrl[networkLog['url']]) {
            appendResponse(responseByUrl[networkLog['url']].response_body, networkLog['url']);
        }*/
    } catch(error) {
        console.log('error occurred in appendNetworkDetails:- ', error);
    }
}

function appendHeader(headers, node) {
    try {
        if(headers) {
            while (node && node.firstChild) {
                node.removeChild(node.firstChild);
            }
            for(let header of headers) {
                let parentDiv = document.createElement("div");
                parentDiv.classList.add("display-headers");
        
                let key = document.createElement("div");
                key.classList.add("left-header");
                key.textContent = header.name;
        
                let value = document.createElement("div");
                value.classList.add("left-header");
                value.textContent = header.value;
        
                parentDiv.appendChild(key);
                parentDiv.appendChild(value);
                node.appendChild(parentDiv);
            }
        }
    } catch(error) {
        console.log('error occurred in appendHeader:- ', error);
    }
}

// toggle selected buttons
function toggleSelected(selectedTab, tabDetails) {
    try {
         // Remove 'selected' class from all tabs
        requestTab.classList.remove('selected');
        payloadTab.classList.remove('selected');
        responseTab.classList.remove('selected');

        // add none
        headerDetailsTab.classList.add('hide');
        payloadDetailsTab.classList.add('hide');
        responseDetailsTab.classList.add('hide');
    
        // Add 'selected' class to the clicked tab
        selectedTab.classList.add('selected');

        tabDetails.classList.remove('hide');
    } catch(error) {
        console.log('error occurred in toggleSelected:- ', error);
    }
}