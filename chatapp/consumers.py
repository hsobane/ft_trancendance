import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Message, ChatRoom
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from .serializers import MessageSerializer, ChatRoomSerializer
import sys

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_pk']
        self.room_group_name = f'chat_room_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        message = text_data_json.get('content')
        sender = text_data_json.get('sender')
        room_pk = text_data_json.get('room_id')
        print(f"received message type: {message_type}", file=sys.stderr)
        try:
            if message_type == 'MESSAGE':
                message = await self.create_message(room_pk, sender, message)
                message_serializer = await self.get_message_serializer(message)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_serializer
                    }
                )
            elif message_type == 'SEARCH_USERS':
                query = text_data_json.get('query')
                user_list = await self.get_users(query)
                await self.send(text_data=json.dumps({
                    'type': 'USERS_LIST',
                    'users': user_list
                }))
            elif message_type == 'TYPING':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_typing',
                        'sender': sender,
                        'room_id': room_pk
                    }
                )
            elif message_type == 'SELECT_USER':
                username = text_data_json.get('username')
                try:
                    user1 = await self.get_user_by_username(username)
                    user2 = self.scope['user']
                    chat_room = await self.create_or_get_chat_room(user1, user2)
                    chat_room_serializer = await self.get_chat_room_serializer(chat_room)
                    await self.send(text_data=json.dumps({
                        'type': 'USER_SELECTED',
                        'status': 'OK',
                        'chat_room': chat_room_serializer
                    }))
                except User.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        'type': 'USER_SELECTED',
                        'status': 'ERROR',
                        'message': 'User does not exist'
                    }))
            elif message_type == 'MARK_AS_READ':
                room_id = text_data_json.get('room_id')
                user = text_data_json.get('user')
                await self.mark_as_read(room_id, user)
            
        except ObjectDoesNotExist as e:
            print(f"Error: {e}", file=sys.stderr)

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'type': 'MESSAGE',
            'message': message,
        }))

    async def message_typing(self, event):
        sender = event['sender']
        room_id = event['room_id']

        await self.send(text_data=json.dumps({
            'type': 'TYPING',
            'sender': sender,
            'room_id': room_id
        }))
    

    @database_sync_to_async
    def get_message_serializer(self, message):
        return MessageSerializer(message).data
    
    @database_sync_to_async
    def create_message(self, chat_room, sender, content):
        room = ChatRoom.objects.get(id=chat_room)
        sender_id = User.objects.get(id=sender)
        return Message.objects.create(chat_room=room, sender=sender_id, content=content)

    @database_sync_to_async
    def get_users(self, query):
        return list(User.objects.filter(username__icontains=query).values('id', 'username'))

    @database_sync_to_async
    def get_user_by_username(self, username):
        return User.objects.get(username=username)

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        return User.objects.get(id=user_id)
    
    @database_sync_to_async
    def create_or_get_chat_room(self, sender_user, receiver_user):
        # Try to get an existing chat room
        chat_room = ChatRoom.objects.filter(
            models.Q(user1=sender_user, user2=receiver_user) |
            models.Q(user1=receiver_user, user2=sender_user)
        ).first()

        # If no chat room exists, create a new one
        if not chat_room:
            chat_room = ChatRoom.objects.create(user1=sender_user, user2=receiver_user)

        return chat_room
    
    @database_sync_to_async
    def get_chat_room_serializer(self, chat_room):
        return ChatRoomSerializer(chat_room).data
    
    @database_sync_to_async
    def mark_as_read(self, room_id, user):
        room = ChatRoom.objects.get(id=room_id)
        user = User.objects.get(id=user)
        room.messages.filter(chat_room=room).exclude(sender=user).update(is_read=True)


class UserNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.notification_group_name = f'user_{self.user.id}_notification'

        # Join room group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # We don't expect to receive messages here, but you can add handling if needed
        pass

    async def new_room_notification(self, event):
        room_data = event['room_data']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'NEW_ROOM',
            'room_data': room_data
        }))