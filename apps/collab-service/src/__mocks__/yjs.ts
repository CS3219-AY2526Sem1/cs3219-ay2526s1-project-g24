/**
 * Mock Yjs for testing
 */

export class MockYDoc {
  private texts = new Map<string, MockYText>();
  private maps = new Map<string, MockYMap>();
  private updateHandlers: Array<(update: Uint8Array, origin: any) => void> = [];

  getText(name: string): MockYText {
    if (!this.texts.has(name)) {
      this.texts.set(name, new MockYText());
    }
    return this.texts.get(name)!;
  }

  getMap(name: string): MockYMap {
    if (!this.maps.has(name)) {
      this.maps.set(name, new MockYMap());
    }
    return this.maps.get(name)!;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (event === 'update') {
      this.updateHandlers.push(handler);
    }
  }

  off(event: string, handler: (...args: any[]) => void): void {
    if (event === 'update') {
      const index = this.updateHandlers.indexOf(handler);
      if (index > -1) {
        this.updateHandlers.splice(index, 1);
      }
    }
  }

  destroy(): void {
    this.texts.clear();
    this.maps.clear();
    this.updateHandlers = [];
  }

  triggerUpdate(update: Uint8Array, origin?: any): void {
    this.updateHandlers.forEach(handler => handler(update, origin));
  }
}

export class MockYText {
  private content = '';

  toString(): string {
    return this.content;
  }

  insert(index: number, text: string): void {
    this.content = this.content.slice(0, index) + text + this.content.slice(index);
  }

  delete(index: number, length: number): void {
    this.content = this.content.slice(0, index) + this.content.slice(index + length);
  }

  _setContent(content: string): void {
    this.content = content;
  }
}

export class MockYMap {
  private data = new Map<string, any>();

  get(key: string): any {
    return this.data.get(key);
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  get size(): number {
    return this.data.size;
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    this.data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

export class MockAwareness {
  destroy(): void {}
  getStates(): Map<number, any> {
    return new Map();
  }
  getLocalState(): any {
    return null;
  }
  setLocalState(_state: any): void {}
}

// Mock Y module
export const MockY = {
  Doc: MockYDoc,
  applyUpdate: jest.fn(),
  encodeStateAsUpdate: jest.fn(() => new Uint8Array([1, 2, 3, 4])),
};

// Mock y-protocols/awareness
export const MockYProtocols = {
  Awareness: MockAwareness,
};
