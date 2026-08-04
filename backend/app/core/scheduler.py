import logging

logger = logging.getLogger(__name__)

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.jobstores.memory import MemoryJobStore

    jobstores = {
        'default': MemoryJobStore()
    }
    scheduler = AsyncIOScheduler(jobstores=jobstores)
except ImportError:
    class DummyScheduler:
        running = False
        def start(self):
            pass
        def shutdown(self):
            pass
        def add_job(self, *args, **kwargs):
            logger.warning("APScheduler is not installed; job not scheduled.")
    scheduler = DummyScheduler()

def start_scheduler():
    """Start the APScheduler if it's not already running."""
    if hasattr(scheduler, 'running') and not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shutdown the APScheduler gracefully."""
    if hasattr(scheduler, 'running') and scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down successfully.")
