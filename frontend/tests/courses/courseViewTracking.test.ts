import assert from 'node:assert/strict'
import test from 'node:test'
import { getCourse } from '../../src/apis/courseAPI'
import { axiosInstance } from '../../src/apis/axiosInstance'
import { canFetchCourse } from '../../src/hooks/courses/useGetCourse'

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'

test('課程詳情會等待 auth resolved', () => {
  assert.equal(canFetchCourse('12', false), false)
  assert.equal(canFetchCourse('', true), false)
  assert.equal(canFetchCourse('12', true), true)
})

test('匿名課程 request 共用 Analytics Client ID', async (t) => {
  const getMock = t.mock.method(axiosInstance, 'get', async () => ({ data: { course: {} } }))

  await getCourse('12', {
    isAuthenticated: false,
    getClientId: async () => CLIENT_ID,
  })

  assert.deepEqual(getMock.mock.calls[0].arguments, [
    '/courses/12',
    { headers: { 'X-Analytics-Client-Id': CLIENT_ID } },
  ])
})

test('登入 request 不取得或傳送 clientId', async (t) => {
  const getMock = t.mock.method(axiosInstance, 'get', async () => ({ data: { course: {} } }))
  let clientIdRequested = false

  await getCourse('12', {
    isAuthenticated: true,
    getClientId: async () => {
      clientIdRequested = true
      return CLIENT_ID
    },
  })

  assert.equal(clientIdRequested, false)
  assert.deepEqual(getMock.mock.calls[0].arguments, [
    '/courses/12',
    { headers: undefined },
  ])
})

test('clientId localStorage 失敗時仍取得課程資料', async (t) => {
  const getMock = t.mock.method(axiosInstance, 'get', async () => ({ data: { course: {} } }))
  const trackingError = new Error('storage unavailable')
  let receivedError: unknown

  await getCourse('12', {
    isAuthenticated: false,
    getClientId: async () => { throw trackingError },
    onTrackingError: (error) => { receivedError = error },
  })

  assert.equal(receivedError, trackingError)
  assert.deepEqual(getMock.mock.calls[0].arguments, [
    '/courses/12',
    { headers: undefined },
  ])
})
