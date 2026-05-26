const SIZES = [1024, 4096, 16384, 65536]
const MAX_PER_SIZE = 50

const pools = new Map<number, ArrayBuffer[]>()

function getPool(size: number): ArrayBuffer[] {
  let pool = pools.get(size)
  if (!pool) {
    pool = []
    pools.set(size, pool)
  }
  return pool
}

function findSize(minSize: number): number {
  for (const size of SIZES) {
    if (size >= minSize) return size
  }
  return minSize
}

export function acquireBuffer(minSize: number): ArrayBuffer {
  const poolSize = findSize(minSize)
  const pool = getPool(poolSize)
  const buf = pool.pop()
  if (buf) return buf
  return new ArrayBuffer(poolSize)
}

export function releaseBuffer(buffer: ArrayBuffer): void {
  const poolSize = buffer.byteLength
  if (!SIZES.includes(poolSize)) return
  const pool = getPool(poolSize)
  if (pool.length < MAX_PER_SIZE) {
    pool.push(buffer)
  }
}

export function prewarmBuffers(): void {
  for (const size of SIZES) {
    const pool = getPool(size)
    for (let i = 0; i < 10 && i < MAX_PER_SIZE; i++) {
      pool.push(new ArrayBuffer(size))
    }
  }
}

export function bufferPoolStats() {
  const stats: Record<number, number> = {}
  for (const size of SIZES) {
    stats[size] = getPool(size).length
  }
  return stats
}
