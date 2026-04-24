import { IntakeFormView } from "../../IntakeFormView";
import type { Id } from "../../../../convex/_generated/dataModel";

export default async function IntakePageForEpisode({
  params,
}: {
  params: Promise<{ inviteCode: string; episodeId: string }>;
}) {
  const { inviteCode, episodeId } = await params;
  return (
    <IntakeFormView
      inviteCode={inviteCode}
      episodeId={episodeId as Id<"episodes">}
    />
  );
}
