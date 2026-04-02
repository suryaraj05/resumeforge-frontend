import type { RefinedResume, ATSScoreResult, JobFitResult, RefinedResumeReasoning } from "./resume";
import type { PeerComparisonResult } from "./groups";
import type { WeakSpotReport } from "./jobs";

export type ChatRole = 'user' | 'bot';

export type ChatIntent =
  | 'update_kb'
  | 'ask_kb'
  | 'generate_resume'
  | 'upload_resume'
  | 'group_create'
  | 'group_add_member'
  | 'group_update'
  | 'peer_compare'
  | 'share_profile'
  | 'ats_check'
  | 'cover_letter'
  | 'job_fit'
  | 'roast_resume'
  | 'interview_prep'
  | 'job_search'
  | 'job_prepare'
  | 'tracker_query'
  | 'interview_train'
  | 'weak_spots'
  | 'chitchat';

export type ClientChatContinuation =
  | {
      type: "group_update_pick";
      groupId: string;
      description: string;
      section: string;
    }
  | {
      type: "peer_compare_pick";
      groupId: string;
      targetRole: string;
    };

export interface InterviewQuestion {
  /** Primary question text (chat flow). */
  q?: string;
  /** Alias from REST interview-prep API. */
  question?: string;
  hint: string;
  /** First-person suggested answer from KB / JD-aware prep. */
  answer?: string;
  /** e.g. Technical, Behavioral, Situational */
  type?: string;
}

export interface ChatMessageData {
  section?: string;
  patch?: unknown;
  patchSummary?: string;
  currentSection?: unknown;
  diffStatus?: 'pending' | 'confirmed' | 'cancelled' | 'error';
  questions?: InterviewQuestion[];
  suggestions?: string[];
  showUpload?: boolean;
  isRoast?: boolean;
  refinedResume?: RefinedResume;
  reasoning?: RefinedResumeReasoning;
  atsScore?: ATSScoreResult;
  jd?: string;
  coverLetterText?: string;
  jobFit?: JobFitResult;
  groupId?: string;
  groupName?: string;
  invitePick?: {
    targetUserId: string;
    groups: { groupId: string; name: string }[];
  };
  adminGroupChoices?: { groupId: string; name: string }[];
  bulkDescription?: string;
  bulkSection?: string;
  groupBulk?: {
    phase: "pick_members" | "preview";
    groupId: string;
    groupName: string;
    description: string;
    section: string;
    members: { userId: string; label: string }[];
    patches?: {
      userId: string;
      displayLabel: string;
      section: string;
      patch: unknown;
      currentSection: unknown;
      summary: string;
    }[];
  };
  peerComparePickGroup?: {
    targetRole: string;
    groups: { groupId: string; name: string }[];
  };
  peerComparison?: PeerComparisonResult;
  publicProfileUrl?: string;
  /** Server: generate_resume but JD too short — UI should explain paste JD */
  awaitingJobDescription?: boolean;
  jobCards?: {
    jobId: string;
    title: string;
    company: string;
    fitScore: number;
    location: string;
    whyThisRole: string;
  }[];
  applicationStats?: {
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    interviewRate: number;
  };
  weakSpotReport?: WeakSpotReport;
  interviewSessionId?: string;
  interviewSessionUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  intent?: ChatIntent;
  timestamp: Date;
  data?: ChatMessageData;
}

export interface StoredChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  intent?: ChatIntent;
  timestamp: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
