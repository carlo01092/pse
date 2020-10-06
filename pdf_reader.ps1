#$PSVersionTable.PSVersion.ToString() = 5.1.17134.858

function __LINE__ {
    $MyInvocation.ScriptLineNumber
}

function message {
    Write-Host "$($args[1])  --  $(if($args[0]){"PASSED"}else{"FAILED"}) (counter: $($args[2]), line: $($args[3]))" `
        -ForegroundColor $(if(-$args[0]){"White"}else{"Yellow"})
}

function is_valid_double {
    return [System.Double]::TryParse(
        $args[0],
        [System.Globalization.NumberStyles]::AllowThousands -bor
        [System.Globalization.NumberStyles]::AllowDecimalPoint -bor
        [System.Globalization.NumberStyles]::AllowParentheses,
        $null,
        $args[1]
    )
}

Add-Type -path "itextsharp.dll"
$file = "$PWD\stockQuotes_10022020.pdf"
$pdf = New-Object iTextSharp.text.pdf.pdfreader -ArgumentList "$file"
$number_of_pages = $pdf.NumberOfPages

$page = 1
$t = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, $page)
$reader = New-Object -TypeName System.IO.StringReader -ArgumentList $t

$assert_stock = Get-Content -Path .\stock.txt
#region header
$assert_header =
    "The Philippine Stock Exchange, Inc",
    "Daily Quotations Report", 
    "MAIN BOARD",
    "Net Foreign",
    "Buying/(Selling),",
    "Name Symbol Bid Ask Open High Low Close Volume Value, Php Php",
    "Bid Ask Open High Low Close Buying/(Selling),",
    "Name Symbol USD USD USD USD USD USD Volume Value, USD USD"
#endregion header
#region sector
$assert_sector = @{
    "FIN" = "FINANCIALS";
    "IND" = "INDUSTRIAL";
    "HDG" = "HOLDING FIRMS";
    "PRO" = "PROPERTY";
    "SVC" = "SERVICES";
    "M-O" = "MINING & OIL";
    "SME" = "SME";
    "ETF" = "ETF";
}
#endregion sector
#region sector_summary
$assert_sector_summary = @{
    "PSEI" = "PSEi";
    "ALL" = "All Shares";
}
#endregion sector_summary
#region other_sector
$assert_other_sector =
    "PREFERRED",
    "PHIL. DEPOSITARY RECEIPTS",
    "PHIL. DEPOSIT RECEIPTS",
    "WARRANTS",
    "SMALL, MEDIUM & EMERGING",
    "EXCHANGE TRADED FUNDS",
    "DOLLAR DENOMINATED SECURITIES",
    "DDS"
#endregion other_sector
#region subsector
$assert_subsector =
    "BANKS",
    "OTHER FINANCIAL INSTITUTIONS",
    "ELECTRICITY, ENERGY, POWER & WATER",
    "FOOD, BEVERAGE & TOBACCO",
    "CONSTRUCTION, INFRASTRUCTURE & ALLIED SERVICES",
    "CHEMICALS",
    "ELECTRICAL COMPONENTS & EQUIPMENT",
    "OTHER INDUSTRIALS",
    "HOLDING FIRMS",
    "PROPERTY",
    "MEDIA",
    "TELECOMMUNICATIONS",
    "INFORMATION TECHNOLOGY",
    "TRANSPORTATION SERVICES",
    "HOTEL & LEISURE",
    "EDUCATION",
    "CASINOS & GAMING",
    "RETAIL",
    "OTHER SERVICES",
    "MINING",
    "OIL"
#endregion subsector
#region footer
$assert_footer =
    "TOTAL MAIN BOARD VOLUME :",
    "Note:",
    "NO. OF",
    "ODDLOT",
    "BLOCK SALE"
#endregion footer

$counter = 1
$ohlcvvf_collection = @()
$line = $reader.ReadLine()
[ref]$parsed_date = Get-Date
$content_unixtime = 0

$header_block_sale_php = "SECURITY PRICE, Php VOLUME VALUE, Php"
$header_block_sale_usd = "SECURITY PRICE, USD VOLUME VALUE, USD"
$is_block_sale_php = $false
$is_block_sale_usd = $false

$header_sectoral_summary = "SECTORAL SUMMARY"
$header_sectoral_fields = "OPEN HIGH LOW CLOSE %CHANGE PT.CHANGE VOLUME VALUE, Php"
$is_sectoral_summary = $false

$PSEI = "PSEI"
$grand_total = "GRAND TOTAL"
$foreign = "FOREIGN"
$net = "NET"

while ($line -ne $null) {
    $line = $line.Trim()
    $words = $line.Split() | ? { -not [System.String]::IsNullOrWhiteSpace($_) }

    $has_stock_symbol = if ($words -ne $null){($words[-10] -in $assert_stock)}else{$false}
    $is_stock_line = $words.Length -ge 11 -and $has_stock_symbol

    $is_valid_date = [DateTime]::TryParseExact(
        $line,
        "MMMM dd , yyyy",
        $null,
        [System.Globalization.DateTimeStyles]::None,
        $parsed_date
    )

    if ($is_valid_date) {
        message $true $line $counter $(__LINE__)
        $content_unixtime = [System.DateTimeOffset]::new($parsed_date.Value.ToLocalTime()).ToUnixTimeSeconds()
    } elseif (
        !$is_stock_line -and
        !$is_sectoral_summary -and (
            ($line -in $assert_header) -or
            ($null -ne ($assert_sector.Values | ? { ($_ -replace "\s+", "") -match [Regex]::Escape(($line -replace "\s+", "")) })) -or
            ($null -ne ($assert_subsector | ? { $line -match $_ })) -or
            ($null -ne ($assert_other_sector | ? { ($_ -replace "\s+", "") -match [Regex]::Escape(($line -replace "\s+", "")) }))
        )
    ) {
        message $true $line $counter $(__LINE__)
    } elseif ($is_stock_line -and !$is_sectoral_summary) {
        [ref]$parsed_value = 0
        $ohlcvvf = @{}

        for ($i = -1; $i -ge -$words.Length; $i--) {
            $is_valid_value = is_valid_double $words[$i] $parsed_value

            if ($i -in -9..-1) {
                if ($is_valid_value -and ($i -in -7..-1)) {
                    $ohlcvvf.(@("O", "H", "L", "C", "V", "Val", "NF")[$i]) = $parsed_value.Value
                } elseif (($i -eq -1) -and ($words[$i] -eq "-")) {
                    $ohlcvvf.NF = 0
                } elseif (($i -eq -2) -and ($words[$i] -eq "-")) {
                    message $true $line $counter $(__LINE__)
                    break    
                } elseif (
                    ($null -ne ($assert_other_sector | ? { $line -match "^$_ TOTAL VOLUME :" })) -or
                    ($null -ne ($assert_footer | ? { $line -match "^$_" }))
                ) {
                    if ($is_block_sale_usd -eq $true) {
                        $is_block_sale_usd = $false
                    }

                    message $true $line $counter $(__LINE__)
                    break
                    
                }
            } elseif (($i -eq -10) -and ($words[$i] -in $assert_stock)) {
                $ohlcvvf.S = $words[$i]
            } elseif ($i -lt -10) {
                $ohlcvvf_collection += , $ohlcvvf
                message $true $line $counter $(__LINE__)
                break
            } else {
                message $false $line $counter $(__LINE__)
                return
            }
        }
    } elseif ( ($line -replace "\s+", "") -eq ($header_sectoral_summary -replace "\s+", "") ) {
        $is_sectoral_summary = $true
        message $true $line $counter $(__LINE__)
    } elseif ($is_sectoral_summary) {
        if (($line -replace "\s+", "") -match [Regex]::Escape(($foreign -replace "\s+", ""))) {
            $at_end = ($line -replace "\s+", "") -match [Regex]::Escape(($net -replace "\s+", ""))

            if ($at_end) {
                [ref]$parsed_value = 0
                $parsed_value = if(is_valid_double $words[-1] $parsed_value){$parsed_value.Value}else{0}

                ($ohlcvvf_collection | ? { $_.S -eq $PSEI }).NF = $parsed_value.Value
            }

            message $true $line $counter $(__LINE__)

            if ($at_end) {
                return
            }
        } elseif ($null -ne ($assert_sector.Values | ? { ($line -replace "\s+", "") -match [Regex]::Escape(($_ -replace "\s+", "")) })) {
            if ($words.Length -ge 9) {
                [ref]$parsed_value = 0
                $sector_name = [System.String]::Join(" ", $words[(-$words.Length)..-9])

                $ohlcvvf_collection += , @{
                    "N" = $sector_name;
                    "S" = $assert_sector.Keys | ? { ($sector_name -replace "\s+", "") -match [Regex]::Escape(($assert_sector["$_"] -replace "\s+", "")) };
                    "O" = if(is_valid_double $words[-8] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "H" = if(is_valid_double $words[-7] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "L" = if(is_valid_double $words[-6] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "C" = if(is_valid_double $words[-5] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "V" = if(is_valid_double $words[-2] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "Val" = if(is_valid_double $words[-1] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                    "NF" = 0; #MISSING: net foreign of every sectors
                }
            }

            message $true $line $counter $(__LINE__)
        } elseif ($null -ne ($assert_sector_summary.Values | ? { ($line -replace "\s+", "") -match [Regex]::Escape(($_ -replace "\s+", "")) })) {
            [ref]$parsed_value = 0
            $sector_name = [System.String]::Join(" ", $words[(-$words.Length)..-7])
            $sector_symbol = $assert_sector_summary.Keys | ? { 
                ($sector_name -replace "\s+", "") -match [Regex]::Escape(($assert_sector_summary["$_"] -replace "\s+", ""))
            }

            $ohlcvvf_collection += , @{
                "N" = $sector_name;
                "S" = $sector_symbol;
                "O" = if(is_valid_double $words[-6] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                "H" = if(is_valid_double $words[-5] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                "L" = if(is_valid_double $words[-4] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                "C" = if(is_valid_double $words[-3] $parsed_value){$parsed_value.Value; $parsed_value = 0}else{0};
                "V" = 0;
                "Val" = 0;
                "NF" = 0;
            }

            message $true $line $counter $(__LINE__)
        } elseif (($line -replace "\s+", "") -match [Regex]::Escape(($grand_total -replace "\s+", ""))) {
            [ref]$parsed_value = 0
            $parsed_value = if(is_valid_double $words[-1] $parsed_value){$parsed_value.Value}else{0}

            ($ohlcvvf_collection | ? { $_.S -eq $PSEI }).V = $parsed_value.Value
            ($ohlcvvf_collection | ? { $_.S -eq $PSEI }).Val = $parsed_value.Value

            message $true $line $counter $(__LINE__)
        } elseif ($line -eq $header_sectoral_fields) {
            message $true $line $counter $(__LINE__)
        } else {
            message $false $line $counter $(__LINE__)
            return
        }
    } elseif (
        ($null -ne ($assert_sector.Values | ? { $line -match "^$_ SECTOR TOTAL VOLUME :" })) -or
        ($null -ne ($assert_other_sector | ? { $line -match "^$_ TOTAL VOLUME :" })) -or
        ($null -ne ($assert_footer | ? { $line -match "^$_" }))
    ) {
        message $true $line $counter $(__LINE__)
    } elseif (
        $line -eq $header_block_sale_php -and
        $is_block_sale_php -eq $false
    ) {
        $is_block_sale_php = $true
        message $true $line $counter $(__LINE__)
    } elseif (
        $line -eq $header_block_sale_usd -and
        $is_block_sale_usd -eq $false
    ) {
        $is_block_sale_usd = $true
        $is_block_sale_php = $false
        message $true $line $counter $(__LINE__)
    } elseif (
        (
            $is_block_sale_php -eq $true -or
            $is_block_sale_usd -eq $true
        ) -and
        $line.Split()[0] -in $assert_stock
    ) {
        message $true $line $counter $(__LINE__)
    } else {
        message $false $line $counter $(__LINE__)
        return
    }

    $line = $reader.ReadLine()
    ++$counter
    
    if ($line -eq $null -and $page -lt $number_of_pages) {
        ++$page
        $t = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, $page)
        $reader = New-Object -TypeName System.IO.StringReader -ArgumentList $t
        $line = $reader.ReadLine()
    }
}

$reader.Close()
$pdf.Close()
