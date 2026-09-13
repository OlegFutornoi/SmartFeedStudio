/**
 * In-memory keyed mutex to serialize concurrent team operations per organization.
 * Guarantees zero race conditions during parallel member invitations and acceptances.
 */
class OrganizationMutex {
  private readonly locks = new Map<string, Promise<void>>();

  async runExclusive<T>(organizationId: string, fn: () => Promise<T>): Promise<T> {
    const currentLock = this.locks.get(organizationId) || Promise.resolve();
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(
      organizationId,
      currentLock.then(() => nextLock),
    );

    try {
      await currentLock;
      return await fn();
    } finally {
      release!();
      if (this.locks.get(organizationId) === nextLock) {
        this.locks.delete(organizationId);
      }
    }
  }
}

export const organizationMutex = new OrganizationMutex();
