from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('api/login/', views.login_view, name='login'),
    path('chat/', views.list_chat, name="list_chat"),
]
