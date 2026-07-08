import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import type { PartDefinition } from '@/types/parts';
import type { RequirementsSpec } from '@/types/project';
import type { ServicePillar } from '@/types/pillar';
import type { VersionSummary } from '@/types/design-history';

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
  versionHistory: Annotation<VersionSummary[]>({
    reducer: (left, right) => right,
    default: () => [],
  }),
  currentDesignVersion: Annotation<number>({
    reducer: (left, right) => right,
    default: () => 0,
  }),
});

export type GraphStateData = typeof GraphState.State;

