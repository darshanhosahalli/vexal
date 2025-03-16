(function() {
    let responsesToMock = {};
    const originalFetch = window.fetch;

    window.fetch = async function(url, options = {}) {
        try {
            const method = options.method ? options.method.toUpperCase() : 'GET';
            let parsedBody = {};
            if (options.body) {
                // Attempt to parse the body as JSON; if parsing fails, log the raw body
                try {
                    parsedBody = JSON.parse(options.body);
                } catch (error) {
                    console.log('Request Body (raw):', options.body);
                }
            } else {
                console.log('No request body.');
            }

            try {
                if(responsesToMock[method] && responsesToMock[method][url]) {
                    return new Response(responsesToMock[method][url], {
                        status: 200, // Adjust the status as needed
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch(error) {
                console.log('error while mocking response:- ', error);
            }
            
            sendMessageToContentScript({
                type: 'payload',
                url,
                method,
                parsedBody
            });
            const response = await originalFetch(url, options);
            const clonedResponse = response.clone(); // Clone response to read it

            clonedResponse.text().then((body) => {
                sendMessageToContentScript({
                    type: 'response',
                    url,
                    method,
                    response: body
                });
            });
            return response;
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    };

    function sendMessageToContentScript(data) {
        try {
            window.postMessage({ source: "fetch-inject", data }, "*");
        } catch(error) {
            console.log('data:- '+ data+ 'error:- '+error);
        }
    }

    try {
        window.addEventListener("message", (event) => {
            try {
                if (event.source !== window || !event.data || event.data.source !== "content-script") return;
                if(event.data && event.data.source === 'content-script') {
                    if(event.data.data) {
                        if(!responsesToMock[event.data.data.method]) {
                            responsesToMock[event.data.data.method] = {};
                        }
                        responsesToMock[event.data.data.method][event.data.data.url] = event.data.data.response;
                    }
                }
                //responsesToMock[event.data.data.url] = event.data.data.response;
            } catch(error) {
                console.log('error occurred while registering mock', error);
            }
        });
    } catch(error) {
        console.log('error occurred while listening to event', error);
    }
})();