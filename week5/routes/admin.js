const express = require('express');

const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('admin')
const { isUndefined, isNotValidInteger, isNotValidString, isValidImgUrl } = require('../utils/validate');

const router = express.Router();
router.post('/coaches/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;
    console.log("url:", profile_image_url.split('.').pop());

    if (isUndefined(experience_years) || isUndefined(description) || isNotValidInteger(experience_years) || isNotValidString(description) || (profile_image_url && isValidImgUrl(profile_image_url))) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }

    const userRepo = dataSource.getRepository('User');
    const findUser = await userRepo.findOne({
      where: {
        id: userId
      }
    })

    if (!findUser) {
      res.status(400).json({
        status: 'failed',
        message: '使用者不存在'
      })
      return
    } else if (findUser.role === 'COACH') {
      res.status(409).json({
        status: 'failed',
        message: '使用者已經是教練'
      })
      return
    }

    // const coachRepo=dataSource.getRepository('Coach');
    const updateToCoach = userRepo.update({
      id: userId
    }, {
      role: "COACH"
    })

    if ((await updateToCoach).affected === 0) {
      res.status(409).json({
        status: 'failed',
        message: '更新使用者失敗'
      })
      return
    }

    const coachRepo = dataSource.getRepository('COACH');
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years,
      description,
      profile_image_url
    });
    const coachResult = await coachRepo.save(newCoach);
    const userResult = await userRepo.findOne({
      where: {
        id: userId
      }
    })


    res.status(200).json({
      status: 'success',
      data: {
        users: {
          name: userResult.name,
          role: userResult.role
        },
        coach: coachResult
      },

    })

  } catch (error) {
    next(error)
  }
})


module.exports = router;