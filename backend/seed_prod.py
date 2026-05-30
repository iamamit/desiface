"""
Production seed — 50 realistic Indian-in-Germany users
Run: docker compose exec backend python seed_prod.py
"""
import random
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.comment import Comment
from app.models.connection import Connection
from app.models.like import Like
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post

AMIT_ID = uuid.UUID("8eb80af4-598a-4956-97e0-e9c7a06ad9af")
random.seed(42)

# ── 10 testable users (OTP goes to amit's Gmail via + addressing) ────────────
TEST_USERS = [
    dict(username="sneha_kapoor", email="amit2608.ag+sneha@gmail.com",
         full_name="Sneha Kapoor", headline="Frontend Engineer @ N26", location="Berlin, Germany",
         bio="Mumbai girl navigating Berlin's startup scene. React, TypeScript and way too much Club Mate.",
         skills=["React", "TypeScript", "CSS", "Figma", "Next.js"],
         work_experience=[{"title": "Frontend Engineer", "company": "N26", "start_date": "2022-04", "end_date": None, "current": True, "description": "Building the mobile banking interface for 8M+ customers."}],
         education=[{"school": "Mumbai University", "degree": "B.Sc.", "field": "Computer Science", "start_date": "2016-07", "end_date": "2019-05"}]),

    dict(username="rahul_verma", email="amit2608.ag+rahul@gmail.com",
         full_name="Rahul Verma", headline="ML Engineer @ Siemens Healthineers", location="Erlangen, Germany",
         bio="Using AI to improve medical diagnostics. IIT Delhi → TU Munich → Siemens. Cricket on weekends.",
         skills=["PyTorch", "Python", "MLOps", "ONNX", "C++"],
         work_experience=[{"title": "ML Engineer", "company": "Siemens Healthineers", "start_date": "2021-09", "end_date": None, "current": True, "description": "Developing AI models for radiology and pathology imaging."}],
         education=[{"school": "Technical University of Munich", "degree": "M.Sc.", "field": "Robotics & AI", "start_date": "2019-10", "end_date": "2021-07"}, {"school": "IIT Delhi", "degree": "B.Tech", "field": "Electrical Engineering", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="kavya_menon", email="amit2608.ag+kavya@gmail.com",
         full_name="Kavya Menon", headline="Product Manager @ Zalando", location="Berlin, Germany",
         bio="Keralite in Berlin. Building fashion-tech products. Ex-Flipkart. Love hiking and South Indian food.",
         skills=["Product Strategy", "OKRs", "A/B Testing", "SQL", "Roadmapping"],
         work_experience=[{"title": "Product Manager", "company": "Zalando SE", "start_date": "2023-01", "end_date": None, "current": True, "description": "Leading the search & discovery experience for the fashion platform."}],
         education=[{"school": "IIM Bangalore", "degree": "MBA", "field": "Strategy", "start_date": "2019-06", "end_date": "2021-05"}]),

    dict(username="aditya_singh", email="amit2608.ag+aditya@gmail.com",
         full_name="Aditya Singh", headline="Backend Engineer @ Delivery Hero", location="Berlin, Germany",
         bio="Delhi boy, Berlin life. Go, Kafka, and distributed systems. Also passionate about chess.",
         skills=["Go", "Kafka", "PostgreSQL", "Kubernetes", "gRPC"],
         work_experience=[{"title": "Senior Backend Engineer", "company": "Delivery Hero", "start_date": "2020-11", "end_date": None, "current": True, "description": "Building high-throughput order processing systems handling 1M+ daily orders."}],
         education=[{"school": "BITS Pilani", "degree": "B.E.", "field": "Computer Science", "start_date": "2013-08", "end_date": "2017-06"}]),

    dict(username="pooja_reddy", email="amit2608.ag+pooja@gmail.com",
         full_name="Pooja Reddy", headline="Data Analyst @ Deutsche Bank", location="Frankfurt, Germany",
         bio="Hyderabad native, Frankfurt based. Turning numbers into decisions in finance. Also a weekend baker.",
         skills=["SQL", "Python", "Power BI", "Tableau", "Excel"],
         work_experience=[{"title": "Data Analyst", "company": "Deutsche Bank", "start_date": "2022-03", "end_date": None, "current": True, "description": "Analytics for the corporate banking division."}],
         education=[{"school": "ICFAI Business School", "degree": "MBA", "field": "Finance & Analytics", "start_date": "2019-07", "end_date": "2021-06"}]),

    dict(username="nikhil_joshi", email="amit2608.ag+nikhil@gmail.com",
         full_name="Nikhil Joshi", headline="DevOps Lead @ SAP SE", location="Walldorf, Germany",
         bio="Pune → Walldorf. Kubernetes at work, hiking in the Black Forest on weekends. Proud Maharashtrian.",
         skills=["Kubernetes", "Terraform", "AWS", "Jenkins", "Python", "Helm"],
         work_experience=[{"title": "DevOps Lead", "company": "SAP SE", "start_date": "2019-06", "end_date": None, "current": True, "description": "Leading cloud-native infrastructure migration for SAP BTP services."}],
         education=[{"school": "College of Engineering Pune", "degree": "B.E.", "field": "Computer Engineering", "start_date": "2012-08", "end_date": "2016-05"}]),

    dict(username="ishaan_batra", email="amit2608.ag+ishaan@gmail.com",
         full_name="Ishaan Batra", headline="UX Researcher @ BMW Group", location="Munich, Germany",
         bio="Designing future mobility experiences. Delhi → Munich. Human-centered design is my religion.",
         skills=["User Research", "Figma", "Usability Testing", "Service Design", "Miro"],
         work_experience=[{"title": "UX Researcher", "company": "BMW Group", "start_date": "2021-04", "end_date": None, "current": True, "description": "Conducting research for connected car and EV user experience."}],
         education=[{"school": "National Institute of Design Ahmedabad", "degree": "M.Des", "field": "Interaction Design", "start_date": "2017-07", "end_date": "2019-06"}]),

    dict(username="meera_pillai", email="amit2608.ag+meera@gmail.com",
         full_name="Meera Pillai", headline="Research Scientist @ Max Planck Institute", location="Munich, Germany",
         bio="Computational neuroscience PhD. Trying to understand the brain, one synapse at a time. Trivandrum → Munich.",
         skills=["MATLAB", "Python", "R", "fMRI Analysis", "Deep Learning"],
         work_experience=[{"title": "Research Scientist", "company": "Max Planck Institute for Neuroscience", "start_date": "2022-10", "end_date": None, "current": True, "description": "Studying neural correlates of decision-making using computational models."}],
         education=[{"school": "LMU Munich", "degree": "Ph.D.", "field": "Computational Neuroscience", "start_date": "2018-10", "end_date": "2022-09"}]),

    dict(username="tanmay_shah", email="amit2608.ag+tanmay@gmail.com",
         full_name="Tanmay Shah", headline="Startup Founder | Ex-Google", location="Berlin, Germany",
         bio="Building a fintech for the Indian diaspora in Europe. Prev: Google, McKinsey. Ahmedabad at heart.",
         skills=["Product Vision", "Fundraising", "Go-to-Market", "B2B Sales", "Python"],
         work_experience=[{"title": "Co-Founder & CEO", "company": "Diaspora Finance GmbH", "start_date": "2023-06", "end_date": None, "current": True, "description": "Building cross-border financial products for Indians living in Europe."}, {"title": "Product Manager", "company": "Google", "start_date": "2020-01", "end_date": "2023-05", "current": False, "description": "Google Pay team."}],
         education=[{"school": "IIM Ahmedabad", "degree": "MBA", "field": "Finance", "start_date": "2017-06", "end_date": "2019-05"}]),

    dict(username="divya_nambiar", email="amit2608.ag+divya@gmail.com",
         full_name="Divya Nambiar", headline="Cloud Architect @ Bosch", location="Stuttgart, Germany",
         bio="Azure & GCP certified architect. Calicut girl, Stuttgart home. Love Carnatic music and trail running.",
         skills=["Azure", "GCP", "Microservices", "Java", "Spring Boot", "Terraform"],
         work_experience=[{"title": "Cloud Architect", "company": "Robert Bosch GmbH", "start_date": "2020-08", "end_date": None, "current": True, "description": "Designing cloud architecture for IoT and automotive software platforms."}],
         education=[{"school": "NIT Calicut", "degree": "B.Tech", "field": "Computer Science", "start_date": "2013-08", "end_date": "2017-05"}]),
]

# ── 40 additional seed users ─────────────────────────────────────────────────
SEED_USERS = [
    dict(username="aryan_malhotra", email="aryan.malhotra@seed.dev",
         full_name="Aryan Malhotra", headline="Software Engineer @ Mercedes-Benz", location="Stuttgart, Germany",
         bio="Building the cars of tomorrow. Chandigarh → Stuttgart. Avid chess player and weekend cyclist.",
         skills=["C++", "ROS", "Python", "Embedded Systems", "AUTOSAR"],
         work_experience=[{"title": "Software Engineer", "company": "Mercedes-Benz AG", "start_date": "2021-07", "end_date": None, "current": True, "description": "Autonomous driving software stack development."}],
         education=[{"school": "IIT Roorkee", "degree": "B.Tech", "field": "Computer Science", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="shreya_das", email="shreya.das@seed.dev",
         full_name="Shreya Das", headline="Biotech Researcher @ Bayer AG", location="Berlin, Germany",
         bio="PhD in Molecular Biology. Kolkata → Humboldt → Bayer. Passionate about gene therapies.",
         skills=["CRISPR", "Bioinformatics", "Python", "R", "Cell Biology"],
         work_experience=[{"title": "Research Scientist", "company": "Bayer AG", "start_date": "2023-03", "end_date": None, "current": True, "description": "Gene therapy research for oncology."}],
         education=[{"school": "Humboldt University Berlin", "degree": "Ph.D.", "field": "Molecular Biology", "start_date": "2019-10", "end_date": "2023-01"}]),

    dict(username="karan_patel", email="karan.patel@seed.dev",
         full_name="Karan Patel", headline="Finance Manager @ Allianz", location="Munich, Germany",
         bio="Gujarati in Munich. From Surat to Bavaria — a journey worth every schnitzel. CFA Level III candidate.",
         skills=["Financial Modeling", "Risk Management", "Bloomberg", "Python", "Excel"],
         work_experience=[{"title": "Finance Manager", "company": "Allianz SE", "start_date": "2020-09", "end_date": None, "current": True, "description": "Managing investment portfolios and risk analytics for the DACH region."}],
         education=[{"school": "SP Jain Institute of Management", "degree": "MBA", "field": "Finance", "start_date": "2017-06", "end_date": "2019-05"}]),

    dict(username="prithvi_rao", email="prithvi.rao@seed.dev",
         full_name="Prithvi Rao", headline="Platform Engineer @ Google", location="Munich, Germany",
         bio="Bangalore to Munich via Google. Infrastructure at scale. Badminton and filter coffee enthusiast.",
         skills=["Go", "Kubernetes", "SRE", "Prometheus", "GCP"],
         work_experience=[{"title": "Platform Engineer", "company": "Google", "start_date": "2019-08", "end_date": None, "current": True, "description": "SRE for Google's core infrastructure services in EMEA."}],
         education=[{"school": "IISc Bangalore", "degree": "M.Tech", "field": "Computer Science", "start_date": "2016-08", "end_date": "2018-07"}]),

    dict(username="anika_sinha", email="anika.sinha@seed.dev",
         full_name="Anika Sinha", headline="HR Business Partner @ Infineon", location="Munich, Germany",
         bio="People are my product. Patna → Munich. Building inclusive workplaces in the semiconductor industry.",
         skills=["Talent Acquisition", "HRBP", "OKRs", "People Analytics", "Workday"],
         work_experience=[{"title": "HR Business Partner", "company": "Infineon Technologies", "start_date": "2021-02", "end_date": None, "current": True, "description": "Supporting R&D and engineering teams of 500+ employees."}],
         education=[{"school": "XLRI Jamshedpur", "degree": "PGDM", "field": "Human Resources", "start_date": "2018-06", "end_date": "2020-05"}]),

    dict(username="varun_khanna", email="varun.khanna@seed.dev",
         full_name="Varun Khanna", headline="Consultant @ McKinsey & Co.", location="Frankfurt, Germany",
         bio="Strategy meets execution. Delhi → Wharton → McKinsey Frankfurt. Travel addict. 40 countries and counting.",
         skills=["Strategy", "M&A", "Financial Analysis", "PowerPoint", "Stakeholder Management"],
         work_experience=[{"title": "Engagement Manager", "company": "McKinsey & Company", "start_date": "2020-09", "end_date": None, "current": True, "description": "Leading digital transformation projects for DAX 40 clients."}],
         education=[{"school": "The Wharton School", "degree": "MBA", "field": "Finance & Strategy", "start_date": "2018-08", "end_date": "2020-05"}]),

    dict(username="anushka_tiwari", email="anushka.tiwari@seed.dev",
         full_name="Anushka Tiwari", headline="Full Stack Developer @ Celonis", location="Munich, Germany",
         bio="Process mining and process improvement. Lucknow girl in Munich. React + Node is my jam.",
         skills=["React", "Node.js", "TypeScript", "MongoDB", "GraphQL"],
         work_experience=[{"title": "Full Stack Developer", "company": "Celonis", "start_date": "2022-06", "end_date": None, "current": True, "description": "Building process intelligence applications for enterprise clients."}],
         education=[{"school": "IIIT Allahabad", "degree": "B.Tech", "field": "IT", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="saurabh_gupta", email="saurabh.gupta@seed.dev",
         full_name="Saurabh Gupta", headline="Mechanical Engineer @ MAN Truck", location="Munich, Germany",
         bio="Designing electric trucks for a cleaner future. UP wala, Bavaria se pyaar hai.",
         skills=["CAD/CAM", "ANSYS", "MATLAB", "EV Powertrain", "Six Sigma"],
         work_experience=[{"title": "Mechanical Engineer", "company": "MAN Truck & Bus SE", "start_date": "2020-03", "end_date": None, "current": True, "description": "Electric powertrain systems for heavy commercial vehicles."}],
         education=[{"school": "IIT Kanpur", "degree": "B.Tech", "field": "Mechanical Engineering", "start_date": "2014-08", "end_date": "2018-05"}]),

    dict(username="lavanya_subramanian", email="lavanya.subramanian@seed.dev",
         full_name="Lavanya Subramanian", headline="Data Engineer @ Spotify", location="Berlin, Germany",
         bio="Building data pipelines for 600M music lovers. Chennai → Berlin. Veena player, pasta chef.",
         skills=["Apache Spark", "dbt", "Snowflake", "Python", "Airflow"],
         work_experience=[{"title": "Data Engineer", "company": "Spotify", "start_date": "2022-01", "end_date": None, "current": True, "description": "Data platform engineering for the Personalization ML team."}],
         education=[{"school": "Anna University", "degree": "B.E.", "field": "Computer Science", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="sameer_hussain", email="sameer.hussain@seed.dev",
         full_name="Sameer Hussain", headline="Security Engineer @ Giesecke+Devrient", location="Munich, Germany",
         bio="Keeping digital identities safe. Hyderabad → Munich. Cybersecurity by day, rock climbing by evening.",
         skills=["Penetration Testing", "PKI", "HSM", "Python", "SIEM"],
         work_experience=[{"title": "Security Engineer", "company": "Giesecke+Devrient", "start_date": "2021-05", "end_date": None, "current": True, "description": "Security solutions for banking, telecom, and government identity systems."}],
         education=[{"school": "JNTU Hyderabad", "degree": "B.Tech", "field": "Computer Science", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="chitra_gopalan", email="chitra.gopalan@seed.dev",
         full_name="Chitra Gopalan", headline="AI Product Manager @ Microsoft", location="Munich, Germany",
         bio="Building AI-first products that actually work. Coimbatore → IIT → Microsoft. Bharatanatyam dancer.",
         skills=["AI/ML Products", "Azure AI", "User Research", "Agile", "Product Analytics"],
         work_experience=[{"title": "Senior Product Manager", "company": "Microsoft", "start_date": "2021-08", "end_date": None, "current": True, "description": "Copilot integrations for Microsoft 365 enterprise customers."}],
         education=[{"school": "IIT Bombay", "degree": "M.Tech", "field": "Computer Science", "start_date": "2016-07", "end_date": "2018-06"}]),

    dict(username="abhijeet_kulkarni", email="abhijeet.kulkarni@seed.dev",
         full_name="Abhijeet Kulkarni", headline="Site Reliability Engineer @ Amazon", location="Berlin, Germany",
         bio="99.99% uptime is the goal. Nagpur → AWS Berlin. Learning German slowly but surely — B1 cleared!",
         skills=["AWS", "Linux", "Python", "Terraform", "Incident Management"],
         work_experience=[{"title": "SRE", "company": "Amazon Web Services", "start_date": "2022-03", "end_date": None, "current": True, "description": "Reliability engineering for AWS EC2 and EKS services in EU-West."}],
         education=[{"school": "VNIT Nagpur", "degree": "B.Tech", "field": "Computer Science", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="riya_chakraborty", email="riya.chakraborty@seed.dev",
         full_name="Riya Chakraborty", headline="Marketing Manager @ Adidas", location="Herzogenaurach, Germany",
         bio="Brand storytelling and sports culture. Kolkata → Herzogenaurach. Running 5ks and building campaigns.",
         skills=["Brand Strategy", "Digital Marketing", "Content Strategy", "Google Analytics", "Social Media"],
         work_experience=[{"title": "Marketing Manager", "company": "Adidas AG", "start_date": "2020-06", "end_date": None, "current": True, "description": "Managing digital marketing campaigns for APAC and EMEA markets."}],
         education=[{"school": "Jadavpur University", "degree": "M.B.A.", "field": "Marketing", "start_date": "2017-07", "end_date": "2019-06"}]),

    dict(username="harshit_agarwal", email="harshit.agarwal@seed.dev",
         full_name="Harshit Agarwal", headline="Embedded Systems Engineer @ Continental", location="Frankfurt, Germany",
         bio="ADAS and autonomous systems. Jaipur → Frankfurt. Currently learning to love German bureaucracy.",
         skills=["C", "C++", "AUTOSAR", "CAN Bus", "MISRA"],
         work_experience=[{"title": "Embedded Systems Engineer", "company": "Continental AG", "start_date": "2021-03", "end_date": None, "current": True, "description": "ADAS sensor fusion algorithms for Level 3 autonomous driving."}],
         education=[{"school": "MNIT Jaipur", "degree": "B.Tech", "field": "Electronics", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="nandini_iyer", email="nandini.iyer@seed.dev",
         full_name="Nandini Iyer", headline="PhD Candidate @ TU München", location="Munich, Germany",
         bio="Researching sustainable manufacturing. Chennai → Munich. Choir singer, Kolam artist.",
         skills=["LCA", "Sustainability", "Python", "MATLAB", "Supply Chain"],
         work_experience=[{"title": "Research Assistant", "company": "TU München", "start_date": "2021-10", "end_date": None, "current": True, "description": "Life cycle assessment of lithium-ion battery production processes."}],
         education=[{"school": "TU München", "degree": "Ph.D.", "field": "Sustainable Engineering", "start_date": "2021-10", "end_date": None}]),

    dict(username="suresh_babu", email="suresh.babu@seed.dev",
         full_name="Suresh Babu", headline="Operations Manager @ DHL", location="Frankfurt, Germany",
         bio="Making logistics work. Chennai → Frankfurt. 10 years of supply chain, 0 lost packages on my watch.",
         skills=["Supply Chain", "SAP ERP", "Six Sigma Black Belt", "Logistics", "Project Management"],
         work_experience=[{"title": "Operations Manager", "company": "DHL Group", "start_date": "2018-04", "end_date": None, "current": True, "description": "Managing last-mile delivery operations for DACH and Benelux."}],
         education=[{"school": "Anna University", "degree": "B.E.", "field": "Mechanical Engineering", "start_date": "2009-08", "end_date": "2013-05"}]),

    dict(username="kritika_sharma", email="kritika.sharma@seed.dev",
         full_name="Kritika Sharma", headline="UX Designer @ Volkswagen Digital", location="Berlin, Germany",
         bio="Designing for mobility and sustainability. Jaipur → VW Berlin. Sketching ideas on paper and Figma.",
         skills=["Figma", "User Journey Mapping", "Design Thinking", "CSS", "Accessibility"],
         work_experience=[{"title": "Senior UX Designer", "company": "Volkswagen Digital", "start_date": "2021-01", "end_date": None, "current": True, "description": "Digital product design for VW's new EV charging network."}],
         education=[{"school": "Srishti Institute of Art", "degree": "B.Des", "field": "Interaction Design", "start_date": "2014-07", "end_date": "2018-06"}]),

    dict(username="arun_pillai", email="arun.pillai@seed.dev",
         full_name="Arun Pillai", headline="Blockchain Developer @ Deutsche Börse", location="Frankfurt, Germany",
         bio="Building financial infrastructure on distributed ledgers. Thrissur → Frankfurt. Mridangam player.",
         skills=["Solidity", "Ethereum", "Web3.js", "DeFi", "Rust"],
         work_experience=[{"title": "Blockchain Developer", "company": "Deutsche Börse Group", "start_date": "2022-05", "end_date": None, "current": True, "description": "Digital assets settlement platform using distributed ledger technology."}],
         education=[{"school": "College of Engineering Trivandrum", "degree": "B.Tech", "field": "Computer Science", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="swati_jain", email="swati.jain@seed.dev",
         full_name="Swati Jain", headline="Product Analyst @ Klarna", location="Berlin, Germany",
         bio="Growth and retention metrics. Indore → Berlin. Turning A/B tests into product decisions.",
         skills=["SQL", "Python", "Mixpanel", "Amplitude", "Growth Hacking"],
         work_experience=[{"title": "Product Analyst", "company": "Klarna", "start_date": "2022-09", "end_date": None, "current": True, "description": "Analytics for Klarna's Buy Now Pay Later checkout product."}],
         education=[{"school": "IIT Indore", "degree": "B.Tech", "field": "Mathematics & Computing", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="rohit_pandey", email="rohit.pandey@seed.dev",
         full_name="Rohit Pandey", headline="Network Engineer @ Deutsche Telekom", location="Bonn, Germany",
         bio="5G networks and beyond. Varanasi → Bonn. German B2 cleared. Loves table tennis.",
         skills=["5G", "Network Architecture", "Cisco", "Python", "SDN"],
         work_experience=[{"title": "Network Engineer", "company": "Deutsche Telekom", "start_date": "2020-07", "end_date": None, "current": True, "description": "5G core network deployment and optimization for Germany."}],
         education=[{"school": "BHU Varanasi", "degree": "B.Tech", "field": "Electronics & Communication", "start_date": "2014-08", "end_date": "2018-05"}]),

    dict(username="preeti_mishra", email="preeti.mishra@seed.dev",
         full_name="Preeti Mishra", headline="Legal Counsel @ BASF", location="Ludwigshafen, Germany",
         bio="IP and corporate law for the chemical industry. Allahabad → Heidelberg → BASF. Also a yoga instructor.",
         skills=["IP Law", "Contract Negotiation", "GDPR", "Corporate Law", "German Law"],
         work_experience=[{"title": "Legal Counsel", "company": "BASF SE", "start_date": "2021-06", "end_date": None, "current": True, "description": "Managing intellectual property portfolio and technology licensing agreements."}],
         education=[{"school": "Heidelberg University", "degree": "LL.M.", "field": "International Business Law", "start_date": "2018-10", "end_date": "2020-07"}]),

    dict(username="manish_tripathi", email="manish.tripathi@seed.dev",
         full_name="Manish Tripathi", headline="Android Engineer @ Wolt", location="Berlin, Germany",
         bio="Delivering happiness at your doorstep. Lucknow → Berlin. Kotlin by day, tabla by night.",
         skills=["Kotlin", "Android SDK", "Jetpack Compose", "Retrofit", "MVVM"],
         work_experience=[{"title": "Senior Android Engineer", "company": "Wolt", "start_date": "2022-08", "end_date": None, "current": True, "description": "Building the Wolt consumer app for food and grocery delivery."}],
         education=[{"school": "IIIT Lucknow", "degree": "B.Tech", "field": "Computer Science", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="gayathri_kumar", email="gayathri.kumar@seed.dev",
         full_name="Gayathri Kumar", headline="Accountant @ PwC Germany", location="Frankfurt, Germany",
         bio="Audit and assurance for global companies. Madurai → Frankfurt. CA India, studying for German CPA.",
         skills=["IFRS", "SAP FI", "Financial Audit", "Tax Compliance", "Excel"],
         work_experience=[{"title": "Senior Associate", "company": "PwC Germany", "start_date": "2020-10", "end_date": None, "current": True, "description": "Statutory audit for DAX 40 manufacturing and pharmaceutical clients."}],
         education=[{"school": "Madurai Kamaraj University", "degree": "B.Com", "field": "Commerce", "start_date": "2013-07", "end_date": "2016-06"}]),

    dict(username="siddhant_roy", email="siddhant.roy@seed.dev",
         full_name="Siddhant Roy", headline="iOS Developer @ SumUp", location="Berlin, Germany",
         bio="Building payment tech for small businesses. Kolkata → Berlin. Swift, SwiftUI and strong coffee.",
         skills=["Swift", "SwiftUI", "Core Data", "NFC", "CI/CD"],
         work_experience=[{"title": "iOS Developer", "company": "SumUp", "start_date": "2021-11", "end_date": None, "current": True, "description": "Payment terminal app used by 4M+ merchants globally."}],
         education=[{"school": "Jadavpur University", "degree": "B.E.", "field": "Information Technology", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="aditi_nair", email="aditi.nair@seed.dev",
         full_name="Aditi Nair", headline="Climate Scientist @ Fraunhofer Institute", location="Stuttgart, Germany",
         bio="Climate modeling for a sustainable future. Kochi → Stuttgart. IPCC contributor, marathon runner.",
         skills=["Climate Modeling", "Python", "NetCDF", "R", "Supercomputing"],
         work_experience=[{"title": "Research Scientist", "company": "Fraunhofer IEG", "start_date": "2022-04", "end_date": None, "current": True, "description": "Modeling climate impacts on renewable energy infrastructure."}],
         education=[{"school": "IISER Pune", "degree": "Ph.D.", "field": "Atmospheric Science", "start_date": "2017-08", "end_date": "2022-02"}]),

    dict(username="vivek_srivastava", email="vivek.srivastava@seed.dev",
         full_name="Vivek Srivastava", headline="SAP Consultant @ Capgemini", location="Munich, Germany",
         bio="Making SAP implementations actually work. Lucknow → Munich. 8 years of S/4HANA migrations.",
         skills=["SAP S/4HANA", "ABAP", "SAP Fiori", "Project Management", "Change Management"],
         work_experience=[{"title": "Senior SAP Consultant", "company": "Capgemini", "start_date": "2019-04", "end_date": None, "current": True, "description": "Leading SAP S/4HANA greenfield implementations for automotive clients."}],
         education=[{"school": "UPTU Lucknow", "degree": "B.Tech", "field": "Computer Science", "start_date": "2012-08", "end_date": "2016-05"}]),

    dict(username="shraddha_deshpande", email="shraddha.deshpande@seed.dev",
         full_name="Shraddha Deshpande", headline="Structural Engineer @ Arup", location="Berlin, Germany",
         bio="Sustainable architecture and structural design. Pune → Berlin. Making buildings smarter, not just bigger.",
         skills=["FEA", "STAAD Pro", "BIM/Revit", "Structural Design", "Sustainability"],
         work_experience=[{"title": "Structural Engineer", "company": "Arup", "start_date": "2021-09", "end_date": None, "current": True, "description": "Structural design for green buildings and retrofitting historic structures in Europe."}],
         education=[{"school": "College of Engineering Pune", "degree": "B.E.", "field": "Civil Engineering", "start_date": "2014-08", "end_date": "2018-05"}]),

    dict(username="anand_krishnamurthy", email="anand.krishnamurthy@seed.dev",
         full_name="Anand Krishnamurthy", headline="Principal Engineer @ Trivago", location="Düsseldorf, Germany",
         bio="Building hotel search infrastructure used by 100M+ travellers. Bangalore → Düsseldorf → hiking trails.",
         skills=["Java", "Kafka", "Elasticsearch", "System Design", "Distributed Systems"],
         work_experience=[{"title": "Principal Engineer", "company": "Trivago GmbH", "start_date": "2017-05", "end_date": None, "current": True, "description": "Core search infrastructure, ranking algorithms, and price comparison platform."}],
         education=[{"school": "PES University Bangalore", "degree": "B.E.", "field": "Computer Science", "start_date": "2010-08", "end_date": "2014-05"}]),

    dict(username="rashmi_hegde", email="rashmi.hegde@seed.dev",
         full_name="Rashmi Hegde", headline="Medical Doctor @ Charité Berlin", location="Berlin, Germany",
         bio="Neurologist specializing in stroke care. Mangalore → Heidelberg → Charité. Running marathons between shifts.",
         skills=["Neurology", "Clinical Research", "MRI Analysis", "Patient Care", "Medical Writing"],
         work_experience=[{"title": "Specialist Doctor", "company": "Charité – Universitätsmedizin Berlin", "start_date": "2020-08", "end_date": None, "current": True, "description": "Stroke unit and neurovascular intervention specialist."}],
         education=[{"school": "Heidelberg University", "degree": "Dr. med.", "field": "Medicine", "start_date": "2013-10", "end_date": "2020-07"}]),

    dict(username="parth_shah", email="parth.shah@seed.dev",
         full_name="Parth Shah", headline="Quantitative Analyst @ Deutsche Bank", location="Frankfurt, Germany",
         bio="Derivatives pricing and financial risk modeling. Surat → Frankfurt. Maths is my first language.",
         skills=["Quantitative Finance", "Python", "C++", "Monte Carlo", "Risk Management"],
         work_experience=[{"title": "Quantitative Analyst", "company": "Deutsche Bank", "start_date": "2021-09", "end_date": None, "current": True, "description": "Building pricing models for interest rate and FX derivatives."}],
         education=[{"school": "ETH Zurich", "degree": "M.Sc.", "field": "Quantitative Finance", "start_date": "2018-09", "end_date": "2020-08"}]),

    dict(username="vaishnavi_menon", email="vaishnavi.menon@seed.dev",
         full_name="Vaishnavi Menon", headline="Clinical Psychologist @ AWO", location="Cologne, Germany",
         bio="Mental health for the Indian diaspora. Trivandrum → Cologne. Breaking stigmas, one conversation at a time.",
         skills=["CBT", "Trauma Therapy", "Crisis Intervention", "Multilingual Counseling", "DBT"],
         work_experience=[{"title": "Clinical Psychologist", "company": "AWO Cologne", "start_date": "2022-01", "end_date": None, "current": True, "description": "Providing therapy services with specialization in migration-related trauma."}],
         education=[{"school": "University of Cologne", "degree": "M.Sc.", "field": "Clinical Psychology", "start_date": "2019-10", "end_date": "2021-09"}]),

    dict(username="kunal_aggarwal", email="kunal.aggarwal@seed.dev",
         full_name="Kunal Aggarwal", headline="Growth Manager @ Personio", location="Munich, Germany",
         bio="Building the HR tech stack for European SMEs. Delhi → Munich. Squash champion, weekend chef.",
         skills=["B2B SaaS", "Outbound Sales", "HubSpot", "Revenue Operations", "Customer Success"],
         work_experience=[{"title": "Growth Manager", "company": "Personio", "start_date": "2022-07", "end_date": None, "current": True, "description": "Managing mid-market sales and expansion revenue for DACH region."}],
         education=[{"school": "Delhi University", "degree": "B.Com (Hons)", "field": "Commerce", "start_date": "2015-07", "end_date": "2018-06"}]),

    dict(username="bhavna_chaudhary", email="bhavna.chaudhary@seed.dev",
         full_name="Bhavna Chaudhary", headline="Supply Chain Manager @ Lidl", location="Neckarsulm, Germany",
         bio="Keeping 12,000 stores stocked. Jaipur → Baden-Württemberg. Demand forecasting and supply chain nerd.",
         skills=["Supply Chain", "SAP SCM", "Demand Planning", "Procurement", "Lean Management"],
         work_experience=[{"title": "Supply Chain Manager", "company": "Lidl GmbH & Co. KG", "start_date": "2019-09", "end_date": None, "current": True, "description": "Overseeing supply chain operations for the electronics and non-food category."}],
         education=[{"school": "IIM Lucknow", "degree": "MBA", "field": "Operations Management", "start_date": "2016-06", "end_date": "2018-05"}]),

    dict(username="tejas_kulkarni", email="tejas.kulkarni@seed.dev",
         full_name="Tejas Kulkarni", headline="Robotics Engineer @ KUKA", location="Augsburg, Germany",
         bio="Programming robots to make manufacturing better. Pune → Augsburg. RC planes on weekends.",
         skills=["ROS2", "Python", "C++", "Computer Vision", "Motion Planning"],
         work_experience=[{"title": "Robotics Engineer", "company": "KUKA AG", "start_date": "2021-06", "end_date": None, "current": True, "description": "Developing intelligent robot programming interfaces and vision-guided automation."}],
         education=[{"school": "Pune University", "degree": "B.E.", "field": "Robotics & Automation", "start_date": "2016-08", "end_date": "2020-05"}]),

    dict(username="pratibha_krishnan", email="pratibha.krishnan@seed.dev",
         full_name="Pratibha Krishnan", headline="Tax Advisor @ KPMG", location="Hamburg, Germany",
         bio="International tax for multinationals. Coimbatore → Hamburg. CA India + German Steuerberater in progress.",
         skills=["International Tax", "Transfer Pricing", "BEPS", "VAT", "Tax Structuring"],
         work_experience=[{"title": "Tax Advisor", "company": "KPMG Germany", "start_date": "2021-03", "end_date": None, "current": True, "description": "Cross-border tax structuring for Indian companies expanding into Europe."}],
         education=[{"school": "Bharathiar University", "degree": "B.Com", "field": "Accounting", "start_date": "2013-07", "end_date": "2016-06"}]),

    dict(username="akash_mathur", email="akash.mathur@seed.dev",
         full_name="Akash Mathur", headline="Firmware Engineer @ Osram", location="Munich, Germany",
         bio="Smart lighting and LED control systems. Jaipur → Munich. Photography and IoT hobbyist.",
         skills=["Embedded C", "FreeRTOS", "Bluetooth LE", "Zigbee", "PCB Design"],
         work_experience=[{"title": "Firmware Engineer", "company": "Osram GmbH", "start_date": "2020-09", "end_date": None, "current": True, "description": "Developing firmware for smart home and commercial IoT lighting systems."}],
         education=[{"school": "MNIT Jaipur", "degree": "B.Tech", "field": "Electronics & Communication", "start_date": "2014-08", "end_date": "2018-05"}]),

    dict(username="amrita_banerjee", email="amrita.banerjee@seed.dev",
         full_name="Amrita Banerjee", headline="Content Strategist @ HubSpot", location="Berlin, Germany",
         bio="Words are my code. Kolkata → Berlin. Building content ecosystems for B2B SaaS. Also writes poetry.",
         skills=["Content Strategy", "SEO", "Copywriting", "HubSpot", "Marketing Automation"],
         work_experience=[{"title": "Content Strategist", "company": "HubSpot", "start_date": "2022-04", "end_date": None, "current": True, "description": "Developing B2B content strategy for DACH and UK markets."}],
         education=[{"school": "Jadavpur University", "degree": "M.A.", "field": "English Literature", "start_date": "2017-07", "end_date": "2019-06"}]),

    dict(username="gaurav_tewari", email="gaurav.tewari@seed.dev",
         full_name="Gaurav Tewari", headline="Solutions Architect @ AWS", location="Berlin, Germany",
         bio="Helping companies move to the cloud. Allahabad → Berlin. AWS SA, marathon runner, dad jokes expert.",
         skills=["AWS", "Solutions Architecture", "Python", "Terraform", "Enterprise Sales"],
         work_experience=[{"title": "Solutions Architect", "company": "Amazon Web Services", "start_date": "2020-03", "end_date": None, "current": True, "description": "Helping European enterprises design and migrate to AWS at scale."}],
         education=[{"school": "Allahabad University", "degree": "B.Tech", "field": "Computer Science", "start_date": "2011-08", "end_date": "2015-05"}]),

    dict(username="rucha_joshi", email="rucha.joshi@seed.dev",
         full_name="Rucha Joshi", headline="Nutritionist & Wellness Coach", location="Munich, Germany",
         bio="Helping Indians in Germany eat healthier without losing their roots. Pune → Munich. Food is culture.",
         skills=["Nutrition Science", "Health Coaching", "Ayurveda", "Meal Planning", "Public Speaking"],
         work_experience=[{"title": "Independent Nutritionist", "company": "Self-employed", "start_date": "2021-01", "end_date": None, "current": True, "description": "Providing personalized nutrition coaching for the Indian diaspora in Germany."}],
         education=[{"school": "Pune University", "degree": "M.Sc.", "field": "Food Science & Nutrition", "start_date": "2017-07", "end_date": "2019-06"}]),

    dict(username="vijay_gopal", email="vijay.gopal@seed.dev",
         full_name="Vijay Gopal", headline="Principal Architect @ T-Systems", location="Frankfurt, Germany",
         bio="Digital transformation for large enterprises. Madurai → Frankfurt. 15 years in IT consulting.",
         skills=["Enterprise Architecture", "TOGAF", "SAP", "Cloud Migration", "Digital Strategy"],
         work_experience=[{"title": "Principal Architect", "company": "T-Systems International", "start_date": "2016-05", "end_date": None, "current": True, "description": "Leading digital transformation programs for German federal government clients."}],
         education=[{"school": "Madurai Kamaraj University", "degree": "M.Tech", "field": "Computer Science", "start_date": "2005-07", "end_date": "2007-06"}]),

    dict(username="anjali_venkataraman", email="anjali.venkataraman@seed.dev",
         full_name="Anjali Venkataraman", headline="Cultural Integration Counselor", location="Cologne, Germany",
         bio="Helping Indians settle into German life. Chennai → Cologne. Bridging cultures, building community.",
         skills=["Cross-Cultural Communication", "Career Coaching", "Integration Support", "German Language", "Community Building"],
         work_experience=[{"title": "Cultural Integration Counselor", "company": "Caritas Cologne", "start_date": "2020-09", "end_date": None, "current": True, "description": "Providing integration support and career counseling for Indian migrants in Germany."}],
         education=[{"school": "University of Cologne", "degree": "M.A.", "field": "Intercultural Studies", "start_date": "2017-10", "end_date": "2019-09"}]),

    dict(username="deepak_varma", email="deepak.varma@seed.dev",
         full_name="Deepak Varma", headline="Senior Developer @ CHECK24", location="Munich, Germany",
         bio="Price comparison at scale. Hyderabad → Munich. Java, microservices, and TDD zealot.",
         skills=["Java", "Spring Boot", "Microservices", "MySQL", "TDD"],
         work_experience=[{"title": "Senior Software Developer", "company": "CHECK24 GmbH", "start_date": "2020-01", "end_date": None, "current": True, "description": "Insurance product comparison platform serving 20M+ German users."}],
         education=[{"school": "JNTU Hyderabad", "degree": "B.Tech", "field": "Computer Science", "start_date": "2013-08", "end_date": "2017-05"}]),

    dict(username="prerna_saxena", email="prerna.saxena@seed.dev",
         full_name="Prerna Saxena", headline="BI Developer @ Lufthansa", location="Frankfurt, Germany",
         bio="Aviation analytics at 35,000 feet. Bhopal → Frankfurt. Making flight data speak.",
         skills=["Power BI", "SQL", "Python", "SSAS", "Azure Synapse"],
         work_experience=[{"title": "BI Developer", "company": "Lufthansa Group", "start_date": "2021-07", "end_date": None, "current": True, "description": "Building revenue management and fleet analytics dashboards."}],
         education=[{"school": "MANIT Bhopal", "degree": "B.Tech", "field": "Information Technology", "start_date": "2015-08", "end_date": "2019-05"}]),

    dict(username="aniket_more", email="aniket.more@seed.dev",
         full_name="Aniket More", headline="Sustainability Manager @ Henkel", location="Düsseldorf, Germany",
         bio="Making FMCG greener. Nashik → Düsseldorf. Circular economy, zero waste, and authentic German beer.",
         skills=["ESG Reporting", "Carbon Accounting", "LCA", "Stakeholder Management", "ISO 14001"],
         work_experience=[{"title": "Sustainability Manager", "company": "Henkel AG", "start_date": "2022-02", "end_date": None, "current": True, "description": "Leading Henkel's carbon neutrality roadmap for manufacturing in Europe."}],
         education=[{"school": "XLRI Jamshedpur", "degree": "PGDM", "field": "Sustainability & CSR", "start_date": "2018-06", "end_date": "2020-05"}]),

    dict(username="kamala_sundaram", email="kamala.sundaram@seed.dev",
         full_name="Kamala Sundaram", headline="Research Engineer @ Zeiss", location="Oberkochen, Germany",
         bio="Precision optics for science and industry. Trichy → Carl Zeiss. Working at the nanometer scale.",
         skills=["Optical Design", "MATLAB", "Photonics", "Python", "Image Processing"],
         work_experience=[{"title": "Research Engineer", "company": "Carl Zeiss AG", "start_date": "2021-05", "end_date": None, "current": True, "description": "Next-generation semiconductor lithography optics development."}],
         education=[{"school": "IIT Madras", "degree": "M.Tech", "field": "Applied Optics", "start_date": "2018-07", "end_date": "2020-06"}]),
]

ALL_NEW_USERS = TEST_USERS + SEED_USERS

POST_TEMPLATES = [
    "Just crossed 5 years in Germany 🇩🇪 What started as a work visa has become home. The journey wasn't easy but it was absolutely worth it. To everyone thinking about making the move — the community here has your back. #indiansingermany #expat",
    "German lesson of the week: Donaudampfschifffahrtsgesellschaftskapitän. No, I'm not making this up. B2 exam next month and I genuinely have no idea how I'll survive 😅 #deutsch #expatlifer",
    "Something nobody tells you before moving to Germany: you will spend your first 3 months just dealing with paperwork. Anmeldung, Aufenthaltstitel, Steuernummer, Krankenversicherung... but once it's done, the system actually works beautifully 🤌",
    "Diwali celebration in our city last weekend — 200+ Indians, actual mithai from an Indian bakery, rangoli made in a German park. Moments like these remind you that home travels with you. 🪔 Happy Diwali to everyone!",
    "Hot take on working in Germany: meetings here are shorter, better prepared, and actually result in decisions. Coming from the Indian corporate world this was genuinely shocking. Your time is respected here. 🔥",
    "5 things I wish I knew before coming to Germany:\n\n1. Sundays are ACTUALLY closed. Everything.\n2. Cash is still king in many places\n3. Train delays are as common as in India\n4. People aren't unfriendly, just direct\n5. The public healthcare system is excellent\n\nWhat would you add?",
    "Just got my Niederlassungserlaubnis (permanent residence) after 5 years! 🎉 The German bureaucracy journey: hard, slow, but rewarding. For anyone at the beginning of this journey — it's worth it. DMs open if you have questions.",
    "Indian food in Germany has gotten so much better in the last 5 years. Found a Kerala sadya restaurant in Munich that brought actual tears to my eyes. If you're homesick for good food, the options are finally here 🌶️",
    "Unpopular opinion: Learning German seriously (not just survival level) will change your experience in Germany completely. The friendships you can build, the cultural nuances you understand — it's a different world at C1 level.",
    "Remote work hack for Indians in Germany: the Indian morning (9am IST) is 5:30am German time. If your team is still in India, you've got incredible overlap time from 5:30-9am before your German colleagues arrive. Use it. 📊",
    "Been mentoring fresh graduates coming from India to Germany. The number 1 struggle is not technical — it's communication style. Being direct without being rude, giving structured feedback, managing up effectively. These are learnable skills. Happy to help anyone working through them.",
    "Finally went to a Bundesliga game last weekend. The stadium atmosphere, the Weißbier, the level of football — honestly world class experience. How did I wait 4 years to do this?! ⚽",
    "Tech recruitment in Germany in 2026: companies are increasingly looking for German speakers even for international roles. If you're planning to move here for tech, start German lessons NOW. Don't wait until you arrive. #jobsearch #germany",
    "Finding community as an Indian in Germany: don't just look for Indian groups. Join a sports club (Verein), a language exchange, a board game café, a professional network. Some of my best friends here are German, Turkish, Brazilian. Build a wide community.",
    "Fascinating: the same technical problem I've been solving at work was solved completely differently by my German colleagues. Different approach, similar outcome. The cross-cultural problem-solving is honestly the best part of working in a global team.",
    "Made schnitzel at home using my mom's chicken tikka recipe as marinade. My German flatmates didn't know what hit them. Fusion cooking is the real integration story of the Indian diaspora in Germany 😂🇩🇪🇮🇳",
    "3 years since my first Python commit in Germany. The codebase went from 10K to 2M lines. From junior to senior. Some days still feel like an imposter, but looking back — the growth is real. To everyone starting their journey: trust the process.",
    "The Indian WhatsApp group for my city now has 340 people. Started with 12. What began as 'who knows a good Indian grocery store' has become job referrals, apartment shares, visa advice, festival celebrations, and genuine friendships. Community > everything.",
    "Networking tip for Indians in Germany: attend Stammtisch events. These are regular informal meetups — for everything from programming languages to hiking clubs to expat groups. Best way to build your professional network outside of work.",
    "Work-life balance reality check after 4 years in Germany: I actually use all my 30 vacation days now. I leave the office at 5pm. I don't answer work messages after hours. My productivity went UP. Sometimes the German way is the right way.",
]


def ts(minutes_ago: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)


def run():
    db = SessionLocal()
    try:
        from app.models.user import User

        amit = db.query(User).filter(User.id == AMIT_ID).first()
        if not amit:
            print("ERROR: Amit not found")
            return

        # ── Create all users ─────────────────────────────────────────────
        user_map: dict[str, "User"] = {"amit123": amit}
        created_count = 0

        for u in ALL_NEW_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                user_map[u["username"]] = existing
                continue
            new_u = User(
                id=uuid.uuid4(),
                email=u["email"],
                username=u["username"],
                full_name=u["full_name"],
                headline=u.get("headline"),
                location=u.get("location"),
                bio=u.get("bio"),
                skills=u.get("skills"),
                work_experience=u.get("work_experience"),
                education=u.get("education"),
                is_active=True,
                is_verified=True,
                profile_visibility="public",
            )
            db.add(new_u)
            user_map[u["username"]] = new_u
            created_count += 1

        db.flush()
        print(f"Users: {created_count} created, {len(ALL_NEW_USERS) - created_count} already existed")

        all_usernames = list(user_map.keys())

        # ── Connections ───────────────────────────────────────────────────
        def add_connection(u1_name: str, u2_name: str, status: str = "accepted"):
            u1 = user_map.get(u1_name)
            u2 = user_map.get(u2_name)
            if not u1 or not u2:
                return
            existing = db.query(Connection).filter(
                ((Connection.requester_id == u1.id) & (Connection.addressee_id == u2.id)) |
                ((Connection.requester_id == u2.id) & (Connection.addressee_id == u1.id))
            ).first()
            if not existing:
                conn = Connection(requester_id=u1.id, addressee_id=u2.id, status=status)
                db.add(conn)
                if status == "accepted":
                    n1 = Notification(user_id=u2.id, actor_id=u1.id, type="connection_accepted", entity_id=conn.id)
                    db.add(n1)

        # All 50 new users connected to Amit
        for uname in all_usernames:
            if uname != "amit123":
                add_connection("amit123", uname)

        # Create a web of connections among users themselves
        pairs = [
            ("sneha_kapoor", "aditya_singh"), ("sneha_kapoor", "lavanya_subramanian"),
            ("sneha_kapoor", "manish_tripathi"), ("sneha_kapoor", "siddhant_roy"),
            ("rahul_verma", "ananya_krishnan"), ("rahul_verma", "meera_pillai"),
            ("rahul_verma", "prithvi_rao"), ("rahul_verma", "vikram_nair"),
            ("kavya_menon", "rohan_mehta"), ("kavya_menon", "swati_jain"),
            ("kavya_menon", "chitra_gopalan"), ("kavya_menon", "kunal_aggarwal"),
            ("aditya_singh", "abhijeet_kulkarni"), ("aditya_singh", "gaurav_tewari"),
            ("aditya_singh", "aryan_malhotra"), ("aditya_singh", "prithvi_rao"),
            ("pooja_reddy", "gayathri_kumar"), ("pooja_reddy", "karan_patel"),
            ("pooja_reddy", "parth_shah"), ("pooja_reddy", "prerna_saxena"),
            ("nikhil_joshi", "vikram_nair"), ("nikhil_joshi", "divya_nambiar"),
            ("nikhil_joshi", "abhijeet_kulkarni"), ("nikhil_joshi", "tejas_kulkarni"),
            ("ishaan_batra", "deepa_iyer"), ("ishaan_batra", "kritika_sharma"),
            ("ishaan_batra", "anushka_tiwari"), ("ishaan_batra", "riya_chakraborty"),
            ("meera_pillai", "shreya_das"), ("meera_pillai", "aditi_nair"),
            ("meera_pillai", "nandini_iyer"), ("meera_pillai", "rashmi_hegde"),
            ("tanmay_shah", "rohan_mehta"), ("tanmay_shah", "varun_khanna"),
            ("tanmay_shah", "anand_krishnamurthy"), ("tanmay_shah", "arun_pillai"),
            ("divya_nambiar", "vikram_nair"), ("divya_nambiar", "prithvi_rao"),
            ("divya_nambiar", "akash_mathur"), ("divya_nambiar", "rohit_pandey"),
            ("priya_sharma", "ananya_krishnan"), ("priya_sharma", "sneha_kapoor"),
            ("rohan_mehta", "aditya_singh"), ("rohan_mehta", "tanmay_shah"),
            ("arjun_bose", "siddhant_roy"), ("arjun_bose", "manish_tripathi"),
            ("ananya_krishnan", "lavanya_subramanian"), ("ananya_krishnan", "shreya_das"),
            ("karan_patel", "parth_shah"), ("karan_patel", "gayathri_kumar"),
            ("varun_khanna", "anand_krishnamurthy"), ("varun_khanna", "vijay_gopal"),
            ("rashmi_hegde", "vaishnavi_menon"), ("rashmi_hegde", "meera_pillai"),
            ("aditi_nair", "nandini_iyer"), ("aditi_nair", "aniket_more"),
            ("amrita_banerjee", "riya_chakraborty"), ("amrita_banerjee", "kritika_sharma"),
            ("rucha_joshi", "anjali_venkataraman"), ("rucha_joshi", "vaishnavi_menon"),
        ]
        for u1, u2 in pairs:
            add_connection(u1, u2)

        db.flush()
        print("Connections created")

        # ── Posts ─────────────────────────────────────────────────────────
        post_objects: list["Post"] = []
        t_offset = 5

        for i, uname in enumerate(all_usernames):
            if uname == "amit123":
                continue
            user = user_map[uname]
            num_posts = random.randint(2, 4)
            assigned_posts = random.sample(POST_TEMPLATES, num_posts)
            for j, content in enumerate(assigned_posts):
                existing = db.query(Post).filter(
                    Post.user_id == user.id, Post.content == content
                ).first()
                if existing:
                    post_objects.append(existing)
                    continue
                p = Post(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    content=content,
                    created_at=ts(t_offset),
                )
                db.add(p)
                post_objects.append(p)
                t_offset += random.randint(8, 25)

        db.flush()
        print(f"Posts created: {len(post_objects)}")

        # ── Likes ─────────────────────────────────────────────────────────
        like_count = 0
        for post in post_objects:
            # Amit likes ~60% of posts
            if random.random() < 0.6:
                existing = db.query(Like).filter(Like.user_id == AMIT_ID, Like.post_id == post.id).first()
                if not existing:
                    db.add(Like(user_id=AMIT_ID, post_id=post.id))
                    like_count += 1
            # 3-8 random other users like each post
            likers = random.sample([u for u in all_usernames if u != "amit123"], k=random.randint(3, 8))
            for liker_name in likers:
                liker = user_map[liker_name]
                if liker.id == post.user_id:
                    continue
                existing = db.query(Like).filter(Like.user_id == liker.id, Like.post_id == post.id).first()
                if not existing:
                    db.add(Like(user_id=liker.id, post_id=post.id))
                    like_count += 1

        db.flush()
        print(f"Likes: {like_count}")

        # ── Comments ──────────────────────────────────────────────────────
        COMMENT_POOL = [
            "This resonates so much! Exactly my experience. 🙌",
            "Great perspective — sharing this with my team.",
            "The paperwork part is SO true 😂 took me months.",
            "Been here 3 years and still learning. Thanks for sharing!",
            "Needed to read this today. Thank you!",
            "100% agree. Community makes all the difference.",
            "This is gold. Sending to every Indian friend considering Germany.",
            "The Bundesliga point — finally someone said it! ⚽",
            "German bureaucracy is a different beast altogether 😅",
            "Just forwarded this to 5 people planning to move here.",
            "The direct communication thing took me almost a year to figure out.",
            "What a journey! Congratulations on all your success. 🎉",
            "This is exactly what newcomers need to hear. Well said!",
            "Valuable insights as always. Keep sharing your experiences! 🙏",
            "The work-life balance shift is real and absolutely wonderful.",
            "Missing home is real but building a life here is worth it.",
            "Couldn't agree more. The key is finding YOUR community.",
        ]

        comment_count = 0
        for post in post_objects:
            # Amit comments on ~30% of posts
            if random.random() < 0.3:
                existing = db.query(Comment).filter(
                    Comment.user_id == AMIT_ID, Comment.post_id == post.id
                ).first()
                if not existing:
                    c = Comment(
                        user_id=AMIT_ID,
                        post_id=post.id,
                        content=random.choice(COMMENT_POOL),
                        created_at=ts(random.randint(1, 60)),
                    )
                    db.add(c)
                    comment_count += 1

            # 2-5 other users comment
            commenters = random.sample(
                [u for u in all_usernames if u != "amit123"], k=random.randint(2, 5)
            )
            for cname in commenters:
                commenter = user_map[cname]
                if commenter.id == post.user_id:
                    continue
                existing = db.query(Comment).filter(
                    Comment.user_id == commenter.id, Comment.post_id == post.id
                ).first()
                if not existing:
                    c = Comment(
                        user_id=commenter.id,
                        post_id=post.id,
                        content=random.choice(COMMENT_POOL),
                        created_at=ts(random.randint(5, 300)),
                    )
                    db.add(c)
                    comment_count += 1

        db.flush()
        print(f"Comments: {comment_count}")

        # ── Messages ──────────────────────────────────────────────────────
        CONVERSATIONS = [
            ("sneha_kapoor", [
                ("sneha_kapoor", "amit123", "Hey Amit! Fellow techie in Germany! What are you working on these days?"),
                ("amit123", "sneha_kapoor", "Hey Sneha! Building Desiface actually — a social network for Indians in Germany 😄 You're using it right now haha"),
                ("sneha_kapoor", "amit123", "Wait what?! That is SO cool. I need to hear more about this. How long have you been building it?"),
                ("amit123", "sneha_kapoor", "About 6 months now. It's a side project but growing fast. Let me know if you want to test features!"),
                ("sneha_kapoor", "amit123", "Absolutely! Also we should connect in person — are you ever in Berlin?"),
            ]),
            ("rahul_verma", [
                ("rahul_verma", "amit123", "Bhai, saw your profile. Fellow ML adjacent person. What stack is Desiface running?"),
                ("amit123", "rahul_verma", "FastAPI + PostgreSQL backend, Next.js frontend. Simple and works well for now!"),
                ("rahul_verma", "amit123", "Clean stack. When you add ML features (recommendations, feed ranking) — let's talk. That's literally what I do at Siemens."),
                ("amit123", "rahul_verma", "That's exactly what I'm planning for Phase 3! Would love to pick your brain."),
            ]),
            ("tanmay_shah", [
                ("tanmay_shah", "amit123", "Amit — Tanmay here. Building Diaspora Finance. I think we should talk. Our users need exactly what you're building."),
                ("amit123", "tanmay_shah", "Hey Tanmay! Would love to explore a partnership. What does Diaspora Finance do exactly?"),
                ("tanmay_shah", "amit123", "Cross-border financial products — remittance, NRI accounts, insurance for Indians in Europe. Our users are your users."),
                ("amit123", "tanmay_shah", "This sounds great. Can we do a quick call this week?"),
                ("tanmay_shah", "amit123", "Thursday 6pm works? I'll send a calendar invite."),
                ("amit123", "tanmay_shah", "Perfect. Looking forward to it!"),
            ]),
            ("kavya_menon", [
                ("kavya_menon", "amit123", "Amit! Love what you're doing with Desiface. PM at Zalando here. Have some product thoughts to share if you're open to feedback?"),
                ("amit123", "kavya_menon", "Always open to feedback! Please go ahead 🙏"),
                ("kavya_menon", "amit123", "The profile completion prompting could be stronger. Users with complete profiles retain 3x better — Zalando data. Worth investing in the onboarding flow."),
                ("amit123", "kavya_menon", "That's genuinely useful. We're building Phase 3 now. Onboarding is on the list!"),
            ]),
            ("meera_pillai", [
                ("meera_pillai", "amit123", "Hi Amit! Neuroscientist here. Random question — have you considered the mental health angle? Loneliness is huge in the Indian diaspora."),
                ("amit123", "meera_pillai", "Meera — yes! It's actually one of the core reasons I built this. Connection and community."),
                ("meera_pillai", "amit123", "I'm researching exactly this. Would you be willing to share anonymized usage patterns for my research?"),
                ("amit123", "meera_pillai", "Let's talk about this properly. Happy to collaborate if we can do it ethically and with privacy in mind."),
            ]),
        ]

        msg_count = 0
        for conv_uname, messages in CONVERSATIONS:
            msg_offset = 240
            for sender_name, receiver_name, content in messages:
                sender = user_map.get(sender_name)
                receiver = user_map.get(receiver_name)
                if not sender or not receiver:
                    continue
                existing = db.query(Message).filter(
                    Message.sender_id == sender.id,
                    Message.receiver_id == receiver.id,
                    Message.content == content
                ).first()
                if not existing:
                    is_read = (receiver_name != "amit123")
                    m = Message(
                        id=uuid.uuid4(),
                        sender_id=sender.id,
                        receiver_id=receiver.id,
                        content=content,
                        is_read=is_read,
                        created_at=ts(msg_offset),
                    )
                    db.add(m)
                    msg_count += 1
                    msg_offset -= random.randint(3, 8)

        db.flush()
        print(f"Messages: {msg_count}")

        db.commit()
        print("\n✅ Production seed complete!")
        print(f"  Total users: {len(ALL_NEW_USERS)} new + existing")
        print(f"  Posts: {len(post_objects)}")
        print(f"  Conversations: {len(CONVERSATIONS)}")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
