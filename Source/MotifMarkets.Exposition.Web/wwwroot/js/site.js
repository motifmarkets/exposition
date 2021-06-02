// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your Javascript code.
//$(document).ready(function () {
//});

// Globals
var UserId = "";
var IqUrl = "";

function PageInit(userId, iqEndpoint) {
    UserId = userId;
    IqUrl = iqEndpoint;

    numeral.defaultFormat("0,0.000");
    numeral.nullFormat("-.---");

    Handlebars.registerHelper('asCurrency', function (value1, value2, value3) {
        value = value1;
        if (!value) value = value2;
        if (!value) value = value3;
        return numeral(value).format()
    });
    Handlebars.registerHelper('asNumeric', function (value) {
        return numeral(value).format("0.000");
    });
    Handlebars.registerHelper('asInteger', function (value) {
        return numeral(value).format("0");
    });
    Handlebars.registerHelper('asDate', function (value) {
        return moment(value).format("YYYY-MM-DD");
    });
    Handlebars.registerHelper('upOrDown', function (value) {
        switch (value) {
            case 'Up': return 'trend-up';
            case 'Down': return 'trend-down';
            default: return '';
        };
    });
    Handlebars.registerHelper('maxLength', function (value, len) {
        if (value.length > len) return value.substr(0, len) + "...";
        return value;
    });
    Handlebars.registerHelper('prettyMarket', function (marketCode) {
        return marketCode;
    });
    Handlebars.registerHelper('defaultMarket', function (marketCode) {
        var conditions = [":NM", ":OD", ":BI"];
        if (conditions.some(el => marketCode.includes(el))) return "selected";
        return "";
    });
}

function UpdateRefreshTimestamp() {
    $('.expo-update-time').text('Last refresh: ' + moment().format('DD/MM/YYYY, h:mm:ss a')); 
}

// Handlebar
function GenerateTemplate(templateId, data) {
    var templateMarkup = document.getElementById(templateId).innerHTML;
    var templateBuilder = Handlebars.compile(templateMarkup);
    var merged = templateBuilder(data);
    return merged;
}

// Service calls
async function IqQueryPromise(iqStatement) {
    var endpoint = document.location.origin + '/site/ExecuteIQ';
    var payload = { statement: iqStatement.trim() };
    const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(payload)
    });
    return response.json();
}

async function RecallSettingsPromise(key) {
    var endpoint = document.location.origin + '/site/GetSetting';
    const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(key)
    });
    return response.json();
};

async function SaveSettingsPromise(keyValue) {
    var endpoint = document.location.origin + '/site/SaveSetting';
    const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(keyValue)
    });
    return response.json();
};

// Let's no overload the server...wait for an idle time
function Debounce(fn, delay) {
    var debounceTimer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn.apply(context, args), delay);
    };
}

// Crockford's supplant method (poor man's templating)
if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

// So we can POST from script
// Thanks: https://stackoverflow.com/a/3259946
function PostToUrl(path, params, method) {
    method = method || "post";

    var form = document.createElement("form");

    //Move the submit function to another variable
    //so that it doesn't get overwritten.
    form._submit_function_ = form.submit;

    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);

        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form._submit_function_(); //Call the renamed function.
}

// specific POST for New Order
function StartNewOrder(side, symbol, symbolName, account) {
    var antiforgeryToken = $('input[name="__RequestVerificationToken"]').val();
    // NewOrderModel structure + AntiForgery
    var params = {
        __RequestVerificationToken: antiforgeryToken,
        Side: side,
        Symbol: symbol,
        SymbolName: symbolName
    };
    // account may not be supplied
    if (account) params.Account = account;
    PostToUrl('/Orders', params, 'post');
}

// general sainitising
function PrettyIQFailure(text) {
    text = text.replace("Exception Error: ", "");
    text = text.replace("Comamnd failed: ", "");
    return text;
}

/* Debugging only */
function Wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}