import { prisma } from "./src/lib/db/prisma";

async function main() {
  // Delete the two incorrectly linked accounts
  await prisma.account.deleteMany({
    where: {
      providerAccountId: {
        in: ["108470213840792284528", "110792131742060565649"]
      }
    }
  });

  // Now create the admin user manually to bypass the pending screen for the admin!
  const adminEmail = "tanishqsethi04@gmail.com";
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Tanishq Sethi",
      role: "ADMIN",
      emailVerified: new Date(),
    }
  });

  // Link the Google account to the admin user
  await prisma.account.create({
    data: {
      userId: adminUser.id,
      type: "oidc",
      provider: "google",
      providerAccountId: "110792131742060565649", // The providerAccountId from the logs for tanishqsethi04
    }
  });

  console.log("Deleted incorrect account links and created proper Admin user.");
}
main().finally(()=>prisma.$disconnect());
