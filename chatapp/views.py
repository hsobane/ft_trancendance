from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import ChatRoom, Message
from .serializers import UserSerializer, ChatRoomSerializer, MessageSerializer
from django.db import models

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_chat(request):
    chat_rooms = ChatRoom.objects.filter(
        (models.Q(user1=request.user) | models.Q(user2=request.user))
    ).order_by('modified_at')
    contacts = []
    for room in chat_rooms:
        if room.user1 != request.user:
            contacts.append(UserSerializer(room.user1).data)
        else:
            contacts.append(UserSerializer(room.user2).data)
    context = {
        'chat_rooms': ChatRoomSerializer(chat_rooms, many=True).data,
        'user': UserSerializer(request.user).data,
        'contacts': contacts,
        # 'session': dict(request.session.items()),
        # 'cookies': request.COOKIES,
    }
    return Response(context)

@csrf_exempt
@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            user_data = UserSerializer(user).data
            refresh = RefreshToken.for_user(user)
            return Response({
                'status': 'success',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data,
            })
        else:
            return Response({'status': 'failed', 'error': 'Invalid username or password'})
    return Response({'status': 'failed', 'error': 'Invalid request method'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return Response({'status': 'logged out'})
    return Response({'status': 'failed'})

