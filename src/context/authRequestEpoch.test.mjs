import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthRequestEpoch } from './authRequestEpoch.mjs';

test('only the latest auth request remains current', () => {
  const epoch = createAuthRequestEpoch();
  const firstRequest = epoch.begin();
  const secondRequest = epoch.begin();

  assert.equal(epoch.isCurrent(firstRequest), false);
  assert.equal(epoch.isCurrent(secondRequest), true);
});

test('logout invalidates pending auth requests', () => {
  const epoch = createAuthRequestEpoch();
  const pendingRequest = epoch.begin();

  epoch.invalidate();

  assert.equal(epoch.isCurrent(pendingRequest), false);
});

test('a request started after invalidation becomes current', () => {
  const epoch = createAuthRequestEpoch();
  const priorRequest = epoch.begin();
  epoch.invalidate();
  const nextRequest = epoch.begin();

  assert.equal(epoch.isCurrent(priorRequest), false);
  assert.equal(epoch.isCurrent(nextRequest), true);
});

test('late responses cannot commit state after a newer request starts', async () => {
  const epoch = createAuthRequestEpoch();
  let authorization = null;
  let finishFirstRequest;

  const firstRequestId = epoch.begin();
  const firstRequest = new Promise((resolve) => {
    finishFirstRequest = resolve;
  }).then((result) => {
    if (epoch.isCurrent(firstRequestId)) authorization = result;
  });

  const secondRequestId = epoch.begin();
  if (epoch.isCurrent(secondRequestId)) authorization = 'current account';
  finishFirstRequest('previous account');
  await firstRequest;

  assert.equal(authorization, 'current account');
});
