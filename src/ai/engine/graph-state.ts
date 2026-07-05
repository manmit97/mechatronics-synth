import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import type { PartDefinition } from '@/types/parts';
import type { RequirementsSpec } from '@/types/project';
import type { ServicePillar } from '@/types/pillar';

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  catalog: Annotation<PartDefinition[]>({
    reducer: (left, right) => right,
    default: () => [],
  }),
  requirements: Annotation<RequirementsSpec | null>({
    reducer: (left, right) => right,
    default: () => null,
  }),
  feedback: Annotation<string | null>({
    reducer: (left, right) => right,
    default: () => null,
  }),
  currentPage: Annotation<string>({
    reducer: (left, right) => right,
    default: () => 'landing',
  }),
  selectedPartId: Annotation<string | null>({
    reducer: (left, right) => right,
    default: () => null,
  }),
  pillar: Annotation<ServicePillar | null>({
    reducer: (left, right) => right,
    default: () => null,
  }),
});

export type GraphStateData = typeof GraphState.State;
