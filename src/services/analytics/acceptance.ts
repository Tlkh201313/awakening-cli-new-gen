export class AcceptanceTracker {
  private toolCalls: Map<string, { success: number; failure: number }> = new Map()
  private interruptionCount = 0

  recordToolUse(tool: string, success: boolean): void {
    const entry = this.toolCalls.get(tool) || { success: 0, failure: 0 }
    if (success) {
      entry.success++
    } else {
      entry.failure++
    }
    this.toolCalls.set(tool, entry)
  }

  recordInterruption(): void {
    this.interruptionCount++
  }

  getStats(): {
    totalCalls: number
    successRate: number
    interruptions: number
    byTool: Record<string, { success: number; failure: number }>
  } {
    let totalSuccess = 0
    let totalFailure = 0
    const byTool: Record<string, { success: number; failure: number }> = {}

    for (const [tool, stats] of this.toolCalls) {
      totalSuccess += stats.success
      totalFailure += stats.failure
      byTool[tool] = stats
    }

    const totalCalls = totalSuccess + totalFailure
    return {
      totalCalls,
      successRate: totalCalls > 0 ? totalSuccess / totalCalls : 0,
      interruptions: this.interruptionCount,
      byTool,
    }
  }

  reset(): void {
    this.toolCalls.clear()
    this.interruptionCount = 0
  }
}
