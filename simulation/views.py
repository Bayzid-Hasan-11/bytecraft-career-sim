import json
import google.generativeai as genai
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Skill, CareerPath


genai.configure(api_key="AIzaSyCnhSCx0hCQDD1RGIlQUCQobEZBlr9j4KE")
model = genai.GenerativeModel('gemini-2.5-flash')

@api_view(['POST'])
def chat_api(request):
    user_skills_raw = request.data.get('skills', '')
    academic_level = request.data.get('academicLevel', 'Unknown')
    
    try:
        study_hours = int(request.data.get('studyHours', '10'))
    except ValueError:
        study_hours = 10 

    try:
        # 2. Let the LLM clean and extract the data
        # We give it strict instructions to only return a JSON array
        prompt = f"""
        Analyze this user text: "{user_skills_raw}"
        Extract all technical skills, programming languages, and tools mentioned.
        Fix any spelling mistakes (e.g., 'javascrip' -> 'javascript', 'sql server' -> 'sql').
        Return ONLY a valid JSON array of lowercase strings. Do not include markdown formatting or extra text.
        Example: ["python", "react", "sql"]
        """
        
        ai_response = model.generate_content(prompt)
        
        # Strip any accidental markdown formatting the AI might include
        clean_text = ai_response.text.strip().replace('```json', '').replace('```', '')
        user_skills_list = json.loads(clean_text)

        # 3. The Custom Scoring Algorithm (Powered by AI data)
        all_careers = CareerPath.objects.all()
        best_match = None
        highest_score = -1
        missing_skills_for_best = []
        user_matched_skills = []

        for career in all_careers:
            # Query the skills linked to this specific career
            req_skills = Skill.objects.filter(careers=career)
            req_skill_names = [skill.name.lower() for skill in req_skills]
            
            # Find the intersection
            matched = [skill for skill in user_skills_list if skill in req_skill_names]
            missing = [skill for skill in req_skill_names if skill not in user_skills_list]
            
            score = len(matched)
            
            if score > highest_score:
                highest_score = score
                best_match = career
                missing_skills_for_best = missing
                user_matched_skills = matched

        # 4. Formulate the Dynamic Response
        if best_match and highest_score > 0:
            total_req = highest_score + len(missing_skills_for_best)
            completion_percentage = int((highest_score / total_req) * 100) if total_req > 0 else 0
            
            total_hours_needed = len(missing_skills_for_best) * 80
            weeks_needed = total_hours_needed / max(study_hours, 1)
            months_needed = round(weeks_needed / 4, 1)

            bot_reply = f"**Simulation Complete!** ⚙️\n\n"
            bot_reply += f"Based on your skills in {', '.join(user_matched_skills).title()}, you are a {completion_percentage}% match for the **{best_match.title}** role. "
            
            if missing_skills_for_best:
                bot_reply += f"\n\nTo reach entry-level readiness, you still need to learn: **{', '.join(missing_skills_for_best).title()}**. "
                bot_reply += f"Since you study {study_hours} hours/week as a {academic_level}, we estimate it will take you **{months_needed} months** to close this skill gap."
            else:
                bot_reply += f"\n\nYou actually have all the core skills mapped for this role! You are ready to start building a portfolio."
                
        else:
            bot_reply = ("I ran the simulation, but I couldn't find a strong career match for those specific skills in my database yet. "
                         "Try adding core skills like 'Python', 'React', or 'SQL'!")

    except Exception as e:
        bot_reply = f"System Error in AI Engine: {str(e)}"

    # Ensure variables exist even if no match is found
    if not best_match:
        completion_percentage = 0
        missing_skills_for_best = []
        months_needed = 0
        career_title = None
    else:
        career_title = best_match.title

    return Response({
        "reply": bot_reply,
        "chartData": {
            "career": career_title,
            "matchPercentage": completion_percentage,
            "missingSkills": missing_skills_for_best,
            "monthsNeeded": months_needed
        }
    })