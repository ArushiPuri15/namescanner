import type { ProbeId, ProbeResult, ScanRequest } from "@namescanner/contracts";
import type { CandidateName } from "@namescanner/domain";

export type ScanContext = {
  request: ScanRequest;
  timeoutMs: number;
};

export interface AvailabilityProbe {
  readonly id: ProbeId;
  supports(context: ScanContext): boolean;
  check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult>;
}
