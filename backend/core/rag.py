import os

# Explicitly set git path for Windows environments
os.environ["GIT_PYTHON_GIT_EXECUTABLE"] = r"C:\Program Files\Git\cmd\git.exe"

import shutil
import tempfile
import logging
from typing import List, Dict, Any

from git import Repo
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import Language, RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Setup global embeddings and vector store directory
EMBEDDINGS = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
CHROMA_PERSIST_DIR = os.path.join(os.getcwd(), "chroma_db")

def get_collection_name(repo_url: str) -> str:
    """Normalize repo url to a valid Chroma collection name."""
    name = repo_url.split("/")[-1].replace(".git", "")
    # Chroma requires collection names to be 3-63 characters, alphanumeric or underscores/hyphens.
    name = "".join(c if c.isalnum() else "_" for c in name)
    if len(name) < 3:
        name += "_repo"
    return name[:63]

def ingest_repo(repo_url: str, force_reindex: bool = False) -> Chroma:
    """
    Clones the repo (if remote) or uses local path, chunks AST, and stores in ChromaDB.
    """
    collection_name = get_collection_name(repo_url)
    
    db = Chroma(
        collection_name=collection_name,
        embedding_function=EMBEDDINGS,
        persist_directory=CHROMA_PERSIST_DIR
    )
    
    # Check if already populated
    if not force_reindex:
        try:
            if db._collection.count() > 0:
                logger.info(f"Repo {repo_url} already indexed in {collection_name} with {db._collection.count()} chunks.")
                return db
        except Exception as e:
            pass
            
    logger.info(f"Ingesting repo {repo_url} into collection {collection_name}...")
    
    tmp_dir = tempfile.mkdtemp()
    try:
        if repo_url.startswith("http") or repo_url.startswith("git@"):
            logger.info(f"Cloning {repo_url} to {tmp_dir}")
            env = {}
            if "GITHUB_TOKEN" in os.environ:
                # Insert token into https url
                if repo_url.startswith("https://github.com"):
                    token = os.environ["GITHUB_TOKEN"]
                    auth_url = repo_url.replace("https://", f"https://{token}@")
                    Repo.clone_from(auth_url, tmp_dir, env=env)
                else:
                    Repo.clone_from(repo_url, tmp_dir, env=env)
            else:
                Repo.clone_from(repo_url, tmp_dir, env=env)
            repo_path = tmp_dir
        else:
            # Assume local path
            repo_path = repo_url

        documents = []
        
        # Supported languages and their parsers
        parsers = {
            ".py": Language.PYTHON,
            ".js": Language.JS,
            ".ts": Language.TS,
            ".html": Language.HTML,
        }

        for root, dirs, files in os.walk(repo_path):
            if ".git" in root or "node_modules" in root or "venv" in root or "__pycache__" in root:
                continue
                
            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in parsers:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, repo_path)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                            
                        splitter = RecursiveCharacterTextSplitter.from_language(
                            language=parsers[ext], chunk_size=1000, chunk_overlap=100
                        )
                        chunks = splitter.create_documents(
                            texts=[content], 
                            metadatas=[{"source": rel_path, "language": str(parsers[ext])}]
                        )
                        documents.extend(chunks)
                    except Exception as e:
                        logger.warning(f"Failed to parse {file_path}: {e}")

        if documents:
            logger.info(f"Adding {len(documents)} chunks to Chroma...")
            # Add in batches to avoid max batch size issues
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                db.add_documents(documents[i:i+batch_size])
            logger.info(f"Successfully indexed {repo_url}")
        else:
            logger.warning("No code files found to ingest.")
            
        return db

    finally:
        if tmp_dir != repo_url:
            shutil.rmtree(tmp_dir, ignore_errors=True)

def retrieve_context(repo_url: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve top_k chunks for a given query from a given repo.
    """
    try:
        db = ingest_repo(repo_url)
        results = db.similarity_search(query, k=top_k)
        
        context_chunks = []
        for r in results:
            context_chunks.append({
                "source": r.metadata.get("source", "Unknown"),
                "content": r.page_content
            })
        return context_chunks
    except Exception as e:
        logger.error(f"RAG Retrieval failed: {e}")
        return []
