-- Seed Expertise Atlas Taxonomy

-- Insert L1 domains
INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (1, 'u', '{"en": "Universal Capabilities"}', '{"en": "Universal Capabilities domain"}', 'Briefcase', 1, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (2, 'f', '{"en": "Functional Competencies"}', '{"en": "Functional Competencies domain"}', 'Briefcase', 2, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (3, 't', '{"en": "Tools & Technologies"}', '{"en": "Tools & Technologies domain"}', 'Briefcase', 3, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (4, 'l', '{"en": "Languages & Culture"}', '{"en": "Languages & Culture domain"}', 'Briefcase', 4, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (5, 'm', '{"en": "Methods & Practices"}', '{"en": "Methods & Practices domain"}', 'Briefcase', 5, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

INSERT INTO skills_categories (cat_id, slug, name_i18n, description_i18n, icon, display_order, version, created_at, updated_at)
VALUES (6, 'd', '{"en": "Domain Knowledge"}', '{"en": "Domain Knowledge domain"}', 'Briefcase', 6, 1, NOW(), NOW())
ON CONFLICT (cat_id) DO NOTHING;

-- Insert L2 categories
INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 'u-comm', '{"en": "Communication"}', '{"en": "Communication skills and competencies"}', 1, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 'u-coll', '{"en": "Collaboration & Teamwork"}', '{"en": "Collaboration & Teamwork skills and competencies"}', 2, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 'u-lead', '{"en": "Leadership & People Enablement"}', '{"en": "Leadership & People Enablement skills and competencies"}', 3, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 'u-coach', '{"en": "Coaching & Mentoring"}', '{"en": "Coaching & Mentoring skills and competencies"}', 4, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 'u-negot', '{"en": "Negotiation & Mediation"}', '{"en": "Negotiation & Mediation skills and competencies"}', 5, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 'u-infl', '{"en": "Influence & Stakeholder Mgmt"}', '{"en": "Influence & Stakeholder Mgmt skills and competencies"}', 6, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 'u-cust', '{"en": "Service & Client Orientation"}', '{"en": "Service & Client Orientation skills and competencies"}', 7, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 'u-ethic', '{"en": "Ethics & Responsible Judgment"}', '{"en": "Ethics & Responsible Judgment skills and competencies"}', 8, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 'u-crit', '{"en": "Critical Thinking & Reasoning"}', '{"en": "Critical Thinking & Reasoning skills and competencies"}', 9, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 'u-creat', '{"en": "Creativity & Ideation"}', '{"en": "Creativity & Ideation skills and competencies"}', 10, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 'u-probl', '{"en": "Problem Solving & Decision Making"}', '{"en": "Problem Solving & Decision Making skills and competencies"}', 11, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 'u-learn', '{"en": "Learning Agility"}', '{"en": "Learning Agility skills and competencies"}', 12, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 'u-adapt', '{"en": "Adaptability & Change Readiness"}', '{"en": "Adaptability & Change Readiness skills and competencies"}', 13, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 'u-resil', '{"en": "Resilience & Stress Tolerance"}', '{"en": "Resilience & Stress Tolerance skills and competencies"}', 14, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 'u-time', '{"en": "Time & Priority Management"}', '{"en": "Time & Priority Management skills and competencies"}', 15, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 'u-organ', '{"en": "Personal Organization"}', '{"en": "Personal Organization skills and competencies"}', 16, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 'u-num', '{"en": "Numeracy & Data Literacy"}', '{"en": "Numeracy & Data Literacy skills and competencies"}', 17, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 'u-digi', '{"en": "Digital Literacy & Online Safety"}', '{"en": "Digital Literacy & Online Safety skills and competencies"}', 18, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 'u-dei', '{"en": "Intercultural & DEI"}', '{"en": "Intercultural & DEI skills and competencies"}', 19, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 'u-present', '{"en": "Presentation & Speaking"}', '{"en": "Presentation & Speaking skills and competencies"}', 20, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 'u-write', '{"en": "Professional Writing"}', '{"en": "Professional Writing skills and competencies"}', 21, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 'u-analyt', '{"en": "Information Synthesis"}', '{"en": "Information Synthesis skills and competencies"}', 22, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 'u-risk', '{"en": "Safety & Risk Awareness"}', '{"en": "Safety & Risk Awareness skills and competencies"}', 23, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 'u-etho', '{"en": "Professionalism & Work Habits"}', '{"en": "Professionalism & Work Habits skills and competencies"}', 24, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 'f-ops', '{"en": "Operations & Process Execution"}', '{"en": "Operations & Process Execution skills and competencies"}', 25, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 'f-log', '{"en": "Logistics, Warehousing & Fulfillment"}', '{"en": "Logistics, Warehousing & Fulfillment skills and competencies"}', 26, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 'f-supply', '{"en": "Procurement & Supply Management"}', '{"en": "Procurement & Supply Management skills and competencies"}', 27, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 'f-qaqc', '{"en": "Quality Assurance & Control"}', '{"en": "Quality Assurance & Control skills and competencies"}', 28, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 'f-mfg', '{"en": "Manufacturing & Production"}', '{"en": "Manufacturing & Production skills and competencies"}', 29, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 'f-maint', '{"en": "Maintenance & Reliability"}', '{"en": "Maintenance & Reliability skills and competencies"}', 30, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 'f-const', '{"en": "Construction & Built Environment"}', '{"en": "Construction & Built Environment skills and competencies"}', 31, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 'f-trades', '{"en": "Skilled Trades"}', '{"en": "Skilled Trades skills and competencies"}', 32, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 'f-agri', '{"en": "Agriculture, Horticulture & Forestry"}', '{"en": "Agriculture, Horticulture & Forestry skills and competencies"}', 33, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 'f-food', '{"en": "Food & Culinary Arts"}', '{"en": "Food & Culinary Arts skills and competencies"}', 34, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 'f-retail', '{"en": "Retail & Merchandising"}', '{"en": "Retail & Merchandising skills and competencies"}', 35, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 'f-hosp', '{"en": "Hospitality, Tourism & Events"}', '{"en": "Hospitality, Tourism & Events skills and competencies"}', 36, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 'f-csrvc', '{"en": "Customer Support & Contact Centers"}', '{"en": "Customer Support & Contact Centers skills and competencies"}', 37, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 'f-sales', '{"en": "Sales & Business Development"}', '{"en": "Sales & Business Development skills and competencies"}', 38, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 'f-mktg', '{"en": "Marketing & Communications"}', '{"en": "Marketing & Communications skills and competencies"}', 39, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 'f-prod', '{"en": "Product Management"}', '{"en": "Product Management skills and competencies"}', 40, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 'f-pm', '{"en": "Project/Program Management"}', '{"en": "Project/Program Management skills and competencies"}', 41, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 'f-strat', '{"en": "Strategy & Corporate Development"}', '{"en": "Strategy & Corporate Development skills and competencies"}', 42, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 'f-fin', '{"en": "Finance, Accounting & Controlling"}', '{"en": "Finance, Accounting & Controlling skills and competencies"}', 43, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 'f-legal', '{"en": "Legal, Compliance & Governance"}', '{"en": "Legal, Compliance & Governance skills and competencies"}', 44, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 'f-hr', '{"en": "People, HR & Talent"}', '{"en": "People, HR & Talent skills and competencies"}', 45, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 'f-edu', '{"en": "Education, Training & Facilitation"}', '{"en": "Education, Training & Facilitation skills and competencies"}', 46, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 'f-health', '{"en": "Health, Care & Clinical Services"}', '{"en": "Health, Care & Clinical Services skills and competencies"}', 47, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 'f-pub', '{"en": "Public Sector, Civic & Social Services"}', '{"en": "Public Sector, Civic & Social Services skills and competencies"}', 48, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 'f-env', '{"en": "Environment, Sustainability & EHS"}', '{"en": "Environment, Sustainability & EHS skills and competencies"}', 49, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 'f-real', '{"en": "Real Estate, Property & Facilities"}', '{"en": "Real Estate, Property & Facilities skills and competencies"}', 50, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 'f-sec', '{"en": "Security, Safety & Emergency Response"}', '{"en": "Security, Safety & Emergency Response skills and competencies"}', 51, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 'f-creative', '{"en": "Creative, Content, Media & Entertainment"}', '{"en": "Creative, Content, Media & Entertainment skills and competencies"}', 52, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 'f-sport', '{"en": "Sports, Fitness & Wellness"}', '{"en": "Sports, Fitness & Wellness skills and competencies"}', 53, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 'f-research', '{"en": "Research & Analysis"}', '{"en": "Research & Analysis skills and competencies"}', 54, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 'f-it', '{"en": "Software Engineering"}', '{"en": "Software Engineering skills and competencies"}', 55, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 'f-data', '{"en": "Data Engineering & Analytics"}', '{"en": "Data Engineering & Analytics skills and competencies"}', 56, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 'f-aiml', '{"en": "Artificial Intelligence & ML"}', '{"en": "Artificial Intelligence & ML skills and competencies"}', 57, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 'f-cyber', '{"en": "Cybersecurity & Information Assurance"}', '{"en": "Cybersecurity & Information Assurance skills and competencies"}', 58, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 'f-cloud', '{"en": "Cloud, DevOps & SRE"}', '{"en": "Cloud, DevOps & SRE skills and competencies"}', 59, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 'f-hw', '{"en": "Hardware, Electronics & Embedded"}', '{"en": "Hardware, Electronics & Embedded skills and competencies"}', 60, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 'f-net', '{"en": "Networks & Telecommunications"}', '{"en": "Networks & Telecommunications skills and competencies"}', 61, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 'f-ux', '{"en": "UX/UI & Product Design"}', '{"en": "UX/UI & Product Design skills and competencies"}', 62, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 'f-arch', '{"en": "Architecture & Urban Planning"}', '{"en": "Architecture & Urban Planning skills and competencies"}', 63, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 'f-energy', '{"en": "Energy & Utilities"}', '{"en": "Energy & Utilities skills and competencies"}', 64, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 'f-trans', '{"en": "Transport & Mobility"}', '{"en": "Transport & Mobility skills and competencies"}', 65, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 'f-mar', '{"en": "Maritime & Offshore"}', '{"en": "Maritime & Offshore skills and competencies"}', 66, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 'f-aero', '{"en": "Aerospace & Aviation"}', '{"en": "Aerospace & Aviation skills and competencies"}', 67, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 'f-pharma', '{"en": "Pharma, Biotech & Lab Ops"}', '{"en": "Pharma, Biotech & Lab Ops skills and competencies"}', 68, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 'f-mines', '{"en": "Mining & Natural Resources"}', '{"en": "Mining & Natural Resources skills and competencies"}', 69, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 't-office', '{"en": "Office & Productivity Suites"}', '{"en": "Office & Productivity Suites skills and competencies"}', 70, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 't-collab', '{"en": "Communication & Collaboration"}', '{"en": "Communication & Collaboration skills and competencies"}', 71, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 't-cms', '{"en": "Content & Knowledge Mgmt"}', '{"en": "Content & Knowledge Mgmt skills and competencies"}', 72, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 't-crm', '{"en": "CRM & Marketing Platforms"}', '{"en": "CRM & Marketing Platforms skills and competencies"}', 73, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 't-erp', '{"en": "ERP & Finance Systems"}', '{"en": "ERP & Finance Systems skills and competencies"}', 74, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 't-hris', '{"en": "HRIS & LMS"}', '{"en": "HRIS & LMS skills and competencies"}', 75, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 't-ecomm', '{"en": "E-commerce & POS"}', '{"en": "E-commerce & POS skills and competencies"}', 76, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 't-data', '{"en": "Databases & Warehousing"}', '{"en": "Databases & Warehousing skills and competencies"}', 77, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 't-bi', '{"en": "Business Intelligence"}', '{"en": "Business Intelligence skills and competencies"}', 78, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 't-analyt', '{"en": "Analytics & Experimentation"}', '{"en": "Analytics & Experimentation skills and competencies"}', 79, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 't-ds', '{"en": "Data Science & ML Platforms"}', '{"en": "Data Science & ML Platforms skills and competencies"}', 80, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 't-mlops', '{"en": "MLOps & Monitoring"}', '{"en": "MLOps & Monitoring skills and competencies"}', 81, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 't-dev', '{"en": "Programming Languages & SDKs"}', '{"en": "Programming Languages & SDKs skills and competencies"}', 82, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 't-vcs', '{"en": "Version Control"}', '{"en": "Version Control skills and competencies"}', 83, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 't-cicd', '{"en": "CI/CD & Build Systems"}', '{"en": "CI/CD & Build Systems skills and competencies"}', 84, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 't-cloud', '{"en": "Cloud Platforms"}', '{"en": "Cloud Platforms skills and competencies"}', 85, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 't-infra', '{"en": "Infrastructure & OS"}', '{"en": "Infrastructure & OS skills and competencies"}', 86, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 't-net', '{"en": "Networking & Edge"}', '{"en": "Networking & Edge skills and competencies"}', 87, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 't-sec', '{"en": "Security Tooling"}', '{"en": "Security Tooling skills and competencies"}', 88, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 't-itsm', '{"en": "IT Service Management"}', '{"en": "IT Service Management skills and competencies"}', 89, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 't-design', '{"en": "Design & Prototyping"}', '{"en": "Design & Prototyping skills and competencies"}', 90, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 't-img', '{"en": "Imaging & 3D"}', '{"en": "Imaging & 3D skills and competencies"}', 91, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 't-audio', '{"en": "Audio & Music"}', '{"en": "Audio & Music skills and competencies"}', 92, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 't-video', '{"en": "Video & VFX"}', '{"en": "Video & VFX skills and competencies"}', 93, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 't-gis', '{"en": "Mapping & GIS"}', '{"en": "Mapping & GIS skills and competencies"}', 94, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 't-cad', '{"en": "CAD/CAE/CAM"}', '{"en": "CAD/CAE/CAM skills and competencies"}', 95, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 't-plc', '{"en": "Industrial Control (PLC/SCADA/DCS)"}', '{"en": "Industrial Control (PLC/SCADA/DCS) skills and competencies"}', 96, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 't-qa', '{"en": "Test & QA Tooling"}', '{"en": "Test & QA Tooling skills and competencies"}', 97, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 't-iot', '{"en": "IoT, Robotics & Automation"}', '{"en": "IoT, Robotics & Automation skills and competencies"}', 98, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 't-lab', '{"en": "Laboratory Instruments"}', '{"en": "Laboratory Instruments skills and competencies"}', 99, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 't-med', '{"en": "Medical Devices & Records"}', '{"en": "Medical Devices & Records skills and competencies"}', 100, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 't-energy', '{"en": "Energy & BMS Systems"}', '{"en": "Energy & BMS Systems skills and competencies"}', 101, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 't-agri', '{"en": "AgriTech & Sensors"}', '{"en": "AgriTech & Sensors skills and competencies"}', 102, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 't-telem', '{"en": "Telematics & Fleet"}', '{"en": "Telematics & Fleet skills and competencies"}', 103, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 't-kitch', '{"en": "Culinary Equipment"}', '{"en": "Culinary Equipment skills and competencies"}', 104, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 'l-lang', '{"en": "Natural Languages"}', '{"en": "Natural Languages skills and competencies"}', 105, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 'l-sign', '{"en": "Sign Languages"}', '{"en": "Sign Languages skills and competencies"}', 106, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 'l-modal', '{"en": "Language Modalities"}', '{"en": "Language Modalities skills and competencies"}', 107, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 'l-int', '{"en": "Interpretation & Translation"}', '{"en": "Interpretation & Translation skills and competencies"}', 108, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 'l-write', '{"en": "Writing Systems & Orthography"}', '{"en": "Writing Systems & Orthography skills and competencies"}', 109, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 'l-region', '{"en": "Regional Etiquette & Protocols"}', '{"en": "Regional Etiquette & Protocols skills and competencies"}', 110, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 'l-cxcomm', '{"en": "Cross-cultural Communication"}', '{"en": "Cross-cultural Communication skills and competencies"}', 111, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 'l-team', '{"en": "Cross-cultural Teaming & Leadership"}', '{"en": "Cross-cultural Teaming & Leadership skills and competencies"}', 112, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 'l-cultlit', '{"en": "Cultural Literacy"}', '{"en": "Cultural Literacy skills and competencies"}', 113, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 'l-lsp', '{"en": "Language for Specific Purposes"}', '{"en": "Language for Specific Purposes skills and competencies"}', 114, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 'l-access', '{"en": "Plain Language & Accessibility"}', '{"en": "Plain Language & Accessibility skills and competencies"}', 115, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 'l-public', '{"en": "Rhetoric & Public Speaking"}', '{"en": "Rhetoric & Public Speaking skills and competencies"}', 116, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 'l-cust', '{"en": "Multilingual Customer Interaction"}', '{"en": "Multilingual Customer Interaction skills and competencies"}', 117, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 'm-pmbok', '{"en": "Project & Portfolio Mgmt"}', '{"en": "Project & Portfolio Mgmt skills and competencies"}', 118, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 'm-agile', '{"en": "Agile Frameworks"}', '{"en": "Agile Frameworks skills and competencies"}', 119, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 'm-prod', '{"en": "Product Discovery & Delivery"}', '{"en": "Product Discovery & Delivery skills and competencies"}', 120, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 'm-lean', '{"en": "Lean Systems"}', '{"en": "Lean Systems skills and competencies"}', 121, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 'm-six', '{"en": "Six Sigma"}', '{"en": "Six Sigma skills and competencies"}', 122, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 'm-bpm', '{"en": "Business Process Mgmt"}', '{"en": "Business Process Mgmt skills and competencies"}', 123, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 'm-research', '{"en": "Research Methods"}', '{"en": "Research Methods skills and competencies"}', 124, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 'm-ux', '{"en": "UX Research & Design"}', '{"en": "UX Research & Design skills and competencies"}', 125, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 'm-data', '{"en": "Data Science Lifecycle"}', '{"en": "Data Science Lifecycle skills and competencies"}', 126, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 'm-mlops', '{"en": "MLOps & Model Governance"}', '{"en": "MLOps & Model Governance skills and competencies"}', 127, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 'm-sec', '{"en": "Security & Privacy"}', '{"en": "Security & Privacy skills and competencies"}', 128, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 'm-qms', '{"en": "Quality Systems"}', '{"en": "Quality Systems skills and competencies"}', 129, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 'm-gxp', '{"en": "GxP Practices"}', '{"en": "GxP Practices skills and competencies"}', 130, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 'm-hse', '{"en": "Health, Safety & Environment"}', '{"en": "Health, Safety & Environment skills and competencies"}', 131, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 'm-risk', '{"en": "Risk Management"}', '{"en": "Risk Management skills and competencies"}', 132, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 'm-audit', '{"en": "Audit & Compliance"}', '{"en": "Audit & Compliance skills and competencies"}', 133, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 'm-fin', '{"en": "Financial Methods"}', '{"en": "Financial Methods skills and competencies"}', 134, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 'm-proc', '{"en": "Procurement & Sourcing"}', '{"en": "Procurement & Sourcing skills and competencies"}', 135, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 'm-sales', '{"en": "Sales Methods"}', '{"en": "Sales Methods skills and competencies"}', 136, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 'm-mktg', '{"en": "Marketing & Growth"}', '{"en": "Marketing & Growth skills and competencies"}', 137, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 'm-ops', '{"en": "Service & IT Ops"}', '{"en": "Service & IT Ops skills and competencies"}', 138, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 'm-dev', '{"en": "Software Engineering"}', '{"en": "Software Engineering skills and competencies"}', 139, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 'm-devops', '{"en": "DevOps & Release"}', '{"en": "DevOps & Release skills and competencies"}', 140, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 'm-edu', '{"en": "Instructional Design"}', '{"en": "Instructional Design skills and competencies"}', 141, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 'm-hr', '{"en": "HR & Talent Processes"}', '{"en": "HR & Talent Processes skills and competencies"}', 142, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 'm-legal', '{"en": "Legal Practices"}', '{"en": "Legal Practices skills and competencies"}', 143, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 'm-negot', '{"en": "Facilitation & Mediation"}', '{"en": "Facilitation & Mediation skills and competencies"}', 144, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 'm-lca', '{"en": "Sustainability Methods"}', '{"en": "Sustainability Methods skills and competencies"}', 145, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 'm-bim', '{"en": "BIM & Construction Workflows"}', '{"en": "BIM & Construction Workflows skills and competencies"}', 146, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 'd-math', '{"en": "Mathematics"}', '{"en": "Mathematics skills and competencies"}', 147, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 'd-stat', '{"en": "Statistics & Probability"}', '{"en": "Statistics & Probability skills and competencies"}', 148, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 'd-cs', '{"en": "Computer Science"}', '{"en": "Computer Science skills and competencies"}', 149, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 'd-phys', '{"en": "Physics"}', '{"en": "Physics skills and competencies"}', 150, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 'd-chem', '{"en": "Chemistry"}', '{"en": "Chemistry skills and competencies"}', 151, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 'd-bio', '{"en": "Biology"}', '{"en": "Biology skills and competencies"}', 152, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 'd-earth', '{"en": "Earth & Environmental Sciences"}', '{"en": "Earth & Environmental Sciences skills and competencies"}', 153, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 'd-mats', '{"en": "Materials Science"}', '{"en": "Materials Science skills and competencies"}', 154, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 'd-mech', '{"en": "Mechanical Engineering"}', '{"en": "Mechanical Engineering skills and competencies"}', 155, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 'd-ee', '{"en": "Electrical & Electronics"}', '{"en": "Electrical & Electronics skills and competencies"}', 156, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 'd-civil', '{"en": "Civil & Structural"}', '{"en": "Civil & Structural skills and competencies"}', 157, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 'd-che', '{"en": "Chemical Engineering"}', '{"en": "Chemical Engineering skills and competencies"}', 158, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 'd-health', '{"en": "Medical & Health Sciences"}', '{"en": "Medical & Health Sciences skills and competencies"}', 159, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 'd-pharm', '{"en": "Pharmaceutical Sciences"}', '{"en": "Pharmaceutical Sciences skills and competencies"}', 160, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 'd-soc', '{"en": "Social Sciences"}', '{"en": "Social Sciences skills and competencies"}', 161, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 'd-econ', '{"en": "Economics & Policy"}', '{"en": "Economics & Policy skills and competencies"}', 162, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 'd-bus', '{"en": "Business & Management"}', '{"en": "Business & Management skills and competencies"}', 163, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 'd-fin', '{"en": "Finance & Accounting"}', '{"en": "Finance & Accounting skills and competencies"}', 164, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 'd-law', '{"en": "Law, Regulation & Governance"}', '{"en": "Law, Regulation & Governance skills and competencies"}', 165, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 'd-edu', '{"en": "Education & Pedagogy"}', '{"en": "Education & Pedagogy skills and competencies"}', 166, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 'd-arch', '{"en": "Architecture & Built Environment"}', '{"en": "Architecture & Built Environment skills and competencies"}', 167, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 'd-media', '{"en": "Media & Communication"}', '{"en": "Media & Communication skills and competencies"}', 168, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 'd-agri', '{"en": "Agriculture & Food Systems"}', '{"en": "Agriculture & Food Systems skills and competencies"}', 169, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 'd-energy', '{"en": "Energy Systems & Markets"}', '{"en": "Energy Systems & Markets skills and competencies"}', 170, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 'd-trans', '{"en": "Transportation & Mobility Systems"}', '{"en": "Transportation & Mobility Systems skills and competencies"}', 171, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 'd-urban', '{"en": "Urban & Regional Planning"}', '{"en": "Urban & Regional Planning skills and competencies"}', 172, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 'd-env', '{"en": "Sustainability, Climate & Biodiversity"}', '{"en": "Sustainability, Climate & Biodiversity skills and competencies"}', 173, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 'd-sec', '{"en": "Security, Defense & Geopolitics"}', '{"en": "Security, Defense & Geopolitics skills and competencies"}', 174, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 'd-sport', '{"en": "Kinesiology, Sports Science & Nutrition"}', '{"en": "Kinesiology, Sports Science & Nutrition skills and competencies"}', 175, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 'd-arts', '{"en": "Arts, Culture & Aesthetics"}', '{"en": "Arts, Culture & Aesthetics skills and competencies"}', 176, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

INSERT INTO skills_subcategories (cat_id, subcat_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 'd-hum', '{"en": "Humanities"}', '{"en": "Humanities skills and competencies"}', 177, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id) DO NOTHING;

-- Insert L3 subcategories
INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 1, 'u-comm-verbal-communication', '{"en": "Verbal communication"}', '{"en": "Verbal communication related skills"}', 1, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 2, 'u-comm-written-communication', '{"en": "Written communication"}', '{"en": "Written communication related skills"}', 2, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 3, 'u-comm-nonverbal-cues-body-language', '{"en": "Nonverbal cues & body language"}', '{"en": "Nonverbal cues & body language related skills"}', 3, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 4, 'u-comm-active-listening-questioning', '{"en": "Active listening & questioning"}', '{"en": "Active listening & questioning related skills"}', 4, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 5, 'u-comm-audience-analysis-tailoring', '{"en": "Audience analysis & tailoring"}', '{"en": "Audience analysis & tailoring related skills"}', 5, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 6, 'u-comm-meeting-facilitation-minutes', '{"en": "Meeting facilitation & minutes"}', '{"en": "Meeting facilitation & minutes related skills"}', 6, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 7, 'u-comm-feedback-feedforward', '{"en": "Feedback & feedforward"}', '{"en": "Feedback & feedforward related skills"}', 7, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 1, 8, 'u-comm-asynchronous-communication-hygiene', '{"en": "Asynchronous communication hygiene"}', '{"en": "Asynchronous communication hygiene related skills"}', 8, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 9, 'u-coll-team-coordination-rituals', '{"en": "Team coordination & rituals"}', '{"en": "Team coordination & rituals related skills"}', 9, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 10, 'u-coll-cross-functional-collaboration', '{"en": "Cross-functional collaboration"}', '{"en": "Cross-functional collaboration related skills"}', 10, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 11, 'u-coll-conflict-resolution-mediation', '{"en": "Conflict resolution & mediation"}', '{"en": "Conflict resolution & mediation related skills"}', 11, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 12, 'u-coll-knowledge-sharing-documentation', '{"en": "Knowledge sharing & documentation"}', '{"en": "Knowledge sharing & documentation related skills"}', 12, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 13, 'u-coll-pairing-mob-work-practices', '{"en": "Pairing & mob work practices"}', '{"en": "Pairing & mob work practices related skills"}', 13, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 14, 'u-coll-remote-first-collaboration', '{"en": "Remote-first collaboration"}', '{"en": "Remote-first collaboration related skills"}', 14, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 15, 'u-coll-psychological-safety-practices', '{"en": "Psychological safety practices"}', '{"en": "Psychological safety practices related skills"}', 15, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 2, 16, 'u-coll-decision-making-in-teams-daci-raci', '{"en": "Decision-making in teams (DACI/RACI)"}', '{"en": "Decision-making in teams (DACI/RACI) related skills"}', 16, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 17, 'u-lead-vision-strategy-goal-setting', '{"en": "Vision, strategy & goal setting"}', '{"en": "Vision, strategy & goal setting related skills"}', 17, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 18, 'u-lead-delegation-coaching', '{"en": "Delegation & coaching"}', '{"en": "Delegation & coaching related skills"}', 18, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 19, 'u-lead-motivating-recognition', '{"en": "Motivating & recognition"}', '{"en": "Motivating & recognition related skills"}', 19, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 20, 'u-lead-change-leadership-adoption', '{"en": "Change leadership & adoption"}', '{"en": "Change leadership & adoption related skills"}', 20, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 21, 'u-lead-performance-conversations', '{"en": "Performance conversations"}', '{"en": "Performance conversations related skills"}', 21, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 22, 'u-lead-managing-up-across', '{"en": "Managing up & across"}', '{"en": "Managing up & across related skills"}', 22, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 23, 'u-lead-ethics-accountability', '{"en": "Ethics & accountability"}', '{"en": "Ethics & accountability related skills"}', 23, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 3, 24, 'u-lead-succession-talent-growth', '{"en": "Succession & talent growth"}', '{"en": "Succession & talent growth related skills"}', 24, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 25, 'u-coach-contracting-goals', '{"en": "Contracting & goals"}', '{"en": "Contracting & goals related skills"}', 25, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 26, 'u-coach-observation-inquiry', '{"en": "Observation & inquiry"}', '{"en": "Observation & inquiry related skills"}', 26, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 27, 'u-coach-action-planning-accountability', '{"en": "Action planning & accountability"}', '{"en": "Action planning & accountability related skills"}', 27, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 28, 'u-coach-career-navigation', '{"en": "Career navigation"}', '{"en": "Career navigation related skills"}', 28, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 29, 'u-coach-skills-mentoring', '{"en": "Skills mentoring"}', '{"en": "Skills mentoring related skills"}', 29, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 30, 'u-coach-sponsorship-advocacy', '{"en": "Sponsorship & advocacy"}', '{"en": "Sponsorship & advocacy related skills"}', 30, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 31, 'u-coach-coaching-ethics-boundaries', '{"en": "Coaching ethics & boundaries"}', '{"en": "Coaching ethics & boundaries related skills"}', 31, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 4, 32, 'u-coach-measurement-reflection', '{"en": "Measurement & reflection"}', '{"en": "Measurement & reflection related skills"}', 32, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 33, 'u-negot-preparation-interests-batna', '{"en": "Preparation, interests & BATNA"}', '{"en": "Preparation, interests & BATNA related skills"}', 33, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 34, 'u-negot-value-creation-trade-offs', '{"en": "Value creation & trade-offs"}', '{"en": "Value creation & trade-offs related skills"}', 34, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 35, 'u-negot-anchoring-concession-tactics', '{"en": "Anchoring & concession tactics"}', '{"en": "Anchoring & concession tactics related skills"}', 35, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 36, 'u-negot-cross-cultural-negotiation', '{"en": "Cross-cultural negotiation"}', '{"en": "Cross-cultural negotiation related skills"}', 36, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 37, 'u-negot-multi-party-mediation', '{"en": "Multi-party mediation"}', '{"en": "Multi-party mediation related skills"}', 37, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 38, 'u-negot-agreement-drafting-closure', '{"en": "Agreement drafting & closure"}', '{"en": "Agreement drafting & closure related skills"}', 38, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 39, 'u-negot-post-deal-implementation', '{"en": "Post-deal implementation"}', '{"en": "Post-deal implementation related skills"}', 39, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 5, 40, 'u-negot-negotiation-ethics', '{"en": "Negotiation ethics"}', '{"en": "Negotiation ethics related skills"}', 40, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 41, 'u-infl-stakeholder-mapping-salience', '{"en": "Stakeholder mapping & salience"}', '{"en": "Stakeholder mapping & salience related skills"}', 41, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 42, 'u-infl-executive-communication', '{"en": "Executive communication"}', '{"en": "Executive communication related skills"}', 42, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 43, 'u-infl-influence-without-authority', '{"en": "Influence without authority"}', '{"en": "Influence without authority related skills"}', 43, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 44, 'u-infl-narrative-storytelling', '{"en": "Narrative & storytelling"}', '{"en": "Narrative & storytelling related skills"}', 44, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 45, 'u-infl-framing-reframing', '{"en": "Framing & reframing"}', '{"en": "Framing & reframing related skills"}', 45, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 46, 'u-infl-managing-resistance', '{"en": "Managing resistance"}', '{"en": "Managing resistance related skills"}', 46, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 47, 'u-infl-political-awareness', '{"en": "Political awareness"}', '{"en": "Political awareness related skills"}', 47, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 6, 48, 'u-infl-expectation-management', '{"en": "Expectation management"}', '{"en": "Expectation management related skills"}', 48, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 49, 'u-cust-needs-discovery-jtbd', '{"en": "Needs discovery & JTBD"}', '{"en": "Needs discovery & JTBD related skills"}', 49, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 50, 'u-cust-service-standards-slas', '{"en": "Service standards & SLAs"}', '{"en": "Service standards & SLAs related skills"}', 50, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 51, 'u-cust-complaint-handling-recovery', '{"en": "Complaint handling & recovery"}', '{"en": "Complaint handling & recovery related skills"}', 51, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 52, 'u-cust-empathy-de-escalation', '{"en": "Empathy & de-escalation"}', '{"en": "Empathy & de-escalation related skills"}', 52, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 53, 'u-cust-service-playbooks-scripts', '{"en": "Service playbooks & scripts"}', '{"en": "Service playbooks & scripts related skills"}', 53, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 54, 'u-cust-success-metrics-csat-nps', '{"en": "Success metrics & CSAT/NPS"}', '{"en": "Success metrics & CSAT/NPS related skills"}', 54, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 55, 'u-cust-account-growth-retention', '{"en": "Account growth & retention"}', '{"en": "Account growth & retention related skills"}', 55, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 7, 56, 'u-cust-handoffs-escalations', '{"en": "Handoffs & escalations"}', '{"en": "Handoffs & escalations related skills"}', 56, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 57, 'u-ethic-integrity-confidentiality', '{"en": "Integrity & confidentiality"}', '{"en": "Integrity & confidentiality related skills"}', 57, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 58, 'u-ethic-fairness-equity', '{"en": "Fairness & equity"}', '{"en": "Fairness & equity related skills"}', 58, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 59, 'u-ethic-responsible-tech-data-use', '{"en": "Responsible tech/data use"}', '{"en": "Responsible tech/data use related skills"}', 59, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 60, 'u-ethic-conflict-of-interest', '{"en": "Conflict of interest"}', '{"en": "Conflict of interest related skills"}', 60, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 61, 'u-ethic-ethical-decision-frameworks', '{"en": "Ethical decision frameworks"}', '{"en": "Ethical decision frameworks related skills"}', 61, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 62, 'u-ethic-whistleblowing-reporting', '{"en": "Whistleblowing & reporting"}', '{"en": "Whistleblowing & reporting related skills"}', 62, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 63, 'u-ethic-bias-awareness-mitigation', '{"en": "Bias awareness & mitigation"}', '{"en": "Bias awareness & mitigation related skills"}', 63, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 8, 64, 'u-ethic-social-environmental-impact', '{"en": "Social & environmental impact"}', '{"en": "Social & environmental impact related skills"}', 64, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 65, 'u-crit-assumption-surfacing', '{"en": "Assumption surfacing"}', '{"en": "Assumption surfacing related skills"}', 65, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 66, 'u-crit-evidence-appraisal', '{"en": "Evidence appraisal"}', '{"en": "Evidence appraisal related skills"}', 66, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 67, 'u-crit-causal-reasoning-counterfactuals', '{"en": "Causal reasoning & counterfactuals"}', '{"en": "Causal reasoning & counterfactuals related skills"}', 67, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 68, 'u-crit-logical-fallacies-biases', '{"en": "Logical fallacies & biases"}', '{"en": "Logical fallacies & biases related skills"}', 68, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 69, 'u-crit-hypothesis-testing', '{"en": "Hypothesis testing"}', '{"en": "Hypothesis testing related skills"}', 69, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 70, 'u-crit-triangulation-source-reliability', '{"en": "Triangulation & source reliability"}', '{"en": "Triangulation & source reliability related skills"}', 70, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 71, 'u-crit-scenario-analysis', '{"en": "Scenario analysis"}', '{"en": "Scenario analysis related skills"}', 71, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 9, 72, 'u-crit-decision-quality-review', '{"en": "Decision quality review"}', '{"en": "Decision quality review related skills"}', 72, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 73, 'u-creat-divergent-thinking-prompts', '{"en": "Divergent thinking & prompts"}', '{"en": "Divergent thinking & prompts related skills"}', 73, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 74, 'u-creat-concept-synthesis-reframing', '{"en": "Concept synthesis & reframing"}', '{"en": "Concept synthesis & reframing related skills"}', 74, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 75, 'u-creat-creative-constraints-briefs', '{"en": "Creative constraints & briefs"}', '{"en": "Creative constraints & briefs related skills"}', 75, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 76, 'u-creat-evaluation-selection', '{"en": "Evaluation & selection"}', '{"en": "Evaluation & selection related skills"}', 76, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 77, 'u-creat-rapid-prototyping', '{"en": "Rapid prototyping"}', '{"en": "Rapid prototyping related skills"}', 77, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 78, 'u-creat-inspiration-boards-references', '{"en": "Inspiration boards & references"}', '{"en": "Inspiration boards & references related skills"}', 78, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 79, 'u-creat-brainstorm-facilitation', '{"en": "Brainstorm facilitation"}', '{"en": "Brainstorm facilitation related skills"}', 79, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 10, 80, 'u-creat-creative-critique', '{"en": "Creative critique"}', '{"en": "Creative critique related skills"}', 80, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 81, 'u-probl-problem-framing-scoping', '{"en": "Problem framing & scoping"}', '{"en": "Problem framing & scoping related skills"}', 81, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 82, 'u-probl-root-cause-analysis-5-whys-fishbone', '{"en": "Root cause analysis (5-Whys, Fishbone)"}', '{"en": "Root cause analysis (5-Whys, Fishbone) related skills"}', 82, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 83, 'u-probl-option-generation-evaluation', '{"en": "Option generation & evaluation"}', '{"en": "Option generation & evaluation related skills"}', 83, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 84, 'u-probl-decision-methods-mcda-ice-rice', '{"en": "Decision methods (MCDA, ICE, RICE)"}', '{"en": "Decision methods (MCDA, ICE, RICE) related skills"}', 84, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 85, 'u-probl-experiment-design', '{"en": "Experiment design"}', '{"en": "Experiment design related skills"}', 85, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 86, 'u-probl-risk-assessment', '{"en": "Risk assessment"}', '{"en": "Risk assessment related skills"}', 86, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 87, 'u-probl-decision-recording-review', '{"en": "Decision recording & review"}', '{"en": "Decision recording & review related skills"}', 87, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 11, 88, 'u-probl-implementation-follow-through', '{"en": "Implementation follow-through"}', '{"en": "Implementation follow-through related skills"}', 88, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 89, 'u-learn-learning-strategies-spaced-practice', '{"en": "Learning strategies & spaced practice"}', '{"en": "Learning strategies & spaced practice related skills"}', 89, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 90, 'u-learn-deliberate-practice-feedback', '{"en": "Deliberate practice & feedback"}', '{"en": "Deliberate practice & feedback related skills"}', 90, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 91, 'u-learn-reflection-journaling', '{"en": "Reflection & journaling"}', '{"en": "Reflection & journaling related skills"}', 91, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 92, 'u-learn-teach-back-peer-learning', '{"en": "Teach-back & peer learning"}', '{"en": "Teach-back & peer learning related skills"}', 92, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 93, 'u-learn-learning-plans-goals', '{"en": "Learning plans & goals"}', '{"en": "Learning plans & goals related skills"}', 93, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 94, 'u-learn-microlearning-retrieval', '{"en": "Microlearning & retrieval"}', '{"en": "Microlearning & retrieval related skills"}', 94, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 95, 'u-learn-metacognition', '{"en": "Metacognition"}', '{"en": "Metacognition related skills"}', 95, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 12, 96, 'u-learn-unlearning-relearning', '{"en": "Unlearning & relearning"}', '{"en": "Unlearning & relearning related skills"}', 96, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 97, 'u-adapt-ambiguity-coping', '{"en": "Ambiguity coping"}', '{"en": "Ambiguity coping related skills"}', 97, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 98, 'u-adapt-rapid-reprioritization', '{"en": "Rapid reprioritization"}', '{"en": "Rapid reprioritization related skills"}', 98, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 99, 'u-adapt-tool-system-upskilling', '{"en": "Tool & system upskilling"}', '{"en": "Tool & system upskilling related skills"}', 99, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 100, 'u-adapt-context-switching', '{"en": "Context switching"}', '{"en": "Context switching related skills"}', 100, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 101, 'u-adapt-stress-inoculation', '{"en": "Stress inoculation"}', '{"en": "Stress inoculation related skills"}', 101, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 102, 'u-adapt-change-adoption-behaviors', '{"en": "Change adoption behaviors"}', '{"en": "Change adoption behaviors related skills"}', 102, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 103, 'u-adapt-rescoping-trade-offs', '{"en": "Rescoping & trade-offs"}', '{"en": "Rescoping & trade-offs related skills"}', 103, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 13, 104, 'u-adapt-contingency-planning', '{"en": "Contingency planning"}', '{"en": "Contingency planning related skills"}', 104, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 105, 'u-resil-stress-management-routines', '{"en": "Stress management routines"}', '{"en": "Stress management routines related skills"}', 105, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 106, 'u-resil-focus-under-pressure', '{"en": "Focus under pressure"}', '{"en": "Focus under pressure related skills"}', 106, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 107, 'u-resil-recovery-rest', '{"en": "Recovery & rest"}', '{"en": "Recovery & rest related skills"}', 107, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 108, 'u-resil-emotional-regulation', '{"en": "Emotional regulation"}', '{"en": "Emotional regulation related skills"}', 108, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 109, 'u-resil-boundary-setting', '{"en": "Boundary setting"}', '{"en": "Boundary setting related skills"}', 109, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 110, 'u-resil-cognitive-reframing', '{"en": "Cognitive reframing"}', '{"en": "Cognitive reframing related skills"}', 110, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 111, 'u-resil-support-systems', '{"en": "Support systems"}', '{"en": "Support systems related skills"}', 111, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 14, 112, 'u-resil-crisis-response-basics', '{"en": "Crisis response basics"}', '{"en": "Crisis response basics related skills"}', 112, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 113, 'u-time-prioritization-frameworks', '{"en": "Prioritization frameworks"}', '{"en": "Prioritization frameworks related skills"}', 113, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 114, 'u-time-calendar-timeboxing', '{"en": "Calendar & timeboxing"}', '{"en": "Calendar & timeboxing related skills"}', 114, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 115, 'u-time-task-batching-flow', '{"en": "Task batching & flow"}', '{"en": "Task batching & flow related skills"}', 115, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 116, 'u-time-estimate-buffer', '{"en": "Estimate & buffer"}', '{"en": "Estimate & buffer related skills"}', 116, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 117, 'u-time-interrupt-management', '{"en": "Interrupt management"}', '{"en": "Interrupt management related skills"}', 117, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 118, 'u-time-deadline-management', '{"en": "Deadline management"}', '{"en": "Deadline management related skills"}', 118, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 119, 'u-time-personal-slas', '{"en": "Personal SLAs"}', '{"en": "Personal SLAs related skills"}', 119, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 15, 120, 'u-time-review-retros', '{"en": "Review & retros"}', '{"en": "Review & retros related skills"}', 120, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 121, 'u-organ-information-hygiene', '{"en": "Information hygiene"}', '{"en": "Information hygiene related skills"}', 121, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 122, 'u-organ-file-folder-systems', '{"en": "File & folder systems"}', '{"en": "File & folder systems related skills"}', 122, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 123, 'u-organ-note-taking-zettelkasten', '{"en": "Note-taking & Zettelkasten"}', '{"en": "Note-taking & Zettelkasten related skills"}', 123, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 124, 'u-organ-checklist-sop-use', '{"en": "Checklist & SOP use"}', '{"en": "Checklist & SOP use related skills"}', 124, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 125, 'u-organ-inbox-management', '{"en": "Inbox management"}', '{"en": "Inbox management related skills"}', 125, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 126, 'u-organ-versioning-naming', '{"en": "Versioning & naming"}', '{"en": "Versioning & naming related skills"}', 126, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 127, 'u-organ-templates-macros', '{"en": "Templates & macros"}', '{"en": "Templates & macros related skills"}', 127, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 16, 128, 'u-organ-search-retrieval', '{"en": "Search & retrieval"}', '{"en": "Search & retrieval related skills"}', 128, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 129, 'u-num-descriptive-statistics', '{"en": "Descriptive statistics"}', '{"en": "Descriptive statistics related skills"}', 129, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 130, 'u-num-estimation-fermi-problems', '{"en": "Estimation & Fermi problems"}', '{"en": "Estimation & Fermi problems related skills"}', 130, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 131, 'u-num-data-visualization-literacy', '{"en": "Data visualization literacy"}', '{"en": "Data visualization literacy related skills"}', 131, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 132, 'u-num-probability-risk', '{"en": "Probability & risk"}', '{"en": "Probability & risk related skills"}', 132, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 133, 'u-num-sampling-bias-awareness', '{"en": "Sampling & bias awareness"}', '{"en": "Sampling & bias awareness related skills"}', 133, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 134, 'u-num-basic-forecasting', '{"en": "Basic forecasting"}', '{"en": "Basic forecasting related skills"}', 134, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 135, 'u-num-units-conversions', '{"en": "Units & conversions"}', '{"en": "Units & conversions related skills"}', 135, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 17, 136, 'u-num-spreadsheet-fluency', '{"en": "Spreadsheet fluency"}', '{"en": "Spreadsheet fluency related skills"}', 136, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 137, 'u-digi-account-security-mfa', '{"en": "Account security & MFA"}', '{"en": "Account security & MFA related skills"}', 137, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 138, 'u-digi-privacy-settings-hygiene', '{"en": "Privacy settings & hygiene"}', '{"en": "Privacy settings & hygiene related skills"}', 138, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 139, 'u-digi-cloud-files-sharing', '{"en": "Cloud files & sharing"}', '{"en": "Cloud files & sharing related skills"}', 139, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 140, 'u-digi-browser-extension-safety', '{"en": "Browser & extension safety"}', '{"en": "Browser & extension safety related skills"}', 140, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 141, 'u-digi-backup-recovery-basics', '{"en": "Backup & recovery basics"}', '{"en": "Backup & recovery basics related skills"}', 141, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 142, 'u-digi-phishing-awareness', '{"en": "Phishing awareness"}', '{"en": "Phishing awareness related skills"}', 142, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 143, 'u-digi-device-upkeep-updates', '{"en": "Device upkeep & updates"}', '{"en": "Device upkeep & updates related skills"}', 143, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 18, 144, 'u-digi-digital-etiquette', '{"en": "Digital etiquette"}', '{"en": "Digital etiquette related skills"}', 144, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 145, 'u-dei-inclusive-language', '{"en": "Inclusive language"}', '{"en": "Inclusive language related skills"}', 145, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 146, 'u-dei-bias-interruption', '{"en": "Bias interruption"}', '{"en": "Bias interruption related skills"}', 146, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 147, 'u-dei-accessibility-awareness', '{"en": "Accessibility awareness"}', '{"en": "Accessibility awareness related skills"}', 147, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 148, 'u-dei-cultural-humility', '{"en": "Cultural humility"}', '{"en": "Cultural humility related skills"}', 148, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 149, 'u-dei-allyship-behaviors', '{"en": "Allyship behaviors"}', '{"en": "Allyship behaviors related skills"}', 149, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 150, 'u-dei-inclusive-facilitation', '{"en": "Inclusive facilitation"}', '{"en": "Inclusive facilitation related skills"}', 150, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 151, 'u-dei-diverse-sourcing', '{"en": "Diverse sourcing"}', '{"en": "Diverse sourcing related skills"}', 151, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 19, 152, 'u-dei-equity-in-decisions', '{"en": "Equity in decisions"}', '{"en": "Equity in decisions related skills"}', 152, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 153, 'u-present-narrative-structure', '{"en": "Narrative structure"}', '{"en": "Narrative structure related skills"}', 153, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 154, 'u-present-slide-design-essentials', '{"en": "Slide design essentials"}', '{"en": "Slide design essentials related skills"}', 154, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 155, 'u-present-visual-clarity-charts', '{"en": "Visual clarity & charts"}', '{"en": "Visual clarity & charts related skills"}', 155, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 156, 'u-present-delivery-presence', '{"en": "Delivery & presence"}', '{"en": "Delivery & presence related skills"}', 156, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 157, 'u-present-q-a-handling', '{"en": "Q&A handling"}', '{"en": "Q&A handling related skills"}', 157, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 158, 'u-present-demos-live-walkthroughs', '{"en": "Demos & live walkthroughs"}', '{"en": "Demos & live walkthroughs related skills"}', 158, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 159, 'u-present-rehearsal-techniques', '{"en": "Rehearsal techniques"}', '{"en": "Rehearsal techniques related skills"}', 159, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 20, 160, 'u-present-stagecraft-logistics', '{"en": "Stagecraft & logistics"}', '{"en": "Stagecraft & logistics related skills"}', 160, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 161, 'u-write-plain-language-style', '{"en": "Plain-language style"}', '{"en": "Plain-language style related skills"}', 161, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 162, 'u-write-email-memo-writing', '{"en": "Email & memo writing"}', '{"en": "Email & memo writing related skills"}', 162, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 163, 'u-write-reports-briefs', '{"en": "Reports & briefs"}', '{"en": "Reports & briefs related skills"}', 163, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 164, 'u-write-technical-documentation', '{"en": "Technical documentation"}', '{"en": "Technical documentation related skills"}', 164, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 165, 'u-write-ux-microcopy', '{"en": "UX microcopy"}', '{"en": "UX microcopy related skills"}', 165, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 166, 'u-write-proposals-rfps', '{"en": "Proposals & RFPs"}', '{"en": "Proposals & RFPs related skills"}', 166, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 167, 'u-write-editorial-process', '{"en": "Editorial process"}', '{"en": "Editorial process related skills"}', 167, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 21, 168, 'u-write-grammar-style-guides', '{"en": "Grammar & style guides"}', '{"en": "Grammar & style guides related skills"}', 168, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 169, 'u-analyt-summarization-abstracts', '{"en": "Summarization & abstracts"}', '{"en": "Summarization & abstracts related skills"}', 169, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 170, 'u-analyt-comparative-analysis', '{"en": "Comparative analysis"}', '{"en": "Comparative analysis related skills"}', 170, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 171, 'u-analyt-executive-brief-writing', '{"en": "Executive brief writing"}', '{"en": "Executive brief writing related skills"}', 171, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 172, 'u-analyt-evidence-tables', '{"en": "Evidence tables"}', '{"en": "Evidence tables related skills"}', 172, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 173, 'u-analyt-signal-vs-noise', '{"en": "Signal vs noise"}', '{"en": "Signal vs noise related skills"}', 173, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 174, 'u-analyt-insight-statements', '{"en": "Insight statements"}', '{"en": "Insight statements related skills"}', 174, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 175, 'u-analyt-synthesis-visuals', '{"en": "Synthesis visuals"}', '{"en": "Synthesis visuals related skills"}', 175, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 22, 176, 'u-analyt-limits-caveats', '{"en": "Limits & caveats"}', '{"en": "Limits & caveats related skills"}', 176, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 177, 'u-risk-hazard-identification', '{"en": "Hazard identification"}', '{"en": "Hazard identification related skills"}', 177, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 178, 'u-risk-ppe-basics', '{"en": "PPE basics"}', '{"en": "PPE basics related skills"}', 178, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 179, 'u-risk-incident-reporting', '{"en": "Incident reporting"}', '{"en": "Incident reporting related skills"}', 179, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 180, 'u-risk-near-miss-capture', '{"en": "Near-miss capture"}', '{"en": "Near-miss capture related skills"}', 180, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 181, 'u-risk-toolbox-talks', '{"en": "Toolbox talks"}', '{"en": "Toolbox talks related skills"}', 181, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 182, 'u-risk-safety-culture', '{"en": "Safety culture"}', '{"en": "Safety culture related skills"}', 182, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 183, 'u-risk-stop-work-authority', '{"en": "Stop work authority"}', '{"en": "Stop work authority related skills"}', 183, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 23, 184, 'u-risk-basic-first-aid', '{"en": "Basic first aid"}', '{"en": "Basic first aid related skills"}', 184, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 185, 'u-etho-reliability-punctuality', '{"en": "Reliability & punctuality"}', '{"en": "Reliability & punctuality related skills"}', 185, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 186, 'u-etho-ownership-mindset', '{"en": "Ownership mindset"}', '{"en": "Ownership mindset related skills"}', 186, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 187, 'u-etho-follow-up-discipline', '{"en": "Follow-up discipline"}', '{"en": "Follow-up discipline related skills"}', 187, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 188, 'u-etho-confidentiality', '{"en": "Confidentiality"}', '{"en": "Confidentiality related skills"}', 188, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 189, 'u-etho-boundary-management', '{"en": "Boundary management"}', '{"en": "Boundary management related skills"}', 189, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 190, 'u-etho-professional-etiquette', '{"en": "Professional etiquette"}', '{"en": "Professional etiquette related skills"}', 190, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 191, 'u-etho-continuous-improvement', '{"en": "Continuous improvement"}', '{"en": "Continuous improvement related skills"}', 191, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (1, 24, 192, 'u-etho-work-journaling', '{"en": "Work journaling"}', '{"en": "Work journaling related skills"}', 192, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 193, 'f-ops-sop-creation-adherence', '{"en": "SOP creation & adherence"}', '{"en": "SOP creation & adherence related skills"}', 193, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 194, 'f-ops-throughput-takt-time', '{"en": "Throughput & takt time"}', '{"en": "Throughput & takt time related skills"}', 194, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 195, 'f-ops-bottleneck-analysis', '{"en": "Bottleneck analysis"}', '{"en": "Bottleneck analysis related skills"}', 195, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 196, 'f-ops-visual-management', '{"en": "Visual management"}', '{"en": "Visual management related skills"}', 196, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 197, 'f-ops-standard-work-5s', '{"en": "Standard work & 5S"}', '{"en": "Standard work & 5S related skills"}', 197, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 198, 'f-ops-work-cell-design', '{"en": "Work cell design"}', '{"en": "Work cell design related skills"}', 198, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 199, 'f-ops-handoffs-flow', '{"en": "Handoffs & flow"}', '{"en": "Handoffs & flow related skills"}', 199, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 25, 200, 'f-ops-continuous-improvement', '{"en": "Continuous improvement"}', '{"en": "Continuous improvement related skills"}', 200, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 201, 'f-log-receiving-put-away', '{"en": "Receiving & put-away"}', '{"en": "Receiving & put-away related skills"}', 201, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 202, 'f-log-slotting-optimization', '{"en": "Slotting optimization"}', '{"en": "Slotting optimization related skills"}', 202, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 203, 'f-log-picking-strategies', '{"en": "Picking strategies"}', '{"en": "Picking strategies related skills"}', 203, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 204, 'f-log-packing-dunnage', '{"en": "Packing & dunnage"}', '{"en": "Packing & dunnage related skills"}', 204, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 205, 'f-log-cycle-counting-inventory-accuracy', '{"en": "Cycle counting & inventory accuracy"}', '{"en": "Cycle counting & inventory accuracy related skills"}', 205, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 206, 'f-log-wms-operation', '{"en": "WMS operation"}', '{"en": "WMS operation related skills"}', 206, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 207, 'f-log-yard-dock-management', '{"en": "Yard & dock management"}', '{"en": "Yard & dock management related skills"}', 207, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 26, 208, 'f-log-reverse-logistics-returns', '{"en": "Reverse logistics & returns"}', '{"en": "Reverse logistics & returns related skills"}', 208, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 209, 'f-supply-category-strategy', '{"en": "Category strategy"}', '{"en": "Category strategy related skills"}', 209, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 210, 'f-supply-market-scouting-rfx', '{"en": "Market scouting & RFx"}', '{"en": "Market scouting & RFx related skills"}', 210, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 211, 'f-supply-supplier-qualification-audits', '{"en": "Supplier qualification & audits"}', '{"en": "Supplier qualification & audits related skills"}', 211, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 212, 'f-supply-cost-should-cost', '{"en": "Cost & should-cost"}', '{"en": "Cost & should-cost related skills"}', 212, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 213, 'f-supply-contracting-t-cs', '{"en": "Contracting & T&Cs"}', '{"en": "Contracting & T&Cs related skills"}', 213, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 214, 'f-supply-p2p-processes', '{"en": "P2P processes"}', '{"en": "P2P processes related skills"}', 214, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 215, 'f-supply-srm-performance', '{"en": "SRM & performance"}', '{"en": "SRM & performance related skills"}', 215, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 27, 216, 'f-supply-sustainable-procurement', '{"en": "Sustainable procurement"}', '{"en": "Sustainable procurement related skills"}', 216, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 217, 'f-qaqc-inspection-planning-aql', '{"en": "Inspection planning (AQL)"}', '{"en": "Inspection planning (AQL) related skills"}', 217, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 218, 'f-qaqc-control-plans-spc', '{"en": "Control plans & SPC"}', '{"en": "Control plans & SPC related skills"}', 218, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 219, 'f-qaqc-nonconformance-ncrs', '{"en": "Nonconformance & NCRs"}', '{"en": "Nonconformance & NCRs related skills"}', 219, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 220, 'f-qaqc-capa-workflows', '{"en": "CAPA workflows"}', '{"en": "CAPA workflows related skills"}', 220, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 221, 'f-qaqc-root-cause-analysis', '{"en": "Root cause analysis"}', '{"en": "Root cause analysis related skills"}', 221, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 222, 'f-qaqc-gage-r-r-msa', '{"en": "Gage R&R & MSA"}', '{"en": "Gage R&R & MSA related skills"}', 222, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 223, 'f-qaqc-audit-readiness', '{"en": "Audit readiness"}', '{"en": "Audit readiness related skills"}', 223, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 28, 224, 'f-qaqc-documentation-traceability', '{"en": "Documentation & traceability"}', '{"en": "Documentation & traceability related skills"}', 224, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 225, 'f-mfg-line-balancing-oee', '{"en": "Line balancing & OEE"}', '{"en": "Line balancing & OEE related skills"}', 225, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 226, 'f-mfg-setup-changeover-smed', '{"en": "Setup & changeover (SMED)"}', '{"en": "Setup & changeover (SMED) related skills"}', 226, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 227, 'f-mfg-process-capability-cp-cpk', '{"en": "Process capability (Cp/Cpk)"}', '{"en": "Process capability (Cp/Cpk) related skills"}', 227, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 228, 'f-mfg-work-instructions', '{"en": "Work instructions"}', '{"en": "Work instructions related skills"}', 228, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 229, 'f-mfg-visual-controls-andon', '{"en": "Visual controls & ANDON"}', '{"en": "Visual controls & ANDON related skills"}', 229, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 230, 'f-mfg-scrap-rework-reduction', '{"en": "Scrap & rework reduction"}', '{"en": "Scrap & rework reduction related skills"}', 230, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 231, 'f-mfg-kanban-pull', '{"en": "Kanban & pull"}', '{"en": "Kanban & pull related skills"}', 231, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 29, 232, 'f-mfg-safety-at-the-line', '{"en": "Safety at the line"}', '{"en": "Safety at the line related skills"}', 232, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 233, 'f-maint-preventive-maintenance', '{"en": "Preventive maintenance"}', '{"en": "Preventive maintenance related skills"}', 233, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 234, 'f-maint-predictive-monitoring-pdm', '{"en": "Predictive monitoring (PdM)"}', '{"en": "Predictive monitoring (PdM) related skills"}', 234, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 235, 'f-maint-cmms-work-orders', '{"en": "CMMS & work orders"}', '{"en": "CMMS & work orders related skills"}', 235, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 236, 'f-maint-reliability-centered-maintenance', '{"en": "Reliability-centered maintenance"}', '{"en": "Reliability-centered maintenance related skills"}', 236, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 237, 'f-maint-spares-mro', '{"en": "Spares & MRO"}', '{"en": "Spares & MRO related skills"}', 237, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 238, 'f-maint-failure-analysis', '{"en": "Failure analysis"}', '{"en": "Failure analysis related skills"}', 238, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 239, 'f-maint-lubrication-alignment', '{"en": "Lubrication & alignment"}', '{"en": "Lubrication & alignment related skills"}', 239, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 30, 240, 'f-maint-shutdown-turnaround', '{"en": "Shutdown & turnaround"}', '{"en": "Shutdown & turnaround related skills"}', 240, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 241, 'f-const-site-logistics-permits', '{"en": "Site logistics & permits"}', '{"en": "Site logistics & permits related skills"}', 241, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 242, 'f-const-reading-plans-specs', '{"en": "Reading plans & specs"}', '{"en": "Reading plans & specs related skills"}', 242, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 243, 'f-const-structural-framing', '{"en": "Structural framing"}', '{"en": "Structural framing related skills"}', 243, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 244, 'f-const-mep-coordination', '{"en": "MEP coordination"}', '{"en": "MEP coordination related skills"}', 244, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 245, 'f-const-safety-management', '{"en": "Safety management"}', '{"en": "Safety management related skills"}', 245, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 246, 'f-const-subcontractor-oversight', '{"en": "Subcontractor oversight"}', '{"en": "Subcontractor oversight related skills"}', 246, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 247, 'f-const-schedule-progress', '{"en": "Schedule & progress"}', '{"en": "Schedule & progress related skills"}', 247, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 31, 248, 'f-const-qa-qc-punch-lists', '{"en": "QA/QC & punch lists"}', '{"en": "QA/QC & punch lists related skills"}', 248, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 249, 'f-trades-welding-processes-wps', '{"en": "Welding processes & WPS"}', '{"en": "Welding processes & WPS related skills"}', 249, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 250, 'f-trades-electrical-installation-codes', '{"en": "Electrical installation & codes"}', '{"en": "Electrical installation & codes related skills"}', 250, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 251, 'f-trades-plumbing-piping-systems', '{"en": "Plumbing & piping systems"}', '{"en": "Plumbing & piping systems related skills"}', 251, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 252, 'f-trades-carpentry-finishes', '{"en": "Carpentry & finishes"}', '{"en": "Carpentry & finishes related skills"}', 252, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 253, 'f-trades-hvac-install-service', '{"en": "HVAC install & service"}', '{"en": "HVAC install & service related skills"}', 253, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 254, 'f-trades-sheet-metal-fabrication', '{"en": "Sheet metal & fabrication"}', '{"en": "Sheet metal & fabrication related skills"}', 254, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 255, 'f-trades-rigging-lifting', '{"en": "Rigging & lifting"}', '{"en": "Rigging & lifting related skills"}', 255, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 32, 256, 'f-trades-ndt-inspection', '{"en": "NDT & inspection"}', '{"en": "NDT & inspection related skills"}', 256, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 257, 'f-agri-soil-prep-fertility', '{"en": "Soil prep & fertility"}', '{"en": "Soil prep & fertility related skills"}', 257, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 258, 'f-agri-planting-irrigation', '{"en": "Planting & irrigation"}', '{"en": "Planting & irrigation related skills"}', 258, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 259, 'f-agri-crop-protection-ipm', '{"en": "Crop protection & IPM"}', '{"en": "Crop protection & IPM related skills"}', 259, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 260, 'f-agri-harvest-post-harvest', '{"en": "Harvest & post-harvest"}', '{"en": "Harvest & post-harvest related skills"}', 260, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 261, 'f-agri-greenhouse-ops', '{"en": "Greenhouse ops"}', '{"en": "Greenhouse ops related skills"}', 261, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 262, 'f-agri-equipment-use-maintenance', '{"en": "Equipment use & maintenance"}', '{"en": "Equipment use & maintenance related skills"}', 262, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 263, 'f-agri-forestry-chainsaw-safety', '{"en": "Forestry & chainsaw safety"}', '{"en": "Forestry & chainsaw safety related skills"}', 263, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 33, 264, 'f-agri-farm-records-compliance', '{"en": "Farm records & compliance"}', '{"en": "Farm records & compliance related skills"}', 264, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 265, 'f-food-mise-en-place-prep', '{"en": "Mise en place & prep"}', '{"en": "Mise en place & prep related skills"}', 265, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 266, 'f-food-cooking-methods-timing', '{"en": "Cooking methods & timing"}', '{"en": "Cooking methods & timing related skills"}', 266, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 267, 'f-food-baking-pastry-techniques', '{"en": "Baking & pastry techniques"}', '{"en": "Baking & pastry techniques related skills"}', 267, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 268, 'f-food-food-safety-haccp', '{"en": "Food safety (HACCP)"}', '{"en": "Food safety (HACCP) related skills"}', 268, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 269, 'f-food-plating-presentation', '{"en": "Plating & presentation"}', '{"en": "Plating & presentation related skills"}', 269, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 270, 'f-food-menu-costing', '{"en": "Menu & costing"}', '{"en": "Menu & costing related skills"}', 270, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 271, 'f-food-inventory-waste', '{"en": "Inventory & waste"}', '{"en": "Inventory & waste related skills"}', 271, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 34, 272, 'f-food-kitchen-equipment-care', '{"en": "Kitchen equipment care"}', '{"en": "Kitchen equipment care related skills"}', 272, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 273, 'f-retail-planograms-merchandising', '{"en": "Planograms & merchandising"}', '{"en": "Planograms & merchandising related skills"}', 273, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 274, 'f-retail-pos-cash-handling', '{"en": "POS & cash handling"}', '{"en": "POS & cash handling related skills"}', 274, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 275, 'f-retail-inventory-processes', '{"en": "Inventory processes"}', '{"en": "Inventory processes related skills"}', 275, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 276, 'f-retail-customer-service', '{"en": "Customer service"}', '{"en": "Customer service related skills"}', 276, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 277, 'f-retail-loss-prevention-shrink', '{"en": "Loss prevention & shrink"}', '{"en": "Loss prevention & shrink related skills"}', 277, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 278, 'f-retail-visual-displays', '{"en": "Visual displays"}', '{"en": "Visual displays related skills"}', 278, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 279, 'f-retail-omnichannel-operations', '{"en": "Omnichannel operations"}', '{"en": "Omnichannel operations related skills"}', 279, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 35, 280, 'f-retail-store-kpis-labor', '{"en": "Store KPIs & labor"}', '{"en": "Store KPIs & labor related skills"}', 280, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 281, 'f-hosp-front-of-house-service', '{"en": "Front-of-house service"}', '{"en": "Front-of-house service related skills"}', 281, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 282, 'f-hosp-housekeeping-standards', '{"en": "Housekeeping standards"}', '{"en": "Housekeeping standards related skills"}', 282, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 283, 'f-hosp-event-planning-runsheet', '{"en": "Event planning & runsheet"}', '{"en": "Event planning & runsheet related skills"}', 283, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 284, 'f-hosp-venue-ops-logistics', '{"en": "Venue ops & logistics"}', '{"en": "Venue ops & logistics related skills"}', 284, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 285, 'f-hosp-guest-experience-recovery', '{"en": "Guest experience & recovery"}', '{"en": "Guest experience & recovery related skills"}', 285, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 286, 'f-hosp-reservations-yield', '{"en": "Reservations & yield"}', '{"en": "Reservations & yield related skills"}', 286, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 287, 'f-hosp-vendor-coordination', '{"en": "Vendor coordination"}', '{"en": "Vendor coordination related skills"}', 287, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 36, 288, 'f-hosp-h-s-compliance', '{"en": "H&S compliance"}', '{"en": "H&S compliance related skills"}', 288, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 289, 'f-csrvc-triage-prioritization', '{"en": "Triage & prioritization"}', '{"en": "Triage & prioritization related skills"}', 289, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 290, 'f-csrvc-knowledge-base-usage', '{"en": "Knowledge base usage"}', '{"en": "Knowledge base usage related skills"}', 290, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 291, 'f-csrvc-ticket-lifecycle-slas', '{"en": "Ticket lifecycle & SLAs"}', '{"en": "Ticket lifecycle & SLAs related skills"}', 291, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 292, 'f-csrvc-escalation-management', '{"en": "Escalation management"}', '{"en": "Escalation management related skills"}', 292, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 293, 'f-csrvc-empathy-de-escalation', '{"en": "Empathy & de-escalation"}', '{"en": "Empathy & de-escalation related skills"}', 293, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 294, 'f-csrvc-qa-scorecards-coaching', '{"en": "QA scorecards & coaching"}', '{"en": "QA scorecards & coaching related skills"}', 294, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 295, 'f-csrvc-workforce-management', '{"en": "Workforce management"}', '{"en": "Workforce management related skills"}', 295, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 37, 296, 'f-csrvc-omnichannel-tooling', '{"en": "Omnichannel tooling"}', '{"en": "Omnichannel tooling related skills"}', 296, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 297, 'f-sales-icp-prospecting', '{"en": "ICP & prospecting"}', '{"en": "ICP & prospecting related skills"}', 297, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 298, 'f-sales-discovery-qualification', '{"en": "Discovery & qualification"}', '{"en": "Discovery & qualification related skills"}', 298, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 299, 'f-sales-demos-value-narrative', '{"en": "Demos & value narrative"}', '{"en": "Demos & value narrative related skills"}', 299, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 300, 'f-sales-proposal-pricing', '{"en": "Proposal & pricing"}', '{"en": "Proposal & pricing related skills"}', 300, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 301, 'f-sales-negotiation-closing', '{"en": "Negotiation & closing"}', '{"en": "Negotiation & closing related skills"}', 301, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 302, 'f-sales-pipeline-management', '{"en": "Pipeline management"}', '{"en": "Pipeline management related skills"}', 302, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 303, 'f-sales-account-expansion', '{"en": "Account expansion"}', '{"en": "Account expansion related skills"}', 303, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 38, 304, 'f-sales-sales-operations-tooling', '{"en": "Sales operations & tooling"}', '{"en": "Sales operations & tooling related skills"}', 304, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 305, 'f-mktg-audience-positioning', '{"en": "Audience & positioning"}', '{"en": "Audience & positioning related skills"}', 305, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 306, 'f-mktg-content-editorial', '{"en": "Content & editorial"}', '{"en": "Content & editorial related skills"}', 306, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 307, 'f-mktg-seo-sem-paid-media', '{"en": "SEO/SEM & paid media"}', '{"en": "SEO/SEM & paid media related skills"}', 307, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 308, 'f-mktg-social-community', '{"en": "Social & community"}', '{"en": "Social & community related skills"}', 308, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 309, 'f-mktg-email-lifecycle', '{"en": "Email & lifecycle"}', '{"en": "Email & lifecycle related skills"}', 309, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 310, 'f-mktg-pr-comms', '{"en": "PR & comms"}', '{"en": "PR & comms related skills"}', 310, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 311, 'f-mktg-analytics-attribution', '{"en": "Analytics & attribution"}', '{"en": "Analytics & attribution related skills"}', 311, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 39, 312, 'f-mktg-brand-creative-ops', '{"en": "Brand & creative ops"}', '{"en": "Brand & creative ops related skills"}', 312, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 313, 'f-prod-opportunity-assessment', '{"en": "Opportunity assessment"}', '{"en": "Opportunity assessment related skills"}', 313, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 314, 'f-prod-discovery-research', '{"en": "Discovery & research"}', '{"en": "Discovery & research related skills"}', 314, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 315, 'f-prod-prioritization-frameworks', '{"en": "Prioritization frameworks"}', '{"en": "Prioritization frameworks related skills"}', 315, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 316, 'f-prod-roadmapping-okrs', '{"en": "Roadmapping & OKRs"}', '{"en": "Roadmapping & OKRs related skills"}', 316, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 317, 'f-prod-requirements-acceptance', '{"en": "Requirements & acceptance"}', '{"en": "Requirements & acceptance related skills"}', 317, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 318, 'f-prod-go-to-market-launch', '{"en": "Go-to-market & launch"}', '{"en": "Go-to-market & launch related skills"}', 318, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 319, 'f-prod-experimentation-learning', '{"en": "Experimentation & learning"}', '{"en": "Experimentation & learning related skills"}', 319, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 40, 320, 'f-prod-stakeholder-comms', '{"en": "Stakeholder comms"}', '{"en": "Stakeholder comms related skills"}', 320, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 321, 'f-pm-scope-wbs', '{"en": "Scope & WBS"}', '{"en": "Scope & WBS related skills"}', 321, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 322, 'f-pm-scheduling-critical-path', '{"en": "Scheduling & critical path"}', '{"en": "Scheduling & critical path related skills"}', 322, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 323, 'f-pm-cost-earned-value', '{"en": "Cost & earned value"}', '{"en": "Cost & earned value related skills"}', 323, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 324, 'f-pm-risk-issues', '{"en": "Risk & issues"}', '{"en": "Risk & issues related skills"}', 324, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 325, 'f-pm-change-control', '{"en": "Change control"}', '{"en": "Change control related skills"}', 325, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 326, 'f-pm-resource-dependency-mgmt', '{"en": "Resource & dependency mgmt"}', '{"en": "Resource & dependency mgmt related skills"}', 326, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 327, 'f-pm-governance-comms', '{"en": "Governance & comms"}', '{"en": "Governance & comms related skills"}', 327, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 41, 328, 'f-pm-benefits-realization', '{"en": "Benefits realization"}', '{"en": "Benefits realization related skills"}', 328, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 329, 'f-strat-market-sizing-dynamics', '{"en": "Market sizing & dynamics"}', '{"en": "Market sizing & dynamics related skills"}', 329, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 330, 'f-strat-competitive-analysis', '{"en": "Competitive analysis"}', '{"en": "Competitive analysis related skills"}', 330, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 331, 'f-strat-business-case-npv', '{"en": "Business case & NPV"}', '{"en": "Business case & NPV related skills"}', 331, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 332, 'f-strat-portfolio-capital-allocation', '{"en": "Portfolio & capital allocation"}', '{"en": "Portfolio & capital allocation related skills"}', 332, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 333, 'f-strat-m-a-screening-diligence', '{"en": "M&A screening & diligence"}', '{"en": "M&A screening & diligence related skills"}', 333, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 334, 'f-strat-strategic-partnerships', '{"en": "Strategic partnerships"}', '{"en": "Strategic partnerships related skills"}', 334, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 335, 'f-strat-okr-strategy-cadence', '{"en": "OKR & strategy cadence"}', '{"en": "OKR & strategy cadence related skills"}', 335, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 42, 336, 'f-strat-post-merger-integration', '{"en": "Post-merger integration"}', '{"en": "Post-merger integration related skills"}', 336, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 337, 'f-fin-budgeting-forecasting', '{"en": "Budgeting & forecasting"}', '{"en": "Budgeting & forecasting related skills"}', 337, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 338, 'f-fin-management-reporting', '{"en": "Management reporting"}', '{"en": "Management reporting related skills"}', 338, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 339, 'f-fin-financial-statements-close', '{"en": "Financial statements & close"}', '{"en": "Financial statements & close related skills"}', 339, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 340, 'f-fin-controls-compliance', '{"en": "Controls & compliance"}', '{"en": "Controls & compliance related skills"}', 340, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 341, 'f-fin-treasury-cash', '{"en": "Treasury & cash"}', '{"en": "Treasury & cash related skills"}', 341, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 342, 'f-fin-tax-audit-support', '{"en": "Tax & audit support"}', '{"en": "Tax & audit support related skills"}', 342, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 343, 'f-fin-costing-margins', '{"en": "Costing & margins"}', '{"en": "Costing & margins related skills"}', 343, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 43, 344, 'f-fin-investment-appraisal', '{"en": "Investment appraisal"}', '{"en": "Investment appraisal related skills"}', 344, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 345, 'f-legal-contract-drafting-review', '{"en": "Contract drafting & review"}', '{"en": "Contract drafting & review related skills"}', 345, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 346, 'f-legal-legal-research-memos', '{"en": "Legal research & memos"}', '{"en": "Legal research & memos related skills"}', 346, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 347, 'f-legal-regulatory-analysis', '{"en": "Regulatory analysis"}', '{"en": "Regulatory analysis related skills"}', 347, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 348, 'f-legal-compliance-programs', '{"en": "Compliance programs"}', '{"en": "Compliance programs related skills"}', 348, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 349, 'f-legal-ip-licensing', '{"en": "IP & licensing"}', '{"en": "IP & licensing related skills"}', 349, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 350, 'f-legal-dispute-management', '{"en": "Dispute management"}', '{"en": "Dispute management related skills"}', 350, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 351, 'f-legal-board-governance', '{"en": "Board & governance"}', '{"en": "Board & governance related skills"}', 351, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 44, 352, 'f-legal-policy-training', '{"en": "Policy & training"}', '{"en": "Policy & training related skills"}', 352, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 353, 'f-hr-workforce-planning', '{"en": "Workforce planning"}', '{"en": "Workforce planning related skills"}', 353, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 354, 'f-hr-talent-acquisition', '{"en": "Talent acquisition"}', '{"en": "Talent acquisition related skills"}', 354, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 355, 'f-hr-onboarding-probation', '{"en": "Onboarding & probation"}', '{"en": "Onboarding & probation related skills"}', 355, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 356, 'f-hr-performance-feedback', '{"en": "Performance & feedback"}', '{"en": "Performance & feedback related skills"}', 356, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 357, 'f-hr-learning-development', '{"en": "Learning & development"}', '{"en": "Learning & development related skills"}', 357, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 358, 'f-hr-compensation-benefits', '{"en": "Compensation & benefits"}', '{"en": "Compensation & benefits related skills"}', 358, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 359, 'f-hr-employee-relations', '{"en": "Employee relations"}', '{"en": "Employee relations related skills"}', 359, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 45, 360, 'f-hr-hris-analytics', '{"en": "HRIS & analytics"}', '{"en": "HRIS & analytics related skills"}', 360, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 361, 'f-edu-curriculum-design', '{"en": "Curriculum design"}', '{"en": "Curriculum design related skills"}', 361, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 362, 'f-edu-lesson-planning', '{"en": "Lesson planning"}', '{"en": "Lesson planning related skills"}', 362, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 363, 'f-edu-facilitation-delivery', '{"en": "Facilitation & delivery"}', '{"en": "Facilitation & delivery related skills"}', 363, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 364, 'f-edu-assessment-rubrics', '{"en": "Assessment & rubrics"}', '{"en": "Assessment & rubrics related skills"}', 364, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 365, 'f-edu-adaptive-learning', '{"en": "Adaptive learning"}', '{"en": "Adaptive learning related skills"}', 365, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 366, 'f-edu-classroom-management', '{"en": "Classroom management"}', '{"en": "Classroom management related skills"}', 366, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 367, 'f-edu-edtech-tooling', '{"en": "EdTech tooling"}', '{"en": "EdTech tooling related skills"}', 367, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 46, 368, 'f-edu-program-evaluation', '{"en": "Program evaluation"}', '{"en": "Program evaluation related skills"}', 368, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 369, 'f-health-assessment-triage', '{"en": "Assessment & triage"}', '{"en": "Assessment & triage related skills"}', 369, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 370, 'f-health-treatment-care-plans', '{"en": "Treatment & care plans"}', '{"en": "Treatment & care plans related skills"}', 370, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 371, 'f-health-infection-prevention-control', '{"en": "Infection prevention & control"}', '{"en": "Infection prevention & control related skills"}', 371, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 372, 'f-health-medication-safety', '{"en": "Medication safety"}', '{"en": "Medication safety related skills"}', 372, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 373, 'f-health-patient-education', '{"en": "Patient education"}', '{"en": "Patient education related skills"}', 373, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 374, 'f-health-documentation-coding', '{"en": "Documentation & coding"}', '{"en": "Documentation & coding related skills"}', 374, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 375, 'f-health-interdisciplinary-coordination', '{"en": "Interdisciplinary coordination"}', '{"en": "Interdisciplinary coordination related skills"}', 375, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 47, 376, 'f-health-quality-audit', '{"en": "Quality & audit"}', '{"en": "Quality & audit related skills"}', 376, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 377, 'f-pub-policy-implementation', '{"en": "Policy implementation"}', '{"en": "Policy implementation related skills"}', 377, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 378, 'f-pub-case-management', '{"en": "Case management"}', '{"en": "Case management related skills"}', 378, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 379, 'f-pub-community-engagement', '{"en": "Community engagement"}', '{"en": "Community engagement related skills"}', 379, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 380, 'f-pub-grants-procurement', '{"en": "Grants & procurement"}', '{"en": "Grants & procurement related skills"}', 380, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 381, 'f-pub-program-evaluation', '{"en": "Program evaluation"}', '{"en": "Program evaluation related skills"}', 381, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 382, 'f-pub-safeguarding-ethics', '{"en": "Safeguarding & ethics"}', '{"en": "Safeguarding & ethics related skills"}', 382, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 383, 'f-pub-interagency-coordination', '{"en": "Interagency coordination"}', '{"en": "Interagency coordination related skills"}', 383, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 48, 384, 'f-pub-public-communications', '{"en": "Public communications"}', '{"en": "Public communications related skills"}', 384, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 385, 'f-env-environmental-monitoring', '{"en": "Environmental monitoring"}', '{"en": "Environmental monitoring related skills"}', 385, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 386, 'f-env-permits-compliance', '{"en": "Permits & compliance"}', '{"en": "Permits & compliance related skills"}', 386, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 387, 'f-env-ehs-training-drills', '{"en": "EHS training & drills"}', '{"en": "EHS training & drills related skills"}', 387, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 388, 'f-env-waste-emissions', '{"en": "Waste & emissions"}', '{"en": "Waste & emissions related skills"}', 388, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 389, 'f-env-audits-inspections', '{"en": "Audits & inspections"}', '{"en": "Audits & inspections related skills"}', 389, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 390, 'f-env-incident-investigation', '{"en": "Incident investigation"}', '{"en": "Incident investigation related skills"}', 390, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 391, 'f-env-sustainability-strategy', '{"en": "Sustainability strategy"}', '{"en": "Sustainability strategy related skills"}', 391, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 49, 392, 'f-env-reporting-disclosure', '{"en": "Reporting & disclosure"}', '{"en": "Reporting & disclosure related skills"}', 392, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 393, 'f-real-leasing-tenant-relations', '{"en": "Leasing & tenant relations"}', '{"en": "Leasing & tenant relations related skills"}', 393, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 394, 'f-real-property-operations', '{"en": "Property operations"}', '{"en": "Property operations related skills"}', 394, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 395, 'f-real-maintenance-energy', '{"en": "Maintenance & energy"}', '{"en": "Maintenance & energy related skills"}', 395, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 396, 'f-real-capital-projects', '{"en": "Capital projects"}', '{"en": "Capital projects related skills"}', 396, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 397, 'f-real-h-s-compliance', '{"en": "H&S compliance"}', '{"en": "H&S compliance related skills"}', 397, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 398, 'f-real-budget-cam', '{"en": "Budget & CAM"}', '{"en": "Budget & CAM related skills"}', 398, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 399, 'f-real-vendor-management', '{"en": "Vendor management"}', '{"en": "Vendor management related skills"}', 399, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 50, 400, 'f-real-moves-space-planning', '{"en": "Moves & space planning"}', '{"en": "Moves & space planning related skills"}', 400, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 401, 'f-sec-access-control-patrols', '{"en": "Access control & patrols"}', '{"en": "Access control & patrols related skills"}', 401, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 402, 'f-sec-risk-threat-assessments', '{"en": "Risk & threat assessments"}', '{"en": "Risk & threat assessments related skills"}', 402, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 403, 'f-sec-incident-response', '{"en": "Incident response"}', '{"en": "Incident response related skills"}', 403, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 404, 'f-sec-investigations-reports', '{"en": "Investigations & reports"}', '{"en": "Investigations & reports related skills"}', 404, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 405, 'f-sec-emergency-planning', '{"en": "Emergency planning"}', '{"en": "Emergency planning related skills"}', 405, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 406, 'f-sec-bcp-crisis-mgmt', '{"en": "BCP & crisis mgmt"}', '{"en": "BCP & crisis mgmt related skills"}', 406, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 407, 'f-sec-physical-security-systems', '{"en": "Physical security systems"}', '{"en": "Physical security systems related skills"}', 407, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 51, 408, 'f-sec-liaison-with-authorities', '{"en": "Liaison with authorities"}', '{"en": "Liaison with authorities related skills"}', 408, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 409, 'f-creative-concepting-briefs', '{"en": "Concepting & briefs"}', '{"en": "Concepting & briefs related skills"}', 409, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 410, 'f-creative-copywriting-editing', '{"en": "Copywriting & editing"}', '{"en": "Copywriting & editing related skills"}', 410, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 411, 'f-creative-photography-video', '{"en": "Photography & video"}', '{"en": "Photography & video related skills"}', 411, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 412, 'f-creative-design-layout', '{"en": "Design & layout"}', '{"en": "Design & layout related skills"}', 412, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 413, 'f-creative-editorial-workflow', '{"en": "Editorial workflow"}', '{"en": "Editorial workflow related skills"}', 413, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 414, 'f-creative-rights-releases', '{"en": "Rights & releases"}', '{"en": "Rights & releases related skills"}', 414, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 415, 'f-creative-publishing-distribution', '{"en": "Publishing & distribution"}', '{"en": "Publishing & distribution related skills"}', 415, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 52, 416, 'f-creative-analytics-feedback', '{"en": "Analytics & feedback"}', '{"en": "Analytics & feedback related skills"}', 416, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 417, 'f-sport-program-design', '{"en": "Program design"}', '{"en": "Program design related skills"}', 417, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 418, 'f-sport-coaching-cueing', '{"en": "Coaching & cueing"}', '{"en": "Coaching & cueing related skills"}', 418, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 419, 'f-sport-strength-conditioning', '{"en": "Strength & conditioning"}', '{"en": "Strength & conditioning related skills"}', 419, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 420, 'f-sport-injury-prevention', '{"en": "Injury prevention"}', '{"en": "Injury prevention related skills"}', 420, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 421, 'f-sport-nutrition-basics', '{"en": "Nutrition basics"}', '{"en": "Nutrition basics related skills"}', 421, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 422, 'f-sport-member-services', '{"en": "Member services"}', '{"en": "Member services related skills"}', 422, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 423, 'f-sport-facility-operations', '{"en": "Facility operations"}', '{"en": "Facility operations related skills"}', 423, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 53, 424, 'f-sport-competition-logistics', '{"en": "Competition logistics"}', '{"en": "Competition logistics related skills"}', 424, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 425, 'f-research-literature-review', '{"en": "Literature review"}', '{"en": "Literature review related skills"}', 425, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 426, 'f-research-research-design', '{"en": "Research design"}', '{"en": "Research design related skills"}', 426, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 427, 'f-research-data-collection', '{"en": "Data collection"}', '{"en": "Data collection related skills"}', 427, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 428, 'f-research-statistical-analysis', '{"en": "Statistical analysis"}', '{"en": "Statistical analysis related skills"}', 428, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 429, 'f-research-qualitative-analysis', '{"en": "Qualitative analysis"}', '{"en": "Qualitative analysis related skills"}', 429, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 430, 'f-research-visualization-reporting', '{"en": "Visualization & reporting"}', '{"en": "Visualization & reporting related skills"}', 430, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 431, 'f-research-ethics-irb', '{"en": "Ethics & IRB"}', '{"en": "Ethics & IRB related skills"}', 431, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 54, 432, 'f-research-replication-prereg', '{"en": "Replication & prereg"}', '{"en": "Replication & prereg related skills"}', 432, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 433, 'f-it-requirements-design', '{"en": "Requirements & design"}', '{"en": "Requirements & design related skills"}', 433, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 434, 'f-it-system-architecture', '{"en": "System architecture"}', '{"en": "System architecture related skills"}', 434, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 435, 'f-it-implementation-code-quality', '{"en": "Implementation & code quality"}', '{"en": "Implementation & code quality related skills"}', 435, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 436, 'f-it-testing-unit-integration-e2e', '{"en": "Testing (unit/integration/e2e)"}', '{"en": "Testing (unit/integration/e2e) related skills"}', 436, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 437, 'f-it-code-review-standards', '{"en": "Code review & standards"}', '{"en": "Code review & standards related skills"}', 437, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 438, 'f-it-performance-profiling', '{"en": "Performance & profiling"}', '{"en": "Performance & profiling related skills"}', 438, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 439, 'f-it-security-dependencies', '{"en": "Security & dependencies"}', '{"en": "Security & dependencies related skills"}', 439, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 55, 440, 'f-it-documentation-handover', '{"en": "Documentation & handover"}', '{"en": "Documentation & handover related skills"}', 440, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 441, 'f-data-data-modeling-governance', '{"en": "Data modeling & governance"}', '{"en": "Data modeling & governance related skills"}', 441, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 442, 'f-data-ingestion-pipelines', '{"en": "Ingestion & pipelines"}', '{"en": "Ingestion & pipelines related skills"}', 442, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 443, 'f-data-warehousing-lakehouse', '{"en": "Warehousing & lakehouse"}', '{"en": "Warehousing & lakehouse related skills"}', 443, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 444, 'f-data-bi-semantic-layers', '{"en": "BI & semantic layers"}', '{"en": "BI & semantic layers related skills"}', 444, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 445, 'f-data-visualization-dashboards', '{"en": "Visualization & dashboards"}', '{"en": "Visualization & dashboards related skills"}', 445, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 446, 'f-data-experimentation-a-b', '{"en": "Experimentation & A/B"}', '{"en": "Experimentation & A/B related skills"}', 446, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 447, 'f-data-forecasting-ml-basics', '{"en": "Forecasting & ML basics"}', '{"en": "Forecasting & ML basics related skills"}', 447, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 56, 448, 'f-data-data-reliability-slas', '{"en": "Data reliability & SLAs"}', '{"en": "Data reliability & SLAs related skills"}', 448, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 449, 'f-aiml-problem-framing-data-readiness', '{"en": "Problem framing & data readiness"}', '{"en": "Problem framing & data readiness related skills"}', 449, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 450, 'f-aiml-feature-engineering', '{"en": "Feature engineering"}', '{"en": "Feature engineering related skills"}', 450, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 451, 'f-aiml-model-training-tuning', '{"en": "Model training & tuning"}', '{"en": "Model training & tuning related skills"}', 451, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 452, 'f-aiml-evaluation-robustness', '{"en": "Evaluation & robustness"}', '{"en": "Evaluation & robustness related skills"}', 452, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 453, 'f-aiml-responsible-ai-bias', '{"en": "Responsible AI & bias"}', '{"en": "Responsible AI & bias related skills"}', 453, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 454, 'f-aiml-deployment-serving', '{"en": "Deployment & serving"}', '{"en": "Deployment & serving related skills"}', 454, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 455, 'f-aiml-monitoring-drift', '{"en": "Monitoring & drift"}', '{"en": "Monitoring & drift related skills"}', 455, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 57, 456, 'f-aiml-documentation-cards', '{"en": "Documentation & cards"}', '{"en": "Documentation & cards related skills"}', 456, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 457, 'f-cyber-threat-modeling-risk', '{"en": "Threat modeling & risk"}', '{"en": "Threat modeling & risk related skills"}', 457, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 458, 'f-cyber-identity-auth-access', '{"en": "Identity, auth & access"}', '{"en": "Identity, auth & access related skills"}', 458, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 459, 'f-cyber-vulnerability-mgmt', '{"en": "Vulnerability mgmt"}', '{"en": "Vulnerability mgmt related skills"}', 459, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 460, 'f-cyber-application-security', '{"en": "Application security"}', '{"en": "Application security related skills"}', 460, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 461, 'f-cyber-detection-response-soc', '{"en": "Detection & response (SOC)"}', '{"en": "Detection & response (SOC) related skills"}', 461, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 462, 'f-cyber-governance-risk-compliance', '{"en": "Governance, risk & compliance"}', '{"en": "Governance, risk & compliance related skills"}', 462, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 463, 'f-cyber-security-architecture', '{"en": "Security architecture"}', '{"en": "Security architecture related skills"}', 463, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 58, 464, 'f-cyber-awareness-training', '{"en": "Awareness & training"}', '{"en": "Awareness & training related skills"}', 464, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 465, 'f-cloud-iac-provisioning', '{"en": "IaC & provisioning"}', '{"en": "IaC & provisioning related skills"}', 465, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 466, 'f-cloud-ci-cd-release', '{"en": "CI/CD & release"}', '{"en": "CI/CD & release related skills"}', 466, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 467, 'f-cloud-observability-slos', '{"en": "Observability & SLOs"}', '{"en": "Observability & SLOs related skills"}', 467, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 468, 'f-cloud-reliability-engineering', '{"en": "Reliability engineering"}', '{"en": "Reliability engineering related skills"}', 468, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 469, 'f-cloud-cost-management-finops', '{"en": "Cost management & FinOps"}', '{"en": "Cost management & FinOps related skills"}', 469, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 470, 'f-cloud-runbooks-incident-mgmt', '{"en": "Runbooks & incident mgmt"}', '{"en": "Runbooks & incident mgmt related skills"}', 470, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 471, 'f-cloud-platform-engineering', '{"en": "Platform engineering"}', '{"en": "Platform engineering related skills"}', 471, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 59, 472, 'f-cloud-multi-cloud-networking', '{"en": "Multi-cloud & networking"}', '{"en": "Multi-cloud & networking related skills"}', 472, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 473, 'f-hw-schematic-pcb', '{"en": "Schematic & PCB"}', '{"en": "Schematic & PCB related skills"}', 473, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 474, 'f-hw-firmware-rtos', '{"en": "Firmware & RTOS"}', '{"en": "Firmware & RTOS related skills"}', 474, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 475, 'f-hw-prototyping-bring-up', '{"en": "Prototyping & bring-up"}', '{"en": "Prototyping & bring-up related skills"}', 475, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 476, 'f-hw-emc-emi-compliance', '{"en": "EMC/EMI & compliance"}', '{"en": "EMC/EMI & compliance related skills"}', 476, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 477, 'f-hw-dfm-dft', '{"en": "DFM & DFT"}', '{"en": "DFM & DFT related skills"}', 477, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 478, 'f-hw-test-fixtures-validation', '{"en": "Test fixtures & validation"}', '{"en": "Test fixtures & validation related skills"}', 478, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 479, 'f-hw-sensors-signal', '{"en": "Sensors & signal"}', '{"en": "Sensors & signal related skills"}', 479, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 60, 480, 'f-hw-power-thermal', '{"en": "Power & thermal"}', '{"en": "Power & thermal related skills"}', 480, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 481, 'f-net-routing-switching', '{"en": "Routing & switching"}', '{"en": "Routing & switching related skills"}', 481, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 482, 'f-net-wireless-site-surveys', '{"en": "Wireless & site surveys"}', '{"en": "Wireless & site surveys related skills"}', 482, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 483, 'f-net-network-security', '{"en": "Network security"}', '{"en": "Network security related skills"}', 483, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 484, 'f-net-qos-performance', '{"en": "QoS & performance"}', '{"en": "QoS & performance related skills"}', 484, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 485, 'f-net-sdn-automation', '{"en": "SDN & automation"}', '{"en": "SDN & automation related skills"}', 485, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 486, 'f-net-voice-collaboration', '{"en": "Voice & collaboration"}', '{"en": "Voice & collaboration related skills"}', 486, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 487, 'f-net-monitoring-noc', '{"en": "Monitoring & NOC"}', '{"en": "Monitoring & NOC related skills"}', 487, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 61, 488, 'f-net-documentation-diagrams', '{"en": "Documentation & diagrams"}', '{"en": "Documentation & diagrams related skills"}', 488, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 489, 'f-ux-research-insights', '{"en": "Research & insights"}', '{"en": "Research & insights related skills"}', 489, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 490, 'f-ux-information-architecture', '{"en": "Information architecture"}', '{"en": "Information architecture related skills"}', 490, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 491, 'f-ux-interaction-design', '{"en": "Interaction design"}', '{"en": "Interaction design related skills"}', 491, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 492, 'f-ux-visual-design-systems', '{"en": "Visual design & systems"}', '{"en": "Visual design & systems related skills"}', 492, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 493, 'f-ux-prototyping-handoff', '{"en": "Prototyping & handoff"}', '{"en": "Prototyping & handoff related skills"}', 493, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 494, 'f-ux-accessibility-inclusivity', '{"en": "Accessibility & inclusivity"}', '{"en": "Accessibility & inclusivity related skills"}', 494, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 495, 'f-ux-usability-testing', '{"en": "Usability testing"}', '{"en": "Usability testing related skills"}', 495, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 62, 496, 'f-ux-content-design', '{"en": "Content design"}', '{"en": "Content design related skills"}', 496, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 497, 'f-arch-concept-schematic-design', '{"en": "Concept & schematic design"}', '{"en": "Concept & schematic design related skills"}', 497, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 498, 'f-arch-codes-documentation', '{"en": "Codes & documentation"}', '{"en": "Codes & documentation related skills"}', 498, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 499, 'f-arch-bim-coordination', '{"en": "BIM & coordination"}', '{"en": "BIM & coordination related skills"}', 499, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 500, 'f-arch-sustainability-integration', '{"en": "Sustainability integration"}', '{"en": "Sustainability integration related skills"}', 500, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 501, 'f-arch-construction-admin', '{"en": "Construction admin"}', '{"en": "Construction admin related skills"}', 501, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 502, 'f-arch-site-master-planning', '{"en": "Site & master planning"}', '{"en": "Site & master planning related skills"}', 502, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 503, 'f-arch-heritage-conservation', '{"en": "Heritage & conservation"}', '{"en": "Heritage & conservation related skills"}', 503, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 63, 504, 'f-arch-post-occupancy-evaluation', '{"en": "Post-occupancy evaluation"}', '{"en": "Post-occupancy evaluation related skills"}', 504, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 505, 'f-energy-generation-t-d', '{"en": "Generation & T&D"}', '{"en": "Generation & T&D related skills"}', 505, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 506, 'f-energy-grid-operations-markets', '{"en": "Grid operations & markets"}', '{"en": "Grid operations & markets related skills"}', 506, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 507, 'f-energy-asset-management', '{"en": "Asset management"}', '{"en": "Asset management related skills"}', 507, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 508, 'f-energy-renewables-integration', '{"en": "Renewables integration"}', '{"en": "Renewables integration related skills"}', 508, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 509, 'f-energy-protection-relays', '{"en": "Protection & relays"}', '{"en": "Protection & relays related skills"}', 509, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 510, 'f-energy-demand-response', '{"en": "Demand response"}', '{"en": "Demand response related skills"}', 510, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 511, 'f-energy-regulatory-compliance', '{"en": "Regulatory compliance"}', '{"en": "Regulatory compliance related skills"}', 511, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 64, 512, 'f-energy-safety-switching', '{"en": "Safety & switching"}', '{"en": "Safety & switching related skills"}', 512, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 513, 'f-trans-fleet-ops-scheduling', '{"en": "Fleet ops & scheduling"}', '{"en": "Fleet ops & scheduling related skills"}', 513, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 514, 'f-trans-maintenance-inspections', '{"en": "Maintenance & inspections"}', '{"en": "Maintenance & inspections related skills"}', 514, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 515, 'f-trans-safety-compliance', '{"en": "Safety & compliance"}', '{"en": "Safety & compliance related skills"}', 515, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 516, 'f-trans-dispatch-routing', '{"en": "Dispatch & routing"}', '{"en": "Dispatch & routing related skills"}', 516, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 517, 'f-trans-telematics-data', '{"en": "Telematics & data"}', '{"en": "Telematics & data related skills"}', 517, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 518, 'f-trans-customer-service', '{"en": "Customer service"}', '{"en": "Customer service related skills"}', 518, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 519, 'f-trans-terminal-yard-ops', '{"en": "Terminal & yard ops"}', '{"en": "Terminal & yard ops related skills"}', 519, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 65, 520, 'f-trans-incident-investigation', '{"en": "Incident investigation"}', '{"en": "Incident investigation related skills"}', 520, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 521, 'f-mar-navigation-colregs', '{"en": "Navigation & COLREGS"}', '{"en": "Navigation & COLREGS related skills"}', 521, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 522, 'f-mar-cargo-ops-stowage', '{"en": "Cargo ops & stowage"}', '{"en": "Cargo ops & stowage related skills"}', 522, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 523, 'f-mar-engine-platform-ops', '{"en": "Engine & platform ops"}', '{"en": "Engine & platform ops related skills"}', 523, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 524, 'f-mar-safety-emergency', '{"en": "Safety & emergency"}', '{"en": "Safety & emergency related skills"}', 524, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 525, 'f-mar-regulatory-port-state', '{"en": "Regulatory & port state"}', '{"en": "Regulatory & port state related skills"}', 525, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 526, 'f-mar-maintenance-dry-dock', '{"en": "Maintenance & dry dock"}', '{"en": "Maintenance & dry dock related skills"}', 526, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 527, 'f-mar-weather-routing', '{"en": "Weather & routing"}', '{"en": "Weather & routing related skills"}', 527, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 66, 528, 'f-mar-crew-management', '{"en": "Crew management"}', '{"en": "Crew management related skills"}', 528, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 529, 'f-aero-flight-ops-dispatch', '{"en": "Flight ops & dispatch"}', '{"en": "Flight ops & dispatch related skills"}', 529, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 530, 'f-aero-ground-handling', '{"en": "Ground handling"}', '{"en": "Ground handling related skills"}', 530, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 531, 'f-aero-maintenance-airworthiness', '{"en": "Maintenance & airworthiness"}', '{"en": "Maintenance & airworthiness related skills"}', 531, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 532, 'f-aero-safety-management-systems', '{"en": "Safety management systems"}', '{"en": "Safety management systems related skills"}', 532, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 533, 'f-aero-avionics-instruments', '{"en": "Avionics & instruments"}', '{"en": "Avionics & instruments related skills"}', 533, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 534, 'f-aero-regulatory-compliance', '{"en": "Regulatory compliance"}', '{"en": "Regulatory compliance related skills"}', 534, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 535, 'f-aero-weight-balance', '{"en": "Weight & balance"}', '{"en": "Weight & balance related skills"}', 535, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 67, 536, 'f-aero-human-factors', '{"en": "Human factors"}', '{"en": "Human factors related skills"}', 536, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 537, 'f-pharma-assay-development', '{"en": "Assay development"}', '{"en": "Assay development related skills"}', 537, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 538, 'f-pharma-sample-handling-chain', '{"en": "Sample handling & chain"}', '{"en": "Sample handling & chain related skills"}', 538, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 539, 'f-pharma-gxp-documentation', '{"en": "GxP documentation"}', '{"en": "GxP documentation related skills"}', 539, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 540, 'f-pharma-validation-qualification', '{"en": "Validation & qualification"}', '{"en": "Validation & qualification related skills"}', 540, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 541, 'f-pharma-tech-transfer', '{"en": "Tech transfer"}', '{"en": "Tech transfer related skills"}', 541, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 542, 'f-pharma-stability-storage', '{"en": "Stability & storage"}', '{"en": "Stability & storage related skills"}', 542, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 543, 'f-pharma-submissions-dossiers', '{"en": "Submissions & dossiers"}', '{"en": "Submissions & dossiers related skills"}', 543, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 68, 544, 'f-pharma-lab-safety-biosafety', '{"en": "Lab safety & biosafety"}', '{"en": "Lab safety & biosafety related skills"}', 544, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 545, 'f-mines-exploration-surveying', '{"en": "Exploration & surveying"}', '{"en": "Exploration & surveying related skills"}', 545, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 546, 'f-mines-extraction-blasting', '{"en": "Extraction & blasting"}', '{"en": "Extraction & blasting related skills"}', 546, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 547, 'f-mines-processing-tailings', '{"en": "Processing & tailings"}', '{"en": "Processing & tailings related skills"}', 547, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 548, 'f-mines-geotech-ventilation', '{"en": "Geotech & ventilation"}', '{"en": "Geotech & ventilation related skills"}', 548, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 549, 'f-mines-equipment-ops-maintenance', '{"en": "Equipment ops & maintenance"}', '{"en": "Equipment ops & maintenance related skills"}', 549, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 550, 'f-mines-environmental-community', '{"en": "Environmental & community"}', '{"en": "Environmental & community related skills"}', 550, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 551, 'f-mines-safety-emergency', '{"en": "Safety & emergency"}', '{"en": "Safety & emergency related skills"}', 551, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (2, 69, 552, 'f-mines-compliance-reporting', '{"en": "Compliance & reporting"}', '{"en": "Compliance & reporting related skills"}', 552, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 553, 't-office-docs-presentations', '{"en": "Docs & presentations"}', '{"en": "Docs & presentations related skills"}', 553, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 554, 't-office-spreadsheets-formulas', '{"en": "Spreadsheets & formulas"}', '{"en": "Spreadsheets & formulas related skills"}', 554, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 555, 't-office-email-calendar-workflows', '{"en": "Email & calendar workflows"}', '{"en": "Email & calendar workflows related skills"}', 555, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 556, 't-office-templates-styles', '{"en": "Templates & styles"}', '{"en": "Templates & styles related skills"}', 556, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 557, 't-office-collaboration-comments', '{"en": "Collaboration & comments"}', '{"en": "Collaboration & comments related skills"}', 557, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 558, 't-office-automation-macros', '{"en": "Automation & macros"}', '{"en": "Automation & macros related skills"}', 558, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 559, 't-office-file-formats-export', '{"en": "File formats & export"}', '{"en": "File formats & export related skills"}', 559, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 70, 560, 't-office-versioning-track-changes', '{"en": "Versioning & track changes"}', '{"en": "Versioning & track changes related skills"}', 560, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 561, 't-collab-chat-channels', '{"en": "Chat & channels"}', '{"en": "Chat & channels related skills"}', 561, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 562, 't-collab-video-meetings-rooms', '{"en": "Video meetings & rooms"}', '{"en": "Video meetings & rooms related skills"}', 562, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 563, 't-collab-whiteboards-canvases', '{"en": "Whiteboards & canvases"}', '{"en": "Whiteboards & canvases related skills"}', 563, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 564, 't-collab-file-sharing-drives', '{"en": "File sharing & drives"}', '{"en": "File sharing & drives related skills"}', 564, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 565, 't-collab-communities-forums', '{"en": "Communities & forums"}', '{"en": "Communities & forums related skills"}', 565, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 566, 't-collab-webinars-events', '{"en": "Webinars & events"}', '{"en": "Webinars & events related skills"}', 566, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 567, 't-collab-integrations-bots', '{"en": "Integrations & bots"}', '{"en": "Integrations & bots related skills"}', 567, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 71, 568, 't-collab-notification-hygiene', '{"en": "Notification hygiene"}', '{"en": "Notification hygiene related skills"}', 568, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 569, 't-cms-wikis-knowledge-bases', '{"en": "Wikis & knowledge bases"}', '{"en": "Wikis & knowledge bases related skills"}', 569, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 570, 't-cms-dms-records', '{"en": "DMS & records"}', '{"en": "DMS & records related skills"}', 570, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 571, 't-cms-dam-media-libraries', '{"en": "DAM & media libraries"}', '{"en": "DAM & media libraries related skills"}', 571, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 572, 't-cms-taxonomy-metadata', '{"en": "Taxonomy & metadata"}', '{"en": "Taxonomy & metadata related skills"}', 572, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 573, 't-cms-search-findability', '{"en": "Search & findability"}', '{"en": "Search & findability related skills"}', 573, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 574, 't-cms-governance-lifecycle', '{"en": "Governance & lifecycle"}', '{"en": "Governance & lifecycle related skills"}', 574, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 575, 't-cms-workflows-approvals', '{"en": "Workflows & approvals"}', '{"en": "Workflows & approvals related skills"}', 575, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 72, 576, 't-cms-retention-compliance', '{"en": "Retention & compliance"}', '{"en": "Retention & compliance related skills"}', 576, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 577, 't-crm-data-model-objects', '{"en": "Data model & objects"}', '{"en": "Data model & objects related skills"}', 577, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 578, 't-crm-pipeline-opportunity-mgmt', '{"en": "Pipeline & opportunity mgmt"}', '{"en": "Pipeline & opportunity mgmt related skills"}', 578, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 579, 't-crm-segmentation-campaigns', '{"en": "Segmentation & campaigns"}', '{"en": "Segmentation & campaigns related skills"}', 579, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 580, 't-crm-lead-scoring-nurture', '{"en": "Lead scoring & nurture"}', '{"en": "Lead scoring & nurture related skills"}', 580, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 581, 't-crm-automation-journeys', '{"en": "Automation & journeys"}', '{"en": "Automation & journeys related skills"}', 581, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 582, 't-crm-reporting-attribution', '{"en": "Reporting & attribution"}', '{"en": "Reporting & attribution related skills"}', 582, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 583, 't-crm-integrations-cdp', '{"en": "Integrations & CDP"}', '{"en": "Integrations & CDP related skills"}', 583, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 73, 584, 't-crm-data-hygiene-dedupe', '{"en": "Data hygiene & dedupe"}', '{"en": "Data hygiene & dedupe related skills"}', 584, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 585, 't-erp-o2c-p2p', '{"en": "O2C & P2P"}', '{"en": "O2C & P2P related skills"}', 585, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 586, 't-erp-inventory-mrp', '{"en": "Inventory & MRP"}', '{"en": "Inventory & MRP related skills"}', 586, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 587, 't-erp-production-costing', '{"en": "Production & costing"}', '{"en": "Production & costing related skills"}', 587, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 588, 't-erp-gl-close', '{"en": "GL & close"}', '{"en": "GL & close related skills"}', 588, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 589, 't-erp-fixed-assets', '{"en": "Fixed assets"}', '{"en": "Fixed assets related skills"}', 589, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 590, 't-erp-tax-compliance', '{"en": "Tax & compliance"}', '{"en": "Tax & compliance related skills"}', 590, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 591, 't-erp-reporting-bi', '{"en": "Reporting & BI"}', '{"en": "Reporting & BI related skills"}', 591, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 74, 592, 't-erp-integrations-edi', '{"en": "Integrations & EDI"}', '{"en": "Integrations & EDI related skills"}', 592, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 593, 't-hris-core-hr-org-data', '{"en": "Core HR & org data"}', '{"en": "Core HR & org data related skills"}', 593, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 594, 't-hris-payroll-time', '{"en": "Payroll & time"}', '{"en": "Payroll & time related skills"}', 594, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 595, 't-hris-ta-onboarding', '{"en": "TA & onboarding"}', '{"en": "TA & onboarding related skills"}', 595, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 596, 't-hris-performance-goals', '{"en": "Performance & goals"}', '{"en": "Performance & goals related skills"}', 596, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 597, 't-hris-compensation-cycles', '{"en": "Compensation cycles"}', '{"en": "Compensation cycles related skills"}', 597, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 598, 't-hris-learning-catalogs', '{"en": "Learning catalogs"}', '{"en": "Learning catalogs related skills"}', 598, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 599, 't-hris-compliance-training', '{"en": "Compliance training"}', '{"en": "Compliance training related skills"}', 599, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 75, 600, 't-hris-people-analytics', '{"en": "People analytics"}', '{"en": "People analytics related skills"}', 600, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 601, 't-ecomm-catalog-variants', '{"en": "Catalog & variants"}', '{"en": "Catalog & variants related skills"}', 601, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 602, 't-ecomm-pricing-promos', '{"en": "Pricing & promos"}', '{"en": "Pricing & promos related skills"}', 602, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 603, 't-ecomm-checkout-payments', '{"en": "Checkout & payments"}', '{"en": "Checkout & payments related skills"}', 603, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 604, 't-ecomm-orders-fulfillment', '{"en": "Orders & fulfillment"}', '{"en": "Orders & fulfillment related skills"}', 604, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 605, 't-ecomm-returns-fraud', '{"en": "Returns & fraud"}', '{"en": "Returns & fraud related skills"}', 605, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 606, 't-ecomm-merch-search', '{"en": "Merch & search"}', '{"en": "Merch & search related skills"}', 606, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 607, 't-ecomm-pos-omnichannel', '{"en": "POS & omnichannel"}', '{"en": "POS & omnichannel related skills"}', 607, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 76, 608, 't-ecomm-analytics-cohorts', '{"en": "Analytics & cohorts"}', '{"en": "Analytics & cohorts related skills"}', 608, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 609, 't-data-relational-modeling', '{"en": "Relational modeling"}', '{"en": "Relational modeling related skills"}', 609, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 610, 't-data-nosql-patterns', '{"en": "NoSQL patterns"}', '{"en": "NoSQL patterns related skills"}', 610, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 611, 't-data-etl-elt-cdc', '{"en": "ETL/ELT & CDC"}', '{"en": "ETL/ELT & CDC related skills"}', 611, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 612, 't-data-partitioning-indexing', '{"en": "Partitioning & indexing"}', '{"en": "Partitioning & indexing related skills"}', 612, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 613, 't-data-lakehouse-architecture', '{"en": "Lakehouse architecture"}', '{"en": "Lakehouse architecture related skills"}', 613, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 614, 't-data-backup-recovery', '{"en": "Backup & recovery"}', '{"en": "Backup & recovery related skills"}', 614, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 615, 't-data-security-access', '{"en": "Security & access"}', '{"en": "Security & access related skills"}', 615, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 77, 616, 't-data-performance-tuning', '{"en": "Performance tuning"}', '{"en": "Performance tuning related skills"}', 616, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 617, 't-bi-dashboard-design', '{"en": "Dashboard design"}', '{"en": "Dashboard design related skills"}', 617, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 618, 't-bi-semantic-modeling', '{"en": "Semantic modeling"}', '{"en": "Semantic modeling related skills"}', 618, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 619, 't-bi-ad-hoc-analysis', '{"en": "Ad hoc analysis"}', '{"en": "Ad hoc analysis related skills"}', 619, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 620, 't-bi-alerts-subscriptions', '{"en": "Alerts & subscriptions"}', '{"en": "Alerts & subscriptions related skills"}', 620, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 621, 't-bi-data-storytelling', '{"en": "Data storytelling"}', '{"en": "Data storytelling related skills"}', 621, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 622, 't-bi-kpi-governance', '{"en": "KPI governance"}', '{"en": "KPI governance related skills"}', 622, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 623, 't-bi-performance-optimization', '{"en": "Performance optimization"}', '{"en": "Performance optimization related skills"}', 623, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 78, 624, 't-bi-distribution-embed', '{"en": "Distribution & embed"}', '{"en": "Distribution & embed related skills"}', 624, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 625, 't-analyt-event-tracking', '{"en": "Event tracking"}', '{"en": "Event tracking related skills"}', 625, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 626, 't-analyt-funnels-cohorts', '{"en": "Funnels & cohorts"}', '{"en": "Funnels & cohorts related skills"}', 626, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 627, 't-analyt-a-b-multi-armed-bandits', '{"en": "A/B & multi-armed bandits"}', '{"en": "A/B & multi-armed bandits related skills"}', 627, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 628, 't-analyt-feature-flags-guardrails', '{"en": "Feature flags & guardrails"}', '{"en": "Feature flags & guardrails related skills"}', 628, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 629, 't-analyt-causal-inference-basics', '{"en": "Causal inference basics"}', '{"en": "Causal inference basics related skills"}', 629, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 630, 't-analyt-forecasting-seasonality', '{"en": "Forecasting & seasonality"}', '{"en": "Forecasting & seasonality related skills"}', 630, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 631, 't-analyt-metric-design', '{"en": "Metric design"}', '{"en": "Metric design related skills"}', 631, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 79, 632, 't-analyt-experiment-review', '{"en": "Experiment review"}', '{"en": "Experiment review related skills"}', 632, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 633, 't-ds-notebooks-environments', '{"en": "Notebooks & environments"}', '{"en": "Notebooks & environments related skills"}', 633, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 634, 't-ds-feature-stores', '{"en": "Feature stores"}', '{"en": "Feature stores related skills"}', 634, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 635, 't-ds-training-tracking', '{"en": "Training & tracking"}', '{"en": "Training & tracking related skills"}', 635, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 636, 't-ds-model-registry', '{"en": "Model registry"}', '{"en": "Model registry related skills"}', 636, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 637, 't-ds-deployment-patterns', '{"en": "Deployment patterns"}', '{"en": "Deployment patterns related skills"}', 637, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 638, 't-ds-scaling-acceleration', '{"en": "Scaling & acceleration"}', '{"en": "Scaling & acceleration related skills"}', 638, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 639, 't-ds-collaboration-lineage', '{"en": "Collaboration & lineage"}', '{"en": "Collaboration & lineage related skills"}', 639, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 80, 640, 't-ds-cost-mgmt', '{"en": "Cost mgmt"}', '{"en": "Cost mgmt related skills"}', 640, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 641, 't-mlops-serving-endpoints', '{"en": "Serving & endpoints"}', '{"en": "Serving & endpoints related skills"}', 641, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 642, 't-mlops-drift-bias-monitors', '{"en": "Drift & bias monitors"}', '{"en": "Drift & bias monitors related skills"}', 642, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 643, 't-mlops-explainability-shap', '{"en": "Explainability & SHAP"}', '{"en": "Explainability & SHAP related skills"}', 643, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 644, 't-mlops-rollouts-canaries', '{"en": "Rollouts & canaries"}', '{"en": "Rollouts & canaries related skills"}', 644, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 645, 't-mlops-shadow-backtesting', '{"en": "Shadow & backtesting"}', '{"en": "Shadow & backtesting related skills"}', 645, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 646, 't-mlops-incident-response', '{"en": "Incident response"}', '{"en": "Incident response related skills"}', 646, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 647, 't-mlops-governance-approvals', '{"en": "Governance & approvals"}', '{"en": "Governance & approvals related skills"}', 647, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 81, 648, 't-mlops-model-cards-docs', '{"en": "Model cards & docs"}', '{"en": "Model cards & docs related skills"}', 648, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 649, 't-dev-language-paradigms', '{"en": "Language paradigms"}', '{"en": "Language paradigms related skills"}', 649, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 650, 't-dev-toolchains-build', '{"en": "Toolchains & build"}', '{"en": "Toolchains & build related skills"}', 650, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 651, 't-dev-package-mgmt', '{"en": "Package mgmt"}', '{"en": "Package mgmt related skills"}', 651, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 652, 't-dev-testing-frameworks', '{"en": "Testing frameworks"}', '{"en": "Testing frameworks related skills"}', 652, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 653, 't-dev-debugging-profiling', '{"en": "Debugging & profiling"}', '{"en": "Debugging & profiling related skills"}', 653, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 654, 't-dev-interop-ffi', '{"en": "Interop & FFI"}', '{"en": "Interop & FFI related skills"}', 654, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 655, 't-dev-sdk-usage-patterns', '{"en": "SDK usage patterns"}', '{"en": "SDK usage patterns related skills"}', 655, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 82, 656, 't-dev-style-linting', '{"en": "Style & linting"}', '{"en": "Style & linting related skills"}', 656, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 657, 't-vcs-branching-strategies', '{"en": "Branching strategies"}', '{"en": "Branching strategies related skills"}', 657, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 658, 't-vcs-code-reviews', '{"en": "Code reviews"}', '{"en": "Code reviews related skills"}', 658, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 659, 't-vcs-merge-rebase', '{"en": "Merge & rebase"}', '{"en": "Merge & rebase related skills"}', 659, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 660, 't-vcs-release-management', '{"en": "Release management"}', '{"en": "Release management related skills"}', 660, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 661, 't-vcs-repo-structure', '{"en": "Repo structure"}', '{"en": "Repo structure related skills"}', 661, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 662, 't-vcs-hooks-ci-triggers', '{"en": "Hooks & CI triggers"}', '{"en": "Hooks & CI triggers related skills"}', 662, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 663, 't-vcs-permissions-protection', '{"en": "Permissions & protection"}', '{"en": "Permissions & protection related skills"}', 663, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 83, 664, 't-vcs-audit-history', '{"en": "Audit & history"}', '{"en": "Audit & history related skills"}', 664, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 665, 't-cicd-pipelines-orchestration', '{"en": "Pipelines & orchestration"}', '{"en": "Pipelines & orchestration related skills"}', 665, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 666, 't-cicd-artifacts-registries', '{"en": "Artifacts & registries"}', '{"en": "Artifacts & registries related skills"}', 666, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 667, 't-cicd-test-automation', '{"en": "Test automation"}', '{"en": "Test automation related skills"}', 667, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 668, 't-cicd-security-scanning', '{"en": "Security scanning"}', '{"en": "Security scanning related skills"}', 668, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 669, 't-cicd-release-promotion', '{"en": "Release promotion"}', '{"en": "Release promotion related skills"}', 669, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 670, 't-cicd-rollbacks-hotfixes', '{"en": "Rollbacks & hotfixes"}', '{"en": "Rollbacks & hotfixes related skills"}', 670, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 671, 't-cicd-caching-parallelism', '{"en": "Caching & parallelism"}', '{"en": "Caching & parallelism related skills"}', 671, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 84, 672, 't-cicd-observability', '{"en": "Observability"}', '{"en": "Observability related skills"}', 672, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 673, 't-cloud-compute-containers', '{"en": "Compute & containers"}', '{"en": "Compute & containers related skills"}', 673, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 674, 't-cloud-storage-databases', '{"en": "Storage & databases"}', '{"en": "Storage & databases related skills"}', 674, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 675, 't-cloud-networking-identity', '{"en": "Networking & identity"}', '{"en": "Networking & identity related skills"}', 675, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 676, 't-cloud-observability-logging', '{"en": "Observability & logging"}', '{"en": "Observability & logging related skills"}', 676, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 677, 't-cloud-cost-controls', '{"en": "Cost controls"}', '{"en": "Cost controls related skills"}', 677, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 678, 't-cloud-security-kms', '{"en": "Security & KMS"}', '{"en": "Security & KMS related skills"}', 678, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 679, 't-cloud-paas-services', '{"en": "PaaS services"}', '{"en": "PaaS services related skills"}', 679, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 85, 680, 't-cloud-multi-region-design', '{"en": "Multi-region design"}', '{"en": "Multi-region design related skills"}', 680, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 681, 't-infra-os-administration', '{"en": "OS administration"}', '{"en": "OS administration related skills"}', 681, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 682, 't-infra-virtualization-containers', '{"en": "Virtualization & containers"}', '{"en": "Virtualization & containers related skills"}', 682, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 683, 't-infra-scripting-automation', '{"en": "Scripting & automation"}', '{"en": "Scripting & automation related skills"}', 683, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 684, 't-infra-patch-config-mgmt', '{"en": "Patch & config mgmt"}', '{"en": "Patch & config mgmt related skills"}', 684, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 685, 't-infra-backup-dr', '{"en": "Backup & DR"}', '{"en": "Backup & DR related skills"}', 685, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 686, 't-infra-monitoring-alerting', '{"en": "Monitoring & alerting"}', '{"en": "Monitoring & alerting related skills"}', 686, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 687, 't-infra-capacity-planning', '{"en": "Capacity planning"}', '{"en": "Capacity planning related skills"}', 687, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 86, 688, 't-infra-hardening-cis', '{"en": "Hardening & CIS"}', '{"en": "Hardening & CIS related skills"}', 688, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 689, 't-net-routing-switching', '{"en": "Routing & switching"}', '{"en": "Routing & switching related skills"}', 689, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 690, 't-net-wireless-design', '{"en": "Wireless design"}', '{"en": "Wireless design related skills"}', 690, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 691, 't-net-dns-dhcp-ipam', '{"en": "DNS/DHCP & IPAM"}', '{"en": "DNS/DHCP & IPAM related skills"}', 691, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 692, 't-net-load-balancing-cdn', '{"en": "Load balancing & CDN"}', '{"en": "Load balancing & CDN related skills"}', 692, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 693, 't-net-sd-wan-edge', '{"en": "SD-WAN & edge"}', '{"en": "SD-WAN & edge related skills"}', 693, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 694, 't-net-network-security', '{"en": "Network security"}', '{"en": "Network security related skills"}', 694, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 695, 't-net-performance-mgmt', '{"en": "Performance mgmt"}', '{"en": "Performance mgmt related skills"}', 695, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 87, 696, 't-net-tooling-diagrams', '{"en": "Tooling & diagrams"}', '{"en": "Tooling & diagrams related skills"}', 696, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 697, 't-sec-siem-log-pipelines', '{"en": "SIEM & log pipelines"}', '{"en": "SIEM & log pipelines related skills"}', 697, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 698, 't-sec-edr-xdr', '{"en": "EDR & XDR"}', '{"en": "EDR & XDR related skills"}', 698, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 699, 't-sec-vulnerability-mgmt', '{"en": "Vulnerability mgmt"}', '{"en": "Vulnerability mgmt related skills"}', 699, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 700, 't-sec-secrets-keys', '{"en": "Secrets & keys"}', '{"en": "Secrets & keys related skills"}', 700, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 701, 't-sec-waf-bot-mgmt', '{"en": "WAF & bot mgmt"}', '{"en": "WAF & bot mgmt related skills"}', 701, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 702, 't-sec-sase-zero-trust', '{"en": "SASE & Zero Trust"}', '{"en": "SASE & Zero Trust related skills"}', 702, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 703, 't-sec-dlp-casb', '{"en": "DLP & CASB"}', '{"en": "DLP & CASB related skills"}', 703, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 88, 704, 't-sec-grc-tooling', '{"en": "GRC tooling"}', '{"en": "GRC tooling related skills"}', 704, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 705, 't-itsm-incident-problem', '{"en": "Incident & problem"}', '{"en": "Incident & problem related skills"}', 705, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 706, 't-itsm-change-release', '{"en": "Change & release"}', '{"en": "Change & release related skills"}', 706, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 707, 't-itsm-cmdb-discovery', '{"en": "CMDB & discovery"}', '{"en": "CMDB & discovery related skills"}', 707, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 708, 't-itsm-service-catalog-slas', '{"en": "Service catalog & SLAs"}', '{"en": "Service catalog & SLAs related skills"}', 708, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 709, 't-itsm-knowledge-mgmt', '{"en": "Knowledge mgmt"}', '{"en": "Knowledge mgmt related skills"}', 709, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 710, 't-itsm-major-incident-mgmt', '{"en": "Major incident mgmt"}', '{"en": "Major incident mgmt related skills"}', 710, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 711, 't-itsm-reporting-csat', '{"en": "Reporting & CSAT"}', '{"en": "Reporting & CSAT related skills"}', 711, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 89, 712, 't-itsm-automation-vsm', '{"en": "Automation & VSM"}', '{"en": "Automation & VSM related skills"}', 712, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 713, 't-design-wireframes-flows', '{"en": "Wireframes & flows"}', '{"en": "Wireframes & flows related skills"}', 713, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 714, 't-design-hi-fi-prototyping', '{"en": "Hi-fi prototyping"}', '{"en": "Hi-fi prototyping related skills"}', 714, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 715, 't-design-motion-micro-interactions', '{"en": "Motion & micro-interactions"}', '{"en": "Motion & micro-interactions related skills"}', 715, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 716, 't-design-design-tokens-systems', '{"en": "Design tokens & systems"}', '{"en": "Design tokens & systems related skills"}', 716, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 717, 't-design-handoff-specs', '{"en": "Handoff & specs"}', '{"en": "Handoff & specs related skills"}', 717, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 718, 't-design-design-qa', '{"en": "Design QA"}', '{"en": "Design QA related skills"}', 718, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 719, 't-design-accessibility-annotations', '{"en": "Accessibility annotations"}', '{"en": "Accessibility annotations related skills"}', 719, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 90, 720, 't-design-figma-sketch-mastery', '{"en": "Figma/Sketch mastery"}', '{"en": "Figma/Sketch mastery related skills"}', 720, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 721, 't-img-raster-editing', '{"en": "Raster editing"}', '{"en": "Raster editing related skills"}', 721, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 722, 't-img-vector-illustration', '{"en": "Vector illustration"}', '{"en": "Vector illustration related skills"}', 722, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 723, 't-img-3d-modeling-uvs', '{"en": "3D modeling & UVs"}', '{"en": "3D modeling & UVs related skills"}', 723, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 724, 't-img-rendering-lighting', '{"en": "Rendering & lighting"}', '{"en": "Rendering & lighting related skills"}', 724, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 725, 't-img-motion-graphics', '{"en": "Motion graphics"}', '{"en": "Motion graphics related skills"}', 725, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 726, 't-img-color-management', '{"en": "Color management"}', '{"en": "Color management related skills"}', 726, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 727, 't-img-asset-pipelines', '{"en": "Asset pipelines"}', '{"en": "Asset pipelines related skills"}', 727, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 91, 728, 't-img-file-formats', '{"en": "File formats"}', '{"en": "File formats related skills"}', 728, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 729, 't-audio-recording-mics', '{"en": "Recording & mics"}', '{"en": "Recording & mics related skills"}', 729, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 730, 't-audio-editing-mixing', '{"en": "Editing & mixing"}', '{"en": "Editing & mixing related skills"}', 730, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 731, 't-audio-synthesis-midi', '{"en": "Synthesis & MIDI"}', '{"en": "Synthesis & MIDI related skills"}', 731, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 732, 't-audio-mastering-loudness', '{"en": "Mastering & loudness"}', '{"en": "Mastering & loudness related skills"}', 732, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 733, 't-audio-restoration-noise', '{"en": "Restoration & noise"}', '{"en": "Restoration & noise related skills"}', 733, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 734, 't-audio-podcast-workflows', '{"en": "Podcast workflows"}', '{"en": "Podcast workflows related skills"}', 734, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 735, 't-audio-live-sound', '{"en": "Live sound"}', '{"en": "Live sound related skills"}', 735, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 92, 736, 't-audio-distribution', '{"en": "Distribution"}', '{"en": "Distribution related skills"}', 736, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 737, 't-video-editing-timelines', '{"en": "Editing & timelines"}', '{"en": "Editing & timelines related skills"}', 737, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 738, 't-video-color-correction-grading', '{"en": "Color correction & grading"}', '{"en": "Color correction & grading related skills"}', 738, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 739, 't-video-compositing-tracking', '{"en": "Compositing & tracking"}', '{"en": "Compositing & tracking related skills"}', 739, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 740, 't-video-motion-graphics', '{"en": "Motion graphics"}', '{"en": "Motion graphics related skills"}', 740, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 741, 't-video-encoding-delivery', '{"en": "Encoding & delivery"}', '{"en": "Encoding & delivery related skills"}', 741, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 742, 't-video-collaboration-review', '{"en": "Collaboration & review"}', '{"en": "Collaboration & review related skills"}', 742, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 743, 't-video-archival-proxies', '{"en": "Archival & proxies"}', '{"en": "Archival & proxies related skills"}', 743, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 93, 744, 't-video-qc-compliance', '{"en": "QC & compliance"}', '{"en": "QC & compliance related skills"}', 744, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 745, 't-gis-spatial-db-projections', '{"en": "Spatial DB & projections"}', '{"en": "Spatial DB & projections related skills"}', 745, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 746, 't-gis-digitizing-topology', '{"en": "Digitizing & topology"}', '{"en": "Digitizing & topology related skills"}', 746, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 747, 't-gis-cartography-symbology', '{"en": "Cartography & symbology"}', '{"en": "Cartography & symbology related skills"}', 747, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 748, 't-gis-remote-sensing', '{"en": "Remote sensing"}', '{"en": "Remote sensing related skills"}', 748, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 749, 't-gis-field-data-gps', '{"en": "Field data & GPS"}', '{"en": "Field data & GPS related skills"}', 749, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 750, 't-gis-routing-networks', '{"en": "Routing & networks"}', '{"en": "Routing & networks related skills"}', 750, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 751, 't-gis-web-mapping', '{"en": "Web mapping"}', '{"en": "Web mapping related skills"}', 751, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 94, 752, 't-gis-analysis-models', '{"en": "Analysis & models"}', '{"en": "Analysis & models related skills"}', 752, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 753, 't-cad-part-assembly-design', '{"en": "Part & assembly design"}', '{"en": "Part & assembly design related skills"}', 753, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 754, 't-cad-drawings-tolerances', '{"en": "Drawings & tolerances"}', '{"en": "Drawings & tolerances related skills"}', 754, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 755, 't-cad-simulation-fea-cfd', '{"en": "Simulation & FEA/CFD"}', '{"en": "Simulation & FEA/CFD related skills"}', 755, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 756, 't-cad-toolpaths-cam', '{"en": "Toolpaths & CAM"}', '{"en": "Toolpaths & CAM related skills"}', 756, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 757, 't-cad-pdm-plm-workflows', '{"en": "PDM/PLM workflows"}', '{"en": "PDM/PLM workflows related skills"}', 757, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 758, 't-cad-dfm-dfa', '{"en": "DFM/DFA"}', '{"en": "DFM/DFA related skills"}', 758, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 759, 't-cad-materials-libraries', '{"en": "Materials libraries"}', '{"en": "Materials libraries related skills"}', 759, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 95, 760, 't-cad-standards-revisions', '{"en": "Standards & revisions"}', '{"en": "Standards & revisions related skills"}', 760, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 761, 't-plc-plc-programming-iec-61131-3', '{"en": "PLC programming & IEC 61131-3"}', '{"en": "PLC programming & IEC 61131-3 related skills"}', 761, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 762, 't-plc-hmi-scada-design', '{"en": "HMI/SCADA design"}', '{"en": "HMI/SCADA design related skills"}', 762, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 763, 't-plc-industrial-protocols', '{"en": "Industrial protocols"}', '{"en": "Industrial protocols related skills"}', 763, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 764, 't-plc-alarms-safety-systems', '{"en": "Alarms & safety systems"}', '{"en": "Alarms & safety systems related skills"}', 764, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 765, 't-plc-historian-trends', '{"en": "Historian & trends"}', '{"en": "Historian & trends related skills"}', 765, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 766, 't-plc-commissioning-fat-sat', '{"en": "Commissioning & FAT/SAT"}', '{"en": "Commissioning & FAT/SAT related skills"}', 766, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 767, 't-plc-ot-security', '{"en": "OT security"}', '{"en": "OT security related skills"}', 767, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 96, 768, 't-plc-maintenance-spares', '{"en": "Maintenance & spares"}', '{"en": "Maintenance & spares related skills"}', 768, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 769, 't-qa-unit-ui-perf-testing', '{"en": "Unit/UI/perf testing"}', '{"en": "Unit/UI/perf testing related skills"}', 769, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 770, 't-qa-test-data-mgmt', '{"en": "Test data mgmt"}', '{"en": "Test data mgmt related skills"}', 770, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 771, 't-qa-defect-tracking', '{"en": "Defect tracking"}', '{"en": "Defect tracking related skills"}', 771, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 772, 't-qa-automation-frameworks', '{"en": "Automation frameworks"}', '{"en": "Automation frameworks related skills"}', 772, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 773, 't-qa-lab-rigs-instrumentation', '{"en": "Lab rigs & instrumentation"}', '{"en": "Lab rigs & instrumentation related skills"}', 773, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 774, 't-qa-ci-test-integration', '{"en": "CI test integration"}', '{"en": "CI test integration related skills"}', 774, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 775, 't-qa-coverage-flakiness', '{"en": "Coverage & flakiness"}', '{"en": "Coverage & flakiness related skills"}', 775, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 97, 776, 't-qa-reporting-triage', '{"en": "Reporting & triage"}', '{"en": "Reporting & triage related skills"}', 776, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 777, 't-iot-sensors-gateways', '{"en": "Sensors & gateways"}', '{"en": "Sensors & gateways related skills"}', 777, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 778, 't-iot-protocols-telemetry', '{"en": "Protocols & telemetry"}', '{"en": "Protocols & telemetry related skills"}', 778, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 779, 't-iot-edge-compute', '{"en": "Edge compute"}', '{"en": "Edge compute related skills"}', 779, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 780, 't-iot-vision-perception', '{"en": "Vision & perception"}', '{"en": "Vision & perception related skills"}', 780, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 781, 't-iot-digital-twins', '{"en": "Digital twins"}', '{"en": "Digital twins related skills"}', 781, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 782, 't-iot-fleet-mgmt-ota', '{"en": "Fleet mgmt & OTA"}', '{"en": "Fleet mgmt & OTA related skills"}', 782, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 783, 't-iot-safety-standards', '{"en": "Safety & standards"}', '{"en": "Safety & standards related skills"}', 783, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 98, 784, 't-iot-maintenance-analytics', '{"en": "Maintenance analytics"}', '{"en": "Maintenance analytics related skills"}', 784, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 785, 't-lab-chromatography', '{"en": "Chromatography"}', '{"en": "Chromatography related skills"}', 785, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 786, 't-lab-spectroscopy', '{"en": "Spectroscopy"}', '{"en": "Spectroscopy related skills"}', 786, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 787, 't-lab-microscopy', '{"en": "Microscopy"}', '{"en": "Microscopy related skills"}', 787, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 788, 't-lab-mass-spectrometry', '{"en": "Mass spectrometry"}', '{"en": "Mass spectrometry related skills"}', 788, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 789, 't-lab-calibration-qc', '{"en": "Calibration & QC"}', '{"en": "Calibration & QC related skills"}', 789, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 790, 't-lab-sample-prep-storage', '{"en": "Sample prep & storage"}', '{"en": "Sample prep & storage related skills"}', 790, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 791, 't-lab-lims-lis-workflows', '{"en": "LIMS/LIS workflows"}', '{"en": "LIMS/LIS workflows related skills"}', 791, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 99, 792, 't-lab-safety-waste', '{"en": "Safety & waste"}', '{"en": "Safety & waste related skills"}', 792, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 793, 't-med-ehr-workflows', '{"en": "EHR workflows"}', '{"en": "EHR workflows related skills"}', 793, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 794, 't-med-imaging-pacs', '{"en": "Imaging & PACS"}', '{"en": "Imaging & PACS related skills"}', 794, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 795, 't-med-vitals-monitoring', '{"en": "Vitals & monitoring"}', '{"en": "Vitals & monitoring related skills"}', 795, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 796, 't-med-medication-mar', '{"en": "Medication & MAR"}', '{"en": "Medication & MAR related skills"}', 796, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 797, 't-med-interoperability-hl7-fhir', '{"en": "Interoperability (HL7/FHIR)"}', '{"en": "Interoperability (HL7/FHIR) related skills"}', 797, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 798, 't-med-clinical-decision-support', '{"en": "Clinical decision support"}', '{"en": "Clinical decision support related skills"}', 798, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 799, 't-med-privacy-security', '{"en": "Privacy & security"}', '{"en": "Privacy & security related skills"}', 799, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 100, 800, 't-med-device-maintenance', '{"en": "Device maintenance"}', '{"en": "Device maintenance related skills"}', 800, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 801, 't-energy-bms-hvac-controls', '{"en": "BMS & HVAC controls"}', '{"en": "BMS & HVAC controls related skills"}', 801, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 802, 't-energy-metering-submetering', '{"en": "Metering & submetering"}', '{"en": "Metering & submetering related skills"}', 802, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 803, 't-energy-solar-storage-integration', '{"en": "Solar & storage integration"}', '{"en": "Solar & storage integration related skills"}', 803, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 804, 't-energy-demand-response', '{"en": "Demand response"}', '{"en": "Demand response related skills"}', 804, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 805, 't-energy-microgrids-derms', '{"en": "Microgrids & DERMS"}', '{"en": "Microgrids & DERMS related skills"}', 805, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 806, 't-energy-fault-detection-diagnostics', '{"en": "Fault detection & diagnostics"}', '{"en": "Fault detection & diagnostics related skills"}', 806, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 807, 't-energy-energy-reporting', '{"en": "Energy reporting"}', '{"en": "Energy reporting related skills"}', 807, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 101, 808, 't-energy-retro-commissioning', '{"en": "Retro-commissioning"}', '{"en": "Retro-commissioning related skills"}', 808, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 809, 't-agri-weather-soil-sensors', '{"en": "Weather & soil sensors"}', '{"en": "Weather & soil sensors related skills"}', 809, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 810, 't-agri-drones-imagery', '{"en": "Drones & imagery"}', '{"en": "Drones & imagery related skills"}', 810, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 811, 't-agri-variable-rate-tech', '{"en": "Variable rate tech"}', '{"en": "Variable rate tech related skills"}', 811, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 812, 't-agri-farm-mgmt-systems', '{"en": "Farm mgmt systems"}', '{"en": "Farm mgmt systems related skills"}', 812, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 813, 't-agri-livestock-tracking', '{"en": "Livestock tracking"}', '{"en": "Livestock tracking related skills"}', 813, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 814, 't-agri-irrigation-control', '{"en": "Irrigation control"}', '{"en": "Irrigation control related skills"}', 814, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 815, 't-agri-yield-mapping', '{"en": "Yield mapping"}', '{"en": "Yield mapping related skills"}', 815, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 102, 816, 't-agri-compliance-records', '{"en": "Compliance & records"}', '{"en": "Compliance & records related skills"}', 816, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 817, 't-telem-tracking-rtls', '{"en": "Tracking & RTLS"}', '{"en": "Tracking & RTLS related skills"}', 817, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 818, 't-telem-driver-behavior-safety', '{"en": "Driver behavior & safety"}', '{"en": "Driver behavior & safety related skills"}', 818, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 819, 't-telem-fuel-maintenance', '{"en": "Fuel & maintenance"}', '{"en": "Fuel & maintenance related skills"}', 819, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 820, 't-telem-routing-dispatch', '{"en": "Routing & dispatch"}', '{"en": "Routing & dispatch related skills"}', 820, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 821, 't-telem-compliance-eld', '{"en": "Compliance & ELD"}', '{"en": "Compliance & ELD related skills"}', 821, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 822, 't-telem-sensors-can-bus', '{"en": "Sensors & CAN bus"}', '{"en": "Sensors & CAN bus related skills"}', 822, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 823, 't-telem-analytics-reports', '{"en": "Analytics & reports"}', '{"en": "Analytics & reports related skills"}', 823, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 103, 824, 't-telem-integrations', '{"en": "Integrations"}', '{"en": "Integrations related skills"}', 824, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 825, 't-kitch-ovens-combi', '{"en": "Ovens & combi"}', '{"en": "Ovens & combi related skills"}', 825, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 826, 't-kitch-mixers-sheeters', '{"en": "Mixers & sheeters"}', '{"en": "Mixers & sheeters related skills"}', 826, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 827, 't-kitch-chillers-freezers', '{"en": "Chillers & freezers"}', '{"en": "Chillers & freezers related skills"}', 827, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 828, 't-kitch-induction-ranges', '{"en": "Induction & ranges"}', '{"en": "Induction & ranges related skills"}', 828, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 829, 't-kitch-safety-sanitation', '{"en": "Safety & sanitation"}', '{"en": "Safety & sanitation related skills"}', 829, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 830, 't-kitch-calibration-maintenance', '{"en": "Calibration & maintenance"}', '{"en": "Calibration & maintenance related skills"}', 830, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 831, 't-kitch-smallwares-mastery', '{"en": "Smallwares mastery"}', '{"en": "Smallwares mastery related skills"}', 831, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (3, 104, 832, 't-kitch-equipment-selection', '{"en": "Equipment selection"}', '{"en": "Equipment selection related skills"}', 832, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 833, 'l-lang-language-families-branches', '{"en": "Language families & branches"}', '{"en": "Language families & branches related skills"}', 833, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 834, 'l-lang-dialects-sociolects', '{"en": "Dialects & sociolects"}', '{"en": "Dialects & sociolects related skills"}', 834, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 835, 'l-lang-registers-tone', '{"en": "Registers & tone"}', '{"en": "Registers & tone related skills"}', 835, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 836, 'l-lang-grammar-syntax', '{"en": "Grammar & syntax"}', '{"en": "Grammar & syntax related skills"}', 836, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 837, 'l-lang-vocabulary-idioms', '{"en": "Vocabulary & idioms"}', '{"en": "Vocabulary & idioms related skills"}', 837, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 838, 'l-lang-pronunciation-phonology', '{"en": "Pronunciation & phonology"}', '{"en": "Pronunciation & phonology related skills"}', 838, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 839, 'l-lang-orthography-spelling', '{"en": "Orthography & spelling"}', '{"en": "Orthography & spelling related skills"}', 839, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 105, 840, 'l-lang-cefr-proficiency-mapping', '{"en": "CEFR proficiency mapping"}', '{"en": "CEFR proficiency mapping related skills"}', 840, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 841, 'l-sign-national-sign-languages', '{"en": "National sign languages"}', '{"en": "National sign languages related skills"}', 841, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 842, 'l-sign-fingerspelling-systems', '{"en": "Fingerspelling systems"}', '{"en": "Fingerspelling systems related skills"}', 842, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 843, 'l-sign-facial-grammar-prosody', '{"en": "Facial grammar & prosody"}', '{"en": "Facial grammar & prosody related skills"}', 843, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 844, 'l-sign-classifiers-space', '{"en": "Classifiers & space"}', '{"en": "Classifiers & space related skills"}', 844, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 845, 'l-sign-interpreting-conventions', '{"en": "Interpreting conventions"}', '{"en": "Interpreting conventions related skills"}', 845, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 846, 'l-sign-deaf-culture-community', '{"en": "Deaf culture & community"}', '{"en": "Deaf culture & community related skills"}', 846, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 847, 'l-sign-accessibility-tech', '{"en": "Accessibility tech"}', '{"en": "Accessibility tech related skills"}', 847, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 106, 848, 'l-sign-ethics-boundaries', '{"en": "Ethics & boundaries"}', '{"en": "Ethics & boundaries related skills"}', 848, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 849, 'l-modal-speaking-listening', '{"en": "Speaking & listening"}', '{"en": "Speaking & listening related skills"}', 849, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 850, 'l-modal-reading-writing', '{"en": "Reading & writing"}', '{"en": "Reading & writing related skills"}', 850, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 851, 'l-modal-pronunciation-accent', '{"en": "Pronunciation & accent"}', '{"en": "Pronunciation & accent related skills"}', 851, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 852, 'l-modal-note-taking-summaries', '{"en": "Note-taking & summaries"}', '{"en": "Note-taking & summaries related skills"}', 852, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 853, 'l-modal-digital-communication', '{"en": "Digital communication"}', '{"en": "Digital communication related skills"}', 853, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 854, 'l-modal-presentation-skills', '{"en": "Presentation skills"}', '{"en": "Presentation skills related skills"}', 854, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 855, 'l-modal-conversation-repair', '{"en": "Conversation repair"}', '{"en": "Conversation repair related skills"}', 855, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 107, 856, 'l-modal-code-switching', '{"en": "Code switching"}', '{"en": "Code switching related skills"}', 856, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 857, 'l-int-consecutive-interpreting', '{"en": "Consecutive interpreting"}', '{"en": "Consecutive interpreting related skills"}', 857, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 858, 'l-int-simultaneous-interpreting', '{"en": "Simultaneous interpreting"}', '{"en": "Simultaneous interpreting related skills"}', 858, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 859, 'l-int-sight-translation', '{"en": "Sight translation"}', '{"en": "Sight translation related skills"}', 859, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 860, 'l-int-terminology-mgmt', '{"en": "Terminology mgmt"}', '{"en": "Terminology mgmt related skills"}', 860, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 861, 'l-int-subtitling-captioning', '{"en": "Subtitling & captioning"}', '{"en": "Subtitling & captioning related skills"}', 861, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 862, 'l-int-transcreation-localization', '{"en": "Transcreation & localization"}', '{"en": "Transcreation & localization related skills"}', 862, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 863, 'l-int-qa-revision', '{"en": "QA & revision"}', '{"en": "QA & revision related skills"}', 863, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 864, 'l-int-ethics-fidelity', '{"en": "Ethics & fidelity"}', '{"en": "Ethics & fidelity related skills"}', 864, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 865, 'l-int-i18n-readiness-keys', '{"en": "i18n readiness & keys"}', '{"en": "i18n readiness & keys related skills"}', 865, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 866, 'l-int-l10n-workflows', '{"en": "L10n workflows"}', '{"en": "L10n workflows related skills"}', 866, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 867, 'l-int-linguistic-qa', '{"en": "Linguistic QA"}', '{"en": "Linguistic QA related skills"}', 867, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 868, 'l-int-cultural-adaptation', '{"en": "Cultural adaptation"}', '{"en": "Cultural adaptation related skills"}', 868, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 869, 'l-int-date-number-currency', '{"en": "Date/number/currency"}', '{"en": "Date/number/currency related skills"}', 869, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 870, 'l-int-rtl-script-handling', '{"en": "RTL & script handling"}', '{"en": "RTL & script handling related skills"}', 870, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 871, 'l-int-pseudolocalization', '{"en": "Pseudolocalization"}', '{"en": "Pseudolocalization related skills"}', 871, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 108, 872, 'l-int-style-guides-termbases', '{"en": "Style guides & termbases"}', '{"en": "Style guides & termbases related skills"}', 872, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 873, 'l-write-scripts-families', '{"en": "Scripts & families"}', '{"en": "Scripts & families related skills"}', 873, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 874, 'l-write-romanization-transliteration', '{"en": "Romanization & transliteration"}', '{"en": "Romanization & transliteration related skills"}', 874, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 875, 'l-write-spelling-reforms', '{"en": "Spelling reforms"}', '{"en": "Spelling reforms related skills"}', 875, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 876, 'l-write-punctuation-norms', '{"en": "Punctuation norms"}', '{"en": "Punctuation norms related skills"}', 876, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 877, 'l-write-typography-basics', '{"en": "Typography basics"}', '{"en": "Typography basics related skills"}', 877, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 878, 'l-write-handwriting-calligraphy', '{"en": "Handwriting & calligraphy"}', '{"en": "Handwriting & calligraphy related skills"}', 878, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 879, 'l-write-ocr-text-tech', '{"en": "OCR & text tech"}', '{"en": "OCR & text tech related skills"}', 879, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 109, 880, 'l-write-standardization-bodies', '{"en": "Standardization bodies"}', '{"en": "Standardization bodies related skills"}', 880, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 881, 'l-region-business-etiquette', '{"en": "Business etiquette"}', '{"en": "Business etiquette related skills"}', 881, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 882, 'l-region-negotiation-styles', '{"en": "Negotiation styles"}', '{"en": "Negotiation styles related skills"}', 882, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 883, 'l-region-gift-giving-protocol', '{"en": "Gift-giving & protocol"}', '{"en": "Gift-giving & protocol related skills"}', 883, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 884, 'l-region-dining-hospitality', '{"en": "Dining & hospitality"}', '{"en": "Dining & hospitality related skills"}', 884, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 885, 'l-region-dress-symbols', '{"en": "Dress & symbols"}', '{"en": "Dress & symbols related skills"}', 885, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 886, 'l-region-meetings-hierarchy', '{"en": "Meetings & hierarchy"}', '{"en": "Meetings & hierarchy related skills"}', 886, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 887, 'l-region-time-punctuality', '{"en": "Time & punctuality"}', '{"en": "Time & punctuality related skills"}', 887, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 110, 888, 'l-region-public-behaviors', '{"en": "Public behaviors"}', '{"en": "Public behaviors related skills"}', 888, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 889, 'l-cxcomm-high-low-context-patterns', '{"en": "High/low context patterns"}', '{"en": "High/low context patterns related skills"}', 889, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 890, 'l-cxcomm-direct-vs-indirect-styles', '{"en": "Direct vs indirect styles"}', '{"en": "Direct vs indirect styles related skills"}', 890, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 891, 'l-cxcomm-nonverbal-proxemics', '{"en": "Nonverbal & proxemics"}', '{"en": "Nonverbal & proxemics related skills"}', 891, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 892, 'l-cxcomm-digital-norms', '{"en": "Digital norms"}', '{"en": "Digital norms related skills"}', 892, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 893, 'l-cxcomm-humor-taboos', '{"en": "Humor & taboos"}', '{"en": "Humor & taboos related skills"}', 893, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 894, 'l-cxcomm-politeness-strategies', '{"en": "Politeness strategies"}', '{"en": "Politeness strategies related skills"}', 894, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 895, 'l-cxcomm-misunderstanding-repair', '{"en": "Misunderstanding repair"}', '{"en": "Misunderstanding repair related skills"}', 895, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 111, 896, 'l-cxcomm-culture-mapping-tools', '{"en": "Culture mapping tools"}', '{"en": "Culture mapping tools related skills"}', 896, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 897, 'l-team-distributed-teaming', '{"en": "Distributed teaming"}', '{"en": "Distributed teaming related skills"}', 897, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 898, 'l-team-feedback-evaluation-styles', '{"en": "Feedback & evaluation styles"}', '{"en": "Feedback & evaluation styles related skills"}', 898, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 899, 'l-team-decision-making-norms', '{"en": "Decision-making norms"}', '{"en": "Decision-making norms related skills"}', 899, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 900, 'l-team-conflict-mediation', '{"en": "Conflict mediation"}', '{"en": "Conflict mediation related skills"}', 900, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 901, 'l-team-inclusion-practices', '{"en": "Inclusion practices"}', '{"en": "Inclusion practices related skills"}', 901, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 902, 'l-team-holidays-rhythms', '{"en": "Holidays & rhythms"}', '{"en": "Holidays & rhythms related skills"}', 902, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 903, 'l-team-onboarding-across-cultures', '{"en": "Onboarding across cultures"}', '{"en": "Onboarding across cultures related skills"}', 903, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 112, 904, 'l-team-remote-collaboration', '{"en": "Remote collaboration"}', '{"en": "Remote collaboration related skills"}', 904, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 905, 'l-cultlit-traditions-arts', '{"en": "Traditions & arts"}', '{"en": "Traditions & arts related skills"}', 905, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 906, 'l-cultlit-institutions-history', '{"en": "Institutions & history"}', '{"en": "Institutions & history related skills"}', 906, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 907, 'l-cultlit-festivals-observances', '{"en": "Festivals & observances"}', '{"en": "Festivals & observances related skills"}', 907, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 908, 'l-cultlit-media-narratives', '{"en": "Media & narratives"}', '{"en": "Media & narratives related skills"}', 908, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 909, 'l-cultlit-heritage-identity', '{"en": "Heritage & identity"}', '{"en": "Heritage & identity related skills"}', 909, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 910, 'l-cultlit-civic-life', '{"en": "Civic life"}', '{"en": "Civic life related skills"}', 910, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 911, 'l-cultlit-cultural-tourism', '{"en": "Cultural tourism"}', '{"en": "Cultural tourism related skills"}', 911, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 113, 912, 'l-cultlit-cross-cultural-comparison', '{"en": "Cross-cultural comparison"}', '{"en": "Cross-cultural comparison related skills"}', 912, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 913, 'l-lsp-medical-language', '{"en": "Medical language"}', '{"en": "Medical language related skills"}', 913, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 914, 'l-lsp-legal-language', '{"en": "Legal language"}', '{"en": "Legal language related skills"}', 914, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 915, 'l-lsp-technical-engineering', '{"en": "Technical & engineering"}', '{"en": "Technical & engineering related skills"}', 915, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 916, 'l-lsp-scientific-discourse', '{"en": "Scientific discourse"}', '{"en": "Scientific discourse related skills"}', 916, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 917, 'l-lsp-business-finance', '{"en": "Business & finance"}', '{"en": "Business & finance related skills"}', 917, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 918, 'l-lsp-public-sector-policy', '{"en": "Public sector & policy"}', '{"en": "Public sector & policy related skills"}', 918, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 919, 'l-lsp-academic-writing', '{"en": "Academic writing"}', '{"en": "Academic writing related skills"}', 919, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 114, 920, 'l-lsp-customer-service', '{"en": "Customer service"}', '{"en": "Customer service related skills"}', 920, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 921, 'l-access-plain-language-principles', '{"en": "Plain language principles"}', '{"en": "Plain language principles related skills"}', 921, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 922, 'l-access-alt-text-captions', '{"en": "Alt-text & captions"}', '{"en": "Alt-text & captions related skills"}', 922, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 923, 'l-access-easy-read-signage', '{"en": "Easy-read & signage"}', '{"en": "Easy-read & signage related skills"}', 923, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 924, 'l-access-cognitive-accessibility', '{"en": "Cognitive accessibility"}', '{"en": "Cognitive accessibility related skills"}', 924, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 925, 'l-access-readability-testing', '{"en": "Readability testing"}', '{"en": "Readability testing related skills"}', 925, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 926, 'l-access-inclusive-forms', '{"en": "Inclusive forms"}', '{"en": "Inclusive forms related skills"}', 926, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 927, 'l-access-screen-reader-checks', '{"en": "Screen reader checks"}', '{"en": "Screen reader checks related skills"}', 927, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 115, 928, 'l-access-multilingual-access', '{"en": "Multilingual access"}', '{"en": "Multilingual access related skills"}', 928, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 929, 'l-public-speechcraft-structure', '{"en": "Speechcraft & structure"}', '{"en": "Speechcraft & structure related skills"}', 929, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 930, 'l-public-persuasion-techniques', '{"en": "Persuasion techniques"}', '{"en": "Persuasion techniques related skills"}', 930, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 931, 'l-public-debate-formats', '{"en": "Debate formats"}', '{"en": "Debate formats related skills"}', 931, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 932, 'l-public-media-interviews', '{"en": "Media interviews"}', '{"en": "Media interviews related skills"}', 932, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 933, 'l-public-panel-q-a', '{"en": "Panel & Q&A"}', '{"en": "Panel & Q&A related skills"}', 933, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 934, 'l-public-storytelling', '{"en": "Storytelling"}', '{"en": "Storytelling related skills"}', 934, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 935, 'l-public-stage-presence', '{"en": "Stage presence"}', '{"en": "Stage presence related skills"}', 935, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 116, 936, 'l-public-rehearsal-feedback', '{"en": "Rehearsal & feedback"}', '{"en": "Rehearsal & feedback related skills"}', 936, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 937, 'l-cust-greeting-triage', '{"en": "Greeting & triage"}', '{"en": "Greeting & triage related skills"}', 937, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 938, 'l-cust-chat-email', '{"en": "Chat & email"}', '{"en": "Chat & email related skills"}', 938, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 939, 'l-cust-phone-voice', '{"en": "Phone & voice"}', '{"en": "Phone & voice related skills"}', 939, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 940, 'l-cust-hand-offs-escalation', '{"en": "Hand-offs & escalation"}', '{"en": "Hand-offs & escalation related skills"}', 940, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 941, 'l-cust-knowledge-base-use', '{"en": "Knowledge base use"}', '{"en": "Knowledge base use related skills"}', 941, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 942, 'l-cust-surveys-voc', '{"en": "Surveys & VOC"}', '{"en": "Surveys & VOC related skills"}', 942, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 943, 'l-cust-crisis-communication', '{"en": "Crisis communication"}', '{"en": "Crisis communication related skills"}', 943, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (4, 117, 944, 'l-cust-service-recovery', '{"en": "Service recovery"}', '{"en": "Service recovery related skills"}', 944, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 945, 'm-pmbok-scope-schedule-cost', '{"en": "Scope, schedule & cost"}', '{"en": "Scope, schedule & cost related skills"}', 945, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 946, 'm-pmbok-risk-issue-mgmt', '{"en": "Risk & issue mgmt"}', '{"en": "Risk & issue mgmt related skills"}', 946, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 947, 'm-pmbok-stakeholder-engagement', '{"en": "Stakeholder engagement"}', '{"en": "Stakeholder engagement related skills"}', 947, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 948, 'm-pmbok-benefits-realization', '{"en": "Benefits realization"}', '{"en": "Benefits realization related skills"}', 948, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 949, 'm-pmbok-governance-gates', '{"en": "Governance & gates"}', '{"en": "Governance & gates related skills"}', 949, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 950, 'm-pmbok-resource-capacity', '{"en": "Resource & capacity"}', '{"en": "Resource & capacity related skills"}', 950, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 951, 'm-pmbok-portfolio-prioritization', '{"en": "Portfolio prioritization"}', '{"en": "Portfolio prioritization related skills"}', 951, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 118, 952, 'm-pmbok-lessons-learned', '{"en": "Lessons learned"}', '{"en": "Lessons learned related skills"}', 952, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 953, 'm-agile-scrum-events-roles', '{"en": "Scrum events & roles"}', '{"en": "Scrum events & roles related skills"}', 953, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 954, 'm-agile-kanban-flow-wip', '{"en": "Kanban flow & WIP"}', '{"en": "Kanban flow & WIP related skills"}', 954, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 955, 'm-agile-estimation-planning', '{"en": "Estimation & planning"}', '{"en": "Estimation & planning related skills"}', 955, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 956, 'm-agile-metrics-improvement', '{"en": "Metrics & improvement"}', '{"en": "Metrics & improvement related skills"}', 956, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 957, 'm-agile-scaling-less-safe', '{"en": "Scaling (LeSS, SAFe)"}', '{"en": "Scaling (LeSS, SAFe) related skills"}', 957, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 958, 'm-agile-product-ownership', '{"en": "Product ownership"}', '{"en": "Product ownership related skills"}', 958, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 959, 'm-agile-devxp-practices', '{"en": "DevXP practices"}', '{"en": "DevXP practices related skills"}', 959, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 119, 960, 'm-agile-coaching-facilitation', '{"en": "Coaching & facilitation"}', '{"en": "Coaching & facilitation related skills"}', 960, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 961, 'm-prod-opportunity-discovery', '{"en": "Opportunity discovery"}', '{"en": "Opportunity discovery related skills"}', 961, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 962, 'm-prod-prototyping-tests', '{"en": "Prototyping & tests"}', '{"en": "Prototyping & tests related skills"}', 962, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 963, 'm-prod-prioritization-models', '{"en": "Prioritization models"}', '{"en": "Prioritization models related skills"}', 963, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 964, 'm-prod-roadmaps-bets', '{"en": "Roadmaps & bets"}', '{"en": "Roadmaps & bets related skills"}', 964, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 965, 'm-prod-delivery-cadence', '{"en": "Delivery cadence"}', '{"en": "Delivery cadence related skills"}', 965, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 966, 'm-prod-outcomes-measures', '{"en": "Outcomes & measures"}', '{"en": "Outcomes & measures related skills"}', 966, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 967, 'm-prod-launch-comms', '{"en": "Launch & comms"}', '{"en": "Launch & comms related skills"}', 967, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 120, 968, 'm-prod-post-launch-learning', '{"en": "Post-launch learning"}', '{"en": "Post-launch learning related skills"}', 968, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 969, 'm-lean-value-stream-mapping', '{"en": "Value stream mapping"}', '{"en": "Value stream mapping related skills"}', 969, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 970, 'm-lean-waste-identification', '{"en": "Waste identification"}', '{"en": "Waste identification related skills"}', 970, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 971, 'm-lean-standard-work-5s', '{"en": "Standard work & 5S"}', '{"en": "Standard work & 5S related skills"}', 971, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 972, 'm-lean-visual-management', '{"en": "Visual management"}', '{"en": "Visual management related skills"}', 972, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 973, 'm-lean-flow-pull', '{"en": "Flow & pull"}', '{"en": "Flow & pull related skills"}', 973, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 974, 'm-lean-kaizen-kata', '{"en": "Kaizen & kata"}', '{"en": "Kaizen & kata related skills"}', 974, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 975, 'm-lean-problem-solving-a3', '{"en": "Problem solving (A3)"}', '{"en": "Problem solving (A3) related skills"}', 975, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 121, 976, 'm-lean-leader-standard-work', '{"en": "Leader standard work"}', '{"en": "Leader standard work related skills"}', 976, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 977, 'm-six-dmaic-lifecycle', '{"en": "DMAIC lifecycle"}', '{"en": "DMAIC lifecycle related skills"}', 977, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 978, 'm-six-voice-of-customer', '{"en": "Voice of customer"}', '{"en": "Voice of customer related skills"}', 978, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 979, 'm-six-measurement-systems', '{"en": "Measurement systems"}', '{"en": "Measurement systems related skills"}', 979, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 980, 'm-six-doe-regression', '{"en": "DOE & regression"}', '{"en": "DOE & regression related skills"}', 980, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 981, 'm-six-control-charts', '{"en": "Control charts"}', '{"en": "Control charts related skills"}', 981, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 982, 'm-six-capability-analysis', '{"en": "Capability analysis"}', '{"en": "Capability analysis related skills"}', 982, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 983, 'm-six-project-selection', '{"en": "Project selection"}', '{"en": "Project selection related skills"}', 983, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 122, 984, 'm-six-sustain-control', '{"en": "Sustain & control"}', '{"en": "Sustain & control related skills"}', 984, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 985, 'm-bpm-discovery-mapping', '{"en": "Discovery & mapping"}', '{"en": "Discovery & mapping related skills"}', 985, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 986, 'm-bpm-modeling-bpmn', '{"en": "Modeling (BPMN)"}', '{"en": "Modeling (BPMN) related skills"}', 986, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 987, 'm-bpm-automation-rpa', '{"en": "Automation & RPA"}', '{"en": "Automation & RPA related skills"}', 987, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 988, 'm-bpm-controls-compliance', '{"en": "Controls & compliance"}', '{"en": "Controls & compliance related skills"}', 988, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 989, 'm-bpm-slas-monitoring', '{"en": "SLAs & monitoring"}', '{"en": "SLAs & monitoring related skills"}', 989, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 990, 'm-bpm-continuous-improvement', '{"en": "Continuous improvement"}', '{"en": "Continuous improvement related skills"}', 990, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 991, 'm-bpm-change-mgmt', '{"en": "Change mgmt"}', '{"en": "Change mgmt related skills"}', 991, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 123, 992, 'm-bpm-process-ownership', '{"en": "Process ownership"}', '{"en": "Process ownership related skills"}', 992, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 993, 'm-research-design-sampling', '{"en": "Design & sampling"}', '{"en": "Design & sampling related skills"}', 993, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 994, 'm-research-surveys-interviews', '{"en": "Surveys & interviews"}', '{"en": "Surveys & interviews related skills"}', 994, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 995, 'm-research-experiments-quasi', '{"en": "Experiments & quasi"}', '{"en": "Experiments & quasi related skills"}', 995, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 996, 'm-research-qualitative-analysis', '{"en": "Qualitative analysis"}', '{"en": "Qualitative analysis related skills"}', 996, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 997, 'm-research-quantitative-analysis', '{"en": "Quantitative analysis"}', '{"en": "Quantitative analysis related skills"}', 997, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 998, 'm-research-ethics-irb', '{"en": "Ethics & IRB"}', '{"en": "Ethics & IRB related skills"}', 998, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 999, 'm-research-reproducibility', '{"en": "Reproducibility"}', '{"en": "Reproducibility related skills"}', 999, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 124, 1000, 'm-research-reporting-artifacts', '{"en": "Reporting & artifacts"}', '{"en": "Reporting & artifacts related skills"}', 1000, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1001, 'm-ux-planning-recruitment', '{"en": "Planning & recruitment"}', '{"en": "Planning & recruitment related skills"}', 1001, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1002, 'm-ux-generative-research', '{"en": "Generative research"}', '{"en": "Generative research related skills"}', 1002, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1003, 'm-ux-evaluative-testing', '{"en": "Evaluative testing"}', '{"en": "Evaluative testing related skills"}', 1003, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1004, 'm-ux-ia-navigation', '{"en": "IA & navigation"}', '{"en": "IA & navigation related skills"}', 1004, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1005, 'm-ux-interaction-flows', '{"en": "Interaction & flows"}', '{"en": "Interaction & flows related skills"}', 1005, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1006, 'm-ux-visual-motion', '{"en": "Visual & motion"}', '{"en": "Visual & motion related skills"}', 1006, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1007, 'm-ux-accessibility-wcag', '{"en": "Accessibility & WCAG"}', '{"en": "Accessibility & WCAG related skills"}', 1007, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 125, 1008, 'm-ux-handoff-qa', '{"en": "Handoff & QA"}', '{"en": "Handoff & QA related skills"}', 1008, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1009, 'm-data-problem-framing', '{"en": "Problem framing"}', '{"en": "Problem framing related skills"}', 1009, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1010, 'm-data-data-prep-feature-eng', '{"en": "Data prep & feature eng"}', '{"en": "Data prep & feature eng related skills"}', 1010, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1011, 'm-data-modeling-validation', '{"en": "Modeling & validation"}', '{"en": "Modeling & validation related skills"}', 1011, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1012, 'm-data-evaluation-metrics', '{"en": "Evaluation & metrics"}', '{"en": "Evaluation & metrics related skills"}', 1012, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1013, 'm-data-reproducibility-mlops', '{"en": "Reproducibility & MLops"}', '{"en": "Reproducibility & MLops related skills"}', 1013, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1014, 'm-data-experimentation', '{"en": "Experimentation"}', '{"en": "Experimentation related skills"}', 1014, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1015, 'm-data-documentation', '{"en": "Documentation"}', '{"en": "Documentation related skills"}', 1015, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 126, 1016, 'm-data-deployment-monitoring', '{"en": "Deployment & monitoring"}', '{"en": "Deployment & monitoring related skills"}', 1016, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1017, 'm-mlops-versioning-lineage', '{"en": "Versioning & lineage"}', '{"en": "Versioning & lineage related skills"}', 1017, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1018, 'm-mlops-ci-cd-for-ml', '{"en": "CI/CD for ML"}', '{"en": "CI/CD for ML related skills"}', 1018, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1019, 'm-mlops-bias-fairness', '{"en": "Bias & fairness"}', '{"en": "Bias & fairness related skills"}', 1019, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1020, 'm-mlops-explainability', '{"en": "Explainability"}', '{"en": "Explainability related skills"}', 1020, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1021, 'm-mlops-monitoring-drift', '{"en": "Monitoring & drift"}', '{"en": "Monitoring & drift related skills"}', 1021, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1022, 'm-mlops-incident-response', '{"en": "Incident response"}', '{"en": "Incident response related skills"}', 1022, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1023, 'm-mlops-approval-workflows', '{"en": "Approval workflows"}', '{"en": "Approval workflows related skills"}', 1023, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 127, 1024, 'm-mlops-model-registry', '{"en": "Model registry"}', '{"en": "Model registry related skills"}', 1024, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1025, 'm-sec-threat-risk', '{"en": "Threat & risk"}', '{"en": "Threat & risk related skills"}', 1025, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1026, 'm-sec-secure-sdlc', '{"en": "Secure SDLC"}', '{"en": "Secure SDLC related skills"}', 1026, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1027, 'm-sec-testing-response', '{"en": "Testing & response"}', '{"en": "Testing & response related skills"}', 1027, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1028, 'm-sec-privacy-by-design', '{"en": "Privacy by design"}', '{"en": "Privacy by design related skills"}', 1028, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1029, 'm-sec-data-retention-dpia', '{"en": "Data retention & DPIA"}', '{"en": "Data retention & DPIA related skills"}', 1029, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1030, 'm-sec-third-party-risk', '{"en": "Third-party risk"}', '{"en": "Third-party risk related skills"}', 1030, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1031, 'm-sec-policy-awareness', '{"en": "Policy & awareness"}', '{"en": "Policy & awareness related skills"}', 1031, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 128, 1032, 'm-sec-compliance-mapping', '{"en": "Compliance mapping"}', '{"en": "Compliance mapping related skills"}', 1032, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1033, 'm-qms-qms-documentation', '{"en": "QMS documentation"}', '{"en": "QMS documentation related skills"}', 1033, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1034, 'm-qms-training-competency', '{"en": "Training & competency"}', '{"en": "Training & competency related skills"}', 1034, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1035, 'm-qms-audits-capa', '{"en": "Audits & CAPA"}', '{"en": "Audits & CAPA related skills"}', 1035, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1036, 'm-qms-change-control', '{"en": "Change control"}', '{"en": "Change control related skills"}', 1036, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1037, 'm-qms-supplier-quality', '{"en": "Supplier quality"}', '{"en": "Supplier quality related skills"}', 1037, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1038, 'm-qms-calibration-msa', '{"en": "Calibration & MSA"}', '{"en": "Calibration & MSA related skills"}', 1038, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1039, 'm-qms-nonconformance', '{"en": "Nonconformance"}', '{"en": "Nonconformance related skills"}', 1039, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 129, 1040, 'm-qms-management-review', '{"en": "Management review"}', '{"en": "Management review related skills"}', 1040, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1041, 'm-gxp-glp-gmp-gcp-basics', '{"en": "GLP/GMP/GCP basics"}', '{"en": "GLP/GMP/GCP basics related skills"}', 1041, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1042, 'm-gxp-validation-qualification', '{"en": "Validation & qualification"}', '{"en": "Validation & qualification related skills"}', 1042, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1043, 'm-gxp-data-integrity-alcoa', '{"en": "Data integrity & ALCOA"}', '{"en": "Data integrity & ALCOA related skills"}', 1043, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1044, 'm-gxp-deviations-oos-oot', '{"en": "Deviations & OOS/OOT"}', '{"en": "Deviations & OOS/OOT related skills"}', 1044, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1045, 'm-gxp-batch-records-logbooks', '{"en": "Batch records & logbooks"}', '{"en": "Batch records & logbooks related skills"}', 1045, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1046, 'm-gxp-inspections-readiness', '{"en": "Inspections & readiness"}', '{"en": "Inspections & readiness related skills"}', 1046, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1047, 'm-gxp-tech-transfer', '{"en": "Tech transfer"}', '{"en": "Tech transfer related skills"}', 1047, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 130, 1048, 'm-gxp-capa-change', '{"en": "CAPA & change"}', '{"en": "CAPA & change related skills"}', 1048, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1049, 'm-hse-hazop-haccp', '{"en": "HAZOP & HACCP"}', '{"en": "HAZOP & HACCP related skills"}', 1049, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1050, 'm-hse-permits-controls', '{"en": "Permits & controls"}', '{"en": "Permits & controls related skills"}', 1050, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1051, 'm-hse-ergonomics', '{"en": "Ergonomics"}', '{"en": "Ergonomics related skills"}', 1051, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1052, 'm-hse-emergency-response', '{"en": "Emergency response"}', '{"en": "Emergency response related skills"}', 1052, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1053, 'm-hse-incident-investigation', '{"en": "Incident investigation"}', '{"en": "Incident investigation related skills"}', 1053, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1054, 'm-hse-environmental-aspects', '{"en": "Environmental aspects"}', '{"en": "Environmental aspects related skills"}', 1054, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1055, 'm-hse-training-drills', '{"en": "Training & drills"}', '{"en": "Training & drills related skills"}', 1055, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 131, 1056, 'm-hse-contractor-mgmt', '{"en": "Contractor mgmt"}', '{"en": "Contractor mgmt related skills"}', 1056, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1057, 'm-risk-identification-taxonomy', '{"en": "Identification & taxonomy"}', '{"en": "Identification & taxonomy related skills"}', 1057, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1058, 'm-risk-analysis-scoring', '{"en": "Analysis & scoring"}', '{"en": "Analysis & scoring related skills"}', 1058, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1059, 'm-risk-fmea-bow-tie', '{"en": "FMEA & bow-tie"}', '{"en": "FMEA & bow-tie related skills"}', 1059, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1060, 'm-risk-treatment-mitigation', '{"en": "Treatment & mitigation"}', '{"en": "Treatment & mitigation related skills"}', 1060, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1061, 'm-risk-monitoring-kris', '{"en": "Monitoring & KRIs"}', '{"en": "Monitoring & KRIs related skills"}', 1061, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1062, 'm-risk-risk-appetite', '{"en": "Risk appetite"}', '{"en": "Risk appetite related skills"}', 1062, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1063, 'm-risk-scenario-planning', '{"en": "Scenario planning"}', '{"en": "Scenario planning related skills"}', 1063, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 132, 1064, 'm-risk-reporting', '{"en": "Reporting"}', '{"en": "Reporting related skills"}', 1064, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1065, 'm-audit-planning-scope', '{"en": "Planning & scope"}', '{"en": "Planning & scope related skills"}', 1065, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1066, 'm-audit-evidence-gathering', '{"en": "Evidence gathering"}', '{"en": "Evidence gathering related skills"}', 1066, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1067, 'm-audit-testing-sampling', '{"en": "Testing & sampling"}', '{"en": "Testing & sampling related skills"}', 1067, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1068, 'm-audit-reporting-remediation', '{"en": "Reporting & remediation"}', '{"en": "Reporting & remediation related skills"}', 1068, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1069, 'm-audit-follow-up-closure', '{"en": "Follow-up & closure"}', '{"en": "Follow-up & closure related skills"}', 1069, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1070, 'm-audit-independence-ethics', '{"en": "Independence & ethics"}', '{"en": "Independence & ethics related skills"}', 1070, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1071, 'm-audit-continuous-auditing', '{"en": "Continuous auditing"}', '{"en": "Continuous auditing related skills"}', 1071, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 133, 1072, 'm-audit-analytics-in-audit', '{"en": "Analytics in audit"}', '{"en": "Analytics in audit related skills"}', 1072, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1073, 'm-fin-budget-variance', '{"en": "Budget & variance"}', '{"en": "Budget & variance related skills"}', 1073, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1074, 'm-fin-forecasting-models', '{"en": "Forecasting & models"}', '{"en": "Forecasting & models related skills"}', 1074, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1075, 'm-fin-capital-allocation', '{"en": "Capital allocation"}', '{"en": "Capital allocation related skills"}', 1075, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1076, 'm-fin-working-capital', '{"en": "Working capital"}', '{"en": "Working capital related skills"}', 1076, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1077, 'm-fin-costing-methods', '{"en": "Costing methods"}', '{"en": "Costing methods related skills"}', 1077, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1078, 'm-fin-investment-appraisal', '{"en": "Investment appraisal"}', '{"en": "Investment appraisal related skills"}', 1078, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1079, 'm-fin-close-consolidation', '{"en": "Close & consolidation"}', '{"en": "Close & consolidation related skills"}', 1079, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 134, 1080, 'm-fin-controls-reconciliations', '{"en": "Controls & reconciliations"}', '{"en": "Controls & reconciliations related skills"}', 1080, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1081, 'm-proc-category-planning', '{"en": "Category planning"}', '{"en": "Category planning related skills"}', 1081, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1082, 'm-proc-rfx-evaluation', '{"en": "RFx & evaluation"}', '{"en": "RFx & evaluation related skills"}', 1082, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1083, 'm-proc-negotiation-strategy', '{"en": "Negotiation strategy"}', '{"en": "Negotiation strategy related skills"}', 1083, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1084, 'm-proc-srm-scorecards', '{"en": "SRM & scorecards"}', '{"en": "SRM & scorecards related skills"}', 1084, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1085, 'm-proc-risk-sustainability', '{"en": "Risk & sustainability"}', '{"en": "Risk & sustainability related skills"}', 1085, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1086, 'm-proc-contract-mgmt', '{"en": "Contract mgmt"}', '{"en": "Contract mgmt related skills"}', 1086, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1087, 'm-proc-savings-tracking', '{"en": "Savings tracking"}', '{"en": "Savings tracking related skills"}', 1087, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 135, 1088, 'm-proc-compliance-audits', '{"en": "Compliance & audits"}', '{"en": "Compliance & audits related skills"}', 1088, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1089, 'm-sales-discovery-qualification', '{"en": "Discovery & qualification"}', '{"en": "Discovery & qualification related skills"}', 1089, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1090, 'm-sales-objection-handling', '{"en": "Objection handling"}', '{"en": "Objection handling related skills"}', 1090, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1091, 'm-sales-demo-proof', '{"en": "Demo & proof"}', '{"en": "Demo & proof related skills"}', 1091, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1092, 'm-sales-proposal-pricing', '{"en": "Proposal & pricing"}', '{"en": "Proposal & pricing related skills"}', 1092, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1093, 'm-sales-closing-strategies', '{"en": "Closing strategies"}', '{"en": "Closing strategies related skills"}', 1093, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1094, 'm-sales-mutual-action-plans', '{"en": "Mutual action plans"}', '{"en": "Mutual action plans related skills"}', 1094, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1095, 'm-sales-account-planning', '{"en": "Account planning"}', '{"en": "Account planning related skills"}', 1095, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 136, 1096, 'm-sales-post-sale-expansion', '{"en": "Post-sale expansion"}', '{"en": "Post-sale expansion related skills"}', 1096, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1097, 'm-mktg-positioning-messaging', '{"en": "Positioning & messaging"}', '{"en": "Positioning & messaging related skills"}', 1097, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1098, 'm-mktg-experiment-design', '{"en": "Experiment design"}', '{"en": "Experiment design related skills"}', 1098, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1099, 'm-mktg-attribution-mmm', '{"en": "Attribution & MMM"}', '{"en": "Attribution & MMM related skills"}', 1099, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1100, 'm-mktg-community-advocacy', '{"en": "Community & advocacy"}', '{"en": "Community & advocacy related skills"}', 1100, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1101, 'm-mktg-lifecycle-crm', '{"en": "Lifecycle & CRM"}', '{"en": "Lifecycle & CRM related skills"}', 1101, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1102, 'm-mktg-content-seo-sem', '{"en": "Content & SEO/SEM"}', '{"en": "Content & SEO/SEM related skills"}', 1102, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1103, 'm-mktg-product-led-growth', '{"en": "Product-led growth"}', '{"en": "Product-led growth related skills"}', 1103, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 137, 1104, 'm-mktg-brand-tracking', '{"en": "Brand tracking"}', '{"en": "Brand tracking related skills"}', 1104, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1105, 'm-ops-incident-problem-change', '{"en": "Incident/problem/change"}', '{"en": "Incident/problem/change related skills"}', 1105, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1106, 'm-ops-sre-slos', '{"en": "SRE & SLOs"}', '{"en": "SRE & SLOs related skills"}', 1106, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1107, 'm-ops-postmortems-blameless', '{"en": "Postmortems & blameless"}', '{"en": "Postmortems & blameless related skills"}', 1107, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1108, 'm-ops-cmdb-config', '{"en": "CMDB & config"}', '{"en": "CMDB & config related skills"}', 1108, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1109, 'm-ops-release-cab', '{"en": "Release & CAB"}', '{"en": "Release & CAB related skills"}', 1109, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1110, 'm-ops-runbooks-playbooks', '{"en": "Runbooks & playbooks"}', '{"en": "Runbooks & playbooks related skills"}', 1110, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1111, 'm-ops-capacity-dr', '{"en": "Capacity & DR"}', '{"en": "Capacity & DR related skills"}', 1111, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 138, 1112, 'm-ops-request-catalog', '{"en": "Request & catalog"}', '{"en": "Request & catalog related skills"}', 1112, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1113, 'm-dev-code-review-patterns', '{"en": "Code review & patterns"}', '{"en": "Code review & patterns related skills"}', 1113, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1114, 'm-dev-testing-strategy', '{"en": "Testing strategy"}', '{"en": "Testing strategy related skills"}', 1114, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1115, 'm-dev-performance-security', '{"en": "Performance & security"}', '{"en": "Performance & security related skills"}', 1115, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1116, 'm-dev-documentation-standards', '{"en": "Documentation standards"}', '{"en": "Documentation standards related skills"}', 1116, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1117, 'm-dev-observability', '{"en": "Observability"}', '{"en": "Observability related skills"}', 1117, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1118, 'm-dev-feature-flags', '{"en": "Feature flags"}', '{"en": "Feature flags related skills"}', 1118, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1119, 'm-dev-debt-mgmt', '{"en": "Debt mgmt"}', '{"en": "Debt mgmt related skills"}', 1119, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 139, 1120, 'm-dev-delivery-practices', '{"en": "Delivery practices"}', '{"en": "Delivery practices related skills"}', 1120, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1121, 'm-devops-pipelines-iac', '{"en": "Pipelines & IaC"}', '{"en": "Pipelines & IaC related skills"}', 1121, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1122, 'm-devops-blue-green-canary', '{"en": "Blue/green & canary"}', '{"en": "Blue/green & canary related skills"}', 1122, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1123, 'm-devops-feature-toggles', '{"en": "Feature toggles"}', '{"en": "Feature toggles related skills"}', 1123, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1124, 'm-devops-observability-tracing', '{"en": "Observability & tracing"}', '{"en": "Observability & tracing related skills"}', 1124, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1125, 'm-devops-reliability-rollback', '{"en": "Reliability & rollback"}', '{"en": "Reliability & rollback related skills"}', 1125, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1126, 'm-devops-security-gates', '{"en": "Security gates"}', '{"en": "Security gates related skills"}', 1126, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1127, 'm-devops-release-governance', '{"en": "Release governance"}', '{"en": "Release governance related skills"}', 1127, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 140, 1128, 'm-devops-post-release-reviews', '{"en": "Post-release reviews"}', '{"en": "Post-release reviews related skills"}', 1128, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1129, 'm-edu-objectives-outcomes', '{"en": "Objectives & outcomes"}', '{"en": "Objectives & outcomes related skills"}', 1129, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1130, 'm-edu-chunking-pacing', '{"en": "Chunking & pacing"}', '{"en": "Chunking & pacing related skills"}', 1130, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1131, 'm-edu-assessment-analytics', '{"en": "Assessment & analytics"}', '{"en": "Assessment & analytics related skills"}', 1131, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1132, 'm-edu-accessibility-udl', '{"en": "Accessibility & UDL"}', '{"en": "Accessibility & UDL related skills"}', 1132, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1133, 'm-edu-peer-learning-feedback', '{"en": "Peer learning & feedback"}', '{"en": "Peer learning & feedback related skills"}', 1133, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1134, 'm-edu-media-interactivity', '{"en": "Media & interactivity"}', '{"en": "Media & interactivity related skills"}', 1134, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1135, 'm-edu-facilitation-guides', '{"en": "Facilitation guides"}', '{"en": "Facilitation guides related skills"}', 1135, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 141, 1136, 'm-edu-course-evaluation', '{"en": "Course evaluation"}', '{"en": "Course evaluation related skills"}', 1136, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1137, 'm-hr-competencies-levelling', '{"en": "Competencies & levelling"}', '{"en": "Competencies & levelling related skills"}', 1137, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1138, 'm-hr-hiring-selection', '{"en": "Hiring & selection"}', '{"en": "Hiring & selection related skills"}', 1138, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1139, 'm-hr-onboarding-ramp', '{"en": "Onboarding & ramp"}', '{"en": "Onboarding & ramp related skills"}', 1139, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1140, 'm-hr-performance-feedback', '{"en": "Performance & feedback"}', '{"en": "Performance & feedback related skills"}', 1140, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1141, 'm-hr-succession-mobility', '{"en": "Succession & mobility"}', '{"en": "Succession & mobility related skills"}', 1141, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1142, 'm-hr-listening-engagement', '{"en": "Listening & engagement"}', '{"en": "Listening & engagement related skills"}', 1142, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1143, 'm-hr-rewards-recognition', '{"en": "Rewards & recognition"}', '{"en": "Rewards & recognition related skills"}', 1143, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 142, 1144, 'm-hr-er-policy', '{"en": "ER & policy"}', '{"en": "ER & policy related skills"}', 1144, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1145, 'm-legal-issue-spotting', '{"en": "Issue spotting"}', '{"en": "Issue spotting related skills"}', 1145, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1146, 'm-legal-research-memo', '{"en": "Research & memo"}', '{"en": "Research & memo related skills"}', 1146, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1147, 'm-legal-discovery-evidence', '{"en": "Discovery & evidence"}', '{"en": "Discovery & evidence related skills"}', 1147, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1148, 'm-legal-negotiation-settlement', '{"en": "Negotiation & settlement"}', '{"en": "Negotiation & settlement related skills"}', 1148, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1149, 'm-legal-compliance-mapping', '{"en": "Compliance mapping"}', '{"en": "Compliance mapping related skills"}', 1149, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1150, 'm-legal-litigation-support', '{"en": "Litigation support"}', '{"en": "Litigation support related skills"}', 1150, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1151, 'm-legal-contract-lifecycle', '{"en": "Contract lifecycle"}', '{"en": "Contract lifecycle related skills"}', 1151, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 143, 1152, 'm-legal-ethics-privilege', '{"en": "Ethics & privilege"}', '{"en": "Ethics & privilege related skills"}', 1152, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1153, 'm-negot-workshop-design', '{"en": "Workshop design"}', '{"en": "Workshop design related skills"}', 1153, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1154, 'm-negot-decision-methods', '{"en": "Decision methods"}', '{"en": "Decision methods related skills"}', 1154, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1155, 'm-negot-visual-facilitation', '{"en": "Visual facilitation"}', '{"en": "Visual facilitation related skills"}', 1155, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1156, 'm-negot-retros-reviews', '{"en": "Retros & reviews"}', '{"en": "Retros & reviews related skills"}', 1156, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1157, 'm-negot-conflict-mediation', '{"en": "Conflict mediation"}', '{"en": "Conflict mediation related skills"}', 1157, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1158, 'm-negot-consensus-building', '{"en": "Consensus building"}', '{"en": "Consensus building related skills"}', 1158, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1159, 'm-negot-large-group-methods', '{"en": "Large-group methods"}', '{"en": "Large-group methods related skills"}', 1159, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 144, 1160, 'm-negot-hybrid-facilitation', '{"en": "Hybrid facilitation"}', '{"en": "Hybrid facilitation related skills"}', 1160, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1161, 'm-lca-ghg-accounting', '{"en": "GHG accounting"}', '{"en": "GHG accounting related skills"}', 1161, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1162, 'm-lca-lca-footprint', '{"en": "LCA & footprint"}', '{"en": "LCA & footprint related skills"}', 1162, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1163, 'm-lca-materiality-sbti', '{"en": "Materiality & SBTi"}', '{"en": "Materiality & SBTi related skills"}', 1163, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1164, 'm-lca-supplier-audits', '{"en": "Supplier audits"}', '{"en": "Supplier audits related skills"}', 1164, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1165, 'm-lca-reporting-gri-csrd', '{"en": "Reporting (GRI/CSRD)"}', '{"en": "Reporting (GRI/CSRD) related skills"}', 1165, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1166, 'm-lca-offsets-removals', '{"en": "Offsets & removals"}', '{"en": "Offsets & removals related skills"}', 1166, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1167, 'm-lca-risk-adaptation', '{"en": "Risk & adaptation"}', '{"en": "Risk & adaptation related skills"}', 1167, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 145, 1168, 'm-lca-circularity-metrics', '{"en": "Circularity metrics"}', '{"en": "Circularity metrics related skills"}', 1168, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1169, 'm-bim-coordination-clash', '{"en": "Coordination & clash"}', '{"en": "Coordination & clash related skills"}', 1169, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1170, 'm-bim-4d-5d-cde', '{"en": "4D/5D & CDE"}', '{"en": "4D/5D & CDE related skills"}', 1170, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1171, 'm-bim-quantity-take-off', '{"en": "Quantity take-off"}', '{"en": "Quantity take-off related skills"}', 1171, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1172, 'm-bim-field-capture', '{"en": "Field capture"}', '{"en": "Field capture related skills"}', 1172, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1173, 'm-bim-rfi-submittals', '{"en": "RFI & submittals"}', '{"en": "RFI & submittals related skills"}', 1173, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1174, 'm-bim-as-built-turnover', '{"en": "As-built & turnover"}', '{"en": "As-built & turnover related skills"}', 1174, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1175, 'm-bim-model-standards', '{"en": "Model standards"}', '{"en": "Model standards related skills"}', 1175, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (5, 146, 1176, 'm-bim-bim-execution-plans', '{"en": "BIM execution plans"}', '{"en": "BIM execution plans related skills"}', 1176, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1177, 'd-math-algebra-geometry', '{"en": "Algebra & geometry"}', '{"en": "Algebra & geometry related skills"}', 1177, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1178, 'd-math-calculus-analysis', '{"en": "Calculus & analysis"}', '{"en": "Calculus & analysis related skills"}', 1178, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1179, 'd-math-linear-algebra', '{"en": "Linear algebra"}', '{"en": "Linear algebra related skills"}', 1179, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1180, 'd-math-discrete-math', '{"en": "Discrete math"}', '{"en": "Discrete math related skills"}', 1180, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1181, 'd-math-optimization', '{"en": "Optimization"}', '{"en": "Optimization related skills"}', 1181, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1182, 'd-math-probability-theory', '{"en": "Probability theory"}', '{"en": "Probability theory related skills"}', 1182, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1183, 'd-math-number-theory', '{"en": "Number theory"}', '{"en": "Number theory related skills"}', 1183, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 147, 1184, 'd-math-logic-proofs', '{"en": "Logic & proofs"}', '{"en": "Logic & proofs related skills"}', 1184, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1185, 'd-stat-descriptive-inference', '{"en": "Descriptive & inference"}', '{"en": "Descriptive & inference related skills"}', 1185, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1186, 'd-stat-regression-glm', '{"en": "Regression & GLM"}', '{"en": "Regression & GLM related skills"}', 1186, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1187, 'd-stat-time-series', '{"en": "Time series"}', '{"en": "Time series related skills"}', 1187, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1188, 'd-stat-bayesian-methods', '{"en": "Bayesian methods"}', '{"en": "Bayesian methods related skills"}', 1188, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1189, 'd-stat-experimental-design', '{"en": "Experimental design"}', '{"en": "Experimental design related skills"}', 1189, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1190, 'd-stat-multivariate-analysis', '{"en": "Multivariate analysis"}', '{"en": "Multivariate analysis related skills"}', 1190, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1191, 'd-stat-sampling-surveys', '{"en": "Sampling & surveys"}', '{"en": "Sampling & surveys related skills"}', 1191, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 148, 1192, 'd-stat-nonparametrics', '{"en": "Nonparametrics"}', '{"en": "Nonparametrics related skills"}', 1192, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1193, 'd-cs-data-structures-algorithms', '{"en": "Data structures & algorithms"}', '{"en": "Data structures & algorithms related skills"}', 1193, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1194, 'd-cs-operating-systems', '{"en": "Operating systems"}', '{"en": "Operating systems related skills"}', 1194, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1195, 'd-cs-databases', '{"en": "Databases"}', '{"en": "Databases related skills"}', 1195, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1196, 'd-cs-networks-protocols', '{"en": "Networks & protocols"}', '{"en": "Networks & protocols related skills"}', 1196, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1197, 'd-cs-distributed-systems', '{"en": "Distributed systems"}', '{"en": "Distributed systems related skills"}', 1197, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1198, 'd-cs-compilers-pl', '{"en": "Compilers & PL"}', '{"en": "Compilers & PL related skills"}', 1198, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1199, 'd-cs-theory-automata', '{"en": "Theory & automata"}', '{"en": "Theory & automata related skills"}', 1199, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 149, 1200, 'd-cs-security-crypto-basics', '{"en": "Security & crypto basics"}', '{"en": "Security & crypto basics related skills"}', 1200, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1201, 'd-phys-mechanics', '{"en": "Mechanics"}', '{"en": "Mechanics related skills"}', 1201, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1202, 'd-phys-thermodynamics', '{"en": "Thermodynamics"}', '{"en": "Thermodynamics related skills"}', 1202, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1203, 'd-phys-electromagnetism', '{"en": "Electromagnetism"}', '{"en": "Electromagnetism related skills"}', 1203, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1204, 'd-phys-optics', '{"en": "Optics"}', '{"en": "Optics related skills"}', 1204, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1205, 'd-phys-quantum-mechanics', '{"en": "Quantum mechanics"}', '{"en": "Quantum mechanics related skills"}', 1205, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1206, 'd-phys-condensed-matter', '{"en": "Condensed matter"}', '{"en": "Condensed matter related skills"}', 1206, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1207, 'd-phys-nuclear-particle', '{"en": "Nuclear & particle"}', '{"en": "Nuclear & particle related skills"}', 1207, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 150, 1208, 'd-phys-astrophysics', '{"en": "Astrophysics"}', '{"en": "Astrophysics related skills"}', 1208, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1209, 'd-chem-organic-chemistry', '{"en": "Organic chemistry"}', '{"en": "Organic chemistry related skills"}', 1209, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1210, 'd-chem-inorganic-chemistry', '{"en": "Inorganic chemistry"}', '{"en": "Inorganic chemistry related skills"}', 1210, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1211, 'd-chem-physical-chemistry', '{"en": "Physical chemistry"}', '{"en": "Physical chemistry related skills"}', 1211, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1212, 'd-chem-analytical-chemistry', '{"en": "Analytical chemistry"}', '{"en": "Analytical chemistry related skills"}', 1212, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1213, 'd-chem-materials-chemistry', '{"en": "Materials chemistry"}', '{"en": "Materials chemistry related skills"}', 1213, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1214, 'd-chem-electrochemistry', '{"en": "Electrochemistry"}', '{"en": "Electrochemistry related skills"}', 1214, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1215, 'd-chem-spectroscopy', '{"en": "Spectroscopy"}', '{"en": "Spectroscopy related skills"}', 1215, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 151, 1216, 'd-chem-crystallography', '{"en": "Crystallography"}', '{"en": "Crystallography related skills"}', 1216, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1217, 'd-bio-cell-biology', '{"en": "Cell biology"}', '{"en": "Cell biology related skills"}', 1217, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1218, 'd-bio-genetics-genomics', '{"en": "Genetics & genomics"}', '{"en": "Genetics & genomics related skills"}', 1218, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1219, 'd-bio-molecular-biology', '{"en": "Molecular biology"}', '{"en": "Molecular biology related skills"}', 1219, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1220, 'd-bio-microbiology', '{"en": "Microbiology"}', '{"en": "Microbiology related skills"}', 1220, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1221, 'd-bio-physiology', '{"en": "Physiology"}', '{"en": "Physiology related skills"}', 1221, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1222, 'd-bio-ecology-evolution', '{"en": "Ecology & evolution"}', '{"en": "Ecology & evolution related skills"}', 1222, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1223, 'd-bio-developmental-biology', '{"en": "Developmental biology"}', '{"en": "Developmental biology related skills"}', 1223, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 152, 1224, 'd-bio-systems-biology', '{"en": "Systems biology"}', '{"en": "Systems biology related skills"}', 1224, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1225, 'd-earth-geology-petrology', '{"en": "Geology & petrology"}', '{"en": "Geology & petrology related skills"}', 1225, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1226, 'd-earth-hydrology', '{"en": "Hydrology"}', '{"en": "Hydrology related skills"}', 1226, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1227, 'd-earth-meteorology-climate', '{"en": "Meteorology & climate"}', '{"en": "Meteorology & climate related skills"}', 1227, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1228, 'd-earth-oceanography', '{"en": "Oceanography"}', '{"en": "Oceanography related skills"}', 1228, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1229, 'd-earth-geophysics', '{"en": "Geophysics"}', '{"en": "Geophysics related skills"}', 1229, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1230, 'd-earth-soils-geomorphology', '{"en": "Soils & geomorphology"}', '{"en": "Soils & geomorphology related skills"}', 1230, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1231, 'd-earth-remote-sensing', '{"en": "Remote sensing"}', '{"en": "Remote sensing related skills"}', 1231, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 153, 1232, 'd-earth-environmental-change', '{"en": "Environmental change"}', '{"en": "Environmental change related skills"}', 1232, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1233, 'd-mats-structure-properties', '{"en": "Structure & properties"}', '{"en": "Structure & properties related skills"}', 1233, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1234, 'd-mats-phase-diagrams', '{"en": "Phase diagrams"}', '{"en": "Phase diagrams related skills"}', 1234, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1235, 'd-mats-polymers-composites', '{"en": "Polymers & composites"}', '{"en": "Polymers & composites related skills"}', 1235, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1236, 'd-mats-ceramics-glasses', '{"en": "Ceramics & glasses"}', '{"en": "Ceramics & glasses related skills"}', 1236, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1237, 'd-mats-metals-alloys', '{"en": "Metals & alloys"}', '{"en": "Metals & alloys related skills"}', 1237, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1238, 'd-mats-failure-fatigue', '{"en": "Failure & fatigue"}', '{"en": "Failure & fatigue related skills"}', 1238, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1239, 'd-mats-surface-corrosion', '{"en": "Surface & corrosion"}', '{"en": "Surface & corrosion related skills"}', 1239, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 154, 1240, 'd-mats-processing-fabrication', '{"en": "Processing & fabrication"}', '{"en": "Processing & fabrication related skills"}', 1240, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1241, 'd-mech-statics-dynamics', '{"en": "Statics & dynamics"}', '{"en": "Statics & dynamics related skills"}', 1241, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1242, 'd-mech-mechanics-of-materials', '{"en": "Mechanics of materials"}', '{"en": "Mechanics of materials related skills"}', 1242, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1243, 'd-mech-thermal-fluids', '{"en": "Thermal & fluids"}', '{"en": "Thermal & fluids related skills"}', 1243, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1244, 'd-mech-machine-design', '{"en": "Machine design"}', '{"en": "Machine design related skills"}', 1244, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1245, 'd-mech-mechatronics', '{"en": "Mechatronics"}', '{"en": "Mechatronics related skills"}', 1245, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1246, 'd-mech-manufacturing-processes', '{"en": "Manufacturing processes"}', '{"en": "Manufacturing processes related skills"}', 1246, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1247, 'd-mech-cad-cae', '{"en": "CAD/CAE"}', '{"en": "CAD/CAE related skills"}', 1247, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 155, 1248, 'd-mech-control-systems', '{"en": "Control systems"}', '{"en": "Control systems related skills"}', 1248, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1249, 'd-ee-circuits-signals', '{"en": "Circuits & signals"}', '{"en": "Circuits & signals related skills"}', 1249, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1250, 'd-ee-power-systems', '{"en": "Power systems"}', '{"en": "Power systems related skills"}', 1250, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1251, 'd-ee-electronics-devices', '{"en": "Electronics & devices"}', '{"en": "Electronics & devices related skills"}', 1251, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1252, 'd-ee-control-automation', '{"en": "Control & automation"}', '{"en": "Control & automation related skills"}', 1252, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1253, 'd-ee-communications', '{"en": "Communications"}', '{"en": "Communications related skills"}', 1253, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1254, 'd-ee-embedded-systems', '{"en": "Embedded systems"}', '{"en": "Embedded systems related skills"}', 1254, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1255, 'd-ee-vlsi-fpga', '{"en": "VLSI & FPGA"}', '{"en": "VLSI & FPGA related skills"}', 1255, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 156, 1256, 'd-ee-electromagnetics', '{"en": "Electromagnetics"}', '{"en": "Electromagnetics related skills"}', 1256, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1257, 'd-civil-structural-analysis', '{"en": "Structural analysis"}', '{"en": "Structural analysis related skills"}', 1257, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1258, 'd-civil-geotechnical', '{"en": "Geotechnical"}', '{"en": "Geotechnical related skills"}', 1258, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1259, 'd-civil-transportation', '{"en": "Transportation"}', '{"en": "Transportation related skills"}', 1259, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1260, 'd-civil-water-resources', '{"en": "Water resources"}', '{"en": "Water resources related skills"}', 1260, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1261, 'd-civil-construction-mgmt', '{"en": "Construction mgmt"}', '{"en": "Construction mgmt related skills"}', 1261, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1262, 'd-civil-materials-pavements', '{"en": "Materials & pavements"}', '{"en": "Materials & pavements related skills"}', 1262, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1263, 'd-civil-urban-systems', '{"en": "Urban systems"}', '{"en": "Urban systems related skills"}', 1263, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 157, 1264, 'd-civil-sustainability', '{"en": "Sustainability"}', '{"en": "Sustainability related skills"}', 1264, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1265, 'd-che-balances-thermodynamics', '{"en": "Balances & thermodynamics"}', '{"en": "Balances & thermodynamics related skills"}', 1265, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1266, 'd-che-transport-phenomena', '{"en": "Transport phenomena"}', '{"en": "Transport phenomena related skills"}', 1266, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1267, 'd-che-reaction-engineering', '{"en": "Reaction engineering"}', '{"en": "Reaction engineering related skills"}', 1267, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1268, 'd-che-separations', '{"en": "Separations"}', '{"en": "Separations related skills"}', 1268, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1269, 'd-che-process-control', '{"en": "Process control"}', '{"en": "Process control related skills"}', 1269, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1270, 'd-che-plant-design', '{"en": "Plant design"}', '{"en": "Plant design related skills"}', 1270, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1271, 'd-che-safety-hazop', '{"en": "Safety & HAZOP"}', '{"en": "Safety & HAZOP related skills"}', 1271, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 158, 1272, 'd-che-bioprocessing', '{"en": "Bioprocessing"}', '{"en": "Bioprocessing related skills"}', 1272, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1273, 'd-health-anatomy-physiology', '{"en": "Anatomy & physiology"}', '{"en": "Anatomy & physiology related skills"}', 1273, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1274, 'd-health-pathology', '{"en": "Pathology"}', '{"en": "Pathology related skills"}', 1274, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1275, 'd-health-diagnostics', '{"en": "Diagnostics"}', '{"en": "Diagnostics related skills"}', 1275, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1276, 'd-health-therapeutics', '{"en": "Therapeutics"}', '{"en": "Therapeutics related skills"}', 1276, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1277, 'd-health-public-health-epi', '{"en": "Public health & epi"}', '{"en": "Public health & epi related skills"}', 1277, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1278, 'd-health-health-systems', '{"en": "Health systems"}', '{"en": "Health systems related skills"}', 1278, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1279, 'd-health-evidence-based-medicine', '{"en": "Evidence-based medicine"}', '{"en": "Evidence-based medicine related skills"}', 1279, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 159, 1280, 'd-health-bioethics', '{"en": "Bioethics"}', '{"en": "Bioethics related skills"}', 1280, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1281, 'd-pharm-medicinal-chemistry', '{"en": "Medicinal chemistry"}', '{"en": "Medicinal chemistry related skills"}', 1281, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1282, 'd-pharm-pharmacokinetics', '{"en": "Pharmacokinetics"}', '{"en": "Pharmacokinetics related skills"}', 1282, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1283, 'd-pharm-biopharmaceutics', '{"en": "Biopharmaceutics"}', '{"en": "Biopharmaceutics related skills"}', 1283, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1284, 'd-pharm-formulation-delivery', '{"en": "Formulation & delivery"}', '{"en": "Formulation & delivery related skills"}', 1284, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1285, 'd-pharm-quality-by-design', '{"en": "Quality by design"}', '{"en": "Quality by design related skills"}', 1285, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1286, 'd-pharm-regulatory-science', '{"en": "Regulatory science"}', '{"en": "Regulatory science related skills"}', 1286, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1287, 'd-pharm-stability-studies', '{"en": "Stability studies"}', '{"en": "Stability studies related skills"}', 1287, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 160, 1288, 'd-pharm-analytics-methods', '{"en": "Analytics & methods"}', '{"en": "Analytics & methods related skills"}', 1288, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1289, 'd-soc-psychology', '{"en": "Psychology"}', '{"en": "Psychology related skills"}', 1289, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1290, 'd-soc-sociology', '{"en": "Sociology"}', '{"en": "Sociology related skills"}', 1290, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1291, 'd-soc-anthropology', '{"en": "Anthropology"}', '{"en": "Anthropology related skills"}', 1291, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1292, 'd-soc-political-science', '{"en": "Political science"}', '{"en": "Political science related skills"}', 1292, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1293, 'd-soc-economics', '{"en": "Economics"}', '{"en": "Economics related skills"}', 1293, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1294, 'd-soc-human-geography', '{"en": "Human geography"}', '{"en": "Human geography related skills"}', 1294, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1295, 'd-soc-social-research-methods', '{"en": "Social research methods"}', '{"en": "Social research methods related skills"}', 1295, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 161, 1296, 'd-soc-demography', '{"en": "Demography"}', '{"en": "Demography related skills"}', 1296, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1297, 'd-econ-microeconomics', '{"en": "Microeconomics"}', '{"en": "Microeconomics related skills"}', 1297, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1298, 'd-econ-macroeconomics', '{"en": "Macroeconomics"}', '{"en": "Macroeconomics related skills"}', 1298, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1299, 'd-econ-econometrics', '{"en": "Econometrics"}', '{"en": "Econometrics related skills"}', 1299, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1300, 'd-econ-industrial-organization', '{"en": "Industrial organization"}', '{"en": "Industrial organization related skills"}', 1300, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1301, 'd-econ-development-economics', '{"en": "Development economics"}', '{"en": "Development economics related skills"}', 1301, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1302, 'd-econ-public-economics', '{"en": "Public economics"}', '{"en": "Public economics related skills"}', 1302, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1303, 'd-econ-trade-finance', '{"en": "Trade & finance"}', '{"en": "Trade & finance related skills"}', 1303, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 162, 1304, 'd-econ-policy-analysis', '{"en": "Policy analysis"}', '{"en": "Policy analysis related skills"}', 1304, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1305, 'd-bus-organizational-behavior', '{"en": "Organizational behavior"}', '{"en": "Organizational behavior related skills"}', 1305, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1306, 'd-bus-strategy', '{"en": "Strategy"}', '{"en": "Strategy related skills"}', 1306, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1307, 'd-bus-operations-management', '{"en": "Operations management"}', '{"en": "Operations management related skills"}', 1307, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1308, 'd-bus-marketing', '{"en": "Marketing"}', '{"en": "Marketing related skills"}', 1308, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1309, 'd-bus-entrepreneurship', '{"en": "Entrepreneurship"}', '{"en": "Entrepreneurship related skills"}', 1309, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1310, 'd-bus-corporate-governance', '{"en": "Corporate governance"}', '{"en": "Corporate governance related skills"}', 1310, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1311, 'd-bus-innovation-mgmt', '{"en": "Innovation mgmt"}', '{"en": "Innovation mgmt related skills"}', 1311, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 163, 1312, 'd-bus-business-law', '{"en": "Business law"}', '{"en": "Business law related skills"}', 1312, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1313, 'd-fin-financial-reporting', '{"en": "Financial reporting"}', '{"en": "Financial reporting related skills"}', 1313, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1314, 'd-fin-managerial-accounting', '{"en": "Managerial accounting"}', '{"en": "Managerial accounting related skills"}', 1314, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1315, 'd-fin-corporate-finance', '{"en": "Corporate finance"}', '{"en": "Corporate finance related skills"}', 1315, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1316, 'd-fin-markets-instruments', '{"en": "Markets & instruments"}', '{"en": "Markets & instruments related skills"}', 1316, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1317, 'd-fin-risk-management', '{"en": "Risk management"}', '{"en": "Risk management related skills"}', 1317, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1318, 'd-fin-taxation', '{"en": "Taxation"}', '{"en": "Taxation related skills"}', 1318, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1319, 'd-fin-audit-assurance', '{"en": "Audit & assurance"}', '{"en": "Audit & assurance related skills"}', 1319, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 164, 1320, 'd-fin-valuation', '{"en": "Valuation"}', '{"en": "Valuation related skills"}', 1320, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1321, 'd-law-legal-systems-sources', '{"en": "Legal systems & sources"}', '{"en": "Legal systems & sources related skills"}', 1321, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1322, 'd-law-contract-tort', '{"en": "Contract & tort"}', '{"en": "Contract & tort related skills"}', 1322, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1323, 'd-law-corporate-securities', '{"en": "Corporate & securities"}', '{"en": "Corporate & securities related skills"}', 1323, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1324, 'd-law-international-public-law', '{"en": "International & public law"}', '{"en": "International & public law related skills"}', 1324, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1325, 'd-law-administrative-privacy', '{"en": "Administrative & privacy"}', '{"en": "Administrative & privacy related skills"}', 1325, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1326, 'd-law-ip-licensing', '{"en": "IP & licensing"}', '{"en": "IP & licensing related skills"}', 1326, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1327, 'd-law-compliance-ethics', '{"en": "Compliance & ethics"}', '{"en": "Compliance & ethics related skills"}', 1327, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 165, 1328, 'd-law-litigation-adr', '{"en": "Litigation & ADR"}', '{"en": "Litigation & ADR related skills"}', 1328, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1329, 'd-edu-learning-theories', '{"en": "Learning theories"}', '{"en": "Learning theories related skills"}', 1329, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1330, 'd-edu-curriculum-design', '{"en": "Curriculum design"}', '{"en": "Curriculum design related skills"}', 1330, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1331, 'd-edu-assessment', '{"en": "Assessment"}', '{"en": "Assessment related skills"}', 1331, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1332, 'd-edu-educational-psychology', '{"en": "Educational psychology"}', '{"en": "Educational psychology related skills"}', 1332, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1333, 'd-edu-inclusive-education', '{"en": "Inclusive education"}', '{"en": "Inclusive education related skills"}', 1333, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1334, 'd-edu-policy-leadership', '{"en": "Policy & leadership"}', '{"en": "Policy & leadership related skills"}', 1334, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1335, 'd-edu-edtech', '{"en": "EdTech"}', '{"en": "EdTech related skills"}', 1335, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 166, 1336, 'd-edu-teacher-development', '{"en": "Teacher development"}', '{"en": "Teacher development related skills"}', 1336, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1337, 'd-arch-history-theory', '{"en": "History & theory"}', '{"en": "History & theory related skills"}', 1337, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1338, 'd-arch-building-physics', '{"en": "Building physics"}', '{"en": "Building physics related skills"}', 1338, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1339, 'd-arch-structures-materials', '{"en": "Structures & materials"}', '{"en": "Structures & materials related skills"}', 1339, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1340, 'd-arch-urban-design', '{"en": "Urban design"}', '{"en": "Urban design related skills"}', 1340, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1341, 'd-arch-sustainability-energy', '{"en": "Sustainability & energy"}', '{"en": "Sustainability & energy related skills"}', 1341, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1342, 'd-arch-housing-community', '{"en": "Housing & community"}', '{"en": "Housing & community related skills"}', 1342, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1343, 'd-arch-practice-regulation', '{"en": "Practice & regulation"}', '{"en": "Practice & regulation related skills"}', 1343, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 167, 1344, 'd-arch-preservation', '{"en": "Preservation"}', '{"en": "Preservation related skills"}', 1344, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1345, 'd-media-journalism-reporting', '{"en": "Journalism & reporting"}', '{"en": "Journalism & reporting related skills"}', 1345, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1346, 'd-media-semiotics-rhetoric', '{"en": "Semiotics & rhetoric"}', '{"en": "Semiotics & rhetoric related skills"}', 1346, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1347, 'd-media-media-law-ethics', '{"en": "Media law & ethics"}', '{"en": "Media law & ethics related skills"}', 1347, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1348, 'd-media-digital-media-platforms', '{"en": "Digital media & platforms"}', '{"en": "Digital media & platforms related skills"}', 1348, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1349, 'd-media-audience-analytics', '{"en": "Audience & analytics"}', '{"en": "Audience & analytics related skills"}', 1349, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1350, 'd-media-narrative-storytelling', '{"en": "Narrative & storytelling"}', '{"en": "Narrative & storytelling related skills"}', 1350, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1351, 'd-media-visual-communication', '{"en": "Visual communication"}', '{"en": "Visual communication related skills"}', 1351, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 168, 1352, 'd-media-public-relations', '{"en": "Public relations"}', '{"en": "Public relations related skills"}', 1352, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1353, 'd-agri-agronomy-soils', '{"en": "Agronomy & soils"}', '{"en": "Agronomy & soils related skills"}', 1353, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1354, 'd-agri-horticulture', '{"en": "Horticulture"}', '{"en": "Horticulture related skills"}', 1354, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1355, 'd-agri-animal-science', '{"en": "Animal science"}', '{"en": "Animal science related skills"}', 1355, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1356, 'd-agri-food-science', '{"en": "Food science"}', '{"en": "Food science related skills"}', 1356, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1357, 'd-agri-supply-chains', '{"en": "Supply chains"}', '{"en": "Supply chains related skills"}', 1357, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1358, 'd-agri-sustainability-water', '{"en": "Sustainability & water"}', '{"en": "Sustainability & water related skills"}', 1358, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1359, 'd-agri-agroecology', '{"en": "Agroecology"}', '{"en": "Agroecology related skills"}', 1359, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 169, 1360, 'd-agri-policy-extension', '{"en": "Policy & extension"}', '{"en": "Policy & extension related skills"}', 1360, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1361, 'd-energy-power-generation', '{"en": "Power generation"}', '{"en": "Power generation related skills"}', 1361, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1362, 'd-energy-transmission-distribution', '{"en": "Transmission & distribution"}', '{"en": "Transmission & distribution related skills"}', 1362, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1363, 'd-energy-markets-regulation', '{"en": "Markets & regulation"}', '{"en": "Markets & regulation related skills"}', 1363, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1364, 'd-energy-renewables-storage', '{"en": "Renewables & storage"}', '{"en": "Renewables & storage related skills"}', 1364, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1365, 'd-energy-efficiency-demand', '{"en": "Efficiency & demand"}', '{"en": "Efficiency & demand related skills"}', 1365, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1366, 'd-energy-planning-reliability', '{"en": "Planning & reliability"}', '{"en": "Planning & reliability related skills"}', 1366, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1367, 'd-energy-environmental-impacts', '{"en": "Environmental impacts"}', '{"en": "Environmental impacts related skills"}', 1367, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 170, 1368, 'd-energy-economics-of-energy', '{"en": "Economics of energy"}', '{"en": "Economics of energy related skills"}', 1368, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1369, 'd-trans-traffic-engineering', '{"en": "Traffic engineering"}', '{"en": "Traffic engineering related skills"}', 1369, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1370, 'd-trans-transit-planning', '{"en": "Transit planning"}', '{"en": "Transit planning related skills"}', 1370, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1371, 'd-trans-freight-logistics', '{"en": "Freight & logistics"}', '{"en": "Freight & logistics related skills"}', 1371, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1372, 'd-trans-vehicle-technology', '{"en": "Vehicle technology"}', '{"en": "Vehicle technology related skills"}', 1372, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1373, 'd-trans-safety-human-factors', '{"en": "Safety & human factors"}', '{"en": "Safety & human factors related skills"}', 1373, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1374, 'd-trans-policy-regulation', '{"en": "Policy & regulation"}', '{"en": "Policy & regulation related skills"}', 1374, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1375, 'd-trans-modeling-simulation', '{"en": "Modeling & simulation"}', '{"en": "Modeling & simulation related skills"}', 1375, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 171, 1376, 'd-trans-sustainability-equity', '{"en": "Sustainability & equity"}', '{"en": "Sustainability & equity related skills"}', 1376, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1377, 'd-urban-land-use-zoning', '{"en": "Land use & zoning"}', '{"en": "Land use & zoning related skills"}', 1377, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1378, 'd-urban-transport-environment', '{"en": "Transport & environment"}', '{"en": "Transport & environment related skills"}', 1378, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1379, 'd-urban-housing-community', '{"en": "Housing & community"}', '{"en": "Housing & community related skills"}', 1379, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1380, 'd-urban-economic-development', '{"en": "Economic development"}', '{"en": "Economic development related skills"}', 1380, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1381, 'd-urban-resilience-climate', '{"en": "Resilience & climate"}', '{"en": "Resilience & climate related skills"}', 1381, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1382, 'd-urban-governance-finance', '{"en": "Governance & finance"}', '{"en": "Governance & finance related skills"}', 1382, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1383, 'd-urban-public-space-design', '{"en": "Public space & design"}', '{"en": "Public space & design related skills"}', 1383, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 172, 1384, 'd-urban-data-visualization', '{"en": "Data & visualization"}', '{"en": "Data & visualization related skills"}', 1384, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1385, 'd-env-climate-science', '{"en": "Climate science"}', '{"en": "Climate science related skills"}', 1385, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1386, 'd-env-ecosystems-biodiversity', '{"en": "Ecosystems & biodiversity"}', '{"en": "Ecosystems & biodiversity related skills"}', 1386, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1387, 'd-env-circular-economy', '{"en": "Circular economy"}', '{"en": "Circular economy related skills"}', 1387, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1388, 'd-env-ghg-accounting', '{"en": "GHG accounting"}', '{"en": "GHG accounting related skills"}', 1388, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1389, 'd-env-adaptation-resilience', '{"en": "Adaptation & resilience"}', '{"en": "Adaptation & resilience related skills"}', 1389, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1390, 'd-env-nature-based-solutions', '{"en": "Nature-based solutions"}', '{"en": "Nature-based solutions related skills"}', 1390, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1391, 'd-env-policy-governance', '{"en": "Policy & governance"}', '{"en": "Policy & governance related skills"}', 1391, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 173, 1392, 'd-env-environmental-justice', '{"en": "Environmental justice"}', '{"en": "Environmental justice related skills"}', 1392, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1393, 'd-sec-security-studies', '{"en": "Security studies"}', '{"en": "Security studies related skills"}', 1393, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1394, 'd-sec-international-relations', '{"en": "International relations"}', '{"en": "International relations related skills"}', 1394, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1395, 'd-sec-defense-strategy', '{"en": "Defense strategy"}', '{"en": "Defense strategy related skills"}', 1395, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1396, 'd-sec-intelligence-analysis', '{"en": "Intelligence analysis"}', '{"en": "Intelligence analysis related skills"}', 1396, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1397, 'd-sec-cyber-hybrid-threats', '{"en": "Cyber & hybrid threats"}', '{"en": "Cyber & hybrid threats related skills"}', 1397, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1398, 'd-sec-critical-infrastructure', '{"en": "Critical infrastructure"}', '{"en": "Critical infrastructure related skills"}', 1398, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1399, 'd-sec-human-security', '{"en": "Human security"}', '{"en": "Human security related skills"}', 1399, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 174, 1400, 'd-sec-law-ethics', '{"en": "Law & ethics"}', '{"en": "Law & ethics related skills"}', 1400, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1401, 'd-sport-exercise-physiology', '{"en": "Exercise physiology"}', '{"en": "Exercise physiology related skills"}', 1401, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1402, 'd-sport-biomechanics', '{"en": "Biomechanics"}', '{"en": "Biomechanics related skills"}', 1402, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1403, 'd-sport-sport-psychology', '{"en": "Sport psychology"}', '{"en": "Sport psychology related skills"}', 1403, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1404, 'd-sport-nutrition-metabolism', '{"en": "Nutrition & metabolism"}', '{"en": "Nutrition & metabolism related skills"}', 1404, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1405, 'd-sport-injury-rehab', '{"en": "Injury & rehab"}', '{"en": "Injury & rehab related skills"}', 1405, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1406, 'd-sport-performance-analysis', '{"en": "Performance analysis"}', '{"en": "Performance analysis related skills"}', 1406, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1407, 'd-sport-coaching-science', '{"en": "Coaching science"}', '{"en": "Coaching science related skills"}', 1407, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 175, 1408, 'd-sport-public-health-activity', '{"en": "Public health & activity"}', '{"en": "Public health & activity related skills"}', 1408, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1409, 'd-arts-art-history', '{"en": "Art history"}', '{"en": "Art history related skills"}', 1409, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1410, 'd-arts-music-theory', '{"en": "Music theory"}', '{"en": "Music theory related skills"}', 1410, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1411, 'd-arts-theatre-performance', '{"en": "Theatre & performance"}', '{"en": "Theatre & performance related skills"}', 1411, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1412, 'd-arts-film-media', '{"en": "Film & media"}', '{"en": "Film & media related skills"}', 1412, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1413, 'd-arts-aesthetics-criticism', '{"en": "Aesthetics & criticism"}', '{"en": "Aesthetics & criticism related skills"}', 1413, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1414, 'd-arts-curation-museology', '{"en": "Curation & museology"}', '{"en": "Curation & museology related skills"}', 1414, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1415, 'd-arts-creative-practice', '{"en": "Creative practice"}', '{"en": "Creative practice related skills"}', 1415, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 176, 1416, 'd-arts-cultural-policy', '{"en": "Cultural policy"}', '{"en": "Cultural policy related skills"}', 1416, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1417, 'd-hum-history', '{"en": "History"}', '{"en": "History related skills"}', 1417, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1418, 'd-hum-philosophy', '{"en": "Philosophy"}', '{"en": "Philosophy related skills"}', 1418, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1419, 'd-hum-literature', '{"en": "Literature"}', '{"en": "Literature related skills"}', 1419, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1420, 'd-hum-religious-studies', '{"en": "Religious studies"}', '{"en": "Religious studies related skills"}', 1420, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1421, 'd-hum-ethics', '{"en": "Ethics"}', '{"en": "Ethics related skills"}', 1421, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1422, 'd-hum-linguistics', '{"en": "Linguistics"}', '{"en": "Linguistics related skills"}', 1422, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1423, 'd-hum-rhetoric-writing', '{"en": "Rhetoric & writing"}', '{"en": "Rhetoric & writing related skills"}', 1423, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

INSERT INTO skills_l3 (cat_id, subcat_id, l3_id, slug, name_i18n, description_i18n, display_order, version, created_at, updated_at)
VALUES (6, 177, 1424, 'd-hum-cultural-studies', '{"en": "Cultural studies"}', '{"en": "Cultural studies related skills"}', 1424, 1, NOW(), NOW())
ON CONFLICT (cat_id, subcat_id, l3_id) DO NOTHING;

