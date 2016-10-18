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

    function setBankName(name) {
        $('#BankSearchName').text(name);
        $('#ConnectBankName').text(name);
        $('#ConnectedBankName').text(name);
    }

    function setBankUrl(url, linking) {
        if(linking) {
            url = '<a href="'+url+'" target="_blank"><u>'+url+'</u></a>'
        }
        $('#BankSearchLink').html(url);
        $('#ConnectBankLink').html(url);
        $('#ConnectedBankLink').html(url);
    }

    function setBankStatus(status_text, status_colour) {
        $('#BankSearchStatus').text(status_text);
        $('#BankSearchStatus').attr("class", status_colour);

        $('#ConnectBankStatus').text(status_text);
        $('#ConnectBankStatus').attr("class", status_colour);

        $('#ConnectedBankStatus').text(status_text);
        $('#ConnectedBankStatus').attr("class", status_colour);
    }

    function setBankStatusGreen(status_text) {
        setBankStatus(status_text, "alert-success")
    }

    function setBankStatusYello(status_text) {
        setBankStatus(status_text, "alert-warning")
    }

    function setBankStatusRed(status_text) {
        setBankStatus(status_text, "alert-danger")
    }

    function updateBankLink(bank_url, link_up_message) {
        setBankStatusYello("PROBING");

        var status_msg = link_up_message;

        $.get(bank_url, function(response, status) {
            if (status == 'success') {

                payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                if(bankingapp_url)
                {
                    if(payment_interface_url) {
                        api_url = payment_interface_url + '?action=ping';
                        $.getJSON(api_url, function (response, status) {
                            if (status == 'success') {
                                if (response.result == 'OK') {
                                    setBankName(response.name);
                                    setBankStatusGreen(status_msg);
                                    $('#ConnectBank').attr("disabled", false);
                                } else {
                                    setBankStatusRed('ERROR (Ping error)');
                                }
                            } else {
                                setBankStatusRed('ERROR (No ping response)');
                            }
                        })
                    }else{
                        setBankStatusRed('ERROR (No payment interface)');
                    }
                }else{
                    setBankStatusRed('ERROR (No bank interface)');
                }
            }else{
                setBankStatusRed('OFFLINE');
            }
        })
    }


    function loadTransactionList(bankingapp_url, username, password, account){
        console.log('Load transaction data from bank.');

        $('#latestTransaction').append("<option value='status'>Loading...</option>");

        var data = {};
        data['action'] = 'get_transactions';
        data['username'] = username;
        data['password'] = password;
        data['account'] = account;

        $.post(bankingapp_url, data, function(response) {
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

                setBankStatusGreen("CONNECTED");
            }
            else
            {
                $('#latestTransaction option[value="status"]').text('Error loading transaction');
                setBankStatusRed("ERROR (No bank connection)");
            }
        }, 'json');
    }

    function loadDataFromBank() {
        console.log('Load data from bank.');

        setBankStatusGreen("LOADING");

        $('#selectedBankLink').html('');
        $('#bankWebAddr').html('');
        $('#defaultAccount').html('');
        $('#defaultAccount').val(0);
        $('#latestTransaction').html('');

        settings.getLoginDetails().then(function(result) {
            var bankingapp_url = result['BankingAppUrl'];
            var username = result['Username'];
            var password = result['Password'];

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
                        account_currency = response.list[0].currency

                        settings.getLoginDetails().then(function(login_details) {
                            login_details['Account'] = account;
                            login_details['AccountCurrency'] = account_currency;
                            settings.setLoginDetails(login_details).then(function() {
                                $('#defaultAccount').val(account);
                            });
                        })
                    }

                    loadTransactionList(bankingapp_url, username, password, account);


                }else{
                    $('#latestTransaction option[value="status"]').text('Error loading transaction');
                }
            }, 'json');

        });
    }

    $('#mainbody').ready( function(){
        console.log('Load data from settings.');

        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();

        settings.getLoginDetails().then(function(login_details) {
            var bank_url = login_details['BankUrl'];
            var bank_name = login_details['BankName'];
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

            $('#ConnectBank').attr("disabled", true);
            $('#BankSearchDetect').attr("disabled", true);
            $('#bankSearchOk').attr("disabled", true);

            if(bank_url == '')
            {
                // If no bank log-in information is availeble, start the app i Search dialog
                $('#bankSearch').show();
                $('#disconnected').hide();
                $('#connected').hide();

                $('#bankSearchCancel').hide();

                autoDetectBanks();
            }else{
                if(stayConnected == 1){
                    $('#bankSearch').hide();
                    $('#disconnected').hide();
                    $('#connected').show();

                    setBankUrl(bank_url, true);
                    setBankName(bank_name);
                    loadDataFromBank();
                } else {
                    $('#bankSearch').hide();
                    $('#disconnected').show();
                    $('#connected').hide();

                    setBankUrl(bank_url, true);
                    setBankName(bank_name);
                    updateBankLink(bank_url, "ONLINE");
                }
            }
        });
    });

    $('#defaultAccount').click(function () {
        var def_account = $('#defaultAccount').val();
    });

    $('#savePaymentBroswerHeader').click(function () {
        var headerValue = $('#paymentBroswerHeader').val();
        chrome.storage.sync.set({'PaymentBroswerHeader': headerValue});
        chrome.runtime.sendMessage({paymentheader: headerValue});
    });

    $('#ConnectBank').click(function () {
        setBankStatusYello("CONNECTING");

        var login_details = {};
        login_details['BankUrl'] = $('#bankAddress').val();
        login_details['BankName'] = $('#BankSearchName').text();
        login_details['Username'] = $('#username').val();
        login_details['Password'] = $('#password').val();
        login_details['RememberPasswd'] = 0;

        $.get(login_details['BankUrl'], function(response, status) {

            if (status == 'success') {


                bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                if(bankingapp_url) {
                    login_details['BankingAppUrl'] = bankingapp_url;

                    if ($('#rememberPassword').is(':checked')) {
                        login_details['RememberPasswd'] = 1;
                    }

                    login_details['StayConnected'] = 1;

                    setBankStatusYello("LOAD DATA");


                    settings.setLoginDetails(login_details).then(function () {
                        $('#bankSearch').hide();
                        $('#connected').show();
                        $('#disconnected').hide();

                        $('a[href="#tabAccount"]').tab('show');

                        loadDataFromBank();
                    });
                }else{
                    setBankStatusRed("ERROR (No bank interface)");
                }
            }
        });
    });

    $('#disconnectBank').click(function () {
        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();
        setBankStatusGreen("ONLINE");

        settings.getLoginDetails().then(function(login_details) {
            login_details['StayConnected'] = 0;
            settings.setLoginDetails(login_details).then(function() {
            });
        })
    });

    /**
     * Check a list of url for any potential trusted banks. The function takes each url in the list and loads the page
     * and looks for link to BankingApp resources. If found, then it must be a bank. Banks found are put in the option
     * list on the Search Bank dialog.
     *
     * This function is called recursively for each URL in the list.
     *
     * @method checkUrlHasBankingAppInterface
     * @param {array} url_list - list of URLs
     */
    function checkUrlHasBankingAppInterface(url_list) {
        if(url_list.length) {
            var url = url_list.pop();
            var remaining_url_list = url_list;

            setBankStatusYello("DETECTING");

            if (url) {
                $('#BankSearchLink').text(url);
                setBankUrl(url, false);
                $.get(url, function(response, status) {
                    if (status == 'success') {

                        payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                        var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                        if(payment_interface_url) {
                            api_url = payment_interface_url + '?action=ping';
                            $.getJSON(api_url, function (response, status) {
                                if (status == 'success') {
                                    if (response.result == 'OK') {
                                        setBankStatusGreen("LOADING");

                                        if (bankingapp_url) {
                                            option_text = '<option value="' + url + '">' + url + '</option>';
                                            $('#selectAutoDetectedBank').append(option_text);
                                        }

                                        api_url = payment_interface_url + '?action=get_trusted_banks';
                                        $.getJSON(api_url, function (response, status) {
                                            if (status == 'success') {
                                                if (response.result == 'OK') {
                                                    len = response.trusted_banks.length;
                                                    if(len > 0) {
                                                        for (index = 0; index < len; ++index) {
                                                            bank_url = response.trusted_banks[index];

                                                            option_text = '<option value="' + bank_url + '">' + bank_url + '</option>';
                                                            $('#selectAutoDetectedBank').append(option_text);
                                                        }
                                                    }
                                                }
                                            }
                                            checkUrlHasBankingAppInterface(remaining_url_list);
                                        })
                                    }else{
                                        checkUrlHasBankingAppInterface(remaining_url_list);
                                    }
                                }else {
                                    checkUrlHasBankingAppInterface(remaining_url_list);
                                }
                            })
                        }else{
                            checkUrlHasBankingAppInterface(remaining_url_list);
                        }
                    }else {
                        checkUrlHasBankingAppInterface(remaining_url_list);
                    }
                });
            } else {
                checkUrlHasBankingAppInterface(remaining_url_list);
            }
        }else{
            setBankUrl('');
            setBankStatus('');
        }
    }

    function autoDetectBanks()
    {
        setBankName("");
        setBankStatusYello("DETECTING");

        chrome.tabs.query({currentWindow: true}, function(arrayOfTabs) {
            var match_list = [];
            for(i=0; i<arrayOfTabs.length; i++) {

                tab = arrayOfTabs[i];
                tab_url = tab.url;
                if(tab_url) {
                    match = tab_url.match(/^((http|https)\:\/\/[^\/?#]+)(?:[\/?#]|$)/i);

                    if (match && match.length > 1 && typeof match[1] === 'string' && match[1].length > 0) {
                        if(match_list.indexOf(match[1]) < 0) {
                            match_list.push(match[1]);
                        }
                    }

                    /* Special case for situation when running localhost and site is located in a sub folder */
                    match2 = tab_url.match(/^(((http|https)\:\/\/localhost\/))[^\/?#]+/i);
                    if (match2 && match2.length > 1 && typeof match2[0] === 'string' && match2[0].length > 0) {
                        if(match_list.indexOf(match2[0]) < 0) {
                            match_list.push(match2[0]);
                        }
                    }

                }
            }

            var lista = '';
            if (match_list.length > 0) {
                for(j=0; j<match_list.length; j++){

                    lista = lista + match_list[j] + ' + ';
                }

                checkUrlHasBankingAppInterface(match_list);

            }
            else{
                setBankStatusYello("No match");
            }

        });
    }

    /**
     * Search button in the Log-on dialog
     * Switch to the Search Bank dialog and search through all tabs on the current browser window for potential banks.
     */
    $('#searchBankPanel').click(function () {
        $('#bankSearch').show();
        $('#connected').hide();
        $('#disconnected').hide();

        $('#bankSearchAddr').val('');

        $('#selectAutoDetectedBank').empty();

        $('#BankSearchDetect').attr("disabled", true);
        $('#bankSearchOk').attr("disabled", true);

        autoDetectBanks();
    });

    $('#bankSearchAddr').keydown(function () {
        $('#bankSearchOk').attr("disabled", true);

        search_url = $('#bankSearchAddr').val();

        if(search_url == "") {
            $('#BankSearchDetect').attr("disabled", true);
        }else{
            $('#BankSearchDetect').attr("disabled", false);
        }
    });

    /**
     * Loopup button in the Search for Bank dialog.
     * Try load a list of trusted banks from the selected url and displays these in the list.
     */
    $('#BankSearchDetect').click(function () {
        var search_url = $('#bankSearchAddr').val();

        if(search_url == "") {
            autoDetectBanks();
        }else{
            if(!search_url.match(/^http/g)) {
                search_url = 'http://' + search_url;
            }

            setBankUrl(search_url, true);
            setBankName("");
            setBankStatusYello("DETECTING");
            $('#bankSearchOk').attr("disabled", true);

            $.get(search_url, function(response, status) {
                if (status == 'success') {

                    setBankStatusGreen("LOADING");

                    payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                    var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                    if(payment_interface_url) {
                        api_url = payment_interface_url + '?action=ping';
                        $.getJSON(api_url, function (response, status) {
                            if (status == 'success') {

                                if (response.result == 'OK') {
                                    bank_name = response.name;
                                    setBankName(bank_name);

                                    api_url = payment_interface_url + '?action=get_trusted_banks';
                                    $.getJSON(api_url, function (response, status) {
                                        if (status == 'success') {

                                            if (response.result == 'OK') {

                                                len = response.trusted_banks.length;
                                                if(len > 0) {

                                                    for (index = 0; index < len; ++index) {
                                                        bank_url = response.trusted_banks[index];

                                                        option_text = '<option value="' + bank_url + '">' + bank_url + '</option>';
                                                        $('#selectAutoDetectedBank').append(option_text);
                                                    }

                                                    if(bankingapp_url) {
                                                        setBankStatusGreen("ONLINE");
                                                        $('#bankSearchOk').attr("disabled", false);
                                                    }else{
                                                        setBankStatusRed("");
                                                    }

                                                    if(len == 0) {
                                                        info = bank_name;
                                                        setBankName(info);
                                                        if(!bankingapp_url) {
                                                            setBankStatusRed("NO BANK");
                                                        }
                                                    } else if(len == 1){
                                                        info = bank_name + " (1 trusted bank)";
                                                        setBankName(info);
                                                        setBankStatusRed("");
                                                    } else {
                                                        info = bank_name + " (" + len + " trusted banks)";
                                                        setBankName(info);
                                                        setBankStatusRed("");
                                                    }
                                                }
                                            } else {
                                                setBankStatusRed("ERROR (Error in response)");
                                            }
                                        } else {
                                            setBankStatusRed("ERROR (Error in request)");
                                        }
                                    });

                                }
                            }
                            else
                            {
                                setBankName('');
                                setBankStatusRed("ERROR (No ping respons)");
                            }
                        });
                    }else{
                        setBankName("");
                        setBankStatusRed("ERROR (No payment interface)");
                    }
                }else{
                    setBankName("");
                    setBankStatusRed("OFFLINE");
                }
            });

        }
    });

    $('#selectAutoDetectedBank').click(function () {
        var selected_bank_url = $('#selectAutoDetectedBank').val();

        $('#bankSearchAddr').val(selected_bank_url);
        setBankUrl(selected_bank_url, true);

        setBankName('Loading info...');
        setBankStatusYello("PROBING");

        $('#bankSearchOk').attr("disabled", true);
        $('#BankSearchDetect').attr("disabled", false);

        $.get(selected_bank_url, function(response, status) {
            if (status == 'success') {
                payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");

                if(payment_interface_url) {
                    api_url = payment_interface_url + '?action=ping';

                    $.getJSON(api_url, function (response, status) {
                        if (status == 'success') {

                            if (response.result == 'OK') {
                                setBankName(response.name);
                                setBankStatusGreen("ONLINE");
                                $('#bankSearchOk').attr("disabled", false);
                            }
                        }
                        else
                        {
                            setBankName('');
                            setBankStatusRed("ERROR (No ping response)");
                        }
                    });
                }
                else
                {
                    setBankName('');
                    setBankStatusRed("ERROR (No payment interface)");
                }
            }
            else
            {
                setBankName('');
                setBankStatusRed("OFFLINE");
            }
        });
    });

    $('#bankSearchOk').click(function () {
        var selected_bank = $('#bankSearchAddr').val();

        option_text = '<option value="'+ selected_bank +'">' + selected_bank + '</option>';
        $('#bankAddress').append(option_text);
        $('#bankAddress').val(selected_bank);

        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();

        $('#ConnectBank').attr("disabled", false);
    });

    $('#bankSearchCancel').click(function () {
        $('#bankSearch').hide();
        $('#connected').hide();
        $('#disconnected').show();

        settings.getLoginDetails().then(function(login_details) {
            var bank_url = login_details['BankUrl'];
            var bank_name = login_details['BankName'];

            setBankUrl(bank_url, true);
            setBankName(bank_name);
            updateBankLink(bank_url, "ONLINE");
        });
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
        if(($('#SendChequeCcMe').is(':checked'))){
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
            var account_currency = login_details['AccountCurrency'];

            data = {};
            data['action'] = 'draw_cheque';
            data['username'] = username;
            data['password'] = password;
            data['account'] = account;
            data['receivers_name'] = receivers_name;
            data['bank_send_to'] = receivers_email;
            data['lock'] = receivers_email;
            data['amount'] = amount;
            data['currency'] = account_currency;
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

    $('#RemoveLoginDetails').click(function () {
        settings.getLoginDetails().then(function(login_details) {
            login_details['BankUrl'] = '';
            login_details['Username'] = '';
            login_details['Password'] = '';
            login_details['RememberPasswd'] = 0;
            login_details['StayConnected'] = 0;

            login_details['Account'] = '';
            login_details['AccountCurrency'] = '';

            settings.setLoginDetails(login_details).then(function() {
                $('#bankSearch').show();
                $('#disconnected').hide();
                $('#connected').hide();

                $('#bankSearchOk').attr("disabled", true);
                $('#bankSearchCancel').hide();

                $('#selectAutoDetectedBank').empty();

                autoDetectBanks();
            });
        });

    })

});
