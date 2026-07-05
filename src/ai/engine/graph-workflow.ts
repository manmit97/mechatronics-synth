import { StateGraph, END } from '@langchain/langgraph';
import { GraphState, GraphStateData } from './graph-state';
import { supervisorNode, evaluatorNode } from './graph-nodes';

// Determine next step after evaluation
function shouldContinue(state: GraphStateData) {
  if (state.feedback) {
    // If evaluator provided feedback (e.g., budget exceeded), loop back to supervisor
    return 'supervisor';
  }
  // Otherwise, we are done
  return END;
}

// Build the workflow graph
const workflow = new StateGraph(GraphState)
  .addNode('supervisor', supervisorNode)
  .addNode('evaluator', evaluatorNode)
  .addEdge('supervisor', 'evaluator')
  .addConditionalEdges('evaluator', shouldContinue, {
    supervisor: 'supervisor',
    [END]: END,
  })
  .addEdge('__start__', 'supervisor');

export const appGraph = workflow.compile();
