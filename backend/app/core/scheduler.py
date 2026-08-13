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
        from app.services.media_asset_service import process_media_cleanup_jobs
        scheduler.add_job(
            process_media_cleanup_jobs,
            "interval",
            seconds=60,
            id="media-asset-cleanup",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shutdown the APScheduler gracefully."""
    if hasattr(scheduler, 'running') and scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down successfully.")
