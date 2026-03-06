from django.urls import path
from . import views

urlpatterns = [
    # This connects the React frontend to your AI algorithm!
    path('chat/', views.chat_api, name='chat_api'),
]