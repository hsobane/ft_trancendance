from django.shortcuts import render
from .models import ChatRoom, Message
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db import models
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.utils import timezone

# Create your views here.

@login_required
def select_room(request, room_pk):
    request.session['room_pk'] = room_pk
    return redirect('list_chat')

@login_required
def list_chat(request):
    room_pk = request.session.get('room_pk')
    context = {}
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
    context['rooms'] = chat_rooms
    context['messages'] = messages
    context['title'] = 'Chat'
    return render(request, 'chat.html', context) 

@login_required
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('login')  # Redirect to login page after logout
    return render(request, 'logout.html')
