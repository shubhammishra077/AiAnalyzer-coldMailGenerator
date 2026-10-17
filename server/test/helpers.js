// Dependency-free test helpers: swap real modules (Mongoose models, mailer, JWT, axios)
// for in-memory fakes so controller logic can be tested without a database or network.
const Module = require('module');
const path = require('path');

const root = path.join(__dirname, '..');
const mocks = new Map();
const originalLoad = Module._load;

Module._load = function (request, parent) {
  const key = request.startsWith('.') && parent
    ? path.resolve(path.dirname(parent.filename), request).replace(/\.js$/, '')
    : request;
  if (mocks.has(key)) return mocks.get(key);
  return originalLoad.apply(this, arguments);
};

exports.mockLocal = (rel, impl) => mocks.set(path.join(root, rel), impl);
exports.mockPackage = (name, impl) => mocks.set(name, impl);

exports.load = (rel) => {
  const file = require.resolve(path.join(root, rel));
  delete require.cache[file];
  return require(file);
};

exports.mockRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};

// Mongoose returns query objects that are both thenable and chainable (.select)
const chain = (value) => ({
  select: async () => value,
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
});

const matches = (doc, query) =>
  Object.entries(query).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$gt' in cond) return doc[key] && doc[key] > cond.$gt;
    return doc[key] === cond;
  });

class FakeUser {
  constructor(data = {}) {
    Object.assign(this, { isVerified: false, otpAttempts: 0, profile: {} }, data);
    this._id = data._id || `u${FakeUser.seq++}`;
  }
  async save() { FakeUser.store.set(this._id, this); return this; }
  async matchPassword(p) { return p === this.password; } // real model compares bcrypt hashes
  static async create(data) { return new FakeUser(data).save(); }
  static async findOne(query) {
    for (const doc of FakeUser.store.values()) if (matches(doc, query)) return doc;
    return null;
  }
  static findById(id) { return chain(FakeUser.store.get(id) || null); }
  static findByIdAndUpdate(id, update) {
    const doc = FakeUser.store.get(id);
    if (doc && update.$set) Object.assign(doc, update.$set);
    return chain(doc || null);
  }
  static async deleteOne(query) {
    const doc = [...FakeUser.store.values()].find((d) => matches(d, query));
    if (doc) FakeUser.store.delete(doc._id);
    return { deletedCount: doc ? 1 : 0 };
  }
  static reset() { FakeUser.store = new Map(); FakeUser.seq = 1; }
}
FakeUser.reset();
exports.FakeUser = FakeUser;

// JWT fake: token format "jwt:<id>:<iat>"
exports.fakeJwt = {
  sign: ({ id }) => `jwt:${id}:${Math.floor(Date.now() / 1000)}`,
  verify: (token) => {
    const [tag, id, iat] = String(token).split(':');
    if (tag !== 'jwt') throw new Error('invalid token');
    return { id, iat: Number(iat) };
  },
};
