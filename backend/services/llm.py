"""Shared LangChain chat models for the agents.

Everything still runs locally through Ollama; LangChain adds prompt templates,
LCEL chains (prompt | model | parser) and schema-validated structured output.
"""
from langchain_ollama import ChatOllama

LLM_MODEL = "mistral"

# Deterministic model for classification / extraction (triage, tone profile).
llm_precise = ChatOllama(model=LLM_MODEL, temperature=0)

# Slightly creative model for writing (drafts).
llm_writer = ChatOllama(model=LLM_MODEL, temperature=0.4)
