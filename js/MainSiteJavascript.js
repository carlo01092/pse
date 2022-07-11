//__lt6__
//part 1
var _lt6_jD1 = [], _lt6_jD2 = [];

function _lt6_gqp(u, p) {
    var r = u.match("[?&]" + p + "=([^&]+).*$");
    return r === null ? "" : decodeURIComponent(r[1].replace(/\+/g, " "));
}

$(document).ajaxSuccess(function(e, x, s) {
    if (/^https:\/\/webapi\.investagrams\.com\/InvestaApi\/TradingViewChart\/history\?/.test(s.url)) {
        let sy = _lt6_gqp(s.url, "symbol").split(':')[1];
        let ne = (x.responseJSON.s === "ok" && x.responseJSON.t.length > 0);

        if (_lt6_jD1.hasOwnProperty(sy) && ne && !_lt6_jD1[sy].includes(x.responseText)) {
            _lt6_jD1[sy].push(x.responseText);
        } else if (!_lt6_jD1.hasOwnProperty(sy) && ne) {
            _lt6_jD1[sy] = [x.responseText];
            _lt6_jD2[sy] = [];
        }
    } else if (/^https:\/\/webapi\.investagrams\.com\/InvestaApi\/TradingViewChart\/timescale_marks\?/.test(s.url)) {
        let sy = _lt6_gqp(s.url, "symbol").split(':')[1], j = _lt6_jD2[sy].map(j => JSON.stringify(j));

        for (let i = 0; i < _lt6_jD1[sy].length; ++i) {
            if (typeof _lt6_jD1[sy][i] === "string" && !j.includes(_lt6_jD1[sy][i])) {
                _lt6_jD2[sy].push(JSON.parse(_lt6_jD1[sy][i]));
            }
        }
    }
});

//part 2
_lt6_jD1 = [], _lt6_jD2 = [];

//part 2.1 tradingview context
let _lt6_activeStockSymbol=["2GO","AB","ABA","ABG","ABS","ABSP","AC","ACE","ACEN","ACEX","ACR","AEV","AGI","ALCO","ALHI","ALI","ALLHC","ANI","ANS","AP","APC","APL","APO","APVI","APX","ARA","AREIT","AT","ATI","ATN","ATNB","AUB","AXLM","BC","BCB","BCOR","BDO","BEL","BH","BHI","BKR","BLOOM","BMM","BPI","BRN","BSC","C","CA","CAB","CAT","CDC","CEB","CEI","CEU","CHI","CHIB","CHP","CIC","CIP","CLI","CNPF","CNVRG","COAL","COL","COSCO","CPG","CPM","CROWN","CSB","CYBR","DAVIN","DD","DELM","DFNN","DITO","DIZ","DMC","DMW","DNL","DWC","EAGLE","ECP","EEI","ELI","EMP","EURO","EVER","EW","FAF","FB","FDC","FERRO","FEU","FFI","FGEN","FJP","FJPB","FLI","FMETF","FNI","FOOD","FPH","FPI","FRUIT","GEO","GERI","GLO","GMA7","GMAP","GPH","GREEN","GSMI","GTCAP","HI","HLCM","HOME","HOUSE","HVN","I","ICT","IDC","IMI","IMP","ION","IPM","IPO","IRC","IS","JAS","JFC","JGS","JOH","KEP","KPH","KPHB","KPPI","LAND","LBC","LC","LCB","LFM","LMG","LODE","LOTO","LPZ","LR","LRW","LSC","LTG","MA","MAB","MAC","MACAY","MAH","MAHB","MARC","MAXS","MB","MBC","MBT","MED","MEG","MER","MFC","MFIN","MG","MHC","MJC","MJIC","MM","MPI","MRC","MRSGI","MVC","MWC","MWIDE","NI","NIKL","NOW","NRCP","OM","OPM","OPMB","ORE","OV","PA","PAL","PAX","PBB","PBC","PCOR","PERC","PGOLD","PHA","PHES","PHN","PHR","PIZZA","PLC","PMPC","PNB","PNX","PPC","PRC","PRIM","PRMX","PSB","PSE","PTC","PX","PXP","RCB","RCI","REG","RFM","RLC","RLT","ROCK","ROX","RRHI","SBS","SCC","SECB","SEVN","SFI","SGI","SGP","SHLPH","SHNG","SLF","SLI","SM","SMC","SMPH","SOC","SPC","SPM","SSI","SSP","STI","STR","SUN","T","TBGI","TECH","TEL","TFC","TFHI","TUGS","UBP","UPM","URC","V","VITA","VLL","VMC","VUL","VVT","WEB","WIN","WLCON","WPI","ZHI"];

async function _lt6_() {
    for (const ss of _lt6_activeStockSymbol) {
        $("#header-toolbar-symbol-search .input-3lfOzLDc").val("PSE:" + ss).focus().trigger({type: 'keypress', which: 13, keyCode: 13});
        await new Promise(r => setTimeout(r, 10000));
    }
}

_lt6_();

//part 3
function _lt6_dl(d, f, t = "application/json") {
    let fb = new Blob([d], {type: t});
    var a = document.createElement("a"), u = URL.createObjectURL(fb);
    a.href = u;
    a.download = f;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(u);
    }, 0);
}

let _lt6_startTime = 1615766400; //March 15, 2021 12:00:00 AM

async function _lt62_() {
    for (let s in _lt6_jD2) {
        let j = {"t": [], "o": [], "h": [], "l": [], "c": [], "v": []};

        for (let i = _lt6_jD2[s].length-1; i >= 0; --i) {
            let fi = j["t"].findIndex((t) => t === _lt6_jD2[s][i]["t"][0]);

            if (fi > -1) {
                j["t"] = j["t"].slice(0, fi);
                j["o"] = j["o"].slice(0, fi);
                j["h"] = j["h"].slice(0, fi);
                j["l"] = j["l"].slice(0, fi);
                j["c"] = j["c"].slice(0, fi);
                j["v"] = j["v"].slice(0, fi);
            }

            j["t"] = j["t"].concat(_lt6_jD2[s][i]["t"]);
            j["o"] = j["o"].concat(_lt6_jD2[s][i]["o"]);
            j["h"] = j["h"].concat(_lt6_jD2[s][i]["h"]);
            j["l"] = j["l"].concat(_lt6_jD2[s][i]["l"]);
            j["c"] = j["c"].concat(_lt6_jD2[s][i]["c"]);
            j["v"] = j["v"].concat(_lt6_jD2[s][i]["v"]);
        }

        let fit = j["t"].findIndex((t) => t >= _lt6_startTime);

        if (fit > -1) {
            j["t"] = j["t"].slice(fit);
            j["o"] = j["o"].slice(fit);
            j["h"] = j["h"].slice(fit);
            j["l"] = j["l"].slice(fit);
            j["c"] = j["c"].slice(fit);
            j["v"] = j["v"].slice(fit);

            _lt6_dl(JSON.stringify(j), s + ".json");
            await new Promise(r => setTimeout(r, 3000));
        } else {
            console.errorCopy(s + " t not found");
        }
    }
}

_lt62_();
