import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') 
django.setup()

from simulation.models import Skill, CareerPath

def seed_data():
    print("Clearing old data...")
    Skill.objects.all().delete()
    CareerPath.objects.all().delete()

    print("Planting 32 new skills...")
    skill_names = [
        "Python", "JavaScript", "Java", "C++", "C#", "PHP", "Go", "Rust",
        "React", "Angular", "HTML/CSS", "Figma", "Vue.js",
        "Node.js", "RESTful APIs", "AWS", "Docker", "Kubernetes", "Linux",
        "SQL", "NoSQL", "Machine Learning", "Data Visualization", "Probability & Statistics",
        "Data Structures (Stacks & Linked Lists)", "Algorithms", "System Architecture & Memory Channels", 
        "Low-Level Computing (Hexadecimal)", "UML Modeling",
        "Git", "Agile Methodologies", "Software Testing & Cyclomatic Complexity", "Cybersecurity Fundamentals"
    ]
    
    # Create the skill objects in the database
    skills_dict = {}
    for name in skill_names:
        skill = Skill.objects.create(name=name)
        skills_dict[name] = skill

    print("Building 20 Career Paths...")
    careers_data = [
        ("Full Stack Developer", ["React", "Node.js", "SQL", "RESTful APIs"], 8, 12),
        ("Data Scientist", ["Python", "Machine Learning", "Probability & Statistics", "SQL"], 9, 14),
        ("Systems Architect", ["UML Modeling", "System Architecture & Memory Channels", "AWS"], 9, 18),
        ("QA Automation Engineer", ["Python", "Software Testing & Cyclomatic Complexity", "Linux"], 6, 6),
        ("Embedded Systems Engineer", ["C++", "Low-Level Computing (Hexadecimal)", "System Architecture & Memory Channels"], 8, 12),
        ("Backend Developer", ["Java", "SQL", "RESTful APIs", "Docker"], 7, 8),
        ("Frontend Developer", ["HTML/CSS", "JavaScript", "React"], 5, 6),
        ("UI/UX Designer", ["Figma", "HTML/CSS", "UML Modeling"], 5, 5),
        ("DevOps Engineer", ["Linux", "Docker", "Kubernetes", "AWS"], 8, 10),
        ("Database Administrator", ["SQL", "NoSQL", "System Architecture & Memory Channels"], 7, 8),
        ("Machine Learning Engineer", ["Python", "Machine Learning", "Algorithms", "Probability & Statistics"], 9, 16),
        ("Security Analyst", ["Cybersecurity Fundamentals", "Linux", "Low-Level Computing (Hexadecimal)"], 7, 9),
        ("Software Engineer", ["Data Structures (Stacks & Linked Lists)", "Algorithms", "Java", "Git"], 8, 10),
        ("Cloud Engineer", ["AWS", "Linux", "Docker", "RESTful APIs"], 7, 8),
        ("Mobile App Developer", ["Java", "React", "RESTful APIs"], 6, 7),
        ("Game Developer", ["C++", "C#", "Algorithms"], 8, 12),
        ("Data Analyst", ["SQL", "Python", "Data Visualization", "Probability & Statistics"], 5, 5),
        ("Technical Product Manager", ["Agile Methodologies", "UML Modeling", "Figma"], 6, 8),
        ("Blockchain Developer", ["Rust", "Go", "Algorithms"], 9, 14),
        ("Site Reliability Engineer", ["Linux", "AWS", "Software Testing & Cyclomatic Complexity"], 8, 10),
    ]

    for title, req_skills, difficulty, months in careers_data:
        career = CareerPath.objects.create(
            title=title,
            description=f"A professional who specializes in {title.lower()}.",
            base_difficulty_level=difficulty,
            estimated_months_to_entry=months
        )
        # Link the specific skills to this career
        for skill_name in req_skills:
            skills_dict[skill_name].careers.add(career)

    print("Database seeding complete! 🚀 32 Skills and 20 Careers added.")

if __name__ == '__main__':
    seed_data()