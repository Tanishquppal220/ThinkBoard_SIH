import React, { useState, useRef, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // You can change this to other themes
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import Navbar from '../components/Navbar';

const AiChat = () => {
	const [inputText, setInputText] = useState('');
	const [messages, setMessages] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [userContext, setUserContext] = useState(null);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	// Get user data from context
	const { userData, isLoggedin } = useContext(AppContent);
	const backendUrl =
		import.meta.env.MODE === 'development' ? 'http://localhost:5001' : '';

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Fetch user context when component mounts
	useEffect(() => {
		const fetchUserContext = async () => {
			if (userData && userData._id && isLoggedin) {
				try {
					const response = await axios.get(
						`${backendUrl}/api/user/context/${userData._id}`
					);
					if (response.data.success) {
						setUserContext(response.data.userContext);
					}
				} catch (error) {
					console.warn(
						'Could not fetch user context for personalization:',
						error
					);
					// Don't show error to user, just proceed without personalization
				}
			}
		};

		fetchUserContext();
	}, [userData, isLoggedin, backendUrl]);

	const handleSubmit = async () => {
		if (!inputText.trim()) return;

		// Add user message to chat
		const userMessage = {
			id: Date.now(),
			text: inputText,
			sender: 'user',
			timestamp: new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			}),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputText('');
		setIsLoading(true);

		try {
			// Connect to our FastAPI backend with user context for personalization
			const requestBody = {
				message: inputText,
				user_id: userData?._id || `guest_${Date.now()}`,
			};

			// Include user context if available for personalized responses
			if (userContext && isLoggedin) {
				requestBody.user_context = userContext;
			}

			const response = await fetch('http://localhost:8000/ai-chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				const data = await response.json();

				// Add AI response to chat
				const aiMessage = {
					id: Date.now() + 1,
					text: data.response || 'No response received',
					sender: 'ai',
					timestamp: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
					personalized: data.personalized || false,
				};

				setMessages((prev) => [...prev, aiMessage]);
			} else {
				// Add error message
				const errorMessage = {
					id: Date.now() + 1,
					text: 'Error: Failed to get response from API',
					sender: 'error',
					timestamp: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
				};
				setMessages((prev) => [...prev, errorMessage]);
			}
		} catch (error) {
			// Add error message
			const errorMessage = {
				id: Date.now() + 1,
				text: `Error: ${error.message}`,
				sender: 'error',
				timestamp: new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				}),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const clearChat = () => {
		setMessages([]);
	};

	const MessageBubble = ({ message }) => {
		const isUser = message.sender === 'user';
		const isError = message.sender === 'error';

		return (
			<div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
				<div
					className={`flex max-w-[80%] ${
						isUser ? 'flex-row-reverse' : 'flex-row'
					}`}
				>
					{/* Avatar */}
					<div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
						<div
							className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg ${
								isUser ? 'gradient-bg' : isError ? 'bg-error' : 'bg-primary'
							}`}
						>
							{isUser ? 'U' : isError ? '!' : 'AI'}
						</div>
					</div>

					{/* Message Content */}
					<div
						className={`card shadow-lg rounded-2xl px-5 py-4 border ${
							isUser
								? 'gradient-bg text-white border-primary/20'
								: isError
								? 'bg-error/10 text-error border-error/20'
								: 'bg-base-100 text-base-content border-base-300/50'
						}`}
					>
						<div className='text-sm leading-relaxed ai-message-content'>
							{message.sender === 'ai' && !isError ? (
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeHighlight]}
									components={{
										// Custom styling for markdown elements
										h1: ({ children }) => (
											<h1 className='text-lg font-bold mb-2 text-base-content'>
												{children}
											</h1>
										),
										h2: ({ children }) => (
											<h2 className='text-base font-semibold mb-2 text-base-content'>
												{children}
											</h2>
										),
										h3: ({ children }) => (
											<h3 className='text-sm font-semibold mb-1 text-base-content'>
												{children}
											</h3>
										),
										p: ({ children }) => (
											<p className='mb-2 last:mb-0'>{children}</p>
										),
										ul: ({ children }) => (
											<ul className='list-disc list-inside mb-2 space-y-1'>
												{children}
											</ul>
										),
										ol: ({ children }) => (
											<ol className='list-decimal list-inside mb-2 space-y-1'>
												{children}
											</ol>
										),
										li: ({ children }) => (
											<li className='text-sm'>{children}</li>
										),
										code: ({ inline, className, children, ...props }) => {
											const match = /language-(\w+)/.exec(className || '');
											return !inline && match ? (
												<div className='my-3'>
													<div className='bg-base-200 text-base-content rounded-lg p-3 text-xs font-mono overflow-x-auto'>
														<code className={className} {...props}>
															{children}
														</code>
													</div>
												</div>
											) : (
												<code
													className='bg-base-200 text-base-content px-1 py-0.5 rounded text-xs font-mono'
													{...props}
												>
													{children}
												</code>
											);
										},
										blockquote: ({ children }) => (
											<blockquote className='border-l-4 border-primary pl-3 italic text-base-content/80 my-2'>
												{children}
											</blockquote>
										),
										strong: ({ children }) => (
											<strong className='font-semibold'>{children}</strong>
										),
										em: ({ children }) => (
											<em className='italic'>{children}</em>
										),
										a: ({ href, children }) => (
											<a
												href={href}
												className='text-primary hover:underline'
												target='_blank'
												rel='noopener noreferrer'
											>
												{children}
											</a>
										),
									}}
								>
									{message.text}
								</ReactMarkdown>
							) : (
								<p className='whitespace-pre-wrap'>{message.text}</p>
							)}
						</div>
						<div
							className={`text-xs mt-2 opacity-70 flex items-center justify-between ${
								isUser
									? 'text-white/80'
									: isError
									? 'text-error/80'
									: 'text-base-content/60'
							}`}
						>
							<span>{message.timestamp}</span>
							{message.personalized && !isUser && !isError && (
								<span className='inline-flex items-center gap-1 text-primary'>
									<svg
										className='w-3 h-3'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
									</svg>
									Personalized
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className='h-screen bg-gradient-to-br from-base-200 via-base-300/50 to-base-200 flex flex-col'>
			<Navbar />
			{/* Header */}
			<div className='bg-base-100/95 backdrop-blur-sm border-b border-base-300/50 px-6 py-4 flex justify-between items-center shadow-lg flex-shrink-0'>
				<div>
					<h1 className='text-2xl font-bold gradient-text'>
						ThinkBoard AI Chat
					</h1>
					<div className='flex items-center gap-2'>
						<p className='text-sm text-base-content/60'>
							Powered by Gemini 2.0
						</p>
						{userContext && isLoggedin && (
							<span className='inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full'>
								<svg
									className='w-3 h-3'
									fill='currentColor'
									viewBox='0 0 20 20'
								>
									<path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
								</svg>
								Personalized
							</span>
						)}
					</div>
				</div>
				<button
					onClick={clearChat}
					className='btn btn-ghost btn-sm hover:bg-base-200 text-base-content/70 rounded-xl transition-all duration-200'
				>
					Clear Chat
				</button>
			</div>

			{/* Messages Container */}
			<div className='flex-1 overflow-y-auto px-6 py-4 pb-0'>
				<div className='max-w-4xl mx-auto'>
					{messages.length === 0 ? (
						<div className='flex flex-col items-center justify-center h-full text-center'>
							<div className='relative mb-6'>
								<div className='w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce'>
									<div className='gradient-bg w-12 h-12 rounded-xl flex items-center justify-center'>
										<span className='text-white font-bold text-xl'>AI</span>
									</div>
								</div>
							</div>
							<h3 className='text-2xl font-bold text-base-content mb-2'>
								Welcome to ThinkBoard AI
							</h3>
							<p className='text-base-content/60 mb-8 max-w-md'>
								Start a conversation with our AI assistant. Ask questions, get
								help, or just chat!
							</p>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl'>
								<button
									onClick={() =>
										setInputText('How can you help me with mental health?')
									}
									className='card bg-base-100 hover:bg-base-200 shadow-lg hover:shadow-xl card-hover p-4 text-left border border-base-300/50 rounded-2xl transition-all duration-200'
								>
									<span className='text-sm text-base-content'>
										How can you help me with mental health?
									</span>
								</button>
								<button
									onClick={() =>
										setInputText('Tell me about breathing exercises')
									}
									className='card bg-base-100 hover:bg-base-200 shadow-lg hover:shadow-xl card-hover p-4 text-left border border-base-300/50 rounded-2xl transition-all duration-200'
								>
									<span className='text-sm text-base-content'>
										Tell me about breathing exercises
									</span>
								</button>
								<button
									onClick={() => setInputText('What is ThinkBoard?')}
									className='card bg-base-100 hover:bg-base-200 shadow-lg hover:shadow-xl card-hover p-4 text-left border border-base-300/50 rounded-2xl transition-all duration-200'
								>
									<span className='text-sm text-base-content'>
										What is ThinkBoard?
									</span>
								</button>
								<button
									onClick={() =>
										setInputText('How do I manage stress and anxiety?')
									}
									className='card bg-base-100 hover:bg-base-200 shadow-lg hover:shadow-xl card-hover p-4 text-left border border-base-300/50 rounded-2xl transition-all duration-200'
								>
									<span className='text-sm text-base-content'>
										How do I manage stress and anxiety?
									</span>
								</button>
							</div>
						</div>
					) : (
						<>
							{messages.map((message) => (
								<MessageBubble key={message.id} message={message} />
							))}

							{/* Loading indicator */}
							{isLoading && (
								<div className='flex justify-start mb-6'>
									<div className='flex mr-3'>
										<div className='w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-semibold text-sm shadow-lg'>
											AI
										</div>
									</div>
									<div className='card bg-base-100 shadow-lg rounded-2xl px-5 py-4 border border-base-300/50'>
										<div className='flex space-x-1'>
											<div className='w-2 h-2 bg-primary rounded-full animate-bounce'></div>
											<div
												className='w-2 h-2 bg-primary rounded-full animate-bounce'
												style={{ animationDelay: '0.1s' }}
											></div>
											<div
												className='w-2 h-2 bg-primary rounded-full animate-bounce'
												style={{ animationDelay: '0.2s' }}
											></div>
										</div>
									</div>
								</div>
							)}
						</>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input Area - Sticky at bottom */}
			<div className='sticky bottom-0 bg-base-100/95 backdrop-blur-sm border-t border-base-300/50 px-6 py-4 shadow-lg flex-shrink-0 z-10'>
				<div className='max-w-4xl mx-auto'>
					<div className='flex items-end space-x-3'>
						<div className='flex-1 relative'>
							<textarea
								ref={inputRef}
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='Type your message here... (Press Enter to send, Shift+Enter for new line)'
								className='textarea textarea-bordered w-full resize-none rounded-2xl bg-base-100 focus:border-primary focus:outline-none max-h-32 min-h-[50px] text-base-content placeholder:text-base-content/50'
								rows={1}
								style={{
									scrollbarWidth: 'thin',
									scrollbarColor: 'var(--primary) var(--base-200)',
								}}
							/>
						</div>
						<button
							onClick={handleSubmit}
							disabled={isLoading || !inputText.trim()}
							className='btn btn-primary rounded-2xl px-4 py-3 min-w-[50px] h-[50px] disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl'
						>
							{isLoading ? (
								<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
							) : (
								<svg
									className='w-5 h-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AiChat;
