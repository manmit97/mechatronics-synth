<div align="center">
  <h1>🎛️ Mechatronics Synth Lab</h1>
  <p><strong>UXR-Series Oscilloscope Engine & Hardware Automation Synthesizer</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-v9-black?style=for-the-badge&logo=react)](https://docs.pmnd.rs/react-three-fiber/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI-SDK-000000?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/docs)
  [![Zustand](https://img.shields.io/badge/Zustand-State_Management-443E38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

  <br />

  <p align="center">
    A highly immersive, hardware-accelerated web application that acts as a digital twin testbench. It simulates, analyzes, and synthesizes physical automation systems using procedural 3D generation and AI.
  </p>
</div>

---

## ⚡ What is Mechatronics Synth Lab?

**Mechatronics Synth Lab** is a web-based synthesis and configuration engine designed with a meticulously crafted, hardware-accurate **Oscilloscope UI**. 

It bridges the gap between hardware engineering and modern web technologies by allowing users to conceptualize and design complex mechatronic systems (such as autonomous rovers, robotic arms, and hexapods) directly in the browser. Rather than relying on static schematics, the Lab generates realistic Bill of Materials (BOM), procedural 3D representations, and detailed component specifications in real-time.

Built as an interactive portfolio piece, it showcases the intersection of **Mechanical**, **Electronics**, and **Software** engineering.

## 📸 Showcase

> **Note:** *Screenshots and GIF demonstrations of the UI and 3D Configurator will be added here.*

<!-- Add screenshots here -->
<!-- <img src="./docs/hero.png" width="800" alt="Landing Page"> -->
<!-- <img src="./docs/configurator.gif" width="800" alt="3D Configurator"> -->

## ✨ Core Capabilities (What it can do)

- **Hardware-Accurate UI Elements**: Features an immersive "faceplate" design with continuous scanning waveform traces, BNC connectors, tactile knobs, and reactive LED indicators.
- **Procedural 3D Rendering**: Integrated with `React Three Fiber` and `@react-three/rapier` to dynamically render hardware assemblies, PCB boards, sensors, and structural elements in a responsive 3D viewport.
- **AI-Powered Synthesis**: Uses the Vercel AI SDK to dynamically mock, configure, and refine complex part assemblies based on natural language inputs and specific project pillars (Digital, Physical, Integrated, Additive).
- **Parametric Hardware Catalog**: Automatically calculates weight, physical dimensions, material properties, and unit costs for generated assemblies.
- **Interactive Audio Feedback**: Custom synthesized audio cues (beeps, clicks, and hums) that react to user interactions, enhancing the tactile feel of the application.

## 🏗️ Architecture & Technology Stack

The application is engineered for zero-latency interactions and high-performance 3D rendering:

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **3D Graphics & Physics**: [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei), & Rapier Physics
- **Styling & UI**: Custom [Tailwind CSS v4](https://tailwindcss.com/) configurations with bespoke CSS keyframe animations for the oscilloscope effects.
- **AI Integration**: [@ai-sdk/react](https://www.npmjs.com/package/@ai-sdk/react) & OpenAI
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) to handle complex 3D scene states, parts catalogs, and UI overlays without triggering expensive React re-renders.
- **Validation**: [Zod](https://zod.dev/)

## 🏎️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manmit97/mechatronics-synth.git
   cd mechatronics-synth
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Boot up the engine:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to initialize the oscilloscope console.

## 🗺️ Roadmap & Future Plans

The project is actively evolving. Here is what is planned for future updates:

- **Phase 1: Advanced 3D Procedural Components**
  - Implement dynamic mounting points on the 3D grid.
  - Integrate `@react-three/rapier` for kinematic and structural simulation.
- **Phase 2: AI Generative Integration**
  - Connect the Vercel AI SDK to a live LLM for conversational component configuration.
  - Allow the AI to dynamically adjust the Bill of Materials (BOM) based on user prompts.
- **Phase 3: Module Expansion**
  - Unlock and build out the `Simulate`, `BOM`, `Assembly`, and `Checkout` modules currently marked as "Under Development".
- **Phase 4: Multi-User & Cloud**
  - Implement authentication to allow saving and loading of system configurations.
  - Export assemblies as standard `.STL` or `.STEP` files.

## 👨‍💻 About

Created by **Manmit Singh** as a demonstration of advanced full-stack capabilities, bridging the gap between immersive UI/UX design, 3D web technologies, and software architecture.

- [GitHub Profile](https://github.com/manmit97)
- [LinkedIn Profile](https://www.linkedin.com/in/manmit-singh-0ba149129/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/manmit97/mechatronics-synth/issues).

## 📄 License

This project is licensed under the MIT License.
