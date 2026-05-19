import { describe, it, expect } from 'bun:test'

describe('survey scheduler', () => {
  it('should export SurveyScheduler', async () => {
    const mod = await import('../../src/services/survey/scheduler.js')
    expect(mod.SurveyScheduler).toBeDefined()
  })

  it('should track turn count', async () => {
    const { SurveyScheduler } = await import('../../src/services/survey/scheduler.js')
    const scheduler = new SurveyScheduler({ interval: 5 })
    expect(scheduler.shouldShowSurvey()).toBe(false)
    scheduler.recordTurn()
    scheduler.recordTurn()
    scheduler.recordTurn()
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(false)
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(true)
  })

  it('should reset after survey shown', async () => {
    const { SurveyScheduler } = await import('../../src/services/survey/scheduler.js')
    const scheduler = new SurveyScheduler({ interval: 3 })
    scheduler.recordTurn()
    scheduler.recordTurn()
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(true)
    scheduler.markSurveyShown()
    expect(scheduler.shouldShowSurvey()).toBe(false)
    scheduler.recordTurn()
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(false)
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(true)
  })

  it('should not show if disabled', async () => {
    const { SurveyScheduler } = await import('../../src/services/survey/scheduler.js')
    const scheduler = new SurveyScheduler({ interval: 1, enabled: false })
    scheduler.recordTurn()
    expect(scheduler.shouldShowSurvey()).toBe(false)
  })
})

describe('SurveyPrompt', () => {
  it('should export SurveyPrompt component', async () => {
    const mod = await import('../../src/components/SurveyPrompt.js')
    expect(mod.SurveyPrompt).toBeDefined()
  })
})
