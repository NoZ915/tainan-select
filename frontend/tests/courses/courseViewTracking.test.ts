import assert from 'node:assert/strict'
import test from 'node:test'
import { getCourse } from '../../src/apis/courseAPI'
import { axiosInstance } from '../../src/apis/axiosInstance'

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'

test('課程 request 一律共用 Analytics Client ID', async (t) => {
  const getMock = t.mock.method(axiosInstance, 'get', async () => ({ data: { course: {} } }))

  await getCourse('12', {
    getClientId: async () => CLIENT_ID,
  })

  assert.deepEqual(getMock.mock.calls[0].arguments, [
    '/courses/12',
    { headers: { 'X-Analytics-Client-Id': CLIENT_ID } },
  ])
})

test('clientId localStorage 失敗時仍取得課程資料', async (t) => {
  const getMock = t.mock.method(axiosInstance, 'get', async () => ({ data: { course: {} } }))
  const trackingError = new Error('storage unavailable')
  let receivedError: unknown

  await getCourse('12', {
    getClientId: async () => { throw trackingError },
    onTrackingError: (error) => { receivedError = error },
  })

  assert.equal(receivedError, trackingError)
  assert.deepEqual(getMock.mock.calls[0].arguments, [
    '/courses/12',
    { headers: undefined },
  ])
})
