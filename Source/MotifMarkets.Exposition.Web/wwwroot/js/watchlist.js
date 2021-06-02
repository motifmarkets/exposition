// Symbols normalised to UpperCase  !!! Check this !!! Load is CAP but save is LOWER
var watchlistSymbols = { symbols: [] };

const symbolLookupID = "symbolSelector";
const symbolLookupSelector = "#" + symbolLookupID;

const searchSymbolTemplate = "watchlist-searchsymbol-template";
const iqSearchSymbolNameTemplate = "watchlist-symbolnamesearchstatement-template";
const iqSearchSymbolCodeTemplate = "watchlist-symbolcodesearchstatement-template";

const renderNoResultsTemplateId = "watchlist-noresults-template";

var dragEnabled = false;
var deleteEnabled = false;

$(async function () {
    // Symbol lookup
    $(symbolLookupSelector).selectpicker();

    $("#addSymbolModal").on("show.bs.modal", function () {
        if (deleteEnabled) ToggleDelete();
        if (dragEnabled) ToggleDraggable();

        $("#addSymbolModal .bs-searchbox input").keydown(Debounce(function (evnt) {
            DoSymbolSearch(evnt, searchSymbolTemplate, symbolLookupID, iqSearchSymbolNameTemplate, iqSearchSymbolCodeTemplate);
        }, 500));
        ClearSearch();
        $(symbolLookupSelector).focus();
        $(symbolLookupSelector).selectpicker("toggle");
    });
    $("#addSymbolModal").on("hide.bs.modal", function (e) {
        // Unlink Symbol lookup keystroke management
        $("#addSymbolModal .bs-searchbox input").off("keydown");
    });

    await LoadCurrentSymbols();
    await RefreshWatchlist();
});

async function RefreshWatchlist() {
    await WatchlistRefresh("watchlist-entry-template", "watchlist-table", "watchlist-selectstatement-template", "#loading-spinner");
}

async function WatchlistRefresh(renderTemplateId, renderElementId, selectTemplateId, spinnerElementId) {
    try {
        $(spinnerElementId).removeClass("d-none");

        var watchlistData = { Rows: [], Columns: [] };

        // generate IQ statement
        if (watchlistSymbols.symbols.length > 0) {
            var iqStatement = GenerateTemplate(selectTemplateId, watchlistSymbols);

            var qrIQ = await IqQueryPromise(iqStatement);
            if (!qrIQ.successful) {
                Failed(qrIQ.reason);
                return;
            }
            watchlistData = JSON.parse(qrIQ.data);
        }

        var sanitisedData = SanitiseWatchlistData(watchlistData)
        DisplayPriceData(renderTemplateId, renderElementId, sanitisedData);

        if (dragEnabled) RenderDraggable();
        RenderDelete();

    } catch (err) {
        console.error(err);
    }
    finally {
        $(spinnerElementId).addClass("d-none");
        UpdateRefreshTimestamp();
    }
}

function ToggleDraggable() {
    if (deleteEnabled) ToggleDelete();
    dragEnabled = !dragEnabled;
    RenderDraggable();
}

function RenderDraggable() {
    if (dragEnabled) {
        $(".draggable").sortable({
            opacity: 0.5,
            delay: 150,
            revert: 150,
            stop: MoveComplete,
            items: "> li"
        });
        $(".toggle-drag").addClass("text-warning").removeClass("text-dark");
    }
    else {
        $(".draggable").sortable("destroy");
        $(".toggle-drag").addClass("text-dark").removeClass("text-warning");
    }
}

function ToggleDelete() {
    if (dragEnabled) ToggleDraggable();
    deleteEnabled = !deleteEnabled;
    RenderDelete();
}

function RenderDelete() {
    if (deleteEnabled) {
        $(".toggle-delete").addClass("text-danger").removeClass("text-dark");
        $(".hideToDelete").addClass("d-none");
        $(".showToDelete").removeClass("d-none");
    }
    else {
        $(".toggle-delete").addClass("text-dark").removeClass("text-danger");
        $(".hideToDelete").removeClass("d-none");
        $(".showToDelete").addClass("d-none");
    }
}
function SanitiseWatchlistData(watchlist) {
    watchlist.Rows.forEach(function (element) {
        var idx = watchlistSymbols.symbols.findIndex(item => element.SymbolCode.toLowerCase() === item.toLowerCase());
        element.sortKey = idx;
    });
    watchlist.Rows.sort(function (a, b) { return a.sortKey - b.sortKey });
    return watchlist;
}

function DisplayPriceData(templateId, renderElementId, data) {
    if (data.Rows.length > 0) {
        var html = GenerateTemplate(templateId, data);
        document.getElementById(renderElementId).innerHTML = html;
    }
    else {
        var html = GenerateTemplate(renderNoResultsTemplateId, {});
        document.getElementById(renderElementId).innerHTML = html;
    }
}

function Failed(reason) {
    console.warn(reason);
}

async function MoveComplete(event, ui) {
    watchlistSymbols.symbols = $(".draggable").sortable("toArray", { attribute: "data-symbolcode" });
    await SaveCurrentSymbols();
}

async function AddSymbol() {
    var symbol = $(symbolLookupSelector).selectpicker('val');
    if (symbol == '') return;
    if (watchlistSymbols.symbols.indexOf(symbol) == -1) {
        watchlistSymbols.symbols[watchlistSymbols.symbols.length] = symbol;
        await SaveCurrentSymbols();
    }
    await RefreshWatchlist();
}

async function DeleteSymbol(symbol) {
    if (symbol == '') return;
    var idx = watchlistSymbols.symbols.indexOf(symbol);
    if (idx != -1) {
        watchlistSymbols.symbols.splice(idx, 1);
        await SaveCurrentSymbols();
        await RefreshWatchlist();
    }
}

async function SaveCurrentSymbols() {
    var keyValue = {
        key: "WatchlistSymbols",
        value: JSON.stringify(watchlistSymbols.symbols)
    }
    var qr = await SaveSettingsPromise(keyValue);
    if (!qr.successful) {
        console.log("Failed to save settings: " + qr.reason);
    }
}

async function LoadCurrentSymbols() {
    var key = {
        key: "WatchlistSymbols"
    }
    var qr = await RecallSettingsPromise(key);
    if (!qr.successful) {
        console.log("Failed to load settings: " + qr.reason);
        return;
    }

    watchlistSymbols.symbols = [];
    if (qr.data != "") {
        watchlistSymbols.symbols = JSON.parse(qr.data);
    }
    // remove any blank entries
    for (var i = watchlistSymbols.symbols.length - 1; i >= 0; i--)
        if (watchlistSymbols.symbols[i] == "")
            watchlistSymbols.symbols.splice(i, 1);
}

async function DoSymbolSearch(evnt, renderTemplateId, renderElementId, selectNameTemplateId, selectCodeTemplateId) {
    var searchTerm = $(evnt.target).val();
    console.log("Search symbols: " + searchTerm);

    var iqNameStatement = GenerateTemplate(selectNameTemplateId, searchTerm);
    var iqCodeStatement = GenerateTemplate(selectCodeTemplateId, searchTerm);

    var results = await Promise.all([IqQueryPromise(iqNameStatement), IqQueryPromise(iqCodeStatement)]);
    if (!results[0].successful) {
        console.error('IQ symbol search by Name: ' + results[0].reason);
        return;
    }
    if (!results[1].successful) {
        console.error('IQ symbol search by Code: ' + results[1].reason);
        return;
    }

    var resultsForName = JSON.parse(results[0].data);
    resultsForName.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    resultsForName.sectionName = "Match by name";
    var resultsForCode = JSON.parse(results[1].data);
    resultsForCode.Rows.sort(function (a, b) { return a.SymbolCode.localeCompare(b.SymbolCode); });
    resultsForCode.sectionName = "Match by code";

    var htmlName = GenerateTemplate(renderTemplateId, resultsForName);
    var htmlCode = GenerateTemplate(renderTemplateId, resultsForCode);
    document.getElementById(renderElementId).innerHTML = htmlCode + htmlName;
    $(symbolLookupSelector).selectpicker('refresh');
}

async function ClearSearch() {
    $(symbolLookupSelector).selectpicker('val', '');
    document.getElementById(symbolLookupID).innerHTML = "";
    $(symbolLookupSelector).selectpicker("refresh");
}