import type { ProbeResult } from "@namescanner/contracts";
import type { CandidateName } from "@namescanner/domain";
import type { AvailabilityProbe, ScanContext } from "../ports/availability-probe.js";

function probeErrorResult(
  probe: AvailabilityProbe,
  message: string,
  latencyMs: number,
): ProbeResult {
  return {
    probe: probe.id,
    provider: probe.id,
    status: "error",
    confidence: 0,
    evidence: {},
    checkedAt: new Date().toISOString(),
    latencyMs,
    error: message,
  };
}

/**
 * Runs a probe with a hard timeout. Used in production so slow providers
 * cannot block the entire scan.
 */
export async function runProbeWithTimeout(
  probe: AvailabilityProbe,
  candidate: CandidateName,
  context: ScanContext,
): Promise<ProbeResult> {
  const startedAt = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutMs = context.timeoutMs;

  try {
    const result = await Promise.race([
      probe.check(candidate, context),
      new Promise<ProbeResult>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Probe timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);

    return {
      ...result,
      latencyMs: result.latencyMs > 0 ? result.latencyMs : Date.now() - startedAt,
    };
  } catch (error) {
    return probeErrorResult(
      probe,
      error instanceof Error ? error.message : "Probe failed",
      Date.now() - startedAt,
    );
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
