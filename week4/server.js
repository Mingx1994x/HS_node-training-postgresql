require("dotenv").config()
const http = require("http")
const AppDataSource = require("./db")

function isUndefined(value) {
  return value === undefined
}

function isNotValidString(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === ""
}

function isNotValidInteger(value) {
  return !Number.isInteger(value) || value === 0
}

const errorResponse = require('./errorResponse');
const { log } = require("console")
const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json"
  }
  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const creditPackageRepo = await AppDataSource.getRepository('CreditPackage');
      const package = await creditPackageRepo.find({
        select: ['id', 'name', 'credit_amount', 'price']
      });

      res.writeHead(200, headers);
      res.write(JSON.stringify({
        status: 'success',
        data: package
      }))
      res.end();
    } catch (error) {
      errorResponse(res, headers, 500, 'error', '伺服器錯誤');
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on('end', async () => {
      try {
        let packageData = JSON.parse(body);
        const { name, credit_amount, price } = packageData;

        //驗證欄位是否符合格式
        if (isUndefined(name) || isUndefined(credit_amount) || isUndefined(price) || isNotValidString(name) || isNotValidInteger(credit_amount) || isNotValidInteger(price)) {
          errorResponse(res, headers, 400, 'failed', '欄位未填寫正確');
          return
        }

        //驗證資料庫內有無資料重複
        const creditPackageRepo = await AppDataSource.getRepository('CreditPackage');
        const existPackage = creditPackageRepo.find({
          where: {
            name
          }
        });
        if ((await existPackage).length > 0) {
          errorResponse(res, headers, 409, 'failed', '資料重複');
          return
        }

        const newPackage = await creditPackageRepo.create({
          name,
          credit_amount,
          price
        });

        const result = await creditPackageRepo.save(newPackage);

        res.writeHead(200, headers);
        res.write(JSON.stringify({
          status: "success",
          data: {
            id: result.id,
            name: result.name,
            credit_amount: result.credit_amount,
            price: result.price
          }
        }));
        res.end();

      } catch (error) {
        errorResponse(res, headers, 500, 'error', '伺服器錯誤');
      }
    })

  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
    try {
      let deleteId = req.url.split('/').pop();

      //驗證欄位是否符合格式
      if (isUndefined(deleteId) || isNotValidString(deleteId)) {
        errorResponse(res, headers, 400, 'failed', 'ID錯誤');
        return
      }

      //驗證是否刪除成功資料庫資料
      const deleteResult = await AppDataSource.getRepository('CreditPackage').delete(deleteId);
      if (deleteResult.affected === 0) {
        errorResponse(res, headers, 400, 'failed', 'ID錯誤');
        return
      }

      res.writeHead(200, headers);
      res.write(JSON.stringify({
        status: 'success'
      }))
      res.end()

    } catch (error) {
      errorResponse(res, headers, 500, 'error', '伺服器錯誤');
    }

  } else if (req.url === '/api/coaches/skill' && req.method === 'GET') {
    try {
      const skillRepo = await AppDataSource.getRepository('Skill');
      const skills = await skillRepo.find({
        select: ['id', 'name']
      })

      res.writeHead(200, headers);
      res.write(JSON.stringify({
        status: 'success',
        data: skills
      }))
      res.end();
    } catch (error) {
      errorResponse(res, headers, 500, 'error', '伺服器錯誤');
    }
  } else if (req.url === '/api/coaches/skill' && req.method === 'POST') {
    req.on('end', async () => {
      try {
        let skillData = JSON.parse(body);
        const { name } = skillData;

        //驗證欄位是否符合格式
        if (isUndefined(name) || isNotValidString(name)) {
          errorResponse(res, headers, 400, 'failed', '欄位未填寫正確');
          return
        }

        //驗證資料庫有無重複資料
        const skillRepo = await AppDataSource.getRepository('Skill');
        const existSkill = await skillRepo.find({
          where: {
            name
          }
        })

        if (existSkill.length > 0) {
          errorResponse(res, headers, 409, 'failed', '資料重複');
          return
        }

        const newSkill = await skillRepo.create({
          name
        });
        const result = await skillRepo.save(newSkill);

        res.writeHead(200, headers);
        res.write(JSON.stringify({
          status: 'success',
          data: {
            id: result.id,
            name: result.name
          }
        }))
        res.end();
      } catch (error) {
        errorResponse(res, headers, 500, 'error', '伺服器錯誤')
      }
    })
  } else if (req.url.startsWith('/api/coaches/skill/') && req.method === 'DELETE') {
    try {
      let deleteId = req.url.split('/').pop();

      //驗證id格式是否正確
      if (isUndefined(deleteId) || isNotValidString(deleteId)) {
        errorResponse(res, headers, 400, 'failed', 'ID錯誤');
        return
      }

      //驗證資料庫是否刪除
      const deleteResult = await AppDataSource.getRepository('Skill').delete(deleteId);
      if (deleteResult.affected === 0) {
        errorResponse(res, headers, 400, 'failed', 'ID錯誤');
        return
      }
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        status: 'success'
      }));
      res.end();
    } catch (error) {
      errorResponse(res, headers, 500, 'error', '伺服器錯誤');
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers)
    res.end()
  } else {
    errorResponse(res, headers, 404, 'failed', '無此網站路由');
  }
}

const server = http.createServer(requestListener)

async function startServer() {
  await AppDataSource.initialize()
  console.log("資料庫連接成功")
  server.listen(process.env.PORT)
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`)
  return server;
}

module.exports = startServer();
