import { BaseError, ContractFunctionRevertedError } from "viem";
import { UsageError } from "./chains.ts";

const HINTS: Record<string, string> = {
  NotUploader: "the signer is not the gate's uploader key",
  NotMaintainer: "the signer is not one of the three maintainers",
  AlreadyMaintainer: "that address is already a maintainer",
  NotEnoughApprovals: "chunks can only be uploaded after 2 maintainers approved the manifest",
  BadProof: "this chunk is not part of the approved manifest (rebuild the manifest from the same build output)",
  WrongManifest: "the manifest root or chunk count does not match the proposal",
  ChunkAlreadyWritten: "this chunk is already on chain",
  Incomplete: "not every chunk of the release has been uploaded",
  AlreadySealed: "this release is sealed; propose a new release instead",
  NotSealed: "seal the release before activating it",
  ReleaseCancelled: "this release was cancelled by a maintainer",
  AlreadyLive: "a live release cannot be cancelled; activate a newer one instead",
  NotNewer: "only a release newer than the live one can be activated",
  PolicyRejected: "the policy circuit said no (check approvals, timelock and freeze with `hashfront status`)",
  BadPath: "invalid file path",
  BadSlot: "maintainer slot must be 0, 1 or 2",
  ZeroValue: "a required value was zero",
  SiteGone: "this gate migrated its site to a new holder",
  UnknownRelease: "no release with that id",
};

/** Turns any thrown value into a one-line, human-readable message. */
export function describeError(err: unknown): string {
  if (err instanceof UsageError) return err.message;
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError && revert.data?.errorName) {
      const { errorName, args } = revert.data;
      const detail = args && args.length > 0 ? `(${args.map(String).join(", ")})` : "";
      const hint = HINTS[errorName];
      return `contract reverted with ${errorName}${detail}${hint ? `: ${hint}` : ""}`;
    }
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : String(err);
}
