/**
 * BIO·PULSE 台美日生技「金主爸爸轉投資 × 美日合作 MOU」互動關係圖引擎 (SVG Topology Graph)
 */
window.BioAllianceGraph = (function () {
  const NODES = {
    // Col 1: 上市櫃金主爸爸與生技母艦 (x = 20, w = 216)
    EXT_FOXCONN: { x: 20, y: 50,  w: 216, h: 60, col: 1, ext: true, market: "TW", name: "鴻海集團 (鴻準 2354)", role: "私募50.3億入股台康生技 ~18.56%" },
    "6472":      { x: 20, y: 122, w: 216, h: 60, col: 1, role: "CDMO 股王｜轉投資泰福-KY 30.5%" },
    "4746":      { x: 20, y: 194, w: 216, h: 60, col: 1, role: "ADC/API 母艦｜轉投資台新藥/台康" },
    "4123":      { x: 20, y: 266, w: 216, h: 64, col: 1, hub: true, role: "生技銀行｜順藥/博晟/益安/永昕" },
    "4105":      { x: 20, y: 342, w: 216, h: 60, col: 1, role: "特殊劑型母艦｜轉投資智擎/東生華" },
    "4128":      { x: 20, y: 414, w: 216, h: 60, col: 1, role: "中天集團｜轉投資鑽石 25.3%/合一 21.2%" },
    EXT_FIN:     { x: 20, y: 486, w: 216, h: 60, col: 1, ext: true, market: "TW", name: "富邦金 / 台新金 / 潤泰", role: "金控傳產金主｜鑽石投資 & 泰福-KY" },
    EXT_UNI:      { x: 20, y: 558, w: 216, h: 60, col: 1, ext: true, market: "TW", name: "統一企業 (1216)", role: "轉投資神隆 41.6% / 葡萄王 8.0%" },
    EXT_QUANTA:   { x: 20, y: 630, w: 216, h: 60, col: 1, ext: true, market: "TW", name: "廣達電腦 (2382)", role: "AI巨頭法人董事｜入股長佳智能 2.7%" },
    EXT_YUNGSHIN: { x: 20, y: 702, w: 216, h: 60, col: 1, ext: true, market: "TW", name: "永信 (3705) / 杉藥局 (7649.T)", role: "永鴻50.02% / 日本SUGI私募入股大樹" },
    EXT_QISDA:    { x: 20, y: 774, w: 216, h: 60, col: 1, ext: true, market: "TW", name: "佳世達 (2352) / 國發基金", role: "明基醫~55% / 中裕14% / 智擎15.5%" },
    "4120":       { x: 20, y: 846, w: 216, h: 60, col: 1, role: "上櫃金主｜仲恩8.63% / 安基大股東" },

    // Col 2: 台灣被轉投資生技標的 - CDMO / 新藥 / 創投 (x = 336, w = 228)
    "6589": { x: 336, y: 50,  w: 228, h: 60, col: 2, role: "鴻海18.6% + 台耀6.1%｜日本PMDA" },
    "6541": { x: 336, y: 122, w: 228, h: 60, col: 2, role: "保瑞30.5% + 潤泰24.5%｜美國FDA廠" },
    "6838": { x: 336, y: 194, w: 228, h: 60, col: 2, role: "台耀40.7%｜美Harrow / 日Activus" },
    "4726": { x: 336, y: 266, w: 228, h: 60, col: 2, role: "晟德20.5% + 日JCR 20.5%｜合資秋田" },
    "4162": { x: 336, y: 338, w: 228, h: 60, col: 2, role: "東洋18.0% + 國發15.5%｜日養樂多" },
    "4743": { x: 336, y: 410, w: 228, h: 60, col: 2, role: "中天21.2%｜美國FDA核准Bonvadis" },
    "6901": { x: 336, y: 482, w: 228, h: 60, col: 2, role: "中天25.3%/富邦29.6%/台新9.2%/潤泰" },
    "6535": { x: 336, y: 554, w: 228, h: 60, col: 2, role: "晟德35.5%｜美UNC CAR-T合作" },
    "4142": { x: 336, y: 626, w: 228, h: 60, col: 2, role: "國發11.3%｜美BD MOU / 日北里" },
    "6945": { x: 336, y: 698, w: 228, h: 58, col: 2, role: "上櫃｜潤泰力挺逾3成｜雙特異性抗體" },
    "6634": { x: 336, y: 766, w: 228, h: 58, col: 2, role: "興櫃｜鑽石投資9.39%｜MASH新藥" },
    "7729": { x: 336, y: 834, w: 228, h: 58, col: 2, role: "興櫃｜友華8.63%｜日本Kohjin MOU" },
    "4147": { x: 336, y: 902, w: 228, h: 56, col: 2, role: "上櫃｜國發14%+潤泰4.15%｜美FDA藥證" },
    "4174": { x: 336, y: 966, w: 228, h: 56, col: 2, role: "上櫃｜潤泰4.88%+｜ADC獲美FDA肯定" },

    // Col 3: 台灣醫材 / API / 直營新藥 / 興櫃黑馬 (x = 664, w = 228)
    "6446": { x: 664, y: 50,  w: 228, h: 56, col: 3, hub: true, role: "藥證直營雙冠｜美FDA + 日PMDA" },
    "1795": { x: 664, y: 116, w: 228, h: 56, col: 3, role: "Alvogen/PTT｜美併購 / 日PMDA" },
    "6712": { x: 664, y: 182, w: 228, h: 56, col: 3, role: "北美合資48.8%｜涵蓋美歐日專利" },
    "6499": { x: 664, y: 248, w: 228, h: 56, col: 3, role: "上櫃｜晟德24.1%｜日Terumo / 美FDA廠" },
    "6733": { x: 664, y: 314, w: 228, h: 56, col: 3, role: "上櫃｜晟德33.7%｜授權日本藤本製藥" },
    "1760": { x: 664, y: 380, w: 228, h: 56, col: 3, role: "班友18.4%｜日鳥居 / 美Akebia" },
    "6598": { x: 664, y: 446, w: 228, h: 56, col: 3, role: "美IDEXX / Henry Schein 90%美營收" },
    "1789": { x: 664, y: 512, w: 228, h: 56, col: 3, role: "統一41.6%｜設日本分公司 / 美FDA" },
    "1707": { x: 664, y: 578, w: 228, h: 56, col: 3, role: "統一8.0%｜7-ELEVEN通路 / 美原料獎" },
    "6841": { x: 664, y: 644, w: 228, h: 56, col: 3, role: "上櫃｜廣達2.7%｜AI獲美國FDA核准" },
    "6936": { x: 664, y: 710, w: 228, h: 56, col: 3, role: "永信50.02%｜日本寵物藥 / 美外銷" },
    "6572": { x: 664, y: 776, w: 228, h: 56, col: 3, role: "興櫃｜日Denka 34.8% + 美DPT 11.8%" },
    "6696": { x: 664, y: 842, w: 228, h: 56, col: 3, role: "興櫃｜美FDA優先審查 / 日Sakigake" },
    "4116": { x: 664, y: 906, w: 228, h: 56, col: 3, role: "上櫃｜佳世達~55%控股｜手術室醫材" },
    "6469": { x: 664, y: 970, w: 228, h: 56, col: 3, role: "上櫃｜日SUGI杉藥局2.2億私募結盟" },

    // Col 4: 美國 & 日本合作夥伴 / MOU / 指標 (x = 994, w = 266)
    "^NBI":         { x: 994, y: 50,  w: 266, h: 60, col: 4, role: "美國那斯達克生技總指標" },
    HROW:           { x: 994, y: 128, w: 266, h: 60, col: 4, role: "美眼科夥伴｜授權台新藥 APP13007" },
    EXT_US_PARTNER: { x: 994, y: 206, w: 266, h: 72, col: 4, ext: true, market: "US", name: "🇺🇸 美國合作 & MOU 夥伴", role: "BD(MOU) / Sanofi / Sandoz / IDEXX / UNC" },
    EXT_JP_STRAT:   { x: 994, y: 296, w: 266, h: 72, col: 4, ext: true, market: "JP", name: "🇯🇵 日本策略入股 & MOU", role: "JCR(20.5%) / Alfresa / CMIC / Kohjin MOU" },
    EXT_JP_LIC:     { x: 994, y: 386, w: 266, h: 72, col: 4, ext: true, market: "JP", name: "🇯🇵 日本藥廠授權商業化", role: "藤本製藥 / 鳥居 / 養樂多 / Maruho / 京瓷" },
    "4568.T":       { x: 994, y: 476, w: 266, h: 64, col: 4, role: "日本 ADC 霸主｜北里疫苗歷史合作" },
    "4502.T":       { x: 994, y: 558, w: 266, h: 64, col: 4, role: "日本最大藥廠｜美日雙樞紐指標" },
    "4519.T":       { x: 994, y: 640, w: 266, h: 60, col: 4, role: "羅氏控股60%｜日商轉投資典範" },
    "7754":         { x: 994, y: 716, w: 266, h: 58, col: 4, role: "興櫃｜友華+台杉｜美三期臨床AJ201" },
    "6876":         { x: 994, y: 786, w: 266, h: 58, col: 4, role: "興櫃｜美FDA IND(LXP103)推進" },
    "4129":         { x: 994, y: 856, w: 266, h: 58, col: 4, role: "上櫃｜日本京瓷雙品牌 + 美國直營總部" },
  };

  // type: 'invest' (上市櫃金主轉投資/持股%), 'jp' (日本合作/MOU), 'us' (美國合作/MOU)
  const EDGES = [
    // Col 1 -> Col 2/3 上市櫃金主轉投資
    { from: "EXT_FOXCONN", to: "6589", type: "invest", label: "泛鴻海（鴻準2354/永齡）私募入股約 18.56%" },
    { from: "4746",        to: "6589", type: "invest", label: "台耀化學轉投資台康生技約 6.06%" },
    { from: "4746",        to: "6838", type: "invest", label: "台耀化學主導創設台新藥，持股約 40.66%" },
    { from: "6472",        to: "6541", type: "invest", label: "保瑞集團透過保瑞生技換股持有泰福-KY 約 30.5%" },
    { from: "EXT_FIN",     to: "6541", type: "invest", label: "潤泰集團 (2915/9945) 持有泰福-KY 約 24%~25%" },
    { from: "EXT_FIN",     to: "6901", type: "invest", label: "富邦集團(29.58%) + 台新集團(9.21%) + 潤泰發起鑽石投資" },
    { from: "4128",        to: "6901", type: "invest", label: "中天生技轉投資鑽石投資約 25.26%" },
    { from: "4128",        to: "4743", type: "invest", label: "中天生技持股合一約 21.22%（最大法人股東）" },
    { from: "4105",        to: "4162", type: "invest", label: "台灣東洋創設並轉投資智擎約 18.0%" },
    { from: "4123",        to: "4726", type: "invest", label: "晟德轉投資永昕約 20.46%，與日本JCR並列核心股東" },
    { from: "4123",        to: "6535", type: "invest", label: "晟德集團轉投資順藥約 34.5%~36.5%" },
    { from: "4123",        to: "6499", type: "invest", label: "晟德轉投資益安約 24.13%" },
    { from: "4123",        to: "6733", type: "invest", label: "晟德轉投資博晟生醫約 33.68%" },
    { from: "EXT_UNI",      to: "1789", type: "invest", label: "統一企業 (1216) 直接37.94%、集團合計逾 41.5% 控股神隆", corridorY: 1072 },
    { from: "EXT_UNI",      to: "1707", type: "invest", label: "統一企業 (1216) 私募入股葡萄王 8.0%", corridorY: 1082 },
    { from: "EXT_QUANTA",   to: "6841", type: "invest", label: "廣達電腦 (2382) 轉投資長佳智能約 2.68% 任法人董事", corridorY: 1092 },
    { from: "EXT_FIN",      to: "6945", type: "invest", label: "潤泰集團 (2915/9945) 力挺圓祥生技，核心董事法人逾 30%" },
    { from: "EXT_FIN",      to: "4147", type: "invest", label: "潤泰全 (2915) 持有上櫃中裕約 4.15%+，並列國發基金核心股東" },
    { from: "EXT_FIN",      to: "4174", type: "invest", label: "潤泰全 (2915) 及集團法人持有上櫃浩鼎約 4.88%+" },
    { from: "EXT_QISDA",    to: "4147", type: "invest", label: "國發基金持股上櫃中裕約 14.0% 任法人董事" },
    { from: "EXT_QISDA",    to: "4116", type: "invest", label: "佳世達集團 (2352) 綜合持股上櫃明基醫約 55% 絕對控股", corridorY: 1102 },
    { from: "6901",         to: "6634", type: "invest", label: "鑽石投資 (6901) 轉投資欣耀 (6634) 約 9.39% 任法人董事" },
    { from: "EXT_YUNGSHIN", to: "6936", type: "invest", label: "永信投控 (3705) 持股永鴻生技 50.02% 絕對控股", corridorY: 1062 },
    { from: "EXT_YUNGSHIN", to: "6469", type: "invest", label: "日本杉藥局 (SUGI) 斥資 2.2 億私募策略入股大樹 (6469)", corridorY: 1110 },
    { from: "4120",         to: "7729", type: "invest", label: "上櫃友華生技 (4120) 轉投資仲恩生醫約 8.63% 任法人董事" },
    { from: "4120",         to: "7754", type: "invest", label: "上櫃友華生技 (4120) 攜手台杉水牛二號共同投資安基生技", corridorY: 1054 },

    // 日本合作 & MOU
    { from: "4726", to: "EXT_JP_STRAT", type: "jp", label: "日本 JCR 策略入股 20.48% + Alfresa 合資秋田廠 + Sartorius MOU" },
    { from: "4123", to: "EXT_JP_STRAT", type: "jp", label: "子公司建誼與日本 CMIC 簽署 ADC 合作 MOU", corridorY: 22 },
    { from: "6589", to: "EXT_JP_STRAT", type: "jp", label: "通過日本 PMDA GMP 查廠，承接日本上市產品多年期供貨", corridorY: 32 },
    { from: "4746", to: "EXT_JP_STRAT", type: "jp", label: "設立日本子公司 Formosa Labs Japan 推 ADC/API 業務", corridorY: 42 },
    { from: "1789", to: "EXT_JP_STRAT", type: "jp", label: "日本辦事處升格日本分公司，推阿茲海默/抗癌 API 與 CDMO" },
    { from: "6733", to: "EXT_JP_LIC",   type: "jp", label: "OIF 骨生長因子獨家授權日本藤本製藥 (雙位數銷售分潤)" },
    { from: "6499", to: "EXT_JP_LIC",   type: "jp", label: "與日本 Terumo 合作 Cross-Seal 止血醫材並達成 600萬美元和解" },
    { from: "4162", to: "EXT_JP_LIC",   type: "jp", label: "胰臟癌新藥安能得授權日本養樂多 (Yakult Honsha) 銷售收權利金" },
    { from: "1760", to: "EXT_JP_LIC",   type: "jp", label: "拿百磷授權日本 JT 集團鳥居製藥，穩定貢獻權利金" },
    { from: "6446", to: "EXT_JP_LIC",   type: "jp", label: "Ropeg 取得日本 PMDA PV 與 ET 全線適應症藥證直營" },
    { from: "1795", to: "EXT_JP_LIC",   type: "jp", label: "血癌藥 Pomalidomide 取得日本 PMDA 核准上市" },
    { from: "6838", to: "EXT_JP_LIC",   type: "jp", label: "併購日本船橋 Activus Pharma 取得 APNT 奈米平台" },
    { from: "4142", to: "4568.T",       type: "jp", label: "與日本北里第一三共具疫苗技術引進合作淵源", corridorY: 1044 },
    { from: "7729", to: "EXT_JP_STRAT", type: "jp", label: "興櫃仲恩生醫與日本 Kohjin Bio 簽署細胞培養基合作 MOU" },
    { from: "6572", to: "EXT_JP_STRAT", type: "jp", label: "興櫃博錸獲日商 Denka (4061.T) 入股 34.84% 共同開發試劑" },
    { from: "6696", to: "EXT_JP_LIC",   type: "jp", label: "興櫃仁新 LBS-008 獲日本先驅藥品認定 (Sakigake) 送件 NDA" },
    { from: "6936", to: "EXT_JP_LIC",   type: "jp", label: "永鴻生技推進日本寵物治療藥物 BE 試驗與日本取證" },
    { from: "4120", to: "EXT_JP_LIC",   type: "jp", label: "上櫃友華與日本 Maruho 合作經銷多汗症等專科用藥", corridorY: 1036 },
    { from: "6469", to: "EXT_JP_STRAT", type: "jp", label: "上櫃大樹與日本杉藥局 (SUGI) 簽亞太協議並私募結盟" },
    { from: "4129", to: "EXT_JP_LIC",   type: "jp", label: "上櫃聯合與日本京瓷 (KYOCERA) 採取人工關節雙品牌戰略合作" },

    // 美國合作 & MOU
    { from: "6838", to: "HROW",           type: "us", label: "APP13007 美國獨家商業化授權 NASDAQ 上市眼科夥伴 Harrow" },
    { from: "6472", to: "EXT_US_PARTNER", type: "us", label: "收購美國 USL 與 MacroGenics Rockville 廠簽長期 CDMO", corridorY: 14 },
    { from: "6541", to: "EXT_US_PARTNER", type: "us", label: "加州聖地牙哥美國 FDA cGMP 廠結合保瑞 USL 通路商化" },
    { from: "6589", to: "EXT_US_PARTNER", type: "us", label: "EG12014 授權 Sandoz 推進 FDA；攜手美國 GeneFab 供應 pDNA" },
    { from: "4142", to: "EXT_US_PARTNER", type: "us", label: "與美商 BD 簽訂國際 CDMO MOU；長期代工 Sanofi 美國 Flublok" },
    { from: "6446", to: "EXT_US_PARTNER", type: "us", label: "Ropeg 美國 FDA 核准直營放量並建置波多黎各美國廠" },
    { from: "1795", to: "EXT_US_PARTNER", type: "us", label: "併購美國 Alvogen US 並與 Alvotech 合作生物相似藥" },
    { from: "6712", to: "EXT_US_PARTNER", type: "us", label: "以 UMSC01 美歐日專利作價取得美國合資公司 JV 48.78% 股權" },
    { from: "6598", to: "EXT_US_PARTNER", type: "us", label: "BMB 條碼授權美國愛德士 IDEXX，簽約 Henry Schein 全美經銷" },
    { from: "6535", to: "EXT_US_PARTNER", type: "us", label: "引進美國北卡大學 (UNC) T 細胞技術開發 in vivo CAR-T" },
    { from: "4743", to: "EXT_US_PARTNER", type: "us", label: "Bonvadis 獲美國 FDA 上市許可，推進全美連鎖通路授權" },
    { from: "6841", to: "EXT_US_PARTNER", type: "us", label: "多項醫療 AI 獲美國 FDA 許可並與 Microsoft / AWS 雲端合作" },
    { from: "6696", to: "EXT_US_PARTNER", type: "us", label: "興櫃仁新持股美股 Belite Bio 42.37%，LBS-008 獲 FDA 優先審查" },
    { from: "6634", to: "EXT_US_PARTNER", type: "us", label: "興櫃欣耀 MASH 新藥 SNP-6 推進美國臨床與國際授權洽談" },
    { from: "4147", to: "EXT_US_PARTNER", type: "us", label: "上櫃中裕愛滋抗體 Trogarzo 獲 FDA 核准授權 Theratechnologies" },
    { from: "4174", to: "EXT_US_PARTNER", type: "us", label: "上櫃浩鼎 HYProtecan 獲美 FDA DMF 登記核可，OBI-992 美臨床中" },
    { from: "4129", to: "EXT_US_PARTNER", type: "us", label: "上櫃聯合於美國設立營運總部直攻北美高毛利人工關節市場" },
    { from: "6446", to: "^NBI",           type: "us", label: "台灣新藥國際市值指標對標那斯達克生技指數" },
  ];

  const PRESETS = {
    all:    { label: "全景金主與美日聯盟", filterFn: () => true },
    tpex:   {
      label: "📈 上櫃金主與美日聯隊",
      ids: new Set(["EXT_QISDA", "EXT_FIN", "4123", "4105", "4128", "EXT_QUANTA", "EXT_YUNGSHIN", "4120", "4726", "4162", "4743", "6535", "6945", "4147", "4174", "6499", "6733", "6841", "4116", "6469", "4129", "EXT_US_PARTNER", "EXT_JP_STRAT", "EXT_JP_LIC"]),
    },
    esb:    {
      label: "🌱 興櫃潛力新星",
      ids: new Set(["4120", "6901", "EXT_JP_STRAT", "EXT_JP_LIC", "EXT_US_PARTNER", "6634", "7729", "6572", "6696", "7754", "6876"]),
    },
    invest: { label: "🏦 上市櫃金主轉投資鏈", filterFn: (e) => e.type === "invest" },
    jp_mou: { label: "🇯🇵 日本合作・入股・MOU", filterFn: (e) => e.type === "jp" },
    us_fda: { label: "🇺🇸 美國授權・設廠・MOU", filterFn: (e) => e.type === "us" },
    cdmo:   {
      label: "🧬 CDMO 與 ADC 跨國戰隊",
      ids: new Set(["EXT_FOXCONN", "6472", "4746", "4123", "EXT_UNI", "6589", "6541", "4726", "6838", "4142", "1789", "EXT_US_PARTNER", "EXT_JP_STRAT", "HROW", "4568.T"]),
    },
  };

  const MKT_BADGE = {
    TW: { text: "TW", bg: "rgba(56,189,248,0.18)", fg: "#38bdf8" },
    US: { text: "US", bg: "rgba(167,139,250,0.18)", fg: "#c4b5fd" },
    JP: { text: "JP", bg: "rgba(244,114,182,0.18)", fg: "#f9a8d4" },
  };

  let activeFocusId = null;
  let activePreset = "all";

  function fmtPct(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const n = Number(v);
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  function fmtPrice(v, s) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const n = Number(v);
    if (s.currency === "JPY") return Math.round(n).toLocaleString("en-US");
    if (s.currency === "TWD") {
      return n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toFixed(n % 1 === 0 ? 1 : 2);
    }
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function buildPath(e) {
    const a = NODES[e.from];
    const b = NODES[e.to];
    if (!a || !b) return "";

    const ay = a.y + a.h / 2;
    const by = b.y + b.h / 2;

    if (e.corridorY !== undefined) {
      const goRight = a.col <= b.col;
      const x1 = goRight ? a.x + a.w : a.x;
      const x2 = goRight ? b.x : b.x + b.w;
      const stub1 = goRight ? x1 + 22 : x1 - 22;
      const stub2 = goRight ? x2 - 22 : x2 + 22;
      const r = 10;
      const cy = e.corridorY;
      const dirX1 = stub1 > x1 ? 1 : -1;
      const dirY1 = cy > ay ? 1 : -1;
      const dirX2 = x2 > stub2 ? 1 : -1;
      const dirY2 = by > cy ? 1 : -1;
      const dirSpan = stub2 > stub1 ? 1 : -1;

      return [
        `M ${x1} ${ay}`,
        `L ${stub1 - dirX1 * r} ${ay}`,
        `Q ${stub1} ${ay} ${stub1} ${ay + dirY1 * r}`,
        `L ${stub1} ${cy - dirY1 * r}`,
        `Q ${stub1} ${cy} ${stub1 + dirSpan * r} ${cy}`,
        `L ${stub2 - dirSpan * r} ${cy}`,
        `Q ${stub2} ${cy} ${stub2} ${cy + dirY2 * r}`,
        `L ${stub2} ${by - dirY2 * r}`,
        `Q ${stub2} ${by} ${stub2 + dirX2 * r} ${by}`,
        `L ${x2} ${by}`,
      ].join(" ");
    }

    let x1, x2;
    if (a.col < b.col) {
      x1 = a.x + a.w;
      x2 = b.x;
    } else if (a.col > b.col) {
      x1 = a.x;
      x2 = b.x + b.w;
    } else {
      const x = a.x + a.w / 2;
      const y1 = ay > by ? a.y : a.y + a.h;
      const y2 = ay > by ? b.y + b.h : b.y;
      return `M ${x} ${y1} L ${x} ${y2}`;
    }
    const dx = Math.abs(x2 - x1) * 0.45;
    const cx1 = a.col < b.col ? x1 + dx : x1 - dx;
    const cx2 = a.col < b.col ? x2 - dx : x2 + dx;
    return `M ${x1} ${ay} C ${cx1} ${ay}, ${cx2} ${by}, ${x2} ${by}`;
  }

  function render(containerEl, inspectorEl, stocksById, onSelectStock) {
    if (!containerEl) return;

    const preset = PRESETS[activePreset] || PRESETS.all;

    const isEdgeHighlighted = (e) => {
      if (activeFocusId) return e.from === activeFocusId || e.to === activeFocusId;
      if (preset.ids) return preset.ids.has(e.from) && preset.ids.has(e.to);
      return preset.filterFn ? preset.filterFn(e) : true;
    };

    const isNodeHighlighted = (id) => {
      if (activeFocusId) {
        if (id === activeFocusId) return true;
        return EDGES.some((e) => (e.from === activeFocusId && e.to === id) || (e.to === activeFocusId && e.from === id));
      }
      if (preset.ids) return preset.ids.has(id);
      if (activePreset === "all") return true;
      return EDGES.some((e) => isEdgeHighlighted(e) && (e.from === id || e.to === id));
    };

    const colHeaders = [
      { x: 128, title: "① 上市櫃金主爸爸與生技母艦" },
      { x: 450, title: "② 轉投資標的 (CDMO / 新藥 / 創投)" },
      { x: 778, title: "③ 專科製劑 / 醫材 / 醫療AI" },
      { x: 1127, title: "④ 美日合作・MOU・授權夥伴" },
    ];

    const edgeColors = {
      invest: "#fbbf24",
      us: "#38bdf8",
      jp: "#f472b6",
    };

    let svg = `
      <svg class="supply-svg" viewBox="0 0 1280 1125" role="img" aria-label="台美日生技金主轉投資與美日合作聯盟圖">
        <defs>
          <marker id="arrow-invest" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#fbbf24" />
          </marker>
          <marker id="arrow-us" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-jp" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#f472b6" />
          </marker>
        </defs>

        <rect x="10"  y="40" width="236" height="992" rx="14" fill="rgba(15,23,42,0.44)" stroke="rgba(251,191,36,0.18)" />
        <rect x="326" y="40" width="248" height="992" rx="14" fill="rgba(15,23,42,0.50)" stroke="rgba(56,189,248,0.20)" />
        <rect x="654" y="40" width="248" height="992" rx="14" fill="rgba(15,23,42,0.44)" stroke="rgba(56,189,248,0.16)" />
        <rect x="982" y="40" width="288" height="992" rx="14" fill="rgba(15,23,42,0.44)" stroke="rgba(244,114,182,0.20)" />
    `;

    colHeaders.forEach((h) => {
      svg += `<text x="${h.x}" y="1024" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="700" font-family="Inter, Noto Sans TC, sans-serif">${h.title}</text>`;
    });

    const orderedEdges = [
      ...EDGES.filter((e) => !isEdgeHighlighted(e)),
      ...EDGES.filter((e) => isEdgeHighlighted(e)),
    ];

    orderedEdges.forEach((e) => {
      const hi = isEdgeHighlighted(e);
      const color = edgeColors[e.type] || "#38bdf8";
      const dash = e.type === "jp" ? 'stroke-dasharray="6,3"' : e.type === "us" ? 'stroke-dasharray="8,3"' : "";
      const opacity = hi ? (activeFocusId ? 0.95 : 0.62) : 0.07;
      const width = hi && activeFocusId ? 2.4 : 1.5;
      const markerEnd = `marker-end="url(#arrow-${e.type})"`;
      const pathD = buildPath(e);
      svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" ${dash} ${hi ? markerEnd : ""} />`;
    });

    Object.entries(NODES).forEach(([id, pos]) => {
      const s = pos.ext ? null : stocksById.get(id);
      if (!pos.ext && !s) return;

      const hi = isNodeHighlighted(id);
      const isFocused = activeFocusId === id;

      let pct = null;
      let isUp = false;
      let isDown = false;
      let pctColor = "#94a3b8";
      let displayName = pos.name || id;
      let displayCode = pos.ext ? "聯盟節點" : id;
      let priceTxt = pos.ext ? "上市櫃/國際集團" : "";
      let pctTxt = pos.ext ? "點看明細" : "—";
      const mkt = pos.ext ? pos.market : s.market;

      if (s) {
        pct = s.latest.change_pct;
        isUp = pct > 0;
        isDown = pct < 0;
        pctColor = isUp ? "#ff4d5a" : isDown ? "#00d084" : "#94a3b8";
        displayName = s.name.split(" ")[0];
        priceTxt = `${fmtPrice(s.latest.close, s)} ${s.currency === "TWD" ? "" : s.currency}`.trim();
        pctTxt = fmtPct(pct);
      }

      const borderStroke = isFocused
        ? "#ffffff"
        : pos.ext
        ? (mkt === "JP" ? "rgba(244,114,182,0.55)" : mkt === "US" ? "rgba(56,189,248,0.55)" : "rgba(251,191,36,0.55)")
        : pos.hub
        ? "#38bdf8"
        : isUp
        ? "rgba(255,77,90,0.55)"
        : isDown
        ? "rgba(0,208,132,0.55)"
        : "rgba(56,189,248,0.3)";

      const fillBg = isFocused
        ? "rgba(30, 58, 138, 0.94)"
        : pos.ext
        ? "rgba(18, 24, 44, 0.94)"
        : pos.hub
        ? "rgba(12, 34, 64, 0.96)"
        : "rgba(11, 18, 34, 0.94)";

      const mb = MKT_BADGE[mkt] || MKT_BADGE.TW;

      svg += `
        <g class="sg-node" data-node-id="${id}" style="cursor:pointer;opacity:${hi ? 1 : 0.16};transition:opacity 0.2s">
          <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="${pos.hub ? 13 : 10}"
                fill="${fillBg}" stroke="${borderStroke}" stroke-width="${isFocused ? 2.5 : pos.hub ? 2 : 1.3}" />
          <rect x="${pos.x + pos.w - 32}" y="${pos.y + 7}" width="24" height="15" rx="4" fill="${mb.bg}" />
          <text x="${pos.x + pos.w - 20}" y="${pos.y + 17.5}" text-anchor="middle" fill="${mb.fg}" font-size="9" font-weight="800" font-family="JetBrains Mono, Consolas, monospace">${mb.text}</text>
          <text x="${pos.x + 10}" y="${pos.y + 19}" fill="#f8fafc" font-size="12" font-weight="800" font-family="Inter, Noto Sans TC, sans-serif">
            ${displayName} <tspan fill="${pos.ext ? "#fbbf24" : "#38bdf8"}" font-size="10" font-family="JetBrains Mono, Consolas, monospace">${displayCode}</tspan>
          </text>
          <text x="${pos.x + 10}" y="${pos.y + 34}" fill="#94a3b8" font-size="9.5" font-family="Inter, Noto Sans TC, sans-serif">
            ${pos.role}
          </text>
          <text x="${pos.x + 10}" y="${pos.y + pos.h - 8}" fill="#cbd5e1" font-size="10.5" font-weight="700" font-family="JetBrains Mono, Consolas, monospace">
            ${priceTxt}
          </text>
          <text x="${pos.x + pos.w - 10}" y="${pos.y + pos.h - 8}" text-anchor="end" fill="${pctColor}" font-size="10.5" font-weight="800" font-family="JetBrains Mono, Consolas, monospace">
            ${pctTxt}
          </text>
        </g>
      `;
    });

    svg += `</svg>`;

    const presetButtons = Object.entries(PRESETS)
      .map(
        ([k, v]) =>
          `<button class="seg-pill ${!activeFocusId && activePreset === k ? "active" : ""}" data-sg-preset="${k}">${v.label}</button>`
      )
      .join("");

    containerEl.innerHTML = `
      <div class="sg-toolbar">
        <div class="sg-presets">${presetButtons}
          ${activeFocusId ? `<button class="seg-pill" id="sgClearFocusBtn" style="border-color:var(--amber);color:var(--amber)">✕ 清除鎖定 (${NODES[activeFocusId]?.name || activeFocusId})</button>` : ""}
        </div>
        <div class="sg-legend">
          <span><strong class="mono" style="color:#38bdf8">[TW]</strong> 台灣</span>
          <span><strong class="mono" style="color:#c4b5fd">[US]</strong> 美國</span>
          <span><strong class="mono" style="color:#f9a8d4">[JP]</strong> 日本</span>
          <span><i class="lg-line" style="background:#fbbf24"></i> 上市櫃轉投資(%)</span>
          <span><i class="lg-line lg-dash" style="border-color:#38bdf8"></i> 美國合作 / MOU</span>
          <span><i class="lg-line lg-dash" style="border-color:#f472b6"></i> 日本合作 / MOU</span>
        </div>
      </div>
      <div class="sg-canvas-scroll">${svg}</div>
    `;

    containerEl.querySelectorAll("[data-sg-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFocusId = null;
        activePreset = btn.dataset.sgPreset;
        render(containerEl, inspectorEl, stocksById, onSelectStock);
      });
    });

    const clrBtn = containerEl.querySelector("#sgClearFocusBtn");
    if (clrBtn) {
      clrBtn.addEventListener("click", () => {
        activeFocusId = null;
        render(containerEl, inspectorEl, stocksById, onSelectStock);
      });
    }

    containerEl.querySelectorAll(".sg-node").forEach((g) => {
      g.addEventListener("click", () => {
        const nid = g.dataset.nodeId;
        activeFocusId = activeFocusId === nid ? null : nid;
        render(containerEl, inspectorEl, stocksById, onSelectStock);
      });
      g.addEventListener("dblclick", () => {
        const nid = g.dataset.nodeId;
        if (stocksById.has(nid)) onSelectStock(nid);
      });
    });

    if (inspectorEl) {
      if (!activeFocusId) {
        inspectorEl.innerHTML = `
          <span style="color:var(--text-muted)">💡 <strong>金主轉投資與美日聯盟互動圖：</strong>點擊上方「<strong>🏦 上市櫃金主轉投資鏈</strong>」、「<strong>🇯🇵 日本合作・入股・MOU</strong>」或任一公司節點（如 <strong class="mono" style="color:#fbbf24">4123 晟德</strong>、<strong class="mono" style="color:#38bdf8">6589 台康生技</strong>、<strong class="mono" style="color:#38bdf8">4726 永昕</strong>）即可鎖定查看持股比例與美日合作明細；雙擊生技股節點可跳轉 K 線。</span>
        `;
      } else {
        const pos = NODES[activeFocusId];
        const s = pos.ext ? null : stocksById.get(activeFocusId);
        const rels = EDGES.filter((e) => e.from === activeFocusId || e.to === activeFocusId);
        const itemsHtml = rels
          .map((e) => {
            const partnerId = e.from === activeFocusId ? e.to : e.from;
            const pNode = NODES[partnerId];
            const partnerStock = pNode && !pNode.ext ? stocksById.get(partnerId) : null;
            const arrow = e.from === activeFocusId ? "→" : "←";
            const partnerName = partnerStock
              ? `${partnerStock.name.split(" ")[0]} (${partnerId})`
              : (pNode ? pNode.name : partnerId);
            const tagColor = e.type === "invest" ? "#fbbf24" : e.type === "jp" ? "#f472b6" : "#38bdf8";
            return `<div class="sg-rel-item"><span class="mono" style="color:${tagColor};font-weight:700">${arrow} ${partnerName}</span>：${e.label}</div>`;
          })
          .join("");

        const titleTxt = s ? `${s.name} (${s.id})` : pos.name;
        const jumpBtnHtml = s
          ? `<button class="btn btn-primary" id="sgJumpStockBtn" style="padding:5px 12px;font-size:0.78rem">查看 ${s.id} K 線與金主明細 →</button>`
          : "";

        inspectorEl.innerHTML = `
          <div class="sg-inspector-head">
            <div>
              <strong style="font-size:0.95rem">${titleTxt}</strong>
              <span style="color:var(--text-muted);font-size:0.8rem;margin-left:8px">${pos.role}</span>
            </div>
            ${jumpBtnHtml}
          </div>
          <div class="sg-rel-grid">${itemsHtml}</div>
        `;
        const jumpBtn = inspectorEl.querySelector("#sgJumpStockBtn");
        if (jumpBtn) jumpBtn.addEventListener("click", () => onSelectStock(activeFocusId));
      }
    }
  }

  return { render };
})();
