import { checkSchema } from 'express-validator';

export default checkSchema({
  email: {
    trim: true,
    errorMessage: 'Email is required',
    notEmpty: true,
    isEmail: {
      errorMessage: 'Email is not valid'
    }
  },
  firstname: {
    trim: true,
    errorMessage: 'Firstname is required',
    notEmpty: true
  },
  lastname: {
    trim: true,
    errorMessage: 'Lastname is required',
    notEmpty: true
  },
  password: {
    trim: true,
    notEmpty: {
      errorMessage: 'Password is required'
    },
    isLength: {
      options: { min: 8, max: 20 },
      errorMessage: 'Password should be at least 8 chars & at most 20 chars'
    }
  }
});
