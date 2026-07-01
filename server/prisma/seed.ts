import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const COUNTRIES = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'BR', 'IN', 'MX']

const DUPLICATES = [
  { first_name: 'James', last_name: 'Smith', count: 5 },
  { first_name: 'Mary', last_name: 'Johnson', count: 4 },
  { first_name: 'Robert', last_name: 'Williams', count: 5 },
  { first_name: 'Patricia', last_name: 'Brown', count: 3 },
  { first_name: 'John', last_name: 'Jones', count: 4 },
  { first_name: 'Jennifer', last_name: 'Davis', count: 2 },
  { first_name: 'Michael', last_name: 'Miller', count: 5 },
  { first_name: 'Linda', last_name: 'Wilson', count: 3 },
  { first_name: 'David', last_name: 'Moore', count: 4 },
  { first_name: 'Barbara', last_name: 'Taylor', count: 2 },
  { first_name: 'William', last_name: 'Anderson', count: 3 },
  { first_name: 'Susan', last_name: 'Thomas', count: 2 },
  { first_name: 'Charles', last_name: 'Jackson', count: 4 },
  { first_name: 'Jessica', last_name: 'White', count: 3 },
  { first_name: 'Christopher', last_name: 'Harris', count: 5 },
  { first_name: 'Sarah', last_name: 'Martin', count: 2 },
  { first_name: 'Daniel', last_name: 'Thompson', count: 4 },
  { first_name: 'Karen', last_name: 'Garcia', count: 3 },
  { first_name: 'Matthew', last_name: 'Martinez', count: 5 },
  { first_name: 'Nancy', last_name: 'Robinson', count: 2 },
  { first_name: 'Anthony', last_name: 'Clark', count: 4 },
  { first_name: 'Betty', last_name: 'Rodriguez', count: 3 },
  { first_name: 'Mark', last_name: 'Lewis', count: 5 },
  { first_name: 'Dorothy', last_name: 'Lee', count: 2 },
  { first_name: 'Donald', last_name: 'Walker', count: 4 },
  { first_name: 'Lisa', last_name: 'Hall', count: 3 },
  { first_name: 'Steven', last_name: 'Allen', count: 2 },
  { first_name: 'Sandra', last_name: 'Young', count: 5 },
  { first_name: 'Paul', last_name: 'Hernandez', count: 3 },
  { first_name: 'Ashley', last_name: 'King', count: 4 },
]

function randomCountry() {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]
}

async function main() {
  console.log('Seeding database...')

  const users: {
    first_name: string
    last_name: string
    username: string
    email: string
    active: boolean
    country: string
  }[] = []

  // Add duplicate name entries
  for (const { first_name, last_name, count } of DUPLICATES) {
    for (let i = 0; i < count; i++) {
      users.push({
        first_name,
        last_name,
        username: faker.internet.username(),
        email: faker.internet.email({ firstName: first_name, lastName: last_name }),
        active: faker.datatype.boolean(0.8),
        country: randomCountry(),
      })
    }
  }

  // Fill remaining slots with unique random users
  const remaining = 1000 - users.length
  for (let i = 0; i < remaining; i++) {
    const first_name = faker.person.firstName()
    const last_name = faker.person.lastName()
    users.push({
      first_name,
      last_name,
      username: faker.internet.username(),
      email: faker.internet.email({ firstName: first_name, lastName: last_name }),
      active: faker.datatype.boolean(0.8),
      country: randomCountry(),
    })
  }

  // Shuffle so duplicates aren't all at the top
  users.sort(() => Math.random() - 0.5)

  await prisma.user.createMany({ data: users })
  console.log(`Seeded ${users.length} users`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
