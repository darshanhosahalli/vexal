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

    const OriginalXHR = window.XMLHttpRequest;

    class MockXHR extends OriginalXHR {
        constructor() {
            super();
            this._url = null;
            this._method = null;
            this._payload = null;
        }

        open(method, url, async = true, user = null, password = null) {
            this._url = url; // Store the request URL
            this._method = method; // Store the request method
            super.open(method, url, async, user, password);
        }

        send(body = null) {
            try {
                this._payload = body;
                try {
                    console.log('responsesToMock present?:- ', responsesToMock);
                    if(responsesToMock[this._method] && responsesToMock[this._method][this._url]) {
                        setTimeout(() => {
                            // Define properties instead of directly assigning values
                            Object.defineProperty(this, "readyState", { value: 4, configurable: true }); // Set readyState to DONE
                            Object.defineProperty(this, "status", { value: 200, configurable: true }); // Mock successful status
                            Object.defineProperty(this, "responseText", {
                                value: responsesToMock[this._method][this._url],
                                configurable: true
                            });

                            Object.defineProperty(this, "response", {
                                value: JSON.parse(this.responseText),
                                configurable: true
                            });
            
                            // Trigger the event handler if defined
                            if (typeof this.onreadystatechange === "function") {
                                this.onreadystatechange();
                            }
                            if (typeof this.onload === "function") {
                                this.onload();
                            }
            
                        }, 100); // Simulating async delay
            
                        return; // Prevent actual request from being sent
                    }
                } catch(error) {
                    console.log('error while mocking response:- ', error);
                }
                let parsedBody = {};
                if (body) {
                    // Attempt to parse the body as JSON; if parsing fails, log the raw body
                    try {
                        parsedBody = JSON.parse(body);
                    } catch (error) {
                        console.log('Request Body (raw):', body);
                    }
                } else {
                    console.log('No request body.');
                }
                sendMessageToContentScript({
                    type: 'payload',
                    url: this._url,
                    method: this._method,
                    parsedBody: parsedBody
                });
                super.send(body);
                const eventCallback = this.onreadystatechange;
                this.onreadystatechange = function () {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 300) {
                            try {
                                sendMessageToContentScript({
                                    type: 'response',
                                    url: this._url,
                                    method: this._method,
                                    response: this.responseText
                                });
                                if(typeof eventCallback === 'function') {
                                    eventCallback();
                                }
                            } catch(error) {
                                console.log('error occurred in overridden onreadystatechange :- ', error);
                                if(typeof eventCallback === 'function') {
                                    eventCallback();
                                }
                            }
                        }
                    }
                    if(typeof eventCallback === 'function') {
                        eventCallback();
                    }
                }
            } catch(error) {
                console.log('error occurred in overridden send :- ', error);
            }
        }
    }

    window.XMLHttpRequest = MockXHR;

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
                console.log('responsesToMock:- ', responsesToMock);
            } catch(error) {
                console.log('error occurred while registering mock', error);
            }
        });
    } catch(error) {
        console.log('error occurred while listening to event', error);
    }
})();