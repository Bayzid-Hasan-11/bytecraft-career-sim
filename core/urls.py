from django.contrib import admin
from django.urls import path
from simulation.views import chat_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', chat_api, name='chat_api'), # This is the address React will call
]