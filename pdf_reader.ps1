Add-Type -path "itextsharp.dll"
$file = "$PWD\pdf\stockQuotes_08282020.pdf"
$pdf = New-Object iTextSharp.text.pdf.pdfreader -ArgumentList "$file"
#$pdf.NumberOfPages
$t = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, 1)
$reader = New-Object -TypeName System.IO.StringReader -ArgumentList $t

$assert_header =
    "The Philippine Stock Exchange, Inc",
    "Daily Quotations Report", 
    "MAIN BOARD",
    "Net Foreign",
    "Buying/(Selling)",
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
#subsector always starts/ends with "****"
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
$line = $reader.ReadLine()

while( ($line -ne $null)  )
{
    #if ($counter -eq 10) {
    #    $words = $line.Trim().Split()
    #    
    #    for ($i = $words.Length; $i -ge 0; $i--) {
    #        $words[$i]
    #    }
    #}

    $line.Trim()

    $line = $reader.ReadLine()
    ++$counter
}

#for ($page = 1; $page -le 1; $page++) {
#    $texto = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf,$page)
#   Write-Output $texto
#}

$pdf.Close()
