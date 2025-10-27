"use client";

/**
 * Profile Demo Page
 *
 * Demonstrates the new profile design system with mock data.
 * Visit: http://localhost:3000/profile/demo
 */

import { IndividualProfileView } from "@/components/profile/individual/IndividualProfileView";
import type { ProfileData } from "@/lib/profile-types";

// Mock data to demonstrate all features
const mockProfileData: ProfileData = {
  basicInfo: {
    name: "Alex Rivera",
    location: "San Francisco, CA",
    joinedDate: "January 2024",
    avatar: null,
    coverImage: null,
    tagline: "Impact-driven product designer creating meaningful change through technology and community engagement.",
  },
  mission: "To bridge the gap between design, technology, and social impact—creating products that empower communities and drive sustainable change.",
  values: [
    { id: "1", icon: "Heart", label: "Empathy First", verified: true },
    { id: "2", icon: "Users", label: "Community Focused", verified: true },
    { id: "3", icon: "Leaf", label: "Sustainability", verified: false },
    { id: "4", icon: "Lightbulb", label: "Innovation", verified: true },
  ],
  causes: [
    "Climate Action",
    "Education Equity",
    "Mental Health",
    "Digital Accessibility",
  ],
  skills: [
    { id: "1", name: "Product Design", verified: true },
    { id: "2", name: "User Research", verified: true },
    { id: "3", name: "Design Systems", verified: false },
    { id: "4", name: "Accessibility", verified: true },
    { id: "5", name: "Figma", verified: false },
  ],
  impactStories: [
    {
      id: "1",
      title: "Community Health Platform",
      orgDescription: "HealthConnect - Non-profit healthcare platform",
      timeline: "Jan 2023 - Dec 2023",
      impact: "Designed and launched a mobile platform connecting underserved communities with healthcare resources, reaching 50,000+ users in the first year.",
      businessValue: "Reduced patient wait times by 40% and increased health literacy scores by 65% among platform users.",
      outcomes: "Platform now serves as a model for 12 other communities nationwide. Won 'Social Impact Design Award 2023' and secured $2M in additional funding for expansion.",
      verified: true,
    },
    {
      id: "2",
      title: "Youth Education Initiative",
      orgDescription: "FutureMinds - Educational technology startup",
      timeline: "Mar 2022 - Aug 2022",
      impact: "Led design of an adaptive learning platform for K-12 students, improving engagement rates by 85% and learning outcomes by 52%.",
      businessValue: "Platform adopted by 150+ schools, generating $1.5M ARR. Student retention improved from 60% to 94%.",
      outcomes: "Featured in EdTech Magazine's 'Top 10 Innovations'. Platform data influenced state-level education policy changes.",
      verified: true,
    },
  ],
  experiences: [
    {
      id: "1",
      title: "Senior Product Designer",
      orgDescription: "ImpactLabs - Social innovation consultancy",
      duration: "2021 - Present",
      learning: "Learned to balance business objectives with social impact goals, developed expertise in participatory design methods, and mastered stakeholder alignment across diverse communities.",
      growth: "Grew from individual contributor to leading a team of 5 designers. Developed skills in cross-cultural design and became comfortable facilitating workshops with 50+ participants.",
      verified: true,
    },
    {
      id: "2",
      title: "UX Designer",
      orgDescription: "TechForGood - Non-profit digital agency",
      duration: "2019 - 2021",
      learning: "Discovered the power of design research in understanding user needs. Learned to work with limited resources and maximize impact through strategic design decisions.",
      growth: "Transitioned from visual design to full product design. Built confidence in presenting to executives and defending design decisions with data.",
      verified: false,
    },
  ],
  education: [
    {
      id: "1",
      degree: "Master of Design Innovation",
      institution: "Stanford University",
      duration: "2017 - 2019",
      skills: "Human-centered design, Design thinking, Research methods, Systems thinking, Service design",
      projects: "Thesis: 'Designing for Social Change' - researched and prototyped community-driven digital platforms. Final project partnered with 3 local non-profits.",
      verified: true,
    },
    {
      id: "2",
      degree: "BA in Graphic Design",
      institution: "UC Berkeley",
      duration: "2013 - 2017",
      skills: "Visual communication, Typography, Brand identity, Digital design, Print design",
      projects: "Senior capstone redesigned campus sustainability communications, increasing student engagement by 120%.",
      verified: true,
    },
  ],
  volunteering: [
    {
      id: "1",
      title: "Design Mentor",
      orgDescription: "DesignForward - Mentorship program for underrepresented designers",
      duration: "2020 - Present",
      cause: "Diversity in Design",
      personalWhy: "As a first-generation college student, I lacked design mentors early in my career. I want to ensure others have the guidance and support I wish I'd had.",
      impact: "Mentored 8 early-career designers, 6 of whom secured positions at major tech companies. Created workshop series on portfolio development attended by 200+ students.",
      skillsDeployed: "Career coaching, portfolio review, design critique, industry navigation, interview preparation",
      verified: true,
    },
    {
      id: "2",
      title: "Community Workshop Facilitator",
      orgDescription: "Bay Area Community Centers - Network of community spaces",
      duration: "2018 - 2020",
      cause: "Digital Literacy",
      personalWhy: "My grandmother struggled with technology isolation during the pandemic. I saw firsthand how digital access affects quality of life for seniors.",
      impact: "Designed and led 24 workshops teaching basic digital skills to 300+ seniors and immigrants. 85% of participants reported increased confidence using technology.",
      skillsDeployed: "Curriculum design, accessible teaching methods, patience, cultural sensitivity, tech troubleshooting",
      verified: false,
    },
  ],
  networkStats: {
    people: 127,
    organizations: 18,
    institutions: 5,
  },
  profileCompletion: 95,
};

export default function ProfileDemoPage() {
  // Mock handlers for demo - just log to console
  const handleAvatarUpload = (file: File) => {
    console.log("Avatar upload:", file.name);
    alert(`Avatar selected: ${file.name}\n\nIn production, this would upload to your storage.`);
  };

  const handleCoverUpload = (file: File) => {
    console.log("Cover upload:", file.name);
    alert(`Cover selected: ${file.name}\n\nIn production, this would upload to your storage.`);
  };

  const handleTaglineSave = (tagline: string) => {
    console.log("Tagline save:", tagline);
    alert(`Tagline saved: "${tagline}"\n\nIn production, this would save to your database.`);
  };

  const handleEditBasicInfo = () => {
    console.log("Edit basic info clicked");
    alert("In production, this would open your EditProfileModal component.");
  };

  const handleMissionSave = (mission: string) => {
    console.log("Mission save:", mission);
    alert(`Mission saved!\n\nIn production, this would save to your database.`);
  };

  const handleDelete = (type: string, id: string) => {
    console.log(`Delete ${type}:`, id);
    alert(`Delete ${type} ID: ${id}\n\nIn production, this would delete from your database.`);
  };

  const handleAdd = (type: string) => {
    console.log(`Add ${type} clicked`);
    alert(`Add ${type}\n\nIn production, this would open your ${type} form.`);
  };

  return (
    <div>
      {/* Demo Banner */}
      <div
        className="bg-blue-50 border-b-2 border-blue-200 p-4 text-center"
        style={{ position: 'sticky', top: 0, zIndex: 1000 }}
      >
        <p className="text-sm font-medium text-blue-900">
          🎨 <strong>Design Demo</strong> - This is a preview with mock data.
          All interactions log to console. Real implementation in EditableIndividualProfile.tsx
        </p>
      </div>

      {/* Profile View */}
      <IndividualProfileView
        profileData={mockProfileData}
        editable={true}
        onAvatarUpload={handleAvatarUpload}
        onCoverUpload={handleCoverUpload}
        onTaglineSave={handleTaglineSave}
        onEditBasicInfo={handleEditBasicInfo}
        onMissionSave={handleMissionSave}
        onValuesAdd={() => handleAdd("Values")}
        onValuesEdit={() => handleAdd("Values")}
        onCausesAdd={() => handleAdd("Causes")}
        onCausesEdit={() => handleAdd("Causes")}
        onSkillsAdd={() => handleAdd("Skills")}
        onSkillsEdit={() => handleAdd("Skills")}
        onImpactStoryAdd={() => handleAdd("Impact Story")}
        onImpactStoryDelete={(id) => handleDelete("Impact Story", id)}
        onExperienceAdd={() => handleAdd("Experience")}
        onExperienceDelete={(id) => handleDelete("Experience", id)}
        onEducationAdd={() => handleAdd("Education")}
        onEducationDelete={(id) => handleDelete("Education", id)}
        onVolunteeringAdd={() => handleAdd("Volunteering")}
        onVolunteeringDelete={(id) => handleDelete("Volunteering", id)}
        onNetworkVisualize={() => alert("Network visualization coming soon!")}
      />
    </div>
  );
}
