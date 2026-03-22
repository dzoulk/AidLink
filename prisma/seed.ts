import { PrismaClient } from "@prisma/client";
import { generateCheckInCode } from "../lib/utils";

const prisma = new PrismaClient();

const SKILLS = [
  "medical",
  "search",
  "transport",
  "logistics",
  "translation",
  "shelter",
  "food_distribution",
  "general_support",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.checkInLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.incidentNote.deleteMany();
  await prisma.incidentReport.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.organizerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create organizer user
  const organizerUser = await prisma.user.create({
    data: {
      email: "organizer@aidlink.demo",
      name: "Command Center Admin",
      role: "organizer",
    },
  });

  await prisma.organizerProfile.create({
    data: {
      userId: organizerUser.id,
      name: "Command Center Admin",
      orgId: "demo-org-1",
    },
  });

  // Create volunteers with profiles
  const volunteerNames = [
    "Sarah Chen", "Marcus Johnson", "Elena Rodriguez", "James Kim",
    "Priya Patel", "Omar Hassan", "Yuki Tanaka", "David Martinez",
    "Fatima Al-Rashid", "Alex Thompson", "Maria Santos", "Hassan Ali",
    "Lisa Wang", "Carlos Mendez", "Aisha Okafor", "Ryan O'Brien",
    "Nadia Kowalski", "Thomas Berg", "Sofia Ivanova", "Daniel Lee",
    "Zara Mohammed", "Kevin Nguyen", "Amira Hassan", "Chris Williams",
  ];

  const volunteers = [];
  for (let i = 0; i < volunteerNames.length; i++) {
    const [firstName, lastName] = volunteerNames[i].split(" ");
    const user = await prisma.user.create({
      data: {
        email: `volunteer${i + 1}@aidlink.demo`,
        name: volunteerNames[i],
        role: "volunteer",
      },
    });

    const skillCount = 1 + Math.floor(Math.random() * 3);
    const skills = [...SKILLS]
      .sort(() => Math.random() - 0.5)
      .slice(0, skillCount);

    const profile = await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        fullName: volunteerNames[i],
        email: user.email,
        phone: `+1-555-${String(100 + i).padStart(3, "0")}-${String(1000 + i).padStart(4, "0")}`,
        skills: JSON.stringify(skills),
        hasVehicle: Math.random() > 0.5,
        availableNow: i < 15,
        travelRadius: 20 + Math.floor(Math.random() * 80),
        lastKnownLat: 34.05 + (Math.random() - 0.5) * 0.2,
        lastKnownLng: -118.25 + (Math.random() - 0.5) * 0.2,
        lastKnownArea: ["Downtown", "Westside", "Valley", "South Bay"][i % 4],
        status: i < 5 ? "AVAILABLE" : i < 10 ? "INTERESTED" : i < 15 ? "ASSIGNED" : i < 18 ? "CHECKED_IN" : "AVAILABLE",
      },
    });
    volunteers.push(profile);
  }

  // Create incidents - mix of verified, partially verified, unverified
  const incidentData = [
    {
      title: "Building Collapse - Residential Block 7",
      locationName: "123 Oak Street, Downtown",
      lat: 34.0522,
      lng: -118.2437,
      severity: 9,
      urgency: "CRITICAL",
      type: "rescue",
      helpTypes: '["medical","search","rescue"]',
      needed: 8,
      verification: "VERIFIED",
      operational: "ACTIVE",
      source: "Emergency Services",
      desc: "Multi-story residential building partial collapse. Multiple families trapped. Heavy machinery en route.",
      safetyNote: "Unstable structure. Only trained rescue personnel.",
    },
    {
      title: "Medical Triage - Central Park",
      locationName: "Central Park Evac Center",
      lat: 34.0612,
      lng: -118.2389,
      severity: 7,
      urgency: "HIGH",
      type: "medical",
      helpTypes: '["medical","general_support"]',
      needed: 5,
      verification: "VERIFIED",
      operational: "ASSIGNED",
      source: "Red Cross",
      desc: "Field hospital needs additional medical staff. Injured arriving from affected zones.",
      safetyNote: "Safe zone. PPE provided.",
    },
    {
      title: "Food Distribution - Westside Shelter",
      locationName: "Westside Community Center",
      lat: 34.0312,
      lng: -118.4639,
      severity: 5,
      urgency: "MEDIUM",
      type: "food",
      helpTypes: '["food_distribution","logistics","general_support"]',
      needed: 6,
      verification: "PARTIALLY_VERIFIED",
      operational: "ACTIVE",
      source: "Twitter/X",
      desc: "Unverified report of food shortage at shelter. Need volunteers to distribute supplies.",
      safetyNote: "Reported safe. Verify on arrival.",
    },
    {
      title: "Possible Survivors - Warehouse District",
      locationName: "450 Industrial Ave",
      lat: 34.0722,
      lng: -118.2137,
      severity: 8,
      urgency: "CRITICAL",
      type: "rescue",
      helpTypes: '["search","medical","rescue"]',
      needed: 10,
      verification: "UNVERIFIED",
      operational: "NEW",
      source: "Social Media",
      desc: "Sounds heard from rubble. NOT CONFIRMED. Awaiting assessment.",
      safetyNote: "UNVERIFIED. Do not enter without authorization.",
    },
    {
      title: "Transport Needed - Hospital Transfers",
      locationName: "City General Hospital",
      lat: 34.0382,
      lng: -118.2937,
      severity: 6,
      urgency: "HIGH",
      type: "transport",
      helpTypes: '["transport","logistics"]',
      needed: 4,
      verification: "VERIFIED",
      operational: "ACTIVE",
      source: "Hospital Admin",
      desc: "Need drivers with vehicles for patient transfers to overflow facilities.",
      safetyNote: "Hospital grounds. Standard protocols.",
    },
    {
      title: "Shelter Setup - Convention Center",
      locationName: "LA Convention Center",
      lat: 34.0412,
      lng: -118.2669,
      severity: 5,
      urgency: "MEDIUM",
      type: "shelter",
      helpTypes: '["shelter","logistics","general_support"]',
      needed: 12,
      verification: "VERIFIED",
      operational: "ACTIVE",
      source: "FEMA",
      desc: "Mass shelter setup. Cots, supplies, registration support needed.",
      safetyNote: "Indoor facility. Safe.",
    },
    {
      title: "Duplicate - Same as Oak Street",
      locationName: "123 Oak Street",
      lat: 34.0523,
      lng: -118.2438,
      severity: 9,
      urgency: "CRITICAL",
      type: "rescue",
      helpTypes: '["rescue"]',
      needed: 8,
      verification: "DUPLICATE",
      operational: "RESOLVED",
      source: "Twitter",
      desc: "Duplicate report of building collapse.",
      safetyNote: "Duplicate - merge with primary.",
    },
    {
      title: "False Report - Fake Evacuation",
      locationName: "Fake Address",
      lat: 34.0122,
      lng: -118.3437,
      severity: 1,
      urgency: "LOW",
      type: "shelter",
      helpTypes: '["general_support"]',
      needed: 1,
      verification: "FALSE_REPORT",
      operational: "RESOLVED",
      source: "Unverified",
      desc: "Investigated. No incident at location.",
      safetyNote: "Marked false.",
    },
    {
      title: "Translation Support - Refugee Center",
      locationName: "International Relief Center",
      lat: 34.0282,
      lng: -118.2537,
      severity: 4,
      urgency: "MEDIUM",
      type: "medical",
      helpTypes: '["translation","medical","general_support"]',
      needed: 3,
      verification: "PARTIALLY_VERIFIED",
      operational: "NEW",
      source: "NGO Coordinator",
      desc: "Need Arabic, Spanish, and Mandarin speakers for triage support.",
      safetyNote: "Indoor facility.",
    },
    {
      title: "Water Distribution - South District",
      locationName: "South District Park",
      lat: 33.9822,
      lng: -118.2737,
      severity: 6,
      urgency: "HIGH",
      type: "food",
      helpTypes: '["food_distribution","logistics"]',
      needed: 4,
      verification: "UNVERIFIED",
      operational: "NEW",
      source: "Community Report",
      desc: "Residents reporting water shortage. Needs verification.",
      safetyNote: "Verify safety before dispatch.",
    },
    {
      title: "Search Team - Collapsed Mall",
      locationName: "Westfield Mall North",
      lat: 34.0722,
      lng: -118.4437,
      severity: 8,
      urgency: "CRITICAL",
      type: "rescue",
      helpTypes: '["search","medical","rescue"]',
      needed: 15,
      verification: "PARTIALLY_VERIFIED",
      operational: "ACTIVE",
      source: "Fire Dept",
      desc: "Large structure. Search and rescue in progress. Need additional teams.",
      safetyNote: "Danger zone. Structural engineers on site.",
    },
  ];

  const incidents = [];
  for (const inc of incidentData) {
    const reportedAt = new Date();
    reportedAt.setHours(reportedAt.getHours() - Math.floor(Math.random() * 24));

    const incident = await prisma.incident.create({
      data: {
        title: inc.title,
        description: inc.desc,
        locationName: inc.locationName,
        lat: inc.lat,
        lng: inc.lng,
        sourcePlatform: inc.source,
        sourceText: inc.desc,
        reportedAt,
        severityScore: inc.severity,
        urgencyLevel: inc.urgency as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        verificationStatus: inc.verification as any,
        operationalStatus: inc.operational as any,
        incidentType: inc.type,
        helpTypesNeeded: inc.helpTypes,
        volunteersNeeded: inc.needed,
        safetyNote: inc.safetyNote,
        checkInCode: ["VERIFIED", "PARTIALLY_VERIFIED", "ACTIVE"].includes(inc.verification)
          ? generateCheckInCode()
          : null,
      },
    });
    incidents.push(incident);
  }

  // Create assignments linking volunteers to incidents
  const statusFlow = ["INTERESTED", "ASSIGNED", "CONFIRMED", "CHECKED_IN"] as const;
  let volunteerIdx = 0;

  for (let i = 0; i < 5; i++) {
    const incident = incidents[i];
    const numAssignments = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < numAssignments && volunteerIdx < volunteers.length; j++) {
      const vol = volunteers[volunteerIdx++];
      const statusIdx = Math.min(j, statusFlow.length - 1);
      const status = statusFlow[statusIdx];
      await prisma.assignment.create({
        data: {
          incidentId: incident.id,
          volunteerId: vol.id,
          status,
          role: "general_support",
          assignedAt: new Date(),
          confirmedAt: ["CONFIRMED", "CHECKED_IN"].includes(status) ? new Date() : null,
          checkedInAt: status === "CHECKED_IN" ? new Date() : null,
        },
      });
    }
  }

  // Create incident reports (incoming/social)
  const reportTexts = [
    { text: "Building collapse at Oak St! People trapped! #emergency", platform: "twitter", conf: 0.6 },
    { text: "Need medical help at Central Park. Many injured.", platform: "twitter", conf: 0.8 },
    { text: "Food running low at Westside shelter", platform: "twitter", conf: 0.5 },
    { text: "Heard voices from warehouse on Industrial Ave - might be survivors", platform: "twitter", conf: 0.4 },
    { text: "Hospital needs drivers for patient transfers URGENT", platform: "twitter", conf: 0.9 },
    { text: "Fake evacuation notice - ignore previous message", platform: "twitter", conf: 0.3 },
    { text: "Convention center becoming shelter - volunteers needed", platform: "twitter", conf: 0.85 },
    { text: "Same building as before - duplicate post", platform: "twitter", conf: 0.95 },
    { text: "No water in South District. Families struggling.", platform: "community", conf: 0.5 },
    { text: "Mall collapse - search teams needed. Fire dept on scene.", platform: "twitter", conf: 0.75 },
  ];

  for (let i = 0; i < reportTexts.length; i++) {
    const r = reportTexts[i];
    await prisma.incidentReport.create({
      data: {
        rawText: r.text,
        platform: r.platform,
        confidence: r.conf,
        extractedLat: incidents[i % incidents.length]?.lat,
        extractedLng: incidents[i % incidents.length]?.lng,
        extractedLocation: incidents[i % incidents.length]?.locationName,
        incidentId: i < 8 ? incidents[i % 6].id : null,
        timestamp: new Date(Date.now() - i * 3600000),
        isDuplicate: i === 7,
      },
    });
  }

  // Create some incident notes
  for (let i = 0; i < 4; i++) {
    await prisma.incidentNote.create({
      data: {
        incidentId: incidents[i].id,
        content: ["Verified by fire department on scene.", "Awaiting structural assessment.", "Red Cross coordinating.", "Logistics team en route."][i],
        isInternal: true,
        authorId: organizerUser.id,
      },
    });
  }

  console.log(`✅ Created ${volunteers.length} volunteers, ${incidents.length} incidents`);
  console.log("🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
