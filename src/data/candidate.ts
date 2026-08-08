import { Candidate, getCandidate, getCandidates } from "./loaders";

// Export the types under both names for complete compatibility
export type { Candidate } from "./loaders";
export type CandidateProfile = Candidate;

export { getCandidate, getCandidates };
