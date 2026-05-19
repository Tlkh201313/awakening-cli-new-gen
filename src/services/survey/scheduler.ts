export interface SurveySchedulerOptions {
  interval?: number
  enabled?: boolean
}

export class SurveyScheduler {
  private turnCount = 0
  private interval: number
  private enabled: boolean

  constructor(options: SurveySchedulerOptions = {}) {
    this.interval = options.interval || 10
    this.enabled = options.enabled !== false
  }

  recordTurn(): void {
    this.turnCount++
  }

  shouldShowSurvey(): boolean {
    if (!this.enabled) return false
    return this.turnCount > 0 && this.turnCount % this.interval === 0
  }

  markSurveyShown(): void {
    this.turnCount = 0
  }

  getTurnCount(): number {
    return this.turnCount
  }
}
