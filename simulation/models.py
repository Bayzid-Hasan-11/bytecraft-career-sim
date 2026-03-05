from django.db import models
from django.contrib.auth.models import User

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, help_text="e.g., Programming, Soft Skill, Tool")

    def __str__(self):
        return self.name

class CareerPath(models.Model):
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    required_skills = models.ManyToManyField(Skill, related_name="careers")
    base_difficulty_level = models.IntegerField(default=1, help_text="Scale of 1-10")
    estimated_months_to_entry = models.IntegerField(default=6, help_text="Average months to learn from scratch")

    def __str__(self):
        return self.title

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    academic_level = models.CharField(max_length=100, help_text="e.g., Sophomore, Junior, Senior")
    weekly_study_hours = models.IntegerField(default=10)
    current_skills = models.ManyToManyField(Skill, blank=True, related_name="students")

    def __str__(self):
        return f"{self.user.username}'s Profile"