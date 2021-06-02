var ordersAccount = { account: "", provider: "", name: "" };
var avaiableAccounts = {};
var availableActions = {};
var viewingOrders = {};
var currentAmendOrder = {}
var currentCancelOrder = {}

var showNewOrderModal = false;
var newOrderPreloadDetails = {};

var orderEntry = {
    orderId: "",
    account: "",
    symbolCode: "",
    symbolName: "",
    market: "",
    exchange: "",
    side: "",
    quantity: 0,
    orderType: "",
    price: 0.0,
    timeInForce: "",
    expiryDate: null
};

const accountLookupID = "accountSelector";
const accountLookupSelector = "#" + accountLookupID;

const spinnerElementSelector = "#loading-spinner";
const renderElementId = "orders-table";

const searchAccountStatementTemplate = "orders-accountsearchstatement-template";
const searchAccountTemplate = "orders-searchaccount-template";
const retrieveOrdersTemplate = "orders-selectstatement-template";
const renderTemplateId = "orders-entry-template";
const renderNoResultsTemplateId = "orders-noresults-template";
const retrieveSymbolsTemplate = "orders-selectsymbolsstatement-template";
const retrieveOrderStatusTemplate = "orders-selectorderactionsstatement-template";
const retrieveMarketsTemplate = "orders-selectmarketsstatement-template";
const renderMarketsTemplate = "orders-availablemarkets-template";
const insertNewOrderTemplate = "orders-neworder-template";
const insertAmendOrderTemplate = "orders-amendorder-template";
const insertCancelOrderTemplate = "orders-cancelorder-template";

const newOrderPadModal = "#newOrderPadModal";
const amendOrderPadModal = "#amendOrderPadModal";

const newPadBodyID = "newPadBody";
const newPadBodySelector = "#" + newPadBodyID;
const newPadAccountID = "newPadAccountSelector";
const newPadAccountSelector = "#" + newPadAccountID;
const newPadAccountValidSelector = ".accountLookup .bootstrap-select";
const newPadSideSelector = "input[name='newPadRadioSide'][value='{side}']";
const newPadSideValueSelector = "input[name='newPadRadioSide']:checked";
const newPadSymbolID = "newPadSymbolSelector";
const newPadSymbolSelector = "#" + newPadSymbolID;
const newPadSymbolValidSelector = ".symbolLookup .bootstrap-select";
const newPadQantitySelector = "#newPadQuantity";
const newPadTypeSelector = "input[name='newPadRadioType'][value='{orderType}']";
const newPadTypeValueSelector = "input[name='newPadRadioType']:checked";
const newPadPriceID = "newPadPrice";
const newPadPriceSelector = "#" + newPadPriceID;
const newPadTimeInForceID = "newPadTimeInForce";
const newPadTimeInForceSelector = "#" + newPadTimeInForceID;
const newPadExpiryID = "newPadExpiry";
const newPadExpirySelector = "#" + newPadExpiryID;
const newPadActionZoneSelector = "#newPadActionZone";
const newPadActionSelector = "#newPadAction";
const newPadErrorZoneSelector = "#newPadErrorZone";
const newPadErrorSelector = "#newPadError";
const newPadCancel = "#newPadCancel";
const newPadPlace = "#newPadPlace";
const newPadBusy = "#newPadBusy";
const newPadMarketsID = "newPadMarkets";
const newPadMarketsSelector = "#" + newPadMarketsID;

const amendPadBodySelector = "#amendPadBody";
const amendPadAccountSelector = "#amendPadAccountCode";
const amendPadSideSelector = "input[name='amendPadRadioSide'][value='{Side}']";
const amendPadSymbolSelector = "#amendPadSymbolCode";
const amendPadMarketSelector = "#amendPadMarket";
const amendPadQantitySelector = "#amendPadQuantity";
const amendPadTypeSelector = "input[name='amendPadRadioType'][value='{Type}']";
const amendPadPriceSelector = "#amendPadPrice";
const amendPadTimeInForceSelector = "#amendPadTimeInForce";
const amendPadExpirySelector = "#amendPadExpiry";
const amendPadActionZoneSelector = "#amendPadActionZone";
const amendPadActionSelector = "#amendPadAction";
const amendPadErrorZoneSelector = "#amendPadErrorZone";
const amendPadErrorSelector = "#amendPadError";

const cancelPadBodySelector = "#cancelPadBody";
const cancelPadAccountSelector = "#cancelPadAccountCode";
const cancelPadSideSelector = "input[name='cancelPadRadioSide'][value='{Side}']";
const cancelPadSymbolSelector = "#cancelPadSymbolCode";
const cancelPadMarketSelector = "#cancelPadMarket";
const cancelPadQantitySelector = "#cancelPadQuantity";
const cancelPadTypeSelector = "input[name='cancelPadRadioType'][value='{Type}']";
const cancelPadPriceSelector = "#cancelPadPrice";
const cancelPadTimeInForceSelector = "#cancelPadTimeInForce";
const cancelPadExpirySelector = "#cancelPadExpiry";
const cancelPadActionZoneSelector = "#cancelPadActionZone";
const cancelPadActionSelector = "#cancelPadAction";
const cancelPadErrorZoneSelector = "#cancelPadErrorZone";
const cancelPadErrorSelector = "#cancelPadError";

const searchSymbolTemplate = "orders-searchsymbol-template";
const iqSearchSymbolNameTemplate = "orders-symbolnamesearchstatement-template";
const iqSearchSymbolCodeTemplate = "orders-symbolcodesearchstatement-template";

$(async function () {
    // Lookups
    $(accountLookupSelector).selectpicker();
    $(newPadAccountSelector).selectpicker();
    $(newPadSymbolSelector).selectpicker();
    // lookup changed events
    $(accountLookupSelector).on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        ordersAccount.account = $(e.target).val();
        ordersAccount.provider = avaiableAccounts[ordersAccount.account].Provider;
        ordersAccount.name = avaiableAccounts[ordersAccount.account].Name;
        console.log("Orders account changed: " + previousValue + ' -> ' + ordersAccount.account);
        SaveSelectedAccount()
        RefreshOrders();
    });
    $(newPadSymbolSelector).on('changed.bs.select', async function (e, clickedIndex, isSelected, previousValue) {
        newPadSymbol = $(e.target).val();
        if (newPadSymbol == "") {
            document.getElementById(newPadMarketsID).innerHTML = "";
            return;
        }
        console.log("Target symbol changed: " + newPadSymbol);
        var iqStatement = GenerateTemplate(retrieveMarketsTemplate, newPadSymbol);
        var qrIQ = await IqQueryPromise(iqStatement);
        if (!qrIQ.successful) {
            Failed(qrIQ.reason);
            return;
        }
        var availableMarkets = JSON.parse(qrIQ.data);
        orderEntry.exchange = availableMarkets.Rows[0].Exchange;
        var html = GenerateTemplate(renderMarketsTemplate, availableMarkets);
        document.getElementById(newPadMarketsID).innerHTML = html;
    });
    // Order status helper
    Handlebars.registerHelper('actionSupported', function (action, accountCode, status) {
        var result = false;
        var provider = avaiableAccounts[accountCode].Provider;
        var key = BuildActionKey(provider, status);
        var available = availableActions[key];
        if (available) {
            if (available.Allows.includes(action) || available.Allows.includes("All")) result = true;
        }
        return result;
    });
    // numeric entries
    $(newPadQantitySelector).w2field('int', { autoFormat: true, groupSymbol: ',', min: 0 });
    $(newPadPriceSelector).w2field('float', { precision: 3, autoFormat: true, groupSymbol: ',', min: 0 });
    $(amendPadQantitySelector).w2field('int', { autoFormat: true, groupSymbol: ',', min: 0 });
    $(amendPadPriceSelector).w2field('float', { precision: 3, autoFormat: true, groupSymbol: ',', min: 0 });
    // no expiry dates before today
    $(newPadExpirySelector).attr("min", moment().format("YYYY-MM-DD"))
    // modal events
    $(newOrderPadModal).on('show.bs.modal', function (e) {
        // defaults
        orderEntry = {
            orderId: "",
            account: ordersAccount.account,
            symbolCode: "",
            symbolName: "",
            market: "",
            exchange: "",
            side: "Ask",
            quantity: 0,
            orderType: "Limit",
            price: 0.0,
            timeInForce: "GoodTillCancel",
            expiryDate: null
        };
        if (showNewOrderModal) {
            // load from previous screen
            orderEntry.side = newOrderPreloadDetails.side;
            orderEntry.symbolCode = newOrderPreloadDetails.symbol;
            orderEntry.symbolName = newOrderPreloadDetails.symbolName;
            if (newOrderPreloadDetails.account) orderEntry.account = newOrderPreloadDetails.account;
            else orderEntry.account = ordersAccount.account;
        }
        PrepareNewOrderPad(orderEntry);
        showNewOrderModal = false;
    });
    $(newOrderPadModal).on('hide.bs.modal', function (e) {
        NewOrderNotBusy();
        ClearNewOrderAction();
    });
    $(amendOrderPadModal).on('hide.bs.modal', function (e) {
        AmendOrderNotBusy();
        ClearAmendOrderAction();
    });
    $(cancelOrderPadModal).on('hide.bs.modal', function (e) {
        CancelOrderNotBusy();
        ClearCancelOrderAction();
    });

    // attach symbol search
    $(newOrderPadModal + " .symbolLookup .bs-searchbox input").on("keydown", Debounce(function (evnt) {
        DoSymbolSearch(evnt);
    }, 500));

    await LoadStaticData();
    await LoadSelectedAccount();

    if (showNewOrderModal) $(newOrderPadModal).modal('show');
});

// ** Page functions *******************************************************************************************************************************************

function SetupNewOrder(showNewOrder, newOrderDetails) {
    showNewOrderModal = showNewOrder;
    newOrderPreloadDetails = newOrderDetails;
}

async function LoadStaticData() {
    // generate IQ statements
    var filter = "";
    var iqAccountsStatement = GenerateTemplate(searchAccountStatementTemplate, filter);
    var iqStatusStatement = GenerateTemplate(retrieveOrderStatusTemplate, filter);

    var results = await Promise.all([IqQueryPromise(iqAccountsStatement), IqQueryPromise(iqStatusStatement)]);

    if (!results[0].successful) {
        console.error('IQ account search: ' + results[0].reason);
        return;
    }
    if (!results[1].successful) {
        console.error('IQ order status: ' + results[1].reason);
        return;
    }

    var resultsForAccount = JSON.parse(results[0].data);
    var htmlAccount = GenerateTemplate(searchAccountTemplate, resultsForAccount);
    document.getElementById(accountLookupID).innerHTML = htmlAccount;
    $(accountLookupSelector).selectpicker('refresh');
    document.getElementById(newPadAccountID).innerHTML = htmlAccount;
    $(newPadAccountSelector).selectpicker('refresh');

    // default
    if (resultsForAccount.Rows.length > 0) {
        ordersAccount.account = resultsForAccount.Rows[0].Account;
        ordersAccount.provider = resultsForAccount.Rows[0].Provider;
        ordersAccount.name = resultsForAccount.Rows[0].Name;
    }

    // account lookup
    avaiableAccounts = {};
    resultsForAccount.Rows.forEach(function (element) {
        // lookup
        avaiableAccounts[element.Account] = element;
    });

    availableActions = {};
    var resultsForStatus = JSON.parse(results[1].data);
    resultsForStatus.Rows.forEach(function (element) {
        // lookup
        availableActions[BuildActionKey(element.Provider, element.Code)] = element;
    });
}

async function SaveSelectedAccount() {
    var keyValue = {
        key: "CurrentOrdersAccount",
        value: JSON.stringify(ordersAccount)
    }
    var qr = await SaveSettingsPromise(keyValue);
    if (!qr.successful) {
        console.log("Failed to save settings: " + qr.reason);
    }
}

async function LoadSelectedAccount() {
    var key = {
        key: "CurrentOrdersAccount"
    }
    var qr = await RecallSettingsPromise(key);
    if (!qr.successful) {
        console.log("Failed to load settings: " + qr.reason);
        return;
    }
    if (qr.data) {
        ordersAccount = JSON.parse(qr.data);
        // update these based on current values
        ordersAccount.provider = avaiableAccounts[ordersAccount.account].Provider;
        ordersAccount.name = avaiableAccounts[ordersAccount.account].Name;
    }
    // reload the data
    $(accountLookupSelector).selectpicker('val', ordersAccount.account);
}

async function RefreshOrders() {
    try {
        $(spinnerElementSelector).removeClass("d-none");

        // generate IQ statement
        var iqStatement = GenerateTemplate(retrieveOrdersTemplate, ordersAccount);
        var qrIQ = await IqQueryPromise(iqStatement);
        if (!qrIQ.successful) {
            Failed(qrIQ.reason);
            return;
        }
        var ordersData = JSON.parse(qrIQ.data);
        // now lookup symbol name
        var symbolData = { Rows: [], Columns: [] };
        if (ordersData.Rows.length > 0) {
            var iqSymbolsStatement = GenerateTemplate(retrieveSymbolsTemplate, ordersData);
            var qrIQ = await IqQueryPromise(iqSymbolsStatement);
            if (!qrIQ.successful) {
                Failed(qrIQ.reason);
                return;
            }
            symbolData = JSON.parse(qrIQ.data);
        }

        var sanitisedOrdersData = SanitiseOrderData(ordersData, symbolData);

        if (sanitisedOrdersData.Rows.length > 0) {
            var html = GenerateTemplate(renderTemplateId, sanitisedOrdersData);
            document.getElementById(renderElementId).innerHTML = html;
        }
        else {
            var html = GenerateTemplate(renderNoResultsTemplateId, {});
            document.getElementById(renderElementId).innerHTML = html;
        }

        console.log('Refresh Orders');
    } catch (err) {
        console.error(err);
    }
    finally {
        $(spinnerElementSelector).addClass("d-none");
        UpdateRefreshTimestamp();
    }
}

function SanitiseOrderData(orders, symbols) {
    var symbolLookup = {};
    symbols.Rows.forEach(function (element) {
        // build lookup
        symbolLookup[element.SymbolCode.toUpperCase()] = element.Name;
    });

    // keep order lookup
    viewingOrders = {};

    orders.Rows.forEach(function (element) {
        // adjust
        element.Name = symbolLookup[(element.Symbol + '.' + element.Exchange).toUpperCase()]
        element.AccountName = "";
        viewingOrders[element.OrderID] = element;
    });
    // reorder
    //orders.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    return orders;
}

function Failed(reason) {
    console.warn(reason);
}

function BuildActionKey(provider, code) {
    return provider + "$" + code;
}

function SetLabelWithNested(labelSelector, text) {
    $(labelSelector)
        // get all child nodes including text and comment
        .contents()
        // iterate and filter out elements
        .filter(function () {
            // check node is text
            return this.nodeType === 3;
        })
        // replace it with new text
        .replaceWith(text);
}

function SetLabelOfNested(labelSelector, text) {
    $(labelSelector)
        // get all child nodes including text and comment
        .contents()
        // iterate and filter out elements
        .filter(function () {
            // check node is text
            return this.nodeType === 1;
        })
        // replace it with new text
        .text(" " + text);
}

// ** New Order functions *******************************************************************************************************************************************

function newRadioSideChange(radio) {
    switch (radio.value) {
        case "Bid":
            $(newPadBodySelector).addClass("bidPadColour");
            $(newPadBodySelector).removeClass("askPadColour");
            break;
        case "Ask":
            $(newPadBodySelector).addClass("askPadColour");
            $(newPadBodySelector).removeClass("bidPadColour");
            break;
        default:
            $(newPadBodySelector).removeClass("bidPadColour");
            $(newPadBodySelector).removeClass("askPadColour");
            break;
    };
}

function newRadioTypeChange(radio) {
    switch (radio.value) {
        case "Limit":
            $(newPadPriceSelector).removeAttr("disabled");
            break;
        default:
            $(newPadPriceSelector).attr("disabled", true);
            break;
    }
}

function selectInForceChange(select) {
    switch (select.value) {
        case "GoodTillDate":
        case "AllOrNoneTillDate":
            $(newPadExpirySelector).removeAttr("disabled");
            break;
        default:
            $(newPadExpirySelector).attr("disabled", true);
            break;
    }
}

function ShowNewOrderPad() {
    orderEntry = {
        orderId: "",
        account: ordersAccount.account,
        symbolCode: "9946.MYX[Demo]",
        side: "Ask",
        quantity: 0,
        orderType: "Limit",
        price: 0.0,
        timeInForce: "FillAndKill",
        expiryDate: null
    };
    $(newOrderPadModal).modal('show');
    PrepareNewOrderPad(orderEntry);
}

function PrepareNewOrderPad(entry) {
    // reset view
    ClearSearchStockCode();
    ClearNewOrderValidation();
    // apply values
    if (entry.symbolCode)
        LoadSearchSingleStockCode(newOrderPreloadDetails.symbol, newOrderPreloadDetails.symbolName);

    $(newPadAccountSelector).selectpicker('val', entry.account);
    $(newPadSideSelector.supplant(entry)).prop('checked', true);
    newRadioSideChange({ value: entry.side });
    $(newPadSymbolSelector).selectpicker('val', entry.symbolCode);
    $(newPadSymbolSelector).selectpicker('refresh');
    $(newPadQantitySelector).val(entry.quantity);
    $(newPadTypeSelector.supplant(entry)).prop('checked', true);
    newRadioTypeChange({ value: entry.orderType });
    $(newPadPriceSelector).val(entry.price);
    $(newPadTimeInForceSelector).val(entry.timeInForce);
    selectInForceChange({ value: entry.timeInForce });
    $(newPadExpirySelector).val(entry.expiryDate);
}

async function DoSymbolSearch(evnt) {
    var searchTerm = $(evnt.target).val();
    console.log("Search symbols: " + searchTerm);

    var iqNameStatement = GenerateTemplate(iqSearchSymbolNameTemplate, searchTerm);
    var iqCodeStatement = GenerateTemplate(iqSearchSymbolCodeTemplate, searchTerm);

    var results = await Promise.all([IqQueryPromise(iqNameStatement), IqQueryPromise(iqCodeStatement)]);
    if (!results[0].successful) {
        console.error("IQ symbol search by Name: " + results[0].reason);
        return;
    }
    if (!results[1].successful) {
        console.error("IQ symbol search by Code: " + results[1].reason);
        return;
    }

    var resultsForName = JSON.parse(results[0].data);
    resultsForName.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    resultsForName.sectionName = "Match by name";
    var resultsForCode = JSON.parse(results[1].data);
    resultsForCode.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    resultsForCode.sectionName = "Match by code";

    var htmlName = GenerateTemplate(searchSymbolTemplate, resultsForName);
    var htmlCode = GenerateTemplate(searchSymbolTemplate, resultsForCode);
    document.getElementById(newPadSymbolID).innerHTML = htmlCode + htmlName;
    $(newPadSymbolSelector).selectpicker("refresh");
}

function LoadSearchSingleStockCode(symbolCode, symbolName) {
    var data = {
        sectionName: "Match by code",
        Rows: []
    };
    data.Rows.push({
        SymbolCode: symbolCode,
        Name: symbolName
    });
    var htmlCode = GenerateTemplate(searchSymbolTemplate, data);
    document.getElementById(newPadSymbolID).innerHTML = htmlCode;
    $(newPadSymbolSelector).selectpicker("refresh");
}

function ClearSearchStockCode() {
    $(newPadSymbolSelector).selectpicker("val", "");
    document.getElementById(newPadSymbolID).innerHTML = "";
    $(newPadSymbolSelector).selectpicker("refresh");
}

async function PlaceNewOrder() {
    // validate. Some data has been prefilled.
    orderEntry.account = $(newPadAccountSelector).selectpicker("val");
    orderEntry.side = $(newPadSideValueSelector).val();
    orderEntry.symbolCode = $(newPadSymbolSelector).selectpicker('val');
    orderEntry.market = $(newPadMarketsSelector).val();
    orderEntry.quantity = numeral($(newPadQantitySelector).val());
    orderEntry.orderType = $(newPadTypeValueSelector).val();
    orderEntry.price = numeral($(newPadPriceSelector).val());
    orderEntry.timeInForce = $(newPadTimeInForceSelector).val();
    orderEntry.expiryDate = moment($(newPadExpirySelector).val());

    if (!ValidateNewOrder(orderEntry)) return;
    // execute
    NewOrderBusy();
    ShowNewOrderActionMessage("Trying to place order...");

    // place order
    var iqStatement = GenerateTemplate(insertNewOrderTemplate, orderEntry);
    var qrIQ = await IqQueryPromise(iqStatement);
    if (!qrIQ.successful) {
        ShowNewOrderActionError("Failed! " + PrettyIQFailure(qrIQ.reason));
        NewOrderNotBusy();
        return;
    }
    var orderResponse = JSON.parse(qrIQ.data);
    var orderReply = orderResponse.Rows[0];
    console.log("Order request: " + orderReply.Result);
    NewOrderNotBusy();
    switch (orderReply.Result) {
        case "Success":
            // all good, so carry on
            $(newOrderPadModal).modal('hide');
            RefreshOrders();
            return;
        default:
            var errors = orderReply.Errors[0].Code ?? orderReply.Errors[0];
            ShowNewOrderActionError("Submission: " + PrettyIQFailure(orderReply.Result) + " (" + errors + ")");
            break;
    }
}

function ValidateNewOrder(newOrderData) {
    ClearNewOrderValidation();

    var today = moment(new Date().toISOString().slice(0, 10));
    var skipPrice = $(newPadPriceSelector).prop('disabled');
    var skipExpiry = $(newPadExpirySelector).prop('disabled');
    // clear data for disabled controls
    if (skipPrice) newOrderData.price = null;
    if (skipExpiry) newOrderData.expiryDate = null;

    newOrderData.valAccount = (newOrderData.account && newOrderData.account != "");
    newOrderData.valSymbol = (newOrderData.symbolCode && newOrderData.symbolCode != "");
    newOrderData.valMarket = (newOrderData.market && newOrderData.market != "");
    newOrderData.valQuantity = (newOrderData.quantity && newOrderData.quantity.value() > 0);
    newOrderData.valPrice = (skipPrice || (newOrderData.price && newOrderData.price.value() > 0));
    newOrderData.valInForce = (newOrderData.timeInForce && newOrderData.timeInForce != "");
    newOrderData.valExpiry = (skipExpiry || (newOrderData.expiryDate && newOrderData.expiryDate.isSameOrAfter(today)));

    $(newPadAccountValidSelector).addClass(newOrderData.valAccount ? "is-valid" : "is-invalid");
    $(newPadSymbolValidSelector).addClass(newOrderData.valSymbol ? "is-valid" : "is-invalid");
    $(newPadMarketsSelector).addClass(newOrderData.valMarket ? "is-valid" : "is-invalid");
    $(newPadQantitySelector).addClass(newOrderData.valQuantity ? "is-valid" : "is-invalid");
    if (!skipPrice) $(newPadPriceSelector).addClass(newOrderData.valPrice ? "is-valid" : "is-invalid");
    $(newPadTimeInForceSelector).addClass(newOrderData.valInForce ? "is-valid" : "is-invalid");
    if (!skipExpiry) $(newPadExpirySelector).addClass(newOrderData.valExpiry ? "is-valid" : "is-invalid");

    // mapping
    if (newOrderData.valInForce) {
        switch (newOrderData.timeInForce) {
            case "GoodTillCancel":
            case "GoodTillDate":
                newOrderData.timeInForce = "UntilCancel";
                break;
            case "AllOrNoneTillCancel":
            case "AllOrNoneTillDate":
                newOrderData.timeInForce = "AllOrNone";
                break;
        }
    }

    // all fields must be valid
    return newOrderData.valAccount && newOrderData.valSymbol && newOrderData.valQuantity && newOrderData.valPrice && newOrderData.valInForce && newOrderData.valExpiry;
}

function ClearNewOrderValidation() {
    $(newPadAccountValidSelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadSymbolValidSelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadMarketsSelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadQantitySelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadPriceSelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadTimeInForceSelector).removeClass("is-valid").removeClass("is-invalid");
    $(newPadExpirySelector).removeClass("is-valid").removeClass("is-invalid");
}

function ShowNewOrderActionMessage(msg) {
    ClearNewOrderAction();
    $(newPadActionZoneSelector).removeClass("d-none");
    $(newPadActionSelector).text(msg);
}

function ShowNewOrderActionError(msg) {
    ClearNewOrderAction();
    $(newPadErrorZoneSelector).removeClass("d-none");
    $(newPadErrorSelector).text(msg);
}

function ClearNewOrderAction() {
    $(newPadActionZoneSelector).addClass("d-none");
    $(newPadErrorZoneSelector).addClass("d-none");
}

function NewOrderBusy() {
    $(newPadBusy).removeClass("d-none");
    $(newPadCancel).attr("disabled", true);
    $(newPadPlace).attr("disabled", true);
}

function NewOrderNotBusy() {
    $(newPadBusy).addClass("d-none");
    $(newPadCancel).removeAttr("disabled");
    $(newPadPlace).removeAttr("disabled");
}

// ** Amend Order functions *******************************************************************************************************************************************

function ShowAmendOrderPad(orderId) {
    currentAmendOrder = viewingOrders[orderId];
    if (currentAmendOrder) {
        $(amendOrderPadModal).modal('show');
        PrepareAmendOrderPad(currentAmendOrder);
    }
}

function PrepareAmendOrderPad(entry) {
    // reset view
    ClearAmendOrderValidation();
    // apply values
    SetLabelWithNested(amendPadAccountSelector, entry.Account);
    SetLabelOfNested(amendPadAccountSelector, avaiableAccounts[entry.Account].Name);
    $(amendPadSideSelector.supplant(entry)).prop('checked', true);
    amendRadioSideChange({ value: entry.Side });
    SetLabelWithNested(amendPadSymbolSelector, entry.Symbol + "." + entry.Exchange);
    SetLabelOfNested(amendPadSymbolSelector, entry.Name);
    $(amendPadMarketSelector).text(entry.TradingMarket);
    $(amendPadQantitySelector).val(entry.VisibleQuantity);
    $(amendPadTypeSelector.supplant(entry)).prop('checked', true);
    amendRadioTypeChange({ value: entry.Type });
    $(amendPadPriceSelector).val(entry.LimitPrice);
    $(amendPadTimeInForceSelector).text(entry.Validity);
    if (entry.ExpireDate) $(amendPadExpirySelector).text("Expiry: " + moment(entry.ExpireDate).format("DD/MM/YYYY"));
    else $(amendPadExpirySelector).text("Expiry: Never")
}

async function PlaceAmendOrder() {
    // validate. Some data has been prefilled.
    currentAmendOrder.quantity = numeral($(amendPadQantitySelector).val());
    currentAmendOrder.price = numeral($(amendPadPriceSelector).val());

    if (!ValidateAmendOrder(currentAmendOrder)) return;
    // execute
    AmendOrderBusy();
    ShowAmendOrderActionMessage("Trying to amend order...");

    // amend order
    var iqStatement = GenerateTemplate(insertAmendOrderTemplate, currentAmendOrder);
    var qrIQ = await IqQueryPromise(iqStatement);
    if (!qrIQ.successful) {
        ShowAmendOrderActionError("Failed! " + PrettyIQFailure(qrIQ.reason));
        AmendOrderNotBusy();
        return;
    }
    var orderResponse = JSON.parse(qrIQ.data);
    var orderReply = orderResponse.Rows[0];
    console.log("Amend request: " + orderReply.Result);
    AmendOrderNotBusy();
    switch (orderReply.Result) {
        case "Success":
            // all good, so carry on
            $(amendOrderPadModal).modal('hide');
            RefreshOrders();
            return;
        default:
            var errors = orderReply.Errors[0].Code ?? orderReply.Errors[0];
            ShowAmendOrderActionError("Submission: " + PrettyIQFailure(orderReply.Result) + " (" + errors + ")");
            break;
    }
}

function ValidateAmendOrder(amendOrderData) {
    ClearAmendOrderValidation();

    var skipPrice = $(amendPadPriceSelector).prop('disabled');
    // clear data for disabled controls
    if (skipPrice) amendOrderData.price = null;

    amendOrderData.valQuantity = (amendOrderData.quantity && amendOrderData.quantity.value() > 0);
    amendOrderData.valPrice = (skipPrice || (amendOrderData.price && amendOrderData.price.value() > 0));

    $(amendPadQantitySelector).addClass(amendOrderData.valQuantity ? "is-valid" : "is-invalid");
    if (!skipPrice) $(amendPadPriceSelector).addClass(amendOrderData.valPrice ? "is-valid" : "is-invalid");

    // all fields must be valid
    return amendOrderData.valQuantity && amendOrderData.valPrice;
}

function ShowAmendOrderActionMessage(msg) {
    ClearAmendOrderAction();
    $(amendPadActionZoneSelector).removeClass("d-none");
    $(amendPadActionSelector).text(msg);
}

function ShowAmendOrderActionError(msg) {
    ClearAmendOrderAction();
    $(amendPadErrorZoneSelector).removeClass("d-none");
    $(amendPadErrorSelector).text(msg);
}

function ClearAmendOrderAction() {
    $(amendPadActionZoneSelector).addClass("d-none");
    $(amendPadErrorZoneSelector).addClass("d-none");
}

function AmendOrderBusy() {
    $(amendPadBusy).removeClass("d-none");
    $(amendPadCancel).attr("disabled", true);
    $(amendPadPlace).attr("disabled", true);
}

function AmendOrderNotBusy() {
    $(amendPadBusy).addClass("d-none");
    $(amendPadCancel).removeAttr("disabled");
    $(amendPadPlace).removeAttr("disabled");
}

function ClearAmendOrderValidation() {
    $(amendPadQantitySelector).removeClass("is-valid").removeClass("is-invalid");
    $(amendPadPriceSelector).removeClass("is-valid").removeClass("is-invalid");
}

function amendRadioSideChange(radio) {
    switch (radio.value) {
        case "Bid":
            $(amendPadBodySelector).addClass("bidPadColour");
            $(amendPadBodySelector).removeClass("askPadColour");
            break;
        case "Ask":
            $(amendPadBodySelector).addClass("askPadColour");
            $(amendPadBodySelector).removeClass("bidPadColour");
            break;
        default:
            $(amendPadBodySelector).removeClass("bidPadColour");
            $(amendPadBodySelector).removeClass("askPadColour");
            break;
    };
}

function amendRadioTypeChange(radio) {
    switch (radio.value) {
        case "Limit":
            $(amendPadPriceSelector).removeAttr("disabled");
            break;
        default:
            $(amendPadPriceSelector).attr("disabled", true);
            break;
    }
}

// ** Cancel Order functions *******************************************************************************************************************************************

function ShowCancelOrderPad(orderId) {
    currentCancelOrder = viewingOrders[orderId];
    if (currentCancelOrder) {
        $(cancelOrderPadModal).modal('show');
        PrepareCancelOrderPad(currentCancelOrder);
    }
}

function PrepareCancelOrderPad(entry) {
    // apply values
    SetLabelWithNested(cancelPadAccountSelector, entry.Account);
    SetLabelOfNested(cancelPadAccountSelector, avaiableAccounts[entry.Account].Name);
    $(cancelPadSideSelector.supplant(entry)).prop('checked', true);
    cancelRadioSideChange({ value: entry.Side });
    SetLabelWithNested(cancelPadSymbolSelector, entry.Symbol + "." + entry.Exchange);
    SetLabelOfNested(cancelPadSymbolSelector, entry.Name);
    $(cancelPadMarketSelector).text(entry.TradingMarket);
    $(cancelPadQantitySelector).text(numeral(entry.VisibleQuantity).format("0,0"));
    $(cancelPadTypeSelector.supplant(entry)).prop('checked', true);
    cancelRadioTypeChange({ value: entry.Type });
    $(cancelPadPriceSelector).text(numeral(entry.LimitPrice).format("0,0.000"));
    $(cancelPadTimeInForceSelector).text(entry.Validity);
    if (entry.ExpireDate) $(cancelPadExpirySelector).text("Expiry: " + moment(entry.ExpireDate).format("DD/MM/YYYY"));
    else $(cancelPadExpirySelector).text("Expiry: Never")
}

async function PlaceCancelOrder() {
    CancelOrderBusy();
    ShowCancelOrderActionMessage("Trying to cancel order...");

    // amend order
    var iqStatement = GenerateTemplate(insertCancelOrderTemplate, currentCancelOrder);
    var qrIQ = await IqQueryPromise(iqStatement);
    if (!qrIQ.successful) {
        ShowAmendOrderActionError("Failed! " + PrettyIQFailure(qrIQ.reason));
        AmendOrderNotBusy();
        return;
    }
    var orderResponse = JSON.parse(qrIQ.data);
    console.log("Cancel request: " + orderResponse.Rows[0].Result);
    CancelOrderNotBusy();
    switch (orderResponse.Rows[0].Result) {
        case "Success":
            // all good, so carry on
            $(cancelOrderPadModal).modal('hide');
            RefreshOrders();
            return;
        default:
            ShowCancelOrderActionError("Failed! " + PrettyIQFailure(orderResponse.Rows[0].Result));
            break;
    }
}

function ShowCancelOrderActionMessage(msg) {
    ClearCancelOrderAction();
    $(cancelPadActionZoneSelector).removeClass("d-none");
    $(cancelPadActionSelector).text(msg);
}

function ShowCancelOrderActionError(msg) {
    ClearCancelOrderAction();
    $(cancelPadErrorZoneSelector).removeClass("d-none");
    $(cancelPadErrorSelector).text(msg);
}

function ClearCancelOrderAction() {
    $(cancelPadActionZoneSelector).addClass("d-none");
    $(cancelPadErrorZoneSelector).addClass("d-none");
}

function CancelOrderBusy() {
    $(cancelPadBusy).removeClass("d-none");
    $(cancelPadCancel).attr("disabled", true);
    $(cancelPadPlace).attr("disabled", true);
}

function CancelOrderNotBusy() {
    $(cancelPadBusy).addClass("d-none");
    $(cancelPadCancel).removeAttr("disabled");
    $(cancelPadPlace).removeAttr("disabled");
}

function ClearCancelOrderValidation() {
    $(cancelPadQantitySelector).removeClass("is-valid").removeClass("is-invalid");
    $(cancelPadPriceSelector).removeClass("is-valid").removeClass("is-invalid");
}

function cancelRadioSideChange(radio) {
    switch (radio.value) {
        case "Bid":
            $(cancelPadBodySelector).addClass("bidPadColour");
            $(cancelPadBodySelector).removeClass("askPadColour");
            break;
        case "Ask":
            $(cancelPadBodySelector).addClass("askPadColour");
            $(cancelPadBodySelector).removeClass("bidPadColour");
            break;
        default:
            $(cancelPadBodySelector).removeClass("bidPadColour");
            $(cancelPadBodySelector).removeClass("askPadColour");
            break;
    };
}

function cancelRadioTypeChange(radio) {
    switch (radio.value) {
        case "Limit":
            $(cancelPadPriceSelector).removeAttr("disabled");
            break;
        default:
            $(cancelPadPriceSelector).attr("disabled", true);
            break;
    }
}
