"""
core/llm.py — Model-Agnostic LLM client factory using litellm.
Loads agent-specific models from models.yaml.
"""
import logging
import yaml
import os
from pathlib import Path
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_community.chat_models import ChatLiteLLM
from backend.config import settings

logger = logging.getLogger(__name__)

# Load models config once
MODELS_YAML_PATH = Path(__file__).parent.parent / "models.yaml"

def _load_models_config():
    if not MODELS_YAML_PATH.exists():
        logger.warning(f"{MODELS_YAML_PATH} not found. Using default fallback models.")
        return {}
    with open(MODELS_YAML_PATH, "r") as f:
        return yaml.safe_load(f) or {}

MODELS_CONFIG = _load_models_config()

def get_llm(agent_name: str = "coder", temperature: float = 0.3) -> BaseChatModel:
    """
    Returns a litellm-based LangChain chat model tailored for the specific agent.
    
    Args:
        agent_name: The name of the agent (e.g., 'planner', 'coder', 'tester', 'reviewer').
        temperature: Sampling temperature.
    
    Returns:
        A ChatLiteLLM instance with fallbacks configured.
    """
    # Get config for this agent, fallback to a safe default if not found
    agent_config = MODELS_CONFIG.get(agent_name, {})
    primary_model_name = agent_config.get("primary", "groq/llama-3.3-70b-versatile")
    fallback_model_names = agent_config.get("fallback", ["groq/llama-3.1-8b-instant"])

    # Ensure api keys are set in the environment because litellm relies on them
    if settings.groq_api_key:
        os.environ["GROQ_API_KEY"] = settings.groq_api_key
    if settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key

    logger.info(f"[{agent_name}] Initializing LLM primary={primary_model_name}")

    primary_model = ChatLiteLLM(
        model=primary_model_name,
        temperature=temperature,
        max_retries=3,
        timeout=45,
    )

    fallbacks = []
    for fb_name in fallback_model_names:
        fallbacks.append(
            ChatLiteLLM(
                model=fb_name,
                temperature=temperature,
                max_retries=2,
                timeout=45,
            )
        )

    if fallbacks:
        return primary_model.with_fallbacks(fallbacks)
    return primary_model
