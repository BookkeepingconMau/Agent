import { useState, useRef, useEffect } from "react";
const BUSINESS_TYPES = [
  { id: "construction",  label: "Construction / Trades",     icon: "🏗️" },
  { id: "hvac",          label: "HVAC / Clima",              icon: "🌬️" },
  { id: "roofing",       label: "Roofing",                   icon: "🏠" },
  { id: "drywall",       label: "Drywall",                   icon: "🧱" },
  { id: "electrical",    label: "Electricista",              icon: "🔌" },
  { id: "plumbing",      label: "Plomería",                  icon: "🚿" },
  { id: "landscaping",   label: "Landscaping / Lawn Care",   icon: "🌿" },
  { id: "cleaning",      label: "Cleaning / Janitorial",     icon: "🧹" },
  { id: "food_events",   label: "Food Events / Catering",    icon: "🍽️" },
  { id: "restaurant",    label: "Restaurant",                icon: "🍴" },
  { id: "trucking",      label: "Trucking / Transportation", icon: "🚛" },
  { id: "property_mgmt", label: "Property Management",       icon: "🏢" },
  { id: "barbershop",    label: "Barbería / Salón",          icon: "💇" },
  { id: "general",       label: "General Services",          icon: "⚙️" },
  { id: "bookkeeping",   label: "Bookkeeping / Tax Prep",     icon: "📒" },
];
const tradesFuel = (cat) => ({ construction:cat,hvac:cat,roofing:cat,drywall:cat,electrical:cat,plumbing:cat,landscaping:cat,cleaning:"Vehicle - Fuel (Non-Production)",food_events:"Vehicle - Fuel (Non-Production)",restaurant:"Vehicle - Fuel (Non-Production)",trucking:"COGS - Fuel (Production)",property_mgmt:"Vehicle - Fuel (Non-Production)",barbershop:"Vehicle - Fuel (Non-Production)",general:"Vehicle - Fuel (Non-Production)",bookkeeping:"Vehicle - Fuel (Non-Production)" });
// ── CAMBIO 1: "COGS - Materials" → "Materials" en tradesMat ──
const tradesMat  = (fallback="ASK TO CLIENT") => ({ construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:fallback,trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"Materials",general:fallback,bookkeeping:fallback });
// ─── BANK PROMPTS LIBRARY ─────────────────────────────────────────────────────
const BANK_PROMPTS = {
  mabrey_bank: `You are a STRICT check extraction agent for MABREY BANK statements.
The CHECKS PAID section appears near the END of the statement in a TWO-COLUMN grid:
DATE    CHECK NO    AMOUNT    ||    DATE    CHECK NO    AMOUNT
Read BOTH columns left AND right on every single row — do NOT skip the right column.
Each row contains TWO separate checks — extract BOTH.
Some checks have NO check number — use CHECK #UNKNOWN.
Asterisk (*) after check number means skipped sequence — include it anyway.
Amounts use comma formatting like 40,005.00 — parse correctly.
Use the DATE shown next to each check individually.
AMOUNT must be negative.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  bank_of_oklahoma: `You are a STRICT extraction agent for BANK OF OKLAHOMA (BOK) statements.
BOK STATEMENT STRUCTURE — READ IN THIS ORDER:
1. DEPOSITS section: simple list, DATE on left, AMOUNT on right. Extract ALL.
2. WITHDRAWALS section: simple list, DATE on left, AMOUNT on right. Extract ALL — this section is LONG, do NOT stop early.
3. CHECKS section: TWO-COLUMN table — Date | Number | Amount || Date | Number | Amount
   Read BOTH columns on EVERY row. Each row = TWO separate checks.
   Asterisk (*) before number = skipped sequence — still extract.
   Use the DATE shown next to each check individually.
4. DAILY ACCOUNT BALANCE section: NOT transactions — skip entirely.
5. STOP — Everything after the DAILY ACCOUNT BALANCE section is check and deposit IMAGES.
   These image pages contain scanned photos of physical checks and deposit slips.
   They show dollar amounts but these are NOT transactions — they are already captured above.
   DO NOT extract ANYTHING from image pages.
   Image pages are identified by: no transaction dates, check numbers as headers, 
   dollar amounts without descriptions, deposit slip photos.
   EXTRACTING FROM IMAGE PAGES WILL CREATE DUPLICATES — strictly forbidden.
DEPOSITS positive. WITHDRAWALS and CHECKS negative.
Dates format MM-DD-YY → convert to MM/DD/YYYY.
AMOUNT must be negative for withdrawals and checks.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  arvest_bank: `You are a STRICT extraction agent for ARVEST BANK statements.
ARVEST BANK STRUCTURE:
1. DEPOSITS section: Simple list — DATE, DESCRIPTION, AMOUNT (positive). Extract ALL.
2. ELECTRONIC CREDITS section: Also deposits — DATE, DESCRIPTION, AMOUNT (positive). Extract ALL.
3. ELECTRONIC DEBITS section: Withdrawals — each transaction has 3 lines:
   Line 1: DATE and MERCHANT NAME and AMOUNT (negative, shown as -$XX.XX)
   Lines 2-3: transaction details — use merchant name from line 1 as concept.
   Extract ALL — this section is very long, do NOT stop early.
4. OTHER DEBITS section: Also withdrawals — extract all (service charges etc.)
5. CHECKS CLEARED section: THREE-COLUMN table:
   Check Nbr | Date | Amount || Check Nbr | Date | Amount || Check Nbr | Date | Amount
   Read ALL THREE columns on every row.
   Check number 0 means no check number — use CHECK #UNKNOWN.
   Asterisk (*) after number means skipped sequence — still extract.
   Use the DATE shown next to each check.
6. IGNORE pages with check images — those are NOT transaction data.
DEPOSITS positive. ELECTRONIC DEBITS amounts already have minus sign — keep negative.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  bank_of_america: `You are a STRICT extraction agent for BANK OF AMERICA statements.
BANK OF AMERICA STRUCTURE:
1. DEPOSITS AND OTHER CREDITS section: Simple list — Date, Description, Amount (positive). Extract ALL.
2. WITHDRAWALS AND OTHER DEBITS section: Has two parts:
   - Direct debits (Zelle, ACH, online payments) — negative amounts
   - Card account section (grouped under "Card account # XXXX") — also negative amounts
   Extract ALL from both parts — do NOT stop at the subtotal line.
3. SERVICE FEES section: Extract any fees as withdrawals.
4. CHECKS section: TWO-COLUMN table — Date | Check # | Amount || Date | Check # | Amount
   Read BOTH columns on EVERY row. Each row = TWO separate checks.
   Extract ALL checks.
5. IGNORE pages marked "This page intentionally left blank".
6. IGNORE check images pages — those are NOT transaction data.
Deposits are positive. Withdrawals shown as negative — keep negative.
Dates format MM/DD/YY — convert to MM/DD/YYYY.
"Subtotal for card account" and "Total" lines are NOT transactions — skip them.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  chase: `You are a STRICT extraction agent for CHASE BANK statements.
IMPORTANT: This statement may be in SPANISH. Column headers in Spanish:
FECHA = Date, DESCRIPCIÓN = Description, CANTIDAD = Amount
CHASE BANK STRUCTURE:
1. DEPÓSITOS Y ADICIONES (DEPOSITS AND ADDITIONS): All are deposits — positive amounts. Extract ALL.
2. RETIROS ELECTRÓNICOS (ELECTRONIC WITHDRAWALS): All are withdrawals.
   Amounts appear as POSITIVE numbers in statement but output them as NEGATIVE.
3. CARGOS (FEES/CHARGES): Also withdrawals — output as negative.
4. NO CHECKS in this statement type typically.
5. IGNORE blank pages ("Esta página se ha dejado en blanco intencionalmente").
Dates shown as MM/DD — convert to MM/DD/YYYY using the statement year.
Each transaction may span multiple lines — use first line description as concept.
"Total de depósitos" and "Total de retiros" are summary lines — NOT transactions, skip them.
SALDO FINAL DIARIO section — NOT transactions, skip entirely.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  msu_federal_credit_union: `You are a STRICT extraction agent for MSU FEDERAL CREDIT UNION statements.
MSU FCU STATEMENT STRUCTURE — CRITICAL RULES:

1. MULTIPLE ACCOUNTS: This statement contains multiple sub-accounts (SPARTAN SAVER, IMMA, SMALL BUSINESS CHECKING).
   Extract ONLY transactions from the account labeled "SMALL BUSINESS CHECKING" — ignore SPARTAN SAVER and IMMA entirely.

2. MAIN LEDGER (all pages of the SMALL BUSINESS CHECKING section):
   Each transaction line has: Post Date | Trans Date (optional) | Amount | Balance | Description
   - Positive amount = DEPOSIT
   - Negative amount = WITHDRAWAL
   Extract ALL transactions: ACH, POS, Debit Card, ComputerLine Transfers, Drafts, ATM deposits, Fees.

3. DRAFTS: Lines like "Draft 5472" or "Draft 5481" are WITHDRAWALS.
   Use concept "CHECK #5472", "CHECK #5481", etc.

4. CLEARED CHECK SUMMARY table (near end of SMALL BUSINESS CHECKING section):
   These checks ARE ALREADY included in the ledger as Draft lines — DO NOT extract from this table.
   It is for reference only. Extracting it would create duplicates.

5. SUMMARY PAGES ("Withdrawals and Other Charges" / "Deposits and Other Credits"):
   These are summaries of transactions already in the ledger — DO NOT extract from them.
   They will create duplicates.

6. TRANSFERS:
   "ComputerLine Transfer To Share XX" = WITHDRAWAL, concept "Transfer Out (Share XX)"
   "ComputerLine Transfer From Share XX" = DEPOSIT, concept "Transfer In (Share XX)"
   "ComputerLine Transfer To CASILLAS MAGALLO" = WITHDRAWAL, concept "Loan Payment - Casillas Magallo"
   "ComputerLine M2M Outgoing Transaction" = WITHDRAWAL, concept "Transfer Out"
   "ComputerLine M2M Incoming Transaction" = DEPOSIT, concept "Transfer In"
   "ComputerLine PERSON PAY [Name]" = WITHDRAWAL, concept "PERSON PAY [Name]"
   Include ALL of these.

7. Dates format: MM-DD → convert to MM/DD/YYYY using the statement year shown on page 1.
   If Trans Date differs from Post Date, use Post Date.

8. DEPOSITS positive. WITHDRAWALS negative.
9. "Balance Forward" and "Ending Balance" lines are NOT transactions — skip them.
10. "Dividends Earned YTD" lines are NOT transactions — skip them.
    Dividend entries WITH an amount and date ARE transactions — include them as DEPOSITS.

OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown. No explanation.`,
  mercury_bank: `You are a STRICT extraction agent for MERCURY BANK statements.
MERCURY BANK STATEMENT STRUCTURE:
1. TRANSACTIONS section: Each transaction has Date | Description | Amount | Balance
   - Positive amount = DEPOSIT
   - Negative amount = WITHDRAWAL
2. Extract ALL transactions: ACH, Wire, Card payments, Fees, Transfers.
3. TRANSFERS:
   "Person Pay [Name]" = WITHDRAWAL, concept "PERSON PAY [Name]"
   "Transfer In" = DEPOSIT, concept "Transfer In"
   "Transfer Out" = WITHDRAWAL, concept "Transfer Out"
4. Dates format: MM/DD/YYYY or similar — keep as MM/DD/YYYY.
5. DEPOSITS positive. WITHDRAWALS negative.
6. Do NOT extract summary lines or balance lines — only actual transactions.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`,
  default: `You are a STRICT bank statement extraction agent.
Extract ALL transactions: deposits, withdrawals, checks, fees, transfers.
DEPOSITS positive. WITHDRAWALS negative.
Dates format MM/DD/YYYY.
Check tables may have TWO or THREE columns — read ALL columns on every row.
Summary totals and balance rows are NOT transactions — skip them.
Blank pages — skip entirely.
OUTPUT: Raw CSV — TYPE,DATE,AMOUNT,CONCEPT. No headers. No markdown.`
};
const MERCHANT_DICT = [
  // ── FUEL ──
  ...[["QT","QUIKTRIP","QUICK TRIP"],["RACETRAC"],["VALERO"],["STRIPES"],["MURPHY USA","MURPHY EXPRESS"],["CIRCLE K"],["SPEEDWAY"],["WAWA"],["THORNTONS"],["SHELL"],["CHEVRON"],["EXXON","EXXONMOBIL"],["BP ","BP#"],["MARATHON"],["CASEY"],["KWIK TRIP","KWIKTRIP"],["LOVES","LOVE'S"],["PILOT TRAVEL","PILOT FLYING"],["FLYING J"],["ARCO"],[" 76 "," 76#"],["SUNOCO"],["KROGER FUEL","KROGER GAS"],["NEW HUDSON PETROLEUM"]].map(p=>({ patterns:p, category:tradesFuel("COGS - Fuel (Production)"), amountRule:{under15:"Meals & Entertainment"} })),
  { patterns:["BANKCARD","BKCD PROCESSING"], category:{restaurant:"Income - Services",food_events:"Income - Services",construction:"ASK TO CLIENT",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"ASK TO CLIENT",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"ASK TO CLIENT",barbershop:"Income - Services",general:"ASK TO CLIENT"} },
  { patterns:["DOORDASH","DOOR DASH"], category:{restaurant:"Income - Services",food_events:"Income - Services",construction:"ASK TO CLIENT",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"ASK TO CLIENT",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"ASK TO CLIENT",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["UBER USA","UBER EATS","UBEREATS"], category:{restaurant:"Income - Services",food_events:"Income - Services",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"} },
  // ── CAMBIO 2 en merchants: "COGS - Materials" → "Materials" ──
  { patterns:["EL REY USA MEATS","EL REY MEATS"], category:"Materials" },
  { patterns:["CAPITOL BEVERAGE","CAPITAL BEVERAGE"], category:"Materials" },
  { patterns:["REYESCOCACOLA","REYES COCA COLA","REYES COKE"], category:"Materials" },
  { patterns:["GFS STORE","GORDON FOOD SERVICE","GORDON FOOD"], category:{restaurant:"Materials",food_events:"Materials",construction:"Operating Expenses - Supplies",hvac:"Operating Expenses - Supplies",roofing:"Operating Expenses - Supplies",drywall:"Operating Expenses - Supplies",electrical:"Operating Expenses - Supplies",plumbing:"Operating Expenses - Supplies",landscaping:"Operating Expenses - Supplies",cleaning:"Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"Operating Expenses - Supplies",general:"Operating Expenses - Supplies"} },
  { patterns:["HORROCKS","HORROCKS FARM"], category:{restaurant:"Materials",food_events:"Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"} },
  { patterns:["QUALITY DAIRY"], category:{restaurant:"Materials",food_events:"Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"} },
  { patterns:["SHEILA'S BAKERY","SHEILAS BAKERY"], category:{restaurant:"Materials",food_events:"Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"} },
  { patterns:["STATE OF MICHGWL","STATE OF MICHNWS","GENERAL WINE AND LIQ","ABC LIQUOR"], category:{restaurant:"Materials",food_events:"Materials",construction:"ASK TO CLIENT",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"ASK TO CLIENT",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"ASK TO CLIENT",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["LQ MERCHANT","MERCHANT BANKCD","BKCD PROCESSING","MERCHANT HUB","YBSPOS"], category:{restaurant:"Bank Fees",food_events:"Bank Fees",construction:"Bank Fees",hvac:"Bank Fees",roofing:"Bank Fees",drywall:"Bank Fees",electrical:"Bank Fees",plumbing:"Bank Fees",landscaping:"Bank Fees",cleaning:"Bank Fees",trucking:"Bank Fees",property_mgmt:"Bank Fees",barbershop:"Bank Fees",general:"Bank Fees"} },
  ...[["CONSTELLATION ENERGY"],["COMED"],["PEOPLES GAS"],["ATMOS ENERGY"],["ONCOR"],["FPL ","FLORIDA POWER"],["DUKE ENERGY"],["APS "],["SRP "],["CONSUMERS ENERGY"],["LANSING BWL","BWL UTIL"],["DELTA CHARTER TW"],["GRANGERCOM"],["GRANGER"]].map(p=>({patterns:p,category:"Utilities"})),
  ...[["INTUIT 82704102","INTUIT 83982660","INTUIT 19205133","INTUIT 63733983","INTUIT 32260264"],["GUSTO"],["ADP ","ADP*"],["PAYCHEX"]].map(p=>({patterns:p,category:"Payroll & Wages"})),
  { patterns:["INTUIT *QBOOKS","QBOOKS PAYROLL","QUICKBOOKS PAYROLL"], category:"Payroll & Wages" },
  // ── CAMBIO 3: NUEVOS MERCHANTS — Payroll Tax, Licenses & Permits, Legal & Professional Services ──
  { patterns:["EFTPS","IRS USATAXPYMT","IRS USATAX"], category:"Payroll Tax" },
  { patterns:["MI UIA","MICHIGAN UIA","MESC "], category:"Payroll Tax" },
  { patterns:["TX WORKFORCE","TWC ","TEXAS WORKFORCE"], category:"Payroll Tax" },
  { patterns:["OK TAX","OKLAHOMA TAX COMM"], category:"Payroll Tax" },
  { patterns:["AR DFA","ARKANSAS DFA"], category:"Payroll Tax" },
  { patterns:["CONTRACTOR LIC","CONTRACTORS LIC"], category:"Licenses & Permits" },
  { patterns:["DEPT OF LABOR","DEPARTMENT OF LABOR"], category:"Licenses & Permits" },
  { patterns:["OSHA "], category:"Licenses & Permits" },
  { patterns:["SECRETARY OF STATE"], category:"Licenses & Permits" },
  { patterns:["LAW OFFICE","LAW GROUP","ATTORNEY","ABOGADO","LEGAL SERVICES","LLP ","PLLC "], category:"Legal & Professional Services" },
  { patterns:["CPA ","ACCOUNTANT","ACCOUNTING FIRM","TAX PREP","H&R BLOCK","JACKSON HEWITT","LIBERTY TAX"], category:"Legal & Professional Services" },
  { patterns:["NOTARY","NOTARIO"], category:"Legal & Professional Services" },
  { patterns:["CONSULTING","CONSULTANT"], category:"Legal & Professional Services" },
  { patterns:["STATEOF MICHIGAN","STATE OF MICHIGAN","STATE FARM RO"], category:{restaurant:"Taxes & Licenses",food_events:"Taxes & Licenses",construction:"Insurance",hvac:"Insurance",roofing:"Insurance",drywall:"Insurance",electrical:"Insurance",plumbing:"Insurance",landscaping:"Insurance",cleaning:"Insurance",trucking:"Insurance",property_mgmt:"Insurance",barbershop:"Insurance",general:"Insurance"} },
  ...[["JOHNSTONE SUPPLY","JOHNSTONE"],["WATSCO"],["CARRIER"],["TRANE"],["LENNOX"],["YORK HVAC"],["RHEEM"],["GOODMAN"],["REFRIGERANT","R-410","FREON"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["ABC SUPPLY","ABC ROOFING"],["BEACON ROOFING"],["GULFEAGLE"],["OWENS CORNING"],["GAF ROOFING","GAF MATERIAL"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["USG ","US GYPSUM"],["NATIONAL GYPSUM"],["CERTAINTEED"],["GEORGIA PACIFIC"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["GRAYBAR"],["REXEL"],["WESCO"],["PLATT ELECTRIC"],["CITY ELECTRIC"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["HAJOCA"],["REEVES-SAIN","REEVES SAIN"],["CONSOLIDATED PIPE"],["BARNETT"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["SALLY BEAUTY","SALLYS BEAUTY"],["COSMOPROF"],["BEAUTY SUPPLY"],["SALON CENTRIC"],["PAUL MITCHELL"]].map(p=>({patterns:p,category:"Materials"})),
  ...[["ULINE","U-LINE"],["CINTAS"],["ZORO TOOLS","ZORO "]].map(p=>({patterns:p,category:"Materials"})),
  { patterns:["GRAINGER"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:"ASK TO CLIENT",trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  ...[["APARTMENT LIST"],["ZILLOW"],["COSTAR"],["APARTMENTS.COM"],["BUILDIUM"],["APPFOLIO"],["RENTMANAGER","RENT MANAGER"]].map(p=>({patterns:p,category:{property_mgmt:p[0].includes("BUILDIUM")||p[0].includes("APPFOLIO")||p[0].includes("RENTMANAGER")?"Software & Subscriptions":"Advertising & Marketing",construction:"Advertising & Marketing",hvac:"Advertising & Marketing",roofing:"Advertising & Marketing",drywall:"Advertising & Marketing",electrical:"Advertising & Marketing",plumbing:"Advertising & Marketing",landscaping:"Advertising & Marketing",cleaning:"Advertising & Marketing",food_events:"Advertising & Marketing",restaurant:"Advertising & Marketing",trucking:"Advertising & Marketing",barbershop:"Advertising & Marketing",general:"Advertising & Marketing"}})),
  ...[["FIESTA MART"],["CARDENAS"],["NORTHGATE"],["VALLARTA"],["HEB ","H-E-B"],["ALDI"],["CARNICERIA"],["PANADERIA"],["SURTIDORA"],["LUCKY SUPERMARKET"],["STATER BROS"],["BRAVO SUPER"],["SEDANOS"],["COMPARE FOODS"],["PRICE RITE"],["MEIJER"],["KROGER "]].map(p=>({patterns:p,category:{food_events:"Materials",restaurant:"Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Materials",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"}})),
  { patterns:["HOME DEPOT","THE HOME DEPOT"], category:tradesMat("Repairs & Maintenance") },
  { patterns:["LOWES","LOWE'S"],              category:tradesMat("Repairs & Maintenance") },
  { patterns:["MENARDS"],                     category:tradesMat("ASK TO CLIENT") },
  { patterns:["ACE HARDWARE"],               category:tradesMat("ASK TO CLIENT") },
  { patterns:["TRUE VALUE"],                  category:tradesMat("ASK TO CLIENT") },
  { patterns:["FASTENAL"],                    category:tradesMat("Office Supplies") },
  { patterns:["TRACTOR SUPPLY"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["HARBOR FREIGHT"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["SHERWIN WILLIAMS","SHERWIN-WILLIAMS"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"Materials",cleaning:"Materials",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["FERGUSON"],                    category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["84 LUMBER"],                   category:tradesMat("ASK TO CLIENT") },
  { patterns:["FLOOR AND DECOR","FLOOR & DECOR"], category:{construction:"Materials",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"Materials",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["SUNBELT RENTAL"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["UNITED RENTALS"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["RESTAURANT EQUIPPERS"],        category:{restaurant:"Repairs & Maintenance",food_events:"Repairs & Maintenance",construction:"ASK TO CLIENT",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"ASK TO CLIENT",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"ASK TO CLIENT",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  ...[["MCDONALD"],["STARBUCKS"],["CHICK-FIL-A","CHICKFILA"],["SUBWAY"],["CHIPOTLE"],["TACO BELL"],["WENDYS"],["BURGER KING"],["DOMINOS"],["PIZZA HUT"],["POPEYES"],["PANDA EXPRESS"],["IN-N-OUT"],["WHATABURGER"],["RAISING CANE"],["SONIC DRIVE"],["JACK IN THE BOX"],["DAIRY QUEEN"],["FIVE GUYS"],["PANERA"],["DUNKIN"],["BUFFALO WILD","BUFFALO WILD WINGS"],["OLIVE GARDEN"]].map(p=>({patterns:p,category:"Meals & Entertainment"})),
  ...[["TAQUERIA"],["TACOS "],["CARNITAS"],["TAMALES"],["TORTAS"]].map(p=>({patterns:p,category:{food_events:"Materials",restaurant:"Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"}})),
  { patterns:["JALISCIENCE","LA JALISCIENCE"], category:"Meals & Entertainment" },
  { patterns:["PUPUSERIA"],  category:"Meals & Entertainment" },
  { patterns:["PALETERIA"],  category:"Meals & Entertainment" },
  { patterns:["WESTERN UNION"],              category:"Owner Draw" },
  { patterns:["MONEYGRAM","MONEY GRAM"],     category:"Owner Draw" },
  { patterns:["REMITLY"],                    category:"Owner Draw" },
  { patterns:["XOOM"],                       category:"Owner Draw" },
  { patterns:["CASH APP","CASHAPP"],         category:"ASK TO CLIENT" },
  { patterns:["VENMO"],                      category:"ASK TO CLIENT" },
  { patterns:["PAYPAL"],                     category:"ASK TO CLIENT" },
  { patterns:["APPLE CASH","APPLE PAY"],     category:"ASK TO CLIENT" },
  { patterns:["GOOGLE PAY"],                 category:"ASK TO CLIENT" },
  { patterns:["PERSON PAY","COMPUTERLINE PERSON PAY"], category:"ASK TO CLIENT" },
  ...[["STATE FARM"],["GEICO"],["PROGRESSIVE","PROG MICHIGAN"],["ALLSTATE"],["FARMERS INS"],["NATIONWIDE"],["LIBERTY MUTUAL"],["WORKERS COMP"]].map(p=>({patterns:p,category:"Insurance"})),
  ...[["CAMINO FINANCIAL"],["KABBAGE"],["ONDECK"],["BLUEVINE"],["FUNDBOX"],["CREDIBLY"],["LENDIO"],["LAFCU"]].map(p=>({patterns:p,category:"Loan Payment"})),
  ...[["VERIZON","VZWRLSS"],["AT&T","ATT "],["T-MOBILE","TMOBILE"],["METRO PCS","METROPCS"],["BOOST MOBILE"],["CRICKET "],["SIMPLE MOBILE"],["TRACFONE"],["SPECTRUM"],["XFINITY","COMCAST"],["DIRECTV"],["DISH NETWORK"]].map(p=>({patterns:p,category:"Telephone & Internet"})),
  ...[["QUICKBOOKS"],["CANVA"],["ADOBE"],["MICROSOFT 365"],["GOOGLE WORKSPACE"],["DROPBOX"],["ZOOM"],["SLACK"],["SHOPIFY"],["GODADDY"],["WIX"],["BUILDIUM"],["APPFOLIO"],["MAILCHIMP"],["CONSTANTCONTACT"]].map(p=>({patterns:p,category:"Software & Subscriptions"})),
  { patterns:["NETFLIX"], category:"Meals & Entertainment" },
  { patterns:["SPOTIFY"], category:"Meals & Entertainment" },
  { patterns:["HULU"], category:"Meals & Entertainment" },
  { patterns:["DISNEY+","DISNEY PLUS"], category:"Meals & Entertainment" },
  { patterns:["AMAZON PRIME","PRIME VIDEO","PRIMEVIDEO"], category:"Meals & Entertainment" },
  { patterns:["HBO MAX","HBOMAX","MAX.COM"], category:"Meals & Entertainment" },
  { patterns:["APPLE TV","APPLETV+"], category:"Meals & Entertainment" },
  { patterns:["PARAMOUNT+","PARAMOUNT PLUS"], category:"Meals & Entertainment" },
  { patterns:["PEACOCK"], category:"Meals & Entertainment" },
  { patterns:["YOUTUBE PREMIUM","YOUTUBEPREMIUM"], category:"Meals & Entertainment" },
  { patterns:["AMAZON PRIME"] , category:"Software & Subscriptions" },
  { patterns:["SQUARE ","SQUARE*","SQ *","SQ*"], category:"ASK TO CLIENT" },
  { patterns:["STRIPE"],                         category:"ASK TO CLIENT" },
  { patterns:["KOMPANIC LLC","KOMPANIC"],         category:{restaurant:"Software & Subscriptions",food_events:"Software & Subscriptions",construction:"Software & Subscriptions",hvac:"Software & Subscriptions",roofing:"Software & Subscriptions",drywall:"Software & Subscriptions",electrical:"Software & Subscriptions",plumbing:"Software & Subscriptions",landscaping:"Software & Subscriptions",cleaning:"Software & Subscriptions",trucking:"Software & Subscriptions",property_mgmt:"Software & Subscriptions",barbershop:"Software & Subscriptions",general:"Software & Subscriptions"} },
  // ── CAMBIO 4: V&M BOOKKEEPING → Legal & Professional Services ──
  { patterns:["V&M BOOKKEEPING","BOOKKEEPING GROUP"], category:"Legal & Professional Services" },
  ...[["AUTOZONE"],["OREILLY","O'REILLY"],["ADVANCE AUTO"],["NAPA AUTO"],["PEP BOYS"],["JIFFY LUBE"],["FIRESTONE"],["GOODYEAR"],["MAVIS TIRE"],["DISCOUNT TIRE"],["CAR WASH","CARWASH"]].map(p=>({patterns:p,category:"Vehicle - Maintenance"})),
  { patterns:["UBER ","UBER*"],         category:"Travel & Transportation" },
  { patterns:["LYFT"],                  category:"Travel & Transportation" },
  ...[["IPASS"],["SUNPASS"],["TXTAG"],["EZPASS"],["TOLL "]].map(p=>({patterns:p,category:{trucking:"COGS - Fuel (Production)",construction:"Travel & Transportation",hvac:"Travel & Transportation",roofing:"Travel & Transportation",drywall:"Travel & Transportation",electrical:"Travel & Transportation",plumbing:"Travel & Transportation",landscaping:"Travel & Transportation",cleaning:"Travel & Transportation",food_events:"Travel & Transportation",restaurant:"Travel & Transportation",property_mgmt:"Travel & Transportation",barbershop:"Travel & Transportation",general:"Travel & Transportation"}})),
  ...[["SPIRIT AIRLINES"],["FRONTIER AIRLINES"],["AMERICAN AIRLINES"],["SOUTHWEST AIRLINES"]].map(p=>({patterns:p,category:"Travel & Transportation"})),
  { patterns:["WALMART","WAL-MART","WM SUPERCENTER"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:"Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"Materials",general:"Office Supplies"} },
  { patterns:["SAMS CLUB","SAM'S CLUB","SAMSCLUB"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:"Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"Materials",general:"Office Supplies"} },
  { patterns:["COSTCO"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:"Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"Materials",general:"Office Supplies"} },
  { patterns:["AMAZON"], category:{construction:"Materials",hvac:"Materials",roofing:"Materials",drywall:"Materials",electrical:"Materials",plumbing:"Materials",landscaping:"Materials",cleaning:"Materials",food_events:"Materials",restaurant:"ASK TO CLIENT",trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"Materials",general:"Office Supplies"} },
  { patterns:["MICHAELS STORES","MICHAELS STORE"], category:{restaurant:"Operating Expenses - Supplies",food_events:"Operating Expenses - Supplies",construction:"Operating Expenses - Supplies",hvac:"Operating Expenses - Supplies",roofing:"Operating Expenses - Supplies",drywall:"Operating Expenses - Supplies",electrical:"Operating Expenses - Supplies",plumbing:"Operating Expenses - Supplies",landscaping:"Operating Expenses - Supplies",cleaning:"Operating Expenses - Supplies",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"Operating Expenses - Supplies",general:"Office Supplies"} },
  { patterns:["HOBBY LOBBY","HOBBYLOBBY"], category:"Operating Expenses - Supplies" },
  { patterns:["VOLUNTEERS OF AMERICA"], category:"Meals & Entertainment" },
  ...[["TARGET"],["DOLLAR TREE"],["DOLLAR GENERAL"],["FAMILY DOLLAR"],["FIVE BELOW"]].map(p=>({patterns:p,category:"Office Supplies"})),
  { patterns:["EBAY"], category:"ASK TO CLIENT" },
  ...[["ROSS DRESS","ROSS STORE"],["TJ MAXX","TJMAXX"],["BURLINGTON"],["MARSHALLS"]].map(p=>({patterns:p,category:"Uniforms"})),
  ...[["FACEBOOK ADS","FACEBOOK.COM"],["META ADS"],["GOOGLE ADS"],["YELP"],["THUMBTACK"],["HOMEADVISOR"],["ANGI "],["NEXTDOOR"],["VISTAPRINT"],["4IMPRINT"],["INDEED"],["ZIPRECRUITER"],["INSTY PRINTS"]].map(p=>({patterns:p,category:"Advertising & Marketing"})),
  ...[["OVERDRAFT"],["NSF FEE"],["MONTHLY FEE","MONTHLY SERVICE FEE"],["SERVICE FEE"],["ATM FEE","ATM WITHDRAWAL FEE"],["WIRE FEE"],["LATE FEE"],["RETURNED ITEM"],["STOP PAYMENT"],["MINIMUM BALANCE"],["TRAN OVER"],["MAURERS YOUR IMA"]].map(p=>({patterns:p,category:"Bank Fees"})),
  ...[["USPS"],["UPS STORE"],["FEDEX"]].map(p=>({patterns:p,category:"Operating Expenses - Delivery & Postage"})),
  ...[["STAPLES"],["OFFICE DEPOT"],["OFFICEMAX"]].map(p=>({patterns:p,category:"Office Supplies"})),
  { patterns:["UHAUL","U-HAUL"], category:"Operating Expenses - Supplies" },
  ...[["PUBLIC STORAGE"],["EXTRA SPACE STORAGE"],["CUBESMART"],["STORAGE "],["LEGACY SELF STORAGE","LEGACY STORAGE"]].map(p=>({patterns:p,category:"Rent & Lease"})),
  ...[["AIRBNB"],["MARRIOTT"],["HILTON"],["MOTEL 6"]].map(p=>({patterns:p,category:"Travel & Transportation"})),
  { patterns:["PARKING"], category:"Operating Expenses - Parking" },
  ...[["IRS ","IRS*"],["STATE TAX","SALES TAX"]].map(p=>({patterns:p,category:"Taxes & Licenses"})),
  { patterns:["GUITAR CENTER"], category:"ASK TO CLIENT" },
  // ── MERCURY BANK ──────────────────────────────────────────────────────────
  { patterns:["PERSON PAY LUIS"], category:"Owner Draw" },
  { patterns:["POS AMAZON.COM","DEBIT CARD AMAZON"], category:"Materials" },
  // ── REGLAS APRENDIDAS — vm · general · 3/4/2026 ──────────────────────────
  { patterns:["INTL. TRANSACTION FEE"], category:"Bank Fees" },
  { patterns:["MERCURY CREDIT ACCOUNT"], category:"Bank Fees" },
  { patterns:["MERCURY IO CASHBACK"], category:"Other Income" },
  { patterns:["VM IBKR ACH"], category:"Transfer Out" },
  { patterns:["MAU HIGLOBE ACH"], category:"Owner Draw" },
  { patterns:["MERPAGO*ELCAMARONLOCO"], category:"Meals & Entertainment" },
  { patterns:["CALENDLY"], category:"Software & Subscriptions" },
  { patterns:["ABA SANTA CLARA"], category:"Meals & Entertainment" },
  { patterns:["REST EL CONEJO"], category:"Meals & Entertainment" },
  { patterns:["MAISON KAYSER"], category:"Meals & Entertainment" },
  { patterns:["ANTHROPIC"], category:"Software & Subscriptions" },
  { patterns:["DHL "], category:"Operating Expenses - Delivery & Postage" },
  { patterns:["OXXO "], category:"Meals & Entertainment" },
  { patterns:["MERPAGO*OUTLET"], category:"Uniforms" },
  { patterns:["HOTEL MAR DE"], category:"Travel & Transportation" },
  { patterns:["FECEGO ","FECEGO MARINA"], category:"Advertising & Marketing" },
  { patterns:["COM RAP NUNYS"], category:"Meals & Entertainment" },
  { patterns:["REST LA GALERA"], category:"Meals & Entertainment" },
  { patterns:["COPPEL ZAMORA","COPPEL "], category:"Uniforms" },
  { patterns:["GAS SERV PEMEX"], category:"Vehicle - Fuel (Non-Production)" },
  { patterns:["REST NATURAL"], category:"Meals & Entertainment" },
  { patterns:["ZORRO HEROES IXTAPALUC"], category:"Office Supplies" },
  { patterns:["SERV SAN PABLO","FARM SAN PABLO"], category:"Pharmacy" },
  { patterns:["SERVICIO SANTA BARBARA"], category:"Vehicle - Fuel (Non-Production)" },
  { patterns:["FERRLINPIO"], category:"Office Supplies" },
  { patterns:["CINEMEX"], category:"Meals & Entertainment" },
  { patterns:["SBB IXTAPALUCA","SBB IXTAPALUC"], category:"Vehicle - Fuel (Non-Production)" },
  // ── MABREY BANK / CONSTRUCTION (Najera) ──────────────────────────────────
  { patterns:["MAVERIK","POS DEB MAVERIK","DBT CRD MAVERIK"], category:"Vehicle - Fuel (Non-Production)" },
  { patterns:["ATWOOD","POS DEB ATWOOD"], category:"Materials" },
  { patterns:["CHARLIES","DBT CRD CHARLIES"], category:"Meals & Entertainment" },
  { patterns:["MAZZIOS","MAZZIO"], category:"Meals & Entertainment" },
  { patterns:["STEWART FUEL","DBT CRD STEWART"], category:"Vehicle - Fuel (Non-Production)" },
  { patterns:["TORTILLERIA","DBT CRD TORTILLERIA"], category:"Meals & Entertainment" },
  { patterns:["IGLESIA","DBT CRD IGLESIA"], category:"Donations" },
  { patterns:["INS. PREM PRIMERICA","PRIMERICA"], category:"Insurance" },
  { patterns:["JOHNNYS","POS DEB JOHNNYS"], category:"Meals & Entertainment" },
  { patterns:["PEEPS","POS DEB PEEPS"], category:"Vehicle - Fuel (Non-Production)" },
  { patterns:["TIL*PL","DBT CRD TIL*PL"], category:"Meals & Entertainment" },
  { patterns:["DDA B/P PIE"], category:"Insurance" },
  { patterns:["DDA B/P TOTAL"], category:"Telephone & Internet" },
  { patterns:["IPAY BILL PAY"], category:"Bank Fees" },
];
const DEPOSIT_CATEGORIES    = ["Income - Services","Other Income","Loan Proceeds","Owner Investment","Transfer In","Refund Received","ASK TO CLIENT"];
// ── CAMBIO 5: WITHDRAWAL_CATEGORIES — nueva lista limpia ──
const WITHDRAWAL_CATEGORIES = [
  "Materials",
  "Subcontractor Expense",
  "COGS - Fuel (Production)",
  "Payroll & Wages",
  "Payroll Tax",
  "Legal & Professional Services",
  "Licenses & Permits",
  "Advertising & Marketing",
  "Bank Fees",
  "Donations",
  "Insurance",
  "Loan Payment",
  "Meals & Entertainment",
  "Office Supplies",
  "Operating Expenses - Delivery & Postage",
  "Operating Expenses - Parking",
  "Operating Expenses - Supplies",
  "Personal Payment",
  "Pharmacy",
  "Rent & Lease",
  "Repairs & Maintenance",
  "Software & Subscriptions",
  "Taxes & Licenses",
  "Telephone & Internet",
  "Transfer Out",
  "Travel & Transportation",
  "Uniforms",
  "Utilities",
  "Vehicle - Fuel (Non-Production)",
  "Vehicle - Maintenance",
  "Owner Draw",
  "ASK TO CLIENT",
];
const TRANSFER_IN_KEYWORDS  = ["INTERNET XFER FROM","XFER FROM CHKG","XFER FROM SAV","TRANSFER FROM","ONLINE TRANSFER FROM","FUNDS TRANSFER IN","MOBILE XFER FROM","TRANSFER FROM SHARE","COMPUTERLINE TRANSFER FROM","DEPOSIT TRANSFER FROM"];
const TRANSFER_OUT_KEYWORDS = ["INTERNET XFER TO","XFER TO CHKG","XFER TO SAV","TRANSFER TO","ONLINE TRANSFER TO","FUNDS TRANSFER OUT","MOBILE XFER TO","WITHDRAWAL TRANSFER TO","COMPUTERLINE TRANSFER TO","COMPUTERLINE M2M"];
function detectTransfer(concept) {
  const upper = concept.toUpperCase();
  const isIn  = TRANSFER_IN_KEYWORDS.some(k => upper.includes(k));
  const isOut = TRANSFER_OUT_KEYWORDS.some(k => upper.includes(k));
  if (!isIn && !isOut) return null;
  const digits = concept.match(/\b(\d{4})\b/g);
  const last4  = digits ? digits[digits.length - 1] : null;
  const cat    = isIn ? "Transfer In" : "Transfer Out";
  const label  = last4 ? `${cat} (****${last4})` : cat;
  return { category: cat, level:"TRANSFER", enrichedConcept: label };
}
function detectCheck(concept) {
  const upper = concept.toUpperCase();
  if (!upper.includes("CHECK") && !upper.match(/\bCHK\b/) && !upper.match(/\bCK#?\b/) && !upper.includes("DRAFT")) return null;
  const numMatch = concept.match(/(?:CHECK|CHK|CK#?|DRAFT)\s*#?\s*(\d+)/i);
  const checkNum = numMatch ? numMatch[1] : null;
  let payee = null;
  const afterNum = numMatch
    ? concept.slice((concept.toLowerCase().indexOf(numMatch[0].toLowerCase())) + numMatch[0].length).trim()
    : concept.replace(/check|chk|ck#?|draft/gi,"").trim();
  const nameMatch = afterNum.match(/([A-Za-z][A-Za-z\s]{2,40})/);
  if (nameMatch) payee = nameMatch[1].trim().replace(/\s+/g," ");
  const parts = ["CHECK"];
  if (checkNum) parts.push(`#${checkNum}`);
  if (payee)    parts.push(`- ${payee}`);
  return { checkNum, payee, enrichedConcept: parts.join(" ") };
}
function categorize(concept, amount, isDeposit, businessType, learnedMerchants) {
  const upper = concept.toUpperCase();
  const amt   = Math.abs(parseFloat(amount) || 0);
  const transfer = detectTransfer(concept);
  if (transfer) return transfer;
  if (!isDeposit) {
    const check = detectCheck(concept);
    if (check) return { category:"Subcontractor Expense", level:"CHECK", payee:check.payee, checkNum:check.checkNum, enrichedConcept:check.enrichedConcept };
  }
  for (const [key, cat] of Object.entries(learnedMerchants)) {
    if (upper.includes(key.toUpperCase())) return { category:cat, level:"MEMORY" };
  }
  if (upper.includes("INTUIT")) {
    if (upper.includes("PAYROLL") || upper.includes("PAYR"))
      return { category:"Payroll & Wages", level:"HARD" };
    if (upper.includes("QBOOKS") || upper.includes("QUICKBOOKS") || upper.includes("TURBO") || upper.includes("SUBSCR"))
      return { category:"Software & Subscriptions", level:"HARD" };
    if (/INTUIT\s+\d{8,}/.test(upper))
      return { category:"Payroll & Wages", level:"HARD" };
    return { category:"ASK TO CLIENT", level:"ASK", reason:"Intuit — ¿Payroll, QuickBooks o TurboTax?" };
  }
  if (isDeposit) {
    if (upper.includes("ZELLE") && upper.includes("TRANSFER IN")) return { category:"ASK TO CLIENT", level:"ASK", reason:"Zelle recibido — ¿Income o Owner Investment?" };
    if (amt >= 1000) return { category:"Income - Services", level:"HARD" };
    if (upper.includes("DEPOSIT") && !upper.includes("ACH")) return { category:"ASK TO CLIENT", level:"ASK", reason:"Depósito no identificado" };
  }
  if (upper.includes("ATM CASH") || upper.includes("ATM W/D") || upper.includes("CUSTOMER WITHDRAWAL")) {
    return { category:"ASK TO CLIENT", level:"ASK", reason:"ATM — ¿Owner Draw o gasto en efectivo?" };
  }
  if (upper.includes("ZELLE") && (upper.includes("TRANSFER OUT") || upper.includes("PAYMENT TO"))) {
    return { category:"ASK TO CLIENT", level:"ASK", reason:"Zelle — ¿Subcontractor, Payroll o Personal?" };
  }
  for (const entry of MERCHANT_DICT) {
    if (entry.patterns.some(p => upper.includes(p.toUpperCase()))) {
      if (entry.amountRule?.under15 && amt < 15) return { category:entry.amountRule.under15, level:"HARD" };
      if (typeof entry.category === "object") {
        const cat = entry.category[businessType] || entry.category.general || "ASK TO CLIENT";
        // Si el merchant es gasto pero el dinero entró → es ingreso
        if (isDeposit && !["Income - Services","Other Income","Loan Proceeds","Owner Investment","Transfer In","Refund Received","ASK TO CLIENT"].includes(cat)) {
          return { category:"Income - Services", level:"HARD" };
        }
        return { category:cat, level:"BUSINESS" };
      }
      // Si el merchant es gasto pero el dinero entró → es ingreso
      if (isDeposit && !["Income - Services","Other Income","Loan Proceeds","Owner Investment","Transfer In","Refund Received","ASK TO CLIENT"].includes(entry.category)) {
        return { category:"Income - Services", level:"HARD" };
      }
      return { category:entry.category, level:"HARD" };
    }
  }
  return { category:"ASK TO CLIENT", level:"ASK", reason:"Merchant no identificado" };
}
// ─── CLAUDE API ───────────────────────────────────────────────────────────────
async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:8000, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("") || "";
}
// ─── AGENT 0: DETECT BANK ────────────────────────────────────────────────────
async function detectBank(b64) {
  const system = `You are a bank statement identifier.
Read ONLY the first page of this PDF and return ONLY a valid JSON object with:
- bank_name: exact name of the bank as shown on the statement
- bank_id: one of these exact values: "mabrey_bank", "bank_of_oklahoma", "arvest_bank", "bank_of_america", "chase", or "unknown"
- total_pages: total number of pages in this statement (look for "Page X of Y" or "Página X de Y")
- period_start: start date MM/DD/YYYY
- period_end: end date MM/DD/YYYY
- total_deposits: total deposits amount from summary (number only, no $ sign)
- total_withdrawals: total withdrawals amount from summary (number only, no $ sign)
IMPORTANT for total_withdrawals by bank:
- BANK OF AMERICA: total_withdrawals = "Withdrawals and other debits" + "Checks" + "Service fees" (sum all three)
- BANK OF OKLAHOMA: total_withdrawals = "Checks & Withdrawals" + "Service Fees" (sum both lines)
  Example: "354 Checks & Withdrawals 459,684.22" + "Service Fees 45.00" = 459729.22
- ALL OTHER BANKS: total_withdrawals = the single withdrawals/debits line shown
To identify bank_id use these clues:
- "Mabrey Bank" or "MabreyBank" → "mabrey_bank"
- "Bank of Oklahoma" or "BOK" or "bok.com" → "bank_of_oklahoma"
- "Arvest" or "arvest.com" → "arvest_bank"
- "Bank of America" or "bankofamerica.com" or "BANK OF AMERICA" → "bank_of_america"
- "Chase" or "JPMorgan Chase" or "chase.com" → "chase"
- "MSU Federal Credit Union" or "MSUFCU" or "msufcu.org" or "MSU FCU" or "1-800-MSU-4YOU" → "msu_federal_credit_union"
- "Mercury" or "mercury.com" or "Mercury Bank" → "mercury_bank"
- Any other bank → "unknown"
Respond ONLY with valid JSON. No markdown. No explanation.
Example: {"bank_name":"Mabrey Bank","bank_id":"mabrey_bank","total_pages":16,"period_start":"02/02/2026","period_end":"03/01/2026","total_deposits":75616.02,"total_withdrawals":86217.03}`;
  const text = await callClaude([{ role:"user", content:[
    { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
    { type:"text", text:"Identify this bank statement. Return JSON only." }
  ]}], system);
  try {
    const clean = text.replace(/```json|```/g,"").trim();
    return JSON.parse(clean);
  } catch {
    return { bank_name:"Desconocido", bank_id:"unknown", total_pages:0, period_start:"", period_end:"", total_deposits:0, total_withdrawals:0 };
  }
}
// ─── AGENT 1: EXTRACT TRANSACTIONS ───────────────────────────────────────────
async function extractTransactions(b64, bankId = "default") {
  const bankSpecificInstructions = BANK_PROMPTS[bankId] || BANK_PROMPTS.default;
  const skipCheckSummaryRule = bankId === "msu_federal_credit_union"
    ? "DO NOT extract from the Cleared Check Summary table or any summary/totals pages — those transactions are already in the main ledger as Draft lines and would create duplicates."
    : 'Also extract ALL checks from any "Cleared Check Summary", "Checks Paid", "Draft Summary", or similar table.';
  const system = `You are a STRICT bank statement extraction agent. Your job is to extract EVERY single transaction with ZERO omissions.
${bankSpecificInstructions}
UNIVERSAL CRITICAL RULES:
1. Extract ALL transactions from the main ledger (line by line transactions).
2. ${skipCheckSummaryRule}
3. De-duplicate: if a transaction appears in BOTH the main ledger AND a summary table, include it ONCE only.
4. NEVER skip, group, summarize, or invent transactions.
5. DATE format: MM/DD/YYYY. DEPOSITS positive. WITHDRAWALS negative (use minus sign).
6. Output ONLY raw CSV with columns: TYPE,DATE,AMOUNT,CONCEPT
7. TYPE = DEPOSIT or WITHDRAWAL only. No headers. No markdown. No explanation.
8. Include ALL: fees, ATM, transfers, dividends, POS, ACH, drafts, checks, wire transfers.
9. Exclude ONLY: balance rows, running balance values, summary totals, account header rows, blank pages.
10. CHECK IMAGES: If PDF contains check images, extract beneficiary name as "CHECK #[number] - [Name]".`;
  const text = await callClaude([{ role:"user", content:[
    { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
    { type:"text", text:"Extract ALL transactions. Raw CSV: TYPE,DATE,AMOUNT,CONCEPT" }
  ]}], system);
  const rows = [];
  text.trim().split("\n").forEach(line => {
    const parts = line.split(",");
    if (parts.length < 4) return;
    const type    = parts[0].trim().toUpperCase();
    const date    = parts[1].trim();
    const amount  = parts[2].trim();
    const concept = parts.slice(3).join(",").trim().replace(/^"|"$/g,"");
    if ((type==="DEPOSIT"||type==="WITHDRAWAL") && date && amount && concept)
      rows.push({ type, date, amount, concept, category:"", level:"" });
  });
  if (bankId === "msu_federal_credit_union") {
    const seenNums = new Set();
    return rows.filter(row => {
      const upper = row.concept.toUpperCase();
      const m = upper.match(/(?:CHECK\s*#?|DRAFT\s*)(\d{3,6})/);
      if (m) {
        if (seenNums.has(m[1])) return false;
        seenNums.add(m[1]);
      }
      return true;
    });
  }
  return rows;
}

// ─── AGENT 2: EXTRACT BALANCES ────────────────────────────────────────────────
async function extractBalances(b64) {
  const system = `You are a bank statement balance extraction agent.
Extract ALL account/subaccount balances from the statement.
For EACH account/subaccount found, extract:
- account_name, account_number (last 4 or "N/A"), beginning_balance, total_deposits, total_withdrawals, ending_balance, period_start, period_end
IMPORTANT — Different banks use different formats:
MABREY BANK format (page 1 summary box):
- Look for lines like "X Deposits $XX,XXX.XX" and "X Checks/Debits $XX,XXX.XX"
- beginning_balance and ending_balance may not be shown — use 0 if not found
- total_deposits = the Deposits amount
- total_withdrawals = the Checks/Debits amount
ARVEST BANK format (page 1 Account Summary):
- "8 Credit(s) This Period $XX,XXX.XX" = total_deposits
- "143 Debit(s) This Period $XX,XXX.XX" = total_withdrawals
- Beginning Balance and Ending Balance are shown explicitly
BANK OF OKLAHOMA (BOK) format (page 1 summary box):
- Look for the summary block that shows:
  "$ Starting Balance  XXX,XXX.XX"
  "+ XX Deposits  XXX,XXX.XX"
  "- XXX Checks & Withdrawals  XXX,XXX.XX"
  "- Service Fees  XX.XX"
  "= Ending Balance  XXX,XXX.XX"
- beginning_balance = Starting Balance amount
- total_deposits = Deposits amount (the "+ XX Deposits" line)
- CRITICAL: total_withdrawals = Checks & Withdrawals + Service Fees (sum BOTH lines)
  Example: "354 Checks & Withdrawals 459,684.22" + "Service Fees 45.00" = total_withdrawals: 459729.22
- ending_balance = Ending Balance amount
- account_number = the PRIMARY ACCOUNT number shown on page 1
- period_start and period_end = from "Statement Period: MM-DD-YY to MM-DD-YY" → convert to MM/DD/YYYY
BANK OF AMERICA format (page 1 Account summary):
- "Deposits and other credits $X,XXX.XX" = total_deposits
- "Withdrawals and other debits -$X,XXX.XX" = withdrawals_electronic
- "Checks -$X,XXX.XX" = checks_total
- CRITICAL: total_withdrawals = withdrawals_electronic + checks_total (sum BOTH lines)
  Example: "Withdrawals and other debits -32,690.30" + "Checks -34,394.32" = total_withdrawals: 67084.62
- If no Checks line exists, total_withdrawals = withdrawals_electronic only
- Service fees line: add to total_withdrawals if non-zero
- Beginning balance and Ending balance are shown explicitly — extract both
CHASE format (page 1 RESUMEN DE CUENTA / ACCOUNT SUMMARY):
- "Depósitos y Adiciones" or "Deposits and Additions" = total_deposits
- "Retiros Electrónicos" or "Electronic Withdrawals" = total_withdrawals
MSU FEDERAL CREDIT UNION format (last summary pages):
- This statement has 3 sub-accounts: SPARTAN SAVER, IMMA, and SMALL BUSINESS CHECKING.
- Return ONLY ONE consolidated object for the entire statement. Do NOT return 3 separate objects.
- account_name: "MSU FCU - Consolidated"
- account_number: the primary account number shown on page 1
- period_start and period_end: from the statement period shown on page 1
- beginning_balance: sum of the 3 "Balance Forward" values (one per sub-account)
- ending_balance: sum of the 3 "Ending Balance" values (one per sub-account)
- total_deposits: sum of all deposits across the 3 sub-accounts:
  * SMALL BUSINESS CHECKING: "XX Deposits and Other Credits for $XX,XXX.XX"
  * SPARTAN SAVER: sum individual deposit lines within that section (including dividends)
  * IMMA: sum individual deposit lines within that section (including dividends)
- total_withdrawals: sum of all withdrawals across the 3 sub-accounts:
  * SMALL BUSINESS CHECKING: electronic_withdrawals + cleared_checks (sum both)
    Example: "119 Withdrawals for $82,905.73" + "45 Cleared Checks for $50,888.35" = 133794.08
  * SPARTAN SAVER: sum individual withdrawal lines within that section
  * IMMA: sum individual withdrawal lines within that section
DEFAULT: Look for Beginning Balance, Total Deposits, Total Withdrawals, Ending Balance in any summary table.
If beginning_balance or ending_balance are not shown, use 0.
Respond ONLY with valid JSON array. No markdown. No explanation.
Example: [{"account_name":"Business Checking","account_number":"1234","beginning_balance":5000.00,"total_deposits":10000.00,"total_withdrawals":8000.00,"ending_balance":7000.00,"period_start":"01/01/2024","period_end":"01/31/2024"}]`;
  const text = await callClaude([{ role:"user", content:[
    { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
    { type:"text", text:"Extract all account balances as JSON array. Look on page 1 for any summary of deposits and withdrawals/debits." }
  ]}], system);
  try {
    const clean = text.replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(clean);
    if (parsed.length > 0) {
      const hasData = parsed.some(b =>
        (parseFloat(b.total_deposits)||0) > 0 || (parseFloat(b.total_withdrawals)||0) > 0
      );
      if (!hasData) return [];
    }
    return parsed;
  } catch { return []; }
}
// ─── SECOND PASS ──────────────────────────────────────────────────────────────
async function extractTransactionsSecondPass(b64, missingDeposits, missingWithdrawals, existingRows, bankId = "default") {
  const system = `You are a STRICT bank statement extraction agent doing a SECOND PASS for ${bankId.replace(/_/g," ").toUpperCase()}.
A first extraction already found some transactions but is MISSING some.
Focus on finding transactions near the end of the document, summary tables, and any missed pages.
Output ONLY raw CSV: TYPE,DATE,AMOUNT,CONCEPT.
TYPE = DEPOSIT or WITHDRAWAL only. DATE: MM/DD/YYYY. DEPOSITS positive, WITHDRAWALS negative.
No headers, no markdown, no explanation.`;
  const text = await callClaude([{ role:"user", content:[
    { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
    { type:"text", text:`SECOND PASS. Already found ${existingRows.length} transactions. Missing ~$${missingDeposits.toFixed(2)} deposits and ~$${missingWithdrawals.toFixed(2)} withdrawals. Return ONLY new transactions. Raw CSV: TYPE,DATE,AMOUNT,CONCEPT` }
  ]}], system);
  const rows = [];
  text.trim().split("\n").forEach(line => {
    const parts = line.split(",");
    if (parts.length < 4) return;
    const type    = parts[0].trim().toUpperCase();
    const date    = parts[1].trim();
    const amount  = parts[2].trim();
    const concept = parts.slice(3).join(",").trim().replace(/^"|"$/g,"");
    if ((type==="DEPOSIT"||type==="WITHDRAWAL") && date && amount && concept)
      rows.push({ type, date, amount, concept, category:"", level:"" });
  });
  return rows;
}
// ─── CHECK SUMMARY PASS ───────────────────────────────────────────────────────
async function extractCheckSummary(b64, bankId = "default") {
  const bankPrompt = BANK_PROMPTS[bankId] || BANK_PROMPTS.default;
  const system = `You are a STRICT check/draft extraction agent.
${bankPrompt}
Your ONLY job now is to find the check summary table (CHECKS PAID, Cleared Checks, Draft Summary).
Extract EVERY check as one WITHDRAWAL row.
Output ONLY raw CSV: TYPE,DATE,AMOUNT,CONCEPT.
AMOUNT must be negative. No headers. No markdown.`;
  const text = await callClaude([{ role:"user", content:[
    { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
    { type:"text", text:"Find ONLY the check summary table. Extract every check as WITHDRAWAL rows. Raw CSV: TYPE,DATE,AMOUNT,CONCEPT" }
  ]}], system);
  const rows = [];
  text.trim().split("\n").forEach(line => {
    const parts = line.split(",");
    if (parts.length < 4) return;
    const type    = parts[0].trim().toUpperCase();
    const date    = parts[1].trim();
    const amount  = parts[2].trim();
    const concept = parts.slice(3).join(",").trim().replace(/^"|"$/g,"");
    if (type === "WITHDRAWAL" && date && amount && concept)
      rows.push({ type, date, amount, concept, category:"", level:"" });
  });
  return rows;
}
// ─── STORAGE ──────────────────────────────────────────────────────────────────
const sc = async (id) => {
  try { const v = localStorage.getItem(`client:${id}`); return v ? JSON.parse(v) : null; } catch { return null; }
};
const ss = async (id, d) => {
  try { localStorage.setItem(`client:${id}`, JSON.stringify(d)); } catch {}
};
const sl = async () => {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith("client:"))
      .map(k => k);
  } catch { return []; }
};
const fmt = (n) => Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]             = useState("home");
  const [clients, setClients]           = useState([]);
  const [clientId, setClientId]         = useState("");
  const [clientData, setClientData]     = useState(null);
  const [newName, setNewName]           = useState("");
  const [newType, setNewType]           = useState("");
  const [file, setFile]                 = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [askQueue, setAskQueue]         = useState([]);
  const [currentAsk, setCurrentAsk]     = useState(0);
  const [progress, setProgress]         = useState({ text:"", pct:0 });
  const [dragOver, setDragOver]         = useState(false);
  const [balances, setBalances]         = useState([]);
  const [splitMode, setSplitMode]       = useState(false);
  const [splitParts, setSplitParts]     = useState([]);
  const [splitPartNum, setSplitPartNum] = useState(1);
  const [selectedCat, setSelectedCat]   = useState("");
  const [bankInfo, setBankInfo]         = useState(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [dedupMarked, setDedupMarked]   = useState({});
  const fileRef = useRef();
  const splitPartNumRef = useRef(1);
  const splitModeRef    = useRef(false);
  const bankInfoRef     = useRef(null);
  const balancesRef     = useRef([]);
  const splitPartsRef   = useRef([]);
  splitPartNumRef.current = splitPartNum;
  splitModeRef.current    = splitMode;
  bankInfoRef.current     = bankInfo;
  balancesRef.current     = balances;
  splitPartsRef.current   = splitParts;
  const clearSplitCache = () => {
    bankInfoRef.current  = null;
    balancesRef.current  = [];
  };
  useEffect(() => {
    loadList();
    clearSplitCache();
  }, []);
  async function loadList() {
    const keys = await sl();
    const loaded = [];
    for (const k of keys) { const d=await sc(k.replace("client:","")); if(d) loaded.push({id:k.replace("client:",""),...d}); }
    setClients(loaded);
  }
  async function createClient() {
    if (!newName.trim() || !newType) return;
    const id   = newName.toLowerCase().replace(/\s+/g,"_")+"_"+Date.now();
    const data = { name:newName.trim(), businessType:newType, learnedMerchants:{}, history:[] };
    await ss(id,data);
    setClientId(id); setClientData(data);
    await loadList();
    setNewName(""); setNewType("");
    setScreen("upload");
  }
  async function selectClient(id) {
    const data = await sc(id);
    setClientId(id); setClientData(data);
    setScreen("upload");
  }
  const setP = (text, pct) => setProgress({ text, pct });
  async function runExtraction() {
    if (!file || !clientData) return;
    setScreen("extracting");
    setP("Agente 0: Leyendo PDF...", 3);
    const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });

    const currentPartNum  = splitPartNumRef.current;
    const currentSplitMode = splitModeRef.current;

    // ── AGENT 0: Detect bank ──
    let detectedBank;
    if (!currentSplitMode || currentPartNum === 1) {
      setP("Agente 0: Identificando banco...", 5);
      detectedBank = await detectBank(b64);
      setBankInfo(detectedBank);
      bankInfoRef.current = detectedBank;
    } else {
      detectedBank = bankInfoRef.current || { bank_name:"Desconocido", bank_id:"unknown", total_pages:0, period_start:"", period_end:"", total_deposits:0, total_withdrawals:0 };
      setP(`Agente 0: Banco ya identificado — ${detectedBank.bank_name}`, 5);
    }

    // ── 🚨 BLOQUEO: PDF mayor a 9 páginas sin Split Mode activo ──
    if ((detectedBank.total_pages || 0) > 9 && !currentSplitMode) {
      setBankInfo(detectedBank);
      setP(`❌ PDF de ${detectedBank.total_pages} páginas — activa Modo Split`, 100);
      setTimeout(() => { setScreen("upload"); }, 800);
      return;
    }

    const bankId = detectedBank.bank_id || "unknown";
    const totalPages = detectedBank.total_pages || 0;
    setP(`✅ Banco: ${detectedBank.bank_name} · ${totalPages} páginas`, 8);

    // ── AGENT 1: Extract transactions ──
    setP("Agente 1: Extrayendo transacciones...", 12);
    const rows = await extractTransactions(b64, bankId);
    setP(`✅ ${rows.length} transacciones encontradas`, 35);

    // ── AGENT 2: Extract balances ──
    let bals;
    if (!currentSplitMode || currentPartNum === 1) {
      setP("Agente 2: Extrayendo saldos...", 40);
      bals = await extractBalances(b64);
      setBalances(bals);
      balancesRef.current = bals;
      setP(`✅ ${bals.length} cuenta(s) detectada(s)`, 48);
    } else {
      bals = balancesRef.current.length > 0 ? balancesRef.current : [];
      setP(`✅ Saldos de Parte 1 conservados — ${bals.length} cuenta(s) · Banco: ${detectedBank.bank_name}`, 48);
    }

    // ── SMART MULTI-PASS ──
    let allRows = rows;
    if (bals.length > 0) {
      const bankDep  = bals.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
      const bankWith = bals.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
      const previousParts = splitPartsRef.current.filter(Boolean);
      const previousRows  = previousParts.flat();
      const allRowsSoFar  = [...previousRows, ...rows];
      const extractedDep  = allRowsSoFar.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
      const extractedWith = allRowsSoFar.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
      const withDiff = bankWith - extractedWith;
      const depDiff  = bankDep  - extractedDep;
      if (withDiff > 50) {
        setP(`⚡ Agente 2A: Buscando cheques faltantes ($${withDiff.toFixed(0)})...`, 52);
        const checkRows = await extractCheckSummary(b64, bankId);
        const newCheckRows = checkRows.filter(cr => {
          const crAmt = Math.abs(parseFloat(cr.amount)||0).toFixed(2);
          return !allRowsSoFar.some(r => {
            const rAmt = Math.abs(parseFloat(r.amount)||0).toFixed(2);
            return r.type === "WITHDRAWAL" && rAmt === crAmt;
          });
        });
        allRows = [...rows, ...newCheckRows];
        setP(`✅ Pasada cheques: +${newCheckRows.length} encontrados`, 60);
      }
      const allRowsUpdated = [...previousRows, ...allRows];
      const newExtDep  = allRowsUpdated.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
      const newExtWith = allRowsUpdated.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
      const remDepDiff  = bankDep  - newExtDep;
      const remWithDiff = bankWith - newExtWith;
      if (remDepDiff > 50 || remWithDiff > 50) {
        setP(`⚡ Agente 2B: Buscando transacciones adicionales ($${Math.max(remDepDiff,remWithDiff).toFixed(0)})...`, 63);
        const secondRows = await extractTransactionsSecondPass(b64, remDepDiff > 0 ? remDepDiff : 0, remWithDiff > 0 ? remWithDiff : 0, allRows, bankId);
        const newRows = secondRows.filter(sr =>
          !allRowsUpdated.some(r => r.date === sr.date && r.amount === sr.amount && r.type === sr.type)
        );
        allRows = [...allRows, ...newRows];
        setP(`✅ Pasada adicional: +${newRows.length} más encontradas`, 68);
      }
    }

    // ── AGENT 3: Categorize ──
    setP("Agente 3: Categorizando transacciones...", 72);
    const categorized = allRows.map(row => {
      const isDeposit = row.type==="DEPOSIT";
      const result = categorize(row.concept, row.amount, isDeposit, clientData.businessType, clientData.learnedMerchants||{});
      return { ...row, concept: result.enrichedConcept||row.concept, category:result.category, level:result.level, reason:result.reason||"", payee:result.payee||null, checkNum:result.checkNum||null };
    });
    setP("✅ Categorización completada", 85);
    let finalTransactions = categorized;
    if (currentSplitMode) {
      const currentParts = [...splitPartsRef.current];
      currentParts[currentPartNum - 1] = categorized;
      finalTransactions = currentParts.filter(Boolean).flat();
    }
    const asks = finalTransactions.filter(r=>r.category==="ASK TO CLIENT");
    setTransactions(finalTransactions);
    setAskQueue(asks); setCurrentAsk(0);
    setP("✅ Procesamiento completado", 100);
    setTimeout(() => {
      if (currentSplitMode) {
        setSplitParts(prev => {
          const updated = [...prev];
          updated[currentPartNum - 1] = categorized;
          return updated;
        });
        setSplitPartNum(prev => Math.max(prev, currentPartNum + 1));
        setScreen("reconcile");
      } else {
        setScreen("reconcile");
      }
    }, 600);
  }
  function resolveAsk(category, learn, learnKey) {
    const ask = askQueue[currentAsk];
    const updated = [...transactions];
    const idx = transactions.findIndex(t=>t===ask);
    updated[idx] = { ...updated[idx], category, level:"RESOLVED" };
    setTransactions(updated);
    if (learn && learnKey) {
      const nl = { ...(clientData.learnedMerchants||{}), [learnKey]:category };
      const nd = { ...clientData, learnedMerchants:nl };
      setClientData(nd); ss(clientId,nd);
    }
    if (currentAsk+1<askQueue.length) setCurrentAsk(currentAsk+1);
    else setScreen("review");
  }
  function applyDedup(markedKeys) {
    const cleaned = transactions.filter((r, i) => {
      const key = r.concept + "||" + Math.abs(parseFloat(r.amount)||0).toFixed(2) + "||" + i;
      return !markedKeys.has(key);
    });
    const newAsks = cleaned.filter(r => r.category === "ASK TO CLIENT");
    setTransactions(cleaned);
    setAskQueue(newAsks);
    setCurrentAsk(0);
    setDedupMarked({});
    setScreen("reconcile");
  }
  function updateCategory(idx, cat) {
    setTransactions(prev=>prev.map((r,i)=>i===idx?{...r,category:cat}:r));
  }
  async function finalize() {
    const entry = { date:new Date().toISOString().split("T")[0], file:file?.name, bank:bankInfo?.bank_name||"", depositsCount:transactions.filter(r=>r.type==="DEPOSIT").length, withdrawalsCount:transactions.filter(r=>r.type==="WITHDRAWAL").length, askCount:transactions.filter(r=>r.category==="ASK TO CLIENT").length };
    const nd = { ...clientData, history:[...(clientData.history||[]),entry] };
    setClientData(nd); await ss(clientId,nd); setScreen("done");
  }
  function fmtDate(d) {
    // Convierte MM/DD/YYYY → DD-MM-YYYY
    if (!d) return d;
    const parts = d.split("/");
    if (parts.length === 3) return `${parts[1]}-${parts[0]}-${parts[2]}`;
    return d;
  }
  function triggerDownload(filename, csvContent) {
    const encoded = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const a = document.createElement("a");
    a.setAttribute("href", encoded);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  function downloadWave(type) {
    const rows = transactions.filter(r=>r.type===type);
    const csv = "DATE,AMOUNT,*,CONCEPT,CATEGORY\n" + rows.map(r=>`${fmtDate(r.date)},${r.amount},,"${r.concept}","${r.category}"`).join("\n");
    triggerDownload(`wave_${type.toLowerCase()}_import.csv`, csv);
  }
  function downloadCSV() {
    const csv = "DATE,AMOUNT,*,CONCEPT,CATEGORY\n" + transactions.map(r=>`${fmtDate(r.date)},${r.amount},,"${r.concept}","${r.category}"`).join("\n");
    triggerDownload(`wave_completo_${(clientData?.name||"client").replace(/\s/g,"_")}.csv`, csv);
  }
  function downloadByCategory(cat) {
    if (!cat) return;
    const rows = transactions.filter(r => r.category === cat);
    if (rows.length === 0) return;
    const safeName = cat.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const clientName = (clientData?.name || "client").replace(/\s/g, "_");
    const csv = rows.map(r => `${fmtDate(r.date)},${r.amount},,"${r.concept}","${r.category}"`).join("\n");
    triggerDownload(`${clientName}_${safeName}.csv`, csv);
  }
  function downloadPnL() {
    const clientName = (clientData?.name || "client").replace(/\s/g, "_");
    const fmt2 = (n) => Number(n||0).toFixed(2);
    const INCOME_CATS        = ["Income - Services", "Other Income"];
    // ── CAMBIO 6: COGS_CATS y OPEX_CATS actualizados ──
    const COGS_CATS          = ["Materials","COGS - Fuel (Production)","Subcontractor Expense"];
    const OPEX_CATS          = ["Payroll & Wages","Payroll Tax","Legal & Professional Services","Licenses & Permits","Advertising & Marketing","Bank Fees","Insurance","Rent & Lease","Repairs & Maintenance","Software & Subscriptions","Taxes & Licenses","Telephone & Internet","Travel & Transportation","Uniforms","Utilities","Vehicle - Fuel (Non-Production)","Vehicle - Maintenance","Operating Expenses - Supplies","Operating Expenses - Delivery & Postage","Operating Expenses - Parking","Office Supplies","Meals & Entertainment"];
    const OTHER_INCOME_CATS  = ["Refund Received"];
    const OTHER_EXPENSE_CATS = ["Donations"];
    const PERSONAL_CATS      = ["Owner Draw","Personal Payment","Loan Payment","Transfer Out","Transfer In"];
    const sumByCat = (cats) => {
      const result = {};
      cats.forEach(cat => {
        const total = transactions.filter(r => r.category === cat).reduce((s,r) => s + Math.abs(parseFloat(r.amount)||0), 0);
        if (total > 0) result[cat] = total;
      });
      return result;
    };
    const incomeDetail   = sumByCat(INCOME_CATS);
    const cogsDetail     = sumByCat(COGS_CATS);
    const opexDetail     = sumByCat(OPEX_CATS);
    const otherIncDetail = sumByCat(OTHER_INCOME_CATS);
    const otherExpDetail = sumByCat(OTHER_EXPENSE_CATS);
    const personalDetail = sumByCat(PERSONAL_CATS);
    const totalIncome    = Object.values(incomeDetail).reduce((a,b)=>a+b,0);
    const totalCOGS      = Object.values(cogsDetail).reduce((a,b)=>a+b,0);
    const grossProfit    = totalIncome - totalCOGS;
    const totalOpex      = Object.values(opexDetail).reduce((a,b)=>a+b,0);
    const totalOtherInc  = Object.values(otherIncDetail).reduce((a,b)=>a+b,0);
    const totalOtherExp  = Object.values(otherExpDetail).reduce((a,b)=>a+b,0);
    const netProfit      = grossProfit - totalOpex + totalOtherInc - totalOtherExp;
    const totalPersonal  = Object.values(personalDetail).reduce((a,b)=>a+b,0);
    // ── Generar opinión automática basada en números ──
    const marginPct = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
    const grossPct  = totalIncome > 0 ? Math.round((grossProfit / totalIncome) * 100) : 0;
    const opexPct   = totalIncome > 0 ? Math.round((totalOpex / totalIncome) * 100) : 0;
    let opinion = "";
    let opinionColor = "#166534";
    if (totalIncome === 0) {
      opinion = "⚠️ No se registraron ingresos en este período. Verifica que las transacciones estén correctamente categorizadas.";
      opinionColor = "#991b1b";
    } else if (marginPct >= 40) {
      opinion = `✅ Excelente mes. Margen neto del ${marginPct}% — el negocio está muy saludable. Los gastos operativos están bien controlados (${opexPct}% de los ingresos).`;
      opinionColor = "#166534";
    } else if (marginPct >= 20) {
      opinion = `👍 Buen mes. Margen neto del ${marginPct}%. Hay oportunidad de mejorar reduciendo gastos operativos que representan el ${opexPct}% de los ingresos.`;
      opinionColor = "#1a56db";
    } else if (marginPct >= 0) {
      opinion = `⚠️ Margen neto bajo (${marginPct}%). El negocio es rentable pero ajustado. Revisar gastos operativos (${opexPct}% de ingresos) para mejorar la utilidad.`;
      opinionColor = "#92400e";
    } else {
      opinion = `🚨 Mes con pérdida neta de $${fmt2(Math.abs(netProfit))}. Los gastos superaron los ingresos. Requiere atención inmediata en control de gastos.`;
      opinionColor = "#991b1b";
    }

    // ── Construir secciones HTML ──
    const incomeRows = Object.entries(incomeDetail).map(([cat,amt]) =>
      `<tr><td class="cat">${cat}</td><td class="amt green">$${fmt2(amt)}</td></tr>`).join("");
    const cogsRows = Object.entries(cogsDetail).map(([cat,amt]) =>
      `<tr><td class="cat">${cat}</td><td class="amt red">$${fmt2(amt)}</td></tr>`).join("");
    const opexRows = Object.entries(opexDetail).map(([cat,amt]) =>
      `<tr><td class="cat">${cat}</td><td class="amt red">$${fmt2(amt)}</td></tr>`).join("");
    const otherIncRows = Object.entries(otherIncDetail).map(([cat,amt]) =>
      `<tr><td class="cat">${cat}</td><td class="amt green">$${fmt2(amt)}</td></tr>`).join("");
    const otherExpRows = Object.entries(otherExpDetail).map(([cat,amt]) =>
      `<tr><td class="cat">${cat}</td><td class="amt red">$${fmt2(amt)}</td></tr>`).join("");

    const personalRows = PERSONAL_CATS.map(cat => {
      const txs = transactions.filter(r => r.category === cat);
      if (txs.length === 0) return "";
      const catTotal = txs.reduce((s,r) => s + Math.abs(parseFloat(r.amount)||0), 0);
      const txRows = txs.map(r =>
        `<tr><td class="cat" style="padding-left:28px;color:#64748b">${fmtDate(r.date)} — ${r.concept}</td><td class="amt" style="color:#64748b">$${fmt2(Math.abs(parseFloat(r.amount)||0))}</td></tr>`
      ).join("");
      return `
        <tr class="section-sub"><td class="cat" style="font-weight:700">${cat}</td><td></td></tr>
        ${txRows}
        <tr class="subtotal-row"><td class="cat"><span class="subtotal-lbl" data-cat="${cat}">Subtotal ${cat}</span></td><td class="amt">$${fmt2(catTotal)}</td></tr>`;
    }).join("");

    const today2 = new Date().toLocaleDateString("es-MX", {day:"2-digit",month:"long",year:"numeric"});
    const periodStart = balances[0]?.period_start || "";
    const periodEnd   = balances[0]?.period_end || "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>P&L — ${clientData?.name || ""}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#f0f4f8;color:#1a1a1a;padding:32px;font-size:13px}
  .no-print{background:#1a56db;color:#fff;padding:10px 18px;border-radius:8px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
  .no-print button{background:#fff;color:#1a56db;border:none;border-radius:6px;padding:6px 18px;font-weight:700;cursor:pointer;font-size:12px}
  .wrapper{max-width:780px;margin:0 auto}
  .header{background:linear-gradient(135deg,#0f1f4b 0%,#1a56db 100%);color:#fff;padding:28px 32px;border-radius:16px 16px 0 0}
  .header h1{font-size:22px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px}
  .header .meta{font-size:12px;opacity:0.75;display:flex;gap:24px;flex-wrap:wrap;margin-top:8px}
  .header .meta span{display:flex;align-items:center;gap:4px}
  .opinion{background:#fff;border-left:4px solid ${opinionColor};padding:14px 18px;margin:0;font-size:13px;color:${opinionColor};font-weight:500;line-height:1.5}
  .body{background:#fff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e2e8f0}
  .kpi{padding:18px 20px;border-right:1px solid #e2e8f0}
  .kpi:last-child{border-right:none}
  .kpi .lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
  .kpi .val{font-size:20px;font-weight:700}
  .kpi .val.green{color:#166534}
  .kpi .val.red{color:#991b1b}
  .kpi .val.blue{color:#1a56db}
  .kpi .val.neutral{color:#1a1a1a}
  table{width:100%;border-collapse:collapse}
  .section-header td{background:#0f1f4b;color:#fff;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 20px}
  .section-sub td{background:#f7f8fb;font-size:11px;color:#64748b;padding:6px 20px;text-transform:uppercase;letter-spacing:0.5px}
  tr.detail td{padding:8px 20px;border-bottom:1px solid #f1f5f9}
  tr.detail:hover td{background:#f8faff}
  .cat{text-align:left}
  .amt{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
  .amt.green{color:#166534}
  .amt.red{color:#dc2626}
  .total-row td{padding:10px 20px;font-weight:700;font-size:13px;background:#f0f4ff;border-top:2px solid #1a56db}
  .total-row .amt{color:#1a56db}
  .subtotal-row td{padding:8px 20px;font-weight:600;background:#fafafa;border-top:1px solid #e2e8f0;color:#64748b}
  .highlight-row td{padding:14px 20px;font-size:15px;font-weight:700;background:#0f1f4b;color:#fff}
  .highlight-row .amt{color:#22c55e}
  .highlight-row .amt.loss{color:#f87171}
  .spacer{height:8px;background:#f0f4f8}
  .personal-header td{background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 20px}
  .footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:16px;padding-bottom:8px}
  @media print{
    body{background:#fff;padding:16px}
    .no-print{display:none}
    .body{box-shadow:none}
  }
</style>
</head>
<body>
<div class="no-print">
  <span class="print-tip">💡 Para guardar como PDF: Archivo → Imprimir → Guardar como PDF</span>
  <div style="display:flex;gap:8px;align-items:center">
    <button id="btn-es" onclick="setLang('es')" style="background:#fff;color:#1a56db;border:none;border-radius:6px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:12px">🇲🇽 ES</button>
    <button id="btn-en" onclick="setLang('en')" style="background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.4);border-radius:6px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:12px">🇺🇸 EN</button>
    <button onclick="window.print()" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:6px 18px;font-weight:700;cursor:pointer;font-size:12px">🖨️ PDF</button>
  </div>
</div>
<script>
const T = {
  es: {
    title: "Estado de Resultados",
    client: "Cliente", bank: "Banco", generated: "Generado el",
    income: "💰 Ingresos", cogs: "🏗️ Costo de Ventas (COGS)", opex: "📋 Gastos Operativos",
    totalIncome: "TOTAL INGRESOS", totalCogs: "TOTAL COGS", totalOpex: "TOTAL GASTOS OPERATIVOS",
    grossProfit: "UTILIDAD BRUTA", netProfit: "UTILIDAD NETA",
    personal: "⚠️ Movimientos Personales y No Empresariales", totalPersonal: "TOTAL MOVIMIENTOS PERSONALES",
    subtotal: "Subtotal", printTip: "💡 Para guardar como PDF: Archivo → Imprimir → Guardar como PDF",
    opinions: {
      noIncome: "⚠️ No se registraron ingresos en este período. Verifica que las transacciones estén correctamente categorizadas.",
      excellent: (m,o) => \`✅ Excelente mes. Margen neto del \${m}% — el negocio está muy saludable. Los gastos operativos están bien controlados (\${o}% de los ingresos).\`,
      good: (m,o) => \`👍 Buen mes. Margen neto del \${m}%. Hay oportunidad de mejorar reduciendo gastos operativos que representan el \${o}% de los ingresos.\`,
      low: (m,o) => \`⚠️ Margen neto bajo (\${m}%). El negocio es rentable pero ajustado. Revisar gastos operativos (\${o}% de ingresos) para mejorar la utilidad.\`,
      loss: (v) => \`🚨 Mes con pérdida neta de $\${v}. Los gastos superaron los ingresos. Requiere atención inmediata en control de gastos.\`,
    },
    kpis: ["Ingresos Totales","Utilidad Bruta","Gastos Operativos","Utilidad Neta"],
  },
  en: {
    title: "Profit & Loss Statement",
    client: "Client", bank: "Bank", generated: "Generated on",
    income: "💰 Income", cogs: "🏗️ Cost of Goods Sold (COGS)", opex: "📋 Operating Expenses",
    totalIncome: "TOTAL INCOME", totalCogs: "TOTAL COGS", totalOpex: "TOTAL OPERATING EXPENSES",
    grossProfit: "GROSS PROFIT", netProfit: "NET PROFIT",
    personal: "⚠️ Personal & Non-Business Movements", totalPersonal: "TOTAL PERSONAL MOVEMENTS",
    subtotal: "Subtotal", printTip: "💡 To save as PDF: File → Print → Save as PDF",
    opinions: {
      noIncome: "⚠️ No income recorded in this period. Please verify transactions are correctly categorized.",
      excellent: (m,o) => \`✅ Excellent month. Net margin of \${m}% — the business is very healthy. Operating expenses are well controlled (\${o}% of revenue).\`,
      good: (m,o) => \`👍 Good month. Net margin of \${m}%. There's room to improve by reducing operating expenses, which represent \${o}% of revenue.\`,
      low: (m,o) => \`⚠️ Low net margin (\${m}%). The business is profitable but tight. Review operating expenses (\${o}% of revenue) to improve profitability.\`,
      loss: (v) => \`🚨 Net loss of $\${v} this month. Expenses exceeded revenue. Immediate attention to cost control is required.\`,
    },
    kpis: ["Total Revenue","Gross Profit","Operating Expenses","Net Profit"],
  }
};

// Datos embebidos
const DATA = {
  totalIncome: ${totalIncome},
  grossProfit: ${grossProfit},
  totalOpex: ${totalOpex},
  netProfit: ${netProfit},
  totalPersonal: ${totalPersonal},
  marginPct: ${marginPct},
  grossPct: ${grossPct},
  opexPct: ${opexPct},
  fmt2: (n) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),
};

function getOpinion(lang) {
  const t = T[lang];
  const { totalIncome, netProfit, marginPct, opexPct } = DATA;
  if (totalIncome === 0) return t.opinions.noIncome;
  if (marginPct >= 40) return t.opinions.excellent(marginPct, opexPct);
  if (marginPct >= 20) return t.opinions.good(marginPct, opexPct);
  if (marginPct >= 0)  return t.opinions.low(marginPct, opexPct);
  return t.opinions.loss(DATA.fmt2(Math.abs(netProfit)));
}

function setLang(lang) {
  const t = T[lang];
  // Título y header
  document.querySelector('h1').textContent = "📊 " + t.title;
  document.querySelector('.print-tip').textContent = t.printTip;
  // Opinión
  document.querySelector('.opinion').innerHTML = getOpinion(lang);
  // KPIs
  const kpis = document.querySelectorAll('.kpi .lbl');
  t.kpis.forEach((lbl,i) => { if(kpis[i]) kpis[i].textContent = lbl; });
  // Secciones
  const map = {
    'sec-income': t.income, 'sec-cogs': t.cogs, 'sec-opex': t.opex,
    'sec-personal': t.personal,
    'tot-income': t.totalIncome, 'tot-cogs': t.totalCogs, 'tot-opex': t.totalOpex,
    'tot-personal': t.totalPersonal,
    'lbl-gross': t.grossProfit, 'lbl-net': t.netProfit,
  };
  Object.entries(map).forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
  // Subtotales personales
  document.querySelectorAll('.subtotal-lbl').forEach(el => {
    el.textContent = t.subtotal + ' ' + el.dataset.cat;
  });
  // Botones activos
  document.getElementById('btn-es').style.background = lang === 'es' ? '#fff' : 'rgba(255,255,255,0.2)';
  document.getElementById('btn-es').style.color = lang === 'es' ? '#1a56db' : '#fff';
  document.getElementById('btn-en').style.background = lang === 'en' ? '#fff' : 'rgba(255,255,255,0.2)';
  document.getElementById('btn-en').style.color = lang === 'en' ? '#1a56db' : '#fff';
  document.getElementById('btn-en').style.border = lang === 'en' ? 'none' : '1px solid rgba(255,255,255,0.4)';
  document.getElementById('btn-es').style.border = lang === 'es' ? 'none' : '1px solid rgba(255,255,255,0.4)';
}
</script>
<div class="wrapper">
  <div class="header">
    <h1>📊 Profit & Loss Statement</h1>
    <div class="meta">
      <span>👤 ${clientData?.name || ""}</span>
      <span>🏦 ${bankInfo?.bank_name || ""}</span>
      <span>📅 ${periodStart} — ${periodEnd}</span>
      <span>🗓️ Generado el ${today2}</span>
    </div>
  </div>
  <div class="opinion">${opinion}</div>
  <div class="body">
    <div class="kpis">
      <div class="kpi"><div class="lbl">Ingresos Totales</div><div class="val green">$${fmt2(totalIncome)}</div></div>
      <div class="kpi"><div class="lbl">Utilidad Bruta</div><div class="val blue">$${fmt2(grossProfit)}</div></div>
      <div class="kpi"><div class="lbl">Gastos Operativos</div><div class="val red">$${fmt2(totalOpex)}</div></div>
      <div class="kpi"><div class="lbl">Utilidad Neta</div><div class="val ${netProfit >= 0 ? 'green' : 'red'}">$${fmt2(netProfit)}</div></div>
    </div>
    <table>
      <tr class="section-header"><td colspan="2" id="sec-income">💰 Ingresos</td></tr>
      ${incomeRows}
      ${otherIncRows ? `${otherIncRows}` : ""}
      <tr class="total-row"><td class="cat" id="tot-income">TOTAL INGRESOS</td><td class="amt">$${fmt2(totalIncome + totalOtherInc)}</td></tr>
      ${totalCOGS > 0 ? `
      <tr class="spacer"><td colspan="2"></td></tr>
      <tr class="section-header"><td colspan="2" id="sec-cogs">🏗️ Costo de Ventas (COGS)</td></tr>
      ${cogsRows}
      <tr class="total-row"><td class="cat" id="tot-cogs">TOTAL COGS</td><td class="amt">$${fmt2(totalCOGS)}</td></tr>` : ""}
      <tr class="spacer"><td colspan="2"></td></tr>
      <tr class="highlight-row"><td class="cat"><span id="lbl-gross">UTILIDAD BRUTA</span></td><td class="amt ${grossProfit < 0 ? 'loss' : ''}">$${fmt2(grossProfit)} <span style="font-size:12px;opacity:0.7">(${grossPct}%)</span></td></tr>
      <tr class="spacer"><td colspan="2"></td></tr>
      <tr class="section-header"><td colspan="2" id="sec-opex">📋 Gastos Operativos</td></tr>
      ${opexRows}
      ${otherExpRows ? `${otherExpRows}` : ""}
      <tr class="total-row"><td class="cat" id="tot-opex">TOTAL GASTOS OPERATIVOS</td><td class="amt">$${fmt2(totalOpex + totalOtherExp)}</td></tr>
      <tr class="spacer"><td colspan="2"></td></tr>
      <tr class="highlight-row"><td class="cat"><span id="lbl-net">UTILIDAD NETA</span></td><td class="amt ${netProfit < 0 ? 'loss' : ''}">$${fmt2(netProfit)} <span style="font-size:12px;opacity:0.7">(${marginPct}%)</span></td></tr>
    </table>
    ${totalPersonal > 0 ? `
    <div style="height:16px;background:#f0f4f8"></div>
    <table>
      <tr class="personal-header"><td colspan="2" id="sec-personal">⚠️ Movimientos Personales y No Empresariales</td></tr>
      ${personalRows}
      <tr class="total-row"><td class="cat" id="tot-personal">TOTAL MOVIMIENTOS PERSONALES</td><td class="amt" style="color:#92400e">$${fmt2(totalPersonal)}</td></tr>
    </table>` : ""}
  </div>
  <div class="footer">Generado por el Agente de Mau Bautista · V&amp;M Bookkeeping Group LLC</div>
</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  }
  function downloadDupReport(dupGroups, groups) {
    const clientName  = clientData?.name || "Cliente";
    const bankName    = bankInfo?.bank_name || "Banco";
    const today       = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" });
    const totalDupAmt = Object.values(groups).reduce((s, rows) => {
      return s + rows.slice(1).reduce((ss,r)=>ss+Math.abs(parseFloat(r.amount)||0),0);
    }, 0);
    const totalDupCount = Object.values(groups).reduce((s,rows)=>s+rows.length-1,0);
    const rowsHtml = dupGroups.map(displayKey => {
      const rows   = groups[displayKey];
      const dupAmt = rows.slice(1).reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
      return `
        <div class="group">
          <div class="group-header">
            <span class="badge">${rows.length}x</span>
            <span class="concept">${displayKey}</span>
            <span class="dup-amt">Duplicado: $${fmt(dupAmt)}</span>
          </div>
          <table>
            <thead><tr><th>Fecha</th><th>Monto</th><th>Concepto</th><th>Status</th></tr></thead>
            <tbody>
              ${rows.map((r,i)=>`
                <tr class="${i===0?'orig':'dup'}">
                  <td>${r.date}</td>
                  <td>-$${fmt(Math.abs(parseFloat(r.amount)||0))}</td>
                  <td>${r.concept}</td>
                  <td><span class="tag ${i===0?'tag-ok':'tag-dup'}">${i===0?"✓ ORIGINAL":"⚠ DUPLICADO"}</span></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    }).join("");
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Duplicados — ${clientName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:28px;font-size:12px}
  .header{background:#0f1f4b;color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px}
  .header h1{font-size:20px;margin-bottom:3px}
  .header p{font-size:11px;opacity:0.7}
  .cards{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
  .card{flex:1;min-width:120px;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
  .card .lbl{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .card .val{font-size:18px;font-weight:700}
  .group{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;overflow:hidden;page-break-inside:avoid}
  .group-header{background:#f8fafc;padding:8px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e8f0}
  .badge{background:#fee2e2;color:#991b1b;border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700}
  .concept{font-weight:700;font-size:12px;flex:1}
  .dup-amt{font-size:11px;color:#991b1b;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f1f5f9;padding:6px 10px;text-align:left;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px}
  td{padding:7px 10px;border-top:1px solid #f1f5f9}
  tr.orig td{background:#f0fdf4}
  tr.dup td{background:#fff8f8}
  .tag{border-radius:3px;padding:1px 6px;font-size:9px;font-weight:700}
  .tag-ok{background:#dcfce7;color:#166534}
  .tag-dup{background:#fee2e2;color:#991b1b}
  .footer{margin-top:20px;text-align:center;font-size:10px;color:#94a3b8}
  @media print{
    body{padding:16px}
    .no-print{display:none}
    .group{page-break-inside:avoid}
  }
</style>
</head>
<body>
  <div class="no-print" style="background:#1a56db;color:#fff;padding:10px 16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
    <span class="print-tip">💡 Para guardar como PDF: Archivo → Imprimir → Guardar como PDF</span>
    <button onclick="window.print()" style="background:#fff;color:#1a56db;border:none;border-radius:6px;padding:6px 16px;font-weight:700;cursor:pointer;font-size:12px">🖨️ Imprimir / Guardar PDF</button>
  </div>
  <div class="header">
    <h1>📋 Reporte de Duplicados</h1>
    <p>${clientName} · ${bankName} · ${today}</p>
  </div>
  <div class="cards">
    <div class="card"><div class="lbl">Grupos duplicados</div><div class="val" style="color:#991b1b">${dupGroups.length}</div></div>
    <div class="card"><div class="lbl">Transacciones dup.</div><div class="val" style="color:#f59e0b">${totalDupCount}</div></div>
    <div class="card"><div class="lbl">Monto duplicado</div><div class="val" style="color:#f59e0b">$${fmt(totalDupAmt)}</div></div>
    <div class="card"><div class="lbl">Total transacciones</div><div class="val">${transactions.length}</div></div>
  </div>
  ${rowsHtml}
  <div class="footer">Reporte generado por el Agente de Mau Bautista · V&M Bookkeeping Group LLC</div>
</body>
</html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  }
  const [runningFinalPass, setRunningFinalPass] = useState(false);
  async function runFinalMultiPass() {
    if (!balances.length) {
      setSplitMode(false);
      setScreen(askQueue.length>0?"resolve":"review");
      return;
    }
    setRunningFinalPass(true);
    const bankDep  = balances.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
    const bankWith = balances.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
    const allTxs   = transactions;
    const extDep   = allTxs.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
    const extWith  = allTxs.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
    const withDiff = bankWith - extWith;
    const depDiff  = bankDep  - extDep;
    if (withDiff > 50 || depDiff > 50) {
      setSplitMode(false);
      setRunningFinalPass(false);
      const hasDiff = Math.abs(bankWith-extWith)>50 || Math.abs(bankDep-extDep)>50;
      setScreen(hasDiff ? "dedup" : askQueue.length>0 ? "resolve" : "review");
    } else {
      setSplitMode(false);
      setRunningFinalPass(false);
      setScreen(askQueue.length>0?"resolve":"review");
    }
  }
  const deposits     = transactions.filter(r=>r.type==="DEPOSIT");
  const withdrawals  = transactions.filter(r=>r.type==="WITHDRAWAL");
  const asks         = transactions.filter(r=>r.category==="ASK TO CLIENT");
  const transfers    = transactions.filter(r=>r.level==="TRANSFER");
  const checks       = transactions.filter(r=>r.level==="CHECK");
  const autoResolved = transactions.filter(r=>["HARD","BUSINESS"].includes(r.level)).length;
  const memHits      = transactions.filter(r=>r.level==="MEMORY").length;
  const askPct       = transactions.length ? Math.round(asks.length/transactions.length*100) : 0;
  const checkReport = checks.reduce((acc, r) => {
    const name = r.payee || `Sin nombre (Cheque #${r.checkNum||"?"})`;
    if (!acc[name]) acc[name] = { count:0, total:0, checks:[] };
    const amt = Math.abs(parseFloat(r.amount)||0);
    acc[name].count++;
    acc[name].total += amt;
    acc[name].checks.push({ date:r.date, amount:amt, checkNum:r.checkNum });
    return acc;
  }, {});
  const checkReportRows = Object.entries(checkReport).sort((a,b)=>b[1].total-a[1].total);
  const totalDepositsAmt    = deposits.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
  const totalWithdrawalsAmt = withdrawals.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
  const categoriesWithCount = [...new Set(transactions.map(r => r.category))].filter(c => c && c !== "").sort().map(c => ({ cat: c, count: transactions.filter(r => r.category === c).length }));
  const S = {
    app:{minHeight:"100vh",background:"#05080f",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1a1a1a",position:"relative"},
    page:{maxWidth:1320,margin:"0 auto",padding:"44px 36px",position:"relative",zIndex:1},
    h1:{fontSize:32,fontWeight:700,letterSpacing:"-0.5px",marginBottom:8,color:"#ffffff"},
    sub:{color:"#94a3b8",fontSize:15},
    card:{background:"rgba(255,255,255,0.97)",borderRadius:16,border:"1px solid #e2e8f0",padding:28,marginBottom:18},
    btn:{padding:"11px 24px",borderRadius:10,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,transition:"all 0.15s"},
    btnPrimary:{background:"#0f1f4b",color:"#fff"},
    btnGold:{background:"#1a56db",color:"#fff"},
    btnOutline:{background:"#1a56db",color:"#ffffff",border:"1px solid #1a56db"},
    input:{width:"100%",padding:"12px 16px",borderRadius:10,border:"1px solid #ddd",fontSize:15,outline:"none",fontFamily:"inherit"},
    label:{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:7,display:"block"},
  };
  const levelColor = l => ({
    HARD:    {bg:"#dcfce7",color:"#166534"},
    MEMORY:  {bg:"#dbeafe",color:"#1e40af"},
    BUSINESS:{bg:"#f3e8ff",color:"#6b21a8"},
    RESOLVED:{bg:"#e8f0fe",color:"#1e40af"},
    TRANSFER:{bg:"#e0f2fe",color:"#0369a1"},
    CHECK:   {bg:"#dbeafe",color:"#1e40af"},
  }[l] || {bg:"#fee2e2",color:"#991b1b"});
  const KNOWN_BANKS = Object.keys(BANK_PROMPTS).filter(k => k !== "default");
  return (
    <div style={S.app}>
      <div style={{position:"fixed",bottom:20,right:24,zIndex:1000,opacity:0.85,transition:"opacity 0.2s"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1}
        onMouseLeave={e=>e.currentTarget.style.opacity=0.85}>
        <img src="/logo-mau.png" alt="Mau Bautista" onClick={()=>setShowDevModal(true)} style={{width:120,height:"auto",filter:"brightness(1.1)",cursor:"pointer"}} />
      </div>
      <style>{`
        body{background:#05080f}
        .bg-star{position:fixed;border-radius:50%;background:#ffffff;pointer-events:none;z-index:0;box-shadow:0 0 4px 1px rgba(255,255,255,0.4)}
        .bg-s1{animation:twinkle1 3s ease-in-out infinite}
        .bg-s2{animation:twinkle2 4.5s ease-in-out infinite}
        .bg-s3{animation:twinkle3 2.5s ease-in-out infinite}
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button:hover{opacity:0.85}
        input:focus{border-color:#1a56db!important;box-shadow:0 0 0 3px rgba(26,86,219,0.12)}
        .cc:hover{background:#f8faff!important;border-color:#1a56db!important;cursor:pointer}
        .btype{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-family:inherit;font-size:12px;transition:all 0.15s;color:#1a1a1a}
        .btype:hover,.btype.sel{border-color:#1a56db;background:#f0f4ff;font-weight:600}
        .drop{border:2px dashed #e2e8f0;border-radius:12px;padding:48px 28px;text-align:center;cursor:pointer;transition:all 0.2s}
        .drop:hover,.drop.over{border-color:#1a56db;background:#f0f4ff}
        .ropt{padding:8px 13px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;font-family:inherit;transition:all 0.15s;color:#1a1a1a}
        .ropt:hover{border-color:#1a56db;background:#f0f4ff}
        .tr:hover{background:#f8faff}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes twinkle1{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.2;transform:scale(0.8)}}
        @keyframes twinkle2{0%,100%{opacity:0.6;transform:scale(1)}40%{opacity:1;transform:scale(1.3)}70%{opacity:0.1;transform:scale(0.7)}}
        @keyframes twinkle3{0%,100%{opacity:0.8}30%{opacity:0.1}60%{opacity:1}90%{opacity:0.3}}
      `}</style>
      {/* Starfield */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        {[{l:"2%",t:"5%",w:3,c:"bg-s1"},{l:"7%",t:"15%",w:2,c:"bg-s2"},{l:"13%",t:"8%",w:1.5,c:"bg-s3"},{l:"18%",t:"25%",w:2.5,c:"bg-s1"},{l:"23%",t:"3%",w:2,c:"bg-s2"},{l:"29%",t:"18%",w:1.5,c:"bg-s3"},{l:"35%",t:"10%",w:3,c:"bg-s1"},{l:"41%",t:"22%",w:1.5,c:"bg-s2"},{l:"47%",t:"6%",w:2,c:"bg-s3"},{l:"53%",t:"14%",w:2.5,c:"bg-s1"},{l:"59%",t:"28%",w:1.5,c:"bg-s2"},{l:"65%",t:"4%",w:2,c:"bg-s3"},{l:"71%",t:"20%",w:3,c:"bg-s1"},{l:"77%",t:"9%",w:1.5,c:"bg-s2"},{l:"83%",t:"16%",w:2,c:"bg-s3"},{l:"89%",t:"7%",w:2.5,c:"bg-s1"},{l:"95%",t:"24%",w:1.5,c:"bg-s2"},{l:"5%",t:"40%",w:2,c:"bg-s3"},{l:"11%",t:"55%",w:1.5,c:"bg-s1"},{l:"17%",t:"45%",w:2.5,c:"bg-s2"},{l:"33%",t:"50%",w:1.5,c:"bg-s3"},{l:"45%",t:"60%",w:2,c:"bg-s1"},{l:"57%",t:"42%",w:1.5,c:"bg-s2"},{l:"69%",t:"58%",w:2.5,c:"bg-s3"},{l:"81%",t:"48%",w:1.5,c:"bg-s1"},{l:"93%",t:"38%",w:2,c:"bg-s2"},{l:"8%",t:"75%",w:1.5,c:"bg-s3"},{l:"22%",t:"80%",w:2.5,c:"bg-s1"},{l:"38%",t:"70%",w:1.5,c:"bg-s2"},{l:"52%",t:"85%",w:2,c:"bg-s3"},{l:"66%",t:"72%",w:1.5,c:"bg-s1"},{l:"78%",t:"88%",w:2.5,c:"bg-s2"},{l:"91%",t:"65%",w:1.5,c:"bg-s3"},{l:"4%",t:"90%",w:2,c:"bg-s1"},{l:"26%",t:"95%",w:1.5,c:"bg-s2"},{l:"48%",t:"92%",w:2.5,c:"bg-s3"},{l:"72%",t:"96%",w:1.5,c:"bg-s1"},{l:"86%",t:"82%",w:2,c:"bg-s2"},{l:"97%",t:"90%",w:1.5,c:"bg-s3"}].map((s,i)=>(
          <div key={i} className={`bg-star ${s.c}`} style={{left:s.l,top:s.t,width:s.w,height:s.w}} />
        ))}
      </div>
      {/* ── HOME ── */}
      {screen==="home"&&(
        <div style={S.page}>
          <div style={{marginBottom:24,background:"#000008",borderRadius:20,padding:"36px 40px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,borderRadius:20,background:"radial-gradient(ellipse at 20% 50%,rgba(26,86,219,0.15) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(99,102,241,0.1) 0%,transparent 50%)"}} />
            <img src="/mau-agent.jpeg" alt="Mau Bautista IA" style={{width:140,height:140,objectFit:"cover",borderRadius:"50%",border:"4px solid rgba(255,255,255,0.3)",flexShrink:0,position:"relative",zIndex:1}} />
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#fff",marginBottom:6}}>Bienvenido al Agente de Mau Bautista</div>
              <div style={{color:"rgba(255,255,255,0.7)",fontSize:15,marginBottom:10}}>Tu bookkeeper inteligente</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["14 tipos de negocio","350+ merchants",`${KNOWN_BANKS.length} bancos conocidos`,"Memoria persistente"].map(t=>(
                  <span key={t} style={{background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={S.card}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:14}}>➕ Nuevo Cliente</h2>
            <div style={{marginBottom:12}}>
              <label style={S.label}>Nombre del cliente</label>
              <input style={S.input} placeholder="Ej: Juan García - HVAC" value={newName} onChange={e=>setNewName(e.target.value)} />
            </div>
            <div style={{marginTop:12,marginBottom:14}}>
              <label style={S.label}>Tipo de negocio</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:4}}>
                {BUSINESS_TYPES.map(bt=>(
                  <button key={bt.id} className={`btype${newType===bt.id?" sel":""}`} onClick={()=>setNewType(bt.id)} style={{textAlign:"left",padding:"13px 18px",fontSize:14}}>{bt.icon} {bt.label}</button>
                ))}
              </div>
            </div>
            <button style={{...S.btn,...S.btnGold}} onClick={createClient} disabled={!newName.trim()||!newType}>Crear Cliente →</button>
          </div>
          {clients.length>0&&(
            <div style={S.card}>
              <h2 style={{fontSize:15,fontWeight:700,marginBottom:14}}>📁 Clientes ({clients.length})</h2>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {clients.map(c=>{
                  const bt=BUSINESS_TYPES.find(b=>b.id===c.businessType);
                  const ml=Object.keys(c.learnedMerchants||{}).length;
                  return (
                    <div key={c.id} className="cc" style={{padding:"16px 20px",border:"1px solid #e2e8f0",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",transition:"all 0.15s"}}>
                      <div onClick={()=>selectClient(c.id)} style={{flex:1,cursor:"pointer"}}>
                        <div style={{fontWeight:600,fontSize:16}}>{c.name}</div>
                        <div style={{color:"#999",fontSize:13,marginTop:4}}>{bt?.icon} {bt?.label} · 🧠 {ml} aprendidas · 📄 {(c.history||[]).length} procesados</div>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <button style={{...S.btn,...S.btnPrimary,fontSize:11,padding:"6px 14px"}} onClick={()=>selectClient(c.id)}>Abrir →</button>
                        <button style={{...S.btn,background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5",fontSize:11,padding:"6px 10px"}}
                          onClick={async(e)=>{
                            e.stopPropagation();
                            if(!window.confirm(`¿Eliminar a ${c.name}? Esta acción no se puede deshacer.`)) return;
                            localStorage.removeItem(`client:${c.id}`);
                            await loadList();
                          }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {clients.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#64748b",fontSize:13}}>Crea tu primer cliente para empezar</div>}
        </div>
      )}
      {/* ── UPLOAD ── */}
      {screen==="upload"&&clientData&&(
        <div style={S.page}>
          <div style={{marginBottom:20}}>
            <h1 style={S.h1}>{clientData.name}</h1>
            <p style={S.sub}>{BUSINESS_TYPES.find(b=>b.id===clientData.businessType)?.icon} {BUSINESS_TYPES.find(b=>b.id===clientData.businessType)?.label} · 🧠 {Object.keys(clientData.learnedMerchants||{}).length} aprendidas</p>
          </div>
          <div style={S.card}>
            {/* Split mode */}
            <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(26,86,219,0.1)",borderRadius:10,border:"1px solid rgba(26,86,219,0.3)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>📄 Modo PDF Dividido</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Para PDFs de 10+ páginas — procesa múltiples partes y las junta automáticamente</div>
                </div>
                <button onClick={()=>{
                  setSplitMode(!splitMode);
                  setSplitParts([]);
                  setSplitPartNum(1);
                  clearSplitCache();
                }}
                  style={{padding:"6px 16px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
                    background:splitMode?"#1a56db":"#e2e8f0",color:splitMode?"#fff":"#64748b",transition:"all 0.2s"}}>
                  {splitMode ? "✅ ON" : "OFF"}
                </button>
              </div>
              {splitMode&&(
                <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:12,color:"#64748b"}}>Partes cargadas:</div>
                  {[1,2,3,4].map(n=>{
                    const isDone    = splitParts[n-1] !== undefined;
                    const isCurrent = n === splitPartNum;
                    const isPending = !isDone && !isCurrent;
                    return (
                      <div
                        key={n}
                        title={isDone ? `Recargar Parte ${n}` : isCurrent ? `Cargando Parte ${n}` : ""}
                        onClick={()=>{ if(isDone) setSplitPartNum(n); }}
                        style={{
                          width:28,height:28,borderRadius:"50%",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,fontWeight:700,
                          background: isDone && !isCurrent ? "#22c55e" : isCurrent ? "#1a56db" : "#e2e8f0",
                          color: isDone || isCurrent ? "#fff" : "#94a3b8",
                          border: isCurrent ? "2px solid #1a56db" : isDone ? "2px solid #16a34a" : "2px solid transparent",
                          cursor: isDone ? "pointer" : "default",
                          position:"relative",
                        }}>
                        {isDone && !isCurrent ? "✓" : n}
                        {isDone && !isCurrent && (
                          <span style={{position:"absolute",top:-4,right:-4,background:"#f59e0b",borderRadius:"50%",width:12,height:12,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#000"}}>↺</span>
                        )}
                      </div>
                    );
                  })}
                  {splitParts.filter(Boolean).length>0&&(
                    <div style={{fontSize:11,color:"#22c55e",marginLeft:4,fontWeight:600}}>
                      ✅ {splitParts.filter(Boolean).reduce((s,p)=>s+p.length,0)} transacciones acumuladas
                    </div>
                  )}
                  {splitParts.filter(Boolean).length>0&&(
                    <button onClick={()=>{
                      setSplitParts([]);
                      setSplitPartNum(1);
                      setTransactions([]);
                      clearSplitCache();
                    }} style={{marginLeft:"auto",fontSize:10,color:"#fff",background:"#ef4444",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>
                      Reiniciar
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className={`drop${dragOver?" over":""}`}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f?.type==="application/pdf")setFile(f)}}
              onClick={()=>fileRef.current.click()}>
              <div style={{fontSize:36,marginBottom:10}}>📄</div>
              {file?(<><div style={{fontWeight:600,color:"#1a56db"}}>{file.name}</div><div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{(file.size/1024).toFixed(0)} KB</div></>)
                   :(<><div style={{fontWeight:500,color:"#1a1a1a"}}>Arrastra el bank statement aquí</div><div style={{color:"#64748b",fontSize:12,marginTop:3}}>o click · Solo PDF bancario digital</div></>)}
              <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)setFile(f)}} />
            </div>
            {/* ── 🚨 BANNER: PDF bloqueado — aparece después de detección ── */}
            {bankInfo && bankInfo.total_pages > 9 && !splitMode && (
              <div style={{marginTop:12,padding:"14px 16px",background:"#fee2e2",borderRadius:10,border:"2px solid #ef4444"}}>
                <div style={{fontWeight:700,color:"#991b1b",fontSize:14,marginBottom:4}}>
                  🚨 PDF bloqueado — {bankInfo.total_pages} páginas detectadas
                </div>
                <div style={{fontSize:12,color:"#7f1d1d",marginBottom:10}}>
                  Este statement tiene demasiadas páginas. Activa el <strong>Modo Split</strong> y divide el PDF en partes de máximo 9 páginas.
                </div>
                <button
                  onClick={() => { setSplitMode(true); setSplitParts([]); setSplitPartNum(1); }}
                  style={{padding:"8px 20px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  ✅ Activar Modo Split
                </button>
              </div>
            )}
            {file&&(
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
                <button style={{...S.btn,...S.btnGold}} onClick={runExtraction}>
                  {splitMode
                    ? splitParts[splitPartNum-1]
                      ? `🔄 Recargar Parte ${splitPartNum}`
                      : `🚀 Procesar Parte ${splitPartNum}`
                    : "🚀 Procesar"}
                </button>
              </div>
            )}
          </div>
          {/* Biblioteca de bancos */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"#94a3b8"}}>🏦 BIBLIOTECA DE BANCOS ({KNOWN_BANKS.length} bancos)</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {KNOWN_BANKS.map(b=>(
                <span key={b} style={{background:"#dcfce7",color:"#166534",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>
                  ✅ {b.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                </span>
              ))}
            </div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>
              Si tu banco no aparece aquí, la app lo procesará con el modo genérico y te avisará al finalizar.
            </div>
          </div>
          {Object.keys(clientData.learnedMerchants||{}).length>0&&(
            <div style={S.card}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"#94a3b8"}}>🧠 MEMORIA ({Object.keys(clientData.learnedMerchants).length} reglas)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.entries(clientData.learnedMerchants).map(([k,v])=>(
                  <div key={k} style={{background:"#f4f6f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 9px",fontSize:11}}>
                    <span style={{fontWeight:700,color:"#1a1a1a"}}>{k}</span> → <span style={{color:"#1a56db"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── EXTRACTING ── */}
      {screen==="extracting"&&(()=>{
        const FRASES = [
          "☕ Puedes ir por un café... déjame trabajar a mí.",
          "🤓 Mientras trabajo, ¿qué te parece estar aprendiendo con Mau?",
          "💡 Dato curioso: esto antes te tomaba 3 horas. Ahora... unos segundos.",
          "🚀 Mau dice: 'El que automatiza primero, gana primero.'",
          "🧠 Estoy leyendo cada línea del estado de cuenta. Tú relájate.",
          "📊 Bookkeeping inteligente. Así se hace en el siglo 21.",
          "🎯 Categorías, saldos, cheques... nada se me escapa.",
          "😎 Tranquilo, yo soy más rápido que cualquier contador manual.",
          "💰 Cada centavo importa. Por eso los cuento todos.",
          "🌮 ¿Ya comiste? Yo trabajo mejor que tú con hambre.",
          "🏗️ Construyendo tu reporte... ladrillo por ladrillo.",
          "⚡ Si esto fuera manual, ya ibas en la página 2. Yo voy en la 14.",
          "🎓 Mau enseña, yo aprendo, tú ganas. Equipo perfecto.",
          "📱 Puedes revisar Instagram... ya yo me encargo aquí.",
          "🤝 Mientras yo analizo, piensa en tu próximo cliente.",
        ];
        return (
        <div style={{position:"fixed",inset:0,background:"#05080f",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <style>{`
            @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
            @keyframes robotGlow{0%,100%{box-shadow:0 0 40px rgba(26,86,219,0.6),0 0 80px rgba(26,86,219,0.3)}50%{box-shadow:0 0 60px rgba(26,86,219,1),0 0 120px rgba(26,86,219,0.6)}}
            @keyframes dotPulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.4);opacity:1}}
            @keyframes matrixRain{0%{transform:translateY(-100%);opacity:1}100%{transform:translateY(100vh);opacity:0}}
            @keyframes fadePhrase{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}
            .robot-glow{animation:robotGlow 2s ease-in-out infinite}
            .robot-float{animation:float 4s ease-in-out infinite}
          `}</style>
          <div style={{position:"absolute",inset:0,overflow:"hidden",opacity:0.05}}>
            {[0,1,2,3,4,5,6,7,8,9].map((i)=>(
              <div key={i} style={{position:"absolute",left:`${i*10+2}%`,top:0,fontSize:11,color:"#1a56db",fontFamily:"monospace",lineHeight:1.6,animation:`matrixRain ${3+i*0.3}s linear infinite`,animationDelay:`${i*0.2}s`}}>
                {"10110100101101001011010010110100101".split("").map((c,j)=><div key={j}>{c}</div>)}
              </div>
            ))}
          </div>
          <div className="robot-float robot-glow" style={{borderRadius:"50%",position:"relative",marginBottom:28}}>
            <img src="/mau-agent.jpeg" alt="Mau Agent" style={{width:180,height:180,objectFit:"cover",borderRadius:"50%",border:"4px solid #1a56db",display:"block"}} />
            <div style={{position:"absolute",inset:-12,borderRadius:"50%",border:"2px solid rgba(26,86,219,0.4)",borderTopColor:"#1a56db",animation:"spin 3s linear infinite"}} />
            <div style={{position:"absolute",inset:-24,borderRadius:"50%",border:"1px solid rgba(26,86,219,0.2)",borderBottomColor:"#1a56db",animation:"spin 5s linear infinite reverse"}} />
          </div>
          <h2 style={{fontSize:26,fontWeight:700,color:"#ffffff",marginBottom:6,fontFamily:"'Playfair Display',serif",textShadow:"0 0 20px rgba(26,86,219,0.5)"}}>
            Procesando Statement...
          </h2>
          <FraseRotativa frases={FRASES} />
          <div style={{width:440,marginBottom:8,marginTop:18}}>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:20,height:10,overflow:"hidden"}}>
              <div style={{
                height:"100%",
                width:`${progress.pct}%`,
                background:"linear-gradient(90deg,#1a56db,#22c55e)",
                borderRadius:20,
                transition:"width 0.12s linear"
              }} />
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center",marginBottom:16}}>
            <p style={{color:"#94a3b8",fontSize:12,fontFamily:"monospace",letterSpacing:1,maxWidth:340,textAlign:"center"}}>
              {progress.text}
            </p>
            <AnimatedPct target={progress.pct} />
          </div>
          <div style={{display:"flex",gap:10}}>
            {[0,1,2,3,4].map(i=>(
              <div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#1a56db",animation:`dotPulse 1s ease-in-out infinite`,animationDelay:`${i*0.15}s`,boxShadow:"0 0 8px #1a56db"}} />
            ))}
          </div>
        </div>
        );
      })()}
      {/* ── RECONCILE ── */}
      {screen==="reconcile"&&(
        <div style={S.page}>
          <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div>
              <h1 style={S.h1}>⚖️ Conciliación de Saldos</h1>
              <p style={S.sub}>
                {splitMode && splitParts.length > 0
                  ? `Modo PDF dividido — ${splitParts.length} parte(s) · ${transactions.length} transacciones totales`
                  : "Verifica que los saldos del banco cuadren con las transacciones extraídas"
                }
              </p>
              {splitMode && (
                <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                  <button style={{...S.btn,background:"#1a56db",color:"#fff",fontSize:11,padding:"5px 14px"}} onClick={()=>setScreen("upload")}>
                    ➕ Agregar Parte {splitPartNum}
                  </button>
                  <button
                    style={{...S.btn,background:"#22c55e",color:"#fff",fontSize:11,padding:"5px 14px",opacity:runningFinalPass?0.7:1}}
                    onClick={runFinalMultiPass}
                    disabled={runningFinalPass}>
                    {runningFinalPass ? "⏳ Procesando..." : "✅ Son todas las partes"}
                  </button>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btn,...S.btnOutline,fontSize:12,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>setScreen(askQueue.length>0?"resolve":"review")}>
                Saltar →
              </button>
              <button style={{...S.btn,...S.btnGold}} onClick={()=>{
                const _cb3 = balances.filter(b=>(b.account_name||"").toUpperCase().includes("CHECKING"));
                const _cmp3 = _cb3.length > 0 ? _cb3 : balances;
                const bankWith = _cmp3.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
                const bankDep  = _cmp3.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
                const extWith  = transactions.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
                const extDep   = transactions.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
                const hasDiff  = Math.abs(bankWith-extWith)>50 || Math.abs(bankDep-extDep)>50;
                setScreen(hasDiff ? "dedup" : askQueue.length>0 ? "resolve" : "review");
              }}>
                Continuar ✓
              </button>
            </div>
          </div>
          {bankInfo && (
            <div style={{...S.card, marginBottom:14, padding:"14px 18px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🏦</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{bankInfo.bank_name}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>
                      {bankInfo.total_pages > 0 ? `${bankInfo.total_pages} páginas · ` : ""}
                      {bankInfo.period_start} – {bankInfo.period_end}
                    </div>
                  </div>
                </div>
                {bankInfo.bank_id === "unknown" ? (
                  <span style={{background:"#fef3c7",color:"#92400e",borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:700}}>
                    ⚠️ Banco no identificado — prompt genérico
                  </span>
                ) : (
                  <span style={{background:"#dcfce7",color:"#166534",borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:700}}>
                    ✅ {bankInfo.bank_id.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                  </span>
                )}
              </div>
              {bankInfo.bank_id === "unknown" && (
                <div style={{marginTop:10,padding:"10px 14px",background:"#fef3c7",borderRadius:8,border:"1px solid #fde68a",fontSize:12,color:"#92400e"}}>
                  ⚠️ <strong>Banco no encontrado en la biblioteca.</strong> Se procesó con el modo genérico — puede haber diferencias.
                  <br/>
                  <span style={{fontSize:11,marginTop:4,display:"block"}}>
                    📌 Para mejorar la precisión: notifica a Mau con el nombre del banco <strong>"{bankInfo.bank_name}"</strong> para agregarlo a la biblioteca.
                  </span>
                </div>
              )}
              {bankInfo.total_pages > 10 && !splitMode && (
                <div style={{marginTop:10,padding:"10px 14px",background:"#e0f2fe",borderRadius:8,border:"1px solid #7dd3fc",fontSize:12,color:"#0369a1"}}>
                  💡 <strong>PDF de {bankInfo.total_pages} páginas detectado.</strong> Para mejor precisión, activa el <strong>Modo PDF Dividido</strong> — divide el PDF en partes de 10 páginas máximo. <strong>Importante:</strong> si tu banco incluye imágenes de cheques (como Bank of Oklahoma), elimínalas antes de subir — solo sube hasta la página del Daily Account Balance.
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {l:"Transacciones",v:transactions.length,c:"#111111"},
              {l:"Total Depósitos",v:`$${fmt(totalDepositsAmt)}`,c:"#22c55e"},
              {l:"Total Retiros",v:`$${fmt(totalWithdrawalsAmt)}`,c:"#ef4444"},
              {l:"Diferencia Neta",v:`$${fmt(totalDepositsAmt-totalWithdrawalsAmt)}`,c:totalDepositsAmt>=totalWithdrawalsAmt?"#22c55e":"#ef4444"},
            ].map(s=>(
              <div key={s.l} style={{...S.card,flex:1,minWidth:140,marginBottom:0,padding:"12px 16px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:1,marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          {balances.length>0 ? (
            <div style={{...S.card,padding:0,overflow:"hidden"}}>
              <div style={{background:"#0f1f4b",color:"#fff",padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:1}}>
                📊 CONCILIACIÓN POR CUENTA
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 1fr 80px",padding:"8px 16px",background:"#f7f6f2",borderBottom:"1px solid #e2e8f0"}}>
                {["CUENTA","PERÍODO","SALDO INICIAL","+ DEPÓSITOS","- RETIROS","SALDO FINAL","STATUS"].map(h=>(
                  <div key={h} style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:0.5}}>{h}</div>
                ))}
              </div>
              {balances.map((b,i)=>{
                const calculated = (parseFloat(b.beginning_balance)||0) + (parseFloat(b.total_deposits)||0) - (parseFloat(b.total_withdrawals)||0);
                const ending = parseFloat(b.ending_balance)||0;
                const diff = Math.abs(calculated - ending);
                const ok = diff < 0.02;
                return (
                  <div key={i} style={{borderBottom:"1px solid #f0ede8"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 1fr 80px",padding:"12px 16px",alignItems:"center",background:ok?"#fff":"#fff8f8"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:"#1a1a1a"}}>{b.account_name||"Cuenta"}</div>
                        {b.account_number&&b.account_number!=="N/A"&&<div style={{fontSize:11,color:"#94a3b8"}}>****{b.account_number}</div>}
                      </div>
                      <div style={{fontSize:11,color:"#64748b"}}>{b.period_start||"—"}<br/>{b.period_end||""}</div>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>${fmt(b.beginning_balance)}</div>
                      <div style={{fontSize:13,fontWeight:600,color:"#22c55e"}}>+${fmt(b.total_deposits)}</div>
                      <div style={{fontSize:13,fontWeight:600,color:"#ef4444"}}>-${fmt(b.total_withdrawals)}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>${fmt(b.ending_balance)}</div>
                        {!ok&&<div style={{fontSize:10,color:"#ef4444"}}>calc: ${fmt(calculated)}</div>}
                      </div>
                      <div style={{textAlign:"center"}}>
                        {ok
                          ? <span style={{background:"#dcfce7",color:"#166534",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>✅ OK</span>
                          : <span style={{background:"#fee2e2",color:"#991b1b",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>⚠️ DIF</span>
                        }
                      </div>
                    </div>
                    {!ok&&(
                      <div style={{background:"#fef3c7",padding:"6px 16px",fontSize:11,color:"#92400e",borderTop:"1px solid #fde68a"}}>
                        ⚠️ Diferencia de ${fmt(diff)} — Revisa si hay transacciones faltantes
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{...S.card,textAlign:"center",padding:"32px 20px"}}>
              <div style={{fontSize:32,marginBottom:10}}>🔍</div>
              <div style={{fontWeight:600,marginBottom:6,color:"#1a1a1a"}}>No se encontraron saldos en el PDF</div>
              <div style={{fontSize:12,color:"#64748b"}}>Puedes continuar de todas formas.</div>
            </div>
          )}
          {balances.length>0&&(
            <div style={{...S.card,marginTop:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:12,letterSpacing:1}}>🔎 BANCO vs EXTRAÍDO</div>
              {(()=>{
                const checkingBals = balances.filter(b=>(b.account_name||"").toUpperCase().includes("CHECKING"));
                const compareBals  = checkingBals.length > 0 ? checkingBals : balances;
                const bankDep  = compareBals.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
                const bankWith = compareBals.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
                const depDiff  = Math.abs(bankDep - totalDepositsAmt);
                const withDiff = Math.abs(bankWith - totalWithdrawalsAmt);
                const allGood  = depDiff < 1 && withDiff < 1;
                const isFiltered = checkingBals.length > 0 && checkingBals.length < balances.length;
                return (
                  <>
                    {isFiltered && (
                      <div style={{fontSize:11,color:"#64748b",marginBottom:10,padding:"6px 10px",background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd"}}>
                        ℹ️ Comparando solo <strong>{compareBals[0]?.account_name}</strong> — subcuentas conciliadas individualmente arriba
                      </div>
                    )}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                      {[
                        {l:"Depósitos Banco",   v:`$${fmt(bankDep)}`,            c:"#22c55e"},
                        {l:"Depósitos Extraídos",v:`$${fmt(totalDepositsAmt)}`,  c:"#22c55e"},
                        {l:"Retiros Banco",      v:`$${fmt(bankWith)}`,           c:"#ef4444"},
                        {l:"Retiros Extraídos",  v:`$${fmt(totalWithdrawalsAmt)}`,c:"#ef4444"},
                      ].map(s=>(
                        <div key={s.l} style={{background:"#f7f6f2",borderRadius:8,padding:"12px 14px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:0.5,marginBottom:4}}>{s.l}</div>
                          <div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:12,padding:"10px 14px",borderRadius:8,background:allGood?"#dcfce7":"#fef3c7",border:`1px solid ${allGood?"#86efac":"#fde68a"}`}}>
                      {allGood
                        ? <span style={{color:"#166534",fontWeight:600,fontSize:13}}>✅ Todo cuadra — Las transacciones coinciden con los totales del banco</span>
                        : <span style={{color:"#92400e",fontWeight:600,fontSize:13}}>⚠️ Posible diferencia — Depósitos: ${fmt(depDiff)} · Retiros: ${fmt(withDiff)}</span>
                      }
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:16,gap:10}}>
            <button style={{...S.btn,...S.btnOutline,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>setScreen("upload")}>← Volver</button>
            <button style={{...S.btn,...S.btnGold,fontSize:14,padding:"10px 28px"}} onClick={()=>{
              const _cb = balances.filter(b=>(b.account_name||"").toUpperCase().includes("CHECKING"));
              const _cmp = _cb.length > 0 ? _cb : balances;
              const bankWith = _cmp.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
              const bankDep  = _cmp.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
              const extWith  = transactions.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
              const extDep   = transactions.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
              const hasDiff  = Math.abs(bankWith-extWith)>50 || Math.abs(bankDep-extDep)>50;
              setScreen(hasDiff ? "dedup" : askQueue.length>0 ? "resolve" : "review");
            }}>
              {(()=>{
                const _cb2 = balances.filter(b=>(b.account_name||"").toUpperCase().includes("CHECKING"));
                const _cmp2 = _cb2.length > 0 ? _cb2 : balances;
                const bankWith = _cmp2.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
                const bankDep  = _cmp2.reduce((s,b)=>s+(parseFloat(b.total_deposits)||0),0);
                const extWith  = transactions.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
                const extDep   = transactions.filter(r=>r.type==="DEPOSIT").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
                const hasDiff  = Math.abs(bankWith-extWith)>50 || Math.abs(bankDep-extDep)>50;
                if (hasDiff) return "🔧 Corregir duplicados →";
                return askQueue.length>0 ? `Resolver ${askQueue.length} ambigüedades →` : "Ver transacciones →";
              })()}
            </button>
          </div>
        </div>
      )}
      {/* ── DEDUP ── */}
      {screen==="dedup"&&(()=>{
        const withRows = transactions
          .map((r,i) => ({...r, _idx:i}))
          .filter(r => r.type==="WITHDRAWAL");
        const conceptCount = {};
        withRows.forEach(r => {
          const key = r.concept.trim() + "||" + Math.abs(parseFloat(r.amount)||0).toFixed(2) + "||" + r.date;
          conceptCount[key] = (conceptCount[key]||0) + 1;
        });
        const dupKeys = Object.keys(conceptCount).filter(k => conceptCount[k] > 1);
        const dupConcepts = dupKeys.map(k => {
          const [concept, amt, date] = k.split("||");
          return `${concept} ($${fmt(parseFloat(amt))}) — ${date}`;
        });
        const groups = {};
        dupKeys.forEach(k => {
          const [concept, amt, date] = k.split("||");
          const displayKey = `${concept} ($${fmt(parseFloat(amt))}) — ${date}`;
          groups[displayKey] = withRows.filter(r =>
            r.concept.trim() === concept &&
            Math.abs(parseFloat(r.amount)||0).toFixed(2) === amt &&
            r.date === date
          );
        });
        const markedAmt = Object.entries(dedupMarked)
          .filter(([,v]) => v)
          .reduce((s, [k]) => {
            const parts = k.split("||");
            return s + (parseFloat(parts[1])||0);
          }, 0);
        const bankWith = balances.reduce((s,b)=>s+(parseFloat(b.total_withdrawals)||0),0);
        const extWith  = transactions.filter(r=>r.type==="WITHDRAWAL").reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
        const currentDiff = extWith - bankWith;
        const afterDiff = currentDiff - markedAmt;
        const markedCount = Object.values(dedupMarked).filter(Boolean).length;
        return (
          <div style={S.page}>
            <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
              <div>
                <h1 style={S.h1}>🔧 Corrector de Duplicados</h1>
                <p style={S.sub}>Selecciona las transacciones duplicadas a eliminar</p>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.btn,...S.btnOutline,fontSize:12,color:"#fff",background:"#64748b",border:"none"}}
                  onClick={()=>setScreen("reconcile")}>← Volver</button>
                <button style={{...S.btn,...S.btnGold}} onClick={()=>setScreen(askQueue.length>0?"resolve":"review")}>
                  Saltar →
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              {[
                {l:"Diferencia actual",   v:`$${fmt(currentDiff)}`,  c:"#ef4444"},
                {l:"Marcado a eliminar",  v:`$${fmt(markedAmt)}`,    c:"#f59e0b"},
                {l:"Diferencia restante", v:`$${fmt(Math.abs(afterDiff))}`, c:Math.abs(afterDiff)<1?"#22c55e":"#ef4444"},
                {l:"Transacciones",       v:`${markedCount} selec.`, c:"#1a56db"},
              ].map(s=>(
                <div key={s.l} style={{...S.card,flex:1,minWidth:140,marginBottom:0,padding:"12px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:1,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {dupConcepts.length === 0 ? (
              <div style={{...S.card,textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:32,marginBottom:10}}>✅</div>
                <div style={{fontWeight:600,color:"#1a1a1a",marginBottom:6}}>No se encontraron duplicados exactos</div>
                <div style={{fontSize:12,color:"#64748b"}}>La diferencia puede ser por transacciones faltantes, no duplicadas.</div>
                <button style={{...S.btn,...S.btnGold,marginTop:16}} onClick={()=>setScreen(askQueue.length>0?"resolve":"review")}>
                  Continuar de todas formas →
                </button>
              </div>
            ) : (
              <>
                <div style={{...S.card,padding:0,overflow:"hidden",marginBottom:14}}>
                  <div style={{background:"#0f1f4b",color:"#fff",padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>📋 CONCEPTOS DUPLICADOS ({dupConcepts.length} grupos)</span>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>downloadDupReport(dupConcepts, groups)}
                        style={{fontSize:11,fontWeight:700,background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"4px 12px",cursor:"pointer"}}>
                        📥 Descargar Reporte
                      </button>
                      <button onClick={()=>{
                        const allMarked = {};
                        dupConcepts.forEach(displayKey => {
                          const rows = groups[displayKey];
                          rows.slice(1).forEach(r => {
                            const key = r.concept+"||"+Math.abs(parseFloat(r.amount)||0).toFixed(2)+"||"+r._idx;
                            allMarked[key] = true;
                          });
                        });
                        setDedupMarked(allMarked);
                      }} style={{fontSize:11,fontWeight:700,background:"#f59e0b",color:"#000",border:"none",borderRadius:6,padding:"4px 12px",cursor:"pointer"}}>
                        Marcar todos los duplicados
                      </button>
                    </div>
                  </div>
                  <div style={{maxHeight:460,overflowY:"auto"}}>
                    {dupConcepts.map(concept => {
                      const rows = groups[concept];
                      const totalAmt = rows.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0);
                      return (
                        <div key={concept} style={{borderBottom:"1px solid #e2e8f0"}}>
                          <div style={{background:"#f8fafc",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
                            <span style={{background:"#fee2e2",color:"#991b1b",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>
                              {rows.length}x
                            </span>
                            <span style={{fontWeight:700,fontSize:13,color:"#1a1a1a",flex:1}}>{concept}</span>
                            <span style={{fontSize:12,color:"#64748b"}}>${fmt(totalAmt)} total</span>
                          </div>
                          {rows.map((r,ri) => {
                            const key = r.concept+"||"+Math.abs(parseFloat(r.amount)||0).toFixed(2)+"||"+r._idx;
                            const isMarked = !!dedupMarked[key];
                            const isFirst = ri === 0;
                            return (
                              <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 16px 9px 32px",background:isMarked?"#fff8f8":isFirst?"#f0fdf4":"#fff",borderTop:"1px solid #f1f5f9",transition:"background 0.15s"}}>
                                <input type="checkbox" checked={isMarked}
                                  onChange={e => setDedupMarked(prev=>({...prev,[key]:e.target.checked}))}
                                  style={{width:16,height:16,cursor:"pointer",accentColor:"#ef4444"}}
                                />
                                <div style={{fontSize:11,color:"#64748b",minWidth:70}}>{r.date}</div>
                                <div style={{fontSize:13,fontWeight:700,color:"#ef4444",minWidth:90}}>-${fmt(Math.abs(parseFloat(r.amount)||0))}</div>
                                <div style={{flex:1,fontSize:11,color:"#444"}}>{r.concept}</div>
                                <div style={{fontSize:10,padding:"2px 8px",borderRadius:4,fontWeight:700,
                                  background:isFirst?"#dcfce7":"#fee2e2",
                                  color:isFirst?"#166534":"#991b1b"}}>
                                  {isFirst ? "✓ ORIGINAL" : "⚠ DUPLICADO"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div style={{fontSize:13,color:"#64748b"}}>
                    {markedCount > 0
                      ? `${markedCount} transacciones marcadas — se eliminarán $${fmt(markedAmt)} de retiros`
                      : "Marca las transacciones duplicadas para eliminarlas"}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btn,background:"#e2e8f0",color:"#64748b",fontSize:12}}
                      onClick={()=>setDedupMarked({})}>
                      Limpiar selección
                    </button>
                    <button
                      disabled={markedCount===0}
                      style={{...S.btn,...S.btnGold,fontSize:14,padding:"10px 28px",
                        opacity:markedCount===0?0.5:1,cursor:markedCount===0?"not-allowed":"pointer"}}
                      onClick={()=>{
                        const keys = new Set(Object.entries(dedupMarked).filter(([,v])=>v).map(([k])=>k));
                        applyDedup(keys);
                      }}>
                      ✅ Aplicar y recalcular ({markedCount})
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}
      {/* ── RESOLVE ── */}
      {screen==="resolve"&&askQueue.length>0&&(()=>{
        const ask=askQueue[currentAsk];
        const isDeposit=ask.type==="DEPOSIT";
        const cats=isDeposit?DEPOSIT_CATEGORIES:WITHDRAWAL_CATEGORIES;
        const upper=ask.concept.toUpperCase();
        const isZelle=upper.includes("ZELLE");
        const isATM=upper.includes("ATM");
        const zelleMatch=ask.concept.match(/ZELLE\s+(?:TRANSFER\s+(?:IN|OUT)\s+-\s+(?:ZELLE\s+)?|PAYMENT\s+(?:TO|FROM)\s+)?(.+)/i);
        const zelleName=zelleMatch?zelleMatch[1].trim():"";
        return (
          <div style={S.page}>
            <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><h1 style={S.h1}>Resolver Ambigüedades</h1><p style={S.sub}>{currentAsk+1} de {askQueue.length}</p></div>
              <button style={{...S.btn,...S.btnOutline,fontSize:12,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>setScreen("review")}>Saltar todos →</button>
            </div>
            <div style={{height:4,background:"#e2e8f0",borderRadius:2,marginBottom:22,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#1a56db",width:`${(currentAsk/askQueue.length)*100}%`,transition:"width 0.3s"}} />
            </div>
            <div style={S.card}>
              <div style={{background:"#f4f6f9",borderRadius:8,padding:14,marginBottom:16}}>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  <div><span style={S.label}>FECHA</span><div style={{fontWeight:600}}>{ask.date}</div></div>
                  <div><span style={S.label}>MONTO</span><div style={{fontWeight:600,color:isDeposit?"#166534":"#991b1b"}}>{isDeposit?"+":""}{ask.amount}</div></div>
                  <div style={{flex:1}}><span style={S.label}>CONCEPTO</span><div style={{fontWeight:600}}>{ask.concept}</div></div>
                </div>
                {ask.reason&&<div style={{marginTop:8,fontSize:12,color:"#888"}}>💡 {ask.reason}</div>}
              </div>
              {isZelle&&!isDeposit&&zelleName&&(
                <div style={{marginBottom:16}}>
                  <span style={S.label}>ZELLE A: <strong style={{color:"#1a1a1a"}}>{zelleName}</strong></span>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                    {[{l:"👷 Subcontractor",c:"Subcontractor Expense"},{l:"💼 Payroll",c:"Payroll & Wages"},{l:"🏠 Owner Draw",c:"Owner Draw"},{l:"👤 Personal Payment",c:"Personal Payment"},{l:"🙏 Donations",c:"Donations"},{l:"📦 Materials",c:"Materials"},{l:"🔄 Transfer Out",c:"Transfer Out"},{l:"🍽️ Meals",c:"Meals & Entertainment"}].map(o=>(
                      <button key={o.c} className="ropt" onClick={()=>resolveAsk(o.c,true,zelleName)}>{o.l}</button>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:5}}>✓ Se guardará en memoria: "{zelleName}"</div>
                </div>
              )}
              {isZelle&&isDeposit&&zelleName&&(
                <div style={{marginBottom:16}}>
                  <span style={S.label}>ZELLE DE: <strong style={{color:"#1a1a1a"}}>{zelleName}</strong></span>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                    {[{l:"💰 Income Services",c:"Income - Services"},{l:"🏦 Owner Investment",c:"Owner Investment"},{l:"🔄 Transfer In",c:"Transfer In"},{l:"📤 Loan Proceeds",c:"Loan Proceeds"}].map(o=>(
                      <button key={o.c} className="ropt" onClick={()=>resolveAsk(o.c,true,zelleName)}>{o.l}</button>
                    ))}
                  </div>
                </div>
              )}
              {isATM&&(
                <div style={{marginBottom:16}}>
                  <span style={S.label}>ATM WITHDRAWAL</span>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                    {["Owner Draw","Personal Payment","Donations","Materials","Meals & Entertainment","Payroll & Wages","Operating Expenses - Supplies"].map(c=>(
                      <button key={c} className="ropt" onClick={()=>resolveAsk(c,false,"")}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginBottom:14}}>
                <span style={S.label}>CATEGORÍA MANUAL:</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:8}}>
                  {cats.filter(c=>c!=="ASK TO CLIENT").map(c=>(
                    <button key={c} className="ropt" onClick={()=>resolveAsk(c,false,"")} style={{textAlign:"left"}}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <button style={{...S.btn,...S.btnOutline,fontSize:11,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>{if(currentAsk+1<askQueue.length)setCurrentAsk(currentAsk+1);else setScreen("review");}}>Dejar como ASK TO CLIENT</button>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button
                    disabled={currentAsk===0}
                    onClick={()=>setCurrentAsk(currentAsk-1)}
                    style={{...S.btn,fontSize:13,padding:"6px 14px",background:currentAsk===0?"#e2e8f0":"#0f1f4b",color:currentAsk===0?"#aaa":"#fff",border:"none",cursor:currentAsk===0?"not-allowed":"pointer"}}>
                    ← Anterior
                  </button>
                  <span style={{fontSize:11,color:"#bbb",minWidth:80,textAlign:"center"}}>{currentAsk+1} / {askQueue.length}</span>
                  <button
                    disabled={currentAsk+1>=askQueue.length}
                    onClick={()=>setCurrentAsk(currentAsk+1)}
                    style={{...S.btn,fontSize:13,padding:"6px 14px",background:currentAsk+1>=askQueue.length?"#e2e8f0":"#0f1f4b",color:currentAsk+1>=askQueue.length?"#aaa":"#fff",border:"none",cursor:currentAsk+1>=askQueue.length?"not-allowed":"pointer"}}>
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ── REVIEW ── */}
      {screen==="review"&&(
        <div style={S.page}>
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
            {[
              {l:"Total",       v:transactions.length, c:"#111111"},
              {l:"Deposits",    v:deposits.length,     c:"#166534"},
              {l:"Withdrawals", v:withdrawals.length,  c:"#991b1b"},
              {l:"Transfers",   v:transfers.length,    c:"#0369a1"},
              {l:"Cheques",     v:checks.length,       c:"#b45309"},
              {l:"Auto-cat.",   v:autoResolved,        c:"#6b21a8"},
              {l:"Memoria",     v:memHits,             c:"#1e40af"},
              {l:"ASK",         v:`${asks.length} (${askPct}%)`, c:askPct>15?"#991b1b":"#92400e"},
            ].map(s=>(
              <div key={s.l} style={{...S.card,flex:1,minWidth:80,marginBottom:0,padding:"10px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:1,marginBottom:3}}>{s.l}</div>
                <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          {askPct>15&&<div style={{background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:8,padding:"9px 14px",marginBottom:12,fontSize:12,color:"#92400e"}}>⚠️ <strong>ALERTA:</strong> {askPct}% supera el límite de 15%</div>}
          <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button style={{...S.btn,background:"#edf2f7",color:"#1a1a1a",fontSize:11,padding:"6px 12px"}} onClick={()=>setScreen("reconcile")}>⚖️ Conciliación</button>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:0,alignItems:"center",border:"1px solid #1a56db",borderRadius:10,overflow:"hidden",background:"#fff"}}>
                <select value={selectedCat} onChange={e=>setSelectedCat(e.target.value)}
                  style={{padding:"7px 10px",border:"none",fontSize:11,fontFamily:"inherit",color:"#1a1a1a",background:"transparent",cursor:"pointer",outline:"none",maxWidth:220,minWidth:160}}>
                  <option value="">— Elegir categoría —</option>
                  {categoriesWithCount.map(({cat,count})=>(
                    <option key={cat} value={cat}>{cat} ({count})</option>
                  ))}
                </select>
                <button onClick={()=>downloadByCategory(selectedCat)} disabled={!selectedCat}
                  style={{padding:"7px 14px",border:"none",borderLeft:"1px solid #1a56db",cursor:selectedCat?"pointer":"not-allowed",fontSize:11,fontWeight:700,
                    background:selectedCat?"#1a56db":"#94a3b8",color:"#fff",fontFamily:"inherit",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                  ⬇ Por Categoría
                </button>
              </div>
              <button style={{...S.btn,...S.btnOutline,fontSize:11,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>downloadWave("DEPOSIT")}>⬇ Wave DEPOSITS</button>
              <button style={{...S.btn,...S.btnOutline,fontSize:11,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>downloadWave("WITHDRAWAL")}>⬇ Wave WITHDRAWALS</button>
              <button style={{...S.btn,...S.btnPrimary,fontSize:11}} onClick={downloadCSV}>⬇ CSV Completo</button>
              <button style={{...S.btn,background:"#166534",color:"#fff",fontSize:11,fontWeight:700}} onClick={downloadPnL}>📊 P&L + Personales</button>
              <button style={{...S.btn,...S.btnGold}} onClick={finalize}>✓ Finalizar</button>
            </div>
          </div>
          {deposits.length>0&&(
            <div style={{...S.card,padding:0,overflow:"hidden",marginBottom:12}}>
              <div style={{background:"#166534",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:1}}>▲ DEPOSITS ({deposits.length})</div>
              <TableRows rows={deposits} allRows={transactions} updateCategory={updateCategory} cats={DEPOSIT_CATEGORIES} levelColor={levelColor} />
            </div>
          )}
          {withdrawals.length>0&&(
            <div style={{...S.card,padding:0,overflow:"hidden",marginBottom:12}}>
              <div style={{background:"#991b1b",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:1}}>▼ WITHDRAWALS ({withdrawals.length})</div>
              <TableRows rows={withdrawals} allRows={transactions} updateCategory={updateCategory} cats={WITHDRAWAL_CATEGORIES} levelColor={levelColor} />
            </div>
          )}
          {checkReportRows.length>0&&(
            <div style={{...S.card,padding:0,overflow:"hidden",marginBottom:12}}>
              <div style={{background:"#0f1f4b",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:1}}>
                📋 REPORTE DE CHEQUES ({checks.length} cheques · Total: ${fmt(checks.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0))})
              </div>
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 110px",padding:"7px 14px",background:"#f4f6f9",borderBottom:"1px solid #e2e8f0"}}>
                  {["NOMBRE / PAYEE","# CHEQUES","TOTAL PAGADO"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:1}}>{h}</div>)}
                </div>
                <div style={{maxHeight:300,overflowY:"auto"}}>
                  {checkReportRows.map(([name,data])=>(
                    <div key={name} className="tr" style={{display:"grid",gridTemplateColumns:"1fr 80px 110px",padding:"9px 14px",borderBottom:"1px solid #edf2f7",alignItems:"center"}}>
                      <div style={{fontWeight:600,fontSize:13}}>{name}</div>
                      <div style={{fontSize:13,color:"#666",textAlign:"center"}}>{data.count}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a56db",textAlign:"right"}}>${fmt(data.total)}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"8px 14px",background:"#e8f0fe",display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#1a56db",fontWeight:600}}>Total en cheques:</span>
                  <span style={{fontSize:15,fontWeight:700,color:"#92400e"}}>${fmt(checks.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0))}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── DONE ── */}
      {screen==="done"&&(
        <div style={{...S.page,textAlign:"center",paddingTop:60}}>
          <div style={{fontSize:52,marginBottom:14}}>✅</div>
          <h1 style={S.h1}>¡Statement completado!</h1>
          <p style={{color:"#888",marginTop:6,marginBottom:10,fontSize:13}}>
            {transactions.length} transacciones · 🔄 {transfers.length} transfers · 🧠 {Object.keys(clientData?.learnedMerchants||{}).length} en memoria
            {bankInfo?.bank_name ? ` · 🏦 ${bankInfo.bank_name}` : ""}
          </p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:20}}>
            <button style={{...S.btn,...S.btnOutline,color:"#fff",background:"#1a56db",borderColor:"#1a56db"}} onClick={()=>{setFile(null);setTransactions([]);setBalances([]);setBankInfo(null);setScreen("upload")}}>Otro PDF</button>
            <button style={{...S.btn,...S.btnPrimary}} onClick={()=>{setFile(null);setTransactions([]);setBalances([]);setBankInfo(null);setScreen("home")}}>Dashboard</button>
          </div>
        </div>
      )}
      {/* ── DEV MODAL SECRETO ── */}
      {showDevModal && (()=>{
        const learned = clientData?.learnedMerchants || {};
        const sessionResolved = transactions
          .filter(r => r.level === "RESOLVED" && r.concept && r.category && r.category !== "ASK TO CLIENT")
          .reduce((acc, r) => {
            const key = r.concept.replace(/CHECK #\d+\s*-?\s*/i,"").replace(/ZELLE\s*(TRANSFER\s*(IN|OUT)\s*-\s*)?/i,"").trim().split(" ").slice(0,3).join(" ").toUpperCase();
            if (key && key.length > 2 && !acc[key]) acc[key] = r.category;
            return acc;
          }, {});
        const allRules = { ...sessionResolved, ...learned };
        const today2 = new Date().toLocaleDateString("es-MX");
        const codeLines = Object.entries(allRules)
          .map(([k,v]) => `  { patterns:["${k}"], category:"${v}" },`)
          .join("\n");
        const fullCode = Object.keys(allRules).length > 0
          ? `// Reglas aprendidas - ${today2}\n// Cliente: ${clientData?.name || ""}\n// Tipo de negocio: ${clientData?.businessType || ""}\n// Pegar dentro de MERCHANT_DICT en App.jsx — buscar sección del tipo de negocio\n\n${codeLines}`
          : `// Sin reglas aprendidas aún\n// Procesa un statement y resuelve las ambigüedades primero`;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}
            onClick={()=>setShowDevModal(false)}>
            <div style={{background:"#0f1f4b",border:"1px solid #1a56db",borderRadius:16,padding:28,maxWidth:640,width:"100%",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{color:"#fff",fontWeight:700,fontSize:16}}>🧠 Reglas Aprendidas</div>
                  <div style={{color:"#94a3b8",fontSize:12,marginTop:2}}>{Object.keys(allRules).length} reglas · {clientData?.name}</div>
                </div>
                <button onClick={()=>setShowDevModal(false)}
                  style={{background:"transparent",border:"none",color:"#94a3b8",fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
              </div>
              <div style={{background:"#020a1a",borderRadius:10,padding:16,flex:1,overflowY:"auto",fontFamily:"monospace",fontSize:12,color:"#22c55e",lineHeight:1.8,whiteSpace:"pre-wrap",border:"1px solid rgba(26,86,219,0.3)"}}>
                {fullCode}
              </div>
              <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
                <div style={{fontSize:11,color:"#64748b",alignSelf:"center",flex:1}}>
                  Copia este código y pégalo en MERCHANT_DICT
                </div>
                <button
                  onClick={()=>{
                    navigator.clipboard.writeText(fullCode);
                    setCopied(true);
                    setTimeout(()=>setCopied(false),2000);
                  }}
                  style={{padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                    background:copied?"#22c55e":"#1a56db",color:"#fff",transition:"all 0.2s"}}>
                  {copied ? "✅ Copiado!" : "📋 Copiar código"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
// ── FRASE ROTATIVA ──────────────────────────────────────────────────────────
function FraseRotativa({ frases }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % frases.length);
        setVisible(true);
      }, 400);
    }, 12000);
    return () => clearInterval(interval);
  }, [frases.length]);
  return (
    <div style={{height:32,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <p style={{
        color:"#f0c040",
        fontSize:13,
        fontStyle:"italic",
        textAlign:"center",
        maxWidth:420,
        transition:"opacity 0.4s ease, transform 0.4s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        margin:0,
        padding:"0 20px",
      }}>
        {frases[idx]}
      </p>
    </div>
  );
}
// ── ANIMATED PERCENT ─────────────────────────────────────────────────────────
function AnimatedPct({ target }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(display);
  useEffect(() => {
    if (target <= ref.current) {
      ref.current = target;
      setDisplay(target);
      return;
    }
    const diff = target - ref.current;
    const step = Math.max(1, Math.floor(diff / 8));
    const timer = setInterval(() => {
      ref.current = Math.min(ref.current + step, target);
      setDisplay(ref.current);
      if (ref.current >= target) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span style={{
      color:"#1a56db",
      fontSize:22,
      fontWeight:700,
      fontFamily:"monospace",
      minWidth:56,
      textAlign:"right",
      textShadow:"0 0 12px rgba(26,86,219,0.6)"
    }}>
      {display}%
    </span>
  );
}
function TableRows({rows,allRows,updateCategory,cats,levelColor}) {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"100px 88px 1fr 195px 55px",padding:"7px 14px",background:"#f4f6f9",borderBottom:"1px solid #e2e8f0"}}>
        {["DATE","AMOUNT","CONCEPT","CATEGORY","NIVEL"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:1}}>{h}</div>)}
      </div>
      <div style={{maxHeight:420,overflowY:"auto"}}>
        {rows.map((row,i)=>{
          const globalIdx=allRows.indexOf(row);
          const lci=levelColor(row.level);
          return (
            <div key={i} className="tr" style={{display:"grid",gridTemplateColumns:"100px 88px 1fr 195px 55px",padding:"7px 14px",borderBottom:"1px solid #edf2f7",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#888"}}>{row.date}</div>
              <div style={{fontSize:12,fontWeight:600,color:parseFloat(row.amount)>=0?"#166634":"#991b1b"}}>{parseFloat(row.amount)>=0?"+":""}{row.amount}</div>
              <div style={{fontSize:11,color:"#444",paddingRight:10,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={row.concept}>{row.concept}</div>
              <select value={row.category} onChange={e=>updateCategory(globalIdx,e.target.value)}
                style={{width:"100%",padding:"3px 5px",border:"1px solid #e2e8f0",borderRadius:5,fontSize:11,fontFamily:"inherit",background:row.category==="ASK TO CLIENT"?"#fee2e2":"#fff",cursor:"pointer"}}>
                {cats.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{textAlign:"center"}}>
                <span style={{background:lci.bg,color:lci.color,borderRadius:4,padding:"2px 5px",fontSize:9,fontWeight:700}}>
                  {row.level==="TRANSFER"?"XFER":row.level==="CHECK"?"CHK":row.level?.slice(0,4)||"?"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
