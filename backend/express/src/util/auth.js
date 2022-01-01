import jwt from 'jsonwebtoken'
function authToken(req, res, next) {
  const token = req.headers['authorization']
  if (token == null) return res.sendStatus(401)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, id) => {
    if (err) return res.sendStatus(403) // unvalid token
    req.id = id
    next()
  })
}

function generateAccessToken(id) {
  return jwt.sign(id, process.env.ACCESS_TOKEN_SECRET)
}

export { authToken, generateAccessToken }
export default { authToken, generateAccessToken }
