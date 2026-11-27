import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer } from "lucide-react";

const INITIAL_SECONDS = 120;

const INTERVIEW_QUESTIONS: readonly string[] = [
  "Ceritakan proyek web atau aplikasi yang paling kamu banggakan dan peran spesifikmu di dalamnya.",
  "Ceritakan bug tersulit saat mengelola state di proyek React yang pernah kamu buat, dan bagaimana kamu memperbaikinya?",
  "Bagaimana cara kamu menangani loading, error, dan pembatalan request (race condition) saat fetch data dari API?",
  "Jelaskan perbedaan antara state yang disimpan di useState dan derived state di React, serta kapan memakai masing-masing.",
  "Jika kamu bergabung ke tim dengan codebase yang sudah besar, apa langkah pertamamu di minggu pertama magang?",
  "Bagaimana cara kamu mengatur prioritas ketika mendapat dua tugas teknis dengan deadline yang hampir bersamaan?",
];

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;
}

export function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleToggleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(INITIAL_SECONDS);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
  };

  const handleNextQuestion = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
    setQuestionIndex((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
  };

  const isLowTime = secondsLeft > 0 && secondsLeft <= 30;
  const isTimeUp = secondsLeft === 0;

  return (
    <section className="detail-card prep-card">
      <div className="detail-card-header">
        <div className="detail-card-title-group">
          <Timer size={16} />
          <h3>LATIHAN INTERVIEW</h3>
        </div>
        <span className="prep-counter">
          Soal {questionIndex + 1} / {INTERVIEW_QUESTIONS.length}
        </span>
      </div>

      <blockquote className="prep-question">
        &ldquo;{INTERVIEW_QUESTIONS[questionIndex]}&rdquo;
      </blockquote>

      <div className="prep-timer-row">
        <div className="prep-clock-group">
          <span
            className={`prep-clock ${
              isTimeUp ? "time-up" : isLowTime ? "time-low" : ""
            }`}
            aria-live="polite"
          >
            {formatTimer(secondsLeft)}
          </span>
          {isTimeUp && <span className="prep-timeup-tag">Waktu habis!</span>}
        </div>

        <div className="prep-controls">
          <button
            type="button"
            className="prep-btn-primary"
            onClick={handleToggleStartPause}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isRunning ? "Jeda" : "Mulai"}</span>
          </button>

          <button
            type="button"
            className="prep-btn-secondary"
            onClick={handleReset}
            title="Reset timer ke 02:00"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            className="prep-btn-secondary"
            onClick={handleNextQuestion}
            title="Lanjut ke soal berikutnya"
          >
            <span>Lanjut</span>
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
