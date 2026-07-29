from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
import logging

logger = logging.getLogger(__name__)

# Configure the scheduler
jobstores = {
    'default': MemoryJobStore()
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

def start_scheduler():
    """Start the APScheduler if it's not already running."""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shutdown the APScheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down successfully.")
