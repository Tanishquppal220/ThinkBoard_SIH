import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
	Play,
	Pause,
	RotateCcw,
	Wind,
	Volume2,
	VolumeX,
	Settings,
} from 'lucide-react';
import Navbar from '../components/Navbar';

const BreathingPage = () => {
	const navigate = useNavigate();
	const [isActive, setIsActive] = useState(false);
	const [currentPhase, setCurrentPhase] = useState('inhale'); // 'inhale', 'hold', 'exhale', 'pause'
	const [timeRemaining, setTimeRemaining] = useState(4);
	const [currentCycle, setCurrentCycle] = useState(0);
	const [totalCycles, setTotalCycles] = useState(5);
	const [isComplete, setIsComplete] = useState(false);
	const [isSoundEnabled, setIsSoundEnabled] = useState(true);
	const [breathingPattern, setBreathingPattern] = useState('4-4-4-4'); // inhale-hold-exhale-pause
	const intervalRef = useRef(null);

	// Breathing patterns
	const patterns = {
		'4-4-4-4': {
			inhale: 4,
			hold: 4,
			exhale: 4,
			pause: 4,
			name: 'Box Breathing',
		},
		'4-7-8-0': {
			inhale: 4,
			hold: 7,
			exhale: 8,
			pause: 0,
			name: '4-7-8 Technique',
		},
		'6-2-6-2': {
			inhale: 6,
			hold: 2,
			exhale: 6,
			pause: 2,
			name: 'Calm Breathing',
		},
		'4-0-4-0': {
			inhale: 4,
			hold: 0,
			exhale: 4,
			pause: 0,
			name: 'Simple Breathing',
		},
	};

	const currentPattern = patterns[breathingPattern];

	// Phase sequence and durations
	const getPhaseSequence = useCallback(() => {
		const sequence = ['inhale'];
		if (currentPattern.hold > 0) sequence.push('hold');
		sequence.push('exhale');
		if (currentPattern.pause > 0) sequence.push('pause');
		return sequence;
	}, [currentPattern.hold, currentPattern.pause]);

	const getPhaseDuration = useCallback(
		(phase) => {
			return currentPattern[phase] || 0;
		},
		[currentPattern]
	);

	const getPhaseText = (phase) => {
		const texts = {
			inhale: 'Breathe In',
			hold: 'Hold',
			exhale: 'Breathe Out',
			pause: 'Pause',
		};
		return texts[phase];
	};

	const getPhaseInstruction = (phase) => {
		const instructions = {
			inhale: 'Slowly breathe in through your nose',
			hold: 'Hold your breath gently',
			exhale: 'Slowly breathe out through your mouth',
			pause: 'Rest and prepare for the next breath',
		};
		return instructions[phase];
	};

	// Sound effects (using Web Audio API)
	const playSound = useCallback(
		(frequency, duration) => {
			if (!isSoundEnabled) return;

			const audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.value = frequency;
			oscillator.type = 'sine';

			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + duration
			);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + duration);
		},
		[isSoundEnabled]
	);

	// Timer logic
	useEffect(() => {
		if (isActive && !isComplete) {
			intervalRef.current = setInterval(() => {
				setTimeRemaining((prev) => {
					if (prev <= 1) {
						// Move to next phase
						const sequence = getPhaseSequence();
						const currentIndex = sequence.indexOf(currentPhase);
						const nextIndex = (currentIndex + 1) % sequence.length;
						const nextPhase = sequence[nextIndex];

						// Play sound for phase transition
						if (nextPhase === 'inhale') {
							playSound(440, 0.2); // A note
							// Only increment cycle when completing a full breathing cycle (returning to inhale after pause/exhale)
							if (
								currentPhase === 'pause' ||
								(currentPhase === 'exhale' && currentPattern.pause === 0)
							) {
								// Check if we've completed all cycles BEFORE incrementing
								if (currentCycle + 1 >= totalCycles) {
									setIsComplete(true);
									setIsActive(false);
									return 0;
								}
								// Increment cycle count after checking completion
								setCurrentCycle((prev) => prev + 1);
							}
						} else if (nextPhase === 'exhale') {
							playSound(330, 0.2); // E note
						}

						setCurrentPhase(nextPhase);
						return getPhaseDuration(nextPhase);
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			clearInterval(intervalRef.current);
		}

		return () => clearInterval(intervalRef.current);
	}, [
		isActive,
		currentPhase,
		currentCycle,
		totalCycles,
		isComplete,
		getPhaseSequence,
		playSound,
		getPhaseDuration,
		currentPattern.pause,
	]);

	const startExercise = () => {
		setIsActive(true);
		setIsComplete(false);
		setCurrentPhase('inhale');
		setTimeRemaining(getPhaseDuration('inhale'));
		setCurrentCycle(0);
	};

	const pauseExercise = () => {
		setIsActive(false);
	};

	const resetExercise = () => {
		setIsActive(false);
		setIsComplete(false);
		setCurrentPhase('inhale');
		setTimeRemaining(getPhaseDuration('inhale'));
		setCurrentCycle(0);
	};

	// Visual breathing guide calculation
	const getCircleScale = () => {
		const progress =
			(getPhaseDuration(currentPhase) - timeRemaining) /
			getPhaseDuration(currentPhase);

		if (currentPhase === 'inhale') {
			return 0.5 + progress * 0.5; // Scale from 0.5 to 1.0
		} else if (currentPhase === 'exhale') {
			return 1.0 - progress * 0.5; // Scale from 1.0 to 0.5
		} else {
			return currentPhase === 'hold' ? 1.0 : 0.5; // Stay at max or min
		}
	};

	return (
		<div className="min-h-screen bg-base-100">
			{/* Main Content */}
			<div className="container mx-auto p-6 max-w-6xl mt-16">
                <Navbar/>
				{/* Header Section */}
				<div className="card bg-base-200 shadow-lg mb-6">
					<div className="card-body py-4 px-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="avatar placeholder">
									<div className="bg-primary text-primary-content rounded-full w-12">
										<Wind className="w-6 h-6" />
									</div>
								</div>
								<div>
									<h1 className="text-2xl font-bold">Breathing Exercise</h1>
									<p className="text-base-content/70">{currentPattern.name} • {totalCycles} cycles</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setIsSoundEnabled(!isSoundEnabled)}
									className={`btn btn-circle ${isSoundEnabled ? 'btn-primary' : 'btn-outline'}`}
									title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
								>
									{isSoundEnabled ? (
										<Volume2 className="w-5 h-5" />
									) : (
										<VolumeX className="w-5 h-5" />
									)}
								</button>
								<button
									onClick={() => document.getElementById('settings_modal').showModal()}
									className="btn btn-circle btn-outline"
									title="Settings"
								>
									<Settings className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Main Exercise Area */}
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					{/* Left Column - Controls and Settings */}
					<div className="xl:col-span-1 space-y-6">
						{/* Quick Stats */}
						{(isActive || isComplete) && (
							<div className="space-y-4">
								<div className="stat bg-base-200 rounded-box shadow">
									<div className="stat-title">Current Phase</div>
									<div className="stat-value text-xl text-primary">{getPhaseText(currentPhase)}</div>
									<div className="stat-desc">{getPhaseInstruction(currentPhase)}</div>
								</div>
								<div className="stat bg-base-200 rounded-box shadow">
									<div className="stat-title">Progress</div>
									<div className="stat-value text-xl text-info">{currentCycle + 1}/{totalCycles}</div>
									<div className="stat-desc">Cycles completed</div>
								</div>
							</div>
						)}

						{/* Pattern Selector */}
						{!isActive && !isComplete && (
							<div className="card bg-base-200 shadow">
								<div className="card-body">
									<h3 className="card-title mb-4">Choose Pattern</h3>
									<div className="space-y-3">
										{Object.entries(patterns).map(([key, pattern]) => (
											<button
												key={key}
												onClick={() => setBreathingPattern(key)}
												className={`btn w-full justify-start ${breathingPattern === key ? 'btn-primary' : 'btn-outline'}`}
											>
												<div className="text-left">
													<div className="font-semibold">{pattern.name}</div>
													<div className="text-xs opacity-70">{key}</div>
												</div>
											</button>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Cycle Selector */}
						{!isActive && !isComplete && (
							<div className="card bg-base-200 shadow">
								<div className="card-body">
									<h4 className="card-title mb-4">Number of Cycles</h4>
									<div className="grid grid-cols-2 gap-3">
										{[3, 5, 8, 10].map((cycles) => (
											<button
												key={cycles}
												onClick={() => setTotalCycles(cycles)}
												className={`btn ${totalCycles === cycles ? 'btn-primary' : 'btn-outline'}`}
											>
												{cycles}
											</button>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Middle Column - Visual Guide */}
					<div className="xl:col-span-1 flex justify-center">
						<div className="card bg-base-200 shadow w-full max-w-md">
							<div className="card-body flex items-center justify-center p-8">
								<div className="relative w-80 h-80 flex items-center justify-center">
									{/* Outer Ring */}
									<div className="absolute inset-0 rounded-full border-2 border-base-300"></div>

									{/* Main Breathing Circle */}
									<div
										className={`absolute rounded-full transition-all duration-1000 ease-in-out shadow-2xl ${
											currentPhase === 'inhale' ? 'bg-info' :
											currentPhase === 'hold' ? 'bg-warning' :
											currentPhase === 'exhale' ? 'bg-success' : 'bg-neutral'
										}`}
										style={{
											width: `${getCircleScale() * 300}px`,
											height: `${getCircleScale() * 300}px`,
											transform: 'translate(-50%, -50%)',
											left: '50%',
											top: '50%',
										}}
									>
									</div>

									{/* Center Content */}
									<div className="relative z-10 text-center text-base-100">
										<div className="text-6xl font-bold mb-2 drop-shadow">
											{timeRemaining}
										</div>
										<div className="text-2xl font-medium mb-2 drop-shadow">
											{getPhaseText(currentPhase)}
										</div>
										<div className="text-sm max-w-40 drop-shadow opacity-90">
											{getPhaseInstruction(currentPhase)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Progress and Controls */}
					<div className="xl:col-span-1 space-y-6">
						{/* Progress Indicators */}
						<div className="card bg-base-200 shadow">
							<div className="card-body text-center">
								<h3 className="text-xl font-bold mb-4">
									Cycle {currentCycle + 1} of {totalCycles}
								</h3>
								<div className="flex justify-center gap-2 mb-6">
									{Array.from({ length: totalCycles }, (_, i) => (
										<div
											key={i}
											className={`w-4 h-4 rounded-full transition-all duration-500 ${
												i < currentCycle ? 'bg-success' :
												i === currentCycle ? 'bg-primary animate-pulse' : 'bg-base-300'
											}`}
										></div>
									))}
								</div>
								<progress 
									className="progress progress-primary w-full h-3" 
									value={currentCycle} 
									max={totalCycles}
								></progress>
							</div>
						</div>

						{/* Controls */}
						<div className="card bg-base-200 shadow">
							<div className="card-body">
								{!isComplete ? (
									<div className="space-y-4">
										<button
											onClick={isActive ? pauseExercise : startExercise}
											className="btn btn-primary btn-lg w-full gap-3"
										>
											{isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
											{isActive ? 'Pause Exercise' : 'Start Exercise'}
										</button>
										<button
											onClick={resetExercise}
											className="btn btn-outline btn-lg w-full gap-3"
										>
											<RotateCcw className="w-5 h-5" />
											Reset Exercise
										</button>
									</div>
								) : (
									<div className="text-center space-y-4">
										<div className="text-6xl mb-4">🎉</div>
										<div className="text-2xl font-bold mb-2 text-success">Well Done!</div>
										<p className="mb-6">You've completed your breathing exercise. Take a moment to notice how you feel.</p>
										<div className="space-y-3">
											<button
												onClick={resetExercise}
												className="btn btn-primary btn-lg w-full"
											>
												Do Another Session
											</button>
											<button
												onClick={() => navigate(-1)}
												className="btn btn-outline btn-lg w-full"
											>
												Return to Dashboard
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Settings Modal */}
			<dialog id="settings_modal" className="modal">
				<div className="modal-box">
					<form method="dialog">
						<button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
					</form>
					<h3 className="font-bold text-lg mb-6">Exercise Settings</h3>

					<div className="space-y-6">
						{/* Breathing Pattern Selection */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Breathing Pattern</span>
							</label>
							<select
								className="select select-bordered w-full"
								value={breathingPattern}
								onChange={(e) => setBreathingPattern(e.target.value)}
							>
								{Object.entries(patterns).map(([key, pattern]) => (
									<option key={key} value={key}>
										{pattern.name} ({key})
									</option>
								))}
							</select>
						</div>

						{/* Cycles Selection */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Number of Cycles</span>
							</label>
							<div className="grid grid-cols-4 gap-2">
								{[3, 5, 8, 10].map((cycles) => (
									<button
										key={cycles}
										type="button"
										onClick={() => setTotalCycles(cycles)}
										className={`btn ${totalCycles === cycles ? 'btn-primary' : 'btn-outline'}`}
									>
										{cycles}
									</button>
								))}
							</div>
						</div>

						{/* Sound Toggle */}
						<div className="form-control">
							<label className="label cursor-pointer">
								<span className="label-text font-medium">Sound Effects</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									checked={isSoundEnabled}
									onChange={(e) => setIsSoundEnabled(e.target.checked)}
								/>
							</label>
						</div>
					</div>

					<div className="modal-action mt-8">
						<form method="dialog">
							<button className="btn btn-primary btn-lg">Close Settings</button>
						</form>
					</div>
				</div>
			</dialog>
		</div>
	);
};

export default BreathingPage;