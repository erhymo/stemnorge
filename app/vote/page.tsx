import VoteClient from "@/components/VoteClient";
import { getCurrentIssueView } from "@/lib/issues";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const currentIssue = await getCurrentIssueView();

  return <VoteClient issue={currentIssue} />;
}
