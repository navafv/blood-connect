import threading
import logging
import time
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from .models import Donor

logger = logging.getLogger(__name__)

def send_async_email(subject, plain_message, recipient_list, html_message=None):
    """
    Spawns a background thread with an exponential backoff retry loop.
    This guarantees high delivery rates without needing a Redis queue.
    """
    def send_email_thread():
        max_retries = 3
        backoff_multiplier = 2
        
        for attempt in range(max_retries):
            try:
                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_list,
                    html_message=html_message,
                    fail_silently=False,
                )
                logger.info(f"Successfully sent async email to {recipient_list}")
                return # Exit the thread gracefully on success
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {recipient_list}: {str(e)}")
                
                if attempt < max_retries - 1:
                    # Exponential backoff: Sleep for 1s, then 2s, etc. before trying again
                    time.sleep(backoff_multiplier ** attempt)
                else:
                    logger.critical(f"All {max_retries} attempts failed. Email to {recipient_list} dropped.")

    # Spawn and start the background thread
    thread = threading.Thread(target=send_email_thread)
    thread.daemon = True # Ensures the thread closes if the main server restarts
    thread.start()

def purge_old_deleted_records():
    try:
        cutoff_date = timezone.now() - relativedelta(months=1)
        Donor.objects.filter(is_deleted=True, deleted_at__lt=cutoff_date).delete()
        logger.info("Successfully purged old records.")
    except Exception as e:
        logger.error(f"Failed to purge records: {str(e)}")