"""
core/llm.py — LLM client factory.
Returns the correct LangChain chat model based on config.
"""
import logging
from langchain_core.language_models.chat_models import BaseChatModel
from backend.config import settings

logger = logging.getLogger(__name__)


def get_llm(temperature: float = 0.3) -> BaseChatModel:
    """
    Returns a LangChain-compatible chat model based on LLM_PROVIDER setting.
    
    Args:
        temperature: Sampling temperature (lower = more deterministic).
    
    Returns:
        A configured ChatGroq or ChatOpenAI instance.
    
    Raises:
        ValueError: If provider config is invalid or API key is missing.
    """
    provider = settings.llm_provider

    if provider == "groq":
        if not settings.groq_api_key:
            raise ValueError(
                "GROQ_API_KEY is not set. "
                "Add it to your .env file or set LLM_PROVIDER=openai."
            )
        from langchain_groq import ChatGroq
        logger.info(f"Using Groq LLM: {settings.groq_model}")
        
        primary_model = ChatGroq(
            api_key=settings.groq_api_key,
            model_name=settings.groq_model,
            temperature=temperature,
            max_retries=3,
            timeout=45,
        )
        
        # Add a fallback to a smaller, faster model in case the versatile model is over capacity (503 error)
        fallback_model = ChatGroq(
            api_key=settings.groq_api_key,
            model_name="llama-3.1-8b-instant",
            temperature=temperature,
            max_retries=3,
            timeout=45,
        )
        
        return primary_model.with_fallbacks([fallback_model])

    elif provider == "openai":
        if not settings.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is not set. "
                "Add it to your .env file."
            )
        from langchain_openai import ChatOpenAI
        logger.info(f"Using OpenAI LLM: {settings.openai_model}")
        return ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=temperature,
            max_retries=2,
            timeout=45,
        )

    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {provider!r}. Use 'groq' or 'openai'.")
