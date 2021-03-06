const weaviate = require('../index');

const thingClassName = 'DataJourneyTestThing';
const actionClassName = 'DataJourneyTestAction';
const refSourceClassName = 'DataJourneyTestRefSource';

describe('data', () => {
  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  it('creates a schema class', () => {
    // this is just test setup, not part of what we want to test here
    return setup(client);
  });

  it('validates a valid thing', () => {
    const schema = {stringProp: 'without-id'};

    return client.data
      .validator()
      .withId('11992f06-2eac-4f0b-973f-7d230d3bdbaf')
      .withClassName(thingClassName)
      .withSchema(schema)
      .do()
      .then(res => {
        expect(res).toEqual(true);
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('(validator) errors on an invalid valid thing', () => {
    const schema = {stringProp: 234}; // number is invalid

    return client.data
      .validator()
      .withId('11992f06-2eac-4f0b-973f-7d230d3bdbaf')
      .withClassName(thingClassName)
      .withSchema(schema)
      .do()
      .catch(e => {
        expect(e).toEqual(
          `usage error (422): {"error":[{"message":"invalid thing: invalid string property 'stringProp' on class 'DataJourneyTestThing': not a string, but json.Number"}]}`,
        );
      });
  });

  let implicitThingId;

  it('creates a new thing object without an explicit id', () => {
    const schema = {stringProp: 'without-id'};

    return client.data
      .creator()
      .withClassName(thingClassName)
      .withSchema(schema)
      .do()
      .then(res => {
        expect(res.schema).toEqual(schema);
        implicitThingId = res.id;
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('creates a new thing object with an explicit id', () => {
    const schema = {stringProp: 'with-id'};
    const id = '1565c06c-463f-466c-9092-5930dbac3887';

    return client.data
      .creator()
      .withClassName(thingClassName)
      .withSchema(schema)
      .withId(id)
      .withKind(weaviate.KIND_THINGS)
      .do()
      .then(res => {
        expect(res.schema).toEqual(schema);
        expect(res.id).toEqual(id);
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('creates another thing', () => {
    // we need this later for the reference test!
    const schema = {};
    const id = '599a0c64-5ed5-4d30-978b-6c9c45516db1';

    return client.data
      .creator()
      .withClassName(refSourceClassName)
      .withSchema(schema)
      .withId(id)
      .withKind(weaviate.KIND_THINGS)
      .do()
      .then(res => {
        expect(res.schema).toEqual(schema);
        expect(res.id).toEqual(id);
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('creates a new action object with an explicit id', () => {
    const schema = {stringProp: 'this-is-the-action'};
    const id = '40d2f93a-8f55-4561-8636-7c759f89ef13';

    return client.data
      .creator()
      .withClassName(actionClassName)
      .withSchema(schema)
      .withId(id)
      .withKind(weaviate.KIND_ACTIONS)
      .do()
      .then(res => {
        expect(res.schema).toEqual(schema);
        expect(res.id).toEqual(id);
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('waits for es index updates', () => {
    return new Promise((resolve, reject) => {
      // TODO: remove in 1.0.0
      setTimeout(resolve, 1000);
    });
  });

  it('errors without a className', () => {
    return client.data
      .creator()
      .do()
      .then(() => fail('it should have errord'))
      .catch(err => {
        expect(err).toEqual(
          new Error(
            'invalid usage: className must be set - set with .withClassName(className)',
          ),
        );
      });
  });

  it('gets all things', () => {
    return client.data
      .getter()
      .do()
      .then(res => {
        expect(res.things).toHaveLength(3);
        expect(res.things).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: '1565c06c-463f-466c-9092-5930dbac3887',
              schema: {stringProp: 'with-id'},
            }),
            expect.objectContaining({schema: {stringProp: 'without-id'}}),
          ]),
        );
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('gets all things with all optional _underscore params', () => {
    return client.data
      .getter()
      .withUnderscoreClassification()
      .withUnderscoreInterpretation()
      .withUnderscoreNearestNeighbors()
      .withUnderscoreFeatureProjection()
      .withUnderscoreVector()
      .withLimit(2)
      .do()
      .then(res => {
        expect(res.things).toHaveLength(2);
        expect(res.things[0]._vector.length).toBeGreaterThan(10);
        expect(res.things[0]._interpretation).toBeDefined();
        expect(res.things[0]._featureProjection).toBeDefined();
        expect(res.things[0]._nearestNeighbors).toBeDefined();
        // not testing for classification as that's only set if the object was
        // actually classified, this one wasn't
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('gets all actions', () => {
    return client.data
      .getter()
      .withKind(weaviate.KIND_ACTIONS)
      .do()
      .then(res => {
        expect(res.actions).toHaveLength(1);
        expect(res.actions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: '40d2f93a-8f55-4561-8636-7c759f89ef13',
              schema: {stringProp: 'this-is-the-action'},
            }),
          ]),
        );
      });
  });

  it('gets one thing by id', () => {
    return client.data
      .getterById()
      .withId('1565c06c-463f-466c-9092-5930dbac3887')
      .do()
      .then(res => {
        expect(res).toEqual(
          expect.objectContaining({
            id: '1565c06c-463f-466c-9092-5930dbac3887',
            schema: {stringProp: 'with-id'},
          }),
        );
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('gets one thing by id with all optional underscore props', () => {
    return client.data
      .getterById()
      .withId('1565c06c-463f-466c-9092-5930dbac3887')
      .withUnderscoreClassification()
      .withUnderscoreInterpretation()
      .withUnderscoreNearestNeighbors()
      .withUnderscoreVector()
      .do()
      .then(res => {
        expect(res._vector.length).toBeGreaterThan(10);
        expect(res._interpretation).toBeDefined();
        expect(res._nearestNeighbors).toBeDefined();
        // not testing for classification as that's only set if the object was
        // actually classified, this one wasn't
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('gets one action by id', () => {
    return client.data
      .getterById()
      .withId('40d2f93a-8f55-4561-8636-7c759f89ef13')
      .withKind(weaviate.KIND_ACTIONS)
      .do()
      .then(res => {
        expect(res).toEqual(
          expect.objectContaining({
            id: '40d2f93a-8f55-4561-8636-7c759f89ef13',
            schema: {stringProp: 'this-is-the-action'},
          }),
        );
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('errors if the id is empty', () => {
    return client.data
      .getterById()
      .do()
      .then(() => fail('it should have errord'))
      .catch(e => {
        expect(e).toEqual(
          new Error(
            'invalid usage: id must be set - initialize with getterById(id)',
          ),
        );
      });
  });

  it('updates a thing', () => {
    const id = '1565c06c-463f-466c-9092-5930dbac3887';
    return client.data
      .getterById()
      .withId(id)
      .do()
      .then(res => {
        // alter the schema
        const schema = res.schema;
        schema.stringProp = 'thing-updated';
        return client.data
          .updater()
          .withId(id)
          .withClassName(thingClassName)
          .withSchema(schema)
          .do();
      })
      .then(res => {
        expect(res.schema).toEqual({
          stringProp: 'thing-updated',
        });
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('updates an action', () => {
    const id = '40d2f93a-8f55-4561-8636-7c759f89ef13';
    return client.data
      .getterById()
      .withId(id)
      .withKind(weaviate.KIND_ACTIONS)
      .do()
      .then(res => {
        // alter the schema
        const schema = res.schema;
        schema.stringProp = 'action-updated';
        return client.data
          .updater()
          .withId(id)
          .withClassName(actionClassName)
          .withKind(weaviate.KIND_ACTIONS)
          .withSchema(schema)
          .do();
      })
      .then(res => {
        expect(res.schema).toEqual({
          stringProp: 'action-updated',
        });
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('merges a thing', () => {
    const id = '1565c06c-463f-466c-9092-5930dbac3887';
    return client.data
      .getterById()
      .withId(id)
      .do()
      .then(res => {
        // alter the schema
        const schema = res.schema;
        schema.intProp = 7;
        return client.data
          .merger()
          .withId(id)
          .withKind(weaviate.KIND_THINGS)
          .withClassName(thingClassName)
          .withSchema(schema)
          .do();
      })
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('adds a reference to a thing', () => {
    const sourceId = '599a0c64-5ed5-4d30-978b-6c9c45516db1';
    const targetId = '1565c06c-463f-466c-9092-5930dbac3887';

    return client.data
      .referenceCreator()
      .withKind(weaviate.KIND_THINGS)
      .withId(sourceId)
      .withReferenceProperty('refProp')
      .withReference(
        client.data
          .referencePayloadBuilder()
          .withId(targetId)
          .withKind(weaviate.KIND_THINGS)
          .payload(),
      )
      .do()
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('replaces all references of a thing', () => {
    const sourceId = '599a0c64-5ed5-4d30-978b-6c9c45516db1';
    const targetId = implicitThingId;

    return client.data
      .referenceReplacer()
      .withKind(weaviate.KIND_THINGS)
      .withId(sourceId)
      .withReferenceProperty('refProp')
      .withReferences([
        client.data
          .referencePayloadBuilder()
          .withId(targetId)
          .withKind(weaviate.KIND_THINGS)
          .payload(),
      ])
      .do()
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('deletes a single reference of a thing', () => {
    const sourceId = '599a0c64-5ed5-4d30-978b-6c9c45516db1';
    const targetId = implicitThingId;

    return client.data
      .referenceDeleter()
      .withKind(weaviate.KIND_THINGS)
      .withId(sourceId)
      .withReferenceProperty('refProp')
      .withReference(
        client.data
          .referencePayloadBuilder()
          .withId(targetId)
          .withKind(weaviate.KIND_THINGS)
          .payload(),
      )
      .do()
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('deletes a thing', () => {
    return client.data
      .deleter()
      .withId('1565c06c-463f-466c-9092-5930dbac3887')
      .do()
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('deletes an action', () => {
    return client.data
      .deleter()
      .withKind(weaviate.KIND_ACTIONS)
      .withId('40d2f93a-8f55-4561-8636-7c759f89ef13')
      .do()
      .catch(e => fail('it should not have errord: ' + e));
  });

  it('waits for es index updates', () => {
    return new Promise((resolve, reject) => {
      // TODO: remove in 1.0.0
      setTimeout(resolve, 1000);
    });
  });

  it('verifies there are now fewer things (after delete)', () => {
    return Promise.all([
      client.data
        .getter()
        .do()
        .then(res => {
          expect(res.things).toHaveLength(2);
        })
        .catch(e => fail('it should not have errord: ' + e)),
      client.data
        .getter()
        .withKind(weaviate.KIND_ACTIONS)
        .do()
        .then(res => {
          expect(res.actions).toHaveLength(0);
        })
        .catch(e => fail('it should not have errord: ' + e)),
    ]);
  });

  it('tears down and cleans up', () => {
    return Promise.all([
      client.schema
        .classDeleter()
        .withClassName(actionClassName)
        .withKind(weaviate.KIND_ACTIONS)
        .do(),
      client.schema.classDeleter().withClassName(thingClassName).do(),
      client.schema.classDeleter().withClassName(refSourceClassName).do(),
    ]);
  });
});

const setup = async client => {
  const thing = {
    class: thingClassName,
    properties: [
      {
        name: 'stringProp',
        dataType: ['string'],
      },
      {
        name: 'intProp',
        dataType: ['int'],
      },
    ],
  };

  const action = {
    class: actionClassName,
    properties: [
      {
        name: 'stringProp',
        dataType: ['string'],
      },
      {
        name: 'intProp',
        dataType: ['int'],
      },
    ],
  };

  await Promise.all([
    client.schema.classCreator().withClass(thing).do(),
    client.schema
      .classCreator()
      .withClass(action)
      .withKind(weaviate.KIND_ACTIONS)
      .do(),
  ]);

  const refSource = {
    class: refSourceClassName,
    properties: [
      {
        name: 'refProp',
        dataType: [thingClassName],
        cardinality: 'many',
      },
    ],
  };

  return client.schema.classCreator().withClass(refSource).do();
};
