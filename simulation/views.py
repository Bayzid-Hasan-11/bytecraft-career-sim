import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Skill, CareerPath
import tempfile

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


    SKILL_TIME_ESTIMATES = {
        'python': 120, 'java': 160, 'c++': 180, 
        'javascript': 110, 'react': 100, 'django': 90,
        'sql': 60, 'figma': 50, 'html': 30, 'css': 40,
        'machine learning': 200, 'data analysis': 80
    }

    top_matches = []
    bot_reply = "I ran the simulation, but I couldn't find a strong career match for those specific skills in my database yet."

    try:
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

        all_careers = CareerPath.objects.all()
        all_career_scores = [] 

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
            

            total_req = len(matched) + len(missing)
            completion_percentage = int((len(matched) / total_req) * 100) if total_req > 0 else 0
            

            if completion_percentage > 0:
                detailed_missing_skills = []
                total_months_needed = 0
                
                for missing_skill in missing:
                    base_hours = SKILL_TIME_ESTIMATES.get(missing_skill.lower(), 80)
                    skill_weeks = base_hours / max(study_hours, 1)
                    skill_months = round(skill_weeks / 4, 1)
                    total_months_needed += skill_months
                    
                    detailed_missing_skills.append({
                        "name": missing_skill.title(),
                        "Months": skill_months
                    })
                
                all_career_scores.append({
                    "career": career.title,
                    "matchPercentage": completion_percentage,
                    "missingSkillsData": detailed_missing_skills,
                    "totalMonths": round(total_months_needed, 1),
                    "missingTextList": [m.title() for m in missing], # Capitalized for React Text
                    "matchedTextList": [m.title() for m in matched]  # Capitalized for React Text
                })

        all_career_scores.sort(key=lambda x: x['matchPercentage'], reverse=True)
        top_matches = all_career_scores[:3] 

        if top_matches:
            user_skill_string = ", ".join([m.title() for m in user_skills_list]) if user_skills_list else "the ones provided"
            bot_reply = f"**Simulation Complete!** ⚙️\n\nBased on your skills in **{user_skill_string}**, I found multiple viable career paths. Click on any role below to view your personalized learning roadmap."
        else:
            bot_reply = "I ran the simulation, but I couldn't find a strong career match for those specific skills in my database yet."

    except Exception as e:
        bot_reply = f"System Error in AI Engine: {str(e)}"
        top_matches = []

    return Response({
        "reply": bot_reply,
        "matches": top_matches 
    })

@api_view(['POST'])
def upload_resume_api(request):
    if 'resume' not in request.FILES:
        return Response({"error": "No file uploaded."}, status=400)
        
    resume_file = request.FILES['resume']
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
        for chunk in resume_file.chunks():
            temp_pdf.write(chunk)
        temp_pdf_path = temp_pdf.name

    try:

        uploaded_pdf = genai.upload_file(temp_pdf_path)
        
        prompt = """
        Analyze this resume document. Extract all technical skills, programming languages, and tools mentioned.
        Return ONLY a valid JSON array of lowercase strings.
        Example: ["python", "java", "sql", "react", "html", "css", "figma", "django", "javascript", "c++"]
        """
        
        response = model.generate_content([uploaded_pdf, prompt])
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        
        match = re.search(r'\[.*\]', clean_text, re.DOTALL)
        if match:
            extracted_skills = json.loads(match.group(0))
        else:
            extracted_skills = []
            
        genai.delete_file(uploaded_pdf.name)
        os.remove(temp_pdf_path)
        
        return Response({"skills": extracted_skills})
        
    except Exception as e:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        return Response({"error": f"AI Parsing Error: {str(e)}"}, status=500)

@api_view(['POST'])
def generate_courses_api(request):
    try:
        career = request.data.get('career')
        missing_skills = request.data.get('missingSkills', [])

        if not missing_skills:
            return Response({'courses': []})

        prompt = f"""
        The user wants to become a {career}. They are currently missing these core skills: {', '.join(missing_skills)}.
        Act as an expert academic advisor. Recommend exactly 3 highly specific, free online courses or exact YouTube search queries so they can learn these skills.
        
        You MUST return ONLY a valid JSON array of objects. Do not include markdown formatting, backticks, or extra text.
        Structure exactly like this:
        [
            {{"title": "Full Course Name or YouTube Query", "platform": "YouTube / Coursera / etc", "estimated_hours": 10}}
        ]
        """

        response = model.generate_content(prompt)
        
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        courses_data = json.loads(raw_text)

        return Response({'courses': courses_data})

    except Exception as e:
        print("Syllabus Error:", str(e))
        return Response({'error': 'Failed to generate syllabus.'}, status=500)