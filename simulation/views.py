from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Skill, CareerPath

@api_view(['POST'])
def chat_api(request):
    # Grab all the data React just sent over
    user_skills = request.data.get('skills', '').lower()
    academic_level = request.data.get('academicLevel', '')
    study_hours = request.data.get('studyHours', '10') # Default to 10 if empty
    
    try:
        # Check if the user mentioned 'python' or 'react' in their skills string
        matched_skill = Skill.objects.filter(name__icontains="python").first() # Simplification for testing
        
        # You can expand this logic to search for all words in the user's string!
        for word in user_skills.split(','):
             skill_check = Skill.objects.filter(name__icontains=word.strip()).first()
             if skill_check:
                 matched_skill = skill_check
                 break

        if matched_skill:
            possible_careers = matched_skill.careers.all()

            if possible_careers.exists():
                career = possible_careers.first() # Grab the first match (Full Stack Developer)
                
                # Rule-Based Math: Calculate time based on their available hours
                total_hours_needed = career.estimated_months_to_entry * 40 # Assuming 40 hours/month standard
                user_weeks_needed = total_hours_needed / max(int(study_hours), 1)
                user_months_needed = round(user_weeks_needed / 4, 1)

                bot_reply = (f"Simulation Complete! Based on your skills in {matched_skill.name}, "
                             f"as a {academic_level}, you are a great fit for the '{career.title}' role. "
                             f"Since you study {study_hours} hours/week, we estimate it will take you "
                             f"{user_months_needed} months to reach entry-level readiness. "
                             f"The difficulty level is {career.base_difficulty_level}/10.")
            else:
                bot_reply = f"You know {matched_skill.name}! We are still mapping out the specific paths for that."
        else:
            bot_reply = "I couldn't match those specific skills in my database. Try adding 'Python' or 'React'!"

    except Exception as e:
        bot_reply = f"My simulation engine encountered an error: {str(e)}"

    return Response({"reply": bot_reply})