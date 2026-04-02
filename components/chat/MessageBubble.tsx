"use client";

import React, { useCallback, useState } from "react";
import { ChatMessage, ClientChatContinuation } from "@/types/chat";
import { KnowledgeBase } from "@/types/kb";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui";
import { ChatMarkdown } from "./ChatMarkdown";
import { DiffCard } from "./DiffCard";
import { InterviewPrepCard } from "./InterviewPrepCard";
import { SuggestedChips } from "./SuggestedChips";
import { InlineUpload } from "./InlineUpload";
import { ReasoningCard } from "./ReasoningCard";
import { JobFitCard } from "./JobFitCard";
import { GroupBulkMemberFlow } from "./GroupBulkMemberFlow";
import { PeerComparisonCard } from "./PeerComparisonCard";
import { PublicProfileShare } from "./PublicProfileShare";
import { JobSearchCards } from "@/components/jobs/JobSearchCards";
import { ResumeDiffCard } from "./ResumeDiffCard";

interface MessageBubbleProps {
  message: ChatMessage;
  onChipSelect: (text: string) => void;
  onConfirmKBUpdate: (messageId: string, section: string, patch: unknown, summary?: string) => void;
  onCancelKBUpdate: (messageId: string) => void;
  onUploadSuccess: (kb: KnowledgeBase) => void;
  onInviteToGroup: (groupId: string, targetUserId: string) => void;
  onSendContinuation: (continuation: ClientChatContinuation, displayMessage: string) => void;
  onBulkKbApplied?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function MessageBubble({
  message,
  onChipSelect,
  onConfirmKBUpdate,
  onCancelKBUpdate,
  onUploadSuccess,
  onInviteToGroup,
  onSendContinuation,
  onBulkKbApplied,
}: MessageBubbleProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isRoast = message.data?.isRoast;

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy", "error");
    }
  }, [message.content, toast]);

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 animate-slideUp">
        <div className="max-w-[75%] space-y-1">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-ink-faint">{formatTime(message.timestamp)}</span>
            <button
              type="button"
              onClick={() => void copyMessage()}
              className="text-[10px] font-medium text-sage hover:text-sage-dark border border-sage/30 rounded px-2 py-0.5 hover:bg-sage-light/60 transition-colors"
              title="Copy message text"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="px-3 py-2.5 rounded-md bg-sage text-white text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-slideUp">
      {/* Bot avatar */}
      <div className="w-6 h-6 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sage text-[10px] font-bold">F</span>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink">ResumeForge</span>
          <span className="text-[10px] font-mono text-ink-faint">{formatTime(message.timestamp)}</span>
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="text-[10px] font-medium text-sage hover:text-sage-dark border border-sage/30 rounded px-2 py-0.5 hover:bg-sage-light/60 transition-colors"
            title="Copy message text"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          {message.intent && message.intent !== 'chitchat' && (
            <span className="text-[9px] font-mono text-ink-faint bg-border/40 px-1.5 py-px rounded-sm hidden sm:inline">
              {message.intent}
            </span>
          )}
        </div>

        {/* Main bubble */}
        <div className={cn(
          "px-3 py-2.5 border rounded-md text-sm leading-relaxed max-w-[90%]",
          isRoast
            ? "bg-amber-50 border-amber-200 text-ink"
            : "bg-paper border-border text-ink"
        )}>
          {isRoast && (
            <p className="text-[10px] font-mono text-amber-600 uppercase tracking-wide mb-2">🔥 Resume Roast</p>
          )}
          <ChatMarkdown content={message.content} className="text-sm text-ink [&_a]:break-all" />
        </div>

        {/* Diff card (update_kb) */}
        {message.intent === 'update_kb' && message.data?.patch !== undefined && message.data?.diffStatus && (
          <DiffCard
            section={message.data.section ?? ''}
            currentSection={message.data.currentSection}
            patch={message.data.patch}
            summary={message.data.patchSummary ?? ''}
            status={message.data.diffStatus}
            onConfirm={() =>
              onConfirmKBUpdate(
                message.id,
                message.data!.section!,
                message.data!.patch,
                message.data!.patchSummary
              )
            }
            onCancel={() => onCancelKBUpdate(message.id)}
          />
        )}

        {/* Interview prep */}
        {message.intent === 'interview_prep' && message.data?.questions?.length && (
          <InterviewPrepCard questions={message.data.questions} />
        )}

        {/* Inline upload trigger */}
        {message.intent === 'upload_resume' && message.data?.showUpload && (
          <InlineUpload onSuccess={onUploadSuccess} />
        )}

        {message.intent === 'generate_resume' && message.data?.resumeDiff && message.data.resumeDiff.length > 0 && (
          <ResumeDiffCard rows={message.data.resumeDiff} />
        )}

        {message.intent === 'generate_resume' && message.data?.reasoning && (
          <ReasoningCard reasoning={message.data.reasoning} />
        )}

        {message.intent === 'job_fit' && message.data?.jobFit && (
          <JobFitCard fit={message.data.jobFit} />
        )}

        {message.data?.invitePick && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.data.invitePick.groups.map((g) => (
              <button
                key={g.groupId}
                type="button"
                onClick={() =>
                  onInviteToGroup(g.groupId, message.data!.invitePick!.targetUserId)
                }
                className="text-xs font-medium border border-sage/40 text-sage rounded px-2.5 py-1 hover:bg-sage-light"
              >
                Invite to {g.name}
              </button>
            ))}
          </div>
        )}

        {message.data?.adminGroupChoices && message.data.bulkDescription && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.data.adminGroupChoices.map((g) => (
                <button
                  key={g.groupId}
                  type="button"
                  onClick={() => {
                    const c: ClientChatContinuation = {
                      type: "group_update_pick",
                      groupId: g.groupId,
                      description: message.data!.bulkDescription!,
                      section: message.data!.bulkSection ?? "achievements",
                    };
                    onSendContinuation(c, `Bulk KB update — use group "${g.name}"`);
                  }}
                  className="text-xs font-medium border border-sage/40 text-sage rounded px-2.5 py-1 hover:bg-sage-light"
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

        {message.data?.peerComparePickGroup && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.data.peerComparePickGroup.groups.map((g) => (
              <button
                key={g.groupId}
                type="button"
                onClick={() => {
                  const c: ClientChatContinuation = {
                    type: "peer_compare_pick",
                    groupId: g.groupId,
                    targetRole: message.data!.peerComparePickGroup!.targetRole,
                  };
                  onSendContinuation(
                    c,
                    `Compare me to peers — group "${g.name}"`
                  );
                }}
                className="text-xs font-medium border border-sage/40 text-sage rounded px-2.5 py-1 hover:bg-sage-light"
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {message.intent === "group_update" && message.data?.groupBulk && (
          <GroupBulkMemberFlow
            bulk={message.data.groupBulk}
            onApplied={onBulkKbApplied}
          />
        )}

        {message.intent === "peer_compare" && message.data?.peerComparison && (
          <PeerComparisonCard result={message.data.peerComparison} />
        )}

        {message.intent === "share_profile" && message.data?.publicProfileUrl && (
          <PublicProfileShare url={message.data.publicProfileUrl} />
        )}

        {message.intent === "job_search" && message.data?.jobCards?.length ? (
          <JobSearchCards cards={message.data.jobCards} />
        ) : null}

        {/* Suggested chips — hide while KB diff is pending */}
        {message.data?.suggestions?.length ? (
          !(message.intent === 'update_kb' && message.data?.diffStatus === 'pending') && (
            <SuggestedChips
              chips={message.data.suggestions}
              onSelect={onChipSelect}
              compact
            />
          )
        ) : null}
      </div>
    </div>
  );
}
