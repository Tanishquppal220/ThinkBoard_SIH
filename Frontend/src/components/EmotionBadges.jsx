import React from 'react';
import {
	Heart,
	Smile,
	Frown,
	Meh,
	AlertTriangle,
	Zap,
	Star,
	Brain,
	Sun,
	Cloud,
} from 'lucide-react';

const EmotionBadges = ({ emotions = [], maxDisplay = 5 }) => {
	if (!emotions || emotions.length === 0) {
		return null;
	}

	// Emotion mapping with colors and icons
	const emotionConfig = {
		// Positive emotions
		happy: { color: 'badge-success', icon: Smile, label: 'Happy' },
		joy: { color: 'badge-success', icon: Smile, label: 'Joy' },
		excited: { color: 'badge-warning', icon: Zap, label: 'Excited' },
		love: { color: 'badge-error', icon: Heart, label: 'Love' },
		grateful: { color: 'badge-success', icon: Star, label: 'Grateful' },
		content: { color: 'badge-info', icon: Sun, label: 'Content' },
		confident: { color: 'badge-primary', icon: Star, label: 'Confident' },
		hopeful: { color: 'badge-accent', icon: Sun, label: 'Hopeful' },

		// Negative emotions
		sad: { color: 'badge-neutral', icon: Frown, label: 'Sad' },
		angry: { color: 'badge-error', icon: AlertTriangle, label: 'Angry' },
		anxious: { color: 'badge-warning', icon: AlertTriangle, label: 'Anxious' },
		stressed: { color: 'badge-error', icon: Brain, label: 'Stressed' },
		lonely: { color: 'badge-neutral', icon: Cloud, label: 'Lonely' },
		worried: { color: 'badge-warning', icon: AlertTriangle, label: 'Worried' },
		frustrated: { color: 'badge-error', icon: Frown, label: 'Frustrated' },

		// Neutral emotions
		neutral: { color: 'badge-ghost', icon: Meh, label: 'Neutral' },
		calm: { color: 'badge-info', icon: Sun, label: 'Calm' },
		tired: { color: 'badge-neutral', icon: Cloud, label: 'Tired' },

		// Default fallback
		default: { color: 'badge-ghost', icon: Brain, label: 'Unknown' },
	};

	// Get emotion config or default
	const getEmotionConfig = (emotion) => {
		const normalizedEmotion = emotion.toLowerCase().trim();
		return (
			emotionConfig[normalizedEmotion] || {
				...emotionConfig.default,
				label: emotion, // Use the original emotion name instead of 'Unknown'
			}
		);
	};

	// Display only first few emotions to avoid clutter
	const displayEmotions = emotions.slice(0, maxDisplay);
	const hasMore = emotions.length > maxDisplay;

	return (
		<div className='flex flex-wrap items-center gap-1 mt-2'>
			{displayEmotions.map((emotion, index) => {
				const config = getEmotionConfig(emotion);
				const IconComponent = config.icon;

				return (
					<div
						key={`${emotion}-${index}`}
						className={`badge ${config.color} badge-sm flex items-center gap-1 px-2 py-1`}
						title={`Emotion: ${config.label}`}
					>
						<IconComponent className='w-3 h-3' />
						<span className='text-xs capitalize'>{config.label}</span>
					</div>
				);
			})}

			{hasMore && (
				<div className='badge badge-ghost badge-sm'>
					<span className='text-xs'>+{emotions.length - maxDisplay} more</span>
				</div>
			)}

			{emotions.length === 0 && (
				<div className='badge badge-ghost badge-sm'>
					<Brain className='w-3 h-3 mr-1' />
					<span className='text-xs'>No emotions detected</span>
				</div>
			)}
		</div>
	);
};

export default EmotionBadges;
