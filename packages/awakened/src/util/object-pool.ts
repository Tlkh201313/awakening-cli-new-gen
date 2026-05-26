export interface Poolable {
  reset(): void
}

export class ObjectPool<T extends Poolable> {
  private available: T[] = []
  private inUse = new Set<T>()
  private factory: () => T
  private maxSize: number
  private hits = 0
  private misses = 0

  constructor(factory: () => T, maxSize = 200) {
    this.factory = factory
    this.maxSize = maxSize
  }

  acquire(): T {
    const obj = this.available.pop()
    if (obj) {
      this.hits++
      this.inUse.add(obj)
      return obj
    }
    this.misses++
    const created = this.factory()
    this.inUse.add(created)
    return created
  }

  release(obj: T): void {
    if (!this.inUse.has(obj)) return
    this.inUse.delete(obj)
    obj.reset()
    if (this.available.length < this.maxSize) {
      this.available.push(obj)
    }
  }

  prewarm(count: number): void {
    for (let i = 0; i < count && i < this.maxSize; i++) {
      const obj = this.factory()
      obj.reset()
      this.available.push(obj)
    }
  }

  get stats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
    }
  }

  clear(): void {
    this.available.length = 0
    this.inUse.clear()
  }
}
