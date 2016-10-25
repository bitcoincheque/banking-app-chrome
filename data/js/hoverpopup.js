/**
 * hoverpopup.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Controls hoverpopup.html.
 */

$(document).ready(function () {

    // TODO: This is a hack, sends the information in the name field of the window. Find a better technique.
    var data = JSON.parse(window.name);

    var payment_link = data['PaymentLink'];
    var bank_name = data['BankName'];

    $('#headline').text(bank_name);

    $.getJSON(payment_link, function(response) {
        $('#progress').fadeOut('fast', function () {
            var cheque_request_encoded = response.payment_request;
            var i = cheque_request_encoded.lastIndexOf('_');
            var json_padded_base64 = cheque_request_encoded.substring(i + 1);
            var json_padded = window.atob(json_padded_base64);
            var json = json_padded.trim();

            var cheque_request = JSON.parse(json);
            var data_json = cheque_request['data'];
            var md5sum = CryptoJS.MD5(data_json);
            var md5sum_str = md5sum.toString();

            if (md5sum_str == cheque_request.md5) {
                var data = JSON.parse(data_json);

                var amount_int = Number(data.amount);
                var amount_float = amount_int / 100000000;
                var amount_str = String(amount_float);

                $('#price').fadeIn('fast').html('Price: <span class="pull-right">' + Number(amount_str) + ' ' + data.currency + '</span>');
                $('#status').fadeIn('fast').html('Receiver: <span class="pull-right">' + data.receiver_name + '</span>');
            } else {

                $('#price').fadeIn('fast').html('md5 error.');
            }
        });
    });

    $('#closeButton').click(function () {
        window.parent.close();
    });

});
