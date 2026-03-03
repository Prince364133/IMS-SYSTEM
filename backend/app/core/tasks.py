from .celery_app import celery_app
import time

@celery_app.task(name="test_task")
def test_task(name: str):
    """A sample background task."""
    print(f"Starting test task for {name}")
    time.sleep(5)
    print(f"Finished test task for {name}")
    return f"Hello {name}, task completed!"

@celery_app.task(name="send_notification")
def send_notification(user_id: str, message: str):
    """Simulates sending a notification."""
    print(f"Sending notification to {user_id}: {message}")
    # In a real app, integrate with Firebase or Email service here
    return True
