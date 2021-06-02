var holdingAccount = { account: "" };

const accountLookupID = "accountSelector";
const accountLookupSelector = "#" + accountLookupID;

const spinnerElementSelector = "#loading-spinner";
const renderElementId = "holdings-table";

const searchAccountStatementTemplate = "holding-accountsearchstatement-template";
const searchAccountTemplate = "holding-searchaccount-template";
const retrieveHoldingsTemplate = "holding-selectstatement-template";
const renderTemplateId = "holding-entry-template";
const renderNoResultsTemplateId = "holding-noresults-template";
const retrieveSymbolsTemplate = "holding-selectsymbolsstatement-template"

$(async function () {
    // Account lookup
    $(accountLookupSelector).selectpicker();
    $(accountLookupSelector).on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        holdingAccount.account = $(e.target).val();
        console.log("Holding account changed: " + previousValue + ' -> ' + holdingAccount.account);
        SaveSelectedAccount()
        RefreshHoldings();
    });

    await LoadStaticData();
    await LoadSelectedAccount();
});

async function LoadStaticData() {
    // generate IQ statement
    var filter = "";
    var iqStatement = GenerateTemplate(searchAccountStatementTemplate, filter);

    var qrIQ = await IqQueryPromise(iqStatement);
    if (!qrIQ.successful) {
        console.error(qrIQ.reason);
        return;
    }
    var results = JSON.parse(qrIQ.data);
    var html = GenerateTemplate(searchAccountTemplate, results);
    document.getElementById(accountLookupID).innerHTML = html;
    $(accountLookupSelector).selectpicker('refresh');

    // default
    if (results.Rows.length > 0) {
        holdingAccount.account = results.Rows[0].Account;
    }
}

async function SaveSelectedAccount() {
    var keyValue = {
        key: "CurrentHoldingAccount",
        value: JSON.stringify(holdingAccount)
    }
    var qr = await SaveSettingsPromise(keyValue);
    if (!qr.successful) {
        console.log("Failed to save settings: " + qr.reason);
    }
}

async function LoadSelectedAccount() {
    var key = {
        key: "CurrentHoldingAccount"
    }
    var qr = await RecallSettingsPromise(key);
    if (!qr.successful) {
        console.log("Failed to load settings: " + qr.reason);
        return;
    }
    if (qr.data) {
        holdingAccount = JSON.parse(qr.data);
    }
    $(accountLookupSelector).selectpicker('val', holdingAccount.account);
}

async function RefreshHoldings() {
    try {
        $(spinnerElementSelector).removeClass("d-none");

        // generate IQ statement
        var iqStatement = GenerateTemplate(retrieveHoldingsTemplate, holdingAccount);
        var qrIQ = await IqQueryPromise(iqStatement);
        if (!qrIQ.successful) {
            Failed(qrIQ.reason);
            return;
        }
        var holdingsData = JSON.parse(qrIQ.data);
        // now lookup symbol name
        var symbolData = { Rows: [], Columns: [] };
        if (holdingsData.Rows.length > 0) {
            var iqSymbolsStatement = GenerateTemplate(retrieveSymbolsTemplate, holdingsData);
            var qrIQ = await IqQueryPromise(iqSymbolsStatement);
            if (!qrIQ.successful) {
                Failed(qrIQ.reason);
                return;
            }
            symbolData = JSON.parse(qrIQ.data);
        }

        var sanitisedHoldingData = SanitiseHoldingData(holdingsData, symbolData);

        if (sanitisedHoldingData.Rows.length > 0) {
            var html = GenerateTemplate(renderTemplateId, sanitisedHoldingData);
            document.getElementById(renderElementId).innerHTML = html;
        }
        else {
            var html = GenerateTemplate(renderNoResultsTemplateId, {});
            document.getElementById(renderElementId).innerHTML = html;
        }

        console.log('Refresh holding');
    } catch (err) {
        console.error(err);
    }
    finally {
        $(spinnerElementSelector).addClass("d-none");
        UpdateRefreshTimestamp();
    }
}

function SanitiseHoldingData(holdings, symbols) {
    var symbolLookup = {};
    symbols.Rows.forEach(function (element) {
        // build lookup
        symbolLookup[element.SymbolCode.toUpperCase()] = element.Name;
    });

    holdings.Rows.forEach(function (element) {
        // adjust
        element.Name = symbolLookup[(element.Code + '.' + element.Exchange).toUpperCase()]
    });
    // reorder
    //holdings.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    return holdings;
}

function Failed(reason) {
    console.warn(reason);
}

