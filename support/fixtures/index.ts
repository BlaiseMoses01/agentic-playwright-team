/**
 * Test data builder pattern and fixture lifecycle management.
 * The Test Data Architect agent extends this with domain-specific builders.
 */

export interface TestDataBuilder<T> {
  /** Set a field value, returning the builder for chaining. */
  with<K extends keyof T>(field: K, value: T[K]): this;
  /** Build the data object with defaults merged with overrides. */
  build(): T;
}

export interface FixtureLifecycle {
  /** Create the fixture (e.g. insert into DB or call API). */
  setup(): Promise<void>;
  /** Remove the fixture (e.g. delete from DB or call API). */
  teardown(): Promise<void>;
}

/**
 * Manages setup and teardown of test fixtures across a scenario.
 *
 * Usage in a Before/After hook or step definition:
 *   const fixtures = new FixtureManager();
 *   fixtures.register({ setup: () => createUser(), teardown: () => deleteUser() });
 *   await fixtures.setupAll();
 *   // ... run test ...
 *   await fixtures.teardownAll();
 */
export class FixtureManager {
  private fixtures: FixtureLifecycle[] = [];

  /** Register a fixture for lifecycle management. */
  register(fixture: FixtureLifecycle): void {
    this.fixtures.push(fixture);
  }

  /** Run setup on all registered fixtures in order. */
  async setupAll(): Promise<void> {
    for (const fixture of this.fixtures) {
      await fixture.setup();
    }
  }

  /** Run teardown on all registered fixtures in reverse order. */
  async teardownAll(): Promise<void> {
    const reversed = [...this.fixtures].reverse();
    for (const fixture of reversed) {
      await fixture.teardown();
    }
    this.fixtures = [];
  }
}

/**
 * Create a data builder with defaults.
 *
 * Example:
 *   const userBuilder = createBuilder<User>({ name: "Test", email: "test@example.com" });
 *   const user = userBuilder().with("name", "Custom Name").build();
 */
export function createBuilder<T extends Record<string, unknown>>(
  defaults: T,
): () => TestDataBuilder<T> {
  return () => {
    const overrides: Partial<T> = {};
    const builder: TestDataBuilder<T> = {
      with<K extends keyof T>(field: K, value: T[K]) {
        overrides[field] = value;
        return this;
      },
      build(): T {
        return { ...defaults, ...overrides };
      },
    };
    return builder;
  };
}
