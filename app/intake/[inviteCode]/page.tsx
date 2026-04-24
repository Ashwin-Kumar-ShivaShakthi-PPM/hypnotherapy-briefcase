import { IntakeFormView } from "../IntakeFormView";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <IntakeFormView inviteCode={inviteCode} />;
}
