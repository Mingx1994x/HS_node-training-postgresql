const express = require('express');

const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('admin')
const { isUndefined, isNotValidInteger, isNotValidString, isNotValidUrl, isNotValidImg } = require('../utils/validate');

const router = express.Router();
const userRepo = dataSource.getRepository('User');
const coachRepo = dataSource.getRepository('Coach');
const skillRepo = dataSource.getRepository('Skill');
const courseRepo = dataSource.getRepository('Course');

router.post('/coaches/courses', async (req, res, next) => {
  try {
    const { user_id, skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;

    if (isUndefined(user_id) || isNotValidString(user_id) || isUndefined(skill_id) || isNotValidString(skill_id) || isUndefined(name) || isNotValidString(name) || isUndefined(description) || isNotValidString(description) || isUndefined(start_at) || isNotValidString(start_at) || isUndefined(end_at) || isNotValidString(end_at) || isUndefined(max_participants) || isNotValidInteger(max_participants) || (meeting_url && isNotValidUrl(meeting_url))) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }

    const findUser = await userRepo.findOne({
      where: {
        id: user_id
      }
    })

    if (!findUser) {
      res.status(400).json({
        status: 'failed',
        message: '使用者不存在'
      })
      return
    } else if (findUser.role !== "COACH") {
      res.status(400).json({
        status: 'failed',
        message: '使用者尚未成為教練'
      })
      return
    }
    //技能id由介面渲染設定?
    // const findSkill = await skillRepo.findOne({
    //   where: {
    //     id: skill_id
    //   }
    // })

    // if (!findSkill) {
    //   res.status(400).json({
    //     status: 'failed',
    //     message: '技能不存在'
    //   })
    //   return
    // }

    const newCourse = courseRepo.create({
      user_id,
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url
    })

    const courseResult = await courseRepo.save(newCourse);

    res.status(201).json({
      status: 'success',
      data: {
        course: courseResult
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/coaches/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url } = req.body;
    // console.log("url:", profile_image_url.split('.').pop());

    if (isUndefined(experience_years) || isUndefined(description) || isNotValidInteger(experience_years) || isNotValidString(description) || (profile_image_url && isNotValidUrl(profile_image_url) && isNotValidImg(profile_image_url))) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }

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

router.put('/coaches/courses/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;

    if (isUndefined(skill_id) || isNotValidString(skill_id) || isUndefined(name) || isNotValidString(name) || isUndefined(description) || isNotValidString(description) || isUndefined(start_at) || isNotValidString(start_at) || isUndefined(end_at) || isNotValidString(end_at) || isUndefined(max_participants) || isNotValidInteger(max_participants) || (meeting_url && isNotValidUrl(meeting_url))) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }

    const findCourse = await courseRepo.findOne({
      where: {
        id: courseId
      }
    })

    if (!findCourse) {
      res.status(400).json({
        status: 'failed',
        message: '課程不存在'
      })
      return
    }

    const courseUpdataResult = await courseRepo.update(
      {
        id: courseId
      },
      {
        skill_id,
        name,
        description,
        start_at,
        end_at,
        meeting_url,
        max_participants
      }
    )

    if (courseUpdataResult.affected === 0) {
      res.status(400).json({
        status: 'failed',
        message: '更新課程失敗'
      })
      return
    }

    const courseResult = await courseRepo.findOne({
      where: {
        id: courseId
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        course: courseResult
      }
    })

  } catch (error) {
    next(error)
  }
})




module.exports = router;