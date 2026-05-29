import threading
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from .models import Donor # Assuming you purge donors or records

logger = logging.getLogger(__name__)

def send_async_email(subject, plain_message, recipient_list, html_message=None):
    def send_email_thread():
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send async email to {recipient_list}: {str(e)}")

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