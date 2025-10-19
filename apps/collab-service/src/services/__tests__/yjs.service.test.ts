import { YjsService } from '../yjs.service';
import * as Y from 'yjs';

describe('YjsService', () => {
  beforeEach(() => {
    // Clear all documents before each test
    YjsService.clearAll();
  });

  afterAll(() => {
    // Stop garbage collection and clear all documents
    YjsService.stopGarbageCollection();
    YjsService.clearAll();
  });

  describe('getDocument', () => {
    it('should create a new Y.Doc for a session', () => {
      const sessionId = 'test-session-1';
      const yjsDoc = YjsService.getDocument(sessionId);

      expect(yjsDoc).toBeDefined();
      expect(yjsDoc.doc).toBeInstanceOf(Y.Doc);
      expect(yjsDoc.awareness).toBeDefined();
      expect(typeof yjsDoc.lastActivity).toBe('number');
      expect(yjsDoc.connectedClients).toBeInstanceOf(Set);
      expect(yjsDoc.connectedClients.size).toBe(0);
    });

    it('should return existing Y.Doc for the same session', () => {
      const sessionId = 'test-session-2';
      const doc1 = YjsService.getDocument(sessionId);
      const doc2 = YjsService.getDocument(sessionId);

      expect(doc1).toBe(doc2); // Same reference
      expect(doc1.doc).toBe(doc2.doc);
    });

    it('should apply initial state when provided', () => {
      const sessionId = 'test-session-3';
      
      // Create a document with some content
      const sourceDoc = new Y.Doc();
      const sourceText = sourceDoc.getText('code');
      sourceText.insert(0, 'console.log("Hello World");');
      const initialState = Y.encodeStateAsUpdate(sourceDoc);

      // Get document with initial state
      YjsService.getDocument(sessionId, initialState);
      const code = YjsService.getCode(sessionId);

      expect(code).toBe('console.log("Hello World");');
    });

    it('should initialize metadata map with defaults', () => {
      const sessionId = 'test-session-4';
      YjsService.getDocument(sessionId);
      
      const metadata = YjsService.getMetadata(sessionId);
      expect(metadata).toBeDefined();
      expect(metadata.language).toBe('python');
      expect(typeof metadata.createdAt).toBe('number');
    });
  });

  describe('hasDocument', () => {
    it('should return true for existing document', () => {
      const sessionId = 'test-session-5';
      YjsService.getDocument(sessionId);

      expect(YjsService.hasDocument(sessionId)).toBe(true);
    });

    it('should return false for non-existing document', () => {
      expect(YjsService.hasDocument('non-existent')).toBe(false);
    });
  });

  describe('client management', () => {
    it('should add clients to a session', () => {
      const sessionId = 'test-session-6';
      YjsService.getDocument(sessionId);

      YjsService.addClient(sessionId, 'user-1');
      expect(YjsService.getClientCount(sessionId)).toBe(1);

      YjsService.addClient(sessionId, 'user-2');
      expect(YjsService.getClientCount(sessionId)).toBe(2);
    });

    it('should not add duplicate clients', () => {
      const sessionId = 'test-session-7';
      YjsService.getDocument(sessionId);

      YjsService.addClient(sessionId, 'user-1');
      YjsService.addClient(sessionId, 'user-1'); // Duplicate

      expect(YjsService.getClientCount(sessionId)).toBe(1);
    });

    it('should remove clients from a session', () => {
      const sessionId = 'test-session-8';
      YjsService.getDocument(sessionId);

      YjsService.addClient(sessionId, 'user-1');
      YjsService.addClient(sessionId, 'user-2');
      expect(YjsService.getClientCount(sessionId)).toBe(2);

      YjsService.removeClient(sessionId, 'user-1');
      expect(YjsService.getClientCount(sessionId)).toBe(1);
    });

    it('should return 0 for client count of non-existing session', () => {
      expect(YjsService.getClientCount('non-existent')).toBe(0);
    });
  });

  describe('content retrieval', () => {
    it('should get code content from Y.Doc', () => {
      const sessionId = 'test-session-9';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const text = yjsDoc.doc.getText('code');
      text.insert(0, 'const x = 10;');

      const code = YjsService.getCode(sessionId);
      expect(code).toBe('const x = 10;');
    });

    it('should get metadata from Y.Doc', () => {
      const sessionId = 'test-session-10';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const metadata = yjsDoc.doc.getMap('metadata');
      metadata.set('language', 'javascript');
      metadata.set('theme', 'dark');

      const retrievedMetadata = YjsService.getMetadata(sessionId);
      expect(retrievedMetadata.language).toBe('javascript');
      expect(retrievedMetadata.theme).toBe('dark');
      expect(typeof retrievedMetadata.createdAt).toBe('number'); // Default value
    });

    it('should get Y.Doc state as Uint8Array', () => {
      const sessionId = 'test-session-11';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const text = yjsDoc.doc.getText('code');
      text.insert(0, 'test content');

      const state = YjsService.getState(sessionId);
      expect(state).toBeInstanceOf(Uint8Array);
      expect(state!.length).toBeGreaterThan(0);
    });

    it('should return null for non-existing document state', () => {
      const state = YjsService.getState('non-existent');
      expect(state).toBeNull();
    });
  });

  describe('activity tracking', () => {
    it('should update lastActivity timestamp', async () => {
      const sessionId = 'test-session-12';
      const yjsDoc = YjsService.getDocument(sessionId);
      const initialActivity = yjsDoc.lastActivity;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      YjsService.updateActivity(sessionId);
      const updatedActivity = YjsService.getDocumentIfExists(sessionId)?.lastActivity;

      expect(updatedActivity).toBeDefined();
      expect(updatedActivity!).toBeGreaterThan(initialActivity);
    });

    it('should not throw when updating non-existing document', () => {
      expect(() => YjsService.updateActivity('non-existent')).not.toThrow();
    });
  });

  describe('document deletion', () => {
    it('should delete a document and remove from cache', () => {
      const sessionId = 'test-session-13';
      YjsService.getDocument(sessionId);
      expect(YjsService.hasDocument(sessionId)).toBe(true);

      YjsService.deleteDocument(sessionId);
      expect(YjsService.hasDocument(sessionId)).toBe(false);
    });

    it('should destroy awareness and Y.Doc on deletion', () => {
      const sessionId = 'test-session-14';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const destroySpy = jest.spyOn(yjsDoc.awareness, 'destroy');
      const docDestroySpy = jest.spyOn(yjsDoc.doc, 'destroy');

      YjsService.deleteDocument(sessionId);

      expect(destroySpy).toHaveBeenCalled();
      expect(docDestroySpy).toHaveBeenCalled();
    });

    it('should not throw when deleting non-existing document', () => {
      expect(() => YjsService.deleteDocument('non-existent')).not.toThrow();
    });
  });

  describe('garbage collection', () => {
    jest.setTimeout(15000); // Increase timeout for GC tests

    it('should remove inactive documents with no clients', async () => {
      const sessionId = 'test-session-15';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      // Manually set lastActivity to past (>5 minutes ago)
      yjsDoc.lastActivity = Date.now() - 6 * 60 * 1000;

      // Ensure no clients connected
      expect(yjsDoc.connectedClients.size).toBe(0);

      // Run garbage collection manually
      YjsService.collectGarbage();

      expect(YjsService.hasDocument(sessionId)).toBe(false);
    });

    it('should not remove inactive documents with connected clients', async () => {
      const sessionId = 'test-session-16';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      // Add a client
      YjsService.addClient(sessionId, 'user-1');

      // Set lastActivity to past
      yjsDoc.lastActivity = Date.now() - 6 * 60 * 1000;

      // Run garbage collection manually
      YjsService.collectGarbage();

      // Should still exist because client is connected
      expect(YjsService.hasDocument(sessionId)).toBe(true);
    });

    it('should not remove recently active documents', async () => {
      const sessionId = 'test-session-17';
      YjsService.getDocument(sessionId);

      // Run garbage collection immediately
      YjsService.collectGarbage();

      // Should still exist because it's recent
      expect(YjsService.hasDocument(sessionId)).toBe(true);
    });

    it('should start and stop garbage collection', () => {
      YjsService.startGarbageCollection();
      // Should not throw
      YjsService.stopGarbageCollection();
      // Should not throw when stopping twice
      YjsService.stopGarbageCollection();
    });
  });

  describe('validateSize', () => {
    it('should return true for small documents', () => {
      const sessionId = 'test-session-18';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const text = yjsDoc.doc.getText('code');
      text.insert(0, 'small content');

      const isValid = YjsService.validateSize(sessionId);
      expect(isValid).toBe(true);
    });

    it('should return false for documents exceeding max size', () => {
      const sessionId = 'test-session-19';
      const yjsDoc = YjsService.getDocument(sessionId);
      
      const text = yjsDoc.doc.getText('code');
      // Create content larger than 1MB
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      text.insert(0, largeContent);

      const isValid = YjsService.validateSize(sessionId);
      expect(isValid).toBe(false);
    });
  });

  describe('stats', () => {
    it('should return accurate statistics', () => {
      const sessionId1 = 'test-session-20';
      const sessionId2 = 'test-session-21';

      YjsService.getDocument(sessionId1);
      YjsService.getDocument(sessionId2);

      YjsService.addClient(sessionId1, 'user-1');
      YjsService.addClient(sessionId1, 'user-2');
      YjsService.addClient(sessionId2, 'user-3');

      const stats = YjsService.getStats();

      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalClients).toBe(3);
      expect(stats.documents).toHaveLength(2);
      
      const doc1Stats = stats.documents.find(d => d.sessionId === sessionId1);
      expect(doc1Stats?.clients).toBe(2);
      expect(doc1Stats?.inactiveMs).toBeLessThan(1000);
    });

    it('should return empty stats when no documents exist', () => {
      const stats = YjsService.getStats();

      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalClients).toBe(0);
      expect(stats.documents).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should remove all documents from cache', () => {
      YjsService.getDocument('session-1');
      YjsService.getDocument('session-2');
      YjsService.getDocument('session-3');

      expect(YjsService.getStats().totalDocuments).toBe(3);

      YjsService.clearAll();

      expect(YjsService.getStats().totalDocuments).toBe(0);
    });
  });
});
