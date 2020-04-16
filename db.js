import { MongoClient, ObjectID } from "mongodb";

export class MongoDbProvider {
  constructor(url) {
    this.mongoClient = new MongoClient(url, { useUnifiedTopology: true });
  }

  // get postsCollection() {
  //   const postsCollection = this.getCollection("posts");

  //   if (!postsCollection) {
  //     throw new Error("Posts collection is undefined");
  //   }

  //   return postsCollection;
  // }

  get usersCollection() {
    const usersCollection = this.getCollection("users");

    if (!usersCollection) {
      throw new Error("Users collection is undefined");
    }

    return usersCollection;
  }

  /**
   * Connect to MongoDB.
   * @async
   * @param databaseName - Database name.
   */
  async connectAsync(databaseName) {
    try {
      await this.mongoClient.connect();
      this.database = this.mongoClient.db(databaseName);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Close the database and its underlying connections.
   */
  async closeAsync() {
    await this.mongoClient.close();
  }

  /**
   * Fetch a specific collection.
   * @private
   * @param collectionName - Collection name.
   * @returns The collection instance.
   */
  getCollection(collectionName) {
    if (!this.database) {
      throw new Error("Database is undefined.");
    }

    return this.database.collection(collectionName);
  }
}
export const mongoDbProvider = new MongoDbProvider(process.env.MONGO_URL);

/**
 * Add mock users if `users` collection is empty.
 * TODO: Remove in Production.
 */
// export async function addMockUsersAsync() {
//   const usersCount = await mongoDbProvider.usersCollection.countDocuments({});

//   if (usersCount === 0) {
//     await mongoDbProvider.usersCollection().insertMany([
//       {
//         _id: new ObjectID("0123456789abcdef01234567"),
//         firstName: "Test",
//         lastName: "User 1",
//         email: "test.user1@test.com",
//       },
//       {
//         _id: new ObjectID("fedcba987654321098765432"),
//         firstName: "Test",
//         lastName: "User 2",
//         email: "test.user2@test.com",
//         following: [new ObjectID("0123456789abcdef01234567")],
//       },
//     ]);
//   }
// }
