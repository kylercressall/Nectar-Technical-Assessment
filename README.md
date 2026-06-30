# NectarHR Candidate Assessment

Thank you for your interest in working at NectarHR.
Here you'll find some basics for getting started with our assessment.

## Client
The client directory contains a skeleton Vue application.

The client is rendered as static files from the `server` all you really need
to do is build the client and the server will do the rest.

1. cd into `/client`
2. run `npm install`
3. run `npm run build`
   1. Alternatively run `npm run build-watch` which will allow your changes to be live loaded.

## Server
The default port is set to `3001` (configurable via `.env`).
1. cd into `/server`
2. run `npm install`
3. copy the example env file: `cp .env.example .env`
4. initialize the database: `npm run migrate-deploy`
5. run `npm run dev`

## Database
We use SQLite for local development with Prisma as the ORM. The schema lives at `/server/prisma/schema.prisma` and migrations at `/server/prisma/migrations/`.

The database file (`dev.db`) is not committed — step 4 in the Server setup above generates it from the tracked migrations.

### Modifying the schema

When you need to make schema changes, use the migration workflow so the change is captured as a reviewable SQL file:

1. Edit `schema.prisma` (add models, fields, etc.).
2. From `/server`, run: `npx prisma migrate dev --name describe_your_change`
   - This generates a new migration file under `prisma/migrations/`, applies it to your local DB, and regenerates the Prisma Client.
3. Commit the new migration file alongside your code changes.




