/**
 * index.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Controls index.html, the main chrome window
 */

$(document).ready(function () {
    var SATHOSI = 100000000;

    function loadData() {
        console.log('Load data from settings.');

        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();

        settings.getLoginDetails().then(function(login_details) {
            var bank_url = login_details['BankUrl'];
            var username = login_details['Username'];
            var password = login_details['Password'];
            var rememberPasswd = login_details['RememberPasswd'];
            var stayConnected = login_details['StayConnected'];

            console.log('BankUrl=' + bank_url);
            console.log('Username=' + username);
            console.log('RememberPasswd=' + rememberPasswd);
            console.log('StayConnected=' + stayConnected);

            $('#username').val(username);
            $('#password').val(password);


            option_text = '<option value="' + bank_url + '" selected>' + bank_url + '</option>';
            $('#bankAddress').append(option_text);

            if(rememberPasswd == 1) {
                $('#rememberPassword').prop('checked', true);
            }

            if(stayConnected == 1){
                $('#stayConnected').prop('checked', true);

                $('#bankSearch').hide();
                $('#disconnected').hide();
                $('#connected').show();
                loadDataFromBank();
            } else {
                $('#bankSearch').hide();
                $('#disconnected').show();
                $('#connected').hide();
            }

        });
    }

    $('#mainbody').ready( function(){
        loadData();    
    });

    function updateTransactionList(bank_url, username, password, account){
        console.log('Load transaction data from bank.');

        $('#latestTransaction').append("<option value='status'>Loading...</option>");

        url = bank_url + '/wp-admin/admin-ajax.php/';

        var data = {};
        data['action'] = 'get_transactions';
        data['username'] = username;
        data['password'] = password;
        data['account'] = account;

        $.post(url, data, function(response) {
            if (response.result == "OK") {
                $('#latestTransaction option[value="status"]').remove();

                for (index = 0, len = response.transactions.length; index < len; ++index) {

                    datetime = response.transactions[index].datetime.substring(5);
                    trans_type = response.transactions[index].type.toLowerCase();
                    trans_type = trans_type.charAt(0).toUpperCase() + trans_type.slice(1);
                    amount = response.transactions[index].amount;
                    amount_int = Number(amount);
                    amount_float = (1.0 * amount_int) / SATHOSI;
                    amount_str = String(amount_float);

                    option_text = '<option value="'+ String(response.transactions[index].id) +'">' + datetime + ' ' + trans_type + ' ' + amount_str + '</option>';
                    $('#latestTransaction').append(option_text);
                }
            }
            else
            {
                $('#latestTransaction option[value="status"]').text('Error loading transaction');
            }
        }, 'json');
    }

    function loadDataFromBank() {
        console.log('Load data from bank.');

        $('#status_connection').text("Loading...");
        $('#status_connection').attr("class", "alert-warning");

        $('#selectedBankLink').html('');
        $('#bankWebAddr').html('');
        $('#defaultAccount').html('');
        $('#defaultAccount').val(0);
        $('#latestTransaction').html('');

        settings.getLoginDetails().then(function(result) {
            var bank_url = result['BankUrl'];
            var bankingapp_url = result['BankingAppUrl'];
            var username = result['Username'];
            var password = result['Password'];

            $('#selectedBankLink').html('<a href="'+bank_url+'" target="_blank"><u>'+bank_url+'</u></a>');
            $('#bankWebAddr').html('<a href="'+bank_url+'" target="_blank"><u>'+bank_url+'</u></a>');

            var data = {};
            data['action'] = 'get_account_list';
            data['username'] = username;
            data['password'] = password;

            $.post(bankingapp_url, data, function(response) {
                if(response.result == "OK")
                {
                    for (index = 0, len = response.list.length; index < len; ++index) {
                        balance_int = Number(response.list[index].balance);
                        balance_float = balance_int / SATHOSI;
                        balance_str = String(balance_float);

                        option_text = '<option value="'+ String(response.list[index].account_id) +'">' + response.list[index].name + ' / ' + balance_str +' ' + response.list[index].currency + '</option>';
                        $('#defaultAccount').append(option_text);
                    }

                    // If only one account, set is as the default
                    if(response.list.length == 1){
                        account = response.list[0].account_id;

                        settings.getLoginDetails().then(function(login_details) {
                            login_details['Account'] = account;
                            settings.setLoginDetails(login_details).then(function() {
                                $('#defaultAccount').val(account);
                            });
                        })
                    }

                    updateTransactionList(bankingapp_url, username, password, account);

                    $('#status_connection').text("Connected");
                    $('#status_connection').attr("class", "alert-success");
                }else{
                    $('#latestTransaction option[value="status"]').text('Error loading transaction');
                }
            }, 'json');

        });
    }

    $('#defaultAccount').click(function () {
        var def_account = $('#defaultAccount').val();
    });

    $('#savePaymentBroswerHeader').click(function () {
        var headerValue = $('#paymentBroswerHeader').val();
        chrome.storage.sync.set({'PaymentBroswerHeader': headerValue});
        chrome.runtime.sendMessage({paymentheader: headerValue});
    });

    $('#searchBankPanel').click(function () {
        $('#bankSearch').show();
        $('#connected').hide();
        $('#disconnected').hide();
    });

    $('#stayConnected').click(function () {
        if($('#stayConnected').is(':checked')){
            $('#rememberPassword').prop('checked', true);
        }
    });

    $('#connectBank').click(function () {
        $('#status_link').text("Connecting...");
        var login_details = {};
        login_details['BankUrl'] = $('#bankAddress').val();
        login_details['Username'] = $('#username').val();
        login_details['Password'] = $('#password').val();
        login_details['RememberPasswd'] = 0;
        login_details['StayConnected'] = 0;

        $.get(login_details['BankUrl'], function(response, status) {

            $('#status_link').text("Connected");

            if (status == 'success') {

                $('#status_link').text("Connected!");

                bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");
                $('#status_link').text("Link:" + bankingapp_url);
                $('#status_link').attr("class", "alert-success");

                login_details['BankingAppUrl'] = bankingapp_url;

                if ($('#rememberPassword').is(':checked')) {
                    login_details['RememberPasswd'] = 1;
                }
                if ($('#stayConnected').is(':checked')) {
                    login_details['StayConnected'] = 1;
                }

                settings.setLoginDetails(login_details).then(function () {
                    $('#bankSearch').hide();
                    $('#connected').show();
                    $('#disconnected').hide();

                    loadDataFromBank();
                });
            }
        });
    });

    $('#disconnectBank').click(function () {
        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();

        settings.getLoginDetails().then(function(login_details) {
            login_details['StayConnected'] = 0;
            settings.setLoginDetails(login_details).then(function() {
                $('#stayConnected').prop('checked', false);
            });
        })
    });

    $('#selectBank').click(function () {
        var selected_bank = $('#selectBank').val();
        $('#bankSearchAddr').val(selected_bank);
    });

    $('#bankSearchOk').click(function () {
        var selected_bank = $('#bankSearchAddr').val();

        option_text = '<option value="'+ selected_bank +'">' + selected_bank + '</option>';
        $('#bankAddress').append(option_text);
        $('#bankAddress').val(selected_bank);

        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();
    });

    $('#bankSearchCancel').click(function () {
        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();
    });

    $('#sendCheque').click(function() {
        var receivers_name = $('#send_cheque_receivers_name').val();
        var receivers_email = $('#send_cheque_receivers_email').val();
        amount_str = $('#send_cheque_amount').val();
        var memo = $('#send_cheque_memo').val();

        var amount = 0;
        amount_float = parseFloat(amount_str);
        if(amount_float > 0.0)
        {
            amount = Math.floor(amount_float * SATHOSI);
        }

        var cc_me = 0;
        if($('#rememberPassword').is(':checked')){
            var cc_me = 1;
        }

        $('#status_connection').text("Sending cheque...");
        $('#status_connection').attr("class", "alert-warning");

        settings.getLoginDetails().then(function(login_details) {

            var bank_url = login_details['BankUrl'];
            var bankingapp_url = login_details['BankingAppUrl'];
            var username = login_details['Username'];
            var password = login_details['Password'];
            var account = login_details['Account'];

            data = {};
            data['action'] = 'draw_cheque';
            data['username'] = username;
            data['password'] = password;
            data['account'] = account;
            data['receivers_name'] = receivers_name;
            data['bank_send_to'] = receivers_email;
            data['lock'] = receivers_email;
            data['amount'] = amount;
            data['memo'] = memo;
            data['cc_me'] = cc_me;

            $.post(bankingapp_url, data, function(response, status) {
                if(status=='success') {
                    if (response.result == 'OK') {
                        $('#status_connection').text("Cheque sent OK");
                        $('#status_connection').attr("class", "alert-success");
                    }
                    else {
                        $('#status_connection').text(response.message);
                        $('#status_connection').attr("class", "alert-danger");
                    }
                }
                else{
                    $('#status_connection').text('Error: No response from bank.');
                    $('#status_connection').attr("class", "alert-danger");
                }
            }, 'json');

        })

    });

});
