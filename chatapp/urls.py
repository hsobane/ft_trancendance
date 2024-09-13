from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('accounts/login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('chat/', views.list_chat, name="list_chat"),
    path('chat/<int:room_pk>/', views.select_room, name="select_room"),
]
