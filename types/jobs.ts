export interface JobSearchProfile {
  primaryRoles: string[];
  secondaryRoles: string[];
  keySkills: string[];
  seniorityLevel: string;
  preferredStack: string[];
  industryPreferences: string[];
  searchQueries: string[];
  weakSpots: string[];
  kbVersionAtInference: number;
  lastInferredAt: string;
}

export interface JobScoreResult {
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyThisRole: string;
  startupSignals: string;
  salaryFit: boolean;
  applyUrgency: "high" | "medium" | "low";
}

export interface ScoredJob {
  jobId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt?: string;
  salary?: string;
  applyUrl?: string;
  logoUrl?: string;
  isRemote?: boolean;
  companyDomain?: string;
  score: JobScoreResult;
}

export interface WeakSpotReport {
  topGaps: {
    skill: string;
    appearsInJobs: number;
    estimatedImpact: string;
    learningTimeEstimate: string;
  }[];
  summary: string;
  generatedAt: string;
  fromJobCount: number;
}

export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface ApplicationDoc {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  jdText: string;
  status: ApplicationStatus;
  fitScore: number;
  appliedDate?: string | null;
  applyUrl?: string | null;
  logoUrl?: string | null;
  resumeJson?: unknown;
  coverLetter?: string | null;
  atsScore?: number | null;
  notes?: string;
  nextAction?: string;
}
