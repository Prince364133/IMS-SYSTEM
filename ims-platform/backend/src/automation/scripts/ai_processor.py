import sys
import json
import pandas as pd
from datetime import datetime
import spacy

# Load spaCy model for text processing
try:
    nlp = spacy.load("en_core_web_sm")
except:
    # Fallback if model not installed
    nlp = None

def classify_document(text):
    """Classify document based on content keywords and NLP"""
    categories = {
        'Contract': ['agreement', 'contract', 'terms', 'signature', 'party'],
        'Invoice': ['invoice', 'bill', 'payment', 'amount', 'tax', 'due'],
        'Resume': ['resume', 'cv', 'experience', 'education', 'skills', 'objective'],
        'Technical': ['architecture', 'api', 'database', 'schema', 'frontend', 'backend']
    }
    
    text_lower = text.lower()
    scores = {cat: 0 for cat in categories}
    
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in text_lower:
                scores[cat] += 1
                
    best_cat = max(scores, key=scores.get)
    return best_cat if scores[best_cat] > 0 else 'General'

def analyze_task_priority(title, description):
    """Detect priority based on urgency keywords"""
    urgent_keywords = ['asap', 'urgent', 'critical', 'immediate', 'blocker', 'priority']
    combined_text = f"{title} {description}".lower()
    
    for kw in urgent_keywords:
        if kw in combined_text:
            return 'High'
    return 'Medium'

def predict_project_risk(tasks_data):
    """Predict risk based on overdue tasks and progress"""
    df = pd.DataFrame(tasks_data)
    if df.empty: return 'Low'
    
    now = datetime.now()
    overdue_count = len(df[(df['status'] != 'Completed') & (pd.to_datetime(df['dueDate']) < now)])
    total_tasks = len(df)
    
    risk_score = (overdue_count / total_tasks) * 100 if total_tasks > 0 else 0
    
    if risk_score > 30: return 'High'
    if risk_score > 10: return 'Medium'
    return 'Low'

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action provided"}))
        return

    action = sys.argv[1]
    input_data = json.loads(sys.argv[2])

    result = {}
    if action == 'classify_doc':
        result['category'] = classify_document(input_data.get('text', ''))
    elif action == 'task_priority':
        result['priority'] = analyze_task_priority(input_data.get('title', ''), input_data.get('description', ''))
    elif action == 'project_risk':
        result['risk'] = predict_project_risk(input_data.get('tasks', []))
    else:
        result['error'] = 'Unknown action'

    print(json.dumps(result))

if __name__ == "__main__":
    main()
