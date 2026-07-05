'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Package, Loader2 } from 'lucide-react';
import { useComponentLibraryStore, type ComponentEntry } from '@/stores/component-library-store';
import { ComponentCard } from './ComponentCard';
import { playClickSound } from '@/utils/audio';
import type { PartCategory } from '@/types/parts';

// ─── Component Library Drawer ───────────────────────────────────────────────
// RPG-inventory-style browsable panel with categorized components, real prices,
// stock LEDs, and "Add to Chat" interaction.

// Props removed, using global store

const CATEGORIES: { id: PartCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'ALL', icon: '📦' },
  { id: 'actuator', label: 'MOTORS', icon: '🔧' },
  { id: 'controller', label: 'CONTROLLERS', icon: '🧠' },
  { id: 'sensor', label: 'SENSORS', icon: '📡' },
  { id: 'power', label: 'POWER', icon: '⚡' },
  { id: 'structural', label: 'STRUCTURAL', icon: '🏗️' },
  { id: 'transmission', label: 'GEARS', icon: '⚙️' },
  { id: 'fastener', label: 'FASTENERS', icon: '🔩' },
  { id: 'wheel', label: 'WHEELS', icon: '🛞' },
  { id: 'end_effector', label: 'GRIPPERS', icon: '🤖' },
  { id: 'chassis', label: 'CHASSIS', icon: '🛡️' },
];

// Pre-loaded curated components (no API call needed)
const INITIAL_COMPONENTS: ComponentEntry[] = [
  {
    id: 'lib-nema17', name: 'NEMA 17 Stepper Motor', category: 'actuator',
    description: 'Bipolar stepper, 200 steps/rev, 1.8° step angle. The workhorse of 3D printers, CNC machines, and robotics.',
    specs: { Torque: '0.45 Nm', Current: '1.5A', Steps: '200/rev', Voltage: '12V', Shaft: '5mm', Frame: '42×42mm' },
    pricing: [
      { supplier: 'DigiKey', supplierUrl: 'https://www.digikey.com/en/products/detail/17HS4401', price: 12.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07KW36N9J', price: 10.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'AliExpress', supplierUrl: 'https://www.aliexpress.com/item/nema17', price: 6.50, currency: 'USD', inStock: true, leadTimeDays: 15 },
    ],
    stockStatus: 'in_stock', popularity: 95,
  },
  {
    id: 'lib-mg996r', name: 'MG996R Servo Motor', category: 'actuator',
    description: 'High-torque metal gear digital servo. Perfect for robotic arms, pan/tilt mechanisms, and steering.',
    specs: { Torque: '11 kg·cm', Speed: '0.17s/60°', Voltage: '4.8-7.2V', Weight: '55g', Gear: 'Metal' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07MFK266B', price: 4.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'AliExpress', supplierUrl: 'https://www.aliexpress.com/item/mg996r', price: 2.50, currency: 'USD', inStock: true, leadTimeDays: 14 },
    ],
    stockStatus: 'in_stock', popularity: 90,
  },
  {
    id: 'lib-sg90', name: 'SG90 Micro Servo (9g)', category: 'actuator',
    description: 'Lightweight micro servo for small mechanisms. Ultra-popular for hobby robotics.',
    specs: { Torque: '1.8 kg·cm', Speed: '0.1s/60°', Voltage: '4.8V', Weight: '9g' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07L2SF3R4', price: 1.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Adafruit', supplierUrl: 'https://www.adafruit.com/product/169', price: 5.95, currency: 'USD', inStock: true, leadTimeDays: 3 },
    ],
    stockStatus: 'in_stock', popularity: 88,
  },
  {
    id: 'lib-esp32', name: 'ESP32-WROOM-32E DevKit', category: 'controller',
    description: 'Dual-core 240MHz WiFi+BT microcontroller. The king of IoT and hobby robotics.',
    specs: { CPU: 'Dual 240MHz', RAM: '520KB', Flash: '4MB', WiFi: '802.11 b/g/n', BT: '4.2+BLE', GPIO: '34' },
    pricing: [
      { supplier: 'Mouser', supplierUrl: 'https://www.mouser.com/ProductDetail/ESP32-DevKitC', price: 8.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B08D5ZD528', price: 7.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 98,
  },
  {
    id: 'lib-pico-w', name: 'Raspberry Pi Pico W', category: 'controller',
    description: 'RP2040 dual-core 133MHz with WiFi+BLE. Affordable, capable, and beginner-friendly.',
    specs: { CPU: 'Dual 133MHz', RAM: '264KB', Flash: '2MB', WiFi: '802.11n', BLE: '5.2' },
    pricing: [
      { supplier: 'SparkFun', supplierUrl: 'https://www.sparkfun.com/products/20173', price: 6.00, currency: 'USD', inStock: true, leadTimeDays: 3 },
      { supplier: 'Adafruit', supplierUrl: 'https://www.adafruit.com/product/5526', price: 6.00, currency: 'USD', inStock: true, leadTimeDays: 3 },
    ],
    stockStatus: 'in_stock', popularity: 85,
  },
  {
    id: 'lib-mega', name: 'Arduino Mega 2560 R3', category: 'controller',
    description: 'ATmega2560 with 54 digital I/O. When you need lots of pins for multi-servo systems.',
    specs: { MCU: 'ATmega2560', Clock: '16MHz', GPIO: '54', Analog: '16', PWM: '15' },
    pricing: [
      { supplier: 'DigiKey', supplierUrl: 'https://www.digikey.com/en/products/detail/mega2560', price: 14.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B0046AMGW0', price: 12.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 75,
  },
  {
    id: 'lib-tmc2209', name: 'TMC2209 Stepper Driver', category: 'controller',
    description: 'Ultra-silent stepper driver with StealthChop2. UART configurable. Perfect for NEMA 17 motors.',
    specs: { Current: '2A RMS', Microstep: 'up to 256', Interface: 'UART/Step-Dir', Voltage: '4.75–29V' },
    pricing: [
      { supplier: 'DigiKey', supplierUrl: 'https://www.digikey.com/en/products/detail/tmc2209', price: 5.49, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07YW7BM68', price: 4.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 82,
  },
  {
    id: 'lib-hcsr04', name: 'HC-SR04 Ultrasonic Sensor', category: 'sensor',
    description: 'Ultrasonic ranging 2cm–400cm. The most popular distance sensor for obstacle detection.',
    specs: { Range: '2–400cm', Accuracy: '±3mm', Beam: '15°', Voltage: '5V', Trigger: '10µs pulse' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B01COSN7O6', price: 1.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'SparkFun', supplierUrl: 'https://www.sparkfun.com/products/15569', price: 3.95, currency: 'USD', inStock: true, leadTimeDays: 3 },
    ],
    stockStatus: 'in_stock', popularity: 92,
  },
  {
    id: 'lib-mpu6050', name: 'MPU-6050 IMU (6-Axis)', category: 'sensor',
    description: '6-axis accelerometer + gyroscope. Essential for balance, orientation, and motion tracking.',
    specs: { Axes: '6 (3-accel+3-gyro)', Interface: 'I2C', Resolution: '16-bit', Range: '±16g/±2000°/s' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B008BOPN40', price: 2.49, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Adafruit', supplierUrl: 'https://www.adafruit.com/product/3886', price: 6.95, currency: 'USD', inStock: true, leadTimeDays: 3 },
    ],
    stockStatus: 'in_stock', popularity: 88,
  },
  {
    id: 'lib-vl53l0x', name: 'VL53L0X ToF Laser Ranger', category: 'sensor',
    description: 'Time-of-Flight laser sensor for precise distance measurement. Tiny, accurate, I2C.',
    specs: { Range: '0–2m', Accuracy: '±3%', Interface: 'I2C', Voltage: '2.8V', Size: '4.4×2.4mm' },
    pricing: [
      { supplier: 'Adafruit', supplierUrl: 'https://www.adafruit.com/product/3317', price: 14.95, currency: 'USD', inStock: true, leadTimeDays: 3 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B071DW8M8V', price: 5.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 78,
  },
  {
    id: 'lib-lipo-3s', name: 'LiPo Battery 2200mAh 3S 11.1V', category: 'power',
    description: '3-cell LiPo with XT60 connector. Standard robotics power source with good energy density.',
    specs: { Capacity: '2200mAh', Voltage: '11.1V (3S)', Discharge: '25C', Connector: 'XT60', Runtime: '~90min' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B0072AEY5I', price: 19.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 85,
  },
  {
    id: 'lib-lm2596', name: 'LM2596 Buck Converter Module', category: 'power',
    description: 'Adjustable step-down voltage regulator. 3A output. Essential for multi-voltage systems.',
    specs: { Input: '4.5–40V', Output: '1.5–35V', Current: '3A', Efficiency: '92%' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07VVXF7YX', price: 1.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 80,
  },
  {
    id: 'lib-608zz', name: 'Ball Bearing 608ZZ (8×22×7mm)', category: 'transmission',
    description: 'Standard deep groove ball bearing. Used in wheels, joints, idlers, and spindles.',
    specs: { Bore: '8mm', OD: '22mm', Width: '7mm', Shield: '2Z Metal', Speed: '26000 RPM' },
    pricing: [
      { supplier: 'McMaster-Carr', supplierUrl: 'https://www.mcmaster.com/57155K367', price: 1.29, currency: 'USD', inStock: true, leadTimeDays: 1 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07BDGCBXM', price: 0.89, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 75,
  },
  {
    id: 'lib-m3-screws', name: 'M3×8mm SHCS (100-pack)', category: 'fastener',
    description: 'Socket head cap screw, Grade 12.9, black oxide. The universal robotics fastener.',
    specs: { Thread: 'M3×0.5', Length: '8mm', Head: 'Socket Cap', Grade: '12.9', Qty: '100' },
    pricing: [
      { supplier: 'McMaster-Carr', supplierUrl: 'https://www.mcmaster.com/91290A113', price: 6.47, currency: 'USD', inStock: true, leadTimeDays: 1 },
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B014OO5KQG', price: 7.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 90,
  },
  {
    id: 'lib-gt2-belt', name: 'GT2 Timing Belt (6mm wide)', category: 'transmission',
    description: '2mm pitch timing belt for linear motion. Fiberglass-reinforced neoprene.',
    specs: { Pitch: '2mm', Width: '6mm', Material: 'Neoprene/Fiberglass' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B071K8HYB3', price: 3.99, currency: 'USD', inStock: true, leadTimeDays: 2 },
    ],
    stockStatus: 'in_stock', popularity: 72,
  },
  {
    id: 'lib-wheel-65', name: 'Rubber Wheel 65mm (5mm bore)', category: 'wheel',
    description: 'High-grip rubber wheel for rover/robot platforms. Fits standard NEMA 17 shaft.',
    specs: { Diameter: '65mm', Width: '28mm', Bore: '5mm', Tread: 'High-grip' },
    pricing: [
      { supplier: 'Amazon', supplierUrl: 'https://www.amazon.com/dp/B07Z6FYNNN', price: 3.49, currency: 'USD', inStock: true, leadTimeDays: 2 },
      { supplier: 'Pololu', supplierUrl: 'https://www.pololu.com/product/1430', price: 4.95, currency: 'USD', inStock: true, leadTimeDays: 3 },
    ],
    stockStatus: 'in_stock', popularity: 70,
  },
];

import { useChatStore } from '@/stores/chat-store';

export function ComponentLibrary() {
  const {
    isOpen,
    closeLibrary,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setCategory,
    components,
    setComponents,
    isSearching,
    setSearching,
  } = useComponentLibraryStore();

  const { setPendingPrompt, openDrawer } = useChatStore();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onAddToChat = useCallback((componentName: string, specs?: string) => {
    const msg = `Add a ${componentName} to the current configuration. Target specs: ${specs || 'N/A'}.`;
    setPendingPrompt(msg);
    closeLibrary();
    openDrawer();
  }, [setPendingPrompt, closeLibrary, openDrawer]);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize with curated components
  useEffect(() => {
    if (components.length === 0) {
      setComponents(INITIAL_COMPONENTS);
    }
  }, [components.length, setComponents]);

  // Debounced web search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setComponents(INITIAL_COMPONENTS);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          category: activeCategory !== 'all' ? activeCategory : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          // Map search results to ComponentEntry format
          const mapped: ComponentEntry[] = data.results.map((r: {
            id: string;
            name: string;
            category: string;
            description: string;
            specs?: Record<string, string>;
            pricing?: Array<{ supplier: string; price: number; url: string; inStock: boolean }>;
            supplier?: string;
            supplierUrl?: string;
            price?: number;
          }) => ({
            id: r.id || `search-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: r.name,
            category: r.category || 'unknown',
            description: r.description || '',
            specs: r.specs || {},
            pricing: r.pricing
              ? r.pricing.map((p: { supplier: string; price: number; url: string; inStock: boolean }) => ({
                  supplier: p.supplier,
                  supplierUrl: p.url,
                  price: p.price,
                  currency: 'USD',
                  inStock: p.inStock,
                }))
              : r.supplier
                ? [{ supplier: r.supplier, supplierUrl: r.supplierUrl || '', price: r.price || 0, currency: 'USD', inStock: true }]
                : [],
            stockStatus: 'in_stock' as const,
            popularity: 50,
          }));
          setComponents(mapped);
          setHasSearched(true);
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      setSearching(false);
    }
  }, [activeCategory, setComponents, setSearching]);

  // Debounce search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 500);
  };

  // Filter by category
  const filteredComponents = activeCategory === 'all'
    ? components
    : components.filter((c) => c.category === activeCategory);

  // Count per category
  const categoryCounts: Record<string, number> = {};
  for (const c of components) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  }

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#121212]/95 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151] bg-[#1a1b1e]">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-[#facc15]" />
          <span className="text-sm font-semibold tracking-wider text-[#facc15]">
            PARTS CATALOG
          </span>
          <span className="text-xs text-[#6b7280] font-medium ml-1">
            ({filteredComponents.length} items)
          </span>
        </div>
        <button
          onClick={() => { playClickSound(false); closeLibrary(); }}
          className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-[#374151] bg-[#1e1f22]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search components, e.g. 'NEMA 17', 'IMU', 'ESP32'..."
            className="w-full pl-7 pr-3 py-1.5 bg-[#111] border border-[#374151] rounded text-sm text-[#f3f4f6] placeholder:text-[#4b5563] focus:outline-none focus:border-[#60a5fa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
          />
          {isSearching && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#60a5fa] animate-spin" />
          )}
        </div>
        {hasSearched && (
          <button
            onClick={() => {
              setSearchQuery('');
              setComponents(INITIAL_COMPONENTS);
              setHasSearched(false);
            }}
            className="mt-1 text-xs text-[#60a5fa] font-medium hover:text-[#93bbfc] transition-colors"
          >
            ← Back to catalog
          </button>
        )}
      </div>

      {/* Category Filter Strip */}
      <div className="px-3 py-1.5 flex gap-1 overflow-x-auto border-b border-[#374151] bg-[#1a1b1e] scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'all' ? components.length : (categoryCounts[cat.id] || 0);
          return (
            <button
              key={cat.id}
              onClick={() => { playClickSound(true); setCategory(cat.id); }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#374151] text-[#f3f4f6] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22]'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-[#4b5563] text-[#f3f4f6]' : 'bg-[#1e1f22] text-[#6b7280]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Searching Animation */}
      {isSearching && (
        <div className="px-4 py-3 flex items-center gap-2 text-xs font-semibold text-[#60a5fa] animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          SEARCHING SUPPLIERS...
        </div>
      )}

      {/* Component Cards Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="grid grid-cols-1 gap-2 stagger-children">
          {filteredComponents.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onAddToChat={onAddToChat}
            />
          ))}
        </div>

        {filteredComponents.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-8 h-8 text-[#374151] mb-2" />
            <span className="text-sm font-semibold text-[#6b7280]">
              No components found
            </span>
            <span className="text-xs text-[#4b5563] mt-1">
              Try a different search or category
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
