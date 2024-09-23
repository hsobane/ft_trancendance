from django.shortcuts import render
from .models import ChatRoom, Message
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db import models
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login

# Create your views here.

@login_required
def select_room(request, room_pk):
    request.session['room_pk'] = room_pk
    return redirect('list_chat')

@login_required
def list_chat(request):
    room_pk = request.session.get('room_pk')
    chat_rooms = ChatRoom.objects.filter(
        (models.Q(user1=request.user) | models.Q(user2=request.user))
    ).order_by('modified_at')
    messages = []
    if chat_rooms:
        if room_pk:
            messages = Message.objects.filter(chat_room=room_pk).order_by('created_at')
        else:
            room = ChatRoom.objects.filter(
                (models.Q(user1=request.user) | models.Q(user2=request.user))
            ).order_by('modified_at').first()
            messages = Message.objects.filter(chat_room=room).order_by('created_at')
    context = {
        'rooms': chat_rooms,
        'messages': messages,
        'title': 'Chat',
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
        },
        'session': dict(request.session.items()),
        'cookies': request.COOKIES,
    }
    return JsonResponse(context)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'failed'})
    return JsonResponse({'status': 'failed'})
