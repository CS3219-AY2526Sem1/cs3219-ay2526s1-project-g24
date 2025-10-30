#!/usr/bin/env python3
"""
Database seeding script for Question Service
Run this after migrations to populate with realistic data
"""

import sys

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.questions.models import Base, Company, Question, TestCase, Topic
from seed_data import get_companies, get_questions, get_topics


def seed_database():
    """Seed the database with initial data"""
    print("🌱 Starting database seeding...")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if already seeded
        existing_topics = db.query(Topic).count()
        if existing_topics > 0:
            print(f"⚠️  Database already contains {existing_topics} topics.")
            response = input("Do you want to clear and re-seed? (yes/no): ")
            if response.lower() != "yes":
                print("❌ Seeding cancelled.")
                return
            
            # Clear existing data
            print("🗑️  Clearing existing data...")
            db.query(TestCase).delete()
            db.query(Question).delete()
            db.query(Topic).delete()
            db.query(Company).delete()
            db.commit()
        
        # Seed Topics
        print("📚 Seeding topics...")
        topic_map = {}
        for topic_data in get_topics():
            topic = Topic(**topic_data)
            db.add(topic)
            db.flush()  # Get the ID
            topic_map[topic_data["name"]] = topic
        db.commit()
        print(f"✅ Created {len(topic_map)} topics")
        
        # Seed Companies
        print("🏢 Seeding companies...")
        company_map = {}
        for company_data in get_companies():
            company = Company(**company_data)
            db.add(company)
            db.flush()
            company_map[company_data["name"]] = company
        db.commit()
        print(f"✅ Created {len(company_map)} companies")
        
        # Seed Questions with Test Cases
        print("❓ Seeding questions...")
        for question_data in get_questions():
            # Extract relationships and test cases
            topic_names = question_data.pop("topics", [])
            company_names = question_data.pop("companies", [])
            test_cases_data = question_data.pop("test_cases", [])
            
            # Create question
            question = Question(**question_data)
            
            # Add topics
            for topic_name in topic_names:
                if topic_name in topic_map:
                    question.topics.append(topic_map[topic_name])
            
            # Add companies
            for company_name in company_names:
                if company_name in company_map:
                    question.companies.append(company_map[company_name])
            
            db.add(question)
            db.flush()  # Get question ID
            
            # Add test cases
            for tc_data in test_cases_data:
                test_case = TestCase(
                    question_id=question.id,
                    **tc_data
                )
                db.add(test_case)
            
            print(f"  ✓ {question.title} ({question.difficulty.value})")
        
        db.commit()
        print(f"✅ Created {len(get_questions())} questions with test cases")
        
        # Print summary
        print("\n" + "="*50)
        print("🎉 Database seeding completed successfully!")
        print("="*50)
        print(f"📊 Summary:")
        print(f"   Topics: {db.query(Topic).count()}")
        print(f"   Companies: {db.query(Company).count()}")
        print(f"   Questions: {db.query(Question).count()}")
        print(f"   Test Cases: {db.query(TestCase).count()}")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
