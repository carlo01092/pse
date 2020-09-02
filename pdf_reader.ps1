function __LINE__ {
    $MyInvocation.ScriptLineNumber
}

Add-Type -path "itextsharp.dll"
$file = "$PWD\pdf\stockQuotes_08282020.pdf"
$pdf = New-Object iTextSharp.text.pdf.pdfreader -ArgumentList "$file"
#$pdf.NumberOfPages
$t = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, 1)
$reader = New-Object -TypeName System.IO.StringReader -ArgumentList $t

$assert_stock = Get-Content -Path .\stock.txt
$assert_header =
    "The Philippine Stock Exchange, Inc",
    "Daily Quotations Report", 
    "MAIN BOARD",
    "Net Foreign",
    "Buying/(Selling),",
    "Name Symbol Bid Ask Open High Low Close Volume Value, Php Php",
    "Bid Ask Open High Low Close Buying/(Selling),",
    "Name Symbol USD USD USD USD USD USD Volume Value, USD USD",
    "SECURITY PRICE, Php VOLUME VALUE, Php",
    "SECURITY PRICE, USD VOLUME VALUE, USD",
    "Note: Oddlot and Block Sale include DDS transactions converted to Philippine peso based on previous day exchange rate.",
    "OPEN HIGH LOW CLOSE %CHANGE PT.CHANGE VOLUME VALUE, Php"
$assert_sector =
    "FINANCIALS",
    "INDUSTRIAL",
    "HOLDING FIRMS",
    "PROPERTY",
    "SERVICES",
    "MINING & OIL",
    "PREFERRED",
    "PHIL. DEPOSITARY RECEIPTS",
    "WARRANTS",
    "SMALL,  MEDIUM & EMERGING",
    "EXCHANGE TRADED FUNDS",
    "DOLLAR DENOMINATED SECURITIES",
    "SECTORAL SUMMARY"
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

$counter = 1
$ohlcvvf_collection = @() #convert to key-value pairs(?)
$line = $reader.ReadLine()
[ref]$parsed_date = Get-Date
$content_unixtime = 0

:content
while( ($line -ne $null)  )
{
   $line = $line.Trim()

    if (
        ($line -in $assert_header) -or
        ((($line -replace "\b\s\b+", "") -replace "\b\s+\b", " ") -in $assert_sector)
    ) {
        "$line [YES ($counter)]"
    } else {
        $is_valid_date = [DateTime]::TryParseExact(
            $line,
            "MMMM dd , yyyy",
            $null,
            [System.Globalization.DateTimeStyles]::None,
            $parsed_date
        )

        if ($is_valid_date) {
            "$line [YES ($counter)][$(__LINE__)]"
            $content_unixtime = [System.DateTimeOffset]::new($parsed_date.Value.ToLocalTime()).ToUnixTimeSeconds()
           
        } else {
            foreach ($_ in $assert_subsector) {
                if ($line -match $_) {
                    "$line [YES ($counter)][$(__LINE__)]"
                    $line = $reader.ReadLine()
                    ++$counter
                    continue content
                }
            }

            $words = $line.Split()
            if ($words.Length -ge 10) {
                [ref]$parsed_value = 0
                $ohlcvvf = @()
                for ($i = -1; $i -ge -$words.Length; $i--) {
                    $is_valid_value = [System.Double]::TryParse(
                        $words[$i],
                        [System.Globalization.NumberStyles]::AllowThousands -bor
                        [System.Globalization.NumberStyles]::AllowDecimalPoint -bor
                        [System.Globalization.NumberStyles]::AllowParentheses,
                        $null,
                        $parsed_value
                    )

                    if (($is_valid_value) -and ($i -in -9..-1)) {
                        if (($i -in -7..-1)) {
                            $ohlcvvf += $parsed_value.Value
                        }
                    } elseif (
                        ($i -eq -10) -and
                        [bool](Select-String -InputObject $assert_stock -Pattern "\b$($words[$i])\b")
                    ) {
                        $ohlcvvf += $words[$i]
                    } elseif ($i -lt -10) {
                        [Array]::Reverse($ohlcvvf)
                        $ohlcvvf_collection += , $ohlcvvf

                        "$line [YES ($counter)][$(__LINE__)]"
                        $line = $reader.ReadLine()
                        ++$counter
                        continue content
                    } elseif ($i -in -2..-1) {
                        if (($i -eq -1) -and ($words[$i] -eq "-")) {
                            $ohlcvvf += 0
                        } elseif (($i -eq -2) -and ($words[$i] -eq "-")) {
                            "$line [YES ($counter)][$(__LINE__)]"
                            $line = $reader.ReadLine()
                            ++$counter
                            continue content     
                        }
                    } else {
                        "$($words[$i]) [UNKNOWN FIELD ($counter)][$(__LINE__)]"
                        break
                    }
                }
            }

            "$line [UNKNOWN FIELD ($counter)][$(__LINE__)]"
            break
        }
    }

    $line = $reader.ReadLine()
    ++$counter
}

#for ($page = 1; $page -le 1; $page++) {
#    $texto = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf,$page)
#   Write-Output $texto
#}

$pdf.Close()
