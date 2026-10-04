import React, { useState } from 'react';
import {
  Dumbbell,
  Sparkles,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { WorkoutRoutine } from '../types';

export const ExerciseView: React.FC = () => {
  const { user, openCreditModal, showNotification } = useApp();

  const [workoutType, setWorkoutType] = useState(
    user?.mobility === 'paralysis' || user?.mobility === 'wheelchair'
      ? 'Chair & Seated Mobility'
      : 'Low-impact cardio & strength'
  );
  const [durationMin, setDurationMin] = useState(15);
  const [equipmentList, setEquipmentList] = useState<string[]>(['No equipment']);
  const [workout, setWorkout] = useState<WorkoutRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active workout execution timer
  const [activeSession, setActiveSession] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const workoutTypes = [
    'Low-impact cardio & strength',
    'Walking & joint mobility',
    'Chair & Seated Mobility',
    'Balance & Core Stability',
    'Gentle Morning Stretch',
    'Full Body Resistance',
  ];

  const handleGenerateWorkout = async () => {
    setIsLoading(true);
    try {
      const res = await api.generateWorkout({
        targetDuration: durationMin,
        equipment: equipmentList,
        workoutType,
      });
      setWorkout(res.workout);
      setActiveSession(false);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setCurrentExerciseIndex(0);
      showNotification('Safe workout generated!', 'success');
    } catch (err: any) {
      if (err.requiresCredits) {
        openCreditModal();
      } else {
        showNotification(err.message || 'Generation failed', 'warning');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Simple timer effect
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-stone-900 dark:text-stone-100 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-white">
            Exercise & Movement Generator
          </h1>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Movement tailored to your mobility ({user?.mobility}), joint comfort, and available time.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 text-xs text-amber-900 dark:text-amber-300 space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>KRIVYA Exercise Safety Rules</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Never use exercise as punishment or to "burn off" food. If you experience dizziness, sharp pain, chest tightness, or shortness of breath, stop immediately and seek medical attention.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white font-display">
          Customize Your Session:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Movement Style</label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none"
            >
              {workoutTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-stone-600 dark:text-stone-400 block mb-1 font-medium">Session Duration</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMin(m)}
                  className={`flex-1 py-2 rounded-xl font-mono font-medium cursor-pointer transition-all ${
                    durationMin === m
                      ? 'bg-emerald-500 text-stone-950 font-bold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateWorkout}
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Generating Routine...' : 'Generate Personalized Workout (250 Credits)'}</span>
        </button>
      </div>

      {/* WORKOUT ROUTINE DISPLAY */}
      {workout && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 text-xs">
          {/* Header & Quick stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">
                {workout.difficulty.toUpperCase()} DIFFICULTY · {workout.durationMinutes} MINUTES
              </span>
              <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                {workout.title}
              </h2>
              <span className="text-stone-500">{workout.goal}</span>
            </div>

            {/* Interactive Session Starter */}
            <button
              type="button"
              onClick={() => {
                setActiveSession(true);
                setIsTimerRunning(!isTimerRunning);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 font-bold flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-center"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
            </button>
          </div>

          {/* Active Workout Timer Bar */}
          {activeSession && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-mono block">SESSION TIME</span>
                <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatTimer(timerSeconds)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-medium"
                >
                  {isTimerRunning ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Warm-Up */}
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200 block mb-2 font-display">
              1. Gentle Warm-Up Flow:
            </span>
            <div className="space-y-1.5">
              {workout.warmUp?.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 flex justify-between items-center"
                >
                  <span className="font-semibold text-stone-900 dark:text-white">{w.title}</span>
                  <span className="font-mono text-stone-400">{w.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200 block mb-2 font-display">
              2. Core Movement Flow:
            </span>
            <div className="space-y-3">
              {workout.exercises?.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                        EXERCISE {idx + 1} · {ex.targetArea}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                        {ex.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 dark:text-white">
                        {ex.repsOrDuration}
                      </span>
                      <span className="text-[10px] text-stone-400 block font-mono">
                        {ex.sets} sets · {ex.restSeconds}s rest
                      </span>
                    </div>
                  </div>

                  {/* Seated modification */}
                  {ex.seatedAlternative && (
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-[11px]">
                      <strong className="block font-semibold">♿ Seated / Chair Alternative:</strong>
                      <span>{ex.seatedAlternative}</span>
                    </div>
                  )}

                  {/* Form cues */}
                  <ul className="text-stone-600 dark:text-stone-300 list-disc list-inside space-y-0.5 text-[11px]">
                    {ex.formCues?.map((cue, cIdx) => (
                      <li key={cIdx}>{cue}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Cool-Down & Post Workout Nutrition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-white block">
                3. Restorative Cool-Down:
              </span>
              <p className="text-stone-500 text-[11px]">
                {workout.coolDown?.[0]?.title || 'Gentle deep breathing and spinal release.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                Post-Workout Nourishment:
              </span>
              <p className="text-emerald-800 dark:text-emerald-200 text-[11px]">
                {workout.postWorkoutNutrition}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
