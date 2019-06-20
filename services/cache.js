const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const redisURL = "redis://127.0.0.1:6379";

const client = redis.createClient(redisURL);
client.get = util.promisify(client.get);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function() {
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name
  });

  const cacheValue = await client.get(key);

  // return cached values if there are any
  if (cacheValue) {
    console.log("SERVING CACHE");

    const doc = new this.model(JSON.parse(cacheValue));

    return doc;
  }

  //else execute querry, return values, and add to cache
  const result = await exec.apply(this, arguments);

  client.set(key, JSON.stringify(result));
  return result;
};
