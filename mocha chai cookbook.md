Prerequisites:
***ES2019*** syntax - 
Mocha and Chai must be installed in your project, and in some examples require additional Chai plugins. 

## An example of loading the chai-subset plugin:
```
import chai from 'chai;
import chaiSubset from 'chai-subset';

chai.use(chaiSubset);

describe('unit under test', () => {
  // Your test cases here
});
I tried to make the examples realistic to illustrate when to use each. At the same time, I also tried to keep them lean for easier reading. I omitted parts of the code that are repetitive and do not add value to an example. In practice, real test code would look something like this:

import { expect } from 'chai';
import { double } from './double';

describe('double()', () => {
  it('should double each value in an array', () => {
    expect(double([1, 2])).to.deep.equal([2, 4]);
  });
});
```
## Recipes
#### Arrays
Elements in specific order
We have to use deep in our assertion chain to use value and not strict (===) equality.
```
const double = array => array.map(item => item * 2);

expect(double([1, 2])).to.deep.equal([2, 4]);
Elements in any order
Useful when the actual order of the elements is considered an implementation detail:

const addDoubles = array =>
  array.map(item => [item, item * 2]).flat();

// Actual array: [1, 2, 3, 6]
expect(addDoubles([1, 3])).to.have.members([1, 3, 2, 6]);
const valueAndDouble = array =>
  array.map(item => ({ value: item, double: item * 2 }));

expect(valueAndDouble([1, 2])).to.have.deep.members([
  { value: 2, double: 4 },
  { value: 1, double: 2 },
]);
```

## Nested arrays in any order
In this case using members is not enough. We will use the deep-equal-in-any-order plugin:

```
const getSurveyResponses = () => [
  [
    { question: 'Gender', answer: 'Female' },
    { question: 'Age', answer: '30' },
  ],
  [
    { question: 'Gender', answer: 'Male' },
    { question: 'Age', answer: '31' },
  ],
];

expect(getSurveyResponses()).to.equalInAnyOrder([
  [
    { question: 'Age', answer: '31' },
    { question: 'Gender', answer: 'Male' },
  ],
  [
    { question: 'Age', answer: '30' },
    { question: 'Gender', answer: 'Female' },
  ],
]);
```
In the example above, the order of both the survey responses (outer array) and the questions within a response (inner array) are considered an implementation detail.

## Subsets
Some times we want to created isolated test cases about subsets of an array. Consider the following example:
```
const parseAge = age => {
  const years = parseInt(age);
  const months = parseInt((age - Math.floor(age)) * 12);
  return years >= 1 ? `${years} years` : `${months} months`;
};

const buildQuery = fields => {
  if (!fields.age) {
    throw new Error(`'age' field is required`);
  }

  return Object.entries(fields).map(([key, value]) => {
    const parsedValue = key === 'age' ? parseAge(value) : value;
    return `${key}=${parsedValue}`;
  });
};

expect(buildQuery({ age: '12.3' })).to.deep.equal(['age=12 years']);
expect(buildQuery({ age: '0.5' })).to.deep.equal(['age=6 months']);
expect(
  buildQuery({
    age: '12',
    field1: 'value1',
    field2: 'value2',
  }),
).to.include.members(['field1=value1', 'field2=value2']);
```

Since name is a required field, we have to include it in every valid input. Isolating subsets of the array prevents errors related to name bleeding into other, unrelated assertions.

## Objects
All keys and values
We have to use deep in our assertion chain to use value and not strict (===) equality on the objects.
```
const doubleValues = object =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [key, value * 2]),
  );

expect(doubleValues({ alpha: 1, beta: 2 })).to.deep.equal({
  alpha: 2,
  beta: 4,
});
```
## Value for a key
An object may contain multiple keys and use different logic to calculate their values. We may choose to decouple and simplify our test cases by asserting for specific properties:
```
const getRecords = () => ({
  data: [
    { title: 'Ride the Lightning', year: '1984' },
    { title: 'Master of Puppets', year: '1986' },
  ],
  count: 2,
});

const results = getRecords();
expect(results).to.have.property('count', 2);
expect(results).to.have.deep.property('data', [
  { title: 'Ride the Lightning', year: '1984' },
  { title: 'Master of Puppets', year: '1986' },
]);
Value for a nested key
const getRecordMetadata = () => ({
  metadata: {
    source: 'https://www.metal-archives.com/',
    fields: ['title', 'year'],
  },
});

const results = getRecordMetadata();
expect(results).to.have.nested.property(
  'metadata.source',
  'https://www.metal-archives.com/',
);
expect(results).to.have.nested.deep.property('metadata.fields', [
  'title',
  'year',
]);
```

## Subset of keys
Useful in situations similar to the ones mentioned in array subsets. Essentially it combines multiple property assertions in one. We will use the chai-subset plugin:
```
const parseAge = age => {
  const years = parseInt(age);
  const months = parseInt((age - Math.floor(age)) * 12);
  return years >= 1 ? `${years} years` : `${months} months`;
};

const buildQuery = fields => {
  if (!fields.age) {
    throw new Error(`'age' field is required`);
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      key === 'age' ? parseAge(value) : value,
    ]),
  );
};

expect(buildQuery({ age: '12.3' })).to.deep.equal({
  age: '12 years',
});
expect(buildQuery({ age: '0.5' })).to.deep.equal({ age: '6 months' });
expect(
  buildQuery({
    age: '12',
    field1: 'value1',
    field2: 'value2',
  }),
).to.containSubset({ field1: 'value1', field2: 'value2' });
```
## Nested objects/subset of keys
Very useful when testing API responses. Again, we can leverage the power of chai-subset to assert about any (nested) part of an object:
```
const buildResponse = dataDictionary =>
  Object.fromEntries(
    Object.entries(dataDictionary).map(([key, data]) => {
      return [key, { data, count: data.length }];
    }),
  );

const recordsByArtist = {
  Metallica: [
    {
      title: 'Ride the Lightning',
    },
    { title: 'Master of Puppets' },
  ],
  Opeth: [
    {
      title: 'In Cauda Venemum',
    },
  ],
};

const results = buildResponse(recordsByArtist);
expect(results).to.containSubset({
  Metallica: {
    data: [
      { title: 'Ride the Lightning' },
      { title: 'Master of Puppets' },
    ],
  },
  Opeth: {
    data: [{ title: 'In Cauda Venemum' }],
  },
});
expect(results).to.containSubset({
  Metallica: {
    count: 2,
  },
  Opeth: {
    count: 1,
  },
});
```
## Error Throwing
We will use throw from Chai.js to assert for thrown/not thrown errors.

⚠️ throw will not work for async errors

⚠️ We need to wrap calls to the function under test to another function for throw to work:
```
// ✔ Correct
expect(() => fnUnderTest()).to.throw();

// ❌ Wrong
expect(fnUnderTest()).to.throw();
Error thrown/not thrown
const circleLength = radius => {
  if (isNaN(radius) || radius <= 0) {
    throw new Error('Please provide a valid radius!');
  }
  return 2 * Math.PI * radius;
};

expect(() => circleLength(-1)).to.throw();
expect(() => circleLength(-1)).to.throw(
  'Please provide a valid radius!',
);
expect(() => circleLength(-1)).to.throw(/valid radius/i);

expect(() => circleLength(1)).to.not.throw();
```
## Async Functions
We will use chai-as-promised for this section's examples. It is a very helpful plugin that allows us to write assertions for async code in an elegant way.

⚠️ Make sure that you always await any expectations that use chai-as-promised. If not, any assertion errors will be thrown after the test case has run:
```
const eventuallyFalse = async () => true; // Wrong code

// ✔ Correct usage - test fails
it('should resolve to false', async () => {
  await expect(eventuallyFalse()).to.eventually.be.false;
});

// ✔ Correct usage - tests fails
it('should resolve to false', () => {
  return expect(eventuallyFalse()).to.eventually.be.false;
});

// ❌ Wrong usage - test passes
it('should resolve to false', () => {
  expect(eventuallyFalse()).to.eventually.be.false;
});
```
⚠️ Add chai-as-promised after other chai plugins, so that you can use it in conjunction with them:
```
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';

chai.use(chaiSubset);
chai.use(chaiAsPromised); // We can now use async `chai-subset` assertions
Promise resolves
const checkCredentials = async ({ name, password }) => {
  if (name !== 'testuser' || password !== 'testpass') {
    throw new Error('Invalid credentials!');
  }
};

expect(checkCredentials({ name: 'testuser', password: 'testpass' }))
  .be.fulfilled;
  ```
## Results
We simply have to add eventually in our assertion chain. It can be used together with any value assertion:
```
const getRecords = async () => ({
  data: [
    { title: 'Ride the Lightning', year: '1984' },
    { title: 'Master of Puppets', year: '1986' },
  ],
  count: 2,
});

expect(getRecords()).to.eventually.have.deep.property('count', 2);
Errors
const artists = [
  { id: 1, name: 'Metallica' },
  { id: 2, name: 'Opeth' },
];

const getArtistById = async id => {
  if (!id) {
    throw new Error('Please provide a valid id');
  }
  return (
    artists.find(({ id: currentId }) => currentId === id) || null
  );
};

expect(getArtistById()).to.be.rejected;
expect(getArtistById()).to.be.rejectedWith(
  'Please provide a valid id',
);
expect(getArtistById()).to.be.rejectedWith(/valid id/);
```
