/**
 * load_popup.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Load an popup when hovering over an payment link
 */

$(document).ready(function () {
    var popupIframe = {};
    $('a.bitcoin-address').hover(function () {
        var address = $(this).text();
        var href = $(this).attr('href');

        if (/^bitcoin:/.test(href)) {
            var requests = href.match(/\?request=[\w\:.&=\-?\/]+/);
            if (requests) {
                var payment_link = requests[0].substring(9);

                var rect = this.getBoundingClientRect();

                popupIframe = document.createElement('iframe');
                popupIframe.src = chrome.extension.getURL('data/hoverpopup.html');
                popupIframe.setAttribute('style', 'background-color: transparent; position: absolute; z-index: 2147483647; border: 0px;');
                popupIframe.setAttribute('allowtransparency', 'true');
                popupIframe.frameBorder = '0';

                var height = 110;
                popupIframe.style.height = '110px';
                popupIframe.style.width = '240px';
                popupIframe.style.left = Number(rect.left) + Number(window.pageXOffset) + Number(rect.right - rect.left)/2 - 105 + 'px';
                popupIframe.style.top = Number(rect.top) + Number(window.pageYOffset) - height + 'px';

                // This is a hack. Need to give the payment link to the popup iframe. Using the name field.
                // TODO: Should fine a better way to communicate with iframe
                popupIframe.name = payment_link;

                document.body.appendChild(popupIframe);
            }
        }
    }, function () {
        setTimeout(function () {
            if (popupIframe) {
                $(popupIframe).remove();
                popupIframe = null;
            }
        }, 100);
    });

});
