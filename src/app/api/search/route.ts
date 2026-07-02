// ─── Component Search API ───────────────────────────────────────────────────
// Standalone endpoint for the Component Library to search for parts
// independently of the chat conversation.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, category, supplier, maxResults = 8 } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchApiKey = process.env.SEARCH_API_KEY;

    // If web search is available, use it
    if (searchApiKey) {
      const supplierFilter = supplier
        ? `site:${getSupplierDomain(supplier)}`
        : 'site:digikey.com OR site:mouser.com OR site:amazon.com OR site:sparkfun.com OR site:adafruit.com';

      const searchQuery = `${query} ${category || ''} ${supplierFilter} buy price`;

      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: searchApiKey,
            query: searchQuery,
            max_results: maxResults,
            include_answer: false,
            search_depth: 'basic',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const results = (data.results || []).map(
            (r: { title?: string; url?: string; content?: string }) => ({
              id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: r.title || query,
              supplier: extractSupplierFromUrl(r.url || ''),
              supplierUrl: r.url || '',
              description: (r.content || '').slice(0, 300),
              price: null, // Price extraction would need HTML parsing
              inStock: true,
              category: category || 'unknown',
            })
          );

          return Response.json({
            results,
            query,
            source: 'web_search',
          });
        }
      } catch {
        // Fall through to curated data
      }
    }

    // Fallback: Return curated component data from embedded knowledge
    const curatedResults = getCuratedComponents(query, category);
    return Response.json({
      results: curatedResults,
      query,
      source: 'curated',
    });
  } catch {
    return Response.json(
      { error: 'Failed to search components' },
      { status: 500 }
    );
  }
}

// ─── Supplier Domain Mapping ────────────────────────────────────────────────

function getSupplierDomain(supplier: string): string {
  const map: Record<string, string> = {
    digikey: 'digikey.com',
    mouser: 'mouser.com',
    amazon: 'amazon.com',
    sparkfun: 'sparkfun.com',
    adafruit: 'adafruit.com',
    mcmaster: 'mcmaster.com',
    aliexpress: 'aliexpress.com',
    pololu: 'pololu.com',
    lcsc: 'lcsc.com',
  };
  return map[supplier.toLowerCase()] || `${supplier.toLowerCase()}.com`;
}

function extractSupplierFromUrl(url: string): string {
  if (url.includes('digikey')) return 'DigiKey';
  if (url.includes('mouser')) return 'Mouser';
  if (url.includes('amazon')) return 'Amazon';
  if (url.includes('sparkfun')) return 'SparkFun';
  if (url.includes('adafruit')) return 'Adafruit';
  if (url.includes('mcmaster')) return 'McMaster-Carr';
  if (url.includes('aliexpress')) return 'AliExpress';
  if (url.includes('pololu')) return 'Pololu';
  if (url.includes('lcsc')) return 'LCSC';
  return 'Other';
}

// ─── Curated Component Database ─────────────────────────────────────────────
// Pre-loaded data for when web search is unavailable

interface CuratedComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  pricing: Array<{ supplier: string; price: number; url: string; inStock: boolean }>;
  popularity: number;
}

function getCuratedComponents(
  query: string,
  category?: string
): CuratedComponent[] {
  const all = CURATED_CATALOG;
  const q = query.toLowerCase();
  const cat = category?.toLowerCase();

  return all
    .filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        Object.values(c.specs).some((v) => v.toLowerCase().includes(q));
      const matchesCategory = !cat || cat === 'all' || c.category === cat;
      return matchesQuery && matchesCategory;
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12);
}

const CURATED_CATALOG: CuratedComponent[] = [
  // ─── Actuators ──────────────────────────────────────────────────────────
  {
    id: 'cur-nema17', name: 'NEMA 17 Stepper Motor (42×34mm)',
    category: 'actuator', description: 'Bipolar stepper, 200 steps/rev, 1.8° step angle. Standard for 3D printers and CNC.',
    specs: { Torque: '0.45 Nm', Current: '1.5A', Steps: '200/rev', Voltage: '12V', Shaft: '5mm' },
    pricing: [
      { supplier: 'DigiKey', price: 12.99, url: 'https://www.digikey.com/en/products/detail/17HS4401', inStock: true },
      { supplier: 'Amazon', price: 10.99, url: 'https://www.amazon.com/dp/B07KW36N9J', inStock: true },
      { supplier: 'AliExpress', price: 6.50, url: 'https://www.aliexpress.com/item/nema17', inStock: true },
    ],
    popularity: 95,
  },
  {
    id: 'cur-nema23', name: 'NEMA 23 Stepper Motor (57×56mm)',
    category: 'actuator', description: 'High-torque bipolar stepper for CNC routers and robotic joints.',
    specs: { Torque: '1.26 Nm', Current: '2.8A', Steps: '200/rev', Voltage: '24V', Shaft: '6.35mm' },
    pricing: [
      { supplier: 'DigiKey', price: 24.99, url: 'https://www.digikey.com/en/products/detail/23HS5628', inStock: true },
      { supplier: 'Amazon', price: 19.99, url: 'https://www.amazon.com/dp/B00PNEQKC0', inStock: true },
    ],
    popularity: 80,
  },
  {
    id: 'cur-mg996r', name: 'MG996R Servo Motor',
    category: 'actuator', description: 'High-torque metal gear digital servo for robotic arms and pan/tilt.',
    specs: { Torque: '11 kg·cm', Speed: '0.17s/60°', Voltage: '4.8-7.2V', Weight: '55g' },
    pricing: [
      { supplier: 'Amazon', price: 4.99, url: 'https://www.amazon.com/dp/B07MFK266B', inStock: true },
      { supplier: 'AliExpress', price: 2.50, url: 'https://www.aliexpress.com/item/mg996r', inStock: true },
    ],
    popularity: 90,
  },
  {
    id: 'cur-sg90', name: 'SG90 Micro Servo',
    category: 'actuator', description: 'Lightweight micro servo for small mechanisms and pan/tilt.',
    specs: { Torque: '1.8 kg·cm', Speed: '0.1s/60°', Voltage: '4.8V', Weight: '9g' },
    pricing: [
      { supplier: 'Amazon', price: 1.99, url: 'https://www.amazon.com/dp/B07L2SF3R4', inStock: true },
      { supplier: 'Adafruit', price: 5.95, url: 'https://www.adafruit.com/product/169', inStock: true },
    ],
    popularity: 88,
  },
  // ─── Controllers ────────────────────────────────────────────────────────
  {
    id: 'cur-esp32', name: 'ESP32-WROOM-32E DevKit',
    category: 'controller', description: 'Dual-core 240MHz WiFi+BT microcontroller. The go-to for IoT and robotics.',
    specs: { CPU: 'Dual 240MHz', RAM: '520KB', Flash: '4MB', WiFi: '802.11 b/g/n', GPIO: '34' },
    pricing: [
      { supplier: 'Mouser', price: 8.99, url: 'https://www.mouser.com/ProductDetail/ESP32-DevKitC', inStock: true },
      { supplier: 'Amazon', price: 7.99, url: 'https://www.amazon.com/dp/B08D5ZD528', inStock: true },
    ],
    popularity: 98,
  },
  {
    id: 'cur-pico-w', name: 'Raspberry Pi Pico W',
    category: 'controller', description: 'RP2040 dual-core 133MHz with WiFi+BLE. Affordable and capable.',
    specs: { CPU: 'Dual 133MHz', RAM: '264KB', Flash: '2MB', WiFi: '802.11n', BLE: '5.2' },
    pricing: [
      { supplier: 'SparkFun', price: 6.00, url: 'https://www.sparkfun.com/products/20173', inStock: true },
      { supplier: 'Adafruit', price: 6.00, url: 'https://www.adafruit.com/product/5526', inStock: true },
    ],
    popularity: 85,
  },
  {
    id: 'cur-mega', name: 'Arduino Mega 2560 R3',
    category: 'controller', description: 'ATmega2560, 54 digital I/O. For projects needing lots of pins.',
    specs: { MCU: 'ATmega2560', Clock: '16MHz', GPIO: '54', Analog: '16', PWM: '15' },
    pricing: [
      { supplier: 'DigiKey', price: 14.99, url: 'https://www.digikey.com/en/products/detail/mega2560', inStock: true },
      { supplier: 'Amazon', price: 12.99, url: 'https://www.amazon.com/dp/B0046AMGW0', inStock: true },
    ],
    popularity: 75,
  },
  // ─── Sensors ────────────────────────────────────────────────────────────
  {
    id: 'cur-hcsr04', name: 'HC-SR04 Ultrasonic Sensor',
    category: 'sensor', description: 'Ultrasonic ranging 2cm–400cm. Basic obstacle detection.',
    specs: { Range: '2–400cm', Accuracy: '±3mm', Beam: '15°', Voltage: '5V' },
    pricing: [
      { supplier: 'Amazon', price: 1.99, url: 'https://www.amazon.com/dp/B01COSN7O6', inStock: true },
      { supplier: 'SparkFun', price: 3.95, url: 'https://www.sparkfun.com/products/15569', inStock: true },
    ],
    popularity: 92,
  },
  {
    id: 'cur-mpu6050', name: 'MPU-6050 IMU (6-Axis)',
    category: 'sensor', description: '6-axis accelerometer + gyroscope. Essential for motion sensing.',
    specs: { Axes: '6 (3-accel+3-gyro)', Interface: 'I2C', Resolution: '16-bit', Range: '±16g/±2000°/s' },
    pricing: [
      { supplier: 'Amazon', price: 2.49, url: 'https://www.amazon.com/dp/B008BOPN40', inStock: true },
      { supplier: 'Adafruit', price: 6.95, url: 'https://www.adafruit.com/product/3886', inStock: true },
    ],
    popularity: 88,
  },
  {
    id: 'cur-vl53l0x', name: 'VL53L0X ToF Laser Ranger',
    category: 'sensor', description: 'Time-of-Flight laser sensor, 0–2m range. Precise distance measurement.',
    specs: { Range: '0–2m', Accuracy: '±3%', Interface: 'I2C', Voltage: '2.8V' },
    pricing: [
      { supplier: 'Adafruit', price: 14.95, url: 'https://www.adafruit.com/product/3317', inStock: true },
      { supplier: 'Amazon', price: 5.99, url: 'https://www.amazon.com/dp/B071DW8M8V', inStock: true },
    ],
    popularity: 78,
  },
  // ─── Motor Drivers ──────────────────────────────────────────────────────
  {
    id: 'cur-tmc2209', name: 'TMC2209 Stepper Driver',
    category: 'controller', description: 'Silent stepper driver with StealthChop2. UART configurable.',
    specs: { Current: '2A RMS', Microstep: 'up to 256', Interface: 'UART/Step-Dir', Voltage: '4.75–29V' },
    pricing: [
      { supplier: 'DigiKey', price: 5.49, url: 'https://www.digikey.com/en/products/detail/tmc2209', inStock: true },
      { supplier: 'Amazon', price: 4.99, url: 'https://www.amazon.com/dp/B07YW7BM68', inStock: true },
    ],
    popularity: 82,
  },
  // ─── Power ──────────────────────────────────────────────────────────────
  {
    id: 'cur-lipo-3s', name: 'LiPo Battery 2200mAh 3S 11.1V',
    category: 'power', description: '3-cell LiPo, 25C discharge. Standard for robotics projects.',
    specs: { Capacity: '2200mAh', Voltage: '11.1V (3S)', Discharge: '25C', Connector: 'XT60' },
    pricing: [
      { supplier: 'Amazon', price: 19.99, url: 'https://www.amazon.com/dp/B0072AEY5I', inStock: true },
    ],
    popularity: 85,
  },
  // ─── Mechanical ─────────────────────────────────────────────────────────
  {
    id: 'cur-608zz', name: 'Ball Bearing 608ZZ (8×22×7mm)',
    category: 'transmission', description: 'Standard deep groove ball bearing. Used in wheels, joints, idlers.',
    specs: { Bore: '8mm', OD: '22mm', Width: '7mm', Shield: '2Z Metal' },
    pricing: [
      { supplier: 'McMaster-Carr', price: 1.29, url: 'https://www.mcmaster.com/57155K367', inStock: true },
      { supplier: 'Amazon', price: 0.89, url: 'https://www.amazon.com/dp/B07BDGCBXM', inStock: true },
    ],
    popularity: 75,
  },
  {
    id: 'cur-gt2-belt', name: 'GT2 Timing Belt (6mm, per meter)',
    category: 'transmission', description: '2mm pitch timing belt for motion systems. Fiberglass reinforced.',
    specs: { Pitch: '2mm', Width: '6mm', Material: 'Neoprene/Fiberglass' },
    pricing: [
      { supplier: 'Amazon', price: 3.99, url: 'https://www.amazon.com/dp/B071K8HYB3', inStock: true },
    ],
    popularity: 72,
  },
  {
    id: 'cur-m3-screws', name: 'M3×8mm Socket Head Cap Screw (100-pack)',
    category: 'fastener', description: 'ISO 4762, Grade 12.9, black oxide. The universal robotics fastener.',
    specs: { Thread: 'M3×0.5', Length: '8mm', Head: 'Socket Cap', Grade: '12.9' },
    pricing: [
      { supplier: 'McMaster-Carr', price: 6.47, url: 'https://www.mcmaster.com/91290A113', inStock: true },
      { supplier: 'Amazon', price: 7.99, url: 'https://www.amazon.com/dp/B014OO5KQG', inStock: true },
    ],
    popularity: 90,
  },
];
