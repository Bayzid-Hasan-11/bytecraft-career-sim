import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Skill, CareerPath

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

@api_view(['POST'])
def chat_api(request):
    user_skills_raw = request.data.get('skills', '')
    academic_level = request.data.get('academicLevel', 'Unknown')
    
    try:
        study_hours = int(request.data.get('studyHours', '10'))
    except ValueError:
        study_hours = 10 

    # --- THE NEW SKILL WEIGHT DICTIONARY ---
    # Customize these hours to make your graph look perfect for the presentation
    SKILL_TIME_ESTIMATES = {
        'python': 120, 'java': 160, 'c++': 180, 
        'javascript': 110, 'react': 100, 'django': 90,
        'sql': 60, 'figma': 50, 'html': 30, 'css': 40,
        'machine learning': 200, 'data analysis': 80
    }

    best_match = None
    highest_score = -1
    missing_skills_for_best = []
    user_matched_skills = []
    bot_reply = "I ran the simulation, but I couldn't find a strong career match for those specific skills in my database yet."
    completion_percentage = 0
    total_months_needed = 0
    career_title = None
    detailed_missing_skills = [] # We will send this to React for the graph

    try:
        # 1. Get AI Response
        prompt = f"""
        Analyze this user text: "{user_skills_raw}"
        Extract all technical skills, programming languages, and tools mentioned.
        Fix spelling mistakes. If there are no skills, return an empty array [].
        Return ONLY a valid JSON array of lowercase strings.
        Example: ["python", "react", "html", "css"]
        """
        ai_response = model.generate_content(prompt)
        clean_text = ai_response.text.strip().replace('```json', '').replace('```', '')
        
        match = re.search(r'\[.*\]', clean_text, re.DOTALL)
        if match:
            user_skills_list = json.loads(match.group(0))
        else:
            user_skills_list = []

        # 2. Smart Scoring Algorithm
        all_careers = CareerPath.objects.all()

        for career in all_careers:
            req_skills = Skill.objects.filter(careers=career)
            req_skill_names = [skill.name.lower() for skill in req_skills]
            
            matched = []
            missing = []
            
            for req in req_skill_names:
                if any(user_skill in req for user_skill in user_skills_list):
                    matched.append(req)
                else:
                    missing.append(req)
            
            score = len(matched)
            
            if score > highest_score:
                highest_score = score
                best_match = career
                missing_skills_for_best = missing
                user_matched_skills = matched

        # 3. Formulate the Reply & Calculate DYNAMIC Times
        if best_match and highest_score > 0:
            total_req = highest_score + len(missing_skills_for_best)
            completion_percentage = int((highest_score / total_req) * 100) if total_req > 0 else 0
            
            # Loop through the missing skills and calculate time for EACH one
            for missing_skill in missing_skills_for_best:
                # Grab the hours from our dictionary, or default to 80 if it's not listed
                base_hours = SKILL_TIME_ESTIMATES.get(missing_skill.lower(), 80)
                
                # Math for this specific skill
                skill_weeks = base_hours / max(study_hours, 1)
                skill_months = round(skill_weeks / 4, 1)
                
                total_months_needed += skill_months
                
                # Package it perfectly for Recharts
                detailed_missing_skills.append({
                    "name": missing_skill.title(),
                    "Months": skill_months
                })

            total_months_needed = round(total_months_needed, 1)

            bot_reply = f"**Simulation Complete!** ⚙️\n\n"
            bot_reply += f"Based on your skills in {', '.join(user_matched_skills).title()}, you are a {completion_percentage}% match for the **{best_match.title}** role. "
            
            if missing_skills_for_best:
                bot_reply += f"\n\nTo reach entry-level readiness, you still need to learn: **{', '.join(missing_skills_for_best).title()}**. "
                bot_reply += f"Since you study {study_hours} hours/week as a {academic_level}, we estimate it will take you a total of **{total_months_needed} months** to close this skill gap."
            else:
                bot_reply += f"\n\nYou actually have all the core skills mapped for this role! You are ready to start building a portfolio."
                
    except Exception as e:
        bot_reply = f"System Error in AI Engine: {str(e)}"

    if best_match:
        career_title = best_match.title

    return Response({
        "reply": bot_reply,
        "chartData": {
            "career": career_title,
            "matchPercentage": completion_percentage,
            "missingSkillsData": detailed_missing_skills, # We now send the exact math per skill!
            "totalMonths": total_months_needed
        }
    })