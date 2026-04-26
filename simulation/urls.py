from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_api, name='chat_api'),
    path('upload-resume/', views.upload_resume_api, name='upload_resume_api'),
    path('upload-resume/', views.upload_resume_api),
    path('generate-courses/', views.generate_courses_api),
]