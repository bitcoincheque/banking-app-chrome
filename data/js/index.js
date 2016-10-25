/**
 * index.js
 * Copyright (c) 2016 Bitcoin Cheque Foundation (http://bitcoincheque.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the MIT license.
 *
 * Controls index.html, the main chrome window
 */

const PANEL_SEARCH = 0;
const PANEL_LOG_IN = 1;
const PANEL_TRANSACTION = 2;
const PANEL_SEND = 3;
const PANEL_GET = 4;
const PANEL_OPTION = 5;

$(document).ready(function () {
    var SATHOSI = 100000000;

    /**
     * Change panel
     * @param panel : Number : One of the PANEL_ consts.
     */
    function selectPanel(panel){
        switch(panel) {
            case PANEL_SEARCH: {
                $('#bankSearch').show();
                $('#disconnected').hide();
                $('#connected').hide();
                break;
            }
            case PANEL_LOG_IN: {
                $('#bankSearch').hide();
                $('#disconnected').show();
                $('#connected').hide();
                break;
            }
            case PANEL_TRANSACTION:{
                $('#bankSearch').hide();
                $('#disconnected').hide();
                $('#connected').show();

                $('a[href="#tabAccount"]').tab('show');
                break;
            }
            case PANEL_SEND:{
                $('#bankSearch').hide();
                $('#disconnected').hide();
                $('#connected').show();

                $('a[href="#tabAccount"]').tab('show');
                break;
            }
            case PANEL_GET:{
                $('#bankSearch').hide();
                $('#disconnected').hide();
                $('#connected').show();

                $('a[href="#tabAccount"]').tab('show');
                break;
            }
            case PANEL_OPTION:{
                $('#bankSearch').hide();
                $('#disconnected').hide();
                $('#connected').show();

                $('a[href="#tabAccount"]').tab('show');
                break;
            }

        }

        setBankInfo('');
    }

    /**
     * Displays a link with or without hyperlink
     * @param url : String : Url to link
     * @param name : String : Text to be displayed insted of the url
     */
    function setBankUrlAndName(url, name) {
        if(name==''){
            name = url;
        }
        if(url == '' && name == '') {
            $('#BankSearchName').text('');
            $('#ConnectBankName').text('');
            $('#ConnectedBankName').text('');

            $('#BankSearchLink').html('');
            $('#ConnectBankLink').html('');
            $('#ConnectedBankLink').html('');
        }else if(url == '') {
            $('#BankSearchName').text(name);
            $('#ConnectBankName').text(name);
            $('#ConnectedBankName').text(name);
        }else{
            url = '<a href="' + url + '" target="_blank">' + name + '</a>';

            $('#BankSearchLink').html(url);
            $('#ConnectBankLink').html(url);
            $('#ConnectedBankLink').html(url);
        }
    }

    /**
     * Displays info string besides the colored status text.
     * @param info
     */
    function setBankInfo(info) {
        $('#BankSearInfo').text(info);
        $('#ConnectBankInfo').text(info);
        $('#ConnectedBankInfo').text(info);
    }

    /**
     * Display a colored status text. Typical used to display link status.
     * @param status_text : String : Text to be displayed
     * @param status_colour : String : Colour code as defined by Bootstrap.
     */
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

    function setBankStatusOff() {
        setBankStatus("", "");
    }


    /**
     * Test the bank is still online and updates the colored Bank Status accordingly
     * @param bank_url : String : url link
     * @param link_up_message : String : Text to be displayd on the colored status field if link ok.
     */
    function updateBankLink(bank_url, link_up_message) {
        setBankStatusYello("PROBING");

        var status_msg = link_up_message;

        $.get(bank_url, function(response, status) {
            if (status == 'success') {

                var payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                if(bankingapp_url)
                {
                    if(payment_interface_url) {
                        var api_url = payment_interface_url + '?action=ping';
                        $.getJSON(api_url, function (response, status) {
                            if (status == 'success') {
                                if (response.result == 'OK') {
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

    /**
     * Loads the list of transaction.
     * @param bankingapp_url : String : Url to bank's Bank Interface
     * @param username
     * @param password
     * @param account
     */
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

                for (var index = 0, len = response.transactions.length; index < len; ++index) {

                    var datetime = response.transactions[index].datetime.substring(5);
                    var trans_type = response.transactions[index].type.toLowerCase();
                    trans_type = trans_type.charAt(0).toUpperCase() + trans_type.slice(1);
                    var amount = response.transactions[index].amount;
                    var amount_int = Number(amount);
                    var amount_float = (1.0 * amount_int) / SATHOSI;
                    var amount_str = String(amount_float);

                    var option_text = '<option value="'+ String(response.transactions[index].id) +'">' + datetime + ' ' + trans_type + ' ' + amount_str + '</option>';
                    $('#latestTransaction').append(option_text);
                }

                setBankStatusGreen("CONNECTED");
                $('#ConnectBank').attr("disabled", false);
            }
            else
            {
                $('#latestTransaction option[value="status"]').text('Error loading transaction');
                setBankStatusRed("ERROR (No bank connection)");
            }
        }, 'json');
    }

    /**
     * Loads various information from bank.
     * Used only when user is signed-in.
     */
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
                    for (var index = 0, len = response.list.length; index < len; ++index) {
                        var balance_int = Number(response.list[index].balance);
                        var balance_float = balance_int / SATHOSI;
                        var balance_str = String(balance_float);

                        var option_text = '<option value="'+ String(response.list[index].account_id) +'">' + response.list[index].name + ' / ' + balance_str +' ' + response.list[index].currency + '</option>';
                        $('#defaultAccount').append(option_text);
                    }

                    // If only one account, set is as the default
                    if(response.list.length == 1){
                        var account = response.list[0].account_id;
                        var account_currency = response.list[0].currency;

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
                setBankUrlAndName('', url);
                $.get(url, function(response, status) {
                    if (status == 'success') {

                        var payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                        var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                        if(payment_interface_url) {
                            var api_url = payment_interface_url + '?action=ping';
                            $.getJSON(api_url, function (response, status) {
                                if (status == 'success') {
                                    if (response.result == 'OK') {
                                        setBankUrlAndName('', response.name);
                                        setBankStatusGreen("LOADING");

                                        if (bankingapp_url) {
                                            var option_text = '<option value="' + url + '">' + url + '</option>';
                                            $('#selectAutoDetectedBank').append(option_text);
                                        }

                                        api_url = payment_interface_url + '?action=get_trusted_banks';
                                        $.getJSON(api_url, function (response, status) {
                                            if (status == 'success') {
                                                if (response.result == 'OK') {
                                                    var len = response.trusted_banks.length;
                                                    if(len > 0) {
                                                        for (var index = 0; index < len; ++index) {
                                                            var bank_url = response.trusted_banks[index];

                                                            var option_text = '<option value="' + bank_url + '">' + bank_url + '</option>';
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
            setBankUrlAndName('', '');
            setBankStatusOff();
        }
    }

    function autoDetectBanks()
    {
        setBankStatusYello("DETECTING");

        chrome.tabs.query({currentWindow: true}, function(arrayOfTabs) {
            var match_list = [];
            for(i=0; i<arrayOfTabs.length; i++) {

                var tab = arrayOfTabs[i];
                var tab_url = tab.url;
                if(tab_url) {
                    var match = tab_url.match(/^((http|https)\:\/\/[^\/?#]+)(?:[\/?#]|$)/i);

                    if (match && match.length > 1 && typeof match[1] === 'string' && match[1].length > 0) {
                        if(match_list.indexOf(match[1]) < 0) {
                            match_list.push(match[1]);
                        }
                    }

                    /* Special case for situation when running localhost and site is located in a sub folder */
                    var match2 = tab_url.match(/^((http|https)\:\/\/localhost\/)[^\/?#]+/i);
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
                setBankStatusYello("");
                setBankInfo('No banks detected')
            }

        });
    }

    /**
     * This function is called after the windows is completely loaded.
     */
    $('#mainbody').ready( function(){
        console.log('Load data from settings.');

        selectPanel(PANEL_LOG_IN);

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


            var option_text = '<option value="' + bank_url + '" selected>' + bank_url + '</option>';
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
                selectPanel(PANEL_SEARCH);

                $('#bankSearchCancel').hide();

                autoDetectBanks();
            }else{
                if(stayConnected == 1){
                    selectPanel(PANEL_TRANSACTION);
                    setBankUrlAndName(bank_url, bank_name);
                    loadDataFromBank();
                } else {
                    selectPanel(PANEL_LOG_IN);

                    setBankUrlAndName(bank_url, bank_name);
                    updateBankLink(bank_url, "ONLINE");
                }
            }
        });
    });

    /* The following functions is for the Search panel */

    /**
     * Keydown function for the Address text input in the Search panel.
     * If any text in Address input, the Detect button shall be enabled.
     */
    $('#bankSearchAddr').keydown(function () {
        $('#bankSearchOk').attr("disabled", true);

        var search_url = $('#bankSearchAddr').val();

        if(search_url == "") {
            $('#BankSearchDetect').attr("disabled", true);
        }else{
            $('#BankSearchDetect').attr("disabled", false);
        }
    });

    /**
     * Detect button in the Search for Bank dialog.
     * Try load a list of trusted banks from the selected url in address input and displays these in the list.
     */
    $('#BankSearchDetect').click(function () {
        var search_url = $('#bankSearchAddr').val();

        setBankInfo('');

        if(search_url == "") {
            // If url don't start with http prototype, aassume it is http
            if(!search_url.match(/^http/g)) {
                search_url = 'http://' + search_url;
            }

            setBankUrlAndName(search_url, '');
            setBankStatusYello("DETECTING");
            $('#bankSearchOk').attr("disabled", true);

            // Load the url entered in the Address field.
            $.get(search_url, function(response, status) {
                if (status == 'success') {

                    setBankStatusGreen("LOADING");

                    var payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                    var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                    if(payment_interface_url) {
                        // If site has Payment Interface, try ping it.
                        var api_url = payment_interface_url + '?action=ping';
                        $.getJSON(api_url, function (response, status) {
                            if (status == 'success') {
                                if (response.result == 'OK') {
                                    // Ping returned ok.
                                    var bank_name = response.name;
                                    setBankUrlAndName(search_url, bank_name);

                                    // Then try the Bank Interface
                                    api_url = payment_interface_url + '?action=get_trusted_banks';
                                    $.getJSON(api_url, function (response, status) {
                                        if (status == 'success') {
                                            if (response.result == 'OK') {
                                                // Bank interface seems ok, the bank is online.
                                                setBankStatusGreen("ONLINE");

                                                var len = response.trusted_banks.length;
                                                if(len > 0) {
                                                    // Read the trusted banks and put them in the "List of auto-detected bansk"
                                                    for (var index = 0; index < len; ++index) {
                                                        var bank_url = response.trusted_banks[index];

                                                        var option_text = '<option value="' + bank_url + '">' + bank_url + '</option>';
                                                        $('#selectAutoDetectedBank').append(option_text);
                                                    }

                                                    if(bankingapp_url) {
                                                        $('#bankSearchOk').attr("disabled", false);
                                                        if(len == 0) {
                                                            setBankInfo("This bank trusts no other banks.");
                                                        } else if(len == 1){
                                                            var info = "This bank trusts 1 other bank.";
                                                            setBankInfo(info);
                                                        } else {
                                                            info = "This bank trusts " + len + " other banks.";
                                                            setBankInfo(info);
                                                        }
                                                    }else{
                                                        if(len == 0) {
                                                            setBankInfo("No site don't trusts any banks.");
                                                        } else if(len == 1){
                                                            info = "This site trusts 1 bank";
                                                            setBankInfo(info);
                                                        } else {
                                                            info = "This site trusts " + len + " banks.";
                                                            setBankInfo(info);
                                                        }
                                                    }
                                                }
                                            } else {
                                                setBankStatusRed("ERROR");
                                                setBankInfo('Error in response');
                                            }
                                        } else {
                                            setBankStatusRed("ERROR");
                                            setBankInfo('Error in request');
                                        }
                                    });

                                }
                            }
                            else
                            {
                                setBankInfo('');
                                setBankStatusRed("ERROR");
                                setBankInfo('No ping response');
                            }
                        });
                    }else{
                        setBankInfo("");
                        setBankStatusRed("ERROR");
                        setBankInfo('No payment interface');
                    }
                }else{
                    setBankInfo("");
                    setBankStatusRed("OFFLINE");
                    setBankInfo('');
                }
            });

        }
    });

    /**
     * Detect button in Search panel.
     * This take the Address and try load the page and load the list of trusted banks if the Payment Interface is found.
     */
    $('#selectAutoDetectedBank').click(function () {
        var selected_bank_url = $('#selectAutoDetectedBank').val();

        $('#bankSearchAddr').val(selected_bank_url);

        setBankUrlAndName(selected_bank_url, '');
        setBankStatusYello("PROBING");
        setBankInfo('');

        $('#bankSearchOk').attr("disabled", true);
        $('#BankSearchDetect').attr("disabled", false);

        $.get(selected_bank_url, function(response, status) {
            if (status == 'success') {
                var payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");

                if(payment_interface_url) {
                    var api_url = payment_interface_url + '?action=ping';

                    $.getJSON(api_url, function (response, status) {
                        if (status == 'success') {

                            if (response.result == 'OK') {
                                setBankUrlAndName(selected_bank_url, response.name);
                                setBankStatusGreen("ONLINE");
                                $('#bankSearchOk').attr("disabled", false);
                            }
                        }
                        else
                        {
                            setBankUrlAndName('', '');
                            setBankStatusRed('ERROR');
                            setBankInfo('No ping response')
                        }
                    });
                }
                else
                {
                    setBankUrlAndName('', '');
                    setBankStatusRed("ERROR");
                    setBankInfo('No payment interface')
                }
            }
            else
            {
                setBankUrlAndName('', '');
                setBankStatusRed("OFFLINE");
                setBankInfo('')
            }
        });
    });

    /**
     * OK button in Search panel.
     * Takes the url in Address input as the bank to connect.
     * OK button is only enabled after the bank url has been tested and the Banking App Interface has been found.
     */

    $('#bankSearchOk').click(function () {
        var selected_bank = $('#bankSearchAddr').val();

        var option_text = '<option value="'+ selected_bank +'">' + selected_bank + '</option>';
        $('#bankAddress').append(option_text);
        $('#bankAddress').val(selected_bank);

        selectPanel(PANEL_LOG_IN);

        $('#ConnectBank').attr("disabled", false);
    });

    $('#bankSearchCancel').click(function () {
        selectPanel(PANEL_LOG_IN);

        settings.getLoginDetails().then(function(login_details) {
            var bank_url = login_details['BankUrl'];
            var bank_name = login_details['BankName'];

            setBankUrlAndName(bank_url, bank_name);
            updateBankLink(bank_url, "ONLINE");
        });
    });

    /* The following functions are for the Sign-In Panel */

    /**
     * Search button in the Sign-In Panel
     * Switch to the Search Bank dialog and search through all tabs on the current browser window for potential banks.
     */
    $('#searchBankPanel').click(function () {
        selectPanel(PANEL_SEARCH);

        $('#bankSearchAddr').val('');

        $('#selectAutoDetectedBank').empty();

        $('#BankSearchDetect').attr("disabled", true);
        $('#bankSearchOk').attr("disabled", true);

        autoDetectBanks();
    });

    /**
     *  Connect button in the Sign-In Panel.
     *  Connects to the bank. Store username and password.
     */
    $('#ConnectBank').click(function () {
        $('#ConnectBank').attr("disabled", true);
        setBankStatusYello("CONNECTING");

        var login_details = {};
        login_details['BankUrl'] = $('#bankAddress').val();
        login_details['BankName'] = $('#BankSearchName').text();
        login_details['Username'] = $('#username').val();
        login_details['Password'] = $('#password').val();
        login_details['RememberPasswd'] = 0;

        $.get(login_details['BankUrl'], function(response, status) {
            if (status == 'success') {

                var payment_interface_url = $(response).filter('link[rel=MoneyAddress]').attr("href");
                var bankingapp_url = $(response).filter('link[rel=BankingApp]').attr("href");

                if(payment_interface_url) {
                    api_url = payment_interface_url + '?action=ping';
                    $.getJSON(api_url, function (response, status) {
                        if (status == 'success') {
                            if (response.result == 'OK') {

                                login_details['BankName'] = response.name;

                                if (bankingapp_url) {
                                    login_details['BankingAppUrl'] = bankingapp_url;

                                    if ($('#rememberPassword').is(':checked')) {
                                        login_details['RememberPasswd'] = 1;
                                    }

                                    login_details['StayConnected'] = 1;

                                    setBankStatusYello("LOAD DATA");

                                    settings.setLoginDetails(login_details).then(function () {
                                        selectPanel(PANEL_TRANSACTION);
                                        loadDataFromBank();
                                    });
                                } else {
                                    setBankStatusRed('ERROR');
                                    setBankInfo('No payment interface')
                                }
                            }
                        }
                    });
                } else {
                    setBankStatusRed('ERROR');
                    setBankInfo('No payment interface')
                }
            } else {
                setBankStatusRed('OFFLINE');
                setBankInfo('')
            }
        });
    });

    /* The following functions for the four signed-in Panels */
    /**
     * Disconnect button
     */
    $('#disconnectBank').click(function () {
        selectPanel(PANEL_LOG_IN);

        setBankStatusGreen("ONLINE");

        settings.getLoginDetails().then(function(login_details) {
            login_details['StayConnected'] = 0;
            settings.setLoginDetails(login_details).then(function() {
            });
        })
    });

    /**
     * Function handling change of selected item in the account list.
     * Store new default account to use.
     */
    $('#defaultAccount').click(function () {
        var def_account = $('#defaultAccount').val();

        settings.getLoginDetails().then(function(login_details) {
            login_details['Account'] = def_account;
            settings.setLoginDetails(login_details);
        });
    });

    /**
     * Send Cheque button in Send panel.
     */
    $('#sendCheque').click(function() {
        var receivers_name = $('#send_cheque_receivers_name').val();
        var receivers_email = $('#send_cheque_receivers_email').val();
        var amount_str = $('#send_cheque_amount').val();
        var memo = $('#send_cheque_memo').val();

        var amount = 0;
        var amount_float = parseFloat(amount_str);
        if(amount_float > 0.0)
        {
            amount = Math.floor(amount_float * SATHOSI);
        }

        var cc_me = 0;
        if(($('#SendChequeCcMe').is(':checked'))){
            cc_me = 1;
        }

        setBankStatusYello("SENDING");

        settings.getLoginDetails().then(function(login_details) {

            var bank_url = login_details['BankUrl'];
            var bankingapp_url = login_details['BankingAppUrl'];
            var username = login_details['Username'];
            var password = login_details['Password'];
            var account = login_details['Account'];
            var account_currency = login_details['AccountCurrency'];

            var data = {};
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
                        setBankStatusGreen("OK");
                    }
                    else {
                        setBankStatusRed("ERROR");
                        setBankInfo(response.message);
                    }
                }
                else{
                    setBankStatusRed("ERROR");
                    setBankInfo("No response from bank.");
                }
            }, 'json');

        })

    });

    /*
    $('#savePaymentBroswerHeader').click(function () {
        var headerValue = $('#paymentBroswerHeader').val();
        chrome.storage.sync.set({'PaymentBroswerHeader': headerValue});
        chrome.runtime.sendMessage({paymentheader: headerValue});
    });
    */

    /**
     * Handler for Remove Login Details button.
     */
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
                selectPanel(PANEL_SEARCH);

                $('#bankSearchOk').attr("disabled", true);
                $('#bankSearchCancel').hide();

                $('#selectAutoDetectedBank').empty();

                autoDetectBanks();
            });
        });

    })

});
