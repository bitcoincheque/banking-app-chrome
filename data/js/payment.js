/**
 * payment.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Reads an html doc, finds bitcoin payment links and make cheque payments.
 */

$(document).ready(function () {

    // Intercept all clicks, check if it is a payment link
    $('body').on('click', 'a', function (e) {
        var href = $(this).attr('href');
        if (/^bitcoin:/.test(href)) {
            var requests = href.match(/\?request=[\w\:.&=\-?\/]+/);
            if (requests) {
                payment_link = requests[0].substring(9);
                makePayment(payment_link);
                return false;
            }
        }
        
        // Return true if not a bitcoin link so click will work normally
        return true;
    });

    function makePayment(payment_link) {
        // Read payment information from visiting site
        $.getJSON(payment_link, function(json_payment_info) {
            // Decode it
            payment_request_file = json_payment_info.payment_request;
            i = payment_request_file.lastIndexOf('_');
            json_padded_base64 = payment_request_file.substring(i+1);
            json_padded = window.atob(json_padded_base64);
            json = json_padded.trim();
            cheque_request = JSON.parse(json);
            data_json = cheque_request['data'];
            md5sum = CryptoJS.MD5(data_json);
            md5sum_str = md5sum.toString();

            if(md5sum_str == cheque_request.md5) {
                data = JSON.parse(data_json);

                // Read bank login and default account from settings
                settings.getLoginDetails().then(function(login_details) {
                    var bank_url = login_details['BankUrl'];
                    var username = login_details['Username'];
                    var password = login_details['Password'];
                    var account = login_details['Account'];

                    // Request a cheque from the bank
                    json_url = bank_url;
                    json_url += '/wp-admin/admin-ajax.php?action=bcf_bitcoinbank_process_ajax_request_cheque';
                    json_url += '&username=' + username;
                    json_url += '&password=' + password;
                    json_url += '&account=' + account;
                    json_url += '&payment_request=' + json_payment_info.payment_request;

                    $.getJSON(json_url, function(json_bitcoin_cheque){
                        json_url = data.paylink;
                        json_url = json_url.concat('&cheque=');
                        json_url = json_url.concat(json_bitcoin_cheque.cheque);

                        // Send the cheque to the receiver
                        $.getJSON(json_url, function(response){
                        });
                    })
                });
            };
        });
    }

});
