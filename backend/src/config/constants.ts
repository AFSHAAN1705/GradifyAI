export const KCET_YEAR = 2025;

export const KCET_CATEGORIES = [
  { code: "GM", name: "General Merit", group: "General", tags: ["All Karnataka"] },
  { code: "GMK", name: "General Merit Kannada Medium", group: "Kannada Medium", tags: ["Kannada Medium"] },
  { code: "GMR", name: "General Merit Rural", group: "Rural", tags: ["Rural"] },
  { code: "GMP", name: "General Merit Private", group: "Private", tags: ["Private quota"] },
  { code: "GMH", name: "General Merit Hyderabad Karnataka", group: "Hyderabad Karnataka", tags: ["HK"] },
  { code: "1G", name: "Category 1 General", group: "Category 1", tags: ["KEA reservation"] },
  { code: "1K", name: "Category 1 Kannada Medium", group: "Category 1", tags: ["Kannada Medium"] },
  { code: "1R", name: "Category 1 Rural", group: "Category 1", tags: ["Rural"] },
  { code: "1H", name: "Category 1 Hyderabad Karnataka", group: "Category 1", tags: ["HK"] },
  { code: "2AG", name: "2A General", group: "Category 2A", tags: ["KEA reservation"] },
  { code: "2AK", name: "2A Kannada Medium", group: "Category 2A", tags: ["Kannada Medium"] },
  { code: "2AR", name: "2A Rural", group: "Category 2A", tags: ["Rural"] },
  { code: "2AH", name: "2A Hyderabad Karnataka", group: "Category 2A", tags: ["HK"] },
  { code: "2BG", name: "2B General", group: "Category 2B", tags: ["KEA reservation"] },
  { code: "2BK", name: "2B Kannada Medium", group: "Category 2B", tags: ["Kannada Medium"] },
  { code: "2BR", name: "2B Rural", group: "Category 2B", tags: ["Rural"] },
  { code: "2BH", name: "2B Hyderabad Karnataka", group: "Category 2B", tags: ["HK"] },
  { code: "3AG", name: "3A General", group: "Category 3A", tags: ["KEA reservation"] },
  { code: "3AK", name: "3A Kannada Medium", group: "Category 3A", tags: ["Kannada Medium"] },
  { code: "3AR", name: "3A Rural", group: "Category 3A", tags: ["Rural"] },
  { code: "3AH", name: "3A Hyderabad Karnataka", group: "Category 3A", tags: ["HK"] },
  { code: "3BG", name: "3B General", group: "Category 3B", tags: ["KEA reservation"] },
  { code: "3BK", name: "3B Kannada Medium", group: "Category 3B", tags: ["Kannada Medium"] },
  { code: "3BR", name: "3B Rural", group: "Category 3B", tags: ["Rural"] },
  { code: "3BH", name: "3B Hyderabad Karnataka", group: "Category 3B", tags: ["HK"] },
  { code: "SCG", name: "SC General", group: "SC", tags: ["KEA reservation"] },
  { code: "SCK", name: "SC Kannada Medium", group: "SC", tags: ["Kannada Medium"] },
  { code: "SCR", name: "SC Rural", group: "SC", tags: ["Rural"] },
  { code: "SCH", name: "SC Hyderabad Karnataka", group: "SC", tags: ["HK"] },
  { code: "STG", name: "ST General", group: "ST", tags: ["KEA reservation"] },
  { code: "STK", name: "ST Kannada Medium", group: "ST", tags: ["Kannada Medium"] },
  { code: "STR", name: "ST Rural", group: "ST", tags: ["Rural"] },
  { code: "STH", name: "ST Hyderabad Karnataka", group: "ST", tags: ["HK"] }
] as const;

export const CATEGORY_SEED = KCET_CATEGORIES.map((category) => [category.code, category.name] as const);

export const KCET_BRANCH_ALIASES: Record<string, string> = {
  "ARTIFICIALINTELLIGENCE ANDDATA SCIENCE": "AI&DS",
  "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE": "AI&DS",
  "AI AND DATA SCIENCE": "AI&DS",
  "AI & DS": "AI&DS",
  "AI&DS": "AI&DS",
  "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AIML",
  "ARTIFICIALINTELLIGENCE ANDMACHINELEARNING": "AIML",
  "AI AND ML": "AIML",
  "AI & ML": "AIML",
  "AIML": "AIML",
  "COMPUTERSCIENCE ANDENGINEERING": "CSE",
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "COMPUTER SCIENCE & ENGINEERING": "CSE",
  "COMPUTER SCIENCE": "CSE",
  "CS": "CSE",
  "COMPUTER SCIENCE AND BUSINESS SYSTEMS": "CSBS",
  "COMPUTERSCIENCE ANDBUSINESSSYSTEMS": "CSBS",
  "CSBS": "CSBS",
  "INFORMATIONSCIENCE ANDENGINEERING": "ISE",
  "INFORMATION SCIENCE AND ENGINEERING": "ISE",
  "INFORMATION SCIENCE": "ISE",
  "INFORMATION TECHNOLOGY": "IT",
  "INFORMATIONTECHNOLOGY": "IT",
  "ELECTRONICS ANDCOMMUNICATIONENGG": "ECE",
  "ELECTRONICS AND COMMUNICATION ENGG": "ECE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRONICS & COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL &ELECTRONICSENGINEERING": "EEE",
  "ELECTRICAL & ELECTRONICS ENGINEERING": "EEE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "CIVILENGINEERING": "CIV",
  "CIVIL ENGINEERING": "CIV",
  "CIVIL": "CIV",
  "MECHANICALENGINEERING": "ME",
  "MECHANICAL ENGINEERING": "ME",
  "MECHANICAL": "ME",
  "AEROSPACEENGINEERING": "AERO",
  "AERONAUTICAL ENGINEERING": "AERO",
  "BIOTECHNOLOGY": "BT",
  "CHEMICALENGINEERING": "CHE",
  "CHEMICAL ENGINEERING": "CHE",
  "ELECTRONICS ANDINSTRUMENTATIONENGG": "EIE",
  "ELECTRONICS AND INSTRUMENTATION ENGG": "EIE",
  "ROBOTICS ANDARTIFICIALINTELLIGENCE": "RAI",
  "ROBOTICS AND ARTIFICIAL INTELLIGENCE": "RAI",
  "ROBOTICS": "RAI",
  "DATA SCIENCE": "DS",
  "DATASCIENCE": "DS",
  "COMPUTER SCIENCE AND ENGINEERING (AI & ML)": "CSM",
  "CSE (AI & ML)": "CSM",
  "CSE (AI AND ML)": "CSM",
  "CSE (AI&ML)": "CSM",
  "COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)": "CSD",
  "CSE (DATA SCIENCE)": "CSD",
  "CSE (DS)": "CSD",
  "INTERNET OF THINGS": "IOT",
  "IOT": "IOT",
  "IOT AND CYBER SECURITY": "IOT",
  "CYBER SECURITY": "CS",
  "CYBERSECURITY": "CS",
  "CYBER SECURITY SYSTEMS": "CS",
  "ELECTRONICS AND TELECOMMUNICATION": "TC",
  "ELECTRONICS AND TELECOMMUNICATION ENGINEERING": "TC",
  "TELECOMMUNICATION ENGINEERING": "TC",
  "TELECOMMUNICATION": "TC",
  "INSTRUMENTATION TECHNOLOGY": "IN",
  "INSTRUMENTATION": "IN",
  "INDUSTRIAL ENGINEERING AND MANAGEMENT": "IE",
  "INDUSTRIAL ENGINEERING": "IE",
  "AUTOMOBILE ENGINEERING": "AU",
  "MEDICAL ELECTRONICS": "ML",
  "BIOMEDICAL ENGINEERING": "BM",
  "FOOD TECHNOLOGY": "FT",
  "ENVIRONMENTAL ENGINEERING": "EV",
  "METALLURGICAL ENGINEERING": "MT",
  "MINING ENGINEERING": "MN",
  "PETROLEUM ENGINEERING": "PT",
  "TEXTILE TECHNOLOGY": "TX",
  "ARCHITECTURE": "AR",
  "COMPUTER SCIENCE AND ENGINEERING (IOT AND CYBERSECURITY)": "CSM",
  "CSE (IOT AND CYBERSECURITY)": "CSM",
  "COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY)": "CSM",
  "CSE (CYBER SECURITY)": "CSM",
  "COMPUTER SCIENCE AND ENGINEERING (IOT)": "IOT",
  "CSE (IOT)": "IOT",
  "ARTIFICIAL INTELLIGENCE": "AI",
  "ARTIFICIALINTELLIGENCE": "AI",
  "AI": "AI",
  "ELECTRICAL ENGINEERING": "EEE",
  "ELECTRICAL": "EEE",
  "POLYMER SCIENCE": "PM",
  "POLYMER ENGINEERING": "PM",
  "POLYMER": "PM",
  "AI & DATA SCIENCE": "AI&DS",
  "AIDS": "AI&DS",
  "COMPUTER SCIENCE AND ENGINEERING (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)": "CSM",
  "CSE (AIML)": "CSM",
  "CSE AIML": "CSM",
  "CSE DATA SCIENCE": "CSD",
  "COMPUTER SCIENCE & BUSINESS SYSTEMS": "CSBS",
  "MASTER OF COMPUTER APPLICATIONS": "MCA",
  "MCA": "MCA",
  "M.C.A": "MCA",
  "INTEGRATED MCA": "MCA",
  "BIO TECHNOLOGY": "BT",
  "BIOTECH": "BT",
  "AEROSPACE": "AERO",
  "AERONAUTICAL": "AERO",
  "AUTOMOBILE": "AU",
  "AUTO": "AU",
  "INDUSTRIAL": "IE"
};

export const CITY_DISTRICT_MAP: Record<string, string> = {
  // Bangalore Urban
  "BANGALORE": "Bangalore Urban",
  "BANGALORE URBAN": "Bangalore Urban",
  "BANGALORE URBAN DISTRICT": "Bangalore Urban",
  "BENGALURU": "Bangalore Urban",
  "BENGALURU URBAN": "Bangalore Urban",
  "BENGALURU SOUTH": "Bangalore Urban",
  "BENGALURU NORTH": "Bangalore Urban",
  "BENGALURU EAST": "Bangalore Urban",
  "WHITEFIELD": "Bangalore Urban",
  "YESHWANTPUR": "Bangalore Urban",
  "PEENYA": "Bangalore Urban",
  "HEBBAL": "Bangalore Urban",
  "KENGERI": "Bangalore Urban",
  "BANGALORE (SOUTH)": "Bangalore Urban",
  "BANGALORE (EAST)": "Bangalore Urban",
  "BANGALORE (WEST)": "Bangalore Urban",
  "BANGALORE (NORTH)": "Bangalore Urban",
  "BANGALORE 560037": "Bangalore Urban",
  "BANGALORE 560049": "Bangalore Urban",
  "BANGALORE-01": "Bangalore Urban",
  "BANGALORE 01": "Bangalore Urban",
  "BANGALORE-560056": "Bangalore Urban",
  "BANGALORE 560056": "Bangalore Urban",
  "BANGALORE-560054": "Bangalore Urban",
  "BANGALORE 560054": "Bangalore Urban",
  "BANGALORE-560078": "Bangalore Urban",
  "BANGALORE 560078": "Bangalore Urban",
  "BANGALORE-560004": "Bangalore Urban",
  "BANGALORE 560004": "Bangalore Urban",
  "BANGALORE-560085": "Bangalore Urban",
  "BANGALORE 560085": "Bangalore Urban",
  
  // Bangalore Rural
  "BANGALORE RURAL": "Bangalore Rural",
  "BENGALURU RURAL": "Bangalore Rural",
  "DODDABALLAPUR": "Bangalore Rural",
  "DEVANAHALLI": "Bangalore Rural",
  "NELAMANGALA": "Bangalore Rural",
  
  // Mysore
  "MYSORE": "Mysore",
  "MYSURU": "Mysore",
  "MYSORE DISTRICT": "Mysore",
  "SRIRANGAPATNA": "Mysore",
  "NANJANGUD": "Mysore",
  "HUNSUR": "Mysore",
  "K.R. NAGAR": "Mysore",
  "KR NAGAR": "Mysore",
  
  // Dakshina Kannada
  "MANGALORE": "Dakshina Kannada",
  "MANGALURU": "Dakshina Kannada",
  "MANGALORE 575001": "Dakshina Kannada",
  "DAKSHINA KANNADA": "Dakshina Kannada",
  "MANGALORE DISTRICT": "Dakshina Kannada",
  "NITTE": "Dakshina Kannada",
  "KULSHEKAR": "Dakshina Kannada",
  "KODIYAL": "Dakshina Kannada",
  "DERALAKATTE": "Dakshina Kannada",
  "BANTWAL": "Dakshina Kannada",
  "PUTTUR": "Dakshina Kannada",
  "BELTHANGADY": "Dakshina Kannada",
  
  // Udupi
  "UDUPI": "Udupi",
  "MANIPAL": "Udupi",
  "UDUPI DISTRICT": "Udupi",
  "UDUPI 576101": "Udupi",
  "KARKALA": "Udupi",
  "KUNDAPURA": "Udupi",
  
  // Belagavi (not Belgaum)
  "BELGAUM": "Belagavi",
  "BELAGAVI": "Belagavi",
  "BELGAUM DISTRICT": "Belagavi",
  "NIPANI": "Belagavi",
  "ATHANI": "Belagavi",
  "CHIKODI": "Belagavi",
  "RAIBAG": "Belagavi",
  "GOKAK": "Belagavi",
  "BAILHONGAL": "Belagavi",
  "SAUNDATTI": "Belagavi",
  "RAMDURG": "Belagavi",
  "KHANAPUR": "Belagavi",
  "HUKKERI": "Belagavi",
  
  // Dharwad
  "DHARWAD": "Dharwad",
  "HUBLI": "Dharwad",
  "HUBBALLI": "Dharwad",
  "HUBLI-DHARWAD": "Dharwad",
  "HUBBALLI-DHARWAD": "Dharwad",
  "DHARWAD DISTRICT": "Dharwad",
  "KALAGHATAGI": "Dharwad",
  "KALGHATGI": "Dharwad",
  
  // Shivamogga (not Shimoga)
  "SHIMOGA": "Shivamogga",
  "SHIVAMOGGA": "Shivamogga",
  "SHIMOGA DISTRICT": "Shivamogga",
  "BHADRAVATHI": "Shivamogga",
  "BHADRAVATI": "Shivamogga",
  "HOSANAGAR": "Shivamogga",
  "SAGAR": "Shivamogga",
  "SORAB": "Shivamogga",
  "THIRTHAHALLI": "Shivamogga",
  
  // Hassan
  "HASSAN": "Hassan",
  "HASSAN DISTRICT": "Hassan",
  
  // Tumakuru
  "TUMKUR": "Tumakuru",
  "TUMAKURU": "Tumakuru",
  "TUMKUR DISTRICT": "Tumakuru",
  "TUMAKURU DISTRICT": "Tumakuru",
  "TIPTUR": "Tumakuru",
  "GUBBI": "Tumakuru",
  
  // Ballari (not Bellary)
  "BELLARY": "Ballari",
  "BALLARI": "Ballari",
  "BELLARY DISTRICT": "Ballari",
  
  // Vijayanagara
  "VIJAYANAGARA": "Vijayanagara",
  "HOSAPETE": "Vijayanagara",
  "HOSPET": "Vijayanagara",
  
  // Kalaburagi (not Gulbarga)
  "GULBARGA": "Kalaburagi",
  "KALABURAGI": "Kalaburagi",
  "GULBARGA DISTRICT": "Kalaburagi",
  "SEDAM": "Kalaburagi",
  
  // Bidar
  "BIDAR": "Bidar",
  "BIDAR DISTRICT": "Bidar",
  
  // Raichur
  "RAICHUR": "Raichur",
  "RAICHUR DISTRICT": "Raichur",
  
  // Mandya
  "MANDYA": "Mandya",
  "MANDYA DISTRICT": "Mandya",
  
  // Chikkamagaluru
  "CHIKKAMAGALURU": "Chikkamagaluru",
  "CHIKKAMAGALUR": "Chikkamagaluru",
  "CHICKMAGALUR": "Chikkamagaluru",
  "CHIKAMAGALUR": "Chikkamagaluru",
  
  // Kodagu
  "KODAGU": "Kodagu",
  "MADIKERI": "Kodagu",
  "COORG": "Kodagu",
  
  // Davanagere
  "DAVANAGERE": "Davanagere",
  "DAVANGERE": "Davanagere",
  "HARIHARA": "Davanagere",
  
  // Kolar
  "KOLAR": "Kolar",
  "KOLAR DISTRICT": "Kolar",
  "KOLAR ADDITIONAL": "Kolar",
  
  // Ramanagara
  "RAMANAGARA": "Ramanagara",
  "RAMANAGARAM": "Ramanagara",
  
  // Chamarajanagar
  "CHAMARAJANAGAR": "Chamarajanagar",
  "CHAMARAJA NAGAR": "Chamarajanagar",
  
  // Vijayapura
  "VIJAYAPURA": "Vijayapura",
  "BIJAPUR": "Vijayapura",
  "VIJAYAPURA DISTRICT": "Vijayapura",
  
  // Gadag
  "GADAG": "Gadag",
  "GADAG DISTRICT": "Gadag",
  
  // Haveri
  "HAVERI": "Haveri",
  "HAVERI DISTRICT": "Haveri",
  "RANEBENNUR": "Haveri",
  
  // Uttara Kannada
  "UTTARA KANNADA": "Uttara Kannada",
  "KARWAR": "Uttara Kannada",
  "SIRSI": "Uttara Kannada",
  "UTTARA KANNADA DISTRICT": "Uttara Kannada",
  "KUMTA": "Uttara Kannada",
  "ANGOLLE": "Uttara Kannada",
  "ANKOLA": "Uttara Kannada",
  "HALIYALA": "Uttara Kannada",
  "JODUPALYA": "Uttara Kannada",
  
  // Yadgir
  "YADGIR": "Yadgir",
  "YADGIR DISTRICT": "Yadgir",
  
  // Koppal
  "KOPPAL": "Koppal",
  "KOPPAL DISTRICT": "Koppal",
  
  // Chitradurga
  "CHITRADURGA": "Chitradurga",
  "CHITRADURGA DISTRICT": "Chitradurga",
  
  // Bagalkot
  "BAGALKOT": "Bagalkot",
  "BAGALKOTE": "Bagalkot",
  "BAGALKOT DISTRICT": "Bagalkot",
  
  // Chikkaballapur
  "CHIKKABALLAPUR": "Chikkaballapur",
  "CHIKBALLAPUR": "Chikkaballapur",
  "CHIKBALPUR": "Chikkaballapur"
};

export const ALL_DISTRICTS = [
  "Bagalkot",
  "Ballari",
  "Bangalore Rural",
  "Bangalore Urban",
  "Belagavi",
  "Bidar",
  "Chamarajanagar",
  "Chikkaballapur",
  "Chikkamagaluru",
  "Chitradurga",
  "Dakshina Kannada",
  "Davanagere",
  "Dharwad",
  "Gadag",
  "Hassan",
  "Haveri",
  "Kalaburagi",
  "Kodagu",
  "Kolar",
  "Koppal",
  "Mandya",
  "Mysore",
  "Raichur",
  "Ramanagara",
  "Shivamogga",
  "Tumakuru",
  "Udupi",
  "Uttara Kannada",
  "Vijayanagara",
  "Vijayapura",
  "Yadgir",
];

export const KCET_ROUNDS = [
  { round: 1, label: "Round 1", strategy: "Baseline allotment and first serious cutoff signal." },
  { round: 2, label: "Round 2", strategy: "Upgrade-heavy round where vacancies shift after choices are edited." },
  { round: 3, label: "Extended Round", strategy: "High-variance final opportunity round with branch and category movement." }
] as const;
