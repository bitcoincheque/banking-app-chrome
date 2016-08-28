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

    payment_link = window.name;

    $.getJSON(payment_link, function(response) {
        $('#progress').fadeOut('fast', function () {
            cheque_request_encoded = response.payment_request;
            i = cheque_request_encoded.lastIndexOf('_');
            json_padded_base64 = cheque_request_encoded.substring(i + 1);
            json_padded = window.atob(json_padded_base64);
            json = json_padded.trim();

            cheque_request = JSON.parse(json);
            data_json = cheque_request['data'];
            md5sum = CryptoJS.MD5(data_json);
            md5sum_str = md5sum.toString();

            if (md5sum_str == cheque_request.md5) {
                data = JSON.parse(data_json);

                amount_int = Number(data.amount);
                amount_float = amount_int / 100000000;
                amount_str = String(amount_float);

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
