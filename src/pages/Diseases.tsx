import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BookOpen,
  Search,
  AlertCircle,
  ShieldCheck,
  FlaskConical,
  Sprout,
  Activity,
  X,
  CloudRain
} from "lucide-react";

interface DiseaseDetail {
  id: string;
  nameEn: string;
  nameKn: string;
  pathogen: string;
  severity: "Healthy" | "High" | "Critical" | "Moderate";
  badgeClass: string;
  symptomsEn: string[];
  symptomsKn: string[];
  causesEn: string[];
  causesKn: string[];
  weatherEn: string;
  weatherKn: string;
  spectralEn: string;
  spectralKn: string;
  organicEn: string[];
  organicKn: string[];
  chemicalEn: string[];
  chemicalKn: string[];
  preventionEn: string[];
  preventionKn: string[];
  image: string;
}

const DISEASES_DATA: DiseaseDetail[] = [
  {
    id: "healthy",
    nameEn: "Healthy Arecanut Palm",
    nameKn: "ಆರೋಗ್ಯಕರ ಅಡಿಕೆ ಮರ",
    pathogen: "None (Optimal Physiological State)",
    severity: "Healthy",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    symptomsEn: [
      "Vibrant dark green fronds with uniform chlorophyll distribution",
      "Robust trunk free of exudates, gummy discharge, or vascular fissures",
      "Abundant flowering and compact nut clusters without premature shedding"
    ],
    symptomsKn: [
      "ದಟ್ಟ ಹಸಿರು ಬಣ್ಣದ ಗರಿಗಳು ಹಾಗೂ ಆರೋಗ್ಯಕರ ನೈಸರ್ಗಿಕ ಬೆಳವಣಿಗೆ",
      "ಕಾಂಡದಲ್ಲಿ ಯಾವುದೇ ಬಿರುಕು ಅಥವಾ ಅಂಟು ಸೋರುವಿಕೆ ಇರುವುದಿಲ್ಲ",
      "ಉತ್ತಮ ಹಿಂಗಾರ ಹಾಗೂ ಉದುರದ ಗಟ್ಟಿಯಾದ ಕಾಯಿಗಳ ಗೊಂಚಲು"
    ],
    causesEn: ["Proper balanced NPK fertilization, drainage, and timely weeding."],
    causesKn: ["ಸಮತೋಲಿತ ರಸಗೊಬ್ಬರ, ಉತ್ತಮ ಬಸಿಗಾಲುವೆ ಹಾಗೂ ಸೂಕ್ತ ಕೃಷಿ ನಿರ್ವಹಣೆ."],
    weatherEn: "Adequate sunlight (6-8 hours) with soil moisture at field capacity (60-70%).",
    weatherKn: "ದಿನಕ್ಕೆ 6-8 ಗಂಟೆಗಳ ಬಿಸಿಲು ಮತ್ತು ಮಣ್ಣಿನಲ್ಲಿ ಸೂಕ್ತ ತೇವಾಂಶ (60-70%).",
    spectralEn: "High NIR reflectance (840nm > 50%), NDVI > 0.65, strong green peak (560nm).",
    spectralKn: "ಹೆಚ್ಚಿನ NIR ಪ್ರತಿಫಲನ (>50%), NDVI > 0.65, ಗರಿಷ್ಠ ಹಸಿರು ಸಾಂದ್ರತೆ.",
    organicEn: ["Apply 15-20 kg well-decomposed FYM/compost and 2 kg neem cake per palm annually."],
    organicKn: ["ಪ್ರತಿ ಮರಕ್ಕೆ ವಾರ್ಷಿಕ 15-20 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಮತ್ತು 2 ಕೆಜಿ ಬೇವಿನ ಹಿಂಡಿ ನೀಡಿ."],
    chemicalEn: ["Apply recommended 100g N, 40g P2O5, 140g K2O in two split doses."],
    chemicalKn: ["ಶಿಫಾರಸು ಮಾಡಿದ 100 ಗ್ರಾಂ ಸಾರಜನಕ, 40 ಗ್ರಾಂ ರಂಜಕ, 140 ಗ್ರಾಂ ಪೊಟ್ಯಾಶ್ ಅನ್ನು ಎರಡು ಕಂತುಗಳಲ್ಲಿ ನೀಡಿ."],
    preventionEn: ["Maintain clean drainage basins and inspect canopies quarterly."],
    preventionKn: ["ತೋಟದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿಗಾಲುವೆಗಳನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ."],
    image: "/static/images/sample_healthy.jpg"
  },
  {
    id: "koleroga",
    nameEn: "Koleroga / Mahali (Fruit Rot)",
    nameKn: "ಕೊಳೆರೋಗ / ಮಹಾಲಿ (ಕಾಯಿ ಕೊಳೆ)",
    pathogen: "Phytophthora meadii McRae (Oomycete fungus)",
    severity: "Critical",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    symptomsEn: [
      "Dark green water-soaked lesions near nut calyx followed by premature nut drop",
      "White felt-like fungal mycelium covering fallen nuts on plantation floor",
      "Infection spreading up stalks causing bunch drying and entire yield collapse"
    ],
    symptomsKn: [
      "ಕಾಯಿಯ ತೊಟ್ಟಿನ ಬಳಿ ನೀರಿನಲ್ಲಿ ನೆನೆದಂತಹ ಕಪ್ಪು ಕಲೆಗಳು ಉಂಟಾಗಿ ಕಾಯಿಗಳು ಉದುರುತ್ತವೆ",
      "ಉದುರಿದ ಕಾಯಿಗಳ ಮೇಲೆ ಬಿಳಿ ಬಣ್ಣದ ಶಿಲೀಂಧ್ರ ಬೆಳೆಯುತ್ತದೆ",
      "ಸೋಂಕು ಗೊನೆ ದಂಟಿಗೆ ಹರಡಿ ಇಡೀ ಗೊಂಚಲು ಒಣಗಿ ಅಪಾರ ನಷ್ಟ ಉಂಟಾಗುತ್ತದೆ"
    ],
    causesEn: [
      "Continuous heavy rainfall with intermittent mist and overcast skies",
      "Stagnant water and poor aerial ventilation in closely spaced orchards"
    ],
    causesKn: [
      "ಮುಂಗಾರು ಮಳೆಯ ಸತತ ಜಿಟಿಜಿಟಿ ಮಳೆ ಮತ್ತು ತೇವಭರಿತ ಮೋಡ ಕವಿದ ವಾತಾವರಣ",
      "ತೋಟದಲ್ಲಿ ಗಾಳಿ-ಬೆಳಕಿನ ಕೊರತೆ ಹಾಗೂ ಸಾಲುಗಳ ನಡುವೆ ನೀರು ನಿಲ್ಲುವುದು"
    ],
    weatherEn: "RH > 85%, temperature 20-24°C, continuous rainfall for 3-5 days.",
    weatherKn: "ಆರ್ದ್ರತೆ > 85%, ತಾಪಮಾನ 20-24°C, ಸತತ 3-5 ದಿನಗಳ ಮುಂಗಾರು ಮಳೆ.",
    spectralEn: "Drastic drop in NIR reflectance (-35%), red reflectance spikes (+22%), NDVI drops to 0.25-0.38.",
    spectralKn: "NIR ಪ್ರತಿಫಲನದಲ್ಲಿ ತೀವ್ರ ಕುಸಿತ (-35%), ಕೆಂಪು ಬೆಳಕಿನ ಹೆಚ್ಚಳ (+22%), NDVI 0.25-0.38 ಗೆ ಇಳಿಕೆ.",
    organicEn: [
      "Tie polythene bunch covers (200-gauge) before monsoon onset (Kotte tying)",
      "Destroy and burn all fallen nuts immediately to prevent soil spore banks"
    ],
    organicKn: [
      "ಮುಂಗಾರು ಮಳೆ ಆರಂಭಕ್ಕೂ ಮುನ್ನವೇ ಗೊನೆಗಳಿಗೆ 200 ಗೇಜ್ ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲ (ಕೊಟ್ಟೆ) ಕಟ್ಟಿ",
      "ಉದುರಿದ ಎಲ್ಲಾ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ಆಯ್ದು ತೋಟದ ಹೊರಗೆ ಹಾಕಿ ಸುಟ್ಟು ಹಾಕಿ"
    ],
    chemicalEn: [
      "Prophylactic spray of 1% Bordeaux mixture on bunches before monsoon",
      "Curative spray of Metalaxyl-Mancozeb (2.5 g/L) or Fosetyl-Al (2.0 g/L) during rain breaks"
    ],
    chemicalKn: [
      "ಮಳೆಗಾಲ ಆರಂಭಕ್ಕೂ ಮುನ್ನ ಗೊನೆಗಳಿಗೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣವನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಸಿಂಪಡಿಸಿ",
      "ಮಳೆ ಬಿಡುವು ನೀಡಿದಾಗ ಮೆಟಲಾಕ್ಸಿಲ್-ಮ್ಯಾಂಕೋಜೆಬ್ (2.5 ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ"
    ],
    preventionEn: ["Construct deep drainage trenches and prune interlocking fronds."],
    preventionKn: ["ಆಳವಾದ ಬಸಿಗಾಲುವೆ ನಿರ್ಮಿಸಿ, ಒಣಗಿದ ಹಳೆಯ ಗರಿಗಳನ್ನು ಕತ್ತರಿಸಿ ತೆಗೆಯಿರಿ."],
    image: "/static/images/sample_koleroga.jpg"
  },
  {
    id: "yellow_leaf",
    nameEn: "Yellow Leaf Disease (YLD)",
    nameKn: "ಹಳದಿ ಎಲೆ ರೋಗ",
    pathogen: "Phytoplasma (Transmitted by plant hopper Proutista moesta)",
    severity: "High",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    symptomsEn: [
      "Yellowing starts on outer whorl leaflet tips and advances inward",
      "Crown reduction, chlorotic fronds becoming stunted and stiff",
      "Kernels turn black, soft, and brittle leading to non-marketable nuts"
    ],
    symptomsKn: [
      "ಹೊರಗಿನ ಗರಿಗಳ ತುದಿಯಿಂದ ಹಳದಿ ಬಣ್ಣ ಆರಂಭವಾಗಿ ಒಳಗಿನ ಗರಿಗಳಿಗೆ ಹರಡುತ್ತದೆ",
      "ಮರದ ಸುಳಿ ಕಿರಿದಾಗಿ, ಗರಿಗಳು ಗಿಡ್ಡವಾಗಿ ಒರಟಾಗುತ್ತವೆ",
      "ಅಡಿಕೆಯ ಒಳಗಿನ ತಿರುಳು ಕಪ್ಪಾಗಿ, ಮೃದುವಾಗಿ ಗುಣಮಟ್ಟ ಸಂಪೂರ್ಣ ಹಾಳಾಗುತ್ತದೆ"
    ],
    causesEn: ["Phytoplasma vector transmission via phloem-feeding plant hoppers in acidic waterlogged soils."],
    causesKn: ["ರಸ ಹೀರುವ ಕೀಟಗಳ ಮೂಲಕ ಹರಡುವ ಫೈಟೋಪ್ಲಾಸ್ಮಾ ರೋಗಾಣು ಮತ್ತು ಆಮ್ಲೀಯ ಜೌಗು ಮಣ್ಣು."],
    weatherEn: "Post-monsoon and winter dry spells accelerating vector reproduction.",
    weatherKn: "ಹಿಂಗಾರು ಮತ್ತು ಚಳಿಗಾಲದ ಒಣ ಹವೆ ಕೀಟಗಳ ಹರಡುವಿಕೆಗೆ ಪೂರಕ.",
    spectralEn: "Strong carotenoid yellowing peak (580-600nm), Red-Edge slope flattens, NDRE drops to 0.18-0.28.",
    spectralKn: "ಹಳದಿ ಬೆಳಕಿನ ಪ್ರತಿಫಲನ (580-600nm) ಹೆಚ್ಚಳ, NDRE ತೀವ್ರವಾಗಿ ಇಳಿಕೆ (0.18-0.28).",
    organicEn: [
      "Incorporate green manure crops (Pueraria javanica / Sunn hemp) in basins",
      "Apply 500g agricultural lime / dolomite per palm to correct soil acidity"
    ],
    organicKn: [
      "ತೋಟದಲ್ಲಿ ಸೆಣಬು ಅಥವಾ ಡಯಾಂಚ ಹಸಿರೆಲೆ ಗೊಬ್ಬರ ಬೆಳೆಸಿ ಮಣ್ಣಿಗೆ ಸೇರಿಸಿ",
      "ಮಣ್ಣಿನ ಆಮ್ಲೀಯತೆ ಸರಿಪಡಿಸಲು ಪ್ರತಿ ಮರಕ್ಕೆ 500 ಗ್ರಾಂ ಕೃಷಿ ಸುಣ್ಣ ಅಥವಾ ಡಾಲೋಮೈಟ್ ಹಾಕಿ"
    ],
    chemicalEn: [
      "Imidacloprid 17.8 SL (0.5 ml/L) foliar spray to control hopper vectors",
      "Root feeding with Oxytetracycline hydrochloride (500 ppm, 100ml) in advanced stages"
    ],
    chemicalKn: [
      "ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕೆ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ (0.5 ಮಿ.ಲೀ/ಲೀ) ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಿ",
      "ತೀವ್ರ ಹಂತದಲ್ಲಿ ಆಕ್ಸಿಟೆಟ್ರಾಸೈಕ್ಲಿನ್ ಪ್ರತಿಜೀವಕವನ್ನು ಬೇರಿನ ಮೂಲಕ ನೀಡಿ"
    ],
    preventionEn: ["Eradicate severely debilitated palms and intercrop with shade-giving cocoa or banana."],
    preventionKn: ["ಹೆಚ್ಚು ರೋಗಪೀಡಿತ ಮರಗಳನ್ನು ಕಿತ್ತುಹಾಕಿ, ಬಾಳೆ ಅಥವಾ ಕೋಕೋ ಮಿಶ್ರಬೆಳೆ ಬೆಳೆಸಿ."],
    image: "/static/images/sample_yellow_leaf.jpg"
  },
  {
    id: "bud_rot",
    nameEn: "Bud Rot (Kandakoradu)",
    nameKn: "ಸುಳಿ ಕೊಳೆ ರೋಗ",
    pathogen: "Phytophthora palmivora (E.J. Butler)",
    severity: "Critical",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    symptomsEn: [
      "Spindle leaf (central spear leaf) discolors to yellow-brown and withers",
      "Rotting of apical growing bud inside the crown giving a foul odor",
      "Central spindle easily pulls out of the crown when tugged gently"
    ],
    symptomsKn: [
      "ಮರದ ಸುಳಿಯ ಎಲೆ ಹಳದಿ-ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಒಣಗುತ್ತದೆ",
      "ಸುಳಿಯ ಒಳಭಾಗ ಸಂಪೂರ್ಣ ಕೊಳೆತು ದುರ್ವಾಸನೆ ಬೀರುತ್ತದೆ",
      "ಸುಳಿಯನ್ನು ಕೈಯಿಂದ ಹಿಡಿದು ಎಳೆದರೆ ಸುಲಭವಾಗಿ ಕಿತ್ತು ಬರುತ್ತದೆ"
    ],
    causesEn: ["Persistent high humidity and water accumulation within the crown leaf sheaths."],
    causesKn: ["ಸುಳಿಯ ಗರಿಗಳಲ್ಲಿ ಮಳೆ ನೀರು ನಿಲ್ಲುವುದು ಮತ್ತು ನಿರಂತರ ತೇವಾಂಶ."],
    weatherEn: "Monsoon squalls with ambient RH > 90% and moderate temperatures (22-26°C).",
    weatherKn: "ಮುಂಗಾರು ಮಳೆ, ಆರ್ದ್ರತೆ > 90%, ತಾಪಮಾನ 22-26°C.",
    spectralEn: "Severe foliar moisture distortion (NDWI negative anomaly), crown reflectance decay.",
    spectralKn: "ಎಲೆ ತೇವಾಂಶ ಸೂಚ್ಯಂಕದಲ್ಲಿ (NDWI) ಭಾರಿ ವ್ಯತ್ಯಾಸ, ಕಿರೀಟ ಪ್ರತಿಫಲನ ಕುಸಿತ.",
    organicEn: [
      "Scoop out rotten apical tissues carefully and swab crown with Bordeaux paste (10%)",
      "Cover the treated crown with a protective earthen pot or plastic cone to ward off rain"
    ],
    organicKn: [
      "ಕೊಳೆತ ಸುಳಿಯ ಭಾಗವನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಹೆರೆದು ತೆಗೆದು 10% ಬೋರ್ಡೋ ಪೇಸ್ಟ್ ಲೇಪಿಸಿ",
      "ಮಳೆ ನೀರು ಬೀಳದಂತೆ ಸುಳಿಗೆ ಮಡಕೆ ಅಥವಾ ಪ್ಲಾಸ್ಟಿಕ್ ಕೋನ್ ಮುಚ್ಚಿ ರಕ್ಷಿಸಿ"
    ],
    chemicalEn: [
      "Place small perforated sachets of Mancozeb (5g) inside leaf axils near the growing tip",
      "Drench crown with Copper Oxychloride (3 g/L) or Metalaxyl-Mancozeb (2 g/L)"
    ],
    chemicalKn: [
      "ಸುಳಿಯ ಎಲೆ ಸಂದಿನಲ್ಲಿ 5 ಗ್ರಾಂ ಮ್ಯಾಂಕೋಜೆಬ್ ಪೊಟ್ಟಣವನ್ನು ಇರಿಸಿ",
      "ಸುಳಿಗೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ (3 ಗ್ರಾಂ/ಲೀ) ದ್ರಾವಣ ಸುರಿಯಿರಿ"
    ],
    preventionEn: ["Inspect crown health every 10 days during monsoon season."],
    preventionKn: ["ಮಳೆಗಾಲದಲ್ಲಿ ಪ್ರತಿ 10 ದಿನಗಳಿಗೊಮ್ಮೆ ಮರದ ಸುಳಿಗಳನ್ನು ತಪ್ಪದೇ ಪರಿಶೀಲಿಸಿ."],
    image: "/static/images/sample_bud_rot.jpg"
  },
  {
    id: "stem_bleeding",
    nameEn: "Stem Bleeding Disease",
    nameKn: "ಕಾಂಡ ಸೋರುವಿಕೆ ರೋಗ",
    pathogen: "Thielaviopsis paradoxa (de Seynes) Höhn",
    severity: "High",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    symptomsEn: [
      "Exudation of dark reddish-brown viscous liquid through cracks on lower stem",
      "Internal trunk tissue rot spreading longitudinally beneath the bark",
      "Bark peels off exposing blackened fibrous internal vascular tissues"
    ],
    symptomsKn: [
      "ಬುಡದಿಂದ 2-3 ಮೀಟರ್ ಎತ್ತರದ ಕಾಂಡದ ಬಿರುಕುಗಳಿಂದ ಕಡು ಕಂದು ದ್ರವ ಒಸರುತ್ತದೆ",
      "ಕಾಂಡದ ಒಳಭಾಗದಲ್ಲಿ ನಾರಿನ ಅಂಗಾಂಶ ಕೊಳೆತು ಕಪ್ಪಾಗುತ್ತದೆ",
      "ತೊಗಟೆ ಸಡಿಲವಾಗಿ ಒಡೆದು ಮರ ದುರ್ಬಲಗೊಳ್ಳುತ್ತದೆ"
    ],
    causesEn: ["Stem growth fissures, mechanical harvesting injuries, sunscorch, or borer wounds."],
    causesKn: ["ಕಾಂಡದಲ್ಲಿ ಉಂಟಾಗುವ ಬಿರುಕುಗಳು, ಕೀಟಗಳ ಹಾನಿ ಅಥವಾ ಬಿಸಿಲಿನ ತಾಪ."],
    weatherEn: "High soil moisture alternating with sudden intense dry sunshine.",
    weatherKn: "ಹೆಚ್ಚಿನ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಹಠಾತ್ ಬಿಸಿಲಿನ ತೀವ್ರತೆ.",
    spectralEn: "High texture variance and ExR (Excess Red index) along trunk segments.",
    spectralKn: "ಕಾಂಡದ ಮೇಲೆ ಹೆಚ್ಚಿನ ಕೆಂಪು ಸೂಚ್ಯಂಕ (ExR) ಮತ್ತು ರಚನೆಯ ಒರಟುತನ.",
    organicEn: [
      "Chisel out diseased bark tissues and swab wound with hot coal tar or Bordeaux paste",
      "Apply Neem cake (5 kg) mixed with Trichoderma viride around the palm root zone"
    ],
    organicKn: [
      "ರೋಗಪೀಡಿತ ತೊಗಟೆಯನ್ನು ಹೆರೆದು ತೆಗೆದು ಬೋರ್ಡೋ ಪೇಸ್ಟ್ ಅಥವಾ ಕೋಲ್ಟಾರ್ ಹಚ್ಚಿ",
      "ಬೇರಿನ ಬುಡಕ್ಕೆ 5 ಕೆಜಿ ಬೇವಿನ ಹಿಂಡಿಯೊಂದಿಗೆ ಟ್ರೈಕೋಡರ್ಮ ಮಿಕ್ಸ್ ಮಾಡಿ ಹಾಕಿ"
    ],
    chemicalEn: [
      "Trunk swabbing with Hexaconazole 5% EC (2 ml/L) or Propiconazole (1 ml/L)",
      "Stem injection or root drenching with Carbendazim (2 g/L) for systemic eradication"
    ],
    chemicalKn: [
      "ಹೆಕ್ಸಾಕೊನಾಜೋಲ್ (2 ಮಿ.ಲೀ/ಲೀ) ಅಥವಾ ಪ್ರೊಪಿಕೊನಾಜೋಲ್ ದ್ರಾವಣವನ್ನು ಗಾಯಕ್ಕೆ ಲೇಪಿಸಿ",
      "ಕಾರ್ಬೆಂಡಾಜಿಮ್ (2 ಗ್ರಾಂ/ಲೀ) ದ್ರಾವಣದಿಂದ ಬೇರು ನೆನೆಸಿ"
    ],
    preventionEn: ["Avoid knife injuries to trunks during harvesting and coat trunks with lime whitewash."],
    preventionKn: ["ಮರ ಹತ್ತುವಾಗ ಕಾಂಡಕ್ಕೆ ಗಾಯವಾಗದಂತೆ ಎಚ್ಚರವಹಿಸಿ; ಕಾಂಡಕ್ಕೆ ಸುಣ್ಣ ಬಳಿಯಿರಿ."],
    image: "/static/images/sample_stem_bleeding.jpg"
  },
  {
    id: "leaf_spot",
    nameEn: "Leaf Spot / Blight",
    nameKn: "ಎಲೆ ಚುಕ್ಕೆ ರೋಗ",
    pathogen: "Colletotrichum gloeosporioides & Phyllosticta arecae",
    severity: "Moderate",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    symptomsEn: [
      "Small yellowish spots on leaflets enlarging into dark brown necrotic spots",
      "Spots coalesce causing extensive foliar drying, blighting, and ragged leaves",
      "Yellow chlorotic halo characteristically encircling older lesions"
    ],
    symptomsKn: [
      "ಎಲೆಗಳ ಮೇಲೆ ಸಣ್ಣ ಹಳದಿ ಚುಕ್ಕೆಗಳು ಉಂಟಾಗಿ ನಂತರ ಕಂದು ಬಣ್ಣದ ದೊಡ್ಡ ಗಾಯಗಳಾಗುತ್ತವೆ",
      "ಚುಕ್ಕೆಗಳು ಒಟ್ಟಾಗಿ ಸೇರಿ ಎಲೆಗಳು ಒಣಗಿ ಹರಿದು ಹೋಗುತ್ತವೆ",
      "ಗಾಯಗಳ ಸುತ್ತಲೂ ಹಳದಿ ಬಣ್ಣದ ವೃತ್ತಾಕಾರದ ಅಂಚು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ"
    ],
    causesEn: ["Spore dispersal via raindrops on stressed under-nourished nursery palms."],
    causesKn: ["ಮಳೆ ಹನಿಗಳ ಮೂಲಕ ಹರಡುವ ಶಿಲೀಂಧ್ರ ಹಾಗೂ ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ."],
    weatherEn: "High relative humidity (75-85%) with moderate temperatures (24-28°C).",
    weatherKn: "ಆರ್ದ್ರತೆ 75-85% ಮತ್ತು ಸಾಧಾರಣ ಉಷ್ಣತೆ (24-28°C).",
    spectralEn: "Sobel edge density spike (>25.0), localized NDVI depression across foliage.",
    spectralKn: "ಎಲೆ ಮೇಲ್ಮೈಯಲ್ಲಿ ಹೆಚ್ಚಿನ ಅಂಚಿನ ಸಾಂದ್ರತೆ, NDVI ಯಲ್ಲಿ ಸಾಧಾರಣ ಇಳಿಕೆ.",
    organicEn: [
      "Spray 5% Neem oil emulsion or Pseudomonas fluorescens (20g/L) on affected foliage",
      "Prune and destroy heavily blighted lower fronds"
    ],
    organicKn: [
      "5% ಬೇವಿನ ಎಣ್ಣೆ ಅಥವಾ ಸ್ಯೂಡೋಮೊನಾಸ್ (20 ಗ್ರಾಂ/ಲೀ) ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ",
      "ಹೆಚ್ಚು ರೋಗಪೀಡಿತ ಹಳೆಯ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ನಾಶಪಡಿಸಿ"
    ],
    chemicalEn: [
      "Foliar spray with Mancozeb 75 WP (2.5 g/L) or Carbendazim 50 WP (1 g/L)",
      "Alternate with Difenoconazole 25 EC (1 ml/L) for persistent foliar blighting"
    ],
    chemicalKn: [
      "ಮ್ಯಾಂಕೋಜೆಬ್ (2.5 ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಕಾರ್ಬೆಂಡಾಜಿಮ್ (1 ಗ್ರಾಂ/ಲೀ) ಸಿಂಪಡಿಸಿ",
      "ರೋಗ ತೀವ್ರವಾಗಿದ್ದರೆ ಡೈಫೆನೊಕೊನಾಜೋಲ್ (1 ಮಿ.ಲೀ/ಲೀ) ಸಿಂಪಡಿಸಿ"
    ],
    preventionEn: ["Ensure balanced potash nutrition and avoid excessive nitrogenous top-dressing."],
    preventionKn: ["ಸಮತೋಲಿತ ಪೊಟ್ಯಾಶ್ ಗೊಬ್ಬರ ನೀಡಿ; ಅತಿಯಾದ ಯೂರಿಯಾ ಬಳಕೆಯನ್ನು ತಪ್ಪಿಸಿ."],
    image: "/static/images/sample_leaf_spot.jpg"
  }
];

export const Diseases: React.FC = () => {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [activeModal, setActiveModal] = useState<DiseaseDetail | null>(null);

  const filteredDiseases = DISEASES_DATA.filter((d) => {
    const matchesSearch =
      d.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      d.nameKn.toLowerCase().includes(search.toLowerCase()) ||
      d.pathogen.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      selectedSeverity === "all" || d.severity.toLowerCase() === selectedSeverity.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t("Field Agronomy Catalog • 6 Classes", "ಕೃಷಿ ರೋಗ ಕೈಪಿಡಿ • 6 ರೋಗಗಳು")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t("Arecanut Disease Library", "ಅಡಿಕೆ ಮರಗಳ ರೋಗ ಮಾಹಿತಿ ಕೋಶ")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          {t(
            "Complete pathology guide for arecanut palms including clinical symptoms, causal organisms, multi-spectral signatures, and integrated pest management.",
            "ಅಡಿಕೆ ಬೆಳೆಯ ಪ್ರಮುಖ ರೋಗಗಳ ಲಕ್ಷಣಗಳು, ಕಾರಣಗಳು, ಬಹು-ಸ್ಪೆಕ್ಟ್ರಲ್ ಸೂಚ್ಯಂಕಗಳು ಹಾಗೂ ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸಾ ಕ್ರಮಗಳು."
          )}
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search diseases or pathogens...", "ರೋಗ ಅಥವಾ ರೋಗಾಣು ಹುಡುಕಿ...")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "healthy", "critical", "high", "moderate"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSeverity(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedSeverity === s
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s === "all" ? t("All Classes", "ಎಲ್ಲವೂ") : s}
            </button>
          ))}
        </div>
      </div>

      {/* Disease Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiseases.map((d) => (
          <div
            key={d.id}
            className="bg-zinc-900/80 rounded-3xl border border-zinc-800 overflow-hidden flex flex-col hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-950/20 group"
          >
            {/* Image Thumbnail */}
            <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
              <img
                src={d.image}
                alt={d.nameEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <span
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${d.badgeClass}`}
              >
                {d.severity}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {lang === "kn" ? d.nameKn : d.nameEn}
                </h3>
                <p className="text-xs text-emerald-400/90 font-medium mt-0.5 font-kannada">
                  {lang === "kn" ? d.nameEn : d.nameKn}
                </p>
                <p className="text-xs text-zinc-400 italic mt-2 line-clamp-1">
                  {d.pathogen}
                </p>

                <p className="text-xs text-zinc-300 mt-3 line-clamp-2 leading-relaxed">
                  {lang === "kn" ? d.symptomsKn[0] : d.symptomsEn[0]}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setActiveModal(d)}
                className="w-full inline-flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200 text-xs font-bold py-2.5 rounded-xl border border-zinc-700/80 transition-all"
              >
                <span>{t("View Full Protocol & Remedies", "ಸಮಗ್ರ ವಿವರ ಮತ್ತು ಪರಿಹಾರ")}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Disease Detail Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${activeModal.badgeClass}`}>
                {activeModal.severity} Priority
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">
                {lang === "kn" ? activeModal.nameKn : activeModal.nameEn}
              </h2>
              <p className="text-sm text-emerald-400 font-kannada">
                {lang === "kn" ? activeModal.nameEn : activeModal.nameKn}
              </p>
              <p className="text-xs text-zinc-400 italic mt-1">
                {t("Causal Pathogen:", "ಕಾರಣವಾದ ರೋಗಾಣು:")} {activeModal.pathogen}
              </p>
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{t("Diagnostic Symptoms", "ರೋಗ ಲಕ್ಷಣಗಳು")}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {(lang === "kn" ? activeModal.symptomsKn : activeModal.symptomsEn).map((sym, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{sym}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weather & Spectral Signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>{t("Favorable Weather", "ಅನುಕೂಲಕರ ಹವಾಮಾನ")}</span>
                </div>
                <p className="text-xs text-zinc-300">
                  {lang === "kn" ? activeModal.weatherKn : activeModal.weatherEn}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t("Spectral Response", "ಸ್ಪೆಕ್ಟ್ರಲ್ ಗುಣಲಕ್ಷಣ")}</span>
                </div>
                <p className="text-xs text-zinc-300">
                  {lang === "kn" ? activeModal.spectralKn : activeModal.spectralEn}
                </p>
              </div>
            </div>

            {/* Organic vs Chemical Remedies */}
            <div className="space-y-4">
              {/* Organic */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4" />
                  <span>{t("Organic Bio-Control Treatment", "ಸಾವಯವ ಚಿಕಿತ್ಸೆ")}</span>
                </h4>
                <ul className="space-y-1 text-xs text-emerald-100">
                  {(lang === "kn" ? activeModal.organicKn : activeModal.organicEn).map((o, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chemical */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4" />
                  <span>{t("Chemical Fungicides & Dosages", "ರಾಸಾಯನಿಕ ಔಷಧಿಗಳು ಮತ್ತು ಪ್ರಮಾಣ")}</span>
                </h4>
                <ul className="space-y-1 text-xs text-amber-100">
                  {(lang === "kn" ? activeModal.chemicalKn : activeModal.chemicalEn).map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
            >
              {t("Close Protocol", "ಮುಚ್ಚಿ")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
