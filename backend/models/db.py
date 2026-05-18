from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, Integer
from sqlalchemy.orm import DeclarativeBase, Session

class Base(DeclarativeBase):
    pass

class Email(Base):
    __tablename__ = "emails"
    message_id   = Column(String, primary_key=True)
    subject      = Column(String, default="")
    sender       = Column(String, default="")
    date         = Column(DateTime)
    body         = Column(Text, default="")
    thread_id    = Column(String, default="")
    folder       = Column(String, default="")
    is_sent      = Column(Boolean, default=False)
    embedded     = Column(Boolean, default=False)
    triage_score = Column(Integer, default=0)
    warning_flag = Column(Boolean, default=False)

class Contact(Base):
    __tablename__ = "contacts"
    email          = Column(String, primary_key=True)
    name             = Column(String, default="")
    last_seen        = Column(DateTime)
    last_interaction = Column(DateTime)
    avg_reply_days   = Column(Integer, default=0)
    topics           = Column(Text, default="")
    priority_score   = Column(Integer, default=0)

class FollowUp(Base):
    __tablename__ = "followups"
    message_id    = Column(String, primary_key=True)
    subject       = Column(String, default="")
    recipient     = Column(String, default="")
    sent_date     = Column(DateTime)
    snoozed_until = Column(DateTime, nullable=True)
    resolved      = Column(Boolean, default=False)

engine = create_engine("sqlite:///emailbrain.db")
Base.metadata.create_all(engine)

if __name__ == "__main__":
    print("Database created successfully!")