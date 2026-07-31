"""
Job Market Scanner Subagent.
Scores job opportunities against target salary, remote work preferences, and skills.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, TaskAction, AgentStatus


class JobPosting(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    is_remote: bool
    salary_min: float
    salary_max: float
    skills_required: List[str]
    url: str = "https://linkedin.com/jobs"


class JobScannerSubagent(BaseOOAgent):
    """
    Subagent responsible for scouting job opportunities, scoring compatibility,
    and creating Task Cards for high-match roles.
    """

    def __init__(self):
        super().__init__(
            node_id="job_scanner_subagent",
            name="Job Market Scanner Subagent",
            agent_type="Subagent"
        )
        # Explicit Object State
        self.scanned_jobs_count: int = 0
        self.matched_jobs_count: int = 0
        self.min_salary_threshold: float = 160000.0
        self.require_remote: bool = True
        self.preferred_keywords: List[str] = ["AI", "Agent", "Python", "Architect", "Lead"]

    @agentic_action(description="Calculates compatibility score (0-100%) for a job posting")
    def score_job_posting(self, job: JobPosting) -> float:
        score = 50.0
        if job.salary_max >= self.min_salary_threshold:
            score += 25.0
        if job.is_remote and self.require_remote:
            score += 15.0
        
        matches = sum(1 for kw in self.preferred_keywords if any(kw.lower() in req.lower() for req in job.skills_required + [job.title]))
        score += min(10.0, matches * 5.0)
        return min(100.0, score)

    @agentic_action(description="Evaluates job posting and creates Task Card if score exceeds threshold")
    def evaluate_job(self, job: JobPosting) -> Optional[Task]:
        self.set_status(AgentStatus.RUNNING, active_step=f"Evaluating job: {job.title} at {job.company}")
        self.scanned_jobs_count += 1
        self.log(f"Scouting job: {job.title} ({job.company})")

        compatibility_score = self.score_job_posting(job)
        meets_salary = job.salary_max >= self.min_salary_threshold
        meets_remote = (not self.require_remote) or job.is_remote

        if compatibility_score >= 70.0 and meets_salary and meets_remote:
            self.matched_jobs_count += 1
            
            task = Task(
                task_id=f"job_{job.job_id}",
                title=f"Job Opportunity: {job.title} @ {job.company}",
                description=(
                    f"Salary Range: ${job.salary_min:,.0f} - ${job.salary_max:,.0f}\n"
                    f"Location: {'Remote' if job.is_remote else job.location}\n"
                    f"Match Score: {compatibility_score:.0f}%\n"
                    f"Required Skills: {', '.join(job.skills_required)}"
                ),
                creator="JobScannerSubagent",
                assignee_type=AssigneeType.HUMAN,
                assignee_id="human_user",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH if compatibility_score >= 85.0 else TaskPriority.MEDIUM,
                ui_schema={
                    "card_template": "job_match_card",
                    "company": job.company,
                    "match_score": f"{compatibility_score:.0f}%",
                    "salary_range": f"${job.salary_min/1000:.0f}k - ${job.salary_max/1000:.0f}k",
                    "job_url": job.url
                },
                actions=[
                    TaskAction(label="Apply / View Job", action_key="VIEW_JOB", style="primary", payload={"url": job.url}),
                    TaskAction(label="Dismiss", action_key="DISMISS_JOB", style="secondary")
                ]
            )
            task.add_log(
                author="JobScannerSubagent",
                message=f"Job match score ({compatibility_score:.0f}%) meets requirements."
            )
            self.log(f"Matched Job Found: {job.title} @ {job.company} (Score: {compatibility_score:.0f}%)")
            self.set_status(AgentStatus.IDLE, active_step="Idle")
            self.sync_node_state()
            return task

        self.set_status(AgentStatus.IDLE, active_step="Idle")
        self.sync_node_state()
        return None
