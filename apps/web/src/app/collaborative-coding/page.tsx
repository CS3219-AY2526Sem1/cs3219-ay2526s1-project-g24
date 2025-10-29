'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { EDITOR_CONFIG, LAYOUT_DEFAULTS } from '@/lib/constants';

import type { editor } from 'monaco-editor';
import {
  CollaborationManager,
  ConnectionStatus,
  UserPresence,
  CollaborationErrorInfo,
} from '@/lib/collaboration/CollaborationManager';
import PresenceIndicator from '@/components/PresenceIndicator';
import ToastNotification, { Toast } from '@/components/ToastNotification';

import withAuth from '@/components/withAuth';
import { useAuth } from '@/hooks/useAuth';

const questions = [
  {
    title: 'Divide Two Integers',
    difficulty: 'MEDIUM',
    topics: ['Bit Manipulation', 'Math'],
    description: `Given two integers dividend and divisor, divide two integers without using multiplication, division, and mod operator.

The integer division should truncate toward zero, which means losing its fractional part. For example, 8.345 would be truncated to 8, and -2.7335 would be truncated to -2.

Return the quotient after dividing dividend by divisor.`,
    note: `Assume we are dealing with an environment that could only store integers within the 32-bit signed integer range: [-2³¹, 2³¹ − 1]. For this problem, if the quotient is strictly greater than 2³¹ - 1, then return 2³¹ - 1, and if the quotient is strictly less than -2³¹, then return -2³¹.`,
    examples: [
      {
        input: 'dividend = 10, divisor = 3',
        output: '3',
        explanation: '10/3 = 3.33333.. which is truncated to 3',
      },
      {
        input: 'dividend = 7, divisor = -3',
        output: '-2',
        explanation: '7/-3 = -2.33333.. which is truncated to -2.',
      },
    ],
    constraints: ['-2³¹ <= dividend, divisor <= 2³¹ - 1', 'divisor != 0'],
  },
];

function CollaborativeCodingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentQuestion] = useState(0);
  const [leftWidth, setLeftWidth] = useState<number>(LAYOUT_DEFAULTS.LEFT_PANEL_WIDTH_PERCENT);
  const [codeHeight, setCodeHeight] = useState<number>(LAYOUT_DEFAULTS.CODE_HEIGHT_PERCENT);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [activeTab, setActiveTab] = useState<'testResults' | 'customInput'>('testResults');
  const [selectedTestCase, setSelectedTestCase] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState(
    '# Write your solution here\n\nclass Solution:\n    def divide(self, dividend: int, divisor: int) -> int:\n        pass'
  );

  // Collaboration state
  const [sessionId, setSessionId] = useState('');
  const [sessionInputValue, setSessionInputValue] = useState('');
  const [userIdInputValue, setUserIdInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Collaboration manager and editor ref
  const collaborationManagerRef = useRef<CollaborationManager | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const question = questions[currentQuestion];

  // Toast notification helpers
  const addToast = (message: string, type: Toast['type'] = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleCollaborationError = (error: CollaborationErrorInfo) => {
    console.error('[Collaboration Error]', error);
    addToast(error.message, 'error', error.recoverable ? 5000 : 10000);
  };

  const languageConfig = {
    python: {
      language: 'python',
      defaultCode:
        '# Write your solution here\n\nclass Solution:\n    def divide(self, dividend: int, divisor: int) -> int:\n        pass',
    },
    javascript: {
      language: 'javascript',
      defaultCode:
        '// Write your solution here\n\n/**\n * @param {number} dividend\n * @param {number} divisor\n * @return {number}\n */\nvar divide = function(dividend, divisor) {\n    \n};',
    },
    java: {
      language: 'java',
      defaultCode:
        '// Write your solution here\n\nclass Solution {\n    public int divide(int dividend, int divisor) {\n        \n    }\n}',
    },
    cpp: {
      language: 'cpp',
      defaultCode:
        '// Write your solution here\n\nclass Solution {\npublic:\n    int divide(int dividend, int divisor) {\n        \n    }\n};',
    },
  };

  // Connect to collaboration session
  const connectToSession = async () => {
    if (!sessionInputValue.trim()) {
      addToast('Please enter a session ID', 'warning');
      return;
    }

    if (!userIdInputValue.trim()) {
      addToast('Please enter a user ID', 'warning');
      return;
    }

    if (!editorRef.current) {
      addToast('Editor not ready. Please try again.', 'warning');
      return;
    }

    const trimmedSessionId = sessionInputValue.trim();
    const trimmedUserId = userIdInputValue.trim();
    setSessionId(trimmedSessionId);
    setConnectionStatus('connecting');

    try {
      if (!collaborationManagerRef.current) {
        collaborationManagerRef.current = new CollaborationManager();
      }

      // Set up presence update callback
      collaborationManagerRef.current.onPresenceUpdate((users) => {
        setConnectedUsers(users);
      });

      // Set up error notification callback
      collaborationManagerRef.current.onErrorNotification(handleCollaborationError);

      await collaborationManagerRef.current.connect(
        trimmedSessionId,
        editorRef.current,
        (status) => {
          setConnectionStatus(status);
          setIsConnected(status === 'connected');

          if (status === 'connected') {
            addToast('Successfully connected to session', 'success', 3000);
          }
        },
        trimmedUserId
      );
    } catch (error) {
      console.error('[CollaborativeCoding] Failed to connect:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      addToast('Failed to connect to session. Please try again.', 'error');
    }
  };

  // Disconnect from collaboration session
  const disconnectFromSession = () => {
    console.log('[CollaborativeCoding] Disconnecting from session');

    if (collaborationManagerRef.current) {
      collaborationManagerRef.current.disconnect();
      collaborationManagerRef.current = null;
    }

    setSessionId('');
    setSessionInputValue('');
    setUserIdInputValue('');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectedUsers([]);

    // Reset code to default
    if (editorRef.current) {
      editorRef.current.setValue(languageConfig[selectedLanguage].defaultCode);
    }

    addToast('Disconnected from session', 'info', 3000);
    console.log('[CollaborativeCoding] Disconnected successfully');
  };

  // Handle editor mount
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (collaborationManagerRef.current) {
        collaborationManagerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingVertical && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - containerRect.left;
        const newWidthPercent = (offsetX / containerRect.width) * 100;
        setLeftWidth(
          Math.min(
            Math.max(newWidthPercent, LAYOUT_DEFAULTS.MIN_PANEL_WIDTH_PERCENT),
            LAYOUT_DEFAULTS.MAX_PANEL_WIDTH_PERCENT
          )
        );
      }

      if (isDraggingHorizontal && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const offsetY = e.clientY - panelRect.top;
        const newHeightPercent = (offsetY / panelRect.height) * 100;
        setCodeHeight(
          Math.min(
            Math.max(newHeightPercent, LAYOUT_DEFAULTS.MIN_PANEL_HEIGHT_PERCENT),
            LAYOUT_DEFAULTS.MAX_PANEL_HEIGHT_PERCENT
          )
        );
      }
    };

    const handleMouseUp = () => {
      setIsDraggingVertical(false);
      setIsDraggingHorizontal(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDraggingVertical || isDraggingHorizontal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingVertical, isDraggingHorizontal]);

  const handleTerminate = () => {
    router.push('/home');
  };

  return (
    <div className='h-screen bg-[#1e1e1e] flex flex-col font-montserrat'>
      <header className='bg-[#2e2e2e] px-6 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]'>
        <div className='flex items-center gap-6'>
          <h1 
            className='font-mclaren text-xl text-white cursor-pointer hover:opacity-80 transition-opacity'
            onClick={() => router.push('/home')}
          >
            PeerPrep
          </h1>
          <span className='text-gray-400 text-sm'>ID 22031001</span>

          {/* Session Connection UI */}
          <div className='flex items-center gap-2'>
            {!sessionId ? (
              <>
                <input
                  type='text'
                  value={userIdInputValue}
                  onChange={(e) => setUserIdInputValue(e.target.value)}
                  placeholder='User ID'
                  className='bg-[#1e1e1e] border border-[#3e3e3e] text-white text-sm px-3 py-1 rounded focus:outline-none focus:border-[#5e5e5e] w-32'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      connectToSession();
                    }
                  }}
                />
                <input
                  type='text'
                  value={sessionInputValue}
                  onChange={(e) => setSessionInputValue(e.target.value)}
                  placeholder='Session ID'
                  className='bg-[#1e1e1e] border border-[#3e3e3e] text-white text-sm px-3 py-1 rounded focus:outline-none focus:border-[#5e5e5e] w-40'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      connectToSession();
                    }
                  }}
                />
                <button
                  onClick={connectToSession}
                  className='px-3 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-medium transition-colors rounded'
                >
                  Connect
                </button>
              </>
            ) : (
              <>
                <span className='text-sm text-gray-400'>Session: {sessionId.substring(0, 12)}...</span>
                <div className='flex items-center gap-1'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-green-500'
                        : connectionStatus === 'connecting'
                          ? 'bg-yellow-500 animate-pulse'
                          : connectionStatus === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                    }`}
                  />
                  <span className='text-xs text-gray-400'>{connectionStatus}</span>
                </div>

                {/* Presence Indicator */}
                {isConnected && (
                  <PresenceIndicator
                    users={connectedUsers}
                    localClientId={collaborationManagerRef.current?.getLocalUser().clientId || null}
                  />
                )}

                <button
                  onClick={disconnectFromSession}
                  className='px-3 py-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors rounded'
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
        <span className='text-white text-sm'>{user?.display_name || 'User'} (you){connectedUsers.length > 0 && ` x ${connectedUsers.map(u => u.name).join(', ')}`}</span>
        <button
          onClick={handleTerminate}
          className='px-4 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors'
        >
          Terminate
        </button>
      </header>

      <div ref={containerRef} className='flex-1 flex overflow-hidden'>
        <div
          className='bg-[#252525] overflow-y-auto'
          style={{
            width: `${leftWidth}%`,
            pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto',
          }}
        >
          <div className='p-6'>
            <div className='mb-6'>
              <div className='flex items-center gap-3 mb-3'>
                <h2 className='text-2xl font-semibold text-white'>{question.title}</h2>
                <span className='text-xs px-3 py-1 rounded bg-[#854d0e] text-[#fbbf24] font-medium uppercase'>
                  {question.difficulty}
                </span>
              </div>
              <div className='flex gap-2'>
                {question.topics.map((topic) => (
                  <span key={topic} className='text-sm text-gray-400'>
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className='space-y-4 text-gray-300 text-sm leading-relaxed'>
              <p className='whitespace-pre-line'>{question.description}</p>

              {question.note && (
                <div>
                  <p className='font-semibold text-white mb-2'>Note:</p>
                  <p className='text-gray-400'>{question.note}</p>
                </div>
              )}

              {question.examples.map((example, idx) => (
                <div key={idx} className='bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e3e]'>
                  <p className='font-semibold text-white mb-2'>Example {idx + 1}:</p>
                  <div className='font-mono text-xs space-y-1'>
                    <p>
                      <span className='text-gray-500'>Input:</span>{' '}
                      <span className='text-gray-300'>{example.input}</span>
                    </p>
                    <p>
                      <span className='text-gray-500'>Output:</span>{' '}
                      <span className='text-gray-300'>{example.output}</span>
                    </p>
                    <p>
                      <span className='text-gray-500'>Explanation:</span>{' '}
                      <span className='text-gray-400'>{example.explanation}</span>
                    </p>
                  </div>
                </div>
              ))}

              <div>
                <p className='font-semibold text-white mb-2'>Constraints:</p>
                <ul className='list-disc list-inside text-gray-400 space-y-1 text-xs'>
                  {question.constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div
          className='w-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-col-resize transition-colors relative z-50'
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingVertical(true);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />

        <div
          ref={rightPanelRef}
          className='flex-1 flex flex-col bg-[#1e1e1e]'
          style={{
            pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto',
          }}
        >
          <div className='bg-[#1e1e1e] overflow-hidden' style={{ height: `${codeHeight}%` }}>
            <div className='h-full flex flex-col'>
              <div className='bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]'>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => {
                        const newLang = e.target.value as 'python' | 'javascript' | 'java' | 'cpp';
                        setSelectedLanguage(newLang);
                        setCode(languageConfig[newLang].defaultCode);
                      }}
                      className='bg-transparent border-2 border-white/20 rounded-full pl-4 pr-10 py-1.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors'
                    >
                      <option value='python' className='bg-[#2e2e2e] text-white'>
                        Python 3.8
                      </option>
                      <option value='javascript' className='bg-[#2e2e2e] text-white'>
                        JavaScript
                      </option>
                      <option value='java' className='bg-[#2e2e2e] text-white'>
                        Java
                      </option>
                      <option value='cpp' className='bg-[#2e2e2e] text-white'>
                        C++
                      </option>
                    </select>
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none'>
                      <svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
                        <path
                          d='M1 1L6 6L11 1'
                          stroke='#9e9e9e'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <button className='px-4 py-1.5 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors'>
                    Run Code
                  </button>
                  <button className='px-4 py-1.5 bg-profile-avatar hover:bg-profile-avatar-hover text-black text-sm font-medium transition-colors'>
                    Run Test
                  </button>
                </div>
              </div>

              <div className='flex-1 bg-[#1e1e1e] overflow-hidden'>
                <Editor
                  height='100%'
                  language={languageConfig[selectedLanguage].language}
                  value={code}
                  onChange={(value) => {
                    // Only update state if not connected (local editing)
                    if (!sessionId) {
                      setCode(value || '');
                    }
                  }}
                  onMount={handleEditorDidMount}
                  theme='vs-dark'
                  options={{
                    fontSize: EDITOR_CONFIG.FONT_SIZE,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: EDITOR_CONFIG.TAB_SIZE,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: EDITOR_CONFIG.LINE_DECORATIONS_WIDTH,
                    lineNumbersMinChars: EDITOR_CONFIG.LINE_NUMBERS_MIN_CHARS,
                    renderLineHighlight: 'line',
                    bracketPairColorization: {
                      enabled: true,
                    },
                    readOnly: false,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className='h-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-row-resize transition-colors relative z-50'
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingHorizontal(true);
              document.body.style.cursor = 'row-resize';
              document.body.style.userSelect = 'none';
            }}
          />

          <div className='flex-1 bg-[#252525] overflow-hidden flex flex-col'>
            <div className='bg-[#2e2e2e] px-4 flex items-center gap-1 border-b border-[#3e3e3e]'>
              <button
                onClick={() => setActiveTab('testResults')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'testResults' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Test Results
                {activeTab === 'testResults' && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white'></div>}
              </button>
              <button
                onClick={() => setActiveTab('customInput')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'customInput' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Custom Input
                {activeTab === 'customInput' && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white'></div>}
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-4'>
              {activeTab === 'testResults' ? (
                <div>
                  <div className='flex items-center gap-2 mb-4'>
                    <button
                      onClick={() => setSelectedTestCase(1)}
                      className={`flex items-center gap-1 ${selectedTestCase === 1 ? '' : 'opacity-50'}`}
                    >
                      <span className='w-5 h-5 flex items-center justify-center rounded-full bg-profile-avatar text-black text-xs font-bold'>
                        ✓
                      </span>
                      <span className='text-white text-sm font-medium ml-1'>Test 1</span>
                    </button>
                    <button
                      onClick={() => setSelectedTestCase(2)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                        selectedTestCase === 2
                          ? 'bg-[#3e3e3e] text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#2e2e2e]'
                      }`}
                    >
                      2
                    </button>
                  </div>

                  <div className='space-y-4'>
                    <div>
                      <label className='text-white block mb-2 text-sm font-medium'>Input (stdin)</label>
                      <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                        {selectedTestCase === 1 ? '2' : '10\n3'}
                      </div>
                    </div>
                    <div>
                      <label className='text-white block mb-2 text-sm font-medium'>Your Output (stdout)</label>
                      <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                        {selectedTestCase === 1 ? '1' : '3'}
                      </div>
                    </div>
                    <div>
                      <label className='text-white block mb-2 text-sm font-medium'>Expected Output</label>
                      <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                        {selectedTestCase === 1 ? '1' : '3'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <label className='text-white block mb-2 text-sm font-medium'>Custom Input</label>
                    <textarea
                      className='w-full bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300 resize-none focus:outline-none focus:border-[#5e5e5e] transition-colors'
                      rows={6}
                      placeholder='Enter your custom test input here...'
                    />
                  </div>
                  <div className='flex gap-2'>
                    <button className='px-4 py-2 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors'>
                      Run with Custom Input
                    </button>
                  </div>
                  <div>
                    <label className='text-white block mb-2 text-sm font-medium'>Output</label>
                    <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-500 min-h-[100px]'>
                      Output will appear here after running...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default withAuth(CollaborativeCodingPage);
