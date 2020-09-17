function __LINE__ {
    $MyInvocation.ScriptLineNumber
}

function message {
    Write-Host "$($args[1])  --  $(if($args[0]){"PASSED"}else{"FAILED"}) (counter: $($args[2]), line: $($args[3]))" `
        -ForegroundColor $(if(-$args[0]){"White"}else{"Yellow"})
}

Add-Type -path "itextsharp.dll"
$file = "$PWD\pdf\stockQuotes_08282020.pdf"
$pdf = New-Object iTextSharp.text.pdf.pdfreader -ArgumentList "$file"
#$pdf.NumberOfPages
$t = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, 1)
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
    "Name Symbol USD USD USD USD USD USD Volume Value, USD USD",
    "SECURITY PRICE, Php VOLUME VALUE, Php",
    "SECURITY PRICE, USD VOLUME VALUE, USD",
    "Note: Oddlot and Block Sale include DDS transactions converted to Philippine peso based on previous day exchange rate.",
    "OPEN HIGH LOW CLOSE %CHANGE PT.CHANGE VOLUME VALUE, Php"
#endregion header
#region sector
$assert_sector = @{
    "FIN" = "FINANCIALS";
    "IND" = "INDUSTRIAL";
    "HDG" = "HOLDING FIRMS";
    "PRO" = "PROPERTY";
    "SVC" = "SERVICES";
    "M-O" = "MINING & OIL";
}
#endregion sector
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

$counter = 1
$ohlcvvf_collection = @()
$line = $reader.ReadLine()
[ref]$parsed_date = Get-Date
$content_unixtime = 0

while($line -ne $null)
{
   $line = $line.Trim()

    #test line if header or sector or subsector
    if (
        ($line -in $assert_header) -or
        ($null -ne ($assert_sector.Values | ? { ($_ -replace "\s+", "") -match [Regex]::Escape(($line -replace "\s+", "")) })) -or
        ($null -ne ($assert_subsector | ? { $line -match $_ }))
    ) {
        message $true $line $counter $(__LINE__)
    } else {
        $is_valid_date = [DateTime]::TryParseExact(
            $line,
            "MMMM dd , yyyy",
            $null,
            [System.Globalization.DateTimeStyles]::None,
            $parsed_date
        )

        #test line if valid date w/ defined format
        if ($is_valid_date) {
            message $true $line $counter $(__LINE__)
            $content_unixtime = [System.DateTimeOffset]::new($parsed_date.Value.ToLocalTime()).ToUnixTimeSeconds()
           
        } else {
            $words = $line.Split()

            #if words in line is greater than 10 (N,S,B,A,O,H,L,C,V,Val,NF values)
            if ($words.Length -ge 10) {
                [ref]$parsed_value = 0
                $ohlcvvf = @{}

                #read words in reverse order (right to left)
                for ($i = -1; $i -ge -$words.Length; $i--) {

                    $is_valid_value = [System.Double]::TryParse(
                        $words[$i],
                        [System.Globalization.NumberStyles]::AllowThousands -bor
                        [System.Globalization.NumberStyles]::AllowDecimalPoint -bor
                        [System.Globalization.NumberStyles]::AllowParentheses,
                        $null,
                        $parsed_value
                    )

                    <#
                    if ($counter -eq 42) {
                        Write-Host "$i ($($words[$i]) -- $($words[$i].Length)) ($is_valid_value)" -ForegroundColor Green
                    }
                    #>

                    #test if word are in range of Bid..Net Foreign
                    #test if word is symbol & exists in list
                    #test if word is Name
                    if ($i -in -9..-1) {
                        #test if word are valid number (double) & in range of Open..Net Foreign then add to hashtable
                        #test if word is Net Foreign & equals to "-" then add 0 to hashtable
                        #test if word is Value & equals to "-" then skip while loop
                        if ($is_valid_value -and ($i -in -7..-1)) {
                            $ohlcvvf.(@("O", "H", "L", "C", "V", "Val", "NF")[$i]) = $parsed_value.Value
                        } elseif (($i -eq -1) -and ($words[$i] -eq "-")) {
                            $ohlcvvf.NF = 0
                        } elseif (($i -eq -2) -and ($words[$i] -eq "-")) {
                            message $true $line $counter $(__LINE__)
                            break    
                        } elseif (
                            ([System.String]::IsNullOrWhiteSpace($words[$i])) -and
                            ($null -ne ($assert_sector.Values | ? { $line -match "$_ SECTOR TOTAL VOLUME :" }))
                        ) {
                            <#
                            $sector_total = $words | ? { -not [System.String]::IsNullOrWhiteSpace($_) }
                            $k = @{
                                "S" = 0;
                                "O" = 0;
                                "H" = 0;
                                "L" = 0;
                                "C" = 0;
                                "V" = 0;
                                "Val" = 0;
                                "NF" = 0s;
                            }
                            $ohlcvvf_collection += , @{}
                            #>

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
            }
        }
    }

    $line = $reader.ReadLine()
    ++$counter
}

<#
for ($page = 1; $page -le 1; $page++) {
    $texto = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf,$page)
   Write-Output $texto
}
#>

$reader.Close()
$pdf.Close()
