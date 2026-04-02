// lib/valuationEngine.ts

export function calcularValorAproximado(
  modelo: string,
  nombreFabricante: string,
  rareza: string,
  presentacion: string, // 📦 El 6to argumento
  anio: number | null,
  nombreEstado: string
): number {
  
  // 🛑 CANDADO DE SEGURIDAD: Si no hay modelo escrito, el valor es 0.
  if (!modelo || modelo.trim() === "") {
    return 0;
  }

  // 1. Precio Retail Base (P_retail) y Factor de Marca (B) en Pesos MXN
  let P_retail = 40; // Base estándar mainline
  let B = 1.0;
  
  const fab = (nombreFabricante || "").toLowerCase();
  const pres = (presentacion || "").toLowerCase();

  // --- Lógica de Precios y Hype 2026 ---
  if (fab.includes('hot wheels')) { P_retail = 40; B = 1.0; } 
  else if (fab.includes('matchbox')) { P_retail = 40; B = 0.9; } 
  else if (fab.includes('majorette')) { P_retail = 85; B = 1.0; } 
  else if (fab.includes('maisto') || fab.includes('bburago')) { P_retail = 150; B = 0.8; } 
  else if (fab.includes('jada')) { P_retail = 280; B = 1.1; } 
  else if (fab.includes('greenlight')) { P_retail = 250; B = 1.1; } 
  else if (fab.includes('m2')) { P_retail = 280; B = 1.2; } 
  else if (fab.includes('mini gt') || fab.includes('minigt')) { P_retail = 420; B = 1.4; } 
  else if (fab.includes('inno64') || fab.includes('tarmac')) { P_retail = 550; B = 1.5; } 
  else if (fab.includes('kaido')) { P_retail = 300; B = 1.7; } 
  else if (fab.includes('pop race')) { P_retail = 480; B = 1.4; } 
  else if (fab.includes('tomica')) { P_retail = 450; B = 1.3; } 
  else if (fab.includes('kyosho')) { P_retail = 500; B = 1.5; } 
  else if (fab.includes('autoart')) { P_retail = 1200; B = 1.8; } 
  else if (fab.includes('pgm')) { P_retail = 1800; B = 2.0; }
  else { P_retail = 100; B = 1.0; }

  // --- 📦 LÓGICA DE PRECIOS BASE SEGÚN LA PRESENTACIÓN ---
  // Reemplaza el P_retail si viene en un empaque especial
  if (pres.includes('5-pack') || pres.includes('5 pack') || pres.includes('multipack')) P_retail = 200;
  else if (pres.includes('3-pack') || pres.includes('3 pack')) P_retail = 120;
  else if (pres.includes('team transport')) P_retail = 350;
  else if (pres.includes('premium box')) P_retail = 700;
  else if (pres.includes('premium') || pres.includes('car culture')) P_retail = 150;
  else if (pres.includes('diorama') || pres.includes('box set')) P_retail = 650;
  else if (pres.includes('moving parts')) P_retail = 120;
  else if (pres.includes('silver series')) P_retail = 120;
  else if (pres.includes('brick') || pres.includes('mega construx')) P_retail = 350;
  // 🚨 CORRECCIÓN: Convertido a minúsculas para que el motor pueda leerlo
  else if (pres.includes('uniquely identifiable')) P_retail = 90;

  // 2. Calidad / Multiplicador de Rareza Técnica (Q) MULTIMARCA
  let Q = 1.0;
  const rar = (rareza || "").toLowerCase();
  
  // Nivel Dios (RLC, Convenciones limitadas)
  if (rar.includes('rlc') || rar.includes('red line club') || rar.includes('convention')) Q = 25.0;
  // Nivel Leyenda (STH de Hot Wheels)
  else if (rar.includes('super treasure') || rar.includes('sth')) Q = 15.0;
  // Nivel Raw / Súper Chase (Piezas sin pintar de M2, Chase 1/1 de Kaido)
  else if (rar.includes('raw') || rar.includes('super chase')) Q = 12.0;
  // Nivel Chase General (M2 Gold/Black, Matchbox Super Chase, Mini GT, White Lightning)
  else if (rar.includes('chase') || rar.includes('white lightning') || rar.includes('ultra red') || rar.includes('green machine')) Q = 8.0;
  // Nivel Exclusivo de Tienda (Zamac, Red Edition, MiJo Exclusives)
  else if (rar.includes('exclusiv') || rar.includes('mijo') || rar.includes('zamac') || rar.includes('red edition')) Q = 4.0;
  // Nivel Treasure Hunt Básico
  else if (rar.includes('treasure hunt') || rar.includes('th')) Q = 3.0;
  else if (rar.includes('fast & furious')) Q = 2.0;

  // 3. Condición / Estado Físico (C) 
  let C = 1.0;
  const est = (nombreEstado || "").toLowerCase();
  
  if (est.includes('blíster excelente')) C = 1.3; 
  else if (est.includes('blíster buena')) C = 1.0; 
  else if (est.includes('blíster mala')) C = 0.8; 
  else if (est.includes('loose')) C = 0.6; 
  else if (est.includes('buena condición') && !est.includes('blíster')) C = 0.5; 
  else if (est.includes('mal estado')) C = 0.3; 
  else if (est.includes('chatarra')) C = 0.1; 

  // 4. Demanda / "Impuesto JDM" o Hype (D)
  let D = 1.0;
  const mod = (modelo || "").toLowerCase();
  const highDemand = [
    'skyline', 'gt-r', 'gtr', 'r32', 'r34', 'r35', 'supra', 'rx-7', 'rx7', 'silvia', 's13', 's14', 's15', 'barbie', 'aston', 'martin', 'formula 1',
    'civic', 'integra', 'nsx', 'ae86', 'datsun', '240z', '510', 'fairlady', 'lancer evo', 'subaru wrx', '22b',
    'porsche', '911', '930', '964', 'gt3', 'taycan', 'ferrari', 'f40', 'f50', 'enzo', 'laferrari', 
    'lamborghini', 'countach', 'huracan', 'aventador', 'miura', 'bugatti', 'chiron', 'veyron', 'eb110',
    'mclaren', 'f1', 'senna', 'pagani', 'zonda', 'huayra', 'koenigsegg', 'jesko',
    'kool kombi', 'gasser', '55 chevy gasser', 'bone shaker', 'drag bus', 'moon eyes', 'sthw', 'th',
    'fast & furious', 'fast and furious', 'f&f', 'tokyo drift', 'paul walker', "brian o'conner", 'toretto', 'shelby'
  ];
  const midDemand = [
    'mustang', 'eleanor', 'camaro', 'charger', 'challenger', 'corvette', 'stingray', 
    'chevy c10', 'silverado', 'f-150', 'raptor', 'bronco', 'bel air', 'impala', 'nova',
    'jeep', 'wrangler', 'rubicon', 'gladiator', 'land rover', 'defender', 'toyota land cruiser', '4runner', 'tacoma',
    'bmw', 'm3', 'm4', 'm5', 'e30', 'e46', 'vw', 'volkswagen', 'beetle', 'vocho', 'golf gti', 'scirocco',
    'mercedes', 'amg', 'g-wagon', 'audi', 'rs6', 'quattro', 'alfa romeo', 'giulia', 'batmobile'
  ];
  
  if (highDemand.some(k => modelo.toLowerCase().includes(k))) D = 1.4;
  else if (midDemand.some(k => modelo.toLowerCase().includes(k))) D = 1.2;
  else if (modelo.toLowerCase().includes('fantasy')) D = 0.8; 

  // 5. Apreciación Histórica (1 + r)^n
  let n = 0;
  const currentYear = new Date().getFullYear(); 
  if (anio && anio > 1900 && anio <= currentYear) {
    n = currentYear - anio;
  }
  const r = 0.08; 
  const appreciation = Math.pow((1 + r), n);

  let V_final = (P_retail * B * Q) * appreciation * C * D;
  return Math.round(V_final / 10) * 10;
}