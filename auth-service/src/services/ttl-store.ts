interface TimedEntry<T> {
  value: T
  expiresAt: number
}

export class TtlStore<T> {
  private readonly entries = new Map<string, TimedEntry<T>>()

  constructor(
    private readonly ttlSeconds: number,
    private readonly now: () => number = Date.now
  ) {}

  set(key: string, value: T): void {
    this.entries.set(key, {
      value,
      expiresAt: this.now() + this.ttlSeconds * 1000
    })
  }

  get(key: string): T | null {
    const entry = this.entries.get(key)
    if (!entry) {
      return null
    }

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key)
      return null
    }

    return entry.value
  }

  take(key: string): T | null {
    const value = this.get(key)
    this.entries.delete(key)
    return value
  }

  delete(key: string): void {
    this.entries.delete(key)
  }

  purgeExpired(): void {
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= this.now()) {
        this.entries.delete(key)
      }
    }
  }
}
