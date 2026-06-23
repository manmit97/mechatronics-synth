# Mechatronics Synth - Ongoing Tasks & Roadmap

This document tracks bug fixes, refactoring tasks, feature upgrades, and general enhancements for the **Mechatronics Synth Web App**. 

---

## 🛠️ High Priority (Immediate Fixes)

### Code Quality & Linting
Clean up the active warnings from the CI pipeline lint steps to keep builds green and pristine:
- [ ] Fix unused variable `config` in [page.tsx](file:///Users/manmitsingh/Software%20Production/MechatronicsSynthWebApp/src/app/page.tsx#L26)
- [ ] Fix unused variables in [configurator/page.tsx](file:///Users/manmitsingh/Software%20Production/MechatronicsSynthWebApp/src/app/configurator/page.tsx):
  - [ ] `useProjectStore` (Line 5)
  - [ ] `useBOMStore` (Line 6)
  - [ ] `useDesignHistoryStore` (Line 7)
  - [ ] `Weight` (Line 8)
  - [ ] `isPlaced` (Line 18)
- [ ] Fix unused imports in [mock-parts-generator.ts](file:///Users/manmitsingh/Software%20Production/MechatronicsSynthWebApp/src/ai/mock/mock-parts-generator.ts#L5):
  - [ ] `MaterialType`
  - [ ] `ManufacturingMethod`
  - [ ] `SourceType`
- [ ] Fix unused parameter `_catalog` in [mock-refinement-engine.ts](file:///Users/manmitsingh/Software%20Production/MechatronicsSynthWebApp/src/ai/mock/mock-refinement-engine.ts#L224)

---

## 🚀 Future Upgrades & Roadmap

### 1. UI & Visual Polish
- [ ] Add interactive micro-animations to knobs and sliders.
- [ ] Implement dark mode and glassmorphism styling details.
- [ ] Improve typography and alignment in the configurator controls.

### 2. Mechatronics Engine & Synthesis features
- [ ] Implement additional audio nodes (LFOs, filters, custom wavetables).
- [ ] Add 3D representation enhancements using React Three Fiber.
- [ ] Extend part generator logic with richer parameterization.

### 3. User Management & Save System (For Online Release)
- [ ] Implement multi-user authentication workflow (e.g., login, sign-up, user profiles).
- [ ] Create a project dashboard allowing users to list and select from their own mechatronics projects.
- [ ] Design and implement database schema & backend APIs to save, update, and organize user design configurations.

### 4. AI Refinement Engine & Chatbot
- [ ] Improve the chatbot to move away from generic responses and connect it intelligently to the active design process.
- [ ] Make the AI agent fully context-aware of the system design to assist proactively and avoid endless questioning loops.
- [ ] Add interactive conversational prompts to refine synthesizers with real-time audio feedbacks.
- [ ] Validate generated components against realistic structural constraints.

---

## ✅ Completed Tasks

- **2026-06-18**: Migrated CI deployment steps to use the official Vercel CLI workflow, successfully solving pipeline failure.
- **2026-06-15**: Bootstrapped basic project structure, components, and mockup parts generation.
