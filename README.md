# ScoutTrek API

## Apollo GraphQL schema for Boy and Girls Scout Troops to create custom events

* Create common events such as camping, hiking, and backpacking based on ScoutTrek templates
* Create custom event templates for your Troop and allow authorized users like Patrol Leaders to create those event types
* Store, update, and send notifcations based on the latest changes to events, ensuring all users are up to date


## Tech

* Apollo Server
* Mongoose + Atlas MongoDB Database
* Google Cloud App Engine


## Setting up on local
1. Clone the repo to your local using `https://github.com/sandboxnu/ScoutTrek-Backend.git`
2. Get the .env file (reach out to a ScoutTrek developer) and add it to the root directory
3. Reach out to a ScoutTrek developer for MongoDB and Google Cloud invite. Check notion for 
instructions on setting up Google Cloud. 
4. In the terminal, run `yarn install`
5. Run `yarn start` to start the server
6. Make sure you have `ScoutTrek-Frontend` set up as well -- see the [readme](https://github.com/sandboxnu/ScoutTrek-Frontend#readme) to begin developing
