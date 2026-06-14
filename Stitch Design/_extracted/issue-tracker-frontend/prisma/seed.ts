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
