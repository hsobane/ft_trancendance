from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.utils import timezone

class ChatRoom(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_room_user1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_room_user2")
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']
        ordering = ['modified_at']

    def get_other_user(self, user):
        return self.user2 if user == self.user1 else self.user1

class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_message")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def get_messages(self):
        return self.objects.all().order_by('created_at')
    
    def save(self, *args, **kwargs):
        self.chat_room.modified_at = timezone.now()
        self.chat_room.save()
        super().save(*args, **kwargs)