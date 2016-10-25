/**
 * settings.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Script for saving settings
 */

(function (window) {

    var HTTP_HEADER = 'PaymentBroswerHeader';
    var LOGIN_DETAILS = 'LogInDetails';

    function get(key) {
        return new Promise(function (resolve) {
            var object = {};
            object[HTTP_HEADER] = '';
            object[LOGIN_DETAILS] = {};

            chrome.storage.local.get(object, function (result) {
                var value = result[key];
                resolve(value);
            });
        });
    }

    function set(key, value) {
        return new Promise(function (resolve) {
            var object = {};
            object[key] = value;
            chrome.storage.local.set(object, resolve);
        });
    }

    var settings = function() {};
    settings.prototype = {

        getLoginDetails: function (){
            return get(LOGIN_DETAILS);
        },
        setLoginDetails: function (details) {
            return set(LOGIN_DETAILS, details);
        },

        getHttpHeader: get(HTTP_HEADER),
        setHttpHeader: function (httpHeader) {
            return set(HTTP_HEADER, httpHeader);
        }
    };

    window.settings = new settings();

})(window);
