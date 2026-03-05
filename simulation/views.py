from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Skill, CareerPath

@api_view(['POST'])
def chat_api(request):
    # 1. Extract and clean the user's data
    user_skills_raw = request.data.get('skills', '').lower()
    academic_level = request.data.get('academicLevel', 'Unknown')
    
    # Safely convert study hours to an integer, default to 10 if they typed text
    try:
        study_hours = int(request.data.get('studyHours', '10'))
    except ValueError:
        study_hours = 10 

    # Break their typed skills into a clean list (e.g., "python, react, sql" -> ['python', 'react', 'sql'])
    user_skills_list = [s.strip() for s in user_skills_raw.split(',') if s.strip()]

    try:
        all_careers = CareerPath.objects.all()
        
        best_match = None
        highest_score = -1
        missing_skills_for_best = []
        user_matched_skills = []

        # 2. The Scoring Engine: Evaluate every career path against the user's skills
        for career in all_careers:
            # Note: This assumes CareerPath has a ManyToMany field to Skill with related_name='careers'
            req_skills = career.skill_set.all() if hasattr(career, 'skill_set') else Skill.objects.filter(careers=career)
            
            req_skill_names = [skill.name.lower() for skill in req_skills]
            
            # Find the intersection (skills the user has that the career requires)
            matched = [skill for skill in user_skills_list if skill in req_skill_names]
            missing = [skill for skill in req_skill_names if skill not in user_skills_list]
            
            score = len(matched)
            
            # If this career is a better match than the previous ones, save it
            if score > highest_score:
                highest_score = score
                best_match = career
                missing_skills_for_best = missing
                user_matched_skills = matched

        # 3. Formulate the Dynamic Response
        if best_match and highest_score > 0:
            total_req = highest_score + len(missing_skills_for_best)
            completion_percentage = int((highest_score / total_req) * 100) if total_req > 0 else 0
            
            # Dynamic time calculation: Only calculate time based on the MISSING skills
            # Base assumption: Each missing skill takes about 2 months at 40 hours/month (80 hours total)
            total_hours_needed = len(missing_skills_for_best) * 80
            weeks_needed = total_hours_needed / max(study_hours, 1)
            months_needed = round(weeks_needed / 4, 1)

            # Build the text response
            bot_reply = f"Simulation Complete! ⚙️\n\n"
            bot_reply += f"Based on your skills in {', '.join(user_matched_skills).title()}, you are a {completion_percentage}% match for the {best_match.title} role. "
            
            if missing_skills_for_best:
                bot_reply += f"To reach entry-level readiness, you still need to learn: {', '.join(missing_skills_for_best).title()}. "
                bot_reply += f"Since you study {study_hours} hours/week as a {academic_level}, we estimate it will take you {months_needed} months to close this skill gap."
            else:
                bot_reply += f"You actually have all the core skills mapped for this role! You are ready to start building a portfolio."
                
        else:
            bot_reply = ("I ran the simulation, but I couldn't find a strong career match for those specific skills in my database yet. "
                         "Try adding core skills like 'Python', 'React', or 'SQL'!")

    except Exception as e:
        bot_reply = f"System Error in Simulation Engine: {str(e)}"

    return Response({"reply": bot_reply})