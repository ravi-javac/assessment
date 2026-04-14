import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '@/services/examApi';
import { proctoringApi } from '@/services/proctoringApi';
import { useAuthStore } from '@/services/authStore';
import type { ExamTest, ExamQuestion, Answer } from '@/types/exam';
import { 
  Clock, ChevronLeft, ChevronRight, Save, Send, 
  AlertTriangle, CheckCircle, XCircle, Code,
  Video, Zap, EyeOff, UserPlus
} from 'lucide-react';

const AUTO_SAVE_INTERVAL = 30000;

export default function ExamInterface() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [test, setTest] = useState<ExamTest | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [lastFaceCount, setLastFaceCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout>();
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const proctoringRef = useRef<NodeJS.Timeout>();
  const faceDetectionRef = useRef<NodeJS.Timeout>();
  const movementRef = useRef<NodeJS.Timeout>();
  const suspicionScoreRef = useRef<NodeJS.Timeout>();
  let videoStream: MediaStream | null = null;

  useEffect(() => {
    if (testId) {
      startExam();
      startSuspicionScoreUpdates();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      stopProctoring();
      if (suspicionScoreRef.current) clearInterval(suspicionScoreRef.current);
    };
  }, [testId, attemptId]);

  const startSuspicionScoreUpdates = () => {
    suspicionScoreRef.current = setInterval(async () => {
      if (attemptId) {
        try {
          const response = await proctoringApi.getSuspicionScore(attemptId);
          if (response.success) {
            setSuspicionScore(response.data.totalScore || 0);
          }
        } catch (error) {
          console.error('Failed to get suspicion score:', error);
        }
      }
    }, 3000); // Update every 3 seconds
  };

  const startExam = async () => {
    try {
      setLoading(true);
      const deviceInfo = navigator.userAgent;
      const ipAddress = await getClientIP();

      const startResponse = await examApi.start({
        testId: testId!,
        ipAddress,
        deviceInfo,
        browserInfo: navigator.userAgent,
      });

      if (startResponse.success) {
        setAttemptId(startResponse.data.attemptId);

        const testResponse = await examApi.getTest(testId!);
        if (testResponse.success) {
          setTest(testResponse.data);
          setRemainingTime(testResponse.data.duration * 60);
          startTimer(testResponse.data.duration * 60);
          startAutoSave();
          startProctoring();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds: number) => {
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAutoSave = () => {
    autoSaveRef.current = setInterval(async () => {
      await saveAnswer(true);
    }, AUTO_SAVE_INTERVAL);
  };

  const startProctoring = () => {
    // Start tab visibility tracking
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    // Start face detection
    startFaceDetection();

    // Start movement detection
    startMovementDetection();

    // Start periodic screenshot capture
    proctoringRef.current = setInterval(() => {
      captureScreenshot();
    }, 5000); // Every 5 seconds
  };

  const handleVisibilityChange = () => {
    if (!attemptId) return;
    proctoringApi.handleTabEvent({
      attemptId,
      type: document.hidden ? 'visibilitychange' : 'focus',
      timestamp: new Date().toISOString(),
    });
  };

  const handleWindowFocus = () => {
    if (!attemptId) return;
    proctoringApi.handleTabEvent({
      attemptId,
      type: 'focus',
      timestamp: new Date().toISOString(),
    });
  };

  const handleWindowBlur = () => {
    if (!attemptId) return;
    proctoringApi.handleTabEvent({
      attemptId,
      type: 'blur',
      timestamp: new Date().toISOString(),
    });
  };

  const startFaceDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStream = stream;
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      document.body.appendChild(video);

      faceDetectionRef.current = setInterval(() => {
        detectFaces(video);
      }, 1000);
    } catch (error) {
      console.error('Face detection initialization error:', error);
    }
  };

  const detectFaces = async (video: HTMLVideoElement) => {
    if (!video || !video.videoWidth) return;
    
    try {
      // Simple face detection approximation using canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Very basic face detection - in reality would use face-api.js or similar
      // This is a placeholder that simulates detection
      const faceDetected = Math.random() > 0.3; // 70% chance of detecting face
      const faceCount = faceDetected ? (Math.random() > 0.8 ? 2 : 1) : 0;
      
      setLastFaceCount(faceCount);
      
      proctoringApi.handleFaceDetection({
        attemptId,
        faceCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Face detection error:', error);
    }
  };

  const startMovementDetection = () => {
    let lastMoveTime = Date.now();
    let movementCount = 0;
    
    movementRef.current = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastMoveTime;
      
      // Simple movement simulation
      const movementLevel = Math.random() * 10;
      
      if (movementLevel > 7) {
        movementCount++;
      } else {
        movementCount = Math.max(0, movementCount - 1);
      }
      
      proctoringApi.handleMovement({
        attemptId,
        movementLevel,
        timestamp: new Date().toISOString(),
      });
      
      lastMoveTime = now;
    }, 2000);
  };

  const captureScreenshot = async () => {
    try {
      // In a real implementation, this would capture from webcam
      // For now, we'll create a placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('Webcam Feed', 10, 30);
        ctx.fillText(`Faces: ${lastFaceCount}`, 10, 50);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        proctoringApi.saveScreenshot({
          attemptId,
          imageData,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Screenshot capture error:', error);
    }
  };

  const stopProctoring = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    
    if (faceDetectionRef.current) clearInterval(faceDetectionRef.current);
    if (movementRef.current) clearInterval(movementRef.current);
    if (proctoringRef.current) clearInterval(proctoringRef.current);
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
  };

  const saveAnswer = async (isAutoSaved = false) => {
    if (!attemptId || !test) return;

    const currentQ = test.questions[currentQuestion];
    const answer = answers[currentQ.questionId];

    if (answer) {
      try {
        await examApi.saveAnswer({
          attemptId,
          questionId: currentQ.questionId,
          userAnswer: answer,
          isAutoSaved,
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

    try {
      const response = await examApi.submit(attemptId);
      if (response.success) {
        navigate(`/exam/results/${attemptId}`);
      }
    } catch (err) {
      setError('Failed to submit exam');
    }
  };

  const handleNext = async () => {
    await saveAnswer();
    if (test && currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = async () => {
    await saveAnswer();
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const question = test.questions[currentQuestion];

  if (showInstructions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{test.title}</h1>
          {test.description && (
            <p className="text-gray-600 mb-4">{test.description}</p>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Duration: {test.duration} minutes</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Total Questions: {test.questions.length}</p>
              <p>Each question has individual time limit (if set)</p>
            </div>
          </div>

          {test.instructions && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Instructions:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{test.instructions}</p>
            </div>
          )}

          <button
            onClick={() => setShowInstructions(false)}
            className="btn btn-primary w-full"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-medium text-gray-900">{test.title}</h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              remainingTime < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
            }`}>
              <Clock size={20} />
              <span className="font-mono font-medium">{formatTime(remainingTime)}</span>
            </div>
            <span className="text-sm text-gray-500">
              {currentQuestion + 1} / {test.questions.length}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-sm text-gray-500">Question {currentQuestion + 1}</span>
              <span className="text-sm text-gray-500 mx-2">•</span>
              <span className="text-sm text-gray-500">{question.marks} marks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 p-2 rounded-lg ${
                suspicionScore > 70 ? 'bg-red-100 text-red-700' :
                suspicionScore > 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <Zap size={16} />
                <span className="text-xs font-medium">{suspicionScore}%</span>
              </div>
              {isCameraOn && (
                <Video className="w-4 h-4 text-green-500" />
              )}
              {!isCameraOn && (
                <Video className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {question.type === 'coding' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                {question.language}
              </span>
            )}
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-2">{question.title}</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">{question.content}</p>

          {question.type === 'mcq' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.key}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[question.questionId] === option.key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.questionId}`}
                    value={option.key}
                    checked={answers[question.questionId] === option.key}
                    onChange={() => setAnswers({ ...answers, [question.questionId]: option.key })}
                    className="hidden"
                  />
                  <span className="w-8 h-8 flex items-center justify-center border rounded-full font-medium">
                    {option.key}
                  </span>
                  <span>{option.value}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'coding' && (
            <div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <textarea
                  value={answers[question.questionId] || question.codeTemplate || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.questionId]: e.target.value })}
                  className="w-full h-64 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
                  placeholder="// Write your code here..."
                />
              </div>
              {question.testCases && question.testCases.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Sample Test Cases:</h4>
                  {question.testCases.slice(0, 2).map((tc, i) => (
                    <div key={i} className="text-sm">
                      <p><span className="font-medium">Input:</span> {tc.input}</p>
                      <p><span className="font-medium">Output:</span> {tc.expectedOutput}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {question.type === 'subjective' && (
            <textarea
              value={answers[question.questionId] || ''}
              onChange={(e) => setAnswers({ ...answers, [question.questionId]: e.target.value })}
              className="input h-48 resize-none"
              placeholder="Enter your answer..."
            />
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => saveAnswer(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Save size={20} />
                Save
              </button>
              {currentQuestion === test.questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send size={20} />
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn btn-primary flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {test.questions.map((q, i) => (
              <button
                key={q.questionId}
                onClick={async () => {
                  await saveAnswer();
                  setCurrentQuestion(i);
                }}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  i === currentQuestion
                    ? 'bg-primary-600 text-white'
                    : answers[q.questionId]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </main>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md">
            <h3 className="text-lg font-bold mb-4">Submit Exam?</h3>
            <p className="text-gray-600 mb-4">
              Once submitted, you cannot change your answers.
              {Object.keys(answers).length < test.questions.length && (
                <span className="text-red-600">
                  {' '}({test.questions.length - Object.keys(answers).length} questions unanswered)
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary flex-1"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}