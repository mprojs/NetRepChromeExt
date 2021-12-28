# NetRepChromeExt
Chrome Dev Tools extension that allows you to receive data from network requests in the following format:

{
    "url": "/api/v1/users/search", // url (relative if sended to current domain, otherwise absolute)
    "method": "POST", // request method
    "date": "Tue, 28 Dec 2021 12:41:28 GMT", // date from 'date' response header
    "queryParams": {}, // request query parameters
    "payload": {
        "limit": 10,
        "offset": 0
    }, // request body
    "responseBody": {
        ...response here
    } // response body
}

The extension is mostly based on this project https://github.com/sergiu79/XHRJSONPanel
I just have changed a little the content of requests and added "Copy report" button.
