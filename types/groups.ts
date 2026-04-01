export interface PeerComparisonResult {
  userStrengths: string[];
  userGaps: string[];
  groupAverageSkills: string[];
  recommendation: string;
}

export interface GroupNotification {
  id: string;
  type: string;
  groupId: string;
  groupName: string;
  fromUserId: string;
  fromDisplayName?: string;
  status: string;
  createdAt: string;
}
