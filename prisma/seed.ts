import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Idempotent demo seed. Creates one manager and one client, two websites, and
 * a couple of issues with timeline events + a resolved-issue notification.
 * Run with: npm run db:seed
 */
const prisma = new PrismaClient();

async function main() {
  const [managerPassword, clientPassword] = await Promise.all([
    bcrypt.hash("Manager@123", 12),
    bcrypt.hash("Client@123", 12),
  ]);

  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      email: "manager@demo.io",
      name: "Maya Manager",
      role: "MANAGER",
      passwordHash: managerPassword,
    },
  });

  const client = await prisma.user.upsert({
    where: { username: "client" },
    update: {},
    create: {
      username: "client",
      email: "client@demo.io",
      name: "Charlie Client",
      role: "CLIENT",
      passwordHash: clientPassword,
    },
  });

  const existing = await prisma.website.count({ where: { clientId: client.id } });
  if (existing === 0) {
    const marketing = await prisma.website.create({
      data: {
        name: "Acme Marketing Site",
        url: "https://acme-marketing.example.com",
        status: "ONLINE",
        lastCheckedAt: new Date(),
        clientId: client.id,
      },
    });
    const storefront = await prisma.website.create({
      data: {
        name: "Acme Storefront",
        url: "https://shop.acme.example.com",
        status: "DEGRADED",
        lastCheckedAt: new Date(),
        clientId: client.id,
      },
    });

    const issue1 = await prisma.issue.create({
      data: {
        issueNo: "ISS-000001",
        title: "Checkout button unresponsive on mobile",
        description:
          "Tapping the checkout button on iOS Safari intermittently does nothing. Repro on iPhone 14, latest Safari.",
        type: "BUG",
        severity: "HIGH",
        status: "IN_PROGRESS",
        websiteId: storefront.id,
        reporterId: client.id,
        assignedManagerId: manager.id,
      },
    });
    await prisma.issueEvent.createMany({
      data: [
        {
          issueId: issue1.id,
          actorId: client.id,
          type: "CREATED",
          message: "Issue reported by Charlie Client",
        },
        {
          issueId: issue1.id,
          actorId: manager.id,
          type: "ASSIGNED",
          message: "Assigned to Maya Manager",
        },
        {
          issueId: issue1.id,
          actorId: manager.id,
          type: "STATUS_CHANGED",
          fromValue: "OPEN",
          toValue: "IN_PROGRESS",
        },
      ],
    });

    const issue2 = await prisma.issue.create({
      data: {
        issueNo: "ISS-000002",
        title: "Add dark mode to the dashboard",
        description: "It would be great to have a dark theme option for the dashboard.",
        type: "IMPROVEMENT",
        severity: "LOW",
        status: "RESOLVED",
        resolvedAt: new Date(),
        websiteId: marketing.id,
        reporterId: client.id,
        assignedManagerId: manager.id,
      },
    });
    await prisma.issueEvent.createMany({
      data: [
        {
          issueId: issue2.id,
          actorId: client.id,
          type: "CREATED",
          message: "Issue reported by Charlie Client",
        },
        {
          issueId: issue2.id,
          actorId: manager.id,
          type: "RESOLVED",
          fromValue: "OPEN",
          toValue: "RESOLVED",
          message: "Shipped in v2.3",
        },
      ],
    });
    await prisma.notification.create({
      data: {
        userId: client.id,
        issueId: issue2.id,
        type: "ISSUE_RESOLVED",
        title: "Issue ISS-000002 resolved",
        body: 'Your issue "Add dark mode to the dashboard" has been marked as resolved.',
        channel: "IN_APP",
        status: "DELIVERED",
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });
  }

  // Three more demo issues spanning different types / severities / statuses.
  // Kept outside the websites guard and keyed by issueNo so re-running the seed
  // backfills them without duplicating.
  const websites = await prisma.website.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  const marketingSite =
    websites.find((w) => /marketing/i.test(w.name)) ?? websites[0];
  const storefrontSite =
    websites.find((w) => /storefront|shop/i.test(w.name)) ??
    websites[1] ??
    websites[0];

  if (marketingSite && storefrontSite) {
    const moreIssues = [
      {
        issueNo: "ISS-000003",
        title: "Contact form emails not being delivered",
        description:
          "Submissions from the marketing site contact form never arrive in our inbox. No bounce, no error shown to the visitor. Started ~2 days ago.",
        type: "BUG" as const,
        severity: "CRITICAL" as const,
        status: "OPEN" as const,
        websiteId: marketingSite.id,
      },
      {
        issueNo: "ISS-000004",
        title: "Product images load slowly on category pages",
        description:
          "On the storefront, category pages with many products take several seconds to render images. Likely missing lazy-loading / unoptimised assets.",
        type: "IMPROVEMENT" as const,
        severity: "MEDIUM" as const,
        status: "IN_PROGRESS" as const,
        websiteId: storefrontSite.id,
      },
      {
        issueNo: "ISS-000005",
        title: "Add a newsletter signup to the homepage footer",
        description:
          "We'd like a simple email capture in the footer to grow our mailing list. Should integrate with our existing email tool.",
        type: "SUGGESTION" as const,
        severity: "LOW" as const,
        status: "WAITING_FOR_CLIENT" as const,
        websiteId: marketingSite.id,
      },
    ];

    for (const data of moreIssues) {
      const already = await prisma.issue.findUnique({
        where: { issueNo: data.issueNo },
        select: { id: true },
      });
      if (already) continue;
      const issue = await prisma.issue.create({
        data: {
          ...data,
          reporterId: client.id,
          assignedManagerId: data.status === "OPEN" ? null : manager.id,
        },
      });
      await prisma.issueEvent.create({
        data: {
          issueId: issue.id,
          actorId: client.id,
          type: "CREATED",
          message: "Issue reported by Charlie Client",
        },
      });
    }
  }

  console.log(
    "Seed complete.\n  Manager login: manager / Manager@123\n  Client login:  client / Client@123",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
