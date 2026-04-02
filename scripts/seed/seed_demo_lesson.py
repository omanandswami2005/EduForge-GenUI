#!/usr/bin/env python3
"""
Creates a realistic demo lesson (Newton's Laws of Motion — Physics Grade 10)
with pre-populated subtopics, MCQs, and simulated student BKT states
for the competition demo.
"""

import asyncio
from google.cloud import firestore
from datetime import datetime

db = firestore.AsyncClient()

DEMO_LESSON = {
    "id": "demo_newtons_laws",
    "title": "Newton's Laws of Motion",
    "subject": "Physics",
    "teacherId": "demo_teacher_1",
    "status": "published",
    "createdAt": datetime.now(),
    "publishedAt": datetime.now(),
    "ingestion": {
        "step": "complete",
        "progress": 100,
        "message": "Lesson ready!",
        "subtopicsFound": 4,
        "mcqsGenerated": 60,
    }
}

DEMO_SUBTOPICS = [
    {
        "id": "subtopic_1",
        "title": "Inertia and Newton's First Law",
        "description": "Objects at rest stay at rest; objects in motion stay in motion unless acted upon by a force.",
        "order": 1,
        "difficulty": "foundational",
        "slideNumbers": [1, 2, 3],
        "keyConcepts": ["inertia", "net force", "balanced forces"],
        "learningObjectives": [
            "Define inertia",
            "Identify balanced and unbalanced forces",
            "Apply First Law to real scenarios",
        ],
        "prerequisiteSubtopicIds": [],
    },
    {
        "id": "subtopic_2",
        "title": "Force, Mass, and Acceleration: Newton's Second Law",
        "description": "The acceleration of an object depends on the net force and its mass: F = ma.",
        "order": 2,
        "difficulty": "intermediate",
        "slideNumbers": [4, 5, 6, 7],
        "keyConcepts": ["net force", "mass", "acceleration", "F=ma"],
        "learningObjectives": [
            "Apply F=ma formula",
            "Calculate acceleration given force and mass",
            "Understand inverse relationship of mass and acceleration",
        ],
        "prerequisiteSubtopicIds": ["subtopic_1"],
    },
    {
        "id": "subtopic_3",
        "title": "Action and Reaction: Newton's Third Law",
        "description": "For every action there is an equal and opposite reaction force.",
        "order": 3,
        "difficulty": "intermediate",
        "slideNumbers": [8, 9, 10],
        "keyConcepts": ["action-reaction pairs", "force pairs", "equal and opposite"],
        "learningObjectives": [
            "Identify action-reaction pairs",
            "Explain why reaction forces don't cancel",
            "Apply Third Law to everyday examples",
        ],
        "prerequisiteSubtopicIds": ["subtopic_1"],
    },
    {
        "id": "subtopic_4",
        "title": "Applying All Three Laws: Problem Solving",
        "description": "Integrating all three Newtonian laws to solve multi-step physics problems.",
        "order": 4,
        "difficulty": "advanced",
        "slideNumbers": [11, 12, 13, 14, 15],
        "keyConcepts": ["free body diagrams", "problem solving framework", "vector forces"],
        "learningObjectives": [
            "Draw free body diagrams",
            "Identify applicable laws",
            "Solve multi-step force problems",
        ],
        "prerequisiteSubtopicIds": ["subtopic_2", "subtopic_3"],
    },
]

DEMO_MCQS = {
    "subtopic_1": [
        {
            "id": "mcq_1_1",
            "concept": "inertia",
            "tier": "foundation",
            "question": "What is inertia?",
            "options": [
                "The tendency of an object to resist changes in its state of motion",
                "The force that causes an object to accelerate",
                "The speed at which an object moves",
                "The energy stored in a moving object",
            ],
            "correct_answer": 0,
            "explanation": "Inertia is the tendency of an object to resist changes in its state of motion (whether at rest or moving).",
            "misconceptions": {"1": "Confusing inertia with force", "2": "Confusing inertia with speed"},
        },
        {
            "id": "mcq_1_2",
            "concept": "net force",
            "tier": "understanding",
            "question": "A book sits on a table without moving. What can you say about the forces acting on it?",
            "options": [
                "No forces are acting on the book",
                "The net force on the book is zero",
                "Gravity is the only force acting on it",
                "The table pushes harder than gravity pulls",
            ],
            "correct_answer": 1,
            "explanation": "Gravity pulls the book down and the table's normal force pushes it up. These forces balance, making the net force zero.",
            "misconceptions": {"0": "Believing stationary objects have no forces", "2": "Forgetting normal force"},
        },
        {
            "id": "mcq_1_3",
            "concept": "balanced forces",
            "tier": "analysis",
            "question": "A skydiver falls at constant velocity. Which statement is correct?",
            "options": [
                "The net force is downward because gravity never stops",
                "Air resistance is greater than gravity",
                "The net force is zero because the forces are balanced",
                "The skydiver is not accelerating because there are no forces",
            ],
            "correct_answer": 2,
            "explanation": "At terminal velocity, air resistance equals gravity. The net force is zero, so acceleration is zero (Newton's First Law).",
            "misconceptions": {"0": "Thinking constant velocity means net force exists", "3": "Confusing zero net force with no forces"},
        },
    ],
    "subtopic_2": [
        {
            "id": "mcq_2_1",
            "concept": "F=ma",
            "tier": "foundation",
            "question": "According to Newton's Second Law, if the net force on an object doubles while mass stays the same, what happens to acceleration?",
            "options": [
                "It stays the same",
                "It doubles",
                "It halves",
                "It quadruples",
            ],
            "correct_answer": 1,
            "explanation": "F = ma, so a = F/m. If F doubles and m stays constant, acceleration doubles.",
            "misconceptions": {"0": "Not understanding proportional relationships"},
        },
        {
            "id": "mcq_2_2",
            "concept": "mass",
            "tier": "understanding",
            "question": "Two objects experience the same net force. Object A has twice the mass of Object B. How do their accelerations compare?",
            "options": [
                "A accelerates twice as much as B",
                "B accelerates twice as much as A",
                "They accelerate equally",
                "A doesn't accelerate at all",
            ],
            "correct_answer": 1,
            "explanation": "a = F/m. With the same force, the object with half the mass (B) has twice the acceleration.",
            "misconceptions": {"0": "Inverting the mass-acceleration relationship"},
        },
    ],
}

DEMO_STUDENTS = [
    {
        "id": "demo_student_alice",
        "name": "Alice",
        "bkt_states": {
            "inertia": {"pMastery": 0.95, "pLearn": 0.3, "pSlip": 0.1, "pGuess": 0.25, "attempts": 8, "correct": 7, "streak": 5, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
            "net force": {"pMastery": 0.87, "pLearn": 0.3, "pSlip": 0.1, "pGuess": 0.25, "attempts": 6, "correct": 5, "streak": 3, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
            "balanced forces": {"pMastery": 0.82, "pLearn": 0.3, "pSlip": 0.1, "pGuess": 0.25, "attempts": 5, "correct": 4, "streak": 2, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
            "F=ma": {"pMastery": 0.65, "pLearn": 0.25, "pSlip": 0.1, "pGuess": 0.2, "attempts": 4, "correct": 3, "streak": 1, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_2"},
            "mass": {"pMastery": 0.45, "pLearn": 0.25, "pSlip": 0.1, "pGuess": 0.2, "attempts": 3, "correct": 1, "streak": 0, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_2"},
            "acceleration": {"pMastery": 0.40, "pLearn": 0.25, "pSlip": 0.1, "pGuess": 0.2, "attempts": 2, "correct": 1, "streak": 0, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_2"},
        },
    },
    {
        "id": "demo_student_bob",
        "name": "Bob",
        "bkt_states": {
            "inertia": {"pMastery": 0.28, "pLearn": 0.15, "pSlip": 0.1, "pGuess": 0.25, "attempts": 6, "correct": 2, "streak": 0, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
            "net force": {"pMastery": 0.22, "pLearn": 0.15, "pSlip": 0.1, "pGuess": 0.25, "attempts": 4, "correct": 1, "streak": 0, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
            "balanced forces": {"pMastery": 0.20, "pLearn": 0.15, "pSlip": 0.1, "pGuess": 0.25, "attempts": 2, "correct": 0, "streak": 0, "lessonId": "demo_newtons_laws", "subtopicId": "subtopic_1"},
        },
    },
]


async def seed():
    print("Seeding demo data...")

    # Create lesson
    await db.collection("lessons").document(DEMO_LESSON["id"]).set(DEMO_LESSON)
    print(f"  Created lesson: {DEMO_LESSON['title']}")

    # Create subtopics
    for st in DEMO_SUBTOPICS:
        await db.collection("lessons").document(DEMO_LESSON["id"]).collection(
            "subtopics"
        ).document(st["id"]).set(st)
    print(f"  Created {len(DEMO_SUBTOPICS)} subtopics")

    # Create MCQs (stored flat under lessons/{id}/mcqs/ with subtopicId field)
    mcq_count = 0
    for subtopic_id, mcqs in DEMO_MCQS.items():
        for mcq in mcqs:
            mcq_data = {**mcq, "subtopicId": subtopic_id}
            await db.collection("lessons").document(DEMO_LESSON["id"]).collection(
                "mcqs"
            ).document(mcq["id"]).set(mcq_data)
            mcq_count += 1
    print(f"  Created {mcq_count} MCQs")

    # Create teacher profile
    await db.collection("users").document("demo_teacher_1").set(
        {
            "uid": "demo_teacher_1",
            "displayName": "Dr. Newton",
            "role": "teacher",
            "email": "newton@demo.eduforge.app",
        }
    )

    # Create student profiles and BKT states
    for student in DEMO_STUDENTS:
        await db.collection("users").document(student["id"]).set(
            {
                "uid": student["id"],
                "displayName": student["name"],
                "role": "student",
                "email": f"{student['name'].lower()}@demo.eduforge.app",
            }
        )

        for concept_id, state in student["bkt_states"].items():
            doc_id = f"{DEMO_LESSON['id']}_{state['subtopicId']}_{concept_id}".replace(" ", "_")
            await db.collection("bkt_states").document(student["id"]).collection(
                "concepts"
            ).document(doc_id).set(
                {
                    "studentId": student["id"],
                    "conceptId": concept_id,
                    "lastUpdated": datetime.now(),
                    **state,
                }
            )

        # Create enrollment
        enrollment_id = f"{student['id']}_{DEMO_LESSON['id']}"
        await db.collection("enrollments").document(enrollment_id).set(
            {
                "studentId": student["id"],
                "lessonId": DEMO_LESSON["id"],
                "enrolledAt": datetime.now(),
                "status": "active",
            }
        )
        print(f"  Created student: {student['name']} with {len(student['bkt_states'])} BKT states")

    print("\n✅ Demo data seeded successfully")
    print(f"   Lesson: {DEMO_LESSON['title']}")
    print(f"   Subtopics: {len(DEMO_SUBTOPICS)}")
    print(f"   MCQs: {mcq_count}")
    print(f"   Students: {[s['name'] for s in DEMO_STUDENTS]}")


if __name__ == "__main__":
    asyncio.run(seed())
