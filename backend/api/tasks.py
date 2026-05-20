from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

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