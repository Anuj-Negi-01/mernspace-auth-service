import { checkSchema } from 'express-validator';

export default checkSchema({
  email: {
    trim: true,
    errorMessage: 'Email is required',
    notEmpty: true
  }
});
