# SAMEEKSHA.AI — FULL PROJECT SYSTEM MODULE

---

## 1. PLATFORM OVERVIEW

Sameeksha.AI is a centralized, AI-powered academic and assessment management platform designed for universities, colleges, and training institutes.

It provides a secure, scalable, and role-based system to manage:
- Assessments
- Attendance
- Academic activities
- Reporting
- Governance

### Goals
- Eliminate manual processes
- Prevent cheating in exams
- Provide real-time academic visibility
- Enable scalable multi-institution deployment

---

## 2. CORE OBJECTIVES

- Secure and cheat-resistant assessments
- Flexible exam configuration
- Centralized academic data management
- Real-time monitoring and control
- Audit-ready reporting system
- Multi-tenant scalability

---

## 3. ROLE-BASED SYSTEM

### Roles
- Admin (College / Department)
- Faculty / Trainer
- Student

PERMISSION MATRIX (CORE)
Module            Admin   Faculty   Student  
----------------------------------------------------
User Mgmt         ✔️       ❌        ❌         
Academic Setup    ✔️       ❌        ❌        
Assessment        ✔️       ✔️        ✔️(attempt) 
Question Bank     ✔️       ✔️        ❌        
Proctoring        ✔️       ✔️        ❌        
Attendance        ✔️       ✔️        ✔️(view)  
Assignments       ✔️       ✔️        ✔️        
Reports           ✔️       ✔️        ✔️        
Monitoring        ✔️       ✔️        ❌        

---

### 3.1 ADMIN (COLLEGE / DEPARTMENT)

- Manage departments, courses, batches
- Assign faculty
- Approve assessments
- Configure exam policies
- Access reports and audit logs
- Manage updates and events

---

### 3.2 FACULTY / TRAINER

- Create question banks
- Create assessments
- Monitor live exams

#### Monitoring Dashboard
- Violation alerts
- Webcam snapshots
- Actions (warn, extend, terminate)

- Mark attendance
- Manage assignments
- Evaluate submissions

---

### 3.3 STUDENT

- Attempt exams
- View attendance
- Track performance
- Submit assignments
- View reports and results
 
---

## 4. CORE MODULES

---

### 4.1 ASSESSMENT MODULE

#### Features
- MCQ, Coding, Subjective exams
- Section and sub-section structure
- Difficulty-based question selection
- Real-time monitoring
- Anti-cheating mechanisms
- Performance reports

---

### 4.2 ASSESSMENT STRUCTURE

Test Template  
→ Section  
→ Sub-Section  
→ Questions  

#### Rule Inheritance
- Test-level rules apply globally
- Sections can override rules
- Sub-sections can override section rules

---

### 4.3 QUESTION MANAGEMENT

#### Question Types
- MCQ
- Coding (C, C++, Java, Python, JavaScript)
- Subjective
- Framework-based

#### Attributes
- Tags (mandatory)
- Difficulty (Easy, Medium, Hard)
- Metadata

#### Features
- Bulk upload (Excel/Doc)
- Manual upload
- Duplicate prevention
- Test cases support

---

### 4.4 TEST CONFIGURATION

#### Test-Level
- Duration
- Device restriction
- IP restriction
- Auto reporting

#### Proctoring

**Window Proctoring**
- Tab switching detection
- Violation thresholds

**Webcam Proctoring**
- Face detection
- Multiple face detection
- Movement tracking

**Suspicion Score**
- Calculated from violations
- Visible to admin/faculty

#### Section-Level
- Marks and timing
- Question pooling
- Proctoring rules

#### Sub-Section Level
- Independent timing
- Independent marks
- Proctoring override

---

### 4.5 TEST HOSTING

- Private (email-based)
- Public (link-based)
- OTP authentication
- Editable after publishing (controlled)

---

### 4.6 STUDENT TEST FLOW

Login  
→ OTP verification  
→ Device/IP validation  
→ Questionnaire  
→ Instructions  
→ Exam execution  
→ Submission  

---

### 4.7 QUESTIONNAIRE MODULE

- Collect student data before exam
- Configurable fields
- Stored with attempt data

---

### 4.8 REPORTING SYSTEM

#### Individual Reports
- Student performance
- Section-wise analysis
- Question analysis
- Proctoring summary
- Email report option

#### Bulk Reports
- Excel export
- Public report links

---

### 4.9 EMAIL REPORT DELIVERY

- Auto-send reports
- PDF or link format
- Bulk resend option

---

### 4.10 ATTENDANCE MODULE

- Manual attendance
- Bulk upload
- QR-based attendance
- Geo-fencing

---

### 4.11 ACADEMIC CALENDAR

- Semester schedules
- Exam timelines
- Events and holidays
- Notifications

---

### 4.12 ASSIGNMENT MODULE

- Assignment creation
- Submission tracking
- Evaluation and feedback

---

### 4.13 NOTIFICATION SYSTEM

- Email notifications
- SMS alerts
- In-app notifications

---

### 4.14 INTEGRATION MODULE

- ERP integration
- LMS integration
- DigiLocker / ABC
- Payment gateways

---

## 5. BACKEND ARCHITECTURE

### Core Services
- Authentication Service
- User Management Service
- Assessment Service
- Question Bank Service
- Proctoring Service
- Reporting Service
- Attendance Service
- Assignment Service
- Notification Service
- Integration Service

### Characteristics
- Stateless services
- Microservices architecture
- Scalable design

---

## 6. DATABASE DESIGN

### Core Tables
- Users
- Roles
- Institutions
- Courses
- Tests
- Sections
- Questions
- Attempts
- Answers
- Violations
- Reports
- Attendance
- Assignments

### Data Handling
- JSON-based dynamic configurations
- Indexed queries for performance

---

## 7. SECURITY & COMPLIANCE

- Role-based access control (RBAC)
- OTP authentication
- Device and IP restriction
- Encrypted data storage
- Audit logging
- Compliance (NAAC, NBA, GDPR)

---

## 8. AI ENGINE

### Features
- Suspicion score calculation
- Performance prediction
- Risk detection
- Behavior analysis

---

## 9. SCALABILITY & PERFORMANCE

- Multi-tenant architecture
- Horizontal scaling
- High concurrency support
- Fault-tolerant submissions


---

## 10. CORE PRINCIPLE

Sameeksha.AI is a unified academic operating system where:

- All actions are role-based
- All modules are permission-controlled
- All activities are auditable
- All data feeds into analytics and intelligence

---
