'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { EDITOR_CONFIG, LAYOUT_DEFAULTS } from '@/lib/constants';
import { removeExamplesFromDescription } from '@/lib/utils';
import { getDifficultyStyles } from '@/lib/difficulty';

import type { editor } from 'monaco-editor';
import {
  CollaborationManager,
  ConnectionStatus,
  UserPresence,
  CollaborationErrorInfo,
  CollaborationMessage,
} from '@/lib/collaboration/CollaborationManager';
import PresenceIndicator from '@/components/PresenceIndicator';
import ToastNotification, { Toast } from '@/components/ToastNotification';

import withAuth from '@/components/withAuth';
import {
  getQuestionById,
  runCode,
  submitSolution,
  type QuestionDetail,
  type TestCaseResult,
} from '@/lib/api/questionService';

function CollaborativeCodingPage() {
  const router = useRouter();

  // Log initial state on page load
  console.log('🚀 Collaborative Coding Page loaded');
  console.log('📦 Initial sessionStorage state:', {
    sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null,
    questionId: typeof window !== 'undefined' ? sessionStorage.getItem('questionId') : null,
  });

  // layout
  const [leftWidth, setLeftWidth] = useState<number>(LAYOUT_DEFAULTS.LEFT_PANEL_WIDTH_PERCENT);
  const [codeHeight, setCodeHeight] = useState<number>(LAYOUT_DEFAULTS.CODE_HEIGHT_PERCENT);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [activeTab, setActiveTab] = useState<'testResults' | 'customInput'>('testResults');
  const [selectedTestCase, setSelectedTestCase] = useState(0);

  // language/code
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState('');

  // collab
  const [sessionId, setSessionId] = useState('');
  const [sessionInputValue, setSessionInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFromMatchFlow, setIsFromMatchFlow] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // question + run/submit state
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLock, setExecutionLock] = useState<{ clientId: number; userName: string } | null>(null);

  // refs
  const collaborationManagerRef = useRef<CollaborationManager | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // fallback language templates (when question has no template for that lang)
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

  // toast helpers
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

  // Handle collaboration messages (code execution events)
  const handleCollaborationMessage = (message: CollaborationMessage) => {
    const senderUser = connectedUsers.find((u) => u.clientId === message.sender);
    const senderName = senderUser?.name || 'Another user';

    if (message.type === 'code-execution-start') {
      console.log(`[CodeExecution] ${senderName} started running code`);
      setExecutionLock({ clientId: message.sender, userName: senderName });
      setIsRunning(true);
      addToast(`${senderName} is running the code...`, 'info', 3000);
    } else if (message.type === 'code-execution-result') {
      console.log('[CodeExecution] Received execution results from', senderName);
      setExecutionLock(null);
      setIsRunning(false);

      const { success, results, error, action } = message.data;

      if (success) {
        if (action === 'submit') {
          const { status, passed_test_cases, total_test_cases } = message.data;
          if (status === 'accepted') {
            addToast(`✅ All ${total_test_cases} test cases passed!`, 'success', 4000);
            setTestResults([]);
            setExecutionError(null);
          } else {
            addToast(
              `❌ ${passed_test_cases}/${total_test_cases} test cases passed\nStatus: ${status}`,
              'warning',
              6000
            );
            setTestResults([]);
            setExecutionError(`Status: ${status}`);
          }
        } else {
          setTestResults(results || []);
          setExecutionError(null);
          setActiveTab('testResults');
        }
      } else {
        setExecutionError(error || 'Code execution failed');
        setTestResults([]);
      }
    }
  };

  // -------------- QUESTION FETCH + SEED --------------
  const fetchAndSetQuestion = async (qid: number, lang: 'python' | 'javascript' | 'java' | 'cpp') => {
    try {
      setIsLoadingQuestion(true);
      setQuestionError(null);
      const data = await getQuestionById(qid);
      setQuestion(data);

      // seed editor if empty
      const template = data.code_templates?.[lang];
      if (template && editorRef.current) {
        const currentVal = editorRef.current.getValue();
        if (!currentVal || currentVal.trim() === '') {
          editorRef.current.setValue(template);
          setCode(template);
        }
      }
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // -------------- CONNECT TO SESSION --------------
  const connectToSession = async (autoSessionId?: string) => {
    const targetSessionId = autoSessionId || sessionInputValue.trim();

    console.log('🔌 Attempting to connect to session:', {
      autoSessionId,
      sessionInputValue,
      targetSessionId,
    });

    if (!targetSessionId) {
      console.warn('❌ No session ID provided');
      addToast('Please enter a session ID', 'warning');
      return;
    }

    if (!editorRef.current) {
      console.warn('❌ Editor not ready');
      addToast('Editor not ready. Please try again.', 'warning');
      return;
    }

    console.log('✅ Connecting to session ID:', targetSessionId);
    setSessionId(targetSessionId);
    setConnectionStatus('connecting');

    try {
      if (!collaborationManagerRef.current) {
        collaborationManagerRef.current = new CollaborationManager();
      }

      collaborationManagerRef.current.onPresenceUpdate((users) => {
        setConnectedUsers(users);
      });

      collaborationManagerRef.current.onErrorNotification(handleCollaborationError);

      // Listen for code execution messages from other users
      collaborationManagerRef.current.onMessage((message: CollaborationMessage) => {
        console.log('[CodeExecution] Received message:', message);
        handleCollaborationMessage(message);
      });

      // connect
      await collaborationManagerRef.current.connect(
        targetSessionId,
        editorRef.current,
        async (status /*, meta?: any */) => {
          setConnectionStatus(status);
          setIsConnected(status === 'connected');

          if (status === 'connected') {
            console.log('🎉 Successfully connected to session:', targetSessionId);
            addToast('Successfully connected to session', 'success', 3000);

            // try to get questionId from somewhere
            // 1) from sessionStorage (simple)
            const storedQid = sessionStorage.getItem('questionId');
            console.log('📚 Checking for question ID:', storedQid);
            if (storedQid) {
              console.log('✅ Found question ID, fetching question:', storedQid);
              await fetchAndSetQuestion(Number(storedQid), selectedLanguage);
            } else {
              console.warn('⚠️ No question ID found in sessionStorage');
            }
            // 2) if your collab server returns metadata, use meta.questionId here
          }
        }
      );
    } catch (error) {
      console.error('[CollaborativeCoding] Failed to connect:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      addToast('Failed to connect to session. Please try again.', 'error');
    }
  };

  // -------------- DISCONNECT --------------
  const disconnectFromSession = () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect from this session? Your partner will continue to be in the session.'
    );
    if (!confirmed) return;

    console.log('🔌 Disconnecting from session');

    if (collaborationManagerRef.current) {
      try {
        collaborationManagerRef.current.disconnect();
      } catch (e) {
        console.warn('[Collaboration] error destroying provider', e);
      } finally {
        collaborationManagerRef.current = null;
      }
    }

    setSessionId('');
    setSessionInputValue('');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectedUsers([]);
    setIsFromMatchFlow(false);

    // Clean up session storage
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('questionId');
    console.log('🗑️ Cleared session ID and question ID from sessionStorage');

    // reset editor to a local template
    if (editorRef.current) {
      const fallback = languageConfig[selectedLanguage].defaultCode;
      editorRef.current.setValue(fallback);
      setCode(fallback);
    }

    addToast('Disconnected from session', 'info', 3000);
  };

  // -------------- EDITOR MOUNT --------------
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    setIsEditorReady(true);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (collaborationManagerRef.current) {
        collaborationManagerRef.current.disconnect();
        collaborationManagerRef.current = null;
      }
    };
  }, []);

  // unload / visibility
  // cleanup on unmount + gentle unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // only try to disconnect if we actually have a manager and we are connected
      if (collaborationManagerRef.current) {
        try {
          collaborationManagerRef.current.disconnect();
        } catch (e) {
          console.warn('[Collaboration] error during beforeunload disconnect', e);
        } finally {
          collaborationManagerRef.current = null;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // React unmount
      if (collaborationManagerRef.current) {
        try {
          collaborationManagerRef.current.disconnect();
        } catch (e) {
          console.warn('[Collaboration] error during unmount disconnect', e);
        } finally {
          collaborationManagerRef.current = null;
        }
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // auto-connect from match flow
  useEffect(() => {
    console.log('🔍 Checking for stored session ID...');
    const storedSessionId = sessionStorage.getItem('sessionId');
    console.log('📦 Retrieved from sessionStorage:', {
      sessionId: storedSessionId,
      isEditorReady: isEditorReady,
    });

    if (storedSessionId && isEditorReady && !sessionId) {
      console.log('✅ Found session ID and editor is ready. Auto-connecting to session:', storedSessionId);
      setIsFromMatchFlow(true);
      connectToSession(storedSessionId);
      // Don't remove session ID yet - keep it for the duration of the session
      console.log('📌 Session ID kept in sessionStorage for the duration of the session');
    } else if (storedSessionId && !isEditorReady) {
      console.log('⏳ Found session ID but editor not ready. Will connect once ready.');
      setIsFromMatchFlow(true);
      setSessionInputValue(storedSessionId);
    } else if (!storedSessionId) {
      console.log('ℹ️ No stored session ID found. User needs to manually enter session ID.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorReady]);

  // -------------- DRAG HANDLERS --------------
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

  // -------------- RUN / SUBMIT --------------
  const handleRunCode = async () => {
    if (!question || !editorRef.current) return;

    // Check if someone else is running code
    if (executionLock && executionLock.clientId !== collaborationManagerRef.current?.getLocalUser().clientId) {
      addToast(`${executionLock.userName} is already running code. Please wait...`, 'warning', 3000);
      return;
    }

    console.log('[CodeExecution] Starting code execution (run)');
    const localUser = collaborationManagerRef.current?.getLocalUser();

    // Broadcast execution start
    if (isConnected && collaborationManagerRef.current) {
      setExecutionLock({
        clientId: localUser?.clientId ?? 0,
        userName: localUser?.name ?? 'You',
      });
      collaborationManagerRef.current.sendMessage('code-execution-start', {
        action: 'run',
      });
    }

    setIsRunning(true);
    setExecutionError(null);
    setActiveTab('testResults');

    try {
      const codeToRun = editorRef.current.getValue();
      const resp = await runCode(question.id, {
        language: selectedLanguage,
        code: codeToRun,
      });
      setTestResults(resp.results);

      // Broadcast results
      if (isConnected && collaborationManagerRef.current) {
        collaborationManagerRef.current.sendMessage('code-execution-result', {
          action: 'run',
          success: true,
          results: resp.results,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run code';
      setExecutionError(errorMessage);
      setTestResults([]);

      // Broadcast error
      if (isConnected && collaborationManagerRef.current) {
        collaborationManagerRef.current.sendMessage('code-execution-result', {
          action: 'run',
          success: false,
          error: errorMessage,
        });
      }
    } finally {
      setIsRunning(false);
      setExecutionLock(null);
    }
  };

  const handleSubmitCode = async () => {
    if (!question || !editorRef.current) return;

    // Check if someone else is running code
    if (executionLock && executionLock.clientId !== collaborationManagerRef.current?.getLocalUser().clientId) {
      addToast(`${executionLock.userName} is already running code. Please wait...`, 'warning', 3000);
      return;
    }

    console.log('[CodeExecution] Starting code execution (submit)');
    const localUser = collaborationManagerRef.current?.getLocalUser();

    // Broadcast execution start
    if (isConnected && collaborationManagerRef.current) {
      setExecutionLock({
        clientId: localUser?.clientId ?? 0,
        userName: localUser?.name ?? 'You',
      });
      collaborationManagerRef.current.sendMessage('code-execution-start', {
        action: 'submit',
      });
    }

    setIsRunning(true);
    setExecutionError(null);
    setActiveTab('testResults');

    try {
      const codeToSubmit = editorRef.current.getValue();
      const resp = await submitSolution(question.id, {
        language: selectedLanguage,
        code: codeToSubmit,
      });

      if (resp.status === 'accepted') {
        addToast(`✅ All ${resp.total_test_cases} test cases passed!`, 'success', 4000);
        setTestResults([]);
        setExecutionError(null);
      } else {
        addToast(
          `❌ ${resp.passed_test_cases}/${resp.total_test_cases} test cases passed\nStatus: ${resp.status}`,
          'warning',
          6000
        );
        setTestResults([]);
        setExecutionError(`Status: ${resp.status}`);
      }

      // Broadcast results
      if (isConnected && collaborationManagerRef.current) {
        collaborationManagerRef.current.sendMessage('code-execution-result', {
          action: 'submit',
          success: true,
          status: resp.status,
          passed_test_cases: resp.passed_test_cases,
          total_test_cases: resp.total_test_cases,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit code';
      setExecutionError(errorMessage);
      setTestResults([]);

      // Broadcast error
      if (isConnected && collaborationManagerRef.current) {
        collaborationManagerRef.current.sendMessage('code-execution-result', {
          action: 'submit',
          success: false,
          error: errorMessage,
        });
      }
    } finally {
      setIsRunning(false);
      setExecutionLock(null);
    }
  };

  // -------------- TERMINATE --------------
  const handleTerminate = () => {
    if (isConnected) {
      const confirmed = window.confirm(
        'Are you sure you want to terminate this session? You will be disconnected from the collaborative coding session.'
      );
      if (!confirmed) return;
    }

    console.log('🛑 Terminating session');

    if (collaborationManagerRef.current) {
      collaborationManagerRef.current.disconnect();
      collaborationManagerRef.current = null;
    }

    setSessionId('');
    setSessionInputValue('');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectedUsers([]);
    setIsFromMatchFlow(false);

    // Clean up session storage
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('questionId');
    sessionStorage.removeItem('matchRequestId');
    sessionStorage.removeItem('matchUserId');
    console.log('🗑️ Cleared all session data from sessionStorage');

    router.push('/home');
  };

  return (
    <div className='h-screen bg-[#1e1e1e] flex flex-col font-montserrat'>
      {/* HEADER */}
      <header className='bg-[#2e2e2e] px-6 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]'>
        <div className='flex items-center gap-6'>
          <h1 className='font-mclaren text-xl text-white'>PeerPrep</h1>
          <span className='text-gray-400 text-sm'>Collaborative Coding</span>

          {/* Session controls */}
          <div className='flex items-center gap-2'>
            {!sessionId ? (
              <>
                {isFromMatchFlow ? (
                  <span className='text-sm text-blue-400 animate-pulse'>Connecting to matched session...</span>
                ) : (
                  <>
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
                      onClick={() => connectToSession()}
                      className='px-3 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-medium transition-colors rounded'
                    >
                      Connect
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <span className='text-sm text-gray-400'>Session: {sessionId}</span>
                <div className='flex items-center gap-1'>
                  <div
                    className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                      ? 'bg-[#F1FCAC]'
                      : connectionStatus === 'connecting'
                        ? 'bg-yellow-500 animate-pulse'
                        : connectionStatus === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                  />
                  <span className='text-xs text-gray-400'>{connectionStatus}</span>
                </div>

                {/* presence */}
                {isConnected && (
                  <PresenceIndicator
                    users={connectedUsers}
                    localClientId={collaborationManagerRef.current?.getLocalUser().clientId || null}
                  />
                )}

                <button
                  onClick={disconnectFromSession}
                  className='px-3 py-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors'
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleTerminate}
          className='px-4 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors'
        >
          Terminate
        </button>
      </header>

      {/* MAIN */}
      <div ref={containerRef} className='flex-1 flex overflow-hidden'>
        {/* LEFT: QUESTION */}
        <div
          className='bg-[#252525] overflow-y-auto'
          style={{
            width: `${leftWidth}%`,
            pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto',
          }}
        >
          <div className='p-6'>
            {isLoadingQuestion ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-white'>Loading question...</div>
              </div>
            ) : questionError ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-red-500'>{questionError}</div>
              </div>
            ) : question ? (
              <>
                <div className='mb-6'>
                  <div className='flex items-center gap-3 mb-3'>
                    <h2 className='text-2xl font-semibold text-white'>{question.title}</h2>
                    <span className={getDifficultyStyles(question.difficulty)}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className='flex gap-2 flex-wrap'>
                    {question.topics.map((topic) => (
                      <span key={topic.id ?? topic.name} className='text-sm text-gray-400'>
                        {topic.name ?? topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='space-y-4 text-gray-300 text-sm leading-relaxed'>
                  <p className='whitespace-pre-line'>{removeExamplesFromDescription(question.description)}</p>

                  {question.sample_test_cases?.map((ex, idx) => (
                    <div key={idx} className='bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e3e]'>
                      <p className='font-semibold text-white mb-2'>Example {idx + 1}:</p>
                      <div className='font-mono text-xs space-y-1'>
                        <p>
                          <span className='text-gray-500'>Input:</span>{' '}
                          <span className='text-gray-300'>{JSON.stringify(ex.input_data)}</span>
                        </p>
                        <p>
                          <span className='text-gray-500'>Output:</span>{' '}
                          <span className='text-gray-300'>{JSON.stringify(ex.expected_output)}</span>
                        </p>
                        {ex.explanation && (
                          <p>
                            <span className='text-gray-500'>Explanation:</span>{' '}
                            <span className='text-gray-400'>{ex.explanation}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='text-gray-400 text-sm'>Connect to a session that provides a question.</div>
            )}
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div
          className='w-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-col-resize transition-colors relative z-50'
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingVertical(true);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />

        {/* RIGHT: EDITOR + TESTS */}
        <div
          ref={rightPanelRef}
          className='flex-1 flex flex-col bg-[#1e1e1e]'
          style={{
            pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto',
          }}
        >
          {/* EDITOR */}
          <div className='bg-[#1e1e1e] overflow-hidden' style={{ height: `${codeHeight}%` }}>
            <div className='h-full flex flex-col'>
              {/* editor header */}
              <div className='bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]'>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => {
                        const newLang = e.target.value as 'python' | 'javascript' | 'java' | 'cpp';
                        setSelectedLanguage(newLang);

                        // prefer question template
                        if (question && question.code_templates && question.code_templates[newLang]) {
                          const tmpl = question.code_templates[newLang];
                          setCode(tmpl);

                          // only force-set when not shared OR doc empty
                          if (editorRef.current && (!sessionId || editorRef.current.getValue().trim() === '')) {
                            editorRef.current.setValue(tmpl);
                          }
                        } else {
                          const fallback = languageConfig[newLang].defaultCode;
                          setCode(fallback);
                          if (editorRef.current && (!sessionId || editorRef.current.getValue().trim() === '')) {
                            editorRef.current.setValue(fallback);
                          }
                        }
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
                <div className='flex gap-2 items-center'>
                  {executionLock &&
                    executionLock.clientId !== collaborationManagerRef.current?.getLocalUser().clientId && (
                      <span className='text-xs text-yellow-400 animate-pulse'>
                        {executionLock.userName} is running code...
                      </span>
                    )}
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || !question}
                    className='px-4 py-1.5 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                  <button
                    onClick={handleSubmitCode}
                    disabled={isRunning || !question}
                    className='px-4 py-1.5 bg-profile-avatar hover:bg-profile-avatar-hover text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isRunning ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>

              {/* editor body */}
              <div className='flex-1 bg-[#1e1e1e] overflow-hidden'>
                <Editor
                  height='100%'
                  language={
                    question && question.code_templates && question.code_templates[selectedLanguage]
                      ? selectedLanguage
                      : languageConfig[selectedLanguage].language
                  }
                  value={code}
                  onChange={(value) => {
                    // if not connected, local edit
                    if (!sessionId) {
                      setCode(value || '');
                    }
                    // if connected, collab manager will push changes
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
                  }}
                />
              </div>
            </div>
          </div>

          {/* HORIZONTAL RESIZER */}
          <div
            className='h-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-row-resize transition-colors relative z-50'
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingHorizontal(true);
              document.body.style.cursor = 'row-resize';
              document.body.style.userSelect = 'none';
            }}
          />

          {/* BOTTOM PANEL */}
          <div className='flex-1 bg-[#252525] overflow-hidden flex flex-col'>
            {/* tabs */}
            <div className='bg-[#2e2e2e] px-4 flex items-center gap-1 border-b border-[#3e3e3e]'>
              <button
                onClick={() => setActiveTab('testResults')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'testResults' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                Test Results
                {activeTab === 'testResults' && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white' />}
              </button>
              <button
                onClick={() => setActiveTab('customInput')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'customInput' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                Custom Input
                {activeTab === 'customInput' && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white' />}
              </button>
            </div>

            {/* tab content */}
            <div className='flex-1 overflow-y-auto p-4'>
              {activeTab === 'testResults' ? (
                <div>
                  {executionError && (
                    <div className='mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm'>
                      {executionError}
                    </div>
                  )}

                  {testResults.length === 0 ? (
                    <div className='text-gray-400 text-center py-8'>Run your code to see test results</div>
                  ) : (
                    <>
                      <div className='flex items-center gap-2 mb-4 flex-wrap'>
                        {testResults.map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTestCase(idx)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${selectedTestCase === idx ? 'bg-[#3e3e3e]' : 'bg-[#2e2e2e] hover:bg-[#3a3a3a]'
                              }`}
                          >
                            <span
                              className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${result.passed ? 'bg-[#F1FCAC] text-black' : 'bg-red-500 text-white'
                                }`}
                            >
                              {result.passed ? '✓' : '✗'}
                            </span>
                            <span className='text-white text-sm font-medium ml-1'>Test {idx + 1}</span>
                          </button>
                        ))}
                      </div>

                      {testResults[selectedTestCase] && (
                        <div className='space-y-4'>
                          <div>
                            <label className='text-white block mb-2 text-sm font-medium'>Result</label>
                            <div
                              className={`p-3 rounded font-medium text-sm ${testResults[selectedTestCase].passed
                                ? 'bg-[#F1FCAC]/10 border border-[#F1FCAC] text-[#F1FCAC]'
                                : 'bg-red-900/20 border border-red-500 text-red-300'
                                }`}
                            >
                              {testResults[selectedTestCase].passed ? '✓ Passed' : '✗ Failed'}
                            </div>
                          </div>

                          <div>
                            <label className='text-white block mb-2 text-sm font-medium'>Input</label>
                            <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                              {JSON.stringify(testResults[selectedTestCase].input_data, null, 2)}
                            </div>
                          </div>

                          <div>
                            <label className='text-white block mb-2 text-sm font-medium'>Your Output</label>
                            <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                              {testResults[selectedTestCase].actual_output !== null
                                ? JSON.stringify(testResults[selectedTestCase].actual_output, null, 2)
                                : 'No output'}
                            </div>
                          </div>

                          <div>
                            <label className='text-white block mb-2 text-sm font-medium'>Expected Output</label>
                            <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                              {JSON.stringify(testResults[selectedTestCase].expected_output, null, 2)}
                            </div>
                          </div>

                          {testResults[selectedTestCase].error && (
                            <div>
                              <label className='text-white block mb-2 text-sm font-medium'>Error</label>
                              <div className='bg-[#1e1e1e] border border-red-500 p-3 rounded font-mono text-sm text-red-300'>
                                {testResults[selectedTestCase].error}
                              </div>
                            </div>
                          )}

                          {(testResults[selectedTestCase].runtime_ms !== null ||
                            testResults[selectedTestCase].memory_mb !== null) && (
                              <div className='grid grid-cols-2 gap-4'>
                                {testResults[selectedTestCase].runtime_ms !== null && (
                                  <div>
                                    <label className='text-white block mb-2 text-sm font-medium'>Runtime</label>
                                    <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                                      {testResults[selectedTestCase].runtime_ms?.toFixed(2)} ms
                                    </div>
                                  </div>
                                )}
                                {testResults[selectedTestCase].memory_mb !== null && (
                                  <div>
                                    <label className='text-white block mb-2 text-sm font-medium'>Memory</label>
                                    <div className='bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300'>
                                      {testResults[selectedTestCase].memory_mb?.toFixed(2)} MB
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </>
                  )}
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

      {/* TOASTS */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default withAuth(CollaborativeCodingPage);
