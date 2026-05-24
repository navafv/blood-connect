from celery import shared_task
from django.conf import settings
from django.utils import timezone
from .models import Donor, SystemLog
from django.core.mail import send_mail
from dateutil.relativedelta import relativedelta

@shared_task
def send_async_email(subject, plain_message, recipient_list, html_message=None):
    """
    Sends an email asynchronously in the background using Celery.
    """
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        return f"Email sent successfully to {recipient_list}"
    except Exception as e:
        # Celery will log this error in the worker terminal
        return f"Failed to send email to {recipient_list}. Error: {e}"
    
@shared_task
def purge_old_deleted_records():
    """
    Permanently removes donor records that have been soft-deleted 
    for more than 7 exact years (Retention Policy).
    """
    seven_years_ago = timezone.now() - relativedelta(years=7)
    
    # Query all records marked is_deleted=True older than 7 years
    old_records = Donor.all_objects.filter(
        is_deleted=True, 
        deleted_at__lt=seven_years_ago
    )
    
    count = old_records.count()
    if count > 0:
        SystemLog.objects.create(
            level='INFO',
            source='SYSTEM',
            message=f"Purged {count} donor records older than 7 years."
        )
        old_records.delete() 
        return f"Successfully purged {count} old medical donor records."
    
    return "No records found for purging."