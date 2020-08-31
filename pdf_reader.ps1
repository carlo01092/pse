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
    "F I N A N C I A L S",
    "I N D U S T R I A L",
    "H O L D I N G   F I R M S",
    "P R O P E R T Y",
    "S E R V I C E S",
    "M I N I N G   &   O I L",
    "P R E F E R R E D",
    "P H I L .   D E P O S I T A R Y   R E C E I P T S",
    "W A R R A N T S",
    "S M A L L ,   M E D I U M   &   E M E R G I N G",
    "E X C H A N G E   T R A D E D   F U N D S",
    "D O L L A R   D E N O M I N A T E D   S E C U R I T I E S",
    "S E C T O R A L   S U M M A R Y"
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
$ohlcvvf_collection = @()
$line = $reader.ReadLine()
[ref]$parsed_date = Get-Date
$content_unixtime = 0

:content
while( ($line -ne $null)  )
{
   $line = $line.Trim()

    if (($line -in $assert_header) -or ($line -in $assert_sector)) {
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
            "$line [YES ($counter)]"
            $content_unixtime = [System.DateTimeOffset]::new($parsed_date.Value.ToLocalTime()).ToUnixTimeSeconds()
           
        } else {
            foreach ($_ in $assert_subsector) {
                if ($line -match $_) {
                    "$line [YES ($counter)]"
                    $line = $reader.ReadLine()
                    ++$counter
                    continue content
                }
            }

            $words = $line.Trim().Split()
            if ($words.Length -ge 10) {
                [ref]$parsed_value = 0
                $ohlcvvf = @()
                for ($i = -1; $i -ge -$words.Length; $i--) {
                    $is_valid_value = [System.Double]::TryParse($words[$i], $parsed_value)

                    if (($is_valid_value) -and ($i -in -9..-1)) {
                        $ohlcvvf += $parsed_value.Value
                    } elseif (($i -eq -10) -and [bool](Select-String -InputObject $a -Pattern "\b$($words[$i])\b")) {
                        $ohlcvvf += $words[$i]
                    } elseif ($i -lt -10) {
                        [Array]::Reverse($ohlcvvf)
                        $ohlcvvf_collection += $ohlcvvf

                        "$line [YES ($counter)] $(__LINE__)"
                        $line = $reader.ReadLine()
                        ++$counter
                        continue content
                    } else {
                        "$line [UNKNOWN FIELD ($counter)]"
                        break
                    }
                }
                

                #"$line [YES ($counter)]"

                #$line = $reader.ReadLine()
                #++$counter
                #continue content
            }

            "$line [UNKNOWN FIELD ($counter)]"
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
