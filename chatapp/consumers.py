import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Message, ChatRoom
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_pk']
        self.room_group_name = f'chat_room_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('content')
        sender = text_data_json.get('sender_pk')
        room_pk = text_data_json.get('room_pk')

        try:
            # Save message to database
            await database_sync_to_async(Message.objects.create)(
                chat_room = await database_sync_to_async(ChatRoom.objects.get)(pk=room_pk),
                sender = await database_sync_to_async(User.objects.get)(pk=sender),
                content = message
            )

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'content': message,
                    'sender_pk': sender,
                    'room_pk': room_pk
                }
            )
        except ObjectDoesNotExist as e:
            print(f"Error: {e}", file=sys.stderr)

    # Receive message from room group
    async def chat_message(self, event):
        message = event['content']
        sender = event['sender_pk']
        room_pk = event['room_pk']

        user = await database_sync_to_async(User.objects.get)(pk=sender)
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'content': message,
            # get username of User object
            'sender': user.username,
            'room': room_pk
        }))
