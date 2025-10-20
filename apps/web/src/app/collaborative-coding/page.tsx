'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { EDITOR_CONFIG, LAYOUT_DEFAULTS } from '@/lib/constants';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { editor } from 'monaco-editor';

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

// Hardcoded test values
const HARDCODED_USER_ID = '123e4567-e89b-12d3-a456-426614174001';
const HARDCODED_TOKEN = '123e4567-e89b-12d3-a456-426614174001';
const COLLAB_SERVICE_URL = 'ws://localhost:3003';

export default function CollaborativeCodingPage() {
  const router = useRouter();
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );

  // Yjs and collaboration refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const question = questions[currentQuestion];

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
  const connectToSession = () => {
    if (!sessionInputValue.trim()) {
      alert('Please enter a session ID');
      return;
    }

    setSessionId(sessionInputValue.trim());
    setConnectionStatus('connecting');
  };

  // Disconnect from collaboration session
  const disconnectFromSession = () => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    setSessionId('');
    setSessionInputValue('');
    setIsConnected(false);
    setConnectionStatus('disconnected');

    // Reset code to default
    setCode(languageConfig[selectedLanguage].defaultCode);
  };

  // Handle editor mount
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  // Set up Yjs collaboration when sessionId changes
  useEffect(() => {
    if (!sessionId || !editorRef.current) return;

    try {
      // Create Yjs document
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      // Create WebSocket provider
      const wsUrl = `${COLLAB_SERVICE_URL}/v1/ws/sessions/${sessionId}?token=${HARDCODED_TOKEN}`;
      const provider = new WebsocketProvider(wsUrl, sessionId, ydoc);
      providerRef.current = provider;

      // Set up connection status listeners
      provider.on('status', (event: { status: string }) => {
        console.log('WebSocket status:', event.status);
        if (event.status === 'connected') {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else if (event.status === 'disconnected') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      });

      provider.on('connection-error', (error: Error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      });

      // Get or create a shared text type
      const ytext = ydoc.getText('monaco');

      // Create Monaco binding
      const binding = new MonacoBinding(
        ytext,
        editorRef.current.getModel()!,
        new Set([editorRef.current]),
        provider.awareness
      );
      bindingRef.current = binding;

      console.log('🔗 Connected to collaboration session:', sessionId);
    } catch (error) {
      console.error('Error setting up collaboration:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }

    // Cleanup on unmount or sessionId change
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, [sessionId]);

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
          <h1 className='font-mclaren text-xl text-white'>PeerPrep</h1>
          <span className='text-gray-400 text-sm'>ID 22031001</span>

          {/* Session Connection UI */}
          <div className='flex items-center gap-2'>
            {!sessionId ? (
              <>
                <input
                  type='text'
                  value={sessionInputValue}
                  onChange={(e) => setSessionInputValue(e.target.value)}
                  placeholder='Enter Session ID'
                  className='bg-[#1e1e1e] border border-[#3e3e3e] text-white text-sm px-3 py-1 rounded focus:outline-none focus:border-[#5e5e5e]'
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
        <span className='text-white text-sm'>Cliff Hänger (you) x Xiao Ming</span>
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
    </div>
  );
}
