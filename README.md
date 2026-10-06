# 🧠 Cognicare NER

## AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)

### Team NeuroCare

---

## 🏆 Hackathon Project

**Project Name:** Cognicare NER
**Team:** NeuroCare
**Domain:** Healthcare • Assistive Technology • AI
**Focus:** Cognitive Assistance • Memory Support • Elder-Friendly Technology
**Regional Focus:** North Eastern Region of India (NER)

> Cognicare NER is an assistive cognitive gaming and memory assistance platform designed to provide elderly users with personalized cognitive activities, memory support, reminders, voice interaction, and caregiver-oriented functionality through a simple and elder-friendly digital experience.

---

# 👥 Team NeuroCare

### Team Lead & Developers

**Team NeuroCare**

| Member | Role |
|--------|------|
| **[Your Name]** | Team Lead / Full-Stack Development |
| **[Member 2]** | Frontend / UI Development |
| **[Member 3]** | Backend / Database |
| **[Member 4]** | Research / Testing / Documentation |

> Replace the placeholders with your final hackathon team members and roles.

---

# 🎥 Demo Video

## Cognicare NER Working Prototype

▶️ **Watch Cognicare NER Demo:**
**[Add Demo Video Link Here]**

The demonstration showcases the major working modules of the Cognicare NER prototype, including the elderly dashboard, cognitive games, personalized recommendations, voice interaction, memories, reminders, caregiver functionality, and NER-focused cognitive content.

---

# 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Application Modules](#-application-modules)
- [Personalization Engine](#-personalization-engine)
- [System Architecture](#-system-architecture)
- [How the System Works](#-how-the-system-works)
- [Technology Stack](#-technology-stack)
- [Database Architecture](#-database-architecture)
- [Repository Structure](#-repository-structure)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Variables](#-environment-variables)
- [Screenshots & UI Showcase](#-screenshots--ui-showcase)
- [Hackathon Alignment](#-hackathon-alignment)
- [Innovation](#-innovation)
- [Responsible Design](#-responsible-design)
- [Future Scope](#-future-scope)
- [Project Status](#-project-status)
- [Team & Contributors](#-team--contributors)

---

# 📖 Overview

**Cognicare NER** is a personalized cognitive gaming and memory assistance platform developed to support elderly users through accessible digital interaction.

The platform combines cognitive games, personal memories, reminders, voice interaction, activity tracking, personalized recommendations, and caregiver-oriented features into a unified application.

Instead of providing every user with exactly the same sequence of activities, Cognicare NER uses interaction data such as:

- Accuracy
- Response time
- Mistakes
- Previous sessions
- Activity performance

to help select suitable future cognitive activities.

The application is designed around a simple principle:

> **The technology should adapt to the user — not the user to the technology.**

---

# ⚠️ Problem Statement

The official problem focuses on developing an:

> **AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER).**

Elderly users experiencing memory-related difficulties may benefit from regular cognitive engagement, familiar activities, reminders, and simple digital assistance.

However, several practical challenges exist.

### Key challenges addressed by Cognicare NER

### 1. Generic Cognitive Activities

Many cognitive applications provide fixed activities without considering differences in user performance.

### 2. Complex Digital Interfaces

Conventional applications can contain complicated navigation and interaction patterns that may not be comfortable for elderly users.

### 3. Lack of Integrated Assistance

Cognitive games, memories, reminders, and caregiver-related functionality are often separated across different tools.

### 4. Limited Personalization

A difficult activity may frustrate one user while an easier activity may not sufficiently engage another user.

### 5. Limited Voice Interaction

Typing and complex navigation can create an additional barrier for users who prefer speaking.

### 6. Regional and Cultural Context

A cognitive platform designed for the North Eastern Region can benefit from culturally familiar content and region-specific activities.

---

# 💡 Our Solution

Cognicare NER brings cognitive engagement and everyday memory assistance into a single elder-friendly platform.

The system provides:

```text
                    ┌───────────────────────┐
                    │      Elderly User     │
                    │    Touch / Voice      │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      React + PWA      │
                    │   Elder-Friendly UI   │
                    └───────────┬───────────┘
                                │
                          REST API / JSON
                                │
                                ▼
                    ┌───────────────────────┐
                    │       FastAPI         │
                    │ Authentication        │
                    │ Game Engine           │
                    │ Application APIs      │
                    └───────┬───────┬───────┘
                            │       │
                            ▼       ▼
                  ┌────────────┐  ┌─────────────────┐
                  │ PostgreSQL │  │ Personalization │
                  │ Database   │  │ Engine          │
                  └────────────┘  └────────┬────────┘
                                           │
                                           ▼
                                Recommended Activity
                                           │
                                           ▼
                                     User Session

                                     🌟 Key Features
🧠 Personalized Cognitive Games
The platform provides multiple cognitive activities designed to encourage memory, attention, recall, and concentration.
🎴 Memory Match
Users match corresponding items while exercising visual memory and recall.
🔢 Sequence Memory
Users observe a sequence and reproduce it, encouraging sequential memory and concentration.
🖼️ Object Recall
Users interact with objects and are later asked to recall previously presented information.
🌄 NER Cultural Recall
A region-focused activity that provides scope for culturally familiar content from the North Eastern Region.
📊 Personalized Recommendations
Cognicare NER records important activity-performance indicators such as:
Accuracy
   +
Response Time
   +
Mistakes
   +
Previous Sessions
        ↓
Performance Analysis
        ↓
Activity Recommendation

The recommendation engine can then determine an appropriate next activity and difficulty level.
This creates a continuous personalization loop rather than a fixed activity sequence.
🗣️ Voice Interaction
Cognicare NER includes voice-based interaction to provide an alternative to keyboard-heavy interaction.
The voice interface can help users:
- Interact with the application
- Provide spoken input
- Reduce dependence on typing
- Access features in a more natural way
The goal is to make interaction more comfortable and accessible for elderly users.
📸 Personal Memories
The Memories feature allows users to maintain personal memories within the platform.
The feature is designed around familiarity and meaningful interaction, allowing the application to go beyond generic cognitive exercises.
⏰ Reminders
Users can create and manage reminders for everyday activities.
The reminders module provides a simple mechanism to help users keep track of important tasks and events.
👨‍👩‍👧 Caregiver Support
Cognicare NER includes caregiver-oriented functionality to create a broader support ecosystem around the elderly user.
The caregiver side can provide visibility into relevant activity information and assist with monitoring user engagement.
🌐 Elder-Friendly User Interface
The interface is designed with elderly usability as a core consideration.
Design principles include:
- Large and clear controls
- Simple navigation
- Easy-to-understand labels
- Reduced interface complexity
- Voice interaction
- Accessible activity flows
- Familiar visual interaction patterns
🖥️ Application Modules
#	Module	Purpose
1	Dashboard	Central entry point for cognitive activities, memories, reminders, and caregiver features
2	Cognitive Games	Provides access to available cognitive activities
3	Memory Match	Visual memory matching activity
4	Sequence Memory	Sequential recall activity
5	Object Recall	Object-based memory activity
6	NER Cultural Recall	Region-focused cognitive activity
7	Recommendations	Suggests suitable next activities
8	My Memories	Personal memory assistance
9	Reminders	Everyday reminder management
10	Voice Input	Voice-based interaction
11	Caregiver Dashboard	Caregiver-oriented monitoring and support
12	Authentication	User authentication and session management


🔄 Personalization Engine
Cognicare NER follows a performance-driven personalization loop.
Step 1 — User Starts an Activity
The elderly user selects and plays a cognitive activity.
Step 2 — Performance is Recorded
The system records activity-related information including:
- Accuracy
- Response time
- Mistakes
- Session information
Step 3 — Performance is Analyzed
The recommendation engine evaluates the recent activity performance.
Step 4 — Next Activity is Recommended
The system selects a suitable activity based on the user's previous performance.
Step 5 — Personalization Continues
The next session generates new performance data, allowing recommendations to continue adapting.
        User Activity
             ↓
     Performance Data
             ↓
   ┌────────────────────┐
   │ Accuracy           │
   │ Response Time      │
   │ Mistakes           │
   │ Session History    │
   └─────────┬──────────┘
             ↓
   Personalization Engine
             ↓
   Recommended Activity
             ↓
        New Session
             │
             └──────────────→ Continuous Adaptation

🏗️ System Architecture
                         ┌───────────────────┐
                         │   Elderly User    │
                         │   Touch / Voice   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    React + PWA    │
                         │ Elder-Friendly UI │
                         └─────────┬─────────┘
                                   │
                              REST API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      FastAPI      │
                         │                   │
                         │ • Authentication  │
                         │ • Game Engine     │
                         │ • API Services    │
                         └────────┬──────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
                   ▼                             ▼
          ┌─────────────────┐         ┌────────────────────┐
          │   PostgreSQL    │         │ Personalization    │
          │                 │         │ & Recommendation   │
          │ • User Data     │         │ Engine             │
          │ • Sessions      │         │                    │
          │ • Memories      │         │ • Accuracy         │
          │ • Activity Data │         │ • Response Time    │
          └─────────────────┘         │ • Mistakes         │
                                      └─────────┬──────────┘
                                                │
                                                ▼
                                    ┌─────────────────────┐
                                    │ Recommended Next    │
                                    │ Cognitive Activity  │
                                    └─────────────────────┘

⚙️ How the System Works
1. User Interaction
The elderly user interacts with the application through touch-based controls or voice input.
2. Activity Selection
The user can select a cognitive game or receive a recommendation.
3. Activity Session
The selected activity records relevant interaction and performance information.
4. Data Storage
Session and user-related information is handled through the backend and PostgreSQL database.
5. Performance Evaluation
The personalization engine evaluates recent activity performance.
6. Recommendation
The recommendation system selects the next suitable cognitive activity.
7. Caregiver Support
Relevant information can be surfaced through caregiver-oriented functionality.
💻 Technology Stack
Frontend
Technology	Purpose
React	User interface
Vite	Frontend build tooling
JavaScript	Application logic
HTML5	Application structure
CSS3	Styling
PWA	Installable and app-like experience


Backend
Technology	Purpose
Python	Backend development
FastAPI	REST API framework
REST API	Frontend-backend communication
JSON	Data exchange format


Database
Technology	Purpose
PostgreSQL	Persistent application data


Personalization
Technology	Purpose
Rule-Based Engine	Activity personalization
Recommendation System	Next-activity selection


🗄️ Database Architecture
The backend uses PostgreSQL for structured application data.
The database is designed to support information such as:
User Data
- User profile
- Authentication-related information
- User preferences
Session Data
- Activity sessions
- Performance information
- Session history
Memory Data
- Personal memories
- Memory-related information
Activity Data
- Cognitive activity performance
- Accuracy
- Response time
- Mistakes
This information supports the personalization workflow and application functionality.

🚀 Installation & Local Setup
Prerequisites
Make sure the following are installed:
- Node.js
- npm
- Python 3.x
- PostgreSQL
- Git

🧪 Prototype Testing
The Cognicare NER prototype has been tested across major application modules, including:
- Authentication
- Dashboard
- Cognitive Games
- Memory Match
- Sequence Memory
- Object Recall
- NER Cultural Recall
- Voice Interaction
- Personal Memories
- Reminders
- Caregiver functionality
- Recommendation functionality
Testing focuses on:
- Functional correctness
- User interaction
- Navigation
- API communication
- Data flow
- Personalization behavior
- Elder-friendly usability
📸 Screenshots & UI Showcase

🏠 Elder-Friendly Dashboard
[Cognicare Dashboard](public/Screenshots/Dashboard.jpeg)

The dashboard provides a simple entry point to cognitive activities and assistance features.
🧠 Cognitive Games
[Cognitive Games Dashboard](public/Screenshots/cognitive_games_dashboard.jpeg)

Demonstrates voice-enabled interaction for the elderly user.
👨‍👩‍👧 Caregiver Dashboard
[Caregiver-Dashboard](public/Screenshots/caregiver_dashboard.jpeg)

Provides caregiver-oriented functionality and relevant user activity information.
🎯 Hackathon Alignment
Cognicare NER addresses the hackathon problem through several major design decisions.
Elder-Centric Design
The platform prioritizes simple navigation and accessible interactions for elderly users.
Cognitive Gaming
Multiple memory and recall activities are integrated into the platform.
Personalization
User performance is used to recommend suitable activities rather than following a fixed sequence.
Memory Assistance
Personal memories and reminders extend the platform beyond cognitive games.
Voice Interaction
Voice-based interaction provides an additional input mechanism.
Caregiver Support
Caregiver-oriented functionality creates a support ecosystem around the elderly user.
NER Focus
The project is designed around the North Eastern Region and includes scope for culturally familiar cognitive experiences.
🌟 Innovation
Cognicare NER focuses on personalization and accessibility rather than treating cognitive assistance as a one-size-fits-all experience.

The platform can adapt activities according to the user's interaction and performance, while providing an interface designed with elderly users in mind.

## 🚀 Key Innovation

### 1. Performance-Based Personalization
The platform uses actual user interaction data to influence future activity recommendations.

### 2. Cognitive Assistance + Everyday Support
Cognicare NER combines cognitive activities with:
- Memories
- Reminders
- Voice interaction
- Caregiver functionality

in one platform.

### 3. Elder-First Interaction
The application is designed around usability for elderly users rather than assuming advanced digital literacy.

### 4. Regional Cognitive Content
The NER Cultural Recall concept provides a foundation for introducing culturally familiar content into cognitive activities.

### 5. Continuous Personalization
Each activity session can contribute to future recommendations, creating a continuous feedback loop.

## 🔐 Privacy & Responsible Design

Cognicare NER is intended as an assistive technology platform.

It is designed to support:
- Cognitive engagement
- Memory assistance
- Personalized activities
- Everyday reminders
- Caregiver support

Personal information, sessions, memories, and activity-related data are handled through the application's backend and database.

## ⚠️ Medical Disclaimer

Cognicare NER is **NOT a medical diagnostic system**.

It is an assistive prototype intended for cognitive engagement, memory assistance, personalization, and caregiver support.

## 🎥 Hackathon Demo

Add your demonstration video or presentation link here.

## 👥 Team

### Team NeuroCare

| Name | Role |
|---|---|
| Mratunjay Gaur | Project Lead / Development |
| Saksham Singh | Frontend Development |
| Ayush Yadav | Backend / Database |
| Abhinav Gupta | Testing / Research / Documentation |

## ❤️ Our Vision

We believe elderly users deserve technology that is:

**Simple. Accessible. Personalized. Meaningful.**

Cognicare NER aims to combine cognitive engagement and everyday assistance into a platform that feels natural and supportive for elderly users.

**Technology should adapt to people — not force people to adapt to technology.**

---

Hackathon Project — **Cognicare NER**
**Team NeuroCare**

The platform should not be used to diagnose dementia, Alzheimer's disease, or any other medical condition.
Activity performance is used for personalization and assistance within the prototype and should not be interpreted as a clinical assessment.
📴 Local Prototype & Evaluation
The current project is maintained primarily as a hackathon prototype for local development, testing, demonstration, and evaluation.
The current scope focuses on demonstrating the concept, functionality, personalization workflow, and elder-friendly interaction rather than production deployment.
🔮 Future Scope
The concept can be extended in several directions.
🌐 Multilingual Support
Introduce broader regional language support including languages relevant to the North Eastern Region.
🧠 Advanced Personalization
Develop more advanced adaptive models using larger amounts of user activity data.
🏞️ Expanded NER Cultural Activities
Introduce more culturally familiar memory prompts, objects, stories, places, and activities from the North Eastern Region.
🗣️ Improved Voice Assistance
Expand voice interaction into a more complete conversational assistance system.
📊 Advanced Caregiver Analytics
Provide richer activity summaries and long-term engagement insights for caregivers.
♿ Accessibility Improvements
Further improve text sizing, contrast, audio guidance, navigation, and accessibility controls.
🤖 AI-Assisted Personalization
Future versions can explore stronger AI-assisted recommendation and personalization capabilities while keeping the system responsible and assistive.
📌 Project Status
## 📌 Project Status

**Status: 🚧 Hackathon Prototype**

Cognicare NER is a functional prototype demonstrating personalized cognitive activities and memory assistance for elderly users.

The project is intended for:
- Hackathon demonstration
- Prototype evaluation
- Academic/project presentation
- Further research and development

## 🎥 Demo & Presentation

### Demo Video

▶️ **Watch Cognicare NER Demo**

_Add the final demo video link here._

### Hackathon Presentation

📊 **Cognicare NER Hackathon Presentation**

_Add the presentation link here._

### Project Repository

**NeuroCare — Cognicare NER**

`https://github.com/singhsaksham1903-cloud/NeuroCare`

## 👥 Team & Contributors

### Team NeuroCare

| Name | Contribution |
|---|---|
| Mratunjay Gaur | Project Lead / Development |
| Saksham Singh | Frontend Development |
| Ayush Yadav | Backend / Database |
| Abhinav Gupta | Testing / Research / Documentation |

## 🧠 Cognicare NER

**Team NeuroCare**

*Hackathon Prototype • Cognitive Assistance • Memory Support • Elder-Friendly Technology*