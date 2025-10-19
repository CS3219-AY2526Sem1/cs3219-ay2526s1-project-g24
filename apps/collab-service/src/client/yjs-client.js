// Yjs Client Bundle - Standalone version
// This file bundles Yjs for browser use

import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

// Export to window for browser use
window.YjsClient = {
  Y,
  encoding,
  decoding,
  syncProtocol,
  awarenessProtocol,
  MESSAGE_SYNC: 0,
  MESSAGE_AWARENESS: 1
};

console.log('Yjs Client loaded successfully!');
