const Joi = require("joi");

const validateCreateFriendRequest = (data) => {
  const schema = Joi.object({
    receiverUserId: Joi.string().required(),
    message: Joi.string().trim().max(280).allow("").default(""),
  });

  return schema.validate(data);
};

module.exports = { validateCreateFriendRequest };
