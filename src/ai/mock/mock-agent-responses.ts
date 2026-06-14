// ─── Mock Agent Responses ───────────────────────────────────────────────────
// Simulates multi-turn LLM conversation for development without API keys.

import { generatePartsForProject, detectProjectType } from './mock-parts-generator';
import type { PartDefinition } from '@/types/parts';
import type { RequirementsSpec } from '@/types/project';

export interface MockResponse {
  content: string;
  parts?: PartDefinition[];
  requirements?: RequirementsSpec;
  isGenerating?: boolean;
  isComplete?: boolean;
}

const GREETING = `Welcome to **MechatronicsSynth** 🤖

I'm your AI design companion. I'll help you go from idea to a fully engineered mechatronic system — complete with 3D models, bill of materials, assembly instructions, and simulation.

**Tell me about your project.** What kind of mechatronic system are you building? What problem should it solve?

_Examples: "I want a small rover that navigates rough terrain", "I need a robotic arm that picks and sorts objects", "Design a walking hexapod robot"_`;

function generateNarrowingQuestions(type: string): string {
  const questions: Record<string, string> = {
    rover: `Great concept! A mobile rover platform — I can work with that. Let me narrow down the specs:

🔧 **A few quick questions:**

1. **Terrain** — Indoor smooth floors, outdoor pavement, or rough/uneven terrain?
2. **Payload** — Does it need to carry anything? If so, approximately how heavy?
3. **Sensing** — What should it detect? Obstacles, objects, environment mapping?
4. **Budget range** — Rough estimate: under $100, $100-200, or $200+?
5. **Size constraints** — Any limits on dimensions or weight?

Answer as many as you'd like — I can fill in sensible defaults for the rest.`,

    arm: `A robotic manipulator — excellent! Let me dial in the requirements:

🔧 **Key design questions:**

1. **Degrees of freedom** — How many axes of movement? (3-DOF is typical for pick-place, 6-DOF for complex manipulation)
2. **Payload** — Maximum weight it needs to lift?
3. **Reach** — How far should it reach from the base?
4. **Precision** — Does it need sub-millimeter accuracy, or is ±2mm acceptable?
5. **End effector** — Gripper, suction, magnetic, or custom tool?

Let me know your priorities and I'll generate the design.`,

    hexapod: `A multi-legged walker — love the ambition! Let's define the parameters:

🔧 **Design questions:**

1. **Leg count** — 4 (quadruped), 6 (hexapod), or more?
2. **Gait type** — Tripod gait (fast) or wave gait (stable)?
3. **Terrain** — Flat surfaces or uneven/rocky terrain?
4. **Size** — Tabletop demo or full-size field robot?
5. **Autonomy** — Remote controlled, semi-autonomous, or fully autonomous?

Share what you're thinking and I'll architect the system.`,

    generic: `Interesting project! Let me understand the requirements better:

🔧 **Tell me more about:**

1. **Primary function** — What should this system DO?
2. **Movement** — Does it need to move? Wheels, legs, arms, or stationary?
3. **Sensing** — What does it need to detect or measure?
4. **Environment** — Indoor, outdoor, or both?
5. **Budget** — Approximate budget range?

The more detail you provide, the better I can engineer the solution.`,
  };
  return questions[type] || questions.generic;
}

function generateDesignAnnouncement(projectName: string, partCount: number, totalCost: number): string {
  return `## 🎉 Your Design is Ready!

**${projectName}** has been generated with **${partCount} components**.

### Quick Summary
- **Estimated Cost**: $${totalCost.toFixed(2)}
- **Components**: ${partCount} parts across mechanical, electrical, and structural categories
- **Manufacturing**: Mix of 3D printed custom parts and off-the-shelf sourced components

### What's Included
✅ Full 3D model with realistic proportions
✅ Bill of Materials with sourcing links
✅ Assembly instructions
✅ Build timeline estimate

**→ Click "Open Configurator" below to view and customize your design in 3D.**

I'll stay here to help you refine the design. You can ask me to:
- Swap components for alternatives
- Adjust dimensions or materials
- Add sensors or actuators
- Optimize for cost or performance`;
}

export function getMockGreeting(): string {
  return GREETING;
}

export function getMockResponse(
  userMessage: string,
  turnCount: number
): MockResponse {
  const projectType = detectProjectType(userMessage);

  // Turn 1: narrowing questions
  if (turnCount <= 1) {
    return {
      content: generateNarrowingQuestions(projectType),
    };
  }

  // Turn 2+: generate the design
  const result = generatePartsForProject(userMessage);
  const totalCost = result.parts.reduce((sum, p) => sum + p.unitCost, 0);

  const requirements: RequirementsSpec = {
    projectName: result.projectName,
    projectType: result.template,
    description: result.projectDescription,
    mobility: {
      type: result.template === 'arm' ? 'stationary' : 'wheeled',
      terrain: 'outdoor_rough',
    },
    sensing: { types: ['ultrasonic', 'encoder'] },
    control: { controller: 'esp32', communication: ['wifi'] },
    power: { type: 'lipo', voltageV: 11.1, capacityMah: 2200 },
    constraints: { budgetUsd: 200, environment: 'outdoor' },
  };

  return {
    content: generateDesignAnnouncement(result.projectName, result.parts.length, totalCost),
    parts: result.parts,
    requirements,
    isGenerating: true,
    isComplete: true,
  };
}
