import asyncio
import json
import os
import sys

from backend.core.state import AgentState
from backend.core.orchestrator import execution_pipeline, initial_pipeline
from backend.storage.memory_store import job_store

EVAL_ISSUES = [
    {
        "id": "eval-1",
        "problem": "Write a python function that adds two numbers and a test for it."
    },
    {
        "id": "eval-2",
        "problem": "Create a Flask route that returns 'Hello World'."
    },
    {
        "id": "eval-3",
        "problem": "Fix a zero division error in: def div(a, b): return a / b"
    }
    # Add more to reach 15-20 for a real run
]

async def run_evaluation():
    print(f"Starting evaluation of {len(EVAL_ISSUES)} issues...")
    results = []

    for issue in EVAL_ISSUES:
        job_id = issue["id"]
        problem = issue["problem"]
        
        print(f"\n--- Running Issue {job_id} ---")
        
        initial_state: AgentState = {
            "job_id": job_id,
            "problem": problem,
            "plan": None,
            "code": None,
            "tests": None,
            "review": None,
            "status": "pending",
            "error": None,
            "current_agent": None,
            "retries": 0,
            "test_passed": None,
            "test_output": None,
            "review_risk_score": None,
            "review_confidence": None,
            "total_tokens": 0,
            "total_cost": 0.0,
        }

        # Run initial (Planner)
        try:
            state_after_plan = await asyncio.to_thread(initial_pipeline.invoke, initial_state)
            
            # Approve automatically for evaluation
            state_after_plan["status"] = "coding"
            job_store.update(job_id, dict(state_after_plan))
            
            # Run execution
            final_state = await asyncio.to_thread(execution_pipeline.invoke, state_after_plan)
            if final_state.get('status') not in ['error', 'done']:
                final_state['status'] = 'done'
            
            job_store.update(job_id, dict(final_state))
            
            # Collect metrics
            passed = final_state.get("test_passed", False)
            retries = final_state.get("retries", 0)
            cost = final_state.get("total_cost", 0.0)
            risk = final_state.get("review_risk_score", "N/A")
            
            print(f"[{job_id}] Result: {'PASS' if passed else 'FAIL'} | Retries: {retries} | Risk: {risk} | Cost: ${cost:.5f}")
            results.append({
                "id": job_id,
                "passed": passed,
                "retries": retries,
                "cost": cost,
                "tokens": final_state.get("total_tokens", 0)
            })
            
        except Exception as e:
            print(f"[{job_id}] Failed with error: {e}")
            results.append({
                "id": job_id,
                "passed": False,
                "retries": 0,
                "cost": 0,
                "tokens": 0,
                "error": str(e)
            })

    # Summary
    successes = sum(1 for r in results if r["passed"])
    total_retries = sum(r["retries"] for r in results)
    total_cost = sum(r["cost"] for r in results)
    
    print("\n=== EVALUATION SUMMARY ===")
    print(f"Total Issues: {len(results)}")
    print(f"Success Rate: {(successes / len(results)) * 100:.1f}%")
    print(f"Average Retries: {total_retries / len(results):.2f}")
    print(f"Total Cost: ${total_cost:.5f}")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
