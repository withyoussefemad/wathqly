export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", probability: 20 },
  { id: "contacted", label: "Contacted", probability: 30 },
  { id: "qualified", label: "Qualified", probability: 50 },
  { id: "demo", label: "Demo", probability: 65 },
  { id: "evaluation", label: "Evaluation", probability: 80 },
  { id: "proposal", label: "Proposal", probability: 90 },
  { id: "won", label: "Won", probability: 100 },
  { id: "lost", label: "Lost", probability: 0 },
] as const;