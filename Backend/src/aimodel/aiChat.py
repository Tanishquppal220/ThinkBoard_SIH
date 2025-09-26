import os
import asyncio
from typing import Optional
import google.generativeai as genai
from fastapi import HTTPException
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiChatBot:
    def __init__(self):
        """Initialize the Gemini AI chatbot"""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        # Use the newest stable model
        self.model = genai.GenerativeModel('gemini-2.0-flash')

        # Initialize chat session
        self.chat_session = None

    def initialize_chat(self):
        """Initialize a new chat session"""
        try:
            self.chat_session = self.model.start_chat(history=[])
            logger.info("Chat session initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize chat session: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to initialize chat session")

    async def send_message(self, message: str) -> str:
        """
        Send a message to Gemini AI and get response

        Args:
            message (str): The user's message

        Returns:
            str: The AI's response
        """
        try:
            if not self.chat_session:
                self.initialize_chat()

            # Send message and get response
            response = await asyncio.to_thread(
                self.chat_session.send_message,
                message
            )

            # Extract text from response
            response_text = response.text
            logger.info(f"Successfully got response from Gemini API")

            return response_text

        except Exception as e:
            logger.error(f"Error sending message to Gemini API: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get response from AI: {str(e)}"
            )

    def clear_chat_history(self):
        """Clear the chat history and start a new session"""
        try:
            self.initialize_chat()
            logger.info("Chat history cleared successfully")
        except Exception as e:
            logger.error(f"Failed to clear chat history: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to clear chat history")


# Global instance
gemini_bot = None


def get_gemini_bot() -> GeminiChatBot:
    """Get or create the global Gemini bot instance"""
    global gemini_bot
    if gemini_bot is None:
        gemini_bot = GeminiChatBot()
    return gemini_bot


async def chat_with_ai(message: str, user_id: Optional[str] = None, user_context: Optional[dict] = None) -> dict:
    """
    Main function to chat with AI with personalization

    Args:
        message (str): User's message
        user_id (str, optional): User identifier for session management
        user_context (dict, optional): User context data from MongoDB

    Returns:
        dict: Response containing the AI's reply and metadata
    """
    try:
        if not message or not message.strip():
            raise HTTPException(
                status_code=400, detail="Message cannot be empty")

        # Get the bot instance
        bot = get_gemini_bot()

        # Create personalized prompt with user context
        personalized_message = create_personalized_prompt(message.strip(), user_context)

        # Send message and get response
        ai_response = await bot.send_message(personalized_message)

        return {
            "success": True,
            "response": ai_response,
            "user_message": message,
            "user_id": user_id,
            "model": "gemini-2.0-flash",
            "personalized": bool(user_context)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat_with_ai: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your request"
        )


async def simple_ai_chat(prompt: str) -> str:
    """
    Simplified AI chat function for quick responses

    Args:
        prompt (str): The user's prompt

    Returns:
        str: AI response text
    """
    try:
        result = await chat_with_ai(prompt)
        return result["response"]
    except Exception as e:
        return f"Error: {str(e)}"


def list_available_models() -> list:
    """List all available Gemini models"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return []

        genai.configure(api_key=api_key)
        models = genai.list_models()

        model_names = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                model_names.append(model.name)

        return model_names
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        return []

# Health check function


def create_personalized_prompt(message: str, user_context: Optional[dict] = None) -> str:
    """
    Create a personalized prompt based on user context
    
    Args:
        message (str): Original user message
        user_context (dict, optional): User context from MongoDB
        
    Returns:
        str: Personalized prompt
    """
    if not user_context:
        # Return original message if no context provided
        return f"""You are ThinkBoard AI, a mental health assistant focused on emotional wellbeing and support. 
        
User's message: {message}

Please provide helpful, empathetic, and supportive responses related to mental health and emotional wellness."""

    # Build context information
    context_parts = ["You are ThinkBoard AI, a mental health assistant. Here's information about the user:"]
    
    # Add user name if available
    if user_context.get('name'):
        context_parts.append(f"- User's name: {user_context['name']}")
    
    # Add recent emotion history
    if user_context.get('emotionHistory') and len(user_context['emotionHistory']) > 0:
        recent_emotions = user_context['emotionHistory'][-5:]  # Last 5 emotions
        emotion_summary = []
        for emotion_entry in recent_emotions:
            timestamp = emotion_entry.get('timestamp', 'Unknown time')
            emotion = emotion_entry.get('emotion', 'Unknown')
            source = emotion_entry.get('source', 'Unknown')
            
            # Format timestamp if it's a datetime string
            try:
                if isinstance(timestamp, str):
                    from datetime import datetime
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    timestamp = dt.strftime("%Y-%m-%d")
            except:
                pass
                
            emotion_summary.append(f"{emotion} ({source}) on {timestamp}")
        
        context_parts.append(f"- Recent emotional states: {', '.join(emotion_summary)}")
    
    # Add mental health scores if available
    if user_context.get('emotionHistory'):
        latest_entry = user_context['emotionHistory'][-1] if user_context['emotionHistory'] else {}
        if latest_entry.get('phq9_score') is not None:
            context_parts.append(f"- Latest PHQ-9 score: {latest_entry['phq9_score']} (depression screening)")
        if latest_entry.get('gad7_score') is not None:
            context_parts.append(f"- Latest GAD-7 score: {latest_entry['gad7_score']} (anxiety screening)")
    
    # Add recent notes/journal entries if available
    if user_context.get('recentNotes') and len(user_context['recentNotes']) > 0:
        note_themes = []
        for note in user_context['recentNotes'][:3]:  # Last 3 notes
            if note.get('emotions'):
                note_themes.extend(note['emotions'])
        
        if note_themes:
            unique_themes = list(set(note_themes))
            context_parts.append(f"- Recent journal themes: {', '.join(unique_themes)}")
    
    # Add location context if available (for local resources)
    if user_context.get('location'):
        context_parts.append("- User has location data available for local mental health resources")
    
    # Combine context with user message
    full_context = "\n".join(context_parts)
    
    personalized_prompt = f"""{full_context}

Based on this context, please provide personalized, empathetic support. Consider their emotional history and current state when responding.

User's current message: {message}

Guidelines:
- Be warm, empathetic, and supportive
- Reference their context when appropriate
- Provide actionable mental health advice
- Suggest coping strategies based on their emotional patterns
- If scores indicate concerning levels, gently suggest professional support
- Keep responses helpful but not overly clinical"""

    return personalized_prompt


def check_api_health() -> dict:
    """Check if the Gemini API is accessible"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "status": "error",
                "message": "GEMINI_API_KEY not configured"
            }

        genai.configure(api_key=api_key)
        # Try to create a model instance
        model = genai.GenerativeModel('gemini-2.0-flash')

        return {
            "status": "healthy",
            "message": "Gemini API is accessible",
            "model": "gemini-2.0-flash"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gemini API health check failed: {str(e)}"
        }


if __name__ == "__main__":
    # Test the chat function
    async def test_chat():
        try:
            print("Testing AI chat...")

            # First, list available models
            print("Available models:")
            models = list_available_models()
            for model in models:
                print(f"  - {model}")

            print("\nTesting chat...")
            response = await simple_ai_chat("Hello! How are you?")
            print(f"AI Response: {response}")
        except Exception as e:
            print(f"Test failed: {e}")
            print("\nDebug: Checking available models...")
            models = list_available_models()
            if models:
                print("Available models:")
                for model in models:
                    print(f"  - {model}")
            else:
                print("No models found or API key issue")

    # Run test
    asyncio.run(test_chat())
