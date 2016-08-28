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
    loadData();

    function updateTransactionList(bank_url, username, password, account){
        console.log('Load transaction data from bank.');

        $('#latestTransaction').append("<option value='status'>Loading...</option>");

        api_url = bank_url + '/wp-admin/admin-ajax.php?action=get_transactions&username=' + username + '&password=' + password + '&account=' + account;

        $.getJSON(api_url, function(json) {
            if (json.result == "OK") {
                $('#latestTransaction option[value="status"]').remove();

                for (index = 0, len = json.transactions.length; index < len; ++index) {

                    datetime = json.transactions[index].datetime.substring(5);
                    trans_type = json.transactions[index].type.toLowerCase();
                    trans_type = trans_type.charAt(0).toUpperCase() + trans_type.slice(1);
                    amount = json.transactions[index].amount;
                    amount_int = Number(amount);
                    amount_float = amount_int / 10000000;
                    amount_str = String(amount_float);

                    option_text = '<option value="'+ String(json.transactions[index].id) +'">' + datetime + ' ' + trans_type + ' ' + amount_str + '</option>';
                    $('#latestTransaction').append(option_text);
                }
            }
            else
            {
                $('#latestTransaction option[value="status"]').text('Error loading transaction');
            }
        });
    }

    function loadDataFromBank() {
        console.log('Load data from bank.');

        $('#status_connection').text = "Loading...";

        $('#selectedBankLink').html('');
        $('#bankWebAddr').html('');
        $('#defaultAccount').html('');
        $('#defaultAccount').val(0);
        $('#latestTransaction').html('');

        settings.getLoginDetails().then(function(result){
            var bank_url = result['BankUrl'];
            var username = result['Username'];
            var password = result['Password'];

            $('#selectedBankLink').html('<a href="'+bank_url+'" target="_blank"><u>'+bank_url+'</u></a>');
            $('#bankWebAddr').html('<a href="'+bank_url+'" target="_blank"><u>'+bank_url+'</u></a>');

            api_url = bank_url + '/wp-admin/admin-ajax.php?action=get_account_list&username=' + username + '&password=' + password;
            $.getJSON(api_url, function(json) {
                if(json.result == "OK")
                {
                    for (index = 0, len = json.list.length; index < len; ++index) {
                        balance_int = Number(json.list[index].balance);
                        balance_float = balance_int / 100000000;
                        balance_str = String(balance_float);

                        option_text = '<option value="'+ String(json.list[index].account_id) +'">' + json.list[index].name + ' / ' + balance_str +' ' + json.list[index].currency + '</option>';
                        $('#defaultAccount').append(option_text);
                    }

                    // If only one account, set is as the default
                    if(json.list.length == 1){
                        account = json.list[0].account_id;

                        settings.getLoginDetails().then(function(login_details) {
                            login_details['Account'] = account;
                            settings.setLoginDetails(login_details).then(function() {
                                $('#defaultAccount').val(account);
                            });
                        })
                    }

                    updateTransactionList(bank_url, username, password, account);

                    $('#status_connection').text("Connected");
                    $('#status_connection').attr("class", "alert-success");

                    $('#status_connection').text = "Connected";
                }
            });

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
        var login_details = {};
        login_details['BankUrl'] = $('#bankAddress').val();
        login_details['Username'] = $('#username').val();
        login_details['Password'] = $('#password').val();
        login_details['RememberPasswd'] = 0;
        login_details['StayConnected'] = 0;

        if($('#rememberPassword').is(':checked')){
            login_details['RememberPasswd'] = 1;
        }
        if($('#stayConnected').is(':checked')){
            login_details['StayConnected'] = 1;
        }

        settings.setLoginDetails(login_details).then(function(){
            $('#bankSearch').hide();
            $('#connected').show();
            $('#disconnected').hide();

            loadDataFromBank();
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

});
