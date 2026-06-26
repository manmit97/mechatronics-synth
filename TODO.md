# 🗺️ Roadmap & Active Tasks

This document tracks bug fixes, refactoring tasks, feature upgrades, and the strategic roadmap for the **Mechatronics Lab (UXR-Series Engine)**. 

---

## 🛠️ High Priority (Immediate Fixes & Code Quality)

Clean up the active warnings from the CI pipeline lint steps to keep builds green and pristine:
- [ ] Fix unused variable `config` in `src/app/page.tsx`
- [ ] Fix unused variables in `src/app/configurator/page.tsx`:
  - [ ] `useProjectStore`
  - [ ] `useBOMStore`
  - [ ] `useDesignHistoryStore`
  - [ ] `Weight`
  - [ ] `isPlaced`
- [ ] Fix unused imports in `src/ai/mock/mock-parts-generator.ts`:
  - [ ] `MaterialType`
  - [ ] `ManufacturingMethod`
  - [ ] `SourceType`
- [ ] Fix unused parameter `_catalog` in `src/ai/mock/mock-refinement-engine.ts`

---

## 🚀 Phase 1: UI, Visual Polish & Aesthetics

- [ ] **Tactile Feedback**: Add interactive micro-animations and physical physics-based dragging to knobs and sliders.
- [ ] **Material Design**: Implement dark mode optimization with subtle glassmorphism and CRT-glow styling details.
- [ ] **Typography**: Improve monospaced data alignment and scaling in the configurator readouts.

## 🚀 Phase 2: Mechatronics Engine & Synthesis

- [ ] **Expanded Audio Feedback**: Implement additional audio nodes (LFOs, filters, custom wavetables) linked to UI interactions.
- [ ] **Advanced 3D Rendering**: Add physically-based rendering (PBR) materials, dynamic lighting, and shadows in React Three Fiber.
- [ ] **Generative Expansion**: Extend the mock part generator logic with richer parameterization, including inverse kinematics (IK) support for robotic arms.

## 🚀 Phase 3: AI Refinement Engine & Real-Time Agent

- [ ] **Context-Aware Assistant**: Upgrade the chatbot to move away from generic responses and intelligently connect it to the active 3D design and BOM.
- [ ] **Agentic Actions**: Allow the AI agent to directly mutate the 3D scene (e.g., "swap the NEMA 17 motor for a servo") rather than just advising.
- [ ] **Constraint Validation**: Implement a system to validate generated components against realistic structural and electrical constraints.

## 🚀 Phase 4: Production & Cloud Sync

- [ ] **Authentication**: Implement multi-user authentication workflow (login, sign-up, session management).
- [ ] **Project Persistence**: Create a cloud-synced dashboard allowing users to list, load, and fork their mechatronic designs.
- [ ] **Database Architecture**: Design backend APIs (PostgreSQL/Supabase) to save user configurations and BOMs securely.

---

## ✅ Completed Milestones

* **2026-06-18**: Migrated CI deployment steps to use the official Vercel CLI workflow, successfully solving pipeline failure.
* **2026-06-15**: Bootstrapped basic project structure, hardware-UI components, and procedural mock parts generation.
