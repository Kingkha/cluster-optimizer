export function calculatePriorityScore(node: {
  centrality: number;
  supportValue: number;
  opportunity: number;
  ease: number;
  serpClarity: number;
}): number {
  return Math.round(
    node.centrality * 0.3 +
    node.supportValue * 0.25 +
    node.opportunity * 0.2 +
    node.ease * 0.1 +
    node.serpClarity * 0.15
  );
}
