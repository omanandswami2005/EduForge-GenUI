"""
EduForge E2E Test — Real services, real GCP.

Tests the full user flow:
  1. BKT service (direct, no auth)
  2. Firebase Auth sign-up / sign-in (real)
  3. API Gateway (with real Firebase token)
  4. Ingestion service
"""
import os
import sys
import time
import requests

# ─── Config ───
BKT_URL = os.environ.get("BKT_SERVICE_URL", "http://localhost:8001")
API_URL = os.environ.get("API_GATEWAY_URL", "http://localhost:8000")
INGESTION_URL = os.environ.get("INGESTION_SERVICE_URL", "http://localhost:8003")
FIREBASE_API_KEY = os.environ.get("NEXT_PUBLIC_FIREBASE_API_KEY", "")

TEST_EMAIL = "e2e-test@eduforge.dev"
TEST_PASSWORD = "EduForge2026!Test"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
results = []


def log(test_name, passed, detail=""):
    status = PASS if passed else FAIL
    print(f"  {status} {test_name}" + (f"  ({detail})" if detail else ""))
    results.append((test_name, passed))


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ═══════════════════════════════════════════════════════════
#  PHASE 1: BKT Service (no auth)
# ═══════════════════════════════════════════════════════════
def test_bkt_service():
    section("Phase 1: BKT Service (direct, no auth)")

    # Health
    r = requests.get(f"{BKT_URL}/health")
    log("BKT health", r.status_code == 200, r.json().get("service"))

    # Scaffold resolver
    r = requests.get(f"{BKT_URL}/scaffold", params={"p_mastery": 0.15})
    data = r.json()
    log("Scaffold L0 (novice)", data["level"] == 0 and data["level_name"] == "novice",
        f"level={data['level']}, components={data['allowed_components']}")

    r = requests.get(f"{BKT_URL}/scaffold", params={"p_mastery": 0.55})
    data = r.json()
    log("Scaffold L2 (approaching)", data["level"] == 2, f"level={data['level']}")

    r = requests.get(f"{BKT_URL}/scaffold", params={"p_mastery": 0.85})
    data = r.json()
    log("Scaffold L4 (mastered)", data["level"] == 4, f"level={data['level']}")

    # BKT Update — use a fresh concept to avoid pre-existing state
    import random
    concept_id = f"e2e-concept-{random.randint(10000, 99999)}"
    update_payload = {
        "student_id": "e2e-test-student-001",
        "lesson_id": "e2e-test-lesson-001",
        "subtopic_id": "e2e-test-subtopic-001",
        "concept_id": concept_id,
        "mcq_id": "e2e-mcq-001",
        "selected_answer": "A",
        "is_correct": True,
        "time_taken_seconds": 12,
    }
    r = requests.post(f"{BKT_URL}/update", json=update_payload)
    data = r.json()
    log("BKT update (correct answer)",
        r.status_code == 200 and data["p_mastery_after"] > 0,
        f"mastery: {data.get('p_mastery_before', 0):.3f} → {data['p_mastery_after']:.3f}")

    # Send 2 more correct answers to raise mastery
    for i in range(2):
        update_payload["mcq_id"] = f"e2e-mcq-00{i+2}"
        r = requests.post(f"{BKT_URL}/update", json=update_payload)
        data = r.json()

    log("BKT mastery rising after 3 correct",
        data["p_mastery_after"] > data["p_mastery_before"],
        f"mastery={data['p_mastery_after']:.3f}, scaffold_level={data['scaffold_level']}")

    # Read state back from Firestore
    r = requests.get(f"{BKT_URL}/state",
                     params={"studentId": "e2e-test-student-001",
                             "conceptId": concept_id})
    if r.status_code == 200:
        state = r.json()
        log("BKT state read from Firestore",
            state["p_mastery"] > 0 and state["attempts"] >= 3,
            f"mastery={state['p_mastery']:.3f}, attempts={state['attempts']}")
    else:
        log("BKT state read from Firestore", False, f"status={r.status_code}")

    return True


# ═══════════════════════════════════════════════════════════
#  PHASE 2: Firebase Auth (real)
# ═══════════════════════════════════════════════════════════
def test_firebase_auth():
    section("Phase 2: Firebase Auth (real sign-up/sign-in)")

    if not FIREBASE_API_KEY:
        log("Firebase API key available", False, "NEXT_PUBLIC_FIREBASE_API_KEY not set")
        return None

    log("Firebase API key available", True, f"{FIREBASE_API_KEY[:10]}...")

    # Try sign-up (may already exist)
    signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
    r = requests.post(signup_url, json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "returnSecureToken": True,
    })

    if r.status_code == 200:
        data = r.json()
        log("Firebase sign-up (new user)", True, f"uid={data['localId']}")
        return data["idToken"]
    elif "EMAIL_EXISTS" in r.text:
        log("Firebase sign-up", True, "User already exists — signing in")
        # Sign in instead
        signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        r = requests.post(signin_url, json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "returnSecureToken": True,
        })
        if r.status_code == 200:
            data = r.json()
            log("Firebase sign-in", True, f"uid={data['localId']}")
            return data["idToken"]
        else:
            log("Firebase sign-in", False, r.text[:200])
            return None
    else:
        log("Firebase sign-up", False, r.text[:200])
        return None


# ═══════════════════════════════════════════════════════════
#  PHASE 3: API Gateway (with auth)
# ═══════════════════════════════════════════════════════════
def test_api_gateway(token):
    section("Phase 3: API Gateway (real auth)")

    headers = {"Authorization": f"Bearer {token}"}

    # Health (no auth needed)
    r = requests.get(f"{API_URL}/health")
    log("API health", r.status_code == 200)

    # List lessons (authenticated)
    r = requests.get(f"{API_URL}/lessons", headers=headers)
    log("GET /lessons (authenticated)",
        r.status_code == 200,
        f"count={len(r.json()) if r.status_code == 200 else 'N/A'}")

    # BKT proxy — scaffold
    r = requests.get(f"{API_URL}/bkt/scaffold", params={"p_mastery": 0.5}, headers=headers)
    log("GET /bkt/scaffold (proxied)",
        r.status_code == 200,
        f"level={r.json().get('level') if r.status_code == 200 else 'N/A'}")

    return True


# ═══════════════════════════════════════════════════════════
#  PHASE 4: Ingestion Service
# ═══════════════════════════════════════════════════════════
def test_ingestion_service():
    section("Phase 4: Ingestion Service")

    r = requests.get(f"{INGESTION_URL}/health")
    log("Ingestion health", r.status_code == 200)


# ═══════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "="*60)
    print("  EduForge E2E Test Suite — Real GCP Services")
    print("="*60)

    test_bkt_service()
    token = test_firebase_auth()
    if token:
        test_api_gateway(token)
    else:
        section("Phase 3: API Gateway — SKIPPED (no token)")
    test_ingestion_service()

    # Summary
    section("Summary")
    passed = sum(1 for _, p in results if p)
    failed = sum(1 for _, p in results if not p)
    total = len(results)
    print(f"  {PASS} Passed: {passed}/{total}")
    if failed:
        print(f"  {FAIL} Failed: {failed}/{total}")
        for name, p in results:
            if not p:
                print(f"      - {name}")
    print()

    sys.exit(0 if failed == 0 else 1)
