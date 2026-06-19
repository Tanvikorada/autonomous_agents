"""
agents/tester.py — Tester Agent.
Generates pytest test cases for code produced by the Coder Agent.
"""
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from backend.core.llm import get_llm
from backend.core.state import AgentState
from backend.storage.memory_store import job_store

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a QA engineer specializing in Python test automation.

Your job is to write comprehensive pytest test cases for the given code.

Rules:
- Write tests using pytest framework (no unittest).
- Cover: happy path, edge cases, and error/exception cases.
- Use clear test function names that describe what is being tested (test_should_...).
- Mock external dependencies (APIs, databases, file system) using pytest-mock or unittest.mock.
- Do NOT include any explanation or markdown outside the code.
- Output ONLY the test code. Start with imports.
- Aim for at least 5-8 meaningful test cases.
"""


def run_tester(state: AgentState) -> AgentState:
    """
    Tester Agent node for LangGraph.
    
    Takes the code from state and generates pytest test cases.
    Returns updated state with `tests` populated.
    """
    job_id = state["job_id"]
    problem = state["problem"]
    code = state.get("code") or ""

    logger.info(f"[{job_id}] Tester Agent starting...")
    job_store.update(job_id, {"status": "testing", "current_agent": "Tester"})

    if not code:
        logger.warning(f"[{job_id}] No code to test. Generating tests from problem only.")

    try:
        llm = get_llm(agent_name="tester", temperature=0.2)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"Problem Context:\n{problem}\n\n"
                    f"Code to Test:\n```python\n{code}\n```\n\n"
                    "Write comprehensive pytest test cases for this code."
                )
            ),
        ]

        response = llm.invoke(messages)
        tests = response.content.strip()

        token_usage = response.response_metadata.get("token_usage", {})
        tokens_used = token_usage.get("total_tokens", len(tests) // 3)
        cost = tokens_used * 0.000005
        
        total_tokens = state.get("total_tokens", 0) + tokens_used
        total_cost = state.get("total_cost", 0.0) + cost
        
        agent_metrics = state.get("agent_metrics") or {}
        agent_metrics["tester"] = {"tokens": tokens_used, "cost": cost}

        # Strip markdown code fences if present
        if tests.startswith("```"):
            lines = tests.split("\n")
            tests = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        logger.info(f"[{job_id}] Tester produced {len(tests)} characters of test code. Tokens used: {tokens_used}")
        
        # Execute the generated tests using a secure Docker sandbox
        import tempfile
        import subprocess
        import os
        
        test_passed = False
        test_output = "No tests were run."
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # write code to module.py
            with open(os.path.join(tmpdir, "module.py"), "w") as f:
                f.write(code)
            # write tests to test_module.py
            with open(os.path.join(tmpdir, "test_module.py"), "w") as f:
                f.write(tests)
                
            # Create Dockerfile for the sandbox
            dockerfile_content = """FROM python:3.11-slim
WORKDIR /workspace
RUN pip install --no-cache-dir pytest pytest-mock
COPY . /workspace
CMD ["python", "-m", "pytest", "test_module.py", "-v"]
"""
            with open(os.path.join(tmpdir, "Dockerfile"), "w") as f:
                f.write(dockerfile_content)
                
            image_tag = f"dayos-sandbox-{job_id.lower()}"
            
            try:
                # Build the image (has network access to download pytest)
                build_result = subprocess.run(
                    ["docker", "build", "-t", image_tag, "."],
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if build_result.returncode != 0:
                    test_output = f"Sandbox Build Failed:\n{build_result.stderr}"
                    test_passed = False
                else:
                    # Run the container (network=none enforces isolation)
                    run_result = subprocess.run(
                        [
                            "docker", "run", "--rm", 
                            "--network=none", 
                            "--memory=512m", 
                            "--cpus=0.5", 
                            image_tag
                        ],
                        cwd=tmpdir,
                        capture_output=True,
                        text=True,
                        timeout=30 # Execution timeout
                    )
                    test_passed = run_result.returncode == 0
                    test_output = run_result.stdout + "\n" + run_result.stderr
            except subprocess.TimeoutExpired as e:
                test_passed = False
                test_output = f"Sandbox Execution Timeout: Execution exceeded time limit.\n{e}"
            except Exception as e:
                test_passed = False
                test_output = f"Sandbox Execution Error: {e}"
            finally:
                # Cleanup the ephemeral image
                subprocess.run(["docker", "rmi", "-f", image_tag], capture_output=True)
            
        logger.info(f"[{job_id}] Tests execution finished. Passed: {test_passed}")
        
        # Increment retries if failed
        new_retries = state.get("retries", 0)
        if not test_passed:
            new_retries += 1
            
        # Update job store
        update_data = {
            "tests": tests,
            "test_passed": test_passed,
            "test_output": test_output,
            "retries": new_retries,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "agent_metrics": agent_metrics
        }
        job_store.update(job_id, update_data)

        return {**state, **update_data, "current_agent": "Tester"}

    except Exception as e:
        logger.error(f"[{job_id}] Tester Agent error: {e}")
        job_store.update(job_id, {"status": "error", "error": str(e)})
        return {**state, "status": "error", "error": str(e)}
