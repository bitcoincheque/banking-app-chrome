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
                var payment_link = requests[0].substring(9);
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
            var payment_request_file = json_payment_info.payment_request;
            var i = payment_request_file.lastIndexOf('_');
            var json_padded_base64 = payment_request_file.substring(i+1);
            var json_padded = window.atob(json_padded_base64);
            var json = json_padded.trim();
            var cheque_request = JSON.parse(json);
            var data_json = cheque_request['data'];
            var md5sum = CryptoJS.MD5(data_json);
            var md5sum_str = md5sum.toString();

            if(md5sum_str == cheque_request.md5) {
                var payment_request = JSON.parse(data_json);

                // Read bank login and default account from settings
                settings.getLoginDetails().then(function(login_details) {
                    var bankingapp_url = login_details['BankingAppUrl'];
                    var username = login_details['Username'];
                    var password = login_details['Password'];
                    var account = login_details['Account'];

                    var data = {};
                    data['action'] = 'request_cheque';
                    data['username'] = username;
                    data['password'] = password;
                    data['account'] = account;
                    data['payment_request'] = payment_request_file;

                    $.post(bankingapp_url, data, function(response){
                        if(response.result == 'OK')
                        {
                            var url = payment_request.paylink;

                            data = {};
                            data['action'] = 'send_payment_cheque';
                            data['cheque'] = response.cheque;

                            // Send the cheque to the receiver
                            $.post(url, data, function(response){
                                if(response.result != 'OK')
                                {
                                    alert('Payment error. Error message: ' + response.message);
                                }
                            }, 'json');
                        }
                        else
                        {
                            alert('Error requesting cheque from bank. Error message: ' + response.message);                            
                        }
                    },'json')
                });
            };
        });
    }

});
