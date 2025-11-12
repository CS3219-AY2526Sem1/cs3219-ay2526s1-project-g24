'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { EDITOR_CONFIG, LAYOUT_DEFAULTS } from '@/lib/constants';
import { removeExamplesFromDescription } from '@/lib/utils';
import DifficultyTag from '@/components/DifficultyTag';
import MarkdownContent from '@/components/MarkdownContent';

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
import { collaborationService } from '@/lib/api/collaborationService';
import {
  getQuestionById,
  runCode,
  submitSolution,
  type QuestionDetail,
  type TestCaseResult,
} from '@/lib/api/questionService';
import {
  clearActiveSession,
  getActiveQuestionId,
  getActiveSessionFromLocalStorage,
  getActiveSessionId,
  hydrateSessionStorageFromLocal,
  persistActiveSession,
} from '@/components/session/activeSession';

const PARTNER_JOIN_WARNING_MS = 10000; // Delay before we show the "partner missing" toast
const SOLO_WARNING_MS = 240000; // Frontend warning window before backend solo timeout kicks in

function CollaborativeCodingPage() {
  const router = useRouter();

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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFromMatchFlow, setIsFromMatchFlow] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [partnerPresent, setPartnerPresent] = useState<boolean>(false);
  const [waitingForPartner, setWaitingForPartner] = useState<boolean>(false);
  const partnerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const soloWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track delayed solo warning toast
  const connectedUsersRef = useRef<UserPresence[]>([]); // Store live presence to avoid stale closure reads
  const soloWarningShownRef = useRef<boolean>(false); // Guard against duplicate solo warnings
  const partnerWaitArmedRef = useRef<boolean>(false); // Tracks whether the 10s reminder is armed for the current solo span

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
  const lastProcessedMessageRef = useRef<string>('');

  useEffect(() => {
    hydrateSessionStorageFromLocal();

    // Initialize language from sessionStorage if available
    const storedLanguage = sessionStorage.getItem('sessionLanguage');
    if (storedLanguage && ['python', 'javascript', 'java', 'cpp'].includes(storedLanguage)) {
      setSelectedLanguage(storedLanguage as 'python' | 'javascript' | 'java' | 'cpp');
    }
  }, []);

  // Redirect to home if no session ID exists
  useEffect(() => {
    const checkSession = async () => {
      const storedSessionId = getActiveSessionId();

      if (!storedSessionId) {
        addToast('No active session found. Please start a new session from the home page.', 'warning', 3000);
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionId && question?.id) {
      persistActiveSession(sessionId, String(question.id));
    }
  }, [sessionId, question?.id]);

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

  /**
   * Schedule a "partner hasn't joined" toast when we're the only connected user.
   * Guarded by partnerTimeoutRef so each disconnect schedules a single 10s check.
   */
  const schedulePartnerJoinWarning = () => {
    if (partnerTimeoutRef.current) return;

    partnerWaitArmedRef.current = true;
    partnerTimeoutRef.current = setTimeout(() => {
      partnerTimeoutRef.current = null;
      if (connectedUsersRef.current.length <= 1) {
        addToast(
          'Your partner hasn\'t joined yet. They may have disconnected or not received the match.',
          'warning',
          5000
        );
        setWaitingForPartner(false);
      }
    }, PARTNER_JOIN_WARNING_MS);
  };

  // Handle collaboration messages (code execution events)
  const handleCollaborationMessage = (message: CollaborationMessage) => {
    // Deduplicate messages by creating a unique key
    const messageKey = `${message.type}-${message.sender}-${message.timestamp}`;
    
    // Skip if we've already processed this exact message
    if (lastProcessedMessageRef.current === messageKey) {
      return;
    }
    lastProcessedMessageRef.current = messageKey;
    
    const senderUser = connectedUsers.find((u) => u.clientId === message.sender);
    const senderName = senderUser?.name || 'Another user';

    if (message.type === 'code-execution-start') {
      setExecutionLock({ clientId: message.sender, userName: senderName });
      setIsRunning(true);
      addToast(`${senderName} is running the code...`, 'info', 3000);
    } else if (message.type === 'code-execution-result') {
      setExecutionLock(null);
      setIsRunning(false);

      const { success, results, error, action, submissionData } = message.data;

      if (success) {
        if (action === 'submit' && submissionData) {
          // Redirect to submission results page (both users see the same results)
          const dataParam = encodeURIComponent(JSON.stringify(submissionData));
          router.push(`/practice/${submissionData.question_id}/submission?data=${dataParam}`);
        } else if (action === 'run') {
          // For "Run Code", just show results in the UI
          setTestResults(results || []);
          setExecutionError(null);
          setActiveTab('testResults');
        }
      } else {
        setExecutionError(error || 'Code execution failed');
        setTestResults([]);
      }
    } else if (message.type === 'language-change') {
      const { language } = message.data;
      
      // Only update and show toast if the message is from another user
      const localUser = collaborationManagerRef.current?.getLocalUser();
      if (localUser && message.sender !== localUser.clientId) {
        setSelectedLanguage(language);
        sessionStorage.setItem('sessionLanguage', language);
        addToast(`${senderName} changed the language to ${language}`, 'info', 2000);
      }
    }
  };

  // -------------- QUESTION FETCH + SEED --------------
  const fetchAndSetQuestion = async (
    qid: number,
    lang: 'python' | 'javascript' | 'java' | 'cpp',
    sessionIdentifier?: string,
    seedSharedDoc = false
  ) => {
    try {
      setIsLoadingQuestion(true);
      setQuestionError(null);
      const data = await getQuestionById(qid);
      setQuestion(data);

      const sessionForPersistence = sessionIdentifier || sessionId || getActiveSessionId();
      if (sessionForPersistence) {
        persistActiveSession(sessionForPersistence, String(data.id));
      }

      const template = data.code_templates?.[lang];

      if (seedSharedDoc && collaborationManagerRef.current) {
        const content = template ?? languageConfig[lang].defaultCode;
        setCode(content);
        collaborationManagerRef.current.setSharedContent(content);
      } else if (!sessionId && !sessionIdentifier && editorRef.current) {
        // Only set local editor if we're NOT in a collaborative session
        // Check both current sessionId state and the sessionIdentifier parameter
        const currentVal = editorRef.current.getValue();
        if (!currentVal || currentVal.trim() === '') {
          const content = template ?? languageConfig[lang].defaultCode;
          editorRef.current.setValue(content);
          setCode(content);
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
    const targetSessionId = autoSessionId;

    if (!targetSessionId) {
      addToast('No session ID found. Redirecting to home page...', 'warning');
      setTimeout(() => {
        router.push('/home');
      }, 1000);
      return;
    }

    if (!editorRef.current) {
      addToast('Editor not ready. Please try again.', 'warning');
      return;
    }

    setConnectionStatus('connecting');
    setIsConnected(false);
    setIsLoadingContent(true); // Show loading spinner immediately

    // Validate session existence and status
    try {
      const sessionDetails = await collaborationService.getSession(targetSessionId);

      if (!sessionDetails) {
        throw new Error('Session lookup returned empty result');
      }

      // Check if session is active
      if (sessionDetails.status !== 'ACTIVE') {
        if (autoSessionId) {
          clearActiveSession();
          setIsFromMatchFlow(false);
        }

        setConnectionStatus('error');
        setIsLoadingContent(false);
        addToast('This session is no longer active. Please start a new session.', 'warning');
        setTimeout(() => {
          router.push('/home');
        }, 2000);
        return;
      }

      // Persist details immediately so rejoin reminders stay in sync even if connect fails later.
      if (sessionDetails.questionId) {
        persistActiveSession(targetSessionId, sessionDetails.questionId);
      }

      setSessionId(targetSessionId);
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.error('[CollaborativeCoding] Failed to validate session before connecting:', {
        error,
        status,
      });

      if (autoSessionId) {
        // Clean up stored session info if we failed to validate during auto-connect
        clearActiveSession();
        setIsFromMatchFlow(false);
      }

      setConnectionStatus('error');
      setConnectedUsers([]);
      setIsConnected(false);
      setIsLoadingContent(false);

      if (status === 404) {
        addToast('Session not found. Redirecting to home page...', 'error');
      } else if (status === 403) {
        addToast('You do not have access to this session. Redirecting to home page...', 'error');
      } else {
        addToast('Failed to verify session. Redirecting to home page...', 'error');
      }

      setTimeout(() => {
        router.push('/home');
      }, 2000);
      return;
    }

    try {
      if (!collaborationManagerRef.current) {
        collaborationManagerRef.current = new CollaborationManager();
      }

      collaborationManagerRef.current.onPresenceUpdate((users) => {
        connectedUsersRef.current = users;
        setConnectedUsers(users);
        
        // Detect partner presence (more than just ourselves)
        const hasPartner = users.length > 1;
        setPartnerPresent(hasPartner);
        
        if (hasPartner) {
          // Clear any pending partner wait or solo warning timers
          if (partnerTimeoutRef.current) {
            clearTimeout(partnerTimeoutRef.current);
            partnerTimeoutRef.current = null;
          }
          if (soloWarningTimeoutRef.current) {
            clearTimeout(soloWarningTimeoutRef.current);
            soloWarningTimeoutRef.current = null;
          }
          soloWarningShownRef.current = false;
          partnerWaitArmedRef.current = false;
          setWaitingForPartner(false);
          return;
        }

        // No partner currently connected - ensure banner shows disconnected state
        setWaitingForPartner(false);
        if (!partnerWaitArmedRef.current) {
          schedulePartnerJoinWarning();
        }

        if (!soloWarningTimeoutRef.current && !soloWarningShownRef.current) {
          soloWarningTimeoutRef.current = setTimeout(() => {
            soloWarningTimeoutRef.current = null;
            if (connectedUsersRef.current.length <= 1 && !soloWarningShownRef.current) {
              addToast(
                'Your partner has been disconnected for a while. This session will end soon if they do not return.',
                'warning',
                5000
              );
              soloWarningShownRef.current = true;
              setWaitingForPartner(false);
            }
          }, SOLO_WARNING_MS);
        }
      });

      collaborationManagerRef.current.onErrorNotification(handleCollaborationError);

      // Listen for code execution messages from other users
      collaborationManagerRef.current.onMessage((message: CollaborationMessage) => {
        handleCollaborationMessage(message);
      });

      // connect
      connectedUsersRef.current = []; // Ensure presence ref starts clean before we attach callbacks
      setConnectedUsers([]);
      await collaborationManagerRef.current.connect(
        targetSessionId,
        editorRef.current,
        async (status /*, meta?: any */) => {
          setConnectionStatus(status);
          setIsConnected(status === 'connected');

          if (status === 'connected') {
            addToast('Successfully connected to session', 'success', 3000);
            setIsLoadingContent(true); // Start loading state
            soloWarningShownRef.current = false;
            if (soloWarningTimeoutRef.current) {
              clearTimeout(soloWarningTimeoutRef.current);
              soloWarningTimeoutRef.current = null;
            }
            
            // Start/restart partner presence timeout (10 seconds) on initial connect
            if (partnerTimeoutRef.current) {
              clearTimeout(partnerTimeoutRef.current);
              partnerTimeoutRef.current = null;
            }
            schedulePartnerJoinWarning();

            const storedQid = getActiveQuestionId();
            if (storedQid) {
              const questionId = Number(storedQid);

              // Validate that the question ID is a valid number
              if (isNaN(questionId) || questionId <= 0) {
                console.error('❌ Invalid question ID:', storedQid);
                setQuestionError(`Invalid question ID: ${storedQid}. Please start a new session.`);
                return;
              }

              persistActiveSession(targetSessionId, storedQid);

              // Check if question is already loaded (from parallel fetch)
              if (question && question.id === questionId) {
                // Question already loaded, skipping fetch
              } else {
                // Wait for initial sync to complete with timeout
                try {
                  await Promise.race([
                    collaborationManagerRef.current?.waitForInitialSync(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 5000)),
                  ]);
                } catch (syncError) {
                  // Sync timeout or error, continuing anyway
                }

                // Small delay to ensure Yjs state is fully propagated
                // Reduced from 300ms to 100ms - Yjs transactions already prevent race conditions
                await new Promise((resolve) => setTimeout(resolve, 100));

                const hasSharedContent = collaborationManagerRef.current?.hasSharedContent() ?? false;

                // Only seed if there's NO shared content (first user to connect)
                // When rejoining or second user connects, never seed - let Yjs sync existing content
                await fetchAndSetQuestion(questionId, selectedLanguage, targetSessionId, !hasSharedContent);
                
                // End loading state
                setIsLoadingContent(false);
              }
            } else {
              setQuestionError('No question is linked to this session.');
              setIsLoadingContent(false);
            }
          }
        }
      );
    } catch (error) {
      console.error('[CollaborativeCoding] Failed to connect:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      setIsLoadingContent(false); // Clear loading state on error
      addToast('Failed to connect to session. Please try again.', 'error');
    }
  };

  // -------------- END SESSION --------------
  const endSession = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to end this session? This will disconnect both you and your partner.'
    );
    if (!confirmed) return;

    const currentSessionId = sessionId;

    // 1. Terminate session for BOTH users (backend call)
    if (currentSessionId) {
      try {
        await collaborationService.terminateSession(currentSessionId);
        console.log('✅ Session terminated for both users');
      } catch (error) {
        console.error('Failed to terminate session:', error);
        // Continue with local cleanup even if backend call fails
      }
    }

    // 2. Frontend cleanup
    if (collaborationManagerRef.current) {
      try {
        collaborationManagerRef.current.disconnect();
      } catch (e) {
        console.warn('[Collaboration] error destroying provider', e);
      } finally {
        collaborationManagerRef.current = null;
      }
    }

    // 3. Update UI state
    setSessionId('');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectedUsers([]);
    setIsFromMatchFlow(false);

    // 4. Clear session storage to prevent immediate reconnect
    // This prevents the race condition where user disconnects then immediately reconnects
    // before partner disconnects, which would prevent session deletion
    clearActiveSession();
    console.log('�️ Cleared session storage (prevents immediate reconnect)');

    clearActiveSession();

    // 5. Reset editor to a local template
    if (editorRef.current) {
      const fallback = languageConfig[selectedLanguage].defaultCode;
      editorRef.current.setValue(fallback);
      setCode(fallback);
    }

    addToast('Disconnected from session.', 'info', 3000);

    // 6. Redirect to home page
    router.push('/home');
  };

  // -------------- EDITOR MOUNT --------------
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    setIsEditorReady(true);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear partner/solo timeouts so they don't leak into the next session
      if (partnerTimeoutRef.current) {
        clearTimeout(partnerTimeoutRef.current);
        partnerTimeoutRef.current = null;
      }
      partnerWaitArmedRef.current = false;
      if (soloWarningTimeoutRef.current) {
        clearTimeout(soloWarningTimeoutRef.current);
        soloWarningTimeoutRef.current = null;
      }
      
      // React unmount - clean up frontend only (WebSocket close will notify backend)
      if (collaborationManagerRef.current) {
        collaborationManagerRef.current.disconnect();
        collaborationManagerRef.current = null;
      }
    };
  }, []);

  // beforeunload handler - notify backend before page closes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Try to notify backend before page closes (best effort)
      // This uses sendBeacon which is more reliable than fetch during unload
      const currentSessionId = sessionId;
      if (currentSessionId && navigator.sendBeacon) {
        try {
          // Get auth cookie for the request
          const apiUrl = `${process.env.NEXT_PUBLIC_COLLAB_SERVICE_URL || 'http://localhost:3003'}/api/v1/sessions/${encodeURIComponent(currentSessionId)}/leave`;

          // sendBeacon is more reliable during page unload than fetch
          // It's queued by the browser and sent even if the page is closing
          const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon(apiUrl, blob);
        } catch (error) {
          console.warn('[Collaboration] Failed to send disconnect beacon:', error);
        }
      }

      // Frontend cleanup
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
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // auto-connect from match flow
  useEffect(() => {
    const storedSessionId = getActiveSessionId();
    const storedQuestionId = getActiveQuestionId();
    const storedMatchType =
      typeof window !== 'undefined'
        ? (sessionStorage.getItem('questionMatchType') as ('exact' | 'partial' | 'difficulty' | 'random') | null)
        : null;

    if (!storedSessionId) {
      return;
    }

    if (storedSessionId && isEditorReady && !sessionId) {
      setIsFromMatchFlow(true);

      // Show match quality notification to user
      if (storedMatchType) {
        const matchTypeMessages = {
          exact: { message: 'Perfect Match! This question covers all your selected topics.', type: 'success' as const },
          partial: {
            message:
              '✨ Partial Match! This question covers only some of your selected topics, but matches your difficulty level.',
            type: 'info' as const,
          },
          difficulty: {
            message: 'Difficulty Match! No topic matches found - this question matches your difficulty level only.',
            type: 'warning' as const,
          },
          random: {
            message:
              "🎲 Random Question! No matches found for your criteria - here's a random question to practice with.",
            type: 'warning' as const,
          },
        };

        const matchInfo = matchTypeMessages[storedMatchType];
        if (matchInfo) {
          addToast(matchInfo.message, matchInfo.type, 6000);
        }

        // Clear the match type from storage after showing notification
        sessionStorage.removeItem('questionMatchType');
      }

      // Optimize: Fetch question in parallel with connecting to session
      // This reduces perceived lag by starting the fetch immediately
      if (storedQuestionId) {
        const questionId = Number(storedQuestionId);
        if (!isNaN(questionId) && questionId > 0) {
          // Don't await - let it run in parallel with connection
          fetchAndSetQuestion(questionId, selectedLanguage, storedSessionId, false).catch((err) => {
            console.error('❌ Pre-fetch question failed:', err);
          });
        }
      }

      connectToSession(storedSessionId);
    } else if (storedSessionId && !isEditorReady) {
      setIsFromMatchFlow(true);
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

      // Prepare submission result data to pass to results page (same as solo practice)
      const submissionData = {
        submission_id: resp.submission_id,
        question_id: question.id,
        question_title: question.title,
        difficulty: question.difficulty,
        status: resp.status,
        passed_test_cases: resp.passed_test_cases,
        total_test_cases: resp.total_test_cases,
        runtime_ms: resp.runtime_ms,
        memory_mb: resp.memory_mb,
        runtime_percentile: resp.runtime_percentile,
        memory_percentile: resp.memory_percentile,
        timestamp: new Date().toISOString(),
        language: selectedLanguage,
        // Add session info for collaborative mode
        sessionId: sessionId,
        isCollaborative: true,
      };

      // Broadcast results to other user with full submission data
      if (isConnected && collaborationManagerRef.current) {
        collaborationManagerRef.current.sendMessage('code-execution-result', {
          action: 'submit',
          success: true,
          submissionData: submissionData,
        });
      }

      // Redirect to submission results page with data (like solo practice)
      const dataParam = encodeURIComponent(JSON.stringify(submissionData));
      router.push(`/practice/${question.id}/submission?data=${dataParam}`);
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

      setIsRunning(false);
      setExecutionLock(null);
    }
  };

  return (
    <div className='h-screen bg-[#1e1e1e] flex flex-col font-montserrat'>
      {/* HEADER */}
      <header className='bg-[#2e2e2e] px-6 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]'>
        <div className='flex items-center gap-6'>
          <h1 className='font-mclaren text-xl text-white'>PeerPrep</h1>
          <span className='text-gray-400 text-sm'>Collaborative Coding</span>

          {/* Session controls */}
          <div className='flex items-center gap-4'>
            {!sessionId ? (
              <span className='text-sm text-blue-400 animate-pulse'>Connecting to session...</span>
            ) : (
              <>
                <div className='flex items-center gap-1'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-[#F1FCAC]'
                        : connectionStatus === 'connecting'
                          ? 'bg-yellow-500 animate-pulse'
                          : connectionStatus === 'ended'
                            ? 'bg-orange-500'
                            : connectionStatus === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                    }`}
                  />
                  <span className='text-xs text-gray-400'>{connectionStatus}</span>
                </div>

                {/* Partner Presence Indicator */}
                {isConnected && (
                  <div className='flex items-center gap-1.5 px-2 py-1 bg-[#252525] rounded'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        partnerPresent
                          ? 'bg-green-500'
                          : waitingForPartner
                            ? 'bg-yellow-500 animate-pulse'
                            : 'bg-gray-500'
                      }`}
                    />
                    <span className='text-xs text-gray-300'>
                      {partnerPresent
                        ? 'Partner connected'
                        : waitingForPartner
                          ? 'Waiting for partner...'
                          : 'Partner disconnected'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {sessionId && (
          <button
            onClick={connectionStatus === 'ended' ? () => router.push('/home') : endSession}
            className={`px-4 py-1.5 text-white text-sm font-medium transition-colors rounded ${
              connectionStatus === 'ended'
                ? 'bg-[#4b5563] hover:bg-[#374151]'
                : 'bg-[#dc2626] hover:bg-[#b91c1c]'
            }`}
          >
            {connectionStatus === 'ended' ? 'Return to Home' : 'End Session'}
          </button>
        )}
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
                    <DifficultyTag difficulty={question.difficulty} />
                  </div>
                  <div className='flex gap-2 flex-wrap'>
                    {question.topics.map((topic) => (
                      <span key={topic.id ?? topic.name} className='text-sm text-gray-400'>
                        {topic.name ?? topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='space-y-4'>
                  <MarkdownContent content={removeExamplesFromDescription(question.description)} />

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
                        
                        // Persist language selection to sessionStorage
                        sessionStorage.setItem('sessionLanguage', newLang);
                        
                        // Broadcast language change to other users
                        if (sessionId && collaborationManagerRef.current) {
                          collaborationManagerRef.current.sendMessage('language-change', {
                            language: newLang,
                          });
                        }

                        // prefer question template
                        if (question && question.code_templates && question.code_templates[newLang]) {
                          const tmpl = question.code_templates[newLang];
                          setCode(tmpl);
                          if (sessionId && collaborationManagerRef.current) {
                            collaborationManagerRef.current.setSharedContent(tmpl);
                          } else if (editorRef.current) {
                            editorRef.current.setValue(tmpl);
                          }
                        } else {
                          const fallback = languageConfig[newLang].defaultCode;
                          setCode(fallback);
                          if (sessionId && collaborationManagerRef.current) {
                            collaborationManagerRef.current.setSharedContent(fallback);
                          } else if (editorRef.current) {
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
              <div className='flex-1 bg-[#1e1e1e] overflow-hidden relative'>
                {/* Loading overlay */}
                {isLoadingContent && (
                  <div className='absolute inset-0 bg-[#1e1e1e]/95 z-50 flex items-center justify-center'>
                    <div className='flex flex-col items-center gap-4'>
                      <div className='w-12 h-12 border-4 border-[#555555] border-t-[#F1FCAC] rounded-full animate-spin'></div>
                      <p className='text-white text-sm font-medium animate-pulse'>Loading code template...</p>
                    </div>
                  </div>
                )}
                
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
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'testResults' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Test Results
                {activeTab === 'testResults' && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white' />}
              </button>
              <button
                onClick={() => setActiveTab('customInput')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'customInput' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
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
                            className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                              selectedTestCase === idx ? 'bg-[#3e3e3e]' : 'bg-[#2e2e2e] hover:bg-[#3a3a3a]'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                                result.passed ? 'bg-[#F1FCAC] text-black' : 'bg-red-500 text-white'
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
                              className={`p-3 rounded font-medium text-sm ${
                                testResults[selectedTestCase].passed
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
