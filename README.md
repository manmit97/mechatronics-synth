<div align="center">
  <h1>🎛️ Mechatronics Lab</h1>
  <p><strong>UXR-Series Oscilloscope Engine & Automation Synthesizer</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-v9-black?style=for-the-badge&logo=react)](https://docs.pmnd.rs/react-three-fiber/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI-SDK-000000?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/docs)
  [![Zustand](https://img.shields.io/badge/Zustand-State_Management-443E38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

  <p align="center">
    A highly immersive, hardware-accelerated web application that simulates, analyzes, and synthesizes physical automation systems using procedural 3D generation and AI.
  </p>
</div>

---

## ⚡ Overview

**Mechatronics Lab** is a web-based synthesis and configuration engine designed with a meticulously crafted **Oscilloscope/Hardware UI**. It allows users to design complex mechatronic systems (such as autonomous rovers, robotic arms, and hexapods) by generating realistic Bill of Materials (BOM), 3D procedural representations, and detailed component specifications in real time.

Built to run entirely in the browser, the platform acts as a digital twin testbench, bridging the gap between hardware engineering and modern web technologies.

## 🚀 Key Features

- **Oscilloscope Interface**: A custom-built, hardware-accurate UI featuring animated waveform traces, BNC connectors, tactile knobs, and LED indicators.
- **Procedural 3D Rendering**: Integrated with `React Three Fiber` and `@react-three/rapier` to dynamically render hardware assemblies, PCB boards, sensors, and structural elements.
- **AI-Powered Generation Engine**: Uses the Vercel AI SDK to dynamically mock and refine complex part assemblies based on natural language inputs.
- **Parametric Hardware Catalog**: Automatically calculates weight, physical dimensions, material properties, and unit costs for generated assemblies.
- **Zero-Latency State Management**: Powered by `Zustand` to handle complex 3D scene states and real-time UI updates without re-renders.

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **3D Graphics & Physics**: [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei), & Rapier Physics
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) & Lucide React
- **AI Integration**: [@ai-sdk/react](https://www.npmjs.com/package/@ai-sdk/react) & OpenAI
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
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

## 🗺️ Roadmap & Future Development

See [`TODO.md`](./TODO.md) for a detailed breakdown of ongoing tasks and future roadmap items, including:
- Advanced procedural 3D components and Rapier physics integration.
- Dark mode refinements and CRT-glow styling.
- Integration of a live generative AI chatbot for real-time BOM adjustments.
- Multi-user authentication and project save states.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/manmit97/mechatronics-synth/issues).

## 📄 License

This project is licensed under the MIT License.
