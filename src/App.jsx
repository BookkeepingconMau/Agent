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
];

const tradesFuel = (cat) => ({ construction:cat,hvac:cat,roofing:cat,drywall:cat,electrical:cat,plumbing:cat,landscaping:cat,cleaning:"Vehicle - Fuel (Non-Production)",food_events:"Vehicle - Fuel (Non-Production)",restaurant:"Vehicle - Fuel (Non-Production)",trucking:"COGS - Fuel (Production)",property_mgmt:"Vehicle - Fuel (Non-Production)",barbershop:"Vehicle - Fuel (Non-Production)",general:"Vehicle - Fuel (Non-Production)" });
const tradesMat  = (fallback="ASK TO CLIENT") => ({ construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:fallback,trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"COGS - Materials",general:fallback });

const MERCHANT_DICT = [
  // ── FUEL ──
  ...[["QT","QUIKTRIP","QUICK TRIP"],["RACETRAC"],["VALERO"],["STRIPES"],["MURPHY USA","MURPHY EXPRESS"],["CIRCLE K"],["SPEEDWAY"],["WAWA"],["THORNTONS"],["SHELL"],["CHEVRON"],["EXXON","EXXONMOBIL"],["BP ","BP#"],["MARATHON"],["CASEY"],["KWIK TRIP","KWIKTRIP"],["LOVES","LOVE'S"],["PILOT TRAVEL","PILOT FLYING"],["FLYING J"],["ARCO"],[" 76 "," 76#"],["SUNOCO"]].map(p=>({ patterns:p, category:tradesFuel("COGS - Fuel (Production)"), amountRule:{under15:"Meals & Entertainment"} })),

  // ── HVAC SPECIFIC ──
  ...[["JOHNSTONE SUPPLY","JOHNSTONE"],["WATSCO"],["CARRIER"],["TRANE"],["LENNOX"],["YORK HVAC"],["RHEEM"],["GOODMAN"],["REFRIGERANT","R-410","FREON"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── ROOFING SPECIFIC ──
  ...[["ABC SUPPLY","ABC ROOFING"],["BEACON ROOFING"],["GULFEAGLE"],["OWENS CORNING"],["GAF ROOFING","GAF MATERIAL"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── DRYWALL SPECIFIC ──
  ...[["USG ","US GYPSUM"],["NATIONAL GYPSUM"],["CERTAINTEED"],["GEORGIA PACIFIC"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── ELECTRICAL SPECIFIC ──
  ...[["GRAYBAR"],["REXEL"],["WESCO"],["PLATT ELECTRIC"],["CITY ELECTRIC"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── PLUMBING SPECIFIC ──
  ...[["HAJOCA"],["REEVES-SAIN","REEVES SAIN"],["CONSOLIDATED PIPE"],["BARNETT"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── BARBERSHOP SPECIFIC ──
  ...[["SALLY BEAUTY","SALLYS BEAUTY"],["COSMOPROF"],["BEAUTY SUPPLY"],["SALON CENTRIC"],["PAUL MITCHELL"]].map(p=>({patterns:p,category:"COGS - Materials"})),

  // ── CLEANING SPECIFIC ──
  ...[["ULINE","U-LINE"],["CINTAS"],["ZORO TOOLS","ZORO "]].map(p=>({patterns:p,category:"COGS - Materials"})),
  { patterns:["GRAINGER"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:"ASK TO CLIENT",trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },

  // ── PROPERTY MGMT SPECIFIC ──
  ...[["APARTMENT LIST"],["ZILLOW"],["COSTAR"],["APARTMENTS.COM"],["BUILDIUM"],["APPFOLIO"],["RENTMANAGER","RENT MANAGER"]].map(p=>({patterns:p,category:{property_mgmt:p[0].includes("BUILDIUM")||p[0].includes("APPFOLIO")||p[0].includes("RENTMANAGER")?"Software & Subscriptions":"Advertising & Marketing",construction:"Advertising & Marketing",hvac:"Advertising & Marketing",roofing:"Advertising & Marketing",drywall:"Advertising & Marketing",electrical:"Advertising & Marketing",plumbing:"Advertising & Marketing",landscaping:"Advertising & Marketing",cleaning:"Advertising & Marketing",food_events:"Advertising & Marketing",restaurant:"Advertising & Marketing",trucking:"Advertising & Marketing",barbershop:"Advertising & Marketing",general:"Advertising & Marketing"}})),

  // ── LATIN GROCERY ──
  ...[["FIESTA MART"],["CARDENAS"],["NORTHGATE"],["VALLARTA"],["HEB ","H-E-B"],["ALDI"],["CARNICERIA"],["PANADERIA"],["SURTIDORA"],["LUCKY SUPERMARKET"],["STATER BROS"],["BRAVO SUPER"],["SEDANOS"],["COMPARE FOODS"],["PRICE RITE"]].map(p=>({
    patterns:p,
    category:{food_events:"COGS - Materials",restaurant:"COGS - Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"COGS - Materials",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"}
  })),

  // ── HARDWARE ──
  { patterns:["HOME DEPOT","THE HOME DEPOT"], category:tradesMat("ASK TO CLIENT") },
  { patterns:["LOWES","LOWE'S"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["MENARDS"],                     category:tradesMat("ASK TO CLIENT") },
  { patterns:["ACE HARDWARE"],               category:tradesMat("ASK TO CLIENT") },
  { patterns:["TRUE VALUE"],                  category:tradesMat("ASK TO CLIENT") },
  { patterns:["FASTENAL"],                    category:tradesMat("Office Supplies") },
  { patterns:["TRACTOR SUPPLY"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["HARBOR FREIGHT"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["SHERWIN WILLIAMS","SHERWIN-WILLIAMS"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["FERGUSON"],                    category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["84 LUMBER"],                   category:tradesMat("ASK TO CLIENT") },
  { patterns:["FLOOR AND DECOR","FLOOR & DECOR"], category:{construction:"COGS - Materials",hvac:"ASK TO CLIENT",roofing:"ASK TO CLIENT",drywall:"COGS - Materials",electrical:"ASK TO CLIENT",plumbing:"ASK TO CLIENT",landscaping:"ASK TO CLIENT",cleaning:"ASK TO CLIENT",food_events:"ASK TO CLIENT",restaurant:"ASK TO CLIENT",trucking:"ASK TO CLIENT",property_mgmt:"Repairs & Maintenance",barbershop:"ASK TO CLIENT",general:"ASK TO CLIENT"} },
  { patterns:["SUNBELT RENTAL"],              category:tradesMat("ASK TO CLIENT") },
  { patterns:["UNITED RENTALS"],              category:tradesMat("ASK TO CLIENT") },

  // ── RESTAURANTS ──
  ...[["MCDONALD"],["STARBUCKS"],["CHICK-FIL-A","CHICKFILA"],["SUBWAY"],["CHIPOTLE"],["TACO BELL"],["WENDYS"],["BURGER KING"],["DOMINOS"],["PIZZA HUT"],["POPEYES"],["PANDA EXPRESS"],["IN-N-OUT"],["WHATABURGER"],["RAISING CANE"],["SONIC DRIVE"],["JACK IN THE BOX"],["DAIRY QUEEN"],["FIVE GUYS"],["PANERA"],["DUNKIN"]].map(p=>({patterns:p,category:"Meals & Entertainment"})),
  ...[["TAQUERIA"],["TACOS "],["CARNITAS"],["TAMALES"],["TORTAS"]].map(p=>({patterns:p,category:{food_events:"COGS - Materials",restaurant:"COGS - Materials",construction:"Meals & Entertainment",hvac:"Meals & Entertainment",roofing:"Meals & Entertainment",drywall:"Meals & Entertainment",electrical:"Meals & Entertainment",plumbing:"Meals & Entertainment",landscaping:"Meals & Entertainment",cleaning:"Meals & Entertainment",trucking:"Meals & Entertainment",property_mgmt:"Meals & Entertainment",barbershop:"Meals & Entertainment",general:"Meals & Entertainment"}})),
  { patterns:["PUPUSERIA"],  category:"Meals & Entertainment" },
  { patterns:["PALETERIA"],  category:"Meals & Entertainment" },

  // ── PAYMENT APPS ──
  { patterns:["WESTERN UNION"],              category:"Owner Draw" },
  { patterns:["MONEYGRAM","MONEY GRAM"],     category:"Owner Draw" },
  { patterns:["REMITLY"],                    category:"Owner Draw" },
  { patterns:["XOOM"],                       category:"Owner Draw" },
  { patterns:["CASH APP","CASHAPP"],         category:"ASK TO CLIENT" },
  { patterns:["VENMO"],                      category:"ASK TO CLIENT" },
  { patterns:["PAYPAL"],                     category:"ASK TO CLIENT" },
  { patterns:["APPLE CASH","APPLE PAY"],     category:"ASK TO CLIENT" },
  { patterns:["GOOGLE PAY"],                 category:"ASK TO CLIENT" },

  // ── INSURANCE ──
  ...[["STATE FARM"],["GEICO"],["PROGRESSIVE"],["ALLSTATE"],["FARMERS INS"],["NATIONWIDE"],["LIBERTY MUTUAL"],["WORKERS COMP"]].map(p=>({patterns:p,category:"Insurance"})),

  // ── LOANS ──
  ...[["CAMINO FINANCIAL"],["KABBAGE"],["ONDECK"],["BLUEVINE"],["FUNDBOX"],["CREDIBLY"],["LENDIO"]].map(p=>({patterns:p,category:"Loan Payment"})),

  // ── TELECOM ──
  ...[["VERIZON","VZWRLSS"],["AT&T","ATT "],["T-MOBILE","TMOBILE"],["METRO PCS","METROPCS"],["BOOST MOBILE"],["CRICKET "],["SIMPLE MOBILE"],["TRACFONE"],["SPECTRUM"],["XFINITY","COMCAST"],["DIRECTV"],["DISH NETWORK"]].map(p=>({patterns:p,category:"Telephone & Internet"})),

  // ── UTILITIES ──
  ...[["CONSTELLATION ENERGY"],["COMED"],["PEOPLES GAS"],["ATMOS ENERGY"],["ONCOR"],["FPL ","FLORIDA POWER"],["DUKE ENERGY"],["APS "],["SRP "]].map(p=>({patterns:p,category:"Utilities"})),

  // ── SOFTWARE ──
  ...[["QUICKBOOKS"],["INTUIT"],["CANVA"],["ADOBE"],["MICROSOFT 365"],["GOOGLE WORKSPACE"],["DROPBOX"],["ZOOM"],["SLACK"],["SHOPIFY"],["GODADDY"],["WIX"],["NETFLIX"],["SPOTIFY"],["HULU"],["DISNEY+","DISNEY PLUS"],["BUILDIUM"],["APPFOLIO"],["MAILCHIMP"],["CONSTANTCONTACT"]].map(p=>({patterns:p,category:"Software & Subscriptions"})),
  { patterns:["SQUARE ","SQUARE*","SQ *","SQ*"], category:"ASK TO CLIENT" },
  { patterns:["STRIPE"],                         category:"ASK TO CLIENT" },

  // ── PAYROLL ──
  ...[["GUSTO"],["ADP ","ADP*"],["PAYCHEX"]].map(p=>({patterns:p,category:"Payroll & Wages"})),

  // ── VEHICLE ──
  ...[["AUTOZONE"],["OREILLY","O'REILLY"],["ADVANCE AUTO"],["NAPA AUTO"],["PEP BOYS"],["JIFFY LUBE"],["FIRESTONE"],["GOODYEAR"],["MAVIS TIRE"],["DISCOUNT TIRE"],["CAR WASH","CARWASH"]].map(p=>({patterns:p,category:"Vehicle - Maintenance"})),
  { patterns:["UBER EATS","UBEREATS"],  category:"Meals & Entertainment" },
  { patterns:["DOORDASH"],              category:"Meals & Entertainment" },
  { patterns:["GRUBHUB"],               category:"Meals & Entertainment" },
  { patterns:["UBER ","UBER*"],         category:"Travel & Transportation" },
  { patterns:["LYFT"],                  category:"Travel & Transportation" },
  ...[["IPASS"],["SUNPASS"],["TXTAG"],["EZPASS"],["TOLL "]].map(p=>({patterns:p,category:{trucking:"COGS - Fuel (Production)",construction:"Travel & Transportation",hvac:"Travel & Transportation",roofing:"Travel & Transportation",drywall:"Travel & Transportation",electrical:"Travel & Transportation",plumbing:"Travel & Transportation",landscaping:"Travel & Transportation",cleaning:"Travel & Transportation",food_events:"Travel & Transportation",restaurant:"Travel & Transportation",property_mgmt:"Travel & Transportation",barbershop:"Travel & Transportation",general:"Travel & Transportation"}})),
  ...[["SPIRIT AIRLINES"],["FRONTIER AIRLINES"],["AMERICAN AIRLINES"],["SOUTHWEST AIRLINES"]].map(p=>({patterns:p,category:"Travel & Transportation"})),

  // ── RETAIL ──
  { patterns:["WALMART","WAL-MART"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:"COGS - Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"COGS - Materials",general:"Office Supplies"} },
  { patterns:["SAMS CLUB","SAM'S CLUB"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:"COGS - Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"COGS - Materials",general:"Office Supplies"} },
  { patterns:["COSTCO"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:"COGS - Materials",trucking:"Operating Expenses - Supplies",property_mgmt:"Operating Expenses - Supplies",barbershop:"COGS - Materials",general:"Office Supplies"} },
  { patterns:["AMAZON"], category:{construction:"COGS - Materials",hvac:"COGS - Materials",roofing:"COGS - Materials",drywall:"COGS - Materials",electrical:"COGS - Materials",plumbing:"COGS - Materials",landscaping:"COGS - Materials",cleaning:"COGS - Materials",food_events:"COGS - Materials",restaurant:"ASK TO CLIENT",trucking:"Operating Expenses - Supplies",property_mgmt:"Repairs & Maintenance",barbershop:"COGS - Materials",general:"Office Supplies"} },
  ...[["TARGET"],["DOLLAR TREE"],["DOLLAR GENERAL"],["FAMILY DOLLAR"],["FIVE BELOW"]].map(p=>({patterns:p,category:"Office Supplies"})),
  { patterns:["EBAY"], category:"ASK TO CLIENT" },
  ...[["ROSS DRESS","ROSS STORE"],["TJ MAXX","TJMAXX"],["BURLINGTON"],["MARSHALLS"]].map(p=>({patterns:p,category:"Uniforms"})),

  // ── ADVERTISING ──
  ...[["FACEBOOK ADS","FACEBOOK.COM"],["META ADS"],["GOOGLE ADS"],["YELP"],["THUMBTACK"],["HOMEADVISOR"],["ANGI "],["NEXTDOOR"],["VISTAPRINT"],["4IMPRINT"],["INDEED"],["ZIPRECRUITER"]].map(p=>({patterns:p,category:"Advertising & Marketing"})),

  // ── BANK FEES ──
  ...[["OVERDRAFT"],["NSF FEE"],["MONTHLY FEE","MONTHLY SERVICE FEE"],["SERVICE FEE"],["ATM FEE","ATM WITHDRAWAL FEE"],["WIRE FEE"],["LATE FEE"],["RETURNED ITEM"],["STOP PAYMENT"],["MINIMUM BALANCE"]].map(p=>({patterns:p,category:"Bank Fees"})),

  // ── MISC ──
  ...[["USPS"],["UPS STORE"],["FEDEX"]].map(p=>({patterns:p,category:"Operating Expenses - Delivery & Postage"})),
  ...[["STAPLES"],["OFFICE DEPOT"],["OFFICEMAX"]].map(p=>({patterns:p,category:"Office Supplies"})),
  { patterns:["UHAUL","U-HAUL"], category:"Operating Expenses - Supplies" },
  ...[["PUBLIC STORAGE"],["EXTRA SPACE STORAGE"],["CUBESMART"],["STORAGE "]].map(p=>({patterns:p,category:"Rent & Lease"})),
  ...[["AIRBNB"],["MARRIOTT"],["HILTON"],["MOTEL 6"]].map(p=>({patterns:p,category:"Travel & Transportation"})),
  { patterns:["PARKING"], category:"Operating Expenses - Parking" },
  ...[["IRS ","IRS*"],["STATE TAX","SALES TAX"]].map(p=>({patterns:p,category:"Taxes & Licenses"})),
];

const DEPOSIT_CATEGORIES    = ["Revenue - Services","Revenue - Sales","Revenue - Catering","Revenue - Construction","Revenue - Landscaping","Revenue - Trucking","Revenue - HVAC","Revenue - Roofing","Revenue - Cleaning","Loan Proceeds","Owner Investment","Transfer In","Refund Received","Other Income","ASK TO CLIENT"];
const WITHDRAWAL_CATEGORIES = ["COGS - Materials","COGS - Labor","COGS - Fuel (Production)","COGS - Food & Beverage","Subcontractor Expense","Payroll & Wages","Advertising & Marketing","Bank Fees","Insurance","Loan Payment","Meals & Entertainment","Office Supplies","Operating Expenses - Delivery & Postage","Operating Expenses - Parking","Operating Expenses - Supplies","Rent & Lease","Repairs & Maintenance","Software & Subscriptions","Taxes & Licenses","Telephone & Internet","Transfer Out","Travel & Transportation","Uniforms","Utilities","Vehicle - Fuel (Non-Production)","Vehicle - Maintenance","Owner Draw","ASK TO CLIENT"];

// ─── TRANSFER DETECTION ───────────────────────────────────────────────────────
const TRANSFER_IN_KEYWORDS  = ["INTERNET XFER FROM","XFER FROM CHKG","XFER FROM SAV","TRANSFER FROM","ONLINE TRANSFER FROM","FUNDS TRANSFER IN","MOBILE XFER FROM"];
const TRANSFER_OUT_KEYWORDS = ["INTERNET XFER TO","XFER TO CHKG","XFER TO SAV","TRANSFER TO","ONLINE TRANSFER TO","FUNDS TRANSFER OUT","MOBILE XFER TO"];

function detectTransfer(concept) {
  const upper = concept.toUpperCase();
  const isIn  = TRANSFER_IN_KEYWORDS.some(k  => upper.includes(k));
  const isOut = TRANSFER_OUT_KEYWORDS.some(k => upper.includes(k));
  if (!isIn && !isOut) return null;
  const digits = concept.match(/\b(\d{4})\b/g);
  const last4  = digits ? digits[digits.length - 1] : null;
  const cat    = isIn ? "Transfer In" : "Transfer Out";
  const label  = last4 ? `${cat} (****${last4})` : cat;
  return { category: cat, level:"TRANSFER", enrichedConcept: label };
}

// ─── CHECK DETECTION ──────────────────────────────────────────────────────────
function detectCheck(concept) {
  const upper = concept.toUpperCase();
  if (!upper.includes("CHECK") && !upper.match(/\bCHK\b/) && !upper.match(/\bCK#?\b/)) return null;
  const numMatch = concept.match(/(?:CHECK|CHK|CK#?)\s*#?\s*(\d+)/i);
  const checkNum = numMatch ? numMatch[1] : null;
  let payee = null;
  const afterNum = numMatch
    ? concept.slice((concept.toLowerCase().indexOf(numMatch[0].toLowerCase())) + numMatch[0].length).trim()
    : concept.replace(/check|chk|ck#?/gi,"").trim();
  const nameMatch = afterNum.match(/([A-Za-z][A-Za-z\s]{2,40})/);
  if (nameMatch) payee = nameMatch[1].trim().replace(/\s+/g," ");
  const parts = ["CHECK"];
  if (checkNum) parts.push(`#${checkNum}`);
  if (payee)    parts.push(`- ${payee}`);
  return { checkNum, payee, enrichedConcept: parts.join(" ") };
}

// ─── CATEGORIZATION ENGINE ─────────────────────────────────────────────────────
function categorize(concept, amount, isDeposit, businessType, learnedMerchants) {
  const upper = concept.toUpperCase();
  const amt   = Math.abs(parseFloat(amount) || 0);

  // 1. Transfer detection — auto from keywords
  const transfer = detectTransfer(concept);
  if (transfer) return transfer;

  // 2. Check detection → always Subcontractor Expense
  if (!isDeposit) {
    const check = detectCheck(concept);
    if (check) return { category:"Subcontractor Expense", level:"CHECK", payee:check.payee, checkNum:check.checkNum, enrichedConcept:check.enrichedConcept };
  }

  // 3. Memory
  for (const [key, cat] of Object.entries(learnedMerchants)) {
    if (upper.includes(key.toUpperCase())) return { category:cat, level:"MEMORY" };
  }

  // 4. Deposits
  if (isDeposit) {
    if (upper.includes("ZELLE") && upper.includes("TRANSFER IN")) return { category:"ASK TO CLIENT", level:"ASK", reason:"Zelle recibido — ¿Revenue o Owner Investment?" };
    return { category:"ASK TO CLIENT", level:"ASK", reason:"Ingreso no identificado" };
  }

  // 5. ATM always ASK
  if (upper.includes("ATM CASH") || upper.includes("ATM W/D") || upper.includes("CUSTOMER WITHDRAWAL")) {
    return { category:"ASK TO CLIENT", level:"ASK", reason:"ATM — ¿Owner Draw o gasto en efectivo?" };
  }

  // 6. Zelle out always ASK
  if (upper.includes("ZELLE") && (upper.includes("TRANSFER OUT") || upper.includes("PAYMENT TO"))) {
    return { category:"ASK TO CLIENT", level:"ASK", reason:"Zelle — ¿Subcontractor, Payroll o Personal?" };
  }

  // 7. Dictionary
  for (const entry of MERCHANT_DICT) {
    if (entry.patterns.some(p => upper.includes(p.toUpperCase()))) {
      if (entry.amountRule?.under15 && amt < 15) return { category:entry.amountRule.under15, level:"HARD" };
      if (typeof entry.category === "object") {
        const cat = entry.category[businessType] || entry.category.general || "ASK TO CLIENT";
        return { category:cat, level:"BUSINESS" };
      }
      return { category:entry.category, level:"HARD" };
    }
  }

  return { category:"ASK TO CLIENT", level:"ASK", reason:"Merchant no identificado" };
}

// ─── CLAUDE API ────────────────────────────────────────────────────────────────
async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("") || "";
}

async function extractTransactions(b64) {
  const system = `You are a STRICT bank statement extraction agent.
- Extract EVERY transaction. One row = one transaction.
- NEVER group, summarize, skip, or invent.
- DATE: MM/DD/YYYY. DEPOSITS: positive. WITHDRAWALS: negative.
- Output ONLY raw CSV: TYPE,DATE,AMOUNT,CONCEPT
- TYPE = DEPOSIT or WITHDRAWAL. No headers. No markdown.
- Include fees, ATM, transfers. Exclude balance/summary rows.`;
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
  return rows;
}

// ─── STORAGE ───────────────────────────────────────────────────────────────────
const sc = async (id) => { try { const r=await window.storage.get(`client:${id}`); return r?JSON.parse(r.value):null; } catch { return null; } };
const ss = async (id,d) => { try { await window.storage.set(`client:${id}`,JSON.stringify(d)); } catch {} };
const sl = async () => { try { const r=await window.storage.list("client:"); return r?.keys||[]; } catch { return []; } };

// ─── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]           = useState("home");
  const [clients, setClients]         = useState([]);
  const [clientId, setClientId]       = useState("");
  const [clientData, setClientData]   = useState(null);
  const [newName, setNewName]         = useState("");
  const [newType, setNewType]         = useState("");
  const [file, setFile]               = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [askQueue, setAskQueue]       = useState([]);
  const [currentAsk, setCurrentAsk]   = useState(0);
  const [progress, setProgress]       = useState("");
  const [dragOver, setDragOver]       = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadList(); }, []);

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
    setNewName(""); setNewType(""); setNewAccounts("");
    setScreen("upload");
  }

  async function selectClient(id) {
    const data = await sc(id);
    setClientId(id); setClientData(data);
    setScreen("upload");
  }

  async function runExtraction() {
    if (!file || !clientData) return;
    setScreen("extracting"); setProgress("Agente 1: Leyendo PDF...");
    const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
    setProgress("Agente 1: Extrayendo transacciones...");
    const rows = await extractTransactions(b64);
    setProgress("Agente 2: Categorizando...");
    const categorized = rows.map(row => {
      const isDeposit = row.type==="DEPOSIT";
      const result = categorize(row.concept, row.amount, isDeposit, clientData.businessType, clientData.learnedMerchants||{});
      return { ...row, concept: result.enrichedConcept||row.concept, category:result.category, level:result.level, reason:result.reason||"", payee:result.payee||null, checkNum:result.checkNum||null };
    });
    const asks = categorized.filter(r=>r.category==="ASK TO CLIENT");
    setTransactions(categorized); setAskQueue(asks); setCurrentAsk(0);
    setScreen(asks.length>0?"resolve":"review"); setProgress("");
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

  function updateCategory(idx, cat) {
    setTransactions(prev=>prev.map((r,i)=>i===idx?{...r,category:cat}:r));
  }

  async function finalize() {
    const entry = { date:new Date().toISOString().split("T")[0], file:file?.name, depositsCount:transactions.filter(r=>r.type==="DEPOSIT").length, withdrawalsCount:transactions.filter(r=>r.type==="WITHDRAWAL").length, askCount:transactions.filter(r=>r.category==="ASK TO CLIENT").length };
    const nd = { ...clientData, history:[...(clientData.history||[]),entry] };
    setClientData(nd); await ss(clientId,nd); setScreen("done");
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
    const csv = "DATE,AMOUNT,*,CONCEPT\n" + rows.map(r=>`${r.date},${r.amount},,\"${r.concept}\"`).join("\n");
    triggerDownload(`wave_${type.toLowerCase()}_import.csv`, csv);
  }
  function downloadCSV() {
    const csv = "DATE,AMOUNT,*,CONCEPT,CATEGORY\n" + transactions.map(r=>`${r.date},${r.amount},,\"${r.concept}\",\"${r.category}\"`).join("\n");
    triggerDownload(`wave_completo_${(clientData?.name||"client").replace(/\s/g,"_")}.csv`, csv);
  }

  const deposits     = transactions.filter(r=>r.type==="DEPOSIT");
  const withdrawals  = transactions.filter(r=>r.type==="WITHDRAWAL");
  const asks         = transactions.filter(r=>r.category==="ASK TO CLIENT");
  const transfers    = transactions.filter(r=>r.level==="TRANSFER");
  const checks       = transactions.filter(r=>r.level==="CHECK");
  const autoResolved = transactions.filter(r=>["HARD","BUSINESS"].includes(r.level)).length;
  const memHits      = transactions.filter(r=>r.level==="MEMORY").length;
  const askPct       = transactions.length ? Math.round(asks.length/transactions.length*100) : 0;

  // Build check report: group by payee
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

  const S = {
    app:{minHeight:"100vh",background:"#f7f6f2",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1a1a1a"},
    nav:{background:"#1a1a1a",padding:"0 28px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"},
    page:{maxWidth:940,margin:"0 auto",padding:"30px 20px"},
    h1:{fontSize:26,fontWeight:700,letterSpacing:"-0.5px",marginBottom:6},
    sub:{color:"#666",fontSize:13},
    card:{background:"#fff",borderRadius:12,border:"1px solid #e8e4dc",padding:20,marginBottom:14},
    btn:{padding:"9px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.15s"},
    btnPrimary:{background:"#1a1a1a",color:"#fff"},
    btnGold:{background:"#c8a96e",color:"#fff"},
    btnOutline:{background:"transparent",color:"#1a1a1a",border:"1px solid #ccc"},
    btnSm:{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600},
    input:{width:"100%",padding:"9px 13px",borderRadius:8,border:"1px solid #ddd",fontSize:13,outline:"none",fontFamily:"inherit"},
    label:{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:5,display:"block"},
  };

  const levelColor = l => ({
    HARD:    {bg:"#dcfce7",color:"#166534"},
    MEMORY:  {bg:"#dbeafe",color:"#1e40af"},
    BUSINESS:{bg:"#f3e8ff",color:"#6b21a8"},
    RESOLVED:{bg:"#fef9c3",color:"#713f12"},
    TRANSFER:{bg:"#e0f2fe",color:"#0369a1"},
    CHECK:   {bg:"#fef3c7",color:"#92400e"},
  }[l] || {bg:"#fee2e2",color:"#991b1b"});

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button:hover{opacity:0.85}
        input:focus{border-color:#c8a96e!important;box-shadow:0 0 0 3px rgba(200,169,110,0.12)}
        .cc:hover{background:#fafaf8!important;border-color:#c8a96e!important;cursor:pointer}
        .btype{padding:8px 12px;border-radius:8px;border:1px solid #e8e4dc;background:#fff;cursor:pointer;font-family:inherit;font-size:12px;transition:all 0.15s}
        .btype:hover,.btype.sel{border-color:#c8a96e;background:#fffbf4;font-weight:600}
        .drop{border:2px dashed #e8e4dc;border-radius:12px;padding:48px 28px;text-align:center;cursor:pointer;transition:all 0.2s}
        .drop:hover,.drop.over{border-color:#c8a96e;background:#fffbf4}
        .ropt{padding:8px 13px;border-radius:8px;border:1px solid #e8e4dc;background:#fff;cursor:pointer;font-size:12px;font-family:inherit;transition:all 0.15s}
        .ropt:hover{border-color:#c8a96e;background:#fffbf4}
        .tr:hover{background:#fafaf8}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      {/* NAV */}
      <div style={S.nav}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#f7f6f2"}}>
          Wave<span style={{color:"#c8a96e"}}>Book</span>
          <span style={{fontSize:11,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:400,marginLeft:8}}>v5.0 · 14 tipos · 300+ merchants · Transfers automáticos</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {clientData&&<span style={{color:"#888",fontSize:12}}>{clientData.name}</span>}
          <button style={{...S.btn,background:"#2a2a2a",color:"#f7f6f2",padding:"5px 14px",fontSize:11,border:"1px solid #3a3a3a"}} onClick={()=>{setScreen("home");setFile(null);setTransactions([])}}>
            👥 Clientes {clients.length>0&&<span style={{background:"#c8a96e",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:5}}>{clients.length}</span>}
          </button>
        </div>
      </div>

      {/* HOME */}
      {screen==="home"&&(
        <div style={S.page}>
          <div style={{marginBottom:24}}><h1 style={S.h1}>Bookkeeper Dashboard</h1><p style={S.sub}>14 tipos de negocio · Memoria persistente · Transfers automáticos</p></div>

          <div style={S.card}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:14}}>➕ Nuevo Cliente</h2>
            <div style={{display:"grid",gap:12,gridTemplateColumns:"1fr"}}>
              <div>
                <label style={S.label}>Nombre del cliente</label>
                <input style={S.input} placeholder="Ej: Juan García - HVAC" value={newName} onChange={e=>setNewName(e.target.value)} />
              </div>
            </div>
            <div style={{marginTop:12,marginBottom:14}}>
              <label style={S.label}>Tipo de negocio</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                {BUSINESS_TYPES.map(bt=>(
                  <button key={bt.id} className={`btype${newType===bt.id?" sel":""}`} onClick={()=>setNewType(bt.id)}>{bt.icon} {bt.label}</button>
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
                    <div key={c.id} className="cc" style={{padding:"12px 16px",border:"1px solid #e8e4dc",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",transition:"all 0.15s"}} onClick={()=>selectClient(c.id)}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{c.name}</div>
                        <div style={{color:"#999",fontSize:12,marginTop:2}}>
                          {bt?.icon} {bt?.label} · 🧠 {ml} aprendidas · 📄 {(c.history||[]).length} procesados
                        </div>
                      </div>
                      <button style={{...S.btn,...S.btnPrimary,fontSize:11,padding:"6px 14px"}}>Abrir →</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {clients.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#bbb",fontSize:13}}>Crea tu primer cliente para empezar</div>}
        </div>
      )}

      {/* UPLOAD */}
      {screen==="upload"&&clientData&&(
        <div style={S.page}>
          <div style={{marginBottom:20}}>
            <h1 style={S.h1}>{clientData.name}</h1>
            <p style={S.sub}>{BUSINESS_TYPES.find(b=>b.id===clientData.businessType)?.icon} {BUSINESS_TYPES.find(b=>b.id===clientData.businessType)?.label} · 🧠 {Object.keys(clientData.learnedMerchants||{}).length} aprendidas</p>
          </div>


          <div style={S.card}>
            <div className={`drop${dragOver?" over":""}`}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f?.type==="application/pdf")setFile(f)}}
              onClick={()=>fileRef.current.click()}>
              <div style={{fontSize:36,marginBottom:10}}>📄</div>
              {file?(<><div style={{fontWeight:600,color:"#c8a96e"}}>{file.name}</div><div style={{color:"#999",fontSize:12,marginTop:3}}>{(file.size/1024).toFixed(0)} KB</div></>)
                   :(<><div style={{fontWeight:500}}>Arrastra el bank statement aquí</div><div style={{color:"#999",fontSize:12,marginTop:3}}>o click · Solo PDF bancario digital</div></>)}
              <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)setFile(f)}} />
            </div>
            {file&&(
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
                <button style={{...S.btn,...S.btnOutline}} onClick={()=>setFile(null)}>Cambiar</button>
                <button style={{...S.btn,...S.btnGold}} onClick={runExtraction}>🚀 Procesar</button>
              </div>
            )}
          </div>

          {Object.keys(clientData.learnedMerchants||{}).length>0&&(
            <div style={S.card}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"#666"}}>🧠 MEMORIA ({Object.keys(clientData.learnedMerchants).length} reglas)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.entries(clientData.learnedMerchants).map(([k,v])=>(
                  <div key={k} style={{background:"#f7f6f2",border:"1px solid #e8e4dc",borderRadius:6,padding:"3px 9px",fontSize:11}}>
                    <span style={{fontWeight:600}}>{k}</span> → <span style={{color:"#c8a96e"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXTRACTING */}
      {screen==="extracting"&&(
        <div style={{...S.page,textAlign:"center",paddingTop:80}}>
          <div style={{fontSize:48,marginBottom:16,display:"inline-block",animation:"spin 2s linear infinite"}}>⚙️</div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Procesando...</h2>
          <p style={{color:"#888",fontSize:13}}>{progress}</p>
        </div>
      )}

      {/* RESOLVE */}
      {screen==="resolve"&&askQueue.length>0&&(()=>{
        const ask=askQueue[currentAsk];
        const isDeposit=ask.type==="DEPOSIT";
        const cats=isDeposit?DEPOSIT_CATEGORIES:WITHDRAWAL_CATEGORIES;
        const upper=ask.concept.toUpperCase();
        const isZelle=upper.includes("ZELLE");
        const isATM=upper.includes("ATM");
        const zelleMatch=ask.concept.match(/ZELLE\s+(?:TRANSFER\s+(?:IN|OUT)\s+-\s+(?:ZELLE\s+)?|PAYMENT\s+TO\s+)?(.+)/i);
        const zelleName=zelleMatch?zelleMatch[1].trim():"";
        return (
          <div style={S.page}>
            <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><h1 style={S.h1}>Resolver Ambigüedades</h1><p style={S.sub}>{currentAsk+1} de {askQueue.length} · Respuestas se guardan en memoria</p></div>
              <button style={{...S.btn,...S.btnOutline,fontSize:12}} onClick={()=>setScreen("review")}>Saltar todos →</button>
            </div>
            <div style={{height:4,background:"#e8e4dc",borderRadius:2,marginBottom:22,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#c8a96e",width:`${(currentAsk/askQueue.length)*100}%`,transition:"width 0.3s"}} />
            </div>
            <div style={S.card}>
              <div style={{background:"#f7f6f2",borderRadius:8,padding:14,marginBottom:16}}>
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
                    {[{l:"👷 Subcontractor",c:"Subcontractor Expense"},{l:"💼 Payroll",c:"Payroll & Wages"},{l:"🏠 Owner Draw",c:"Owner Draw"},{l:"📦 COGS Materials",c:"COGS - Materials"},{l:"🔄 Transfer Out",c:"Transfer Out"},{l:"🍽️ Meals",c:"Meals & Entertainment"}].map(o=>(
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
                    {[{l:"💰 Revenue Services",c:"Revenue - Services"},{l:"💰 Revenue Sales",c:"Revenue - Sales"},{l:"🏦 Owner Investment",c:"Owner Investment"},{l:"🔄 Transfer In",c:"Transfer In"},{l:"📤 Loan Proceeds",c:"Loan Proceeds"}].map(o=>(
                      <button key={o.c} className="ropt" onClick={()=>resolveAsk(o.c,true,zelleName)}>{o.l}</button>
                    ))}
                  </div>
                </div>
              )}
              {isATM&&(
                <div style={{marginBottom:16}}>
                  <span style={S.label}>ATM WITHDRAWAL</span>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                    {["Owner Draw","COGS - Materials","Meals & Entertainment","Payroll & Wages","Operating Expenses - Supplies"].map(c=>(
                      <button key={c} className="ropt" onClick={()=>resolveAsk(c,false,"")}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginBottom:14}}>
                <span style={S.label}>O ELIGE CATEGORÍA MANUAL:</span>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",maxHeight:150,overflowY:"auto",marginTop:8}}>
                  {cats.filter(c=>c!=="ASK TO CLIENT").map(c=>(
                    <button key={c} className="ropt" onClick={()=>resolveAsk(c,false,"")}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <button style={{...S.btn,...S.btnOutline,fontSize:11}} onClick={()=>{if(currentAsk+1<askQueue.length)setCurrentAsk(currentAsk+1);else setScreen("review");}}>Dejar como ASK TO CLIENT</button>
                <span style={{fontSize:11,color:"#bbb"}}>{askQueue.length-currentAsk-1} restantes</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REVIEW */}
      {screen==="review"&&(
        <div style={S.page}>
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
            {[
              {l:"Total",       v:transactions.length, c:"#1a1a1a"},
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
            <span style={{fontSize:11,color:"#999"}}>XFER = transfer auto · CHK = cheque → Subcontractor · Click en CATEGORY para editar</span>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button style={{...S.btn,...S.btnOutline,fontSize:11}} onClick={()=>downloadWave("DEPOSIT")}>⬇ Wave DEPOSITS</button>
              <button style={{...S.btn,...S.btnOutline,fontSize:11}} onClick={()=>downloadWave("WITHDRAWAL")}>⬇ Wave WITHDRAWALS</button>
              <button style={{...S.btn,...S.btnPrimary,fontSize:11}} onClick={downloadCSV}>⬇ CSV Completo</button>
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
              <div style={{background:"#92400e",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:1}}>
                📋 REPORTE DE CHEQUES — Subcontractors ({checks.length} cheques · Total: ${checks.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})})
              </div>
              <div style={{padding:0}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 110px",padding:"7px 14px",background:"#f7f6f2",borderBottom:"1px solid #e8e4dc"}}>
                  {["NOMBRE / PAYEE","# CHEQUES","TOTAL PAGADO"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:1}}>{h}</div>)}
                </div>
                <div style={{maxHeight:300,overflowY:"auto"}}>
                  {checkReportRows.map(([name, data])=>(
                    <div key={name} className="tr" style={{display:"grid",gridTemplateColumns:"1fr 80px 110px",padding:"9px 14px",borderBottom:"1px solid #f0ede8",alignItems:"center"}}>
                      <div style={{fontWeight:600,fontSize:13}}>{name}</div>
                      <div style={{fontSize:13,color:"#666",textAlign:"center"}}>{data.count}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#92400e",textAlign:"right"}}>${data.total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"8px 14px",background:"#fef3c7",display:"flex",justifyContent:"flex-end",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#92400e",fontWeight:600}}>Total en cheques:</span>
                  <span style={{fontSize:15,fontWeight:700,color:"#92400e"}}>${checks.reduce((s,r)=>s+Math.abs(parseFloat(r.amount)||0),0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {screen==="done"&&(
        <div style={{...S.page,textAlign:"center",paddingTop:60}}>
          <div style={{fontSize:52,marginBottom:14}}>✅</div>
          <h1 style={S.h1}>¡Statement completado!</h1>
          <p style={{color:"#888",marginTop:6,marginBottom:10,fontSize:13}}>{transactions.length} transacciones · 🔄 {transfers.length} transfers automáticos · 🧠 {Object.keys(clientData?.learnedMerchants||{}).length} en memoria</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:20}}>
            <button style={{...S.btn,...S.btnOutline}} onClick={()=>{setFile(null);setTransactions([]);setScreen("upload")}}>Otro PDF</button>
            <button style={{...S.btn,...S.btnPrimary}} onClick={()=>{setFile(null);setTransactions([]);setScreen("home")}}>Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableRows({rows,allRows,updateCategory,cats,levelColor}) {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"100px 88px 1fr 195px 55px",padding:"7px 14px",background:"#f7f6f2",borderBottom:"1px solid #e8e4dc"}}>
        {["DATE","AMOUNT","CONCEPT","CATEGORY","NIVEL"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:1}}>{h}</div>)}
      </div>
      <div style={{maxHeight:420,overflowY:"auto"}}>
        {rows.map((row,i)=>{
          const globalIdx=allRows.indexOf(row);
          const lci=levelColor(row.level);
          return (
            <div key={i} className="tr" style={{display:"grid",gridTemplateColumns:"100px 88px 1fr 195px 55px",padding:"7px 14px",borderBottom:"1px solid #f0ede8",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#888"}}>{row.date}</div>
              <div style={{fontSize:12,fontWeight:600,color:parseFloat(row.amount)>=0?"#166534":"#991b1b"}}>{parseFloat(row.amount)>=0?"+":""}{row.amount}</div>
              <div style={{fontSize:11,color:"#444",paddingRight:10,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={row.concept}>{row.concept}</div>
              <select value={row.category} onChange={e=>updateCategory(globalIdx,e.target.value)}
                style={{width:"100%",padding:"3px 5px",border:"1px solid #e8e4dc",borderRadius:5,fontSize:11,fontFamily:"inherit",background:row.category==="ASK TO CLIENT"?"#fee2e2":"#fff",cursor:"pointer"}}>
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
