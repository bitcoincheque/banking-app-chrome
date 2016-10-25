/**
 * background.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 *  Background script to insert HTTP header
 */

(function () {
    var paymentHeaders = [];
    var headerEnabled = false;

    function initialize() {
        headerEnabled = true;
        paymentHeaders.Name = "Payment-App";
        paymentHeaders.Value = "v:1,pp:1-4,pq:1;2,pc:BTC";
    }

    chrome.tabs.onActivated.addListener(function() {
        initialize();
    });

    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
        var headers = details.requestHeaders;
        var blockingResponse = {};

        var targetHeaders = headers;
        if(headerEnabled){
            targetHeaders.push({name: paymentHeaders.Name, value: paymentHeaders.Value});
        }

        blockingResponse.requestHeaders = targetHeaders;
        return blockingResponse;
    },{urls: ["<all_urls>"]}, ['requestHeaders', 'blocking']);

})();
