import express from 'express'
import { request } from './request.js'
import { createUser, updateUser } from '../schema/user-schema.js'
const user = express.Router()

user.post('/', async (req, res) => {
  await request({
    method: 'POST',
    table: 'user',
    data: req.body,
    validation: createUser,
    res: res,
  })
})

user.get('/', async (req, res) => {
  await request({
    method: 'GET',
    table: 'user',
    ids: req.query,
    selectCols: [
      'id',
      'email',
      'username',
      'right_handed',
      'target_learning_time',
    ],
    res: res,
  })
})

user.patch('/', async (req, res) => {
  await request({
    method: 'PATCH',
    table: 'user',
    data: req.body.data,
    ids: req.body.ids,
    validation: updateUser,
    res: res,
  })
})

user.delete('/', async (req, res) => {
  await request({
    method: 'DELETE',
    table: 'user',
    ids: req.body,
    res: res,
  })
})

export { user }
export default { user }
